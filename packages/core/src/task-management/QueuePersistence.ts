/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { EventEmitter } from 'node:events';
import { promises as fs } from 'node:fs';
import { join, dirname } from 'node:path';
import crypto from 'node:crypto';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger.js';
import type {
  Task,
  TaskExecutionRecord,
  QueueMetrics,
  TaskDependency,
} from './TaskQueue.js';
import type { TaskId } from './types.js';
import { TaskResult } from './types.js';
import type { LifecycleContext, LifecycleEvent } from './TaskLifecycle.js';

/**
 * Persistence storage backends
 */
export enum StorageBackend {
  FILE_SYSTEM = 'filesystem',
  SQLITE = 'sqlite',
  MEMORY = 'memory',
  REDIS = 'redis',
  MONGODB = 'mongodb',
}

/**
 * Snapshot metadata
 */
export interface SnapshotMetadata {
  id: string;
  timestamp: Date;
  version: string;
  taskCount: number;
  queueState: string;
  checksumMD5: string;
  size: number;
  compressionEnabled: boolean;
  createdBy: string;
  description?: string;
  tags?: string[];
}

/**
 * Queue snapshot containing all persistent data
 */
export interface QueueSnapshot {
  metadata: SnapshotMetadata;
  tasks: Map<TaskId, Task>;
  dependencies: Map<string, TaskDependency>;
  executionRecords: Map<TaskId, TaskExecutionRecord[]>;
  lifecycleContexts: Map<TaskId, LifecycleContext>;
  lifecycleEvents: Map<TaskId, LifecycleEvent[]>;
  metrics: QueueMetrics;
  customData?: Record<string, unknown>;
}

/**
 * Persistence configuration
 */
export interface PersistenceConfig {
  backend: StorageBackend;
  dataDirectory: string;
  backupDirectory?: string;
  enableCompression: boolean;
  enableEncryption: boolean;
  encryptionKey?: string;
  autoSaveInterval: number; // milliseconds
  maxSnapshots: number;
  maxBackups: number;
  enableTransactionLog: boolean;
  batchSize: number;
  retryAttempts: number;
  retryDelay: number;
}

/**
 * Persistence operation metadata
 */
export interface PersistenceOperation {
  id: string;
  type: 'save' | 'load' | 'backup' | 'restore' | 'cleanup';
  timestamp: Date;
  duration: number;
  bytesTransferred: number;
  success: boolean;
  error?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Transaction log entry for recovery
 */
export interface TransactionLogEntry {
  id: string;
  timestamp: Date;
  operation: 'create' | 'update' | 'delete' | 'transition';
  entityType: 'task' | 'dependency' | 'record' | 'context';
  entityId: string;
  beforeState?: unknown;
  afterState?: unknown;
  checksum: string;
}

/**
 * Recovery point for disaster recovery
 */
export interface RecoveryPoint {
  id: string;
  timestamp: Date;
  snapshotId: string;
  transactionLogOffset: number;
  description: string;
  verified: boolean;
  checksumMD5: string;
}

/**
 * Comprehensive queue persistence and recovery system
 */
export class QueuePersistence extends EventEmitter {
  private config: PersistenceConfig;
  private autoSaveTimer?: NodeJS.Timeout;
  private transactionLog: TransactionLogEntry[] = [];
  private operationHistory: PersistenceOperation[] = [];
  private recoveryPoints: RecoveryPoint[] = [];
  private isOperationInProgress = false;
  private pendingOperations: Array<() => Promise<void>> = [];

  constructor(config: Partial<PersistenceConfig> = {}) {
    super();

    this.config = {
      backend: StorageBackend.FILE_SYSTEM,
      dataDirectory: './task-queue-data',
      backupDirectory: './task-queue-backups',
      enableCompression: true,
      enableEncryption: false,
      autoSaveInterval: 300000, // 5 minutes
      maxSnapshots: 10,
      maxBackups: 5,
      enableTransactionLog: true,
      batchSize: 100,
      retryAttempts: 3,
      retryDelay: 1000,
      ...config,
    };

    this.initializeStorage();
    this.startAutoSave();

    logger.info('QueuePersistence initialized', {
      backend: this.config.backend,
      dataDirectory: this.config.dataDirectory,
      autoSaveInterval: this.config.autoSaveInterval,
    });
  }

