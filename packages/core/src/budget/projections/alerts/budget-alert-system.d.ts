/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { BudgetAlertConfig, BudgetAlert, CostDataPoint } from '../types.js';
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
    static monitorAndAlert(costData: CostDataPoint[], alertConfigs: BudgetAlertConfig[], currentBudget: {
        total: number;
        used: number;
        remaining: number;
    }): Promise<BudgetAlert[]>;
    /**
     * Evaluate specific alert condition
     */
    private static evaluateAlertCondition;
    default: break;
}
