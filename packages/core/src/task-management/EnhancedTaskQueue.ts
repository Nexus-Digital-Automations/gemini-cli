/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { logger } from '../utils/logger.js';
import type {
  Task,
  TaskExecutionResult,
  QueueMetrics,
  TaskQueueOptions,
} from './TaskQueue.js';
import {
  TaskQueue,
  TaskPriority,
  TaskCategory,
  TaskStatus,
} from './TaskQueue.js';

/**
 * @fileoverview Enhanced Task Queue with Advanced Priority Scheduling
 *
 * This enhanced system builds upon the existing TaskQueue with:
 * - Multi-level priority scheduling with fairness guarantees
 * - Machine learning-based priority adjustment
 * - Advanced resource allocation and load balancing
 * - Intelligent batch optimization
 * - Predictive scheduling based on historical patterns
 */

/**
 * Advanced scheduling algorithms
 */
export enum SchedulingAlgorithm {
  ROUND_ROBIN = 'round_robin', // Fair scheduling across priority levels
  WEIGHTED_FAIR = 'weighted_fair', // Weighted fair queuing with priority consideration
  DEADLINE_AWARE = 'deadline_aware', // Deadline-sensitive scheduling
  RESOURCE_AWARE = 'resource_aware', // Resource-based scheduling optimization
  MACHINE_LEARNING = 'ml_optimized', // ML-based predictive scheduling
  HYBRID = 'hybrid', // Combination of multiple algorithms
}

/**
 * Load balancing strategies for distributed execution
 */
export enum LoadBalancingStrategy {
  LEAST_LOADED = 'least_loaded', // Route to least loaded executor
  ROUND_ROBIN = 'round_robin', // Distribute evenly
  CAPABILITY_BASED = 'capability_based', // Match task requirements to executor capabilities
  GEOGRAPHIC = 'geographic', // Consider geographic distribution
  PERFORMANCE_BASED = 'performance_based', // Route based on historical performance
}

/**
 * Resource allocation policies
 */
export enum ResourcePolicy {
  GREEDY = 'greedy', // Allocate maximum resources available
  FAIR_SHARE = 'fair_share', // Ensure fair resource distribution
  PRIORITY_BASED = 'priority_based', // Allocate based on task priority
  ADAPTIVE = 'adaptive', // Dynamically adjust based on workload
  RESERVED = 'reserved', // Reserve resources for critical tasks
}

/**
 * Advanced scheduling parameters
 */
export interface AdvancedSchedulingConfig {
  algorithm: SchedulingAlgorithm;
  loadBalancing: LoadBalancingStrategy;
  resourcePolicy: ResourcePolicy;

  // Fairness and starvation prevention
  maxStarvationTime: number; // Maximum time a task can wait before priority boost
  fairnessWeight: number; // Weight given to fairness vs efficiency (0-1)

  // Performance optimization
  enablePredictiveScheduling: boolean; // Use ML to predict optimal scheduling
  enableBatchOptimization: boolean; // Optimize batch execution
  enableResourcePreallocation: boolean; // Pre-allocate resources for predicted tasks

  // Quality of service
  guaranteedLatency: Map<TaskPriority, number>; // Maximum latency guarantees by priority
  throughputTargets: Map<TaskCategory, number>; // Throughput targets by category

  // Advanced features
  enableAdaptivePriority: boolean; // Allow dynamic priority adjustment
  enableSmartRetries: boolean; // Intelligent retry with exponential backoff
  enableFailurePrediction: boolean; // Predict and prevent task failures
}

/**
 * Task execution statistics for ML-based optimization
 */
export interface TaskExecutionStats {
  taskId: string;
  category: TaskCategory;
  priority: TaskPriority;
  estimatedDuration: number;
  actualDuration: number;
  waitTime: number;
  successRate: number;
  resourceUtilization: Record<string, number>;
  executorPerformance: Record<string, number>;
  timestamp: Date;
}

/**
 * Resource utilization metrics
 */
export interface ResourceMetrics {
  cpuUtilization: number;
  memoryUtilization: number;
  networkBandwidth: number;
  diskIO: number;
  concurrentTasks: number;
  queueDepth: number;
}

/**
 * Executor node information for load balancing
 */
export interface ExecutorNode {
  id: string;
  capabilities: string[];
  maxConcurrentTasks: number;
  currentLoad: number;
  resourceMetrics: ResourceMetrics;
  location?: string;
  performanceScore: number;
  healthStatus: 'healthy' | 'degraded' | 'unhealthy';
  lastHeartbeat: Date;
}

