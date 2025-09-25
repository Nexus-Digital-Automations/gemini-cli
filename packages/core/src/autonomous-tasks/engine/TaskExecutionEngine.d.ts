/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { EventEmitter } from 'node:events';
import type { ITask, ITaskQueue, ITaskExecutionEngine, TaskResult, TaskPriority, ExecutionEngineStats } from '../interfaces/TaskInterfaces.js';
/**
 * Execution engine events for monitoring
 */
export declare enum EngineEvent {
    TASK_STARTED = "task_started",
    TASK_COMPLETED = "task_completed",
    TASK_FAILED = "task_failed",
    TASK_CANCELLED = "task_cancelled",
    TASK_TIMEOUT = "task_timeout",
    ENGINE_STARTED = "engine_started",
    ENGINE_STOPPED = "engine_stopped",
    QUEUE_ADDED = "queue_added",
    QUEUE_REMOVED = "queue_removed",
    STATS_UPDATED = "stats_updated",
    ERROR = "error"
}
/**
 * Engine configuration options
 */
export interface EngineConfig {
    /** Maximum concurrent tasks */
    maxConcurrency: number;
    /** Default task timeout in milliseconds */
    defaultTimeout: number;
    /** Task retry configuration */
    retryConfig: RetryConfig;
    /** Resource management settings */
    resourceLimits: ResourceLimits;
    /** Performance monitoring settings */
    monitoring: MonitoringConfig;
    /** Queue processing settings */
    queueSettings: QueueProcessingSettings;
}
/**
 * Task retry configuration
 */
export interface RetryConfig {
    /** Maximum retry attempts */
    maxAttempts: number;
    /** Base delay between retries in milliseconds */
    baseDelay: number;
    /** Exponential backoff multiplier */
    backoffMultiplier: number;
    /** Maximum delay between retries */
    maxDelay: number;
    /** Whether to retry on timeout */
    retryOnTimeout: boolean;
    /** Custom retry condition function */
    shouldRetry?: (error: Error, attempt: number) => boolean;
}
/**
 * Resource limits for task execution
 */
export interface ResourceLimits {
    /** Maximum memory usage per task in MB */
    maxMemoryMB: number;
    /** Maximum CPU usage percentage per task */
    maxCpuPercent: number;
    /** Maximum execution time per task in milliseconds */
    maxExecutionTime: number;
    /** Enable resource monitoring */
    enableMonitoring: boolean;
}
/**
 * Monitoring configuration
 */
export interface MonitoringConfig {
    /** Statistics collection interval in milliseconds */
    statsInterval: number;
    /** Performance metrics collection */
    collectMetrics: boolean;
    /** Detailed execution logging */
    detailedLogging: boolean;
    /** Memory usage tracking */
    trackMemoryUsage: boolean;
    /** CPU usage tracking */
    trackCpuUsage: boolean;
}
/**
 * Queue processing settings
 */
export interface QueueProcessingSettings {
    /** Queue polling interval in milliseconds */
    pollingInterval: number;
    /** Maximum empty queue polls before backoff */
    maxEmptyPolls: number;
    /** Backoff multiplier for empty queues */
    emptyQueueBackoff: number;
    /** Queue priority weighting */
    priorityWeights: Record<TaskPriority, number>;
}
/**
 * Autonomous task execution engine implementation
 *
 * Features:
 * - Concurrent task execution with configurable limits
 * - Priority-based queue processing
 * - Automatic retry with exponential backoff
 * - Resource monitoring and limits enforcement
 * - Comprehensive error handling and logging
 * - Real-time statistics and performance metrics
 * - Graceful shutdown with task completion
 * - Event-driven architecture for monitoring
 */
export declare class TaskExecutionEngine extends EventEmitter implements ITaskExecutionEngine {
    readonly id: string;
    private readonly logger;
    private readonly config;
    private readonly queues;
    private readonly activeTasks;
    private isRunning;
    private processingTimer?;
    private statsTimer?;
    private emptyPollCount;
    private currentPollingInterval;
    private stats;
    private startTime;
    private executionTimes;
    private lastStatsUpdate;
    constructor(id: string, config?: Partial<EngineConfig>);
    /**
     * Get whether engine is currently running
     */
    get isRunning(): boolean;
    /**
     * Get current concurrency limit
     */
    get concurrencyLimit(): number;
    /**
     * Get number of currently executing tasks
     */
    get activeTaskCount(): number;
    /**
     * Start the execution engine
     */
    start(): Promise<void>;
    /**
     * Stop the execution engine
     */
    stop(force?: boolean): Promise<void>;
    /**
     * Execute a single task
     */
    executeTask(task: ITask): Promise<TaskResult>;
    /**
     * Add task queue to engine
     */
    addQueue(queue: ITaskQueue): Promise<void>;
    /**
     * Remove task queue from engine
     */
    removeQueue(queueId: string): Promise<boolean>;
    /**
     * Get all managed queues
     */
    getQueues(): ITaskQueue[];
    /**
     * Get engine execution statistics
     */
    getStats(): Promise<ExecutionEngineStats>;
    /**
     * Set concurrency limit for parallel execution
     */
    setConcurrencyLimit(limit: number): void;
    /**
     * Start queue processing loop
     */
    private startQueueProcessing;
    /**
     * Process all queues for available tasks
     */
    private processQueues;
    /**
     * Create task execution context with monitoring
     */
    private createTaskExecution;
    /**
     * Execute task with retry logic
     */
    private executeTaskWithRetry;
    /**
     * Create resource monitor for task
     */
    private createResourceMonitor;
    /**
     * Handle task timeout
     */
    private handleTaskTimeout;
    /**
     * Clean up task execution resources
     */
    private cleanupTaskExecution;
    /**
     * Record task completion for statistics
     */
    private recordTaskCompletion;
    /**
     * Update engine statistics
     */
    private updateStats;
    /**
     * Get engine configuration
     */
    getConfig(): EngineConfig;
    /**
     * Update engine configuration
     */
    updateConfig(updates: Partial<EngineConfig>): void;
    /**
     * Get detailed engine state for debugging
     */
    getDebugInfo(): Record<string, unknown>;
    /**
     * Dispose of the execution engine
     */
    dispose(): Promise<void>;
}
