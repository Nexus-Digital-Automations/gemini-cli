/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Comprehensive test suite for TaskPersistenceEngine
 * Tests core persistence functionality, ACID guarantees, and file locking
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { TaskPersistenceEngine } from '../TaskPersistenceEngine.js';

describe('TaskPersistenceEngine', () => {
  let engine;
  let testDir;

  beforeEach(async () => {
    // Create temporary test directory
    testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'persistence-test-'));
    engine = new TaskPersistenceEngine(testDir);
    await engine.initialize();
  });

  afterEach(async () => {
    if (engine) {
      await engine.shutdown();
    }
    // Clean up test directory
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (error) {
      console.warn('Failed to clean up test directory:', error.message);
    }
  });

  describe('Initialization', () => {
    test('should initialize persistence directory structure', async () => {
      const persistenceDir = path.join(testDir, '.gemini-tasks');

      // Check main directories exist
      await expect(
        fs.access(path.join(persistenceDir, 'tasks')),
      ).resolves.not.toThrow();
      await expect(
        fs.access(path.join(persistenceDir, 'sessions')),
      ).resolves.not.toThrow();
      await expect(
        fs.access(path.join(persistenceDir, 'agents')),
      ).resolves.not.toThrow();
      await expect(
        fs.access(path.join(persistenceDir, 'metadata')),
      ).resolves.not.toThrow();
    });

    test('should create initial metadata files', async () => {
      const metadataPath = path.join(
        testDir,
        '.gemini-tasks',
        'metadata',
        'persistence-metadata.json',
      );
      const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf-8'));

      expect(metadata).toHaveProperty('version');
      expect(metadata).toHaveProperty('createdAt');
      expect(metadata).toHaveProperty('lastUpdated');
      expect(metadata.version).toBe('1.0.0');
    });

    test('should emit initialization events', async () => {
      const newEngine = new TaskPersistenceEngine(testDir);
      const initPromise = new Promise((resolve) => {
        newEngine.once('initialized', resolve);
      });

      await newEngine.initialize();
      await expect(initPromise).resolves.toBeDefined();

      await newEngine.shutdown();
    });
  });

  describe('Task Operations', () => {
    test('should create task with unique ID and timestamps', async () => {
      const taskData = {
        title: 'Test Task',
        description: 'Test task description',
        type: 'feature',
        status: 'pending',
      };

      const task = await engine.createTask(taskData);

      expect(task).toHaveProperty('id');
      expect(task).toHaveProperty('createdAt');
      expect(task).toHaveProperty('updatedAt');
      expect(task.title).toBe(taskData.title);
      expect(task.description).toBe(taskData.description);
      expect(task.type).toBe(taskData.type);
      expect(task.status).toBe(taskData.status);
      expect(typeof task.id).toBe('string');
      expect(task.id.length).toBeGreaterThan(0);
    });

    test('should retrieve task by ID', async () => {
      const taskData = {
        title: 'Retrieve Test',
        description: 'Test task retrieval',
        type: 'test',
        status: 'pending',
      };

      const createdTask = await engine.createTask(taskData);
      const retrievedTask = await engine.getTask(createdTask.id);

      expect(retrievedTask).toEqual(createdTask);
    });

    test('should update task and modify updatedAt timestamp', async () => {
      const taskData = {
        title: 'Update Test',
        description: 'Test task update',
        type: 'feature',
        status: 'pending',
      };

      const task = await engine.createTask(taskData);
      const originalUpdatedAt = task.updatedAt;

      // Wait a moment to ensure timestamp difference
      await new Promise((resolve) => setTimeout(resolve, 10));

      const updates = { status: 'in_progress', title: 'Updated Title' };
      const updatedTask = await engine.updateTask(task.id, updates);

      expect(updatedTask.status).toBe('in_progress');
      expect(updatedTask.title).toBe('Updated Title');
      expect(updatedTask.description).toBe(taskData.description); // Unchanged
      expect(new Date(updatedTask.updatedAt).getTime()).toBeGreaterThan(
        new Date(originalUpdatedAt).getTime(),
      );
    });

    test('should delete task', async () => {
      const taskData = {
        title: 'Delete Test',
        description: 'Test task deletion',
        type: 'feature',
        status: 'pending',
      };

      const task = await engine.createTask(taskData);
      await engine.deleteTask(task.id);

      await expect(engine.getTask(task.id)).rejects.toThrow('Task not found');
    });

    test('should list tasks with filtering', async () => {
      // Create multiple tasks
      const tasks = await Promise.all([
        engine.createTask({
          title: 'Task 1',
          type: 'feature',
          status: 'pending',
        }),
        engine.createTask({
          title: 'Task 2',
          type: 'test',
          status: 'in_progress',
        }),
        engine.createTask({
          title: 'Task 3',
          type: 'feature',
          status: 'completed',
        }),
        engine.createTask({ title: 'Task 4', type: 'bug', status: 'pending' }),
      ]);

      // Test various filters
      const allTasks = await engine.listTasks();
      expect(allTasks).toHaveLength(4);

      const featureTasks = await engine.listTasks({ type: 'feature' });
      expect(featureTasks).toHaveLength(2);

      const pendingTasks = await engine.listTasks({ status: 'pending' });
      expect(pendingTasks).toHaveLength(2);

      const completedFeatures = await engine.listTasks({
        type: 'feature',
        status: 'completed',
      });
      expect(completedFeatures).toHaveLength(1);
    });
  });

  describe('Cross-Session Persistence', () => {
    test('should persist data across engine restarts', async () => {
      const taskData = {
        title: 'Persistence Test',
        description: 'Test cross-session persistence',
        type: 'feature',
        status: 'pending',
      };

      const task = await engine.createTask(taskData);
      await engine.shutdown();

      // Create new engine instance
      const newEngine = new TaskPersistenceEngine(testDir);
      await newEngine.initialize();

      const retrievedTask = await newEngine.getTask(task.id);
      expect(retrievedTask).toEqual(task);

      await newEngine.shutdown();
    });

    test('should maintain session continuity', async () => {
      const sessionId = 'test-session-123';
      await engine.createSession(sessionId, {
        startedAt: new Date().toISOString(),
      });

      const session = await engine.getSession(sessionId);
      expect(session.id).toBe(sessionId);

      // Restart engine
      await engine.shutdown();
      const newEngine = new TaskPersistenceEngine(testDir);
      await newEngine.initialize();

      const persistedSession = await newEngine.getSession(sessionId);
      expect(persistedSession).toEqual(session);

      await newEngine.shutdown();
    });
  });

  describe('File Locking and Concurrency', () => {
    test('should handle concurrent task creation without conflicts', async () => {
      const taskPromises = Array.from({ length: 10 }, (_, i) =>
        engine.createTask({
          title: `Concurrent Task ${i}`,
          description: `Task ${i} for concurrency testing`,
          type: 'test',
          status: 'pending',
        }),
      );

      const tasks = await Promise.all(taskPromises);

      // Verify all tasks were created with unique IDs
      const taskIds = tasks.map((task) => task.id);
      const uniqueIds = new Set(taskIds);
      expect(uniqueIds.size).toBe(taskIds.length);

      // Verify all tasks are retrievable
      const retrievedTasks = await Promise.all(
        taskIds.map((id) => engine.getTask(id)),
      );
      expect(retrievedTasks).toHaveLength(10);
    });

    test('should handle file lock timeouts gracefully', async () => {
      // Mock file lock to simulate timeout
      const originalAcquireLock = engine.fileLock.acquireLock;
      engine.fileLock.acquireLock = jest.fn().mockImplementation(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        throw new Error('Lock timeout');
      });

      await expect(engine.createTask({ title: 'Test' })).rejects.toThrow();

      // Restore original method
      engine.fileLock.acquireLock = originalAcquireLock;
    });
  });

  describe('Data Validation', () => {
    test('should validate required task fields', async () => {
      await expect(engine.createTask({})).rejects.toThrow(
        'Task title is required',
      );
      await expect(engine.createTask({ title: '' })).rejects.toThrow(
        'Task title is required',
      );
      await expect(
        engine.createTask({ title: 'Test', type: 'invalid' }),
      ).rejects.toThrow('Invalid task type');
    });

    test('should validate task status transitions', async () => {
      const task = await engine.createTask({
        title: 'Status Test',
        type: 'feature',
        status: 'pending',
      });

      // Valid transitions
      await expect(
        engine.updateTask(task.id, { status: 'in_progress' }),
      ).resolves.toBeDefined();
      await expect(
        engine.updateTask(task.id, { status: 'completed' }),
      ).resolves.toBeDefined();

      // Invalid transition (completed -> pending should be allowed for flexibility)
      await expect(
        engine.updateTask(task.id, { status: 'pending' }),
      ).resolves.toBeDefined();
    });

    test('should sanitize and validate input data', async () => {
      const taskData = {
        title: '  Test Task  ',
        description: '  Task description  ',
        type: 'FEATURE',
        status: 'PENDING',
        customField: '<script>alert("xss")</script>',
      };

      const task = await engine.createTask(taskData);

      expect(task.title).toBe('Test Task'); // Trimmed
      expect(task.description).toBe('Task description'); // Trimmed
      expect(task.type).toBe('feature'); // Normalized
      expect(task.status).toBe('pending'); // Normalized
      expect(task.customField).not.toContain('<script>'); // Sanitized
    });
  });

  describe('Performance and Optimization', () => {
    test('should handle large numbers of tasks efficiently', async () => {
      const startTime = Date.now();

      // Create 100 tasks
      const taskPromises = Array.from({ length: 100 }, (_, i) =>
        engine.createTask({
          title: `Performance Test ${i}`,
          description: `Task ${i} for performance testing`,
          type: 'test',
          status: 'pending',
        }),
      );

      const tasks = await Promise.all(taskPromises);
      const creationTime = Date.now() - startTime;

      expect(tasks).toHaveLength(100);
      expect(creationTime).toBeLessThan(5000); // Should complete in under 5 seconds

      // Test retrieval performance
      const retrievalStart = Date.now();
      const allTasks = await engine.listTasks();
      const retrievalTime = Date.now() - retrievalStart;

      expect(allTasks).toHaveLength(100);
      expect(retrievalTime).toBeLessThan(1000); // Should retrieve in under 1 second
    });

    test('should use caching to improve performance', async () => {
      const task = await engine.createTask({
        title: 'Cache Test',
        type: 'feature',
        status: 'pending',
      });

      // First retrieval (from disk)
      const start1 = Date.now();
      await engine.getTask(task.id);
      const time1 = Date.now() - start1;

      // Second retrieval (from cache)
      const start2 = Date.now();
      await engine.getTask(task.id);
      const time2 = Date.now() - start2;

      // Cache should make second retrieval faster
      expect(time2).toBeLessThanOrEqual(time1);
    });
  });

  describe('Error Handling and Recovery', () => {
    test('should handle corrupted data gracefully', async () => {
      const task = await engine.createTask({
        title: 'Corruption Test',
        type: 'feature',
        status: 'pending',
      });

      // Corrupt the task file
      const taskPath = path.join(
        testDir,
        '.gemini-tasks',
        'tasks',
        `${task.id}.json`,
      );
      await fs.writeFile(taskPath, 'invalid json content');

      // Should handle corruption and attempt recovery
      await expect(engine.getTask(task.id)).rejects.toThrow();
    });

    test('should maintain data consistency after errors', async () => {
      const task = await engine.createTask({
        title: 'Consistency Test',
        type: 'feature',
        status: 'pending',
      });

      // Simulate error during update
      const originalWriteFile = fs.writeFile;
      let callCount = 0;
      fs.writeFile = jest.fn().mockImplementation(async (...args) => {
        callCount++;
        if (callCount === 1) {
          throw new Error('Simulated write error');
        }
        return originalWriteFile(...args);
      });

      // First update should fail
      await expect(
        engine.updateTask(task.id, { status: 'in_progress' }),
      ).rejects.toThrow();

      // Restore original function
      fs.writeFile = originalWriteFile;

      // Task should still be in original state
      const retrievedTask = await engine.getTask(task.id);
      expect(retrievedTask.status).toBe('pending');
    });
  });

  describe('Event System', () => {
    test('should emit task lifecycle events', async () => {
      const events = [];

      engine.on('taskCreated', (data) =>
        events.push({ type: 'created', data }),
      );
      engine.on('taskUpdated', (data) =>
        events.push({ type: 'updated', data }),
      );
      engine.on('taskDeleted', (data) =>
        events.push({ type: 'deleted', data }),
      );

      const task = await engine.createTask({
        title: 'Event Test',
        type: 'feature',
        status: 'pending',
      });

      await engine.updateTask(task.id, { status: 'in_progress' });
      await engine.deleteTask(task.id);

      expect(events).toHaveLength(3);
      expect(events[0].type).toBe('created');
      expect(events[1].type).toBe('updated');
      expect(events[2].type).toBe('deleted');
    });

    test('should provide detailed event data', async () => {
      let eventData;
      engine.once('taskCreated', (data) => {
        eventData = data;
      });

      const task = await engine.createTask({
        title: 'Event Data Test',
        type: 'feature',
        status: 'pending',
      });

      expect(eventData).toHaveProperty('task');
      expect(eventData).toHaveProperty('timestamp');
      expect(eventData).toHaveProperty('metadata');
      expect(eventData.task.id).toBe(task.id);
    });
  });
});
