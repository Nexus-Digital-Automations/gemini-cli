/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { EventEmitter } from 'node:events';
import winston from 'winston';
import {
  ITask,
  ITaskQueue,
  ITaskExecutionEngine,
  TaskContext,
  TaskResult,
  TaskStatus,
  TaskPriority,
  ExecutionEngineStats,
} from '../interfaces/TaskInterfaces.js';

/**
 * Execution engine events for monitoring
 */
export enum EngineEvent {
  TASK_STARTED = 'task_started',
  TASK_COMPLETED = 'task_completed',
  TASK_FAILED = 'task_failed',
  TASK_CANCELLED = 'task_cancelled',
  TASK_TIMEOUT = 'task_timeout',
  ENGINE_STARTED = 'engine_started',
  ENGINE_STOPPED = 'engine_stopped',
  QUEUE_ADDED = 'queue_added',
  QUEUE_REMOVED = 'queue_removed',
  STATS_UPDATED = 'stats_updated',
  ERROR = 'error',
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
 * Active task execution context
 */
interface ActiveTaskExecution {
  /** The executing task */
  task: ITask;
  /** Task execution promise */
  promise: Promise<TaskResult>;
  /** Task start time */
  startTime: Date;
  /** Task timeout handle */
  timeoutHandle?: NodeJS.Timeout;
  /** Cancel function */
  cancelFn?: () => Promise<boolean>;
  /** Resource monitoring data */
  resourceMonitor?: ResourceMonitor;
}

/**
 * Resource usage monitoring
 */
interface ResourceMonitor {
  /** Initial memory usage */
  initialMemory: number;
  /** Peak memory usage */
  peakMemory: number;
  /** CPU usage samples */
  cpuSamples: number[];
  /** Monitoring interval handle */
  intervalHandle: NodeJS.Timeout;
}

/**
 * Default engine configuration
 */
const DEFAULT_CONFIG: EngineConfig = {
  maxConcurrency: 5,
  defaultTimeout: 300000, // 5 minutes
  retryConfig: {
    maxAttempts: 3,
    baseDelay: 1000,
    backoffMultiplier: 2,
    maxDelay: 30000,
    retryOnTimeout: true,
  },
  resourceLimits: {
    maxMemoryMB: 512,
    maxCpuPercent: 80,
    maxExecutionTime: 600000, // 10 minutes
    enableMonitoring: true,
  },
  monitoring: {
    statsInterval: 30000, // 30 seconds
    collectMetrics: true,
    detailedLogging: true,
    trackMemoryUsage: true,
    trackCpuUsage: true,
  },
  queueSettings: {
    pollingInterval: 1000, // 1 second
    maxEmptyPolls: 5,
    emptyQueueBackoff: 2,
    priorityWeights: {
      [TaskPriority.CRITICAL]: 1.0,
      [TaskPriority.HIGH]: 0.8,
      [TaskPriority.MEDIUM]: 0.6,
      [TaskPriority.LOW]: 0.4,
      [TaskPriority.BACKGROUND]: 0.2,
    },
  },
};

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
export class TaskExecutionEngine extends EventEmitter implements ITaskExecutionEngine {
  private readonly logger: winston.Logger;
  private readonly config: EngineConfig;
  private readonly queues: Map<string, ITaskQueue> = new Map();
  private readonly activeTasks: Map<string, ActiveTaskExecution> = new Map();

  private isRunning = false;
  private processingTimer?: NodeJS.Timeout;
  private statsTimer?: NodeJS.Timeout;
  private emptyPollCount = 0;
  private currentPollingInterval: number;

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

  private startTime = new Date();
  private executionTimes: number[] = [];
  private lastStatsUpdate = new Date();

