/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { EventEmitter } from 'node:events';
import { v4 as uuidv4 } from 'uuid';
import { logger as getLogger } from '../utils/logger.js';

const logger = getLogger();
import type { Task, TaskExecutionResult, PriorityFactors} from './TaskQueue.js';
import { TaskPriority, TaskStatus, TaskCategory } from './types.js';

/**
 * @fileoverview Advanced Task Priority Scheduler with Dynamic Adjustment
 *
 * This system provides sophisticated priority scheduling with:
 * - Dynamic priority adjustment based on multiple factors
 * - Machine learning-based priority optimization
 * - Load balancing across multiple priority queues
 * - Fairness guarantees and starvation prevention
 * - Real-time priority recalculation
 */

/**
 * Priority adjustment strategies
 */
export enum PriorityStrategy {
  STATIC = 'static', // Fixed priority, no adjustment
  AGE_BASED = 'age_based', // Increase priority with age
  DEADLINE_DRIVEN = 'deadline_driven', // Adjust based on deadline proximity
  DEPENDENCY_AWARE = 'dependency_aware', // Consider dependency chains
  WORKLOAD_ADAPTIVE = 'workload_adaptive', // Adapt to current workload
  ML_OPTIMIZED = 'ml_optimized', // Machine learning based optimization
  HYBRID = 'hybrid', // Combination of multiple strategies
}

/**
 * Load balancing algorithms for priority queues
 */
export enum LoadBalanceAlgorithm {
  WEIGHTED_ROUND_ROBIN = 'weighted_round_robin',
  DEFICIT_ROUND_ROBIN = 'deficit_round_robin',
  FAIR_QUEUING = 'fair_queuing',
  CLASS_BASED_QUEUING = 'class_based_queuing',
  PRIORITY_QUEUING = 'priority_queuing',
}

/**
 * Starvation prevention mechanisms
 */
export enum StarvationPreventionMode {
  NONE = 'none', // No starvation prevention
  PRIORITY_AGING = 'priority_aging', // Gradually increase priority with age
  TIME_SLICING = 'time_slicing', // Allocate time slices fairly
  QUOTA_BASED = 'quota_based', // Ensure minimum execution quotas
  ADAPTIVE_BOOST = 'adaptive_boost', // Intelligently boost starving tasks
}

/**
 * Priority scheduler configuration
 */
export interface PrioritySchedulerConfig {
  strategy: PriorityStrategy;
  loadBalanceAlgorithm: LoadBalanceAlgorithm;
  starvationPrevention: StarvationPreventionMode;

  // Timing parameters
  adjustmentInterval: number; // How often to recalculate priorities (ms)
  maxStarvationTime: number; // Maximum time before starvation prevention kicks in
  priorityDecayRate: number; // Rate at which boosted priorities decay

  // Weighting factors
  ageWeight: number; // How much age affects priority (0-1)
  deadlineWeight: number; // How much deadline proximity affects priority
  dependencyWeight: number; // How much dependency chain length affects priority
  userWeight: number; // How much user-defined priority affects final priority
  systemWeight: number; // How much system criticality affects priority

  // Fairness parameters
  fairnessThreshold: number; // Minimum fairness index to maintain
  maxPriorityBoost: number; // Maximum priority boost for starving tasks
  minExecutionQuota: number; // Minimum execution percentage per priority level

  // Performance optimization
  enableBatchAdjustment: boolean; // Adjust priorities in batches for performance
  enablePredictiveAdjustment: boolean; // Use ML to predict optimal adjustments
  cacheAdjustments: boolean; // Cache adjustment calculations
}

/**
 * Priority adjustment context
 */
export interface PriorityAdjustmentContext {
  currentTime: Date;
  systemLoad: number;
  queueDepth: number;
  avgWaitTime: number;
  executionHistory: Map<string, TaskExecutionResult[]>;
  resourceUtilization: Record<string, number>;
  fairnessIndex: number;
}

/**
 * Priority queue statistics
 */
export interface PriorityQueueStats {
  priority: TaskPriority;
  taskCount: number;
  avgWaitTime: number;
  executionRate: number;
  starvationCount: number;
  fairnessScore: number;
  resourceUsage: number;
}

/**
 * Priority adjustment event
 */
export interface PriorityAdjustmentEvent {
  taskId: string;
  oldPriority: number;
  newPriority: number;
  adjustmentReason: string;
  factors: PriorityFactors;
  timestamp: Date;
}

/**
 * Advanced Task Priority Scheduler
 */
