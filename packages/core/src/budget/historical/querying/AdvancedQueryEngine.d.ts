/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { QueryRange, TimeSeriesStorage } from '../storage/types.js';
import type {
  AggregationResult,
  AggregationWindow,
  AggregationEngine,
} from '../aggregation/types.js';
import type {
  QueryEngine,
  QueryBuilder,
  QueryFilter,
  SortSpec,
  GroupSpec,
  QueryResult,
  QueryExecutionPlan,
  IndexSpec,
  QueryCacheConfig,
} from './types.js';
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
export declare class AdvancedQueryEngine implements QueryEngine {
  private storage;
  private aggregationEngine;
  private readonly indexesDir;
  private readonly cacheDir;
  private readonly savedQueriesDir;
  private indexes;
  private queryCache;
  private queryStats;
  private savedQueries;
  private queryTemplates;
  private cacheConfig;
  constructor(
    storage: TimeSeriesStorage,
    aggregationEngine: AggregationEngine,
    baseDir: string,
  );
  /**
   * Initialize query engine
   */
  private initializeEngine;
  /**
   * Load existing indexes from disk
   */
  private loadIndexes;
  /**
   * Save indexes to disk
   */
  private saveIndexes;
  /**
   * Load saved queries from disk
   */
  private loadSavedQueries;
  /**
   * Load query templates from disk
   */
  private loadQueryTemplates;
  /**
   * Create a new query builder
   */
  createQuery(): QueryBuilder;
  /**
   * Execute raw query with filters and options
   */
  query(
    filters: QueryFilter[],
    options?: {
      sort?: SortSpec[];
      limit?: number;
      skip?: number;
      select?: string[];
      timeRange?: QueryRange;
    },
  ): Promise<QueryResult>;
  /**
   * Execute aggregation query
   */
  aggregateQuery(
    filters: QueryFilter[],
    groupBy: GroupSpec[],
    options?: {
      timeRange?: QueryRange;
      window?: AggregationWindow;
    },
  ): Promise<QueryResult<AggregationResult>>;
  /**
   * Apply filters to data
   */
  private applyFilters;
  /**
   * Evaluate a single filter condition
   */
  private evaluateFilter;
  /**
   * Get field value from data point (supports nested paths)
   */
  private getFieldValue;
  /**
   * Apply sorting to data
   */
  private applySorting;
  /**
   * Apply field selection
   */
  private applyFieldSelection;
  /**
   * Set nested field value
   */
  private setFieldValue;
  /**
   * Perform simple grouping and aggregation
   */
  private performGrouping;
  /**
   * Generate cache key for query
   */
  private generateCacheKey;
  /**
   * Cleanup old cache entries
   */
  private cleanupCache;
  /**
   * Calculate index seeks for query optimization
   */
  private calculateIndexSeeks;
  /**
   * Track query execution for monitoring
   */
  private trackQueryExecution;
  /**
   * Get query execution plan
   */
  explainQuery(filters: QueryFilter[], options: any): QueryExecutionPlan;
  /**
   * Get query execution statistics
   */
  getStats(): Promise<{
    totalQueries: number;
    averageExecutionTime: number;
    cacheHitRatio: number;
    slowQueries: number;
    indexUtilization: Record<string, number>;
  }>;
  /**
   * Create index for query optimization
   */
  createIndex(spec: IndexSpec): Promise<void>;
  /**
   * Drop existing index
   */
  dropIndex(fieldName: string): Promise<void>;
  /**
   * List all indexes
   */
  listIndexes(): Promise<IndexSpec[]>;
  /**
   * Optimize query performance by analyzing access patterns
   */
  optimize(): Promise<{
    suggestedIndexes: IndexSpec[];
    slowQueries: string[];
    optimizationRecommendations: string[];
  }>;
  /**
   * Clear query cache
   */
  clearCache(): Promise<void>;
  /**
   * Configure query cache
   */
  configureCache(config: QueryCacheConfig): Promise<void>;
}
/**
 * Factory function to create an advanced query engine
 */
export declare function createAdvancedQueryEngine(
  storage: TimeSeriesStorage,
  aggregationEngine: AggregationEngine,
  baseDir: string,
): AdvancedQueryEngine;
