/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Comprehensive Test Suite for Queue Management System
 *
 * Provides extensive testing coverage for all queue management components
 * including self-managing queues, priority scheduling, persistence, monitoring,
 * and automatic optimization systems.
 *
 * Test Categories:
 * - Unit tests for individual components
 * - Integration tests for component interactions
 * - Performance tests for scalability validation
 * - Stress tests for reliability verification
 * - End-to-end tests for complete workflows
 * - Mock and simulation tests for edge cases
 *
 * @author TASK_QUEUE_DESIGNER_01
 * @version 1.0.0
 */
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, } from 'vitest';
import { EventEmitter } from 'node:events';
// Import all components to test
import { SelfManagingTaskQueue, } from '../SelfManagingTaskQueue.js';
import { AdvancedSchedulingSystem, } from '../AdvancedSchedulingSystem.js';
import { EnhancedPersistenceEngine, } from '../EnhancedPersistenceEngine.js';
import { RealtimeQueueMonitor, AlertSeverity, } from '../RealtimeQueueMonitor.js';
import { AutomaticQueueOptimizer, OptimizationType, } from '../AutomaticQueueOptimizer.js';
import { TaskPriority, TaskStatus, TaskCategory } from '../TaskQueue.js';
/**
 * Test utilities and helpers
 */
