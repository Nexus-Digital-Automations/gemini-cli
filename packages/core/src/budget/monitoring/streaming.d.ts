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
import type { TokenTracker } from './token-tracker.js';
import type { MetricsCollector } from './metrics-collector.js';
import type { BudgetEventManager } from './events.js';
import type { BudgetEventType, EventSeverity } from '../types.js';
/**
 * Stream subscription configuration
 */
export interface StreamSubscription {
    /** Unique subscription ID */
    id: string;
    /** Stream types to subscribe to */
    streams: StreamType[];
    /** Update frequency in milliseconds */
    updateInterval?: number;
    /** Event filters */
    filters?: {
        eventTypes?: BudgetEventType[];
        severities?: EventSeverity[];
        models?: string[];
        features?: string[];
        sessions?: string[];
    };
    /** Callback for stream updates */
    onUpdate: (update: StreamUpdate) => void;
    /** Callback for errors */
    onError?: (error: StreamError) => void;
    /** Whether subscription is active */
    active: boolean;
    /** Subscription metadata */
    metadata?: Record<string, any>;
}
/**
 * Available stream types
 */
export declare enum StreamType {
    /** Real-time usage statistics */
    USAGE_STATS = "usage_stats",
    /** Token consumption updates */
    TOKEN_USAGE = "token_usage",
    /** Cost calculations */
    COST_UPDATES = "cost_updates",
    /** Budget events */
    BUDGET_EVENTS = "budget_events",
    /** Metrics summaries */
    METRICS_SUMMARY = "metrics_summary",
    /** Model usage statistics */
    MODEL_USAGE = "model_usage",
    /** Feature usage statistics */
    FEATURE_USAGE = "feature_usage",
    /** Session activity */
    SESSION_ACTIVITY = "session_activity",
    /** Quota status */
    QUOTA_STATUS = "quota_status",
    /** Anomaly detection */
    ANOMALY_ALERTS = "anomaly_alerts"
}
/**
 * Stream update data structure
 */
export interface StreamUpdate {
    /** Update type */
    type: StreamType;
    /** Update timestamp */
    timestamp: Date;
    /** Subscription ID */
    subscriptionId: string;
    /** Update sequence number */
    sequence: number;
    /** Update data */
    data: any;
    /** Update metadata */
    metadata?: {
        source?: string;
        version?: string;
        delta?: boolean;
        compress?: boolean;
    };
}
/**
 * Stream error information
 */
export interface StreamError {
    /** Error code */
    code: string;
    /** Error message */
    message: string;
    /** Error timestamp */
    timestamp: Date;
    /** Subscription ID that caused error */
    subscriptionId?: string;
    /** Error details */
    details?: Record<string, any>;
}
/**
 * Stream connection status
 */
export interface StreamStatus {
    /** Whether streaming is active */
    active: boolean;
    /** Number of active subscriptions */
    subscriptions: number;
    /** Number of updates sent */
    updatesSent: number;
    /** Number of errors occurred */
    errors: number;
    /** Uptime in milliseconds */
    uptime: number;
    /** Start time */
    startTime: Date;
    /** Last update time */
    lastUpdateTime?: Date;
    /** Bandwidth usage statistics */
    bandwidth: {
        totalBytes: number;
        averageBytesPerSecond: number;
        peakBytesPerSecond: number;
    };
}
/**
 * Stream configuration
 */
