/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { SessionOwnership, TaskCorrelation } from './SessionManager.js';
/**
 * Conflict types for task access scenarios
 */
export declare enum ConflictType {
    /** Multiple sessions accessing the same task simultaneously */
    CONCURRENT_ACCESS = "concurrent_access",
    /** Task ownership disputed between sessions */
    OWNERSHIP_CONFLICT = "ownership_conflict",
    /** Resource lock contention */
    RESOURCE_LOCK = "resource_lock",
    /** Data integrity issues from concurrent modifications */
    DATA_INTEGRITY = "data_integrity",
    /** Session timeout or abandonment issues */
    SESSION_TIMEOUT = "session_timeout",
    /** Version conflicts from parallel task execution */
    VERSION_CONFLICT = "version_conflict"
}
/**
 * Conflict resolution strategies
 */
export declare enum ResolutionStrategy {
    /** Transfer task to the most recent session */
    TRANSFER_TO_LATEST = "transfer_to_latest",
    /** Create duplicate tasks for parallel execution */
    DUPLICATE_TASK = "duplicate_task",
    /** Merge changes from multiple sessions */
    MERGE_CHANGES = "merge_changes",
    /** Abort conflicting session and maintain current */
    ABORT_CONFLICT = "abort_conflict",
    /** Queue task for sequential execution */
    QUEUE_SEQUENTIAL = "queue_sequential",
    /** Manual intervention required */
    MANUAL_RESOLUTION = "manual_resolution",
    /** Rollback to last known good state */
    ROLLBACK_STATE = "rollback_state"
}
/**
 * Conflict resolution record
 */
export interface ConflictResolution {
    /** Unique resolution identifier */
    resolutionId: string;
    /** Type of conflict detected */
    conflictType: ConflictType;
    /** Task ID involved in conflict */
    taskId: string;
    /** Sessions involved in the conflict */
    conflictingSessions: SessionOwnership[];
    /** Resolution strategy applied */
    strategy: ResolutionStrategy;
    /** Detailed resolution actions taken */
    actions: Array<{
        action: string;
        timestamp: string;
        sessionId?: string;
        details: Record<string, unknown>;
    }>;
    /** Conflict resolution outcome */
    outcome: {
        success: boolean;
        message: string;
        newTaskOwner?: SessionOwnership;
        createdTasks?: string[];
        mergedData?: Record<string, unknown>;
    };
    /** Resolution metadata */
    metadata: {
        detectedAt: string;
        resolvedAt?: string;
        autoResolved: boolean;
        priority: 'low' | 'medium' | 'high' | 'critical';
        impactAssessment: string;
    };
}
/**
 * Conflict detection and analysis result
 */
export interface ConflictAnalysis {
    /** Whether a conflict was detected */
    hasConflict: boolean;
    /** Type of conflict detected */
    conflictType?: ConflictType;
    /** Severity level of the conflict */
    severity: 'low' | 'medium' | 'high' | 'critical';
    /** Sessions involved in the conflict */
    involvedSessions: SessionOwnership[];
    /** Recommended resolution strategy */
    recommendedStrategy: ResolutionStrategy;
    /** Conflict description and impact */
    description: string;
    /** Evidence supporting conflict detection */
    evidence: Array<{
        type: string;
        data: unknown;
        timestamp: string;
    }>;
    /** Automatic resolution possible */
    canAutoResolve: boolean;
}
/**
 * Resource lock information
 */
export interface ResourceLock {
    /** Lock identifier */
    lockId: string;
    /** Resource being locked (task, file, etc.) */
    resourceId: string;
    /** Resource type */
    resourceType: 'task' | 'file' | 'workspace' | 'metadata';
    /** Session holding the lock */
    holderSession: SessionOwnership;
    /** Lock acquisition timestamp */
    acquiredAt: string;
    /** Lock expiration timestamp */
    expiresAt: string;
    /** Lock metadata */
    metadata: {
        lockReason: string;
        priority: number;
        canInterrupt: boolean;
    };
}
/**
 * Advanced conflict resolution system for concurrent task access
 *
 * Provides:
 * - Real-time conflict detection and analysis
 * - Multiple resolution strategies for different conflict types
 * - Automatic resolution for common scenarios
 * - Manual resolution support for complex cases
 * - Resource locking and contention management
 * - Data integrity preservation during conflicts
 * - Performance optimization for conflict resolution
 */
