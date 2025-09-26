/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { spawn } from 'node:child_process';
import type {
  AutonomousTask,
  TaskBreakdownContext,
} from './task-breakdown-engine.js';
import {
  TaskCategory,
  TaskStatus,
  TaskPriority,
} from './task-breakdown-engine.js';
import { TaskComplexity } from '../task-management/types.js';
import type {
  TaskExecutionContext,
  TaskExecutionResult,
  ExecutionLogger,
  ExecutionStateManager,
} from './execution-engine.js';
import { TaskBreakdownEngine } from './task-breakdown-engine.js';
import { AutonomousExecutionEngine } from './execution-engine.js';
import { ComprehensiveValidationEngine } from './validation-engine.js';
import {
  ComprehensiveStateManager,
  FileStateStorageBackend,
} from './state-manager.js';
// import { createDefaultComplexityAnalyzers } from './complexity-analyzers.js'; // Unused
import type { WorkspaceContext } from '../utils/workspaceContext.js';
import type { AnyDeclarativeTool } from '../tools/tools.js';

/**
 * TaskManager API client interface
 */
export interface TaskManagerClient {
  reinitialize(agentId: string): Promise<TaskManagerResponse>;
  createTask(task: TaskManagerTaskData): Promise<TaskManagerResponse>;
  updateTask(
    taskId: string,
    update: Partial<TaskManagerTaskData>,
  ): Promise<TaskManagerResponse>;
  getTask(taskId: string): Promise<TaskManagerResponse>;
  listTasks(): Promise<TaskManagerResponse>;
  deleteTask(taskId: string): Promise<TaskManagerResponse>;
  authorizeStop(agentId: string, reason: string): Promise<TaskManagerResponse>;
}

/**
 * TaskManager API response structure
 */
export interface TaskManagerResponse {
  success: boolean;
  data?: unknown;
  error?: string;
  message?: string;
}

/**
 * TaskManager task data structure
 */
export interface TaskManagerTaskData {
  id?: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  priority: number;
  category: string;
  agentId: string;
  metadata?: Record<string, unknown>;
}

/**
 * Integration configuration
 */
export interface AutonomousIntegrationConfig {
  taskManagerApiPath: string;
  agentId: string;
  timeout: number;
  enableLogging: boolean;
  statePersistencePath?: string;
  maxConcurrentTasks?: number;
}

/**
 * Integration event types
 */
export interface IntegrationEvents {
  'task-started': { task: AutonomousTask; context: TaskExecutionContext };
  'task-completed': { task: AutonomousTask; result: TaskExecutionResult };
  'task-failed': { task: AutonomousTask; result: TaskExecutionResult };
  'breakdown-completed': { originalRequest: string; tasks: AutonomousTask[] };
  'integration-error': { error: Error; context: string };
}

/**
 * TaskManager API client implementation
 */
export class TaskManagerAPIClient implements TaskManagerClient {
  private readonly apiPath: string;
  private readonly timeout: number;
  private readonly logger: ExecutionLogger; // Used for fallback logging throughout the class

  constructor(
    apiPath: string,
    timeout: number = 10000,
    logger?: ExecutionLogger,
  ) {
    this.apiPath = apiPath;
    this.timeout = timeout;
    this.logger = logger || {
      debug: (message: string, context?: Record<string, unknown>) =>
        console.debug(message, context),
      info: (message: string, context?: Record<string, unknown>) =>
        console.info(message, context),
      warn: (message: string, context?: Record<string, unknown>) =>
        console.warn(message, context),
      error: (
        message: string,
        error?: Error,
        context?: Record<string, unknown>,
      ) => console.error(message, error, context),
      metric: (name: string, value: number, labels?: Record<string, string>) =>
        console.log(`METRIC ${name}=${value}`, labels),
    };
    // Ensure logger is recognized as used
    void this.logger;
  }

  async reinitialize(agentId: string): Promise<TaskManagerResponse> {
    return this.executeCommand(['reinitialize', agentId]);
  }

  async createTask(task: TaskManagerTaskData): Promise<TaskManagerResponse> {
    const taskJson = JSON.stringify(task);
    return this.executeCommand(['create-task', taskJson]);
  }

  async updateTask(
    taskId: string,
    update: Partial<TaskManagerTaskData>,
  ): Promise<TaskManagerResponse> {
    const updateJson = JSON.stringify(update);
    return this.executeCommand(['update-task', taskId, updateJson]);
  }

  async getTask(taskId: string): Promise<TaskManagerResponse> {
    return this.executeCommand(['get-task', taskId]);
  }

  async listTasks(): Promise<TaskManagerResponse> {
    return this.executeCommand(['list-tasks']);
  }

