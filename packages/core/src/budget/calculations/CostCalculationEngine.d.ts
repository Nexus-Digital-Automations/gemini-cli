/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type {
  CostCalculationParams,
  TokenUsageData,
  ModelUsageData,
} from '../types.js';
/**
 * Model pricing configuration
 */
export interface ModelPricing {
  /** Model identifier */
  modelId: string;
  /** Display name */
  displayName: string;
  /** Input token cost per 1000 tokens */
  inputCostPer1K: number;
  /** Output token cost per 1000 tokens */
  outputCostPer1K: number;
  /** Minimum charge per request */
  minimumCharge?: number;
  /** Maximum tokens per request */
  maxTokens?: number;
  /** Whether model supports streaming */
  supportsStreaming?: boolean;
  /** Currency */
  currency: string;
  /** Effective date for pricing */
  effectiveDate: Date;
}
/**
 * Cost calculation result
 */
export interface CostCalculationResult {
  /** Total cost in dollars */
  totalCost: number;
  /** Input token cost */
  inputCost: number;
  /** Output token cost */
  outputCost: number;
  /** Model used for calculation */
  model: string;
  /** Input tokens processed */
  inputTokens: number;
  /** Output tokens generated */
  outputTokens: number;
  /** Total tokens */
  totalTokens: number;
  /** Cost per token (average) */
  costPerToken: number;
  /** Currency */
  currency: string;
  /** Calculation metadata */
  metadata?: Record<string, any>;
}
/**
 * Budget usage calculation result
 */
export interface UsageCalculationResult {
  /** Current usage amount */
  currentUsage: number;
  /** Projected usage for period */
  projectedUsage: number;
  /** Usage percentage of limit */
  usagePercentage: number;
  /** Remaining budget */
  remainingBudget: number;
  /** Time period for calculation */
  period: 'daily' | 'weekly' | 'monthly';
  /** Days/hours remaining in period */
  periodRemaining: number;
  /** Average cost per request */
  avgCostPerRequest: number;
  /** Usage trend direction */
  trend: 'increasing' | 'decreasing' | 'stable';
}
/**
 * Cost calculation engine with model pricing and usage analytics
 */
export declare class CostCalculationEngine {
  private readonly logger;
  private readonly modelPricing;
  private readonly calculationHistory;
  private readonly usageHistory;
  /**
   * Create new cost calculation engine
   * @param customPricing - Optional custom model pricing
   */
  constructor(customPricing?: ModelPricing[]);
  /**
   * Calculate cost for token usage
   * @param params - Calculation parameters
   * @returns Cost calculation result
   */
  calculateCost(params: CostCalculationParams): Promise<CostCalculationResult>;
  /**
   * Calculate usage statistics and projections
   * @param currentUsage - Current usage amount
   * @param limit - Budget limit
   * @param period - Time period
   * @param periodElapsed - How much of the period has elapsed (0-1)
   * @returns Usage calculation result
   */
  calculateUsage(
    currentUsage: number,
    limit: number,
    period: 'daily' | 'weekly' | 'monthly',
    periodElapsed: number,
  ): UsageCalculationResult;
  /**
   * Get token usage summary from calculation history
   * @param timeframe - Time range in milliseconds
   * @returns Token usage data
   */
  getTokenUsageSummary(timeframe: number): TokenUsageData;
  /**
   * Get model-specific usage statistics
   * @param timeframe - Time range in milliseconds
   * @returns Model usage breakdown
   */
  getModelUsageBreakdown(timeframe: number): Record<string, ModelUsageData>;
  /**
   * Update model pricing
   * @param pricing - New pricing configuration
   */
  updateModelPricing(pricing: ModelPricing): void;
  /**
   * Get available models and pricing
   * @returns Array of model pricing information
   */
  getModelPricing(): ModelPricing[];
  /**
   * Get calculation statistics
   * @returns Calculation engine statistics
   */
  getStatistics(): {
    totalCalculations: number;
    totalCost: number;
    totalTokens: number;
    averageCostPerCalculation: number;
    modelsUsed: string[];
    calculationHistory: number;
  };
  /**
   * Clear calculation history
   */
  clearHistory(): void;
  /**
   * Get period duration in hours
   * @param period - Time period
   * @returns Hours in period
   */
  private getPeriodHours;
  /**
   * Calculate usage trend based on recent history
   * @param currentUsage - Current usage amount
   * @param period - Time period
   * @returns Usage trend
   */
  private calculateUsageTrend;
}
/**
 * Factory function to create cost calculation engine
 * @param customPricing - Optional custom model pricing
 * @returns New cost calculation engine
 */
export declare function createCostCalculationEngine(
  customPricing?: ModelPricing[],
): CostCalculationEngine;
