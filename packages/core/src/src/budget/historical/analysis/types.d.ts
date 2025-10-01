/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * @fileoverview Historical data analysis type definitions
 * Provides comprehensive trend analysis and insights for budget usage data
 *
 * @author Historical Data Storage and Analysis Agent
 * @version 1.0.0
 */
import type { BudgetUsageTimeSeriesPoint } from '../storage/types.js';
/**
 * Time period for trend analysis
 */
export type TrendPeriod = 'hourly' | 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom';
/**
 * Direction of trend movement
 */
export type TrendDirection = 'increasing' | 'decreasing' | 'stable' | 'volatile';
/**
 * Confidence level for trend predictions
 */
export type ConfidenceLevel = 'low' | 'medium' | 'high';
/**
 * Analysis metric types for budget usage
 */
export type AnalysisMetric = 'cost' | 'usage_percentage' | 'request_count' | 'efficiency' | 'variance' | 'growth_rate';
/**
 * Trend analysis result for a specific metric
 */
export interface TrendAnalysis {
    /** Metric being analyzed */
    metric: AnalysisMetric;
    /** Time period covered */
    period: TrendPeriod;
    /** Start timestamp of analysis window */
    startTime: number;
    /** End timestamp of analysis window */
    endTime: number;
    /** Overall trend direction */
    direction: TrendDirection;
    /** Strength of the trend (0-1) */
    strength: number;
    /** Statistical confidence in the analysis */
    confidence: ConfidenceLevel;
    /** Rate of change per unit time */
    changeRate: number;
    /** Current value */
    currentValue: number;
    /** Predicted next value */
    predictedValue: number;
    /** Correlation coefficient for trend line */
    correlation: number;
    /** Statistical significance p-value */
    pValue: number;
    /** Data points used in analysis */
    dataPointCount: number;
    /** Variance in the data */
    variance: number;
    /** Standard deviation */
    standardDeviation: number;
}
/**
 * Seasonal pattern detection result
 */
export interface SeasonalPattern {
    /** Pattern type identifier */
    patternType: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
    /** Seasonal component values */
    seasonalComponents: number[];
    /** Strength of seasonal pattern (0-1) */
    seasonalStrength: number;
    /** Peak usage times/periods */
    peakPeriods: Array<{
        period: string;
        value: number;
        percentile: number;
    }>;
    /** Low usage times/periods */
    troughPeriods: Array<{
        period: string;
        value: number;
        percentile: number;
    }>;
    /** Confidence in pattern detection */
    confidence: ConfidenceLevel;
    /** Next expected peak */
    nextPeak?: {
        timestamp: number;
        predictedValue: number;
        confidence: number;
    };
}
/**
 * Anomaly detection result
 */
export interface AnomalyDetection {
    /** Detected anomalies */
    anomalies: Array<{
        timestamp: number;
        value: number;
        expectedValue: number;
        severity: 'low' | 'medium' | 'high' | 'critical';
        type: 'spike' | 'drop' | 'outlier' | 'drift';
        description: string;
        confidence: number;
    }>;
    /** Anomaly detection threshold */
    threshold: number;
    /** Total anomalies found */
    anomalyCount: number;
    /** Detection sensitivity setting */
    sensitivity: 'low' | 'medium' | 'high';
    /** Analysis window used */
    analysisWindow: {
        startTime: number;
        endTime: number;
    };
}
/**
 * Cost efficiency analysis
 */
export interface EfficiencyAnalysis {
    /** Overall efficiency score (0-1) */
    efficiencyScore: number;
    /** Cost per request over time */
    costPerRequest: Array<{
        timestamp: number;
        cost: number;
        requests: number;
        efficiency: number;
    }>;
    /** Efficiency trend */
    trend: TrendAnalysis;
    /** Waste detection */
    wasteAnalysis: {
        unusedBudget: number;
        inefficientPeriods: Array<{
            start: number;
            end: number;
            wastedAmount: number;
            reason: string;
        }>;
        recommendations: string[];
    };
    /** Optimization opportunities */
    optimizations: Array<{
        opportunity: string;
        potentialSavings: number;
        implementation: string;
        priority: 'low' | 'medium' | 'high';
    }>;
}
/**
 * Usage pattern insights
 */
export interface UsagePatterns {
    /** Peak usage patterns */
    peakPatterns: {
        dailyPeaks: Array<{
            hour: number;
            intensity: number;
        }>;
        weeklyPeaks: Array<{
            day: string;
            intensity: number;
        }>;
        monthlyPeaks: Array<{
            week: number;
            intensity: number;
        }>;
    };
    /** Usage distribution */
    distribution: {
        lowUsage: number;
        mediumUsage: number;
        highUsage: number;
        criticalUsage: number;
    };
    /** Session patterns */
    sessionPatterns: {
        averageSessionLength: number;
        sessionFrequency: number;
        concurrentSessions: Array<{
            timestamp: number;
            sessionCount: number;
        }>;
    };
    /** Feature usage correlation */
    featureCorrelations: Array<{
        feature: string;
        correlation: number;
        significance: number;
    }>;
}
/**
 * Comprehensive insights report
 */