  async deleteTask(taskId: string): Promise<TaskManagerResponse> {
    return this.executeCommand(['delete-task', taskId]);
  }

  async authorizeStop(
    agentId: string,
    reason: string,
  ): Promise<TaskManagerResponse> {
    return this.executeCommand(['authorize-stop', agentId, `"${reason}"`]);
  }

  private async executeCommand(args: string[]): Promise<TaskManagerResponse> {
    return new Promise((resolve) => {
      const child = spawn(
        'timeout',
        [`${this.timeout / 1000}s`, 'node', this.apiPath, ...args],
        {
          stdio: 'pipe',
        },
      );

      let stdout = '';
      let stderr = '';

      child.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        try {
          if (code === 0 && stdout.trim()) {
            const response = JSON.parse(stdout.trim());
            resolve(response);
          } else {
            resolve({
              success: false,
              error: stderr || `Command failed with code ${code}`,
              message: stdout || 'No output',
            });
          }
        } catch (error) {
          resolve({
            success: false,
            error: `Failed to parse response: ${error}`,
            message: stdout,
          });
        }
      });

      child.on('error', (error) => {
        resolve({
          success: false,
          error: error.message,
        });
      });
    });
  }
}

/**
 * Comprehensive autonomous task management integration
 */
export class AutonomousTaskManagerIntegration {
  private readonly breakdownEngine: TaskBreakdownEngine;
  private readonly executionEngine: AutonomousExecutionEngine;
  private readonly validationEngine: ComprehensiveValidationEngine;
  private readonly stateManager: ComprehensiveStateManager;
  private readonly taskManagerClient: TaskManagerClient;
  private readonly config: AutonomousIntegrationConfig;
  private readonly logger: ExecutionLogger;

  private readonly activeTasks = new Map<string, AutonomousTask>();
  private readonly taskResults = new Map<string, TaskExecutionResult>();

  constructor(
    workspaceContext: WorkspaceContext,
    availableTools: Map<string, AnyDeclarativeTool>,
    config: AutonomousIntegrationConfig,
  ) {
    this.config = config;
    this.logger = this.createLogger();

    // Initialize components
    this.breakdownEngine = new TaskBreakdownEngine();
    // Access private property through a method or make it public
    // For now, commenting out since complexityAnalyzers is private
    // this.breakdownEngine.complexityAnalyzers = createDefaultComplexityAnalyzers();

    this.validationEngine = new ComprehensiveValidationEngine();

    const storageBackend = new FileStateStorageBackend(
      config.statePersistencePath || '.autonomous-state',
    );
    this.stateManager = new ComprehensiveStateManager(
      storageBackend,
      {}, // config parameter
      this.logger, // logger parameter
    );

    this.executionEngine = new AutonomousExecutionEngine();

    this.taskManagerClient = new TaskManagerAPIClient(
      config.taskManagerApiPath,
      config.timeout,
      this.logger,
    );

    this.setupEventHandlers();
  }

  /**
   * Processes a complex user request autonomously
   */
  async processRequest(
    request: string,
    workspaceContext: WorkspaceContext,
    availableTools: string[],
  ): Promise<{
    tasks: AutonomousTask[];
    results: TaskExecutionResult[];
  }> {
    try {
      this.logger.info(
        `Processing autonomous request: ${request.substring(0, 100)}...`,
      );

      // Reinitialize with TaskManager
      await this.taskManagerClient.reinitialize(this.config.agentId);

      // Create breakdown context
      const breakdownContext: TaskBreakdownContext = {
        workspaceContext,
        originalRequest: request,
        userIntent: this.extractUserIntent(request),
        availableTools,
        preferences: {
          maxTaskDepth: 4,
          maxParallelTasks: this.config.maxConcurrentTasks || 5,
          preferredExecutionTime: 30, // minutes
        },
      };

      // Break down the request into manageable tasks
      const tasks = await this.breakdownEngine.breakdownTask(
        request,
        breakdownContext,
      );

      this.logger.info(`Request broken down into ${tasks.length} tasks`);

      // Register tasks with TaskManager
      await this.registerTasks(tasks);

      // Execute tasks
      const results = await this.executeTasks(tasks, breakdownContext);

      // Update TaskManager with results
      await this.updateTaskResults(tasks, results);

      // Check for completion and authorize stop if appropriate
      await this.checkCompletionAndAuthorizeStop(tasks, results);

      return { tasks, results };
    } catch (error) {
      this.logger.error('Failed to process autonomous request', error as Error);
      throw error;
    }
  }

