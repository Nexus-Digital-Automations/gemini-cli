/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { EventEmitter } from 'node:events';
import type {
  AutonomousTask,
  ExecutionStrategy,
  RetryPolicy,
} from './task-breakdown-engine.js';
import { TaskStatus } from './task-breakdown-engine.js';
import { TaskPriority, TaskCategory } from '../task-management/types.js';
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
  duration: number; // milliseconds
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
export enum ExecutionErrorType {
  VALIDATION_FAILED = 'validation_failed',
  TOOL_NOT_FOUND = 'tool_not_found',
  TOOL_EXECUTION_FAILED = 'tool_execution_failed',
  TIMEOUT = 'timeout',
  DEPENDENCY_FAILED = 'dependency_failed',
  PERMISSION_DENIED = 'permission_denied',
  RESOURCE_UNAVAILABLE = 'resource_unavailable',
  USER_CANCELLED = 'user_cancelled',
  SYSTEM_ERROR = 'system_error',
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
  progress: number; // 0-100
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
  error(
    message: string,
    error?: Error,
    context?: Record<string, unknown>,
  ): void;
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
  validateTask(
    task: AutonomousTask,
    result: TaskExecutionResult,
  ): Promise<ValidationResult>;
  validatePreConditions(
    task: AutonomousTask,
    context: TaskExecutionContext,
  ): Promise<ValidationResult>;
  validatePostConditions(
    task: AutonomousTask,
    result: TaskExecutionResult,
  ): Promise<ValidationResult>;
}

/**
 * Result of validation checks
 */
export interface ValidationResult {
  passed: boolean;
  errors: string[];
  warnings: string[];
  score: number; // 0-100
  details?: Record<string, unknown>;
}

/**
 * Execution strategy selector
 */
export interface ExecutionStrategySelector {
  selectStrategy(
    task: AutonomousTask,
    context: TaskExecutionContext,
  ): ExecutionStrategy;
  canExecuteConcurrently(tasks: AutonomousTask[]): boolean;
  estimateExecutionTime(
    task: AutonomousTask,
    strategy: ExecutionStrategy,
  ): number;
}

/**
 * Autonomous Execution Engine
 *
 * This engine executes tasks autonomously with intelligent strategy selection,
 * state management, error handling, and validation.
 */
export class AutonomousExecutionEngine extends EventEmitter {
  private readonly strategySelector: ExecutionStrategySelector;
  private readonly taskStates = new Map<string, ExecutionState>();

  constructor(strategySelector?: ExecutionStrategySelector) {
    super();
    this.strategySelector =
      strategySelector || new DefaultExecutionStrategySelector();

    // Set up event listeners for lifecycle management
    this.setupEventHandlers();
  }

