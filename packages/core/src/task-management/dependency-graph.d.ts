/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { TaskId, Task, TaskDependency, DependencyGraph, CircularDependency } from './types.js';
/**
 * Advanced dependency graph construction and analysis system
 * Provides sophisticated algorithms for dependency management and resolution
 */
export declare class DependencyGraphManager {
    private graph;
    private tasks;
    constructor();
    /**
     * Add a task to the dependency graph
     */
    addTask(task: Task): void;
    /**
     * Add a dependency relationship between tasks
     */
    addDependency(dependency: TaskDependency): void;
    /**
     * Remove a dependency relationship
     */
    removeDependency(dependentTaskId: TaskId, dependsOnTaskId: TaskId): void;
    /**
     * Remove a task from the dependency graph
     */
    removeTask(taskId: TaskId): void;
    /**
     * Detect circular dependencies using DFS-based cycle detection
     */
    detectCircularDependencies(): CircularDependency[];
    /**
     * Generate resolution strategies for circular dependencies
     */
    private generateResolutionStrategies;
    /**
     * Calculate task complexity score
     */
    private calculateTaskComplexity;
    /**
     * Update cycle detection in metadata
     */
    private detectAndUpdateCycles;
    /**
     * Get topological ordering of tasks (returns null if cycles exist)
     */
    getTopologicalOrder(): TaskId[] | null;
    /**
     * Calculate the critical path through the dependency graph
     */
    calculateCriticalPath(): TaskId[];
    /**
     * Get all tasks that can be executed in parallel (no dependencies)
     */
    getParallelizableTasks(): TaskId[][];
    /**
     * Get dependency impact analysis for a task
     */
    getDependencyImpact(taskId: TaskId): {
        directDependents: TaskId[];
        indirectDependents: TaskId[];
        totalImpact: number;
        criticalPathImpact: boolean;
    };
    /**
     * Get the current dependency graph
     */
    getGraph(): DependencyGraph;
    /**
     * Get graph statistics
     */
    getStatistics(): {
        nodeCount: number;
        edgeCount: number;
        hasCycles: boolean;
        avgDependencies: number;
        maxDepth: number;
        criticalPathLength: number;
        parallelGroups: number;
    };
    /**
     * Calculate maximum depth of the dependency graph
     */
    private calculateMaxDepth;
    /**
     * Export graph to DOT format for visualization
     */
    exportToDot(): string;
    private getNodeColor;
    private getEdgeStyle;
    private getEdgeColor;
}
