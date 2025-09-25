/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type {
  BudgetAlertConfig,
  BudgetAlert,
  CostDataPoint,
  CostProjection,
  VarianceDetection,
} from '../types.js';
/**
 * Trigger evaluation result
 */
export interface TriggerEvaluationResult {
  triggerId: string;
  triggered: boolean;
  severity: BudgetAlertConfig['severity'];
  value: number;
  threshold: number;
  confidence: number;
  context: Record<string, unknown>;
}
/**
 * Escalation rule configuration
 */
export interface EscalationRule {
  id: string;
  condition: {
    alertAge: number;
    unacknowledged: boolean;
    severityLevel: BudgetAlertConfig['severity'];
    consecutiveAlerts: number;
  };
  action: {
    escalateSeverity?: BudgetAlertConfig['severity'];
    additionalChannels?: Array<'email' | 'slack' | 'webhook' | 'sms'>;
    notifyContacts?: string[];
    executeScript?: string;
  };
}
/**
 * Advanced alert trigger system with sophisticated escalation and custom rules
 * Provides intelligent alerting with dynamic thresholds and contextual triggers
 */
export declare class AlertTriggerEngine {
  private static readonly logger;
  private static escalationRules;
  private static alertHistory;
  /**
   * Evaluate all configured triggers against current data
   */
  static evaluateAllTriggers(
    costData: CostDataPoint[],
    alertConfigs: BudgetAlertConfig[],
    currentBudget: {
      total: number;
      used: number;
      remaining: number;
    },
    projection?: CostProjection,
    variance?: VarianceDetection,
  ): TriggerEvaluationResult[];
  /**
   * Evaluate a single trigger configuration
   */
  static evaluateTrigger(
    config: BudgetAlertConfig,
    costData: CostDataPoint[],
    currentBudget: {
      total: number;
      used: number;
      remaining: number;
    },
    projection?: CostProjection,
    variance?: VarianceDetection,
  ): TriggerEvaluationResult;
  /**
   * Evaluate composite triggers that depend on multiple conditions
   */
  static evaluateCompositeTriggers(
    basicResults: TriggerEvaluationResult[],
    costData: CostDataPoint[],
    currentBudget: {
      total: number;
      used: number;
      remaining: number;
    },
    projection?: CostProjection,
    variance?: VarianceDetection,
  ): TriggerEvaluationResult[];
  /**
   * Process escalation rules for active alerts
   */
  static processEscalationRules(activeAlerts: BudgetAlert[]): BudgetAlert[];
  /**
   * Register custom escalation rule
   */
  static registerEscalationRule(rule: EscalationRule): void;
  /**
   * Create intelligent trigger configurations based on usage patterns
   */
  static createIntelligentTriggers(
    costData: CostDataPoint[],
    currentBudget: {
      total: number;
      used: number;
      remaining: number;
    },
    variance?: VarianceDetection,
  ): BudgetAlertConfig[];
  private static calculateCurrentBurnRate;
  private static applyDynamicThresholdAdjustments;
  private static evaluateThresholdCondition;
  private static applyTemporalConditions;
  private static findApplicableEscalationRule;
  private static isRuleApplicable;
  private static shouldEscalate;
  private static applyEscalation;
  /**
   * Update alert history for escalation tracking
   */
  static updateAlertHistory(alert: BudgetAlert): void;
  /**
   * Clear old escalation rules and alert history
   */
  static cleanup(): void;
}