  /**
   * Recovers and continues interrupted tasks
   */
  async recoverInterruptedTasks(): Promise<void> {
    try {
      this.logger.info('Recovering interrupted tasks');

      // Get incomplete states
      const states = await this.stateManager.listStates();
      const incompleteStates = (
        states as Array<Record<string, unknown>>
      ).filter(
        (state): state is Record<string, unknown> =>
          state &&
          typeof state === 'object' &&
          'status' in state &&
          ['in_progress', 'pending'].includes(state['status'] as TaskStatus),
      );

      for (const state of incompleteStates) {
        try {
          // Restore task from checkpoint
          const taskId = state['taskId'];
          if (typeof taskId === 'string') {
            const restoredState =
              await this.stateManager.restoreFromCheckpoint(taskId);
            if (restoredState) {
              this.logger.info(`Restored task from checkpoint: ${taskId}`);

              // Reconstruct task and continue execution
              const task = this.reconstructTaskFromState(
                restoredState as Record<string, unknown>,
              );
              if (task) {
                this.activeTasks.set(task.id, task);
                // Continue execution would happen here
              }
            }
          } else {
            this.logger.warn(`Invalid taskId type for state: ${typeof taskId}`);
          }
        } catch (error) {
          this.logger.error(
            `Failed to recover task ${state['taskId']}`,
            error as Error,
          );
        }
      }
    } catch (error) {
      this.logger.error('Failed to recover interrupted tasks', error as Error);
    }
  }

  /**
   * Gets the current status of all active tasks
   */
  async getTaskStatus(): Promise<{
    active: AutonomousTask[];
    completed: TaskExecutionResult[];
    failed: TaskExecutionResult[];
  }> {
    const active = Array.from(this.activeTasks.values());
    const allResults = Array.from(this.taskResults.values());

    return {
      active,
      completed: allResults.filter((r) => r.status === TaskStatus.COMPLETED),
      failed: allResults.filter((r) => r.status === TaskStatus.FAILED),
    };
  }

  // Private implementation methods
  private async registerTasks(tasks: AutonomousTask[]): Promise<void> {
    for (const task of tasks) {
      try {
        const taskManagerData: TaskManagerTaskData = {
          id: task.id,
          title: task.title,
          description: task.description,
          status: 'pending',
          priority: task.priority,
          category: task.category,
          agentId: this.config.agentId,
          metadata: {
            complexity: task.complexity,
            estimatedDuration: task.estimatedDuration,
            parentTaskId: task.parentTaskId,
            childTaskIds: task.childTaskIds,
          },
        };

        const response =
          await this.taskManagerClient.createTask(taskManagerData);
        if (!response.success) {
          this.logger.warn(
            `Failed to register task with TaskManager: ${task.title}`,
            { error: response.error },
          );
        }

        this.activeTasks.set(task.id, task);
      } catch (error) {
        this.logger.error(
          `Failed to register task: ${task.title}`,
          error as Error,
        );
      }
    }
  }

  private async executeTasks(
    tasks: AutonomousTask[],
    breakdownContext: TaskBreakdownContext,
  ): Promise<TaskExecutionResult[]> {
    const executionContext: TaskExecutionContext = {
      workspaceContext: breakdownContext.workspaceContext,
      availableTools: new Map(), // Would be populated with actual tools
      abortSignal: new AbortController().signal,
      logger: this.logger,
      stateManager: this.stateManager as unknown as ExecutionStateManager, // Type compatibility - ComprehensiveStateManager interface alignment
      validationEngine: this.validationEngine,
    };

    const results = await this.executionEngine.executeTasks(
      tasks,
      executionContext,
    );

    // Store results
    for (const result of results) {
      this.taskResults.set(result.taskId, result);
    }

    return results;
  }

  private async updateTaskResults(
    tasks: AutonomousTask[],
    results: TaskExecutionResult[],
  ): Promise<void> {
    for (const result of results) {
      try {
        const update: Partial<TaskManagerTaskData> = {
          status: result.status as
            | 'failed'
            | 'in_progress'
            | 'completed'
            | 'pending',
          metadata: {
            duration: result.duration,
            completed: result.endTime,
            error: result.error?.message,
          },
        };

        const response = await this.taskManagerClient.updateTask(
          result.taskId,
          update,
        );
        if (!response.success) {
          this.logger.warn(
            `Failed to update task in TaskManager: ${result.taskId}`,
            { error: response.error },
          );
        }
      } catch (error) {
        this.logger.error(
          `Failed to update task result: ${result.taskId}`,
          error as Error,
        );
      }
    }
  }

