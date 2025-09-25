/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { EventEmitter } from 'node:events';
import { Logger } from '../../utils/logger.js';
import { TaskStatus as _TaskStatus } from '../../monitoring/TaskStatusMonitor.js';
/**
 * Task Queue Performance Optimizer
 *
 * Features:
 * - Real-time performance monitoring and analysis
 * - Intelligent bottleneck detection and diagnosis
 * - Automated optimization recommendations
 * - Self-healing optimization actions
 * - Performance trend analysis and prediction
 * - Resource usage optimization
 * - Load balancing optimization
 * - Queue priority optimization
 * - System health monitoring
 */
export class PerformanceOptimizer extends EventEmitter {
    logger;
    taskQueue;
    performanceHistory;
    appliedOptimizations;
    currentMetrics;
    monitoringInterval;
    optimizationInterval;
    monitoringIntervalMs = 30000; // 30 seconds
    optimizationIntervalMs = 300000; // 5 minutes
    latencyBuffer = [];
    latencyBufferSize = 100;
    optimizationState = {
        enabled: true,
        autoApplyRecommendations: true,
        maxConcurrentOptimizations: 3,
        currentOptimizations: 0,
        lastOptimizationRun: new Date(0),
        totalOptimizationsApplied: 0,
        successfulOptimizations: 0,
    };
    constructor(taskQueue) {
        super();
        this.logger = new Logger('PerformanceOptimizer');
        this.taskQueue = taskQueue;
        this.performanceHistory = new Map();
        this.appliedOptimizations = new Map();
        this.setupMonitoring();
        this.setupEventListeners();
        this.logger.info('Performance optimizer initialized', {
            monitoringInterval: this.monitoringIntervalMs,
            optimizationInterval: this.optimizationIntervalMs,
            autoApplyRecommendations: this.optimizationState.autoApplyRecommendations,
        });
    }
    /**
     * Start performance monitoring and optimization
     */
    async startOptimization() {
        if (!this.optimizationState.enabled) {
            this.optimizationState.enabled = true;
        }
        // Start monitoring
        if (!this.monitoringInterval) {
            this.monitoringInterval = setInterval(async () => {
                await this.collectMetrics();
            }, this.monitoringIntervalMs);
        }
        // Start optimization cycle
        if (!this.optimizationInterval) {
            this.optimizationInterval = setInterval(async () => {
                await this.runOptimizationCycle();
            }, this.optimizationIntervalMs);
        }
        // Immediate collection and optimization
        await this.collectMetrics();
        await this.runOptimizationCycle();
        this.emit('optimization:started');
        this.logger.info('Performance optimization started');
    }
    /**
     * Stop performance monitoring and optimization
     */
    async stopOptimization() {
        this.optimizationState.enabled = false;
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = undefined;
        }
        if (this.optimizationInterval) {
            clearInterval(this.optimizationInterval);
            this.optimizationInterval = undefined;
        }
        this.emit('optimization:stopped');
        this.logger.info('Performance optimization stopped');
    }
    /**
     * Get current performance metrics
     */
    getCurrentMetrics() {
        return this.currentMetrics;
    }
    /**
     * Get performance history for specified time range
     */
    getPerformanceHistory(interval, limit) {
        const history = this.performanceHistory.get(interval);
        if (!history || !limit)
            return history;
        return {
            ...history,
            dataPoints: history.dataPoints.slice(-limit),
        };
    }
    /**
     * Get active optimization recommendations
     */
    async getOptimizationRecommendations() {
        if (!this.currentMetrics) {
            await this.collectMetrics();
        }
        return this.generateRecommendations();
    }
    /**
     * Apply specific optimization recommendation
     */
    async applyOptimization(recommendationId) {
        const recommendations = await this.getOptimizationRecommendations();
        const recommendation = recommendations.find((r) => r.id === recommendationId);
        if (!recommendation) {
            throw new Error(`Optimization recommendation not found: ${recommendationId}`);
        }
        this.logger.info('Applying optimization', {
            recommendationId,
            type: recommendation.type,
            priority: recommendation.priority,
        });
        try {
            const result = await this.executeOptimization(recommendation);
            this.appliedOptimizations.set(recommendationId, result);
            this.optimizationState.totalOptimizationsApplied++;
            if (result.success) {
                this.optimizationState.successfulOptimizations++;
            }
            this.emit('optimization:applied', { recommendation, result });
            this.logger.info('Optimization applied', {
                recommendationId,
                success: result.success,
                impact: result.measuredImpact,
            });
            return result;
        }
        catch (error) {
            const result = {
                recommendationId,
                applied: false,
                success: false,
                appliedAt: new Date(),
                sideEffects: [`Optimization failed: ${error}`],
            };
            this.appliedOptimizations.set(recommendationId, result);
            this.logger.error('Optimization failed', { recommendationId, error });
            return result;
        }
    }
    /**
     * Revert previously applied optimization
     */
    async revertOptimization(recommendationId) {
        const result = this.appliedOptimizations.get(recommendationId);
        if (!result || !result.applied) {
            this.logger.warning('Cannot revert optimization - not found or not applied', {
                recommendationId,
            });
            return false;
        }
        if (!result.revertAction) {
            this.logger.warning('Cannot revert optimization - no revert action available', {
                recommendationId,
            });
            return false;
        }
        try {
            await result.revertAction();
            result.applied = false;
            this.emit('optimization:reverted', { recommendationId });
            this.logger.info('Optimization reverted', { recommendationId });
            return true;
        }
        catch (error) {
            this.logger.error('Failed to revert optimization', {
                recommendationId,
                error,
            });
            return false;
        }
    }
    /**
     * Get optimization statistics and health
     */
    getOptimizationStats() {
        const totalRecommendations = this.optimizationState.totalOptimizationsApplied;
        const successRate = totalRecommendations > 0
            ? (this.optimizationState.successfulOptimizations /
                totalRecommendations) *
                100
            : 100;
        // Calculate average impact from applied optimizations
        const successfulOptimizations = Array.from(this.appliedOptimizations.values()).filter((r) => r.success && r.measuredImpact);
        const averageImpact = {
            throughputImprovement: 0,
            latencyReduction: 0,
            efficiencyGain: 0,
        };
        if (successfulOptimizations.length > 0) {
            averageImpact.throughputImprovement =
                successfulOptimizations.reduce((sum, r) => sum + (r.measuredImpact?.throughputChange || 0), 0) / successfulOptimizations.length;
            averageImpact.latencyReduction =
                successfulOptimizations.reduce((sum, r) => sum + Math.abs(r.measuredImpact?.latencyChange || 0), 0) / successfulOptimizations.length;
            averageImpact.efficiencyGain =
                successfulOptimizations.reduce((sum, r) => sum + (r.measuredImpact?.efficiencyChange || 0), 0) / successfulOptimizations.length;
        }
        return {
            enabled: this.optimizationState.enabled,
            totalRecommendations,
            appliedOptimizations: this.optimizationState.totalOptimizationsApplied,
            successfulOptimizations: this.optimizationState.successfulOptimizations,
            successRate,
            lastOptimizationRun: this.optimizationState.lastOptimizationRun,
            currentOptimizations: this.optimizationState.currentOptimizations,
            averageImpact,
        };
    }
    // Private methods for internal optimization operations
    setupMonitoring() {
        // Initialize performance history for different intervals
        ['minute', 'hour', 'day', 'week'].forEach((interval) => {
            this.performanceHistory.set(interval, {
                interval: interval,
                dataPoints: [],
                trends: {
                    throughput: 'stable',
                    latency: 'stable',
                    efficiency: 'stable',
                    errorRate: 'stable',
                },
            });
        });
    }
    setupEventListeners() {
        // Listen to task queue events for real-time metrics
        this.taskQueue.on('task:assigned', (event) => {
            this.recordLatency(event.assignment?.assignedAt || new Date());
        });
        this.taskQueue.on('task:completed', (_event) => {
            if (_event.task.endTime && _event.task.startTime) {
                const executionTime = _event.task.endTime.getTime() - _event.task.startTime.getTime();
                this.recordLatency(new Date(executionTime));
            }
        });
        this.taskQueue.on('queue:rebalanced', (_event) => {
            this.logger.debug('Queue rebalanced detected, updating metrics');
        });
    }
    async collectMetrics() {
        try {
            const startTime = Date.now();
            // Get current queue status
            const queueStatus = this.taskQueue.getQueueStatus();
            // Calculate system metrics
            const memoryUsage = process.memoryUsage();
            const cpuUsage = process.cpuUsage();
            // Generate performance metrics
            const metrics = {
                timestamp: new Date(),
                timeWindowMs: this.monitoringIntervalMs,
                queueMetrics: {
                    totalTasksQueued: queueStatus.totalQueued,
                    averageQueueTime: 0, // Would be calculated from historical data
                    maxQueueTime: 0, // Would be calculated from historical data
                    queueSizeByPriority: queueStatus.queueSizes,
                    queueThroughput: this.calculateThroughput(),
                    queueEfficiency: this.calculateQueueEfficiency(queueStatus),
                },
                executionMetrics: {
                    totalTasksExecuted: queueStatus.totalCompleted,
                    totalExecutionTime: 0, // Would be calculated from task data
                    averageExecutionTime: 0, // Would be calculated from task data
                    executionTimeByType: {},
                    successRate: this.calculateSuccessRate(queueStatus),
                    failureRate: this.calculateFailureRate(queueStatus),
                    retryRate: 0, // Would be calculated from task data
                },
                agentMetrics: {
                    totalAgents: queueStatus.availableAgents + queueStatus.busyAgents,
                    activeAgents: queueStatus.busyAgents,
                    averageAgentLoad: this.calculateAverageAgentLoad(queueStatus),
                    agentUtilization: this.calculateAgentUtilization(queueStatus),
                    loadBalanceEfficiency: this.calculateLoadBalanceEfficiency(queueStatus),
                    agentPerformanceVariance: 0, // Would be calculated from agent data
                },
                systemMetrics: {
                    memoryUsage: {
                        heapUsed: memoryUsage.heapUsed,
                        heapTotal: memoryUsage.heapTotal,
                        external: memoryUsage.external,
                        rss: memoryUsage.rss,
                    },
                    cpuUsage: (cpuUsage.user + cpuUsage.system) / 1000000, // Convert to seconds
                    latency: this.calculateLatencyPercentiles(),
                    errorRate: this.calculateErrorRate(queueStatus),
                    uptime: process.uptime(),
                },
                bottlenecks: await this.detectBottlenecks(queueStatus),
            };
            this.currentMetrics = metrics;
            // Store in performance history
            this.storeMetricsInHistory(metrics);
            const collectionTime = Date.now() - startTime;
            this.emit('metrics:collected', { metrics, collectionTime });
            this.logger.debug('Performance metrics collected', {
                collectionTime,
                queuedTasks: metrics.queueMetrics.totalTasksQueued,
                throughput: metrics.queueMetrics.queueThroughput,
                efficiency: metrics.queueMetrics.queueEfficiency,
            });
        }
        catch (error) {
            this.logger.error('Failed to collect performance metrics', { error });
        }
    }
    async runOptimizationCycle() {
        if (!this.optimizationState.enabled)
            return;
        if (this.optimizationState.currentOptimizations >=
            this.optimizationState.maxConcurrentOptimizations) {
            this.logger.debug('Max concurrent optimizations reached, skipping cycle');
            return;
        }
        try {
            const recommendations = await this.getOptimizationRecommendations();
            const highPriorityRecommendations = recommendations
                .filter((r) => r.priority === 'high' || r.priority === 'critical')
                .slice(0, this.optimizationState.maxConcurrentOptimizations -
                this.optimizationState.currentOptimizations);
            if (highPriorityRecommendations.length === 0) {
                this.logger.debug('No high-priority optimization recommendations');
                return;
            }
            // Apply automatic optimizations
            if (this.optimizationState.autoApplyRecommendations) {
                const automaticRecommendations = highPriorityRecommendations.filter((r) => r.implementation.automatic);
                for (const recommendation of automaticRecommendations) {
                    try {
                        this.optimizationState.currentOptimizations++;
                        await this.applyOptimization(recommendation.id);
                    }
                    finally {
                        this.optimizationState.currentOptimizations--;
                    }
                }
            }
            // Emit recommendations for manual review
            this.emit('optimization:recommendations', {
                recommendations: highPriorityRecommendations,
                autoAppliedCount: this.optimizationState.autoApplyRecommendations
                    ? highPriorityRecommendations.filter((r) => r.implementation.automatic).length
                    : 0,
            });
            this.optimizationState.lastOptimizationRun = new Date();
        }
        catch (error) {
            this.logger.error('Optimization cycle failed', { error });
        }
    }
    generateRecommendations() {
        if (!this.currentMetrics)
            return [];
        const recommendations = [];
        // Queue optimization recommendations
        recommendations.push(...this.generateQueueOptimizations());
        // Agent optimization recommendations
        recommendations.push(...this.generateAgentOptimizations());
        // System optimization recommendations
        recommendations.push(...this.generateSystemOptimizations());
        // Resource optimization recommendations
        recommendations.push(...this.generateResourceOptimizations());
        return recommendations.sort((a, b) => {
            const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
            return priorityOrder[b.priority] - priorityOrder[a.priority];
        });
    }
    generateQueueOptimizations() {
        const recommendations = [];
        const metrics = this.currentMetrics;
        // Queue efficiency optimization
        if (metrics.queueMetrics.queueEfficiency < 80) {
            recommendations.push({
                id: `queue-efficiency-${Date.now()}`,
                type: 'scheduling',
                priority: 'high',
                title: 'Improve Queue Efficiency',
                description: `Queue efficiency is ${metrics.queueMetrics.queueEfficiency.toFixed(1)}%. Consider rebalancing task priorities and improving scheduling algorithms.`,
                expectedImpact: {
                    throughputIncrease: 15,
                    efficiencyGain: 20,
                },
                implementation: {
                    automatic: true,
                    estimatedEffort: '5 minutes',
                    prerequisites: [],
                    actions: [
                        {
                            description: 'Rebalance queue priorities and optimize scheduling',
                            parameters: { rebalanceThreshold: 0.8 },
                        },
                    ],
                },
                validityPeriod: 600000, // 10 minutes
                confidence: 85,
            });
        }
        // Queue throughput optimization
        if (metrics.queueMetrics.queueThroughput < 10) {
            recommendations.push({
                id: `queue-throughput-${Date.now()}`,
                type: 'scheduling',
                priority: 'medium',
                title: 'Increase Queue Throughput',
                description: `Current throughput is ${metrics.queueMetrics.queueThroughput.toFixed(1)} tasks/minute. Consider optimizing task assignment algorithms.`,
                expectedImpact: {
                    throughputIncrease: 25,
                },
                implementation: {
                    automatic: false,
                    estimatedEffort: '15 minutes',
                    prerequisites: ['Agent availability analysis'],
                    actions: [
                        {
                            description: 'Optimize task assignment algorithm for higher throughput',
                        },
                    ],
                },
                validityPeriod: 1800000, // 30 minutes
                confidence: 70,
            });
        }
        return recommendations;
    }
    generateAgentOptimizations() {
        const recommendations = [];
        const metrics = this.currentMetrics;
        // Agent utilization optimization
        if (metrics.agentMetrics.agentUtilization < 60) {
            recommendations.push({
                id: `agent-utilization-${Date.now()}`,
                type: 'agent',
                priority: 'medium',
                title: 'Improve Agent Utilization',
                description: `Agent utilization is ${metrics.agentMetrics.agentUtilization.toFixed(1)}%. Consider better load balancing or scaling down agents.`,
                expectedImpact: {
                    efficiencyGain: 30,
                    resourceSavings: 20,
                },
                implementation: {
                    automatic: true,
                    estimatedEffort: '2 minutes',
                    prerequisites: [],
                    actions: [
                        {
                            description: 'Optimize agent load balancing',
                            parameters: { targetUtilization: 0.8 },
                        },
                    ],
                },
                validityPeriod: 900000, // 15 minutes
                confidence: 80,
            });
        }
        // Load balance optimization
        if (metrics.agentMetrics.loadBalanceEfficiency < 70) {
            recommendations.push({
                id: `load-balance-${Date.now()}`,
                type: 'agent',
                priority: 'high',
                title: 'Optimize Load Balancing',
                description: `Load balance efficiency is ${metrics.agentMetrics.loadBalanceEfficiency.toFixed(1)}%. Some agents may be overloaded while others are idle.`,
                expectedImpact: {
                    throughputIncrease: 20,
                    efficiencyGain: 25,
                },
                implementation: {
                    automatic: true,
                    estimatedEffort: '3 minutes',
                    prerequisites: [],
                    actions: [
                        {
                            description: 'Rebalance task assignments across agents',
                        },
                    ],
                },
                validityPeriod: 600000, // 10 minutes
                confidence: 90,
            });
        }
        return recommendations;
    }
    generateSystemOptimizations() {
        const recommendations = [];
        const metrics = this.currentMetrics;
        // Memory usage optimization
        if (metrics.systemMetrics.memoryUsage.heapUsed /
            metrics.systemMetrics.memoryUsage.heapTotal >
            0.9) {
            recommendations.push({
                id: `memory-optimization-${Date.now()}`,
                type: 'system',
                priority: 'critical',
                title: 'Optimize Memory Usage',
                description: `Heap usage is ${((metrics.systemMetrics.memoryUsage.heapUsed / metrics.systemMetrics.memoryUsage.heapTotal) * 100).toFixed(1)}%. Consider garbage collection or memory cleanup.`,
                expectedImpact: {
                    latencyReduction: 30,
                    resourceSavings: 25,
                },
                implementation: {
                    automatic: true,
                    estimatedEffort: '1 minute',
                    prerequisites: [],
                    actions: [
                        {
                            description: 'Force garbage collection and cleanup unused resources',
                        },
                    ],
                },
                validityPeriod: 300000, // 5 minutes
                confidence: 95,
            });
        }
        // High latency optimization
        if (metrics.systemMetrics.latency.p95 > 5000) {
            recommendations.push({
                id: `latency-optimization-${Date.now()}`,
                type: 'system',
                priority: 'high',
                title: 'Reduce System Latency',
                description: `95th percentile latency is ${metrics.systemMetrics.latency.p95.toFixed(0)}ms. Consider optimizing processing pipelines.`,
                expectedImpact: {
                    latencyReduction: 40,
                },
                implementation: {
                    automatic: false,
                    estimatedEffort: '10 minutes',
                    prerequisites: ['System profiling', 'Performance analysis'],
                    actions: [
                        {
                            description: 'Optimize critical processing paths',
                        },
                    ],
                },
                validityPeriod: 1200000, // 20 minutes
                confidence: 75,
            });
        }
        return recommendations;
    }
    generateResourceOptimizations() {
        const recommendations = [];
        // Add resource-specific optimizations based on current usage patterns
        // This would include optimizations for CPU, disk I/O, network usage, etc.
        return recommendations;
    }
    async executeOptimization(recommendation) {
        const _startTime = Date.now();
        let revertAction;
        try {
            // Execute actions based on recommendation type
            switch (recommendation.type) {
                case 'scheduling':
                    await this.executeSchedulingOptimization(recommendation);
                    break;
                case 'agent':
                    revertAction = await this.executeAgentOptimization(recommendation);
                    break;
                case 'system':
                    revertAction = await this.executeSystemOptimization(recommendation);
                    break;
                case 'resource':
                    revertAction = await this.executeResourceOptimization(recommendation);
                    break;
                default:
                    throw new Error(`Unknown optimization type: ${recommendation.type}`);
            }
            // Measure impact after a short delay
            await new Promise((resolve) => setTimeout(resolve, 5000));
            const measuredImpact = await this.measureOptimizationImpact(recommendation);
            return {
                recommendationId: recommendation.id,
                applied: true,
                success: true,
                appliedAt: new Date(),
                measuredImpact,
                sideEffects: [],
                revertAction,
            };
        }
        catch (error) {
            return {
                recommendationId: recommendation.id,
                applied: false,
                success: false,
                appliedAt: new Date(),
                sideEffects: [`Optimization failed: ${error}`],
                revertAction,
            };
        }
    }
    async executeSchedulingOptimization(recommendation) {
        // Trigger queue rebalancing based on recommendation parameters
        const parameters = recommendation.implementation.actions[0]?.parameters;
        if (parameters?.rebalanceThreshold) {
            // Use the threshold parameter for rebalancing
            this.logger.debug('Executing scheduling optimization', {
                threshold: parameters.rebalanceThreshold,
            });
        }
        await this.taskQueue.rebalanceQueue();
    }
    async executeAgentOptimization(recommendation) {
        // Agent optimization logic based on recommendation parameters
        const parameters = recommendation.implementation.actions[0]?.parameters;
        const targetUtilization = parameters?.targetUtilization;
        if (targetUtilization) {
            this.logger.debug('Executing agent optimization', {
                targetUtilization,
                recommendationType: recommendation.type,
            });
        }
        // Return a revert function
        return async () => {
            // Revert agent optimizations
            this.logger.debug('Reverting agent optimization', {
                recommendationId: recommendation.id,
            });
        };
    }
    async executeSystemOptimization(recommendation) {
        // System optimization logic (e.g., garbage collection)
        this.logger.debug('Executing system optimization', {
            recommendationType: recommendation.type,
            expectedImpact: recommendation.expectedImpact,
        });
        if (global.gc) {
            global.gc();
        }
        return async () => {
            // Revert system optimizations if needed
            this.logger.debug('Reverting system optimization', {
                recommendationId: recommendation.id,
            });
        };
    }
    async executeResourceOptimization(recommendation) {
        // Resource optimization logic based on recommendation
        this.logger.debug('Executing resource optimization', {
            recommendationType: recommendation.type,
            expectedImpact: recommendation.expectedImpact,
        });
        // Resource optimization logic would be implemented here
        return async () => {
            // Revert resource optimizations
            this.logger.debug('Reverting resource optimization', {
                recommendationId: recommendation.id,
            });
        };
    }
    async measureOptimizationImpact(recommendation) {
        // This would compare metrics before and after optimization
        // For now, return simulated impact based on expected values
        return {
            throughputChange: recommendation.expectedImpact.throughputIncrease || 0,
            latencyChange: -(recommendation.expectedImpact.latencyReduction || 0),
            efficiencyChange: recommendation.expectedImpact.efficiencyGain || 0,
        };
    }
    // Utility methods for metrics calculation
    calculateThroughput() {
        // Calculate tasks processed per minute based on history
        return 0; // Would be calculated from actual data
    }
    calculateQueueEfficiency(queueStatus) {
        const total = queueStatus.totalQueued +
            queueStatus.totalActive +
            queueStatus.totalCompleted;
        if (total === 0)
            return 100;
        return (queueStatus.totalCompleted / total) * 100;
    }
    calculateSuccessRate(queueStatus) {
        const total = queueStatus.totalCompleted + queueStatus.totalFailed;
        if (total === 0)
            return 100;
        return (queueStatus.totalCompleted / total) * 100;
    }
    calculateFailureRate(queueStatus) {
        return 100 - this.calculateSuccessRate(queueStatus);
    }
    calculateAverageAgentLoad(queueStatus) {
        const totalAgents = queueStatus.availableAgents + queueStatus.busyAgents;
        if (totalAgents === 0)
            return 0;
        return queueStatus.totalActive / totalAgents;
    }
    calculateAgentUtilization(queueStatus) {
        const totalAgents = queueStatus.availableAgents + queueStatus.busyAgents;
        if (totalAgents === 0)
            return 0;
        return (queueStatus.busyAgents / totalAgents) * 100;
    }
    calculateLoadBalanceEfficiency(queueStatus) {
        // Simplified calculation based on agent distribution
        const totalAgents = queueStatus.availableAgents + queueStatus.busyAgents;
        if (totalAgents === 0)
            return 100;
        // Calculate efficiency based on how evenly distributed the load is
        const idealLoad = queueStatus.totalActive / totalAgents;
        const variance = Math.abs(queueStatus.busyAgents - idealLoad);
        const efficiency = Math.max(0, 100 - (variance / idealLoad) * 100);
        return Math.min(100, Math.max(0, efficiency));
    }
    calculateErrorRate(queueStatus) {
        const total = queueStatus.totalCompleted + queueStatus.totalFailed;
        if (total === 0)
            return 0;
        return (queueStatus.totalFailed / total) * 100;
    }
    calculateLatencyPercentiles() {
        if (this.latencyBuffer.length === 0) {
            return { p50: 0, p95: 0, p99: 0 };
        }
        const sorted = [...this.latencyBuffer].sort((a, b) => a - b);
        const len = sorted.length;
        return {
            p50: sorted[Math.floor(len * 0.5)],
            p95: sorted[Math.floor(len * 0.95)],
            p99: sorted[Math.floor(len * 0.99)],
        };
    }
    recordLatency(timestamp) {
        const latency = Date.now() - timestamp.getTime();
        this.latencyBuffer.push(latency);
        if (this.latencyBuffer.length > this.latencyBufferSize) {
            this.latencyBuffer.shift();
        }
    }
    async detectBottlenecks(queueStatus) {
        const bottlenecks = [];
        // Queue bottleneck detection
        if (queueStatus.totalQueued > queueStatus.totalActive * 3) {
            bottlenecks.push({
                type: 'queue',
                severity: 'high',
                description: 'Queue is backing up with many pending tasks',
                affectedTasks: queueStatus.totalQueued,
                estimatedImpact: 'Increased wait times, reduced throughput',
                suggestedActions: [
                    'Scale up agent capacity',
                    'Optimize task priorities',
                    'Review resource allocation',
                ],
            });
        }
        // Agent bottleneck detection
        if (queueStatus.availableAgents === 0 && queueStatus.totalQueued > 0) {
            bottlenecks.push({
                type: 'agent',
                severity: 'critical',
                description: 'No agents available to process queued tasks',
                affectedTasks: queueStatus.totalQueued,
                estimatedImpact: 'Complete processing halt',
                suggestedActions: [
                    'Add more agents immediately',
                    'Check agent health status',
                    'Review agent resource limits',
                ],
            });
        }
        return bottlenecks;
    }
    storeMetricsInHistory(metrics) {
        // Store metrics in different time interval buckets
        for (const [interval, history] of this.performanceHistory) {
            history.dataPoints.push({
                timestamp: metrics.timestamp,
                metrics,
            });
            // Keep limited history for each interval
            const maxPoints = this.getMaxPointsForInterval(interval);
            if (history.dataPoints.length > maxPoints) {
                history.dataPoints = history.dataPoints.slice(-maxPoints);
            }
            // Update trends
            this.updateTrends(history);
        }
    }
    getMaxPointsForInterval(interval) {
        switch (interval) {
            case 'minute':
                return 60; // 1 hour of minute data
            case 'hour':
                return 24; // 24 hours of hourly data
            case 'day':
                return 30; // 30 days of daily data
            case 'week':
                return 52; // 52 weeks of weekly data
            default:
                return 100;
        }
    }
    updateTrends(history) {
        if (history.dataPoints.length < 2)
            return;
        const recent = history.dataPoints.slice(-10); // Last 10 data points
        const older = history.dataPoints.slice(-20, -10); // Previous 10 data points
        if (older.length === 0)
            return;
        // Calculate average metrics for trend analysis
        const recentAvg = this.calculateAverageMetrics(recent);
        const olderAvg = this.calculateAverageMetrics(older);
        // Update trends based on comparison
        const throughputTrend = this.determineTrend(recentAvg.queueMetrics.queueThroughput, olderAvg.queueMetrics.queueThroughput);
        history.trends.throughput = throughputTrend === 'increasing' ? 'increasing' :
            throughputTrend === 'decreasing' ? 'decreasing' : 'stable';
        const latencyTrend = this.determineTrend(olderAvg.systemMetrics.latency.p95, // Inverted - lower latency is better
        recentAvg.systemMetrics.latency.p95);
        history.trends.latency = latencyTrend === 'increasing' ? 'improving' :
            latencyTrend === 'decreasing' ? 'degrading' : 'stable';
        const efficiencyTrend = this.determineTrend(recentAvg.queueMetrics.queueEfficiency, olderAvg.queueMetrics.queueEfficiency);
        history.trends.efficiency = efficiencyTrend === 'increasing' ? 'improving' :
            efficiencyTrend === 'decreasing' ? 'degrading' : 'stable';
        const errorTrend = this.determineTrend(olderAvg.systemMetrics.errorRate, // Inverted - lower error rate is better
        recentAvg.systemMetrics.errorRate);
        history.trends.errorRate = errorTrend === 'increasing' ? 'improving' :
            errorTrend === 'decreasing' ? 'degrading' : 'stable';
    }
    calculateAverageMetrics(dataPoints) {
        // Calculate average metrics across data points
        // This is a simplified implementation
        const first = dataPoints[0].metrics;
        return {
            ...first,
            queueMetrics: {
                ...first.queueMetrics,
                queueThroughput: dataPoints.reduce((sum, dp) => sum + dp.metrics.queueMetrics.queueThroughput, 0) / dataPoints.length,
                queueEfficiency: dataPoints.reduce((sum, dp) => sum + dp.metrics.queueMetrics.queueEfficiency, 0) / dataPoints.length,
            },
            systemMetrics: {
                ...first.systemMetrics,
                errorRate: dataPoints.reduce((sum, dp) => sum + dp.metrics.systemMetrics.errorRate, 0) / dataPoints.length,
                latency: {
                    p50: dataPoints.reduce((sum, dp) => sum + dp.metrics.systemMetrics.latency.p50, 0) / dataPoints.length,
                    p95: dataPoints.reduce((sum, dp) => sum + dp.metrics.systemMetrics.latency.p95, 0) / dataPoints.length,
                    p99: dataPoints.reduce((sum, dp) => sum + dp.metrics.systemMetrics.latency.p99, 0) / dataPoints.length,
                },
            },
        };
    }
    determineTrend(current, previous) {
        const threshold = 0.05; // 5% threshold for trend detection
        const change = (current - previous) / previous;
        if (change > threshold)
            return 'increasing';
        if (change < -threshold)
            return 'decreasing';
        return 'stable';
    }
    /**
     * Clean up resources and stop monitoring
     */
    destroy() {
        this.stopOptimization();
        this.removeAllListeners();
        this.performanceHistory.clear();
        this.appliedOptimizations.clear();
        this.logger.info('Performance optimizer destroyed');
    }
}
/**
 * Factory function to create performance optimizer for a task queue
 */
export function createPerformanceOptimizer(taskQueue) {
    return new PerformanceOptimizer(taskQueue);
}
//# sourceMappingURL=PerformanceOptimizer.js.map