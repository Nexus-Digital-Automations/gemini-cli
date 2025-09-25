/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Comprehensive Task Management Configuration System
 *
 * Provides centralized configuration management for all task management
 * components with validation, environment-specific settings, and runtime updates.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import type { Config } from '../config/config.js';

/**
 * Task execution engine configuration
 */
export interface TaskEngineConfig {
  maxConcurrentTasks: number;
  defaultRetryCount: number;
  timeoutMs: number;
  enableMetrics: boolean;
  enableLogging: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  retryDelayMs: number;
  maxRetryDelayMs: number;
  enableProgressTracking: boolean;
}

/**
 * Autonomous task queue configuration
 */
export interface AutonomousQueueConfig {
  enabled: boolean;
  maxConcurrentTasks: number;
  enableAutonomousBreakdown: boolean;
  breakdownThreshold: number;
  maxBreakdownDepth: number;
  breakdownStrategies: ('functional' | 'temporal' | 'dependency' | 'hybrid')[];
  schedulingAlgorithm: 'fifo' | 'priority' | 'shortest_first' | 'adaptive' | 'hybrid_adaptive';
  optimizationStrategy: 'performance' | 'resources' | 'balanced' | 'custom';
  enableAdaptiveScheduling: boolean;
  performanceOptimization: boolean;
  learningEnabled: boolean;
  metricsEnabled: boolean;
  adaptationInterval: number;
  learningRate: number;
}

/**
 * Monitoring system configuration
 */
export interface MonitoringConfig {
  enabled: boolean;
  realTimeUpdates: boolean;
  metricsRetentionHours: number;
  enableDashboard: boolean;
  dashboardPort: number;
  enableAlerts: boolean;
  alertThresholds: {
    taskFailureRate: number;
    averageExecutionTime: number;
    systemMemoryUsage: number;
    queueBacklog: number;
    agentUtilization: number;
  };
  exportFormats: ('json' | 'csv' | 'prometheus' | 'grafana')[];
  exportInterval: number;
  enablePerformanceInsights: boolean;
  enablePredictiveAnalytics: boolean;
}

/**
 * Persistence engine configuration
 */
export interface PersistenceConfig {
  enabled: boolean;
  storageLocation: string;
  storageType: 'file' | 'memory' | 'database';
  compressionEnabled: boolean;
  encryptionEnabled: boolean;
  encryptionKey?: string;
  retentionDays: number;
  autoCleanup: boolean;
  backupEnabled: boolean;
  backupInterval: number;
  backupLocation: string;
  syncEnabled: boolean;
  syncInterval: number;
}

/**
 * Hook integration configuration
 */
export interface HookIntegrationConfig {
  enabled: boolean;
  hookPath: string;
  agentId: string;
  capabilities: string[];
  progressReportingIntervalMs: number;
  autoStopEnabled: boolean;
  stopConditions: {
    allTasksComplete: boolean;
    noFailedTasks: boolean;
    timeoutMs?: number;
    customCondition?: string;
  };
  featureIntegration: {
    enableFeatureMonitoring: boolean;
    featuresJsonPath: string;
    autoCreateTasks: boolean;
    taskPriority: 'low' | 'normal' | 'high' | 'critical';
  };
}

/**
 * Dependency resolution configuration
 */
export interface DependencyConfig {
  enableAnalysis: boolean;
  enableResolution: boolean;
  maxResolutionDepth: number;
  allowCircularDependencies: boolean;
  resolutionStrategy: 'depth_first' | 'breadth_first' | 'topological' | 'adaptive';
  cacheResolutions: boolean;
  enableValidation: boolean;
  validationRules: string[];
}

/**
 * Security and validation configuration
 */
export interface SecurityConfig {
  enableValidation: boolean;
  enableSandboxing: boolean;
  allowedOperations: string[];
  restrictedPaths: string[];
  enableAuditLog: boolean;
  auditLogPath: string;
  enableRateLimit: boolean;
  rateLimitConfig: {
    maxRequestsPerMinute: number;
    maxConcurrentOperations: number;
    cooldownPeriodMs: number;
  };
  enableAccessControl: boolean;
  accessControlRules: {
    role: string;
    permissions: string[];
  }[];
}

/**
 * Development and debugging configuration
 */
export interface DevelopmentConfig {
  enableDebugMode: boolean;
  enableVerboseLogging: boolean;
  enablePerformanceProfiling: boolean;
  enableMemoryTracking: boolean;
  enableTestMode: boolean;
  testDataPath: string;
  mockExternalServices: boolean;
  enableHotReload: boolean;
  enableExperimentalFeatures: boolean;
  experimentalFlags: string[];
}

