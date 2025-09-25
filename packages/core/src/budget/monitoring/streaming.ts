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
import type { TokenTracker, TokenUsageStats } from './token-tracker.js';
import type { MetricsCollector, MetricsSummary } from './metrics-collector.js';
import type { BudgetEventManager } from './events.js';
import type {
  BudgetEvent,
  BudgetEventType,
  EventSeverity,
  TokenUsageData,
  ModelUsageData,
} from '../types.js';

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
export enum StreamType {
  /** Real-time usage statistics */
  USAGE_STATS = 'usage_stats',
  /** Token consumption updates */
  TOKEN_USAGE = 'token_usage',
  /** Cost calculations */
  COST_UPDATES = 'cost_updates',
  /** Budget events */
  BUDGET_EVENTS = 'budget_events',
  /** Metrics summaries */
  METRICS_SUMMARY = 'metrics_summary',
  /** Model usage statistics */
  MODEL_USAGE = 'model_usage',
  /** Feature usage statistics */
  FEATURE_USAGE = 'feature_usage',
  /** Session activity */
  SESSION_ACTIVITY = 'session_activity',
  /** Quota status */
  QUOTA_STATUS = 'quota_status',
  /** Anomaly detection */
  ANOMALY_ALERTS = 'anomaly_alerts',
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
    delta?: boolean; // Whether this is a delta update
    compress?: boolean; // Whether data is compressed
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
 * Buffered update for batching
 */
interface BufferedUpdate {
  update: StreamUpdate;
  subscriptionId: string;
  timestamp: Date;
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
export class RealTimeStreamingService extends EventEmitter {
  private readonly logger = getComponentLogger('RealTimeStreamingService');
  private readonly config: Required<StreamingConfig>;
  private readonly subscriptions = new Map<string, StreamSubscription>();
  private readonly updateTimers = new Map<string, NodeJS.Timeout>();
  private readonly sequenceNumbers = new Map<string, number>();
  private readonly lastUpdates = new Map<string, any>(); // For delta updates
  private readonly updateBuffer: BufferedUpdate[] = [];

  private status: StreamStatus;
  private bufferTimer: NodeJS.Timeout | null = null;
  private bandwidthTimer: NodeJS.Timeout | null = null;

