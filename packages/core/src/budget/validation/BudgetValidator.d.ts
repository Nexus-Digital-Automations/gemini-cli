/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type {
  BudgetSettings,
  BudgetUsageData,
  BudgetValidationResult,
  BudgetCalculationContext,
} from '../types.js';
import type { CostCalculationResult } from '../calculations/CostCalculationEngine.js';
/**
 * Validation rule interface
 */
export interface ValidationRule {
  /** Rule identifier */
  id: string;
  /** Rule description */
  description: string;
  /** Rule priority (higher = more important) */
  priority: number;
  /** Whether rule is enabled */
  enabled: boolean;
  /**
   * Validate against the rule
   * @param context - Validation context
   * @returns Validation result
   */
  validate(context: ValidationContext): Promise<ValidationRuleResult>;
}
/**
 * Validation context passed to rules
 */
export interface ValidationContext {
  /** Budget settings */
  settings: BudgetSettings;
  /** Current usage data */
  usageData: BudgetUsageData;
  /** Proposed cost calculation */
  costCalculation?: CostCalculationResult;
  /** Additional context */
  context?: BudgetCalculationContext;
  /** Validation timestamp */
  timestamp: Date;
}
/**
 * Individual rule validation result
 */
export interface ValidationRuleResult {
  /** Rule that was validated */
  ruleId: string;
  /** Whether validation passed */
  passed: boolean;
  /** Severity of failure */
  severity: 'info' | 'warning' | 'error' | 'critical';
  /** Validation message */
  message: string;
  /** Recommended actions */
  recommendations?: string[];
  /** Additional metadata */
  metadata?: Record<string, any>;
}
/**
 * Comprehensive validation result
 */
export interface ComprehensiveValidationResult extends BudgetValidationResult {
  /** Individual rule results */
  ruleResults: ValidationRuleResult[];
  /** Overall validation status */
  status: 'passed' | 'warning' | 'failed';
  /** Validation summary */
  summary: {
    totalRules: number;
    passedRules: number;
    warningRules: number;
    failedRules: number;
  };
  /** Performance metrics */
  performance: {
    validationTime: number;
    slowestRule?: string;
    fastestRule?: string;
  };
}
/**
 * Budget constraint violation
 */
export declare class BudgetConstraintViolation extends Error {
  readonly constraint: string;
  readonly currentValue: number;
  readonly limitValue: number;
  readonly severity: 'warning' | 'error' | 'critical';
  constructor(
    message: string,
    constraint: string,
    currentValue: number,
    limitValue: number,
    severity: 'warning' | 'error' | 'critical',
  );
}
/**
 * Comprehensive budget validator with configurable rules
 */
export declare class BudgetValidator {
  private readonly logger;
  private readonly rules;
  /**
   * Create new budget validator
   */
  constructor();
  /**
   * Register a validation rule
   * @param rule - Validation rule to register
   */
  registerRule(rule: ValidationRule): void;
  /**
   * Unregister a validation rule
   * @param ruleId - Rule ID to unregister
   */
  unregisterRule(ruleId: string): void;
  /**
   * Enable or disable a rule
   * @param ruleId - Rule ID
   * @param enabled - Whether to enable the rule
   */
  setRuleEnabled(ruleId: string, enabled: boolean): void;
  /**
   * Validate budget constraints comprehensively
   * @param settings - Budget settings
   * @param usageData - Current usage data
   * @param costCalculation - Optional proposed cost calculation
   * @param context - Additional context
   * @returns Comprehensive validation result
   */
  validateBudgetConstraints(
    settings: BudgetSettings,
    usageData: BudgetUsageData,
    costCalculation?: CostCalculationResult,
    context?: BudgetCalculationContext,
  ): Promise<ComprehensiveValidationResult>;
  /**
   * Quick validation for simple use cases
   * @param settings - Budget settings
   * @param usageData - Current usage data
   * @param proposedCost - Proposed additional cost
   * @returns Simple validation result
   */
  quickValidate(
    settings: BudgetSettings,
    usageData: BudgetUsageData,
    proposedCost?: number,
  ): Promise<BudgetValidationResult>;
  /**
   * Get available validation rules
   * @returns Array of validation rules
   */
  getRules(): ValidationRule[];
  /**
   * Create summary message based on validation status
   * @param status - Overall validation status
   * @param summary - Validation summary
   * @returns Summary message
   */
  private createSummaryMessage;
  /**
   * Extract recommendations from rule results
   * @param ruleResults - Rule validation results
   * @returns Array of unique recommendations
   */
  private extractRecommendations;
}
/**
 * Factory function to create budget validator
 * @returns New budget validator instance
 */
export declare function createBudgetValidator(): BudgetValidator;