  /**
   * Executes a single autonomous task
   */
  async executeTask(
    task: AutonomousTask,
    context: TaskExecutionContext,
  ): Promise<TaskExecutionResult> {
    const startTime = new Date();
    const logger = context.logger;
    const metrics: ExecutionMetrics = {
      toolInvocations: 0,
      retryAttempts: 0,
      validationChecks: 0,
    };

    logger.info(`Starting task execution: ${task.title}`, {
      taskId: task.id,
      category: task.category,
    });

    try {
      // Pre-execution validation
      metrics.validationChecks++;
      const preValidation =
        await context.validationEngine.validatePreConditions(task, context);
      if (!preValidation.passed) {
        throw new Error(
          `Pre-condition validation failed: ${preValidation.errors.join(', ')}`,
        );
      }

      // Select execution strategy
      const strategy = this.strategySelector.selectStrategy(task, context);
      logger.debug(`Selected execution strategy: ${strategy.type}`, {
        taskId: task.id,
        strategy: strategy.type,
        maxConcurrency: strategy.maxConcurrency,
      });

      // Execute task with strategy
      let result: TaskExecutionResult;

      if (task.childTaskIds && task.childTaskIds.length > 0) {
        result = await this.executeCompositeTask(task, context, strategy);
      } else {
        result = await this.executeAtomicTask(task, context, strategy);
      }

      // Post-execution validation
      metrics.validationChecks++;
      const postValidation =
        await context.validationEngine.validatePostConditions(task, result);
      if (!postValidation.passed) {
        logger.warn(
          `Post-condition validation failed: ${postValidation.warnings.join(', ')}`,
          { taskId: task.id },
        );
      }

      result.metrics = metrics;
      logger.info(`Task execution completed successfully: ${task.title}`, {
        taskId: task.id,
        duration: result.duration,
        status: result.status,
      });

      this.emit('taskCompleted', result);
      return result;
    } catch (error) {
      const endTime = new Date();
      const executionError = this.createExecutionError(error, task);

      const result: TaskExecutionResult = {
        taskId: task.id,
        status: TaskStatus.FAILED,
        startTime,
        endTime,
        duration: endTime.getTime() - startTime.getTime(),
        error: executionError,
        metrics,
        rollbackRequired: this.shouldRollback(task, executionError),
        rollbackSteps: task.rollbackSteps || [],
      };

      logger.error(`Task execution failed: ${task.title}`, error as Error, {
        taskId: task.id,
      });
      this.emit('taskFailed', result);
      return result;
    }
  }

  /**
   * Executes multiple tasks with intelligent scheduling
   */
  async executeTasks(
    tasks: AutonomousTask[],
    context: TaskExecutionContext,
  ): Promise<TaskExecutionResult[]> {
    context.logger.info(`Starting batch execution of ${tasks.length} tasks`);

    const results: TaskExecutionResult[] = [];
    const sortedTasks = this.sortTasksByPriority(tasks);

    // Group tasks by execution strategy
    const sequentialTasks: AutonomousTask[] = [];
    const parallelTasks: AutonomousTask[] = [];

    for (const task of sortedTasks) {
      const strategy = this.strategySelector.selectStrategy(task, context);
      if (
        strategy.type === 'parallel' &&
        this.strategySelector.canExecuteConcurrently([task])
      ) {
        parallelTasks.push(task);
      } else {
        sequentialTasks.push(task);
      }
    }

    // Execute parallel tasks concurrently
    if (parallelTasks.length > 0) {
      const parallelPromises = parallelTasks.map((task) =>
        this.executeTask(task, context).catch(
          (error) =>
            ({
              taskId: task.id,
              status: TaskStatus.FAILED,
              startTime: new Date(),
              endTime: new Date(),
              duration: 0,
              error: this.createExecutionError(error, task),
              metrics: {
                toolInvocations: 0,
                retryAttempts: 0,
                validationChecks: 0,
              },
            }) as TaskExecutionResult,
        ),
      );

      const parallelResults = await Promise.all(parallelPromises);
      results.push(...parallelResults);
    }

    // Execute sequential tasks one by one
    for (const task of sequentialTasks) {
      try {
        const result = await this.executeTask(task, context);
        results.push(result);

        // Stop on critical failures
        if (
          result.status === TaskStatus.FAILED &&
          task.priority >= TaskPriority.HIGH
        ) {
          context.logger.warn(
            `Stopping batch execution due to high-priority task failure: ${task.title}`,
          );
          break;
        }
      } catch (error) {
        const errorResult: TaskExecutionResult = {
          taskId: task.id,
          status: TaskStatus.FAILED,
          startTime: new Date(),
          endTime: new Date(),
          duration: 0,
          error: this.createExecutionError(error, task),
          metrics: {
            toolInvocations: 0,
            retryAttempts: 0,
            validationChecks: 0,
          },
        };
        results.push(errorResult);
      }
    }

    context.logger.info(
      `Batch execution completed: ${results.length} tasks processed`,
    );
    this.emit('batchCompleted', results);
    return results;
  }

