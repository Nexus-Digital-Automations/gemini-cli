/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Advanced caching system for token usage monitoring optimization
 * Provides multi-level caching with LRU eviction, time-based invalidation, and smart prefetching
 *
 * @author Claude Code - Real-Time Token Usage Monitoring Agent
 * @version 1.0.0
 */

import { EventEmitter } from 'node:events';
import type {
  BudgetUsageData,
  TokenUsageData,
  ModelUsageData,
  BudgetSettings,
  HistoricalDataPoint,
} from '../types.js';

/**
 * Cache entry with metadata for efficient management
 */
export interface CacheEntry<T = any> {
  /** Cached data value */
  value: T;
  /** Entry creation timestamp */
  createdAt: Date;
  /** Last access timestamp for LRU */
  lastAccessed: Date;
  /** Entry expiration timestamp */
  expiresAt?: Date;
  /** Access count for popularity tracking */
  accessCount: number;
  /** Entry size in bytes (estimated) */
  size: number;
  /** Cache tags for selective invalidation */
  tags: string[];
  /** Entry priority level */
  priority: CachePriority;
}

/**
 * Cache priority levels for retention decisions
 */
export enum CachePriority {
  /** Low priority - evict first */
  LOW = 1,
  /** Normal priority */
  NORMAL = 2,
  /** High priority - keep longer */
  HIGH = 3,
  /** Critical priority - avoid eviction */
  CRITICAL = 4,
}

/**
 * Cache configuration settings
 */
export interface CacheConfig {
  /** Maximum number of entries */
  maxEntries: number;
  /** Maximum cache size in bytes */
  maxSizeBytes: number;
  /** Default TTL in milliseconds */
  defaultTTL: number;
  /** Enable LRU eviction */
  enableLRU: boolean;
  /** Enable size-based eviction */
  enableSizeEviction: boolean;
  /** Enable automatic cleanup */
  enableAutoCleanup: boolean;
  /** Cleanup interval in milliseconds */
  cleanupInterval: number;
  /** Cache hit ratio threshold for warnings */
  hitRatioThreshold: number;
  /** Enable cache statistics */
  enableStats: boolean;
  /** Enable compression for large entries */
  enableCompression: boolean;
  /** Compression threshold in bytes */
  compressionThreshold: number;
  /** Enable prefetching */
  enablePrefetching: boolean;
  /** Max prefetch queue size */
  maxPrefetchQueue: number;
}

/**
 * Cache statistics for monitoring performance
 */
export interface CacheStats {
  /** Total cache hits */
  hits: number;
  /** Total cache misses */
  misses: number;
  /** Cache hit ratio (0-1) */
  hitRatio: number;
  /** Total entries in cache */
  entryCount: number;
  /** Total cache size in bytes */
  totalSize: number;
  /** Memory usage percentage */
  memoryUsage: number;
  /** Average access time in milliseconds */
  avgAccessTime: number;
  /** Total evictions performed */
  evictions: number;
  /** Total compressions performed */
  compressions: number;
  /** Cache efficiency score (0-100) */
  efficiencyScore: number;
}

/**
 * Cache invalidation event data
 */
export interface CacheInvalidationEvent {
  /** Invalidation type */
  type: 'expiry' | 'eviction' | 'manual' | 'tag-based';
  /** Cache key(s) affected */
  keys: string[];
  /** Reason for invalidation */
  reason: string;
  /** Timestamp of invalidation */
  timestamp: Date;
  /** Entries recovered (bytes) */
  bytesRecovered: number;
}

/**
 * Prefetch configuration for proactive caching
 */
export interface PrefetchConfig {
  /** Prefetch key pattern */
  keyPattern: string;
  /** Prefetch function */
  fetcher: () => Promise<any>;
  /** Prefetch trigger threshold */
  triggerThreshold: number;
  /** Prefetch TTL override */
  ttl?: number;
  /** Prefetch priority */
  priority: CachePriority;
  /** Enable predictive prefetching */
  predictive: boolean;
}

/**
 * Advanced multi-level cache system with LRU eviction and optimization features
 */
export class TokenUsageCache extends EventEmitter {
  private cache = new Map<string, CacheEntry>();
  private config: CacheConfig;
  private stats: CacheStats;
  private cleanupTimer?: NodeJS.Timeout;
  private prefetchQueue = new Map<string, PrefetchConfig>();
  private accessTimes = new Map<string, number[]>();
  private compressionCache = new Map<string, Buffer>();

