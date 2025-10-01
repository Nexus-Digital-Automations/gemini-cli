/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { createCostCalculationEngine } from './calculations/CostCalculationEngine.js';
import { getComponentLogger } from '../utils/logger.js';
/**
 * Core budget tracking functionality for managing daily API request and cost limits.
 * Handles tracking usage, checking limits, and managing budget resets.
 */
export class BudgetTracker {
    projectRoot;
    settings;
    usageFilePath;
    projectBudgetFilePath;
    costEngine;
    logger;
    constructor(projectRoot, settings) {
        this.projectRoot = projectRoot;
        this.settings = settings;
        this.usageFilePath = path.join(this.projectRoot, '.gemini', 'budget-usage.json');
        this.projectBudgetFilePath = path.join(this.projectRoot, '.gemini', 'project-budget.json');
        this.costEngine = createCostCalculationEngine();
        this.logger = getComponentLogger('BudgetTracker');
    }
    /**
     * Check if budget tracking is enabled (request or dollar-based)
     */
    isEnabled() {
        const hasRequestLimit = (this.settings.dailyLimit ?? 0) > 0;
        const hasDailyDollarLimit = (this.settings.dailyBudgetDollars ?? 0) > 0;
        const hasProjectDollarLimit = (this.settings.projectBudgetDollars ?? 0) > 0;
        return (this.settings.enabled === true &&
            (hasRequestLimit || hasDailyDollarLimit || hasProjectDollarLimit));
    }
    /**
     * Get current budget configuration
     */
    getBudgetSettings() {
        return { ...this.settings };
    }
    /**
     * Update budget settings
     */
    updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
    }
    /**
     * Record a new API request in the budget tracking
     */
    async recordRequest() {
        if (!this.isEnabled()) {
            return;
        }
        const usageData = await this.getCurrentUsageData();
        const today = this.getTodayDateString();
        // Reset if it's a new day or past reset time
        if (usageData.date !== today || this.shouldReset(usageData)) {
            await this.resetDailyUsage();
            // Re-fetch after reset
            const resetUsageData = await this.getCurrentUsageData();
            resetUsageData.requestCount += 1;
            await this.saveUsageData(resetUsageData);
        }
        else {
            usageData.requestCount += 1;
            await this.saveUsageData(usageData);
        }
    }
    /**
     * Check if the current usage exceeds any budget limits (requests or dollars)
     */
    async isOverBudget() {
        if (!this.isEnabled()) {
            return false;
        }
        const usageData = await this.getCurrentUsageData();
        const projectData = await this.getProjectBudgetData();
        // Check daily request limit
        const dailyLimit = this.settings.dailyLimit ?? 0;
        if (dailyLimit > 0 && usageData.requestCount >= dailyLimit) {
            this.logger.warn('Daily request limit exceeded', {
                function: 'isOverBudget',
                requestCount: usageData.requestCount,
                dailyLimit,
            });
            return true;
        }
        // Check daily dollar limit
        const dailyDollarLimit = this.settings.dailyBudgetDollars ?? 0;
        if (dailyDollarLimit > 0 && usageData.totalCost >= dailyDollarLimit) {
            this.logger.warn('Daily dollar budget exceeded', {
                function: 'isOverBudget',
                totalCost: usageData.totalCost,
                dailyDollarLimit,
            });
            return true;
        }
        // Check project dollar limit
        const projectDollarLimit = this.settings.projectBudgetDollars ?? 0;
        if (projectDollarLimit > 0 && projectData.totalCost >= projectDollarLimit) {
            this.logger.warn('Project dollar budget exceeded', {
                function: 'isOverBudget',
                projectCost: projectData.totalCost,
                projectDollarLimit,
            });
            return true;
        }
        return false;
    }
    /**
     * Check if a warning should be shown for the current usage level
     */
    async shouldShowWarning() {
        if (!this.isEnabled()) {
            return { show: false };
        }
        const usageData = await this.getCurrentUsageData();
        const dailyLimit = this.settings.dailyLimit ?? 0;
        const usagePercentage = (usageData.requestCount / dailyLimit) * 100;
        const thresholds = this.settings.warningThresholds ?? [50, 75, 90];
        for (const threshold of thresholds.sort((a, b) => b - a)) {
            if (usagePercentage >= threshold &&
                !usageData.warningsShown.includes(threshold)) {
                // Mark this warning as shown
                usageData.warningsShown.push(threshold);
                await this.saveUsageData(usageData);
                return { show: true, threshold };
            }
        }
        return { show: false };
    }
    /**
     * Get current usage statistics including cost data
     */
    async getUsageStats() {
        const usageData = await this.getCurrentUsageData();
        const projectData = await this.getProjectBudgetData();
        const dailyLimit = this.settings.dailyLimit ?? 0;
        const remainingRequests = Math.max(0, dailyLimit - usageData.requestCount);
        const usagePercentage = dailyLimit > 0 ? (usageData.requestCount / dailyLimit) * 100 : 0;
        const timeUntilReset = this.getTimeUntilReset();
        // Daily dollar budget calculations
        const dailyBudgetDollars = this.settings.dailyBudgetDollars ?? 0;
        const remainingDailyBudget = Math.max(0, dailyBudgetDollars - usageData.totalCost);
        const dailyCostPercentage = dailyBudgetDollars > 0
            ? (usageData.totalCost / dailyBudgetDollars) * 100
            : 0;
        // Project dollar budget calculations
        const projectBudgetDollars = this.settings.projectBudgetDollars ?? 0;
        const remainingProjectBudget = Math.max(0, projectBudgetDollars - projectData.totalCost);
        const projectCostPercentage = projectBudgetDollars > 0
            ? (projectData.totalCost / projectBudgetDollars) * 100
            : 0;
        return {
            requestCount: usageData.requestCount,
            dailyLimit,
            remainingRequests,
            usagePercentage,
            timeUntilReset,
            totalCost: usageData.totalCost,
            dailyBudgetDollars,
            remainingDailyBudget,
            dailyCostPercentage,
            projectTotalCost: projectData.totalCost,
            projectBudgetDollars,
            remainingProjectBudget,
            projectCostPercentage,
        };
    }
    /**
     * Manually reset the daily usage count
     */
    async resetDailyUsage() {
        const today = this.getTodayDateString();
        const resetTime = new Date().toISOString();
        const usageData = {
            date: today,
            requestCount: 0,
            totalCost: 0,
            tokenUsage: {
                inputTokens: 0,
                outputTokens: 0,
                totalTokens: 0,
                tokenCosts: { input: 0, output: 0 },
            },
            lastResetTime: resetTime,
            warningsShown: [],
        };
        await this.saveUsageData(usageData);
    }
    /**
     * Temporarily extend the daily limit for today only
     */
    async extendDailyLimit(additionalRequests) {
        if (!this.isEnabled() || additionalRequests <= 0) {
            return;
        }
        // This is a temporary extension, so we modify the settings for this session only
        const currentLimit = this.settings.dailyLimit ?? 0;
        this.settings.dailyLimit = currentLimit + additionalRequests;
    }
    /**
     * Get current usage data, creating default if it doesn't exist
     */
    async getCurrentUsageData() {
        try {
            const data = await fs.readFile(this.usageFilePath, 'utf-8');
            const usageData = JSON.parse(data);
            // Validate and migrate if necessary
            if (!usageData.date || !usageData.lastResetTime) {
                return this.createDefaultUsageData();
            }
            return usageData;
        }
        catch (_error) {
            // File doesn't exist or is corrupted, create default
            return this.createDefaultUsageData();
        }
    }
    /**
     * Save usage data to file
     */
    async saveUsageData(usageData) {
        try {
            // Ensure the .gemini directory exists
            const dir = path.dirname(this.usageFilePath);
            await fs.mkdir(dir, { recursive: true });
            await fs.writeFile(this.usageFilePath, JSON.stringify(usageData, null, 2));
        }
        catch (error) {
            console.warn('Failed to save budget usage data:', error);
        }
    }
    /**
     * Create default usage data for today
     */
    createDefaultUsageData() {
        const today = this.getTodayDateString();
        const now = new Date().toISOString();
        return {
            date: today,
            requestCount: 0,
            totalCost: 0,
            tokenUsage: {
                inputTokens: 0,
                outputTokens: 0,
                totalTokens: 0,
                tokenCosts: { input: 0, output: 0 },
            },
            lastResetTime: now,
            warningsShown: [],
        };
    }
    /**
     * Check if budget should be reset based on reset time
     */
    shouldReset(usageData) {
        const resetTime = this.settings.resetTime ?? '00:00';
        const [resetHour, resetMinute] = resetTime.split(':').map(Number);
        const lastReset = new Date(usageData.lastResetTime);
        const now = new Date();
        // Create today's reset time
        const todayReset = new Date(now);
        todayReset.setHours(resetHour, resetMinute, 0, 0);
        // If current time is past today's reset time and last reset was before today's reset time
        return now >= todayReset && lastReset < todayReset;
    }
    /**
     * Get today's date as YYYY-MM-DD string
     */
    getTodayDateString() {
        return new Date().toISOString().split('T')[0];
    }
    /**
     * Calculate time until next budget reset
     */
    getTimeUntilReset() {
        const resetTime = this.settings.resetTime ?? '00:00';
        const [resetHour, resetMinute] = resetTime.split(':').map(Number);
        const now = new Date();
        const nextReset = new Date(now);
        nextReset.setHours(resetHour, resetMinute, 0, 0);
        // If reset time has passed today, set for tomorrow
        if (nextReset <= now) {
            nextReset.setDate(nextReset.getDate() + 1);
        }
        const timeDiff = nextReset.getTime() - now.getTime();
        const hours = Math.floor(timeDiff / (1000 * 60 * 60));
        const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        }
        else {
            return `${minutes}m`;
        }
    }
    /**
     * Get today's usage data (required by dashboard)
     */
    async getTodayUsage() {
        const usageData = await this.getCurrentUsageData();
        const today = this.getTodayDateString();
        // Reset if it's a new day
        if (usageData.date !== today) {
            await this.resetDailyUsage();
            return { requestCount: 0, totalCost: 0 };
        }
        return {
            requestCount: usageData.requestCount,
            totalCost: usageData.totalCost || 0,
        };
    }
    /**
     * Record a new API request with cost in the budget tracking
     */
    async recordRequestWithCost(cost = 0) {
        if (!this.isEnabled()) {
            return;
        }
        const usageData = await this.getCurrentUsageData();
        const today = this.getTodayDateString();
        // Reset if it's a new day or past reset time
        if (usageData.date !== today || this.shouldReset(usageData)) {
            await this.resetDailyUsage();
            // Re-fetch after reset
            const resetUsageData = await this.getCurrentUsageData();
            resetUsageData.requestCount += 1;
            resetUsageData.totalCost = (resetUsageData.totalCost || 0) + cost;
            await this.saveUsageData(resetUsageData);
        }
        else {
            usageData.requestCount += 1;
            usageData.totalCost = (usageData.totalCost || 0) + cost;
            await this.saveUsageData(usageData);
        }
        // Update project budget
        await this.updateProjectBudget(cost);
    }
    /**
     * Record API cost with token usage data
     */
    async recordCost(params) {
        const startTime = Date.now();
        this.logger.info('Recording API cost', {
            function: 'recordCost',
            model: params.model,
            inputTokens: params.inputTokens,
            outputTokens: params.outputTokens,
        });
        try {
            // Calculate cost using the cost calculation engine
            const costResult = await this.costEngine.calculateCost({
                model: params.model,
                inputTokens: params.inputTokens,
                outputTokens: params.outputTokens,
                timestamp: new Date(),
            });
            // Record the cost
            await this.recordRequestWithCost(costResult.totalCost);
            // Update token usage in daily data
            const usageData = await this.getCurrentUsageData();
            usageData.tokenUsage.inputTokens += params.inputTokens;
            usageData.tokenUsage.outputTokens += params.outputTokens;
            usageData.tokenUsage.totalTokens +=
                params.inputTokens + params.outputTokens;
            usageData.tokenUsage.tokenCosts.input += costResult.inputCost;
            usageData.tokenUsage.tokenCosts.output += costResult.outputCost;
            await this.saveUsageData(usageData);
            this.logger.info('API cost recorded successfully', {
                function: 'recordCost',
                totalCost: costResult.totalCost,
                duration: Date.now() - startTime,
            });
        }
        catch (error) {
            this.logger.error('Failed to record API cost', {
                function: 'recordCost',
                error: error,
                duration: Date.now() - startTime,
            });
            throw error;
        }
    }
    /**
     * Get project-level budget data
     */
    async getProjectBudgetData() {
        try {
            const data = await fs.readFile(this.projectBudgetFilePath, 'utf-8');
            return JSON.parse(data);
        }
        catch (_error) {
            // File doesn't exist, create default
            return this.createDefaultProjectBudgetData();
        }
    }
    /**
     * Update project-level budget with new cost
     */
    async updateProjectBudget(cost) {
        const projectData = await this.getProjectBudgetData();
        projectData.totalCost += cost;
        projectData.totalRequests += 1;
        projectData.lastUpdated = new Date().toISOString();
        try {
            const dir = path.dirname(this.projectBudgetFilePath);
            await fs.mkdir(dir, { recursive: true });
            await fs.writeFile(this.projectBudgetFilePath, JSON.stringify(projectData, null, 2));
        }
        catch (error) {
            this.logger.warn('Failed to save project budget data', {
                function: 'updateProjectBudget',
                error: error,
            });
        }
    }
    /**
     * Create default project budget data
     */
    createDefaultProjectBudgetData() {
        const now = new Date().toISOString();
        return {
            totalCost: 0,
            totalRequests: 0,
            projectStart: now,
            lastUpdated: now,
        };
    }
}
/**
 * Create a new BudgetTracker instance
 */
export function createBudgetTracker(projectRoot, settings) {
    const defaultSettings = {
        enabled: false,
        dailyLimit: 1000,
        resetTime: '00:00',
        warningThresholds: [50, 75, 90],
    };
    return new BudgetTracker(projectRoot, settings || defaultSettings);
}
/**
 * Get singleton BudgetTracker instance
 */
export async function getBudgetTracker() {
    try {
        const projectRoot = process.cwd();
        const defaultSettings = {
            enabled: false,
            dailyLimit: 1000,
            resetTime: '00:00',
            warningThresholds: [50, 75, 90],
        };
        return createBudgetTracker(projectRoot, defaultSettings);
    }
    catch (error) {
        console.error('Failed to create budget tracker:', error);
        return null;
    }
}
//# sourceMappingURL=budget-tracker.js.map