export interface StreamingConfig {
    /** Maximum number of concurrent subscriptions */
    maxSubscriptions?: number;
    /** Default update interval in milliseconds */
    defaultUpdateInterval?: number;
    /** Maximum update frequency (minimum interval) */
    maxUpdateFrequency?: number;
    /** Enable compression for large updates */
    enableCompression?: boolean;
    /** Enable delta updates */
    enableDeltaUpdates?: boolean;
    /** Buffer size for batching updates */
    bufferSize?: number;
    /** Buffer timeout in milliseconds */
    bufferTimeout?: number;
    /** Enable bandwidth monitoring */
    enableBandwidthMonitoring?: boolean;
}
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
export declare class RealTimeStreamingService extends EventEmitter {
    private readonly tokenTracker;
    private readonly metricsCollector;
    private readonly eventManager;
    private readonly logger;
    private readonly config;
    private readonly subscriptions;
    private readonly updateTimers;
    private readonly sequenceNumbers;
    private readonly lastUpdates;
    private readonly updateBuffer;
    private status;
    private bufferTimer;
    private bandwidthTimer;
    constructor(tokenTracker: TokenTracker, metricsCollector: MetricsCollector, eventManager: BudgetEventManager, config?: StreamingConfig);
    /**
     * Start the streaming service
     */
    start(): void;
    /**
     * Stop the streaming service
     */
    stop(): void;
    /**
     * Subscribe to a stream
     */
    subscribe(subscription: Omit<StreamSubscription, 'active'>): string;
    /**
     * Unsubscribe from a stream
     */
    unsubscribe(subscriptionId: string): boolean;
    /**
     * Get active subscriptions
     */
    getSubscriptions(): StreamSubscription[];
    /**
     * Get streaming service status
     */
    getStatus(): StreamStatus;
    /**
     * Get streaming statistics
     */
    getStreamStatistics(): {
        subscriptions: Array<{
            id: string;
            streams: StreamType[];
            updatesSent: number;
        }>;
        totalUpdates: number;
        errorRate: number;
        averageUpdateSize: number;
    };
    /**
     * Send immediate update to specific subscription
     */
    sendUpdate(subscriptionId: string, streamType: StreamType, data: any): Promise<void>;
    /**
     * Broadcast update to all matching subscriptions
     */
    broadcastUpdate(streamType: StreamType, data: any, filters?: {
        subscriptionIds?: string[];
        eventTypes?: BudgetEventType[];
        severities?: EventSeverity[];
    }): Promise<void>;
    /**
     * Update subscription configuration
     */
    updateSubscription(subscriptionId: string, updates: Partial<StreamSubscription>): boolean;
    /**
     * Setup event listeners for automatic streaming
     */
    private setupEventListeners;
    /**
     * Setup buffer management
     */
    private setupBufferManagement;
    /**
     * Start update timer for subscription
     */
    private startUpdateTimer;
    /**
     * Send periodic updates for subscription
     */
    private sendPeriodicUpdates;
    /**
     * Get data for stream type
     */
    private getStreamData;
    /**
     * Create stream update object
     */
    private createStreamUpdate;
    /**
     * Deliver update to subscription
     */
    private deliverUpdate;
    /**
     * Handle stream error
     */
    private handleStreamError;
    /**
     * Check if update should be buffered
     */
    private shouldBuffer;
    /**
     * Add update to buffer
     */
    private addToBuffer;
    /**
     * Flush update buffer
     */
    private flushUpdateBuffer;
    /**
     * Check if data passes subscription filters
     */
    private passesSubscriptionFilters;
    /**
     * Calculate delta between old and new data
     */
    private calculateDelta;
    /**
     * Check if data should be compressed
     */
    private shouldCompress;
    /**
     * Get next sequence number for subscription
     */
    private getNextSequence;
    /**
     * Start bandwidth monitoring
     */
    private startBandwidthMonitoring;
}
/**
 * Create a new RealTimeStreamingService instance
 */
export declare function createRealTimeStreamingService(tokenTracker: TokenTracker, metricsCollector: MetricsCollector, eventManager: BudgetEventManager, config?: StreamingConfig): RealTimeStreamingService;
/**
 * Get or create the global streaming service instance
 */
export declare function getGlobalStreamingService(tokenTracker?: TokenTracker, metricsCollector?: MetricsCollector, eventManager?: BudgetEventManager, config?: StreamingConfig): RealTimeStreamingService;
/**
 * Reset the global streaming service instance
 */
export declare function resetGlobalStreamingService(): void;