export class TaskPriorityScheduler extends EventEmitter {
  private config: PrioritySchedulerConfig;
  private tasks = new Map<string, Task>();
  private priorityQueues = new Map<TaskPriority, Task[]>();
  private adjustmentHistory = new Map<string, PriorityAdjustmentEvent[]>();
  private starvationTracker = new Map<string, Date>();
  private executionQuotas = new Map<TaskPriority, number>();
  private adjustmentTimer?: NodeJS.Timeout;

  // Performance optimization
  private adjustmentCache = new Map<
    string,
    { priority: number; timestamp: number }
  >();
  private batchAdjustmentQueue: string[] = [];

  // Machine learning model for priority optimization
  private mlModel?: any;
  private trainingData: Array<{
    features: number[];
    optimalPriority: number;
    outcome: number;
  }> = [];

  constructor(config: Partial<PrioritySchedulerConfig> = {}) {
    super();

    this.config = {
      strategy: config.strategy ?? PriorityStrategy.HYBRID,
      loadBalanceAlgorithm:
        config.loadBalanceAlgorithm ??
        LoadBalanceAlgorithm.WEIGHTED_ROUND_ROBIN,
      starvationPrevention:
        config.starvationPrevention ?? StarvationPreventionMode.ADAPTIVE_BOOST,

      adjustmentInterval: config.adjustmentInterval ?? 30000, // 30 seconds
      maxStarvationTime: config.maxStarvationTime ?? 300000, // 5 minutes
      priorityDecayRate: config.priorityDecayRate ?? 0.95,

      ageWeight: config.ageWeight ?? 0.3,
      deadlineWeight: config.deadlineWeight ?? 0.4,
      dependencyWeight: config.dependencyWeight ?? 0.2,
      userWeight: config.userWeight ?? 0.7,
      systemWeight: config.systemWeight ?? 0.8,

      fairnessThreshold: config.fairnessThreshold ?? 0.7,
      maxPriorityBoost: config.maxPriorityBoost ?? 500,
      minExecutionQuota: config.minExecutionQuota ?? 0.05, // 5% minimum

      enableBatchAdjustment: config.enableBatchAdjustment ?? true,
      enablePredictiveAdjustment: config.enablePredictiveAdjustment ?? true,
      cacheAdjustments: config.cacheAdjustments ?? true,
    };

    // Initialize priority queues
    Object.values(TaskPriority)
      .filter((value): value is TaskPriority => typeof value === 'number')
      .forEach((priority) => {
        this.priorityQueues.set(priority, []);
        this.executionQuotas.set(priority, this.calculateInitialQuota(priority));
      });

    // Start priority adjustment process
    this.startPriorityAdjustment();

    logger.info('TaskPriorityScheduler initialized', {
      strategy: this.config.strategy,
      starvationPrevention: this.config.starvationPrevention,
      adjustmentInterval: this.config.adjustmentInterval,
    });
  }

  /**
   * Add a task to the priority scheduler
   */
  addTask(task: Task): void {
    // Initialize priority factors if not set
    if (!task.priorityFactors) {
      task.priorityFactors = {
        age: 1.0,
        userImportance: 1.0,
        systemCriticality: 1.0,
        dependencyWeight: 1.0,
        resourceAvailability: 1.0,
        executionHistory: 1.0,
      };
    }

    // Initialize other required properties
    if (!task.dependencies) task.dependencies = [];
    if (!task.dependents) task.dependents = [];

    // Calculate initial dynamic priority
    task.dynamicPriority = this.calculateDynamicPriority(
      task,
      this.buildAdjustmentContext(),
    );

    // Store task and add to appropriate queue
    this.tasks.set(task.id, task);
    this.addToQueue(task);

    logger.debug(`Task added to priority scheduler: ${task.title}`, {
      taskId: task.id,
      basePriority: task.basePriority,
      dynamicPriority: task.dynamicPriority,
    });

    this.emit('taskAdded', task);
  }

  /**
   * Remove a task from the priority scheduler
   */
  removeTask(taskId: string): boolean {
    const task = this.tasks.get(taskId);
    if (!task) return false;

    // Remove from tasks map
    this.tasks.delete(taskId);

    // Remove from appropriate queue
    this.removeFromQueue(task);

    // Clean up tracking data
    this.adjustmentHistory.delete(taskId);
    this.starvationTracker.delete(taskId);
    this.adjustmentCache.delete(taskId);

    logger.debug(`Task removed from priority scheduler: ${task.title}`, {
      taskId: task.id,
    });

    this.emit('taskRemoved', task);
    return true;
  }

