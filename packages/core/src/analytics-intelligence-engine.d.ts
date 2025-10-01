/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import EventEmitter from 'node:events';
import type { RealtimeTokenTracker } from './realtime-token-tracker.js';
import type { AnalyticsStorageEngine } from './analytics-storage-engine.js';
/**
 * Usage pattern detection results
 */
export interface UsagePattern {
    readonly type: 'cost_spike' | 'unusual_latency' | 'model_switching' | 'high_error_rate' | 'token_anomaly';
    readonly severity: 'low' | 'medium' | 'high' | 'critical';
    readonly description: string;
    readonly detectedAt: number;
    readonly affectedSessions: string[];
    readonly affectedModels: string[];
    readonly statistics: {
        readonly baseline: number;
        readonly current: number;
        readonly percentageChange: number;
        readonly confidence: number;
    };
    readonly recommendations: CostOptimizationRecommendation[];
    readonly metadata: Record<string, unknown>;
}
/**
 * Cost optimization recommendation
 */
export interface CostOptimizationRecommendation {
    readonly type: 'model_switching' | 'prompt_optimization' | 'caching_strategy' | 'batch_processing' | 'rate_limiting';
    readonly priority: 'low' | 'medium' | 'high';
    readonly title: string;
    readonly description: string;
    readonly estimatedSavingsUsd: number;
    readonly estimatedSavingsPercentage: number;
    readonly implementationComplexity: 'easy' | 'medium' | 'hard';
    readonly actionItems: string[];
    readonly validFor: {
        readonly models: string[];
        readonly usagePeriods: string[];
        readonly sessionTypes: string[];
    };
}
/**
 * Performance prediction result
 */
export interface PerformancePrediction {
    readonly predictedLatencyMs: number;
    readonly predictedCostUsd: number;
    readonly predictedTokens: number;
    readonly confidence: number;
    readonly basedOnSamples: number;
    readonly factors: {
        readonly modelType: number;
        readonly promptLength: number;
        readonly timeOfDay: number;
        readonly sessionHistory: number;
    };
}
/**
 * Anomaly detection configuration
 */
export interface AnomalyDetectionConfig {
    readonly enableRealtime: boolean;
    readonly sensitivity: 'low' | 'medium' | 'high';
    readonly lookbackHours: number;
    readonly minSamplesRequired: number;
    readonly alertThresholds: {
        readonly costSpikeMultiplier: number;
        readonly latencyMultiplier: number;
        readonly errorRateThreshold: number;
        readonly tokenAnomalyStdDev: number;
    };
}
/**
 * Advanced analytics intelligence engine with ML-powered insights
 */
export declare class AnalyticsIntelligenceEngine extends EventEmitter {
    private readonly tokenTracker;
    private readonly storageEngine;
    private readonly config;
    private readonly predictor;
    private readonly detectedPatterns;
    private readonly lastAnalysisTime;
    private analysisInterval;
    private readonly minAnalysisIntervalMs;
    constructor(tokenTracker: RealtimeTokenTracker, storageEngine: AnalyticsStorageEngine, config: AnomalyDetectionConfig);
    /**
     * Analyze current usage patterns and detect anomalies
     */
    analyzeUsagePatterns(sessionId?: string, timeRangeMs?: number): Promise<UsagePattern[]>;
    /**
     * Generate cost optimization recommendations
     */
    generateOptimizationRecommendations(sessionId?: string, timeRangeMs?: number): Promise<CostOptimizationRecommendation[]>;
    /**
     * Predict performance for upcoming requests
     */
    predictPerformance(context: {
        model: string;
        promptLength: number;
        sessionId?: string;
    }): PerformancePrediction;
    /**
     * Get insights dashboard data
     */
    getDashboardInsights(timeRangeMs?: number): Promise<{
        patterns: UsagePattern[];
        recommendations: CostOptimizationRecommendation[];
        statistics: {
            totalCost: number;
            totalTokens: number;
            averageLatency: number;
            errorRate: number;
            topModels: Array<{
                model: string;
                usage: number;
                cost: number;
            }>;
            costTrend: {
                slope: number;
                isIncreasing: boolean;
            };
            anomalyCount: number;
        };
    }>;
    private detectCostAnomalies;
    private detectLatencyAnomalies;
    private detectErrorRateAnomalies;
    private detectTokenAnomalies;
    private detectModelSwitchingPatterns;
    private analyzeModelUsageEfficiency;
    private analyzePromptEfficiency;
    private analyzeCachingOpportunities;
    private analyzeBatchingOpportunities;
    private analyzeRateLimitingOpportunities;
    private getRecentPatterns;
    private setupRealtimeAnalysis;
    private setupBackgroundTraining;
    /**
     * Cleanup method for graceful shutdown
     */
    cleanup(): void;
}
/**
 * Get or create the global AnalyticsIntelligenceEngine instance
 */
export declare function getGlobalIntelligenceEngine(tokenTracker: RealtimeTokenTracker, storageEngine: AnalyticsStorageEngine, config?: Partial<AnomalyDetectionConfig>): AnalyticsIntelligenceEngine;
/**
 * Reset the global intelligence engine (mainly for testing)
 */
export declare function resetGlobalIntelligenceEngine(): void;
