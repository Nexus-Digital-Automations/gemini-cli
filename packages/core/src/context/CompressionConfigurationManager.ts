/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Comprehensive Configuration Management for Compression System
 * Centralized configuration for all compression thresholds, strategies, and options
 *
 * @author Claude Code - Configuration Management Specialist
 * @version 1.0.0
 */

import { getComponentLogger } from '../utils/logger.js';
import { CompressionStrategy } from './types.js';
import { FallbackStrategy } from './CompressionFallbackSystem.js';
import { performance } from 'node:perf_hooks';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';

const logger = getComponentLogger('compression-config-manager');

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
export enum ConfigurationPreset {
  /** Conservative settings - minimal risk, less aggressive compression */
  CONSERVATIVE = 'conservative',

  /** Balanced settings - good performance and safety balance */
  BALANCED = 'balanced',

  /** Aggressive settings - maximum compression, higher risk */
  AGGRESSIVE = 'aggressive',

  /** Development settings - optimized for development workflow */
  DEVELOPMENT = 'development',

  /** Production settings - optimized for production stability */
  PRODUCTION = 'production',

  /** High-volume settings - optimized for high-traffic scenarios */
  HIGH_VOLUME = 'high_volume'
}

/**
 * Default configuration settings
 */
export const DEFAULT_COMPRESSION_CONFIG: CompressionSystemConfig = {
  tokenLimits: {
    maxTokenLimit: 1048576, // 1M tokens - Claude API limit
    thresholds: {
      info: 0.70,     // 700K tokens
      warning: 0.80,  // 819K tokens
      critical: 0.85, // 891K tokens
      emergency: 0.95 // 996K tokens
    },
    predictive: {
      enabled: true,
      minutesAhead: 30,
      minGrowthRate: 1000 // tokens per minute
    }
  },

  compressionRatios: {
    targets: {
      normal: 0.70,    // 70% of original
      aggressive: 0.50, // 50% of original
      emergency: 0.30,  // 30% of original
      fallback: 0.60    // 60% of original
    },
    contentTypeAdjustments: {
      code: 1.2,           // 20% more lenient for code
      logs: 0.8,           // 20% more aggressive for logs
      conversation: 1.0,   // No adjustment
      documentation: 0.9   // 10% more aggressive for docs
    },
    minimumImprovement: 0.1 // Must reduce by at least 10%
  },

  algorithms: {
    primaryStrategies: {
      [CompressionStrategy.PROGRESSIVE_DETAIL]: 10,
      [CompressionStrategy.SEMANTIC_CLUSTERING]: 8,
      [CompressionStrategy.SUMMARIZATION]: 6,
      [CompressionStrategy.KEYWORD_EXTRACTION]: 4
    },
    enableEnhancedAlgorithms: true,
    selectionRules: {
      tokenThresholds: {
        [CompressionStrategy.PROGRESSIVE_DETAIL]: 0,
        [CompressionStrategy.SEMANTIC_CLUSTERING]: 50000,
        [CompressionStrategy.SUMMARIZATION]: 100000,
        [CompressionStrategy.KEYWORD_EXTRACTION]: 200000
      },
      contentTypePreferences: {
        'javascript': CompressionStrategy.SEMANTIC_CLUSTERING,
        'typescript': CompressionStrategy.SEMANTIC_CLUSTERING,
        'json': CompressionStrategy.PROGRESSIVE_DETAIL,
        'conversation': CompressionStrategy.SUMMARIZATION,
        'logs': CompressionStrategy.KEYWORD_EXTRACTION
      },
      complexityThresholds: {
        low: 0.3,
        high: 0.7,
        lowComplexityStrategy: CompressionStrategy.PROGRESSIVE_DETAIL,
        highComplexityStrategy: CompressionStrategy.SEMANTIC_CLUSTERING
      }
    },
    qualityLevel: 0.8,
    maxProcessingTime: 10000 // 10 seconds
  },

  fallback: {
    enabled: true,
    maxAttempts: 3,
    strategyPriorities: {
      [FallbackStrategy.SIMPLE_COMPRESSION]: 10,
      [FallbackStrategy.WHITESPACE_COMPRESSION]: 9,
      [FallbackStrategy.TEXT_TRUNCATION]: 8,
      [FallbackStrategy.LINE_REMOVAL]: 7,
      [FallbackStrategy.LOW_PRIORITY_REMOVAL]: 6,
      [FallbackStrategy.OLDEST_CONTENT_REMOVAL]: 5,
      [FallbackStrategy.REDUNDANT_CONTENT_REMOVAL]: 4,
      [FallbackStrategy.RETRY_WITH_DIFFERENT_ALGORITHM]: 8,
      [FallbackStrategy.CHUNK_BASED_PROCESSING]: 7,
      [FallbackStrategy.MEMORY_OPTIMIZED_COMPRESSION]: 6,
      [FallbackStrategy.AGGRESSIVE_TRUNCATION]: 3,
      [FallbackStrategy.EMERGENCY_CONTENT_PURGE]: 2,
      [FallbackStrategy.MINIMAL_CONTEXT_PRESERVATION]: 1
    },
    enableEmergencyRemoval: true,
    minPreservationRatio: 0.1,
    timeoutMs: 10000,
    enableAutoRecovery: true,
    recoveryRetryDelay: 2000,
    errorStrategies: {
      'memory_exhaustion': [
        FallbackStrategy.CHUNK_BASED_PROCESSING,
        FallbackStrategy.MEMORY_OPTIMIZED_COMPRESSION
      ],
      'timeout_exceeded': [
        FallbackStrategy.SIMPLE_COMPRESSION,
        FallbackStrategy.WHITESPACE_COMPRESSION
      ],
      'algorithm_failure': [
        FallbackStrategy.RETRY_WITH_DIFFERENT_ALGORITHM,
        FallbackStrategy.SIMPLE_COMPRESSION
      ]
    }
  },

  monitoring: {
    enabled: true,
    interval: 30000,     // 30 seconds
    criticalInterval: 5000, // 5 seconds when critical
    enableEvents: true,
    performance: {
      enabled: true,
      historySize: 100,
      slowThreshold: 5000 // 5 seconds
    },
    history: {
      enabled: true,
      maxEntries: 1000,
      cleanupInterval: 300000 // 5 minutes
    }
  },

  performance: {
    batching: {
      enabled: true,
      batchSize: 10,
      concurrencyLimit: 3,
      timeoutMs: 30000
    },
    caching: {
      enabled: true,
      maxEntries: 500,
      ttlMs: 3600000 // 1 hour
    },
    memory: {
      enabled: true,
      thresholdMb: 100,
      chunkSize: 1000
    },
    rateLimiting: {
      enabled: true,
      maxPerMinute: 10,
      minInterval: 60000 // 1 minute
    }
  },

  metadata: {
    version: '1.0.0',
    created: new Date(),
    modified: new Date(),
    description: 'Default compression system configuration'
  }
};

