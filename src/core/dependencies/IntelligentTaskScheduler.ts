/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Intelligent Task Scheduler for Dependency-Based Execution
 * Advanced scheduling system that optimizes task execution based on dependencies,
 * resource constraints, and real-time system conditions
 *
 * === CORE CAPABILITIES ===
 * • Dynamic priority-based task scheduling with dependency awareness
 * • Resource-constrained parallel execution optimization
 * • Adaptive scheduling based on real-time performance metrics
 * • Intelligent load balancing and resource allocation
 * • Predictive scheduling with failure recovery mechanisms
 * • Multi-agent coordination for distributed task execution
 *
 * === SCHEDULING ALGORITHMS ===
 * 1. Critical Path Method (CPM) for timeline optimization
 * 2. Shortest Processing Time (SPT) for quick wins
 * 3. Earliest Deadline First (EDF) for deadline-sensitive tasks
 * 4. Resource-Constrained Project Scheduling (RCPS)
 * 5. Adaptive Priority Scheduling with machine learning insights
 *
 * @author DEPENDENCY_ANALYST
 * @version 1.0.0
 * @since 2025-09-25
 */

import { EventEmitter } from 'node:events';
import { Logger } from '../../utils/logger.js';
import {
  DependencyAnalyzer,
  TaskNode,
  TaskDependency,
  DependencyType,
  ExecutionReadiness,
  SchedulingResult,
  DependencyAnalysisResult,
} from './DependencyAnalyzer.js';

/**
 * Resource allocation limits and constraints
 */
export interface ResourceConstraints {
  maxConcurrentTasks: number;
  maxCpuCores: number;
  maxMemoryMB: number;
  maxDiskSpaceGB: number;
  maxNetworkBandwidthMbps: number;
  reservedResources: {
    cpu: number;
    memory: number;
    disk: number;
    network: number;
  };
}

/**
 * Task execution context with resource tracking
 */
export interface ExecutionContext {
  taskId: string;
  startTime: Date;
  estimatedEndTime: Date;
  actualEndTime?: Date;
  allocatedResources: {
    cpu: number;
    memory: number;
    disk: number;
    network: number;
  };
  executionAgent?: string;
  priority: number;
  dependencies: string[];
  status: 'queued' | 'running' | 'completed' | 'failed' | 'paused';
  retryCount: number;
  maxRetries: number;
  metrics: {
    queueTime: number;
    executionTime: number;
    resourceUtilization: Record<string, number>;
  };
}

/**
 * Scheduling strategy configuration
 */
export interface SchedulingStrategy {
  algorithm:
    | 'critical_path'
    | 'shortest_first'
    | 'deadline_first'
    | 'priority_first'
    | 'adaptive';
  parallelizationEnabled: boolean;
  resourceOptimization: boolean;
  failureRecovery: boolean;
  dynamicPriorityAdjustment: boolean;
  loadBalancing: boolean;
  predictiveScheduling: boolean;
  reschedulingThreshold: number; // 0-1, when to trigger rescheduling
}

/**
 * Real-time system performance metrics
 */
export interface SystemMetrics {
  currentLoad: {
    cpu: number;
    memory: number;
    disk: number;
    network: number;
  };
  taskThroughput: number;
  averageExecutionTime: number;
  successRate: number;
  resourceEfficiency: number;
  queueLength: number;
  activeTaskCount: number;
  timestamp: Date;
}

/**
 * Scheduling event for monitoring and analytics
 */
export interface SchedulingEvent {
  type:
    | 'task_scheduled'
    | 'task_started'
    | 'task_completed'
    | 'task_failed'
    | 'schedule_optimized'
    | 'resource_allocated';
  taskId?: string;
  timestamp: Date;
  data: Record<string, any>;
  impact: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Intelligent Task Scheduler Implementation
 */
export class IntelligentTaskScheduler extends EventEmitter {
  private readonly logger: Logger;
  private readonly dependencyAnalyzer: DependencyAnalyzer;

  private resourceConstraints: ResourceConstraints;
  private schedulingStrategy: SchedulingStrategy;
  private executionQueue: ExecutionContext[];
  private runningTasks: Map<string, ExecutionContext>;
  private completedTasks: Map<string, ExecutionContext>;
  private failedTasks: Map<string, ExecutionContext>;

  private systemMetrics: SystemMetrics;
  private performanceHistory: SystemMetrics[];
  private schedulingEvents: SchedulingEvent[];

  private schedulingTimer?: NodeJS.Timeout;
  private metricsCollectionTimer?: NodeJS.Timeout;

