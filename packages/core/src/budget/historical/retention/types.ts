/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Data retention policy types and interfaces
 */

/**
 * Retention period specification
 */
export interface RetentionPeriod {
  unit: 'days' | 'weeks' | 'months' | 'years';
  value: number;
  description?: string;
}

/**
 * Data classification for retention policies
 */
export interface DataClassification {
  level: 'raw' | 'aggregated' | 'archived' | 'compressed';
  importance: 'critical' | 'high' | 'medium' | 'low';
  category: 'operational' | 'analytical' | 'audit' | 'compliance';
}

/**
 * Retention policy rule
 */
export interface RetentionRule {
  id: string;
  name: string;
  description: string;
  classification: DataClassification;
  retentionPeriod: RetentionPeriod;
  actions: RetentionAction[];
  conditions: RetentionCondition[];
  priority: number; // Higher number = higher priority
  enabled: boolean;
  createdAt: number;
  lastModified: number;
  createdBy: string;
}

/**
 * Actions to take when retention criteria are met
 */
export interface RetentionAction {
  type: 'delete' | 'archive' | 'compress' | 'move' | 'transform' | 'notify';
  parameters: Record<string, unknown>;
  executeAfter?: number; // Delay in milliseconds before executing
  condition?: string; // Optional condition to check before execution
}

/**
 * Conditions for applying retention rules
 */
export interface RetentionCondition {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'nin' | 'exists' | 'regex';
  value: unknown;
  logicalOperator?: 'and' | 'or'; // For chaining conditions
}

/**
 * Retention execution plan
 */
export interface RetentionExecutionPlan {
  planId: string;
  createdAt: number;
  executionDate: number;
  rules: RetentionRule[];
  estimatedActions: {
    delete: number;
    archive: number;
    compress: number;
    move: number;
    transform: number;
  };
  estimatedDataSizeMB: number;
  estimatedExecutionTime: number; // milliseconds
  dryRun: boolean;
}

/**
 * Retention execution result
 */
export interface RetentionExecutionResult {
  planId: string;
  executionId: string;
  startTime: number;
  endTime: number;
  status: 'success' | 'partial' | 'failed';
  actionsExecuted: {
    delete: number;
    archive: number;
    compress: number;
    move: number;
    transform: number;
  };
  dataSizeProcessedMB: number;
  errors: RetentionError[];
  warnings: string[];
  summary: string;
}

/**
 * Retention execution error
 */
export interface RetentionError {
  ruleId: string;
  action: RetentionAction;
  errorMessage: string;
  dataAffected: string;
  timestamp: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  retryable: boolean;
}

/**
 * Data lifecycle stage
 */
export interface DataLifecycleStage {
  stage: 'active' | 'inactive' | 'archived' | 'compressed' | 'deleted';
  transitionDate: number;
  accessFrequency: 'frequent' | 'occasional' | 'rare' | 'never';
  storageLocation: string;
  compressionRatio?: number;
  retentionRule?: string; // Rule ID that caused this transition
}

/**
 * Data aging analysis
 */
export interface DataAgingAnalysis {
  dataPoint: {
    timestamp: number;
    size: number;
    accessCount: number;
    lastAccessed: number;
  };
  age: {
    days: number;
    weeks: number;
    months: number;
  };
  lifecycle: DataLifecycleStage;
  recommendation: {
    action: 'keep' | 'archive' | 'compress' | 'delete';
    reason: string;
    confidence: number; // 0-1
    estimatedSaving: number; // bytes
  };
  appliedRules: string[]; // Rule IDs
}

/**
 * Retention policy manager interface
 */
export interface RetentionManager {
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
   * Preview retention actions (dry run)
   */
  preview(): Promise<RetentionExecutionPlan>;

  /**
   * Schedule automatic retention execution
   */
  scheduleExecution(cronExpression: string, ruleIds?: string[]): Promise<string>;

  /**
   * Cancel scheduled execution
   */
  cancelScheduledExecution(scheduleId: string): Promise<void>;
}

/**
 * Retention statistics
 */
export interface RetentionStats {
  totalRules: number;
  activeRules: number;
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  dataProcessed: {
    totalSizeMB: number;
    deletedSizeMB: number;
    archivedSizeMB: number;
    compressedSizeMB: number;
  };
  spaceSaved: {
    totalMB: number;
    percentageSaved: number;
  };
  averageExecutionTime: number;
  lastExecution?: number;
  nextScheduledExecution?: number;
}

