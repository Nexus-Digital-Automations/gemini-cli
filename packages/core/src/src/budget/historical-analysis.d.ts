/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { BudgetUsageData, BudgetSettings } from './types.js';
/**
 * Historical budget usage record for trend analysis
 */
export interface HistoricalBudgetRecord {
    date: string;
    dailyUsage: number;
    dailyLimit: number;
    usagePercentage: number;
    resetTime: string;
    dayOfWeek: number;
    weekOfYear: number;
    month: number;
    quarter: number;
    year: number;
    isWeekend: boolean;
    seasonalCategory: 'low' | 'medium' | 'high' | 'peak';
    anomalyScore?: number;
    metadata?: Record<string, unknown>;
}
/**
 * Trend analysis result with confidence intervals
 */
export interface TrendAnalysis {
    trend: 'increasing' | 'decreasing' | 'stable';
    trendStrength: number;
    confidence: number;
    seasonalPattern: {
        weeklyPattern: number[];
        monthlyPattern: number[];
        quarterlyPattern: number[];
    };
    averageDailyUsage: number;
    projectedUsage: number;
    volatility: number;
    cyclicality: {
        detected: boolean;
        period?: number;
        amplitude?: number;
    };
}
/**
 * Budget forecast with scenarios and confidence intervals
 */
export interface BudgetForecast {
    targetDate: string;
    forecastUsage: number;
    confidenceInterval: {
        lower: number;
        upper: number;
        confidence: number;
    };
    scenarios: {
        optimistic: number;
        realistic: number;
        pessimistic: number;
    };
    recommendedLimit: number;
    riskAssessment: {
        overageRisk: number;
        severity: 'low' | 'medium' | 'high' | 'critical';
        mitigation?: string[];
    };
    seasonalAdjustment: number;
    trendAdjustment: number;
}
/**
 * Anomaly detection result
 */
export interface AnomalyDetection {
    date: string;
    actualUsage: number;
    expectedUsage: number;
    anomalyScore: number;
    severity: 'minor' | 'moderate' | 'major' | 'critical';
    type: 'spike' | 'drop' | 'pattern_break' | 'seasonal_anomaly';
    description: string;
    confidence: number;
    suggestedAction?: string;
}
/**
 * Historical data analysis system for budget trends and forecasting
 */
export declare class HistoricalBudgetAnalyzer {
    private readonly projectRoot;
    private readonly historicalDataPath;
    private readonly maxHistoryDays;
    private readonly anomalyThreshold;
    constructor(projectRoot: string, options?: {
        maxHistoryDays?: number;
        anomalyThreshold?: number;
    });
    /**
     * Record daily usage data for historical analysis
     */
    recordDailyUsage(usageData: BudgetUsageData, settings: BudgetSettings): Promise<void>;
    /**
     * Analyze trends in historical budget usage
     */
    analyzeTrends(lookbackDays?: number): Promise<TrendAnalysis>;
    /**
     * Generate budget forecasts for future periods
     */
    generateForecast(targetDate: string, confidence?: number, settings?: BudgetSettings): Promise<BudgetForecast>;
    /**
     * Detect anomalies in usage patterns
     */
    detectAnomalies(lookbackDays?: number): Promise<AnomalyDetection[]>;
    /**
     * Get comprehensive historical insights and recommendations
     */
    getHistoricalInsights(lookbackDays?: number): Promise<{
        summary: {
            totalDays: number;
            averageUsage: number;
            peakUsage: number;
            lowUsage: number;
            mostActiveDay: string;
            mostActiveWeekday: string;
            efficiency: number;
        };
        trends: TrendAnalysis;
        recentAnomalies: AnomalyDetection[];
        recommendations: string[];
        dataQuality: {
            completeness: number;
            consistency: number;
            reliability: number;
        };
    }>;
    private loadHistoricalData;
    private saveHistoricalData;
    private categorizeSeasonalUsage;
    private getWeekOfYear;
    private calculateTrend;
    private classifyTrend;
    private calculateSeasonalPatterns;
    private detectCyclicality;
    private calculateAutocorrelation;
    private calculateAmplitude;
    private projectUsage;
    private calculateSeasonalAdjustment;
    private calculateTrendAdjustment;
    private calculateForecastVariance;
    private getZScore;
    private calculateOverageRisk;
    private assessRiskSeverity;
    private generateMitigationStrategies;
    private classifyAnomaly;
    private generateAnomalyAction;
    private generateInsightRecommendations;
    private calculateDataConsistency;
    private calculateMedian;
}
/**
 * Create a new HistoricalBudgetAnalyzer instance
 */
export declare function createHistoricalBudgetAnalyzer(projectRoot: string, options?: {
    maxHistoryDays?: number;
    anomalyThreshold?: number;
}): HistoricalBudgetAnalyzer;