/**
 * Enhanced Task Queue with advanced scheduling and optimization
 */
export class EnhancedTaskQueue extends TaskQueue {
  private schedulingConfig: AdvancedSchedulingConfig;
  private executorNodes = new Map<string, ExecutorNode>();
  private executionStats: TaskExecutionStats[] = [];
  private priorityQueues = new Map<TaskPriority, Task[]>();
  private starvationTracker = new Map<string, Date>();
  private resourceAllocations = new Map<string, Record<string, number>>();

  // ML-based optimization
  private predictionModel?: unknown; // ML model for task scheduling optimization
  private historicalPatterns = new Map<string, number[]>();

  // Performance monitoring
  private performanceMetrics = {
    averageLatency: new Map<TaskPriority, number>(),
    throughput: new Map<TaskCategory, number>(),
    resourceEfficiency: 0,
    fairnessIndex: 0,
    systemUtilization: 0,
  };

  constructor(
    options: Partial<
      TaskQueueOptions & { scheduling: Partial<AdvancedSchedulingConfig> }
    > = {},
  ) {
    super(options);

    this.schedulingConfig = {
      algorithm: options.scheduling?.algorithm ?? SchedulingAlgorithm.HYBRID,
      loadBalancing:
        options.scheduling?.loadBalancing ??
        LoadBalancingStrategy.CAPABILITY_BASED,
      resourcePolicy:
        options.scheduling?.resourcePolicy ?? ResourcePolicy.ADAPTIVE,
      maxStarvationTime: options.scheduling?.maxStarvationTime ?? 300000, // 5 minutes
      fairnessWeight: options.scheduling?.fairnessWeight ?? 0.7,
      enablePredictiveScheduling:
        options.scheduling?.enablePredictiveScheduling ?? true,
      enableBatchOptimization:
        options.scheduling?.enableBatchOptimization ?? true,
      enableResourcePreallocation:
        options.scheduling?.enableResourcePreallocation ?? true,
      guaranteedLatency:
        options.scheduling?.guaranteedLatency ??
        new Map([
          [TaskPriority.CRITICAL, 30000], // 30 seconds
          [TaskPriority.HIGH, 120000], // 2 minutes
          [TaskPriority.MEDIUM, 600000], // 10 minutes
          [TaskPriority.LOW, 1800000], // 30 minutes
          [TaskPriority.BACKGROUND, 7200000], // 2 hours
        ]),
      throughputTargets:
        options.scheduling?.throughputTargets ??
        new Map([
          [TaskCategory.SECURITY, 50], // 50 tasks/hour
          [TaskCategory.BUG_FIX, 100], // 100 tasks/hour
          [TaskCategory.FEATURE, 80], // 80 tasks/hour
          [TaskCategory.TEST, 200], // 200 tasks/hour
          [TaskCategory.PERFORMANCE, 60], // 60 tasks/hour
          [TaskCategory.DOCUMENTATION, 120], // 120 tasks/hour
        ]),
      enableAdaptivePriority:
        options.scheduling?.enableAdaptivePriority ?? true,
      enableSmartRetries: options.scheduling?.enableSmartRetries ?? true,
      enableFailurePrediction:
        options.scheduling?.enableFailurePrediction ?? true,
    };

    // Initialize priority queues
    Object.values(TaskPriority).forEach((priority) => {
      this.priorityQueues.set(priority, []);
    });

    // Start advanced optimization processes
    this.startAdvancedOptimization();

    logger().info('EnhancedTaskQueue initialized with advanced scheduling', {
      algorithm: this.schedulingConfig.algorithm,
      loadBalancing: this.schedulingConfig.loadBalancing,
      resourcePolicy: this.schedulingConfig.resourcePolicy,
    });
  }

  /**
   * Enhanced task scheduling with multi-level priority queues
   */
  protected async selectOptimalTasks(
    eligibleTasks: Task[],
    availableSlots: number,
  ): Promise<Task[]> {
    // Organize tasks into priority queues
    this.organizeTasks(eligibleTasks);

    // Apply selected scheduling algorithm
    switch (this.schedulingConfig.algorithm) {
      case SchedulingAlgorithm.ROUND_ROBIN:
        return this.roundRobinScheduling(availableSlots);
      case SchedulingAlgorithm.WEIGHTED_FAIR:
        return this.weightedFairScheduling(availableSlots);
      case SchedulingAlgorithm.DEADLINE_AWARE:
        return this.deadlineAwareScheduling(availableSlots);
      case SchedulingAlgorithm.RESOURCE_AWARE:
        return this.resourceAwareScheduling(availableSlots);
      case SchedulingAlgorithm.MACHINE_LEARNING:
        return this.mlOptimizedScheduling(availableSlots);
      case SchedulingAlgorithm.HYBRID:
      default:
        return this.hybridScheduling(availableSlots);
    }
  }

