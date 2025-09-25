/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Auto-Compression Management System
 * Automatically handles context compression when approaching token limits
 *
 * Addresses the 1,272,932 → 1,048,576 token limit issue by proactively
 * compressing context before hitting API limits.
 *
 * @author Claude Code - Auto-Compression Implementation Agent
 * @version 1.0.0
 */

import { getComponentLogger } from '../utils/logger.js';
import { SemanticCompressor } from './SemanticCompressor.js';
import type { ContextWindowManager } from './ContextWindowManager.js';
import { CompressionStrategy } from './types.js';
import EventEmitter from 'node:events';
import { performance } from 'node:perf_hooks';

const logger = getComponentLogger('auto-compression-manager');

/**
 * Configuration options for auto-compression
 */
export interface AutoCompressionConfig {
  /** Maximum tokens before hard limit (default: 1,048,576) */
  maxTokenLimit: number;

  /** Compression trigger threshold as ratio of maxTokenLimit (default: 0.85 = 850K tokens) */
  compressionThreshold: number;

  /** Emergency compression threshold as ratio of maxTokenLimit (default: 0.95 = 950K tokens) */
  emergencyThreshold: number;

  /** Target compression ratio when triggered (default: 0.7 = 70% of original size) */
  targetCompressionRatio: number;

  /** How often to check token usage in ms (default: 30000 = 30 seconds) */
  monitoringInterval: number;

  /** Enable automatic compression (default: true) */
  enableAutoCompression: boolean;

  /** Enable emergency compression (default: true) */
  enableEmergencyCompression: boolean;

  /** Minimum time between compression attempts in ms (default: 60000 = 1 minute) */
  minCompressionInterval: number;

  /** Maximum compression attempts per session (default: 5) */
  maxCompressionAttempts: number;

  /** Compression strategy priorities */
  compressionStrategies: CompressionStrategyPriority[];
}

/**
 * Compression strategy priority configuration
 */
export interface CompressionStrategyPriority {
  strategy: CompressionStrategy;
  priority: number; // 1-10, higher = more preferred
  tokenThreshold: number; // Apply this strategy above this token count
}

/**
 * Auto-compression event types
 */
export enum AutoCompressionEvent {
  THRESHOLD_REACHED = 'threshold_reached',
  COMPRESSION_STARTED = 'compression_started',
  COMPRESSION_COMPLETED = 'compression_completed',
  COMPRESSION_FAILED = 'compression_failed',
  EMERGENCY_COMPRESSION = 'emergency_compression',
  TOKEN_LIMIT_WARNING = 'token_limit_warning',
  TOKEN_LIMIT_EXCEEDED = 'token_limit_exceeded',
}

/**
 * Compression attempt result
 */
export interface CompressionResult {
  success: boolean;
  originalTokens: number;
  compressedTokens: number;
  compressionRatio: number;
  strategy: CompressionStrategy;
  duration: number;
  error?: Error;
  itemsCompressed: number;
  itemsRemoved: number;
}

/**
 * Token usage snapshot
 */
export interface TokenUsageSnapshot {
  timestamp: Date;
  totalTokens: number;
  utilizationRatio: number;
  sectionsBreakdown: Record<string, number>;
  compressionOpportunities: CompressionOpportunity[];
  projectedGrowth: number; // Estimated tokens per minute based on trend
}

/**
 * Compression opportunity analysis
 */
export interface CompressionOpportunity {
  section: string;
  currentTokens: number;
  estimatedSavings: number;
  recommendedStrategy: CompressionStrategy;
  confidence: number; // 0-1
}

/**
 * Default configuration
 */
