/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { EventEmitter } from 'node:events';
import winston from 'winston';
import type {
  ITask,
  ITaskQueue,
  QueueStats} from '../interfaces/TaskInterfaces.js';
import {
  TaskPriority,
  TaskStatus
} from '../interfaces/TaskInterfaces.js';

/**
 * Queue event types for monitoring and notifications
 */
export enum QueueEvent {
  TASK_ADDED = 'task_added',
  TASK_REMOVED = 'task_removed',
  TASK_PROCESSED = 'task_processed',
  QUEUE_EMPTY = 'queue_empty',
  QUEUE_FULL = 'queue_full',
  PRIORITY_CHANGED = 'priority_changed',
  STATS_UPDATED = 'stats_updated',
}

/**
 * Queue configuration options
 */
export interface QueueConfig {
  /** Maximum queue size (0 for unlimited) */
  maxSize: number;
  /** Enable automatic priority adjustment based on age */
  enableAgePriority: boolean;
  /** Age-based priority boost interval in milliseconds */
  agePriorityInterval: number;
  /** Enable task deduplication based on parameters */
  enableDeduplication: boolean;
  /** Maximum processing time before task timeout */
  taskTimeout: number;
  /** Statistics collection interval in milliseconds */
  statsInterval: number;
  /** Enable queue persistence */
  enablePersistence: boolean;
}

/**
 * Default queue configuration
 */
const DEFAULT_CONFIG: QueueConfig = {
  maxSize: 10000,
  enableAgePriority: true,
  agePriorityInterval: 300000, // 5 minutes
  enableDeduplication: true,
  taskTimeout: 300000, // 5 minutes
  statsInterval: 60000, // 1 minute
  enablePersistence: true,
};

/**
 * Queued task wrapper with metadata
 */
interface QueuedTask {
  /** The actual task */
  task: ITask;
  /** Queue entry timestamp */
  queuedAt: Date;
  /** Original priority when queued */
  originalPriority: TaskPriority;
  /** Current effective priority (may be boosted) */
  effectivePriority: TaskPriority;
  /** Number of priority boosts applied */
  priorityBoosts: number;
  /** Task hash for deduplication */
  hash: string;
}

/**
 * Self-managing priority-based task queue implementation
 *
 * Features:
 * - Priority-based scheduling with multiple priority levels
 * - Automatic age-based priority boosting to prevent starvation
 * - Task deduplication based on content hashing
 * - Comprehensive statistics and monitoring
 * - Event-driven architecture for real-time updates
 * - Configurable queue limits and timeouts
 * - Persistence support for cross-session reliability
 */
export class PriorityTaskQueue extends EventEmitter implements ITaskQueue {
  private readonly logger: winston.Logger;
  private readonly config: QueueConfig;
  private readonly tasks: Map<string, QueuedTask> = new Map();
  private readonly priorityQueues: Map<TaskPriority, QueuedTask[]> = new Map();
  private readonly tasksByPriority: Map<TaskPriority, Set<string>> = new Map();

  // Statistics tracking
  private stats: QueueStats = {
    totalProcessed: 0,
    currentSize: 0,
    averageProcessingTime: 0,
    successRate: 0,
    throughput: 0,
    peakSize: 0,
    lastActivity: new Date(),
  };

  private processingTimes: number[] = [];
  private successCount = 0;
  private totalAttempts = 0;
  private startTime = new Date();
  private lastStatsUpdate = new Date();
  private statsTimer?: NodeJS.Timeout;
  private priorityTimer?: NodeJS.Timeout;
  private isInitialized = false;