  /**
   * Executes an atomic (leaf) task
   */
  private async executeAtomicTask(
    task: AutonomousTask,
    context: TaskExecutionContext,
    strategy: ExecutionStrategy,
  ): Promise<TaskExecutionResult> {
    const startTime = new Date();
    const logger = context.logger;

    // Update task state
    await this.updateTaskState(
      task.id,
      TaskStatus.RUNNING,
      'Executing atomic task',
      context,
    );

    // Find appropriate tool for task
    const toolName = this.selectToolForTask(task, context);
    const tool = context.availableTools.get(toolName);

    if (!tool) {
      throw new Error(`Tool not found: ${toolName}`);
    }

    // Execute with retry policy
    let result: TaskExecutionResult;
    let attempt = 0;
    const maxAttempts = strategy.retryPolicy?.maxRetries || 1;

    while (attempt < maxAttempts) {
      try {
        attempt++;
        logger.debug(
          `Attempting task execution (attempt ${attempt}/${maxAttempts})`,
          { taskId: task.id },
        );

        // Execute tool with timeout
        const toolResult = await this.executeWithTimeout(
          () =>
            tool.validateBuildAndExecute(
              this.prepareToolParams(task),
              context.abortSignal,
            ),
          (strategy.timeoutMinutes || 15) * 60 * 1000,
        );

        const endTime = new Date();
        result = {
          taskId: task.id,
          status: toolResult.error ? TaskStatus.FAILED : TaskStatus.COMPLETED,
          startTime,
          endTime,
          duration: endTime.getTime() - startTime.getTime(),
          output: toolResult.returnDisplay?.toString(),
          error: toolResult.error
            ? this.createExecutionErrorFromToolError(toolResult.error)
            : undefined,
          metrics: {
            toolInvocations: 1,
            retryAttempts: attempt - 1,
            validationChecks: 0,
          },
        };

        if (!toolResult.error) {
          await this.updateTaskState(
            task.id,
            TaskStatus.COMPLETED,
            'Task completed successfully',
            context,
          );
          break;
        }

        if (attempt < maxAttempts) {
          const delay = this.calculateRetryDelay(attempt, strategy.retryPolicy);
          logger.warn(`Task execution failed, retrying in ${delay}ms`, {
            taskId: task.id,
            attempt,
          });
          await this.sleep(delay);
        } else {
          await this.updateTaskState(
            task.id,
            TaskStatus.FAILED,
            'Task failed after all retries',
            context,
          );
        }
      } catch (error) {
        if (attempt >= maxAttempts) {
          throw error;
        }

        const delay = this.calculateRetryDelay(attempt, strategy.retryPolicy);
        logger.warn(`Task execution error, retrying in ${delay}ms`, {
          taskId: task.id,
          attempt,
          error,
        });
        await this.sleep(delay);
      }
    }

    return result!;
  }

  /**
   * Executes a composite task with child tasks
   */
  private async executeCompositeTask(
    task: AutonomousTask,
    context: TaskExecutionContext,
    strategy: ExecutionStrategy,
  ): Promise<TaskExecutionResult> {
    const startTime = new Date();
    const logger = context.logger;

    logger.info(
      `Executing composite task with ${task.childTaskIds?.length || 0} children`,
      { taskId: task.id },
    );

    await this.updateTaskState(
      task.id,
      TaskStatus.RUNNING,
      'Executing composite task',
      context,
    );

    // Load child tasks (would need to be provided by the caller or loaded from storage)
    const childTasks = await this.loadChildTasks(
      task.childTaskIds || [],
      context,
    );

    // Execute child tasks based on strategy
    let subResults: TaskExecutionResult[] = [];

    if (strategy.type === 'parallel') {
      subResults = await this.executeChildTasksInParallel(
        childTasks,
        context,
        strategy,
      );
    } else {
      subResults = await this.executeChildTasksSequentially(
        childTasks,
        context,
      );
    }

    const endTime = new Date();
    const failedTasks = subResults.filter(
      (r) => r.status === TaskStatus.FAILED,
    );
    const status =
      failedTasks.length > 0 ? TaskStatus.FAILED : TaskStatus.COMPLETED;

    await this.updateTaskState(
      task.id,
      status,
      status === TaskStatus.COMPLETED
        ? 'All child tasks completed'
        : 'Some child tasks failed',
      context,
    );

    return {
      taskId: task.id,
      status,
      startTime,
      endTime,
      duration: endTime.getTime() - startTime.getTime(),
      subResults,
      metrics: this.aggregateMetrics(subResults),
      rollbackRequired: failedTasks.length > 0,
      rollbackSteps: task.rollbackSteps || [],
    };
  }

