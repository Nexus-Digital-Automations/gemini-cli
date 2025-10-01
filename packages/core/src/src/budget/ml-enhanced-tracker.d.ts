/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * @fileoverview Machine Learning Enhanced Budget Tracker
 * Provides ML-powered budget tracking, forecasting, and optimization
 *
 * @author Claude Code - Budget ML Agent
 * @version 1.0.0
 */
import type { BudgetSettings, BudgetUsageData, ForecastPoint, MLBudgetRecommendation, MLRiskAssessment, PredictionConfidence, BudgetValidationResult, BudgetCalculationContext, HistoricalDataPoint } from './types.js';
/**
 * ML Enhanced Budget Tracker interface
 */
export interface MLEnhancedBudgetTracker {
    /** Project root directory */
    projectRoot: string;
    /** Budget settings */
    settings: BudgetSettings;
    /**
     * Generate cost forecast for the specified time period
     */
    generateForecast(hours: number): Promise<ForecastPoint[]>;
    /**
     * Get ML-powered budget recommendations
     */
    getRecommendations(): Promise<MLBudgetRecommendation[]>;
    /**
     * Perform risk assessment
     */
    assessRisk(): Promise<MLRiskAssessment>;
    /**
     * Get prediction confidence metrics
     */
    getPredictionConfidence(): Promise<PredictionConfidence>;
    /**
     * Detect usage anomalies
     */
    detectAnomalies(): Promise<{
        anomalies: Array<{
            timestamp: string;
            severity: 'low' | 'medium' | 'high';
            description: string;
            value: number;
            expected: number;
        }>;
        confidence: number;
    }>;
    /**
     * Get model performance metrics
     */
    getModelMetrics(): Promise<{
        accuracy: number;
        precision: number;
        recall: number;
        f1Score: number;
        lastUpdated: string;
    }>;
    /**
     * Update tracker with new usage data
     */
    updateUsageData(data: BudgetUsageData): Promise<void>;
    /**
     * Validate budget operation with ML insights
     */
    validateOperation(context: BudgetCalculationContext): Promise<BudgetValidationResult>;
    /**
     * Train the ML model with historical data
     */
    trainModel(historicalData: HistoricalDataPoint[]): Promise<void>;
    /**
     * Get historical trend analysis
     */
    getTrendAnalysis(): Promise<{
        trend: 'increasing' | 'decreasing' | 'stable';
        changeRate: number;
        seasonality: boolean;
        patterns: string[];
    }>;
}
/**
 * Implementation of ML Enhanced Budget Tracker
 */
export declare class MLEnhancedBudgetTrackerImpl implements MLEnhancedBudgetTracker {
    readonly projectRoot: string;
    readonly settings: BudgetSettings;
    private historicalData;
    private modelLastTrained;
    private predictions;
    constructor(projectRoot: string, settings: BudgetSettings);
    /**
     * Generate cost forecast using ML models
     */
    generateForecast(hours: number): Promise<ForecastPoint[]>;
    /**
     * Get ML-powered recommendations
     */
    getRecommendations(): Promise<MLBudgetRecommendation[]>;
    /**
     * Assess current risk levels
     */
    assessRisk(): Promise<MLRiskAssessment>;
    /**
     * Get prediction confidence metrics
     */
    getPredictionConfidence(): Promise<PredictionConfidence>;
    /**
     * Detect usage anomalies
     */
    detectAnomalies(): Promise<{
        anomalies: Array<{
            timestamp: string;
            severity: 'low' | 'medium' | 'high';
            description: string;
            value: number;
            expected: number;
        }>;
        confidence: number;
    }>;
    /**
     * Get model performance metrics
     */
    getModelMetrics(): Promise<{
        accuracy: number;
        precision: number;
        recall: number;
        f1Score: number;
        lastUpdated: string;
    }>;
    /**
     * Update tracker with new usage data
     */
    updateUsageData(data: BudgetUsageData): Promise<void>;
    /**
     * Validate operation with ML insights
     */
    validateOperation(context: BudgetCalculationContext): Promise<BudgetValidationResult>;
    /**
     * Train the ML model with historical data
     */
    trainModel(historicalData: HistoricalDataPoint[]): Promise<void>;
    /**
     * Get historical trend analysis
     */
    getTrendAnalysis(): Promise<{
        trend: 'increasing' | 'decreasing' | 'stable';
        changeRate: number;
        seasonality: boolean;
        patterns: string[];
    }>;
    /**
     * Calculate base cost for predictions
     */
    private calculateBaseCost;
    /**
     * Calculate trend factor for predictions
     */
    private calculateTrendFactor;
    /**
     * Get current usage pattern
     */
    private getCurrentUsagePattern;
}
/**
 * Factory function to create ML Enhanced Budget Tracker
 */
export declare function createMLEnhancedBudgetTracker(projectRoot: string, settings: BudgetSettings): MLEnhancedBudgetTracker;
/**
 * Default export for convenience
 */
declare const _default: {
    MLEnhancedBudgetTrackerImpl: typeof MLEnhancedBudgetTrackerImpl;
    createMLEnhancedBudgetTracker: typeof createMLEnhancedBudgetTracker;
};
export default _default;