/**
 * Complete task management system configuration
 */
export interface TaskManagementConfiguration {
  // Environment and deployment
  environment: 'development' | 'staging' | 'production';
  version: string;
  deploymentId: string;

  // Core Gemini CLI configuration
  core: Config;

  // Component configurations
  taskEngine: TaskEngineConfig;
  autonomousQueue: AutonomousQueueConfig;
  monitoring: MonitoringConfig;
  persistence: PersistenceConfig;
  hookIntegration: HookIntegrationConfig;
  dependencies: DependencyConfig;
  security: SecurityConfig;
  development: DevelopmentConfig;

  // Runtime settings
  runtime: {
    enableGracefulShutdown: boolean;
    shutdownTimeoutMs: number;
    enableHealthChecks: boolean;
    healthCheckInterval: number;
    enableAutoRecovery: boolean;
    maxRecoveryAttempts: number;
  };

  // Integration settings
  integrations: {
    enableCLIIntegration: boolean;
    enableAPIServer: boolean;
    apiServerPort: number;
    enableWebInterface: boolean;
    webInterfacePort: number;
    enableExternalPlugins: boolean;
    pluginDirectory: string;
  };
}

/**
 * Configuration validation result
 */
export interface ConfigValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

/**
 * Configuration manager for task management system
 */
export class TaskManagementConfigManager {
  private config: TaskManagementConfiguration | null = null;
  private configPath: string | null = null;
  private watchers: Array<(config: TaskManagementConfiguration) => void> = [];

  /**
   * Create default configuration for specified environment
   */
  static createDefaultConfig(environment: 'development' | 'staging' | 'production'): TaskManagementConfiguration {
    const baseConfig: TaskManagementConfiguration = {
      environment,
      version: '1.0.0',
      deploymentId: `deploy_${Date.now()}_${Math.random().toString(36).substring(7)}`,

      // Placeholder core config - should be provided by caller
      core: {} as Config,

      taskEngine: {
        maxConcurrentTasks: environment === 'production' ? 10 : 5,
        defaultRetryCount: 3,
        timeoutMs: environment === 'production' ? 900000 : 300000,
        enableMetrics: true,
        enableLogging: true,
        logLevel: environment === 'development' ? 'debug' : 'info',
        retryDelayMs: 1000,
        maxRetryDelayMs: 60000,
        enableProgressTracking: true,
      },

      autonomousQueue: {
        enabled: true,
        maxConcurrentTasks: environment === 'production' ? 15 : 8,
        enableAutonomousBreakdown: true,
        breakdownThreshold: environment === 'production' ? 0.6 : 0.7,
        maxBreakdownDepth: environment === 'production' ? 4 : 3,
        breakdownStrategies: ['functional', 'temporal', 'dependency', 'hybrid'],
        schedulingAlgorithm: environment === 'production' ? 'hybrid_adaptive' : 'adaptive',
        optimizationStrategy: 'balanced',
        enableAdaptiveScheduling: true,
        performanceOptimization: true,
        learningEnabled: environment !== 'development',
        metricsEnabled: true,
        adaptationInterval: 300000, // 5 minutes
        learningRate: 0.1,
      },

      monitoring: {
        enabled: true,
        realTimeUpdates: true,
        metricsRetentionHours: environment === 'production' ? 168 : 24,
        enableDashboard: environment === 'development',
        dashboardPort: 3000,
        enableAlerts: environment === 'production',
        alertThresholds: {
          taskFailureRate: environment === 'production' ? 0.1 : 0.2,
          averageExecutionTime: environment === 'production' ? 600000 : 300000,
          systemMemoryUsage: 0.8,
          queueBacklog: 100,
          agentUtilization: 0.9,
        },
        exportFormats: environment === 'production' ? ['json', 'prometheus'] : ['json'],
        exportInterval: 60000,
        enablePerformanceInsights: true,
        enablePredictiveAnalytics: environment === 'production',
      },

      persistence: {
        enabled: true,
        storageLocation: `.task-management-${environment}`,
        storageType: 'file',
        compressionEnabled: true,
        encryptionEnabled: environment === 'production',
        retentionDays: environment === 'production' ? 90 : 30,
        autoCleanup: true,
        backupEnabled: environment === 'production',
        backupInterval: 86400000, // 24 hours
        backupLocation: `.task-management-${environment}-backup`,
        syncEnabled: false,
        syncInterval: 300000,
      },

      hookIntegration: {
        enabled: true,
        hookPath: '/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js',
        agentId: `${environment.toUpperCase()}_TASK_MANAGER`,
        capabilities: ['autonomous_execution', 'monitoring', 'persistence'],
        progressReportingIntervalMs: environment === 'development' ? 15000 : 60000,
        autoStopEnabled: true,
        stopConditions: {
          allTasksComplete: true,
          noFailedTasks: environment === 'production',
          timeoutMs: environment === 'production' ? 3600000 : undefined,
        },
        featureIntegration: {
          enableFeatureMonitoring: true,
          featuresJsonPath: './FEATURES.json',
          autoCreateTasks: true,
          taskPriority: 'high',
        },
      },

      dependencies: {
        enableAnalysis: true,
        enableResolution: true,
        maxResolutionDepth: environment === 'production' ? 15 : 10,
        allowCircularDependencies: false,
        resolutionStrategy: 'adaptive',
        cacheResolutions: true,
        enableValidation: true,
        validationRules: ['no_cycles', 'max_depth', 'valid_references'],
      },

      security: {
        enableValidation: true,
        enableSandboxing: environment === 'production',
        allowedOperations: ['read', 'write', 'execute', 'network'],
        restrictedPaths: ['/etc', '/root', '/home'],
        enableAuditLog: environment === 'production',
        auditLogPath: `.audit-${environment}.log`,
        enableRateLimit: environment === 'production',
        rateLimitConfig: {
          maxRequestsPerMinute: environment === 'production' ? 1000 : 10000,
          maxConcurrentOperations: environment === 'production' ? 50 : 20,
          cooldownPeriodMs: 5000,
        },
        enableAccessControl: false,
        accessControlRules: [],
      },

      development: {
        enableDebugMode: environment === 'development',
        enableVerboseLogging: environment === 'development',
        enablePerformanceProfiling: environment !== 'production',
        enableMemoryTracking: environment === 'development',
        enableTestMode: environment === 'development',
        testDataPath: './test-data',
        mockExternalServices: environment === 'development',
        enableHotReload: environment === 'development',
        enableExperimentalFeatures: environment === 'development',
        experimentalFlags: [],
      },

      runtime: {
        enableGracefulShutdown: true,
        shutdownTimeoutMs: 30000,
        enableHealthChecks: true,
        healthCheckInterval: 60000,
        enableAutoRecovery: environment === 'production',
        maxRecoveryAttempts: 3,
      },

      integrations: {
        enableCLIIntegration: true,
        enableAPIServer: environment !== 'development',
        apiServerPort: 8080,
        enableWebInterface: environment === 'development',
        webInterfacePort: 3001,
        enableExternalPlugins: false,
        pluginDirectory: './plugins',
      },
    };

    return baseConfig;
  }