export declare class ConflictResolver {
    private storageDir;
    private resolutionHistory;
    private activeLocks;
    private conflictDetectionInterval?;
    constructor(storageDir?: string);
    /**
     * Initialize conflict resolver
     */
    private initialize;
    /**
     * Analyze task for potential conflicts
     */
    analyzeTaskConflicts(taskId: string, currentSession: SessionOwnership, allSessions: SessionOwnership[], taskCorrelation?: TaskCorrelation): Promise<ConflictAnalysis>;
    /**
     * Resolve conflicts using specified or recommended strategy
     */
    resolveConflicts(taskId: string, analysis: ConflictAnalysis, strategy?: ResolutionStrategy, manualOverrides?: Record<string, unknown>): Promise<ConflictResolution>;
    /**
     * Acquire resource lock for exclusive access
     */
    acquireResourceLock(resourceId: string, resourceType: ResourceLock['resourceType'], holderSession: SessionOwnership, options?: {
        duration?: number;
        priority?: number;
        canInterrupt?: boolean;
        reason?: string;
    }): Promise<ResourceLock | null>;
    /**
     * Release resource lock
     */
    releaseResourceLock(lockId: string): Promise<boolean>;
    /**
     * Check if resource is locked
     */
    isResourceLocked(resourceId: string): boolean;
    /**
     * Get resource lock information
     */
    getResourceLock(resourceId: string): ResourceLock | null;
    /**
     * List all active locks
     */
    getActiveLocks(): ResourceLock[];
    /**
     * Get resolution history for a task
     */
    getTaskResolutionHistory(taskId: string): ConflictResolution[];
    /**
     * Clean up expired locks
     */
    cleanupExpiredLocks(): Promise<number>;
    /**
     * Detect concurrent access patterns
     */
    private detectConcurrentAccess;
    /**
     * Detect resource lock conflicts
     */
    private detectResourceLockConflicts;
    /**
     * Detect ownership conflicts
     */
    private detectOwnershipConflicts;
    /**
     * Detect stale session conflicts
     */
    private detectStaleSessionConflicts;
    /**
     * Determine appropriate resolution strategy
     */
    private determineResolutionStrategy;
    /**
     * Execute transfer to latest session strategy
     */
    private executeTransferToLatest;
    /**
     * Execute duplicate task strategy
     */
    private executeDuplicateTask;
    /**
     * Execute merge changes strategy
     */
    private executeMergeChanges;
    /**
     * Execute abort conflict strategy
     */
    private executeAbortConflict;
    /**
     * Execute queue sequential strategy
     */
    private executeQueueSequential;
    /**
     * Execute rollback state strategy
     */
    private executeRollbackState;
    /**
     * Execute manual resolution strategy
     */
    private executeManualResolution;
    /**
     * Find resource lock by resource ID
     */
    private findResourceLock;
    /**
     * Get priority level from severity
     */
    private getPriorityFromSeverity;
    /**
     * Save resolution record to disk
     */
    private saveResolution;
    /**
     * Save lock to disk
     */
    private saveLock;
    /**
     * Remove lock file
     */
    private removeLockFile;
    /**
     * Load resolution history from disk
     */
    private loadResolutionHistory;
    /**
     * Load active locks from disk
     */
    private loadActiveLocks;
    /**
     * Start conflict monitoring
     */
    private startConflictMonitoring;
    /**
     * Shutdown conflict resolver
     */
    shutdown(): Promise<void>;
}
