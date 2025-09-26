/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Comprehensive Test Suite for QueueOptimizer
 *
 * Tests all aspects of queue optimization including:
 * - Multiple optimization strategies (throughput, latency, resource efficiency, deadline)
 * - Parallel execution pathway identification
 * - Resource allocation optimization
 * - Task batching algorithms
 * - Performance metrics and recommendations
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { EventEmitter } from 'node:events';
import { QueueOptimizer, OptimizationStrategy, OptimizationRecommendation, ResourceAllocation, BatchingStrategy, } from '../QueueOptimizer.js';
import { TaskStatus, TaskPriority } from '../TaskQueue.js';
import { DependencyType } from '../DependencyResolver.js';
// Mock logger
vi.mock('../utils/logger.js', () => ({
    logger: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        debug: vi.fn(),
    },
}));
describe('QueueOptimizer', () => {
    let optimizer;
    let mockTasks;
    let mockDependencyAnalysis;
    let mockMetrics;
    beforeEach(() => {
        optimizer = new QueueOptimizer({
            enableParallelOptimization: true,
            resourceConstraints: {
                maxCpuUsage: 80,
                maxMemoryUsage: 4096,
                maxNetworkBandwidth: 100,
            },
            optimizationInterval: 30000,
            enableBatching: true,
            batchingStrategy: BatchingStrategy.SIMILAR_TASKS,
        });
        // Create mock task data
        mockTasks = new Map([
            [
                'task-cpu-heavy',
                {
                    id: 'task-cpu-heavy',
                    title: 'CPU Heavy Task',
                    description: 'Task requiring significant CPU',
                    status: TaskStatus.PENDING,
                    priority: TaskPriority.HIGH,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    executeFunction: async () => ({ success: true }),
                    dependencies: [],
                    priorityFactors: {},
                    executionHistory: [
                        {
                            startTime: new Date(Date.now() - 5000),
                            endTime: new Date(Date.now() - 1000),
                            duration: 4000,
                            success: true,
                            resourceUsage: { cpu: 90, memory: 512, network: 10 },
                        },
                    ],
                    estimatedDuration: 5000,
                    resourceRequirements: { cpu: 85, memory: 512, network: 5 },
                    tags: ['cpu-intensive', 'processing'],
                },
            ],
            [
                'task-memory-heavy',
                {
                    id: 'task-memory-heavy',
                    title: 'Memory Heavy Task',
                    description: 'Task requiring significant memory',
                    status: TaskStatus.PENDING,
                    priority: TaskPriority.MEDIUM,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    executeFunction: async () => ({ success: true }),
                    dependencies: [],
                    priorityFactors: {},
                    executionHistory: [
                        {
                            startTime: new Date(Date.now() - 8000),
                            endTime: new Date(Date.now() - 2000),
                            duration: 6000,
                            success: true,
                            resourceUsage: { cpu: 20, memory: 2048, network: 15 },
                        },
                    ],
                    estimatedDuration: 7000,
                    resourceRequirements: { cpu: 25, memory: 2048, network: 10 },
                    tags: ['memory-intensive', 'data'],
                },
            ],
            [
                'task-network-heavy',
                {
                    id: 'task-network-heavy',
                    title: 'Network Heavy Task',
                    description: 'Task requiring significant network',
                    status: TaskStatus.PENDING,
                    priority: TaskPriority.LOW,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    executeFunction: async () => ({ success: true }),
                    dependencies: [],
                    priorityFactors: {},
                    executionHistory: [],
                    estimatedDuration: 3000,
                    resourceRequirements: { cpu: 15, memory: 256, network: 80 },
                    tags: ['network-intensive', 'io'],
                },
            ],
            [
                'task-quick',
                {
                    id: 'task-quick',
                    title: 'Quick Task',
                    description: 'Fast executing task',
                    status: TaskStatus.PENDING,
                    priority: TaskPriority.MEDIUM,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    executeFunction: async () => ({ success: true }),
                    dependencies: [],
                    priorityFactors: {},
                    executionHistory: [
                        {
                            startTime: new Date(Date.now() - 1500),
                            endTime: new Date(Date.now() - 1000),
                            duration: 500,
                            success: true,
                            resourceUsage: { cpu: 10, memory: 64, network: 2 },
                        },
                    ],
                    estimatedDuration: 600,
                    resourceRequirements: { cpu: 10, memory: 64, network: 2 },
                    tags: ['quick', 'lightweight'],
                },
            ],
        ]);
        mockDependencyAnalysis = {
            hasCycles: false,
            cycles: [],
            executionLevels: {
                'task-cpu-heavy': 0,
                'task-memory-heavy': 0,
                'task-network-heavy': 0,
                'task-quick': 0,
            },
            topologicalOrder: [
                'task-cpu-heavy',
                'task-memory-heavy',
                'task-network-heavy',
                'task-quick',
            ],
            criticalPath: ['task-cpu-heavy', 'task-memory-heavy'],
            criticalPathDuration: 12000,
            parallelExecutionPaths: [
                ['task-cpu-heavy'],
                ['task-memory-heavy'],
                ['task-network-heavy', 'task-quick'],
            ],
            conflicts: [],
            resolutionSuggestions: [],
        };
        mockMetrics = {
            totalTasks: 4,
            completedTasks: 0,
            failedTasks: 0,
            averageWaitTime: 2000,
            averageExecutionTime: 4000,
            throughputPerHour: 15,
            resourceUtilization: {
                cpu: 45,
                memory: 1024,
                network: 25,
            },
            queueDepth: 4,
            concurrencyLevel: 2,
            errorRate: 0.02,
            retryRate: 0.05,
        };
        vi.clearAllMocks();
    });
    afterEach(() => {
        optimizer.destroy();
    });
    describe('Throughput Optimization', () => {
        it('should optimize for maximum throughput', () => {
            const recommendations = optimizer.optimizeQueue(mockTasks, mockDependencyAnalysis, mockMetrics, OptimizationStrategy.THROUGHPUT_MAXIMIZATION);
            expect(recommendations).toBeDefined();
            expect(recommendations.length).toBeGreaterThan(0);
            // Should recommend increasing concurrency for throughput
            const concurrencyRec = recommendations.find((r) => r.type === 'concurrency_adjustment');
            expect(concurrencyRec).toBeDefined();
            expect(concurrencyRec?.impact).toBeGreaterThan(0);
        });
        it('should identify parallel execution opportunities', () => {
            const recommendations = optimizer.optimizeQueue(mockTasks, mockDependencyAnalysis, mockMetrics, OptimizationStrategy.THROUGHPUT_MAXIMIZATION);
            const parallelRec = recommendations.find((r) => r.type === 'parallel_execution');
            expect(parallelRec).toBeDefined();
            expect(parallelRec?.details).toHaveProperty('parallelizableTasks');
        });
        it('should consider resource complementarity for throughput', () => {
            const recommendations = optimizer.optimizeQueue(mockTasks, mockDependencyAnalysis, mockMetrics, OptimizationStrategy.THROUGHPUT_MAXIMIZATION);
            // Should identify that CPU-heavy and network-heavy tasks can run in parallel
            const resourceRec = recommendations.find((r) => r.type === 'resource_balancing');
            expect(resourceRec).toBeDefined();
        });
    });
    describe('Latency Minimization', () => {
        it('should optimize for minimum latency', () => {
            const recommendations = optimizer.optimizeQueue(mockTasks, mockDependencyAnalysis, mockMetrics, OptimizationStrategy.LATENCY_MINIMIZATION);
            expect(recommendations).toBeDefined();
            expect(recommendations.length).toBeGreaterThan(0);
            // Should prioritize quick tasks for latency reduction
            const priorityRec = recommendations.find((r) => r.type === 'priority_adjustment');
            expect(priorityRec).toBeDefined();
        });
        it('should recommend critical path optimization', () => {
            const recommendations = optimizer.optimizeQueue(mockTasks, mockDependencyAnalysis, mockMetrics, OptimizationStrategy.LATENCY_MINIMIZATION);
            const criticalPathRec = recommendations.find((r) => r.type === 'critical_path_optimization');
            expect(criticalPathRec).toBeDefined();
            expect(criticalPathRec?.details).toHaveProperty('criticalTasks');
        });
        it('should suggest task preemption for urgent tasks', () => {
            // Add an urgent task with deadline
            const urgentTask = {
                id: 'urgent-task',
                title: 'Urgent Task',
                description: 'Task with tight deadline',
                status: TaskStatus.PENDING,
                priority: TaskPriority.CRITICAL,
                createdAt: new Date(),
                updatedAt: new Date(),
                executeFunction: async () => ({ success: true }),
                dependencies: [],
                priorityFactors: {},
                executionHistory: [],
                estimatedDuration: 1000,
                deadline: new Date(Date.now() + 5000), // 5 seconds from now
                resourceRequirements: { cpu: 20, memory: 128, network: 5 },
                tags: ['urgent'],
            };
            mockTasks.set('urgent-task', urgentTask);
            const recommendations = optimizer.optimizeQueue(mockTasks, mockDependencyAnalysis, mockMetrics, OptimizationStrategy.LATENCY_MINIMIZATION);
            const preemptionRec = recommendations.find((r) => r.type === 'task_preemption');
            expect(preemptionRec).toBeDefined();
        });
    });
    describe('Resource Efficiency Optimization', () => {
        it('should optimize for resource efficiency', () => {
            const recommendations = optimizer.optimizeQueue(mockTasks, mockDependencyAnalysis, mockMetrics, OptimizationStrategy.RESOURCE_EFFICIENCY);
            expect(recommendations).toBeDefined();
            expect(recommendations.length).toBeGreaterThan(0);
            // Should recommend resource balancing
            const resourceRec = recommendations.find((r) => r.type === 'resource_balancing');
            expect(resourceRec).toBeDefined();
        });
        it('should identify resource conflicts and suggest solutions', () => {
            // Create tasks with conflicting resource requirements
            const conflictingTask = {
                id: 'conflicting-task',
                title: 'Conflicting Task',
                description: 'Task that conflicts with existing resources',
                status: TaskStatus.PENDING,
                priority: TaskPriority.HIGH,
                createdAt: new Date(),
                updatedAt: new Date(),
                executeFunction: async () => ({ success: true }),
                dependencies: [],
                priorityFactors: {},
                executionHistory: [],
                estimatedDuration: 4000,
                resourceRequirements: { cpu: 95, memory: 3072, network: 90 }, // High requirements
                tags: ['resource-heavy'],
            };
            mockTasks.set('conflicting-task', conflictingTask);
            const recommendations = optimizer.optimizeQueue(mockTasks, mockDependencyAnalysis, mockMetrics, OptimizationStrategy.RESOURCE_EFFICIENCY);
            const conflictRec = recommendations.find((r) => r.type === 'resource_conflict_resolution');
            expect(conflictRec).toBeDefined();
        });
        it('should suggest task batching for similar resource patterns', () => {
            // Add more CPU-heavy tasks
            const batchTask1 = {
                id: 'batch-cpu-1',
                title: 'Batch CPU Task 1',
                description: 'CPU task for batching',
                status: TaskStatus.PENDING,
                priority: TaskPriority.MEDIUM,
                createdAt: new Date(),
                updatedAt: new Date(),
                executeFunction: async () => ({ success: true }),
                dependencies: [],
                priorityFactors: {},
                executionHistory: [],
                estimatedDuration: 2000,
                resourceRequirements: { cpu: 80, memory: 256, network: 5 },
                tags: ['cpu-intensive', 'processing'],
            };
            mockTasks.set('batch-cpu-1', batchTask1);
            const recommendations = optimizer.optimizeQueue(mockTasks, mockDependencyAnalysis, mockMetrics, OptimizationStrategy.RESOURCE_EFFICIENCY);
            const batchingRec = recommendations.find((r) => r.type === 'task_batching');
            expect(batchingRec).toBeDefined();
        });
    });
    describe('Deadline Optimization', () => {
        it('should optimize for meeting deadlines', () => {
            // Add tasks with deadlines
            const deadlineTask = {
                id: 'deadline-task',
                title: 'Task with Deadline',
                description: 'Task that must complete by deadline',
                status: TaskStatus.PENDING,
                priority: TaskPriority.HIGH,
                createdAt: new Date(),
                updatedAt: new Date(),
                executeFunction: async () => ({ success: true }),
                dependencies: [],
                priorityFactors: {},
                executionHistory: [],
                estimatedDuration: 3000,
                deadline: new Date(Date.now() + 10000), // 10 seconds from now
                resourceRequirements: { cpu: 50, memory: 512, network: 20 },
                tags: ['deadline'],
            };
            mockTasks.set('deadline-task', deadlineTask);
            const recommendations = optimizer.optimizeQueue(mockTasks, mockDependencyAnalysis, mockMetrics, OptimizationStrategy.DEADLINE_OPTIMIZATION);
            expect(recommendations).toBeDefined();
            expect(recommendations.length).toBeGreaterThan(0);
            // Should recommend deadline-based scheduling
            const deadlineRec = recommendations.find((r) => r.type === 'deadline_scheduling');
            expect(deadlineRec).toBeDefined();
        });
        it('should identify potential deadline violations', () => {
            // Add task with tight deadline
            const violatingTask = {
                id: 'violating-task',
                title: 'Deadline Violating Task',
                description: 'Task likely to miss deadline',
                status: TaskStatus.PENDING,
                priority: TaskPriority.MEDIUM,
                createdAt: new Date(),
                updatedAt: new Date(),
                executeFunction: async () => ({ success: true }),
                dependencies: ['task-cpu-heavy', 'task-memory-heavy'], // Depends on long tasks
                priorityFactors: {},
                executionHistory: [],
                estimatedDuration: 2000,
                deadline: new Date(Date.now() + 8000), // Tight deadline
                resourceRequirements: { cpu: 30, memory: 256, network: 10 },
                tags: ['deadline', 'urgent'],
            };
            mockTasks.set('violating-task', violatingTask);
            // Update dependency analysis
            mockDependencyAnalysis.executionLevels['violating-task'] = 1;
            mockDependencyAnalysis.topologicalOrder.push('violating-task');
            const recommendations = optimizer.optimizeQueue(mockTasks, mockDependencyAnalysis, mockMetrics, OptimizationStrategy.DEADLINE_OPTIMIZATION);
            const violationRec = recommendations.find((r) => r.type === 'deadline_violation_warning');
            expect(violationRec).toBeDefined();
        });
    });
    describe('Parallel Execution Optimization', () => {
        it('should identify optimal parallel execution groups', () => {
            const parallelGroups = optimizer.identifyParallelExecutionPaths(mockTasks, mockDependencyAnalysis);
            expect(parallelGroups).toBeDefined();
            expect(parallelGroups.length).toBeGreaterThan(0);
            // Should group tasks by resource compatibility
            const groups = parallelGroups;
            expect(groups.some((group) => group.length > 1)).toBe(true);
        });
        it('should consider resource constraints in parallel grouping', () => {
            const parallelGroups = optimizer.identifyParallelExecutionPaths(mockTasks, mockDependencyAnalysis);
            // Each group should respect resource constraints
            parallelGroups.forEach((group) => {
                let totalCpu = 0;
                let totalMemory = 0;
                let totalNetwork = 0;
                group.forEach((taskId) => {
                    const task = mockTasks.get(taskId);
                    if (task?.resourceRequirements) {
                        totalCpu += task.resourceRequirements.cpu || 0;
                        totalMemory += task.resourceRequirements.memory || 0;
                        totalNetwork += task.resourceRequirements.network || 0;
                    }
                });
                expect(totalCpu).toBeLessThanOrEqual(80); // Max CPU constraint
                expect(totalMemory).toBeLessThanOrEqual(4096); // Max memory constraint
                expect(totalNetwork).toBeLessThanOrEqual(100); // Max network constraint
            });
        });
        it('should respect task dependencies in parallel grouping', () => {
            // Add dependent task
            const dependentTask = {
                id: 'dependent-task',
                title: 'Dependent Task',
                description: 'Task that depends on others',
                status: TaskStatus.PENDING,
                priority: TaskPriority.MEDIUM,
                createdAt: new Date(),
                updatedAt: new Date(),
                executeFunction: async () => ({ success: true }),
                dependencies: ['task-cpu-heavy'],
                priorityFactors: {},
                executionHistory: [],
                estimatedDuration: 1500,
                resourceRequirements: { cpu: 20, memory: 128, network: 5 },
                tags: ['dependent'],
            };
            mockTasks.set('dependent-task', dependentTask);
            // Update dependency analysis
            mockDependencyAnalysis.executionLevels['dependent-task'] = 1;
            mockDependencyAnalysis.topologicalOrder.push('dependent-task');
            const parallelGroups = optimizer.identifyParallelExecutionPaths(mockTasks, mockDependencyAnalysis);
            // Dependent task should not be in same group as its dependency
            const groupWithCpuHeavy = parallelGroups.find((group) => group.includes('task-cpu-heavy'));
            const groupWithDependent = parallelGroups.find((group) => group.includes('dependent-task'));
            if (groupWithCpuHeavy && groupWithDependent) {
                expect(groupWithCpuHeavy).not.toBe(groupWithDependent);
            }
        });
    });
    describe('Task Batching Optimization', () => {
        it('should batch similar tasks effectively', () => {
            // Add more similar tasks
            for (let i = 1; i <= 3; i++) {
                const similarTask = {
                    id: `similar-task-${i}`,
                    title: `Similar Task ${i}`,
                    description: `Similar processing task ${i}`,
                    status: TaskStatus.PENDING,
                    priority: TaskPriority.MEDIUM,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    executeFunction: async () => ({ success: true }),
                    dependencies: [],
                    priorityFactors: {},
                    executionHistory: [],
                    estimatedDuration: 2000,
                    resourceRequirements: { cpu: 30, memory: 256, network: 5 },
                    tags: ['processing', 'similar'],
                };
                mockTasks.set(`similar-task-${i}`, similarTask);
            }
            const batches = optimizer.identifyBatchingOpportunities(mockTasks, BatchingStrategy.SIMILAR_TASKS);
            expect(batches).toBeDefined();
            expect(batches.length).toBeGreaterThan(0);
            // Should find batch of similar tasks
            const similarBatch = batches.find((batch) => batch.tasks.some((taskId) => taskId.includes('similar-task')));
            expect(similarBatch).toBeDefined();
            expect(similarBatch?.tasks.length).toBeGreaterThan(1);
        });
        it('should batch by resource requirements', () => {
            const batches = optimizer.identifyBatchingOpportunities(mockTasks, BatchingStrategy.RESOURCE_OPTIMIZATION);
            expect(batches).toBeDefined();
            expect(batches.length).toBeGreaterThan(0);
            // Each batch should have compatible resource requirements
            batches.forEach((batch) => {
                const resourceTypes = new Set();
                batch.tasks.forEach((taskId) => {
                    const task = mockTasks.get(taskId);
                    if (task?.tags) {
                        task.tags.forEach((tag) => {
                            if (tag.includes('-intensive')) {
                                resourceTypes.add(tag);
                            }
                        });
                    }
                });
                // Should group by similar resource usage patterns
                expect(resourceTypes.size).toBeLessThanOrEqual(2);
            });
        });
        it('should respect batch size limits', () => {
            // Create many similar tasks
            for (let i = 1; i <= 20; i++) {
                const task = {
                    id: `batch-task-${i}`,
                    title: `Batch Task ${i}`,
                    description: `Task for batching ${i}`,
                    status: TaskStatus.PENDING,
                    priority: TaskPriority.LOW,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    executeFunction: async () => ({ success: true }),
                    dependencies: [],
                    priorityFactors: {},
                    executionHistory: [],
                    estimatedDuration: 1000,
                    resourceRequirements: { cpu: 10, memory: 64, network: 2 },
                    tags: ['batch', 'small'],
                };
                mockTasks.set(`batch-task-${i}`, task);
            }
            const batches = optimizer.identifyBatchingOpportunities(mockTasks, BatchingStrategy.SIMILAR_TASKS, { maxBatchSize: 5 });
            // Each batch should respect size limit
            batches.forEach((batch) => {
                expect(batch.tasks.length).toBeLessThanOrEqual(5);
            });
        });
    });
    describe('Performance Metrics and Monitoring', () => {
        it('should calculate optimization impact accurately', () => {
            const recommendations = optimizer.optimizeQueue(mockTasks, mockDependencyAnalysis, mockMetrics, OptimizationStrategy.THROUGHPUT_MAXIMIZATION);
            recommendations.forEach((rec) => {
                expect(rec.impact).toBeDefined();
                expect(typeof rec.impact).toBe('number');
                expect(rec.estimatedImprovement).toBeDefined();
            });
        });
        it('should provide detailed optimization metrics', () => {
            const recommendations = optimizer.optimizeQueue(mockTasks, mockDependencyAnalysis, mockMetrics, OptimizationStrategy.RESOURCE_EFFICIENCY);
            const metricsRec = recommendations.find((r) => r.details?.metrics);
            expect(metricsRec).toBeDefined();
            if (metricsRec?.details?.metrics) {
                expect(metricsRec.details.metrics).toHaveProperty('beforeOptimization');
                expect(metricsRec.details.metrics).toHaveProperty('afterOptimization');
            }
        });
        it('should track optimization history and learning', () => {
            // Run optimization multiple times
            for (let i = 0; i < 3; i++) {
                optimizer.optimizeQueue(mockTasks, mockDependencyAnalysis, mockMetrics, OptimizationStrategy.THROUGHPUT_MAXIMIZATION);
            }
            const optimizationHistory = optimizer.getOptimizationHistory();
            expect(optimizationHistory).toBeDefined();
            expect(optimizationHistory.length).toBe(3);
            // Should learn from previous optimizations
            const learningMetrics = optimizer.getLearningMetrics();
            expect(learningMetrics).toBeDefined();
            expect(learningMetrics.totalOptimizations).toBe(3);
        });
    });
    describe('Resource Allocation Optimization', () => {
        it('should optimize resource allocation', () => {
            const allocation = optimizer.optimizeResourceAllocation(mockTasks, mockDependencyAnalysis, {
                cpu: 100,
                memory: 8192,
                network: 200,
            });
            expect(allocation).toBeDefined();
            expect(allocation.taskAllocations).toBeDefined();
            // Should allocate resources efficiently
            let totalCpu = 0;
            let totalMemory = 0;
            let totalNetwork = 0;
            Object.values(allocation.taskAllocations).forEach((taskAlloc) => {
                totalCpu += taskAlloc.cpu;
                totalMemory += taskAlloc.memory;
                totalNetwork += taskAlloc.network;
            });
            expect(totalCpu).toBeLessThanOrEqual(100);
            expect(totalMemory).toBeLessThanOrEqual(8192);
            expect(totalNetwork).toBeLessThanOrEqual(200);
        });
        it('should handle resource over-subscription gracefully', () => {
            // Set very low resource limits
            const allocation = optimizer.optimizeResourceAllocation(mockTasks, mockDependencyAnalysis, {
                cpu: 20,
                memory: 128,
                network: 10,
            });
            expect(allocation).toBeDefined();
            expect(allocation.overSubscribed).toBe(true);
            expect(allocation.recommendations).toBeDefined();
            expect(allocation.recommendations.length).toBeGreaterThan(0);
        });
    });
    describe('Event Emission and Monitoring', () => {
        it('should emit optimization events', () => {
            const optimizationCompleteSpy = vi.fn();
            optimizer.on('optimization-complete', optimizationCompleteSpy);
            optimizer.optimizeQueue(mockTasks, mockDependencyAnalysis, mockMetrics, OptimizationStrategy.THROUGHPUT_MAXIMIZATION);
            expect(optimizationCompleteSpy).toHaveBeenCalledWith(expect.objectContaining({
                strategy: OptimizationStrategy.THROUGHPUT_MAXIMIZATION,
                recommendationCount: expect.any(Number),
                duration: expect.any(Number),
            }));
        });
        it('should emit resource constraint warnings', () => {
            const resourceWarningSpy = vi.fn();
            optimizer.on('resource-constraint-warning', resourceWarningSpy);
            // Create task that exceeds resource limits
            const overLimitTask = {
                id: 'over-limit',
                title: 'Over Limit Task',
                description: 'Task exceeding resource limits',
                status: TaskStatus.PENDING,
                priority: TaskPriority.HIGH,
                createdAt: new Date(),
                updatedAt: new Date(),
                executeFunction: async () => ({ success: true }),
                dependencies: [],
                priorityFactors: {},
                executionHistory: [],
                estimatedDuration: 5000,
                resourceRequirements: { cpu: 150, memory: 8192, network: 200 }, // Exceeds limits
                tags: ['over-limit'],
            };
            mockTasks.set('over-limit', overLimitTask);
            optimizer.optimizeQueue(mockTasks, mockDependencyAnalysis, mockMetrics, OptimizationStrategy.RESOURCE_EFFICIENCY);
            expect(resourceWarningSpy).toHaveBeenCalled();
        });
    });
    describe('Error Handling and Edge Cases', () => {
        it('should handle empty task queue gracefully', () => {
            const emptyTasks = new Map();
            const recommendations = optimizer.optimizeQueue(emptyTasks, mockDependencyAnalysis, mockMetrics, OptimizationStrategy.THROUGHPUT_MAXIMIZATION);
            expect(recommendations).toBeDefined();
            expect(recommendations).toHaveLength(0);
        });
        it('should handle tasks without resource requirements', () => {
            const taskWithoutResources = {
                id: 'no-resources',
                title: 'No Resources Task',
                description: 'Task without resource requirements',
                status: TaskStatus.PENDING,
                priority: TaskPriority.MEDIUM,
                createdAt: new Date(),
                updatedAt: new Date(),
                executeFunction: async () => ({ success: true }),
                dependencies: [],
                priorityFactors: {},
                executionHistory: [],
                estimatedDuration: 2000,
                // No resourceRequirements property
                tags: ['minimal'],
            };
            const tasksWithMissing = new Map([
                ['no-resources', taskWithoutResources],
            ]);
            const recommendations = optimizer.optimizeQueue(tasksWithMissing, mockDependencyAnalysis, mockMetrics, OptimizationStrategy.RESOURCE_EFFICIENCY);
            expect(recommendations).toBeDefined();
            // Should not crash and should provide recommendations
        });
        it('should handle invalid optimization strategy gracefully', () => {
            expect(() => {
                optimizer.optimizeQueue(mockTasks, mockDependencyAnalysis, mockMetrics, 'INVALID_STRATEGY');
            }).toThrow();
        });
        it('should validate optimization parameters', () => {
            expect(() => {
                new QueueOptimizer({
                    resourceConstraints: {
                        maxCpuUsage: -10, // Invalid negative value
                        maxMemoryUsage: 4096,
                        maxNetworkBandwidth: 100,
                    },
                });
            }).toThrow();
        });
    });
});
//# sourceMappingURL=QueueOptimizer.test.js.map