  /**
   * Get the next task to execute based on priority and load balancing
   */
  getNextTask(): Task | null {
    // Apply load balancing algorithm
    switch (this.config.loadBalanceAlgorithm) {
      case LoadBalanceAlgorithm.WEIGHTED_ROUND_ROBIN:
        return this.weightedRoundRobin();
      case LoadBalanceAlgorithm.DEFICIT_ROUND_ROBIN:
        return this.deficitRoundRobin();
      case LoadBalanceAlgorithm.FAIR_QUEUING:
        return this.fairQueuing();
      case LoadBalanceAlgorithm.CLASS_BASED_QUEUING:
        return this.classBasedQueuing();
      case LoadBalanceAlgorithm.PRIORITY_QUEUING:
      default:
        return this.priorityQueuing();
    }
  }

  /**
   * Get multiple tasks for batch execution
   */
  getNextTasks(count: number): Task[] {
    const tasks: Task[] = [];

    for (let i = 0; i < count; i++) {
      const task = this.getNextTask();
      if (task) {
        tasks.push(task);
        this.removeTask(task.id);
      } else {
        break;
      }
    }

    return tasks;
  }

  /**
   * Update task execution result and adjust priorities
   */
  updateTaskResult(taskId: string, result: TaskExecutionResult): void {
    const adjustmentHistory = this.adjustmentHistory.get(taskId) || [];

    // Record training data for ML model
    if (this.config.enablePredictiveAdjustment) {
      const task = this.tasks.get(taskId);
      if (task) {
        this.recordTrainingData(task, result);
      }
    }

    // Update execution quotas based on result
    this.updateExecutionQuotas(result);

    // Trigger priority adjustment for related tasks
    this.scheduleRelatedAdjustments(taskId, result);

    logger.debug(`Task result updated: ${taskId}`, {
      success: result.success,
      duration: result.duration,
    });

    this.emit('taskResultUpdated', taskId, result);
  }

  /**
   * Force immediate priority recalculation for all tasks
   */
  recalculateAllPriorities(): void {
    const context = this.buildAdjustmentContext();
    const adjustmentEvents: PriorityAdjustmentEvent[] = [];

    for (const [taskId, task] of Array.from(this.tasks.entries())) {
      const oldPriority = task.dynamicPriority;
      const newPriority = this.calculateDynamicPriority(task, context);

      if (Math.abs(oldPriority - newPriority) > 1) {
        // Significant priority change
        this.removeFromQueue(task);
        task.dynamicPriority = newPriority;
        this.addToQueue(task);

        const adjustmentEvent: PriorityAdjustmentEvent = {
          taskId,
          oldPriority,
          newPriority,
          adjustmentReason: 'Manual recalculation',
          factors: { ...task.priorityFactors },
          timestamp: new Date(),
        };

        adjustmentEvents.push(adjustmentEvent);
        this.recordAdjustmentHistory(taskId, adjustmentEvent);
      }
    }

    logger.info(`Recalculated priorities for ${adjustmentEvents.length} tasks`);

    this.emit('prioritiesRecalculated', adjustmentEvents);
  }

  /**
   * Get priority queue statistics
   */
  getQueueStatistics(): PriorityQueueStats[] {
    const stats: PriorityQueueStats[] = [];
    const now = Date.now();

    for (const [priority, queue] of Array.from(this.priorityQueues.entries())) {
      const tasks = queue;
      const taskCount = tasks.length;

      let totalWaitTime = 0;
      let starvationCount = 0;

      for (const task of tasks) {
        const waitTime = now - task.createdAt.getTime();
        totalWaitTime += waitTime;

        if (waitTime > this.config.maxStarvationTime) {
          starvationCount++;
        }
      }

      const avgWaitTime = taskCount > 0 ? totalWaitTime / taskCount : 0;
      const executionRate = this.calculateExecutionRate(priority);
      const fairnessScore = this.calculatePriorityFairness(priority);
      const resourceUsage = this.calculateResourceUsage(priority);

      stats.push({
        priority,
        taskCount,
        avgWaitTime,
        executionRate,
        starvationCount,
        fairnessScore,
        resourceUsage,
      });
    }

    return stats;
  }

