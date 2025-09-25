/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { EventEmitter } from 'node:events';
import { performance } from 'node:perf_hooks';
import winston from 'winston';
import type {
  ITask,
  ITaskStatusMonitor,
  TaskMetrics,
  StatusSummary,
  AlertCondition,
  AlertCallback,
} from '../interfaces/TaskInterfaces.js';
import {
  TaskStatus,
  TaskType,
  TaskPriority,
} from '../interfaces/TaskInterfaces.js';

/**
 * Monitored task data with metrics
 */
interface MonitoredTask {
  /** The task being monitored */
  task: ITask;
  /** Registration timestamp */
  registeredAt: Date;
  /** Last status check timestamp */
  lastChecked: Date;
  /** Status change history */
  statusHistory: StatusHistoryEntry[];
  /** Current metrics snapshot */
  currentMetrics: TaskMetrics;
  /** Metrics history for trend analysis */
  metricsHistory: TaskMetrics[];
  /** Performance tracking */
  performance: TaskPerformanceData;
}

/**
 * Status change history entry
 */
interface StatusHistoryEntry {
  /** Previous status */
  from: TaskStatus;
  /** New status */
  to: TaskStatus;
  /** Change timestamp */
  timestamp: Date;
  /** Change reason or trigger */
  reason?: string;
}

/**
 * Task performance tracking data
 */
interface TaskPerformanceData {
  /** Status change timestamps */
  statusTimestamps: Record<TaskStatus, Date | null>;
  /** Time spent in each status */
  timeInStatus: Record<TaskStatus, number>;
  /** Performance indicators */
  indicators: PerformanceIndicators;
}

/**
 * Performance indicators for monitoring
 */
interface PerformanceIndicators {
  /** Queue wait time in milliseconds */
  queueWaitTime: number;
  /** Execution time in milliseconds */
  executionTime: number;
  /** Total lifecycle time in milliseconds */
  totalLifecycleTime: number;
  /** Number of status transitions */
  statusTransitions: number;
  /** Performance score (0-100) */
  performanceScore: number;
}

/**
 * Active alert subscription
 */
interface AlertSubscription {
  /** Subscription ID */
  id: string;
  /** Alert condition */
  condition: AlertCondition;
  /** Alert callback */
  callback: AlertCallback;
  /** Subscription timestamp */
  createdAt: Date;
  /** Number of times alert was triggered */
  triggerCount: number;
  /** Last trigger timestamp */
  lastTriggered?: Date;
}

/**
 * Monitor configuration options
 */
export interface MonitorConfig {
  /** Monitoring update interval in milliseconds */
  updateInterval: number;
  /** Maximum monitored tasks before cleanup */
  maxMonitoredTasks: number;
  /** Metrics history retention count per task */
  metricsHistorySize: number;
  /** Status history retention count per task */
  statusHistorySize: number;
  /** Enable performance trend analysis */
  enableTrendAnalysis: boolean;
  /** Health check configuration */
  healthCheck: HealthCheckConfig;
  /** Alerting configuration */
  alerting: AlertingConfig;
}

/**
 * Health check configuration
 */
export interface HealthCheckConfig {
  /** Enable automatic health checks */
  enabled: boolean;
  /** Health check interval in milliseconds */
  interval: number;
  /** Health score calculation weights */
  weights: HealthScoreWeights;
  /** Thresholds for health scoring */
  thresholds: HealthThresholds;
}

/**
 * Health score calculation weights
 */
export interface HealthScoreWeights {
  /** Weight for success rate */
  successRate: number;
  /** Weight for average execution time */
  executionTime: number;
  /** Weight for memory usage */
  memoryUsage: number;
  /** Weight for error frequency */
  errorFrequency: number;
}

/**
 * Health check thresholds
 */
export interface HealthThresholds {
  /** Excellent health threshold */
  excellent: number;
  /** Good health threshold */
  good: number;
  /** Warning health threshold */
  warning: number;
  /** Critical health threshold */
  critical: number;
}

/**
 * Alerting configuration
 */
export interface AlertingConfig {
  /** Enable alerting system */
  enabled: boolean;
  /** Maximum alerts per condition per hour */
  maxAlertsPerHour: number;
  /** Alert suppression rules */
  suppression: AlertSuppressionConfig;
}

/**
 * Alert suppression configuration
 */
export interface AlertSuppressionConfig {
  /** Suppress duplicate alerts within time window */
  duplicateWindow: number;
  /** Suppress alerts during maintenance windows */
  maintenanceWindows: MaintenanceWindow[];
}