  constructor(config: Partial<CacheConfig> = {}) {
    super();

    this.config = {
      maxEntries: 10000,
      maxSizeBytes: 100 * 1024 * 1024, // 100MB
      defaultTTL: 60 * 60 * 1000, // 1 hour
      enableLRU: true,
      enableSizeEviction: true,
      enableAutoCleanup: true,
      cleanupInterval: 5 * 60 * 1000, // 5 minutes
      hitRatioThreshold: 0.8,
      enableStats: true,
      enableCompression: true,
      compressionThreshold: 10 * 1024, // 10KB
      enablePrefetching: true,
      maxPrefetchQueue: 100,
      ...config,
    };

    this.stats = {
      hits: 0,
      misses: 0,
      hitRatio: 0,
      entryCount: 0,
      totalSize: 0,
      memoryUsage: 0,
      avgAccessTime: 0,
      evictions: 0,
      compressions: 0,
      efficiencyScore: 100,
    };

    this.startAutoCleanup();
  }

  /**
   * Get cached value with LRU tracking
   */
  get<T = any>(key: string): T | undefined {
    const startTime = performance.now();

    try {
      const entry = this.cache.get(key);

      if (!entry) {
        this.recordMiss(key, startTime);
        return undefined;
      }

      // Check expiration
      if (entry.expiresAt && entry.expiresAt < new Date()) {
        this.delete(key);
        this.recordMiss(key, startTime);
        return undefined;
      }

      // Update LRU metadata
      entry.lastAccessed = new Date();
      entry.accessCount++;

      // Record access time for performance analysis
      this.recordAccessTime(key, performance.now() - startTime);

      this.recordHit(key, startTime);

      // Decompress if needed
      let value = entry.value;
      if (this.compressionCache.has(key)) {
        value = this.decompress(this.compressionCache.get(key)!);
      }

      return value as T;
    } catch (error) {
      console.error(`Cache get error for key ${key}:`, error);
      this.recordMiss(key, startTime);
      return undefined;
    }
  }

  /**
   * Set cached value with compression and eviction management
   */
  set<T = any>(
    key: string,
    value: T,
    options: {
      ttl?: number;
      priority?: CachePriority;
      tags?: string[];
      skipCompression?: boolean;
    } = {},
  ): void {
    try {
      const now = new Date();
      const ttl = options.ttl ?? this.config.defaultTTL;
      const priority = options.priority ?? CachePriority.NORMAL;
      const tags = options.tags ?? [];

      // Calculate entry size
      const size = this.estimateSize(value);

      // Compress large entries if enabled
      let finalValue = value;
      if (
        this.config.enableCompression &&
        !options.skipCompression &&
        size > this.config.compressionThreshold
      ) {
        const compressed = this.compress(value);
        this.compressionCache.set(key, compressed);
        this.stats.compressions++;
        finalValue = null as any; // Store null, actual data in compression cache
      }

      const entry: CacheEntry<T> = {
        value: finalValue,
        createdAt: now,
        lastAccessed: now,
        expiresAt: ttl > 0 ? new Date(now.getTime() + ttl) : undefined,
        accessCount: 0,
        size,
        tags,
        priority,
      };

      // Check if eviction needed
      this.ensureCapacity(size);

      // Store entry
      this.cache.set(key, entry);
      this.updateStats();

      // Emit cache event
      this.emit('cache-set', { key, size, priority, tags });

      // Check for prefetch opportunities
      if (this.config.enablePrefetching) {
        this.checkPrefetchTriggers(key);
      }
    } catch (error) {
      console.error(`Cache set error for key ${key}:`, error);
      this.emit('cache-error', { operation: 'set', key, error });
    }
  }

  /**
   * Delete cached entry
   */
  delete(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    this.cache.delete(key);
    this.compressionCache.delete(key);
    this.accessTimes.delete(key);
    this.updateStats();

    this.emit('cache-delete', { key, size: entry.size });
    return true;
  }

