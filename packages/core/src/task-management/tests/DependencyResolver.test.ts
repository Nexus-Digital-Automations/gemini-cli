/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DependencyResolver } from '../DependencyResolver.js';
import type {
  Task,
  TaskDependency,
  DependencyGraph,
  CircularDependency,
  TaskId,
} from '../types.js';

/**
 * @fileoverview Comprehensive test suite for DependencyResolver
 *
 * Tests dependency graph construction, cycle detection, topological sorting,
 * and dependency resolution strategies with >95% coverage.
 */

describe('DependencyResolver', () => {
  let resolver: DependencyResolver;
  let mockTasks: Task[];

  beforeEach(() => {
    resolver = new DependencyResolver();
    mockTasks = createMockTasks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Dependency Graph Construction', () => {
    it('should build empty dependency graph for no tasks', () => {
      const graph = resolver.buildDependencyGraph([], []);

      expect(graph.nodes.size).toBe(0);
      expect(graph.edges).toHaveLength(0);
      expect(graph.metadata.nodeCount).toBe(0);
      expect(graph.metadata.edgeCount).toBe(0);
      expect(graph.metadata.hasCycles).toBe(false);
    });

    it('should build dependency graph with single task', () => {
      const tasks = [mockTasks[0]];
      const graph = resolver.buildDependencyGraph(tasks, []);

      expect(graph.nodes.size).toBe(1);
      expect(graph.nodes.has(tasks[0].id)).toBe(true);
      expect(graph.edges).toHaveLength(0);
      expect(graph.metadata.nodeCount).toBe(1);
      expect(graph.metadata.edgeCount).toBe(0);
    });

    it('should build dependency graph with multiple tasks and dependencies', () => {
      const tasks = mockTasks.slice(0, 3);
      const dependencies: TaskDependency[] = [
        {
          dependentTaskId: tasks[1].id,
          dependsOnTaskId: tasks[0].id,
          type: 'hard',
          reason: 'Task B depends on Task A',
        },
        {
          dependentTaskId: tasks[2].id,
          dependsOnTaskId: tasks[1].id,
          type: 'soft',
          reason: 'Task C depends on Task B',
        },
      ];

      const graph = resolver.buildDependencyGraph(tasks, dependencies);

      expect(graph.nodes.size).toBe(3);
      expect(graph.edges).toHaveLength(2);
      expect(graph.metadata.nodeCount).toBe(3);
      expect(graph.metadata.edgeCount).toBe(2);

      // Check node dependencies
      const nodeA = graph.nodes.get(tasks[0].id);
      const nodeB = graph.nodes.get(tasks[1].id);
      const nodeC = graph.nodes.get(tasks[2].id);

      expect(nodeA?.dependencies).toHaveLength(0);
      expect(nodeA?.dependents).toContain(tasks[1].id);

      expect(nodeB?.dependencies).toContain(tasks[0].id);
      expect(nodeB?.dependents).toContain(tasks[2].id);

      expect(nodeC?.dependencies).toContain(tasks[1].id);
      expect(nodeC?.dependents).toHaveLength(0);
    });

    it('should handle invalid task references in dependencies', () => {
      const tasks = [mockTasks[0]];
      const dependencies: TaskDependency[] = [
        {
          dependentTaskId: 'non-existent-task',
          dependsOnTaskId: tasks[0].id,
          type: 'hard',
          reason: 'Invalid dependency',
        },
      ];

      const graph = resolver.buildDependencyGraph(tasks, dependencies);

      // Should ignore invalid dependencies
      expect(graph.nodes.size).toBe(1);
      expect(graph.edges).toHaveLength(0);
      expect(graph.metadata.edgeCount).toBe(0);
    });

    it('should calculate graph metadata correctly', () => {
      const tasks = mockTasks.slice(0, 4);
      const dependencies: TaskDependency[] = [
        {
          dependentTaskId: tasks[1].id,
          dependsOnTaskId: tasks[0].id,
          type: 'hard',
        },
        {
          dependentTaskId: tasks[2].id,
          dependsOnTaskId: tasks[0].id,
          type: 'hard',
        },
        {
          dependentTaskId: tasks[3].id,
          dependsOnTaskId: tasks[1].id,
          type: 'soft',
        },
        {
          dependentTaskId: tasks[3].id,
          dependsOnTaskId: tasks[2].id,
          type: 'soft',
        },
      ];

      const graph = resolver.buildDependencyGraph(tasks, dependencies);

      expect(graph.metadata.maxDepth).toBe(2); // A -> B -> D and A -> C -> D
      expect(graph.metadata.createdAt).toBeInstanceOf(Date);
      expect(graph.metadata.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('Cycle Detection', () => {
    it('should detect no cycles in acyclic graph', () => {
      const tasks = mockTasks.slice(0, 3);
      const dependencies: TaskDependency[] = [
        {
          dependentTaskId: tasks[1].id,
          dependsOnTaskId: tasks[0].id,
          type: 'hard',
        },
        {
          dependentTaskId: tasks[2].id,
          dependsOnTaskId: tasks[1].id,
          type: 'hard',
        },
      ];

      const graph = resolver.buildDependencyGraph(tasks, dependencies);
      const cycles = resolver.detectCycles(graph);

      expect(cycles).toHaveLength(0);
      expect(graph.metadata.hasCycles).toBe(false);
    });

    it('should detect simple cycle (A -> B -> A)', () => {
      const tasks = mockTasks.slice(0, 2);
      const dependencies: TaskDependency[] = [
        {
          dependentTaskId: tasks[1].id,
          dependsOnTaskId: tasks[0].id,
          type: 'hard',
        },
        {
          dependentTaskId: tasks[0].id,
          dependsOnTaskId: tasks[1].id,
          type: 'hard',
        },
      ];

      const graph = resolver.buildDependencyGraph(tasks, dependencies);
      const cycles = resolver.detectCycles(graph);

      expect(cycles).toHaveLength(1);
      expect(cycles[0].cycle).toHaveLength(2);
      expect(cycles[0].cycle).toEqual(
        expect.arrayContaining([tasks[0].id, tasks[1].id]),
      );
      expect(graph.metadata.hasCycles).toBe(true);
    });

    it('should detect complex cycle (A -> B -> C -> A)', () => {
      const tasks = mockTasks.slice(0, 3);
      const dependencies: TaskDependency[] = [
        {
          dependentTaskId: tasks[1].id,
          dependsOnTaskId: tasks[0].id,
          type: 'hard',
        },
        {
          dependentTaskId: tasks[2].id,
          dependsOnTaskId: tasks[1].id,
          type: 'hard',
        },
        {
          dependentTaskId: tasks[0].id,
          dependsOnTaskId: tasks[2].id,
          type: 'hard',
        },
      ];

      const graph = resolver.buildDependencyGraph(tasks, dependencies);
      const cycles = resolver.detectCycles(graph);

      expect(cycles).toHaveLength(1);
      expect(cycles[0].cycle).toHaveLength(3);
      expect(cycles[0].cycle).toEqual(
        expect.arrayContaining([tasks[0].id, tasks[1].id, tasks[2].id]),
      );
    });

    it('should detect multiple cycles in complex graph', () => {
      const tasks = mockTasks.slice(0, 4);
      const dependencies: TaskDependency[] = [
        // First cycle: A -> B -> A
        {
          dependentTaskId: tasks[1].id,
          dependsOnTaskId: tasks[0].id,
          type: 'hard',
        },
        {
          dependentTaskId: tasks[0].id,
          dependsOnTaskId: tasks[1].id,
          type: 'hard',
        },
        // Second cycle: C -> D -> C
        {
          dependentTaskId: tasks[3].id,
          dependsOnTaskId: tasks[2].id,
          type: 'hard',
        },
        {
          dependentTaskId: tasks[2].id,
          dependsOnTaskId: tasks[3].id,
          type: 'hard',
        },
      ];

      const graph = resolver.buildDependencyGraph(tasks, dependencies);
      const cycles = resolver.detectCycles(graph);

      expect(cycles.length).toBeGreaterThanOrEqual(1);
      expect(graph.metadata.hasCycles).toBe(true);
    });

    it('should provide resolution strategies for cycles', () => {
      const tasks = mockTasks.slice(0, 2);
      const dependencies: TaskDependency[] = [
        {
          dependentTaskId: tasks[1].id,
          dependsOnTaskId: tasks[0].id,
          type: 'hard',
        },
        {
          dependentTaskId: tasks[0].id,
          dependsOnTaskId: tasks[1].id,
          type: 'soft',
        },
      ];

      const graph = resolver.buildDependencyGraph(tasks, dependencies);
      const cycles = resolver.detectCycles(graph);

      expect(cycles).toHaveLength(1);
      expect(cycles[0].resolutionStrategies.length).toBeGreaterThan(0);

      const strategies = cycles[0].resolutionStrategies;
      expect(strategies).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            strategy: expect.stringMatching(
              /remove_edge|split_task|merge_tasks|reorder/,
            ),
            description: expect.any(String),
            impact: expect.stringMatching(/low|medium|high/),
          }),
        ]),
      );
    });
  });

  describe('Topological Sorting', () => {
    it('should return empty array for empty graph', () => {
      const graph = resolver.buildDependencyGraph([], []);
      const sorted = resolver.topologicalSort(graph);

      expect(sorted).toHaveLength(0);
    });

    it('should sort single task', () => {
      const tasks = [mockTasks[0]];
      const graph = resolver.buildDependencyGraph(tasks, []);
      const sorted = resolver.topologicalSort(graph);

      expect(sorted).toHaveLength(1);
      expect(sorted[0]).toBe(tasks[0].id);
    });

    it('should sort linear dependency chain correctly', () => {
      const tasks = mockTasks.slice(0, 3);
      const dependencies: TaskDependency[] = [
        {
          dependentTaskId: tasks[1].id,
          dependsOnTaskId: tasks[0].id,
          type: 'hard',
        },
        {
          dependentTaskId: tasks[2].id,
          dependsOnTaskId: tasks[1].id,
          type: 'hard',
        },
      ];

      const graph = resolver.buildDependencyGraph(tasks, dependencies);
      const sorted = resolver.topologicalSort(graph);

      expect(sorted).toHaveLength(3);
      expect(sorted.indexOf(tasks[0].id)).toBeLessThan(
        sorted.indexOf(tasks[1].id),
      );
      expect(sorted.indexOf(tasks[1].id)).toBeLessThan(
        sorted.indexOf(tasks[2].id),
      );
    });

    it('should sort complex dependency graph correctly', () => {
      const tasks = mockTasks.slice(0, 4);
      const dependencies: TaskDependency[] = [
        {
          dependentTaskId: tasks[1].id,
          dependsOnTaskId: tasks[0].id,
          type: 'hard',
        },
        {
          dependentTaskId: tasks[2].id,
          dependsOnTaskId: tasks[0].id,
          type: 'hard',
        },
        {
          dependentTaskId: tasks[3].id,
          dependsOnTaskId: tasks[1].id,
          type: 'hard',
        },
        {
          dependentTaskId: tasks[3].id,
          dependsOnTaskId: tasks[2].id,
          type: 'hard',
        },
      ];

      const graph = resolver.buildDependencyGraph(tasks, dependencies);
      const sorted = resolver.topologicalSort(graph);

      expect(sorted).toHaveLength(4);
      // A should come first
      expect(sorted[0]).toBe(tasks[0].id);
      // D should come last (depends on both B and C)
      expect(sorted[3]).toBe(tasks[3].id);
      // B and C should come before D but after A
      expect(sorted.indexOf(tasks[1].id)).toBeLessThan(
        sorted.indexOf(tasks[3].id),
      );
      expect(sorted.indexOf(tasks[2].id)).toBeLessThan(
        sorted.indexOf(tasks[3].id),
      );
    });

    it('should return empty array for cyclic graph', () => {
      const tasks = mockTasks.slice(0, 2);
      const dependencies: TaskDependency[] = [
        {
          dependentTaskId: tasks[1].id,
          dependsOnTaskId: tasks[0].id,
          type: 'hard',
        },
        {
          dependentTaskId: tasks[0].id,
          dependsOnTaskId: tasks[1].id,
          type: 'hard',
        },
      ];

      const graph = resolver.buildDependencyGraph(tasks, dependencies);
      const sorted = resolver.topologicalSort(graph);

      expect(sorted).toHaveLength(0);
    });
  });

  describe('Dependency Resolution', () => {
    it('should resolve dependencies by removing soft edges', () => {
      const tasks = mockTasks.slice(0, 2);
      const dependencies: TaskDependency[] = [
        {
          dependentTaskId: tasks[1].id,
          dependsOnTaskId: tasks[0].id,
          type: 'hard',
        },
        {
          dependentTaskId: tasks[0].id,
          dependsOnTaskId: tasks[1].id,
          type: 'soft',
        },
      ];

      const graph = resolver.buildDependencyGraph(tasks, dependencies);
      const cycles = resolver.detectCycles(graph);
      const resolved = resolver.resolveDependencies(graph, cycles);

      expect(resolved.success).toBe(true);
      expect(resolved.actions).toHaveLength(1);
      expect(resolved.actions[0].type).toBe('remove_dependency');
    });

    it('should provide multiple resolution options for complex cycles', () => {
      const tasks = mockTasks.slice(0, 3);
      const dependencies: TaskDependency[] = [
        {
          dependentTaskId: tasks[1].id,
          dependsOnTaskId: tasks[0].id,
          type: 'hard',
        },
        {
          dependentTaskId: tasks[2].id,
          dependsOnTaskId: tasks[1].id,
          type: 'hard',
        },
        {
          dependentTaskId: tasks[0].id,
          dependsOnTaskId: tasks[2].id,
          type: 'soft',
        },
      ];

      const graph = resolver.buildDependencyGraph(tasks, dependencies);
      const cycles = resolver.detectCycles(graph);
      const resolved = resolver.resolveDependencies(graph, cycles);

      expect(resolved.success).toBe(true);
      expect(resolved.actions.length).toBeGreaterThan(0);
    });

    it('should handle unresolvable hard dependency cycles', () => {
      const tasks = mockTasks.slice(0, 2);
      const dependencies: TaskDependency[] = [
        {
          dependentTaskId: tasks[1].id,
          dependsOnTaskId: tasks[0].id,
          type: 'hard',
        },
        {
          dependentTaskId: tasks[0].id,
          dependsOnTaskId: tasks[1].id,
          type: 'hard',
        },
      ];

      const graph = resolver.buildDependencyGraph(tasks, dependencies);
      const cycles = resolver.detectCycles(graph);
      const resolved = resolver.resolveDependencies(graph, cycles);

      expect(resolved.success).toBe(false);
      expect(resolved.unresolvedCycles).toHaveLength(1);
    });
  });

  describe('Critical Path Analysis', () => {
    it('should identify critical path in linear dependency chain', () => {
      const tasks = mockTasks.slice(0, 3);
      const dependencies: TaskDependency[] = [
        {
          dependentTaskId: tasks[1].id,
          dependsOnTaskId: tasks[0].id,
          type: 'hard',
        },
        {
          dependentTaskId: tasks[2].id,
          dependsOnTaskId: tasks[1].id,
          type: 'hard',
        },
      ];

      const graph = resolver.buildDependencyGraph(tasks, dependencies);
      const criticalPath = resolver.findCriticalPath(graph, tasks);

      expect(criticalPath).toHaveLength(3);
      expect(criticalPath).toEqual([tasks[0].id, tasks[1].id, tasks[2].id]);
    });

    it('should identify longest path as critical path in complex graph', () => {
      const tasks = mockTasks.slice(0, 4);
      const dependencies: TaskDependency[] = [
        {
          dependentTaskId: tasks[1].id,
          dependsOnTaskId: tasks[0].id,
          type: 'hard',
        },
        {
          dependentTaskId: tasks[2].id,
          dependsOnTaskId: tasks[0].id,
          type: 'hard',
        },
        {
          dependentTaskId: tasks[3].id,
          dependsOnTaskId: tasks[1].id,
          type: 'hard',
        },
      ];

      const graph = resolver.buildDependencyGraph(tasks, dependencies);
      const criticalPath = resolver.findCriticalPath(graph, tasks);

      // Should find the longest path: A -> B -> D
      expect(criticalPath.length).toBeGreaterThanOrEqual(3);
      expect(criticalPath).toContain(tasks[0].id);
      expect(criticalPath).toContain(tasks[3].id);
    });
  });

  describe('Ready Tasks Identification', () => {
    it('should identify all tasks as ready when no dependencies exist', () => {
      const tasks = mockTasks.slice(0, 3);
      const graph = resolver.buildDependencyGraph(tasks, []);
      const readyTasks = resolver.getReadyTasks(graph, tasks);

      expect(readyTasks).toHaveLength(3);
      expect(readyTasks.map((t) => t.id)).toEqual(
        expect.arrayContaining(tasks.map((t) => t.id)),
      );
    });

    it('should identify only tasks with no dependencies as ready', () => {
      const tasks = mockTasks.slice(0, 3);
      const dependencies: TaskDependency[] = [
        {
          dependentTaskId: tasks[1].id,
          dependsOnTaskId: tasks[0].id,
          type: 'hard',
        },
        {
          dependentTaskId: tasks[2].id,
          dependsOnTaskId: tasks[1].id,
          type: 'hard',
        },
      ];

      const graph = resolver.buildDependencyGraph(tasks, dependencies);
      const readyTasks = resolver.getReadyTasks(graph, tasks);

      expect(readyTasks).toHaveLength(1);
      expect(readyTasks[0].id).toBe(tasks[0].id);
    });

    it('should update ready tasks as dependencies complete', () => {
      const tasks = mockTasks.slice(0, 3);
      tasks[0].status = 'completed';

      const dependencies: TaskDependency[] = [
        {
          dependentTaskId: tasks[1].id,
          dependsOnTaskId: tasks[0].id,
          type: 'hard',
        },
        {
          dependentTaskId: tasks[2].id,
          dependsOnTaskId: tasks[1].id,
          type: 'hard',
        },
      ];

      const graph = resolver.buildDependencyGraph(tasks, dependencies);
      const readyTasks = resolver.getReadyTasks(graph, tasks);

      expect(readyTasks).toHaveLength(1);
      expect(readyTasks[0].id).toBe(tasks[1].id);
    });
  });

  describe('Parallel Execution Groups', () => {
    it('should identify parallel execution groups correctly', () => {
      const tasks = mockTasks.slice(0, 4);
      const dependencies: TaskDependency[] = [
        {
          dependentTaskId: tasks[1].id,
          dependsOnTaskId: tasks[0].id,
          type: 'hard',
        },
        {
          dependentTaskId: tasks[2].id,
          dependsOnTaskId: tasks[0].id,
          type: 'hard',
        },
        {
          dependentTaskId: tasks[3].id,
          dependsOnTaskId: tasks[1].id,
          type: 'hard',
        },
        {
          dependentTaskId: tasks[3].id,
          dependsOnTaskId: tasks[2].id,
          type: 'hard',
        },
      ];

      const graph = resolver.buildDependencyGraph(tasks, dependencies);
      const parallelGroups = resolver.findParallelExecutionGroups(graph);

      expect(parallelGroups.length).toBeGreaterThanOrEqual(3);
      // Group 1: [A]
      expect(parallelGroups[0]).toContain(tasks[0].id);
      // Group 2: [B, C] - can execute in parallel
      expect(parallelGroups[1]).toEqual(
        expect.arrayContaining([tasks[1].id, tasks[2].id]),
      );
      // Group 3: [D]
      expect(parallelGroups[2]).toContain(tasks[3].id);
    });

    it('should handle single task groups', () => {
      const tasks = [mockTasks[0]];
      const graph = resolver.buildDependencyGraph(tasks, []);
      const parallelGroups = resolver.findParallelExecutionGroups(graph);

      expect(parallelGroups).toHaveLength(1);
      expect(parallelGroups[0]).toEqual([tasks[0].id]);
    });
  });

  describe('Performance and Edge Cases', () => {
    it('should handle large dependency graphs efficiently', () => {
      const largeTasks = Array.from({ length: 100 }, (_, i) =>
        createMockTask(`task-${i}`),
      );
      const dependencies: TaskDependency[] = [];

      // Create linear dependency chain
      for (let i = 1; i < largeTasks.length; i++) {
        dependencies.push({
          dependentTaskId: largeTasks[i].id,
          dependsOnTaskId: largeTasks[i - 1].id,
          type: 'hard',
        });
      }

      const startTime = Date.now();
      const graph = resolver.buildDependencyGraph(largeTasks, dependencies);
      const sorted = resolver.topologicalSort(graph);
      const endTime = Date.now();

      expect(sorted).toHaveLength(100);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete in under 1 second
    });

    it('should handle duplicate dependencies gracefully', () => {
      const tasks = mockTasks.slice(0, 2);
      const dependencies: TaskDependency[] = [
        {
          dependentTaskId: tasks[1].id,
          dependsOnTaskId: tasks[0].id,
          type: 'hard',
        },
        {
          dependentTaskId: tasks[1].id,
          dependsOnTaskId: tasks[0].id,
          type: 'hard',
        }, // Duplicate
      ];

      const graph = resolver.buildDependencyGraph(tasks, dependencies);

      // Should handle duplicates without creating multiple edges
      expect(graph.edges).toHaveLength(1);
      expect(graph.metadata.edgeCount).toBe(1);
    });

    it('should handle self-dependencies', () => {
      const tasks = [mockTasks[0]];
      const dependencies: TaskDependency[] = [
        {
          dependentTaskId: tasks[0].id,
          dependsOnTaskId: tasks[0].id,
          type: 'hard',
        },
      ];

      const graph = resolver.buildDependencyGraph(tasks, dependencies);
      const cycles = resolver.detectCycles(graph);

      expect(cycles).toHaveLength(1);
      expect(cycles[0].cycle).toContain(tasks[0].id);
    });
  });
});

// Helper functions
function createMockTasks(): Task[] {
  return [
    createMockTask('task-a'),
    createMockTask('task-b'),
    createMockTask('task-c'),
    createMockTask('task-d'),
    createMockTask('task-e'),
  ];
}

function createMockTask(id: string): Task {
  return {
    id,
    title: `Task ${id}`,
    description: `Description for ${id}`,
    status: 'pending',
    priority: 'medium',
    category: 'implementation',
    metadata: {
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'test',
      estimatedDuration: 60000, // 1 minute
      tags: ['test'],
    },
  };
}
