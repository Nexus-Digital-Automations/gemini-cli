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
 * Content generator wrapper that adds comprehensive token tracking
 */
export class TokenTrackingContentGenerator {
    wrapped;
    config;
    integration;
    integrationStats;
    startTime;
    constructor(wrapped, config, integration) {
        this.wrapped = wrapped;
        this.config = config;
        this.integration = integration;
        this.startTime = new Date();
        this.integrationStats = this.initializeStats();
    }
    get userTier() {
        return this.wrapped.userTier;
    }
    async generateContent(req, userPromptId) {
        const requestId = randomUUID();
        const model = req.model || 'unknown';
        const feature = this.extractFeature(req);
        const sessionId = this.integration.getSessionId();
        try {
            // Start request tracking
            this.integration
                .getTokenTracker()
                .startRequest(requestId, model, feature, sessionId);
            // Make the API call
            const response = await this.wrapped.generateContent(req, userPromptId);
            // Complete tracking with response
            await this.integration
                .getTokenTracker()
                .completeRequest(requestId, response);
            // Update integration stats
            this.updateStats('generateContent', true);
            return response;
        }
        catch (error) {
            // Track error
            await this.integration
                .getTokenTracker()
                .completeRequest(requestId, undefined, error);
            this.updateStats('generateContent', false);
            throw error;
        }
    }
    async generateContentStream(req, userPromptId) {
        const requestId = randomUUID();
        const model = req.model || 'unknown';
        const feature = this.extractFeature(req);
        const sessionId = this.integration.getSessionId();
        // Start request tracking
        this.integration
            .getTokenTracker()
            .startRequest(requestId, model, feature, sessionId);
        try {
            // Get stream from wrapped generator
            const stream = await this.wrapped.generateContentStream(req, userPromptId);
            // Wrap stream to track responses
            return this.wrapStreamForTracking(stream, requestId);
        }
        catch (error) {
            // Track error
            await this.integration
                .getTokenTracker()
                .completeRequest(requestId, undefined, error);
            this.updateStats('generateContentStream', false);
            throw error;
        }
    }
    async countTokens(req) {
        // Token counting doesn't need detailed tracking, just pass through
        return this.wrapped.countTokens(req);
    }
    async embedContent(req) {
        const requestId = randomUUID();
        const model = req.model || 'unknown';
        const feature = 'embed-content';
        const sessionId = this.integration.getSessionId();
        try {
            // Start request tracking
            this.integration
                .getTokenTracker()
                .startRequest(requestId, model, feature, sessionId);
            // Make the API call
            const response = await this.wrapped.embedContent(req);
            // Complete tracking (embeddings don't have token counts in response)
            await this.integration.getTokenTracker().completeRequest(requestId);
            // Update integration stats
            this.updateStats('embedContent', true);
            return response;
        }
        catch (error) {
            // Track error
            await this.integration
                .getTokenTracker()
                .completeRequest(requestId, undefined, error);
            this.updateStats('embedContent', false);
            throw error;
        }
    }
    /**
     * Wrap streaming response for token tracking
     */
    async *wrapStreamForTracking(stream, requestId) {
        let finalResponse;
        let hasError = false;
        let error;
        try {
            for await (const response of stream) {
                finalResponse = response;
                yield response;
            }
            // Stream completed successfully
            this.updateStats('generateContentStream', true);
        }
        catch (streamError) {
            hasError = true;
            error = streamError;
            this.updateStats('generateContentStream', false);
            throw streamError;
        }
        finally {
            // Complete tracking with final response or error
            await this.integration
                .getTokenTracker()
                .completeRequest(requestId, finalResponse, hasError ? error : undefined);
        }
    }
    /**
     * Extract feature name from request parameters
     */
    extractFeature(req) {
        // Try to determine feature from contents or config
        if (req.contents?.some((c) => c.parts?.some((p) => 'functionCall' in p))) {
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
    updateStats(operation, success) {
        if (success) {
            this.integrationStats.tokenTracker.totalRequests++;
        }
        else {
            this.integrationStats.health.errors.push(`${operation} failed at ${new Date().toISOString()}`);
            // Keep only last 10 errors
            if (this.integrationStats.health.errors.length > 10) {
                this.integrationStats.health.errors =
                    this.integrationStats.health.errors.slice(-10);
            }
        }
        // Update health status
        this.integrationStats.health.isHealthy =
            this.integrationStats.health.errors.length < 5;
        this.integrationStats.health.uptime = Date.now() - this.startTime.getTime();
    }
    /**
     * Initialize integration statistics
     */
    initializeStats() {
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
    getIntegrationStats() {
        // Update dynamic stats
        const tokenStats = this.integration.getTokenTracker().getUsageStats();
        const cacheStats = this.integration.getCache()?.getStats();
        this.integrationStats.tokenTracker.activeRequests = Object.keys(tokenStats.activeRequests).length;
        this.integrationStats.tokenTracker.totalTokensProcessed =
            tokenStats.totalTokens;
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
    config;
    budgetSettings;
    integrationConfig;
    tokenTracker;
    metricsCollector;
    usageCalculator;
    eventManager;
    quotaManager;
    aggregator;
    streamingService;
    cache;
    sessionId;
    isInitialized = false;
    constructor(config, budgetSettings, integrationConfig) {
        super();
        this.config = config;
        this.budgetSettings = budgetSettings;
        this.integrationConfig = integrationConfig;
        this.sessionId = integrationConfig.sessionId || randomUUID();
        this.initializeComponents();
    }
    /**
     * Initialize all monitoring components
     */
    initializeComponents() {
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
    setupEventHandlers() {
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
    async initialize() {
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
            if (this.integrationConfig.enableQuotaManagement &&
                this.budgetSettings.dailyLimit) {
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
                data: {
                    sessionId: this.sessionId,
                    integrationConfig: this.integrationConfig,
                },
                source: 'monitoring-integration',
                severity: 'info',
            });
            this.emit('initialized', { sessionId: this.sessionId });
        }
        catch (error) {
            this.emit('initialization-error', error);
            throw new Error(`Failed to initialize token monitoring integration: ${error}`);
        }
    }
    /**
     * Create a token-tracking wrapper for content generators
     */
    wrapContentGenerator(contentGenerator) {
        return new TokenTrackingContentGenerator(contentGenerator, this.config, this);
    }
    /**
     * Get token tracker instance
     */
    getTokenTracker() {
        return this.tokenTracker;
    }
    /**
     * Get metrics collector instance
     */
    getMetricsCollector() {
        return this.metricsCollector;
    }
    /**
     * Get usage calculator instance
     */
    getUsageCalculator() {
        return this.usageCalculator;
    }
    /**
     * Get event manager instance
     */
    getEventManager() {
        return this.eventManager;
    }
    /**
     * Get quota manager instance
     */
    getQuotaManager() {
        return this.quotaManager;
    }
    /**
     * Get data aggregator instance
     */
    getAggregator() {
        return this.aggregator;
    }
    /**
     * Get streaming service instance
     */
    getStreamingService() {
        return this.streamingService;
    }
    /**
     * Get cache instance
     */
    getCache() {
        return this.cache;
    }
    /**
     * Get session ID
     */
    getSessionId() {
        return this.sessionId;
    }
    /**
     * Check if integration is initialized
     */
    isIntegrationInitialized() {
        return this.isInitialized;
    }
    /**
     * Get comprehensive monitoring statistics
     */
    getMonitoringStats() {
        const stats = {
            tokenTracker: this.tokenTracker.getUsageStats(),
            metricsCollector: this.metricsCollector.getMetricsSummary(),
            system: {
                sessionId: this.sessionId,
                initialized: this.isInitialized,
                uptime: Date.now() - this.tokenTracker.createdAt?.getTime() || 0,
            },
        };
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
    async shutdown() {
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
        }
        catch (error) {
            this.emit('shutdown-error', error);
            throw error;
        }
    }
}
/**
 * Create and initialize a token monitoring integration
 */
export async function createTokenMonitoringIntegration(config, budgetSettings, integrationConfig = {}) {
    const defaultConfig = {
        enableTokenTracking: true,
        enableMetricsCollection: true,
        enableStreaming: true,
        enableQuotaManagement: true,
        enableCaching: true,
        metricsInterval: 30000,
        sessionId: randomUUID(),
        ...integrationConfig,
    };
    const integration = new TokenMonitoringIntegration(config, budgetSettings, defaultConfig);
    await integration.initialize();
    return integration;
}
/**
 * Factory function to create monitoring-enabled content generators
 */
export async function createMonitoringEnabledContentGenerator(baseContentGenerator, config, budgetSettings, integrationConfig) {
    const integration = await createTokenMonitoringIntegration(config, budgetSettings, integrationConfig);
    const monitoringContentGenerator = integration.wrapContentGenerator(baseContentGenerator);
    return {
        contentGenerator: monitoringContentGenerator,
        integration,
    };
}
//# sourceMappingURL=integration.js.map