/**
 * Configuration presets for different use cases
 */
export const CONFIGURATION_PRESETS: Record<ConfigurationPreset, Partial<CompressionSystemConfig>> = {
  [ConfigurationPreset.CONSERVATIVE]: {
    tokenLimits: {
      ...DEFAULT_COMPRESSION_CONFIG.tokenLimits,
      thresholds: {
        info: 0.60,
        warning: 0.70,
        critical: 0.75,
        emergency: 0.85
      }
    },
    compressionRatios: {
      ...DEFAULT_COMPRESSION_CONFIG.compressionRatios,
      targets: {
        normal: 0.80,
        aggressive: 0.70,
        emergency: 0.50,
        fallback: 0.75
      }
    },
    fallback: {
      ...DEFAULT_COMPRESSION_CONFIG.fallback,
      maxAttempts: 2,
      enableEmergencyRemoval: false
    }
  },

  [ConfigurationPreset.AGGRESSIVE]: {
    tokenLimits: {
      ...DEFAULT_COMPRESSION_CONFIG.tokenLimits,
      thresholds: {
        info: 0.80,
        warning: 0.85,
        critical: 0.90,
        emergency: 0.98
      }
    },
    compressionRatios: {
      ...DEFAULT_COMPRESSION_CONFIG.compressionRatios,
      targets: {
        normal: 0.50,
        aggressive: 0.30,
        emergency: 0.15,
        fallback: 0.40
      }
    },
    fallback: {
      ...DEFAULT_COMPRESSION_CONFIG.fallback,
      maxAttempts: 5,
      enableEmergencyRemoval: true,
      minPreservationRatio: 0.05
    }
  },

  [ConfigurationPreset.DEVELOPMENT]: {
    monitoring: {
      ...DEFAULT_COMPRESSION_CONFIG.monitoring,
      interval: 10000, // More frequent monitoring
      criticalInterval: 2000
    },
    performance: {
      ...DEFAULT_COMPRESSION_CONFIG.performance,
      caching: {
        ...DEFAULT_COMPRESSION_CONFIG.performance.caching,
        enabled: false // Disable caching for development
      }
    },
    algorithms: {
      ...DEFAULT_COMPRESSION_CONFIG.algorithms,
      maxProcessingTime: 5000 // Faster timeout for development
    }
  },

  [ConfigurationPreset.PRODUCTION]: {
    monitoring: {
      ...DEFAULT_COMPRESSION_CONFIG.monitoring,
      interval: 60000, // Less frequent monitoring
      performance: {
        enabled: true,
        historySize: 50,
        slowThreshold: 10000
      }
    },
    performance: {
      ...DEFAULT_COMPRESSION_CONFIG.performance,
      caching: {
        enabled: true,
        maxEntries: 1000,
        ttlMs: 7200000 // 2 hours
      },
      rateLimiting: {
        enabled: true,
        maxPerMinute: 5,
        minInterval: 120000 // 2 minutes
      }
    }
  },

  [ConfigurationPreset.HIGH_VOLUME]: {
    performance: {
      ...DEFAULT_COMPRESSION_CONFIG.performance,
      batching: {
        enabled: true,
        batchSize: 20,
        concurrencyLimit: 5,
        timeoutMs: 60000
      },
      caching: {
        enabled: true,
        maxEntries: 2000,
        ttlMs: 14400000 // 4 hours
      }
    },
    algorithms: {
      ...DEFAULT_COMPRESSION_CONFIG.algorithms,
      qualityLevel: 0.6, // Lower quality for performance
      maxProcessingTime: 15000
    }
  }
};

