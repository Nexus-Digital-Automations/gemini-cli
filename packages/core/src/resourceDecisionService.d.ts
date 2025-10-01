/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { EventEmitter } from 'node:events';
import type { DecisionEngine } from './decisionEngine.js';
import { DecisionPriority } from './types.js';
import type { DecisionContext, Decision } from './types.js';
export declare enum ResourceType {
    CPU = "cpu",
    MEMORY = "memory",
    STORAGE = "storage",
    NETWORK = "network",
    GPU = "gpu",
    AGENT = "agent",
    CONCURRENT_TASKS = "concurrent_tasks"
}
export interface ResourceRequirement {
    type: ResourceType;
    amount: number;
    unit: string;
}
export interface ResourceInfo {
    id: string;
    type: ResourceType;
    available: number;
    total: number;
    unit: string;
}
export interface AllocationResult {
    success: boolean;
    allocatedResources: ResourceRequirement[];
    cost: number;
    estimatedDuration: number;
    estimatedCost?: number;
    allocations: Array<{
        type: ResourceType;
        amount: number;
    }>;
    requestId: string;
    error?: string;
}
export type AllocationStrategy = 'balanced' | 'cost-optimized' | 'performance-optimized' | 'power-efficient';
export declare const AllocationStrategies: {
    Balanced: AllocationStrategy;
    CostOptimized: AllocationStrategy;
    PerformanceOptimized: AllocationStrategy;
    PowerEfficient: AllocationStrategy;
    Efficiency: AllocationStrategy;
    Fairness: AllocationStrategy;
    DeadlineOptimized: AllocationStrategy;
};
export interface AllocationRequest {
    requestId: string;
    taskId: string;
    requirements: ResourceRequirement[];
    deadline?: number;
    preemptible: boolean;
    estimatedDuration: number;
    businessValue: number;
}
export interface AllocationMetrics {
    utilization: Record<string, number>;
    queueLength: number;
    fairnessIndex: number;
    costEfficiency: number;
}
export declare class ResourceAllocator {
    private strategy;
    private resources;
    constructor(strategy: AllocationStrategy);
    initializeResources(resources: ResourceInfo[]): void;
    allocate(requirements: ResourceRequirement[]): AllocationResult;
    allocateResources(request: AllocationRequest, context: DecisionContext): Promise<AllocationResult>;
    releaseResources(requestId: string): void;
    getResourceStatus(): Map<ResourceType, ResourceInfo>;
    getMetrics(): AllocationMetrics;
    updateStrategy(strategy: AllocationStrategy): void;
    optimizeAllocations(): Promise<void>;
    destroy(): void;
    on(event: string, callback: (data: any) => void): void;
    deallocate(allocation: AllocationResult): void;
}
/**
 * Task resource profile for decision making
 */
export interface TaskResourceProfile {
    taskId: string;
    taskType: string;
    estimatedRequirements: ResourceRequirement[];
    historicalUsage?: {
        averageUtilization: Record<ResourceType, number>;
        peakUtilization: Record<ResourceType, number>;
        efficiency: number;
    };
    constraints: {
        maxCost?: number;
        maxDuration?: number;
        priority: DecisionPriority;
        preemptible: boolean;
    };
}
/**
 * Resource allocation decision result
 */
export interface ResourceDecision {
    decision: Decision;
    allocation: AllocationResult;
    reasoning: {
        strategyUsed: string;
        resourceEfficiency: number;
        costBenefit: number;
        alternativesConsidered: number;
    };
}
/**
 * Resource optimization recommendation
 */
export interface ResourceOptimizationRecommendation {
    type: 'scale-up' | 'scale-down' | 'rebalance' | 'strategy-change';
    resource: ResourceType;
    currentValue: number;
    recommendedValue: number;
    reason: string;
    impact: {
        costChange: number;
        performanceChange: number;
        utilizationChange: number;
    };
    confidence: number;
}
/**
 * Service that makes intelligent resource allocation decisions
 * by combining the decision engine with resource allocation logic
 */
export declare class ResourceDecisionService extends EventEmitter {
    private decisionEngine;
    private resourceAllocator;
    private taskProfiles;
    private allocationHistory;
    private optimizationRecommendations;
    private readonly maxHistorySize;
    constructor(decisionEngine: DecisionEngine, resources: ResourceInfo[], initialStrategy?: AllocationStrategy);
    /**
     * Make a resource allocation decision for a task
     */
    makeResourceDecision(taskProfile: TaskResourceProfile, context: DecisionContext): Promise<ResourceDecision>;
    /**
     * Optimize resource allocation strategy based on historical data
     */
    optimizeResourceStrategy(context: DecisionContext): Promise<ResourceOptimizationRecommendation[]>;
    /**
     * Apply optimization recommendations
     */
    applyOptimizationRecommendations(recommendations: ResourceOptimizationRecommendation[], context: DecisionContext): Promise<void>;
    /**
     * Get resource allocation history for a task
     */
    getTaskAllocationHistory(taskId: string): ResourceDecision[];
    /**
     * Get overall resource allocation statistics
     */
    getResourceStatistics(): {
        totalAllocations: number;
        successRate: number;
        averageDecisionTime: number;
        resourceEfficiency: Record<ResourceType, number>;
        costMetrics: {
            totalCost: number;
            averageCostPerTask: number;
            costEfficiency: number;
        };
    };
    /**
     * Update task profile based on actual resource usage
     */
    updateTaskProfile(taskId: string, actualUsage: {
        resourceUtilization: Record<ResourceType, number>;
        duration: number;
        efficiency: number;
    }): void;
    /**
     * Release resources for a completed task
     */
    releaseTaskResources(taskId: string): void;
    /**
     * Get current resource allocator instance
     */
    getResourceAllocator(): ResourceAllocator;
    /**
     * Cleanup resources
     */
    destroy(): void;
    private setupEventListeners;
    private createAllocationRequest;
    private calculateBusinessValue;
    private applyResourceDecision;
    private analyzeAllocationDecision;
    private applyOptimizationRecommendation;
    private addToHistory;
}
