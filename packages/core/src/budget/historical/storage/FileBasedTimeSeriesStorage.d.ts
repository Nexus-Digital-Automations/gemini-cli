/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type {
  TimeSeriesStorage,
  BudgetUsageTimeSeriesPoint,
  AggregatedUsageData,
  StorageConfig,
  StorageStats,
  QueryRange,
  StorageOperationResult,
} from './types.js';
/**
 * File-based time-series storage implementation for budget usage data
 *
 * Features:
 * - Time-based file organization (daily/weekly/monthly buckets)
 * - Compression support for old data
 * - Efficient querying with indexing
 * - Automatic data compaction and cleanup
 * - Backup and restore capabilities
 */
export declare class FileBasedTimeSeriesStorage implements TimeSeriesStorage {
  private readonly config;
  private readonly indexPath;
  private bucketIndex;
  private isInitialized;
  constructor(config?: Partial<StorageConfig>);
  /**
   * Initialize storage system and load existing index
   */
  private initialize;
  /**
   * Load bucket index from disk
   */
  private loadBucketIndex;
  /**
   * Save bucket index to disk
   */
  private saveBucketIndex;
  /**
   * Get bucket key for a given timestamp
   */
  private getBucketKey;
  /**
   * Get or create storage bucket for timestamp
   */
  private getOrCreateBucket;
  /**
   * Get bucket start time based on strategy
   */
  private getBucketStartTime;
  /**
   * Get bucket end time based on strategy
   */
  private getBucketEndTime;
  /**
   * Determine granularity for bucket based on age
   */
  private getGranularityForBucket;
  /**
   * Determine if bucket should be compressed based on age
   */
  private shouldCompressBucket;
  /**
   * Read data from bucket file
   */
  private readBucketData;
  /**
   * Write data to bucket file
   */
  private writeBucketData;
  /**
   * Store a single data point
   */
  store(dataPoint: BudgetUsageTimeSeriesPoint): Promise<StorageOperationResult>;
  /**
   * Store multiple data points in batch
   */
  storeBatch(
    dataPoints: BudgetUsageTimeSeriesPoint[],
  ): Promise<StorageOperationResult>;
  /**
   * Query data points within a time range
   */
  query(range: QueryRange): Promise<BudgetUsageTimeSeriesPoint[]>;
  /**
   * Query aggregated data
   */
  queryAggregated(
    range: QueryRange,
    aggregation: 'hour' | 'day' | 'week' | 'month',
  ): Promise<AggregatedUsageData[]>;
  /**
   * Get aggregation window key for grouping
   */
  private getAggregationWindowKey;
  /**
   * Get aggregation window start and end times
   */
  private getAggregationWindow;
  /**
   * Get storage statistics
   */
  getStats(): Promise<StorageStats>;
  /**
   * Compact old data (merge smaller files, apply compression)
   */
  compact(): Promise<StorageOperationResult>;
  /**
   * Delete data older than specified timestamp
   */
  purgeOldData(olderThan: number): Promise<StorageOperationResult>;
  /**
   * Create backup of all data
   */
  backup(backupPath: string): Promise<StorageOperationResult>;
  /**
   * Restore data from backup
   */
  restore(backupPath: string): Promise<StorageOperationResult>;
  /**
   * Close storage and cleanup resources
   */
  close(): Promise<void>;
}
/**
 * Factory function to create a file-based time-series storage instance
 */
export declare function createFileBasedTimeSeriesStorage(
  config?: Partial<StorageConfig>,
): FileBasedTimeSeriesStorage;
