/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { EventEmitter } from 'node:events';
import type { Task, TaskPriority, TaskCategory, PriorityFactors } from './TaskQueue.js';
/**
 * Advanced priority calculation algorithms
 */
export declare enum PriorityAlgorithm {
    WEIGHTED_FACTORS = "weighted_factors",
    URGENCY_IMPACT_MATRIX = "urgency_impact_matrix",
    DEPENDENCY_CRITICAL_PATH = "dependency_critical_path",
    RESOURCE_OPTIMIZATION = "resource_optimization",
    MACHINE_LEARNING = "machine_learning"
}
/**
 * Priority calculation configuration
 */
export interface PriorityCalculationConfig {
    algorithm: PriorityAlgorithm;
    weights: {
        age: number;
        userImportance: number;
        systemCriticality: number;
        dependencyWeight: number;
        resourceAvailability: number;
        executionHistory: number;
        deadlinePressure: number;
        businessValue: number;
        riskFactor: number;
    };
    boostFactors: {
        criticalPathMultiplier: number;
        blockingTaskMultiplier: number;
        expiredDeadlineMultiplier: number;
        resourceStarvedMultiplier: number;
    };
    decayFactors: {
        failureDecayRate: number;
        staleTaskDecayRate: number;
        resourceContentionDecayRate: number;
    };
}
/**
 * Priority adjustment reason for auditing
 */
export interface PriorityAdjustmentReason {
    factor: string;
    oldValue: number;
    newValue: number;
    influence: number;
    reasoning: string;
    timestamp: Date;
}
/**
 * Priority calculation result with audit trail
 */
export interface PriorityCalculationResult {
    taskId: string;
    oldPriority: number;
    newPriority: number;
    algorithm: PriorityAlgorithm;
    factors: PriorityFactors;
    adjustmentReasons: PriorityAdjustmentReason[];
    confidence: number;
    calculationTime: number;
    metadata: Record<string, unknown>;
}
/**
 * Task priority statistics for analytics
 */
export interface PriorityStatistics {
    averagePriority: number;
    priorityDistribution: Record<TaskPriority, number>;
    categoryPriorityAverages: Record<TaskCategory, number>;
    priorityVolatility: number;
    adjustmentFrequency: number;
    topPriorityFactors: Array<{
        factor: string;
        influence: number;
        frequency: number;
    }>;
}
/**
 * Advanced Task Priority Manager with intelligent scheduling algorithms
 *
 * Features:
 * - Multiple priority calculation algorithms
 * - Dynamic priority adjustment with audit trails
 * - Machine learning-based priority prediction
 * - Critical path and dependency analysis
 * - Resource optimization prioritization
 * - Business value and risk factor integration
 */
export declare class TaskPriorityManager extends EventEmitter {
    private config;
    private priorityHistory;
    private factorLearningData;
    private statistics;
    constructor(config?: Partial<PriorityCalculationConfig>);
    /**
     * Calculate dynamic priority for a task using the configured algorithm
     */
    calculatePriority(task: Task, allTasks: Task[], dependencyGraph?: Map<string, string[]>): Promise<PriorityCalculationResult>;
    /**
     * Weighted factors priority calculation (baseline algorithm)
     */
    private calculateWeightedFactorsPriority;
    /**
     * Urgency-Impact matrix priority calculation
     */
    private calculateUrgencyImpactPriority;
    /**
     * Critical path dependency-aware priority calculation
     */
    private calculateCriticalPathPriority;
    /**
     * Resource-optimized priority calculation
     */
    private calculateResourceOptimizedPriority;
    /**
     * Machine learning-based priority calculation
     */
    private calculateMLPriority;
    /**
     * Calculate critical path length for a task
     */
    private calculateCriticalPathLength;
    /**
     * Calculate resource contention for a task
     */
    private calculateResourceContention;
    /**
     * Calculate ML feature weights from historical data
     */
    private calculateMLFeatureWeights;
    /**
     * Store priority calculation for learning and auditing
     */
    private storePriorityCalculation;
    /**
     * Learn from task execution outcome
     */
    learnFromExecution(taskId: string, outcome: 'success' | 'failure', task: Task): void;
    /**
     * Update statistics
     */
    private updateStatistics;
    /**
     * Get priority statistics
     */
    getStatistics(): PriorityStatistics;
    /**
     * Get priority history for a task
     */
    getPriorityHistory(taskId: string): PriorityCalculationResult[];
    /**
     * Update priority calculation configuration
     */
    updateConfiguration(newConfig: Partial<PriorityCalculationConfig>): void;
    /**
     * Get current configuration
     */
    getConfiguration(): PriorityCalculationConfig;
}