  /**
   * Load configuration from file or create default
   */
  async loadConfig(filePath: string, coreConfig: Config): Promise<TaskManagementConfiguration> {
    this.configPath = filePath;

    if (existsSync(filePath)) {
      try {
        const configData = readFileSync(filePath, 'utf8');
        const config = JSON.parse(configData) as TaskManagementConfiguration;

        // Merge with core config
        config.core = coreConfig;

        // Validate configuration
        const validation = this.validateConfig(config);
        if (!validation.isValid) {
          console.warn('⚠️ Configuration validation failed:', validation.errors);
          console.log('📝 Suggestions:', validation.suggestions);
        }

        this.config = config;
        console.log(`✅ Configuration loaded from ${filePath}`);
      } catch (error) {
        console.error(`❌ Failed to load configuration from ${filePath}:`, error);
        console.log('🔄 Creating default configuration...');
        this.config = TaskManagementConfigManager.createDefaultConfig('development');
        this.config.core = coreConfig;
        await this.saveConfig();
      }
    } else {
      console.log('📄 Configuration file not found, creating default...');
      this.config = TaskManagementConfigManager.createDefaultConfig('development');
      this.config.core = coreConfig;
      await this.saveConfig();
    }

    return this.config;
  }

  /**
   * Save current configuration to file
   */
  async saveConfig(): Promise<void> {
    if (!this.config || !this.configPath) {
      throw new Error('No configuration or path specified');
    }

    try {
      // Ensure directory exists
      mkdirSync(dirname(this.configPath), { recursive: true });

      // Save configuration (excluding core config for security)
      const { core, ...configToSave } = this.config;

      writeFileSync(
        this.configPath,
        JSON.stringify(configToSave, null, 2),
        'utf8'
      );

      console.log(`✅ Configuration saved to ${this.configPath}`);
    } catch (error) {
      console.error(`❌ Failed to save configuration:`, error);
      throw error;
    }
  }

