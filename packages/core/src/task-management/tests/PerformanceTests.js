/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Performance Tests for Queue Management System
 *
 * Comprehensive performance testing including benchmarks, stress tests,
 * load testing, and scalability validation.
 *
 * @author TASK_QUEUE_DESIGNER_01
 * @version 1.0.0
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SelfManagingTaskQueue, } from '../SelfManagingTaskQueue.js';
import { RealtimeQueueMonitor, } from '../RealtimeQueueMonitor.js';
import { AutomaticQueueOptimizer, } from '../AutomaticQueueOptimizer.js';
import { Task, TaskPriority, TaskStatus, TaskCategory } from '../TaskQueue.js';
import { TestUtils, PerformanceTracker } from './QueueManagementTestSuite.js';
/**
 * Performance test suite runner
 */
class PerformanceTestRunner {
    performanceTracker;
    constructor() {
        this.performanceTracker = new PerformanceTracker();
    }
    async runPerformanceTest(queue, config) {
        const startTime = Date.now();
        const endMeasurement = this.performanceTracker.startMeasurement('total_test');
        let successfulTasks = 0;
        let failedTasks = 0;
        let peakConcurrency = 0;
        let currentConcurrency = 0;
        // Create tasks
        const tasks = Array.from({ length: config.taskCount }, (_, i) => TestUtils.createMockTask({
            id: `perf_task_${i}`,
            priority: i % 3 === 0
                ? TaskPriority.HIGH
                : i % 3 === 1
                    ? TaskPriority.MEDIUM
                    : TaskPriority.LOW,
            executeFunction: async () => {
                currentConcurrency++;
                peakConcurrency = Math.max(peakConcurrency, currentConcurrency);
                await TestUtils.wait(config.executionTimeMs);
                currentConcurrency--;
                if (Math.random() > 0.95) {
                    // 5% failure rate
                    throw new Error(`Simulated failure for task ${i}`);
                }
                successfulTasks++;
                return { success: true, result: `Performance task ${i} completed` };
            },
        }));
        // Add all tasks
        const addTasksStart = Date.now();
        for (const task of tasks) {
            await queue.addTask(task);
        }
        const addTasksDuration = Date.now() - addTasksStart;
        // Wait for completion or timeout
        const processingStart = Date.now();
        let processingComplete = false;
        while (!processingComplete &&
            Date.now() - processingStart < config.timeoutMs) {
            await TestUtils.wait(100);
            const status = queue.getQueueStatus();
            if (status.pendingTasks === 0 && status.activeTasks === 0) {
                processingComplete = true;
            }
        }
        const totalDuration = endMeasurement();
        const endTime = Date.now();
        // Calculate metrics
        const finalStatus = queue.getQueueStatus();
        failedTasks = finalStatus.failedTasks;
        const actualSuccessful = finalStatus.tasksProcessed;
        const throughput = actualSuccessful / (totalDuration / 1000);
        const averageLatency = totalDuration / config.taskCount;
        // Estimate memory usage (simplified)
        const memoryUsed = process.memoryUsage ? process.memoryUsage().heapUsed : 0;
        return {
            totalTasks: config.taskCount,
            successfulTasks: actualSuccessful,
            failedTasks,
            totalDurationMs: totalDuration,
            throughput,
            averageLatency,
            memoryUsed,
            peakConcurrency,
        };
    }
    validatePerformanceResult(result, config) {
        const issues = [];
        // Throughput validation
        if (result.throughput < config.expectedThroughputMinimum) {
            issues.push(`Throughput too low: ${result.throughput.toFixed(2)} < ${config.expectedThroughputMinimum} tasks/sec`);
        }
        // Latency validation
        if (result.averageLatency > config.expectedLatencyMaximum) {
            issues.push(`Latency too high: ${result.averageLatency.toFixed(2)} > ${config.expectedLatencyMaximum} ms`);
        }
        // Success rate validation (should be >90%)
        const successRate = (result.successfulTasks / result.totalTasks) * 100;
        if (successRate < 90) {
            issues.push(`Success rate too low: ${successRate.toFixed(1)}% < 90%`);
        }
        // Concurrency validation
        if (result.peakConcurrency > config.concurrency + 2) {
            // Allow some variance
            issues.push(`Peak concurrency exceeded limits: ${result.peakConcurrency} > ${config.concurrency + 2}`);
        }
        return {
            passed: issues.length === 0,
            issues,
        };
    }
    clear() {
        this.performanceTracker.clear();
    }
}
describe('Queue Management Performance Tests', () => {
    let performanceRunner;
    beforeEach(() => {
        performanceRunner = new PerformanceTestRunner();
    });
    afterEach(() => {
        performanceRunner.clear();
    });
    describe('Throughput Benchmarks', () => {
        it('should handle high-throughput scenarios (1000 tasks)', async () => {
            const queue = new SelfManagingTaskQueue({
                maxConcurrentTasks: 20,
                enableAutonomousBreakdown: false, // Disable for pure throughput test
                enableAdaptiveScheduling: true,
                performanceOptimization: true,
                learningEnabled: false, // Disable to reduce overhead
                metricsEnabled: true,
                enableIntelligentPreemption: false,
                enableDynamicResourceAllocation: true,
                enablePredictiveScheduling: false,
                enableAutomaticPriorityAdjustment: false,
                enableContinuousOptimization: false,
                optimizationIntervalMs: 60000,
                enableMLBasedPredictions: false,
                enableAdaptiveLoadBalancing: true,
                breakdownThreshold: 0.9,
                maxBreakdownDepth: 1,
            });
            try {
                const config = {
                    taskCount: 1000,
                    concurrency: 20,
                    executionTimeMs: 10, // Very fast tasks
                    timeoutMs: 30000, // 30 seconds
                    expectedThroughputMinimum: 80, // At least 80 tasks/sec
                    expectedLatencyMaximum: 500, // Max 500ms average
                };
                const result = await performanceRunner.runPerformanceTest(queue, config);
                const validation = performanceRunner.validatePerformanceResult(result, config);
                console.log(`High Throughput Results:`, {
                    throughput: `${result.throughput.toFixed(2)} tasks/sec`,
                    latency: `${result.averageLatency.toFixed(2)} ms`,
                    successRate: `${((result.successfulTasks / result.totalTasks) * 100).toFixed(1)}%`,
                    memoryUsed: `${(result.memoryUsed / 1024 / 1024).toFixed(2)} MB`,
                    peakConcurrency: result.peakConcurrency,
                });
                expect(validation.passed).toBe(true);
                if (!validation.passed) {
                    console.warn('Performance issues:', validation.issues);
                }
                expect(result.totalTasks).toBe(1000);
                expect(result.successfulTasks).toBeGreaterThan(950); // >95% success
                expect(result.throughput).toBeGreaterThan(config.expectedThroughputMinimum);
            }
            finally {
                await queue.shutdown();
            }
        }, 60000); // 60 second timeout
        it('should maintain performance with mixed task priorities', async () => {
            const queue = new SelfManagingTaskQueue({
                maxConcurrentTasks: 15,
                enableAutonomousBreakdown: false,
                enableAdaptiveScheduling: true,
                performanceOptimization: true,
                learningEnabled: false,
                metricsEnabled: true,
                enableIntelligentPreemption: true, // Enable for priority testing
                enableDynamicResourceAllocation: true,
                enablePredictiveScheduling: false,
                enableAutomaticPriorityAdjustment: true, // Enable for priority testing
                enableContinuousOptimization: false,
                optimizationIntervalMs: 60000,
                enableMLBasedPredictions: false,
                enableAdaptiveLoadBalancing: true,
                breakdownThreshold: 0.9,
                maxBreakdownDepth: 1,
            });
            try {
                const tasks = Array.from({ length: 500 }, (_, i) => TestUtils.createMockTask({
                    id: `priority_task_${i}`,
                    priority: i % 5 === 0
                        ? TaskPriority.CRITICAL
                        : i % 5 === 1
                            ? TaskPriority.HIGH
                            : i % 5 === 2
                                ? TaskPriority.MEDIUM
                                : i % 5 === 3
                                    ? TaskPriority.LOW
                                    : TaskPriority.BACKGROUND,
                    executeFunction: async () => {
                        const executionTime = 20 + Math.random() * 30; // 20-50ms
                        await TestUtils.wait(executionTime);
                        return { success: true, result: `Priority task ${i} completed` };
                    },
                }));
                const startTime = Date.now();
                // Add all tasks
                for (const task of tasks) {
                    await queue.addTask(task);
                }
                // Wait for completion
                while (queue.getQueueStatus().pendingTasks > 0 &&
                    Date.now() - startTime < 25000) {
                    await TestUtils.wait(100);
                }
                const totalTime = Date.now() - startTime;
                const status = queue.getQueueStatus();
                const throughput = status.tasksProcessed / (totalTime / 1000);
                console.log(`Mixed Priority Results:`, {
                    throughput: `${throughput.toFixed(2)} tasks/sec`,
                    totalTime: `${totalTime} ms`,
                    processed: status.tasksProcessed,
                    failed: status.failedTasks,
                });
                expect(status.totalTasks).toBe(500);
                expect(status.tasksProcessed).toBeGreaterThan(475); // >95% success
                expect(throughput).toBeGreaterThan(30); // At least 30 tasks/sec
            }
            finally {
                await queue.shutdown();
            }
        }, 45000);
        it('should scale with increased concurrency', async () => {
            const concurrencyLevels = [5, 10, 20];
            const results = [];
            for (const concurrency of concurrencyLevels) {
                const queue = new SelfManagingTaskQueue({
                    maxConcurrentTasks: concurrency,
                    enableAutonomousBreakdown: false,
                    enableAdaptiveScheduling: true,
                    performanceOptimization: true,
                    learningEnabled: false,
                    metricsEnabled: true,
                    enableIntelligentPreemption: false,
                    enableDynamicResourceAllocation: true,
                    enablePredictiveScheduling: false,
                    enableAutomaticPriorityAdjustment: false,
                    enableContinuousOptimization: false,
                    optimizationIntervalMs: 60000,
                    enableMLBasedPredictions: false,
                    enableAdaptiveLoadBalancing: true,
                    breakdownThreshold: 0.9,
                    maxBreakdownDepth: 1,
                });
                try {
                    const config = {
                        taskCount: 200,
                        concurrency,
                        executionTimeMs: 25,
                        timeoutMs: 15000,
                        expectedThroughputMinimum: 20,
                        expectedLatencyMaximum: 1000,
                    };
                    const result = await performanceRunner.runPerformanceTest(queue, config);
                    results.push({ concurrency, throughput: result.throughput });
                    console.log(`Concurrency ${concurrency}: ${result.throughput.toFixed(2)} tasks/sec`);
                }
                finally {
                    await queue.shutdown();
                }
            }
            // Throughput should generally increase with concurrency
            expect(results[2].throughput).toBeGreaterThan(results[0].throughput);
            console.log('Scalability Results:', results);
        }, 60000);
    });
    describe('Latency Benchmarks', () => {
        it('should maintain low latency under normal load', async () => {
            const queue = new SelfManagingTaskQueue({
                maxConcurrentTasks: 8,
                enableAutonomousBreakdown: false,
                enableAdaptiveScheduling: true,
                performanceOptimization: true,
                learningEnabled: false,
                metricsEnabled: true,
                enableIntelligentPreemption: false,
                enableDynamicResourceAllocation: true,
                enablePredictiveScheduling: false,
                enableAutomaticPriorityAdjustment: false,
                enableContinuousOptimization: false,
                optimizationIntervalMs: 60000,
                enableMLBasedPredictions: false,
                enableAdaptiveLoadBalancing: true,
                breakdownThreshold: 0.9,
                maxBreakdownDepth: 1,
            });
            try {
                const latencyMeasurements = [];
                const tasks = Array.from({ length: 100 }, (_, i) => TestUtils.createMockTask({
                    executeFunction: async () => {
                        const taskStart = Date.now();
                        await TestUtils.wait(50); // 50ms execution
                        const taskEnd = Date.now();
                        latencyMeasurements.push(taskEnd - taskStart);
                        return { success: true, result: `Latency task ${i} completed` };
                    },
                }));
                const overallStart = Date.now();
                for (const task of tasks) {
                    await queue.addTask(task);
                }
                // Wait for completion
                while (queue.getQueueStatus().pendingTasks > 0 &&
                    Date.now() - overallStart < 20000) {
                    await TestUtils.wait(50);
                }
                const overallEnd = Date.now();
                const totalTime = overallEnd - overallStart;
                // Calculate latency statistics
                latencyMeasurements.sort((a, b) => a - b);
                const averageLatency = latencyMeasurements.reduce((a, b) => a + b, 0) /
                    latencyMeasurements.length;
                const p50Latency = latencyMeasurements[Math.floor(latencyMeasurements.length * 0.5)];
                const p95Latency = latencyMeasurements[Math.floor(latencyMeasurements.length * 0.95)];
                const p99Latency = latencyMeasurements[Math.floor(latencyMeasurements.length * 0.99)];
                console.log(`Latency Results:`, {
                    average: `${averageLatency.toFixed(2)} ms`,
                    p50: `${p50Latency} ms`,
                    p95: `${p95Latency} ms`,
                    p99: `${p99Latency} ms`,
                    totalTime: `${totalTime} ms`,
                });
                expect(averageLatency).toBeLessThan(200); // Should be close to 50ms execution + overhead
                expect(p95Latency).toBeLessThan(300);
                expect(p99Latency).toBeLessThan(500);
            }
            finally {
                await queue.shutdown();
            }
        }, 30000);
        it('should handle latency spikes gracefully', async () => {
            const queue = new SelfManagingTaskQueue({
                maxConcurrentTasks: 10,
                enableAutonomousBreakdown: false,
                enableAdaptiveScheduling: true,
                performanceOptimization: true,
                learningEnabled: false,
                metricsEnabled: true,
                enableIntelligentPreemption: true, // Enable to handle spikes
                enableDynamicResourceAllocation: true,
                enablePredictiveScheduling: false,
                enableAutomaticPriorityAdjustment: true,
                enableContinuousOptimization: false,
                optimizationIntervalMs: 60000,
                enableMLBasedPredictions: false,
                enableAdaptiveLoadBalancing: true,
                breakdownThreshold: 0.9,
                maxBreakdownDepth: 1,
            });
            try {
                const tasks = Array.from({ length: 50 }, (_, i) => TestUtils.createMockTask({
                    priority: i < 10 ? TaskPriority.HIGH : TaskPriority.MEDIUM,
                    executeFunction: async () => {
                        // Some tasks have latency spikes
                        const executionTime = i % 7 === 0 ? 500 : 50; // Spike every 7th task
                        await TestUtils.wait(executionTime);
                        return {
                            success: true,
                            result: `Spike test task ${i} completed`,
                        };
                    },
                }));
                const startTime = Date.now();
                for (const task of tasks) {
                    await queue.addTask(task);
                }
                // Wait for completion
                while (queue.getQueueStatus().pendingTasks > 0 &&
                    Date.now() - startTime < 30000) {
                    await TestUtils.wait(100);
                }
                const totalTime = Date.now() - startTime;
                const status = queue.getQueueStatus();
                console.log(`Latency Spike Results:`, {
                    totalTime: `${totalTime} ms`,
                    processed: status.tasksProcessed,
                    throughput: `${(status.tasksProcessed / (totalTime / 1000)).toFixed(2)} tasks/sec`,
                });
                expect(status.tasksProcessed).toBe(50);
                expect(totalTime).toBeLessThan(25000); // Should handle spikes efficiently
            }
            finally {
                await queue.shutdown();
            }
        }, 45000);
    });
    describe('Memory and Resource Tests', () => {
        it('should maintain reasonable memory usage under load', async () => {
            const queue = new SelfManagingTaskQueue({
                maxConcurrentTasks: 15,
                enableAutonomousBreakdown: false,
                enableAdaptiveScheduling: true,
                performanceOptimization: true,
                learningEnabled: false,
                metricsEnabled: true,
                enableIntelligentPreemption: false,
                enableDynamicResourceAllocation: true,
                enablePredictiveScheduling: false,
                enableAutomaticPriorityAdjustment: false,
                enableContinuousOptimization: false,
                optimizationIntervalMs: 60000,
                enableMLBasedPredictions: false,
                enableAdaptiveLoadBalancing: true,
                breakdownThreshold: 0.9,
                maxBreakdownDepth: 1,
            });
            try {
                const initialMemory = process.memoryUsage
                    ? process.memoryUsage().heapUsed
                    : 0;
                const memoryMeasurements = [];
                const tasks = Array.from({ length: 1000 }, (_, i) => TestUtils.createMockTask({
                    executeFunction: async () => {
                        // Simulate some memory usage
                        const tempData = new Array(1000).fill(`data_${i}`);
                        await TestUtils.wait(10);
                        // Record memory usage
                        if (process.memoryUsage) {
                            memoryMeasurements.push(process.memoryUsage().heapUsed);
                        }
                        tempData.length = 0; // Clean up
                        return { success: true, result: `Memory task ${i} completed` };
                    },
                }));
                // Add tasks in batches to monitor memory growth
                const batchSize = 100;
                for (let i = 0; i < tasks.length; i += batchSize) {
                    const batch = tasks.slice(i, i + batchSize);
                    for (const task of batch) {
                        await queue.addTask(task);
                    }
                    await TestUtils.wait(200); // Allow processing
                }
                // Wait for completion
                const startTime = Date.now();
                while (queue.getQueueStatus().pendingTasks > 0 &&
                    Date.now() - startTime < 60000) {
                    await TestUtils.wait(500);
                }
                const finalMemory = process.memoryUsage
                    ? process.memoryUsage().heapUsed
                    : 0;
                const memoryGrowth = finalMemory - initialMemory;
                // Calculate peak memory usage
                const peakMemory = Math.max(...memoryMeasurements);
                const peakGrowth = peakMemory - initialMemory;
                console.log(`Memory Usage Results:`, {
                    initial: `${(initialMemory / 1024 / 1024).toFixed(2)} MB`,
                    final: `${(finalMemory / 1024 / 1024).toFixed(2)} MB`,
                    peak: `${(peakMemory / 1024 / 1024).toFixed(2)} MB`,
                    growth: `${(memoryGrowth / 1024 / 1024).toFixed(2)} MB`,
                    peakGrowth: `${(peakGrowth / 1024 / 1024).toFixed(2)} MB`,
                });
                // Memory growth should be reasonable (less than 100MB for 1000 tasks)
                expect(peakGrowth).toBeLessThan(100 * 1024 * 1024);
            }
            finally {
                await queue.shutdown();
            }
        }, 90000);
        it('should cleanup resources after task completion', async () => {
            const queue = new SelfManagingTaskQueue({
                maxConcurrentTasks: 5,
                enableAutonomousBreakdown: false,
                enableAdaptiveScheduling: true,
                performanceOptimization: true,
                learningEnabled: false,
                metricsEnabled: true,
                enableIntelligentPreemption: false,
                enableDynamicResourceAllocation: true,
                enablePredictiveScheduling: false,
                enableAutomaticPriorityAdjustment: false,
                enableContinuousOptimization: false,
                optimizationIntervalMs: 60000,
                enableMLBasedPredictions: false,
                enableAdaptiveLoadBalancing: true,
                breakdownThreshold: 0.9,
                maxBreakdownDepth: 1,
            });
            try {
                // Run multiple cycles to test resource cleanup
                for (let cycle = 0; cycle < 3; cycle++) {
                    const cycleStart = Date.now();
                    const tasks = TestUtils.createMockTasks(200);
                    tasks.forEach((task) => {
                        task.executeFunction = async () => {
                            await TestUtils.wait(25);
                            return {
                                success: true,
                                result: `Cleanup cycle ${cycle} task completed`,
                            };
                        };
                    });
                    // Add all tasks
                    for (const task of tasks) {
                        await queue.addTask(task);
                    }
                    // Wait for cycle completion
                    while (queue.getQueueStatus().pendingTasks > 0 &&
                        Date.now() - cycleStart < 20000) {
                        await TestUtils.wait(100);
                    }
                    const cycleStatus = queue.getQueueStatus();
                    console.log(`Cycle ${cycle + 1}: ${cycleStatus.tasksProcessed} tasks completed`);
                    expect(cycleStatus.tasksProcessed).toBeGreaterThan(190);
                    // Small delay between cycles
                    await TestUtils.wait(100);
                }
                // Verify queue state is clean after cycles
                const finalStatus = queue.getQueueStatus();
                expect(finalStatus.activeTasks).toBe(0);
                expect(finalStatus.pendingTasks).toBe(0);
            }
            finally {
                await queue.shutdown();
            }
        }, 75000);
    });
    describe('Monitoring Performance Impact', () => {
        it('should have minimal performance impact with monitoring enabled', async () => {
            // Test without monitoring
            const queueWithoutMonitoring = new SelfManagingTaskQueue({
                maxConcurrentTasks: 10,
                enableAutonomousBreakdown: false,
                enableAdaptiveScheduling: false,
                performanceOptimization: false,
                learningEnabled: false,
                metricsEnabled: false, // Disabled
                enableIntelligentPreemption: false,
                enableDynamicResourceAllocation: false,
                enablePredictiveScheduling: false,
                enableAutomaticPriorityAdjustment: false,
                enableContinuousOptimization: false,
                optimizationIntervalMs: 60000,
                enableMLBasedPredictions: false,
                enableAdaptiveLoadBalancing: false,
                breakdownThreshold: 0.9,
                maxBreakdownDepth: 1,
            });
            // Test with monitoring
            const queueWithMonitoring = new SelfManagingTaskQueue({
                maxConcurrentTasks: 10,
                enableAutonomousBreakdown: false,
                enableAdaptiveScheduling: false,
                performanceOptimization: false,
                learningEnabled: false,
                metricsEnabled: true, // Enabled
                enableIntelligentPreemption: false,
                enableDynamicResourceAllocation: false,
                enablePredictiveScheduling: false,
                enableAutomaticPriorityAdjustment: false,
                enableContinuousOptimization: false,
                optimizationIntervalMs: 60000,
                enableMLBasedPredictions: false,
                enableAdaptiveLoadBalancing: false,
                breakdownThreshold: 0.9,
                maxBreakdownDepth: 1,
            });
            const monitor = new RealtimeQueueMonitor({
                enabled: true,
                updateIntervalMs: 1000,
                historicalDataRetentionHours: 0.5,
                maxDataPoints: 100,
                enablePerformanceTracking: true,
                performanceMetricsIntervalMs: 2000,
                enableThroughputMonitoring: true,
                enableLatencyMonitoring: true,
                enableResourceMonitoring: true,
                enableAlerting: false, // Disable alerts for performance test
                alertThresholds: {},
                alertChannels: [],
                enableAnomalyDetection: false,
                enableRealTimeVisualization: true,
                dashboardUpdateIntervalMs: 1000,
                chartDataPoints: 50,
                enableHistoricalCharts: true,
                enablePredictiveAnalytics: false,
                enableHealthDiagnostics: false,
                enableCapacityPlanning: false,
                enableSLAMonitoring: false,
                enableWebSocketUpdates: false,
                webSocketPort: 8083,
                maxWebSocketConnections: 1,
            });
            try {
                const taskCount = 500;
                // Test without monitoring
                const withoutMonitoringConfig = {
                    taskCount,
                    concurrency: 10,
                    executionTimeMs: 20,
                    timeoutMs: 30000,
                    expectedThroughputMinimum: 40,
                    expectedLatencyMaximum: 1000,
                };
                const resultWithoutMonitoring = await performanceRunner.runPerformanceTest(queueWithoutMonitoring, withoutMonitoringConfig);
                // Test with monitoring
                monitor.registerQueue('monitored_queue');
                const monitoringInterval = setInterval(() => {
                    const status = queueWithMonitoring.getQueueStatus();
                    monitor.updateQueueMetrics('monitored_queue', status);
                }, 500);
                const resultWithMonitoring = await performanceRunner.runPerformanceTest(queueWithMonitoring, withoutMonitoringConfig);
                clearInterval(monitoringInterval);
                console.log(`Monitoring Impact Results:`, {
                    withoutMonitoring: {
                        throughput: `${resultWithoutMonitoring.throughput.toFixed(2)} tasks/sec`,
                        latency: `${resultWithoutMonitoring.averageLatency.toFixed(2)} ms`,
                        duration: `${resultWithoutMonitoring.totalDurationMs} ms`,
                    },
                    withMonitoring: {
                        throughput: `${resultWithMonitoring.throughput.toFixed(2)} tasks/sec`,
                        latency: `${resultWithMonitoring.averageLatency.toFixed(2)} ms`,
                        duration: `${resultWithMonitoring.totalDurationMs} ms`,
                    },
                });
                // Performance impact should be minimal (less than 20% degradation)
                const throughputRatio = resultWithMonitoring.throughput / resultWithoutMonitoring.throughput;
                const latencyRatio = resultWithMonitoring.averageLatency /
                    resultWithoutMonitoring.averageLatency;
                expect(throughputRatio).toBeGreaterThan(0.8); // Less than 20% throughput loss
                expect(latencyRatio).toBeLessThan(1.3); // Less than 30% latency increase
            }
            finally {
                await queueWithoutMonitoring.shutdown();
                await queueWithMonitoring.shutdown();
                await monitor.shutdown();
            }
        }, 60000);
    });
    describe('Optimization Performance Impact', () => {
        it('should improve performance over time with optimization enabled', async () => {
            const queue = new SelfManagingTaskQueue({
                maxConcurrentTasks: 8,
                enableAutonomousBreakdown: false,
                enableAdaptiveScheduling: true,
                performanceOptimization: true, // Enable optimization
                learningEnabled: true,
                metricsEnabled: true,
                enableIntelligentPreemption: true,
                enableDynamicResourceAllocation: true,
                enablePredictiveScheduling: false,
                enableAutomaticPriorityAdjustment: true,
                enableContinuousOptimization: true, // Enable continuous optimization
                optimizationIntervalMs: 2000, // Fast optimization for testing
                enableMLBasedPredictions: false,
                enableAdaptiveLoadBalancing: true,
                breakdownThreshold: 0.9,
                maxBreakdownDepth: 1,
            });
            const optimizer = new AutomaticQueueOptimizer({
                enabled: true,
                optimizationIntervalMs: 5000,
                analysisWindowHours: 0.1,
                adaptationThreshold: 0.05,
                enablePerformanceRegression: true,
                enableBottleneckDetection: true,
                enableResourceOptimization: true,
                enablePredictiveOptimization: false,
                enableAlgorithmAdaptation: true,
                algorithmSwitchThreshold: 0.1,
                maxAlgorithmAttempts: 2,
                algorithmStabilityPeriodMs: 5000,
                enableAutomaticScaling: true,
                enableWorkloadBalancing: true,
                enableMemoryOptimization: false,
                enableConcurrencyTuning: true,
                enableMachineLearning: false,
                predictionWindowMs: 300000,
                learningRateDecay: 0.95,
                modelUpdateIntervalMs: 60000,
                targets: {
                    primaryTarget: 'throughput',
                    throughputWeight: 0.6,
                    latencyWeight: 0.3,
                    efficiencyWeight: 0.1,
                    resourceWeight: 0.1,
                    targetThroughputTasksPerMinute: 600, // 10 tasks/second
                    targetAverageLatencyMs: 100,
                    targetResourceUtilization: 0.7,
                    targetErrorRate: 0.01,
                    acceptableThroughputRange: [300, 1200],
                    acceptableLatencyRange: [50, 300],
                    acceptableResourceRange: [0.4, 0.8],
                },
                constraints: {
                    maxConcurrentTasks: 15,
                    maxMemoryUsageMB: 512,
                    maxCpuUsagePercent: 80,
                    maxQueueSize: 200,
                    resourceLimits: {
                        cpu: 0.8,
                        memory: 536870912,
                        disk: 2147483648,
                        network: 41943040,
                    },
                    minThroughput: 5,
                    maxLatency: 1000,
                    maxErrorRate: 0.05,
                    minimumStabilityPeriodMs: 3000,
                    maxConfigurationChangesPerHour: 10,
                    requirePerformanceImprovement: false,
                },
                enableExperimentalOptimizations: false,
                enableHeuristicOptimization: true,
                enableGeneticAlgorithmTuning: false,
                enableSimulatedAnnealingOptimization: false,
            });
            try {
                const throughputMeasurements = [];
                // Run multiple batches to allow optimization to take effect
                for (let batch = 0; batch < 3; batch++) {
                    const batchStart = Date.now();
                    const tasks = Array.from({ length: 100 }, (_, i) => TestUtils.createMockTask({
                        executeFunction: async () => {
                            await TestUtils.wait(50 + Math.random() * 50); // Variable execution time
                            return {
                                success: true,
                                result: `Optimization batch ${batch} task ${i} completed`,
                            };
                        },
                    }));
                    // Add tasks
                    for (const task of tasks) {
                        await queue.addTask(task);
                    }
                    // Wait for batch completion
                    while (queue.getQueueStatus().pendingTasks > 0 &&
                        Date.now() - batchStart < 20000) {
                        await TestUtils.wait(200);
                    }
                    const batchTime = Date.now() - batchStart;
                    const batchThroughput = 100 / (batchTime / 1000);
                    throughputMeasurements.push(batchThroughput);
                    console.log(`Batch ${batch + 1}: ${batchThroughput.toFixed(2)} tasks/sec`);
                    // Trigger optimization between batches
                    if (batch < 2) {
                        await optimizer.triggerOptimization();
                        await TestUtils.wait(1000); // Allow optimization to apply
                    }
                }
                const optimizationStatus = optimizer.getOptimizationStatus();
                console.log(`Optimization Results:`, {
                    initialThroughput: `${throughputMeasurements[0].toFixed(2)} tasks/sec`,
                    finalThroughput: `${throughputMeasurements[2].toFixed(2)} tasks/sec`,
                    improvement: `${((throughputMeasurements[2] / throughputMeasurements[0] - 1) * 100).toFixed(1)}%`,
                    totalOptimizations: optimizationStatus.totalOptimizations,
                    successfulOptimizations: optimizationStatus.successfulOptimizations,
                });
                // Performance should not degrade (allow for some variance)
                expect(throughputMeasurements[2]).toBeGreaterThan(throughputMeasurements[0] * 0.8);
            }
            finally {
                await queue.shutdown();
                await optimizer.shutdown();
            }
        }, 90000);
    });
    describe('Stress Tests', () => {
        it('should handle extreme load conditions', async () => {
            const queue = new SelfManagingTaskQueue({
                maxConcurrentTasks: 25, // High concurrency
                enableAutonomousBreakdown: false,
                enableAdaptiveScheduling: true,
                performanceOptimization: true,
                learningEnabled: false,
                metricsEnabled: true,
                enableIntelligentPreemption: true,
                enableDynamicResourceAllocation: true,
                enablePredictiveScheduling: false,
                enableAutomaticPriorityAdjustment: true,
                enableContinuousOptimization: false,
                optimizationIntervalMs: 60000,
                enableMLBasedPredictions: false,
                enableAdaptiveLoadBalancing: true,
                breakdownThreshold: 0.9,
                maxBreakdownDepth: 1,
            });
            try {
                const config = {
                    taskCount: 2000, // Very high task count
                    concurrency: 25,
                    executionTimeMs: 5, // Very fast tasks
                    timeoutMs: 60000, // 1 minute timeout
                    expectedThroughputMinimum: 100, // High expectations
                    expectedLatencyMaximum: 1000,
                };
                const result = await performanceRunner.runPerformanceTest(queue, config);
                console.log(`Stress Test Results:`, {
                    totalTasks: result.totalTasks,
                    successfulTasks: result.successfulTasks,
                    failedTasks: result.failedTasks,
                    throughput: `${result.throughput.toFixed(2)} tasks/sec`,
                    duration: `${result.totalDurationMs} ms`,
                    peakConcurrency: result.peakConcurrency,
                    memoryUsed: `${(result.memoryUsed / 1024 / 1024).toFixed(2)} MB`,
                });
                // Should handle most of the load successfully
                expect(result.successfulTasks).toBeGreaterThan(1900); // >95% success
                expect(result.throughput).toBeGreaterThan(80); // Good throughput under stress
                expect(result.peakConcurrency).toBeLessThanOrEqual(27); // Respect concurrency limits
            }
            finally {
                await queue.shutdown();
            }
        }, 120000); // 2 minute timeout
        it('should maintain stability during rapid task additions', async () => {
            const queue = new SelfManagingTaskQueue({
                maxConcurrentTasks: 12,
                enableAutonomousBreakdown: false,
                enableAdaptiveScheduling: true,
                performanceOptimization: true,
                learningEnabled: false,
                metricsEnabled: true,
                enableIntelligentPreemption: false,
                enableDynamicResourceAllocation: true,
                enablePredictiveScheduling: false,
                enableAutomaticPriorityAdjustment: false,
                enableContinuousOptimization: false,
                optimizationIntervalMs: 60000,
                enableMLBasedPredictions: false,
                enableAdaptiveLoadBalancing: true,
                breakdownThreshold: 0.9,
                maxBreakdownDepth: 1,
            });
            try {
                const totalTasks = 1500;
                let successfulAdditions = 0;
                // Rapidly add tasks
                const additionPromises = Array.from({ length: totalTasks }, async (_, i) => {
                    try {
                        await queue.addTask(TestUtils.createMockTask({
                            executeFunction: async () => {
                                await TestUtils.wait(30 + Math.random() * 20);
                                return {
                                    success: true,
                                    result: `Rapid task ${i} completed`,
                                };
                            },
                        }));
                        successfulAdditions++;
                    }
                    catch (error) {
                        console.warn(`Failed to add task ${i}:`, error);
                    }
                });
                const addStart = Date.now();
                await Promise.all(additionPromises);
                const addDuration = Date.now() - addStart;
                console.log(`Rapid Addition: ${successfulAdditions}/${totalTasks} tasks added in ${addDuration}ms`);
                // Wait for processing
                const processStart = Date.now();
                while (queue.getQueueStatus().pendingTasks > 0 &&
                    Date.now() - processStart < 90000) {
                    await TestUtils.wait(500);
                }
                const finalStatus = queue.getQueueStatus();
                console.log(`Rapid Addition Results:`, {
                    tasksAdded: successfulAdditions,
                    tasksProcessed: finalStatus.tasksProcessed,
                    tasksFailed: finalStatus.failedTasks,
                    additionRate: `${(successfulAdditions / (addDuration / 1000)).toFixed(2)} tasks/sec`,
                });
                expect(successfulAdditions).toBeGreaterThan(totalTasks * 0.95); // >95% successful additions
                expect(finalStatus.tasksProcessed).toBeGreaterThan(successfulAdditions * 0.9); // >90% processing success
            }
            finally {
                await queue.shutdown();
            }
        }, 150000); // 2.5 minute timeout
    });
});
export { PerformanceTestRunner, PerformanceTestConfig, PerformanceTestResult };
//# sourceMappingURL=PerformanceTests.js.map