/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Autonomous Task Management Configuration System
 *
 * Centralized configuration management for all autonomous task management features
 * with environment-based overrides and validation.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
const DEFAULT_CONFIG = {
    // Core system settings
    enabled: true,
    maxConcurrentTasks: 10,
    taskTimeoutMinutes: 60,
    enableCrossSessionPersistence: true,
    enableRealTimeUpdates: true,
    // TaskManager API integration
    taskManagerApiPath: '/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js',
    taskManagerApiTimeout: 10000,
    projectRoot: process.cwd(),
    // Agent configuration
    agentHeartbeatInterval: 30000,
    maxAgentsPerTask: 3,
    defaultAgentCapabilities: ['general'],
    agentPerformanceTracking: true,
    // Task queue configuration
    taskSyncInterval: 60000,
    priorityWeighting: {
        critical: 10,
        high: 5,
        normal: 2,
        low: 1,
    },
    dependencyResolution: 'strict',
    autoTaskCreationFromFeatures: true,
    // CLI integration
    cliCommandsIntegration: true,
    autoStartTaskProcessing: true,
    enableCliContextPassing: true,
    // API server configuration
    apiServerEnabled: false,
    apiServerPort: 3001,
    apiServerHost: 'localhost',
    enableApiAuthentication: false,
    // Logging and monitoring
    logLevel: 'info',
    enableTaskMetrics: true,
    enablePerformanceMonitoring: true,
    metricsRetentionDays: 30,
    // Feature flags
    experimentalFeatures: {
        aiTaskGeneration: false,
        dynamicPrioritization: true,
        predictiveScheduling: false,
        crossProjectTasks: false,
    },
};
/**
 * Configuration manager for autonomous task management
 */
