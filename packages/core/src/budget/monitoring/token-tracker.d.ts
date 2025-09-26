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
import type { GenerateContentResponse, CountTokensParameters, CountTokensResponse } from '@google/genai';
import { EventEmitter } from 'node:events';
import type { TokenUsageData, ModelUsageData, CostCalculationParams } from '../types.js';
/**
 * Token usage tracking event interface
 */
export interface TokenTrackingEvent {
    type: 'request_start' | 'request_complete' | 'token_count' | 'cost_calculated' | 'error';
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
export declare class TokenTracker extends EventEmitter {
    private readonly logger;
    private readonly config;
    private readonly activeRequests;
    private readonly recentRequests;
    private readonly modelUsage;
    private readonly featureUsage;
    private readonly sessionUsage;
    private totalStats;
    constructor(config?: TokenTrackerConfig);
    /**
     * Start tracking a new API request
     * This should be called before making an API request
     */
    startRequest(requestId: string, model: string, feature: string, sessionId: string, additionalData?: Record<string, any>): void;
    /**
     * Complete tracking for an API request
     * This should be called after receiving an API response
     */
    completeRequest(requestId: string, response?: GenerateContentResponse, error?: Error): Promise<void>;
    /**
     * Track token count from a countTokens API call
     */
    trackTokenCount(requestId: string, params: CountTokensParameters, response: CountTokensResponse, model: string, feature: string | undefined, sessionId: string): Promise<void>;
    /**
     * Get current token usage statistics
     */
    getUsageStats(): TokenUsageStats;
    /**
     * Get usage statistics for a specific model
     */
    getModelUsage(model: string): ModelUsageData | undefined;
    /**
     * Get usage statistics for a specific feature
     */
    getFeatureUsage(feature: string): TokenUsageData | undefined;
    /**
     * Get usage statistics for a specific session
     */
    getSessionUsage(sessionId: string): TokenUsageData | undefined;
    /**
     * Get currently active requests
     */
    getActiveRequests(): RequestTrackingData[];
    /**
     * Clear all tracking data and reset statistics
     */
    reset(): void;
    /**
     * Default cost calculation based on token counts and model
     */
    private defaultCostCalculator;
    /**
     * Get input token cost per 1k tokens for a model
     */
    private getModelInputCost;
    /**
     * Get output token cost per 1k tokens for a model
     */
    private getModelOutputCost;
    /**
     * Calculate cost using configured calculator
     */
    private calculateCost;
    /**
     * Add request to recent requests circular buffer
     */
    private addToRecentRequests;
    /**
     * Update aggregate statistics with completed request data
     */
    private updateStatistics;
    /**
     * Update model-specific usage statistics
     */
    private updateModelUsage;
    /**
     * Update feature-specific usage statistics
     */
    private updateFeatureUsage;
    /**
     * Update session-specific usage statistics
     */
    private updateSessionUsage;
    /**
     * Emit a budget-specific event
     */
    private emitBudgetEvent;
    /**
     * Determine event severity based on event type
     */
    private getEventSeverity;
}
/**
 * Create a new TokenTracker instance with default configuration
 */
export declare function createTokenTracker(config?: TokenTrackerConfig): TokenTracker;
/**
 * Get or create the global token tracker instance
 */
export declare function getGlobalTokenTracker(config?: TokenTrackerConfig): TokenTracker;
/**
 * Reset the global token tracker instance
 */
export declare function resetGlobalTokenTracker(): void;
