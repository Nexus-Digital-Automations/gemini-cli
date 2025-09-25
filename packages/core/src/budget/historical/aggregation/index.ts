/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Historical data aggregation system exports
 * Provides comprehensive data aggregation and statistical analysis
 *
 * @author Historical Data Storage and Analysis Agent
 * @version 1.0.0
 */

// Export core types and interfaces
export type {
  AggregationWindow,
  AggregationFunction,
  StatisticalSummary,
  AggregationResult,
  AggregationConfig,
  AggregationHierarchy,
  AggregationJob,
  RollupStrategy,
  AggregationCache,
  AggregationEngine,
} from './types.js';

// Export statistical utilities
export { StatisticalUtils } from './StatisticalUtils.js';

// Export aggregation engine
export {
  DataAggregationEngine,
  createDataAggregationEngine,
} from './DataAggregationEngine.js';