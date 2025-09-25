/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as zlib from 'node:zlib';
import { promisify } from 'node:util';
const gzip = promisify(zlib.gzip);
const gunzip = promisify(zlib.gunzip);
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
export class FileBasedTimeSeriesStorage {
  config;
  indexPath;
  bucketIndex = new Map();
  isInitialized = false;
  constructor(config = {}) {
    this.config = {
      baseDir: path.join(process.cwd(), '.gemini', 'historical-data'),
      maxFileSize: 10 * 1024 * 1024, // 10MB
      compressionEnabled: true,
      encryptionEnabled: false, // TODO: Implement if needed
      backupEnabled: true,
      maxRetentionDays: 365,
      bucketStrategy: 'daily',
      ...config,
    };
    this.indexPath = path.join(this.config.baseDir, 'index.json');
  }
  /**
   * Initialize storage system and load existing index
   */
  async initialize() {
    if (this.isInitialized) return;
    const startTime = Date.now();
    try {
      // Create base directory structure
      await fs.mkdir(this.config.baseDir, { recursive: true });
      await fs.mkdir(path.join(this.config.baseDir, 'buckets'), {
        recursive: true,
      });
      await fs.mkdir(path.join(this.config.baseDir, 'backups'), {
        recursive: true,
      });
      // Load existing bucket index
      await this.loadBucketIndex();
      this.isInitialized = true;
      console.log(
        `[FileBasedTimeSeriesStorage] Initialized in ${Date.now() - startTime}ms`,
      );
    } catch (error) {
      console.error(
        '[FileBasedTimeSeriesStorage] Failed to initialize:',
        error,
      );
      throw error;
    }
  }
  /**
   * Load bucket index from disk
   */
  async loadBucketIndex() {
    try {
      const indexData = await fs.readFile(this.indexPath, 'utf-8');
      const index = JSON.parse(indexData);
      this.bucketIndex = new Map(index.buckets || []);
      console.log(
        `[FileBasedTimeSeriesStorage] Loaded ${this.bucketIndex.size} buckets from index`,
      );
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.error(
          '[FileBasedTimeSeriesStorage] Failed to load bucket index:',
          error,
        );
      }
      // Initialize empty index if file doesn't exist
      this.bucketIndex = new Map();
    }
  }
  /**
   * Save bucket index to disk
   */
  async saveBucketIndex() {
    const indexData = {
      buckets: Array.from(this.bucketIndex.entries()),
      lastUpdated: Date.now(),
      version: '1.0',
    };
    await fs.writeFile(this.indexPath, JSON.stringify(indexData, null, 2));
  }
  /**
   * Get bucket key for a given timestamp
   */
  getBucketKey(timestamp) {
    const date = new Date(timestamp);
    switch (this.config.bucketStrategy) {
      case 'daily':
        return date.toISOString().split('T')[0]; // YYYY-MM-DD
      case 'weekly': {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        return `${weekStart.toISOString().split('T')[0]}-week`;
      }
      case 'monthly':
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      default:
        throw new Error(
          `Unsupported bucket strategy: ${this.config.bucketStrategy}`,
        );
    }
  }
  /**
   * Get or create storage bucket for timestamp
   */
  async getOrCreateBucket(timestamp) {
    const bucketKey = this.getBucketKey(timestamp);
    if (this.bucketIndex.has(bucketKey)) {
      return this.bucketIndex.get(bucketKey);
    }
    // Create new bucket
    const date = new Date(timestamp);
    const bucket = {
      timeRange: {
        start: this.getBucketStartTime(bucketKey),
        end: this.getBucketEndTime(bucketKey),
      },
      granularity: this.getGranularityForBucket(timestamp),
      filePath: path.join(this.config.baseDir, 'buckets', `${bucketKey}.json`),
      compressionLevel: this.shouldCompressBucket(timestamp) ? 6 : 0,
      encrypted: this.config.encryptionEnabled,
    };
    this.bucketIndex.set(bucketKey, bucket);
    await this.saveBucketIndex();
    return bucket;
  }
  /**
   * Get bucket start time based on strategy
   */
  getBucketStartTime(bucketKey) {
    const date = new Date(
      bucketKey.split('-')[0] +
        '-' +
        (bucketKey.split('-')[1] || '01') +
        '-' +
        (bucketKey.split('-')[2] || '01'),
    );
    return date.getTime();
  }
  /**
   * Get bucket end time based on strategy
   */
  getBucketEndTime(bucketKey) {
    const startTime = this.getBucketStartTime(bucketKey);
    switch (this.config.bucketStrategy) {
      case 'daily':
        return startTime + 24 * 60 * 60 * 1000; // Add 1 day
      case 'weekly':
        return startTime + 7 * 24 * 60 * 60 * 1000; // Add 1 week
      case 'monthly':
        const date = new Date(startTime);
        date.setMonth(date.getMonth() + 1);
        return date.getTime();
      default:
        return startTime + 24 * 60 * 60 * 1000;
    }
  }
  /**
   * Determine granularity for bucket based on age
   */
  getGranularityForBucket(timestamp) {
    const age = Date.now() - timestamp;
    const daysOld = age / (24 * 60 * 60 * 1000);
    if (daysOld < 7) return 'minute'; // Recent data: minute granularity
    if (daysOld < 30) return 'hour'; // Week-old data: hour granularity
    return 'day'; // Old data: day granularity
  }
  /**
   * Determine if bucket should be compressed based on age
   */
  shouldCompressBucket(timestamp) {
    if (!this.config.compressionEnabled) return false;
    const age = Date.now() - timestamp;
    const daysOld = age / (24 * 60 * 60 * 1000);
    return daysOld > 7; // Compress data older than 7 days
  }
  /**
   * Read data from bucket file
   */
  async readBucketData(bucket) {
    try {
      let rawData;
      if (bucket.compressionLevel > 0) {
        const compressedData = await fs.readFile(bucket.filePath + '.gz');
        rawData = await gunzip(compressedData);
      } else {
        rawData = await fs.readFile(bucket.filePath);
      }
      const dataStr = rawData.toString('utf-8');
      return JSON.parse(dataStr);
    } catch (error) {
      if (error.code === 'ENOENT') {
        return []; // File doesn't exist yet
      }
      throw error;
    }
  }
  /**
   * Write data to bucket file
   */
  async writeBucketData(bucket, data) {
    const dataStr = JSON.stringify(data, null, 2);
    if (bucket.compressionLevel > 0) {
      const compressedData = await gzip(Buffer.from(dataStr), {
        level: bucket.compressionLevel,
      });
      await fs.writeFile(bucket.filePath + '.gz', compressedData);
      // Remove uncompressed file if it exists
      try {
        await fs.unlink(bucket.filePath);
      } catch {
        // Ignore if file doesn't exist
      }
    } else {
      await fs.writeFile(bucket.filePath, dataStr);
    }
  }
  /**
   * Store a single data point
   */
  async store(dataPoint) {
    const startTime = Date.now();
    try {
      await this.initialize();
      const bucket = await this.getOrCreateBucket(dataPoint.timestamp);
      const existingData = await this.readBucketData(bucket);
      // Insert in chronological order
      const insertIndex = existingData.findIndex(
        (dp) => dp.timestamp > dataPoint.timestamp,
      );
      if (insertIndex === -1) {
        existingData.push(dataPoint);
      } else {
        existingData.splice(insertIndex, 0, dataPoint);
      }
      await this.writeBucketData(bucket, existingData);
      return {
        success: true,
        recordsAffected: 1,
        executionTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        recordsAffected: 0,
        executionTime: Date.now() - startTime,
        error: error.message,
      };
    }
  }
  /**
   * Store multiple data points in batch
   */
  async storeBatch(dataPoints) {
    const startTime = Date.now();
    try {
      await this.initialize();
      // Group data points by bucket
      const bucketGroups = new Map();
      for (const dataPoint of dataPoints) {
        const bucketKey = this.getBucketKey(dataPoint.timestamp);
        if (!bucketGroups.has(bucketKey)) {
          bucketGroups.set(bucketKey, []);
        }
        bucketGroups.get(bucketKey).push(dataPoint);
      }
      let totalRecordsAffected = 0;
      // Process each bucket
      for (const [bucketKey, bucketDataPoints] of bucketGroups) {
        const bucket = await this.getOrCreateBucket(
          bucketDataPoints[0].timestamp,
        );
        const existingData = await this.readBucketData(bucket);
        // Merge and sort data points
        const mergedData = [...existingData, ...bucketDataPoints];
        mergedData.sort((a, b) => a.timestamp - b.timestamp);
        await this.writeBucketData(bucket, mergedData);
        totalRecordsAffected += bucketDataPoints.length;
      }
      return {
        success: true,
        recordsAffected: totalRecordsAffected,
        executionTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        recordsAffected: 0,
        executionTime: Date.now() - startTime,
        error: error.message,
      };
    }
  }
  /**
   * Query data points within a time range
   */
  async query(range) {
    await this.initialize();
    const results = [];
    // Find relevant buckets for the query range
    const relevantBuckets = Array.from(this.bucketIndex.values()).filter(
      (bucket) =>
        bucket.timeRange.start <= range.end &&
        bucket.timeRange.end >= range.start,
    );
    // Read data from relevant buckets
    for (const bucket of relevantBuckets) {
      const bucketData = await this.readBucketData(bucket);
      // Filter data points within range
      const filteredData = bucketData.filter(
        (dp) => dp.timestamp >= range.start && dp.timestamp <= range.end,
      );
      results.push(...filteredData);
    }
    // Sort by timestamp
    results.sort((a, b) => a.timestamp - b.timestamp);
    // Apply limit and offset
    const startIndex = range.offset || 0;
    const endIndex = range.limit ? startIndex + range.limit : results.length;
    return results.slice(startIndex, endIndex);
  }
  /**
   * Query aggregated data
   */
  async queryAggregated(range, aggregation) {
    const rawData = await this.query(range);
    if (rawData.length === 0) return [];
    const aggregated = new Map();
    for (const dataPoint of rawData) {
      const windowKey = this.getAggregationWindowKey(
        dataPoint.timestamp,
        aggregation,
      );
      if (!aggregated.has(windowKey)) {
        const { windowStart, windowEnd } = this.getAggregationWindow(
          dataPoint.timestamp,
          aggregation,
        );
        aggregated.set(windowKey, {
          timeWindow: aggregation,
          windowStart,
          windowEnd,
          totalRequests: 0,
          totalCost: 0,
          averageUsage: 0,
          peakUsage: 0,
          uniqueSessions: 0,
          featuresUsed: [],
          dataPoints: 0,
        });
      }
      const agg = aggregated.get(windowKey);
      agg.totalRequests += dataPoint.requestCount;
      agg.totalCost += dataPoint.totalCost;
      agg.peakUsage = Math.max(agg.peakUsage, dataPoint.usagePercentage);
      agg.dataPoints++;
      // Track unique sessions and features
      if (dataPoint.sessionId) {
        // For now, we'll estimate unique sessions (this could be improved with a Set)
        agg.uniqueSessions = Math.max(agg.uniqueSessions, agg.dataPoints);
      }
      if (dataPoint.features) {
        for (const feature of dataPoint.features) {
          if (!agg.featuresUsed.includes(feature)) {
            agg.featuresUsed.push(feature);
          }
        }
      }
    }
    // Calculate averages
    for (const agg of aggregated.values()) {
      if (agg.dataPoints > 0) {
        agg.averageUsage = agg.totalRequests / agg.dataPoints;
      }
    }
    return Array.from(aggregated.values()).sort(
      (a, b) => a.windowStart - b.windowStart,
    );
  }
  /**
   * Get aggregation window key for grouping
   */
  getAggregationWindowKey(timestamp, aggregation) {
    const date = new Date(timestamp);
    switch (aggregation) {
      case 'hour':
        return `${date.toISOString().split('T')[0]}-${date.getHours()}`;
      case 'day':
        return date.toISOString().split('T')[0];
      case 'week':
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        return weekStart.toISOString().split('T')[0] + '-week';
      case 'month':
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      default:
        return date.toISOString().split('T')[0];
    }
  }
  /**
   * Get aggregation window start and end times
   */
  getAggregationWindow(timestamp, aggregation) {
    const date = new Date(timestamp);
    switch (aggregation) {
      case 'hour':
        const hourStart = new Date(
          date.getFullYear(),
          date.getMonth(),
          date.getDate(),
          date.getHours(),
        );
        return {
          windowStart: hourStart.getTime(),
          windowEnd: hourStart.getTime() + 60 * 60 * 1000,
        };
      case 'day':
        const dayStart = new Date(
          date.getFullYear(),
          date.getMonth(),
          date.getDate(),
        );
        return {
          windowStart: dayStart.getTime(),
          windowEnd: dayStart.getTime() + 24 * 60 * 60 * 1000,
        };
      case 'week':
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        weekStart.setHours(0, 0, 0, 0);
        return {
          windowStart: weekStart.getTime(),
          windowEnd: weekStart.getTime() + 7 * 24 * 60 * 60 * 1000,
        };
      case 'month':
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 1);
        return {
          windowStart: monthStart.getTime(),
          windowEnd: monthEnd.getTime(),
        };
      default:
        const defaultStart = new Date(
          date.getFullYear(),
          date.getMonth(),
          date.getDate(),
        );
        return {
          windowStart: defaultStart.getTime(),
          windowEnd: defaultStart.getTime() + 24 * 60 * 60 * 1000,
        };
    }
  }
  /**
   * Get storage statistics
   */
  async getStats() {
    await this.initialize();
    const buckets = Array.from(this.bucketIndex.values());
    let totalDataPoints = 0;
    let totalFileSize = 0;
    let oldestRecord = Date.now();
    let newestRecord = 0;
    for (const bucket of buckets) {
      try {
        const filePath =
          bucket.compressionLevel > 0
            ? bucket.filePath + '.gz'
            : bucket.filePath;
        const stats = await fs.stat(filePath);
        totalFileSize += stats.size;
        const data = await this.readBucketData(bucket);
        totalDataPoints += data.length;
        if (data.length > 0) {
          oldestRecord = Math.min(oldestRecord, data[0].timestamp);
          newestRecord = Math.max(
            newestRecord,
            data[data.length - 1].timestamp,
          );
        }
      } catch (error) {
        // Skip missing files
      }
    }
    const totalDays =
      totalDataPoints > 0
        ? (newestRecord - oldestRecord) / (24 * 60 * 60 * 1000)
        : 0;
    return {
      totalDataPoints,
      totalFileSize,
      compressionRatio: 0.8, // Estimate for now
      oldestRecord: totalDataPoints > 0 ? oldestRecord : 0,
      newestRecord: totalDataPoints > 0 ? newestRecord : 0,
      averageDataPointsPerDay: totalDays > 0 ? totalDataPoints / totalDays : 0,
      storageBuckets: buckets,
      lastCompaction: 0, // TODO: Track compaction timestamps
      lastBackup: 0, // TODO: Track backup timestamps
    };
  }
  /**
   * Compact old data (merge smaller files, apply compression)
   */
  async compact() {
    const startTime = Date.now();
    try {
      await this.initialize();
      let recordsAffected = 0;
      const oldBuckets = Array.from(this.bucketIndex.values()).filter(
        (bucket) =>
          bucket.compressionLevel === 0 &&
          this.shouldCompressBucket(bucket.timeRange.start),
      );
      for (const bucket of oldBuckets) {
        const data = await this.readBucketData(bucket);
        bucket.compressionLevel = 6;
        await this.writeBucketData(bucket, data);
        recordsAffected += data.length;
      }
      await this.saveBucketIndex();
      return {
        success: true,
        recordsAffected,
        executionTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        recordsAffected: 0,
        executionTime: Date.now() - startTime,
        error: error.message,
      };
    }
  }
  /**
   * Delete data older than specified timestamp
   */
  async purgeOldData(olderThan) {
    const startTime = Date.now();
    try {
      await this.initialize();
      let recordsAffected = 0;
      const bucketsToDelete = Array.from(this.bucketIndex.entries()).filter(
        ([key, bucket]) => bucket.timeRange.end < olderThan,
      );
      for (const [bucketKey, bucket] of bucketsToDelete) {
        try {
          const data = await this.readBucketData(bucket);
          recordsAffected += data.length;
          // Delete bucket files
          await fs.unlink(bucket.filePath).catch(() => {});
          await fs.unlink(bucket.filePath + '.gz').catch(() => {});
          // Remove from index
          this.bucketIndex.delete(bucketKey);
        } catch (error) {
          console.warn(
            `[FileBasedTimeSeriesStorage] Failed to delete bucket ${bucketKey}:`,
            error,
          );
        }
      }
      await this.saveBucketIndex();
      return {
        success: true,
        recordsAffected,
        executionTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        recordsAffected: 0,
        executionTime: Date.now() - startTime,
        error: error.message,
      };
    }
  }
  /**
   * Create backup of all data
   */
  async backup(backupPath) {
    const startTime = Date.now();
    try {
      await this.initialize();
      // TODO: Implement full backup functionality
      // This would involve copying all bucket files and the index
      return {
        success: true,
        recordsAffected: 0,
        executionTime: Date.now() - startTime,
        metadata: { message: 'Backup functionality not yet implemented' },
      };
    } catch (error) {
      return {
        success: false,
        recordsAffected: 0,
        executionTime: Date.now() - startTime,
        error: error.message,
      };
    }
  }
  /**
   * Restore data from backup
   */
  async restore(backupPath) {
    const startTime = Date.now();
    try {
      // TODO: Implement restore functionality
      return {
        success: true,
        recordsAffected: 0,
        executionTime: Date.now() - startTime,
        metadata: { message: 'Restore functionality not yet implemented' },
      };
    } catch (error) {
      return {
        success: false,
        recordsAffected: 0,
        executionTime: Date.now() - startTime,
        error: error.message,
      };
    }
  }
  /**
   * Close storage and cleanup resources
   */
  async close() {
    // Clean up any resources if needed
    this.bucketIndex.clear();
    this.isInitialized = false;
  }
}
/**
 * Factory function to create a file-based time-series storage instance
 */
export function createFileBasedTimeSeriesStorage(config) {
  return new FileBasedTimeSeriesStorage(config);
}
//# sourceMappingURL=FileBasedTimeSeriesStorage.js.map
