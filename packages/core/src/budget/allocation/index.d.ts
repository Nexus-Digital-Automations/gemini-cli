/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Budget allocation system - Main module exports
 * Intelligent budget allocation recommendations and optimization system
 *
 * @author Claude Code - Budget Allocation Agent
 * @version 1.0.0
 */
export type {
  AllocationPriority,
  AllocationStrategy,
  AllocationConstraints,
  SLARequirements,
  AllocationCandidate,
  AllocationRecommendation,
  AllocationImpact,
  RiskAssessment,
  AllocationScenario,
  ScenarioOutcome,
  AllocationAlgorithmConfig,
  AllocationOptimizationResult,
} from './types.js';
export {
  BaseAllocationAlgorithm,
  UsageBasedAlgorithm,
  ROIOptimizedAlgorithm,
  PriorityBasedAlgorithm,
  createAllocationAlgorithm,
  createUsageBasedAlgorithm,
  createROIOptimizedAlgorithm,
  createPriorityBasedAlgorithm,
  getDefaultAlgorithmConfig,
  validateAlgorithmConfig,
  getAlgorithmMetrics,
  compareAlgorithmPerformance,
  type AllocationLogger,
  type AlgorithmComparison,
  ALGORITHM_REGISTRY,
} from './algorithms/index.js';
export {
  RecommendationEngine,
  createRecommendationEngine,
  type RecommendationEngineConfig,
  type RecommendationContext,
  type RecommendationResult,
  type RecommendationInsights,
  type RecommendationPerformanceMetrics,
} from './recommendations/index.js';
export {
  EfficiencyAnalyzer,
  createEfficiencyAnalyzer,
  ResourceUtilizationOptimizer,
  createResourceUtilizationOptimizer,
  DEFAULT_EFFICIENCY_CONFIG,
  DEFAULT_UTILIZATION_CONFIG,
} from './optimization/index.js';
export {
  ResourceRanking,
  createResourceRanking,
  PriorityAssignment,
  createPriorityAssignment,
  DEFAULT_RANKING_CONFIG,
  DEFAULT_PRIORITY_CONFIG,
} from './prioritization/index.js';
export {
  DynamicRebalancer,
  createDynamicRebalancer,
  DEFAULT_REBALANCING_CONFIG,
} from './rebalancing/index.js';
export {
  ScenarioPlanner,
  createScenarioPlanner,
  DEFAULT_SCENARIO_CONFIG,
} from './scenarios/index.js';
export type {
  EfficiencyAnalysisConfig,
  ResourceEfficiency,
  EfficiencyTrend,
  EfficiencyIssue,
  EfficiencyImprovement,
  PortfolioEfficiency,
  UtilizationOptimizationConfig,
  OptimizationObjective,
  UtilizationAnalysis,
  UtilizationMetrics,
  UtilizationPattern,
  UtilizationForecast,
  OptimizationOpportunity,
  CapacityAnalysis,
  PerformanceCorrelation,
  PortfolioUtilizationResult,
} from './optimization/index.js';
export type {
  ResourceRankingConfig,
  RankingCriteria,
  PriorityThresholds,
  BusinessContextConfig,
  RankingAlgorithmConfig,
  ResourceRanking as ResourceRankingResult,
  ScoreBreakdown,
  RankingJustification,
  SensitivityAnalysis,
  PortfolioRanking,
  PortfolioInsights,
  RankingStatistics,
  PriorityAssignmentConfig,
  PriorityAssignmentStrategy,
  PriorityAdjustmentConstraints,
  PriorityEscalationConfig,
  ConflictResolutionConfig,
  BusinessRulesConfig,
  BusinessRule,
  EscalationTrigger,
  PriorityAssignmentResult,
  AssignmentRationale,
  AssignmentMetadata,
  PortfolioPriorityAssignmentResult,
  PortfolioPriorityInsights,
  PriorityConflict,
  PriorityEscalation,
  PriorityRecommendation,
} from './prioritization/index.js';
export type {
  DynamicRebalancingConfig,
  RebalancingStrategy,
  RebalancingTrigger,
  TriggerCondition,
  RebalancingConstraints,
  MonitoringConfig,
  RiskManagementConfig,
  AutomationConfig,
  RebalancingAnalysis,
  ResourceState,
  RebalancingAction,
  RebalancingRiskAssessment,
  RiskFactor,
  RebalancingOutcome,
  RebalancingExecutionResult,
} from './rebalancing/index.js';
export type {
  ScenarioPlanningConfig,
  ScenarioParameters,
  ScenarioAnalysisResult,
  ScenarioComparison,
  ScenarioRiskAnalysis,
  SensitivityAnalysisResult,
  ImplementationRoadmap,
  ImplementationPhase,
  Milestone,
  ResourceRequirement,
  RiskMitigationPlan,
  SuccessMetric,
} from './scenarios/index.js';
/**
 * Main allocation system interface
 */
