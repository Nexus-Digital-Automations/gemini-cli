/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { EventEmitter } from 'node:events';
import type { Task, TaskCategory } from './TaskQueue.js';
import type { TaskId } from './types.js';
/**
 * Advanced scheduling algorithms
 */
export declare enum SchedulingAlgorithm {
    FIFO = "fifo",// First In, First Out
    PRIORITY = "priority",// Priority-based scheduling
    SHORTEST_JOB_FIRST = "sjf",// Shortest estimated duration first
    DEADLINE_MONOTONIC = "dm",// Earliest deadline first
    DEPENDENCY_AWARE = "dependency",// Considers task dependencies
    RESOURCE_OPTIMAL = "resource",// Optimizes resource utilization
    MACHINE_LEARNING = "ml",// ML-based intelligent scheduling
    HYBRID_ADAPTIVE = "hybrid"
}
/**
 * Scheduling context for decision making
 */
export interface SchedulingContext {
    availableResources: Map<string, number>;
    currentWorkload: number;
    historicalPerformance: Map<TaskCategory, number>;
    timeOfDay: number;
    systemLoad: number;
    queueDepth: number;
    criticalPathTasks: Set<TaskId>;
}
/**
 * Scheduling decision result
 */
export interface SchedulingDecision {
    selectedTasks: Task[];
    reasoning: string[];
    expectedOutcome: {
        totalDuration: number;
        resourceUtilization: number;
        parallelismFactor: number;
        riskAssessment: 'low' | 'medium' | 'high';
    };
    alternatives: Array<{
        tasks: Task[];
        score: number;
        tradeoffs: string[];
    }>;
    metadata: {
        algorithm: SchedulingAlgorithm;
        decisionTime: Date;
        confidenceScore: number;
    };
}
/**
 * Advanced priority scheduler with multiple algorithms and intelligent optimization
 */
export declare class PriorityScheduler extends EventEmitter {
    private options;
    private currentAlgorithm;
    private schedulingHistory;
    private performanceMetrics;
    private learningData;
    private algorithmConfigs;
    constructor(initialAlgorithm?: SchedulingAlgorithm, options?: {
        enableMachineLearning?: boolean;
        adaptiveThreshold?: number;
        maxLearningHistory?: number;
        performanceWindow?: number;
        adaptiveLearning?: boolean;
        performanceTracking?: boolean;
        resourceAware?: boolean;
        dependencyAware?: boolean;
    });
    /**
     * Main scheduling function - selects optimal tasks for execution
     */
    scheduleNextTasks(eligibleTasks: Task[], availableSlots: number, context: SchedulingContext): Promise<SchedulingDecision>;
    /**
     * Select the most appropriate scheduling algorithm for current context
     */
    private selectOptimalAlgorithm;
    /**
     * Apply the selected scheduling algorithm
     */
    private applySchedulingAlgorithm;
    /**
     * First In, First Out scheduling
     */
    private applyFIFOScheduling;
    /**
     * Priority-based scheduling with dynamic factors
     */
    private applyPriorityScheduling;
    /**
     * Shortest Job First scheduling
     */
    private applySJFScheduling;
    /**
     * Deadline Monotonic scheduling (Earliest Deadline First)
     */
    private applyDeadlineScheduling;
    /**
     * Dependency-aware scheduling with topological sorting
     */
    private applyDependencyAwareScheduling;
    /**
     * Resource-optimal scheduling
     */
    private applyResourceOptimalScheduling;
    /**
     * Machine Learning-based scheduling
     */
    private applyMLScheduling;
    /**
     * Hybrid adaptive scheduling combining multiple approaches
     */
    private applyHybridScheduling;
    /**
     * Calculate priority score for a task
     */
    private calculatePriorityScore;
    /**
     * Calculate deadline urgency (0-1 scale)
     */
    private calculateDeadlineUrgency;
    /**
     * Build dependency graph from tasks
     */
    private buildDependencyGraph;
    /**
     * Perform topological sort on dependency graph
     */
    private topologicalSort;
    /**
     * Select tasks that can run in parallel
     */
    private selectParallelizableTasks;
    /**
     * Calculate resource efficiency score for a task
     */
    private calculateResourceEfficiency;
    /**
     * Calculate resource conflicts with other tasks
     */
    private calculateResourceConflicts;
    /**
     * Calculate resource availability factor
     */
    private calculateResourceAvailabilityFactor;
    /**
     * Get historical success rate for similar tasks
     */
    private getHistoricalSuccessRate;
    /**
     * Predict optimal scheduling using ML techniques
     */
    private predictOptimalScheduling;
    /**
     * Extract features for ML processing
     */
    private extractFeatures;
    /**
     * Calculate similarity between feature vectors
     */
    private calculateSimilarity;
    /**
     * Score a scheduling option
     */
    private scoreSchedulingOption;
    /**
     * Calculate expected outcome for selected tasks
     */
    private calculateExpectedOutcome;
    /**
     * Generate alternative scheduling options
     */
    private generateAlternatives;
    /**
     * Generate reasoning for priority-based decisions
     */
    private generatePriorityReasoning;
    /**
     * Record scheduling decision for learning
     */
    private recordSchedulingDecision;
    /**
     * Update algorithm performance metrics
     */
    private updateAlgorithmPerformance;
    /**
     * Learn from task execution outcomes
     */
    recordExecutionOutcome(decision: SchedulingDecision, outcomes: TaskResult[]): void;
    /**
     * Get current scheduling performance metrics
     */
    getPerformanceMetrics(): {
        algorithmPerformance: Map<SchedulingAlgorithm, number>;
        currentAlgorithm: SchedulingAlgorithm;
        totalDecisions: number;
        learningDataSize: number;
    };
    /**
     * Switch to a different scheduling algorithm
     */
    setAlgorithm(algorithm: SchedulingAlgorithm): void;
    /**
     * Initialize algorithm configurations
     */
    private initializeAlgorithmConfigs;
    /**
     * Initialize performance metrics for all algorithms
     */
    private initializePerformanceMetrics;
    /**
     * Clear learning data and reset metrics
     */
    reset(): void;
}
interface TaskResult {
    taskId: TaskId;
    success: boolean;
    output?: unknown;
    error?: {
        message: string;
        code?: string;
        stack?: string;
        details?: Record<string, unknown>;
    };
    metrics?: {
        startTime: Date;
        endTime: Date;
        duration: number;
        memoryUsage?: number;
        cpuUsage?: number;
    };
}
export {};
