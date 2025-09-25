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
import { TokenTracker } from './token-tracker.js';
import { MetricsCollector } from './metrics-collector.js';
import { UsageCalculator } from './usage-calculator.js';
import { BudgetEventManager } from './events.js';
import { QuotaManager } from './quota-manager.js';
import { TokenDataAggregator } from './aggregator.js';
import { RealTimeStreamingService } from './streaming.js';
import { TokenUsageCache } from './cache.js';
import { BudgetEventType } from '../types.js';
import { randomUUID } from 'node:crypto';

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
export class TokenTrackingContentGenerator implements ContentGenerator {
  private integrationStats: IntegrationStats;
  private startTime: Date;

  constructor(
    private readonly wrapped: ContentGenerator,
    private readonly config: Config,
    private readonly integration: TokenMonitoringIntegration,
  ) {
    this.startTime = new Date();
    this.integrationStats = this.initializeStats();
  }

  get userTier() {
    return this.wrapped.userTier;
  }

  async generateContent(
    req: GenerateContentParameters,
    userPromptId: string,
  ): Promise<GenerateContentResponse> {
    const requestId = randomUUID();
    const model = req.model || 'unknown';
    const feature = this.extractFeature(req);
    const sessionId = this.integration.getSessionId();

    try {
      // Start request tracking
      this.integration.getTokenTracker().startRequest(requestId, model, feature, sessionId);

      // Make the API call
      const response = await this.wrapped.generateContent(req, userPromptId);

      // Complete tracking with response
      await this.integration.getTokenTracker().completeRequest(requestId, response);

      // Update integration stats
      this.updateStats('generateContent', true);

      return response;
    } catch (error) {
      // Track error
      await this.integration.getTokenTracker().completeRequest(requestId, undefined, error as Error);
      this.updateStats('generateContent', false);
      throw error;
    }
  }

  async generateContentStream(
    req: GenerateContentParameters,
    userPromptId: string,
  ): Promise<AsyncGenerator<GenerateContentResponse>> {
    const requestId = randomUUID();
    const model = req.model || 'unknown';
    const feature = this.extractFeature(req);
    const sessionId = this.integration.getSessionId();

    // Start request tracking
    this.integration.getTokenTracker().startRequest(requestId, model, feature, sessionId);

    try {
      // Get stream from wrapped generator
      const stream = await this.wrapped.generateContentStream(req, userPromptId);

      // Wrap stream to track responses
      return this.wrapStreamForTracking(stream, requestId);
    } catch (error) {
      // Track error
      await this.integration.getTokenTracker().completeRequest(requestId, undefined, error as Error);
      this.updateStats('generateContentStream', false);
      throw error;
    }
  }

  async countTokens(req: CountTokensParameters): Promise<CountTokensResponse> {
    // Token counting doesn't need detailed tracking, just pass through
    return this.wrapped.countTokens(req);
  }

  async embedContent(req: EmbedContentParameters): Promise<EmbedContentResponse> {
    const requestId = randomUUID();
    const model = req.model || 'unknown';
    const feature = 'embed-content';
    const sessionId = this.integration.getSessionId();

    try {
      // Start request tracking
      this.integration.getTokenTracker().startRequest(requestId, model, feature, sessionId);

      // Make the API call
      const response = await this.wrapped.embedContent(req);

      // Complete tracking (embeddings don't have token counts in response)
      await this.integration.getTokenTracker().completeRequest(requestId);

      // Update integration stats
      this.updateStats('embedContent', true);

      return response;
    } catch (error) {
      // Track error
      await this.integration.getTokenTracker().completeRequest(requestId, undefined, error as Error);
      this.updateStats('embedContent', false);
      throw error;
    }
  }

  /**
   * Wrap streaming response for token tracking
   */
  private async *wrapStreamForTracking(
    stream: AsyncGenerator<GenerateContentResponse>,
    requestId: string,
  ): AsyncGenerator<GenerateContentResponse> {
    let finalResponse: GenerateContentResponse | undefined;
    let hasError = false;
    let error: Error | undefined;

    try {
      for await (const response of stream) {
        finalResponse = response;
        yield response;
      }

      // Stream completed successfully
      this.updateStats('generateContentStream', true);
    } catch (streamError) {
      hasError = true;
      error = streamError as Error;
      this.updateStats('generateContentStream', false);
      throw streamError;
    } finally {
      // Complete tracking with final response or error
      await this.integration.getTokenTracker().completeRequest(
        requestId,
        finalResponse,
        hasError ? error : undefined
      );
    }
  }