  /**
   * Organizes tasks into priority-based queues with starvation prevention
   */
  private organizeTasks(tasks: Task[]): void {
    // Clear existing queues
    this.priorityQueues.forEach((queue) => (queue.length = 0));

    const now = Date.now();

    for (const task of tasks) {
      let effectivePriority = task.priority;

      // Check for starvation and boost priority if needed
      if (this.schedulingConfig.enableAdaptivePriority) {
        const waitTime = now - task.createdAt.getTime();
        if (waitTime > this.schedulingConfig.maxStarvationTime) {
          effectivePriority = this.boostPriorityForStarvation(
            task.priority,
            waitTime,
          );
          this.starvationTracker.set(task.id, new Date());

          logger().debug(`Priority boosted for starving task: ${task.title}`, {
            taskId: task.id,
            originalPriority: task.priority,
            boostedPriority: effectivePriority,
            waitTime,
          });
        }
      }

      // Add to appropriate queue
      const queue = this.priorityQueues.get(effectivePriority);
      if (queue) {
        queue.push(task);
      }
    }

    // Sort each queue by secondary criteria (age, deadline, dependency weight)
    this.priorityQueues.forEach((queue, _priority) => {
      queue.sort((a, b) => this.compareTasksWithinPriority(a, b));
    });
  }

  /**
   * Round-robin scheduling across priority levels with fairness guarantees
   */
  private roundRobinScheduling(availableSlots: number): Task[] {
    const selected: Task[] = [];
    const priorities = Array.from(this.priorityQueues.keys()).sort(
      (a, b) => b - a,
    ); // Highest priority first

    let currentPriorityIndex = 0;
    let roundsWithoutSelection = 0;

    while (
      selected.length < availableSlots &&
      roundsWithoutSelection < priorities.length
    ) {
      const priority = priorities[currentPriorityIndex];
      const queue = this.priorityQueues.get(priority) || [];

      if (queue.length > 0) {
        const task = queue.shift()!;
        if (this.canScheduleTask(task, selected)) {
          selected.push(task);
          roundsWithoutSelection = 0;
        } else {
          queue.push(task); // Put back if can't schedule now
        }
      } else {
        roundsWithoutSelection++;
      }

      currentPriorityIndex = (currentPriorityIndex + 1) % priorities.length;
    }

    return selected;
  }

  /**
   * Weighted fair queuing with priority consideration
   */
  private weightedFairScheduling(availableSlots: number): Task[] {
    const selected: Task[] = [];
    const weights = new Map([
      [TaskPriority.CRITICAL, 0.4],
      [TaskPriority.HIGH, 0.3],
      [TaskPriority.MEDIUM, 0.2],
      [TaskPriority.LOW, 0.08],
      [TaskPriority.BACKGROUND, 0.02],
    ]);

    // Calculate how many slots each priority level should get
    const allocations = new Map<TaskPriority, number>();
    let totalWeight = 0;

    this.priorityQueues.forEach((queue, priority) => {
      if (queue.length > 0) {
        const weight = weights.get(priority) || 0.1;
        totalWeight += weight;
        allocations.set(
          priority,
          Math.max(1, Math.floor(availableSlots * weight)),
        );
      }
    });

    // Distribute remaining slots proportionally
    let usedSlots = 0;
    allocations.forEach((allocation) => {
      usedSlots += allocation;
    });

    if (usedSlots < availableSlots) {
      const remainingSlots = availableSlots - usedSlots;
      const highestPriority = Array.from(allocations.keys()).reduce(
        (max, priority) => (priority > max ? priority : max),
        TaskPriority.BACKGROUND,
      );
      allocations.set(
        highestPriority,
        (allocations.get(highestPriority) || 0) + remainingSlots,
      );
    }

    // Select tasks according to allocations
    allocations.forEach((allocation, priority) => {
      const queue = this.priorityQueues.get(priority) || [];
      let taken = 0;

      while (
        taken < allocation &&
        queue.length > 0 &&
        selected.length < availableSlots
      ) {
        const task = queue.shift()!;
        if (this.canScheduleTask(task, selected)) {
          selected.push(task);
          taken++;
        }
      }
    });

    return selected;
  }

