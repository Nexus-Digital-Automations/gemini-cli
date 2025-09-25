/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Real-time token usage tracking system
 * Provides comprehensive token consumption monitoring and data collection
 *
 * @author Claude Code - Real-Time Token Usage Monitoring Agent
 * @version 1.0.0
 */

import type {
  GenerateContentParameters,
  GenerateContentResponse,
  CountTokensParameters,
  CountTokensResponse,
} from '@google/genai';
import { EventEmitter } from 'node:events';
import { getComponentLogger } from '../../utils/logger.js';
import type {
  TokenUsageData,
  ModelUsageData,
  BudgetEvent,
  BudgetEventType,
  EventSeverity,
  CostCalculationParams,
  BudgetCalculationContext,
} from '../types.js';

/**
 * Token usage tracking event interface
 */
export interface TokenTrackingEvent {
  type:
    | 'request_start'
    | 'request_complete'
    | 'token_count'
    | 'cost_calculated'
    | 'error';
  timestamp: Date;
  requestId: string;
  model?: string;
  feature?: string;
  sessionId?: string;
  data: Record<string, any>;
}

/**
 * Token tracking configuration options
 */
export interface TokenTrackerConfig {
  /** Enable detailed per-request tracking */
  enableDetailedTracking?: boolean;
  /** Enable real-time cost calculations */
  enableRealTimeCosts?: boolean;
  /** Enable performance metrics collection */
  enablePerformanceMetrics?: boolean;
  /** Maximum number of recent requests to keep in memory */
  maxRecentRequests?: number;
  /** Whether to persist tracking data */
  persistData?: boolean;
  /** Custom cost calculation function */
  costCalculator?: (params: CostCalculationParams) => Promise<number>;
}

/**
 * Request tracking metadata
 */
export interface RequestTrackingData {
  requestId: string;
  model: string;
  feature: string;
  sessionId: string;
  startTime: Date;
  endTime?: Date;
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  cost?: number;
  responseTime?: number;
  status: 'pending' | 'completed' | 'error';
  error?: string;
}

/**
 * Token usage statistics for reporting
 */
export interface TokenUsageStats {
  totalRequests: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalTokens: number;
  totalCost: number;
  averageRequestCost: number;
  averageResponseTime: number;
  modelBreakdown: Record<string, ModelUsageData>;
  featureBreakdown: Record<string, TokenUsageData>;
  sessionBreakdown: Record<string, TokenUsageData>;
  recentRequests: RequestTrackingData[];
}

/**
 * Core real-time token usage tracking system
 *
 * This class provides comprehensive token usage monitoring that hooks into
 * the Gemini API request/response lifecycle to track token consumption,
 * calculate costs, and provide real-time analytics.
 *
 * Features:
 * - Real-time token counting and cost calculation
 * - Per-model, per-feature, and per-session usage tracking
 * - Request lifecycle monitoring with timing metrics
 * - Event-driven architecture for real-time updates
 * - Memory-efficient circular buffer for recent request history
 * - Integration with existing budget enforcement system
 */
export class TokenTracker extends EventEmitter {
  private readonly logger = getComponentLogger('TokenTracker');
  private readonly config: Required<TokenTrackerConfig>;
  private readonly activeRequests = new Map<string, RequestTrackingData>();
  private readonly recentRequests: RequestTrackingData[] = [];
  private readonly modelUsage = new Map<string, ModelUsageData>();
  private readonly featureUsage = new Map<string, TokenUsageData>();
  private readonly sessionUsage = new Map<string, TokenUsageData>();

  private totalStats: TokenUsageStats = {
    totalRequests: 0,
    totalInputTokens: 0,
    totalOutputTokens: 0,
    totalTokens: 0,
    totalCost: 0,
    averageRequestCost: 0,
    averageResponseTime: 0,
    modelBreakdown: {},
    featureBreakdown: {},
    sessionBreakdown: {},
    recentRequests: [],
  };

