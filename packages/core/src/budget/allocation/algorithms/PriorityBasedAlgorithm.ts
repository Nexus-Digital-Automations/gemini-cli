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
  AllocationImpact,
  RiskAssessment,
  AllocationPriority,
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
export class PriorityBasedAlgorithm extends BaseAllocationAlgorithm {
  private candidatesMap: Map<string, AllocationCandidate> = new Map();
  private priorityAnalysis: Map<string, PriorityAnalysis> = new Map();

  // Priority level weights for allocation calculations
  private readonly priorityWeights: Record<AllocationPriority, number> = {
    critical: 1.0,
    high: 0.75,
    medium: 0.5,
    low: 0.25,
    deferred: 0.1,
  };

  /**
   * Create priority-based allocation algorithm
   * @param config - Algorithm configuration
   * @param logger - Logger instance
   */
  constructor(config: AllocationAlgorithmConfig, logger: AllocationLogger) {
    super('priority_weighted', config, logger);
  }

  /**
   * Execute priority-based allocation optimization
   * @param candidates - Array of allocation candidates
   * @returns Array of allocation recommendations
   */
  protected async executeOptimization(
    candidates: AllocationCandidate[],
  ): Promise<AllocationRecommendation[]> {
    this.logger.info('Starting priority-based allocation optimization', {
      candidateCount: candidates.length,
      strategy: 'priority_weighted',
    });

    // Build candidate lookup map
    this.candidatesMap.clear();
    candidates.forEach((candidate) => {
      this.candidatesMap.set(candidate.resourceId, candidate);
    });

    // Analyze priority structure and dependencies
    this.analyzePriorityStructure(candidates);

    // Calculate priority-weighted allocation distribution
    const priorityDistribution = this.calculatePriorityDistribution(candidates);

    // Generate priority-based recommendations
    const recommendations = this.generatePriorityRecommendations(
      candidates,
      priorityDistribution,
    );

    // Balance allocations within priority constraints
    const balancedRecommendations = this.balancePriorityAllocations(
      candidates,
      recommendations,
    );

    this.logger.info('Priority-based optimization completed', {
      recommendationCount: balancedRecommendations.length,
      criticalResourcesCount: this.countResourcesByPriority(
        candidates,
        'critical',
      ),
      totalPriorityScore: this.calculateTotalPriorityScore(candidates),
    });

    return balancedRecommendations;
  }

  /**
   * Analyze priority structure and resource relationships
   * @param candidates - Allocation candidates
   */
  private analyzePriorityStructure(candidates: AllocationCandidate[]): void {
    this.priorityAnalysis.clear();

    for (const candidate of candidates) {
      const analysis = this.calculatePriorityAnalysis(candidate, candidates);
      this.priorityAnalysis.set(candidate.resourceId, analysis);

      this.logger.debug('Priority analysis completed', {
        resourceId: candidate.resourceId,
        priority: candidate.priority,
        strategicScore: analysis.strategicScore,
        dependencyCount: analysis.dependencyCount,
      });
    }
  }

  /**
   * Calculate comprehensive priority analysis for a candidate
   * @param candidate - Allocation candidate
   * @param allCandidates - All candidates for dependency analysis
   * @returns Priority analysis data
   */
  private calculatePriorityAnalysis(
    candidate: AllocationCandidate,
    allCandidates: AllocationCandidate[],
  ): PriorityAnalysis {
    const baseWeight = this.priorityWeights[candidate.priority];
    const businessImpact = candidate.businessImpact / 100;

    // Calculate strategic importance score
    const strategicScore = this.calculateStrategicScore(candidate);

    // Analyze resource dependencies
    const dependencies = this.analyzeDependencies(candidate, allCandidates);

    // Calculate urgency factor
    const urgencyFactor = this.calculateUrgencyFactor(candidate);

    // Calculate business continuity impact
    const continuityCritical = this.assessBusinessContinuity(candidate);

    // Calculate competitive impact
    const competitiveImpact = this.calculateCompetitiveImpact(candidate);

    // Calculate overall priority score
    const overallPriorityScore = this.calculateOverallPriorityScore(
      baseWeight,
      businessImpact,
      strategicScore,
      urgencyFactor,
      continuityCritical,
      competitiveImpact,
    );

    return {
      resourceId: candidate.resourceId,
      basePriority: candidate.priority,
      baseWeight,
      strategicScore,
      urgencyFactor,
      continuityCritical,
      competitiveImpact,
      overallPriorityScore,
      dependencies,
      dependencyCount: dependencies.length,
      allocationMultiplier:
        this.calculateAllocationMultiplier(overallPriorityScore),
      timeToImplement: this.estimateImplementationTime(candidate),
      riskOfDelaying: this.assessDelayRisk(candidate),
    };
  }

