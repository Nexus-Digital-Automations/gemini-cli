/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { AllocationLogger } from '../algorithms/BaseAllocationAlgorithm.js';
import type { AllocationCandidate, AllocationRecommendation, AllocationOptimizationResult, AllocationStrategy, AllocationScenario } from '../types.js';
/**
 * @fileoverview Intelligent recommendation engine for budget allocation
 * Provides advanced recommendation generation and optimization capabilities
 *
 * @author Claude Code - Budget Allocation Agent
 * @version 1.0.0
 */
/**
 * Configuration for the recommendation engine
 */
export interface RecommendationEngineConfig {
    /** Default allocation strategy to use */
    defaultStrategy: AllocationStrategy;
    /** Enable multi-strategy analysis */
    enableMultiStrategy: boolean;
    /** Maximum number of recommendations to generate */
    maxRecommendations: number;
    /** Minimum confidence threshold for recommendations */
    minConfidence: number;
    /** Enable scenario generation */
    enableScenarios: boolean;
    /** Advanced optimization parameters */
    optimization: {
        enableIterativeImprovement: boolean;
        maxIterations: number;
        convergenceThreshold: number;
        enableParallelProcessing: boolean;
    };
}
/**
 * Recommendation generation context
 */
export interface RecommendationContext {
    /** Current budget constraints */
    budgetConstraints: {
        totalBudget: number;
        quarterlyBudget?: number;
        emergencyReserve?: number;
    };
    /** Business context information */
    businessContext: {
        fiscalYear: string;
        businessCycle: 'growth' | 'maintenance' | 'optimization' | 'expansion';
        marketConditions: 'stable' | 'volatile' | 'growth' | 'recession';
        competitivePosition: 'leader' | 'challenger' | 'follower' | 'niche';
    };
    /** Organizational preferences */
    preferences: {
        riskTolerance: 'conservative' | 'moderate' | 'aggressive';
        optimizationHorizon: 'short_term' | 'medium_term' | 'long_term';
        priorityFocus: 'cost' | 'growth' | 'innovation' | 'efficiency';
    };
    /** Historical performance data */
    historicalData?: {
        pastRecommendations: AllocationRecommendation[];
        successRate: number;
        averageROI: number;
    };
}
/**
 * Comprehensive recommendation result
 */
export interface RecommendationResult {
    /** Primary recommendations using default strategy */
    primaryRecommendations: AllocationRecommendation[];
    /** Alternative recommendations using different strategies */
    alternativeRecommendations: Map<AllocationStrategy, AllocationRecommendation[]>;
    /** Generated scenarios for planning */
    scenarios: AllocationScenario[];
    /** Optimization results for each strategy */
    optimizationResults: Map<AllocationStrategy, AllocationOptimizationResult>;
    /** Executive summary and insights */
    insights: RecommendationInsights;
    /** Performance metrics */
    performanceMetrics: RecommendationPerformanceMetrics;
}
/**
 * Recommendation insights and analysis
 */
export interface RecommendationInsights {
    /** Key findings from the analysis */
    keyFindings: string[];
    /** Identified optimization opportunities */
    opportunities: string[];
    /** Potential risks and concerns */
    risks: string[];
    /** Strategic recommendations */
    strategicRecommendations: string[];
    /** Implementation priorities */
    implementationPriorities: string[];
}
/**
 * Performance metrics for recommendation generation
 */
export interface RecommendationPerformanceMetrics {
    /** Total processing time in milliseconds */
    processingTime: number;
    /** Number of candidates analyzed */
    candidatesAnalyzed: number;
    /** Number of strategies evaluated */
    strategiesEvaluated: number;
    /** Quality score of recommendations (0-100) */
    qualityScore: number;
    /** Confidence distribution */
    confidenceDistribution: {
        high: number;
        medium: number;
        low: number;
    };
}
/**
 * Intelligent recommendation engine for budget allocation optimization
 */