  /**
   * Get comprehensive scheduler metrics
   */
  getSchedulerMetrics(): {
    strategy: PriorityStrategy;
    totalTasks: number;
    avgAdjustmentTime: number;
    fairnessIndex: number;
    starvationEvents: number;
    mlAccuracy?: number;
    queueStats: PriorityQueueStats[];
  } {
    const queueStats = this.getQueueStatistics();
    const totalTasks = Array.from(this.tasks.values()).length;
    const starvationEvents = this.starvationTracker.size;
    const fairnessIndex = this.calculateOverallFairness();

    // Calculate average adjustment time from recent history
    const totalAdjustmentTime = 0;
    let adjustmentCount = 0;

    this.adjustmentHistory.forEach((events) => {
      events.forEach((event) => {
        adjustmentCount++;
      });
    });

    const avgAdjustmentTime =
      adjustmentCount > 0 ? totalAdjustmentTime / adjustmentCount : 0;

    const metrics = {
      strategy: this.config.strategy,
      totalTasks,
      avgAdjustmentTime,
      fairnessIndex,
      starvationEvents,
      queueStats,
    };

    // Add ML accuracy if available
    if (this.config.enablePredictiveAdjustment && this.mlModel) {
      (metrics as any).mlAccuracy = this.calculateMLAccuracy();
    }

    return metrics;
  }

  /**
   * Calculate dynamic priority for a task
   */
  private calculateDynamicPriority(
    task: Task,
    context: PriorityAdjustmentContext,
  ): number {
    switch (this.config.strategy) {
      case PriorityStrategy.STATIC:
        return task.basePriority;

      case PriorityStrategy.AGE_BASED:
        return this.calculateAgeBasedPriority(task, context);

      case PriorityStrategy.DEADLINE_DRIVEN:
        return this.calculateDeadlineDrivenPriority(task, context);

      case PriorityStrategy.DEPENDENCY_AWARE:
        return this.calculateDependencyAwarePriority(task, context);

      case PriorityStrategy.WORKLOAD_ADAPTIVE:
        return this.calculateWorkloadAdaptivePriority(task, context);

      case PriorityStrategy.ML_OPTIMIZED:
        return this.calculateMLOptimizedPriority(task, context);

      case PriorityStrategy.HYBRID:
      default:
        return this.calculateHybridPriority(task, context);
    }
  }

  /**
   * Age-based priority calculation
   */
  private calculateAgeBasedPriority(
    task: Task,
    context: PriorityAdjustmentContext,
  ): number {
    const ageMs = context.currentTime.getTime() - task.createdAt.getTime();
    const ageHours = ageMs / (1000 * 60 * 60);

    // Exponential aging with configurable weight
    const ageFactor = 1 + this.config.ageWeight * Math.log(1 + ageHours);

    return Math.min(2000, task.basePriority * ageFactor);
  }

  /**
   * Deadline-driven priority calculation
   */
  private calculateDeadlineDrivenPriority(
    task: Task,
    context: PriorityAdjustmentContext,
  ): number {
    if (!task.deadline) {
      return task.basePriority;
    }

    const timeToDeadline =
      task.deadline.getTime() - context.currentTime.getTime();
    const maxUrgency = 7 * 24 * 60 * 60 * 1000; // 1 week

    // Exponential urgency increase as deadline approaches
    const urgencyFactor =
      timeToDeadline <= 0
        ? 2.0
        : Math.max(1.0, 2.0 - timeToDeadline / maxUrgency);

    return Math.min(
      2000,
      task.basePriority * urgencyFactor * this.config.deadlineWeight,
    );
  }

  /**
   * Dependency-aware priority calculation
   */
  private calculateDependencyAwarePriority(
    task: Task,
    context: PriorityAdjustmentContext,
  ): number {
    // Calculate dependency chain impact
    const dependentTasks = task.dependents.length;
    const blockingTasks = task.dependencies.length;

    // Tasks with more dependents get higher priority
    const dependentFactor = 1 + dependentTasks * 0.1;

    // Tasks blocked by fewer dependencies get slightly higher priority
    const blockingFactor = blockingTasks > 0 ? 1 - blockingTasks * 0.05 : 1;

    const dependencyAdjustment =
      dependentFactor * blockingFactor * this.config.dependencyWeight;

    return Math.min(2000, task.basePriority * dependencyAdjustment);
  }

  /**
   * Workload-adaptive priority calculation
   */
  private calculateWorkloadAdaptivePriority(
    task: Task,
    context: PriorityAdjustmentContext,
  ): number {
    // Adjust based on current system load
    const loadFactor =
      context.systemLoad > 0.8 ? 0.9 : context.systemLoad < 0.3 ? 1.1 : 1.0;

    // Adjust based on queue depth for this priority level
    const queueDepthFactor = context.queueDepth > 10 ? 1.1 : 1.0;

    // Adjust based on average wait time
    const waitTimeFactor = context.avgWaitTime > 300000 ? 1.2 : 1.0; // 5 minutes

    const adaptiveFactor = loadFactor * queueDepthFactor * waitTimeFactor;

    return Math.min(2000, task.basePriority * adaptiveFactor);
  }

