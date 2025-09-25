/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Autonomous Task Management System for Gemini CLI
 *
 * A comprehensive autonomous task management system that transforms Gemini CLI
 * from a reactive assistant into a proactive autonomous development partner.
 *
 * Core Features:
 * - Self-managing task queues with priority-based scheduling
 * - Autonomous task breakdown and decomposition algorithms
 * - Intelligent task execution engine with resource management
 * - Cross-session task persistence and recovery
 * - Real-time status monitoring and alerting system
 * - Intelligent dependency management and sequencing
 * - Performance optimization and resource utilization
 * - Event-driven architecture for seamless integration
 *
 * Architecture Overview:
 * - AutonomousTaskManager: Central coordinator and high-level API
 * - PriorityTaskQueue: Self-managing priority-based task queues
 * - TaskExecutionEngine: Concurrent task execution with resource limits
 * - TaskBreakdownEngine: Intelligent task decomposition strategies
 * - TaskPersistenceManager: Cross-session storage and backup
 * - TaskStatusMonitor: Real-time monitoring and health tracking
 * - DependencyManager: Intelligent task sequencing and optimization
 *
 * Usage:
 * ```typescript
 * import { AutonomousTaskManager, TaskType, TaskPriority } from '@google/gemini-cli-core/autonomous-tasks';
 *
 * const taskManager = new AutonomousTaskManager({
 *   enableAutonomousProcessing: true,
 *   execution: { maxConcurrentTasks: 5 },
 *   persistence: { enabled: true },
 *   monitoring: { enabled: true }
 * });
 *
 * await taskManager.start();
 *
 * const taskId = await taskManager.createTask(
 *   'Generate API Documentation',
 *   'Create comprehensive API documentation for the user service',
 *   TaskType.DOCUMENTATION,
 *   { outputFormat: 'markdown', includeExamples: true },
 *   { priority: TaskPriority.HIGH, autoBreakdown: true }
 * );
 *
 * const stats = await taskManager.getSystemStats();
 * console.log(`System health: ${stats.healthScore}%`);
 * ```
 */

// Main autonomous task manager
export { AutonomousTaskManager } from './AutonomousTaskManager.js';
export type {
  AutonomousTaskManagerConfig,
  TaskCreationOptions,
  SystemStats,
} from './AutonomousTaskManager.js';
export { ManagerEvent } from './AutonomousTaskManager.js';

// Core interfaces and types
export type {
  ITask,
  ITaskQueue,
  ITaskExecutionEngine,
  ITaskBreakdownStrategy,
  ITaskPersistence,
  ITaskStatusMonitor,
  IDependencyManager,
  TaskContext,
  TaskResult,
  TaskMetrics,
  TaskDependency,
  TaskFilter,
  TaskArtifact,
  StatusSummary,
  AlertCondition,
  AlertCallback,
  DependencyGraph,
  DependencyNode,
  DependencyEdge,
  DependencyValidation,
  GraphMetrics,
  ExecutionEngineStats,
  QueueStats,
  PersistenceStats,
} from './interfaces/TaskInterfaces.js';

export {
  TaskPriority,
  TaskStatus,
  TaskType,
} from './interfaces/TaskInterfaces.js';

// Task queue implementation
export { PriorityTaskQueue } from './queue/PriorityTaskQueue.js';
export type { QueueConfig } from './queue/PriorityTaskQueue.js';
export { QueueEvent } from './queue/PriorityTaskQueue.js';

// Task execution engine
export { TaskExecutionEngine } from './engine/TaskExecutionEngine.js';
export type {
  EngineConfig,
  RetryConfig,
  ResourceLimits,
  MonitoringConfig,
  QueueProcessingSettings,
} from './engine/TaskExecutionEngine.js';
export { EngineEvent } from './engine/TaskExecutionEngine.js';

// Task breakdown engine
export { TaskBreakdownEngine } from './breakdown/TaskBreakdownEngine.js';
export {
  BaseBreakdownStrategy,
  CodeGenerationBreakdownStrategy,
  AnalysisBreakdownStrategy,
  TestingBreakdownStrategy,
} from './breakdown/TaskBreakdownEngine.js';
export type {
  ComplexityAnalysis,
  BreakdownResult,
  BreakdownValidation,
  ValidationIssue,
  TaskDependencyMapping,
  ComplexityFactor,
} from './breakdown/TaskBreakdownEngine.js';

