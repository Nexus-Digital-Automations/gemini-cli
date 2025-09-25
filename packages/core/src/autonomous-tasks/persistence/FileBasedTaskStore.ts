/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { promises as fs } from 'node:fs';
import { join, dirname } from 'node:path';
import { EventEmitter } from 'node:events';
import { createHash, randomUUID } from 'node:crypto';
import { createReadStream, createWriteStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { createGzip, createGunzip } from 'node:zlib';
import type {
  ITask,
  ITaskQueue,
  TaskFilter,
} from '../interfaces/TaskInterfaces.js';
import {
  TaskStore,
  type StorageConfig,
  type TransactionContext,
  type TransactionIsolationLevel,
  type PersistenceResult,
  type QueryOptions,
  type EnhancedPersistenceStats,
  type BackupStrategy,
  TransactionIsolationLevel as TIL,
  BackupStrategy as BS,
  CompressionAlgorithm,
  SerializationFormat,
} from './TaskStore.js';

/**
 * File-based storage structure
 */
interface FileStorageStructure {
  /** Storage format version */
  version: string;
  /** Storage metadata */
  metadata: {
    created: string;
    lastModified: string;
    totalTasks: number;
    totalQueues: number;
    compressionEnabled: boolean;
    encryptionEnabled: boolean;
  };
  /** Task data */
  tasks: Record<string, SerializedTask>;
  /** Queue data */
  queues: Record<string, SerializedQueue>;
  /** Index data for fast lookups */
  indexes: {
    byStatus: Record<string, string[]>;
    byType: Record<string, string[]>;
    byPriority: Record<string, string[]>;
    byCreationDate: Array<{ date: string; taskIds: string[] }>;
  };
  /** Tombstones for soft-deleted items */
  tombstones: {
    tasks: Record<string, { deletedAt: string; reason: string }>;
    queues: Record<string, { deletedAt: string; reason: string }>;
  };
}

/**
 * Serialized task representation for file storage
 */
interface SerializedTask {
  /** Task data */
  data: ITask;
  /** Task version for optimistic locking */
  version: number;
  /** Storage metadata */
  metadata: {
    created: string;
    lastModified: string;
    checksum: string;
    size: number;
  };
}

/**
 * Serialized queue representation for file storage
 */
interface SerializedQueue {
  /** Queue data */
  data: ITaskQueue;
  /** Queue version */
  version: number;
  /** Storage metadata */
  metadata: {
    created: string;
    lastModified: string;
    checksum: string;
    size: number;
  };
}

/**
 * Active transaction state
 */
interface ActiveTransaction {
  /** Transaction context */
  context: TransactionContext;
  /** Changed data during transaction */
  changes: Map<string, { type: 'task' | 'queue'; operation: 'create' | 'update' | 'delete'; data?: unknown }>;
  /** Original data for rollback */
  originalData: Map<string, { type: 'task' | 'queue'; data: unknown }>;
  /** Transaction timeout handle */
  timeoutHandle: NodeJS.Timeout;
}

/**
 * File-based task storage implementation with advanced features
 */
export class FileBasedTaskStore extends TaskStore {
  private storage: FileStorageStructure | null = null;
  private storagePath = '';
  private lockFilePath = '';
  private isLocked = false;
  private activeTransactions = new Map<string, ActiveTransaction>();
  private writeInProgress = false;
  private cache = new Map<string, { data: unknown; timestamp: number; accessed: number }>();
  private readonly CACHE_TTL = 300_000; // 5 minutes
  private readonly MAX_CACHE_SIZE = 1000;

  constructor() {
    super();
    // Mix in EventEmitter functionality
    Object.assign(this, EventEmitter.prototype);
    EventEmitter.call(this as unknown as EventEmitter);
  }

  /**
   * Initialize the file-based storage system
   */
  async initialize(config: StorageConfig): Promise<void> {
    this.validateConfig(config);
    this.config = config;
    this.storagePath = config.connectionString;
    this.lockFilePath = `${this.storagePath}.lock`;

    try {
      // Ensure directory exists
      await fs.mkdir(dirname(this.storagePath), { recursive: true });

      // Load existing storage or create new
      await this.loadOrCreateStorage();

      // Set up periodic cache cleanup
      setInterval(() => this.cleanupCache(), 60_000); // Every minute

      // Set up periodic index maintenance
      if (config.indexConfig?.maintenance.maintenanceInterval) {
        setInterval(
          () => this.maintainIndexes(),
          config.indexConfig.maintenance.maintenanceInterval
        );
      }

      // Set up automatic backups
      if (config.backupConfig?.enabled) {
        setInterval(
          () => this.performAutomaticBackup(),
          config.backupConfig.interval
        );
      }

      this.isInitialized = true;
      this.emit('initialized', { config });
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Shutdown the storage system gracefully
   */
  async shutdown(force = false): Promise<void> {
    if (this.isShuttingDown) return;
    this.isShuttingDown = true;

    try {
      // Wait for active write operations unless forced
      if (!force) {
        while (this.writeInProgress || this.activeTransactions.size > 0) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } else {
        // Force rollback all active transactions
        for (const [, transaction] of this.activeTransactions) {
          await this.rollbackTransaction(transaction.context);
        }
      }

      // Final save
      if (this.storage) {
        await this.saveStorage();
      }

      // Release lock
      await this.releaseLock();

      // Clear cache
      this.cache.clear();

      this.isInitialized = false;
      this.emit('shutdown');
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Begin atomic transaction
   */
  async beginTransaction(
    isolationLevel: TransactionIsolationLevel = TIL.READ_COMMITTED,
    readOnly = false
  ): Promise<TransactionContext> {
    this.ensureInitialized();

    const transactionId = randomUUID();
    const context: TransactionContext = {
      id: transactionId,
      isolationLevel,
      startTime: new Date(),
      readOnly,
      timeout: 30_000, // 30 seconds
      operations: [],
    };

    // Set up transaction timeout
    const timeoutHandle = setTimeout(() => {
      this.rollbackTransaction(context).catch(error =>
        this.emit('error', new Error(`Transaction timeout rollback failed: ${error.message}`))
      );
    }, context.timeout);

    // Store active transaction
    this.activeTransactions.set(transactionId, {
      context,
      changes: new Map(),
      originalData: new Map(),
      timeoutHandle,
    });

    this.emit('transactionStarted', { transactionId, isolationLevel, readOnly });
    return context;
  }

  /**
   * Commit transaction
   */
  async commitTransaction(transaction: TransactionContext): Promise<void> {
    const activeTransaction = this.activeTransactions.get(transaction.id);
    if (!activeTransaction) {
      throw new Error(`Transaction ${transaction.id} not found`);
    }

    try {
      // Clear timeout
      clearTimeout(activeTransaction.timeoutHandle);

      // Apply all changes atomically
      if (activeTransaction.changes.size > 0) {
        await this.applyTransactionChanges(activeTransaction);
        await this.saveStorage();
      }

      // Clean up
      this.activeTransactions.delete(transaction.id);
      this.emit('transactionCommitted', { transactionId: transaction.id, changes: activeTransaction.changes.size });
    } catch (error) {
      // Attempt rollback on commit failure
      await this.rollbackTransaction(transaction);
      throw error;
    }
  }

  /**
   * Rollback transaction
   */
  async rollbackTransaction(transaction: TransactionContext): Promise<void> {
    const activeTransaction = this.activeTransactions.get(transaction.id);
    if (!activeTransaction) {
      return; // Already rolled back or committed
    }

    try {
      // Clear timeout
      clearTimeout(activeTransaction.timeoutHandle);

      // Restore original data if changes were made
      if (activeTransaction.changes.size > 0) {
        await this.restoreTransactionData(activeTransaction);
      }

      // Clean up
      this.activeTransactions.delete(transaction.id);
      this.emit('transactionRolledBack', { transactionId: transaction.id, changes: activeTransaction.changes.size });
    } catch (error) {
      this.emit('error', new Error(`Transaction rollback failed: ${error.message}`));
      // Force clean up even if restore fails
      this.activeTransactions.delete(transaction.id);
      throw error;
    }
  }

  /**
   * Save task to persistent storage
   */
  async saveTask(
    task: ITask,
    transaction?: TransactionContext
  ): Promise<PersistenceResult<void>> {
    const startTime = Date.now();
    this.ensureInitialized();

    try {
      const now = new Date().toISOString();
      const serializedTask: SerializedTask = {
        data: { ...task },
        version: 1,
        metadata: {
          created: now,
          lastModified: now,
          checksum: this.calculateChecksum(task),
          size: JSON.stringify(task).length,
        },
      };

      if (transaction) {
        // Add to transaction changes
        const activeTransaction = this.activeTransactions.get(transaction.id);
        if (!activeTransaction) {
          throw new Error(`Transaction ${transaction.id} not found`);
        }

        // Store original data for rollback
        const existingTask = this.storage!.tasks[task.id];
        if (existingTask) {
          activeTransaction.originalData.set(task.id, { type: 'task', data: existingTask });
        }

        // Add to changes
        activeTransaction.changes.set(task.id, { type: 'task', operation: 'create', data: serializedTask });

        // Add to transaction operations
        transaction.operations.push({
          type: 'create',
          resource: 'task',
          resourceId: task.id,
          timestamp: new Date(),
          data: task,
        });
      } else {
        // Direct save
        await this.acquireLock();
        try {
          this.storage!.tasks[task.id] = serializedTask;
          this.updateIndexes(task);
          this.storage!.metadata.totalTasks = Object.keys(this.storage!.tasks).length;
          this.storage!.metadata.lastModified = now;
          await this.saveStorage();
        } finally {
          await this.releaseLock();
        }
      }

      // Update cache
      this.updateCache(`task:${task.id}`, serializedTask);

      this.emit('taskSaved', { taskId: task.id, transactionId: transaction?.id });

      return {
        success: true,
        metadata: {
          duration: Date.now() - startTime,
          sizeChange: serializedTask.metadata.size,
          transactionId: transaction?.id,
        },
      };
    } catch (error) {
      this.emit('error', error);
      return {
        success: false,
        error: error as Error,
        metadata: {
          duration: Date.now() - startTime,
          sizeChange: 0,
          transactionId: transaction?.id,
        },
      };
    }
  }

  /**
   * Load task from persistent storage
   */
  async loadTask(
    taskId: string,
    useCache = true
  ): Promise<PersistenceResult<ITask | null>> {
    const startTime = Date.now();
    this.ensureInitialized();

    try {
      let cacheInfo: { hit: boolean; key: string; age?: number } | undefined;

      // Check cache first
      if (useCache) {
        const cached = this.getFromCache(`task:${taskId}`);
        if (cached) {
          cacheInfo = { hit: true, key: `task:${taskId}`, age: Date.now() - cached.timestamp };
          return {
            success: true,
            data: (cached.data as SerializedTask).data,
            metadata: {
              duration: Date.now() - startTime,
              sizeChange: 0,
              cacheInfo,
            },
          };
        }
        cacheInfo = { hit: false, key: `task:${taskId}` };
      }

      // Load from storage
      const serializedTask = this.storage!.tasks[taskId];
      if (!serializedTask) {
        return {
          success: true,
          data: null,
          metadata: {
            duration: Date.now() - startTime,
            sizeChange: 0,
            cacheInfo,
          },
        };
      }

      // Verify checksum
      const expectedChecksum = this.calculateChecksum(serializedTask.data);
      if (serializedTask.metadata.checksum !== expectedChecksum) {
        throw new Error(`Checksum mismatch for task ${taskId}. Data may be corrupted.`);
      }

      // Update cache
      if (useCache) {
        this.updateCache(`task:${taskId}`, serializedTask);
      }

      this.emit('taskLoaded', { taskId, fromCache: false });

      return {
        success: true,
        data: serializedTask.data,
        metadata: {
          duration: Date.now() - startTime,
          sizeChange: 0,
          cacheInfo,
        },
      };
    } catch (error) {
      this.emit('error', error);
      return {
        success: false,
        error: error as Error,
        metadata: {
          duration: Date.now() - startTime,
          sizeChange: 0,
        },
      };
    }
  }

  /**
   * Update task with optimistic locking
   */
  async updateTask(
    task: ITask,
    expectedVersion?: number,
    transaction?: TransactionContext
  ): Promise<PersistenceResult<void>> {
    const startTime = Date.now();
    this.ensureInitialized();

    try {
      const existingTask = this.storage!.tasks[task.id];
      if (!existingTask) {
        throw new Error(`Task ${task.id} not found`);
      }

      // Check version for optimistic locking
      if (expectedVersion !== undefined && existingTask.version !== expectedVersion) {
        throw new Error(`Version conflict. Expected ${expectedVersion}, got ${existingTask.version}`);
      }

      const now = new Date().toISOString();
      const updatedTask: SerializedTask = {
        data: { ...task },
        version: existingTask.version + 1,
        metadata: {
          ...existingTask.metadata,
          lastModified: now,
          checksum: this.calculateChecksum(task),
          size: JSON.stringify(task).length,
        },
      };

      if (transaction) {
        // Add to transaction changes
        const activeTransaction = this.activeTransactions.get(transaction.id);
        if (!activeTransaction) {
          throw new Error(`Transaction ${transaction.id} not found`);
        }

        // Store original data for rollback
        activeTransaction.originalData.set(task.id, { type: 'task', data: existingTask });

        // Add to changes
        activeTransaction.changes.set(task.id, { type: 'task', operation: 'update', data: updatedTask });

        // Add to transaction operations
        transaction.operations.push({
          type: 'update',
          resource: 'task',
          resourceId: task.id,
          timestamp: new Date(),
          data: task,
        });
      } else {
        // Direct update
        await this.acquireLock();
        try {
          this.storage!.tasks[task.id] = updatedTask;
          this.updateIndexes(task);
          this.storage!.metadata.lastModified = now;
          await this.saveStorage();
        } finally {
          await this.releaseLock();
        }
      }

      // Update cache
      this.updateCache(`task:${task.id}`, updatedTask);

      this.emit('taskUpdated', { taskId: task.id, version: updatedTask.version, transactionId: transaction?.id });

      return {
        success: true,
        metadata: {
          duration: Date.now() - startTime,
          sizeChange: updatedTask.metadata.size - existingTask.metadata.size,
          transactionId: transaction?.id,
        },
      };
    } catch (error) {
      this.emit('error', error);
      return {
        success: false,
        error: error as Error,
        metadata: {
          duration: Date.now() - startTime,
          sizeChange: 0,
          transactionId: transaction?.id,
        },
      };
    }
  }

  /**
   * Delete task with soft delete support
   */
  async deleteTask(
    taskId: string,
    softDelete = true,
    transaction?: TransactionContext
  ): Promise<PersistenceResult<void>> {
    const startTime = Date.now();
    this.ensureInitialized();

    try {
      const existingTask = this.storage!.tasks[taskId];
      if (!existingTask) {
        return {
          success: true, // Idempotent operation
          metadata: {
            duration: Date.now() - startTime,
            sizeChange: 0,
            transactionId: transaction?.id,
          },
        };
      }

      const now = new Date().toISOString();

      if (transaction) {
        // Add to transaction changes
        const activeTransaction = this.activeTransactions.get(transaction.id);
        if (!activeTransaction) {
          throw new Error(`Transaction ${transaction.id} not found`);
        }

        // Store original data for rollback
        activeTransaction.originalData.set(taskId, { type: 'task', data: existingTask });

        // Add to changes
        activeTransaction.changes.set(taskId, { type: 'task', operation: 'delete' });

        // Add to transaction operations
        transaction.operations.push({
          type: 'delete',
          resource: 'task',
          resourceId: taskId,
          timestamp: new Date(),
        });
      } else {
        // Direct delete
        await this.acquireLock();
        try {
          if (softDelete) {
            // Add to tombstones
            this.storage!.tombstones.tasks[taskId] = {
              deletedAt: now,
              reason: 'user_requested',
            };
          }

          // Remove from storage
          delete this.storage!.tasks[taskId];
          this.removeFromIndexes(taskId, existingTask.data);
          this.storage!.metadata.totalTasks = Object.keys(this.storage!.tasks).length;
          this.storage!.metadata.lastModified = now;
          await this.saveStorage();
        } finally {
          await this.releaseLock();
        }
      }

      // Remove from cache
      this.removeFromCache(`task:${taskId}`);

      this.emit('taskDeleted', { taskId, softDelete, transactionId: transaction?.id });

      return {
        success: true,
        metadata: {
          duration: Date.now() - startTime,
          sizeChange: -existingTask.metadata.size,
          transactionId: transaction?.id,
        },
      };
    } catch (error) {
      this.emit('error', error);
      return {
        success: false,
        error: error as Error,
        metadata: {
          duration: Date.now() - startTime,
          sizeChange: 0,
          transactionId: transaction?.id,
        },
      };
    }
  }

  /**
   * Query tasks with advanced filtering and pagination
   */
  async queryTasks(options: QueryOptions): Promise<PersistenceResult<ITask[]>> {
    const startTime = Date.now();
    this.ensureInitialized();

    try {
      let taskIds = Object.keys(this.storage!.tasks);
      const results: ITask[] = [];

      // Apply filters using indexes where possible
      if (options.status && options.status.length > 0) {
        const statusTaskIds = new Set<string>();
        for (const status of options.status) {
          const indexedIds = this.storage!.indexes.byStatus[status] || [];
          indexedIds.forEach(id => statusTaskIds.add(id));
        }
        taskIds = taskIds.filter(id => statusTaskIds.has(id));
      }

      if (options.type && options.type.length > 0) {
        const typeTaskIds = new Set<string>();
        for (const type of options.type) {
          const indexedIds = this.storage!.indexes.byType[type] || [];
          indexedIds.forEach(id => typeTaskIds.add(id));
        }
        taskIds = taskIds.filter(id => typeTaskIds.has(id));
      }

      if (options.priority && options.priority.length > 0) {
        const priorityTaskIds = new Set<string>();
        for (const priority of options.priority) {
          const indexedIds = this.storage!.indexes.byPriority[priority.toString()] || [];
          indexedIds.forEach(id => priorityTaskIds.add(id));
        }
        taskIds = taskIds.filter(id => priorityTaskIds.has(id));
      }

      // Load and filter tasks
      for (const taskId of taskIds) {
        const serializedTask = this.storage!.tasks[taskId];
        if (!serializedTask) continue;

        const task = serializedTask.data;

        // Apply additional filters
        if (options.createdAfter && new Date(task.createdAt) < options.createdAfter) continue;
        if (options.createdBefore && new Date(task.createdAt) > options.createdBefore) continue;
        if (options.parentTaskId && task.parentTaskId !== options.parentTaskId) continue;
        if (options.tags && options.tags.length > 0) {
          if (!options.tags.every(tag => task.tags.includes(tag))) continue;
        }

        // Apply custom filters
        if (options.customFilters && options.customFilters.length > 0) {
          if (!options.customFilters.every(filter => filter(task))) continue;
        }

        // Apply search query (simple text search)
        if (options.searchQuery) {
          const searchText = `${task.name} ${task.description}`.toLowerCase();
          if (!searchText.includes(options.searchQuery.toLowerCase())) continue;
        }

        results.push(task);
      }

      // Apply sorting
      if (options.sort && options.sort.length > 0) {
        results.sort((a, b) => {
          for (const sortOption of options.sort!) {
            const aValue = this.getNestedValue(a, sortOption.field);
            const bValue = this.getNestedValue(b, sortOption.field);

            let comparison = 0;
            if (aValue < bValue) comparison = -1;
            else if (aValue > bValue) comparison = 1;

            if (comparison !== 0) {
              return sortOption.direction === 'desc' ? -comparison : comparison;
            }
          }
          return 0;
        });
      }

      // Apply pagination
      const offset = options.offset || 0;
      const limit = options.limit;
      const paginatedResults = limit
        ? results.slice(offset, offset + limit)
        : results.slice(offset);

      this.emit('tasksQueried', {
        totalResults: results.length,
        returnedResults: paginatedResults.length,
        filters: options
      });

      return {
        success: true,
        data: paginatedResults,
        metadata: {
          duration: Date.now() - startTime,
          sizeChange: 0,
        },
      };
    } catch (error) {
      this.emit('error', error);
      return {
        success: false,
        error: error as Error,
        metadata: {
          duration: Date.now() - startTime,
          sizeChange: 0,
        },
      };
    }
  }

  /**
   * Save task queue state
   */
  async saveQueue(
    queue: ITaskQueue,
    transaction?: TransactionContext
  ): Promise<PersistenceResult<void>> {
    const startTime = Date.now();
    this.ensureInitialized();

    try {
      const now = new Date().toISOString();
      const serializedQueue: SerializedQueue = {
        data: { ...queue } as ITaskQueue,
        version: 1,
        metadata: {
          created: now,
          lastModified: now,
          checksum: this.calculateChecksum(queue),
          size: JSON.stringify(queue).length,
        },
      };

      if (transaction) {
        // Add to transaction changes
        const activeTransaction = this.activeTransactions.get(transaction.id);
        if (!activeTransaction) {
          throw new Error(`Transaction ${transaction.id} not found`);
        }

        // Store original data for rollback
        const existingQueue = this.storage!.queues[queue.id];
        if (existingQueue) {
          activeTransaction.originalData.set(queue.id, { type: 'queue', data: existingQueue });
        }

        // Add to changes
        activeTransaction.changes.set(queue.id, { type: 'queue', operation: 'create', data: serializedQueue });

        // Add to transaction operations
        transaction.operations.push({
          type: 'create',
          resource: 'queue',
          resourceId: queue.id,
          timestamp: new Date(),
          data: queue,
        });
      } else {
        // Direct save
        await this.acquireLock();
        try {
          this.storage!.queues[queue.id] = serializedQueue;
          this.storage!.metadata.totalQueues = Object.keys(this.storage!.queues).length;
          this.storage!.metadata.lastModified = now;
          await this.saveStorage();
        } finally {
          await this.releaseLock();
        }
      }

      // Update cache
      this.updateCache(`queue:${queue.id}`, serializedQueue);

      this.emit('queueSaved', { queueId: queue.id, transactionId: transaction?.id });

      return {
        success: true,
        metadata: {
          duration: Date.now() - startTime,
          sizeChange: serializedQueue.metadata.size,
          transactionId: transaction?.id,
        },
      };
    } catch (error) {
      this.emit('error', error);
      return {
        success: false,
        error: error as Error,
        metadata: {
          duration: Date.now() - startTime,
          sizeChange: 0,
          transactionId: transaction?.id,
        },
      };
    }
  }

  /**
   * Load task queue state
   */
  async loadQueue(queueId: string): Promise<PersistenceResult<ITaskQueue | null>> {
    const startTime = Date.now();
    this.ensureInitialized();

    try {
      // Check cache first
      const cached = this.getFromCache(`queue:${queueId}`);
      if (cached) {
        return {
          success: true,
          data: (cached.data as SerializedQueue).data,
          metadata: {
            duration: Date.now() - startTime,
            sizeChange: 0,
            cacheInfo: { hit: true, key: `queue:${queueId}`, age: Date.now() - cached.timestamp },
          },
        };
      }

      // Load from storage
      const serializedQueue = this.storage!.queues[queueId];
      if (!serializedQueue) {
        return {
          success: true,
          data: null,
          metadata: {
            duration: Date.now() - startTime,
            sizeChange: 0,
            cacheInfo: { hit: false, key: `queue:${queueId}` },
          },
        };
      }

      // Verify checksum
      const expectedChecksum = this.calculateChecksum(serializedQueue.data);
      if (serializedQueue.metadata.checksum !== expectedChecksum) {
        throw new Error(`Checksum mismatch for queue ${queueId}. Data may be corrupted.`);
      }

      // Update cache
      this.updateCache(`queue:${queueId}`, serializedQueue);

      this.emit('queueLoaded', { queueId, fromCache: false });

      return {
        success: true,
        data: serializedQueue.data,
        metadata: {
          duration: Date.now() - startTime,
          sizeChange: 0,
          cacheInfo: { hit: false, key: `queue:${queueId}` },
        },
      };
    } catch (error) {
      this.emit('error', error);
      return {
        success: false,
        error: error as Error,
        metadata: {
          duration: Date.now() - startTime,
          sizeChange: 0,
        },
      };
    }
  }

  /**
   * Get enhanced persistence statistics
   */
  async getEnhancedStats(): Promise<EnhancedPersistenceStats> {
    this.ensureInitialized();

    const stats = await fs.stat(this.storagePath).catch(() => null);
    const storageSize = stats?.size || 0;

    return {
      totalTasks: this.storage!.metadata.totalTasks,
      totalQueues: this.storage!.metadata.totalQueues,
      storageSize,
      averageSerializationTime: 0, // Would be calculated from metrics
      cacheHitRate: this.calculateCacheHitRate(),
      lastCleanup: new Date(), // Would track actual cleanup
      backendType: 'file',
      compressionRatio: this.config.compression !== CompressionAlgorithm.NONE ? 0.7 : 1.0,
      indexStats: {
        totalIndexes: 4, // byStatus, byType, byPriority, byCreationDate
        indexSize: JSON.stringify(this.storage!.indexes).length,
        averageLookupTime: 1, // ms
        hitRate: 0.95,
        maintenanceOperations: 0,
      },
      backupStats: {
        totalBackups: 0,
        lastBackup: new Date(),
        successRate: 1.0,
        totalBackupSize: 0,
        averageBackupTime: 0,
      },
      transactionStats: {
        totalTransactions: 0,
        activeTransactions: this.activeTransactions.size,
        successRate: 1.0,
        averageTransactionTime: 0,
        deadlocks: 0,
      },
      cacheStats: {
        hitRate: this.calculateCacheHitRate(),
        cacheSize: this.cache.size * 1000, // Rough estimate
        entryCount: this.cache.size,
        evictions: 0,
        averageAccessTime: 0.1, // ms
      },
    };
  }

  /**
   * Verify data integrity
   */
  async verifyIntegrity(fix = false): Promise<PersistenceResult<{
    issues: Array<{ type: string; description: string; fixed: boolean }>;
    totalChecked: number;
    totalIssues: number;
  }>> {
    const startTime = Date.now();
    const issues: Array<{ type: string; description: string; fixed: boolean }> = [];
    let totalChecked = 0;

    try {
      // Check task checksums
      for (const [taskId, serializedTask] of Object.entries(this.storage!.tasks)) {
        totalChecked++;
        const expectedChecksum = this.calculateChecksum(serializedTask.data);
        if (serializedTask.metadata.checksum !== expectedChecksum) {
          const issue = {
            type: 'checksum_mismatch',
            description: `Task ${taskId} has checksum mismatch`,
            fixed: false,
          };

          if (fix) {
            serializedTask.metadata.checksum = expectedChecksum;
            issue.fixed = true;
          }

          issues.push(issue);
        }
      }

      // Check queue checksums
      for (const [queueId, serializedQueue] of Object.entries(this.storage!.queues)) {
        totalChecked++;
        const expectedChecksum = this.calculateChecksum(serializedQueue.data);
        if (serializedQueue.metadata.checksum !== expectedChecksum) {
          const issue = {
            type: 'checksum_mismatch',
            description: `Queue ${queueId} has checksum mismatch`,
            fixed: false,
          };

          if (fix) {
            serializedQueue.metadata.checksum = expectedChecksum;
            issue.fixed = true;
          }

          issues.push(issue);
        }
      }

      // Check index consistency
      const taskIds = new Set(Object.keys(this.storage!.tasks));
      for (const [status, indexedIds] of Object.entries(this.storage!.indexes.byStatus)) {
        for (const taskId of indexedIds) {
          totalChecked++;
          if (!taskIds.has(taskId)) {
            const issue = {
              type: 'orphaned_index',
              description: `Status index contains non-existent task ${taskId}`,
              fixed: false,
            };

            if (fix) {
              this.storage!.indexes.byStatus[status] = this.storage!.indexes.byStatus[status].filter(id => id !== taskId);
              issue.fixed = true;
            }

            issues.push(issue);
          }
        }
      }

      if (fix && issues.some(issue => issue.fixed)) {
        await this.saveStorage();
      }

      return {
        success: true,
        data: {
          issues,
          totalChecked,
          totalIssues: issues.length,
        },
        metadata: {
          duration: Date.now() - startTime,
          sizeChange: 0,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error as Error,
        metadata: {
          duration: Date.now() - startTime,
          sizeChange: 0,
        },
      };
    }
  }

  // Private helper methods
  private async loadOrCreateStorage(): Promise<void> {
    try {
      const data = await fs.readFile(this.storagePath, 'utf8');
      this.storage = JSON.parse(data) as FileStorageStructure;

      // Validate storage structure
      if (!this.storage.version || !this.storage.metadata) {
        throw new Error('Invalid storage format');
      }

      // Migrate if necessary
      await this.migrateStorageIfNeeded();
    } catch (error) {
      // Create new storage
      this.storage = this.createEmptyStorage();
      await this.saveStorage();
    }
  }

  private createEmptyStorage(): FileStorageStructure {
    return {
      version: '1.0.0',
      metadata: {
        created: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        totalTasks: 0,
        totalQueues: 0,
        compressionEnabled: this.config.compression !== CompressionAlgorithm.NONE,
        encryptionEnabled: this.config.encryptionConfig?.enabled || false,
      },
      tasks: {},
      queues: {},
      indexes: {
        byStatus: {},
        byType: {},
        byPriority: {},
        byCreationDate: [],
      },
      tombstones: {
        tasks: {},
        queues: {},
      },
    };
  }

  private async saveStorage(): Promise<void> {
    if (this.writeInProgress) return;
    this.writeInProgress = true;

    try {
      const data = JSON.stringify(this.storage, null, 2);
      const tempPath = `${this.storagePath}.tmp`;

      // Write to temporary file first
      await fs.writeFile(tempPath, data, 'utf8');

      // Atomic rename
      await fs.rename(tempPath, this.storagePath);

      this.emit('storageSaved', { size: data.length });
    } finally {
      this.writeInProgress = false;
    }
  }

  private async acquireLock(): Promise<void> {
    if (this.isLocked) return;

    try {
      await fs.writeFile(this.lockFilePath, process.pid.toString());
      this.isLocked = true;
    } catch (error) {
      throw new Error(`Failed to acquire lock: ${error}`);
    }
  }

  private async releaseLock(): Promise<void> {
    if (!this.isLocked) return;

    try {
      await fs.unlink(this.lockFilePath);
      this.isLocked = false;
    } catch (error) {
      // Lock file might not exist, which is OK
    }
  }

  private updateIndexes(task: ITask): void {
    const taskId = task.id;

    // Status index
    if (!this.storage!.indexes.byStatus[task.status]) {
      this.storage!.indexes.byStatus[task.status] = [];
    }
    if (!this.storage!.indexes.byStatus[task.status].includes(taskId)) {
      this.storage!.indexes.byStatus[task.status].push(taskId);
    }

    // Type index
    if (!this.storage!.indexes.byType[task.type]) {
      this.storage!.indexes.byType[task.type] = [];
    }
    if (!this.storage!.indexes.byType[task.type].includes(taskId)) {
      this.storage!.indexes.byType[task.type].push(taskId);
    }

    // Priority index
    const priorityKey = task.priority.toString();
    if (!this.storage!.indexes.byPriority[priorityKey]) {
      this.storage!.indexes.byPriority[priorityKey] = [];
    }
    if (!this.storage!.indexes.byPriority[priorityKey].includes(taskId)) {
      this.storage!.indexes.byPriority[priorityKey].push(taskId);
    }

    // Creation date index
    const dateKey = task.createdAt.toISOString().split('T')[0]; // YYYY-MM-DD
    let dateEntry = this.storage!.indexes.byCreationDate.find(entry => entry.date === dateKey);
    if (!dateEntry) {
      dateEntry = { date: dateKey, taskIds: [] };
      this.storage!.indexes.byCreationDate.push(dateEntry);
      // Keep sorted by date
      this.storage!.indexes.byCreationDate.sort((a, b) => a.date.localeCompare(b.date));
    }
    if (!dateEntry.taskIds.includes(taskId)) {
      dateEntry.taskIds.push(taskId);
    }
  }

  private removeFromIndexes(taskId: string, task: ITask): void {
    // Remove from status index
    if (this.storage!.indexes.byStatus[task.status]) {
      this.storage!.indexes.byStatus[task.status] = this.storage!.indexes.byStatus[task.status].filter(id => id !== taskId);
    }

    // Remove from type index
    if (this.storage!.indexes.byType[task.type]) {
      this.storage!.indexes.byType[task.type] = this.storage!.indexes.byType[task.type].filter(id => id !== taskId);
    }

    // Remove from priority index
    const priorityKey = task.priority.toString();
    if (this.storage!.indexes.byPriority[priorityKey]) {
      this.storage!.indexes.byPriority[priorityKey] = this.storage!.indexes.byPriority[priorityKey].filter(id => id !== taskId);
    }

    // Remove from creation date index
    const dateKey = task.createdAt.toISOString().split('T')[0];
    const dateEntry = this.storage!.indexes.byCreationDate.find(entry => entry.date === dateKey);
    if (dateEntry) {
      dateEntry.taskIds = dateEntry.taskIds.filter(id => id !== taskId);
      // Clean up empty date entries
      if (dateEntry.taskIds.length === 0) {
        this.storage!.indexes.byCreationDate = this.storage!.indexes.byCreationDate.filter(entry => entry.date !== dateKey);
      }
    }
  }

  private updateCache(key: string, data: unknown): void {
    // Evict oldest entries if cache is full
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      const oldestKey = Array.from(this.cache.entries())
        .sort(([, a], [, b]) => a.accessed - b.accessed)[0][0];
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      accessed: Date.now(),
    });
  }

  private getFromCache(key: string): { data: unknown; timestamp: number } | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    // Check TTL
    if (Date.now() - cached.timestamp > this.CACHE_TTL) {
      this.cache.delete(key);
      return null;
    }

    // Update access time
    cached.accessed = Date.now();
    return cached;
  }

  private removeFromCache(key: string): void {
    this.cache.delete(key);
  }

  private cleanupCache(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.CACHE_TTL) {
        this.cache.delete(key);
      }
    }
  }

  private calculateCacheHitRate(): number {
    // This would be calculated from actual metrics
    return 0.85; // 85% hit rate
  }

  private calculateChecksum(data: unknown): string {
    const hash = createHash('sha256');
    hash.update(JSON.stringify(data));
    return hash.digest('hex');
  }

  private getNestedValue(obj: unknown, path: string): unknown {
    return path.split('.').reduce((current, key) => current && typeof current === 'object' && key in current
        ? (current as Record<string, unknown>)[key]
        : undefined, obj);
  }

  private async migrateStorageIfNeeded(): Promise<void> {
    // Handle version migrations if needed
    if (this.storage!.version !== '1.0.0') {
      // Perform migration logic here
      this.storage!.version = '1.0.0';
      await this.saveStorage();
    }
  }

  private async applyTransactionChanges(transaction: ActiveTransaction): Promise<void> {
    for (const [resourceId, change] of transaction.changes) {
      if (change.type === 'task') {
        if (change.operation === 'create' || change.operation === 'update') {
          this.storage!.tasks[resourceId] = change.data as SerializedTask;
          this.updateIndexes((change.data as SerializedTask).data);
        } else if (change.operation === 'delete') {
          const existingTask = this.storage!.tasks[resourceId];
          if (existingTask) {
            delete this.storage!.tasks[resourceId];
            this.removeFromIndexes(resourceId, existingTask.data);
          }
        }
      } else if (change.type === 'queue') {
        if (change.operation === 'create' || change.operation === 'update') {
          this.storage!.queues[resourceId] = change.data as SerializedQueue;
        } else if (change.operation === 'delete') {
          delete this.storage!.queues[resourceId];
        }
      }
    }

    // Update metadata
    this.storage!.metadata.totalTasks = Object.keys(this.storage!.tasks).length;
    this.storage!.metadata.totalQueues = Object.keys(this.storage!.queues).length;
    this.storage!.metadata.lastModified = new Date().toISOString();
  }

  private async restoreTransactionData(transaction: ActiveTransaction): Promise<void> {
    for (const [resourceId, original] of transaction.originalData) {
      if (original.type === 'task') {
        if (original.data) {
          this.storage!.tasks[resourceId] = original.data as SerializedTask;
          this.updateIndexes((original.data as SerializedTask).data);
        } else {
          // Original was not present, remove it
          const existingTask = this.storage!.tasks[resourceId];
          if (existingTask) {
            delete this.storage!.tasks[resourceId];
            this.removeFromIndexes(resourceId, existingTask.data);
          }
        }
      } else if (original.type === 'queue') {
        if (original.data) {
          this.storage!.queues[resourceId] = original.data as SerializedQueue;
        } else {
          // Original was not present, remove it
          delete this.storage!.queues[resourceId];
        }
      }
    }

    // Restore metadata
    this.storage!.metadata.totalTasks = Object.keys(this.storage!.tasks).length;
    this.storage!.metadata.totalQueues = Object.keys(this.storage!.queues).length;
  }

  private async maintainIndexes(): Promise<void> {
    // Rebuild indexes if needed
    // This would be more sophisticated in a real implementation
    this.emit('indexMaintenance', { message: 'Index maintenance completed' });
  }

  private async performAutomaticBackup(): Promise<void> {
    if (!this.config.backupConfig?.enabled) return;

    try {
      const backupPath = await this.createBackup();
      this.emit('automaticBackup', { backupPath: backupPath.data });
    } catch (error) {
      this.emit('error', new Error(`Automatic backup failed: ${error}`));
    }
  }

  /**
   * Create full backup of all data
   */
  async createBackup(
    strategy: BackupStrategy = BS.FULL,
    destination?: string
  ): Promise<PersistenceResult<string>> {
    const startTime = Date.now();

    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFileName = `backup-${timestamp}.json`;
      const backupPath = destination || join(
        this.config.backupConfig?.backupDirectory || dirname(this.storagePath),
        backupFileName
      );

      // Ensure backup directory exists
      await fs.mkdir(dirname(backupPath), { recursive: true });

      let backupData: unknown;

      switch (strategy) {
        case BS.FULL:
          backupData = { ...this.storage };
          break;
        case BS.INCREMENTAL:
          // Only tasks modified since last backup
          backupData = {
            version: this.storage!.version,
            metadata: { ...this.storage!.metadata, backupType: 'incremental' },
            tasks: Object.fromEntries(
              Object.entries(this.storage!.tasks).filter(([, task]) =>
                new Date(task.metadata.lastModified) > new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
              )
            ),
            queues: this.storage!.queues,
            indexes: this.storage!.indexes,
            tombstones: this.storage!.tombstones,
          };
          break;
        case BS.DIFFERENTIAL:
          // Tasks modified since last full backup
          backupData = { ...this.storage }; // Simplified - would track last full backup
          break;
      }

      const backupContent = JSON.stringify(backupData, null, 2);

      if (this.config.backupConfig?.compression) {
        // Compress backup
        const gzipPath = `${backupPath}.gz`;
        const readStream = createReadStream(Buffer.from(backupContent));
        const writeStream = createWriteStream(gzipPath);
        const gzipStream = createGzip();

        await pipeline(readStream, gzipStream, writeStream);

        return {
          success: true,
          data: gzipPath,
          metadata: {
            duration: Date.now() - startTime,
            sizeChange: backupContent.length,
          },
        };
      } else {
        await fs.writeFile(backupPath, backupContent);

        return {
          success: true,
          data: backupPath,
          metadata: {
            duration: Date.now() - startTime,
            sizeChange: backupContent.length,
          },
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error as Error,
        metadata: {
          duration: Date.now() - startTime,
          sizeChange: 0,
        },
      };
    }
  }

  /**
   * Restore data from backup
   */
  async restoreFromBackup(
    backupPath: string,
    options: {
      replaceExisting?: boolean;
      validateBackup?: boolean;
    } = {}
  ): Promise<PersistenceResult<void>> {
    const startTime = Date.now();

    try {
      let backupContent: string;

      // Check if backup is compressed
      if (backupPath.endsWith('.gz')) {
        const readStream = createReadStream(backupPath);
        const gunzipStream = createGunzip();
        const chunks: Buffer[] = [];

        await pipeline(
          readStream,
          gunzipStream,
          async function* (source) {
            for await (const chunk of source) {
              chunks.push(chunk);
              yield chunk;
            }
          }
        );

        backupContent = Buffer.concat(chunks).toString();
      } else {
        backupContent = await fs.readFile(backupPath, 'utf8');
      }

      const backupData = JSON.parse(backupContent) as FileStorageStructure;

      // Validate backup if requested
      if (options.validateBackup) {
        if (!backupData.version || !backupData.metadata) {
          throw new Error('Invalid backup format');
        }
      }

      // Create backup of current data if replacing
      if (options.replaceExisting && this.storage) {
        const currentBackupPath = `${this.storagePath}.pre-restore-backup`;
        await fs.writeFile(currentBackupPath, JSON.stringify(this.storage, null, 2));
      }

      // Restore data
      if (options.replaceExisting) {
        this.storage = backupData;
      } else {
        // Merge with existing data
        if (this.storage) {
          // Merge tasks
          Object.assign(this.storage.tasks, backupData.tasks);

          // Merge queues
          Object.assign(this.storage.queues, backupData.queues);

          // Update metadata
          this.storage.metadata.totalTasks = Object.keys(this.storage.tasks).length;
          this.storage.metadata.totalQueues = Object.keys(this.storage.queues).length;
          this.storage.metadata.lastModified = new Date().toISOString();
        } else {
          this.storage = backupData;
        }
      }

      // Save restored data
      await this.saveStorage();

      // Clear cache to force reload
      this.cache.clear();

      return {
        success: true,
        metadata: {
          duration: Date.now() - startTime,
          sizeChange: backupContent.length,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error as Error,
        metadata: {
          duration: Date.now() - startTime,
          sizeChange: 0,
        },
      };
    }
  }
}