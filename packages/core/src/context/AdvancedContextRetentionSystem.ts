/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Advanced Context Retention System - Main Orchestrator
 * Unified interface that integrates all context management components
 *
 * @author Claude Code - Advanced Context Retention Agent
 * @version 1.0.0
 */

import { getComponentLogger } from '../utils/logger.js';
import type {
  ContextItem,
  ContextWindow,
  ContextSuggestion,
  ContextAnalysis,
  SessionContext,
} from './types.js';

import {
  ContextPrioritizer,
  DEFAULT_PRIORITIZATION_CONFIG,
} from './ContextPrioritizer.js';
import {
  SemanticCompressor,
  DEFAULT_COMPRESSION_CONFIG,
} from './SemanticCompressor.js';
import {
  CrossSessionStorage,
  DEFAULT_STORAGE_CONFIG,
} from './CrossSessionStorage.js';
import {
  ContextWindowManager,
  DEFAULT_CONTEXT_WINDOW_CONFIG,
} from './ContextWindowManager.js';
import {
  CodeContextAnalyzer,
  DEFAULT_CODE_ANALYSIS_CONFIG,
} from './CodeContextAnalyzer.js';
import {
  SuggestionEngine,
  DEFAULT_SUGGESTION_ENGINE_CONFIG,
} from './SuggestionEngine.js';

import type {
  PrioritizationConfig,
  CompressionConfig,
  StorageConfig,
  ContextWindowConfig,
  CodeAnalysisConfig,
  SuggestionEngineConfig,
  UserInteraction,
} from './types.js';

const logger = getComponentLogger('advanced-context-retention-system');

/**
 * Configuration for the entire Advanced Context Retention System
 */
export interface AdvancedContextRetentionConfig {
  /** Project path for context management */
  projectPath: string;
  /** Context prioritization configuration */
  prioritization: Partial<PrioritizationConfig>;
  /** Semantic compression configuration */
  compression: Partial<CompressionConfig>;
  /** Cross-session storage configuration */
  storage: Partial<StorageConfig>;
  /** Context window management configuration */
  contextWindow: Partial<ContextWindowConfig>;
  /** Code analysis configuration */
  codeAnalysis: Partial<CodeAnalysisConfig>;
  /** Suggestion engine configuration */
  suggestions: Partial<SuggestionEngineConfig>;
  /** Enable automatic optimization */
  enableAutoOptimization: boolean;
  /** Auto-optimization interval in minutes */
  autoOptimizationInterval: number;
  /** Enable cross-session learning */
  enableCrossSessionLearning: boolean;
  /** Maximum context items to maintain */
  maxContextItems: number;
}

/**
 * Default configuration for Advanced Context Retention System
 */
export const DEFAULT_ADVANCED_CONTEXT_RETENTION_CONFIG: AdvancedContextRetentionConfig =
  {
    projectPath: process.cwd(),
    prioritization: DEFAULT_PRIORITIZATION_CONFIG,
    compression: DEFAULT_COMPRESSION_CONFIG,
    storage: DEFAULT_STORAGE_CONFIG,
    contextWindow: DEFAULT_CONTEXT_WINDOW_CONFIG,
    codeAnalysis: DEFAULT_CODE_ANALYSIS_CONFIG,
    suggestions: DEFAULT_SUGGESTION_ENGINE_CONFIG,
    enableAutoOptimization: true,
    autoOptimizationInterval: 30, // 30 minutes
    enableCrossSessionLearning: true,
    maxContextItems: 500,
  };

/**
 * System statistics and health metrics
 */
export interface SystemStats {
  /** Total context items managed */
  totalContextItems: number;
  /** Memory usage in MB */
  memoryUsageMB: number;
  /** Context window utilization rate */
  windowUtilization: number;
  /** Compression efficiency */
  compressionEfficiency: number;
  /** Cache hit rates */
  cacheHitRates: Record<string, number>;
  /** Suggestion acceptance rate */
  suggestionAcceptanceRate: number;
  /** Session count */
  sessionCount: number;
  /** Last optimization time */
  lastOptimization: Date;
  /** System uptime in hours */
  uptimeHours: number;
}

