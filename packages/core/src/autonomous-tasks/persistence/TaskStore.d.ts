/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { EventEmitter } from 'node:events';
import type { ITask, ITaskQueue, TaskFilter, PersistenceStats } from '../interfaces/TaskInterfaces.js';
/**
 * Transaction isolation levels for concurrent access control
 */
export declare enum TransactionIsolationLevel {
    READ_UNCOMMITTED = "read_uncommitted",
    READ_COMMITTED = "read_committed",
    REPEATABLE_READ = "repeatable_read",
    SERIALIZABLE = "serializable"
}
/**
 * Backup creation strategy options
 */
export declare enum BackupStrategy {
    INCREMENTAL = "incremental",
    FULL = "full",
    DIFFERENTIAL = "differential"
}
/**
 * Storage compression algorithms
 */
export declare enum CompressionAlgorithm {
    NONE = "none",
    GZIP = "gzip",
    DEFLATE = "deflate",
    BROTLI = "brotli"
}
/**
 * Task serialization format options
 */
export declare enum SerializationFormat {
    JSON = "json",
    BSON = "bson",
    MESSAGEPACK = "messagepack",
    PROTOBUF = "protobuf"
}
/**
 * Storage backend configuration interface
 */
export interface StorageConfig {
    /** Storage backend type */
    type: 'file' | 'sqlite' | 'memory' | 'redis' | 'mongodb';
    /** Storage file path or connection string */
    connectionString: string;
    /** Maximum storage size in bytes */
    maxStorageSize?: number;
    /** Enable data compression */
    compression?: CompressionAlgorithm;
    /** Serialization format */
    serializationFormat?: SerializationFormat;
    /** Enable write-ahead logging */
    writeAheadLogging?: boolean;
    /** Backup configuration */
    backupConfig?: BackupConfig;
    /** Indexing configuration */
    indexConfig?: IndexConfig;
    /** Encryption settings */
    encryptionConfig?: EncryptionConfig;
}
/**
 * Backup configuration settings
 */
export interface BackupConfig {
    /** Enable automatic backups */
    enabled: boolean;
    /** Backup strategy */
    strategy: BackupStrategy;
    /** Backup interval in milliseconds */
    interval: number;
    /** Backup directory path */
    backupDirectory: string;
    /** Maximum number of backups to retain */
    maxBackups: number;
    /** Enable backup compression */
    compression: boolean;
    /** Backup file naming pattern */
    namePattern?: string;
}
/**
 * Indexing configuration for query optimization
 */
export interface IndexConfig {
    /** Enable automatic index creation */
    autoIndex: boolean;
    /** Index fields and types */
    indexes: Array<{
        fields: string[];
        type: 'btree' | 'hash' | 'gist' | 'gin';
        unique?: boolean;
        sparse?: boolean;
    }>;
    /** Index maintenance settings */
    maintenance: {
        /** Rebuild threshold (percentage) */
        rebuildThreshold: number;
        /** Maintenance interval in milliseconds */
        maintenanceInterval: number;
    };
}
/**
 * Encryption configuration for data security
 */
export interface EncryptionConfig {
    /** Enable data encryption at rest */
    enabled: boolean;
    /** Encryption algorithm */
    algorithm: 'aes-256-gcm' | 'aes-256-cbc' | 'chacha20-poly1305';
    /** Key derivation function */
    keyDerivation: 'pbkdf2' | 'scrypt' | 'argon2';
    /** Encryption key (should be loaded from secure storage) */
    encryptionKey?: Buffer;
    /** Salt for key derivation */
    salt?: Buffer;
}
/**
 * Transaction context for atomic operations
 */
export interface TransactionContext {
    /** Transaction identifier */
    id: string;
    /** Isolation level */
    isolationLevel: TransactionIsolationLevel;
    /** Transaction start time */
    startTime: Date;
    /** Read-only transaction flag */
    readOnly: boolean;
    /** Transaction timeout in milliseconds */
    timeout: number;
    /** Operations performed in transaction */
    operations: TransactionOperation[];
}
/**
 * Individual transaction operation
 */