export interface InsightsReport {
    /** Report generation timestamp */
    generatedAt: number;
    /** Analysis period */
    analysisPeriod: {
        start: number;
        end: number;
        duration: number;
    };
    /** Executive summary */
    summary: {
        totalCost: number;
        totalRequests: number;
        averageEfficiency: number;
        trendDirection: TrendDirection;
        keyInsights: string[];
        recommendations: string[];
    };
    /** Detailed trend analyses */
    trends: TrendAnalysis[];
    /** Seasonal patterns */
    seasonality: SeasonalPattern[];
    /** Anomaly detection results */
    anomalies: AnomalyDetection;
    /** Efficiency analysis */
    efficiency: EfficiencyAnalysis;
    /** Usage patterns */
    patterns: UsagePatterns;
    /** Forecast predictions */
    forecasts: Array<{
        metric: AnalysisMetric;
        predictions: Array<{
            timestamp: number;
            predictedValue: number;
            confidence: number;
            range: {
                min: number;
                max: number;
            };
        }>;
        accuracy: number;
    }>;
    /** Data quality assessment */
    dataQuality: {
        completeness: number;
        consistency: number;
        accuracy: number;
        timeliness: number;
        issues: string[];
    };
}
/**
 * Analysis configuration options
 */
export interface AnalysisConfig {
    /** Metrics to analyze */
    metrics: AnalysisMetric[];
    /** Analysis period */
    period: TrendPeriod;
    /** Custom time range for analysis */
    timeRange?: {
        start: number;
        end: number;
    };
    /** Anomaly detection sensitivity */
    anomalySensitivity: 'low' | 'medium' | 'high';
    /** Minimum data points required */
    minDataPoints: number;
    /** Confidence threshold for insights */
    confidenceThreshold: number;
    /** Include seasonal analysis */
    includeSeasonality: boolean;
    /** Include forecasting */
    includeForecast: boolean;
    /** Forecast horizon (days) */
    forecastHorizon?: number;
    /** Advanced statistical analysis */
    advancedAnalysis: boolean;
}
/**
 * Trend analysis engine interface
 */
export interface TrendAnalysisEngine {
    /**
     * Analyze trends for specific metrics
     */
    analyzeTrends(data: BudgetUsageTimeSeriesPoint[], config: AnalysisConfig): Promise<TrendAnalysis[]>;
    /**
     * Detect seasonal patterns in data
     */
    detectSeasonality(data: BudgetUsageTimeSeriesPoint[], metric: AnalysisMetric): Promise<SeasonalPattern[]>;
    /**
     * Identify anomalies in usage patterns
     */
    detectAnomalies(data: BudgetUsageTimeSeriesPoint[], sensitivity: 'low' | 'medium' | 'high'): Promise<AnomalyDetection>;
    /**
     * Analyze cost efficiency patterns
     */
    analyzeEfficiency(data: BudgetUsageTimeSeriesPoint[]): Promise<EfficiencyAnalysis>;
    /**
     * Extract usage patterns and insights
     */
    extractPatterns(data: BudgetUsageTimeSeriesPoint[]): Promise<UsagePatterns>;
    /**
     * Generate comprehensive insights report
     */
    generateInsights(data: BudgetUsageTimeSeriesPoint[], config: AnalysisConfig): Promise<InsightsReport>;
    /**
     * Forecast future values
     */
    forecast(data: BudgetUsageTimeSeriesPoint[], metric: AnalysisMetric, horizon: number): Promise<Array<{
        timestamp: number;
        predictedValue: number;
        confidence: number;
        range: {
            min: number;
            max: number;
        };
    }>>;
}
/**
 * Factory function type for creating trend analysis engines
 */
export type CreateTrendAnalysisEngine = (config?: Partial<AnalysisConfig>) => TrendAnalysisEngine;
/**
 * Analysis job for background processing
 */
export interface AnalysisJob {
    /** Unique job identifier */
    id: string;
    /** Job type */
    type: 'trend' | 'seasonal' | 'anomaly' | 'efficiency' | 'forecast' | 'insights';
    /** Job status */
    status: 'pending' | 'running' | 'completed' | 'failed';
    /** Analysis configuration */
    config: AnalysisConfig;
    /** Data source query */
    dataQuery: {
        startTime: number;
        endTime: number;
        filters?: Record<string, unknown>;
    };
    /** Job creation timestamp */
    createdAt: number;
    /** Job start timestamp */
    startedAt?: number;
    /** Job completion timestamp */
    completedAt?: number;
    /** Job result */
    result?: InsightsReport | TrendAnalysis[] | AnomalyDetection;
    /** Error information if job failed */
    error?: {
        message: string;
        code: string;
        details: Record<string, unknown>;
    };
    /** Progress percentage (0-100) */
    progress: number;
    /** Estimated completion time */
    estimatedCompletion?: number;
}
/**
 * Analysis scheduler interface
 */
export interface AnalysisScheduler {
    /**
     * Schedule analysis job
     */
    scheduleJob(job: Omit<AnalysisJob, 'id' | 'createdAt' | 'status' | 'progress'>): Promise<string>;
    /**
     * Get job status
     */
    getJobStatus(jobId: string): Promise<AnalysisJob | null>;
    /**
     * Cancel running job
     */
    cancelJob(jobId: string): Promise<boolean>;
    /**
     * List jobs with optional filtering
     */
    listJobs(filter?: {
        type?: AnalysisJob['type'];
        status?: AnalysisJob['status'];
        limit?: number;
    }): Promise<AnalysisJob[]>;
    /**
     * Clean up completed jobs
     */
    cleanupJobs(olderThan: number): Promise<number>;
}
