/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { EventEmitter } from 'node:events';
import { performance } from 'node:perf_hooks';
import winston from 'winston';
import type {
  ITask,
  ITaskQueue,
  ITaskExecutionEngine,
  TaskResult,
  TaskContext,
  ExecutionEngineStats,
  TaskMetrics} from './interfaces/TaskInterfaces.js';
import {
  TaskStatus,
  TaskPriority
} from './interfaces/TaskInterfaces.js';
import { TaskBreakdown } from './TaskBreakdown.js';
import { ExecutionContext } from './ExecutionContext.js';
import { FailureRecovery } from './FailureRecovery.js';

/**
 * Execution engine events for monitoring and control
 */
export enum ExecutionEngineEvent {
  ENGINE_STARTED = 'engine_started',
  ENGINE_STOPPED = 'engine_stopped',
  TASK_STARTED = 'task_started',
  TASK_COMPLETED = 'task_completed',
  TASK_FAILED = 'task_failed',
  TASK_CANCELLED = 'task_cancelled',
  TASK_RETRIED = 'task_retried',
  TASK_BREAKDOWN = 'task_breakdown',
  QUEUE_ADDED = 'queue_added',
  QUEUE_REMOVED = 'queue_removed',
  CONCURRENCY_CHANGED = 'concurrency_changed',
  STATS_UPDATED = 'stats_updated',
  ERROR = 'error',
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
 * Default configuration values
 */
const DEFAULT_CONFIG: ExecutionEngineConfig = {
  maxConcurrency: 10,
  defaultTimeout: 300000, // 5 minutes
  maxRetries: 3,
  statsUpdateInterval: 60000, // 1 minute
  enableTaskBreakdown: true,
  enableFailureRecovery: true,
  memoryThreshold: 1024 * 1024 * 512, // 512MB
  cpuThreshold: 80, // 80%
  enablePerformanceMonitoring: true,
  executionHistorySize: 1000,
};

/**
 * Task execution context with runtime information
 */
interface ExecutingTask {
  task: ITask;
  context: ExecutionContext;
  startTime: number;
  promise: Promise<TaskResult>;
  controller?: AbortController;
  retryCount: number;
  originalTask?: ITask; // For tracking parent task during breakdown
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
export class ExecutionEngine extends EventEmitter implements ITaskExecutionEngine {
  private readonly logger: winston.Logger;
  private readonly config: ExecutionEngineConfig;
  private readonly queues: Map<string, ITaskQueue> = new Map();
  private readonly executingTasks: Map<string, ExecutingTask> = new Map();
  private readonly taskBreakdown: TaskBreakdown;
  private readonly failureRecovery: FailureRecovery;

  // Engine state
  private isRunning = false;
  private isStopping = false;
  private currentConcurrency = 0;
  private statsTimer?: NodeJS.Timeout;

  // Statistics tracking
  private stats: ExecutionEngineStats = {
    totalExecuted: 0,
    activeTasks: 0,
    successfulTasks: 0,
    failedTasks: 0,
    averageExecutionTime: 0,
    uptime: 0,
    cpuUtilization: 0,
    memoryUsage: 0,
    throughput: 0,
  };

  private executionHistory: Array<{
    taskId: string;
    duration: number;
    success: boolean;
    timestamp: Date;
    memoryUsage: number;
    cpuUsage: number;
  }> = [];

  private startTime?: Date;

