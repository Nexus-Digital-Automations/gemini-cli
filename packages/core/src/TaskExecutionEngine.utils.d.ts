/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Task, TaskDependency } from './TaskExecutionEngine.js';
import { TaskType, TaskStatus } from './types.js';
/**
 * Utility methods and helper functions for TaskExecutionEngine
 * Separated for better maintainability and testing
 */
export declare class TaskExecutionUtils {
    /**
     * Checks if all dependencies for a task are satisfied
     */
    static areDependenciesSatisfied(taskId: string, taskQueue: Map<string, Task>, completedTasks: Map<string, Task>, taskDependencies: Map<string, TaskDependency[]>): boolean;
    /**
     * Gets the maximum number of concurrent tasks based on system resources
     */
    static getMaxConcurrentTasks(): number;
    /**
     * Populates execution context for a task
     */
    static populateExecutionContext(task: Task, context: any): void;
    /**
     * Generates execution prompt for a task based on its characteristics
     */
    static generateExecutionPrompt(task: Task): string;
    /**
     * Gets task type specific guidance
     */
    static getTaskTypeGuidance(type: TaskType): string;
    /**
     * Gets appropriate tools for a task based on its type and complexity
     */
    static getToolsForTask(task: Task): string[];
    /**
     * Gets dependency tasks for a given task ID
     */
    static getDependencyTasks(taskId: string, taskQueue: Map<string, Task>, completedTasks: Map<string, Task>, taskDependencies: Map<string, TaskDependency[]>): Task[];
    /**
     * Updates task progress based on message analysis
     */
    static updateTaskProgress(task: Task, message: string): void;
    /**
     * Gets retry delay in milliseconds based on retry count
     */
    static getRetryDelayMs(retryCount: number): number;
    /**
     * Schedules dependent tasks after a task completes
     */
    static scheduleDependentTasks(completedTaskId: string, taskQueue: Map<string, Task>, taskDependencies: Map<string, TaskDependency[]>, scheduleFunction: (taskId: string) => Promise<void>): Promise<void>;
    /**
     * Handles dependent tasks when a parent task fails
     */
    static handleDependentTasksOnFailure(failedTaskId: string, taskQueue: Map<string, Task>, taskDependencies: Map<string, TaskDependency[]>, updateTaskStatus: (task: Task, status: TaskStatus) => void, handleTaskError: (task: Task, error: string) => void): Promise<void>;
    /**
     * Generates task summary for reporting
     */
    static generateTaskSummary(task: Task): string;
    /**
     * Validates task configuration
     */
    static validateTask(task: Partial<Task>): string[];
    /**
     * Gets human-readable status description
     */
    static getStatusDescription(status: TaskStatus): string;
    /**
     * Calculates task execution statistics
     */
    static calculateExecutionStats(tasks: Task[]): {
        total: number;
        completed: number;
        failed: number;
        inProgress: number;
        averageDurationMs: number;
        successRate: number;
    };
}