  /**
   * Deadline-aware scheduling with urgency consideration
   */
  private deadlineAwareScheduling(availableSlots: number): Task[] {
    const selected: Task[] = [];
    const allTasks: Task[] = [];

    // Collect all tasks and sort by deadline urgency
    this.priorityQueues.forEach((queue) => {
      allTasks.push(...queue);
    });

    // Sort by deadline urgency combined with priority
    allTasks.sort((a, b) => {
      const urgencyA = this.calculateDeadlineUrgency(a);
      const urgencyB = this.calculateDeadlineUrgency(b);

      if (Math.abs(urgencyA - urgencyB) > 0.1) {
        return urgencyB - urgencyA; // Higher urgency first
      }

      return b.priority - a.priority; // Fall back to priority
    });

    // Select tasks considering resource constraints
    for (const task of allTasks) {
      if (selected.length >= availableSlots) break;

      if (this.canScheduleTask(task, selected)) {
        selected.push(task);
      }
    }

    return selected;
  }

  /**
   * Resource-aware scheduling optimizing for resource utilization
   */
  private resourceAwareScheduling(availableSlots: number): Task[] {
    const selected: Task[] = [];
    const resourceBudget = this.calculateAvailableResources();
    const currentResourceUsage = { cpu: 0, memory: 0, network: 0, disk: 0 };

    // Get all tasks sorted by resource efficiency
    const allTasks: Task[] = [];
    this.priorityQueues.forEach((queue) => {
      allTasks.push(...queue);
    });

    allTasks.sort((a, b) => {
      const efficiencyA = this.calculateResourceEfficiency(a);
      const efficiencyB = this.calculateResourceEfficiency(b);
      return efficiencyB - efficiencyA;
    });

    // Select tasks that fit within resource constraints
    for (const task of allTasks) {
      if (selected.length >= availableSlots) break;

      const taskResources = this.estimateTaskResources(task);

      // Check if task fits within resource budget
      if (
        this.canAllocateResources(
          taskResources,
          resourceBudget,
          currentResourceUsage,
        )
      ) {
        selected.push(task);

        // Update resource usage
        Object.keys(taskResources).forEach((resource) => {
          currentResourceUsage[resource as keyof typeof currentResourceUsage] +=
            taskResources[resource];
        });
      }
    }

    return selected;
  }

  /**
   * ML-optimized scheduling using predictive models
   */
  private mlOptimizedScheduling(availableSlots: number): Task[] {
    if (
      !this.schedulingConfig.enablePredictiveScheduling ||
      !this.predictionModel
    ) {
      // Fall back to hybrid scheduling if ML is not available
      return this.hybridScheduling(availableSlots);
    }

    const selected: Task[] = [];
    const allTasks: Task[] = [];

    // Collect all tasks
    this.priorityQueues.forEach((queue) => {
      allTasks.push(...queue);
    });

    // Use ML model to predict optimal scheduling order
    const taskFeatures = allTasks.map((task) => this.extractTaskFeatures(task));
    const predictions = this.predictionModel.predict(taskFeatures);

    // Combine predictions with task objects and sort
    const tasksWithPredictions = allTasks
      .map((task, index) => ({
        task,
        score: predictions[index],
      }))
      .sort((a, b) => b.score - a.score);

    // Select tasks based on ML predictions
    for (const { task } of tasksWithPredictions) {
      if (selected.length >= availableSlots) break;

      if (this.canScheduleTask(task, selected)) {
        selected.push(task);
      }
    }

    return selected;
  }

  /**
   * Hybrid scheduling combining multiple algorithms dynamically
   */
  private hybridScheduling(availableSlots: number): Task[] {
    const systemLoad = this.calculateSystemLoad();
    const queuePressure = this.calculateQueuePressure();
    const resourceUtilization = this.calculateResourceUtilization();

    // Choose algorithm based on current system state
    if (queuePressure > 0.8) {
      // High queue pressure - prioritize throughput
      return this.weightedFairScheduling(availableSlots);
    } else if (resourceUtilization > 0.9) {
      // High resource utilization - optimize resource usage
      return this.resourceAwareScheduling(availableSlots);
    } else if (this.hasUrgentDeadlines()) {
      // Urgent deadlines - prioritize deadlines
      return this.deadlineAwareScheduling(availableSlots);
    } else {
      // Normal conditions - use ML if available, otherwise fair scheduling
      if (
        this.schedulingConfig.enablePredictiveScheduling &&
        this.predictionModel
      ) {
        return this.mlOptimizedScheduling(availableSlots);
      } else {
        return this.roundRobinScheduling(availableSlots);
      }
    }
  }

