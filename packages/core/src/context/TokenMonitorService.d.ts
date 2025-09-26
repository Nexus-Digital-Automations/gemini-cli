/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ContextWindowManager } from './ContextWindowManager.js';
import EventEmitter from 'node:events';
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
        info: number;
        warning: number;
        critical: number;
        emergency: number;
    };
    /** Compression trigger points */
    compressionTriggers: {
        soft: number;
        aggressive: number;
        emergency: number;
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
export declare enum TokenEventType {
    THRESHOLD_CROSSED = "threshold_crossed",
    GROWTH_SPIKE = "growth_spike",
    EFFICIENCY_DROP = "efficiency_drop",
    COMPRESSION_NEEDED = "compression_needed",
    LIMIT_APPROACHING = "limit_approaching",
    CRITICAL_USAGE = "critical_usage",
    EMERGENCY_STATE = "emergency_state",
    OPTIMIZATION_OPPORTUNITY = "optimization_opportunity"
}
/**
 * Default configuration
 */
export declare const DEFAULT_TOKEN_MONITOR_CONFIG: TokenMonitorConfig;
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
export declare class TokenMonitorService extends EventEmitter {
    private config;
    private contextManagers;
    private usageHistory;
    private eventHistory;
    private monitoringTimer;
    private isHighFrequencyMode;
    private lastThresholdLevel;
    private performanceCounters;
    constructor(config?: Partial<TokenMonitorConfig>);
    /**
     * Start token monitoring
     */
    start(): void;
    /**
     * Stop token monitoring
     */
    stop(): void;
    /**
     * Register a context manager for monitoring
     */
    registerContextManager(id: string, manager: ContextWindowManager): void;
    /**
     * Unregister a context manager
     */
    unregisterContextManager(id: string): void;
    /**
     * Get current token usage snapshot
     */
    getCurrentUsage(): TokenUsageSnapshot;
    /**
     * Get usage history
     */
    getUsageHistory(limit?: number): TokenUsageSnapshot[];
    /**
     * Get event history
     */
    getEventHistory(limit?: number): TokenMonitorEvent[];
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
    };
    /**
     * Manually trigger a monitoring check
     */
    triggerCheck(): TokenUsageSnapshot;
    /**
     * Update monitoring configuration
     */
    updateConfig(newConfig: Partial<TokenMonitorConfig>): void;
    /**
     * Perform a monitoring check
     */
    private performMonitoringCheck;
    /**
     * Capture current usage snapshot across all managers
     */
    private captureUsageSnapshot;
    /**
     * Analyze usage for a specific context manager
     */
    private analyzeManagerUsage;
    /**
     * Estimate compression potential for a section
     */
    private estimateCompressionPotential;
    /**
     * Calculate compression ratio for a window
     */
    private calculateCompressionRatio;
    /**
     * Calculate access frequency for a window
     */
    private calculateAccessFrequency;
    /**
     * Calculate token growth rate based on recent history
     */
    private calculateGrowthRate;
    /**
     * Calculate efficiency metrics
     */
    private calculateEfficiencyMetrics;
    /**
     * Analyze snapshot for events and alerts
     */
    private analyzeSnapshot;
    /**
     * Check for threshold crossings
     */
    private checkThresholdCrossings;
    /**
     * Check for growth rate spikes
     */
    private checkGrowthSpikes;
    /**
     * Check for efficiency drops
     */
    private checkEfficiencyDrops;
    /**
     * Check for optimization opportunities
     */
    private checkOptimizationOpportunities;
    /**
     * Update monitoring mode based on current usage
     */
    private updateMonitoringMode;
    /**
     * Schedule the next monitoring check
     */
    private scheduleNextCheck;
    /**
     * Add snapshot to history with cleanup
     */
    private addToHistory;
    /**
     * Emit a monitoring event
     */
    private emitEvent;
    /**
     * Update performance counters
     */
    private updatePerformanceCounters;
}
/**
 * Get or create the global TokenMonitorService instance
 */
export declare function getGlobalTokenMonitorService(config?: Partial<TokenMonitorConfig>): TokenMonitorService;
/**
 * Reset the global monitor service (mainly for testing)
 */
export declare function resetGlobalTokenMonitorService(): void;
