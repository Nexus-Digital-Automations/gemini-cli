/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Budget allocation prioritization module exports
 * Provides resource ranking and priority-based assignment algorithms
 *
 * @author Claude Code - Budget Allocation Agent
 * @version 1.0.0
 */

// Resource ranking exports
export {
  ResourceRanking,
  createResourceRanking,
  DEFAULT_RANKING_CONFIG,
  type ResourceRankingConfig,
  type RankingCriteria,
  type PriorityThresholds,
  type BusinessContextConfig,
  type RankingAlgorithmConfig,
  type ResourceRanking as ResourceRankingResult,
  type ScoreBreakdown,
  type RankingJustification,
  type SensitivityAnalysis,
  type PortfolioRanking,
  type PortfolioInsights,
  type RankingStatistics,
} from './ResourceRanking.js';

// Priority assignment exports
export {
  PriorityAssignment,
  createPriorityAssignment,
  DEFAULT_PRIORITY_CONFIG,
  type PriorityAssignmentConfig,
  type PriorityAssignmentStrategy,
  type PriorityAdjustmentConstraints,
  type PriorityEscalationConfig,
  type ConflictResolutionConfig,
  type BusinessRulesConfig,
  type BusinessRule,
  type EscalationTrigger,
  type PriorityAssignmentResult,
  type AssignmentRationale,
  type AssignmentMetadata,
  type PortfolioPriorityAssignmentResult,
  type PortfolioPriorityInsights,
  type PriorityConflict,
  type PriorityEscalation,
  type PriorityRecommendation,
} from './PriorityAssignment.js';

// Re-export core types for convenience
export type {
  AllocationCandidate,
  AllocationPriority,
  AllocationConstraints,
  FeatureCostAnalysis,
  AllocationLogger,
} from '../types.js';