/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { TimeSeriesStorage } from '../storage/types.js';
import type {
  RetentionManager,
  RetentionRule,
  RetentionExecutionPlan,
  RetentionExecutionResult,
  DataAgingAnalysis,
  RetentionStats,
  RetentionValidationResult,
  RetentionScheduler,
  LegalHoldManager,
  ComplianceReporter,
  RetentionCondition,
} from './types.js';
/**
 * Comprehensive data retention manager
 *
 * Features:
 * - Policy-based data lifecycle management
 * - Automated retention execution
 * - Legal hold compliance
 * - Audit trail and reporting
 * - Data aging analysis
 * - Scheduled retention operations
 * - Compliance validation
 */
export declare class DataRetentionManager
  implements
    RetentionManager,
    RetentionScheduler,
    LegalHoldManager,
    ComplianceReporter
{
  private storage;
  private readonly rulesDir;
  private readonly executionHistoryDir;
  private readonly schedulesDir;
  private readonly legalHoldsDir;
  private readonly auditTrailDir;
  private rules;
  private schedules;
  private legalHolds;
  private executionHistory;
  constructor(storage: TimeSeriesStorage, baseDir: string);
  /**
   * Initialize retention manager
   */
  private initializeManager;
  /**
   * Load retention rules from disk
   */
  private loadRules;
  /**
   * Save retention rules to disk
   */
  private saveRules;
  /**
   * Load schedules from disk
   */
  private loadSchedules;
  /**
   * Load legal holds from disk
   */
  private loadLegalHolds;
  /**
   * Load execution history from disk
   */
  private loadExecutionHistory;
  /**
   * Save execution history to disk
   */
  private saveExecutionHistory;
  /**
   * Create default retention rules
   */
  private createDefaultRules;
  /**
   * Add retention rule
   */
  addRule(rule: RetentionRule): Promise<void>;
  /**
   * Update existing rule
   */
  updateRule(ruleId: string, updates: Partial<RetentionRule>): Promise<void>;
  /**
   * Remove retention rule
   */
  removeRule(ruleId: string): Promise<void>;
  /**
   * Get all retention rules
   */
  getRules(): Promise<RetentionRule[]>;
  /**
   * Get rule by ID
   */
  getRule(ruleId: string): Promise<RetentionRule | null>;
  /**
   * Create execution plan
   */
  createExecutionPlan(dryRun?: boolean): Promise<RetentionExecutionPlan>;
  /**
   * Execute retention plan
   */
  executePlan(planId: string): Promise<RetentionExecutionResult>;
  /**
   * Execute individual retention rule
   */
  private executeRule;
  /**
   * Evaluate retention conditions
   */
  private evaluateConditions;
  /**
   * Execute retention action
   */
  private executeAction;
  /**
   * Execute delete action
   */
  private executeDeleteAction;
  /**
   * Execute compress action
   */
  private executeCompressAction;
  /**
   * Execute archive action
   */
  private executeArchiveAction;
  /**
   * Get milliseconds for time unit
   */
  private getMillisecondsForUnit;
  /**
   * Get execution history
   */
  getExecutionHistory(limit?: number): Promise<RetentionExecutionResult[]>;
  /**
   * Analyze data aging
   */
  analyzeDataAging(): Promise<DataAgingAnalysis[]>;
  /**
   * Get retention statistics
   */
  getStats(): Promise<RetentionStats>;
  /**
   * Validate retention rules
   */
  validateRules(): Promise<RetentionValidationResult>;
  /**
   * Check if two rules conflict
   */
  private rulesConflict;
  /**
   * Preview retention actions (dry run)
   */
  preview(): Promise<RetentionExecutionPlan>;
  /**
   * Schedule automatic retention execution
   */
  scheduleExecution(
    cronExpression: string,
    ruleIds?: string[],
  ): Promise<string>;
  /**
   * Cancel scheduled execution
   */
  cancelScheduledExecution(scheduleId: string): Promise<void>;
  /**
   * Calculate next execution time from cron expression
   */
  private calculateNextExecution;
  schedule(cronExpression: string, ruleIds: string[]): Promise<string>;
  getSchedules(): Promise<any[]>;
  toggleSchedule(scheduleId: string, enabled: boolean): Promise<void>;
  deleteSchedule(scheduleId: string): Promise<void>;
  getScheduleHistory(
    scheduleId: string,
    limit?: number,
  ): Promise<RetentionExecutionResult[]>;
  placeLegalHold(
    holdId: string,
    criteria: RetentionCondition[],
    reason: string,
  ): Promise<void>;
  releaseLegalHold(holdId: string, reason: string): Promise<void>;
  getActiveLegalHolds(): Promise<any[]>;
  isUnderLegalHold(dataIdentifier: string): Promise<boolean>;
  getAuditTrail(): Promise<any[]>;
  generateComplianceReport(
    startDate: number,
    endDate: number,
    format: 'json' | 'csv' | 'pdf',
  ): Promise<any>;
  generateDataLineageReport(dataIdentifier: string): Promise<any>;
  validateCompliance(): Promise<any>;
  /**
   * Log audit event
   */
  private logAuditEvent;
}
/**
 * Factory function to create a data retention manager
 */
export declare function createDataRetentionManager(
  storage: TimeSeriesStorage,
  baseDir: string,
): DataRetentionManager;
