/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { BudgetEnforcement, BudgetExceededError, } from '../budget/budget-enforcement.js';
/**
 * A decorator that wraps a ContentGenerator to add budget enforcement to API calls.
 * This ensures that API requests are checked against daily budget limits before execution.
 */
export class BudgetContentGenerator {
    wrapped;
    config;
    budgetEnforcement;
    constructor(wrapped, config, budgetSettings, options = {}) {
        this.wrapped = wrapped;
        this.config = config;
        const projectRoot = this.config.getProjectRoot();
        this.budgetEnforcement = new BudgetEnforcement(projectRoot, budgetSettings, options);
    }
    getWrapped() {
        return this.wrapped;
    }
    get userTier() {
        return this.wrapped.userTier;
    }
    /**
     * Update budget settings dynamically
     */
    updateBudgetSettings(settings) {
        this.budgetEnforcement.updateSettings(settings);
    }
    /**
     * Update enforcement options dynamically
     */
    updateEnforcementOptions(options) {
        this.budgetEnforcement.updateOptions(options);
    }
    /**
     * Get current budget usage statistics
     */
    async getBudgetUsage() {
        return await this.budgetEnforcement.getUsageStats();
    }
    /**
     * Check if budget enforcement is enabled
     */
    isBudgetEnabled() {
        return this.budgetEnforcement.isEnabled();
    }
    async generateContent(req, userPromptId) {
        // Check budget before making the request
        await this.checkAndEnforceBudget('generateContent');
        // Make the API call
        const response = await this.wrapped.generateContent(req, userPromptId);
        // Record successful request
        await this.budgetEnforcement.recordSuccessfulRequest();
        return response;
    }
    async generateContentStream(req, userPromptId) {
        // Check budget before making the request
        await this.checkAndEnforceBudget('generateContentStream');
        // Make the API call
        const stream = await this.wrapped.generateContentStream(req, userPromptId);
        // Wrap the stream to record successful request when stream completes
        return this.budgetStreamWrapper(stream);
    }
    /**
     * Wrapper for content streams that records successful requests when stream completes
     */
    async *budgetStreamWrapper(stream) {
        let hasYieldedAnyResponse = false;
        for await (const response of stream) {
            hasYieldedAnyResponse = true;
            yield response;
        }
        // Record successful request only if we got at least one response
        if (hasYieldedAnyResponse) {
            await this.budgetEnforcement.recordSuccessfulRequest();
        }
    }
    async countTokens(req) {
        // Token counting doesn't consume the API quota significantly, so we don't enforce budget
        return this.wrapped.countTokens(req);
    }
    async embedContent(req) {
        // Check budget before making the request
        await this.checkAndEnforceBudget('embedContent');
        // Make the API call
        const response = await this.wrapped.embedContent(req);
        // Record successful request
        await this.budgetEnforcement.recordSuccessfulRequest();
        return response;
    }
    /**
     * Check budget limits and enforce restrictions
     */
    async checkAndEnforceBudget(operation) {
        if (!this.budgetEnforcement.isEnabled()) {
            return;
        }
        const check = await this.budgetEnforcement.checkRequestAllowed();
        // Show warnings if needed
        if (check.warning) {
            const warningMessage = this.budgetEnforcement.formatWarningMessage(check.warning);
            console.warn(`\n⚠️  ${warningMessage}\n`);
        }
        // Block request if budget exceeded
        if (!check.allowed && check.error) {
            const errorMessage = this.budgetEnforcement.formatBudgetExceededMessage(check.error);
            // Create a more detailed error for the CLI
            const enhancedError = new BudgetExceededError(check.error.requestCount, check.error.dailyLimit, check.error.timeUntilReset);
            // Add context about the operation that was blocked
            enhancedError.message = `${errorMessage}\n\nThe '${operation}' operation was blocked due to budget limits.`;
            throw enhancedError;
        }
    }
    /**
     * Reset daily usage count
     */
    async resetBudget() {
        await this.budgetEnforcement.resetDailyUsage();
    }
    /**
     * Extend daily limit temporarily
     */
    async extendBudget(additionalRequests) {
        await this.budgetEnforcement.extendDailyLimit(additionalRequests);
    }
}
/**
 * Create a new BudgetContentGenerator that wraps an existing ContentGenerator
 */
export function createBudgetContentGenerator(wrapped, config, budgetSettings, options = {}) {
    return new BudgetContentGenerator(wrapped, config, budgetSettings, options);
}
//# sourceMappingURL=budgetContentGenerator.js.map