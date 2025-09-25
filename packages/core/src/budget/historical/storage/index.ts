/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Historical data storage system exports
 * Provides comprehensive time-series storage for budget usage data
 *
 * @author Historical Data Storage and Analysis Agent
 * @version 1.0.0
 */

// Export core types and interfaces
export type {
  BudgetUsageTimeSeriesPoint,
  AggregatedUsageData,
  StorageBucket,
  StorageConfig,
  StorageStats,
  QueryRange,
  StorageOperationResult,
  TimeSeriesStorage,
} from './types.js';

// Export storage implementations
export {
  FileBasedTimeSeriesStorage,
  createFileBasedTimeSeriesStorage,
} from './FileBasedTimeSeriesStorage.js';
