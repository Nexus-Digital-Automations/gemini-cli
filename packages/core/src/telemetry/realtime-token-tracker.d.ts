/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import EventEmitter from 'node:events';
import type { GenerateContentResponseUsageMetadata } from '@google/genai';
import type { Config } from '../config/config.js';
import type { AuthType } from '../core/contentGenerator.js';
/**
 * Detailed token usage data with enhanced granularity
 */
export interface TokenUsageData {
    readonly sessionId: string;
    readonly promptId: string;
    readonly timestamp: number;
    readonly model: string;
    readonly authType?: AuthType;
    readonly command?: string;
    readonly feature?: string;
    readonly userId?: string;
    readonly inputTokens: number;
    readonly outputTokens: number;
    readonly cachedTokens: number;
    readonly thoughtsTokens: number;
    readonly toolTokens: number;
    readonly totalTokens: number;
    readonly latencyMs: number;
    readonly requestStartTime: number;
    readonly requestEndTime: number;
    readonly inputCostUsd?: number;
    readonly outputCostUsd?: number;
    readonly totalCostUsd?: number;
    readonly conversationTurn: number;
    readonly toolCallsCount: number;
    readonly streamingEnabled: boolean;
    readonly errorCount: number;
}
/**
 * Real-time streaming token usage event
 */
export interface TokenStreamEvent {
    readonly type: 'token_usage_update' | 'token_batch_update' | 'cost_alert' | 'performance_alert';
    readonly data: TokenUsageData | TokenUsageData[] | AlertData;
    readonly timestamp: number;
}
/**
 * Performance and cost alert data
 */
export interface AlertData {
    readonly alertType: 'high_cost' | 'high_latency' | 'unusual_usage';
    readonly threshold: number;
    readonly currentValue: number;
    readonly sessionId: string;
    readonly model: string;
    readonly timestamp: number;
    readonly metadata?: Record<string, unknown>;
}
/**
 * Aggregated usage statistics for analytics
 */
export interface UsageStatistics {
    readonly totalTokens: number;
    readonly totalCost: number;
    readonly averageLatency: number;
    readonly requestCount: number;
    readonly errorRate: number;
    readonly topModels: Array<{
        model: string;
        usage: number;
        cost: number;
    }>;
    readonly timeRange: {
        start: number;
        end: number;
    };
    readonly breakdown: {
        byCommand: Map<string, TokenUsageData[]>;
        byFeature: Map<string, TokenUsageData[]>;
        byModel: Map<string, TokenUsageData[]>;
        byHour: Map<string, TokenUsageData[]>;
    };
}
/**
 * Real-time configuration for tracking
 */
export interface RealtimeConfig {
    readonly enableStreaming: boolean;
    readonly batchSize: number;
    readonly batchTimeoutMs: number;
    readonly alertThresholds: {
        highCostUsd: number;
        highLatencyMs: number;
        unusualTokenSpike: number;
    };
    readonly compressionLevel: 'none' | 'light' | 'aggressive';
    readonly retentionDays: number;
}
/**
 * High-performance real-time token usage tracking system with enterprise-grade capabilities
 */
export declare class RealtimeTokenTracker extends EventEmitter {
    private readonly geminiConfig;
    private readonly config;
    private readonly sessionData;
    private readonly batchBuffer;
    private readonly performanceCache;
    private readonly storageEngine;
    private batchTimeout;
    private totalTrackedRequests;
    private totalTrackedTokens;
    private totalTrackedCost;
    constructor(geminiConfig: Config, config?: Partial<RealtimeConfig>);
    /**
     * Track token usage with <50ms performance overhead
     */
    trackTokenUsage(sessionId: string, promptId: string, model: string, usageMetadata: GenerateContentResponseUsageMetadata, latencyMs: number, authType?: AuthType, context?: {
        command?: string;
        feature?: string;
        userId?: string;
        conversationTurn?: number;
        toolCallsCount?: number;
        streamingEnabled?: boolean;
        errorCount?: number;
    }): Promise<void>;
    /**
     * Get real-time usage statistics with advanced analytics
     */
    getRealtimeStatistics(timeRangeMs?: number, // 1 hour default
    sessionId?: string): UsageStatistics;
    /**
     * Get usage data for a specific session with pagination
     */
    getSessionData(sessionId: string, limit?: number, offset?: number): {
        data: TokenUsageData[];
        total: number;
        hasMore: boolean;
    };
    /**
     * Stream live token usage updates
     */
    createLiveStream(): NodeJS.ReadableStream;
    /**
     * Export usage data for external analytics
     */
    exportUsageData(format?: 'json' | 'csv' | 'parquet', sessionId?: string, timeRangeMs?: number): string | Buffer;
    /**
     * Clear old data based on retention policy
     */
    cleanup(): void;
    private createTokenUsageData;
    private addToSessionData;
    private addToBatch;
    private flushBatch;
    private checkAlerts;
    private updateGlobalStats;
    private calculateStatistics;
    private groupBy;
    private groupByHour;
    private convertToCsv;
    private setupCleanupInterval;
}
/**
 * Get or create the global RealtimeTokenTracker instance
 */
export declare function getGlobalTokenTracker(config: Config): RealtimeTokenTracker;
/**
 * Reset the global tracker (mainly for testing)
 */
export declare function resetGlobalTokenTracker(): void;
