/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Comprehensive metrics collection and aggregation system
 * Collects detailed usage metrics from token tracker and other sources
 *
 * @author Claude Code - Real-Time Token Usage Monitoring Agent
 * @version 1.0.0
 */
import { EventEmitter } from 'node:events';
import type { TokenTracker } from './token-tracker.js';
import type { TokenUsageData, ModelUsageData } from '../types.js';
/**
 * Metrics collection configuration
 */
export interface MetricsCollectorConfig {
    /** Interval for collecting metrics snapshots (ms) */
    collectionInterval?: number;
    /** Maximum number of historical data points to keep */
    maxHistoryPoints?: number;
    /** Enable trend analysis calculations */
    enableTrendAnalysis?: boolean;
    /** Enable anomaly detection */
    enableAnomalyDetection?: boolean;
    /** Window size for moving averages */
    movingAverageWindow?: number;
    /** Threshold for anomaly detection (standard deviations) */
    anomalyThreshold?: number;
}
/**
 * Time series data point for metrics
 */
export interface MetricsDataPoint {
    timestamp: Date;
    totalCost: number;
    requestCount: number;
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    averageResponseTime: number;
    activeRequests: number;
    errorRate: number;
    costRate: number;
    tokenRate: number;
    requestRate: number;
}
/**
 * Aggregated metrics summary
 */
export interface MetricsSummary {
    current: MetricsDataPoint;
    lastHour: AggregatedMetrics;
    lastDay: AggregatedMetrics;
    lastWeek: AggregatedMetrics;
    trends: TrendAnalysis;
    anomalies: AnomalyData[];
    topModels: ModelUsageData[];
    topFeatures: Array<{
        feature: string;
        usage: TokenUsageData;
    }>;
    topSessions: Array<{
        sessionId: string;
        usage: TokenUsageData;
    }>;
}
/**
 * Aggregated metrics for time periods
 */
export interface AggregatedMetrics {
    totalCost: number;
    totalRequests: number;
    totalTokens: number;
    averageResponseTime: number;
    errorCount: number;
    errorRate: number;
    peakCostRate: number;
    peakTokenRate: number;
    peakRequestRate: number;
    averageCostPerRequest: number;
    averageTokensPerRequest: number;
}
/**
 * Trend analysis data
 */
export interface TrendAnalysis {
    costTrend: TrendData;
    usageTrend: TrendData;
    performanceTrend: TrendData;
    errorTrend: TrendData;
    predictions: PredictionData;
}
/**
 * Individual trend data
 */
export interface TrendData {
    direction: 'up' | 'down' | 'stable';
    magnitude: number;
    confidence: number;
    period: string;
    dataPoints: number;
    correlation: number;
}
/**
 * Prediction data for forecasting
 */
export interface PredictionData {
    nextHourCost: number;
    nextDayCost: number;
    budgetRunoutPrediction: Date | null;
    confidence: number;
}
/**
 * Anomaly detection data
 */
export interface AnomalyData {
    timestamp: Date;
    type: 'cost_spike' | 'usage_spike' | 'error_spike' | 'performance_drop';
    severity: 'low' | 'medium' | 'high' | 'critical';
    value: number;
    expectedValue: number;
    deviationScore: number;
    description: string;
}
/**
 * Metrics event for real-time updates
 */
export interface MetricsEvent {
    type: 'snapshot' | 'trend_update' | 'anomaly_detected' | 'summary_update';
    timestamp: Date;
    data: any;
}
/**
 * Comprehensive metrics collection and analysis system
 *
 * This class aggregates data from the TokenTracker and other sources to provide
 * detailed analytics, trend analysis, and anomaly detection for token usage.
 * It maintains historical data, calculates moving averages, and provides
 * real-time metrics updates for the dashboard.
 */
export declare class MetricsCollector extends EventEmitter {
    private readonly logger;
    private readonly config;
    private readonly tokenTracker;
    private readonly historicalData;
    private readonly anomalies;
    private collectionTimer;
    private lastSnapshot;
    private isCollecting;
    constructor(tokenTracker: TokenTracker, config?: MetricsCollectorConfig);
    /**
     * Start metrics collection
     */
    start(): void;
    /**
     * Stop metrics collection
     */
    stop(): void;
    /**
     * Get current metrics summary
     */
    getMetricsSummary(): MetricsSummary;
    /**
     * Get historical data points
     */
    getHistoricalData(startTime?: Date, endTime?: Date, maxPoints?: number): MetricsDataPoint[];
    /**
     * Get anomalies within a time range
     */
    getAnomalies(hours?: number): AnomalyData[];
    /**
     * Reset all collected data
     */
    reset(): void;
    /**
     * Collect a metrics snapshot
     */
    private collectSnapshot;
    /**
     * Add a data point to historical data
     */
    private addHistoricalDataPoint;
    /**
     * Get current snapshot of metrics
     */
    private getCurrentSnapshot;
    /**
     * Get aggregated metrics for a time period
     */
    private getAggregatedMetrics;
    default: break;
}
/**
 * Create a new MetricsCollector instance
 */
export declare function createMetricsCollector(tokenTracker: TokenTracker, config?: MetricsCollectorConfig): MetricsCollector;