  /**
   * Clear cache with optional tag-based selective clearing
   */
  clear(tags?: string[]): void {
    if (!tags || tags.length === 0) {
      // Clear all
      const totalSize = this.stats.totalSize;
      this.cache.clear();
      this.compressionCache.clear();
      this.accessTimes.clear();
      this.updateStats();

      this.emit('cache-clear', {
        type: 'full',
        entriesCleared: this.stats.entryCount,
        bytesRecovered: totalSize,
      });
    } else {
      // Clear by tags
      const keysToDelete: string[] = [];
      let bytesRecovered = 0;

      for (const [key, entry] of this.cache.entries()) {
        if (entry.tags.some((tag) => tags.includes(tag))) {
          keysToDelete.push(key);
          bytesRecovered += entry.size;
        }
      }

      keysToDelete.forEach((key) => this.delete(key));

      this.emit('cache-clear', {
        type: 'tag-based',
        tags,
        entriesCleared: keysToDelete.length,
        bytesRecovered,
      });
    }
  }

  /**
   * Ensure cache capacity by evicting entries if necessary
   */
  private ensureCapacity(newEntrySize: number): void {
    while (this.needsEviction(newEntrySize) && this.cache.size > 0) {
      const keyToEvict = this.selectEvictionCandidate();
      if (keyToEvict) {
        const entry = this.cache.get(keyToEvict);
        this.delete(keyToEvict);
        this.stats.evictions++;

        this.emit('cache-eviction', {
          type: 'capacity',
          keys: [keyToEvict],
          reason: 'Capacity limit reached',
          timestamp: new Date(),
          bytesRecovered: entry?.size ?? 0,
        });
      } else {
        break; // No more candidates
      }
    }
  }

  /**
   * Check if eviction is needed
   */
  private needsEviction(newEntrySize: number): boolean {
    if (this.config.enableSizeEviction) {
      return this.stats.totalSize + newEntrySize > this.config.maxSizeBytes;
    }
    return this.cache.size >= this.config.maxEntries;
  }

  /**
   * Select best candidate for eviction using LRU with priority weighting
   */
  private selectEvictionCandidate(): string | null {
    if (this.cache.size === 0) return null;

    let candidate: string | null = null;
    let lowestScore = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      // Skip critical priority entries unless absolutely necessary
      if (entry.priority === CachePriority.CRITICAL && this.cache.size > 1) {
        continue;
      }

      // Calculate eviction score (lower = more likely to evict)
      const ageMs = Date.now() - entry.lastAccessed.getTime();
      const priorityWeight = entry.priority / CachePriority.CRITICAL;
      const accessWeight = 1 / Math.max(1, entry.accessCount);
      const sizeWeight = entry.size / this.config.maxSizeBytes;

      const score = (ageMs * accessWeight * sizeWeight) / priorityWeight;

      if (score < lowestScore) {
        lowestScore = score;
        candidate = key;
      }
    }

