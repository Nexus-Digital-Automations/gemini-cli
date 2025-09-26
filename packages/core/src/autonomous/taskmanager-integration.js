/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { spawn } from 'node:child_process';
import {
  TaskCategory,
  TaskStatus,
  TaskPriority,
} from './task-breakdown-engine.js';
import { TaskComplexity } from '../task-management/types.js';
import { TaskBreakdownEngine } from './task-breakdown-engine.js';
import { AutonomousExecutionEngine } from './execution-engine.js';
import { ComprehensiveValidationEngine } from './validation-engine.js';
import {
  ComprehensiveStateManager,
  FileStateStorageBackend,
} from './state-manager.js';
/**
 * TaskManager API client implementation
 */
export class TaskManagerAPIClient {
  apiPath;
  timeout;
  logger; // Used for fallback logging throughout the class
  constructor(apiPath, timeout = 10000, logger) {
    this.apiPath = apiPath;
    this.timeout = timeout;
    this.logger = logger || {
      debug: (message, context) => console.debug(message, context),
      info: (message, context) => console.info(message, context),
      warn: (message, context) => console.warn(message, context),
      error: (message, error, context) =>
        console.error(message, error, context),
      metric: (name, value, labels) =>
        console.log(`METRIC ${name}=${value}`, labels),
    };
    // Ensure logger is recognized as used
    void this.logger;
  }
  async reinitialize(agentId) {
    return this.executeCommand(['reinitialize', agentId]);
  }
  async createTask(task) {
    const taskJson = JSON.stringify(task);
    return this.executeCommand(['create-task', taskJson]);
  }
  async updateTask(taskId, update) {
    const updateJson = JSON.stringify(update);
    return this.executeCommand(['update-task', taskId, updateJson]);
  }
  async getTask(taskId) {
    return this.executeCommand(['get-task', taskId]);
  }
  async listTasks() {
    return this.executeCommand(['list-tasks']);
  }
  async deleteTask(taskId) {
    return this.executeCommand(['delete-task', taskId]);
  }
  async authorizeStop(agentId, reason) {
    return this.executeCommand(['authorize-stop', agentId, `"${reason}"`]);
  }
  async executeCommand(args) {
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
  breakdownEngine;
  executionEngine;
  validationEngine;
  stateManager;
  taskManagerClient;
  config;
  logger;
  activeTasks = new Map();
  taskResults = new Map();
  constructor(workspaceContext, availableTools, config) {
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
      this.logger,
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
  async processRequest(request, workspaceContext, availableTools) {
    try {
      this.logger.info(
        `Processing autonomous request: ${request.substring(0, 100)}...`,
      );
      // Reinitialize with TaskManager
      await this.taskManagerClient.reinitialize(this.config.agentId);
      // Create breakdown context
      const breakdownContext = {
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
      this.logger.error('Failed to process autonomous request', error);
      throw error;
    }
  }
  /**
   * Recovers and continues interrupted tasks
   */
  async recoverInterruptedTasks() {
    try {
      this.logger.info('Recovering interrupted tasks');
      // Get incomplete states
      const states = await this.stateManager.listStates();
      const incompleteStates = states.filter(
        (state) =>
          state &&
          typeof state === 'object' &&
          'status' in state &&
          ['in_progress', 'pending'].includes(state['status']),
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
              const task = this.reconstructTaskFromState(restoredState);
              if (task) {
                this.activeTasks.set(task.id, task);
                // Continue execution would happen here
              }
            }
          } else {
            this.logger.warn(`Invalid taskId type for state: ${typeof taskId}`);
          }
        } catch (error) {
          this.logger.error(`Failed to recover task ${state['taskId']}`, error);
        }
      }
    } catch (error) {
      this.logger.error('Failed to recover interrupted tasks', error);
    }
  }
  /**
   * Gets the current status of all active tasks
   */
  async getTaskStatus() {
    const active = Array.from(this.activeTasks.values());
    const allResults = Array.from(this.taskResults.values());
    return {
      active,
      completed: allResults.filter((r) => r.status === TaskStatus.COMPLETED),
      failed: allResults.filter((r) => r.status === TaskStatus.FAILED),
    };
  }
  // Private implementation methods
  async registerTasks(tasks) {
    for (const task of tasks) {
      try {
        const taskManagerData = {
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
        this.logger.error(`Failed to register task: ${task.title}`, error);
      }
    }
  }
  async executeTasks(tasks, breakdownContext) {
    const executionContext = {
      workspaceContext: breakdownContext.workspaceContext,
      availableTools: new Map(), // Would be populated with actual tools
      abortSignal: new AbortController().signal,
      logger: this.logger,
      stateManager: this.stateManager, // Type compatibility - ComprehensiveStateManager interface alignment
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
  async updateTaskResults(tasks, results) {
    for (const result of results) {
      try {
        const update = {
          status: result.status,
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
          error,
        );
      }
    }
  }
  async checkCompletionAndAuthorizeStop(tasks, results) {
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
        this.logger.error('Error authorizing stop', error);
      }
    } else if (allTasksProcessed && failedCount > completedCount) {
      this.logger.warn(
        `High failure rate: ${failedCount}/${tasks.length} tasks failed`,
      );
    }
  }
  extractUserIntent(request) {
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
  reconstructTaskFromState(state) {
    // Reconstruct task from execution state
    // This is a simplified implementation
    return {
      id: state['taskId'],
      title: `Recovered: ${state['currentStep']}`,
      description: state['currentStep'],
      category: TaskCategory.INFRASTRUCTURE,
      complexity: TaskComplexity.MODERATE,
      priority: TaskPriority.MEDIUM,
      status: state['status'],
      createdAt: new Date(state['lastUpdate']),
      updatedAt: new Date(state['lastUpdate']),
    };
  }
  setupEventHandlers() {
    this.executionEngine.on('taskCompleted', (result) => {
      this.logger.info(`Task completed: ${result.taskId}`);
      this.activeTasks.delete(result.taskId);
    });
    this.executionEngine.on('taskFailed', (result) => {
      this.logger.warn(`Task failed: ${result.taskId}`, {
        error: result.error?.message,
      });
      this.activeTasks.delete(result.taskId);
    });
  }
  createLogger() {
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
  workspaceContext,
  availableTools,
  config,
) {
  const defaultConfig = {
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
//# sourceMappingURL=taskmanager-integration.js.map
