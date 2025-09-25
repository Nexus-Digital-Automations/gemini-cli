/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { EventEmitter } from 'node:events';
import { TaskPriority, TaskStatus } from '../types/Task';
import { QueueType, QueueStatus, TaskQueue as ITaskQueue } from '../types/Queue';
/**
 * TaskQueue class - Priority-based task scheduling and queue management
 *
 * Provides intelligent task queueing with priority scheduling, dependency resolution,
 * and various queue processing strategies for optimal task execution.
 */
export class TaskQueue extends EventEmitter {
    logger;
    config;
    queueConfig;
    queue = [];
    entryMap = new Map();
    dependencies = new Map();
    queueId;
    status = QueueStatus.STOPPED;
    processingInterval = null;
    statistics;
    entryIdCounter = { current: 0 };
    isInitialized = false;
    constructor(config, logger) {
        super();
        this.config = config;
        this.logger = logger;
        this.queueId = `queue_${Date.now()}`;
        // Initialize queue configuration with defaults
        this.queueConfig = {
            maxSize: 1000,
            concurrency: 3,
            processingMode: 'parallel',
            prioritySettings: {
                enabled: true,
                levels: [
                    { name: 'critical', value: 100, weight: 10, threshold: 90, color: '#FF0000' },
                    { name: 'high', value: 80, weight: 8, threshold: 70, color: '#FF8000' },
                    { name: 'medium', value: 60, weight: 6, threshold: 50, color: '#FFFF00' },
                    { name: 'low', value: 40, weight: 4, threshold: 30, color: '#00FF00' },
                    { name: 'background', value: 20, weight: 2, threshold: 10, color: '#0080FF' }
                ],
                agingEnabled: true,
                agingRate: 1.1,
                boostSettings: {
                    enabled: true,
                    conditions: [],
                    multiplier: 1.5,
                    duration: 300000 // 5 minutes
                }
            },
            dependencySettings: {
                enabled: true,
                resolutionStrategy: 'strict',
                circularDependencyHandling: 'error',
                timeout: 300000 // 5 minutes
            },
            schedulingSettings: {
                algorithm: 'priority',
                loadBalancing: 'least_load',
                agentSelection: {
                    requiredSpecializations: [],
                    preferredSpecializations: [],
                    minCapabilityLevel: 1,
                    performanceThreshold: 0.7,
                    availabilityRequirement: 0.8,
                    customRules: []
                },
                preemption: {
                    enabled: false,
                    strategy: 'priority_based',
                    priorityThreshold: 80,
                    gracePeriod: 30000 // 30 seconds
                }
            },
            throttlingSettings: {
                enabled: false,
                rateLimit: 10,
                burstSize: 5,
                window: 60000, // 1 minute
                strategy: 'token_bucket'
            }
        };
        this.statistics = {
            currentSize: 0,
            maxSizeReached: 0,
            totalProcessed: 0,
            totalFailed: 0,
            successRate: 100,
            averageWaitTime: 0,
            averageProcessingTime: 0,
            throughput: 0,
            currentLoad: 0,
            processingRates: {
                lastMinute: 0,
                lastHour: 0,
                lastDay: 0,
                peak: 0,
                average: 0
            }
        };
        this.logger.info('TaskQueue created', { queueId: this.queueId });
    }
    /**
     * Initialize the task queue
     */
    async initialize() {
        if (this.isInitialized) {
            this.logger.warn('TaskQueue already initialized');
            return;
        }
        this.logger.info('Initializing TaskQueue');
        try {
            // Initialize queue state
            this.status = QueueStatus.ACTIVE;
            this.isInitialized = true;
            this.logger.info('TaskQueue initialized successfully', {
                queueId: this.queueId,
                maxSize: this.queueConfig.maxSize,
                concurrency: this.queueConfig.concurrency
            });
            this.emit('initialized');
        }
        catch (error) {
            this.logger.error('TaskQueue initialization failed', {
                error: error.message
            });
            throw error;
        }
    }
    /**
     * Start queue processing
     */
    async start() {
        if (!this.isInitialized) {
            throw new Error('TaskQueue not initialized');
        }
        if (this.status === QueueStatus.ACTIVE) {
            this.logger.warn('TaskQueue already running');
            return;
        }
        this.logger.info('Starting TaskQueue processing');
        this.status = QueueStatus.ACTIVE;
        // Start processing loop
        this.processingInterval = setInterval(() => this.processQueue(), 1000 // Process every second
        );
        this.emit('started');
    }
    /**
     * Stop queue processing
     */
    async stop() {
        this.logger.info('Stopping TaskQueue processing');
        this.status = QueueStatus.STOPPED;
        if (this.processingInterval) {
            clearInterval(this.processingInterval);
            this.processingInterval = null;
        }
        this.emit('stopped');
    }
    /**
     * Enqueue a task
     */
    async enqueue(task) {
        if (!this.isInitialized) {
            throw new Error('TaskQueue not initialized');
        }
        this.logger.info('Enqueuing task', {
            taskId: task.id,
            priority: task.priority,
            category: task.category
        });
        try {
            // Check queue size limit
            if (this.queue.length >= this.queueConfig.maxSize) {
                throw new Error(`Queue size limit reached: ${this.queueConfig.maxSize}`);
            }
            // Calculate priority score
            const priorityScore = this.calculatePriorityScore(task);
            // Create queue entry
            const entry = {
                id: this.generateEntryId(),
                taskId: task.id,
                priority: priorityScore,
                weight: this.calculateWeight(task),
                enqueuedAt: new Date(),
                deadline: this.calculateDeadline(task),
                dependencies: [...task.dependencies],
                metadata: {
                    source: 'task_manager',
                    createdBy: 'system',
                    tags: task.metadata.tags,
                    properties: {},
                    retryPolicy: {
                        maxRetries: 3,
                        initialDelay: 5000,
                        delayMultiplier: 2,
                        maxDelay: 30000,
                        jitterEnabled: true,
                        retryOnErrors: ['TIMEOUT', 'NETWORK_ERROR'],
                        noRetryOnErrors: ['VALIDATION_ERROR', 'PERMISSION_DENIED']
                    },
                    timeout: {
                        queueTimeout: 300000, // 5 minutes
                        executionTimeout: 600000, // 10 minutes
                        heartbeatTimeout: 60000, // 1 minute
                        idleTimeout: 120000 // 2 minutes
                    }
                },
                attempts: []
            };
            // Add to queue and maps
            this.insertIntoQueue(entry);
            this.entryMap.set(task.id, entry);
            // Update dependencies
            this.updateDependencies(task.id, task.dependencies);
            // Update statistics
            this.statistics.currentSize = this.queue.length;
            this.statistics.maxSizeReached = Math.max(this.statistics.maxSizeReached, this.queue.length);
            this.logger.info('Task enqueued successfully', {
                taskId: task.id,
                entryId: entry.id,
                queuePosition: this.queue.indexOf(entry),
                queueSize: this.queue.length
            });
            this.emit('taskEnqueued', task, entry);
        }
        catch (error) {
            this.logger.error('Failed to enqueue task', {
                taskId: task.id,
                error: error.message
            });
            throw error;
        }
    }
    /**
     * Dequeue next available task
     */
    async dequeue() {
        if (this.queue.length === 0) {
            return null;
        }
        // Find next executable entry (no pending dependencies)
        const executableEntry = this.findNextExecutableEntry();
        if (!executableEntry) {
            return null;
        }
        // Remove from queue
        const index = this.queue.indexOf(executableEntry);
        this.queue.splice(index, 1);
        this.entryMap.delete(executableEntry.taskId);
        // Update statistics
        this.statistics.currentSize = this.queue.length;
        this.logger.info('Task dequeued', {
            taskId: executableEntry.taskId,
            entryId: executableEntry.id,
            queueSize: this.queue.length
        });
        // Create task representation for execution
        const task = {
            id: executableEntry.taskId,
            // Note: In a real implementation, we'd fetch the full task from TaskManager
            // For now, creating a minimal task representation
        };
        this.emit('taskDequeued', task, executableEntry);
        return task;
    }
    /**
     * Update task status in queue
     */
    async updateTaskStatus(taskId, status) {
        const entry = this.entryMap.get(taskId);
        if (!entry) {
            return; // Task not in queue anymore
        }
        this.logger.debug('Updating task status in queue', { taskId, status });
        // If task is completed or failed, remove it from dependencies
        if (status === TaskStatus.COMPLETED || status === TaskStatus.FAILED) {
            this.removeDependency(taskId);
            // Update statistics
            this.statistics.totalProcessed++;
            if (status === TaskStatus.FAILED) {
                this.statistics.totalFailed++;
            }
            this.updateSuccessRate();
        }
    }
    /**
     * Get queue statistics
     */
    getStatistics() {
        return { ...this.statistics };
    }
    /**
     * Get queue size
     */
    size() {
        return this.queue.length;
    }
    /**
     * Check if queue is empty
     */
    isEmpty() {
        return this.queue.length === 0;
    }
    /**
     * Get queue status
     */
    getStatus() {
        return this.status;
    }
    /**
     * Private helper methods
     */
    async processQueue() {
        if (this.status !== QueueStatus.ACTIVE || this.queue.length === 0) {
            return;
        }
        try {
            // Age priorities
            if (this.queueConfig.prioritySettings.agingEnabled) {
                this.agePriorities();
            }
            // Re-sort queue by priority
            this.sortQueue();
            // Process queue based on configuration
            await this.processQueueEntries();
            // Update metrics
            this.updateMetrics();
        }
        catch (error) {
            this.logger.error('Queue processing error', {
                error: error.message
            });
        }
    }
    async processQueueEntries() {
        const maxConcurrency = this.queueConfig.concurrency;
        let processedCount = 0;
        while (processedCount < maxConcurrency && this.queue.length > 0) {
            const task = await this.dequeue();
            if (task) {
                // Emit for TaskManager to handle execution
                this.emit('taskReady', task);
                processedCount++;
            }
            else {
                break; // No executable tasks available
            }
        }
    }
    findNextExecutableEntry() {
        // Find entry with no pending dependencies
        for (const entry of this.queue) {
            if (this.areDependenciesResolved(entry.taskId)) {
                return entry;
            }
        }
        return null;
    }
    areDependenciesResolved(taskId) {
        const dependencies = this.dependencies.get(taskId);
        if (!dependencies || dependencies.size === 0) {
            return true;
        }
        // Check if all dependencies are resolved
        // In a real implementation, this would check task completion status
        return dependencies.size === 0;
    }
    insertIntoQueue(entry) {
        // Insert based on priority (higher priority first)
        let insertIndex = this.queue.length;
        for (let i = 0; i < this.queue.length; i++) {
            if (entry.priority > this.queue[i].priority) {
                insertIndex = i;
                break;
            }
        }
        this.queue.splice(insertIndex, 0, entry);
    }
    sortQueue() {
        this.queue.sort((a, b) => {
            // Primary sort by priority (higher first)
            if (a.priority !== b.priority) {
                return b.priority - a.priority;
            }
            // Secondary sort by enqueue time (earlier first)
            return a.enqueuedAt.getTime() - b.enqueuedAt.getTime();
        });
    }
    calculatePriorityScore(task) {
        const priorityLevels = this.queueConfig.prioritySettings.levels;
        const level = priorityLevels.find(l => l.name === task.priority);
        if (!level) {
            return 50; // Default priority
        }
        let score = level.value;
        // Apply category modifiers
        const categoryModifiers = {
            'security': 1.2,
            'bug-fix': 1.1,
            'performance': 1.05,
            'feature': 1.0,
            'enhancement': 0.95,
            'documentation': 0.8,
            'maintenance': 0.7
        };
        const modifier = categoryModifiers[task.category] || 1.0;
        score *= modifier;
        return Math.round(score);
    }
    calculateWeight(task) {
        // Weight based on estimated effort and complexity
        const effortWeight = Math.min(task.estimatedEffort / 60, 10); // Cap at 10
        const complexityWeights = {
            'trivial': 1,
            'simple': 2,
            'moderate': 4,
            'complex': 8,
            'critical': 16
        };
        const complexityWeight = complexityWeights[task.complexity] || 4;
        return effortWeight * complexityWeight;
    }
    calculateDeadline(task) {
        // Calculate deadline based on priority and estimated effort
        const now = new Date();
        const priorityDeadlines = {
            'critical': 2 * 60 * 60 * 1000, // 2 hours
            'high': 8 * 60 * 60 * 1000, // 8 hours
            'medium': 24 * 60 * 60 * 1000, // 24 hours
            'low': 72 * 60 * 60 * 1000, // 3 days
            'background': 7 * 24 * 60 * 60 * 1000 // 7 days
        };
        const baseDeadline = priorityDeadlines[task.priority];
        if (!baseDeadline) {
            return undefined;
        }
        // Adjust for estimated effort
        const effortMultiplier = Math.max(1, task.estimatedEffort / 60); // At least 1x
        const adjustedDeadline = baseDeadline * effortMultiplier;
        return new Date(now.getTime() + adjustedDeadline);
    }
    agePriorities() {
        const agingRate = this.queueConfig.prioritySettings.agingRate;
        const now = Date.now();
        for (const entry of this.queue) {
            const ageMinutes = (now - entry.enqueuedAt.getTime()) / (1000 * 60);
            if (ageMinutes > 5) { // Start aging after 5 minutes
                const ageBonus = Math.floor(ageMinutes / 5) * (agingRate - 1);
                entry.priority += ageBonus;
            }
        }
    }
    updateDependencies(taskId, dependencies) {
        if (dependencies.length > 0) {
            this.dependencies.set(taskId, new Set(dependencies));
        }
    }
    removeDependency(taskId) {
        // Remove this task from all dependency sets
        for (const [dependentTaskId, deps] of this.dependencies.entries()) {
            if (deps.has(taskId)) {
                deps.delete(taskId);
                if (deps.size === 0) {
                    this.dependencies.delete(dependentTaskId);
                }
            }
        }
    }
    updateSuccessRate() {
        if (this.statistics.totalProcessed > 0) {
            const successCount = this.statistics.totalProcessed - this.statistics.totalFailed;
            this.statistics.successRate = Math.round((successCount / this.statistics.totalProcessed) * 100);
        }
    }
    updateMetrics() {
        // Update current load
        this.statistics.currentLoad = Math.round((this.queue.length / this.queueConfig.maxSize) * 100);
        // Update processing rates (simplified implementation)
        const now = Date.now();
        this.statistics.processingRates.lastMinute = this.statistics.totalProcessed;
        // Update throughput
        if (this.statistics.totalProcessed > 0) {
            const runtimeMinutes = (now - (now - 60000)) / (1000 * 60); // Simplified
            this.statistics.throughput = Math.round(this.statistics.totalProcessed / Math.max(1, runtimeMinutes));
        }
    }
    generateEntryId() {
        this.entryIdCounter.current++;
        return `entry_${Date.now()}_${this.entryIdCounter.current.toString().padStart(6, '0')}`;
    }
}
//# sourceMappingURL=TaskQueue.js.map