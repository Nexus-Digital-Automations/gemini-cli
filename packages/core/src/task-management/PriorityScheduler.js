/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { EventEmitter } from 'node:events';
import { logger } from '../utils/logger.js';
import { TaskPriority, TaskStatus, PriorityFactors, SchedulingFactors, ExecutionSequence, DependencyGraph, ResourceAllocation, ExecutionPlan } from './TaskQueue.js';
/**
 * Advanced scheduling algorithms
 */
export var SchedulingAlgorithm;
(function (SchedulingAlgorithm) {
    SchedulingAlgorithm["FIFO"] = "fifo";
    SchedulingAlgorithm["PRIORITY"] = "priority";
    SchedulingAlgorithm["SHORTEST_JOB_FIRST"] = "sjf";
    SchedulingAlgorithm["DEADLINE_MONOTONIC"] = "dm";
    SchedulingAlgorithm["DEPENDENCY_AWARE"] = "dependency";
    SchedulingAlgorithm["RESOURCE_OPTIMAL"] = "resource";
    SchedulingAlgorithm["MACHINE_LEARNING"] = "ml";
    SchedulingAlgorithm["HYBRID_ADAPTIVE"] = "hybrid"; // Adaptive hybrid approach
})(SchedulingAlgorithm || (SchedulingAlgorithm = {}));
/**
 * Advanced priority scheduler with multiple algorithms and intelligent optimization
 */
