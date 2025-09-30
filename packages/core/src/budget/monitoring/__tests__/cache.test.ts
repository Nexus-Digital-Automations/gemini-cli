/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Unit tests for TokenUsageCache component
 * Tests caching functionality, LRU eviction, compression, and performance
 *
 * @author Claude Code - Real-Time Token Usage Monitoring Agent
 * @version 1.0.0
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TokenUsageCache, CachePriority, CachePresets } from '../cache.js';
import type { CacheConfig } from '../cache.js';

describe('TokenUsageCache', () => {
  let cache: TokenUsageCache;
  let config: CacheConfig;

  beforeEach(() => {
    config = {
      maxEntries: 100,
      maxSizeBytes: 1024 * 1024, // 1MB
      defaultTTL: 60000, // 1 minute
      enableLRU: true,
      enableSizeEviction: true,
      enableAutoCleanup: true,
      cleanupInterval: 1000, // 1 second for testing
      hitRatioThreshold: 0.8,
      enableStats: true,
      enableCompression: true,
      compressionThreshold: 1024, // 1KB
      enablePrefetching: true,
      maxPrefetchQueue: 10,
    };

    cache = new TokenUsageCache(config);
  });

  afterEach(() => {
    cache.destroy();
  });

  describe('Basic Cache Operations', () => {
    it('should store and retrieve values', () => {
      const key = 'test-key';
      const value = { data: 'test-value', number: 42 };

      cache.set(key, value);
      const retrieved = cache.get(key);

      expect(retrieved).toEqual(value);
    });

    it('should return undefined for non-existent keys', () => {
      const retrieved = cache.get('non-existent-key');
      expect(retrieved).toBeUndefined();
    });

    it('should delete entries successfully', () => {
      const key = 'test-key';
      const value = 'test-value';

      cache.set(key, value);
      expect(cache.get(key)).toBe(value);

      const deleted = cache.delete(key);
      expect(deleted).toBe(true);
      expect(cache.get(key)).toBeUndefined();
    });

    it('should return false when deleting non-existent keys', () => {
      const deleted = cache.delete('non-existent-key');
      expect(deleted).toBe(false);
    });

    it('should clear all entries', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');

      let stats = cache.getStats();
      expect(stats.entryCount).toBe(3);

      cache.clear();

      stats = cache.getStats();
      expect(stats.entryCount).toBe(0);
    });
  });

  describe('TTL (Time To Live)', () => {
    it('should expire entries after TTL', async () => {
      const key = 'test-key';
      const value = 'test-value';

      cache.set(key, value, { ttl: 100 }); // 100ms TTL

      // Should exist immediately
      expect(cache.get(key)).toBe(value);

      // Wait for expiration
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Should be expired
      expect(cache.get(key)).toBeUndefined();
    });

    it('should use default TTL when not specified', () => {
      const key = 'test-key';
      const value = 'test-value';

      cache.set(key, value);

      // Entry should exist (won't expire in test timeframe)
      expect(cache.get(key)).toBe(value);
    });

    it('should handle zero TTL (no expiration)', () => {
      const key = 'test-key';
      const value = 'test-value';

      cache.set(key, value, { ttl: 0 });

      expect(cache.get(key)).toBe(value);
    });
  });

  describe('LRU Eviction', () => {
    it('should evict least recently used entries when at capacity', () => {
      const smallCache = new TokenUsageCache({
        ...config,
        maxEntries: 3,
        enableLRU: true,
      });

      try {
        // Fill cache to capacity
        smallCache.set('key1', 'value1');
        smallCache.set('key2', 'value2');
        smallCache.set('key3', 'value3');

        // Access key1 to make it recently used
        smallCache.get('key1');

        // Add new entry, should evict key2 (least recently used)
        smallCache.set('key4', 'value4');

        expect(smallCache.get('key1')).toBe('value1'); // Recently accessed
        expect(smallCache.get('key2')).toBeUndefined(); // Should be evicted
        expect(smallCache.get('key3')).toBe('value3'); // Still there
        expect(smallCache.get('key4')).toBe('value4'); // Newly added
      } finally {
        smallCache.destroy();
      }
    });

    it('should update access time on get operations', async () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');

      // Access key1
      cache.get('key1');

      // Wait a bit
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Access key2
      cache.get('key2');

      const stats = cache.getStats();
      // Both entries should still be there
      expect(stats.entryCount).toBe(2);
    });
  });

  describe('Priority-Based Eviction', () => {
    it('should prefer evicting lower priority entries', () => {
      const smallCache = new TokenUsageCache({
        ...config,
        maxEntries: 3,
      });

      try {
        smallCache.set('low-priority', 'value1', {
          priority: CachePriority.LOW,
        });
        smallCache.set('high-priority', 'value2', {
          priority: CachePriority.HIGH,
        });
        smallCache.set('critical-priority', 'value3', {
          priority: CachePriority.CRITICAL,
        });

        // This should evict the low-priority entry
        smallCache.set('normal-priority', 'value4', {
          priority: CachePriority.NORMAL,
        });

        expect(smallCache.get('low-priority')).toBeUndefined(); // Should be evicted
        expect(smallCache.get('high-priority')).toBe('value2');
        expect(smallCache.get('critical-priority')).toBe('value3');
        expect(smallCache.get('normal-priority')).toBe('value4');
      } finally {
        smallCache.destroy();
      }
    });
  });

  describe('Size-Based Eviction', () => {
    it('should evict entries when size limit exceeded', () => {
      const smallCache = new TokenUsageCache({
        ...config,
        maxSizeBytes: 100, // Very small cache
        enableSizeEviction: true,
      });

      try {
        // Add entries that together exceed the size limit
        smallCache.set('key1', 'a'.repeat(30)); // ~30 bytes
        smallCache.set('key2', 'b'.repeat(30)); // ~30 bytes
        smallCache.set('key3', 'c'.repeat(50)); // ~50 bytes, should trigger eviction

        const stats = smallCache.getStats();
        expect(stats.totalSize).toBeLessThanOrEqual(100);
        expect(stats.entryCount).toBeLessThan(3); // Some entries should be evicted
      } finally {
        smallCache.destroy();
      }
    });
  });

  describe('Tag-Based Operations', () => {
    it('should support tag-based clearing', () => {
      cache.set('user-data-1', 'value1', { tags: ['user-data', 'session-1'] });
      cache.set('user-data-2', 'value2', { tags: ['user-data', 'session-2'] });
      cache.set('system-data', 'value3', { tags: ['system'] });

      let stats = cache.getStats();
      expect(stats.entryCount).toBe(3);

      // Clear entries tagged with 'user-data'
      cache.clear(['user-data']);

      stats = cache.getStats();
      expect(stats.entryCount).toBe(1); // Only system-data should remain
      expect(cache.get('system-data')).toBe('value3');
      expect(cache.get('user-data-1')).toBeUndefined();
      expect(cache.get('user-data-2')).toBeUndefined();
    });
  });

  describe('Statistics', () => {
    it('should track cache statistics', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');

      // Generate some hits and misses
      cache.get('key1'); // hit
      cache.get('key2'); // hit
      cache.get('nonexistent'); // miss

      const stats = cache.getStats();

      expect(stats.hits).toBe(2);
      expect(stats.misses).toBe(1);
      expect(stats.hitRatio).toBeCloseTo(2 / 3, 2);
      expect(stats.entryCount).toBe(2);
      expect(stats.totalSize).toBeGreaterThan(0);
    });

    it('should calculate efficiency score', () => {
      // Add some data
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');

      // Generate good hit ratio
      cache.get('key1');
      cache.get('key1');
      cache.get('key2');
      cache.get('key2');

      const stats = cache.getStats();
      expect(stats.efficiencyScore).toBeGreaterThan(0);
      expect(stats.efficiencyScore).toBeLessThanOrEqual(100);
    });
  });

  describe('Compression', () => {
    it('should compress large entries when enabled', () => {
      const largeValue = 'x'.repeat(2000); // Larger than compression threshold

      cache.set('large-key', largeValue);

      const retrieved = cache.get('large-key');
      expect(retrieved).toBe(largeValue);

      const stats = cache.getStats();
      expect(stats.compressions).toBeGreaterThan(0);
    });

    it('should skip compression for small entries', () => {
      const smallValue = 'small value';

      cache.set('small-key', smallValue);

      const retrieved = cache.get('small-key');
      expect(retrieved).toBe(smallValue);

      const stats = cache.getStats();
      expect(stats.compressions).toBe(0);
    });

    it('should skip compression when disabled in options', () => {
      const largeValue = 'x'.repeat(2000);

      cache.set('large-key', largeValue, { skipCompression: true });

      const retrieved = cache.get('large-key');
      expect(retrieved).toBe(largeValue);

      const stats = cache.getStats();
      expect(stats.compressions).toBe(0);
    });
  });

  describe('Auto Cleanup', () => {
    it('should automatically clean up expired entries', async () => {
      const cleanupCache = new TokenUsageCache({
        ...config,
        cleanupInterval: 100, // Cleanup every 100ms
      });

      try {
        cleanupCache.set('expire-key', 'value', { ttl: 50 }); // Expires in 50ms

        let stats = cleanupCache.getStats();
        expect(stats.entryCount).toBe(1);

        // Wait for expiration and cleanup
        await new Promise((resolve) => setTimeout(resolve, 200));

        stats = cleanupCache.getStats();
        expect(stats.entryCount).toBe(0);
      } finally {
        cleanupCache.destroy();
      }
    });
  });

  describe('Memory Usage', () => {
    it('should provide memory usage information', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');

      const memoryUsage = cache.getMemoryUsage();

      expect(memoryUsage.entries).toBe(2);
      expect(memoryUsage.totalBytes).toBeGreaterThan(0);
      expect(memoryUsage.averageEntrySize).toBeGreaterThan(0);
      expect(memoryUsage.memoryEfficiency).toBeGreaterThanOrEqual(0);
      expect(memoryUsage.memoryEfficiency).toBeLessThanOrEqual(1);
    });
  });

  describe('Import/Export', () => {
    it('should export cache data', () => {
      cache.set('key1', 'value1', { tags: ['test'] });
      cache.set('key2', { nested: 'object' });

      const exported = cache.export();

      expect(exported).toBeDefined();
      expect(exported.entries).toHaveLength(2);
      expect(exported.entries.some((e) => e.key === 'key1')).toBe(true);
      expect(exported.entries.some((e) => e.key === 'key2')).toBe(true);
    });

    it('should import cache data', () => {
      const data = {
        entries: [
          {
            key: 'imported-key1',
            entry: {
              value: 'imported-value1',
              createdAt: new Date(),
              lastAccessed: new Date(),
              accessCount: 1,
              size: 100,
              tags: ['imported'],
              priority: CachePriority.NORMAL,
            },
          },
          {
            key: 'imported-key2',
            entry: {
              value: 'imported-value2',
              createdAt: new Date(),
              lastAccessed: new Date(),
              accessCount: 1,
              size: 100,
              tags: ['imported'],
              priority: CachePriority.NORMAL,
            },
          },
        ],
      };

      cache.import(data);

      expect(cache.get('imported-key1')).toBe('imported-value1');
      expect(cache.get('imported-key2')).toBe('imported-value2');

      const stats = cache.getStats();
      expect(stats.entryCount).toBe(2);
    });

    it('should skip expired entries during import', () => {
      const expiredTime = new Date(Date.now() - 1000); // 1 second ago
      const data = {
        entries: [
          {
            key: 'expired-key',
            entry: {
              value: 'expired-value',
              createdAt: expiredTime,
              lastAccessed: expiredTime,
              expiresAt: expiredTime, // Already expired
              accessCount: 1,
              size: 100,
              tags: [],
              priority: CachePriority.NORMAL,
            },
          },
          {
            key: 'valid-key',
            entry: {
              value: 'valid-value',
              createdAt: new Date(),
              lastAccessed: new Date(),
              accessCount: 1,
              size: 100,
              tags: [],
              priority: CachePriority.NORMAL,
            },
          },
        ],
      };

      cache.import(data);

      expect(cache.get('expired-key')).toBeUndefined();
      expect(cache.get('valid-key')).toBe('valid-value');

      const stats = cache.getStats();
      expect(stats.entryCount).toBe(1);
    });
  });

  describe('Cache Presets', () => {
    it('should create cache with high performance preset', () => {
      const perfCache = new TokenUsageCache(CachePresets.HighPerformance);

      expect(perfCache).toBeDefined();

      // Test that it works with the preset configuration
      perfCache.set('test', 'value');
      expect(perfCache.get('test')).toBe('value');

      perfCache.destroy();
    });

    it('should create cache with memory efficient preset', () => {
      const memCache = new TokenUsageCache(CachePresets.MemoryEfficient);

      expect(memCache).toBeDefined();

      memCache.set('test', 'value');
      expect(memCache.get('test')).toBe('value');

      memCache.destroy();
    });

    it('should create cache with long-term preset', () => {
      const longTermCache = new TokenUsageCache(CachePresets.LongTerm);

      expect(longTermCache).toBeDefined();

      longTermCache.set('test', 'value');
      expect(longTermCache.get('test')).toBe('value');

      longTermCache.destroy();
    });
  });

  describe('Performance', () => {
    it('should handle high-frequency operations efficiently', () => {
      const startTime = Date.now();
      const operationCount = 10000;

      // Perform many set operations
      for (let i = 0; i < operationCount; i++) {
        cache.set(`key-${i}`, `value-${i}`);
      }

      // Perform many get operations
      for (let i = 0; i < operationCount; i++) {
        cache.get(`key-${i}`);
      }

      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // Should complete 20,000 operations in reasonable time (less than 2 seconds)
      expect(totalTime).toBeLessThan(2000);

      const stats = cache.getStats();
      expect(stats.hits).toBe(operationCount);
      expect(stats.entryCount).toBeLessThanOrEqual(operationCount); // May have evictions
    });

    it('should maintain performance with large values', () => {
      const largeValue = 'x'.repeat(10000); // 10KB value
      const startTime = Date.now();

      for (let i = 0; i < 100; i++) {
        cache.set(`large-key-${i}`, largeValue);
      }

      const setTime = Date.now() - startTime;
      expect(setTime).toBeLessThan(1000); // Should complete in less than 1 second

      const retrievalStartTime = Date.now();
      for (let i = 0; i < 100; i++) {
        const retrieved = cache.get(`large-key-${i}`);
        expect(retrieved).toBe(largeValue);
      }

      const retrievalTime = Date.now() - retrievalStartTime;
      expect(retrievalTime).toBeLessThan(500); // Should retrieve quickly
    });
  });
});
