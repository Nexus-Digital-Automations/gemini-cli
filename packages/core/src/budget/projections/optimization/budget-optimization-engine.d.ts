/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type {
  CostDataPoint,
  OptimizationRecommendation,
  CostProjection,
  BurnRateAnalysis,
  TrendAnalysis,
  VarianceDetection,
} from '../types.js';
/**
 * Budget allocation strategy
 */
export interface BudgetAllocationStrategy {
  strategyId: string;
  name: string;
  description: string;
  allocations: Array<{
    category: string;
    currentAllocation: number;
    recommendedAllocation: number;
    rationale: string;
  }>;
  expectedSavings: number;
  implementationComplexity: 'low' | 'medium' | 'high';
  riskLevel: 'low' | 'medium' | 'high';
}
/**
 * Cost optimization opportunity
 */
export interface OptimizationOpportunity {
  id: string;
  title: string;
  category: 'immediate' | 'short_term' | 'long_term' | 'strategic';
  description: string;
  potentialSavings: {
    amount: number;
    percentage: number;
    timeframe: 'daily' | 'weekly' | 'monthly' | 'annually';
  };
  implementation: {
    effort: 'low' | 'medium' | 'high';
    timeToImplement: number;
    dependencies: string[];
    risks: string[];
  };
  measurability: {
    kpis: string[];
    successMetrics: string[];
    monitoringPeriod: number;
  };
}
/**
 * Advanced budget optimization engine for intelligent cost management and allocation
 * Provides AI-driven recommendations for cost reduction and budget optimization
 */
export declare class BudgetOptimizationEngine {
  private static readonly logger;
  /**
   * Generate comprehensive optimization recommendations
   */
  static generateOptimizationPlan(
    costData: CostDataPoint[],
    currentBudget: {
      total: number;
      used: number;
      remaining: number;
    },
    projection: CostProjection,
    burnRate: BurnRateAnalysis,
    trend: TrendAnalysis,
    variance: VarianceDetection,
    targetSavings?: number,
  ): Promise<{
    recommendations: OptimizationRecommendation[];
    opportunities: OptimizationOpportunity[];
    allocationStrategies: BudgetAllocationStrategy[];
    summary: {
      totalPotentialSavings: number;
      implementationScore: number;
      prioritizedActions: string[];
    };
  }>;
  /**
   * Analyze cost efficiency across different categories
   */
  static analyzeCostEfficiency(
    costData: CostDataPoint[],
    burnRate: BurnRateAnalysis,
  ): {
    efficiency: Array<{
      category: string;
      efficiency: number;
      costPerUnit: number;
      utilizationRate: number;
      optimizationPotential: number;
    }>;
    overallEfficiency: number;
    recommendations: string[];
  };
  /**
   * Create scenario-based optimization plans
   */
  static createOptimizationScenarios(
    costData: CostDataPoint[],
    currentBudget: {
      total: number;
      used: number;
      remaining: number;
    },
    projection: CostProjection,
  ): Array<{
    scenario: string;
    description: string;
    targetReduction: number;
    actions: OptimizationRecommendation[];
    expectedOutcome: {
      costReduction: number;
      budgetExtension: number;
      riskLevel: 'low' | 'medium' | 'high';
      implementationTime: number;
    };
  }>;
  private static generateDetailedRecommendations;
  private static identifyOptimizationOpportunities;
  private static createAllocationStrategies;
  private static calculateImplementationScore;
  private static prioritizeActions;
  private static createConservativeActions;
  private static createModerateActions;
  private static createAggressiveActions;
  private static calculateUtilizationRate;
  private static calculateOptimizationPotential;
  private static calculateEfficiencyScore;
}
