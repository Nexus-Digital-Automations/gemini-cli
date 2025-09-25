/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import EventEmitter from 'node:events';
import { performance } from 'node:perf_hooks';
import { getComponentLogger, createTimer, LogLevel } from '../utils/logger.js';
import { getGlobalStorageEngine } from './analytics-storage-engine.js';
/** High-performance logger for real-time tracking */
const logger = getComponentLogger('RealtimeTokenTracker');
/**
 * Model-specific pricing configuration
 */
const MODEL_PRICING = {
  'gemini-1.5-pro': { input: 0.00125, output: 0.00375 }, // per 1K tokens
  'gemini-1.5-flash': { input: 0.00015, output: 0.0006 },
  'gemini-2.0-flash': { input: 0.00015, output: 0.0006 },
  'gemini-2.5-pro': { input: 0.00125, output: 0.00375 },
  'gemini-2.5-flash': { input: 0.00015, output: 0.0006 },
  default: { input: 0.001, output: 0.003 },
};
/**
 * High-performance real-time token usage tracking system with enterprise-grade capabilities
 */
export class RealtimeTokenTracker extends EventEmitter {
  geminiConfig;
  config;
  sessionData = new Map();
  batchBuffer = [];
  performanceCache = new Map();
  storageEngine = getGlobalStorageEngine();
  batchTimeout = null;
  totalTrackedRequests = 0;
  totalTrackedTokens = 0;
  totalTrackedCost = 0;
  constructor(geminiConfig, config) {
    super();
    this.geminiConfig = geminiConfig;
    this.config = {
      enableStreaming: true,
      batchSize: 50,
      batchTimeoutMs: 1000,
      alertThresholds: {
        highCostUsd: 10.0,
        highLatencyMs: 5000,
        unusualTokenSpike: 50000,
      },
      compressionLevel: 'light',
      retentionDays: 30,
      ...config,
    };
    this.setupCleanupInterval();
    this.setMaxListeners(100); // Support many dashboard connections
    logger.info('RealtimeTokenTracker initialized', {
      config: this.config,
      enabledStreaming: this.config.enableStreaming,
    });
  }
  /**
   * Track token usage with <50ms performance overhead
   */
  async trackTokenUsage(
    sessionId,
    promptId,
    model,
    usageMetadata,
    latencyMs,
    authType,
    context,
  ) {
    const trackingStart = performance.now();
    try {
      const tokenData = this.createTokenUsageData(
        sessionId,
        promptId,
        model,
        usageMetadata,
        latencyMs,
        authType,
        context,
      );
      // Add to session data with size limit
      this.addToSessionData(sessionId, tokenData);
      // Store in persistent analytics storage
      await this.storageEngine.storeTokenUsage(tokenData);
      // Add to streaming batch
      if (this.config.enableStreaming) {
        this.addToBatch(tokenData);
      }
      // Check for alerts
      this.checkAlerts(tokenData);
      // Update global statistics
      this.updateGlobalStats(tokenData);
      // Emit immediate event for real-time dashboards
      this.emit('token_usage', {
        type: 'token_usage_update',
        data: tokenData,
        timestamp: Date.now(),
      });
    } catch (error) {
      logger.error('Failed to track token usage', {
        error,
        sessionId,
        promptId,
      });
    } finally {
      const trackingDuration = performance.now() - trackingStart;
      if (trackingDuration > 5) {
        // Log if overhead > 5ms
        logger.warn('Token tracking performance warning', {
          durationMs: trackingDuration,
          sessionId,
          promptId,
        });
      }
    }
  }
  /**
   * Get real-time usage statistics with advanced analytics
   */
  getRealtimeStatistics(
    timeRangeMs = 3600000, // 1 hour default
    sessionId,
  ) {
    const endTimer = createTimer(
      logger,
      'getRealtimeStatistics',
      LogLevel.DEBUG,
    );
    try {
      const now = Date.now();
      const startTime = now - timeRangeMs;
      const relevantData = [];
      if (sessionId) {
        const sessionData = this.sessionData.get(sessionId) || [];
        relevantData.push(
          ...sessionData.filter((d) => d.timestamp >= startTime),
        );
      } else {
        for (const sessionData of this.sessionData.values()) {
          relevantData.push(
            ...sessionData.filter((d) => d.timestamp >= startTime),
          );
        }
      }
      return this.calculateStatistics(relevantData, startTime, now);
    } finally {
      endTimer();
    }
  }
  /**
   * Get usage data for a specific session with pagination
   */
  getSessionData(sessionId, limit = 100, offset = 0) {
    const sessionData = this.sessionData.get(sessionId) || [];
    const sortedData = sessionData
      .sort((a, b) => b.timestamp - a.timestamp) // Most recent first
      .slice(offset, offset + limit);
    return {
      data: sortedData,
      total: sessionData.length,
      hasMore: offset + limit < sessionData.length,
    };
  }
  /**
   * Stream live token usage updates
   */
  createLiveStream() {
    const { Readable } = require('node:stream');
    const stream = new Readable({
      objectMode: true,
      read() {},
    });
    const onTokenUsage = (event) => {
      stream.push(JSON.stringify(event) + '\n');
    };
    const onBatchUpdate = (event) => {
      stream.push(JSON.stringify(event) + '\n');
    };
    const onAlert = (event) => {
      stream.push(JSON.stringify(event) + '\n');
    };
    this.on('token_usage', onTokenUsage);
    this.on('token_batch', onBatchUpdate);
    this.on('alert', onAlert);
    stream.on('close', () => {
      this.off('token_usage', onTokenUsage);
      this.off('token_batch', onBatchUpdate);
      this.off('alert', onAlert);
    });
    return stream;
  }
  /**
   * Export usage data for external analytics
   */
  exportUsageData(format = 'json', sessionId, timeRangeMs) {
    let data = [];
    if (sessionId) {
      data = this.sessionData.get(sessionId) || [];
    } else {
      for (const sessionData of this.sessionData.values()) {
        data.push(...sessionData);
      }
    }
    if (timeRangeMs) {
      const cutoff = Date.now() - timeRangeMs;
      data = data.filter((d) => d.timestamp >= cutoff);
    }
    switch (format) {
      case 'csv':
        return this.convertToCsv(data);
      case 'json':
      default:
        return JSON.stringify(data, null, 2);
    }
  }
  /**
   * Clear old data based on retention policy
   */
  cleanup() {
    const cutoff = Date.now() - this.config.retentionDays * 24 * 60 * 60 * 1000;
    let removedCount = 0;
    for (const [sessionId, data] of this.sessionData.entries()) {
      const filteredData = data.filter((d) => d.timestamp >= cutoff);
      removedCount += data.length - filteredData.length;
      if (filteredData.length === 0) {
        this.sessionData.delete(sessionId);
      } else {
        this.sessionData.set(sessionId, filteredData);
      }
    }
    logger.info('Token tracking data cleanup completed', {
      removedEntries: removedCount,
      retentionDays: this.config.retentionDays,
    });
  }
  createTokenUsageData(
    sessionId,
    promptId,
    model,
    usageMetadata,
    latencyMs,
    authType,
    context,
  ) {
    const timestamp = Date.now();
    const inputTokens = usageMetadata.promptTokenCount ?? 0;
    const outputTokens = usageMetadata.candidatesTokenCount ?? 0;
    const cachedTokens = usageMetadata.cachedContentTokenCount ?? 0;
    const thoughtsTokens = usageMetadata.thoughtsTokenCount ?? 0;
    const toolTokens = usageMetadata.toolUsePromptTokenCount ?? 0;
    const totalTokens =
      usageMetadata.totalTokenCount ??
      inputTokens + outputTokens + cachedTokens + thoughtsTokens + toolTokens;
    // Calculate costs
    const pricing = MODEL_PRICING[model] || MODEL_PRICING.default;
    const inputCostUsd = (inputTokens / 1000) * pricing.input;
    const outputCostUsd = (outputTokens / 1000) * pricing.output;
    const totalCostUsd = inputCostUsd + outputCostUsd;
    return {
      sessionId,
      promptId,
      timestamp,
      model,
      authType,
      command: context?.command,
      feature: context?.feature,
      userId: context?.userId,
      inputTokens,
      outputTokens,
      cachedTokens,
      thoughtsTokens,
      toolTokens,
      totalTokens,
      latencyMs,
      requestStartTime: timestamp - latencyMs,
      requestEndTime: timestamp,
      inputCostUsd,
      outputCostUsd,
      totalCostUsd,
      conversationTurn: context?.conversationTurn ?? 1,
      toolCallsCount: context?.toolCallsCount ?? 0,
      streamingEnabled: context?.streamingEnabled ?? false,
      errorCount: context?.errorCount ?? 0,
    };
  }
  addToSessionData(sessionId, data) {
    const sessionData = this.sessionData.get(sessionId) || [];
    sessionData.push(data);
    // Limit session data size to prevent memory issues
    const maxSessionSize = 1000;
    if (sessionData.length > maxSessionSize) {
      sessionData.splice(0, sessionData.length - maxSessionSize);
    }
    this.sessionData.set(sessionId, sessionData);
  }
  addToBatch(data) {
    this.batchBuffer.push(data);
    if (this.batchBuffer.length >= this.config.batchSize) {
      this.flushBatch();
    } else if (!this.batchTimeout) {
      this.batchTimeout = setTimeout(
        () => this.flushBatch(),
        this.config.batchTimeoutMs,
      );
    }
  }
  flushBatch() {
    if (this.batchBuffer.length === 0) return;
    const batch = [...this.batchBuffer];
    this.batchBuffer.length = 0;
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }
    this.emit('token_batch', {
      type: 'token_batch_update',
      data: batch,
      timestamp: Date.now(),
    });
  }
  checkAlerts(data) {
    const alerts = [];
    // High cost alert
    if (
      data.totalCostUsd &&
      data.totalCostUsd > this.config.alertThresholds.highCostUsd
    ) {
      alerts.push({
        alertType: 'high_cost',
        threshold: this.config.alertThresholds.highCostUsd,
        currentValue: data.totalCostUsd,
        sessionId: data.sessionId,
        model: data.model,
        timestamp: data.timestamp,
        metadata: { promptId: data.promptId, totalTokens: data.totalTokens },
      });
    }
    // High latency alert
    if (data.latencyMs > this.config.alertThresholds.highLatencyMs) {
      alerts.push({
        alertType: 'high_latency',
        threshold: this.config.alertThresholds.highLatencyMs,
        currentValue: data.latencyMs,
        sessionId: data.sessionId,
        model: data.model,
        timestamp: data.timestamp,
        metadata: { promptId: data.promptId, totalTokens: data.totalTokens },
      });
    }
    // Unusual token usage spike
    if (data.totalTokens > this.config.alertThresholds.unusualTokenSpike) {
      alerts.push({
        alertType: 'unusual_usage',
        threshold: this.config.alertThresholds.unusualTokenSpike,
        currentValue: data.totalTokens,
        sessionId: data.sessionId,
        model: data.model,
        timestamp: data.timestamp,
        metadata: { promptId: data.promptId, latencyMs: data.latencyMs },
      });
    }
    // Emit alerts
    for (const alert of alerts) {
      this.emit('alert', {
        type: 'cost_alert',
        data: alert,
        timestamp: Date.now(),
      });
    }
  }
  updateGlobalStats(data) {
    this.totalTrackedRequests++;
    this.totalTrackedTokens += data.totalTokens;
    this.totalTrackedCost += data.totalCostUsd || 0;
  }
  calculateStatistics(data, startTime, endTime) {
    if (data.length === 0) {
      return {
        totalTokens: 0,
        totalCost: 0,
        averageLatency: 0,
        requestCount: 0,
        errorRate: 0,
        topModels: [],
        timeRange: { start: startTime, end: endTime },
        breakdown: {
          byCommand: new Map(),
          byFeature: new Map(),
          byModel: new Map(),
          byHour: new Map(),
        },
      };
    }
    const totalTokens = data.reduce((sum, d) => sum + d.totalTokens, 0);
    const totalCost = data.reduce((sum, d) => sum + (d.totalCostUsd || 0), 0);
    const averageLatency =
      data.reduce((sum, d) => sum + d.latencyMs, 0) / data.length;
    const errorCount = data.reduce((sum, d) => sum + d.errorCount, 0);
    const errorRate = errorCount / data.length;
    // Calculate top models
    const modelUsage = new Map();
    for (const item of data) {
      const existing = modelUsage.get(item.model) || { usage: 0, cost: 0 };
      existing.usage += item.totalTokens;
      existing.cost += item.totalCostUsd || 0;
      modelUsage.set(item.model, existing);
    }
    const topModels = Array.from(modelUsage.entries())
      .map(([model, stats]) => ({ model, ...stats }))
      .sort((a, b) => b.usage - a.usage)
      .slice(0, 10);
    // Create breakdowns
    const breakdown = {
      byCommand: this.groupBy(data, 'command'),
      byFeature: this.groupBy(data, 'feature'),
      byModel: this.groupBy(data, 'model'),
      byHour: this.groupByHour(data),
    };
    return {
      totalTokens,
      totalCost,
      averageLatency,
      requestCount: data.length,
      errorRate,
      topModels,
      timeRange: { start: startTime, end: endTime },
      breakdown,
    };
  }
  groupBy(data, key) {
    const groups = new Map();
    for (const item of data) {
      const value = String(item[key] || 'unknown');
      const existing = groups.get(value) || [];
      existing.push(item);
      groups.set(value, existing);
    }
    return groups;
  }
  groupByHour(data) {
    const groups = new Map();
    for (const item of data) {
      const hourKey = new Date(item.timestamp).toISOString().slice(0, 13); // YYYY-MM-DDTHH
      const existing = groups.get(hourKey) || [];
      existing.push(item);
      groups.set(hourKey, existing);
    }
    return groups;
  }
  convertToCsv(data) {
    if (data.length === 0) return '';
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map((row) =>
      Object.values(row)
        .map((val) => `"${val}"`)
        .join(','),
    );
    return [headers, ...rows].join('\n');
  }
  setupCleanupInterval() {
    // Cleanup every 6 hours
    setInterval(() => this.cleanup(), 6 * 60 * 60 * 1000);
  }
}
/**
 * Global singleton instance for efficient resource usage
 */
let globalTracker = null;
/**
 * Get or create the global RealtimeTokenTracker instance
 */
export function getGlobalTokenTracker(config) {
  if (!globalTracker) {
    globalTracker = new RealtimeTokenTracker(config);
  }
  return globalTracker;
}
/**
 * Reset the global tracker (mainly for testing)
 */
export function resetGlobalTokenTracker() {
  globalTracker = null;
}
//# sourceMappingURL=realtime-token-tracker.js.map
