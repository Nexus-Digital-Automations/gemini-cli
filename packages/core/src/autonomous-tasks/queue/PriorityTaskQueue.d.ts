/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { EventEmitter } from 'node:events';
import type { ITask, ITaskQueue, QueueStats } from '../interfaces/TaskInterfaces.js';
import { TaskPriority } from '../interfaces/TaskInterfaces.js';
/**
 * Queue event types for monitoring and notifications
 */
export declare enum QueueEvent {
    TASK_ADDED = "task_added",
    TASK_REMOVED = "task_removed",
    TASK_PROCESSED = "task_processed",
    QUEUE_EMPTY = "queue_empty",
    QUEUE_FULL = "queue_full",
    PRIORITY_CHANGED = "priority_changed",
    STATS_UPDATED = "stats_updated"
}
/**
 * Queue configuration options
 */
export interface QueueConfig {
    /** Maximum queue size (0 for unlimited) */
    maxSize: number;
    /** Enable automatic priority adjustment based on age */
    enableAgePriority: boolean;
    /** Age-based priority boost interval in milliseconds */
    agePriorityInterval: number;
    /** Enable task deduplication based on parameters */
    enableDeduplication: boolean;
    /** Maximum processing time before task timeout */
    taskTimeout: number;
    /** Statistics collection interval in milliseconds */
    statsInterval: number;
    /** Enable queue persistence */
    enablePersistence: boolean;
}
/**
 * Self-managing priority-based task queue implementation
 *
 * Features:
 * - Priority-based scheduling with multiple priority levels
 * - Automatic age-based priority boosting to prevent starvation
 * - Task deduplication based on content hashing
 * - Comprehensive statistics and monitoring
 * - Event-driven architecture for real-time updates
 * - Configurable queue limits and timeouts
 * - Persistence support for cross-session reliability
 */
export declare class PriorityTaskQueue extends EventEmitter implements ITaskQueue {
    readonly id: string;
    readonly name: string;
    readonly priority: TaskPriority;
    private readonly logger;
    private readonly config;
    private readonly tasks;
    private readonly priorityQueues;
    private readonly tasksByPriority;
    private stats;
    private processingTimes;
    private successCount;
    private totalAttempts;
    private startTime;
    private lastStatsUpdate;
    private statsTimer?;
    private priorityTimer?;
    private isInitialized;
    constructor(id: string, name: string, priority?: TaskPriority, config?: Partial<QueueConfig>);
    /**
     * Initialize priority queues and start background processes
     */
    private initialize;
    /**
     * Get current queue size
     */
    get size(): number;
    /**
     * Check if queue is currently processing (always false for queue itself)
     */
    get isProcessing(): boolean;
    /**
     * Add task to queue with priority-based placement
     */
    enqueue(task: ITask): Promise<void>;
    /**
     * Remove and return highest priority task from queue
     */
    dequeue(): Promise<ITask | null>;
    /**
     * Peek at next task without removing it
     */
    peek(): Promise<ITask | null>;
    /**
     * Remove specific task from queue
     */
    remove(taskId: string): Promise<boolean>;
    /**
     * Get all tasks currently in queue
     */
    getTasks(): Promise<ITask[]>;
    /**
     * Clear all tasks from queue
     */
    clear(): Promise<number>;
    /**
     * Get comprehensive queue statistics
     */
    getStats(): Promise<QueueStats>;
    /**
     * Find highest priority task considering effective priorities
     */
    private getHighestPriorityTask;
    /**
     * Remove task from all queue data structures
     */
    private removeTaskFromQueue;
    /**
     * Sort priority queue by effective priority and queue time
     */
    private sortPriorityQueue;
    /**
     * Compare two queued tasks for priority ordering
     */
    private compareTaskPriority;
    /**
     * Generate hash for task deduplication
     */
    private generateTaskHash;
    /**
     * Check if duplicate task already exists
     */
    private hasDuplicateTask;
    /**
     * Boost priority of old tasks to prevent starvation
     */
    private boostOldTaskPriorities;
    /**
     * Move task to new priority queue after priority change
     */
    private moveTaskToPriorityQueue;
    /**
     * Update queue statistics
     */
    private updateStats;
    /**
     * Record task processing completion
     */
    recordTaskProcessed(success: boolean, processingTime: number): void;
    /**
     * Cleanup resources and stop background processes
     */
    dispose(): void;
    /**
     * Get queue configuration
     */
    getConfig(): QueueConfig;
    /**
     * Update queue configuration
     */
    updateConfig(updates: Partial<QueueConfig>): void;
    /**
     * Get detailed queue state for debugging
     */
    getDebugInfo(): Record<string, unknown>;
    /**
     * Get age of oldest task in queue
     */
    private getOldestTaskAge;
    /**
     * Get age of newest task in queue
     */
    private getNewestTaskAge;
}
