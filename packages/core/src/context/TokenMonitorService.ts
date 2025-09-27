/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Token Monitoring Service
 * Real-time tracking of token usage across all context windows and sessions
 *
 * Provides comprehensive monitoring for the auto-compression system to detect
 * when token limits are being approached and trigger appropriate responses.
 *
 * @author Claude Code - Auto-Compression Implementation Agent
 * @version 1.0.0
 */

import { getComponentLogger } from '../utils/logger.js';
import type { ContextWindowManager } from './ContextWindowManager.js';
import EventEmitter from 'node:events';
import { performance } from 'node:perf_hooks';

const logger = getComponentLogger('token-monitor-service');

/**
 * Configuration for token monitoring
 */
export interface TokenMonitorConfig {
  /** How often to check token usage in ms (default: 10000 = 10 seconds) */
  checkInterval: number;

  /** Enable high-frequency monitoring during critical periods */
  enableHighFrequencyMode: boolean;

  /** High frequency check interval in ms (default: 2000 = 2 seconds) */
  highFrequencyInterval: number;

  /** Threshold to enter high-frequency mode (default: 0.8 = 80%) */
  highFrequencyThreshold: number;

  /** Token limits and warning thresholds */
  thresholds: TokenThresholds;

  /** Enable detailed breakdown tracking */
  enableDetailedTracking: boolean;

  /** History retention settings */
  retention: RetentionConfig;
}

/**
 * Token threshold configuration
 */
export interface TokenThresholds {
  /** Absolute maximum token limit */
  maxTokens: number;

  /** Warning levels and their thresholds (as ratios of maxTokens) */
  warnings: {
    info: number; // 0.7 = 70%
    warning: number; // 0.8 = 80%
    critical: number; // 0.9 = 90%
    emergency: number; // 0.95 = 95%
  };

  /** Compression trigger points */
  compressionTriggers: {
    soft: number; // 0.75 = 75%
    aggressive: number; // 0.85 = 85%
    emergency: number; // 0.95 = 95%
  };
}

/**
 * Retention configuration for monitoring data
 */
export interface RetentionConfig {
  /** How long to keep detailed snapshots (ms) */
  detailedSnapshotRetention: number;

  /** How long to keep summary statistics (ms) */
  summaryRetention: number;

  /** Maximum number of snapshots to keep in memory */
  maxSnapshots: number;

  /** Maximum number of events to keep in memory */
  maxEvents: number;
}

/**
 * Token usage snapshot with detailed breakdown
 */
export interface TokenUsageSnapshot {
  /** Snapshot timestamp */
  timestamp: Date;

  /** Total tokens across all contexts */
  totalTokens: number;

  /** Token usage by context manager */
  byManager: Record<string, ManagerTokenUsage>;

  /** Token usage by content type */
  byType: Record<string, number>;

  /** Token usage by priority level */
  byPriority: Record<string, number>;

  /** Current utilization ratio (0-1) */
  utilizationRatio: number;

  /** Growth rate (tokens per minute) */
  growthRate: number;

  /** Projected time until limit (minutes) */
  timeUntilLimit: number;

  /** Context window efficiency metrics */
  efficiency: EfficiencyMetrics;
}

/**
 * Token usage for a specific context manager
 */
export interface ManagerTokenUsage {
  /** Manager identifier */
  managerId: string;

  /** Total tokens in this manager */
  totalTokens: number;

  /** Token usage by section */
  sections: Record<string, SectionTokenUsage>;

  /** Window configuration */
  windowConfig: {
    maxTokens: number;
    usedTokens: number;
    availableTokens: number;
  };

  /** Performance metrics */
  performance: {
    compressionRatio: number;
    accessFrequency: number;
    lastOptimization: Date | null;
  };
}

/**
 * Section-level token usage
 */
export interface SectionTokenUsage {
  /** Section name */
  sectionName: string;

  /** Current token count */
  tokens: number;

  /** Maximum allowed tokens */
  maxTokens: number;

  /** Number of items in section */
  itemCount: number;