  /**
   * Extract feature name from request parameters
   */
  private extractFeature(req: GenerateContentParameters): string {
    // Try to determine feature from contents or config
    if (req.contents?.some(c => c.parts?.some(p => 'functionCall' in p))) {
      return 'function-calling';
    }
    if (req.config?.systemInstruction) {
      return 'chat-with-system';
    }
    return 'chat';
  }

  /**
   * Update integration statistics
   */
  private updateStats(operation: string, success: boolean): void {
    if (success) {
      this.integrationStats.tokenTracker.totalRequests++;
    } else {
      this.integrationStats.health.errors.push(`${operation} failed at ${new Date().toISOString()}`);

      // Keep only last 10 errors
      if (this.integrationStats.health.errors.length > 10) {
        this.integrationStats.health.errors = this.integrationStats.health.errors.slice(-10);
      }
    }

    // Update health status
    this.integrationStats.health.isHealthy = this.integrationStats.health.errors.length < 5;
    this.integrationStats.health.uptime = Date.now() - this.startTime.getTime();
  }

  /**
   * Initialize integration statistics
   */
  private initializeStats(): IntegrationStats {
    return {
      tokenTracker: {
        activeRequests: 0,
        totalRequests: 0,
        totalTokensProcessed: 0,
      },
      metricsCollector: {
        dataPointsCollected: 0,
        anomaliesDetected: 0,
        isCollecting: false,
      },
      streaming: {
        activeSubscriptions: 0,
        messagesSent: 0,
        isRunning: false,
      },
      cache: {
        hitRatio: 0,
        entryCount: 0,
        memoryUsage: 0,
      },
      health: {
        isHealthy: true,
        errors: [],
        uptime: 0,
      },
    };
  }

  /**
   * Get current integration statistics
   */
  getIntegrationStats(): IntegrationStats {
    // Update dynamic stats
    const tokenStats = this.integration.getTokenTracker().getUsageStats();
    const cacheStats = this.integration.getCache()?.getStats();

    this.integrationStats.tokenTracker.activeRequests = Object.keys(tokenStats.activeRequests).length;
    this.integrationStats.tokenTracker.totalTokensProcessed = tokenStats.totalTokens;

    if (cacheStats) {
      this.integrationStats.cache = {
        hitRatio: cacheStats.hitRatio,
        entryCount: cacheStats.entryCount,
        memoryUsage: cacheStats.memoryUsage,
      };
    }

    return { ...this.integrationStats };
  }
}

/**
 * Main integration class that orchestrates all monitoring components
 */
export class TokenMonitoringIntegration extends EventEmitter {
  private tokenTracker: TokenTracker;
  private metricsCollector: MetricsCollector;
  private usageCalculator: UsageCalculator;
  private eventManager: BudgetEventManager;
  private quotaManager: QuotaManager;
  private aggregator: TokenDataAggregator;
  private streamingService?: RealTimeStreamingService;
  private cache?: TokenUsageCache;

  private sessionId: string;
  private isInitialized = false;

  constructor(
    private readonly config: Config,
    private readonly budgetSettings: BudgetSettings,
    private readonly integrationConfig: MonitoringIntegrationConfig,
  ) {
    super();

    this.sessionId = integrationConfig.sessionId || randomUUID();
    this.initializeComponents();
  }

