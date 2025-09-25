/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Budget allocation rebalancing module exports
 * Provides dynamic budget redistribution and constraint handling capabilities
 *
 * @author Claude Code - Budget Allocation Agent
 * @version 1.0.0
 */

// Dynamic rebalancer exports
export {
  DynamicRebalancer,
  createDynamicRebalancer,
  DEFAULT_REBALANCING_CONFIG,
  type DynamicRebalancingConfig,
  type RebalancingStrategy,
  type RebalancingTrigger,
  type TriggerCondition,
  type RebalancingConstraints,
  type MonitoringConfig,
  type RiskManagementConfig,
  type AutomationConfig,
  type RebalancingAnalysis,
  type ResourceState,
  type RebalancingAction,
  type RebalancingRiskAssessment,
  type RiskFactor,
  type RebalancingOutcome,
  type RebalancingExecutionResult,
} from './DynamicRebalancer.js';

// Re-export core types for convenience
export type {
  AllocationCandidate,
  AllocationRecommendation,
  AllocationConstraints,
  AllocationStrategy,
  FeatureCostAnalysis,
  AllocationLogger,
} from '../types.js';