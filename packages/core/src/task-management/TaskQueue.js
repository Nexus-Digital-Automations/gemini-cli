/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { EventEmitter } from 'node:events';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger.js';
/**
 * Task priority levels with intelligent scoring system
 */
export var TaskPriority;
(function (TaskPriority) {
    TaskPriority[TaskPriority["CRITICAL"] = 1000] = "CRITICAL";
    TaskPriority[TaskPriority["HIGH"] = 800] = "HIGH";
    TaskPriority[TaskPriority["MEDIUM"] = 500] = "MEDIUM";
    TaskPriority[TaskPriority["LOW"] = 200] = "LOW";
    TaskPriority[TaskPriority["BACKGROUND"] = 50] = "BACKGROUND"; // Cleanup, documentation
})(TaskPriority || (TaskPriority = {}));
/**
 * Task execution status
 */
export var TaskStatus;
(function (TaskStatus) {
    TaskStatus["PENDING"] = "pending";
    TaskStatus["QUEUED"] = "queued";
    TaskStatus["RUNNING"] = "running";
    TaskStatus["BLOCKED"] = "blocked";
    TaskStatus["COMPLETED"] = "completed";
    TaskStatus["FAILED"] = "failed";
    TaskStatus["CANCELLED"] = "cancelled";
})(TaskStatus || (TaskStatus = {}));
/**
 * Task category for intelligent grouping and optimization
 */
export var TaskCategory;
(function (TaskCategory) {
    TaskCategory["FEATURE"] = "feature";
    TaskCategory["BUG_FIX"] = "bug_fix";
    TaskCategory["TEST"] = "test";
    TaskCategory["DOCUMENTATION"] = "documentation";
    TaskCategory["REFACTOR"] = "refactor";
    TaskCategory["SECURITY"] = "security";
    TaskCategory["PERFORMANCE"] = "performance";
    TaskCategory["INFRASTRUCTURE"] = "infrastructure";
})(TaskCategory || (TaskCategory = {}));
/**
 * Dependency relationship types
 */
export var DependencyType;
(function (DependencyType) {
    DependencyType["BLOCKS"] = "blocks";
    DependencyType["ENABLES"] = "enables";
    DependencyType["CONFLICTS"] = "conflicts";
    DependencyType["ENHANCES"] = "enhances"; // Better to run together
})(DependencyType || (DependencyType = {}));
/**
 * Intelligent Task Queue with autonomous scheduling and execution
 */
