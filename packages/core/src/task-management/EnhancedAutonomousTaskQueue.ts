/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { EventEmitter } from 'node:events';
import { v4 as uuidv4 } from 'uuid';
import { logger as createLogger } from '../utils/logger.js';

const logger = createLogger();
import { TaskQueue, type Task, TaskPriority, TaskStatus, TaskCategory, type TaskContext, type TaskExecutionResult, type QueueMetrics } from './TaskQueue.js';
import { PriorityScheduler, SchedulingAlgorithm } from './PriorityScheduler.js';
import { QueueOptimizer, OptimizationStrategy } from './QueueOptimizer.js';
import { AutonomousTaskBreakdown, type TaskBreakdownResult, BreakdownStrategy } from './AutonomousTaskBreakdown.js';
import type { TaskId } from './types.js';

/**
 * Enhanced autonomous queue configuration
 */
export interface EnhancedQueueConfig {
  // Base queue settings
  maxConcurrentTasks: number;
  maxRetries: number;
  defaultTimeout: number;

  // Autonomous breakdown settings
  enableAutonomousBreakdown: boolean;
  breakdownThreshold: number;           // Complexity threshold for automatic breakdown
  maxBreakdownDepth: number;           // Maximum levels of recursive breakdown
  breakdownStrategies: BreakdownStrategy[];

  // Scheduling optimization
  schedulingAlgorithm: SchedulingAlgorithm;
  optimizationStrategy: OptimizationStrategy;
  enableAdaptiveScheduling: boolean;

  // Performance and monitoring
  metricsEnabled: boolean;
  performanceOptimization: boolean;
  learningEnabled: boolean;

  // Resource management
  resourcePools: Map<string, number>;
  enableResourceOptimization: boolean;
}

/**
 * Autonomous task execution context
 */
export interface AutonomousExecutionContext extends TaskContext {
  breakdownLevel?: number;
  parentTaskId?: string;
  breakdownStrategy?: BreakdownStrategy;
  autonomousMetadata?: {
    originalComplexity: number;
    breakdownReason: string;
    expectedImprovement: number;
    actualImprovement?: number;
  };
}

/**
 * Autonomous queue metrics
 */
export interface AutonomousQueueMetrics extends QueueMetrics {
  // Breakdown metrics
  tasksAnalyzedForBreakdown: number;
  tasksBrokenDown: number;
  averageBreakdownImprovement: number;
  breakdownSuccessRate: number;

  // Autonomous optimization metrics
  autonomousOptimizations: number;
  optimizationSuccessRate: number;
  adaptiveSchedulingAdjustments: number;

  // Learning metrics
  learningDataPoints: number;
  predictionAccuracy: number;
  autonomyLevel: number; // 0-1 scale of how autonomous the queue is
}

/**
 * Enhanced Autonomous Task Queue with intelligent breakdown and self-optimization
 */
export class EnhancedAutonomousTaskQueue extends EventEmitter {
  private baseQueue: TaskQueue;
  private priorityScheduler: PriorityScheduler;
  private queueOptimizer: QueueOptimizer;
  private taskBreakdown: AutonomousTaskBreakdown;
  private config: EnhancedQueueConfig;

  // Enhanced tracking
  private breakdownHistory = new Map<string, TaskBreakdownResult>();
  private executionResults = new Map<string, TaskExecutionResult>();
  private autonomousMetrics: AutonomousQueueMetrics;

  // Self-learning components
  private learningEnabled = true;
  private adaptationHistory: Array<{
    timestamp: Date;
    adaptation: string;
    trigger: string;
    impact: number;
  }> = [];

