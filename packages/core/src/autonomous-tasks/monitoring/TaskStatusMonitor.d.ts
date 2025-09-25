/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { EventEmitter } from 'node:events';
import type { ITask, ITaskStatusMonitor, TaskMetrics, StatusSummary, AlertCondition, AlertCallback } from '../interfaces/TaskInterfaces.js';
import { TaskStatus } from '../interfaces/TaskInterfaces.js';
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
export declare enum MonitorEvent {
    TASK_REGISTERED = "task_registered",
    TASK_UNREGISTERED = "task_unregistered",
    STATUS_CHANGED = "status_changed",
    METRICS_UPDATED = "metrics_updated",
    ALERT_TRIGGERED = "alert_triggered",
    HEALTH_UPDATED = "health_updated",
    PERFORMANCE_ANOMALY = "performance_anomaly",
    MONITOR_ERROR = "monitor_error"
}
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
export declare class TaskStatusMonitor extends EventEmitter implements ITaskStatusMonitor {
    private readonly logger;
    private readonly config;
    private readonly monitoredTasks;
    private readonly alertSubscriptions;
    private readonly alertTriggerHistory;
    private isRunning;
    private updateTimer?;
    private healthCheckTimer?;
    private healthScore;
    private lastHealthUpdate;
    private monitorStats;
    constructor(config?: Partial<MonitorConfig>);
    /**
     * Start monitoring task status changes
     */
    start(): Promise<void>;
    /**
     * Stop monitoring task status changes
     */
    stop(): Promise<void>;
    /**
     * Register task for monitoring
     */
    registerTask(task: ITask): Promise<void>;
    /**
     * Unregister task from monitoring
     */
    unregisterTask(taskId: string): Promise<void>;
    /**
     * Get current status of monitored task
     */
    getTaskStatus(taskId: string): TaskStatus | null;
    /**
     * Get real-time metrics for monitored task
     */
    getTaskMetrics(taskId: string): TaskMetrics | null;
    /**
     * Get status summary for all monitored tasks
     */
    getStatusSummary(): Promise<StatusSummary>;
    /**
     * Set up status alerts for specific conditions
     */
    setupAlert(condition: AlertCondition, callback: AlertCallback): string;
    /**
     * Remove status alert
     */
    removeAlert(alertId: string): boolean;
    /**
     * Update metrics for all monitored tasks
     */
    private updateAllTaskMetrics;
    /**
     * Update metrics for a specific task
     */
    private updateTaskMetrics;
    /**
     * Calculate current metrics for a task
     */
    private calculateTaskMetrics;
    /**
     * Calculate performance score for a task
     */
    private calculatePerformanceScore;
    /**
     * Get expected duration for task type (simplified heuristic)
     */
    private getExpectedDuration;
    /**
     * Get expected memory usage for task type (simplified heuristic)
     */
    private getExpectedMemoryUsage;
    /**
     * Estimate CPU usage (simplified)
     */
    private estimateCpuUsage;
    /**
     * Record status change in history
     */
    private recordStatusChange;
    /**
     * Update performance data for task
     */
    private updatePerformanceData;
    /**
     * Calculate overall performance score
     */
    private calculateOverallPerformanceScore;
    /**
     * Check alerts for task and metrics
     */
    private checkAlerts;
    /**
     * Check if alert should be triggered
     */
    private shouldTriggerAlert;
    /**
     * Check alert rate limiting
     */
    private checkAlertRateLimit;
    /**
     * Trigger alert
     */
    private triggerAlert;
    /**
     * Perform health check on monitored system
     */
    private performHealthCheck;
    /**
     * Calculate system health score
     */
    private calculateSystemHealthScore;
    /**
     * Create initial metrics for new task
     */
    private createInitialMetrics;
    /**
     * Create initial performance data for new task
     */
    private createInitialPerformanceData;
    /**
     * Clean up old monitored tasks
     */
    private cleanupOldTasks;
    /**
     * Get monitor configuration
     */
    getConfig(): MonitorConfig;
    /**
     * Update monitor configuration
     */
    updateConfig(updates: Partial<MonitorConfig>): void;
    /**
     * Get detailed monitor state for debugging
     */
    getDebugInfo(): Record<string, unknown>;
    /**
     * Dispose of the status monitor
     */
    dispose(): Promise<void>;
}
