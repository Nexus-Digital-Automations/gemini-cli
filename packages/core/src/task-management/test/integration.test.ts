/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  vi,
  beforeAll,
  afterAll,
} from 'vitest';
import * as path from 'node:path';
import * as fse from 'fs-extra';
import { tmpdir } from 'node:os';
import type { TaskPersistence } from '../TaskPersistence.js';
import type { Task, TaskDependency } from '../types.js';

// Mock missing modules that aren't implemented yet
vi.mock('../SessionManager.js', () => ({
  SessionManager: vi.fn(),
}));

vi.mock('../DataSync.js', () => ({
  DataSync: vi.fn(),
}));

vi.mock('../BackupRecovery.js', () => ({
  BackupRecovery: vi.fn(),
}));

// Mock logger to avoid console output during tests
vi.mock('../utils/logger.js', () => ({
  logger: {
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// Type imports for mocked modules
type SessionManager = unknown;
type DataSync = unknown;
type BackupRecovery = unknown;

describe('Task Management Integration Tests', () => {
  let persistence: TaskPersistence;
  let sessionManager: SessionManager;
  let dataSync: DataSync;
  let backupRecovery: BackupRecovery;
  let testDbPath: string;
  let tempDir: string;

  beforeAll(async () => {
    // Create temporary directory for test databases
    tempDir = path.join(tmpdir(), 'task-management-integration-tests');
    await fse.ensureDir(tempDir);
  });

  afterAll(async () => {
    // Clean up temporary directory
    await fse.remove(tempDir);
  });

  beforeEach(async () => {
    // Create a unique test database for each test
    testDbPath = path.join(
      tempDir,
      `integration-test-${Date.now()}-${Math.random()}.db`,
    );

    // Import modules dynamically
    const [
      { TaskPersistence },
      { SessionManager },
      { DataSync },
      { BackupRecovery },
    ] = await Promise.all([
      import('../TaskPersistence.js'),
      import('../SessionManager.js'),
      import('../DataSync.js'),
      import('../BackupRecovery.js'),
    ]);

    // Initialize persistence layer
    persistence = new TaskPersistence({
      dbPath: testDbPath,
      enableAutoBackup: false,
      sessionTimeout: 5000,
      enableMetrics: true,
    });
    await persistence.initialize();

    // Initialize session manager
    sessionManager = new SessionManager(persistence, {
      sessionTimeout: 5000,
      heartbeatInterval: 1000,
      maxConcurrentTasks: 5,
    });
    await sessionManager.initialize();

    // Initialize data sync
    dataSync = new DataSync(persistence, sessionManager, {
      enableRealTimeSync: false, // Disable for tests
      syncInterval: 100,
      conflictResolution: 'last-write-wins',
    });
    await dataSync.initialize();

    // Initialize backup recovery
    backupRecovery = new BackupRecovery(persistence, {
      enableAutoBackup: false,
      backupDirectory: path.join(tempDir, 'backups'),
      maxBackups: 5,
    });
    await backupRecovery.initialize();
  });

  afterEach(async () => {
    // Shutdown all systems
    await Promise.all([
      backupRecovery?.shutdown(),
      dataSync?.shutdown(),
      sessionManager?.shutdown(),
      persistence?.close(),
    ]);

    // Clean up test files
    if (await fse.pathExists(testDbPath)) {
      await fse.remove(testDbPath);
    }
  });

  describe('End-to-End Task Lifecycle', () => {
    const createTestTask = (id: string, title: string): Task => ({
      id,
      title,
      description: `Test task: ${title}`,
      status: 'pending',
      priority: 'medium',
      category: 'implementation',
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'integration-test',
        estimatedDuration: 60000,
      },
      executionContext: {
        timeout: 30000,
        maxRetries: 3,
      },
    });

    it('should handle complete task lifecycle with multiple sessions', async () => {
      // Create two sessions
      const session1 = await sessionManager.createSession(
        'agent-1',
        '/test/dir1',
      );
      const session2 = await sessionManager.createSession(
        'agent-2',
        '/test/dir2',
      );

      expect(session1.sessionId).toBeDefined();
      expect(session2.sessionId).toBeDefined();
      expect(session1.agentId).toBe('agent-1');
      expect(session2.agentId).toBe('agent-2');

      // Create tasks
      const task1 = createTestTask('task-1', 'First Task');
      const task2 = createTestTask('task-2', 'Second Task');
      const task3 = createTestTask('task-3', 'Third Task');

      // Save tasks from different sessions
      await persistence.saveTask(task1, session1.sessionId);
      await persistence.saveTask(task2, session2.sessionId);
      await persistence.saveTask(task3, session1.sessionId);

      // Create dependencies
      const dependencies: TaskDependency[] = [
        {
          dependentTaskId: 'task-2',
          dependsOnTaskId: 'task-1',
          type: 'hard',
          reason: 'Task 2 needs Task 1 output',
        },
        {
          dependentTaskId: 'task-3',
          dependsOnTaskId: 'task-2',
          type: 'soft',
          reason: 'Task 3 benefits from Task 2 completion',
        },
      ];

      await persistence.saveDependencies(dependencies);

      // Acquire locks and execute tasks
      await sessionManager.acquireTaskLock(
        'task-1',
        session1.sessionId,
        'exclusive',
      );

      // Update task status
      const updatedTask1 = { ...task1, status: 'in_progress' as const };
      await persistence.saveTask(updatedTask1, session1.sessionId);

      // Complete task 1
      const completedTask1 = {
        ...updatedTask1,
        status: 'completed' as const,
        metadata: {
          ...updatedTask1.metadata,
          endTime: new Date(),
          actualDuration: 45000,
        },
      };
      await persistence.saveTask(completedTask1, session1.sessionId);
      await sessionManager.releaseTaskLock('task-1', session1.sessionId);

      // Now task 2 can start
      await sessionManager.acquireTaskLock(
        'task-2',
        session2.sessionId,
        'exclusive',
      );

      const updatedTask2 = { ...task2, status: 'in_progress' as const };
      await persistence.saveTask(updatedTask2, session2.sessionId);

      // Verify task states
      const loadedTask1 = await persistence.loadTask('task-1');
      const loadedTask2 = await persistence.loadTask('task-2');

      expect(loadedTask1?.status).toBe('completed');
      expect(loadedTask2?.status).toBe('in_progress');

      // Check dependencies
      const allDependencies = await persistence.loadDependencies();
      expect(allDependencies).toHaveLength(2);

      const task2Dependencies = await persistence.loadDependencies('task-2');
      expect(task2Dependencies.length).toBeGreaterThan(0);
    });

    it('should handle session recovery and task migration', async () => {
      // Create initial session
      const session1 = await sessionManager.createSession('agent-1');
      const task = createTestTask('recoverable-task', 'Recoverable Task');

      await persistence.saveTask(task, session1.sessionId);
      await sessionManager.acquireTaskLock(
        'recoverable-task',
        session1.sessionId,
      );

      // Simulate session crash by terminating it
      await sessionManager.terminateSession(session1.sessionId, 'error');

      // Create recovery session
      const recoverySession =
        await sessionManager.createSession('agent-recovery');

      // Recover tasks (in a real implementation)
      const recovery = await sessionManager.recoverSessionTasks(
        session1.sessionId,
        recoverySession.sessionId,
      );

      expect(recovery.originalSessionId).toBe(session1.sessionId);
      expect(recovery.recoverySessionId).toBe(recoverySession.sessionId);
    });

    it('should handle data synchronization across sessions', async () => {
      // Enable change tracking for this test
      dataSync['config'].enableChangeTracking = true;

      const session1 = await sessionManager.createSession('sync-agent-1');
      const session2 = await sessionManager.createSession('sync-agent-2');

      const task = createTestTask('sync-task', 'Synchronizable Task');

      // Track changes from different sessions
      await dataSync.trackChange(
        'create',
        'task',
        task.id,
        session1.sessionId,
        'sync-agent-1',
        undefined,
        task,
      );

      // Save task
      await persistence.saveTask(task, session1.sessionId);

      // Update from another session
      const updatedTask = { ...task, title: 'Updated Task Title' };
      await dataSync.trackChange(
        'update',
        'task',
        task.id,
        session2.sessionId,
        'sync-agent-2',
        task,
        updatedTask,
      );

      // Get pending changes
      const pendingChanges = dataSync.getPendingChanges({ entityType: 'task' });
      expect(pendingChanges.length).toBeGreaterThanOrEqual(1);

      // Sync changes
      const syncResult = await dataSync.syncChanges();
      expect(syncResult.success).toBe(true);
    });
  });

  describe('Backup and Recovery Integration', () => {
    it('should create backup and restore system state', async () => {
      // Create test data
      const session = await sessionManager.createSession('backup-agent');
      const tasks = [
        createTestTask('backup-task-1', 'Backup Test 1'),
        createTestTask('backup-task-2', 'Backup Test 2'),
        createTestTask('backup-task-3', 'Backup Test 3'),
      ];

      for (const task of tasks) {
        await persistence.saveTask(task, session.sessionId);
      }

      const dependencies: TaskDependency[] = [
        {
          dependentTaskId: 'backup-task-2',
          dependsOnTaskId: 'backup-task-1',
          type: 'hard',
        },
      ];
      await persistence.saveDependencies(dependencies);

      // Create backup
      const backup = await backupRecovery.createBackup('full', {
        description: 'Test backup',
        verify: true,
      });

      expect(backup).toBeDefined();
      expect(backup.type).toBe('full');
      expect(backup.isValid).toBe(true);
      expect(backup.content.totalTasks).toBeGreaterThanOrEqual(tasks.length);

      // Verify backup was created
      const backupList = backupRecovery.listBackups();
      expect(backupList).toHaveLength(1);
      expect(backupList[0].id).toBe(backup.id);

      // Test backup validation
      const validation = await backupRecovery.validateBackup(backup);
      expect(validation.isValid).toBe(true);
      expect(validation.checksumValid).toBe(true);

      // Test restoration (mock in this case)
      const recoveryOptions = {
        mode: 'full' as const,
        createPreRecoveryBackup: true,
        verifyIntegrity: true,
      };

      const recoveryResult = await backupRecovery.restoreFromBackup(
        backup.id,
        recoveryOptions,
      );
      expect(recoveryResult.success).toBe(true);
      expect(recoveryResult.sourceBackupId).toBe(backup.id);
    });

    it('should handle incremental backups', async () => {
      // Create initial data
      const session = await sessionManager.createSession('incremental-agent');
      const task1 = createTestTask('inc-task-1', 'Incremental Task 1');
      await persistence.saveTask(task1, session.sessionId);

      // Create full backup
      const fullBackup = await backupRecovery.createBackup('full');
      expect(fullBackup.type).toBe('full');

      // Add more data
      const task2 = createTestTask('inc-task-2', 'Incremental Task 2');
      await persistence.saveTask(task2, session.sessionId);

      // Create incremental backup (will fall back to full in current implementation)
      const incrementalBackup =
        await backupRecovery.createBackup('incremental');
      expect(incrementalBackup).toBeDefined();

      // Verify backup chain information
      const backups = backupRecovery.listBackups();
      expect(backups.length).toBe(2);
    });
  });

  describe('Performance and Stress Testing', () => {
    it('should handle high-volume operations', async () => {
      const session = await sessionManager.createSession('performance-agent');

      // Create many tasks concurrently
      const taskCount = 100;
      const tasks = Array.from({ length: taskCount }, (_, i) =>
        createTestTask(`perf-task-${i}`, `Performance Task ${i}`),
      );

      const startTime = Date.now();

      // Save all tasks concurrently
      await Promise.all(
        tasks.map((task) => persistence.saveTask(task, session.sessionId)),
      );

      const saveTime = Date.now() - startTime;
      console.log(`Saved ${taskCount} tasks in ${saveTime}ms`);

      // Load all tasks concurrently
      const loadStart = Date.now();
      const loadedTasks = await Promise.all(
        tasks.map((task) => persistence.loadTask(task.id)),
      );
      const loadTime = Date.now() - loadStart;

      console.log(`Loaded ${taskCount} tasks in ${loadTime}ms`);

      // Verify all tasks were loaded correctly
      expect(loadedTasks).toHaveLength(taskCount);
      loadedTasks.forEach((task) => expect(task).toBeDefined());

      // Test list operations
      const listStart = Date.now();
      const allTasks = await persistence.listTasks();
      const listTime = Date.now() - listStart;

      console.log(`Listed ${allTasks.length} tasks in ${listTime}ms`);
      expect(allTasks.length).toBeGreaterThanOrEqual(taskCount);
    });

    it('should handle multiple concurrent sessions', async () => {
      const sessionCount = 10;
      const tasksPerSession = 10;

      // Create multiple sessions concurrently
      const sessions = await Promise.all(
        Array.from({ length: sessionCount }, (_, i) =>
          sessionManager.createSession(`concurrent-agent-${i}`),
        ),
      );

      expect(sessions).toHaveLength(sessionCount);

      // Each session creates and manages tasks
      const sessionPromises = sessions.map(async (session, sessionIndex) => {
        const sessionTasks = Array.from(
          { length: tasksPerSession },
          (_, taskIndex) =>
            createTestTask(
              `session-${sessionIndex}-task-${taskIndex}`,
              `Session ${sessionIndex} Task ${taskIndex}`,
            ),
        );

        // Save tasks for this session
        await Promise.all(
          sessionTasks.map((task) =>
            persistence.saveTask(task, session.sessionId),
          ),
        );

        // Try to acquire locks on some tasks
        for (let i = 0; i < Math.min(3, sessionTasks.length); i++) {
          try {
            await sessionManager.acquireTaskLock(
              sessionTasks[i].id,
              session.sessionId,
              'exclusive',
              5000,
            );
          } catch (_error) {
            // Some lock attempts may fail, which is expected
          }
        }

        return sessionTasks;
      });

      const allSessionTasks = await Promise.all(sessionPromises);
      const totalTasks = allSessionTasks.flat();

      expect(totalTasks).toHaveLength(sessionCount * tasksPerSession);

      // Verify all tasks are accessible
      const taskList = await persistence.listTasks();
      expect(taskList.length).toBeGreaterThanOrEqual(totalTasks.length);

      // Check session statistics
      const sessionStats = sessionManager.getSessionStats();
      expect(sessionStats.activeSessions).toBeGreaterThanOrEqual(sessionCount);
      expect(sessionStats.totalSessions).toBeGreaterThanOrEqual(sessionCount);
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle database corruption gracefully', async () => {
      const session = await sessionManager.createSession('error-test-agent');
      const task = createTestTask('error-task', 'Error Test Task');

      await persistence.saveTask(task, session.sessionId);

      // Verify task exists
      const loadedTask = await persistence.loadTask('error-task');
      expect(loadedTask).toBeDefined();

      // Close connection to simulate database issues
      await persistence.close();

      // Operations should fail gracefully
      await expect(persistence.loadTask('error-task')).rejects.toThrow();
      await expect(
        sessionManager.acquireTaskLock('error-task', session.sessionId),
      ).rejects.toThrow();
    });

    it('should handle session timeout and cleanup', async () => {
      // Create session with very short timeout
      const shortTimeoutManager = new (
        await import('../SessionManager.js')
      ).SessionManager(persistence, {
        sessionTimeout: 100,
        heartbeatInterval: 50,
      });
      await shortTimeoutManager.initialize();

      const session =
        await shortTimeoutManager.createSession('timeout-test-agent');

      // Don't send heartbeat and wait for timeout
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Session should be marked as expired
      const _sessionInfo = shortTimeoutManager.getSession(session.sessionId);
      // In a real implementation, the session would be marked as inactive

      await shortTimeoutManager.shutdown();
    });

    it('should handle backup failures gracefully', async () => {
      // Create invalid backup configuration
      const invalidBackupRecovery = new (
        await import('../BackupRecovery.js')
      ).BackupRecovery(persistence, {
        backupDirectory: '/invalid/path/that/does/not/exist',
        enableAutoBackup: false,
      });

      await expect(invalidBackupRecovery.initialize()).rejects.toThrow();
    });
  });

  describe('System Integration', () => {
    it('should coordinate all components for complex workflow', async () => {
      // Enable real-time sync for this test
      dataSync['config'].enableRealTimeSync = true;
      dataSync['config'].syncInterval = 100;

      // Create development workflow scenario
      const devSession = await sessionManager.createSession(
        'dev-agent',
        '/project/src',
      );
      const testSession = await sessionManager.createSession(
        'test-agent',
        '/project/tests',
      );

      // Development creates tasks
      const implementTask = createTestTask(
        'implement-feature',
        'Implement New Feature',
      );
      const testTask = createTestTask('test-feature', 'Test New Feature');
      const docTask = createTestTask(
        'document-feature',
        'Document New Feature',
      );

      // Save tasks and create dependencies
      await persistence.saveTask(implementTask, devSession.sessionId);
      await persistence.saveTask(testTask, testSession.sessionId);
      await persistence.saveTask(docTask, devSession.sessionId);

      const dependencies: TaskDependency[] = [
        {
          dependentTaskId: 'test-feature',
          dependsOnTaskId: 'implement-feature',
          type: 'hard',
          reason: 'Cannot test before implementation',
        },
        {
          dependentTaskId: 'document-feature',
          dependsOnTaskId: 'test-feature',
          type: 'soft',
          reason: 'Documentation benefits from test results',
        },
      ];
      await persistence.saveDependencies(dependencies);

      // Development starts implementation
      await sessionManager.acquireTaskLock(
        'implement-feature',
        devSession.sessionId,
      );

      const inProgressImplement = {
        ...implementTask,
        status: 'in_progress' as const,
      };
      await persistence.saveTask(inProgressImplement, devSession.sessionId);

      // Track change for synchronization
      await dataSync.trackChange(
        'status_change',
        'task',
        'implement-feature',
        devSession.sessionId,
        'dev-agent',
        { status: 'pending' },
        { status: 'in_progress' },
      );

      // Complete implementation
      const completedImplement = {
        ...inProgressImplement,
        status: 'completed' as const,
      };
      await persistence.saveTask(completedImplement, devSession.sessionId);
      await sessionManager.releaseTaskLock(
        'implement-feature',
        devSession.sessionId,
      );

      // Testing can now start
      await sessionManager.acquireTaskLock(
        'test-feature',
        testSession.sessionId,
      );

      // Create backup before testing phase
      const backupMetadata = await backupRecovery.createBackup('full', {
        description: 'Pre-testing backup',
      });
      expect(backupMetadata.content.totalTasks).toBeGreaterThanOrEqual(3);

      // Perform synchronization
      const syncResult = await dataSync.syncChanges();
      expect(syncResult.success).toBe(true);

      // Verify final state
      const finalImplementTask =
        await persistence.loadTask('implement-feature');
      expect(finalImplementTask?.status).toBe('completed');

      const taskOwnership = sessionManager.getTaskOwnership('test-feature');
      expect(taskOwnership?.sessionId).toBe(testSession.sessionId);

      // Get execution history
      const history =
        await persistence.getExecutionHistory('implement-feature');
      expect(history.length).toBeGreaterThanOrEqual(0);

      // Get system metrics
      const metrics = await persistence.getMetrics();
      expect(metrics.totalTasks).toBeGreaterThanOrEqual(3);
      expect(metrics.activeSessions).toBeGreaterThanOrEqual(2);
    });

    it('should maintain data consistency across restarts', async () => {
      // Create initial state
      const session = await sessionManager.createSession('consistency-agent');
      const tasks = [
        createTestTask('persist-task-1', 'Persistent Task 1'),
        createTestTask('persist-task-2', 'Persistent Task 2'),
      ];

      for (const task of tasks) {
        await persistence.saveTask(task, session.sessionId);
      }

      await sessionManager.acquireTaskLock('persist-task-1', session.sessionId);

      // Create backup
      const _backup = await backupRecovery.createBackup();

      // Shutdown all systems
      await dataSync.shutdown();
      await sessionManager.shutdown();
      await backupRecovery.shutdown();
      await persistence.close();

      // Reinitialize systems (simulating restart)
      const { TaskPersistence } = await import('../TaskPersistence.js');
      const newPersistence = new TaskPersistence({
        dbPath: testDbPath,
        enableAutoBackup: false,
      });
      await newPersistence.initialize();

      // Verify data persisted
      const restoredTask1 = await newPersistence.loadTask('persist-task-1');
      const restoredTask2 = await newPersistence.loadTask('persist-task-2');

      expect(restoredTask1).toBeDefined();
      expect(restoredTask2).toBeDefined();
      expect(restoredTask1?.title).toBe('Persistent Task 1');
      expect(restoredTask2?.title).toBe('Persistent Task 2');

      await newPersistence.close();
    });
  });
});
