/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Historical data analysis system exports
 * Provides comprehensive trend analysis, insights generation, and pattern detection
 *
 * @author Historical Data Storage and Analysis Agent
 * @version 1.0.0
 */

// Export core types and interfaces
export type {
  TrendPeriod,
  TrendDirection,
  ConfidenceLevel,
  AnalysisMetric,
  TrendAnalysis,
  SeasonalPattern,
  AnomalyDetection,
  EfficiencyAnalysis,
  UsagePatterns,
  InsightsReport,
  AnalysisConfig,
  TrendAnalysisEngine,
  CreateTrendAnalysisEngine,
  AnalysisJob,
  AnalysisScheduler,
} from './types.js';

// Export trend analysis engine implementation
export {
  TrendAnalysisEngineImpl,
  createTrendAnalysisEngine,
} from './TrendAnalysisEngine.js';

// Export analysis scheduler implementation
export {
  AnalysisSchedulerImpl,
  createAnalysisScheduler,
} from './AnalysisScheduler.js';