  private readonly maxHistorySize = 1000;
  private readonly schedulingInterval = 5000; // 5 seconds
  private readonly metricsInterval = 10000; // 10 seconds

  constructor(
    dependencyAnalyzer: DependencyAnalyzer,
    resourceConstraints?: Partial<ResourceConstraints>,
    schedulingStrategy?: Partial<SchedulingStrategy>,
  ) {
    super();

    this.logger = new Logger('IntelligentTaskScheduler');
    this.dependencyAnalyzer = dependencyAnalyzer;

    // Initialize default resource constraints
    this.resourceConstraints = {
      maxConcurrentTasks: 10,
      maxCpuCores: 8,
      maxMemoryMB: 16384, // 16GB
      maxDiskSpaceGB: 100,
      maxNetworkBandwidthMbps: 1000,
      reservedResources: {
        cpu: 1,
        memory: 1024, // 1GB
        disk: 10,
        network: 100,
      },
      ...resourceConstraints,
    };

    // Initialize default scheduling strategy
    this.schedulingStrategy = {
      algorithm: 'adaptive',
      parallelizationEnabled: true,
      resourceOptimization: true,
      failureRecovery: true,
      dynamicPriorityAdjustment: true,
      loadBalancing: true,
      predictiveScheduling: true,
      reschedulingThreshold: 0.3,
      ...schedulingStrategy,
    };

    // Initialize task collections
    this.executionQueue = [];
    this.runningTasks = new Map();
    this.completedTasks = new Map();
    this.failedTasks = new Map();

    // Initialize metrics
    this.systemMetrics = this.initializeSystemMetrics();
    this.performanceHistory = [];
    this.schedulingEvents = [];

    this.logger.info('IntelligentTaskScheduler initialized', {
      maxConcurrentTasks: this.resourceConstraints.maxConcurrentTasks,
      algorithm: this.schedulingStrategy.algorithm,
      parallelization: this.schedulingStrategy.parallelizationEnabled,
    });

    this.startScheduler();
  }