  constructor(config: TokenTrackerConfig = {}) {
    super();

    this.config = {
      enableDetailedTracking: config.enableDetailedTracking ?? true,
      enableRealTimeCosts: config.enableRealTimeCosts ?? true,
      enablePerformanceMetrics: config.enablePerformanceMetrics ?? true,
      maxRecentRequests: config.maxRecentRequests ?? 100,
      persistData: config.persistData ?? true,
      costCalculator:
        config.costCalculator ?? this.defaultCostCalculator.bind(this),
    };

    this.logger.info('TokenTracker initialized', {
      config: this.config,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Start tracking a new API request
   * This should be called before making an API request
   */
  startRequest(
    requestId: string,
    model: string,
    feature: string,
    sessionId: string,
    additionalData?: Record<string, any>,
  ): void {
    this.logger.debug('Starting request tracking', {
      requestId,
      model,
      feature,
      sessionId,
    });

    const trackingData: RequestTrackingData = {
      requestId,
      model,
      feature,
      sessionId,
      startTime: new Date(),
      status: 'pending',
    };

    this.activeRequests.set(requestId, trackingData);

    // Emit tracking event
    const event: TokenTrackingEvent = {
      type: 'request_start',
      timestamp: new Date(),
      requestId,
      model,
      feature,
      sessionId,
      data: { ...additionalData },
    };

    this.emit('request_start', event);
    this.emitBudgetEvent('usage_updated', {
      requestId,
      status: 'started',
      activeRequests: this.activeRequests.size,
    });
  }

  /**
   * Complete tracking for an API request
   * This should be called after receiving an API response
   */
  async completeRequest(
    requestId: string,
    response?: GenerateContentResponse,
    error?: Error,
  ): Promise<void> {
    const trackingData = this.activeRequests.get(requestId);
    if (!trackingData) {
      this.logger.warn('Attempted to complete tracking for unknown request', {
        requestId,
      });
      return;
    }

    this.logger.debug('Completing request tracking', {
      requestId,
      hasResponse: !!response,
      hasError: !!error,
    });

    // Update tracking data
    trackingData.endTime = new Date();
    trackingData.responseTime =
      trackingData.endTime.getTime() - trackingData.startTime.getTime();

    if (error) {
      trackingData.status = 'error';
      trackingData.error = error.message;
    } else {
      trackingData.status = 'completed';

      // Extract token information from response if available
      if (response?.usageMetadata) {
        trackingData.inputTokens = response.usageMetadata.promptTokenCount ?? 0;
        trackingData.outputTokens =
          response.usageMetadata.candidatesTokenCount ?? 0;
        trackingData.totalTokens =
          response.usageMetadata.totalTokenCount ??
          trackingData.inputTokens + trackingData.outputTokens;
      }

      // Calculate cost if enabled
      if (
        this.config.enableRealTimeCosts &&
        trackingData.inputTokens &&
        trackingData.outputTokens
      ) {
        try {
          trackingData.cost = await this.calculateCost({
            inputTokens: trackingData.inputTokens,
            outputTokens: trackingData.outputTokens,
            model: trackingData.model,
            timestamp: trackingData.startTime,
            context: {
              model: trackingData.model,
              feature: trackingData.feature,
              sessionId: trackingData.sessionId,
            },
          });
        } catch (costError) {
          this.logger.warn('Failed to calculate cost', {
            requestId,
            error:
              costError instanceof Error
                ? costError.message
                : String(costError),
          });
        }
      }
    }

    // Move to completed requests and update statistics
    this.activeRequests.delete(requestId);
    this.addToRecentRequests(trackingData);
    await this.updateStatistics(trackingData);

    // Emit completion event
    const event: TokenTrackingEvent = {
      type: 'request_complete',
      timestamp: new Date(),
      requestId,
      model: trackingData.model,
      feature: trackingData.feature,
      sessionId: trackingData.sessionId,
      data: {
        inputTokens: trackingData.inputTokens,
        outputTokens: trackingData.outputTokens,
        totalTokens: trackingData.totalTokens,
        cost: trackingData.cost,
        responseTime: trackingData.responseTime,
        status: trackingData.status,
        error: trackingData.error,
      },
    };

    this.emit('request_complete', event);
    this.emitBudgetEvent('usage_updated', {
      requestId,
      status: 'completed',
      tokenUsage: {
        input: trackingData.inputTokens,
        output: trackingData.outputTokens,
        total: trackingData.totalTokens,
      },
      cost: trackingData.cost,
      responseTime: trackingData.responseTime,
    });
  }

  /**
   * Track token count from a countTokens API call
   */
  async trackTokenCount(
    requestId: string,
    params: CountTokensParameters,
    response: CountTokensResponse,
    model: string,
    feature: string = 'token_count',
    sessionId: string,
  ): Promise<void> {
    this.logger.debug('Tracking token count', {
      requestId,
      model,
      feature,
      totalTokens: response.totalTokens,
    });

    const event: TokenTrackingEvent = {
      type: 'token_count',
      timestamp: new Date(),
      requestId,
      model,
      feature,
      sessionId,
      data: {
        totalTokens: response.totalTokens,
        contents: params.contents?.length ?? 0,
      },
    };

    this.emit('token_count', event);
  }

  /**
   * Get current token usage statistics
   */
  getUsageStats(): TokenUsageStats {
    return {
      ...this.totalStats,
      modelBreakdown: Object.fromEntries(this.modelUsage.entries()),
      featureBreakdown: Object.fromEntries(this.featureUsage.entries()),
      sessionBreakdown: Object.fromEntries(this.sessionUsage.entries()),
      recentRequests: [...this.recentRequests],
    };
  }

  /**
   * Get usage statistics for a specific model
   */
  getModelUsage(model: string): ModelUsageData | undefined {
    return this.modelUsage.get(model);
  }

  /**
   * Get usage statistics for a specific feature
   */
  getFeatureUsage(feature: string): TokenUsageData | undefined {
    return this.featureUsage.get(feature);
  }

  /**
   * Get usage statistics for a specific session
   */
  getSessionUsage(sessionId: string): TokenUsageData | undefined {
    return this.sessionUsage.get(sessionId);
  }

  /**
   * Get currently active requests
   */
  getActiveRequests(): RequestTrackingData[] {
    return Array.from(this.activeRequests.values());
  }

  /**
   * Clear all tracking data and reset statistics
   */
  reset(): void {
    this.logger.info('Resetting token tracker');

    this.activeRequests.clear();
    this.recentRequests.length = 0;
    this.modelUsage.clear();
    this.featureUsage.clear();
    this.sessionUsage.clear();

    this.totalStats = {
      totalRequests: 0,
      totalInputTokens: 0,
      totalOutputTokens: 0,
      totalTokens: 0,
      totalCost: 0,
      averageRequestCost: 0,
      averageResponseTime: 0,
      modelBreakdown: {},
      featureBreakdown: {},
      sessionBreakdown: {},
      recentRequests: [],
    };

    this.emit('reset');
  }

  /**
   * Default cost calculation based on token counts and model
   */
  private async defaultCostCalculator(
    params: CostCalculationParams,
  ): Promise<number> {
    // Default cost calculation - can be overridden in config
    // These are example rates and should be updated with actual pricing
    const costPer1kInputTokens = this.getModelInputCost(params.model);
    const costPer1kOutputTokens = this.getModelOutputCost(params.model);

    const inputCost = (params.inputTokens / 1000) * costPer1kInputTokens;
    const outputCost = (params.outputTokens / 1000) * costPer1kOutputTokens;

    return inputCost + outputCost;
  }

  /**
   * Get input token cost per 1k tokens for a model
   */
  private getModelInputCost(model: string): number {
    // Example pricing - should be updated with actual costs
    if (model.includes('flash')) return 0.075; // $0.075 per 1k input tokens
    if (model.includes('pro')) return 1.25; // $1.25 per 1k input tokens
    return 0.1; // Default cost
  }

  /**
   * Get output token cost per 1k tokens for a model
   */
  private getModelOutputCost(model: string): number {
    // Example pricing - should be updated with actual costs
    if (model.includes('flash')) return 0.3; // $0.30 per 1k output tokens
    if (model.includes('pro')) return 5.0; // $5.0 per 1k output tokens
    return 0.4; // Default cost
  }

  /**
   * Calculate cost using configured calculator
   */
  private async calculateCost(params: CostCalculationParams): Promise<number> {
    try {
      return await this.config.costCalculator(params);
    } catch (error) {
      this.logger.error('Cost calculation failed', {
        model: params.model,
        inputTokens: params.inputTokens,
        outputTokens: params.outputTokens,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Add request to recent requests circular buffer
   */
  private addToRecentRequests(request: RequestTrackingData): void {
    this.recentRequests.push(request);

    // Maintain circular buffer size
    if (this.recentRequests.length > this.config.maxRecentRequests) {
      this.recentRequests.shift();
    }
  }

  /**
   * Update aggregate statistics with completed request data
   */
  private async updateStatistics(request: RequestTrackingData): Promise<void> {
    if (
      request.status !== 'completed' ||
      !request.inputTokens ||
      !request.outputTokens
    ) {
      return;
    }

    // Update total statistics
    this.totalStats.totalRequests++;
    this.totalStats.totalInputTokens += request.inputTokens;
    this.totalStats.totalOutputTokens += request.outputTokens;
    this.totalStats.totalTokens +=
      request.totalTokens || request.inputTokens + request.outputTokens;

    if (request.cost) {
      this.totalStats.totalCost += request.cost;
      this.totalStats.averageRequestCost =
        this.totalStats.totalCost / this.totalStats.totalRequests;
    }

    if (request.responseTime) {
      // Update running average response time
      const totalResponseTime =
        this.totalStats.averageResponseTime *
        (this.totalStats.totalRequests - 1);
      this.totalStats.averageResponseTime =
        (totalResponseTime + request.responseTime) /
        this.totalStats.totalRequests;
    }

    // Update model usage statistics
    this.updateModelUsage(request);

    // Update feature usage statistics
    this.updateFeatureUsage(request);

    // Update session usage statistics
    this.updateSessionUsage(request);
  }

  /**
   * Update model-specific usage statistics
   */
  private updateModelUsage(request: RequestTrackingData): void {
    if (!request.inputTokens || !request.outputTokens) return;

    const existing = this.modelUsage.get(request.model) || {
      requests: 0,
      inputTokens: 0,
      outputTokens: 0,
      cost: 0,
      avgResponseTime: 0,
    };

    existing.requests++;
    existing.inputTokens += request.inputTokens;
    existing.outputTokens += request.outputTokens;
    existing.cost += request.cost || 0;

    if (request.responseTime) {
      const totalResponseTime =
        existing.avgResponseTime * (existing.requests - 1);
      existing.avgResponseTime =
        (totalResponseTime + request.responseTime) / existing.requests;
    }

    this.modelUsage.set(request.model, existing);
  }

  /**
   * Update feature-specific usage statistics
   */
  private updateFeatureUsage(request: RequestTrackingData): void {
    if (!request.inputTokens || !request.outputTokens) return;

    const existing = this.featureUsage.get(request.feature) || {
      inputTokens: 0,
      outputTokens: 0,
      totalTokens: 0,
      tokenCosts: { input: 0, output: 0 },
    };

    existing.inputTokens += request.inputTokens;
    existing.outputTokens += request.outputTokens;
    existing.totalTokens +=
      request.totalTokens || request.inputTokens + request.outputTokens;

    // Update cost breakdown if available
    if (request.cost) {
      // Estimate input/output cost split based on token ratios
      const totalTokens = request.inputTokens + request.outputTokens;
      const inputRatio = request.inputTokens / totalTokens;
      const outputRatio = request.outputTokens / totalTokens;

      existing.tokenCosts.input += request.cost * inputRatio;
      existing.tokenCosts.output += request.cost * outputRatio;
    }

    this.featureUsage.set(request.feature, existing);
  }

  /**
   * Update session-specific usage statistics
   */
  private updateSessionUsage(request: RequestTrackingData): void {
    if (!request.inputTokens || !request.outputTokens) return;

    const existing = this.sessionUsage.get(request.sessionId) || {
      inputTokens: 0,
      outputTokens: 0,
      totalTokens: 0,
      tokenCosts: { input: 0, output: 0 },
    };

    existing.inputTokens += request.inputTokens;
    existing.outputTokens += request.outputTokens;
    existing.totalTokens +=
      request.totalTokens || request.inputTokens + request.outputTokens;

    if (request.cost) {
      const totalTokens = request.inputTokens + request.outputTokens;
      const inputRatio = request.inputTokens / totalTokens;
      const outputRatio = request.outputTokens / totalTokens;

      existing.tokenCosts.input += request.cost * inputRatio;
      existing.tokenCosts.output += request.cost * outputRatio;
    }

    this.sessionUsage.set(request.sessionId, existing);
  }

  /**
   * Emit a budget-specific event
   */
  private emitBudgetEvent(
    type: BudgetEventType,
    data: Record<string, any>,
  ): void {
    const event: BudgetEvent = {
      type,
      timestamp: new Date(),
      data,
      source: 'TokenTracker',
      severity: this.getEventSeverity(type),
    };

    this.emit('budget_event', event);
  }

  /**
   * Determine event severity based on event type
   */
  private getEventSeverity(type: BudgetEventType): EventSeverity {
    switch (type) {
      case 'limit_exceeded':
        return 'critical' as EventSeverity;
      case 'warning_threshold':
        return 'warning' as EventSeverity;
      case 'usage_updated':
      case 'cost_calculated':
        return 'info' as EventSeverity;
      default:
        return 'info' as EventSeverity;
    }
  }
}

/**
 * Create a new TokenTracker instance with default configuration
 */
export function createTokenTracker(config?: TokenTrackerConfig): TokenTracker {
  return new TokenTracker(config);
}

/**
 * Singleton instance for global token tracking
 */
let globalTokenTracker: TokenTracker | null = null;

/**
 * Get or create the global token tracker instance
 */
export function getGlobalTokenTracker(
  config?: TokenTrackerConfig,
): TokenTracker {
  if (!globalTokenTracker) {
    globalTokenTracker = createTokenTracker(config);
  }
  return globalTokenTracker;
}

/**
 * Reset the global token tracker instance
 */
export function resetGlobalTokenTracker(): void {
  if (globalTokenTracker) {
    globalTokenTracker.reset();
    globalTokenTracker = null;
  }
}
