/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Config } from '../config/config.js';
import type { TaskExecutionEngine } from './TaskExecutionEngine.complete.js';
import type {
  Task,
  TaskType,
  TaskStatus,
  TaskPriority,
  TaskComplexity,
} from './TaskExecutionEngine.js';
import type { ExecutionMonitoringSystem } from './ExecutionMonitoringSystem.js';
import { spawn, type ChildProcess } from 'node:child_process';
import * as path from 'node:path';
import * as fs from 'node:fs/promises';

/**
 * @fileoverview Integration with infinite-continue-stop-hook system
 *
 * This module integrates the TaskExecutionEngine with the existing
 * infinite-continue-stop-hook system for cross-session persistence
 * and autonomous task management.
 */

/**
 * Task manager API integration
 */
export interface TaskManagerAPI {
  createTaskFromFeature(featureId: string, options?: any): Promise<any>;
  generateTasksFromApprovedFeatures(options?: any): Promise<any>;
  getTaskQueue(filters?: any): Promise<any>;
  assignTask(taskId: string, agentId: string, options?: any): Promise<any>;
  updateTaskProgress(taskId: string, progress: any): Promise<any>;
  registerAgentCapabilities(
    agentId: string,
    capabilities: string[],
  ): Promise<any>;
}

/**
 * Hook integration configuration
 */
export interface HookIntegrationConfig {
  taskManagerApiPath: string;
  agentId: string;
  capabilities: string[];
  autoApprovalEnabled: boolean;
  maxConcurrentTasks: number;
  progressReportingIntervalMs: number;
}

/**
 * Integration with infinite-continue-stop-hook system
 */
export class InfiniteHookIntegration {
  private readonly config: Config;
  private readonly taskEngine: TaskExecutionEngine;
  private readonly monitoring: ExecutionMonitoringSystem;
  private readonly hookConfig: HookIntegrationConfig;

  private readonly taskManagerApiPath: string;
  private isIntegrationActive: boolean = false;
  private progressReportingTimer?: NodeJS.Timeout;
  private lastProgressReport?: Date;

  constructor(
    config: Config,
    taskEngine: TaskExecutionEngine,
    monitoring: ExecutionMonitoringSystem,
    hookConfig?: Partial<HookIntegrationConfig>,
  ) {
    this.config = config;
    this.taskEngine = taskEngine;
    this.monitoring = monitoring;

    // Default hook configuration
    this.hookConfig = {
      taskManagerApiPath:
        '/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js',
      agentId: 'TASK_EXECUTION_ENGINE',
      capabilities: [
        'implementation',
        'testing',
        'validation',
        'documentation',
        'analysis',
      ],
      autoApprovalEnabled: true,
      maxConcurrentTasks: 5,
      progressReportingIntervalMs: 60000, // 1 minute
      ...hookConfig,
    };

    this.taskManagerApiPath = this.hookConfig.taskManagerApiPath;
  }

  /**
   * Initializes integration with the hook system
   */
  async initialize(): Promise<void> {
    try {
      console.log(
        'Initializing TaskExecutionEngine integration with infinite-continue-stop-hook...',
      );

      // Initialize or reinitialize the agent
      await this.initializeAgent();

      // Register agent capabilities
      await this.registerCapabilities();

      // Start periodic task checking
      this.startPeriodicTaskChecking();

      // Start progress reporting
      this.startProgressReporting();

      this.isIntegrationActive = true;
      console.log(
        'TaskExecutionEngine successfully integrated with infinite-continue-stop-hook system',
      );
    } catch (error) {
      console.error('Failed to initialize hook integration:', error);
      throw error;
    }
  }

  /**
   * Initializes the agent with the task manager API
   */
  private async initializeAgent(): Promise<void> {
    try {
      const result = await this.executeTaskManagerCommand(
        'reinitialize',
        this.hookConfig.agentId,
      );
      if (!result.success) {
        throw new Error(`Agent initialization failed: ${result.error}`);
      }
      console.log(`Agent ${this.hookConfig.agentId} initialized successfully`);
    } catch (error) {
      console.error('Agent initialization error:', error);
      throw error;
    }
  }