  /**
   * Update configuration at runtime
   */
  async updateConfig(updates: Partial<TaskManagementConfiguration>): Promise<void> {
    if (!this.config) {
      throw new Error('No configuration loaded');
    }

    // Deep merge updates
    this.config = this.deepMerge(this.config, updates);

    // Validate updated configuration
    const validation = this.validateConfig(this.config);
    if (!validation.isValid) {
      console.warn('⚠️ Updated configuration has validation errors:', validation.errors);
    }

    // Save to file
    await this.saveConfig();

    // Notify watchers
    this.watchers.forEach(watcher => watcher(this.config!));
  }

  /**
   * Get current configuration
   */
  getConfig(): TaskManagementConfiguration {
    if (!this.config) {
      throw new Error('No configuration loaded');
    }
    return { ...this.config };
  }

  /**
   * Validate configuration
   */
  validateConfig(config: TaskManagementConfiguration): ConfigValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Validate task engine config
    if (config.taskEngine.maxConcurrentTasks < 1) {
      errors.push('Task engine maxConcurrentTasks must be at least 1');
    }
    if (config.taskEngine.maxConcurrentTasks > 50) {
      warnings.push('Task engine maxConcurrentTasks is very high (>50), consider performance impact');
    }
    if (config.taskEngine.timeoutMs < 10000) {
      warnings.push('Task timeout is very low (<10s), may cause premature failures');
    }

    // Validate autonomous queue config
    if (config.autonomousQueue.enabled) {
      if (config.autonomousQueue.breakdownThreshold < 0 || config.autonomousQueue.breakdownThreshold > 1) {
        errors.push('Breakdown threshold must be between 0 and 1');
      }
      if (config.autonomousQueue.maxBreakdownDepth < 1 || config.autonomousQueue.maxBreakdownDepth > 10) {
        warnings.push('Max breakdown depth should typically be between 1 and 10');
      }
    }

    // Validate monitoring config
    if (config.monitoring.enabled) {
      if (config.monitoring.dashboardPort < 1024 || config.monitoring.dashboardPort > 65535) {
        errors.push('Dashboard port must be between 1024 and 65535');
      }
      if (config.monitoring.metricsRetentionHours < 1) {
        errors.push('Metrics retention hours must be at least 1');
      }
    }

    // Validate persistence config
    if (config.persistence.enabled) {
      if (config.persistence.retentionDays < 1) {
        errors.push('Retention days must be at least 1');
      }
      if (config.persistence.encryptionEnabled && !config.persistence.encryptionKey) {
        warnings.push('Encryption enabled but no encryption key provided');
      }
    }

    // Validate hook integration
    if (config.hookIntegration.enabled) {
      if (!existsSync(config.hookIntegration.hookPath)) {
        warnings.push(`Hook path does not exist: ${config.hookIntegration.hookPath}`);
      }
      if (config.hookIntegration.progressReportingIntervalMs < 5000) {
        warnings.push('Progress reporting interval is very short (<5s)');
      }
    }

    // Add suggestions
    if (config.environment === 'production') {
      if (!config.security.enableValidation) {
        suggestions.push('Enable security validation in production environment');
      }
      if (!config.monitoring.enableAlerts) {
        suggestions.push('Enable monitoring alerts in production environment');
      }
      if (!config.persistence.backupEnabled) {
        suggestions.push('Enable backups in production environment');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions,
    };
  }

  /**
   * Watch for configuration changes
   */
  onConfigChange(callback: (config: TaskManagementConfiguration) => void): () => void {
    this.watchers.push(callback);
    return () => {
      const index = this.watchers.indexOf(callback);
      if (index >= 0) {
        this.watchers.splice(index, 1);
      }
    };
  }

  /**
   * Generate configuration template for specific use case
   */
  static generateTemplate(useCase: 'minimal' | 'development' | 'production' | 'enterprise'): TaskManagementConfiguration {
    switch (useCase) {
      case 'minimal':
        return TaskManagementConfigManager.createMinimalTemplate();
      case 'development':
        return TaskManagementConfigManager.createDefaultConfig('development');
      case 'production':
        return TaskManagementConfigManager.createDefaultConfig('production');
      case 'enterprise':
        return TaskManagementConfigManager.createEnterpriseTemplate();
      default:
        throw new Error(`Unknown use case: ${useCase}`);
    }
  }

  private static createMinimalTemplate(): TaskManagementConfiguration {
    const config = TaskManagementConfigManager.createDefaultConfig('development');

    // Minimal settings
    config.autonomousQueue.enabled = false;
    config.monitoring.enabled = false;
    config.persistence.enabled = false;
    config.hookIntegration.enabled = false;
    config.security.enableValidation = false;
    config.development.enableDebugMode = false;

    return config;
  }