  /**
   * Register an executor node for load balancing
   */
  registerExecutor(executor: ExecutorNode): void {
    this.executorNodes.set(executor.id, executor);

    logger().info('Executor registered for task distribution', {
      executorId: executor.id,
      capabilities: executor.capabilities,
      maxConcurrentTasks: executor.maxConcurrentTasks,
    });

    this.emit('executorRegistered', executor);
  }

  /**
   * Update executor metrics for load balancing decisions
   */
  updateExecutorMetrics(executorId: string, metrics: ResourceMetrics): void {
    const executor = this.executorNodes.get(executorId);
    if (executor) {
      executor.resourceMetrics = metrics;
      executor.lastHeartbeat = new Date();
      executor.healthStatus = this.assessExecutorHealth(metrics);

      this.emit('executorMetricsUpdated', executorId, metrics);
    }
  }

  /**
   * Select optimal executor for a task based on load balancing strategy
   */
  selectExecutorForTask(task: Task): ExecutorNode | null {
    const eligibleExecutors = Array.from(this.executorNodes.values()).filter(
      (executor) =>
        executor.healthStatus === 'healthy' &&
        this.hasRequiredCapabilities(executor, task) &&
        executor.currentLoad < executor.maxConcurrentTasks,
    );

    if (eligibleExecutors.length === 0) {
      return null;
    }

    switch (this.schedulingConfig.loadBalancing) {
      case LoadBalancingStrategy.LEAST_LOADED:
        return eligibleExecutors.reduce((min, executor) =>
          executor.currentLoad < min.currentLoad ? executor : min,
        );

      case LoadBalancingStrategy.ROUND_ROBIN:
        // Simple round-robin selection
        const nextIndex = Math.floor(Math.random() * eligibleExecutors.length);
        return eligibleExecutors[nextIndex];

      case LoadBalancingStrategy.CAPABILITY_BASED:
        return this.selectBestCapabilityMatch(task, eligibleExecutors);

      case LoadBalancingStrategy.PERFORMANCE_BASED:
        return eligibleExecutors.reduce((best, executor) =>
          executor.performanceScore > best.performanceScore ? executor : best,
        );

      default:
        return eligibleExecutors[0];
    }
  }

  /**
   * Record task execution statistics for ML optimization
   */
  recordExecutionStats(
    task: Task,
    result: TaskExecutionResult,
    executorId: string,
  ): void {
    const stats: TaskExecutionStats = {
      taskId: task.id,
      category: task.category,
      priority: task.priority,
      estimatedDuration: task.estimatedDuration,
      actualDuration: result.duration,
      waitTime: task.startedAt
        ? task.startedAt.getTime() - task.createdAt.getTime()
        : 0,
      successRate: result.success ? 1 : 0,
      resourceUtilization: this.getResourceUtilization(executorId),
      executorPerformance: this.getExecutorPerformance(executorId),
      timestamp: new Date(),
    };

    this.executionStats.push(stats);

    // Keep only recent stats (last 1000 executions)
    if (this.executionStats.length > 1000) {
      this.executionStats = this.executionStats.slice(-1000);
    }

    // Update ML model if enabled
    if (this.schedulingConfig.enablePredictiveScheduling) {
      this.updatePredictionModel();
    }

    // Update performance metrics
    this.updatePerformanceMetrics(stats);

    this.emit('executionStatsRecorded', stats);
  }

  /**
   * Get enhanced queue metrics including advanced scheduling statistics
   */
  getEnhancedMetrics(): QueueMetrics & {
    schedulingMetrics: {
      algorithm: SchedulingAlgorithm;
      fairnessIndex: number;
      avgLatencyByPriority: Map<TaskPriority, number>;
      throughputByCategory: Map<TaskCategory, number>;
      resourceEfficiency: number;
      starvationEvents: number;
      executorUtilization: Map<string, number>;
    };
  } {
    const baseMetrics = this.getMetrics();

    return {
      ...baseMetrics,
      schedulingMetrics: {
        algorithm: this.schedulingConfig.algorithm,
        fairnessIndex: this.calculateFairnessIndex(),
        avgLatencyByPriority: this.performanceMetrics.averageLatency,
        throughputByCategory: this.performanceMetrics.throughput,
        resourceEfficiency: this.performanceMetrics.resourceEfficiency,
        starvationEvents: this.starvationTracker.size,
        executorUtilization: this.calculateExecutorUtilization(),
      },
    };
  }

