/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { EventEmitter } from 'node:events';
import type { DecisionEngine } from './decisionEngine.js';
import type {
  ResourceInfo,
  AllocationRequest,
  AllocationResult,
} from './resourceAllocator.js';
import {
  ResourceAllocator,
  ResourceType,
  AllocationStrategies,
  type AllocationStrategy,
  type ResourceRequirement,
} from './resourceAllocator.js';
import type {
  DecisionContext,
  Decision,
  DecisionType,
  DecisionPriority,
} from './types';

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
    efficiency: number; // 0-1, how well resources are used
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
    performanceChange: number; // -1 to 1
    utilizationChange: number; // -1 to 1
  };
  confidence: number; // 0-1
}

/**
 * Service that makes intelligent resource allocation decisions
 * by combining the decision engine with resource allocation logic
 */
export class ResourceDecisionService extends EventEmitter {
  private decisionEngine: DecisionEngine;
  private resourceAllocator: ResourceAllocator;
  private taskProfiles: Map<string, TaskResourceProfile> = new Map();
  private allocationHistory: Map<string, ResourceDecision[]> = new Map();
  private optimizationRecommendations: ResourceOptimizationRecommendation[] =
    [];
  private readonly maxHistorySize = 1000;

  constructor(
    decisionEngine: DecisionEngine,
    resources: ResourceInfo[],
    initialStrategy: AllocationStrategy = AllocationStrategies.Balanced,
  ) {
    super();

    this.decisionEngine = decisionEngine;
    this.resourceAllocator = new ResourceAllocator(initialStrategy);
    this.resourceAllocator.initializeResources(resources);

    this.setupEventListeners();
  }

  /**
   * Make a resource allocation decision for a task
   */
  async makeResourceDecision(
    taskProfile: TaskResourceProfile,
    context: DecisionContext,
  ): Promise<ResourceDecision> {
    try {
      // Store task profile for future reference
      this.taskProfiles.set(taskProfile.taskId, taskProfile);

      // Create allocation request from task profile
      const allocationRequest = this.createAllocationRequest(taskProfile);

      // Make the core decision about allocation strategy
      const decision = await this.decisionEngine.makeDecision(
        DecisionType.RESOURCE_ALLOCATION,
        {
          taskProfile,
          allocationRequest,
          currentResourceState: this.resourceAllocator.getResourceStatus(),
          allocationMetrics: this.resourceAllocator.getMetrics(),
        },
        { urgency: taskProfile.constraints.priority },
      );

      // Apply the decision to get actual allocation
      const allocation = await this.applyResourceDecision(
        decision,
        allocationRequest,
        context,
      );

      // Analyze the decision quality
      const reasoning = this.analyzeAllocationDecision(
        decision,
        allocation,
        taskProfile,
      );

      const resourceDecision: ResourceDecision = {
        decision,
        allocation,
        reasoning,
      };

      // Store in history
      this.addToHistory(taskProfile.taskId, resourceDecision);

      // Emit decision event
      this.emit('resource-decision-made', resourceDecision);

      return resourceDecision;
    } catch (error) {
      this.emit('resource-decision-error', { taskProfile, error });
      throw error;
    }
  }

