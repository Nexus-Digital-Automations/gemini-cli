/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Intelligent Task Dependency Analyzer
 * Advanced dependency management system for autonomous task orchestration
 *
 * === CORE CAPABILITIES ===
 * • Directed Acyclic Graph (DAG) modeling and management
 * • Circular dependency detection and resolution
 * • Intelligent task prerequisite validation and enforcement
 * • Parallel execution optimization for independent tasks
 * • Real-time dependency impact analysis and propagation
 * • Sophisticated dependency-based scheduling algorithms
 * • Dynamic dependency conflict resolution
 *
 * === ARCHITECTURE ===
 * The system uses a multi-layered approach:
 * 1. DependencyGraph: Core DAG data structure and algorithms
 * 2. CircularDependencyResolver: Detection and resolution of cycles
 * 3. PrerequisiteValidator: Ensures all dependencies are satisfied
 * 4. ParallelOptimizer: Identifies tasks that can run concurrently
 * 5. ImpactAnalyzer: Tracks dependency changes and propagates effects
 * 6. IntelligentScheduler: Optimizes execution order based on dependencies
 *
 * @author DEPENDENCY_ANALYST
 * @version 1.0.0
 * @since 2025-09-25
 */
import { EventEmitter } from 'node:events';
/**
 * Task dependency relationship types
 */
export declare enum DependencyType {
    HARD = "hard",// Must complete before dependent can start
    SOFT = "soft",// Should complete first, but can run in parallel
    RESOURCE = "resource",// Shares resources, coordinate execution
    DATA = "data",// Data flows from prerequisite to dependent
    CONDITIONAL = "conditional"
}
/**
 * Dependency status tracking
 */
export declare enum DependencyStatus {
    PENDING = "pending",
    SATISFIED = "satisfied",
    BLOCKED = "blocked",
    FAILED = "failed",
    SKIPPED = "skipped"
}
/**
 * Task execution readiness levels
 */
export declare enum ExecutionReadiness {
    READY = "ready",// All hard dependencies satisfied
    CONDITIONALLY_READY = "conditionally_ready",// Soft dependencies pending
    BLOCKED = "blocked",// Hard dependencies unsatisfied
    WAITING_RESOURCES = "waiting_resources",// Resource dependencies pending
    FAILED_DEPENDENCIES = "failed_dependencies"
}
/**
 * Task dependency definition
 */
export interface TaskDependency {
    readonly id: string;
    readonly sourceTaskId: string;
    readonly targetTaskId: string;
    readonly type: DependencyType;
    readonly weight: number;
    readonly metadata: {
        readonly description?: string;
        readonly resourceType?: string;
        readonly dataSchema?: Record<string, any>;
        readonly conditions?: string[];
        readonly timeout?: number;
        readonly retryable?: boolean;
    };
    readonly createdAt: Date;
    readonly updatedAt: Date;
}
/**
 * Task node in dependency graph
 */
export interface TaskNode {
    readonly taskId: string;
    readonly name: string;
    readonly type: string;
    readonly priority: number;
    readonly estimatedDuration: number;
    readonly resourceRequirements: {
        readonly cpu?: number;
        readonly memory?: number;
        readonly disk?: number;
        readonly concurrent?: boolean;
    };
    readonly status: string;
    readonly metadata: Record<string, any>;
}
/**
 * Dependency analysis result
 */
export interface DependencyAnalysisResult {
    readonly taskId: string;
    readonly readiness: ExecutionReadiness;
    readonly blockedBy: TaskDependency[];
    readonly dependsOn: TaskDependency[];
    readonly enables: TaskDependency[];
    readonly parallelCandidates: string[];
    readonly criticalPath: string[];
    readonly estimatedStartTime?: Date;
    readonly riskFactors: string[];
    readonly recommendations: string[];
}
/**
 * Scheduling optimization result
 */
export interface SchedulingResult {
    readonly executionPlan: {
        readonly phase: number;
        readonly tasks: string[];
        readonly parallelGroups: string[][];
        readonly estimatedDuration: number;
    }[];
    readonly criticalPath: string[];
    readonly totalEstimatedDuration: number;
    readonly parallelizationFactor: number;
    readonly bottlenecks: string[];
    readonly optimizations: string[];
    readonly riskAssessment: {
        readonly high: string[];
        readonly medium: string[];
        readonly low: string[];
    };
}
/**
 * Dependency conflict definition
 */
export interface DependencyConflict {
    readonly id: string;
    readonly type: 'circular' | 'resource' | 'data' | 'timing';
    readonly affectedTasks: string[];
    readonly dependencies: TaskDependency[];
    readonly severity: 'critical' | 'high' | 'medium' | 'low';
    readonly autoResolvable: boolean;
    readonly suggestedResolutions: {
        readonly action: string;
        readonly description: string;
        readonly impact: string;
        readonly confidence: number;
    }[];
    readonly detectedAt: Date;
}
/**
 * Core Dependency Graph Implementation
 */
