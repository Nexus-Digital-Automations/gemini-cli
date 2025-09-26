/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Task as SDKTask } from '@a2a-js/sdk';
import type { TaskStore } from '@a2a-js/sdk/server';
import { type FileBasedStorageConfig } from './FileBasedTaskStore.js';
import { type SessionOwnership, type TaskCorrelation } from './SessionManager.js';
import { type ConflictAnalysis, type ResolutionStrategy } from './ConflictResolver.js';
import { type BackupMetadata, type RecoveryOperation } from './DataIntegrityManager.js';
/**
 * Comprehensive storage statistics
 */
export interface StorageStatistics {
    /** Overall storage health status */
    healthStatus: 'healthy' | 'warning' | 'critical';
    /** Task storage metrics */
    tasks: {
        total: number;
        active: number;
        completed: number;
        failed: number;
        avgProcessingTime: number;
    };
    /** Session statistics */
    sessions: {
        active: number;
        total: number;
        avgDuration: number;
        handoffs: number;
    };
    /** Conflict resolution metrics */
    conflicts: {
        total: number;
        resolved: number;
        pending: number;
        autoResolvedRate: number;
    };
    /** Data integrity metrics */
    integrity: {
        totalChecks: number;
        failedChecks: number;
        backups: number;
        recoveries: number;
    };
    /** Storage utilization */
    storage: {
        totalSize: number;
        usedSpace: number;
        availableSpace: number;
        compressionRatio: number;
    };
    /** Performance metrics */
    performance: {
        avgSaveTime: number;
        avgLoadTime: number;
        throughput: number;
    };
}
/**
 * Storage configuration options
 */
export interface PersistenceConfig {
    /** Base directory for all persistence storage */
    baseDir?: string;
    /** File-based storage configuration */
    fileStorage?: FileBasedStorageConfig;
    /** Enable session management */
    enableSessionManagement?: boolean;
    /** Enable conflict resolution */
    enableConflictResolution?: boolean;
    /** Enable data integrity management */
    enableDataIntegrity?: boolean;
    /** Owner/agent identifier */
    ownerId?: string;
    /** Performance optimization settings */
    performance?: {
        enableCaching?: boolean;
        cacheSize?: number;
        enableCompression?: boolean;
        enableIndexing?: boolean;
    };
    /** Monitoring and alerting */
    monitoring?: {
        enableMetrics?: boolean;
        alertThresholds?: {
            diskUsage?: number;
            failureRate?: number;
            responseTime?: number;
        };
    };
}
/**
 * Storage operation result
 */
export interface StorageOperationResult<T = unknown> {
    /** Whether the operation succeeded */
    success: boolean;
    /** Operation result data */
    data?: T;
    /** Error message if operation failed */
    error?: string;
    /** Operation metadata */
    metadata: {
        operation: string;
        duration: number;
        timestamp: string;
        sessionId?: string;
        conflictsResolved?: number;
    };
    /** Warnings encountered during operation */
    warnings?: string[];
}
/**
 * Comprehensive persistence storage management API
 *
 * Integrates all persistence components:
 * - File-based task storage with efficient serialization
 * - Cross-session task correlation and ownership tracking
 * - Conflict resolution for concurrent access
 * - Data integrity with backup and recovery
 * - Performance monitoring and optimization
 *
 * Provides a unified interface for all persistence operations with:
 * - Automatic conflict detection and resolution
 * - Transparent backup and integrity management
 * - Cross-session task continuity
 * - Performance optimization
 * - Comprehensive monitoring and alerting
 */
export declare class PersistenceStorageAPI implements TaskStore {
    private config;
    private fileStorage;
    private sessionManager?;
    private conflictResolver?;
    private dataIntegrity?;
    private operationMetrics;
    constructor(config?: PersistenceConfig);
    /**
     * Initialize all persistence components
     */
    private initialize;
    /**
     * Save task with comprehensive persistence features
     */
    save(task: SDKTask): Promise<void>;
    /**
     * Load task with cross-session continuity support
     */
    load(taskId: string): Promise<SDKTask | undefined>;
    /**
     * Complete task with comprehensive cleanup
     */
    completeTask(taskId: string, completionSummary: string, preservedState?: Record<string, unknown>): Promise<StorageOperationResult<TaskCorrelation>>;
    /**
     * Transfer task ownership between sessions
     */
    transferTask(taskId: string, targetSessionId: string, reason?: string): Promise<StorageOperationResult>;
    /**
     * Resolve conflicts for a specific task
     */
    resolveTaskConflicts(taskId: string, strategy?: ResolutionStrategy): Promise<StorageOperationResult<ConflictAnalysis>>;
    /**
     * Perform data recovery for a task
     */
    recoverTask(taskId: string, backupId?: string): Promise<StorageOperationResult<RecoveryOperation>>;
    /**
     * Get comprehensive storage statistics
     */
    getStorageStatistics(): Promise<StorageStatistics>;
    /**
     * Perform comprehensive maintenance
     */
    performMaintenance(): Promise<StorageOperationResult<{
        cleanupResults: unknown;
        integrityResults?: unknown;
        sessionResults?: unknown;
    }>>;
    /**
     * Get active sessions
     */
    getActiveSessions(): Promise<SessionOwnership[]>;
    /**
     * Get task backups
     */
    getTaskBackups(taskId: string): BackupMetadata[];
    /**
     * Get session task correlations
     */
    getSessionTasks(sessionId?: string): Promise<TaskCorrelation[]>;
    /**
     * Shutdown persistence storage API
     */
    shutdown(): Promise<void>;
    private getTaskMetadataPath;
    private recordOperationMetrics;
    private calculateFailureRate;
    private calculateDiskUsage;
    private calculateThroughput;
}