export interface TransactionOperation {
    /** Operation type */
    type: 'create' | 'read' | 'update' | 'delete';
    /** Target resource type */
    resource: 'task' | 'queue' | 'metadata';
    /** Resource identifier */
    resourceId: string;
    /** Operation timestamp */
    timestamp: Date;
    /** Operation data */
    data?: unknown;
}
/**
 * Storage query options for advanced filtering
 */
export interface QueryOptions extends TaskFilter {
    /** Sort field and direction */
    sort?: Array<{
        field: string;
        direction: 'asc' | 'desc';
    }>;
    /** Result offset for pagination */
    offset?: number;
    /** Include soft-deleted items */
    includeSoftDeleted?: boolean;
    /** Full-text search query */
    searchQuery?: string;
    /** Custom filter functions */
    customFilters?: Array<(task: ITask) => boolean>;
}
/**
 * Persistence operation result
 */
export interface PersistenceResult<T = unknown> {
    /** Operation success status */
    success: boolean;
    /** Result data */
    data?: T;
    /** Error information if failed */
    error?: Error;
    /** Operation metadata */
    metadata: {
        /** Operation duration in milliseconds */
        duration: number;
        /** Storage size change in bytes */
        sizeChange: number;
        /** Cache hit/miss information */
        cacheInfo?: CacheInfo;
        /** Transaction ID if applicable */
        transactionId?: string;
    };
}
/**
 * Cache information for performance monitoring
 */
export interface CacheInfo {
    /** Cache hit status */
    hit: boolean;
    /** Cache key */
    key: string;
    /** Cache entry age in milliseconds */
    age?: number;
    /** Cache eviction reason if applicable */
    evictionReason?: string;
}
/**
 * Enhanced persistence statistics
 */
export interface EnhancedPersistenceStats extends PersistenceStats {
    /** Storage backend type */
    backendType: string;
    /** Data compression ratio */
    compressionRatio: number;
    /** Index efficiency metrics */
    indexStats: IndexStats;
    /** Backup statistics */
    backupStats: BackupStats;
    /** Transaction statistics */
    transactionStats: TransactionStats;
    /** Cache performance metrics */
    cacheStats: CacheStats;
}
/**
 * Index performance statistics
 */
export interface IndexStats {
    /** Total indexes */
    totalIndexes: number;
    /** Index storage size in bytes */
    indexSize: number;
    /** Average index lookup time */
    averageLookupTime: number;
    /** Index hit rate percentage */
    hitRate: number;
    /** Maintenance operations performed */
    maintenanceOperations: number;
}
/**
 * Backup system statistics
 */
export interface BackupStats {
    /** Total backups created */
    totalBackups: number;
    /** Last backup timestamp */
    lastBackup: Date;
    /** Backup success rate */
    successRate: number;
    /** Total backup size in bytes */
    totalBackupSize: number;
    /** Average backup duration */
    averageBackupTime: number;
}
/**
 * Transaction system statistics
 */
export interface TransactionStats {
    /** Total transactions */
    totalTransactions: number;
    /** Active transactions */
    activeTransactions: number;
    /** Transaction success rate */
    successRate: number;
    /** Average transaction duration */
    averageTransactionTime: number;
    /** Deadlock occurrences */
    deadlocks: number;
}
/**
 * Cache system statistics
 */
export interface CacheStats {
    /** Cache hit rate percentage */
    hitRate: number;
    /** Cache size in bytes */
    cacheSize: number;
    /** Cache entries count */
    entryCount: number;
    /** Cache evictions */
    evictions: number;
    /** Average access time */
    averageAccessTime: number;
}
/**
 * Enhanced task persistence interface with advanced features
 */
