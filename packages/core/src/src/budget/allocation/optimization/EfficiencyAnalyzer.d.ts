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
/**
 * Configuration for efficiency analysis
 */
export interface EfficiencyAnalysisConfig {
    weights: {
        resourceUtilization: number;
        costEffectiveness: number;
        timeToValue: number;
        scalabilityFactor: number;
        riskAdjustedReturn: number;
    };
    thresholds: {
        minUtilization: number;
        minCostEffectiveness: number;
        minTimeToValue: number;
        minScalability: number;
        minRiskReturn: number;
    };
}
/**
 * Resource efficiency metrics
 */
export interface ResourceEfficiency {
    resourceId: string;
    utilizationRate: number;
    costPerUnit: number;
    performanceScore: number;
    efficiencyRank: number;
    recommendations: string[];
}
/**
 * Efficiency trend analysis
 */
export interface EfficiencyTrend {
    periodStart: string;
    periodEnd: string;
    trendDirection: 'improving' | 'declining' | 'stable';
    changePercentage: number;
    keyFactors: string[];
    forecastedEfficiency: number;
}
/**
 * Efficiency issue identification
 */
export interface EfficiencyIssue {
    issueId: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    affectedResources: string[];
    potentialImpact: number;
    recommendedActions: string[];
}
/**
 * Efficiency improvement opportunities
 */
export interface EfficiencyImprovement {
    improvementId: string;
    type: 'cost_reduction' | 'utilization_increase' | 'performance_boost';
    estimatedSavings: number;
    implementationCost: number;
    timeframe: string;
    riskLevel: 'low' | 'medium' | 'high';
}
/**
 * Portfolio-wide efficiency analysis
 */
export interface PortfolioEfficiency {
    overallScore: number;
    resourceEfficiencies: ResourceEfficiency[];
    trends: EfficiencyTrend[];
    issues: EfficiencyIssue[];
    improvements: EfficiencyImprovement[];
    recommendations: string[];
}
/**
 * Default configuration for efficiency analysis
 */
export declare const DEFAULT_EFFICIENCY_CONFIG: EfficiencyAnalysisConfig;
/**
 * Creates a new EfficiencyAnalyzer instance with optional configuration
 */
export declare function createEfficiencyAnalyzer(_config?: Partial<EfficiencyAnalysisConfig>): EfficiencyAnalyzer;
