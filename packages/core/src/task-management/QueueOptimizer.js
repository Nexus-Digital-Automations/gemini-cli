/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { EventEmitter } from 'node:events';
import { logger } from '../utils/logger.js';
/**
 * Optimization strategy types
 */
export let OptimizationStrategy;
(function (OptimizationStrategy) {
    OptimizationStrategy["THROUGHPUT_MAXIMIZATION"] = "throughput_maximization";
    OptimizationStrategy["LATENCY_MINIMIZATION"] = "latency_minimization";
    OptimizationStrategy["RESOURCE_EFFICIENCY"] = "resource_efficiency";
    OptimizationStrategy["DEADLINE_OPTIMIZATION"] = "deadline_optimization";
    OptimizationStrategy["BALANCED"] = "balanced";
})(OptimizationStrategy || (OptimizationStrategy = {}));
/**
 * Advanced queue optimization engine with machine learning insights
 */
export class QueueOptimizer extends EventEmitter {
    resourceUtilization = new Map();
    optimizationHistory = [];
    performanceMetrics = {
        averageThroughput: 0,
        averageLatency: 0,
        resourceEfficiency: 0,
        deadlineMissRate: 0,
        optimizationSuccessRate: 0,
    };
    constructor() {
        super();
    }
    /**
     * Analyze queue and generate optimization recommendations
     */
    optimizeQueue(tasks, dependencyAnalysis, metrics, strategy = OptimizationStrategy.BALANCED) {
        logger.info('Starting queue optimization', {
            taskCount: tasks.size,
            strategy,
            readyTasks: dependencyAnalysis.readyTasks.length,
        });
        const recommendations = [];
        // Update resource utilization tracking
        this.updateResourceUtilization(tasks);
        // Generate strategy-specific recommendations
        switch (strategy) {
            case OptimizationStrategy.THROUGHPUT_MAXIMIZATION:
                recommendations.push(...this.optimizeForThroughput(tasks, dependencyAnalysis));
                break;
            case OptimizationStrategy.LATENCY_MINIMIZATION:
                recommendations.push(...this.optimizeForLatency(tasks, dependencyAnalysis));
                break;
            case OptimizationStrategy.RESOURCE_EFFICIENCY:
                recommendations.push(...this.optimizeForResourceEfficiency(tasks));
                break;
            case OptimizationStrategy.DEADLINE_OPTIMIZATION:
                recommendations.push(...this.optimizeForDeadlines(tasks, dependencyAnalysis));
                break;
            case OptimizationStrategy.BALANCED:
                recommendations.push(...this.generateBalancedRecommendations(tasks, dependencyAnalysis, metrics));
                break;
            default:
                // Handle unexpected values
                break;
        }
        // Add general optimization recommendations
        recommendations.push(...this.generateGeneralOptimizations(tasks, dependencyAnalysis));
        // Sort by priority and expected improvement
        recommendations.sort((a, b) => {
            const priorityOrder = { high: 3, medium: 2, low: 1 };
            const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
            if (priorityDiff !== 0)
                return priorityDiff;
            return b.expectedImprovement - a.expectedImprovement;
        });
        // Store in optimization history
        this.optimizationHistory.push({
            timestamp: new Date(),
            strategy,
            recommendations,
            appliedRecommendations: 0,
            actualImprovement: 0,
        });
        logger.info('Queue optimization completed', {
            recommendationCount: recommendations.length,
            strategy,
            highPriorityCount: recommendations.filter((r) => r.priority === 'high')
                .length,
        });
        this.emit('optimizationCompleted', { strategy, recommendations });
        return recommendations;
    }
    /**
     * Optimize task batching for parallel execution
     */
    optimizeBatching(tasks, dependencyAnalysis) {
        const readyTasks = dependencyAnalysis.readyTasks
            .map((id) => tasks.get(id))
            .filter(Boolean);
        // Group tasks by compatibility for batching
        const batchGroups = this.identifyBatchGroups(readyTasks);
        // Optimize batch ordering
        const optimizedBatches = this.optimizeBatchOrder(batchGroups, dependencyAnalysis);
        const originalOrder = readyTasks.map((t) => t.id);
        const optimizedOrder = optimizedBatches.flatMap((batch) => batch.taskIds);
        const expectedSpeedup = this.calculateBatchSpeedup(optimizedBatches);
        const resourceEfficiencyGain = this.calculateResourceEfficiencyGain(optimizedBatches);
        const result = {
            originalOrder,
            optimizedOrder,
            batches: optimizedBatches,
            expectedSpeedup,
            resourceEfficiencyGain,
        };
        logger.info('Batch optimization completed', {
            originalTaskCount: originalOrder.length,
            batchCount: optimizedBatches.length,
            expectedSpeedup: `${(expectedSpeedup * 100).toFixed(1)}%`,
            resourceEfficiencyGain: `${(resourceEfficiencyGain * 100).toFixed(1)}%`,
        });
        this.emit('batchOptimized', result);
        return result;
    }
    /**
     * Generate load balancing recommendations
     */
    generateLoadBalancingRecommendations(tasks) {
        const recommendations = [];
        // Analyze current resource utilization
        const overloadedResources = [];
        const underutilizedResources = [];
        for (const [resourceId, utilization] of this.resourceUtilization) {
            if (utilization.currentLoad > 0.8) {
                overloadedResources.push(resourceId);
            }
            else if (utilization.currentLoad < 0.3) {
                underutilizedResources.push(resourceId);
            }
        }
        // Generate rebalancing recommendations
        for (const overloadedResource of overloadedResources) {
            const utilization = this.resourceUtilization.get(overloadedResource);
            const candidateTargets = underutilizedResources
                .map((resourceId) => ({
                resourceId,
                utilization: this.resourceUtilization.get(resourceId),
                availableCapacity: this.resourceUtilization.get(resourceId).capacity -
                    this.resourceUtilization.get(resourceId).currentLoad,
            }))
                .sort((a, b) => b.availableCapacity - a.availableCapacity);
            if (candidateTargets.length > 0) {
                const targetResource = candidateTargets[0];
                // Find tasks to move
                const tasksToMove = utilization.allocatedTasks
                    .map((taskId) => tasks.get(taskId))
                    .filter(Boolean)
                    .filter((task) => this.canMoveTask(task, overloadedResource, targetResource.resourceId))
                    .slice(0, 3) // Limit moves to avoid thrashing
                    .map((task) => ({
                    taskId: task.id,
                    fromResource: overloadedResource,
                    toResource: targetResource.resourceId,
                    impact: this.calculateMoveImpact(task, overloadedResource, targetResource.resourceId),
                }));
                if (tasksToMove.length > 0) {
                    const expectedImprovement = tasksToMove.reduce((sum, move) => sum + move.impact, 0) /
                        tasksToMove.length;
                    recommendations.push({
                        resourceId: overloadedResource,
                        currentLoad: utilization.currentLoad,
                        targetLoad: Math.max(0.3, utilization.currentLoad - tasksToMove.length * 0.1),
                        tasksToMove,
                        expectedImprovement,
                    });
                }
            }
        }
        logger.info('Load balancing analysis completed', {
            overloadedResources: overloadedResources.length,
            underutilizedResources: underutilizedResources.length,
            recommendations: recommendations.length,
        });
        return recommendations;
    }
    /**
     * Analyze queue bottlenecks
     */
    analyzeBottlenecks(tasks, dependencyAnalysis) {
        const bottlenecks = [];
        // Dependency bottlenecks
        const blockedTasks = dependencyAnalysis.blockedTasks;
        if (blockedTasks.length > 0) {
            const blockingTasks = this.findBlockingTasks(tasks, dependencyAnalysis);
            const impact = blockedTasks.length / tasks.size;
            bottlenecks.push({
                type: 'dependency',
                description: `${blockedTasks.length} tasks blocked by dependencies`,
                impact,
                affectedTasks: blockedTasks,
                recommendation: `Prioritize completion of blocking tasks: ${blockingTasks.slice(0, 3).join(', ')}`,
            });
        }
        // Resource bottlenecks
        const resourceBottlenecks = this.identifyResourceBottlenecks(tasks);
        bottlenecks.push(...resourceBottlenecks);
        // Priority inversion bottlenecks
        const priorityBottlenecks = this.identifyPriorityInversions(tasks, dependencyAnalysis);
        bottlenecks.push(...priorityBottlenecks);
        // Batching opportunity bottlenecks
        const batchBottlenecks = this.identifyBatchingOpportunities(tasks);
        bottlenecks.push(...batchBottlenecks);
        // Sort by impact
        bottlenecks.sort((a, b) => b.impact - a.impact);
        logger.info('Bottleneck analysis completed', {
            totalBottlenecks: bottlenecks.length,
            highImpactBottlenecks: bottlenecks.filter((b) => b.impact > 0.3).length,
        });
        return bottlenecks;
    }
    /**
     * Predict queue performance based on current state
     */
    predictPerformance(tasks, dependencyAnalysis, projectionHours = 24) {
        const readyTasks = dependencyAnalysis.readyTasks.length;
        const totalTasks = tasks.size;
        const averageTaskDuration = this.calculateAverageTaskDuration(tasks);
        // Simple throughput prediction based on historical data and current resources
        const currentThroughput = this.performanceMetrics.averageThroughput;
        const resourceEfficiency = this.performanceMetrics.resourceEfficiency;
        const expectedThroughput = Math.max(1, currentThroughput * resourceEfficiency);
        // Estimate completion time considering dependencies
        const criticalPathDuration = dependencyAnalysis.estimatedDuration;
        const parallelEfficiency = Math.min(0.8, readyTasks / Math.max(1, dependencyAnalysis.totalLevels));
        const expectedCompletionTime = criticalPathDuration * (1 - parallelEfficiency * 0.5);
        // Resource utilization forecast
        const resourceForecast = new Map();
        for (const [resourceId, utilization] of this.resourceUtilization) {
            const projectedLoad = Math.min(1.0, utilization.currentLoad * (totalTasks / Math.max(1, readyTasks)));
            resourceForecast.set(resourceId, projectedLoad);
        }
        // Predict bottlenecks
        const bottleneckPredictions = [];
        if (dependencyAnalysis.blockedTasks.length > totalTasks * 0.3) {
            bottleneckPredictions.push('High dependency blocking expected');
        }
        if (Array.from(resourceForecast.values()).some((load) => load > 0.9)) {
            bottleneckPredictions.push('Resource saturation predicted');
        }
        // Confidence score based on historical accuracy and data quality
        const historicalAccuracy = this.calculateHistoricalAccuracy();
        const dataQuality = Math.min(1.0, this.optimizationHistory.length / 10);
        const confidenceScore = (historicalAccuracy + dataQuality) / 2;
        const prediction = {
            expectedThroughput,
            expectedCompletionTime,
            resourceUtilizationForecast: resourceForecast,
            bottleneckPredictions,
            confidenceScore,
        };
        logger.info('Performance prediction completed', {
            expectedThroughput: expectedThroughput.toFixed(2),
            expectedCompletionTime: `${(expectedCompletionTime / (1000 * 60 * 60)).toFixed(1)} hours`,
            confidenceScore: `${(confidenceScore * 100).toFixed(1)}%`,
        });
        this.emit('performancePredicted', prediction);
        return prediction;
    }
    /**
     * Apply optimization recommendations
     */
    applyOptimizations(tasks, recommendations) {
        const results = [];
        let applied = 0;
        let failed = 0;
        for (const recommendation of recommendations) {
            try {
                const success = this.applyRecommendation(tasks, recommendation);
                results.push({ recommendation, success });
                if (success) {
                    applied++;
                }
                else {
                    failed++;
                }
            }
            catch (error) {
                results.push({
                    recommendation,
                    success: false,
                    error: error instanceof Error ? error.message : String(error),
                });
                failed++;
                logger.warn('Failed to apply optimization recommendation', {
                    type: recommendation.type,
                    error: error instanceof Error ? error.message : String(error),
                });
            }
        }
        // Update optimization history
        const lastOptimization = this.optimizationHistory[this.optimizationHistory.length - 1];
        if (lastOptimization) {
            lastOptimization.appliedRecommendations = applied;
        }
        logger.info('Optimization application completed', {
            applied,
            failed,
            successRate: `${((applied / (applied + failed)) * 100).toFixed(1)}%`,
        });
        this.emit('optimizationsApplied', { applied, failed, results });
        return { applied, failed, results };
    }
    /**
     * Optimize for maximum throughput
     */
    optimizeForThroughput(tasks, dependencyAnalysis) {
        const recommendations = [];
        // Identify parallelizable task groups
        const parallelGroups = dependencyAnalysis.parallelizableGroups;
        if (parallelGroups.length > 1) {
            recommendations.push({
                type: 'parallel',
                priority: 'high',
                taskIds: parallelGroups.flat(),
                description: `Execute ${parallelGroups.length} groups of tasks in parallel`,
                expectedImprovement: Math.min(50, parallelGroups.length * 10),
                riskLevel: 'low',
            });
        }
        // Identify batching opportunities for similar tasks
        const batchableCategories = this.findBatchableCategories(tasks);
        for (const [category, taskIds] of batchableCategories) {
            if (taskIds.length >= 3) {
                recommendations.push({
                    type: 'batch',
                    priority: 'medium',
                    taskIds,
                    description: `Batch ${taskIds.length} ${category} tasks for efficient processing`,
                    expectedImprovement: Math.min(30, taskIds.length * 5),
                    riskLevel: 'low',
                });
            }
        }
        return recommendations;
    }
    /**
     * Optimize for minimum latency
     */
    optimizeForLatency(tasks, dependencyAnalysis) {
        const recommendations = [];
        // Prioritize critical path tasks
        const criticalPathTasks = dependencyAnalysis.criticalPath;
        if (criticalPathTasks.length > 0) {
            recommendations.push({
                type: 'priority_adjust',
                priority: 'high',
                taskIds: criticalPathTasks,
                description: `Boost priority of ${criticalPathTasks.length} critical path tasks`,
                expectedImprovement: 25,
                riskLevel: 'low',
                metadata: { priorityBoost: TaskPriority.HIGH },
            });
        }
        // Identify tasks with approaching deadlines
        const urgentTasks = Array.from(tasks.values())
            .filter((task) => {
            if (!task.deadline)
                return false;
            const timeToDeadline = task.deadline.getTime() - Date.now();
            return timeToDeadline < 24 * 60 * 60 * 1000; // Less than 24 hours
        })
            .map((task) => task.id);
        if (urgentTasks.length > 0) {
            recommendations.push({
                type: 'priority_adjust',
                priority: 'high',
                taskIds: urgentTasks,
                description: `Prioritize ${urgentTasks.length} tasks with approaching deadlines`,
                expectedImprovement: 40,
                riskLevel: 'low',
                metadata: { priorityBoost: TaskPriority.HIGH },
            });
        }
        return recommendations;
    }
    /**
     * Optimize for resource efficiency
     */
    optimizeForResourceEfficiency(tasks) {
        const recommendations = [];
        // Identify resource conflicts and suggest rebalancing
        const loadBalanceRecommendations = this.generateLoadBalancingRecommendations(tasks);
        for (const loadRec of loadBalanceRecommendations) {
            recommendations.push({
                type: 'resource_rebalance',
                priority: 'medium',
                taskIds: loadRec.tasksToMove.map((move) => move.taskId),
                description: `Rebalance ${loadRec.tasksToMove.length} tasks from overloaded resource ${loadRec.resourceId}`,
                expectedImprovement: loadRec.expectedImprovement,
                riskLevel: 'medium',
                metadata: { loadBalancing: loadRec },
            });
        }
        // Identify tasks that can share resources efficiently
        const resourceSharingOpportunities = this.findResourceSharingOpportunities(tasks);
        for (const opportunity of resourceSharingOpportunities) {
            recommendations.push({
                type: 'batch',
                priority: 'low',
                taskIds: opportunity.taskIds,
                description: `Group ${opportunity.taskIds.length} tasks to share ${opportunity.resource}`,
                expectedImprovement: opportunity.efficiencyGain,
                riskLevel: 'low',
                metadata: { resourceSharing: opportunity },
            });
        }
        return recommendations;
    }
    /**
     * Optimize for deadline compliance
     */
    optimizeForDeadlines(tasks, dependencyAnalysis) {
        const recommendations = [];
        const tasksWithDeadlines = Array.from(tasks.values()).filter((task) => task.deadline);
        // Sort by deadline urgency
        tasksWithDeadlines.sort((a, b) => {
            const aUrgency = a.deadline.getTime() - Date.now();
            const bUrgency = b.deadline.getTime() - Date.now();
            return aUrgency - bUrgency;
        });
        // Identify at-risk tasks
        const atRiskTasks = tasksWithDeadlines.filter((task) => {
            const timeToDeadline = task.deadline.getTime() - Date.now();
            const estimatedCompletion = this.estimateTaskCompletionTime(task, dependencyAnalysis);
            return estimatedCompletion > timeToDeadline;
        });
        if (atRiskTasks.length > 0) {
            recommendations.push({
                type: 'priority_adjust',
                priority: 'high',
                taskIds: atRiskTasks.map((t) => t.id),
                description: `Emergency priority boost for ${atRiskTasks.length} deadline-at-risk tasks`,
                expectedImprovement: 60,
                riskLevel: 'high',
                metadata: { emergencyPriority: true },
            });
        }
        return recommendations;
    }
    /**
     * Generate balanced recommendations considering all factors
     */
    generateBalancedRecommendations(tasks, dependencyAnalysis, metrics) {
        const recommendations = [];
        // Balance between different optimization strategies
        const throughputRecs = this.optimizeForThroughput(tasks, dependencyAnalysis);
        const latencyRecs = this.optimizeForLatency(tasks, dependencyAnalysis);
        const resourceRecs = this.optimizeForResourceEfficiency(tasks);
        const deadlineRecs = this.optimizeForDeadlines(tasks, dependencyAnalysis);
        // Weight recommendations based on current performance metrics
        const throughputWeight = 1.0 - Math.min(1.0, metrics.throughputPerHour / 100);
        const latencyWeight = Math.min(1.0, metrics.averageWaitTime / (60 * 60 * 1000)); // Hour scale
        const resourceWeight = 1.0 - this.performanceMetrics.resourceEfficiency;
        const deadlineWeight = this.performanceMetrics.deadlineMissRate;
        // Apply weights and select top recommendations
        const weightedRecs = [
            ...throughputRecs.map((r) => ({
                ...r,
                weightedScore: r.expectedImprovement * throughputWeight,
            })),
            ...latencyRecs.map((r) => ({
                ...r,
                weightedScore: r.expectedImprovement * latencyWeight,
            })),
            ...resourceRecs.map((r) => ({
                ...r,
                weightedScore: r.expectedImprovement * resourceWeight,
            })),
            ...deadlineRecs.map((r) => ({
                ...r,
                weightedScore: r.expectedImprovement * deadlineWeight,
            })),
        ];
        // Remove duplicates and sort by weighted score
        const uniqueRecs = this.deduplicateRecommendations(weightedRecs);
        uniqueRecs.sort((a, b) => b.weightedScore - a.weightedScore);
        // Take top 10 recommendations
        recommendations.push(...uniqueRecs.slice(0, 10));
        return recommendations;
    }
    /**
     * Generate general optimization recommendations
     */
    generateGeneralOptimizations(tasks, dependencyAnalysis) {
        const recommendations = [];
        // Identify long-running tasks that could be broken down
        const longRunningTasks = Array.from(tasks.values()).filter((task) => task.estimatedDuration > 30 * 60 * 1000);
        if (longRunningTasks.length > 0) {
            recommendations.push({
                type: 'reorder',
                priority: 'low',
                taskIds: longRunningTasks.map((t) => t.id),
                description: `Consider breaking down ${longRunningTasks.length} long-running tasks`,
                expectedImprovement: 15,
                riskLevel: 'medium',
                metadata: { taskBreakdown: true },
            });
        }
        // Identify tasks with high retry rates
        const problematicTasks = Array.from(tasks.values()).filter((task) => task.currentRetries > 1);
        if (problematicTasks.length > 0) {
            recommendations.push({
                type: 'defer',
                priority: 'low',
                taskIds: problematicTasks.map((t) => t.id),
                description: `Review ${problematicTasks.length} tasks with multiple retries`,
                expectedImprovement: 10,
                riskLevel: 'low',
                metadata: { reviewRequired: true },
            });
        }
        return recommendations;
    }
    /**
     * Update resource utilization tracking
     */
    updateResourceUtilization(tasks) {
        // Reset allocations
        for (const utilization of this.resourceUtilization.values()) {
            utilization.allocatedTasks = [];
            utilization.currentLoad = 0;
        }
        // Track current allocations
        for (const task of tasks.values()) {
            if (task.status === TaskStatus.RUNNING) {
                for (const resourceId of task.requiredResources) {
                    let utilization = this.resourceUtilization.get(resourceId);
                    if (!utilization) {
                        utilization = {
                            resourceId,
                            currentLoad: 0,
                            averageLoad: 0,
                            peakLoad: 0,
                            allocatedTasks: [],
                            capacity: 1.0,
                            efficiency: 1.0,
                        };
                        this.resourceUtilization.set(resourceId, utilization);
                    }
                    utilization.allocatedTasks.push(task.id);
                    utilization.currentLoad = Math.min(1.0, utilization.currentLoad + 0.1); // Simple load model
                }
            }
        }
        // Update historical metrics
        for (const utilization of this.resourceUtilization.values()) {
            utilization.peakLoad = Math.max(utilization.peakLoad, utilization.currentLoad);
            utilization.averageLoad =
                utilization.averageLoad * 0.9 + utilization.currentLoad * 0.1;
        }
    }
    /**
     * Find batchable task categories
     */
    findBatchableCategories(tasks) {
        const categories = new Map();
        for (const task of tasks.values()) {
            if (task.batchCompatible && task.status === TaskStatus.PENDING) {
                const taskIds = categories.get(task.category) || [];
                taskIds.push(task.id);
                categories.set(task.category, taskIds);
            }
        }
        return categories;
    }
    /**
     * Identify batch groups for optimization
     */
    identifyBatchGroups(tasks) {
        const groups = [];
        const processed = new Set();
        for (const task of tasks) {
            if (processed.has(task.id) || !task.batchCompatible)
                continue;
            const group = [task];
            processed.add(task.id);
            // Find compatible tasks for batching
            for (const candidate of tasks) {
                if (processed.has(candidate.id) || !candidate.batchCompatible)
                    continue;
                if (this.areTasksBatchCompatible(task, candidate)) {
                    group.push(candidate);
                    processed.add(candidate.id);
                }
            }
            if (group.length > 1) {
                groups.push(group);
            }
        }
        return groups;
    }
    /**
     * Check if two tasks are compatible for batching
     */
    areTasksBatchCompatible(task1, task2) {
        return (task1.category === task2.category &&
            task1.batchGroup === task2.batchGroup &&
            !this.hasResourceConflict(task1, task2));
    }
    /**
     * Check for resource conflicts between tasks
     */
    hasResourceConflict(task1, task2) {
        return task1.requiredResources.some((resource) => task2.requiredResources.includes(resource));
    }
    /**
     * Optimize batch order
     */
    optimizeBatchOrder(batchGroups, dependencyAnalysis) {
        return batchGroups.map((group) => {
            const taskIds = group.map((t) => t.id);
            const estimatedDuration = Math.max(...group.map((t) => t.estimatedDuration));
            const resourceRequirements = Array.from(new Set(group.flatMap((t) => t.requiredResources)));
            const parallelizable = group.every((t) => dependencyAnalysis.parallelizableGroups.some((pg) => pg.includes(t.id)));
            return {
                taskIds,
                estimatedDuration,
                resourceRequirements,
                parallelizable,
            };
        });
    }
    /**
     * Calculate batch speedup
     */
    calculateBatchSpeedup(batches) {
        const totalSequentialTime = batches.reduce((sum, batch) => sum + batch.estimatedDuration, 0);
        const totalParallelTime = batches.reduce((sum, batch) => sum +
            (batch.parallelizable
                ? batch.estimatedDuration * 0.3
                : batch.estimatedDuration), 0);
        return Math.max(0, (totalSequentialTime - totalParallelTime) / totalSequentialTime);
    }
    /**
     * Calculate resource efficiency gain
     */
    calculateResourceEfficiencyGain(batches) {
        const totalResourceUsage = batches.reduce((sum, batch) => sum + batch.resourceRequirements.length, 0);
        const uniqueResources = new Set(batches.flatMap((batch) => batch.resourceRequirements)).size;
        return Math.max(0, (totalResourceUsage - uniqueResources) / totalResourceUsage);
    }
    /**
     * Additional utility methods for optimization...
     */
    findBlockingTasks(tasks, dependencyAnalysis) {
        const blockingTasks = new Set();
        for (const blockedTaskId of dependencyAnalysis.blockedTasks) {
            const task = tasks.get(blockedTaskId);
            if (task) {
                for (const depId of task.dependencies) {
                    const depTask = tasks.get(depId);
                    if (depTask && depTask.status !== TaskStatus.COMPLETED) {
                        blockingTasks.add(depId);
                    }
                }
            }
        }
        return Array.from(blockingTasks);
    }
    identifyResourceBottlenecks(tasks) {
        const bottlenecks = [];
        for (const [resourceId, utilization] of this.resourceUtilization) {
            if (utilization.currentLoad > 0.8) {
                const affectedTasks = Array.from(tasks.values())
                    .filter((task) => task.requiredResources.includes(resourceId) &&
                    task.status === TaskStatus.PENDING)
                    .map((task) => task.id);
                if (affectedTasks.length > 0) {
                    bottlenecks.push({
                        type: 'resource',
                        description: `Resource ${resourceId} at ${(utilization.currentLoad * 100).toFixed(1)}% capacity`,
                        impact: utilization.currentLoad,
                        affectedTasks,
                        recommendation: `Consider load balancing or increasing capacity for ${resourceId}`,
                    });
                }
            }
        }
        return bottlenecks;
    }
    identifyPriorityInversions(tasks, dependencyAnalysis) {
        const inversions = [];
        // Check for high priority tasks blocked by low priority tasks
        for (const taskId of dependencyAnalysis.blockedTasks) {
            const task = tasks.get(taskId);
            if (task && task.priority >= TaskPriority.HIGH) {
                const blockingLowPriorityTasks = task.dependencies.filter((depId) => {
                    const depTask = tasks.get(depId);
                    return depTask && depTask.priority < TaskPriority.MEDIUM;
                });
                if (blockingLowPriorityTasks.length > 0) {
                    inversions.push({
                        type: 'priority',
                        description: `High priority task ${taskId} blocked by low priority dependencies`,
                        impact: 0.6,
                        affectedTasks: [taskId, ...blockingLowPriorityTasks],
                        recommendation: `Consider boosting priority of blocking tasks: ${blockingLowPriorityTasks.join(', ')}`,
                    });
                }
            }
        }
        return inversions;
    }
    identifyBatchingOpportunities(tasks) {
        const opportunities = [];
        const batchableCategories = this.findBatchableCategories(tasks);
        for (const [category, taskIds] of batchableCategories) {
            if (taskIds.length >= 3) {
                const impact = Math.min(0.5, taskIds.length * 0.1);
                opportunities.push({
                    type: 'batch',
                    description: `${taskIds.length} ${category} tasks could be batched together`,
                    impact,
                    affectedTasks: taskIds,
                    recommendation: `Batch process ${category} tasks for ${(impact * 100).toFixed(0)}% efficiency gain`,
                });
            }
        }
        return opportunities;
    }
    calculateAverageTaskDuration(tasks) {
        const durations = Array.from(tasks.values()).map((t) => t.estimatedDuration);
        return durations.length > 0
            ? durations.reduce((sum, d) => sum + d, 0) / durations.length
            : 60000;
    }
    estimateTaskCompletionTime(task, dependencyAnalysis) {
        // Simple estimation based on dependencies and current queue state
        const dependencyDepth = task.dependencies.length;
        const baseTime = task.estimatedDuration;
        const queueingDelay = dependencyDepth * 30000; // 30 seconds per dependency level
        return baseTime + queueingDelay;
    }
    calculateHistoricalAccuracy() {
        if (this.optimizationHistory.length === 0)
            return 0.5;
        const accurateOptimizations = this.optimizationHistory.filter((opt) => opt.actualImprovement >
            opt.recommendations.reduce((sum, r) => sum + r.expectedImprovement, 0) *
                0.7);
        return accurateOptimizations.length / this.optimizationHistory.length;
    }
    canMoveTask(task, fromResource, toResource) {
        // Simple check - in reality, this would involve more complex resource compatibility checks
        return (task.requiredResources.includes(fromResource) &&
            !task.requiredResources.includes(toResource));
    }
    calculateMoveImpact(task, fromResource, toResource) {
        const fromUtilization = this.resourceUtilization.get(fromResource);
        const toUtilization = this.resourceUtilization.get(toResource);
        if (!fromUtilization || !toUtilization)
            return 0;
        const loadReduction = 0.1; // Simplified load model
        const fromImprovement = Math.max(0, fromUtilization.currentLoad - 0.8) * loadReduction;
        const toImpact = Math.max(0, 0.8 - toUtilization.currentLoad) * loadReduction;
        return (fromImprovement + toImpact) / 2;
    }
    findResourceSharingOpportunities(tasks) {
        const opportunities = [];
        const resourceTaskMap = new Map();
        // Group tasks by required resources
        for (const task of tasks.values()) {
            if (task.status === TaskStatus.PENDING) {
                for (const resource of task.requiredResources) {
                    const taskIds = resourceTaskMap.get(resource) || [];
                    taskIds.push(task.id);
                    resourceTaskMap.set(resource, taskIds);
                }
            }
        }
        // Find opportunities where multiple tasks could share resources efficiently
        for (const [resource, taskIds] of resourceTaskMap) {
            if (taskIds.length >= 2) {
                const efficiencyGain = Math.min(0.3, (taskIds.length - 1) * 0.1);
                opportunities.push({
                    resource,
                    taskIds,
                    efficiencyGain: efficiencyGain * 100, // Convert to percentage
                });
            }
        }
        return opportunities;
    }
    deduplicateRecommendations(recommendations) {
        const unique = new Map();
        for (const rec of recommendations) {
            const key = `${rec.type}-${rec.taskIds.sort().join('-')}`;
            const existing = unique.get(key);
            if (!existing || rec.weightedScore > existing.weightedScore) {
                unique.set(key, rec);
            }
        }
        return Array.from(unique.values());
    }
    applyRecommendation(tasks, recommendation) {
        try {
            switch (recommendation.type) {
                case 'priority_adjust':
                    return this.applyPriorityAdjustment(tasks, recommendation);
                case 'batch':
                    return this.applyBatching(tasks, recommendation);
                case 'parallel':
                    return this.applyParallelization(tasks, recommendation);
                case 'reorder':
                    return this.applyReordering(tasks, recommendation);
                case 'defer':
                    return this.applyDeferral(tasks, recommendation);
                case 'resource_rebalance':
                    return this.applyResourceRebalancing(tasks, recommendation);
                default:
                    logger.warn(`Unknown optimization type: ${recommendation.type}`);
                    return false;
            }
        }
        catch (error) {
            logger.error('Failed to apply recommendation', {
                type: recommendation.type,
                error: error instanceof Error ? error.message : String(error),
            });
            return false;
        }
    }
    applyPriorityAdjustment(tasks, recommendation) {
        const priorityBoost = recommendation.metadata?.priorityBoost ||
            TaskPriority.HIGH;
        for (const taskId of recommendation.taskIds) {
            const task = tasks.get(taskId);
            if (task) {
                task.priority = Math.max(task.priority, priorityBoost);
                task.dynamicPriority = Math.max(task.dynamicPriority, priorityBoost * 1.2);
            }
        }
        return true;
    }
    applyBatching(tasks, recommendation) {
        // Set batch group for all tasks in the recommendation
        const batchGroup = `optimized-batch-${Date.now()}`;
        for (const taskId of recommendation.taskIds) {
            const task = tasks.get(taskId);
            if (task) {
                task.batchCompatible = true;
                task.batchGroup = batchGroup;
            }
        }
        return true;
    }
    applyParallelization(tasks, recommendation) {
        // Mark tasks as suitable for parallel execution
        // This would integrate with the scheduler to enable concurrent execution
        for (const taskId of recommendation.taskIds) {
            const task = tasks.get(taskId);
            if (task && task.metadata) {
                task.metadata.parallelizable = true;
                task.metadata.parallelGroup = recommendation.description;
            }
        }
        return true;
    }
    applyReordering(tasks, recommendation) {
        // Apply priority adjustments to achieve desired ordering
        let priorityBoost = 50;
        for (const taskId of recommendation.taskIds) {
            const task = tasks.get(taskId);
            if (task) {
                task.dynamicPriority += priorityBoost;
                priorityBoost -= 5; // Decreasing boost for each task
            }
        }
        return true;
    }
    applyDeferral(tasks, recommendation) {
        // Lower priority of deferred tasks
        for (const taskId of recommendation.taskIds) {
            const task = tasks.get(taskId);
            if (task) {
                task.dynamicPriority = Math.max(TaskPriority.LOW, task.dynamicPriority * 0.8);
            }
        }
        return true;
    }
    applyResourceRebalancing(tasks, recommendation) {
        const loadBalancing = recommendation.metadata
            ?.loadBalancing;
        if (!loadBalancing)
            return false;
        // This would integrate with the resource allocation system
        // For now, we just mark the tasks for rebalancing
        for (const move of loadBalancing.tasksToMove) {
            const task = tasks.get(move.taskId);
            if (task && task.metadata) {
                task.metadata.resourceRebalance = {
                    from: move.fromResource,
                    to: move.toResource,
                    timestamp: new Date(),
                };
            }
        }
        return true;
    }
}
//# sourceMappingURL=QueueOptimizer.js.map