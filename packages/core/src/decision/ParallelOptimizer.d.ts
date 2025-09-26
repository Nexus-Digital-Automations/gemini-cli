/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { z } from 'zod';
import type { TaskId, Task, TaskDependency } from '../task-management/types.js';
import type { Decision, DecisionContext } from './types.js';
import type { DependencyAnalyzer } from './DependencyAnalyzer.js';
import type { DecisionDependencyGraph } from './DependencyGraph.js';
/**
 * Parallel execution strategies
 */
export declare enum ParallelStrategy {
    MAX_PARALLELISM = "max_parallelism",
    RESOURCE_BALANCED = "resource_balanced",
    DEPENDENCY_AWARE = "dependency_aware",
    PRIORITY_GROUPED = "priority_grouped",
    ADAPTIVE_DYNAMIC = "adaptive_dynamic",
    MACHINE_LEARNING = "machine_learning"
}
/**
 * Resource pool configuration for parallel execution
 */
export interface ResourcePool {
    /** Resource type identifier */
    name: string;
    /** Total capacity available */
    capacity: number;
    /** Currently allocated amount */
    allocated: number;
    /** Resource tags for categorization */
    tags: string[];
    /** Whether this resource is shareable */
    shareable: boolean;
    /** Cost per unit of resource */
    costPerUnit?: number;
    /** Priority multiplier for this resource */
    priorityMultiplier: number;
}
/**
 * Parallel execution configuration
 */
export interface ParallelOptimizationConfig {
    /** Primary optimization strategy */
    strategy: ParallelStrategy;
    /** Maximum number of concurrent tasks */
    maxConcurrency: number;
    /** Resource pools available for allocation */
    resourcePools: Map<string, ResourcePool>;
    /** Enable dynamic rebalancing during execution */
    enableDynamicRebalancing: boolean;
    /** Resource utilization target (0-1) */
    targetResourceUtilization: number;
    /** Minimum task duration for parallelization (ms) */
    minTaskDurationForParallelization: number;
    /** Enable predictive resource allocation */
    enablePredictiveAllocation: boolean;
    /** Learning rate for adaptive strategies */
    learningRate: number;
}
/**
 * Parallel execution group with resource allocation
 */
export interface ParallelExecutionGroup {
    /** Group identifier */
    id: string;
    /** Tasks in this parallel group */
    tasks: TaskId[];
    /** Resource allocations for this group */
    resourceAllocations: Map<string, number>;
    /** Estimated execution time for the group */
    estimatedDuration: number;
    /** Priority level of the group */
    priority: number;
    /** Dependencies this group satisfies */
    satisfiesDependencies: TaskDependency[];
    /** Confidence in the parallel execution plan */
    confidence: number;
    /** Risk factors for this group */
    risks: string[];
}
/**
 * Parallel optimization result
 */
export interface ParallelOptimizationResult {
    /** Optimized execution groups */
    executionGroups: ParallelExecutionGroup[];
    /** Resource allocation plan */
    resourcePlan: Map<string, Array<{
        taskId: TaskId;
        amount: number;
        startTime: number;
        duration: number;
    }>>;
    /** Performance projections */
    projections: {
        totalExecutionTime: number;
        resourceUtilization: Map<string, number>;
        parallelizationFactor: number;
        costOptimization: number;
    };
    /** Optimization recommendations */
    recommendations: OptimizationRecommendation[];
    /** Alternative parallelization strategies */
    alternatives: Array<{
        strategy: ParallelStrategy;
        groups: ParallelExecutionGroup[];
        score: number;
        tradeoffs: string[];
    }>;
}
/**
 * Optimization recommendation
 */
export interface OptimizationRecommendation {
    /** Type of recommendation */
    type: 'resource_adjustment' | 'task_reordering' | 'dependency_modification' | 'strategy_change';
    /** Description of the recommendation */
    description: string;
    /** Expected impact */
    impact: {
        timeImprovement: number;
        resourceEfficiency: number;
        riskReduction: number;
    };
    /** Implementation complexity */
    complexity: 'low' | 'medium' | 'high';
    /** Priority for implementation */
    priority: 'low' | 'medium' | 'high' | 'critical';
}
/**
 * Advanced parallel execution optimizer with intelligent resource allocation
 */