/**
 * Retention rule validation result
 */
export interface RetentionValidationResult {
  valid: boolean;
  errors: Array<{
    ruleId: string;
    field: string;
    message: string;
    severity: 'error' | 'warning';
  }>;
  warnings: Array<{
    ruleId: string;
    message: string;
    recommendation?: string;
  }>;
  conflicts: Array<{
    rule1: string;
    rule2: string;
    conflictType: 'overlapping' | 'contradictory' | 'redundant';
    description: string;
  }>;
}

/**
 * Automatic retention scheduler
 */
export interface RetentionScheduler {
  /**
   * Schedule retention execution
   */
  schedule(
    cronExpression: string,
    ruleIds: string[],
    options?: {
      timezone?: string;
      maxRetries?: number;
      retryDelay?: number;
    }
  ): Promise<string>;

  /**
   * Get scheduled executions
   */
  getSchedules(): Promise<Array<{
    id: string;
    cronExpression: string;
    ruleIds: string[];
    nextExecution: number;
    enabled: boolean;
    createdAt: number;
  }>>;

  /**
   * Enable/disable schedule
   */
  toggleSchedule(scheduleId: string, enabled: boolean): Promise<void>;

  /**
   * Delete schedule
   */
  deleteSchedule(scheduleId: string): Promise<void>;

  /**
   * Get schedule execution history
   */
  getScheduleHistory(scheduleId: string, limit?: number): Promise<RetentionExecutionResult[]>;
}

/**
 * Legal hold management for compliance
 */
export interface LegalHoldManager {
  /**
   * Place legal hold on data
   */
  placeLegalHold(
    holdId: string,
    criteria: RetentionCondition[],
    reason: string,
    expirationDate?: number
  ): Promise<void>;

  /**
   * Release legal hold
   */
  releaseLegalHold(holdId: string, reason: string): Promise<void>;

  /**
   * Get active legal holds
   */
  getActiveLegalHolds(): Promise<Array<{
    id: string;
    criteria: RetentionCondition[];
    reason: string;
    placedAt: number;
    placedBy: string;
    expirationDate?: number;
    affectedDataCount: number;
  }>>;

  /**
   * Check if data is under legal hold
   */
  isUnderLegalHold(dataIdentifier: string): Promise<boolean>;

  /**
   * Get legal hold audit trail
   */
  getAuditTrail(): Promise<Array<{
    action: 'placed' | 'released' | 'modified';
    holdId: string;
    timestamp: number;
    user: string;
    reason: string;
    details: Record<string, unknown>;
  }>>;
}

/**
 * Compliance reporting for auditing
 */
export interface ComplianceReporter {
  /**
   * Generate retention compliance report
   */
  generateComplianceReport(
    startDate: number,
    endDate: number,
    format: 'json' | 'csv' | 'pdf'
  ): Promise<{
    reportId: string;
    format: string;
    generatedAt: number;
    filePath?: string;
    data: ComplianceReportData;
  }>;

  /**
   * Generate data lineage report
   */
  generateDataLineageReport(dataIdentifier: string): Promise<{
    created: number;
    accessed: number[];
    modified: number[];
    archived?: number;
    deleted?: number;
    retentionRulesApplied: string[];
    legalHolds: string[];
    complianceNotes: string[];
  }>;

  /**
   * Validate compliance status
   */
  validateCompliance(): Promise<{
    compliant: boolean;
    violations: Array<{
      ruleId: string;
      violationType: string;
      description: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
      remediation: string[];
    }>;
    recommendations: string[];
  }>;
}

/**
 * Compliance report data structure
 */
export interface ComplianceReportData {
  period: {
    start: number;
    end: number;
  };
  summary: {
    totalDataPoints: number;
    retentionRulesExecuted: number;
    dataDeleted: number;
    dataArchived: number;
    complianceViolations: number;
    legalHolds: number;
  };
  details: {
    ruleExecutions: Array<{
      ruleId: string;
      ruleName: string;
      executionCount: number;
      dataAffected: number;
      success: boolean;
      errors?: string[];
    }>;
    violations: Array<{
      type: string;
      description: string;
      affectedData: number;
      remediated: boolean;
    }>;
    auditTrail: Array<{
      timestamp: number;
      action: string;
      user: string;
      dataAffected: string;
      complianceImpact: string;
    }>;
  };
}