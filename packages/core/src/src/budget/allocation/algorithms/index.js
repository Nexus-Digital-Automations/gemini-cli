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
// Base algorithm exports
export { BaseAllocationAlgorithm, } from './BaseAllocationAlgorithm.js';
// Algorithm implementations
export { UsageBasedAlgorithm, createUsageBasedAlgorithm, } from './UsageBasedAlgorithm.js';
export { ROIOptimizedAlgorithm, createROIOptimizedAlgorithm, } from './ROIOptimizedAlgorithm.js';
export { PriorityBasedAlgorithm, createPriorityBasedAlgorithm, } from './PriorityBasedAlgorithm.js';
import {} from './BaseAllocationAlgorithm.js';
import { createUsageBasedAlgorithm } from './UsageBasedAlgorithm.js';
import { createROIOptimizedAlgorithm } from './ROIOptimizedAlgorithm.js';
import { createPriorityBasedAlgorithm } from './PriorityBasedAlgorithm.js';
/**
 * Algorithm registry for dynamic algorithm selection
 */
export const ALGORITHM_REGISTRY = {
    usage_based: 'UsageBasedAlgorithm',
    roi_optimized: 'ROIOptimizedAlgorithm',
    priority_weighted: 'PriorityBasedAlgorithm',
    cost_minimized: 'UsageBasedAlgorithm', // Alias to usage-based
    performance_balanced: 'ROIOptimizedAlgorithm', // Alias to ROI-optimized
    risk_adjusted: 'PriorityBasedAlgorithm', // Alias to priority-based
    capacity_constrained: 'UsageBasedAlgorithm', // Alias to usage-based
};
/**
 * Algorithm factory function for creating algorithm instances
 * @param strategy - Allocation strategy
 * @param config - Algorithm configuration
 * @param logger - Logger instance
 * @returns Algorithm instance
 */
export function createAllocationAlgorithm(strategy, config, logger) {
    switch (strategy) {
        case 'usage_based':
        case 'cost_minimized':
        case 'capacity_constrained':
            return createUsageBasedAlgorithm(config, logger);
        case 'roi_optimized':
        case 'performance_balanced':
            return createROIOptimizedAlgorithm(config, logger);
        case 'priority_weighted':
        case 'risk_adjusted':
            return createPriorityBasedAlgorithm(config, logger);
        default:
            throw new Error(`Unsupported allocation strategy: ${strategy}`);
    }
}
/**
 * Get default configuration for allocation algorithms
 * @param strategy - Allocation strategy
 * @returns Default algorithm configuration
 */
export function getDefaultAlgorithmConfig(strategy) {
    const baseConfig = {
        strategy,
        weights: {
            cost: 0.3,
            performance: 0.2,
            roi: 0.25,
            businessValue: 0.15,
            risk: 0.1,
        },
        globalConstraints: {
            minAllocation: 100,
            maxAllocation: 10000,
            allocationGranularity: 10,
            maxUtilizationRate: 0.9,
            minROIThreshold: 0.1,
        },
        objectives: [
            'maximize_roi',
            'minimize_cost',
            'optimize_performance',
            'reduce_risk',
        ],
        parameters: {},
    };
    // Customize configuration based on strategy
    switch (strategy) {
        case 'usage_based':
        case 'cost_minimized':
        case 'capacity_constrained':
            return {
                ...baseConfig,
                weights: {
                    cost: 0.4,
                    performance: 0.3,
                    roi: 0.15,
                    businessValue: 0.1,
                    risk: 0.05,
                },
                objectives: [
                    'optimize_utilization',
                    'minimize_cost',
                    'balance_capacity',
                    'improve_efficiency',
                ],
            };
        case 'roi_optimized':
        case 'performance_balanced':
            return {
                ...baseConfig,
                weights: {
                    cost: 0.15,
                    performance: 0.25,
                    roi: 0.4,
                    businessValue: 0.15,
                    risk: 0.05,
                },
                objectives: [
                    'maximize_roi',
                    'optimize_performance',
                    'increase_returns',
                    'minimize_risk',
                ],
            };
        case 'priority_weighted':
        case 'risk_adjusted':
            return {
                ...baseConfig,
                weights: {
                    cost: 0.2,
                    performance: 0.2,
                    roi: 0.2,
                    businessValue: 0.3,
                    risk: 0.1,
                },
                objectives: [
                    'align_priorities',
                    'maximize_business_value',
                    'ensure_continuity',
                    'manage_risk',
                ],
            };
        default:
            return baseConfig;
    }
}
/**
 * Validate algorithm configuration
 * @param config - Algorithm configuration to validate
 * @throws Error if configuration is invalid
 */
export function validateAlgorithmConfig(config) {
    // Check weights sum to 1.0
    const weightsSum = Object.values(config.weights).reduce((sum, weight) => sum + weight, 0);
    if (Math.abs(weightsSum - 1.0) > 0.01) {
        throw new Error(`Algorithm weights must sum to 1.0, got ${weightsSum}`);
    }
    // Validate weight ranges
    for (const [key, weight] of Object.entries(config.weights)) {
        if (weight < 0 || weight > 1) {
            throw new Error(`Weight ${key} must be between 0 and 1, got ${weight}`);
        }
    }
    // Validate constraints
    const { minAllocation, maxAllocation } = config.globalConstraints;
    if (minAllocation >= maxAllocation) {
        throw new Error('minAllocation must be less than maxAllocation');
    }
    if (minAllocation < 0) {
        throw new Error('minAllocation must be non-negative');
    }
    // Validate objectives are non-empty
    if (config.objectives.length === 0) {
        throw new Error('At least one optimization objective must be specified');
    }
}
/**
 * Get algorithm performance metrics
 * @param algorithm - Algorithm instance
 * @returns Performance metrics
 */
export function getAlgorithmMetrics(algorithm) {
    const metrics = algorithm.getExecutionMetrics();
    return {
        strategy: algorithm.getStrategy(),
        executionTime: metrics.executionTime,
        iterations: metrics.iterations,
    };
}
/**
 * Compare algorithm performance across multiple strategies
 * @param results - Array of optimization results from different algorithms
 * @returns Performance comparison data
 */
export function compareAlgorithmPerformance(results) {
    const comparison = {
        strategies: results.map((r) => r.strategy),
        executionTimes: results.map((r) => r.result.algorithmMetrics.executionTime),
        optimizationScores: results.map((r) => r.result.optimizationScore),
        totalAllocated: results.map((r) => r.result.totalAllocated),
        recommendationCounts: results.map((r) => r.result.recommendations.length),
        bestStrategy: '',
        worstStrategy: '',
        averageScore: 0,
        scoreVariance: 0,
    };
    // Calculate statistics
    comparison.averageScore =
        comparison.optimizationScores.reduce((sum, score) => sum + score, 0) /
            results.length;
    const variance = comparison.optimizationScores.reduce((sum, score) => sum + Math.pow(score - comparison.averageScore, 2), 0) / results.length;
    comparison.scoreVariance = variance;
    // Find best and worst strategies
    const maxScoreIndex = comparison.optimizationScores.indexOf(Math.max(...comparison.optimizationScores));
    const minScoreIndex = comparison.optimizationScores.indexOf(Math.min(...comparison.optimizationScores));
    comparison.bestStrategy = comparison.strategies[maxScoreIndex];
    comparison.worstStrategy = comparison.strategies[minScoreIndex];
    return comparison;
}
//# sourceMappingURL=index.js.map