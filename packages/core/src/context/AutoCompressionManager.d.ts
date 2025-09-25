/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { CompressionConfigurationManager, ConfigurationPreset, CompressionSystemConfig } from './CompressionConfigurationManager.js';
import type { ContextWindowManager } from './ContextWindowManager.js';
import { CompressionStrategy } from './types.js';
import EventEmitter from 'node:events';
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
    priority: number;
    tokenThreshold: number;
}
/**
 * Auto-compression event types
 */
export declare enum AutoCompressionEvent {
    THRESHOLD_REACHED = "threshold_reached",
    COMPRESSION_STARTED = "compression_started",
    COMPRESSION_COMPLETED = "compression_completed",
    COMPRESSION_FAILED = "compression_failed",
    EMERGENCY_COMPRESSION = "emergency_compression",
    TOKEN_LIMIT_WARNING = "token_limit_warning",
    TOKEN_LIMIT_EXCEEDED = "token_limit_exceeded"
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
    projectedGrowth: number;
}
/**
 * Compression opportunity analysis
 */
export interface CompressionOpportunity {
    section: string;
    currentTokens: number;
    estimatedSavings: number;
    recommendedStrategy: CompressionStrategy;
    confidence: number;
}
/**
 * Default configuration
 */
export declare const DEFAULT_AUTO_COMPRESSION_CONFIG: AutoCompressionConfig;
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
export declare class AutoCompressionManager extends EventEmitter {
    private config;
    private configManager;
    private compressor;
    private enhancedCompressor;
    private fallbackSystem;
    private contextManagers;
    private tokenUsageHistory;
    private lastCompressionTime;
    private compressionAttempts;
    private monitoringTimer;
    private isCompressing;
    private totalTokensCache;
    private lastCacheUpdate;
    private triggerEnabled;
    constructor(config?: Partial<AutoCompressionConfig>, configurationManager?: CompressionConfigurationManager, preset?: ConfigurationPreset);
    /**
     * Convert comprehensive configuration to legacy AutoCompressionConfig format
     */
    private convertToLegacyConfig;
    /**
     * Handle configuration changes from configuration manager
     */
    private handleConfigurationChange;
    /**
     * Get current configuration manager
     */
    getConfigurationManager(): CompressionConfigurationManager;
    /**
     * Update configuration using configuration manager
     */
    updateConfiguration(updates: Partial<CompressionSystemConfig>): void;
    /**
     * Apply configuration preset
     */
    applyConfigurationPreset(preset: ConfigurationPreset): void;
    /**
     * Load configuration from file
     */
    loadConfigurationFromFile(filePath: string): Promise<void>;
    /**
     * Save current configuration to file
     */
    saveConfigurationToFile(filePath: string): Promise<void>;
    /**
     * Set up automatic token limit trigger for 1,272,932 → 1,048,576 issue
     */
    private setupTokenLimitTrigger;
    /**
     * Trigger robust compression with enhanced algorithms and fallback mechanisms
     */
    triggerRobustCompression(isEmergency?: boolean): Promise<CompressionResult>;
    /**
     * Start automatic compression monitoring
     */
    start(): void;
    /**
     * Stop automatic compression monitoring
     */
    stop(): void;
    /**
     * Register a context window manager for monitoring
     */
    registerContextManager(id: string, manager: ContextWindowManager): void;
    /**
     * Unregister a context window manager
     */
    unregisterContextManager(id: string): void;
    /**
     * Manually trigger compression
     */
    triggerCompression(force?: boolean): Promise<CompressionResult>;
    /**
     * Get current token usage statistics
     */
    getTokenUsage(): TokenUsageSnapshot;
    /**
     * Get compression history and statistics
     */
    getCompressionHistory(): {
        attempts: number;
        lastCompressionTime: Date | null;
        averageCompressionRatio: number;
        totalTokensSaved: number;
        history: TokenUsageSnapshot[];
    };
    /**
     * Check current token usage and trigger compression if needed
     */
    private checkTokenUsage;
    /**
     * Capture current token usage across all context managers
     */
    private captureTokenUsageSnapshot;
    /**
     * Calculate token growth rate based on recent history
     */
    private calculateGrowthRate;
    /**
     * Determine if compression should be triggered
     */
    private shouldCompress;
    /**
     * Perform robust compression with enhanced algorithms and fallback mechanisms
     */
    private performRobustCompression;
    /**
     * Perform compression operation (legacy method using basic algorithms)
     */
    private performCompression;
    /**
     * Select optimal compression strategy for a section
     */
    private selectOptimalStrategy;
    /**
     * Calculate confidence score for compression potential
     */
    private calculateCompressionConfidence;
    /**
     * Add snapshot to usage history
     */
    private addToUsageHistory;
    /**
     * Update configuration
     */
    updateConfig(newConfig: Partial<AutoCompressionConfig>): void;
    /**
     * Get current configuration
     */
    getConfig(): AutoCompressionConfig;
}
/**
 * Get or create the global AutoCompressionManager instance
 */
export declare function getGlobalAutoCompressionManager(config?: Partial<AutoCompressionConfig>): AutoCompressionManager;
/**
 * Reset the global manager (mainly for testing)
 */
export declare function resetGlobalAutoCompressionManager(): void;