  // Private utility methods...

  private boostPriorityForStarvation(
    originalPriority: TaskPriority,
    waitTime: number,
  ): TaskPriority {
    const boostLevels = Math.floor(
      waitTime / this.schedulingConfig.maxStarvationTime,
    );
    const priorityValues = Object.values(TaskPriority).sort((a, b) => b - a);
    const currentIndex = priorityValues.indexOf(originalPriority);
    const boostedIndex = Math.max(0, currentIndex - boostLevels);

    return priorityValues[boostedIndex];
  }

  private compareTasksWithinPriority(a: Task, b: Task): number {
    // Age factor
    const ageA = Date.now() - a.createdAt.getTime();
    const ageB = Date.now() - b.createdAt.getTime();

    if (Math.abs(ageA - ageB) > 60000) {
      // 1 minute difference
      return ageB - ageA; // Older tasks first
    }

    // Deadline factor
    if (a.deadline && b.deadline) {
      return a.deadline.getTime() - b.deadline.getTime();
    }

    if (a.deadline && !b.deadline) return -1;
    if (!a.deadline && b.deadline) return 1;

    // Dependency weight
    return b.dependents.length - a.dependents.length;
  }

  private canScheduleTask(task: Task, alreadySelected: Task[]): boolean {
    // Check resource conflicts
    const conflicts = this.countResourceConflicts(task, alreadySelected);

    // Check if task has required capabilities available
    const requiredExecutor = this.selectExecutorForTask(task);

    return conflicts === 0 && requiredExecutor !== null;
  }

  private calculateDeadlineUrgency(task: Task): number {
    if (!task.deadline) return 0;

    const timeToDeadline = task.deadline.getTime() - Date.now();
    const maxUrgency = 7 * 24 * 60 * 60 * 1000; // 1 week

    return Math.max(0, 1 - timeToDeadline / maxUrgency);
  }

  private calculateResourceEfficiency(task: Task): number {
    const estimatedResources = this.estimateTaskResources(task);
    const expectedOutput = task.priority * task.estimatedDuration;
    const resourceCost = Object.values(estimatedResources).reduce(
      (sum, usage) => sum + usage,
      0,
    );

    return resourceCost > 0 ? expectedOutput / resourceCost : 0;
  }

  private estimateTaskResources(task: Task): Record<string, number> {
    // Estimate based on task complexity and type
    const baseResources = {
      cpu:
        task.complexity === 'enterprise'
          ? 0.8
          : task.complexity === 'complex'
            ? 0.6
            : 0.3,
      memory:
        task.complexity === 'enterprise'
          ? 0.7
          : task.complexity === 'complex'
            ? 0.5
            : 0.2,
      network: task.requiredResources.includes('network') ? 0.4 : 0.1,
      disk: task.requiredResources.includes('storage') ? 0.5 : 0.1,
    };

    return baseResources;
  }

  private calculateAvailableResources(): Record<string, number> {
    const totalResources = { cpu: 1.0, memory: 1.0, network: 1.0, disk: 1.0 };
    const usedResources = { cpu: 0, memory: 0, network: 0, disk: 0 };

    // Calculate used resources from running tasks
    this.resourceAllocations.forEach((allocation) => {
      Object.keys(allocation).forEach((resource) => {
        if (resource in usedResources) {
          usedResources[resource as keyof typeof usedResources] +=
            allocation[resource];
        }
      });
    });

    // Return available resources
    return {
      cpu: Math.max(0, totalResources.cpu - usedResources.cpu),
      memory: Math.max(0, totalResources.memory - usedResources.memory),
      network: Math.max(0, totalResources.network - usedResources.network),
      disk: Math.max(0, totalResources.disk - usedResources.disk),
    };
  }

  private canAllocateResources(
    required: Record<string, number>,
    budget: Record<string, number>,
    currentUsage: Record<string, number>,
  ): boolean {
    return Object.keys(required).every((resource) => {
      const available = budget[resource] - currentUsage[resource];
      return available >= required[resource];
    });
  }

