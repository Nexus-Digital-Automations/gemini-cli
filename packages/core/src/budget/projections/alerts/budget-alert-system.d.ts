/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type {
  BudgetAlertConfig,
  BudgetAlert,
  CostDataPoint,
} from '../types.js';
/**
 * Comprehensive budget alert system with threshold monitoring and proactive alerting
 * Provides intelligent alerting with escalation, suppression, and contextual recommendations
 */
export declare class BudgetAlertSystem {
  private static readonly logger;
  private static alertSuppressions;
  private static activeAlerts;
  /**
   * Monitor cost data and trigger alerts based on configured thresholds
   */
  static monitorAndAlert(
    costData: CostDataPoint[],
    alertConfigs: BudgetAlertConfig[],
    currentBudget: {
      total: number;
      used: number;
      remaining: number;
    },
  ): Promise<BudgetAlert[]>;
  /**
   * Evaluate specific alert condition
   */
  private static evaluateAlertCondition;
  /**
   * Create alert with comprehensive context and recommendations
   */
  private static createAlert;
  /**
   * Generate contextual alert messages
   */
  private static generateAlertMessage;
  /**
   * Calculate projected impact of current trends
   */
  private static calculateProjectedImpact;
  /**
   * Generate contextual recommendations based on alert conditions
   */
  private static generateRecommendations;
  /**
   * Check if alert should be triggered based on suppression rules
   */
  private static shouldTriggerAlert;
  /**
   * Update alert suppression tracking
   */
  private static updateAlertSuppression;
  /**
   * Calculate current burn rate from recent data
   */
  private static calculateCurrentBurnRate;
  /**
   * Get all active alerts
   */
  static getActiveAlerts(): BudgetAlert[];
  /**
   * Acknowledge an alert
   */
  static acknowledgeAlert(alertId: string): boolean;
  /**
   * Resolve an alert
   */
  static resolveAlert(alertId: string): boolean;
  /**
   * Clean up old suppression records
   */
  static cleanupSuppressions(): void;
  /**
   * Create default alert configurations for common scenarios
   */
  static createDefaultAlertConfigs(): BudgetAlertConfig[];
}
