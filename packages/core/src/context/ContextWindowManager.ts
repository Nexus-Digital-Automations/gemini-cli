/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Context Window Management Engine
 * Efficiently manages limited context space with intelligent allocation
 *
 * @author Claude Code - Advanced Context Retention Agent
 * @version 1.0.0
 */

import { getComponentLogger } from '../utils/logger.js';
import type {
  ContextItem,
  ContextWindow,
  ContextSections,
  ContextSection,
  ContextType,
  ContextPriority,
  PrioritizationResult,
  CompressionResult,
} from './types.js';
import { ContextPrioritizer } from './ContextPrioritizer.js';
import { SemanticCompressor } from './SemanticCompressor.js';

const logger = getComponentLogger('context-window-manager');

/**
 * Configuration for context window management
 */
export interface ContextWindowConfig {
  /** Total context window size in tokens */
  totalTokens: number;
  /** Section allocation percentages (must sum to 1.0) */
  sectionAllocation: {
    system: number;
    conversation: number;
    code: number;
    project: number;
    memory: number;
  };
  /** Minimum tokens to reserve for each section */
  minTokensPerSection: number;
  /** Buffer percentage to maintain (0.1 = 10% buffer) */
  bufferPercentage: number;
  /** Enable dynamic allocation based on usage patterns */
  enableDynamicAllocation: boolean;
  /** Compression threshold (compress sections above this percentage) */
  compressionThreshold: number;
}

/**
 * Default configuration for context window management
 */
export const DEFAULT_CONTEXT_WINDOW_CONFIG: ContextWindowConfig = {
  totalTokens: 32000, // Gemini Pro default
  sectionAllocation: {
    system: 0.15,    // 15% for system prompts and instructions
    conversation: 0.35, // 35% for conversation history
    code: 0.25,      // 25% for code context
    project: 0.15,   // 15% for project context
    memory: 0.10,    // 10% for long-term memory
  },
  minTokensPerSection: 500,
  bufferPercentage: 0.05, // 5% safety buffer
  enableDynamicAllocation: true,
  compressionThreshold: 0.85, // Compress when section is 85% full
};

/**
 * Context allocation statistics
 */
export interface AllocationStats {
  /** Total tokens allocated */
  totalAllocated: number;
  /** Tokens by section */
  bySections: Record<string, number>;
  /** Utilization rates by section */
  utilizationRates: Record<string, number>;
  /** Sections that need compression */
  needsCompression: string[];
  /** Sections that can be expanded */
  canExpand: string[];
  /** Wasted tokens (allocated but unused) */
  wastedTokens: number;
  /** Efficiency score (0-1) */
  efficiencyScore: number;
}

/**
 * Context Window Management Engine
 *
 * The ContextWindowManager efficiently manages limited context space with intelligent allocation.
 * It dynamically adjusts context sections based on current needs, tracks token usage, and performs
 * smart eviction when space is needed.
 *
 * Key Features:
 * - Dynamic Allocation: Adjusts context sections based on usage patterns
 * - Context Budget Management: Tracks token usage across all sections
 * - Smart Eviction: Removes least important content when space needed
 * - Context Chunking: Breaks large content into manageable pieces
 * - Real-time Monitoring: Continuous usage tracking and optimization
 *
 * @example
 * ```typescript
 * const windowManager = new ContextWindowManager();
 * await windowManager.addToSection('code', codeContextItem);
 * const window = windowManager.getCurrentWindow();
 * console.log(`Using ${window.usedTokens}/${window.totalTokens} tokens`);
 * ```
 */
export class ContextWindowManager {
  private config: ContextWindowConfig;
  private contextWindow: ContextWindow;
  private prioritizer: ContextPrioritizer;
  private compressor: SemanticCompressor;
  private usageHistory: Map<string, number[]> = new Map();
  private lastOptimization: Date = new Date();