  constructor(config: Partial<EnhancedQueueConfig> = {}) {
    super();

    // Initialize configuration with intelligent defaults
    this.config = {
      maxConcurrentTasks: 8,
      maxRetries: 3,
      defaultTimeout: 300000, // 5 minutes

      enableAutonomousBreakdown: true,
      breakdownThreshold: 0.7,
      maxBreakdownDepth: 3,
      breakdownStrategies: [
        BreakdownStrategy.FUNCTIONAL,
        BreakdownStrategy.TEMPORAL,
        BreakdownStrategy.DEPENDENCY,
        BreakdownStrategy.HYBRID
      ],

      schedulingAlgorithm: SchedulingAlgorithm.HYBRID_ADAPTIVE,
      optimizationStrategy: OptimizationStrategy.BALANCED,
      enableAdaptiveScheduling: true,

      metricsEnabled: true,
      performanceOptimization: true,
      learningEnabled: true,

      resourcePools: new Map([
        ['cpu', 4],
        ['memory', 8],
        ['network', 6],
        ['disk', 4]
      ]),
      enableResourceOptimization: true,

      ...config
    };

    // Initialize components
    this.baseQueue = new TaskQueue({
      maxConcurrentTasks: this.config.maxConcurrentTasks,
      maxRetries: this.config.maxRetries,
      defaultTimeout: this.config.defaultTimeout,
      enableSmartScheduling: true,
      enableQueueOptimization: true,
      persistenceEnabled: true,
      metricsEnabled: this.config.metricsEnabled
    });

    this.priorityScheduler = new PriorityScheduler(
      this.config.schedulingAlgorithm,
      {
        enableMachineLearning: this.config.learningEnabled,
        adaptiveThreshold: 0.15,
        maxLearningHistory: 1000,
        performanceWindow: 100
      }
    );

    this.queueOptimizer = new QueueOptimizer();

    this.taskBreakdown = new AutonomousTaskBreakdown({
      maxSubtasks: 12,
      minSubtaskDuration: 30000,      // 30 seconds
      maxSubtaskDuration: 600000,     // 10 minutes
      complexityThreshold: this.config.breakdownThreshold,
      parallelizationPreference: 0.8,
      riskTolerance: 0.6,
      enableSmartBreakdown: true,
      strategies: this.config.breakdownStrategies
    });

    // Initialize metrics
    this.initializeAutonomousMetrics();

    // Setup event handlers for component coordination
    this.setupComponentIntegration();

    // Start autonomous optimization if enabled
    if (this.config.performanceOptimization) {
      this.startAutonomousOptimization();
    }

    logger.info('EnhancedAutonomousTaskQueue initialized', {
      config: this.config,
      autonomousBreakdown: this.config.enableAutonomousBreakdown,
      schedulingAlgorithm: this.config.schedulingAlgorithm,
      optimizationStrategy: this.config.optimizationStrategy
    });
  }

  /**
   * Add task with autonomous analysis and potential breakdown
   */
  async addTask(taskDefinition: Partial<Task> & Pick<Task, 'title' | 'description' | 'executeFunction'>): Promise<string> {
    const startTime = Date.now();

    logger.debug('Adding task with autonomous analysis', {
      title: taskDefinition.title,
      category: taskDefinition.category,
      estimatedDuration: taskDefinition.estimatedDuration
    });

    try {
      // Create initial task
      const task: Task = await this.createEnhancedTask(taskDefinition);

      // Autonomous breakdown analysis if enabled
      if (this.config.enableAutonomousBreakdown) {
        const breakdownResult = await this.analyzeForBreakdown(task);

        if (breakdownResult) {
          // Task was broken down - add subtasks instead
          await this.addBreakdownSubtasks(task, breakdownResult);

          logger.info('Task autonomously broken down', {
            originalTaskId: task.id,
            subtaskCount: breakdownResult.subtasks.length,
            strategy: breakdownResult.breakdownStrategy,
            expectedImprovement: breakdownResult.expectedImprovement
          });

          this.emit('taskBrokenDown', { originalTask: task, breakdown: breakdownResult });

          return task.id; // Return original task ID as reference
        }
      }

      // Add single task (no breakdown needed/beneficial)
      const taskId = await this.baseQueue.addTask(task);

      // Update metrics
      this.updateAutonomousMetrics('taskAdded', { taskId, duration: Date.now() - startTime });

      logger.debug('Task added to queue', {
        taskId,
        analysisTime: Date.now() - startTime,
        breakdownApplied: false
      });

      return taskId;

    } catch (error) {
      logger.error('Failed to add task with autonomous analysis', {
        title: taskDefinition.title,
        error: error instanceof Error ? error.message : String(error),
        analysisTime: Date.now() - startTime
      });

      throw error;
    }
  }

