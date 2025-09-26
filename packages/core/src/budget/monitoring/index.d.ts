/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * @fileoverview Budget monitoring system exports
 * Centralized export module for all token usage monitoring and analytics components
 *
 * @author Claude Code - Real-Time Token Usage Monitoring Agent
 * @version 1.0.0
 */
export { TokenTracker, type TokenTrackerConfig, type TokenTrackingEvent, type RequestTrackingData, type TokenUsageStats, } from './token-tracker.js';
export { MetricsCollector, type MetricsCollectorConfig, type MetricsDataPoint, type MetricsSummary, type AggregatedMetrics, type TrendAnalysis, type StatisticalAnalysis, } from './metrics-collector.js';
export { UsageCalculator, type ModelPricing, type CostBreakdown, type UsageCostAnalysis, } from './usage-calculator.js';
export { BudgetEventManager, type EventManagerConfig, type EventSubscription, type EventFilter, type EventRoutingRule, type EventHandler, } from './events.js';
export { QuotaManager, type QuotaManagerConfig, type QuotaLimit, type RateLimitStrategy, type TokenBucket, type SlidingWindowLimiter, } from './quota-manager.js';
export { TokenDataAggregator, type AggregatorConfig, type AggregationConfig, type TimeWindow, type WindowedData, } from './aggregator.js';
export { RealTimeStreamingService, type StreamingConfig, type StreamSubscription, type StreamType, type StreamMessage, type StreamFilter, } from './streaming.js';
export { TokenUsageCache, createTokenUsageCache, type CacheEntry, type CacheConfig, type CacheStats, type CacheInvalidationEvent, type PrefetchConfig, CachePriority, CachePresets, CacheKeys, } from './cache.js';
export { TokenMonitoringIntegration, TokenTrackingContentGenerator, createTokenMonitoringIntegration, createMonitoringEnabledContentGenerator, type MonitoringIntegrationConfig, type IntegrationStats, } from './integration.js';
/**
 * Default configuration presets for different monitoring scenarios
 */
export declare const MonitoringPresets: {
    /**
     * High-performance monitoring for production environments
     */
    readonly Production: {
        readonly enableTokenTracking: true;
        readonly enableMetricsCollection: true;
        readonly enableStreaming: true;
        readonly enableQuotaManagement: true;
        readonly enableCaching: true;
        readonly metricsInterval: 60000;
        readonly cacheConfig: {
            readonly maxEntries: 10000;
            readonly maxSizeBytes: number;
            readonly defaultTTL: number;
        };
        readonly streamingConfig: {
            readonly enableCompression: true;
            readonly maxBufferSize: 5000;
            readonly updateFrequency: 5000;
        };
    };
    /**
     * Development monitoring with detailed logging
     */
    readonly Development: {
        readonly enableTokenTracking: true;
        readonly enableMetricsCollection: true;
        readonly enableStreaming: false;
        readonly enableQuotaManagement: false;
        readonly enableCaching: false;
        readonly metricsInterval: 10000;
    };
    /**
     * Lightweight monitoring for resource-constrained environments
     */
    readonly Lightweight: {
        readonly enableTokenTracking: true;
        readonly enableMetricsCollection: false;
        readonly enableStreaming: false;
        readonly enableQuotaManagement: true;
        readonly enableCaching: false;
        readonly metricsInterval: 300000;
    };
    /**
     * Testing configuration with minimal overhead
     */
    readonly Testing: {
        readonly enableTokenTracking: true;
        readonly enableMetricsCollection: false;
        readonly enableStreaming: false;
        readonly enableQuotaManagement: false;
        readonly enableCaching: false;
        readonly metricsInterval: 1000;
    };
};
/**
 * Monitoring system health checker
 */
export declare class MonitoringHealthChecker {
    private integration;
    constructor(integration: TokenMonitoringIntegration);
    /**
     * Perform comprehensive health check
     */
    performHealthCheck(): Promise<{
        healthy: boolean;
        components: Record<string, {
            status: 'healthy' | 'warning' | 'error';
            message?: string;
        }>;
        recommendations: string[];
    }>;
}
/**
 * Utility functions for monitoring setup and management
 */
export declare const MonitoringUtils: {
    /**
     * Create monitoring integration with environment-based configuration
     */
    createForEnvironment: (config: any, budgetSettings: any, environment?: "production" | "development" | "testing") => Promise<any>;
    /**
     * Setup monitoring with automatic error handling
     */
    setupWithErrorHandling: (baseContentGenerator: any, config: any, budgetSettings: any, onError?: (error: Error) => void) => Promise<any>;
    /**
     * Create health checker for monitoring integration
     */
    createHealthChecker: (integration: TokenMonitoringIntegration) => MonitoringHealthChecker;
};