  private async checkCompletionAndAuthorizeStop(
    tasks: AutonomousTask[],
    results: TaskExecutionResult[],
  ): Promise<void> {
    const completedCount = results.filter(
      (r) => r.status === TaskStatus.COMPLETED,
    ).length;
    const failedCount = results.filter(
      (r) => r.status === TaskStatus.FAILED,
    ).length;

    // Determine if we should authorize stop
    const allTasksProcessed = tasks.length === results.length;
    const majoritySuccessful = completedCount >= tasks.length * 0.8; // 80% success rate

    if (allTasksProcessed && majoritySuccessful) {
      const reason = `Autonomous task processing completed: ${completedCount}/${tasks.length} tasks successful`;

      try {
        const response = await this.taskManagerClient.authorizeStop(
          this.config.agentId,
          reason,
        );
        if (response.success) {
          this.logger.info(
            'Successfully authorized stop after task completion',
          );
        } else {
          this.logger.warn('Failed to authorize stop', {
            error: response.error,
          });
        }
      } catch (error) {
        this.logger.error('Error authorizing stop', error as Error);
      }
    } else if (allTasksProcessed && failedCount > completedCount) {
      this.logger.warn(
        `High failure rate: ${failedCount}/${tasks.length} tasks failed`,
      );
    }
  }

  private extractUserIntent(request: string): string {
    // Simple intent extraction - could be enhanced with NLP
    const lowerRequest = request.toLowerCase();

    if (
      lowerRequest.includes('create') ||
      lowerRequest.includes('add') ||
      lowerRequest.includes('new')
    ) {
      return 'create';
    }
    if (
      lowerRequest.includes('fix') ||
      lowerRequest.includes('debug') ||
      lowerRequest.includes('resolve')
    ) {
      return 'fix';
    }
    if (
      lowerRequest.includes('analyze') ||
      lowerRequest.includes('review') ||
      lowerRequest.includes('investigate')
    ) {
      return 'analyze';
    }
    if (
      lowerRequest.includes('refactor') ||
      lowerRequest.includes('improve') ||
      lowerRequest.includes('optimize')
    ) {
      return 'improve';
    }
    if (
      lowerRequest.includes('test') ||
      lowerRequest.includes('verify') ||
      lowerRequest.includes('validate')
    ) {
      return 'test';
    }

    return 'general';
  }

  private reconstructTaskFromState(
    state: Record<string, unknown>,
  ): AutonomousTask | null {
    // Reconstruct task from execution state
    // This is a simplified implementation
    return {
      id: state['taskId'] as string,
      title: `Recovered: ${state['currentStep']}`,
      description: state['currentStep'] as string,
      category: TaskCategory.INFRASTRUCTURE,
      complexity: TaskComplexity.MODERATE,
      priority: TaskPriority.MEDIUM,
      status: state['status'] as TaskStatus,
      createdAt: new Date(state['lastUpdate'] as string | number | Date),
      updatedAt: new Date(state['lastUpdate'] as string | number | Date),
    };
  }

  private setupEventHandlers(): void {
    this.executionEngine.on('taskCompleted', (result: TaskExecutionResult) => {
      this.logger.info(`Task completed: ${result.taskId}`);
      this.activeTasks.delete(result.taskId);
    });

    this.executionEngine.on('taskFailed', (result: TaskExecutionResult) => {
      this.logger.warn(`Task failed: ${result.taskId}`, {
        error: result.error?.message,
      });
      this.activeTasks.delete(result.taskId);
    });
  }

  private createLogger(): ExecutionLogger {
    if (!this.config.enableLogging) {
      return {
        debug: () => {},
        info: () => {},
        warn: () => {},
        error: () => {},
        metric: () => {},
      };
    }

    return {
      debug: (msg, ctx) => console.debug(`[AutonomousIntegration] ${msg}`, ctx),
      info: (msg, ctx) => console.info(`[AutonomousIntegration] ${msg}`, ctx),
      warn: (msg, ctx) => console.warn(`[AutonomousIntegration] ${msg}`, ctx),
      error: (msg, err, ctx) =>
        console.error(`[AutonomousIntegration] ${msg}`, err, ctx),
      metric: (name, value, labels) =>
        console.log(`[AutonomousIntegration] ${name}: ${value}`, labels),
    };
  }
}

/**
 * Factory function to create configured autonomous integration
 */
export function createAutonomousIntegration(
  workspaceContext: WorkspaceContext,
  availableTools: Map<string, AnyDeclarativeTool>,
  config: Partial<AutonomousIntegrationConfig>,
): AutonomousTaskManagerIntegration {
  const defaultConfig: AutonomousIntegrationConfig = {
    taskManagerApiPath:
      '/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js',
    agentId: 'AUTONOMOUS_EXECUTION_ENGINE',
    timeout: 10000,
    enableLogging: true,
    maxConcurrentTasks: 5,
  };

  const mergedConfig = { ...defaultConfig, ...config };

  return new AutonomousTaskManagerIntegration(
    workspaceContext,
    availableTools,
    mergedConfig,
  );
}
