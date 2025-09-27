/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Context Prioritization Engine
 * Intelligently ranks context importance to optimize limited context window usage
 *
 * @author Claude Code - Advanced Context Retention Agent
 * @version 1.0.0
 */

import { getComponentLogger } from '../utils/logger.js';
import type {
  ContextItem,
  PrioritizationConfig,
  ContextScoring,
  PrioritizationResult,
  PrioritizationStats,
} from './types.js';
import {
  ContextType,
  ContextPriority,
} from './types.js';

const logger = getComponentLogger('context-prioritizer');

/**
 * Default configuration for context prioritization
 */
export const DEFAULT_PRIORITIZATION_CONFIG: PrioritizationConfig = {
  recencyWeight: 0.3,
  relevanceWeight: 0.4,
  interactionWeight: 0.2,
  dependencyWeight: 0.1,
  maxAgeHours: 24,
  minRelevanceThreshold: 0.1,
};

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
export class ContextPrioritizer {
  private config: PrioritizationConfig;
  private interactionCounts: Map<string, number> = new Map();
  private relevanceCache: Map<string, number> = new Map();

  constructor(config: Partial<PrioritizationConfig> = {}) {
    this.config = { ...DEFAULT_PRIORITIZATION_CONFIG, ...config };
    logger.info('ContextPrioritizer initialized', { config: this.config });
  }

  /**
   * Prioritize a collection of context items
   *
   * @param items - Context items to prioritize
   * @param currentContext - Current working context for relevance scoring
   * @returns Prioritization result with sorted items and recommendations
   */
  async prioritize(
    items: ContextItem[],
    currentContext?: string,
  ): Promise<PrioritizationResult> {
    const startTime = performance.now();
    logger.debug(`Prioritizing ${items.length} context items`);

    try {
      // Score all items
      const scoredItems = await Promise.all(
        items.map((item) => this.scoreContextItem(item, currentContext, items)),
      );

      // Sort by final score (descending)
      const sortedItems = scoredItems.sort(
        (a, b) => b.scoring.finalScore - a.scoring.finalScore,
      );

      // Categorize items based on scores and priorities
      const result = this.categorizeItems(sortedItems);

      // Calculate statistics
      result.stats = this.calculateStats(items, result);

      const duration = performance.now() - startTime;
      logger.info(`Prioritization completed in ${duration.toFixed(2)}ms`, {
        totalItems: items.length,
        critical: result.critical.length,
        toCompress: result.toCompress.length,
        toRemove: result.toRemove.length,
      });

      return result;
    } catch (error) {
      logger.error('Failed to prioritize context items', { error });
      throw error;
    }
  }

  /**
   * Score an individual context item
   */
  private async scoreContextItem(
    item: ContextItem,
    currentContext?: string,
    allItems: ContextItem[] = [],
  ): Promise<ContextItem & { scoring: ContextScoring }> {
    // Calculate individual scoring factors
    const recency = this.calculateRecencyScore(item);
    const relevance = await this.calculateRelevanceScore(item, currentContext);
    const interaction = this.calculateInteractionScore(item);
    const dependency = this.calculateDependencyScore(item, allItems);

    // Calculate weighted final score
    const finalScore =
      recency * this.config.recencyWeight +
      relevance * this.config.relevanceWeight +
      interaction * this.config.interactionWeight +
      dependency * this.config.dependencyWeight;

    const scoring: ContextScoring = {
      recency,
      relevance,
      interaction,
      dependency,
      finalScore: Math.max(0, Math.min(1, finalScore)), // Clamp to 0-1
    };

    return {
      ...item,
      scoring,
    };
  }

  /**
   * Calculate recency score based on timestamp and last access
   */
  private calculateRecencyScore(item: ContextItem): number {
    const now = Date.now();
    const created = item.timestamp.getTime();
    const lastAccessed = item.lastAccessed.getTime();

    // Use the more recent of creation or last access
    const mostRecent = Math.max(created, lastAccessed);
    const ageMs = now - mostRecent;
    const maxAgeMs = this.config.maxAgeHours * 60 * 60 * 1000;

    // Exponential decay with age
    const recencyScore = Math.exp(-ageMs / (maxAgeMs / 3));
    return Math.max(0, Math.min(1, recencyScore));
  }

