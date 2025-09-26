/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { UsageMetrics, OptimizationRecommendation, FeatureCostAnalysis, PatternAnalysis, AnomalyDetection } from './AnalyticsEngine.js';
/**
 * Advanced optimization engine generating intelligent cost reduction recommendations
 */
export declare class OptimizationEngine {
    private targetSavingsPercentage;
    private includeComplexRecommendations;
    private readonly OPTIMIZATION_STRATEGIES;
    constructor(targetSavingsPercentage?: number, includeComplexRecommendations?: boolean);
    /**
     * Generate comprehensive optimization recommendations
     */
    generateOptimizationRecommendations(metrics: UsageMetrics[], featureAnalysis: FeatureCostAnalysis[], patternAnalysis: PatternAnalysis[], anomalies: AnomalyDetection[]): Promise<OptimizationRecommendation[]>;
    /**
     * Generate cost reduction recommendations based on cost analysis
     */
    private generateCostReductionRecommendations;
    /**
     * Generate feature-specific optimizations
     */
    private generateFeatureOptimizations;
    /**
     * Generate pattern-based optimizations
     */
    private generatePatternBasedOptimizations;
    /**
     * Generate system-wide optimization recommendations
     */
    private generateSystemWideOptimizations;
    /**
     * Generate advanced optimization recommendations
     */
    private generateAdvancedOptimizations;
    private createFeatureOptimizationRecommendation;
    private createCachingRecommendation;
    private createBatchProcessingRecommendation;
    private createOffPeakSchedulingRecommendation;
    private performCostAnalysis;
    private calculateDaysSpan;
    private calculatePeakOffPeakCosts;
    private calculateWeekdayWeekendCosts;
    private groupCostsByDimension;
    private analyzeInefficiencies;
    private countDuplicateRequests;
    private countUncachedRepeats;
    private countOversizedResponses;
    private countOffPeakSpikes;
    private groupMetricsByUser;
    private analyzeModelUsage;
    private filterRecommendations;
    private rankRecommendations;
    private enhanceRecommendationsWithROI;
    private finalizeRecommendations;
    private calculateROI;
    private createLowROIOptimizationRecommendation;
    private createUtilizationOptimizationRecommendation;
    private createSpikeHandlingRecommendation;
    private createPredictiveScalingRecommendation;
    /**
     * Generate anomaly resolution recommendations
     */
    private generateAnomalyResolutionRecommendations;
    private createPeriodicOptimizationRecommendation;
    private createBusinessHoursOptimizationRecommendation;
    private createWeekendOptimizationRecommendation;
    private createBurstHandlingRecommendation;
    private createGradualIncreaseOptimizationRecommendation;
    private createCostTrendOptimizationRecommendation;
    private createPeakUsageOptimizationRecommendation;
    private createRedundancyEliminationRecommendation;
    private createGeographicOptimizationRecommendation;
    private createModelOptimizationRecommendation;
    private createAIOptimizationRecommendation;
    private createMultiCloudOptimizationRecommendation;
}
