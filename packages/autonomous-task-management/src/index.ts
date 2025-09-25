/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

export { TaskManager } from './core/TaskManager';
export { TaskQueue } from './core/TaskQueue';
export { TaskExecutionEngine } from './core/TaskExecutionEngine';
export { TaskPersistence } from './core/TaskPersistence';
export { AgentCoordinator } from './core/AgentCoordinator';
export { QualityGateway } from './core/QualityGateway';
export { FeatureIntegrator } from './core/FeatureIntegrator';
export { MonitoringService } from './core/MonitoringService';

// Core Types and Interfaces
export * from './types/Task';
export * from './types/Agent';
export * from './types/Feature';
export * from './types/Queue';
export * from './types/Execution';
export * from './types/Monitoring';

// Event System
export { EventBus } from './events/EventBus';
export { TaskEvents } from './events/TaskEvents';

// Utility Classes
export { Logger } from './utils/Logger';
export { Validator } from './utils/Validator';
export { ConfigManager } from './utils/ConfigManager';
export { MetricsCollector } from './utils/MetricsCollector';

// Plugin System
export { PluginRegistry } from './plugins/PluginRegistry';
export { BasePlugin } from './plugins/BasePlugin';

// Constants
export * from './constants';

/**
 * Initialize the Autonomous Task Management System
 *
 * @param config - System configuration options
 * @returns Promise resolving to initialized TaskManager instance
 *
 * @example
 * ```typescript
 * import { initializeATMS } from '@google/autonomous-task-management';
 *
 * const taskManager = await initializeATMS({
 *   persistenceConfig: {
 *     type: 'file',
 *     path: './data/tasks.json'
 *   },
 *   logging: {
 *     level: 'info',
 *     output: 'console'
 *   }
 * });
 *
 * // Create and execute a new task
 * const task = await taskManager.createTask({
 *   title: 'Implement user authentication',
 *   description: 'Add complete user auth system with JWT tokens',
 *   priority: 'high',
 *   category: 'feature'
 * });
 * ```
 */
export async function initializeATMS(config: SystemConfig): Promise<TaskManager> {
  const logger = new Logger(config.logging);
  logger.info('Initializing Autonomous Task Management System', { version: '3.0.0' });

  try {
    // Initialize core components
    const taskManager = new TaskManager(config, logger);
    await taskManager.initialize();

    logger.info('ATMS initialization completed successfully');
    return taskManager;

  } catch (error) {
    logger.error('ATMS initialization failed', { error: (error as Error).message });
    throw error;
  }
}

/**
 * System configuration interface
 */
export interface SystemConfig {
  /** Persistence configuration */
  persistenceConfig: {
    type: 'file' | 'database' | 'memory';
    path?: string;
    connectionString?: string;
  };

  /** Logging configuration */
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
    output: 'console' | 'file';
    filePath?: string;
  };

  /** Agent coordination settings */
  agentConfig?: {
    maxConcurrentAgents: number;
    heartbeatInterval: number;
    sessionTimeout: number;
  };

  /** Quality gates configuration */
  qualityConfig?: {
    enableLinting: boolean;
    enableTesting: boolean;
    enableSecurity: boolean;
    enablePerformance: boolean;
  };

  /** Feature integration settings */
  featureConfig?: {
    featuresFilePath: string;
    requireApproval: boolean;
    autoRejectTimeout: number;
  };

  /** Monitoring configuration */
  monitoring?: {
    enableMetrics: boolean;
    metricsInterval: number;
    alertThresholds: Record<string, number>;
  };
}

/**
 * Default system configuration
 */
export const DEFAULT_CONFIG: SystemConfig = {
  persistenceConfig: {
    type: 'file',
    path: './data/tasks.json'
  },
  logging: {
    level: 'info',
    output: 'console'
  },
  agentConfig: {
    maxConcurrentAgents: 10,
    heartbeatInterval: 30000, // 30 seconds
    sessionTimeout: 300000 // 5 minutes
  },
  qualityConfig: {
    enableLinting: true,
    enableTesting: true,
    enableSecurity: true,
    enablePerformance: true
  },
  featureConfig: {
    featuresFilePath: './FEATURES.json',
    requireApproval: true,
    autoRejectTimeout: 604800000 // 7 days
  },
  monitoring: {
    enableMetrics: true,
    metricsInterval: 60000, // 1 minute
    alertThresholds: {
      taskQueueSize: 100,
      avgExecutionTime: 300000, // 5 minutes
      failureRate: 0.1 // 10%
    }
  }
};