export const DEFAULT_AUTO_COMPRESSION_CONFIG: AutoCompressionConfig = {
  maxTokenLimit: 1048576, // 1M tokens - Claude API limit
  compressionThreshold: 0.85, // Start compression at 850K tokens
  emergencyThreshold: 0.95, // Emergency compression at 950K tokens
  targetCompressionRatio: 0.65, // Compress to 65% of original size
  monitoringInterval: 30000, // Check every 30 seconds
  enableAutoCompression: true,
  enableEmergencyCompression: true,
  minCompressionInterval: 60000, // 1 minute between attempts
  maxCompressionAttempts: 5,
  compressionStrategies: [
    {
      strategy: CompressionStrategy.PROGRESSIVE_DETAIL,
      priority: 10,
      tokenThreshold: 0,
    },
    {
      strategy: CompressionStrategy.SEMANTIC_CLUSTERING,
      priority: 8,
      tokenThreshold: 100000,
    },
    {
      strategy: CompressionStrategy.SUMMARIZATION,
      priority: 6,
      tokenThreshold: 200000,
    },
    {
      strategy: CompressionStrategy.KEYWORD_EXTRACTION,
      priority: 4,
      tokenThreshold: 500000,
    },
  ],
};

/**
 * Auto-Compression Management System
 *
 * The AutoCompressionManager monitors total context token usage across all
 * sessions and automatically triggers compression when approaching limits.
 *
 * Key Features:
 * - Continuous Token Monitoring: Tracks usage across all context windows
 * - Predictive Compression: Triggers compression before hitting limits
 * - Multi-Strategy Compression: Uses different strategies based on content type
 * - Emergency Handling: Aggressive compression when near hard limits
 * - Graceful Degradation: Fallback mechanisms when compression fails
 * - Performance Monitoring: Tracks compression effectiveness
 *
 * @example
 * ```typescript
 * const manager = new AutoCompressionManager();
 * manager.start();
 *
 * // Listen for events
 * manager.on(AutoCompressionEvent.COMPRESSION_STARTED, (data) => {
 *   console.log(`Starting compression: ${data.totalTokens} tokens`);
 * });
 * ```
 */
export class AutoCompressionManager extends EventEmitter {
  private config: AutoCompressionConfig;
  private compressor: SemanticCompressor;
  private contextManagers: Map<string, ContextWindowManager> = new Map();
  private tokenUsageHistory: TokenUsageSnapshot[] = [];
  private lastCompressionTime = 0;
  private compressionAttempts = 0;
  private monitoringTimer: NodeJS.Timer | null = null;
  private isCompressing = false;
  private totalTokensCache = 0;
  private lastCacheUpdate = 0;

  constructor(config: Partial<AutoCompressionConfig> = {}) {
    super();
    this.config = { ...DEFAULT_AUTO_COMPRESSION_CONFIG, ...config };
    this.compressor = new SemanticCompressor();

    // Set up event handlers
    this.setMaxListeners(50);

    logger.info('AutoCompressionManager initialized', {
      maxTokenLimit: this.config.maxTokenLimit,
      compressionThreshold: this.config.compressionThreshold,
      enableAutoCompression: this.config.enableAutoCompression,
    });
  }

  /**
   * Start automatic compression monitoring
   */
  start(): void {
    if (this.monitoringTimer) {
      logger.warn('AutoCompressionManager already started');
      return;
    }

    if (!this.config.enableAutoCompression) {
      logger.info('Auto-compression disabled in configuration');
      return;
    }

    logger.info('Starting auto-compression monitoring', {
      interval: this.config.monitoringInterval,
      threshold: this.config.compressionThreshold,
    });

    this.monitoringTimer = setInterval(
      () => this.checkTokenUsage(),
      this.config.monitoringInterval,
    );

    // Initial check
    this.checkTokenUsage();
  }

  /**
   * Stop automatic compression monitoring
   */
  stop(): void {
    if (this.monitoringTimer) {
      clearInterval(this.monitoringTimer);
      this.monitoringTimer = null;
    }
    logger.info('AutoCompressionManager stopped');
  }

