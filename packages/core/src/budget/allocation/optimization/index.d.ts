/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Budget allocation optimization module exports
 * Provides efficiency analysis and resource utilization optimization capabilities
 *
 * @author Claude Code - Budget Allocation Agent
 * @version 1.0.0
 */
export {
  EfficiencyAnalyzer,
  createEfficiencyAnalyzer,
  DEFAULT_EFFICIENCY_CONFIG,
  type EfficiencyAnalysisConfig,
  type ResourceEfficiency,
  type EfficiencyTrend,
  type EfficiencyIssue,
  type EfficiencyImprovement,
  type PortfolioEfficiency,
} from './EfficiencyAnalyzer.js';
export {
  ResourceUtilizationOptimizer,
  createResourceUtilizationOptimizer,
  DEFAULT_UTILIZATION_CONFIG,
  type UtilizationOptimizationConfig,
  type OptimizationObjective,
  type UtilizationAnalysis,
  type UtilizationMetrics,
  type UtilizationPattern,
  type UtilizationForecast,
  type OptimizationOpportunity,
  type CapacityAnalysis,
  type PerformanceCorrelation,
  type PortfolioUtilizationResult,
} from './ResourceUtilizationOptimizer.js';
export type {
  AllocationCandidate,
  AllocationRecommendation,
  AllocationScenario,
  AllocationStrategy,
  FeatureCostAnalysis,
} from '../types.js';
