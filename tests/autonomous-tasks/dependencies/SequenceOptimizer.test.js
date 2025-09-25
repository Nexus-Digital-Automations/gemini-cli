/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, test, expect, beforeEach } from 'vitest';
import { Task } from '../../../packages/core/src/task/types.js';
import { DetectedDependency } from '../../../packages/core/src/decision/DependencyAnalyzer.js';
import { ParallelOptimizer as SequenceOptimizer, ParallelOptimizationConfig as SequenceOptimizationConfig, ResourceConstraint, } from '../../../packages/core/src/decision/ParallelOptimizer.js';
describe('SequenceOptimizer', () => {
    let optimizer;
    let sampleTasks;
    let sampleDependencies;
    beforeEach(() => {
        const config = {
            strategy: 'hybrid',
            maxParallelism: 3,
            priorityWeights: {
                low: 1,
                normal: 2,
                high: 3,
                critical: 5,
            },
            loadBalancingEnabled: true,
        };
        optimizer = new SequenceOptimizer(config);
        // Create sample tasks
        sampleTasks = [
            {
                id: 'task-1',
                title: 'Setup Database',
                description: 'Initialize database schema',
                type: 'implementation',
                priority: 'high',
                status: 'queued',
                feature_id: 'feature-1',
                dependencies: [],
                estimated_effort: 3,
                required_capabilities: ['database', 'backend'],
                created_at: '2024-01-01T00:00:00Z',
                updated_at: '2024-01-01T00:00:00Z',
                created_by: 'system',
            },
            {
                id: 'task-2',
                title: 'Create API',
                description: 'Build REST API endpoints',
                type: 'implementation',
                priority: 'high',
                status: 'queued',
                feature_id: 'feature-1',
                dependencies: ['task-1'],
                estimated_effort: 5,
                required_capabilities: ['backend', 'api'],
                created_at: '2024-01-01T01:00:00Z',
                updated_at: '2024-01-01T01:00:00Z',
                created_by: 'system',
            },
            {
                id: 'task-3',
                title: 'Build Frontend',
                description: 'Create user interface',
                type: 'implementation',
                priority: 'normal',
                status: 'queued',
                feature_id: 'feature-1',
                dependencies: ['task-2'],
                estimated_effort: 4,
                required_capabilities: ['frontend', 'ui'],
                created_at: '2024-01-01T02:00:00Z',
                updated_at: '2024-01-01T02:00:00Z',
                created_by: 'system',
            },
            {
                id: 'task-4',
                title: 'Test System',
                description: 'End-to-end testing',
                type: 'testing',
                priority: 'normal',
                status: 'queued',
                feature_id: 'feature-1',
                dependencies: ['task-3'],
                estimated_effort: 2,
                required_capabilities: ['testing'],
                created_at: '2024-01-01T03:00:00Z',
                updated_at: '2024-01-01T03:00:00Z',
                created_by: 'system',
            },
            {
                id: 'task-5',
                title: 'Write Documentation',
                description: 'Create user documentation',
                type: 'documentation',
                priority: 'low',
                status: 'queued',
                feature_id: 'feature-1',
                dependencies: [],
                estimated_effort: 3,
                required_capabilities: ['documentation'],
                created_at: '2024-01-01T04:00:00Z',
                updated_at: '2024-01-01T04:00:00Z',
                created_by: 'system',
            },
        ];
        // Create sample dependencies
        sampleDependencies = [
            {
                from: 'task-1',
                to: 'task-2',
                type: 'explicit',
                confidence: 1.0,
                reason: 'API depends on database',
                blocking: true,
                estimatedDelay: 3,
            },
            {
                from: 'task-2',
                to: 'task-3',
                type: 'explicit',
                confidence: 1.0,
                reason: 'Frontend depends on API',
                blocking: true,
                estimatedDelay: 5,
            },
            {
                from: 'task-3',
                to: 'task-4',
                type: 'explicit',
                confidence: 1.0,
                reason: 'Testing depends on frontend',
                blocking: true,
                estimatedDelay: 4,
            },
        ];
    });
    describe('optimizeSequence', () => {
        test('should generate optimized sequence with execution batches', async () => {
            const result = await optimizer.optimizeSequence(sampleTasks, sampleDependencies);
            expect(result).toBeDefined();
            expect(result.executionOrder.length).toBeGreaterThan(0);
            expect(result.metrics).toBeDefined();
            expect(result.criticalPath).toBeDefined();
            expect(result.parallelGroups).toBeDefined();
        });
        test('should respect dependency constraints in sequence', async () => {
            const result = await optimizer.optimizeSequence(sampleTasks, sampleDependencies);
            // Find batch containing task-1 and task-2
            let task1BatchIndex = -1;
            let task2BatchIndex = -1;
            result.executionOrder.forEach((batch, index) => {
                if (batch.tasks.includes('task-1'))
                    task1BatchIndex = index;
                if (batch.tasks.includes('task-2'))
                    task2BatchIndex = index;
            });
            // task-1 should come before task-2 due to dependency
            expect(task1BatchIndex).toBeLessThan(task2BatchIndex);
        });
        test('should identify parallel execution opportunities', async () => {
            // Add independent task that can run in parallel
            const parallelTask = {
                id: 'parallel-task',
                title: 'Parallel Task',
                description: 'Task that can run independently',
                type: 'implementation',
                priority: 'normal',
                status: 'queued',
                feature_id: 'feature-2',
                dependencies: [],
                estimated_effort: 2,
                required_capabilities: ['independent'],
                created_at: '2024-01-01T05:00:00Z',
                updated_at: '2024-01-01T05:00:00Z',
                created_by: 'system',
            };
            const tasksWithParallel = [...sampleTasks, parallelTask];
            const result = await optimizer.optimizeSequence(tasksWithParallel, sampleDependencies);
            // Should identify parallel execution groups
            expect(result.parallelGroups.length).toBeGreaterThan(0);
            // At least one parallel group should have multiple tasks
            const multiTaskGroups = result.parallelGroups.filter((group) => group.parallelTasks.length > 1);
            expect(multiTaskGroups.length).toBeGreaterThan(0);
        });
        test('should calculate meaningful metrics', async () => {
            const result = await optimizer.optimizeSequence(sampleTasks, sampleDependencies);
            const metrics = result.metrics;
            expect(metrics.totalCompletionTime).toBeGreaterThan(0);
            expect(metrics.resourceEfficiency).toBeGreaterThanOrEqual(0);
            expect(metrics.resourceEfficiency).toBeLessThanOrEqual(1);
            expect(metrics.parallelizationRatio).toBeGreaterThanOrEqual(0);
            expect(metrics.parallelizationRatio).toBeLessThanOrEqual(1);
            expect(metrics.optimizationScore).toBeGreaterThanOrEqual(0);
            expect(metrics.optimizationScore).toBeLessThanOrEqual(100);
        });
        test('should provide optimization recommendations', async () => {
            const result = await optimizer.optimizeSequence(sampleTasks, sampleDependencies);
            expect(Array.isArray(result.recommendations)).toBe(true);
            // Recommendations should be provided based on metrics
            expect(result.recommendations.length).toBeGreaterThanOrEqual(0);
        });
    });
    describe('optimization strategies', () => {
        test('should apply shortest path strategy correctly', async () => {
            const shortestPathOptimizer = new SequenceOptimizer({
                strategy: 'shortest_path',
                maxParallelism: 4,
            });
            const result = await shortestPathOptimizer.optimizeSequence(sampleTasks, sampleDependencies);
            expect(result).toBeDefined();
            expect(result.executionOrder.length).toBeGreaterThan(0);
            // Should optimize for minimal completion time
            expect(result.metrics.totalCompletionTime).toBeGreaterThan(0);
        });
        test('should apply critical path strategy correctly', async () => {
            const criticalPathOptimizer = new SequenceOptimizer({
                strategy: 'critical_path',
                maxParallelism: 4,
            });
            const result = await criticalPathOptimizer.optimizeSequence(sampleTasks, sampleDependencies);
            expect(result).toBeDefined();
            expect(result.criticalPath.length).toBeGreaterThan(0);
            // Critical path tasks should be prioritized in execution order
            const firstBatch = result.executionOrder[0];
            const criticalTaskInFirstBatch = firstBatch.tasks.some((taskId) => result.criticalPath.includes(taskId));
            expect(criticalTaskInFirstBatch).toBe(true);
        });
        test('should apply priority weighted strategy correctly', async () => {
            const priorityOptimizer = new SequenceOptimizer({
                strategy: 'priority_weighted',
                priorityWeights: {
                    low: 1,
                    normal: 2,
                    high: 4,
                    critical: 8,
                },
            });
            const result = await priorityOptimizer.optimizeSequence(sampleTasks, sampleDependencies);
            // High priority tasks should be scheduled earlier
            const firstBatch = result.executionOrder[0];
            const firstBatchTasks = firstBatch.tasks.map((taskId) => sampleTasks.find((t) => t.id === taskId));
            // Check if high priority tasks are in early batches
            const hasHighPriorityFirst = firstBatchTasks.some((task) => task && (task.priority === 'high' || task.priority === 'critical'));
            expect(hasHighPriorityFirst).toBe(true);
        });
        test('should apply resource balanced strategy correctly', async () => {
            const resourceConstraints = [
                { resourceType: 'backend', maxConcurrent: 2, efficiency: 1.0 },
                { resourceType: 'frontend', maxConcurrent: 1, efficiency: 1.0 },
            ];
            const resourceOptimizer = new SequenceOptimizer({
                strategy: 'resource_balanced',
                resourceConstraints,
                maxParallelism: 4,
            });
            const result = await resourceOptimizer.optimizeSequence(sampleTasks, sampleDependencies);
            expect(result).toBeDefined();
            // Should respect resource constraints
            result.executionOrder.forEach((batch) => {
                const backendTasks = batch.tasks.filter((taskId) => {
                    const task = sampleTasks.find((t) => t.id === taskId);
                    return task?.required_capabilities?.includes('backend');
                });
                // Should not exceed backend resource constraint
                expect(backendTasks.length).toBeLessThanOrEqual(2);
            });
        });
    });
    describe('resource constraints', () => {
        test('should respect resource constraints in batching', async () => {
            const resourceConstraints = [
                { resourceType: 'backend', maxConcurrent: 1, efficiency: 1.0 },
            ];
            const constrainedOptimizer = new SequenceOptimizer({
                strategy: 'resource_balanced',
                resourceConstraints,
                maxParallelism: 4,
            });
            const result = await constrainedOptimizer.optimizeSequence(sampleTasks, sampleDependencies);
            // Check that no batch has more than 1 backend task
            result.executionOrder.forEach((batch) => {
                const backendTaskCount = batch.tasks.filter((taskId) => {
                    const task = sampleTasks.find((t) => t.id === taskId);
                    return task?.required_capabilities?.includes('backend');
                }).length;
                expect(backendTaskCount).toBeLessThanOrEqual(1);
            });
        });
        test('should calculate resource utilization in parallel groups', async () => {
            const result = await optimizer.optimizeSequence(sampleTasks, sampleDependencies);
            result.parallelGroups.forEach((group) => {
                expect(group.resourceUtilization).toBeDefined();
                // Resource utilization should be a valid object
                Object.values(group.resourceUtilization).forEach((utilization) => {
                    expect(typeof utilization).toBe('number');
                    expect(utilization).toBeGreaterThanOrEqual(0);
                });
            });
        });
    });
    describe('parallel execution groups', () => {
        test('should identify tasks that can run in parallel', async () => {
            // Add more independent tasks
            const independentTasks = [
                {
                    id: 'independent-1',
                    title: 'Independent Task 1',
                    description: 'Can run independently',
                    type: 'implementation',
                    priority: 'normal',
                    status: 'queued',
                    feature_id: 'feature-2',
                    dependencies: [],
                    estimated_effort: 1,
                    required_capabilities: ['independent'],
                    created_at: '2024-01-01T05:00:00Z',
                    updated_at: '2024-01-01T05:00:00Z',
                    created_by: 'system',
                },
                {
                    id: 'independent-2',
                    title: 'Independent Task 2',
                    description: 'Can run independently',
                    type: 'implementation',
                    priority: 'normal',
                    status: 'queued',
                    feature_id: 'feature-3',
                    dependencies: [],
                    estimated_effort: 2,
                    required_capabilities: ['independent'],
                    created_at: '2024-01-01T06:00:00Z',
                    updated_at: '2024-01-01T06:00:00Z',
                    created_by: 'system',
                },
            ];
            const allTasks = [...sampleTasks, ...independentTasks];
            const result = await optimizer.optimizeSequence(allTasks, sampleDependencies);
            // Should identify parallel groups
            expect(result.parallelGroups.length).toBeGreaterThan(0);
            // At least one group should contain independent tasks
            const independentGroup = result.parallelGroups.find((group) => group.parallelTasks.includes('independent-1') &&
                group.parallelTasks.includes('independent-2'));
            expect(independentGroup).toBeDefined();
        });
        test('should identify bottleneck tasks in parallel groups', async () => {
            const result = await optimizer.optimizeSequence(sampleTasks, sampleDependencies);
            result.parallelGroups.forEach((group) => {
                if (group.parallelTasks.length > 1) {
                    expect(group.bottlenecks).toBeDefined();
                    expect(Array.isArray(group.bottlenecks)).toBe(true);
                    // Bottlenecks should be tasks with highest effort in the group
                    group.bottlenecks.forEach((bottleneckId) => {
                        expect(group.parallelTasks).toContain(bottleneckId);
                    });
                }
            });
        });
        test('should calculate group completion times correctly', async () => {
            const result = await optimizer.optimizeSequence(sampleTasks, sampleDependencies);
            result.parallelGroups.forEach((group) => {
                expect(group.estimatedCompletion).toBeGreaterThan(0);
                // Completion time should be at least as long as the longest task
                const groupTasks = group.parallelTasks
                    .map((taskId) => sampleTasks.find((t) => t.id === taskId))
                    .filter((t) => t !== undefined);
                const maxEffort = Math.max(...groupTasks.map((t) => t.estimated_effort || 1));
                expect(group.estimatedCompletion).toBeGreaterThanOrEqual(maxEffort);
            });
        });
    });
    describe('edge cases', () => {
        test('should handle empty task list', async () => {
            const result = await optimizer.optimizeSequence([], []);
            expect(result).toBeDefined();
            expect(result.executionOrder).toHaveLength(0);
            expect(result.parallelGroups).toHaveLength(0);
            expect(result.criticalPath).toHaveLength(0);
            expect(result.metrics.totalCompletionTime).toBe(0);
        });
        test('should handle tasks with no dependencies', async () => {
            const independentTasks = sampleTasks.map((task) => ({
                ...task,
                dependencies: [],
            }));
            const result = await optimizer.optimizeSequence(independentTasks, []);
            expect(result).toBeDefined();
            expect(result.executionOrder.length).toBeGreaterThan(0);
            // All tasks should be able to run in parallel (subject to parallelism limits)
            const firstBatch = result.executionOrder[0];
            expect(firstBatch.tasks.length).toBeGreaterThan(1);
        });
        test('should handle circular dependencies gracefully', async () => {
            const circularDeps = [
                {
                    from: 'task-1',
                    to: 'task-2',
                    type: 'explicit',
                    confidence: 1.0,
                    reason: 'Part of cycle',
                    blocking: true,
                    estimatedDelay: 1,
                },
                {
                    from: 'task-2',
                    to: 'task-1', // Creates cycle
                    type: 'explicit',
                    confidence: 1.0,
                    reason: 'Part of cycle',
                    blocking: true,
                    estimatedDelay: 1,
                },
            ];
            const result = await optimizer.optimizeSequence(sampleTasks.slice(0, 2), circularDeps);
            expect(result).toBeDefined();
            // Should still produce a valid sequence even with circular dependencies
            expect(result.executionOrder.length).toBeGreaterThan(0);
        });
        test('should handle tasks with invalid effort values', async () => {
            const tasksWithInvalidEffort = sampleTasks.map((task) => ({
                ...task,
                estimated_effort: undefined, // Invalid effort
            }));
            const result = await optimizer.optimizeSequence(tasksWithInvalidEffort, sampleDependencies);
            expect(result).toBeDefined();
            expect(result.executionOrder.length).toBeGreaterThan(0);
            // Should handle undefined effort gracefully (default to 1)
            expect(result.metrics.totalCompletionTime).toBeGreaterThan(0);
        });
    });
    describe('performance', () => {
        test('should handle large task sets efficiently', async () => {
            const largeTasks = [];
            const largeDeps = [];
            // Create large task set with complex dependencies
            for (let i = 0; i < 50; i++) {
                largeTasks.push({
                    id: `large-task-${i}`,
                    title: `Large Task ${i}`,
                    description: `Task ${i} in large set`,
                    type: 'implementation',
                    priority: i < 10 ? 'high' : 'normal',
                    status: 'queued',
                    feature_id: `feature-${Math.floor(i / 10)}`,
                    dependencies: i > 0 && i % 5 === 0 ? [`large-task-${i - 5}`] : [],
                    estimated_effort: Math.floor(Math.random() * 5) + 1,
                    required_capabilities: [`capability-${i % 3}`],
                    created_at: '2024-01-01T00:00:00Z',
                    updated_at: '2024-01-01T00:00:00Z',
                    created_by: 'system',
                });
                if (i > 0 && i % 5 === 0) {
                    largeDeps.push({
                        from: `large-task-${i - 5}`,
                        to: `large-task-${i}`,
                        type: 'explicit',
                        confidence: 1.0,
                        reason: 'Sequential dependency',
                        blocking: true,
                        estimatedDelay: 1,
                    });
                }
            }
            const startTime = Date.now();
            const result = await optimizer.optimizeSequence(largeTasks, largeDeps);
            const optimizationTime = Date.now() - startTime;
            // Should complete within reasonable time (less than 3 seconds)
            expect(optimizationTime).toBeLessThan(3000);
            expect(result.executionOrder.length).toBeGreaterThan(0);
        });
    });
    describe('configuration options', () => {
        test('should respect max parallelism setting', async () => {
            const limitedParallelismOptimizer = new SequenceOptimizer({
                maxParallelism: 2,
            });
            const result = await limitedParallelismOptimizer.optimizeSequence(sampleTasks, sampleDependencies);
            // Each batch should not exceed max parallelism
            result.executionOrder.forEach((batch) => {
                expect(batch.tasks.length).toBeLessThanOrEqual(2);
            });
        });
        test('should use custom priority weights', async () => {
            const customWeightOptimizer = new SequenceOptimizer({
                strategy: 'priority_weighted',
                priorityWeights: {
                    low: 1,
                    normal: 10, // Very high weight for normal priority
                    high: 2,
                    critical: 3,
                },
            });
            const result = await customWeightOptimizer.optimizeSequence(sampleTasks, sampleDependencies);
            // Normal priority tasks should be scheduled prominently due to high weight
            const firstBatch = result.executionOrder[0];
            const normalPriorityInFirst = firstBatch.tasks.some((taskId) => {
                const task = sampleTasks.find((t) => t.id === taskId);
                return task?.priority === 'normal';
            });
            // Should find normal priority tasks early in the sequence
            expect(normalPriorityInFirst).toBe(true);
        });
        test('should handle disabled load balancing', async () => {
            const noLoadBalancingOptimizer = new SequenceOptimizer({
                loadBalancingEnabled: false,
            });
            const result = await noLoadBalancingOptimizer.optimizeSequence(sampleTasks, sampleDependencies);
            expect(result).toBeDefined();
            expect(result.executionOrder.length).toBeGreaterThan(0);
        });
    });
});
//# sourceMappingURL=SequenceOptimizer.test.js.map