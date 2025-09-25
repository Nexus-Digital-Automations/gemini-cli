/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type {
  BudgetUsageTimeSeriesPoint,
  QueryRange,
} from '../storage/types.js';
import type {
  AggregationResult,
  AggregationWindow,
} from '../aggregation/types.js';

/**
 * Query operator types
 */
export type QueryOperator =
  | 'eq' // equals
  | 'ne' // not equals
  | 'gt' // greater than
  | 'gte' // greater than or equal
  | 'lt' // less than
  | 'lte' // less than or equal
  | 'in' // in array
  | 'nin' // not in array
  | 'exists' // field exists
  | 'regex' // regular expression
  | 'between'; // between two values

/**
 * Query filter condition
 */
export interface QueryFilter {
  field: string;
  operator: QueryOperator;
  value: unknown;
  caseSensitive?: boolean; // for string operations
}

/**
 * Sort specification
 */
export interface SortSpec {
  field: string;
  direction: 'asc' | 'desc';
}

/**
 * Query grouping specification
 */
export interface GroupSpec {
  field: string;
  aggregation: 'count' | 'sum' | 'avg' | 'min' | 'max';
}

/**
 * Advanced query builder interface
 */
export interface QueryBuilder {
  /**
   * Set time range for query
   */
  timeRange(start: number, end: number): QueryBuilder;

  /**
   * Add filter condition
   */
  where(field: string, operator: QueryOperator, value: unknown): QueryBuilder;

  /**
   * Add multiple filter conditions with AND logic
   */
  whereAnd(...filters: QueryFilter[]): QueryBuilder;

  /**
   * Add multiple filter conditions with OR logic
   */
  whereOr(...filters: QueryFilter[]): QueryBuilder;

  /**
   * Add sorting
   */
  orderBy(field: string, direction?: 'asc' | 'desc'): QueryBuilder;

  /**
   * Add grouping with aggregation
   */
  groupBy(
    field: string,
    aggregation: 'count' | 'sum' | 'avg' | 'min' | 'max',
  ): QueryBuilder;

  /**
   * Limit number of results
   */
  limit(count: number): QueryBuilder;

  /**
   * Skip number of results (pagination)
   */
  skip(count: number): QueryBuilder;

  /**
   * Select specific fields to return
   */
  select(...fields: string[]): QueryBuilder;

  /**
   * Execute query and return raw data points
   */
  execute(): Promise<BudgetUsageTimeSeriesPoint[]>;

  /**
   * Execute query and return count only
   */
  count(): Promise<number>;

  /**
   * Execute query with aggregation
   */
  aggregate(window: AggregationWindow): Promise<AggregationResult[]>;

  /**
   * Get query execution plan (for debugging)
   */
  explain(): QueryExecutionPlan;
}

/**
 * Query execution plan for optimization
 */
export interface QueryExecutionPlan {
  estimatedCost: number;
  indexesUsed: string[];
  bucketsScan: number;
  filterOrder: string[];
  sortRequired: boolean;
  aggregationRequired: boolean;
}

/**
 * Query optimization statistics
 */
export interface QueryStats {
  executionTime: number; // milliseconds
  rowsScanned: number;
  rowsReturned: number;
  bucketAccess: number;
  cacheHits: number;
  cacheMisses: number;
  indexSeeks: number;
  fullScans: number;
}

/**
 * Query result with metadata
 */
export interface QueryResult<T = BudgetUsageTimeSeriesPoint> {
  data: T[];
  stats: QueryStats;
  plan?: QueryExecutionPlan;
  totalCount?: number; // Total count without limit/skip
  hasMore?: boolean; // Whether there are more results
}

/**
 * Indexed field specification for query optimization
 */
export interface IndexSpec {
  field: string;
  type: 'btree' | 'hash' | 'composite';
  unique: boolean;
  sparse: boolean; // Skip null values
  background: boolean; // Build index in background
}

/**
 * Query cache configuration
 */
export interface QueryCacheConfig {
  enabled: boolean;
  maxSize: number; // Maximum number of cached queries
  ttl: number; // Time to live in milliseconds
  keyFields: string[]; // Fields to include in cache key
  invalidateOnWrite: boolean; // Clear cache when data changes
}

/**
 * Advanced query engine interface
 */
export interface QueryEngine {
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
 * Complex query expression for advanced filtering
 */
export interface QueryExpression {
  type: 'filter' | 'and' | 'or' | 'not';
  filter?: QueryFilter;
  expressions?: QueryExpression[];
}

/**
 * Saved query template for reuse
 */
export interface SavedQuery {
  id: string;
  name: string;
  description: string;
  expression: QueryExpression;
  defaultParams: Record<string, unknown>;
  createdAt: number;
  lastUsed: number;
  useCount: number;
  tags: string[];
}

/**
 * Query template with parameters
 */
export interface QueryTemplate {
  id: string;
  name: string;
  query: string; // Template string with placeholders
  parameters: Array<{
    name: string;
    type: 'string' | 'number' | 'boolean' | 'date';
    required: boolean;
    defaultValue?: unknown;
    description?: string;
  }>;
  description: string;
  category: string;
  examples: Array<{
    description: string;
    parameters: Record<string, unknown>;
    expectedResult: string;
  }>;
}

/**
 * Query result streaming interface for large datasets
 */
export interface QueryStream {
  /**
   * Read next batch of results
   */
  next(): Promise<BudgetUsageTimeSeriesPoint[] | null>;

  /**
   * Check if more results are available
   */
  hasNext(): boolean;

  /**
   * Close the stream and cleanup resources
   */
  close(): Promise<void>;

  /**
   * Get stream statistics
   */
  getStats(): {
    totalRead: number;
    batchesRead: number;
    averageBatchSize: number;
  };
}

/**
 * Spatial/temporal query capabilities
 */
export interface TemporalQuery {
  /**
   * Find data points within a specific time window
   */
  withinTimeWindow(
    center: number,
    windowSize: number,
    unit: 'minutes' | 'hours' | 'days',
  ): QueryBuilder;

  /**
   * Find data points with specific temporal patterns
   */
  withPattern(
    pattern: 'weekday' | 'weekend' | 'business_hours' | 'peak_hours',
    timezone?: string,
  ): QueryBuilder;

  /**
   * Find seasonal data (same time of year across multiple years)
   */
  seasonal(
    referenceDate: number,
    windowDays: number,
    years?: number[],
  ): QueryBuilder;

  /**
   * Find data points relative to events or anomalies
   */
  relativeToEvent(
    eventTimestamp: number,
    beforeMinutes: number,
    afterMinutes: number,
  ): QueryBuilder;
}

/**
 * Query performance monitoring
 */
export interface QueryMonitor {
  /**
   * Track query execution
   */
  trackQuery(query: string, stats: QueryStats): Promise<void>;

  /**
   * Get slow query report
   */
  getSlowQueries(threshold: number): Promise<
    Array<{
      query: string;
      avgExecutionTime: number;
      count: number;
      lastExecuted: number;
    }>
  >;

  /**
   * Get query frequency analysis
   */
  getQueryFrequency(): Promise<Record<string, number>>;

  /**
   * Generate performance report
   */
  generateReport(): Promise<{
    totalQueries: number;
    uniqueQueries: number;
    averageExecutionTime: number;
    slowestQuery: string;
    mostFrequentQuery: string;
    recommendations: string[];
  }>;
}
