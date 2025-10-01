/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { TaskId, Task, TaskDependency, DependencyType, CircularDependency, ExecutionSequence, ExecutionPlan, TaskQueueConfig } from './types.js';
/**
 * Events emitted by the dependency manager
 */
export interface DependencyManagerEvents {
    'dependency-added': {
        dependency: TaskDependency;
    };
    'dependency-removed': {
        dependentId: TaskId;
        dependsOnId: TaskId;
    };
    'circular-dependency-detected': {
        cycles: CircularDependency[];
    };
    'circular-dependency-resolved': {
        resolvedCycles: CircularDependency[];
    };
    'execution-plan-generated': {
        plan: ExecutionPlan;
    };
    'task-sequence-updated': {
        sequence: ExecutionSequence;
    };
}
/**
 * Configuration for automatic dependency learning
 */
export interface AutoDependencyConfig {
    /** Enable automatic dependency detection */
    enabled: boolean;
    /** Minimum confidence threshold for auto-dependencies (0-1) */
    confidenceThreshold: number;
    /** Historical data window for learning (in days) */
    historicalWindow: number;
    /** Maximum number of dependencies to auto-suggest per task */
    maxSuggestions: number;
    /** Types of dependencies to learn automatically */
    learningTypes: DependencyType[];
}
/**
 * High-level dependency management API with intelligent features
 */
export declare class DependencyManager {
    private graph;
    private sequencer;
    private tasks;
    private config;
    private autoConfig;
    private executionHistory;
    private dependencyLearningData;
    constructor(config: TaskQueueConfig, autoConfig?: Partial<AutoDependencyConfig>);
    /**
     * Add a task to the dependency management system
     */
    addTask(task: Task): void;
    /**
     * Remove a task from the dependency management system
     */
    removeTask(taskId: TaskId): void;
    /**
     * Add a dependency relationship between tasks
     */
    addDependency(dependentTaskId: TaskId, dependsOnTaskId: TaskId, type?: DependencyType, options?: {
        reason?: string;
        parallelizable?: boolean;
        minDelay?: number;
    }): void;
    /**
     * Remove a dependency relationship
     */
    removeDependency(dependentTaskId: TaskId, dependsOnTaskId: TaskId): void;
    /**
     * Get all dependencies for a task
     */
    getTaskDependencies(taskId: TaskId): TaskDependency[];
    /**
     * Get all tasks that depend on a given task
     */
    getTaskDependents(taskId: TaskId): TaskId[];
    /**
     * Check if adding a dependency would create a circular dependency
     */
    wouldCreateCircularDependency(dependentTaskId: TaskId, dependsOnTaskId: TaskId): boolean;
    /**
     * Detect all circular dependencies in the current graph
     */
    detectCircularDependencies(): CircularDependency[];
    /**
     * Resolve circular dependencies automatically
     */
    resolveCircularDependencies(strategy?: 'automatic' | 'interactive'): {
        resolved: CircularDependency[];
        unresolved: CircularDependency[];
    };
    /**
     * Attempt to resolve a single circular dependency
     */
    private attemptCycleResolution;
    /**
     * Generate optimal execution sequence for all tasks
     */
    generateExecutionSequence(algorithm?: 'priority' | 'dependency_aware' | 'resource_optimal' | 'hybrid'): ExecutionSequence;
    /**
     * Generate execution sequence for a subset of tasks
     */
    generateExecutionSequenceForTasks(taskIds: TaskId[], algorithm?: 'priority' | 'dependency_aware' | 'resource_optimal' | 'hybrid'): ExecutionSequence;
    /**
     * Generate comprehensive execution plan with dependency resolution
     */
    generateExecutionPlan(taskIds?: TaskId[]): ExecutionPlan;
    /**
     * Get dependency impact analysis for a task
     */
    getDependencyImpact(taskId: TaskId): {
        directDependents: TaskId[];
        indirectDependents: TaskId[];
        totalImpact: number;
        criticalPathImpact: boolean;
        riskAssessment: 'low' | 'medium' | 'high';
    };
    /**
     * Suggest automatic dependencies for a task based on learning
     */
    private suggestAutoDependencies;
    /**
     * Generate a pattern string for a task
     */
    private generateTaskPattern;
    /**
     * Calculate similarity between two task patterns
     */
    private calculatePatternSimilarity;
    /**
     * Update dependency learning data based on execution patterns
     */
    private updateDependencyLearning;
    /**
     * Record task execution for learning
     */
    recordTaskExecution(taskId: TaskId, startTime: Date, endTime: Date, success: boolean): void;
    /**
     * Get execution statistics for a task
     */
    getTaskExecutionStats(taskId: TaskId): {
        executionCount: number;
        successRate: number;
        averageDuration: number;
        lastExecution?: Date;
    };
    /**
     * Export dependency graph visualization
     */
    exportDependencyVisualization(): string;
    /**
     * Get comprehensive dependency statistics
     */
    getDependencyStatistics(): {
        totalTasks: number;
        totalDependencies: number;
        circularDependencies: number;
        averageDependenciesPerTask: number;
        criticalPathLength: number;
        maxParallelization: number;
        riskMetrics: {
            highRiskTasks: number;
            blockedTasks: number;
            singlePointsOfFailure: number;
        };
    };
    /**
     * Update configuration
     */
    updateConfiguration(config: Partial<TaskQueueConfig>): void;
    /**
     * Update auto-dependency configuration
     */
    updateAutoDependencyConfiguration(config: Partial<AutoDependencyConfig>): void;
}
