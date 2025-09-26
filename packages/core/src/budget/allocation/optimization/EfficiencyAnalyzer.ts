/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { AllocationCandidate } from '../types.js';
import { getLogger } from '../../../utils/logger.js';

export interface EfficiencyMetrics {
  resourceUtilization: number;
  costEffectiveness: number;
  timeToValue: number;
  scalabilityFactor: number;
  riskAdjustedReturn: number;
}

export interface EfficiencyAnalysisResult {
  candidate: AllocationCandidate;
  metrics: EfficiencyMetrics;
  overallScore: number;
  recommendations: string[];
  confidence: number;
}

/**
 * Analyzes allocation efficiency and optimization opportunities
 */
export class EfficiencyAnalyzer {
  private readonly logger = getLogger().child({
    component: 'EfficiencyAnalyzer',
  });

  /**
   * Performs comprehensive efficiency analysis on allocation candidates
   */
  async analyzeEfficiency(
    candidates: AllocationCandidate[],
  ): Promise<EfficiencyAnalysisResult[]> {
    this.logger.info('Starting efficiency analysis', {
      candidateCount: candidates.length,
    });

    const results: EfficiencyAnalysisResult[] = [];

    for (const candidate of candidates) {
      const metrics = await this.calculateEfficiencyMetrics(candidate);
      const overallScore = this.computeOverallScore(metrics);
      const recommendations = this.generateRecommendations(candidate, metrics);
      const confidence = this.calculateConfidence(candidate, metrics);

      results.push({
        candidate,
        metrics,
        overallScore,
        recommendations,
        confidence,
      });
    }

    return results.sort((a, b) => b.overallScore - a.overallScore);
  }

  /**
   * Calculates detailed efficiency metrics for a candidate
   */
  private async calculateEfficiencyMetrics(
    candidate: AllocationCandidate,
  ): Promise<EfficiencyMetrics> {
    const resourceUtilization = this.calculateResourceUtilization(candidate);
    const costEffectiveness = this.calculateCostEffectiveness(candidate);
    const timeToValue = this.calculateTimeToValue(candidate);
    const scalabilityFactor = this.calculateScalabilityFactor(candidate);
    const riskAdjustedReturn = this.calculateRiskAdjustedReturn(candidate);

    return {
      resourceUtilization,
      costEffectiveness,
      timeToValue,
      scalabilityFactor,
      riskAdjustedReturn,
    };
  }

  /**
   * Calculates resource utilization efficiency
   */
  private calculateResourceUtilization(candidate: AllocationCandidate): number {
    const currentAllocation = candidate.currentAllocation;
    let utilization = 0.7; // Base utilization

    // Analyze allocation patterns based on current allocation and projected usage
    if (currentAllocation > 0 && candidate.projectedUsage > 0) {
      const intensity = candidate.projectedUsage / currentAllocation;
      utilization = Math.min(intensity * 0.1 + 0.6, 1.0);
    }

    // Adjust for resource complexity and business impact
    const complexityFactor = candidate.technicalComplexity / 100;
    const impactFactor = candidate.businessImpact / 100;
    utilization =
      utilization * (0.7 + impactFactor * 0.3) * (1.1 - complexityFactor * 0.1);

    return Math.max(0, Math.min(utilization, 1));
  }

  /**
   * Calculates cost effectiveness score
   */
  private calculateCostEffectiveness(candidate: AllocationCandidate): number {
    const currentAllocation = candidate.currentAllocation;
    let effectiveness = 0.6; // Base effectiveness

    // Calculate cost per unit value
    if (currentAllocation > 0) {
      // Convert priority to numeric value for calculation
      const priorityValue = this.getPriorityValue(candidate.priority);
      const valueRatio = (priorityValue * 100) / currentAllocation;
      effectiveness = Math.min(valueRatio * 0.01 + 0.3, 1.0);
    }

    // Adjust for business impact and priority
    const businessImpactFactor = candidate.businessImpact / 100;
    effectiveness = effectiveness * (0.8 + businessImpactFactor * 0.4);

    return Math.max(0, Math.min(effectiveness, 1));
  }

  /**
   * Calculates time to value metric
   */
  private calculateTimeToValue(candidate: AllocationCandidate): number {
    const projectedUsage = candidate.projectedUsage;
    let timeScore = 0.5; // Base time score

    // Higher projected usage indicates faster time to value
    if (projectedUsage > 0) {
      timeScore = Math.min(1.0, projectedUsage * 0.01 + 0.2);
    }

    // Adjust based on business priority
    const priorityMultiplier = this.getPriorityTimeMultiplier(
      candidate.priority,
    );
    timeScore *= priorityMultiplier;

    return Math.max(0, Math.min(timeScore, 1));
  }

