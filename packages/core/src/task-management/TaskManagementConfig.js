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
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
/**
 * Configuration manager for task management system
 */
export class TaskManagementConfigManager {
    config = null;
    configPath = null;
    watchers = [];
    /**
     * Create default configuration for specified environment
     */
    static createDefaultConfig(environment) {
        const baseConfig = {
            environment,
            version: '1.0.0',
            deploymentId: `deploy_${Date.now()}_${Math.random().toString(36).substring(7)}`,
            // Placeholder core config - should be provided by caller
            core: {},
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
    async loadConfig(filePath, coreConfig) {
        this.configPath = filePath;
        if (existsSync(filePath)) {
            try {
                const configData = readFileSync(filePath, 'utf8');
                const config = JSON.parse(configData);
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
            }
            catch (error) {
                console.error(`❌ Failed to load configuration from ${filePath}:`, error);
                console.log('🔄 Creating default configuration...');
                this.config =
                    TaskManagementConfigManager.createDefaultConfig('development');
                this.config.core = coreConfig;
                await this.saveConfig();
            }
        }
        else {
            console.log('📄 Configuration file not found, creating default...');
            this.config =
                TaskManagementConfigManager.createDefaultConfig('development');
            this.config.core = coreConfig;
            await this.saveConfig();
        }
        return this.config;
    }
    /**
     * Save current configuration to file
     */
    async saveConfig() {
        if (!this.config || !this.configPath) {
            throw new Error('No configuration or path specified');
        }
        try {
            // Ensure directory exists
            mkdirSync(dirname(this.configPath), { recursive: true });
            // Save configuration (excluding core config for security)
            const { core, ...configToSave } = this.config;
            writeFileSync(this.configPath, JSON.stringify(configToSave, null, 2), 'utf8');
            console.log(`✅ Configuration saved to ${this.configPath}`);
        }
        catch (error) {
            console.error(`❌ Failed to save configuration:`, error);
            throw error;
        }
    }
    /**
     * Update configuration at runtime
     */
    async updateConfig(updates) {
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
        this.watchers.forEach((watcher) => watcher(this.config));
    }
    /**
     * Get current configuration
     */
    getConfig() {
        if (!this.config) {
            throw new Error('No configuration loaded');
        }
        return { ...this.config };
    }
    /**
     * Validate configuration
     */
    validateConfig(config) {
        const errors = [];
        const warnings = [];
        const suggestions = [];
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
            if (config.autonomousQueue.breakdownThreshold < 0 ||
                config.autonomousQueue.breakdownThreshold > 1) {
                errors.push('Breakdown threshold must be between 0 and 1');
            }
            if (config.autonomousQueue.maxBreakdownDepth < 1 ||
                config.autonomousQueue.maxBreakdownDepth > 10) {
                warnings.push('Max breakdown depth should typically be between 1 and 10');
            }
        }
        // Validate monitoring config
        if (config.monitoring.enabled) {
            if (config.monitoring.dashboardPort < 1024 ||
                config.monitoring.dashboardPort > 65535) {
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
            if (config.persistence.encryptionEnabled &&
                !config.persistence.encryptionKey) {
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
    onConfigChange(callback) {
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
    static generateTemplate(useCase) {
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
    static createMinimalTemplate() {
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
    static createEnterpriseTemplate() {
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
    deepMerge(target, source) {
        const result = { ...target };
        for (const key in source) {
            const sourceValue = source[key];
            const targetValue = result[key];
            if (sourceValue !== undefined) {
                if (typeof sourceValue === 'object' &&
                    sourceValue !== null &&
                    typeof targetValue === 'object' &&
                    targetValue !== null &&
                    !Array.isArray(sourceValue) &&
                    !Array.isArray(targetValue)) {
                    result[key] = this.deepMerge(targetValue, sourceValue);
                }
                else {
                    result[key] = sourceValue;
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
    static exportConfig(config, format) {
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
    static importConfig(data, format) {
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
    static validateSchema(config) {
        // Basic schema validation
        const requiredFields = [
            'environment',
            'version',
            'taskEngine',
            'autonomousQueue',
            'monitoring',
        ];
        for (const field of requiredFields) {
            if (!(field in config)) {
                return false;
            }
        }
        return true;
    }
    static toYaml(obj) {
        // Simple YAML converter - in real implementation, use a proper YAML library
        return JSON.stringify(obj, null, 2)
            .replace(/"/g, '')
            .replace(/,$/gm, '')
            .replace(/^(\s*)"([^"]+)":/gm, '$1$2:');
    }
    static fromYaml(yaml) {
        // Simple YAML parser - in real implementation, use a proper YAML library
        throw new Error('YAML parsing not implemented - use a proper YAML library');
    }
    static toEnvFile(config) {
        const envVars = [];
        const flatten = (obj, prefix = '') => {
            for (const [key, value] of Object.entries(obj)) {
                const envKey = `${prefix}${key}`
                    .toUpperCase()
                    .replace(/[^A-Z0-9]/g, '_');
                if (typeof value === 'object' &&
                    value !== null &&
                    !Array.isArray(value)) {
                    flatten(value, `${envKey}_`);
                }
                else {
                    envVars.push(`${envKey}=${JSON.stringify(value)}`);
                }
            }
        };
        flatten(config, 'TASK_MANAGEMENT_');
        return envVars.join('\n');
    }
    static fromEnvFile(envData) {
        const config = {};
        const lines = envData
            .split('\n')
            .filter((line) => line.trim() && !line.startsWith('#'));
        for (const line of lines) {
            const [key, ...valueParts] = line.split('=');
            const value = valueParts.join('=');
            if (key.startsWith('TASK_MANAGEMENT_')) {
                const configKey = key.replace('TASK_MANAGEMENT_', '').toLowerCase();
                try {
                    config[configKey] = JSON.parse(value);
                }
                catch {
                    config[configKey] = value;
                }
            }
        }
        return config;
    }
}
//# sourceMappingURL=TaskManagementConfig.js.map