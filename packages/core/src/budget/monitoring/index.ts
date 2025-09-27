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

// Core monitoring components
export {
  TokenTracker,
  type TokenTrackerConfig,
  type TokenTrackingEvent,
  type RequestTrackingData,
  type TokenUsageStats,
} from './token-tracker.js';
export {
  MetricsCollector,
  type MetricsCollectorConfig,
  type MetricsDataPoint,
  type MetricsSummary,
  type AggregatedMetrics,
  type TrendAnalysis,
} from './metrics-collector.js';
export {
  UsageCalculator,
  type ModelPricing,
  type CostBreakdown,
  type UsageCostAnalysis,
} from './usage-calculator.js';

// Event management
export {
  BudgetEventManager,
  type EventSubscription,
  type EventFilter,
  type EventRoutingRule,
} from './events.js';

// Quota and rate limiting
export {
  QuotaManager,
  type QuotaManagerConfig,
  type QuotaLimit,
} from './quota-manager.js';

// Data aggregation
export {
  TokenDataAggregator,
  type AggregationConfig,
  type TimeWindow,
  type WindowedData,
} from './aggregator.js';

// Real-time streaming
export {
  RealTimeStreamingService,
  type StreamingConfig,
  type StreamSubscription,
  type StreamType,
  type StreamUpdate,
  type StreamError,
} from './streaming.js';

// Caching system
export {
  TokenUsageCache,
  createTokenUsageCache,
  type CacheEntry,
  type CacheConfig,
  type CacheStats,
  type CacheInvalidationEvent,
  type PrefetchConfig,
  CachePriority,
  CachePresets,
  CacheKeys,
} from './cache.js';

// Integration layer
export {
  TokenMonitoringIntegration,
  TokenTrackingContentGenerator,
  createTokenMonitoringIntegration,
  createMonitoringEnabledContentGenerator,
  type MonitoringIntegrationConfig,
  type IntegrationStats,
} from './integration.js';

// Import for internal usage
import type { TokenMonitoringIntegration } from './integration.js';
import {
  createTokenMonitoringIntegration,
  createMonitoringEnabledContentGenerator,
} from './integration.js';
import type { Config } from '../../config/config.js';
import type { ContentGenerator } from '../../core/contentGenerator.js';
import type { BudgetSettings } from '../types.js';

/**
 * Default configuration presets for different monitoring scenarios
 */
export const MonitoringPresets = {
  /**
   * High-performance monitoring for production environments
   */
  Production: {
    enableTokenTracking: true,
    enableMetricsCollection: true,
    enableStreaming: true,
    enableQuotaManagement: true,
    enableCaching: true,
    metricsInterval: 60000, // 1 minute
    cacheConfig: {
      maxEntries: 10000,
      maxSizeBytes: 100 * 1024 * 1024, // 100MB
      defaultTTL: 60 * 60 * 1000, // 1 hour
    },
    streamingConfig: {
      enableCompression: true,
      maxBufferSize: 5000,
      updateFrequency: 5000, // 5 seconds
    },
  },

  /**
   * Development monitoring with detailed logging
   */
  Development: {
    enableTokenTracking: true,
    enableMetricsCollection: true,
    enableStreaming: false,
    enableQuotaManagement: false,
    enableCaching: false,
    metricsInterval: 10000, // 10 seconds
  },

  /**
   * Lightweight monitoring for resource-constrained environments
   */
  Lightweight: {
    enableTokenTracking: true,
    enableMetricsCollection: false,
    enableStreaming: false,
    enableQuotaManagement: true,
    enableCaching: false,
    metricsInterval: 300000, // 5 minutes
  },

  /**
   * Testing configuration with minimal overhead
   */
  Testing: {
    enableTokenTracking: true,
    enableMetricsCollection: false,
    enableStreaming: false,
    enableQuotaManagement: false,
    enableCaching: false,
    metricsInterval: 1000, // 1 second
  },
} as const;

/**
 * Monitoring system health checker
 */
export class MonitoringHealthChecker {
  private integration: TokenMonitoringIntegration;

  constructor(integration: TokenMonitoringIntegration) {
    this.integration = integration;
  }

