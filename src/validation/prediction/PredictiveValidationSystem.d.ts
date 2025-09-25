/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Predictive Validation System for failure prediction and alerting
 * Uses multiple models to predict validation failures and generate alerts
 *
 * @author Claude Code - Validation Agent
 * @version 1.0.0
 */
import { EventEmitter } from 'node:events';
import type { ValidationReport } from '../core/ValidationEngine.js';
/**
 * Predictive alert definition
 */
export interface PredictiveAlert {
    id: string;
    title: string;
    severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
    message: string;
    details: string;
    confidence: number;
    predictedAt: Date;
    timestamp: Date;
    type: 'failure_risk' | 'performance_degradation' | 'resource_exhaustion' | 'quality_decline';
    affectedSystems: string[];
    recommendedActions: string[];
    metadata: Record<string, any>;
}
/**
 * Prediction statistics
 */
interface PredictionStats {
    totalPredictions: number;
    alertsGenerated: number;
    accuracyRate: number;
    falsePositiveRate: number;
    falseNegativeRate: number;
    averageConfidence: number;
    modelPerformance: Record<string, {
        predictions: number;
        accuracy: number;
        avgConfidence: number;
    }>;
    recentTrends: {
        failureRate: number;
        performanceTrend: 'improving' | 'stable' | 'declining';
        qualityTrend: 'improving' | 'stable' | 'declining';
    };
}
/**
 * Prediction model configuration
 */
interface ModelConfig {
    enabled: boolean;
    weight: number;
    parameters: Record<string, any>;
    thresholds: {
        warning: number;
        alert: number;
        critical: number;
    };
}
/**
 * System configuration for predictive validation
 */
interface PredictiveSystemConfig {
    enabled: boolean;
    models: {
        movingAverage: ModelConfig;
        patternMatching: ModelConfig;
        anomalyDetection: ModelConfig;
        resourceTrend: ModelConfig;
        qualityRegression: ModelConfig;
    };
    alerting: {
        enabled: boolean;
        minimumConfidence: number;
        cooldownPeriod: number;
        maxActiveAlerts: number;
    };
    dataRetention: {
        maxHistoryDays: number;
        maxMetricPoints: number;
        compressionThreshold: number;
    };
    analysis: {
        analysisInterval: number;
        predictionHorizon: number;
        trendAnalysisWindow: number;
    };
}
/**
 * Comprehensive Predictive Validation System
 *
 * Features:
 * - Multiple prediction models (moving average, pattern matching, anomaly detection)
 * - Real-time failure risk assessment
 * - Resource exhaustion prediction
 * - Quality degradation detection
 * - Configurable alerting system
 * - Model performance tracking
 * - Historical trend analysis
 * - Automatic model tuning
 */
export declare class PredictiveValidationSystem extends EventEmitter {
    private readonly logger;
    private readonly config;
    private readonly validationHistory;
    private readonly alertHistory;
    private readonly activeAlerts;
    private readonly modelStates;
    private lastAnalysis;
    private analysisInterval;
    private readonly modelPerformance;
    private alertIdCounter;
    private readonly alertCooldowns;
    constructor(config?: Partial<PredictiveSystemConfig>);
    /**
     * Process validation report for prediction analysis
     */
    processValidationReport(report: ValidationReport): void;
    /**
     * Get active alerts
     */
    getActiveAlerts(): PredictiveAlert[];
    /**
     * Get prediction statistics
     */
    getPredictionStatistics(): PredictionStats;
    /**
     * Force prediction analysis
     */
    runPredictionAnalysis(): Promise<PredictiveAlert[]>;
    /**
     * Initialize prediction models
     */
    private initializeModels;
    /**
     * Start analysis loop
     */
    private startAnalysisLoop;
    /**
     * Run specific prediction model
     */
    private runPredictionModel;
    /**
     * Moving average failure prediction model
     */
    private runMovingAverageModel;
    /**
     * Pattern matching failure prediction model
     */
    private runPatternMatchingModel;
    /**
     * Anomaly detection failure prediction model
     */
    private runAnomalyDetectionModel;
    /**
     * Resource trend prediction model
     */
    private runResourceTrendModel;
    /**
     * Quality regression prediction model
     */
    private runQualityRegressionModel;
    /**
     * Generate alerts from prediction results
     */
    private generateAlertsFromPredictions;
    /**
     * Helper methods for calculations
     */
    private calculateStats;
    private calculateLinearTrend;
    private calculatePatternSimilarity;
    private generateAlertTitle;
    private generateAlertMessage;
    private generateAlertDetails;
    private determineAffectedSystems;
    private generateRecommendedActions;
    private calculatePerformanceTrend;
    private calculateQualityTrend;
    private calculateFalsePositiveRate;
    private calculateFalseNegativeRate;
    private extractErrorTypes;
    private extractPerformanceMetrics;
    private classifyError;
    private getCurrentMemoryUsage;
    private getCurrentCpuUsage;
    private updateModelStates;
    private cleanupHistoricalData;
    private cleanupAlerts;
    /**
     * Shutdown the predictive system
     */
    shutdown(): Promise<void>;
}
export {};