    return candidate;
  }

  /**
   * Get comprehensive cache statistics
   */
  getStats(): CacheStats {
    this.updateStats();
    return { ...this.stats };
  }

  /**
   * Update internal statistics
   */
  private updateStats(): void {
    this.stats.entryCount = this.cache.size;
    this.stats.totalSize = Array.from(this.cache.values()).reduce(
      (sum, entry) => sum + entry.size,
      0,
    );

    this.stats.memoryUsage = this.stats.totalSize / this.config.maxSizeBytes;

    const totalRequests = this.stats.hits + this.stats.misses;
    this.stats.hitRatio =
      totalRequests > 0 ? this.stats.hits / totalRequests : 0;

    // Calculate efficiency score
    this.stats.efficiencyScore = Math.min(
      100,
      Math.round(
        (this.stats.hitRatio * 0.6 + // 60% weight on hit ratio
          (1 - this.stats.memoryUsage) * 0.2 + // 20% weight on memory efficiency
          (this.stats.avgAccessTime < 1 ? 0.2 : 0)) *
          100, // 20% weight on speed
      ),
    );
  }

  /**
   * Record cache hit
   */
  private recordHit(key: string, startTime: number): void {
    this.stats.hits++;
    this.recordAccessTime(key, performance.now() - startTime);

    if (this.config.enableStats) {
      this.emit('cache-hit', {
        key,
        accessTime: performance.now() - startTime,
      });
    }
  }

  /**
   * Record cache miss
   */
  private recordMiss(key: string, startTime: number): void {
    this.stats.misses++;
    this.recordAccessTime(key, performance.now() - startTime);

    if (this.config.enableStats) {
      this.emit('cache-miss', {
        key,
        accessTime: performance.now() - startTime,
      });
    }
  }

  /**
   * Record access time for performance analysis
   */
  private recordAccessTime(key: string, accessTime: number): void {
    if (!this.accessTimes.has(key)) {
      this.accessTimes.set(key, []);
    }

    const times = this.accessTimes.get(key)!;
    times.push(accessTime);

    // Keep only last 100 access times
    if (times.length > 100) {
      times.shift();
    }

    // Update average access time
    const allTimes = Array.from(this.accessTimes.values()).flat();
    this.stats.avgAccessTime =
      allTimes.length > 0
        ? allTimes.reduce((sum, time) => sum + time, 0) / allTimes.length
        : 0;
  }

  /**
   * Start automatic cleanup process
   */
  private startAutoCleanup(): void {
    if (!this.config.enableAutoCleanup) return;

    this.cleanupTimer = setInterval(() => {
      this.performCleanup();
    }, this.config.cleanupInterval);
  }

  /**
   * Perform cache cleanup - remove expired entries
   */
  private performCleanup(): void {
    const now = new Date();
    const expiredKeys: string[] = [];
    let bytesRecovered = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt && entry.expiresAt < now) {
        expiredKeys.push(key);
        bytesRecovered += entry.size;
      }
    }

    expiredKeys.forEach((key) => this.delete(key));

    if (expiredKeys.length > 0) {
      this.emit('cache-cleanup', {
        type: 'expiry',
        keys: expiredKeys,
        reason: 'Expired entries cleanup',
        timestamp: now,
        bytesRecovered,
      } as CacheInvalidationEvent);
    }

    // Check hit ratio and warn if below threshold
    if (this.stats.hitRatio < this.config.hitRatioThreshold) {
      this.emit('cache-warning', {
        type: 'low-hit-ratio',
        hitRatio: this.stats.hitRatio,
        threshold: this.config.hitRatioThreshold,
        recommendation:
          'Consider increasing cache size or adjusting TTL values',
      });
    }
  }

  /**
   * Add prefetch configuration
   */
  addPrefetchConfig(key: string, config: PrefetchConfig): void {
    if (this.prefetchQueue.size >= this.config.maxPrefetchQueue) {
      console.warn('Prefetch queue full, skipping new prefetch config');
      return;
    }

    this.prefetchQueue.set(key, config);
  }

  /**
   * Check for prefetch opportunities
   */
  private checkPrefetchTriggers(accessedKey: string): void {
    for (const [prefetchKey, config] of this.prefetchQueue.entries()) {
      if (this.shouldTriggerPrefetch(accessedKey, config)) {
        this.executePrefetch(prefetchKey, config);
      }
    }
  }

  /**
   * Check if prefetch should be triggered
   */
  private shouldTriggerPrefetch(
    accessedKey: string,
    config: PrefetchConfig,
  ): boolean {
    // Simple pattern matching for now
    const regex = new RegExp(config.keyPattern);
    return regex.test(accessedKey);
  }

  /**
   * Execute prefetch operation
   */
  private async executePrefetch(
    prefetchKey: string,
    config: PrefetchConfig,
  ): Promise<void> {
    try {
      const data = await config.fetcher();
      this.set(prefetchKey, data, {
        ttl: config.ttl,
        priority: config.priority,
        tags: ['prefetched'],
      });

      this.emit('cache-prefetch', { key: prefetchKey, success: true });
    } catch (error) {
      console.error(`Prefetch failed for key ${prefetchKey}:`, error);
      this.emit('cache-prefetch', { key: prefetchKey, success: false, error });
    }
  }

  /**
   * Estimate entry size in bytes
   */
  private estimateSize(value: unknown): number {
    try {
      return Buffer.byteLength(JSON.stringify(value), 'utf8');
    } catch {
      // Fallback estimation
      return 1024; // 1KB default
    }
  }

  /**
   * Compress data (simple implementation)
   */
  private compress(data: unknown): Buffer {
    // In a real implementation, you'd use a proper compression library
    const jsonString = JSON.stringify(data);
    return Buffer.from(jsonString, 'utf8');
  }

  /**
   * Decompress data
   */
  private decompress(buffer: Buffer): unknown {
    // In a real implementation, you'd use a proper decompression library
    const jsonString = buffer.toString('utf8');
    return JSON.parse(jsonString);
  }

  /**
   * Get cache memory usage information
   */
  getMemoryUsage(): {
    entries: number;
    totalBytes: number;
    averageEntrySize: number;
    compressionRatio: number;
    memoryEfficiency: number;
  } {
    const totalBytes = this.stats.totalSize;
    const entries = this.stats.entryCount;
    const averageEntrySize = entries > 0 ? totalBytes / entries : 0;

    // Calculate compression ratio
    const compressedEntries = this.compressionCache.size;
    const compressionRatio = entries > 0 ? compressedEntries / entries : 0;

    // Memory efficiency (how much of max capacity is used effectively)
    const memoryEfficiency =
      this.config.maxSizeBytes > 0
        ? Math.min(1, totalBytes / this.config.maxSizeBytes) *
          this.stats.hitRatio
        : 0;

    return {
      entries,
      totalBytes,
      averageEntrySize,
      compressionRatio,
      memoryEfficiency,
    };
  }

  /**
   * Export cache data for backup/restore
   */
  export(): { entries: Array<{ key: string; entry: CacheEntry }> } {
    const entries: Array<{ key: string; entry: CacheEntry }> = [];

    for (const [key, entry] of this.cache.entries()) {
      entries.push({ key, entry: { ...entry } });
    }

    return { entries };
  }

  /**
   * Import cache data from backup
   */
  import(data: { entries: Array<{ key: string; entry: CacheEntry }> }): void {
    this.clear();

    for (const { key, entry } of data.entries) {
      // Only import non-expired entries
      if (!entry.expiresAt || entry.expiresAt > new Date()) {
        this.cache.set(key, entry);
      }
    }

    this.updateStats();
    this.emit('cache-import', { entriesImported: data.entries.length });
  }

  /**
   * Destroy cache and cleanup resources
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }

    this.clear();
    this.prefetchQueue.clear();
    this.accessTimes.clear();
    this.compressionCache.clear();
    this.removeAllListeners();
  }
}

/**
 * Create a token usage cache instance with default configuration
 */