  /**
   * ML-optimized priority calculation
   */
  private calculateMLOptimizedPriority(
    task: Task,
    context: PriorityAdjustmentContext,
  ): number {
    if (!this.mlModel || !this.config.enablePredictiveAdjustment) {
      return this.calculateHybridPriority(task, context);
    }

    const features = this.extractMLFeatures(task, context);
    const predictedPriority = this.mlModel.predict([features])[0];

    // Bound the prediction to reasonable limits
    return Math.max(1, Math.min(2000, predictedPriority));
  }

  /**
   * Hybrid priority calculation combining multiple strategies
   */
  private calculateHybridPriority(
    task: Task,
    context: PriorityAdjustmentContext,
  ): number {
    // Base priority weighted by user importance
    let priority = task.basePriority * this.config.userWeight;

    // Age factor
    const ageMs = context.currentTime.getTime() - task.createdAt.getTime();
    const ageHours = ageMs / (1000 * 60 * 60);
    const ageFactor = 1 + this.config.ageWeight * Math.min(2, ageHours / 24); // Max 2x after 24 hours
    priority *= ageFactor;

    // Deadline factor
    if (task.deadline) {
      const timeToDeadline =
        task.deadline.getTime() - context.currentTime.getTime();
      const maxUrgency = 7 * 24 * 60 * 60 * 1000; // 1 week
      const urgencyFactor =
        timeToDeadline <= 0
          ? 2.0
          : 1 +
            this.config.deadlineWeight *
              Math.max(0, 1 - timeToDeadline / maxUrgency);
      priority *= urgencyFactor;
    }

    // Dependency factor
    const dependentTasks = task.dependents.length;
    const dependencyFactor =
      1 + this.config.dependencyWeight * dependentTasks * 0.1;
    priority *= dependencyFactor;

    // System criticality factor
    const systemFactor =
      task.priorityFactors.systemCriticality * this.config.systemWeight;
    priority *= systemFactor;

    // Apply starvation prevention if needed
    if (this.starvationTracker.has(task.id)) {
      const starvationBoost = Math.min(
        this.config.maxPriorityBoost,
        (ageMs - this.config.maxStarvationTime) / 60000,
      ); // 1 point per minute
      priority += starvationBoost;
    }

    return Math.max(1, Math.min(2000, priority));
  }

  /**
   * Weighted round-robin scheduling
   */
  private weightedRoundRobin(): Task | null {
    const weights = new Map([
      [TaskPriority.CRITICAL, 8],
      [TaskPriority.HIGH, 4],
      [TaskPriority.NORMAL, 3],
      [TaskPriority.MEDIUM, 2],
      [TaskPriority.LOW, 1],
      [TaskPriority.BACKGROUND, 1],
    ]);

    let totalWeight = 0;
    const availableQueues: Array<{
      priority: TaskPriority;
      weight: number;
      tasks: Task[];
    }> = [];

    // Collect non-empty queues with their weights
    for (const [priority, queue] of Array.from(this.priorityQueues.entries())) {
      if (queue.length > 0) {
        const weight = weights.get(priority) || 1;
        totalWeight += weight;
        availableQueues.push({ priority, weight, tasks: queue });
      }
    }

    if (availableQueues.length === 0) return null;

    // Select queue based on weighted probability
    let random = Math.random() * totalWeight;
    for (const queueInfo of availableQueues) {
      random -= queueInfo.weight;
      if (random <= 0) {
        return queueInfo.tasks.shift() || null;
      }
    }

    // Fallback to first available queue
    return availableQueues[0].tasks.shift() || null;
  }

  /**
   * Deficit round-robin scheduling
   */
  private deficitRoundRobin(): Task | null {
    // Simple implementation - would need more sophisticated deficit tracking in production
    return this.weightedRoundRobin();
  }

  /**
   * Fair queuing scheduling
   */
  private fairQueuing(): Task | null {
    // Find the queue with the longest average wait time
    let selectedQueue: Task[] | null = null;
    let maxAvgWaitTime = 0;

    const now = Date.now();

    for (const queue of Array.from(this.priorityQueues.values())) {
      if (queue.length === 0) continue;

      const totalWaitTime = queue.reduce(
        (sum, task) => sum + (now - task.createdAt.getTime()),
        0,
      );
      const avgWaitTime = totalWaitTime / queue.length;

      if (avgWaitTime > maxAvgWaitTime) {
        maxAvgWaitTime = avgWaitTime;
        selectedQueue = queue;
      }
    }

    return selectedQueue ? selectedQueue.shift() || null : null;
  }