/**
 * Maintenance window definition
 */
export interface MaintenanceWindow {
  /** Window start time (HH:MM format) */
  start: string;
  /** Window end time (HH:MM format) */
  end: string;
  /** Days of week (0=Sunday, 6=Saturday) */
  daysOfWeek: number[];
  /** Window timezone */
  timezone: string;
}

/**
 * Monitor event types
 */
export enum MonitorEvent {
  TASK_REGISTERED = 'task_registered',
  TASK_UNREGISTERED = 'task_unregistered',
  STATUS_CHANGED = 'status_changed',
  METRICS_UPDATED = 'metrics_updated',
  ALERT_TRIGGERED = 'alert_triggered',
  HEALTH_UPDATED = 'health_updated',
  PERFORMANCE_ANOMALY = 'performance_anomaly',
  MONITOR_ERROR = 'monitor_error',
}

/**
 * Default monitor configuration
 */
const DEFAULT_CONFIG: MonitorConfig = {
  updateInterval: 5000, // 5 seconds
  maxMonitoredTasks: 10000,
  metricsHistorySize: 100,
  statusHistorySize: 50,
  enableTrendAnalysis: true,
  healthCheck: {
    enabled: true,
    interval: 30000, // 30 seconds
    weights: {
      successRate: 0.4,
      executionTime: 0.3,
      memoryUsage: 0.2,
      errorFrequency: 0.1,
    },
    thresholds: {
      excellent: 90,
      good: 75,
      warning: 60,
      critical: 40,
    },
  },
  alerting: {
    enabled: true,
    maxAlertsPerHour: 10,
    suppression: {
      duplicateWindow: 300000, // 5 minutes
      maintenanceWindows: [],
    },
  },
};

/**
 * Real-time task status monitoring system
 *
 * Features:
 * - Real-time task status and metrics tracking
 * - Comprehensive performance analytics
 * - Configurable alerting system with suppression
 * - Health scoring and trend analysis
 * - Status change history and audit trails
 * - Performance anomaly detection
 * - Memory-efficient with automatic cleanup
 * - Event-driven architecture for integration
 */
export class TaskStatusMonitor extends EventEmitter implements ITaskStatusMonitor {
  private readonly logger: winston.Logger;
  private readonly config: MonitorConfig;
  private readonly monitoredTasks = new Map<string, MonitoredTask>();
  private readonly alertSubscriptions = new Map<string, AlertSubscription>();
  private readonly alertTriggerHistory = new Map<string, Date[]>();

  private isRunning = false;
  private updateTimer?: NodeJS.Timeout;
  private healthCheckTimer?: NodeJS.Timeout;

  // Statistics and health tracking
  private healthScore = 100;
  private lastHealthUpdate = new Date();
  private monitorStats = {
    totalRegistered: 0,
    currentlyMonitored: 0,
    alertsTriggered: 0,
    averageHealthScore: 100,
    lastUpdate: new Date(),
  };