  /** Average tokens per item */
  avgTokensPerItem: number;

  /** Utilization ratio for this section */
  utilization: number;

  /** Compression potential estimate */
  compressionPotential: number;
}

/**
 * Context window efficiency metrics
 */
export interface EfficiencyMetrics {
  /** Overall token utilization efficiency (0-1) */
  overallUtilization: number;

  /** Wasted tokens due to fragmentation */
  wastedTokens: number;

  /** Compression effectiveness (0-1) */
  compressionEffectiveness: number;

  /** Context relevance score (0-1) */
  relevanceScore: number;

  /** Access pattern efficiency (0-1) */
  accessEfficiency: number;
}

/**
 * Token monitoring event
 */
export interface TokenMonitorEvent {
  /** Event type */
  type: TokenEventType;

  /** Event timestamp */
  timestamp: Date;

  /** Current token usage snapshot */
  snapshot: TokenUsageSnapshot;

  /** Event-specific data */
  data: Record<string, unknown>;

  /** Event severity level */
  severity: 'info' | 'warning' | 'critical' | 'emergency';

  /** Human-readable message */
  message: string;
}

/**
 * Token monitoring event types
 */
export enum TokenEventType {
  THRESHOLD_CROSSED = 'threshold_crossed',
  GROWTH_SPIKE = 'growth_spike',
  EFFICIENCY_DROP = 'efficiency_drop',
  COMPRESSION_NEEDED = 'compression_needed',
  LIMIT_APPROACHING = 'limit_approaching',
  CRITICAL_USAGE = 'critical_usage',
  EMERGENCY_STATE = 'emergency_state',
  OPTIMIZATION_OPPORTUNITY = 'optimization_opportunity',
}

/**
 * Default configuration
 */
export const DEFAULT_TOKEN_MONITOR_CONFIG: TokenMonitorConfig = {
  checkInterval: 10000, // 10 seconds
  enableHighFrequencyMode: true,
  highFrequencyInterval: 2000, // 2 seconds
  highFrequencyThreshold: 0.8,
  thresholds: {
    maxTokens: 1048576, // 1M tokens
    warnings: {
      info: 0.7,
      warning: 0.8,
      critical: 0.9,
      emergency: 0.95,
    },
    compressionTriggers: {
      soft: 0.75,
      aggressive: 0.85,
      emergency: 0.95,
    },
  },
  enableDetailedTracking: true,
  retention: {
    detailedSnapshotRetention: 60 * 60 * 1000, // 1 hour
    summaryRetention: 24 * 60 * 60 * 1000, // 24 hours
    maxSnapshots: 1000,
    maxEvents: 500,
  },
};

/**
 * Token Monitoring Service
 *
 * The TokenMonitorService provides comprehensive real-time monitoring of token
 * usage across all context windows and sessions. It detects when limits are
 * being approached and emits events to trigger compression or other responses.
 *
 * Key Features:
 * - Real-time Token Tracking: Continuous monitoring of total token usage
 * - Adaptive Monitoring: Higher frequency monitoring during critical periods
 * - Growth Rate Analysis: Predicts when limits will be reached
 * - Efficiency Tracking: Monitors context window utilization effectiveness
 * - Event-based Notifications: Emits events for threshold crossings and alerts
 * - Detailed Breakdowns: Tracks usage by manager, section, type, and priority
 *
 * @example
 * ```typescript
 * const monitor = new TokenMonitorService();
 * monitor.registerContextManager('main', contextManager);
 * monitor.start();
 *
 * monitor.on(TokenEventType.COMPRESSION_NEEDED, (event) => {
 *   console.log(`Compression needed: ${event.message}`);
 *   triggerCompression(event.snapshot);
 * });
 * ```
 */
