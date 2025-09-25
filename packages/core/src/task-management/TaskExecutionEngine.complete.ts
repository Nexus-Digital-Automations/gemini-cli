/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Config } from '../config/config.js';
import type { ToolRegistry } from '../tools/tool-registry.js';
import { SubAgentScope, ContextState, SubagentTerminateMode } from '../core/subagent.js';
import type {
  Task,
  TaskType,
  TaskComplexity,
  TaskStatus,
  TaskPriority,
  TaskExecutionContext,
  TaskDependency,
  AgentCapability,
  TaskMetrics
} from './TaskExecutionEngine.js';
import { TaskBreakdownAnalyzer } from './TaskExecutionEngine.js';
import { TaskExecutionUtils } from './TaskExecutionEngine.utils.js';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';

/**
 * Complete TaskExecutionEngine implementation with all utility methods
 */
export class TaskExecutionEngine {
  private readonly config: Config;
  private readonly toolRegistry: ToolRegistry;
  private readonly breakdownAnalyzer: TaskBreakdownAnalyzer;
  private readonly taskQueue: Map<string, Task> = new Map();
  private readonly runningTasks: Map<string, TaskExecutionContext> = new Map();
  private readonly completedTasks: Map<string, Task> = new Map();
  private readonly taskDependencies: Map<string, TaskDependency[]> = new Map();

  // Persistence
  private readonly persistencePath: string;

  // Event handlers
  private onTaskStatusChange?: (task: Task) => void;
  private onTaskComplete?: (task: Task) => void;
  private onTaskFailed?: (task: Task, error: string) => void;

  constructor(
    config: Config,
    handlers?: {
      onTaskStatusChange?: (task: Task) => void;
      onTaskComplete?: (task: Task) => void;
      onTaskFailed?: (task: Task, error: string) => void;
    }
  ) {
    this.config = config;
    this.toolRegistry = config.getToolRegistry();
    this.breakdownAnalyzer = new TaskBreakdownAnalyzer(config);
    this.persistencePath = path.join(config.storage.getProjectTempDir(), 'task-execution-state.json');

    // Set up event handlers
    this.onTaskStatusChange = handlers?.onTaskStatusChange;
    this.onTaskComplete = handlers?.onTaskComplete;
    this.onTaskFailed = handlers?.onTaskFailed;

    // Load persisted state
    this.loadPersistedState();
  }

  /**
   * Load persisted task state from disk
   */
  private async loadPersistedState(): Promise<void> {
    try {
      const data = await fs.readFile(this.persistencePath, 'utf-8');
      const state = JSON.parse(data);

      // Restore task queues
      for (const [id, taskData] of Object.entries(state.taskQueue || {})) {
        this.taskQueue.set(id, this.deserializeTask(taskData as any));
      }

      for (const [id, taskData] of Object.entries(state.completedTasks || {})) {
        this.completedTasks.set(id, this.deserializeTask(taskData as any));
      }

      // Restore dependencies
      for (const [id, deps] of Object.entries(state.taskDependencies || {})) {
        this.taskDependencies.set(id, deps as TaskDependency[]);
      }

      console.log(`Loaded ${this.taskQueue.size} queued tasks and ${this.completedTasks.size} completed tasks from persistence`);
    } catch (error) {
      // No persisted state or error loading - start fresh
      console.log('Starting with fresh task execution state');
    }
  }

  /**
   * Save current task state to disk
   */
  private async savePersistedState(): Promise<void> {
    try {
      const state = {
        taskQueue: Object.fromEntries(
          Array.from(this.taskQueue.entries()).map(([id, task]) => [id, this.serializeTask(task)])
        ),
        completedTasks: Object.fromEntries(
          Array.from(this.completedTasks.entries()).map(([id, task]) => [id, this.serializeTask(task)])
        ),
        taskDependencies: Object.fromEntries(this.taskDependencies.entries()),
        lastUpdated: new Date().toISOString()
      };

      await fs.writeFile(this.persistencePath, JSON.stringify(state, null, 2));
    } catch (error) {
      console.error('Error saving task execution state:', error);
    }
  }

  /**
   * Serialize task for persistence (convert dates to strings)
   */
  private serializeTask(task: Task): any {
    return {
      ...task,
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
      scheduledAt: task.scheduledAt?.toISOString(),
      startedAt: task.startedAt?.toISOString(),
      completedAt: task.completedAt?.toISOString(),
      metrics: task.metrics ? {
        ...task.metrics,
        startTime: task.metrics.startTime.toISOString(),
        endTime: task.metrics.endTime?.toISOString()
      } : undefined
    };
  }