  /**
   * Registers agent capabilities with the task manager
   */
  private async registerCapabilities(): Promise<void> {
    try {
      const result = await this.executeTaskManagerCommand(
        'registerAgentCapabilities',
        this.hookConfig.agentId,
        JSON.stringify(this.hookConfig.capabilities),
      );

      if (!result.success) {
        console.warn(`Failed to register capabilities: ${result.error}`);
        // Non-fatal, continue with integration
      } else {
        console.log(
          `Registered capabilities: ${this.hookConfig.capabilities.join(', ')}`,
        );
      }
    } catch (error) {
      console.warn('Capability registration failed:', error);
      // Non-fatal, continue with integration
    }
  }

  /**
   * Starts periodic checking for new tasks from approved features
   */
  private startPeriodicTaskChecking(): void {
    // Check for new tasks every 30 seconds
    setInterval(async () => {
      if (!this.isIntegrationActive) return;

      try {
        await this.checkAndProcessNewTasks();
      } catch (error) {
        console.error('Error in periodic task checking:', error);
      }
    }, 30000);
  }

  /**
   * Checks for and processes new tasks from approved features
   */
  private async checkAndProcessNewTasks(): Promise<void> {
    try {
      // Get approved features that don't have tasks yet
      const approvedFeaturesResult = await this.executeTaskManagerCommand(
        'list-features',
        JSON.stringify({ status: 'approved' }),
      );

      if (!approvedFeaturesResult.success) {
        console.error(
          'Failed to fetch approved features:',
          approvedFeaturesResult.error,
        );
        return;
      }

      const approvedFeatures = approvedFeaturesResult.features || [];

      // Get existing task queue
      const taskQueueResult =
        await this.executeTaskManagerCommand('getTaskQueue');
      const existingTasks = taskQueueResult.success
        ? taskQueueResult.tasks || []
        : [];

      // Find features without tasks
      const featuresWithoutTasks = approvedFeatures.filter(
        (feature) =>
          !existingTasks.some((task) => task.feature_id === feature.id),
      );

      if (featuresWithoutTasks.length === 0) {
        return; // No new features to process
      }

      console.log(
        `Found ${featuresWithoutTasks.length} approved features without tasks`,
      );

      // Create tasks for approved features
      for (const feature of featuresWithoutTasks) {
        await this.createTaskFromFeature(feature);
      }

      // Process queued tasks with our execution engine
      await this.processQueuedTasks();
    } catch (error) {
      console.error('Error checking for new tasks:', error);
    }
  }

  /**
   * Creates a task from an approved feature
   */
  private async createTaskFromFeature(feature: any): Promise<void> {
    try {
      // Map feature to task parameters
      const taskType = this.mapFeatureCategoryToTaskType(feature.category);
      const taskPriority = this.mapFeaturePriorityToTaskPriority(feature);

      // Create task in our execution engine
      const taskId = await this.taskEngine.queueTask(
        feature.title,
        feature.description,
        {
          type: taskType,
          priority: taskPriority,
          context: {
            featureId: feature.id,
            category: feature.category,
            businessValue: feature.business_value,
          },
          expectedOutputs: {
            implementation_status: 'Status of implementation completion',
            validation_results: 'Results of validation and testing',
            documentation_updates: 'Documentation changes made',
          },
        },
      );

      // Also create task in the hook system for tracking
      const hookTaskResult = await this.executeTaskManagerCommand(
        'createTaskFromFeature',
        feature.id,
        JSON.stringify({
          title: feature.title,
          description: feature.description,
          type: taskType,
          priority: taskPriority,
          metadata: {
            execution_engine_task_id: taskId,
            created_by_engine: true,
          },
        }),
      );

      if (hookTaskResult.success) {
        console.log(`Created task for feature: ${feature.title}`);
      } else {
        console.warn(
          `Failed to create hook task for feature ${feature.id}: ${hookTaskResult.error}`,
        );
      }
    } catch (error) {
      console.error(`Error creating task from feature ${feature.id}:`, error);
    }
  }

  /**
   * Processes queued tasks by assigning them to our execution engine
   */
  private async processQueuedTasks(): Promise<void> {
    try {
      // Get queued tasks from hook system
      const queueResult = await this.executeTaskManagerCommand(
        'getTaskQueue',
        JSON.stringify({ status: 'queued' }),
      );

      if (!queueResult.success || !queueResult.tasks) {
        return;
      }

      const queuedTasks = queueResult.tasks;

      // Filter tasks that can be handled by our capabilities
      const compatibleTasks = queuedTasks.filter((task) =>
        this.canHandleTask(task),
      );

      // Assign compatible tasks to our agent
      for (const task of compatibleTasks.slice(
        0,
        this.hookConfig.maxConcurrentTasks,
      )) {
        await this.assignTaskToEngine(task);
      }
    } catch (error) {
      console.error('Error processing queued tasks:', error);
    }
  }