  /**
   * Calculate strategic importance score
   * @param candidate - Allocation candidate
   * @returns Strategic score (0-1)
   */
  private calculateStrategicScore(candidate: AllocationCandidate): number {
    const businessImpact = candidate.businessImpact / 100;
    const roi = Math.min(1, candidate.costAnalysis.roi / 10); // Normalize ROI
    const utilizationRate = candidate.costAnalysis.utilizationRate;

    // Strategic score combines business impact, ROI, and utilization
    return businessImpact * 0.5 + roi * 0.3 + utilizationRate * 0.2;
  }

  /**
   * Analyze resource dependencies
   * @param candidate - Current candidate
   * @param allCandidates - All available candidates
   * @returns Array of dependency relationships
   */
  private analyzeDependencies(
    candidate: AllocationCandidate,
    allCandidates: AllocationCandidate[],
  ): ResourceDependency[] {
    const dependencies: ResourceDependency[] = [];

    // Analyze based on business impact correlation and technical complexity
    for (const other of allCandidates) {
      if (other.resourceId === candidate.resourceId) continue;

      const dependencyStrength = this.calculateDependencyStrength(
        candidate,
        other,
      );

      if (dependencyStrength > 0.3) {
        dependencies.push({
          dependentResourceId: other.resourceId,
          dependencyType: this.determineDependencyType(candidate, other),
          strength: dependencyStrength,
          bidirectional: this.isBidirectionalDependency(candidate, other),
        });
      }
    }

    return dependencies;
  }

  /**
   * Calculate dependency strength between two resources
   * @param resource1 - First resource
   * @param resource2 - Second resource
   * @returns Dependency strength (0-1)
   */
  private calculateDependencyStrength(
    resource1: AllocationCandidate,
    resource2: AllocationCandidate,
  ): number {
    // Simplified dependency calculation based on similar characteristics
    const businessImpactSimilarity =
      1 - Math.abs(resource1.businessImpact - resource2.businessImpact) / 100;
    const complexitySimilarity =
      1 -
      Math.abs(resource1.technicalComplexity - resource2.technicalComplexity) /
        100;
    const prioritySimilarity =
      resource1.priority === resource2.priority ? 1 : 0.5;

    return (
      (businessImpactSimilarity + complexitySimilarity + prioritySimilarity) / 3
    );
  }

  /**
   * Determine dependency type between resources
   * @param dependent - Dependent resource
   * @param dependency - Dependency resource
   * @returns Dependency type
   */
  private determineDependencyType(
    dependent: AllocationCandidate,
    dependency: AllocationCandidate,
  ): 'technical' | 'business' | 'resource' | 'sequence' {
    if (
      dependent.technicalComplexity > 70 &&
      dependency.technicalComplexity > 70
    ) {
      return 'technical';
    } else if (
      Math.abs(dependent.businessImpact - dependency.businessImpact) < 20
    ) {
      return 'business';
    } else if (dependent.priority === dependency.priority) {
      return 'resource';
    } else {
      return 'sequence';
    }
  }