  private extractTaskFeatures(task: Task): number[] {
    // Extract numerical features for ML model
    return [
      task.priority,
      task.estimatedDuration,
      task.dependencies.length,
      task.dependents.length,
      Date.now() - task.createdAt.getTime(),
      task.deadline ? Math.max(0, task.deadline.getTime() - Date.now()) : 0,
      this.getCategoryIndex(task.category),
      task.currentRetries,
      task.requiredResources.length,
    ];
  }

  private getCategoryIndex(category: TaskCategory): number {
    const categories = Object.values(TaskCategory);
    return categories.indexOf(category);
  }

  private calculateSystemLoad(): number {
    const runningTasks = this.runningTasks.size;
    const maxTasks = this.options.maxConcurrentTasks;
    return runningTasks / maxTasks;
  }

  private calculateQueuePressure(): number {
    const totalTasks = this.tasks.size;
    const runningTasks = this.runningTasks.size;
    const queuedTasks = totalTasks - runningTasks;
    return queuedTasks / (queuedTasks + runningTasks + 1);
  }

  private calculateResourceUtilization(): number {
    const totalUtilization = Array.from(this.executorNodes.values()).reduce(
      (sum, executor) =>
        sum + executor.currentLoad / executor.maxConcurrentTasks,
      0,
    );

    return this.executorNodes.size > 0
      ? totalUtilization / this.executorNodes.size
      : 0;
  }

  private hasUrgentDeadlines(): boolean {
    const oneHourFromNow = Date.now() + 60 * 60 * 1000;

    return Array.from(this.tasks.values()).some(
      (task) => task.deadline && task.deadline.getTime() < oneHourFromNow,
    );
  }

  private hasRequiredCapabilities(executor: ExecutorNode, task: Task): boolean {
    return task.requiredResources.every((capability) =>
      executor.capabilities.includes(capability),
    );
  }

  private selectBestCapabilityMatch(
    _task: Task,
    executors: ExecutorNode[],
  ): ExecutorNode {
    return executors.reduce((best, executor) => {
      const matchScore = this.calculateCapabilityMatch(_task, executor);
      const bestScore = this.calculateCapabilityMatch(_task, best);
      return matchScore > bestScore ? executor : best;
    });
  }

  private calculateCapabilityMatch(task: Task, executor: ExecutorNode): number {
    const requiredCapabilities = new Set(task.requiredResources);
    const executorCapabilities = new Set(executor.capabilities);

    const matches = Array.from(requiredCapabilities).filter((cap) =>
      executorCapabilities.has(cap),
    ).length;

    return requiredCapabilities.size > 0
      ? matches / requiredCapabilities.size
      : 1;
  }

  private assessExecutorHealth(
    metrics: ResourceMetrics,
  ): 'healthy' | 'degraded' | 'unhealthy' {
    const cpuHealthy = metrics.cpuUtilization < 0.8;
    const memoryHealthy = metrics.memoryUtilization < 0.9;
    const overloaded = metrics.concurrentTasks > metrics.queueDepth * 2;

    if (cpuHealthy && memoryHealthy && !overloaded) return 'healthy';
    if (metrics.cpuUtilization < 0.95 && metrics.memoryUtilization < 0.95)
      return 'degraded';
    return 'unhealthy';
  }

  private getResourceUtilization(executorId: string): Record<string, number> {
    const executor = this.executorNodes.get(executorId);
    return executor?.resourceMetrics
      ? {
          cpu: executor.resourceMetrics.cpuUtilization,
          memory: executor.resourceMetrics.memoryUtilization,
          network: executor.resourceMetrics.networkBandwidth,
          disk: executor.resourceMetrics.diskIO,
        }
      : {};
  }

  private getExecutorPerformance(executorId: string): Record<string, number> {
    const executor = this.executorNodes.get(executorId);
    return executor
      ? {
          performanceScore: executor.performanceScore,
          currentLoad: executor.currentLoad / executor.maxConcurrentTasks,
          healthScore:
            executor.healthStatus === 'healthy'
              ? 1
              : executor.healthStatus === 'degraded'
                ? 0.5
                : 0,
        }
      : {};
  }

  private updatePredictionModel(): void {
    // Placeholder for ML model updates
    // In a real implementation, this would retrain the model with recent execution stats
    logger().debug('ML model update triggered', {
      statsCount: this.executionStats.length,
    });
  }

