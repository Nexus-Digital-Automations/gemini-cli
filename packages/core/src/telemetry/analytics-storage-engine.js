/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { performance } from 'node:perf_hooks';
import {
  createWriteStream,
  createReadStream,
  existsSync,
  mkdirSync,
  statSync,
  readdirSync,
} from 'node:fs';
import { join, dirname } from 'node:path';
import { createHash } from 'node:crypto';
import { promisify } from 'node:util';
import { pipeline } from 'node:stream';
import * as zlib from 'node:zlib';
import EventEmitter from 'node:events';
import { getComponentLogger, createTimer, LogLevel } from '../utils/logger.js';
const pipelineAsync = promisify(pipeline);
const logger = getComponentLogger('AnalyticsStorageEngine');
/**
 * In-memory cache for frequently accessed data
 */
class QueryCache {
  cache = new Map();
  maxSize = 100;
  ttlMs = 5 * 60 * 1000; // 5 minutes
  get(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > this.ttlMs) {
      this.cache.delete(key);
      return null;
    }
    entry.hits++;
    entry.timestamp = Date.now(); // Refresh TTL on access
    return entry.data;
  }
  set(key, data) {
    if (this.cache.size >= this.maxSize) {
      // Evict least recently used entry
      let lruKey = '';
      let oldestTime = Date.now();
      for (const [k, v] of this.cache.entries()) {
        if (v.timestamp < oldestTime) {
          oldestTime = v.timestamp;
          lruKey = k;
        }
      }
      if (lruKey) {
        this.cache.delete(lruKey);
      }
    }
    this.cache.set(key, { data, timestamp: Date.now(), hits: 0 });
  }
  clear() {
    this.cache.clear();
  }
  getStats() {
    let totalHits = 0;
    let totalRequests = 0;
    for (const entry of this.cache.values()) {
      totalHits += entry.hits;
      totalRequests += Math.max(1, entry.hits);
    }
    return {
      size: this.cache.size,
      hitRate: totalRequests > 0 ? totalHits / totalRequests : 0,
    };
  }
}
/**
 * High-performance analytics storage engine optimized for time-series token usage data
 */
