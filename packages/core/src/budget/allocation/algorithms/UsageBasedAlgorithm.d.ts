/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { BaseAllocationAlgorithm, type AllocationLogger } from './BaseAllocationAlgorithm.js';
import type { AllocationCandidate, AllocationRecommendation, AllocationAlgorithmConfig } from '../types.js';
/**
 * @fileoverview Usage-based allocation algorithm implementation
 * Allocates budget based on historical usage patterns and demand trends
 *
 * @author Claude Code - Budget Allocation Agent
 * @version 1.0.0
 */
/**
 * Usage-based allocation algorithm that distributes budget based on:
 * - Historical usage patterns
 * - Current utilization rates
 * - Usage trend projections
 * - Demand elasticity analysis
 */
export declare class UsageBasedAlgorithm extends BaseAllocationAlgorithm {
    private candidatesMap;
    /**
     * Create usage-based allocation algorithm
     * @param config - Algorithm configuration
     * @param logger - Logger instance
     */
    constructor(config: AllocationAlgorithmConfig, logger: AllocationLogger);
    /**
     * Execute usage-based allocation optimization
     * @param candidates - Array of allocation candidates
     * @returns Array of allocation recommendations
     */
    protected executeOptimization(candidates: AllocationCandidate[]): Promise<AllocationRecommendation[]>;
    /**
     * Calculate comprehensive usage metrics for allocation decisions
     * @param candidates - Allocation candidates
     * @returns Usage metrics for each candidate
     */
    private calculateUsageMetrics;
    /**
     * Calculate usage-based allocation adjustments
     * @param candidates - Allocation candidates
     * @param usageMetrics - Calculated usage metrics
     * @returns Allocation adjustment factors for each candidate
     */
    private calculateUsageBasedAdjustments;
    /**
     * Calculate utilization rate for a candidate
     * @param candidate - Allocation candidate
     * @returns Utilization rate (0-1)
     */
    private calculateUtilizationRate;
    /**
     * Calculate usage trend direction and strength
     * @param candidate - Allocation candidate
     * @returns Usage trend (-1 to 1, where 1 = strong upward trend)
     */
    private calculateUsageTrend;
    /**
     * Calculate demand elasticity for resource allocation
     * @param candidate - Allocation candidate
     * @returns Demand elasticity factor (0-2, where >1 = elastic)
     */
    private calculateDemandElasticity;
    /**
     * Calculate seasonality factor for usage patterns
     * @param candidate - Allocation candidate
     * @returns Seasonality factor (0.5-1.5)
     */
    private calculateSeasonalityFactor;
    /**
     * Calculate request velocity (requests per unit time)
     * @param candidate - Allocation candidate
     * @returns Request velocity score
     */
    private calculateRequestVelocity;
    /**
     * Calculate peak to average usage ratio
     * @param candidate - Allocation candidate
     * @returns Peak usage ratio (1+)
     */
    private calculatePeakUsageRatio;
    /**
     * Calculate usage volatility measure
     * @param candidate - Allocation candidate
     * @returns Volatility score (0-1)
     */
    private calculateUsageVolatility;
    /**
     * Predict future usage growth
     * @param candidate - Allocation candidate
     * @returns Predicted growth factor (0-2+)
     */
    private predictUsageGrowth;
    /**
     * Calculate utilization-based adjustment factor
     * @param metrics - Usage metrics
     * @returns Adjustment factor
     */
    private calculateUtilizationAdjustment;
    /**
     * Calculate trend-based adjustment factor
     * @param metrics - Usage metrics
     * @returns Adjustment factor
     */
    private calculateTrendAdjustment;
    /**
     * Calculate elasticity-based adjustment factor
     * @param metrics - Usage metrics
     * @returns Adjustment factor
     */
    private calculateElasticityAdjustment;
    /**
     * Calculate seasonal adjustment factor
     * @param metrics - Usage metrics
     * @returns Adjustment factor
     */
    private calculateSeasonalAdjustment;
    /**
     * Calculate growth-based adjustment factor
     * @param metrics - Usage metrics
     * @returns Adjustment factor
     */
    private calculateGrowthAdjustment;
    /**
     * Generate allocation recommendations based on usage analysis
     * @param candidates - Original candidates
     * @param usageMetrics - Calculated usage metrics
     * @param adjustments - Calculated adjustments
     * @returns Initial recommendations
     */
    private generateRecommendations;
    /**
     * Generate human-readable recommendation description
     * @param candidate - Allocation candidate
     * @param metrics - Usage metrics
     * @param adjustmentFactor - Applied adjustment factor
     * @returns Description text
     */
    private generateRecommendationDescription;
    /**
     * Calculate confidence level for recommendation
     * @param candidate - Allocation candidate
     * @param metrics - Usage metrics
     * @returns Confidence score (0-100)
     */
    private calculateConfidence;
    /**
     * Calculate expected impact from allocation change
     * @param candidate - Allocation candidate
     * @param metrics - Usage metrics
     * @param allocationChange - Allocation change amount
     * @returns Expected impact metrics
     */
    private calculateExpectedImpact;
    /**
     * Assess risk for allocation change
     * @param candidate - Allocation candidate
     * @param metrics - Usage metrics
     * @param allocationChange - Allocation change amount
     * @returns Risk assessment
     */
    private assessRisk;
    /**
     * Ensure budget balance across all recommendations
     * @param originalCandidates - Original candidates
     * @param recommendations - Initial recommendations
     * @returns Balanced recommendations
     */
    private ensureBudgetBalance;
    /**
     * Find candidate by resource ID (implementation for base class)
     * @param resourceId - Resource identifier
     * @returns Matching candidate or undefined
     */
    protected findCandidateById(resourceId: string): AllocationCandidate | undefined;
}
/**
 * Create usage-based allocation algorithm instance
 * @param config - Algorithm configuration
 * @param logger - Logger instance
 * @returns UsageBasedAlgorithm instance
 */
export declare function createUsageBasedAlgorithm(config: AllocationAlgorithmConfig, logger: AllocationLogger): UsageBasedAlgorithm;
