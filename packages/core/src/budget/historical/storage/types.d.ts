/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Time-series data point for budget usage
 */
export interface BudgetUsageTimeSeriesPoint {
    timestamp: number;
    date: string;
    requestCount: number;
    totalCost: number;
    dailyLimit: number;
    usagePercentage: number;
    resetTime: string;
    sessionId?: string;
    features?: string[];
    metadata?: Record<string, unknown>;
}
/**
 * Aggregated time-series data for different time windows
 */
export interface AggregatedUsageData {
    timeWindow: 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year';
    windowStart: number;
    windowEnd: number;
    totalRequests: number;
    totalCost: number;
    averageUsage: number;
    peakUsage: number;
    uniqueSessions: number;
    featuresUsed: string[];
    dataPoints: number;
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
    compressionLevel: number;
    encrypted: boolean;
    metadata?: Record<string, unknown>;
}
/**
 * Data storage configuration
 */
export interface StorageConfig {
    baseDir: string;
    maxFileSize: number;
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
    oldestRecord: number;
    newestRecord: number;
    averageDataPointsPerDay: number;
    storageBuckets: StorageBucket[];
    lastCompaction: number;
    lastBackup: number;
}
/**
 * Query range specification
 */
export interface QueryRange {
    start: number;
    end: number;
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
    executionTime: number;
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
    queryAggregated(range: QueryRange, aggregation: 'hour' | 'day' | 'week' | 'month'): Promise<AggregatedUsageData[]>;
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