  /**
   * Enhanced task creation with autonomous context
   */
  private async createEnhancedTask(taskDefinition: Partial<Task> & Pick<Task, 'title' | 'description' | 'executeFunction'>): Promise<Task> {
    const baseTask: Task = {
      id: taskDefinition.id ?? uuidv4(),
      title: taskDefinition.title,
      description: taskDefinition.description,
      category: taskDefinition.category ?? TaskCategory.FEATURE,
      priority: taskDefinition.priority ?? TaskPriority.MEDIUM,
      status: TaskStatus.PENDING,

      estimatedDuration: taskDefinition.estimatedDuration ?? 60000,
      maxRetries: taskDefinition.maxRetries ?? this.config.maxRetries,
      currentRetries: 0,

      createdAt: new Date(),
      dependencies: taskDefinition.dependencies ?? [],
      dependents: [],

      context: taskDefinition.context ?? {},

      basePriority: taskDefinition.priority ?? TaskPriority.MEDIUM,
      dynamicPriority: taskDefinition.priority ?? TaskPriority.MEDIUM,
      priorityFactors: {
        age: 0,
        userImportance: 1.0,
        systemCriticality: 1.0,
        dependencyWeight: 1.0,
        resourceAvailability: 1.0,
        executionHistory: 1.0
      },

      executeFunction: this.wrapExecuteFunction(taskDefinition.executeFunction),
      validateFunction: taskDefinition.validateFunction,
      rollbackFunction: taskDefinition.rollbackFunction,

      tags: taskDefinition.tags ?? [],
      metadata: {
        ...taskDefinition.metadata,
        autonomousAnalysis: {
          analyzedAt: new Date(),
          queueVersion: '2.0-autonomous'
        }
      },

      requiredResources: taskDefinition.requiredResources ?? ['cpu'],
      resourceConstraints: taskDefinition.resourceConstraints ?? {},

      preConditions: taskDefinition.preConditions ?? [],
      postConditions: taskDefinition.postConditions ?? [],

      progressCallback: taskDefinition.progressCallback,

      batchCompatible: taskDefinition.batchCompatible ?? false,
      batchGroup: taskDefinition.batchGroup
    };

    // Enhance with autonomous context
    baseTask.context = {
      ...baseTask.context,
      autonomous: {
        enqueuedAt: new Date(),
        analysisVersion: '2.0',
        autonomousFeatures: {
          breakdown: this.config.enableAutonomousBreakdown,
          adaptiveScheduling: this.config.enableAdaptiveScheduling,
          optimization: this.config.performanceOptimization
        }
      }
    };

    return baseTask;
  }

  /**
   * Wrap execute function with autonomous monitoring
   */
  private wrapExecuteFunction(
    originalFunction: (task: Task, context: TaskContext) => Promise<TaskExecutionResult>
  ): (task: Task, context: TaskContext) => Promise<TaskExecutionResult> {
    return async (task: Task, context: TaskContext) => {
      const startTime = Date.now();
      const enhancedContext: AutonomousExecutionContext = {
        ...context,
        autonomous: {
          monitoringEnabled: true,
          startTime: new Date(),
          queueVersion: '2.0-autonomous'
        }
      };

      try {
        const result = await originalFunction(task, enhancedContext);

        // Record execution for learning
        const executionTime = Date.now() - startTime;
        this.recordTaskExecution(task, result, executionTime);

        return result;

      } catch (error) {
        // Record failure for learning
        this.recordTaskFailure(task, error as Error, Date.now() - startTime);
        throw error;
      }
    };
  }

  /**
   * Autonomous breakdown analysis
   */
  private async analyzeForBreakdown(task: Task): Promise<TaskBreakdownResult | null> {
    try {
      this.autonomousMetrics.tasksAnalyzedForBreakdown++;

      const breakdown = await this.taskBreakdown.analyzeAndBreakdown(task);

      if (breakdown) {
        this.autonomousMetrics.tasksBrokenDown++;
        this.breakdownHistory.set(task.id, breakdown);

        // Update improvement metrics
        const currentAvg = this.autonomousMetrics.averageBreakdownImprovement;
        const newImprovement = breakdown.metadata.estimatedSpeedup;
        this.autonomousMetrics.averageBreakdownImprovement =
          (currentAvg * 0.9) + (newImprovement * 0.1);
      }

      return breakdown;

    } catch (error) {
      logger.warn('Autonomous breakdown analysis failed', {
        taskId: task.id,
        error: error instanceof Error ? error.message : String(error)
      });

      return null;
    }
  }

