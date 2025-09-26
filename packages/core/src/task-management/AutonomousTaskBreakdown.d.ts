/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { EventEmitter } from 'node:events';
import type { Task, TaskContext, TaskExecutionResult } from './TaskQueue.js';
import type { TaskCategory, TaskPriority } from './TaskQueue.js';
/**
 * Task complexity analysis metrics
 */
export interface ComplexityMetrics {
    estimatedDuration: number;
    resourceRequirements: number;
    dependencyComplexity: number;
    riskFactors: number;
    parallelizationOpportunity: number;
    overallComplexity: 'low' | 'medium' | 'high' | 'extreme';
}
/**
 * Subtask breakdown strategy
 */
export declare enum BreakdownStrategy {
    TEMPORAL = "temporal",// Break by time phases
    FUNCTIONAL = "functional",// Break by functional components
    DEPENDENCY = "dependency",// Break by dependency chains
    RESOURCE = "resource",// Break by resource requirements
    RISK_BASED = "risk_based",// Break by risk levels
    HYBRID = "hybrid"
}
/**
 * Subtask definition
 */
export interface SubTask {
    id: string;
    parentTaskId: string;
    title: string;
    description: string;
    category: TaskCategory;
    priority: TaskPriority;
    estimatedDuration: number;
    dependencies: string[];
    dependents: string[];
    executeFunction: (task: Task, context: TaskContext) => Promise<TaskExecutionResult>;
    validateFunction?: (task: Task, context: TaskContext) => Promise<boolean>;
    rollbackFunction?: (task: Task, context: TaskContext) => Promise<void>;
    breakdownStrategy: BreakdownStrategy;
    sequenceOrder: number;
    canRunInParallel: boolean;
    qualityGates: string[];
    riskLevel: 'low' | 'medium' | 'high';
    validationCriteria: string[];
    rollbackRequired: boolean;
}
/**
 * Task breakdown result
 */
export interface TaskBreakdownResult {
    originalTask: Task;
    subtasks: SubTask[];
    breakdownStrategy: BreakdownStrategy;
    expectedImprovement: {
        parallelization: number;
        riskReduction: number;
        resourceEfficiency: number;
        monitorability: number;
    };
    metadata: {
        complexityReduction: number;
        totalSubtasks: number;
        parallelGroups: number;
        criticalPath: string[];
        estimatedSpeedup: number;
    };
}
/**
 * Breakdown configuration
 */
export interface BreakdownConfig {
    maxSubtasks: number;
    minSubtaskDuration: number;
    maxSubtaskDuration: number;
    complexityThreshold: number;
    parallelizationPreference: number;
    riskTolerance: number;
    enableSmartBreakdown: boolean;
    strategies: BreakdownStrategy[];
}
/**
 * Task breakdown templates for common patterns
 */
export interface BreakdownTemplate {
    id: string;
    name: string;
    description: string;
    applicableCategories: TaskCategory[];
    strategy: BreakdownStrategy;
    template: (task: Task) => SubTask[];
}
/**
 * Autonomous Task Breakdown Engine
 * Automatically decomposes complex tasks into optimized subtasks
 */
export declare class AutonomousTaskBreakdown extends EventEmitter {
    private config;
    private templates;
    private breakdownHistory;
    private performanceMetrics;
    private learningData;
    constructor(config?: Partial<BreakdownConfig>);
    /**
     * Main method: Analyze task and perform autonomous breakdown if beneficial
     */
    analyzeAndBreakdown(task: Task): Promise<TaskBreakdownResult | null>;
    /**
     * Analyze task complexity to determine breakdown necessity
     */
    private analyzeTaskComplexity;
    /**
     * Determine if task should be broken down
     */
    private shouldBreakdownTask;
    /**
     * Select optimal breakdown strategy based on task characteristics
     */
    private selectBreakdownStrategy;
    /**
     * Perform task breakdown using selected strategy
     */
    private performBreakdown;
    /**
     * Temporal breakdown: Break task into time-based phases
     */
    private performTemporalBreakdown;
    /**
     * Functional breakdown: Break task by functional components
     */
    private performFunctionalBreakdown;
    /**
     * Dependency-based breakdown: Organize by dependency chains
     */
    private performDependencyBreakdown;
    /**
     * Resource-based breakdown: Organize by resource requirements
     */
    private performResourceBreakdown;
    /**
     * Risk-based breakdown: Organize by risk levels
     */
    private performRiskBasedBreakdown;
    /**
     * Hybrid breakdown: Combination of multiple strategies
     */
    private performHybridBreakdown;
    private calculateParallelizationOpportunity;
    private calculateComplexityScore;
    private calculateOptimalPhaseCount;
    private scoreTemporalStrategy;
    private scoreFunctionalStrategy;
    private scoreDependencyStrategy;
    private scoreResourceStrategy;
    private scoreRiskBasedStrategy;
    private scoreHybridStrategy;
    private createPhaseExecuteFunction;
    private createPhaseValidateFunction;
    private createPhaseRollbackFunction;
    private createComponentExecuteFunction;
    private createComponentValidateFunction;
    private createComponentRollbackFunction;
    private createDependencyExecuteFunction;
    private createDependencyValidateFunction;
    private createDependencyRollbackFunction;
    private createResourceExecuteFunction;
    private createResourceValidateFunction;
    private createResourceRollbackFunction;
    private createRiskExecuteFunction;
    private createRiskValidateFunction;
    private createRiskRollbackFunction;
    private identifyFunctionalComponents;
    private analyzeDependencyChains;
    private groupByResourceRequirements;
    private analyzeRiskComponents;
    private calculateComponentPriority;
    private calculateLinkPriority;
    private calculateResourcePriority;
    private calculateRiskPriority;
    private generatePhaseQualityGates;
    private calculatePhaseRiskLevel;
    private generatePhaseValidationCriteria;
    private calculateExpectedImprovement;
    private generateBreakdownMetadata;
    private scoreBreakdownOption;
    private calculateIdealSubtaskCount;
    private applyHybridOptimizations;
    private mergeSmallSubtasks;
    private optimizeDependencyChains;
    private balanceParallelGroups;
    private optimizeBreakdown;
    private mergeExcessSubtasks;
    private applyDurationConstraints;
    private updatePerformanceMetrics;
    private initializeBreakdownTemplates;
    /**
     * Record execution outcomes for learning and improvement
     */
    recordExecutionOutcome(breakdown: TaskBreakdownResult, executionResults: Array<{
        subtaskId: string;
        success: boolean;
        duration: number;
        parallelization: number;
        resourceEfficiency: number;
    }>): void;
    /**
     * Get breakdown performance metrics
     */
    getPerformanceMetrics(): {
        totalBreakdowns: number;
        successRate: number;
        averageSpeedup: number;
        complexityReduction: number;
        parallelizationGain: number;
        learningDataSize: number;
    };
    /**
     * Update breakdown configuration
     */
    updateConfig(newConfig: Partial<BreakdownConfig>): void;
    /**
     * Clear learning data and reset metrics
     */
    reset(): void;
}