/**
 * Advanced Context Retention System
 *
 * The main orchestrator that integrates all context management components into a unified system.
 * Provides intelligent context window management, semantic compression, cross-session memory persistence,
 * and context-aware suggestions to enhance long-running project continuity.
 *
 * Key Features:
 * - **Intelligent Prioritization**: Automatically ranks context by importance and relevance
 * - **Semantic Compression**: AI-powered content compression while preserving meaning
 * - **Cross-Session Memory**: Persistent context storage and retrieval across CLI sessions
 * - **Dynamic Window Management**: Efficient allocation of limited context space
 * - **Code Understanding**: Deep project structure and relationship analysis
 * - **Smart Suggestions**: Context-aware recommendations and workflow optimization
 *
 * @example
 * ```typescript
 * const contextSystem = await AdvancedContextRetentionSystem.create({
 *   projectPath: '/path/to/project',
 *   enableAutoOptimization: true,
 * });
 *
 * // Add context items
 * await contextSystem.addContext('code', codeContent, { filePath: 'src/main.ts' });
 *
 * // Get intelligent suggestions
 * const suggestions = await contextSystem.getSuggestions();
 *
 * // Optimize context automatically
 * await contextSystem.optimize();
 * ```
 */
export class AdvancedContextRetentionSystem {
  private config: AdvancedContextRetentionConfig;
  private prioritizer: ContextPrioritizer;
  private compressor: SemanticCompressor;
  private storage: CrossSessionStorage;
  private windowManager: ContextWindowManager;
  private codeAnalyzer: CodeContextAnalyzer;
  private suggestionEngine: SuggestionEngine;

  private contextItems: Map<string, ContextItem> = new Map();
  private autoOptimizationTimer?: NodeJS.Timeout;
  private systemStartTime: Date = new Date();
  private isInitialized = false;

  private constructor(config: Partial<AdvancedContextRetentionConfig> = {}) {
    this.config = { ...DEFAULT_ADVANCED_CONTEXT_RETENTION_CONFIG, ...config };

    // Initialize all components
    this.prioritizer = new ContextPrioritizer(this.config.prioritization);
    this.compressor = new SemanticCompressor(this.config.compression);
    this.storage = new CrossSessionStorage(this.config.storage);
    this.windowManager = new ContextWindowManager(this.config.contextWindow);
    this.codeAnalyzer = new CodeContextAnalyzer(
      this.config.projectPath,
      this.config.codeAnalysis,
    );
    this.suggestionEngine = new SuggestionEngine(
      this.storage,
      this.config.suggestions,
    );

    logger.info('AdvancedContextRetentionSystem initialized', {
      projectPath: this.config.projectPath,
      autoOptimization: this.config.enableAutoOptimization,
      crossSessionLearning: this.config.enableCrossSessionLearning,
    });
  }

  /**
   * Create and initialize an Advanced Context Retention System instance
   */
  static async create(
    config: Partial<AdvancedContextRetentionConfig> = {},
  ): Promise<AdvancedContextRetentionSystem> {
    const system = new AdvancedContextRetentionSystem(config);
    await system.initialize();
    return system;
  }

  /**
   * Initialize the system with historical data and start optimization
   */
  private async initialize(): Promise<void> {
    const startTime = performance.now();
    logger.info('Initializing Advanced Context Retention System');

    try {
      // Initialize suggestion engine with historical data
      if (this.config.enableCrossSessionLearning) {
        await this.suggestionEngine.initialize(this.config.projectPath);
      }

      // Load previous session context if available
      await this.loadPreviousSession();

      // Start auto-optimization if enabled
      if (this.config.enableAutoOptimization) {
        this.startAutoOptimization();
      }

      this.isInitialized = true;
      const duration = performance.now() - startTime;

      logger.info(
        `Advanced Context Retention System initialized in ${duration.toFixed(2)}ms`,
        {
          contextItems: this.contextItems.size,
          autoOptimization: this.config.enableAutoOptimization,
        },
      );
    } catch (error) {
      logger.error('Failed to initialize Advanced Context Retention System', {
        error,
      });
      throw error;
    }
  }

