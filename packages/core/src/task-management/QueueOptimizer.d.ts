/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { EventEmitter } from 'node:events';
import type { Task, QueueMetrics } from './TaskQueue.js';
import type { DependencyAnalysis } from './DependencyResolver.js';
/**
 * Optimization strategy types
 */
export declare enum OptimizationStrategy {
    THROUGHPUT_MAXIMIZATION = "throughput_maximization",
    LATENCY_MINIMIZATION = "latency_minimization",
    RESOURCE_EFFICIENCY = "resource_efficiency",
    DEADLINE_OPTIMIZATION = "deadline_optimization",
    BALANCED = "balanced"
}
/**
 * Resource utilization tracking
 */
export interface ResourceUtilization {
    resourceId: string;
    currentLoad: number;
    averageLoad: number;
    peakLoad: number;
    allocatedTasks: string[];
    capacity: number;
    efficiency: number;
}
/**
 * Optimization recommendations
 */
export interface OptimizationRecommendation {
    type: 'reorder' | 'batch' | 'parallel' | 'defer' | 'priority_adjust' | 'resource_rebalance';
    priority: 'high' | 'medium' | 'low';
    taskIds: string[];
    description: string;
    expectedImprovement: number;
    riskLevel: 'low' | 'medium' | 'high';
    metadata?: Record<string, unknown>;
}
/**
 * Batch optimization result
 */
export interface BatchOptimization {
    originalOrder: string[];
    optimizedOrder: string[];
    batches: Array<{
        taskIds: string[];
        estimatedDuration: number;
        resourceRequirements: string[];
        parallelizable: boolean;
    }>;
    expectedSpeedup: number;
    resourceEfficiencyGain: number;
}
/**
 * Load balancing recommendation
 */
export interface LoadBalancingRecommendation {
    resourceId: string;
    currentLoad: number;
    targetLoad: number;
    tasksToMove: Array<{
        taskId: string;
        fromResource: string;
        toResource: string;
        impact: number;
    }>;
    expectedImprovement: number;
}
/**
 * Advanced queue optimization engine with machine learning insights
 */
export declare class QueueOptimizer extends EventEmitter {
    private resourceUtilization;
    private optimizationHistory;
    private performanceMetrics;
    constructor();
    /**
     * Analyze queue and generate optimization recommendations
     */
    optimizeQueue(tasks: Map<string, Task>, dependencyAnalysis: DependencyAnalysis, metrics: QueueMetrics, strategy?: OptimizationStrategy): OptimizationRecommendation[];
    /**
     * Optimize task batching for parallel execution
     */
    optimizeBatching(tasks: Map<string, Task>, dependencyAnalysis: DependencyAnalysis): BatchOptimization;
    /**
     * Generate load balancing recommendations
     */
    generateLoadBalancingRecommendations(tasks: Map<string, Task>): LoadBalancingRecommendation[];
    /**
     * Analyze queue bottlenecks
     */
    analyzeBottlenecks(tasks: Map<string, Task>, dependencyAnalysis: DependencyAnalysis): Array<{
        type: 'dependency' | 'resource' | 'priority' | 'batch';
        description: string;
        impact: number;
        affectedTasks: string[];
        recommendation: string;
    }>;
    /**
     * Predict queue performance based on current state
     */
    predictPerformance(tasks: Map<string, Task>, dependencyAnalysis: DependencyAnalysis, projectionHours?: number): {
        expectedThroughput: number;
        expectedCompletionTime: number;
        resourceUtilizationForecast: Map<string, number>;
        bottleneckPredictions: string[];
        confidenceScore: number;
    };
    /**
     * Apply optimization recommendations
     */
    applyOptimizations(tasks: Map<string, Task>, recommendations: OptimizationRecommendation[]): {
        applied: number;
        failed: number;
        results: Array<{
            recommendation: OptimizationRecommendation;
            success: boolean;
            error?: string;
        }>;
    };
    /**
     * Optimize for maximum throughput
     */
    private optimizeForThroughput;
    /**
     * Optimize for minimum latency
     */
    private optimizeForLatency;
    /**
     * Optimize for resource efficiency
     */
    private optimizeForResourceEfficiency;
    /**
     * Optimize for deadline compliance
     */
    private optimizeForDeadlines;
    /**
     * Generate balanced recommendations considering all factors
     */
    private generateBalancedRecommendations;
    /**
     * Generate general optimization recommendations
     */
    private generateGeneralOptimizations;
    /**
     * Update resource utilization tracking
     */
    private updateResourceUtilization;
    /**
     * Find batchable task categories
     */
    private findBatchableCategories;
    /**
     * Identify batch groups for optimization
     */
    private identifyBatchGroups;
    /**
     * Check if two tasks are compatible for batching
     */
    private areTasksBatchCompatible;
    /**
     * Check for resource conflicts between tasks
     */
    private hasResourceConflict;
    /**
     * Optimize batch order
     */
    private optimizeBatchOrder;
    /**
     * Calculate batch speedup
     */
    private calculateBatchSpeedup;
    /**
     * Calculate resource efficiency gain
     */
    private calculateResourceEfficiencyGain;
    /**
     * Additional utility methods for optimization...
     */
    private findBlockingTasks;
    private identifyResourceBottlenecks;
    private identifyPriorityInversions;
    private identifyBatchingOpportunities;
    private calculateAverageTaskDuration;
    private estimateTaskCompletionTime;
    private calculateHistoricalAccuracy;
    private canMoveTask;
    private calculateMoveImpact;
    private findResourceSharingOpportunities;
    private deduplicateRecommendations;
    private applyRecommendation;
    private applyPriorityAdjustment;
    private applyBatching;
    private applyParallelization;
    private applyReordering;
    private applyDeferral;
    private applyResourceRebalancing;
}