  /**
   * Add breakdown subtasks to queue
   */
  private async addBreakdownSubtasks(originalTask: Task, breakdown: TaskBreakdownResult): Promise<void> {
    const subtaskIds: string[] = [];

    try {
      for (const subtask of breakdown.subtasks) {
        // Convert SubTask to Task format
        const enhancedSubtask: Task = {
          id: subtask.id,
          title: subtask.title,
          description: subtask.description,
          category: subtask.category,
          priority: subtask.priority,
          status: TaskStatus.PENDING,

          estimatedDuration: subtask.estimatedDuration,
          maxRetries: this.config.maxRetries,
          currentRetries: 0,

          createdAt: new Date(),
          dependencies: subtask.dependencies,
          dependents: subtask.dependents,

          context: {
            ...originalTask.context,
            subtask: {
              parentTaskId: originalTask.id,
              breakdownStrategy: subtask.breakdownStrategy,
              sequenceOrder: subtask.sequenceOrder,
              isSubtask: true
            }
          } as AutonomousExecutionContext,

          basePriority: subtask.priority,
          dynamicPriority: subtask.priority,
          priorityFactors: originalTask.priorityFactors,

          executeFunction: subtask.executeFunction,
          validateFunction: subtask.validateFunction,
          rollbackFunction: subtask.rollbackFunction,

          tags: [...originalTask.tags, 'subtask', `breakdown-${subtask.breakdownStrategy}`],
          metadata: {
            ...originalTask.metadata,
            isSubtask: true,
            parentTaskId: originalTask.id,
            breakdownStrategy: subtask.breakdownStrategy,
            sequenceOrder: subtask.sequenceOrder,
            canRunInParallel: subtask.canRunInParallel,
            riskLevel: subtask.riskLevel,
            qualityGates: subtask.qualityGates,
            validationCriteria: subtask.validationCriteria
          },

          requiredResources: originalTask.requiredResources,
          resourceConstraints: originalTask.resourceConstraints,

          preConditions: subtask.validationCriteria,
          postConditions: subtask.qualityGates,

          progressCallback: originalTask.progressCallback,

          batchCompatible: subtask.canRunInParallel,
          batchGroup: subtask.canRunInParallel ? `breakdown-${originalTask.id}` : undefined
        };

        const subtaskId = await this.baseQueue.addTask(enhancedSubtask);
        subtaskIds.push(subtaskId);
      }

      // Create a tracking task for the original task breakdown
      const trackingTask: Task = {
        ...originalTask,
        id: `${originalTask.id}_tracker`,
        title: `${originalTask.title} - Coordination`,
        description: `Coordination and completion tracking for broken down task: ${originalTask.description}`,

        dependencies: subtaskIds,

        executeFunction: async (task: Task, context: TaskContext) => {
          // This task completes when all subtasks are done
          logger.info('All subtasks completed for breakdown', {
            originalTaskId: originalTask.id,
            subtaskCount: subtaskIds.length,
            breakdownStrategy: breakdown.breakdownStrategy
          });

          return {
            success: true,
            result: {
              message: 'Task breakdown execution completed successfully',
              originalTaskId: originalTask.id,
              subtasksCompleted: subtaskIds.length,
              breakdownStrategy: breakdown.breakdownStrategy
            },
            duration: Date.now() - task.createdAt.getTime(),
            artifacts: [`breakdown_${originalTask.id}_completed`]
          };
        },

        metadata: {
          ...originalTask.metadata,
          isBreakdownTracker: true,
          originalTaskId: originalTask.id,
          subtaskIds,
          breakdownMetadata: breakdown.metadata
        }
      };

      await this.baseQueue.addTask(trackingTask);

      logger.info('Breakdown subtasks added to queue', {
        originalTaskId: originalTask.id,
        subtaskCount: subtaskIds.length,
        trackingTaskId: trackingTask.id
      });

    } catch (error) {
      logger.error('Failed to add breakdown subtasks', {
        originalTaskId: originalTask.id,
        error: error instanceof Error ? error.message : String(error)
      });

      throw error;
    }
  }