  /**
   * Add context to the system
   */
  async addContext(
    type: string,
    content: string,
    metadata: Record<string, unknown> = {},
  ): Promise<string> {
    if (!this.isInitialized) {
      throw new Error('System not initialized. Call create() first.');
    }

    const startTime = performance.now();
    const contextItem: ContextItem = {
      id: this.generateContextId(),
      content,
      timestamp: new Date(),
      lastAccessed: new Date(),
      type,
      priority: 'medium',
      relevanceScore: 0.5,
      tokenCount: this.estimateTokenCount(content),
      dependencies: [],
      metadata,
      tags: this.extractTags(content),
    };

    try {
      // Store context item
      this.contextItems.set(contextItem.id, contextItem);

      // Add to appropriate window section
      const sectionName = this.mapTypeToSection(type);
      const added = await this.windowManager.addToSection(
        sectionName,
        contextItem,
      );

      if (!added) {
        // Context window full - trigger optimization
        logger.debug('Context window full, triggering optimization');
        await this.optimize();

        // Retry adding after optimization
        const retryAdded = await this.windowManager.addToSection(
          sectionName,
          contextItem,
        );
        if (!retryAdded) {
          logger.warn('Failed to add context item even after optimization', {
            itemId: contextItem.id,
            section: sectionName,
          });
        }
      }

      // Check if we exceed maximum context items
      if (this.contextItems.size > this.config.maxContextItems) {
        await this.pruneOldContext();
      }

      const duration = performance.now() - startTime;
      logger.debug(`Added context item in ${duration.toFixed(2)}ms`, {
        itemId: contextItem.id,
        type,
        tokenCount: contextItem.tokenCount,
      });

      return contextItem.id;
    } catch (error) {
      logger.error('Failed to add context item', { error, type });
      throw error;
    }
  }

  /**
   * Get intelligent suggestions based on current context
   */
  async getSuggestions(currentContext?: string): Promise<ContextSuggestion[]> {
    if (!this.isInitialized) {
      throw new Error('System not initialized. Call create() first.');
    }

    try {
      // Get current code context
      const codeContext = await this.codeAnalyzer.analyzeProject();

      // Get recent interactions (placeholder - would be tracked in real implementation)
      const recentInteractions: UserInteraction[] = [];

      // Generate suggestions
      const suggestions = await this.suggestionEngine.generateSuggestions(
        currentContext || this.getCurrentContextSummary(),
        codeContext,
        recentInteractions,
      );

      logger.debug(`Generated ${suggestions.length} suggestions`);
      return suggestions;
    } catch (error) {
      logger.error('Failed to generate suggestions', { error });
      return [];
    }
  }

  /**
   * Analyze current context for patterns and optimization opportunities
   */
  async analyzeContext(): Promise<ContextAnalysis> {
    if (!this.isInitialized) {
      throw new Error('System not initialized. Call create() first.');
    }

    try {
      const contextItems = Array.from(this.contextItems.values());
      return await this.suggestionEngine.analyzeContext(contextItems);
    } catch (error) {
      logger.error('Failed to analyze context', { error });
      throw error;
    }
  }

