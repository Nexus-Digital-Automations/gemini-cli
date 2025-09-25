/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { EventEmitter } from 'node:events';
import type { ITask, ITaskBreakdownStrategy, TaskContext, TaskDependency } from './interfaces/TaskInterfaces.js';
/**
 * Task complexity assessment metrics
 */
export interface ComplexityAssessment {
    /** Overall complexity score (1-10) */
    score: number;
    /** Factors contributing to complexity */
    factors: ComplexityFactor[];
    /** Estimated effort in hours */
    estimatedEffort: number;
    /** Recommended breakdown approach */
    recommendedStrategy: string;
    /** Confidence in assessment (0-1) */
    confidence: number;
}
/**
 * Complexity factors that contribute to overall task complexity
 */
export interface ComplexityFactor {
    /** Factor name */
    name: string;
    /** Factor impact on complexity (1-10) */
    impact: number;
    /** Factor description */
    description: string;
    /** Factor weight in overall calculation */
    weight: number;
}
/**
 * Task decomposition result
 */
export interface DecompositionResult {
    /** Generated subtasks */
    subtasks: ITask[];
    /** Dependency relationships between subtasks */
    dependencies: TaskDependency[];
    /** Execution sequence recommendations */
    executionPlan: ExecutionPlan;
    /** Decomposition metadata */
    metadata: DecompositionMetadata;
}
/**
 * Execution plan for subtasks
 */
export interface ExecutionPlan {
    /** Parallel execution groups */
    parallelGroups: ITask[][];
    /** Sequential execution order */
    sequentialOrder: ITask[];
    /** Critical path tasks */
    criticalPath: ITask[];
    /** Estimated total execution time */
    estimatedTotalTime: number;
}
/**
 * Metadata about the decomposition process
 */
export interface DecompositionMetadata {
    /** Strategy used for breakdown */
    strategy: string;
    /** Decomposition timestamp */
    timestamp: Date;
    /** Number of subtasks generated */
    subtaskCount: number;
    /** Complexity reduction achieved */
    complexityReduction: number;
    /** Decomposition confidence score */
    confidence: number;
}
/**
 * Task breakdown configuration
 */
export interface BreakdownConfig {
    /** Maximum subtasks per breakdown */
    maxSubtasks: number;
    /** Minimum complexity threshold for breakdown */
    minComplexityThreshold: number;
    /** Maximum decomposition depth */
    maxDecompositionDepth: number;
    /** Enable automatic dependency detection */
    enableDependencyDetection: boolean;
    /** Enable intelligent subtask sizing */
    enableIntelligentSizing: boolean;
    /** Target subtask complexity score */
    targetSubtaskComplexity: number;
}
/**
 * AI-powered task breakdown engine for complex task decomposition
 *
 * Features:
 * - Intelligent complexity assessment using multiple factors
 * - Automatic task decomposition with configurable strategies
 * - Dependency detection and sequencing optimization
 * - Subtask generation with proper parent-child relationships
 * - Task estimation and timeline prediction
 * - Multiple breakdown strategies for different task types
 */
export declare class TaskBreakdownEngine extends EventEmitter {
    private readonly logger;
    private readonly config;
    private readonly strategies;
    private readonly complexityFactors;
    constructor(config?: Partial<BreakdownConfig>);
    /**
     * Assess task complexity using multiple factors
     */
    assessComplexity(task: ITask): ComplexityAssessment;
    /**
     * Break down complex task into manageable subtasks
     */
    decomposeTask(task: ITask, context: TaskContext, depth?: number): Promise<DecompositionResult>;
    /**
     * Generate subtasks with proper parent-child relationships
     */
    generateSubtasks(parentTask: ITask, decomposition: DecompositionResult, context: TaskContext): Promise<ITask[]>;
    /**
     * Register a task breakdown strategy
     */
    registerStrategy(strategy: ITaskBreakdownStrategy): void;
    /**
     * Get all registered strategies
     */
    getStrategies(): ITaskBreakdownStrategy[];
    /**
     * Update breakdown configuration
     */
    updateConfig(updates: Partial<BreakdownConfig>): void;
    /**
     * Get current configuration
     */
    getConfig(): BreakdownConfig;
    /**
     * Initialize default complexity factors
     */
    private initializeComplexityFactors;
    /**
     * Initialize default breakdown strategies
     */
    private initializeDefaultStrategies;
    /**
     * Calculate impact of complexity factor on specific task
     */
    private calculateFactorImpact;
    /**
     * Get base complexity score for task type
     */
    private getTaskTypeComplexity;
    /**
     * Get base effort estimate for task type (in hours)
     */
    private getBaseEffortForTaskType;
    /**
     * Select optimal breakdown strategy based on task and complexity
     */
    private selectOptimalStrategy;
    /**
     * Detect dependencies between subtasks
     */
    private detectTaskDependencies;
    /**
     * Check if two tasks have a logical dependency
     */
    private hasLogicalDependency;
    /**
     * Check if two tasks have a resource dependency
     */
    private hasResourceDependency;
    /**
     * Extract resource identifiers from task parameters
     */
    private extractResourcesFromTask;
    /**
     * Create execution plan for subtasks
     */
    private createExecutionPlan;
    /**
     * Find critical path through task dependencies
     */
    private findCriticalPath;
    /**
     * Build dependency chain for a task
     */
    private buildDependencyChain;
    /**
     * Calculate complexity reduction achieved by decomposition
     */
    private calculateComplexityReduction;
    /**
     * Create subtask with proper parent-child relationship
     */
    private createSubtask;
    /**
     * Generate unique subtask ID
     */
    private generateSubtaskId;
    /**
     * Apply intelligent sizing to subtask
     */
    private applyIntelligentSizing;
    /**
     * Create empty decomposition result
     */
    private createEmptyDecompositionResult;
}