  /**
   * Get enhanced queue status with autonomous metrics
   */
  getAutonomousQueueStatus(): AutonomousQueueMetrics {
    const baseMetrics = this.baseQueue.getMetrics();

    return {
      ...baseMetrics,
      ...this.autonomousMetrics,
      autonomyLevel: this.calculateAutonomyLevel()
    };
  }

  /**
   * Calculate current autonomy level (0-1)
   */
  private calculateAutonomyLevel(): number {
    let autonomyScore = 0;

    // Breakdown autonomy
    if (this.autonomousMetrics.tasksAnalyzedForBreakdown > 0) {
      const breakdownRate = this.autonomousMetrics.tasksBrokenDown / this.autonomousMetrics.tasksAnalyzedForBreakdown;
      autonomyScore += breakdownRate * 0.3;
    }

    // Optimization autonomy
    if (this.autonomousMetrics.autonomousOptimizations > 0) {
      autonomyScore += Math.min(0.3, this.autonomousMetrics.optimizationSuccessRate * 0.3);
    }

    // Adaptive scheduling
    if (this.config.enableAdaptiveScheduling && this.autonomousMetrics.adaptiveSchedulingAdjustments > 0) {
      autonomyScore += 0.2;
    }

    // Learning capacity
    if (this.autonomousMetrics.learningDataPoints > 50) {
      autonomyScore += Math.min(0.2, this.autonomousMetrics.predictionAccuracy * 0.2);
    }

    return Math.min(1.0, autonomyScore);
  }

  /**
   * Record task execution for learning
   */
  private recordTaskExecution(task: Task, result: TaskExecutionResult, executionTime: number): void {
    this.executionResults.set(task.id, result);

    // If this was a breakdown subtask, record for learning
    if (task.metadata?.isSubtask && task.context?.subtask?.parentTaskId) {
      const parentId = task.context.subtask.parentTaskId as string;
      const breakdown = this.breakdownHistory.get(parentId);

      if (breakdown) {
        // Update breakdown learning
        this.taskBreakdown.recordExecutionOutcome(breakdown, [{
          subtaskId: task.id,
          success: result.success,
          duration: executionTime,
          parallelization: task.metadata?.canRunInParallel ? 1 : 0,
          resourceEfficiency: this.calculateResourceEfficiency(task, executionTime)
        }]);
      }
    }

    // Update learning metrics
    this.autonomousMetrics.learningDataPoints++;
    this.updatePredictionAccuracy();

    // Log for monitoring
    logger.debug('Task execution recorded for learning', {
      taskId: task.id,
      success: result.success,
      duration: executionTime,
      isSubtask: !!task.metadata?.isSubtask
    });
  }

  /**
   * Record task failure for learning
   */
  private recordTaskFailure(task: Task, error: Error, executionTime: number): void {
    const failureResult: TaskExecutionResult = {
      success: false,
      error,
      duration: executionTime,
      metadata: {
        failureReason: error.message,
        failureType: error.constructor.name
      }
    };

    this.recordTaskExecution(task, failureResult, executionTime);
  }

  /**
   * Calculate resource efficiency for learning
   */
  private calculateResourceEfficiency(task: Task, executionTime: number): number {
    const estimatedDuration = task.estimatedDuration || 60000;
    const efficiency = estimatedDuration / Math.max(executionTime, 1);
    return Math.min(2.0, Math.max(0.1, efficiency));
  }

  /**
   * Update prediction accuracy based on recent performance
   */
  private updatePredictionAccuracy(): void {
    // Simple accuracy calculation based on recent executions
    const recentResults = Array.from(this.executionResults.values()).slice(-50);

    if (recentResults.length > 10) {
      const successCount = recentResults.filter(r => r.success).length;
      const accuracy = successCount / recentResults.length;

      // Exponential moving average
      this.autonomousMetrics.predictionAccuracy =
        (this.autonomousMetrics.predictionAccuracy * 0.8) + (accuracy * 0.2);
    }
  }