  /**
   * Execute child tasks in parallel with concurrency control
   */
  private async executeChildTasksInParallel(
    childTasks: AutonomousTask[],
    context: TaskExecutionContext,
    strategy: ExecutionStrategy,
  ): Promise<TaskExecutionResult[]> {
    const maxConcurrency = strategy.maxConcurrency || 3;
    const results: TaskExecutionResult[] = [];
    const executing = new Map<string, Promise<TaskExecutionResult>>();

    for (const task of childTasks) {
      // Wait if we've reached max concurrency
      while (executing.size >= maxConcurrency) {
        const [completedTaskId] = await Promise.race(
          Array.from(executing.entries()).map(async ([id, promise]) => {
            await promise;
            return [id];
          }),
        );
        const result = await executing.get(completedTaskId)!;
        results.push(result);
        executing.delete(completedTaskId);
      }

      // Start task execution
      const promise = this.executeTask(task, context);
      executing.set(task.id, promise);
    }

    // Wait for remaining tasks
    const remainingResults = await Promise.all(Array.from(executing.values()));
    results.push(...remainingResults);

    return results;
  }

  /**
   * Execute child tasks sequentially
   */
  private async executeChildTasksSequentially(
    childTasks: AutonomousTask[],
    context: TaskExecutionContext,
  ): Promise<TaskExecutionResult[]> {
    const results: TaskExecutionResult[] = [];

    for (const task of childTasks) {
      const result = await this.executeTask(task, context);
      results.push(result);

      // Stop on failure if task is critical
      if (
        result.status === TaskStatus.FAILED &&
        task.priority >= TaskPriority.HIGH
      ) {
        context.logger.warn(
          `Stopping sequential execution due to critical task failure: ${task.title}`,
        );
        break;
      }
    }

    return results;
  }

  // Helper methods
  private sortTasksByPriority(tasks: AutonomousTask[]): AutonomousTask[] {
    return [...tasks].sort((a, b) => b.priority - a.priority);
  }

  private selectToolForTask(
    task: AutonomousTask,
    context: TaskExecutionContext,
  ): string {
    // Simple tool selection based on task category
    const toolMapping: Record<TaskCategory, string[]> = {
      [TaskCategory.FEATURE]: ['edit', 'write-file', 'shell'],
      [TaskCategory.BUG_FIX]: ['read-file', 'edit', 'shell'],
      [TaskCategory.TEST]: ['shell', 'read-file'],
      [TaskCategory.DOCUMENTATION]: ['edit', 'write-file'],
      [TaskCategory.REFACTOR]: ['edit', 'smart-edit'],
      [TaskCategory.SECURITY]: ['read-file', 'edit', 'shell'],
      [TaskCategory.PERFORMANCE]: ['edit', 'shell'],
      [TaskCategory.INFRASTRUCTURE]: ['shell', 'edit'],
    };

    const possibleTools = toolMapping[task.category] || ['shell'];

    // Return first available tool
    for (const toolName of possibleTools) {
      if (context.availableTools.has(toolName)) {
        return toolName;
      }
    }

    throw new Error(
      `No suitable tool found for task category: ${task.category}`,
    );
  }

  private prepareToolParams(task: AutonomousTask): Record<string, unknown> {
    // Extract parameters from task description
    // This is a simplified implementation - would need more sophisticated parsing
    return {
      description: task.description,
      workspacePath: task.workspacePath,
      targetFiles: task.targetFiles || [],
    };
  }

