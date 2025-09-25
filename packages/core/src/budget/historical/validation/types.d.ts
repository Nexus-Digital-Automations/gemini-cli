/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Historical data validation type definitions
 * Provides comprehensive data integrity and quality assurance
 *
 * @author Historical Data Storage and Analysis Agent
 * @version 1.0.0
 */
import type { BudgetUsageTimeSeriesPoint } from '../storage/types.js';
/**
 * Validation severity levels
 */
export type ValidationSeverity = 'info' | 'warning' | 'error' | 'critical';
/**
 * Validation rule types
 */
export type ValidationRuleType =
  | 'required'
  | 'type'
  | 'range'
  | 'format'
  | 'enum'
  | 'unique'
  | 'reference'
  | 'temporal'
  | 'business'
  | 'statistical'
  | 'custom';
/**
 * Validation context information
 */
export interface ValidationContext {
  /** Record being validated */
  record: BudgetUsageTimeSeriesPoint;
  /** Index of record in dataset */
  recordIndex: number;
  /** Complete dataset for cross-record validation */
  dataset: BudgetUsageTimeSeriesPoint[];
  /** Field being validated (if applicable) */
  field?: string;
  /** Additional context metadata */
  metadata: Record<string, any>;
  /** Validation timestamp */
  timestamp: number;
}
/**
 * Validation rule definition
 */
export interface ValidationRule {
  /** Unique rule identifier */
  id: string;
  /** Human-readable name */
  name: string;
  /** Rule description */
  description: string;
  /** Rule type */
  type: ValidationRuleType;
  /** Target fields (if applicable) */
  fields?: string[];
  /** Rule severity */
  severity: ValidationSeverity;
  /** Rule configuration */
  config: Record<string, any>;
  /** Custom validation function */
  validator?: (
    context: ValidationContext,
  ) => ValidationIssue[] | Promise<ValidationIssue[]>;
  /** Whether rule is enabled */
  enabled: boolean;
  /** Rule priority (higher numbers run first) */
  priority: number;
  /** Rule tags for categorization */
  tags: string[];
  /** Rule metadata */
  metadata: {
    author: string;
    version: string;
    createdAt: number;
    updatedAt: number;
  };
}
/**
 * Validation issue found during validation
 */
export interface ValidationIssue {
  /** Issue identifier */
  id: string;
  /** Rule that triggered this issue */
  ruleId: string;
  /** Issue severity */
  severity: ValidationSeverity;
  /** Issue message */
  message: string;
  /** Affected field (if applicable) */
  field?: string;
  /** Record index where issue was found */
  recordIndex: number;
  /** Current value that caused issue */
  currentValue?: any;
  /** Expected value or format */
  expectedValue?: any;
  /** Issue context */
  context: {
    record: BudgetUsageTimeSeriesPoint;
    metadata: Record<string, any>;
    timestamp: number;
  };
  /** Suggested fix (if available) */
  suggestion?: {
    action: 'fix' | 'remove' | 'transform' | 'ignore';
    description: string;
    implementation?: any;
  };
  /** Issue location information */
  location: {
    recordId?: string;
    field?: string;
    line?: number;
    column?: number;
  };
}
/**
 * Validation result summary
 */
export interface ValidationResult {
  /** Overall validation status */
  valid: boolean;
  /** Total records validated */
  recordCount: number;
  /** Validation execution time */
  executionTime: number;
  /** Summary statistics */
  summary: {
    totalIssues: number;
    criticalIssues: number;
    errorIssues: number;
    warningIssues: number;
    infoIssues: number;
    rulesExecuted: number;
    recordsWithIssues: number;
  };
  /** All validation issues found */
  issues: ValidationIssue[];
  /** Issues grouped by severity */
  issuesBySeverity: Record<ValidationSeverity, ValidationIssue[]>;
  /** Issues grouped by rule */
  issuesByRule: Record<string, ValidationIssue[]>;
  /** Issues grouped by field */
  issuesByField: Record<string, ValidationIssue[]>;
  /** Data quality metrics */
  qualityMetrics: {
    completeness: number;
    accuracy: number;
    consistency: number;
    validity: number;
    uniqueness: number;
    timeliness: number;
  };
  /** Validation metadata */
  metadata: {
    validatedAt: number;
    validationVersion: string;
    rulesVersion: string;
    dataVersion?: string;
  };
}
/**
 * Data quality assessment result
 */
