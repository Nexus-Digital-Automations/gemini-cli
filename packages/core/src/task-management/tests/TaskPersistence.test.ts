/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Comprehensive Test Suite for TaskPersistence
 *
 * Tests all aspects of task queue persistence including:
 * - State serialization and deserialization
 * - Cross-session task recovery
 * - Backup and restoration mechanisms
 * - Data integrity and validation
 * - Performance optimization for large queues
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import type { PersistedQueueState} from '../TaskPersistence.js';
import { TaskPersistence, SerializedTask } from '../TaskPersistence.js';
import type { Task} from '../TaskQueue.js';
import { TaskStatus, TaskPriority } from '../TaskQueue.js';
import type { TaskDependency} from '../DependencyResolver.js';
import { DependencyType } from '../DependencyResolver.js';

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
  },
}));

// Mock logger
vi.mock('../utils/logger.js', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

describe('TaskPersistence', () => {
  let persistence: TaskPersistence;
  let tempDir: string;
  let mockTasks: Map<string, Task>;
  let mockDependencies: Map<string, TaskDependency>;

  beforeEach(() => {
    tempDir = join(tmpdir(), 'task-persistence-test');
    persistence = new TaskPersistence({
      persistenceDir: tempDir,
      enableBackup: true,
      backupRetentionDays: 7,
      compressionEnabled: true,
      encryptionKey: 'test-key-32-chars-long-enough!!',
    });

    // Create mock task data
    mockTasks = new Map([
      [
        'task-1',
        {
          id: 'task-1',
          title: 'Test Task 1',
          description: 'First test task',
          status: TaskStatus.PENDING,
          priority: TaskPriority.HIGH,
          createdAt: new Date('2024-01-01T00:00:00Z'),
          updatedAt: new Date('2024-01-01T01:00:00Z'),
          executeFunction: async () => ({ success: true }),
          dependencies: [],
          priorityFactors: {},
          executionHistory: [],
          estimatedDuration: 1000,
          actualDuration: null,
          retryCount: 0,
          maxRetries: 3,
          tags: ['test', 'high-priority'],
        },
      ],
      [
        'task-2',
        {
          id: 'task-2',
          title: 'Test Task 2',
          description: 'Second test task',
          status: TaskStatus.COMPLETED,
          priority: TaskPriority.MEDIUM,
          createdAt: new Date('2024-01-01T00:30:00Z'),
          updatedAt: new Date('2024-01-01T02:00:00Z'),
          executeFunction: async () => ({ success: true }),
          dependencies: ['task-1'],
          priorityFactors: {},
          executionHistory: [
            {
              startTime: new Date('2024-01-01T01:30:00Z'),
              endTime: new Date('2024-01-01T02:00:00Z'),
              duration: 1800000,
              success: true,
              result: { success: true },
            },
          ],
          estimatedDuration: 2000,
          actualDuration: 1800000,
          retryCount: 0,
          maxRetries: 3,
          tags: ['test'],
        },
      ],
    ]);

    mockDependencies = new Map([
      [
        'dep-1',
        {
          id: 'dep-1',
          dependentTaskId: 'task-2',
          dependsOnTaskId: 'task-1',
          type: DependencyType.SEQUENTIAL,
          strength: 1.0,
          description: 'Task 2 depends on Task 1',
          createdAt: new Date('2024-01-01T00:00:00Z'),
        },
      ],
    ]);

    // Clear all mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    persistence.destroy();
  });

  describe('State Serialization', () => {
    it('should serialize queue state correctly', async () => {
      const mockWriteFile = vi.mocked(fs.writeFile);
      const mockMkdir = vi.mocked(fs.mkdir);

      mockMkdir.mockResolvedValue(undefined);
      mockWriteFile.mockResolvedValue();

      await persistence.saveQueueState(
        mockTasks,
        mockDependencies,
        new Map([['metric1', 100]]),
        { version: '1.0.0', lastSave: new Date() }
      );

      expect(mockMkdir).toHaveBeenCalled();
      expect(mockWriteFile).toHaveBeenCalled();

      // Verify the serialized content structure
      const writeCall = mockWriteFile.mock.calls[0];
      const serializedData = JSON.parse(writeCall[1] as string);

      expect(serializedData).toHaveProperty('version');
      expect(serializedData).toHaveProperty('timestamp');
      expect(serializedData).toHaveProperty('tasks');
      expect(serializedData).toHaveProperty('dependencies');
      expect(serializedData).toHaveProperty('queueMetrics');
      expect(serializedData).toHaveProperty('metadata');

      expect(serializedData.tasks).toHaveLength(2);
      expect(serializedData.dependencies).toHaveLength(1);
    });

    it('should handle function serialization with registry', async () => {
      const customFunction = async () => ({ success: true, custom: true });
      persistence.registerFunction('customExecute', customFunction);

      const taskWithCustomFunction = new Map([
        [
          'custom-task',
          {
            id: 'custom-task',
            title: 'Custom Task',
            description: 'Task with custom function',
            status: TaskStatus.PENDING,
            priority: TaskPriority.MEDIUM,
            createdAt: new Date(),
            updatedAt: new Date(),
            executeFunction: customFunction,
            dependencies: [],
            priorityFactors: {},
            executionHistory: [],
            functionName: 'customExecute', // Function registry name
          } as Task,
        ],
      ]);

      const mockWriteFile = vi.mocked(fs.writeFile);
      const mockMkdir = vi.mocked(fs.mkdir);

      mockMkdir.mockResolvedValue(undefined);
      mockWriteFile.mockResolvedValue();

      await persistence.saveQueueState(
        taskWithCustomFunction,
        new Map(),
        new Map(),
        {}
      );

      const writeCall = mockWriteFile.mock.calls[0];
      const serializedData = JSON.parse(writeCall[1] as string);

      expect(serializedData.tasks[0]).toHaveProperty('functionName', 'customExecute');
      expect(serializedData.tasks[0]).not.toHaveProperty('executeFunction');
    });

    it('should compress data when compression is enabled', async () => {
      const compressionPersistence = new TaskPersistence({
        persistenceDir: tempDir,
        compressionEnabled: true,
      });

      const mockWriteFile = vi.mocked(fs.writeFile);
      const mockMkdir = vi.mocked(fs.mkdir);

      mockMkdir.mockResolvedValue(undefined);
      mockWriteFile.mockResolvedValue();

      await compressionPersistence.saveQueueState(
        mockTasks,
        mockDependencies,
        new Map(),
        {}
      );

      // Verify that compression was applied (data should not be plain JSON)
      const writeCall = mockWriteFile.mock.calls[0];
      const data = writeCall[1] as string;

      expect(() => JSON.parse(data)).toThrow(); // Should not be valid JSON if compressed

      compressionPersistence.destroy();
    });
  });

  describe('State Deserialization', () => {
    it('should deserialize queue state correctly', async () => {
      const mockReadFile = vi.mocked(fs.readFile);
      const mockAccess = vi.mocked(fs.access);

      const serializedState: PersistedQueueState = {
        version: '1.0.0',
        timestamp: new Date(),
        tasks: [
          {
            id: 'task-1',
            title: 'Restored Task',
            description: 'Task restored from persistence',
            status: TaskStatus.PENDING,
            priority: TaskPriority.HIGH,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T01:00:00Z',
            functionName: 'defaultExecute',
            dependencies: [],
            priorityFactors: {},
            executionHistory: [],
          },
        ],
        dependencies: [],
        queueMetrics: {},
        metadata: {},
      };

      mockAccess.mockResolvedValue(undefined);
      mockReadFile.mockResolvedValue(JSON.stringify(serializedState));

      // Register the function for deserialization
      const defaultExecute = async () => ({ success: true });
      persistence.registerFunction('defaultExecute', defaultExecute);

      const restored = await persistence.loadQueueState();

      expect(restored.tasks.size).toBe(1);
      expect(restored.tasks.has('task-1')).toBe(true);

      const restoredTask = restored.tasks.get('task-1');
      expect(restoredTask?.title).toBe('Restored Task');
      expect(restoredTask?.executeFunction).toBe(defaultExecute);
      expect(restoredTask?.createdAt).toBeInstanceOf(Date);
    });

    it('should handle missing function registry gracefully', async () => {
      const mockReadFile = vi.mocked(fs.readFile);
      const mockAccess = vi.mocked(fs.access);

      const serializedState: PersistedQueueState = {
        version: '1.0.0',
        timestamp: new Date(),
        tasks: [
          {
            id: 'task-1',
            title: 'Task with missing function',
            description: 'Task with unregistered function',
            status: TaskStatus.PENDING,
            priority: TaskPriority.MEDIUM,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T01:00:00Z',
            functionName: 'missingFunction',
            dependencies: [],
            priorityFactors: {},
            executionHistory: [],
          },
        ],
        dependencies: [],
        queueMetrics: {},
        metadata: {},
      };

      mockAccess.mockResolvedValue(undefined);
      mockReadFile.mockResolvedValue(JSON.stringify(serializedState));

      const restored = await persistence.loadQueueState();

      expect(restored.tasks.size).toBe(1);
      const restoredTask = restored.tasks.get('task-1');

      // Should have a fallback function
      expect(restoredTask?.executeFunction).toBeDefined();
      expect(typeof restoredTask?.executeFunction).toBe('function');
    });

    it('should decompress data when needed', async () => {
      const compressionPersistence = new TaskPersistence({
        persistenceDir: tempDir,
        compressionEnabled: true,
      });

      const mockReadFile = vi.mocked(fs.readFile);
      const mockAccess = vi.mocked(fs.access);

      // Mock compressed data (in reality this would be actual compressed data)
      const compressedData = Buffer.from('compressed-data');

      mockAccess.mockResolvedValue(undefined);
      mockReadFile.mockResolvedValue(compressedData);

      // Mock the decompression to return valid JSON
      vi.spyOn(compressionPersistence as any, 'decompressData').mockReturnValue(
        JSON.stringify({
          version: '1.0.0',
          timestamp: new Date(),
          tasks: [],
          dependencies: [],
          queueMetrics: {},
          metadata: {},
        })
      );

      const restored = await compressionPersistence.loadQueueState();

      expect(restored).toBeDefined();
      expect(restored.tasks).toBeInstanceOf(Map);

      compressionPersistence.destroy();
    });
  });

  describe('Backup Management', () => {
    it('should create backups when enabled', async () => {
      const mockWriteFile = vi.mocked(fs.writeFile);
      const mockMkdir = vi.mocked(fs.mkdir);
      const mockReaddir = vi.mocked(fs.readdir);

      mockMkdir.mockResolvedValue(undefined);
      mockWriteFile.mockResolvedValue();
      mockReaddir.mockResolvedValue([]);

      await persistence.createBackup(mockTasks, mockDependencies, new Map(), {});

      // Should create both main file and backup
      expect(mockWriteFile).toHaveBeenCalledTimes(2);

      const calls = mockWriteFile.mock.calls;
      expect(calls.some(call => (call[0] as string).includes('backup'))).toBe(true);
    });

    it('should clean old backups based on retention policy', async () => {
      const mockReaddir = vi.mocked(fs.readdir);
      const mockStat = vi.mocked(fs.stat);
      const mockUnlink = vi.mocked(fs.unlink);

      // Mock old backup files
      const oldBackupFiles = [
        'backup-2024-01-01.json',
        'backup-2024-01-02.json',
        'backup-2024-01-10.json', // This should be kept
      ];

      mockReaddir.mockResolvedValue(oldBackupFiles as any);

      // Mock file stats to make first two files old
      mockStat.mockImplementation(async (path) => {
        const filename = path.toString().split('/').pop();
        const isOld = filename?.includes('01-01') || filename?.includes('01-02');

        return {
          mtime: new Date(isOld ? '2024-01-01' : '2024-01-10'),
          isFile: () => true,
        } as any;
      });

      mockUnlink.mockResolvedValue();

      await persistence.cleanupOldBackups();

      // Should delete 2 old files
      expect(mockUnlink).toHaveBeenCalledTimes(2);
    });

    it('should restore from backup when main file is corrupted', async () => {
      const mockReadFile = vi.mocked(fs.readFile);
      const mockAccess = vi.mocked(fs.access);

      // Mock main file access failure
      mockAccess.mockImplementation(async (path) => {
        if (path.toString().includes('backup')) {
          return; // Backup exists
        }
        throw new Error('Main file not found');
      });

      const backupState = {
        version: '1.0.0',
        timestamp: new Date(),
        tasks: [
          {
            id: 'backup-task',
            title: 'From Backup',
            description: 'Task restored from backup',
            status: TaskStatus.PENDING,
            priority: TaskPriority.MEDIUM,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T01:00:00Z',
            functionName: 'defaultExecute',
            dependencies: [],
            priorityFactors: {},
            executionHistory: [],
          },
        ],
        dependencies: [],
        queueMetrics: {},
        metadata: {},
      };

      mockReadFile.mockResolvedValue(JSON.stringify(backupState));

      const defaultExecute = async () => ({ success: true });
      persistence.registerFunction('defaultExecute', defaultExecute);

      const restored = await persistence.loadQueueState();

      expect(restored.tasks.size).toBe(1);
      expect(restored.tasks.has('backup-task')).toBe(true);
    });
  });

  describe('Data Validation and Integrity', () => {
    it('should validate state version compatibility', async () => {
      const mockReadFile = vi.mocked(fs.readFile);
      const mockAccess = vi.mocked(fs.access);

      const incompatibleState = {
        version: '2.0.0', // Future version
        timestamp: new Date(),
        tasks: [],
        dependencies: [],
        queueMetrics: {},
        metadata: {},
      };

      mockAccess.mockResolvedValue(undefined);
      mockReadFile.mockResolvedValue(JSON.stringify(incompatibleState));

      await expect(persistence.loadQueueState()).rejects.toThrow(/version/);
    });

    it('should handle corrupted data gracefully', async () => {
      const mockReadFile = vi.mocked(fs.readFile);
      const mockAccess = vi.mocked(fs.access);

      mockAccess.mockResolvedValue(undefined);
      mockReadFile.mockResolvedValue('invalid-json-data');

      // Should not throw, but return empty state
      const restored = await persistence.loadQueueState();

      expect(restored.tasks.size).toBe(0);
      expect(restored.dependencies.size).toBe(0);
    });

    it('should validate task data integrity', async () => {
      const invalidState = {
        version: '1.0.0',
        timestamp: new Date(),
        tasks: [
          {
            // Missing required fields
            id: 'invalid-task',
            title: '',
            // description missing
            status: 'INVALID_STATUS',
          },
        ],
        dependencies: [],
        queueMetrics: {},
        metadata: {},
      };

      const mockReadFile = vi.mocked(fs.readFile);
      const mockAccess = vi.mocked(fs.access);

      mockAccess.mockResolvedValue(undefined);
      mockReadFile.mockResolvedValue(JSON.stringify(invalidState));

      const restored = await persistence.loadQueueState();

      // Should filter out invalid tasks
      expect(restored.tasks.size).toBe(0);
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle large task queues efficiently', async () => {
      // Create a large number of tasks
      const largeTasks = new Map<string, Task>();
      for (let i = 0; i < 10000; i++) {
        largeTasks.set(`task-${i}`, {
          id: `task-${i}`,
          title: `Task ${i}`,
          description: `Description for task ${i}`,
          status: TaskStatus.PENDING,
          priority: TaskPriority.MEDIUM,
          createdAt: new Date(),
          updatedAt: new Date(),
          executeFunction: async () => ({ success: true }),
          dependencies: [],
          priorityFactors: {},
          executionHistory: [],
        });
      }

      const mockWriteFile = vi.mocked(fs.writeFile);
      const mockMkdir = vi.mocked(fs.mkdir);

      mockMkdir.mockResolvedValue(undefined);
      mockWriteFile.mockResolvedValue();

      const startTime = Date.now();
      await persistence.saveQueueState(largeTasks, new Map(), new Map(), {});
      const endTime = Date.now();

      // Should complete within reasonable time (5 seconds for 10k tasks)
      expect(endTime - startTime).toBeLessThan(5000);
      expect(mockWriteFile).toHaveBeenCalled();
    });

    it('should use streaming for large datasets', async () => {
      const streamingPersistence = new TaskPersistence({
        persistenceDir: tempDir,
        useStreaming: true,
        streamThreshold: 100, // Use streaming for >100 tasks
      });

      const largeTasks = new Map<string, Task>();
      for (let i = 0; i < 200; i++) {
        largeTasks.set(`task-${i}`, {
          id: `task-${i}`,
          title: `Task ${i}`,
          description: `Description for task ${i}`,
          status: TaskStatus.PENDING,
          priority: TaskPriority.MEDIUM,
          createdAt: new Date(),
          updatedAt: new Date(),
          executeFunction: async () => ({ success: true }),
          dependencies: [],
          priorityFactors: {},
          executionHistory: [],
        });
      }

      const mockWriteFile = vi.mocked(fs.writeFile);
      const mockMkdir = vi.mocked(fs.mkdir);

      mockMkdir.mockResolvedValue(undefined);
      mockWriteFile.mockResolvedValue();

      // Spy on streaming method
      const streamingSpy = vi.spyOn(streamingPersistence as any, 'saveWithStreaming');
      streamingSpy.mockResolvedValue();

      await streamingPersistence.saveQueueState(largeTasks, new Map(), new Map(), {});

      expect(streamingSpy).toHaveBeenCalled();

      streamingPersistence.destroy();
    });
  });

  describe('Event Emission', () => {
    it('should emit save events', async () => {
      const saveSpy = vi.fn();
      persistence.on('state-saved', saveSpy);

      const mockWriteFile = vi.mocked(fs.writeFile);
      const mockMkdir = vi.mocked(fs.mkdir);

      mockMkdir.mockResolvedValue(undefined);
      mockWriteFile.mockResolvedValue();

      await persistence.saveQueueState(mockTasks, mockDependencies, new Map(), {});

      expect(saveSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          taskCount: 2,
          dependencyCount: 1,
          timestamp: expect.any(Date),
        })
      );
    });

    it('should emit load events', async () => {
      const loadSpy = vi.fn();
      persistence.on('state-loaded', loadSpy);

      const mockReadFile = vi.mocked(fs.readFile);
      const mockAccess = vi.mocked(fs.access);

      const state = {
        version: '1.0.0',
        timestamp: new Date(),
        tasks: [],
        dependencies: [],
        queueMetrics: {},
        metadata: {},
      };

      mockAccess.mockResolvedValue(undefined);
      mockReadFile.mockResolvedValue(JSON.stringify(state));

      await persistence.loadQueueState();

      expect(loadSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          taskCount: 0,
          dependencyCount: 0,
          source: 'main',
        })
      );
    });

    it('should emit error events for save failures', async () => {
      const errorSpy = vi.fn();
      persistence.on('persistence-error', errorSpy);

      const mockWriteFile = vi.mocked(fs.writeFile);
      const mockMkdir = vi.mocked(fs.mkdir);

      mockMkdir.mockResolvedValue(undefined);
      mockWriteFile.mockRejectedValue(new Error('Disk full'));

      await expect(
        persistence.saveQueueState(mockTasks, mockDependencies, new Map(), {})
      ).rejects.toThrow();

      expect(errorSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          operation: 'save',
          error: expect.any(Error),
        })
      );
    });
  });

  describe('Function Registry', () => {
    it('should register and retrieve functions correctly', () => {
      const testFunction = async () => ({ test: true });

      persistence.registerFunction('testFunc', testFunction);

      const retrieved = persistence.getRegisteredFunction('testFunc');
      expect(retrieved).toBe(testFunction);
    });

    it('should handle function overwriting', () => {
      const func1 = async () => ({ version: 1 });
      const func2 = async () => ({ version: 2 });

      persistence.registerFunction('func', func1);
      persistence.registerFunction('func', func2); // Overwrite

      const retrieved = persistence.getRegisteredFunction('func');
      expect(retrieved).toBe(func2);
    });

    it('should provide fallback for missing functions', () => {
      const fallback = persistence.getRegisteredFunction('nonexistent');

      expect(typeof fallback).toBe('function');
      // Should be a safe fallback function
      expect(fallback).toBeDefined();
    });
  });
});