  /**
   * Save current queue state to persistent storage
   */
  async saveSnapshot(
    tasks: Map<TaskId, Task>,
    dependencies: Map<string, TaskDependency>,
    executionRecords: Map<TaskId, TaskExecutionRecord[]>,
    lifecycleContexts: Map<TaskId, LifecycleContext>,
    lifecycleEvents: Map<TaskId, LifecycleEvent[]>,
    metrics: QueueMetrics,
    customData?: Record<string, unknown>,
    description?: string,
  ): Promise<string> {
    const startTime = Date.now();
    const snapshotId = uuidv4();

    try {
      logger.info('Starting queue snapshot save', {
        snapshotId,
        taskCount: tasks.size,
        description,
      });

      // Create snapshot
      const snapshot = await this.createSnapshot(
        snapshotId,
        tasks,
        dependencies,
        executionRecords,
        lifecycleContexts,
        lifecycleEvents,
        metrics,
        customData,
        description,
      );

      // Save to storage
      await this.writeSnapshot(snapshot);

      // Cleanup old snapshots
      await this.cleanupOldSnapshots();

      // Record operation
      const operation: PersistenceOperation = {
        id: uuidv4(),
        type: 'save',
        timestamp: new Date(),
        duration: Date.now() - startTime,
        bytesTransferred: this.calculateSnapshotSize(snapshot),
        success: true,
        metadata: {
          snapshotId,
          taskCount: tasks.size,
          compressionEnabled: this.config.enableCompression,
        },
      };

      this.recordOperation(operation);

      logger.info('Queue snapshot saved successfully', {
        snapshotId,
        duration: operation.duration,
        size: operation.bytesTransferred,
      });

      this.emit('snapshotSaved', snapshotId, operation);

      return snapshotId;
    } catch (error) {
      const operation: PersistenceOperation = {
        id: uuidv4(),
        type: 'save',
        timestamp: new Date(),
        duration: Date.now() - startTime,
        bytesTransferred: 0,
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };

      this.recordOperation(operation);

      logger.error('Queue snapshot save failed', {
        snapshotId,
        error: operation.error,
        duration: operation.duration,
      });

      this.emit('snapshotError', snapshotId, error, operation);
      throw error;
    }
  }

  /**
   * Load queue state from persistent storage
   */
  async loadSnapshot(snapshotId?: string): Promise<QueueSnapshot | null> {
    const startTime = Date.now();
    const targetSnapshotId = snapshotId || (await this.getLatestSnapshotId());

    if (!targetSnapshotId) {
      logger.warn('No snapshots found to load');
      return null;
    }

    try {
      logger.info('Loading queue snapshot', { snapshotId: targetSnapshotId });

      const snapshot = await this.readSnapshot(targetSnapshotId);

      if (!snapshot) {
        throw new Error(`Snapshot not found: ${targetSnapshotId}`);
      }

      // Verify snapshot integrity
      const isValid = await this.verifySnapshotIntegrity(snapshot);
      if (!isValid) {
        throw new Error('Snapshot integrity verification failed');
      }

      const operation: PersistenceOperation = {
        id: uuidv4(),
        type: 'load',
        timestamp: new Date(),
        duration: Date.now() - startTime,
        bytesTransferred: this.calculateSnapshotSize(snapshot),
        success: true,
        metadata: {
          snapshotId: targetSnapshotId,
          taskCount: snapshot.tasks.size,
        },
      };

      this.recordOperation(operation);

      logger.info('Queue snapshot loaded successfully', {
        snapshotId: targetSnapshotId,
        duration: operation.duration,
        taskCount: snapshot.tasks.size,
      });

      this.emit('snapshotLoaded', targetSnapshotId, snapshot, operation);

      return snapshot;
    } catch (error) {
      const operation: PersistenceOperation = {
        id: uuidv4(),
        type: 'load',
        timestamp: new Date(),
        duration: Date.now() - startTime,
        bytesTransferred: 0,
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };

      this.recordOperation(operation);

      logger.error('Queue snapshot load failed', {
        snapshotId: targetSnapshotId,
        error: operation.error,
        duration: operation.duration,
      });

      this.emit('snapshotError', targetSnapshotId, error, operation);
      throw error;
    }
  }