  /**
   * Initialize all monitoring components
   */
  private initializeComponents(): void {
    // Initialize core components
    this.tokenTracker = new TokenTracker({
      enableDetailedTracking: true,
      trackCosts: true,
      trackPerformance: true,
      enableLogging: this.config.getDebugMode(),
      sessionId: this.sessionId,
    });

    this.metricsCollector = new MetricsCollector({
      collectionInterval: this.integrationConfig.metricsInterval || 30000,
      enableStatisticalAnalysis: true,
      enableAnomalyDetection: true,
      enableTrendAnalysis: true,
      retentionPeriod: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    this.usageCalculator = new UsageCalculator();

    this.eventManager = new BudgetEventManager({
      enableEventBuffering: true,
      maxEventBuffer: 1000,
      enableEventPersistence: true,
      enableEventRouting: true,
    });

    this.quotaManager = new QuotaManager({
      enableRateLimiting: this.integrationConfig.enableQuotaManagement,
      enableQuotaEnforcement: true,
      enableUsageTracking: true,
      defaultRateLimitStrategy: 'sliding-window',
    });

    this.aggregator = new TokenDataAggregator({
      enableRealTimeAggregation: true,
      defaultAggregationWindow: 60000, // 1 minute
      enableStatisticalAnalysis: true,
      retentionPeriod: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    // Initialize optional components
    if (this.integrationConfig.enableStreaming) {
      this.streamingService = new RealTimeStreamingService({
        enableCompression: this.integrationConfig.streamingConfig?.enableCompression ?? true,
        maxBufferSize: this.integrationConfig.streamingConfig?.maxBufferSize ?? 10000,
        defaultUpdateFrequency: this.integrationConfig.streamingConfig?.updateFrequency ?? 1000,
        enableBandwidthMonitoring: true,
      });
    }

    if (this.integrationConfig.enableCaching) {
      this.cache = new TokenUsageCache(this.integrationConfig.cacheConfig);
    }

    this.setupEventHandlers();
  }

  /**
   * Setup event handlers for component coordination
   */
  private setupEventHandlers(): void {
    // Token tracker events
    this.tokenTracker.on('request-started', (event) => {
      this.eventManager.emitBudgetEvent({
        type: BudgetEventType.USAGE_UPDATED,
        timestamp: new Date(),
        data: { requestStarted: event },
        source: 'token-tracker',
        severity: 'info',
      });
    });

    this.tokenTracker.on('request-completed', (event) => {
      this.metricsCollector.addDataPoint({
        timestamp: new Date(),
        requestId: event.requestId,
        model: event.model,
        feature: event.feature,
        inputTokens: event.inputTokens || 0,
        outputTokens: event.outputTokens || 0,
        totalTokens: (event.inputTokens || 0) + (event.outputTokens || 0),
        cost: event.cost || 0,
        responseTime: event.responseTime || 0,
        success: event.success,
        sessionId: event.sessionId,
      });

      // Stream real-time update if enabled
      if (this.streamingService) {
        this.streamingService.broadcastUpdate('token-usage', {
          type: 'request-completed',
          data: event,
          timestamp: new Date(),
        });
      }

      this.eventManager.emitBudgetEvent({
        type: BudgetEventType.USAGE_UPDATED,
        timestamp: new Date(),
        data: { requestCompleted: event },
        source: 'token-tracker',
        severity: 'info',
      });
    });

    // Metrics collector events
    this.metricsCollector.on('anomaly-detected', (anomaly) => {
      this.eventManager.emitBudgetEvent({
        type: BudgetEventType.WARNING_THRESHOLD,
        timestamp: new Date(),
        data: { anomaly },
        source: 'metrics-collector',
        severity: 'warning',
      });

      if (this.streamingService) {
        this.streamingService.broadcastUpdate('anomaly-alert', anomaly);
      }
    });

    // Quota manager events
    this.quotaManager.on('quota-exceeded', (event) => {
      this.eventManager.emitBudgetEvent({
        type: BudgetEventType.LIMIT_EXCEEDED,
        timestamp: new Date(),
        data: { quotaExceeded: event },
        source: 'quota-manager',
        severity: 'error',
      });
    });

    // Streaming service events
    if (this.streamingService) {
      this.streamingService.on('subscription-created', (subscription) => {
        console.log(`Real-time streaming subscription created: ${subscription.id}`);
      });
    }

    // Cache events
    if (this.cache) {
      this.cache.on('cache-warning', (warning) => {
        console.warn(`Token usage cache warning: ${warning.type}`, warning);
      });
    }
  }

  /**
   * Initialize the integration system
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Start metrics collection if enabled
      if (this.integrationConfig.enableMetricsCollection) {
        this.metricsCollector.start();
      }

      // Start streaming service if enabled
      if (this.streamingService) {
        this.streamingService.start();
      }

      // Setup quota limits from budget settings
      if (this.integrationConfig.enableQuotaManagement && this.budgetSettings.dailyLimit) {
        this.quotaManager.addQuotaLimit({
          type: 'daily-requests',
          limit: this.budgetSettings.dailyLimit,
          window: 24 * 60 * 60 * 1000, // 24 hours
          resetTime: this.budgetSettings.resetTime,
        });
      }

      this.isInitialized = true;

      this.eventManager.emitBudgetEvent({
        type: BudgetEventType.SESSION_STARTED,
        timestamp: new Date(),
        data: { sessionId: this.sessionId, integrationConfig: this.integrationConfig },
        source: 'monitoring-integration',
        severity: 'info',
      });

      this.emit('initialized', { sessionId: this.sessionId });
    } catch (error) {
      this.emit('initialization-error', error);
      throw new Error(`Failed to initialize token monitoring integration: ${error}`);
    }
  }

  /**
   * Create a token-tracking wrapper for content generators
   */
  wrapContentGenerator(contentGenerator: ContentGenerator): TokenTrackingContentGenerator {
    return new TokenTrackingContentGenerator(contentGenerator, this.config, this);
  }

  /**
   * Get token tracker instance
   */
  getTokenTracker(): TokenTracker {
    return this.tokenTracker;
  }

  /**
   * Get metrics collector instance
   */
  getMetricsCollector(): MetricsCollector {
    return this.metricsCollector;
  }

  /**
   * Get usage calculator instance
   */
  getUsageCalculator(): UsageCalculator {
    return this.usageCalculator;
  }

  /**
   * Get event manager instance
   */
  getEventManager(): BudgetEventManager {
    return this.eventManager;
  }

  /**
   * Get quota manager instance
   */
  getQuotaManager(): QuotaManager {
    return this.quotaManager;
  }

  /**
   * Get data aggregator instance
   */
  getAggregator(): TokenDataAggregator {
    return this.aggregator;
  }

  /**
   * Get streaming service instance
   */
  getStreamingService(): RealTimeStreamingService | undefined {
    return this.streamingService;
  }

  /**
   * Get cache instance
   */
  getCache(): TokenUsageCache | undefined {
    return this.cache;
  }

  /**
   * Get session ID
   */
  getSessionId(): string {
    return this.sessionId;
  }

  /**
   * Check if integration is initialized
   */
  isIntegrationInitialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Get comprehensive monitoring statistics
   */
  getMonitoringStats(): {
    tokenTracker: any;
    metricsCollector: any;
    streaming?: any;
    cache?: any;
    system: any;
  } {
    const stats = {
      tokenTracker: this.tokenTracker.getUsageStats(),
      metricsCollector: this.metricsCollector.getMetricsSummary(),
      system: {
        sessionId: this.sessionId,
        initialized: this.isInitialized,
        uptime: Date.now() - (this.tokenTracker as any).createdAt?.getTime() || 0,
      },
    } as any;

    if (this.streamingService) {
      stats.streaming = {
        isRunning: true, // Would need to track this
        activeSubscriptions: 0, // Would need to expose this
      };
    }

    if (this.cache) {
      stats.cache = this.cache.getStats();
    }

    return stats;
  }

  /**
   * Shutdown the integration system gracefully
   */
  async shutdown(): Promise<void> {
    try {
      // Stop metrics collection
      this.metricsCollector.stop();

      // Stop streaming service
      if (this.streamingService) {
        this.streamingService.stop();
      }

      // Destroy cache
      if (this.cache) {
        this.cache.destroy();
      }

      // Emit shutdown event
      this.eventManager.emitBudgetEvent({
        type: BudgetEventType.SESSION_ENDED,
        timestamp: new Date(),
        data: { sessionId: this.sessionId },
        source: 'monitoring-integration',
        severity: 'info',
      });

      this.isInitialized = false;
      this.emit('shutdown', { sessionId: this.sessionId });
    } catch (error) {
      this.emit('shutdown-error', error);
      throw error;
    }
  }
}

/**
 * Create and initialize a token monitoring integration
 */
export async function createTokenMonitoringIntegration(
  config: Config,
  budgetSettings: BudgetSettings,
  integrationConfig: Partial<MonitoringIntegrationConfig> = {},
): Promise<TokenMonitoringIntegration> {
  const defaultConfig: MonitoringIntegrationConfig = {
    enableTokenTracking: true,
    enableMetricsCollection: true,
    enableStreaming: true,
    enableQuotaManagement: true,
    enableCaching: true,
    metricsInterval: 30000,
    sessionId: randomUUID(),
    ...integrationConfig,
  };

  const integration = new TokenMonitoringIntegration(
    config,
    budgetSettings,
    defaultConfig,
  );

  await integration.initialize();
  return integration;
}

/**
 * Factory function to create monitoring-enabled content generators
 */
export async function createMonitoringEnabledContentGenerator(
  baseContentGenerator: ContentGenerator,
  config: Config,
  budgetSettings: BudgetSettings,
  integrationConfig?: Partial<MonitoringIntegrationConfig>,
): Promise<{ contentGenerator: TokenTrackingContentGenerator; integration: TokenMonitoringIntegration }> {
  const integration = await createTokenMonitoringIntegration(
    config,
    budgetSettings,
    integrationConfig,
  );

  const monitoringContentGenerator = integration.wrapContentGenerator(baseContentGenerator);

  return {
    contentGenerator: monitoringContentGenerator,
    integration,
  };
}