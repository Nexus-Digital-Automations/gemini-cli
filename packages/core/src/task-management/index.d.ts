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
export { TaskComplexity, TaskStatus, TaskPriority, TaskType, DependencyType, AgentCapability, SubagentTerminateMode, Task, TaskDependency, TaskBreakdown, TaskMetrics, TaskExecutionContext, TaskBreakdownAnalyzer, ContextState } from './TaskExecutionEngine.js';
export { TaskExecutionEngine } from './TaskExecutionEngine.complete.js';
export { TaskExecutionUtils } from './TaskExecutionEngine.utils.js';
export { ExecutionMonitoringSystem, ExecutionMetrics, TaskExecutionEvent, AlertConfig, BottleneckAnalysis, SystemHealthStatus } from './ExecutionMonitoringSystem.js';
export { InfiniteHookIntegration, TaskManagerAPI, HookIntegrationConfig } from './InfiniteHookIntegration.js';
import type { Config } from '../config/config.js';
import { TaskExecutionEngine } from './TaskExecutionEngine.complete.js';
import { ExecutionMonitoringSystem } from './ExecutionMonitoringSystem.js';
import { InfiniteHookIntegration } from './InfiniteHookIntegration.js';
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
}
/**
 * Convenience function to create a complete task management system
 */
export declare function createTaskManagementSystem(config: Config, options?: any): Promise<{
    taskEngine: TaskExecutionEngine;
    monitoring?: ExecutionMonitoringSystem;
    hookIntegration?: InfiniteHookIntegration;
    shutdown: () => Promise<void>;
}>;
/**
 * Convenience function to create standalone task engine
 */
export declare function createTaskEngine(config: Config): TaskExecutionEngine;
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
};
