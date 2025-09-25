/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type {
  TaskId,
  Task,
  TaskDependency,
  DependencyGraph,
  DependencyNode,
  CircularDependency,
} from './types.js';
import { getComponentLogger } from '../utils/logger.js';

const logger = getComponentLogger('DependencyGraph');

/**
 * Advanced dependency graph construction and analysis system
 * Provides sophisticated algorithms for dependency management and resolution
 */
export class DependencyGraphManager {
  private graph: DependencyGraph;
  private tasks: Map<TaskId, Task>;

  constructor() {
    this.graph = {
      nodes: new Map(),
      edges: [],
      metadata: {
        nodeCount: 0,
        edgeCount: 0,
        hasCycles: false,
        maxDepth: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    };
    this.tasks = new Map();
  }

  /**
   * Add a task to the dependency graph
   */
  addTask(task: Task): void {
    logger.debug('Adding task to dependency graph', { taskId: task.id, title: task.title });

    this.tasks.set(task.id, task);

    if (!this.graph.nodes.has(task.id)) {
      const node: DependencyNode = {
        taskId: task.id,
        dependencies: [],
        dependents: [],
        dependencyRelations: [],
        traversalMetadata: {},
      };

      this.graph.nodes.set(task.id, node);
      this.graph.metadata.nodeCount++;
      this.graph.metadata.updatedAt = new Date();
    }
  }

  /**
   * Add a dependency relationship between tasks
   */
  addDependency(dependency: TaskDependency): void {
    logger.debug('Adding dependency relationship', {
      dependent: dependency.dependentTaskId,
      dependsOn: dependency.dependsOnTaskId,
      type: dependency.type,
    });

    // Ensure both tasks exist in the graph
    if (!this.graph.nodes.has(dependency.dependentTaskId)) {
      throw new Error(`Dependent task ${dependency.dependentTaskId} not found in graph`);
    }
    if (!this.graph.nodes.has(dependency.dependsOnTaskId)) {
      throw new Error(`Dependency task ${dependency.dependsOnTaskId} not found in graph`);
    }

    // Check if dependency already exists
    const existingDependency = this.graph.edges.find(
      edge =>
        edge.dependentTaskId === dependency.dependentTaskId &&
        edge.dependsOnTaskId === dependency.dependsOnTaskId
    );

    if (existingDependency) {
      logger.warn('Dependency already exists, updating', { dependency });
      this.removeDependency(dependency.dependentTaskId, dependency.dependsOnTaskId);
    }

    // Add to edges
    this.graph.edges.push(dependency);
    this.graph.metadata.edgeCount++;

    // Update node relationships
    const dependentNode = this.graph.nodes.get(dependency.dependentTaskId)!;
    const dependencyNode = this.graph.nodes.get(dependency.dependsOnTaskId)!;

    dependentNode.dependencies.push(dependency.dependsOnTaskId);
    dependentNode.dependencyRelations.push(dependency);

    dependencyNode.dependents.push(dependency.dependentTaskId);

    this.graph.metadata.updatedAt = new Date();

    // Check for cycles after adding dependency
    this.detectAndUpdateCycles();
  }

  /**
   * Remove a dependency relationship
   */
  removeDependency(dependentTaskId: TaskId, dependsOnTaskId: TaskId): void {
    logger.debug('Removing dependency relationship', { dependentTaskId, dependsOnTaskId });

    // Remove from edges
    const edgeIndex = this.graph.edges.findIndex(
      edge =>
        edge.dependentTaskId === dependentTaskId &&
        edge.dependsOnTaskId === dependsOnTaskId
    );

    if (edgeIndex !== -1) {
      this.graph.edges.splice(edgeIndex, 1);
      this.graph.metadata.edgeCount--;
    }

    // Update node relationships
    const dependentNode = this.graph.nodes.get(dependentTaskId);
    const dependencyNode = this.graph.nodes.get(dependsOnTaskId);

    if (dependentNode) {
      dependentNode.dependencies = dependentNode.dependencies.filter(id => id !== dependsOnTaskId);
      dependentNode.dependencyRelations = dependentNode.dependencyRelations.filter(
        rel => rel.dependsOnTaskId !== dependsOnTaskId
      );
    }

    if (dependencyNode) {
      dependencyNode.dependents = dependencyNode.dependents.filter(id => id !== dependentTaskId);
    }

    this.graph.metadata.updatedAt = new Date();
    this.detectAndUpdateCycles();
  }

  /**
   * Remove a task from the dependency graph
   */
  removeTask(taskId: TaskId): void {
    logger.debug('Removing task from dependency graph', { taskId });

    const node = this.graph.nodes.get(taskId);
    if (!node) {
      return;
    }

    // Remove all dependencies involving this task
    [...node.dependencies].forEach(depId => {
      this.removeDependency(taskId, depId);
    });

    [...node.dependents].forEach(depId => {
      this.removeDependency(depId, taskId);
    });

    // Remove the node
    this.graph.nodes.delete(taskId);
    this.graph.metadata.nodeCount--;
    this.tasks.delete(taskId);

    this.graph.metadata.updatedAt = new Date();
    this.detectAndUpdateCycles();
  }

  /**
   * Detect circular dependencies using DFS-based cycle detection
   */
  detectCircularDependencies(): CircularDependency[] {
    logger.debug('Detecting circular dependencies');

    const cycles: CircularDependency[] = [];
    const visited = new Set<TaskId>();
    const recursionStack = new Set<TaskId>();
    const pathStack: TaskId[] = [];

    const dfs = (taskId: TaskId): boolean => {
      if (recursionStack.has(taskId)) {
        // Found a cycle - extract the cycle
        const cycleStartIndex = pathStack.indexOf(taskId);
        const cycle = pathStack.slice(cycleStartIndex);
        cycle.push(taskId); // Complete the cycle

        // Get edges forming the cycle
        const cycleEdges: TaskDependency[] = [];
        for (let i = 0; i < cycle.length - 1; i++) {
          const edge = this.graph.edges.find(
            e => e.dependentTaskId === cycle[i + 1] && e.dependsOnTaskId === cycle[i]
          );
          if (edge) {
            cycleEdges.push(edge);
          }
        }

        // Generate resolution strategies
        const resolutionStrategies = this.generateResolutionStrategies(cycle, cycleEdges);

        cycles.push({
          cycle: cycle.slice(0, -1), // Remove duplicate last element
          edges: cycleEdges,
          resolutionStrategies,
        });

        return true;
      }

      if (visited.has(taskId)) {
        return false;
      }

      visited.add(taskId);
      recursionStack.add(taskId);
      pathStack.push(taskId);

      const node = this.graph.nodes.get(taskId);
      if (node) {
        for (const depId of node.dependencies) {
          if (dfs(depId)) {
            return true;
          }
        }
      }

      recursionStack.delete(taskId);
      pathStack.pop();
      return false;
    };

    // Check all nodes for cycles
    for (const taskId of this.graph.nodes.keys()) {
      if (!visited.has(taskId)) {
        dfs(taskId);
      }
    }

    return cycles;
  }

  /**
   * Generate resolution strategies for circular dependencies
   */
  private generateResolutionStrategies(
    cycle: TaskId[],
    edges: TaskDependency[]
  ): CircularDependency['resolutionStrategies'] {
    const strategies: CircularDependency['resolutionStrategies'] = [];

    // Strategy 1: Remove the weakest edge (soft dependencies first)
    const softEdges = edges.filter(e => e.type === 'soft');
    if (softEdges.length > 0) {
      strategies.push({
        strategy: 'remove_edge',
        description: `Remove soft dependency: ${softEdges[0].dependsOnTaskId} -> ${softEdges[0].dependentTaskId}`,
        impact: 'low',
        edges: [softEdges[0]],
      });
    }

    // Strategy 2: Split the most complex task in the cycle
    const taskComplexities = cycle.map(taskId => {
      const task = this.tasks.get(taskId);
      return {
        taskId,
        complexity: this.calculateTaskComplexity(task),
      };
    });

    const mostComplexTask = taskComplexities.reduce((max, current) =>
      current.complexity > max.complexity ? current : max
    );

    if (mostComplexTask.complexity > 5) {
      strategies.push({
        strategy: 'split_task',
        description: `Split complex task ${mostComplexTask.taskId} into smaller subtasks`,
        impact: 'medium',
        tasks: [mostComplexTask.taskId],
      });
    }

    // Strategy 3: Remove temporal dependencies if present
    const temporalEdges = edges.filter(e => e.type === 'temporal');
    if (temporalEdges.length > 0) {
      strategies.push({
        strategy: 'reorder',
        description: `Reorder tasks to eliminate temporal dependency: ${temporalEdges[0].dependsOnTaskId} -> ${temporalEdges[0].dependentTaskId}`,
        impact: 'low',
        edges: temporalEdges,
      });
    }

    // Strategy 4: Remove hard dependency with highest impact
    const hardEdges = edges.filter(e => e.type === 'hard');
    if (hardEdges.length > 0 && strategies.length === 0) {
      strategies.push({
        strategy: 'remove_edge',
        description: `Remove hard dependency (high impact): ${hardEdges[0].dependsOnTaskId} -> ${hardEdges[0].dependentTaskId}`,
        impact: 'high',
        edges: [hardEdges[0]],
      });
    }

    return strategies;
  }

  /**
   * Calculate task complexity score
   */
  private calculateTaskComplexity(task?: Task): number {
    if (!task) return 0;

    let complexity = 0;

    // Base complexity from description length
    complexity += Math.min(task.description.length / 100, 5);

    // Add complexity based on category
    const categoryComplexity = {
      'implementation': 3,
      'testing': 2,
      'documentation': 1,
      'analysis': 4,
      'refactoring': 3,
      'deployment': 2,
    };
    complexity += categoryComplexity[task.category] || 2;

    // Add complexity based on parameters
    if (task.parameters) {
      complexity += Object.keys(task.parameters).length * 0.5;
    }

    // Add complexity based on validation criteria
    if (task.validationCriteria) {
      complexity += task.validationCriteria.length * 0.3;
    }

    return Math.round(complexity);
  }

  /**
   * Update cycle detection in metadata
   */
  private detectAndUpdateCycles(): void {
    const cycles = this.detectCircularDependencies();
    this.graph.metadata.hasCycles = cycles.length > 0;

    if (cycles.length > 0) {
      logger.warn('Circular dependencies detected', {
        cycleCount: cycles.length,
        cycles: cycles.map(c => c.cycle),
      });
    }
  }

  /**
   * Get topological ordering of tasks (returns null if cycles exist)
   */
  getTopologicalOrder(): TaskId[] | null {
    logger.debug('Computing topological ordering');

    if (this.graph.metadata.hasCycles) {
      logger.warn('Cannot compute topological order: graph contains cycles');
      return null;
    }

    const inDegree = new Map<TaskId, number>();
    const queue: TaskId[] = [];
    const result: TaskId[] = [];

    // Initialize in-degrees
    for (const taskId of this.graph.nodes.keys()) {
      inDegree.set(taskId, 0);
    }

    // Calculate in-degrees
    for (const edge of this.graph.edges) {
      const currentDegree = inDegree.get(edge.dependentTaskId) || 0;
      inDegree.set(edge.dependentTaskId, currentDegree + 1);
    }

    // Find nodes with in-degree 0
    for (const [taskId, degree] of inDegree) {
      if (degree === 0) {
        queue.push(taskId);
      }
    }

    // Process nodes
    while (queue.length > 0) {
      const current = queue.shift()!;
      result.push(current);

      const node = this.graph.nodes.get(current);
      if (node) {
        for (const dependent of node.dependents) {
          const currentDegree = inDegree.get(dependent) || 0;
          inDegree.set(dependent, currentDegree - 1);

          if (inDegree.get(dependent) === 0) {
            queue.push(dependent);
          }
        }
      }
    }

    // Check if all nodes were processed
    if (result.length !== this.graph.nodes.size) {
      logger.error('Topological sort failed: not all nodes processed', {
        processed: result.length,
        total: this.graph.nodes.size,
      });
      return null;
    }

    return result;
  }

  /**
   * Calculate the critical path through the dependency graph
   */
  calculateCriticalPath(): TaskId[] {
    logger.debug('Calculating critical path');

    const distances = new Map<TaskId, number>();
    const predecessors = new Map<TaskId, TaskId | null>();

    // Initialize distances
    for (const taskId of this.graph.nodes.keys()) {
      distances.set(taskId, 0);
      predecessors.set(taskId, null);
    }

    // Get topological order
    const topOrder = this.getTopologicalOrder();
    if (!topOrder) {
      logger.warn('Cannot calculate critical path: circular dependencies detected');
      return [];
    }

    // Calculate longest path (critical path)
    for (const taskId of topOrder) {
      const task = this.tasks.get(taskId);
      const taskDuration = task?.metadata.estimatedDuration || 1000; // Default 1 second
      const node = this.graph.nodes.get(taskId);

      if (node) {
        for (const dependentId of node.dependents) {
          const newDistance = (distances.get(taskId) || 0) + taskDuration;
          const currentDistance = distances.get(dependentId) || 0;

          if (newDistance > currentDistance) {
            distances.set(dependentId, newDistance);
            predecessors.set(dependentId, taskId);
          }
        }
      }
    }

    // Find the end task with maximum distance
    let maxDistance = 0;
    let endTask: TaskId | null = null;

    for (const [taskId, distance] of distances) {
      if (distance > maxDistance) {
        maxDistance = distance;
        endTask = taskId;
      }
    }

    // Reconstruct critical path
    const criticalPath: TaskId[] = [];
    let current = endTask;

    while (current !== null) {
      criticalPath.unshift(current);
      current = predecessors.get(current) || null;
    }

    logger.debug('Critical path calculated', {
      path: criticalPath,
      duration: maxDistance
    });

    return criticalPath;
  }

  /**
   * Get all tasks that can be executed in parallel (no dependencies)
   */
  getParallelizableTasks(): TaskId[][] {
    logger.debug('Finding parallelizable task groups');

    const topOrder = this.getTopologicalOrder();
    if (!topOrder) {
      return [];
    }

    const parallelGroups: TaskId[][] = [];
    const processed = new Set<TaskId>();

    while (processed.size < topOrder.length) {
      const currentGroup: TaskId[] = [];

      for (const taskId of topOrder) {
        if (processed.has(taskId)) continue;

        const node = this.graph.nodes.get(taskId);
        if (!node) continue;

        // Check if all dependencies are satisfied
        const allDependenciesMet = node.dependencies.every(depId => processed.has(depId));

        if (allDependenciesMet) {
          currentGroup.push(taskId);
        }
      }

      if (currentGroup.length === 0) {
        logger.warn('No more tasks can be processed - possible circular dependency');
        break;
      }

      parallelGroups.push(currentGroup);
      currentGroup.forEach(taskId => processed.add(taskId));
    }

    logger.debug('Parallel groups identified', {
      groupCount: parallelGroups.length,
      groups: parallelGroups.map(group => group.length),
    });

    return parallelGroups;
  }

  /**
   * Get dependency impact analysis for a task
   */
  getDependencyImpact(taskId: TaskId): {
    directDependents: TaskId[];
    indirectDependents: TaskId[];
    totalImpact: number;
    criticalPathImpact: boolean;
  } {
    const node = this.graph.nodes.get(taskId);
    if (!node) {
      return {
        directDependents: [],
        indirectDependents: [],
        totalImpact: 0,
        criticalPathImpact: false,
      };
    }

    const directDependents = [...node.dependents];
    const indirectDependents = new Set<TaskId>();
    const visited = new Set<TaskId>();

    // DFS to find all indirect dependents
    const dfs = (currentTaskId: TaskId) => {
      if (visited.has(currentTaskId)) return;
      visited.add(currentTaskId);

      const currentNode = this.graph.nodes.get(currentTaskId);
      if (currentNode) {
        for (const dependent of currentNode.dependents) {
          if (!directDependents.includes(dependent)) {
            indirectDependents.add(dependent);
          }
          dfs(dependent);
        }
      }
    };

    for (const dependent of directDependents) {
      dfs(dependent);
    }

    const criticalPath = this.calculateCriticalPath();
    const criticalPathImpact = criticalPath.includes(taskId);

    return {
      directDependents,
      indirectDependents: Array.from(indirectDependents),
      totalImpact: directDependents.length + indirectDependents.size,
      criticalPathImpact,
    };
  }

  /**
   * Get the current dependency graph
   */
  getGraph(): DependencyGraph {
    return { ...this.graph };
  }

  /**
   * Get graph statistics
   */
  getStatistics(): {
    nodeCount: number;
    edgeCount: number;
    hasCycles: boolean;
    avgDependencies: number;
    maxDepth: number;
    criticalPathLength: number;
    parallelGroups: number;
  } {
    const criticalPath = this.calculateCriticalPath();
    const parallelGroups = this.getParallelizableTasks();

    let totalDependencies = 0;
    for (const node of this.graph.nodes.values()) {
      totalDependencies += node.dependencies.length;
    }

    return {
      nodeCount: this.graph.metadata.nodeCount,
      edgeCount: this.graph.metadata.edgeCount,
      hasCycles: this.graph.metadata.hasCycles,
      avgDependencies: this.graph.metadata.nodeCount > 0 ? totalDependencies / this.graph.metadata.nodeCount : 0,
      maxDepth: this.calculateMaxDepth(),
      criticalPathLength: criticalPath.length,
      parallelGroups: parallelGroups.length,
    };
  }

  /**
   * Calculate maximum depth of the dependency graph
   */
  private calculateMaxDepth(): number {
    const visited = new Set<TaskId>();
    let maxDepth = 0;

    const dfs = (taskId: TaskId, depth: number): number => {
      if (visited.has(taskId)) return depth;
      visited.add(taskId);

      const node = this.graph.nodes.get(taskId);
      if (!node || node.dependencies.length === 0) {
        return depth;
      }

      let localMaxDepth = depth;
      for (const depId of node.dependencies) {
        const depthFromDep = dfs(depId, depth + 1);
        localMaxDepth = Math.max(localMaxDepth, depthFromDep);
      }

      return localMaxDepth;
    };

    // Find root nodes (no dependencies) and calculate depth from each
    for (const taskId of this.graph.nodes.keys()) {
      const node = this.graph.nodes.get(taskId);
      if (node && node.dependencies.length === 0) {
        const depth = dfs(taskId, 0);
        maxDepth = Math.max(maxDepth, depth);
      }
    }

    return maxDepth;
  }

  /**
   * Export graph to DOT format for visualization
   */
  exportToDot(): string {
    const lines = ['digraph Dependencies {'];
    lines.push('  rankdir=TB;');
    lines.push('  node [shape=box];');

    // Add nodes
    for (const [taskId, node] of this.graph.nodes) {
      const task = this.tasks.get(taskId);
      const label = task ? `${task.title}\\n(${task.status})` : taskId;
      const color = this.getNodeColor(task?.status || 'pending');
      lines.push(`  "${taskId}" [label="${label}", fillcolor="${color}", style=filled];`);
    }

    // Add edges
    for (const edge of this.graph.edges) {
      const style = this.getEdgeStyle(edge.type);
      const color = this.getEdgeColor(edge.type);
      lines.push(`  "${edge.dependsOnTaskId}" -> "${edge.dependentTaskId}" [style="${style}", color="${color}"];`);
    }

    lines.push('}');
    return lines.join('\n');
  }

  private getNodeColor(status: string): string {
    const colors = {
      'pending': 'lightgray',
      'ready': 'lightblue',
      'in_progress': 'yellow',
      'completed': 'lightgreen',
      'failed': 'lightcoral',
      'blocked': 'orange',
      'cancelled': 'lightgray',
    };
    return colors[status as keyof typeof colors] || 'white';
  }

  private getEdgeStyle(type: string): string {
    const styles = {
      'hard': 'solid',
      'soft': 'dashed',
      'resource': 'dotted',
      'temporal': 'bold',
    };
    return styles[type as keyof typeof styles] || 'solid';
  }

  private getEdgeColor(type: string): string {
    const colors = {
      'hard': 'black',
      'soft': 'gray',
      'resource': 'blue',
      'temporal': 'red',
    };
    return colors[type as keyof typeof colors] || 'black';
  }
}