  constructor(config: Partial<ContextWindowConfig> = {}) {
    this.config = { ...DEFAULT_CONTEXT_WINDOW_CONFIG, ...config };
    this.prioritizer = new ContextPrioritizer();
    this.compressor = new SemanticCompressor();
    this.contextWindow = this.initializeContextWindow();

    logger.info('ContextWindowManager initialized', {
      totalTokens: this.config.totalTokens,
      sections: Object.keys(this.config.sectionAllocation),
      dynamicAllocation: this.config.enableDynamicAllocation,
    });
  }

  /**
   * Initialize an empty context window with proper section allocation
   */
  private initializeContextWindow(): ContextWindow {
    const sections: ContextSections = {
      system: this.createSection('system', ContextPriority.CRITICAL),
      conversation: this.createSection('conversation', ContextPriority.HIGH),
      code: this.createSection('code', ContextPriority.HIGH),
      project: this.createSection('project', ContextPriority.MEDIUM),
      memory: this.createSection('memory', ContextPriority.LOW),
    };

    // Calculate initial token allocation
    this.allocateTokensToSections(sections);

    return {
      totalTokens: this.config.totalTokens,
      usedTokens: 0,
      availableTokens: this.config.totalTokens,
      sections,
    };
  }

  /**
   * Create a new context section with default values
   */
  private createSection(name: string, priority: ContextPriority): ContextSection {
    return {
      name,
      tokens: 0,
      maxTokens: 0, // Will be set by allocation
      content: '',
      items: [],
      priority,
    };
  }

  /**
   * Allocate tokens to sections based on configuration
   */
  private allocateTokensToSections(sections: ContextSections): void {
    const availableTokens = this.config.totalTokens * (1 - this.config.bufferPercentage);

    for (const [sectionName, section] of Object.entries(sections)) {
      const allocationRatio = this.config.sectionAllocation[sectionName as keyof typeof this.config.sectionAllocation];
      const allocatedTokens = Math.max(
        this.config.minTokensPerSection,
        Math.floor(availableTokens * allocationRatio),
      );

      section.maxTokens = allocatedTokens;
      logger.debug(`Allocated ${allocatedTokens} tokens to ${sectionName} section`);
    }
  }

  /**
   * Add content to a specific section
   */
  async addToSection(sectionName: keyof ContextSections, item: ContextItem): Promise<boolean> {
    const startTime = performance.now();
    logger.debug(`Adding item to ${sectionName} section`, { itemId: item.id, tokens: item.tokenCount });

    try {
      const section = this.contextWindow.sections[sectionName];

      // Check if we have space in the section
      if (section.tokens + item.tokenCount > section.maxTokens) {
        logger.debug(`Section ${sectionName} full, attempting optimization`);
        const optimized = await this.optimizeSection(sectionName);

        if (!optimized || section.tokens + item.tokenCount > section.maxTokens) {
          logger.warn(`Cannot add item to ${sectionName}: insufficient space after optimization`);
          return false;
        }
      }

      // Add the item
      section.items.push(item);
      section.tokens += item.tokenCount;
      section.content += `\n${item.content}`;

      // Update context window totals
      this.updateContextWindowTotals();

      // Record usage for dynamic allocation
      this.recordSectionUsage(sectionName, item.tokenCount);

      // Trigger optimization if needed
      if (this.shouldOptimize()) {
        await this.optimizeContextWindow();
      }

      const duration = performance.now() - startTime;
      logger.info(`Added item to ${sectionName} section in ${duration.toFixed(2)}ms`, {
        itemId: item.id,
        sectionTokens: section.tokens,
        totalUsed: this.contextWindow.usedTokens,
      });

      return true;
    } catch (error) {
      logger.error(`Failed to add item to ${sectionName} section`, { error, itemId: item.id });
      return false;
    }
  }

