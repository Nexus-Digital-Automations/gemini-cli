/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type {
  TaskId,
  Task,
  TaskStatus,
  TaskResult,
  ExecutionPlan,
  TaskQueueConfig,
  ResourceAllocation,
} from './types.js';
import { DependencyManager } from './dependency-manager.js';
import { getComponentLogger } from '../utils/logger.js';
import type {
  ToolCall,
  CompletedToolCall,
  CoreToolScheduler,
  OutputUpdateHandler,
  AllToolCallsCompleteHandler,
  ToolCallsUpdateHandler,
} from '../core/coreToolScheduler.js';

const logger = getComponentLogger('IntelligentTaskQueue');

/**
 * Task execution context with enhanced metadata
 */
interface TaskExecutionContext {
  taskId: TaskId;
  task: Task;
  startTime: Date;
  resourceAllocation?: ResourceAllocation;
  dependencies: TaskId[];
  dependents: TaskId[];
  retryCount: number;
}

/**
 * Queue events for monitoring and integration
 */
export interface TaskQueueEvents {
  'task-queued': { task: Task };
  'task-started': { taskId: TaskId; context: TaskExecutionContext };
  'task-completed': { taskId: TaskId; result: TaskResult };
  'task-failed': { taskId: TaskId; error: Error; retryScheduled: boolean };
  'queue-drained': { processedCount: number };
  'dependency-blocked': { taskId: TaskId; blockedBy: TaskId[] };
  'resource-constraint': { taskId: TaskId; constrainedBy: string[] };
}

/**
 * Enhanced task queue with dependency-aware execution and resource management
 */
export class IntelligentTaskQueue {
  private dependencyManager: DependencyManager;
  private coreScheduler: CoreToolScheduler;
  private config: TaskQueueConfig;
  private executionQueue: Map<TaskId, TaskExecutionContext>;
  private activeExecutions: Map<TaskId, TaskExecutionContext>;
  private completedTasks: Map<TaskId, TaskResult>;
  private resourceAllocations: Map<string, number>;
  private currentExecutionPlan?: ExecutionPlan;
  private isProcessing: boolean = false;
  private processingPromise?: Promise<void>;

  constructor(
    coreScheduler: CoreToolScheduler,
    config: TaskQueueConfig,
    dependencyManager?: DependencyManager,
  ) {
    this.coreScheduler = coreScheduler;
    this.config = config;
    this.executionQueue = new Map();
    this.activeExecutions = new Map();
    this.completedTasks = new Map();
    this.resourceAllocations = new Map();

    // Initialize resource allocations
    for (const [resourceType, capacity] of config.resourcePools) {
      this.resourceAllocations.set(resourceType, 0);
    }

    // Initialize dependency manager if not provided
    this.dependencyManager = dependencyManager || new DependencyManager(config);

    logger.info('Intelligent task queue initialized', {
      maxConcurrentTasks: config.maxConcurrentTasks,
      resourcePools: Object.fromEntries(config.resourcePools),
      schedulingAlgorithm: config.schedulingAlgorithm,
    });
  }

  /**
   * Add a task to the queue with intelligent scheduling
   */
  async addTask(task: Task): Promise<void> {
    logger.debug('Adding task to intelligent queue', {
      taskId: task.id,
      title: task.title,
      priority: task.priority,
      category: task.category,
    });

    // Add to dependency manager
    this.dependencyManager.addTask(task);

    // Create execution context
    const dependencies = this.dependencyManager.getTaskDependencies(task.id);
    const dependents = this.dependencyManager.getTaskDependents(task.id);

    const context: TaskExecutionContext = {
      taskId: task.id,
      task: { ...task, status: 'pending' },
      startTime: new Date(),
      dependencies: dependencies.map((dep) => dep.dependsOnTaskId),
      dependents,
      retryCount: 0,
    };

    this.executionQueue.set(task.id, context);

    // Trigger intelligent queue processing
    this.scheduleQueueProcessing();
  }

  /**
   * Remove a task from the queue
   */
  async removeTask(taskId: TaskId): Promise<void> {
    logger.debug('Removing task from intelligent queue', { taskId });

    // Remove from dependency manager
    this.dependencyManager.removeTask(taskId);

    // Remove from queue
    this.executionQueue.delete(taskId);

    // If actively executing, this would need cancellation logic
    if (this.activeExecutions.has(taskId)) {
      logger.warn('Attempted to remove actively executing task', { taskId });
      // In a real implementation, we'd need to cancel the executing task
    }
  }

