/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * @fileoverview Self-Managing Task Queue with Intelligent Scheduling and Autonomous Optimization
 *
 * This module provides an advanced self-managing task queue that autonomously:
 * - Analyzes task complexity and breaks down complex tasks
 * - Optimizes scheduling based on dependencies, resources, and performance metrics
 * - Adapts its behavior through machine learning and historical analysis
 * - Manages resource allocation and load balancing
 * - Provides real-time monitoring and visualization
 * - Maintains cross-session persistence and state recovery
 */
import { EventEmitter } from 'node:events';
import { type EnhancedQueueConfig, type AutonomousQueueMetrics } from './EnhancedAutonomousTaskQueue.js';
import { OptimizationStrategy, type OptimizationRecommendation } from './QueueOptimizer.js';
import type { TaskStatus } from './TaskQueue.js';
import { type Task, TaskPriority, TaskCategory, type TaskContext, type PriorityFactors } from './TaskQueue.js';
import type { TaskMetadata } from './types.js';
/**
 * Advanced self-management configuration
 */
export interface SelfManagingQueueConfig extends EnhancedQueueConfig {
    enableIntelligentPreemption: boolean;
    enableDynamicResourceAllocation: boolean;
    enablePredictiveScheduling: boolean;
    enableAutomaticPriorityAdjustment: boolean;
    enableContinuousOptimization: boolean;
    optimizationIntervalMs: number;
    enableMLBasedPredictions: boolean;
    enableAdaptiveLoadBalancing: boolean;
    maxAcceptableLatency: number;
    targetThroughputPerHour: number;
    resourceUtilizationTarget: number;
    errorRecoveryStrategy: 'retry' | 'skip' | 'fallback' | 'escalate';
    enableStatePersistence: boolean;
    persistenceIntervalMs: number;
    enableStateRecovery: boolean;
    maxHistoryRetentionDays: number;
}
/**
 * Real-time queue metrics for monitoring
 */
export interface RealTimeQueueMetrics extends AutonomousQueueMetrics {
    resourceUtilization: Map<string, number>;
    resourceBottlenecks: string[];
    loadBalancingEfficiency: number;
    averageTaskLatency: number;
    throughputTrend: number[];
    queueGrowthRate: number;
    deadlineComplianceRate: number;
    predictionAccuracy: number;
    adaptationEffectiveness: number;
    optimizationImpact: number;
    systemHealth: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
    alertLevel: 'none' | 'info' | 'warning' | 'error' | 'critical';
    bottleneckAnalysis: string[];
    recommendedActions: string[];
}
/**
 * Task execution prediction
 */
export interface TaskPrediction {
    taskId: string;
    estimatedStartTime: Date;
    estimatedCompletionTime: Date;
    estimatedDuration: number;
    confidenceLevel: number;
    resourceRequirements: Map<string, number>;
    riskFactors: string[];
    dependencies: string[];
}
/**
 * ML prediction interfaces
 */
export interface ComplexityPrediction {
    score: number;
    factors: string[];
    historicalSuccessRate: number;
}
export interface DurationPrediction {
    duration: number;
    confidence: number;
    factors: string[];
}
export interface ResourcePrediction {
    resources: string[];
    estimatedUsage: Map<string, number>;
    confidence: number;
}
export interface FailurePrediction {
    probability: number;
    factors: string[];
    confidence: number;
}
/**
 * Enhanced task definition with proper typing
 */
export interface TaskDefinitionWithML {
    id?: string;
    title: string;
    description: string;
    executeFunction: () => Promise<{
        success: boolean;
        result: unknown;
        duration: number;
    }>;
    estimatedDuration?: number;
    requiredResources?: string[];
    category?: TaskCategory;
    priority?: TaskPriority;
    dependencies?: string[];
    metadata?: Partial<TaskMetadata>;
    priorityFactors?: Partial<PriorityFactors>;
    status?: TaskStatus;
    retryCount?: number;
    timeout?: number;
    context?: TaskContext;
}
/**
 * Execution record with proper typing
 */
export interface ExecutionRecord {
    duration: number;
    startTime: Date;
    endTime: Date;
    success: boolean;
    result?: unknown;
    error?: Error;
}
/**
 * Optimization record with proper typing
 */
