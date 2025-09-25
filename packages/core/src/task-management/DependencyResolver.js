/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { EventEmitter } from 'node:events';
import { logger } from '../utils/logger.js';
/**
 * Dependency resolution strategy
 */
export let ResolutionStrategy = {};
(function (ResolutionStrategy) {
  ResolutionStrategy['STRICT'] = 'strict';
  ResolutionStrategy['BEST_EFFORT'] = 'best_effort';
  ResolutionStrategy['PARALLEL_OPTIMIZED'] = 'parallel_optimized';
})(ResolutionStrategy || (ResolutionStrategy = {}));
/**
 * Advanced dependency resolver with cycle detection and optimization
 */
export class DependencyResolver extends EventEmitter {
  dependencyGraph = new Map();
  taskDependencies = new Map();
  constructor() {
    super();
  }
  /**
   * Build dependency graph from tasks and dependencies
   */
  buildDependencyGraph(tasks, dependencies) {
    this.dependencyGraph.clear();
    this.taskDependencies.clear();
    // Create nodes for all tasks
    for (const [taskId, task] of tasks) {
      this.dependencyGraph.set(taskId, {
        taskId,
        task,
        dependencies: new Set(),
        dependents: new Set(),
        inDegree: 0,
        outDegree: 0,
        level: 0,
        criticalPath: false,
      });
    }
    // Group dependencies by task
    for (const dependency of dependencies.values()) {
      const deps = this.taskDependencies.get(dependency.dependentTaskId) || [];
      deps.push(dependency);
      this.taskDependencies.set(dependency.dependentTaskId, deps);
    }
    // Build edges
    for (const dependency of dependencies.values()) {
      const dependentNode = this.dependencyGraph.get(
        dependency.dependentTaskId,
      );
      const dependsOnNode = this.dependencyGraph.get(
        dependency.dependsOnTaskId,
      );
      if (dependentNode && dependsOnNode) {
        // Only add blocking dependencies to the graph structure
        if (dependency.type === 'blocks' || dependency.type === 'enables') {
          dependentNode.dependencies.add(dependency.dependsOnTaskId);
          dependentNode.inDegree++;
          dependsOnNode.dependents.add(dependency.dependentTaskId);
          dependsOnNode.outDegree++;
        }
      }
    }
    this.calculateExecutionLevels();
    this.identifyCriticalPath();
    logger.info('Dependency graph built', {
      totalNodes: this.dependencyGraph.size,
      totalEdges: dependencies.size,
    });
  }
  /**
   * Perform comprehensive dependency analysis
   */
  analyzeDependencies(strategy = ResolutionStrategy.STRICT) {
    const cycles = this.detectCycles();
    const hasCycles = cycles.length > 0;
    if (hasCycles && strategy === ResolutionStrategy.STRICT) {
      logger.warn('Circular dependencies detected in strict mode', { cycles });
    }
    const criticalPath = this.findCriticalPath();
    const executionLevels = this.getExecutionLevels();
    const parallelizableGroups = this.identifyParallelizableGroups();
    const blockedTasks = this.getBlockedTasks();
    const readyTasks = this.getReadyTasks();
    const totalLevels = Math.max(...Array.from(executionLevels.keys())) + 1;
    const estimatedDuration = this.calculateEstimatedDuration();
    const analysis = {
      hasCycles,
      cycles,
      criticalPath,
      executionLevels,
      parallelizableGroups,
      blockedTasks,
      readyTasks,
      totalLevels,
      estimatedDuration,
    };
    logger.info('Dependency analysis completed', {
      hasCycles,
      cycleCount: cycles.length,
      criticalPathLength: criticalPath.length,
      totalLevels,
      parallelGroups: parallelizableGroups.length,
      readyTasks: readyTasks.length,
      blockedTasks: blockedTasks.length,
    });
    this.emit('analysisCompleted', analysis);
    return analysis;
  }
  /**
   * Detect circular dependencies using DFS
   */
  detectCycles() {
    const cycles = [];
    const visitState = new Map();
    const path = [];
    // Initialize all nodes as white (unvisited)
    for (const taskId of this.dependencyGraph.keys()) {
      visitState.set(taskId, 'white');
    }
    const dfsVisit = (taskId) => {
      visitState.set(taskId, 'gray');
      path.push(taskId);
      const node = this.dependencyGraph.get(taskId);
      if (node) {
        for (const depId of node.dependencies) {
          const state = visitState.get(depId);
          if (state === 'gray') {
            // Found a cycle
            const cycleStart = path.indexOf(depId);
            const cycle = path.slice(cycleStart);
            cycle.push(depId); // Complete the cycle
            cycles.push(cycle);
            logger.warn(`Cycle detected: ${cycle.join(' -> ')}`);
          } else if (state === 'white') {
            dfsVisit(depId);
          }
        }
      }
      path.pop();
      visitState.set(taskId, 'black');
    };
    // Visit all white nodes
    for (const taskId of this.dependencyGraph.keys()) {
      if (visitState.get(taskId) === 'white') {
        dfsVisit(taskId);
      }
    }
    return cycles;
  }
  /**
   * Calculate execution levels using topological sorting
   */
  calculateExecutionLevels() {
    const inDegree = new Map();
    const queue = [];
    // Initialize in-degrees
    for (const [taskId, node] of this.dependencyGraph) {
      inDegree.set(taskId, node.inDegree);
      if (node.inDegree === 0) {
        queue.push(taskId);
        node.level = 0;
      }
    }
    let currentLevel = 0;
    while (queue.length > 0) {
      const levelSize = queue.length;
      currentLevel++;
      for (let i = 0; i < levelSize; i++) {
        const taskId = queue.shift();
        const node = this.dependencyGraph.get(taskId);
        for (const dependentId of node.dependents) {
          const currentInDegree = inDegree.get(dependentId) - 1;
          inDegree.set(dependentId, currentInDegree);
          if (currentInDegree === 0) {
            queue.push(dependentId);
            const dependentNode = this.dependencyGraph.get(dependentId);
            dependentNode.level = currentLevel;
          }
        }
      }
    }
  }
  /**
   * Identify the critical path (longest path in the dependency graph)
   */
  identifyCriticalPath() {
    let longestPath = [];
    let maxDuration = 0;
    const calculatePath = (taskId, visited, path, totalDuration) => {
      if (visited.has(taskId)) return; // Avoid infinite loops
      visited.add(taskId);
      path.push(taskId);
      const node = this.dependencyGraph.get(taskId);
      const currentDuration = totalDuration + node.task.estimatedDuration;
      // If this is a leaf node (no dependents), check if it's the longest path
      if (node.dependents.size === 0) {
        if (currentDuration > maxDuration) {
          maxDuration = currentDuration;
          longestPath = [...path];
        }
      } else {
        // Continue exploring dependent tasks
        for (const dependentId of node.dependents) {
          calculatePath(
            dependentId,
            new Set(visited),
            [...path],
            currentDuration,
          );
        }
      }
      visited.delete(taskId);
    };
    // Start from all root nodes (tasks with no dependencies)
    for (const [taskId, node] of this.dependencyGraph) {
      if (node.dependencies.size === 0) {
        calculatePath(taskId, new Set(), [], 0);
      }
    }
    // Mark critical path nodes
    for (const taskId of longestPath) {
      const node = this.dependencyGraph.get(taskId);
      if (node) {
        node.criticalPath = true;
      }
    }
    logger.info('Critical path identified', {
      path: longestPath,
      estimatedDuration: maxDuration,
    });
  }
  /**
   * Find the critical path
   */
  findCriticalPath() {
    const criticalTasks = [];
    for (const [taskId, node] of this.dependencyGraph) {
      if (node.criticalPath) {
        criticalTasks.push(taskId);
      }
    }
    return criticalTasks;
  }
  /**
   * Get execution levels as a map
   */
  getExecutionLevels() {
    const levels = new Map();
    for (const [taskId, node] of this.dependencyGraph) {
      const levelTasks = levels.get(node.level) || [];
      levelTasks.push(taskId);
      levels.set(node.level, levelTasks);
    }
    return levels;
  }
  /**
   * Identify groups of tasks that can run in parallel
   */
  identifyParallelizableGroups() {
    const groups = [];
    const executionLevels = this.getExecutionLevels();
    for (const [level, tasks] of executionLevels) {
      if (tasks.length > 1) {
        // Further subdivide by resource conflicts and other constraints
        const subGroups = this.subdivideByConstraints(tasks);
        groups.push(...subGroups);
      } else if (tasks.length === 1) {
        groups.push(tasks);
      }
    }
    return groups;
  }
  /**
   * Subdivide tasks by resource constraints and conflicts
   */
  subdivideByConstraints(tasks) {
    const groups = [];
    const ungrouped = [...tasks];
    while (ungrouped.length > 0) {
      const currentGroup = [ungrouped.shift()];
      const currentTask = this.dependencyGraph.get(currentGroup[0]).task;
      // Find compatible tasks
      for (let i = ungrouped.length - 1; i >= 0; i--) {
        const candidateTask = this.dependencyGraph.get(ungrouped[i]).task;
        if (this.areTasksCompatible(currentTask, candidateTask)) {
          currentGroup.push(ungrouped.splice(i, 1)[0]);
        }
      }
      groups.push(currentGroup);
    }
    return groups;
  }
  /**
   * Check if two tasks are compatible for parallel execution
   */
  areTasksCompatible(task1, task2) {
    // Check for resource conflicts
    const sharedResources = task1.requiredResources.filter((r) =>
      task2.requiredResources.includes(r),
    );
    if (sharedResources.length > 0) {
      return false; // Resource conflict
    }
    // Check for explicit conflicts in dependencies
    const task1Dependencies = this.taskDependencies.get(task1.id) || [];
    const task2Dependencies = this.taskDependencies.get(task2.id) || [];
    const hasConflict =
      task1Dependencies.some(
        (dep) =>
          (dep.dependsOnTaskId === task2.id ||
            dep.dependentTaskId === task2.id) &&
          dep.type === 'conflicts',
      ) ||
      task2Dependencies.some(
        (dep) =>
          (dep.dependsOnTaskId === task1.id ||
            dep.dependentTaskId === task1.id) &&
          dep.type === 'conflicts',
      );
    return !hasConflict;
  }
  /**
   * Get tasks that are currently blocked by dependencies
   */
  getBlockedTasks() {
    const blocked = [];
    for (const [taskId, node] of this.dependencyGraph) {
      if (node.task.status === 'pending' && node.dependencies.size > 0) {
        // Check if any dependencies are not completed
        const hasUncompletedDeps = Array.from(node.dependencies).some(
          (depId) => {
            const depNode = this.dependencyGraph.get(depId);
            return depNode?.task.status !== 'completed';
          },
        );
        if (hasUncompletedDeps) {
          blocked.push(taskId);
        }
      }
    }
    return blocked;
  }
  /**
   * Get tasks that are ready to execute (no blocking dependencies)
   */
  getReadyTasks() {
    const ready = [];
    for (const [taskId, node] of this.dependencyGraph) {
      if (node.task.status === 'pending') {
        // Check if all blocking dependencies are satisfied
        const hasBlockingDeps = Array.from(node.dependencies).some((depId) => {
          const depNode = this.dependencyGraph.get(depId);
          return depNode?.task.status !== 'completed';
        });
        if (!hasBlockingDeps) {
          ready.push(taskId);
        }
      }
    }
    // Sort by priority and level
    ready.sort((a, b) => {
      const nodeA = this.dependencyGraph.get(a);
      const nodeB = this.dependencyGraph.get(b);
      // First by level (earlier levels first)
      if (nodeA.level !== nodeB.level) {
        return nodeA.level - nodeB.level;
      }
      // Then by priority (higher priority first)
      return nodeB.task.dynamicPriority - nodeA.task.dynamicPriority;
    });
    return ready;
  }
  /**
   * Calculate estimated total duration considering parallelization
   */
  calculateEstimatedDuration() {
    const executionLevels = this.getExecutionLevels();
    let totalDuration = 0;
    for (const [level, tasks] of executionLevels) {
      // For each level, the duration is the maximum duration of tasks in that level
      // (since they can run in parallel)
      const levelDuration = Math.max(
        ...tasks.map(
          (taskId) => this.dependencyGraph.get(taskId).task.estimatedDuration,
        ),
      );
      totalDuration += levelDuration;
    }
    return totalDuration;
  }
  /**
   * Resolve dependency conflicts using various strategies
   */
  resolveDependencyConflicts(
    conflicts,
    strategy = ResolutionStrategy.BEST_EFFORT,
  ) {
    for (const cycle of conflicts) {
      switch (strategy) {
        case ResolutionStrategy.STRICT:
          logger.error(
            `Cannot resolve circular dependency in strict mode: ${cycle.join(' -> ')}`,
          );
          throw new Error(
            `Circular dependency detected: ${cycle.join(' -> ')}`,
          );
        case ResolutionStrategy.BEST_EFFORT:
          this.resolveConflictBestEffort(cycle);
          break;
        case ResolutionStrategy.PARALLEL_OPTIMIZED:
          this.resolveConflictParallelOptimized(cycle);
          break;
      default:
          // Handle unexpected values
          break;
    

      }
  }
  /**
   * Resolve conflict using best effort strategy
   */
  resolveConflictBestEffort(cycle) {
    // Remove the dependency with the lowest priority impact
    let minImpact = Infinity;
    let targetDependency = null;
    for (let i = 0; i < cycle.length - 1; i++) {
      const fromTaskId = cycle[i];
      const toTaskId = cycle[i + 1];
      const deps = this.taskDependencies.get(toTaskId) || [];
      const dependency = deps.find((d) => d.dependsOnTaskId === fromTaskId);
      if (dependency) {
        const fromTask = this.dependencyGraph.get(fromTaskId)?.task;
        const toTask = this.dependencyGraph.get(toTaskId)?.task;
        if (fromTask && toTask) {
          const impact = fromTask.priority + toTask.priority;
          if (impact < minImpact) {
            minImpact = impact;
            targetDependency = dependency;
          }
        }
      }
    }
    if (targetDependency) {
      this.removeDependency(targetDependency);
      logger.info(
        `Removed dependency to resolve cycle: ${targetDependency.dependsOnTaskId} -> ${targetDependency.dependentTaskId}`,
      );
    }
  }
  /**
   * Resolve conflict using parallel optimization strategy
   */
  resolveConflictParallelOptimized(cycle) {
    // Convert blocking dependencies to enabling dependencies where possible
    for (let i = 0; i < cycle.length - 1; i++) {
      const fromTaskId = cycle[i];
      const toTaskId = cycle[i + 1];
      const deps = this.taskDependencies.get(toTaskId) || [];
      const dependency = deps.find((d) => d.dependsOnTaskId === fromTaskId);
      if (dependency && dependency.type === 'blocks') {
        // Convert to enabling dependency if safe
        if (this.canConvertToEnabling(dependency)) {
          dependency.type = 'enables';
          dependency.isOptional = true;
          logger.info(
            `Converted blocking dependency to enabling: ${fromTaskId} -> ${toTaskId}`,
          );
        }
      }
    }
    // Rebuild the graph
    this.rebuildGraphAfterChanges();
  }
  /**
   * Check if a blocking dependency can be safely converted to enabling
   */
  canConvertToEnabling(dependency) {
    // Simple heuristic: if both tasks are in the same category and don't share resources
    const dependentNode = this.dependencyGraph.get(dependency.dependentTaskId);
    const dependsOnNode = this.dependencyGraph.get(dependency.dependsOnTaskId);
    if (dependentNode && dependsOnNode) {
      const sameCategory =
        dependentNode.task.category === dependsOnNode.task.category;
      const noResourceConflict = this.areTasksCompatible(
        dependentNode.task,
        dependsOnNode.task,
      );
      return sameCategory && noResourceConflict;
    }
    return false;
  }
  /**
   * Remove a dependency from the system
   */
  removeDependency(dependency) {
    // Remove from task dependencies
    const deps = this.taskDependencies.get(dependency.dependentTaskId) || [];
    const index = deps.indexOf(dependency);
    if (index > -1) {
      deps.splice(index, 1);
    }
    // Update graph nodes
    const dependentNode = this.dependencyGraph.get(dependency.dependentTaskId);
    const dependsOnNode = this.dependencyGraph.get(dependency.dependsOnTaskId);
    if (dependentNode) {
      dependentNode.dependencies.delete(dependency.dependsOnTaskId);
      dependentNode.inDegree--;
    }
    if (dependsOnNode) {
      dependsOnNode.dependents.delete(dependency.dependentTaskId);
      dependsOnNode.outDegree--;
    }
  }
  /**
   * Rebuild the dependency graph after changes
   */
  rebuildGraphAfterChanges() {
    this.calculateExecutionLevels();
    this.identifyCriticalPath();
    logger.info('Dependency graph rebuilt after conflict resolution');
    this.emit('graphRebuilt');
  }
  /**
   * Optimize execution order for maximum parallelization
   */
  optimizeExecutionOrder() {
    const executionOrder = [];
    const executionLevels = this.getExecutionLevels();
    // Sort levels by key (execution order)
    const sortedLevels = Array.from(executionLevels.entries()).sort(
      (a, b) => a[0] - b[0],
    );
    for (const [level, tasks] of sortedLevels) {
      // Within each level, sort by priority and critical path
      const sortedTasks = tasks.sort((a, b) => {
        const nodeA = this.dependencyGraph.get(a);
        const nodeB = this.dependencyGraph.get(b);
        // Critical path tasks first
        if (nodeA.criticalPath !== nodeB.criticalPath) {
          return nodeA.criticalPath ? -1 : 1;
        }
        // Then by priority
        return nodeB.task.dynamicPriority - nodeA.task.dynamicPriority;
      });
      executionOrder.push(...sortedTasks);
    }
    return executionOrder;
  }
  /**
   * Get dependency information for a specific task
   */
  getTaskDependencyInfo(taskId) {
    const node = this.dependencyGraph.get(taskId);
    if (!node) return null;
    const readyTasks = this.getReadyTasks();
    const blockedTasks = this.getBlockedTasks();
    return {
      dependencies: Array.from(node.dependencies),
      dependents: Array.from(node.dependents),
      level: node.level,
      isOnCriticalPath: node.criticalPath,
      isReady: readyTasks.includes(taskId),
      isBlocked: blockedTasks.includes(taskId),
    };
  }
  /**
   * Validate dependency integrity
   */
  validateDependencyIntegrity() {
    const issues = [];
    // Check for missing task references
    for (const [taskId, node] of this.dependencyGraph) {
      for (const depId of node.dependencies) {
        if (!this.dependencyGraph.has(depId)) {
          issues.push(`Task ${taskId} depends on non-existent task ${depId}`);
        }
      }
      for (const depId of node.dependents) {
        if (!this.dependencyGraph.has(depId)) {
          issues.push(`Task ${taskId} has non-existent dependent ${depId}`);
        }
      }
    }
    // Check for inconsistent references
    for (const [taskId, node] of this.dependencyGraph) {
      for (const depId of node.dependencies) {
        const depNode = this.dependencyGraph.get(depId);
        if (depNode && !depNode.dependents.has(taskId)) {
          issues.push(`Inconsistent dependency: ${taskId} -> ${depId}`);
        }
      }
    }
    return {
      isValid: issues.length === 0,
      issues,
    };
  }
  /**
   * Export dependency graph for visualization
   */
  exportGraph() {
    const nodes = Array.from(this.dependencyGraph.values()).map((node) => ({
      id: node.taskId,
      title: node.task.title,
      level: node.level,
      priority: node.task.priority,
      status: node.task.status,
      criticalPath: node.criticalPath,
    }));
    const edges = [];
    for (const deps of this.taskDependencies.values()) {
      for (const dep of deps) {
        edges.push({
          from: dep.dependsOnTaskId,
          to: dep.dependentTaskId,
          type: dep.type,
        });
      }
    }
    return { nodes, edges };
  }
  /**
   * Clear the dependency graph
   */
  clear() {
    this.dependencyGraph.clear();
    this.taskDependencies.clear();
    logger.info('Dependency resolver cleared');
    this.emit('cleared');
  }
}
//# sourceMappingURL=DependencyResolver.js.map