  /**
   * Calculates scalability factor
   */
  private calculateScalabilityFactor(candidate: AllocationCandidate): number {
    let scalability = 0.5; // Base scalability

    // Analyze scalability based on business impact and technical complexity
    const businessImpactFactor = candidate.businessImpact / 100;
    const complexityFactor = candidate.technicalComplexity / 100;

    // Higher business impact suggests better scalability potential
    scalability = scalability + businessImpactFactor * 0.3;

    // Lower complexity suggests easier scalability
    scalability = scalability + (1 - complexityFactor) * 0.2;

    return Math.max(0, Math.min(scalability, 1));
  }

  /**
   * Calculates risk-adjusted return
   */
  private calculateRiskAdjustedReturn(candidate: AllocationCandidate): number {
    // Base on priority as numeric value
    let riskReturn = this.getPriorityValue(candidate.priority) / 100;

    // Adjust based on business impact and technical complexity
    const businessImpactFactor = candidate.businessImpact / 100;
    const complexityRisk = candidate.technicalComplexity / 100;

    // Higher business impact increases return, higher complexity increases risk
    riskReturn =
      riskReturn * businessImpactFactor * (1.2 - complexityRisk * 0.2);

    return Math.max(0, Math.min(riskReturn, 1));
  }

  /**
   * Computes overall efficiency score from metrics
   */
  private computeOverallScore(metrics: EfficiencyMetrics): number {
    const weights = {
      resourceUtilization: 0.25,
      costEffectiveness: 0.25,
      timeToValue: 0.2,
      scalabilityFactor: 0.15,
      riskAdjustedReturn: 0.15,
    };

    const weightedScore =
      metrics.resourceUtilization * weights.resourceUtilization +
      metrics.costEffectiveness * weights.costEffectiveness +
      metrics.timeToValue * weights.timeToValue +
      metrics.scalabilityFactor * weights.scalabilityFactor +
      metrics.riskAdjustedReturn * weights.riskAdjustedReturn;

    return Math.max(0, Math.min(weightedScore, 1));
  }

  /**
   * Generates optimization recommendations
   */
  private generateRecommendations(
    candidate: AllocationCandidate,
    metrics: EfficiencyMetrics,
  ): string[] {
    const recommendations: string[] = [];

    if (metrics.resourceUtilization < 0.6) {
      recommendations.push('Consider optimizing resource utilization');
    }

    if (metrics.costEffectiveness < 0.5) {
      recommendations.push(
        'Review cost-benefit ratio and consider alternatives',
      );
    }

    if (metrics.timeToValue < 0.4) {
      recommendations.push('Accelerate implementation timeline');
    }

    if (metrics.scalabilityFactor < 0.6) {
      recommendations.push('Enhance scalability design');
    }

    if (metrics.riskAdjustedReturn < 0.5) {
      recommendations.push('Implement risk mitigation strategies');
    }

    return recommendations;
  }

  /**
   * Calculates confidence level for the analysis
   */
  private calculateConfidence(
    candidate: AllocationCandidate,
    metrics: EfficiencyMetrics,
  ): number {
    let confidence = 0.8; // Base confidence

    // Reduce confidence for incomplete data
    if (candidate.businessImpact <= 0) confidence *= 0.9;
    if (candidate.technicalComplexity <= 0) confidence *= 0.95;
    if (candidate.projectedUsage <= 0) confidence *= 0.9;

    // Increase confidence for comprehensive metrics
    const metricsCount = Object.values(metrics).filter((v) => v > 0).length;
    confidence *= (metricsCount / 5) * 0.2 + 0.8;

    return Math.max(0.3, Math.min(confidence, 1.0));
  }

  /**
   * Converts priority enum to numeric value for calculations
   */
  private getPriorityValue(priority: string): number {
    switch (priority) {
      case 'critical':
        return 100;
      case 'high':
        return 80;
      case 'medium':
        return 60;
      case 'low':
        return 40;
      case 'deferred':
        return 20;
      default:
        return 60; // Default to medium
    }
  }

  /**
   * Gets time multiplier based on priority level
   */
  private getPriorityTimeMultiplier(priority: string): number {
    switch (priority) {
      case 'critical':
        return 1.5;
      case 'high':
        return 1.3;
      case 'medium':
        return 1.0;
      case 'low':
        return 0.8;
      case 'deferred':
        return 0.6;
      default:
        return 1.0;
    }
  }
}
