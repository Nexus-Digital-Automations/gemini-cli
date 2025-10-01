/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { EventEmitter } from 'node:events';
import type { Task, TaskDependency } from './TaskQueue.js';
/**
 * Dependency graph node
 */
export interface DependencyNode {
    taskId: string;
    task: Task;
    dependencies: Set<string>;
    dependents: Set<string>;
    inDegree: number;
    outDegree: number;
    level: number;
    criticalPath: boolean;
}
/**
 * Dependency analysis result
 */
export interface DependencyAnalysis {
    hasCycles: boolean;
    cycles: string[][];
    criticalPath: string[];
    executionLevels: Map<number, string[]>;
    parallelizableGroups: string[][];
    blockedTasks: string[];
    readyTasks: string[];
    totalLevels: number;
    estimatedDuration: number;
}
/**
 * Dependency resolution strategy
 */
export declare enum ResolutionStrategy {
    STRICT = "strict",// All dependencies must be satisfied
    BEST_EFFORT = "best_effort",// Try to satisfy dependencies, continue if possible
    PARALLEL_OPTIMIZED = "parallel_optimized"
}
/**
 * Advanced dependency resolver with cycle detection and optimization
 */
export declare class DependencyResolver extends EventEmitter {
    private dependencyGraph;
    private taskDependencies;
    constructor();
    /**
     * Build dependency graph from tasks and dependencies
     */
    buildDependencyGraph(tasks: Map<string, Task>, dependencies: Map<string, TaskDependency>): void;
    /**
     * Perform comprehensive dependency analysis
     */
    analyzeDependencies(strategy?: ResolutionStrategy): DependencyAnalysis;
    /**
     * Detect circular dependencies using DFS
     */
    private detectCycles;
    /**
     * Calculate execution levels using topological sorting
     */
    private calculateExecutionLevels;
    /**
     * Identify the critical path (longest path in the dependency graph)
     */
    private identifyCriticalPath;
    /**
     * Find the critical path
     */
    private findCriticalPath;
    /**
     * Get execution levels as a map
     */
    private getExecutionLevels;
    /**
     * Identify groups of tasks that can run in parallel
     */
    private identifyParallelizableGroups;
    /**
     * Subdivide tasks by resource constraints and conflicts
     */
    private subdivideByConstraints;
    /**
     * Check if two tasks are compatible for parallel execution
     */
    private areTasksCompatible;
    /**
     * Get tasks that are currently blocked by dependencies
     */
    private getBlockedTasks;
    /**
     * Get tasks that are ready to execute (no blocking dependencies)
     */
    private getReadyTasks;
    /**
     * Calculate estimated total duration considering parallelization
     */
    private calculateEstimatedDuration;
    /**
     * Resolve dependency conflicts using various strategies
     */
    resolveDependencyConflicts(conflicts: string[][], strategy?: ResolutionStrategy): void;
    /**
     * Resolve conflict using best effort strategy
     */
    private resolveConflictBestEffort;
    /**
     * Resolve conflict using parallel optimization strategy
     */
    private resolveConflictParallelOptimized;
    /**
     * Check if a blocking dependency can be safely converted to enabling
     */
    private canConvertToEnabling;
    /**
     * Remove a dependency from the system
     */
    private removeDependency;
    /**
     * Rebuild the dependency graph after changes
     */
    private rebuildGraphAfterChanges;
    /**
     * Optimize execution order for maximum parallelization
     */
    optimizeExecutionOrder(): string[];
    /**
     * Get dependency information for a specific task
     */
    getTaskDependencyInfo(taskId: string): {
        dependencies: string[];
        dependents: string[];
        level: number;
        isOnCriticalPath: boolean;
        isReady: boolean;
        isBlocked: boolean;
    } | null;
    /**
     * Validate dependency integrity
     */
    validateDependencyIntegrity(): {
        isValid: boolean;
        issues: string[];
    };
    /**
     * Export dependency graph for visualization
     */
    exportGraph(): {
        nodes: Array<{
            id: string;
            title: string;
            level: number;
            priority: number;
            status: string;
            criticalPath: boolean;
        }>;
        edges: Array<{
            from: string;
            to: string;
            type: string;
        }>;
    };
    /**
     * Clear the dependency graph
     */
    clear(): void;
}
