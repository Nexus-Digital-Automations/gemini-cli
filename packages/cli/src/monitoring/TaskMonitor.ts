/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { EventEmitter } from 'node:events';
import { Logger } from '../utils/logger.js';
import type {
  TaskMetadata,
  TaskStatus,
  AgentStatus,
} from './TaskStatusMonitor.js';
import { taskStatusMonitor, TaskStatusUpdate } from './TaskStatusMonitor.js';
import { progressTracker, ProgressGranularity } from './ProgressTracker.js';
import { performanceAnalyticsDashboard } from './PerformanceAnalyticsDashboard.js';
import { statusUpdateBroker } from './StatusUpdateBroker.js';
import { notificationSystem } from './NotificationSystem.js';

export interface MonitoringScope {
  taskId: string;
  agentId?: string;
  sessionId?: string;
  parentTaskId?: string;
  monitoringLevel: 'basic' | 'detailed' | 'comprehensive';
  enableProgressTracking: boolean;
  enablePerformanceAnalytics: boolean;
  enableNotifications: boolean;
}

export interface TaskMonitoringConfig {
  scope: MonitoringScope;
  thresholds: {
    progressStall: number; // minutes without progress before alert
    performanceDegradation: number; // percentage drop in performance
    errorRate: number; // maximum error rate before alert
    timeOverrun: number; // percentage over estimate before alert
  };
  reporting: {
    enableRealTimeReporting: boolean;
    reportingInterval: number; // milliseconds
    includeDetailedMetrics: boolean;
    includeProgressEstimates: boolean;
  };
}

export interface IntegratedTaskStatus {
  // Core status
  task: TaskMetadata;
  status: TaskStatus;

  // Progress tracking
  progress: {
    overall: number;
    milestones: Array<{
      name: string;
      completed: boolean;
      progress: number;
    }>;
    velocity: number;
    estimatedCompletion: Date | null;
    timeRemaining: number;
  };

  // Performance metrics
  performance: {
    executionTime: number;
    efficiency: number;
    resourceUsage: {
      cpu: number;
      memory: number;
    };
    throughput: number;
    errorRate: number;
  };

  // Agent information
  agent?: {
    id: string;
    status: string;
    performance: AgentStatus['performance'];
  };

  // Real-time analytics
  analytics: {
    bottlenecks: string[];
    recommendations: string[];
    riskFactors: string[];
    healthScore: number; // 0-100
  };
}

/**
 * Comprehensive Task Monitor
 *
 * Unified monitoring interface that coordinates all monitoring subsystems:
 * - Task status tracking
 * - Progress tracking with ETA estimation
 * - Performance analytics and insights
 * - Real-time notifications
 * - Health monitoring and diagnostics
 */
export class TaskMonitor extends EventEmitter {
  private readonly logger: Logger;
  private monitoredTasks: Map<string, TaskMonitoringConfig>;
  private healthScores: Map<string, number>;
  private monitoringInterval?: NodeJS.Timeout;

  constructor() {
    super();
    this.logger = new Logger('TaskMonitor');
    this.monitoredTasks = new Map();
    this.healthScores = new Map();

    this.setupEventIntegration();
    this.setupPeriodicMonitoring();

    this.logger.info(
      'TaskMonitor initialized with integrated monitoring capabilities',
    );
  }

