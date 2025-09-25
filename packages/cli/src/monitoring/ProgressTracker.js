/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { EventEmitter } from 'node:events';
import { Logger } from '../utils/logger.js';
/**
 * Progress tracking granularity levels
 */
export var ProgressGranularity;
(function (ProgressGranularity) {
    ProgressGranularity["TASK"] = "task";
    ProgressGranularity["SUBTASK"] = "subtask";
    ProgressGranularity["OPERATION"] = "operation";
    ProgressGranularity["MILESTONE"] = "milestone";
})(ProgressGranularity || (ProgressGranularity = {}));
/**
 * Progress tracking event types
 */
export var ProgressEventType;
(function (ProgressEventType) {
    ProgressEventType["CHECKPOINT_ADDED"] = "checkpoint:added";
    ProgressEventType["PROGRESS_UPDATED"] = "progress:updated";
    ProgressEventType["MILESTONE_REACHED"] = "milestone:reached";
    ProgressEventType["BOTTLENECK_DETECTED"] = "bottleneck:detected";
    ProgressEventType["TIME_OVERRUN"] = "time:overrun";
    ProgressEventType["VELOCITY_CHANGED"] = "velocity:changed";
})(ProgressEventType || (ProgressEventType = {}));
/**
 * Progress Tracker - Advanced progress tracking with detailed metrics
 *
 * Provides comprehensive progress tracking capabilities including:
 * - Hierarchical progress checkpoints
 * - Real-time velocity and trend analysis
 * - Bottleneck detection and time overrun alerts
 * - Predictive time estimation
 * - Performance pattern analysis
 */
