/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type winston from 'winston';
import type { ITask, ITaskBreakdownStrategy, TaskContext } from '../interfaces/TaskInterfaces.js';
import type { TaskType, TaskPriority } from '../interfaces/TaskInterfaces.js';
/**
 * Task complexity analysis result
 */
export interface ComplexityAnalysis {
    /** Overall complexity score (1-10) */
    score: number;
    /** Factors contributing to complexity */
    factors: ComplexityFactor[];
    /** Recommended breakdown strategy */
    recommendedStrategy: string | null;
    /** Estimated subtask count */
    estimatedSubtasks: number;
    /** Analysis confidence (0-1) */
    confidence: number;
}
/**
 * Individual complexity factor
 */
export interface ComplexityFactor {
    /** Factor name */
    name: string;
    /** Factor weight in complexity calculation */
    weight: number;
    /** Factor description */
    description: string;
    /** Factor value */
    value: number;
}
/**
 * Task breakdown result with validation
 */
export interface BreakdownResult {
    /** Whether breakdown was successful */
    success: boolean;
    /** Generated subtasks */
    subtasks: ITask[];
    /** Strategy used for breakdown */
    strategy: string;
    /** Breakdown execution time */
    executionTime: number;
    /** Validation results */
    validation: BreakdownValidation;
    /** Generated task dependencies */
    dependencies: TaskDependencyMapping[];
    /** Error message if breakdown failed */
    error?: string;
}
/**
 * Breakdown validation metrics
 */
export interface BreakdownValidation {
    /** Whether breakdown passes validation */
    isValid: boolean;
    /** Validation issues found */
    issues: ValidationIssue[];
    /** Coverage percentage of original task */
    coverage: number;
    /** Estimated execution time vs original */
    estimatedTimeRatio: number;
    /** Subtask complexity distribution */
    complexityDistribution: number[];
}
/**
 * Validation issue description
 */
export interface ValidationIssue {
    /** Issue severity */
    severity: 'critical' | 'warning' | 'info';
    /** Issue type */
    type: string;
    /** Issue description */
    message: string;
    /** Affected subtask IDs */
    affectedTasks: string[];
}
/**
 * Task dependency mapping for breakdown
 */
export interface TaskDependencyMapping {
    /** Source task ID */
    from: string;
    /** Target task ID */
    to: string;
    /** Dependency type */
    type: 'sequential' | 'parallel' | 'conditional';
    /** Dependency strength (0-1) */
    strength: number;
    /** Dependency reason */
    reason: string;
}
/**
 * Base implementation for task breakdown strategies
 */
export declare abstract class BaseBreakdownStrategy implements ITaskBreakdownStrategy {
    readonly name: string;
    readonly description: string;
    readonly supportedTypes: TaskType[];
    protected readonly logger: winston.Logger;
    constructor(name: string, description: string, supportedTypes: TaskType[]);
    /**
     * Check if this strategy can handle the given task
     */
    canBreakdown(task: ITask): boolean;
    /**
     * Abstract method for breaking down tasks
     */
    abstract breakdownTask(task: ITask, context: TaskContext): Promise<ITask[]>;
    /**
     * Estimate task complexity using various factors
     */
    estimateComplexity(task: ITask): number;
    /**
     * Validate breakdown result
     */
    validateBreakdown(originalTask: ITask, subtasks: ITask[]): boolean;
    /**
     * Analyze complexity factors for a task
     */
    protected analyzeComplexityFactors(task: ITask): ComplexityFactor[];
    /**
     * Get inherent complexity score for task types
     */
    protected getTypeComplexity(type: TaskType): number;
    /**
     * Perform comprehensive breakdown validation
     */
    protected performBreakdownValidation(originalTask: ITask, subtasks: ITask[]): BreakdownValidation;
    /**
     * Generate subtask with inherited properties
     */
    protected createSubtask(originalTask: ITask, name: string, description: string, parameters?: Record<string, unknown>, priority?: TaskPriority): ITask;
}
/**
 * Code generation task breakdown strategy
 */
export declare class CodeGenerationBreakdownStrategy extends BaseBreakdownStrategy {
    constructor();
    breakdownTask(task: ITask, context: TaskContext): Promise<ITask[]>;
}
/**
 * Analysis task breakdown strategy
 */
export declare class AnalysisBreakdownStrategy extends BaseBreakdownStrategy {
    constructor();
    breakdownTask(task: ITask, context: TaskContext): Promise<ITask[]>;
}
/**
 * Testing task breakdown strategy
 */
export declare class TestingBreakdownStrategy extends BaseBreakdownStrategy {
    constructor();
    breakdownTask(task: ITask, context: TaskContext): Promise<ITask[]>;
}
/**
 * Main task breakdown engine that coordinates multiple strategies
 */
export declare class TaskBreakdownEngine {
    private readonly logger;
    private readonly strategies;
    constructor();
    /**
     * Initialize built-in breakdown strategies
     */
    private initializeStrategies;
    /**
     * Register custom breakdown strategy
     */
    registerStrategy(strategy: ITaskBreakdownStrategy): void;
    /**
     * Remove registered strategy
     */
    unregisterStrategy(name: string): boolean;
    /**
     * Get all registered strategies
     */
    getStrategies(): ITaskBreakdownStrategy[];
    /**
     * Analyze task complexity using all available strategies
     */
    analyzeComplexity(task: ITask): ComplexityAnalysis;
    /**
     * Break down task using appropriate strategy
     */
    breakdownTask(task: ITask, context: TaskContext): Promise<BreakdownResult>;
    /**
     * Find strategies that can handle the given task
     */
    private findApplicableStrategies;
    /**
     * Generate dependencies between subtasks based on their phases
     */
    private generateTaskDependencies;
    /**
     * Get breakdown statistics
     */
    getStats(): Record<string, unknown>;
    /**
     * Dispose of the breakdown engine
     */
    dispose(): void;
}
