/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { AllocationCandidate } from '../types.js';
export interface EfficiencyMetrics {
    resourceUtilization: number;
    costEffectiveness: number;
    timeToValue: number;
    scalabilityFactor: number;
    riskAdjustedReturn: number;
}
export interface EfficiencyAnalysisResult {
    candidate: AllocationCandidate;
    metrics: EfficiencyMetrics;
    overallScore: number;
    recommendations: string[];
    confidence: number;
}
/**
 * Analyzes allocation efficiency and optimization opportunities
 */
export declare class EfficiencyAnalyzer {
    private readonly logger;
    /**
     * Performs comprehensive efficiency analysis on allocation candidates
     */
    analyzeEfficiency(candidates: AllocationCandidate[]): Promise<EfficiencyAnalysisResult[]>;
    /**
     * Calculates detailed efficiency metrics for a candidate
     */
    private calculateEfficiencyMetrics;
    /**
     * Calculates resource utilization efficiency
     */
    private calculateResourceUtilization;
    /**
     * Calculates cost effectiveness score
     */
    private calculateCostEffectiveness;
    /**
     * Calculates time to value metric
     */
    private calculateTimeToValue;
    /**
     * Calculates scalability factor
     */
    private calculateScalabilityFactor;
    /**
     * Calculates risk-adjusted return
     */
    private calculateRiskAdjustedReturn;
    /**
     * Computes overall efficiency score from metrics
     */
    private computeOverallScore;
    /**
     * Generates optimization recommendations
     */
    private generateRecommendations;
    /**
     * Calculates confidence level for the analysis
     */
    private calculateConfidence;
    /**
     * Converts priority enum to numeric value for calculations
     */
    private getPriorityValue;
    /**
     * Gets time multiplier based on priority level
     */
    private getPriorityTimeMultiplier;
}