/**
 * Comprehensive configuration manager for the compression system
 */
export class CompressionConfigurationManager {
  private config: CompressionSystemConfig;
  private configPath?: string;
  private watchers: Map<string, (config: CompressionSystemConfig) => void> = new Map();

  constructor(initialConfig?: Partial<CompressionSystemConfig>) {
    this.config = this.mergeConfigs(DEFAULT_COMPRESSION_CONFIG, initialConfig);

    logger.info('CompressionConfigurationManager initialized', {
      version: this.config.metadata.version,
      presetUsed: initialConfig ? 'custom' : 'default',
      enhancedAlgorithms: this.config.algorithms.enableEnhancedAlgorithms,
      fallbackEnabled: this.config.fallback.enabled,
      monitoringEnabled: this.config.monitoring.enabled
    });
  }

  /**
   * Get current configuration
   */
  getConfig(): CompressionSystemConfig {
    return JSON.parse(JSON.stringify(this.config)); // Deep copy
  }

  /**
   * Update configuration with partial updates
   */
  updateConfig(updates: Partial<CompressionSystemConfig>): void {
    const oldConfig = this.config;
    this.config = this.mergeConfigs(this.config, updates);
    this.config.metadata.modified = new Date();

    logger.info('Configuration updated', {
      hasTokenLimitChanges: updates.tokenLimits !== undefined,
      hasAlgorithmChanges: updates.algorithms !== undefined,
      hasFallbackChanges: updates.fallback !== undefined,
      hasMonitoringChanges: updates.monitoring !== undefined
    });

    this.notifyWatchers();
  }

  /**
   * Apply configuration preset
   */
  applyPreset(preset: ConfigurationPreset): void {
    const presetConfig = CONFIGURATION_PRESETS[preset];
    if (!presetConfig) {
      throw new Error(`Unknown configuration preset: ${preset}`);
    }

    const updatedConfig = this.mergeConfigs(DEFAULT_COMPRESSION_CONFIG, presetConfig);
    updatedConfig.metadata = {
      ...this.config.metadata,
      description: `Configuration preset: ${preset}`,
      modified: new Date()
    };

    this.config = updatedConfig;

    logger.info('Configuration preset applied', {
      preset,
      description: updatedConfig.metadata.description
    });

    this.notifyWatchers();
  }

