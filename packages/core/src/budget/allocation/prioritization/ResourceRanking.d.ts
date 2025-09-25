/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Resource ranking and priority assignment system
 * Provides intelligent resource ranking based on multiple criteria and business priorities
 *
 * @author Claude Code - Budget Allocation Agent
 * @version 1.0.0
 */
import type { AllocationCandidate, AllocationPriority, AllocationStrategy, FeatureCostAnalysis, AllocationLogger } from '../types.js';
/**
 * Resource ranking configuration
 */
export interface ResourceRankingConfig {
    /** Ranking criteria and their weights */
    criteria: RankingCriteria;
    /** Priority assignment thresholds */
    thresholds: PriorityThresholds;
    /** Business context configuration */
    businessContext: BusinessContextConfig;
    /** Ranking algorithm parameters */
    algorithm: RankingAlgorithmConfig;
    /** Enable advanced ranking features */
    enableAdvancedFeatures: boolean;
}
/**
 * Ranking criteria with weights
 */
export interface RankingCriteria {
    /** Business value weight (0-1) */
    businessValue: number;
    /** ROI weight (0-1) */
    roi: number;
    /** Cost efficiency weight (0-1) */
    costEfficiency: number;
    /** Strategic importance weight (0-1) */
    strategicImportance: number;
    /** Risk factor weight (0-1) */
    riskFactor: number;
    /** Usage trends weight (0-1) */
    usageTrends: number;
    /** Performance impact weight (0-1) */
    performanceImpact: number;
    /** Resource dependencies weight (0-1) */
    dependencies: number;
    /** Innovation potential weight (0-1) */
    innovation: number;
    /** Compliance requirements weight (0-1) */
    compliance: number;
}
/**
 * Priority assignment thresholds
 */
export interface PriorityThresholds {
    /** Critical priority threshold (score >= this value) */
    critical: number;
    /** High priority threshold */
    high: number;
    /** Medium priority threshold */
    medium: number;
    /** Low priority threshold */
    low: number;
}
/**
 * Business context configuration
 */
export interface BusinessContextConfig {
    /** Current business phase */
    phase: 'startup' | 'growth' | 'maturity' | 'transformation';
    /** Strategic focus areas */
    strategicFocus: string[];
    /** Budget constraints */
    budgetConstraints: {
        /** Total available budget */
        total: number;
        /** Reserved budget percentage */
        reserved: number;
        /** Emergency fund percentage */
        emergency: number;
    };
    /** Market conditions */
    marketConditions: 'bull' | 'bear' | 'volatile' | 'stable';
    /** Competitive pressure level */
    competitivePressure: 'low' | 'medium' | 'high' | 'critical';
}
/**
 * Ranking algorithm configuration
 */
export interface RankingAlgorithmConfig {
    /** Algorithm type */
    type: 'weighted_sum' | 'analytical_hierarchy' | 'topsis' | 'fuzzy_logic';
    /** Normalization method */
    normalization: 'min_max' | 'z_score' | 'robust' | 'none';
    /** Score aggregation method */
    aggregation: 'weighted_average' | 'geometric_mean' | 'harmonic_mean';
    /** Enable sensitivity analysis */
    sensitivityAnalysis: boolean;
    /** Confidence interval calculation */
    confidenceInterval: boolean;
}
/**
 * Resource ranking result
 */
export interface ResourceRankingResult {
    /** Resource identifier */
    resourceId: string;
    /** Resource name */
    resourceName: string;
    /** Overall ranking score (0-100) */
    score: number;
    /** Assigned priority level */
    priority: AllocationPriority;
    /** Ranking position (1 = highest) */
    rank: number;
    /** Detailed scoring breakdown */
    scoreBreakdown: ScoreBreakdown;
    /** Ranking justification */
    justification: RankingJustification;
    /** Ranking confidence */
    confidence: number;
    /** Ranking sensitivity analysis */
    sensitivity: SensitivityAnalysis;
}
/**
 * Detailed score breakdown
 */
export interface ScoreBreakdown {
    /** Business value score */
    businessValue: number;
    /** ROI score */
    roi: number;
    /** Cost efficiency score */
    costEfficiency: number;
    /** Strategic importance score */
    strategicImportance: number;
    /** Risk factor score (higher = lower risk) */
    riskFactor: number;
    /** Usage trends score */
    usageTrends: number;
    /** Performance impact score */
    performanceImpact: number;
    /** Dependencies score */
    dependencies: number;
    /** Innovation potential score */
    innovation: number;
    /** Compliance score */
    compliance: number;
    /** Weighted contributions */
    weightedContributions: Record<string, number>;
}
/**
 * Ranking justification
 */