  constructor(
    public readonly id: string,
    config: Partial<EngineConfig> = {}
  ) {
    super();

    this.config = { ...DEFAULT_CONFIG, ...config };
    this.currentPollingInterval = this.config.queueSettings.pollingInterval;

    this.logger = winston.createLogger({
      level: this.config.monitoring.detailedLogging ? 'debug' : 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      defaultMeta: { component: 'TaskExecutionEngine', engineId: this.id },
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          ),
        }),
      ],
    });

    this.logger.info('Task execution engine initialized', {
      config: this.config,
    });
  }

  /**
   * Get whether engine is currently running
   */
  public get isRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Get current concurrency limit
   */
  public get concurrencyLimit(): number {
    return this.config.maxConcurrency;
  }

  /**
   * Get number of currently executing tasks
   */
  public get activeTaskCount(): number {
    return this.activeTasks.size;
  }

  /**
   * Start the execution engine
   */
  public async start(): Promise<void> {
    if (this.isRunning) {
      this.logger.warn('Engine already running, ignoring start request');
      return;
    }

    this.isRunning = true;
    this.startTime = new Date();
    this.emptyPollCount = 0;
    this.currentPollingInterval = this.config.queueSettings.pollingInterval;

    // Start queue processing
    this.startQueueProcessing();

    // Start statistics collection
    if (this.config.monitoring.statsInterval > 0) {
      this.statsTimer = setInterval(() => {
        this.updateStats();
      }, this.config.monitoring.statsInterval);
    }

    this.emit(EngineEvent.ENGINE_STARTED, this.id);
    this.logger.info('Task execution engine started');
  }

  /**
   * Stop the execution engine
   */
  public async stop(force: boolean = false): Promise<void> {
    if (!this.isRunning) {
      this.logger.warn('Engine not running, ignoring stop request');
      return;
    }

    this.logger.info('Stopping task execution engine', { force });

    // Stop queue processing
    if (this.processingTimer) {
      clearInterval(this.processingTimer);
      this.processingTimer = undefined;
    }

    // Stop statistics collection
    if (this.statsTimer) {
      clearInterval(this.statsTimer);
      this.statsTimer = undefined;
    }

    if (force) {
      // Force stop all active tasks
      const cancelPromises = Array.from(this.activeTasks.values()).map(async execution => {
        if (execution.cancelFn) {
          await execution.cancelFn();
        }
        this.cleanupTaskExecution(execution.task.id);
      });

      await Promise.allSettled(cancelPromises);
    } else {
      // Wait for active tasks to complete
      if (this.activeTasks.size > 0) {
        this.logger.info('Waiting for active tasks to complete', {
          activeCount: this.activeTasks.size,
        });

        await Promise.allSettled(
          Array.from(this.activeTasks.values()).map(execution => execution.promise)
        );
      }
    }

    this.isRunning = false;
    this.emit(EngineEvent.ENGINE_STOPPED, this.id);
    this.logger.info('Task execution engine stopped');
  }

  /**
   * Execute a single task
   */
  public async executeTask(task: ITask): Promise<TaskResult> {
    const startTime = performance.now();

    try {
      // Check if engine is running
      if (!this.isRunning) {
        throw new Error('Engine is not running');
      }

      // Check concurrency limit
      if (this.activeTasks.size >= this.config.maxConcurrency) {
        throw new Error('Maximum concurrency limit reached');
      }

      // Validate task
      if (!task.validate(task.context)) {
        throw new Error('Task validation failed');
      }

      this.logger.debug('Starting task execution', {
        taskId: task.id,
        taskName: task.name,
        taskType: task.type,
        priority: task.priority,
      });

      // Update task status
      task.status = TaskStatus.IN_PROGRESS;
      task.updatedAt = new Date();

      // Create execution context
      const execution = await this.createTaskExecution(task);

      // Add to active tasks
      this.activeTasks.set(task.id, execution);

      // Emit start event
      this.emit(EngineEvent.TASK_STARTED, task, execution.startTime);

      // Wait for task completion
      const result = await execution.promise;

      // Clean up execution
      this.cleanupTaskExecution(task.id);

      // Update statistics
      const executionTime = performance.now() - startTime;
      this.recordTaskCompletion(result.success, executionTime);

      // Update task status
      task.status = result.success ? TaskStatus.COMPLETED : TaskStatus.FAILED;
      task.result = result;
      task.updatedAt = new Date();

      // Emit completion event
      if (result.success) {
        this.emit(EngineEvent.TASK_COMPLETED, task, result);
      } else {
        this.emit(EngineEvent.TASK_FAILED, task, result);
      }

      this.logger.info('Task execution completed', {
        taskId: task.id,
        success: result.success,
        executionTime: `${executionTime.toFixed(2)}ms`,
      });

      return result;

    } catch (error) {
      const executionTime = performance.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);

      // Clean up if task was added to active tasks
      this.cleanupTaskExecution(task.id);

      // Record failure
      this.recordTaskCompletion(false, executionTime);

      // Update task status
      task.status = TaskStatus.FAILED;
      task.updatedAt = new Date();

      const result: TaskResult = {
        success: false,
        error: error instanceof Error ? error : new Error(errorMessage),
        metrics: {
          startTime: new Date(Date.now() - executionTime),
          endTime: new Date(),
          duration: executionTime,
          memoryUsage: process.memoryUsage().heapUsed,
          cpuUsage: 0,
          retryCount: 0,
          performanceScore: 0,
        },
        messages: [`Task execution failed: ${errorMessage}`],
      };

      task.result = result;

      this.emit(EngineEvent.TASK_FAILED, task, result);
      this.logger.error('Task execution failed', {
        taskId: task.id,
        error: errorMessage,
        executionTime: `${executionTime.toFixed(2)}ms`,
      });

      throw error;
    }
  }

  /**
   * Add task queue to engine
   */
  public async addQueue(queue: ITaskQueue): Promise<void> {
    if (this.queues.has(queue.id)) {
      this.logger.warn('Queue already exists, skipping', { queueId: queue.id });
      return;
    }

    this.queues.set(queue.id, queue);

    this.emit(EngineEvent.QUEUE_ADDED, queue);
    this.logger.info('Queue added to engine', {
      queueId: queue.id,
      queueName: queue.name,
      queueSize: queue.size,
    });
  }

  /**
   * Remove task queue from engine
   */
  public async removeQueue(queueId: string): Promise<boolean> {
    const removed = this.queues.delete(queueId);

    if (removed) {
      this.emit(EngineEvent.QUEUE_REMOVED, queueId);
      this.logger.info('Queue removed from engine', { queueId });
    }

    return removed;
  }

  /**
   * Get all managed queues
   */
  public getQueues(): ITaskQueue[] {
    return Array.from(this.queues.values());
  }

  /**
   * Get engine execution statistics
   */
  public async getStats(): Promise<ExecutionEngineStats> {
    this.updateStats();
    return { ...this.stats };
  }

  /**
   * Set concurrency limit for parallel execution
   */
  public setConcurrencyLimit(limit: number): void {
    if (limit < 1) {
      throw new Error('Concurrency limit must be at least 1');
    }

    this.config.maxConcurrency = limit;
    this.logger.info('Concurrency limit updated', { newLimit: limit });
  }

  /**
   * Start queue processing loop
   */
  private startQueueProcessing(): void {
    if (!this.isRunning) {
      return;
    }

    this.processingTimer = setTimeout(async () => {
      try {
        await this.processQueues();
      } catch (error) {
        this.logger.error('Queue processing error', {
          error: error instanceof Error ? error.message : String(error),
        });
        this.emit(EngineEvent.ERROR, error);
      } finally {
        // Schedule next processing cycle
        this.startQueueProcessing();
      }
    }, this.currentPollingInterval);
  }

  /**
   * Process all queues for available tasks
   */
  private async processQueues(): Promise<void> {
    if (!this.isRunning || this.activeTasks.size >= this.config.maxConcurrency) {
      return;
    }

    let tasksFound = false;

    // Process queues in priority order
    const sortedQueues = Array.from(this.queues.values()).sort((a, b) => {
      const weightA = this.config.queueSettings.priorityWeights[a.priority] || 0.5;
      const weightB = this.config.queueSettings.priorityWeights[b.priority] || 0.5;
      return weightB - weightA; // Higher weight first
    });

    for (const queue of sortedQueues) {
      if (this.activeTasks.size >= this.config.maxConcurrency) {
        break;
      }

      try {
        const task = await queue.dequeue();
        if (task) {
          tasksFound = true;
          this.executeTask(task).catch(error => {
            this.logger.error('Queued task execution failed', {
              taskId: task.id,
              queueId: queue.id,
              error: error instanceof Error ? error.message : String(error),
            });
          });
        }
      } catch (error) {
        this.logger.error('Error dequeuing from queue', {
          queueId: queue.id,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    // Adjust polling interval based on queue activity
    if (tasksFound) {
      this.emptyPollCount = 0;
      this.currentPollingInterval = this.config.queueSettings.pollingInterval;
    } else {
      this.emptyPollCount++;
      if (this.emptyPollCount > this.config.queueSettings.maxEmptyPolls) {
        this.currentPollingInterval = Math.min(
          this.currentPollingInterval * this.config.queueSettings.emptyQueueBackoff,
          30000 // Max 30 seconds
        );
      }
    }
  }

  /**
   * Create task execution context with monitoring
   */
  private async createTaskExecution(task: ITask): Promise<ActiveTaskExecution> {
    const startTime = new Date();

    // Create resource monitor if enabled
    let resourceMonitor: ResourceMonitor | undefined;
    if (this.config.resourceLimits.enableMonitoring) {
      resourceMonitor = this.createResourceMonitor(task);
    }

    // Create execution promise with retry logic
    const promise = this.executeTaskWithRetry(task);

    // Set up timeout
    const timeout = task.context.timeout || this.config.defaultTimeout;
    const timeoutHandle = setTimeout(() => {
      this.handleTaskTimeout(task.id);
    }, timeout);

    // Create cancel function
    const cancelFn = async (): Promise<boolean> => {
      return await task.cancel();
    };

    return {
      task,
      promise,
      startTime,
      timeoutHandle,
      cancelFn,
      resourceMonitor,
    };
  }

  /**
   * Execute task with retry logic
   */
  private async executeTaskWithRetry(task: ITask): Promise<TaskResult> {
    const { maxAttempts, baseDelay, backoffMultiplier, maxDelay, shouldRetry } = this.config.retryConfig;
    let lastError: Error | null = null;
    let attempt = 0;

    while (attempt < maxAttempts) {
      attempt++;

      try {
        const result = await task.execute(task.context);

        // Update metrics
        if (result.metrics) {
          result.metrics.retryCount = attempt - 1;
        }

        return result;

      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Check if we should retry
        const shouldRetryThis = shouldRetry
          ? shouldRetry(lastError, attempt)
          : attempt < maxAttempts;

        if (!shouldRetryThis) {
          break;
        }

        // Calculate delay with exponential backoff
        const delay = Math.min(
          baseDelay * Math.pow(backoffMultiplier, attempt - 1),
          maxDelay
        );

        this.logger.warn('Task execution failed, retrying', {
          taskId: task.id,
          attempt,
          maxAttempts,
          delay: `${delay}ms`,
          error: lastError.message,
        });

        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    // All attempts failed
    throw lastError || new Error('Task execution failed after all retry attempts');
  }

  /**
   * Create resource monitor for task
   */
  private createResourceMonitor(task: ITask): ResourceMonitor {
    const initialMemory = process.memoryUsage().heapUsed;
    const monitor: ResourceMonitor = {
      initialMemory,
      peakMemory: initialMemory,
      cpuSamples: [],
      intervalHandle: setInterval(() => {
        const currentMemory = process.memoryUsage().heapUsed;
        monitor.peakMemory = Math.max(monitor.peakMemory, currentMemory);

        // Simplified CPU usage estimation
        const cpuUsage = process.cpuUsage();
        const totalUsage = (cpuUsage.user + cpuUsage.system) / 1000000; // Convert to seconds
        monitor.cpuSamples.push(totalUsage);

        // Check resource limits
        const memoryMB = currentMemory / (1024 * 1024);
        if (memoryMB > this.config.resourceLimits.maxMemoryMB) {
          this.logger.warn('Task memory usage exceeded limit', {
            taskId: task.id,
            memoryUsageMB: memoryMB,
            limitMB: this.config.resourceLimits.maxMemoryMB,
          });
        }
      }, 1000); // Sample every second
    };

    return monitor;
  }

  /**
   * Handle task timeout
   */
  private handleTaskTimeout(taskId: string): void {
    const execution = this.activeTasks.get(taskId);
    if (!execution) {
      return;
    }

    this.logger.warn('Task timed out', {
      taskId,
      taskName: execution.task.name,
      startTime: execution.startTime,
    });

    // Attempt to cancel task
    if (execution.cancelFn) {
      execution.cancelFn().catch(error => {
        this.logger.error('Failed to cancel timed out task', {
          taskId,
          error: error instanceof Error ? error.message : String(error),
        });
      });
    }

    // Update task status
    execution.task.status = TaskStatus.FAILED;
    execution.task.updatedAt = new Date();

    // Clean up execution
    this.cleanupTaskExecution(taskId);

    // Emit timeout event
    this.emit(EngineEvent.TASK_TIMEOUT, execution.task);
  }

  /**
   * Clean up task execution resources
   */
  private cleanupTaskExecution(taskId: string): void {
    const execution = this.activeTasks.get(taskId);
    if (!execution) {
      return;
    }

    // Clear timeout
    if (execution.timeoutHandle) {
      clearTimeout(execution.timeoutHandle);
    }

    // Stop resource monitoring
    if (execution.resourceMonitor) {
      clearInterval(execution.resourceMonitor.intervalHandle);
    }

    // Remove from active tasks
    this.activeTasks.delete(taskId);

    this.logger.debug('Task execution cleaned up', { taskId });
  }

  /**
   * Record task completion for statistics
   */
  private recordTaskCompletion(success: boolean, executionTime: number): void {
    this.stats.totalExecuted++;

    if (success) {
      this.stats.successfulTasks++;
    } else {
      this.stats.failedTasks++;
    }

    this.executionTimes.push(executionTime);

    // Limit execution times array size
    if (this.executionTimes.length > 1000) {
      this.executionTimes = this.executionTimes.slice(-500);
    }
  }

  /**
   * Update engine statistics
   */
  private updateStats(): void {
    const now = new Date();

    // Update basic metrics
    this.stats.activeTasks = this.activeTasks.size;
    this.stats.uptime = now.getTime() - this.startTime.getTime();

    // Calculate average execution time
    if (this.executionTimes.length > 0) {
      this.stats.averageExecutionTime =
        this.executionTimes.reduce((sum, time) => sum + time, 0) / this.executionTimes.length;
    }

    // Calculate throughput (tasks per second)
    const timeDelta = now.getTime() - this.lastStatsUpdate.getTime();
    if (timeDelta > 0 && this.stats.totalExecuted > 0) {
      this.stats.throughput = (this.stats.totalExecuted * 1000) / this.stats.uptime;
    }

    // Update resource usage
    if (this.config.monitoring.trackMemoryUsage) {
      this.stats.memoryUsage = process.memoryUsage().heapUsed;
    }

    if (this.config.monitoring.trackCpuUsage) {
      const cpuUsage = process.cpuUsage();
      this.stats.cpuUtilization = ((cpuUsage.user + cpuUsage.system) / 1000000) / (this.stats.uptime / 1000) * 100;
    }

    this.lastStatsUpdate = now;
    this.emit(EngineEvent.STATS_UPDATED, this.stats);
  }

  /**
   * Get engine configuration
   */
  public getConfig(): EngineConfig {
    return { ...this.config };
  }

  /**
   * Update engine configuration
   */
  public updateConfig(updates: Partial<EngineConfig>): void {
    Object.assign(this.config, updates);

    this.logger.info('Engine configuration updated', { updates });

    // Update logging level if changed
    if (updates.monitoring?.detailedLogging !== undefined) {
      this.logger.level = updates.monitoring.detailedLogging ? 'debug' : 'info';
    }

    // Restart stats timer if interval changed
    if (updates.monitoring?.statsInterval !== undefined) {
      if (this.statsTimer) {
        clearInterval(this.statsTimer);
      }
      if (updates.monitoring.statsInterval > 0) {
        this.statsTimer = setInterval(() => {
          this.updateStats();
        }, updates.monitoring.statsInterval);
      }
    }
  }

  /**
   * Get detailed engine state for debugging
   */
  public getDebugInfo(): Record<string, unknown> {
    const queueInfo = Array.from(this.queues.values()).map(queue => ({
      id: queue.id,
      name: queue.name,
      size: queue.size,
      priority: queue.priority,
    }));

    const activeTaskInfo = Array.from(this.activeTasks.values()).map(execution => ({
      taskId: execution.task.id,
      taskName: execution.task.name,
      startTime: execution.startTime,
      memoryUsage: execution.resourceMonitor?.peakMemory,
      cpuSamples: execution.resourceMonitor?.cpuSamples.length,
    }));

    return {
      id: this.id,
      isRunning: this.isRunning,
      config: this.config,
      stats: this.stats,
      queues: queueInfo,
      activeTasks: activeTaskInfo,
      emptyPollCount: this.emptyPollCount,
      currentPollingInterval: this.currentPollingInterval,
    };
  }

  /**
   * Dispose of the execution engine
   */
  public async dispose(): Promise<void> {
    await this.stop(true);
    this.removeAllListeners();

    this.logger.info('Task execution engine disposed');
  }
}