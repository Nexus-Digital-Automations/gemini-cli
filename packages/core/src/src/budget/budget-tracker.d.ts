/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { BudgetSettings, BudgetUsageData } from './types.js';
/**
 * Core budget tracking functionality for managing daily API request and cost limits.
 * Handles tracking usage, checking limits, and managing budget resets.
 */
export declare class BudgetTracker {
    private projectRoot;
    private settings;
    private usageFilePath;
    private projectBudgetFilePath;
    private costEngine;
    private logger;
    constructor(projectRoot: string, settings: BudgetSettings);
    /**
     * Check if budget tracking is enabled (request or dollar-based)
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
     * Check if the current usage exceeds any budget limits (requests or dollars)
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
     * Get current usage statistics including cost data
     */
    getUsageStats(): Promise<{
        requestCount: number;
        dailyLimit: number;
        remainingRequests: number;
        usagePercentage: number;
        timeUntilReset: string;
        totalCost: number;
        dailyBudgetDollars: number;
        remainingDailyBudget: number;
        dailyCostPercentage: number;
        projectTotalCost: number;
        projectBudgetDollars: number;
        remainingProjectBudget: number;
        projectCostPercentage: number;
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
    getCurrentUsageData(): Promise<BudgetUsageData>;
    /**
     * Save usage data to file
     */
    saveUsageData(usageData: BudgetUsageData): Promise<void>;
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
    /**
     * Record API cost with token usage data
     */
    recordCost(params: {
        model: string;
        inputTokens: number;
        outputTokens: number;
    }): Promise<void>;
    /**
     * Get project-level budget data
     */
    private getProjectBudgetData;
    /**
     * Update project-level budget with new cost
     */
    private updateProjectBudget;
    /**
     * Create default project budget data
     */
    private createDefaultProjectBudgetData;
}
/**
 * Create a new BudgetTracker instance
 */
export declare function createBudgetTracker(projectRoot: string, settings?: BudgetSettings): BudgetTracker;
/**
 * Get singleton BudgetTracker instance
 */
export declare function getBudgetTracker(): Promise<BudgetTracker | null>;
