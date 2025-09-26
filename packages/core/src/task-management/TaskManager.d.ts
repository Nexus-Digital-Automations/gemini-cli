/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * @fileoverview Core TaskManager Class - Unified Autonomous Task Management Interface
 *
 * This is the main entry point for the autonomous task management system, providing
 * a unified interface that orchestrates all task management components including:
 * - Task execution and lifecycle management
 * - Intelligent task breakdown and scheduling
 * - Cross-session persistence
 * - Real-time monitoring and analytics
 * - Hook system integration
 */
import type { Config } from '../config/config.js';
import { type EnhancedQueueConfig } from './EnhancedAutonomousTaskQueue.js';
import { TaskPriority } from './TaskQueue.js';
import type { TaskId, TaskStatus, TaskResult, TaskExecutionContext } from './types.js';
/**
 * TaskManager Configuration Options
 */
export interface TaskManagerConfig {
    /** Base configuration object */
    config: Config;
    /** Maximum concurrent tasks to execute */
    maxConcurrentTasks?: number;
    /** Enable autonomous task breakdown */
    enableAutonomousBreakdown?: boolean;
    /** Complexity threshold for automatic breakdown (0.0-1.0) */
    breakdownThreshold?: number;
    /** Maximum depth for task breakdown */
    maxBreakdownDepth?: number;
    /** Enable adaptive scheduling algorithms */
    enableAdaptiveScheduling?: boolean;
    /** Enable performance optimization */
    enablePerformanceOptimization?: boolean;
    /** Enable machine learning from execution history */
    enableLearning?: boolean;
    /** Enable real-time monitoring */
    enableMonitoring?: boolean;
    /** Enable infinite-continue-stop-hook integration */
    enableHookIntegration?: boolean;
    /** Enable cross-session persistence */
    enablePersistence?: boolean;
    /** Hook integration configuration */
    hookIntegrationConfig?: any;
    /** Monitoring configuration */
    monitoringConfig?: any;
    /** Queue configuration */
    queueConfig?: Partial<EnhancedQueueConfig>;
    /** Agent ID for hook integration */
    agentId?: string;
}
/**
 * Autonomous decision-making context
 */
export interface AutonomousContext {
    /** Current system load (0.0-1.0) */
    systemLoad: number;
    /** Available resources */
    availableResources: Record<string, number>;
    /** Historical performance metrics */
    performanceHistory: Array<{
        taskId: TaskId;
        duration: number;
        success: boolean;
        complexity: number;
        timestamp: Date;
    }>;
    /** Current queue state */
    queueState: {
        pending: number;
        inProgress: number;
        completed: number;
        failed: number;
    };
    /** Time constraints */
    timeConstraints?: {
        deadline?: Date;
        maxDuration?: number;
    };
}
/**
 * Task execution strategy
 */
export interface TaskExecutionStrategy {
    /** Execution approach */
    approach: 'sequential' | 'parallel' | 'hybrid' | 'adaptive';
    /** Concurrency level */
    concurrencyLevel: number;
    /** Resource allocation strategy */
    resourceStrategy: 'conservative' | 'aggressive' | 'balanced' | 'adaptive';
    /** Error handling approach */
    errorHandling: 'fail-fast' | 'resilient' | 'retry-aggressive' | 'adaptive';
    /** Quality gate enforcement */
    qualityGates: string[];
}
/**
 * Autonomous decision result
 */
export interface AutonomousDecision {
    /** Decision type */
    decision: 'breakdown' | 'schedule' | 'execute' | 'pause' | 'optimize' | 'escalate';
    /** Confidence level (0.0-1.0) */
    confidence: number;
    /** Reasoning for the decision */
    reasoning: string;
    /** Recommended actions */
    actions: Array<{
        action: string;
        parameters: Record<string, unknown>;
        priority: number;
    }>;
    /** Expected outcomes */
    expectedOutcomes: {
        successProbability: number;
        estimatedDuration: number;
        riskLevel: 'low' | 'medium' | 'high';
    };
}
/**
 * Core TaskManager Class
 *
 * Provides enterprise-grade autonomous task management with intelligent
 * breakdown, adaptive scheduling, cross-session persistence, and real-time monitoring.
 */
export declare class TaskManager {
    private readonly config;
    private readonly taskEngine;
    private readonly autonomousQueue;
    private readonly priorityQueue;
    private readonly scheduler;
    private readonly monitoring?;
    private readonly hookIntegration?;
    private readonly persistence;
    private readonly enableAutonomousBreakdown;
    private readonly enableAdaptiveScheduling;
    private readonly enableLearning;
    private readonly agentId;
    private isRunning;
    private executionInterval?;
    constructor(options: TaskManagerConfig);
    /**
     * Initialize all components and start autonomous operation
     */
    initialize(): Promise<void>;
    /**
     * Add a new task with autonomous decision-making
     */
    addTask(title: string, description: string, options?: {
        priority?: TaskPriority;
        category?: string;
        executionContext?: TaskExecutionContext;
        parameters?: Record<string, unknown>;
        expectedOutputs?: Record<string, unknown>;
        dependencies?: TaskId[];
        forceBreakdown?: boolean;
        useAutonomousQueue?: boolean;
    }): Promise<TaskId>;
    /**
     * Execute a single task with comprehensive quality gates
     */
    private executeTaskWithQualityGates;
    /**
     * Get task status with comprehensive information
     */
    getTaskStatus(taskId: TaskId): Promise<{
        status: TaskStatus;
        progress: number;
        result?: TaskResult;
        breakdown?: any;
        metrics?: any;
    }>;
    /**
     * Get comprehensive system status
     */
    getSystemStatus(): {
        isRunning: boolean;
        autonomousMode: boolean;
        taskCounts: Record<string, number>;
        systemHealth: any;
        performance: any;
    };
    /**
     * Make autonomous decisions based on current context
     */
    private makeAutonomousDecision;
    /**
     * Get current autonomous context
     */
    private getAutonomousContext;
    /**
     * Start autonomous execution loop
     */
    private startAutonomousExecution;
    /**
     * Execute one cycle of autonomous task management
     */
    private autonomousExecutionCycle;
    /**
     * Helper methods for task analysis and execution
     */
    private analyzeTaskComplexity;
    private estimateTaskDuration;
    private generateTaskId;
    private calculateTaskProgress;
    private calculateTaskMetrics;
    /**
     * Quality gate implementations
     */
    private runPreExecutionChecks;
    private runPostExecutionChecks;
    /**
     * Persistence methods
     */
    private loadPersistedState;
    private persistTaskState;
    private persistCurrentState;
    private getAllTasks;
    private updateMonitoringMetrics;
    /**
     * Event handlers for task lifecycle
     */
    private handleTaskStatusChange;
    private handleTaskComplete;
    private handleTaskFailed;
    /**
     * Shutdown and cleanup
     */
    shutdown(): Promise<void>;
}
/**
 * Factory function for creating TaskManager instances
 */
export declare function createTaskManager(options: TaskManagerConfig): Promise<TaskManager>;
/**
 * Export interfaces and types for external use
 */
export type { TaskManagerConfig, AutonomousContext, TaskExecutionStrategy, AutonomousDecision, };
