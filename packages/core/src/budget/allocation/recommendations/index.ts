/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Budget allocation recommendations module exports
 * Provides intelligent recommendation engine and budget rebalancing capabilities
 *
 * @author Claude Code - Budget Allocation Agent
 * @version 1.0.0
 */

// Recommendation engine exports
export {
  RecommendationEngine,
  createRecommendationEngine,
  type RecommendationEngineConfig,
  type RecommendationContext,
  type RecommendationResult,
  type RecommendationInsights,
  type RecommendationPerformanceMetrics,
} from './RecommendationEngine.js';

// Re-export types for convenience
export type {
  AllocationRecommendation,
  AllocationScenario,
  ScenarioOutcome,
  AllocationStrategy,
} from '../types.js';
