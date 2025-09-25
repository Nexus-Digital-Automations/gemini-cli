/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { CountTokensParameters, CountTokensResponse, EmbedContentParameters, EmbedContentResponse, GenerateContentParameters, GenerateContentResponse } from '@google/genai';
import type { ContentGenerator } from './contentGenerator.js';
import type { Config } from '../config/config.js';
import { type BudgetEnforcementOptions } from '../budget/budget-enforcement.js';
import type { BudgetSettings } from '../budget/types.js';
/**
 * A decorator that wraps a ContentGenerator to add budget enforcement to API calls.
 * This ensures that API requests are checked against daily budget limits before execution.
 */
export declare class BudgetContentGenerator implements ContentGenerator {
    private readonly wrapped;
    private readonly config;
    private budgetEnforcement;
    constructor(wrapped: ContentGenerator, config: Config, budgetSettings: BudgetSettings, options?: BudgetEnforcementOptions);
    getWrapped(): ContentGenerator;
    get userTier(): import("../index.js").UserTierId | undefined;
    /**
     * Update budget settings dynamically
     */
    updateBudgetSettings(settings: Partial<BudgetSettings>): void;
    /**
     * Update enforcement options dynamically
     */
    updateEnforcementOptions(options: Partial<BudgetEnforcementOptions>): void;
    /**
     * Get current budget usage statistics
     */
    getBudgetUsage(): Promise<{
        requestCount: number;
        dailyLimit: number;
        remainingRequests: number;
        usagePercentage: number;
        timeUntilReset: string;
    }>;
    /**
     * Check if budget enforcement is enabled
     */
    isBudgetEnabled(): boolean;
    generateContent(req: GenerateContentParameters, userPromptId: string): Promise<GenerateContentResponse>;
    generateContentStream(req: GenerateContentParameters, userPromptId: string): Promise<AsyncGenerator<GenerateContentResponse>>;
    /**
     * Wrapper for content streams that records successful requests when stream completes
     */
    private budgetStreamWrapper;
    countTokens(req: CountTokensParameters): Promise<CountTokensResponse>;
    embedContent(req: EmbedContentParameters): Promise<EmbedContentResponse>;
    /**
     * Check budget limits and enforce restrictions
     */
    private checkAndEnforceBudget;
    /**
     * Reset daily usage count
     */
    resetBudget(): Promise<void>;
    /**
     * Extend daily limit temporarily
     */
    extendBudget(additionalRequests: number): Promise<void>;
}
/**
 * Create a new BudgetContentGenerator that wraps an existing ContentGenerator
 */
export declare function createBudgetContentGenerator(wrapped: ContentGenerator, config: Config, budgetSettings: BudgetSettings, options?: BudgetEnforcementOptions): BudgetContentGenerator;