  /**
   * Start comprehensive monitoring for a task
   */
  async startMonitoring(
    taskId: string,
    config: Partial<TaskMonitoringConfig> = {},
  ): Promise<void> {
    const defaultConfig: TaskMonitoringConfig = {
      scope: {
        taskId,
        monitoringLevel: 'detailed',
        enableProgressTracking: true,
        enablePerformanceAnalytics: true,
        enableNotifications: true,
      },
      thresholds: {
        progressStall: 5, // 5 minutes
        performanceDegradation: 25, // 25%
        errorRate: 0.1, // 10%
        timeOverrun: 20, // 20%
      },
      reporting: {
        enableRealTimeReporting: true,
        reportingInterval: 30000, // 30 seconds
        includeDetailedMetrics: true,
        includeProgressEstimates: true,
      },
    };

    const fullConfig = this.mergeConfig(defaultConfig, config);
    this.monitoredTasks.set(taskId, fullConfig);

    // Initialize subsystem monitoring
    if (fullConfig.scope.enableProgressTracking) {
      await progressTracker.initializeTaskTracking(taskId);
    }

    // Initialize health score
    this.healthScores.set(taskId, 100);

    this.emit('monitoring:started', { taskId, config: fullConfig });

    this.logger.info('Task monitoring started', {
      taskId,
      level: fullConfig.scope.monitoringLevel,
      features: {
        progress: fullConfig.scope.enableProgressTracking,
        analytics: fullConfig.scope.enablePerformanceAnalytics,
        notifications: fullConfig.scope.enableNotifications,
      },
    });
  }

  /**
   * Get comprehensive task status with all monitoring data
   */
  async getIntegratedTaskStatus(
    taskId: string,
  ): Promise<IntegratedTaskStatus | null> {
    const config = this.monitoredTasks.get(taskId);
    if (!config) return null;

    // Get core task data
    const task = taskStatusMonitor.getTaskStatus(taskId);
    if (!task) return null;

    // Get progress data
    const progressMetrics = progressTracker.getTaskProgressMetrics(taskId);
    const progressEstimate = progressTracker.predictCompletionTime(taskId);

    // Get performance data
    const dashboardData = performanceAnalyticsDashboard.getDashboardData();

    // Get agent data
    const agent = task.assignedAgent
      ? taskStatusMonitor.getAgentStatus(task.assignedAgent)
      : undefined;

    // Calculate analytics
    const analytics = await this.calculateTaskAnalytics(
      taskId,
      task,
      progressMetrics,
      config,
    );

    const integratedStatus: IntegratedTaskStatus = {
      task,
      status: task.status,

      progress: {
        overall: progressMetrics?.overallProgress || task.progress,
        milestones:
          progressMetrics?.checkpoints.milestones.map((m) => ({
            name: m.name,
            completed: m.completed,
            progress: m.progress,
          })) || [],
        velocity: progressMetrics?.velocity || 0,
        estimatedCompletion: progressEstimate?.estimatedCompletion || null,
        timeRemaining: progressEstimate
          ? Math.max(
              0,
              progressEstimate.estimatedCompletion.getTime() - Date.now(),
            )
          : 0,
      },

      performance: {
        executionTime:
          task.actualDuration ||
          (task.startTime ? Date.now() - task.startTime.getTime() : 0),
        efficiency: progressMetrics?.efficiency || 1,
        resourceUsage: {
          cpu: 0, // Would be integrated with actual system monitoring
          memory: process.memoryUsage().heapUsed / 1024 / 1024,
        },
        throughput: agent?.performance.taskThroughput || 0,
        errorRate:
          task.errorCount /
          Math.max(1, task.errorCount + (agent?.completedTasks || 0)),
      },

      agent: agent
        ? {
            id: agent.id,
            status: agent.status,
            performance: agent.performance,
          }
        : undefined,

      analytics,
    };

    this.emit('status:integrated', { taskId, status: integratedStatus });

    return integratedStatus;
  }

