/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { TaskId, Task, TaskStatus, TaskResult, ExecutionPlan, TaskQueueConfig, ResourceAllocation } from './types.js';
import type { DependencyManager } from './dependency-manager.js';
import type { CoreToolScheduler } from '../core/coreToolScheduler.js';
/**
 * Task execution context with enhanced metadata
 */
interface TaskExecutionContext {
    taskId: TaskId;
    task: Task;
    startTime: Date;
    resourceAllocation?: ResourceAllocation;
    dependencies: TaskId[];
    dependents: TaskId[];
    retryCount: number;
}
/**
 * Queue events for monitoring and integration
 */
export interface TaskQueueEvents {
    'task-queued': {
        task: Task;
    };
    'task-started': {
        taskId: TaskId;
        context: TaskExecutionContext;
    };
    'task-completed': {
        taskId: TaskId;
        result: TaskResult;
    };
    'task-failed': {
        taskId: TaskId;
        error: Error;
        retryScheduled: boolean;
    };
    'queue-drained': {
        processedCount: number;
    };
    'dependency-blocked': {
        taskId: TaskId;
        blockedBy: TaskId[];
    };
    'resource-constraint': {
        taskId: TaskId;
        constrainedBy: string[];
    };
}
/**
 * Enhanced task queue with dependency-aware execution and resource management
 */
export declare class IntelligentTaskQueue {
    private dependencyManager;
    private coreScheduler;
    private config;
    private executionQueue;
    private activeExecutions;
    private completedTasks;
    private resourceAllocations;
    private currentExecutionPlan?;
    private isProcessing;
    private processingPromise?;
    constructor(coreScheduler: CoreToolScheduler, config: TaskQueueConfig, dependencyManager?: DependencyManager);
    /**
     * Add a task to the queue with intelligent scheduling
     */
    addTask(task: Task): Promise<void>;
    /**
     * Remove a task from the queue
     */
    removeTask(taskId: TaskId): Promise<void>;
    /**
     * Get task status and execution information
     */
    getTaskStatus(taskId: TaskId): {
        status: TaskStatus;
        queuePosition?: number;
        dependencies?: TaskId[];
        blockedBy?: TaskId[];
        estimatedStartTime?: Date;
    };
    /**
     * Get comprehensive queue status
     */
    getQueueStatus(): {
        totalTasks: number;
        pendingTasks: number;
        activeTasks: number;
        completedTasks: number;
        failedTasks: number;
        blockedTasks: number;
        resourceUtilization: Record<string, {
            used: number;
            total: number;
        }>;
        currentExecutionPlan?: ExecutionPlan;
    };
    /**
     * Schedule intelligent queue processing
     */
    private scheduleQueueProcessing;
    /**
     * Main queue processing loop with intelligent scheduling
     */
    private processQueue;
    /**
     * Execute tasks that are ready based on dependencies and resources
     */
    private executeReadyTasks;
    /**
     * Check if a task is ready for execution (all dependencies satisfied)
     */
    private isTaskReady;
    /**
     * Get tasks that are blocking a specific task
     */
    private getBlockingDependencies;
    /**
     * Check if required resources are available for a task
     */
    private areResourcesAvailable;
    /**
     * Start execution of a task
     */
    private startTaskExecution;
    /**
     * Convert a Task to ToolCallRequest format (simplified conversion)
     */
    private taskToToolCallRequest;
    /**
     * Get appropriate tool name for a task category
     */
    private getToolNameForTask;
    /**
     * Allocate resources for a task
     */
    private allocateResources;
    /**
     * Release resources for a task
     */
    private releaseResources;
    /**
     * Handle successful task completion
     */
    private handleTaskCompletion;
    /**
     * Handle task execution failure
     */
    private handleTaskFailure;
    /**
     * Estimate when a task will start executing
     */
    private estimateTaskStartTime;
    /**
     * Get dependency manager instance
     */
    getDependencyManager(): DependencyManager;
    /**
     * Wait for all tasks to complete
     */
    waitForCompletion(): Promise<void>;
    /**
     * Graceful shutdown of the task queue
     */
    shutdown(): Promise<void>;
}
export {};
