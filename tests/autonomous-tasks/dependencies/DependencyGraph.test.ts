/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, test, expect, beforeEach } from 'vitest';
import { Task } from '../../../packages/core/src/task/types.js';
import { DecisionDependencyGraph as DependencyGraph } from '../../../packages/core/src/decision/DependencyGraph.js';
import { DetectedDependency } from '../../../packages/core/src/decision/DependencyAnalyzer.js';

// Define proper interfaces for test types
interface TestGraphNode {
  id: string;
  task: Task;
  level: number;
  earliestStart: number;
  outEdges: unknown[];
  inEdges: unknown[];
}

interface TestGraphEdge {
  from: string;
  to: string;
  dependency: DetectedDependency;
}

interface TestValidationResult {
  isValid: boolean;
  issues: Array<{
    type: string;
    affectedNodes?: string[];
  }>;
  metrics: {
    nodeCount: number;
    edgeCount: number;
    maxPathLength: number;
    criticalPathLength: number;
    density: number;
    averageFanOut: number;
  };
}

interface TestCycleComponent {
  nodes: string[];
  breakingOptions: Array<{
    impactScore: number;
  }>;
}

describe('DependencyGraph', () => {
  let graph: DependencyGraph;
  let sampleTasks: Task[];
  let sampleDependencies: DetectedDependency[];

  beforeEach(() => {
    graph = new DependencyGraph();

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
        required_capabilities: ['database'],
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
        required_capabilities: ['backend'],
        created_at: '2024-01-01T01:00:00Z',
        updated_at: '2024-01-01T01:00:00Z',
        created_by: 'system',
      },
      {
        id: 'task-3',
        title: 'Build UI',
        description: 'Create user interface',
        type: 'implementation',
        priority: 'normal',
        status: 'queued',
        feature_id: 'feature-1',
        dependencies: ['task-2'],
        estimated_effort: 4,
        required_capabilities: ['frontend'],
        created_at: '2024-01-01T02:00:00Z',
        updated_at: '2024-01-01T02:00:00Z',
        created_by: 'system',
      },
      {
        id: 'task-4',
        title: 'Test System',
        description: 'Integration testing',
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
    ];

    // Create sample dependencies
    sampleDependencies = [
      {
        from: 'task-1',
        to: 'task-2',
        type: 'explicit',
        confidence: 1.0,
        reason: 'API depends on database setup',
        blocking: true,
        estimatedDelay: 3,
      },
      {
        from: 'task-2',
        to: 'task-3',
        type: 'explicit',
        confidence: 1.0,
        reason: 'UI depends on API',
        blocking: true,
        estimatedDelay: 5,
      },
      {
        from: 'task-3',
        to: 'task-4',
        type: 'explicit',
        confidence: 1.0,
        reason: 'Testing depends on UI',
        blocking: true,
        estimatedDelay: 4,
      },
    ];
  });

  describe('buildGraph', () => {
    test('should build graph with correct nodes and edges', async () => {
      await graph.buildGraph(sampleTasks, sampleDependencies);

      const nodes = graph.getNodes();
      const edges = graph.getEdges();

      expect(nodes).toHaveLength(4);
      expect(edges).toHaveLength(3);

      // Verify nodes have correct task references
      nodes.forEach((node: TestGraphNode) => {
        const task = sampleTasks.find((t: Task) => t.id === node.id);
        expect(task).toBeDefined();
        expect(node.task).toEqual(task);
      });
    });

    test('should calculate node levels correctly', async () => {
      await graph.buildGraph(sampleTasks, sampleDependencies);

      const nodes = graph.getNodes();

      const task1Node = nodes.find((n: TestGraphNode) => n.id === 'task-1')!;
      const task2Node = nodes.find((n: TestGraphNode) => n.id === 'task-2')!;
      const task3Node = nodes.find((n: TestGraphNode) => n.id === 'task-3')!;
      const task4Node = nodes.find((n: TestGraphNode) => n.id === 'task-4')!;

      expect(task1Node.level).toBe(0);
      expect(task2Node.level).toBe(1);
      expect(task3Node.level).toBe(2);
      expect(task4Node.level).toBe(3);
    });

    test('should calculate critical path', async () => {
      await graph.buildGraph(sampleTasks, sampleDependencies);

      const criticalPath = graph.getCriticalPath();

      // All tasks should be on critical path in this linear dependency chain
      expect(criticalPath).toHaveLength(4);
      expect(criticalPath).toContain('task-1');
      expect(criticalPath).toContain('task-2');
      expect(criticalPath).toContain('task-3');
      expect(criticalPath).toContain('task-4');
    });

    test('should calculate earliest and latest start times', async () => {
      await graph.buildGraph(sampleTasks, sampleDependencies);

      const nodes = graph.getNodes();

      const task1Node = nodes.find((n: TestGraphNode) => n.id === 'task-1')!;
      const task2Node = nodes.find((n: TestGraphNode) => n.id === 'task-2')!;

      expect(task1Node.earliestStart).toBe(0);
      expect(task2Node.earliestStart).toBe(3); // After task-1 completes (effort: 3)
    });

    test('should handle empty input', async () => {
      await graph.buildGraph([], []);

      const nodes = graph.getNodes();
      const edges = graph.getEdges();

      expect(nodes).toHaveLength(0);
      expect(edges).toHaveLength(0);
    });
  });

  describe('addNode and addEdge', () => {
    test('should add nodes correctly', () => {
      graph.addNode(sampleTasks[0]);

      const nodes = graph.getNodes();
      expect(nodes).toHaveLength(1);
      expect(nodes[0].id).toBe('task-1');
      expect(nodes[0].task).toEqual(sampleTasks[0]);
    });

    test('should not add duplicate nodes', () => {
      graph.addNode(sampleTasks[0]);
      graph.addNode(sampleTasks[0]); // Add same task again

      const nodes = graph.getNodes();
      expect(nodes).toHaveLength(1);
    });

    test('should add edges correctly', () => {
      // First add nodes
      sampleTasks.forEach((task: Task) => graph.addNode(task));

      // Then add edge
      graph.addEdge(sampleDependencies[0]);

      const edges = graph.getEdges();
      expect(edges).toHaveLength(1);

      const edge = edges[0];
      expect(edge.from).toBe('task-1');
      expect(edge.to).toBe('task-2');
      expect(edge.dependency).toEqual(sampleDependencies[0]);
    });

    test('should not add edges for missing nodes', () => {
      // Add dependency without adding nodes first
      graph.addEdge(sampleDependencies[0]);

      const edges = graph.getEdges();
      expect(edges).toHaveLength(0);
    });

    test('should update node edge references', () => {
      sampleTasks.forEach((task: Task) => graph.addNode(task));
      graph.addEdge(sampleDependencies[0]);

      const nodes = graph.getNodes();
      const fromNode = nodes.find((n: TestGraphNode) => n.id === 'task-1')!;
      const toNode = nodes.find((n: TestGraphNode) => n.id === 'task-2')!;

      expect(fromNode.outEdges).toHaveLength(1);
      expect(toNode.inEdges).toHaveLength(1);
    });
  });

  describe('removeEdge', () => {
    beforeEach(async () => {
      await graph.buildGraph(sampleTasks, sampleDependencies);
    });

    test('should remove edge correctly', () => {
      const initialEdgeCount = graph.getEdges().length;
      const success = graph.removeEdge('task-1', 'task-2');

      expect(success).toBe(true);
      expect(graph.getEdges()).toHaveLength(initialEdgeCount - 1);
    });

    test('should return false for non-existent edge', () => {
      const success = graph.removeEdge('task-1', 'task-4'); // No direct edge
      expect(success).toBe(false);
    });

    test('should update node edge references after removal', () => {
      graph.removeEdge('task-1', 'task-2');

      const nodes = graph.getNodes();
      const fromNode = nodes.find((n: TestGraphNode) => n.id === 'task-1')!;
      const toNode = nodes.find((n: TestGraphNode) => n.id === 'task-2')!;

      expect(fromNode.outEdges).toHaveLength(0);
      expect(toNode.inEdges).toHaveLength(0);
    });
  });

  describe('validateGraph', () => {
    test('should validate valid graph successfully', async () => {
      await graph.buildGraph(sampleTasks, sampleDependencies);

      const validation = await graph.validateGraph();

      expect(validation.isValid).toBe(true);
      expect(validation.metrics.nodeCount).toBe(4);
      expect(validation.metrics.edgeCount).toBe(3);
    });

    test('should detect circular dependencies', async () => {
      // Create circular dependency
      const circularDeps: DetectedDependency[] = [
        ...sampleDependencies,
        {
          from: 'task-4',
          to: 'task-1', // Creates cycle: task-1 -> task-2 -> task-3 -> task-4 -> task-1
          type: 'explicit',
          confidence: 1.0,
          reason: 'Circular dependency for testing',
          blocking: true,
          estimatedDelay: 2,
        },
      ];

      await graph.buildGraph(sampleTasks, circularDeps);
      const validation = await graph.validateGraph();

      expect(validation.isValid).toBe(false);

      const circularIssues = validation.issues.filter(
        (issue) => issue.type === 'circular_dependency',
      );
      expect(circularIssues.length).toBeGreaterThan(0);
    });

    test('should detect orphaned nodes', async () => {
      const orphanedTask: Task = {
        id: 'orphaned-task',
        title: 'Orphaned Task',
        description: 'Task with no connections',
        type: 'implementation',
        priority: 'low',
        status: 'queued',
        feature_id: 'feature-1',
        dependencies: [],
        estimated_effort: 1,
        required_capabilities: [],
        created_at: '2024-01-01T04:00:00Z',
        updated_at: '2024-01-01T04:00:00Z',
        created_by: 'system',
      };

      const tasksWithOrphan = [...sampleTasks, orphanedTask];
      await graph.buildGraph(tasksWithOrphan, sampleDependencies);

      const validation = await graph.validateGraph();

      const orphanIssues = validation.issues.filter(
        (issue) => issue.type === 'orphaned_node',
      );
      expect(orphanIssues.length).toBeGreaterThan(0);
      expect(orphanIssues[0].affectedNodes).toContain('orphaned-task');
    });

    test('should detect excessive fan-out', async () => {
      // Create task with many dependencies (high fan-out)
      const highFanOutDeps: DetectedDependency[] = [];
      const additionalTasks: Task[] = [];

      // Create many tasks depending on task-1
      for (let i = 0; i < 6; i++) {
        const taskId = `dependent-task-${i}`;
        additionalTasks.push({
          id: taskId,
          title: `Dependent Task ${i}`,
          description: `Task depending on task-1`,
          type: 'implementation',
          priority: 'normal',
          status: 'queued',
          feature_id: 'feature-1',
          dependencies: ['task-1'],
          estimated_effort: 1,
          required_capabilities: [],
          created_at: '2024-01-01T04:00:00Z',
          updated_at: '2024-01-01T04:00:00Z',
          created_by: 'system',
        });

        highFanOutDeps.push({
          from: 'task-1',
          to: taskId,
          type: 'explicit',
          confidence: 1.0,
          reason: 'High fan-out dependency',
          blocking: true,
          estimatedDelay: 1,
        });
      }

      const allTasks = [...sampleTasks, ...additionalTasks];
      const allDeps = [...sampleDependencies, ...highFanOutDeps];

      await graph.buildGraph(allTasks, allDeps);
      const validation = await graph.validateGraph();

      const fanOutIssues = validation.issues.filter(
        (issue) => issue.type === 'excessive_fan_out',
      );
      expect(fanOutIssues.length).toBeGreaterThan(0);
    });

    test('should calculate graph metrics correctly', async () => {
      await graph.buildGraph(sampleTasks, sampleDependencies);

      const validation = await graph.validateGraph();
      const metrics = validation.metrics;

      expect(metrics.nodeCount).toBe(4);
      expect(metrics.edgeCount).toBe(3);
      expect(metrics.maxPathLength).toBe(3); // 0, 1, 2, 3
      expect(metrics.criticalPathLength).toBe(4);
      expect(metrics.density).toBeGreaterThan(0);
      expect(metrics.averageFanOut).toBe(0.75); // 3 edges / 4 nodes
    });
  });

  describe('detectStronglyConnectedComponents', () => {
    test('should detect no cycles in acyclic graph', async () => {
      await graph.buildGraph(sampleTasks, sampleDependencies);

      const cycles = await graph.detectStronglyConnectedComponents();

      // Filter for actual cycles (components with more than 1 node)
      const actualCycles = cycles.filter(
        (cycle: TestCycleComponent) => cycle.nodes.length > 1,
      );
      expect(actualCycles).toHaveLength(0);
    });

    test('should detect cycles in cyclic graph', async () => {
      const cyclicDeps: DetectedDependency[] = [
        {
          from: 'task-1',
          to: 'task-2',
          type: 'explicit',
          confidence: 1.0,
          reason: 'Cycle edge 1',
          blocking: true,
          estimatedDelay: 1,
        },
        {
          from: 'task-2',
          to: 'task-3',
          type: 'explicit',
          confidence: 1.0,
          reason: 'Cycle edge 2',
          blocking: true,
          estimatedDelay: 1,
        },
        {
          from: 'task-3',
          to: 'task-1', // Creates cycle
          type: 'explicit',
          confidence: 1.0,
          reason: 'Cycle edge 3',
          blocking: true,
          estimatedDelay: 1,
        },
      ];

      await graph.buildGraph(sampleTasks.slice(0, 3), cyclicDeps);

      const cycles = await graph.detectStronglyConnectedComponents();
      const actualCycles = cycles.filter(
        (cycle: TestCycleComponent) => cycle.nodes.length > 1,
      );

      expect(actualCycles.length).toBeGreaterThan(0);
      expect(actualCycles[0].nodes).toContain('task-1');
      expect(actualCycles[0].nodes).toContain('task-2');
      expect(actualCycles[0].nodes).toContain('task-3');
    });

    test('should provide cycle breaking options', async () => {
      const cyclicDeps: DetectedDependency[] = [
        {
          from: 'task-1',
          to: 'task-2',
          type: 'explicit',
          confidence: 0.9,
          reason: 'Strong dependency',
          blocking: true,
          estimatedDelay: 1,
        },
        {
          from: 'task-2',
          to: 'task-1', // Simple 2-node cycle
          type: 'implicit',
          confidence: 0.5,
          reason: 'Weak dependency',
          blocking: false,
          estimatedDelay: 1,
        },
      ];

      await graph.buildGraph(sampleTasks.slice(0, 2), cyclicDeps);

      const cycles = await graph.detectStronglyConnectedComponents();
      const actualCycles = cycles.filter(
        (cycle: TestCycleComponent) => cycle.nodes.length > 1,
      );

      expect(actualCycles.length).toBeGreaterThan(0);
      expect(actualCycles[0].breakingOptions.length).toBeGreaterThan(0);

      // Breaking options should be sorted by impact (lower is better)
      const options = actualCycles[0].breakingOptions;
      for (let i = 1; i < options.length; i++) {
        expect(options[i].impactScore).toBeGreaterThanOrEqual(
          options[i - 1].impactScore,
        );
      }
    });
  });

  describe('performance', () => {
    test('should handle large graphs efficiently', async () => {
      const largeTasks: Task[] = [];
      const largeDeps: DetectedDependency[] = [];

      // Create large chain of tasks
      for (let i = 0; i < 100; i++) {
        largeTasks.push({
          id: `large-task-${i}`,
          title: `Large Task ${i}`,
          description: `Task ${i} in large chain`,
          type: 'implementation',
          priority: 'normal',
          status: 'queued',
          feature_id: 'feature-large',
          dependencies: i > 0 ? [`large-task-${i - 1}`] : [],
          estimated_effort: 1,
          required_capabilities: [],
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          created_by: 'system',
        });

        if (i > 0) {
          largeDeps.push({
            from: `large-task-${i - 1}`,
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
      await graph.buildGraph(largeTasks, largeDeps);
      const buildTime = Date.now() - startTime;

      // Should complete within reasonable time (less than 2 seconds)
      expect(buildTime).toBeLessThan(2000);

      const nodes = graph.getNodes();
      const edges = graph.getEdges();
      expect(nodes).toHaveLength(100);
      expect(edges).toHaveLength(99);
    });
  });

  describe('getters', () => {
    beforeEach(async () => {
      await graph.buildGraph(sampleTasks, sampleDependencies);
    });

    test('should return all nodes', () => {
      const nodes = graph.getNodes();
      expect(nodes).toHaveLength(4);
    });

    test('should return all edges', () => {
      const edges = graph.getEdges();
      expect(edges).toHaveLength(3);
    });

    test('should return specific node by ID', () => {
      const node = graph.getNode('task-1');
      expect(node).toBeDefined();
      expect(node!.id).toBe('task-1');
    });

    test('should return undefined for non-existent node', () => {
      const node = graph.getNode('non-existent');
      expect(node).toBeUndefined();
    });

    test('should return critical path', () => {
      const criticalPath = graph.getCriticalPath();
      expect(Array.isArray(criticalPath)).toBe(true);
      expect(criticalPath.length).toBeGreaterThan(0);
    });
  });
});