  /**
   * Get monitoring dashboard with all active tasks
   */
  async getMonitoringDashboard(): Promise<{
    activeTasks: IntegratedTaskStatus[];
    systemMetrics: {
      totalMonitoredTasks: number;
      healthyTasks: number;
      atRiskTasks: number;
      failingTasks: number;
      averageHealthScore: number;
      systemThroughput: number;
      systemEfficiency: number;
    };
    alerts: Array<{
      taskId: string;
      type:
        | 'progress_stall'
        | 'performance_degradation'
        | 'high_error_rate'
        | 'time_overrun';
      severity: 'low' | 'medium' | 'high' | 'critical';
      message: string;
      timestamp: Date;
    }>;
    recommendations: string[];
  }> {
    const activeTasks: IntegratedTaskStatus[] = [];
    const alerts: any[] = [];

    for (const taskId of this.monitoredTasks.keys()) {
      const status = await this.getIntegratedTaskStatus(taskId);
      if (status) {
        activeTasks.push(status);

        // Generate alerts based on thresholds
        const taskAlerts = await this.generateTaskAlerts(taskId, status);
        alerts.push(...taskAlerts);
      }
    }

    // Calculate system metrics
    const healthScores = Array.from(this.healthScores.values());
    const averageHealthScore =
      healthScores.length > 0
        ? healthScores.reduce((sum, score) => sum + score, 0) /
          healthScores.length
        : 100;

    const healthyTasks = healthScores.filter((score) => score >= 80).length;
    const atRiskTasks = healthScores.filter(
      (score) => score >= 60 && score < 80,
    ).length;
    const failingTasks = healthScores.filter((score) => score < 60).length;

    const systemPerformance = performanceAnalyticsDashboard.getDashboardData();

    // Generate system-level recommendations
    const recommendations = this.generateSystemRecommendations(
      activeTasks,
      alerts,
    );

    return {
      activeTasks,
      systemMetrics: {
        totalMonitoredTasks: this.monitoredTasks.size,
        healthyTasks,
        atRiskTasks,
        failingTasks,
        averageHealthScore,
        systemThroughput: systemPerformance.systemOverview.systemEfficiency,
        systemEfficiency: systemPerformance.systemOverview.agentUtilization,
      },
      alerts,
      recommendations,
    };
  }

  /**
   * Update task progress with integrated monitoring
   */
  async updateTaskProgress(
    taskId: string,
    progress: number,
    options: {
      milestone?: string;
      operation?: string;
      context?: Record<string, unknown>;
    } = {},
  ): Promise<void> {
    const config = this.monitoredTasks.get(taskId);
    if (!config) return;

    // Update core task status
    await taskStatusMonitor.updateTaskStatus(
      taskId,
      'in_progress' as TaskStatus,
      {
        progress,
        context: options.context,
      },
    );

    // Update progress tracking if enabled
    if (config.scope.enableProgressTracking) {
      if (options.milestone) {
        await progressTracker.addCheckpoint(taskId, {
          name: options.milestone,
          description: options.milestone,
          granularity: ProgressGranularity.MILESTONE,
          progress,
          metadata: options.context || {},
        });
      } else if (options.operation) {
        await progressTracker.addCheckpoint(taskId, {
          name: options.operation,
          description: options.operation,
          granularity: ProgressGranularity.OPERATION,
          progress,
          metadata: options.context || {},
        });
      }
    }

    // Update health score
    await this.updateHealthScore(taskId);

    this.emit('progress:updated', { taskId, progress, options });
  }

  /**
   * Complete task monitoring
   */
  async completeTask(
    taskId: string,
    result: 'success' | 'failure',
    details?: Record<string, unknown>,
  ): Promise<void> {
    const config = this.monitoredTasks.get(taskId);
    if (!config) return;

    const task = taskStatusMonitor.getTaskStatus(taskId);
    if (!task) return;

    const actualDuration = task.startTime
      ? Date.now() - task.startTime.getTime()
      : 0;
    const finalStatus =
      result === 'success'
        ? ('completed' as TaskStatus)
        : ('failed' as TaskStatus);

    // Update core status
    await taskStatusMonitor.updateTaskStatus(taskId, finalStatus, {
      context: details,
    });

    // Complete progress tracking
    if (config.scope.enableProgressTracking) {
      progressTracker.completeTask(taskId, actualDuration);
    }

    // Record performance metrics
    if (config.scope.enablePerformanceAnalytics) {
      performanceAnalyticsDashboard.onTaskEvent(
        result === 'success' ? 'completed' : 'failed',
        {
          task,
          agent: task.assignedAgent
            ? taskStatusMonitor.getAgentStatus(task.assignedAgent)
            : undefined,
        },
      );
    }

    // Generate completion report
    const finalStatus_integrated = await this.getIntegratedTaskStatus(taskId);

    this.emit('task:completed', {
      taskId,
      result,
      duration: actualDuration,
      finalStatus: finalStatus_integrated,
      details,
    });

    // Clean up monitoring resources
    this.monitoredTasks.delete(taskId);
    this.healthScores.delete(taskId);

    this.logger.info('Task monitoring completed', {
      taskId,
      result,
      duration: actualDuration,
      finalHealthScore: this.healthScores.get(taskId),
    });
  }

