/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { EventEmitter } from 'node:events';
import type { AutonomousTask, TaskStatus, ExecutionStrategy } from './task-breakdown-engine.js';
import type { WorkspaceContext } from '../utils/workspaceContext.js';
import type { AnyDeclarativeTool } from '../tools/tools.js';
/**
 * Execution context for task processing
 */
export interface TaskExecutionContext {
    workspaceContext: WorkspaceContext;
    availableTools: Map<string, AnyDeclarativeTool>;
    abortSignal: AbortSignal;
    logger: ExecutionLogger;
    stateManager: ExecutionStateManager;
    validationEngine: ValidationEngine;
}
/**
 * Result of task execution
 */
export interface TaskExecutionResult {
    taskId: string;
    status: TaskStatus;
    startTime: Date;
    endTime: Date;
    duration: number;
    output?: string;
    error?: ExecutionError;
    subResults?: TaskExecutionResult[];
    metrics: ExecutionMetrics;
    rollbackRequired?: boolean;
    rollbackSteps?: string[];
}
/**
 * Execution error with detailed information
 */
export interface ExecutionError {
    message: string;
    code: string;
    type: ExecutionErrorType;
    recoverable: boolean;
    stack?: string;
    context?: Record<string, unknown>;
}
/**
 * Types of execution errors
 */
export declare enum ExecutionErrorType {
    VALIDATION_FAILED = "validation_failed",
    TOOL_NOT_FOUND = "tool_not_found",
    TOOL_EXECUTION_FAILED = "tool_execution_failed",
    TIMEOUT = "timeout",
    DEPENDENCY_FAILED = "dependency_failed",
    PERMISSION_DENIED = "permission_denied",
    RESOURCE_UNAVAILABLE = "resource_unavailable",
    USER_CANCELLED = "user_cancelled",
    SYSTEM_ERROR = "system_error"
}
/**
 * Execution metrics and telemetry
 */
export interface ExecutionMetrics {
    cpuUsage?: number;
    memoryUsage?: number;
    diskIO?: number;
    networkIO?: number;
    toolInvocations: number;
    retryAttempts: number;
    validationChecks: number;
    cacheHits?: number;
}
/**
 * Execution state for persistence and recovery
 */
export interface ExecutionState {
    taskId: string;
    status: TaskStatus;
    progress: number;
    currentStep: string;
    completedSteps: string[];
    failedSteps: string[];
    snapshot?: Record<string, unknown>;
    lastUpdate: Date;
}
/**
 * Logger interface for execution tracking
 */
export interface ExecutionLogger {
    debug(message: string, context?: Record<string, unknown>): void;
    info(message: string, context?: Record<string, unknown>): void;
    warn(message: string, context?: Record<string, unknown>): void;
    error(message: string, error?: Error, context?: Record<string, unknown>): void;
    metric(name: string, value: number, labels?: Record<string, string>): void;
}
/**
 * State manager for execution persistence
 */
export interface ExecutionStateManager {
    saveState(state: ExecutionState): Promise<void>;
    loadState(taskId: string): Promise<ExecutionState | null>;
    deleteState(taskId: string): Promise<void>;
    listStates(): Promise<ExecutionState[]>;
}
/**
 * Validation engine for success criteria checking
 */
export interface ValidationEngine {
    validateTask(task: AutonomousTask, result: TaskExecutionResult): Promise<ValidationResult>;
    validatePreConditions(task: AutonomousTask, context: TaskExecutionContext): Promise<ValidationResult>;
    validatePostConditions(task: AutonomousTask, result: TaskExecutionResult): Promise<ValidationResult>;
}
/**
 * Result of validation checks
 */
export interface ValidationResult {
    passed: boolean;
    errors: string[];
    warnings: string[];
    score: number;
    details?: Record<string, unknown>;
}
/**
 * Execution strategy selector
 */
export interface ExecutionStrategySelector {
    selectStrategy(task: AutonomousTask, context: TaskExecutionContext): ExecutionStrategy;
    canExecuteConcurrently(tasks: AutonomousTask[]): boolean;
    estimateExecutionTime(task: AutonomousTask, strategy: ExecutionStrategy): number;
}
/**
 * Autonomous Execution Engine
 *
 * This engine executes tasks autonomously with intelligent strategy selection,
 * state management, error handling, and validation.
 */
export declare class AutonomousExecutionEngine extends EventEmitter {
    private readonly strategySelector;
    private readonly runningTasks;
    private readonly taskStates;
    private readonly executionQueue;
    private isProcessing;
    constructor(strategySelector?: ExecutionStrategySelector);
    /**
     * Executes a single autonomous task
     */
    executeTask(task: AutonomousTask, context: TaskExecutionContext): Promise<TaskExecutionResult>;
    /**
     * Executes multiple tasks with intelligent scheduling
     */
    executeTasks(tasks: AutonomousTask[], context: TaskExecutionContext): Promise<TaskExecutionResult[]>;
    /**
     * Executes an atomic (leaf) task
     */
    private executeAtomicTask;
    /**
     * Executes a composite task with child tasks
     */
    private executeCompositeTask;
    /**
     * Execute child tasks in parallel with concurrency control
     */
    private executeChildTasksInParallel;
    /**
     * Execute child tasks sequentially
     */
    private executeChildTasksSequentially;
    private sortTasksByPriority;
    private selectToolForTask;
    private prepareToolParams;
    private updateTaskState;
    private loadChildTasks;
    private calculateRetryDelay;
    private executeWithTimeout;
    private sleep;
    private createExecutionError;
    private createExecutionErrorFromToolError;
    private classifyError;
    private isRecoverable;
    private shouldRollback;
    private aggregateMetrics;
    private setupEventHandlers;
}
/**
 * Default execution strategy selector
 */
export declare class DefaultExecutionStrategySelector implements ExecutionStrategySelector {
    selectStrategy(task: AutonomousTask, context: TaskExecutionContext): ExecutionStrategy;
    canExecuteConcurrently(tasks: AutonomousTask[]): boolean;
    estimateExecutionTime(task: AutonomousTask, strategy: ExecutionStrategy): number;
    private requiresConfirmation;
    private isParallelizable;
}
