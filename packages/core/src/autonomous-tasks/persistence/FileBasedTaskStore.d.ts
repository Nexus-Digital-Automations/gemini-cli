/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { ITask, ITaskQueue } from '../interfaces/TaskInterfaces.js';
import { TaskStore, type StorageConfig, type TransactionContext, type TransactionIsolationLevel, type PersistenceResult, type QueryOptions, type EnhancedPersistenceStats, type BackupStrategy } from './TaskStore.js';
/**
 * File-based task storage implementation with advanced features
 */
export declare class FileBasedTaskStore extends TaskStore {
    private storage;
    private storagePath;
    private lockFilePath;
    private isLocked;
    private activeTransactions;
    private writeInProgress;
    private cache;
    private readonly CACHE_TTL;
    private readonly MAX_CACHE_SIZE;
    constructor();
    /**
     * Initialize the file-based storage system
     */
    initialize(config: StorageConfig): Promise<void>;
    /**
     * Shutdown the storage system gracefully
     */
    shutdown(force?: boolean): Promise<void>;
    /**
     * Begin atomic transaction
     */
    beginTransaction(isolationLevel?: TransactionIsolationLevel, readOnly?: boolean): Promise<TransactionContext>;
    /**
     * Commit transaction
     */
    commitTransaction(transaction: TransactionContext): Promise<void>;
    /**
     * Rollback transaction
     */
    rollbackTransaction(transaction: TransactionContext): Promise<void>;
    /**
     * Save task to persistent storage
     */
    saveTask(task: ITask, transaction?: TransactionContext): Promise<PersistenceResult<void>>;
    /**
     * Load task from persistent storage
     */
    loadTask(taskId: string, useCache?: boolean): Promise<PersistenceResult<ITask | null>>;
    /**
     * Update task with optimistic locking
     */
    updateTask(task: ITask, expectedVersion?: number, transaction?: TransactionContext): Promise<PersistenceResult<void>>;
    /**
     * Delete task with soft delete support
     */
    deleteTask(taskId: string, softDelete?: boolean, transaction?: TransactionContext): Promise<PersistenceResult<void>>;
    /**
     * Query tasks with advanced filtering and pagination
     */
    queryTasks(options: QueryOptions): Promise<PersistenceResult<ITask[]>>;
    /**
     * Save task queue state
     */
    saveQueue(queue: ITaskQueue, transaction?: TransactionContext): Promise<PersistenceResult<void>>;
    /**
     * Load task queue state
     */
    loadQueue(queueId: string): Promise<PersistenceResult<ITaskQueue | null>>;
    /**
     * Get enhanced persistence statistics
     */
    getEnhancedStats(): Promise<EnhancedPersistenceStats>;
    /**
     * Verify data integrity
     */
    verifyIntegrity(fix?: boolean): Promise<PersistenceResult<{
        issues: Array<{
            type: string;
            description: string;
            fixed: boolean;
        }>;
        totalChecked: number;
        totalIssues: number;
    }>>;
    private loadOrCreateStorage;
    private createEmptyStorage;
    private saveStorage;
    private acquireLock;
    private releaseLock;
    private updateIndexes;
    private removeFromIndexes;
    private updateCache;
    private getFromCache;
    private removeFromCache;
    private cleanupCache;
    private calculateCacheHitRate;
    private calculateChecksum;
    private getNestedValue;
    private migrateStorageIfNeeded;
    private applyTransactionChanges;
    private restoreTransactionData;
    private maintainIndexes;
    private performAutomaticBackup;
    /**
     * Create full backup of all data
     */
    createBackup(strategy?: BackupStrategy, destination?: string): Promise<PersistenceResult<string>>;
    /**
     * Restore data from backup
     */
    restoreFromBackup(backupPath: string, options?: {
        replaceExisting?: boolean;
        validateBackup?: boolean;
    }): Promise<PersistenceResult<void>>;
}