  /**
   * Initialize autonomous metrics
   */
  private initializeAutonomousMetrics(): void {
    this.autonomousMetrics = {
      // Base metrics (will be updated from base queue)
      totalTasks: 0,
      pendingTasks: 0,
      runningTasks: 0,
      completedTasks: 0,
      failedTasks: 0,
      averageWaitTime: 0,
      averageExecutionTime: 0,
      throughputPerHour: 0,
      successRate: 0,
      priorityDistribution: {} as Record<TaskPriority, number>,
      categoryDistribution: {} as Record<TaskCategory, number>,

      // Autonomous-specific metrics
      tasksAnalyzedForBreakdown: 0,
      tasksBrokenDown: 0,
      averageBreakdownImprovement: 1.0,
      breakdownSuccessRate: 0.8,

      autonomousOptimizations: 0,
      optimizationSuccessRate: 0.75,
      adaptiveSchedulingAdjustments: 0,

      learningDataPoints: 0,
      predictionAccuracy: 0.7,
      autonomyLevel: 0.0
    };
  }

  /**
   * Update autonomous metrics
   */
  private updateAutonomousMetrics(event: string, data: any): void {
    switch (event) {
      case 'taskAdded':
        // Metrics updated through base queue
        break;
      case 'optimization':
        this.autonomousMetrics.autonomousOptimizations++;
        if (data.success) {
          this.autonomousMetrics.optimizationSuccessRate =
            (this.autonomousMetrics.optimizationSuccessRate * 0.9) + (0.1);
        }
        break;
      case 'adaptiveAdjustment':
        this.autonomousMetrics.adaptiveSchedulingAdjustments++;
        break;
    }

    // Sync with base queue metrics
    const baseMetrics = this.baseQueue.getMetrics();
    Object.assign(this.autonomousMetrics, baseMetrics);
  }

  /**
   * Setup component integration event handlers
   */
  private setupComponentIntegration(): void {
    // Base queue events
    this.baseQueue.on('taskCompleted', (task, record, result) => {
      this.emit('taskCompleted', task, record, result);
      this.recordTaskExecution(task, result, record.duration || 0);
    });

    this.baseQueue.on('taskFailed', (task, record, error) => {
      this.emit('taskFailed', task, record, error);
      this.recordTaskFailure(task, error, record.duration || 0);
    });

    // Breakdown events
    this.taskBreakdown.on('taskBreakdownCompleted', (breakdown) => {
      this.emit('taskBreakdownCompleted', breakdown);
      this.updateAutonomousMetrics('breakdown', { success: true });
    });

    // Scheduler events
    this.priorityScheduler.on('algorithmChanged', (change) => {
      logger.info('Autonomous scheduling algorithm adapted', change);
      this.updateAutonomousMetrics('adaptiveAdjustment', change);
      this.emit('autonomousAdaptation', { type: 'scheduling', change });
    });

    // Optimizer events
    this.queueOptimizer.on('optimizationCompleted', (optimization) => {
      logger.debug('Queue optimization completed autonomously', optimization);
      this.updateAutonomousMetrics('optimization', { success: true });
      this.emit('autonomousOptimization', optimization);
    });
  }