export class TokenMonitorService extends EventEmitter {
  private config: TokenMonitorConfig;
  private contextManagers: Map<string, ContextWindowManager> = new Map();
  private usageHistory: TokenUsageSnapshot[] = [];
  private eventHistory: TokenMonitorEvent[] = [];
  private monitoringTimer: NodeJS.Timeout | null = null;
  private isHighFrequencyMode = false;
  private lastThresholdLevel: string | null = null;
  private performanceCounters = {
    totalChecks: 0,
    totalEvents: 0,
    lastCheckDuration: 0,
    averageCheckDuration: 0,
  };

  constructor(config: Partial<TokenMonitorConfig> = {}) {
    super();
    this.config = { ...DEFAULT_TOKEN_MONITOR_CONFIG, ...config };
    this.setMaxListeners(100);

    logger.info('TokenMonitorService initialized', {
      checkInterval: this.config.checkInterval,
      maxTokens: this.config.thresholds.maxTokens,
      enableDetailedTracking: this.config.enableDetailedTracking,
    });
  }

  /**
   * Start token monitoring
   */
  start(): void {
    if (this.monitoringTimer) {
      logger.warn('TokenMonitorService already started');
      return;
    }

    logger.info('Starting token monitoring service');
    this.scheduleNextCheck();

    // Initial check
    this.performMonitoringCheck();
  }

  /**
   * Stop token monitoring
   */
  stop(): void {
    if (this.monitoringTimer) {
      clearTimeout(this.monitoringTimer);
      this.monitoringTimer = null;
    }
    logger.info('TokenMonitorService stopped');
  }

  /**
   * Register a context manager for monitoring
   */
  registerContextManager(id: string, manager: ContextWindowManager): void {
    this.contextManagers.set(id, manager);
    logger.debug(`Registered context manager for monitoring: ${id}`);

    // Immediately check if this changes our monitoring needs
    if (this.monitoringTimer) {
      this.performMonitoringCheck();
    }
  }

  /**
   * Unregister a context manager
   */
  unregisterContextManager(id: string): void {
    this.contextManagers.delete(id);
    logger.debug(`Unregistered context manager: ${id}`);
  }

  /**
   * Get current token usage snapshot
   */
  getCurrentUsage(): TokenUsageSnapshot {
    return this.captureUsageSnapshot();
  }

  /**
   * Get usage history
   */
  getUsageHistory(limit = 100): TokenUsageSnapshot[] {
    return this.usageHistory.slice(-limit);
  }

  /**
   * Get event history
   */
  getEventHistory(limit = 50): TokenMonitorEvent[] {
    return this.eventHistory.slice(-limit);
  }

  /**
   * Get monitoring statistics
   */
  getMonitoringStats(): {
    totalChecks: number;
    totalEvents: number;
    averageCheckDuration: number;
    isHighFrequencyMode: boolean;
    lastThresholdLevel: string | null;
    managersCount: number;
    snapshotsCount: number;
    eventsCount: number;
  } {
    return {
      ...this.performanceCounters,
      isHighFrequencyMode: this.isHighFrequencyMode,
      lastThresholdLevel: this.lastThresholdLevel,
      managersCount: this.contextManagers.size,
      snapshotsCount: this.usageHistory.length,
      eventsCount: this.eventHistory.length,
    };
  }

  /**
   * Manually trigger a monitoring check
   */
  triggerCheck(): TokenUsageSnapshot {
    return this.performMonitoringCheck();
  }

  /**
   * Update monitoring configuration
   */
  updateConfig(newConfig: Partial<TokenMonitorConfig>): void {
    const oldConfig = { ...this.config };
    this.config = { ...this.config, ...newConfig };

    logger.info('TokenMonitorService configuration updated', {
      oldConfig,
      newConfig: this.config,
    });

    // Restart monitoring if interval changed
    if (newConfig.checkInterval && this.monitoringTimer) {
      this.stop();
      this.start();
    }
  }

