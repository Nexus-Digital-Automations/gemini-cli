/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { BaseAllocationAlgorithm, type AllocationLogger } from './BaseAllocationAlgorithm.js';
import type { AllocationCandidate, AllocationRecommendation, AllocationAlgorithmConfig } from '../types.js';
/**
 * @fileoverview ROI-optimized allocation algorithm implementation
 * Maximizes return on investment by allocating budget to highest ROI resources
 *
 * @author Claude Code - Budget Allocation Agent
 * @version 1.0.0
 */
/**
 * ROI-optimized allocation algorithm that maximizes returns by:
 * - Prioritizing high ROI resources
 * - Considering risk-adjusted returns
 * - Balancing short-term and long-term ROI
 * - Optimizing marginal ROI improvements
 */
export declare class ROIOptimizedAlgorithm extends BaseAllocationAlgorithm {
    private candidatesMap;
    private roiAnalysis;
    /**
     * Create ROI-optimized allocation algorithm
     * @param config - Algorithm configuration
     * @param logger - Logger instance
     */
    constructor(config: AllocationAlgorithmConfig, logger: AllocationLogger);
    /**
     * Execute ROI-optimized allocation optimization
     * @param candidates - Array of allocation candidates
     * @returns Array of allocation recommendations
     */
    protected executeOptimization(candidates: AllocationCandidate[]): Promise<AllocationRecommendation[]>;
    /**
     * Analyze ROI potential for all candidates
     * @param candidates - Allocation candidates
     */
    private analyzeROIPotential;
    /**
     * Calculate comprehensive ROI analysis for a candidate
     * @param candidate - Allocation candidate
     * @returns ROI analysis data
     */
    private calculateROIAnalysis;
    /**
     * Calculate potential ROI with optimized allocation
     * @param candidate - Allocation candidate
     * @returns Potential ROI value
     */
    private calculatePotentialROI;
    /**
     * Calculate risk factor for ROI adjustment
     * @param candidate - Allocation candidate
     * @returns Risk factor (0-1, higher = more risk)
     */
    private calculateRiskFactor;
    /**
     * Calculate marginal ROI improvement potential
     * @param candidate - Allocation candidate
     * @param potentialROI - Potential ROI value
     * @returns Marginal ROI improvement
     */
    private calculateMarginalROI;
    /**
     * Calculate ROI stability score
     * @param candidate - Allocation candidate
     * @returns Stability score (0-1, higher = more stable)
     */
    private calculateROIStability;
    /**
     * Calculate time to ROI realization
     * @param candidate - Allocation candidate
     * @returns Time to ROI in days
     */
    private calculateTimeToROI;
    /**
     * Determine ROI trend direction
     * @param candidate - Allocation candidate
     * @returns ROI trend
     */
    private determineROITrend;
    /**
     * Calculate competitive advantage factor
     * @param candidate - Allocation candidate
     * @returns Competitive advantage score (0-1)
     */
    private calculateCompetitiveAdvantage;
    /**
     * Calculate resource uniqueness factor
     * @param candidate - Allocation candidate
     * @returns Uniqueness score (0-1)
     */
    private calculateResourceUniqueness;
    /**
     * Calculate scalability factor for resource
     * @param candidate - Allocation candidate
     * @returns Scalability factor (0-2)
     */
    private calculateScalabilityFactor;
    /**
     * Calculate optimal ROI-based distribution
     * @param candidates - Allocation candidates
     * @returns Optimal allocation distribution
     */
    private calculateOptimalROIDistribution;
    /**
     * Allocate budget using efficient frontier optimization
     * @param sortedCandidates - Candidates sorted by ROI
     * @param totalBudget - Total budget to allocate
     * @param distribution - Distribution map to populate
     */
    private allocateUsingEfficientFrontier;
    /**
     * Calculate marginal ROI for additional budget allocation
     * @param candidate - Allocation candidate
     * @param analysis - ROI analysis
     * @param currentAllocation - Current allocation amount
     * @returns Marginal ROI value
     */
    private calculateMarginalROIForAdditionalBudget;
    /**
     * Distribute remaining budget proportionally
     * @param sortedCandidates - Sorted candidates
     * @param remainingBudget - Remaining budget to distribute
     * @param distribution - Current distribution
     */
    private distributeRemainingBudget;
    /**
     * Generate ROI-optimized recommendations
     * @param candidates - Original candidates
     * @param distribution - Optimal distribution
     * @returns Array of recommendations
     */
    private generateROIRecommendations;
    /**
     * Generate description for ROI recommendation
     * @param candidate - Allocation candidate
     * @param analysis - ROI analysis
     * @param allocationChange - Allocation change amount
     * @returns Description text
     */
    private generateROIRecommendationDescription;
    /**
     * Determine implementation complexity for ROI optimization
     * @param candidate - Allocation candidate
     * @param analysis - ROI analysis
     * @returns Implementation complexity
     */
    private determineImplementationComplexity;
    /**
     * Calculate confidence for ROI recommendation
     * @param candidate - Allocation candidate
     * @param analysis - ROI analysis
     * @returns Confidence score (0-100)
     */
    private calculateROIConfidence;
    /**
     * Calculate expected impact from ROI optimization
     * @param candidate - Allocation candidate
     * @param analysis - ROI analysis
     * @param allocationChange - Allocation change amount
     * @returns Expected impact metrics
     */
    private calculateROIExpectedImpact;
    /**
     * Assess risk for ROI optimization
     * @param candidate - Allocation candidate
     * @param analysis - ROI analysis
     * @param allocationChange - Allocation change amount
     * @returns Risk assessment
     */
    private assessROIRisk;
    /**
     * Balance ROI allocations to ensure budget constraints
     * @param originalCandidates - Original candidates
     * @param recommendations - Initial recommendations
     * @returns Balanced recommendations
     */
    private balanceROIAllocations;
    /**
     * Ensure budget balance across recommendations
     * @param originalCandidates - Original allocation candidates
     * @param recommendations - Initial recommendations
     * @returns Balanced recommendations
     */
    private ensureBudgetBalance;
    /**
     * Create identity recommendation (no change)
     * @param candidate - Allocation candidate
     * @returns Identity recommendation
     */
    private createIdentityRecommendation;
    /**
     * Calculate total ROI improvement from recommendations
     * @param originalCandidates - Original candidates
     * @param recommendations - Generated recommendations
     * @returns Total ROI improvement
     */
    private calculateTotalROIImprovement;
    /**
     * Find candidate by resource ID (implementation for base class)
     * @param resourceId - Resource identifier
     * @returns Matching candidate or undefined
     */
    protected findCandidateById(resourceId: string): AllocationCandidate | undefined;
}
/**
 * Create ROI-optimized allocation algorithm instance
 * @param config - Algorithm configuration
 * @param logger - Logger instance
 * @returns ROIOptimizedAlgorithm instance
 */
export declare function createROIOptimizedAlgorithm(config: AllocationAlgorithmConfig, logger: AllocationLogger): ROIOptimizedAlgorithm;
