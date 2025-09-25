/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, test, expect, beforeEach } from 'vitest';
import { TaskSequencer } from './task-sequencer.js';
import { DependencyGraphManager } from './dependency-graph.js';
import type {
  Task,
  TaskQueueConfig,
  TaskPriority,
  TaskCategory,
  ResourceConstraint,
} from './types.js';

describe('TaskSequencer', () => {
  let sequencer: TaskSequencer;
  let dependencyGraph: DependencyGraphManager;
  let config: TaskQueueConfig;
  let sampleTasks: Map<string, Task>;

  beforeEach(() => {
    dependencyGraph = new DependencyGraphManager();

    config = {
      maxConcurrentTasks: 3,
      defaultTimeout: 300000,
      defaultMaxRetries: 2,
      resourcePools: new Map([
        ['cpu', 8],
        ['memory', 16384],
        ['network', 2],
      ]),
      priorityThresholds: {
        critical: 10,
        high: 7,
        medium: 4,
        low: 1,
      },
      schedulingAlgorithm: 'hybrid',
      autoDependencyLearning: false,
      performanceMonitoring: true,
    };

    sequencer = new TaskSequencer(dependencyGraph, config);

    // Create sample tasks with different complexities and priorities
    sampleTasks = new Map();
    const taskDefinitions = [
      {
        id: 'task1',
        title: 'Setup Environment',
        category: 'implementation' as TaskCategory,
        priority: 'high' as TaskPriority,
        cpu: 2,
        memory: 1024,
      },
      {
        id: 'task2',
        title: 'Database Migration',
        category: 'implementation' as TaskCategory,
        priority: 'critical' as TaskPriority,
        cpu: 4,
        memory: 2048,
      },
      {
        id: 'task3',
        title: 'Unit Tests',
        category: 'testing' as TaskCategory,
        priority: 'medium' as TaskPriority,
        cpu: 1,
        memory: 512,
      },
      {
        id: 'task4',
        title: 'Documentation',
        category: 'documentation' as TaskCategory,
        priority: 'low' as TaskPriority,
        cpu: 1,
        memory: 256,
      },
      {
        id: 'task5',
        title: 'Performance Analysis',
        category: 'analysis' as TaskCategory,
        priority: 'medium' as TaskPriority,
        cpu: 6,
        memory: 4096,
      },
    ];

    taskDefinitions.forEach((def) => {
      const task = createTestTask(
        def.id,
        def.title,
        def.category,
        def.priority,
        [
          { resourceType: 'cpu', maxUnits: def.cpu },
          { resourceType: 'memory', maxUnits: def.memory },
        ],
      );
      sampleTasks.set(def.id, task);
      dependencyGraph.addTask(task);
    });
  });

  describe('Priority-Based Sequencing', () => {
    test('should sequence tasks by priority correctly', () => {
      const sequence = sequencer.generateExecutionSequence(
        sampleTasks,
        'priority',
      );

      expect(sequence.metadata.algorithm).toBe('priority');
      expect(sequence.sequence.length).toBe(5);

      // Critical priority task should come first
      const firstTaskId = sequence.sequence[0];
      const firstTask = sampleTasks.get(firstTaskId)!;
      expect(firstTask.priority).toBe('critical');
    });

    test('should break ties by creation time', () => {
      // Create two tasks with same priority but different creation times
      const laterTime = new Date(Date.now() + 1000);

      const taskA = createTestTask('taskA', 'Task A', 'implementation', 'high');
      const taskB = createTestTask('taskB', 'Task B', 'implementation', 'high');
      taskB.metadata.createdAt = laterTime;

      const testTasks = new Map([
        ['taskA', taskA],
        ['taskB', taskB],
      ]);

      // Add to dependency graph
      dependencyGraph.addTask(taskA);
      dependencyGraph.addTask(taskB);

      const sequence = sequencer.generateExecutionSequence(
        testTasks,
        'priority',
      );

      // Task A should come before Task B (earlier creation time)
      const taskAIndex = sequence.sequence.indexOf('taskA');
      const taskBIndex = sequence.sequence.indexOf('taskB');
      expect(taskAIndex).toBeLessThan(taskBIndex);
    });

    test('should identify parallel groups in priority sequence', () => {
      const sequence = sequencer.generateExecutionSequence(
        sampleTasks,
        'priority',
      );

      expect(sequence.parallelGroups.length).toBeGreaterThan(0);

      // Tasks with no dependencies should be parallelizable
      const firstGroup = sequence.parallelGroups[0];
      expect(firstGroup.length).toBeGreaterThan(1);
    });
  });

  describe('Dependency-Aware Sequencing', () => {
    test('should respect dependency ordering', () => {
      // Create dependency: task2 depends on task1
      dependencyGraph.addDependency({
        dependentTaskId: 'task2',
        dependsOnTaskId: 'task1',
        type: 'hard',
      });

      const sequence = sequencer.generateExecutionSequence(
        sampleTasks,
        'dependency_aware',
      );

      expect(sequence.metadata.algorithm).toBe('dependency_aware');

      const task1Index = sequence.sequence.indexOf('task1');
      const task2Index = sequence.sequence.indexOf('task2');

      expect(task1Index).toBeLessThan(task2Index);
    });

    test('should handle complex dependency chains', () => {
      // Create chain: task1 -> task2 -> task3
      dependencyGraph.addDependency({
        dependentTaskId: 'task2',
        dependsOnTaskId: 'task1',
        type: 'hard',
      });

      dependencyGraph.addDependency({
        dependentTaskId: 'task3',
        dependsOnTaskId: 'task2',
        type: 'hard',
      });

      const sequence = sequencer.generateExecutionSequence(
        sampleTasks,
        'dependency_aware',
      );

      const task1Index = sequence.sequence.indexOf('task1');
      const task2Index = sequence.sequence.indexOf('task2');
      const task3Index = sequence.sequence.indexOf('task3');

      expect(task1Index).toBeLessThan(task2Index);
      expect(task2Index).toBeLessThan(task3Index);
    });

    test('should fallback to priority for cyclic dependencies', () => {
      // Create circular dependency
      dependencyGraph.addDependency({
        dependentTaskId: 'task2',
        dependsOnTaskId: 'task1',
        type: 'hard',
      });

      dependencyGraph.addDependency({
        dependentTaskId: 'task1',
        dependsOnTaskId: 'task2',
        type: 'hard',
      });

      const sequence = sequencer.generateExecutionSequence(
        sampleTasks,
        'dependency_aware',
      );

      // Should still generate a sequence (fallback to priority)
      expect(sequence.sequence.length).toBe(5);
      expect(sequence.metadata.algorithm).toBe('dependency_aware');
    });

    test('should generate correct parallel groups', () => {
      // Create two independent chains
      dependencyGraph.addDependency({
        dependentTaskId: 'task2',
        dependsOnTaskId: 'task1',
        type: 'hard',
      });

      dependencyGraph.addDependency({
        dependentTaskId: 'task4',
        dependsOnTaskId: 'task3',
        type: 'hard',
      });

      const sequence = sequencer.generateExecutionSequence(
        sampleTasks,
        'dependency_aware',
      );

      // Should have groups that respect dependencies
      const parallelGroups = sequence.parallelGroups;
      expect(parallelGroups.length).toBeGreaterThan(1);

      // First group should contain independent tasks
      const firstGroup = parallelGroups[0];
      expect(firstGroup).toContain('task1');
      expect(firstGroup).toContain('task3');
      expect(firstGroup).toContain('task5'); // Independent task
    });
  });

  describe('Resource-Optimal Sequencing', () => {
    test('should optimize for resource usage', () => {
      const sequence = sequencer.generateExecutionSequence(
        sampleTasks,
        'resource_optimal',
      );

      expect(sequence.metadata.algorithm).toBe('resource_optimal');
      expect(sequence.parallelGroups.length).toBeGreaterThan(0);
    });

    test('should respect resource constraints in parallel groups', () => {
      const sequence = sequencer.generateExecutionSequence(
        sampleTasks,
        'resource_optimal',
      );

      // Check each parallel group respects resource limits
      for (const group of sequence.parallelGroups) {
        let totalCpu = 0;
        let totalMemory = 0;

        for (const taskId of group) {
          const task = sampleTasks.get(taskId)!;
          if (task.executionContext?.resourceConstraints) {
            for (const constraint of task.executionContext
              .resourceConstraints) {
              if (constraint.resourceType === 'cpu') {
                totalCpu += constraint.maxUnits;
              } else if (constraint.resourceType === 'memory') {
                totalMemory += constraint.maxUnits;
              }
            }
          }
        }

        expect(totalCpu).toBeLessThanOrEqual(config.resourcePools.get('cpu')!);
        expect(totalMemory).toBeLessThanOrEqual(
          config.resourcePools.get('memory')!,
        );
      }
    });

    test('should prioritize resource-efficient tasks', () => {
      // Create tasks with different resource efficiency ratios
      const efficientTask = createTestTask(
        'efficient',
        'Efficient Task',
        'testing',
        'high',
        [
          { resourceType: 'cpu', maxUnits: 1 },
          { resourceType: 'memory', maxUnits: 256 },
        ],
      );

      const expensiveTask = createTestTask(
        'expensive',
        'Expensive Task',
        'analysis',
        'high',
        [
          { resourceType: 'cpu', maxUnits: 8 },
          { resourceType: 'memory', maxUnits: 8192 },
        ],
      );

      const testTasks = new Map([
        ['efficient', efficientTask],
        ['expensive', expensiveTask],
      ]);

      dependencyGraph.addTask(efficientTask);
      dependencyGraph.addTask(expensiveTask);

      const sequence = sequencer.generateExecutionSequence(
        testTasks,
        'resource_optimal',
      );

      // For same priority, efficient task should be scheduled earlier
      const efficientIndex = sequence.sequence.indexOf('efficient');
      const expensiveIndex = sequence.sequence.indexOf('expensive');

      expect(efficientIndex).toBeLessThan(expensiveIndex);
    });
  });

  describe('Hybrid Sequencing', () => {
    test('should combine multiple scheduling factors', () => {
      const sequence = sequencer.generateExecutionSequence(
        sampleTasks,
        'hybrid',
      );

      expect(sequence.metadata.algorithm).toBe('hybrid');
      expect(sequence.metadata.factors).toContain('priority');
      expect(sequence.metadata.factors).toContain('dependencies');
      expect(sequence.metadata.factors).toContain('resource_efficiency');
    });

    test('should handle dependencies with resource optimization', () => {
      // Create dependencies
      dependencyGraph.addDependency({
        dependentTaskId: 'task2',
        dependsOnTaskId: 'task1',
        type: 'hard',
      });

      const sequence = sequencer.generateExecutionSequence(
        sampleTasks,
        'hybrid',
      );

      // Should respect dependencies
      const task1Index = sequence.sequence.indexOf('task1');
      const task2Index = sequence.sequence.indexOf('task2');
      expect(task1Index).toBeLessThan(task2Index);

      // Should also consider resources in parallel groups
      for (const group of sequence.parallelGroups) {
        let totalCpu = 0;
        for (const taskId of group) {
          const task = sampleTasks.get(taskId)!;
          if (task.executionContext?.resourceConstraints) {
            const cpuConstraint =
              task.executionContext.resourceConstraints.find(
                (c) => c.resourceType === 'cpu',
              );
            if (cpuConstraint) {
              totalCpu += cpuConstraint.maxUnits;
            }
          }
        }
        expect(totalCpu).toBeLessThanOrEqual(config.resourcePools.get('cpu')!);
      }
    });

    test('should calculate hybrid scores correctly', () => {
      // This tests the internal scoring mechanism by verifying sequence ordering
      // reflects a combination of priority, dependency weight, and resource efficiency

      const sequence = sequencer.generateExecutionSequence(
        sampleTasks,
        'hybrid',
      );

      // Critical task should generally rank higher
      const criticalTaskIndex = sequence.sequence.indexOf('task2');
      const lowPriorityTaskIndex = sequence.sequence.indexOf('task4');

      expect(criticalTaskIndex).toBeLessThan(lowPriorityTaskIndex);
    });
  });

  describe('Resource Management', () => {
    test('should generate resource allocations', () => {
      const sequence = sequencer.generateExecutionSequence(
        sampleTasks,
        'resource_optimal',
      );
      const allocations = sequencer.generateResourceAllocations(
        sequence,
        sampleTasks,
      );

      expect(allocations.length).toBe(sampleTasks.size);

      // Each allocation should have proper resource assignments
      for (const allocation of allocations) {
        expect(allocation.taskId).toBeDefined();
        expect(allocation.allocatedResources.size).toBeGreaterThan(0);
        expect(allocation.poolAssignments.length).toBeGreaterThan(0);
        expect(allocation.allocatedAt).toBeInstanceOf(Date);
      }
    });

    test('should calculate timing correctly in allocations', () => {
      const sequence = sequencer.generateExecutionSequence(
        sampleTasks,
        'resource_optimal',
      );
      const allocations = sequencer.generateResourceAllocations(
        sequence,
        sampleTasks,
      );

      // Allocations should be ordered by time
      for (let i = 1; i < allocations.length; i++) {
        const prevAllocation = allocations[i - 1];
        const currentAllocation = allocations[i];

        // Same parallel group should have same allocation time
        // Different groups should have later times
        expect(currentAllocation.allocatedAt.getTime()).toBeGreaterThanOrEqual(
          prevAllocation.allocatedAt.getTime(),
        );
      }
    });

    test('should update resource pools', () => {
      const newPools = new Map([
        ['cpu', 16],
        ['memory', 32768],
        ['disk', 1000],
      ]);

      sequencer.updateResourcePools(newPools);

      const utilization = sequencer.getResourceUtilization();
      expect(utilization.get('cpu')?.total).toBe(16);
      expect(utilization.get('memory')?.total).toBe(32768);
      expect(utilization.get('disk')?.total).toBe(1000);
    });

    test('should track resource utilization', () => {
      const utilization = sequencer.getResourceUtilization();

      expect(utilization.size).toBeGreaterThan(0);
      for (const [resourceType, stats] of utilization) {
        expect(stats.total).toBeGreaterThan(0);
        expect(stats.used).toBeGreaterThanOrEqual(0);
        expect(stats.available).toBe(stats.total - stats.used);
        expect(config.resourcePools.has(resourceType)).toBe(true);
      }
    });
  });

  describe('Duration Estimation', () => {
    test('should estimate sequence duration correctly', () => {
      // Set specific durations on tasks
      const tasksWithDurations = new Map();
      let totalDuration = 0;

      for (const [taskId, task] of sampleTasks) {
        const duration = 60000 * (parseInt(taskId.slice(-1)) || 1); // 1-5 minutes
        const updatedTask = {
          ...task,
          metadata: {
            ...task.metadata,
            estimatedDuration: duration,
          },
        };
        tasksWithDurations.set(taskId, updatedTask);
        totalDuration += duration;
      }

      const sequence = sequencer.generateExecutionSequence(
        tasksWithDurations,
        'priority',
      );

      // Sequential execution duration should equal sum of task durations
      expect(sequence.estimatedDuration).toBe(totalDuration);
    });

    test('should account for parallelization in duration', () => {
      // Create tasks that can run in parallel
      const parallelTasks = new Map();
      const taskDuration = 60000; // 1 minute each

      for (let i = 1; i <= 3; i++) {
        const task = createTestTask(
          `parallel${i}`,
          `Parallel Task ${i}`,
          'testing',
          'medium',
        );
        task.metadata.estimatedDuration = taskDuration;
        parallelTasks.set(`parallel${i}`, task);
        dependencyGraph.addTask(task);
      }

      const sequence = sequencer.generateExecutionSequence(
        parallelTasks,
        'resource_optimal',
      );

      // With perfect parallelization, duration should be less than sum of all tasks
      const totalSequentialDuration = parallelTasks.size * taskDuration;
      expect(sequence.estimatedDuration).toBeLessThanOrEqual(
        totalSequentialDuration,
      );
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty task set', () => {
      const emptyTasks = new Map();
      const sequence = sequencer.generateExecutionSequence(
        emptyTasks,
        'priority',
      );

      expect(sequence.sequence).toEqual([]);
      expect(sequence.parallelGroups).toEqual([]);
      expect(sequence.estimatedDuration).toBe(0);
    });

    test('should handle single task', () => {
      const singleTask = new Map([['task1', sampleTasks.get('task1')!]]);
      const sequence = sequencer.generateExecutionSequence(
        singleTask,
        'dependency_aware',
      );

      expect(sequence.sequence).toEqual(['task1']);
      expect(sequence.parallelGroups).toEqual([['task1']]);
      expect(sequence.criticalPath).toContain('task1');
    });

    test('should handle tasks without resource constraints', () => {
      const taskWithoutResources = createTestTask(
        'no-resources',
        'Task Without Resources',
        'documentation',
        'low',
      );

      const testTasks = new Map([['no-resources', taskWithoutResources]]);
      dependencyGraph.addTask(taskWithoutResources);

      const sequence = sequencer.generateExecutionSequence(
        testTasks,
        'resource_optimal',
      );

      expect(sequence.sequence).toEqual(['no-resources']);
    });

    test('should handle unknown algorithm gracefully', () => {
      expect(() => {
        sequencer.generateExecutionSequence(sampleTasks, 'unknown' as any);
      }).toThrow('Unknown sequencing algorithm: unknown');
    });
  });
});

// Helper function to create test tasks
function createTestTask(
  id: string,
  title: string,
  category: TaskCategory,
  priority: TaskPriority,
  resourceConstraints?: ResourceConstraint[],
): Task {
  const now = new Date();

  return {
    id,
    title,
    description: `Test task: ${title}`,
    status: 'pending',
    priority,
    category,
    executionContext: {
      resourceConstraints,
      timeout: 300000,
      maxRetries: 2,
    },
    metadata: {
      createdAt: now,
      updatedAt: now,
      createdBy: 'test-system',
      estimatedDuration: 60000, // Default 1 minute
    },
  };
}