  /**
   * Perform a monitoring check
   */
  private performMonitoringCheck(): TokenUsageSnapshot {
    const startTime = performance.now();

    try {
      const snapshot = this.captureUsageSnapshot();
      this.addToHistory(snapshot);
      this.analyzeSnapshot(snapshot);
      this.updateMonitoringMode(snapshot);

      const duration = performance.now() - startTime;
      this.updatePerformanceCounters(duration);

      logger.debug('Monitoring check completed', {
        totalTokens: snapshot.totalTokens,
        utilizationRatio: snapshot.utilizationRatio,
        growthRate: snapshot.growthRate,
        checkDuration: duration.toFixed(2),
      });

      return snapshot;
    } catch (error) {
      logger.error('Error during monitoring check', { error });
      throw error;
    } finally {
      this.scheduleNextCheck();
    }
  }

  /**
   * Capture current usage snapshot across all managers
   */
  private captureUsageSnapshot(): TokenUsageSnapshot {
    const timestamp = new Date();
    let totalTokens = 0;
    const byManager: Record<string, ManagerTokenUsage> = {};
    const byType: Record<string, number> = {};
    const byPriority: Record<string, number> = {};

    // Collect data from all context managers
    for (const [managerId, manager] of this.contextManagers.entries()) {
      const window = manager.getCurrentWindow();
      const managerUsage = this.analyzeManagerUsage(managerId, manager);

      totalTokens += window.usedTokens;
      byManager[managerId] = managerUsage;

      // Aggregate by type and priority
      for (const [_sectionName, section] of Object.entries(window.sections)) {
        for (const item of section.items) {
          const type = String(item.type);
          const priority = String(item.priority);

          byType[type] = (byType[type] || 0) + item.tokenCount;
          byPriority[priority] = (byPriority[priority] || 0) + item.tokenCount;
        }
      }
    }

    const utilizationRatio = totalTokens / this.config.thresholds.maxTokens;
    const growthRate = this.calculateGrowthRate();
    const timeUntilLimit =
      growthRate > 0
        ? (this.config.thresholds.maxTokens - totalTokens) / growthRate
        : Infinity;
    const efficiency = this.calculateEfficiencyMetrics(byManager, totalTokens);

    return {
      timestamp,
      totalTokens,
      byManager,
      byType,
      byPriority,
      utilizationRatio,
      growthRate,
      timeUntilLimit,
      efficiency,
    };
  }

  /**
   * Analyze usage for a specific context manager
   */
  private analyzeManagerUsage(
    managerId: string,
    manager: ContextWindowManager,
  ): ManagerTokenUsage {
    const window = manager.getCurrentWindow();
    const sections: Record<string, SectionTokenUsage> = {};

    for (const [sectionName, section] of Object.entries(window.sections)) {
      const avgTokensPerItem =
        section.items.length > 0 ? section.tokens / section.items.length : 0;

      const utilization =
        section.maxTokens > 0 ? section.tokens / section.maxTokens : 0;

      // Estimate compression potential based on content type and current usage
      const compressionPotential = this.estimateCompressionPotential(section);

      sections[sectionName] = {
        sectionName,
        tokens: section.tokens,
        maxTokens: section.maxTokens,
        itemCount: section.items.length,
        avgTokensPerItem,
        utilization,
        compressionPotential,
      };
    }

    return {
      managerId,
      totalTokens: window.usedTokens,
      sections,
      windowConfig: {
        maxTokens: window.totalTokens,
        usedTokens: window.usedTokens,
        availableTokens: window.availableTokens,
      },
      performance: {
        compressionRatio: this.calculateCompressionRatio(window),
        accessFrequency: this.calculateAccessFrequency(window),
        lastOptimization: null, // Would track from manager if available
      },
    };
  }

  /**
   * Estimate compression potential for a section
   */
  private estimateCompressionPotential(section: {
    name: string;
    items: unknown[];
    tokens: number;
  }): number {
    if (section.items.length === 0) return 0;

    let potential = 0.3; // Base potential

    // Higher potential for conversations (summarizable)
    if (section.name === 'conversation') {
      potential += 0.3;
    }

    // Lower potential for code (harder to compress)
    if (section.name === 'code') {
      potential -= 0.1;
    }

    // Higher potential for large sections
    if (section.tokens > 10000) {
      potential += 0.2;
    }

    // Higher potential for repetitive content (many similar items)
    if (section.items.length > 10) {
      potential += 0.1;
    }

    return Math.max(0.1, Math.min(0.8, potential));
  }

