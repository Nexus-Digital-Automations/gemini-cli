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
 * Cache priority levels for retention decisions
 */
export let CachePriority;
(function (CachePriority) {
    /** Low priority - evict first */
    CachePriority[CachePriority["LOW"] = 1] = "LOW";
    /** Normal priority */
    CachePriority[CachePriority["NORMAL"] = 2] = "NORMAL";
    /** High priority - keep longer */
    CachePriority[CachePriority["HIGH"] = 3] = "HIGH";
    /** Critical priority - avoid eviction */
    CachePriority[CachePriority["CRITICAL"] = 4] = "CRITICAL";
})(CachePriority || (CachePriority = {}));
/**
 * Advanced multi-level cache system with LRU eviction and optimization features
 */
export class TokenUsageCache extends EventEmitter {
    cache = new Map();
    config;
    stats;
    cleanupTimer;
    prefetchQueue = new Map();
    accessTimes = new Map();
    compressionCache = new Map();
    constructor(config = {}) {
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
    get(key) {
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
                value = this.decompress(this.compressionCache.get(key));
            }
            return value;
        }
        catch (error) {
            console.error(`Cache get error for key ${key}:`, error);
            this.recordMiss(key, startTime);
            return undefined;
        }
    }
    /**
     * Set cached value with compression and eviction management
     */
    set(key, value, options = {}) {
        try {
            const now = new Date();
            const ttl = options.ttl ?? this.config.defaultTTL;
            const priority = options.priority ?? CachePriority.NORMAL;
            const tags = options.tags ?? [];
            // Calculate entry size
            const size = this.estimateSize(value);
            // Compress large entries if enabled
            let finalValue = value;
            if (this.config.enableCompression &&
                !options.skipCompression &&
                size > this.config.compressionThreshold) {
                const compressed = this.compress(value);
                this.compressionCache.set(key, compressed);
                this.stats.compressions++;
                finalValue = null; // Store null, actual data in compression cache
            }
            const entry = {
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
        }
        catch (error) {
            console.error(`Cache set error for key ${key}:`, error);
            this.emit('cache-error', { operation: 'set', key, error });
        }
    }
    /**
     * Delete cached entry
     */
    delete(key) {
        const entry = this.cache.get(key);
        if (!entry)
            return false;
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
    clear(tags) {
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
        }
        else {
            // Clear by tags
            const keysToDelete = [];
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
    ensureCapacity(newEntrySize) {
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
            }
            else {
                break; // No more candidates
            }
        }
    }
    /**
     * Check if eviction is needed
     */
    needsEviction(newEntrySize) {
        if (this.config.enableSizeEviction) {
            return this.stats.totalSize + newEntrySize > this.config.maxSizeBytes;
        }
        return this.cache.size >= this.config.maxEntries;
    }
    /**
     * Select best candidate for eviction using LRU with priority weighting
     */
    selectEvictionCandidate() {
        if (this.cache.size === 0)
            return null;
        let candidate = null;
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
    getStats() {
        this.updateStats();
        return { ...this.stats };
    }
    /**
     * Update internal statistics
     */
    updateStats() {
        this.stats.entryCount = this.cache.size;
        this.stats.totalSize = Array.from(this.cache.values()).reduce((sum, entry) => sum + entry.size, 0);
        this.stats.memoryUsage = this.stats.totalSize / this.config.maxSizeBytes;
        const totalRequests = this.stats.hits + this.stats.misses;
        this.stats.hitRatio =
            totalRequests > 0 ? this.stats.hits / totalRequests : 0;
        // Calculate efficiency score
        this.stats.efficiencyScore = Math.min(100, Math.round((this.stats.hitRatio * 0.6 + // 60% weight on hit ratio
            (1 - this.stats.memoryUsage) * 0.2 + // 20% weight on memory efficiency
            (this.stats.avgAccessTime < 1 ? 0.2 : 0)) *
            100));
    }
    /**
     * Record cache hit
     */
    recordHit(key, startTime) {
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
    recordMiss(key, startTime) {
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
    recordAccessTime(key, accessTime) {
        if (!this.accessTimes.has(key)) {
            this.accessTimes.set(key, []);
        }
        const times = this.accessTimes.get(key);
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
    startAutoCleanup() {
        if (!this.config.enableAutoCleanup)
            return;
        this.cleanupTimer = setInterval(() => {
            this.performCleanup();
        }, this.config.cleanupInterval);
    }
    /**
     * Perform cache cleanup - remove expired entries
     */
    performCleanup() {
        const now = new Date();
        const expiredKeys = [];
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
            });
        }
        // Check hit ratio and warn if below threshold
        if (this.stats.hitRatio < this.config.hitRatioThreshold) {
            this.emit('cache-warning', {
                type: 'low-hit-ratio',
                hitRatio: this.stats.hitRatio,
                threshold: this.config.hitRatioThreshold,
                recommendation: 'Consider increasing cache size or adjusting TTL values',
            });
        }
    }
    /**
     * Add prefetch configuration
     */
    addPrefetchConfig(key, config) {
        if (this.prefetchQueue.size >= this.config.maxPrefetchQueue) {
            console.warn('Prefetch queue full, skipping new prefetch config');
            return;
        }
        this.prefetchQueue.set(key, config);
    }
    /**
     * Check for prefetch opportunities
     */
    checkPrefetchTriggers(accessedKey) {
        for (const [prefetchKey, config] of this.prefetchQueue.entries()) {
            if (this.shouldTriggerPrefetch(accessedKey, config)) {
                this.executePrefetch(prefetchKey, config);
            }
        }
    }
    /**
     * Check if prefetch should be triggered
     */
    shouldTriggerPrefetch(accessedKey, config) {
        // Simple pattern matching for now
        const regex = new RegExp(config.keyPattern);
        return regex.test(accessedKey);
    }
    /**
     * Execute prefetch operation
     */
    async executePrefetch(prefetchKey, config) {
        try {
            const data = await config.fetcher();
            this.set(prefetchKey, data, {
                ttl: config.ttl,
                priority: config.priority,
                tags: ['prefetched'],
            });
            this.emit('cache-prefetch', { key: prefetchKey, success: true });
        }
        catch (error) {
            console.error(`Prefetch failed for key ${prefetchKey}:`, error);
            this.emit('cache-prefetch', { key: prefetchKey, success: false, error });
        }
    }
    /**
     * Estimate entry size in bytes
     */
    estimateSize(value) {
        try {
            return Buffer.byteLength(JSON.stringify(value), 'utf8');
        }
        catch {
            // Fallback estimation
            return 1024; // 1KB default
        }
    }
    /**
     * Compress data (simple implementation)
     */
    compress(data) {
        // In a real implementation, you'd use a proper compression library
        const jsonString = JSON.stringify(data);
        return Buffer.from(jsonString, 'utf8');
    }
    /**
     * Decompress data
     */
    decompress(buffer) {
        // In a real implementation, you'd use a proper decompression library
        const jsonString = buffer.toString('utf8');
        return JSON.parse(jsonString);
    }
    /**
     * Get cache memory usage information
     */
    getMemoryUsage() {
        const totalBytes = this.stats.totalSize;
        const entries = this.stats.entryCount;
        const averageEntrySize = entries > 0 ? totalBytes / entries : 0;
        // Calculate compression ratio
        const compressedEntries = this.compressionCache.size;
        const compressionRatio = entries > 0 ? compressedEntries / entries : 0;
        // Memory efficiency (how much of max capacity is used effectively)
        const memoryEfficiency = this.config.maxSizeBytes > 0
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
    export() {
        const entries = [];
        for (const [key, entry] of this.cache.entries()) {
            entries.push({ key, entry: { ...entry } });
        }
        return { entries };
    }
    /**
     * Import cache data from backup
     */
    import(data) {
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
    destroy() {
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
export function createTokenUsageCache(config) {
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
    },
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
    },
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
    },
};
/**
 * Cache key generators for consistent key patterns
 */
export const CacheKeys = {
    tokenUsage: (sessionId, timeframe) => `token-usage:${sessionId}:${timeframe}`,
    modelUsage: (model, period) => `model-usage:${model}:${period}`,
    budgetStats: (userId, date) => `budget-stats:${userId}:${date}`,
    aggregatedMetrics: (type, window) => `metrics:${type}:${window}`,
    historicalData: (feature, range) => `history:${feature}:${range}`,
    costAnalysis: (model, timeframe) => `cost-analysis:${model}:${timeframe}`,
};
//# sourceMappingURL=cache.js.map