  /**
   * Optimize the context system
   */
  async optimize(): Promise<{
    itemsRemoved: number;
    itemsCompressed: number;
    tokensSaved: number;
  }> {
    if (!this.isInitialized) {
      throw new Error('System not initialized. Call create() first.');
    }

    const startTime = performance.now();
    logger.info('Starting context optimization');

    let itemsRemoved = 0;
    let itemsCompressed = 0;
    let tokensSaved = 0;

    try {
      // Get all context items
      const contextItems = Array.from(this.contextItems.values());

      // Prioritize items
      const prioritizationResult =
        await this.prioritizer.prioritize(contextItems);

      // Remove low-priority items
      for (const item of prioritizationResult.toRemove) {
        this.contextItems.delete(item.id);
        itemsRemoved++;
        tokensSaved += item.tokenCount;

        logger.debug(`Removed low-priority context item: ${item.id}`);
      }

      // Compress items marked for compression
      for (const item of prioritizationResult.toCompress) {
        try {
          const compressionResult = await this.compressor.compress(item);

          // Update context item with compressed content
          const compressedItem: ContextItem = {
            ...item,
            content: compressionResult.compressed,
            tokenCount: compressionResult.compressedTokens,
            lastAccessed: new Date(),
          };

          this.contextItems.set(item.id, compressedItem);
          itemsCompressed++;
          tokensSaved +=
            compressionResult.originalTokens -
            compressionResult.compressedTokens;

          logger.debug(`Compressed context item: ${item.id}`, {
            originalTokens: compressionResult.originalTokens,
            compressedTokens: compressionResult.compressedTokens,
            ratio: compressionResult.compressionRatio,
          });
        } catch (error) {
          logger.warn(`Failed to compress context item: ${item.id}`, { error });
        }
      }

      // Optimize context window
      await this.windowManager.optimizeContextWindow();

      const duration = performance.now() - startTime;
      logger.info(
        `Context optimization completed in ${duration.toFixed(2)}ms`,
        {
          itemsRemoved,
          itemsCompressed,
          tokensSaved,
          remainingItems: this.contextItems.size,
        },
      );

      return { itemsRemoved, itemsCompressed, tokensSaved };
    } catch (error) {
      logger.error('Failed to optimize context', { error });
      throw error;
    }
  }

