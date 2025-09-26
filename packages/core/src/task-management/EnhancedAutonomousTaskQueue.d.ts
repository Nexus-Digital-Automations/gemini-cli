/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { EventEmitter } from 'node:events';
import { type Task, type TaskContext, type QueueMetrics } from './TaskQueue.js';
import type { PriorityScheduler, SchedulingAlgorithm } from './PriorityScheduler.js';
import type { OptimizationStrategy } from './QueueOptimizer.js';
import type { AutonomousTaskBreakdown, BreakdownStrategy } from './AutonomousTaskBreakdown.js';
/**
 * Enhanced autonomous queue configuration
 */
export interface EnhancedQueueConfig {
    maxConcurrentTasks: number;
    maxRetries: number;
    defaultTimeout: number;
    enableAutonomousBreakdown: boolean;
    breakdownThreshold: number;
    maxBreakdownDepth: number;
    breakdownStrategies: BreakdownStrategy[];
    schedulingAlgorithm: SchedulingAlgorithm;
    optimizationStrategy: OptimizationStrategy;
    enableAdaptiveScheduling: boolean;
    metricsEnabled: boolean;
    performanceOptimization: boolean;
    learningEnabled: boolean;
    resourcePools: Map<string, number>;
    enableResourceOptimization: boolean;
}
/**
 * Autonomous task execution context
 */
export interface AutonomousExecutionContext extends TaskContext {
    breakdownLevel?: number;
    parentTaskId?: string;
    breakdownStrategy?: BreakdownStrategy;
    autonomousMetadata?: {
        originalComplexity: number;
        breakdownReason: string;
        expectedImprovement: number;
        actualImprovement?: number;
    };
}
/**
 * Autonomous queue metrics
 */
export interface AutonomousQueueMetrics extends QueueMetrics {
    tasksAnalyzedForBreakdown: number;
    tasksBrokenDown: number;
    averageBreakdownImprovement: number;
    breakdownSuccessRate: number;
    autonomousOptimizations: number;
    optimizationSuccessRate: number;
    adaptiveSchedulingAdjustments: number;
    learningDataPoints: number;
    predictionAccuracy: number;
    autonomyLevel: number;
}
/**
 * Enhanced Autonomous Task Queue with intelligent breakdown and self-optimization
 */
export declare class EnhancedAutonomousTaskQueue extends EventEmitter {
    private baseQueue;
    private priorityScheduler;
    private queueOptimizer;
    private taskBreakdown;
    private config;
    private breakdownHistory;
    private executionResults;
    private autonomousMetrics;
    private learningEnabled;
    private adaptationHistory;
    constructor(config?: Partial<EnhancedQueueConfig>);
    /**
     * Add task with autonomous analysis and potential breakdown
     */
    addTask(taskDefinition: Partial<Task> & Pick<Task, 'title' | 'description' | 'executeFunction'>): Promise<string>;
    /**
     * Enhanced task creation with autonomous context
     */
    private createEnhancedTask;
    /**
     * Wrap execute function with autonomous monitoring
     */
    private wrapExecuteFunction;
    /**
     * Autonomous breakdown analysis
     */
    private analyzeForBreakdown;
    /**
     * Add breakdown subtasks to queue
     */
    private addBreakdownSubtasks;
    /**
     * Get enhanced queue status with autonomous metrics
     */
    getAutonomousQueueStatus(): AutonomousQueueMetrics;
    /**
     * Calculate current autonomy level (0-1)
     */
    private calculateAutonomyLevel;
    /**
     * Record task execution for learning
     */
    private recordTaskExecution;
    /**
     * Record task failure for learning
     */
    private recordTaskFailure;
    /**
     * Calculate resource efficiency for learning
     */
    private calculateResourceEfficiency;
    /**
     * Update prediction accuracy based on recent performance
     */
    private updatePredictionAccuracy;
    /**
     * Initialize autonomous metrics
     */
    private initializeAutonomousMetrics;
    /**
     * Update autonomous metrics
     */
    private updateAutonomousMetrics;
    /**
     * Setup component integration event handlers
     */
    private setupComponentIntegration;
    /**
     * Start autonomous optimization processes
     */
    private startAutonomousOptimization;
    /**
     * Perform autonomous queue optimization
     */
    private performAutonomousOptimization;
    /**
     * Perform adaptive parameter tuning
     */
    private performAdaptiveParameterTuning;
    /**
     * Log adaptation for monitoring and debugging
     */
    private logAdaptation;
    /**
     * Get recent adaptation history
     */
    getAdaptationHistory(limit?: number): typeof this.adaptationHistory;
    /**
     * Get breakdown performance metrics
     */
    getBreakdownMetrics(): ReturnType<AutonomousTaskBreakdown['getPerformanceMetrics']>;
    /**
     * Get scheduler performance metrics
     */
    getSchedulerMetrics(): ReturnType<PriorityScheduler['getPerformanceMetrics']>;
    /**
     * Manual override for autonomous settings
     */
    updateAutonomousConfig(updates: Partial<EnhancedQueueConfig>): void;
    /**
     * Pause autonomous operations
     */
    pauseAutonomousOperations(): void;
    /**
     * Resume autonomous operations
     */
    resumeAutonomousOperations(): void;
    /**
     * Graceful shutdown with autonomous cleanup
     */
    shutdown(timeoutMs?: number): Promise<void>;
    /**
     * Save autonomous learning state
     */
    private saveAutonomousState;
    /**
     * Forward base queue methods for compatibility
     */
    getTask(taskId: string): Task | undefined;
    getTasks(filter?: (task: Task) => boolean): Task[];
    cancelTask(taskId: string, reason?: string): Promise<boolean>;
    getMetrics(): QueueMetrics;
    cleanup(olderThanMs?: number): void;
}
