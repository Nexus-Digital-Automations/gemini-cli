/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { BudgetUsageTimeSeriesPoint } from '../storage/types.js';
/**
 * Aggregation time window types
 */
export type AggregationWindow =
  | 'minute'
  | 'hour'
  | 'day'
  | 'week'
  | 'month'
  | 'quarter'
  | 'year';
/**
 * Aggregation function types
 */
export type AggregationFunction =
  | 'sum'
  | 'avg'
  | 'min'
  | 'max'
  | 'count'
  | 'stddev'
  | 'percentile';
/**
 * Statistical summary for aggregated data
 */
export interface StatisticalSummary {
  sum: number;
  avg: number;
  min: number;
  max: number;
  count: number;
  stddev: number;
  percentiles: {
    p25: number;
    p50: number;
    p75: number;
    p90: number;
    p95: number;
    p99: number;
  };
  variance: number;
  skewness: number;
  kurtosis: number;
}
/**
 * Multi-dimensional aggregation result
 */
export interface AggregationResult {
  timeWindow: AggregationWindow;
  windowStart: number;
  windowEnd: number;
  dataPointCount: number;
  usage: StatisticalSummary;
  cost: StatisticalSummary;
  requests: StatisticalSummary;
  usagePercentage: StatisticalSummary;
  costPerRequest: StatisticalSummary;
  requestsPerHour: number;
  peakUsageHour?: number;
  lowUsageHour?: number;
  featureDistribution: Record<string, number>;
  sessionCount: number;
  uniqueUsers: number;
  dayOfWeekPattern?: number[];
  hourOfDayPattern?: number[];
  dataQuality: number;
  confidenceInterval: {
    lower: number;
    upper: number;
    confidence: number;
  };
  metadata?: Record<string, unknown>;
}
/**
 * Aggregation configuration
 */
export interface AggregationConfig {
  windows: AggregationWindow[];
  startTime?: number;
  endTime?: number;
  calculatePercentiles: boolean;
  percentileLevels: number[];
  confidenceLevel: number;
  trackFeatureDistribution: boolean;
  trackTimePatterns: boolean;
  includeAdvancedStats: boolean;
  batchSize: number;
  parallelProcessing: boolean;
  cacheResults: boolean;
  minDataPoints: number;
  outlierDetection: boolean;
  outlierThreshold: number;
  metadata?: Record<string, unknown>;
}
/**
 * Multi-level aggregation hierarchy
 */
export interface AggregationHierarchy {
  level: number;
  window: AggregationWindow;
  parentLevel?: AggregationHierarchy;
  childLevels: AggregationHierarchy[];
  rollupFactor: number;
}
/**
 * Aggregation job specification
 */
export interface AggregationJob {
  id: string;
  name: string;
  config: AggregationConfig;
  hierarchy: AggregationHierarchy;
  schedule?: {
    frequency: 'realtime' | 'hourly' | 'daily' | 'weekly';
    cronExpression?: string;
  };
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: {
    current: number;
    total: number;
    percentage: number;
  };
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  error?: string;
  results?: AggregationResult[];
}
/**
 * Rollup strategy for data compression
 */
export interface RollupStrategy {
  strategy: 'time_based' | 'threshold_based' | 'hybrid';
  timeBased?: {
    retentionPeriods: {
      raw: number;
      hourly: number;
      daily: number;
      weekly: number;
      monthly: number;
    };
  };
  thresholdBased?: {
    maxRawRecords: number;
    maxAggregateRecords: number;
    compressionRatio: number;
  };
  hybrid?: {
    timeBased: RollupStrategy['timeBased'];
    thresholdBased: RollupStrategy['thresholdBased'];
    priorityMetric: 'age' | 'access_frequency' | 'data_quality';
  };
}
/**
 * Pre-computed aggregation cache
 */
export interface AggregationCache {
  key: string;
  windowStart: number;
  windowEnd: number;
  window: AggregationWindow;
  result: AggregationResult;
  computedAt: number;
  accessCount: number;
  lastAccessed: number;
  expiresAt?: number;
  dependencies: string[];
  invalidated: boolean;
}
/**
 * Aggregation engine interface
 */
export interface AggregationEngine {
  /**
   * Perform aggregation on raw data
   */
  aggregate(
    data: BudgetUsageTimeSeriesPoint[],
    config: AggregationConfig,
  ): Promise<AggregationResult[]>;
  /**
   * Create multi-level aggregation hierarchy
   */
  createHierarchy(
    baseWindow: AggregationWindow,
    levels: number,
  ): AggregationHierarchy;
  /**
   * Execute rollup strategy
   */
  rollup(strategy: RollupStrategy): Promise<void>;
  /**
   * Get or compute cached aggregation
   */
  getCachedAggregation(
    windowStart: number,
    windowEnd: number,
    window: AggregationWindow,
  ): Promise<AggregationResult | null>;
  /**
   * Invalidate cache entries
   */
  invalidateCache(dependencies: string[]): Promise<void>;
  /**
   * Schedule aggregation job
   */
  scheduleJob(job: AggregationJob): Promise<string>;
  /**
   * Get job status
   */
  getJobStatus(jobId: string): Promise<AggregationJob>;
  /**
   * Cancel running job
   */
  cancelJob(jobId: string): Promise<void>;
  /**
   * Get aggregation statistics
   */
  getStats(): Promise<{
    totalAggregations: number;
    cacheHitRatio: number;
    averageAggregationTime: number;
    pendingJobs: number;
    runningJobs: number;
  }>;
}