export interface QualityAssessment {
  /** Overall quality score (0-1) */
  overallScore: number;
  /** Quality dimensions */
  dimensions: {
    completeness: QualityDimension;
    accuracy: QualityDimension;
    consistency: QualityDimension;
    validity: QualityDimension;
    uniqueness: QualityDimension;
    timeliness: QualityDimension;
  };
  /** Quality trends over time */
  trends: {
    improving: string[];
    declining: string[];
    stable: string[];
  };
  /** Recommendations for improvement */
  recommendations: Array<{
    dimension: string;
    issue: string;
    impact: 'high' | 'medium' | 'low';
    recommendation: string;
    estimatedEffort: 'low' | 'medium' | 'high';
  }>;
  /** Assessment metadata */
  metadata: {
    assessedAt: number;
    assessmentVersion: string;
    dataSize: number;
    timeRange: {
      start: number;
      end: number;
    };
  };
}
/**
 * Quality dimension details
 */
export interface QualityDimension {
  /** Dimension score (0-1) */
  score: number;
  /** Dimension status */
  status: 'excellent' | 'good' | 'fair' | 'poor';
  /** Issues affecting this dimension */
  issues: ValidationIssue[];
  /** Dimension-specific metrics */
  metrics: Record<string, number>;
  /** Historical trend */
  trend: {
    direction: 'improving' | 'declining' | 'stable';
    changeRate: number;
    confidence: number;
  };
}
/**
 * Validation engine interface
 */
export interface ValidationEngine {
  /**
   * Add validation rule
   */
  addRule(rule: ValidationRule): Promise<void>;
  /**
   * Remove validation rule
   */
  removeRule(ruleId: string): Promise<void>;
  /**
   * Get validation rule
   */
  getRule(ruleId: string): Promise<ValidationRule | null>;
  /**
   * List all validation rules
   */
  listRules(filter?: {
    type?: ValidationRuleType;
    severity?: ValidationSeverity;
    enabled?: boolean;
    tags?: string[];
  }): Promise<ValidationRule[]>;
  /**
   * Update validation rule
   */
  updateRule(ruleId: string, updates: Partial<ValidationRule>): Promise<void>;
  /**
   * Enable/disable validation rule
   */
  toggleRule(ruleId: string, enabled: boolean): Promise<void>;
  /**
   * Validate dataset
   */
  validate(
    data: BudgetUsageTimeSeriesPoint[],
    options?: {
      ruleFilter?: {
        types?: ValidationRuleType[];
        severities?: ValidationSeverity[];
        tags?: string[];
        ruleIds?: string[];
      };
      stopOnFirst?: boolean;
      maxIssues?: number;
      parallel?: boolean;
      timeout?: number;
    },
  ): Promise<ValidationResult>;
  /**
   * Validate single record
   */
  validateRecord(
    record: BudgetUsageTimeSeriesPoint,
    context: Partial<ValidationContext>,
  ): Promise<ValidationIssue[]>;
  /**
   * Assess data quality
   */
  assessQuality(data: BudgetUsageTimeSeriesPoint[]): Promise<QualityAssessment>;
  /**
   * Fix validation issues automatically
   */
  autoFix(
    data: BudgetUsageTimeSeriesPoint[],
    issues: ValidationIssue[],
    options?: {
      severityThreshold?: ValidationSeverity;
      dryRun?: boolean;
      maxFixes?: number;
    },
  ): Promise<{
    fixedData: BudgetUsageTimeSeriesPoint[];
    appliedFixes: Array<{
      issueId: string;
      action: string;
      oldValue: any;
      newValue: any;
      success: boolean;
    }>;
  }>;
  /**
   * Export validation report
   */
  exportReport(
    result: ValidationResult,
    format: 'json' | 'html' | 'csv' | 'pdf',
  ): Promise<string>;
}
/**
 * Real-time validation monitor
 */
