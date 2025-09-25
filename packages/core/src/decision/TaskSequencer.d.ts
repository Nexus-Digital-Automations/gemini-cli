/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { z } from 'zod';
import type { TaskId, Task, TaskDependency, ExecutionSequence } from '../task-management/types.js';
import type { Decision, DecisionContext } from './types.js';
import { DependencyAnalyzer } from './DependencyAnalyzer.js';
/**
 * Advanced sequencing algorithm types
 */
export declare enum SequencingAlgorithm {
    CRITICAL_PATH = "critical_path",
    PRIORITY_WEIGHTED = "priority_weighted",
    RESOURCE_AWARE = "resource_aware",
    DEADLINE_DRIVEN = "deadline_driven",
    ADAPTIVE_HYBRID = "adaptive_hybrid",
    MACHINE_LEARNING = "machine_learning"
}
/**
 * Configuration for task sequencing
 */
export interface TaskSequencingConfig {
    /** Primary algorithm to use */
    algorithm: SequencingAlgorithm;
    /** Weight factors for hybrid algorithms */
    weights: {
        priority: number;
        duration: number;
        dependencies: number;
        resources: number;
        deadline: number;
    };
    /** Enable dynamic resequencing based on runtime feedback */
    enableDynamicResequencing: boolean;
    /** Maximum time to spend on sequence optimization (ms) */
    maxOptimizationTime: number;
    /** Enable predictive scheduling based on historical data */
    enablePredictiveScheduling: boolean;
    /** Resource pool definitions for scheduling */
    resourcePools: Map<string, number>;
}
/**
 * Sequencing decision with rationale
 */
export interface SequencingDecision extends Decision {
    /** The generated execution sequence */
    sequence: ExecutionSequence;
    /** Algorithm used for sequencing */
    algorithm: SequencingAlgorithm;
    /** Performance metrics of the sequence */
    metrics: SequenceMetrics;
    /** Alternative sequences considered */
    alternativeSequences: Array<{
        sequence: ExecutionSequence;
        algorithm: SequencingAlgorithm;
        score: number;
        reason: string;
    }>;
}
/**
 * Performance metrics for a sequence
 */
export interface SequenceMetrics {
    /** Total estimated execution time */
    totalExecutionTime: number;
    /** Critical path duration */
    criticalPathDuration: number;
    /** Resource utilization efficiency (0-1) */
    resourceUtilization: number;
    /** Parallelization factor (0-1) */
    parallelizationFactor: number;
    /** Dependency satisfaction score (0-1) */
    dependencySatisfaction: number;
    /** Risk assessment (0-1, lower is better) */
    riskAssessment: number;
}
/**
 * Advanced task sequencing engine for intelligent execution ordering
 */