  /**
   * Remove specific items from a section
   */
  removeFromSection(sectionName: keyof ContextSections, itemIds: string[]): void {
    logger.debug(`Removing items from ${sectionName} section`, { itemIds });

    const section = this.contextWindow.sections[sectionName];
    const itemsToRemove = new Set(itemIds);

    // Filter out items to remove
    const remainingItems = section.items.filter(item => !itemsToRemove.has(item.id));
    const removedTokens = section.items
      .filter(item => itemsToRemove.has(item.id))
      .reduce((sum, item) => sum + item.tokenCount, 0);

    // Update section
    section.items = remainingItems;
    section.tokens -= removedTokens;
    section.content = remainingItems.map(item => item.content).join('\n');

    // Update totals
    this.updateContextWindowTotals();

    logger.info(`Removed ${itemIds.length} items from ${sectionName} section`, {
      removedTokens,
      remainingItems: remainingItems.length,
    });
  }

  /**
   * Optimize a specific section by compression or eviction
   */
  private async optimizeSection(sectionName: keyof ContextSections): Promise<boolean> {
    const startTime = performance.now();
    logger.debug(`Optimizing ${sectionName} section`);

    try {
      const section = this.contextWindow.sections[sectionName];

      if (section.items.length === 0) {
        logger.debug(`Section ${sectionName} is empty, no optimization needed`);
        return false;
      }

      // Prioritize items in the section
      const prioritizationResult = await this.prioritizer.prioritize(section.items);

      // Remove low-priority items first
      if (prioritizationResult.toRemove.length > 0) {
        const itemsToRemove = prioritizationResult.toRemove.map(item => item.id);
        this.removeFromSection(sectionName, itemsToRemove);
        logger.info(`Removed ${itemsToRemove.length} low-priority items from ${sectionName}`);
      }

      // Compress items marked for compression
      if (prioritizationResult.toCompress.length > 0) {
        await this.compressItemsInSection(sectionName, prioritizationResult.toCompress);
      }

      const duration = performance.now() - startTime;
      logger.info(`Optimized ${sectionName} section in ${duration.toFixed(2)}ms`, {
        removedItems: prioritizationResult.toRemove.length,
        compressedItems: prioritizationResult.toCompress.length,
        newTokenCount: section.tokens,
      });

      return true;
    } catch (error) {
      logger.error(`Failed to optimize ${sectionName} section`, { error });
      return false;
    }
  }

  /**
   * Compress specific items within a section
   */
  private async compressItemsInSection(
    sectionName: keyof ContextSections,
    itemsToCompress: ContextItem[],
  ): Promise<void> {
    const section = this.contextWindow.sections[sectionName];
    let totalSavings = 0;

    for (const item of itemsToCompress) {
      try {
        const compressionResult = await this.compressor.compress(item);

        // Replace the item with compressed version
        const itemIndex = section.items.findIndex(i => i.id === item.id);
        if (itemIndex !== -1) {
          const compressedItem: ContextItem = {
            ...item,
            content: compressionResult.compressed,
            tokenCount: compressionResult.compressedTokens,
          };

          section.items[itemIndex] = compressedItem;
          totalSavings += compressionResult.originalTokens - compressionResult.compressedTokens;
        }
      } catch (error) {
        logger.warn(`Failed to compress item ${item.id} in ${sectionName}`, { error });
      }
    }

    // Recalculate section metrics
    section.tokens = section.items.reduce((sum, item) => sum + item.tokenCount, 0);
    section.content = section.items.map(item => item.content).join('\n');

    logger.info(`Compressed ${itemsToCompress.length} items in ${sectionName}`, {
      tokensSaved: totalSavings,
      newSectionSize: section.tokens,
    });
  }

  /**
   * Perform global context window optimization
   */
  async optimizeContextWindow(): Promise<void> {
    const startTime = performance.now();
    logger.info('Starting global context window optimization');

    try {
      // Get current allocation statistics
      const stats = this.getAllocationStats();

      // Optimize sections that need compression
      for (const sectionName of stats.needsCompression) {
        await this.optimizeSection(sectionName as keyof ContextSections);
      }

      // Perform dynamic reallocation if enabled
      if (this.config.enableDynamicAllocation) {
        this.performDynamicAllocation();
      }

      this.lastOptimization = new Date();
      const duration = performance.now() - startTime;

      logger.info(`Global optimization completed in ${duration.toFixed(2)}ms`, {
        optimizedSections: stats.needsCompression.length,
        efficiencyScore: this.getAllocationStats().efficiencyScore,
      });
    } catch (error) {
      logger.error('Failed to optimize context window', { error });
    }
  }

