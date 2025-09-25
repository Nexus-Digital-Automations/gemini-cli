/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type {
  AllocationCandidate,
  AllocationRecommendation,
  AllocationAlgorithmConfig,
  AllocationOptimizationResult,
  AllocationStrategy,
} from '../types.js';
/**
 * @fileoverview Base allocation algorithm interface and implementation
 * Provides foundation for all budget allocation optimization algorithms
 *
 * @author Claude Code - Budget Allocation Agent
 * @version 1.0.0
 */
/**
 * Logger interface for allocation algorithms
 */
export interface AllocationLogger {
  info(message: string, context?: Record<string, unknown>): void;
  warn(message: string, context?: Record<string, unknown>): void;
  error(message: string, context?: Record<string, unknown>): void;
  debug(message: string, context?: Record<string, unknown>): void;
}
/**
 * Abstract base class for all budget allocation algorithms
 * Provides common functionality and enforces consistent interface
 */
export declare abstract class BaseAllocationAlgorithm {
  protected readonly strategy: AllocationStrategy;
  protected readonly config: AllocationAlgorithmConfig;
  protected readonly logger: AllocationLogger;
  protected executionTime: number;
  protected iterations: number;
  /**
   * Initialize base allocation algorithm
   * @param strategy - Allocation strategy to use
   * @param config - Algorithm configuration parameters
   * @param logger - Logger instance for debugging and monitoring
   */
  constructor(
    strategy: AllocationStrategy,
    config: AllocationAlgorithmConfig,
    logger: AllocationLogger,
  );
  /**
   * Execute budget allocation optimization for given candidates
   * @param candidates - Array of allocation candidates to optimize
   * @returns Optimization result with recommendations
   */
  optimize(
    candidates: AllocationCandidate[],
  ): Promise<AllocationOptimizationResult>;
  /**
   * Abstract method for algorithm-specific optimization logic
   * Must be implemented by concrete algorithm classes
   * @param candidates - Array of allocation candidates
   * @returns Array of allocation recommendations
   */
  protected abstract executeOptimization(
    candidates: AllocationCandidate[],
  ): Promise<AllocationRecommendation[]>;
  /**
   * Calculate optimization score based on objectives achievement
   * @param originalCandidates - Original candidates before optimization
   * @param recommendations - Generated recommendations
   * @returns Optimization score (0-100)
   */
  protected calculateOptimizationScore(
    originalCandidates: AllocationCandidate[],
    recommendations: AllocationRecommendation[],
  ): number;
  /**
   * Validate input candidates for optimization
   * @param candidates - Candidates to validate
   * @throws Error if validation fails
   */
  protected validateCandidates(candidates: AllocationCandidate[]): void;
  /**
   * Validate optimization results
   * @param originalCandidates - Original candidates
   * @param recommendations - Generated recommendations
   * @throws Error if validation fails
   */
  protected validateResults(
    originalCandidates: AllocationCandidate[],
    recommendations: AllocationRecommendation[],
  ): void;
  /**
   * Calculate total current budget allocation
   * @param candidates - Allocation candidates
   * @returns Total current budget
   */
  protected calculateTotalCurrentBudget(
    candidates: AllocationCandidate[],
  ): number;
  /**
   * Calculate cost improvement from optimization
   * @param originalCandidates - Original candidates
   * @param recommendations - Optimization recommendations
   * @returns Cost improvement ratio (0-1)
   */
  protected calculateCostImprovement(
    originalCandidates: AllocationCandidate[],
    recommendations: AllocationRecommendation[],
  ): number;
  /**
   * Calculate ROI improvement from optimization
   * @param originalCandidates - Original candidates
   * @param recommendations - Optimization recommendations
   * @returns ROI improvement ratio (0-1)
   */
  protected calculateROIImprovement(
    originalCandidates: AllocationCandidate[],
    recommendations: AllocationRecommendation[],
  ): number;
  /**
   * Calculate weighted ROI from candidates
   * @param candidates - Allocation candidates
   * @returns Weighted average ROI
   */
  protected calculateWeightedROI(candidates: AllocationCandidate[]): number;
  /**
   * Calculate business value score from recommendations
   * @param recommendations - Optimization recommendations
   * @returns Business value score (0-100)
   */
  protected calculateBusinessValueScore(
    recommendations: AllocationRecommendation[],
  ): number;
  /**
   * Calculate performance score from recommendations
   * @param recommendations - Optimization recommendations
   * @returns Performance score (0-100)
   */
  protected calculatePerformanceScore(
    recommendations: AllocationRecommendation[],
  ): number;
  /**
   * Calculate risk score from recommendations
   * @param recommendations - Optimization recommendations
   * @returns Risk score (0-1, higher = more risk)
   */
  protected calculateRiskScore(
    recommendations: AllocationRecommendation[],
  ): number;
  /**
   * Calculate efficiency score for algorithm performance
   * @param originalCandidates - Original candidates
   * @param recommendations - Generated recommendations
   * @returns Efficiency score (0-100)
   */
  protected calculateEfficiencyScore(
    originalCandidates: AllocationCandidate[],
    recommendations: AllocationRecommendation[],
  ): number;
  /**
   * Validate that all constraints are satisfied
   * @param recommendations - Optimization recommendations
   * @returns True if all constraints satisfied
   */
  protected validateConstraints(
    recommendations: AllocationRecommendation[],
  ): boolean;
  /**
   * Validate budget balance in recommendations
   * @param originalCandidates - Original candidates
   * @param recommendations - Generated recommendations
   * @returns True if budget is balanced
   */
  protected validateBudgetBalance(
    originalCandidates: AllocationCandidate[],
    recommendations: AllocationRecommendation[],
  ): boolean;
  /**
   * Validate that optimization achieved improvement
   * @param originalCandidates - Original candidates
   * @param recommendations - Generated recommendations
   * @returns True if improvement achieved
   */
  protected validateImprovement(
    originalCandidates: AllocationCandidate[],
    recommendations: AllocationRecommendation[],
  ): boolean;
  /**
   * Find candidate by resource ID
   * @param resourceId - Resource identifier
   * @returns Matching candidate or undefined
   */
  protected findCandidateById(
    resourceId: string,
  ): AllocationCandidate | undefined;
  /**
   * Get algorithm strategy
   * @returns Current allocation strategy
   */
  getStrategy(): AllocationStrategy;
  /**
   * Get algorithm configuration
   * @returns Current configuration
   */
  getConfig(): AllocationAlgorithmConfig;
  /**
   * Get execution metrics
   * @returns Performance metrics from last optimization
   */
  getExecutionMetrics(): {
    executionTime: number;
    iterations: number;
  };
}
