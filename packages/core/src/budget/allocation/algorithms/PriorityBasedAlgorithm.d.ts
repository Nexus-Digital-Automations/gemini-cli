/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  BaseAllocationAlgorithm,
  type AllocationLogger,
} from './BaseAllocationAlgorithm.js';
import type {
  AllocationCandidate,
  AllocationRecommendation,
  AllocationAlgorithmConfig,
} from '../types.js';
/**
 * @fileoverview Priority-based allocation algorithm implementation
 * Allocates budget based on business priorities and strategic importance
 *
 * @author Claude Code - Budget Allocation Agent
 * @version 1.0.0
 */
/**
 * Priority-based allocation algorithm that distributes budget by:
 * - Business priority levels (critical > high > medium > low > deferred)
 * - Strategic importance scoring
 * - Business impact weighting
 * - Resource dependency analysis
 */
export declare class PriorityBasedAlgorithm extends BaseAllocationAlgorithm {
  private candidatesMap;
  private priorityAnalysis;
  private readonly priorityWeights;
  /**
   * Create priority-based allocation algorithm
   * @param config - Algorithm configuration
   * @param logger - Logger instance
   */
  constructor(config: AllocationAlgorithmConfig, logger: AllocationLogger);
  /**
   * Execute priority-based allocation optimization
   * @param candidates - Array of allocation candidates
   * @returns Array of allocation recommendations
   */
  protected executeOptimization(
    candidates: AllocationCandidate[],
  ): Promise<AllocationRecommendation[]>;
  /**
   * Analyze priority structure and resource relationships
   * @param candidates - Allocation candidates
   */
  private analyzePriorityStructure;
  /**
   * Calculate comprehensive priority analysis for a candidate
   * @param candidate - Allocation candidate
   * @param allCandidates - All candidates for dependency analysis
   * @returns Priority analysis data
   */
  private calculatePriorityAnalysis;
  /**
   * Calculate strategic importance score
   * @param candidate - Allocation candidate
   * @returns Strategic score (0-1)
   */
  private calculateStrategicScore;
  /**
   * Analyze resource dependencies
   * @param candidate - Current candidate
   * @param allCandidates - All available candidates
   * @returns Array of dependency relationships
   */
  private analyzeDependencies;
  /**
   * Calculate dependency strength between two resources
   * @param resource1 - First resource
   * @param resource2 - Second resource
   * @returns Dependency strength (0-1)
   */
  private calculateDependencyStrength;
  /**
   * Determine dependency type between resources
   * @param dependent - Dependent resource
   * @param dependency - Dependency resource
   * @returns Dependency type
   */
  private determineDependencyType;
  /**
   * Check if dependency is bidirectional
   * @param resource1 - First resource
   * @param resource2 - Second resource
   * @returns True if bidirectional
   */
  private isBidirectionalDependency;
  /**
   * Calculate urgency factor for resource
   * @param candidate - Allocation candidate
   * @returns Urgency factor (0-1, higher = more urgent)
   */
  private calculateUrgencyFactor;
  /**
   * Assess business continuity criticality
   * @param candidate - Allocation candidate
   * @returns True if critical for business continuity
   */
  private assessBusinessContinuity;
  /**
   * Calculate competitive impact score
   * @param candidate - Allocation candidate
   * @returns Competitive impact score (0-1)
   */
  private calculateCompetitiveImpact;
  /**
   * Calculate overall priority score
   * @param baseWeight - Base priority weight
   * @param businessImpact - Business impact score
   * @param strategicScore - Strategic importance score
   * @param urgencyFactor - Urgency factor
   * @param continuityCritical - Business continuity flag
   * @param competitiveImpact - Competitive impact score
   * @returns Overall priority score
   */
  private calculateOverallPriorityScore;
  /**
   * Calculate allocation multiplier based on priority score
   * @param priorityScore - Overall priority score
   * @returns Allocation multiplier
   */
  private calculateAllocationMultiplier;
  /**
   * Estimate implementation time for resource
   * @param candidate - Allocation candidate
   * @returns Implementation time in days
   */
  private estimateImplementationTime;
  /**
   * Assess risk of delaying resource allocation
   * @param candidate - Allocation candidate
   * @returns Delay risk assessment
   */
  private assessDelayRisk;
  /**
   * Calculate impact on dependent resources
   * @param candidate - Allocation candidate
   * @returns Dependency impact score (0-1)
   */
  private calculateDependencyImpact;
  /**
   * Calculate priority-based allocation distribution
   * @param candidates - Allocation candidates
   * @returns Priority-based distribution
   */
  private calculatePriorityDistribution;
  /**
   * Adjust distribution for budget balance
   * @param candidates - Allocation candidates
   * @param distribution - Current distribution
   * @param totalBudget - Target total budget
   * @param allocatedBudget - Currently allocated budget
   */
  private adjustForBudgetBalance;
  /**
   * Generate priority-based recommendations
   * @param candidates - Original candidates
   * @param distribution - Priority-based distribution
   * @returns Array of recommendations
   */
  private generatePriorityRecommendations;
  /**
   * Generate description for priority recommendation
   * @param candidate - Allocation candidate
   * @param analysis - Priority analysis
   * @param allocationChange - Allocation change amount
   * @returns Description text
   */
  private generatePriorityRecommendationDescription;
  /**
   * Determine implementation complexity for priority optimization
   * @param candidate - Allocation candidate
   * @param analysis - Priority analysis
   * @returns Implementation complexity
   */
  private determinePriorityComplexity;
  /**
   * Calculate confidence for priority recommendation
   * @param candidate - Allocation candidate
   * @param analysis - Priority analysis
   * @returns Confidence score (0-100)
   */
  private calculatePriorityConfidence;
  /**
   * Calculate expected impact from priority optimization
   * @param candidate - Allocation candidate
   * @param analysis - Priority analysis
   * @param allocationChange - Allocation change amount
   * @returns Expected impact metrics
   */
  private calculatePriorityExpectedImpact;
  /**
   * Assess risk for priority optimization
   * @param candidate - Allocation candidate
   * @param analysis - Priority analysis
   * @param allocationChange - Allocation change amount
   * @returns Risk assessment
   */
  private assessPriorityRisk;
  /**
   * Balance priority allocations within constraints
   * @param originalCandidates - Original candidates
   * @param recommendations - Initial recommendations
   * @returns Balanced recommendations
   */
  private balancePriorityAllocations;
  /**
   * Count resources by priority level
   * @param candidates - Allocation candidates
   * @param priority - Priority level to count
   * @returns Count of resources at priority level
   */
  private countResourcesByPriority;
  /**
   * Calculate total priority score across all candidates
   * @param candidates - Allocation candidates
   * @returns Total priority score
   */
  private calculateTotalPriorityScore;
  /**
   * Find candidate by resource ID (implementation for base class)
   * @param resourceId - Resource identifier
   * @returns Matching candidate or undefined
   */
  protected findCandidateById(
    resourceId: string,
  ): AllocationCandidate | undefined;
}
/**
 * Create priority-based allocation algorithm instance
 * @param config - Algorithm configuration
 * @param logger - Logger instance
 * @returns PriorityBasedAlgorithm instance
 */
export declare function createPriorityBasedAlgorithm(
  config: AllocationAlgorithmConfig,
  logger: AllocationLogger,
): PriorityBasedAlgorithm;