export interface ValidationMonitor {
  /**
   * Start monitoring data stream
   */
  startMonitoring(
    dataStream: AsyncIterable<BudgetUsageTimeSeriesPoint>,
    options?: {
      batchSize?: number;
      interval?: number;
      rules?: string[];
      alertThreshold?: ValidationSeverity;
    },
  ): Promise<void>;
  /**
   * Stop monitoring
   */
  stopMonitoring(): Promise<void>;
  /**
   * Get current validation status
   */
  getStatus(): Promise<{
    isRunning: boolean;
    recordsProcessed: number;
    issuesFound: number;
    lastValidation: number;
    performance: {
      avgProcessingTime: number;
      throughput: number;
    };
  }>;
  /**
   * Subscribe to validation events
   */
  onIssue(callback: (issue: ValidationIssue) => void): void;
  /**
   * Subscribe to quality changes
   */
  onQualityChange(callback: (assessment: QualityAssessment) => void): void;
}
/**
 * Built-in validation rules
 */
export interface BuiltInRules {
  /**
   * Required fields validation
   */
  required: ValidationRule;
  /**
   * Timestamp validation
   */
  timestampValid: ValidationRule;
  /**
   * Cost validation
   */
  costValid: ValidationRule;
  /**
   * Usage percentage validation
   */
  usagePercentageValid: ValidationRule;
  /**
   * Request count validation
   */
  requestCountValid: ValidationRule;
  /**
   * Temporal consistency validation
   */
  temporalConsistency: ValidationRule;
  /**
   * Business logic validation
   */
  businessLogic: ValidationRule;
  /**
   * Statistical outlier detection
   */
  outlierDetection: ValidationRule;
  /**
   * Duplicate detection
   */
  duplicateDetection: ValidationRule;
  /**
   * Data freshness validation
   */
  dataFreshness: ValidationRule;
}
/**
 * Validation configuration
 */
export interface ValidationConfig {
  /** Default validation rules to apply */
  defaultRules: string[];
  /** Global validation settings */
  settings: {
    strictMode: boolean;
    failFast: boolean;
    maxIssuesPerRule: number;
    timeoutMs: number;
    parallelValidation: boolean;
    cacheResults: boolean;
  };
  /** Quality thresholds */
  qualityThresholds: {
    excellent: number;
    good: number;
    fair: number;
    poor: number;
  };
  /** Auto-fix configuration */
  autoFix: {
    enabled: boolean;
    maxAttempts: number;
    allowedSeverities: ValidationSeverity[];
    preserveOriginal: boolean;
  };
  /** Monitoring configuration */
  monitoring: {
    enabled: boolean;
    alertThreshold: ValidationSeverity;
    batchSize: number;
    alertChannels: string[];
  };
}
/**
 * Validation event types
 */
export type ValidationEventType =
  | 'validation_started'
  | 'validation_completed'
  | 'validation_failed'
  | 'rule_added'
  | 'rule_removed'
  | 'rule_updated'
  | 'issue_found'
  | 'auto_fix_applied'
  | 'quality_threshold_breached';
/**
 * Validation event data
 */
export interface ValidationEvent {
  /** Event type */
  type: ValidationEventType;
  /** Event timestamp */
  timestamp: number;
  /** Event data */
  data: Record<string, any>;
  /** Event severity */
  severity: ValidationSeverity;
  /** Event source */
  source: 'engine' | 'monitor' | 'rule';
  /** Event message */
  message: string;
}
/**
 * Factory function types
 */
export type CreateValidationEngine = (
  config?: Partial<ValidationConfig>,
) => ValidationEngine;
export type CreateValidationMonitor = (
  engine: ValidationEngine,
  config?: Partial<ValidationConfig>,
) => ValidationMonitor;