  /**
   * Register a context window manager for monitoring
   */
  registerContextManager(
    id: string,
    manager: ContextWindowManager,
  ): void {
    this.contextManagers.set(id, manager);
    logger.debug(`Registered context manager: ${id}`);
  }

  /**
   * Unregister a context window manager
   */
  unregisterContextManager(id: string): void {
    this.contextManagers.delete(id);
    logger.debug(`Unregistered context manager: ${id}`);
  }

  /**
   * Manually trigger compression
   */
  async triggerCompression(force = false): Promise<CompressionResult> {
    const snapshot = this.captureTokenUsageSnapshot();

    if (!force && !this.shouldCompress(snapshot)) {
      return {
        success: false,
        originalTokens: snapshot.totalTokens,
        compressedTokens: snapshot.totalTokens,
        compressionRatio: 1.0,
        strategy: CompressionStrategy.PROGRESSIVE_DETAIL,
        duration: 0,
        error: new Error('Compression not needed'),
        itemsCompressed: 0,
        itemsRemoved: 0,
      };
    }

    return this.performCompression(snapshot, false);
  }

  /**
   * Get current token usage statistics
   */
  getTokenUsage(): TokenUsageSnapshot {
    return this.captureTokenUsageSnapshot();
  }

  /**
   * Get compression history and statistics
   */
  getCompressionHistory(): {
    attempts: number;
    lastCompressionTime: Date | null;
    averageCompressionRatio: number;
    totalTokensSaved: number;
    history: TokenUsageSnapshot[];
  } {
    const history = this.tokenUsageHistory;
    const compressionEvents = history.filter(
      (s) => s.timestamp.getTime() > this.lastCompressionTime,
    );

    const averageRatio =
      compressionEvents.length > 0
        ? compressionEvents.reduce((sum, s) => sum + s.utilizationRatio, 0) /
          compressionEvents.length
        : 1.0;

    const totalSaved = compressionEvents.reduce((sum, s, idx, arr) => {
      if (idx > 0) {
        return sum + Math.max(0, arr[idx - 1].totalTokens - s.totalTokens);
      }
      return sum;
    }, 0);

    return {
      attempts: this.compressionAttempts,
      lastCompressionTime:
        this.lastCompressionTime > 0
          ? new Date(this.lastCompressionTime)
          : null,
      averageCompressionRatio: averageRatio,
      totalTokensSaved: totalSaved,
      history: history.slice(-50), // Keep last 50 snapshots
    };
  }

  /**
   * Check current token usage and trigger compression if needed
   */
  private async checkTokenUsage(): Promise<void> {
    try {
      const snapshot = this.captureTokenUsageSnapshot();
      this.addToUsageHistory(snapshot);

      // Emit warnings at different thresholds
      if (snapshot.utilizationRatio >= this.config.emergencyThreshold) {
        this.emit(AutoCompressionEvent.TOKEN_LIMIT_WARNING, {
          level: 'critical',
          totalTokens: snapshot.totalTokens,
          utilizationRatio: snapshot.utilizationRatio,
          threshold: this.config.emergencyThreshold,
        });
      } else if (
        snapshot.utilizationRatio >= this.config.compressionThreshold
      ) {
        this.emit(AutoCompressionEvent.TOKEN_LIMIT_WARNING, {
          level: 'warning',
          totalTokens: snapshot.totalTokens,
          utilizationRatio: snapshot.utilizationRatio,
          threshold: this.config.compressionThreshold,
        });
      }

      // Trigger compression if needed
      if (this.shouldCompress(snapshot)) {
        await this.performCompression(
          snapshot,
          snapshot.utilizationRatio >= this.config.emergencyThreshold,
        );
      }
    } catch (error) {
      logger.error('Error during token usage check', { error });
    }
  }