  /**
   * Checks if we can handle a task based on capabilities
   */
  private canHandleTask(task: any): boolean {
    const requiredCapabilities = task.required_capabilities || [];
    if (requiredCapabilities.length === 0) return true;

    return requiredCapabilities.some(
      (cap) =>
        this.hookConfig.capabilities.includes(cap) ||
        this.hookConfig.capabilities.includes('general'),
    );
  }

  /**
   * Assigns a task to our execution engine
   */
  private async assignTaskToEngine(hookTask: any): Promise<void> {
    try {
      // Assign task in hook system
      const assignResult = await this.executeTaskManagerCommand(
        'assignTask',
        hookTask.id,
        this.hookConfig.agentId,
        JSON.stringify({
          reason: 'automated_assignment',
          metadata: {
            assigned_by_engine: true,
            assignment_time: new Date().toISOString(),
          },
        }),
      );

      if (!assignResult.success) {
        console.warn(
          `Failed to assign task ${hookTask.id}: ${assignResult.error}`,
        );
        return;
      }

      // Create corresponding task in our execution engine if it doesn't exist
      if (!hookTask.metadata?.execution_engine_task_id) {
        const engineTaskId = await this.taskEngine.queueTask(
          hookTask.title,
          hookTask.description,
          {
            type: hookTask.type as TaskType,
            priority: hookTask.priority as TaskPriority,
            context: {
              hookTaskId: hookTask.id,
              ...hookTask.metadata,
            },
            expectedOutputs: {
              task_completion: 'Task completion status and results',
            },
          },
        );

        console.log(
          `Assigned and queued task: ${hookTask.title} (Engine ID: ${engineTaskId})`,
        );
      }
    } catch (error) {
      console.error(`Error assigning task ${hookTask.id}:`, error);
    }
  }

  /**
   * Starts periodic progress reporting to the hook system
   */
  private startProgressReporting(): void {
    this.progressReportingTimer = setInterval(async () => {
      if (!this.isIntegrationActive) return;

      try {
        await this.reportProgress();
      } catch (error) {
        console.error('Error in progress reporting:', error);
      }
    }, this.hookConfig.progressReportingIntervalMs);
  }

  /**
   * Reports progress to the hook system
   */
  private async reportProgress(): Promise<void> {
    try {
      // Get current execution statistics
      const stats = this.taskEngine.getExecutionStats();
      const allTasks = this.taskEngine.getAllTasks();

      // Report progress for active tasks
      for (const task of allTasks.filter((t) => t.status === 'in_progress')) {
        const hookTaskId = task.context?.hookTaskId as string;
        if (!hookTaskId) continue;

        const progressUpdate = {
          status: this.mapEngineStatusToHookStatus(task.status),
          progress_percentage: task.progress,
          notes: `Task execution in progress. Retry count: ${task.retryCount}`,
          updated_by: this.hookConfig.agentId,
          metadata: {
            engine_task_id: task.id,
            last_updated: new Date().toISOString(),
            execution_stats: {
              duration_ms: task.startedAt
                ? Date.now() - task.startedAt.getTime()
                : 0,
              retry_count: task.retryCount,
            },
          },
        };

        await this.executeTaskManagerCommand(
          'updateTaskProgress',
          hookTaskId,
          JSON.stringify(progressUpdate),
        );
      }

      // Report completed tasks
      for (const task of allTasks.filter(
        (t) => t.status === 'completed' && !task.context?.reported,
      )) {
        const hookTaskId = task.context?.hookTaskId as string;
        if (!hookTaskId) continue;

        const completionUpdate = {
          status: 'completed',
          progress_percentage: 100,
          notes: `Task completed successfully by TaskExecutionEngine. Results: ${JSON.stringify(task.outputs || {})}`,
          updated_by: this.hookConfig.agentId,
          metadata: {
            engine_task_id: task.id,
            completed_at: task.completedAt?.toISOString(),
            execution_time_ms: task.metrics?.durationMs || 0,
            outputs: task.outputs,
          },
        };

        const updateResult = await this.executeTaskManagerCommand(
          'updateTaskProgress',
          hookTaskId,
          JSON.stringify(completionUpdate),
        );

        if (updateResult.success) {
          // Mark as reported to avoid duplicate reporting
          task.context = { ...task.context, reported: true };
        }
      }

      this.lastProgressReport = new Date();
    } catch (error) {
      console.error('Error reporting progress:', error);
    }
  }

