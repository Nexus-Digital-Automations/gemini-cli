/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Budget cost calculation engine
 * Provides accurate cost calculations for different models and usage patterns
 *
 * @author Claude Code - Budget Core Infrastructure Agent
 * @version 1.0.0
 */

import { Logger } from '../../../../../src/utils/logger.js';
import type {
  CostCalculationParams,
  BudgetCalculationContext,
  TokenUsageData,
  ModelUsageData
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
 * Default model pricing (example rates - should be updated with real pricing)
 */
const DEFAULT_MODEL_PRICING: ModelPricing[] = [
  {
    modelId: 'gemini-1.5-flash',
    displayName: 'Gemini 1.5 Flash',
    inputCostPer1K: 0.000075,
    outputCostPer1K: 0.0003,
    maxTokens: 1048576,
    supportsStreaming: true,
    currency: 'USD',
    effectiveDate: new Date('2024-01-01')
  },
  {
    modelId: 'gemini-1.5-pro',
    displayName: 'Gemini 1.5 Pro',
    inputCostPer1K: 0.00125,
    outputCostPer1K: 0.005,
    maxTokens: 2097152,
    supportsStreaming: true,
    currency: 'USD',
    effectiveDate: new Date('2024-01-01')
  },
  {
    modelId: 'gemini-1.0-pro',
    displayName: 'Gemini 1.0 Pro',
    inputCostPer1K: 0.0005,
    outputCostPer1K: 0.0015,
    maxTokens: 30720,
    supportsStreaming: false,
    currency: 'USD',
    effectiveDate: new Date('2024-01-01')
  }
];

/**
 * Cost calculation engine with model pricing and usage analytics
 */
export class CostCalculationEngine {
  private readonly logger: Logger;
  private readonly modelPricing: Map<string, ModelPricing>;
  private readonly calculationHistory: CostCalculationResult[] = [];
  private readonly usageHistory: Map<string, UsageCalculationResult[]> = new Map();

  /**
   * Create new cost calculation engine
   * @param customPricing - Optional custom model pricing
   */
  constructor(customPricing?: ModelPricing[]) {
    this.logger = new Logger('CostCalculationEngine');
    this.modelPricing = new Map();

    // Load default pricing
    for (const pricing of DEFAULT_MODEL_PRICING) {
      this.modelPricing.set(pricing.modelId, pricing);
    }

    // Override with custom pricing if provided
    if (customPricing) {
      for (const pricing of customPricing) {
        this.modelPricing.set(pricing.modelId, pricing);
      }
    }

    this.logger.info('Cost calculation engine initialized', {
      modelsLoaded: this.modelPricing.size,
      hasCustomPricing: !!customPricing
    });
  }

  /**
   * Calculate cost for token usage
   * @param params - Calculation parameters
   * @returns Cost calculation result
   */
  public async calculateCost(params: CostCalculationParams): Promise<CostCalculationResult> {
    const start = Date.now();

    try {
      this.logger.debug('Calculating cost', {
        model: params.model,
        inputTokens: params.inputTokens,
        outputTokens: params.outputTokens
      });

      // Get model pricing
      const pricing = this.modelPricing.get(params.model);
      if (!pricing) {
        throw new Error(`No pricing available for model: ${params.model}`);
      }

      // Calculate input and output costs
      const inputCost = (params.inputTokens / 1000) * pricing.inputCostPer1K;
      const outputCost = (params.outputTokens / 1000) * pricing.outputCostPer1K;
      const totalCost = inputCost + outputCost;

      // Apply minimum charge if configured
      const finalCost = pricing.minimumCharge
        ? Math.max(totalCost, pricing.minimumCharge)
        : totalCost;

      const result: CostCalculationResult = {
        totalCost: finalCost,
        inputCost,
        outputCost,
        model: params.model,
        inputTokens: params.inputTokens,
        outputTokens: params.outputTokens,
        totalTokens: params.inputTokens + params.outputTokens,
        costPerToken: finalCost / (params.inputTokens + params.outputTokens || 1),
        currency: pricing.currency,
        metadata: {
          executionTime: Date.now() - start,
          pricingVersion: pricing.effectiveDate.toISOString(),
          context: params.context
        }
      };

      // Store in calculation history
      this.calculationHistory.push(result);

      // Limit history size
      if (this.calculationHistory.length > 1000) {
        this.calculationHistory.shift();
      }

      this.logger.debug('Cost calculation completed', {
        totalCost: result.totalCost,
        executionTime: Date.now() - start
      });

      return result;

    } catch (error) {
      this.logger.error('Cost calculation failed', {
        error: error as Error,
        params
      });
      throw error;
    }
  }

  /**
   * Calculate usage statistics and projections
   * @param currentUsage - Current usage amount
   * @param limit - Budget limit
   * @param period - Time period
   * @param periodElapsed - How much of the period has elapsed (0-1)
   * @returns Usage calculation result
   */
  public calculateUsage(
    currentUsage: number,
    limit: number,
    period: 'daily' | 'weekly' | 'monthly',
    periodElapsed: number
  ): UsageCalculationResult {
    const start = Date.now();

    try {
      // Calculate basic metrics
      const usagePercentage = (currentUsage / limit) * 100;
      const remainingBudget = Math.max(0, limit - currentUsage);

      // Project usage for full period
      const projectedUsage = periodElapsed > 0
        ? currentUsage / periodElapsed
        : currentUsage;

      // Calculate remaining time in period
      const periodHours = this.getPeriodHours(period);
      const periodRemaining = periodHours * (1 - periodElapsed);

      // Calculate average cost per request (if we have history)
      const recentCalculations = this.calculationHistory.slice(-10);
      const avgCostPerRequest = recentCalculations.length > 0
        ? recentCalculations.reduce((sum, calc) => sum + calc.totalCost, 0) / recentCalculations.length
        : 0;

      // Determine usage trend
      const trend = this.calculateUsageTrend(currentUsage, period);

      const result: UsageCalculationResult = {
        currentUsage,
        projectedUsage,
        usagePercentage,
        remainingBudget,
        period,
        periodRemaining,
        avgCostPerRequest,
        trend
      };

      // Store usage calculation
      if (!this.usageHistory.has(period)) {
        this.usageHistory.set(period, []);
      }
      const periodHistory = this.usageHistory.get(period)!;
      periodHistory.push(result);

      // Limit history size per period
      if (periodHistory.length > 100) {
        periodHistory.shift();
      }

      this.logger.debug('Usage calculation completed', {
        period,
        usagePercentage,
        trend,
        executionTime: Date.now() - start
      });

      return result;

    } catch (error) {
      this.logger.error('Usage calculation failed', error as Error);
      throw error;
    }
  }

  /**
   * Get token usage summary from calculation history
   * @param timeframe - Time range in milliseconds
   * @returns Token usage data
   */
  public getTokenUsageSummary(timeframe: number): TokenUsageData {
    const cutoffTime = Date.now() - timeframe;

    // Filter recent calculations
    const recentCalculations = this.calculationHistory.filter(
      calc => calc.metadata?.timestamp &&
              new Date(calc.metadata.timestamp).getTime() > cutoffTime
    );

    // Aggregate token usage
    const summary = recentCalculations.reduce(
      (acc, calc) => {
        acc.inputTokens += calc.inputTokens;
        acc.outputTokens += calc.outputTokens;
        acc.totalTokens += calc.totalTokens;
        acc.tokenCosts.input += calc.inputCost;
        acc.tokenCosts.output += calc.outputCost;
        return acc;
      },
      {
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
        tokenCosts: { input: 0, output: 0 }
      } as TokenUsageData
    );

    return summary;
  }

  /**
   * Get model-specific usage statistics
   * @param timeframe - Time range in milliseconds
   * @returns Model usage breakdown
   */
  public getModelUsageBreakdown(timeframe: number): Record<string, ModelUsageData> {
    const cutoffTime = Date.now() - timeframe;
    const modelUsage: Record<string, ModelUsageData> = {};

    // Filter and group by model
    const recentCalculations = this.calculationHistory.filter(
      calc => calc.metadata?.timestamp &&
              new Date(calc.metadata.timestamp).getTime() > cutoffTime
    );

    for (const calc of recentCalculations) {
      if (!modelUsage[calc.model]) {
        modelUsage[calc.model] = {
          requests: 0,
          inputTokens: 0,
          outputTokens: 0,
          cost: 0,
          avgResponseTime: 0
        };
      }

      const usage = modelUsage[calc.model];
      usage.requests++;
      usage.inputTokens += calc.inputTokens;
      usage.outputTokens += calc.outputTokens;
      usage.cost += calc.totalCost;

      // Calculate average response time if available
      if (calc.metadata?.executionTime) {
        const totalTime = (usage.avgResponseTime || 0) * (usage.requests - 1);
        usage.avgResponseTime = (totalTime + calc.metadata.executionTime) / usage.requests;
      }
    }

    return modelUsage;
  }

  /**
   * Update model pricing
   * @param pricing - New pricing configuration
   */
  public updateModelPricing(pricing: ModelPricing): void {
    this.modelPricing.set(pricing.modelId, pricing);
    this.logger.info('Updated model pricing', {
      model: pricing.modelId,
      inputCost: pricing.inputCostPer1K,
      outputCost: pricing.outputCostPer1K
    });
  }

  /**
   * Get available models and pricing
   * @returns Array of model pricing information
   */
  public getModelPricing(): ModelPricing[] {
    return Array.from(this.modelPricing.values());
  }

  /**
   * Get calculation statistics
   * @returns Calculation engine statistics
   */
  public getStatistics(): {
    totalCalculations: number;
    totalCost: number;
    totalTokens: number;
    averageCostPerCalculation: number;
    modelsUsed: string[];
    calculationHistory: number;
  } {
    const totalCost = this.calculationHistory.reduce((sum, calc) => sum + calc.totalCost, 0);
    const totalTokens = this.calculationHistory.reduce((sum, calc) => sum + calc.totalTokens, 0);
    const modelsUsed = Array.from(new Set(this.calculationHistory.map(calc => calc.model)));

    return {
      totalCalculations: this.calculationHistory.length,
      totalCost,
      totalTokens,
      averageCostPerCalculation: totalCost / (this.calculationHistory.length || 1),
      modelsUsed,
      calculationHistory: this.calculationHistory.length
    };
  }

  /**
   * Clear calculation history
   */
  public clearHistory(): void {
    this.calculationHistory.length = 0;
    this.usageHistory.clear();
    this.logger.info('Calculation history cleared');
  }

  /**
   * Get period duration in hours
   * @param period - Time period
   * @returns Hours in period
   */
  private getPeriodHours(period: 'daily' | 'weekly' | 'monthly'): number {
    switch (period) {
      case 'daily':
        return 24;
      case 'weekly':
        return 24 * 7;
      case 'monthly':
        return 24 * 30; // Approximate
      default:
        return 24;
    }
  }

  /**
   * Calculate usage trend based on recent history
   * @param currentUsage - Current usage amount
   * @param period - Time period
   * @returns Usage trend
   */
  private calculateUsageTrend(
    currentUsage: number,
    period: 'daily' | 'weekly' | 'monthly'
  ): 'increasing' | 'decreasing' | 'stable' {
    const history = this.usageHistory.get(period);
    if (!history || history.length < 2) {
      return 'stable';
    }

    // Compare with previous calculation
    const previous = history[history.length - 2];
    const change = (currentUsage - previous.currentUsage) / previous.currentUsage;

    if (change > 0.1) return 'increasing';
    if (change < -0.1) return 'decreasing';
    return 'stable';
  }
}

/**
 * Factory function to create cost calculation engine
 * @param customPricing - Optional custom model pricing
 * @returns New cost calculation engine
 */
export function createCostCalculationEngine(customPricing?: ModelPricing[]): CostCalculationEngine {
  return new CostCalculationEngine(customPricing);
}