export class AnalyticsStorageEngine extends EventEmitter {
  config;
  basePath;
  partitionMetadata = new Map();
  queryCache = new QueryCache();
  writeBuffer = [];
  writeTimeout = null;
  writeBufferMaxSize = 1000;
  writeBufferTimeoutMs = 30000; // 30 seconds
  constructor(config, basePath) {
    super();
    this.config = config;
    this.basePath = basePath || join(process.cwd(), '.gemini-analytics');
    this.ensureDirectoryExists(this.basePath);
    this.loadPartitionMetadata();
    this.setupMaintenanceTasks();
    this.setMaxListeners(50); // Support multiple consumers
    logger.info('AnalyticsStorageEngine initialized', {
      basePath: this.basePath,
      config: this.config,
      existingPartitions: this.partitionMetadata.size,
    });
  }
  /**
   * Store token usage data with automatic partitioning and compression
   */
  async storeTokenUsage(data) {
    const dataArray = Array.isArray(data) ? data : [data];
    for (const item of dataArray) {
      this.writeBuffer.push(item);
    }
    if (this.writeBuffer.length >= this.writeBufferMaxSize) {
      await this.flushWriteBuffer();
    } else if (!this.writeTimeout) {
      this.writeTimeout = setTimeout(
        () => this.flushWriteBuffer(),
        this.writeBufferTimeoutMs,
      );
    }
  }
  /**
   * Query token usage data with advanced filtering and aggregation
   */
  async queryTokenUsage(query) {
    const startTime = performance.now();
    const endTimer = createTimer(logger, 'queryTokenUsage', LogLevel.DEBUG);
    try {
      // Generate cache key
      const cacheKey = this.generateCacheKey(query);
      // Check cache first
      const cachedResult = this.queryCache.get(cacheKey);
      if (cachedResult) {
        logger.debug('Query cache hit', { cacheKey });
        return {
          ...cachedResult,
          queryTimeMs: performance.now() - startTime,
          metadata: { ...cachedResult.metadata, cacheHit: true },
        };
      }
      // Find relevant partitions
      const relevantPartitions = this.findRelevantPartitions(query);
      logger.debug('Found relevant partitions', {
        count: relevantPartitions.length,
        partitionIds: relevantPartitions.map((p) => p.partitionId),
      });
      // Execute query across partitions
      const results = [];
      let indexUsed = false;
      for (const partition of relevantPartitions) {
        const partitionResults = await this.queryPartition(partition, query);
        results.push(...partitionResults.data);
        indexUsed = indexUsed || partitionResults.indexUsed;
      }
      // Apply additional filtering and sorting
      const filteredResults = this.applyQueryFilters(results, query);
      const sortedResults = this.applySorting(filteredResults, query);
      // Apply pagination
      const offset = query.offset || 0;
      const limit = query.limit || 1000;
      const paginatedResults = sortedResults.slice(offset, offset + limit);
      const queryResult = {
        data: paginatedResults,
        totalCount: sortedResults.length,
        hasMore: offset + limit < sortedResults.length,
        queryTimeMs: performance.now() - startTime,
        partitionsScanned: relevantPartitions.length,
        metadata: {
          cacheHit: false,
          indexUsed,
          compressionRatio: this.calculateCompressionRatio(relevantPartitions),
        },
      };
      // Cache the result if it's reasonably sized
      if (queryResult.data.length <= 100) {
        this.queryCache.set(cacheKey, queryResult);
      }
      return queryResult;
    } finally {
      endTimer();
    }
  }
  /**
   * Get aggregated statistics for analytics dashboard
   */
  async getAggregatedStatistics(query) {
    const baseQuery = await this.queryTokenUsage(query);
    const data = baseQuery.data;
    if (!query.aggregateBy) {
      query.aggregateBy = 'hour';
    }
    const groups = new Map();
    // Group data by the specified aggregation key
    for (const item of data) {
      let groupKey;
      switch (query.aggregateBy) {
        case 'hour':
          groupKey = new Date(item.timestamp).toISOString().slice(0, 13); // YYYY-MM-DDTHH
          break;
        case 'day':
          groupKey = new Date(item.timestamp).toISOString().slice(0, 10); // YYYY-MM-DD
          break;
        case 'session':
          groupKey = item.sessionId;
          break;
        case 'model':
          groupKey = item.model;
          break;
        case 'command':
          groupKey = item.command || 'unknown';
          break;
        default:
          groupKey = 'all';
      }
      const existing = groups.get(groupKey) || [];
      existing.push(item);
      groups.set(groupKey, existing);
    }
    // Calculate aggregated statistics
    const results = [];
    for (const [groupKey, groupData] of groups.entries()) {
      const totalTokens = groupData.reduce((sum, d) => sum + d.totalTokens, 0);
      const totalCost = groupData.reduce(
        (sum, d) => sum + (d.totalCostUsd || 0),
        0,
      );
      const averageLatency =
        groupData.reduce((sum, d) => sum + d.latencyMs, 0) / groupData.length;
      const errorCount = groupData.reduce((sum, d) => sum + d.errorCount, 0);
      const errorRate = errorCount / groupData.length;
      const timestamps = groupData.map((d) => d.timestamp);
      const timeRange = {
        start: Math.min(...timestamps),
        end: Math.max(...timestamps),
      };
      results.push({
        groupKey,
        totalTokens,
        totalCost,
        requestCount: groupData.length,
        averageLatency,
        errorRate,
        timeRange,
      });
    }
    // Sort by total tokens descending
    return results.sort((a, b) => b.totalTokens - a.totalTokens);
  }
  /**
   * Export data for external analytics tools
   */
  async exportData(query, format = 'json') {
    const { data } = await this.queryTokenUsage({
      ...query,
      limit: undefined,
      offset: undefined,
    });
    const { Readable, Transform } = require('node:stream');
    if (format === 'csv') {
      return this.createCsvStream(data);
    } else if (format === 'ndjson') {
      return this.createNdjsonStream(data);
    } else {
      // JSON format
      const jsonData = JSON.stringify(data, null, 2);
      return Readable.from([jsonData]);
    }
  }
  /**
   * Get storage engine statistics
   */
  getStorageStats() {
    let totalRecords = 0;
    let compressedSize = 0;
    let uncompressedSize = 0;
    let oldestTime = Date.now();
    let newestTime = 0;
    for (const partition of this.partitionMetadata.values()) {
      totalRecords += partition.recordCount;
      compressedSize += partition.compressedSize;
      uncompressedSize += partition.uncompressedSize;
      if (partition.startTime < oldestTime) {
        oldestTime = partition.startTime;
      }
      if (partition.endTime > newestTime) {
        newestTime = partition.endTime;
      }
    }
    return {
      totalPartitions: this.partitionMetadata.size,
      totalRecords,
      compressedSizeBytes: compressedSize,
      uncompressedSizeBytes: uncompressedSize,
      compressionRatio:
        uncompressedSize > 0 ? compressedSize / uncompressedSize : 0,
      cacheStats: this.queryCache.getStats(),
      oldestRecord: oldestTime,
      newestRecord: newestTime,
    };
  }
  /**
   * Cleanup old partitions based on retention policy
   */
  async cleanup() {
    const cutoffTime =
      Date.now() - this.config.retentionDays * 24 * 60 * 60 * 1000;
    const partitionsToDelete = [];
    for (const partition of this.partitionMetadata.values()) {
      if (partition.endTime < cutoffTime) {
        partitionsToDelete.push(partition);
      }
    }
    let freedBytes = 0;
    for (const partition of partitionsToDelete) {
      try {
        if (existsSync(partition.path)) {
          const stat = statSync(partition.path);
          freedBytes += stat.size;
          await require('node:fs/promises').unlink(partition.path);
        }
        this.partitionMetadata.delete(partition.partitionId);
        logger.debug('Deleted expired partition', {
          partitionId: partition.partitionId,
          endTime: new Date(partition.endTime).toISOString(),
        });
      } catch (error) {
        logger.error('Failed to delete partition', {
          partitionId: partition.partitionId,
          error: error,
        });
      }
    }
    this.savePartitionMetadata();
    this.queryCache.clear(); // Clear cache after cleanup
    logger.info('Storage cleanup completed', {
      deletedPartitions: partitionsToDelete.length,
      freedBytes,
    });
    return {
      deletedPartitions: partitionsToDelete.length,
      freedBytes,
    };
  }
  async flushWriteBuffer() {
    if (this.writeBuffer.length === 0) return;
    const dataToWrite = [...this.writeBuffer];
    this.writeBuffer.length = 0;
    if (this.writeTimeout) {
      clearTimeout(this.writeTimeout);
      this.writeTimeout = null;
    }
    try {
      // Group data by partition
      const partitionGroups = new Map();
      for (const item of dataToWrite) {
        const partitionId = this.getPartitionId(item.timestamp);
        const existing = partitionGroups.get(partitionId) || [];
        existing.push(item);
        partitionGroups.set(partitionId, existing);
      }
      // Write to each partition
      for (const [partitionId, partitionData] of partitionGroups.entries()) {
        await this.writeToPartition(partitionId, partitionData);
      }
      this.emit('data_stored', { recordCount: dataToWrite.length });
    } catch (error) {
      logger.error('Failed to flush write buffer', { error: error });
      // Put data back in buffer for retry
      this.writeBuffer.unshift(...dataToWrite);
    }
  }
  async writeToPartition(partitionId, data) {
    const partitionPath = join(this.basePath, `${partitionId}.gz`);
    const tempPath = partitionPath + '.tmp';
    try {
      // Load existing data if partition exists
      let existingData = [];
      if (existsSync(partitionPath)) {
        existingData = await this.readPartition(partitionPath);
      }
      // Merge with new data and sort by timestamp
      const allData = [...existingData, ...data].sort(
        (a, b) => a.timestamp - b.timestamp,
      );
      // Compress and write
      const compressed = zlib.gzipSync(JSON.stringify(allData), {
        level: this.config.compressionLevel,
      });
      await require('node:fs/promises').writeFile(tempPath, compressed);
      // Atomic move
      await require('node:fs/promises').rename(tempPath, partitionPath);
      // Update metadata
      const uncompressedSize = Buffer.byteLength(JSON.stringify(allData));
      const checksumSha256 = createHash('sha256')
        .update(compressed)
        .digest('hex');
      const timestamps = allData.map((d) => d.timestamp);
      const metadata = {
        partitionId,
        path: partitionPath,
        startTime: Math.min(...timestamps),
        endTime: Math.max(...timestamps),
        recordCount: allData.length,
        compressedSize: compressed.length,
        uncompressedSize,
        checksumSha256,
        indexes: this.buildIndexes(allData),
        createdAt: Date.now(),
        lastAccessedAt: Date.now(),
      };
      this.partitionMetadata.set(partitionId, metadata);
      this.savePartitionMetadata();
      logger.debug('Partition updated', {
        partitionId,
        recordCount: allData.length,
        compressedSize: compressed.length,
        compressionRatio: compressed.length / uncompressedSize,
      });
    } catch (error) {
      // Cleanup temp file if it exists
      if (existsSync(tempPath)) {
        await require('node:fs/promises').unlink(tempPath);
      }
      throw error;
    }
  }
  async readPartition(partitionPath) {
    const compressed =
      await require('node:fs/promises').readFile(partitionPath);
    const decompressed = zlib.gunzipSync(compressed);
    return JSON.parse(decompressed.toString());
  }
  buildIndexes(data) {
    const indexes = new Map();
    if (!this.config.enableIndexing) {
      return indexes;
    }
    const indexFields = [
      'sessionId',
      'model',
      'authType',
      'command',
      'feature',
      'userId',
    ];
    for (const field of indexFields) {
      const index = new Set();
      for (const item of data) {
        const value = item[field];
        if (value !== undefined && value !== null) {
          index.add(String(value));
        }
      }
      indexes.set(field, index);
    }
    return indexes;
  }
  getPartitionId(timestamp) {
    const date = new Date(timestamp);
    switch (this.config.strategy) {
      case 'hourly':
        return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}-${date.getHours().toString().padStart(2, '0')}`;
      case 'daily':
        return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
      case 'weekly':
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        return `${weekStart.getFullYear()}-W${Math.ceil(weekStart.getDate() / 7)
          .toString()
          .padStart(2, '0')}`;
      default:
        return 'default';
    }
  }
  findRelevantPartitions(query) {
    const relevant = [];
    for (const partition of this.partitionMetadata.values()) {
      // Time range filtering
      if (query.startTime && partition.endTime < query.startTime) continue;
      if (query.endTime && partition.startTime > query.endTime) continue;
      // Index-based filtering for performance
      if (
        this.config.enableIndexing &&
        this.canUseIndexForQuery(partition, query)
      ) {
        relevant.push(partition);
      } else if (!this.config.enableIndexing) {
        relevant.push(partition);
      }
    }
    return relevant.sort((a, b) => b.lastAccessedAt - a.lastAccessedAt); // Most recently accessed first
  }
  canUseIndexForQuery(partition, query) {
    const indexableFields = [
      'sessionId',
      'model',
      'authType',
      'command',
      'feature',
      'userId',
    ];
    for (const field of indexableFields) {
      const queryValue = query[field];
      if (queryValue) {
        const index = partition.indexes.get(field);
        if (index && !index.has(String(queryValue))) {
          return false; // Query value not found in this partition
        }
      }
    }
    return true;
  }
  async queryPartition(partition, query) {
    try {
      const data = await this.readPartition(partition.path);
      // Update access time
      partition.lastAccessedAt = Date.now();
      return {
        data: this.applyQueryFilters(data, query),
        indexUsed: this.config.enableIndexing,
      };
    } catch (error) {
      logger.error('Failed to query partition', {
        partitionId: partition.partitionId,
        error: error,
      });
      return { data: [], indexUsed: false };
    }
  }
  applyQueryFilters(data, query) {
    return data.filter((item) => {
      if (query.sessionId && item.sessionId !== query.sessionId) return false;
      if (query.model && item.model !== query.model) return false;
      if (query.authType && item.authType !== query.authType) return false;
      if (query.command && item.command !== query.command) return false;
      if (query.feature && item.feature !== query.feature) return false;
      if (query.userId && item.userId !== query.userId) return false;
      if (query.startTime && item.timestamp < query.startTime) return false;
      if (query.endTime && item.timestamp > query.endTime) return false;
      if (query.minTokens && item.totalTokens < query.minTokens) return false;
      if (query.maxTokens && item.totalTokens > query.maxTokens) return false;
      if (query.minCost && (item.totalCostUsd || 0) < query.minCost)
        return false;
      if (query.maxCost && (item.totalCostUsd || 0) > query.maxCost)
        return false;
      return true;
    });
  }
  applySorting(data, query) {
    if (!query.sortBy) return data;
    return data.sort((a, b) => {
      const aVal = a[query.sortBy];
      const bVal = b[query.sortBy];
      const order = query.sortOrder === 'desc' ? -1 : 1;
      if (aVal < bVal) return -1 * order;
      if (aVal > bVal) return 1 * order;
      return 0;
    });
  }
  calculateCompressionRatio(partitions) {
    if (partitions.length === 0) return 0;
    const totalCompressed = partitions.reduce(
      (sum, p) => sum + p.compressedSize,
      0,
    );
    const totalUncompressed = partitions.reduce(
      (sum, p) => sum + p.uncompressedSize,
      0,
    );
    return totalUncompressed > 0 ? totalCompressed / totalUncompressed : 0;
  }
  generateCacheKey(query) {
    return createHash('sha256')
      .update(JSON.stringify(query, Object.keys(query).sort()))
      .digest('hex')
      .slice(0, 16);
  }
  createCsvStream(data) {
    const { Readable } = require('node:stream');
    const headers = Object.keys(data[0] || {}).join(',') + '\n';
    const rows = data.map((row) =>
      Object.values(row)
        .map((val) => `"${String(val).replace(/"/g, '""')}"`)
        .join(','),
    );
    return Readable.from([headers, ...rows.map((row) => row + '\n')]);
  }
  createNdjsonStream(data) {
    const { Readable } = require('node:stream');
    const lines = data.map((item) => JSON.stringify(item) + '\n');
    return Readable.from(lines);
  }
  ensureDirectoryExists(path) {
    if (!existsSync(path)) {
      mkdirSync(path, { recursive: true });
    }
  }
  loadPartitionMetadata() {
    const metadataPath = join(this.basePath, 'partitions.json');
    try {
      if (existsSync(metadataPath)) {
        const data = JSON.parse(
          require('node:fs').readFileSync(metadataPath, 'utf8'),
        );
        for (const [id, metadata] of Object.entries(data)) {
          // Convert plain objects back to Maps
          const metadataObj = metadata;
          metadataObj.indexes = new Map(
            Object.entries(metadataObj.indexes || {}).map(([k, v]) => [
              k,
              new Set(v),
            ]),
          );
          this.partitionMetadata.set(id, metadataObj);
        }
        logger.debug('Loaded partition metadata', {
          count: this.partitionMetadata.size,
        });
      }
    } catch (error) {
      logger.warn('Failed to load partition metadata', {
        error: error,
      });
    }
  }
  savePartitionMetadata() {
    const metadataPath = join(this.basePath, 'partitions.json');
    try {
      const data = {};
      for (const [id, metadata] of this.partitionMetadata.entries()) {
        // Convert Maps and Sets to plain objects for JSON serialization
        const metadataObj = { ...metadata };
        metadataObj.indexes = Object.fromEntries(
          Array.from(metadata.indexes.entries()).map(([k, v]) => [
            k,
            Array.from(v),
          ]),
        );
        data[id] = metadataObj;
      }
      require('node:fs').writeFileSync(
        metadataPath,
        JSON.stringify(data, null, 2),
      );
    } catch (error) {
      logger.error('Failed to save partition metadata', {
        error: error,
      });
    }
  }
  setupMaintenanceTasks() {
    // Cleanup task every 24 hours
    setInterval(() => this.cleanup(), 24 * 60 * 60 * 1000);
    // Flush write buffer every minute as fallback
    setInterval(() => this.flushWriteBuffer(), 60 * 1000);
  }
}
/**
 * Global singleton instance for efficient resource usage
 */
let globalStorageEngine = null;
/**
 * Get or create the global AnalyticsStorageEngine instance
 */
export function getGlobalStorageEngine(config) {
  if (!globalStorageEngine) {
    const defaultConfig = {
      strategy: 'daily',
      compressionLevel: 6,
      maxPartitionSizeMB: 100,
      enableIndexing: true,
      retentionDays: 90,
      ...config,
    };
    globalStorageEngine = new AnalyticsStorageEngine(defaultConfig);
  }
  return globalStorageEngine;
}
/**
 * Reset the global storage engine (mainly for testing)
 */
export function resetGlobalStorageEngine() {
  globalStorageEngine = null;
}
//# sourceMappingURL=analytics-storage-engine.js.map