export class TaskQueue extends EventEmitter {
    tasks = new Map();
    dependencies = new Map();
    runningTasks = new Set();
    completedTasks = new Map();
    failedTasks = new Map();
    options;
    priorityAdjustmentTimer;
    queueOptimizationTimer;
    // Performance tracking
    metrics = {
        totalTasks: 0,
        pendingTasks: 0,
        runningTasks: 0,
        completedTasks: 0,
        failedTasks: 0,
        averageWaitTime: 0,
        averageExecutionTime: 0,
        throughputPerHour: 0,
        successRate: 0,
        priorityDistribution: {},
        categoryDistribution: {}
    };
    constructor(options = {}) {
        super();
        this.options = {
            maxConcurrentTasks: options.maxConcurrentTasks ?? 5,
            maxRetries: options.maxRetries ?? 3,
            defaultTimeout: options.defaultTimeout ?? 300000, // 5 minutes
            priorityAdjustmentInterval: options.priorityAdjustmentInterval ?? 60000, // 1 minute
            enableBatching: options.enableBatching ?? true,
            enableParallelExecution: options.enableParallelExecution ?? true,
            enableSmartScheduling: options.enableSmartScheduling ?? true,
            enableQueueOptimization: options.enableQueueOptimization ?? true,
            persistenceEnabled: options.persistenceEnabled ?? true,
            metricsEnabled: options.metricsEnabled ?? true,
            ...options
        };
        this.startPeriodicOptimization();
        logger.info('TaskQueue initialized with autonomous scheduling capabilities', {
            options: this.options
        });
    }
    /**
     * Add a new task to the queue with intelligent priority assignment
     */
    async addTask(taskDefinition) {
        const task = {
            id: taskDefinition.id ?? uuidv4(),
            title: taskDefinition.title,
            description: taskDefinition.description,
            category: taskDefinition.category ?? TaskCategory.FEATURE,
            priority: taskDefinition.priority ?? TaskPriority.MEDIUM,
            status: TaskStatus.PENDING,
            estimatedDuration: taskDefinition.estimatedDuration ?? 60000, // 1 minute default
            maxRetries: taskDefinition.maxRetries ?? this.options.maxRetries,
            currentRetries: 0,
            createdAt: new Date(),
            dependencies: taskDefinition.dependencies ?? [],
            dependents: [],
            context: taskDefinition.context ?? {},
            basePriority: taskDefinition.priority ?? TaskPriority.MEDIUM,
            dynamicPriority: taskDefinition.priority ?? TaskPriority.MEDIUM,
            priorityFactors: {
                age: 0,
                userImportance: 1.0,
                systemCriticality: 1.0,
                dependencyWeight: 1.0,
                resourceAvailability: 1.0,
                executionHistory: 1.0
            },
            executeFunction: taskDefinition.executeFunction,
            validateFunction: taskDefinition.validateFunction,
            rollbackFunction: taskDefinition.rollbackFunction,
            tags: taskDefinition.tags ?? [],
            metadata: taskDefinition.metadata ?? {},
            requiredResources: taskDefinition.requiredResources ?? [],
            resourceConstraints: taskDefinition.resourceConstraints ?? {},
            preConditions: taskDefinition.preConditions ?? [],
            postConditions: taskDefinition.postConditions ?? [],
            progressCallback: taskDefinition.progressCallback,
            batchCompatible: taskDefinition.batchCompatible ?? false,
            batchGroup: taskDefinition.batchGroup
        };
        // Add reverse dependency references
        for (const depId of task.dependencies) {
            const depTask = this.tasks.get(depId);
            if (depTask) {
                depTask.dependents.push(task.id);
            }
        }
        this.tasks.set(task.id, task);
        this.updateMetrics();
        logger.info(`Task added to queue: ${task.title}`, {
            taskId: task.id,
            priority: task.priority,
            category: task.category,
            dependencies: task.dependencies
        });
        this.emit('taskAdded', task);
        // Trigger immediate scheduling check
        setImmediate(() => this.scheduleNextTasks());
        return task.id;
    }
    /**
     * Add a dependency between two tasks
     */
    addDependency(dependentId, dependsOnId, type = DependencyType.BLOCKS, isOptional = false) {
        const dependency = {
            id: uuidv4(),
            dependentTaskId: dependentId,
            dependsOnTaskId: dependsOnId,
            type,
            isOptional
        };
        this.dependencies.set(dependency.id, dependency);
        // Update task references
        const dependentTask = this.tasks.get(dependentId);
        const dependsOnTask = this.tasks.get(dependsOnId);
        if (dependentTask && !dependentTask.dependencies.includes(dependsOnId)) {
            dependentTask.dependencies.push(dependsOnId);
        }
        if (dependsOnTask && !dependsOnTask.dependents.includes(dependentId)) {
            dependsOnTask.dependents.push(dependentId);
        }
        logger.info(`Dependency added: ${dependentId} depends on ${dependsOnId}`, {
            type,
            isOptional
        });
        this.emit('dependencyAdded', dependency);
    }
    /**
     * Intelligent task scheduling with priority and dependency resolution
     */
    async scheduleNextTasks() {
        if (this.runningTasks.size >= this.options.maxConcurrentTasks) {
            return; // At capacity
        }
        const availableSlots = this.options.maxConcurrentTasks - this.runningTasks.size;
        const eligibleTasks = this.getEligibleTasks();
        if (eligibleTasks.length === 0) {
            return; // No tasks ready to run
        }
        // Smart scheduling: consider batching, parallel execution, and optimization
        const scheduledTasks = await this.selectOptimalTasks(eligibleTasks, availableSlots);
        for (const task of scheduledTasks) {
            await this.executeTask(task);
        }
    }
    /**
     * Get tasks that are eligible for execution (dependencies satisfied)
     */
    getEligibleTasks() {
        const eligible = [];
        for (const task of this.tasks.values()) {
            if (task.status !== TaskStatus.PENDING) {
                continue;
            }
            // Check if all blocking dependencies are satisfied
            const blockingDeps = task.dependencies.filter(depId => {
                const depTask = this.tasks.get(depId);
                return depTask?.status !== TaskStatus.COMPLETED;
            });
            if (blockingDeps.length === 0) {
                // Validate pre-conditions
                if (this.validatePreConditions(task)) {
                    eligible.push(task);
                }
            }
        }
        // Sort by dynamic priority (highest first)
        eligible.sort((a, b) => b.dynamicPriority - a.dynamicPriority);
        return eligible;
    }
    /**
     * Select optimal tasks for execution using advanced algorithms
     */
    async selectOptimalTasks(eligibleTasks, availableSlots) {
        if (!this.options.enableSmartScheduling) {
            return eligibleTasks.slice(0, availableSlots);
        }
        const selected = [];
        const remaining = [...eligibleTasks];
        while (selected.length < availableSlots && remaining.length > 0) {
            let bestTask = null;
            let bestScore = -1;
            let bestIndex = -1;
            for (let i = 0; i < remaining.length; i++) {
                const task = remaining[i];
                const score = this.calculateExecutionScore(task, selected);
                if (score > bestScore) {
                    bestScore = score;
                    bestTask = task;
                    bestIndex = i;
                }
            }
            if (bestTask) {
                selected.push(bestTask);
                remaining.splice(bestIndex, 1);
                // Check for batch opportunities
                if (this.options.enableBatching && bestTask.batchCompatible) {
                    const batchTasks = this.findBatchableTasks(bestTask, remaining);
                    selected.push(...batchTasks.slice(0, availableSlots - selected.length));
                    // Remove batched tasks from remaining
                    for (const batchTask of batchTasks) {
                        const idx = remaining.indexOf(batchTask);
                        if (idx > -1)
                            remaining.splice(idx, 1);
                    }
                }
            }
            else {
                break;
            }
        }
        return selected;
    }
    /**
     * Calculate execution score for task selection optimization
     */
    calculateExecutionScore(task, alreadySelected) {
        let score = task.dynamicPriority;
        // Age factor - older tasks get priority boost
        const ageMs = Date.now() - task.createdAt.getTime();
        const ageDays = ageMs / (1000 * 60 * 60 * 24);
        score += ageDays * 10; // 10 points per day
        // Deadline pressure
        if (task.deadline) {
            const timeToDeadline = task.deadline.getTime() - Date.now();
            const deadlinePressure = Math.max(0, 1 - (timeToDeadline / (7 * 24 * 60 * 60 * 1000))); // Week scale
            score += deadlinePressure * 200;
        }
        // Dependency chain optimization
        const chainLength = this.calculateDependencyChainLength(task);
        score += chainLength * 5; // Favor tasks with longer dependency chains
        // Resource availability
        score *= task.priorityFactors.resourceAvailability;
        // Parallel execution bonus
        if (this.options.enableParallelExecution) {
            const conflictCount = this.countResourceConflicts(task, alreadySelected);
            score *= Math.max(0.1, 1 - (conflictCount * 0.2));
        }
        return score;
    }
    /**
     * Find tasks that can be batched with the given task
     */
    findBatchableTasks(baseTask, candidates) {
        if (!baseTask.batchCompatible || !baseTask.batchGroup) {
            return [];
        }
        return candidates.filter(task => task.batchCompatible &&
            task.batchGroup === baseTask.batchGroup &&
            task.category === baseTask.category);
    }
    /**
     * Execute a task with comprehensive monitoring and error handling
     */
    async executeTask(task) {
        task.status = TaskStatus.RUNNING;
        task.startedAt = new Date();
        this.runningTasks.add(task.id);
        const executionRecord = {
            taskId: task.id,
            executionId: uuidv4(),
            startTime: new Date(),
            status: TaskStatus.RUNNING,
            metadata: {
                attempt: task.currentRetries + 1,
                maxRetries: task.maxRetries
            }
        };
        logger.info(`Executing task: ${task.title}`, {
            taskId: task.id,
            attempt: task.currentRetries + 1,
            estimatedDuration: task.estimatedDuration
        });
        this.emit('taskStarted', task, executionRecord);
        try {
            // Execute with timeout
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Task execution timeout')), this.options.defaultTimeout);
            });
            const executionPromise = task.executeFunction(task, task.context);
            const result = await Promise.race([executionPromise, timeoutPromise]);
            // Task completed successfully
            executionRecord.endTime = new Date();
            executionRecord.status = TaskStatus.COMPLETED;
            executionRecord.duration = executionRecord.endTime.getTime() - executionRecord.startTime.getTime();
            task.status = TaskStatus.COMPLETED;
            task.completedAt = new Date();
            task.actualDuration = executionRecord.duration;
            this.completedTasks.set(task.id, executionRecord);
            this.runningTasks.delete(task.id);
            logger.info(`Task completed successfully: ${task.title}`, {
                taskId: task.id,
                duration: executionRecord.duration,
                result: result.success
            });
            this.emit('taskCompleted', task, executionRecord, result);
            // Process any follow-up tasks
            if (result.nextTasks) {
                for (const nextTaskDef of result.nextTasks) {
                    await this.addTask({
                        ...nextTaskDef,
                        title: nextTaskDef.title,
                        description: nextTaskDef.description,
                        executeFunction: nextTaskDef.executeFunction
                    });
                }
            }
            // Schedule dependent tasks
            this.scheduleNextTasks();
        }
        catch (error) {
            // Task failed
            executionRecord.endTime = new Date();
            executionRecord.status = TaskStatus.FAILED;
            executionRecord.duration = executionRecord.endTime.getTime() - executionRecord.startTime.getTime();
            executionRecord.error = error instanceof Error ? error.message : String(error);
            task.currentRetries++;
            this.runningTasks.delete(task.id);
            const shouldRetry = task.currentRetries < task.maxRetries;
            if (shouldRetry) {
                task.status = TaskStatus.PENDING;
                logger.warn(`Task failed, will retry: ${task.title}`, {
                    taskId: task.id,
                    error: executionRecord.error,
                    attempt: task.currentRetries,
                    maxRetries: task.maxRetries
                });
                this.emit('taskRetrying', task, executionRecord, error);
                // Exponential backoff before retry
                const backoffMs = Math.min(1000 * Math.pow(2, task.currentRetries - 1), 30000);
                setTimeout(() => this.scheduleNextTasks(), backoffMs);
            }
            else {
                task.status = TaskStatus.FAILED;
                this.failedTasks.set(task.id, executionRecord);
                logger.error(`Task failed permanently: ${task.title}`, {
                    taskId: task.id,
                    error: executionRecord.error,
                    totalAttempts: task.currentRetries
                });
                this.emit('taskFailed', task, executionRecord, error);
                // Handle rollback if defined
                if (task.rollbackFunction) {
                    try {
                        await task.rollbackFunction(task, task.context);
                        logger.info(`Task rollback completed: ${task.title}`, { taskId: task.id });
                    }
                    catch (rollbackError) {
                        logger.error(`Task rollback failed: ${task.title}`, {
                            taskId: task.id,
                            rollbackError: rollbackError instanceof Error ? rollbackError.message : String(rollbackError)
                        });
                    }
                }
            }
            this.updateMetrics();
        }
    }
    /**
     * Dynamic priority adjustment based on queue state and execution history
     */
    adjustTaskPriorities() {
        const now = Date.now();
        for (const task of this.tasks.values()) {
            if (task.status === TaskStatus.COMPLETED || task.status === TaskStatus.FAILED) {
                continue;
            }
            // Age factor
            const ageMs = now - task.createdAt.getTime();
            const ageHours = ageMs / (1000 * 60 * 60);
            task.priorityFactors.age = Math.min(2.0, 1 + (ageHours / 24)); // Max 2x boost after 24 hours
            // Deadline pressure
            if (task.deadline) {
                const timeToDeadline = task.deadline.getTime() - now;
                const deadlinePressure = Math.max(0.5, 1 - (timeToDeadline / (7 * 24 * 60 * 60 * 1000)));
                task.priorityFactors.systemCriticality = deadlinePressure;
            }
            // Dependency weight - tasks blocking others get higher priority
            const blockedTasksCount = task.dependents.filter(depId => {
                const depTask = this.tasks.get(depId);
                return depTask?.status === TaskStatus.PENDING;
            }).length;
            task.priorityFactors.dependencyWeight = 1 + (blockedTasksCount * 0.1);
            // Historical success rate
            const similarTasks = this.findSimilarCompletedTasks(task);
            if (similarTasks.length > 0) {
                const successRate = similarTasks.filter(t => t.status === TaskStatus.COMPLETED).length / similarTasks.length;
                task.priorityFactors.executionHistory = 0.5 + (successRate * 0.5);
            }
            // Calculate new dynamic priority
            const factorProduct = Object.values(task.priorityFactors).reduce((acc, factor) => acc * factor, 1);
            task.dynamicPriority = task.basePriority * factorProduct;
            // Ensure reasonable bounds
            task.dynamicPriority = Math.max(1, Math.min(2000, task.dynamicPriority));
        }
        logger.debug('Task priorities adjusted', {
            totalTasks: this.tasks.size,
            timestamp: new Date().toISOString()
        });
    }
    /**
     * Validate task pre-conditions
     */
    validatePreConditions(task) {
        if (!task.preConditions || task.preConditions.length === 0) {
            return true;
        }
        // Simple condition validation - can be extended with more complex logic
        for (const condition of task.preConditions) {
            // Example: "env.NODE_ENV === 'development'"
            try {
                const isValid = this.evaluateCondition(condition, task.context);
                if (!isValid) {
                    logger.debug(`Task pre-condition failed: ${condition}`, { taskId: task.id });
                    return false;
                }
            }
            catch (error) {
                logger.warn(`Error evaluating pre-condition: ${condition}`, {
                    taskId: task.id,
                    error: error instanceof Error ? error.message : String(error)
                });
                return false;
            }
        }
        return true;
    }
    /**
     * Simple condition evaluator (can be enhanced with a proper expression parser)
     */
    evaluateCondition(condition, context) {
        // Basic implementation - would need a proper expression evaluator in production
        // For now, assume conditions are always true
        return true;
    }
    /**
     * Calculate dependency chain length for optimization
     */
    calculateDependencyChainLength(task) {
        const visited = new Set();
        const calculateDepth = (taskId) => {
            if (visited.has(taskId))
                return 0;
            visited.add(taskId);
            const currentTask = this.tasks.get(taskId);
            if (!currentTask)
                return 0;
            let maxDepth = 0;
            for (const depId of currentTask.dependents) {
                maxDepth = Math.max(maxDepth, calculateDepth(depId));
            }
            return maxDepth + 1;
        };
        return calculateDepth(task.id);
    }
    /**
     * Count resource conflicts with already selected tasks
     */
    countResourceConflicts(task, selectedTasks) {
        let conflicts = 0;
        for (const selectedTask of selectedTasks) {
            const sharedResources = task.requiredResources.filter(r => selectedTask.requiredResources.includes(r));
            conflicts += sharedResources.length;
        }
        return conflicts;
    }
    /**
     * Find similar completed tasks for historical analysis
     */
    findSimilarCompletedTasks(task) {
        const similar = [];
        for (const record of [...this.completedTasks.values(), ...this.failedTasks.values()]) {
            const recordTask = this.tasks.get(record.taskId);
            if (recordTask &&
                recordTask.category === task.category &&
                recordTask.tags.some(tag => task.tags.includes(tag))) {
                similar.push(record);
            }
        }
        return similar;
    }
    /**
     * Update queue metrics
     */
    updateMetrics() {
        if (!this.options.metricsEnabled)
            return;
        this.metrics.totalTasks = this.tasks.size;
        this.metrics.pendingTasks = Array.from(this.tasks.values()).filter(t => t.status === TaskStatus.PENDING).length;
        this.metrics.runningTasks = this.runningTasks.size;
        this.metrics.completedTasks = this.completedTasks.size;
        this.metrics.failedTasks = this.failedTasks.size;
        // Calculate averages
        const completedRecords = Array.from(this.completedTasks.values());
        if (completedRecords.length > 0) {
            const totalExecutionTime = completedRecords.reduce((sum, record) => sum + (record.duration || 0), 0);
            this.metrics.averageExecutionTime = totalExecutionTime / completedRecords.length;
            const totalWaitTime = completedRecords.reduce((sum, record) => {
                const task = this.tasks.get(record.taskId);
                if (task && task.startedAt) {
                    return sum + (task.startedAt.getTime() - task.createdAt.getTime());
                }
                return sum;
            }, 0);
            this.metrics.averageWaitTime = totalWaitTime / completedRecords.length;
        }
        // Calculate success rate
        const totalCompleted = this.metrics.completedTasks + this.metrics.failedTasks;
        this.metrics.successRate = totalCompleted > 0 ? this.metrics.completedTasks / totalCompleted : 0;
        // Calculate throughput (tasks per hour)
        const hourAgo = Date.now() - (60 * 60 * 1000);
        const recentCompletions = completedRecords.filter(r => r.endTime && r.endTime.getTime() > hourAgo);
        this.metrics.throughputPerHour = recentCompletions.length;
        // Distribution metrics
        this.metrics.priorityDistribution = {};
        this.metrics.categoryDistribution = {};
        for (const task of this.tasks.values()) {
            this.metrics.priorityDistribution[task.priority] = (this.metrics.priorityDistribution[task.priority] || 0) + 1;
            this.metrics.categoryDistribution[task.category] = (this.metrics.categoryDistribution[task.category] || 0) + 1;
        }
    }
    /**
     * Start periodic optimization processes
     */
    startPeriodicOptimization() {
        // Priority adjustment
        if (this.options.priorityAdjustmentInterval > 0) {
            this.priorityAdjustmentTimer = setInterval(() => {
                this.adjustTaskPriorities();
            }, this.options.priorityAdjustmentInterval);
        }
        // Queue optimization
        if (this.options.enableQueueOptimization) {
            this.queueOptimizationTimer = setInterval(() => {
                this.optimizeQueueOrder();
                this.updateMetrics();
            }, 30000); // Every 30 seconds
        }
    }
    /**
     * Optimize queue order for better throughput
     */
    optimizeQueueOrder() {
        const pendingTasks = Array.from(this.tasks.values()).filter(t => t.status === TaskStatus.PENDING);
        // Detect and resolve potential deadlocks
        this.detectAndResolveDeadlocks(pendingTasks);
        // Optimize dependency chains
        this.optimizeDependencyChains();
        logger.debug('Queue optimization completed', {
            pendingTasks: pendingTasks.length,
            runningTasks: this.runningTasks.size
        });
    }
    /**
     * Detect circular dependencies and deadlocks
     */
    detectAndResolveDeadlocks(tasks) {
        const visited = new Set();
        const recursionStack = new Set();
        const hasCycle = (taskId) => {
            if (recursionStack.has(taskId))
                return true;
            if (visited.has(taskId))
                return false;
            visited.add(taskId);
            recursionStack.add(taskId);
            const task = this.tasks.get(taskId);
            if (task) {
                for (const depId of task.dependencies) {
                    if (hasCycle(depId))
                        return true;
                }
            }
            recursionStack.delete(taskId);
            return false;
        };
        for (const task of tasks) {
            if (hasCycle(task.id)) {
                logger.warn(`Circular dependency detected for task: ${task.title}`, { taskId: task.id });
                this.emit('deadlockDetected', task);
                // Simple resolution: remove the last dependency
                if (task.dependencies.length > 0) {
                    const removedDep = task.dependencies.pop();
                    logger.info(`Removed dependency to resolve deadlock: ${task.id} -> ${removedDep}`);
                }
            }
        }
    }
    /**
     * Optimize dependency chains for parallel execution
     */
    optimizeDependencyChains() {
        // Identify independent task groups that can run in parallel
        const taskGroups = this.identifyIndependentGroups();
        logger.debug(`Identified ${taskGroups.length} independent task groups for parallel execution`);
        this.emit('queueOptimized', {
            independentGroups: taskGroups.length,
            optimizationTime: new Date()
        });
    }
    /**
     * Identify groups of tasks that can run independently
     */
    identifyIndependentGroups() {
        const groups = [];
        const processed = new Set();
        for (const task of this.tasks.values()) {
            if (processed.has(task.id) || task.status !== TaskStatus.PENDING)
                continue;
            const group = this.getConnectedTasks(task.id, processed);
            if (group.length > 0) {
                groups.push(group);
            }
        }
        return groups;
    }
    /**
     * Get all tasks connected by dependencies
     */
    getConnectedTasks(taskId, processed) {
        if (processed.has(taskId))
            return [];
        const task = this.tasks.get(taskId);
        if (!task)
            return [];
        processed.add(taskId);
        const connected = [task];
        // Add all dependencies and dependents
        for (const depId of [...task.dependencies, ...task.dependents]) {
            connected.push(...this.getConnectedTasks(depId, processed));
        }
        return connected;
    }
    /**
     * Get task by ID
     */
    getTask(taskId) {
        return this.tasks.get(taskId);
    }
    /**
     * Get all tasks with optional filtering
     */
    getTasks(filter) {
        const tasks = Array.from(this.tasks.values());
        return filter ? tasks.filter(filter) : tasks;
    }
    /**
     * Cancel a task
     */
    async cancelTask(taskId, reason = 'User cancelled') {
        const task = this.tasks.get(taskId);
        if (!task)
            return false;
        if (task.status === TaskStatus.COMPLETED || task.status === TaskStatus.CANCELLED) {
            return false;
        }
        task.status = TaskStatus.CANCELLED;
        this.runningTasks.delete(taskId);
        logger.info(`Task cancelled: ${task.title}`, { taskId, reason });
        this.emit('taskCancelled', task, reason);
        this.updateMetrics();
        return true;
    }
    /**
     * Get current queue metrics
     */
    getMetrics() {
        this.updateMetrics();
        return { ...this.metrics };
    }
    /**
     * Clear completed and failed tasks
     */
    cleanup(olderThanMs = 24 * 60 * 60 * 1000) {
        const cutoff = Date.now() - olderThanMs;
        const toRemove = [];
        for (const [taskId, task] of this.tasks.entries()) {
            if ((task.status === TaskStatus.COMPLETED || task.status === TaskStatus.FAILED) &&
                task.completedAt && task.completedAt.getTime() < cutoff) {
                toRemove.push(taskId);
            }
        }
        for (const taskId of toRemove) {
            this.tasks.delete(taskId);
            this.completedTasks.delete(taskId);
            this.failedTasks.delete(taskId);
        }
        logger.info(`Cleaned up ${toRemove.length} old tasks`, { cutoffTime: new Date(cutoff) });
        this.updateMetrics();
    }
    /**
     * Pause the queue (stop scheduling new tasks)
     */
    pause() {
        if (this.priorityAdjustmentTimer) {
            clearInterval(this.priorityAdjustmentTimer);
            this.priorityAdjustmentTimer = undefined;
        }
        if (this.queueOptimizationTimer) {
            clearInterval(this.queueOptimizationTimer);
            this.queueOptimizationTimer = undefined;
        }
        logger.info('Task queue paused');
        this.emit('queuePaused');
    }
    /**
     * Resume the queue
     */
    resume() {
        this.startPeriodicOptimization();
        this.scheduleNextTasks();
        logger.info('Task queue resumed');
        this.emit('queueResumed');
    }
    /**
     * Shutdown the queue gracefully
     */
    async shutdown(timeoutMs = 30000) {
        logger.info('Shutting down task queue...');
        this.pause();
        // Wait for running tasks to complete
        const shutdownStart = Date.now();
        while (this.runningTasks.size > 0 && (Date.now() - shutdownStart) < timeoutMs) {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        // Cancel any remaining tasks
        for (const taskId of this.runningTasks) {
            await this.cancelTask(taskId, 'System shutdown');
        }
        this.emit('queueShutdown');
        logger.info('Task queue shutdown completed');
    }
}
//# sourceMappingURL=TaskQueue.js.map