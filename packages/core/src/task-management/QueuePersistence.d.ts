/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { EventEmitter } from 'node:events';
import type { Task, TaskExecutionRecord, QueueMetrics, TaskDependency } from './TaskQueue.js';
import type { TaskId } from './types.js';
import type { LifecycleContext, LifecycleEvent } from './TaskLifecycle.js';
/**
 * Persistence storage backends
 */
export declare enum StorageBackend {
    FILE_SYSTEM = "filesystem",
    SQLITE = "sqlite",
    MEMORY = "memory",
    REDIS = "redis",
    MONGODB = "mongodb"
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
    autoSaveInterval: number;
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
export declare class QueuePersistence extends EventEmitter {
    private config;
    private autoSaveTimer?;
    private transactionLog;
    private operationHistory;
    private recoveryPoints;
    private isOperationInProgress;
    private pendingOperations;
    constructor(config?: Partial<PersistenceConfig>);
    /**
     * Save current queue state to persistent storage
     */
    saveSnapshot(tasks: Map<TaskId, Task>, dependencies: Map<string, TaskDependency>, executionRecords: Map<TaskId, TaskExecutionRecord[]>, lifecycleContexts: Map<TaskId, LifecycleContext>, lifecycleEvents: Map<TaskId, LifecycleEvent[]>, metrics: QueueMetrics, customData?: Record<string, unknown>, description?: string): Promise<string>;
    /**
     * Load queue state from persistent storage
     */
    loadSnapshot(snapshotId?: string): Promise<QueueSnapshot | null>;
    /**
     * Create a backup of current state
     */
    createBackup(description?: string): Promise<string>;
    /**
     * Restore from a backup
     */
    restoreFromBackup(backupId: string): Promise<QueueSnapshot>;
    /**
     * Record a transaction for recovery purposes
     */
    recordTransaction(operation: TransactionLogEntry['operation'], entityType: TransactionLogEntry['entityType'], entityId: string, beforeState?: unknown, afterState?: unknown): void;
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
    };
    /**
     * List available snapshots
     */
    listSnapshots(): Promise<SnapshotMetadata[]>;
    /**
     * List available backups
     */
    listBackups(): Promise<RecoveryPoint[]>;
    /**
     * Verify data integrity
     */
    verifyIntegrity(): Promise<{
        snapshots: Array<{
            id: string;
            valid: boolean;
            error?: string;
        }>;
        backups: Array<{
            id: string;
            valid: boolean;
            error?: string;
        }>;
        transactionLog: {
            valid: boolean;
            error?: string;
        };
    }>;
    /**
     * Compact and optimize storage
     */
    compactStorage(): Promise<void>;
    /**
     * Initialize storage directories and structures
     */
    private initializeStorage;
    /**
     * Start auto-save timer
     */
    private startAutoSave;
    /**
     * Create a queue snapshot
     */
    private createSnapshot;
    /**
     * Write snapshot to storage
     */
    private writeSnapshot;
    /**
     * Read snapshot from storage
     */
    private readSnapshot;
    /**
     * Write backup to storage
     */
    private writeBackup;
    /**
     * Read backup from storage
     */
    private readBackup;
    /**
     * Get list of available snapshots
     */
    private getSnapshotList;
    /**
     * Get latest snapshot ID
     */
    private getLatestSnapshotId;
    /**
     * Verify snapshot integrity
     */
    private verifySnapshotIntegrity;
    /**
     * Calculate snapshot size in bytes
     */
    private calculateSnapshotSize;
    /**
     * Calculate MD5 checksum
     */
    private calculateChecksum;
    /**
     * Record a persistence operation
     */
    private recordOperation;
    /**
     * Clean up old snapshots
     */
    private cleanupOldSnapshots;
    /**
     * Clean up old backups
     */
    private cleanupOldBackups;
    /**
     * Deduplicate transaction log entries
     */
    private deduplicateTransactions;
    /**
     * Merge similar snapshots for optimization
     */
    private mergeSnapshots;
    /**
     * Optimize storage backend-specific structures
     */
    private optimizeStorage;
    /**
     * Stop auto-save and cleanup
     */
    shutdown(): Promise<void>;
}