  /**
   * Calculate relevance score based on content similarity to current context
   */
  private async calculateRelevanceScore(
    item: ContextItem,
    currentContext?: string,
  ): Promise<number> {
    // Check cache first
    const cacheKey = `${item.id}:${currentContext?.substring(0, 100) || 'no-context'}`;
    const cached = this.relevanceCache.get(cacheKey);
    if (cached !== undefined) {
      return cached;
    }

    let relevance = item.relevanceScore; // Start with existing relevance

    // Boost relevance based on context type
    const typeBoosts: Record<ContextType, number> = {
      [ContextType.ERROR]: 0.2, // Errors are often relevant
      [ContextType.USER_PREFERENCE]: 0.3, // User preferences are important
      [ContextType.PROJECT_STATE]: 0.1, // Project state has baseline relevance
      [ContextType.CODE]: 0.15, // Code context varies by situation
      [ContextType.CONVERSATION]: 0.05, // Conversation relevance varies
      [ContextType.FILE]: 0.1, // File context baseline
      [ContextType.SYSTEM]: 0.0, // System context is usually stable
    };

    relevance += typeBoosts[item.type] || 0;

    // If we have current context, calculate semantic similarity
    if (currentContext && item.content) {
      const similarity = this.calculateSemanticSimilarity(
        item.content,
        currentContext,
      );
      relevance = relevance * 0.6 + similarity * 0.4; // Blend existing and similarity
    }

    // Boost for items mentioned in tags or metadata
    if (currentContext) {
      const contextLower = currentContext.toLowerCase();

      // Check if any tags match current context
      const tagMatches = item.tags.filter((tag) =>
        contextLower.includes(tag.toLowerCase()),
      ).length;
      relevance += tagMatches * 0.1;

      // Check metadata for relevance
      const metadataStr = JSON.stringify(item.metadata).toLowerCase();
      if (metadataStr.includes(contextLower.substring(0, 50))) {
        relevance += 0.1;
      }
    }

    relevance = Math.max(0, Math.min(1, relevance));
    this.relevanceCache.set(cacheKey, relevance);
    return relevance;
  }

  /**
   * Calculate semantic similarity between two text strings
   * (Simplified implementation - in production, would use embeddings)
   */
  private calculateSemanticSimilarity(text1: string, text2: string): number {
    if (!text1 || !text2) return 0;

    // Simple word overlap similarity (would use embeddings in production)
    const words1 = new Set(
      text1
        .toLowerCase()
        .split(/\s+/)
        .filter((word) => word.length > 3),
    );

    const words2 = new Set(
      text2
        .toLowerCase()
        .split(/\s+/)
        .filter((word) => word.length > 3),
    );

    if (words1.size === 0 || words2.size === 0) return 0;

    // Calculate Jaccard similarity
    const intersection = new Set(
      [...words1].filter((word) => words2.has(word)),
    );
    const union = new Set([...words1, ...words2]);

    return intersection.size / union.size;
  }

  /**
   * Calculate interaction score based on how often user has accessed this context
   */
  private calculateInteractionScore(item: ContextItem): number {
    const interactionCount = this.interactionCounts.get(item.id) || 0;

    // Logarithmic scaling for interaction frequency
    const maxInteractions = 100; // Assumed maximum for normalization
    const normalizedCount = Math.min(interactionCount, maxInteractions);

    return normalizedCount > 0
      ? Math.log(normalizedCount + 1) / Math.log(maxInteractions + 1)
      : 0;
  }

  /**
   * Calculate dependency score based on how many other items depend on this one
   */
  private calculateDependencyScore(
    item: ContextItem,
    allItems: ContextItem[],
  ): number {
    // Count how many other items list this item as a dependency
    const dependentCount = allItems.filter((otherItem) =>
      otherItem.dependencies.includes(item.id),
    ).length;

    // Also count this item's own dependencies (items it depends on are less important to remove)
    const dependsOnCount = item.dependencies.length;

    // Items that many others depend on should have higher scores
    // Items that depend on many others have moderate scores
    const maxDependents = Math.max(10, allItems.length * 0.1); // Assume max 10% dependency rate
    const dependentScore =
      Math.min(dependentCount, maxDependents) / maxDependents;
    const dependsOnScore = (Math.min(dependsOnCount, 5) / 5) * 0.3; // Cap at 5 deps, lower weight

    return dependentScore + dependsOnScore;
  }