export interface RankingJustification {
    /** Primary ranking factors */
    primaryFactors: string[];
    /** Supporting factors */
    supportingFactors: string[];
    /** Risk considerations */
    riskConsiderations: string[];
    /** Business context influence */
    businessContext: string[];
    /** Key differentiators from other resources */
    differentiators: string[];
    /** Recommended actions */
    recommendedActions: string[];
}
/**
 * Sensitivity analysis
 */
export interface SensitivityAnalysis {
    /** Most influential criteria */
    influentialCriteria: Array<{
        criterion: string;
        influence: number;
    }>;
    /** Score range under different scenarios */
    scoreRange: {
        /** Best case scenario score */
        best: number;
        /** Worst case scenario score */
        worst: number;
        /** Most likely scenario score */
        likely: number;
    };
    /** Ranking stability */
    stability: 'stable' | 'moderate' | 'volatile';
    /** Criteria dependencies */
    dependencies: Array<{
        criterion1: string;
        criterion2: string;
        correlation: number;
    }>;
}
/**
 * Portfolio ranking result
 */
export interface PortfolioRanking {
    /** Individual resource rankings */
    rankings: ResourceRankingResult[];
    /** Portfolio-level insights */
    insights: PortfolioInsights;
    /** Ranking summary statistics */
    statistics: RankingStatistics;
    /** Resource groupings by priority */
    priorityGroups: Record<AllocationPriority, ResourceRankingResult[]>;
    /** Recommended allocation strategy */
    recommendedStrategy: AllocationStrategy;
}
/**
 * Portfolio insights
 */
export interface PortfolioInsights {
    /** Portfolio balance assessment */
    balance: {
        /** Distribution of priorities */
        priorityDistribution: Record<AllocationPriority, number>;
        /** Risk-reward balance */
        riskRewardBalance: number;
        /** Strategic alignment score */
        strategicAlignment: number;
    };
    /** Key portfolio strengths */
    strengths: string[];
    /** Portfolio vulnerabilities */
    vulnerabilities: string[];
    /** Optimization opportunities */
    opportunities: string[];
    /** Resource interdependencies */
    interdependencies: Array<{
        resource1: string;
        resource2: string;
        relationship: 'synergistic' | 'competitive' | 'dependent' | 'independent';
        strength: number;
    }>;
}
/**
 * Ranking statistics
 */
export interface RankingStatistics {
    /** Average ranking score */
    averageScore: number;
    /** Median ranking score */
    medianScore: number;
    /** Score standard deviation */
    standardDeviation: number;
    /** Score distribution */
    distribution: {
        /** Quartile boundaries */
        quartiles: number[];
        /** Outliers */
        outliers: string[];
    };
    /** Ranking consensus */
    consensus: {
        /** Agreement level */
        agreement: number;
        /** Controversial rankings */
        controversial: string[];
    };
}
/**
 * Default resource ranking configuration
 */
export declare const DEFAULT_RANKING_CONFIG: ResourceRankingConfig;
/**
 * Resource ranking engine
 * Provides intelligent resource ranking and priority assignment
 */
export declare class ResourceRanking {
    private readonly config;
    private readonly logger;
    /**
     * Create resource ranking instance
     * @param config - Ranking configuration
     * @param logger - Logger instance
     */
    constructor(config: Partial<ResourceRankingConfig> | undefined, logger: AllocationLogger);
    /**
     * Rank individual resource
     * @param candidate - Resource allocation candidate
     * @param historicalData - Historical performance data
     * @returns Resource ranking result
     */
    rankResource(candidate: AllocationCandidate, historicalData: FeatureCostAnalysis[]): ResourceRanking;
    /**
     * Rank portfolio of resources
     * @param candidates - Array of resource allocation candidates
     * @param historicalData - Historical data for all resources
     * @returns Portfolio ranking result
     */
    rankPortfolio(candidates: AllocationCandidate[], historicalData: Record<string, FeatureCostAnalysis[]>): PortfolioRanking;
    /**
     * Update resource priority based on changing conditions
     * @param resourceId - Resource identifier
     * @param contextChanges - Changes in business context
     * @returns Updated priority level
     */
    updatePriority(resourceId: string, contextChanges: Partial<BusinessContextConfig>): AllocationPriority;
    /**
     * Calculate detailed score breakdown
     */
    private calculateScoreBreakdown;
    /**
     * Calculate business value score
     */
    private calculateBusinessValueScore;
    default: break;
}
/**
 * Create resource ranking instance
 * @param config - Ranking configuration
 * @param logger - Logger instance
 * @returns ResourceRanking instance
 */
export declare function createResourceRanking(config?: Partial<ResourceRankingConfig>, logger?: AllocationLogger): ResourceRanking;
