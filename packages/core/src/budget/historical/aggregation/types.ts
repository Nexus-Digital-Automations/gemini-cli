/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { BudgetUsageTimeSeriesPoint } from '../storage/types.js';

/**
 * Aggregation time window types
 */
export type AggregationWindow = 'minute' | 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year';

/**
 * Aggregation function types
 */
export type AggregationFunction = 'sum' | 'avg' | 'min' | 'max' | 'count' | 'stddev' | 'percentile';

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
    p50: number; // median
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
  windowStart: number; // Unix timestamp
  windowEnd: number; // Unix timestamp
  dataPointCount: number;

  // Core metrics
  usage: StatisticalSummary;
  cost: StatisticalSummary;
  requests: StatisticalSummary;
  usagePercentage: StatisticalSummary;

  // Derived metrics
  costPerRequest: StatisticalSummary;
  requestsPerHour: number;
  peakUsageHour?: number; // Hour of day (0-23) with peak usage
  lowUsageHour?: number; // Hour of day (0-23) with lowest usage

  // Categorical aggregations
  featureDistribution: Record<string, number>; // Feature usage counts
  sessionCount: number;
  uniqueUsers: number;

  // Time-based patterns
  dayOfWeekPattern?: number[]; // Usage by day of week (0=Sunday)
  hourOfDayPattern?: number[]; // Usage by hour of day

  // Quality metrics
  dataQuality: number; // 0-1 score based on completeness and consistency
  confidenceInterval: {
    lower: number;
    upper: number;
    confidence: number; // e.g., 0.95 for 95%
  };

  metadata?: Record<string, unknown>;
}

/**
 * Aggregation configuration
 */
export interface AggregationConfig {
  // Time window settings
  windows: AggregationWindow[];
  startTime?: number; // Unix timestamp
  endTime?: number; // Unix timestamp

  // Statistical settings
  calculatePercentiles: boolean;
  percentileLevels: number[]; // e.g., [25, 50, 75, 90, 95, 99]
  confidenceLevel: number; // e.g., 0.95 for 95% confidence

  // Feature settings
  trackFeatureDistribution: boolean;
  trackTimePatterns: boolean;
  includeAdvancedStats: boolean; // skewness, kurtosis, etc.

  // Performance settings
  batchSize: number;
  parallelProcessing: boolean;
  cacheResults: boolean;

  // Data quality settings
  minDataPoints: number; // Minimum data points required for valid aggregation
  outlierDetection: boolean;
  outlierThreshold: number; // Number of standard deviations

  metadata?: Record<string, unknown>;
}

/**
 * Multi-level aggregation hierarchy
 */
export interface AggregationHierarchy {
  level: number; // 0 = raw data, 1 = first level aggregation, etc.
  window: AggregationWindow;
  parentLevel?: AggregationHierarchy;
  childLevels: AggregationHierarchy[];
  rollupFactor: number; // How many child records roll up to one parent record
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

  // Time-based rollup
  timeBased?: {
    retentionPeriods: {
      raw: number; // days to keep raw data
      hourly: number; // days to keep hourly aggregates
      daily: number; // days to keep daily aggregates
      weekly: number; // days to keep weekly aggregates
      monthly: number; // days to keep monthly aggregates
    };
  };

  // Threshold-based rollup
  thresholdBased?: {
    maxRawRecords: number;
    maxAggregateRecords: number;
    compressionRatio: number; // Target compression ratio
  };

  // Hybrid approach
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
  dependencies: string[]; // Keys of dependent raw data or other aggregations
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
    config: AggregationConfig
  ): Promise<AggregationResult[]>;

  /**
   * Create multi-level aggregation hierarchy
   */
  createHierarchy(
    baseWindow: AggregationWindow,
    levels: number
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
    window: AggregationWindow
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