  /**
   * Check if dependency is bidirectional
   * @param resource1 - First resource
   * @param resource2 - Second resource
   * @returns True if bidirectional
   */
  private isBidirectionalDependency(
    resource1: AllocationCandidate,
    resource2: AllocationCandidate,
  ): boolean {
    // Simplified: high business impact resources with similar priorities are likely bidirectional
    return (
      resource1.businessImpact > 70 &&
      resource2.businessImpact > 70 &&
      resource1.priority === resource2.priority
    );
  }

  /**
   * Calculate urgency factor for resource
   * @param candidate - Allocation candidate
   * @returns Urgency factor (0-1, higher = more urgent)
   */
  private calculateUrgencyFactor(candidate: AllocationCandidate): number {
    let urgency = 0.5; // Base urgency

    // Priority affects urgency
    switch (candidate.priority) {
      case 'critical':
        urgency = 1.0;
        break;
      case 'high':
        urgency = 0.8;
        break;
      case 'medium':
        urgency = 0.5;
        break;
      case 'low':
        urgency = 0.3;
        break;
      case 'deferred':
        urgency = 0.1;
        break;
    }

    // High utilization suggests urgency
    if (candidate.costAnalysis.utilizationRate > 0.8) {
      urgency += 0.1;
    }

    // Cost trend affects urgency
    if (candidate.costAnalysis.costTrend === 'increasing') {
      urgency += 0.1;
    }

    return Math.max(0, Math.min(1, urgency));
      default:
        // Handle unexpected values
        break;
  }

  /**
   * Assess business continuity criticality
   * @param candidate - Allocation candidate
   * @returns True if critical for business continuity
   */
  private assessBusinessContinuity(candidate: AllocationCandidate): boolean {
    return candidate.priority === 'critical' && candidate.businessImpact > 80;
  }

  /**
   * Calculate competitive impact score
   * @param candidate - Allocation candidate
   * @returns Competitive impact score (0-1)
   */
  private calculateCompetitiveImpact(candidate: AllocationCandidate): number {
    const businessImpact = candidate.businessImpact / 100;
    const roi = Math.min(1, candidate.costAnalysis.roi / 5); // Normalize ROI

    // High business impact with good ROI suggests competitive advantage
    return businessImpact * 0.7 + roi * 0.3;
  }

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
  private calculateOverallPriorityScore(
    baseWeight: number,
    businessImpact: number,
    strategicScore: number,
    urgencyFactor: number,
    continuityCritical: boolean,
    competitiveImpact: number,
  ): number {
    let score = baseWeight * 0.4; // 40% base priority
    score += businessImpact * 0.25; // 25% business impact
    score += strategicScore * 0.15; // 15% strategic importance
    score += urgencyFactor * 0.1; // 10% urgency
    score += competitiveImpact * 0.1; // 10% competitive impact

    // Business continuity critical resources get a boost
    if (continuityCritical) {
      score += 0.2;
    }

    return Math.max(0, Math.min(2, score)); // Cap at 2x base weight
  }

  /**
   * Calculate allocation multiplier based on priority score
   * @param priorityScore - Overall priority score
   * @returns Allocation multiplier
   */
  private calculateAllocationMultiplier(priorityScore: number): number {
    // Convert priority score to allocation multiplier
    return Math.max(0.5, Math.min(2.0, priorityScore * 1.2));
  }

  /**
   * Estimate implementation time for resource
   * @param candidate - Allocation candidate
   * @returns Implementation time in days
   */
  private estimateImplementationTime(candidate: AllocationCandidate): number {
    const complexityDays = (candidate.technicalComplexity / 100) * 60; // Up to 60 days
    const priorityReduction = this.priorityWeights[candidate.priority] * 20; // Up to 20 days reduction

    return Math.max(1, 30 + complexityDays - priorityReduction);
  }