  // Private methods

  private setupEventIntegration(): void {
    // Integrate with task status monitor
    taskStatusMonitor.on('task:status-changed', async (data) => {
      if (this.monitoredTasks.has(data.task.id)) {
        await this.updateHealthScore(data.task.id);
        this.emit('integrated:status-changed', data);
      }
    });

    // Integrate with progress tracker
    progressTracker.on('milestone:completed', (data) => {
      if (this.monitoredTasks.has(data.taskId)) {
        this.emit('integrated:milestone-completed', data);
      }
    });

    progressTracker.on('bottleneck:detected', (data) => {
      if (this.monitoredTasks.has(data.taskId)) {
        this.emit('integrated:bottleneck-detected', data);
      }
    });
  }

  private setupPeriodicMonitoring(): void {
    this.monitoringInterval = setInterval(async () => {
      await this.performPeriodicHealthChecks();
    }, 60000); // Every minute
  }

  private async performPeriodicHealthChecks(): Promise<void> {
    try {
      for (const taskId of this.monitoredTasks.keys()) {
        await this.updateHealthScore(taskId);

        const status = await this.getIntegratedTaskStatus(taskId);
        if (status) {
          const alerts = await this.generateTaskAlerts(taskId, status);
          if (alerts.length > 0) {
            this.emit('health:alerts', { taskId, alerts });
          }
        }
      }
    } catch (error) {
      this.logger.error('Periodic health check failed', { error });
    }
  }

  private async calculateTaskAnalytics(
    taskId: string,
    task: TaskMetadata,
    progressMetrics: any,
    config: TaskMonitoringConfig,
  ): Promise<IntegratedTaskStatus['analytics']> {
    const bottleneckAnalysis = progressTracker.analyzeBottlenecks(taskId);
    const recommendations = bottleneckAnalysis.recommendations.slice(0, 3);

    // Calculate risk factors
    const riskFactors: string[] = [];
    if (progressMetrics?.velocity < config.thresholds.progressStall) {
      riskFactors.push('Low progress velocity');
    }
    if (task.errorCount > 0) {
      riskFactors.push('Recent errors detected');
    }
    if (
      task.startTime &&
      Date.now() - task.startTime.getTime() >
        (task.estimatedDuration || 300000) * 1.5
    ) {
      riskFactors.push('Execution time exceeded estimate');
    }

    const healthScore = this.healthScores.get(taskId) || 100;

    return {
      bottlenecks: bottleneckAnalysis.bottlenecks.map((b) => b.name),
      recommendations,
      riskFactors,
      healthScore,
    };
  }

