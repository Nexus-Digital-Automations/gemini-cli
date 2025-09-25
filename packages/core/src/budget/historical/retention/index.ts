/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Historical data retention system exports
 * Provides comprehensive data lifecycle management and compliance
 *
 * @author Historical Data Storage and Analysis Agent
 * @version 1.0.0
 */

// Export core types and interfaces
export type {
  RetentionPeriod,
  DataClassification,
  RetentionRule,
  RetentionAction,
  RetentionCondition,
  RetentionExecutionPlan,
  RetentionExecutionResult,
  RetentionError,
  DataLifecycleStage,
  DataAgingAnalysis,
  RetentionManager,
  RetentionStats,
  RetentionValidationResult,
  RetentionScheduler,
  LegalHoldManager,
  ComplianceReporter,
  ComplianceReportData,
} from './types.js';

// Export retention manager implementation
export {
  DataRetentionManager,
  createDataRetentionManager,
} from './DataRetentionManager.js';