export declare class TaskSequencer {
    private config;
    private dependencyAnalyzer;
    private executionHistory;
    private learningModel;
    private sequenceCache;
    constructor(config?: Partial<TaskSequencingConfig>, dependencyAnalyzer?: DependencyAnalyzer);
    /**
     * Generate intelligent execution sequence for tasks
     */
    generateSequence(tasks: Map<TaskId, Task>, existingDependencies?: TaskDependency[], context?: DecisionContext): Promise<SequencingDecision>;
    /**
     * Execute specific sequencing algorithm
     */
    private executeAlgorithm;
    /**
     * Generate critical path based sequence
     */
    private generateCriticalPathSequence;
    /**
     * Generate priority weighted sequence
     */
    private generatePriorityWeightedSequence;
    /**
     * Generate resource-aware sequence
     */
    private generateResourceAwareSequence;
    /**
     * Generate deadline-driven sequence
     */
    private generateDeadlineDrivenSequence;
    /**
     * Generate adaptive hybrid sequence
     */
    private generateAdaptiveHybridSequence;
    /**
     * Generate ML-based sequence using historical data
     */
    private generateMLBasedSequence;
    /**
     * Calculate scheduling factors for a task
     */
    private calculateSchedulingFactors;
    /**
     * Calculate composite score from factors and weights
     */
    private calculateCompositeScore;
    /**
     * Calculate sequence metrics
     */
    private calculateSequenceMetrics;
    private generateCacheKey;
    private calculateSequenceConfidence;
    private generateSequencingReasoning;
    private estimateSuccessProbability;
    private createDefaultContext;
    private generateAlternativeSequences;
    private calculateAlternativeScore;
    private buildDependencyGraph;
    private calculateCriticalPath;
    private generateParallelGroupsFromGraph;
    private calculateParallelGroupsDuration;
    private calculatePriorityScore;
    private generateParallelGroupsRespectingDependencies;
    private findCriticalPathInSequence;
    private groupTasksByResourceRequirements;
    private optimizeResourceAllocation;
    private hasDeadline;
    private getDeadline;
    private adaptWeightsToContext;
    private optimizeTaskGrouping;
    private canGroupTogether;
    private predictOptimalSequence;
    private extractTaskFeatures;
    private predictTaskScore;
    private generateParallelGroupsFromPredictions;
    private calculateCriticalPathDuration;
    private calculateResourceUtilization;
    private calculateDependencySatisfaction;
    private calculateRiskAssessment;
    private updateLearningModel;
    /**
     * Record execution history for learning
     */
    recordExecutionHistory(taskId: TaskId, actualDuration: number, resourcesUsed: Map<string, number>, success: boolean): void;
    /**
     * Get sequence statistics
     */
    getStatistics(): {
        totalSequencesGenerated: number;
        cacheHitRate: number;
        averageOptimizationTime: number;
        learningModelSize: number;
    };
}
/**
 * Zod schemas for validation
 */
export declare const TaskSequencingConfigSchema: z.ZodObject<{
    algorithm: z.ZodNativeEnum<typeof SequencingAlgorithm>;
    weights: z.ZodObject<{
        priority: z.ZodNumber;
        duration: z.ZodNumber;
        dependencies: z.ZodNumber;
        resources: z.ZodNumber;
        deadline: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        priority: number;
        dependencies: number;
        duration: number;
        resources: number;
        deadline: number;
    }, {
        priority: number;
        dependencies: number;
        duration: number;
        resources: number;
        deadline: number;
    }>;
    enableDynamicResequencing: z.ZodBoolean;
    maxOptimizationTime: z.ZodNumber;
    enablePredictiveScheduling: z.ZodBoolean;
    resourcePools: z.ZodMap<z.ZodString, z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    algorithm: SequencingAlgorithm;
    resourcePools: Map<string, number>;
    weights: {
        priority: number;
        dependencies: number;
        duration: number;
        resources: number;
        deadline: number;
    };
    enableDynamicResequencing: boolean;
    maxOptimizationTime: number;
    enablePredictiveScheduling: boolean;
}, {
    algorithm: SequencingAlgorithm;
    resourcePools: Map<string, number>;
    weights: {
        priority: number;
        dependencies: number;
        duration: number;
        resources: number;
        deadline: number;
    };
    enableDynamicResequencing: boolean;
    maxOptimizationTime: number;
    enablePredictiveScheduling: boolean;
}>;
export declare const SequenceMetricsSchema: z.ZodObject<{
    totalExecutionTime: z.ZodNumber;
    criticalPathDuration: z.ZodNumber;
    resourceUtilization: z.ZodNumber;
    parallelizationFactor: z.ZodNumber;
    dependencySatisfaction: z.ZodNumber;
    riskAssessment: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    riskAssessment: number;
    totalExecutionTime: number;
    resourceUtilization: number;
    parallelizationFactor: number;
    criticalPathDuration: number;
    dependencySatisfaction: number;
}, {
    riskAssessment: number;
    totalExecutionTime: number;
    resourceUtilization: number;
    parallelizationFactor: number;
    criticalPathDuration: number;
    dependencySatisfaction: number;
}>;