  private async updateHealthScore(taskId: string): Promise<void> {
    const task = taskStatusMonitor.getTaskStatus(taskId);
    const config = this.monitoredTasks.get(taskId);

    if (!task || !config) return;

    let healthScore = 100;

    // Reduce score based on errors
    healthScore -= Math.min(30, task.errorCount * 10);

    // Reduce score based on time overruns
    if (task.startTime && task.estimatedDuration) {
      const elapsed = Date.now() - task.startTime.getTime();
      const overrun =
        (elapsed - task.estimatedDuration) / task.estimatedDuration;
      if (overrun > 0) {
        healthScore -= Math.min(25, overrun * 50);
      }
    }

    // Reduce score based on progress stalls
    if (task.lastUpdate) {
      const timeSinceUpdate = Date.now() - task.lastUpdate.getTime();
      const stallThreshold = config.thresholds.progressStall * 60 * 1000;
      if (timeSinceUpdate > stallThreshold) {
        healthScore -= Math.min(
          20,
          ((timeSinceUpdate - stallThreshold) / stallThreshold) * 20,
        );
      }
    }

    // Ensure health score is within bounds
    healthScore = Math.max(0, Math.min(100, healthScore));

    this.healthScores.set(taskId, healthScore);
  }

  private async generateTaskAlerts(
    taskId: string,
    status: IntegratedTaskStatus,
  ): Promise<any[]> {
    const config = this.monitoredTasks.get(taskId);
    if (!config) return [];

    const alerts: any[] = [];
    const now = new Date();

    // Progress stall alert
    if (status.progress.velocity < config.thresholds.progressStall) {
      alerts.push({
        taskId,
        type: 'progress_stall',
        severity: 'medium',
        message: `Task progress has stalled (velocity: ${status.progress.velocity.toFixed(2)})`,
        timestamp: now,
      });
    }

    // Performance degradation alert
    if (
      status.performance.efficiency <
      1 - config.thresholds.performanceDegradation / 100
    ) {
      alerts.push({
        taskId,
        type: 'performance_degradation',
        severity: 'high',
        message: `Task performance has degraded (efficiency: ${(status.performance.efficiency * 100).toFixed(1)}%)`,
        timestamp: now,
      });
    }

    // High error rate alert
    if (status.performance.errorRate > config.thresholds.errorRate) {
      alerts.push({
        taskId,
        type: 'high_error_rate',
        severity: 'critical',
        message: `High error rate detected (${(status.performance.errorRate * 100).toFixed(1)}%)`,
        timestamp: now,
      });
    }

    return alerts;
  }

  private generateSystemRecommendations(
    tasks: IntegratedTaskStatus[],
    alerts: any[],
  ): string[] {
    const recommendations: string[] = [];

    // Analyze common issues
    const stalledTasks = tasks.filter((t) => t.progress.velocity < 1).length;
    const highErrorTasks = tasks.filter(
      (t) => t.performance.errorRate > 0.1,
    ).length;
    const overdueTasks = tasks.filter(
      (t) => t.progress.timeRemaining < 0,
    ).length;

    if (stalledTasks > tasks.length * 0.3) {
      recommendations.push(
        'Consider reviewing task complexity and breaking down large tasks',
      );
    }

    if (highErrorTasks > 0) {
      recommendations.push(
        'Investigate and address common error patterns across tasks',
      );
    }

    if (overdueTasks > 0) {
      recommendations.push(
        'Review time estimation accuracy and resource allocation',
      );
    }

    if (alerts.length > 10) {
      recommendations.push(
        'System is experiencing high alert volume - consider reducing monitoring sensitivity',
      );
    }

    return recommendations;
  }

  private mergeConfig(
    defaultConfig: TaskMonitoringConfig,
    override: Partial<TaskMonitoringConfig>,
  ): TaskMonitoringConfig {
    return {
      scope: { ...defaultConfig.scope, ...override.scope },
      thresholds: { ...defaultConfig.thresholds, ...override.thresholds },
      reporting: { ...defaultConfig.reporting, ...override.reporting },
    };
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    this.removeAllListeners();
    this.monitoredTasks.clear();
    this.healthScores.clear();

    this.logger.info('TaskMonitor destroyed');
  }
}

/**
 * Singleton instance for global access
 */
export const taskMonitor = new TaskMonitor();