export function createTokenUsageCache(
  config?: Partial<CacheConfig>,
): TokenUsageCache {
  return new TokenUsageCache(config);
}

/**
 * Specialized cache configurations for different use cases
 */
export const CachePresets = {
  /**
   * High performance cache for frequent access patterns
   */
  HighPerformance: {
    maxEntries: 5000,
    maxSizeBytes: 50 * 1024 * 1024, // 50MB
    defaultTTL: 30 * 60 * 1000, // 30 minutes
    enableLRU: true,
    enableSizeEviction: true,
    enableCompression: true,
    compressionThreshold: 5 * 1024, // 5KB
    enablePrefetching: true,
    cleanupInterval: 2 * 60 * 1000, // 2 minutes
  } as Partial<CacheConfig>,

  /**
   * Memory efficient cache for resource-constrained environments
   */
  MemoryEfficient: {
    maxEntries: 1000,
    maxSizeBytes: 10 * 1024 * 1024, // 10MB
    defaultTTL: 15 * 60 * 1000, // 15 minutes
    enableCompression: true,
    compressionThreshold: 1024, // 1KB
    enablePrefetching: false,
    cleanupInterval: 5 * 60 * 1000, // 5 minutes
  } as Partial<CacheConfig>,

  /**
   * Long-term cache for historical data
   */
  LongTerm: {
    maxEntries: 50000,
    maxSizeBytes: 200 * 1024 * 1024, // 200MB
    defaultTTL: 24 * 60 * 60 * 1000, // 24 hours
    enableLRU: false,
    enableSizeEviction: true,
    enableCompression: true,
    compressionThreshold: 2 * 1024, // 2KB
    cleanupInterval: 60 * 60 * 1000, // 1 hour
  } as Partial<CacheConfig>,
} as const;

/**
 * Cache key generators for consistent key patterns
 */
export const CacheKeys = {
  tokenUsage: (sessionId: string, timeframe: string) =>
    `token-usage:${sessionId}:${timeframe}`,
  modelUsage: (model: string, period: string) =>
    `model-usage:${model}:${period}`,
  budgetStats: (userId: string, date: string) =>
    `budget-stats:${userId}:${date}`,
  aggregatedMetrics: (type: string, window: string) =>
    `metrics:${type}:${window}`,
  historicalData: (feature: string, range: string) =>
    `history:${feature}:${range}`,
  costAnalysis: (model: string, timeframe: string) =>
    `cost-analysis:${model}:${timeframe}`,
} as const;
