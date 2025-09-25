/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * @fileoverview Comprehensive Task Management System Integration
 *
 * This module provides the complete task execution engine with intelligent
 * breakdown, autonomous execution, real-time monitoring, and cross-session
 * persistence integrated with the infinite-continue-stop-hook system.
 */
export { TaskManager, createTaskManager, type TaskManagerConfig, type AutonomousContext, type TaskExecutionStrategy, type AutonomousDecision } from './TaskManager.js';
export { TaskComplexity, TaskStatus, TaskPriority, TaskType, DependencyType, AgentCapability, SubagentTerminateMode, Task, TaskDependency, TaskBreakdown, TaskMetrics, TaskExecutionContext, TaskBreakdownAnalyzer, ContextState } from './TaskExecutionEngine.js';
export { TaskExecutionEngine } from './TaskExecutionEngine.complete.js';
export { TaskExecutionUtils } from './TaskExecutionEngine.utils.js';
export { TaskQueue, TaskPriority as QueueTaskPriority, TaskStatus as QueueTaskStatus, TaskCategory, DependencyType as QueueDependencyType } from './TaskQueue.js';
export { TaskManagementSystemIntegrator, SystemConfigFactory, createIntegratedTaskManagementSystem, type IntegratedSystemConfig, type SystemHealth, type SystemOperationResult } from './TaskManagementSystemIntegrator.js';
export { TaskManagementConfigManager, ConfigUtils, type TaskManagementConfiguration, type TaskEngineConfig, type AutonomousQueueConfig, type MonitoringConfig, type PersistenceConfig, type HookIntegrationConfig, type DependencyConfig, type SecurityConfig, type DevelopmentConfig, type ConfigValidationResult } from './TaskManagementConfig.js';
export { PriorityScheduler, SchedulingAlgorithm, type SchedulingContext, type SchedulingDecision } from './PriorityScheduler.js';
export { QueueOptimizer, OptimizationStrategy, type OptimizationRecommendation, type BatchOptimization } from './QueueOptimizer.js';
export { AutonomousTaskBreakdown, BreakdownStrategy, type TaskBreakdownResult, type ComplexityMetrics, type SubTask } from './AutonomousTaskBreakdown.js';
export { EnhancedAutonomousTaskQueue, type EnhancedQueueConfig, type AutonomousExecutionContext, type AutonomousQueueMetrics } from './EnhancedAutonomousTaskQueue.js';
export { ExecutionMonitoringSystem, ExecutionMetrics, TaskExecutionEvent, AlertConfig, BottleneckAnalysis, SystemHealthStatus } from './ExecutionMonitoringSystem.js';
export { InfiniteHookIntegration, TaskManagerAPI, HookIntegrationConfig } from './InfiniteHookIntegration.js';
import type { Config } from '../config/config.js';
import { TaskExecutionEngine } from './TaskExecutionEngine.complete.js';
import { ExecutionMonitoringSystem } from './ExecutionMonitoringSystem.js';
import { InfiniteHookIntegration } from './InfiniteHookIntegration.js';
import { EnhancedAutonomousTaskQueue, type EnhancedQueueConfig } from './EnhancedAutonomousTaskQueue.js';
/**
 * Complete Task Management System Factory
 *
 * Creates and configures the entire task management ecosystem with all components
 * properly integrated and ready for autonomous operation.
 */
export declare class TaskManagementSystemFactory {
    /**
     * Creates a complete task management system with all components integrated
     */
    static createComplete(config: Config, options?: {
        enableMonitoring?: boolean;
        enableHookIntegration?: boolean;
        hookIntegrationConfig?: any;
        monitoringConfig?: any;
    }): Promise<{
        taskEngine: TaskExecutionEngine;
        monitoring?: ExecutionMonitoringSystem;
        hookIntegration?: InfiniteHookIntegration;
        shutdown: () => Promise<void>;
    }>;
    /**
     * Creates a standalone task execution engine (for testing or simple use cases)
     */
    static createStandalone(config: Config): TaskExecutionEngine;
    /**
     * Creates monitoring system only
     */
    static createMonitoringOnly(config: Config): ExecutionMonitoringSystem;
    /**
     * Creates an autonomous task queue with intelligent breakdown and optimization
     */
    static createAutonomousQueue(config?: Partial<EnhancedQueueConfig>): EnhancedAutonomousTaskQueue;
    /**
     * Creates a complete system with autonomous task queue integration
     */
    static createCompleteWithAutonomousQueue(config: Config, queueConfig?: Partial<EnhancedQueueConfig>, options?: {
        enableMonitoring?: boolean;
        enableHookIntegration?: boolean;
        hookIntegrationConfig?: any;
        monitoringConfig?: any;
    }): Promise<{
        taskEngine: TaskExecutionEngine;
        autonomousQueue: EnhancedAutonomousTaskQueue;
        monitoring?: ExecutionMonitoringSystem;
        hookIntegration?: InfiniteHookIntegration;
        shutdown: () => Promise<void>;
    }>;
}
/**
 * Convenience function to create a complete task management system
 * (Uses new unified TaskManager for autonomous capabilities)
 */
export declare function createTaskManagementSystem(config: Config, options?: any): Promise<any>;
/**
 * Convenience function to create standalone task engine
 */
export declare function createTaskEngine(config: Config): TaskExecutionEngine;
/**
 * Convenience function to create autonomous task queue
 */
export declare function createAutonomousTaskQueue(config?: Partial<EnhancedQueueConfig>): EnhancedAutonomousTaskQueue;
/**
 * Convenience function to create complete system with autonomous queue
 */
export declare function createCompleteWithAutonomousQueue(config: Config, queueConfig?: Partial<EnhancedQueueConfig>, options?: any): Promise<{
    taskEngine: TaskExecutionEngine;
    autonomousQueue: EnhancedAutonomousTaskQueue;
    monitoring?: ExecutionMonitoringSystem;
    hookIntegration?: InfiniteHookIntegration;
    shutdown: () => Promise<void>;
}>;
/**
 * Example usage patterns and integration guides
 */
export declare const INTEGRATION_EXAMPLES: {
    /**
     * Basic usage example
     */
    basicUsage: string;
    /**
     * Advanced monitoring example
     */
    monitoringExample: string;
    /**
     * Hook integration example
     */
    hookIntegrationExample: string;
    /**
     * Autonomous task queue example
     */
    autonomousQueueExample: string;
    /**
     * Complete system with autonomous queue example
     */
    completeAutonomousExample: string;
};