  /**
   * Categorize scored items into action groups
   */
  private categorizeItems(
    scoredItems: Array<ContextItem & { scoring: ContextScoring }>,
  ): Omit<PrioritizationResult, 'stats'> {
    const critical: ContextItem[] = [];
    const toCompress: ContextItem[] = [];
    const toRemove: ContextItem[] = [];
    const prioritized: ContextItem[] = [];

    for (const item of scoredItems) {
      prioritized.push(item);

      // Critical items: high priority or high scores
      if (
        item.priority === ContextPriority.CRITICAL ||
        item.scoring.finalScore > 0.8 ||
        item.type === ContextType.ERROR ||
        item.type === ContextType.USER_PREFERENCE
      ) {
        critical.push(item);
      }
      // Low scoring items or old items to remove
      else if (
        item.scoring.finalScore < this.config.minRelevanceThreshold ||
        this.isItemTooOld(item)
      ) {
        // Don't remove if other items depend on it
        if (item.scoring.dependency < 0.3) {
          toRemove.push(item);
        } else {
          toCompress.push(item);
        }
      }
      // Medium scoring items to compress
      else if (
        item.scoring.finalScore < 0.6 ||
        item.priority === ContextPriority.LOW ||
        item.priority === ContextPriority.CACHED
      ) {
        toCompress.push(item);
      }
    }

    return {
      prioritized,
      toCompress,
      toRemove,
      critical,
    };
  }

  /**
   * Check if an item is too old based on configuration
   */
  private isItemTooOld(item: ContextItem): boolean {
    const maxAge = this.config.maxAgeHours * 60 * 60 * 1000;
    const age =
      Date.now() -
      Math.max(item.timestamp.getTime(), item.lastAccessed.getTime());

    return age > maxAge;
  }

  /**
   * Calculate prioritization statistics
   */
  private calculateStats(
    originalItems: ContextItem[],
    result: Omit<PrioritizationResult, 'stats'>,
  ): PrioritizationStats {
    const byPriority: Record<ContextPriority, number> = {
      [ContextPriority.CRITICAL]: 0,
      [ContextPriority.HIGH]: 0,
      [ContextPriority.MEDIUM]: 0,
      [ContextPriority.LOW]: 0,
      [ContextPriority.CACHED]: 0,
    };

    const byType: Record<ContextType, number> = {
      [ContextType.CONVERSATION]: 0,
      [ContextType.CODE]: 0,
      [ContextType.FILE]: 0,
      [ContextType.PROJECT_STATE]: 0,
      [ContextType.ERROR]: 0,
      [ContextType.SYSTEM]: 0,
      [ContextType.USER_PREFERENCE]: 0,
    };

    let totalRelevance = 0;
    let totalTokens = 0;

    for (const item of originalItems) {
      byPriority[item.priority]++;
      byType[item.type]++;
      totalRelevance += item.relevanceScore;
      totalTokens += item.tokenCount;
    }

    // Estimate compression savings (items to compress typically save 60-80% tokens)
    const compressionSavings = result.toCompress.reduce(
      (sum, item) => sum + item.tokenCount * 0.7,
      0,
    );
    const removalSavings = result.toRemove.reduce(
      (sum, item) => sum + item.tokenCount,
      0,
    );

    return {
      totalItems: originalItems.length,
      byPriority,
      byType,
      averageRelevance:
        originalItems.length > 0 ? totalRelevance / originalItems.length : 0,
      totalTokens,
      estimatedSavings: compressionSavings + removalSavings,
    };
  }

  /**
   * Record user interaction with a context item
   */
  recordInteraction(itemId: string): void {
    const current = this.interactionCounts.get(itemId) || 0;
    this.interactionCounts.set(itemId, current + 1);
    logger.debug(`Recorded interaction with context item ${itemId}`, {
      count: current + 1,
    });
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<PrioritizationConfig>): void {
    this.config = { ...this.config, ...config };
    logger.info('Prioritization config updated', { config: this.config });
  }

  /**
   * Clear caches (useful for testing or memory management)
   */
  clearCaches(): void {
    this.relevanceCache.clear();
    this.interactionCounts.clear();
    logger.debug('Context prioritizer caches cleared');
  }

  /**
   * Get current configuration
   */
  getConfig(): PrioritizationConfig {
    return { ...this.config };
  }

  /**
   * Get interaction statistics
   */
  getInteractionStats(): Array<{ itemId: string; count: number }> {
    return Array.from(this.interactionCounts.entries()).map(
      ([itemId, count]) => ({
        itemId,
        count,
      }),
    );
  }
}

/**
 * Create a context prioritizer instance with optional configuration
 */
export function createContextPrioritizer(
  config?: Partial<PrioritizationConfig>,
): ContextPrioritizer {
  return new ContextPrioritizer(config);
}