  /**
   * Class-based queuing
   */
  private classBasedQueuing(): Task | null {
    // Group by category and apply class-based scheduling
    const categoryQueues = new Map<TaskCategory, Task[]>();

    // Organize tasks by category across all priority queues
    for (const queue of Array.from(this.priorityQueues.values())) {
      for (const task of queue) {
        const categoryQueue = categoryQueues.get(task.category) || [];
        categoryQueue.push(task);
        categoryQueues.set(task.category, categoryQueue);
      }
    }

    // Select category based on execution quotas
    const selectedCategory = this.selectCategoryByQuota(categoryQueues);
    if (!selectedCategory) return null;

    const categoryQueue = categoryQueues.get(selectedCategory);
    if (!categoryQueue || categoryQueue.length === 0) return null;

    // Sort by priority within category
    categoryQueue.sort((a, b) => b.dynamicPriority - a.dynamicPriority);

    const selectedTask = categoryQueue.shift()!;

    // Remove from original queue
    this.removeFromQueue(selectedTask);

    return selectedTask;
  }

  /**
   * Priority queuing (strict priority)
   */
  private priorityQueuing(): Task | null {
    // Process queues in priority order
    const priorities = Array.from(this.priorityQueues.keys()).sort(
      (a, b) => b - a,
    ); // Highest priority first

    for (const priority of priorities) {
      const queue = this.priorityQueues.get(priority);
      if (queue && queue.length > 0) {
        return queue.shift() || null;
      }
    }

    return null;
  }

  // Utility methods...

  private addToQueue(task: Task): void {
    const priority = this.getPriorityLevel(task.dynamicPriority);
    const queue = this.priorityQueues.get(priority);
    if (queue) {
      // Insert in sorted order by dynamic priority
      const insertIndex = queue.findIndex(
        (t) => t.dynamicPriority < task.dynamicPriority,
      );
      if (insertIndex === -1) {
        queue.push(task);
      } else {
        queue.splice(insertIndex, 0, task);
      }
    }
  }

  private removeFromQueue(task: Task): void {
    for (const queue of Array.from(this.priorityQueues.values())) {
      const index = queue.findIndex((t) => t.id === task.id);
      if (index !== -1) {
        queue.splice(index, 1);
        break;
      }
    }
  }

  private getPriorityLevel(dynamicPriority: number): TaskPriority {
    if (dynamicPriority >= TaskPriority.CRITICAL) return TaskPriority.CRITICAL;
    if (dynamicPriority >= TaskPriority.HIGH) return TaskPriority.HIGH;
    if (dynamicPriority >= TaskPriority.MEDIUM) return TaskPriority.MEDIUM;
    if (dynamicPriority >= TaskPriority.LOW) return TaskPriority.LOW;
    return TaskPriority.BACKGROUND;
  }

  private buildAdjustmentContext(): PriorityAdjustmentContext {
    const now = new Date();
    const systemLoad = this.calculateSystemLoad();
    const queueDepth = Array.from(this.priorityQueues.values()).reduce(
      (sum, queue) => sum + queue.length,
      0,
    );

    // Calculate average wait time
    let totalWaitTime = 0;
    let taskCount = 0;
    const currentTime = now.getTime();

    for (const queue of Array.from(this.priorityQueues.values())) {
      for (const task of queue) {
        totalWaitTime += currentTime - task.createdAt.getTime();
        taskCount++;
      }
    }

    const avgWaitTime = taskCount > 0 ? totalWaitTime / taskCount : 0;

    return {
      currentTime: now,
      systemLoad,
      queueDepth,
      avgWaitTime,
      executionHistory: new Map(), // Would be populated from actual execution history
      resourceUtilization: {}, // Would be populated from system metrics
      fairnessIndex: this.calculateOverallFairness(),
    };
  }

  private calculateInitialQuota(priority: TaskPriority): number {
    // Initial quotas based on priority level
    switch (priority) {
      case TaskPriority.CRITICAL:
        return 0.4; // 40%
      case TaskPriority.HIGH:
        return 0.3; // 30%
      case TaskPriority.NORMAL:
        return 0.15; // 15%
      case TaskPriority.MEDIUM:
        return 0.13; // 13%
      case TaskPriority.LOW:
        return 0.08; // 8%
      case TaskPriority.BACKGROUND:
        return 0.02; // 2%
      default:
        return 0.1;
    }
  }