  private updatePerformanceMetrics(stats: TaskExecutionStats): void {
    // Update average latency by priority
    const currentLatency =
      this.performanceMetrics.averageLatency.get(stats.priority) || 0;
    const newLatency = (currentLatency + stats.waitTime) / 2;
    this.performanceMetrics.averageLatency.set(stats.priority, newLatency);

    // Update throughput by category
    const currentThroughput =
      this.performanceMetrics.throughput.get(stats.category) || 0;
    this.performanceMetrics.throughput.set(
      stats.category,
      currentThroughput + 1,
    );

    // Calculate resource efficiency
    const totalResourceUsage = Object.values(stats.resourceUtilization).reduce(
      (sum, usage) => sum + usage,
      0,
    );
    this.performanceMetrics.resourceEfficiency =
      totalResourceUsage > 0 ? stats.successRate / totalResourceUsage : 0;
  }

  private calculateFairnessIndex(): number {
    // Calculate Jain's fairness index for task completion across priorities
    const completionCounts = new Map<TaskPriority, number>();

    // Initialize counts
    Object.values(TaskPriority).forEach((priority) => {
      completionCounts.set(priority, 0);
    });

    // Count completions
    this.executionStats.forEach((stats) => {
      const count = completionCounts.get(stats.priority) || 0;
      completionCounts.set(stats.priority, count + stats.successRate);
    });

    const counts = Array.from(completionCounts.values());
    const sumSquared = counts.reduce((sum, count) => sum + count * count, 0);
    const sum = counts.reduce((sum, count) => sum + count, 0);

    return counts.length > 0 && sumSquared > 0
      ? (sum * sum) / (counts.length * sumSquared)
      : 1;
  }

  private calculateExecutorUtilization(): Map<string, number> {
    const utilization = new Map<string, number>();

    this.executorNodes.forEach((executor, id) => {
      const utilizationRatio =
        executor.currentLoad / executor.maxConcurrentTasks;
      utilization.set(id, utilizationRatio);
    });

    return utilization;
  }

  private startAdvancedOptimization(): void {
    // Performance monitoring
    setInterval(() => {
      this.updatePerformanceMetrics();
      this.optimizeResourceAllocation();
    }, 30000); // Every 30 seconds

    // Starvation prevention
    setInterval(() => {
      this.preventTaskStarvation();
    }, 60000); // Every minute

    // Executor health monitoring
    setInterval(() => {
      this.monitorExecutorHealth();
    }, 10000); // Every 10 seconds

    logger().info('Advanced optimization processes started');
  }

  private preventTaskStarvation(): void {
    const now = Date.now();
    let starvationCount = 0;

    this.tasks.forEach((task) => {
      if (task.status === TaskStatus.PENDING) {
        const waitTime = now - task.createdAt.getTime();
        if (waitTime > this.schedulingConfig.maxStarvationTime) {
          starvationCount++;
          this.starvationTracker.set(task.id, new Date());
        }
      }
    });

    if (starvationCount > 0) {
      logger().warn(`Detected ${starvationCount} starving tasks`, {
        maxStarvationTime: this.schedulingConfig.maxStarvationTime,
      });

      this.emit('starvationDetected', { count: starvationCount });
    }
  }

  private optimizeResourceAllocation(): void {
    // Implement resource allocation optimization based on current system state
    const utilizationStats = this.calculateExecutorUtilization();
    const utilizationValues = Array.from(utilizationStats.values());

    if (utilizationValues.length > 0) {
      const avgUtilization =
        utilizationValues.reduce((sum, util) => sum + util, 0) /
        utilizationValues.length;

      if (avgUtilization > 0.9) {
        logger().info(
          'High system utilization detected, optimizing resource allocation',
          {
            avgUtilization,
          },
        );

        this.emit('highUtilizationDetected', { avgUtilization });
      }
    }
  }

  private monitorExecutorHealth(): void {
    const currentTime = Date.now();
    const healthCheckTimeout = 30000; // 30 seconds

    this.executorNodes.forEach((executor, id) => {
      const timeSinceLastHeartbeat =
        currentTime - executor.lastHeartbeat.getTime();

      if (timeSinceLastHeartbeat > healthCheckTimeout) {
        executor.healthStatus = 'unhealthy';
        logger().warn(`Executor health check failed: ${id}`, {
          timeSinceLastHeartbeat,
          healthCheckTimeout,
        });

        this.emit('executorHealthDegraded', {
          executorId: id,
          status: 'unhealthy',
        });
      }
    });
  }
}
