/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
/**
 * Real-time execution monitoring dashboard
 */
export class ExecutionMonitoringSystem {
    config;
    metricsHistory = [];
    eventLog = [];
    alertConfigs = [];
    activeAlerts = new Map();
    metricsPath;
    eventsPath;
    // Real-time tracking
    runningTasks = new Map();
    completedTasks = new Map();
    failedTasks = new Map();
    // Performance analysis
    lastPerformanceAnalysis;
    currentBottlenecks = [];
    constructor(config) {
        this.config = config;
        const tempDir = config.storage.getProjectTempDir();
        this.metricsPath = path.join(tempDir, 'execution-metrics.json');
        this.eventsPath = path.join(tempDir, 'execution-events.json');
        // Set up default alerts
        this.setupDefaultAlerts();
        // Start periodic monitoring
        this.startPeriodicMonitoring();
    }
    /**
     * Records a task execution event
     */
    recordEvent(event) {
        // Add to event log
        this.eventLog.push(event);
        // Update real-time tracking
        switch (event.eventType) {
            case 'queued':
                // Task queued for execution
                break;
            case 'started':
                this.runningTasks.set(event.taskId, event);
                break;
            case 'progress':
                // Update running task progress
                if (this.runningTasks.has(event.taskId)) {
                    const existingEvent = this.runningTasks.get(event.taskId);
                    existingEvent.progress = event.progress;
                    existingEvent.timestamp = event.timestamp;
                }
                break;
            case 'completed':
                this.runningTasks.delete(event.taskId);
                this.completedTasks.set(event.taskId, event);
                break;
            case 'failed':
                this.runningTasks.delete(event.taskId);
                this.failedTasks.set(event.taskId, event);
                break;
            case 'cancelled':
                this.runningTasks.delete(event.taskId);
                break;
            case 'retry':
                // Task being retried
                break;
            default:
                // Unknown event type
                break;
        }
        // Trim event log to prevent memory issues
        if (this.eventLog.length > 10000) {
            this.eventLog.splice(0, this.eventLog.length - 5000); // Keep last 5000 events
        }
        // Check for alerts
        this.checkAlerts();
        // Persist events periodically
        this.persistEvents();
    }
    /**
     * Collects current execution metrics
     */
    async collectMetrics(tasks) {
        const now = new Date();
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        // Basic task counts
        const runningTasks = tasks.filter((t) => t.status === 'in_progress').length;
        const completedTasks = tasks.filter((t) => t.status === 'completed').length;
        const failedTasks = tasks.filter((t) => t.status === 'failed').length;
        const cancelledTasks = tasks.filter((t) => t.status === 'cancelled').length;
        // Execution time analysis
        const completedTasksWithTiming = tasks.filter((t) => t.status === 'completed' && t.startedAt && t.completedAt);
        const executionTimes = completedTasksWithTiming.map((t) => t.completedAt.getTime() - t.startedAt.getTime());
        const averageExecutionTimeMs = executionTimes.length > 0
            ? executionTimes.reduce((sum, time) => sum + time, 0) /
                executionTimes.length
            : 0;
        const sortedTimes = [...executionTimes].sort((a, b) => a - b);
        const medianExecutionTimeMs = sortedTimes.length > 0
            ? sortedTimes[Math.floor(sortedTimes.length / 2)]
            : 0;
        const p95ExecutionTimeMs = sortedTimes.length > 0
            ? sortedTimes[Math.floor(sortedTimes.length * 0.95)]
            : 0;
        const successRate = completedTasks + failedTasks > 0
            ? (completedTasks / (completedTasks + failedTasks)) * 100
            : 0;
        // Task type breakdown
        const tasksByType = {};
        const tasksByComplexity = {
            [TaskComplexity.TRIVIAL]: 0,
            [TaskComplexity.SIMPLE]: 0,
            [TaskComplexity.MODERATE]: 0,
            [TaskComplexity.COMPLEX]: 0,
            [TaskComplexity.ENTERPRISE]: 0,
        };
        const tasksByPriority = {};
        for (const task of tasks) {
            tasksByType[task.type] = (tasksByType[task.type] || 0) + 1;
            tasksByComplexity[task.complexity]++;
            tasksByPriority[task.priority] =
                (tasksByPriority[task.priority] || 0) + 1;
        }
        // Temporal metrics
        const recentCompletedEvents = this.eventLog.filter((e) => e.eventType === 'completed' && e.timestamp >= oneHourAgo);
        const tasksCompletedLastHour = recentCompletedEvents.length;
        const dailyCompletedEvents = this.eventLog.filter((e) => e.eventType === 'completed' && e.timestamp >= oneDayAgo);
        const tasksCompletedLast24Hours = dailyCompletedEvents.length;
        const averageTasksPerHour = tasksCompletedLast24Hours / 24;
        // Quality metrics
        const retriedEvents = this.eventLog.filter((e) => e.eventType === 'retry');
        const totalTaskEvents = this.eventLog.filter((e) => ['queued', 'completed', 'failed'].includes(e.eventType)).length;
        const retryRate = totalTaskEvents > 0 ? (retriedEvents.length / totalTaskEvents) * 100 : 0;
        const averageRetries = tasks.reduce((sum, task) => sum + task.retryCount, 0) / tasks.length;
        const blockedTasks = tasks.filter((t) => t.status === 'blocked').length;
        const blockageRate = tasks.length > 0 ? (blockedTasks / tasks.length) * 100 : 0;
        // System resource metrics (simplified for now)
        const memoryUsageMB = process.memoryUsage().heapUsed / 1024 / 1024;
        const cpuUsagePercent = 0; // TODO: Implement actual CPU monitoring
        const concurrentAgentCount = runningTasks;
        const metrics = {
            totalTasks: tasks.length,
            runningTasks,
            completedTasks,
            failedTasks,
            cancelledTasks,
            averageExecutionTimeMs,
            medianExecutionTimeMs,
            p95ExecutionTimeMs,
            successRate,
            memoryUsageMB,
            cpuUsagePercent,
            concurrentAgentCount,
            tasksByType,
            tasksByComplexity,
            tasksByPriority,
            tasksCompletedLastHour,
            tasksCompletedLast24Hours,
            averageTasksPerHour,
            retryRate,
            averageRetries,
            blockageRate,
            timestamp: now,
        };
        // Store metrics history
        this.metricsHistory.push(metrics);
        // Keep only last 1000 metrics entries
        if (this.metricsHistory.length > 1000) {
            this.metricsHistory.splice(0, this.metricsHistory.length - 500);
        }
        return metrics;
    }
    /**
     * Analyzes performance bottlenecks
     */
    analyzeBottlenecks(metrics, tasks) {
        const bottlenecks = [];
        const now = new Date();
        // Resource limit bottleneck
        if (metrics.concurrentAgentCount >= 10 &&
            metrics.runningTasks === metrics.concurrentAgentCount) {
            bottlenecks.push({
                bottleneckType: 'resource_limit',
                severity: 'high',
                description: 'Maximum concurrent task limit reached',
                recommendation: 'Consider increasing max concurrent tasks or optimizing task execution',
                impactedTasks: tasks
                    .filter((t) => t.status === 'queued')
                    .map((t) => t.id),
                estimatedDelayMs: 300000, // 5 minutes
                identifiedAt: now,
            });
        }
        // High retry rate
        if (metrics.retryRate > 20) {
            bottlenecks.push({
                bottleneckType: 'task_complexity',
                severity: 'medium',
                description: `High retry rate detected (${metrics.retryRate.toFixed(1)}%)`,
                recommendation: 'Review task complexity and error handling mechanisms',
                impactedTasks: tasks.filter((t) => t.retryCount > 0).map((t) => t.id),
                estimatedDelayMs: metrics.averageExecutionTimeMs * metrics.averageRetries,
                identifiedAt: now,
            });
        }
        // Long-running tasks
        const longRunningTasks = tasks.filter((t) => t.status === 'in_progress' &&
            t.startedAt &&
            now.getTime() - t.startedAt.getTime() >
                t.maxExecutionTimeMinutes * 60 * 1000 * 0.8);
        if (longRunningTasks.length > 0) {
            bottlenecks.push({
                bottleneckType: 'task_complexity',
                severity: 'medium',
                description: `${longRunningTasks.length} tasks approaching timeout`,
                recommendation: 'Monitor task progress and consider increasing timeouts for complex tasks',
                impactedTasks: longRunningTasks.map((t) => t.id),
                estimatedDelayMs: 0,
                identifiedAt: now,
            });
        }
        // Dependency chain bottleneck
        const blockedTasks = tasks.filter((t) => t.status === 'blocked');
        if (blockedTasks.length > 5) {
            bottlenecks.push({
                bottleneckType: 'dependency_chain',
                severity: 'medium',
                description: `${blockedTasks.length} tasks blocked by dependencies`,
                recommendation: 'Review task dependencies and consider parallelization opportunities',
                impactedTasks: blockedTasks.map((t) => t.id),
                estimatedDelayMs: metrics.averageExecutionTimeMs,
                identifiedAt: now,
            });
        }
        // Memory usage bottleneck
        if (metrics.memoryUsageMB > 512) {
            bottlenecks.push({
                bottleneckType: 'system_load',
                severity: 'high',
                description: `High memory usage detected (${metrics.memoryUsageMB.toFixed(1)}MB)`,
                recommendation: 'Consider reducing concurrent tasks or optimizing memory usage',
                impactedTasks: tasks
                    .filter((t) => t.status === 'in_progress')
                    .map((t) => t.id),
                estimatedDelayMs: 0,
                identifiedAt: now,
            });
        }
        this.currentBottlenecks = bottlenecks;
        this.lastPerformanceAnalysis = now;
        return bottlenecks;
    }
    /**
     * Gets system health status
     */
    getSystemHealth(metrics) {
        const issues = [];
        const recommendations = [];
        // Component health assessment
        const components = {
            taskQueue: 'healthy',
            executionEngine: 'healthy',
            monitoring: 'healthy',
            persistence: 'healthy',
        };
        // Task queue health
        if (metrics.runningTasks === 0 && metrics.totalTasks > 0) {
            components.taskQueue = 'degraded';
            issues.push('No tasks currently running despite queued tasks');
            recommendations.push('Check task scheduling and dependency resolution');
        }
        // Execution engine health
        if (metrics.successRate < 80) {
            components.executionEngine = 'degraded';
            issues.push(`Low success rate (${metrics.successRate.toFixed(1)}%)`);
            recommendations.push('Review error handling and task complexity');
        }
        if (metrics.successRate < 50) {
            components.executionEngine = 'unhealthy';
        }
        // Memory health
        if (metrics.memoryUsageMB > 1024) {
            components.executionEngine = 'degraded';
            issues.push(`High memory usage (${metrics.memoryUsageMB.toFixed(1)}MB)`);
            recommendations.push('Reduce concurrent tasks or optimize memory usage');
        }
        // Overall health
        let overall = 'healthy';
        const componentStates = Object.values(components);
        if (componentStates.includes('unhealthy')) {
            overall = 'unhealthy';
        }
        else if (componentStates.includes('degraded')) {
            overall = 'degraded';
        }
        if (this.currentBottlenecks.some((b) => b.severity === 'critical')) {
            overall = 'critical';
        }
        return {
            overall,
            components,
            lastHealthCheck: new Date(),
            issues,
            recommendations,
        };
    }
    /**
     * Gets real-time dashboard data
     */
    getDashboardData(metrics, tasks) {
        const bottlenecks = this.analyzeBottlenecks(metrics, tasks);
        const health = this.getSystemHealth(metrics);
        const recentEvents = this.eventLog.slice(-50); // Last 50 events
        // Calculate trends from metrics history
        const recentMetrics = this.metricsHistory.slice(-24); // Last 24 data points
        const executionTimesTrend = recentMetrics.map((m) => m.averageExecutionTimeMs);
        const successRateTrend = recentMetrics.map((m) => m.successRate);
        const taskCompletionTrend = recentMetrics.map((m) => m.tasksCompletedLastHour);
        return {
            metrics,
            bottlenecks,
            health,
            recentEvents,
            trends: {
                executionTimesTrend,
                successRateTrend,
                taskCompletionTrend,
            },
        };
    }
    /**
     * Sets up default performance alerts
     */
    setupDefaultAlerts() {
        this.alertConfigs.push({
            name: 'High Memory Usage',
            condition: (metrics) => metrics.memoryUsageMB > 512,
            severity: 'high',
            message: 'Memory usage exceeds 512MB',
            cooldownMinutes: 15,
        }, {
            name: 'Low Success Rate',
            condition: (metrics) => metrics.successRate < 70,
            severity: 'high',
            message: 'Task success rate below 70%',
            cooldownMinutes: 30,
        }, {
            name: 'High Retry Rate',
            condition: (metrics) => metrics.retryRate > 25,
            severity: 'medium',
            message: 'Task retry rate exceeds 25%',
            cooldownMinutes: 20,
        }, {
            name: 'Resource Saturation',
            condition: (metrics) => metrics.runningTasks >= 10,
            severity: 'medium',
            message: 'Maximum concurrent tasks reached',
            cooldownMinutes: 10,
        }, {
            name: 'Task Queue Stagnation',
            condition: (metrics) => metrics.totalTasks > 0 && metrics.runningTasks === 0,
            severity: 'high',
            message: 'No tasks running despite queued tasks',
            cooldownMinutes: 5,
        });
    }
    /**
     * Checks for alert conditions
     */
    checkAlerts() {
        if (this.metricsHistory.length === 0)
            return;
        const latestMetrics = this.metricsHistory[this.metricsHistory.length - 1];
        const now = new Date();
        for (const alertConfig of this.alertConfigs) {
            const lastAlert = this.activeAlerts.get(alertConfig.name);
            const cooldownMs = (alertConfig.cooldownMinutes || 10) * 60 * 1000;
            // Check if alert is in cooldown
            if (lastAlert && now.getTime() - lastAlert.getTime() < cooldownMs) {
                continue;
            }
            // Check alert condition
            if (alertConfig.condition(latestMetrics)) {
                this.triggerAlert(alertConfig, latestMetrics);
                this.activeAlerts.set(alertConfig.name, now);
            }
        }
    }
    /**
     * Triggers an alert
     */
    triggerAlert(alertConfig, _metrics) {
        console.warn(`[ALERT] ${alertConfig.severity.toUpperCase()}: ${alertConfig.name} - ${alertConfig.message}`);
        // Here you could integrate with external alerting systems
        // e.g., send to Slack, PagerDuty, etc.
    }
    /**
     * Starts periodic monitoring
     */
    startPeriodicMonitoring() {
        // Collect metrics every 5 minutes
        setInterval(() => {
            this.persistMetrics();
        }, 5 * 60 * 1000);
    }
    /**
     * Persists metrics to disk
     */
    async persistMetrics() {
        try {
            const data = {
                metricsHistory: this.metricsHistory.slice(-100), // Keep last 100 entries
                lastUpdated: new Date().toISOString(),
            };
            await fs.writeFile(this.metricsPath, JSON.stringify(data, null, 2));
        }
        catch (error) {
            console.error('Error persisting metrics:', error);
        }
    }
    /**
     * Persists events to disk
     */
    async persistEvents() {
        try {
            const data = {
                events: this.eventLog.slice(-1000), // Keep last 1000 events
                lastUpdated: new Date().toISOString(),
            };
            await fs.writeFile(this.eventsPath, JSON.stringify(data, null, 2));
        }
        catch (error) {
            console.error('Error persisting events:', error);
        }
    }
    /**
     * Shuts down monitoring system
     */
    async shutdown() {
        await this.persistMetrics();
        await this.persistEvents();
        console.log('ExecutionMonitoringSystem shut down gracefully');
    }
}
//# sourceMappingURL=ExecutionMonitoringSystem.js.map