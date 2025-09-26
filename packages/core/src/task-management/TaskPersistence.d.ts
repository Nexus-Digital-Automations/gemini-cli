/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { EventEmitter } from 'node:events';
import type { Task, TaskExecutionRecord, TaskDependency, QueueMetrics } from './TaskQueue.js';
/**
 * Serializable task data for persistence
 */
export interface SerializableTask extends Omit<Task, 'executeFunction' | 'validateFunction' | 'rollbackFunction' | 'progressCallback'> {
    executeFunctionName?: string;
    validateFunctionName?: string;
    rollbackFunctionName?: string;
    serializedContext?: string;
}
/**
 * Persistent queue state
 */
export interface PersistedQueueState {
    version: string;
    timestamp: Date;
    sessionId: string;
    tasks: SerializableTask[];
    dependencies: TaskDependency[];
    completedTasks: TaskExecutionRecord[];
    failedTasks: TaskExecutionRecord[];
    runningTasks: string[];
    metrics: QueueMetrics;
    metadata: Record<string, unknown>;
}
/**
 * Backup configuration
 */
export interface BackupConfig {
    enabled: boolean;
    interval: number;
    maxBackups: number;
    compressionEnabled: boolean;
    encryptionEnabled: boolean;
    encryptionKey?: string;
}
/**
 * Persistence options
 */
export interface PersistenceOptions {
    storageDir: string;
    filename: string;
    autoSave: boolean;
    autoSaveInterval: number;
    enableBackups: boolean;
    backupConfig: BackupConfig;
    enableMigration: boolean;
    compressionEnabled: boolean;
}
/**
 * Function registry for task function reconstruction
 */
export interface TaskFunctionRegistry {
    executeFunctions: Map<string, (task: Task, context: any) => Promise<any>>;
    validateFunctions: Map<string, (task: Task, context: any) => Promise<boolean>>;
    rollbackFunctions: Map<string, (task: Task, context: any) => Promise<void>>;
}
/**
 * Cross-session task persistence manager with intelligent state management
 */
export declare class TaskPersistence extends EventEmitter {
    private options;
    private functionRegistry;
    private autoSaveTimer?;
    private backupTimer?;
    private isInitialized;
    constructor(options?: Partial<PersistenceOptions>);
    /**
     * Initialize persistence system
     */
    initialize(): Promise<void>;
    /**
     * Register task execution functions for reconstruction
     */
    registerExecuteFunction(name: string, fn: (task: Task, context: any) => Promise<any>): void;
    /**
     * Register task validation functions
     */
    registerValidateFunction(name: string, fn: (task: Task, context: any) => Promise<boolean>): void;
    /**
     * Register task rollback functions
     */
    registerRollbackFunction(name: string, fn: (task: Task, context: any) => Promise<void>): void;
    /**
     * Save queue state to persistent storage
     */
    saveQueueState(tasks: Map<string, Task>, dependencies: Map<string, TaskDependency>, completedTasks: Map<string, TaskExecutionRecord>, failedTasks: Map<string, TaskExecutionRecord>, runningTasks: Set<string>, metrics: QueueMetrics, sessionId?: string): Promise<void>;
    /**
     * Load queue state from persistent storage
     */
    loadQueueState(): Promise<{
        tasks: Map<string, Task>;
        dependencies: Map<string, TaskDependency>;
        completedTasks: Map<string, TaskExecutionRecord>;
        failedTasks: Map<string, TaskExecutionRecord>;
        runningTasks: Set<string>;
        metrics: QueueMetrics;
        sessionId: string;
    } | null>;
    /**
     * Create a backup of the current state
     */
    createBackup(sessionId?: string): Promise<string>;
    /**
     * Restore from a backup
     */
    restoreFromBackup(backupPath: string): Promise<void>;
    /**
     * List available backups
     */
    listBackups(): Promise<Array<{
        path: string;
        timestamp: Date;
        sessionId: string;
        size: number;
    }>>;
    /**
     * Export queue state to external format
     */
    exportState(format?: 'json' | 'csv'): Promise<string>;
    /**
     * Import queue state from external file
     */
    importState(filePath: string, merge?: boolean): Promise<void>;
    /**
     * Clean up old storage files and backups
     */
    cleanup(olderThanMs?: number): Promise<void>;
    /**
     * Get storage statistics
     */
    getStorageStats(): Promise<{
        totalFiles: number;
        totalSize: number;
        stateFile: {
            exists: boolean;
            size: number;
            lastModified?: Date;
        };
        backupCount: number;
        backupTotalSize: number;
        exportCount: number;
        exportTotalSize: number;
    }>;
    /**
     * Serialize a task for persistence
     */
    private serializeTask;
    /**
     * Deserialize a task from persistence
     */
    private deserializeTask;
    /**
     * Check if state needs migration
     */
    private needsMigration;
    /**
     * Migrate state to current version
     */
    private migrateState;
    /**
     * Convert tasks to CSV format
     */
    private convertToCSV;
    /**
     * Merge two queue states
     */
    private mergeStates;
    /**
     * Clean up old backup files
     */
    private cleanupOldBackups;
    /**
     * Start auto-save timer
     */
    private startAutoSave;
    /**
     * Start backup timer
     */
    private startBackupTimer;
    /**
     * Stop all timers
     */
    stop(): void;
    /**
     * Shutdown persistence system
     */
    shutdown(): Promise<void>;
}
