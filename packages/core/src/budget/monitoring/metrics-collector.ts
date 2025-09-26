/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Comprehensive metrics collection and aggregation system
 * Collects detailed usage metrics from token tracker and other sources
 *
 * @author Claude Code - Real-Time Token Usage Monitoring Agent
 * @version 1.0.0
 */

import { EventEmitter } from 'node:events';
import { getComponentLogger } from '../../utils/logger.js';
import type {
  TokenTracker,
  TokenUsageStats,
  RequestTrackingData,
} from './token-tracker.js';
import type {
  TokenUsageData,
  ModelUsageData,
  SessionUsageData,
  HistoricalDataPoint,
  BudgetEvent,
  BudgetEventType,
} from '../types.js';

/**
 * Metrics collection configuration
 */
export interface MetricsCollectorConfig {
  /** Interval for collecting metrics snapshots (ms) */
  collectionInterval?: number;
  /** Maximum number of historical data points to keep */
  maxHistoryPoints?: number;
  /** Enable trend analysis calculations */
  enableTrendAnalysis?: boolean;
  /** Enable anomaly detection */
  enableAnomalyDetection?: boolean;
  /** Window size for moving averages */
  movingAverageWindow?: number;
  /** Threshold for anomaly detection (standard deviations) */
  anomalyThreshold?: number;
}

/**
 * Time series data point for metrics
 */
export interface MetricsDataPoint {
  timestamp: Date;
  totalCost: number;
  requestCount: number;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  averageResponseTime: number;
  activeRequests: number;
  errorRate: number;
  costRate: number; // Cost per minute
  tokenRate: number; // Tokens per minute
  requestRate: number; // Requests per minute
}

/**
 * Aggregated metrics summary
 */
export interface MetricsSummary {
  current: MetricsDataPoint;
  lastHour: AggregatedMetrics;
  lastDay: AggregatedMetrics;
  lastWeek: AggregatedMetrics;
  trends: TrendAnalysis;
  anomalies: AnomalyData[];
  topModels: ModelUsageData[];
  topFeatures: Array<{ feature: string; usage: TokenUsageData }>;
  topSessions: Array<{ sessionId: string; usage: TokenUsageData }>;
}

/**
 * Aggregated metrics for time periods
 */
export interface AggregatedMetrics {
  totalCost: number;
  totalRequests: number;
  totalTokens: number;
  averageResponseTime: number;
  errorCount: number;
  errorRate: number;
  peakCostRate: number;
  peakTokenRate: number;
  peakRequestRate: number;
  averageCostPerRequest: number;
  averageTokensPerRequest: number;
}

/**
 * Trend analysis data
 */
export interface TrendAnalysis {
  costTrend: TrendData;
  usageTrend: TrendData;
  performanceTrend: TrendData;
  errorTrend: TrendData;
  predictions: PredictionData;
}

/**
 * Individual trend data
 */
export interface TrendData {
  direction: 'up' | 'down' | 'stable';
  magnitude: number; // Percentage change
  confidence: number; // 0-1
  period: string; // Time period analyzed
  dataPoints: number;
  correlation: number; // -1 to 1
}

/**
 * Prediction data for forecasting
 */
export interface PredictionData {
  nextHourCost: number;
  nextDayCost: number;
  budgetRunoutPrediction: Date | null;
  confidence: number;
}

/**
 * Anomaly detection data
 */
export interface AnomalyData {
  timestamp: Date;
  type: 'cost_spike' | 'usage_spike' | 'error_spike' | 'performance_drop';
  severity: 'low' | 'medium' | 'high' | 'critical';
  value: number;
  expectedValue: number;
  deviationScore: number;
  description: string;
}

/**
 * Metrics event for real-time updates
 */
export interface MetricsEvent {
  type: 'snapshot' | 'trend_update' | 'anomaly_detected' | 'summary_update';
  timestamp: Date;
  data: any;
}

/**
 * Comprehensive metrics collection and analysis system
 *
 * This class aggregates data from the TokenTracker and other sources to provide
 * detailed analytics, trend analysis, and anomaly detection for token usage.
 * It maintains historical data, calculates moving averages, and provides
 * real-time metrics updates for the dashboard.
 */