// Task persistence
export { TaskPersistenceManager } from './persistence/TaskPersistenceManager.js';
export type {
  PersistenceConfig,
  BackupConfig,
} from './persistence/TaskPersistenceManager.js';

// Status monitoring
export { TaskStatusMonitor } from './monitoring/TaskStatusMonitor.js';
export type {
  MonitorConfig,
  HealthCheckConfig,
  HealthScoreWeights,
  HealthThresholds,
  AlertingConfig,
  AlertSuppressionConfig,
  MaintenanceWindow,
} from './monitoring/TaskStatusMonitor.js';
export { MonitorEvent } from './monitoring/TaskStatusMonitor.js';

// Dependency management
export { DependencyManager } from './dependencies/DependencyManager.js';
export type {
  DependencyConfig,
  ParallelGroupingConfig,
  PerformanceConfig,
  DependencyResolution,
} from './dependencies/DependencyManager.js';

// Utility types and constants
export const AUTONOMOUS_TASK_SYSTEM_VERSION = '1.0.0';
export const SUPPORTED_TASK_TYPES = [
  TaskType.CODE_GENERATION,
  TaskType.CODE_ANALYSIS,
  TaskType.TESTING,
  TaskType.DOCUMENTATION,
  TaskType.BUILD,
  TaskType.DEPLOYMENT,
  TaskType.REFACTORING,
  TaskType.BUG_FIX,
  TaskType.FEATURE,
  TaskType.MAINTENANCE,
  TaskType.SECURITY,
  TaskType.PERFORMANCE,
] as const;

export const DEFAULT_PRIORITY_ORDER = [
  TaskPriority.CRITICAL,
  TaskPriority.HIGH,
  TaskPriority.MEDIUM,
  TaskPriority.LOW,
  TaskPriority.BACKGROUND,
] as const;

/**
 * Factory function to create a pre-configured autonomous task manager
 * for common use cases
 */
export function createAutonomousTaskManager(preset: 'development' | 'production' | 'testing' = 'development'): AutonomousTaskManager {
  const configs = {
    development: {
      enableAutonomousProcessing: true,
      breakdown: { enabled: true, complexityThreshold: 3, maxSubtasks: 5 },
      execution: { maxConcurrentTasks: 3, defaultTimeout: 180000, retryAttempts: 2 },
      persistence: { enabled: true, baseDirectory: './dev-autonomous-tasks', enableBackups: false },
      monitoring: { enabled: true, updateInterval: 15000, enableAlerts: false },
      dependencies: { enabled: true, enableOptimization: true, maxDepth: 10 },
    },
    production: {
      enableAutonomousProcessing: true,
      breakdown: { enabled: true, complexityThreshold: 5, maxSubtasks: 10 },
      execution: { maxConcurrentTasks: 8, defaultTimeout: 600000, retryAttempts: 3 },
      persistence: { enabled: true, baseDirectory: './autonomous-tasks', enableBackups: true },
      monitoring: { enabled: true, updateInterval: 5000, enableAlerts: true },
      dependencies: { enabled: true, enableOptimization: true, maxDepth: 20 },
    },
    testing: {
      enableAutonomousProcessing: true,
      breakdown: { enabled: false, complexityThreshold: 10, maxSubtasks: 3 },
      execution: { maxConcurrentTasks: 2, defaultTimeout: 30000, retryAttempts: 1 },
      persistence: { enabled: false, baseDirectory: './test-autonomous-tasks', enableBackups: false },
      monitoring: { enabled: false, updateInterval: 30000, enableAlerts: false },
      dependencies: { enabled: true, enableOptimization: false, maxDepth: 5 },
    },
  };

  return new AutonomousTaskManager(configs[preset]);
}

/**
 * Utility function to validate task configuration
 */
