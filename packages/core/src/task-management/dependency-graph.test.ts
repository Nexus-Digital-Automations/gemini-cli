/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, test, expect, beforeEach } from 'vitest';
import { DependencyGraphManager } from './dependency-graph.js';
import { Task, TaskDependency, TaskPriority, TaskCategory } from './types.js';

describe('DependencyGraphManager', () => {
  let graphManager: DependencyGraphManager;
  let sampleTasks: Task[];

  beforeEach(() => {
    graphManager = new DependencyGraphManager();

    // Create sample tasks for testing
    sampleTasks = [
      createTestTask('task1', 'Setup Database', 'implementation', 'high'),
      createTestTask('task2', 'Create User Model', 'implementation', 'medium'),
      createTestTask('task3', 'Implement Authentication', 'implementation', 'high'),
      createTestTask('task4', 'Write Tests', 'testing', 'medium'),
      createTestTask('task5', 'Deploy Application', 'deployment', 'low'),
    ];

    // Add tasks to graph
    sampleTasks.forEach(task => graphManager.addTask(task));
  });

  describe('Task Management', () => {
    test('should add tasks successfully', () => {
      const graph = graphManager.getGraph();
      expect(graph.nodes.size).toBe(5);
      expect(graph.metadata.nodeCount).toBe(5);
    });

    test('should remove tasks successfully', () => {
      graphManager.removeTask('task1');

      const graph = graphManager.getGraph();
      expect(graph.nodes.size).toBe(4);
      expect(graph.metadata.nodeCount).toBe(4);
      expect(graph.nodes.has('task1')).toBe(false);
    });

    test('should handle duplicate task addition', () => {
      const duplicateTask = createTestTask('task1', 'Duplicate Task', 'documentation', 'low');

      // Adding duplicate should not increase count
      graphManager.addTask(duplicateTask);

      const graph = graphManager.getGraph();
      expect(graph.nodes.size).toBe(5);
    });
  });

  describe('Dependency Management', () => {
    test('should add dependencies successfully', () => {
      const dependency: TaskDependency = {
        dependentTaskId: 'task2',
        dependsOnTaskId: 'task1',
        type: 'hard',
        reason: 'User model needs database setup',
      };

      graphManager.addDependency(dependency);

      const graph = graphManager.getGraph();
      expect(graph.edges.length).toBe(1);
      expect(graph.metadata.edgeCount).toBe(1);

      const task2Node = graph.nodes.get('task2')!;
      expect(task2Node.dependencies).toContain('task1');

      const task1Node = graph.nodes.get('task1')!;
      expect(task1Node.dependents).toContain('task2');
    });

    test('should prevent duplicate dependencies', () => {
      const dependency: TaskDependency = {
        dependentTaskId: 'task2',
        dependsOnTaskId: 'task1',
        type: 'hard',
      };

      graphManager.addDependency(dependency);

      // Adding the same dependency should replace, not duplicate
      const updatedDependency: TaskDependency = {
        dependentTaskId: 'task2',
        dependsOnTaskId: 'task1',
        type: 'soft',
        reason: 'Updated dependency',
      };

      graphManager.addDependency(updatedDependency);

      const graph = graphManager.getGraph();
      expect(graph.edges.length).toBe(1);
      expect(graph.edges[0].type).toBe('soft');
    });

    test('should remove dependencies successfully', () => {
      const dependency: TaskDependency = {
        dependentTaskId: 'task2',
        dependsOnTaskId: 'task1',
        type: 'hard',
      };

      graphManager.addDependency(dependency);
      graphManager.removeDependency('task2', 'task1');

      const graph = graphManager.getGraph();
      expect(graph.edges.length).toBe(0);
      expect(graph.metadata.edgeCount).toBe(0);
    });

    test('should throw error for non-existent tasks in dependencies', () => {
      const dependency: TaskDependency = {
        dependentTaskId: 'nonexistent',
        dependsOnTaskId: 'task1',
        type: 'hard',
      };

      expect(() => graphManager.addDependency(dependency)).toThrow();
    });
  });

  describe('Circular Dependency Detection', () => {
    test('should detect simple circular dependencies', () => {
      // Create circular dependency: task1 -> task2 -> task1
      graphManager.addDependency({
        dependentTaskId: 'task2',
        dependsOnTaskId: 'task1',
        type: 'hard',
      });

      graphManager.addDependency({
        dependentTaskId: 'task1',
        dependsOnTaskId: 'task2',
        type: 'hard',
      });

      const cycles = graphManager.detectCircularDependencies();
      expect(cycles.length).toBe(1);
      expect(cycles[0].cycle).toEqual(['task2', 'task1']);
    });

    test('should detect complex circular dependencies', () => {
      // Create complex cycle: task1 -> task2 -> task3 -> task1
      graphManager.addDependency({
        dependentTaskId: 'task2',
        dependsOnTaskId: 'task1',
        type: 'hard',
      });

      graphManager.addDependency({
        dependentTaskId: 'task3',
        dependsOnTaskId: 'task2',
        type: 'hard',
      });

      graphManager.addDependency({
        dependentTaskId: 'task1',
        dependsOnTaskId: 'task3',
        type: 'hard',
      });

      const cycles = graphManager.detectCircularDependencies();
      expect(cycles.length).toBe(1);
      expect(cycles[0].cycle.length).toBe(3);
    });

    test('should generate resolution strategies for circular dependencies', () => {
      // Create circular dependency with soft edge
      graphManager.addDependency({
        dependentTaskId: 'task2',
        dependsOnTaskId: 'task1',
        type: 'soft',
      });

      graphManager.addDependency({
        dependentTaskId: 'task1',
        dependsOnTaskId: 'task2',
        type: 'hard',
      });

      const cycles = graphManager.detectCircularDependencies();
      expect(cycles.length).toBe(1);
      expect(cycles[0].resolutionStrategies.length).toBeGreaterThan(0);

      // Should suggest removing soft dependency first
      const softRemovalStrategy = cycles[0].resolutionStrategies.find(
        s => s.strategy === 'remove_edge' && s.impact === 'low'
      );
      expect(softRemovalStrategy).toBeDefined();
    });

    test('should not detect cycles in acyclic graph', () => {
      // Create linear dependency chain
      graphManager.addDependency({
        dependentTaskId: 'task2',
        dependsOnTaskId: 'task1',
        type: 'hard',
      });

      graphManager.addDependency({
        dependentTaskId: 'task3',
        dependsOnTaskId: 'task2',
        type: 'hard',
      });

      const cycles = graphManager.detectCircularDependencies();
      expect(cycles.length).toBe(0);
    });
  });

  describe('Topological Ordering', () => {
    test('should generate topological order for acyclic graph', () => {
      // Create dependency chain: task1 -> task2 -> task3
      graphManager.addDependency({
        dependentTaskId: 'task2',
        dependsOnTaskId: 'task1',
        type: 'hard',
      });

      graphManager.addDependency({
        dependentTaskId: 'task3',
        dependsOnTaskId: 'task2',
        type: 'hard',
      });

      const order = graphManager.getTopologicalOrder();
      expect(order).not.toBeNull();
      expect(order!.length).toBe(5);

      // task1 should come before task2
      const task1Index = order!.indexOf('task1');
      const task2Index = order!.indexOf('task2');
      const task3Index = order!.indexOf('task3');

      expect(task1Index).toBeLessThan(task2Index);
      expect(task2Index).toBeLessThan(task3Index);
    });

    test('should return null for cyclic graph', () => {
      // Create circular dependency
      graphManager.addDependency({
        dependentTaskId: 'task2',
        dependsOnTaskId: 'task1',
        type: 'hard',
      });

      graphManager.addDependency({
        dependentTaskId: 'task1',
        dependsOnTaskId: 'task2',
        type: 'hard',
      });

      const order = graphManager.getTopologicalOrder();
      expect(order).toBeNull();
    });
  });

  describe('Critical Path Analysis', () => {
    test('should calculate critical path', () => {
      // Set up tasks with estimated durations
      const tasksWithDurations = sampleTasks.map((task, index) => ({
        ...task,
        metadata: {
          ...task.metadata,
          estimatedDuration: (index + 1) * 60000, // 1, 2, 3, 4, 5 minutes
        },
      }));

      // Re-create graph with duration tasks
      graphManager = new DependencyGraphManager();
      tasksWithDurations.forEach(task => graphManager.addTask(task));

      // Create dependency chain
      graphManager.addDependency({
        dependentTaskId: 'task2',
        dependsOnTaskId: 'task1',
        type: 'hard',
      });

      graphManager.addDependency({
        dependentTaskId: 'task3',
        dependsOnTaskId: 'task2',
        type: 'hard',
      });

      const criticalPath = graphManager.calculateCriticalPath();
      expect(criticalPath.length).toBeGreaterThan(0);
      expect(criticalPath).toContain('task1');
      expect(criticalPath).toContain('task2');
      expect(criticalPath).toContain('task3');
    });

    test('should handle empty graph gracefully', () => {
      const emptyManager = new DependencyGraphManager();
      const criticalPath = emptyManager.calculateCriticalPath();
      expect(criticalPath).toEqual([]);
    });
  });

  describe('Parallel Task Identification', () => {
    test('should identify parallelizable tasks', () => {
      // Create two independent branches
      graphManager.addDependency({
        dependentTaskId: 'task2',
        dependsOnTaskId: 'task1',
        type: 'hard',
      });

      graphManager.addDependency({
        dependentTaskId: 'task4',
        dependsOnTaskId: 'task3',
        type: 'hard',
      });

      const parallelGroups = graphManager.getParallelizableTasks();
      expect(parallelGroups.length).toBeGreaterThan(0);

      // Should have multiple groups with independent tasks
      const firstGroup = parallelGroups[0];
      expect(firstGroup).toContain('task1');
      expect(firstGroup).toContain('task3');
      expect(firstGroup).toContain('task5'); // Independent task
    });

    test('should handle single task chains', () => {
      // Create single dependency chain
      graphManager.addDependency({
        dependentTaskId: 'task2',
        dependsOnTaskId: 'task1',
        type: 'hard',
      });

      graphManager.addDependency({
        dependentTaskId: 'task3',
        dependsOnTaskId: 'task2',
        type: 'hard',
      });

      const parallelGroups = graphManager.getParallelizableTasks();

      // Each group should have only one task from the chain
      parallelGroups.forEach((group, index) => {
        if (index < 3) { // First three groups contain chain tasks
          expect(group.length).toBe(1);
        }
      });
    });
  });

  describe('Dependency Impact Analysis', () => {
    test('should analyze dependency impact correctly', () => {
      // Create dependency tree: task1 -> task2 -> task3, task4
      graphManager.addDependency({
        dependentTaskId: 'task2',
        dependsOnTaskId: 'task1',
        type: 'hard',
      });

      graphManager.addDependency({
        dependentTaskId: 'task3',
        dependsOnTaskId: 'task2',
        type: 'hard',
      });

      graphManager.addDependency({
        dependentTaskId: 'task4',
        dependsOnTaskId: 'task2',
        type: 'hard',
      });

      const impact = graphManager.getDependencyImpact('task2');
      expect(impact.directDependents).toEqual(['task3', 'task4']);
      expect(impact.totalImpact).toBe(2);
    });

    test('should detect critical path impact', () => {
      // Create single path that becomes critical
      graphManager.addDependency({
        dependentTaskId: 'task2',
        dependsOnTaskId: 'task1',
        type: 'hard',
      });

      graphManager.addDependency({
        dependentTaskId: 'task3',
        dependsOnTaskId: 'task2',
        type: 'hard',
      });

      const impact = graphManager.getDependencyImpact('task2');
      expect(impact.criticalPathImpact).toBe(true);
    });
  });

  describe('Graph Statistics', () => {
    test('should provide accurate graph statistics', () => {
      // Add some dependencies
      graphManager.addDependency({
        dependentTaskId: 'task2',
        dependsOnTaskId: 'task1',
        type: 'hard',
      });

      graphManager.addDependency({
        dependentTaskId: 'task3',
        dependsOnTaskId: 'task2',
        type: 'hard',
      });

      const stats = graphManager.getStatistics();
      expect(stats.nodeCount).toBe(5);
      expect(stats.edgeCount).toBe(2);
      expect(stats.hasCycles).toBe(false);
      expect(stats.avgDependencies).toBe(2 / 5); // 2 edges / 5 nodes
    });

    test('should detect cycles in statistics', () => {
      // Create circular dependency
      graphManager.addDependency({
        dependentTaskId: 'task2',
        dependsOnTaskId: 'task1',
        type: 'hard',
      });

      graphManager.addDependency({
        dependentTaskId: 'task1',
        dependsOnTaskId: 'task2',
        type: 'hard',
      });

      const stats = graphManager.getStatistics();
      expect(stats.hasCycles).toBe(true);
    });
  });

  describe('DOT Export', () => {
    test('should export valid DOT format', () => {
      graphManager.addDependency({
        dependentTaskId: 'task2',
        dependsOnTaskId: 'task1',
        type: 'hard',
      });

      const dotOutput = graphManager.exportToDot();

      expect(dotOutput).toContain('digraph Dependencies');
      expect(dotOutput).toContain('"task1"');
      expect(dotOutput).toContain('"task2"');
      expect(dotOutput).toContain('"task1" -> "task2"');
      expect(dotOutput).toContain('}');
    });

    test('should handle different dependency types in export', () => {
      graphManager.addDependency({
        dependentTaskId: 'task2',
        dependsOnTaskId: 'task1',
        type: 'soft',
      });

      graphManager.addDependency({
        dependentTaskId: 'task3',
        dependsOnTaskId: 'task1',
        type: 'resource',
      });

      const dotOutput = graphManager.exportToDot();

      expect(dotOutput).toContain('style="dashed"'); // soft dependency
      expect(dotOutput).toContain('style="dotted"'); // resource dependency
    });
  });
});

// Helper function to create test tasks
function createTestTask(
  id: string,
  title: string,
  category: TaskCategory,
  priority: TaskPriority,
  estimatedDuration?: number
): Task {
  const now = new Date();

  return {
    id,
    title,
    description: `Test task: ${title}`,
    status: 'pending',
    priority,
    category,
    metadata: {
      createdAt: now,
      updatedAt: now,
      createdBy: 'test-system',
      estimatedDuration,
    },
  };
}