  /**
   * Perform dynamic allocation based on usage patterns
   */
  private performDynamicAllocation(): void {
    logger.debug('Performing dynamic allocation based on usage patterns');

    const usagePatterns = this.analyzeSectionUsage();
    const sections = this.contextWindow.sections;

    // Calculate new allocation based on recent usage
    let totalUsageWeight = 0;
    const sectionWeights: Record<string, number> = {};

    for (const [sectionName, usage] of Object.entries(usagePatterns)) {
      const baseWeight = this.config.sectionAllocation[sectionName as keyof typeof this.config.sectionAllocation];
      const usageWeight = usage.averageUsage / usage.maxCapacity;

      // Blend base allocation with usage patterns (70% base, 30% usage)
      sectionWeights[sectionName] = baseWeight * 0.7 + usageWeight * 0.3;
      totalUsageWeight += sectionWeights[sectionName];
    }

    // Normalize weights and apply new allocation
    const availableTokens = this.config.totalTokens * (1 - this.config.bufferPercentage);

    for (const [sectionName, section] of Object.entries(sections)) {
      const normalizedWeight = sectionWeights[sectionName] / totalUsageWeight;
      const newAllocation = Math.max(
        this.config.minTokensPerSection,
        Math.floor(availableTokens * normalizedWeight),
      );

      section.maxTokens = newAllocation;
      logger.debug(`Dynamically allocated ${newAllocation} tokens to ${sectionName}`, {
        previousAllocation: section.maxTokens,
        usagePattern: usagePatterns[sectionName],
      });
    }
  }

  /**
   * Analyze section usage patterns over time
   */
  private analyzeSectionUsage(): Record<string, { averageUsage: number; maxCapacity: number; trend: number }> {
    const patterns: Record<string, { averageUsage: number; maxCapacity: number; trend: number }> = {};

    for (const [sectionName, section] of Object.entries(this.contextWindow.sections)) {
      const usageHistory = this.usageHistory.get(sectionName) || [];

      patterns[sectionName] = {
        averageUsage: usageHistory.length > 0 ?
          usageHistory.reduce((sum, usage) => sum + usage, 0) / usageHistory.length : 0,
        maxCapacity: section.maxTokens,
        trend: this.calculateUsageTrend(usageHistory),
      };
    }

    return patterns;
  }

  /**
   * Calculate usage trend (positive = increasing, negative = decreasing)
   */
  private calculateUsageTrend(usageHistory: number[]): number {
    if (usageHistory.length < 2) return 0;

    const recentUsage = usageHistory.slice(-5); // Last 5 measurements
    const earlyUsage = usageHistory.slice(0, Math.min(5, usageHistory.length - 5));

    if (earlyUsage.length === 0) return 0;

    const recentAvg = recentUsage.reduce((sum, val) => sum + val, 0) / recentUsage.length;
    const earlyAvg = earlyUsage.reduce((sum, val) => sum + val, 0) / earlyUsage.length;

    return (recentAvg - earlyAvg) / earlyAvg;
  }

  /**
   * Record section usage for dynamic allocation
   */
  private recordSectionUsage(sectionName: string, tokensDelta: number): void {
    const currentUsage = this.usageHistory.get(sectionName) || [];
    const section = this.contextWindow.sections[sectionName as keyof ContextSections];

    currentUsage.push(section.tokens);

    // Keep only last 50 measurements for efficiency
    if (currentUsage.length > 50) {
      currentUsage.shift();
    }

    this.usageHistory.set(sectionName, currentUsage);
  }

  /**
   * Update context window totals after section changes
   */
  private updateContextWindowTotals(): void {
    const usedTokens = Object.values(this.contextWindow.sections)
      .reduce((sum, section) => sum + section.tokens, 0);

    this.contextWindow.usedTokens = usedTokens;
    this.contextWindow.availableTokens = this.contextWindow.totalTokens - usedTokens;
  }