  private async updateTaskState(
    taskId: string,
    status: TaskStatus,
    message: string,
    context: TaskExecutionContext,
  ): Promise<void> {
    const state: ExecutionState = {
      taskId,
      status,
      progress:
        status === TaskStatus.COMPLETED
          ? 100
          : status === TaskStatus.RUNNING
            ? 50
            : 0,
      currentStep: message,
      completedSteps: this.taskStates.get(taskId)?.completedSteps || [],
      failedSteps: this.taskStates.get(taskId)?.failedSteps || [],
      lastUpdate: new Date(),
    };

    if (status === TaskStatus.COMPLETED) {
      state.completedSteps.push(message);
    } else if (status === TaskStatus.FAILED) {
      state.failedSteps.push(message);
    }

    this.taskStates.set(taskId, state);
    await context.stateManager.saveState(state);
    this.emit('stateChanged', state);
  }

  private async loadChildTasks(
    childIds: string[],
    context: TaskExecutionContext,
  ): Promise<AutonomousTask[]> {
    // This would load child tasks from storage or a task registry
    // For now, return empty array - implementation depends on task storage strategy
    context.logger.debug(`Loading ${childIds.length} child tasks`, {
      childIds,
    });
    return [];
  }

  private calculateRetryDelay(
    attempt: number,
    retryPolicy?: RetryPolicy,
  ): number {
    if (!retryPolicy) return 1000;

    const baseDelay = retryPolicy.baseDelayMs;
    const maxDelay = retryPolicy.maxDelayMs;

    switch (retryPolicy.backoffStrategy) {
      case 'linear':
        return Math.min(baseDelay * attempt, maxDelay);
      case 'exponential':
        return Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
      case 'constant':
      default:
        return baseDelay;
    }
  }