  constructor(
    readonly id: string,
    config: Partial<ExecutionEngineConfig> = {}
  ) {
    super();

    this.config = { ...DEFAULT_CONFIG, ...config };
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      defaultMeta: { component: 'ExecutionEngine', engineId: this.id },
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          ),
        }),
      ],
    });

    this.taskBreakdown = new TaskBreakdown({
      enabled: this.config.enableTaskBreakdown,
      logger: this.logger,
    });

    this.failureRecovery = new FailureRecovery({
      enabled: this.config.enableFailureRecovery,
      maxRetries: this.config.maxRetries,
      logger: this.logger,
    });

    this.logger.info('Execution engine initialized', {
      config: this.config,
    });
  }

  /**
   * Get engine running status
   */
  get isRunning(): boolean {
    return this.isRunning && !this.isStopping;
  }

  /**
   * Get current concurrency limit
   */
  get concurrencyLimit(): number {
    return this.config.maxConcurrency;
  }

  /**
   * Get number of currently executing tasks
   */
  get activeTaskCount(): number {
    return this.executingTasks.size;
  }

  /**
   * Start the execution engine
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      this.logger.warn('Engine is already running');
      return;
    }

    try {
      this.isRunning = true;
      this.isStopping = false;
      this.startTime = new Date();

      // Start background processes
      this.startStatsUpdater();
      this.startTaskProcessor();

      this.emit(ExecutionEngineEvent.ENGINE_STARTED);
      this.logger.info('Execution engine started successfully');

    } catch (error) {
      this.isRunning = false;
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('Failed to start execution engine', { error: errorMessage });
      this.emit(ExecutionEngineEvent.ERROR, error);
      throw error;
    }
  }

  /**
   * Stop the execution engine gracefully
   */
  async stop(force = false): Promise<void> {
    if (!this.isRunning) {
      this.logger.warn('Engine is not running');
      return;
    }

    try {
      this.isStopping = true;
      this.logger.info('Stopping execution engine', { force });

      // Stop stats updater
      if (this.statsTimer) {
        clearInterval(this.statsTimer);
        this.statsTimer = undefined;
      }

      // Handle active tasks
      if (force) {
        // Cancel all active tasks immediately
        await this.cancelAllActiveTasks();
      } else {
        // Wait for active tasks to complete
        await this.waitForActiveTasksCompletion();
      }

      this.isRunning = false;
      this.isStopping = false;

      this.emit(ExecutionEngineEvent.ENGINE_STOPPED);
      this.logger.info('Execution engine stopped successfully', {
        totalExecuted: this.stats.totalExecuted,
        uptime: Date.now() - (this.startTime?.getTime() || 0),
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('Error during engine shutdown', { error: errorMessage });
      this.emit(ExecutionEngineEvent.ERROR, error);
      throw error;
    }
  }

  /**
   * Execute a single task
   */
  async executeTask(task: ITask): Promise<TaskResult> {
    if (!this.isRunning) {
      throw new Error('Engine is not running');
    }

    const startTime = performance.now();

    try {
      // Check if task needs breakdown
      if (this.config.enableTaskBreakdown && await this.taskBreakdown.shouldBreakdown(task)) {
        this.logger.info('Breaking down complex task', {
          taskId: task.id,
          taskName: task.name,
          type: task.type,
        });

        const subtasks = await this.taskBreakdown.breakdownTask(task, task.context);
        this.emit(ExecutionEngineEvent.TASK_BREAKDOWN, task, subtasks);

        // Execute subtasks in dependency order
        return await this.executeSubtasks(task, subtasks);
      }

      // Execute single task
      return await this.executeSingleTask(task);

    } catch (error) {
      const duration = performance.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);

      this.logger.error('Task execution failed', {
        taskId: task.id,
        taskName: task.name,
        duration: `${duration.toFixed(2)}ms`,
        error: errorMessage,
      });

      const result: TaskResult = {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
        metrics: this.createTaskMetrics(task, startTime, performance.now(), false),
        messages: [`Task execution failed: ${errorMessage}`],
      };

      this.updateStats(result);
      this.emit(ExecutionEngineEvent.TASK_FAILED, task, result);

      return result;
    }
  }

  /**
   * Add task queue to engine
   */
  async addQueue(queue: ITaskQueue): Promise<void> {
    if (this.queues.has(queue.id)) {
      this.logger.warn('Queue already exists', { queueId: queue.id });
      return;
    }

    this.queues.set(queue.id, queue);
    this.emit(ExecutionEngineEvent.QUEUE_ADDED, queue);

    this.logger.info('Task queue added', {
      queueId: queue.id,
      queueName: queue.name,
      priority: queue.priority,
    });
  }

  /**
   * Remove task queue from engine
   */
  async removeQueue(queueId: string): Promise<boolean> {
    const queue = this.queues.get(queueId);
    if (!queue) {
      this.logger.warn('Queue not found for removal', { queueId });
      return false;
    }

    this.queues.delete(queueId);
    this.emit(ExecutionEngineEvent.QUEUE_REMOVED, queue);

    this.logger.info('Task queue removed', {
      queueId,
      queueName: queue.name,
    });

    return true;
  }

  /**
   * Get all managed queues
   */
  getQueues(): ITaskQueue[] {
    return Array.from(this.queues.values());
  }

  /**
   * Get engine execution statistics
   */
  async getStats(): Promise<ExecutionEngineStats> {
    this.updateEngineStats();
    return { ...this.stats };
  }

  /**
   * Set concurrency limit for parallel execution
   */
  setConcurrencyLimit(limit: number): void {
    if (limit <= 0) {
      throw new Error('Concurrency limit must be greater than 0');
    }

    const oldLimit = this.config.maxConcurrency;
    this.config.maxConcurrency = limit;

    this.emit(ExecutionEngineEvent.CONCURRENCY_CHANGED, oldLimit, limit);
    this.logger.info('Concurrency limit updated', {
      oldLimit,
      newLimit: limit,
      activeTaskCount: this.activeTaskCount,
    });
  }

  /**
   * Execute a single task with context isolation
   */
  private async executeSingleTask(task: ITask): Promise<TaskResult> {
    const startTime = performance.now();

    // Create execution context
    const executionContext = new ExecutionContext(task.context, {
      taskId: task.id,
      engineId: this.id,
      timeout: this.config.defaultTimeout,
    });

    // Create abort controller for cancellation
    const controller = new AbortController();

    const executingTask: ExecutingTask = {
      task,
      context: executionContext,
      startTime,
      promise: this.runTaskWithMonitoring(task, executionContext, controller),
      controller,
      retryCount: 0,
    };

    // Track executing task
    this.executingTasks.set(task.id, executingTask);
    this.currentConcurrency++;
    this.stats.activeTasks = this.activeTaskCount;

    this.emit(ExecutionEngineEvent.TASK_STARTED, task);

    try {
      // Execute task with timeout and monitoring
      const result = await executingTask.promise;

      // Update statistics
      this.updateStats(result);
      this.recordTaskExecution(task, performance.now() - startTime, result.success);

      if (result.success) {
        this.emit(ExecutionEngineEvent.TASK_COMPLETED, task, result);
      } else {
        // Try failure recovery if enabled
        if (this.config.enableFailureRecovery && executingTask.retryCount < this.config.maxRetries) {
          return await this.retryTaskExecution(executingTask);
        }
        this.emit(ExecutionEngineEvent.TASK_FAILED, task, result);
      }

      return result;

    } finally {
      // Clean up execution tracking
      this.executingTasks.delete(task.id);
      this.currentConcurrency--;
      this.stats.activeTasks = this.activeTaskCount;

      // Clean up execution context
      await executionContext.cleanup();
    }
  }

  /**
   * Execute subtasks from task breakdown
   */
  private async executeSubtasks(parentTask: ITask, subtasks: ITask[]): Promise<TaskResult> {
    const startTime = performance.now();
    const results: TaskResult[] = [];
    let allSuccessful = true;
    const messages: string[] = [];

    try {
      // Execute subtasks based on their dependencies
      const executionGroups = this.taskBreakdown.getExecutionOrder(subtasks);

      for (const group of executionGroups) {
        // Execute tasks in current group in parallel
        const groupPromises = group.map(subtask => this.executeSingleTask(subtask));
        const groupResults = await Promise.all(groupPromises);

        results.push(...groupResults);

        // Check if any task in the group failed
        for (const result of groupResults) {
          if (!result.success) {
            allSuccessful = false;
            messages.push(...result.messages);
          }
        }

        // Stop execution if critical failure occurred
        if (!allSuccessful && this.hasCriticalFailure(groupResults)) {
          break;
        }
      }

      const duration = performance.now() - startTime;

      // Combine results
      const combinedResult: TaskResult = {
        success: allSuccessful,
        data: results.map(r => r.data),
        metrics: this.createTaskMetrics(parentTask, startTime, performance.now(), allSuccessful),
        messages: [...messages, `Executed ${results.length} subtasks in ${duration.toFixed(2)}ms`],
        artifacts: results.flatMap(r => r.artifacts || []),
      };

      if (!allSuccessful) {
        combinedResult.error = new Error(`${results.filter(r => !r.success).length} of ${results.length} subtasks failed`);
      }

      return combinedResult;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
        metrics: this.createTaskMetrics(parentTask, startTime, performance.now(), false),
        messages: [`Subtask execution failed: ${errorMessage}`],
      };
    }
  }

  /**
   * Run task with performance monitoring and resource tracking
   */
  private async runTaskWithMonitoring(
    task: ITask,
    context: ExecutionContext,
    controller: AbortController
  ): Promise<TaskResult> {
    const startTime = performance.now();
    const initialMemory = process.memoryUsage().heapUsed;

    try {
      // Set up timeout
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          controller.abort();
          reject(new Error(`Task execution timeout after ${this.config.defaultTimeout}ms`));
        }, this.config.defaultTimeout);
      });

      // Execute task with monitoring
      const executionPromise = this.executeWithContext(task, context.getTaskContext());

      // Race between execution and timeout
      const result = await Promise.race([executionPromise, timeoutPromise]);

      // Calculate resource usage
      const endTime = performance.now();
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryDelta = finalMemory - initialMemory;

      // Enhance result with metrics
      if (result.metrics) {
        result.metrics.duration = endTime - startTime;
        result.metrics.memoryUsage = memoryDelta;
        result.metrics.endTime = new Date();
      }

      // Check resource thresholds
      if (this.config.enablePerformanceMonitoring) {
        if (memoryDelta > this.config.memoryThreshold) {
          result.messages.push(`High memory usage detected: ${(memoryDelta / (1024 * 1024)).toFixed(2)}MB`);
        }
      }

      return result;

    } catch (error) {
      if (controller.signal.aborted) {
        task.status = TaskStatus.CANCELLED;
        this.emit(ExecutionEngineEvent.TASK_CANCELLED, task);
      }

      throw error;
    }
  }

  /**
   * Execute task with isolated context
   */
  private async executeWithContext(task: ITask, context: TaskContext): Promise<TaskResult> {
    try {
      // Update task status
      task.status = TaskStatus.IN_PROGRESS;

      // Execute the task
      const result = await task.execute(context);

      // Update task status based on result
      task.status = result.success ? TaskStatus.COMPLETED : TaskStatus.FAILED;
      task.result = result;

      return result;

    } catch (error) {
      task.status = TaskStatus.FAILED;

      const errorResult: TaskResult = {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
        metrics: this.createTaskMetrics(task, performance.now(), performance.now(), false),
        messages: [`Task execution error: ${error instanceof Error ? error.message : String(error)}`],
      };

      task.result = errorResult;
      return errorResult;
    }
  }

  /**
   * Retry task execution with failure recovery
   */
  private async retryTaskExecution(executingTask: ExecutingTask): Promise<TaskResult> {
    executingTask.retryCount++;

    this.logger.info('Retrying task execution', {
      taskId: executingTask.task.id,
      retryCount: executingTask.retryCount,
      maxRetries: this.config.maxRetries,
    });

    // Apply failure recovery strategy
    const recoveryResult = await this.failureRecovery.applyRecoveryStrategy(
      executingTask.task,
      executingTask.task.result!,
      executingTask.retryCount
    );

    if (!recoveryResult.shouldRetry) {
      this.logger.warn('Failure recovery strategy recommends not to retry', {
        taskId: executingTask.task.id,
        reason: recoveryResult.reason,
      });
      return executingTask.task.result!;
    }

    // Create new execution context for retry
    const retryContext = new ExecutionContext(executingTask.task.context, {
      taskId: executingTask.task.id,
      engineId: this.id,
      timeout: this.config.defaultTimeout,
      retryCount: executingTask.retryCount,
    });

    // Update executing task
    executingTask.context = retryContext;
    executingTask.startTime = performance.now();
    executingTask.controller = new AbortController();
    executingTask.promise = this.runTaskWithMonitoring(
      executingTask.task,
      retryContext,
      executingTask.controller
    );

    this.emit(ExecutionEngineEvent.TASK_RETRIED, executingTask.task, executingTask.retryCount);

    try {
      const result = await executingTask.promise;

      if (result.success) {
        this.logger.info('Task retry successful', {
          taskId: executingTask.task.id,
          retryCount: executingTask.retryCount,
        });
      } else if (executingTask.retryCount < this.config.maxRetries) {
        // Try again if retries remaining
        return await this.retryTaskExecution(executingTask);
      }

      return result;

    } finally {
      await retryContext.cleanup();
    }
  }

  /**
   * Start background task processor
   */
  private async startTaskProcessor(): Promise<void> {
    // Process tasks from queues continuously
    setImmediate(async () => {
      while (this.isRunning && !this.isStopping) {
        try {
          // Check if we can process more tasks
          if (this.currentConcurrency < this.config.maxConcurrency) {
            const nextTask = await this.getNextTask();
            if (nextTask) {
              // Execute task without waiting (fire and forget)
              this.executeTask(nextTask).catch(error => {
                this.logger.error('Background task execution failed', {
                  taskId: nextTask.id,
                  error: error instanceof Error ? error.message : String(error),
                });
              });
            }
          }

          // Brief pause to prevent CPU spinning
          await new Promise(resolve => setTimeout(resolve, 10));
        } catch (error) {
          this.logger.error('Task processor error', {
            error: error instanceof Error ? error.message : String(error),
          });
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    });
  }

  /**
   * Get next task from highest priority queue
   */
  private async getNextTask(): Promise<ITask | null> {
    const sortedQueues = Array.from(this.queues.values())
      .sort((a, b) => a.priority - b.priority);

    for (const queue of sortedQueues) {
      const task = await queue.dequeue();
      if (task) {
        return task;
      }
    }

    return null;
  }

  /**
   * Start statistics updater
   */
  private startStatsUpdater(): void {
    if (this.config.statsUpdateInterval > 0) {
      this.statsTimer = setInterval(() => {
        this.updateEngineStats();
        this.emit(ExecutionEngineEvent.STATS_UPDATED, this.stats);
      }, this.config.statsUpdateInterval);
    }
  }

  /**
   * Update engine statistics
   */
  private updateEngineStats(): void {
    if (this.startTime) {
      this.stats.uptime = Date.now() - this.startTime.getTime();
    }

    this.stats.activeTasks = this.activeTaskCount;

    // Calculate throughput
    if (this.stats.uptime > 0) {
      this.stats.throughput = (this.stats.totalExecuted * 1000) / this.stats.uptime;
    }

    // Update system resource usage
    const memUsage = process.memoryUsage();
    this.stats.memoryUsage = memUsage.heapUsed;

    // Calculate CPU usage (simplified - in production, use proper CPU monitoring)
    this.stats.cpuUtilization = Math.min(100, (this.activeTaskCount / this.config.maxConcurrency) * 100);
  }

  /**
   * Update statistics after task completion
   */
  private updateStats(result: TaskResult): void {
    this.stats.totalExecuted++;

    if (result.success) {
      this.stats.successfulTasks++;
    } else {
      this.stats.failedTasks++;
    }

    // Update average execution time
    if (result.metrics.duration) {
      const totalTime = this.stats.averageExecutionTime * (this.stats.totalExecuted - 1) + result.metrics.duration;
      this.stats.averageExecutionTime = totalTime / this.stats.totalExecuted;
    }
  }

  /**
   * Record task execution in history
   */
  private recordTaskExecution(task: ITask, duration: number, success: boolean): void {
    const memUsage = process.memoryUsage();

    this.executionHistory.push({
      taskId: task.id,
      duration,
      success,
      timestamp: new Date(),
      memoryUsage: memUsage.heapUsed,
      cpuUsage: this.stats.cpuUtilization,
    });

    // Maintain history size limit
    if (this.executionHistory.length > this.config.executionHistorySize) {
      this.executionHistory = this.executionHistory.slice(-this.config.executionHistorySize);
    }
  }

  /**
   * Create task metrics
   */
  private createTaskMetrics(task: ITask, startTime: number, endTime: number, success: boolean): TaskMetrics {
    const memUsage = process.memoryUsage();

    return {
      startTime: new Date(Date.now() - (endTime - startTime)),
      endTime: new Date(),
      duration: endTime - startTime,
      memoryUsage: memUsage.heapUsed,
      cpuUsage: this.stats.cpuUtilization,
      retryCount: 0,
      performanceScore: success ? Math.max(0, 100 - ((endTime - startTime) / 1000)) : 0,
    };
  }

  /**
   * Check if results contain critical failures that should stop execution
   */
  private hasCriticalFailure(results: TaskResult[]): boolean {
    return results.some(result =>
      !result.success &&
      result.error &&
      (result.error.message.includes('critical') || result.error.message.includes('fatal'))
    );
  }

  /**
   * Cancel all active tasks
   */
  private async cancelAllActiveTasks(): Promise<void> {
    const cancelPromises: Array<Promise<void>> = [];

    for (const [taskId, executingTask] of this.executingTasks.entries()) {
      const cancelPromise = (async () => {
        try {
          if (executingTask.controller) {
            executingTask.controller.abort();
          }

          // Cancel the task
          await executingTask.task.cancel();

          this.logger.info('Task cancelled during engine shutdown', { taskId });
        } catch (error) {
          this.logger.error('Failed to cancel task during shutdown', {
            taskId,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      })();

      cancelPromises.push(cancelPromise);
    }

    await Promise.all(cancelPromises);
  }

  /**
   * Wait for all active tasks to complete
   */
  private async waitForActiveTasksCompletion(): Promise<void> {
    const timeout = 30000; // 30 seconds timeout
    const startTime = Date.now();

    while (this.executingTasks.size > 0 && (Date.now() - startTime) < timeout) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    if (this.executingTasks.size > 0) {
      this.logger.warn('Timeout waiting for active tasks to complete, forcing cancellation', {
        remainingTasks: this.executingTasks.size,
      });
      await this.cancelAllActiveTasks();
    }
  }

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
  }> {
    return [...this.executionHistory];
  }

  /**
   * Get detailed engine information for debugging
   */
  getDebugInfo(): Record<string, unknown> {
    return {
      id: this.id,
      isRunning: this.isRunning,
      isStopping: this.isStopping,
      config: this.config,
      stats: this.stats,
      activeTaskCount: this.activeTaskCount,
      queueCount: this.queues.size,
      executionHistorySize: this.executionHistory.length,
      uptime: this.stats.uptime,
      memoryUsage: `${(this.stats.memoryUsage / (1024 * 1024)).toFixed(2)}MB`,
      executingTasks: Array.from(this.executingTasks.keys()),
    };
  }

  /**
   * Dispose of the engine and clean up resources
   */
  async dispose(): Promise<void> {
    if (this.isRunning) {
      await this.stop(true);
    }

    this.removeAllListeners();
    this.queues.clear();
    this.executingTasks.clear();
    this.executionHistory.length = 0;

    this.logger.info('Execution engine disposed');
  }
}