  /**
   * Assess risk of delaying resource allocation
   * @param candidate - Allocation candidate
   * @returns Delay risk assessment
   */
  private assessDelayRisk(candidate: AllocationCandidate): DelayRisk {
    const urgency = this.calculateUrgencyFactor(candidate);
    const businessImpact = candidate.businessImpact / 100;

    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
    if (urgency > 0.8 && businessImpact > 0.7) {
      riskLevel = 'critical';
    } else if (urgency > 0.6 && businessImpact > 0.5) {
      riskLevel = 'high';
    } else if (urgency > 0.4) {
      riskLevel = 'medium';
    }

    return {
      level: riskLevel,
      impactOnBusiness: businessImpact,
      impactOnDependencies: this.calculateDependencyImpact(candidate),
    };
  }

  /**
   * Calculate impact on dependent resources
   * @param candidate - Allocation candidate
   * @returns Dependency impact score (0-1)
   */
  private calculateDependencyImpact(candidate: AllocationCandidate): number {
    // This would be calculated based on actual dependencies
    // For now, use business impact as a proxy
    return candidate.businessImpact / 100;
  }

  /**
   * Calculate priority-based allocation distribution
   * @param candidates - Allocation candidates
   * @returns Priority-based distribution
   */
  private calculatePriorityDistribution(
    candidates: AllocationCandidate[],
  ): Map<string, number> {
    const distribution = new Map<string, number>();
    const totalBudget = this.calculateTotalCurrentBudget(candidates);

    // Calculate total weighted priority score
    const totalWeightedScore = candidates.reduce((sum, candidate) => {
      const analysis = this.priorityAnalysis.get(candidate.resourceId)!;
      return sum + analysis.overallPriorityScore;
    }, 0);

    // Distribute budget proportionally based on priority scores
    let allocatedBudget = 0;

    for (const candidate of candidates) {
      const analysis = this.priorityAnalysis.get(candidate.resourceId)!;
      const priorityRatio = analysis.overallPriorityScore / totalWeightedScore;

      // Calculate base allocation based on priority
      let priorityAllocation = totalBudget * priorityRatio;

      // Apply allocation multiplier
      priorityAllocation *= analysis.allocationMultiplier;

      // Ensure constraints are met
      priorityAllocation = Math.max(
        candidate.constraints.minAllocation,
        Math.min(candidate.constraints.maxAllocation, priorityAllocation),
      );

      distribution.set(candidate.resourceId, priorityAllocation);
      allocatedBudget += priorityAllocation;
    }

    // Adjust for budget balance
    if (allocatedBudget !== totalBudget) {
      this.adjustForBudgetBalance(
        candidates,
        distribution,
        totalBudget,
        allocatedBudget,
      );
    }

    return distribution;
  }

  /**
   * Adjust distribution for budget balance
   * @param candidates - Allocation candidates
   * @param distribution - Current distribution
   * @param totalBudget - Target total budget
   * @param allocatedBudget - Currently allocated budget
   */
  private adjustForBudgetBalance(
    candidates: AllocationCandidate[],
    distribution: Map<string, number>,
    totalBudget: number,
    allocatedBudget: number,
  ): void {
    const difference = totalBudget - allocatedBudget;

    if (Math.abs(difference) < totalBudget * 0.001) {
      return; // Within tolerance
    }

    // Distribute the difference proportionally among candidates that can accommodate it
    const adjustableCandidates = candidates.filter((candidate) => {
      const currentAllocation = distribution.get(candidate.resourceId) || 0;
      const analysis = this.priorityAnalysis.get(candidate.resourceId)!;

      if (difference > 0) {
        // Can we increase allocation?
        return (
          currentAllocation < candidate.constraints.maxAllocation &&
          analysis.overallPriorityScore > 0.3
        ); // Only for reasonably high priority
      } else {
        // Can we decrease allocation?
        return currentAllocation > candidate.constraints.minAllocation;
      }
    });

    if (adjustableCandidates.length === 0) {
      return; // No candidates can be adjusted
    }

    const adjustmentPerCandidate = difference / adjustableCandidates.length;

    for (const candidate of adjustableCandidates) {
      const currentAllocation = distribution.get(candidate.resourceId) || 0;
      const newAllocation = Math.max(
        candidate.constraints.minAllocation,
        Math.min(
          candidate.constraints.maxAllocation,
          currentAllocation + adjustmentPerCandidate,
        ),
      );

      distribution.set(candidate.resourceId, newAllocation);
    }
  }

