/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Config } from '../config/config.js';
import type { Task, TaskType, TaskComplexity, TaskPriority } from './TaskExecutionEngine.js';
/**
 * @fileoverview Real-time Execution Monitoring System
 *
 * Comprehensive monitoring, metrics collection, performance analysis,
 * and real-time tracking for task execution workflows.
 */
/**
 * Real-time execution metrics
 */
export interface ExecutionMetrics {
    totalTasks: number;
    runningTasks: number;
    completedTasks: number;
    failedTasks: number;
    cancelledTasks: number;
    averageExecutionTimeMs: number;
    medianExecutionTimeMs: number;
    p95ExecutionTimeMs: number;
    successRate: number;
    memoryUsageMB: number;
    cpuUsagePercent: number;
    concurrentAgentCount: number;
    tasksByType: Record<TaskType, number>;
    tasksByComplexity: Record<TaskComplexity, number>;
    tasksByPriority: Record<TaskPriority, number>;
    tasksCompletedLastHour: number;
    tasksCompletedLast24Hours: number;
    averageTasksPerHour: number;
    retryRate: number;
    averageRetries: number;
    blockageRate: number;
    timestamp: Date;
}
/**
 * Task execution event for monitoring
 */
export interface TaskExecutionEvent {
    taskId: string;
    eventType: 'queued' | 'started' | 'progress' | 'completed' | 'failed' | 'cancelled' | 'retry';
    timestamp: Date;
    metadata: Record<string, unknown>;
    agentId?: string;
    progress?: number;
    error?: string;
    duration?: number;
}
/**
 * Performance alert configuration
 */
export interface AlertConfig {
    name: string;
    condition: (metrics: ExecutionMetrics) => boolean;
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    cooldownMinutes?: number;
}
/**
 * Performance bottleneck analysis
 */
export interface BottleneckAnalysis {
    bottleneckType: 'resource_limit' | 'dependency_chain' | 'agent_capacity' | 'task_complexity' | 'system_load';
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    recommendation: string;
    impactedTasks: string[];
    estimatedDelayMs: number;
    identifiedAt: Date;
}
/**
 * System health status
 */
export interface SystemHealthStatus {
    overall: 'healthy' | 'degraded' | 'unhealthy' | 'critical';
    components: {
        taskQueue: 'healthy' | 'degraded' | 'unhealthy';
        executionEngine: 'healthy' | 'degraded' | 'unhealthy';
        monitoring: 'healthy' | 'degraded' | 'unhealthy';
        persistence: 'healthy' | 'degraded' | 'unhealthy';
    };
    lastHealthCheck: Date;
    issues: string[];
    recommendations: string[];
}
/**
 * Real-time execution monitoring dashboard
 */
export declare class ExecutionMonitoringSystem {
    private readonly config;
    private readonly metricsHistory;
    private readonly eventLog;
    private readonly alertConfigs;
    private readonly activeAlerts;
    private readonly metricsPath;
    private readonly eventsPath;
    private readonly runningTasks;
    private readonly completedTasks;
    private readonly failedTasks;
    private lastPerformanceAnalysis?;
    private currentBottlenecks;
    constructor(config: Config);
    /**
     * Records a task execution event
     */
    recordEvent(event: TaskExecutionEvent): void;
    /**
     * Collects current execution metrics
     */
    collectMetrics(tasks: Task[]): Promise<ExecutionMetrics>;
    /**
     * Analyzes performance bottlenecks
     */
    analyzeBottlenecks(metrics: ExecutionMetrics, tasks: Task[]): BottleneckAnalysis[];
    /**
     * Gets system health status
     */
    getSystemHealth(metrics: ExecutionMetrics): SystemHealthStatus;
    /**
     * Gets real-time dashboard data
     */
    getDashboardData(metrics: ExecutionMetrics, tasks: Task[]): {
        metrics: ExecutionMetrics;
        bottlenecks: BottleneckAnalysis[];
        health: SystemHealthStatus;
        recentEvents: TaskExecutionEvent[];
        trends: {
            executionTimesTrend: number[];
            successRateTrend: number[];
            taskCompletionTrend: number[];
        };
    };
    /**
     * Sets up default performance alerts
     */
    private setupDefaultAlerts;
    /**
     * Checks for alert conditions
     */
    private checkAlerts;
    /**
     * Triggers an alert
     */
    private triggerAlert;
    /**
     * Starts periodic monitoring
     */
    private startPeriodicMonitoring;
    /**
     * Persists metrics to disk
     */
    private persistMetrics;
    /**
     * Persists events to disk
     */
    private persistEvents;
    /**
     * Shuts down monitoring system
     */
    shutdown(): Promise<void>;
}
