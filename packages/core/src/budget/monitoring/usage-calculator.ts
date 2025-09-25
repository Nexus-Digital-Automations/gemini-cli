/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Advanced token usage calculation and cost computation engine
 * Provides precise cost calculations based on model pricing, token counts, and usage patterns
 *
 * @author Claude Code - Real-Time Token Usage Monitoring Agent
 * @version 1.0.0
 */

import { getComponentLogger } from '../../utils/logger.js';
import type {
  CostCalculationParams,
  BudgetCalculationContext,
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
 * Cached cost calculation result
 */
interface CachedCostResult {
  cost: number;
  breakdown: CostBreakdown;
  timestamp: number;
  ttl: number;
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
export class UsageCalculator {
  private readonly logger = getComponentLogger('UsageCalculator');
  private readonly config: Required<UsageCalculatorConfig>;
  private readonly costCache = new Map<string, CachedCostResult>();
  private readonly modelPricing = new Map<string, ModelPricing>();

  constructor(config: UsageCalculatorConfig = {}) {
    this.config = {
      defaultPricing: config.defaultPricing ?? this.getDefaultPricing(),
      customPricing: config.customPricing ?? {},
      enableCaching: config.enableCaching ?? true,
      cacheTtl: config.cacheTtl ?? 5 * 60 * 1000, // 5 minutes
      enableDetailedBreakdown: config.enableDetailedBreakdown ?? true,
      currency: config.currency ?? 'USD',
    };

    this.initializePricingData();

    this.logger.info('UsageCalculator initialized', {
      enableCaching: this.config.enableCaching,
      cacheTtl: this.config.cacheTtl,
      currency: this.config.currency,
      modelCount: this.modelPricing.size,
    });
  }

  /**
   * Calculate cost for a given set of parameters
   */
  async calculateCost(params: CostCalculationParams): Promise<number> {
    const breakdown = await this.calculateCostWithBreakdown(params);
    return breakdown.totalCost;
  }

  /**
   * Calculate cost with detailed breakdown
   */
  async calculateCostWithBreakdown(params: CostCalculationParams): Promise<CostBreakdown> {
    // Create cache key if caching is enabled
    let cacheKey = '';
    if (this.config.enableCaching) {
      cacheKey = this.createCacheKey(params);
      const cached = this.getCachedResult(cacheKey);
      if (cached) {
        return cached.breakdown;
      }
    }

    try {
      const pricing = this.getModelPricing(params.model);
      const inputCostPerToken = pricing.inputCostPer1k / 1000;
      const outputCostPerToken = pricing.outputCostPer1k / 1000;

      const inputCost = params.inputTokens * inputCostPerToken;
      const outputCost = params.outputTokens * outputCostPerToken;
      let totalCost = inputCost + outputCost;

      // Apply minimum cost if specified
      let minimumCostApplied = false;
      if (pricing.minimumCost && totalCost < pricing.minimumCost) {
        totalCost = pricing.minimumCost;
        minimumCostApplied = true;
      }

      const breakdown: CostBreakdown = {
        totalCost,
        inputCost,
        outputCost,
        inputTokens: params.inputTokens,
        outputTokens: params.outputTokens,
        model: params.model,
        inputCostPerToken,
        outputCostPerToken,
        minimumCostApplied,
        currency: this.config.currency,
        timestamp: params.timestamp,
      };

      // Cache result if caching is enabled
      if (this.config.enableCaching && cacheKey) {
        this.setCachedResult(cacheKey, {
          cost: totalCost,
          breakdown,
          timestamp: Date.now(),
          ttl: this.config.cacheTtl,
        });
      }

      this.logger.debug('Cost calculated', {
        model: params.model,
        inputTokens: params.inputTokens,
        outputTokens: params.outputTokens,
        totalCost,
        inputCost,
        outputCost,
      });

      return breakdown;
    } catch (error) {
      this.logger.error('Failed to calculate cost', {
        model: params.model,
        inputTokens: params.inputTokens,
        outputTokens: params.outputTokens,
        error: error instanceof Error ? error.message : String(error),
      });
      throw new Error(`Cost calculation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Analyze usage costs for optimization
   */
  analyzeUsageCosts(
    tokenUsage: TokenUsageData,
    modelUsage: Record<string, ModelUsageData>,
    featureUsage: Record<string, TokenUsageData>,
    timePeriodHours: number = 24
  ): UsageCostAnalysis {
    const totalCost = tokenUsage.tokenCosts.input + tokenUsage.tokenCosts.output;
    const totalTokens = tokenUsage.totalTokens;
    const totalRequests = Object.values(modelUsage).reduce((sum, usage) => sum + usage.requests, 0);

    // Calculate period costs (extrapolated from current usage)
    const periodCosts = {
      hourly: totalCost / timePeriodHours,
      daily: (totalCost / timePeriodHours) * 24,
      weekly: (totalCost / timePeriodHours) * 24 * 7,
      monthly: (totalCost / timePeriodHours) * 24 * 30,
    };

    // Calculate model costs
    const modelCosts: Record<string, number> = {};
    for (const [model, usage] of Object.entries(modelUsage)) {
      modelCosts[model] = usage.cost;
    }

    // Calculate feature costs
    const featureCosts: Record<string, number> = {};
    for (const [feature, usage] of Object.entries(featureUsage)) {
      featureCosts[feature] = usage.tokenCosts.input + usage.tokenCosts.output;
    }

    // Calculate efficiency metrics
    const efficiency = {
      costPerOutputToken: tokenUsage.outputTokens > 0 ? tokenUsage.tokenCosts.output / tokenUsage.outputTokens : 0,
      inputOutputRatio: tokenUsage.outputTokens > 0 ? tokenUsage.inputTokens / tokenUsage.outputTokens : 0,
      wastedTokenPercentage: this.calculateWastedTokenPercentage(tokenUsage),
    };

    return {
      totalCost,
      periodCosts,
      modelCosts,
      featureCosts,
      avgCostPerRequest: totalRequests > 0 ? totalCost / totalRequests : 0,
      avgCostPerToken: totalTokens > 0 ? totalCost / totalTokens : 0,
      efficiency,
    };
  }

  /**
   * Get cost optimization recommendations
   */
  getCostOptimizationRecommendations(
    analysis: UsageCostAnalysis,
    modelUsage: Record<string, ModelUsageData>
  ): string[] {
    const recommendations: string[] = [];

    // Check for high input/output ratios (potentially inefficient prompts)
    if (analysis.efficiency.inputOutputRatio > 5) {
      recommendations.push(
        'Consider optimizing prompts to reduce input tokens while maintaining output quality'
      );
    }

    // Check for expensive model usage
    const sortedModels = Object.entries(analysis.modelCosts)
      .sort(([, a], [, b]) => b - a);

    if (sortedModels.length > 1) {
      const [topModel, topCost] = sortedModels[0];
      const totalCost = analysis.totalCost;
      if (topCost / totalCost > 0.7) {
        recommendations.push(
          `Consider using less expensive models for tasks currently handled by ${topModel} (${((topCost / totalCost) * 100).toFixed(1)}% of total cost)`
        );
      }
    }

    // Check for features with high cost but low efficiency
    const sortedFeatures = Object.entries(analysis.featureCosts)
      .sort(([, a], [, b]) => b - a);

    if (sortedFeatures.length > 0) {
      const [topFeature, topFeatureCost] = sortedFeatures[0];
      if (topFeatureCost / analysis.totalCost > 0.5) {
        recommendations.push(
          `Review usage patterns for '${topFeature}' feature (${((topFeatureCost / analysis.totalCost) * 100).toFixed(1)}% of total cost)`
        );
      }
    }

    // Check for high request rates with low output
    const avgOutputPerRequest = Object.values(modelUsage)
      .reduce((sum, usage) => sum + usage.outputTokens, 0) /
      Object.values(modelUsage).reduce((sum, usage) => sum + usage.requests, 0);

    if (avgOutputPerRequest < 50) {
      recommendations.push(
        'Low average output per request detected. Consider batching requests or optimizing prompts for more substantial responses'
      );
    }

    // Check for potential waste
    if (analysis.efficiency.wastedTokenPercentage > 10) {
      recommendations.push(
        `High token waste detected (${analysis.efficiency.wastedTokenPercentage.toFixed(1)}%). Review prompt efficiency and response formatting`
      );
    }

    // Budget-based recommendations
    if (analysis.periodCosts.monthly > 100) {
      recommendations.push(
        'Monthly projected cost exceeds $100. Consider implementing usage quotas or optimizing high-cost operations'
      );
    }

    return recommendations;
  }

  /**
   * Estimate cost for planned usage
   */
  estimateCost(
    model: string,
    estimatedInputTokens: number,
    estimatedOutputTokens: number
  ): Promise<CostBreakdown> {
    const params: CostCalculationParams = {
      model,
      inputTokens: estimatedInputTokens,
      outputTokens: estimatedOutputTokens,
      timestamp: new Date(),
    };

    return this.calculateCostWithBreakdown(params);
  }

  /**
   * Update model pricing configuration
   */
  updateModelPricing(model: string, pricing: Omit<ModelPricing, 'model'>): void {
    const modelPricing: ModelPricing = {
      model,
      ...pricing,
    };

    this.modelPricing.set(model, modelPricing);
    this.logger.info('Model pricing updated', { model, pricing: modelPricing });
  }

  /**
   * Get all model pricing configurations
   */
  getAllModelPricing(): Record<string, ModelPricing> {
    const pricing: Record<string, ModelPricing> = {};
    for (const [model, config] of this.modelPricing.entries()) {
      pricing[model] = { ...config };
    }
    return pricing;
  }

  /**
   * Clear cost calculation cache
   */
  clearCache(): void {
    this.costCache.clear();
    this.logger.debug('Cost calculation cache cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; hitRate: number } {
    // This would require tracking hits/misses, simplified for now
    return {
      size: this.costCache.size,
      hitRate: 0, // Would need hit/miss tracking
    };
  }

  /**
   * Initialize default pricing data
   */
  private initializePricingData(): void {
    // Set default pricing
    this.modelPricing.set('default', this.config.defaultPricing);

    // Add standard Gemini model pricing (as of 2025)
    const standardPricing: ModelPricing[] = [
      {
        model: 'gemini-1.5-flash',
        inputCostPer1k: 0.075,
        outputCostPer1k: 0.30,
        tier: 'standard',
      },
      {
        model: 'gemini-1.5-flash-8b',
        inputCostPer1k: 0.0375,
        outputCostPer1k: 0.15,
        tier: 'standard',
      },
      {
        model: 'gemini-1.5-pro',
        inputCostPer1k: 1.25,
        outputCostPer1k: 5.0,
        tier: 'premium',
      },
      {
        model: 'gemini-2.0-flash-exp',
        inputCostPer1k: 0.075,
        outputCostPer1k: 0.30,
        tier: 'standard',
      },
    ];

    // Add standard pricing
    for (const pricing of standardPricing) {
      this.modelPricing.set(pricing.model, pricing);
    }

    // Apply custom pricing overrides
    for (const [model, pricing] of Object.entries(this.config.customPricing)) {
      this.modelPricing.set(model, pricing);
    }

    this.logger.debug('Pricing data initialized', {
      modelCount: this.modelPricing.size,
      models: Array.from(this.modelPricing.keys()),
    });
  }

  /**
   * Get default pricing configuration
   */
  private getDefaultPricing(): ModelPricing {
    return {
      model: 'default',
      inputCostPer1k: 0.1,
      outputCostPer1k: 0.4,
      tier: 'standard',
    };
  }

  /**
   * Get model pricing configuration
   */
  private getModelPricing(model: string): ModelPricing {
    // Try exact match first
    let pricing = this.modelPricing.get(model);
    if (pricing) return pricing;

    // Try partial matches for model families
    for (const [key, config] of this.modelPricing.entries()) {
      if (model.includes(key) || key.includes(model)) {
        pricing = config;
        break;
      }
    }

    // Fallback to default pricing
    if (!pricing) {
      this.logger.warn('Using default pricing for unknown model', { model });
      pricing = this.config.defaultPricing;
    }

    return pricing;
  }

  /**
   * Create cache key for cost calculation
   */
  private createCacheKey(params: CostCalculationParams): string {
    const contextStr = params.context ? JSON.stringify(params.context) : '';
    return `${params.model}:${params.inputTokens}:${params.outputTokens}:${contextStr}`;
  }

  /**
   * Get cached result if valid
   */
  private getCachedResult(cacheKey: string): CachedCostResult | null {
    const cached = this.costCache.get(cacheKey);
    if (!cached) return null;

    const now = Date.now();
    if (now - cached.timestamp > cached.ttl) {
      this.costCache.delete(cacheKey);
      return null;
    }

    return cached;
  }

  /**
   * Set cached result
   */
  private setCachedResult(cacheKey: string, result: CachedCostResult): void {
    this.costCache.set(cacheKey, result);

    // Clean up old cache entries periodically
    if (this.costCache.size > 1000) {
      const now = Date.now();
      for (const [key, cached] of this.costCache.entries()) {
        if (now - cached.timestamp > cached.ttl) {
          this.costCache.delete(key);
        }
      }
    }
  }

  /**
   * Calculate wasted token percentage
   */
  private calculateWastedTokenPercentage(usage: TokenUsageData): number {
    // This is a simplified calculation - could be enhanced with more sophisticated analysis
    // For now, we consider the ratio of input to output tokens as a proxy for efficiency
    if (usage.inputTokens === 0) return 0;

    const inputOutputRatio = usage.inputTokens / Math.max(usage.outputTokens, 1);

    // If input is much higher than output, there might be inefficiency
    if (inputOutputRatio > 10) {
      return Math.min((inputOutputRatio - 2) * 5, 50); // Cap at 50%
    }

    return 0;
  }
}

/**
 * Create a new UsageCalculator instance
 */
export function createUsageCalculator(config?: UsageCalculatorConfig): UsageCalculator {
  return new UsageCalculator(config);
}

/**
 * Singleton instance for global usage calculations
 */
let globalUsageCalculator: UsageCalculator | null = null;

/**
 * Get or create the global usage calculator instance
 */
export function getGlobalUsageCalculator(config?: UsageCalculatorConfig): UsageCalculator {
  if (!globalUsageCalculator) {
    globalUsageCalculator = createUsageCalculator(config);
  }
  return globalUsageCalculator;
}

/**
 * Reset the global usage calculator instance
 */
export function resetGlobalUsageCalculator(): void {
  if (globalUsageCalculator) {
    globalUsageCalculator.clearCache();
    globalUsageCalculator = null;
  }
}