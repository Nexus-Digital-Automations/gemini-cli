/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { AllocationLogger } from '../algorithms/BaseAllocationAlgorithm.js';
import {
  createAllocationAlgorithm,
  validateAlgorithmConfig,
} from '../algorithms/index.js';
import type {
  AllocationCandidate,
  AllocationRecommendation,
  AllocationAlgorithmConfig,
  AllocationOptimizationResult,
  AllocationStrategy,
  AllocationScenario,
  ScenarioOutcome,
} from '../types.js';

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
  alternativeRecommendations: Map<
    AllocationStrategy,
    AllocationRecommendation[]
  >;
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
    high: number; // >80
    medium: number; // 60-80
    low: number; // <60
  };
}

/**
 * Intelligent recommendation engine for budget allocation optimization
 */
export class RecommendationEngine {
  private readonly config: RecommendationEngineConfig;
  private readonly logger: AllocationLogger;
  private processingStartTime: number = 0;

  /**
   * Create recommendation engine instance
   * @param config - Engine configuration
   * @param logger - Logger instance
   */
  constructor(config: RecommendationEngineConfig, logger: AllocationLogger) {
    this.config = config;
    this.logger = logger;

    this.logger.info('Recommendation engine initialized', {
      defaultStrategy: config.defaultStrategy,
      multiStrategy: config.enableMultiStrategy,
      maxRecommendations: config.maxRecommendations,
    });
  }