  /**
   * Optimize resource allocation strategy based on historical data
   */
  async optimizeResourceStrategy(
    context: DecisionContext,
  ): Promise<ResourceOptimizationRecommendation[]> {
    const currentMetrics = this.resourceAllocator.getMetrics();
    const resourceStatus = this.resourceAllocator.getResourceStatus();
    const recommendations: ResourceOptimizationRecommendation[] = [];

    // Analyze resource utilization patterns
    for (const [resourceType, utilization] of Object.entries(
      currentMetrics.utilization,
    )) {
      const resource = resourceStatus.get(resourceType as ResourceType);
      if (!resource) continue;

      // Check for underutilization
      if (utilization < 0.3) {
        recommendations.push({
          type: 'scale-down',
          resource: resourceType as ResourceType,
          currentValue: resource.total,
          recommendedValue: Math.ceil(resource.total * 0.7),
          reason: `Low utilization (${(utilization * 100).toFixed(1)}%) suggests overprovisioning`,
          impact: {
            costChange: -0.3,
            performanceChange: -0.1,
            utilizationChange: 0.4,
          },
          confidence: 0.8,
        });
      }

      // Check for overutilization
      if (utilization > 0.85) {
        recommendations.push({
          type: 'scale-up',
          resource: resourceType as ResourceType,
          currentValue: resource.total,
          recommendedValue: Math.ceil(resource.total * 1.3),
          reason: `High utilization (${(utilization * 100).toFixed(1)}%) may cause bottlenecks`,
          impact: {
            costChange: 0.3,
            performanceChange: 0.4,
            utilizationChange: -0.3,
          },
          confidence: 0.9,
        });
      }
    }

    // Analyze queue length and wait times
    if (currentMetrics.queueLength > 5) {
      recommendations.push({
        type: 'strategy-change',
        resource: ResourceType.AGENT,
        currentValue: 1,
        recommendedValue: 2,
        reason:
          'High queue length suggests need for more aggressive preemption or overcommit',
        impact: {
          costChange: 0.1,
          performanceChange: 0.3,
          utilizationChange: 0.2,
        },
        confidence: 0.7,
      });
    }

    // Analyze fairness issues
    if (currentMetrics.fairnessIndex < 0.6) {
      recommendations.push({
        type: 'strategy-change',
        resource: ResourceType.CONCURRENT_TASKS,
        currentValue: 1,
        recommendedValue: 2,
        reason:
          'Low fairness index suggests need for fairer allocation strategy',
        impact: {
          costChange: 0.05,
          performanceChange: 0.1,
          utilizationChange: -0.1,
        },
        confidence: 0.6,
      });
    }

    // Use decision engine to prioritize recommendations
    if (recommendations.length > 0) {
      const prioritizationDecision = await this.decisionEngine.makeDecision(
        DecisionType.OPTIMIZATION,
        {
          recommendations,
          currentMetrics,
          context,
        },
      );

      // Sort recommendations based on decision engine insights
      recommendations.sort((a, b) => {
        const scoreA =
          a.confidence *
          (a.impact.performanceChange + a.impact.utilizationChange);
        const scoreB =
          b.confidence *
          (b.impact.performanceChange + b.impact.utilizationChange);
        return scoreB - scoreA;
      });
    }

    this.optimizationRecommendations = recommendations;
    this.emit('optimization-recommendations', recommendations);

    return recommendations;
  }

  /**
   * Apply optimization recommendations
   */
  async applyOptimizationRecommendations(
    recommendations: ResourceOptimizationRecommendation[],
    context: DecisionContext,
  ): Promise<void> {
    for (const recommendation of recommendations) {
      try {
        await this.applyOptimizationRecommendation(recommendation, context);
      } catch (error) {
        this.emit('optimization-error', { recommendation, error });
      }
    }
  }