  /**
   * Perform comprehensive health check
   */
  async performHealthCheck(): Promise<{
    healthy: boolean;
    components: Record<
      string,
      { status: 'healthy' | 'warning' | 'error'; message?: string }
    >;
    recommendations: string[];
  }> {
    const components: Record<
      string,
      { status: 'healthy' | 'warning' | 'error'; message?: string }
    > = {};
    const recommendations: string[] = [];

    // Check token tracker
    try {
      const tokenStats = this.integration.getTokenTracker().getUsageStats();
      if (tokenStats.totalRequests > 0) {
        components.tokenTracker = { status: 'healthy' };
      } else {
        components.tokenTracker = {
          status: 'warning',
          message: 'No requests tracked yet',
        };
      }
    } catch (error) {
      components.tokenTracker = {
        status: 'error',
        message: `Token tracker error: ${error}`,
      };
      recommendations.push(
        'Check token tracker configuration and restart monitoring',
      );
    }

    // Check metrics collector
    try {
      const metricsStats = this.integration
        .getMetricsCollector()
        .getMetricsSummary();
      if (metricsStats.totalDataPoints > 0) {
        components.metricsCollector = { status: 'healthy' };
      } else {
        components.metricsCollector = {
          status: 'warning',
          message: 'No metrics collected yet',
        };
      }
    } catch (error) {
      components.metricsCollector = {
        status: 'error',
        message: `Metrics collector error: ${error}`,
      };
      recommendations.push('Check metrics collector configuration');
    }

    // Check cache if enabled
    const cache = this.integration.getCache();
    if (cache) {
      try {
        const cacheStats = cache.getStats();
        if (cacheStats.hitRatio > 0.8) {
          components.cache = { status: 'healthy' };
        } else if (cacheStats.hitRatio > 0.5) {
          components.cache = {
            status: 'warning',
            message: 'Low cache hit ratio',
          };
          recommendations.push('Consider adjusting cache TTL or size limits');
        } else {
          components.cache = {
            status: 'error',
            message: 'Very low cache hit ratio',
          };
          recommendations.push('Review cache configuration and usage patterns');
        }
      } catch (error) {
        components.cache = {
          status: 'error',
          message: `Cache error: ${error}`,
        };
      }
    }

    // Check streaming service if enabled
    const streaming = this.integration.getStreamingService();
    if (streaming) {
      try {
        // Would need to add health check methods to streaming service
        components.streaming = { status: 'healthy' };
      } catch (error) {
        components.streaming = {
          status: 'error',
          message: `Streaming error: ${error}`,
        };
        recommendations.push(
          'Check streaming service configuration and restart if needed',
        );
      }
    }

    // Determine overall health
    const hasErrors = Object.values(components).some(
      (c) => c.status === 'error',
    );
    const hasWarnings = Object.values(components).some(
      (c) => c.status === 'warning',
    );

    return {
      healthy: !hasErrors,
      components,
      recommendations:
        hasErrors || hasWarnings ? recommendations : ['System is healthy'],
    };
  }
}

/**
 * Utility functions for monitoring setup and management
 */
export const MonitoringUtils = {
  /**
   * Create monitoring integration with environment-based configuration
   */
  createForEnvironment: async (
    config: Record<string, unknown>,
    budgetSettings: Record<string, unknown>,
    environment: 'production' | 'development' | 'testing' = 'development',
  ) => {
    const preset =
      MonitoringPresets[
        environment === 'production'
          ? 'Production'
          : environment === 'testing'
            ? 'Testing'
            : 'Development'
      ];

    return createTokenMonitoringIntegration(
      config as Config,
      budgetSettings as BudgetSettings,
      preset,
    );
  },

  /**
   * Setup monitoring with automatic error handling
   */
  setupWithErrorHandling: async (
    baseContentGenerator: unknown,
    config: Record<string, unknown>,
    budgetSettings: Record<string, unknown>,
    onError?: (error: Error) => void,
  ) => {
    try {
      return await createMonitoringEnabledContentGenerator(
        baseContentGenerator as ContentGenerator,
        config as Config,
        budgetSettings as BudgetSettings,
        MonitoringPresets.Production,
      );
    } catch (error) {
      if (onError) {
        onError(error as Error);
      }
      console.error(
        'Failed to setup monitoring, falling back to base generator:',
        error,
      );
      return { contentGenerator: baseContentGenerator, integration: null };
    }
  },

  /**
   * Create health checker for monitoring integration
   */
  createHealthChecker: (integration: TokenMonitoringIntegration) =>
    new MonitoringHealthChecker(integration),
};
