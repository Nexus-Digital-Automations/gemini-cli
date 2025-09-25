/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { EventEmitter } from 'node:events';
import type { Task, TaskDependency, QueueMetrics, TaskExecutionRecord } from './TaskQueue.js';
/**
 * Queue persistence configuration
 */
export interface QueuePersistenceConfig {
    /** Base directory for queue persistence (default: ~/.gemini-cli/queue-persistence) */
    persistenceDir?: string;
    /** Enable compression for queue state */
    enableCompression?: boolean;
    /** Auto-save interval in milliseconds */
    autoSaveInterval?: number;
    /** Maximum number of backup snapshots to keep */
    maxBackupSnapshots?: number;
    /** Enable incremental saves for performance */
    enableIncrementalSave?: boolean;
    /** Enable cross-session task recovery */
    enableCrossSessionRecovery?: boolean;
    /** Maximum age of recoverable sessions (ms) */
    maxRecoverableAge?: number;
}
/**
 * Queue snapshot metadata
 */
export interface QueueSnapshot {
    id: string;
    timestamp: Date;
    version: string;
    sessionId: string;
    agentId?: string;
    tasks: Task[];
    dependencies: TaskDependency[];
    executionRecords: TaskExecutionRecord[];
    metrics: QueueMetrics;
    metadata: {
        totalTasks: number;
        runningTasks: number;
        completedTasks: number;
        failedTasks: number;
        queueHealth: 'healthy' | 'degraded' | 'critical';
        saveReason: 'scheduled' | 'manual' | 'shutdown' | 'recovery';
    };
}
/**
 * Recovery information for cross-session continuity
 */
export interface RecoveryInfo {
    availableSnapshots: Array<{
        id: string;
        timestamp: Date;
        sessionId: string;
        taskCount: number;
        status: 'complete' | 'partial' | 'corrupted';
    }>;
    recommendedSnapshot?: string;
    potentialDataLoss: boolean;
    lastSuccessfulSave?: Date;
    orphanedTasks: string[];
}
/**
 * Persistence operation result
 */
export interface PersistenceResult {
    success: boolean;
    snapshotId?: string;
    size: number;
    compressionRatio?: number;
    duration: number;
    error?: string;
    warnings: string[];
}
/**
 * Queue Persistence Manager for cross-session continuity
 *
 * Features:
 * - Automatic queue state snapshots with compression
 * - Incremental saves for performance optimization
 * - Cross-session task recovery with conflict resolution
 * - Backup and versioning system
 * - Data integrity validation and corruption detection
 * - Performance monitoring and optimization
 */
export declare class QueuePersistenceManager extends EventEmitter {
    private config;
    private autoSaveTimer?;
    private currentSessionId;
    private isInitialized;
    private lastSnapshotHash?;
    constructor(config?: QueuePersistenceConfig);
    /**
     * Initialize persistence system
     */
    initialize(): Promise<void>;
    /**
     * Save queue state to persistent storage
     */
    saveQueueState(tasks: Map<string, Task>, dependencies: Map<string, TaskDependency>, executionRecords: Map<string, TaskExecutionRecord>, metrics: QueueMetrics, saveReason?: 'scheduled' | 'manual' | 'shutdown' | 'recovery'): Promise<PersistenceResult>;
    /**
     * Load queue state from persistent storage
     */
    loadQueueState(snapshotId?: string): Promise<{
        tasks: Map<string, Task>;
        dependencies: Map<string, TaskDependency>;
        executionRecords: Map<string, TaskExecutionRecord>;
        metrics: QueueMetrics;
        sessionInfo: {
            originalSessionId: string;
            snapshotId: string;
            timestamp: Date;
        };
    } | null>;
    /**
     * Get recovery information for cross-session continuity
     */
    getRecoveryInfo(): Promise<RecoveryInfo>;
    /**
     * Save full snapshot to disk
     */
    private saveFullSnapshot;
    /**
     * Save incremental snapshot (delta from last snapshot)
     */
    private saveIncremental;
    /**
     * Load specific snapshot by ID
     */
    private loadSpecificSnapshot;
    /**
     * Load latest valid snapshot
     */
    private loadLatestSnapshot;
    /**
     * Read snapshot file with compression handling
     */
    private readSnapshotFile;
    /**
     * Validate snapshot integrity
     */
    private validateSnapshot;
    /**
     * Assess queue health based on current state
     */
    private assessQueueHealth;
    /**
     * Calculate hash of snapshot for change detection
     */
    private calculateSnapshotHash;
    /**
     * Check if incremental save should be used
     */
    private shouldUseIncrementalSave;
    /**
     * Find orphaned tasks from previous sessions
     */
    private findOrphanedTasks;
    /**
     * Ensure directory structure exists
     */
    private ensureDirectoryStructure;
    /**
     * Start automatic save process
     */
    private startAutoSave;
    /**
     * Stop automatic save process
     */
    private stopAutoSave;
    /**
     * Clean up old snapshots based on configuration
     */
    private cleanupOldSnapshots;
    /**
     * Perform maintenance cleanup
     */
    private performMaintenanceCleanup;
    /**
     * Get current session ID
     */
    getSessionId(): string;
    /**
     * Update configuration
     */
    updateConfiguration(newConfig: Partial<QueuePersistenceConfig>): void;
    /**
     * Get current configuration
     */
    getConfiguration(): Required<QueuePersistenceConfig>;
    /**
     * Shutdown persistence manager
     */
    shutdown(): Promise<void>;
}