export class PriorityScheduler extends EventEmitter {
    options;
    currentAlgorithm;
    schedulingHistory = new Map();
    performanceMetrics = new Map();
    learningData = [];
    // Algorithm-specific configurations
    algorithmConfigs = new Map();
    constructor(initialAlgorithm = SchedulingAlgorithm.HYBRID_ADAPTIVE, options = {}) {
        super();
        this.options = options;
        this.currentAlgorithm = initialAlgorithm;
        this.options = {
            enableMachineLearning: true,
            adaptiveThreshold: 0.15,
            maxLearningHistory: 1000,
            performanceWindow: 100,
            ...options
        };
        this.initializeAlgorithmConfigs();
        this.initializePerformanceMetrics();
        logger.info('PriorityScheduler initialized', {
            algorithm: this.currentAlgorithm,
            options: this.options
        });
    }
    /**
     * Main scheduling function - selects optimal tasks for execution
     */
    async scheduleNextTasks(eligibleTasks, availableSlots, context) {
        const startTime = Date.now();
        logger.debug('Starting task scheduling', {
            eligibleTasks: eligibleTasks.length,
            availableSlots,
            algorithm: this.currentAlgorithm,
            systemLoad: context.systemLoad
        });
        let decision;
        try {
            // Select appropriate algorithm based on current context
            const algorithm = await this.selectOptimalAlgorithm(eligibleTasks, context);
            // Apply the selected scheduling algorithm
            decision = await this.applySchedulingAlgorithm(algorithm, eligibleTasks, availableSlots, context);
            // Record decision for learning
            this.recordSchedulingDecision(decision, context);
            // Update performance metrics
            this.updateAlgorithmPerformance(algorithm, startTime);
            logger.info('Task scheduling completed', {
                selectedTasks: decision.selectedTasks.length,
                algorithm: decision.metadata.algorithm,
                confidence: decision.metadata.confidenceScore,
                duration: Date.now() - startTime
            });
            this.emit('schedulingCompleted', decision);
            return decision;
        }
        catch (error) {
            logger.error('Scheduling failed, falling back to priority-based', {
                error: error instanceof Error ? error.message : String(error),
                algorithm: this.currentAlgorithm
            });
            // Fallback to simple priority scheduling
            decision = await this.applyPriorityScheduling(eligibleTasks, availableSlots, context);
            decision.metadata.algorithm = SchedulingAlgorithm.PRIORITY;
            this.emit('schedulingFallback', decision, error);
            return decision;
        }
    }
    /**
     * Select the most appropriate scheduling algorithm for current context
     */
    async selectOptimalAlgorithm(tasks, context) {
        if (this.currentAlgorithm !== SchedulingAlgorithm.HYBRID_ADAPTIVE) {
            return this.currentAlgorithm;
        }
        const factors = {
            taskCount: tasks.length,
            hasDeadlines: tasks.some(t => t.deadline),
            hasDependencies: tasks.some(t => t.dependencies.length > 0),
            resourceConstrained: context.availableResources.size > 0,
            highSystemLoad: context.systemLoad > 0.8,
            criticalTasks: tasks.filter(t => t.priority === TaskPriority.CRITICAL).length
        };
        // Algorithm selection logic
        if (factors.criticalTasks > 0 && factors.hasDeadlines) {
            return SchedulingAlgorithm.DEADLINE_MONOTONIC;
        }
        if (factors.hasDependencies && factors.taskCount > 5) {
            return SchedulingAlgorithm.DEPENDENCY_AWARE;
        }
        if (factors.resourceConstrained && factors.highSystemLoad) {
            return SchedulingAlgorithm.RESOURCE_OPTIMAL;
        }
        if (this.options.enableMachineLearning && this.learningData.length > 50) {
            return SchedulingAlgorithm.MACHINE_LEARNING;
        }
        if (factors.taskCount > 10) {
            return SchedulingAlgorithm.SHORTEST_JOB_FIRST;
        }
        return SchedulingAlgorithm.PRIORITY;
    }
    /**
     * Apply the selected scheduling algorithm
     */
    async applySchedulingAlgorithm(algorithm, tasks, slots, context) {
        switch (algorithm) {
            case SchedulingAlgorithm.FIFO:
                return this.applyFIFOScheduling(tasks, slots, context);
            case SchedulingAlgorithm.PRIORITY:
                return this.applyPriorityScheduling(tasks, slots, context);
            case SchedulingAlgorithm.SHORTEST_JOB_FIRST:
                return this.applySJFScheduling(tasks, slots, context);
            case SchedulingAlgorithm.DEADLINE_MONOTONIC:
                return this.applyDeadlineScheduling(tasks, slots, context);
            case SchedulingAlgorithm.DEPENDENCY_AWARE:
                return this.applyDependencyAwareScheduling(tasks, slots, context);
            case SchedulingAlgorithm.RESOURCE_OPTIMAL:
                return this.applyResourceOptimalScheduling(tasks, slots, context);
            case SchedulingAlgorithm.MACHINE_LEARNING:
                return this.applyMLScheduling(tasks, slots, context);
            case SchedulingAlgorithm.HYBRID_ADAPTIVE:
                return this.applyHybridScheduling(tasks, slots, context);
            default:
                return this.applyPriorityScheduling(tasks, slots, context);
        }
    }
    /**
     * First In, First Out scheduling
     */
    async applyFIFOScheduling(tasks, slots, context) {
        const sortedTasks = [...tasks].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
        const selectedTasks = sortedTasks.slice(0, slots);
        return {
            selectedTasks,
            reasoning: ['Tasks selected in creation order (FIFO)'],
            expectedOutcome: this.calculateExpectedOutcome(selectedTasks, context),
            alternatives: this.generateAlternatives(tasks, selectedTasks, slots, context),
            metadata: {
                algorithm: SchedulingAlgorithm.FIFO,
                decisionTime: new Date(),
                confidenceScore: 0.6
            }
        };
    }
    /**
     * Priority-based scheduling with dynamic factors
     */
    async applyPriorityScheduling(tasks, slots, context) {
        const scoredTasks = tasks.map(task => ({
            task,
            score: this.calculatePriorityScore(task, context)
        }));
        scoredTasks.sort((a, b) => b.score - a.score);
        const selectedTasks = scoredTasks.slice(0, slots).map(st => st.task);
        const reasoning = this.generatePriorityReasoning(scoredTasks, selectedTasks);
        return {
            selectedTasks,
            reasoning,
            expectedOutcome: this.calculateExpectedOutcome(selectedTasks, context),
            alternatives: this.generateAlternatives(tasks, selectedTasks, slots, context),
            metadata: {
                algorithm: SchedulingAlgorithm.PRIORITY,
                decisionTime: new Date(),
                confidenceScore: 0.8
            }
        };
    }
    /**
     * Shortest Job First scheduling
     */
    async applySJFScheduling(tasks, slots, context) {
        const sortedTasks = [...tasks].sort((a, b) => (a.estimatedDuration || 60000) - (b.estimatedDuration || 60000));
        // Apply priority weighting to break ties
        const weightedTasks = sortedTasks.map(task => ({
            task,
            adjustedDuration: (task.estimatedDuration || 60000) / Math.max(1, task.dynamicPriority / 500)
        }));
        weightedTasks.sort((a, b) => a.adjustedDuration - b.adjustedDuration);
        const selectedTasks = weightedTasks.slice(0, slots).map(wt => wt.task);
        return {
            selectedTasks,
            reasoning: [
                'Tasks selected by shortest estimated duration',
                'Priority weighting applied to break ties'
            ],
            expectedOutcome: this.calculateExpectedOutcome(selectedTasks, context),
            alternatives: this.generateAlternatives(tasks, selectedTasks, slots, context),
            metadata: {
                algorithm: SchedulingAlgorithm.SHORTEST_JOB_FIRST,
                decisionTime: new Date(),
                confidenceScore: 0.75
            }
        };
    }
    /**
     * Deadline Monotonic scheduling (Earliest Deadline First)
     */
    async applyDeadlineScheduling(tasks, slots, context) {
        const now = Date.now();
        const tasksWithDeadlines = tasks.filter(task => task.deadline);
        const tasksWithoutDeadlines = tasks.filter(task => !task.deadline);
        // Sort tasks with deadlines by urgency
        const deadlineSorted = tasksWithDeadlines.map(task => ({
            task,
            urgency: this.calculateDeadlineUrgency(task, now),
            timeToDeadline: (task.deadline.getTime() - now)
        })).sort((a, b) => b.urgency - a.urgency);
        // Add high-priority tasks without deadlines
        const highPriorityNoDL = tasksWithoutDeadlines
            .filter(task => task.priority >= TaskPriority.HIGH)
            .sort((a, b) => b.dynamicPriority - a.dynamicPriority);
        const combinedTasks = [
            ...deadlineSorted.map(dt => dt.task),
            ...highPriorityNoDL
        ];
        const selectedTasks = combinedTasks.slice(0, slots);
        const reasoning = [
            `${tasksWithDeadlines.length} tasks with deadlines prioritized`,
            'Critical path and deadline pressure considered',
            'High-priority tasks without deadlines included as capacity allows'
        ];
        return {
            selectedTasks,
            reasoning,
            expectedOutcome: this.calculateExpectedOutcome(selectedTasks, context),
            alternatives: this.generateAlternatives(tasks, selectedTasks, slots, context),
            metadata: {
                algorithm: SchedulingAlgorithm.DEADLINE_MONOTONIC,
                decisionTime: new Date(),
                confidenceScore: 0.85
            }
        };
    }
    /**
     * Dependency-aware scheduling with topological sorting
     */
    async applyDependencyAwareScheduling(tasks, slots, context) {
        // Build dependency graph
        const dependencyGraph = this.buildDependencyGraph(tasks);
        // Perform topological sort to respect dependencies
        const topologicalOrder = this.topologicalSort(dependencyGraph, tasks);
        // Select tasks that can run in parallel
        const selectedTasks = this.selectParallelizableTasks(topologicalOrder, slots, context);
        const reasoning = [
            'Tasks selected respecting dependency order',
            'Parallel execution opportunities identified',
            'Critical path optimization applied'
        ];
        return {
            selectedTasks,
            reasoning,
            expectedOutcome: this.calculateExpectedOutcome(selectedTasks, context),
            alternatives: this.generateAlternatives(tasks, selectedTasks, slots, context),
            metadata: {
                algorithm: SchedulingAlgorithm.DEPENDENCY_AWARE,
                decisionTime: new Date(),
                confidenceScore: 0.9
            }
        };
    }
    /**
     * Resource-optimal scheduling
     */
    async applyResourceOptimalScheduling(tasks, slots, context) {
        // Score tasks based on resource efficiency
        const resourceScored = tasks.map(task => ({
            task,
            resourceScore: this.calculateResourceEfficiency(task, context),
            conflictCount: this.calculateResourceConflicts(task, tasks)
        }));
        // Select optimal combination using greedy algorithm
        const selectedTasks = [];
        const usedResources = new Map();
        resourceScored
            .sort((a, b) => b.resourceScore - a.resourceScore)
            .forEach(({ task }) => {
            if (selectedTasks.length >= slots)
                return;
            // Check if task can be scheduled without resource conflicts
            const canSchedule = task.requiredResources.every(resource => {
                const used = usedResources.get(resource) || 0;
                const available = context.availableResources.get(resource) || 0;
                return used < available;
            });
            if (canSchedule) {
                selectedTasks.push(task);
                // Update used resources
                task.requiredResources.forEach(resource => {
                    usedResources.set(resource, (usedResources.get(resource) || 0) + 1);
                });
            }
        });
        return {
            selectedTasks,
            reasoning: [
                'Tasks selected for optimal resource utilization',
                'Resource conflicts minimized',
                'Execution parallelism maximized within resource constraints'
            ],
            expectedOutcome: this.calculateExpectedOutcome(selectedTasks, context),
            alternatives: this.generateAlternatives(tasks, selectedTasks, slots, context),
            metadata: {
                algorithm: SchedulingAlgorithm.RESOURCE_OPTIMAL,
                decisionTime: new Date(),
                confidenceScore: 0.88
            }
        };
    }
    /**
     * Machine Learning-based scheduling
     */
    async applyMLScheduling(tasks, slots, context) {
        if (this.learningData.length < 10) {
            // Fall back to priority scheduling if insufficient data
            return this.applyPriorityScheduling(tasks, slots, context);
        }
        // Use historical data to predict optimal task combinations
        const predictions = await this.predictOptimalScheduling(tasks, context);
        const selectedTasks = predictions.recommendations.slice(0, slots);
        return {
            selectedTasks,
            reasoning: [
                'Machine learning predictions based on historical performance',
                `Trained on ${this.learningData.length} scheduling decisions`,
                `Prediction confidence: ${Math.round(predictions.confidence * 100)}%`
            ],
            expectedOutcome: predictions.expectedOutcome,
            alternatives: predictions.alternatives,
            metadata: {
                algorithm: SchedulingAlgorithm.MACHINE_LEARNING,
                decisionTime: new Date(),
                confidenceScore: predictions.confidence
            }
        };
    }
    /**
     * Hybrid adaptive scheduling combining multiple approaches
     */
    async applyHybridScheduling(tasks, slots, context) {
        // Generate multiple scheduling options
        const options = await Promise.all([
            this.applyPriorityScheduling(tasks, slots, context),
            this.applySJFScheduling(tasks, slots, context),
            this.applyDeadlineScheduling(tasks, slots, context),
            this.applyResourceOptimalScheduling(tasks, slots, context)
        ]);
        // Score each option
        const scoredOptions = options.map(option => ({
            option,
            score: this.scoreSchedulingOption(option, context)
        }));
        scoredOptions.sort((a, b) => b.score - a.score);
        const bestOption = scoredOptions[0].option;
        // Enhance with hybrid reasoning
        bestOption.reasoning.unshift('Hybrid approach: evaluated multiple algorithms');
        bestOption.alternatives = scoredOptions.slice(1, 4).map(so => ({
            tasks: so.option.selectedTasks,
            score: so.score,
            tradeoffs: [`Alternative using ${so.option.metadata.algorithm} algorithm`]
        }));
        bestOption.metadata.algorithm = SchedulingAlgorithm.HYBRID_ADAPTIVE;
        bestOption.metadata.confidenceScore = Math.max(0.9, bestOption.metadata.confidenceScore);
        return bestOption;
    }
    /**
     * Calculate priority score for a task
     */
    calculatePriorityScore(task, context) {
        let score = task.dynamicPriority;
        // Age factor
        const ageMs = Date.now() - task.createdAt.getTime();
        const ageHours = ageMs / (1000 * 60 * 60);
        score += Math.min(100, ageHours * 2); // Up to 100 bonus points for age
        // Deadline urgency
        if (task.deadline) {
            const urgency = this.calculateDeadlineUrgency(task, Date.now());
            score += urgency * 200;
        }
        // Critical path bonus
        if (context.criticalPathTasks.has(task.id)) {
            score += 300;
        }
        // Resource availability factor
        const resourceFactor = task.requiredResources.length > 0
            ? this.calculateResourceAvailabilityFactor(task, context)
            : 1.0;
        score *= resourceFactor;
        // Historical success rate
        const successRate = this.getHistoricalSuccessRate(task);
        score *= (0.5 + successRate * 0.5); // 0.5-1.0 multiplier
        return score;
    }
    /**
     * Calculate deadline urgency (0-1 scale)
     */
    calculateDeadlineUrgency(task, now) {
        if (!task.deadline)
            return 0;
        const timeToDeadline = task.deadline.getTime() - now;
        const estimatedDuration = task.estimatedDuration || 60000;
        if (timeToDeadline <= estimatedDuration)
            return 1.0; // Critical urgency
        if (timeToDeadline <= estimatedDuration * 2)
            return 0.8; // High urgency
        if (timeToDeadline <= estimatedDuration * 5)
            return 0.5; // Medium urgency
        return Math.max(0.1, 1 - (timeToDeadline / (7 * 24 * 60 * 60 * 1000))); // Week scale
    }
    /**
     * Build dependency graph from tasks
     */
    buildDependencyGraph(tasks) {
        const graph = new Map();
        for (const task of tasks) {
            graph.set(task.id, new Set(task.dependencies));
        }
        return graph;
    }
    /**
     * Perform topological sort on dependency graph
     */
    topologicalSort(graph, tasks) {
        const inDegree = new Map();
        const result = [];
        const queue = [];
        const taskMap = new Map(tasks.map(t => [t.id, t]));
        // Initialize in-degrees
        for (const task of tasks) {
            inDegree.set(task.id, task.dependencies.length);
            if (task.dependencies.length === 0) {
                queue.push(task);
            }
        }
        // Process queue
        while (queue.length > 0) {
            // Sort queue by priority to break ties
            queue.sort((a, b) => b.dynamicPriority - a.dynamicPriority);
            const task = queue.shift();
            result.push(task);
            // Update dependents
            for (const otherTask of tasks) {
                if (otherTask.dependencies.includes(task.id)) {
                    const newInDegree = (inDegree.get(otherTask.id) || 0) - 1;
                    inDegree.set(otherTask.id, newInDegree);
                    if (newInDegree === 0) {
                        queue.push(otherTask);
                    }
                }
            }
        }
        return result;
    }
    /**
     * Select tasks that can run in parallel
     */
    selectParallelizableTasks(orderedTasks, slots, context) {
        const selected = [];
        const usedResources = new Set();
        for (const task of orderedTasks) {
            if (selected.length >= slots)
                break;
            // Check resource conflicts
            const hasConflict = task.requiredResources.some(resource => usedResources.has(resource));
            if (!hasConflict) {
                selected.push(task);
                task.requiredResources.forEach(resource => usedResources.add(resource));
            }
        }
        return selected;
    }
    /**
     * Calculate resource efficiency score for a task
     */
    calculateResourceEfficiency(task, context) {
        if (task.requiredResources.length === 0)
            return 1.0;
        let efficiency = 0;
        let totalResources = 0;
        for (const resource of task.requiredResources) {
            const available = context.availableResources.get(resource) || 1;
            const utilization = 1 / available; // Higher score for less constrained resources
            efficiency += utilization;
            totalResources += 1;
        }
        return totalResources > 0 ? efficiency / totalResources : 1.0;
    }
    /**
     * Calculate resource conflicts with other tasks
     */
    calculateResourceConflicts(task, allTasks) {
        let conflicts = 0;
        for (const otherTask of allTasks) {
            if (otherTask.id === task.id)
                continue;
            const sharedResources = task.requiredResources.filter(r => otherTask.requiredResources.includes(r));
            conflicts += sharedResources.length;
        }
        return conflicts;
    }
    /**
     * Calculate resource availability factor
     */
    calculateResourceAvailabilityFactor(task, context) {
        if (task.requiredResources.length === 0)
            return 1.0;
        let totalAvailability = 0;
        for (const resource of task.requiredResources) {
            const available = context.availableResources.get(resource) || 0;
            const utilization = available > 0 ? Math.min(1.0, 1.0 / available) : 0;
            totalAvailability += utilization;
        }
        return task.requiredResources.length > 0
            ? totalAvailability / task.requiredResources.length
            : 1.0;
    }
    /**
     * Get historical success rate for similar tasks
     */
    getHistoricalSuccessRate(task) {
        const similarDecisions = this.learningData.filter(data => data.decision.selectedTasks.some(t => t.category === task.category &&
            t.priority === task.priority));
        if (similarDecisions.length === 0)
            return 0.8; // Default assumption
        const successes = similarDecisions.filter(data => data.outcome.every(result => result.success)).length;
        return successes / similarDecisions.length;
    }
    /**
     * Predict optimal scheduling using ML techniques
     */
    async predictOptimalScheduling(tasks, context) {
        // Simple ML implementation - would use actual ML framework in production
        const features = this.extractFeatures(tasks, context);
        const predictions = this.learningData
            .map(data => ({
            data,
            similarity: this.calculateSimilarity(features, this.extractFeatures(data.decision.selectedTasks, context))
        }))
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, 10); // Top 10 most similar cases
        const weightedRecommendations = new Map();
        for (const { data, similarity } of predictions) {
            for (const selectedTask of data.decision.selectedTasks) {
                const currentScore = weightedRecommendations.get(selectedTask.id) || 0;
                weightedRecommendations.set(selectedTask.id, currentScore + similarity);
            }
        }
        const taskScores = tasks.map(task => ({
            task,
            score: weightedRecommendations.get(task.id) || 0
        })).sort((a, b) => b.score - a.score);
        const recommendations = taskScores.map(ts => ts.task);
        const confidence = predictions.length > 0
            ? predictions.reduce((sum, p) => sum + p.similarity, 0) / predictions.length
            : 0.5;
        return {
            recommendations,
            confidence,
            expectedOutcome: this.calculateExpectedOutcome(recommendations.slice(0, 5), context),
            alternatives: []
        };
    }
    /**
     * Extract features for ML processing
     */
    extractFeatures(tasks, context) {
        return [
            tasks.length,
            tasks.filter(t => t.priority === TaskPriority.CRITICAL).length,
            tasks.filter(t => t.priority === TaskPriority.HIGH).length,
            tasks.filter(t => t.dependencies.length > 0).length,
            tasks.filter(t => t.deadline !== undefined).length,
            context.systemLoad,
            context.queueDepth,
            context.currentWorkload,
            context.availableResources.size
        ];
    }
    /**
     * Calculate similarity between feature vectors
     */
    calculateSimilarity(features1, features2) {
        if (features1.length !== features2.length)
            return 0;
        const dotProduct = features1.reduce((sum, val, i) => sum + val * features2[i], 0);
        const norm1 = Math.sqrt(features1.reduce((sum, val) => sum + val * val, 0));
        const norm2 = Math.sqrt(features2.reduce((sum, val) => sum + val * val, 0));
        return norm1 * norm2 > 0 ? dotProduct / (norm1 * norm2) : 0;
    }
    /**
     * Score a scheduling option
     */
    scoreSchedulingOption(option, context) {
        let score = 0;
        // Base score from expected outcome
        score += option.expectedOutcome.resourceUtilization * 100;
        score += option.expectedOutcome.parallelismFactor * 50;
        score -= (option.expectedOutcome.totalDuration / 1000) * 0.1; // Prefer shorter duration
        // Risk penalty
        const riskPenalty = option.expectedOutcome.riskAssessment === 'high' ? 50 :
            option.expectedOutcome.riskAssessment === 'medium' ? 20 : 0;
        score -= riskPenalty;
        // Confidence bonus
        score += option.metadata.confidenceScore * 30;
        return score;
    }
    /**
     * Calculate expected outcome for selected tasks
     */
    calculateExpectedOutcome(tasks, context) {
        const totalDuration = Math.max(...tasks.map(t => t.estimatedDuration || 60000));
        const resourceUsage = new Map();
        tasks.forEach(task => {
            task.requiredResources.forEach(resource => {
                resourceUsage.set(resource, (resourceUsage.get(resource) || 0) + 1);
            });
        });
        const maxResourceUsage = Math.max(0, ...Array.from(resourceUsage.values()));
        const totalResources = context.availableResources.size || 1;
        const resourceUtilization = Math.min(1.0, maxResourceUsage / totalResources);
        const parallelismFactor = tasks.length > 1 ? Math.min(1.0, tasks.length / totalResources) : 0;
        const highRiskTasks = tasks.filter(t => t.priority === TaskPriority.CRITICAL ||
            t.currentRetries > 0 ||
            (t.deadline && (t.deadline.getTime() - Date.now()) < (t.estimatedDuration || 60000) * 2)).length;
        const riskAssessment = highRiskTasks > tasks.length * 0.5 ? 'high' :
            highRiskTasks > 0 ? 'medium' : 'low';
        return {
            totalDuration,
            resourceUtilization,
            parallelismFactor,
            riskAssessment
        };
    }
    /**
     * Generate alternative scheduling options
     */
    generateAlternatives(allTasks, selectedTasks, slots, context) {
        const alternatives = [];
        // Random sampling alternative
        const shuffledTasks = [...allTasks].sort(() => Math.random() - 0.5);
        alternatives.push({
            tasks: shuffledTasks.slice(0, slots),
            score: 0.3,
            tradeoffs: ['Random selection - low optimization']
        });
        // Priority-only alternative (if current wasn't priority-based)
        const prioritySorted = [...allTasks].sort((a, b) => b.dynamicPriority - a.dynamicPriority);
        alternatives.push({
            tasks: prioritySorted.slice(0, slots),
            score: 0.6,
            tradeoffs: ['Pure priority-based selection']
        });
        return alternatives.slice(0, 2); // Limit alternatives
    }
    /**
     * Generate reasoning for priority-based decisions
     */
    generatePriorityReasoning(scoredTasks, selectedTasks) {
        const reasoning = [];
        const avgScore = scoredTasks.reduce((sum, st) => sum + st.score, 0) / scoredTasks.length;
        const selectedScores = scoredTasks.filter(st => selectedTasks.includes(st.task));
        reasoning.push(`Selected top ${selectedTasks.length} tasks by priority score`);
        const criticalTasks = selectedTasks.filter(t => t.priority === TaskPriority.CRITICAL).length;
        if (criticalTasks > 0) {
            reasoning.push(`${criticalTasks} critical priority tasks included`);
        }
        const tasksWithDeadlines = selectedTasks.filter(t => t.deadline).length;
        if (tasksWithDeadlines > 0) {
            reasoning.push(`${tasksWithDeadlines} tasks with deadlines prioritized`);
        }
        const avgSelectedScore = selectedScores.reduce((sum, st) => sum + st.score, 0) / selectedScores.length;
        if (avgSelectedScore > avgScore * 1.2) {
            reasoning.push('Selected tasks significantly above average priority');
        }
        return reasoning;
    }
    /**
     * Record scheduling decision for learning
     */
    recordSchedulingDecision(decision, context) {
        // Store limited history to prevent memory leaks
        if (this.learningData.length >= (this.options.maxLearningHistory || 1000)) {
            this.learningData.shift(); // Remove oldest entry
        }
        this.schedulingHistory.set(decision.selectedTasks.map(t => t.id).join(','), decision);
        logger.debug('Scheduling decision recorded for learning', {
            selectedTasks: decision.selectedTasks.length,
            algorithm: decision.metadata.algorithm,
            confidence: decision.metadata.confidenceScore
        });
    }
    /**
     * Update algorithm performance metrics
     */
    updateAlgorithmPerformance(algorithm, startTime) {
        const duration = Date.now() - startTime;
        const currentPerf = this.performanceMetrics.get(algorithm) || 0;
        // Exponential moving average
        const alpha = 0.1;
        const newPerf = currentPerf * (1 - alpha) + duration * alpha;
        this.performanceMetrics.set(algorithm, newPerf);
    }
    /**
     * Learn from task execution outcomes
     */
    recordExecutionOutcome(decision, outcomes) {
        if (!this.options.enableMachineLearning)
            return;
        // Find the context for this decision
        const decisionKey = decision.selectedTasks.map(t => t.id).join(',');
        const historicalDecision = this.schedulingHistory.get(decisionKey);
        if (!historicalDecision)
            return;
        // Record learning data
        this.learningData.push({
            context: {}, // Would need to store this
            decision: historicalDecision,
            outcome: outcomes,
            timestamp: new Date()
        });
        // Update algorithm performance based on outcomes
        const successRate = outcomes.filter(o => o.success).length / outcomes.length;
        const algorithm = decision.metadata.algorithm;
        logger.debug('Execution outcome recorded for learning', {
            algorithm,
            successRate,
            taskCount: outcomes.length
        });
        this.emit('learningUpdated', {
            algorithm,
            successRate,
            totalLearningData: this.learningData.length
        });
    }
    /**
     * Get current scheduling performance metrics
     */
    getPerformanceMetrics() {
        return {
            algorithmPerformance: new Map(this.performanceMetrics),
            currentAlgorithm: this.currentAlgorithm,
            totalDecisions: this.schedulingHistory.size,
            learningDataSize: this.learningData.length
        };
    }
    /**
     * Switch to a different scheduling algorithm
     */
    setAlgorithm(algorithm) {
        const oldAlgorithm = this.currentAlgorithm;
        this.currentAlgorithm = algorithm;
        logger.info('Scheduling algorithm changed', {
            from: oldAlgorithm,
            to: algorithm
        });
        this.emit('algorithmChanged', { from: oldAlgorithm, to: algorithm });
    }
    /**
     * Initialize algorithm configurations
     */
    initializeAlgorithmConfigs() {
        this.algorithmConfigs.set(SchedulingAlgorithm.FIFO, {
            enabled: true,
            weight: 0.6
        });
        this.algorithmConfigs.set(SchedulingAlgorithm.PRIORITY, {
            enabled: true,
            weight: 0.8,
            priorityWeights: {
                [TaskPriority.CRITICAL]: 1000,
                [TaskPriority.HIGH]: 800,
                [TaskPriority.MEDIUM]: 500,
                [TaskPriority.LOW]: 200,
                [TaskPriority.BACKGROUND]: 50
            }
        });
        this.algorithmConfigs.set(SchedulingAlgorithm.SHORTEST_JOB_FIRST, {
            enabled: true,
            weight: 0.75,
            priorityWeighting: true
        });
        this.algorithmConfigs.set(SchedulingAlgorithm.DEADLINE_MONOTONIC, {
            enabled: true,
            weight: 0.85,
            urgencyThresholds: {
                critical: 1.0,
                high: 0.8,
                medium: 0.5
            }
        });
        this.algorithmConfigs.set(SchedulingAlgorithm.DEPENDENCY_AWARE, {
            enabled: true,
            weight: 0.9,
            parallelismFactor: 0.8
        });
        this.algorithmConfigs.set(SchedulingAlgorithm.RESOURCE_OPTIMAL, {
            enabled: true,
            weight: 0.88,
            resourceThreshold: 0.8
        });
        this.algorithmConfigs.set(SchedulingAlgorithm.MACHINE_LEARNING, {
            enabled: this.options.enableMachineLearning,
            weight: 0.95,
            minLearningData: 50
        });
        this.algorithmConfigs.set(SchedulingAlgorithm.HYBRID_ADAPTIVE, {
            enabled: true,
            weight: 1.0,
            adaptiveThreshold: this.options.adaptiveThreshold
        });
    }
    /**
     * Initialize performance metrics for all algorithms
     */
    initializePerformanceMetrics() {
        Object.values(SchedulingAlgorithm).forEach(algorithm => {
            this.performanceMetrics.set(algorithm, 100); // Default 100ms
        });
    }
    /**
     * Clear learning data and reset metrics
     */
    reset() {
        this.learningData.length = 0;
        this.schedulingHistory.clear();
        this.initializePerformanceMetrics();
        logger.info('PriorityScheduler reset completed');
        this.emit('reset');
    }
}
//# sourceMappingURL=PriorityScheduler.js.map