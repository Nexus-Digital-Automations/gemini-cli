/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type winston from 'winston';
import type { ITask, ITaskBreakdownStrategy, TaskContext } from './interfaces/TaskInterfaces.js';
/**
 * Task breakdown configuration
 */
export interface TaskBreakdownConfig {
    /** Enable task breakdown functionality */
    enabled: boolean;
    /** Maximum breakdown depth to prevent infinite recursion */
    maxDepth: number;
    /** Minimum task complexity threshold for breakdown */
    complexityThreshold: number;
    /** Maximum number of subtasks to create */
    maxSubtasks: number;
    /** Enable automatic dependency analysis */
    enableDependencyAnalysis: boolean;
    /** Enable parallel execution optimization */
    enableParallelOptimization: boolean;
    /** Logger instance */
    logger: winston.Logger;
}
/**
 * Intelligent task breakdown system
 *
 * Provides sophisticated algorithms for decomposing complex tasks into
 * manageable subtasks with optimal execution strategies:
 * - Complexity analysis and breakdown decision making
 * - Task type-specific decomposition strategies
 * - Automatic dependency analysis and resolution
 * - Parallel execution opportunity identification
 * - Resource optimization and load balancing
 */
export declare class TaskBreakdown {
    private readonly config;
    private readonly strategies;
    private readonly breakdownHistory;
    private readonly subtaskCounter;
    constructor(config: Partial<TaskBreakdownConfig> & {
        logger: winston.Logger;
    });
    /**
     * Analyze if a task should be broken down
     */
    shouldBreakdown(task: ITask): Promise<boolean>;
    /**
     * Break down a complex task into subtasks
     */
    breakdownTask(task: ITask, context: TaskContext): Promise<ITask[]>;
    /**
     * Get optimal execution order for subtasks considering dependencies
     */
    getExecutionOrder(subtasks: ITask[]): ITask[][];
    /**
     * Register a custom breakdown strategy
     */
    registerStrategy(strategy: ITaskBreakdownStrategy): void;
    /**
     * Get breakdown statistics
     */
    getStats(): {
        totalBreakdowns: number;
        averageComplexity: number;
        strategiesUsed: Record<string, number>;
        averageSubtasks: number;
    };
    /**
     * Analyze task complexity to determine if breakdown is beneficial
     */
    private analyzeComplexity;
    /**
     * Analyze parameter complexity
     */
    private analyzeParameterComplexity;
    /**
     * Get complexity score for task type
     */
    private getTaskTypeComplexity;
    /**
     * Analyze description complexity
     */
    private analyzeDescriptionComplexity;
    /**
     * Analyze context complexity
     */
    private analyzeContextComplexity;
    /**
     * Suggest appropriate breakdown strategy
     */
    private suggestStrategy;
    /**
     * Get task depth in breakdown hierarchy
     */
    private getTaskDepth;
    /**
     * Enhance subtasks with additional metadata and context
     */
    private enhanceSubtasks;
    /**
     * Analyze and set up dependencies between subtasks
     */
    private analyzeDependencies;
    /**
     * Optimize subtasks for parallel execution
     */
    private optimizeForParallelExecution;
    /**
     * Initialize built-in breakdown strategies
     */
    private initializeStrategies;
}
