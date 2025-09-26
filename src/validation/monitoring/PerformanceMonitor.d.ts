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
import type { ValidationReport } from '../core/ValidationEngine.js';
/**
 * Performance metric types
 */
export interface PerformanceMetric {
    timestamp: Date;
    metricType: 'duration' | 'throughput' | 'memory' | 'cpu' | 'success_rate';
    value: number;
    unit: string;
    context: Record<string, any>;
}
/**
 * System resource metrics
 */
export interface ResourceMetrics {
    cpu: {
        usage: number;
        loadAverage: number[];
    };
    memory: {
        used: number;
        free: number;
        usage: number;
        heap: NodeJS.MemoryUsage;
    };
    disk: {
        usage: number;
        freeSpace: number;
    };
    network: {
        bytesIn: number;
        bytesOut: number;
    };
}
/**
 * Performance alert configuration
 */
export interface PerformanceAlert {
    id: string;
    name: string;
    description: string;
    condition: (metrics: PerformanceMetrics) => boolean;
    severity: 'low' | 'medium' | 'high' | 'critical';
    cooldownPeriod: number;
    lastTriggered?: Date;
}
/**
 * Performance trends and analytics
 */
export interface PerformanceTrends {
    validationDuration: {
        average: number;
        trend: 'improving' | 'degrading' | 'stable';
        samples: number;
    };
    successRate: {
        current: number;
        trend: 'improving' | 'degrading' | 'stable';
        samples: number;
    };
    throughput: {
        validationsPerHour: number;
        trend: 'improving' | 'degrading' | 'stable';
    };
    resourceUtilization: {
        cpu: number;
        memory: number;
        trend: 'improving' | 'degrading' | 'stable';
    };
}
/**
 * Comprehensive performance metrics aggregation
 */
export interface PerformanceMetrics {
    current: ResourceMetrics;
    validation: {
        totalValidations: number;
        successfulValidations: number;
        failedValidations: number;
        averageDuration: number;
        averageScore: number;
    };
    trends: PerformanceTrends;
    alerts: {
        active: PerformanceAlert[];
        triggered: number;
    };
    optimization: {
        recommendations: string[];
        estimatedImprovements: Record<string, number>;
    };
}
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
export declare class PerformanceMonitor extends EventEmitter {
    private readonly logger;
    private readonly metrics;
    private readonly alerts;
    private readonly validationHistory;
    private monitoringInterval;
    private readonly maxHistorySize;
    private readonly metricsRetentionDays;
    constructor();
    /**
     * Record validation performance data
     */
    recordValidation(report: ValidationReport): void;
    /**
     * Record individual performance metric
     */
    recordMetric(metric: PerformanceMetric): void;
    /**
     * Get comprehensive performance metrics
     */
    getMetrics(): PerformanceMetrics;
    /**
     * Get current system resource metrics
     */
    private getCurrentResourceMetrics;
    /**
     * Calculate CPU usage percentage
     */
    private calculateCpuUsage;
    /**
     * Get validation performance metrics
     */
    private getValidationMetrics;
    /**
     * Calculate performance trends
     */
    private calculateTrends;
    /**
     * Calculate validation duration trend
     */
    private calculateDurationTrend;
    /**
     * Calculate success rate trend
     */
    private calculateSuccessRateTrend;
    /**
     * Calculate throughput trend
     */
    private calculateThroughputTrend;
    /**
     * Calculate resource utilization trend
     */
    private calculateResourceTrend;
    /**
     * Get active performance alerts
     */
    private getActiveAlerts;
    /**
     * Generate optimization recommendations
     */
    private generateOptimizationRecommendations;
    /**
     * Check and trigger performance alerts
     */
    private checkAlerts;
    /**
     * Check if alert should be triggered (respects cooldown)
     */
    private shouldTriggerAlert;
    /**
     * Trigger performance alert
     */
    private triggerAlert;
    /**
     * Initialize default performance alerts
     */
    private initializeDefaultAlerts;
    /**
     * Start performance monitoring
     */
    private startMonitoring;
    /**
     * Stop performance monitoring
     */
    stopMonitoring(): void;
    /**
     * Trim metrics to prevent memory leaks
     */
    private trimMetrics;
    /**
     * Trim validation history to prevent memory leaks
     */
    private trimHistory;
    /**
     * Get performance summary for monitoring dashboard
     */
    getPerformanceSummary(): {
        status: "healthy" | "warning" | "critical";
        validations: {
            total: number;
            successful: number;
            successRate: number;
            averageDuration: number;
        };
        resources: {
            memoryUsage: number;
            cpuUsage: number;
        };
        alerts: number;
        recommendations: number;
    };
    /**
     * Determine overall system status
     */
    private getOverallStatus;
    /**
     * Shutdown performance monitor
     */
    shutdown(): void;
}