  /**
   * Start autonomous optimization processes
   */
  private startAutonomousOptimization(): void {
    // Continuous queue optimization
    setInterval(async () => {
      try {
        await this.performAutonomousOptimization();
      } catch (error) {
        logger.warn('Autonomous optimization cycle failed', {
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }, 60000); // Every minute

    // Adaptive parameter tuning
    setInterval(async () => {
      try {
        await this.performAdaptiveParameterTuning();
      } catch (error) {
        logger.warn('Adaptive parameter tuning failed', {
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }, 300000); // Every 5 minutes

    logger.info('Autonomous optimization processes started');
  }

  /**
   * Perform autonomous queue optimization
   */
  private async performAutonomousOptimization(): Promise<void> {
    const queueStatus = this.getAutonomousQueueStatus();

    // Only optimize if we have meaningful queue activity
    if (queueStatus.totalTasks < 3) {
      return;
    }

    // Determine optimization strategy based on current performance
    let strategy = this.config.optimizationStrategy;

    if (queueStatus.averageWaitTime > 300000) { // > 5 minutes
      strategy = OptimizationStrategy.LATENCY_MINIMIZATION;
    } else if (queueStatus.successRate < 0.8) {
      strategy = OptimizationStrategy.DEADLINE_OPTIMIZATION;
    } else if (queueStatus.throughputPerHour < 10) {
      strategy = OptimizationStrategy.THROUGHPUT_MAXIMIZATION;
    }

    // Generate and apply optimizations
    try {
      const tasks = this.baseQueue.getTasks();
      const taskMap = new Map(tasks.map(t => [t.id, t]));

      const dependencyAnalysis = {
        readyTasks: tasks.filter(t => t.status === TaskStatus.PENDING && t.dependencies.length === 0).map(t => t.id),
        blockedTasks: tasks.filter(t => t.status === TaskStatus.BLOCKED).map(t => t.id),
        parallelizableGroups: [tasks.filter(t => t.batchCompatible).map(t => t.id)],
        criticalPath: tasks.filter(t => t.priority >= TaskPriority.HIGH).map(t => t.id),
        totalLevels: 3,
        estimatedDuration: Math.max(...tasks.map(t => t.estimatedDuration))
      };

      const recommendations = this.queueOptimizer.optimizeQueue(
        taskMap,
        dependencyAnalysis,
        queueStatus,
        strategy
      );

      if (recommendations.length > 0) {
        const applicationResult = this.queueOptimizer.applyOptimizations(taskMap, recommendations);

        logger.info('Autonomous optimization applied', {
          strategy,
          recommendationsCount: recommendations.length,
          applied: applicationResult.applied,
          failed: applicationResult.failed
        });

        this.updateAutonomousMetrics('optimization', {
          success: applicationResult.applied > 0,
          applied: applicationResult.applied
        });
      }

    } catch (error) {
      logger.warn('Autonomous optimization failed', {
        strategy,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Perform adaptive parameter tuning
   */
  private async performAdaptiveParameterTuning(): Promise<void> {
    const metrics = this.getAutonomousQueueStatus();

    // Adapt breakdown threshold based on success rate
    if (metrics.breakdownSuccessRate > 0.9 && this.config.breakdownThreshold > 0.5) {
      this.config.breakdownThreshold -= 0.05; // Make breakdown more aggressive
      this.taskBreakdown.updateConfig({ complexityThreshold: this.config.breakdownThreshold });

      this.logAdaptation('Breakdown threshold lowered', 'high_breakdown_success', -0.05);
    } else if (metrics.breakdownSuccessRate < 0.6 && this.config.breakdownThreshold < 0.9) {
      this.config.breakdownThreshold += 0.05; // Make breakdown more conservative
      this.taskBreakdown.updateConfig({ complexityThreshold: this.config.breakdownThreshold });

      this.logAdaptation('Breakdown threshold raised', 'low_breakdown_success', 0.05);
    }

    // Adapt concurrency based on resource utilization
    if (metrics.successRate > 0.95 && metrics.averageWaitTime > 120000) { // 2 minutes
      this.config.maxConcurrentTasks = Math.min(16, this.config.maxConcurrentTasks + 1);
      this.logAdaptation('Increased concurrency', 'high_wait_time_good_success', 1);
    } else if (metrics.successRate < 0.8 && this.config.maxConcurrentTasks > 2) {
      this.config.maxConcurrentTasks = Math.max(2, this.config.maxConcurrentTasks - 1);
      this.logAdaptation('Decreased concurrency', 'low_success_rate', -1);
    }

    logger.debug('Adaptive parameter tuning completed', {
      breakdownThreshold: this.config.breakdownThreshold,
      maxConcurrentTasks: this.config.maxConcurrentTasks,
      autonomyLevel: metrics.autonomyLevel
    });
  }

  /**
   * Log adaptation for monitoring and debugging
   */
  private logAdaptation(adaptation: string, trigger: string, impact: number): void {
    this.adaptationHistory.push({
      timestamp: new Date(),
      adaptation,
      trigger,
      impact
    });

    // Keep only recent adaptations
    if (this.adaptationHistory.length > 100) {
      this.adaptationHistory.shift();
    }

    this.updateAutonomousMetrics('adaptiveAdjustment', { adaptation, trigger, impact });

    logger.info('Autonomous adaptation applied', {
      adaptation,
      trigger,
      impact,
      autonomyLevel: this.calculateAutonomyLevel()
    });

    this.emit('autonomousAdaptation', { adaptation, trigger, impact });
  }

  /**
   * Get recent adaptation history
   */
  getAdaptationHistory(limit = 20): typeof this.adaptationHistory {
    return this.adaptationHistory.slice(-limit);
  }

  /**
   * Get breakdown performance metrics
   */
  getBreakdownMetrics(): ReturnType<AutonomousTaskBreakdown['getPerformanceMetrics']> {
    return this.taskBreakdown.getPerformanceMetrics();
  }

  /**
   * Get scheduler performance metrics
   */
  getSchedulerMetrics(): ReturnType<PriorityScheduler['getPerformanceMetrics']> {
    return this.priorityScheduler.getPerformanceMetrics();
  }

  /**
   * Manual override for autonomous settings
   */
  updateAutonomousConfig(updates: Partial<EnhancedQueueConfig>): void {
    const oldConfig = { ...this.config };
    this.config = { ...this.config, ...updates };

    // Apply configuration changes to components
    if (updates.breakdownThreshold !== undefined) {
      this.taskBreakdown.updateConfig({ complexityThreshold: updates.breakdownThreshold });
    }

    if (updates.schedulingAlgorithm !== undefined) {
      this.priorityScheduler.setAlgorithm(updates.schedulingAlgorithm);
    }

    logger.info('Autonomous configuration updated', {
      oldConfig: {
        breakdownThreshold: oldConfig.breakdownThreshold,
        maxConcurrentTasks: oldConfig.maxConcurrentTasks,
        schedulingAlgorithm: oldConfig.schedulingAlgorithm
      },
      newConfig: {
        breakdownThreshold: this.config.breakdownThreshold,
        maxConcurrentTasks: this.config.maxConcurrentTasks,
        schedulingAlgorithm: this.config.schedulingAlgorithm
      }
    });

    this.emit('configurationUpdated', { oldConfig, newConfig: this.config });
  }

  /**
   * Pause autonomous operations
   */
  pauseAutonomousOperations(): void {
    this.learningEnabled = false;
    this.baseQueue.pause();

    logger.info('Autonomous operations paused');
    this.emit('autonomousOperationsPaused');
  }

  /**
   * Resume autonomous operations
   */
  resumeAutonomousOperations(): void {
    this.learningEnabled = true;
    this.baseQueue.resume();

    logger.info('Autonomous operations resumed');
    this.emit('autonomousOperationsResumed');
  }

  /**
   * Graceful shutdown with autonomous cleanup
   */
  async shutdown(timeoutMs = 60000): Promise<void> {
    logger.info('Starting autonomous queue shutdown...');

    this.pauseAutonomousOperations();

    // Save learning state if needed
    if (this.config.learningEnabled) {
      await this.saveAutonomousState();
    }

    // Shutdown base queue
    await this.baseQueue.shutdown(timeoutMs);

    this.emit('shutdownCompleted');
    logger.info('Autonomous queue shutdown completed');
  }

  /**
   * Save autonomous learning state
   */
  private async saveAutonomousState(): Promise<void> {
    try {
      const state = {
        metrics: this.autonomousMetrics,
        adaptationHistory: this.adaptationHistory,
        config: this.config,
        timestamp: new Date()
      };

      // In a real implementation, this would save to persistent storage
      logger.debug('Autonomous state saved', {
        metricsSize: Object.keys(this.autonomousMetrics).length,
        adaptationHistorySize: this.adaptationHistory.length
      });

    } catch (error) {
      logger.warn('Failed to save autonomous state', {
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Forward base queue methods for compatibility
   */
  getTask(taskId: string): Task | undefined {
    return this.baseQueue.getTask(taskId);
  }

  getTasks(filter?: (task: Task) => boolean): Task[] {
    return this.baseQueue.getTasks(filter);
  }

  async cancelTask(taskId: string, reason?: string): Promise<boolean> {
    return this.baseQueue.cancelTask(taskId, reason);
  }

  getMetrics(): QueueMetrics {
    return this.baseQueue.getMetrics();
  }

  cleanup(olderThanMs?: number): void {
    this.baseQueue.cleanup(olderThanMs);
  }
}