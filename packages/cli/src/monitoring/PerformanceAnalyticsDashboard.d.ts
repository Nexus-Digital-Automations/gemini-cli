/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { EventEmitter } from 'node:events';
import type { TaskMetadata, TaskStatusUpdate, AgentStatus } from './TaskStatusMonitor.js';
/**
 * Performance metric types for comprehensive analytics
 */
export interface PerformanceMetric {
    id: string;
    name: string;
    value: number;
    unit: string;
    timestamp: Date;
    category: 'throughput' | 'latency' | 'success_rate' | 'resource_usage' | 'quality';
    tags: Record<string, string>;
    context?: Record<string, unknown>;
}
export interface TrendData {
    metric: string;
    dataPoints: Array<{
        timestamp: Date;
        value: number;
        context?: Record<string, unknown>;
    }>;
    trendDirection: 'up' | 'down' | 'stable';
    trendStrength: number;
    confidence: number;
}
export interface AnalyticsInsight {
    id: string;
    title: string;
    description: string;
    severity: 'info' | 'warning' | 'critical';
    category: 'performance' | 'quality' | 'efficiency' | 'reliability';
    impact: 'low' | 'medium' | 'high';
    recommendation: string;
    actionable: boolean;
    relatedMetrics: string[];
    timestamp: Date;
}
export interface PerformanceBenchmark {
    metric: string;
    target: number;
    warning: number;
    critical: number;
    unit: string;
    description: string;
}
/**
 * Advanced Performance Analytics Dashboard
 *
 * Provides comprehensive performance monitoring, trend analysis, and actionable insights
 * for autonomous task management system with real-time analytics and optimization recommendations.
 */
export declare class PerformanceAnalyticsDashboard extends EventEmitter {
    private readonly logger;
    private metrics;
    private insights;
    private benchmarks;
    private trendData;
    private metricsInterval?;
    private insightsInterval?;
    private retentionDays;
    private taskExecutionTimes;
    private agentPerformanceHistory;
    private systemHealthHistory;
    constructor(options?: {
        retentionDays?: number;
        metricsIntervalMs?: number;
        insightsIntervalMs?: number;
    });
    /**
     * Record a performance metric
     */
    recordMetric(name: string, value: number, unit: string, category: PerformanceMetric['category'], tags?: Record<string, string>, context?: Record<string, unknown>): void;
    /**
     * Process task lifecycle events for performance tracking
     */
    onTaskEvent(event: 'registered' | 'started' | 'completed' | 'failed', data: {
        task: TaskMetadata;
        update?: TaskStatusUpdate;
        agent?: AgentStatus;
    }): void;
    /**
     * Process agent performance data
     */
    onAgentEvent(event: 'registered' | 'heartbeat' | 'status_changed', data: {
        agent: AgentStatus;
    }): void;
    /**
     * Get current performance dashboard data
     */
    getDashboardData(): {
        realTimeMetrics: Record<string, PerformanceMetric>;
        trends: TrendData[];
        insights: AnalyticsInsight[];
        benchmarkStatus: Array<{
            metric: string;
            current: number;
            target: number;
            status: 'good' | 'warning' | 'critical';
            benchmark: PerformanceBenchmark;
        }>;
        systemOverview: {
            totalTasks: number;
            activeTasks: number;
            completionRate: number;
            averageExecutionTime: number;
            systemEfficiency: number;
            agentUtilization: number;
        };
    };
    /**
     * Get performance analytics for a specific time period
     */
    getAnalytics(timeRange: {
        start: Date;
        end: Date;
    }, metrics?: string[]): {
        metrics: Record<string, PerformanceMetric[]>;
        aggregations: Record<string, {
            average: number;
            min: number;
            max: number;
            count: number;
            sum: number;
        }>;
        trends: TrendData[];
    };
    /**
     * Generate optimization recommendations based on current performance data
     */
    generateOptimizationRecommendations(): AnalyticsInsight[];
    /**
     * Export analytics data for external systems
     */
    exportData(format?: 'json' | 'csv'): string;
    private initializeDefaultBenchmarks;
    private setupPeriodicAnalysis;
    private collectSystemMetrics;
    private generateInsights;
    private handleTaskCompletion;
    private handleTaskFailure;
    private recordAgentPerformance;
    private updateTrendData;
    private calculateTrend;
    private calculateCorrelation;
    private cleanupOldMetrics;
    private getBenchmarkStatus;
    private calculateSystemOverview;
    private getMetricsByCategory;
    private getMetricsByName;
    private calculateAverageMetric;
    private calculateAgentUtilization;
    private calculateCurrentThroughput;
    private generateMetricId;
    private generateInsightId;
    /**
     * Cleanup resources
     */
    destroy(): void;
}
/**
 * Singleton instance for global access
 */
export declare const performanceAnalyticsDashboard: PerformanceAnalyticsDashboard;
