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
  model: string;
  /** Cost per 1,000 input tokens in USD */
  inputCostPer1k: number;
  /** Cost per 1,000 output tokens in USD */
  outputCostPer1k: number;
  /** Minimum cost per request in USD */
  minimumCost?: number;
  /** Maximum tokens per request */
  maxTokens?: number;
  /** Model tier (affects pricing) */
  tier?: 'free' | 'standard' | 'premium' | 'enterprise';
}
/**
 * Usage calculation configuration
 */
export interface UsageCalculatorConfig {
  /** Default model pricing if not found */
  defaultPricing?: ModelPricing;
  /** Custom pricing overrides */
  customPricing?: Record<string, ModelPricing>;
  /** Enable cost caching for performance */
  enableCaching?: boolean;
  /** Cache TTL in milliseconds */
  cacheTtl?: number;
  /** Enable detailed cost breakdown */
  enableDetailedBreakdown?: boolean;
  /** Currency for calculations */
  currency?: string;
}
/**
 * Detailed cost breakdown
 */
export interface CostBreakdown {
  /** Total cost */
  totalCost: number;
  /** Input token cost */
  inputCost: number;
  /** Output token cost */
  outputCost: number;
  /** Input tokens */
  inputTokens: number;
  /** Output tokens */
  outputTokens: number;
  /** Model used */
  model: string;
  /** Cost per input token */
  inputCostPerToken: number;
  /** Cost per output token */
  outputCostPerToken: number;
  /** Minimum cost applied */
  minimumCostApplied: boolean;
  /** Currency code */
  currency: string;
  /** Calculation timestamp */
  timestamp: Date;
}
/**
 * Usage statistics for cost analysis
 */
export interface UsageCostAnalysis {
  /** Total cost across all usage */
  totalCost: number;
  /** Cost by time period */
  periodCosts: {
    hourly: number;
    daily: number;
    weekly: number;
    monthly: number;
  };
  /** Cost by model */
  modelCosts: Record<string, number>;
  /** Cost by feature */
  featureCosts: Record<string, number>;
  /** Average cost per request */
  avgCostPerRequest: number;
  /** Average cost per token */
  avgCostPerToken: number;
  /** Cost efficiency metrics */
  efficiency: {
    costPerOutputToken: number;
    inputOutputRatio: number;
    wastedTokenPercentage: number;
  };
}
/**
 * Advanced token usage calculation and cost computation system
 *
 * This class provides comprehensive cost calculation capabilities for Gemini API usage,
 * including support for different model pricing tiers, detailed cost breakdowns,
 * usage pattern analysis, and cost optimization recommendations.
 *
 * Features:
 * - Accurate per-model pricing calculations
 * - Configurable pricing overrides for custom deployments
 * - Cost caching for improved performance
 * - Detailed cost breakdowns and analytics
 * - Usage pattern analysis and optimization suggestions
 * - Support for multiple currencies and pricing tiers
 */
export declare class UsageCalculator {
  private readonly logger;
  private readonly config;
  private readonly costCache;
  private readonly modelPricing;
  constructor(config?: UsageCalculatorConfig);
  /**
   * Calculate cost for a given set of parameters
   */
  calculateCost(params: CostCalculationParams): Promise<number>;
  /**
   * Calculate cost with detailed breakdown
   */
  calculateCostWithBreakdown(
    params: CostCalculationParams,
  ): Promise<CostBreakdown>;
  /**
   * Analyze usage costs for optimization
   */
  analyzeUsageCosts(
    tokenUsage: TokenUsageData,
    modelUsage: Record<string, ModelUsageData>,
    featureUsage: Record<string, TokenUsageData>,
    timePeriodHours?: number,
  ): UsageCostAnalysis;
  /**
   * Get cost optimization recommendations
   */
  getCostOptimizationRecommendations(
    analysis: UsageCostAnalysis,
    modelUsage: Record<string, ModelUsageData>,
  ): string[];
  /**
   * Estimate cost for planned usage
   */
  estimateCost(
    model: string,
    estimatedInputTokens: number,
    estimatedOutputTokens: number,
  ): Promise<CostBreakdown>;
  /**
   * Update model pricing configuration
   */
  updateModelPricing(model: string, pricing: Omit<ModelPricing, 'model'>): void;
  /**
   * Get all model pricing configurations
   */
  getAllModelPricing(): Record<string, ModelPricing>;
  /**
   * Clear cost calculation cache
   */
  clearCache(): void;
  /**
   * Get cache statistics
   */
  getCacheStats(): {
    size: number;
    hitRate: number;
  };
  /**
   * Initialize default pricing data
   */
  private initializePricingData;
  /**
   * Get default pricing configuration
   */
  private getDefaultPricing;
  /**
   * Get model pricing configuration
   */
  private getModelPricing;
  /**
   * Create cache key for cost calculation
   */
  private createCacheKey;
  /**
   * Get cached result if valid
   */
  private getCachedResult;
  /**
   * Set cached result
   */
  private setCachedResult;
  /**
   * Calculate wasted token percentage
   */
  private calculateWastedTokenPercentage;
}
/**
 * Create a new UsageCalculator instance
 */
export declare function createUsageCalculator(
  config?: UsageCalculatorConfig,
): UsageCalculator;
/**
 * Get or create the global usage calculator instance
 */
export declare function getGlobalUsageCalculator(
  config?: UsageCalculatorConfig,
): UsageCalculator;
/**
 * Reset the global usage calculator instance
 */
export declare function resetGlobalUsageCalculator(): void;
