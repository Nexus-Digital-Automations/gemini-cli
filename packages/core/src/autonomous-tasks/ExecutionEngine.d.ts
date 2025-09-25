/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { EventEmitter } from 'node:events';
import type { ITask, ITaskQueue, ITaskExecutionEngine, TaskResult, ExecutionEngineStats } from './interfaces/TaskInterfaces.js';
/**
 * Execution engine events for monitoring and control
 */
export declare enum ExecutionEngineEvent {
    ENGINE_STARTED = "engine_started",
    ENGINE_STOPPED = "engine_stopped",
    TASK_STARTED = "task_started",
    TASK_COMPLETED = "task_completed",
    TASK_FAILED = "task_failed",
    TASK_CANCELLED = "task_cancelled",
    TASK_RETRIED = "task_retried",
    TASK_BREAKDOWN = "task_breakdown",
    QUEUE_ADDED = "queue_added",
    QUEUE_REMOVED = "queue_removed",
    CONCURRENCY_CHANGED = "concurrency_changed",
    STATS_UPDATED = "stats_updated",
    ERROR = "error"
}
/**
 * Configuration options for the execution engine
 */
export interface ExecutionEngineConfig {
    /** Maximum number of concurrent task executions */
    maxConcurrency: number;
    /** Default task execution timeout in milliseconds */
    defaultTimeout: number;
    /** Maximum number of retry attempts for failed tasks */
    maxRetries: number;
    /** Interval for updating statistics in milliseconds */
    statsUpdateInterval: number;
    /** Enable automatic task breakdown for complex tasks */
    enableTaskBreakdown: boolean;
    /** Enable failure recovery mechanisms */
    enableFailureRecovery: boolean;
    /** Memory threshold for task execution monitoring (bytes) */
    memoryThreshold: number;
    /** CPU threshold for task execution monitoring (percentage) */
    cpuThreshold: number;
    /** Enable detailed performance monitoring */
    enablePerformanceMonitoring: boolean;
    /** Task execution history size for analytics */
    executionHistorySize: number;
}
/**
 * Autonomous task execution engine
 *
 * Provides intelligent orchestration of task execution with:
 * - Concurrent task processing with configurable limits
 * - Automatic task breakdown for complex operations
 * - Intelligent failure recovery and retry mechanisms
 * - Real-time performance monitoring and statistics
 * - Queue management and priority-based scheduling
 * - Resource usage monitoring and optimization
 */
export declare class ExecutionEngine extends EventEmitter implements ITaskExecutionEngine {
    readonly id: string;
    private readonly logger;
    private readonly config;
    private readonly queues;
    private readonly executingTasks;
    private readonly taskBreakdown;
    private readonly failureRecovery;
    private isRunning;
    private isStopping;
    private currentConcurrency;
    private statsTimer?;
    private stats;
    private executionHistory;
    private startTime?;
    constructor(id: string, config?: Partial<ExecutionEngineConfig>);
    /**
     * Get engine running status
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
     * Stop the execution engine gracefully
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
     * Execute a single task with context isolation
     */
    private executeSingleTask;
    /**
     * Execute subtasks from task breakdown
     */
    private executeSubtasks;
    /**
     * Run task with performance monitoring and resource tracking
     */
    private runTaskWithMonitoring;
    /**
     * Execute task with isolated context
     */
    private executeWithContext;
    /**
     * Retry task execution with failure recovery
     */
    private retryTaskExecution;
    /**
     * Start background task processor
     */
    private startTaskProcessor;
    /**
     * Get next task from highest priority queue
     */
    private getNextTask;
    /**
     * Start statistics updater
     */
    private startStatsUpdater;
    /**
     * Update engine statistics
     */
    private updateEngineStats;
    /**
     * Update statistics after task completion
     */
    private updateStats;
    /**
     * Record task execution in history
     */
    private recordTaskExecution;
    /**
     * Create task metrics
     */
    private createTaskMetrics;
    /**
     * Check if results contain critical failures that should stop execution
     */
    private hasCriticalFailure;
    /**
     * Cancel all active tasks
     */
    private cancelAllActiveTasks;
    /**
     * Wait for all active tasks to complete
     */
    private waitForActiveTasksCompletion;
    /**
     * Get execution history for analysis
     */
    getExecutionHistory(): Array<{
        taskId: string;
        duration: number;
        success: boolean;
        timestamp: Date;
        memoryUsage: number;
        cpuUsage: number;
    }>;
    /**
     * Get detailed engine information for debugging
     */
    getDebugInfo(): Record<string, unknown>;
    /**
     * Dispose of the engine and clean up resources
     */
    dispose(): Promise<void>;
}
