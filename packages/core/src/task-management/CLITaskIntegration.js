/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { TaskManager } from './TaskManager.js';
import { ExtendedTaskState } from './TaskStateManager.js';
/**
 * CLI Task Management Integration
 */
export class CLITaskIntegration {
  config;
  taskManager;
  stateManager;
  executionEngine;
  commands = new Map();
  activeProgressReporters = new Map();
  notificationQueue = [];
  isInitialized = false;
  lastStatusUpdate = new Date();
  constructor(config) {
    this.config = config;
    console.log('🔗 Initializing CLI Task Integration...');
    // Initialize task management components
    const taskManagerConfig = {
      config: config.config,
      enableAutonomousBreakdown: true,
      enableAdaptiveScheduling: true,
      enableLearning: true,
      enableMonitoring: config.monitoring?.enabled !== false,
      enableHookIntegration: config.hookIntegration?.enabled !== false,
      enablePersistence: true,
      agentId: config.hookIntegration?.agentId || 'CLI_TASK_AGENT',
      hookIntegrationConfig: config.hookIntegration,
      monitoringConfig: config.monitoring,
    };
    this.taskManager = new TaskManager(taskManagerConfig);
    this.stateManager = this.taskManager['stateManager']; // Access private property
    this.executionEngine = this.taskManager['executionEngine']; // Access private property
    this.initializeBuiltinCommands();
    this.setupEventListeners();
    console.log('✅ CLI Task Integration initialized');
  }
  /**
   * Initialize the integration system
   */
  async initialize() {
    if (this.isInitialized) return;
    console.log('🚀 Starting CLI Task Integration...');
    // Initialize task manager
    await this.taskManager.initialize();
    // Start progress reporting if enabled
    if (this.config.enableProgressReporting) {
      this.startProgressReporting();
    }
    // Start notification processing
    this.startNotificationProcessing();
    this.isInitialized = true;
    console.log('✅ CLI Task Integration started successfully');
    this.notify({
      type: 'info',
      title: 'Task Management Ready',
      message: 'Autonomous task management system is now active',
      timestamp: new Date(),
    });
  }
  /**
   * Register a CLI command that maps to task execution
   */
  registerCommand(command) {
    console.log(`📝 Registering CLI command: ${command.name}`);
    this.commands.set(command.name, command);
  }
  /**
   * Execute a CLI command as a task
   */
  async executeCommand(commandName, args = [], options = {}) {
    console.log(`⚡ Executing CLI command as task: ${commandName}`);
    const command = this.commands.get(commandName);
    if (!command) {
      throw new Error(`Unknown command: ${commandName}`);
    }
    try {
      // Map command to task
      const task = await command.mapToTask(args, options);
      console.log(`📋 Created task from command: ${task.title}`);
      // Execute task through task manager
      const taskId = await this.taskManager.addTask(
        task.title,
        task.description,
        {
          priority: task.priority,
          category: task.category,
          executionContext: task.executionContext,
          parameters: task.parameters,
          expectedOutputs: task.expectedOutput,
          useAutonomousQueue: true,
        },
      );
      // Wait for completion or failure
      const result = await this.waitForTaskCompletion(taskId);
      const cliResult = {
        success: result.success,
        taskId,
        output: result.success
          ? {
              summary: `Task completed successfully: ${task.title}`,
              details: result.output,
              artifacts: result.artifacts,
            }
          : undefined,
        error: result.success
          ? undefined
          : {
              message: result.error?.message || 'Task execution failed',
              code: result.error?.code,
              suggestions: this.generateErrorSuggestions(result.error),
            },
        metrics: {
          duration: result.metrics?.duration || 0,
          resourcesUsed: ['cpu', 'memory'], // Would be actual resources
          qualityGatesPassed: 0, // Would be actual count
          recoveryAttempts: 0, // Would be actual count
        },
      };
      return cliResult;
    } catch (error) {
      console.error(`💥 Command execution failed: ${commandName}`, error);
      return {
        success: false,
        taskId: 'unknown',
        error: {
          message: error.message,
          suggestions: [
            'Check command arguments',
            'Ensure system is not overloaded',
          ],
        },
      };
    }
  }
  /**
   * Get current task status for CLI display
   */
  getTaskProgress(taskId) {
    try {
      const status = this.taskManager.getTaskStatus(taskId);
      if (!status) return null;
      return {
        taskId,
        title: 'Task', // Would get actual task title
        state: status.status,
        progress: status.progress,
        estimatedTimeRemaining: this.estimateRemainingTime(status),
        currentOperation: this.getCurrentOperation(status),
        subtasks: this.getSubtasks(status),
      };
    } catch (error) {
      console.warn(`⚠️ Could not get task progress for ${taskId}:`, error);
      return null;
    }
  }
  /**
   * List all active tasks for CLI status display
   */
  listActiveTasks() {
    const systemStatus = this.taskManager.getSystemStatus();
    const tasks = [];
    // This would iterate through actual task lists
    // For now, returning mock data
    return tasks;
  }
  /**
   * Cancel a running task
   */
  async cancelTask(taskId, reason) {
    console.log(`🛑 Cancelling task: ${taskId}${reason ? ` (${reason})` : ''}`);
    try {
      // Implementation would cancel the task through task manager
      await this.stateManager.transitionTaskState(
        taskId,
        ExtendedTaskState.CANCELLING,
        {}, // Would get actual task
        {
          reason: reason || 'User cancellation',
          triggeredBy: 'cli_user',
        },
      );
      this.notify({
        type: 'warning',
        title: 'Task Cancelled',
        message: `Task ${taskId} has been cancelled`,
        taskId,
        timestamp: new Date(),
      });
      return true;
    } catch (error) {
      console.error(`💥 Failed to cancel task ${taskId}:`, error);
      this.notify({
        type: 'error',
        title: 'Cancellation Failed',
        message: `Could not cancel task ${taskId}: ${error.message}`,
        taskId,
        timestamp: new Date(),
      });
      return false;
    }
  }
  /**
   * Get comprehensive system status for CLI dashboard
   */
  getSystemStatus() {
    const status = this.taskManager.getSystemStatus();
    return {
      isRunning: status.isRunning,
      tasksActive: status.taskCounts.inProgress,
      tasksCompleted: status.taskCounts.completed,
      tasksFailed: status.taskCounts.failed,
      systemLoad: 0.5, // Would be actual system load
      autonomousMode: status.autonomousMode,
      lastUpdate: this.lastStatusUpdate,
    };
  }
  /**
   * Initialize built-in CLI commands
   */
  initializeBuiltinCommands() {
    // Task management commands
    this.registerCommand({
      name: 'task:create',
      description: 'Create and execute a new task',
      args: ['title', 'description'],
      mapToTask: async ([title, description], options) => ({
        id: '',
        title: title || 'Untitled Task',
        description: description || 'No description provided',
        status: 'pending',
        priority: options.priority || 'medium',
        category: options.category || 'implementation',
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'cli_user',
        },
        parameters: options,
      }),
    });
    this.registerCommand({
      name: 'task:status',
      description: 'Get status of all active tasks',
      mapToTask: async () => ({
        id: '',
        title: 'System Status Check',
        description: 'Get comprehensive system and task status',
        status: 'pending',
        priority: 'low',
        category: 'analysis',
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'cli_user',
        },
      }),
    });
    this.registerCommand({
      name: 'task:optimize',
      description: 'Optimize task queue and system performance',
      mapToTask: async (args, options) => ({
        id: '',
        title: 'System Optimization',
        description: 'Analyze and optimize task queue performance',
        status: 'pending',
        priority: 'high',
        category: 'analysis',
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'cli_user',
        },
        parameters: {
          optimizationType: options.type || 'full',
          ...options,
        },
      }),
    });
    console.log('📚 Built-in CLI commands registered');
  }
  /**
   * Setup event listeners for task management events
   */
  setupEventListeners() {
    // Listen to task state changes
    this.stateManager.on('stateChanged', (event) => {
      this.handleStateChange(event);
    });
    // Listen to task manager events
    this.taskManager.on('taskCompleted', (taskId, result) => {
      this.handleTaskCompletion(taskId, result);
    });
    this.taskManager.on('taskFailed', (taskId, result) => {
      this.handleTaskFailure(taskId, result);
    });
    console.log('👂 Event listeners configured');
  }
  /**
   * Handle task state changes
   */
  handleStateChange(event) {
    if (this.config.verbosity === 'debug') {
      console.log(
        `🔄 Task ${event.taskId}: ${event.transition.fromState} → ${event.transition.toState}`,
      );
    }
    // Update progress reporting
    if (
      this.config.enableProgressReporting &&
      this.activeProgressReporters.has(event.taskId)
    ) {
      this.updateProgressDisplay(event.taskId);
    }
    // Send notifications for important state changes
    if (event.transition.toState === ExtendedTaskState.FAILED) {
      this.notify({
        type: 'error',
        title: 'Task Failed',
        message: `Task ${event.taskId} has failed: ${event.transition.reason}`,
        taskId: event.taskId,
        timestamp: new Date(),
      });
    } else if (event.transition.toState === ExtendedTaskState.COMPLETED) {
      this.notify({
        type: 'success',
        title: 'Task Completed',
        message: `Task ${event.taskId} completed successfully`,
        taskId: event.taskId,
        timestamp: new Date(),
      });
    }
    this.lastStatusUpdate = new Date();
  }
  /**
   * Handle task completion
   */
  handleTaskCompletion(taskId, result) {
    console.log(`✅ Task completed: ${taskId}`);
    // Stop progress reporting
    this.stopProgressReporting(taskId);
    if (this.config.enableNotifications) {
      this.notify({
        type: 'success',
        title: 'Task Completed',
        message: `Task ${taskId} finished successfully`,
        taskId,
        timestamp: new Date(),
      });
    }
  }
  /**
   * Handle task failure
   */
  handleTaskFailure(taskId, result) {
    console.error(`❌ Task failed: ${taskId}`, result.error);
    // Stop progress reporting
    this.stopProgressReporting(taskId);
    if (this.config.enableNotifications) {
      this.notify({
        type: 'error',
        title: 'Task Failed',
        message: `Task ${taskId} failed: ${result.error?.message || 'Unknown error'}`,
        taskId,
        timestamp: new Date(),
        actions: [
          {
            label: 'Retry',
            action: async () => {
              // Implementation would retry the task
              console.log(`🔄 Retrying task: ${taskId}`);
            },
          },
        ],
      });
    }
  }
  /**
   * Progress reporting management
   */
  startProgressReporting() {
    if (!this.config.enableProgressReporting) return;
    console.log('📊 Starting progress reporting...');
    // Setup global progress reporting interval
    setInterval(() => {
      this.updateGlobalProgress();
    }, this.config.progressIntervalMs || 5000);
  }
  stopProgressReporting(taskId) {
    const reporter = this.activeProgressReporters.get(taskId);
    if (reporter) {
      clearInterval(reporter);
      this.activeProgressReporters.delete(taskId);
    }
  }
  updateProgressDisplay(taskId) {
    const progress = this.getTaskProgress(taskId);
    if (!progress) return;
    if (
      this.config.verbosity === 'verbose' ||
      this.config.verbosity === 'debug'
    ) {
      console.log(
        `📈 ${progress.title}: ${progress.progress}% (${progress.state})`,
      );
    }
  }
  updateGlobalProgress() {
    const status = this.getSystemStatus();
    if (
      this.config.verbosity === 'normal' ||
      this.config.verbosity === 'verbose'
    ) {
      if (status.tasksActive > 0) {
        console.log(
          `📊 System Status: ${status.tasksActive} active, ${status.tasksCompleted} completed, ${status.tasksFailed} failed`,
        );
      }
    }
  }
  /**
   * Notification system
   */
  notify(notification) {
    if (!this.config.enableNotifications) return;
    this.notificationQueue.push(notification);
    // Immediate display for important notifications
    if (notification.type === 'error' || notification.type === 'warning') {
      this.displayNotification(notification);
    }
  }
  startNotificationProcessing() {
    setInterval(() => {
      while (this.notificationQueue.length > 0) {
        const notification = this.notificationQueue.shift();
        this.displayNotification(notification);
      }
    }, 2000); // Process every 2 seconds
  }
  displayNotification(notification) {
    const icon = {
      info: 'ℹ️',
      success: '✅',
      warning: '⚠️',
      error: '❌',
    }[notification.type];
    if (this.config.verbosity !== 'silent') {
      console.log(`${icon} ${notification.title}: ${notification.message}`);
    }
  }
  /**
   * Wait for task completion
   */
  async waitForTaskCompletion(taskId, timeoutMs = 300000) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Task ${taskId} timed out after ${timeoutMs}ms`));
      }, timeoutMs);
      const checkStatus = async () => {
        try {
          const status = await this.taskManager.getTaskStatus(taskId);
          if (status.status === 'completed') {
            clearTimeout(timeout);
            resolve(status.result);
          } else if (status.status === 'failed') {
            clearTimeout(timeout);
            resolve(status.result);
          } else {
            setTimeout(checkStatus, 1000); // Check every second
          }
        } catch (error) {
          clearTimeout(timeout);
          reject(error);
        }
      };
      checkStatus();
    });
  }
  /**
   * Helper methods
   */
  estimateRemainingTime(status) {
    // Mock implementation - would calculate based on progress and historical data
    return Math.max(0, (100 - status.progress) * 1000);
  }
  getCurrentOperation(status) {
    // Mock implementation - would get actual current operation
    return 'Processing...';
  }
  getSubtasks(status) {
    // Mock implementation - would get actual subtasks
    return [];
  }
  generateErrorSuggestions(error) {
    if (!error) return [];
    const suggestions = [];
    if (error.message.includes('timeout')) {
      suggestions.push('Increase timeout value', 'Check system resources');
    }
    if (error.message.includes('permission')) {
      suggestions.push(
        'Check file permissions',
        'Run with elevated privileges',
      );
    }
    if (error.message.includes('memory')) {
      suggestions.push(
        'Increase memory allocation',
        'Close other applications',
      );
    }
    return suggestions.length > 0
      ? suggestions
      : ['Check logs for more details', 'Retry the operation'];
  }
  /**
   * Shutdown integration
   */
  async shutdown() {
    console.log('🛑 Shutting down CLI Task Integration...');
    // Clear all progress reporters
    for (const [taskId, reporter] of this.activeProgressReporters) {
      clearInterval(reporter);
    }
    this.activeProgressReporters.clear();
    // Shutdown task manager
    await this.taskManager.shutdown();
    // Clear commands and notifications
    this.commands.clear();
    this.notificationQueue.length = 0;
    console.log('✅ CLI Task Integration shutdown complete');
  }
}
/**
 * Factory function for creating CLI integration
 */
export async function createCLITaskIntegration(config) {
  const integration = new CLITaskIntegration(config);
  await integration.initialize();
  return integration;
}
//# sourceMappingURL=CLITaskIntegration.js.map
