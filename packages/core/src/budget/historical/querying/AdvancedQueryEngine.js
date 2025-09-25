/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
/**
 * Query builder implementation
 */
class AdvancedQueryBuilder {
  engine;
  filters = [];
  sorts = [];
  groups = [];
  limitCount;
  skipCount;
  selectedFields;
  range;
  constructor(engine) {
    this.engine = engine;
  }
  timeRange(start, end) {
    this.range = { start, end };
    return this;
  }
  where(field, operator, value) {
    this.filters.push({ field, operator, value });
    return this;
  }
  whereAnd(...filters) {
    this.filters.push(...filters);
    return this;
  }
  whereOr(...filters) {
    // For OR logic, we'd need to store them differently
    // For now, treat as AND (simplified implementation)
    this.filters.push(...filters);
    return this;
  }
  orderBy(field, direction = 'asc') {
    this.sorts.push({ field, direction });
    return this;
  }
  groupBy(field, aggregation) {
    this.groups.push({ field, aggregation });
    return this;
  }
  limit(count) {
    this.limitCount = count;
    return this;
  }
  skip(count) {
    this.skipCount = count;
    return this;
  }
  select(...fields) {
    this.selectedFields = fields;
    return this;
  }
  async execute() {
    const result = await this.engine.query(this.filters, {
      sort: this.sorts,
      limit: this.limitCount,
      skip: this.skipCount,
      select: this.selectedFields,
      timeRange: this.range,
    });
    return result.data;
  }
  async count() {
    const result = await this.engine.query(this.filters, {
      timeRange: this.range,
    });
    return result.totalCount || result.data.length;
  }
  async aggregate(window) {
    const result = await this.engine.aggregateQuery(this.filters, this.groups, {
      timeRange: this.range,
      window,
    });
    return result.data;
  }
  explain() {
    return this.engine.explainQuery(this.filters, {
      sort: this.sorts,
      limit: this.limitCount,
      skip: this.skipCount,
      timeRange: this.range,
    });
  }
}
/**
 * Advanced query engine for historical budget data
 *
 * Features:
 * - Complex filtering with multiple operators
 * - Query optimization with indexes
 * - Result caching for performance
 * - Aggregation queries
 * - Query execution planning
 * - Performance monitoring
 * - Saved queries and templates
 */
