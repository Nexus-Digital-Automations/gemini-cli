/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Cross-Session Task Persistence Engine
 *
 * Advanced persistence system providing:
 * - Robust cross-session task state management
 * - Data integrity validation and corruption recovery
 * - Efficient storage mechanisms with sub-100ms operations
 * - Session continuity and recovery capabilities
 * - Real-time synchronization across multiple sessions
 * - Advanced conflict resolution and merge strategies
 */
import { EventEmitter } from 'node:events';
import type { Task, TaskStatus, TaskCategory } from './types.js';
import { TaskPriority } from './types.js';
export interface ITask extends Task {
    name: string;
    updatedAt: Date;
    parameters?: Record<string, unknown>;
    tags: string[];
    dependencies: Array<{
        taskId: string;
        type: string;
    }>;
    subtasks: string[];
    result?: unknown;
    parentTaskId?: string;
    scheduledAt?: Date;
}
export interface ITaskQueue {
    id: string;
    name: string;
    tasks: ITask[];
    metadata?: Record<string, unknown>;
}
export interface TaskFilter {
    status?: TaskStatus[];
    priority?: TaskPriority[];
    category?: TaskCategory[];
    tags?: string[];
    createdAfter?: Date;
    createdBefore?: Date;
}
export interface StorageConfig {
    storageDir: string;
    enableCompression?: boolean;
    maxBackupVersions?: number;
    enableMetrics?: boolean;
}
export interface TransactionContext {
    id: string;
    transactionId: string;
    isolationLevel: TransactionIsolationLevel;
    operations: unknown[];
}
export type TransactionIsolationLevel = 'read_uncommitted' | 'read_committed' | 'repeatable_read' | 'serializable';
export interface PersistenceResult<T = unknown> {
    success: boolean;
    data?: T;
    error?: Error;
    metadata?: Record<string, unknown>;
}
export interface QueryOptions {
    limit?: number;
    offset?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    filters?: Record<string, unknown>;
}
export type CompressionAlgorithm = 'gzip' | 'deflate' | 'brotli' | 'none';
export type SerializationFormat = 'json' | 'msgpack' | 'protobuf';
/**
 * Session metadata for cross-session tracking
 */
export interface SessionMetadata {
    /** Session identifier */
    sessionId: string;
    /** Session start time */
    startTime: Date;
    /** Session end time (null if active) */
    endTime: Date | null;
    /** Last activity timestamp */
    lastActivity: Date;
    /** Session state */
    state: 'active' | 'inactive' | 'crashed' | 'terminated' | 'terminating';
    /** Process information */
    processInfo: {
        pid: number;
        platform: string;
        nodeVersion: string;
    };
    /** Session statistics */
    statistics: {
        tasksProcessed: number;
        transactionsCommitted: number;
        errorsEncountered: number;
        totalOperations: number;
    };
}
/**
 * Checkpoint data for recovery
 */
export interface CheckpointData {
    /** Checkpoint identifier */
    id: string;
    /** Checkpoint timestamp */
    timestamp: Date;
    /** Session identifier */
    sessionId: string;
    /** Task state snapshot */
    taskSnapshot: Record<string, ITask>;
    /** Queue state snapshot */
    queueSnapshot: Record<string, ITaskQueue>;
    /** Active transactions */
    activeTransactions: string[];
    /** Checkpoint type */
    type: 'automatic' | 'manual' | 'crash_recovery';
    /** Data integrity hash */
    integrityHash: string;
    /** Size in bytes */
    size: number;
}
/**
 * Cross-session persistence configuration
 */
export interface CrossSessionConfig extends StorageConfig {
    /** Session heartbeat interval (ms) */
    heartbeatInterval?: number;
    /** Checkpoint interval (ms) */
    checkpointInterval?: number;
    /** Maximum checkpoints to retain */
    maxCheckpoints?: number;
    /** Enable automatic crash recovery */
    crashRecoveryEnabled?: boolean;
    /** Session timeout (ms) */
    sessionTimeout?: number;
    /** Enable real-time synchronization */
    realtimeSync?: boolean;
    /** Conflict resolution strategy */
    conflictResolution?: 'timestamp' | 'manual' | 'merge';
    /** Performance optimization settings */
    performanceOptimization?: {
        cacheSize: number;
        batchSize: number;
        asyncWrites: boolean;
        prefetchEnabled: boolean;
    };
}
/**
 * Advanced Cross-Session Persistence Engine
 *
 * Provides enterprise-grade persistence with:
 * - Sub-100ms operation performance
 * - 100% task state preservation across sessions
 * - Automatic crash recovery and data integrity validation
 * - Real-time synchronization and conflict resolution
 */