  /**
   * Generate priority-based recommendations
   * @param candidates - Original candidates
   * @param distribution - Priority-based distribution
   * @returns Array of recommendations
   */
  private generatePriorityRecommendations(
    candidates: AllocationCandidate[],
    distribution: Map<string, number>,
  ): AllocationRecommendation[] {
    const recommendations: AllocationRecommendation[] = [];

    for (const candidate of candidates) {
      const analysis = this.priorityAnalysis.get(candidate.resourceId)!;
      const recommendedAllocation =
        distribution.get(candidate.resourceId) || candidate.currentAllocation;
      const allocationChange =
        recommendedAllocation - candidate.currentAllocation;

      const recommendation: AllocationRecommendation = {
        id: `priority_${candidate.resourceId}_${Date.now()}`,
        resourceId: candidate.resourceId,
        type: 'budget_reallocation',
        title: `Priority-based allocation for ${candidate.resourceName}`,
        description: this.generatePriorityRecommendationDescription(
          candidate,
          analysis,
          allocationChange,
        ),
        currentAllocation: candidate.currentAllocation,
        recommendedAllocation,
        allocationChange,
        potentialSavings: Math.max(0, -allocationChange),
        savingsPercentage:
          candidate.currentAllocation > 0
            ? (Math.max(0, -allocationChange) / candidate.currentAllocation) *
              100
            : 0,
        implementationComplexity: this.determinePriorityComplexity(
          candidate,
          analysis,
        ),
        strategy: 'priority_weighted',
        confidence: this.calculatePriorityConfidence(candidate, analysis),
        expectedImpact: this.calculatePriorityExpectedImpact(
          candidate,
          analysis,
          allocationChange,
        ),
        riskAssessment: this.assessPriorityRisk(
          candidate,
          analysis,
          allocationChange,
        ),
        dependencies: analysis.dependencies.map(
          (dep) => dep.dependentResourceId,
        ),
        priority: candidate.priority,
        estimatedTimeToImplement: `${Math.ceil(analysis.timeToImplement / 7)} weeks`,
        category: 'priority_optimization',
        tags: ['priority-based', 'strategic', 'business-aligned'],
      };

      recommendations.push(recommendation);
    }

    return recommendations;
  }

  /**
   * Generate description for priority recommendation
   * @param candidate - Allocation candidate
   * @param analysis - Priority analysis
   * @param allocationChange - Allocation change amount
   * @returns Description text
   */
  private generatePriorityRecommendationDescription(
    candidate: AllocationCandidate,
    analysis: PriorityAnalysis,
    allocationChange: number,
  ): string {
    const changeDirection =
      allocationChange > 0
        ? 'increase'
        : allocationChange < 0
          ? 'decrease'
          : 'maintain';
    const priorityScore = Math.round(analysis.overallPriorityScore * 100) / 100;

    let description = `${changeDirection} allocation based on priority analysis. `;
    description += `Priority: ${candidate.priority.toUpperCase()}, Score: ${priorityScore}. `;

    if (analysis.continuityCritical) {
      description += 'Critical for business continuity. ';
    }

    if (analysis.dependencyCount > 0) {
      description += `Has ${analysis.dependencyCount} resource dependencies. `;
    }

    if (analysis.urgencyFactor > 0.7) {
      description += 'High urgency factor. ';
    }

    if (
      analysis.riskOfDelaying.level === 'critical' ||
      analysis.riskOfDelaying.level === 'high'
    ) {
      description += `${analysis.riskOfDelaying.level.toUpperCase()} risk if delayed. `;
    }

    description += `Strategic score: ${Math.round(analysis.strategicScore * 100)}%.`;

    return description;
  }