  /**
   * Get task status and execution information
   */
  getTaskStatus(taskId: TaskId): {
    status: TaskStatus;
    queuePosition?: number;
    dependencies?: TaskId[];
    blockedBy?: TaskId[];
    estimatedStartTime?: Date;
  } {
    // Check if completed
    const completedResult = this.completedTasks.get(taskId);
    if (completedResult) {
      return {
        status: completedResult.success ? 'completed' : 'failed',
      };
    }

    // Check if actively executing
    const activeContext = this.activeExecutions.get(taskId);
    if (activeContext) {
      return {
        status: 'in_progress',
        dependencies: activeContext.dependencies,
      };
    }

    // Check if in queue
    const queueContext = this.executionQueue.get(taskId);
    if (queueContext) {
      const blockedBy = this.getBlockingDependencies(taskId);
      const status: TaskStatus = blockedBy.length > 0 ? 'blocked' : 'ready';

      return {
        status,
        dependencies: queueContext.dependencies,
        blockedBy: blockedBy.length > 0 ? blockedBy : undefined,
        estimatedStartTime: this.estimateTaskStartTime(taskId),
      };
    }

    return { status: 'pending' };
  }

  /**
   * Get comprehensive queue status
   */
  getQueueStatus(): {
    totalTasks: number;
    pendingTasks: number;
    activeTasks: number;
    completedTasks: number;
    failedTasks: number;
    blockedTasks: number;
    resourceUtilization: Record<string, { used: number; total: number }>;
    currentExecutionPlan?: ExecutionPlan;
  } {
    const failedTasks = Array.from(this.completedTasks.values()).filter(
      (result) => !result.success,
    ).length;
    const successfulTasks = Array.from(this.completedTasks.values()).filter(
      (result) => result.success,
    ).length;
    const blockedTasks = Array.from(this.executionQueue.values()).filter(
      (context) => this.getBlockingDependencies(context.taskId).length > 0,
    ).length;

    const resourceUtilization: Record<string, { used: number; total: number }> =
      {};
    for (const [resourceType, capacity] of this.config.resourcePools) {
      resourceUtilization[resourceType] = {
        used: this.resourceAllocations.get(resourceType) || 0,
        total: capacity,
      };
    }

    return {
      totalTasks:
        this.executionQueue.size +
        this.activeExecutions.size +
        this.completedTasks.size,
      pendingTasks: this.executionQueue.size,
      activeTasks: this.activeExecutions.size,
      completedTasks: successfulTasks,
      failedTasks,
      blockedTasks,
      resourceUtilization,
      currentExecutionPlan: this.currentExecutionPlan,
    };
  }

  /**
   * Schedule intelligent queue processing
   */
  private async scheduleQueueProcessing(): Promise<void> {
    if (this.isProcessing) {
      return; // Already processing
    }

    this.isProcessing = true;
    this.processingPromise = this.processQueue();

    try {
      await this.processingPromise;
    } catch (error) {
      logger.error('Queue processing failed', {
        error: error instanceof Error ? error.message : String(error),
      });
    } finally {
      this.isProcessing = false;
      this.processingPromise = undefined;
    }
  }