  /**
   * Capture current token usage across all context managers
   */
  private captureTokenUsageSnapshot(): TokenUsageSnapshot {
    const now = Date.now();

    // Use cache if recent enough (< 5 seconds old)
    if (now - this.lastCacheUpdate < 5000 && this.totalTokensCache > 0) {
      const utilizationRatio =
        this.totalTokensCache / this.config.maxTokenLimit;
      return {
        timestamp: new Date(),
        totalTokens: this.totalTokensCache,
        utilizationRatio,
        sectionsBreakdown: {},
        compressionOpportunities: [],
        projectedGrowth: this.calculateGrowthRate(),
      };
    }

    let totalTokens = 0;
    const sectionsBreakdown: Record<string, number> = {};
    const compressionOpportunities: CompressionOpportunity[] = [];

    for (const [managerId, manager] of this.contextManagers.entries()) {
      const window = manager.getCurrentWindow();
      totalTokens += window.usedTokens;

      // Collect section breakdown
      for (const [sectionName, section] of Object.entries(window.sections)) {
        const key = `${managerId}:${sectionName}`;
        sectionsBreakdown[key] = section.tokens;

        // Analyze compression opportunities
        if (section.tokens > 1000) {
          // Worth compressing if > 1K tokens
          compressionOpportunities.push({
            section: key,
            currentTokens: section.tokens,
            estimatedSavings: Math.floor(section.tokens * 0.4), // Estimate 40% savings
            recommendedStrategy: this.selectOptimalStrategy(section),
            confidence: this.calculateCompressionConfidence(section),
          });
        }
      }
    }

    this.totalTokensCache = totalTokens;
    this.lastCacheUpdate = now;

    const utilizationRatio = totalTokens / this.config.maxTokenLimit;
    const projectedGrowth = this.calculateGrowthRate();

    return {
      timestamp: new Date(),
      totalTokens,
      utilizationRatio,
      sectionsBreakdown,
      compressionOpportunities,
      projectedGrowth,
    };
  }

  /**
   * Calculate token growth rate based on recent history
   */
  private calculateGrowthRate(): number {
    if (this.tokenUsageHistory.length < 2) return 0;

    const recent = this.tokenUsageHistory.slice(-5); // Last 5 measurements
    if (recent.length < 2) return 0;

    let totalGrowth = 0;
    let timeSpan = 0;

    for (let i = 1; i < recent.length; i++) {
      const tokenDelta = recent[i].totalTokens - recent[i - 1].totalTokens;
      const timeDelta =
        recent[i].timestamp.getTime() - recent[i - 1].timestamp.getTime();

      if (timeDelta > 0) {
        totalGrowth += tokenDelta;
        timeSpan += timeDelta;
      }
    }

    if (timeSpan === 0) return 0;

    // Return tokens per minute
    return (totalGrowth / timeSpan) * (60 * 1000);
  }

  /**
   * Determine if compression should be triggered
   */
  private shouldCompress(snapshot: TokenUsageSnapshot): boolean {
    // Don't compress if already compressing
    if (this.isCompressing) {
      return false;
    }

    // Don't compress too frequently
    const timeSinceLastCompression = Date.now() - this.lastCompressionTime;
    if (timeSinceLastCompression < this.config.minCompressionInterval) {
      return false;
    }

    // Don't compress if we've exceeded max attempts
    if (this.compressionAttempts >= this.config.maxCompressionAttempts) {
      logger.warn('Maximum compression attempts reached', {
        attempts: this.compressionAttempts,
        maxAttempts: this.config.maxCompressionAttempts,
      });
      return false;
    }

    // Check thresholds
    if (snapshot.utilizationRatio >= this.config.emergencyThreshold) {
      logger.warn('Emergency compression threshold reached', {
        utilizationRatio: snapshot.utilizationRatio,
        threshold: this.config.emergencyThreshold,
      });
      return true;
    }

    if (snapshot.utilizationRatio >= this.config.compressionThreshold) {
      // Also consider growth rate for predictive compression
      const minutesUntilLimit =
        snapshot.projectedGrowth > 0
          ? (this.config.maxTokenLimit - snapshot.totalTokens) /
            snapshot.projectedGrowth
          : Infinity;

      if (minutesUntilLimit <= 30) {
        // Will hit limit in 30 minutes
        logger.info('Predictive compression triggered', {
          currentTokens: snapshot.totalTokens,
          projectedGrowth: snapshot.projectedGrowth,
          minutesUntilLimit,
        });
        return true;
      }

      return true;
    }

    return false;
  }

