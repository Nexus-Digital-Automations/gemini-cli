/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { BudgetSettings } from './types.js';
/**
 * Error thrown when a request is blocked due to budget limits
 */
export declare class BudgetExceededError extends Error {
    requestCount: number;
    dailyLimit: number;
    timeUntilReset: string;
    constructor(requestCount: number, dailyLimit: number, timeUntilReset: string);
}
/**
 * Warning information when approaching budget limits
 */
export interface BudgetWarning {
    threshold: number;
    requestCount: number;
    dailyLimit: number;
    remainingRequests: number;
    usagePercentage: number;
    timeUntilReset: string;
}
/**
 * Options for budget enforcement
 */
export interface BudgetEnforcementOptions {
    /** Allow bypassing budget limits with confirmation */
    allowOverride?: boolean;
    /** Skip budget checking entirely */
    disabled?: boolean;
    /** Custom message for budget exceeded error */
    customMessage?: string;
}
/**
 * Budget enforcement engine that intercepts requests and applies budget limits
 */
export declare class BudgetEnforcement {
    private tracker;
    private options;
    constructor(projectRoot: string, settings: BudgetSettings, options?: BudgetEnforcementOptions);
    /**
     * Check if a request should be allowed based on budget limits
     * This should be called BEFORE making an API request
     */
    checkRequestAllowed(): Promise<{
        allowed: boolean;
        warning?: BudgetWarning;
        error?: BudgetExceededError;
    }>;
    /**
     * Record a successful request (increments usage counter)
     * This should be called AFTER a successful API request
     */
    recordSuccessfulRequest(): Promise<void>;
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
     * Check if budget tracking is enabled
     */
    isEnabled(): boolean;
    /**
     * Get budget settings
     */
    getBudgetSettings(): BudgetSettings;
    /**
     * Update budget settings
     */
    updateSettings(newSettings: Partial<BudgetSettings>): void;
    /**
     * Reset daily usage counter
     */
    resetDailyUsage(): Promise<void>;
    /**
     * Extend daily limit temporarily
     */
    extendDailyLimit(additionalRequests: number): Promise<void>;
    /**
     * Update enforcement options
     */
    updateOptions(newOptions: Partial<BudgetEnforcementOptions>): void;
    /**
     * Format a budget warning message for display
     */
    formatWarningMessage(warning: BudgetWarning): string;
    /**
     * Format a budget exceeded message for display
     */
    formatBudgetExceededMessage(error: BudgetExceededError): string;
    /**
     * Create a wrapper function that enforces budget limits around an API call
     */
    wrapApiCall<T>(apiCall: () => Promise<T>): () => Promise<T>;
}
/**
 * Create a new BudgetEnforcement instance
 */
export declare function createBudgetEnforcement(projectRoot: string, settings: BudgetSettings, options?: BudgetEnforcementOptions): BudgetEnforcement;
/**
 * Utility function to check if an error is a budget exceeded error
 */
export declare function isBudgetExceededError(error: unknown): error is BudgetExceededError;
