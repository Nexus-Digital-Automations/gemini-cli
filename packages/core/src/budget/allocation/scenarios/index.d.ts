/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Budget allocation scenarios module exports
 * Provides scenario-based planning tools and impact prediction capabilities
 *
 * @author Claude Code - Budget Allocation Agent
 * @version 1.0.0
 */
export {
  ScenarioPlanner,
  createScenarioPlanner,
  DEFAULT_SCENARIO_CONFIG,
  type ScenarioPlanningConfig,
  type ScenarioParameters,
  type ScenarioAnalysisResult,
  type ScenarioComparison,
  type ScenarioRiskAnalysis,
  type SensitivityAnalysisResult,
  type ImplementationRoadmap,
  type ImplementationPhase,
  type Milestone,
  type ResourceRequirement,
  type RiskMitigationPlan,
  type SuccessMetric,
} from './ScenarioPlanner.js';
export type {
  AllocationCandidate,
  AllocationRecommendation,
  AllocationScenario,
  ScenarioOutcome,
  AllocationStrategy,
  AllocationLogger,
} from '../types.js';