  /**
   * Save current session context
   */
  async saveSession(): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('System not initialized. Call create() first.');
    }

    try {
      const codeContext = await this.codeAnalyzer.analyzeProject();

      const sessionContext: SessionContext = {
        sessionId: this.generateSessionId(),
        projectPath: this.config.projectPath,
        startTime: this.systemStartTime,
        endTime: new Date(),
        conversationSummary: this.generateConversationSummary(),
        codeContext,
        userPreferences: this.extractUserPreferences(),
        contextItems: Array.from(this.contextItems.values()),
      };

      await this.storage.saveSession(sessionContext);
      logger.info(`Saved session context`, {
        sessionId: sessionContext.sessionId,
        contextItems: sessionContext.contextItems.length,
      });
    } catch (error) {
      logger.error('Failed to save session context', { error });
      throw error;
    }
  }

  /**
   * Load previous session context
   */
  private async loadPreviousSession(): Promise<void> {
    try {
      const sessions = await this.storage.getRelatedSessions(
        this.config.projectPath,
        1,
      );

      if (sessions.length > 0) {
        const lastSession = sessions[0];

        // Load relevant context items from previous session
        for (const item of lastSession.contextItems.slice(-20)) {
          // Last 20 items
          this.contextItems.set(item.id, {
            ...item,
            lastAccessed: new Date(), // Update access time
          });
        }

        logger.info(`Loaded context from previous session`, {
          sessionId: lastSession.sessionId,
          itemsLoaded: lastSession.contextItems.slice(-20).length,
        });
      }
    } catch (error) {
      logger.debug('No previous session found or failed to load', { error });
    }
  }

  /**
   * Track user interaction for learning
   */
  async trackInteraction(interaction: UserInteraction): Promise<void> {
    if (!this.isInitialized) {
      return;
    }

    try {
      await this.suggestionEngine.trackInteraction(interaction);

      // Update context item access times
      if (interaction.files) {
        for (const file of interaction.files) {
          for (const [itemId, item] of this.contextItems.entries()) {
            if (
              item.metadata.filePath === file ||
              item.content.includes(file)
            ) {
              item.lastAccessed = new Date();
              this.prioritizer.recordInteraction(itemId);
            }
          }
        }
      }
    } catch (error) {
      logger.warn('Failed to track interaction', { error });
    }
  }

  /**
   * Get current context window state
   */
  getContextWindow(): ContextWindow {
    if (!this.isInitialized) {
      throw new Error('System not initialized. Call create() first.');
    }

    return this.windowManager.getCurrentWindow();
  }

  /**
   * Get system statistics and health metrics
   */
  getSystemStats(): SystemStats {
    const memoryUsage = process.memoryUsage();
    const currentWindow = this.isInitialized
      ? this.windowManager.getCurrentWindow()
      : null;
    const allocationStats = this.isInitialized
      ? this.windowManager.getAllocationStats()
      : null;
    const interactionStats = this.isInitialized
      ? this.suggestionEngine.getInteractionStats()
      : null;

    return {
      totalContextItems: this.contextItems.size,
      memoryUsageMB: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      windowUtilization: currentWindow
        ? currentWindow.usedTokens / currentWindow.totalTokens
        : 0,
      compressionEfficiency: allocationStats
        ? allocationStats.efficiencyScore
        : 0,
      cacheHitRates: {
        suggestions: 0.75, // Placeholder
        prioritization: 0.8,
        compression: 0.65,
      },
      suggestionAcceptanceRate: interactionStats
        ? interactionStats.successRate
        : 0,
      sessionCount: 0, // Would be tracked from storage
      lastOptimization: new Date(),
      uptimeHours:
        (Date.now() - this.systemStartTime.getTime()) / (1000 * 60 * 60),
    };
  }

  /**
   * Update system configuration
   */
  updateConfig(newConfig: Partial<AdvancedContextRetentionConfig>): void {
    this.config = { ...this.config, ...newConfig };

    // Update component configurations
    if (newConfig.prioritization) {
      this.prioritizer.updateConfig(newConfig.prioritization);
    }
    if (newConfig.compression) {
      this.compressor.updateConfig(newConfig.compression);
    }
    if (newConfig.storage) {
      this.storage.updateConfig(newConfig.storage);
    }
    if (newConfig.contextWindow) {
      this.windowManager.updateConfig(newConfig.contextWindow);
    }
    if (newConfig.codeAnalysis) {
      this.codeAnalyzer.updateConfig(newConfig.codeAnalysis);
    }
    if (newConfig.suggestions) {
      this.suggestionEngine.updateConfig(newConfig.suggestions);
    }

    // Restart auto-optimization if interval changed
    if (
      newConfig.autoOptimizationInterval &&
      this.config.enableAutoOptimization
    ) {
      this.stopAutoOptimization();
      this.startAutoOptimization();
    }

    logger.info('System configuration updated');
  }

  /**
   * Graceful shutdown of the system
   */
  async shutdown(): Promise<void> {
    logger.info('Shutting down Advanced Context Retention System');

    try {
      // Stop auto-optimization
      this.stopAutoOptimization();

      // Save current session
      await this.saveSession();

      // Clear any remaining resources
      this.contextItems.clear();

      logger.info('Advanced Context Retention System shutdown complete');
    } catch (error) {
      logger.error('Error during system shutdown', { error });
    }
  }

  /**
   * Start automatic optimization
   */
  private startAutoOptimization(): void {
    if (this.autoOptimizationTimer) {
      return;
    }

    const intervalMs = this.config.autoOptimizationInterval * 60 * 1000;
    this.autoOptimizationTimer = setInterval(async () => {
      try {
        logger.debug('Running scheduled optimization');
        await this.optimize();
      } catch (error) {
        logger.warn('Scheduled optimization failed', { error });
      }
    }, intervalMs);

    logger.debug(
      `Auto-optimization scheduled every ${this.config.autoOptimizationInterval} minutes`,
    );
  }

  /**
   * Stop automatic optimization
   */
  private stopAutoOptimization(): void {
    if (this.autoOptimizationTimer) {
      clearInterval(this.autoOptimizationTimer);
      this.autoOptimizationTimer = undefined;
      logger.debug('Auto-optimization stopped');
    }
  }

  /**
   * Prune old context items when limit exceeded
   */
  private async pruneOldContext(): Promise<void> {
    const itemsArray = Array.from(this.contextItems.values());

    // Sort by last accessed time
    const sortedItems = itemsArray.sort(
      (a, b) => a.lastAccessed.getTime() - b.lastAccessed.getTime(),
    );

    // Remove oldest items to get under limit
    const itemsToRemove = sortedItems.slice(
      0,
      this.contextItems.size - this.config.maxContextItems,
    );

    for (const item of itemsToRemove) {
      this.contextItems.delete(item.id);
    }

    logger.debug(`Pruned ${itemsToRemove.length} old context items`);
  }

  /**
   * Generate unique context ID
   */
  private generateContextId(): string {
    return `ctx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Estimate token count for content
   */
  private estimateTokenCount(content: string): number {
    // Simple estimation: ~4 characters per token
    return Math.ceil(content.length / 4);
  }

  /**
   * Extract tags from content
   */
  private extractTags(content: string): string[] {
    const tags: string[] = [];

    // Extract file extensions
    const extensionMatch = content.match(
      /\.(js|ts|jsx|tsx|py|java|go|rs|c|cpp|h|php|rb|swift|kt|cs)\b/g,
    );
    if (extensionMatch) {
      tags.push(...extensionMatch.map((ext) => ext.substring(1))); // Remove leading dot
    }

    // Extract common keywords
    const keywords = [
      'function',
      'class',
      'interface',
      'type',
      'import',
      'export',
      'const',
      'let',
      'var',
    ];
    for (const keyword of keywords) {
      if (content.toLowerCase().includes(keyword)) {
        tags.push(keyword);
      }
    }

    return Array.from(new Set(tags)); // Remove duplicates
  }

  /**
   * Map context type to window section
   */
  private mapTypeToSection(
    type: string,
  ): keyof import('./types.js').ContextSections {
    const mapping: Record<string, keyof import('./types.js').ContextSections> =
      {
        code: 'code',
        conversation: 'conversation',
        file: 'code',
        'project-state': 'project',
        error: 'system',
        system: 'system',
        'user-preference': 'system',
      };

    return mapping[type] || 'project';
  }

  /**
   * Get current context summary
   */
  private getCurrentContextSummary(): string {
    const items = Array.from(this.contextItems.values());
    const recentItems = items
      .sort((a, b) => b.lastAccessed.getTime() - a.lastAccessed.getTime())
      .slice(0, 10);

    return recentItems
      .map((item) => `${item.type}: ${item.content.substring(0, 100)}`)
      .join('\n');
  }

  /**
   * Generate conversation summary
   */
  private generateConversationSummary(): string {
    const conversationItems = Array.from(this.contextItems.values())
      .filter((item) => item.type.toString() === 'conversation')
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    if (conversationItems.length === 0) {
      return 'No conversation context available';
    }

    return conversationItems
      .map((item) => item.content.substring(0, 200))
      .join(' ');
  }

  /**
   * Extract user preferences from context
   */
  private extractUserPreferences(): Record<string, unknown> {
    const preferences: Record<string, unknown> = {};

    const preferenceItems = Array.from(this.contextItems.values()).filter(
      (item) => item.type.toString() === 'user-preference',
    );

    for (const item of preferenceItems) {
      try {
        const parsed = JSON.parse(item.content);
        Object.assign(preferences, parsed);
      } catch {
        // If not JSON, store as simple key-value
        preferences[item.id] = item.content;
      }
    }

    return preferences;
  }
}

/**
 * Create an Advanced Context Retention System instance
 */
export async function createAdvancedContextRetentionSystem(
  config: Partial<AdvancedContextRetentionConfig> = {},
): Promise<AdvancedContextRetentionSystem> {
  return AdvancedContextRetentionSystem.create(config);
}
