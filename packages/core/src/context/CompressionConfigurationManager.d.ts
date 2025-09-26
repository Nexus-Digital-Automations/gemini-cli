/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { CompressionStrategy } from './types.js';
import { FallbackStrategy } from './CompressionFallbackSystem.js';
/**
 * Token limit configuration
 */
export interface TokenLimitConfig {
    /** Maximum token limit before hard failure (default: 1,048,576) */
    maxTokenLimit: number;
    /** Token thresholds as ratios of maxTokenLimit */
    thresholds: {
        /** Information threshold - start monitoring more closely (default: 0.70 = 700K tokens) */
        info: number;
        /** Warning threshold - user notifications (default: 0.80 = 819K tokens) */
        warning: number;
        /** Critical threshold - trigger compression (default: 0.85 = 891K tokens) */
        critical: number;
        /** Emergency threshold - aggressive compression (default: 0.95 = 996K tokens) */
        emergency: number;
    };
    /** Predictive compression based on growth rate */
    predictive: {
        /** Enable predictive compression */
        enabled: boolean;
        /** Minutes ahead to predict (trigger if hitting limit in X minutes) */
        minutesAhead: number;
        /** Minimum growth rate to consider (tokens per minute) */
        minGrowthRate: number;
    };
}
/**
 * Compression ratio configuration for different scenarios
 */
export interface CompressionRatioConfig {
    /** Target ratios for different compression modes */
    targets: {
        /** Normal compression target (default: 0.70 = 70% of original) */
        normal: number;
        /** Aggressive compression target (default: 0.50 = 50% of original) */
        aggressive: number;
        /** Emergency compression target (default: 0.30 = 30% of original) */
        emergency: number;
        /** Fallback compression target (default: 0.60 = 60% of original) */
        fallback: number;
    };
    /** Content-type-specific ratio adjustments */
    contentTypeAdjustments: {
        /** Code content multiplier (default: 1.2 = 20% more lenient) */
        code: number;
        /** Error/log content multiplier (default: 0.8 = 20% more aggressive) */
        logs: number;
        /** Conversation content multiplier (default: 1.0 = no adjustment) */
        conversation: number;
        /** Documentation content multiplier (default: 0.9 = 10% more aggressive) */
        documentation: number;
    };
    /** Minimum compression ratio to consider successful */
    minimumImprovement: number;
}
/**
 * Algorithm selection and priority configuration
 */
export interface AlgorithmConfig {
    /** Primary compression strategy priorities (1-10, higher = more preferred) */
    primaryStrategies: Record<CompressionStrategy, number>;
    /** Enable enhanced content-type-specific algorithms */
    enableEnhancedAlgorithms: boolean;
    /** Algorithm selection rules based on content characteristics */
    selectionRules: {
        /** Token threshold for each strategy */
        tokenThresholds: Record<CompressionStrategy, number>;
        /** Content-type preferences */
        contentTypePreferences: Record<string, CompressionStrategy>;
        /** Complexity-based selection */
        complexityThresholds: {
            /** Low complexity threshold */
            low: number;
            /** High complexity threshold */
            high: number;
            /** Strategy for low complexity content */
            lowComplexityStrategy: CompressionStrategy;
            /** Strategy for high complexity content */
            highComplexityStrategy: CompressionStrategy;
        };
    };
    /** Quality vs performance trade-off (0-1, 0=fastest, 1=highest quality) */
    qualityLevel: number;
    /** Maximum processing time per item (ms) */
    maxProcessingTime: number;
}
/**
 * Fallback system configuration
 */
export interface FallbackSystemConfig {
    /** Enable fallback mechanisms */
    enabled: boolean;
    /** Maximum number of fallback attempts */
    maxAttempts: number;
    /** Fallback strategy priorities */
    strategyPriorities: Record<FallbackStrategy, number>;
    /** Enable emergency content removal */
    enableEmergencyRemoval: boolean;
    /** Minimum preservation ratio in emergency (0.1 = keep at least 10%) */
    minPreservationRatio: number;
    /** Timeout for individual fallback attempts (ms) */
    timeoutMs: number;
    /** Enable automatic recovery */
    enableAutoRecovery: boolean;
    /** Recovery retry delay (ms) */
    recoveryRetryDelay: number;
    /** Error type to strategy mapping */
    errorStrategies: Record<string, FallbackStrategy[]>;
}
/**
 * Monitoring and triggering configuration
 */
export interface MonitoringConfig {
    /** Enable automatic monitoring */
    enabled: boolean;
    /** Monitoring frequency (ms) */
    interval: number;
    /** High-frequency monitoring when critical (ms) */
    criticalInterval: number;
    /** Enable real-time event emission */
    enableEvents: boolean;
    /** Performance monitoring */
    performance: {
        /** Track compression performance */
        enabled: boolean;
        /** Performance history size */
        historySize: number;
        /** Slow compression threshold (ms) */
        slowThreshold: number;
    };
    /** Usage history configuration */
    history: {
        /** Keep usage history */
        enabled: boolean;
        /** Maximum history entries */
        maxEntries: number;
        /** Cleanup interval (ms) */
        cleanupInterval: number;
    };
}
/**
 * Performance and resource configuration
 */