  constructor(config: Partial<MonitorConfig> = {}) {
    super();

    this.config = { ...DEFAULT_CONFIG, ...config };

    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      defaultMeta: { component: 'TaskStatusMonitor' },
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          ),
        }),
      ],
    });

    this.logger.info('Task status monitor initialized', {
      config: this.config,
    });
  }

  /**
   * Start monitoring task status changes
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      this.logger.warn('Monitor already running, ignoring start request');
      return;
    }

    this.isRunning = true;

    // Start update timer
    if (this.config.updateInterval > 0) {
      this.updateTimer = setInterval(() => {
        this.updateAllTaskMetrics().catch(error => {
          this.logger.error('Failed to update task metrics', {
            error: error instanceof Error ? error.message : String(error),
          });
          this.emit(MonitorEvent.MONITOR_ERROR, error);
        });
      }, this.config.updateInterval);
    }

    // Start health check timer
    if (this.config.healthCheck.enabled && this.config.healthCheck.interval > 0) {
      this.healthCheckTimer = setInterval(() => {
        this.performHealthCheck().catch(error => {
          this.logger.error('Health check failed', {
            error: error instanceof Error ? error.message : String(error),
          });
          this.emit(MonitorEvent.MONITOR_ERROR, error);
        });
      }, this.config.healthCheck.interval);
    }

    this.logger.info('Task status monitor started');
  }

  /**
   * Stop monitoring task status changes
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      this.logger.warn('Monitor not running, ignoring stop request');
      return;
    }

    // Stop timers
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
      this.updateTimer = undefined;
    }

    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = undefined;
    }

    this.isRunning = false;

    this.logger.info('Task status monitor stopped');
  }

  /**
   * Register task for monitoring
   */
  async registerTask(task: ITask): Promise<void> {
    try {
      if (this.monitoredTasks.has(task.id)) {
        this.logger.debug('Task already registered, updating', { taskId: task.id });
        const monitored = this.monitoredTasks.get(task.id)!;
        monitored.task = task;
        monitored.lastChecked = new Date();
        return;
      }

      // Check monitoring limits
      if (this.monitoredTasks.size >= this.config.maxMonitoredTasks) {
        await this.cleanupOldTasks();
      }

      // Create monitoring data
      const now = new Date();
      const monitored: MonitoredTask = {
        task,
        registeredAt: now,
        lastChecked: now,
        statusHistory: [],
        currentMetrics: this.createInitialMetrics(task),
        metricsHistory: [],
        performance: this.createInitialPerformanceData(),
      };

      this.monitoredTasks.set(task.id, monitored);
      this.monitorStats.totalRegistered++;
      this.monitorStats.currentlyMonitored = this.monitoredTasks.size;

      this.emit(MonitorEvent.TASK_REGISTERED, task);

      this.logger.debug('Task registered for monitoring', {
        taskId: task.id,
        taskName: task.name,
        status: task.status,
        totalMonitored: this.monitoredTasks.size,
      });

    } catch (error) {
      this.logger.error('Failed to register task for monitoring', {
        taskId: task.id,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Unregister task from monitoring
   */
  async unregisterTask(taskId: string): Promise<void> {
    const monitored = this.monitoredTasks.get(taskId);
    if (!monitored) {
      this.logger.debug('Task not found for unregistering', { taskId });
      return;
    }

    this.monitoredTasks.delete(taskId);
    this.monitorStats.currentlyMonitored = this.monitoredTasks.size;

    this.emit(MonitorEvent.TASK_UNREGISTERED, monitored.task);

    this.logger.debug('Task unregistered from monitoring', {
      taskId,
      totalMonitored: this.monitoredTasks.size,
    });
  }

  /**
   * Get current status of monitored task
   */
  getTaskStatus(taskId: string): TaskStatus | null {
    const monitored = this.monitoredTasks.get(taskId);
    return monitored ? monitored.task.status : null;
  }

  /**
   * Get real-time metrics for monitored task
   */
  getTaskMetrics(taskId: string): TaskMetrics | null {
    const monitored = this.monitoredTasks.get(taskId);
    return monitored ? { ...monitored.currentMetrics } : null;
  }

  /**
   * Get status summary for all monitored tasks
   */
  async getStatusSummary(): Promise<StatusSummary> {
    const byStatus: Record<TaskStatus, number> = {
      [TaskStatus.PENDING]: 0,
      [TaskStatus.IN_PROGRESS]: 0,
      [TaskStatus.COMPLETED]: 0,
      [TaskStatus.FAILED]: 0,
      [TaskStatus.CANCELLED]: 0,
      [TaskStatus.BLOCKED]: 0,
      [TaskStatus.RETRYING]: 0,
    };

    const byType: Record<TaskType, number> = {
      [TaskType.CODE_GENERATION]: 0,
      [TaskType.CODE_ANALYSIS]: 0,
      [TaskType.TESTING]: 0,
      [TaskType.DOCUMENTATION]: 0,
      [TaskType.BUILD]: 0,
      [TaskType.DEPLOYMENT]: 0,
      [TaskType.REFACTORING]: 0,
      [TaskType.BUG_FIX]: 0,
      [TaskType.FEATURE]: 0,
      [TaskType.MAINTENANCE]: 0,
      [TaskType.SECURITY]: 0,
      [TaskType.PERFORMANCE]: 0,
    };

    const byPriority: Record<TaskPriority, number> = {
      [TaskPriority.CRITICAL]: 0,
      [TaskPriority.HIGH]: 0,
      [TaskPriority.MEDIUM]: 0,
      [TaskPriority.LOW]: 0,
      [TaskPriority.BACKGROUND]: 0,
    };

    let totalCompletionTime = 0;
    let completedTasks = 0;
    let activeTasks = 0;

    for (const monitored of this.monitoredTasks.values()) {
      const { task, currentMetrics, performance } = monitored;

      // Count by status
      byStatus[task.status]++;

      // Count by type
      byType[task.type]++;

      // Count by priority
      byPriority[task.priority]++;

      // Track active tasks
      if (task.status === TaskStatus.IN_PROGRESS || task.status === TaskStatus.RETRYING) {
        activeTasks++;
      }

      // Calculate completion times
      if (task.status === TaskStatus.COMPLETED && currentMetrics.duration) {
        totalCompletionTime += currentMetrics.duration;
        completedTasks++;
      }
    }

    return {
      byStatus,
      byType,
      byPriority,
      totalTasks: this.monitoredTasks.size,
      activeTasks,
      averageCompletionTime: completedTasks > 0 ? totalCompletionTime / completedTasks : 0,
      healthScore: this.healthScore,
    };
  }

  /**
   * Set up status alerts for specific conditions
   */
  setupAlert(condition: AlertCondition, callback: AlertCallback): string {
    const alertId = `alert_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    const subscription: AlertSubscription = {
      id: alertId,
      condition,
      callback,
      createdAt: new Date(),
      triggerCount: 0,
    };

    this.alertSubscriptions.set(alertId, subscription);

    this.logger.info('Alert subscription created', {
      alertId,
      condition,
    });

    return alertId;
  }

  /**
   * Remove status alert
   */
  removeAlert(alertId: string): boolean {
    const removed = this.alertSubscriptions.delete(alertId);

    if (removed) {
      this.alertTriggerHistory.delete(alertId);
      this.logger.info('Alert subscription removed', { alertId });
    }

    return removed;
  }

  /**
   * Update metrics for all monitored tasks
   */
  private async updateAllTaskMetrics(): Promise<void> {
    const updatePromises: Array<Promise<void>> = [];

    for (const [taskId, monitored] of this.monitoredTasks.entries()) {
      updatePromises.push(this.updateTaskMetrics(taskId, monitored));
    }

    await Promise.allSettled(updatePromises);

    this.monitorStats.lastUpdate = new Date();
  }

  /**
   * Update metrics for a specific task
   */
  private async updateTaskMetrics(taskId: string, monitored: MonitoredTask): Promise<void> {
    try {
      const { task } = monitored;
      const now = new Date();
      const previousStatus = monitored.currentMetrics ? task.status : null;

      // Update current metrics
      const updatedMetrics = this.calculateTaskMetrics(task, monitored);
      monitored.currentMetrics = updatedMetrics;
      monitored.lastChecked = now;

      // Check for status changes
      if (previousStatus !== null && previousStatus !== task.status) {
        this.recordStatusChange(monitored, previousStatus, task.status);
      }

      // Add to metrics history
      if (monitored.metricsHistory.length >= this.config.metricsHistorySize) {
        monitored.metricsHistory.shift(); // Remove oldest
      }
      monitored.metricsHistory.push({ ...updatedMetrics });

      // Update performance data
      this.updatePerformanceData(monitored);

      // Check alerts
      if (this.config.alerting.enabled) {
        await this.checkAlerts(taskId, task, updatedMetrics);
      }

      // Emit metrics update event
      this.emit(MonitorEvent.METRICS_UPDATED, task, updatedMetrics);

    } catch (error) {
      this.logger.error('Failed to update task metrics', {
        taskId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Calculate current metrics for a task
   */
  private calculateTaskMetrics(task: ITask, monitored: MonitoredTask): TaskMetrics {
    const now = new Date();
    const startTime = task.result?.metrics.startTime || monitored.registeredAt;
    const duration = task.result?.metrics.duration || (now.getTime() - startTime.getTime());

    // Get system resource usage (simplified)
    const memoryUsage = process.memoryUsage().heapUsed;
    const cpuUsage = this.estimateCpuUsage();

    // Calculate performance score based on various factors
    const performanceScore = this.calculatePerformanceScore(task, duration, memoryUsage);

    return {
      startTime,
      endTime: task.status === TaskStatus.COMPLETED || task.status === TaskStatus.FAILED
        ? new Date()
        : undefined,
      duration,
      memoryUsage,
      cpuUsage,
      retryCount: task.result?.metrics.retryCount || 0,
      performanceScore,
    };
  }

  /**
   * Calculate performance score for a task
   */
  private calculatePerformanceScore(task: ITask, duration: number, memoryUsage: number): number {
    let score = 100;

    // Penalize long execution times
    const expectedDuration = this.getExpectedDuration(task.type);
    if (duration > expectedDuration) {
      score -= Math.min(30, (duration - expectedDuration) / expectedDuration * 20);
    }

    // Penalize high memory usage
    const expectedMemory = this.getExpectedMemoryUsage(task.type);
    if (memoryUsage > expectedMemory) {
      score -= Math.min(20, (memoryUsage - expectedMemory) / expectedMemory * 10);
    }

    // Consider task status
    switch (task.status) {
      case TaskStatus.FAILED:
        score -= 40;
        break;
      case TaskStatus.CANCELLED:
        score -= 20;
        break;
      case TaskStatus.BLOCKED:
        score -= 15;
        break;
      case TaskStatus.RETRYING:
        score -= 10;
        break;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Get expected duration for task type (simplified heuristic)
   */
  private getExpectedDuration(type: TaskType): number {
    const durations: Record<TaskType, number> = {
      [TaskType.CODE_GENERATION]: 30000,
      [TaskType.CODE_ANALYSIS]: 15000,
      [TaskType.TESTING]: 45000,
      [TaskType.DOCUMENTATION]: 20000,
      [TaskType.BUILD]: 60000,
      [TaskType.DEPLOYMENT]: 120000,
      [TaskType.REFACTORING]: 25000,
      [TaskType.BUG_FIX]: 20000,
      [TaskType.FEATURE]: 40000,
      [TaskType.MAINTENANCE]: 10000,
      [TaskType.SECURITY]: 35000,
      [TaskType.PERFORMANCE]: 50000,
    };

    return durations[type] || 30000;
  }

  /**
   * Get expected memory usage for task type (simplified heuristic)
   */
  private getExpectedMemoryUsage(type: TaskType): number {
    const memoryUsages: Record<TaskType, number> = {
      [TaskType.CODE_GENERATION]: 50 * 1024 * 1024, // 50MB
      [TaskType.CODE_ANALYSIS]: 30 * 1024 * 1024,   // 30MB
      [TaskType.TESTING]: 40 * 1024 * 1024,         // 40MB
      [TaskType.DOCUMENTATION]: 20 * 1024 * 1024,   // 20MB
      [TaskType.BUILD]: 100 * 1024 * 1024,          // 100MB
      [TaskType.DEPLOYMENT]: 80 * 1024 * 1024,      // 80MB
      [TaskType.REFACTORING]: 35 * 1024 * 1024,     // 35MB
      [TaskType.BUG_FIX]: 25 * 1024 * 1024,         // 25MB
      [TaskType.FEATURE]: 60 * 1024 * 1024,         // 60MB
      [TaskType.MAINTENANCE]: 15 * 1024 * 1024,     // 15MB
      [TaskType.SECURITY]: 45 * 1024 * 1024,        // 45MB
      [TaskType.PERFORMANCE]: 70 * 1024 * 1024,     // 70MB
    };

    return memoryUsages[type] || 50 * 1024 * 1024;
  }

  /**
   * Estimate CPU usage (simplified)
   */
  private estimateCpuUsage(): number {
    const cpuUsage = process.cpuUsage();
    const totalUsage = (cpuUsage.user + cpuUsage.system) / 1000000; // Convert to seconds
    return Math.min(100, totalUsage * 10); // Simplified percentage
  }

  /**
   * Record status change in history
   */
  private recordStatusChange(monitored: MonitoredTask, from: TaskStatus, to: TaskStatus): void {
    const entry: StatusHistoryEntry = {
      from,
      to,
      timestamp: new Date(),
    };

    // Add to status history
    if (monitored.statusHistory.length >= this.config.statusHistorySize) {
      monitored.statusHistory.shift(); // Remove oldest
    }
    monitored.statusHistory.push(entry);

    // Update performance tracking
    const { performance } = monitored;
    const now = Date.now();

    // Record timestamp for new status
    performance.statusTimestamps[to] = new Date();

    // Calculate time spent in previous status
    if (performance.statusTimestamps[from]) {
      const timeSpent = now - performance.statusTimestamps[from]!.getTime();
      performance.timeInStatus[from] += timeSpent;
    }

    performance.indicators.statusTransitions++;

    this.emit(MonitorEvent.STATUS_CHANGED, monitored.task, from, to);

    this.logger.debug('Task status changed', {
      taskId: monitored.task.id,
      from,
      to,
      transitionCount: performance.indicators.statusTransitions,
    });
  }

  /**
   * Update performance data for task
   */
  private updatePerformanceData(monitored: MonitoredTask): void {
    const { performance, registeredAt } = monitored;
    const now = Date.now();

    // Update total lifecycle time
    performance.indicators.totalLifecycleTime = now - registeredAt.getTime();

    // Update queue wait time (time from pending to in_progress)
    const pendingTime = performance.statusTimestamps[TaskStatus.PENDING];
    const inProgressTime = performance.statusTimestamps[TaskStatus.IN_PROGRESS];
    if (pendingTime && inProgressTime) {
      performance.indicators.queueWaitTime = inProgressTime.getTime() - pendingTime.getTime();
    }

    // Update execution time (time from in_progress to completion/failure)
    if (inProgressTime) {
      const completionTime = performance.statusTimestamps[TaskStatus.COMPLETED] ||
                           performance.statusTimestamps[TaskStatus.FAILED];
      if (completionTime) {
        performance.indicators.executionTime = completionTime.getTime() - inProgressTime.getTime();
      }
    }

    // Update performance score based on all indicators
    performance.indicators.performanceScore = this.calculateOverallPerformanceScore(performance);
  }

  /**
   * Calculate overall performance score
   */
  private calculateOverallPerformanceScore(performance: TaskPerformanceData): number {
    const { indicators } = performance;
    let score = 100;

    // Factor in queue wait time
    if (indicators.queueWaitTime > 60000) { // > 1 minute
      score -= Math.min(20, indicators.queueWaitTime / 60000 * 5);
    }

    // Factor in execution efficiency
    if (indicators.executionTime > 300000) { // > 5 minutes
      score -= Math.min(30, indicators.executionTime / 300000 * 10);
    }

    // Factor in status transitions (too many might indicate problems)
    if (indicators.statusTransitions > 5) {
      score -= Math.min(15, (indicators.statusTransitions - 5) * 3);
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Check alerts for task and metrics
   */
  private async checkAlerts(taskId: string, task: ITask, metrics: TaskMetrics): Promise<void> {
    for (const subscription of this.alertSubscriptions.values()) {
      try {
        if (this.shouldTriggerAlert(subscription, task, metrics)) {
          await this.triggerAlert(subscription, taskId, task, metrics);
        }
      } catch (error) {
        this.logger.error('Alert check failed', {
          alertId: subscription.id,
          taskId,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }

  /**
   * Check if alert should be triggered
   */
  private shouldTriggerAlert(subscription: AlertSubscription, task: ITask, metrics: TaskMetrics): boolean {
    const { condition } = subscription;

    // Check task ID pattern
    if (condition.taskIdPattern) {
      const regex = new RegExp(condition.taskIdPattern.replace('*', '.*'));
      if (!regex.test(task.id)) {
        return false;
      }
    }

    // Check status
    if (condition.status && task.status !== condition.status) {
      return false;
    }

    // Check type
    if (condition.type && task.type !== condition.type) {
      return false;
    }

    // Check priority
    if (condition.priority && task.priority !== condition.priority) {
      return false;
    }

    // Check execution time threshold
    if (condition.executionTimeThreshold && metrics.duration) {
      if (metrics.duration < condition.executionTimeThreshold) {
        return false;
      }
    }

    // Check memory threshold
    if (condition.memoryThreshold) {
      if (metrics.memoryUsage < condition.memoryThreshold) {
        return false;
      }
    }

    // Check custom condition
    if (condition.customCondition) {
      if (!condition.customCondition(task, metrics)) {
        return false;
      }
    }

    // Check alert rate limiting
    return this.checkAlertRateLimit(subscription);
  }

  /**
   * Check alert rate limiting
   */
  private checkAlertRateLimit(subscription: AlertSubscription): boolean {
    const now = new Date();
    const hourAgo = new Date(now.getTime() - 3600000); // 1 hour ago

    // Get trigger history for this alert
    const triggerHistory = this.alertTriggerHistory.get(subscription.id) || [];

    // Remove old triggers
    const recentTriggers = triggerHistory.filter(trigger => trigger > hourAgo);
    this.alertTriggerHistory.set(subscription.id, recentTriggers);

    // Check rate limit
    return recentTriggers.length < this.config.alerting.maxAlertsPerHour;
  }

  /**
   * Trigger alert
   */
  private async triggerAlert(
    subscription: AlertSubscription,
    taskId: string,
    task: ITask,
    metrics: TaskMetrics
  ): Promise<void> {
    const now = new Date();

    try {
      // Record trigger
      subscription.triggerCount++;
      subscription.lastTriggered = now;

      // Update trigger history
      const triggerHistory = this.alertTriggerHistory.get(subscription.id) || [];
      triggerHistory.push(now);
      this.alertTriggerHistory.set(subscription.id, triggerHistory);

      // Update stats
      this.monitorStats.alertsTriggered++;

      // Call alert callback
      subscription.callback(taskId, subscription.condition, task, metrics);

      // Emit alert event
      this.emit(MonitorEvent.ALERT_TRIGGERED, subscription.id, task, metrics);

      this.logger.info('Alert triggered', {
        alertId: subscription.id,
        taskId,
        taskStatus: task.status,
        triggerCount: subscription.triggerCount,
      });

    } catch (error) {
      this.logger.error('Failed to trigger alert', {
        alertId: subscription.id,
        taskId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Perform health check on monitored system
   */
  private async performHealthCheck(): Promise<void> {
    try {
      const summary = await this.getStatusSummary();
      const newHealthScore = this.calculateSystemHealthScore(summary);

      const oldHealthScore = this.healthScore;
      this.healthScore = newHealthScore;
      this.lastHealthUpdate = new Date();
      this.monitorStats.averageHealthScore = newHealthScore;

      // Emit health update if significant change
      if (Math.abs(newHealthScore - oldHealthScore) > 5) {
        this.emit(MonitorEvent.HEALTH_UPDATED, newHealthScore, oldHealthScore);
      }

      this.logger.debug('Health check completed', {
        healthScore: newHealthScore,
        previousScore: oldHealthScore,
        totalTasks: summary.totalTasks,
        activeTasks: summary.activeTasks,
      });

    } catch (error) {
      this.logger.error('Health check failed', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Calculate system health score
   */
  private calculateSystemHealthScore(summary: StatusSummary): number {
    const { weights, thresholds } = this.config.healthCheck;
    let score = 100;

    // Calculate success rate
    const totalFinished = summary.byStatus[TaskStatus.COMPLETED] + summary.byStatus[TaskStatus.FAILED];
    const successRate = totalFinished > 0
      ? (summary.byStatus[TaskStatus.COMPLETED] / totalFinished) * 100
      : 100;

    // Apply success rate weight
    if (successRate < thresholds.good) {
      score -= (thresholds.good - successRate) * weights.successRate;
    }

    // Factor in execution time performance
    const avgExecutionTime = summary.averageCompletionTime;
    if (avgExecutionTime > 300000) { // > 5 minutes
      score -= Math.min(30, (avgExecutionTime / 300000 - 1) * 20 * weights.executionTime);
    }

    // Factor in error frequency
    const errorRate = totalFinished > 0
      ? (summary.byStatus[TaskStatus.FAILED] / totalFinished) * 100
      : 0;

    if (errorRate > 10) { // > 10% error rate
      score -= (errorRate - 10) * weights.errorFrequency;
    }

    // Factor in blocked tasks
    const blockedRate = summary.totalTasks > 0
      ? (summary.byStatus[TaskStatus.BLOCKED] / summary.totalTasks) * 100
      : 0;

    if (blockedRate > 5) { // > 5% blocked
      score -= blockedRate * 2;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Create initial metrics for new task
   */
  private createInitialMetrics(task: ITask): TaskMetrics {
    return {
      startTime: new Date(),
      memoryUsage: process.memoryUsage().heapUsed,
      cpuUsage: 0,
      retryCount: 0,
      performanceScore: 100,
    };
  }

  /**
   * Create initial performance data for new task
   */
  private createInitialPerformanceData(): TaskPerformanceData {
    return {
      statusTimestamps: {
        [TaskStatus.PENDING]: new Date(),
        [TaskStatus.IN_PROGRESS]: null,
        [TaskStatus.COMPLETED]: null,
        [TaskStatus.FAILED]: null,
        [TaskStatus.CANCELLED]: null,
        [TaskStatus.BLOCKED]: null,
        [TaskStatus.RETRYING]: null,
      },
      timeInStatus: {
        [TaskStatus.PENDING]: 0,
        [TaskStatus.IN_PROGRESS]: 0,
        [TaskStatus.COMPLETED]: 0,
        [TaskStatus.FAILED]: 0,
        [TaskStatus.CANCELLED]: 0,
        [TaskStatus.BLOCKED]: 0,
        [TaskStatus.RETRYING]: 0,
      },
      indicators: {
        queueWaitTime: 0,
        executionTime: 0,
        totalLifecycleTime: 0,
        statusTransitions: 0,
        performanceScore: 100,
      },
    };
  }

  /**
   * Clean up old monitored tasks
   */
  private async cleanupOldTasks(): Promise<void> {
    const tasksToRemove: string[] = [];
    const cutoffTime = new Date(Date.now() - 3600000); // 1 hour ago

    for (const [taskId, monitored] of this.monitoredTasks.entries()) {
      // Remove completed/failed tasks older than cutoff
      if ((monitored.task.status === TaskStatus.COMPLETED ||
           monitored.task.status === TaskStatus.FAILED ||
           monitored.task.status === TaskStatus.CANCELLED) &&
          monitored.lastChecked < cutoffTime) {
        tasksToRemove.push(taskId);
      }
    }

    // Remove oldest tasks if still over limit
    if (tasksToRemove.length === 0 && this.monitoredTasks.size >= this.config.maxMonitoredTasks) {
      const sortedTasks = Array.from(this.monitoredTasks.entries())
        .sort(([, a], [, b]) => a.registeredAt.getTime() - b.registeredAt.getTime());

      const removeCount = Math.floor(this.config.maxMonitoredTasks * 0.1); // Remove 10%
      for (let i = 0; i < removeCount; i++) {
        tasksToRemove.push(sortedTasks[i][0]);
      }
    }

    // Remove tasks
    for (const taskId of tasksToRemove) {
      await this.unregisterTask(taskId);
    }

    if (tasksToRemove.length > 0) {
      this.logger.info('Cleaned up old monitored tasks', {
        removedCount: tasksToRemove.length,
        totalRemaining: this.monitoredTasks.size,
      });
    }
  }

  /**
   * Get monitor configuration
   */
  getConfig(): MonitorConfig {
    return { ...this.config };
  }

  /**
   * Update monitor configuration
   */
  updateConfig(updates: Partial<MonitorConfig>): void {
    Object.assign(this.config, updates);

    this.logger.info('Monitor configuration updated', { updates });

    // Restart timers if intervals changed
    if (updates.updateInterval !== undefined) {
      if (this.updateTimer) {
        clearInterval(this.updateTimer);
      }
      if (this.isRunning && updates.updateInterval > 0) {
        this.updateTimer = setInterval(() => {
          this.updateAllTaskMetrics().catch(error => {
            this.logger.error('Failed to update task metrics', {
              error: error instanceof Error ? error.message : String(error),
            });
          });
        }, updates.updateInterval);
      }
    }

    if (updates.healthCheck?.interval !== undefined) {
      if (this.healthCheckTimer) {
        clearInterval(this.healthCheckTimer);
      }
      if (this.isRunning && this.config.healthCheck.enabled && this.config.healthCheck.interval > 0) {
        this.healthCheckTimer = setInterval(() => {
          this.performHealthCheck().catch(error => {
            this.logger.error('Health check failed', {
              error: error instanceof Error ? error.message : String(error),
            });
          });
        }, this.config.healthCheck.interval);
      }
    }
  }

  /**
   * Get detailed monitor state for debugging
   */
  getDebugInfo(): Record<string, unknown> {
    const taskStats = Array.from(this.monitoredTasks.entries()).map(([id, monitored]) => ({
      taskId: id,
      taskName: monitored.task.name,
      status: monitored.task.status,
      registeredAt: monitored.registeredAt,
      statusTransitions: monitored.performance.indicators.statusTransitions,
      performanceScore: monitored.performance.indicators.performanceScore,
      metricsHistorySize: monitored.metricsHistory.length,
    }));

    const alertStats = Array.from(this.alertSubscriptions.values()).map(sub => ({
      alertId: sub.id,
      triggerCount: sub.triggerCount,
      lastTriggered: sub.lastTriggered,
      condition: sub.condition,
    }));

    return {
      isRunning: this.isRunning,
      config: this.config,
      stats: this.monitorStats,
      healthScore: this.healthScore,
      lastHealthUpdate: this.lastHealthUpdate,
      totalMonitoredTasks: this.monitoredTasks.size,
      totalAlerts: this.alertSubscriptions.size,
      taskStats,
      alertStats,
    };
  }

  /**
   * Dispose of the status monitor
   */
  async dispose(): Promise<void> {
    await this.stop();

    this.monitoredTasks.clear();
    this.alertSubscriptions.clear();
    this.alertTriggerHistory.clear();
    this.removeAllListeners();

    this.logger.info('Task status monitor disposed');
  }
}