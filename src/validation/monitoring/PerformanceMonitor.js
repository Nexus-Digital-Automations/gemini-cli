/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * @fileoverview Performance monitoring system for validation processes
 * Tracks validation performance, identifies bottlenecks, and provides optimization insights
 *
 * @author Claude Code - Validation Agent
 * @version 1.0.0
 */
import { EventEmitter } from 'node:events';
import { Logger } from '../../utils/logger.js';
/**
 * Performance monitoring and analytics system
 *
 * Features:
 * - Real-time system resource monitoring
 * - Validation performance tracking
 * - Bottleneck identification
 * - Performance trend analysis
 * - Automated alerting system
 * - Optimization recommendations
 */
export class PerformanceMonitor extends EventEmitter {
    logger;
    metrics;
    alerts;
    validationHistory;
    monitoringInterval = null;
    maxHistorySize = 10000;
    metricsRetentionDays = 30;
    constructor() {
        super();
        this.logger = new Logger('PerformanceMonitor');
        this.metrics = [];
        this.alerts = new Map();
        this.validationHistory = [];
        this.initializeDefaultAlerts();
        this.startMonitoring();
    }
    /**
     * Record validation performance data
     */
    recordValidation(report) {
        this.logger.debug(`Recording validation performance for task: ${report.taskId}`, {
            duration: report.performance.totalDuration,
            score: report.overallScore,
            status: report.overallStatus,
        });
        // Store validation report
        this.validationHistory.push(report);
        this.trimHistory();
        // Record performance metrics
        this.recordMetric({
            timestamp: new Date(),
            metricType: 'duration',
            value: report.performance.totalDuration,
            unit: 'ms',
            context: {
                taskId: report.taskId,
                status: report.overallStatus,
                criteriaCount: report.results.length,
            },
        });
        this.recordMetric({
            timestamp: new Date(),
            metricType: 'success_rate',
            value: report.overallScore,
            unit: 'score',
            context: {
                taskId: report.taskId,
                passed: report.summary.passed,
                failed: report.summary.failed,
            },
        });
        // Check for performance alerts
        this.checkAlerts();
        this.emit('validationRecorded', report);
    }
    /**
     * Record individual performance metric
     */
    recordMetric(metric) {
        this.metrics.push(metric);
        this.trimMetrics();
        this.emit('metricRecorded', metric);
    }
    /**
     * Get comprehensive performance metrics
     */
    getMetrics() {
        const current = this.getCurrentResourceMetrics();
        const validation = this.getValidationMetrics();
        const trends = this.calculateTrends();
        const alerts = this.getActiveAlerts();
        const optimization = this.generateOptimizationRecommendations();
        return {
            current,
            validation,
            trends,
            alerts,
            optimization,
        };
    }
    /**
     * Get current system resource metrics
     */
    getCurrentResourceMetrics() {
        const memoryUsage = process.memoryUsage();
        const cpuUsage = process.cpuUsage();
        const loadAverage = require('node:os').loadavg();
        return {
            cpu: {
                usage: this.calculateCpuUsage(cpuUsage),
                loadAverage,
            },
            memory: {
                used: memoryUsage.rss,
                free: require('node:os').freemem(),
                usage: (memoryUsage.rss / require('node:os').totalmem()) * 100,
                heap: memoryUsage,
            },
            disk: {
                usage: 0, // Would need platform-specific implementation
                freeSpace: 0,
            },
            network: {
                bytesIn: 0, // Would need network monitoring implementation
                bytesOut: 0,
            },
        };
    }
    /**
     * Calculate CPU usage percentage
     */
    calculateCpuUsage(cpuUsage) {
        // Simplified CPU usage calculation
        const totalUsage = cpuUsage.user + cpuUsage.system;
        return (totalUsage / 1000000) * 100; // Convert microseconds to percentage
    }
    /**
     * Get validation performance metrics
     */
    getValidationMetrics() {
        const totalValidations = this.validationHistory.length;
        const successfulValidations = this.validationHistory.filter((v) => v.overallStatus === 'passed').length;
        const failedValidations = this.validationHistory.filter((v) => v.overallStatus === 'failed').length;
        const durations = this.validationHistory.map((v) => v.performance.totalDuration);
        const scores = this.validationHistory.map((v) => v.overallScore);
        const averageDuration = durations.length > 0
            ? durations.reduce((sum, d) => sum + d, 0) / durations.length
            : 0;
        const averageScore = scores.length > 0
            ? scores.reduce((sum, s) => sum + s, 0) / scores.length
            : 0;
        return {
            totalValidations,
            successfulValidations,
            failedValidations,
            averageDuration,
            averageScore,
        };
    }
    /**
     * Calculate performance trends
     */
    calculateTrends() {
        const recentHistory = this.validationHistory.slice(-100); // Last 100 validations
        const olderHistory = this.validationHistory.slice(-200, -100); // Previous 100
        return {
            validationDuration: this.calculateDurationTrend(recentHistory, olderHistory),
            successRate: this.calculateSuccessRateTrend(recentHistory, olderHistory),
            throughput: this.calculateThroughputTrend(),
            resourceUtilization: this.calculateResourceTrend(),
        };
    }
    /**
     * Calculate validation duration trend
     */
    calculateDurationTrend(recent, older) {
        const recentAvg = recent.length > 0
            ? recent.reduce((sum, v) => sum + v.performance.totalDuration, 0) /
                recent.length
            : 0;
        const olderAvg = older.length > 0
            ? older.reduce((sum, v) => sum + v.performance.totalDuration, 0) /
                older.length
            : 0;
        let trend = 'stable';
        if (recentAvg < olderAvg * 0.95)
            trend = 'improving';
        else if (recentAvg > olderAvg * 1.05)
            trend = 'degrading';
        return {
            average: recentAvg,
            trend,
            samples: recent.length,
        };
    }
    /**
     * Calculate success rate trend
     */
    calculateSuccessRateTrend(recent, older) {
        const recentSuccess = recent.filter((v) => v.overallStatus === 'passed').length;
        const olderSuccess = older.filter((v) => v.overallStatus === 'passed').length;
        const recentRate = recent.length > 0 ? recentSuccess / recent.length : 0;
        const olderRate = older.length > 0 ? olderSuccess / older.length : 0;
        let trend = 'stable';
        if (recentRate > olderRate + 0.05)
            trend = 'improving';
        else if (recentRate < olderRate - 0.05)
            trend = 'degrading';
        return {
            current: recentRate,
            trend,
            samples: recent.length,
        };
    }
    /**
     * Calculate throughput trend
     */
    calculateThroughputTrend() {
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const recentValidations = this.validationHistory.filter((v) => v.timestamp > oneHourAgo).length;
        return {
            validationsPerHour: recentValidations,
            trend: 'stable', // Would need historical comparison
        };
    }
    /**
     * Calculate resource utilization trend
     */
    calculateResourceTrend() {
        const recentMetrics = this.metrics
            .filter((m) => m.timestamp > new Date(Date.now() - 60 * 60 * 1000))
            .filter((m) => m.metricType === 'memory' || m.metricType === 'cpu');
        const avgCpu = recentMetrics
            .filter((m) => m.metricType === 'cpu')
            .reduce((sum, m) => sum + m.value, 0) /
            Math.max(1, recentMetrics.length);
        const avgMemory = recentMetrics
            .filter((m) => m.metricType === 'memory')
            .reduce((sum, m) => sum + m.value, 0) /
            Math.max(1, recentMetrics.length);
        return {
            cpu: avgCpu,
            memory: avgMemory,
            trend: 'stable',
        };
    }
    /**
     * Get active performance alerts
     */
    getActiveAlerts() {
        const activeAlerts = Array.from(this.alerts.values()).filter((alert) => this.shouldTriggerAlert(alert));
        return {
            active: activeAlerts,
            triggered: activeAlerts.length,
        };
    }
    /**
     * Generate optimization recommendations
     */
    generateOptimizationRecommendations() {
        const recommendations = [];
        const estimatedImprovements = {};
        // Analyze validation history for patterns
        const slowValidations = this.validationHistory.filter((v) => v.performance.totalDuration > 30000);
        if (slowValidations.length > this.validationHistory.length * 0.2) {
            recommendations.push('Consider optimizing validation criteria execution time');
            estimatedImprovements.duration_improvement = 25;
        }
        const highFailureRate = this.validationHistory.filter((v) => v.overallStatus === 'failed')
            .length / Math.max(1, this.validationHistory.length);
        if (highFailureRate > 0.3) {
            recommendations.push('High failure rate detected - review task complexity');
            estimatedImprovements.success_rate_improvement = 15;
        }
        const memoryUsage = process.memoryUsage();
        if (memoryUsage.heapUsed / memoryUsage.heapTotal > 0.8) {
            recommendations.push('High memory usage - consider implementing memory optimization');
            estimatedImprovements.memory_improvement = 30;
        }
        return { recommendations, estimatedImprovements };
    }
    /**
     * Check and trigger performance alerts
     */
    checkAlerts() {
        const currentMetrics = this.getMetrics();
        for (const alert of this.alerts.values()) {
            if (this.shouldTriggerAlert(alert) && alert.condition(currentMetrics)) {
                this.triggerAlert(alert);
            }
        }
    }
    /**
     * Check if alert should be triggered (respects cooldown)
     */
    shouldTriggerAlert(alert) {
        if (!alert.lastTriggered)
            return true;
        const cooldownExpired = Date.now() - alert.lastTriggered.getTime() > alert.cooldownPeriod;
        return cooldownExpired;
    }
    /**
     * Trigger performance alert
     */
    triggerAlert(alert) {
        alert.lastTriggered = new Date();
        this.logger.warn(`Performance alert triggered: ${alert.name}`, {
            alertId: alert.id,
            severity: alert.severity,
            description: alert.description,
        });
        this.emit('alertTriggered', alert);
    }
    /**
     * Initialize default performance alerts
     */
    initializeDefaultAlerts() {
        // High memory usage alert
        this.alerts.set('high_memory', {
            id: 'high_memory',
            name: 'High Memory Usage',
            description: 'System memory usage exceeds 85%',
            condition: (metrics) => metrics.current.memory.usage > 85,
            severity: 'high',
            cooldownPeriod: 5 * 60 * 1000, // 5 minutes
        });
        // Slow validation alert
        this.alerts.set('slow_validation', {
            id: 'slow_validation',
            name: 'Slow Validation Performance',
            description: 'Average validation duration exceeds threshold',
            condition: (metrics) => metrics.validation.averageDuration > 60000, // 1 minute
            severity: 'medium',
            cooldownPeriod: 10 * 60 * 1000, // 10 minutes
        });
        // High failure rate alert
        this.alerts.set('high_failure_rate', {
            id: 'high_failure_rate',
            name: 'High Validation Failure Rate',
            description: 'Validation failure rate exceeds acceptable threshold',
            condition: (metrics) => {
                const failureRate = metrics.validation.failedValidations /
                    Math.max(1, metrics.validation.totalValidations);
                return failureRate > 0.3;
            },
            severity: 'critical',
            cooldownPeriod: 15 * 60 * 1000, // 15 minutes
        });
        // Low throughput alert
        this.alerts.set('low_throughput', {
            id: 'low_throughput',
            name: 'Low Validation Throughput',
            description: 'Validation throughput below expected levels',
            condition: (metrics) => metrics.trends.throughput.validationsPerHour < 10,
            severity: 'medium',
            cooldownPeriod: 30 * 60 * 1000, // 30 minutes
        });
    }
    /**
     * Start performance monitoring
     */
    startMonitoring() {
        if (this.monitoringInterval)
            return;
        this.logger.info('Starting performance monitoring...');
        this.monitoringInterval = setInterval(() => {
            const resourceMetrics = this.getCurrentResourceMetrics();
            // Record resource metrics
            this.recordMetric({
                timestamp: new Date(),
                metricType: 'memory',
                value: resourceMetrics.memory.usage,
                unit: 'percent',
                context: { source: 'system_monitor' },
            });
            this.recordMetric({
                timestamp: new Date(),
                metricType: 'cpu',
                value: resourceMetrics.cpu.usage,
                unit: 'percent',
                context: { source: 'system_monitor' },
            });
            // Check alerts
            this.checkAlerts();
        }, 30000); // Every 30 seconds
        this.emit('monitoringStarted');
    }
    /**
     * Stop performance monitoring
     */
    stopMonitoring() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
            this.logger.info('Performance monitoring stopped');
            this.emit('monitoringStopped');
        }
    }
    /**
     * Trim metrics to prevent memory leaks
     */
    trimMetrics() {
        const retentionCutoff = new Date();
        retentionCutoff.setDate(retentionCutoff.getDate() - this.metricsRetentionDays);
        const beforeCount = this.metrics.length;
        const filteredMetrics = this.metrics.filter((m) => m.timestamp > retentionCutoff);
        // Replace array contents to maintain reference
        this.metrics.length = 0;
        this.metrics.push(...filteredMetrics);
        const removed = beforeCount - this.metrics.length;
        if (removed > 0) {
            this.logger.debug(`Trimmed ${removed} old performance metrics`);
        }
    }
    /**
     * Trim validation history to prevent memory leaks
     */
    trimHistory() {
        if (this.validationHistory.length > this.maxHistorySize) {
            const excess = this.validationHistory.length - this.maxHistorySize;
            this.validationHistory.splice(0, excess);
            this.logger.debug(`Trimmed ${excess} old validation reports`);
        }
    }
    /**
     * Get performance summary for monitoring dashboard
     */
    getPerformanceSummary() {
        const metrics = this.getMetrics();
        return {
            status: this.getOverallStatus(metrics),
            validations: {
                total: metrics.validation.totalValidations,
                successful: metrics.validation.successfulValidations,
                successRate: (metrics.validation.successfulValidations /
                    Math.max(1, metrics.validation.totalValidations)) *
                    100,
                averageDuration: Math.round(metrics.validation.averageDuration),
            },
            resources: {
                memoryUsage: Math.round(metrics.current.memory.usage),
                cpuUsage: Math.round(metrics.current.cpu.usage),
            },
            alerts: metrics.alerts.triggered,
            recommendations: metrics.optimization.recommendations.length,
        };
    }
    /**
     * Determine overall system status
     */
    getOverallStatus(metrics) {
        if (metrics.alerts.active.some((a) => a.severity === 'critical')) {
            return 'critical';
        }
        else if (metrics.alerts.active.some((a) => a.severity === 'high' || a.severity === 'medium')) {
            return 'warning';
        }
        else {
            return 'healthy';
        }
    }
    /**
     * Shutdown performance monitor
     */
    shutdown() {
        this.logger.info('Shutting down PerformanceMonitor...');
        this.stopMonitoring();
        this.metrics.length = 0;
        this.validationHistory.length = 0;
        this.alerts.clear();
    }
}
//# sourceMappingURL=PerformanceMonitor.js.map