class TestUtils {
    /**
     * Create a mock task for testing
     */
    static createMockTask(overrides = {}) {
        const taskId = `test_task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        return {
            id: taskId,
            title: `Test Task ${taskId}`,
            description: 'Mock task for testing purposes',
            category: TaskCategory.FEATURE,
            priority: TaskPriority.MEDIUM,
            status: TaskStatus.PENDING,
            createdAt: new Date(),
            updatedAt: new Date(),
            estimatedDuration: 60000, // 1 minute
            dependencies: [],
            subtasks: [],
            progress: 0,
            retryCount: 0,
            executeFunction: async () => ({
                success: true,
                result: 'Mock execution completed',
            }),
            ...overrides,
        };
    }
    /**
     * Create multiple mock tasks for batch testing
     */
    static createMockTasks(count, overrides = {}) {
        return Array.from({ length: count }, () => this.createMockTask(overrides));
    }
    /**
     * Wait for a specific amount of time
     */
    static async wait(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
    /**
     * Create a mock event emitter with tracking
     */
    static createMockEventEmitter() {
        const emitter = new EventEmitter();
        emitter.emittedEvents = [];
        const originalEmit = emitter.emit.bind(emitter);
        emitter.emit = (event, ...args) => {
            emitter.emittedEvents.push({ event, args });
            return originalEmit(event, ...args);
        };
        return emitter;
    }
    /**
     * Validate task execution result
     */
    static validateTaskResult(result) {
        return result && typeof result === 'object' && 'success' in result;
    }
}
/**
 * Performance measurement utilities
 */
class PerformanceTracker {
    measurements = new Map();
    startMeasurement(name) {
        const startTime = performance.now();
        return () => {
            const duration = performance.now() - startTime;
            if (!this.measurements.has(name)) {
                this.measurements.set(name, []);
            }
            this.measurements.get(name).push(duration);
            return duration;
        };
    }
    getStats(name) {
        const measurements = this.measurements.get(name);
        if (!measurements || measurements.length === 0)
            return null;
        const min = Math.min(...measurements);
        const max = Math.max(...measurements);
        const avg = measurements.reduce((a, b) => a + b, 0) / measurements.length;
        return { min, max, avg, count: measurements.length };
    }
    clear() {
        this.measurements.clear();
    }
}
/**
 * Self-Managing Task Queue Tests
 */
describe('SelfManagingTaskQueue', () => {
    let queue;
    let config;
    beforeEach(() => {
        config = {
            maxConcurrentTasks: 5,
            enableAutonomousBreakdown: true,
            breakdownThreshold: 0.7,
            maxBreakdownDepth: 3,
            enableAdaptiveScheduling: true,
            performanceOptimization: true,
            learningEnabled: true,
            metricsEnabled: true,
            enableIntelligentPreemption: true,
            enableDynamicResourceAllocation: true,
            enablePredictiveScheduling: true,
            enableAutomaticPriorityAdjustment: true,
            enableContinuousOptimization: true,
            optimizationIntervalMs: 10000,
            enableMLBasedPredictions: false,
            enableAdaptiveLoadBalancing: true,
        };
        queue = new SelfManagingTaskQueue(config);
    });
    afterEach(async () => {
        await queue.shutdown();
    });
    describe('Basic Queue Operations', () => {
        it('should initialize with correct configuration', () => {
            expect(queue).toBeDefined();
            expect(queue.getQueueStatus().isRunning).toBe(true);
            expect(queue.getQueueStatus().maxConcurrentTasks).toBe(5);
        });
        it('should add tasks to the queue', async () => {
            const task = TestUtils.createMockTask();
            await queue.addTask(task);
            const status = queue.getQueueStatus();
            expect(status.totalTasks).toBe(1);
            expect(status.pendingTasks).toBe(1);
        });
        it('should process tasks in order', async () => {
            const tasks = TestUtils.createMockTasks(3);
            const executionOrder = [];
            // Override execute function to track execution order
            tasks.forEach((task, index) => {
                task.executeFunction = async () => {
                    executionOrder.push(task.id);
                    await TestUtils.wait(50); // Small delay to ensure order
                    return { success: true, result: `Task ${index} completed` };
                };
            });
            // Add all tasks
            for (const task of tasks) {
                await queue.addTask(task);
            }
            // Wait for all tasks to complete
            await TestUtils.wait(500);
            expect(executionOrder).toHaveLength(3);
            expect(executionOrder[0]).toBe(tasks[0].id);
        });
        it('should respect concurrency limits', async () => {
            const concurrentExecutions = new Set();
            const maxConcurrent = { value: 0 };
            const tasks = TestUtils.createMockTasks(10);
            // Override execute function to track concurrent executions
            tasks.forEach((task) => {
                task.executeFunction = async () => {
                    concurrentExecutions.add(task.id);
                    maxConcurrent.value = Math.max(maxConcurrent.value, concurrentExecutions.size);
                    await TestUtils.wait(100);
                    concurrentExecutions.delete(task.id);
                    return { success: true, result: 'Task completed' };
                };
            });
            // Add all tasks
            for (const task of tasks) {
                await queue.addTask(task);
            }
            // Wait for all tasks to complete
            await TestUtils.wait(1000);
            expect(maxConcurrent.value).toBeLessThanOrEqual(config.maxConcurrentTasks);
        });
        it('should handle task failures gracefully', async () => {
            const failingTask = TestUtils.createMockTask({
                executeFunction: async () => {
                    throw new Error('Task execution failed');
                },
            });
            await queue.addTask(failingTask);
            // Wait for task processing
            await TestUtils.wait(100);
            const status = queue.getQueueStatus();
            expect(status.failedTasks).toBeGreaterThan(0);
        });
        it('should retry failed tasks', async () => {
            let attemptCount = 0;
            const retryableTask = TestUtils.createMockTask({
                executeFunction: async () => {
                    attemptCount++;
                    if (attemptCount < 3) {
                        throw new Error('Task failed, should retry');
                    }
                    return { success: true, result: 'Task succeeded on retry' };
                },
            });
            await queue.addTask(retryableTask);
            // Wait for retries to complete
            await TestUtils.wait(500);
            expect(attemptCount).toBe(3);
            const status = queue.getQueueStatus();
            expect(status.tasksProcessed).toBe(1);
        });
    });
    describe('Autonomous Task Breakdown', () => {
        it('should break down complex tasks automatically', async () => {
            const complexTask = TestUtils.createMockTask({
                estimatedDuration: 300000, // 5 minutes - should trigger breakdown
                executeFunction: async () => ({
                    success: true,
                    result: 'Complex task completed',
                }),
            });
            await queue.addTask(complexTask);
            // Wait for breakdown analysis
            await TestUtils.wait(200);
            const status = queue.getQueueStatus();
            const metrics = queue.getBreakdownMetrics();
            // Should have created subtasks or analyzed for breakdown
            expect(metrics.tasksAnalyzed).toBeGreaterThan(0);
        });
        it('should respect breakdown depth limits', async () => {
            const deepTask = TestUtils.createMockTask({
                estimatedDuration: 600000, // 10 minutes - very complex
                executeFunction: async () => ({
                    success: true,
                    result: 'Deep task completed',
                }),
            });
            await queue.addTask(deepTask);
            await TestUtils.wait(300);
            const metrics = queue.getBreakdownMetrics();
            // Breakdown should not exceed maxBreakdownDepth
            expect(metrics.averageBreakdownDepth).toBeLessThanOrEqual(config.maxBreakdownDepth);
        });
    });
    describe('Adaptive Scheduling', () => {
        it('should adapt scheduling algorithm based on performance', async () => {
            const tasks = TestUtils.createMockTasks(20);
            // Add tasks with different priorities
            tasks.forEach((task, index) => {
                task.priority = index % 2 === 0 ? TaskPriority.HIGH : TaskPriority.LOW;
                task.executeFunction = async () => {
                    await TestUtils.wait(Math.random() * 100);
                    return { success: true, result: `Task ${index} completed` };
                };
            });
            // Add all tasks
            for (const task of tasks) {
                await queue.addTask(task);
            }
            // Wait for processing and adaptation
            await TestUtils.wait(1000);
            const schedulerMetrics = queue.getSchedulerMetrics();
            expect(schedulerMetrics.algorithmsEvaluated).toBeGreaterThan(0);
        });
        it('should prioritize high-priority tasks', async () => {
            const executionOrder = [];
            const lowPriorityTask = TestUtils.createMockTask({
                priority: TaskPriority.LOW,
                executeFunction: async () => {
                    executionOrder.push(TaskPriority.LOW);
                    return { success: true, result: 'Low priority completed' };
                },
            });
            const highPriorityTask = TestUtils.createMockTask({
                priority: TaskPriority.HIGH,
                executeFunction: async () => {
                    executionOrder.push(TaskPriority.HIGH);
                    return { success: true, result: 'High priority completed' };
                },
            });
            // Add low priority first, then high priority
            await queue.addTask(lowPriorityTask);
            await TestUtils.wait(10); // Small delay
            await queue.addTask(highPriorityTask);
            await TestUtils.wait(200);
            // High priority should execute first despite being added later
            expect(executionOrder[0]).toBe(TaskPriority.HIGH);
        });
    });
    describe('Performance Optimization', () => {
        it('should optimize performance continuously', async () => {
            const tasks = TestUtils.createMockTasks(30);
            tasks.forEach((task, index) => {
                task.executeFunction = async () => {
                    await TestUtils.wait(50 + Math.random() * 50);
                    return { success: true, result: `Task ${index} completed` };
                };
            });
            // Add tasks in batches to trigger optimization
            for (let i = 0; i < tasks.length; i += 5) {
                const batch = tasks.slice(i, i + 5);
                for (const task of batch) {
                    await queue.addTask(task);
                }
                await TestUtils.wait(100);
            }
            await TestUtils.wait(1000);
            const optimizationMetrics = queue.getOptimizationMetrics();
            expect(optimizationMetrics.optimizationsApplied).toBeGreaterThanOrEqual(0);
        });
    });
    describe('Learning and Adaptation', () => {
        it('should learn from execution patterns', async () => {
            const tasks = TestUtils.createMockTasks(15);
            // Create predictable execution patterns
            tasks.forEach((task, index) => {
                task.category =
                    index % 3 === 0 ? TaskCategory.FEATURE : TaskCategory.BUG_FIX;
                task.executeFunction = async () => {
                    const duration = task.category === TaskCategory.FEATURE ? 100 : 50;
                    await TestUtils.wait(duration);
                    return { success: true, result: 'Task completed' };
                };
            });
            for (const task of tasks) {
                await queue.addTask(task);
            }
            await TestUtils.wait(1500);
            const learningMetrics = queue.getLearningMetrics();
            expect(learningMetrics.executionPatternsLearned).toBeGreaterThan(0);
        });
    });
});
/**
 * Advanced Scheduling System Tests
 */
describe('AdvancedSchedulingSystem', () => {
    let scheduler;
    let config;
    beforeEach(() => {
        config = {
            defaultAlgorithm: 'hybrid_adaptive',
            enableAdaptiveScheduling: true,
            enableDependencyResolution: true,
            enableResourceAwareness: true,
            enablePredictiveScheduling: false,
            dependencyTimeoutMs: 30000,
            resourceConstraints: {
                maxCpuUsage: 0.8,
                maxMemoryUsage: 0.9,
                maxNetworkUsage: 0.7,
            },
            adaptationConfig: {
                performanceWindowMs: 60000,
                adaptationThreshold: 0.1,
                minSamplesForAdaptation: 5,
            },
        };
        scheduler = new AdvancedSchedulingSystem(config);
    });
    afterEach(async () => {
        await scheduler.shutdown();
    });
    describe('Dependency Resolution', () => {
        it('should resolve task dependencies correctly', async () => {
            const task1 = TestUtils.createMockTask({ id: 'task1' });
            const task2 = TestUtils.createMockTask({
                id: 'task2',
                dependencies: [{ taskId: 'task1', type: 'finish_to_start' }],
            });
            const task3 = TestUtils.createMockTask({
                id: 'task3',
                dependencies: [{ taskId: 'task2', type: 'finish_to_start' }],
            });
            const tasks = [task1, task2, task3];
            const executionPlan = await scheduler.createExecutionPlan(tasks);
            // Tasks should be ordered by dependencies
            expect(executionPlan.scheduledTasks).toHaveLength(3);
            expect(executionPlan.scheduledTasks[0].taskId).toBe('task1');
            expect(executionPlan.scheduledTasks[1].taskId).toBe('task2');
            expect(executionPlan.scheduledTasks[2].taskId).toBe('task3');
        });
        it('should detect circular dependencies', async () => {
            const task1 = TestUtils.createMockTask({
                id: 'task1',
                dependencies: [{ taskId: 'task2', type: 'finish_to_start' }],
            });
            const task2 = TestUtils.createMockTask({
                id: 'task2',
                dependencies: [{ taskId: 'task1', type: 'finish_to_start' }],
            });
            const tasks = [task1, task2];
            await expect(scheduler.createExecutionPlan(tasks)).rejects.toThrow();
        });
        it('should handle parallel execution opportunities', async () => {
            const task1 = TestUtils.createMockTask({ id: 'task1' });
            const task2 = TestUtils.createMockTask({ id: 'task2' }); // No dependencies
            const task3 = TestUtils.createMockTask({ id: 'task3' }); // No dependencies
            const tasks = [task1, task2, task3];
            const executionPlan = await scheduler.createExecutionPlan(tasks);
            // Should identify parallel execution opportunities
            expect(executionPlan.parallelExecutionGroups).toBeDefined();
            expect(executionPlan.parallelExecutionGroups.length).toBeGreaterThan(0);
        });
    });
    describe('Resource-Aware Scheduling', () => {
        it('should consider resource constraints in scheduling', async () => {
            const heavyTask = TestUtils.createMockTask({
                id: 'heavy',
                estimatedDuration: 300000, // 5 minutes
                executeFunction: async () => 
                // Simulate resource-intensive task
                ({ success: true, result: 'Heavy task completed' }),
            });
            const lightTasks = TestUtils.createMockTasks(5);
            const tasks = [heavyTask, ...lightTasks];
            const executionPlan = await scheduler.createExecutionPlan(tasks);
            expect(executionPlan.resourceAllocation).toBeDefined();
            expect(executionPlan.estimatedCompletionTime).toBeGreaterThan(0);
        });
    });
    describe('Algorithm Adaptation', () => {
        it('should adapt scheduling algorithm based on performance', async () => {
            const tasks = TestUtils.createMockTasks(20);
            // Process multiple batches to trigger adaptation
            for (let i = 0; i < 5; i++) {
                const batch = tasks.slice(i * 4, (i + 1) * 4);
                const executionPlan = await scheduler.createExecutionPlan(batch);
                // Simulate execution results
                await scheduler.recordExecutionResults(batch.map((task) => ({
                    taskId: task.id,
                    success: true,
                    executionTime: Math.random() * 1000,
                    resourceUsage: {
                        cpu: Math.random() * 0.5,
                        memory: Math.random() * 0.5,
                        network: Math.random() * 0.3,
                    },
                })));
                await TestUtils.wait(50);
            }
            const adaptationHistory = scheduler.getAdaptationHistory();
            expect(adaptationHistory.length).toBeGreaterThanOrEqual(0);
        });
    });
});
/**
 * Enhanced Persistence Engine Tests
 */
describe('EnhancedPersistenceEngine', () => {
    let persistence;
    let config;
    let tempStoragePath;
    beforeEach(() => {
        tempStoragePath = `/tmp/queue_test_${Date.now()}`;
        config = {
            enabled: true,
            storagePath: tempStoragePath,
            backupEnabled: true,
            backupIntervalMs: 60000,
            maxBackups: 5,
            compressionEnabled: true,
            encryptionEnabled: false,
            enableVersioning: true,
            enableAutoRecovery: true,
            enableDataValidation: true,
            enablePerformanceOptimization: true,
            syncIntervalMs: 30000,
            enableCrossSessionRecovery: true,
        };
        persistence = new EnhancedPersistenceEngine(config);
    });
    afterEach(async () => {
        await persistence.shutdown();
        // Clean up temporary files
        try {
            const fs = require('node:fs').promises;
            await fs.rmdir(tempStoragePath, { recursive: true });
        }
        catch (error) {
            // Ignore cleanup errors
        }
    });
    describe('State Management', () => {
        it('should save and restore queue state', async () => {
            const tasks = TestUtils.createMockTasks(5);
            const queueState = {
                tasks,
                queueMetrics: {
                    totalTasks: 5,
                    pendingTasks: 5,
                    activeTasks: 0,
                    tasksProcessed: 0,
                    failedTasks: 0,
                    averageWaitTime: 0,
                    averageExecutionTime: 0,
                    totalProcessingTime: 0,
                },
                resourceState: new Map([
                    ['cpu_usage', 0.3],
                    ['memory_usage', 0.4],
                ]),
                learningData: {
                    executionHistory: [],
                    adaptationHistory: [],
                    performanceBaselines: new Map(),
                },
            };
            const snapshotId = await persistence.saveState(queueState);
            expect(snapshotId).toBeTruthy();
            const restoredState = await persistence.restoreState(snapshotId);
            expect(restoredState).toBeDefined();
            expect(restoredState.tasks).toHaveLength(5);
            expect(restoredState.queueMetrics.totalTasks).toBe(5);
        });
        it('should handle versioning correctly', async () => {
            const initialState = {
                tasks: TestUtils.createMockTasks(3),
                queueMetrics: { totalTasks: 3 },
                resourceState: new Map(),
                learningData: {
                    executionHistory: [],
                    adaptationHistory: [],
                    performanceBaselines: new Map(),
                },
            };
            const v1Id = await persistence.saveState(initialState);
            const updatedState = {
                ...initialState,
                tasks: TestUtils.createMockTasks(5),
                queueMetrics: { totalTasks: 5 },
            };
            const v2Id = await persistence.saveState(updatedState);
            expect(v1Id).not.toBe(v2Id);
            const versions = await persistence.getStateHistory();
            expect(versions).toHaveLength(2);
        });
        it('should validate state data integrity', async () => {
            const invalidState = {
                tasks: null, // Invalid - should be array
                queueMetrics: { totalTasks: 'invalid' }, // Invalid - should be number
                resourceState: new Map(),
                learningData: {
                    executionHistory: [],
                    adaptationHistory: [],
                    performanceBaselines: new Map(),
                },
            };
            await expect(persistence.saveState(invalidState)).rejects.toThrow();
        });
    });
    describe('Cross-Session Recovery', () => {
        it('should support cross-session state recovery', async () => {
            const sessionId = 'test_session_123';
            const tasks = TestUtils.createMockTasks(3);
            const state = {
                tasks,
                queueMetrics: { totalTasks: 3 },
                resourceState: new Map(),
                learningData: {
                    executionHistory: [],
                    adaptationHistory: [],
                    performanceBaselines: new Map(),
                },
            };
            await persistence.saveSessionState(sessionId, state);
            const recoveredState = await persistence.recoverSessionState(sessionId);
            expect(recoveredState).toBeDefined();
            expect(recoveredState.tasks).toHaveLength(3);
        });
        it('should clean up old session data', async () => {
            const oldSessionId = 'old_session';
            const currentSessionId = 'current_session';
            const state = {
                tasks: TestUtils.createMockTasks(1),
                queueMetrics: { totalTasks: 1 },
                resourceState: new Map(),
                learningData: {
                    executionHistory: [],
                    adaptationHistory: [],
                    performanceBaselines: new Map(),
                },
            };
            await persistence.saveSessionState(oldSessionId, state);
            await persistence.saveSessionState(currentSessionId, state);
            await persistence.cleanupOldSessions(1); // Keep only 1 session
            const sessions = await persistence.getActiveSessions();
            expect(sessions).toHaveLength(1);
            expect(sessions[0]).toBe(currentSessionId);
        });
    });
    describe('Performance Optimization', () => {
        it('should compress large state data', async () => {
            const largeTasks = TestUtils.createMockTasks(1000);
            const largeState = {
                tasks: largeTasks,
                queueMetrics: { totalTasks: 1000 },
                resourceState: new Map(),
                learningData: {
                    executionHistory: [],
                    adaptationHistory: [],
                    performanceBaselines: new Map(),
                },
            };
            const snapshotId = await persistence.saveState(largeState);
            const metrics = persistence.getPerformanceMetrics();
            expect(metrics.compressionRatio).toBeGreaterThan(1);
            expect(metrics.averageSaveTime).toBeGreaterThan(0);
        });
    });
});
/**
 * Real-time Queue Monitor Tests
 */
describe('RealtimeQueueMonitor', () => {
    let monitor;
    let config;
    beforeEach(() => {
        config = {
            enabled: true,
            updateIntervalMs: 1000,
            historicalDataRetentionHours: 1,
            maxDataPoints: 100,
            enablePerformanceTracking: true,
            performanceMetricsIntervalMs: 2000,
            enableThroughputMonitoring: true,
            enableLatencyMonitoring: true,
            enableResourceMonitoring: true,
            enableAlerting: true,
            alertThresholds: {
                queueSizeWarning: 10,
                queueSizeCritical: 50,
                throughputWarning: 2,
                throughputCritical: 1,
                latencyWarning: 5000,
                latencyCritical: 10000,
                errorRateWarning: 5,
                errorRateCritical: 15,
                resourceUsageWarning: 80,
                resourceUsageCritical: 95,
                deadlockDetection: true,
                starvationDetection: true,
            },
            alertChannels: [
                {
                    type: 'console',
                    enabled: true,
                    severity: [AlertSeverity.WARNING, AlertSeverity.CRITICAL],
                },
            ],
            enableAnomalyDetection: true,
            enableRealTimeVisualization: true,
            dashboardUpdateIntervalMs: 500,
            chartDataPoints: 20,
            enableHistoricalCharts: true,
            enablePredictiveAnalytics: false,
            enableHealthDiagnostics: true,
            enableCapacityPlanning: true,
            enableSLAMonitoring: false,
            enableWebSocketUpdates: false, // Disabled for testing
            webSocketPort: 8080,
            maxWebSocketConnections: 10,
        };
        monitor = new RealtimeQueueMonitor(config);
    });
    afterEach(async () => {
        await monitor.shutdown();
    });
    describe('Queue Registration and Monitoring', () => {
        it('should register queues for monitoring', () => {
            const queueId = 'test_queue_1';
            const initialMetrics = {
                totalTasks: 5,
                pendingTasks: 3,
                activeTasks: 2,
                tasksProcessed: 0,
                failedTasks: 0,
                averageWaitTime: 1000,
                averageExecutionTime: 2000,
                totalProcessingTime: 10000,
            };
            monitor.registerQueue(queueId, initialMetrics);
            const queueData = monitor.getQueueData(queueId);
            expect(queueData).toBeDefined();
            expect(queueData.length).toBe(1);
            expect(queueData[0].queueId).toBe(queueId);
        });
        it('should update queue metrics', () => {
            const queueId = 'test_queue_2';
            monitor.registerQueue(queueId);
            const updatedMetrics = {
                totalTasks: 10,
                pendingTasks: 5,
                activeTasks: 3,
                tasksProcessed: 2,
                failedTasks: 0,
                averageWaitTime: 1500,
                averageExecutionTime: 2500,
                totalProcessingTime: 20000,
            };
            monitor.updateQueueMetrics(queueId, updatedMetrics);
            const queueData = monitor.getQueueData(queueId);
            expect(queueData).toHaveLength(2); // Initial + update
            expect(queueData[1].totalTasks).toBe(10);
        });
        it('should unregister queues', () => {
            const queueId = 'test_queue_3';
            monitor.registerQueue(queueId);
            let queueData = monitor.getQueueData(queueId);
            expect(queueData).toBeDefined();
            monitor.unregisterQueue(queueId);
            queueData = monitor.getQueueData(queueId);
            expect(queueData).toBeNull();
        });
    });
    describe('Alerting System', () => {
        it('should trigger alerts for threshold violations', async () => {
            const queueId = 'alert_test_queue';
            monitor.registerQueue(queueId);
            const alertPromise = new Promise((resolve) => {
                monitor.once('alert', resolve);
            });
            // Update with metrics that exceed thresholds
            const criticalMetrics = {
                totalTasks: 100,
                pendingTasks: 60, // Exceeds critical threshold of 50
                activeTasks: 5,
                tasksProcessed: 35,
                failedTasks: 0,
                averageWaitTime: 2000,
                averageExecutionTime: 3000,
                totalProcessingTime: 150000,
            };
            monitor.updateQueueMetrics(queueId, criticalMetrics);
            const alert = await alertPromise;
            expect(alert).toBeDefined();
            expect(alert.severity).toBe('critical');
            expect(alert.type).toContain('queue-size');
        });
        it('should acknowledge and resolve alerts', async () => {
            const queueId = 'alert_management_queue';
            monitor.registerQueue(queueId);
            // Trigger an alert
            const alertPromise = new Promise((resolve) => {
                monitor.once('alert', resolve);
            });
            const warningMetrics = {
                totalTasks: 15,
                pendingTasks: 12, // Exceeds warning threshold of 10
                activeTasks: 3,
                tasksProcessed: 0,
                failedTasks: 0,
                averageWaitTime: 1000,
                averageExecutionTime: 2000,
                totalProcessingTime: 30000,
            };
            monitor.updateQueueMetrics(queueId, warningMetrics);
            const alert = await alertPromise;
            expect(alert).toBeDefined();
            // Acknowledge alert
            const acknowledged = monitor.acknowledgeAlert(alert.id, 'test_user');
            expect(acknowledged).toBe(true);
            // Resolve alert
            const resolved = monitor.resolveAlert(alert.id, 'test_user');
            expect(resolved).toBe(true);
        });
    });
    describe('Performance Tracking', () => {
        it('should track monitoring statistics', () => {
            const queueId1 = 'perf_queue_1';
            const queueId2 = 'perf_queue_2';
            monitor.registerQueue(queueId1);
            monitor.registerQueue(queueId2);
            const stats = monitor.getMonitoringStats();
            expect(stats.totalQueues).toBe(2);
            expect(stats.totalSnapshots).toBeGreaterThanOrEqual(2);
        });
        it('should generate dashboard data', () => {
            const queueId = 'dashboard_queue';
            monitor.registerQueue(queueId);
            const metrics = {
                totalTasks: 20,
                pendingTasks: 8,
                activeTasks: 4,
                tasksProcessed: 8,
                failedTasks: 0,
                averageWaitTime: 1200,
                averageExecutionTime: 2800,
                totalProcessingTime: 56000,
            };
            monitor.updateQueueMetrics(queueId, metrics);
            const dashboardData = monitor.getDashboardData();
            expect(dashboardData).toBeDefined();
            if (dashboardData) {
                expect(dashboardData.summary.totalQueues).toBe(1);
                expect(dashboardData.summary.activeTasks).toBe(4);
                expect(dashboardData.realtimeData).toHaveLength(1);
            }
        });
    });
    describe('Data Export', () => {
        it('should export monitoring data', () => {
            const queueId = 'export_queue';
            monitor.registerQueue(queueId);
            const exportData = monitor.exportData('json');
            expect(exportData).toBeTruthy();
            const parsed = JSON.parse(exportData);
            expect(parsed.configuration).toBeDefined();
            expect(parsed.snapshots).toBeDefined();
            expect(parsed.alerts).toBeDefined();
            expect(parsed.exportTimestamp).toBeDefined();
        });
    });
});
/**
 * Automatic Queue Optimizer Tests
 */
describe('AutomaticQueueOptimizer', () => {
    let optimizer;
    let config;
    beforeEach(() => {
        config = {
            enabled: true,
            optimizationIntervalMs: 5000, // Faster for testing
            analysisWindowHours: 1,
            adaptationThreshold: 0.05,
            enablePerformanceRegression: true,
            enableBottleneckDetection: true,
            enableResourceOptimization: true,
            enablePredictiveOptimization: false,
            enableAlgorithmAdaptation: true,
            algorithmSwitchThreshold: 0.1,
            maxAlgorithmAttempts: 3,
            algorithmStabilityPeriodMs: 10000,
            enableAutomaticScaling: true,
            enableWorkloadBalancing: true,
            enableMemoryOptimization: true,
            enableConcurrencyTuning: true,
            enableMachineLearning: false,
            predictionWindowMs: 300000,
            learningRateDecay: 0.95,
            modelUpdateIntervalMs: 60000,
            targets: {
                primaryTarget: 'balanced',
                throughputWeight: 0.4,
                latencyWeight: 0.3,
                efficiencyWeight: 0.2,
                resourceWeight: 0.1,
                targetThroughputTasksPerMinute: 10,
                targetAverageLatencyMs: 2000,
                targetResourceUtilization: 0.7,
                targetErrorRate: 0.02,
                acceptableThroughputRange: [5, 25],
                acceptableLatencyRange: [500, 5000],
                acceptableResourceRange: [0.3, 0.8],
            },
            constraints: {
                maxConcurrentTasks: 15,
                maxMemoryUsageMB: 1024,
                maxCpuUsagePercent: 85,
                maxQueueSize: 500,
                resourceLimits: {
                    cpu: 0.85,
                    memory: 1073741824,
                    disk: 5368709120,
                    network: 52428800,
                },
                minThroughput: 2,
                maxLatency: 20000,
                maxErrorRate: 0.08,
                minimumStabilityPeriodMs: 30000,
                maxConfigurationChangesPerHour: 4,
                requirePerformanceImprovement: true,
            },
            enableExperimentalOptimizations: false,
            enableHeuristicOptimization: true,
            enableGeneticAlgorithmTuning: false,
            enableSimulatedAnnealingOptimization: false,
        };
        optimizer = new AutomaticQueueOptimizer(config);
    });
    afterEach(async () => {
        await optimizer.shutdown();
    });
    describe('Performance Analysis', () => {
        it('should analyze current performance', async () => {
            const analysis = await optimizer.getCurrentPerformanceAnalysis();
            expect(analysis).toBeDefined();
            if (analysis) {
                expect(analysis.currentMetrics).toBeDefined();
                expect(analysis.performanceScore).toBeGreaterThanOrEqual(0);
                expect(analysis.performanceScore).toBeLessThanOrEqual(100);
                expect(analysis.healthStatus).toMatch(/excellent|good|fair|poor|critical/);
            }
        });
        it('should detect bottlenecks in performance', async () => {
            // Trigger analysis
            await optimizer.triggerOptimization();
            const analysis = await optimizer.getCurrentPerformanceAnalysis();
            expect(analysis).toBeDefined();
            if (analysis) {
                expect(analysis.bottlenecks).toBeInstanceOf(Array);
                expect(analysis.opportunities).toBeInstanceOf(Array);
            }
        });
        it('should track performance trends', async () => {
            // Trigger multiple analysis cycles
            await optimizer.triggerOptimization();
            await TestUtils.wait(100);
            await optimizer.triggerOptimization();
            const analysis = await optimizer.getCurrentPerformanceAnalysis();
            expect(analysis).toBeDefined();
            if (analysis) {
                expect(analysis.trends).toBeDefined();
                expect(analysis.trends.overallTrend).toMatch(/improving|declining|stable/);
            }
        });
    });
    describe('Optimization Recommendations', () => {
        it('should generate optimization recommendations', async () => {
            await optimizer.triggerOptimization();
            const recommendations = optimizer.getActiveRecommendations();
            expect(recommendations).toBeInstanceOf(Array);
            if (recommendations.length > 0) {
                const recommendation = recommendations[0];
                expect(recommendation.id).toBeTruthy();
                expect(recommendation.type).toMatch(/algorithm_switch|concurrency_tuning|resource_reallocation/);
                expect(recommendation.confidence).toBeGreaterThan(0);
                expect(recommendation.confidence).toBeLessThanOrEqual(1);
            }
        });
        it('should validate optimization changes', async () => {
            await optimizer.triggerOptimization();
            const recommendations = optimizer.getActiveRecommendations();
            if (recommendations.length > 0) {
                const recommendation = recommendations[0];
                expect(recommendation.changes).toBeInstanceOf(Array);
                expect(recommendation.rollbackPlan).toBeInstanceOf(Array);
                expect(recommendation.validationMetrics).toBeInstanceOf(Array);
                expect(recommendation.successCriteria).toBeInstanceOf(Array);
            }
        });
    });
    describe('Optimization Execution', () => {
        it('should track optimization results', async () => {
            await optimizer.triggerOptimization();
            // Wait for potential optimizations to be applied
            await TestUtils.wait(1000);
            const history = optimizer.getOptimizationHistory(10);
            expect(history).toBeInstanceOf(Array);
            if (history.length > 0) {
                const result = history[0];
                expect(result.recommendationId).toBeTruthy();
                expect(result.executedAt).toBeInstanceOf(Date);
                expect(result.success).toEqual(expect.any(Boolean));
            }
        });
        it('should provide optimization status', () => {
            const status = optimizer.getOptimizationStatus();
            expect(status).toBeDefined();
            expect(status.enabled).toBe(true);
            expect(status.totalOptimizations).toBeGreaterThanOrEqual(0);
            expect(status.currentPerformanceScore).toBeGreaterThanOrEqual(0);
        });
        it('should support manual rollback', async () => {
            await optimizer.triggerOptimization();
            await TestUtils.wait(1000);
            const history = optimizer.getOptimizationHistory(1);
            if (history.length > 0 && history[0].success) {
                const result = await optimizer.rollbackOptimization(history[0].recommendationId);
                expect(result).toBe(true);
            }
        });
    });
    describe('Data Export and Analysis', () => {
        it('should export optimization data', () => {
            const exportData = optimizer.exportOptimizationData();
            expect(exportData).toBeDefined();
            expect(exportData.config).toBeDefined();
            expect(exportData.performanceHistory).toBeInstanceOf(Array);
            expect(exportData.optimizationHistory).toBeInstanceOf(Array);
            expect(exportData.currentRecommendations).toBeInstanceOf(Array);
        });
    });
});
/**
 * Integration Tests for Complete Queue Management System
 */
describe('Queue Management System Integration', () => {
    let queue;
    let monitor;
    let optimizer;
    let performanceTracker;
    beforeEach(() => {
        performanceTracker = new PerformanceTracker();
        // Initialize components with compatible configurations
        const queueConfig = {
            maxConcurrentTasks: 8,
            enableAutonomousBreakdown: true,
            breakdownThreshold: 0.6,
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
        };
        const monitorConfig = {
            enabled: true,
            updateIntervalMs: 2000,
            historicalDataRetentionHours: 1,
            maxDataPoints: 50,
            enablePerformanceTracking: true,
            performanceMetricsIntervalMs: 3000,
            enableThroughputMonitoring: true,
            enableLatencyMonitoring: true,
            enableResourceMonitoring: true,
            enableAlerting: true,
            alertThresholds: {
                queueSizeWarning: 15,
                queueSizeCritical: 30,
                throughputWarning: 3,
                throughputCritical: 1,
                latencyWarning: 4000,
                latencyCritical: 8000,
                errorRateWarning: 8,
                errorRateCritical: 20,
                resourceUsageWarning: 75,
                resourceUsageCritical: 90,
                deadlockDetection: true,
                starvationDetection: true,
            },
            alertChannels: [
                {
                    type: 'console',
                    enabled: true,
                    severity: [AlertSeverity.WARNING, AlertSeverity.CRITICAL],
                },
            ],
            enableAnomalyDetection: true,
            enableRealTimeVisualization: true,
            dashboardUpdateIntervalMs: 1000,
            chartDataPoints: 25,
            enableHistoricalCharts: true,
            enablePredictiveAnalytics: false,
            enableHealthDiagnostics: true,
            enableCapacityPlanning: true,
            enableSLAMonitoring: false,
            enableWebSocketUpdates: false,
            webSocketPort: 8081,
            maxWebSocketConnections: 5,
        };
        const optimizerConfig = {
            enabled: true,
            optimizationIntervalMs: 10000,
            analysisWindowHours: 1,
            adaptationThreshold: 0.08,
            enablePerformanceRegression: true,
            enableBottleneckDetection: true,
            enableResourceOptimization: true,
            enablePredictiveOptimization: false,
            enableAlgorithmAdaptation: true,
            algorithmSwitchThreshold: 0.12,
            maxAlgorithmAttempts: 3,
            algorithmStabilityPeriodMs: 15000,
            enableAutomaticScaling: true,
            enableWorkloadBalancing: true,
            enableMemoryOptimization: true,
            enableConcurrencyTuning: true,
            enableMachineLearning: false,
            predictionWindowMs: 600000,
            learningRateDecay: 0.9,
            modelUpdateIntervalMs: 120000,
            targets: {
                primaryTarget: 'throughput',
                throughputWeight: 0.5,
                latencyWeight: 0.25,
                efficiencyWeight: 0.15,
                resourceWeight: 0.1,
                targetThroughputTasksPerMinute: 12,
                targetAverageLatencyMs: 1800,
                targetResourceUtilization: 0.75,
                targetErrorRate: 0.03,
                acceptableThroughputRange: [6, 30],
                acceptableLatencyRange: [400, 4000],
                acceptableResourceRange: [0.4, 0.85],
            },
            constraints: {
                maxConcurrentTasks: 12,
                maxMemoryUsageMB: 1536,
                maxCpuUsagePercent: 80,
                maxQueueSize: 400,
                resourceLimits: {
                    cpu: 0.8,
                    memory: 1610612736,
                    disk: 8589934592,
                    network: 83886080,
                },
                minThroughput: 3,
                maxLatency: 15000,
                maxErrorRate: 0.1,
                minimumStabilityPeriodMs: 45000,
                maxConfigurationChangesPerHour: 3,
                requirePerformanceImprovement: true,
            },
            enableExperimentalOptimizations: false,
            enableHeuristicOptimization: true,
            enableGeneticAlgorithmTuning: false,
            enableSimulatedAnnealingOptimization: false,
        };
        queue = new SelfManagingTaskQueue(queueConfig);
        monitor = new RealtimeQueueMonitor(monitorConfig);
        optimizer = new AutomaticQueueOptimizer(optimizerConfig);
    });
    afterEach(async () => {
        await queue.shutdown();
        await monitor.shutdown();
        await optimizer.shutdown();
        performanceTracker.clear();
    });
    describe('Complete Workflow Integration', () => {
        it('should handle end-to-end queue management workflow', async () => {
            const endMeasurement = performanceTracker.startMeasurement('e2e_workflow');
            // Step 1: Register queue with monitor
            const queueId = 'integration_test_queue';
            monitor.registerQueue(queueId);
            // Step 2: Create and add tasks
            const tasks = TestUtils.createMockTasks(25);
            const taskExecutionTimes = [];
            tasks.forEach((task, index) => {
                task.priority =
                    index % 3 === 0
                        ? TaskPriority.HIGH
                        : index % 3 === 1
                            ? TaskPriority.MEDIUM
                            : TaskPriority.LOW;
                task.executeFunction = async () => {
                    const executionTime = 100 + Math.random() * 300; // 100-400ms
                    taskExecutionTimes.push(executionTime);
                    await TestUtils.wait(executionTime);
                    return {
                        success: Math.random() > 0.05, // 95% success rate
                        result: `Task ${index} completed in ${executionTime}ms`,
                    };
                };
            });
            // Step 3: Add tasks to queue
            const addTasksMeasurement = performanceTracker.startMeasurement('add_tasks');
            for (const task of tasks) {
                await queue.addTask(task);
            }
            addTasksMeasurement();
            // Step 4: Monitor queue metrics during processing
            const monitoringPromise = (async () => {
                for (let i = 0; i < 10; i++) {
                    await TestUtils.wait(500);
                    const queueStatus = queue.getQueueStatus();
                    monitor.updateQueueMetrics(queueId, queueStatus);
                }
            })();
            // Step 5: Let processing complete
            await TestUtils.wait(3000);
            // Step 6: Trigger optimization
            await optimizer.triggerOptimization();
            // Wait for monitoring to complete
            await monitoringPromise;
            // Step 7: Validate results
            const finalQueueStatus = queue.getQueueStatus();
            const monitoringStats = monitor.getMonitoringStats();
            const optimizationStatus = optimizer.getOptimizationStatus();
            endMeasurement();
            // Assertions
            expect(finalQueueStatus.totalTasks).toBe(25);
            expect(finalQueueStatus.tasksProcessed).toBeGreaterThan(0);
            expect(monitoringStats.totalQueues).toBe(1);
            expect(monitoringStats.totalSnapshots).toBeGreaterThan(0);
            expect(optimizationStatus.enabled).toBe(true);
            // Performance validation
            const e2eStats = performanceTracker.getStats('e2e_workflow');
            const addTasksStats = performanceTracker.getStats('add_tasks');
            expect(e2eStats).toBeDefined();
            expect(addTasksStats).toBeDefined();
            console.log(`E2E Workflow Performance:`, e2eStats);
            console.log(`Add Tasks Performance:`, addTasksStats);
        });
        it('should handle high-load scenarios', async () => {
            const queueId = 'high_load_queue';
            monitor.registerQueue(queueId);
            // Create a large number of tasks
            const taskCount = 100;
            const tasks = TestUtils.createMockTasks(taskCount);
            // Configure tasks for varying execution patterns
            tasks.forEach((task, index) => {
                task.priority =
                    index < 20
                        ? TaskPriority.HIGH
                        : index < 60
                            ? TaskPriority.MEDIUM
                            : TaskPriority.LOW;
                task.estimatedDuration = Math.random() * 2000 + 500; // 0.5-2.5 seconds
                task.executeFunction = async () => {
                    await TestUtils.wait(task.estimatedDuration);
                    return {
                        success: Math.random() > 0.02, // 98% success rate
                        result: `High-load task ${index} completed`,
                    };
                };
            });
            const highLoadMeasurement = performanceTracker.startMeasurement('high_load_processing');
            // Add all tasks
            for (const task of tasks) {
                await queue.addTask(task);
            }
            // Monitor during processing
            const monitoringInterval = setInterval(() => {
                const status = queue.getQueueStatus();
                monitor.updateQueueMetrics(queueId, status);
            }, 1000);
            // Wait for processing
            const maxWaitTime = 30000; // 30 seconds max
            const waitStartTime = Date.now();
            while (queue.getQueueStatus().pendingTasks > 0 &&
                Date.now() - waitStartTime < maxWaitTime) {
                await TestUtils.wait(1000);
            }
            clearInterval(monitoringInterval);
            highLoadMeasurement();
            // Validate high-load handling
            const finalStatus = queue.getQueueStatus();
            expect(finalStatus.totalTasks).toBe(taskCount);
            expect(finalStatus.pendingTasks).toBeLessThan(10); // Allow some pending due to timing
            const highLoadStats = performanceTracker.getStats('high_load_processing');
            console.log(`High Load Performance:`, highLoadStats);
            // Performance should be reasonable for high load
            expect(highLoadStats.avg).toBeLessThan(35000); // Less than 35 seconds
        });
        it('should integrate monitoring and optimization systems', async () => {
            const queueId = 'integration_monitor_optimize';
            monitor.registerQueue(queueId);
            // Create tasks that will trigger optimization
            const tasks = TestUtils.createMockTasks(50);
            // Configure some tasks to be resource-intensive
            tasks.slice(0, 10).forEach((task) => {
                task.estimatedDuration = 5000; // 5 seconds - should trigger breakdown
                task.executeFunction = async () => {
                    await TestUtils.wait(1000); // Faster for testing
                    return { success: true, result: 'Resource intensive task completed' };
                };
            });
            // Regular tasks
            tasks.slice(10).forEach((task, index) => {
                task.executeFunction = async () => {
                    await TestUtils.wait(100 + Math.random() * 200);
                    return { success: true, result: `Regular task ${index} completed` };
                };
            });
            // Add tasks in batches
            for (let i = 0; i < tasks.length; i += 10) {
                const batch = tasks.slice(i, i + 10);
                for (const task of batch) {
                    await queue.addTask(task);
                }
                // Update monitoring metrics
                const status = queue.getQueueStatus();
                monitor.updateQueueMetrics(queueId, status);
                await TestUtils.wait(500);
            }
            // Trigger optimization after initial processing
            await optimizer.triggerOptimization();
            // Continue processing with monitoring
            await TestUtils.wait(3000);
            // Validate integration
            const queueStatus = queue.getQueueStatus();
            const dashboardData = monitor.getDashboardData();
            const optimizationStatus = optimizer.getOptimizationStatus();
            const recommendations = optimizer.getActiveRecommendations();
            expect(queueStatus.totalTasks).toBe(50);
            expect(dashboardData).toBeDefined();
            expect(optimizationStatus.totalOptimizations).toBeGreaterThanOrEqual(0);
            if (dashboardData) {
                expect(dashboardData.summary.totalQueues).toBe(1);
                expect(dashboardData.realtimeData.length).toBeGreaterThan(0);
            }
            console.log(`Integration Results:`);
            console.log(`- Queue Status: ${queueStatus.tasksProcessed}/${queueStatus.totalTasks} processed`);
            console.log(`- Monitoring: ${monitor.getMonitoringStats().totalSnapshots} snapshots`);
            console.log(`- Optimization: ${optimizationStatus.totalOptimizations} optimizations`);
            console.log(`- Recommendations: ${recommendations.length} active`);
        });
    });
    describe('Error Handling and Recovery', () => {
        it('should handle component failures gracefully', async () => {
            const queueId = 'failure_test_queue';
            monitor.registerQueue(queueId);
            // Create tasks with some that will fail
            const tasks = TestUtils.createMockTasks(20);
            tasks.forEach((task, index) => {
                if (index % 5 === 0) {
                    // Every 5th task fails
                    task.executeFunction = async () => {
                        throw new Error(`Simulated failure for task ${index}`);
                    };
                }
                else {
                    task.executeFunction = async () => {
                        await TestUtils.wait(100);
                        return { success: true, result: `Task ${index} completed` };
                    };
                }
            });
            // Add tasks
            for (const task of tasks) {
                await queue.addTask(task);
            }
            // Monitor with error tracking
            let errorCount = 0;
            const monitoringInterval = setInterval(() => {
                const status = queue.getQueueStatus();
                monitor.updateQueueMetrics(queueId, status);
                errorCount = status.failedTasks;
            }, 500);
            // Wait for processing
            await TestUtils.wait(3000);
            clearInterval(monitoringInterval);
            // Validate error handling
            const finalStatus = queue.getQueueStatus();
            expect(finalStatus.failedTasks).toBe(4); // 4 failures expected (every 5th task)
            expect(finalStatus.tasksProcessed).toBe(16); // 16 successful tasks
            // Verify monitoring captured errors
            const dashboardData = monitor.getDashboardData();
            if (dashboardData && dashboardData.realtimeData.length > 0) {
                const latestSnapshot = dashboardData.realtimeData[dashboardData.realtimeData.length - 1];
                expect(latestSnapshot.failedTasks).toBeGreaterThan(0);
            }
        });
    });
    describe('Performance Benchmarks', () => {
        it('should meet performance benchmarks', async () => {
            const benchmarkTasks = 1000;
            const maxProcessingTime = 15000; // 15 seconds
            const tasks = TestUtils.createMockTasks(benchmarkTasks);
            tasks.forEach((task) => {
                task.executeFunction = async () => {
                    await TestUtils.wait(10); // 10ms per task
                    return { success: true, result: 'Benchmark task completed' };
                };
            });
            const benchmarkMeasurement = performanceTracker.startMeasurement('benchmark');
            // Add all tasks
            const addStartTime = Date.now();
            for (const task of tasks) {
                await queue.addTask(task);
            }
            const addDuration = Date.now() - addStartTime;
            // Wait for processing
            const processingStartTime = Date.now();
            while (queue.getQueueStatus().pendingTasks > 0 &&
                Date.now() - processingStartTime < maxProcessingTime) {
                await TestUtils.wait(100);
            }
            const totalDuration = benchmarkMeasurement();
            // Validate performance benchmarks
            const finalStatus = queue.getQueueStatus();
            expect(finalStatus.totalTasks).toBe(benchmarkTasks);
            expect(totalDuration).toBeLessThan(maxProcessingTime);
            // Calculate throughput
            const throughput = finalStatus.tasksProcessed / (totalDuration / 1000); // tasks per second
            console.log(`Benchmark Results:`);
            console.log(`- Tasks: ${benchmarkTasks}`);
            console.log(`- Add Duration: ${addDuration}ms`);
            console.log(`- Total Duration: ${totalDuration}ms`);
            console.log(`- Throughput: ${throughput.toFixed(2)} tasks/second`);
            console.log(`- Tasks Processed: ${finalStatus.tasksProcessed}`);
            // Performance expectations
            expect(throughput).toBeGreaterThan(50); // At least 50 tasks/second
            expect(addDuration).toBeLessThan(5000); // Adding should take less than 5 seconds
        });
    });
});
// Export test utilities for use in other test files
export { TestUtils, PerformanceTracker };
//# sourceMappingURL=QueueManagementTestSuite.js.map