export interface PerformanceConfig {
    /** Batch processing settings */
    batching: {
        /** Enable batch processing */
        enabled: boolean;
        /** Batch size for compression operations */
        batchSize: number;
        /** Concurrent batch processing limit */
        concurrencyLimit: number;
        /** Batch timeout (ms) */
        timeoutMs: number;
    };
    /** Caching configuration */
    caching: {
        /** Enable compression result caching */
        enabled: boolean;
        /** Cache size limit */
        maxEntries: number;
        /** Cache TTL (ms) */
        ttlMs: number;
    };
    /** Memory management */
    memory: {
        /** Enable memory optimization */
        enabled: boolean;
        /** Memory usage threshold for optimization */
        thresholdMb: number;
        /** Chunk size for large content processing */
        chunkSize: number;
    };
    /** Rate limiting */
    rateLimiting: {
        /** Enable compression rate limiting */
        enabled: boolean;
        /** Maximum compressions per minute */
        maxPerMinute: number;
        /** Minimum interval between compressions (ms) */
        minInterval: number;
    };
}
/**
 * Comprehensive compression system configuration
 */
export interface CompressionSystemConfig {
    /** Token limits and thresholds */
    tokenLimits: TokenLimitConfig;
    /** Compression ratios */
    compressionRatios: CompressionRatioConfig;
    /** Algorithm selection */
    algorithms: AlgorithmConfig;
    /** Fallback system */
    fallback: FallbackSystemConfig;
    /** Monitoring settings */
    monitoring: MonitoringConfig;
    /** Performance settings */
    performance: PerformanceConfig;
    /** Configuration metadata */
    metadata: {
        /** Configuration version */
        version: string;
        /** Creation timestamp */
        created: Date;
        /** Last modified timestamp */
        modified: Date;
        /** Configuration description */
        description: string;
    };
}
/**
 * Predefined configuration presets
 */
export declare enum ConfigurationPreset {
    /** Conservative settings - minimal risk, less aggressive compression */
    CONSERVATIVE = "conservative",
    /** Balanced settings - good performance and safety balance */
    BALANCED = "balanced",
    /** Aggressive settings - maximum compression, higher risk */
    AGGRESSIVE = "aggressive",
    /** Development settings - optimized for development workflow */
    DEVELOPMENT = "development",
    /** Production settings - optimized for production stability */
    PRODUCTION = "production",
    /** High-volume settings - optimized for high-traffic scenarios */
    HIGH_VOLUME = "high_volume"
}
/**
 * Default configuration settings
 */
export declare const DEFAULT_COMPRESSION_CONFIG: CompressionSystemConfig;
/**
 * Configuration presets for different use cases
 */
export declare const CONFIGURATION_PRESETS: Record<ConfigurationPreset, Partial<CompressionSystemConfig>>;
/**
 * Comprehensive configuration manager for the compression system
 */
export declare class CompressionConfigurationManager {
    private config;
    private configPath?;
    private watchers;
    constructor(initialConfig?: Partial<CompressionSystemConfig>);
    /**
     * Get current configuration
     */
    getConfig(): CompressionSystemConfig;
    /**
     * Update configuration with partial updates
     */
    updateConfig(updates: Partial<CompressionSystemConfig>): void;
    /**
     * Apply configuration preset
     */
    applyPreset(preset: ConfigurationPreset): void;
    /**
     * Load configuration from file
     */
    loadFromFile(filePath: string): Promise<void>;
    /**
     * Save configuration to file
     */
    saveToFile(filePath?: string): Promise<void>;
    /**
     * Validate configuration
     */
    validateConfig(config?: CompressionSystemConfig): {
        isValid: boolean;
        errors: string[];
        warnings: string[];
    };
    /**
     * Get configuration for specific component
     */
    getTokenLimitConfig(): TokenLimitConfig;
    getCompressionRatioConfig(): CompressionRatioConfig;
    getAlgorithmConfig(): AlgorithmConfig;
    getFallbackConfig(): FallbackSystemConfig;
    getMonitoringConfig(): MonitoringConfig;
    getPerformanceConfig(): PerformanceConfig;
    /**
     * Register configuration change watcher
     */
    watchConfig(id: string, callback: (config: CompressionSystemConfig) => void): void;
    /**
     * Unregister configuration change watcher
     */
    unwatchConfig(id: string): void;
    /**
     * Export configuration as JSON
     */
    exportConfig(): string;
    /**
     * Import configuration from JSON
     */
    importConfig(configJson: string): void;
    /**
     * Reset configuration to defaults
     */
    resetToDefaults(): void;
    /**
     * Get available configuration presets
     */
    getAvailablePresets(): ConfigurationPreset[];
    /**
     * Merge configuration objects deeply
     */
    private mergeConfigs;
    /**
     * Notify all configuration watchers
     */
    private notifyWatchers;
}
/**
 * Create configuration manager instance
 */
export declare function createCompressionConfigurationManager(initialConfig?: Partial<CompressionSystemConfig>): CompressionConfigurationManager;
/**
 * Create configuration manager with preset
 */
export declare function createCompressionConfigurationManagerWithPreset(preset: ConfigurationPreset): CompressionConfigurationManager;
