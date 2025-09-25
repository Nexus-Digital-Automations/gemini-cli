/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TaskPriorityScheduler } from '../TaskPriorityScheduler.js';
import type {
  Task,
  TaskPriority,
  SchedulingFactors,
  ExecutionSequence,
  TaskId,
} from '../types.js';

/**
 * @fileoverview Comprehensive test suite for TaskPriorityScheduler
 *
 * Tests priority calculations, scheduling algorithms, resource constraints,
 * execution sequencing with >95% coverage.
 */

describe('TaskPriorityScheduler', () => {
  let scheduler: TaskPriorityScheduler;
  let mockTasks: Task[];

  beforeEach(() => {
    scheduler = new TaskPriorityScheduler({
      maxConcurrentTasks: 3,
      defaultTimeout: 300000,
      defaultMaxRetries: 3,
      resourcePools: new Map([
        ['cpu', 4],
        ['memory', 8],
        ['network', 2],
      ]),
      priorityThresholds: {
        critical: 90,
        high: 70,
        medium: 50,
        low: 30,
      },
      schedulingAlgorithm: 'dependency_aware',
      autoDependencyLearning: true,
      performanceMonitoring: true,
    });

    mockTasks = createMockTasks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Priority Calculation', () => {
    it('should calculate base priority correctly', () => {
      const criticalTask = mockTasks.find((t) => t.priority === 'critical')!;
      const highTask = mockTasks.find((t) => t.priority === 'high')!;
      const mediumTask = mockTasks.find((t) => t.priority === 'medium')!;
      const lowTask = mockTasks.find((t) => t.priority === 'low')!;

      const criticalScore = scheduler.calculatePriority(criticalTask);
      const highScore = scheduler.calculatePriority(highTask);
      const mediumScore = scheduler.calculatePriority(mediumTask);
      const lowScore = scheduler.calculatePriority(lowTask);

      expect(criticalScore.basePriority).toBeGreaterThan(
        highScore.basePriority,
      );
      expect(highScore.basePriority).toBeGreaterThan(mediumScore.basePriority);
      expect(mediumScore.basePriority).toBeGreaterThan(lowScore.basePriority);
    });

    it('should factor in urgency based on creation time', () => {
      const oldTask = createMockTask('old-task', 'medium');
      oldTask.metadata.createdAt = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago

      const newTask = createMockTask('new-task', 'medium');
      newTask.metadata.createdAt = new Date(); // Just created

      const oldScore = scheduler.calculatePriority(oldTask);
      const newScore = scheduler.calculatePriority(newTask);

      expect(oldScore.urgency).toBeGreaterThan(newScore.urgency);
    });

    it('should calculate impact based on dependencies', () => {
      const independentTask = createMockTask('independent', 'medium');
      const dependencyTask = createMockTask('has-dependents', 'medium');

      // Mock task dependencies
      scheduler.setTaskDependents(dependencyTask.id, ['dep1', 'dep2', 'dep3']);

      const independentScore = scheduler.calculatePriority(independentTask);
      const dependencyScore = scheduler.calculatePriority(dependencyTask);

      expect(dependencyScore.dependencyWeight).toBeGreaterThan(
        independentScore.dependencyWeight,
      );
      expect(dependencyScore.impact).toBeGreaterThan(independentScore.impact);
    });

    it('should factor in estimated duration', () => {
      const quickTask = createMockTask('quick', 'medium');
      quickTask.metadata.estimatedDuration = 5 * 60 * 1000; // 5 minutes

      const longTask = createMockTask('long', 'medium');
      longTask.metadata.estimatedDuration = 2 * 60 * 60 * 1000; // 2 hours

      const quickScore = scheduler.calculatePriority(quickTask);
      const longScore = scheduler.calculatePriority(longTask);

      // Quick tasks should have better duration factors (lower values are better)
      expect(quickScore.durationFactor).toBeLessThan(longScore.durationFactor);
    });

    it('should consider resource availability', () => {
      const cpuTask = createMockTask('cpu-intensive', 'medium');
      cpuTask.executionContext = {
        resourceConstraints: [
          { resourceType: 'cpu', maxUnits: 2, exclusive: false },
        ],
      };

      const memoryTask = createMockTask('memory-intensive', 'medium');
      memoryTask.executionContext = {
        resourceConstraints: [
          { resourceType: 'memory', maxUnits: 6, exclusive: false },
        ],
      };

      // Simulate CPU being more constrained
      scheduler.updateResourceAvailability('cpu', 1);
      scheduler.updateResourceAvailability('memory', 8);

      const cpuScore = scheduler.calculatePriority(cpuTask);
      const memoryScore = scheduler.calculatePriority(memoryTask);

      expect(memoryScore.resourceAvailability).toBeGreaterThan(
        cpuScore.resourceAvailability,
      );
    });

    it('should include historical success rate', () => {
      const reliableTask = createMockTask('reliable', 'medium');
      const unreliableTask = createMockTask('unreliable', 'medium');

      scheduler.updateTaskHistory(reliableTask.id, { successRate: 0.95 });
      scheduler.updateTaskHistory(unreliableTask.id, { successRate: 0.3 });

      const reliableScore = scheduler.calculatePriority(reliableTask);
      const unreliableScore = scheduler.calculatePriority(unreliableTask);

      expect(reliableScore.successRate).toBe(0.95);
      expect(unreliableScore.successRate).toBe(0.3);
    });
  });

  describe('Scheduling Algorithms', () => {
    describe('FIFO Scheduling', () => {
      beforeEach(() => {
        scheduler = new TaskPriorityScheduler({
          ...scheduler['config'],
          schedulingAlgorithm: 'fifo',
        });
      });

      it('should order tasks by creation time', () => {
        const tasks = mockTasks.slice(0, 3);
        tasks[0].metadata.createdAt = new Date(Date.now() - 3000);
        tasks[1].metadata.createdAt = new Date(Date.now() - 2000);
        tasks[2].metadata.createdAt = new Date(Date.now() - 1000);

        const sequence = scheduler.scheduleSequence(tasks);

        expect(sequence.sequence).toEqual([
          tasks[0].id,
          tasks[1].id,
          tasks[2].id,
        ]);
      });
    });

    describe('Priority-Based Scheduling', () => {
      beforeEach(() => {
        scheduler = new TaskPriorityScheduler({
          ...scheduler['config'],
          schedulingAlgorithm: 'priority',
        });
      });

      it('should order tasks by priority level', () => {
        const tasks = [
          createMockTask('low', 'low'),
          createMockTask('critical', 'critical'),
          createMockTask('medium', 'medium'),
          createMockTask('high', 'high'),
        ];

        const sequence = scheduler.scheduleSequence(tasks);

        expect(sequence.sequence[0]).toBe(tasks[1].id); // critical first
        expect(sequence.sequence[1]).toBe(tasks[3].id); // high second
        expect(sequence.sequence[2]).toBe(tasks[2].id); // medium third
        expect(sequence.sequence[3]).toBe(tasks[0].id); // low last
      });
    });

    describe('Dependency-Aware Scheduling', () => {
      beforeEach(() => {
        scheduler = new TaskPriorityScheduler({
          ...scheduler['config'],
          schedulingAlgorithm: 'dependency_aware',
        });
      });

      it('should respect task dependencies', () => {
        const tasks = mockTasks.slice(0, 3);

        // Set up dependencies: task1 depends on task0, task2 depends on task1
        scheduler.addDependency(tasks[1].id, tasks[0].id);
        scheduler.addDependency(tasks[2].id, tasks[1].id);

        const sequence = scheduler.scheduleSequence(tasks);

        expect(sequence.sequence.indexOf(tasks[0].id)).toBeLessThan(
          sequence.sequence.indexOf(tasks[1].id),
        );
        expect(sequence.sequence.indexOf(tasks[1].id)).toBeLessThan(
          sequence.sequence.indexOf(tasks[2].id),
        );
      });

      it('should identify parallel execution groups', () => {
        const tasks = mockTasks.slice(0, 4);

        // Set up dependencies: tasks 1 and 2 both depend on task 0, task 3 depends on both 1 and 2
        scheduler.addDependency(tasks[1].id, tasks[0].id);
        scheduler.addDependency(tasks[2].id, tasks[0].id);
        scheduler.addDependency(tasks[3].id, tasks[1].id);
        scheduler.addDependency(tasks[3].id, tasks[2].id);

        const sequence = scheduler.scheduleSequence(tasks);

        expect(sequence.parallelGroups.length).toBeGreaterThanOrEqual(3);
        expect(sequence.parallelGroups[0]).toEqual([tasks[0].id]);
        expect(sequence.parallelGroups[1]).toEqual(
          expect.arrayContaining([tasks[1].id, tasks[2].id]),
        );
        expect(sequence.parallelGroups[2]).toEqual([tasks[3].id]);
      });

      it('should calculate critical path', () => {
        const tasks = mockTasks.slice(0, 3);
        tasks[0].metadata.estimatedDuration = 60000; // 1 minute
        tasks[1].metadata.estimatedDuration = 120000; // 2 minutes
        tasks[2].metadata.estimatedDuration = 90000; // 1.5 minutes

        scheduler.addDependency(tasks[1].id, tasks[0].id);
        scheduler.addDependency(tasks[2].id, tasks[1].id);

        const sequence = scheduler.scheduleSequence(tasks);

        expect(sequence.criticalPath).toEqual([
          tasks[0].id,
          tasks[1].id,
          tasks[2].id,
        ]);
        expect(sequence.estimatedDuration).toBe(270000); // Sum of all durations
      });
    });

    describe('Resource-Optimal Scheduling', () => {
      beforeEach(() => {
        scheduler = new TaskPriorityScheduler({
          ...scheduler['config'],
          schedulingAlgorithm: 'resource_optimal',
        });
      });

      it('should optimize for resource utilization', () => {
        const cpuTask = createMockTask('cpu', 'medium');
        cpuTask.executionContext = {
          resourceConstraints: [
            { resourceType: 'cpu', maxUnits: 3, exclusive: false },
          ],
        };

        const memoryTask = createMockTask('memory', 'medium');
        memoryTask.executionContext = {
          resourceConstraints: [
            { resourceType: 'memory', maxUnits: 4, exclusive: false },
          ],
        };

        const networkTask = createMockTask('network', 'medium');
        networkTask.executionContext = {
          resourceConstraints: [
            { resourceType: 'network', maxUnits: 1, exclusive: false },
          ],
        };

        const tasks = [cpuTask, memoryTask, networkTask];
        const sequence = scheduler.scheduleSequence(tasks);

        expect(sequence.sequence).toHaveLength(3);
        expect(sequence.parallelGroups[0].length).toBeGreaterThanOrEqual(1);
      });

      it('should handle exclusive resource constraints', () => {
        const exclusive1 = createMockTask('exclusive1', 'high');
        exclusive1.executionContext = {
          resourceConstraints: [
            { resourceType: 'gpu', maxUnits: 1, exclusive: true },
          ],
        };

        const exclusive2 = createMockTask('exclusive2', 'high');
        exclusive2.executionContext = {
          resourceConstraints: [
            { resourceType: 'gpu', maxUnits: 1, exclusive: true },
          ],
        };

        scheduler.updateResourceAvailability('gpu', 1);
        const tasks = [exclusive1, exclusive2];
        const sequence = scheduler.scheduleSequence(tasks);

        // Should not be in the same parallel group
        const parallel1 = sequence.parallelGroups.find((group) =>
          group.includes(exclusive1.id),
        );
        const parallel2 = sequence.parallelGroups.find((group) =>
          group.includes(exclusive2.id),
        );

        expect(parallel1).not.toBe(parallel2);
      });
    });
  });

  describe('Resource Management', () => {
    it('should track resource allocation correctly', () => {
      const task = createMockTask('resource-task', 'medium');
      task.executionContext = {
        resourceConstraints: [
          { resourceType: 'cpu', maxUnits: 2 },
          { resourceType: 'memory', maxUnits: 3 },
        ],
      };

      const allocated = scheduler.allocateResources(task);
      expect(allocated.allocatedResources.get('cpu')).toBe(2);
      expect(allocated.allocatedResources.get('memory')).toBe(3);

      // Check remaining availability
      expect(scheduler.getResourceAvailability('cpu')).toBe(2); // 4 - 2
      expect(scheduler.getResourceAvailability('memory')).toBe(5); // 8 - 3
    });

    it('should handle resource shortages gracefully', () => {
      const task = createMockTask('big-task', 'high');
      task.executionContext = {
        resourceConstraints: [
          { resourceType: 'cpu', maxUnits: 10 }, // More than available
        ],
      };

      const allocated = scheduler.allocateResources(task);
      expect(allocated).toBeNull(); // Should fail to allocate

      // Availability should remain unchanged
      expect(scheduler.getResourceAvailability('cpu')).toBe(4);
    });

    it('should release resources correctly', () => {
      const task = createMockTask('resource-task', 'medium');
      task.executionContext = {
        resourceConstraints: [{ resourceType: 'cpu', maxUnits: 2 }],
      };

      const allocated = scheduler.allocateResources(task);
      expect(allocated).not.toBeNull();
      expect(scheduler.getResourceAvailability('cpu')).toBe(2);

      scheduler.releaseResources(allocated!);
      expect(scheduler.getResourceAvailability('cpu')).toBe(4); // Back to original
    });

    it('should handle resource pools and tagging', () => {
      const task = createMockTask('tagged-task', 'medium');
      task.executionContext = {
        resourceConstraints: [
          {
            resourceType: 'cpu',
            maxUnits: 1,
            tags: ['compute-intensive', 'batch'],
          },
        ],
      };

      const allocated = scheduler.allocateResources(task);
      expect(allocated).not.toBeNull();
      expect(allocated!.poolAssignments).toContain('compute-intensive');
    });
  });

  describe('Dynamic Priority Adjustment', () => {
    it('should boost priority of aging tasks', () => {
      const task = createMockTask('aging-task', 'low');
      task.metadata.createdAt = new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago

      const initialScore = scheduler.calculatePriority(task);

      // Simulate aging boost
      scheduler.applyAgingBoost(task, 0.2); // 20% boost

      const boostedScore = scheduler.calculatePriority(task);
      expect(boostedScore.urgency).toBeGreaterThan(initialScore.urgency);
    });

    it('should adjust priority based on system load', () => {
      const task = createMockTask('load-sensitive', 'medium');

      // Simulate high system load
      scheduler.updateSystemLoad(0.9);
      const highLoadScore = scheduler.calculatePriority(task);

      // Simulate low system load
      scheduler.updateSystemLoad(0.1);
      const lowLoadScore = scheduler.calculatePriority(task);

      // Under high load, resource availability should affect priority calculation
      expect(lowLoadScore.resourceAvailability).toBeGreaterThan(
        highLoadScore.resourceAvailability,
      );
    });

    it('should learn from execution patterns', () => {
      const task = createMockTask('learning-task', 'medium');

      // Record successful executions
      scheduler.recordExecution(task.id, { success: true, duration: 30000 });
      scheduler.recordExecution(task.id, { success: true, duration: 35000 });
      scheduler.recordExecution(task.id, { success: false, duration: 60000 });

      const score = scheduler.calculatePriority(task);
      expect(score.successRate).toBe(2 / 3); // 2 successes out of 3 attempts

      // Should update estimated duration based on history
      const updatedTask = scheduler.getTaskWithLearnedEstimates(task);
      expect(updatedTask.metadata.estimatedDuration).toBeCloseTo(32500, -2); // Average of successful executions
    });
  });

  describe('Sequence Optimization', () => {
    it('should optimize sequence for minimal total execution time', () => {
      const quickTask = createMockTask('quick', 'low');
      quickTask.metadata.estimatedDuration = 10000; // 10 seconds

      const mediumTask = createMockTask('medium', 'medium');
      mediumTask.metadata.estimatedDuration = 60000; // 1 minute

      const longTask = createMockTask('long', 'high');
      longTask.metadata.estimatedDuration = 300000; // 5 minutes

      const tasks = [longTask, quickTask, mediumTask];
      const sequence = scheduler.scheduleSequence(tasks);

      // Should prioritize high priority, but also consider execution time
      expect(sequence.sequence[0]).toBe(longTask.id); // High priority first
      expect(sequence.estimatedDuration).toBe(370000); // Sum of all tasks
    });

    it('should balance priority and duration in mixed scenarios', () => {
      const highQuick = createMockTask('high-quick', 'high');
      highQuick.metadata.estimatedDuration = 10000;

      const mediumLong = createMockTask('medium-long', 'medium');
      mediumLong.metadata.estimatedDuration = 300000;

      const tasks = [mediumLong, highQuick];
      const sequence = scheduler.scheduleSequence(tasks);

      expect(sequence.sequence[0]).toBe(highQuick.id); // High priority wins despite being added second
    });

    it('should generate metadata about scheduling decisions', () => {
      const tasks = mockTasks.slice(0, 3);
      const sequence = scheduler.scheduleSequence(tasks);

      expect(sequence.metadata.algorithm).toBe('dependency_aware');
      expect(sequence.metadata.generatedAt).toBeInstanceOf(Date);
      expect(sequence.metadata.factors).toContain('priority');
      expect(sequence.metadata.constraints).toBeInstanceOf(Array);
    });
  });

  describe('Edge Cases and Performance', () => {
    it('should handle empty task list', () => {
      const sequence = scheduler.scheduleSequence([]);

      expect(sequence.sequence).toHaveLength(0);
      expect(sequence.parallelGroups).toHaveLength(0);
      expect(sequence.criticalPath).toHaveLength(0);
      expect(sequence.estimatedDuration).toBe(0);
    });

    it('should handle circular dependencies gracefully', () => {
      const tasks = mockTasks.slice(0, 2);

      // Create circular dependency
      scheduler.addDependency(tasks[0].id, tasks[1].id);
      scheduler.addDependency(tasks[1].id, tasks[0].id);

      const sequence = scheduler.scheduleSequence(tasks);

      // Should detect cycle and provide fallback scheduling
      expect(sequence.sequence).toHaveLength(2);
      expect(sequence.metadata.constraints).toContain(
        'circular_dependencies_detected',
      );
    });

    it('should scale efficiently with large task sets', () => {
      const largeTasks = Array.from({ length: 1000 }, (_, i) =>
        createMockTask(
          `task-${i}`,
          ['critical', 'high', 'medium', 'low'][i % 4] as TaskPriority,
        ),
      );

      const startTime = Date.now();
      const sequence = scheduler.scheduleSequence(largeTasks);
      const endTime = Date.now();

      expect(sequence.sequence).toHaveLength(1000);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete in under 5 seconds
    });

    it('should handle tasks with missing or invalid data', () => {
      const invalidTask = createMockTask('invalid', 'medium');
      invalidTask.metadata.estimatedDuration = undefined;
      invalidTask.executionContext = undefined;

      expect(() => {
        scheduler.calculatePriority(invalidTask);
      }).not.toThrow();

      const sequence = scheduler.scheduleSequence([invalidTask]);
      expect(sequence.sequence).toHaveLength(1);
    });

    it('should preserve task ordering for equal priorities', () => {
      const task1 = createMockTask('task1', 'medium');
      const task2 = createMockTask('task2', 'medium');
      const task3 = createMockTask('task3', 'medium');

      // Set identical creation times
      const now = new Date();
      task1.metadata.createdAt = now;
      task2.metadata.createdAt = now;
      task3.metadata.createdAt = now;

      const tasks = [task1, task2, task3];
      const sequence = scheduler.scheduleSequence(tasks);

      // Should maintain original order for equal priorities
      expect(sequence.sequence).toEqual([task1.id, task2.id, task3.id]);
    });
  });
});

// Helper functions
function createMockTasks(): Task[] {
  return [
    createMockTask('task-critical', 'critical'),
    createMockTask('task-high', 'high'),
    createMockTask('task-medium', 'medium'),
    createMockTask('task-low', 'low'),
    createMockTask('task-another', 'medium'),
  ];
}

function createMockTask(id: string, priority: TaskPriority = 'medium'): Task {
  return {
    id,
    title: `Task ${id}`,
    description: `Description for ${id}`,
    status: 'pending',
    priority,
    category: 'implementation',
    metadata: {
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'test',
      estimatedDuration: 60000, // 1 minute default
      tags: ['test'],
    },
    executionContext: {
      timeout: 300000,
      maxRetries: 3,
    },
  };
}
