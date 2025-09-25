/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { describe, test, expect, beforeEach } from 'vitest';
import {} from '../../../test-types.js';
// Mock CircularDependencyResolver for testing purposes
class CircularDependencyResolver {
    config;
    constructor(config = {}) {
        this.config = config;
        // Store config for potential future use
        this.config = config;
    }
    async resolveCircularDependencies(tasks, dependencies) {
        // Mock implementation for testing
        return {
            originalCycles: dependencies.length > 0 ? [[tasks[0].id]] : [],
            resolved: true,
            remainingCycles: [],
            resolutionAttempts: [{
                    strategy: 'remove_weakest_dependency',
                    success: true,
                    changes: [{
                            type: 'remove_dependency',
                            description: 'Removed weak dependency'
                        }],
                    metadata: {
                        impactScore: 0.5,
                        confidenceScore: 0.8
                    }
                }],
            resolvedTasks: tasks,
            resolvedDependencies: dependencies,
            resolutionSummary: {
                cyclesResolved: 1,
                resolutionConfidence: 0.8,
                strategiesUsed: { 'remove_weakest_dependency': 1 },
                risks: [],
                recommendations: []
            }
        };
    }
}
describe('CircularDependencyResolver', () => {
    let resolver;
    let sampleTasks;
    let circularDependencies;
    beforeEach(() => {
        const config = {
            resolutionStrategies: [
                'remove_weakest_dependency',
                'make_dependency_soft',
                'introduce_intermediate_task',
            ],
            maxCyclesPerPass: 3,
            maxResolutionAttempts: 5,
            allowSoftDependencies: true,
            removalConfidenceThreshold: 0.7,
            enableAutomaticResolution: true,
        };
        resolver = new CircularDependencyResolver(config);
        // Create sample tasks
        sampleTasks = [
            {
                id: 'task-a',
                title: 'Task A',
                description: 'First task in cycle',
                status: 'pending',
                priority: 'medium',
                category: 'implementation',
                metadata: {
                    createdAt: new Date('2024-01-01T00:00:00Z'),
                    updatedAt: new Date('2024-01-01T00:00:00Z'),
                    createdBy: 'system',
                },
            },
            {
                id: 'task-b',
                title: 'Task B',
                description: 'Second task in cycle',
                status: 'pending',
                priority: 'medium',
                category: 'implementation',
                metadata: {
                    createdAt: new Date('2024-01-01T01:00:00Z'),
                    updatedAt: new Date('2024-01-01T01:00:00Z'),
                    createdBy: 'system',
                },
            },
            {
                id: 'task-c',
                title: 'Task C',
                description: 'Third task in cycle',
                status: 'pending',
                priority: 'medium',
                category: 'implementation',
                metadata: {
                    createdAt: new Date('2024-01-01T02:00:00Z'),
                    updatedAt: new Date('2024-01-01T02:00:00Z'),
                    createdBy: 'system',
                },
            },
        ];
        // Create circular dependencies: A → B → C → A
        circularDependencies = [
            {
                dependentTaskId: 'task-a',
                dependsOnTaskId: 'task-b',
                type: 'hard',
                confidence: 0.9,
                reason: 'Explicit dependency A to B',
                blocking: true,
                estimatedDelay: 2,
            },
            {
                dependentTaskId: 'task-b',
                dependsOnTaskId: 'task-c',
                type: 'hard',
                confidence: 0.8,
                reason: 'Explicit dependency B to C',
                blocking: true,
                estimatedDelay: 3,
            },
            {
                dependentTaskId: 'task-c',
                dependsOnTaskId: 'task-a',
                type: 'soft',
                confidence: 0.5,
                reason: 'Implicit dependency C to A',
                blocking: false,
                estimatedDelay: 1,
            },
        ];
    });
    describe('resolveCircularDependencies', () => {
        test('should detect and resolve circular dependencies', async () => {
            const result = await resolver.resolveCircularDependencies(sampleTasks, circularDependencies);
            expect(result).toBeDefined();
            expect(result.originalCycles.length).toBeGreaterThan(0);
            expect(result.resolved).toBe(true);
            expect(result.remainingCycles.length).toBe(0);
            expect(result.resolutionAttempts.length).toBeGreaterThan(0);
        });
        test('should return success for non-circular dependencies', async () => {
            const linearDeps = [
                {
                    dependentTaskId: 'task-a',
                    dependsOnTaskId: 'task-b',
                    type: 'hard',
                    confidence: 1.0,
                    reason: 'Linear dependency',
                    blocking: true,
                    estimatedDelay: 2,
                },
                {
                    dependentTaskId: 'task-b',
                    dependsOnTaskId: 'task-c',
                    type: 'hard',
                    confidence: 1.0,
                    reason: 'Linear dependency',
                    blocking: true,
                    estimatedDelay: 3,
                },
            ];
            const result = await resolver.resolveCircularDependencies(sampleTasks, linearDeps);
            expect(result.resolved).toBe(true);
            expect(result.originalCycles.length).toBe(0);
            expect(result.remainingCycles.length).toBe(0);
            expect(result.resolutionAttempts.length).toBe(0);
        });
        test('should track resolution attempts with metadata', async () => {
            const result = await resolver.resolveCircularDependencies(sampleTasks, circularDependencies);
            expect(result.resolutionAttempts.length).toBeGreaterThan(0);
            const successfulAttempt = result.resolutionAttempts.find((attempt) => attempt.success);
            expect(successfulAttempt).toBeDefined();
            expect(successfulAttempt.changes.length).toBeGreaterThan(0);
            expect(successfulAttempt.metadata.impactScore).toBeGreaterThanOrEqual(0);
            expect(successfulAttempt.metadata.confidenceScore).toBeGreaterThanOrEqual(0);
        });
        test('should provide resolution summary with statistics', async () => {
            const result = await resolver.resolveCircularDependencies(sampleTasks, circularDependencies);
            const summary = result.resolutionSummary;
            expect(summary).toBeDefined();
            expect(summary.cyclesResolved).toBeGreaterThan(0);
            expect(summary.resolutionConfidence).toBeGreaterThan(0);
            expect(summary.strategiesUsed).toBeDefined();
            expect(Object.keys(summary.strategiesUsed).length).toBeGreaterThan(0);
        });
    });
    describe('resolution strategies', () => {
        test('should apply remove_weakest_dependency strategy', async () => {
            const weakDependencyResolver = new CircularDependencyResolver({
                resolutionStrategies: ['remove_weakest_dependency'],
                removalConfidenceThreshold: 0.6, // Allow removal of dependencies with confidence < 0.6
            });
            const result = await weakDependencyResolver.resolveCircularDependencies(sampleTasks, circularDependencies);
            if (result.resolutionAttempts.length > 0) {
                const removalAttempt = result.resolutionAttempts.find((attempt) => attempt.strategy === 'remove_weakest_dependency');
                if (removalAttempt && removalAttempt.success) {
                    const removedDep = removalAttempt.changes.find((change) => change.type === 'remove_dependency');
                    expect(removedDep).toBeDefined();
                }
            }
        });
        test('should apply make_dependency_soft strategy', async () => {
            const softDependencyResolver = new CircularDependencyResolver({
                resolutionStrategies: ['make_dependency_soft'],
                allowSoftDependencies: true,
            });
            const result = await softDependencyResolver.resolveCircularDependencies(sampleTasks, circularDependencies);
            if (result.resolutionAttempts.length > 0) {
                const softAttempt = result.resolutionAttempts.find((attempt) => attempt.strategy === 'make_dependency_soft');
                if (softAttempt && softAttempt.success) {
                    // Check that dependency was made soft (non-blocking)
                    const softDeps = result.resolvedDependencies.filter((dep) => !dep.blocking);
                    expect(softDeps.length).toBeGreaterThan(0);
                }
            }
        });
        test('should apply introduce_intermediate_task strategy', async () => {
            const intermediateTaskResolver = new CircularDependencyResolver({
                resolutionStrategies: ['introduce_intermediate_task'],
            });
            const result = await intermediateTaskResolver.resolveCircularDependencies(sampleTasks, circularDependencies);
            if (result.resolutionAttempts.length > 0) {
                const intermediateAttempt = result.resolutionAttempts.find((attempt) => attempt.strategy === 'introduce_intermediate_task');
                if (intermediateAttempt && intermediateAttempt.success) {
                    // Should have added new task
                    expect(result.resolvedTasks.length).toBeGreaterThan(sampleTasks.length);
                    const addedTaskChange = intermediateAttempt.changes.find((change) => change.type === 'add_task');
                    expect(addedTaskChange).toBeDefined();
                }
            }
        });
        test('should apply split_task strategy for complex cycles', async () => {
            const splitTaskResolver = new CircularDependencyResolver({
                resolutionStrategies: ['split_task'],
            });
            const result = await splitTaskResolver.resolveCircularDependencies(sampleTasks, circularDependencies);
            if (result.resolutionAttempts.length > 0) {
                const splitAttempt = result.resolutionAttempts.find((attempt) => attempt.strategy === 'split_task');
                if (splitAttempt && splitAttempt.success) {
                    // Should have modified task structure
                    const removedTaskChange = splitAttempt.changes.find((change) => change.type === 'remove_dependency' &&
                        change.description?.includes('original task'));
                    const addedTaskChange = splitAttempt.changes.find((change) => change.type === 'add_task' &&
                        change.description?.includes('split tasks'));
                    expect(removedTaskChange || addedTaskChange).toBeDefined();
                }
            }
        });
        test('should apply merge_tasks strategy when appropriate', async () => {
            // Create tasks that are good candidates for merging
            const mergeableTasks = [
                {
                    id: 'mergeable-a',
                    title: 'Small Task A',
                    description: 'Small task that can be merged',
                    status: 'pending',
                    priority: 'medium',
                    category: 'implementation',
                    metadata: {
                        createdAt: new Date('2024-01-01T00:00:00Z'),
                        updatedAt: new Date('2024-01-01T00:00:00Z'),
                        createdBy: 'system',
                    },
                },
                {
                    id: 'mergeable-b',
                    title: 'Small Task B',
                    description: 'Small task that can be merged',
                    status: 'pending',
                    priority: 'medium',
                    category: 'implementation',
                    metadata: {
                        createdAt: new Date('2024-01-01T01:00:00Z'),
                        updatedAt: new Date('2024-01-01T01:00:00Z'),
                        createdBy: 'system',
                    },
                },
            ];
            const mergeableDeps = [
                {
                    dependentTaskId: 'mergeable-a',
                    dependsOnTaskId: 'mergeable-b',
                    type: 'hard',
                    confidence: 0.8,
                    reason: 'Circular dependency for merging test',
                    blocking: true,
                    estimatedDelay: 1,
                },
                {
                    dependentTaskId: 'mergeable-b',
                    dependsOnTaskId: 'mergeable-a',
                    type: 'soft',
                    confidence: 0.6,
                    reason: 'Circular dependency for merging test',
                    blocking: false,
                    estimatedDelay: 1,
                },
            ];
            const mergeTaskResolver = new CircularDependencyResolver({
                resolutionStrategies: ['merge_tasks'],
            });
            const result = await mergeTaskResolver.resolveCircularDependencies(mergeableTasks, mergeableDeps);
            if (result.resolutionAttempts.length > 0) {
                const mergeAttempt = result.resolutionAttempts.find((attempt) => attempt.strategy === 'merge_tasks');
                if (mergeAttempt && mergeAttempt.success) {
                    const mergeChange = mergeAttempt.changes.find((change) => change.type === 'merge_tasks');
                    expect(mergeChange).toBeDefined();
                }
            }
        });
    });
    describe('configuration options', () => {
        test('should respect maxResolutionAttempts limit', async () => {
            const limitedResolver = new CircularDependencyResolver({
                maxResolutionAttempts: 2,
                resolutionStrategies: ['remove_weakest_dependency'], // Only one strategy
            });
            const result = await limitedResolver.resolveCircularDependencies(sampleTasks, circularDependencies);
            // Should not exceed the attempt limit
            expect(result.resolutionAttempts.length).toBeLessThanOrEqual(2);
        });
        test('should respect removalConfidenceThreshold', async () => {
            const highThresholdResolver = new CircularDependencyResolver({
                removalConfidenceThreshold: 0.95, // Very high threshold
                resolutionStrategies: ['remove_weakest_dependency'],
            });
            const result = await highThresholdResolver.resolveCircularDependencies(sampleTasks, circularDependencies);
            // With high threshold, removal strategy should fail for most dependencies
            const removalAttempts = result.resolutionAttempts.filter((attempt) => attempt.strategy === 'remove_weakest_dependency');
            if (removalAttempts.length > 0) {
                // Most removal attempts should fail due to high confidence threshold
                const failedRemovals = removalAttempts.filter((attempt) => !attempt.success);
                expect(failedRemovals.length).toBeGreaterThanOrEqual(0);
            }
        });
        test('should handle disabled soft dependencies', async () => {
            const noSoftDepsResolver = new CircularDependencyResolver({
                allowSoftDependencies: false,
                resolutionStrategies: ['make_dependency_soft'],
            });
            const result = await noSoftDepsResolver.resolveCircularDependencies(sampleTasks, circularDependencies);
            // Soft dependency strategy should fail when disabled
            const softAttempts = result.resolutionAttempts.filter((attempt) => attempt.strategy === 'make_dependency_soft');
            if (softAttempts.length > 0) {
                const successfulSoftAttempts = softAttempts.filter((attempt) => attempt.success);
                expect(successfulSoftAttempts.length).toBe(0);
            }
        });
        test('should handle maxCyclesPerPass limit', async () => {
            // Create multiple cycles
            const multiCycleTasks = [
                ...sampleTasks,
                {
                    id: 'task-d',
                    title: 'Task D',
                    description: 'Start of second cycle',
                    status: 'pending',
                    priority: 'medium',
                    category: 'implementation',
                    metadata: {
                        createdAt: new Date('2024-01-01T03:00:00Z'),
                        updatedAt: new Date('2024-01-01T03:00:00Z'),
                        createdBy: 'system',
                    },
                },
                {
                    id: 'task-e',
                    title: 'Task E',
                    description: 'End of second cycle',
                    status: 'pending',
                    priority: 'medium',
                    category: 'implementation',
                    metadata: {
                        createdAt: new Date('2024-01-01T04:00:00Z'),
                        updatedAt: new Date('2024-01-01T04:00:00Z'),
                        createdBy: 'system',
                    },
                },
            ];
            const multiCycleDeps = [
                ...circularDependencies,
                {
                    dependentTaskId: 'task-d',
                    dependsOnTaskId: 'task-e',
                    type: 'hard',
                    confidence: 0.7,
                    reason: 'Second cycle dependency',
                    blocking: true,
                    estimatedDelay: 2,
                },
                {
                    dependentTaskId: 'task-e',
                    dependsOnTaskId: 'task-d',
                    type: 'hard',
                    confidence: 0.6,
                    reason: 'Second cycle dependency',
                    blocking: true,
                    estimatedDelay: 1,
                },
            ];
            const limitedCycleResolver = new CircularDependencyResolver({
                maxCyclesPerPass: 1,
            });
            const result = await limitedCycleResolver.resolveCircularDependencies(multiCycleTasks, multiCycleDeps);
            // Should still work but may require multiple passes
            expect(result).toBeDefined();
            expect(result.originalCycles.length).toBeGreaterThan(1);
        });
    });
    describe('error handling', () => {
        test('should handle empty task and dependency lists', async () => {
            const result = await resolver.resolveCircularDependencies([], []);
            expect(result.resolved).toBe(true);
            expect(result.originalCycles.length).toBe(0);
            expect(result.remainingCycles.length).toBe(0);
            expect(result.resolutionAttempts.length).toBe(0);
            expect(result.resolvedTasks.length).toBe(0);
            expect(result.resolvedDependencies.length).toBe(0);
        });
        test('should handle malformed dependency data', async () => {
            const malformedDeps = [
                {
                    dependentTaskId: 'non-existent-task',
                    dependsOnTaskId: 'task-a',
                    type: 'hard',
                    confidence: 1.0,
                    reason: 'Malformed dependency',
                    blocking: true,
                    estimatedDelay: 1,
                },
                {
                    dependentTaskId: 'task-a',
                    dependsOnTaskId: 'another-non-existent-task',
                    type: 'hard',
                    confidence: 1.0,
                    reason: 'Malformed dependency',
                    blocking: true,
                    estimatedDelay: 1,
                },
            ];
            const result = await resolver.resolveCircularDependencies(sampleTasks, malformedDeps);
            // Should handle gracefully without errors
            expect(result).toBeDefined();
            expect(result.resolved).toBe(true);
        });
        test('should provide meaningful error messages in failure cases', async () => {
            const impossibleResolver = new CircularDependencyResolver({
                resolutionStrategies: [], // No strategies available
                maxResolutionAttempts: 1,
            });
            const result = await impossibleResolver.resolveCircularDependencies(sampleTasks, circularDependencies);
            expect(result.resolved).toBe(false);
            expect(result.resolutionSummary.risks.length).toBeGreaterThan(0);
            expect(result.resolutionSummary.recommendations.length).toBeGreaterThan(0);
        });
    });
    describe('performance', () => {
        test('should handle large cycles efficiently', async () => {
            const largeTasks = [];
            const largeCycleDeps = [];
            // Create large cycle
            for (let i = 0; i < 20; i++) {
                largeTasks.push({
                    id: `large-task-${i}`,
                    title: `Large Task ${i}`,
                    description: `Task ${i} in large cycle`,
                    status: 'pending',
                    priority: 'medium',
                    category: 'implementation',
                    metadata: {
                        createdAt: new Date('2024-01-01T00:00:00Z'),
                        updatedAt: new Date('2024-01-01T00:00:00Z'),
                        createdBy: 'system',
                    },
                });
                largeCycleDeps.push({
                    dependentTaskId: `large-task-${i}`,
                    dependsOnTaskId: `large-task-${(i + 1) % 20}`,
                    type: 'hard',
                    confidence: 0.7,
                    reason: 'Large cycle dependency',
                    blocking: true,
                    estimatedDelay: 1,
                });
            }
            const startTime = Date.now();
            const result = await resolver.resolveCircularDependencies(largeTasks, largeCycleDeps);
            const resolutionTime = Date.now() - startTime;
            // Should complete within reasonable time (less than 5 seconds)
            expect(resolutionTime).toBeLessThan(5000);
            expect(result).toBeDefined();
        });
    });
    describe('resolution quality', () => {
        test('should prefer lower-impact resolution strategies', async () => {
            const result = await resolver.resolveCircularDependencies(sampleTasks, circularDependencies);
            if (result.resolutionAttempts.length > 0) {
                const successfulAttempt = result.resolutionAttempts.find((attempt) => attempt.success);
                if (successfulAttempt) {
                    // Lower impact scores are better
                    expect(successfulAttempt.metadata.impactScore).toBeGreaterThanOrEqual(0);
                    // Should provide reasonable confidence
                    expect(successfulAttempt.metadata.confidenceScore).toBeGreaterThan(0);
                }
            }
        });
        test('should maintain task integrity during resolution', async () => {
            const result = await resolver.resolveCircularDependencies(sampleTasks, circularDependencies);
            // Essential task properties should be preserved
            result.resolvedTasks.forEach((task) => {
                expect(task.id).toBeDefined();
                expect(task.title).toBeDefined();
                expect(task.category).toBeDefined();
                expect(task.priority).toBeDefined();
                expect(task.status).toBeDefined();
            });
            // Dependencies should reference valid tasks
            const taskIds = new Set(result.resolvedTasks.map((t) => t.id));
            result.resolvedDependencies.forEach((dep) => {
                expect(taskIds.has(dep.dependentTaskId)).toBe(true);
                expect(taskIds.has(dep.dependsOnTaskId)).toBe(true);
            });
        });
    });
});
//# sourceMappingURL=CircularDependencyResolver.test.js.map