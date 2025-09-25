/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Budget configuration settings
 */
export interface BudgetSettings {
    enabled?: boolean;
    dailyLimit?: number;
    resetTime?: string;
    warningThresholds?: number[];
}
/**
 * Budget usage data stored in file system
 */
export interface BudgetUsageData {
    date: string;
    requestCount: number;
    lastResetTime: string;
    warningsShown: number[];
}