  /**
   * Determine implementation complexity for priority optimization
   * @param candidate - Allocation candidate
   * @param analysis - Priority analysis
   * @returns Implementation complexity
   */
  private determinePriorityComplexity(
    candidate: AllocationCandidate,
    analysis: PriorityAnalysis,
  ): 'low' | 'medium' | 'high' {
    if (analysis.dependencyCount > 3) return 'high';
    if (candidate.technicalComplexity > 70) return 'high';
    if (analysis.dependencyCount > 1 || candidate.technicalComplexity > 40)
      return 'medium';
    return 'low';
  }

  /**
   * Calculate confidence for priority recommendation
   * @param candidate - Allocation candidate
   * @param analysis - Priority analysis
   * @returns Confidence score (0-100)
   */
  private calculatePriorityConfidence(
    candidate: AllocationCandidate,
    analysis: PriorityAnalysis,
  ): number {
    let confidence = 70; // Base confidence

    // Higher confidence for clear priorities
    if (candidate.priority === 'critical') {
      confidence += 20;
    } else if (candidate.priority === 'high') {
      confidence += 15;
    } else if (candidate.priority === 'deferred') {
      confidence -= 10;
    }

    // Higher confidence for high strategic score
    confidence += analysis.strategicScore * 15;

    // Lower confidence for high dependency count
    confidence -= Math.min(15, analysis.dependencyCount * 3);

    return Math.max(50, Math.min(95, confidence));
  }

  /**
   * Calculate expected impact from priority optimization
   * @param candidate - Allocation candidate
   * @param analysis - Priority analysis
   * @param allocationChange - Allocation change amount
   * @returns Expected impact metrics
   */
  private calculatePriorityExpectedImpact(
    candidate: AllocationCandidate,
    analysis: PriorityAnalysis,
    allocationChange: number,
  ): AllocationImpact {
    const changeRatio =
      candidate.currentAllocation > 0
        ? allocationChange / candidate.currentAllocation
        : 0;

    const priorityMultiplier = this.priorityWeights[candidate.priority];

    return {
      costImpact: allocationChange,
      performanceImpact: Math.max(0, changeRatio * priorityMultiplier * 25),
      utilizationImpact: changeRatio * 0.2,
      businessValueImpact:
        changeRatio * candidate.businessImpact * priorityMultiplier * 0.1,
      roiImpact:
        changeRatio * candidate.costAnalysis.roi * priorityMultiplier * 0.15,
      impactTimeline:
        candidate.priority === 'critical'
          ? 'immediate'
          : candidate.priority === 'high'
            ? 'short_term'
            : 'medium_term',
    };
  }

  /**
   * Assess risk for priority optimization
   * @param candidate - Allocation candidate
   * @param analysis - Priority analysis
   * @param allocationChange - Allocation change amount
   * @returns Risk assessment
   */
  private assessPriorityRisk(
    candidate: AllocationCandidate,
    analysis: PriorityAnalysis,
    allocationChange: number,
  ): RiskAssessment {
    const changeRatio =
      Math.abs(allocationChange) / candidate.currentAllocation;
    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
    const riskFactors: string[] = [];
    const mitigationStrategies: string[] = [];

    // Risk from allocation change magnitude
    if (changeRatio > 0.5) {
      riskLevel = 'high';
      riskFactors.push('Large allocation change may disrupt operations');
      mitigationStrategies.push('Implement change in phases');
    } else if (changeRatio > 0.25) {
      riskLevel = 'medium';
      riskFactors.push('Moderate allocation change requires monitoring');
      mitigationStrategies.push('Monitor performance metrics closely');
    }

    // Risk from dependencies
    if (analysis.dependencyCount > 2) {
      riskLevel = riskLevel === 'low' ? 'medium' : 'high';
      riskFactors.push(
        `High dependency count (${analysis.dependencyCount}) increases complexity`,
      );
      mitigationStrategies.push('Coordinate changes with dependent resources');
    }

    // Risk from reducing critical resource allocation
    if (candidate.priority === 'critical' && allocationChange < 0) {
      riskLevel = 'critical';
      riskFactors.push('Reducing allocation for critical business resource');
      mitigationStrategies.push(
        'Ensure business continuity plans are in place',
      );
    }

    // Delay risk consideration
    if (analysis.riskOfDelaying.level === 'critical') {
      riskFactors.push('Critical risk if implementation is delayed');
      mitigationStrategies.push('Prioritize immediate implementation');
    }

    if (riskFactors.length === 0) {
      riskFactors.push('Standard priority-based allocation adjustment');
      mitigationStrategies.push('Regular priority alignment reviews');
    }

    return {
      riskLevel,
      riskFactors,
      mitigationStrategies,
      maxNegativeImpact:
        Math.abs(allocationChange) * analysis.riskOfDelaying.impactOnBusiness,
      negativeProbability:
        riskLevel === 'critical'
          ? 40
          : riskLevel === 'high'
            ? 25
            : riskLevel === 'medium'
              ? 15
              : 5,
    };
  }