export interface IEnhancedTaskPersistence extends EventEmitter {
    /**
     * Initialize the persistence layer
     * @param config Storage configuration
     * @returns Promise resolving when initialized
     */
    initialize(config: StorageConfig): Promise<void>;
    /**
     * Shutdown the persistence layer gracefully
     * @param force Force immediate shutdown
     * @returns Promise resolving when shutdown complete
     */
    shutdown(force?: boolean): Promise<void>;
    /**
     * Begin atomic transaction
     * @param isolationLevel Transaction isolation level
     * @param readOnly Whether transaction is read-only
     * @returns Transaction context
     */
    beginTransaction(isolationLevel?: TransactionIsolationLevel, readOnly?: boolean): Promise<TransactionContext>;
    /**
     * Commit transaction
     * @param transaction Transaction context
     * @returns Promise resolving when committed
     */
    commitTransaction(transaction: TransactionContext): Promise<void>;
    /**
     * Rollback transaction
     * @param transaction Transaction context
     * @returns Promise resolving when rolled back
     */
    rollbackTransaction(transaction: TransactionContext): Promise<void>;
    /**
     * Save task to persistent storage with transaction support
     * @param task Task to save
     * @param transaction Optional transaction context
     * @returns Promise resolving to persistence result
     */
    saveTask(task: ITask, transaction?: TransactionContext): Promise<PersistenceResult<void>>;
    /**
     * Save multiple tasks atomically
     * @param tasks Tasks to save
     * @param transaction Optional transaction context
     * @returns Promise resolving to persistence result
     */
    saveTasks(tasks: ITask[], transaction?: TransactionContext): Promise<PersistenceResult<void>>;
    /**
     * Load task from persistent storage with caching
     * @param taskId Task ID to load
     * @param useCache Whether to use cache
     * @returns Promise resolving to persistence result with task
     */
    loadTask(taskId: string, useCache?: boolean): Promise<PersistenceResult<ITask | null>>;
    /**
     * Load multiple tasks efficiently
     * @param taskIds Task IDs to load
     * @param useCache Whether to use cache
     * @returns Promise resolving to persistence result with tasks
     */
    loadTasks(taskIds: string[], useCache?: boolean): Promise<PersistenceResult<ITask[]>>;
    /**
     * Update task with optimistic locking
     * @param task Task to update
     * @param expectedVersion Expected version for optimistic locking
     * @param transaction Optional transaction context
     * @returns Promise resolving to persistence result
     */
    updateTask(task: ITask, expectedVersion?: number, transaction?: TransactionContext): Promise<PersistenceResult<void>>;
    /**
     * Update multiple tasks atomically
     * @param updates Task updates with version checks
     * @param transaction Optional transaction context
     * @returns Promise resolving to persistence result
     */
    updateTasks(updates: Array<{
        task: ITask;
        expectedVersion?: number;
    }>, transaction?: TransactionContext): Promise<PersistenceResult<void>>;
    /**
     * Delete task with soft delete support
     * @param taskId Task ID to delete
     * @param softDelete Whether to perform soft delete
     * @param transaction Optional transaction context
     * @returns Promise resolving to persistence result
     */
    deleteTask(taskId: string, softDelete?: boolean, transaction?: TransactionContext): Promise<PersistenceResult<void>>;
    /**
     * Query tasks with advanced filtering and pagination
     * @param options Query options
     * @returns Promise resolving to persistence result with tasks
     */
    queryTasks(options: QueryOptions): Promise<PersistenceResult<ITask[]>>;
    /**
     * Count tasks matching filter criteria
     * @param filter Task filter
     * @returns Promise resolving to task count
     */
    countTasks(filter?: TaskFilter): Promise<PersistenceResult<number>>;
    /**
     * Save task queue state with versioning
     * @param queue Task queue to save
     * @param transaction Optional transaction context
     * @returns Promise resolving to persistence result
     */
    saveQueue(queue: ITaskQueue, transaction?: TransactionContext): Promise<PersistenceResult<void>>;
    /**
     * Load task queue state
     * @param queueId Queue ID to load
     * @returns Promise resolving to persistence result with queue
     */
    loadQueue(queueId: string): Promise<PersistenceResult<ITaskQueue | null>>;
    /**
     * Create full backup of all data
     * @param strategy Backup strategy
     * @param destination Backup destination path
     * @returns Promise resolving to backup result
     */
    createBackup(strategy?: BackupStrategy, destination?: string): Promise<PersistenceResult<string>>;
    /**
     * Restore data from backup
     * @param backupPath Path to backup file
     * @param options Restore options
     * @returns Promise resolving to restore result
     */
    restoreFromBackup(backupPath: string, options?: {
        replaceExisting?: boolean;
        validateBackup?: boolean;
    }): Promise<PersistenceResult<void>>;
    /**
     * Optimize storage performance
     * @param options Optimization options
     * @returns Promise resolving to optimization result
     */
    optimize(options?: {
        rebuildIndexes?: boolean;
        compactStorage?: boolean;
        cleanupOrphaned?: boolean;
    }): Promise<PersistenceResult<void>>;
    /**
     * Get enhanced persistence statistics
     * @returns Promise resolving to detailed statistics
     */
    getEnhancedStats(): Promise<EnhancedPersistenceStats>;
    /**
     * Verify data integrity
     * @param fix Whether to fix detected issues
     * @returns Promise resolving to integrity check result
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
    /**
     * Clean up old or orphaned task data with advanced options
     * @param olderThan Cleanup threshold date
     * @param options Advanced cleanup options
     * @returns Promise resolving to cleanup result
     */
    cleanup(olderThan?: Date, options?: {
        includeCompletedTasks?: boolean;
        includeCancelledTasks?: boolean;
        preserveReferences?: boolean;
        dryRun?: boolean;
    }): Promise<PersistenceResult<{
        deletedTasks: number;
        deletedQueues: number;
        reclaimedSpace: number;
    }>>;
    /**
     * Export tasks to external format
     * @param filter Task filter
     * @param format Export format
     * @param destination Export destination
     * @returns Promise resolving to export result
     */
    exportTasks(filter: TaskFilter, format: 'json' | 'csv' | 'xml', destination: string): Promise<PersistenceResult<{
        exportedCount: number;
        filePath: string;
        fileSize: number;
    }>>;
    /**
     * Import tasks from external format
     * @param sourcePath Import source path
     * @param format Import format
     * @param options Import options
     * @returns Promise resolving to import result
     */
    importTasks(sourcePath: string, format: 'json' | 'csv' | 'xml', options?: {
        skipDuplicates?: boolean;
        updateExisting?: boolean;
        validateTasks?: boolean;
    }): Promise<PersistenceResult<{
        importedCount: number;
        skippedCount: number;
        errorCount: number;
    }>>;
}
/**
 * Abstract base class for task storage implementations
 * Provides common functionality and enforces interface compliance
 */