  private static createEnterpriseTemplate(): TaskManagementConfiguration {
    const config = TaskManagementConfigManager.createDefaultConfig('production');

    // Enterprise enhancements
    config.security.enableSandboxing = true;
    config.security.enableAccessControl = true;
    config.security.accessControlRules = [
      { role: 'admin', permissions: ['read', 'write', 'execute', 'configure'] },
      { role: 'developer', permissions: ['read', 'write', 'execute'] },
      { role: 'viewer', permissions: ['read'] },
    ];
    config.monitoring.enablePredictiveAnalytics = true;
    config.monitoring.exportFormats = ['json', 'prometheus', 'grafana'];
    config.persistence.syncEnabled = true;
    config.runtime.enableAutoRecovery = true;
    config.integrations.enableAPIServer = true;
    config.integrations.enableExternalPlugins = true;

    return config;
  }

  /**
   * Deep merge two objects
   */
  private deepMerge<T>(target: T, source: Partial<T>): T {
    const result = { ...target };

    for (const key in source) {
      const sourceValue = source[key];
      const targetValue = result[key];

      if (sourceValue !== undefined) {
        if (typeof sourceValue === 'object' && sourceValue !== null &&
            typeof targetValue === 'object' && targetValue !== null &&
            !Array.isArray(sourceValue) && !Array.isArray(targetValue)) {
          (result as any)[key] = this.deepMerge(targetValue, sourceValue);
        } else {
          (result as any)[key] = sourceValue;
        }
      }
    }

    return result;
  }
}

/**
 * Configuration utility functions
 */
export class ConfigUtils {
  /**
   * Export configuration to different formats
   */
  static exportConfig(config: TaskManagementConfiguration, format: 'json' | 'yaml' | 'env'): string {
    switch (format) {
      case 'json':
        return JSON.stringify(config, null, 2);
      case 'yaml':
        return ConfigUtils.toYaml(config);
      case 'env':
        return ConfigUtils.toEnvFile(config);
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  /**
   * Import configuration from different formats
   */
  static importConfig(data: string, format: 'json' | 'yaml' | 'env'): Partial<TaskManagementConfiguration> {
    switch (format) {
      case 'json':
        return JSON.parse(data);
      case 'yaml':
        return ConfigUtils.fromYaml(data);
      case 'env':
        return ConfigUtils.fromEnvFile(data);
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  /**
   * Validate configuration schema
   */
  static validateSchema(config: any): boolean {
    // Basic schema validation
    const requiredFields = ['environment', 'version', 'taskEngine', 'autonomousQueue', 'monitoring'];

    for (const field of requiredFields) {
      if (!(field in config)) {
        return false;
      }
    }

    return true;
  }

  private static toYaml(obj: any): string {
    // Simple YAML converter - in real implementation, use a proper YAML library
    return JSON.stringify(obj, null, 2)
      .replace(/"/g, '')
      .replace(/,$/gm, '')
      .replace(/^(\s*)"([^"]+)":/gm, '$1$2:');
  }

  private static fromYaml(yaml: string): any {
    // Simple YAML parser - in real implementation, use a proper YAML library
    throw new Error('YAML parsing not implemented - use a proper YAML library');
  }

  private static toEnvFile(config: TaskManagementConfiguration): string {
    const envVars: string[] = [];

    const flatten = (obj: any, prefix = ''): void => {
      for (const [key, value] of Object.entries(obj)) {
        const envKey = `${prefix}${key}`.toUpperCase().replace(/[^A-Z0-9]/g, '_');

        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          flatten(value, `${envKey}_`);
        } else {
          envVars.push(`${envKey}=${JSON.stringify(value)}`);
        }
      }
    };

    flatten(config, 'TASK_MANAGEMENT_');
    return envVars.join('\n');
  }

  private static fromEnvFile(envData: string): Partial<TaskManagementConfiguration> {
    const config: any = {};
    const lines = envData.split('\n').filter(line => line.trim() && !line.startsWith('#'));

    for (const line of lines) {
      const [key, ...valueParts] = line.split('=');
      const value = valueParts.join('=');

      if (key.startsWith('TASK_MANAGEMENT_')) {
        const configKey = key.replace('TASK_MANAGEMENT_', '').toLowerCase();
        try {
          config[configKey] = JSON.parse(value);
        } catch {
          config[configKey] = value;
        }
      }
    }

    return config;
  }
}