  /**
   * Perform compression operation
   */
  private async performCompression(
    snapshot: TokenUsageSnapshot,
    isEmergency: boolean,
  ): Promise<CompressionResult> {
    const startTime = performance.now();
    this.isCompressing = true;
    this.compressionAttempts++;

    const eventType = isEmergency
      ? AutoCompressionEvent.EMERGENCY_COMPRESSION
      : AutoCompressionEvent.COMPRESSION_STARTED;

    this.emit(eventType, {
      totalTokens: snapshot.totalTokens,
      utilizationRatio: snapshot.utilizationRatio,
      isEmergency,
      attempt: this.compressionAttempts,
    });

    try {
      let totalOriginalTokens = 0;
      let totalCompressedTokens = 0;
      let itemsCompressed = 0;
      let itemsRemoved = 0;

      // Sort compression opportunities by potential savings
      const opportunities = snapshot.compressionOpportunities.sort(
        (a, b) => b.estimatedSavings - a.estimatedSavings,
      );

      // Determine target compression ratio (more aggressive for emergency)
      const targetRatio = isEmergency
        ? this.config.targetCompressionRatio * 0.8 // More aggressive
        : this.config.targetCompressionRatio;

      // Compress sections with highest savings potential
      for (const opportunity of opportunities) {
        const [managerId, sectionName] = opportunity.section.split(':');
        const manager = this.contextManagers.get(managerId);

        if (!manager) continue;

        const window = manager.getCurrentWindow();
        const section = window.sections[sectionName];

        if (!section || section.items.length === 0) continue;

        // Apply compression to this section
        const compressionResult = await this.compressor.batchCompress(
          section.items,
          targetRatio,
        );

        // Update section with compressed items
        for (const [itemId, result] of compressionResult.entries()) {
          const itemIndex = section.items.findIndex(
            (item) => item.id === itemId,
          );
          if (itemIndex !== -1) {
            const originalItem = section.items[itemIndex];
            totalOriginalTokens += originalItem.tokenCount;

            if (result.compressedTokens < originalItem.tokenCount) {
              // Replace with compressed version
              section.items[itemIndex] = {
                ...originalItem,
                content: result.compressed,
                tokenCount: result.compressedTokens,
              };
              totalCompressedTokens += result.compressedTokens;
              itemsCompressed++;
            } else {
              // Compression didn't help, remove item if emergency
              if (isEmergency && section.items.length > 1) {
                section.items.splice(itemIndex, 1);
                itemsRemoved++;
              } else {
                totalCompressedTokens += result.compressedTokens;
              }
            }
          }
        }

        // Recalculate section totals
        section.tokens = section.items.reduce(
          (sum, item) => sum + item.tokenCount,
          0,
        );
        section.content = section.items.map((item) => item.content).join('\n');

        // Update manager totals
        manager['updateContextWindowTotals'](); // Call private method
      }

      const duration = performance.now() - startTime;
      const compressionRatio =
        totalOriginalTokens > 0
          ? totalCompressedTokens / totalOriginalTokens
          : 1.0;

      const result: CompressionResult = {
        success: true,
        originalTokens: totalOriginalTokens,
        compressedTokens: totalCompressedTokens,
        compressionRatio,
        strategy: CompressionStrategy.PROGRESSIVE_DETAIL, // Mixed strategy not defined in enum
        duration,
        itemsCompressed,
        itemsRemoved,
      };

      this.lastCompressionTime = Date.now();
      this.totalTokensCache = 0; // Force cache refresh

      this.emit(AutoCompressionEvent.COMPRESSION_COMPLETED, {
        ...result,
        newTotalTokens: this.captureTokenUsageSnapshot().totalTokens,
      });

      logger.info('Compression completed successfully', {
        originalTokens: totalOriginalTokens,
        compressedTokens: totalCompressedTokens,
        compressionRatio: compressionRatio.toFixed(3),
        duration: duration.toFixed(2),
        itemsCompressed,
        itemsRemoved,
        isEmergency,
      });

      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      const result: CompressionResult = {
        success: false,
        originalTokens: snapshot.totalTokens,
        compressedTokens: snapshot.totalTokens,
        compressionRatio: 1.0,
        strategy: CompressionStrategy.PROGRESSIVE_DETAIL,
        duration,
        error: error as Error,
        itemsCompressed: 0,
        itemsRemoved: 0,
      };

      this.emit(AutoCompressionEvent.COMPRESSION_FAILED, {
        ...result,
        error: error instanceof Error ? error.message : String(error),
      });

      logger.error('Compression failed', {
        error,
        totalTokens: snapshot.totalTokens,
        duration: duration.toFixed(2),
        isEmergency,
      });

      return result;
    } finally {
      this.isCompressing = false;
    }
  }