export declare abstract class TaskStore implements IEnhancedTaskPersistence {
    protected config: StorageConfig;
    protected isInitialized: boolean;
    protected isShuttingDown: boolean;
    abstract initialize(config: StorageConfig): Promise<void>;
    abstract shutdown(force?: boolean): Promise<void>;
    abstract beginTransaction(isolationLevel?: TransactionIsolationLevel, readOnly?: boolean): Promise<TransactionContext>;
    abstract commitTransaction(transaction: TransactionContext): Promise<void>;
    abstract rollbackTransaction(transaction: TransactionContext): Promise<void>;
    abstract saveTask(task: ITask, transaction?: TransactionContext): Promise<PersistenceResult<void>>;
    abstract loadTask(taskId: string, useCache?: boolean): Promise<PersistenceResult<ITask | null>>;
    abstract updateTask(task: ITask, expectedVersion?: number, transaction?: TransactionContext): Promise<PersistenceResult<void>>;
    abstract deleteTask(taskId: string, softDelete?: boolean, transaction?: TransactionContext): Promise<PersistenceResult<void>>;
    abstract queryTasks(options: QueryOptions): Promise<PersistenceResult<ITask[]>>;
    abstract saveQueue(queue: ITaskQueue, transaction?: TransactionContext): Promise<PersistenceResult<void>>;
    abstract loadQueue(queueId: string): Promise<PersistenceResult<ITaskQueue | null>>;
    abstract getEnhancedStats(): Promise<EnhancedPersistenceStats>;
    abstract verifyIntegrity(fix?: boolean): Promise<PersistenceResult<{
        issues: Array<{
            type: string;
            description: string;
            fixed: boolean;
        }>;
        totalChecked: number;
        totalIssues: number;
    }>>;
    emit: (event: string | symbol, ...args: unknown[]) => boolean;
    on: (event: string | symbol, listener: (...args: unknown[]) => void) => this;
    off: (event: string | symbol, listener: (...args: unknown[]) => void) => this;
    once: (event: string | symbol, listener: (...args: unknown[]) => void) => this;
    removeAllListeners: (event?: string | symbol) => this;
    /**
     * Validate storage configuration
     * @param config Storage configuration to validate
     * @throws Error if configuration is invalid
     */
    protected validateConfig(config: StorageConfig): void;
    /**
     * Check if persistence layer is initialized
     * @throws Error if not initialized
     */
    protected ensureInitialized(): void;
    /**
     * Save multiple tasks atomically (default implementation)
     */
    saveTasks(tasks: ITask[], transaction?: TransactionContext): Promise<PersistenceResult<void>>;
    /**
     * Load multiple tasks efficiently (default implementation)
     */
    loadTasks(taskIds: string[], useCache?: boolean): Promise<PersistenceResult<ITask[]>>;
    /**
     * Update multiple tasks atomically (default implementation)
     */
    updateTasks(updates: Array<{
        task: ITask;
        expectedVersion?: number;
    }>, transaction?: TransactionContext): Promise<PersistenceResult<void>>;
    /**
     * Count tasks matching filter criteria (default implementation)
     */
    countTasks(filter?: TaskFilter): Promise<PersistenceResult<number>>;
    /**
     * Default backup implementation (to be overridden by subclasses)
     */
    createBackup(strategy?: BackupStrategy, destination?: string): Promise<PersistenceResult<string>>;
    /**
     * Default restore implementation (to be overridden by subclasses)
     */
    restoreFromBackup(backupPath: string, options?: {
        replaceExisting?: boolean;
        validateBackup?: boolean;
    }): Promise<PersistenceResult<void>>;
    /**
     * Default optimization implementation (to be overridden by subclasses)
     */
    optimize(options?: {
        rebuildIndexes?: boolean;
        compactStorage?: boolean;
        cleanupOrphaned?: boolean;
    }): Promise<PersistenceResult<void>>;
    /**
     * Default cleanup implementation (to be overridden by subclasses)
     */
    cleanup(olderThan?: Date, options?: {
        includeCompletedTasks?: boolean;
        includeCancelledTasks?: boolean;
        preserveReferences?: boolean;
        dryRun?: boolean;
    }): Promise<PersistenceResult<{
        deletedTasks: number;
        deletedQueues: number;
        reclaimedSpace: number;
    }>>;
    /**
     * Default export implementation (to be overridden by subclasses)
     */
    exportTasks(filter: TaskFilter, format: 'json' | 'csv' | 'xml', destination: string): Promise<PersistenceResult<{
        exportedCount: number;
        filePath: string;
        fileSize: number;
    }>>;
    /**
     * Default import implementation (to be overridden by subclasses)
     */
    importTasks(sourcePath: string, format: 'json' | 'csv' | 'xml', options?: {
        skipDuplicates?: boolean;
        updateExisting?: boolean;
        validateTasks?: boolean;
    }): Promise<PersistenceResult<{
        importedCount: number;
        skippedCount: number;
        errorCount: number;
    }>>;
}
