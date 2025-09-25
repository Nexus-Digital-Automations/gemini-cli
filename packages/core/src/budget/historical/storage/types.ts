/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Time-series data point for budget usage
 */
export interface BudgetUsageTimeSeriesPoint {
  timestamp: number; // Unix timestamp in milliseconds
  date: string; // ISO date string for easy querying
  requestCount: number;
  totalCost: number;
  dailyLimit: number;
  usagePercentage: number;
  resetTime: string;
  sessionId?: string;
  features?: string[]; // Which features were used
  metadata?: Record<string, unknown>;
}

/**
 * Aggregated time-series data for different time windows
 */
export interface AggregatedUsageData {
  timeWindow: 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year';
  windowStart: number; // Unix timestamp
  windowEnd: number; // Unix timestamp
  totalRequests: number;
  totalCost: number;
  averageUsage: number;
  peakUsage: number;
  uniqueSessions: number;
  featuresUsed: string[];
  dataPoints: number; // Number of raw data points in this aggregation
}

/**
 * Storage bucket configuration for data organization
 */
export interface StorageBucket {
  timeRange: {
    start: number;
    end: number;
  };
  granularity: 'minute' | 'hour' | 'day';
  filePath: string;
  compressionLevel: number; // 0-9, higher = more compression
  encrypted: boolean;
  metadata?: Record<string, unknown>;
}

/**
 * Data storage configuration
 */
export interface StorageConfig {
  baseDir: string;
  maxFileSize: number; // Maximum file size in bytes before splitting
  compressionEnabled: boolean;
  encryptionEnabled: boolean;
  backupEnabled: boolean;
  maxRetentionDays: number;
  bucketStrategy: 'daily' | 'weekly' | 'monthly';
}

/**
 * Storage statistics and metadata
 */
export interface StorageStats {
  totalDataPoints: number;
  totalFileSize: number;
  compressionRatio: number;
  oldestRecord: number; // Unix timestamp
  newestRecord: number; // Unix timestamp
  averageDataPointsPerDay: number;
  storageBuckets: StorageBucket[];
  lastCompaction: number; // Unix timestamp
  lastBackup: number; // Unix timestamp
}

/**
 * Query range specification
 */
export interface QueryRange {
  start: number; // Unix timestamp
  end: number; // Unix timestamp
  granularity?: 'minute' | 'hour' | 'day';
  limit?: number;
  offset?: number;
}

/**
 * Storage operation result
 */
export interface StorageOperationResult {
  success: boolean;
  recordsAffected: number;
  executionTime: number; // milliseconds
  error?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Time-series database interface
 */
export interface TimeSeriesStorage {
  /**
   * Store a single data point
   */
  store(dataPoint: BudgetUsageTimeSeriesPoint): Promise<StorageOperationResult>;

  /**
   * Store multiple data points in batch
   */
  storeBatch(dataPoints: BudgetUsageTimeSeriesPoint[]): Promise<StorageOperationResult>;

  /**
   * Query data points within a time range
   */
  query(range: QueryRange): Promise<BudgetUsageTimeSeriesPoint[]>;

  /**
   * Query aggregated data
   */
  queryAggregated(
    range: QueryRange,
    aggregation: 'hour' | 'day' | 'week' | 'month'
  ): Promise<AggregatedUsageData[]>;

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