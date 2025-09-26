/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Integration layer for token tracking with existing Gemini API systems
 * Provides seamless integration between the token monitoring infrastructure and
 * existing budget enforcement, content generation, and client management systems
 *
 * @author Claude Code - Real-Time Token Usage Monitoring Agent
 * @version 1.0.0
 */
import { EventEmitter } from 'node:events';
import type { GenerateContentParameters, GenerateContentResponse } from '@google/genai';
import type { ContentGenerator } from '../../core/contentGenerator.js';
import type { Config } from '../../config/config.js';
import type { BudgetSettings } from '../types.js';
import type { TokenTracker } from './token-tracker.js';
import type { MetricsCollector } from './metrics-collector.js';
import type { UsageCalculator } from './usage-calculator.js';
import type { BudgetEventManager } from './events.js';
import type { QuotaManager } from './quota-manager.js';
import type { TokenDataAggregator } from './aggregator.js';
import type { RealTimeStreamingService } from './streaming.js';
import type { TokenUsageCache } from './cache.js';
/**
 * Integration configuration options
 */
export interface MonitoringIntegrationConfig {
    /** Enable token tracking */
    enableTokenTracking: boolean;
    /** Enable metrics collection */
    enableMetricsCollection: boolean;
    /** Enable real-time streaming */
    enableStreaming: boolean;
    /** Enable quota management */
    enableQuotaManagement: boolean;
    /** Enable caching */
    enableCaching: boolean;
    /** Cache configuration */
    cacheConfig?: {
        maxEntries?: number;
        maxSizeBytes?: number;
        defaultTTL?: number;
    };
    /** Streaming configuration */
    streamingConfig?: {
        enableCompression?: boolean;
        maxBufferSize?: number;
        updateFrequency?: number;
    };
    /** Metrics collection interval */
    metricsInterval?: number;
    /** Session identifier */
    sessionId?: string;
}
/**
 * Integration statistics for monitoring health
 */
export interface IntegrationStats {
    /** Token tracker statistics */
    tokenTracker: {
        activeRequests: number;
        totalRequests: number;
        totalTokensProcessed: number;
    };
    /** Metrics collector statistics */
    metricsCollector: {
        dataPointsCollected: number;
        anomaliesDetected: number;
        isCollecting: boolean;
    };
    /** Streaming service statistics */
    streaming: {
        activeSubscriptions: number;
        messagesSent: number;
        isRunning: boolean;
    };
    /** Cache statistics */
    cache: {
        hitRatio: number;
        entryCount: number;
        memoryUsage: number;
    };
    /** Integration health */
    health: {
        isHealthy: boolean;
        errors: string[];
        uptime: number;
    };
}
/**
 * Content generator wrapper that adds comprehensive token tracking
 */
export declare class TokenTrackingContentGenerator implements ContentGenerator {
    private readonly wrapped;
    private readonly config;
    private readonly integration;
    private integrationStats;
    private startTime;
    constructor(wrapped: ContentGenerator, config: Config, integration: TokenMonitoringIntegration);
    get userTier(): import("../../index.js").UserTierId | undefined;
    generateContent(req: GenerateContentParameters, userPromptId: string): Promise<GenerateContentResponse>;
    generateContentStream(req: GenerateContentParameters, userPromptId: string): Promise<AsyncGenerator<GenerateContentResponse>>;
    countTokens(req: CountTokensParameters): Promise<CountTokensResponse>;
    embedContent(req: EmbedContentParameters): Promise<EmbedContentResponse>;
    /**
     * Wrap streaming response for token tracking
     */
    private wrapStreamForTracking;
    /**
     * Extract feature name from request parameters
     */
    private extractFeature;
    /**
     * Update integration statistics
     */
    private updateStats;
    /**
     * Initialize integration statistics
     */
    private initializeStats;
    /**
     * Get current integration statistics
     */
    getIntegrationStats(): IntegrationStats;
}
/**
 * Main integration class that orchestrates all monitoring components
 */
export declare class TokenMonitoringIntegration extends EventEmitter {
    private readonly config;
    private readonly budgetSettings;
    private readonly integrationConfig;
    private tokenTracker;
    private metricsCollector;
    private usageCalculator;
    private eventManager;
    private quotaManager;
    private aggregator;
    private streamingService?;
    private cache?;
    private sessionId;
    private isInitialized;
    constructor(config: Config, budgetSettings: BudgetSettings, integrationConfig: MonitoringIntegrationConfig);
    /**
     * Initialize all monitoring components
     */
    private initializeComponents;
    /**
     * Setup event handlers for component coordination
     */
    private setupEventHandlers;
    /**
     * Initialize the integration system
     */
    initialize(): Promise<void>;
    /**
     * Create a token-tracking wrapper for content generators
     */
    wrapContentGenerator(contentGenerator: ContentGenerator): TokenTrackingContentGenerator;
    /**
     * Get token tracker instance
     */
    getTokenTracker(): TokenTracker;
    /**
     * Get metrics collector instance
     */
    getMetricsCollector(): MetricsCollector;
    /**
     * Get usage calculator instance
     */
    getUsageCalculator(): UsageCalculator;
    /**
     * Get event manager instance
     */
    getEventManager(): BudgetEventManager;
    /**
     * Get quota manager instance
     */
    getQuotaManager(): QuotaManager;
    /**
     * Get data aggregator instance
     */
    getAggregator(): TokenDataAggregator;
    /**
     * Get streaming service instance
     */
    getStreamingService(): RealTimeStreamingService | undefined;
    /**
     * Get cache instance
     */
    getCache(): TokenUsageCache | undefined;
    /**
     * Get session ID
     */
    getSessionId(): string;
    /**
     * Check if integration is initialized
     */
    isIntegrationInitialized(): boolean;
    /**
     * Get comprehensive monitoring statistics
     */
    getMonitoringStats(): {
        tokenTracker: any;
        metricsCollector: any;
        streaming?: any;
        cache?: any;
        system: any;
    };
    /**
     * Shutdown the integration system gracefully
     */
    shutdown(): Promise<void>;
}
/**
 * Create and initialize a token monitoring integration
 */
export declare function createTokenMonitoringIntegration(config: Config, budgetSettings: BudgetSettings, integrationConfig?: Partial<MonitoringIntegrationConfig>): Promise<TokenMonitoringIntegration>;
/**
 * Factory function to create monitoring-enabled content generators
 */
export declare function createMonitoringEnabledContentGenerator(baseContentGenerator: ContentGenerator, config: Config, budgetSettings: BudgetSettings, integrationConfig?: Partial<MonitoringIntegrationConfig>): Promise<{
    contentGenerator: TokenTrackingContentGenerator;
    integration: TokenMonitoringIntegration;
}>;