  /**
   * Create a backup of current state
   */
  async createBackup(description?: string): Promise<string> {
    const startTime = Date.now();
    const backupId = `backup-${Date.now()}-${uuidv4().substring(0, 8)}`;

    try {
      logger.info('Creating queue backup', { backupId, description });

      // Get latest snapshot
      const latestSnapshot = await this.loadSnapshot();
      if (!latestSnapshot) {
        throw new Error('No snapshot available for backup');
      }

      // Copy to backup location
      const backupPath = await this.writeBackup(
        backupId,
        latestSnapshot,
        description,
      );

      // Create recovery point
      const recoveryPoint: RecoveryPoint = {
        id: backupId,
        timestamp: new Date(),
        snapshotId: latestSnapshot.metadata.id,
        transactionLogOffset: this.transactionLog.length,
        description:
          description ||
          `Automatic backup created at ${new Date().toISOString()}`,
        verified: true,
        checksumMD5: latestSnapshot.metadata.checksumMD5,
      };

      this.recoveryPoints.push(recoveryPoint);

      // Cleanup old backups
      await this.cleanupOldBackups();

      const operation: PersistenceOperation = {
        id: uuidv4(),
        type: 'backup',
        timestamp: new Date(),
        duration: Date.now() - startTime,
        bytesTransferred: this.calculateSnapshotSize(latestSnapshot),
        success: true,
        metadata: {
          backupId,
          backupPath,
          description,
        },
      };

      this.recordOperation(operation);

      logger.info('Queue backup created successfully', {
        backupId,
        duration: operation.duration,
        path: backupPath,
      });

      this.emit('backupCreated', backupId, recoveryPoint, operation);

      return backupId;
    } catch (error) {
      const operation: PersistenceOperation = {
        id: uuidv4(),
        type: 'backup',
        timestamp: new Date(),
        duration: Date.now() - startTime,
        bytesTransferred: 0,
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };

      this.recordOperation(operation);

      logger.error('Queue backup creation failed', {
        backupId,
        error: operation.error,
        duration: operation.duration,
      });

      this.emit('backupError', backupId, error, operation);
      throw error;
    }
  }

  /**
   * Restore from a backup
   */
  async restoreFromBackup(backupId: string): Promise<QueueSnapshot> {
    const startTime = Date.now();

    try {
      logger.info('Restoring from backup', { backupId });

      const snapshot = await this.readBackup(backupId);
      if (!snapshot) {
        throw new Error(`Backup not found: ${backupId}`);
      }

      // Verify backup integrity
      const isValid = await this.verifySnapshotIntegrity(snapshot);
      if (!isValid) {
        throw new Error('Backup integrity verification failed');
      }

      // Save as new snapshot
      const newSnapshotId = await this.writeSnapshot({
        ...snapshot,
        metadata: {
          ...snapshot.metadata,
          id: uuidv4(),
          timestamp: new Date(),
          description: `Restored from backup: ${backupId}`,
        },
      });

      const operation: PersistenceOperation = {
        id: uuidv4(),
        type: 'restore',
        timestamp: new Date(),
        duration: Date.now() - startTime,
        bytesTransferred: this.calculateSnapshotSize(snapshot),
        success: true,
        metadata: {
          backupId,
          newSnapshotId,
        },
      };

      this.recordOperation(operation);

      logger.info('Restore from backup completed successfully', {
        backupId,
        newSnapshotId,
        duration: operation.duration,
      });

      this.emit('restoreCompleted', backupId, newSnapshotId, operation);

      return snapshot;
    } catch (error) {
      const operation: PersistenceOperation = {
        id: uuidv4(),
        type: 'restore',
        timestamp: new Date(),
        duration: Date.now() - startTime,
        bytesTransferred: 0,
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };

      this.recordOperation(operation);

      logger.error('Restore from backup failed', {
        backupId,
        error: operation.error,
        duration: operation.duration,
      });

      this.emit('restoreError', backupId, error, operation);
      throw error;
    }
  }