export interface OptimizationRecord {
    impact: number;
    timestamp: Date;
    strategy: string;
    metrics: Record<string, number>;
}
/**
 * ML Model interface for prediction components
 */
export interface MLModel {
    taskComplexityPredictor: unknown;
    executionTimePredictor: unknown;
    resourceUsagePredictor: unknown;
    failurePredictionModel: unknown;
}
/**
 * Queue state snapshot for persistence
 */
export interface QueueStateSnapshot {
    timestamp: Date;
    version: string;
    tasks: Task[];
    metrics: RealTimeQueueMetrics;
    config: SelfManagingQueueConfig;
    learningData: {
        executionHistory: ExecutionRecord[];
        adaptationHistory: Array<Record<string, unknown>>;
        performanceBaselines: Map<string, number>;
    };
    resourceState: Map<string, {
        allocated: number;
        available: number;
        reserved: number;
    }>;
}
/**
 * Self-Managing Task Queue with Advanced Intelligence
 */
export declare class SelfManagingTaskQueue extends EventEmitter {
    private baseQueue;
    private scheduler;
    private optimizer;
    private breakdown;
    private config;
    private realTimeMetrics;
    private executionPredictions;
    private resourceAllocation;
    private performanceBaselines;
    private mlModel;
    private stateSnapshots;
    private isShuttingDown;
    private optimizationTimer;
    private persistenceTimer;
    /**
     * Convert TaskDefinitionWithML to Task-compatible format
     */
    private convertToTaskDefinition;
    constructor(config?: Partial<SelfManagingQueueConfig>);
    /**
     * Add task with advanced intelligence and prediction
     */
    addTask(taskDefinition: TaskDefinitionWithML): Promise<string>;
    /**
     * Enhance task definition with ML predictions
     */
    private enhanceTaskWithPredictions;
    /**
     * Check and reserve resources for task execution
     */
    private checkAndReserveResources;
    /**
     * Queue task for later execution when resources become available
     */
    private queueForLaterExecution;
    /**
     * Generate execution prediction for a task
     */
    private generateTaskPrediction;
    /**
     * Initialize resource allocation tracking
     */
    private initializeResourceAllocation;
    /**
     * Initialize real-time metrics
     */
    private initializeRealTimeMetrics;
    /**
     * Initialize ML models for predictions
     */
    private initializeMLModels;
    /**
     * Setup advanced event handling for component integration
     */
    private setupAdvancedEventHandling;
    /**
     * Start autonomous self-management processes
     */
    private startSelfManagementProcesses;
    /**
     * Get comprehensive queue status with real-time metrics
     */
    getRealTimeStatus(): RealTimeQueueMetrics;
    /**
     * Get task execution predictions
     */
    getExecutionPredictions(): Map<string, TaskPrediction>;
    /**
     * Get current resource allocation status
     */
    getResourceAllocationStatus(): Map<string, {
        allocated: number;
        available: number;
        reserved: number;
        utilization: number;
    }>;
    /**
     * Manual optimization trigger with specific strategy
     */
    optimizeNow(strategy?: OptimizationStrategy): Promise<OptimizationRecommendation[]>;
    /**
     * Graceful shutdown with state preservation
     */
    shutdown(timeoutMs?: number): Promise<void>;
    private predictTaskComplexity;
    private predictExecutionTime;
    private predictResourceUsage;
    private predictTaskFailureProbability;
    private calculateResourceAvailability;
    private estimateResourceRequirement;
    private getCategoryResourceMultiplier;
    private calculateQueuePosition;
    private calculateDependencyDelay;
    private calculatePredictionConfidence;
    private identifyTaskRiskFactors;
    private calculateResourceRequirements;
    private updateRealTimeMetrics;
    private handleTaskCompletion;
    private handleTaskFailure;
    private handleTaskBreakdown;
    private handleSchedulingAlgorithmChange;
    private handleOptimizationCompleted;
    private releaseTaskResources;
    private updatePredictionAccuracy;
    private performIntelligentOptimization;
    private persistQueueState;
    private attemptStateRecovery;
    private performAdaptiveLoadBalancing;
    private performHealthCheck;
    private updateResourceUtilizationMetrics;
    private updatePerformanceMetrics;
    private updateHealthIndicators;
    private generateHealthRecommendations;
}