export class AutonomousTaskConfigManager {
    config;
    configPath;
    watchers = new Set();
    constructor(configPath) {
        this.configPath = configPath || this.getDefaultConfigPath();
        this.config = this.loadConfig();
    }
    /**
     * Get the current configuration
     */
    getConfig() {
        return { ...this.config };
    }
    /**
     * Get configuration for IntegrationBridge
     */
    getIntegrationConfig() {
        return {
            taskManagerApiPath: this.config.taskManagerApiPath,
            projectRoot: this.config.projectRoot,
            enableCrossSessionPersistence: this.config.enableCrossSessionPersistence,
            enableRealTimeUpdates: this.config.enableRealTimeUpdates,
            agentHeartbeatInterval: this.config.agentHeartbeatInterval,
            taskSyncInterval: this.config.taskSyncInterval,
            cliCommandsIntegration: this.config.cliCommandsIntegration,
            autoStartTaskProcessing: this.config.autoStartTaskProcessing,
            maxConcurrentTasks: this.config.maxConcurrentTasks,
        };
    }
    /**
     * Update configuration settings
     */
    updateConfig(updates) {
        const previousConfig = { ...this.config };
        // Merge updates with current config
        this.config = {
            ...this.config,
            ...updates,
            // Handle nested objects specially
            experimentalFeatures: {
                ...this.config.experimentalFeatures,
                ...(updates.experimentalFeatures || {}),
            },
            priorityWeighting: {
                ...this.config.priorityWeighting,
                ...(updates.priorityWeighting || {}),
            },
        };
        // Validate the updated configuration
        this.validateConfig();
        // Save to disk
        this.saveConfig();
        // Notify watchers of changes
        this.notifyWatchers();
        console.log('✅ Autonomous task configuration updated');
    }
    /**
     * Reset configuration to defaults
     */
    resetToDefaults() {
        this.config = { ...DEFAULT_CONFIG };
        this.saveConfig();
        this.notifyWatchers();
        console.log('🔄 Autonomous task configuration reset to defaults');
    }
    /**
     * Watch for configuration changes
     */
    watch(callback) {
        this.watchers.add(callback);
        // Return unwatch function
        return () => {
            this.watchers.delete(callback);
        };
    }
    /**
     * Validate configuration values
     */
    validateConfig() {
        const errors = [];
        // Validate numeric ranges
        if (this.config.maxConcurrentTasks < 1 || this.config.maxConcurrentTasks > 100) {
            errors.push('maxConcurrentTasks must be between 1 and 100');
        }
        if (this.config.taskTimeoutMinutes < 1 || this.config.taskTimeoutMinutes > 1440) {
            errors.push('taskTimeoutMinutes must be between 1 and 1440 (24 hours)');
        }
        if (this.config.agentHeartbeatInterval < 1000 || this.config.agentHeartbeatInterval > 300000) {
            errors.push('agentHeartbeatInterval must be between 1000ms and 300000ms (5 minutes)');
        }
        if (this.config.apiServerPort < 1024 || this.config.apiServerPort > 65535) {
            errors.push('apiServerPort must be between 1024 and 65535');
        }
        // Validate file paths exist
        if (!existsSync(dirname(this.config.taskManagerApiPath))) {
            errors.push(`taskManagerApiPath directory does not exist: ${dirname(this.config.taskManagerApiPath)}`);
        }
        if (!existsSync(this.config.projectRoot)) {
            errors.push(`projectRoot does not exist: ${this.config.projectRoot}`);
        }
        // Validate enum values
        const validLogLevels = ['debug', 'info', 'warn', 'error'];
        if (!validLogLevels.includes(this.config.logLevel)) {
            errors.push(`logLevel must be one of: ${validLogLevels.join(', ')}`);
        }
        const validDependencyResolution = ['strict', 'relaxed'];
        if (!validDependencyResolution.includes(this.config.dependencyResolution)) {
            errors.push(`dependencyResolution must be one of: ${validDependencyResolution.join(', ')}`);
        }
        if (errors.length > 0) {
            throw new Error(`Configuration validation failed:\n${errors.map(e => `  - ${e}`).join('\n')}`);
        }
    }
    // Private methods
    loadConfig() {
        let config = { ...DEFAULT_CONFIG };
        // Load from config file if it exists
        if (existsSync(this.configPath)) {
            try {
                const fileContent = readFileSync(this.configPath, 'utf8');
                const fileConfig = JSON.parse(fileContent);
                config = {
                    ...config,
                    ...fileConfig,
                    // Handle nested objects
                    experimentalFeatures: {
                        ...config.experimentalFeatures,
                        ...(fileConfig.experimentalFeatures || {}),
                    },
                    priorityWeighting: {
                        ...config.priorityWeighting,
                        ...(fileConfig.priorityWeighting || {}),
                    },
                };
                console.log(`📖 Loaded autonomous task configuration from ${this.configPath}`);
            }
            catch (error) {
                console.warn(`⚠️ Failed to load config from ${this.configPath}, using defaults:`, error);
            }
        }
        // Apply environment overrides
        config = this.applyEnvironmentOverrides(config);
        // Validate the loaded configuration
        try {
            this.validateConfigStatic(config);
        }
        catch (error) {
            console.warn('⚠️ Configuration validation failed, using defaults:', error);
            config = { ...DEFAULT_CONFIG };
        }
        return config;
    }
    saveConfig() {
        try {
            // Ensure config directory exists
            const configDir = dirname(this.configPath);
            if (!existsSync(configDir)) {
                mkdirSync(configDir, { recursive: true });
            }
            // Write configuration to file
            const configJson = JSON.stringify(this.config, null, 2);
            writeFileSync(this.configPath, configJson, 'utf8');
            console.log(`💾 Saved autonomous task configuration to ${this.configPath}`);
        }
        catch (error) {
            console.error(`❌ Failed to save configuration to ${this.configPath}:`, error);
        }
    }
    applyEnvironmentOverrides(config) {
        const env = process.env;
        if (env.GEMINI_AUTONOMOUS_TASKS_ENABLED !== undefined) {
            config.enabled = env.GEMINI_AUTONOMOUS_TASKS_ENABLED.toLowerCase() === 'true';
        }
        if (env.GEMINI_TASK_MANAGER_PATH !== undefined) {
            config.taskManagerApiPath = env.GEMINI_TASK_MANAGER_PATH;
        }
        if (env.GEMINI_MAX_CONCURRENT_TASKS !== undefined) {
            const value = parseInt(env.GEMINI_MAX_CONCURRENT_TASKS, 10);
            if (!isNaN(value) && value > 0) {
                config.maxConcurrentTasks = value;
            }
        }
        if (env.GEMINI_AGENT_HEARTBEAT_INTERVAL !== undefined) {
            const value = parseInt(env.GEMINI_AGENT_HEARTBEAT_INTERVAL, 10);
            if (!isNaN(value) && value > 0) {
                config.agentHeartbeatInterval = value;
            }
        }
        if (env.GEMINI_CLI_INTEGRATION !== undefined) {
            config.cliCommandsIntegration = env.GEMINI_CLI_INTEGRATION.toLowerCase() === 'true';
        }
        if (env.GEMINI_API_SERVER_PORT !== undefined) {
            const value = parseInt(env.GEMINI_API_SERVER_PORT, 10);
            if (!isNaN(value) && value > 1023 && value < 65536) {
                config.apiServerPort = value;
            }
        }
        if (env.GEMINI_LOG_LEVEL !== undefined) {
            const validLevels = ['debug', 'info', 'warn', 'error'];
            if (validLevels.includes(env.GEMINI_LOG_LEVEL.toLowerCase())) {
                config.logLevel = env.GEMINI_LOG_LEVEL.toLowerCase();
            }
        }
        return config;
    }
    validateConfigStatic(config) {
        // Create temporary instance to use validation method
        const tempManager = Object.create(AutonomousTaskConfigManager.prototype);
        tempManager.config = config;
        tempManager.validateConfig();
    }
    notifyWatchers() {
        for (const callback of this.watchers) {
            try {
                callback(this.config);
            }
            catch (error) {
                console.error('❌ Error in configuration watcher callback:', error);
            }
        }
    }
    getDefaultConfigPath() {
        const homeDir = process.env.HOME || process.env.USERPROFILE || process.cwd();
        return join(homeDir, '.gemini', 'autonomous-tasks.config.json');
    }
}
/**
 * Global configuration manager instance
 */
export const autonomousTaskConfig = new AutonomousTaskConfigManager();
/**
 * Convenience functions for common configuration operations
 */
export function getAutonomousTaskConfig() {
    return autonomousTaskConfig.getConfig();
}
export function updateAutonomousTaskConfig(updates) {
    autonomousTaskConfig.updateConfig(updates);
}
export function getIntegrationConfig() {
    return autonomousTaskConfig.getIntegrationConfig();
}
export function watchConfigChanges(callback) {
    return autonomousTaskConfig.watch(callback);
}
//# sourceMappingURL=autonomousTaskConfig.js.map