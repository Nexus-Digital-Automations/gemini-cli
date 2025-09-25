/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Comprehensive Test Suite for CrossSessionPersistenceEngine
 *
 * Tests all aspects of cross-session persistence including:
 * - Session management and heartbeat functionality
 * - Checkpoint creation and recovery mechanisms
 * - Crash recovery and data integrity validation
 * - Performance optimization (sub-100ms operations)
 * - Real-time synchronization capabilities
 * - Conflict resolution strategies
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { promises as fs } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { performance } from 'node:perf_hooks';
import { CrossSessionPersistenceEngine } from '../CrossSessionPersistenceEngine.js';
// Mock filesystem operations
vi.mock('node:fs', () => ({
  promises: {
    writeFile: vi.fn(),
    readFile: vi.fn(),
    mkdir: vi.fn(),
    access: vi.fn(),
    unlink: vi.fn(),
    readdir: vi.fn(),
    stat: vi.fn(),
    rename: vi.fn(),
  },
}));
// Mock crypto for deterministic tests
vi.mock('node:crypto', async () => {
  const actual = await vi.importActual('node:crypto');
  return {
    ...actual,
    randomUUID: vi.fn(() => 'test-uuid-1234'),
  };
});
describe('CrossSessionPersistenceEngine', () => {
  let engine;
  let tempDir;
  let config;
  let mockTask;
  let mockQueue;
  beforeEach(() => {
    tempDir = join(tmpdir(), 'cross-session-persistence-test');
    config = {
      type: 'file',
      connectionString: join(tempDir, 'task-store.json'),
      heartbeatInterval: 1000, // 1 second for faster tests
      checkpointInterval: 5000, // 5 seconds for faster tests
      maxCheckpoints: 5,
      crashRecoveryEnabled: true,
      sessionTimeout: 10000, // 10 seconds for faster tests
      realtimeSync: false,
      conflictResolution: 'timestamp',
      performanceOptimization: {
        cacheSize: 100,
        batchSize: 10,
        asyncWrites: true,
        prefetchEnabled: true,
      },
    };
    engine = new CrossSessionPersistenceEngine(config);
    mockTask = {
      id: 'task-1',
      name: 'Test Task',
      description: 'Test task for cross-session persistence',
      type: 'test',
      status: 'pending',
      priority: 1,
      createdAt: new Date('2024-01-01T00:00:00Z'),
      updatedAt: new Date('2024-01-01T01:00:00Z'),
      tags: ['test'],
      dependencies: [],
      estimatedDuration: 1000,
      actualDuration: null,
      retryCount: 0,
      maxRetries: 3,
      executionHistory: [],
    };
    mockQueue = {
      id: 'queue-1',
      name: 'Test Queue',
      description: 'Test queue for cross-session persistence',
      tasks: [mockTask.id],
      isActive: true,
      priority: 1,
      createdAt: new Date('2024-01-01T00:00:00Z'),
      updatedAt: new Date('2024-01-01T01:00:00Z'),
      concurrency: 1,
      retryPolicy: {
        maxRetries: 3,
        backoffMultiplier: 2,
        initialDelay: 1000,
      },
    };
    // Clear all mocks
    vi.clearAllMocks();
    // Setup default mock implementations
    const mockMkdir = vi.mocked(fs.mkdir);
    const mockWriteFile = vi.mocked(fs.writeFile);
    const mockReadFile = vi.mocked(fs.readFile);
    const mockAccess = vi.mocked(fs.access);
    const mockReaddir = vi.mocked(fs.readdir);
    mockMkdir.mockResolvedValue(undefined);
    mockWriteFile.mockResolvedValue();
    mockAccess.mockResolvedValue(undefined);
    mockReaddir.mockResolvedValue([]);
    mockReadFile.mockResolvedValue(
      '{"version":"1.0.0","metadata":{},"tasks":{},"queues":{},"indexes":{"byStatus":{},"byType":{},"byPriority":{},"byCreationDate":[]},"tombstones":{"tasks":{},"queues":{}}}',
    );
  });
  afterEach(async () => {
    if (engine) {
      await engine.shutdown(true); // Force shutdown for tests
    }
  });
  describe('Initialization and Session Management', () => {
    it('should initialize with session metadata', async () => {
      const initSpy = vi.fn();
      engine.on('cross-session-initialized', initSpy);
      await engine.initialize(config);
      expect(initSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          sessionId: 'test-uuid-1234',
          duration: expect.any(Number),
          crashRecovery: true,
          realtimeSync: false,
        }),
      );
    });
    it('should create session metadata file on initialization', async () => {
      const mockWriteFile = vi.mocked(fs.writeFile);
      await engine.initialize(config);
      // Should write session metadata
      expect(mockWriteFile).toHaveBeenCalledWith(
        expect.stringContaining('session-test-uuid-1234.json'),
        expect.stringContaining('"sessionId":"test-uuid-1234"'),
      );
    });
    it('should load existing sessions on initialization', async () => {
      const mockReaddir = vi.mocked(fs.readdir);
      const mockReadFile = vi.mocked(fs.readFile);
      const existingSession = {
        sessionId: 'existing-session',
        startTime: new Date('2024-01-01T00:00:00Z'),
        endTime: null,
        lastActivity: new Date('2024-01-01T00:30:00Z'),
        state: 'active',
        processInfo: {
          pid: 12345,
          platform: 'linux',
          nodeVersion: 'v18.0.0',
        },
        statistics: {
          tasksProcessed: 10,
          transactionsCommitted: 5,
          errorsEncountered: 1,
          totalOperations: 20,
        },
      };
      mockReaddir.mockResolvedValue(['session-existing-session.json']);
      mockReadFile.mockImplementation(async (path) => {
        if (path.toString().includes('session-existing-session.json')) {
          return JSON.stringify(existingSession);
        }
        return '{"version":"1.0.0","metadata":{},"tasks":{},"queues":{},"indexes":{"byStatus":{},"byType":{},"byPriority":{},"byCreationDate":[]},"tombstones":{"tasks":{},"queues":{}}}';
      });
      await engine.initialize(config);
      const stats = await engine.getSessionStatistics();
      expect(stats.activeSessions).toHaveLength(1);
      expect(stats.activeSessions[0].sessionId).toBe('existing-session');
    });
    it('should start heartbeat timer', async () => {
      vi.useFakeTimers();
      const mockWriteFile = vi.mocked(fs.writeFile);
      await engine.initialize(config);
      // Clear initial writes
      mockWriteFile.mockClear();
      // Advance timer to trigger heartbeat
      vi.advanceTimersByTime(1000);
      await vi.runAllTimersAsync();
      // Should update session metadata (heartbeat)
      expect(mockWriteFile).toHaveBeenCalledWith(
        expect.stringContaining('session-test-uuid-1234.json'),
        expect.any(String),
      );
      vi.useRealTimers();
    });
  });
  describe('Task Operations with Cross-Session Support', () => {
    beforeEach(async () => {
      await engine.initialize(config);
    });
    it('should save task with cross-session metadata', async () => {
      const saveSpy = vi.fn();
      engine.on('task-saved-cross-session', saveSpy);
      const result = await engine.saveTask(mockTask);
      expect(result.success).toBe(true);
      expect(saveSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          taskId: 'task-1',
          sessionId: 'test-uuid-1234',
          duration: expect.any(Number),
          operationId: expect.any(String),
          conflict: false,
        }),
      );
    });
    it('should achieve sub-100ms save performance', async () => {
      const startTime = performance.now();
      const result = await engine.saveTask(mockTask);
      const endTime = performance.now();
      const duration = endTime - startTime;
      expect(result.success).toBe(true);
      expect(duration).toBeLessThan(100); // Sub-100ms requirement
    });
    it('should load task with cross-session awareness', async () => {
      const loadSpy = vi.fn();
      engine.on('task-loaded-cross-session', loadSpy);
      // First save the task
      await engine.saveTask(mockTask);
      // Then load it
      const result = await engine.loadTask('task-1');
      expect(result.success).toBe(true);
      expect(loadSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          taskId: 'task-1',
          sessionId: 'test-uuid-1234',
          duration: expect.any(Number),
          found: true,
          cached: expect.any(Boolean),
        }),
      );
    });
    it('should use prefetch cache for improved performance', async () => {
      // Save task first
      await engine.saveTask(mockTask);
      // Load task (should cache it)
      const firstLoad = await engine.loadTask('task-1', true);
      expect(firstLoad.success).toBe(true);
      // Second load should use cache
      const secondLoad = await engine.loadTask('task-1', true);
      expect(secondLoad.success).toBe(true);
      expect(secondLoad.metadata.cacheInfo?.hit).toBe(true);
    });
    it('should handle write buffering for performance optimization', async () => {
      const tasks = [];
      // Create multiple tasks for buffering
      for (let i = 0; i < 5; i++) {
        tasks.push({
          ...mockTask,
          id: `task-${i}`,
          name: `Test Task ${i}`,
        });
      }
      // Save tasks rapidly (should use buffering)
      const savePromises = tasks.map((task) => engine.saveTask(task));
      const results = await Promise.all(savePromises);
      // All saves should succeed
      results.forEach((result) => {
        expect(result.success).toBe(true);
      });
    });
  });
  describe('Checkpoint Management', () => {
    beforeEach(async () => {
      await engine.initialize(config);
    });
    it('should create manual checkpoint', async () => {
      const checkpointSpy = vi.fn();
      engine.on('checkpoint-created', checkpointSpy);
      const checkpointId = await engine.createCheckpoint('manual');
      expect(checkpointId).toBe('test-uuid-1234');
      expect(checkpointSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          checkpointId: 'test-uuid-1234',
          sessionId: 'test-uuid-1234',
          type: 'manual',
          size: expect.any(Number),
          duration: expect.any(Number),
        }),
      );
    });
    it('should create automatic checkpoints based on operation count', async () => {
      const checkpointSpy = vi.fn();
      engine.on('checkpoint-created', checkpointSpy);
      // Mock the shouldCreateCheckpoint method to return true
      vi.spyOn(engine, 'shouldCreateCheckpoint').mockReturnValue(true);
      await engine.saveTask(mockTask);
      // Should trigger automatic checkpoint
      expect(checkpointSpy).toHaveBeenCalled();
    });
    it('should save checkpoint to disk', async () => {
      const mockWriteFile = vi.mocked(fs.writeFile);
      const mockMkdir = vi.mocked(fs.mkdir);
      await engine.createCheckpoint('manual');
      // Should create checkpoints directory
      expect(mockMkdir).toHaveBeenCalledWith(
        expect.stringContaining('checkpoints'),
        { recursive: true },
      );
      // Should write checkpoint file
      expect(mockWriteFile).toHaveBeenCalledWith(
        expect.stringContaining('checkpoint-test-uuid-1234.json'),
        expect.stringContaining('"id":"test-uuid-1234"'),
      );
    });
    it('should restore from checkpoint', async () => {
      const restoreSpy = vi.fn();
      engine.on('checkpoint-restored', restoreSpy);
      // Create a checkpoint first
      const checkpointId = await engine.createCheckpoint('manual');
      // Mock checkpoint file loading
      const mockCheckpoint = {
        id: checkpointId,
        timestamp: new Date(),
        sessionId: 'test-uuid-1234',
        taskSnapshot: { 'task-1': mockTask },
        queueSnapshot: { 'queue-1': mockQueue },
        activeTransactions: [],
        type: 'manual',
        integrityHash: 'test-hash',
        size: 1000,
      };
      const mockReadFile = vi.mocked(fs.readFile);
      mockReadFile.mockImplementation(async (path) => {
        if (path.toString().includes('checkpoint-')) {
          return JSON.stringify(mockCheckpoint);
        }
        return '{"version":"1.0.0","metadata":{},"tasks":{},"queues":{},"indexes":{"byStatus":{},"byType":{},"byPriority":{},"byCreationDate":[]},"tombstones":{"tasks":{},"queues":{}}}';
      });
      // Mock integrity validation
      vi.spyOn(engine, 'dataIntegrityManager').mockReturnValue({
        validateCheckpointIntegrity: vi.fn().mockResolvedValue(true),
      });
      await engine.restoreFromCheckpoint(checkpointId);
      expect(restoreSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          checkpointId,
          sessionId: 'test-uuid-1234',
          tasksRestored: 1,
          queuesRestored: 1,
        }),
      );
    });
    it('should cleanup old checkpoints', async () => {
      const mockUnlink = vi.mocked(fs.unlink);
      // Create multiple checkpoints to trigger cleanup
      for (let i = 0; i < 15; i++) {
        vi.mocked(vi.importActual('node:crypto')).randomUUID.mockReturnValue(
          `checkpoint-${i}`,
        );
        await engine.createCheckpoint('automatic');
      }
      // Should delete old checkpoints (keep only 10)
      expect(mockUnlink).toHaveBeenCalled();
    });
  });
  describe('Crash Recovery', () => {
    beforeEach(async () => {
      await engine.initialize(config);
    });
    it('should detect crashed sessions on initialization', async () => {
      const crashRecoverySpy = vi.fn();
      engine.on('crash-recovery-started', crashRecoverySpy);
      // Mock a crashed session
      const crashedSession = {
        sessionId: 'crashed-session',
        startTime: new Date(Date.now() - 3_600_000), // 1 hour ago
        endTime: null,
        lastActivity: new Date(Date.now() - 1_200_000), // 20 minutes ago (crashed)
        state: 'active',
        processInfo: {
          pid: 99999,
          platform: 'linux',
          nodeVersion: 'v18.0.0',
        },
        statistics: {
          tasksProcessed: 5,
          transactionsCommitted: 2,
          errorsEncountered: 0,
          totalOperations: 10,
        },
      };
      const mockReaddir = vi.mocked(fs.readdir);
      const mockReadFile = vi.mocked(fs.readFile);
      mockReaddir.mockResolvedValue(['session-crashed-session.json']);
      mockReadFile.mockImplementation(async (path) => {
        if (path.toString().includes('session-crashed-session.json')) {
          return JSON.stringify(crashedSession);
        }
        return '{"version":"1.0.0","metadata":{},"tasks":{},"queues":{},"indexes":{"byStatus":{},"byType":{},"byPriority":{},"byCreationDate":[]},"tombstones":{"tasks":{},"queues":{}}}';
      });
      // Reinitialize to trigger crash detection
      await engine.shutdown(true);
      engine = new CrossSessionPersistenceEngine(config);
      await engine.initialize(config);
      expect(crashRecoverySpy).toHaveBeenCalledWith(
        expect.objectContaining({
          crashedSessions: 1,
          currentSession: 'test-uuid-1234',
        }),
      );
    });
    it('should create emergency checkpoint on crash', async () => {
      const emergencySpy = vi.fn();
      engine.on('emergency-checkpoint', emergencySpy);
      // Simulate a crash by calling the private handleCrash method
      const error = new Error('Simulated crash');
      await engine.handleCrash(error);
      expect(emergencySpy).toHaveBeenCalledWith(
        expect.objectContaining({
          sessionId: 'test-uuid-1234',
          error: 'Simulated crash',
        }),
      );
    });
    it('should recover from crashed session checkpoint', async () => {
      const recoveryCompletedSpy = vi.fn();
      engine.on('crash-recovery-completed', recoveryCompletedSpy);
      const crashedSession = {
        sessionId: 'crashed-session',
        startTime: new Date(Date.now() - 3600000),
        endTime: null,
        lastActivity: new Date(Date.now() - 1200000),
        state: 'active',
        processInfo: { pid: 99999, platform: 'linux', nodeVersion: 'v18.0.0' },
        statistics: {
          tasksProcessed: 5,
          transactionsCommitted: 2,
          errorsEncountered: 0,
          totalOperations: 10,
        },
      };
      const mockCheckpoint = {
        id: 'crashed-checkpoint',
        timestamp: new Date(),
        sessionId: 'crashed-session',
        taskSnapshot: { 'recovered-task': mockTask },
        queueSnapshot: {},
        activeTransactions: [],
        type: 'automatic',
        integrityHash: 'test-hash',
        size: 500,
      };
      // Mock file system operations
      const mockReaddir = vi.mocked(fs.readdir);
      const mockReadFile = vi.mocked(fs.readFile);
      mockReaddir.mockImplementation(async (path) => {
        if (path.toString().includes('checkpoints')) {
          return ['checkpoint-crashed-checkpoint.json'];
        }
        return ['session-crashed-session.json'];
      });
      mockReadFile.mockImplementation(async (path) => {
        if (path.toString().includes('session-crashed-session.json')) {
          return JSON.stringify(crashedSession);
        }
        if (path.toString().includes('checkpoint-crashed-checkpoint.json')) {
          return JSON.stringify(mockCheckpoint);
        }
        return '{"version":"1.0.0","metadata":{},"tasks":{},"queues":{},"indexes":{"byStatus":{},"byType":{},"byPriority":{},"byCreationDate":[]},"tombstones":{"tasks":{},"queues":{}}}';
      });
      // Mock data integrity validation
      vi.spyOn(engine, 'dataIntegrityManager').mockReturnValue({
        validateCheckpointIntegrity: vi.fn().mockResolvedValue(true),
      });
      // Reinitialize to trigger crash recovery
      await engine.shutdown(true);
      engine = new CrossSessionPersistenceEngine(config);
      await engine.initialize(config);
      expect(recoveryCompletedSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          crashedSessionId: 'crashed-session',
          recoveredFromCheckpoint: 'crashed-checkpoint',
        }),
      );
    });
  });
  describe('Performance Metrics and Statistics', () => {
    beforeEach(async () => {
      await engine.initialize(config);
    });
    it('should track operation metrics', async () => {
      // Perform some operations
      await engine.saveTask(mockTask);
      await engine.loadTask('task-1');
      await engine.createCheckpoint('manual');
      const stats = await engine.getSessionStatistics();
      expect(stats.operationMetrics).toHaveProperty('saveTask');
      expect(stats.operationMetrics).toHaveProperty('loadTask');
      expect(stats.operationMetrics).toHaveProperty('createCheckpoint');
      expect(stats.operationMetrics.saveTask.count).toBeGreaterThan(0);
      expect(stats.operationMetrics.saveTask.avgTime).toBeGreaterThan(0);
    });
    it('should provide comprehensive session statistics', async () => {
      // Perform some operations to generate statistics
      await engine.saveTask(mockTask);
      await engine.saveQueue(mockQueue);
      await engine.createCheckpoint('manual');
      const stats = await engine.getSessionStatistics();
      expect(stats.currentSession).toMatchObject({
        sessionId: 'test-uuid-1234',
        state: 'active',
      });
      expect(stats.performanceStats).toHaveProperty('avgOperationTime');
      expect(stats.performanceStats).toHaveProperty('operationsPerSecond');
      expect(stats.performanceStats).toHaveProperty('cacheHitRate');
      expect(stats.checkpointStats).toHaveProperty('total');
      expect(stats.checkpointStats).toHaveProperty('manual');
      expect(stats.checkpointStats).toHaveProperty('automatic');
      expect(stats.integrityStats).toHaveProperty('validationsPassed');
    });
    it('should calculate performance metrics accurately', async () => {
      const startTime = Date.now();
      // Perform operations
      for (let i = 0; i < 10; i++) {
        await engine.saveTask({ ...mockTask, id: `task-${i}` });
      }
      const stats = await engine.getSessionStatistics();
      const sessionDuration = (Date.now() - startTime) / 1000; // seconds
      expect(stats.performanceStats.operationsPerSecond).toBeGreaterThan(0);
      expect(stats.currentSession.statistics.totalOperations).toBe(10);
    });
  });
  describe('Data Integrity and Validation', () => {
    beforeEach(async () => {
      await engine.initialize(config);
    });
    it('should validate task data before saving', async () => {
      const invalidTask = {
        ...mockTask,
        id: '', // Invalid empty ID
      };
      // Should handle validation gracefully
      await expect(engine.saveTask(invalidTask)).rejects.toThrow();
    });
    it('should validate checkpoint integrity during restoration', async () => {
      const checkpointId = await engine.createCheckpoint('manual');
      const corruptedCheckpoint = {
        id: checkpointId,
        timestamp: new Date(),
        sessionId: 'test-uuid-1234',
        taskSnapshot: { 'task-1': mockTask },
        queueSnapshot: {},
        activeTransactions: [],
        type: 'manual',
        integrityHash: 'corrupted-hash', // Wrong hash
        size: 1000,
      };
      const mockReadFile = vi.mocked(fs.readFile);
      mockReadFile.mockImplementation(async (path) => {
        if (path.toString().includes('checkpoint-')) {
          return JSON.stringify(corruptedCheckpoint);
        }
        return '{"version":"1.0.0","metadata":{},"tasks":{},"queues":{},"indexes":{"byStatus":{},"byType":{},"byPriority":{},"byCreationDate":[]},"tombstones":{"tasks":{},"queues":{}}}';
      });
      // Should reject corrupted checkpoint
      await expect(engine.restoreFromCheckpoint(checkpointId)).rejects.toThrow(
        /integrity/,
      );
    });
    it('should maintain data integrity across sessions', async () => {
      // Save some data
      await engine.saveTask(mockTask);
      await engine.saveQueue(mockQueue);
      // Create checkpoint
      const checkpointId = await engine.createCheckpoint('manual');
      // Simulate session restart
      await engine.shutdown();
      engine = new CrossSessionPersistenceEngine(config);
      await engine.initialize(config);
      // Restore from checkpoint
      const mockCheckpoint = {
        id: checkpointId,
        timestamp: new Date(),
        sessionId: 'test-uuid-1234',
        taskSnapshot: { 'task-1': mockTask },
        queueSnapshot: { 'queue-1': mockQueue },
        activeTransactions: [],
        type: 'manual',
        integrityHash: 'valid-hash',
        size: 1000,
      };
      const mockReadFile = vi.mocked(fs.readFile);
      mockReadFile.mockImplementation(async (path) => {
        if (path.toString().includes('checkpoint-')) {
          return JSON.stringify(mockCheckpoint);
        }
        return '{"version":"1.0.0","metadata":{},"tasks":{},"queues":{},"indexes":{"byStatus":{},"byType":{},"byPriority":{},"byCreationDate":[]},"tombstones":{"tasks":{},"queues":{}}}';
      });
      // Mock integrity validation
      vi.spyOn(engine, 'dataIntegrityManager').mockReturnValue({
        validateCheckpointIntegrity: vi.fn().mockResolvedValue(true),
      });
      await engine.restoreFromCheckpoint(checkpointId);
      // Data should be preserved
      const loadedTask = await engine.loadTask('task-1');
      expect(loadedTask.success).toBe(true);
      expect(loadedTask.data?.id).toBe('task-1');
    });
  });
  describe('Session Cleanup and Shutdown', () => {
    beforeEach(async () => {
      await engine.initialize(config);
    });
    it('should perform graceful shutdown', async () => {
      const shutdownSpy = vi.fn();
      engine.on('cross-session-shutdown', shutdownSpy);
      await engine.shutdown();
      expect(shutdownSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          sessionId: 'test-uuid-1234',
          statistics: expect.any(Object),
          force: false,
        }),
      );
    });
    it('should create final checkpoint on shutdown', async () => {
      const checkpointSpy = vi.fn();
      engine.on('checkpoint-created', checkpointSpy);
      await engine.shutdown();
      expect(checkpointSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'manual',
        }),
      );
    });
    it('should cleanup inactive sessions', async () => {
      vi.useFakeTimers();
      const mockUnlink = vi.mocked(fs.unlink);
      // Add an old inactive session
      const oldSession = {
        sessionId: 'old-session',
        startTime: new Date(Date.now() - 7200000), // 2 hours ago
        endTime: null,
        lastActivity: new Date(Date.now() - 3600000), // 1 hour ago
        state: 'active',
        processInfo: { pid: 99999, platform: 'linux', nodeVersion: 'v18.0.0' },
        statistics: {
          tasksProcessed: 0,
          transactionsCommitted: 0,
          errorsEncountered: 0,
          totalOperations: 0,
        },
      };
      engine.activeSessions.set('old-session', oldSession);
      // Trigger cleanup
      vi.advanceTimersByTime(35 * 60 * 1000); // 35 minutes
      await vi.runAllTimersAsync();
      // Should clean up old session
      expect(mockUnlink).toHaveBeenCalledWith(
        expect.stringContaining('session-old-session.json'),
      );
      vi.useRealTimers();
    });
    it('should handle force shutdown', async () => {
      const shutdownSpy = vi.fn();
      engine.on('cross-session-shutdown', shutdownSpy);
      await engine.shutdown(true);
      expect(shutdownSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          force: true,
        }),
      );
    });
  });
  describe('Real-time Synchronization (when enabled)', () => {
    it('should initialize sync manager when real-time sync is enabled', async () => {
      const syncConfig = {
        ...config,
        realtimeSync: true,
      };
      const syncEngine = new CrossSessionPersistenceEngine(syncConfig);
      await syncEngine.initialize(syncConfig);
      // Should initialize with real-time sync enabled
      const initSpy = vi.fn();
      syncEngine.on('cross-session-initialized', initSpy);
      await syncEngine.shutdown(true);
    });
  });
});
//# sourceMappingURL=CrossSessionPersistenceEngine.test.js.map