export class ProgressTracker extends EventEmitter {
    logger;
    checkpoints;
    taskConfigs;
    taskMetrics;
    velocityHistory;
    timeEstimateCache;
    monitoringInterval;
    constructor() {
        super();
        this.logger = new Logger('ProgressTracker');
        this.checkpoints = new Map();
        this.taskConfigs = new Map();
        this.taskMetrics = new Map();
        this.velocityHistory = new Map();
        this.timeEstimateCache = new Map();
        this.setupPeriodicAnalysis();
        this.logger.info('ProgressTracker initialized');
    }
    /**
     * Initialize progress tracking for a task
     */
    async initializeTaskTracking(taskId, config = {}) {
        const fullConfig = {
            taskId,
            enableDetailedTracking: true,
            enableTimeEstimation: true,
            enableBottleneckDetection: true,
            checkpointThreshold: 1, // 1% progress change
            velocityWindowSize: 10,
            alertThresholds: {
                slowProgress: 0.5, // progress points per minute
                timeOverrun: 20, // 20% over estimate
                blockingDuration: 5, // 5 minutes
            },
            ...config,
        };
        this.taskConfigs.set(taskId, fullConfig);
        this.velocityHistory.set(taskId, []);
        // Initialize metrics
        const metrics = {
            taskId,
            overallProgress: 0,
            estimatedTimeRemaining: 0,
            actualTimeElapsed: 0,
            estimatedTotalTime: 0,
            velocity: 0,
            efficiency: 1,
            checkpoints: {
                completed: 0,
                total: 0,
                milestones: [],
            },
            trends: {
                velocityTrend: [],
                progressTrend: [],
                timeEstimateAccuracy: 100,
            },
            bottlenecks: {
                slowestOperations: [],
                blockingIssues: [],
                timeOverruns: [],
            },
        };
        this.taskMetrics.set(taskId, metrics);
        this.emit(ProgressEventType.PROGRESS_UPDATED, { taskId, metrics });
        this.logger.info('Task progress tracking initialized', {
            taskId,
            config: fullConfig,
        });
    }
    /**
     * Add a progress checkpoint
     */
    async addCheckpoint(taskId, checkpoint) {
        const config = this.taskConfigs.get(taskId);
        if (!config) {
            throw new Error(`Task ${taskId} not initialized for progress tracking`);
        }
        const checkpointId = this.generateCheckpointId();
        const fullCheckpoint = {
            ...checkpoint,
            id: checkpointId,
            taskId,
            timestamp: new Date(),
        };
        this.checkpoints.set(checkpointId, fullCheckpoint);
        // Update task metrics
        await this.updateTaskMetrics(taskId, fullCheckpoint);
        // Check for milestones
        if (checkpoint.granularity === ProgressGranularity.MILESTONE) {
            this.emit(ProgressEventType.MILESTONE_REACHED, {
                taskId,
                checkpoint: fullCheckpoint,
            });
        }
        this.emit(ProgressEventType.CHECKPOINT_ADDED, {
            taskId,
            checkpoint: fullCheckpoint,
        });
        this.logger.debug('Progress checkpoint added', {
            taskId,
            checkpointId,
            name: checkpoint.name,
            progress: checkpoint.progress,
            granularity: checkpoint.granularity,
        });
        return checkpointId;
    }
    /**
     * Update progress for a specific checkpoint
     */
    async updateCheckpointProgress(checkpointId, progress, metadata = {}) {
        const checkpoint = this.checkpoints.get(checkpointId);
        if (!checkpoint) {
            throw new Error(`Checkpoint ${checkpointId} not found`);
        }
        const config = this.taskConfigs.get(checkpoint.taskId);
        if (!config)
            return;
        const progressDelta = Math.abs(progress - checkpoint.progress);
        if (progressDelta < config.checkpointThreshold) {
            return; // Skip minor progress changes
        }
        const previousProgress = checkpoint.progress;
        checkpoint.progress = Math.max(0, Math.min(100, progress));
        checkpoint.timestamp = new Date();
        checkpoint.metadata = { ...checkpoint.metadata, ...metadata };
        // Calculate duration if this checkpoint had a previous update
        if (previousProgress < checkpoint.progress) {
            const duration = Date.now() - checkpoint.timestamp.getTime();
            if (checkpoint.duration) {
                checkpoint.duration = (checkpoint.duration + duration) / 2; // Moving average
            }
            else {
                checkpoint.duration = duration;
            }
        }
        // Update task metrics
        await this.updateTaskMetrics(checkpoint.taskId, checkpoint);
        this.emit(ProgressEventType.PROGRESS_UPDATED, {
            taskId: checkpoint.taskId,
            checkpoint,
            previousProgress,
        });
        this.logger.debug('Checkpoint progress updated', {
            checkpointId,
            taskId: checkpoint.taskId,
            progress,
            progressDelta,
        });
    }
    /**
     * Get comprehensive progress metrics for a task
     */
    getTaskProgressMetrics(taskId) {
        return this.taskMetrics.get(taskId);
    }
    /**
     * Get all checkpoints for a task
     */
    getTaskCheckpoints(taskId, filters) {
        let checkpoints = Array.from(this.checkpoints.values())
            .filter(checkpoint => checkpoint.taskId === taskId);
        if (filters) {
            if (filters.granularity) {
                checkpoints = checkpoints.filter(checkpoint => checkpoint.granularity === filters.granularity);
            }
            if (filters.completed !== undefined) {
                checkpoints = checkpoints.filter(checkpoint => (checkpoint.progress === 100) === filters.completed);
            }
            if (filters.since) {
                checkpoints = checkpoints.filter(checkpoint => checkpoint.timestamp >= filters.since);
            }
        }
        return checkpoints.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    }
    /**
     * Get velocity history for a task
     */
    getVelocityHistory(taskId) {
        return this.velocityHistory.get(taskId) || [];
    }
    /**
     * Predict completion time based on current velocity
     */
    predictCompletionTime(taskId) {
        const metrics = this.taskMetrics.get(taskId);
        if (!metrics || metrics.velocity <= 0)
            return null;
        const remainingProgress = 100 - metrics.overallProgress;
        const estimatedMinutes = remainingProgress / metrics.velocity;
        const estimatedCompletion = new Date(Date.now() + estimatedMinutes * 60 * 1000);
        // Calculate confidence based on velocity trend stability
        const velocityTrend = metrics.trends.velocityTrend;
        const velocityVariance = this.calculateVariance(velocityTrend);
        const confidence = Math.max(0, Math.min(100, 100 - velocityVariance * 10));
        return {
            estimatedCompletion,
            confidence,
            basedOnVelocity: metrics.velocity,
        };
    }
    /**
     * Detect and analyze bottlenecks
     */
    analyzeBottlenecks(taskId) {
        const config = this.taskConfigs.get(taskId);
        const metrics = this.taskMetrics.get(taskId);
        if (!config || !metrics) {
            return { bottlenecks: [], recommendations: [], severity: 'low' };
        }
        const checkpoints = this.getTaskCheckpoints(taskId);
        const bottlenecks = [];
        const recommendations = [];
        // Identify slow operations
        const avgDuration = this.calculateAverageDuration(checkpoints);
        const slowCheckpoints = checkpoints.filter(checkpoint => checkpoint.duration &&
            checkpoint.duration > avgDuration * 2 &&
            checkpoint.progress < 100);
        bottlenecks.push(...slowCheckpoints);
        // Identify stalled checkpoints
        const now = Date.now();
        const stalledCheckpoints = checkpoints.filter(checkpoint => checkpoint.progress < 100 &&
            now - checkpoint.timestamp.getTime() > config.alertThresholds.blockingDuration * 60 * 1000);
        bottlenecks.push(...stalledCheckpoints);
        // Generate recommendations
        if (metrics.velocity < config.alertThresholds.slowProgress) {
            recommendations.push('Consider breaking down complex operations into smaller checkpoints');
            recommendations.push('Review resource allocation and remove potential blockers');
        }
        if (slowCheckpoints.length > 0) {
            recommendations.push(`Optimize slow operations: ${slowCheckpoints.map(c => c.name).join(', ')}`);
        }
        if (stalledCheckpoints.length > 0) {
            recommendations.push(`Address stalled operations: ${stalledCheckpoints.map(c => c.name).join(', ')}`);
        }
        const severity = bottlenecks.length > 3 ? 'high' : bottlenecks.length > 1 ? 'medium' : 'low';
        if (bottlenecks.length > 0) {
            this.emit(ProgressEventType.BOTTLENECK_DETECTED, {
                taskId,
                bottlenecks,
                recommendations,
                severity,
            });
        }
        return { bottlenecks, recommendations, severity };
    }
    /**
     * Get system-wide progress analytics
     */
    getSystemAnalytics() {
        const metrics = Array.from(this.taskMetrics.values());
        const totalTasks = metrics.length;
        const activelyTracked = metrics.filter(m => m.overallProgress < 100).length;
        const velocities = metrics.map(m => m.velocity).filter(v => v > 0);
        const averageVelocity = velocities.length > 0
            ? velocities.reduce((a, b) => a + b) / velocities.length
            : 0;
        const efficiencies = metrics.map(m => m.efficiency).filter(e => e > 0);
        const systemEfficiency = efficiencies.length > 0
            ? efficiencies.reduce((a, b) => a + b) / efficiencies.length
            : 1;
        // Analyze common bottlenecks
        const allBottlenecks = metrics.flatMap(m => m.bottlenecks.slowestOperations);
        const bottleneckCounts = new Map();
        allBottlenecks.forEach(checkpoint => {
            const key = checkpoint.granularity;
            bottleneckCounts.set(key, (bottleneckCounts.get(key) || 0) + 1);
        });
        const commonBottlenecks = Array.from(bottleneckCounts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([type]) => type);
        // Performance distribution
        const fastTasks = velocities.filter(v => v > averageVelocity * 1.5).length;
        const slowTasks = velocities.filter(v => v < averageVelocity * 0.5).length;
        const normalTasks = velocities.length - fastTasks - slowTasks;
        return {
            totalTasks,
            activelyTracked,
            averageVelocity,
            systemEfficiency,
            commonBottlenecks,
            performanceDistribution: {
                fast: fastTasks,
                normal: normalTasks,
                slow: slowTasks,
            },
        };
    }
    // Private methods
    async updateTaskMetrics(taskId, checkpoint) {
        const config = this.taskConfigs.get(taskId);
        const metrics = this.taskMetrics.get(taskId);
        if (!config || !metrics)
            return;
        // Update overall progress
        const taskCheckpoints = this.getTaskCheckpoints(taskId);
        const totalProgress = taskCheckpoints.reduce((sum, cp) => sum + cp.progress, 0);
        metrics.overallProgress = taskCheckpoints.length > 0
            ? Math.min(100, totalProgress / taskCheckpoints.length)
            : 0;
        // Update checkpoint counts
        metrics.checkpoints.completed = taskCheckpoints.filter(cp => cp.progress === 100).length;
        metrics.checkpoints.total = taskCheckpoints.length;
        metrics.checkpoints.milestones = taskCheckpoints.filter(cp => cp.granularity === ProgressGranularity.MILESTONE);
        // Calculate velocity
        await this.updateVelocity(taskId, metrics);
        // Update time estimates
        if (config.enableTimeEstimation) {
            this.updateTimeEstimates(taskId, metrics);
        }
        // Detect bottlenecks
        if (config.enableBottleneckDetection) {
            const bottleneckAnalysis = this.analyzeBottlenecks(taskId);
            metrics.bottlenecks = {
                slowestOperations: bottleneckAnalysis.bottlenecks.slice(0, 5),
                blockingIssues: bottleneckAnalysis.recommendations,
                timeOverruns: taskCheckpoints.filter(cp => cp.duration && cp.duration > (this.timeEstimateCache.get(cp.id) || 0) * 1.2),
            };
        }
        // Update trends
        this.updateTrends(taskId, metrics);
        this.taskMetrics.set(taskId, metrics);
    }
    async updateVelocity(taskId, metrics) {
        const config = this.taskConfigs.get(taskId);
        if (!config)
            return;
        const now = new Date();
        const velocityHistory = this.velocityHistory.get(taskId) || [];
        // Calculate current velocity (progress points per minute)
        const recentCheckpoints = this.getTaskCheckpoints(taskId, {
            since: new Date(Date.now() - 10 * 60 * 1000) // last 10 minutes
        });
        if (recentCheckpoints.length >= 2) {
            const timeSpan = recentCheckpoints[0].timestamp.getTime() -
                recentCheckpoints[recentCheckpoints.length - 1].timestamp.getTime();
            const progressSpan = recentCheckpoints[0].progress -
                recentCheckpoints[recentCheckpoints.length - 1].progress;
            const velocity = timeSpan > 0 ? (progressSpan / (timeSpan / (1000 * 60))) : 0;
            velocityHistory.push({ timestamp: now, velocity });
            // Keep only last N measurements
            if (velocityHistory.length > config.velocityWindowSize) {
                velocityHistory.shift();
            }
            this.velocityHistory.set(taskId, velocityHistory);
            // Update metrics
            const recentVelocities = velocityHistory.slice(-5).map(v => v.velocity);
            metrics.velocity = recentVelocities.length > 0
                ? recentVelocities.reduce((a, b) => a + b) / recentVelocities.length
                : 0;
            // Check for velocity changes
            if (velocityHistory.length >= 2) {
                const previousVelocity = velocityHistory[velocityHistory.length - 2].velocity;
                const velocityChange = Math.abs(velocity - previousVelocity) / Math.max(previousVelocity, 1);
                if (velocityChange > 0.2) { // 20% change threshold
                    this.emit(ProgressEventType.VELOCITY_CHANGED, {
                        taskId,
                        previousVelocity,
                        currentVelocity: velocity,
                        changePercent: velocityChange,
                    });
                }
            }
        }
    }
    updateTimeEstimates(taskId, metrics) {
        const checkpoints = this.getTaskCheckpoints(taskId);
        const completedCheckpoints = checkpoints.filter(cp => cp.progress === 100);
        if (completedCheckpoints.length > 0) {
            const totalActualTime = completedCheckpoints.reduce((sum, cp) => sum + (cp.duration || 0), 0);
            metrics.actualTimeElapsed = totalActualTime;
            // Estimate remaining time based on velocity
            if (metrics.velocity > 0) {
                const remainingProgress = 100 - metrics.overallProgress;
                metrics.estimatedTimeRemaining = remainingProgress / metrics.velocity * 60 * 1000; // milliseconds
                metrics.estimatedTotalTime = metrics.actualTimeElapsed + metrics.estimatedTimeRemaining;
            }
            // Calculate efficiency
            if (metrics.estimatedTotalTime > 0) {
                metrics.efficiency = Math.min(2, metrics.estimatedTotalTime / metrics.actualTimeElapsed);
            }
            // Check for time overruns
            const config = this.taskConfigs.get(taskId);
            if (config && metrics.actualTimeElapsed > metrics.estimatedTotalTime * (1 + config.alertThresholds.timeOverrun / 100)) {
                this.emit(ProgressEventType.TIME_OVERRUN, {
                    taskId,
                    actualTime: metrics.actualTimeElapsed,
                    estimatedTime: metrics.estimatedTotalTime,
                    overrunPercent: ((metrics.actualTimeElapsed - metrics.estimatedTotalTime) / metrics.estimatedTotalTime) * 100,
                });
            }
        }
    }
    updateTrends(taskId, metrics) {
        const velocityHistory = this.velocityHistory.get(taskId) || [];
        // Update velocity trend
        metrics.trends.velocityTrend = velocityHistory
            .slice(-10)
            .map(v => v.velocity);
        // Update progress trend
        const recentCheckpoints = this.getTaskCheckpoints(taskId).slice(0, 10);
        metrics.trends.progressTrend = recentCheckpoints.map(cp => cp.progress);
        // Update time estimate accuracy
        if (metrics.estimatedTotalTime > 0 && metrics.actualTimeElapsed > 0) {
            const accuracy = Math.min(100, (metrics.estimatedTotalTime / metrics.actualTimeElapsed) * 100);
            metrics.trends.timeEstimateAccuracy = accuracy;
        }
    }
    calculateVariance(numbers) {
        if (numbers.length < 2)
            return 0;
        const mean = numbers.reduce((a, b) => a + b) / numbers.length;
        const variance = numbers.reduce((sum, num) => sum + Math.pow(num - mean, 2), 0) / numbers.length;
        return Math.sqrt(variance);
    }
    calculateAverageDuration(checkpoints) {
        const durationsWithValues = checkpoints
            .map(cp => cp.duration)
            .filter((duration) => duration !== undefined);
        return durationsWithValues.length > 0
            ? durationsWithValues.reduce((a, b) => a + b) / durationsWithValues.length
            : 0;
    }
    generateCheckpointId() {
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 8);
        return `checkpoint_${timestamp}_${randomString}`;
    }
    setupPeriodicAnalysis() {
        // Run analysis every 2 minutes
        this.monitoringInterval = setInterval(() => {
            this.performPeriodicAnalysis();
        }, 2 * 60 * 1000);
    }
    async performPeriodicAnalysis() {
        try {
            for (const taskId of this.taskConfigs.keys()) {
                const metrics = this.taskMetrics.get(taskId);
                if (!metrics || metrics.overallProgress >= 100)
                    continue;
                // Update metrics
                const dummyCheckpoint = {
                    id: 'periodic',
                    taskId,
                    name: 'periodic-update',
                    description: 'Periodic metrics update',
                    granularity: ProgressGranularity.OPERATION,
                    progress: metrics.overallProgress,
                    timestamp: new Date(),
                    metadata: {},
                };
                await this.updateTaskMetrics(taskId, dummyCheckpoint);
            }
        }
        catch (error) {
            this.logger.error('Periodic analysis failed', { error });
        }
    }
    /**
     * Cleanup resources
     */
    destroy() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
        }
        this.removeAllListeners();
        this.checkpoints.clear();
        this.taskConfigs.clear();
        this.taskMetrics.clear();
        this.velocityHistory.clear();
        this.timeEstimateCache.clear();
        this.logger.info('ProgressTracker destroyed');
    }
}
/**
 * Singleton instance for global access
 */
export const progressTracker = new ProgressTracker();
//# sourceMappingURL=ProgressTracker.js.map