  /**
   * Calculate compression ratio for a window
   */
  private calculateCompressionRatio(_window: unknown): number {
    // This would ideally track actual compression history
    // For now, estimate based on utilization and content types
    return 0.7; // Default assumption of 70% compression ratio
  }

  /**
   * Calculate access frequency for a window
   */
  private calculateAccessFrequency(_window: unknown): number {
    // This would ideally track actual access patterns
    // For now, estimate based on recent activity
    return 1.0; // Default assumption of recent activity
  }

  /**
   * Calculate token growth rate based on recent history
   */
  private calculateGrowthRate(): number {
    if (this.usageHistory.length < 2) return 0;

    const recent = this.usageHistory.slice(-5); // Last 5 measurements
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
   * Calculate efficiency metrics
   */
  private calculateEfficiencyMetrics(
    byManager: Record<string, ManagerTokenUsage>,
    _totalTokens: number,
  ): EfficiencyMetrics {
    let totalUtilization = 0;
    let wastedTokens = 0;
    let managerCount = 0;

    for (const manager of Object.values(byManager)) {
      const utilization =
        manager.windowConfig.maxTokens > 0
          ? manager.windowConfig.usedTokens / manager.windowConfig.maxTokens
          : 0;

      totalUtilization += utilization;
      wastedTokens += Math.max(
        0,
        manager.windowConfig.maxTokens - manager.windowConfig.usedTokens,
      );
      managerCount++;
    }

    const overallUtilization =
      managerCount > 0 ? totalUtilization / managerCount : 0;

    return {
      overallUtilization,
      wastedTokens,
      compressionEffectiveness: 0.7, // Would track from actual compression history
      relevanceScore: 0.8, // Would calculate from context relevance
      accessEfficiency: 0.9, // Would calculate from access patterns
    };
  }

  /**
   * Analyze snapshot for events and alerts
   */
  private analyzeSnapshot(snapshot: TokenUsageSnapshot): void {
    // Check threshold crossings
    this.checkThresholdCrossings(snapshot);

    // Check growth rate spikes
    this.checkGrowthSpikes(snapshot);

    // Check efficiency drops
    this.checkEfficiencyDrops(snapshot);

    // Check for optimization opportunities
    this.checkOptimizationOpportunities(snapshot);
  }

  /**
   * Check for threshold crossings
   */
  private checkThresholdCrossings(snapshot: TokenUsageSnapshot): void {
    const thresholds = this.config.thresholds;
    let currentLevel: string | null = null;
    let severity: 'info' | 'warning' | 'critical' | 'emergency' = 'info';

    if (snapshot.utilizationRatio >= thresholds.warnings.emergency) {
      currentLevel = 'emergency';
      severity = 'emergency';
    } else if (snapshot.utilizationRatio >= thresholds.warnings.critical) {
      currentLevel = 'critical';
      severity = 'critical';
    } else if (snapshot.utilizationRatio >= thresholds.warnings.warning) {
      currentLevel = 'warning';
      severity = 'warning';
    } else if (snapshot.utilizationRatio >= thresholds.warnings.info) {
      currentLevel = 'info';
      severity = 'info';
    }

    // Only emit event if threshold level changed
    if (currentLevel && currentLevel !== this.lastThresholdLevel) {
      this.emitEvent({
        type: TokenEventType.THRESHOLD_CROSSED,
        timestamp: new Date(),
        snapshot,
        data: {
          oldLevel: this.lastThresholdLevel,
          newLevel: currentLevel,
          threshold:
            thresholds.warnings[
              currentLevel as keyof typeof thresholds.warnings
            ],
        },
        severity,
        message: `Token usage crossed ${currentLevel} threshold: ${(snapshot.utilizationRatio * 100).toFixed(1)}%`,
      });

      this.lastThresholdLevel = currentLevel;
    }

    // Check compression triggers
    if (snapshot.utilizationRatio >= thresholds.compressionTriggers.emergency) {
      this.emitEvent({
        type: TokenEventType.COMPRESSION_NEEDED,
        timestamp: new Date(),
        snapshot,
        data: {
          compressionType: 'emergency',
          threshold: thresholds.compressionTriggers.emergency,
        },
        severity: 'emergency',
        message: 'Emergency compression needed immediately',
      });
    } else if (
      snapshot.utilizationRatio >= thresholds.compressionTriggers.aggressive
    ) {
      this.emitEvent({
        type: TokenEventType.COMPRESSION_NEEDED,
        timestamp: new Date(),
        snapshot,
        data: {
          compressionType: 'aggressive',
          threshold: thresholds.compressionTriggers.aggressive,
        },
        severity: 'critical',
        message: 'Aggressive compression recommended',
      });
    } else if (
      snapshot.utilizationRatio >= thresholds.compressionTriggers.soft
    ) {
      this.emitEvent({
        type: TokenEventType.COMPRESSION_NEEDED,
        timestamp: new Date(),
        snapshot,
        data: {
          compressionType: 'soft',
          threshold: thresholds.compressionTriggers.soft,
        },
        severity: 'warning',
        message: 'Soft compression recommended',
      });
    }
  }

  /**
   * Check for growth rate spikes
   */
  private checkGrowthSpikes(snapshot: TokenUsageSnapshot): void {
    if (snapshot.growthRate > 10000) {
      // More than 10K tokens per minute
      this.emitEvent({
        type: TokenEventType.GROWTH_SPIKE,
        timestamp: new Date(),
        snapshot,
        data: { growthRate: snapshot.growthRate },
        severity: 'warning',
        message: `High token growth rate detected: ${snapshot.growthRate.toFixed(0)} tokens/minute`,
      });
    }

    // Check time until limit
    if (snapshot.timeUntilLimit < 30 && snapshot.timeUntilLimit > 0) {
      // Less than 30 minutes
      this.emitEvent({
        type: TokenEventType.LIMIT_APPROACHING,
        timestamp: new Date(),
        snapshot,
        data: {
          timeUntilLimit: snapshot.timeUntilLimit,
          growthRate: snapshot.growthRate,
        },
        severity: 'critical',
        message: `Token limit will be reached in ${snapshot.timeUntilLimit.toFixed(1)} minutes`,
      });
    }
  }

  /**
   * Check for efficiency drops
   */
  private checkEfficiencyDrops(snapshot: TokenUsageSnapshot): void {
    if (snapshot.efficiency.overallUtilization < 0.5) {
      // Less than 50% efficiency
      this.emitEvent({
        type: TokenEventType.EFFICIENCY_DROP,
        timestamp: new Date(),
        snapshot,
        data: {
          utilization: snapshot.efficiency.overallUtilization,
          wastedTokens: snapshot.efficiency.wastedTokens,
        },
        severity: 'info',
        message: `Context window efficiency is low: ${(snapshot.efficiency.overallUtilization * 100).toFixed(1)}%`,
      });
    }
  }

  /**
   * Check for optimization opportunities
   */
  private checkOptimizationOpportunities(snapshot: TokenUsageSnapshot): void {
    let totalCompressionPotential = 0;
    let opportunitiesFound = 0;

    for (const manager of Object.values(snapshot.byManager)) {
      for (const section of Object.values(manager.sections)) {
        if (section.compressionPotential > 0.4 && section.tokens > 5000) {
          totalCompressionPotential +=
            section.tokens * section.compressionPotential;
          opportunitiesFound++;
        }
      }
    }

    if (opportunitiesFound > 0 && totalCompressionPotential > 50000) {
      this.emitEvent({
        type: TokenEventType.OPTIMIZATION_OPPORTUNITY,
        timestamp: new Date(),
        snapshot,
        data: {
          potentialSavings: totalCompressionPotential,
          opportunities: opportunitiesFound,
        },
        severity: 'info',
        message: `Found ${opportunitiesFound} optimization opportunities with potential savings of ${totalCompressionPotential.toFixed(0)} tokens`,
      });
    }
  }

  /**
   * Update monitoring mode based on current usage
   */
  private updateMonitoringMode(snapshot: TokenUsageSnapshot): void {
    const shouldBeHighFrequency =
      this.config.enableHighFrequencyMode &&
      snapshot.utilizationRatio >= this.config.highFrequencyThreshold;

    if (shouldBeHighFrequency && !this.isHighFrequencyMode) {
      this.isHighFrequencyMode = true;
      logger.info('Switching to high-frequency monitoring mode', {
        utilizationRatio: snapshot.utilizationRatio,
        threshold: this.config.highFrequencyThreshold,
      });
    } else if (!shouldBeHighFrequency && this.isHighFrequencyMode) {
      this.isHighFrequencyMode = false;
      logger.info('Switching to normal monitoring mode', {
        utilizationRatio: snapshot.utilizationRatio,
      });
    }
  }

  /**
   * Schedule the next monitoring check
   */
  private scheduleNextCheck(): void {
    const interval = this.isHighFrequencyMode
      ? this.config.highFrequencyInterval
      : this.config.checkInterval;

    this.monitoringTimer = setTimeout(() => {
      this.performMonitoringCheck();
    }, interval);
  }

  /**
   * Add snapshot to history with cleanup
   */
  private addToHistory(snapshot: TokenUsageSnapshot): void {
    this.usageHistory.push(snapshot);

    // Cleanup old snapshots
    const cutoffTime =
      Date.now() - this.config.retention.detailedSnapshotRetention;
    this.usageHistory = this.usageHistory.filter(
      (s) => s.timestamp.getTime() > cutoffTime,
    );

    // Limit by count
    if (this.usageHistory.length > this.config.retention.maxSnapshots) {
      this.usageHistory = this.usageHistory.slice(
        -this.config.retention.maxSnapshots,
      );
    }
  }

  /**
   * Emit a monitoring event
   */
  private emitEvent(event: TokenMonitorEvent): void {
    this.eventHistory.push(event);
    this.performanceCounters.totalEvents++;

    // Cleanup old events
    if (this.eventHistory.length > this.config.retention.maxEvents) {
      this.eventHistory = this.eventHistory.slice(
        -this.config.retention.maxEvents,
      );
    }

    this.emit(event.type, event);
    this.emit('event', event);

    logger.info('Token monitoring event emitted', {
      type: event.type,
      severity: event.severity,
      message: event.message,
      totalTokens: event.snapshot.totalTokens,
      utilizationRatio: event.snapshot.utilizationRatio,
    });
  }

  /**
   * Update performance counters
   */
  private updatePerformanceCounters(duration: number): void {
    this.performanceCounters.totalChecks++;
    this.performanceCounters.lastCheckDuration = duration;

    // Calculate rolling average
    const alpha = 0.1; // Smoothing factor
    if (this.performanceCounters.averageCheckDuration === 0) {
      this.performanceCounters.averageCheckDuration = duration;
    } else {
      this.performanceCounters.averageCheckDuration =
        alpha * duration +
        (1 - alpha) * this.performanceCounters.averageCheckDuration;
    }
  }
}

/**
 * Global singleton instance for efficient resource usage
 */
let globalTokenMonitorService: TokenMonitorService | null = null;

/**
 * Get or create the global TokenMonitorService instance
 */
export function getGlobalTokenMonitorService(
  config?: Partial<TokenMonitorConfig>,
): TokenMonitorService {
  if (!globalTokenMonitorService) {
    globalTokenMonitorService = new TokenMonitorService(config);
  }
  return globalTokenMonitorService;
}

/**
 * Reset the global monitor service (mainly for testing)
 */
export function resetGlobalTokenMonitorService(): void {
  if (globalTokenMonitorService) {
    globalTokenMonitorService.stop();
    globalTokenMonitorService = null;
  }
}