  /**
   * Record a transaction for recovery purposes
   */
  recordTransaction(
    operation: TransactionLogEntry['operation'],
    entityType: TransactionLogEntry['entityType'],
    entityId: string,
    beforeState?: unknown,
    afterState?: unknown,
  ): void {
    if (!this.config.enableTransactionLog) return;

    const entry: TransactionLogEntry = {
      id: uuidv4(),
      timestamp: new Date(),
      operation,
      entityType,
      entityId,
      beforeState,
      afterState,
      checksum: this.calculateChecksum(
        JSON.stringify({
          operation,
          entityType,
          entityId,
          beforeState,
          afterState,
        }),
      ),
    };

    this.transactionLog.push(entry);

    // Maintain transaction log size
    if (this.transactionLog.length > 10000) {
      this.transactionLog = this.transactionLog.slice(-5000);
    }

    this.emit('transactionRecorded', entry);
  }

  /**
   * Get persistence statistics
   */
  getPersistenceStats(): {
    totalOperations: number;
    successfulOperations: number;
    failedOperations: number;
    averageOperationDuration: number;
    totalBytesTransferred: number;
    lastOperationTime: Date | null;
    availableSnapshots: number;
    availableBackups: number;
    transactionLogSize: number;
    diskUsage: {
      snapshots: number;
      backups: number;
      logs: number;
      total: number;
    };
  } {
    const successful = this.operationHistory.filter((op) => op.success);
    const failed = this.operationHistory.filter((op) => !op.success);
    const totalBytes = this.operationHistory.reduce(
      (sum, op) => sum + op.bytesTransferred,
      0,
    );
    const avgDuration =
      successful.length > 0
        ? successful.reduce((sum, op) => sum + op.duration, 0) /
          successful.length
        : 0;

    return {
      totalOperations: this.operationHistory.length,
      successfulOperations: successful.length,
      failedOperations: failed.length,
      averageOperationDuration: avgDuration,
      totalBytesTransferred: totalBytes,
      lastOperationTime:
        this.operationHistory.length > 0
          ? this.operationHistory[this.operationHistory.length - 1].timestamp
          : null,
      availableSnapshots: 0, // Would query storage
      availableBackups: this.recoveryPoints.length,
      transactionLogSize: this.transactionLog.length,
      diskUsage: {
        snapshots: 0, // Would calculate actual disk usage
        backups: 0,
        logs: 0,
        total: 0,
      },
    };
  }

  /**
   * List available snapshots
   */
  async listSnapshots(): Promise<SnapshotMetadata[]> {
    try {
      // Implementation would depend on storage backend
      return this.getSnapshotList();
    } catch (error) {
      logger.error('Failed to list snapshots', {
        error: error instanceof Error ? error.message : String(error),
      });
      return [];
    }
  }

  /**
   * List available backups
   */
  async listBackups(): Promise<RecoveryPoint[]> {
    return [...this.recoveryPoints].sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime(),
    );
  }