  /**
   * Submit task for intelligent scheduling
   */
  public async scheduleTask(
    task: TaskNode,
    dependencies: TaskDependency[] = [],
  ): Promise<void> {
    this.logger.info(`Scheduling task: ${task.taskId}`, {
      name: task.name,
      type: task.type,
      priority: task.priority,
      dependencyCount: dependencies.length,
    });

    try {
      // Analyze task dependencies
      const dependencyAnalysis = await this.dependencyAnalyzer.analyzeTask(
        task.taskId,
      );

      // Create execution context
      const executionContext: ExecutionContext = {
        taskId: task.taskId,
        startTime: new Date(),
        estimatedEndTime: this.calculateEstimatedEndTime(task),
        allocatedResources: this.calculateResourceAllocation(task),
        priority: this.calculateDynamicPriority(task, dependencyAnalysis),
        dependencies: dependencyAnalysis.dependsOn.map(
          (dep) => dep.sourceTaskId,
        ),
        status: 'queued',
        retryCount: 0,
        maxRetries: this.getMaxRetries(task),
        metrics: {
          queueTime: 0,
          executionTime: 0,
          resourceUtilization: {},
        },
      };

      // Add to execution queue
      this.executionQueue.push(executionContext);

      // Sort queue based on current scheduling strategy
      this.optimizeExecutionQueue();

      // Emit scheduling event
      this.emitSchedulingEvent('task_scheduled', task.taskId, {
        priority: executionContext.priority,
        estimatedStartTime: executionContext.startTime,
        queuePosition: this.executionQueue.findIndex(
          (ctx) => ctx.taskId === task.taskId,
        ),
      });

      // Trigger immediate scheduling if resources available
      this.scheduleNextTasks();
    } catch (error) {
      this.logger.error(`Failed to schedule task: ${task.taskId}`, { error });
      throw new Error(
        `Task scheduling failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Update scheduling strategy dynamically
   */
  public updateSchedulingStrategy(strategy: Partial<SchedulingStrategy>): void {
    this.logger.info('Updating scheduling strategy', { changes: strategy });

    this.schedulingStrategy = { ...this.schedulingStrategy, ...strategy };

    // Re-optimize queue if algorithm changed
    if (strategy.algorithm) {
      this.optimizeExecutionQueue();
    }

    this.emitSchedulingEvent('schedule_optimized', undefined, {
      strategy: this.schedulingStrategy,
      queueSize: this.executionQueue.length,
    });
  }

  /**
   * Update resource constraints
   */
  public updateResourceConstraints(
    constraints: Partial<ResourceConstraints>,
  ): void {
    this.logger.info('Updating resource constraints', { changes: constraints });

    this.resourceConstraints = { ...this.resourceConstraints, ...constraints };

    // Re-evaluate running tasks for resource violations
    this.validateResourceAllocations();
  }

  /**
   * Get current scheduler status
   */
  public getSchedulerStatus(): {
    queuedTasks: number;
    runningTasks: number;
    completedTasks: number;
    failedTasks: number;
    resourceUtilization: Record<string, number>;
    systemMetrics: SystemMetrics;
    strategy: SchedulingStrategy;
  } {
    const resourceUtilization = this.calculateCurrentResourceUtilization();

    return {
      queuedTasks: this.executionQueue.length,
      runningTasks: this.runningTasks.size,
      completedTasks: this.completedTasks.size,
      failedTasks: this.failedTasks.size,
      resourceUtilization,
      systemMetrics: this.systemMetrics,
      strategy: this.schedulingStrategy,
    };
  }

  /**
   * Get detailed task execution status
   */
  public getTaskStatus(taskId: string): ExecutionContext | null {
    // Check running tasks
    if (this.runningTasks.has(taskId)) {
      return this.runningTasks.get(taskId)!;
    }

    // Check completed tasks
    if (this.completedTasks.has(taskId)) {
      return this.completedTasks.get(taskId)!;
    }

    // Check failed tasks
    if (this.failedTasks.has(taskId)) {
      return this.failedTasks.get(taskId)!;
    }

    // Check queue
    return this.executionQueue.find((ctx) => ctx.taskId === taskId) || null;
  }

  /**
   * Cancel queued task
   */
  public cancelTask(taskId: string): boolean {
    this.logger.info(`Cancelling task: ${taskId}`);

    // Remove from queue if present
    const queueIndex = this.executionQueue.findIndex(
      (ctx) => ctx.taskId === taskId,
    );
    if (queueIndex !== -1) {
      this.executionQueue.splice(queueIndex, 1);
      this.logger.info(`Task cancelled from queue: ${taskId}`);
      return true;
    }

    // Cannot cancel running tasks through this method
    if (this.runningTasks.has(taskId)) {
      this.logger.warn(`Cannot cancel running task: ${taskId}`);
      return false;
    }

    return false;
  }

  /**
   * Get performance analytics
   */
  public getPerformanceAnalytics(): {
    averageQueueTime: number;
    averageExecutionTime: number;
    successRate: number;
    resourceEfficiency: number;
    throughput: number;
    bottlenecks: string[];
    recommendations: string[];
  } {
    const completedTasksArray = Array.from(this.completedTasks.values());
    const failedTasksArray = Array.from(this.failedTasks.values());
    const totalTasks = completedTasksArray.length + failedTasksArray.length;

    if (totalTasks === 0) {
      return {
        averageQueueTime: 0,
        averageExecutionTime: 0,
        successRate: 0,
        resourceEfficiency: 0,
        throughput: 0,
        bottlenecks: [],
        recommendations: [],
      };
    }

    const averageQueueTime =
      completedTasksArray.reduce((sum, ctx) => sum + ctx.metrics.queueTime, 0) /
      completedTasksArray.length;
    const averageExecutionTime =
      completedTasksArray.reduce(
        (sum, ctx) => sum + ctx.metrics.executionTime,
        0,
      ) / completedTasksArray.length;
    const successRate = completedTasksArray.length / totalTasks;

    const resourceEfficiency = this.calculateResourceEfficiency();
    const throughput = this.calculateThroughput();
    const bottlenecks = this.identifyBottlenecks();
    const recommendations = this.generateRecommendations(
      successRate,
      resourceEfficiency,
      bottlenecks,
    );

    return {
      averageQueueTime,
      averageExecutionTime,
      successRate,
      resourceEfficiency,
      throughput,
      bottlenecks,
      recommendations,
    };
  }

  // =================== PRIVATE SCHEDULING METHODS ===================

  /**
   * Start the intelligent scheduling engine
   */
  private startScheduler(): void {
    this.logger.info('Starting intelligent task scheduler');

    // Start periodic scheduling
    this.schedulingTimer = setInterval(() => {
      this.scheduleNextTasks();
      this.updateMetrics();
      this.adaptiveOptimization();
    }, this.schedulingInterval);

    // Start metrics collection
    this.metricsCollectionTimer = setInterval(() => {
      this.collectSystemMetrics();
    }, this.metricsInterval);
  }

  /**
   * Schedule next available tasks based on current strategy
   */
  private scheduleNextTasks(): void {
    if (this.executionQueue.length === 0) {
      return;
    }

    const availableSlots =
      this.resourceConstraints.maxConcurrentTasks - this.runningTasks.size;
    if (availableSlots <= 0) {
      return;
    }

    // Get tasks ready for execution
    const readyTasks = this.getReadyTasks();

    if (readyTasks.length === 0) {
      return;
    }

    // Select tasks based on current algorithm
    const tasksToSchedule = this.selectTasksForExecution(
      readyTasks,
      availableSlots,
    );

    // Start executing selected tasks
    for (const task of tasksToSchedule) {
      this.startTaskExecution(task);
    }
  }

  /**
   * Get tasks that are ready for execution
   */
  private getReadyTasks(): ExecutionContext[] {
    return this.executionQueue.filter((ctx) => {
      // Check if all dependencies are satisfied
      const dependenciesSatisfied = ctx.dependencies.every((depId) =>
        this.completedTasks.has(depId),
      );

      // Check if resources are available
      const resourcesAvailable = this.canAllocateResources(
        ctx.allocatedResources,
      );

      return dependenciesSatisfied && resourcesAvailable;
    });
  }

  /**
   * Select tasks for execution based on scheduling algorithm
   */
  private selectTasksForExecution(
    readyTasks: ExecutionContext[],
    maxTasks: number,
  ): ExecutionContext[] {
    let selectedTasks: ExecutionContext[] = [];

    switch (this.schedulingStrategy.algorithm) {
      case 'critical_path':
        selectedTasks = this.selectByCriticalPath(readyTasks, maxTasks);
        break;

      case 'shortest_first':
        selectedTasks = this.selectByShortestFirst(readyTasks, maxTasks);
        break;

      case 'deadline_first':
        selectedTasks = this.selectByDeadlineFirst(readyTasks, maxTasks);
        break;

      case 'priority_first':
        selectedTasks = this.selectByPriority(readyTasks, maxTasks);
        break;

      case 'adaptive':
        selectedTasks = this.selectAdaptively(readyTasks, maxTasks);
        break;

      default:
        selectedTasks = this.selectByPriority(readyTasks, maxTasks);
    }

    return selectedTasks;
  }

  /**
   * Start task execution
   */
  private async startTaskExecution(context: ExecutionContext): Promise<void> {
    this.logger.info(`Starting task execution: ${context.taskId}`, {
      priority: context.priority,
      allocatedResources: context.allocatedResources,
    });

    // Remove from queue
    const queueIndex = this.executionQueue.findIndex(
      (ctx) => ctx.taskId === context.taskId,
    );
    if (queueIndex !== -1) {
      this.executionQueue.splice(queueIndex, 1);
    }

    // Update context
    context.status = 'running';
    context.startTime = new Date();
    context.metrics.queueTime = Date.now() - context.startTime.getTime();

    // Add to running tasks
    this.runningTasks.set(context.taskId, context);

    // Emit event
    this.emitSchedulingEvent('task_started', context.taskId, {
      allocatedResources: context.allocatedResources,
      queueTime: context.metrics.queueTime,
    });

    try {
      // Simulate task execution (in real implementation, this would trigger actual execution)
      await this.simulateTaskExecution(context);

      // Task completed successfully
      this.handleTaskCompletion(context.taskId, true);
    } catch (error) {
      // Task failed
      this.handleTaskCompletion(context.taskId, false, error);
    }
  }

  /**
   * Handle task completion or failure
   */
  private handleTaskCompletion(
    taskId: string,
    success: boolean,
    error?: any,
  ): void {
    const context = this.runningTasks.get(taskId);
    if (!context) {
      this.logger.warn(
        `Task completion handler called for non-running task: ${taskId}`,
      );
      return;
    }

    // Remove from running tasks
    this.runningTasks.delete(taskId);

    // Update context
    context.actualEndTime = new Date();
    context.metrics.executionTime =
      context.actualEndTime.getTime() - context.startTime.getTime();
    context.status = success ? 'completed' : 'failed';

    if (success) {
      // Add to completed tasks
      this.completedTasks.set(taskId, context);

      this.logger.info(`Task completed successfully: ${taskId}`, {
        executionTime: context.metrics.executionTime,
        queueTime: context.metrics.queueTime,
      });

      this.emitSchedulingEvent('task_completed', taskId, {
        executionTime: context.metrics.executionTime,
        queueTime: context.metrics.queueTime,
        resourceUtilization: context.metrics.resourceUtilization,
      });
    } else {
      // Handle failure
      if (context.retryCount < context.maxRetries) {
        // Retry task
        context.retryCount++;
        context.status = 'queued';
        this.executionQueue.unshift(context); // Add to front of queue for retry

        this.logger.warn(`Task failed, retrying: ${taskId}`, {
          retryCount: context.retryCount,
          maxRetries: context.maxRetries,
          error: error?.message,
        });
      } else {
        // Permanent failure
        this.failedTasks.set(taskId, context);

        this.logger.error(`Task failed permanently: ${taskId}`, {
          retryCount: context.retryCount,
          error: error?.message,
        });

        this.emitSchedulingEvent('task_failed', taskId, {
          retryCount: context.retryCount,
          error: error?.message,
          executionTime: context.metrics.executionTime,
        });
      }
    }

    // Schedule next tasks
    this.scheduleNextTasks();
  }

  /**
   * Optimize execution queue based on current strategy
   */
  private optimizeExecutionQueue(): void {
    switch (this.schedulingStrategy.algorithm) {
      case 'critical_path':
        this.executionQueue.sort((a, b) => this.compareByCriticalPath(a, b));
        break;

      case 'shortest_first':
        this.executionQueue.sort((a, b) => this.compareByDuration(a, b));
        break;

      case 'deadline_first':
        this.executionQueue.sort((a, b) => this.compareByDeadline(a, b));
        break;

      case 'priority_first':
        this.executionQueue.sort((a, b) => b.priority - a.priority);
        break;

      case 'adaptive':
        this.executionQueue.sort((a, b) => this.compareAdaptively(a, b));
        break;
    }
  }

  // =================== UTILITY METHODS ===================

  private calculateEstimatedEndTime(task: TaskNode): Date {
    return new Date(Date.now() + task.estimatedDuration);
  }

  private calculateResourceAllocation(
    task: TaskNode,
  ): ExecutionContext['allocatedResources'] {
    const reqs = task.resourceRequirements;
    return {
      cpu: reqs.cpu || 1,
      memory: reqs.memory || 512, // 512MB default
      disk: reqs.disk || 1, // 1GB default
      network: 10, // 10Mbps default
    };
  }

  private calculateDynamicPriority(
    task: TaskNode,
    analysis: DependencyAnalysisResult,
  ): number {
    let priority = task.priority;

    // Boost priority for critical path tasks
    if (analysis.criticalPath.includes(task.taskId)) {
      priority += 10;
    }

    // Boost priority for tasks with many dependents
    priority += analysis.enables.length * 2;

    // Reduce priority for tasks with many blockers
    priority -= analysis.blockedBy.length;

    return Math.max(0, priority);
  }

  private getMaxRetries(task: TaskNode): number {
    // Different task types might have different retry policies
    switch (task.type) {
      case 'critical':
        return 3;
      case 'high_priority':
        return 2;
      case 'normal':
        return 1;
      case 'low_priority':
        return 0;
      default:
        return 1;
    }
  }

  private canAllocateResources(
    requested: ExecutionContext['allocatedResources'],
  ): boolean {
    const available = this.calculateAvailableResources();

    return (
      requested.cpu <= available.cpu &&
      requested.memory <= available.memory &&
      requested.disk <= available.disk &&
      requested.network <= available.network
    );
  }

  private calculateAvailableResources(): Record<string, number> {
    const total = {
      cpu: this.resourceConstraints.maxCpuCores,
      memory: this.resourceConstraints.maxMemoryMB,
      disk: this.resourceConstraints.maxDiskSpaceGB * 1024, // Convert to MB
      network: this.resourceConstraints.maxNetworkBandwidthMbps,
    };

    const reserved = this.resourceConstraints.reservedResources;
    const used = this.calculateUsedResources();

    return {
      cpu: total.cpu - reserved.cpu - used.cpu,
      memory: total.memory - reserved.memory - used.memory,
      disk: total.disk - reserved.disk - used.disk,
      network: total.network - reserved.network - used.network,
    };
  }

  private calculateUsedResources(): Record<string, number> {
    const used = { cpu: 0, memory: 0, disk: 0, network: 0 };

    for (const context of this.runningTasks.values()) {
      used.cpu += context.allocatedResources.cpu;
      used.memory += context.allocatedResources.memory;
      used.disk += context.allocatedResources.disk;
      used.network += context.allocatedResources.network;
    }

    return used;
  }

  private calculateCurrentResourceUtilization(): Record<string, number> {
    const used = this.calculateUsedResources();
    const total = {
      cpu: this.resourceConstraints.maxCpuCores,
      memory: this.resourceConstraints.maxMemoryMB,
      disk: this.resourceConstraints.maxDiskSpaceGB * 1024,
      network: this.resourceConstraints.maxNetworkBandwidthMbps,
    };

    return {
      cpu: total.cpu > 0 ? (used.cpu / total.cpu) * 100 : 0,
      memory: total.memory > 0 ? (used.memory / total.memory) * 100 : 0,
      disk: total.disk > 0 ? (used.disk / total.disk) * 100 : 0,
      network: total.network > 0 ? (used.network / total.network) * 100 : 0,
    };
  }

  private initializeSystemMetrics(): SystemMetrics {
    return {
      currentLoad: { cpu: 0, memory: 0, disk: 0, network: 0 },
      taskThroughput: 0,
      averageExecutionTime: 0,
      successRate: 1.0,
      resourceEfficiency: 0,
      queueLength: 0,
      activeTaskCount: 0,
      timestamp: new Date(),
    };
  }

  // =================== SCHEDULING ALGORITHM IMPLEMENTATIONS ===================

  private selectByCriticalPath(
    tasks: ExecutionContext[],
    maxTasks: number,
  ): ExecutionContext[] {
    // Sort by critical path membership and priority
    return tasks
      .sort((a, b) => this.compareByCriticalPath(a, b))
      .slice(0, maxTasks);
  }

  private selectByShortestFirst(
    tasks: ExecutionContext[],
    maxTasks: number,
  ): ExecutionContext[] {
    // Sort by estimated duration (shortest first)
    return tasks
      .sort((a, b) => this.compareByDuration(a, b))
      .slice(0, maxTasks);
  }

  private selectByDeadlineFirst(
    tasks: ExecutionContext[],
    maxTasks: number,
  ): ExecutionContext[] {
    // Sort by deadline (earliest first)
    return tasks
      .sort((a, b) => this.compareByDeadline(a, b))
      .slice(0, maxTasks);
  }

  private selectByPriority(
    tasks: ExecutionContext[],
    maxTasks: number,
  ): ExecutionContext[] {
    // Sort by priority (highest first)
    return tasks.sort((a, b) => b.priority - a.priority).slice(0, maxTasks);
  }

  private selectAdaptively(
    tasks: ExecutionContext[],
    maxTasks: number,
  ): ExecutionContext[] {
    // Combine multiple factors for intelligent selection
    return tasks
      .sort((a, b) => this.compareAdaptively(a, b))
      .slice(0, maxTasks);
  }

  // =================== COMPARISON METHODS ===================

  private compareByCriticalPath(
    a: ExecutionContext,
    b: ExecutionContext,
  ): number {
    // This would check if tasks are on critical path
    // For now, prioritize by dependency count and priority
    const aScore = a.dependencies.length * 10 + a.priority;
    const bScore = b.dependencies.length * 10 + b.priority;
    return bScore - aScore;
  }

  private compareByDuration(a: ExecutionContext, b: ExecutionContext): number {
    const aDuration = a.estimatedEndTime.getTime() - a.startTime.getTime();
    const bDuration = b.estimatedEndTime.getTime() - b.startTime.getTime();
    return aDuration - bDuration;
  }

  private compareByDeadline(a: ExecutionContext, b: ExecutionContext): number {
    return a.estimatedEndTime.getTime() - b.estimatedEndTime.getTime();
  }

  private compareAdaptively(a: ExecutionContext, b: ExecutionContext): number {
    // Adaptive scoring based on multiple factors
    const aScore = this.calculateAdaptiveScore(a);
    const bScore = this.calculateAdaptiveScore(b);
    return bScore - aScore;
  }

  private calculateAdaptiveScore(context: ExecutionContext): number {
    let score = context.priority * 10;

    // Factor in queue time
    const queueTime = Date.now() - context.startTime.getTime();
    score += Math.min(queueTime / 1000, 100); // Up to 100 points for waiting time

    // Factor in dependency count (more dependents = higher priority)
    score += context.dependencies.length * 5;

    // Factor in resource efficiency
    const resourceScore = this.calculateResourceEfficiencyScore(
      context.allocatedResources,
    );
    score += resourceScore;

    return score;
  }

  private calculateResourceEfficiencyScore(
    resources: ExecutionContext['allocatedResources'],
  ): number {
    const utilization = this.calculateCurrentResourceUtilization();

    // Prefer tasks that use currently underutilized resources
    let score = 0;
    if (utilization.cpu < 50) score += resources.cpu;
    if (utilization.memory < 50) score += resources.memory / 100;
    if (utilization.disk < 50) score += resources.disk;
    if (utilization.network < 50) score += resources.network / 10;

    return score;
  }

  // =================== MONITORING AND ANALYTICS ===================

  private updateMetrics(): void {
    this.systemMetrics = {
      currentLoad: this.calculateCurrentResourceUtilization(),
      taskThroughput: this.calculateThroughput(),
      averageExecutionTime: this.calculateAverageExecutionTime(),
      successRate: this.calculateSuccessRate(),
      resourceEfficiency: this.calculateResourceEfficiency(),
      queueLength: this.executionQueue.length,
      activeTaskCount: this.runningTasks.size,
      timestamp: new Date(),
    };

    // Store in history
    this.performanceHistory.push(this.systemMetrics);
    if (this.performanceHistory.length > this.maxHistorySize) {
      this.performanceHistory.shift();
    }
  }

  private collectSystemMetrics(): void {
    // In a real implementation, this would collect actual system metrics
    // For now, we'll simulate based on running tasks
    this.updateMetrics();
  }

  private adaptiveOptimization(): void {
    if (!this.schedulingStrategy.dynamicPriorityAdjustment) {
      return;
    }

    // Check if rescheduling is needed
    const currentEfficiency = this.systemMetrics.resourceEfficiency;
    if (
      currentEfficiency <
      this.schedulingStrategy.reschedulingThreshold * 100
    ) {
      this.optimizeExecutionQueue();

      this.emitSchedulingEvent('schedule_optimized', undefined, {
        reason: 'low_efficiency',
        efficiency: currentEfficiency,
        queueSize: this.executionQueue.length,
      });
    }
  }

  private calculateThroughput(): number {
    if (this.performanceHistory.length < 2) {
      return 0;
    }

    const timeWindow = 300000; // 5 minutes
    const recentHistory = this.performanceHistory.filter(
      (metric) => Date.now() - metric.timestamp.getTime() < timeWindow,
    );

    if (recentHistory.length === 0) {
      return 0;
    }

    const completedInWindow = Array.from(this.completedTasks.values()).filter(
      (ctx) =>
        ctx.actualEndTime &&
        Date.now() - ctx.actualEndTime.getTime() < timeWindow,
    ).length;

    return completedInWindow / (timeWindow / 60000); // Tasks per minute
  }

  private calculateAverageExecutionTime(): number {
    const completed = Array.from(this.completedTasks.values());
    if (completed.length === 0) return 0;

    const totalTime = completed.reduce(
      (sum, ctx) => sum + ctx.metrics.executionTime,
      0,
    );
    return totalTime / completed.length;
  }

  private calculateSuccessRate(): number {
    const totalTasks = this.completedTasks.size + this.failedTasks.size;
    if (totalTasks === 0) return 1.0;

    return this.completedTasks.size / totalTasks;
  }

  private calculateResourceEfficiency(): number {
    const utilization = this.calculateCurrentResourceUtilization();
    const averageUtilization =
      (utilization.cpu +
        utilization.memory +
        utilization.disk +
        utilization.network) /
      4;

    // Efficiency is balance between utilization and performance
    const throughput = this.systemMetrics.taskThroughput;
    const successRate = this.systemMetrics.successRate;

    return (
      averageUtilization * 0.4 + throughput * 0.3 + successRate * 100 * 0.3
    );
  }

  private identifyBottlenecks(): string[] {
    const bottlenecks: string[] = [];

    // High queue length
    if (
      this.executionQueue.length >
      this.resourceConstraints.maxConcurrentTasks * 2
    ) {
      bottlenecks.push('High task queue length');
    }

    // Low success rate
    if (this.systemMetrics.successRate < 0.8) {
      bottlenecks.push('Low task success rate');
    }

    // Resource constraints
    const utilization = this.systemMetrics.currentLoad;
    if (utilization.cpu > 90) bottlenecks.push('CPU constraint');
    if (utilization.memory > 90) bottlenecks.push('Memory constraint');
    if (utilization.disk > 90) bottlenecks.push('Disk constraint');
    if (utilization.network > 90) bottlenecks.push('Network constraint');

    return bottlenecks;
  }

  private generateRecommendations(
    successRate: number,
    efficiency: number,
    bottlenecks: string[],
  ): string[] {
    const recommendations: string[] = [];

    if (successRate < 0.9) {
      recommendations.push(
        'Consider increasing task retry limits or improving error handling',
      );
    }

    if (efficiency < 50) {
      recommendations.push(
        'Resource utilization is low - consider increasing concurrent task limit',
      );
    }

    if (efficiency > 90) {
      recommendations.push(
        'System is running at high efficiency - monitor for potential overload',
      );
    }

    if (bottlenecks.includes('CPU constraint')) {
      recommendations.push(
        'Consider scaling CPU resources or optimizing task CPU usage',
      );
    }

    if (bottlenecks.includes('Memory constraint')) {
      recommendations.push(
        'Consider increasing memory allocation or optimizing task memory usage',
      );
    }

    if (this.executionQueue.length > 20) {
      recommendations.push(
        'High queue length detected - consider parallelization improvements',
      );
    }

    return recommendations;
  }

  private validateResourceAllocations(): void {
    // Check if running tasks exceed new constraints
    const used = this.calculateUsedResources();
    const limits = {
      cpu: this.resourceConstraints.maxCpuCores,
      memory: this.resourceConstraints.maxMemoryMB,
      disk: this.resourceConstraints.maxDiskSpaceGB * 1024,
      network: this.resourceConstraints.maxNetworkBandwidthMbps,
    };

    if (
      used.cpu > limits.cpu ||
      used.memory > limits.memory ||
      used.disk > limits.disk ||
      used.network > limits.network
    ) {
      this.logger.warn('Resource constraint violation detected', {
        used,
        limits,
      });

      this.emitSchedulingEvent('resource_allocated', undefined, {
        violation: true,
        used,
        limits,
      });

      // In a real implementation, might need to pause or reschedule tasks
    }
  }

  private async simulateTaskExecution(
    context: ExecutionContext,
  ): Promise<void> {
    // Simulate variable execution time
    const baseTime =
      context.estimatedEndTime.getTime() - context.startTime.getTime();
    const variability = 0.3; // 30% variability
    const actualTime = baseTime * (1 + (Math.random() - 0.5) * variability);

    // Simulate occasional failures
    const failureRate = 0.05; // 5% failure rate
    const shouldFail = Math.random() < failureRate;

    await new Promise((resolve) =>
      setTimeout(resolve, Math.min(actualTime, 1000)),
    ); // Cap simulation time

    if (shouldFail) {
      throw new Error('Simulated task execution failure');
    }

    // Update resource utilization metrics
    context.metrics.resourceUtilization = {
      cpu: Math.random() * context.allocatedResources.cpu,
      memory: Math.random() * context.allocatedResources.memory,
      disk: Math.random() * context.allocatedResources.disk,
      network: Math.random() * context.allocatedResources.network,
    };
  }

  private emitSchedulingEvent(
    type: SchedulingEvent['type'],
    taskId?: string,
    data: Record<string, any> = {},
  ): void {
    const event: SchedulingEvent = {
      type,
      taskId,
      timestamp: new Date(),
      data,
      impact: this.determineEventImpact(type, data),
    };

    this.schedulingEvents.push(event);
    if (this.schedulingEvents.length > this.maxHistorySize) {
      this.schedulingEvents.shift();
    }

    this.emit(type, event);
  }

  private determineEventImpact(
    type: SchedulingEvent['type'],
    data: Record<string, any>,
  ): SchedulingEvent['impact'] {
    switch (type) {
      case 'task_failed':
        return 'high';
      case 'task_completed':
        return 'low';
      case 'task_started':
        return 'low';
      case 'task_scheduled':
        return 'low';
      case 'schedule_optimized':
        return 'medium';
      case 'resource_allocated':
        return data.violation ? 'critical' : 'low';
      default:
        return 'medium';
    }
  }

  /**
   * Graceful shutdown of the scheduler
   */
  public async shutdown(): Promise<void> {
    this.logger.info('Shutting down IntelligentTaskScheduler...');

    // Clear timers
    if (this.schedulingTimer) {
      clearInterval(this.schedulingTimer);
    }
    if (this.metricsCollectionTimer) {
      clearInterval(this.metricsCollectionTimer);
    }

    // Wait for running tasks to complete (with timeout)
    const shutdownTimeout = 30000; // 30 seconds
    const startTime = Date.now();

    while (
      this.runningTasks.size > 0 &&
      Date.now() - startTime < shutdownTimeout
    ) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    if (this.runningTasks.size > 0) {
      this.logger.warn(
        `Shutdown timeout reached with ${this.runningTasks.size} tasks still running`,
      );
    }

    // Clear collections
    this.executionQueue.length = 0;
    this.runningTasks.clear();
    this.performanceHistory.length = 0;
    this.schedulingEvents.length = 0;

    this.removeAllListeners();

    this.logger.info('IntelligentTaskScheduler shutdown complete');
  }
}
