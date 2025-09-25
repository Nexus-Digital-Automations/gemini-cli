/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { EventEmitter } from 'node:events';
import type { TaskMetadata, TaskPriority } from '../../monitoring/TaskStatusMonitor.js';
import type { AgentCapability, TaskAssignment } from './TaskQueue.js';
/**
 * Persistent storage configuration
 */
export interface PersistenceConfig {
    storageDir: string;
    backupRetentionDays: number;
    compressionEnabled: boolean;
    encryptionKey?: string;
    syncInterval: number;
    maxFileSize: number;
    enableVersioning: boolean;
}
/**
 * Serializable queue state for persistence
 */
export interface SerializableQueueState {
    version: string;
    timestamp: string;
    sessionId: string;
    tasks: {
        registry: Array<[string, TaskMetadata]>;
        queuesByPriority: Array<[TaskPriority, TaskMetadata[]]>;
        assignments: Array<[string, TaskAssignment]>;
        dependencies: Array<[string, string[]]>;
        activeTasks: string[];
        completedTasks: string[];
        failedTasks: Array<[string, number]>;
    };
    agents: {
        registry: Array<[string, AgentCapability]>;
        lastHeartbeats: Array<[string, string]>;
    };
    performance: {
        totalTasksProcessed: number;
        averageQueueTime: number;
        averageExecutionTime: number;
        throughputPerMinute: number;
        systemEfficiency: number;
        rebalanceCount: number;
        optimizationCount: number;
        lastOptimization: string;
    };
    metadata: {
        createdAt: string;
        lastUpdated: string;
        recoveryAttempts: number;
        corruptionDetected: boolean;
    };
}
/**
 * Recovery statistics and information
 */
export interface RecoveryInfo {
    success: boolean;
    tasksRecovered: number;
    agentsRecovered: number;
    corruptedFiles: number;
    recoveryCandidates: string[];
    fallbackUsed?: string;
    warnings: string[];
    errors: string[];
    recoveryDurationMs: number;
}
/**
 * Task Queue Persistence and Recovery Engine
 *
 * Features:
 * - Cross-session task queue persistence
 * - Automatic state recovery with corruption detection
 * - Incremental backups with versioning
 * - Data integrity validation and repair
 * - Performance-optimized serialization
 * - Secure storage with optional encryption
 * - Multi-level backup strategy (local, distributed)
 * - Real-time sync and batch operations
 */
export declare class TaskPersistence extends EventEmitter {
    private readonly logger;
    private readonly config;
    private readonly storageDir;
    private readonly backupDir;
    private readonly tempDir;
    private syncInterval?;
    private lastSync;
    private operationInProgress;
    private readonly fileNames;
    constructor(config?: Partial<PersistenceConfig>);
    /**
     * Initialize persistence system and create necessary directories
     */
    initialize(): Promise<void>;
    /**
     * Persist complete queue state to storage
     */
    persistQueueState(queueState: SerializableQueueState): Promise<void>;
    /**
     * Recover queue state from persistent storage
     */
    recoverQueueState(): Promise<RecoveryInfo>;
    /**
     * Create incremental backup of current state
     */
    createBackup(label?: string): Promise<string>;
    /**
     * List available backups with metadata
     */
    listBackups(): Promise<Array<{
        filename: string;
        path: string;
        size: number;
        created: Date;
        valid: boolean;
        tasksCount?: number;
        agentsCount?: number;
    }>>;
    /**
     * Restore queue state from specific backup
     */
    restoreFromBackup(backupPath: string): Promise<SerializableQueueState>;
    /**
     * Get persistence health and statistics
     */
    getHealthStatus(): Promise<{
        healthy: boolean;
        storageAccessible: boolean;
        currentStateValid: boolean;
        backupCount: number;
        lastSync: Date;
        diskUsage: {
            total: number;
            backups: number;
            temp: number;
        };
        issues: string[];
    }>;
    private setupPersistence;
    private ensureDirectories;
    private validateStorageHealth;
    private startSyncProcess;
    private serializeState;
    private deserializeState;
    private validateStateIntegrity;
    private acquireLock;
    private releaseLock;
    private verifyWrittenData;
    private createVersionedBackup;
    private updateMetadata;
    private findRecoveryCandidates;
    private attemptRecoveryFromFile;
    private validateRecoveredState;
    private getBackupFiles;
    private cleanOldBackups;
    private calculateDiskUsage;
    private getDirectorySize;
    private fileExists;
    private compressData;
    private decompressData;
    private encryptData;
    private decryptData;
    /**
     * Cleanup resources and stop sync process
     */
    destroy(): void;
}
/**
 * Default singleton instance for global access
 */
export declare const taskPersistence: TaskPersistence;