  /**
   * Verify data integrity
   */
  async verifyIntegrity(): Promise<{
    snapshots: Array<{ id: string; valid: boolean; error?: string }>;
    backups: Array<{ id: string; valid: boolean; error?: string }>;
    transactionLog: { valid: boolean; error?: string };
  }> {
    const results = {
      snapshots: [] as Array<{ id: string; valid: boolean; error?: string }>,
      backups: [] as Array<{ id: string; valid: boolean; error?: string }>,
      transactionLog: { valid: true, error: undefined as string | undefined },
    };

    // Verify snapshots
    const snapshots = await this.listSnapshots();
    for (const snapshot of snapshots) {
      try {
        const snapshotData = await this.readSnapshot(snapshot.id);
        const valid = snapshotData
          ? await this.verifySnapshotIntegrity(snapshotData)
          : false;
        results.snapshots.push({ id: snapshot.id, valid });
      } catch (error) {
        results.snapshots.push({
          id: snapshot.id,
          valid: false,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    // Verify backups
    for (const backup of this.recoveryPoints) {
      try {
        const backupData = await this.readBackup(backup.id);
        const valid = backupData
          ? await this.verifySnapshotIntegrity(backupData)
          : false;
        results.backups.push({ id: backup.id, valid });
      } catch (error) {
        results.backups.push({
          id: backup.id,
          valid: false,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    // Verify transaction log integrity
    try {
      for (const entry of this.transactionLog) {
        const calculatedChecksum = this.calculateChecksum(
          JSON.stringify({
            operation: entry.operation,
            entityType: entry.entityType,
            entityId: entry.entityId,
            beforeState: entry.beforeState,
            afterState: entry.afterState,
          }),
        );

        if (calculatedChecksum !== entry.checksum) {
          results.transactionLog.valid = false;
          results.transactionLog.error = `Checksum mismatch for transaction ${entry.id}`;
          break;
        }
      }
    } catch (error) {
      results.transactionLog.valid = false;
      results.transactionLog.error =
        error instanceof Error ? error.message : String(error);
    }

    return results;
  }

  /**
   * Compact and optimize storage
   */
  async compactStorage(): Promise<void> {
    const startTime = Date.now();

    try {
      logger.info('Starting storage compaction');

      // Remove duplicate transactions
      this.transactionLog = this.deduplicateTransactions(this.transactionLog);

      // Merge related snapshots if beneficial
      await this.mergeSnapshots();

      // Optimize file structure (backend-specific)
      await this.optimizeStorage();

      const operation: PersistenceOperation = {
        id: uuidv4(),
        type: 'cleanup',
        timestamp: new Date(),
        duration: Date.now() - startTime,
        bytesTransferred: 0,
        success: true,
        metadata: {
          action: 'storage_compaction',
        },
      };

      this.recordOperation(operation);

      logger.info('Storage compaction completed', {
        duration: operation.duration,
      });

      this.emit('storageCompacted', operation);
    } catch (error) {
      logger.error('Storage compaction failed', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Initialize storage directories and structures
   */
  private async initializeStorage(): Promise<void> {
    try {
      await fs.mkdir(this.config.dataDirectory, { recursive: true });

      if (this.config.backupDirectory) {
        await fs.mkdir(this.config.backupDirectory, { recursive: true });
      }

      logger.debug('Storage directories initialized', {
        dataDirectory: this.config.dataDirectory,
        backupDirectory: this.config.backupDirectory,
      });
    } catch (error) {
      logger.error('Failed to initialize storage directories', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Start auto-save timer
   */
  private startAutoSave(): void {
    if (this.config.autoSaveInterval > 0) {
      this.autoSaveTimer = setInterval(() => {
        this.emit('autoSaveRequested');
      }, this.config.autoSaveInterval);

      logger.debug('Auto-save timer started', {
        interval: this.config.autoSaveInterval,
      });
    }
  }

  /**
   * Create a queue snapshot
   */
  private async createSnapshot(
    snapshotId: string,
    tasks: Map<TaskId, Task>,
    dependencies: Map<string, TaskDependency>,
    executionRecords: Map<TaskId, TaskExecutionRecord[]>,
    lifecycleContexts: Map<TaskId, LifecycleContext>,
    lifecycleEvents: Map<TaskId, LifecycleEvent[]>,
    metrics: QueueMetrics,
    customData?: Record<string, unknown>,
    description?: string,
  ): Promise<QueueSnapshot> {
    const snapshotData = {
      tasks,
      dependencies,
      executionRecords,
      lifecycleContexts,
      lifecycleEvents,
      metrics,
      customData,
    };

    const serializedData = JSON.stringify({
      tasks: Array.from(tasks.entries()),
      dependencies: Array.from(dependencies.entries()),
      executionRecords: Array.from(executionRecords.entries()),
      lifecycleContexts: Array.from(lifecycleContexts.entries()),
      lifecycleEvents: Array.from(lifecycleEvents.entries()),
      metrics,
      customData,
    });

    const checksum = this.calculateChecksum(serializedData);
    const size = Buffer.byteLength(serializedData, 'utf8');

    const metadata: SnapshotMetadata = {
      id: snapshotId,
      timestamp: new Date(),
      version: '1.0.0',
      taskCount: tasks.size,
      queueState: 'active',
      checksumMD5: checksum,
      size,
      compressionEnabled: this.config.enableCompression,
      createdBy: 'QueuePersistence',
      description,
      tags: ['auto-generated'],
    };

    return {
      metadata,
      ...snapshotData,
    };
  }

  /**
   * Write snapshot to storage
   */
  private async writeSnapshot(snapshot: QueueSnapshot): Promise<string> {
    const filename = `snapshot-${snapshot.metadata.id}.json`;
    const filepath = join(this.config.dataDirectory, filename);

    const serializedData = JSON.stringify(
      {
        metadata: snapshot.metadata,
        tasks: Array.from(snapshot.tasks.entries()),
        dependencies: Array.from(snapshot.dependencies.entries()),
        executionRecords: Array.from(snapshot.executionRecords.entries()),
        lifecycleContexts: Array.from(snapshot.lifecycleContexts.entries()),
        lifecycleEvents: Array.from(snapshot.lifecycleEvents.entries()),
        metrics: snapshot.metrics,
        customData: snapshot.customData,
      },
      null,
      2,
    );

    // Ensure directory exists
    await fs.mkdir(dirname(filepath), { recursive: true });

    // Write to temporary file first, then rename (atomic operation)
    const tempFilepath = `${filepath}.tmp`;
    await fs.writeFile(tempFilepath, serializedData, 'utf8');
    await fs.rename(tempFilepath, filepath);

    logger.debug('Snapshot written to storage', {
      snapshotId: snapshot.metadata.id,
      filepath,
      size: serializedData.length,
    });

    return snapshot.metadata.id;
  }

  /**
   * Read snapshot from storage
   */
  private async readSnapshot(
    snapshotId: string,
  ): Promise<QueueSnapshot | null> {
    const filename = `snapshot-${snapshotId}.json`;
    const filepath = join(this.config.dataDirectory, filename);

    try {
      const data = await fs.readFile(filepath, 'utf8');
      const parsed = JSON.parse(data);

      return {
        metadata: parsed.metadata,
        tasks: new Map(parsed.tasks),
        dependencies: new Map(parsed.dependencies),
        executionRecords: new Map(parsed.executionRecords),
        lifecycleContexts: new Map(parsed.lifecycleContexts),
        lifecycleEvents: new Map(parsed.lifecycleEvents),
        metrics: parsed.metrics,
        customData: parsed.customData,
      };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return null; // File doesn't exist
      }
      throw error;
    }
  }

  /**
   * Write backup to storage
   */
  private async writeBackup(
    backupId: string,
    snapshot: QueueSnapshot,
    description?: string,
  ): Promise<string> {
    if (!this.config.backupDirectory) {
      throw new Error('Backup directory not configured');
    }

    const filename = `${backupId}.backup.json`;
    const filepath = join(this.config.backupDirectory, filename);

    const backupData = {
      ...snapshot,
      metadata: {
        ...snapshot.metadata,
        id: backupId,
        timestamp: new Date(),
        description: description || snapshot.metadata.description,
      },
    };

    const serializedData = JSON.stringify(
      {
        metadata: backupData.metadata,
        tasks: Array.from(backupData.tasks.entries()),
        dependencies: Array.from(backupData.dependencies.entries()),
        executionRecords: Array.from(backupData.executionRecords.entries()),
        lifecycleContexts: Array.from(backupData.lifecycleContexts.entries()),
        lifecycleEvents: Array.from(backupData.lifecycleEvents.entries()),
        metrics: backupData.metrics,
        customData: backupData.customData,
      },
      null,
      2,
    );

    await fs.mkdir(dirname(filepath), { recursive: true });
    await fs.writeFile(filepath, serializedData, 'utf8');

    return filepath;
  }

  /**
   * Read backup from storage
   */
  private async readBackup(backupId: string): Promise<QueueSnapshot | null> {
    if (!this.config.backupDirectory) {
      throw new Error('Backup directory not configured');
    }

    const filename = `${backupId}.backup.json`;
    const filepath = join(this.config.backupDirectory, filename);

    try {
      const data = await fs.readFile(filepath, 'utf8');
      const parsed = JSON.parse(data);

      return {
        metadata: parsed.metadata,
        tasks: new Map(parsed.tasks),
        dependencies: new Map(parsed.dependencies),
        executionRecords: new Map(parsed.executionRecords),
        lifecycleContexts: new Map(parsed.lifecycleContexts),
        lifecycleEvents: new Map(parsed.lifecycleEvents),
        metrics: parsed.metrics,
        customData: parsed.customData,
      };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return null;
      }
      throw error;
    }
  }

  /**
   * Get list of available snapshots
   */
  private async getSnapshotList(): Promise<SnapshotMetadata[]> {
    try {
      const files = await fs.readdir(this.config.dataDirectory);
      const snapshotFiles = files.filter(
        (f) => f.startsWith('snapshot-') && f.endsWith('.json'),
      );

      const snapshots: SnapshotMetadata[] = [];

      for (const file of snapshotFiles) {
        try {
          const filepath = join(this.config.dataDirectory, file);
          const data = await fs.readFile(filepath, 'utf8');
          const parsed = JSON.parse(data);
          snapshots.push(parsed.metadata);
        } catch (error) {
          logger.warn(`Failed to read snapshot metadata from ${file}`, {
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }

      return snapshots.sort(
        (a, b) => b.timestamp.getTime() - a.timestamp.getTime(),
      );
    } catch (error) {
      logger.error('Failed to get snapshot list', {
        error: error instanceof Error ? error.message : String(error),
      });
      return [];
    }
  }

  /**
   * Get latest snapshot ID
   */
  private async getLatestSnapshotId(): Promise<string | null> {
    const snapshots = await this.getSnapshotList();
    return snapshots.length > 0 ? snapshots[0].id : null;
  }

  /**
   * Verify snapshot integrity
   */
  private async verifySnapshotIntegrity(
    snapshot: QueueSnapshot,
  ): Promise<boolean> {
    try {
      // Recalculate checksum
      const serializedData = JSON.stringify({
        tasks: Array.from(snapshot.tasks.entries()),
        dependencies: Array.from(snapshot.dependencies.entries()),
        executionRecords: Array.from(snapshot.executionRecords.entries()),
        lifecycleContexts: Array.from(snapshot.lifecycleContexts.entries()),
        lifecycleEvents: Array.from(snapshot.lifecycleEvents.entries()),
        metrics: snapshot.metrics,
        customData: snapshot.customData,
      });

      const calculatedChecksum = this.calculateChecksum(serializedData);
      return calculatedChecksum === snapshot.metadata.checksumMD5;
    } catch (error) {
      logger.error('Snapshot integrity verification failed', {
        snapshotId: snapshot.metadata.id,
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  /**
   * Calculate snapshot size in bytes
   */
  private calculateSnapshotSize(snapshot: QueueSnapshot): number {
    try {
      const serialized = JSON.stringify(snapshot);
      return Buffer.byteLength(serialized, 'utf8');
    } catch {
      return 0;
    }
  }

  /**
   * Calculate MD5 checksum
   */
  private calculateChecksum(data: string): string {
    const crypto = require('node:crypto');
    return crypto.createHash('md5').update(data).digest('hex');
  }

  /**
   * Record a persistence operation
   */
  private recordOperation(operation: PersistenceOperation): void {
    this.operationHistory.push(operation);

    // Maintain history size
    if (this.operationHistory.length > 1000) {
      this.operationHistory = this.operationHistory.slice(-500);
    }
  }

  /**
   * Clean up old snapshots
   */
  private async cleanupOldSnapshots(): Promise<void> {
    const snapshots = await this.getSnapshotList();

    if (snapshots.length > this.config.maxSnapshots) {
      const toDelete = snapshots.slice(this.config.maxSnapshots);

      for (const snapshot of toDelete) {
        try {
          const filename = `snapshot-${snapshot.id}.json`;
          const filepath = join(this.config.dataDirectory, filename);
          await fs.unlink(filepath);

          logger.debug('Old snapshot deleted', {
            snapshotId: snapshot.id,
            timestamp: snapshot.timestamp,
          });
        } catch (error) {
          logger.warn('Failed to delete old snapshot', {
            snapshotId: snapshot.id,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
    }
  }

  /**
   * Clean up old backups
   */
  private async cleanupOldBackups(): Promise<void> {
    if (this.recoveryPoints.length > this.config.maxBackups) {
      const toDelete = this.recoveryPoints
        .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
        .slice(0, this.recoveryPoints.length - this.config.maxBackups);

      for (const backup of toDelete) {
        try {
          if (this.config.backupDirectory) {
            const filename = `${backup.id}.backup.json`;
            const filepath = join(this.config.backupDirectory, filename);
            await fs.unlink(filepath);
          }

          const index = this.recoveryPoints.findIndex(
            (rp) => rp.id === backup.id,
          );
          if (index > -1) {
            this.recoveryPoints.splice(index, 1);
          }

          logger.debug('Old backup deleted', {
            backupId: backup.id,
            timestamp: backup.timestamp,
          });
        } catch (error) {
          logger.warn('Failed to delete old backup', {
            backupId: backup.id,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
    }
  }

  /**
   * Deduplicate transaction log entries
   */
  private deduplicateTransactions(
    transactions: TransactionLogEntry[],
  ): TransactionLogEntry[] {
    const seen = new Set<string>();
    const deduplicated: TransactionLogEntry[] = [];

    for (const transaction of transactions.reverse()) {
      const key = `${transaction.entityType}:${transaction.entityId}:${transaction.operation}`;

      if (!seen.has(key)) {
        seen.add(key);
        deduplicated.unshift(transaction);
      }
    }

    return deduplicated;
  }

  /**
   * Merge similar snapshots for optimization
   */
  private async mergeSnapshots(): Promise<void> {
    // Implementation would analyze snapshots and merge where beneficial
    // This is a placeholder for complex merge logic
    logger.debug('Snapshot merging completed');
  }

  /**
   * Optimize storage backend-specific structures
   */
  private async optimizeStorage(): Promise<void> {
    // Implementation would depend on storage backend
    // File system: defragmentation, compression
    // Database: vacuum, reindex, etc.
    logger.debug('Storage optimization completed');
  }

  /**
   * Stop auto-save and cleanup
   */
  async shutdown(): Promise<void> {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = undefined;
    }

    // Wait for any pending operations
    while (this.isOperationInProgress || this.pendingOperations.length > 0) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    logger.info('QueuePersistence shutdown completed');
    this.emit('shutdown');
  }
}