declare class DependencyGraph {
    private readonly nodes;
    private readonly edges;
    private readonly adjacencyList;
    private readonly reverseAdjacencyList;
    private readonly logger;
    constructor();
    /**
     * Add task node to dependency graph
     */
    addNode(node: TaskNode): void;
    /**
     * Add dependency edge between tasks
     */
    addDependency(dependency: TaskDependency): void;
    /**
     * Remove dependency from graph
     */
    removeDependency(dependencyId: string): boolean;
    /**
     * Get all dependencies for a task
     */
    getTaskDependencies(taskId: string): {
        incoming: TaskDependency[];
        outgoing: TaskDependency[];
    };
    /**
     * Detect cycles in the dependency graph using DFS
     */
    hasCycle(): boolean;
    /**
     * Find all cycles in the graph
     */
    findCycles(): string[][];
    /**
     * Perform topological sort to get execution order
     */
    topologicalSort(): string[];
    /**
     * Find the critical path (longest path) through the graph
     */
    findCriticalPath(): {
        path: string[];
        duration: number;
    };
    /**
     * Find tasks that can run in parallel
     */
    findParallelExecutionGroups(): string[][];
    /**
     * Get graph statistics
     */
    getStatistics(): {
        nodeCount: number;
        edgeCount: number;
        averageDegree: number;
        maxDepth: number;
        parallelizationFactor: number;
        cyclomaticComplexity: number;
    };
    /**
     * Get all nodes
     */
    getNodes(): Map<string, TaskNode>;
    /**
     * Get all edges
     */
    getEdges(): Map<string, TaskDependency>;
    /**
     * Clear all nodes and edges
     */
    clear(): void;
}
/**
 * Intelligent Task Dependency Analyzer
 *
 * Primary orchestrator for all dependency analysis and management operations
 */
export declare class DependencyAnalyzer extends EventEmitter {
    private readonly logger;
    private readonly dependencyGraph;
    private readonly conflictRegistry;
    private readonly analysisCache;
    private readonly cacheTimeout;
    constructor();
    /**
     * Register a task in the dependency system
     */
    registerTask(task: TaskNode): void;
    /**
     * Add dependency between tasks
     */
    addDependency(dependency: TaskDependency): void;
    /**
     * Remove dependency between tasks
     */
    removeDependency(dependencyId: string): boolean;
    /**
     * Analyze task dependencies and execution readiness
     */
    analyzeTask(taskId: string): Promise<DependencyAnalysisResult>;
    /**
     * Generate optimal execution schedule
     */
    generateOptimalSchedule(taskIds?: string[]): SchedulingResult;
    /**
     * Detect and resolve dependency conflicts
     */
    detectConflicts(): DependencyConflict[];
    /**
     * Get dependency graph visualization data
     */
    getVisualizationData(): {
        nodes: Array<{
            id: string;
            label: string;
            type: string;
            status: string;
            priority: number;
            position?: {
                x: number;
                y: number;
            };
        }>;
        edges: Array<{
            id: string;
            source: string;
            target: string;
            type: DependencyType;
            weight: number;
            status: DependencyStatus;
        }>;
        statistics: ReturnType<DependencyGraph['getStatistics']>;
    };
    /**
     * Get system health metrics
     */
    getHealthMetrics(): {
        graphHealth: 'healthy' | 'warning' | 'critical';
        conflictCount: number;
        cyclicDependencies: number;
        bottleneckCount: number;
        parallelizationEfficiency: number;
        recommendations: string[];
    };
    private _calculateExecutionReadiness;
    private _isDependencySatisfied;
    private _isDependencyFailed;
    private _findParallelCandidates;
    private _findCriticalPathForTask;
    private _estimateStartTime;
    private _assessRiskFactors;
    private _generateRecommendations;
    private _optimizeParallelExecution;
    private _getResourceKey;
    private _calculatePhaseDuration;
    private _identifyBottlenecks;
    private _suggestOptimizations;
    private _assessScheduleRisks;
    private _createCircularDependencyConflict;
    private _getDependenciesInCycle;
    private _detectResourceConflicts;
    private _detectDataFlowConflicts;
    private _getDependencyStatus;
    private _countBottlenecks;
    private _invalidateCache;
    private _invalidateCacheForAffectedTasks;
    private _detectAndResolveConflicts;
    private _attemptAutoResolve;
    /**
     * Cleanup resources and prepare for shutdown
     */
    shutdown(): Promise<void>;
}
export {};
