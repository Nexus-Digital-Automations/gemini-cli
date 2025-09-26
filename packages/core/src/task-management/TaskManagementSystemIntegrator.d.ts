/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * @fileoverview Unified Task Management System Integrator
 *
 * Coordinates all autonomous task management components into a cohesive system
 * providing enterprise-grade task orchestration, monitoring, and control.
 */
import type { Config } from '../config/config.js';
import { TaskExecutionEngine } from './TaskExecutionEngine.complete.js';
import { EnhancedAutonomousTaskQueue } from './EnhancedAutonomousTaskQueue.js';
import { ExecutionMonitoringSystem } from './ExecutionMonitoringSystem.js';
import { InfiniteHookIntegration } from './InfiniteHookIntegration.js';
import { CrossSessionPersistenceEngine } from './CrossSessionPersistenceEngine.js';
import { DependencyResolver } from './DependencyResolver.js';
/**
 * Configuration options for the integrated task management system
 */
export interface IntegratedSystemConfig {
    core: Config;
    taskEngine?: {
        maxConcurrentTasks?: number;
        defaultRetryCount?: number;
        timeoutMs?: number;
        enableMetrics?: boolean;
    };
    autonomousQueue?: {
        maxConcurrentTasks?: number;
        enableAutonomousBreakdown?: boolean;
        breakdownThreshold?: number;
        maxBreakdownDepth?: number;
        enableAdaptiveScheduling?: boolean;
        performanceOptimization?: boolean;
        learningEnabled?: boolean;
    };
    monitoring?: {
        enabled?: boolean;
        realTimeUpdates?: boolean;
        metricsRetentionHours?: number;
        alertThresholds?: {
            taskFailureRate?: number;
            averageExecutionTime?: number;
            systemMemoryUsage?: number;
        };
    };
    persistence?: {
        enabled?: boolean;
        storageLocation?: string;
        compressionEnabled?: boolean;
        encryptionEnabled?: boolean;
        retentionDays?: number;
    };
    hookIntegration?: {
        enabled?: boolean;
        agentId?: string;
        capabilities?: string[];
        progressReportingIntervalMs?: number;
        autoStopEnabled?: boolean;
    };
    dependencies?: {
        enableAnalysis?: boolean;
        enableResolution?: boolean;
        maxResolutionDepth?: number;
        allowCircularDependencies?: boolean;
    };
}
/**
 * System health status and metrics
 */
export interface SystemHealth {
    overall: 'healthy' | 'warning' | 'critical';
    components: {
        taskEngine: 'healthy' | 'warning' | 'critical' | 'disabled';
        autonomousQueue: 'healthy' | 'warning' | 'critical' | 'disabled';
        monitoring: 'healthy' | 'warning' | 'critical' | 'disabled';
        persistence: 'healthy' | 'warning' | 'critical' | 'disabled';
        hookIntegration: 'healthy' | 'warning' | 'critical' | 'disabled';
        dependencies: 'healthy' | 'warning' | 'critical' | 'disabled';
    };
    metrics: {
        tasksInQueue: number;
        tasksInProgress: number;
        tasksCompleted: number;
        tasksFailed: number;
        systemUptime: number;
        memoryUsage: number;
        cpuUsage: number;
        avgTaskDuration: number;
        taskThroughput: number;
    };
    lastHealthCheck: Date;
}
/**
 * System operation results
 */
export interface SystemOperationResult {
    success: boolean;
    message: string;
    details?: any;
    timestamp: Date;
}
/**
 * Unified Task Management System Integrator
 *
 * Provides a single entry point for all task management operations,
 * coordinating between different components and ensuring consistency.
 */
export declare class TaskManagementSystemIntegrator {
    private taskEngine?;
    private autonomousQueue?;
    private monitoring?;
    private persistence?;
    private hookIntegration?;
    private dependencyResolver?;
    private config;
    private isInitialized;
    private shutdownHandlers;
    constructor(config: IntegratedSystemConfig);
    /**
     * Initialize the complete integrated system
     */
    initialize(): Promise<SystemOperationResult>;
    /**
     * Get system health status and metrics
     */
    getSystemHealth(): SystemHealth;
    /**
     * Queue a new task for execution
     */
    queueTask(title: string, description: string, options?: any): Promise<SystemOperationResult>;
    /**
     * Get comprehensive system status
     */
    getSystemStatus(): {
        health: SystemHealth;
        taskEngineStats: any;
        autonomousQueueStatus: import("./EnhancedAutonomousTaskQueue.js").AutonomousQueueMetrics | undefined;
        monitoringMetrics: import("./ExecutionMonitoringSystem.js").SystemHealthStatus | undefined;
        components: {
            taskEngine: boolean;
            autonomousQueue: boolean;
            monitoring: boolean;
            persistence: boolean;
            hookIntegration: boolean;
            dependencyResolver: boolean;
        };
        timestamp: Date;
    };
    /**
     * Gracefully shutdown the entire system
     */
    shutdown(): Promise<SystemOperationResult>;
    /**
     * Get access to individual components (for advanced usage)
     */
    getComponents(): {
        taskEngine: TaskExecutionEngine | undefined;
        autonomousQueue: EnhancedAutonomousTaskQueue | undefined;
        monitoring: ExecutionMonitoringSystem | undefined;
        persistence: CrossSessionPersistenceEngine | undefined;
        hookIntegration: InfiniteHookIntegration | undefined;
        dependencyResolver: DependencyResolver | undefined;
    };
    private handleTaskStatusChange;
    private handleTaskComplete;
    private handleTaskFailed;
}
/**
 * Default system configuration factory
 */
export declare class SystemConfigFactory {
    /**
     * Create a minimal configuration for basic task execution
     */
    static createMinimal(coreConfig: Config): IntegratedSystemConfig;
    /**
     * Create a development configuration with monitoring and autonomous features
     */
    static createDevelopment(coreConfig: Config): IntegratedSystemConfig;
    /**
     * Create a production configuration with full features and security
     */
    static createProduction(coreConfig: Config): IntegratedSystemConfig;
}
/**
 * Convenience function to create and initialize the integrated system
 */
export declare function createIntegratedTaskManagementSystem(config: IntegratedSystemConfig): Promise<{
    system: TaskManagementSystemIntegrator;
    result: SystemOperationResult;
}>;
