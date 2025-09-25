/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TaskManagementSystemFactory } from '../../index.js';
import { TaskExecutionEngine } from '../../TaskExecutionEngine.complete.js';
import { ExecutionMonitoringSystem } from '../../ExecutionMonitoringSystem.js';
import { DependencyResolver } from '../../DependencyResolver.js';
import { TaskPriorityScheduler } from '../../TaskPriorityScheduler.js';
/**
 * @fileoverview Performance and stress testing suite for task management
 *
 * Tests system performance under various load conditions, memory usage,
 * concurrent operations, and scalability limits.
 */
describe('Task Management Performance Tests', () => {
    let config;
    let system;
    beforeEach(async () => {
        config = {
            getModel: vi.fn(() => 'gemini-2.0-pro'),
            getToolRegistry: vi.fn(() => ({
                getTool: vi.fn(),
                getAllTools: vi.fn(() => []),
                getAllToolNames: vi.fn(() => []),
                getFunctionDeclarationsFiltered: vi.fn(() => [])
            })),
            storage: {
                getProjectTempDir: vi.fn(() => '/tmp/perf-test'),
                ensureProjectTempDir: vi.fn()
            },
            getSessionId: vi.fn(() => 'perf-test-session')
        };
        system = await TaskManagementSystemFactory.createComplete(config, {
            enableMonitoring: true,
            enableHookIntegration: false
        });
    });
    afterEach(async () => {
        if (system) {
            await system.shutdown();
        }
        vi.clearAllMocks();
    });
    describe('Task Creation Performance', () => {
        it('should create 1000 tasks efficiently', async () => {
            const taskCount = 1000;
            const maxCreationTime = 5000; // 5 seconds
            const startTime = Date.now();
            const taskPromises = [];
            for (let i = 0; i < taskCount; i++) {
                const promise = system.taskEngine.queueTask(`Performance Task ${i}`, `Load testing task number ${i}`, {
                    type: i % 3 === 0 ? 'implementation' : i % 3 === 1 ? 'testing' : 'analysis',
                    priority: ['low', 'medium', 'high', 'critical'][i % 4]
                });
                taskPromises.push(promise);
            }
            const taskIds = await Promise.all(taskPromises);
            const creationTime = Date.now() - startTime;
            expect(taskIds).toHaveLength(taskCount);
            expect(creationTime).toBeLessThan(maxCreationTime);
            console.log(`✅ Created ${taskCount} tasks in ${creationTime}ms (${(taskCount / creationTime * 1000).toFixed(2)} tasks/sec)`);
            // Verify all tasks were created correctly
            const allTasks = system.taskEngine.getAllTasks();
            expect(allTasks).toHaveLength(taskCount);
            // Test memory usage - should not be excessive
            const memoryUsage = process.memoryUsage();
            const heapUsedMB = memoryUsage.heapUsed / 1024 / 1024;
            expect(heapUsedMB).toBeLessThan(100); // Should use less than 100MB
            console.log(`Memory usage: ${heapUsedMB.toFixed(2)}MB heap used`);
        });
        it('should handle concurrent task creation', async () => {
            const concurrentBatches = 10;
            const tasksPerBatch = 50;
            const totalTasks = concurrentBatches * tasksPerBatch;
            const startTime = Date.now();
            // Create concurrent batches
            const batchPromises = Array.from({ length: concurrentBatches }, async (_, batchIndex) => {
                const batchTasks = [];
                for (let i = 0; i < tasksPerBatch; i++) {
                    const taskIndex = batchIndex * tasksPerBatch + i;
                    const promise = system.taskEngine.queueTask(`Concurrent Task ${taskIndex}`, `Batch ${batchIndex}, Task ${i}`, {
                        type: 'testing',
                        priority: 'medium'
                    });
                    batchTasks.push(promise);
                }
                return Promise.all(batchTasks);
            });
            const allTaskIds = await Promise.all(batchPromises);
            const creationTime = Date.now() - startTime;
            const flatTaskIds = allTaskIds.flat();
            expect(flatTaskIds).toHaveLength(totalTasks);
            expect(creationTime).toBeLessThan(10000); // Should complete within 10 seconds
            console.log(`✅ Created ${totalTasks} tasks concurrently in ${creationTime}ms`);
            // Verify no task ID collisions
            const uniqueIds = new Set(flatTaskIds);
            expect(uniqueIds.size).toBe(totalTasks);
        });
    });
    describe('Task Retrieval Performance', () => {
        let taskIds = [];
        beforeEach(async () => {
            // Create baseline tasks for retrieval tests
            const taskPromises = [];
            for (let i = 0; i < 500; i++) {
                taskPromises.push(system.taskEngine.queueTask(`Retrieval Test Task ${i}`, `Task for retrieval performance testing`, {
                    type: i % 2 === 0 ? 'implementation' : 'testing',
                    priority: ['low', 'medium', 'high'][i % 3]
                }));
            }
            taskIds = await Promise.all(taskPromises);
        });
        it('should retrieve individual tasks quickly', async () => {
            const retrievalCount = 1000;
            const startTime = Date.now();
            for (let i = 0; i < retrievalCount; i++) {
                const randomId = taskIds[Math.floor(Math.random() * taskIds.length)];
                const task = system.taskEngine.getTask(randomId);
                expect(task).toBeTruthy();
            }
            const retrievalTime = Date.now() - startTime;
            const retrievalsPerSecond = retrievalCount / (retrievalTime / 1000);
            expect(retrievalTime).toBeLessThan(1000); // Should complete within 1 second
            expect(retrievalsPerSecond).toBeGreaterThan(1000); // At least 1000 retrievals/sec
            console.log(`✅ ${retrievalCount} retrievals in ${retrievalTime}ms (${retrievalsPerSecond.toFixed(2)} retrievals/sec)`);
        });
        it('should filter tasks efficiently', async () => {
            const filterOperations = 100;
            const filters = [
                { priority: 'high' },
                { type: 'implementation' },
                { status: 'queued' },
                { priority: 'medium', type: 'testing' }
            ];
            const startTime = Date.now();
            for (let i = 0; i < filterOperations; i++) {
                const filter = filters[i % filters.length];
                const filteredTasks = system.taskEngine.getAllTasks(filter);
                expect(filteredTasks).toBeInstanceOf(Array);
            }
            const filterTime = Date.now() - startTime;
            const filtersPerSecond = filterOperations / (filterTime / 1000);
            expect(filterTime).toBeLessThan(500); // Should complete within 500ms
            expect(filtersPerSecond).toBeGreaterThan(100); // At least 100 filters/sec
            console.log(`✅ ${filterOperations} filter operations in ${filterTime}ms (${filtersPerSecond.toFixed(2)} filters/sec)`);
        });
        it('should handle bulk retrieval operations', async () => {
            const startTime = Date.now();
            const allTasks = system.taskEngine.getAllTasks();
            const retrievalTime = Date.now() - startTime;
            expect(allTasks).toHaveLength(500);
            expect(retrievalTime).toBeLessThan(100); // Should be very fast
            console.log(`✅ Bulk retrieval of ${allTasks.length} tasks in ${retrievalTime}ms`);
        });
    });
    describe('Dependency Resolution Performance', () => {
        it('should handle complex dependency graphs efficiently', async () => {
            const resolver = new DependencyResolver();
            const nodeCount = 200;
            const edgeCount = 500;
            // Create tasks
            const tasks = [];
            for (let i = 0; i < nodeCount; i++) {
                const taskId = await system.taskEngine.queueTask(`Dependency Task ${i}`, `Task ${i} for dependency testing`, { priority: 'medium' });
                const task = system.taskEngine.getTask(taskId);
                tasks.push(task);
            }
            // Create complex dependency relationships
            const dependencies = [];
            for (let i = 0; i < edgeCount; i++) {
                const sourceIndex = Math.floor(Math.random() * nodeCount);
                const targetIndex = Math.floor(Math.random() * nodeCount);
                if (sourceIndex !== targetIndex) {
                    dependencies.push({
                        dependentTaskId: tasks[targetIndex].id,
                        dependsOnTaskId: tasks[sourceIndex].id,
                        type: Math.random() > 0.7 ? 'soft' : 'hard'
                    });
                }
            }
            // Test dependency graph construction
            const graphStartTime = Date.now();
            const graph = resolver.buildDependencyGraph(tasks, dependencies);
            const graphTime = Date.now() - graphStartTime;
            expect(graph.nodes.size).toBe(nodeCount);
            expect(graphTime).toBeLessThan(2000); // Should build graph in under 2 seconds
            // Test cycle detection
            const cycleStartTime = Date.now();
            const cycles = resolver.detectCycles(graph);
            const cycleTime = Date.now() - cycleStartTime;
            expect(cycleTime).toBeLessThan(1000); // Should detect cycles in under 1 second
            // Test topological sorting (if no cycles)
            if (cycles.length === 0) {
                const sortStartTime = Date.now();
                const sorted = resolver.topologicalSort(graph);
                const sortTime = Date.now() - sortStartTime;
                expect(sorted).toHaveLength(nodeCount);
                expect(sortTime).toBeLessThan(1000); // Should sort in under 1 second
                console.log(`✅ Dependency analysis: ${nodeCount} nodes, ${edgeCount} edges`);
                console.log(`   Graph construction: ${graphTime}ms`);
                console.log(`   Cycle detection: ${cycleTime}ms`);
                console.log(`   Topological sort: ${sortTime}ms`);
            }
            else {
                console.log(`✅ Dependency analysis: ${nodeCount} nodes, ${edgeCount} edges, ${cycles.length} cycles`);
                console.log(`   Graph construction: ${graphTime}ms`);
                console.log(`   Cycle detection: ${cycleTime}ms`);
            }
        });
        it('should scale dependency operations linearly', async () => {
            const resolver = new DependencyResolver();
            const testSizes = [50, 100, 200];
            const results = [];
            for (const size of testSizes) {
                // Create tasks
                const tasks = [];
                for (let i = 0; i < size; i++) {
                    const taskId = await system.taskEngine.queueTask(`Scale Test ${i}`, `Scaling test task ${i}`, { priority: 'medium' });
                    tasks.push(system.taskEngine.getTask(taskId));
                }
                // Create linear dependency chain
                const dependencies = [];
                for (let i = 1; i < size; i++) {
                    dependencies.push({
                        dependentTaskId: tasks[i].id,
                        dependsOnTaskId: tasks[i - 1].id,
                        type: 'hard'
                    });
                }
                const startTime = Date.now();
                const graph = resolver.buildDependencyGraph(tasks, dependencies);
                const sorted = resolver.topologicalSort(graph);
                const totalTime = Date.now() - startTime;
                expect(sorted).toHaveLength(size);
                const ratio = totalTime / size;
                results.push({ size, time: totalTime, ratio });
                console.log(`Size ${size}: ${totalTime}ms (${ratio.toFixed(2)}ms per task)`);
            }
            // Verify linear scaling (ratio should not increase dramatically)
            const ratioIncrease = results[2].ratio / results[0].ratio;
            expect(ratioIncrease).toBeLessThan(5); // Should not increase by more than 5x
            console.log(`✅ Scaling ratio: ${ratioIncrease.toFixed(2)}x`);
        });
    });
    describe('Priority Scheduling Performance', () => {
        it('should schedule large task sets efficiently', async () => {
            const scheduler = new TaskPriorityScheduler({
                maxConcurrentTasks: 10,
                defaultTimeout: 300000,
                defaultMaxRetries: 3,
                resourcePools: new Map([
                    ['cpu', 8],
                    ['memory', 16],
                    ['network', 4]
                ]),
                priorityThresholds: {
                    critical: 90,
                    high: 70,
                    medium: 50,
                    low: 30
                },
                schedulingAlgorithm: 'dependency_aware',
                autoDependencyLearning: true,
                performanceMonitoring: true
            });
            const taskCounts = [100, 500, 1000];
            for (const taskCount of taskCounts) {
                // Create tasks with varied priorities
                const tasks = [];
                for (let i = 0; i < taskCount; i++) {
                    const taskId = await system.taskEngine.queueTask(`Schedule Task ${i}`, `Task ${i} for scheduling performance`, {
                        priority: ['low', 'medium', 'high', 'critical'][i % 4],
                        type: 'implementation',
                        resourceConstraints: [
                            { resourceType: 'cpu', maxUnits: Math.floor(Math.random() * 3) + 1 },
                            { resourceType: 'memory', maxUnits: Math.floor(Math.random() * 4) + 1 }
                        ]
                    });
                    const task = system.taskEngine.getTask(taskId);
                    task.metadata.estimatedDuration = Math.random() * 300000 + 30000; // 30s to 5min
                    tasks.push(task);
                }
                const startTime = Date.now();
                const sequence = scheduler.scheduleSequence(tasks);
                const schedulingTime = Date.now() - startTime;
                expect(sequence.sequence).toHaveLength(taskCount);
                expect(schedulingTime).toBeLessThan(5000); // Should schedule within 5 seconds
                const tasksPerSecond = taskCount / (schedulingTime / 1000);
                console.log(`✅ Scheduled ${taskCount} tasks in ${schedulingTime}ms (${tasksPerSecond.toFixed(2)} tasks/sec)`);
                // Verify priority ordering (critical tasks should come first)
                const criticalTasks = tasks.filter(t => t.priority === 'critical');
                if (criticalTasks.length > 0) {
                    const firstCriticalIndex = sequence.sequence.findIndex(id => tasks.find(t => t.id === id)?.priority === 'critical');
                    const firstLowIndex = sequence.sequence.findIndex(id => tasks.find(t => t.id === id)?.priority === 'low');
                    if (firstLowIndex !== -1) {
                        expect(firstCriticalIndex).toBeLessThan(firstLowIndex);
                    }
                }
            }
        });
        it('should handle resource allocation efficiently', async () => {
            const scheduler = new TaskPriorityScheduler({
                maxConcurrentTasks: 5,
                defaultTimeout: 300000,
                defaultMaxRetries: 3,
                resourcePools: new Map([
                    ['cpu', 8],
                    ['memory', 16]
                ]),
                priorityThresholds: {
                    critical: 90,
                    high: 70,
                    medium: 50,
                    low: 30
                },
                schedulingAlgorithm: 'resource_optimal',
                autoDependencyLearning: false,
                performanceMonitoring: true
            });
            const allocationCount = 1000;
            const tasks = [];
            // Create tasks with resource requirements
            for (let i = 0; i < allocationCount; i++) {
                const taskId = await system.taskEngine.queueTask(`Resource Task ${i}`, `Resource allocation test ${i}`, {
                    priority: 'medium',
                    resourceConstraints: [
                        { resourceType: 'cpu', maxUnits: Math.floor(Math.random() * 4) + 1 },
                        { resourceType: 'memory', maxUnits: Math.floor(Math.random() * 8) + 1 }
                    ]
                });
                tasks.push(system.taskEngine.getTask(taskId));
            }
            const startTime = Date.now();
            let successfulAllocations = 0;
            for (const task of tasks) {
                const allocation = scheduler.allocateResources(task);
                if (allocation) {
                    successfulAllocations++;
                    scheduler.releaseResources(allocation); // Release for next task
                }
            }
            const allocationTime = Date.now() - startTime;
            const allocationsPerSecond = allocationCount / (allocationTime / 1000);
            expect(allocationTime).toBeLessThan(5000); // Should complete within 5 seconds
            expect(allocationsPerSecond).toBeGreaterThan(100); // At least 100 allocations/sec
            expect(successfulAllocations).toBeGreaterThan(0);
            console.log(`✅ ${allocationCount} resource allocations in ${allocationTime}ms`);
            console.log(`   ${allocationsPerSecond.toFixed(2)} allocations/sec`);
            console.log(`   ${successfulAllocations}/${allocationCount} successful allocations`);
        });
    });
    describe('Monitoring System Performance', () => {
        it('should handle high-frequency event recording', async () => {
            if (!system.monitoring) {
                throw new Error('Monitoring system not available');
            }
            const eventCount = 5000;
            const events = [];
            const taskIds = [];
            // Create some tasks for events
            for (let i = 0; i < 10; i++) {
                const taskId = await system.taskEngine.queueTask(`Monitoring Task ${i}`, `Task for monitoring performance`, { priority: 'medium' });
                taskIds.push(taskId);
            }
            // Generate events
            for (let i = 0; i < eventCount; i++) {
                events.push({
                    taskId: taskIds[i % taskIds.length],
                    eventType: ['started', 'progress', 'completed', 'failed'][i % 4],
                    timestamp: new Date(),
                    metadata: {
                        eventNumber: i,
                        progress: Math.floor(Math.random() * 101)
                    },
                    duration: Math.random() * 10000
                });
            }
            const startTime = Date.now();
            // Record events
            for (const event of events) {
                system.monitoring.recordEvent(event);
            }
            const recordingTime = Date.now() - startTime;
            const eventsPerSecond = eventCount / (recordingTime / 1000);
            expect(recordingTime).toBeLessThan(2000); // Should record within 2 seconds
            expect(eventsPerSecond).toBeGreaterThan(1000); // At least 1000 events/sec
            console.log(`✅ Recorded ${eventCount} events in ${recordingTime}ms (${eventsPerSecond.toFixed(2)} events/sec)`);
            // Test metrics collection performance
            const allTasks = system.taskEngine.getAllTasks();
            const metricsStartTime = Date.now();
            const metrics = await system.monitoring.collectMetrics(allTasks);
            const metricsTime = Date.now() - metricsStartTime;
            expect(metricsTime).toBeLessThan(500); // Should collect metrics quickly
            expect(metrics.totalTasks).toBe(allTasks.length);
            console.log(`✅ Collected metrics in ${metricsTime}ms`);
        });
        it('should maintain performance under memory pressure', async () => {
            if (!system.monitoring) {
                throw new Error('Monitoring system not available');
            }
            // Create many tasks and events to test memory efficiency
            const taskCount = 1000;
            const eventsPerTask = 20;
            const initialMemory = process.memoryUsage();
            // Create tasks
            const taskIds = [];
            for (let i = 0; i < taskCount; i++) {
                const taskId = await system.taskEngine.queueTask(`Memory Test Task ${i}`, `Task for memory pressure testing`, { priority: 'medium' });
                taskIds.push(taskId);
            }
            // Generate events for each task
            for (const taskId of taskIds) {
                for (let i = 0; i < eventsPerTask; i++) {
                    system.monitoring.recordEvent({
                        taskId,
                        eventType: ['started', 'progress', 'completed'][i % 3],
                        timestamp: new Date(),
                        metadata: { eventIndex: i },
                        duration: Math.random() * 5000
                    });
                }
            }
            const finalMemory = process.memoryUsage();
            const memoryIncreaseMB = (finalMemory.heapUsed - initialMemory.heapUsed) / 1024 / 1024;
            // Memory increase should be reasonable for the amount of data
            expect(memoryIncreaseMB).toBeLessThan(200); // Less than 200MB increase
            console.log(`✅ Memory usage increased by ${memoryIncreaseMB.toFixed(2)}MB`);
            console.log(`   Total events: ${taskCount * eventsPerTask}`);
            console.log(`   Memory per event: ${(memoryIncreaseMB * 1024 / (taskCount * eventsPerTask)).toFixed(2)}KB`);
            // Test performance under memory pressure
            const startTime = Date.now();
            const allTasks = system.taskEngine.getAllTasks();
            const metrics = await system.monitoring.collectMetrics(allTasks);
            const operationTime = Date.now() - startTime;
            expect(operationTime).toBeLessThan(1000); // Should still be fast
            expect(metrics.totalTasks).toBe(taskCount);
            console.log(`✅ Operations under memory pressure completed in ${operationTime}ms`);
        });
    });
    describe('Stress Testing Scenarios', () => {
        it('should handle extreme concurrent operations', async () => {
            const concurrentOperations = 100;
            const operationsPerThread = 10;
            const operations = Array.from({ length: concurrentOperations }, async (_, threadIndex) => {
                const results = [];
                for (let i = 0; i < operationsPerThread; i++) {
                    // Mix of operations
                    const operations = [
                        // Create task
                        async () => {
                            const taskId = await system.taskEngine.queueTask(`Stress Task ${threadIndex}-${i}`, `Concurrent stress test task`, { priority: 'medium' });
                            return { type: 'create', result: taskId };
                        },
                        // Retrieve task
                        async () => {
                            const allTasks = system.taskEngine.getAllTasks();
                            if (allTasks.length > 0) {
                                const randomTask = allTasks[Math.floor(Math.random() * allTasks.length)];
                                const task = system.taskEngine.getTask(randomTask.id);
                                return { type: 'retrieve', result: task?.id };
                            }
                            return { type: 'retrieve', result: null };
                        },
                        // Filter tasks
                        async () => {
                            const filtered = system.taskEngine.getAllTasks({ status: 'queued' });
                            return { type: 'filter', result: filtered.length };
                        }
                    ];
                    const operation = operations[i % operations.length];
                    const result = await operation();
                    results.push(result);
                }
                return results;
            });
            const startTime = Date.now();
            const allResults = await Promise.all(operations);
            const totalTime = Date.now() - startTime;
            const flatResults = allResults.flat();
            const totalOperations = concurrentOperations * operationsPerThread;
            expect(flatResults).toHaveLength(totalOperations);
            expect(totalTime).toBeLessThan(30000); // Should complete within 30 seconds
            const operationsPerSecond = totalOperations / (totalTime / 1000);
            console.log(`✅ ${totalOperations} concurrent operations in ${totalTime}ms`);
            console.log(`   ${operationsPerSecond.toFixed(2)} operations/sec`);
            // Verify system integrity
            const finalTasks = system.taskEngine.getAllTasks();
            const createOperations = flatResults.filter(r => r.type === 'create').length;
            expect(finalTasks.length).toBeGreaterThanOrEqual(createOperations);
            // Check for any duplicated task IDs
            const taskIds = finalTasks.map(t => t.id);
            const uniqueIds = new Set(taskIds);
            expect(uniqueIds.size).toBe(taskIds.length);
        });
        it('should maintain performance during sustained load', async () => {
            const sustainedDurationMs = 10000; // 10 seconds
            const batchSize = 50;
            const batchIntervalMs = 100;
            const startTime = Date.now();
            let totalTasksCreated = 0;
            const performanceMetrics = [];
            while (Date.now() - startTime < sustainedDurationMs) {
                const batchStartTime = Date.now();
                // Create batch of tasks
                const batchPromises = [];
                for (let i = 0; i < batchSize; i++) {
                    batchPromises.push(system.taskEngine.queueTask(`Sustained Task ${totalTasksCreated + i}`, `Sustained load testing task`, { priority: 'medium' }));
                }
                await Promise.all(batchPromises);
                totalTasksCreated += batchSize;
                const batchTime = Date.now() - batchStartTime;
                const throughput = batchSize / (batchTime / 1000);
                const memoryUsage = process.memoryUsage().heapUsed / 1024 / 1024;
                performanceMetrics.push({
                    timestamp: Date.now() - startTime,
                    throughput,
                    memory: memoryUsage
                });
                // Wait before next batch
                await new Promise(resolve => setTimeout(resolve, batchIntervalMs));
            }
            const totalTime = Date.now() - startTime;
            const averageThroughput = totalTasksCreated / (totalTime / 1000);
            expect(totalTasksCreated).toBeGreaterThan(100);
            expect(averageThroughput).toBeGreaterThan(10); // At least 10 tasks/sec
            console.log(`✅ Sustained load test completed:`);
            console.log(`   Duration: ${totalTime}ms`);
            console.log(`   Tasks created: ${totalTasksCreated}`);
            console.log(`   Average throughput: ${averageThroughput.toFixed(2)} tasks/sec`);
            // Analyze performance degradation
            const firstQuarter = performanceMetrics.slice(0, Math.floor(performanceMetrics.length / 4));
            const lastQuarter = performanceMetrics.slice(-Math.floor(performanceMetrics.length / 4));
            const avgFirstThroughput = firstQuarter.reduce((sum, m) => sum + m.throughput, 0) / firstQuarter.length;
            const avgLastThroughput = lastQuarter.reduce((sum, m) => sum + m.throughput, 0) / lastQuarter.length;
            const performanceDegradation = (avgFirstThroughput - avgLastThroughput) / avgFirstThroughput;
            console.log(`   Performance degradation: ${(performanceDegradation * 100).toFixed(2)}%`);
            // Performance should not degrade by more than 50%
            expect(performanceDegradation).toBeLessThan(0.5);
            // Memory should not grow excessively
            const memoryGrowth = lastQuarter[lastQuarter.length - 1].memory - firstQuarter[0].memory;
            expect(memoryGrowth).toBeLessThan(100); // Less than 100MB growth
            console.log(`   Memory growth: ${memoryGrowth.toFixed(2)}MB`);
        });
    });
    describe('Resource Limit Testing', () => {
        it('should handle memory exhaustion gracefully', async () => {
            // Create a large number of tasks to test memory limits
            const largeTaskCount = 10000;
            let tasksCreated = 0;
            const initialMemory = process.memoryUsage();
            try {
                const batchSize = 100;
                while (tasksCreated < largeTaskCount) {
                    const batch = [];
                    for (let i = 0; i < batchSize && tasksCreated + i < largeTaskCount; i++) {
                        batch.push(system.taskEngine.queueTask(`Memory Limit Task ${tasksCreated + i}`, `Task to test memory limits - ${tasksCreated + i}`, {
                            priority: 'medium',
                            context: {
                                // Add some data to consume memory
                                data: new Array(100).fill(`data-${tasksCreated + i}`),
                                metadata: {
                                    created: new Date(),
                                    index: tasksCreated + i
                                }
                            }
                        }));
                    }
                    await Promise.all(batch);
                    tasksCreated += batch.length;
                    const currentMemory = process.memoryUsage();
                    const memoryUsedMB = currentMemory.heapUsed / 1024 / 1024;
                    // Monitor memory usage and break if too high
                    if (memoryUsedMB > 500) { // Stop at 500MB to prevent system issues
                        console.log(`⚠️  Memory limit reached at ${tasksCreated} tasks (${memoryUsedMB.toFixed(2)}MB)`);
                        break;
                    }
                    // Occasional garbage collection hint
                    if (tasksCreated % 1000 === 0) {
                        if (global.gc) {
                            global.gc();
                        }
                        console.log(`Progress: ${tasksCreated} tasks created, ${memoryUsedMB.toFixed(2)}MB memory used`);
                    }
                }
                const finalMemory = process.memoryUsage();
                const memoryIncreaseMB = (finalMemory.heapUsed - initialMemory.heapUsed) / 1024 / 1024;
                console.log(`✅ Created ${tasksCreated} tasks`);
                console.log(`   Memory increase: ${memoryIncreaseMB.toFixed(2)}MB`);
                console.log(`   Memory per task: ${(memoryIncreaseMB / tasksCreated * 1024).toFixed(2)}KB`);
                // System should still be responsive
                const testStartTime = Date.now();
                const allTasks = system.taskEngine.getAllTasks();
                const retrievalTime = Date.now() - testStartTime;
                expect(allTasks.length).toBe(tasksCreated);
                expect(retrievalTime).toBeLessThan(2000); // Should still retrieve quickly
                console.log(`   Final retrieval time: ${retrievalTime}ms`);
            }
            catch (error) {
                console.error(`Memory limit test encountered error at ${tasksCreated} tasks:`, error);
                // This is expected behavior when hitting memory limits
                expect(tasksCreated).toBeGreaterThan(1000); // Should create at least 1000 tasks
            }
        });
    });
});
//# sourceMappingURL=TaskManagementPerformance.test.js.map