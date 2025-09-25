/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { EventEmitter } from 'node:events';
import type { DecisionEngine } from './decisionEngine.js';
import type { ResourceInfo, AllocationResult } from './resourceAllocator.js';
import { ResourceAllocator, ResourceType, type AllocationStrategy, type ResourceRequirement } from './resourceAllocator.js';
import type { DecisionContext, Decision, DecisionPriority } from './types';
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
    default: break;
}