export interface AllocationSystem {
  /** Recommendation engine instance */
  recommendationEngine: RecommendationEngine;
  /** Available allocation strategies */
  availableStrategies: AllocationStrategy[];
  /** System configuration */
  configuration: AllocationSystemConfig;
  /** Generate recommendations */
  generateRecommendations(
    candidates: AllocationCandidate[],
    context: RecommendationContext,
  ): Promise<RecommendationResult>;
  /** Update system configuration */
  updateConfiguration(config: Partial<AllocationSystemConfig>): void;
  /** Get system health metrics */
  getHealthMetrics(): AllocationSystemHealth;
}
/**
 * Allocation system configuration
 */
export interface AllocationSystemConfig {
  /** Default allocation strategy */
  defaultStrategy: AllocationStrategy;
  /** Enable multi-strategy analysis */
  enableMultiStrategy: boolean;
  /** Enable scenario generation */
  enableScenarios: boolean;
  /** Minimum confidence threshold */
  minConfidence: number;
  /** Maximum recommendations per request */
  maxRecommendations: number;
  /** Logging configuration */
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
    enablePerformanceLogging: boolean;
  };
}
/**
 * Allocation system health metrics
 */
export interface AllocationSystemHealth {
  /** System status */
  status: 'healthy' | 'degraded' | 'unhealthy';
  /** Last request processing time */
  lastProcessingTime: number;
  /** Average processing time (last 10 requests) */
  averageProcessingTime: number;
  /** Success rate percentage */
  successRate: number;
  /** Number of requests processed */
  requestCount: number;
  /** System uptime in milliseconds */
  uptime: number;
  /** Memory usage information */
  memoryUsage: {
    used: number;
    total: number;
    percentage: number;
  };
}
/**
 * Default allocation system configuration
 */
export declare const DEFAULT_ALLOCATION_CONFIG: AllocationSystemConfig;
/**
 * Create allocation system instance
 * @param config - System configuration (optional)
 * @param logger - Logger instance
 * @returns AllocationSystem instance
 */
export declare function createAllocationSystem(
  config: Partial<AllocationSystemConfig> | undefined,
  logger: AllocationLogger,
): AllocationSystem;
/**
 * Utility function to create allocation candidates from budget data
 * @param budgetData - Budget usage data
 * @param settings - Budget settings
 * @returns Array of allocation candidates
 */
export declare function createAllocationCandidatesFromBudgetData(
  budgetData: unknown[], // This would be properly typed based on actual budget data structure
  _settings?: unknown,
): AllocationCandidate[];
/**
 * Utility function to create recommendation context from system state
 * @param totalBudget - Total available budget
 * @param preferences - User preferences
 * @returns Recommendation context
 */
export declare function createRecommendationContext(
  totalBudget: number,
  preferences?: Partial<RecommendationContext['preferences']>,
): RecommendationContext;