  /**
   * Executes a command against the task manager API
   */
  private async executeTaskManagerCommand(
    command: string,
    ...args: string[]
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      const fullArgs = [this.taskManagerApiPath, command, ...args];
      const child = spawn('timeout', ['10s', 'node', ...fullArgs], {
        stdio: ['inherit', 'pipe', 'pipe'],
      });

      let stdout = '';
      let stderr = '';

      child.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        if (code === 0) {
          try {
            const result = JSON.parse(stdout);
            resolve(result);
          } catch (error) {
            resolve({ success: true, raw_output: stdout });
          }
        } else {
          reject(
            new Error(`Command failed with code ${code}: ${stderr || stdout}`),
          );
        }
      });

      child.on('error', (error) => {
        reject(error);
      });
    });
  }

  /**
   * Maps feature category to task type
   */
  private mapFeatureCategoryToTaskType(category: string): TaskType {
    switch (category) {
      case 'bug-fix':
        return 'implementation';
      case 'security':
        return 'security';
      case 'performance':
        return 'performance';
      case 'documentation':
        return 'documentation';
      case 'new-feature':
        return 'implementation';
      case 'enhancement':
        return 'implementation';
      default:
        return 'implementation';
    }
  }

  /**
   * Maps feature priority indicators to task priority
   */
  private mapFeaturePriorityToTaskPriority(feature: any): TaskPriority {
    if (feature.category === 'security') return 'critical';
    if (feature.category === 'bug-fix') return 'high';

    const businessValue = feature.business_value?.toLowerCase() || '';
    if (businessValue.includes('critical')) return 'critical';
    if (
      businessValue.includes('essential') ||
      businessValue.includes('important')
    )
      return 'high';

    return 'normal';
  }

  /**
   * Maps engine task status to hook system status
   */
  private mapEngineStatusToHookStatus(status: TaskStatus): string {
    switch (status) {
      case 'queued':
        return 'queued';
      case 'assigned':
        return 'assigned';
      case 'in_progress':
        return 'in_progress';
      case 'completed':
        return 'completed';
      case 'failed':
        return 'failed';
      case 'cancelled':
        return 'cancelled';
      case 'blocked':
        return 'blocked';
      default:
        return 'queued';
    }
  }

  /**
   * Authorizes stop when all tasks are complete
   */
  async checkAndAuthorizeStop(): Promise<void> {
    try {
      const stats = this.taskEngine.getExecutionStats();

      // Check if all critical conditions are met
      const allTasksComplete = stats.inProgress === 0 && (stats.total as number) > 0;
      const highSuccessRate = (stats.successRate as number) >= 80;
      const noFailures = stats.failed === 0;

      if (allTasksComplete && highSuccessRate && noFailures) {
        console.log('All tasks completed successfully. Authorizing stop...');

        const stopReason = `TaskExecutionEngine completed all tasks successfully: ${stats.completed} completed, ${(stats.successRate as number).toFixed(1)}% success rate`;

        const result = await this.executeTaskManagerCommand(
          'authorize-stop',
          this.hookConfig.agentId,
          JSON.stringify(stopReason),
        );

        if (result.success) {
          console.log('Stop authorized successfully');
        } else {
          console.warn('Failed to authorize stop:', result.error);
        }
      }
    } catch (error) {
      console.error('Error checking stop authorization:', error);
    }
  }

  /**
   * Shuts down the integration
   */
  async shutdown(): Promise<void> {
    this.isIntegrationActive = false;

    if (this.progressReportingTimer) {
      clearInterval(this.progressReportingTimer);
    }

    // Final progress report
    await this.reportProgress();

    // Check if we should authorize stop
    await this.checkAndAuthorizeStop();

    console.log('InfiniteHookIntegration shut down gracefully');
  }
}
