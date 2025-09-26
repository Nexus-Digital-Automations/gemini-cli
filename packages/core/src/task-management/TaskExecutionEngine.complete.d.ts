/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Config } from '../config/config.js';
import type { Task, TaskType, TaskStatus, TaskPriority } from './TaskExecutionEngine.js';
/**
 * Complete TaskExecutionEngine implementation with all utility methods
 */
export declare class TaskExecutionEngine {
    private readonly config;
    private readonly toolRegistry;
    private readonly breakdownAnalyzer;
    private readonly taskQueue;
    private readonly runningTasks;
    private readonly completedTasks;
    private readonly taskDependencies;
    private readonly persistencePath;
    private onTaskStatusChange?;
    private onTaskComplete?;
    private onTaskFailed?;
    constructor(config: Config, handlers?: {
        onTaskStatusChange?: (task: Task) => void;
        onTaskComplete?: (task: Task) => void;
        onTaskFailed?: (task: Task, error: string) => void;
    });
    /**
     * Load persisted task state from disk
     */
    private loadPersistedState;
    /**
     * Save current task state to disk
     */
    private savePersistedState;
    /**
     * Serialize task for persistence (convert dates to strings)
     */
    private serializeTask;
    /**
     * Deserialize task from persistence (convert strings to dates)
     */
    private deserializeTask;
    /**
     * Checks if all dependencies for a task are satisfied
     */
    private areDependenciesSatisfied;
    /**
     * Gets the maximum number of concurrent tasks
     */
    private getMaxConcurrentTasks;
    /**
     * Populates execution context for a task
     */
    private populateExecutionContext;
    /**
     * Generates execution prompt for a task
     */
    private generateExecutionPrompt;
    /**
     * Gets appropriate tools for a task
     */
    private getToolsForTask;
    /**
     * Gets dependency tasks for a given task ID
     */
    private getDependencyTasks;
    /**
     * Updates task progress based on message analysis
     */
    private updateTaskProgress;
    /**
     * Gets retry delay in milliseconds based on retry count
     */
    private getRetryDelayMs;
    /**
     * Schedules dependent tasks after a task completes
     */
    private scheduleDependentTasks;
    /**
     * Handles dependent tasks when a parent task fails
     */
    private handleDependentTasksOnFailure;
    /**
     * Handles task error with logging
     */
    private handleTaskError;
    /**
     * Updates task status and triggers event handlers
     */
    private updateTaskStatus;
    /**
     * Gets default execution time based on complexity
     */
    private getDefaultExecutionTime;
    /**
     * Queues a new task for execution with intelligent breakdown
     */
    queueTask(title: string, description: string, options?: Partial<{
        type: TaskType;
        priority: TaskPriority;
        expectedOutputs: Record<string, string>;
        context: Record<string, unknown>;
        maxExecutionTimeMinutes: number;
    }>): Promise<string>;
    /**
     * Analyzes and breaks down a task asynchronously
     */
    private analyzeAndBreakdownTask;
    /**
     * Schedules task execution based on dependencies and resource availability
     */
    private scheduleTaskExecution;
    /**
     * Executes a task using SubAgentScope with comprehensive monitoring
     */
    private executeTask;
    /**
     * Handles task execution failures with retry logic
     */
    private handleTaskFailure;
    /**
     * Gets task by ID
     */
    getTask(taskId: string): Task | undefined;
    /**
     * Gets all tasks with optional filtering
     */
    getAllTasks(filter?: {
        status?: TaskStatus;
        type?: TaskType;
        priority?: TaskPriority;
    }): Task[];
    /**
     * Gets execution statistics
     */
    getExecutionStats(): any;
    /**
     * Cancels a task
     */
    cancelTask(taskId: string): Promise<boolean>;
    /**
     * Clears completed tasks (for maintenance)
     */
    clearCompletedTasks(): number;
    /**
     * Shuts down the engine gracefully
     */
    shutdown(): Promise<void>;
}