  /**
   * Deserialize task from persistence (convert strings to dates)
   */
  private deserializeTask(data: any): Task {
    return {
      ...data,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt),
      scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : undefined,
      startedAt: data.startedAt ? new Date(data.startedAt) : undefined,
      completedAt: data.completedAt ? new Date(data.completedAt) : undefined,
      metrics: data.metrics ? {
        ...data.metrics,
        startTime: new Date(data.metrics.startTime),
        endTime: data.metrics.endTime ? new Date(data.metrics.endTime) : undefined
      } : undefined
    };
  }

  // Implement remaining core methods using utility functions

  /**
   * Checks if all dependencies for a task are satisfied
   */
  private areDependenciesSatisfied(taskId: string): boolean {
    return TaskExecutionUtils.areDependenciesSatisfied(
      taskId,
      this.taskQueue,
      this.completedTasks,
      this.taskDependencies
    );
  }

  /**
   * Gets the maximum number of concurrent tasks
   */
  private getMaxConcurrentTasks(): number {
    return TaskExecutionUtils.getMaxConcurrentTasks();
  }

  /**
   * Populates execution context for a task
   */
  private populateExecutionContext(task: Task, context: ContextState): void {
    TaskExecutionUtils.populateExecutionContext(task, context);
  }

  /**
   * Generates execution prompt for a task
   */
  private generateExecutionPrompt(task: Task): string {
    return TaskExecutionUtils.generateExecutionPrompt(task);
  }

  /**
   * Gets appropriate tools for a task
   */
  private getToolsForTask(task: Task): string[] {
    return TaskExecutionUtils.getToolsForTask(task);
  }

  /**
   * Gets dependency tasks for a given task ID
   */
  private getDependencyTasks(taskId: string): Task[] {
    return TaskExecutionUtils.getDependencyTasks(
      taskId,
      this.taskQueue,
      this.completedTasks,
      this.taskDependencies
    );
  }

  /**
   * Updates task progress based on message analysis
   */
  private updateTaskProgress(task: Task, message: string): void {
    TaskExecutionUtils.updateTaskProgress(task, message);
  }

  /**
   * Gets retry delay in milliseconds based on retry count
   */
  private getRetryDelayMs(retryCount: number): number {
    return TaskExecutionUtils.getRetryDelayMs(retryCount);
  }

  /**
   * Schedules dependent tasks after a task completes
   */
  private async scheduleDependentTasks(completedTaskId: string): Promise<void> {
    await TaskExecutionUtils.scheduleDependentTasks(
      completedTaskId,
      this.taskQueue,
      this.taskDependencies,
      this.scheduleTaskExecution.bind(this)
    );
  }

  /**
   * Handles dependent tasks when a parent task fails
   */
  private async handleDependentTasksOnFailure(failedTaskId: string): Promise<void> {
    await TaskExecutionUtils.handleDependentTasksOnFailure(
      failedTaskId,
      this.taskQueue,
      this.taskDependencies,
      this.updateTaskStatus.bind(this),
      this.handleTaskError.bind(this)
    );
  }

  /**
   * Handles task error with logging
   */
  private handleTaskError(task: Task, error: string): void {
    console.error(`Task ${task.id} error: ${error}`);
    this.onTaskFailed?.(task, error);
  }

  /**
   * Updates task status and triggers event handlers
   */
  private updateTaskStatus(task: Task, status: TaskStatus): void {
    const oldStatus = task.status;
    task.status = status;
    task.updatedAt = new Date();

    if (oldStatus !== status) {
      this.onTaskStatusChange?.(task);
    }

    // Persist state changes
    this.savePersistedState();
  }

  /**
   * Gets default execution time based on complexity
   */
  private getDefaultExecutionTime(complexity: TaskComplexity): number {
    switch (complexity) {
      case TaskComplexity.TRIVIAL: return 10;
      case TaskComplexity.SIMPLE: return 30;
      case TaskComplexity.MODERATE: return 60;
      case TaskComplexity.COMPLEX: return 120;
      case TaskComplexity.ENTERPRISE: return 300;
    }
  }

  // Public API methods

  /**
   * Queues a new task for execution with intelligent breakdown
   */
  async queueTask(
    title: string,
    description: string,
    options: Partial<{
      type: TaskType;
      priority: TaskPriority;
      expectedOutputs: Record<string, string>;
      context: Record<string, unknown>;
      maxExecutionTimeMinutes: number;
    }> = {}
  ): Promise<string> {
    // Create initial task
    const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();

    const complexity = await this.breakdownAnalyzer.analyzeComplexity(title, description);

    const task: Task = {
      id: taskId,
      title,
      description,
      type: options.type || TaskType.IMPLEMENTATION,
      complexity,
      priority: options.priority || TaskPriority.NORMAL,
      status: TaskStatus.QUEUED,
      progress: 0,
      requiredCapabilities: [], // Will be determined during breakdown
      subtaskIds: [],
      dependencies: [],
      maxExecutionTimeMinutes: options.maxExecutionTimeMinutes || this.getDefaultExecutionTime(complexity),
      maxRetries: 3,
      context: options.context || {},
      expectedOutputs: options.expectedOutputs || {},
      createdAt: now,
      updatedAt: now,
      retryCount: 0
    };

    this.taskQueue.set(taskId, task);
    this.updateTaskStatus(task, TaskStatus.QUEUED);

    // Trigger breakdown analysis in background
    this.analyzeAndBreakdownTask(taskId);

    return taskId;
  }

  /**
   * Analyzes and breaks down a task asynchronously
   */
  private async analyzeAndBreakdownTask(taskId: string): Promise<void> {
    const task = this.taskQueue.get(taskId);
    if (!task) return;

    try {
      this.updateTaskStatus(task, TaskStatus.ANALYZED);

      // Perform intelligent breakdown
      const breakdown = await this.breakdownAnalyzer.breakdownTask(task);

      // Create subtasks
      for (const subtask of breakdown.subtasks) {
        subtask.parentTaskId = taskId;
        this.taskQueue.set(subtask.id, subtask);
        task.subtaskIds.push(subtask.id);
      }

      // Store dependencies
      this.taskDependencies.set(taskId, breakdown.dependencies);

      // Update task with breakdown results
      task.requiredCapabilities = breakdown.requiredCapabilities;
      task.maxExecutionTimeMinutes = Math.max(task.maxExecutionTimeMinutes, breakdown.estimatedDurationMinutes);

      this.updateTaskStatus(task, TaskStatus.ASSIGNED);

      // Schedule for execution
      await this.scheduleTaskExecution(taskId);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.handleTaskError(task, `Breakdown analysis failed: ${errorMessage}`);
    }
  }

  /**
   * Schedules task execution based on dependencies and resource availability
   */
  private async scheduleTaskExecution(taskId: string): Promise<void> {
    const task = this.taskQueue.get(taskId);
    if (!task) return;

    // Check if all dependencies are satisfied
    if (!this.areDependenciesSatisfied(taskId)) {
      // Task will be rescheduled when dependencies complete
      return;
    }

    // Check resource availability
    if (this.runningTasks.size >= this.getMaxConcurrentTasks()) {
      // Will be rescheduled when resources become available
      return;
    }

    // Execute the task
    await this.executeTask(taskId);
  }

  /**
   * Executes a task using SubAgentScope with comprehensive monitoring
   */
  private async executeTask(taskId: string): Promise<void> {
    const task = this.taskQueue.get(taskId);
    if (!task) return;

    try {
      this.updateTaskStatus(task, TaskStatus.IN_PROGRESS);

      const startTime = new Date();
      task.startedAt = startTime;
      task.metrics = {
        startTime,
        tokenUsage: 0,
        toolCallsCount: 0,
        subAgentCount: 1,
        errorCount: 0,
        retryCount: task.retryCount
      };

      // Create execution context
      const context = new ContextState();
      this.populateExecutionContext(task, context);

      // Create SubAgent for task execution
      const executionAgent = await SubAgentScope.create(
        `task-executor-${task.type}`,
        this.config,
        {
          systemPrompt: this.generateExecutionPrompt(task)
        },
        {
          model: this.config.getModel(),
          temp: 0.7,
          top_p: 0.9
        },
        {
          max_time_minutes: task.maxExecutionTimeMinutes,
          max_turns: 50
        },
        {
          toolConfig: {
            tools: this.getToolsForTask(task)
          },
          outputConfig: {
            outputs: task.expectedOutputs
          },
          onMessage: (message) => {
            // Update progress based on message analysis
            this.updateTaskProgress(task, message);
          }
        }
      );

      const executionContext: TaskExecutionContext = {
        task,
        toolRegistry: this.toolRegistry,
        config: this.config,
        parentContext: context,
        dependencies: this.getDependencyTasks(taskId),
        availableAgents: []  // TODO: Implement agent discovery
      };

      this.runningTasks.set(taskId, executionContext);

      // Execute the task
      await executionAgent.runNonInteractive(context);

      // Process results
      const result = executionAgent.output;
      const endTime = new Date();

      task.metrics.endTime = endTime;
      task.metrics.durationMs = endTime.getTime() - startTime.getTime();

      if (result.terminate_reason === SubagentTerminateMode.GOAL) {
        // Task completed successfully
        task.outputs = result.emitted_vars;
        task.completedAt = endTime;
        task.progress = 100;

        this.taskQueue.delete(taskId);
        this.completedTasks.set(taskId, task);
        this.runningTasks.delete(taskId);

        this.updateTaskStatus(task, TaskStatus.COMPLETED);
        this.onTaskComplete?.(task);

        // Schedule dependent tasks
        await this.scheduleDependentTasks(taskId);

      } else {
        // Task failed or timed out
        const errorMessage = `Task terminated with reason: ${result.terminate_reason}`;
        await this.handleTaskFailure(task, errorMessage);
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      await this.handleTaskFailure(task, errorMessage);
    }
  }

  /**
   * Handles task execution failures with retry logic
   */
  private async handleTaskFailure(task: Task, errorMessage: string): Promise<void> {
    task.lastError = errorMessage;
    task.retryCount++;

    if (task.metrics) {
      task.metrics.errorCount++;
    }

    this.runningTasks.delete(task.id);

    if (task.retryCount <= task.maxRetries) {
      // Retry the task
      this.updateTaskStatus(task, TaskStatus.QUEUED);
      setTimeout(() => {
        this.scheduleTaskExecution(task.id);
      }, this.getRetryDelayMs(task.retryCount));
    } else {
      // Max retries exceeded, mark as failed
      this.updateTaskStatus(task, TaskStatus.FAILED);
      this.onTaskFailed?.(task, errorMessage);

      // Handle dependent tasks (cancel or reschedule)
      await this.handleDependentTasksOnFailure(task.id);
    }
  }

  /**
   * Gets task by ID
   */
  getTask(taskId: string): Task | undefined {
    return this.taskQueue.get(taskId) || this.completedTasks.get(taskId);
  }

  /**
   * Gets all tasks with optional filtering
   */
  getAllTasks(filter?: {
    status?: TaskStatus;
    type?: TaskType;
    priority?: TaskPriority;
  }): Task[] {
    const allTasks = [
      ...Array.from(this.taskQueue.values()),
      ...Array.from(this.completedTasks.values())
    ];

    if (!filter) return allTasks;

    return allTasks.filter(task => {
      if (filter.status && task.status !== filter.status) return false;
      if (filter.type && task.type !== filter.type) return false;
      if (filter.priority && task.priority !== filter.priority) return false;
      return true;
    });
  }

  /**
   * Gets execution statistics
   */
  getExecutionStats(): any {
    const allTasks = this.getAllTasks();
    return TaskExecutionUtils.calculateExecutionStats(allTasks);
  }

  /**
   * Cancels a task
   */
  async cancelTask(taskId: string): Promise<boolean> {
    const task = this.taskQueue.get(taskId);
    if (!task) return false;

    if (task.status === TaskStatus.IN_PROGRESS) {
      // Stop the running task
      this.runningTasks.delete(taskId);
    }

    this.updateTaskStatus(task, TaskStatus.CANCELLED);
    return true;
  }

  /**
   * Clears completed tasks (for maintenance)
   */
  clearCompletedTasks(): number {
    const count = this.completedTasks.size;
    this.completedTasks.clear();
    this.savePersistedState();
    return count;
  }

  /**
   * Shuts down the engine gracefully
   */
  async shutdown(): Promise<void> {
    // Cancel all running tasks
    for (const [taskId] of this.runningTasks) {
      await this.cancelTask(taskId);
    }

    // Save final state
    await this.savePersistedState();

    console.log('TaskExecutionEngine shut down gracefully');
  }
}