/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { BudgetTracker } from './budget-tracker.js';
/**
 * Error thrown when a request is blocked due to budget limits
 */
export class BudgetExceededError extends Error {
  requestCount;
  dailyLimit;
  timeUntilReset;
  constructor(requestCount, dailyLimit, timeUntilReset) {
    super(
      `Daily budget exceeded: ${requestCount}/${dailyLimit} requests used. Reset in ${timeUntilReset}`,
    );
    this.requestCount = requestCount;
    this.dailyLimit = dailyLimit;
    this.timeUntilReset = timeUntilReset;
    this.name = 'BudgetExceededError';
  }
}
/**
 * Budget enforcement engine that intercepts requests and applies budget limits
 */
export class BudgetEnforcement {
  tracker;
  options;
  constructor(projectRoot, settings, options = {}) {
    this.tracker = new BudgetTracker(projectRoot, settings);
    this.options = options;
  }
  /**
   * Check if a request should be allowed based on budget limits
   * This should be called BEFORE making an API request
   */
  async checkRequestAllowed() {
    // Skip if budget is disabled or enforcement is disabled
    if (!this.tracker.isEnabled() || this.options.disabled) {
      return { allowed: true };
    }
    // Check if over budget
    const isOverBudget = await this.tracker.isOverBudget();
    if (isOverBudget && !this.options.allowOverride) {
      const stats = await this.tracker.getUsageStats();
      const error = new BudgetExceededError(
        stats.requestCount,
        stats.dailyLimit,
        stats.timeUntilReset,
      );
      return { allowed: false, error };
    }
    // Check for warnings
    const warningCheck = await this.tracker.shouldShowWarning();
    if (warningCheck.show && warningCheck.threshold) {
      const stats = await this.tracker.getUsageStats();
      const warning = {
        threshold: warningCheck.threshold,
        requestCount: stats.requestCount,
        dailyLimit: stats.dailyLimit,
        remainingRequests: stats.remainingRequests,
        usagePercentage: stats.usagePercentage,
        timeUntilReset: stats.timeUntilReset,
      };
      return { allowed: true, warning };
    }
    return { allowed: true };
  }
  /**
   * Record a successful request (increments usage counter)
   * This should be called AFTER a successful API request
   */
  async recordSuccessfulRequest() {
    if (!this.tracker.isEnabled() || this.options.disabled) {
      return;
    }
    await this.tracker.recordRequest();
  }
  /**
   * Get current usage statistics
   */
  async getUsageStats() {
    return await this.tracker.getUsageStats();
  }
  /**
   * Check if budget tracking is enabled
   */
  isEnabled() {
    return this.tracker.isEnabled() && !this.options.disabled;
  }
  /**
   * Get budget settings
   */
  getBudgetSettings() {
    return this.tracker.getBudgetSettings();
  }
  /**
   * Update budget settings
   */
  updateSettings(newSettings) {
    this.tracker.updateSettings(newSettings);
  }
  /**
   * Reset daily usage counter
   */
  async resetDailyUsage() {
    await this.tracker.resetDailyUsage();
  }
  /**
   * Extend daily limit temporarily
   */
  async extendDailyLimit(additionalRequests) {
    await this.tracker.extendDailyLimit(additionalRequests);
  }
  /**
   * Update enforcement options
   */
  updateOptions(newOptions) {
    this.options = { ...this.options, ...newOptions };
  }
  /**
   * Format a budget warning message for display
   */
  formatWarningMessage(warning) {
    return `Budget Warning: You've used ${warning.requestCount}/${warning.dailyLimit} requests (${warning.usagePercentage.toFixed(1)}%). ${warning.remainingRequests} requests remaining. Budget resets in ${warning.timeUntilReset}.`;
  }
  /**
   * Format a budget exceeded message for display
   */
  formatBudgetExceededMessage(error) {
    if (this.options.customMessage) {
      return this.options.customMessage;
    }
    return `Daily budget exceeded! You've reached your limit of ${error.dailyLimit} requests per day. Your budget will reset in ${error.timeUntilReset}. Use 'gemini budget extend <amount>' to temporarily increase your limit, or 'gemini budget reset' to reset your usage.`;
  }
  /**
   * Create a wrapper function that enforces budget limits around an API call
   */
  wrapApiCall(apiCall) {
    return async () => {
      // Check budget before making the call
      const check = await this.checkRequestAllowed();
      if (!check.allowed && check.error) {
        throw check.error;
      }
      // Show warning if needed (non-blocking)
      if (check.warning) {
        console.warn(this.formatWarningMessage(check.warning));
      }
      // Make the API call
      const result = await apiCall();
      // Record successful request
      await this.recordSuccessfulRequest();
      return result;
    };
  }
}
/**
 * Create a new BudgetEnforcement instance
 */
export function createBudgetEnforcement(projectRoot, settings, options = {}) {
  return new BudgetEnforcement(projectRoot, settings, options);
}
/**
 * Utility function to check if an error is a budget exceeded error
 */
export function isBudgetExceededError(error) {
  return error instanceof BudgetExceededError;
}
//# sourceMappingURL=budget-enforcement.js.map