  /**
   * Get resource allocation history for a task
   */
  getTaskAllocationHistory(taskId: string): ResourceDecision[] {
    return this.allocationHistory.get(taskId) || [];
  }

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
  } {
    let totalAllocations = 0;
    let successfulAllocations = 0;
    let totalDecisionTime = 0;
    let totalCost = 0;
    const resourceUsage: Record<ResourceType, number> = {} as Record<
      ResourceType,
      number
    >;

    for (const decisions of this.allocationHistory.values()) {
      for (const decision of decisions) {
        totalAllocations++;
        if (decision.allocation.success) {
          successfulAllocations++;
        }

        // Estimate decision time from decision timestamp (if available)
        totalDecisionTime += decision.reasoning.resourceEfficiency * 100; // Rough estimate

        if (decision.allocation.estimatedCost) {
          totalCost += decision.allocation.estimatedCost;
        }

        // Track resource usage
        for (const allocation of decision.allocation.allocations) {
          resourceUsage[allocation.type] =
            (resourceUsage[allocation.type] || 0) + allocation.amount;
        }
      }
    }

    const resourceStatus = this.resourceAllocator.getResourceStatus();
    const resourceEfficiency: Record<ResourceType, number> = {} as Record<
      ResourceType,
      number
    >;

    for (const [type, usage] of Object.entries(resourceUsage)) {
      const resource = resourceStatus.get(type as ResourceType);
      if (resource) {
        resourceEfficiency[type as ResourceType] = usage / resource.total;
      }
    }

    return {
      totalAllocations,
      successRate:
        totalAllocations > 0 ? successfulAllocations / totalAllocations : 0,
      averageDecisionTime:
        totalAllocations > 0 ? totalDecisionTime / totalAllocations : 0,
      resourceEfficiency,
      costMetrics: {
        totalCost,
        averageCostPerTask:
          totalAllocations > 0 ? totalCost / totalAllocations : 0,
        costEfficiency: this.resourceAllocator.getMetrics().costEfficiency,
      },
    };
  }

  /**
   * Update task profile based on actual resource usage
   */
  updateTaskProfile(
    taskId: string,
    actualUsage: {
      resourceUtilization: Record<ResourceType, number>;
      duration: number;
      efficiency: number;
    },
  ): void {
    const profile = this.taskProfiles.get(taskId);
    if (!profile) return;

    // Update historical usage data
    if (!profile.historicalUsage) {
      profile.historicalUsage = {
        averageUtilization: {} as Record<ResourceType, number>,
        peakUtilization: {} as Record<ResourceType, number>,
        efficiency: actualUsage.efficiency,
      };
    }

    // Calculate running averages
    for (const [resource, utilization] of Object.entries(
      actualUsage.resourceUtilization,
    )) {
      const resourceType = resource as ResourceType;
      const currentAvg =
        profile.historicalUsage.averageUtilization[resourceType] || 0;
      profile.historicalUsage.averageUtilization[resourceType] =
        (currentAvg + utilization) / 2;

      const currentPeak =
        profile.historicalUsage.peakUtilization[resourceType] || 0;
      profile.historicalUsage.peakUtilization[resourceType] = Math.max(
        currentPeak,
        utilization,
      );
    }

    profile.historicalUsage.efficiency =
      (profile.historicalUsage.efficiency + actualUsage.efficiency) / 2;

    this.emit('task-profile-updated', { taskId, profile });
  }

  /**
   * Release resources for a completed task
   */
  releaseTaskResources(taskId: string): void {
    const decisions = this.allocationHistory.get(taskId);
    if (!decisions) return;

    const latestDecision = decisions[decisions.length - 1];
    if (latestDecision?.allocation.success) {
      this.resourceAllocator.releaseResources(
        latestDecision.allocation.requestId,
      );
      this.emit('task-resources-released', { taskId });
    }
  }

  /**
   * Get current resource allocator instance
   */
  getResourceAllocator(): ResourceAllocator {
    return this.resourceAllocator;
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.resourceAllocator.destroy();
    this.removeAllListeners();
    this.taskProfiles.clear();
    this.allocationHistory.clear();
  }

  private setupEventListeners(): void {
    // Listen to resource allocator events
    this.resourceAllocator.on('allocation-success', (data) => {
      this.emit('allocation-success', data);
    });

    this.resourceAllocator.on('allocation-error', (data) => {
      this.emit('allocation-error', data);
    });

    this.resourceAllocator.on('optimization-recommendations', (data) => {
      this.emit('resource-optimization-suggestions', data);
    });

    // Listen to decision engine events (if available)
    this.decisionEngine.on('decision-made', (data) => {
      if (data.decision.type === DecisionType.RESOURCE_ALLOCATION) {
        this.emit('resource-decision-processed', data);
      }
    });
  }

  private createAllocationRequest(
    taskProfile: TaskResourceProfile,
  ): AllocationRequest {
    return {
      requestId: `task-${taskProfile.taskId}-${Date.now()}`,
      taskId: taskProfile.taskId,
      requirements: taskProfile.estimatedRequirements,
      deadline: taskProfile.constraints.maxDuration
        ? Date.now() + taskProfile.constraints.maxDuration
        : undefined,
      preemptible: taskProfile.constraints.preemptible,
      estimatedDuration: taskProfile.constraints.maxDuration || 300000, // Default 5 minutes
      businessValue: this.calculateBusinessValue(taskProfile),
    };
  }

  private calculateBusinessValue(taskProfile: TaskResourceProfile): number {
    // Calculate business value based on priority and task type
    const priorityWeight = {
      [DecisionPriority.URGENT]: 1.0,
      [DecisionPriority.CRITICAL]: 0.9,
      [DecisionPriority.HIGH]: 0.7,
      [DecisionPriority.NORMAL]: 0.5,
      [DecisionPriority.LOW]: 0.3,
    };

    let value = priorityWeight[taskProfile.constraints.priority] || 0.5;

    // Adjust based on historical efficiency
    if (taskProfile.historicalUsage?.efficiency) {
      value *= 0.5 + taskProfile.historicalUsage.efficiency * 0.5;
    }

    return Math.min(1.0, Math.max(0.1, value));
  }

  private async applyResourceDecision(
    decision: Decision,
    allocationRequest: AllocationRequest,
    context: DecisionContext,
  ): Promise<AllocationResult> {
    // Apply any strategy changes suggested by the decision
    if (decision.choice.includes('aggressive')) {
      this.resourceAllocator.updateStrategy(AllocationStrategies.Efficiency);
    } else if (decision.choice.includes('fair')) {
      this.resourceAllocator.updateStrategy(AllocationStrategies.Fairness);
    } else if (decision.choice.includes('deadline')) {
      this.resourceAllocator.updateStrategy(
        AllocationStrategies.DeadlineOptimized,
      );
    } else if (decision.choice.includes('cost')) {
      this.resourceAllocator.updateStrategy(AllocationStrategies.CostOptimized);
    }

    // Perform the actual resource allocation
    return await this.resourceAllocator.allocateResources(
      allocationRequest,
      context,
    );
  }

  private analyzeAllocationDecision(
    decision: Decision,
    allocation: AllocationResult,
    taskProfile: TaskResourceProfile,
  ): ResourceDecision['reasoning'] {
    let resourceEfficiency = 0;
    let costBenefit = 0;

    if (allocation.success && allocation.allocations.length > 0) {
      // Calculate resource efficiency
      const totalRequested = taskProfile.estimatedRequirements.reduce(
        (sum, req) => sum + req.amount,
        0,
      );
      const totalAllocated = allocation.allocations.reduce(
        (sum, alloc) => sum + alloc.amount,
        0,
      );
      resourceEfficiency =
        totalRequested > 0 ? totalAllocated / totalRequested : 0;

      // Calculate cost benefit
      if (allocation.estimatedCost && taskProfile.constraints.maxCost) {
        costBenefit = Math.max(
          0,
          1 - allocation.estimatedCost / taskProfile.constraints.maxCost,
        );
      } else {
        costBenefit = allocation.estimatedCost
          ? Math.max(0, 1 - allocation.estimatedCost / 100)
          : 0.8;
      }
    }

    return {
      strategyUsed: decision.choice,
      resourceEfficiency,
      costBenefit,
      alternativesConsidered: decision.alternatives.length,
    };
  }

  private async applyOptimizationRecommendation(
    recommendation: ResourceOptimizationRecommendation,
    context: DecisionContext,
  ): Promise<void> {
    switch (recommendation.type) {
      case 'strategy-change':
        if (recommendation.reason.includes('preemption')) {
          this.resourceAllocator.updateStrategy(
            AllocationStrategies.Efficiency,
          );
        } else if (recommendation.reason.includes('fairness')) {
          this.resourceAllocator.updateStrategy(AllocationStrategies.Fairness);
        }
        break;

      case 'scale-up':
      case 'scale-down':
        // In a real implementation, this would trigger infrastructure scaling
        this.emit('infrastructure-scaling-needed', {
          recommendation,
          action: recommendation.type,
        });
        break;

      case 'rebalance':
        // Trigger resource rebalancing
        await this.resourceAllocator.optimizeAllocations();
        break;
    }

    this.emit('optimization-applied', { recommendation });
  }

  private addToHistory(taskId: string, decision: ResourceDecision): void {
    if (!this.allocationHistory.has(taskId)) {
      this.allocationHistory.set(taskId, []);
    }

    const history = this.allocationHistory.get(taskId)!;
    history.push(decision);

    // Trim history if it gets too large
    if (history.length > this.maxHistorySize) {
      history.splice(0, history.length - this.maxHistorySize);
    }
  }
}