export declare class RecommendationEngine {
    private readonly config;
    private readonly logger;
    private processingStartTime;
    /**
     * Create recommendation engine instance
     * @param config - Engine configuration
     * @param logger - Logger instance
     */
    constructor(config: RecommendationEngineConfig, logger: AllocationLogger);
    /**
     * Generate comprehensive budget allocation recommendations
     * @param candidates - Allocation candidates
     * @param context - Recommendation context
     * @returns Comprehensive recommendation result
     */
    generateRecommendations(candidates: AllocationCandidate[], context: RecommendationContext): Promise<RecommendationResult>;
    /**
     * Validate input parameters
     * @param candidates - Allocation candidates
     * @param context - Recommendation context
     */
    private validateInputs;
    /**
     * Prepare algorithm configurations for different strategies
     * @param context - Recommendation context
     * @returns Map of strategy to configuration
     */
    private prepareAlgorithmConfigs;
    /**
     * Get list of strategies to evaluate
     * @returns Array of allocation strategies
     */
    private getStrategiesToEvaluate;
    /**
     * Create algorithm configuration for specific strategy
     * @param strategy - Allocation strategy
     * @param context - Recommendation context
     * @returns Algorithm configuration
     */
    private createStrategyConfig;
    /**
     * Calculate strategy-specific weights based on context
     * @param strategy - Allocation strategy
     * @param context - Recommendation context
     * @returns Weight configuration
     */
    private calculateStrategyWeights;
    /**
     * Get strategy-specific optimization objectives
     * @param strategy - Allocation strategy
     * @param context - Recommendation context
     * @returns Array of objectives
     */
    private getStrategyObjectives;
    /**
     * Get strategy-specific parameters
     * @param strategy - Allocation strategy
     * @param context - Recommendation context
     * @returns Parameters object
     */
    private getStrategyParameters;
    /**
     * Generate primary recommendations using default strategy
     * @param candidates - Allocation candidates
     * @param context - Recommendation context
     * @param config - Algorithm configuration
     * @returns Primary recommendations
     */
    private generatePrimaryRecommendations;
    /**
     * Generate alternative recommendations using different strategies
     * @param candidates - Allocation candidates
     * @param context - Recommendation context
     * @param algorithmConfigs - Algorithm configurations
     * @returns Map of alternative recommendations
     */
    private generateAlternativeRecommendations;
    /**
     * Filter recommendations by minimum confidence threshold
     * @param recommendations - Raw recommendations
     * @returns Filtered recommendations
     */
    private filterRecommendationsByConfidence;
    /**
     * Generate allocation scenarios for planning
     * @param candidates - Allocation candidates
     * @param context - Recommendation context
     * @param primaryRecommendations - Primary recommendations
     * @returns Array of scenarios
     */
    private generateScenarios;
    /**
     * Create allocation scenario
     * @param id - Scenario identifier
     * @param name - Scenario name
     * @param description - Scenario description
     * @param candidates - Allocation candidates
     * @param recommendations - Base recommendations
     * @param multiplier - Change multiplier
     * @returns Allocation scenario
     */
    private createScenario;
    /**
     * Calculate expected outcomes for scenario
     * @param recommendations - Scenario recommendations
     * @param candidates - Original candidates
     * @returns Scenario outcomes
     */
    private calculateScenarioOutcomes;
    /**
     * Generate insights and analysis
     * @param candidates - Original candidates
     * @param primaryRecommendations - Primary recommendations
     * @param alternativeRecommendations - Alternative recommendations
     * @param context - Recommendation context
     * @returns Recommendation insights
     */
    private generateInsights;
    /**
     * Generate key findings from analysis
     * @param candidates - Original candidates
     * @param recommendations - Generated recommendations
     * @returns Array of key findings
     */
    private generateKeyFindings;
    /**
     * Identify optimization opportunities
     * @param recommendations - Generated recommendations
     * @returns Array of opportunities
     */
    private identifyOptimizationOpportunities;
    /**
     * Identify risks in recommendations
     * @param recommendations - Generated recommendations
     * @returns Array of risks
     */
    private identifyRisks;
    /**
     * Generate strategic recommendations
     * @param recommendations - Generated recommendations
     * @param context - Recommendation context
     * @returns Array of strategic recommendations
     */
    private generateStrategicRecommendations;
    /**
     * Determine implementation priorities
     * @param recommendations - Generated recommendations
     * @returns Array of implementation priorities
     */
    private determineImplementationPriorities;
    /**
     * Calculate performance metrics
     * @param candidates - Original candidates
     * @param primaryRecommendations - Primary recommendations
     * @param alternativeRecommendations - Alternative recommendations
     * @returns Performance metrics
     */
    private calculatePerformanceMetrics;
}
/**
 * Create recommendation engine with default configuration
 * @param strategy - Default allocation strategy
 * @param logger - Logger instance
 * @returns RecommendationEngine instance
 */
export declare function createRecommendationEngine(strategy: AllocationStrategy | undefined, logger: AllocationLogger): RecommendationEngine;