  /**
   * Select optimal compression strategy for a section
   */
  private selectOptimalStrategy(section: {
    tokens: number;
    name?: string;
  }): CompressionStrategy {
    const strategies = this.config.compressionStrategies
      .filter((s) => section.tokens >= s.tokenThreshold)
      .sort((a, b) => b.priority - a.priority);

    return strategies.length > 0
      ? strategies[0].strategy
      : CompressionStrategy.PROGRESSIVE_DETAIL;
  }

  /**
   * Calculate confidence score for compression potential
   */
  private calculateCompressionConfidence(section: {
    tokens: number;
    items?: unknown[];
    name?: string;
  }): number {
    let confidence = 0.5; // Base confidence

    // Higher confidence for sections with repetitive content
    if (section.items && section.items.length > 5) {
      confidence += 0.2;
    }

    // Higher confidence for large sections
    if (section.tokens > 10000) {
      confidence += 0.2;
    }

    // Lower confidence for code sections (harder to compress)
    if (section.name === 'code') {
      confidence -= 0.1;
    }

    return Math.max(0.1, Math.min(1.0, confidence));
  }

  /**
   * Add snapshot to usage history
   */
  private addToUsageHistory(snapshot: TokenUsageSnapshot): void {
    this.tokenUsageHistory.push(snapshot);

    // Keep only last 100 snapshots
    if (this.tokenUsageHistory.length > 100) {
      this.tokenUsageHistory.shift();
    }
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<AutoCompressionConfig>): void {
    const oldConfig = { ...this.config };
    this.config = { ...this.config, ...newConfig };

    logger.info('AutoCompressionManager configuration updated', {
      oldConfig,
      newConfig: this.config,
    });

    // Restart monitoring if interval changed
    if (newConfig.monitoringInterval && this.monitoringTimer) {
      this.stop();
      this.start();
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): AutoCompressionConfig {
    return { ...this.config };
  }
}

/**
 * Global singleton instance for efficient resource usage
 */
let globalAutoCompressionManager: AutoCompressionManager | null = null;

/**
 * Get or create the global AutoCompressionManager instance
 */
export function getGlobalAutoCompressionManager(
  config?: Partial<AutoCompressionConfig>,
): AutoCompressionManager {
  if (!globalAutoCompressionManager) {
    globalAutoCompressionManager = new AutoCompressionManager(config);
  }
  return globalAutoCompressionManager;
}

/**
 * Reset the global manager (mainly for testing)
 */
export function resetGlobalAutoCompressionManager(): void {
  if (globalAutoCompressionManager) {
    globalAutoCompressionManager.stop();
    globalAutoCompressionManager = null;
  }
}
