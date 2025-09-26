/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Task as SDKTask } from '@a2a-js/sdk';
import type { TaskStore } from '@a2a-js/sdk/server';
/**
 * File-based persistence storage configuration
 */
export interface FileBasedStorageConfig {
    /** Base directory for persistence storage (default: ~/.gemini-cli/persistence) */
    storageDir?: string;
    /** Enable compression for metadata storage */
    compressMetadata?: boolean;
    /** Enable compression for workspace archives */
    compressWorkspace?: boolean;
    /** Maximum number of backup versions to keep */
    maxBackupVersions?: number;
    /** Enable automatic cleanup of old sessions */
    enableAutoCleanup?: boolean;
    /** Maximum age of sessions to keep (in milliseconds) */
    maxSessionAge?: number;
    /** Enable performance monitoring */
    enableMetrics?: boolean;
}
/**
 * Task session metadata for cross-session tracking
 */
export interface TaskSessionMetadata {
    /** Unique session identifier */
    sessionId: string;
    /** Task creation timestamp */
    createdAt: string;
    /** Last update timestamp */
    updatedAt: string;
    /** Session owner/agent identifier */
    ownerId?: string;
    /** Task completion status */
    isComplete: boolean;
    /** Metadata format version */
    version: string;
    /** Additional session properties */
    properties: Record<string, unknown>;
}
/**
 * Storage metrics tracking
 */
export interface StorageMetrics {
    totalTasks: number;
    activeTasks: number;
    completedTasks: number;
    storageSize: number;
    compressionRatio: number;
    averageLoadTime: number;
    averageSaveTime: number;
    lastCleanupTime?: string;
}
/**
 * Comprehensive file-based task persistence storage system with cross-session continuity
 *
 * Features:
 * - Local file-based storage with configurable compression
 * - Cross-session task correlation and ownership tracking
 * - Concurrent access conflict resolution
 * - Data integrity with backup and recovery mechanisms
 * - Performance monitoring and optimization
 * - Automatic cleanup and maintenance
 */
export declare class FileBasedTaskStore implements TaskStore {
    private config;
    private metrics;
    private activeLocks;
    constructor(config?: FileBasedStorageConfig);
    /**
     * Initialize storage directory structure and load existing metrics
     */
    private initializeStorage;
    /**
     * Acquire exclusive lock for task to prevent concurrent modification
     */
    private acquireTaskLock;
    /**
     * Create task lock mechanism
     */
    private createTaskLock;
    /**
     * Release task lock
     */
    private releaseTaskLock;
    /**
     * Get file paths for task storage
     */
    private getTaskPaths;
    /**
     * Save task with comprehensive persistence features
     */
    save(task: SDKTask): Promise<void>;
    /**
     * Save task metadata with optional compression
     */
    private saveMetadata;
    /**
     * Save workspace archive with compression
     */
    private saveWorkspace;
    /**
     * Load task with cross-session continuation support
     */
    load(taskId: string): Promise<SDKTask | undefined>;
    /**
     * Load task metadata with decompression support
     */
    private loadMetadata;
    /**
     * Load session metadata
     */
    private loadSessionMetadata;
    /**
     * Restore workspace from archive
     */
    private restoreWorkspace;
    /**
     * Create SDK Task object from loaded data
     */
    private createSDKTask;
    /**
     * Create backup of existing task data
     */
    private createBackup;
    /**
     * Clean up old backup files
     */
    private cleanupOldBackups;
    /**
     * Update storage metrics
     */
    private updateMetrics;
    /**
     * Refresh storage metrics
     */
    private refreshMetrics;
    /**
     * Calculate total storage size
     */
    private calculateStorageSize;
    /**
     * Load metrics from disk
     */
    private loadMetrics;
    /**
     * Save metrics to disk
     */
    private saveMetrics;
    /**
     * Perform maintenance cleanup
     */
    private performMaintenanceCleanup;
    /**
     * Clean up all files for a specific task
     */
    private cleanupTaskFiles;
    /**
     * Get current storage metrics
     */
    getMetrics(): Promise<StorageMetrics>;
    /**
     * List all active task sessions
     */
    listActiveSessions(): Promise<TaskSessionMetadata[]>;
    /**
     * Manually trigger cleanup
     */
    performCleanup(): Promise<void>;
    /**
     * Get storage configuration
     */
    getConfig(): Required<FileBasedStorageConfig>;
}
