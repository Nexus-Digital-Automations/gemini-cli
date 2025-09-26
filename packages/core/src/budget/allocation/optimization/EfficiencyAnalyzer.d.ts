/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * @fileoverview Budget allocation efficiency analysis system
 * Provides comprehensive efficiency analysis for budget allocations and resource utilization
 *
 * @author Claude Code - Budget Allocation Agent
 * @version 1.0.0
 */
import type { AllocationCandidate, AllocationScenario } from '../types.js';
import type { FeatureCostAnalysis } from '../../analytics/AnalyticsEngine.js';
/**
 * Efficiency analysis configuration
 */
export interface EfficiencyAnalysisConfig {
    /** Analysis time window in days */
    analysisWindow: number;
    /** Minimum data points required for analysis */
    minDataPoints: number;
    /** Efficiency thresholds for classification */
    thresholds: {
        /** High efficiency threshold (0-100) */
        high: number;
        /** Medium efficiency threshold (0-100) */
        medium: number;
        /** Low efficiency threshold (0-100) */
        low: number;
    };
    /** Enable advanced analysis features */
    enableAdvancedAnalysis: boolean;
    /** Weight factors for efficiency calculation */
    weights: {
        /** Cost efficiency weight (0-1) */
        cost: number;
        /** Utilization efficiency weight (0-1) */
        utilization: number;
        /** ROI efficiency weight (0-1) */
        roi: number;
        /** Performance efficiency weight (0-1) */
        performance: number;
    };
}
/**
 * Resource efficiency metrics
 */
export interface ResourceEfficiency {
    /** Resource identifier */
    resourceId: string;
    /** Overall efficiency score (0-100) */
    overallScore: number;
    /** Cost efficiency score (0-100) */
    costEfficiency: number;
    /** Utilization efficiency score (0-100) */
    utilizationEfficiency: number;
    /** ROI efficiency score (0-100) */
    roiEfficiency: number;
    /** Performance efficiency score (0-100) */
    performanceEfficiency: number;
    /** Efficiency classification */
    classification: 'high' | 'medium' | 'low' | 'critical';
    /** Efficiency trends over time */
    trends: EfficiencyTrend[];
    /** Identified inefficiencies */
    inefficiencies: EfficiencyIssue[];
    /** Improvement recommendations */
    improvements: EfficiencyImprovement[];
}
/**
 * Efficiency trend analysis
 */
export interface EfficiencyTrend {
    /** Metric name */
    metric: 'cost' | 'utilization' | 'roi' | 'performance' | 'overall';
    /** Trend direction */
    direction: 'improving' | 'declining' | 'stable';
    /** Trend strength (0-100) */
    strength: number;
    /** Rate of change per period */
    changeRate: number;
    /** Trend significance */
    significance: 'high' | 'medium' | 'low';
    /** Supporting data points */
    dataPoints: Array<{
        timestamp: Date;
        value: number;
    }>;
}
/**
 * Identified efficiency issue
 */
export interface EfficiencyIssue {
    /** Issue type */
    type: 'underutilization' | 'overallocation' | 'cost_inefficiency' | 'performance_degradation';
    /** Issue severity */
    severity: 'critical' | 'high' | 'medium' | 'low';
    /** Issue description */
    description: string;
    /** Impact assessment */
    impact: {
        /** Financial impact amount */
        financial: number;
        /** Performance impact percentage */
        performance: number;
        /** Utilization impact percentage */
        utilization: number;
    };
    /** Root cause analysis */
    rootCause: string;
    /** Detection timestamp */
    detectedAt: Date;
}
/**
 * Efficiency improvement recommendation
 */
export interface EfficiencyImprovement {
    /** Improvement type */
    type: 'reallocation' | 'scaling' | 'optimization' | 'consolidation';
    /** Improvement priority */
    priority: 'critical' | 'high' | 'medium' | 'low';
    /** Improvement description */
    description: string;
    /** Expected benefits */
    expectedBenefits: {
        /** Cost savings */
        costSavings: number;
        /** Performance improvement percentage */
        performanceGain: number;
        /** Utilization improvement percentage */
        utilizationGain: number;
        /** ROI improvement */
        roiGain: number;
    };
    /** Implementation effort */
    implementationEffort: 'low' | 'medium' | 'high';
    /** Implementation timeline */
    timeline: string;
    /** Success metrics */
    successMetrics: string[];
}
/**
 * Portfolio efficiency analysis
 */