export function validateTaskConfiguration(config: Partial<AutonomousTaskManagerConfig>): string[] {
  const errors: string[] = [];

  if (config.execution?.maxConcurrentTasks !== undefined) {
    if (config.execution.maxConcurrentTasks < 1) {
      errors.push('maxConcurrentTasks must be at least 1');
    }
    if (config.execution.maxConcurrentTasks > 20) {
      errors.push('maxConcurrentTasks should not exceed 20 for optimal performance');
    }
  }

  if (config.execution?.defaultTimeout !== undefined) {
    if (config.execution.defaultTimeout < 1000) {
      errors.push('defaultTimeout should be at least 1000ms');
    }
    if (config.execution.defaultTimeout > 3600000) {
      errors.push('defaultTimeout should not exceed 1 hour (3600000ms)');
    }
  }

  if (config.breakdown?.complexityThreshold !== undefined) {
    if (config.breakdown.complexityThreshold < 1 || config.breakdown.complexityThreshold > 10) {
      errors.push('complexityThreshold must be between 1 and 10');
    }
  }

  if (config.breakdown?.maxSubtasks !== undefined) {
    if (config.breakdown.maxSubtasks < 1) {
      errors.push('maxSubtasks must be at least 1');
    }
    if (config.breakdown.maxSubtasks > 50) {
      errors.push('maxSubtasks should not exceed 50 to avoid excessive fragmentation');
    }
  }

  if (config.dependencies?.maxDepth !== undefined) {
    if (config.dependencies.maxDepth < 1) {
      errors.push('dependency maxDepth must be at least 1');
    }
    if (config.dependencies.maxDepth > 100) {
      errors.push('dependency maxDepth should not exceed 100 to prevent infinite recursion');
    }
  }

  if (config.monitoring?.updateInterval !== undefined) {
    if (config.monitoring.updateInterval < 1000) {
      errors.push('monitoring updateInterval should be at least 1000ms to avoid performance issues');
    }
  }

  return errors;
}

/**
 * Utility function to get recommended configuration for different environments
 */
export function getRecommendedConfiguration(
  environment: 'local' | 'development' | 'staging' | 'production',
  scale: 'small' | 'medium' | 'large' = 'medium'
): AutonomousTaskManagerConfig {
  const scaleMultipliers = {
    small: { concurrent: 1, timeout: 0.5, subtasks: 0.5 },
    medium: { concurrent: 1, timeout: 1, subtasks: 1 },
    large: { concurrent: 2, timeout: 2, subtasks: 1.5 },
  };

  const multiplier = scaleMultipliers[scale];

  const baseConfigs = {
    local: {
      enableAutonomousProcessing: true,
      breakdown: {
        enabled: true,
        complexityThreshold: 4,
        maxSubtasks: Math.ceil(5 * multiplier.subtasks),
      },
      execution: {
        maxConcurrentTasks: Math.ceil(2 * multiplier.concurrent),
        defaultTimeout: Math.ceil(120000 * multiplier.timeout),
        retryAttempts: 2,
      },
      persistence: {
        enabled: false,
        baseDirectory: './local-autonomous-tasks',
        enableBackups: false,
      },
      monitoring: {
        enabled: false,
        updateInterval: 30000,
        enableAlerts: false,
      },
      dependencies: {
        enabled: true,
        enableOptimization: false,
        maxDepth: 8,
      },
    },
    development: {
      enableAutonomousProcessing: true,
      breakdown: {
        enabled: true,
        complexityThreshold: 3,
        maxSubtasks: Math.ceil(7 * multiplier.subtasks),
      },
      execution: {
        maxConcurrentTasks: Math.ceil(3 * multiplier.concurrent),
        defaultTimeout: Math.ceil(300000 * multiplier.timeout),
        retryAttempts: 2,
      },
      persistence: {
        enabled: true,
        baseDirectory: './dev-autonomous-tasks',
        enableBackups: false,
      },
      monitoring: {
        enabled: true,
        updateInterval: 15000,
        enableAlerts: false,
      },
      dependencies: {
        enabled: true,
        enableOptimization: true,
        maxDepth: 12,
      },
    },
    staging: {
      enableAutonomousProcessing: true,
      breakdown: {
        enabled: true,
        complexityThreshold: 4,
        maxSubtasks: Math.ceil(8 * multiplier.subtasks),
      },
      execution: {
        maxConcurrentTasks: Math.ceil(5 * multiplier.concurrent),
        defaultTimeout: Math.ceil(450000 * multiplier.timeout),
        retryAttempts: 3,
      },
      persistence: {
        enabled: true,
        baseDirectory: './staging-autonomous-tasks',
        enableBackups: true,
      },
      monitoring: {
        enabled: true,
        updateInterval: 10000,
        enableAlerts: true,
      },
      dependencies: {
        enabled: true,
        enableOptimization: true,
        maxDepth: 15,
      },
    },
    production: {
      enableAutonomousProcessing: true,
      breakdown: {
        enabled: true,
        complexityThreshold: 5,
        maxSubtasks: Math.ceil(10 * multiplier.subtasks),
      },
      execution: {
        maxConcurrentTasks: Math.ceil(8 * multiplier.concurrent),
        defaultTimeout: Math.ceil(600000 * multiplier.timeout),
        retryAttempts: 3,
      },
      persistence: {
        enabled: true,
        baseDirectory: './autonomous-tasks',
        enableBackups: true,
      },
      monitoring: {
        enabled: true,
        updateInterval: 5000,
        enableAlerts: true,
      },
      dependencies: {
        enabled: true,
        enableOptimization: true,
        maxDepth: 20,
      },
    },
  };

  return baseConfigs[environment];
}