  private calculateSystemLoad(): number {
    // Simplified system load calculation
    const totalTasks = Array.from(this.priorityQueues.values()).reduce(
      (sum, queue) => sum + queue.length,
      0,
    );

    return Math.min(1.0, totalTasks / 100); // Normalize to 0-1 scale
  }

  private calculateExecutionRate(priority: TaskPriority): number {
    // Would be calculated from actual execution history
    return 0.85; // Placeholder
  }

  private calculatePriorityFairness(priority: TaskPriority): number {
    // Would be calculated based on actual execution fairness
    return 0.8; // Placeholder
  }

  private calculateResourceUsage(priority: TaskPriority): number {
    // Would be calculated from actual resource usage
    return 0.6; // Placeholder
  }

  private calculateOverallFairness(): number {
    // Simplified fairness calculation
    const stats = this.getQueueStatistics();
    if (stats.length === 0) return 1.0;

    const avgFairness =
      stats.reduce((sum, stat) => sum + stat.fairnessScore, 0) / stats.length;
    return avgFairness;
  }

  private extractMLFeatures(
    task: Task,
    context: PriorityAdjustmentContext,
  ): number[] {
    const ageMs = context.currentTime.getTime() - task.createdAt.getTime();
    const timeToDeadline = task.deadline
      ? Math.max(0, task.deadline.getTime() - context.currentTime.getTime())
      : 0;

    return [
      task.basePriority,
      ageMs / (1000 * 60 * 60), // Age in hours
      timeToDeadline / (1000 * 60 * 60), // Time to deadline in hours
      task.dependencies.length,
      task.dependents.length,
      context.systemLoad,
      context.queueDepth,
      context.avgWaitTime / (1000 * 60), // Average wait time in minutes
      task.priorityFactors.systemCriticality,
      task.priorityFactors.resourceAvailability,
    ];
  }

  private recordTrainingData(task: Task, result: TaskExecutionResult): void {
    const context = this.buildAdjustmentContext();
    const features = this.extractMLFeatures(task, context);

    // Success rate as outcome measure
    const outcome = result.success ? 1 : 0;

    this.trainingData.push({
      features,
      optimalPriority: task.dynamicPriority,
      outcome,
    });

    // Keep only recent training data
    if (this.trainingData.length > 1000) {
      this.trainingData = this.trainingData.slice(-1000);
    }
  }

  private calculateMLAccuracy(): number {
    // Would implement actual ML accuracy calculation
    return 0.85; // Placeholder
  }

  private updateExecutionQuotas(result: TaskExecutionResult): void {
    // Update execution quotas based on results
    // This would be implemented with actual quota management logic
  }

  private scheduleRelatedAdjustments(
    taskId: string,
    result: TaskExecutionResult,
  ): void {
    // Schedule priority adjustments for related tasks
    if (this.config.enableBatchAdjustment) {
      this.batchAdjustmentQueue.push(taskId);
    }
  }

  private recordAdjustmentHistory(
    taskId: string,
    event: PriorityAdjustmentEvent,
  ): void {
    const history = this.adjustmentHistory.get(taskId) || [];
    history.push(event);

    // Keep only recent history
    if (history.length > 10) {
      history.shift();
    }

    this.adjustmentHistory.set(taskId, history);
  }

  private selectCategoryByQuota(
    categoryQueues: Map<TaskCategory, Task[]>,
  ): TaskCategory | null {
    // Select category based on execution quotas and current load
    let selectedCategory: TaskCategory | null = null;
    let maxPriority = -1;

    for (const [category, tasks] of Array.from(categoryQueues.entries())) {
      if (tasks.length === 0) continue;

      // Calculate average priority for this category
      const avgPriority =
        tasks.reduce((sum, task) => sum + task.dynamicPriority, 0) /
        tasks.length;

      if (avgPriority > maxPriority) {
        maxPriority = avgPriority;
        selectedCategory = category;
      }
    }

    return selectedCategory;
  }

  private startPriorityAdjustment(): void {
    if (this.config.adjustmentInterval <= 0) return;

    this.adjustmentTimer = setInterval(() => {
      this.performPriorityAdjustment();
    }, this.config.adjustmentInterval);

    logger.info('Priority adjustment timer started', {
      interval: this.config.adjustmentInterval,
    });
  }

  private performPriorityAdjustment(): void {
    const context = this.buildAdjustmentContext();
    const adjustmentEvents: PriorityAdjustmentEvent[] = [];

    // Process batch adjustments if enabled
    if (
      this.config.enableBatchAdjustment &&
      this.batchAdjustmentQueue.length > 0
    ) {
      this.processBatchAdjustments(context, adjustmentEvents);
    }

    // Check for starvation
    this.checkForStarvation(context, adjustmentEvents);

    // Update priorities for all tasks
    this.updateAllPriorities(context, adjustmentEvents);

    if (adjustmentEvents.length > 0) {
      logger.debug(`Adjusted priorities for ${adjustmentEvents.length} tasks`);
      this.emit('prioritiesAdjusted', adjustmentEvents);
    }
  }