export class MetricsCollector extends EventEmitter {
  private readonly logger = getComponentLogger('MetricsCollector');
  private readonly config: Required<MetricsCollectorConfig>;
  private readonly tokenTracker: TokenTracker;
  private readonly historicalData: MetricsDataPoint[] = [];
  private readonly anomalies: AnomalyData[] = [];

  private collectionTimer: NodeJS.Timeout | null = null;
  private lastSnapshot: MetricsDataPoint | null = null;
  private isCollecting = false;

  constructor(tokenTracker: TokenTracker, config: MetricsCollectorConfig = {}) {
    super();

    this.tokenTracker = tokenTracker;
    this.config = {
      collectionInterval: config.collectionInterval ?? 10000, // 10 seconds
      maxHistoryPoints: config.maxHistoryPoints ?? 8640, // 24 hours at 10s intervals
      enableTrendAnalysis: config.enableTrendAnalysis ?? true,
      enableAnomalyDetection: config.enableAnomalyDetection ?? true,
      movingAverageWindow: config.movingAverageWindow ?? 30,
      anomalyThreshold: config.anomalyThreshold ?? 2.0,
    };

    this.logger.info('MetricsCollector initialized', {
      collectionInterval: this.config.collectionInterval,
      maxHistoryPoints: this.config.maxHistoryPoints,
      enableTrendAnalysis: this.config.enableTrendAnalysis,
      enableAnomalyDetection: this.config.enableAnomalyDetection,
    });

    this.setupTokenTrackerListeners();
  }

  /**
   * Start metrics collection
   */
  start(): void {
    if (this.isCollecting) {
      this.logger.warn('Metrics collection already started');
      return;
    }

    this.logger.info('Starting metrics collection');
    this.isCollecting = true;

    // Take initial snapshot
    this.collectSnapshot();

    // Start periodic collection
    this.collectionTimer = setInterval(() => {
      this.collectSnapshot();
    }, this.config.collectionInterval);
  }

  /**
   * Stop metrics collection
   */
  stop(): void {
    if (!this.isCollecting) {
      return;
    }

    this.logger.info('Stopping metrics collection');
    this.isCollecting = false;

    if (this.collectionTimer) {
      clearInterval(this.collectionTimer);
      this.collectionTimer = null;
    }
  }

  /**
   * Get current metrics summary
   */
  getMetricsSummary(): MetricsSummary {
    const current = this.getCurrentSnapshot();
    const lastHour = this.getAggregatedMetrics('1hour');
    const lastDay = this.getAggregatedMetrics('1day');
    const lastWeek = this.getAggregatedMetrics('1week');
    const trends = this.calculateTrends();
    const anomalies = this.getRecentAnomalies(24); // Last 24 hours
    const stats = this.tokenTracker.getUsageStats();

    return {
      current,
      lastHour,
      lastDay,
      lastWeek,
      trends,
      anomalies,
      topModels: this.getTopModels(stats, 10),
      topFeatures: this.getTopFeatures(stats, 10),
      topSessions: this.getTopSessions(stats, 10),
    };
  }

  /**
   * Get historical data points
   */
  getHistoricalData(
    startTime?: Date,
    endTime?: Date,
    maxPoints?: number,
  ): MetricsDataPoint[] {
    let data = this.historicalData;

    // Filter by time range if specified
    if (startTime || endTime) {
      data = data.filter((point) => {
        if (startTime && point.timestamp < startTime) return false;
        if (endTime && point.timestamp > endTime) return false;
        return true;
      });
    }

    // Limit number of points if specified
    if (maxPoints && data.length > maxPoints) {
      // Sample evenly across the time range
      const step = Math.ceil(data.length / maxPoints);
      data = data.filter((_, index) => index % step === 0);
    }

    return data;
  }

  /**
   * Get anomalies within a time range
   */
  getAnomalies(hours: number = 24): AnomalyData[] {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.anomalies.filter((anomaly) => anomaly.timestamp >= cutoff);
  }

  /**
   * Reset all collected data
   */
  reset(): void {
    this.logger.info('Resetting metrics collector');

    this.historicalData.length = 0;
    this.anomalies.length = 0;
    this.lastSnapshot = null;

    this.emit('reset');
  }