  /**
   * Load configuration from file
   */
  async loadFromFile(filePath: string): Promise<void> {
    try {
      const configData = await fs.readFile(filePath, 'utf-8');
      const loadedConfig = JSON.parse(configData);

      // Validate and merge with defaults
      this.config = this.mergeConfigs(DEFAULT_COMPRESSION_CONFIG, loadedConfig);
      this.configPath = filePath;

      logger.info('Configuration loaded from file', {
        filePath,
        version: this.config.metadata.version,
        description: this.config.metadata.description
      });

      this.notifyWatchers();
    } catch (error) {
      logger.error('Failed to load configuration from file', {
        filePath,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Save configuration to file
   */
  async saveToFile(filePath?: string): Promise<void> {
    const targetPath = filePath || this.configPath;
    if (!targetPath) {
      throw new Error('No file path specified for saving configuration');
    }

    try {
      const configData = JSON.stringify(this.config, null, 2);
      await fs.writeFile(targetPath, configData, 'utf-8');

      this.configPath = targetPath;

      logger.info('Configuration saved to file', {
        filePath: targetPath,
        version: this.config.metadata.version
      });
    } catch (error) {
      logger.error('Failed to save configuration to file', {
        filePath: targetPath,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Validate configuration
   */
  validateConfig(config?: CompressionSystemConfig): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const configToValidate = config || this.config;
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate token limits
    const tokenLimits = configToValidate.tokenLimits;
    if (tokenLimits.maxTokenLimit <= 0) {
      errors.push('maxTokenLimit must be greater than 0');
    }

    const thresholds = [
      tokenLimits.thresholds.info,
      tokenLimits.thresholds.warning,
      tokenLimits.thresholds.critical,
      tokenLimits.thresholds.emergency
    ];

    for (let i = 1; i < thresholds.length; i++) {
      if (thresholds[i] <= thresholds[i - 1]) {
        errors.push(`Token thresholds must be in ascending order`);
        break;
      }
    }

    // Validate compression ratios
    const ratios = configToValidate.compressionRatios.targets;
    Object.entries(ratios).forEach(([key, value]) => {
      if (value <= 0 || value > 1) {
        errors.push(`Compression ratio '${key}' must be between 0 and 1`);
      }
    });

    // Validate algorithm settings
    if (configToValidate.algorithms.maxProcessingTime <= 0) {
      errors.push('maxProcessingTime must be greater than 0');
    }

    // Warnings for potentially problematic settings
    if (tokenLimits.thresholds.critical > 0.9) {
      warnings.push('Critical threshold is very high (>90%), may not leave enough time for compression');
    }

    if (ratios.emergency < 0.2) {
      warnings.push('Emergency compression ratio is very aggressive (<20%), may result in significant information loss');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Get configuration for specific component
   */
  getTokenLimitConfig(): TokenLimitConfig {
    return JSON.parse(JSON.stringify(this.config.tokenLimits));
  }

  getCompressionRatioConfig(): CompressionRatioConfig {
    return JSON.parse(JSON.stringify(this.config.compressionRatios));
  }

  getAlgorithmConfig(): AlgorithmConfig {
    return JSON.parse(JSON.stringify(this.config.algorithms));
  }

  getFallbackConfig(): FallbackSystemConfig {
    return JSON.parse(JSON.stringify(this.config.fallback));
  }

  getMonitoringConfig(): MonitoringConfig {
    return JSON.parse(JSON.stringify(this.config.monitoring));
  }

  getPerformanceConfig(): PerformanceConfig {
    return JSON.parse(JSON.stringify(this.config.performance));
  }

  /**
   * Register configuration change watcher
   */
  watchConfig(id: string, callback: (config: CompressionSystemConfig) => void): void {
    this.watchers.set(id, callback);
  }

  /**
   * Unregister configuration change watcher
   */
  unwatchConfig(id: string): void {
    this.watchers.delete(id);
  }

  /**
   * Export configuration as JSON
   */
  exportConfig(): string {
    return JSON.stringify(this.config, null, 2);
  }

  /**
   * Import configuration from JSON
   */
  importConfig(configJson: string): void {
    try {
      const importedConfig = JSON.parse(configJson);
      this.config = this.mergeConfigs(DEFAULT_COMPRESSION_CONFIG, importedConfig);
      this.config.metadata.modified = new Date();

      logger.info('Configuration imported from JSON');
      this.notifyWatchers();
    } catch (error) {
      logger.error('Failed to import configuration from JSON', {
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Reset configuration to defaults
   */
  resetToDefaults(): void {
    this.config = JSON.parse(JSON.stringify(DEFAULT_COMPRESSION_CONFIG));
    this.config.metadata.modified = new Date();

    logger.info('Configuration reset to defaults');
    this.notifyWatchers();
  }

  /**
   * Get available configuration presets
   */
  getAvailablePresets(): ConfigurationPreset[] {
    return Object.values(ConfigurationPreset);
  }

  /**
   * Merge configuration objects deeply
   */
  private mergeConfigs(
    base: CompressionSystemConfig,
    override?: Partial<CompressionSystemConfig>
  ): CompressionSystemConfig {
    if (!override) return JSON.parse(JSON.stringify(base));

    const result = JSON.parse(JSON.stringify(base));

    Object.keys(override).forEach(key => {
      const value = override[key as keyof CompressionSystemConfig];
      if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
        result[key as keyof CompressionSystemConfig] = {
          ...result[key as keyof CompressionSystemConfig],
          ...value
        } as any;
      } else {
        (result[key as keyof CompressionSystemConfig] as any) = value;
      }
    });

    return result;
  }

  /**
   * Notify all configuration watchers
   */
  private notifyWatchers(): void {
    for (const [id, callback] of this.watchers.entries()) {
      try {
        callback(this.getConfig());
      } catch (error) {
        logger.error('Configuration watcher failed', {
          watcherId: id,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
  }
}

/**
 * Create configuration manager instance
 */
export function createCompressionConfigurationManager(
  initialConfig?: Partial<CompressionSystemConfig>
): CompressionConfigurationManager {
  return new CompressionConfigurationManager(initialConfig);
}

/**
 * Create configuration manager with preset
 */
export function createCompressionConfigurationManagerWithPreset(
  preset: ConfigurationPreset
): CompressionConfigurationManager {
  const manager = new CompressionConfigurationManager();
  manager.applyPreset(preset);
  return manager;
}