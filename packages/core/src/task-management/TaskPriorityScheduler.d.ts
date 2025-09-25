/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { EventEmitter } from 'node:events';
import type { Task, TaskPriority, TaskExecutionResult, PriorityFactors } from './TaskQueue.js';
/**
 * @fileoverview Advanced Task Priority Scheduler with Dynamic Adjustment
 *
 * This system provides sophisticated priority scheduling with:
 * - Dynamic priority adjustment based on multiple factors
 * - Machine learning-based priority optimization
 * - Load balancing across multiple priority queues
 * - Fairness guarantees and starvation prevention
 * - Real-time priority recalculation
 */
/**
 * Priority adjustment strategies
 */
export declare enum PriorityStrategy {
    STATIC = "static",// Fixed priority, no adjustment
    AGE_BASED = "age_based",// Increase priority with age
    DEADLINE_DRIVEN = "deadline_driven",// Adjust based on deadline proximity
    DEPENDENCY_AWARE = "dependency_aware",// Consider dependency chains
    WORKLOAD_ADAPTIVE = "workload_adaptive",// Adapt to current workload
    ML_OPTIMIZED = "ml_optimized",// Machine learning based optimization
    HYBRID = "hybrid"
}
/**
 * Load balancing algorithms for priority queues
 */
export declare enum LoadBalanceAlgorithm {
    WEIGHTED_ROUND_ROBIN = "weighted_round_robin",
    DEFICIT_ROUND_ROBIN = "deficit_round_robin",
    FAIR_QUEUING = "fair_queuing",
    CLASS_BASED_QUEUING = "class_based_queuing",
    PRIORITY_QUEUING = "priority_queuing"
}
/**
 * Starvation prevention mechanisms
 */
export declare enum StarvationPreventionMode {
    NONE = "none",// No starvation prevention
    PRIORITY_AGING = "priority_aging",// Gradually increase priority with age
    TIME_SLICING = "time_slicing",// Allocate time slices fairly
    QUOTA_BASED = "quota_based",// Ensure minimum execution quotas
    ADAPTIVE_BOOST = "adaptive_boost"
}
/**
 * Priority scheduler configuration
 */
export interface PrioritySchedulerConfig {
    strategy: PriorityStrategy;
    loadBalanceAlgorithm: LoadBalanceAlgorithm;
    starvationPrevention: StarvationPreventionMode;
    adjustmentInterval: number;
    maxStarvationTime: number;
    priorityDecayRate: number;
    ageWeight: number;
    deadlineWeight: number;
    dependencyWeight: number;
    userWeight: number;
    systemWeight: number;
    fairnessThreshold: number;
    maxPriorityBoost: number;
    minExecutionQuota: number;
    enableBatchAdjustment: boolean;
    enablePredictiveAdjustment: boolean;
    cacheAdjustments: boolean;
}
/**
 * Priority adjustment context
 */
export interface PriorityAdjustmentContext {
    currentTime: Date;
    systemLoad: number;
    queueDepth: number;
    avgWaitTime: number;
    executionHistory: Map<string, TaskExecutionResult[]>;
    resourceUtilization: Record<string, number>;
    fairnessIndex: number;
}
/**
 * Priority queue statistics
 */
export interface PriorityQueueStats {
    priority: TaskPriority;
    taskCount: number;
    avgWaitTime: number;
    executionRate: number;
    starvationCount: number;
    fairnessScore: number;
    resourceUsage: number;
}
/**
 * Priority adjustment event
 */
export interface PriorityAdjustmentEvent {
    taskId: string;
    oldPriority: number;
    newPriority: number;
    adjustmentReason: string;
    factors: PriorityFactors;
    timestamp: Date;
}
/**
 * Advanced Task Priority Scheduler
 */
export declare class TaskPriorityScheduler extends EventEmitter {
    private config;
    private tasks;
    private priorityQueues;
    private adjustmentHistory;
    private starvationTracker;
    private executionQuotas;
    private adjustmentTimer?;
    private adjustmentCache;
    private batchAdjustmentQueue;
    private mlModel?;
    private trainingData;
    constructor(config?: Partial<PrioritySchedulerConfig>);
    /**
     * Add a task to the priority scheduler
     */
    addTask(task: Task): void;
    /**
     * Remove a task from the priority scheduler
     */
    removeTask(taskId: string): boolean;
    /**
     * Get the next task to execute based on priority and load balancing
     */
    getNextTask(): Task | null;
    /**
     * Get multiple tasks for batch execution
     */
    getNextTasks(count: number): Task[];
    /**
     * Update task execution result and adjust priorities
     */
    updateTaskResult(taskId: string, result: TaskExecutionResult): void;
    /**
     * Force immediate priority recalculation for all tasks
     */
    recalculateAllPriorities(): void;
    /**
     * Get priority queue statistics
     */
    getQueueStatistics(): PriorityQueueStats[];
    /**
     * Get comprehensive scheduler metrics
     */
    getSchedulerMetrics(): {
        strategy: PriorityStrategy;
        totalTasks: number;
        avgAdjustmentTime: number;
        fairnessIndex: number;
        starvationEvents: number;
        mlAccuracy?: number;
        queueStats: PriorityQueueStats[];
    };
    /**
     * Calculate dynamic priority for a task
     */
    private calculateDynamicPriority;
    /**
     * Age-based priority calculation
     */
    private calculateAgeBasedPriority;
    /**
     * Deadline-driven priority calculation
     */
    private calculateDeadlineDrivenPriority;
    /**
     * Dependency-aware priority calculation
     */
    private calculateDependencyAwarePriority;
    /**
     * Workload-adaptive priority calculation
     */
    private calculateWorkloadAdaptivePriority;
    /**
     * ML-optimized priority calculation
     */
    private calculateMLOptimizedPriority;
    /**
     * Hybrid priority calculation combining multiple strategies
     */
    private calculateHybridPriority;
    /**
     * Weighted round-robin scheduling
     */
    private weightedRoundRobin;
    /**
     * Deficit round-robin scheduling
     */
    private deficitRoundRobin;
    /**
     * Fair queuing scheduling
     */
    private fairQueuing;
    /**
     * Class-based queuing
     */
    private classBasedQueuing;
    /**
     * Priority queuing (strict priority)
     */
    private priorityQueuing;
    private addToQueue;
    private removeFromQueue;
    private getPriorityLevel;
    private buildAdjustmentContext;
    private calculateInitialQuota;
    private calculateSystemLoad;
    private calculateExecutionRate;
    private calculatePriorityFairness;
    private calculateResourceUsage;
    private calculateOverallFairness;
    private extractMLFeatures;
    private recordTrainingData;
    private calculateMLAccuracy;
    private updateExecutionQuotas;
    private scheduleRelatedAdjustments;
    private recordAdjustmentHistory;
    private selectCategoryByQuota;
    private startPriorityAdjustment;
    private performPriorityAdjustment;
    private processBatchAdjustments;
    private checkForStarvation;
    private updateAllPriorities;
    private adjustSingleTaskPriority;
    private calculateStarvationBoost;
    /**
     * Shutdown the priority scheduler
     */
    shutdown(): void;
}
