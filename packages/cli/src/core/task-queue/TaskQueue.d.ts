/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { EventEmitter } from 'node:events';
import type { TaskType, TaskMetadata , TaskPriority } from '../../monitoring/TaskStatusMonitor.js';
/**
 * Task scheduling options for intelligent queue management
 */
export interface TaskSchedulingOptions {
    priority?: TaskPriority;
    dependencies?: string[];
    estimatedDuration?: number;
    maxRetries?: number;
    retryDelay?: number;
    timeoutMs?: number;
    tags?: string[];
    constraints?: {
        requiresAgent?: string;
        requiresCapabilities?: string[];
        resourceRequirements?: {
            memory?: number;
            cpu?: number;
            disk?: number;
        };
    };
    scheduling?: {
        earliestStartTime?: Date;
        deadline?: Date;
        parallelism?: 'sequential' | 'parallel' | 'exclusive';
    };
}
/**
 * Task definition for queue submission
 */
export interface TaskDefinition {
    title: string;
    description: string;
    type: TaskType;
    executor: string;
    params?: Record<string, unknown>;
    options?: TaskSchedulingOptions;
}
/**
 * Agent capability definition for task assignment
 */
export interface AgentCapability {
    agentId: string;
    capabilities: string[];
    performance: {
        averageCompletionTime: number;
        successRate: number;
        currentLoad: number;
        maxConcurrentTasks: number;
    };
    resourceCapacity: {
        memory: number;
        cpu: number;
        disk: number;
    };
    status: 'available' | 'busy' | 'offline' | 'maintenance';
}
/**
 * Task assignment result
 */
export interface TaskAssignment {
    taskId: string;
    agentId: string;
    assignedAt: Date;
    estimatedCompletion: Date;
    priority: TaskPriority;
}
/**
 * Self-Managing Task Queue with Intelligent Priority Scheduling
 *
 * Features:
 * - Priority-based scheduling with dynamic rebalancing
 * - Intelligent agent assignment based on capabilities and performance
 * - Dependency management and resolution
 * - Cross-session persistence and recovery
 * - Real-time monitoring and optimization
 * - Automatic retry and error handling
 * - Resource-aware scheduling
 * - Performance analytics and optimization
 */
export declare class TaskQueue extends EventEmitter {
    private readonly logger;
    private readonly queuesByPriority;
    private readonly taskRegistry;
    private readonly agentRegistry;
    private readonly taskAssignments;
    private readonly dependencyGraph;
    private readonly activeTasks;
    private readonly completedTasks;
    private readonly failedTasks;
    private processingInterval?;
    private rebalancingInterval?;
    private persistenceInterval?;
    private readonly priorityWeights;
    private performanceMetrics;
    constructor();
    /**
     * Submit a task to the queue with intelligent scheduling
     */
    submitTask(definition: TaskDefinition): Promise<string>;
    /**
     * Register an agent with the queue system
     */
    registerAgent(agentCapability: AgentCapability): Promise<void>;
    /**
     * Update agent status and capabilities
     */
    updateAgentStatus(agentId: string, updates: Partial<AgentCapability>): Promise<void>;
    /**
     * Get current queue status and metrics
     */
    getQueueStatus(): {
        queueSizes: Record<TaskPriority, number>;
        totalQueued: number;
        totalActive: number;
        totalCompleted: number;
        totalFailed: number;
        availableAgents: number;
        busyAgents: number;
        performance: {
            totalTasksProcessed: number;
            averageQueueTime: number;
            averageExecutionTime: number;
            throughputPerMinute: number;
            systemEfficiency: number;
            rebalanceCount: number;
            optimizationCount: number;
            lastOptimization: Date;
        };
        nextScheduledTask?: {
            taskId: string;
            title: string;
            priority: TaskPriority;
            estimatedStartTime: Date;
        };
    };
    /**
     * Get detailed task information
     */
    getTaskInfo(taskId: string): {
        task?: TaskMetadata;
        assignment?: TaskAssignment;
        queuePosition?: number;
        dependencies?: string[];
        dependents?: string[];
    };
    /**
     * Cancel a queued or active task
     */
    cancelTask(taskId: string, reason?: string): Promise<boolean>;
    /**
     * Trigger manual queue rebalancing and optimization
     */
    rebalanceQueue(): Promise<void>;
    private setupProcessingPipeline;
    private setupRealtimeIntegration;
    private processQueue;
    private assignTasksFromQueue;
    private calculateSchedulingPriority;
    private insertInPriorityOrder;
    private areDependenciesSatisfied;
    private getAvailableAgents;
    private findBestAgentForTask;
    private calculateAgentScore;
    private assignTaskToAgent;
    private updateDependencyGraph;
    private getDependentTasks;
    private calculateResourceEfficiencyScore;
    private calculateResourceAvailability;
    private getTotalQueueSize;
    private getQueueSizes;
    private handleTaskStatusChange;
    private updateTaskCompletion;
    private handleTaskFailure;
    private persistQueueState;
    /**
     * Clean up resources and stop processing
     */
    destroy(): void;
}
/**
 * Singleton instance for global access
 */
export declare const taskQueue: TaskQueue;
