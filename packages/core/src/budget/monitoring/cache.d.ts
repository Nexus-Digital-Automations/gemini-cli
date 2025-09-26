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
export declare enum CachePriority {
    /** Low priority - evict first */
    LOW = 1,
    /** Normal priority */
    NORMAL = 2,
    /** High priority - keep longer */
    HIGH = 3,
    /** Critical priority - avoid eviction */
    CRITICAL = 4
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
export declare class TokenUsageCache extends EventEmitter {
    private cache;
    private config;
    private stats;
    private cleanupTimer?;
    private prefetchQueue;
    private accessTimes;
    private compressionCache;
    constructor(config?: Partial<CacheConfig>);
    /**
     * Get cached value with LRU tracking
     */
    get<T = any>(key: string): T | undefined;
    /**
     * Set cached value with compression and eviction management
     */
    set<T = any>(key: string, value: T, options?: {
        ttl?: number;
        priority?: CachePriority;
        tags?: string[];
        skipCompression?: boolean;
    }): void;
    /**
     * Delete cached entry
     */
    delete(key: string): boolean;
    /**
     * Clear cache with optional tag-based selective clearing
     */
    clear(tags?: string[]): void;
    /**
     * Ensure cache capacity by evicting entries if necessary
     */
    private ensureCapacity;
    /**
     * Check if eviction is needed
     */
    private needsEviction;
    /**
     * Select best candidate for eviction using LRU with priority weighting
     */
    private selectEvictionCandidate;
    /**
     * Get comprehensive cache statistics
     */
    getStats(): CacheStats;
    /**
     * Update internal statistics
     */
    private updateStats;
    /**
     * Record cache hit
     */
    private recordHit;
    /**
     * Record cache miss
     */
    private recordMiss;
    /**
     * Record access time for performance analysis
     */
    private recordAccessTime;
    /**
     * Start automatic cleanup process
     */
    private startAutoCleanup;
    /**
     * Perform cache cleanup - remove expired entries
     */
    private performCleanup;
    /**
     * Add prefetch configuration
     */
    addPrefetchConfig(key: string, config: PrefetchConfig): void;
    /**
     * Check for prefetch opportunities
     */
    private checkPrefetchTriggers;
    /**
     * Check if prefetch should be triggered
     */
    private shouldTriggerPrefetch;
    /**
     * Execute prefetch operation
     */
    private executePrefetch;
    /**
     * Estimate entry size in bytes
     */
    private estimateSize;
    /**
     * Compress data (simple implementation)
     */
    private compress;
    /**
     * Decompress data
     */
    private decompress;
    /**
     * Get cache memory usage information
     */
    getMemoryUsage(): {
        entries: number;
        totalBytes: number;
        averageEntrySize: number;
        compressionRatio: number;
        memoryEfficiency: number;
    };
    /**
     * Export cache data for backup/restore
     */
    export(): {
        entries: Array<{
            key: string;
            entry: CacheEntry;
        }>;
    };
    /**
     * Import cache data from backup
     */
    import(data: {
        entries: Array<{
            key: string;
            entry: CacheEntry;
        }>;
    }): void;
    /**
     * Destroy cache and cleanup resources
     */
    destroy(): void;
}
/**
 * Create a token usage cache instance with default configuration
 */
export declare function createTokenUsageCache(config?: Partial<CacheConfig>): TokenUsageCache;
/**
 * Specialized cache configurations for different use cases
 */
export declare const CachePresets: {
    /**
     * High performance cache for frequent access patterns
     */
    readonly HighPerformance: Partial<CacheConfig>;
    /**
     * Memory efficient cache for resource-constrained environments
     */
    readonly MemoryEfficient: Partial<CacheConfig>;
    /**
     * Long-term cache for historical data
     */
    readonly LongTerm: Partial<CacheConfig>;
};
/**
 * Cache key generators for consistent key patterns
 */
export declare const CacheKeys: {
    readonly tokenUsage: (sessionId: string, timeframe: string) => string;
    readonly modelUsage: (model: string, period: string) => string;
    readonly budgetStats: (userId: string, date: string) => string;
    readonly aggregatedMetrics: (type: string, window: string) => string;
    readonly historicalData: (feature: string, range: string) => string;
    readonly costAnalysis: (model: string, timeframe: string) => string;
};