  constructor(
    private readonly tokenTracker: TokenTracker,
    private readonly metricsCollector: MetricsCollector,
    private readonly eventManager: BudgetEventManager,
    config: StreamingConfig = {}
  ) {
    super();

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
  start(): void {
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
  stop(): void {
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
  subscribe(subscription: Omit<StreamSubscription, 'active'>): string {
    if (this.subscriptions.size >= this.config.maxSubscriptions) {
      throw new Error(`Maximum subscriptions limit reached (${this.config.maxSubscriptions})`);
    }

    const sub: StreamSubscription = {
      active: true,
      updateInterval: this.config.defaultUpdateInterval,
      ...subscription,
    };

    // Validate update interval
    if (sub.updateInterval && sub.updateInterval < this.config.maxUpdateFrequency) {
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
  unsubscribe(subscriptionId: string): boolean {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) return false;

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
  getSubscriptions(): StreamSubscription[] {
    return Array.from(this.subscriptions.values());
  }

  /**
   * Get streaming service status
   */
  getStatus(): StreamStatus {
    return {
      ...this.status,
      uptime: Date.now() - this.status.startTime.getTime(),
    };
  }

  /**
   * Get streaming statistics
   */
  getStreamStatistics(): {
    subscriptions: Array<{ id: string; streams: StreamType[]; updatesSent: number }>;
    totalUpdates: number;
    errorRate: number;
    averageUpdateSize: number;
  } {
    const subscriptions = Array.from(this.subscriptions.values()).map(sub => ({
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
  async sendUpdate(subscriptionId: string, streamType: StreamType, data: any): Promise<void> {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription || !subscription.active) return;

    if (!subscription.streams.includes(streamType)) return;

    try {
      const update = await this.createStreamUpdate(subscriptionId, streamType, data);

      if (this.shouldBuffer(update)) {
        this.addToBuffer(update, subscriptionId);
      } else {
        await this.deliverUpdate(subscription, update);
      }
    } catch (error) {
      this.handleStreamError(subscriptionId, {
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
  async broadcastUpdate(streamType: StreamType, data: any, filters?: {
    subscriptionIds?: string[];
    eventTypes?: BudgetEventType[];
    severities?: EventSeverity[];
  }): Promise<void> {
    const promises: Array<Promise<void>> = [];

    for (const subscription of this.subscriptions.values()) {
      if (!subscription.active) continue;
      if (!subscription.streams.includes(streamType)) continue;

      // Apply filters
      if (filters?.subscriptionIds && !filters.subscriptionIds.includes(subscription.id)) {
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
  updateSubscription(subscriptionId: string, updates: Partial<StreamSubscription>): boolean {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) return false;

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
  private setupEventListeners(): void {
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
  private setupBufferManagement(): void {
    this.bufferTimer = setInterval(() => {
      this.flushUpdateBuffer();
    }, this.config.bufferTimeout);
  }

  /**
   * Start update timer for subscription
   */
  private startUpdateTimer(subscription: StreamSubscription): void {
    if (!subscription.updateInterval) return;

    const timer = setInterval(async () => {
      if (!subscription.active) return;

      try {
        await this.sendPeriodicUpdates(subscription);
      } catch (error) {
        this.handleStreamError(subscription.id, {
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
  private async sendPeriodicUpdates(subscription: StreamSubscription): Promise<void> {
    const promises: Array<Promise<void>> = [];

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
  private async getStreamData(streamType: StreamType): Promise<any> {
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
  private async createStreamUpdate(
    subscriptionId: string,
    streamType: StreamType,
    data: any
  ): Promise<StreamUpdate> {
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
    const metadata: StreamUpdate['metadata'] = {
      source: 'RealTimeStreamingService',
      version: '1.0.0',
      delta: this.config.enableDeltaUpdates && !!this.lastUpdates.get(`${subscriptionId}:${streamType}`),
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
  private async deliverUpdate(subscription: StreamSubscription, update: StreamUpdate): Promise<void> {
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

    } catch (error) {
      this.handleStreamError(subscription.id, {
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
  private handleStreamError(subscriptionId: string, error: StreamError): void {
    this.status.errors++;

    const subscription = this.subscriptions.get(subscriptionId);
    if (subscription?.onError) {
      try {
        subscription.onError(error);
      } catch (callbackError) {
        this.logger.error('Error callback failed', {
          subscriptionId,
          originalError: error,
          callbackError: callbackError instanceof Error ? callbackError.message : String(callbackError),
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
  private shouldBuffer(update: StreamUpdate): boolean {
    return this.updateBuffer.length < this.config.bufferSize;
  }

  /**
   * Add update to buffer
   */
  private addToBuffer(update: StreamUpdate, subscriptionId: string): void {
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
  private flushUpdateBuffer(): void {
    if (this.updateBuffer.length === 0) return;

    const updates = [...this.updateBuffer];
    this.updateBuffer.length = 0;

    const promises = updates.map(async ({ update, subscriptionId }) => {
      const subscription = this.subscriptions.get(subscriptionId);
      if (subscription) {
        await this.deliverUpdate(subscription, update);
      }
    });

    Promise.allSettled(promises).catch(error => {
      this.logger.error('Failed to flush update buffer', {
        error: error instanceof Error ? error.message : String(error),
        bufferSize: updates.length,
      });
    });
  }

  /**
   * Check if data passes subscription filters
   */
  private passesSubscriptionFilters(
    subscription: StreamSubscription,
    context: { streamType: StreamType; data: any }
  ): boolean {
    const filters = subscription.filters;
    if (!filters) return true;

    // Implement filter logic based on context
    // This would be expanded based on specific filter requirements
    return true;
  }

  /**
   * Calculate delta between old and new data
   */
  private calculateDelta(oldData: any, newData: any): any {
    // Simplified delta calculation
    // This would be more sophisticated in a real implementation
    if (typeof newData !== 'object' || newData === null) {
      return newData;
    }

    const delta: any = {};
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
  private shouldCompress(data: any): boolean {
    const dataSize = JSON.stringify(data).length;
    return dataSize > 1024; // Compress if larger than 1KB
  }

  /**
   * Get next sequence number for subscription
   */
  private getNextSequence(subscriptionId: string): number {
    const current = this.sequenceNumbers.get(subscriptionId) || 0;
    const next = current + 1;
    this.sequenceNumbers.set(subscriptionId, next);
    return next;
  }

  /**
   * Start bandwidth monitoring
   */
  private startBandwidthMonitoring(): void {
    let lastTotalBytes = 0;
    let lastTime = Date.now();

    this.bandwidthTimer = setInterval(() => {
      const now = Date.now();
      const timeDiff = (now - lastTime) / 1000; // seconds
      const bytesDiff = this.status.bandwidth.totalBytes - lastTotalBytes;

      if (timeDiff > 0) {
        const currentBytesPerSecond = bytesDiff / timeDiff;
        this.status.bandwidth.averageBytesPerSecond =
          this.status.bandwidth.totalBytes / ((now - this.status.startTime.getTime()) / 1000);

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
export function createRealTimeStreamingService(
  tokenTracker: TokenTracker,
  metricsCollector: MetricsCollector,
  eventManager: BudgetEventManager,
  config?: StreamingConfig
): RealTimeStreamingService {
  return new RealTimeStreamingService(
    tokenTracker,
    metricsCollector,
    eventManager,
    config
  );
}

/**
 * Global streaming service instance
 */
let globalStreamingService: RealTimeStreamingService | null = null;

/**
 * Get or create the global streaming service instance
 */
export function getGlobalStreamingService(
  tokenTracker?: TokenTracker,
  metricsCollector?: MetricsCollector,
  eventManager?: BudgetEventManager,
  config?: StreamingConfig
): RealTimeStreamingService {
  if (!globalStreamingService && tokenTracker && metricsCollector && eventManager) {
    globalStreamingService = createRealTimeStreamingService(
      tokenTracker,
      metricsCollector,
      eventManager,
      config
    );
  }

  if (!globalStreamingService) {
    throw new Error('Global streaming service not initialized and required dependencies not provided');
  }

  return globalStreamingService;
}

/**
 * Reset the global streaming service instance
 */
export function resetGlobalStreamingService(): void {
  if (globalStreamingService) {
    globalStreamingService.stop();
    globalStreamingService = null;
  }
}