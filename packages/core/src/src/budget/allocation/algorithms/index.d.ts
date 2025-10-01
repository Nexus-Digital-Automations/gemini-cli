/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * @fileoverview Budget allocation algorithms module exports
 * Provides comprehensive allocation optimization algorithms for intelligent budget distribution
 *
 * @author Claude Code - Budget Allocation Agent
 * @version 1.0.0
 */
export { BaseAllocationAlgorithm, type AllocationLogger, } from './BaseAllocationAlgorithm.js';
export { UsageBasedAlgorithm, createUsageBasedAlgorithm, } from './UsageBasedAlgorithm.js';
export { ROIOptimizedAlgorithm, createROIOptimizedAlgorithm, } from './ROIOptimizedAlgorithm.js';
export { PriorityBasedAlgorithm, createPriorityBasedAlgorithm, } from './PriorityBasedAlgorithm.js';
export type { AllocationCandidate, AllocationRecommendation, AllocationAlgorithmConfig, AllocationOptimizationResult, AllocationStrategy, AllocationPriority, AllocationConstraints, AllocationImpact, RiskAssessment, AllocationScenario, ScenarioOutcome, } from '../types.js';
import type { AllocationStrategy, AllocationAlgorithmConfig, AllocationOptimizationResult } from '../types.js';
import type { BaseAllocationAlgorithm } from './BaseAllocationAlgorithm.js';
import { type AllocationLogger } from './BaseAllocationAlgorithm.js';
/**
 * Algorithm registry for dynamic algorithm selection
 */
export declare const ALGORITHM_REGISTRY: {
    readonly usage_based: "UsageBasedAlgorithm";
    readonly roi_optimized: "ROIOptimizedAlgorithm";
    readonly priority_weighted: "PriorityBasedAlgorithm";
    readonly cost_minimized: "UsageBasedAlgorithm";
    readonly performance_balanced: "ROIOptimizedAlgorithm";
    readonly risk_adjusted: "PriorityBasedAlgorithm";
    readonly capacity_constrained: "UsageBasedAlgorithm";
};
/**
 * Algorithm factory function for creating algorithm instances
 * @param strategy - Allocation strategy
 * @param config - Algorithm configuration
 * @param logger - Logger instance
 * @returns Algorithm instance
 */
export declare function createAllocationAlgorithm(strategy: AllocationStrategy, config: AllocationAlgorithmConfig, logger: AllocationLogger): BaseAllocationAlgorithm;
/**
 * Get default configuration for allocation algorithms
 * @param strategy - Allocation strategy
 * @returns Default algorithm configuration
 */
export declare function getDefaultAlgorithmConfig(strategy: AllocationStrategy): AllocationAlgorithmConfig;
/**
 * Validate algorithm configuration
 * @param config - Algorithm configuration to validate
 * @throws Error if configuration is invalid
 */
export declare function validateAlgorithmConfig(config: AllocationAlgorithmConfig): void;
/**
 * Get algorithm performance metrics
 * @param algorithm - Algorithm instance
 * @returns Performance metrics
 */
export declare function getAlgorithmMetrics(algorithm: BaseAllocationAlgorithm): {
    strategy: AllocationStrategy;
    executionTime: number;
    iterations: number;
};
/**
 * Compare algorithm performance across multiple strategies
 * @param results - Array of optimization results from different algorithms
 * @returns Performance comparison data
 */
export declare function compareAlgorithmPerformance(results: Array<{
    strategy: AllocationStrategy;
    result: AllocationOptimizationResult;
}>): AlgorithmComparison;
/**
 * Algorithm performance comparison result
 */
export interface AlgorithmComparison {
    strategies: AllocationStrategy[];
    executionTimes: number[];
    optimizationScores: number[];
    totalAllocated: number[];
    recommendationCounts: number[];
    bestStrategy: AllocationStrategy | '';
    worstStrategy: AllocationStrategy | '';
    averageScore: number;
    scoreVariance: number;
}