  /**
   * Main queue processing loop with intelligent scheduling
   */
  private async processQueue(): Promise<void> {
    logger.debug('Starting intelligent queue processing');

    while (this.executionQueue.size > 0 || this.activeExecutions.size > 0) {
      // Generate fresh execution plan
      const queuedTaskIds = Array.from(this.executionQueue.keys());
      if (queuedTaskIds.length > 0) {
        this.currentExecutionPlan =
          this.dependencyManager.generateExecutionPlan(queuedTaskIds);
        logger.debug('Generated new execution plan', {
          sequenceLength: this.currentExecutionPlan.sequence.sequence.length,
          parallelGroups:
            this.currentExecutionPlan.sequence.parallelGroups.length,
          criticalPathLength:
            this.currentExecutionPlan.sequence.criticalPath.length,
        });
      }

      // Execute ready tasks based on the execution plan
      const executedCount = await this.executeReadyTasks();

      // If no tasks were executed and we have queued tasks, wait briefly
      if (executedCount === 0 && this.executionQueue.size > 0) {
        logger.debug('No tasks ready for execution, waiting');
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      // If no queued tasks and no active executions, we're done
      if (this.executionQueue.size === 0 && this.activeExecutions.size === 0) {
        break;
      }
    }

    logger.debug('Queue processing completed');
  }

  /**
   * Execute tasks that are ready based on dependencies and resources
   */
  private async executeReadyTasks(): Promise<number> {
    if (!this.currentExecutionPlan) {
      return 0;
    }

    let executedCount = 0;
    const maxConcurrent = this.config.maxConcurrentTasks;

    // Process parallel groups from the execution plan
    for (const group of this.currentExecutionPlan.sequence.parallelGroups) {
      if (this.activeExecutions.size >= maxConcurrent) {
        break; // Reached concurrency limit
      }

      const readyTasks = group.filter(
        (taskId) => this.executionQueue.has(taskId) && this.isTaskReady(taskId),
      );

      for (const taskId of readyTasks) {
        if (this.activeExecutions.size >= maxConcurrent) {
          break;
        }

        const context = this.executionQueue.get(taskId);
        if (!context) continue;

        // Check resource availability
        if (!this.areResourcesAvailable(context.task)) {
          logger.debug('Task waiting for resources', {
            taskId,
            task: context.task.title,
          });
          continue;
        }

        // Start task execution
        await this.startTaskExecution(context);
        executedCount++;
      }

      // If we started any tasks in this group, wait for at least one to complete
      // before starting the next group (for proper dependency ordering)
      if (executedCount > 0 && this.activeExecutions.size > 0) {
        break;
      }
    }

    return executedCount;
  }

  /**
   * Check if a task is ready for execution (all dependencies satisfied)
   */
  private isTaskReady(taskId: TaskId): boolean {
    const context = this.executionQueue.get(taskId);
    if (!context) return false;

    // Check if all dependencies are completed
    for (const dependencyId of context.dependencies) {
      const dependencyResult = this.completedTasks.get(dependencyId);
      if (!dependencyResult || !dependencyResult.success) {
        return false; // Dependency not completed or failed
      }
    }

    return true;
  }

  /**
   * Get tasks that are blocking a specific task
   */
  private getBlockingDependencies(taskId: TaskId): TaskId[] {
    const context = this.executionQueue.get(taskId);
    if (!context) return [];

    const blocking: TaskId[] = [];
    for (const dependencyId of context.dependencies) {
      const dependencyResult = this.completedTasks.get(dependencyId);
      if (!dependencyResult || !dependencyResult.success) {
        blocking.push(dependencyId);
      }
    }

    return blocking;
  }

  /**
   * Check if required resources are available for a task
   */
  private areResourcesAvailable(task: Task): boolean {
    if (!task.executionContext?.resourceConstraints) {
      return true; // No specific resource requirements
    }

    for (const constraint of task.executionContext.resourceConstraints) {
      const totalCapacity =
        this.config.resourcePools.get(constraint.resourceType) || 0;
      const currentUsage =
        this.resourceAllocations.get(constraint.resourceType) || 0;

      if (currentUsage + constraint.maxUnits > totalCapacity) {
        return false; // Insufficient resources
      }
    }

    return true;
  }

  /**
   * Start execution of a task
   */
  private async startTaskExecution(
    context: TaskExecutionContext,
  ): Promise<void> {
    logger.debug('Starting task execution', {
      taskId: context.taskId,
      title: context.task.title,
      dependencies: context.dependencies,
    });

    // Allocate resources
    this.allocateResources(context.task);

    // Move from queue to active executions
    this.executionQueue.delete(context.taskId);
    context.startTime = new Date();
    context.task.status = 'in_progress';
    this.activeExecutions.set(context.taskId, context);

    // Convert task to tool call format for core scheduler
    // This is a simplified conversion - in practice, you'd need more sophisticated mapping
    const toolCallRequest = this.taskToToolCallRequest(context.task);

    try {
      // Use core tool scheduler to execute the task
      // Note: This is a simplified integration - the actual integration would be more complex
      const signal = new AbortController().signal;
      await this.coreScheduler.schedule(toolCallRequest, signal);

      // Handle completion (this would typically be done via callbacks)
      await this.handleTaskCompletion(context, { success: true });
    } catch (error) {
      await this.handleTaskFailure(
        context,
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }

  /**
   * Convert a Task to ToolCallRequest format (simplified conversion)
   */
  private taskToToolCallRequest(task: Task): any {
    // This is a simplified conversion - in practice, you'd need more sophisticated mapping
    // based on the task category and parameters
    return {
      callId: `task-${task.id}`,
      name: this.getToolNameForTask(task),
      args: task.parameters || {},
      prompt_id: task.id,
    };
  }

  /**
   * Get appropriate tool name for a task category
   */
  private getToolNameForTask(task: Task): string {
    const toolMapping = {
      implementation: 'write_file',
      testing: 'shell',
      documentation: 'write_file',
      analysis: 'read_file',
      refactoring: 'edit',
      deployment: 'shell',
    };

    return toolMapping[task.category] || 'shell';
  }

  /**
   * Allocate resources for a task
   */
  private allocateResources(task: Task): void {
    if (task.executionContext?.resourceConstraints) {
      for (const constraint of task.executionContext.resourceConstraints) {
        const currentUsage =
          this.resourceAllocations.get(constraint.resourceType) || 0;
        this.resourceAllocations.set(
          constraint.resourceType,
          currentUsage + constraint.maxUnits,
        );
      }

      logger.debug('Resources allocated for task', {
        taskId: task.id,
        allocations: Object.fromEntries(this.resourceAllocations),
      });
    }
  }

  /**
   * Release resources for a task
   */
  private releaseResources(task: Task): void {
    if (task.executionContext?.resourceConstraints) {
      for (const constraint of task.executionContext.resourceConstraints) {
        const currentUsage =
          this.resourceAllocations.get(constraint.resourceType) || 0;
        this.resourceAllocations.set(
          constraint.resourceType,
          Math.max(0, currentUsage - constraint.maxUnits),
        );
      }

      logger.debug('Resources released for task', {
        taskId: task.id,
        allocations: Object.fromEntries(this.resourceAllocations),
      });
    }
  }

  /**
   * Handle successful task completion
   */
  private async handleTaskCompletion(
    context: TaskExecutionContext,
    result: { success: boolean; output?: any },
  ): Promise<void> {
    const endTime = new Date();
    const duration = endTime.getTime() - context.startTime.getTime();

    const taskResult: TaskResult = {
      taskId: context.taskId,
      success: result.success,
      output: result.output,
      metrics: {
        startTime: context.startTime,
        endTime,
        duration,
      },
    };

    // Record completion
    this.completedTasks.set(context.taskId, taskResult);
    this.activeExecutions.delete(context.taskId);

    // Release resources
    this.releaseResources(context.task);

    // Record execution for learning
    this.dependencyManager.recordTaskExecution(
      context.taskId,
      context.startTime,
      endTime,
      result.success,
    );

    logger.info('Task completed successfully', {
      taskId: context.taskId,
      title: context.task.title,
      duration,
      dependents: context.dependents.length,
    });

    // Continue processing queue (dependencies might now be satisfied)
    this.scheduleQueueProcessing();
  }

  /**
   * Handle task execution failure
   */
  private async handleTaskFailure(
    context: TaskExecutionContext,
    error: Error,
  ): Promise<void> {
    logger.warn('Task execution failed', {
      taskId: context.taskId,
      title: context.task.title,
      error: error.message,
      retryCount: context.retryCount,
    });

    // Check if we should retry
    const maxRetries =
      context.task.executionContext?.maxRetries ||
      this.config.defaultMaxRetries;
    const shouldRetry = context.retryCount < maxRetries;

    if (shouldRetry) {
      // Schedule retry
      context.retryCount++;
      context.task.status = 'pending';
      this.activeExecutions.delete(context.taskId);
      this.executionQueue.set(context.taskId, context);

      logger.info('Task scheduled for retry', {
        taskId: context.taskId,
        retryCount: context.retryCount,
        maxRetries,
      });
    } else {
      // Mark as failed
      const endTime = new Date();
      const taskResult: TaskResult = {
        taskId: context.taskId,
        success: false,
        error: {
          message: error.message,
          code: 'EXECUTION_FAILED',
          stack: error.stack,
        },
        metrics: {
          startTime: context.startTime,
          endTime,
          duration: endTime.getTime() - context.startTime.getTime(),
        },
      };

      this.completedTasks.set(context.taskId, taskResult);
      this.activeExecutions.delete(context.taskId);

      // Record failed execution for learning
      this.dependencyManager.recordTaskExecution(
        context.taskId,
        context.startTime,
        endTime,
        false,
      );

      logger.error('Task failed permanently', {
        taskId: context.taskId,
        title: context.task.title,
        finalError: error.message,
      });
    }

    // Release resources
    this.releaseResources(context.task);

    // Continue processing queue
    this.scheduleQueueProcessing();
  }

  /**
   * Estimate when a task will start executing
   */
  private estimateTaskStartTime(taskId: TaskId): Date {
    // This is a simplified estimation - in practice, you'd analyze the execution plan
    // and consider current resource utilization
    const now = new Date();
    const baseDelay = 60000; // 1 minute base delay

    // Add delay based on queue position and dependencies
    const queuePosition = Array.from(this.executionQueue.keys()).indexOf(
      taskId,
    );
    const dependencyDelay = this.getBlockingDependencies(taskId).length * 30000; // 30s per blocking dependency

    return new Date(
      now.getTime() + baseDelay + queuePosition * 10000 + dependencyDelay,
    );
  }

  /**
   * Get dependency manager instance
   */
  getDependencyManager(): DependencyManager {
    return this.dependencyManager;
  }

  /**
   * Wait for all tasks to complete
   */
  async waitForCompletion(): Promise<void> {
    while (
      this.executionQueue.size > 0 ||
      this.activeExecutions.size > 0 ||
      this.isProcessing
    ) {
      if (this.processingPromise) {
        await this.processingPromise;
      }
      // Small delay to prevent busy waiting
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  /**
   * Graceful shutdown of the task queue
   */
  async shutdown(): Promise<void> {
    logger.info('Shutting down intelligent task queue');

    // Wait for current processing to complete
    await this.waitForCompletion();

    // Clear all data structures
    this.executionQueue.clear();
    this.activeExecutions.clear();
    this.resourceAllocations.clear();

    logger.info('Task queue shutdown completed');
  }
}