  private async executeWithTimeout<T>(
    operation: () => Promise<T>,
    timeoutMs: number,
  ): Promise<T> {
    return Promise.race([
      operation(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Operation timed out')), timeoutMs),
      ),
    ]);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private createExecutionError(
    error: unknown,
    task: AutonomousTask,
  ): ExecutionError {
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;

    return {
      message,
      code: `EXEC_ERROR_${task.id}`,
      type: this.classifyError(error),
      recoverable: this.isRecoverable(error),
      stack,
      context: {
        taskId: task.id,
        taskCategory: task.category,
        taskTitle: task.title,
      },
    };
  }

  private createExecutionErrorFromToolError(toolError: {
    message: string;
    type?: string;
  }): ExecutionError {
    return {
      message: toolError.message,
      code: toolError.type || 'TOOL_ERROR',
      type: ExecutionErrorType.TOOL_EXECUTION_FAILED,
      recoverable: true,
    };
  }

  private classifyError(error: unknown): ExecutionErrorType {
    if (error instanceof Error) {
      if (error.message.includes('timeout')) return ExecutionErrorType.TIMEOUT;
      if (error.message.includes('permission'))
        return ExecutionErrorType.PERMISSION_DENIED;
      if (error.message.includes('not found'))
        return ExecutionErrorType.TOOL_NOT_FOUND;
      if (error.message.includes('validation'))
        return ExecutionErrorType.VALIDATION_FAILED;
      if (error.message.includes('cancelled'))
        return ExecutionErrorType.USER_CANCELLED;
    }
    return ExecutionErrorType.SYSTEM_ERROR;
  }

  private isRecoverable(error: unknown): boolean {
    const errorType = this.classifyError(error);
    return ![
      ExecutionErrorType.PERMISSION_DENIED,
      ExecutionErrorType.USER_CANCELLED,
      ExecutionErrorType.SYSTEM_ERROR,
    ].includes(errorType);
  }

  private shouldRollback(task: AutonomousTask, error: ExecutionError): boolean {
    return (
      error.recoverable &&
      task.category !== TaskCategory.DOCUMENTATION &&
      task.category !== TaskCategory.DOCUMENTATION &&
      task.category !== TaskCategory.TEST
    );
  }

  private aggregateMetrics(results: TaskExecutionResult[]): ExecutionMetrics {
    return results.reduce(
      (acc, result) => ({
        toolInvocations: acc.toolInvocations + result.metrics.toolInvocations,
        retryAttempts: acc.retryAttempts + result.metrics.retryAttempts,
        validationChecks:
          acc.validationChecks + result.metrics.validationChecks,
        cacheHits: (acc.cacheHits || 0) + (result.metrics.cacheHits || 0),
      }),
      {
        toolInvocations: 0,
        retryAttempts: 0,
        validationChecks: 0,
        cacheHits: 0,
      },
    );
  }

  private setupEventHandlers(): void {
    this.on('taskCompleted', (result: TaskExecutionResult) => {
      // Clean up task state
      this.taskStates.delete(result.taskId);
    });

    this.on('taskFailed', (result: TaskExecutionResult) => {
      // Keep failed task state for debugging
      console.warn(`Task ${result.taskId} failed:`, result.error);
    });
  }
}

/**
 * Default execution strategy selector
 */
export class DefaultExecutionStrategySelector
  implements ExecutionStrategySelector
{
  selectStrategy(
    task: AutonomousTask,
    _context: TaskExecutionContext,
  ): ExecutionStrategy {
    // Return the task's configured strategy or generate a default one
    if (task.executionStrategy) {
      return task.executionStrategy;
    }

    // Generate strategy based on task characteristics
    const baseStrategy: ExecutionStrategy = {
      type: 'sequential',
      maxConcurrency: 1,
      retryPolicy: {
        maxRetries: task.maxRetries || 2,
        backoffStrategy: 'exponential',
        baseDelayMs: 1000,
        maxDelayMs: 30000,
      },
      timeoutMinutes: 15,
      requiresConfirmation: this.requiresConfirmation(task),
      preExecutionChecks: ['validate_params', 'check_permissions'],
      postExecutionValidation: ['verify_result', 'check_side_effects'],
    };

    // Adjust for parallelizable tasks
    if (this.isParallelizable(task)) {
      baseStrategy.type = 'parallel';
      baseStrategy.maxConcurrency = 3;
    }

    return baseStrategy;
  }

  canExecuteConcurrently(tasks: AutonomousTask[]): boolean {
    // Check if tasks have conflicting resource requirements
    const filePaths = new Set<string>();

    for (const task of tasks) {
      if (task.targetFiles) {
        for (const file of task.targetFiles) {
          if (
            filePaths.has(file) &&
            (task.category === TaskCategory.FEATURE ||
              task.category === TaskCategory.REFACTOR)
          ) {
            return false; // Conflicting file access
          }
          filePaths.add(file);
        }
      }
    }

    return true;
  }

  estimateExecutionTime(
    task: AutonomousTask,
    strategy: ExecutionStrategy,
  ): number {
    const baseTime = task.estimatedDuration || 10; // minutes

    // Adjust for strategy overhead
    let multiplier = 1;
    if (strategy.type === 'parallel') {
      multiplier = 0.7; // Parallel execution is typically faster
    }

    // Account for retries
    const retryMultiplier = 1 + (strategy.retryPolicy?.maxRetries || 0) * 0.3;

    return baseTime * multiplier * retryMultiplier;
  }

  private requiresConfirmation(task: AutonomousTask): boolean {
    return [
      TaskCategory.REFACTOR,
      TaskCategory.INFRASTRUCTURE,
      TaskCategory.INFRASTRUCTURE,
    ].includes(task.category);
  }

  private isParallelizable(task: AutonomousTask): boolean {
    return [
      TaskCategory.DOCUMENTATION,
      TaskCategory.DOCUMENTATION,
      TaskCategory.TEST,
    ].includes(task.category);
  }
}