  /**
   * Balance priority allocations within constraints
   * @param originalCandidates - Original candidates
   * @param recommendations - Initial recommendations
   * @returns Balanced recommendations
   */
  private balancePriorityAllocations(
    originalCandidates: AllocationCandidate[],
    recommendations: AllocationRecommendation[],
  ): AllocationRecommendation[] {
    return this.ensureBudgetBalance(originalCandidates, recommendations);
  }

  /**
   * Count resources by priority level
   * @param candidates - Allocation candidates
   * @param priority - Priority level to count
   * @returns Count of resources at priority level
   */
  private countResourcesByPriority(
    candidates: AllocationCandidate[],
    priority: AllocationPriority,
  ): number {
    return candidates.filter((c) => c.priority === priority).length;
  }

  /**
   * Calculate total priority score across all candidates
   * @param candidates - Allocation candidates
   * @returns Total priority score
   */
  private calculateTotalPriorityScore(
    candidates: AllocationCandidate[],
  ): number {
    return candidates.reduce((total, candidate) => {
      const analysis = this.priorityAnalysis.get(candidate.resourceId);
      return total + (analysis ? analysis.overallPriorityScore : 0);
    }, 0);
  }

  /**
   * Find candidate by resource ID (implementation for base class)
   * @param resourceId - Resource identifier
   * @returns Matching candidate or undefined
   */
  protected findCandidateById(
    resourceId: string,
  ): AllocationCandidate | undefined {
    return this.candidatesMap.get(resourceId);
  }
}

/**
 * Internal priority analysis structure
 */
interface PriorityAnalysis {
  resourceId: string;
  basePriority: AllocationPriority;
  baseWeight: number;
  strategicScore: number;
  urgencyFactor: number;
  continuityCritical: boolean;
  competitiveImpact: number;
  overallPriorityScore: number;
  dependencies: ResourceDependency[];
  dependencyCount: number;
  allocationMultiplier: number;
  timeToImplement: number;
  riskOfDelaying: DelayRisk;
}

/**
 * Resource dependency structure
 */
interface ResourceDependency {
  dependentResourceId: string;
  dependencyType: 'technical' | 'business' | 'resource' | 'sequence';
  strength: number;
  bidirectional: boolean;
}

/**
 * Delay risk assessment structure
 */
interface DelayRisk {
  level: 'low' | 'medium' | 'high' | 'critical';
  impactOnBusiness: number;
  impactOnDependencies: number;
}

/**
 * Create priority-based allocation algorithm instance
 * @param config - Algorithm configuration
 * @param logger - Logger instance
 * @returns PriorityBasedAlgorithm instance
 */
export function createPriorityBasedAlgorithm(
  config: AllocationAlgorithmConfig,
  logger: AllocationLogger,
): PriorityBasedAlgorithm {
  return new PriorityBasedAlgorithm(config, logger);
}
