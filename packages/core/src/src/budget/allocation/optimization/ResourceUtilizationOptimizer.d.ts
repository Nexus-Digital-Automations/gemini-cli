/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * @fileoverview Resource utilization optimization system
 * Provides intelligent optimization for resource utilization patterns and allocation efficiency
 *
 * @author Claude Code - Budget Allocation Agent
 * @version 1.0.0
 */
import type { AllocationCandidate, AllocationRecommendation, FeatureCostAnalysis, AllocationLogger } from '../types.js';
/**
 * Utilization optimization configuration
 */
export interface UtilizationOptimizationConfig {
    /** Target utilization rate (0-1) */
    targetUtilization: number;
    /** Acceptable utilization range */
    utilizationRange: {
        /** Minimum acceptable utilization */
        min: number;
        /** Maximum acceptable utilization */
        max: number;
    };
    /** Optimization objectives in priority order */
    objectives: OptimizationObjective[];
    /** Resource scaling parameters */
    scaling: {
        /** Enable auto-scaling recommendations */
        enableAutoScaling: boolean;
        /** Minimum scaling increment */
        minScaleIncrement: number;
        /** Maximum scaling factor */
        maxScaleFactor: number;
        /** Scaling threshold sensitivity */
        threshold: number;
    };
    /** Demand prediction settings */
    demandPrediction: {
        /** Enable demand forecasting */
        enabled: boolean;
        /** Prediction horizon in days */
        horizon: number;
        /** Historical data window in days */
        dataWindow: number;
        /** Prediction confidence threshold */
        confidenceThreshold: number;
    };
    /** Performance optimization settings */
    performance: {
        /** Enable performance-based optimization */
        enabled: boolean;
        /** Performance impact weight */
        weight: number;
        /** Response time targets */
        responseTimeTarget: number;
        /** Throughput targets */
        throughputTarget: number;
    };
}
/**
 * Optimization objective definition
 */
export interface OptimizationObjective {
    /** Objective type */
    type: 'minimize_cost' | 'maximize_utilization' | 'optimize_performance' | 'balance_load';
    /** Objective weight in optimization */
    weight: number;
    /** Objective constraints */
    constraints?: Record<string, unknown>;
    /** Success criteria */
    successCriteria: string[];
}
/**
 * Resource utilization analysis
 */
export interface UtilizationAnalysis {
    /** Resource identifier */
    resourceId: string;
    /** Current utilization metrics */
    current: UtilizationMetrics;
    /** Historical utilization patterns */
    historical: UtilizationPattern[];
    /** Predicted future utilization */
    predicted: UtilizationForecast;
    /** Utilization optimization opportunities */
    opportunities: OptimizationOpportunity[];
    /** Resource capacity analysis */
    capacity: CapacityAnalysis;
    /** Performance correlation analysis */
    performance: PerformanceCorrelation;
}
/**
 * Utilization metrics
 */
export interface UtilizationMetrics {
    /** Average utilization rate (0-1) */
    average: number;
    /** Peak utilization rate (0-1) */
    peak: number;
    /** Minimum utilization rate (0-1) */
    minimum: number;
    /** Utilization variance */
    variance: number;
    /** Utilization trend direction */
    trend: 'increasing' | 'decreasing' | 'stable';
    /** Efficiency score (0-100) */
    efficiency: number;
    /** Waste percentage */
    waste: number;
}
/**
 * Utilization pattern analysis
 */
export interface UtilizationPattern {
    /** Pattern type */
    type: 'daily' | 'weekly' | 'monthly' | 'seasonal' | 'event_driven';
    /** Pattern strength (0-100) */
    strength: number;
    /** Pattern characteristics */
    characteristics: {
        /** Peak hours/periods */
        peaks: string[];
        /** Low usage periods */
        valleys: string[];
        /** Recurring intervals */
        intervals: string[];
    };
    /** Pattern predictability */
    predictability: number;
    /** Pattern impact on optimization */
    impact: {
        /** Cost impact */
        cost: number;
        /** Performance impact */
        performance: number;
        /** Utilization impact */
        utilization: number;
    };
}
/**
 * Utilization forecasting
 */
export interface UtilizationForecast {
    /** Forecast horizon */
    horizon: string;
    /** Predicted utilization points */
    predictions: Array<{
        timestamp: Date;
        utilization: number;
        confidence: number;
    }>;
    /** Forecast accuracy metrics */
    accuracy: {
        /** Mean absolute error */
        mae: number;
        /** Mean squared error */
        mse: number;
        /** Forecast confidence */
        confidence: number;
    };
    /** Key forecast insights */
    insights: {
        /** Expected growth rate */
        growthRate: number;
        /** Seasonal patterns */
        seasonality: boolean;
        /** Anomaly likelihood */
        anomalyRisk: number;
    };
}
/**
 * Optimization opportunity
 */
export interface OptimizationOpportunity {
    /** Opportunity type */
    type: 'rightsizing' | 'consolidation' | 'load_balancing' | 'auto_scaling' | 'scheduling';
    /** Opportunity priority */
    priority: 'critical' | 'high' | 'medium' | 'low';
    /** Opportunity description */
    description: string;
    /** Expected benefits */
    benefits: {
        /** Cost savings percentage */
        costSavings: number;
        /** Utilization improvement */
        utilizationGain: number;
        /** Performance improvement */
        performanceGain: number;
    };
    /** Implementation complexity */
    complexity: 'low' | 'medium' | 'high';
    /** Implementation effort estimate */
    effort: string;
    /** Risk assessment */
    risks: string[];
    /** Success metrics */
    metrics: string[];
}
/**
 * Resource capacity analysis
 */
