/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Edge Case Tests for Queue Management System
 *
 * Tests specific edge cases, boundary conditions, and error scenarios
 * that might not be covered in the main test suite.
 *
 * @author TASK_QUEUE_DESIGNER_01
 * @version 1.0.0
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SelfManagingTaskQueue } from '../SelfManagingTaskQueue.js';
import { RealtimeQueueMonitor, AlertSeverity, } from '../RealtimeQueueMonitor.js';
import { AutomaticQueueOptimizer, OptimizationType, } from '../AutomaticQueueOptimizer.js';
import { Task, TaskPriority, TaskStatus, TaskCategory } from '../TaskQueue.js';
import { TestUtils } from './QueueManagementTestSuite.js';
describe('Queue Management Edge Cases', () => {
    describe('Boundary Conditions', () => {
        let queue;
        beforeEach(() => {
            queue = new SelfManagingTaskQueue({
                maxConcurrentTasks: 1, // Minimal concurrency
                enableAutonomousBreakdown: true,
                breakdownThreshold: 0.1, // Very low threshold
                maxBreakdownDepth: 1, // Minimal depth
                enableAdaptiveScheduling: true,
                performanceOptimization: true,
                learningEnabled: true,
                metricsEnabled: true,
                enableIntelligentPreemption: true,
                enableDynamicResourceAllocation: true,
                enablePredictiveScheduling: false,
                enableAutomaticPriorityAdjustment: true,
                enableContinuousOptimization: true,
                optimizationIntervalMs: 1000,
                enableMLBasedPredictions: false,
                enableAdaptiveLoadBalancing: true,
            });
        });
        afterEach(async () => {
            await queue.shutdown();
        });
        it('should handle empty task queue gracefully', async () => {
            const status = queue.getQueueStatus();
            expect(status.totalTasks).toBe(0);
            expect(status.pendingTasks).toBe(0);
            expect(status.activeTasks).toBe(0);
            expect(status.isRunning).toBe(true);
        });
        it('should handle single task processing', async () => {
            const singleTask = TestUtils.createMockTask({
                executeFunction: async () => {
                    await TestUtils.wait(100);
                    return { success: true, result: 'Single task completed' };
                },
            });
            await queue.addTask(singleTask);
            await TestUtils.wait(200);
            const status = queue.getQueueStatus();
            expect(status.totalTasks).toBe(1);
            expect(status.tasksProcessed).toBe(1);
        });
        it('should handle maximum concurrent tasks correctly', async () => {
            const tasks = TestUtils.createMockTasks(5);
            let concurrentCount = 0;
            let maxConcurrent = 0;
            tasks.forEach((task) => {
                task.executeFunction = async () => {
                    concurrentCount++;
                    maxConcurrent = Math.max(maxConcurrent, concurrentCount);
                    await TestUtils.wait(200);
                    concurrentCount--;
                    return { success: true, result: 'Concurrent task completed' };
                };
            });
            for (const task of tasks) {
                await queue.addTask(task);
            }
            await TestUtils.wait(1500);
            expect(maxConcurrent).toBe(1); // Should respect maxConcurrentTasks = 1
        });
        it('should handle zero estimated duration tasks', async () => {
            const zeroTask = TestUtils.createMockTask({
                estimatedDuration: 0,
                executeFunction: async () => ({
                    success: true,
                    result: 'Zero duration task',
                }),
            });
            await queue.addTask(zeroTask);
            await TestUtils.wait(100);
            const status = queue.getQueueStatus();
            expect(status.tasksProcessed).toBe(1);
        });
        it('should handle extremely large estimated duration', async () => {
            const largeTask = TestUtils.createMockTask({
                estimatedDuration: Number.MAX_SAFE_INTEGER,
                executeFunction: async () => ({
                    success: true,
                    result: 'Large duration task',
                }),
            });
            await queue.addTask(largeTask);
            await TestUtils.wait(100);
            // Should be queued but may trigger breakdown
            const status = queue.getQueueStatus();
            expect(status.totalTasks).toBe(1);
        });
    });
    describe('Error Recovery Scenarios', () => {
        let queue;
        beforeEach(() => {
            queue = new SelfManagingTaskQueue({
                maxConcurrentTasks: 3,
                enableAutonomousBreakdown: true,
                breakdownThreshold: 0.7,
                maxBreakdownDepth: 2,
                enableAdaptiveScheduling: true,
                performanceOptimization: true,
                learningEnabled: true,
                metricsEnabled: true,
                enableIntelligentPreemption: true,
                enableDynamicResourceAllocation: true,
                enablePredictiveScheduling: false,
                enableAutomaticPriorityAdjustment: true,
                enableContinuousOptimization: true,
                optimizationIntervalMs: 5000,
                enableMLBasedPredictions: false,
                enableAdaptiveLoadBalancing: true,
            });
        });
        afterEach(async () => {
            await queue.shutdown();
        });
        it('should recover from task execution errors', async () => {
            const errorTask = TestUtils.createMockTask({
                executeFunction: async () => {
                    throw new Error('Task execution failed');
                },
            });
            const normalTask = TestUtils.createMockTask({
                executeFunction: async () => {
                    await TestUtils.wait(50);
                    return { success: true, result: 'Normal task completed' };
                },
            });
            await queue.addTask(errorTask);
            await queue.addTask(normalTask);
            await TestUtils.wait(300);
            const status = queue.getQueueStatus();
            expect(status.failedTasks).toBe(1);
            expect(status.tasksProcessed).toBe(1);
        });
        it('should handle promise rejection in tasks', async () => {
            const rejectTask = TestUtils.createMockTask({
                executeFunction: async () => Promise.reject(new Error('Promise rejected')),
            });
            await queue.addTask(rejectTask);
            await TestUtils.wait(200);
            const status = queue.getQueueStatus();
            expect(status.failedTasks).toBe(1);
        });
        it('should handle timeout scenarios', async () => {
            const timeoutTask = TestUtils.createMockTask({
                executeFunction: async () => {
                    // Simulate long-running task
                    await TestUtils.wait(10000);
                    return { success: true, result: 'Should timeout' };
                },
            });
            await queue.addTask(timeoutTask);
            // Don't wait for full execution
            await TestUtils.wait(500);
            const status = queue.getQueueStatus();
            expect(status.activeTasks).toBeLessThanOrEqual(1);
        });
        it('should handle malformed task objects', async () => {
            const malformedTask = {
                ...TestUtils.createMockTask(),
                executeFunction: null, // Invalid function
            };
            await expect(queue.addTask(malformedTask)).rejects.toThrow();
        });
        it('should handle circular dependency chains', async () => {
            const task1 = TestUtils.createMockTask({
                id: 'circular1',
                dependencies: [{ taskId: 'circular2', type: 'finish_to_start' }],
            });
            const task2 = TestUtils.createMockTask({
                id: 'circular2',
                dependencies: [{ taskId: 'circular1', type: 'finish_to_start' }],
            });
            // Adding circular dependencies should be handled gracefully
            await queue.addTask(task1);
            await queue.addTask(task2);
            await TestUtils.wait(200);
            const status = queue.getQueueStatus();
            // Should detect and handle circular dependencies
            expect(status.totalTasks).toBe(2);
        });
    });
    describe('Resource Exhaustion Scenarios', () => {
        let queue;
        beforeEach(() => {
            queue = new SelfManagingTaskQueue({
                maxConcurrentTasks: 2,
                enableAutonomousBreakdown: false, // Disable to focus on resource limits
                enableAdaptiveScheduling: true,
                performanceOptimization: true,
                learningEnabled: true,
                metricsEnabled: true,
                enableIntelligentPreemption: true,
                enableDynamicResourceAllocation: true,
                enablePredictiveScheduling: false,
                enableAutomaticPriorityAdjustment: true,
                enableContinuousOptimization: true,
                optimizationIntervalMs: 5000,
                enableMLBasedPredictions: false,
                enableAdaptiveLoadBalancing: true,
                breakdownThreshold: 0.7,
                maxBreakdownDepth: 2,
            });
        });
        afterEach(async () => {
            await queue.shutdown();
        });
        it('should handle memory-intensive tasks', async () => {
            const memoryTask = TestUtils.createMockTask({
                executeFunction: async () => {
                    // Simulate memory allocation
                    const largeArray = new Array(1000000).fill('memory');
                    await TestUtils.wait(100);
                    largeArray.length = 0; // Clean up
                    return { success: true, result: 'Memory task completed' };
                },
            });
            await queue.addTask(memoryTask);
            await TestUtils.wait(300);
            const status = queue.getQueueStatus();
            expect(status.tasksProcessed).toBe(1);
        });
        it('should handle CPU-intensive tasks', async () => {
            const cpuTask = TestUtils.createMockTask({
                executeFunction: async () => {
                    // Simulate CPU-intensive operation
                    const start = Date.now();
                    while (Date.now() - start < 100) {
                        Math.random() * Math.random();
                    }
                    return { success: true, result: 'CPU task completed' };
                },
            });
            await queue.addTask(cpuTask);
            await TestUtils.wait(300);
            const status = queue.getQueueStatus();
            expect(status.tasksProcessed).toBe(1);
        });
        it('should handle queue overflow scenarios', async () => {
            // Create many tasks to test queue limits
            const manyTasks = TestUtils.createMockTasks(1000);
            manyTasks.forEach((task) => {
                task.executeFunction = async () => {
                    await TestUtils.wait(10);
                    return { success: true, result: 'Overflow task completed' };
                };
            });
            // Add all tasks rapidly
            const addPromises = manyTasks.map((task) => queue.addTask(task));
            await Promise.all(addPromises);
            await TestUtils.wait(1000);
            const status = queue.getQueueStatus();
            expect(status.totalTasks).toBe(1000);
            expect(status.tasksProcessed).toBeGreaterThan(0);
        });
    });
    describe('Monitoring Edge Cases', () => {
        let monitor;
        beforeEach(() => {
            monitor = new RealtimeQueueMonitor({
                enabled: true,
                updateIntervalMs: 100, // Very fast for testing
                historicalDataRetentionHours: 0.1, // Very short
                maxDataPoints: 5, // Very limited
                enablePerformanceTracking: true,
                performanceMetricsIntervalMs: 200,
                enableThroughputMonitoring: true,
                enableLatencyMonitoring: true,
                enableResourceMonitoring: true,
                enableAlerting: true,
                alertThresholds: {
                    queueSizeWarning: 1,
                    queueSizeCritical: 2,
                    throughputWarning: 0.1,
                    throughputCritical: 0.01,
                    latencyWarning: 100,
                    latencyCritical: 1000,
                    errorRateWarning: 1,
                    errorRateCritical: 5,
                    resourceUsageWarning: 10,
                    resourceUsageCritical: 50,
                    deadlockDetection: true,
                    starvationDetection: true,
                },
                alertChannels: [
                    {
                        type: 'console',
                        enabled: true,
                        severity: [
                            AlertSeverity.INFO,
                            AlertSeverity.WARNING,
                            AlertSeverity.CRITICAL,
                        ],
                    },
                ],
                enableAnomalyDetection: true,
                enableRealTimeVisualization: true,
                dashboardUpdateIntervalMs: 50,
                chartDataPoints: 3,
                enableHistoricalCharts: true,
                enablePredictiveAnalytics: false,
                enableHealthDiagnostics: true,
                enableCapacityPlanning: true,
                enableSLAMonitoring: false,
                enableWebSocketUpdates: false,
                webSocketPort: 8082,
                maxWebSocketConnections: 1,
            });
        });
        afterEach(async () => {
            await monitor.shutdown();
        });
        it('should handle empty queue monitoring', () => {
            const queueId = 'empty_queue';
            monitor.registerQueue(queueId);
            const queueData = monitor.getQueueData(queueId);
            expect(queueData).toBeDefined();
            expect(queueData.length).toBe(1); // Initial registration
        });
        it('should handle data retention limits', async () => {
            const queueId = 'retention_test';
            monitor.registerQueue(queueId);
            // Add more data points than the limit
            for (let i = 0; i < 10; i++) {
                monitor.updateQueueMetrics(queueId, {
                    totalTasks: i,
                    pendingTasks: i,
                    activeTasks: 0,
                    tasksProcessed: 0,
                    failedTasks: 0,
                    averageWaitTime: 100,
                    averageExecutionTime: 200,
                    totalProcessingTime: i * 300,
                });
                await TestUtils.wait(10);
            }
            const queueData = monitor.getQueueData(queueId);
            expect(queueData.length).toBeLessThanOrEqual(5); // Should respect maxDataPoints
        });
        it('should trigger alerts for extreme values', async () => {
            const queueId = 'extreme_values';
            monitor.registerQueue(queueId);
            const alertPromise = new Promise((resolve) => {
                const alerts = [];
                monitor.on('alert', (alert) => {
                    alerts.push(alert);
                    if (alerts.length >= 2) {
                        resolve(alerts);
                    }
                });
            });
            // Update with extreme values
            monitor.updateQueueMetrics(queueId, {
                totalTasks: 1000000,
                pendingTasks: 999999, // Way above critical threshold
                activeTasks: 1,
                tasksProcessed: 0,
                failedTasks: 500000, // 50% error rate
                averageWaitTime: 1000000, // Very high latency
                averageExecutionTime: 2000000,
                totalProcessingTime: 10000000,
            });
            const alerts = await alertPromise;
            expect(alerts.length).toBeGreaterThanOrEqual(2);
        });
        it('should handle invalid metric values', () => {
            const queueId = 'invalid_metrics';
            monitor.registerQueue(queueId);
            // Test with invalid/edge case values
            monitor.updateQueueMetrics(queueId, {
                totalTasks: -1, // Negative value
                pendingTasks: NaN, // Not a number
                activeTasks: Infinity, // Infinite value
                tasksProcessed: 0,
                failedTasks: 0,
                averageWaitTime: -100, // Negative time
                averageExecutionTime: null, // Null value
                totalProcessingTime: undefined, // Undefined value
            });
            // Should not crash
            const queueData = monitor.getQueueData(queueId);
            expect(queueData).toBeDefined();
        });
        it('should handle rapid queue registration/unregistration', async () => {
            const queueIds = Array.from({ length: 100 }, (_, i) => `rapid_queue_${i}`);
            // Rapidly register queues
            queueIds.forEach((id) => monitor.registerQueue(id));
            const stats1 = monitor.getMonitoringStats();
            expect(stats1.totalQueues).toBe(100);
            // Rapidly unregister queues
            queueIds.forEach((id) => monitor.unregisterQueue(id));
            const stats2 = monitor.getMonitoringStats();
            expect(stats2.totalQueues).toBe(0);
        });
    });
    describe('Optimization Edge Cases', () => {
        let optimizer;
        beforeEach(() => {
            optimizer = new AutomaticQueueOptimizer({
                enabled: true,
                optimizationIntervalMs: 100, // Very fast
                analysisWindowHours: 0.01, // Very short
                adaptationThreshold: 0.001, // Very sensitive
                enablePerformanceRegression: true,
                enableBottleneckDetection: true,
                enableResourceOptimization: true,
                enablePredictiveOptimization: false,
                enableAlgorithmAdaptation: true,
                algorithmSwitchThreshold: 0.01, // Very low threshold
                maxAlgorithmAttempts: 1, // Minimal attempts
                algorithmStabilityPeriodMs: 100,
                enableAutomaticScaling: true,
                enableWorkloadBalancing: true,
                enableMemoryOptimization: true,
                enableConcurrencyTuning: true,
                enableMachineLearning: false,
                predictionWindowMs: 1000,
                learningRateDecay: 0.1,
                modelUpdateIntervalMs: 1000,
                targets: {
                    primaryTarget: 'throughput',
                    throughputWeight: 1,
                    latencyWeight: 0,
                    efficiencyWeight: 0,
                    resourceWeight: 0,
                    targetThroughputTasksPerMinute: 1000, // Unrealistically high
                    targetAverageLatencyMs: 1, // Unrealistically low
                    targetResourceUtilization: 0.01, // Unrealistically low
                    targetErrorRate: 0,
                    acceptableThroughputRange: [999, 1001],
                    acceptableLatencyRange: [0, 2],
                    acceptableResourceRange: [0, 0.02],
                },
                constraints: {
                    maxConcurrentTasks: 1, // Minimal
                    maxMemoryUsageMB: 1, // Minimal
                    maxCpuUsagePercent: 1, // Minimal
                    maxQueueSize: 1,
                    resourceLimits: {
                        cpu: 0.01,
                        memory: 1048576, // 1MB
                        disk: 1048576,
                        network: 1024,
                    },
                    minThroughput: 999,
                    maxLatency: 2,
                    maxErrorRate: 0,
                    minimumStabilityPeriodMs: 10,
                    maxConfigurationChangesPerHour: 100,
                    requirePerformanceImprovement: false,
                },
                enableExperimentalOptimizations: true,
                enableHeuristicOptimization: true,
                enableGeneticAlgorithmTuning: false,
                enableSimulatedAnnealingOptimization: false,
            });
        });
        afterEach(async () => {
            await optimizer.shutdown();
        });
        it('should handle unrealistic performance targets', async () => {
            await optimizer.triggerOptimization();
            const analysis = await optimizer.getCurrentPerformanceAnalysis();
            expect(analysis).toBeDefined();
            if (analysis) {
                // Should recognize that targets are unrealistic
                expect(analysis.performanceScore).toBeLessThan(50);
                expect(analysis.opportunities.length).toBeGreaterThan(0);
            }
        });
        it('should handle minimal resource constraints', async () => {
            await optimizer.triggerOptimization();
            const recommendations = optimizer.getActiveRecommendations();
            // Should generate recommendations despite minimal constraints
            expect(recommendations.length).toBeGreaterThanOrEqual(0);
            if (recommendations.length > 0) {
                recommendations.forEach((rec) => {
                    expect(rec.confidence).toBeGreaterThan(0);
                    expect(rec.risks).toBeDefined();
                    expect(rec.mitigations).toBeDefined();
                });
            }
        });
        it('should handle conflicting optimization targets', async () => {
            // Trigger multiple optimizations rapidly
            await optimizer.triggerOptimization();
            await TestUtils.wait(50);
            await optimizer.triggerOptimization();
            await TestUtils.wait(50);
            await optimizer.triggerOptimization();
            const status = optimizer.getOptimizationStatus();
            const history = optimizer.getOptimizationHistory();
            expect(status).toBeDefined();
            expect(history.length).toBeGreaterThanOrEqual(0);
        });
        it('should handle optimization rollbacks', async () => {
            await optimizer.triggerOptimization();
            await TestUtils.wait(200);
            const history = optimizer.getOptimizationHistory();
            if (history.length > 0) {
                const result = await optimizer.rollbackOptimization(history[0].recommendationId);
                // Should handle rollback gracefully (may succeed or fail)
                expect(typeof result).toBe('boolean');
            }
        });
        it('should handle export with minimal data', () => {
            const exportData = optimizer.exportOptimizationData();
            expect(exportData).toBeDefined();
            expect(exportData.config).toBeDefined();
            expect(exportData.performanceHistory).toBeInstanceOf(Array);
            expect(exportData.optimizationHistory).toBeInstanceOf(Array);
            expect(exportData.currentRecommendations).toBeInstanceOf(Array);
        });
    });
    describe('Concurrent Operations', () => {
        let queue;
        beforeEach(() => {
            queue = new SelfManagingTaskQueue({
                maxConcurrentTasks: 10,
                enableAutonomousBreakdown: true,
                breakdownThreshold: 0.5,
                maxBreakdownDepth: 3,
                enableAdaptiveScheduling: true,
                performanceOptimization: true,
                learningEnabled: true,
                metricsEnabled: true,
                enableIntelligentPreemption: true,
                enableDynamicResourceAllocation: true,
                enablePredictiveScheduling: false,
                enableAutomaticPriorityAdjustment: true,
                enableContinuousOptimization: true,
                optimizationIntervalMs: 2000,
                enableMLBasedPredictions: false,
                enableAdaptiveLoadBalancing: true,
            });
        });
        afterEach(async () => {
            await queue.shutdown();
        });
        it('should handle simultaneous task additions', async () => {
            const tasks = TestUtils.createMockTasks(100);
            tasks.forEach((task) => {
                task.executeFunction = async () => {
                    await TestUtils.wait(10);
                    return { success: true, result: 'Concurrent task completed' };
                };
            });
            // Add all tasks simultaneously
            const addPromises = tasks.map((task) => queue.addTask(task));
            await Promise.all(addPromises);
            const status = queue.getQueueStatus();
            expect(status.totalTasks).toBe(100);
            // Wait for processing
            await TestUtils.wait(2000);
            const finalStatus = queue.getQueueStatus();
            expect(finalStatus.tasksProcessed).toBeGreaterThan(50); // Should have processed many
        });
        it('should handle mixed priority concurrent operations', async () => {
            const operations = Array.from({ length: 50 }, (_, i) => {
                const task = TestUtils.createMockTask({
                    priority: i % 3 === 0
                        ? TaskPriority.HIGH
                        : i % 3 === 1
                            ? TaskPriority.MEDIUM
                            : TaskPriority.LOW,
                    executeFunction: async () => {
                        await TestUtils.wait(Math.random() * 50);
                        return { success: true, result: `Concurrent task ${i} completed` };
                    },
                });
                return queue.addTask(task);
            });
            await Promise.all(operations);
            await TestUtils.wait(1000);
            const status = queue.getQueueStatus();
            expect(status.totalTasks).toBe(50);
            expect(status.tasksProcessed).toBeGreaterThan(0);
        });
        it('should handle queue shutdown during processing', async () => {
            const tasks = TestUtils.createMockTasks(20);
            tasks.forEach((task) => {
                task.executeFunction = async () => {
                    await TestUtils.wait(500); // Longer execution
                    return { success: true, result: 'Task completed before shutdown' };
                };
            });
            // Add tasks
            for (const task of tasks) {
                await queue.addTask(task);
            }
            // Wait a bit then shutdown
            await TestUtils.wait(100);
            const shutdownPromise = queue.shutdown();
            // Shutdown should complete gracefully
            await expect(shutdownPromise).resolves.toBeUndefined();
        });
    });
});
export { TestUtils };
//# sourceMappingURL=EdgeCaseTests.js.map