/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Task, TaskExecutionResult, QueueMetrics, TaskQueueOptions , TaskPriority, TaskCategory } from './TaskQueue.js';
import { TaskQueue } from './TaskQueue.js';
/**
 * @fileoverview Enhanced Task Queue with Advanced Priority Scheduling
 *
 * This enhanced system builds upon the existing TaskQueue with:
 * - Multi-level priority scheduling with fairness guarantees
 * - Machine learning-based priority adjustment
 * - Advanced resource allocation and load balancing
 * - Intelligent batch optimization
 * - Predictive scheduling based on historical patterns
 */
/**
 * Advanced scheduling algorithms
 */
export declare enum SchedulingAlgorithm {
    ROUND_ROBIN = "round_robin",// Fair scheduling across priority levels
    WEIGHTED_FAIR = "weighted_fair",// Weighted fair queuing with priority consideration
    DEADLINE_AWARE = "deadline_aware",// Deadline-sensitive scheduling
    RESOURCE_AWARE = "resource_aware",// Resource-based scheduling optimization
    MACHINE_LEARNING = "ml_optimized",// ML-based predictive scheduling
    HYBRID = "hybrid"
}
/**
 * Load balancing strategies for distributed execution
 */
export declare enum LoadBalancingStrategy {
    LEAST_LOADED = "least_loaded",// Route to least loaded executor
    ROUND_ROBIN = "round_robin",// Distribute evenly
    CAPABILITY_BASED = "capability_based",// Match task requirements to executor capabilities
    GEOGRAPHIC = "geographic",// Consider geographic distribution
    PERFORMANCE_BASED = "performance_based"
}
/**
 * Resource allocation policies
 */
export declare enum ResourcePolicy {
    GREEDY = "greedy",// Allocate maximum resources available
    FAIR_SHARE = "fair_share",// Ensure fair resource distribution
    PRIORITY_BASED = "priority_based",// Allocate based on task priority
    ADAPTIVE = "adaptive",// Dynamically adjust based on workload
    RESERVED = "reserved"
}
/**
 * Advanced scheduling parameters
 */
export interface AdvancedSchedulingConfig {
    algorithm: SchedulingAlgorithm;
    loadBalancing: LoadBalancingStrategy;
    resourcePolicy: ResourcePolicy;
    maxStarvationTime: number;
    fairnessWeight: number;
    enablePredictiveScheduling: boolean;
    enableBatchOptimization: boolean;
    enableResourcePreallocation: boolean;
    guaranteedLatency: Map<TaskPriority, number>;
    throughputTargets: Map<TaskCategory, number>;
    enableAdaptivePriority: boolean;
    enableSmartRetries: boolean;
    enableFailurePrediction: boolean;
}
/**
 * Task execution statistics for ML-based optimization
 */
export interface TaskExecutionStats {
    taskId: string;
    category: TaskCategory;
    priority: TaskPriority;
    estimatedDuration: number;
    actualDuration: number;
    waitTime: number;
    successRate: number;
    resourceUtilization: Record<string, number>;
    executorPerformance: Record<string, number>;
    timestamp: Date;
}
/**
 * Resource utilization metrics
 */
export interface ResourceMetrics {
    cpuUtilization: number;
    memoryUtilization: number;
    networkBandwidth: number;
    diskIO: number;
    concurrentTasks: number;
    queueDepth: number;
}
/**
 * Executor node information for load balancing
 */
export interface ExecutorNode {
    id: string;
    capabilities: string[];
    maxConcurrentTasks: number;
    currentLoad: number;
    resourceMetrics: ResourceMetrics;
    location?: string;
    performanceScore: number;
    healthStatus: 'healthy' | 'degraded' | 'unhealthy';
    lastHeartbeat: Date;
}
/**
 * Enhanced Task Queue with advanced scheduling and optimization
 */
export declare class EnhancedTaskQueue extends TaskQueue {
    private schedulingConfig;
    private executorNodes;
    private executionStats;
    private priorityQueues;
    private starvationTracker;
    private resourceAllocations;
    private predictionModel?;
    private historicalPatterns;
    private performanceMetrics;
    constructor(options?: Partial<TaskQueueOptions & {
        scheduling: Partial<AdvancedSchedulingConfig>;
    }>);
    /**
     * Enhanced task scheduling with multi-level priority queues
     */
    protected selectOptimalTasks(eligibleTasks: Task[], availableSlots: number): Promise<Task[]>;
    /**
     * Organizes tasks into priority-based queues with starvation prevention
     */
    private organizeTasks;
    /**
     * Round-robin scheduling across priority levels with fairness guarantees
     */
    private roundRobinScheduling;
    /**
     * Weighted fair queuing with priority consideration
     */
    private weightedFairScheduling;
    /**
     * Deadline-aware scheduling with urgency consideration
     */
    private deadlineAwareScheduling;
    /**
     * Resource-aware scheduling optimizing for resource utilization
     */
    private resourceAwareScheduling;
    /**
     * ML-optimized scheduling using predictive models
     */
    private mlOptimizedScheduling;
    /**
     * Hybrid scheduling combining multiple algorithms dynamically
     */
    private hybridScheduling;
    /**
     * Register an executor node for load balancing
     */
    registerExecutor(executor: ExecutorNode): void;
    /**
     * Update executor metrics for load balancing decisions
     */
    updateExecutorMetrics(executorId: string, metrics: ResourceMetrics): void;
    /**
     * Select optimal executor for a task based on load balancing strategy
     */
    selectExecutorForTask(task: Task): ExecutorNode | null;
    /**
     * Record task execution statistics for ML optimization
     */
    recordExecutionStats(task: Task, result: TaskExecutionResult, executorId: string): void;
    /**
     * Get enhanced queue metrics including advanced scheduling statistics
     */
    getEnhancedMetrics(): QueueMetrics & {
        schedulingMetrics: {
            algorithm: SchedulingAlgorithm;
            fairnessIndex: number;
            avgLatencyByPriority: Map<TaskPriority, number>;
            throughputByCategory: Map<TaskCategory, number>;
            resourceEfficiency: number;
            starvationEvents: number;
            executorUtilization: Map<string, number>;
        };
    };
    private boostPriorityForStarvation;
    private compareTasksWithinPriority;
    private canScheduleTask;
    private calculateDeadlineUrgency;
    private calculateResourceEfficiency;
    private estimateTaskResources;
    private calculateAvailableResources;
    private canAllocateResources;
    private extractTaskFeatures;
    private getCategoryIndex;
    private calculateSystemLoad;
    private calculateQueuePressure;
    private calculateResourceUtilization;
    private hasUrgentDeadlines;
    private hasRequiredCapabilities;
    private selectBestCapabilityMatch;
    private calculateCapabilityMatch;
    private assessExecutorHealth;
    private getResourceUtilization;
    private getExecutorPerformance;
    private updatePredictionModel;
    private updatePerformanceMetrics;
    private calculateFairnessIndex;
    private calculateExecutorUtilization;
    private startAdvancedOptimization;
    private preventTaskStarvation;
    private optimizeResourceAllocation;
    private monitorExecutorHealth;
}
