/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type {
  AgentCapability,
  TaskPriority,
} from '../services/autonomousTaskIntegrator.js';
import type { IntegrationConfig } from '../services/integrationBridge.js';
export interface AutonomousTaskSettings {
  enabled: boolean;
  maxConcurrentTasks: number;
  taskTimeoutMinutes: number;
  enableCrossSessionPersistence: boolean;
  enableRealTimeUpdates: boolean;
  taskManagerApiPath: string;
  taskManagerApiTimeout: number;
  projectRoot: string;
  agentHeartbeatInterval: number;
  maxAgentsPerTask: number;
  defaultAgentCapabilities: AgentCapability[];
  agentPerformanceTracking: boolean;
  taskSyncInterval: number;
  priorityWeighting: Record<TaskPriority, number>;
  dependencyResolution: 'strict' | 'relaxed';
  autoTaskCreationFromFeatures: boolean;
  cliCommandsIntegration: boolean;
  autoStartTaskProcessing: boolean;
  enableCliContextPassing: boolean;
  apiServerEnabled: boolean;
  apiServerPort: number;
  apiServerHost: string;
  enableApiAuthentication: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  enableTaskMetrics: boolean;
  enablePerformanceMonitoring: boolean;
  metricsRetentionDays: number;
  experimentalFeatures: {
    aiTaskGeneration: boolean;
    dynamicPrioritization: boolean;
    predictiveScheduling: boolean;
    crossProjectTasks: boolean;
  };
}
export interface EnvironmentOverrides {
  GEMINI_AUTONOMOUS_TASKS_ENABLED?: string;
  GEMINI_TASK_MANAGER_PATH?: string;
  GEMINI_MAX_CONCURRENT_TASKS?: string;
  GEMINI_AGENT_HEARTBEAT_INTERVAL?: string;
  GEMINI_CLI_INTEGRATION?: string;
  GEMINI_API_SERVER_PORT?: string;
  GEMINI_LOG_LEVEL?: string;
}
/**
 * Configuration manager for autonomous task management
 */
export declare class AutonomousTaskConfigManager {
  private config;
  private configPath;
  private watchers;
  constructor(configPath?: string);
  /**
   * Get the current configuration
   */
  getConfig(): AutonomousTaskSettings;
  /**
   * Get configuration for IntegrationBridge
   */
  getIntegrationConfig(): IntegrationConfig;
  /**
   * Update configuration settings
   */
  updateConfig(updates: Partial<AutonomousTaskSettings>): void;
  /**
   * Reset configuration to defaults
   */
  resetToDefaults(): void;
  /**
   * Watch for configuration changes
   */
  watch(callback: (config: AutonomousTaskSettings) => void): () => void;
  /**
   * Validate configuration values
   */
  validateConfig(): void;
  private loadConfig;
  private saveConfig;
  private applyEnvironmentOverrides;
  private validateConfigStatic;
  private notifyWatchers;
  private getDefaultConfigPath;
}
/**
 * Global configuration manager instance
 */
export declare const autonomousTaskConfig: AutonomousTaskConfigManager;
/**
 * Convenience functions for common configuration operations
 */
export declare function getAutonomousTaskConfig(): AutonomousTaskSettings;
export declare function updateAutonomousTaskConfig(
  updates: Partial<AutonomousTaskSettings>,
): void;
export declare function getIntegrationConfig(): IntegrationConfig;
export declare function watchConfigChanges(
  callback: (config: AutonomousTaskSettings) => void,
): () => void;