export declare class CrossSessionPersistenceEngine extends EventEmitter {
    readonly storage: {
        tasks: Record<string, ITask>;
        queues: Record<string, ITaskQueue>;
        indexes: {
            byStatus: Record<string, string[]>;
            byType: Record<string, string[]>;
            byPriority: Record<string, string[]>;
            byCreationDate: string[];
        };
    };
    readonly storagePath: string;
    readonly activeTransactions: Map<string, TransactionContext>;
    private readonly config;
    private sessionMetadata;
    private checkpoints;
    private heartbeatTimer?;
    private checkpointTimer?;
    private activeSessions;
    private operationMetrics;
    private conflictResolver;
    private dataIntegrityManager;
    private performanceOptimizer;
    private syncManager;
    private migrationManager;
    private writeBuffer;
    private writeBufferTimer?;
    private prefetchCache;
    constructor(config: CrossSessionConfig);
    /**
     * Initialize the cross-session persistence engine
     */
    initialize(config: CrossSessionConfig): Promise<void>;
    /**
     * Enhanced task save with cross-session coordination
     */
    saveTask(task: ITask, transaction?: TransactionContext): Promise<PersistenceResult<void>>;
    /**
     * Enhanced task load with cross-session awareness
     */
    loadTask(taskId: string, useCache?: boolean): Promise<PersistenceResult<ITask | null>>;
    /**
     * Create manual checkpoint
     */
    createCheckpoint(type?: 'automatic' | 'manual' | 'crash_recovery'): Promise<string>;
    /**
     * Restore from checkpoint
     */
    restoreFromCheckpoint(checkpointId: string): Promise<void>;
    /**
     * Get comprehensive session statistics
     */
    getSessionStatistics(): Promise<{
        currentSession: SessionMetadata;
        activeSessions: SessionMetadata[];
        operationMetrics: Record<string, {
            count: number;
            avgTime: number;
            totalTime: number;
        }>;
        checkpointStats: {
            total: number;
            automatic: number;
            manual: number;
            crashRecovery: number;
        };
        performanceStats: {
            avgOperationTime: number;
            operationsPerSecond: number;
            cacheHitRate: number;
        };
        integrityStats: {
            validationsPassed: number;
            corruptionsDetected: number;
            corruptionsFixed: number;
        };
    }>;
    /**
     * Graceful shutdown with session cleanup
     */
    shutdown(force?: boolean): Promise<void>;
    private setupEventListeners;
    private startSessionManagement;
    private startPeriodicOperations;
    private updateHeartbeat;
    private saveSessionMetadata;
    private loadExistingSessions;
    private loadExistingCheckpoints;
    private performCrashRecovery;
    private isSessionCrashed;
    private recoverCrashedSession;
    private performanceOptimizedSave;
    private flushWriteBuffer;
    private tryPrefetchCache;
    private updatePrefetchCache;
    private recordOperationMetrics;
    private shouldCreateCheckpoint;
    private saveCheckpointToDisk;
    private loadCheckpointFromDisk;
    private cleanupOldCheckpoints;
    private cleanupInactiveSessions;
    private checkForConflicts;
    private getAllTasks;
    private getAllQueues;
    private clearCurrentState;
    /**
     * Delete queue from persistent storage
     */
    private deleteQueue;
    private handleCrash;
    beginTransaction(isolationLevel?: TransactionIsolationLevel): Promise<TransactionContext>;
    commitTransaction(transaction: TransactionContext): Promise<void>;
    rollbackTransaction(transaction: TransactionContext): Promise<void>;
    saveQueue(queue: ITaskQueue, transaction?: TransactionContext): Promise<PersistenceResult<void>>;
    loadQueue(queueId: string): Promise<PersistenceResult<ITaskQueue | null>>;
    loadTaskFromStorage(taskId: string, useCache?: boolean): Promise<PersistenceResult<ITask | null>>;
    saveTaskToStorage(task: ITask, transaction?: TransactionContext): Promise<PersistenceResult<void>>;
    deleteTask(taskId: string, isQueue?: boolean, transaction?: TransactionContext): Promise<PersistenceResult<void>>;
    queryTasks(options: QueryOptions): Promise<PersistenceResult<ITask[]>>;
    calculateCacheHitRate(): number;
    private performFinalCleanup;
}