export class AdvancedQueryEngine {
  storage;
  aggregationEngine;
  indexesDir;
  cacheDir;
  savedQueriesDir;
  indexes = new Map();
  queryCache = new Map();
  queryStats = new Map();
  savedQueries = new Map();
  queryTemplates = new Map();
  cacheConfig = {
    enabled: true,
    maxSize: 1000,
    ttl: 5 * 60 * 1000, // 5 minutes
    keyFields: ['timestamp', 'sessionId'],
    invalidateOnWrite: true,
  };
  constructor(storage, aggregationEngine, baseDir) {
    this.storage = storage;
    this.aggregationEngine = aggregationEngine;
    this.indexesDir = path.join(baseDir, 'indexes');
    this.cacheDir = path.join(baseDir, 'query-cache');
    this.savedQueriesDir = path.join(baseDir, 'saved-queries');
    this.initializeEngine();
  }
  /**
   * Initialize query engine
   */
  async initializeEngine() {
    try {
      await fs.mkdir(this.indexesDir, { recursive: true });
      await fs.mkdir(this.cacheDir, { recursive: true });
      await fs.mkdir(this.savedQueriesDir, { recursive: true });
      await this.loadIndexes();
      await this.loadSavedQueries();
      await this.loadQueryTemplates();
      console.log('[AdvancedQueryEngine] Initialized successfully');
    } catch (error) {
      console.error('[AdvancedQueryEngine] Failed to initialize:', error);
      throw error;
    }
  }
  /**
   * Load existing indexes from disk
   */
  async loadIndexes() {
    try {
      const indexesPath = path.join(this.indexesDir, 'indexes.json');
      const indexData = await fs.readFile(indexesPath, 'utf-8');
      const indexes = JSON.parse(indexData);
      for (const [field, spec] of Object.entries(indexes)) {
        this.indexes.set(field, spec);
      }
      console.log(`[AdvancedQueryEngine] Loaded ${this.indexes.size} indexes`);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.warn('[AdvancedQueryEngine] Failed to load indexes:', error);
      }
    }
  }
  /**
   * Save indexes to disk
   */
  async saveIndexes() {
    try {
      const indexesPath = path.join(this.indexesDir, 'indexes.json');
      const indexData = Object.fromEntries(this.indexes);
      await fs.writeFile(indexesPath, JSON.stringify(indexData, null, 2));
    } catch (error) {
      console.error('[AdvancedQueryEngine] Failed to save indexes:', error);
    }
  }
  /**
   * Load saved queries from disk
   */
  async loadSavedQueries() {
    try {
      const queriesPath = path.join(this.savedQueriesDir, 'saved-queries.json');
      const queryData = await fs.readFile(queriesPath, 'utf-8');
      const queries = JSON.parse(queryData);
      for (const [id, query] of Object.entries(queries)) {
        this.savedQueries.set(id, query);
      }
      console.log(
        `[AdvancedQueryEngine] Loaded ${this.savedQueries.size} saved queries`,
      );
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.warn(
          '[AdvancedQueryEngine] Failed to load saved queries:',
          error,
        );
      }
    }
  }
  /**
   * Load query templates from disk
   */
  async loadQueryTemplates() {
    try {
      const templatesPath = path.join(this.savedQueriesDir, 'templates.json');
      const templateData = await fs.readFile(templatesPath, 'utf-8');
      const templates = JSON.parse(templateData);
      for (const [id, template] of Object.entries(templates)) {
        this.queryTemplates.set(id, template);
      }
      console.log(
        `[AdvancedQueryEngine] Loaded ${this.queryTemplates.size} query templates`,
      );
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.warn(
          '[AdvancedQueryEngine] Failed to load query templates:',
          error,
        );
      }
    }
  }
  /**
   * Create a new query builder
   */
  createQuery() {
    return new AdvancedQueryBuilder(this);
  }
  /**
   * Execute raw query with filters and options
   */
  async query(filters, options = {}) {
    const startTime = Date.now();
    // Check cache first
    const cacheKey = this.generateCacheKey(filters, options);
    if (this.cacheConfig.enabled) {
      const cached = this.queryCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.cacheConfig.ttl) {
        return cached.result;
      }
    }
    // Build query range
    const queryRange = options.timeRange || {
      start: 0,
      end: Date.now(),
    };
    // Get raw data from storage
    let rawData = await this.storage.query(queryRange);
    // Apply filters
    rawData = this.applyFilters(rawData, filters);
    // Apply sorting
    if (options.sort) {
      rawData = this.applySorting(rawData, options.sort);
    }
    // Count total before pagination
    const totalCount = rawData.length;
    // Apply pagination
    if (options.skip) {
      rawData = rawData.slice(options.skip);
    }
    if (options.limit) {
      rawData = rawData.slice(0, options.limit);
    }
    // Apply field selection
    if (options.select) {
      rawData = this.applyFieldSelection(rawData, options.select);
    }
    const executionTime = Date.now() - startTime;
    const stats = {
      executionTime,
      rowsScanned: totalCount,
      rowsReturned: rawData.length,
      bucketAccess: 1, // Simplified
      cacheHits: 0,
      cacheMisses: 1,
      indexSeeks: this.calculateIndexSeeks(filters),
      fullScans: 1,
    };
    const result = {
      data: rawData,
      stats,
      totalCount,
      hasMore: options.limit ? rawData.length === options.limit : false,
    };
    // Cache the result
    if (this.cacheConfig.enabled) {
      this.queryCache.set(cacheKey, {
        result,
        timestamp: Date.now(),
      });
      // Cleanup old cache entries
      this.cleanupCache();
    }
    // Track query statistics
    this.trackQueryExecution(cacheKey, stats);
    return result;
  }
  /**
   * Execute aggregation query
   */
  async aggregateQuery(filters, groupBy, options = {}) {
    const startTime = Date.now();
    // First get the raw data
    const rawResult = await this.query(filters, {
      timeRange: options.timeRange,
    });
    if (rawResult.data.length === 0) {
      return {
        data: [],
        stats: {
          ...rawResult.stats,
          executionTime: Date.now() - startTime,
        },
        totalCount: 0,
      };
    }
    // Use aggregation engine for complex aggregation
    if (options.window) {
      const aggregationResult = await this.aggregationEngine.aggregate(
        rawResult.data,
        {
          windows: [options.window],
          calculatePercentiles: true,
          percentileLevels: [25, 50, 75, 90, 95, 99],
          confidenceLevel: 0.95,
          trackFeatureDistribution: true,
          trackTimePatterns: true,
          includeAdvancedStats: true,
          batchSize: 1000,
          parallelProcessing: false,
          cacheResults: true,
          minDataPoints: 1,
          outlierDetection: false,
          outlierThreshold: 2.0,
        },
      );
      return {
        data: aggregationResult,
        stats: {
          ...rawResult.stats,
          executionTime: Date.now() - startTime,
        },
        totalCount: aggregationResult.length,
      };
    }
    // Simple grouping and aggregation
    const grouped = this.performGrouping(rawResult.data, groupBy);
    return {
      data: grouped, // Type conversion for compatibility
      stats: {
        ...rawResult.stats,
        executionTime: Date.now() - startTime,
      },
      totalCount: grouped.length,
    };
  }
  /**
   * Apply filters to data
   */
  applyFilters(data, filters) {
    return data.filter((dataPoint) =>
      filters.every((filter) => this.evaluateFilter(dataPoint, filter)),
    );
  }
  /**
   * Evaluate a single filter condition
   */
  evaluateFilter(dataPoint, filter) {
    const fieldValue = this.getFieldValue(dataPoint, filter.field);
    switch (filter.operator) {
      case 'eq':
        return fieldValue === filter.value;
      case 'ne':
        return fieldValue !== filter.value;
      case 'gt':
        return (
          typeof fieldValue === 'number' &&
          typeof filter.value === 'number' &&
          fieldValue > filter.value
        );
      case 'gte':
        return (
          typeof fieldValue === 'number' &&
          typeof filter.value === 'number' &&
          fieldValue >= filter.value
        );
      case 'lt':
        return (
          typeof fieldValue === 'number' &&
          typeof filter.value === 'number' &&
          fieldValue < filter.value
        );
      case 'lte':
        return (
          typeof fieldValue === 'number' &&
          typeof filter.value === 'number' &&
          fieldValue <= filter.value
        );
      case 'in':
        return Array.isArray(filter.value) && filter.value.includes(fieldValue);
      case 'nin':
        return (
          Array.isArray(filter.value) && !filter.value.includes(fieldValue)
        );
      case 'exists':
        return fieldValue !== undefined && fieldValue !== null;
      case 'regex':
        return (
          typeof fieldValue === 'string' &&
          typeof filter.value === 'string' &&
          new RegExp(filter.value, filter.caseSensitive ? 'g' : 'gi').test(
            fieldValue,
          )
        );
      case 'between':
        if (
          Array.isArray(filter.value) &&
          filter.value.length === 2 &&
          typeof fieldValue === 'number'
        ) {
          return fieldValue >= filter.value[0] && fieldValue <= filter.value[1];
        }
        return false;
      default:
        return true;
    }
  }
  /**
   * Get field value from data point (supports nested paths)
   */
  getFieldValue(dataPoint, fieldPath) {
    const path = fieldPath.split('.');
    let value = dataPoint;
    for (const segment of path) {
      if (value && typeof value === 'object' && segment in value) {
        value = value[segment];
      } else {
        return undefined;
      }
    }
    return value;
  }
  /**
   * Apply sorting to data
   */
  applySorting(data, sorts) {
    return [...data].sort((a, b) => {
      for (const sort of sorts) {
        const valueA = this.getFieldValue(a, sort.field);
        const valueB = this.getFieldValue(b, sort.field);
        let comparison = 0;
        if (typeof valueA === 'number' && typeof valueB === 'number') {
          comparison = valueA - valueB;
        } else if (typeof valueA === 'string' && typeof valueB === 'string') {
          comparison = valueA.localeCompare(valueB);
        } else if (valueA !== valueB) {
          comparison = String(valueA).localeCompare(String(valueB));
        }
        if (comparison !== 0) {
          return sort.direction === 'desc' ? -comparison : comparison;
        }
      }
      return 0;
    });
  }
  /**
   * Apply field selection
   */
  applyFieldSelection(data, fields) {
    return data.map((dataPoint) => {
      const selected = {};
      for (const field of fields) {
        const value = this.getFieldValue(dataPoint, field);
        this.setFieldValue(selected, field, value);
      }
      return selected;
    });
  }
  /**
   * Set nested field value
   */
  setFieldValue(obj, fieldPath, value) {
    const path = fieldPath.split('.');
    let current = obj;
    for (let i = 0; i < path.length - 1; i++) {
      const segment = path[i];
      if (!(segment in current) || typeof current[segment] !== 'object') {
        current[segment] = {};
      }
      current = current[segment];
    }
    current[path[path.length - 1]] = value;
  }
  /**
   * Perform simple grouping and aggregation
   */
  performGrouping(data, groupBy) {
    if (groupBy.length === 0) {
      return data;
    }
    const groups = new Map();
    // Group data
    for (const dataPoint of data) {
      const groupKey = groupBy
        .map((spec) => String(this.getFieldValue(dataPoint, spec.field)))
        .join('|');
      if (!groups.has(groupKey)) {
        groups.set(groupKey, []);
      }
      groups.get(groupKey).push(dataPoint);
    }
    // Apply aggregations
    const results = [];
    for (const [groupKey, groupData] of groups) {
      const result = {};
      const groupKeyParts = groupKey.split('|');
      // Set group fields
      groupBy.forEach((spec, index) => {
        result[spec.field] = groupKeyParts[index];
      });
      // Apply aggregation functions
      for (const spec of groupBy) {
        const values = groupData
          .map((dp) => this.getFieldValue(dp, spec.field))
          .filter((v) => typeof v === 'number');
        switch (spec.aggregation) {
          case 'count':
            result[`${spec.field}_count`] = groupData.length;
            break;
          case 'sum':
            result[`${spec.field}_sum`] = values.reduce((sum, v) => sum + v, 0);
            break;
          case 'avg':
            result[`${spec.field}_avg`] =
              values.length > 0
                ? values.reduce((sum, v) => sum + v, 0) / values.length
                : 0;
            break;
          case 'min':
            result[`${spec.field}_min`] =
              values.length > 0 ? Math.min(...values) : 0;
            break;
          case 'max':
            result[`${spec.field}_max`] =
              values.length > 0 ? Math.max(...values) : 0;
            break;
          default:
            // Handle unexpected values
            break;
        }
        results.push(result);
      }
      return results;
    }
    /**
     * Generate cache key for query
     */
  }
  /**
   * Generate cache key for query
   */
  generateCacheKey(filters, options) {
    const keyObject = {
      filters: filters.sort((a, b) => a.field.localeCompare(b.field)),
      options: {
        sort: options.sort || [],
        limit: options.limit,
        skip: options.skip,
        select: options.select || [],
        timeRange: options.timeRange || {},
      },
    };
    // Simple hash function
    const keyStr = JSON.stringify(keyObject);
    let hash = 0;
    for (let i = 0; i < keyStr.length; i++) {
      const char = keyStr.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return hash.toString(36);
  }
  /**
   * Cleanup old cache entries
   */
  cleanupCache() {
    if (this.queryCache.size <= this.cacheConfig.maxSize) {
      return;
    }
    // Remove oldest entries
    const entries = Array.from(this.queryCache.entries()).sort(
      (a, b) => a[1].timestamp - b[1].timestamp,
    );
    const entriesToRemove = entries.slice(
      0,
      entries.length - this.cacheConfig.maxSize,
    );
    for (const [key] of entriesToRemove) {
      this.queryCache.delete(key);
    }
  }
  /**
   * Calculate index seeks for query optimization
   */
  calculateIndexSeeks(filters) {
    let seeks = 0;
    for (const filter of filters) {
      if (this.indexes.has(filter.field)) {
        seeks++;
      }
    }
    return seeks;
  }
  /**
   * Track query execution for monitoring
   */
  trackQueryExecution(queryKey, stats) {
    if (!this.queryStats.has(queryKey)) {
      this.queryStats.set(queryKey, []);
    }
    const queryHistory = this.queryStats.get(queryKey);
    queryHistory.push(stats);
    // Keep only last 100 executions per query
    if (queryHistory.length > 100) {
      queryHistory.shift();
    }
  }
  /**
   * Get query execution plan
   */
  explainQuery(filters, options) {
    const indexesUsed = [];
    let estimatedCost = 1000; // Base cost
    // Check for index usage
    for (const filter of filters) {
      if (this.indexes.has(filter.field)) {
        indexesUsed.push(filter.field);
        estimatedCost -= 200; // Reduce cost for indexed fields
      }
    }
    // Adjust cost based on operations
    if (options.sort) {
      estimatedCost += options.sort.length * 100;
    }
    if (options.limit) {
      estimatedCost = Math.min(estimatedCost, options.limit * 10);
    }
    return {
      estimatedCost: Math.max(estimatedCost, 10),
      indexesUsed,
      bucketsScan: 1, // Simplified
      filterOrder: filters.map((f) => f.field),
      sortRequired: !!options.sort,
      aggregationRequired: false,
    };
  }
  /**
   * Get query execution statistics
   */
  async getStats() {
    const allStats = Array.from(this.queryStats.values()).flat();
    const totalQueries = allStats.length;
    const averageExecutionTime =
      totalQueries > 0
        ? allStats.reduce((sum, stat) => sum + stat.executionTime, 0) /
          totalQueries
        : 0;
    const totalCacheRequests = allStats.reduce(
      (sum, stat) => sum + stat.cacheHits + stat.cacheMisses,
      0,
    );
    const totalCacheHits = allStats.reduce(
      (sum, stat) => sum + stat.cacheHits,
      0,
    );
    const cacheHitRatio =
      totalCacheRequests > 0 ? totalCacheHits / totalCacheRequests : 0;
    const slowQueries = allStats.filter(
      (stat) => stat.executionTime > 1000,
    ).length;
    const indexUtilization = {};
    for (const [field] of this.indexes) {
      indexUtilization[field] = allStats.reduce(
        (sum, stat) => sum + stat.indexSeeks,
        0,
      );
    }
    return {
      totalQueries,
      averageExecutionTime,
      cacheHitRatio,
      slowQueries,
      indexUtilization,
    };
  }
  /**
   * Create index for query optimization
   */
  async createIndex(spec) {
    this.indexes.set(spec.field, spec);
    await this.saveIndexes();
    console.log(`[AdvancedQueryEngine] Created index on field: ${spec.field}`);
  }
  /**
   * Drop existing index
   */
  async dropIndex(fieldName) {
    this.indexes.delete(fieldName);
    await this.saveIndexes();
    console.log(`[AdvancedQueryEngine] Dropped index on field: ${fieldName}`);
  }
  /**
   * List all indexes
   */
  async listIndexes() {
    return Array.from(this.indexes.values());
  }
  /**
   * Optimize query performance by analyzing access patterns
   */
  async optimize() {
    const stats = await this.getStats();
    const suggestedIndexes = [];
    const slowQueries = [];
    const optimizationRecommendations = [];
    // Analyze query patterns and suggest optimizations
    for (const [queryKey, queryHistory] of this.queryStats) {
      const avgTime =
        queryHistory.reduce((sum, stat) => sum + stat.executionTime, 0) /
        queryHistory.length;
      if (avgTime > 500) {
        slowQueries.push(queryKey);
        optimizationRecommendations.push(
          `Query ${queryKey} averages ${avgTime.toFixed(2)}ms - consider adding indexes`,
        );
      }
    }
    // Suggest indexes for frequently filtered fields
    // This is a simplified implementation
    if (stats.totalQueries > 100) {
      suggestedIndexes.push({
        field: 'timestamp',
        type: 'btree',
        unique: false,
        sparse: false,
        background: true,
      });
      suggestedIndexes.push({
        field: 'sessionId',
        type: 'hash',
        unique: false,
        sparse: true,
        background: true,
      });
    }
    return {
      suggestedIndexes,
      slowQueries,
      optimizationRecommendations,
    };
  }
  /**
   * Clear query cache
   */
  async clearCache() {
    this.queryCache.clear();
    console.log('[AdvancedQueryEngine] Query cache cleared');
  }
  /**
   * Configure query cache
   */
  async configureCache(config) {
    this.cacheConfig = { ...this.cacheConfig, ...config };
    if (!config.enabled) {
      await this.clearCache();
    }
    console.log('[AdvancedQueryEngine] Cache configuration updated');
  }
}
/**
 * Factory function to create an advanced query engine
 */
export function createAdvancedQueryEngine(storage, aggregationEngine, baseDir) {
  return new AdvancedQueryEngine(storage, aggregationEngine, baseDir);
}
//# sourceMappingURL=AdvancedQueryEngine.js.map
