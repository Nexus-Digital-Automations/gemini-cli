/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
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
    breakdownStrategies: Array<'functional' | 'temporal' | 'dependency' | 'hybrid'>;
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
    exportFormats: Array<'json' | 'csv' | 'prometheus' | 'grafana'>;
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
    accessControlRules: Array<{
        role: string;
        permissions: string[];
    }>;
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
    environment: 'development' | 'staging' | 'production';
    version: string;
    deploymentId: string;
    core: Config;
    taskEngine: TaskEngineConfig;
    autonomousQueue: AutonomousQueueConfig;
    monitoring: MonitoringConfig;
    persistence: PersistenceConfig;
    hookIntegration: HookIntegrationConfig;
    dependencies: DependencyConfig;
    security: SecurityConfig;
    development: DevelopmentConfig;
    runtime: {
        enableGracefulShutdown: boolean;
        shutdownTimeoutMs: number;
        enableHealthChecks: boolean;
        healthCheckInterval: number;
        enableAutoRecovery: boolean;
        maxRecoveryAttempts: number;
    };
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
export declare class TaskManagementConfigManager {
    private config;
    private configPath;
    private watchers;
    /**
     * Create default configuration for specified environment
     */
    static createDefaultConfig(environment: 'development' | 'staging' | 'production'): TaskManagementConfiguration;
    /**
     * Load configuration from file or create default
     */
    loadConfig(filePath: string, coreConfig: Config): Promise<TaskManagementConfiguration>;
    /**
     * Save current configuration to file
     */
    saveConfig(): Promise<void>;
    /**
     * Update configuration at runtime
     */
    updateConfig(updates: Partial<TaskManagementConfiguration>): Promise<void>;
    /**
     * Get current configuration
     */
    getConfig(): TaskManagementConfiguration;
    /**
     * Validate configuration
     */
    validateConfig(config: TaskManagementConfiguration): ConfigValidationResult;
    /**
     * Watch for configuration changes
     */
    onConfigChange(callback: (config: TaskManagementConfiguration) => void): () => void;
    /**
     * Generate configuration template for specific use case
     */
    static generateTemplate(useCase: 'minimal' | 'development' | 'production' | 'enterprise'): TaskManagementConfiguration;
    private static createMinimalTemplate;
    private static createEnterpriseTemplate;
    /**
     * Deep merge two objects
     */
    private deepMerge;
}
/**
 * Configuration utility functions
 */
export declare class ConfigUtils {
    /**
     * Export configuration to different formats
     */
    static exportConfig(config: TaskManagementConfiguration, format: 'json' | 'yaml' | 'env'): string;
    /**
     * Import configuration from different formats
     */
    static importConfig(data: string, format: 'json' | 'yaml' | 'env'): Partial<TaskManagementConfiguration>;
    /**
     * Validate configuration schema
     */
    static validateSchema(config: any): boolean;
    private static toYaml;
    private static fromYaml;
    private static toEnvFile;
    private static fromEnvFile;
}