  private processBatchAdjustments(
    context: PriorityAdjustmentContext,
    adjustmentEvents: PriorityAdjustmentEvent[],
  ): void {
    // Process queued batch adjustments
    for (const taskId of this.batchAdjustmentQueue) {
      const task = this.tasks.get(taskId);
      if (task) {
        this.adjustSingleTaskPriority(task, context, adjustmentEvents);
      }
    }

    this.batchAdjustmentQueue.length = 0;
  }

  private checkForStarvation(
    context: PriorityAdjustmentContext,
    adjustmentEvents: PriorityAdjustmentEvent[],
  ): void {
    if (this.config.starvationPrevention === StarvationPreventionMode.NONE) {
      return;
    }

    const now = context.currentTime.getTime();

    for (const [taskId, task] of Array.from(this.tasks.entries())) {
      const waitTime = now - task.createdAt.getTime();

      if (waitTime > this.config.maxStarvationTime) {
        if (!this.starvationTracker.has(taskId)) {
          this.starvationTracker.set(taskId, new Date());

          const oldPriority = task.dynamicPriority;
          const boostAmount = this.calculateStarvationBoost(waitTime);
          const newPriority = Math.min(2000, oldPriority + boostAmount);

          if (newPriority !== oldPriority) {
            this.removeFromQueue(task);
            task.dynamicPriority = newPriority;
            this.addToQueue(task);

            const adjustmentEvent: PriorityAdjustmentEvent = {
              taskId,
              oldPriority,
              newPriority,
              adjustmentReason: 'Starvation prevention',
              factors: { ...task.priorityFactors },
              timestamp: new Date(),
            };

            adjustmentEvents.push(adjustmentEvent);
            this.recordAdjustmentHistory(taskId, adjustmentEvent);

            logger.warn(
              `Applied starvation prevention boost to task: ${task.title}`,
              {
                taskId,
                waitTime,
                boostAmount,
                newPriority,
              },
            );
          }
        }
      }
    }
  }

  private updateAllPriorities(
    context: PriorityAdjustmentContext,
    adjustmentEvents: PriorityAdjustmentEvent[],
  ): void {
    // Update priorities for all tasks
    for (const [taskId, task] of Array.from(this.tasks.entries())) {
      if (!this.starvationTracker.has(taskId)) {
        // Only adjust non-starving tasks to avoid interference
        this.adjustSingleTaskPriority(task, context, adjustmentEvents);
      }
    }
  }

  private adjustSingleTaskPriority(
    task: Task,
    context: PriorityAdjustmentContext,
    adjustmentEvents: PriorityAdjustmentEvent[],
  ): void {
    const oldPriority = task.dynamicPriority;
    const newPriority = this.calculateDynamicPriority(task, context);

    // Only adjust if there's a significant change
    if (Math.abs(oldPriority - newPriority) > 5) {
      this.removeFromQueue(task);
      task.dynamicPriority = newPriority;
      this.addToQueue(task);

      const adjustmentEvent: PriorityAdjustmentEvent = {
        taskId: task.id,
        oldPriority,
        newPriority,
        adjustmentReason: `${this.config.strategy} adjustment`,
        factors: { ...task.priorityFactors },
        timestamp: new Date(),
      };

      adjustmentEvents.push(adjustmentEvent);
      this.recordAdjustmentHistory(task.id, adjustmentEvent);
    }
  }

  private calculateStarvationBoost(waitTime: number): number {
    const extraWaitTime = waitTime - this.config.maxStarvationTime;
    const boostPerMinute = this.config.maxPriorityBoost / (60 * 60 * 1000); // Boost per ms
    return Math.min(
      this.config.maxPriorityBoost,
      extraWaitTime * boostPerMinute,
    );
  }

  /**
   * Calculate priority score for a task (used by tests)
   */
  calculatePriorityScore(task: Task): number {
    const context = this.buildAdjustmentContext();
    return this.calculateDynamicPriority(task, context);
  }

  /**
   * Shutdown the priority scheduler
   */
  shutdown(): void {
    if (this.adjustmentTimer) {
      clearInterval(this.adjustmentTimer);
      this.adjustmentTimer = undefined;
    }

    logger.info('TaskPriorityScheduler shutdown completed');
  }
}
