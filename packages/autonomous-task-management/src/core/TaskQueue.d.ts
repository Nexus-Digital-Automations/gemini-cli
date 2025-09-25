/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { EventEmitter } from 'node:events';
import type { Task, TaskId } from '../types/Task';
import { TaskStatus } from '../types/Task';
import type { QueueStatistics } from '../types/Queue';
import { QueueStatus } from '../types/Queue';
import type { SystemConfig } from '../index';
import type { Logger } from '../utils/Logger';
/**
 * TaskQueue class - Priority-based task scheduling and queue management
 *
 * Provides intelligent task queueing with priority scheduling, dependency resolution,
 * and various queue processing strategies for optimal task execution.
 */
export declare class TaskQueue extends EventEmitter {
    private readonly logger;
    private readonly config;
    private readonly queueConfig;
    private readonly queue;
    private readonly entryMap;
    private readonly dependencies;
    private queueId;
    private status;
    private processingInterval;
    private statistics;
    private readonly entryIdCounter;
    private isInitialized;
    constructor(config: SystemConfig, logger: Logger);
    /**
     * Initialize the task queue
     */
    initialize(): Promise<void>;
    /**
     * Start queue processing
     */
    start(): Promise<void>;
    /**
     * Stop queue processing
     */
    stop(): Promise<void>;
    /**
     * Enqueue a task
     */
    enqueue(task: Task): Promise<void>;
    /**
     * Dequeue next available task
     */
    dequeue(): Promise<Task | null>;
    /**
     * Update task status in queue
     */
    updateTaskStatus(taskId: TaskId, status: TaskStatus): Promise<void>;
    /**
     * Get queue statistics
     */
    getStatistics(): QueueStatistics;
    /**
     * Get queue size
     */
    size(): number;
    /**
     * Check if queue is empty
     */
    isEmpty(): boolean;
    /**
     * Get queue status
     */
    getStatus(): QueueStatus;
    /**
     * Private helper methods
     */
    private processQueue;
    private processQueueEntries;
    private findNextExecutableEntry;
    private areDependenciesResolved;
    private insertIntoQueue;
    private sortQueue;
    private calculatePriorityScore;
    private calculateWeight;
    private calculateDeadline;
    private agePriorities;
    private updateDependencies;
    private removeDependency;
    private updateSuccessRate;
    private updateMetrics;
    private generateEntryId;
}