export declare class ParallelOptimizer {
    private config;
    private dependencyAnalyzer;
    private dependencyGraph;
    private executionHistory;
    private learningModel;
    private resourcePredictions;
    constructor(config?: Partial<ParallelOptimizationConfig>, dependencyAnalyzer?: DependencyAnalyzer, dependencyGraph?: DecisionDependencyGraph);
    /**
     * Optimize parallel execution for a set of tasks
     */
    optimizeParallelExecution(tasks: Map<TaskId, Task>, dependencies?: TaskDependency[], context?: DecisionContext): Promise<Decision>;
    /**
     * Analyze resource contentions between tasks
     */
    private analyzeResourceContentions;
    /**
     * Generate optimal parallel execution groups
     */
    private generateOptimalParallelGroups;
    /**
     * Generate maximum parallelism groups
     */
    private generateMaxParallelismGroups;
    /**
     * Generate resource-balanced groups
     */
    private generateResourceBalancedGroups;
    /**
     * Generate dependency-aware groups
     */
    private generateDependencyAwareGroups;
    /**
     * Generate priority-grouped groups
     */
    private generatePriorityGroupedGroups;
    /**
     * Generate adaptive dynamic groups
     */
    private generateAdaptiveDynamicGroups;
    /**
     * Generate ML-based groups using historical data
     */
    private generateMLBasedGroups;
    private extractResourceRequirements;
    private calculateTotalResourceDemand;
    private selectResourceBalancedTasks;
    private buildDependencyLayers;
    private groupTasksByResourceCompatibility;
    private allocateResourcesForGroup;
    private calculateGroupDuration;
    private calculateGroupPriority;
    private findSatisfiedDependencies;
    private assessGroupRisks;
    private buildOptimizationResult;
    private calculateCostOptimization;
    private generateOptimizationRecommendations;
    private mergeOptimizationResults;
    private predictOptimalGrouping;
    private areSimilarTasks;
    private predictGroupConfidence;
    private validateOptimization;
    private calculateOptimizationConfidence;
    private generateOptimizationReasoning;
    private generateAlternativeStrategies;
    private getStrategyTradeoffs;
    private updatePredictiveModel;
    private extractGroupFeatures;
    private predictGroupPerformance;
    private createDefaultContext;
    /**
     * Record execution history for learning
     */
    recordExecutionHistory(groupId: string, tasks: TaskId[], resourcesUsed: Map<string, number>, actualDuration: number, estimatedDuration: number, success: boolean, bottlenecks?: string[]): void;
    /**
     * Get optimization statistics
     */
    getStatistics(): {
        totalOptimizations: number;
        averageParallelizationFactor: number;
        resourceUtilizationEfficiency: number;
        learningModelSize: number;
        executionHistorySize: number;
    };
    /**
     * Update resource pool configuration
     */
    updateResourcePools(pools: Map<string, ResourcePool>): void;
    /**
     * Get current resource utilization
     */
    getCurrentResourceUtilization(): Map<string, {
        pool: ResourcePool;
        utilization: number;
        predictions: number;
    }>;
}
/**
 * Zod schemas for validation
 */
export declare const ParallelOptimizationConfigSchema: z.ZodObject<{
    strategy: z.ZodNativeEnum<typeof ParallelStrategy>;
    maxConcurrency: z.ZodNumber;
    resourcePools: z.ZodMap<z.ZodString, z.ZodObject<{
        name: z.ZodString;
        capacity: z.ZodNumber;
        allocated: z.ZodNumber;
        tags: z.ZodArray<z.ZodString, "many">;
        shareable: z.ZodBoolean;
        costPerUnit: z.ZodOptional<z.ZodNumber>;
        priorityMultiplier: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        name: string;
        tags: string[];
        capacity: number;
        allocated: number;
        shareable: boolean;
        priorityMultiplier: number;
        costPerUnit?: number | undefined;
    }, {
        name: string;
        tags: string[];
        capacity: number;
        allocated: number;
        shareable: boolean;
        priorityMultiplier: number;
        costPerUnit?: number | undefined;
    }>>;
    enableDynamicRebalancing: z.ZodBoolean;
    targetResourceUtilization: z.ZodNumber;
    minTaskDurationForParallelization: z.ZodNumber;
    enablePredictiveAllocation: z.ZodBoolean;
    learningRate: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    maxConcurrency: number;
    strategy: ParallelStrategy;
    resourcePools: Map<string, {
        name: string;
        tags: string[];
        capacity: number;
        allocated: number;
        shareable: boolean;
        priorityMultiplier: number;
        costPerUnit?: number | undefined;
    }>;
    enableDynamicRebalancing: boolean;
    targetResourceUtilization: number;
    minTaskDurationForParallelization: number;
    enablePredictiveAllocation: boolean;
    learningRate: number;
}, {
    maxConcurrency: number;
    strategy: ParallelStrategy;
    resourcePools: Map<string, {
        name: string;
        tags: string[];
        capacity: number;
        allocated: number;
        shareable: boolean;
        priorityMultiplier: number;
        costPerUnit?: number | undefined;
    }>;
    enableDynamicRebalancing: boolean;
    targetResourceUtilization: number;
    minTaskDurationForParallelization: number;
    enablePredictiveAllocation: boolean;
    learningRate: number;
}>;
export declare const ParallelExecutionGroupSchema: z.ZodObject<{
    id: z.ZodString;
    tasks: z.ZodArray<z.ZodString, "many">;
    resourceAllocations: z.ZodMap<z.ZodString, z.ZodNumber>;
    estimatedDuration: z.ZodNumber;
    priority: z.ZodNumber;
    satisfiesDependencies: z.ZodArray<z.ZodAny, "many">;
    confidence: z.ZodNumber;
    risks: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    id: string;
    tasks: string[];
    priority: number;
    estimatedDuration: number;
    confidence: number;
    risks: string[];
    resourceAllocations: Map<string, number>;
    satisfiesDependencies: any[];
}, {
    id: string;
    tasks: string[];
    priority: number;
    estimatedDuration: number;
    confidence: number;
    risks: string[];
    resourceAllocations: Map<string, number>;
    satisfiesDependencies: any[];
}>;
