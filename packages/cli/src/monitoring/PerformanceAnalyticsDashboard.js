/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { EventEmitter } from 'node:events';
import { Logger } from '../utils/logger.js';
/**
 * Advanced Performance Analytics Dashboard
 *
 * Provides comprehensive performance monitoring, trend analysis, and actionable insights
 * for autonomous task management system with real-time analytics and optimization recommendations.
 */
export class PerformanceAnalyticsDashboard extends EventEmitter {
    logger;
    metrics;
    insights;
    benchmarks;
    trendData;
    metricsInterval;
    insightsInterval;
    retentionDays;
    // Performance tracking state
    taskExecutionTimes;
    agentPerformanceHistory;
    systemHealthHistory;
    constructor(options = {}) {
        super();
        this.logger = new Logger('PerformanceAnalyticsDashboard');
        this.metrics = new Map();
        this.insights = [];
        this.benchmarks = new Map();
        this.trendData = new Map();
        this.retentionDays = options.retentionDays || 30;
        // Performance tracking state
        this.taskExecutionTimes = new Map();
        this.agentPerformanceHistory = new Map();
        this.systemHealthHistory = [];
        this.initializeDefaultBenchmarks();
        this.setupPeriodicAnalysis(options.metricsIntervalMs || 60000, // 1 minute
        options.insightsIntervalMs || 300000);
        this.logger.info('PerformanceAnalyticsDashboard initialized', {
            retentionDays: this.retentionDays,
            timestamp: new Date().toISOString(),
        });
    }
    /**
     * Record a performance metric
     */
    recordMetric(name, value, unit, category, tags = {}, context) {
        const metric = {
            id: this.generateMetricId(),
            name,
            value,
            unit,
            timestamp: new Date(),
            category,
            tags,
            context,
        };
        if (!this.metrics.has(name)) {
            this.metrics.set(name, []);
        }
        const metricHistory = this.metrics.get(name);
        metricHistory.push(metric);
        // Keep only recent metrics based on retention policy
        this.cleanupOldMetrics(name);
        // Update trend data
        this.updateTrendData(name, metric);
        // Emit real-time metric event
        this.emit('metric:recorded', { metric });
        this.logger.debug('Performance metric recorded', {
            name,
            value,
            unit,
            category,
            tags,
        });
    }
    /**
     * Process task lifecycle events for performance tracking
     */
    onTaskEvent(event, data) {
        const { task, update, agent } = data;
        switch (event) {
            case 'started':
                this.taskExecutionTimes.set(task.id, Date.now());
                this.recordMetric('task_started_rate', 1, 'count', 'throughput', {
                    taskType: task.type,
                    priority: task.priority,
                });
                break;
            case 'completed':
                this.handleTaskCompletion(task, agent);
                break;
            case 'failed':
                this.handleTaskFailure(task, update, agent);
                break;
        }
    }
    /**
     * Process agent performance data
     */
    onAgentEvent(event, data) {
        const { agent } = data;
        switch (event) {
            case 'heartbeat':
                this.recordAgentPerformance(agent);
                break;
            case 'status_changed':
                this.recordMetric('agent_status_change', 1, 'count', 'resource_usage', {
                    agentId: agent.id,
                    newStatus: agent.status,
                });
                break;
        }
    }
    /**
     * Get current performance dashboard data
     */
    getDashboardData() {
        const realTimeMetrics = {};
        const trends = [];
        const benchmarkStatus = [];
        // Get latest metrics
        for (const [name, metricHistory] of this.metrics) {
            if (metricHistory.length > 0) {
                realTimeMetrics[name] = metricHistory[metricHistory.length - 1];
            }
        }
        // Get trend data
        for (const trendData of this.trendData.values()) {
            trends.push(trendData);
        }
        // Check benchmark status
        for (const [metricName, benchmark] of this.benchmarks) {
            const currentMetric = realTimeMetrics[metricName];
            if (currentMetric) {
                const status = this.getBenchmarkStatus(currentMetric.value, benchmark);
                benchmarkStatus.push({
                    metric: metricName,
                    current: currentMetric.value,
                    target: benchmark.target,
                    status,
                    benchmark,
                });
            }
        }
        // Calculate system overview
        const systemOverview = this.calculateSystemOverview();
        return {
            realTimeMetrics,
            trends,
            insights: this.insights.slice(-20), // Last 20 insights
            benchmarkStatus,
            systemOverview,
        };
    }
    /**
     * Get performance analytics for a specific time period
     */
    getAnalytics(timeRange, metrics) {
        const filteredMetrics = {};
        const aggregations = {};
        const metricsToAnalyze = metrics || Array.from(this.metrics.keys());
        for (const metricName of metricsToAnalyze) {
            const metricHistory = this.metrics.get(metricName) || [];
            const filteredHistory = metricHistory.filter((metric) => metric.timestamp >= timeRange.start &&
                metric.timestamp <= timeRange.end);
            filteredMetrics[metricName] = filteredHistory;
            if (filteredHistory.length > 0) {
                const values = filteredHistory.map((m) => m.value);
                aggregations[metricName] = {
                    average: values.reduce((sum, val) => sum + val, 0) / values.length,
                    min: Math.min(...values),
                    max: Math.max(...values),
                    count: values.length,
                    sum: values.reduce((sum, val) => sum + val, 0),
                };
            }
        }
        const trends = Array.from(this.trendData.values()).filter((trend) => metrics ? metrics.includes(trend.metric) : true);
        return {
            metrics: filteredMetrics,
            aggregations,
            trends,
        };
    }
    /**
     * Generate optimization recommendations based on current performance data
     */
    generateOptimizationRecommendations() {
        const recommendations = [];
        // Analyze task throughput
        const throughputMetrics = this.getMetricsByCategory('throughput');
        if (throughputMetrics.length > 0) {
            const avgThroughput = this.calculateAverageMetric(throughputMetrics);
            const throughputBenchmark = this.benchmarks.get('task_completion_rate');
            if (throughputBenchmark && avgThroughput < throughputBenchmark.warning) {
                recommendations.push({
                    id: this.generateInsightId(),
                    title: 'Low Task Throughput Detected',
                    description: `Current throughput (${avgThroughput.toFixed(2)}) is below warning threshold (${throughputBenchmark.warning})`,
                    severity: avgThroughput < throughputBenchmark.critical
                        ? 'critical'
                        : 'warning',
                    category: 'performance',
                    impact: 'high',
                    recommendation: 'Consider increasing agent pool size or optimizing task execution algorithms',
                    actionable: true,
                    relatedMetrics: ['task_completion_rate', 'agent_utilization'],
                    timestamp: new Date(),
                });
            }
        }
        // Analyze agent performance
        const agentUtilization = this.calculateAgentUtilization();
        if (agentUtilization < 0.7) {
            // Less than 70% utilization
            recommendations.push({
                id: this.generateInsightId(),
                title: 'Low Agent Utilization',
                description: `Agent utilization is at ${(agentUtilization * 100).toFixed(1)}%, indicating potential inefficiency`,
                severity: 'warning',
                category: 'efficiency',
                impact: 'medium',
                recommendation: 'Review task distribution algorithms and consider reducing agent pool size or increasing task complexity',
                actionable: true,
                relatedMetrics: ['agent_utilization', 'task_queue_size'],
                timestamp: new Date(),
            });
        }
        // Analyze error rates
        const errorRateMetrics = this.getMetricsByName('task_failure_rate');
        if (errorRateMetrics.length > 0) {
            const avgErrorRate = this.calculateAverageMetric(errorRateMetrics);
            if (avgErrorRate > 0.1) {
                // More than 10% failure rate
                recommendations.push({
                    id: this.generateInsightId(),
                    title: 'High Task Failure Rate',
                    description: `Task failure rate (${(avgErrorRate * 100).toFixed(1)}%) exceeds acceptable threshold`,
                    severity: avgErrorRate > 0.2 ? 'critical' : 'warning',
                    category: 'reliability',
                    impact: 'high',
                    recommendation: 'Investigate common failure patterns and implement better error handling or task validation',
                    actionable: true,
                    relatedMetrics: ['task_failure_rate', 'error_frequency'],
                    timestamp: new Date(),
                });
            }
        }
        return recommendations;
    }
    /**
     * Export analytics data for external systems
     */
    exportData(format = 'json') {
        const dashboardData = this.getDashboardData();
        if (format === 'json') {
            return JSON.stringify({
                ...dashboardData,
                exportTimestamp: new Date().toISOString(),
                retentionDays: this.retentionDays,
                totalMetrics: Array.from(this.metrics.keys()).length,
            }, null, 2);
        }
        // CSV format implementation would go here
        return 'CSV export not yet implemented';
    }
    // Private methods
    initializeDefaultBenchmarks() {
        const benchmarks = [
            {
                metric: 'task_completion_rate',
                target: 0.95,
                warning: 0.85,
                critical: 0.7,
                unit: 'ratio',
                description: 'Percentage of tasks completed successfully',
            },
            {
                metric: 'average_execution_time',
                target: 30000, // 30 seconds
                warning: 60000, // 1 minute
                critical: 120000, // 2 minutes
                unit: 'milliseconds',
                description: 'Average time to complete a task',
            },
            {
                metric: 'agent_utilization',
                target: 0.8,
                warning: 0.6,
                critical: 0.4,
                unit: 'ratio',
                description: 'Percentage of time agents are actively working',
            },
            {
                metric: 'system_throughput',
                target: 100,
                warning: 50,
                critical: 20,
                unit: 'tasks/hour',
                description: 'Number of tasks completed per hour',
            },
        ];
        for (const benchmark of benchmarks) {
            this.benchmarks.set(benchmark.metric, benchmark);
        }
    }
    setupPeriodicAnalysis(metricsInterval, insightsInterval) {
        // Collect system metrics periodically
        this.metricsInterval = setInterval(() => {
            this.collectSystemMetrics();
        }, metricsInterval);
        // Generate insights periodically
        this.insightsInterval = setInterval(() => {
            this.generateInsights();
        }, insightsInterval);
    }
    collectSystemMetrics() {
        // Record system health metrics
        const memoryUsage = process.memoryUsage();
        this.recordMetric('memory_usage', memoryUsage.heapUsed / memoryUsage.heapTotal, 'ratio', 'resource_usage');
        this.recordMetric('memory_heap_used', memoryUsage.heapUsed / 1024 / 1024, 'MB', 'resource_usage');
        // Record timestamp for system health history
        this.systemHealthHistory.push({
            timestamp: new Date(),
            cpuUsage: 0, // Would be implemented with actual CPU monitoring
            memoryUsage: memoryUsage.heapUsed / memoryUsage.heapTotal,
            activeAgents: 0, // Would be provided by agent manager
            taskThroughput: this.calculateCurrentThroughput(),
        });
        // Keep only last 1000 entries
        if (this.systemHealthHistory.length > 1000) {
            this.systemHealthHistory = this.systemHealthHistory.slice(-1000);
        }
    }
    generateInsights() {
        const newInsights = this.generateOptimizationRecommendations();
        // Add insights and emit events
        for (const insight of newInsights) {
            this.insights.push(insight);
            this.emit('insight:generated', { insight });
        }
        // Keep only last 100 insights
        if (this.insights.length > 100) {
            this.insights = this.insights.slice(-100);
        }
    }
    handleTaskCompletion(task, agent) {
        const startTime = this.taskExecutionTimes.get(task.id);
        if (startTime) {
            const executionTime = Date.now() - startTime;
            this.taskExecutionTimes.delete(task.id);
            this.recordMetric('task_execution_time', executionTime, 'milliseconds', 'latency', {
                taskType: task.type,
                priority: task.priority,
                agentId: agent?.id || 'unknown',
            });
            this.recordMetric('task_completion_rate', 1, 'count', 'success_rate', {
                taskType: task.type,
                priority: task.priority,
            });
        }
    }
    handleTaskFailure(task, update, agent) {
        const startTime = this.taskExecutionTimes.get(task.id);
        if (startTime) {
            const executionTime = Date.now() - startTime;
            this.taskExecutionTimes.delete(task.id);
            this.recordMetric('task_failure_time', executionTime, 'milliseconds', 'latency', {
                taskType: task.type,
                priority: task.priority,
                agentId: agent?.id || 'unknown',
                error: update?.error || 'unknown_error',
            });
            this.recordMetric('task_failure_rate', 1, 'count', 'quality', {
                taskType: task.type,
                priority: task.priority,
                error: update?.error || 'unknown',
            });
        }
    }
    recordAgentPerformance(agent) {
        if (!this.agentPerformanceHistory.has(agent.id)) {
            this.agentPerformanceHistory.set(agent.id, []);
        }
        const history = this.agentPerformanceHistory.get(agent.id);
        history.push({
            timestamp: new Date(),
            completedTasks: agent.completedTasks,
            failedTasks: agent.failedTasks,
            averageTime: agent.averageTaskDuration,
        });
        // Keep only last 1000 entries per agent
        if (history.length > 1000) {
            this.agentPerformanceHistory.set(agent.id, history.slice(-1000));
        }
        // Record current metrics
        this.recordMetric('agent_success_rate', agent.performance.successRate / 100, 'ratio', 'success_rate', { agentId: agent.id });
        this.recordMetric('agent_throughput', agent.performance.taskThroughput, 'tasks/hour', 'throughput', { agentId: agent.id });
    }
    updateTrendData(metricName, metric) {
        if (!this.trendData.has(metricName)) {
            this.trendData.set(metricName, {
                metric: metricName,
                dataPoints: [],
                trendDirection: 'stable',
                trendStrength: 0,
                confidence: 0,
            });
        }
        const trend = this.trendData.get(metricName);
        trend.dataPoints.push({
            timestamp: metric.timestamp,
            value: metric.value,
            context: metric.context,
        });
        // Keep only last 100 data points for trend analysis
        if (trend.dataPoints.length > 100) {
            trend.dataPoints = trend.dataPoints.slice(-100);
        }
        // Calculate trend direction and strength
        if (trend.dataPoints.length >= 10) {
            const { direction, strength, confidence } = this.calculateTrend(trend.dataPoints);
            trend.trendDirection = direction;
            trend.trendStrength = strength;
            trend.confidence = confidence;
        }
    }
    calculateTrend(dataPoints) {
        if (dataPoints.length < 2) {
            return { direction: 'stable', strength: 0, confidence: 0 };
        }
        // Simple linear regression to determine trend
        const n = dataPoints.length;
        const sumX = dataPoints.reduce((sum, point, index) => sum + index, 0);
        const sumY = dataPoints.reduce((sum, point) => sum + point.value, 0);
        const sumXY = dataPoints.reduce((sum, point, index) => sum + index * point.value, 0);
        const sumXX = dataPoints.reduce((sum, _, index) => sum + index * index, 0);
        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        const correlation = this.calculateCorrelation(dataPoints);
        const direction = slope > 0.001 ? 'up' : slope < -0.001 ? 'down' : 'stable';
        const strength = Math.abs(slope);
        const confidence = Math.abs(correlation);
        return { direction, strength, confidence };
    }
    calculateCorrelation(dataPoints) {
        if (dataPoints.length < 2)
            return 0;
        const n = dataPoints.length;
        const xValues = dataPoints.map((_, index) => index);
        const yValues = dataPoints.map((point) => point.value);
        const meanX = xValues.reduce((sum, x) => sum + x, 0) / n;
        const meanY = yValues.reduce((sum, y) => sum + y, 0) / n;
        const numerator = xValues.reduce((sum, x, i) => sum + (x - meanX) * (yValues[i] - meanY), 0);
        const denomX = Math.sqrt(xValues.reduce((sum, x) => sum + (x - meanX) ** 2, 0));
        const denomY = Math.sqrt(yValues.reduce((sum, y) => sum + (y - meanY) ** 2, 0));
        return denomX * denomY === 0 ? 0 : numerator / (denomX * denomY);
    }
    cleanupOldMetrics(metricName) {
        const metrics = this.metrics.get(metricName);
        if (!metrics)
            return;
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - this.retentionDays);
        const filteredMetrics = metrics.filter((metric) => metric.timestamp >= cutoffDate);
        this.metrics.set(metricName, filteredMetrics);
    }
    getBenchmarkStatus(value, benchmark) {
        if (value <= benchmark.critical || value >= benchmark.critical) {
            return 'critical';
        }
        if (value <= benchmark.warning || value >= benchmark.warning) {
            return 'warning';
        }
        return 'good';
    }
    calculateSystemOverview() {
        const completionMetrics = this.getMetricsByName('task_completion_rate');
        const executionTimeMetrics = this.getMetricsByName('task_execution_time');
        return {
            totalTasks: completionMetrics.length,
            activeTasks: this.taskExecutionTimes.size,
            completionRate: completionMetrics.length > 0
                ? this.calculateAverageMetric(completionMetrics)
                : 0,
            averageExecutionTime: executionTimeMetrics.length > 0
                ? this.calculateAverageMetric(executionTimeMetrics)
                : 0,
            systemEfficiency: 0.95, // Would be calculated from actual system data
            agentUtilization: this.calculateAgentUtilization(),
        };
    }
    getMetricsByCategory(category) {
        const metrics = [];
        for (const metricHistory of this.metrics.values()) {
            metrics.push(...metricHistory.filter((m) => m.category === category));
        }
        return metrics;
    }
    getMetricsByName(name) {
        return this.metrics.get(name) || [];
    }
    calculateAverageMetric(metrics) {
        if (metrics.length === 0)
            return 0;
        return (metrics.reduce((sum, metric) => sum + metric.value, 0) / metrics.length);
    }
    calculateAgentUtilization() {
        // This would be calculated from actual agent data
        // For now, return a placeholder value
        return 0.75;
    }
    calculateCurrentThroughput() {
        // Calculate tasks completed in the last hour
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const completionMetrics = this.getMetricsByName('task_completion_rate').filter((m) => m.timestamp >= oneHourAgo);
        return completionMetrics.length;
    }
    generateMetricId() {
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 8);
        return `metric_${timestamp}_${randomString}`;
    }
    generateInsightId() {
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 8);
        return `insight_${timestamp}_${randomString}`;
    }
    /**
     * Cleanup resources
     */
    destroy() {
        if (this.metricsInterval) {
            clearInterval(this.metricsInterval);
        }
        if (this.insightsInterval) {
            clearInterval(this.insightsInterval);
        }
        this.removeAllListeners();
        this.metrics.clear();
        this.insights.length = 0;
        this.benchmarks.clear();
        this.trendData.clear();
        this.taskExecutionTimes.clear();
        this.agentPerformanceHistory.clear();
        this.systemHealthHistory.length = 0;
        this.logger.info('PerformanceAnalyticsDashboard destroyed');
    }
}
/**
 * Singleton instance for global access
 */
export const performanceAnalyticsDashboard = new PerformanceAnalyticsDashboard();
//# sourceMappingURL=PerformanceAnalyticsDashboard.js.map