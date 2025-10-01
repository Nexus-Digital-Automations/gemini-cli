/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * @fileoverview Data aggregation system for token usage analytics
 * Provides time-series aggregation, windowing, and statistical analysis
 *
 * @author Claude Code - Real-Time Token Usage Monitoring Agent
 * @version 1.0.0
 */
import { EventEmitter } from 'node:events';
import type { MetricsDataPoint } from './metrics-collector.js';
/**
 * Aggregation time window configuration
 */
export interface TimeWindow {
    /** Window identifier */
    id: string;
    /** Window name */
    name: string;
    /** Window duration in milliseconds */
    durationMs: number;
    /** Aggregation interval within window */
    intervalMs: number;
    /** Window alignment */
    alignment: 'calendar' | 'sliding' | 'tumbling';
}
/**
 * Aggregation function configuration
 */
export interface AggregationFunction {
    /** Function name */
    name: string;
    /** Field to aggregate */
    field: string;
    /** Aggregation type */
    type: 'sum' | 'avg' | 'min' | 'max' | 'count' | 'percentile' | 'variance' | 'custom';
    /** Custom aggregation function */
    customFunction?: (values: number[]) => number;
    /** Percentile value (for percentile type) */
    percentile?: number;
}
/**
 * Aggregation configuration
 */
export interface AggregationConfig {
    /** Aggregation identifier */
    id: string;
    /** Human-readable name */
    name: string;
    /** Time windows to aggregate over */
    timeWindows: TimeWindow[];
    /** Aggregation functions to apply */
    functions: AggregationFunction[];
    /** Data source filters */
    filters?: {
        models?: string[];
        features?: string[];
        sessions?: string[];
        minCost?: number;
        maxCost?: number;
    };
    /** Whether aggregation is active */
    enabled: boolean;
    /** Update frequency in milliseconds */
    updateFrequencyMs: number;
}
/**
 * Aggregated data point
 */
export interface AggregatedDataPoint {
    /** Timestamp of aggregation */
    timestamp: Date;
    /** Time window used */
    window: TimeWindow;
    /** Aggregation function used */
    function: AggregationFunction;
    /** Aggregated value */
    value: number;
    /** Number of data points aggregated */
    count: number;
    /** Additional metadata */
    metadata: {
        min?: number;
        max?: number;
        standardDeviation?: number;
        confidence?: number;
    };
}
/**
 * Aggregation result set
 */
export interface AggregationResult {
    /** Aggregation configuration ID */
    configId: string;
    /** Generation timestamp */
    timestamp: Date;
    /** Aggregated data points */
    dataPoints: AggregatedDataPoint[];
    /** Summary statistics */
    summary: {
        totalDataPoints: number;
        timeRange: {
            start: Date;
            end: Date;
        };
        coverage: number;
    };
}
/**
 * Windowed data result structure
 */
export interface WindowedData {
    /** Time window used */
    window: TimeWindow;
    /** Data points in window */
    dataPoints: MetricsDataPoint[];
    /** Window start time */
    startTime: Date;
    /** Window end time */
    endTime: Date;
}
/**
 * Statistical analysis result
 */
export interface StatisticalAnalysis {
    /** Mean value */
    mean: number;
    /** Median value */
    median: number;
    /** Standard deviation */
    standardDeviation: number;
    /** Variance */
    variance: number;
    /** Skewness */
    skewness: number;
    /** Kurtosis */
    kurtosis: number;
    /** Percentiles */
    percentiles: {
        p10: number;
        p25: number;
        p50: number;
        p75: number;
        p90: number;
        p95: number;
        p99: number;
    };
    /** Trend analysis */
    trend: {
        slope: number;
        correlation: number;
        strength: 'strong' | 'moderate' | 'weak' | 'none';
        direction: 'up' | 'down' | 'stable';
    };
}
/**
 * Comprehensive data aggregation system for token usage analytics
 *
 * This class provides sophisticated data aggregation capabilities for
 * analyzing token usage patterns, computing statistical measures, and
 * generating time-series analytics. It supports multiple aggregation
 * functions, flexible time windows, and real-time processing.
 *
 * Features:
 * - Time-windowed aggregations (sliding, tumbling, calendar-aligned)
 * - Multiple aggregation functions (sum, avg, percentiles, etc.)
 * - Statistical analysis and trend detection
 * - Filtered aggregations based on models, features, sessions
 * - Real-time and batch processing modes
 * - Memory-efficient sliding window management
 */
export declare class TokenDataAggregator extends EventEmitter {
    private readonly logger;
    private readonly aggregationConfigs;
    private readonly timeBuckets;
    private readonly aggregationResults;
    private readonly updateTimers;
    private readonly standardTimeWindows;
    constructor();
    /**
     * Add aggregation configuration
     */
    addAggregation(config: AggregationConfig): void;
    /**
     * Remove aggregation configuration
     */
    removeAggregation(configId: string): boolean;
    /**
     * Process new metrics data point
     */
    addDataPoint(dataPoint: MetricsDataPoint): void;
    /**
     * Process batch of metrics data points
     */
    addDataPoints(dataPoints: MetricsDataPoint[]): void;
    /**
     * Get aggregation results
     */
    getAggregationResults(configId?: string): Record<string, AggregationResult>;
    /**
     * Perform statistical analysis on data
     */
    analyzeStatistics(dataPoints: MetricsDataPoint[], field?: keyof MetricsDataPoint): StatisticalAnalysis;
    /**
     * Get time-windowed data
     */
    getWindowedData(window: TimeWindow, endTime?: Date, maxWindows?: number): WindowedData[];
    /**
     * Enable/disable aggregation
     */
    setAggregationEnabled(configId: string, enabled: boolean): boolean;
    /**
     * Clear all aggregation data
     */
    clearAll(): void;
    /**
     * Initialize time buckets for aggregation
     */
    private initializeTimeBuckets;
    /**
     * Add data point to specific aggregation
     */
    private addDataPointToAggregation;
    /**
     * Find or create time bucket for data point
     */
    private findOrCreateBucket;
    /**
     * Calculate bucket start time based on window alignment
     */
    private calculateBucketStart;
    /**
     * Check if data point matches filters
     */
    private matchesFilter;
    /**
     * Clean up old time buckets
     */
    private cleanupOldBuckets;
    /**
     * Start update timer for aggregation
     */
    private startUpdateTimer;
    /**
     * Update aggregation results
     */
    private updateAggregation;
    /**
     * Apply aggregation function to data points
     */
    private applyAggregationFunction;
    /**
     * Calculate percentile
     */
    private calculatePercentile;
    /**
     * Calculate skewness
     */
    private calculateSkewness;
    /**
     * Calculate kurtosis
     */
    private calculateKurtosis;
    /**
     * Calculate trend analysis
     */
    private calculateTrend;
    /**
     * Create empty statistics
     */
    private createEmptyStatistics;
    /**
     * Setup default aggregation configurations
     */
    private setupDefaultAggregations;
}
/**
 * Create a new TokenDataAggregator instance
 */
export declare function createTokenDataAggregator(): TokenDataAggregator;
/**
 * Get or create the global aggregator instance
 */
export declare function getGlobalTokenAggregator(): TokenDataAggregator;
/**
 * Reset the global aggregator instance
 */
export declare function resetGlobalTokenAggregator(): void;
