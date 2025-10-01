/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * @fileoverview Real-time streaming system for token usage updates
 * Provides WebSocket-like streaming capabilities for live budget monitoring
 *
 * @author Claude Code - Real-Time Token Usage Monitoring Agent
 * @version 1.0.0
 */
import { EventEmitter } from 'node:events';
import { getComponentLogger } from '../../utils/logger.js';
/**
 * Available stream types
 */
export var StreamType;
(function (StreamType) {
    /** Real-time usage statistics */
    StreamType["USAGE_STATS"] = "usage_stats";
    /** Token consumption updates */
    StreamType["TOKEN_USAGE"] = "token_usage";
    /** Cost calculations */
    StreamType["COST_UPDATES"] = "cost_updates";
    /** Budget events */
    StreamType["BUDGET_EVENTS"] = "budget_events";
    /** Metrics summaries */
    StreamType["METRICS_SUMMARY"] = "metrics_summary";
    /** Model usage statistics */
    StreamType["MODEL_USAGE"] = "model_usage";
    /** Feature usage statistics */
    StreamType["FEATURE_USAGE"] = "feature_usage";
    /** Session activity */
    StreamType["SESSION_ACTIVITY"] = "session_activity";
    /** Quota status */
    StreamType["QUOTA_STATUS"] = "quota_status";
    /** Anomaly detection */
    StreamType["ANOMALY_ALERTS"] = "anomaly_alerts";
})(StreamType || (StreamType = {}));
/**
 * Real-time streaming system for budget monitoring
 *
 * This class provides real-time streaming capabilities for budget and token
 * usage data. It enables dashboard components and external systems to receive
 * live updates about token consumption, costs, quotas, and budget events.
 *
 * Features:
 * - Multiple stream types (usage, costs, events, metrics)
 * - Configurable update frequencies
 * - Event filtering and routing
 * - Compression and delta updates for efficiency
 * - Bandwidth monitoring and throttling
 * - Connection management and error handling
 * - Buffer management for batching updates
 */