export interface CapacityAnalysis {
    /** Current allocated capacity */
    allocated: number;
    /** Actual used capacity */
    used: number;
    /** Available capacity */
    available: number;
    /** Capacity utilization rate */
    utilizationRate: number;
    /** Capacity headroom */
    headroom: number;
    /** Recommended capacity */
    recommended: number;
    /** Capacity planning insights */
    insights: {
        /** Over-provisioned percentage */
        overProvisioned: number;
        /** Under-provisioned risk */
        underProvisionedRisk: number;
        /** Optimal capacity range */
        optimalRange: {
            min: number;
            max: number;
        };
    };
}
/**
 * Performance correlation analysis
 */
export interface PerformanceCorrelation {
    /** Correlation with response time */
    responseTime: number;
    /** Correlation with throughput */
    throughput: number;
    /** Correlation with error rate */
    errorRate: number;
    /** Performance-utilization relationship */
    relationship: 'linear' | 'exponential' | 'threshold' | 'complex';
    /** Optimal utilization for performance */
    optimalUtilization: number;
    /** Performance degradation threshold */
    degradationThreshold: number;
}
/**
 * Portfolio utilization optimization result
 */
export interface PortfolioUtilizationResult {
    /** Overall optimization score */
    overallScore: number;
    /** Individual resource analyses */
    resources: UtilizationAnalysis[];
    /** Cross-resource optimization opportunities */
    crossResourceOpportunities: OptimizationOpportunity[];
    /** Portfolio-level insights */
    insights: {
        /** Total potential savings */
        totalSavings: number;
        /** Average utilization improvement */
        utilizationImprovement: number;
        /** Risk-adjusted benefits */
        riskAdjustedBenefits: number;
    };
    /** Implementation roadmap */
    roadmap: {
        /** Quick wins (low effort, high impact) */
        quickWins: OptimizationOpportunity[];
        /** Strategic initiatives (high effort, high impact) */
        strategic: OptimizationOpportunity[];
        /** Long-term optimizations */
        longTerm: OptimizationOpportunity[];
    };
}
/**
 * Default utilization optimization configuration
 */
export declare const DEFAULT_UTILIZATION_CONFIG: UtilizationOptimizationConfig;
/**
 * Resource utilization optimizer
 * Provides intelligent optimization for resource utilization patterns
 */
export declare class ResourceUtilizationOptimizer {
    private readonly config;
    private readonly logger;
    /**
     * Create utilization optimizer instance
     * @param config - Optimizer configuration
     * @param logger - Logger instance
     */
    constructor(config: Partial<UtilizationOptimizationConfig>, logger: AllocationLogger);
    /**
     * Optimize resource utilization
     * @param candidate - Resource allocation candidate
     * @param historicalData - Historical utilization and performance data
     * @returns Utilization analysis and optimization recommendations
     */
    optimizeResourceUtilization(candidate: AllocationCandidate, historicalData: FeatureCostAnalysis[]): UtilizationAnalysis;
    /**
     * Optimize portfolio utilization
     * @param candidates - All resource allocation candidates
     * @param historicalData - Historical data for all resources
     * @returns Portfolio utilization optimization result
     */
    optimizePortfolioUtilization(candidates: AllocationCandidate[], historicalData: Record<string, FeatureCostAnalysis[]>): PortfolioUtilizationResult;
    /**
     * Generate utilization-based allocation recommendations
     * @param candidate - Allocation candidate
     * @param analysis - Utilization analysis
     * @returns Allocation recommendations
     */
    generateUtilizationRecommendations(candidate: AllocationCandidate, analysis: UtilizationAnalysis): AllocationRecommendation[];
    /**
     * Calculate current utilization metrics
     */
    private calculateCurrentUtilization;
    /**
     * Analyze utilization patterns
     */
    private analyzeUtilizationPatterns;
    /**
     * Analyze daily utilization patterns
     */
    private analyzeDailyPattern;
    /**
     * Analyze weekly utilization patterns
     */
    private analyzeWeeklyPattern;
    /**
     * Forecast future utilization
     */
    private forecastUtilization;
    /**
     * Identify optimization opportunities
     */
    private identifyOptimizationOpportunities;
    /**
     * Analyze capacity requirements
     */
    private analyzeCapacityRequirements;
    /**
     * Analyze performance correlation
     */
    private analyzePerformanceCorrelation;
    /**
     * Calculate correlation coefficient
     */
    private calculateCorrelation;
    /**
     * Identify cross-resource opportunities
     */
    private identifyCrossResourceOpportunities;
    /**
     * Calculate portfolio optimization score
     */
    private calculatePortfolioScore;
    /**
     * Generate portfolio insights
     */
    private generatePortfolioInsights;
    /**
     * Create implementation roadmap
     */
    private createImplementationRoadmap;
    /**
     * Create allocation recommendation from optimization opportunity
     */
    private createRecommendationFromOpportunity;
    /**
     * Validate configuration
     */
    private validateConfiguration;
}
/**
 * Create resource utilization optimizer instance
 * @param config - Optimizer configuration
 * @param logger - Logger instance
 * @returns ResourceUtilizationOptimizer instance
 */
export declare function createResourceUtilizationOptimizer(config?: Partial<UtilizationOptimizationConfig>, logger?: AllocationLogger): ResourceUtilizationOptimizer;