  constructor(
    readonly id: string,
    readonly name: string,
    readonly priority: TaskPriority = TaskPriority.MEDIUM,
    config: Partial<QueueConfig> = {}
  ) {
    super();

    this.config = { ...DEFAULT_CONFIG, ...config };
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      defaultMeta: { component: 'PriorityTaskQueue', queueId: this.id },
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          ),
        }),
      ],
    });

    this.initialize();
  }

  /**
   * Initialize priority queues and start background processes
   */
  private initialize(): void {
    // Initialize priority queues for each priority level
    for (const priority of Object.values(TaskPriority)) {
      if (typeof priority === 'number') {
        this.priorityQueues.set(priority, []);
        this.tasksByPriority.set(priority, new Set());
      }
    }

    // Start statistics collection
    if (this.config.statsInterval > 0) {
      this.statsTimer = setInterval(() => {
        this.updateStats();
      }, this.config.statsInterval);
    }

    // Start age-based priority boosting
    if (this.config.enableAgePriority && this.config.agePriorityInterval > 0) {
      this.priorityTimer = setInterval(() => {
        this.boostOldTaskPriorities();
      }, this.config.agePriorityInterval);
    }

    this.isInitialized = true;
    this.logger.info(`Priority task queue initialized: ${this.name}`, {
      config: this.config,
    });
  }

  /**
   * Get current queue size
   */
  get size(): number {
    return this.tasks.size;
  }

  /**
   * Check if queue is currently processing (always false for queue itself)
   */
  get isProcessing(): boolean {
    // Queue doesn't process tasks itself, execution engine does
    return false;
  }

  /**
   * Add task to queue with priority-based placement
   */
  async enqueue(task: ITask): Promise<void> {
    const startTime = performance.now();

    try {
      // Validate queue capacity
      if (this.config.maxSize > 0 && this.size >= this.config.maxSize) {
        const error = new Error(`Queue ${this.name} is full (max: ${this.config.maxSize})`);
        this.logger.error('Failed to enqueue task - queue full', {
          taskId: task.id,
          queueSize: this.size,
          maxSize: this.config.maxSize,
        });
        throw error;
      }

      // Check for existing task
      if (this.tasks.has(task.id)) {
        this.logger.warn('Task already exists in queue, skipping', {
          taskId: task.id,
          taskName: task.name,
        });
        return;
      }

      // Create task hash for deduplication
      const taskHash = this.config.enableDeduplication
        ? this.generateTaskHash(task)
        : task.id;

      // Check for duplicate tasks
      if (this.config.enableDeduplication && this.hasDuplicateTask(taskHash)) {
        this.logger.info('Duplicate task detected, skipping', {
          taskId: task.id,
          taskHash,
        });
        return;
      }

      // Create queued task wrapper
      const queuedTask: QueuedTask = {
        task,
        queuedAt: new Date(),
        originalPriority: task.priority,
        effectivePriority: task.priority,
        priorityBoosts: 0,
        hash: taskHash,
      };

      // Add to main task map
      this.tasks.set(task.id, queuedTask);

      // Add to priority-specific queue
      const priorityQueue = this.priorityQueues.get(task.priority);
      if (priorityQueue) {
        priorityQueue.push(queuedTask);
        this.sortPriorityQueue(task.priority);
      }

      // Track by priority for fast lookup
      this.tasksByPriority.get(task.priority)?.add(task.id);

      // Update statistics
      this.stats.currentSize = this.size;
      this.stats.peakSize = Math.max(this.stats.peakSize, this.size);
      this.stats.lastActivity = new Date();

      // Emit events
      this.emit(QueueEvent.TASK_ADDED, task, this.size);

      if (this.size >= this.config.maxSize) {
        this.emit(QueueEvent.QUEUE_FULL, this.size);
      }

      const enqueueDuration = performance.now() - startTime;
      this.logger.info('Task enqueued successfully', {
        taskId: task.id,
        taskName: task.name,
        priority: task.priority,
        queueSize: this.size,
        enqueueDuration: `${enqueueDuration.toFixed(2)}ms`,
      });

    } catch (error) {
      this.logger.error('Failed to enqueue task', {
        taskId: task.id,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Remove and return highest priority task from queue
   */
  async dequeue(): Promise<ITask | null> {
    const startTime = performance.now();

    try {
      // Check if queue is empty
      if (this.size === 0) {
        return null;
      }

      // Find highest priority task
      const queuedTask = this.getHighestPriorityTask();
      if (!queuedTask) {
        return null;
      }

      // Remove task from all data structures
      this.removeTaskFromQueue(queuedTask.task.id);

      // Update statistics
      this.stats.currentSize = this.size;
      this.stats.lastActivity = new Date();

      // Emit events
      this.emit(QueueEvent.TASK_REMOVED, queuedTask.task, this.size);

      if (this.size === 0) {
        this.emit(QueueEvent.QUEUE_EMPTY);
      }

      const dequeueDuration = performance.now() - startTime;
      this.logger.info('Task dequeued successfully', {
        taskId: queuedTask.task.id,
        taskName: queuedTask.task.name,
        effectivePriority: queuedTask.effectivePriority,
        waitTime: Date.now() - queuedTask.queuedAt.getTime(),
        dequeueDuration: `${dequeueDuration.toFixed(2)}ms`,
      });

      return queuedTask.task;

    } catch (error) {
      this.logger.error('Failed to dequeue task', {
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  }

  /**
   * Peek at next task without removing it
   */
  async peek(): Promise<ITask | null> {
    const queuedTask = this.getHighestPriorityTask();
    return queuedTask ? queuedTask.task : null;
  }

  /**
   * Remove specific task from queue
   */
  async remove(taskId: string): Promise<boolean> {
    const startTime = performance.now();

    try {
      const queuedTask = this.tasks.get(taskId);
      if (!queuedTask) {
        this.logger.warn('Task not found for removal', { taskId });
        return false;
      }

      // Remove from all data structures
      this.removeTaskFromQueue(taskId);

      // Update statistics
      this.stats.currentSize = this.size;
      this.stats.lastActivity = new Date();

      // Emit events
      this.emit(QueueEvent.TASK_REMOVED, queuedTask.task, this.size);

      if (this.size === 0) {
        this.emit(QueueEvent.QUEUE_EMPTY);
      }

      const removeDuration = performance.now() - startTime;
      this.logger.info('Task removed successfully', {
        taskId,
        removeDuration: `${removeDuration.toFixed(2)}ms`,
      });

      return true;

    } catch (error) {
      this.logger.error('Failed to remove task', {
        taskId,
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  /**
   * Get all tasks currently in queue
   */
  async getTasks(): Promise<ITask[]> {
    return Array.from(this.tasks.values())
      .sort((a, b) => this.compareTaskPriority(a, b))
      .map(queuedTask => queuedTask.task);
  }

  /**
   * Clear all tasks from queue
   */
  async clear(): Promise<number> {
    const previousSize = this.size;

    try {
      // Clear all data structures
      this.tasks.clear();

      for (const priorityQueue of this.priorityQueues.values()) {
        priorityQueue.length = 0;
      }

      for (const prioritySet of this.tasksByPriority.values()) {
        prioritySet.clear();
      }

      // Update statistics
      this.stats.currentSize = 0;
      this.stats.lastActivity = new Date();

      // Emit event
      this.emit(QueueEvent.QUEUE_EMPTY);

      this.logger.info('Queue cleared successfully', {
        tasksRemoved: previousSize,
      });

      return previousSize;

    } catch (error) {
      this.logger.error('Failed to clear queue', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Get comprehensive queue statistics
   */
  async getStats(): Promise<QueueStats> {
    this.updateStats();
    return { ...this.stats };
  }

  /**
   * Find highest priority task considering effective priorities
   */
  private getHighestPriorityTask(): QueuedTask | null {
    for (let priority = TaskPriority.CRITICAL; priority <= TaskPriority.BACKGROUND; priority++) {
      const priorityQueue = this.priorityQueues.get(priority);
      if (priorityQueue && priorityQueue.length > 0) {
        // Return first task in sorted priority queue
        return priorityQueue[0];
      }
    }
    return null;
  }

  /**
   * Remove task from all queue data structures
   */
  private removeTaskFromQueue(taskId: string): void {
    const queuedTask = this.tasks.get(taskId);
    if (!queuedTask) {
      return;
    }

    // Remove from main map
    this.tasks.delete(taskId);

    // Remove from priority queue
    const priorityQueue = this.priorityQueues.get(queuedTask.effectivePriority);
    if (priorityQueue) {
      const index = priorityQueue.findIndex(qt => qt.task.id === taskId);
      if (index !== -1) {
        priorityQueue.splice(index, 1);
      }
    }

    // Remove from priority set
    this.tasksByPriority.get(queuedTask.effectivePriority)?.delete(taskId);
  }

  /**
   * Sort priority queue by effective priority and queue time
   */
  private sortPriorityQueue(priority: TaskPriority): void {
    const priorityQueue = this.priorityQueues.get(priority);
    if (!priorityQueue) {
      return;
    }

    priorityQueue.sort((a, b) => this.compareTaskPriority(a, b));
  }

  /**
   * Compare two queued tasks for priority ordering
   */
  private compareTaskPriority(a: QueuedTask, b: QueuedTask): number {
    // First compare by effective priority (lower number = higher priority)
    if (a.effectivePriority !== b.effectivePriority) {
      return a.effectivePriority - b.effectivePriority;
    }

    // Then by original priority (preserve FIFO for same effective priority)
    if (a.originalPriority !== b.originalPriority) {
      return a.originalPriority - b.originalPriority;
    }

    // Finally by queue time (FIFO)
    return a.queuedAt.getTime() - b.queuedAt.getTime();
  }

  /**
   * Generate hash for task deduplication
   */
  private generateTaskHash(task: ITask): string {
    const hashData = {
      name: task.name,
      type: task.type,
      parameters: task.parameters,
    };

    // Simple hash implementation (in production, use crypto.createHash)
    return Buffer.from(JSON.stringify(hashData)).toString('base64');
  }

  /**
   * Check if duplicate task already exists
   */
  private hasDuplicateTask(hash: string): boolean {
    for (const queuedTask of this.tasks.values()) {
      if (queuedTask.hash === hash) {
        return true;
      }
    }
    return false;
  }

  /**
   * Boost priority of old tasks to prevent starvation
   */
  private boostOldTaskPriorities(): void {
    const now = Date.now();
    const boostThreshold = this.config.agePriorityInterval;
    let boostedCount = 0;

    for (const queuedTask of this.tasks.values()) {
      const waitTime = now - queuedTask.queuedAt.getTime();

      // Check if task has been waiting long enough for a boost
      if (waitTime > boostThreshold * (queuedTask.priorityBoosts + 1)) {
        const oldPriority = queuedTask.effectivePriority;

        // Boost priority (decrease number = higher priority)
        if (queuedTask.effectivePriority > TaskPriority.CRITICAL) {
          queuedTask.effectivePriority = Math.max(
            TaskPriority.CRITICAL,
            queuedTask.effectivePriority - 1
          ) as TaskPriority;
          queuedTask.priorityBoosts++;

          // Move to new priority queue if priority changed
          if (oldPriority !== queuedTask.effectivePriority) {
            this.moveTaskToPriorityQueue(queuedTask, oldPriority);
            boostedCount++;
          }
        }
      }
    }

    if (boostedCount > 0) {
      this.emit(QueueEvent.PRIORITY_CHANGED, boostedCount);
      this.logger.info('Priority boost applied to old tasks', {
        boostedCount,
        totalTasks: this.size,
      });
    }
  }

  /**
   * Move task to new priority queue after priority change
   */
  private moveTaskToPriorityQueue(queuedTask: QueuedTask, oldPriority: TaskPriority): void {
    // Remove from old priority queue
    const oldQueue = this.priorityQueues.get(oldPriority);
    if (oldQueue) {
      const index = oldQueue.findIndex(qt => qt.task.id === queuedTask.task.id);
      if (index !== -1) {
        oldQueue.splice(index, 1);
      }
    }
    this.tasksByPriority.get(oldPriority)?.delete(queuedTask.task.id);

    // Add to new priority queue
    const newQueue = this.priorityQueues.get(queuedTask.effectivePriority);
    if (newQueue) {
      newQueue.push(queuedTask);
      this.sortPriorityQueue(queuedTask.effectivePriority);
    }
    this.tasksByPriority.get(queuedTask.effectivePriority)?.add(queuedTask.task.id);
  }

  /**
   * Update queue statistics
   */
  private updateStats(): void {
    const now = new Date();
    const timeDelta = now.getTime() - this.lastStatsUpdate.getTime();

    // Update basic metrics
    this.stats.currentSize = this.size;
    this.stats.lastActivity = now;

    // Calculate average processing time
    if (this.processingTimes.length > 0) {
      this.stats.averageProcessingTime =
        this.processingTimes.reduce((sum, time) => sum + time, 0) / this.processingTimes.length;
    }

    // Calculate success rate
    if (this.totalAttempts > 0) {
      this.stats.successRate = (this.successCount / this.totalAttempts) * 100;
    }

    // Calculate throughput (tasks per second)
    if (timeDelta > 0) {
      const tasksProcessedInInterval = this.stats.totalProcessed;
      this.stats.throughput = (tasksProcessedInInterval * 1000) / timeDelta;
    }

    // Limit processing times array size for memory management
    if (this.processingTimes.length > 1000) {
      this.processingTimes = this.processingTimes.slice(-500);
    }

    this.lastStatsUpdate = now;
    this.emit(QueueEvent.STATS_UPDATED, this.stats);
  }

  /**
   * Record task processing completion
   */
  recordTaskProcessed(success: boolean, processingTime: number): void {
    this.stats.totalProcessed++;
    this.totalAttempts++;

    if (success) {
      this.successCount++;
    }

    this.processingTimes.push(processingTime);
    this.stats.lastActivity = new Date();

    this.emit(QueueEvent.TASK_PROCESSED, success, processingTime);
  }

  /**
   * Cleanup resources and stop background processes
   */
  dispose(): void {
    if (this.statsTimer) {
      clearInterval(this.statsTimer);
      this.statsTimer = undefined;
    }

    if (this.priorityTimer) {
      clearInterval(this.priorityTimer);
      this.priorityTimer = undefined;
    }

    this.removeAllListeners();

    this.logger.info('Priority task queue disposed', {
      finalSize: this.size,
      totalProcessed: this.stats.totalProcessed,
    });
  }

  /**
   * Get queue configuration
   */
  getConfig(): QueueConfig {
    return { ...this.config };
  }

  /**
   * Update queue configuration
   */
  updateConfig(updates: Partial<QueueConfig>): void {
    Object.assign(this.config, updates);

    this.logger.info('Queue configuration updated', {
      updates,
      newConfig: this.config,
    });

    // Restart timers if intervals changed
    if (updates.statsInterval !== undefined) {
      if (this.statsTimer) {
        clearInterval(this.statsTimer);
      }
      if (updates.statsInterval > 0) {
        this.statsTimer = setInterval(() => {
          this.updateStats();
        }, updates.statsInterval);
      }
    }

    if (updates.agePriorityInterval !== undefined) {
      if (this.priorityTimer) {
        clearInterval(this.priorityTimer);
      }
      if (this.config.enableAgePriority && updates.agePriorityInterval > 0) {
        this.priorityTimer = setInterval(() => {
          this.boostOldTaskPriorities();
        }, updates.agePriorityInterval);
      }
    }
  }

  /**
   * Get detailed queue state for debugging
   */
  getDebugInfo(): Record<string, unknown> {
    const priorityBreakdown: Record<string, number> = {};
    for (const [priority, taskSet] of this.tasksByPriority.entries()) {
      priorityBreakdown[TaskPriority[priority]] = taskSet.size;
    }

    return {
      id: this.id,
      name: this.name,
      size: this.size,
      isInitialized: this.isInitialized,
      config: this.config,
      stats: this.stats,
      priorityBreakdown,
      oldestTask: this.getOldestTaskAge(),
      newestTask: this.getNewestTaskAge(),
    };
  }

  /**
   * Get age of oldest task in queue
   */
  private getOldestTaskAge(): number | null {
    let oldest: Date | null = null;

    for (const queuedTask of this.tasks.values()) {
      if (!oldest || queuedTask.queuedAt < oldest) {
        oldest = queuedTask.queuedAt;
      }
    }

    return oldest ? Date.now() - oldest.getTime() : null;
  }

  /**
   * Get age of newest task in queue
   */
  private getNewestTaskAge(): number | null {
    let newest: Date | null = null;

    for (const queuedTask of this.tasks.values()) {
      if (!newest || queuedTask.queuedAt > newest) {
        newest = queuedTask.queuedAt;
      }
    }

    return newest ? Date.now() - newest.getTime() : null;
  }
}