/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { ContextItem, PrioritizationConfig, PrioritizationResult } from './types.js';
/**
 * Default configuration for context prioritization
 */
export declare const DEFAULT_PRIORITIZATION_CONFIG: PrioritizationConfig;
/**
 * Context Prioritization Engine
 *
 * The ContextPrioritizer intelligently ranks context items by importance to optimize
 * limited context window usage. It uses multiple factors to determine which context
 * items should be retained, compressed, or removed.
 *
 * Scoring Factors:
 * - Recency: How recently the context was created or accessed
 * - Relevance: How relevant the context is to current work
 * - Interaction: How often the user has interacted with this context
 * - Dependencies: How many other context items depend on this one
 *
 * @example
 * ```typescript
 * const prioritizer = new ContextPrioritizer();
 * const result = await prioritizer.prioritize(contextItems);
 * console.log(`Keeping ${result.critical.length} critical items`);
 * console.log(`Compressing ${result.toCompress.length} items`);
 * console.log(`Removing ${result.toRemove.length} items`);
 * ```
 */
export declare class ContextPrioritizer {
    private config;
    private interactionCounts;
    private relevanceCache;
    constructor(config?: Partial<PrioritizationConfig>);
    /**
     * Prioritize a collection of context items
     *
     * @param items - Context items to prioritize
     * @param currentContext - Current working context for relevance scoring
     * @returns Prioritization result with sorted items and recommendations
     */
    prioritize(items: ContextItem[], currentContext?: string): Promise<PrioritizationResult>;
    /**
     * Score an individual context item
     */
    private scoreContextItem;
    /**
     * Calculate recency score based on timestamp and last access
     */
    private calculateRecencyScore;
    /**
     * Calculate relevance score based on content similarity to current context
     */
    private calculateRelevanceScore;
    /**
     * Calculate semantic similarity between two text strings
     * (Simplified implementation - in production, would use embeddings)
     */
    private calculateSemanticSimilarity;
    /**
     * Calculate interaction score based on how often user has accessed this context
     */
    private calculateInteractionScore;
    /**
     * Calculate dependency score based on how many other items depend on this one
     */
    private calculateDependencyScore;
    /**
     * Categorize scored items into action groups
     */
    private categorizeItems;
    /**
     * Check if an item is too old based on configuration
     */
    private isItemTooOld;
    /**
     * Calculate prioritization statistics
     */
    private calculateStats;
    /**
     * Record user interaction with a context item
     */
    recordInteraction(itemId: string): void;
    /**
     * Update configuration
     */
    updateConfig(config: Partial<PrioritizationConfig>): void;
    /**
     * Clear caches (useful for testing or memory management)
     */
    clearCaches(): void;
    /**
     * Get current configuration
     */
    getConfig(): PrioritizationConfig;
    /**
     * Get interaction statistics
     */
    getInteractionStats(): Array<{
        itemId: string;
        count: number;
    }>;
}
/**
 * Create a context prioritizer instance with optional configuration
 */
export declare function createContextPrioritizer(config?: Partial<PrioritizationConfig>): ContextPrioritizer;