/**
 * Health check function for the autonomous task system
 */
export async function performSystemHealthCheck(taskManager: AutonomousTaskManager): Promise<{
  healthy: boolean;
  score: number;
  issues: string[];
  recommendations: string[];
}> {
  const issues: string[] = [];
  const recommendations: string[] = [];

  try {
    const stats = await taskManager.getSystemStats();
    const debugInfo = await taskManager.getDebugInfo();

    // Check health score
    if (stats.healthScore < 50) {
      issues.push(`Low system health score: ${stats.healthScore}%`);
      recommendations.push('Review failed tasks and system performance metrics');
    }

    // Check active task ratio
    const activeRatio = stats.activeTasks / (stats.totalTasks || 1);
    if (activeRatio > 0.8) {
      issues.push(`High active task ratio: ${(activeRatio * 100).toFixed(1)}%`);
      recommendations.push('Consider increasing concurrent task limits or optimizing task execution');
    }

    // Check failure rate
    const failureRate = stats.failedTasks / (stats.totalTasks || 1);
    if (failureRate > 0.2) {
      issues.push(`High failure rate: ${(failureRate * 100).toFixed(1)}%`);
      recommendations.push('Investigate common failure patterns and improve error handling');
    }

    // Check average execution time
    if (stats.averageExecutionTime > 600000) { // 10 minutes
      issues.push(`High average execution time: ${(stats.averageExecutionTime / 1000).toFixed(1)}s`);
      recommendations.push('Optimize task execution or enable task breakdown for complex tasks');
    }

    // Check queue health
    if (stats.queueStats.totalQueuedTasks > stats.queueStats.totalQueues * 100) {
      issues.push('High queue congestion detected');
      recommendations.push('Consider adding more execution capacity or optimizing task priorities');
    }

    // Check persistence health
    if (stats.persistenceStats.cacheHitRate < 50) {
      issues.push(`Low persistence cache hit rate: ${stats.persistenceStats.cacheHitRate.toFixed(1)}%`);
      recommendations.push('Review cache configuration and task access patterns');
    }

    const healthy = issues.length === 0 && stats.healthScore >= 80;

    return {
      healthy,
      score: stats.healthScore,
      issues,
      recommendations,
    };

  } catch (error) {
    issues.push(`Health check failed: ${error instanceof Error ? error.message : String(error)}`);
    recommendations.push('Check system logs and ensure all components are properly initialized');

    return {
      healthy: false,
      score: 0,
      issues,
      recommendations,
    };
  }
}

/**
 * Diagnostic information collection for troubleshooting
 */
export async function collectDiagnosticInfo(taskManager: AutonomousTaskManager): Promise<{
  systemInfo: Record<string, unknown>;
  configuration: AutonomousTaskManagerConfig;
  statistics: SystemStats;
  debugInfo: Record<string, unknown>;
  healthCheck: Awaited<ReturnType<typeof performSystemHealthCheck>>;
  timestamp: Date;
}> {
  const timestamp = new Date();

  const systemInfo = {
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage(),
    cpuUsage: process.cpuUsage(),
    pid: process.pid,
    cwd: process.cwd(),
  };

  const configuration = taskManager.getConfig();
  const statistics = await taskManager.getSystemStats();
  const debugInfo = await taskManager.getDebugInfo();
  const healthCheck = await performSystemHealthCheck(taskManager);

  return {
    systemInfo,
    configuration,
    statistics,
    debugInfo,
    healthCheck,
    timestamp,
  };
}

/**
 * Export everything for convenience
 */
export default AutonomousTaskManager;