  /**
   * Collect a metrics snapshot
   */
  private collectSnapshot(): void {
    try {
      const timestamp = new Date();
      const stats = this.tokenTracker.getUsageStats();
      const activeRequests = this.tokenTracker.getActiveRequests().length;

      // Calculate rates based on time since last snapshot
      let costRate = 0;
      let tokenRate = 0;
      let requestRate = 0;

      if (this.lastSnapshot) {
        const timeDiffMinutes =
          (timestamp.getTime() - this.lastSnapshot.timestamp.getTime()) / 60000;
        if (timeDiffMinutes > 0) {
          costRate =
            (stats.totalCost - this.lastSnapshot.totalCost) / timeDiffMinutes;
          tokenRate =
            (stats.totalTokens - this.lastSnapshot.totalTokens) /
            timeDiffMinutes;
          requestRate =
            (stats.totalRequests - this.lastSnapshot.requestCount) /
            timeDiffMinutes;
        }
      }

      // Calculate error rate from recent requests
      const recentRequests = stats.recentRequests.slice(-100); // Last 100 requests
      const errorCount = recentRequests.filter(
        (req) => req.status === 'error',
      ).length;
      const errorRate =
        recentRequests.length > 0
          ? (errorCount / recentRequests.length) * 100
          : 0;

      const snapshot: MetricsDataPoint = {
        timestamp,
        totalCost: stats.totalCost,
        requestCount: stats.totalRequests,
        inputTokens: stats.totalInputTokens,
        outputTokens: stats.totalOutputTokens,
        totalTokens: stats.totalTokens,
        averageResponseTime: stats.averageResponseTime,
        activeRequests,
        errorRate,
        costRate,
        tokenRate,
        requestRate,
      };

      this.addHistoricalDataPoint(snapshot);
      this.lastSnapshot = snapshot;

      // Detect anomalies if enabled
      if (this.config.enableAnomalyDetection) {
        this.detectAnomalies(snapshot);
      }

      this.emit('snapshot', { type: 'snapshot', timestamp, data: snapshot });
    } catch (error) {
      this.logger.error('Failed to collect metrics snapshot', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Add a data point to historical data
   */
  private addHistoricalDataPoint(dataPoint: MetricsDataPoint): void {
    this.historicalData.push(dataPoint);

    // Maintain circular buffer
    if (this.historicalData.length > this.config.maxHistoryPoints) {
      this.historicalData.shift();
    }
  }

  /**
   * Get current snapshot of metrics
   */
  private getCurrentSnapshot(): MetricsDataPoint {
    if (this.lastSnapshot) {
      return this.lastSnapshot;
    }

    // Create snapshot if none exists
    const stats = this.tokenTracker.getUsageStats();
    return {
      timestamp: new Date(),
      totalCost: stats.totalCost,
      requestCount: stats.totalRequests,
      inputTokens: stats.totalInputTokens,
      outputTokens: stats.totalOutputTokens,
      totalTokens: stats.totalTokens,
      averageResponseTime: stats.averageResponseTime,
      activeRequests: this.tokenTracker.getActiveRequests().length,
      errorRate: 0,
      costRate: 0,
      tokenRate: 0,
      requestRate: 0,
    };
  }

  /**
   * Get aggregated metrics for a time period
   */
  private getAggregatedMetrics(
    period: '1hour' | '1day' | '1week',
  ): AggregatedMetrics {
    const now = new Date();
    let startTime: Date;

    switch (period) {
      case '1hour':
        startTime = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case '1day':
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '1week':
        startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      default:
        // Handle unexpected values
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000); // Default to 1 day
        break;
    }

    const periodData = this.historicalData.filter(
      (point) => point.timestamp >= startTime,
    );

    if (periodData.length === 0) {
      return {
        totalCost: 0,
        totalRequests: 0,
        totalTokens: 0,
        averageResponseTime: 0,
        errorCount: 0,
        errorRate: 0,
        peakCostRate: 0,
        peakTokenRate: 0,
        peakRequestRate: 0,
        averageCostPerRequest: 0,
        averageTokensPerRequest: 0,
      };
    }

    const first = periodData[0];
    const last = periodData[periodData.length - 1];

    const totalCost = last.totalCost - first.totalCost;
    const totalRequests = last.requestCount - first.requestCount;
    const totalTokens = last.totalTokens - first.totalTokens;

    const errorRates = periodData.map((p) => p.errorRate);
    const responseTimeSum = periodData.reduce(
      (sum, p) => sum + p.averageResponseTime,
      0,
    );

    return {
      totalCost,
      totalRequests,
      totalTokens,
      averageResponseTime: responseTimeSum / periodData.length,
      errorCount: 0, // We don't track absolute error count in snapshots
      errorRate:
        errorRates.reduce((sum, rate) => sum + rate, 0) / errorRates.length,
      peakCostRate: Math.max(...periodData.map((p) => p.costRate)),
      peakTokenRate: Math.max(...periodData.map((p) => p.tokenRate)),
      peakRequestRate: Math.max(...periodData.map((p) => p.requestRate)),
      averageCostPerRequest: totalRequests > 0 ? totalCost / totalRequests : 0,
      averageTokensPerRequest:
        totalRequests > 0 ? totalTokens / totalRequests : 0,
    };
  }

  /**
   * Calculate trend analysis
   */
  private calculateTrends(): TrendAnalysis {
    if (!this.config.enableTrendAnalysis || this.historicalData.length < 10) {
      return {
        costTrend: this.createNullTrend(),
        usageTrend: this.createNullTrend(),
        performanceTrend: this.createNullTrend(),
        errorTrend: this.createNullTrend(),
        predictions: {
          nextHourCost: 0,
          nextDayCost: 0,
          budgetRunoutPrediction: null,
          confidence: 0,
        },
      };
    }

    const recentData = this.historicalData.slice(
      -this.config.movingAverageWindow,
    );

    return {
      costTrend: this.calculateTrendData(recentData.map((d) => d.totalCost)),
      usageTrend: this.calculateTrendData(recentData.map((d) => d.totalTokens)),
      performanceTrend: this.calculateTrendData(
        recentData.map((d) => d.averageResponseTime),
      ),
      errorTrend: this.calculateTrendData(recentData.map((d) => d.errorRate)),
      predictions: this.calculatePredictions(recentData),
    };
  }

  /**
   * Calculate trend data for a series of values
   */
  private calculateTrendData(values: number[]): TrendData {
    if (values.length < 2) {
      return this.createNullTrend();
    }

    // Linear regression to find trend
    const n = values.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((acc, xi, i) => acc + xi * values[i], 0);
    const sumX2 = x.reduce((acc, xi) => acc + xi * xi, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Calculate correlation coefficient
    const meanX = sumX / n;
    const meanY = sumY / n;
    const numerator = x.reduce(
      (acc, xi, i) => acc + (xi - meanX) * (values[i] - meanY),
      0,
    );
    const denomX = Math.sqrt(
      x.reduce((acc, xi) => acc + Math.pow(xi - meanX, 2), 0),
    );
    const denomY = Math.sqrt(
      values.reduce((acc, yi) => acc + Math.pow(yi - meanY, 2), 0),
    );
    const correlation = denomX && denomY ? numerator / (denomX * denomY) : 0;

    // Determine trend direction and magnitude
    const startValue = intercept;
    const endValue = intercept + slope * (n - 1);
    const magnitude =
      startValue !== 0
        ? Math.abs((endValue - startValue) / startValue) * 100
        : 0;

    let direction: 'up' | 'down' | 'stable' = 'stable';
    if (Math.abs(slope) > 0.01) {
      // Threshold for significant change
      direction = slope > 0 ? 'up' : 'down';
    }

    return {
      direction,
      magnitude,
      confidence: Math.abs(correlation),
      period: `${n} data points`,
      dataPoints: n,
      correlation,
    };
  }

  /**
   * Create null trend data
   */
  private createNullTrend(): TrendData {
    return {
      direction: 'stable',
      magnitude: 0,
      confidence: 0,
      period: '0 data points',
      dataPoints: 0,
      correlation: 0,
    };
  }

  /**
   * Calculate predictions for future usage
   */
  private calculatePredictions(recentData: MetricsDataPoint[]): PredictionData {
    if (recentData.length < 5) {
      return {
        nextHourCost: 0,
        nextDayCost: 0,
        budgetRunoutPrediction: null,
        confidence: 0,
      };
    }

    // Simple linear extrapolation based on recent cost rate
    const costRates = recentData
      .map((d) => d.costRate)
      .filter((rate) => rate > 0);
    if (costRates.length === 0) {
      return {
        nextHourCost: 0,
        nextDayCost: 0,
        budgetRunoutPrediction: null,
        confidence: 0,
      };
    }

    const avgCostRate =
      costRates.reduce((sum, rate) => sum + rate, 0) / costRates.length;
    const nextHourCost = avgCostRate * 60; // Cost per minute * 60
    const nextDayCost = avgCostRate * 60 * 24;

    // Calculate confidence based on variance in cost rates
    const variance =
      costRates.reduce(
        (sum, rate) => sum + Math.pow(rate - avgCostRate, 2),
        0,
      ) / costRates.length;
    const standardDeviation = Math.sqrt(variance);
    const confidence = Math.max(
      0,
      Math.min(1, 1 - standardDeviation / avgCostRate),
    );

    return {
      nextHourCost,
      nextDayCost,
      budgetRunoutPrediction: null, // Would need budget limit to calculate
      confidence,
    };
  }

  /**
   * Detect anomalies in current data point
   */
  private detectAnomalies(snapshot: MetricsDataPoint): void {
    if (this.historicalData.length < this.config.movingAverageWindow) {
      return; // Not enough data for anomaly detection
    }

    const recentData = this.historicalData.slice(
      -this.config.movingAverageWindow,
    );

    // Check for cost spikes
    this.detectAnomalyInMetric(
      snapshot,
      'costRate',
      snapshot.costRate,
      recentData.map((d) => d.costRate),
      'cost_spike',
    );

    // Check for usage spikes
    this.detectAnomalyInMetric(
      snapshot,
      'tokenRate',
      snapshot.tokenRate,
      recentData.map((d) => d.tokenRate),
      'usage_spike',
    );

    // Check for error spikes
    this.detectAnomalyInMetric(
      snapshot,
      'errorRate',
      snapshot.errorRate,
      recentData.map((d) => d.errorRate),
      'error_spike',
    );

    // Check for performance drops (higher is worse for response time)
    this.detectAnomalyInMetric(
      snapshot,
      'averageResponseTime',
      snapshot.averageResponseTime,
      recentData.map((d) => d.averageResponseTime),
      'performance_drop',
    );
  }

  /**
   * Detect anomaly in a specific metric
   */
  private detectAnomalyInMetric(
    snapshot: MetricsDataPoint,
    metricName: string,
    currentValue: number,
    historicalValues: number[],
    anomalyType: AnomalyData['type'],
  ): void {
    if (historicalValues.length === 0) return;

    const mean =
      historicalValues.reduce((sum, val) => sum + val, 0) /
      historicalValues.length;
    const variance =
      historicalValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
      historicalValues.length;
    const standardDeviation = Math.sqrt(variance);

    if (standardDeviation === 0) return; // No variation

    const deviationScore = Math.abs(currentValue - mean) / standardDeviation;

    if (deviationScore > this.config.anomalyThreshold) {
      const severity = this.getAnomalySeverity(deviationScore);

      const anomaly: AnomalyData = {
        timestamp: snapshot.timestamp,
        type: anomalyType,
        severity,
        value: currentValue,
        expectedValue: mean,
        deviationScore,
        description: this.generateAnomalyDescription(
          anomalyType,
          currentValue,
          mean,
          deviationScore,
        ),
      };

      this.anomalies.push(anomaly);

      // Keep only recent anomalies
      const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days
      const recentAnomaliesCount = this.anomalies.length;
      this.anomalies.splice(0, this.anomalies.length);
      this.anomalies.push(
        ...this.anomalies.filter((a) => a.timestamp >= cutoff),
      );

      this.logger.warn('Anomaly detected', {
        type: anomalyType,
        severity,
        metric: metricName,
        currentValue,
        expectedValue: mean,
        deviationScore,
      });

      this.emit('anomaly_detected', {
        type: 'anomaly_detected',
        timestamp: snapshot.timestamp,
        data: anomaly,
      });
    }
  }

  /**
   * Determine anomaly severity based on deviation score
   */
  private getAnomalySeverity(deviationScore: number): AnomalyData['severity'] {
    if (deviationScore > 5) return 'critical';
    if (deviationScore > 4) return 'high';
    if (deviationScore > 3) return 'medium';
    return 'low';
  }

  /**
   * Generate human-readable anomaly description
   */
  private generateAnomalyDescription(
    type: AnomalyData['type'],
    currentValue: number,
    expectedValue: number,
    deviationScore: number,
  ): string {
    const percentageChange =
      expectedValue !== 0
        ? Math.abs((currentValue - expectedValue) / expectedValue) * 100
        : 0;

    switch (type) {
      case 'cost_spike':
        return `Cost rate is ${percentageChange.toFixed(1)}% higher than expected (${currentValue.toFixed(4)} vs ${expectedValue.toFixed(4)} per minute)`;
      case 'usage_spike':
        return `Token usage rate is ${percentageChange.toFixed(1)}% higher than expected (${currentValue.toFixed(0)} vs ${expectedValue.toFixed(0)} tokens per minute)`;
      case 'error_spike':
        return `Error rate is ${percentageChange.toFixed(1)}% higher than expected (${currentValue.toFixed(1)}% vs ${expectedValue.toFixed(1)}%)`;
      case 'performance_drop':
        return `Average response time is ${percentageChange.toFixed(1)}% higher than expected (${currentValue.toFixed(0)}ms vs ${expectedValue.toFixed(0)}ms)`;
      default:
        return `Anomaly detected: current value ${currentValue} deviates from expected ${expectedValue} by ${deviationScore.toFixed(1)} standard deviations`;
    }
  }

  /**
   * Get recent anomalies
   */
  private getRecentAnomalies(hours: number): AnomalyData[] {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.anomalies.filter((anomaly) => anomaly.timestamp >= cutoff);
  }

  /**
   * Get top models by usage
   */
  private getTopModels(
    stats: TokenUsageStats,
    limit: number,
  ): ModelUsageData[] {
    return Object.values(stats.modelBreakdown)
      .sort((a, b) => b.cost - a.cost)
      .slice(0, limit);
  }

  /**
   * Get top features by usage
   */
  private getTopFeatures(
    stats: TokenUsageStats,
    limit: number,
  ): Array<{ feature: string; usage: TokenUsageData }> {
    return Object.entries(stats.featureBreakdown)
      .map(([feature, usage]) => ({ feature, usage }))
      .sort(
        (a, b) =>
          b.usage.tokenCosts.input +
          b.usage.tokenCosts.output -
          (a.usage.tokenCosts.input + a.usage.tokenCosts.output),
      )
      .slice(0, limit);
  }

  /**
   * Get top sessions by usage
   */
  private getTopSessions(
    stats: TokenUsageStats,
    limit: number,
  ): Array<{ sessionId: string; usage: TokenUsageData }> {
    return Object.entries(stats.sessionBreakdown)
      .map(([sessionId, usage]) => ({ sessionId, usage }))
      .sort(
        (a, b) =>
          b.usage.tokenCosts.input +
          b.usage.tokenCosts.output -
          (a.usage.tokenCosts.input + a.usage.tokenCosts.output),
      )
      .slice(0, limit);
  }

  /**
   * Setup event listeners for the token tracker
   */
  private setupTokenTrackerListeners(): void {
    this.tokenTracker.on('request_complete', (event) => {
      // Real-time updates could be handled here
      this.emit('metrics_event', {
        type: 'request_complete',
        timestamp: new Date(),
        data: event.data,
      });
    });

    this.tokenTracker.on('anomaly_detected', (event) => {
      this.emit('metrics_event', {
        type: 'anomaly_detected',
        timestamp: new Date(),
        data: event.data,
      });
    });
  }
}

/**
 * Create a new MetricsCollector instance
 */
export function createMetricsCollector(
  tokenTracker: TokenTracker,
  config?: MetricsCollectorConfig,
): MetricsCollector {
  return new MetricsCollector(tokenTracker, config);
}