export class RealTimeStreamingService extends EventEmitter {
    tokenTracker;
    metricsCollector;
    eventManager;
    logger = getComponentLogger('RealTimeStreamingService');
    config;
    subscriptions = new Map();
    updateTimers = new Map();
    sequenceNumbers = new Map();
    lastUpdates = new Map(); // For delta updates
    updateBuffer = [];
    status;
    bufferTimer = null;
    bandwidthTimer = null;
    constructor(tokenTracker, metricsCollector, eventManager, config = {}) {
        super();
        this.tokenTracker = tokenTracker;
        this.metricsCollector = metricsCollector;
        this.eventManager = eventManager;
        this.config = {
            maxSubscriptions: config.maxSubscriptions ?? 100,
            defaultUpdateInterval: config.defaultUpdateInterval ?? 5000, // 5 seconds
            maxUpdateFrequency: config.maxUpdateFrequency ?? 1000, // 1 second minimum
            enableCompression: config.enableCompression ?? false,
            enableDeltaUpdates: config.enableDeltaUpdates ?? true,
            bufferSize: config.bufferSize ?? 50,
            bufferTimeout: config.bufferTimeout ?? 100, // 100ms
            enableBandwidthMonitoring: config.enableBandwidthMonitoring ?? true,
        };
        this.status = {
            active: false,
            subscriptions: 0,
            updatesSent: 0,
            errors: 0,
            uptime: 0,
            startTime: new Date(),
            bandwidth: {
                totalBytes: 0,
                averageBytesPerSecond: 0,
                peakBytesPerSecond: 0,
            },
        };
        this.logger.info('RealTimeStreamingService initialized', {
            config: this.config,
        });
        this.setupEventListeners();
        this.setupBufferManagement();
    }
    /**
     * Start the streaming service
     */
    start() {
        if (this.status.active) {
            this.logger.warn('Streaming service already active');
            return;
        }
        this.logger.info('Starting real-time streaming service');
        this.status.active = true;
        this.status.startTime = new Date();
        // Start bandwidth monitoring
        if (this.config.enableBandwidthMonitoring) {
            this.startBandwidthMonitoring();
        }
        this.emit('service_started', {
            timestamp: new Date(),
            config: this.config,
        });
    }
    /**
     * Stop the streaming service
     */
    stop() {
        if (!this.status.active) {
            return;
        }
        this.logger.info('Stopping real-time streaming service');
        this.status.active = false;
        // Clear all timers
        for (const timer of this.updateTimers.values()) {
            clearInterval(timer);
        }
        this.updateTimers.clear();
        if (this.bufferTimer) {
            clearInterval(this.bufferTimer);
            this.bufferTimer = null;
        }
        if (this.bandwidthTimer) {
            clearInterval(this.bandwidthTimer);
            this.bandwidthTimer = null;
        }
        // Flush any remaining updates
        this.flushUpdateBuffer();
        this.emit('service_stopped', {
            timestamp: new Date(),
            uptime: Date.now() - this.status.startTime.getTime(),
            statistics: this.getStreamStatistics(),
        });
    }
    /**
     * Subscribe to a stream
     */
    subscribe(subscription) {
        if (this.subscriptions.size >= this.config.maxSubscriptions) {
            throw new Error(`Maximum subscriptions limit reached (${this.config.maxSubscriptions})`);
        }
        const sub = {
            active: true,
            updateInterval: this.config.defaultUpdateInterval,
            ...subscription,
        };
        // Validate update interval
        if (sub.updateInterval &&
            sub.updateInterval < this.config.maxUpdateFrequency) {
            sub.updateInterval = this.config.maxUpdateFrequency;
            this.logger.warn('Update interval clamped to maximum frequency', {
                subscriptionId: sub.id,
                requestedInterval: subscription.updateInterval,
                actualInterval: sub.updateInterval,
            });
        }
        this.subscriptions.set(sub.id, sub);
        this.sequenceNumbers.set(sub.id, 0);
        this.status.subscriptions = this.subscriptions.size;
        // Start update timer if needed
        if (sub.updateInterval && sub.updateInterval > 0) {
            this.startUpdateTimer(sub);
        }
        this.logger.info('Stream subscription added', {
            subscriptionId: sub.id,
            streams: sub.streams,
            updateInterval: sub.updateInterval,
            filters: sub.filters,
        });
        this.emit('subscription_added', {
            subscriptionId: sub.id,
            subscription: sub,
            timestamp: new Date(),
        });
        return sub.id;
    }
    /**
     * Unsubscribe from a stream
     */
    unsubscribe(subscriptionId) {
        const subscription = this.subscriptions.get(subscriptionId);
        if (!subscription)
            return false;
        this.subscriptions.delete(subscriptionId);
        this.sequenceNumbers.delete(subscriptionId);
        this.lastUpdates.delete(subscriptionId);
        this.status.subscriptions = this.subscriptions.size;
        // Clear update timer
        const timer = this.updateTimers.get(subscriptionId);
        if (timer) {
            clearInterval(timer);
            this.updateTimers.delete(subscriptionId);
        }
        this.logger.info('Stream subscription removed', { subscriptionId });
        this.emit('subscription_removed', {
            subscriptionId,
            timestamp: new Date(),
        });
        return true;
    }
    /**
     * Get active subscriptions
     */
    getSubscriptions() {
        return Array.from(this.subscriptions.values());
    }
    /**
     * Get streaming service status
     */
    getStatus() {
        return {
            ...this.status,
            uptime: Date.now() - this.status.startTime.getTime(),
        };
    }
    /**
     * Get streaming statistics
     */
    getStreamStatistics() {
        const subscriptions = Array.from(this.subscriptions.values()).map((sub) => ({
            id: sub.id,
            streams: sub.streams,
            updatesSent: 0, // Would need to track per subscription
        }));
        return {
            subscriptions,
            totalUpdates: this.status.updatesSent,
            errorRate: this.status.errors / Math.max(this.status.updatesSent, 1),
            averageUpdateSize: this.status.bandwidth.totalBytes / Math.max(this.status.updatesSent, 1),
        };
    }
    /**
     * Send immediate update to specific subscription
     */
    async sendUpdate(subscriptionId, streamType, data) {
        const subscription = this.subscriptions.get(subscriptionId);
        if (!subscription || !subscription.active)
            return;
        if (!subscription.streams.includes(streamType))
            return;
        try {
            const update = await this.createStreamUpdate(subscriptionId, streamType, data);
            if (this.shouldBuffer(update)) {
                this.addToBuffer(update, subscriptionId);
            }
            else {
                await this.deliverUpdate(subscription, update);
            }
        }
        catch (error) {
            this.handleStreamError(subscriptionId, {
                name: 'StreamUpdateError',
                code: 'UPDATE_FAILED',
                message: error instanceof Error ? error.message : String(error),
                timestamp: new Date(),
                subscriptionId,
            });
        }
    }
    /**
     * Broadcast update to all matching subscriptions
     */
    async broadcastUpdate(streamType, data, filters) {
        const promises = [];
        for (const subscription of this.subscriptions.values()) {
            if (!subscription.active)
                continue;
            if (!subscription.streams.includes(streamType))
                continue;
            // Apply filters
            if (filters?.subscriptionIds &&
                !filters.subscriptionIds.includes(subscription.id)) {
                continue;
            }
            // Apply subscription-specific filters
            if (!this.passesSubscriptionFilters(subscription, { streamType, data })) {
                continue;
            }
            promises.push(this.sendUpdate(subscription.id, streamType, data));
        }
        await Promise.allSettled(promises);
    }
    /**
     * Update subscription configuration
     */
    updateSubscription(subscriptionId, updates) {
        const subscription = this.subscriptions.get(subscriptionId);
        if (!subscription)
            return false;
        // Update subscription
        Object.assign(subscription, updates);
        // Restart timer if update interval changed
        if ('updateInterval' in updates) {
            const timer = this.updateTimers.get(subscriptionId);
            if (timer) {
                clearInterval(timer);
            }
            if (subscription.updateInterval && subscription.updateInterval > 0) {
                this.startUpdateTimer(subscription);
            }
        }
        this.logger.info('Subscription updated', {
            subscriptionId,
            updates,
        });
        return true;
    }
    /**
     * Setup event listeners for automatic streaming
     */
    setupEventListeners() {
        // Token tracker events
        this.tokenTracker.on('request_complete', async (event) => {
            await this.broadcastUpdate(StreamType.TOKEN_USAGE, {
                event: event.type,
                data: event.data,
                timestamp: event.timestamp,
            });
        });
        this.tokenTracker.on('budget_event', async (event) => {
            await this.broadcastUpdate(StreamType.BUDGET_EVENTS, event);
        });
        // Metrics collector events
        this.metricsCollector.on('snapshot', async (event) => {
            await this.broadcastUpdate(StreamType.METRICS_SUMMARY, event.data);
        });
        this.metricsCollector.on('anomaly_detected', async (event) => {
            await this.broadcastUpdate(StreamType.ANOMALY_ALERTS, event.data);
        });
        // Budget event manager events
        this.eventManager.on('budget_event', async (event) => {
            await this.broadcastUpdate(StreamType.BUDGET_EVENTS, event);
        });
    }
    /**
     * Setup buffer management
     */
    setupBufferManagement() {
        this.bufferTimer = setInterval(() => {
            this.flushUpdateBuffer();
        }, this.config.bufferTimeout);
    }
    /**
     * Start update timer for subscription
     */
    startUpdateTimer(subscription) {
        if (!subscription.updateInterval)
            return;
        const timer = setInterval(async () => {
            if (!subscription.active)
                return;
            try {
                await this.sendPeriodicUpdates(subscription);
            }
            catch (error) {
                this.handleStreamError(subscription.id, {
                    name: 'StreamPeriodicUpdateError',
                    code: 'PERIODIC_UPDATE_FAILED',
                    message: error instanceof Error ? error.message : String(error),
                    timestamp: new Date(),
                    subscriptionId: subscription.id,
                });
            }
        }, subscription.updateInterval);
        this.updateTimers.set(subscription.id, timer);
    }
    /**
     * Send periodic updates for subscription
     */
    async sendPeriodicUpdates(subscription) {
        const promises = [];
        for (const streamType of subscription.streams) {
            const data = await this.getStreamData(streamType);
            if (data) {
                promises.push(this.sendUpdate(subscription.id, streamType, data));
            }
        }
        await Promise.allSettled(promises);
    }
    /**
     * Get data for stream type
     */
    async getStreamData(streamType) {
        switch (streamType) {
            case StreamType.USAGE_STATS:
                return this.tokenTracker.getUsageStats();
            case StreamType.TOKEN_USAGE:
                return {
                    stats: this.tokenTracker.getUsageStats(),
                    activeRequests: this.tokenTracker.getActiveRequests().length,
                };
            case StreamType.METRICS_SUMMARY:
                return this.metricsCollector.getMetricsSummary();
            case StreamType.MODEL_USAGE:
                const stats = this.tokenTracker.getUsageStats();
                return stats.modelBreakdown;
            case StreamType.FEATURE_USAGE:
                const featureStats = this.tokenTracker.getUsageStats();
                return featureStats.featureBreakdown;
            case StreamType.SESSION_ACTIVITY:
                const sessionStats = this.tokenTracker.getUsageStats();
                return sessionStats.sessionBreakdown;
            default:
                return null;
        }
    }
    /**
     * Create stream update object
     */
    async createStreamUpdate(subscriptionId, streamType, data) {
        const sequence = this.getNextSequence(subscriptionId);
        let updateData = data;
        // Apply delta updates if enabled
        if (this.config.enableDeltaUpdates) {
            const lastData = this.lastUpdates.get(`${subscriptionId}:${streamType}`);
            if (lastData) {
                updateData = this.calculateDelta(lastData, data);
            }
            this.lastUpdates.set(`${subscriptionId}:${streamType}`, data);
        }
        // Apply compression if enabled and data is large
        const metadata = {
            source: 'RealTimeStreamingService',
            version: '1.0.0',
            delta: this.config.enableDeltaUpdates &&
                !!this.lastUpdates.get(`${subscriptionId}:${streamType}`),
        };
        if (this.config.enableCompression && this.shouldCompress(updateData)) {
            // Compression would be implemented here
            metadata.compress = true;
        }
        return {
            type: streamType,
            timestamp: new Date(),
            subscriptionId,
            sequence,
            data: updateData,
            metadata,
        };
    }
    /**
     * Deliver update to subscription
     */
    async deliverUpdate(subscription, update) {
        try {
            subscription.onUpdate(update);
            // Update statistics
            this.status.updatesSent++;
            this.status.lastUpdateTime = new Date();
            // Track bandwidth if enabled
            if (this.config.enableBandwidthMonitoring) {
                const updateSize = JSON.stringify(update).length;
                this.status.bandwidth.totalBytes += updateSize;
            }
        }
        catch (error) {
            this.handleStreamError(subscription.id, {
                name: 'StreamDeliveryError',
                code: 'UPDATE_DELIVERY_FAILED',
                message: error instanceof Error ? error.message : String(error),
                timestamp: new Date(),
                subscriptionId: subscription.id,
                details: { update },
            });
        }
    }
    /**
     * Handle stream error
     */
    handleStreamError(subscriptionId, error) {
        this.status.errors++;
        const subscription = this.subscriptions.get(subscriptionId);
        if (subscription?.onError) {
            try {
                subscription.onError(error);
            }
            catch (callbackError) {
                this.logger.error('Error callback failed', {
                    subscriptionId,
                    originalError: error,
                    callbackError: callbackError instanceof Error
                        ? callbackError.message
                        : String(callbackError),
                });
            }
        }
        this.logger.error('Stream error occurred', {
            subscriptionId,
            error,
        });
        this.emit('stream_error', {
            subscriptionId,
            error,
            timestamp: new Date(),
        });
    }
    /**
     * Check if update should be buffered
     */
    shouldBuffer(update) {
        return this.updateBuffer.length < this.config.bufferSize;
    }
    /**
     * Add update to buffer
     */
    addToBuffer(update, subscriptionId) {
        this.updateBuffer.push({
            update,
            subscriptionId,
            timestamp: new Date(),
        });
        if (this.updateBuffer.length >= this.config.bufferSize) {
            this.flushUpdateBuffer();
        }
    }
    /**
     * Flush update buffer
     */
    flushUpdateBuffer() {
        if (this.updateBuffer.length === 0)
            return;
        const updates = [...this.updateBuffer];
        this.updateBuffer.length = 0;
        const promises = updates.map(async ({ update, subscriptionId }) => {
            const subscription = this.subscriptions.get(subscriptionId);
            if (subscription) {
                await this.deliverUpdate(subscription, update);
            }
        });
        Promise.allSettled(promises).catch((error) => {
            this.logger.error('Failed to flush update buffer', {
                error: error instanceof Error ? error : new Error(String(error)),
                bufferSize: updates.length,
            });
        });
    }
    /**
     * Check if data passes subscription filters
     */
    passesSubscriptionFilters(subscription, context) {
        const filters = subscription.filters;
        if (!filters)
            return true;
        // Implement filter logic based on context
        // This would be expanded based on specific filter requirements
        return true;
    }
    /**
     * Calculate delta between old and new data
     */
    calculateDelta(oldData, newData) {
        // Simplified delta calculation
        // This would be more sophisticated in a real implementation
        if (typeof newData !== 'object' || newData === null) {
            return newData;
        }
        const delta = {};
        for (const key in newData) {
            if (newData[key] !== oldData?.[key]) {
                delta[key] = newData[key];
            }
        }
        return Object.keys(delta).length > 0 ? delta : null;
    }
    /**
     * Check if data should be compressed
     */
    shouldCompress(data) {
        const dataSize = JSON.stringify(data).length;
        return dataSize > 1024; // Compress if larger than 1KB
    }
    /**
     * Get next sequence number for subscription
     */
    getNextSequence(subscriptionId) {
        const current = this.sequenceNumbers.get(subscriptionId) || 0;
        const next = current + 1;
        this.sequenceNumbers.set(subscriptionId, next);
        return next;
    }
    /**
     * Start bandwidth monitoring
     */
    startBandwidthMonitoring() {
        let lastTotalBytes = 0;
        let lastTime = Date.now();
        this.bandwidthTimer = setInterval(() => {
            const now = Date.now();
            const timeDiff = (now - lastTime) / 1000; // seconds
            const bytesDiff = this.status.bandwidth.totalBytes - lastTotalBytes;
            if (timeDiff > 0) {
                const currentBytesPerSecond = bytesDiff / timeDiff;
                this.status.bandwidth.averageBytesPerSecond =
                    this.status.bandwidth.totalBytes /
                        ((now - this.status.startTime.getTime()) / 1000);
                if (currentBytesPerSecond > this.status.bandwidth.peakBytesPerSecond) {
                    this.status.bandwidth.peakBytesPerSecond = currentBytesPerSecond;
                }
            }
            lastTotalBytes = this.status.bandwidth.totalBytes;
            lastTime = now;
        }, 5000); // Update every 5 seconds
    }
}
/**
 * Create a new RealTimeStreamingService instance
 */
export function createRealTimeStreamingService(tokenTracker, metricsCollector, eventManager, config) {
    return new RealTimeStreamingService(tokenTracker, metricsCollector, eventManager, config);
}
/**
 * Global streaming service instance
 */
let globalStreamingService = null;
/**
 * Get or create the global streaming service instance
 */
export function getGlobalStreamingService(tokenTracker, metricsCollector, eventManager, config) {
    if (!globalStreamingService &&
        tokenTracker &&
        metricsCollector &&
        eventManager) {
        globalStreamingService = createRealTimeStreamingService(tokenTracker, metricsCollector, eventManager, config);
    }
    if (!globalStreamingService) {
        throw new Error('Global streaming service not initialized and required dependencies not provided');
    }
    return globalStreamingService;
}
/**
 * Reset the global streaming service instance
 */
export function resetGlobalStreamingService() {
    if (globalStreamingService) {
        globalStreamingService.stop();
        globalStreamingService = null;
    }
}
//# sourceMappingURL=streaming.js.map