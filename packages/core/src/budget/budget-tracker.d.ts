/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { BudgetSettings } from './types.js';
/**
 * Core budget tracking functionality for managing daily API request limits.
 * Handles tracking usage, checking limits, and managing budget resets.
 */
export declare class BudgetTracker {
  private projectRoot;
  private settings;
  private usageFilePath;
  constructor(projectRoot: string, settings: BudgetSettings);
  /**
   * Check if budget tracking is enabled
   */
  isEnabled(): boolean;
  /**
   * Get current budget configuration
   */
  getBudgetSettings(): BudgetSettings;
  /**
   * Update budget settings
   */
  updateSettings(newSettings: Partial<BudgetSettings>): void;
  /**
   * Record a new API request in the budget tracking
   */
  recordRequest(): Promise<void>;
  /**
   * Check if the current usage exceeds the daily limit
   */
  isOverBudget(): Promise<boolean>;
  /**
   * Check if a warning should be shown for the current usage level
   */
  shouldShowWarning(): Promise<{
    show: boolean;
    threshold?: number;
  }>;
  /**
   * Get current usage statistics
   */
  getUsageStats(): Promise<{
    requestCount: number;
    dailyLimit: number;
    remainingRequests: number;
    usagePercentage: number;
    timeUntilReset: string;
  }>;
  /**
   * Manually reset the daily usage count
   */
  resetDailyUsage(): Promise<void>;
  /**
   * Temporarily extend the daily limit for today only
   */
  extendDailyLimit(additionalRequests: number): Promise<void>;
  /**
   * Get current usage data, creating default if it doesn't exist
   */
  private getCurrentUsageData;
  /**
   * Save usage data to file
   */
  private saveUsageData;
  /**
   * Create default usage data for today
   */
  private createDefaultUsageData;
  /**
   * Check if budget should be reset based on reset time
   */
  private shouldReset;
  /**
   * Get today's date as YYYY-MM-DD string
   */
  private getTodayDateString;
  /**
   * Calculate time until next budget reset
   */
  private getTimeUntilReset;
  /**
   * Get today's usage data (required by dashboard)
   */
  getTodayUsage(): Promise<{
    requestCount: number;
    totalCost: number;
  }>;
  /**
   * Record a new API request with cost in the budget tracking
   */
  recordRequestWithCost(cost?: number): Promise<void>;
}
/**
 * Create a new BudgetTracker instance
 */
export declare function createBudgetTracker(
  projectRoot: string,
  settings?: BudgetSettings,
): BudgetTracker;