  /**
   * Generate comprehensive budget allocation recommendations
   * @param candidates - Allocation candidates
   * @param context - Recommendation context
   * @returns Comprehensive recommendation result
   */
  async generateRecommendations(
    candidates: AllocationCandidate[],
    context: RecommendationContext,
  ): Promise<RecommendationResult> {
    this.processingStartTime = performance.now();

    this.logger.info('Starting recommendation generation', {
      candidateCount: candidates.length,
      strategy: this.config.defaultStrategy,
      totalBudget: context.budgetConstraints.totalBudget,
    });

    try {
      // Validate inputs
      this.validateInputs(candidates, context);

      // Prepare algorithm configurations
      const algorithmConfigs = this.prepareAlgorithmConfigs(context);

      // Generate primary recommendations
      const primaryRecommendations = await this.generatePrimaryRecommendations(
        candidates,
        context,
        algorithmConfigs.get(this.config.defaultStrategy)!,
      );

      // Generate alternative recommendations if enabled
      const alternativeRecommendations = this.config.enableMultiStrategy
        ? await this.generateAlternativeRecommendations(
            candidates,
            context,
            algorithmConfigs,
          )
        : new Map<AllocationStrategy, AllocationRecommendation[]>();

      // Generate scenarios if enabled
      const scenarios = this.config.enableScenarios
        ? await this.generateScenarios(
            candidates,
            context,
            primaryRecommendations,
          )
        : [];

      // Collect optimization results
      const optimizationResults = new Map<
        AllocationStrategy,
        AllocationOptimizationResult
      >();

      // Generate insights and analysis
      const insights = this.generateInsights(
        candidates,
        primaryRecommendations,
        alternativeRecommendations,
        context,
      );

      // Calculate performance metrics
      const performanceMetrics = this.calculatePerformanceMetrics(
        candidates,
        primaryRecommendations,
        alternativeRecommendations,
      );

      const result: RecommendationResult = {
        primaryRecommendations,
        alternativeRecommendations,
        scenarios,
        optimizationResults,
        insights,
        performanceMetrics,
      };

      this.logger.info('Recommendation generation completed', {
        processingTime: performanceMetrics.processingTime,
        primaryCount: primaryRecommendations.length,
        alternativeStrategies: alternativeRecommendations.size,
        qualityScore: performanceMetrics.qualityScore,
      });

      return result;
    } catch (error) {
      this.logger.error('Recommendation generation failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        candidateCount: candidates.length,
      });
      throw error;
    }
  }

  /**
   * Validate input parameters
   * @param candidates - Allocation candidates
   * @param context - Recommendation context
   */
  private validateInputs(
    candidates: AllocationCandidate[],
    context: RecommendationContext,
  ): void {
    if (!candidates || candidates.length === 0) {
      throw new Error('No allocation candidates provided');
    }

    if (context.budgetConstraints.totalBudget <= 0) {
      throw new Error('Total budget must be positive');
    }

    if (this.config.minConfidence < 0 || this.config.minConfidence > 100) {
      throw new Error('Minimum confidence must be between 0 and 100');
    }

    // Validate candidate data completeness
    for (const candidate of candidates) {
      if (!candidate.resourceId || !candidate.resourceName) {
        throw new Error('Candidate missing required identification fields');
      }

      if (candidate.currentAllocation < 0) {
        throw new Error(
          `Invalid current allocation for ${candidate.resourceId}`,
        );
      }
    }
  }

  /**
   * Prepare algorithm configurations for different strategies
   * @param context - Recommendation context
   * @returns Map of strategy to configuration
   */
  private prepareAlgorithmConfigs(
    context: RecommendationContext,
  ): Map<AllocationStrategy, AllocationAlgorithmConfig> {
    const configs = new Map<AllocationStrategy, AllocationAlgorithmConfig>();
    const strategies = this.getStrategiesToEvaluate();

    for (const strategy of strategies) {
      const config = this.createStrategyConfig(strategy, context);
      validateAlgorithmConfig(config);
      configs.set(strategy, config);
    }

    return configs;
  }

  /**
   * Get list of strategies to evaluate
   * @returns Array of allocation strategies
   */
  private getStrategiesToEvaluate(): AllocationStrategy[] {
    const strategies: AllocationStrategy[] = [this.config.defaultStrategy];

    if (this.config.enableMultiStrategy) {
      // Add complementary strategies based on default
      switch (this.config.defaultStrategy) {
        case 'usage_based':
          strategies.push('roi_optimized', 'priority_weighted');
          break;
        case 'roi_optimized':
          strategies.push('usage_based', 'priority_weighted');
          break;
        case 'priority_weighted':
          strategies.push('usage_based', 'roi_optimized');
          break;
        default:
          strategies.push('usage_based', 'roi_optimized', 'priority_weighted');
      }
    }

    return [...new Set(strategies)]; // Remove duplicates
  }

  /**
   * Create algorithm configuration for specific strategy
   * @param strategy - Allocation strategy
   * @param context - Recommendation context
   * @returns Algorithm configuration
   */
  private createStrategyConfig(
    strategy: AllocationStrategy,
    context: RecommendationContext,
  ): AllocationAlgorithmConfig {
    const baseConfig: AllocationAlgorithmConfig = {
      strategy,
      weights: this.calculateStrategyWeights(strategy, context),
      globalConstraints: {
        minAllocation: Math.max(
          100,
          context.budgetConstraints.totalBudget * 0.001,
        ),
        maxAllocation: Math.min(
          context.budgetConstraints.totalBudget * 0.5,
          50000,
        ),
        allocationGranularity: 50,
        maxUtilizationRate: 0.9,
        minROIThreshold:
          context.preferences.riskTolerance === 'conservative' ? 0.15 : 0.05,
      },
      objectives: this.getStrategyObjectives(strategy, context),
      parameters: this.getStrategyParameters(strategy, context),
    };

    return baseConfig;
  }

  /**
   * Calculate strategy-specific weights based on context
   * @param strategy - Allocation strategy
   * @param context - Recommendation context
   * @returns Weight configuration
   */
  private calculateStrategyWeights(
    strategy: AllocationStrategy,
    context: RecommendationContext,
  ): AllocationAlgorithmConfig['weights'] {
    const { riskTolerance, priorityFocus } = context.preferences;
    const { businessCycle, marketConditions } = context.businessContext;

    let baseWeights = {
      cost: 0.25,
      performance: 0.25,
      roi: 0.25,
      businessValue: 0.15,
      risk: 0.1,
    };

    // Adjust based on strategy
    switch (strategy) {
      case 'usage_based':
        baseWeights = {
          cost: 0.4,
          performance: 0.3,
          roi: 0.15,
          businessValue: 0.1,
          risk: 0.05,
        };
        break;
      case 'roi_optimized':
        baseWeights = {
          cost: 0.1,
          performance: 0.2,
          roi: 0.45,
          businessValue: 0.2,
          risk: 0.05,
        };
        break;
      case 'priority_weighted':
        baseWeights = {
          cost: 0.15,
          performance: 0.2,
          roi: 0.2,
          businessValue: 0.35,
          risk: 0.1,
        };
        break;
    }

    // Adjust based on risk tolerance
    if (riskTolerance === 'conservative') {
      baseWeights.risk += 0.05;
      baseWeights.roi -= 0.05;
    } else if (riskTolerance === 'aggressive') {
      baseWeights.roi += 0.05;
      baseWeights.risk -= 0.05;
    }

    // Adjust based on priority focus
    switch (priorityFocus) {
      case 'cost':
        baseWeights.cost += 0.1;
        baseWeights.businessValue -= 0.05;
        baseWeights.performance -= 0.05;
        break;
      case 'growth':
        baseWeights.roi += 0.1;
        baseWeights.cost -= 0.05;
        baseWeights.risk -= 0.05;
        break;
      case 'innovation':
        baseWeights.businessValue += 0.1;
        baseWeights.cost -= 0.05;
        baseWeights.roi -= 0.05;
        break;
      case 'efficiency':
        baseWeights.performance += 0.1;
        baseWeights.businessValue -= 0.05;
        baseWeights.risk -= 0.05;
        break;
    }

    // Adjust based on business cycle
    if (businessCycle === 'optimization') {
      baseWeights.cost += 0.05;
      baseWeights.performance += 0.05;
      baseWeights.businessValue -= 0.05;
      baseWeights.roi -= 0.05;
    } else if (businessCycle === 'growth') {
      baseWeights.roi += 0.05;
      baseWeights.businessValue += 0.05;
      baseWeights.cost -= 0.05;
      baseWeights.risk -= 0.05;
    }

    return baseWeights;
      default:
        // Handle unexpected values
        break;
  }

  /**
   * Get strategy-specific optimization objectives
   * @param strategy - Allocation strategy
   * @param context - Recommendation context
   * @returns Array of objectives
   */
  private getStrategyObjectives(
    strategy: AllocationStrategy,
    context: RecommendationContext,
  ): string[] {
    const baseObjectives = ['maximize_efficiency', 'minimize_risk'];

    switch (strategy) {
      case 'usage_based':
        return [...baseObjectives, 'optimize_utilization', 'balance_capacity'];
      case 'roi_optimized':
        return [...baseObjectives, 'maximize_roi', 'optimize_returns'];
      case 'priority_weighted':
        return [...baseObjectives, 'align_priorities', 'ensure_continuity'];
      default:
        return baseObjectives;
    }
  }

  /**
   * Get strategy-specific parameters
   * @param strategy - Allocation strategy
   * @param context - Recommendation context
   * @returns Parameters object
   */
  private getStrategyParameters(
    strategy: AllocationStrategy,
    context: RecommendationContext,
  ): Record<string, unknown> {
    return {
      riskTolerance: context.preferences.riskTolerance,
      optimizationHorizon: context.preferences.optimizationHorizon,
      businessCycle: context.businessContext.businessCycle,
      enableIterativeImprovement:
        this.config.optimization.enableIterativeImprovement,
      maxIterations: this.config.optimization.maxIterations,
    };
  }

  /**
   * Generate primary recommendations using default strategy
   * @param candidates - Allocation candidates
   * @param context - Recommendation context
   * @param config - Algorithm configuration
   * @returns Primary recommendations
   */
  private async generatePrimaryRecommendations(
    candidates: AllocationCandidate[],
    context: RecommendationContext,
    config: AllocationAlgorithmConfig,
  ): Promise<AllocationRecommendation[]> {
    const algorithm = createAllocationAlgorithm(
      this.config.defaultStrategy,
      config,
      this.logger,
    );
    const result = await algorithm.optimize(candidates);

    return this.filterRecommendationsByConfidence(result.recommendations);
  }

  /**
   * Generate alternative recommendations using different strategies
   * @param candidates - Allocation candidates
   * @param context - Recommendation context
   * @param algorithmConfigs - Algorithm configurations
   * @returns Map of alternative recommendations
   */
  private async generateAlternativeRecommendations(
    candidates: AllocationCandidate[],
    context: RecommendationContext,
    algorithmConfigs: Map<AllocationStrategy, AllocationAlgorithmConfig>,
  ): Promise<Map<AllocationStrategy, AllocationRecommendation[]>> {
    const alternatives = new Map<
      AllocationStrategy,
      AllocationRecommendation[]
    >();

    for (const [strategy, config] of algorithmConfigs) {
      if (strategy === this.config.defaultStrategy) continue;

      try {
        const algorithm = createAllocationAlgorithm(
          strategy,
          config,
          this.logger,
        );
        const result = await algorithm.optimize(candidates);
        const filteredRecommendations = this.filterRecommendationsByConfidence(
          result.recommendations,
        );

        alternatives.set(strategy, filteredRecommendations);
      } catch (error) {
        this.logger.warn(
          `Failed to generate recommendations for strategy ${strategy}`,
          {
            error: error instanceof Error ? error.message : 'Unknown error',
          },
        );
      }
    }

    return alternatives;
  }

  /**
   * Filter recommendations by minimum confidence threshold
   * @param recommendations - Raw recommendations
   * @returns Filtered recommendations
   */
  private filterRecommendationsByConfidence(
    recommendations: AllocationRecommendation[],
  ): AllocationRecommendation[] {
    const filtered = recommendations.filter(
      (rec) => rec.confidence >= this.config.minConfidence,
    );

    // Sort by confidence descending, then by potential savings descending
    filtered.sort((a, b) => {
      if (b.confidence !== a.confidence) {
        return b.confidence - a.confidence;
      }
      return b.potentialSavings - a.potentialSavings;
    });

    // Limit to max recommendations
    return filtered.slice(0, this.config.maxRecommendations);
  }

  /**
   * Generate allocation scenarios for planning
   * @param candidates - Allocation candidates
   * @param context - Recommendation context
   * @param primaryRecommendations - Primary recommendations
   * @returns Array of scenarios
   */
  private async generateScenarios(
    candidates: AllocationCandidate[],
    context: RecommendationContext,
    primaryRecommendations: AllocationRecommendation[],
  ): Promise<AllocationScenario[]> {
    const scenarios: AllocationScenario[] = [];

    // Conservative scenario
    scenarios.push(
      this.createScenario(
        'conservative',
        'Conservative Allocation',
        'Risk-averse allocation focusing on proven resources',
        candidates,
        primaryRecommendations,
        0.8, // 80% of recommended changes
      ),
    );

    // Aggressive scenario
    scenarios.push(
      this.createScenario(
        'aggressive',
        'Aggressive Optimization',
        'Bold allocation changes for maximum optimization',
        candidates,
        primaryRecommendations,
        1.3, // 130% of recommended changes
      ),
    );

    // Balanced scenario (baseline)
    scenarios.push(
      this.createScenario(
        'balanced',
        'Balanced Approach',
        'Moderate allocation changes balancing risk and reward',
        candidates,
        primaryRecommendations,
        1.0, // 100% of recommended changes
      ),
    );

    return scenarios;
  }

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
  private createScenario(
    id: string,
    name: string,
    description: string,
    candidates: AllocationCandidate[],
    recommendations: AllocationRecommendation[],
    multiplier: number,
  ): AllocationScenario {
    const adjustedRecommendations = recommendations.map((rec) => ({
      ...rec,
      allocationChange: rec.allocationChange * multiplier,
      recommendedAllocation:
        rec.currentAllocation + rec.allocationChange * multiplier,
      potentialSavings: Math.max(0, rec.potentialSavings * multiplier),
    }));

    const totalBudget = candidates.reduce(
      (sum, c) => sum + c.currentAllocation,
      0,
    );
    const expectedOutcomes = this.calculateScenarioOutcomes(
      adjustedRecommendations,
      candidates,
    );

    return {
      scenarioId: id,
      scenarioName: name,
      description,
      totalBudget,
      allocations: adjustedRecommendations,
      expectedOutcomes,
      timeline: 'Q1-Q2 FY2025',
      assumptions: [
        'Market conditions remain stable',
        'Resource utilization patterns continue',
        'No major strategic pivots',
        `Risk tolerance: ${multiplier > 1.1 ? 'high' : multiplier < 0.9 ? 'low' : 'moderate'}`,
      ],
    };
  }

  /**
   * Calculate expected outcomes for scenario
   * @param recommendations - Scenario recommendations
   * @param candidates - Original candidates
   * @returns Scenario outcomes
   */
  private calculateScenarioOutcomes(
    recommendations: AllocationRecommendation[],
    candidates: AllocationCandidate[],
  ): ScenarioOutcome {
    const totalCost = recommendations.reduce(
      (sum, rec) => sum + rec.recommendedAllocation,
      0,
    );
    const totalSavings = recommendations.reduce(
      (sum, rec) => sum + rec.potentialSavings,
      0,
    );
    const averageROI =
      recommendations.reduce(
        (sum, rec) => sum + rec.expectedImpact.roiImpact,
        0,
      ) / recommendations.length;

    const utilizationEfficiency =
      recommendations.reduce(
        (sum, rec) => sum + Math.abs(rec.expectedImpact.utilizationImpact),
        0,
      ) / recommendations.length;

    const businessValue = recommendations.reduce(
      (sum, rec) => sum + rec.expectedImpact.businessValueImpact,
      0,
    );

    const riskScore =
      recommendations.reduce((sum, rec) => {
        const riskWeights = { low: 0.1, medium: 0.3, high: 0.6, critical: 1.0 };
        return sum + riskWeights[rec.riskAssessment.riskLevel];
      }, 0) / recommendations.length;

    return {
      totalCost,
      overallROI: averageROI,
      utilizationEfficiency,
      businessValue,
      riskAdjustedReturn: averageROI * (1 - riskScore * 0.3),
      successProbability: Math.max(20, 90 - riskScore * 40),
    };
  }

  /**
   * Generate insights and analysis
   * @param candidates - Original candidates
   * @param primaryRecommendations - Primary recommendations
   * @param alternativeRecommendations - Alternative recommendations
   * @param context - Recommendation context
   * @returns Recommendation insights
   */
  private generateInsights(
    candidates: AllocationCandidate[],
    primaryRecommendations: AllocationRecommendation[],
    alternativeRecommendations: Map<
      AllocationStrategy,
      AllocationRecommendation[]
    >,
    context: RecommendationContext,
  ): RecommendationInsights {
    const keyFindings = this.generateKeyFindings(
      candidates,
      primaryRecommendations,
    );
    const opportunities = this.identifyOptimizationOpportunities(
      primaryRecommendations,
    );
    const risks = this.identifyRisks(primaryRecommendations);
    const strategicRecommendations = this.generateStrategicRecommendations(
      primaryRecommendations,
      context,
    );
    const implementationPriorities = this.determineImplementationPriorities(
      primaryRecommendations,
    );

    return {
      keyFindings,
      opportunities,
      risks,
      strategicRecommendations,
      implementationPriorities,
    };
  }

  /**
   * Generate key findings from analysis
   * @param candidates - Original candidates
   * @param recommendations - Generated recommendations
   * @returns Array of key findings
   */
  private generateKeyFindings(
    candidates: AllocationCandidate[],
    recommendations: AllocationRecommendation[],
  ): string[] {
    const findings: string[] = [];

    const totalSavings = recommendations.reduce(
      (sum, rec) => sum + rec.potentialSavings,
      0,
    );
    const totalBudget = candidates.reduce(
      (sum, c) => sum + c.currentAllocation,
      0,
    );
    const savingsPercentage = (totalSavings / totalBudget) * 100;

    if (savingsPercentage > 15) {
      findings.push(
        `Significant optimization opportunity: ${Math.round(savingsPercentage)}% potential savings identified`,
      );
    } else if (savingsPercentage > 5) {
      findings.push(
        `Moderate optimization potential: ${Math.round(savingsPercentage)}% savings possible`,
      );
    } else {
      findings.push(
        'Current allocation is relatively optimized with minimal adjustment opportunities',
      );
    }

    const highConfidenceCount = recommendations.filter(
      (r) => r.confidence > 80,
    ).length;
    if (highConfidenceCount > recommendations.length * 0.7) {
      findings.push(
        `High confidence in ${highConfidenceCount} out of ${recommendations.length} recommendations`,
      );
    }

    const criticalResources = candidates.filter(
      (c) => c.priority === 'critical',
    ).length;
    if (criticalResources > 0) {
      findings.push(
        `${criticalResources} critical resources requiring careful allocation management`,
      );
    }

    return findings;
  }

  /**
   * Identify optimization opportunities
   * @param recommendations - Generated recommendations
   * @returns Array of opportunities
   */
  private identifyOptimizationOpportunities(
    recommendations: AllocationRecommendation[],
  ): string[] {
    const opportunities: string[] = [];

    const underutilizedResources = recommendations.filter(
      (r) => r.allocationChange < 0 && r.confidence > 70,
    );
    if (underutilizedResources.length > 0) {
      opportunities.push(
        `${underutilizedResources.length} underutilized resources identified for reallocation`,
      );
    }

    const highROIOpportunities = recommendations.filter(
      (r) => r.expectedImpact.roiImpact > 0.2 && r.confidence > 75,
    );
    if (highROIOpportunities.length > 0) {
      opportunities.push(
        `${highROIOpportunities.length} high-ROI opportunities with significant return potential`,
      );
    }

    const quickWins = recommendations.filter(
      (r) => r.implementationComplexity === 'low' && r.potentialSavings > 0,
    );
    if (quickWins.length > 0) {
      opportunities.push(
        `${quickWins.length} quick-win opportunities for immediate impact`,
      );
    }

    return opportunities;
  }

  /**
   * Identify risks in recommendations
   * @param recommendations - Generated recommendations
   * @returns Array of risks
   */
  private identifyRisks(recommendations: AllocationRecommendation[]): string[] {
    const risks: string[] = [];

    const highRiskChanges = recommendations.filter(
      (r) =>
        r.riskAssessment.riskLevel === 'high' ||
        r.riskAssessment.riskLevel === 'critical',
    );
    if (highRiskChanges.length > 0) {
      risks.push(
        `${highRiskChanges.length} recommendations carry high implementation risk`,
      );
    }

    const largeChanges = recommendations.filter(
      (r) => Math.abs(r.allocationChange / r.currentAllocation) > 0.3,
    );
    if (largeChanges.length > 0) {
      risks.push(
        `${largeChanges.length} resources face significant allocation changes (>30%)`,
      );
    }

    const lowConfidenceChanges = recommendations.filter(
      (r) => r.confidence < 70,
    );
    if (lowConfidenceChanges.length > 0) {
      risks.push(
        `${lowConfidenceChanges.length} recommendations have lower confidence levels`,
      );
    }

    return risks;
  }

  /**
   * Generate strategic recommendations
   * @param recommendations - Generated recommendations
   * @param context - Recommendation context
   * @returns Array of strategic recommendations
   */
  private generateStrategicRecommendations(
    recommendations: AllocationRecommendation[],
    context: RecommendationContext,
  ): string[] {
    const strategic: string[] = [];

    if (context.preferences.optimizationHorizon === 'long_term') {
      strategic.push(
        'Focus on long-term ROI optimization over immediate cost savings',
      );
    }

    if (context.businessContext.businessCycle === 'growth') {
      strategic.push(
        'Prioritize growth-enabling resource allocation over cost optimization',
      );
    }

    if (context.preferences.riskTolerance === 'conservative') {
      strategic.push(
        'Implement changes gradually with careful monitoring of performance impacts',
      );
    } else if (context.preferences.riskTolerance === 'aggressive') {
      strategic.push(
        'Consider accelerated implementation timeline for maximum impact',
      );
    }

    const criticalRecommendations = recommendations.filter(
      (r) => r.priority === 'critical',
    );
    if (criticalRecommendations.length > 0) {
      strategic.push(
        'Ensure business continuity plans are in place before implementing critical resource changes',
      );
    }

    return strategic;
  }

  /**
   * Determine implementation priorities
   * @param recommendations - Generated recommendations
   * @returns Array of implementation priorities
   */
  private determineImplementationPriorities(
    recommendations: AllocationRecommendation[],
  ): string[] {
    const priorities: string[] = [];

    // Sort by combination of confidence, potential savings, and implementation complexity
    const sortedRecommendations = [...recommendations].sort((a, b) => {
      const scoreA =
        a.confidence * 0.4 +
        a.potentialSavings * 0.4 +
        (a.implementationComplexity === 'low'
          ? 30
          : a.implementationComplexity === 'medium'
            ? 15
            : 0) *
          0.2;
      const scoreB =
        b.confidence * 0.4 +
        b.potentialSavings * 0.4 +
        (b.implementationComplexity === 'low'
          ? 30
          : b.implementationComplexity === 'medium'
            ? 15
            : 0) *
          0.2;
      return scoreB - scoreA;
    });

    const topPriority = sortedRecommendations.slice(0, 3);
    if (topPriority.length > 0) {
      priorities.push(
        `Immediate: ${topPriority.map((r) => r.title).join(', ')}`,
      );
    }

    const secondPriority = sortedRecommendations.slice(3, 6);
    if (secondPriority.length > 0) {
      priorities.push(
        `Short-term: ${secondPriority.map((r) => r.title).join(', ')}`,
      );
    }

    const remainingPriority = sortedRecommendations.slice(6);
    if (remainingPriority.length > 0) {
      priorities.push(
        `Medium-term: ${remainingPriority.length} additional optimization opportunities`,
      );
    }

    return priorities;
  }

  /**
   * Calculate performance metrics
   * @param candidates - Original candidates
   * @param primaryRecommendations - Primary recommendations
   * @param alternativeRecommendations - Alternative recommendations
   * @returns Performance metrics
   */
  private calculatePerformanceMetrics(
    candidates: AllocationCandidate[],
    primaryRecommendations: AllocationRecommendation[],
    alternativeRecommendations: Map<
      AllocationStrategy,
      AllocationRecommendation[]
    >,
  ): RecommendationPerformanceMetrics {
    const processingTime = performance.now() - this.processingStartTime;
    const strategiesEvaluated = 1 + alternativeRecommendations.size;

    // Calculate quality score based on multiple factors
    const avgConfidence =
      primaryRecommendations.reduce((sum, r) => sum + r.confidence, 0) /
      primaryRecommendations.length;
    const avgPotentialSavings =
      primaryRecommendations.reduce((sum, r) => sum + r.potentialSavings, 0) /
      primaryRecommendations.length;
    const totalBudget = candidates.reduce(
      (sum, c) => sum + c.currentAllocation,
      0,
    );
    const savingsRatio =
      avgPotentialSavings / (totalBudget / primaryRecommendations.length);

    const qualityScore = Math.min(
      100,
      avgConfidence * 0.5 + savingsRatio * 100 * 0.3 + strategiesEvaluated * 5,
    );

    // Calculate confidence distribution
    const high = primaryRecommendations.filter((r) => r.confidence > 80).length;
    const medium = primaryRecommendations.filter(
      (r) => r.confidence >= 60 && r.confidence <= 80,
    ).length;
    const low = primaryRecommendations.filter((r) => r.confidence < 60).length;

    return {
      processingTime,
      candidatesAnalyzed: candidates.length,
      strategiesEvaluated,
      qualityScore,
      confidenceDistribution: { high, medium, low },
    };
  }
}

/**
 * Create recommendation engine with default configuration
 * @param strategy - Default allocation strategy
 * @param logger - Logger instance
 * @returns RecommendationEngine instance
 */
export function createRecommendationEngine(
  strategy: AllocationStrategy = 'usage_based',
  logger: AllocationLogger,
): RecommendationEngine {
  const config: RecommendationEngineConfig = {
    defaultStrategy: strategy,
    enableMultiStrategy: true,
    maxRecommendations: 20,
    minConfidence: 60,
    enableScenarios: true,
    optimization: {
      enableIterativeImprovement: true,
      maxIterations: 10,
      convergenceThreshold: 0.001,
      enableParallelProcessing: false,
    },
  };

  return new RecommendationEngine(config, logger);
}
