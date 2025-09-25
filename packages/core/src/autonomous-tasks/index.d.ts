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
export { AutonomousTaskManager } from './AutonomousTaskManager.js';
export type { AutonomousTaskManagerConfig, TaskCreationOptions, SystemStats, } from './AutonomousTaskManager.js';
export { ManagerEvent } from './AutonomousTaskManager.js';
export type { ITask, ITaskQueue, ITaskExecutionEngine, ITaskBreakdownStrategy, ITaskPersistence, ITaskStatusMonitor, IDependencyManager, TaskContext, TaskResult, TaskMetrics, TaskDependency, TaskFilter, TaskArtifact, StatusSummary, AlertCondition, AlertCallback, DependencyGraph, DependencyNode, DependencyEdge, DependencyValidation, GraphMetrics, ExecutionEngineStats, QueueStats, PersistenceStats, } from './interfaces/TaskInterfaces.js';
export { TaskPriority, TaskStatus, TaskType, } from './interfaces/TaskInterfaces.js';
export { PriorityTaskQueue } from './queue/PriorityTaskQueue.js';
export type { QueueConfig } from './queue/PriorityTaskQueue.js';
export { QueueEvent } from './queue/PriorityTaskQueue.js';
export { TaskExecutionEngine } from './engine/TaskExecutionEngine.js';
export type { EngineConfig, RetryConfig, ResourceLimits, MonitoringConfig, QueueProcessingSettings, } from './engine/TaskExecutionEngine.js';
export { EngineEvent } from './engine/TaskExecutionEngine.js';
export { TaskBreakdownEngine } from './breakdown/TaskBreakdownEngine.js';
export { BaseBreakdownStrategy, CodeGenerationBreakdownStrategy, AnalysisBreakdownStrategy, TestingBreakdownStrategy, } from './breakdown/TaskBreakdownEngine.js';
export type { ComplexityAnalysis, BreakdownResult, BreakdownValidation, ValidationIssue, TaskDependencyMapping, ComplexityFactor, } from './breakdown/TaskBreakdownEngine.js';
export { TaskPersistenceManager } from './persistence/TaskPersistenceManager.js';
export type { PersistenceConfig, BackupConfig, } from './persistence/TaskPersistenceManager.js';
export { TaskStatusMonitor } from './monitoring/TaskStatusMonitor.js';
export type { MonitorConfig, HealthCheckConfig, HealthScoreWeights, HealthThresholds, AlertingConfig, AlertSuppressionConfig, MaintenanceWindow, } from './monitoring/TaskStatusMonitor.js';
export { MonitorEvent } from './monitoring/TaskStatusMonitor.js';
export { DependencyManager } from './dependencies/DependencyManager.js';
export type { DependencyConfig, ParallelGroupingConfig, PerformanceConfig, DependencyResolution, } from './dependencies/DependencyManager.js';
export declare const AUTONOMOUS_TASK_SYSTEM_VERSION = "1.0.0";
export declare const SUPPORTED_TASK_TYPES: readonly [any, any, any, any, any, any, any, any, any, any, any, any];
export declare const DEFAULT_PRIORITY_ORDER: readonly [any, any, any, any, any];
/**
 * Factory function to create a pre-configured autonomous task manager
 * for common use cases
 */
export declare function createAutonomousTaskManager(preset?: 'development' | 'production' | 'testing'): AutonomousTaskManager;
/**
 * Utility function to validate task configuration
 */
export declare function validateTaskConfiguration(config: Partial<AutonomousTaskManagerConfig>): string[];
/**
 * Utility function to get recommended configuration for different environments
 */
export declare function getRecommendedConfiguration(environment: 'local' | 'development' | 'staging' | 'production', scale?: 'small' | 'medium' | 'large'): AutonomousTaskManagerConfig;
/**
 * Health check function for the autonomous task system
 */
export declare function performSystemHealthCheck(taskManager: AutonomousTaskManager): Promise<{
    healthy: boolean;
    score: number;
    issues: string[];
    recommendations: string[];
}>;
/**
 * Diagnostic information collection for troubleshooting
 */
export declare function collectDiagnosticInfo(taskManager: AutonomousTaskManager): Promise<{
    systemInfo: Record<string, unknown>;
    configuration: AutonomousTaskManagerConfig;
    statistics: SystemStats;
    debugInfo: Record<string, unknown>;
    healthCheck: Awaited<ReturnType<typeof performSystemHealthCheck>>;
    timestamp: Date;
}>;
/**
 * Export everything for convenience
 */
export default AutonomousTaskManager;