  /**
   * Determine if optimization should be triggered
   */
  private shouldOptimize(): boolean {
    const timeSinceLastOptimization = Date.now() - this.lastOptimization.getTime();
    const minOptimizationInterval = 30000; // 30 seconds

    // Don't optimize too frequently
    if (timeSinceLastOptimization < minOptimizationInterval) {
      return false;
    }

    // Optimize if any section is above compression threshold
    for (const section of Object.values(this.contextWindow.sections)) {
      const utilizationRate = section.tokens / section.maxTokens;
      if (utilizationRate > this.config.compressionThreshold) {
        return true;
      }
    }

    return false;
  }

  /**
   * Get current context window state
   */
  getCurrentWindow(): ContextWindow {
    return {
      ...this.contextWindow,
      sections: {
        system: { ...this.contextWindow.sections.system },
        conversation: { ...this.contextWindow.sections.conversation },
        code: { ...this.contextWindow.sections.code },
        project: { ...this.contextWindow.sections.project },
        memory: { ...this.contextWindow.sections.memory },
      },
    };
  }

  /**
   * Get allocation statistics for monitoring
   */
  getAllocationStats(): AllocationStats {
    const sections = this.contextWindow.sections;
    const bySections: Record<string, number> = {};
    const utilizationRates: Record<string, number> = {};
    const needsCompression: string[] = [];
    const canExpand: string[] = [];
    let totalAllocated = 0;
    let wastedTokens = 0;

    for (const [sectionName, section] of Object.entries(sections)) {
      const utilized = section.tokens;
      const allocated = section.maxTokens;
      const utilizationRate = allocated > 0 ? utilized / allocated : 0;

      bySections[sectionName] = utilized;
      utilizationRates[sectionName] = utilizationRate;
      totalAllocated += allocated;

      if (utilizationRate > this.config.compressionThreshold) {
        needsCompression.push(sectionName);
      } else if (utilizationRate < 0.3) {
        canExpand.push(sectionName);
      }

      wastedTokens += Math.max(0, allocated - utilized);
    }

    const efficiencyScore = totalAllocated > 0 ?
      (totalAllocated - wastedTokens) / totalAllocated : 0;

    return {
      totalAllocated,
      bySections,
      utilizationRates,
      needsCompression,
      canExpand,
      wastedTokens,
      efficiencyScore,
    };
  }

  /**
   * Clear all content from a specific section
   */
  clearSection(sectionName: keyof ContextSections): void {
    const section = this.contextWindow.sections[sectionName];
    section.items = [];
    section.tokens = 0;
    section.content = '';

    this.updateContextWindowTotals();

    logger.info(`Cleared ${sectionName} section`);
  }

  /**
   * Clear all content from context window
   */
  clearAll(): void {
    for (const sectionName of Object.keys(this.contextWindow.sections) as (keyof ContextSections)[]) {
      this.clearSection(sectionName);
    }

    logger.info('Cleared entire context window');
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<ContextWindowConfig>): void {
    this.config = { ...this.config, ...newConfig };

    // Reallocate tokens if total tokens changed
    if (newConfig.totalTokens || newConfig.sectionAllocation) {
      this.contextWindow.totalTokens = this.config.totalTokens;
      this.allocateTokensToSections(this.contextWindow.sections);
      this.updateContextWindowTotals();
    }

    logger.info('Context window configuration updated', { config: this.config });
  }

  /**
   * Get current configuration
   */
  getConfig(): ContextWindowConfig {
    return { ...this.config };
  }

  /**
   * Export context window state for debugging
   */
  exportState(): Record<string, unknown> {
    return {
      config: this.getConfig(),
      window: this.getCurrentWindow(),
      stats: this.getAllocationStats(),
      usageHistory: Object.fromEntries(this.usageHistory),
      lastOptimization: this.lastOptimization.toISOString(),
    };
  }
}

/**
 * Create a context window manager instance with optional configuration
 */
export function createContextWindowManager(
  config?: Partial<ContextWindowConfig>,
): ContextWindowManager {
  return new ContextWindowManager(config);
}