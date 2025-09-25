/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { EventEmitter } from 'node:events';
import type { TaskPersistence } from './TaskPersistence.js';
import type { SessionManager } from './SessionManager.js';
/**
 * Data synchronization configuration
 */
export interface DataSyncConfig {
    /** Enable real-time synchronization */
    enableRealTimeSync?: boolean;
    /** Synchronization interval in milliseconds (default: 1000ms) */
    syncInterval?: number;
    /** Conflict resolution strategy */
    conflictResolution?: ConflictResolutionStrategy;
    /** Enable optimistic locking */
    enableOptimisticLocking?: boolean;
    /** Maximum sync retries */
    maxRetries?: number;
    /** Retry backoff factor */
    retryBackoffFactor?: number;
    /** Enable change tracking */
    enableChangeTracking?: boolean;
    /** Change buffer size */
    changeBufferSize?: number;
    /** Enable compression for sync data */
    enableCompression?: boolean;
    /** Sync batch size */
    syncBatchSize?: number;
}
/**
 * Conflict resolution strategies
 */
export type ConflictResolutionStrategy = 'last-write-wins' | 'first-write-wins' | 'merge' | 'manual' | 'version-based';
/**
 * Change operation types
 */
export type ChangeType = 'create' | 'update' | 'delete' | 'status_change' | 'dependency_change';
/**
 * Data change record for tracking modifications
 */
export interface DataChange {
    /** Unique change ID */
    id: string;
    /** Change type */
    type: ChangeType;
    /** Entity type affected */
    entityType: 'task' | 'dependency' | 'session' | 'ownership';
    /** Entity ID */
    entityId: string;
    /** Session that made the change */
    sessionId: string;
    /** Agent that made the change */
    agentId: string;
    /** Timestamp of change */
    timestamp: Date;
    /** Change data (before/after values) */
    data: {
        before?: unknown;
        after?: unknown;
        metadata?: Record<string, unknown>;
    };
    /** Change checksum for integrity */
    checksum: string;
    /** Whether change has been synchronized */
    synchronized: boolean;
    /** Synchronization attempts */
    syncAttempts: number;
}
/**
 * Synchronization conflict information
 */
export interface SyncConflict {
    /** Conflict ID */
    id: string;
    /** Entity type in conflict */
    entityType: 'task' | 'dependency' | 'session';
    /** Entity ID */
    entityId: string;
    /** Conflicting changes */
    conflicts: DataChange[];
    /** Conflict detection timestamp */
    detectedAt: Date;
    /** Resolution status */
    resolved: boolean;
    /** Resolution timestamp */
    resolvedAt?: Date;
    /** Resolution method used */
    resolutionMethod?: ConflictResolutionStrategy;
    /** Resolution result */
    resolution?: {
        winner: DataChange;
        discarded: DataChange[];
        merged?: unknown;
    };
}
/**
 * Synchronization state for tracking sync progress
 */
export interface SyncState {
    /** Last successful sync timestamp */
    lastSyncAt: Date;
    /** Number of pending changes */
    pendingChanges: number;
    /** Number of conflicts */
    activeConflicts: number;
    /** Sync statistics */
    stats: {
        totalSyncs: number;
        successfulSyncs: number;
        failedSyncs: number;
        conflictsResolved: number;
        averageSyncTime: number;
    };
}
/**
 * Sync batch for efficient bulk operations
 */
export interface SyncBatch {
    /** Batch ID */
    id: string;
    /** Changes in this batch */
    changes: DataChange[];
    /** Batch creation timestamp */
    createdAt: Date;
    /** Session that created the batch */
    sessionId: string;
    /** Batch checksum */
    checksum: string;
}
/**
 * Comprehensive real-time data synchronization system
 *
 * Features:
 * - Real-time change tracking and synchronization
 * - Conflict detection and resolution
 * - Optimistic locking for concurrent modifications
 * - Change buffering and batching for performance
 * - Integrity verification with checksums
 * - Automatic retry mechanisms
 * - Compression for efficient data transfer
 * - Event-driven synchronization notifications
 */
export declare class DataSync extends EventEmitter {
    private config;
    private persistence;
    private sessionManager;
    private changeBuffer;
    private conflicts;
    private syncState;
    private syncTimer?;
    private isInitialized;
    private isSyncing;
    constructor(persistence: TaskPersistence, sessionManager: SessionManager, config?: DataSyncConfig);
    /**
     * Initialize the data synchronization system
     */
    initialize(): Promise<void>;
    /**
     * Track a data change for synchronization
     */
    trackChange(type: ChangeType, entityType: 'task' | 'dependency' | 'session' | 'ownership', entityId: string, sessionId: string, agentId: string, beforeData?: unknown, afterData?: unknown, metadata?: Record<string, unknown>): Promise<string>;
    /**
     * Synchronize all pending changes
     */
    syncChanges(force?: boolean): Promise<SyncResult>;
    /**
     * Resolve a synchronization conflict
     */
    resolveConflict(conflictId: string, strategy?: ConflictResolutionStrategy, manualResolution?: unknown): Promise<void>;
    /**
     * Get current synchronization state
     */
    getSyncState(): SyncState;
    /**
     * Get pending changes with optional filtering
     */
    getPendingChanges(filter?: {
        entityType?: 'task' | 'dependency' | 'session' | 'ownership';
        entityId?: string;
        sessionId?: string;
        changeType?: ChangeType;
    }): DataChange[];
    /**
     * Get active conflicts
     */
    getActiveConflicts(): SyncConflict[];
    /**
     * Force synchronization of specific entity
     */
    forceSync(entityType: 'task' | 'dependency', entityId: string): Promise<void>;
    /**
     * Setup change tracking by listening to relevant events
     */
    private setupChangeTracking;
    /**
     * Start real-time synchronization timer
     */
    private startRealTimeSync;
    /**
     * Calculate checksum for data integrity
     */
    private calculateChecksum;
    /**
     * Check if a change is critical and requires immediate sync
     */
    private isCriticalChange;
    /**
     * Trim change buffer to maintain size limit
     */
    private trimChangeBuffer;
    /**
     * Create batches for efficient processing
     */
    private createBatches;
    /**
     * Process a single batch of changes
     */
    private processBatch;
    /**
     * Detect conflicts for a change
     */
    private detectConflict;
    /**
     * Apply a change to the system
     */
    private applyChange;
    /**
     * Apply task-related change
     */
    private applyTaskChange;
    /**
     * Apply dependency-related change
     */
    private applyDependencyChange;
    /**
     * Apply session-related change
     */
    private applySessionChange;
    /**
     * Apply ownership-related change
     */
    private applyOwnershipChange;
    /**
     * Synchronize a specific task
     */
    private syncTask;
    /**
     * Synchronize a specific dependency
     */
    private syncDependency;
    /**
     * Conflict resolution strategies
     */
    private resolveLastWriteWins;
    private resolveFirstWriteWins;
    private resolveVersionBased;
    private resolveMerge;
    private resolveManual;
    /**
     * Apply conflict resolution
     */
    private applyResolution;
    /**
     * Update synchronization statistics
     */
    private updateSyncStats;
    /**
     * Shutdown the data synchronization system
     */
    shutdown(): Promise<void>;
}
/**
 * Synchronization result interface
 */
interface SyncResult {
    success: boolean;
    changesSynced: number;
    conflictsFound: number;
    duration: number;
    error?: string;
}
export {};
