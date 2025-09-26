/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, test, expect, beforeEach } from 'vitest';
import {
  Task,
  TaskDependency,
  ResourceConstraint,
} from '../../../packages/core/src/task-management/types.js';
import {
  ParallelOptimizer as SequenceOptimizer,
  ParallelOptimizationConfig,
  ParallelStrategy,
} from '../../../packages/core/src/decision/ParallelOptimizer.js';

// Define proper interfaces for test types based on actual usage
interface TestExecutionBatch {
  tasks: string[];
}

interface TestParallelGroup {
  tasks: string[];
  parallelTasks: string[];
  resourceUtilization: Record<string, number>;
  bottlenecks: string[];
  estimatedCompletion: number;
}

interface _TestOptimizationResult {
  executionOrder: TestExecutionBatch[];
  parallelGroups: TestParallelGroup[];
}

describe('SequenceOptimizer', () => {
  let optimizer: SequenceOptimizer;
  let sampleTasks: Task[];
  let sampleDependencies: TaskDependency[];

  beforeEach(() => {
    const config: Partial<ParallelOptimizationConfig> = {
      strategy: ParallelStrategy.ADAPTIVE_DYNAMIC,
      maxConcurrency: 3,
      resourcePools: new Map(),
      enableDynamicRebalancing: true,
      targetResourceUtilization: 0.8,
      minTaskDurationForParallelization: 1000,
      enablePredictiveAllocation: false,
      learningRate: 0.1,
    };

    optimizer = new SequenceOptimizer(config);

    // Create sample tasks
    sampleTasks = [
      {
        id: 'task-1',
        title: 'Setup Database',
        description: 'Initialize database schema',
        category: 'implementation',
        priority: 'high',
        status: 'pending',
        metadata: {
          createdAt: new Date('2024-01-01T00:00:00Z'),
          updatedAt: new Date('2024-01-01T00:00:00Z'),
          createdBy: 'system',
          estimatedDuration: 3000,
          tags: ['database', 'backend'],
        },
      },
      {
        id: 'task-2',
        title: 'Create API',
        description: 'Build REST API endpoints',
        category: 'implementation',
        priority: 'high',
        status: 'pending',
        metadata: {
          createdAt: new Date('2024-01-01T01:00:00Z'),
          updatedAt: new Date('2024-01-01T01:00:00Z'),
          createdBy: 'system',
          estimatedDuration: 5000,
          tags: ['backend', 'api'],
        },
      },
      {
        id: 'task-3',
        title: 'Build Frontend',
        description: 'Create user interface',
        category: 'implementation',
        priority: 'medium',
        status: 'pending',
        metadata: {
          createdAt: new Date('2024-01-01T02:00:00Z'),
          updatedAt: new Date('2024-01-01T02:00:00Z'),
          createdBy: 'system',
          estimatedDuration: 4000,
          tags: ['frontend', 'ui'],
        },
      },
      {
        id: 'task-4',
        title: 'Test System',
        description: 'End-to-end testing',
        category: 'testing',
        priority: 'medium',
        status: 'pending',
        metadata: {
          createdAt: new Date('2024-01-01T03:00:00Z'),
          updatedAt: new Date('2024-01-01T03:00:00Z'),
          createdBy: 'system',
          estimatedDuration: 2000,
          tags: ['testing'],
        },
      },
      {
        id: 'task-5',
        title: 'Write Documentation',
        description: 'Create user documentation',
        category: 'documentation',
        priority: 'low',
        status: 'pending',
        metadata: {
          createdAt: new Date('2024-01-01T04:00:00Z'),
          updatedAt: new Date('2024-01-01T04:00:00Z'),
          createdBy: 'system',
          estimatedDuration: 3000,
          tags: ['documentation'],
        },
      },
    ];

    // Create sample dependencies
    sampleDependencies = [
      {
        dependentTaskId: 'task-2',
        dependsOnTaskId: 'task-1',
        type: 'hard',
        reason: 'API depends on database',
        parallelizable: false,
        minDelay: 3,
      },
      {
        dependentTaskId: 'task-3',
        dependsOnTaskId: 'task-2',
        type: 'hard',
        reason: 'Frontend depends on API',
        parallelizable: false,
        minDelay: 5,
      },
      {
        dependentTaskId: 'task-4',
        dependsOnTaskId: 'task-3',
        type: 'hard',
        reason: 'Testing depends on frontend',
        parallelizable: false,
        minDelay: 4,
      },
    ];
  });

  describe('optimizeSequence', () => {
    test('should generate optimized sequence with execution batches', async () => {
      const result = await optimizer.optimizeSequence(
        sampleTasks,
        sampleDependencies,
      );

      expect(result).toBeDefined();
      expect(result.executionOrder.length).toBeGreaterThan(0);
      expect(result.metrics).toBeDefined();
      expect(result.criticalPath).toBeDefined();
      expect(result.parallelGroups).toBeDefined();
    });

    test('should respect dependency constraints in sequence', async () => {
      const result = await optimizer.optimizeSequence(
        sampleTasks,
        sampleDependencies,
      );

      // Find batch containing task-1 and task-2
      let task1BatchIndex = -1;
      let task2BatchIndex = -1;

      result.executionOrder.forEach(
        (batch: TestExecutionBatch, index: number) => {
          if (batch.tasks.includes('task-1')) task1BatchIndex = index;
          if (batch.tasks.includes('task-2')) task2BatchIndex = index;
        },
      );

      // task-1 should come before task-2 due to dependency
      expect(task1BatchIndex).toBeLessThan(task2BatchIndex);
    });

    test('should identify parallel execution opportunities', async () => {
      // Add independent task that can run in parallel
      const parallelTask: Task = {
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
      const result = await optimizer.optimizeSequence(
        tasksWithParallel,
        sampleDependencies,
      );

      // Should identify parallel execution groups
      expect(result.parallelGroups.length).toBeGreaterThan(0);

      // At least one parallel group should have multiple tasks
      const multiTaskGroups = result.parallelGroups.filter(
        (group: TestParallelGroup) => group.parallelTasks.length > 1,
      );
      expect(multiTaskGroups.length).toBeGreaterThan(0);
    });

    test('should calculate meaningful metrics', async () => {
      const result = await optimizer.optimizeSequence(
        sampleTasks,
        sampleDependencies,
      );

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
      const result = await optimizer.optimizeSequence(
        sampleTasks,
        sampleDependencies,
      );

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

      const result = await shortestPathOptimizer.optimizeSequence(
        sampleTasks,
        sampleDependencies,
      );

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

      const result = await criticalPathOptimizer.optimizeSequence(
        sampleTasks,
        sampleDependencies,
      );

      expect(result).toBeDefined();
      expect(result.criticalPath.length).toBeGreaterThan(0);

      // Critical path tasks should be prioritized in execution order
      const firstBatch = result.executionOrder[0];
      const criticalTaskInFirstBatch = firstBatch.tasks.some((taskId: string) =>
        result.criticalPath.includes(taskId),
      );
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

      const result = await priorityOptimizer.optimizeSequence(
        sampleTasks,
        sampleDependencies,
      );

      // High priority tasks should be scheduled earlier
      const firstBatch = result.executionOrder[0];
      const firstBatchTasks = firstBatch.tasks.map((taskId: string) =>
        sampleTasks.find((t: Task) => t.id === taskId),
      );

      // Check if high priority tasks are in early batches
      const hasHighPriorityFirst = firstBatchTasks.some(
        (task: Task | undefined) =>
          task && (task.priority === 'high' || task.priority === 'critical'),
      );
      expect(hasHighPriorityFirst).toBe(true);
    });

    test('should apply resource balanced strategy correctly', async () => {
      const resourceConstraints: ResourceConstraint[] = [
        { resourceType: 'backend', maxConcurrent: 2, efficiency: 1.0 },
        { resourceType: 'frontend', maxConcurrent: 1, efficiency: 1.0 },
      ];

      const resourceOptimizer = new SequenceOptimizer({
        strategy: 'resource_balanced',
        resourceConstraints,
        maxParallelism: 4,
      });

      const result = await resourceOptimizer.optimizeSequence(
        sampleTasks,
        sampleDependencies,
      );

      expect(result).toBeDefined();

      // Should respect resource constraints
      result.executionOrder.forEach((batch: TestExecutionBatch) => {
        const backendTasks = batch.tasks.filter((taskId: string) => {
          const task = sampleTasks.find((t: Task) => t.id === taskId);
          return task?.required_capabilities?.includes('backend');
        });

        // Should not exceed backend resource constraint
        expect(backendTasks.length).toBeLessThanOrEqual(2);
      });
    });
  });

  describe('resource constraints', () => {
    test('should respect resource constraints in batching', async () => {
      const resourceConstraints: ResourceConstraint[] = [
        { resourceType: 'backend', maxConcurrent: 1, efficiency: 1.0 },
      ];

      const constrainedOptimizer = new SequenceOptimizer({
        strategy: 'resource_balanced',
        resourceConstraints,
        maxParallelism: 4,
      });

      const result = await constrainedOptimizer.optimizeSequence(
        sampleTasks,
        sampleDependencies,
      );

      // Check that no batch has more than 1 backend task
      result.executionOrder.forEach((batch: TestExecutionBatch) => {
        const backendTaskCount = batch.tasks.filter((taskId: string) => {
          const task = sampleTasks.find((t: Task) => t.id === taskId);
          return task?.required_capabilities?.includes('backend');
        }).length;

        expect(backendTaskCount).toBeLessThanOrEqual(1);
      });
    });

    test('should calculate resource utilization in parallel groups', async () => {
      const result = await optimizer.optimizeSequence(
        sampleTasks,
        sampleDependencies,
      );

      result.parallelGroups.forEach((group: TestParallelGroup) => {
        expect(group.resourceUtilization).toBeDefined();

        // Resource utilization should be a valid object
        Object.values(group.resourceUtilization).forEach(
          (utilization: number) => {
            expect(typeof utilization).toBe('number');
            expect(utilization).toBeGreaterThanOrEqual(0);
          },
        );
      });
    });
  });

  describe('parallel execution groups', () => {
    test('should identify tasks that can run in parallel', async () => {
      // Add more independent tasks
      const independentTasks: Task[] = [
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
      const result = await optimizer.optimizeSequence(
        allTasks,
        sampleDependencies,
      );

      // Should identify parallel groups
      expect(result.parallelGroups.length).toBeGreaterThan(0);

      // At least one group should contain independent tasks
      const independentGroup = result.parallelGroups.find(
        (group: TestParallelGroup) =>
          group.parallelTasks.includes('independent-1') &&
          group.parallelTasks.includes('independent-2'),
      );
      expect(independentGroup).toBeDefined();
    });

    test('should identify bottleneck tasks in parallel groups', async () => {
      const result = await optimizer.optimizeSequence(
        sampleTasks,
        sampleDependencies,
      );

      result.parallelGroups.forEach((group: TestParallelGroup) => {
        if (group.parallelTasks.length > 1) {
          expect(group.bottlenecks).toBeDefined();
          expect(Array.isArray(group.bottlenecks)).toBe(true);

          // Bottlenecks should be tasks with highest effort in the group
          group.bottlenecks.forEach((bottleneckId: string) => {
            expect(group.parallelTasks).toContain(bottleneckId);
          });
        }
      });
    });

    test('should calculate group completion times correctly', async () => {
      const result = await optimizer.optimizeSequence(
        sampleTasks,
        sampleDependencies,
      );

      result.parallelGroups.forEach((group: TestParallelGroup) => {
        expect(group.estimatedCompletion).toBeGreaterThan(0);

        // Completion time should be at least as long as the longest task
        const groupTasks = group.parallelTasks
          .map((taskId: string) =>
            sampleTasks.find((t: Task) => t.id === taskId),
          )
          .filter((t: Task | undefined): t is Task => t !== undefined);

        const maxEffort = Math.max(
          ...groupTasks.map((t: Task) => t.estimated_effort || 1),
        );
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
      const independentTasks = sampleTasks.map((task: Task) => ({
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
      const circularDeps: DetectedDependency[] = [
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

      const result = await optimizer.optimizeSequence(
        sampleTasks.slice(0, 2),
        circularDeps,
      );

      expect(result).toBeDefined();
      // Should still produce a valid sequence even with circular dependencies
      expect(result.executionOrder.length).toBeGreaterThan(0);
    });

    test('should handle tasks with invalid effort values', async () => {
      const tasksWithInvalidEffort = sampleTasks.map((task: Task) => ({
        ...task,
        estimated_effort: undefined, // Invalid effort
      }));

      const result = await optimizer.optimizeSequence(
        tasksWithInvalidEffort,
        sampleDependencies,
      );

      expect(result).toBeDefined();
      expect(result.executionOrder.length).toBeGreaterThan(0);

      // Should handle undefined effort gracefully (default to 1)
      expect(result.metrics.totalCompletionTime).toBeGreaterThan(0);
    });
  });

  describe('performance', () => {
    test('should handle large task sets efficiently', async () => {
      const largeTasks: Task[] = [];
      const largeDeps: DetectedDependency[] = [];

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

      const result = await limitedParallelismOptimizer.optimizeSequence(
        sampleTasks,
        sampleDependencies,
      );

      // Each batch should not exceed max parallelism
      result.executionOrder.forEach((batch: TestExecutionBatch) => {
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

      const result = await customWeightOptimizer.optimizeSequence(
        sampleTasks,
        sampleDependencies,
      );

      // Normal priority tasks should be scheduled prominently due to high weight
      const firstBatch = result.executionOrder[0];
      const normalPriorityInFirst = firstBatch.tasks.some((taskId: string) => {
        const task = sampleTasks.find((t: Task) => t.id === taskId);
        return task?.priority === 'normal';
      });

      // Should find normal priority tasks early in the sequence
      expect(normalPriorityInFirst).toBe(true);
    });

    test('should handle disabled load balancing', async () => {
      const noLoadBalancingOptimizer = new SequenceOptimizer({
        loadBalancingEnabled: false,
      });

      const result = await noLoadBalancingOptimizer.optimizeSequence(
        sampleTasks,
        sampleDependencies,
      );

      expect(result).toBeDefined();
      expect(result.executionOrder.length).toBeGreaterThan(0);
    });
  });
});
