/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * @fileoverview Historical data querying system exports
 * Provides advanced querying capabilities for historical budget data
 *
 * @author Historical Data Storage and Analysis Agent
 * @version 1.0.0
 */
export type { QueryOperator, QueryFilter, SortSpec, GroupSpec, QueryBuilder, QueryEngine, QueryResult, QueryStats, QueryExecutionPlan, IndexSpec, QueryCacheConfig, QueryExpression, SavedQuery, QueryTemplate, QueryStream, } from './types.js';
export { AdvancedQueryEngine, createAdvancedQueryEngine, } from './AdvancedQueryEngine.js';