export interface PortfolioEfficiency {
    /** Overall portfolio efficiency score */
    overallScore: number;
    /** Resource efficiency breakdown */
    resourceEfficiencies: ResourceEfficiency[];
    /** Portfolio-level trends */
    portfolioTrends: EfficiencyTrend[];
    /** Cross-resource inefficiencies */
    crossResourceIssues: EfficiencyIssue[];
    /** Portfolio optimization opportunities */
    optimizationOpportunities: EfficiencyImprovement[];
    /** Efficiency distribution analysis */
    distribution: {
        /** High efficiency resources count */
        high: number;
        /** Medium efficiency resources count */
        medium: number;
        /** Low efficiency resources count */
        low: number;
        /** Critical efficiency resources count */
        critical: number;
    };
    /** Benchmark comparisons */
    benchmarks: {
        /** Industry benchmark score */
        industry: number;
        /** Historical best score */
        historicalBest: number;
        /** Peer comparison score */
        peerAverage: number;
    };
}
/**
 * Default efficiency analysis configuration
 */
export declare const DEFAULT_EFFICIENCY_CONFIG: EfficiencyAnalysisConfig;
/**
 * Budget allocation efficiency analyzer
 * Provides comprehensive efficiency analysis and optimization recommendations
 */
export declare class EfficiencyAnalyzer {
    private readonly config;
    /**
     * Create efficiency analyzer instance
     * @param config - Analyzer configuration
     */
    constructor(config?: Partial<EfficiencyAnalysisConfig>);
    /**
     * Analyze resource efficiency
     * @param candidate - Allocation candidate to analyze
     * @param historicalData - Historical usage and cost data
     * @returns Resource efficiency analysis
     */
    analyzeResourceEfficiency(candidate: AllocationCandidate, historicalData: FeatureCostAnalysis[]): ResourceEfficiency;
    /**
     * Analyze portfolio efficiency
     * @param candidates - All allocation candidates
     * @param historicalData - Historical data for all resources
     * @returns Portfolio efficiency analysis
     */
    analyzePortfolioEfficiency(candidates: AllocationCandidate[], historicalData: Record<string, FeatureCostAnalysis[]>): PortfolioEfficiency;
    /**
     * Analyze allocation scenario efficiency
     * @param scenario - Allocation scenario to analyze
     * @param historicalData - Historical data for analysis
     * @returns Scenario efficiency analysis
     */
    analyzeScenarioEfficiency(scenario: AllocationScenario, historicalData: Record<string, FeatureCostAnalysis[]>): {
        scenarioScore: number;
        improvementFromCurrent: number;
        efficiencyGains: Record<string, number>;
        risks: EfficiencyIssue[];
        recommendations: EfficiencyImprovement[];
    };
    /**
     * Calculate cost efficiency score
     */
    private calculateCostEfficiency;
    /**
     * Calculate utilization efficiency score
     */
    private calculateUtilizationEfficiency;
    /**
     * Calculate ROI efficiency score
     */
    private calculateROIEfficiency;
    /**
     * Calculate performance efficiency score
     */
    private calculatePerformanceEfficiency;
    /**
     * Calculate overall efficiency score using weighted average
     */
    private calculateOverallEfficiencyScore;
    /**
     * Classify efficiency level based on score
     */
    private classifyEfficiency;
    /**
     * Analyze efficiency trends
     */
    private analyzeTrends;
    /**
     * Calculate trend from data points
     */
    private calculateTrend;
    /**
     * Identify inefficiencies
     */
    private identifyInefficiencies;
    /**
     * Generate improvement recommendations
     */
    private generateImprovements;
    /**
     * Analyze portfolio-level trends
     */
    private analyzePortfolioTrends;
    /**
     * Identify cross-resource issues
     */
    private identifyCrossResourceIssues;
    /**
     * Generate portfolio optimization opportunities
     */
    private generatePortfolioOptimizations;
    /**
     * Calculate efficiency distribution
     */
    private calculateEfficiencyDistribution;
    /**
     * Calculate benchmark comparisons
     */
    private calculateBenchmarks;
    /**
     * Calculate allocation efficiency for a given allocation amount
     */
    private calculateAllocationEfficiency;
    /**
     * Validate configuration
     */
    private validateConfiguration;
}
/**
 * Create efficiency analyzer instance
 * @param config - Analyzer configuration
 * @returns EfficiencyAnalyzer instance
 */
export declare function createEfficiencyAnalyzer(config?: Partial<EfficiencyAnalysisConfig>): EfficiencyAnalyzer;
