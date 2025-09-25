/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Intelligent Task Dependency Analyzer
 * Advanced dependency management system for autonomous task orchestration
 *
 * === CORE CAPABILITIES ===
 * • Directed Acyclic Graph (DAG) modeling and management
 * • Circular dependency detection and resolution
 * • Intelligent task prerequisite validation and enforcement
 * • Parallel execution optimization for independent tasks
 * • Real-time dependency impact analysis and propagation
 * • Sophisticated dependency-based scheduling algorithms
 * • Dynamic dependency conflict resolution
 *
 * === ARCHITECTURE ===
 * The system uses a multi-layered approach:
 * 1. DependencyGraph: Core DAG data structure and algorithms
 * 2. CircularDependencyResolver: Detection and resolution of cycles
 * 3. PrerequisiteValidator: Ensures all dependencies are satisfied
 * 4. ParallelOptimizer: Identifies tasks that can run concurrently
 * 5. ImpactAnalyzer: Tracks dependency changes and propagates effects
 * 6. IntelligentScheduler: Optimizes execution order based on dependencies
 *
 * @author DEPENDENCY_ANALYST
 * @version 1.0.0
 * @since 2025-09-25
 */
import { EventEmitter } from 'node:events';
import { Logger } from '../../utils/logger.js';
/**
 * Task dependency relationship types
 */
export let DependencyType = {};
(function (DependencyType) {
  DependencyType['HARD'] = 'hard';
  DependencyType['SOFT'] = 'soft';
  DependencyType['RESOURCE'] = 'resource';
  DependencyType['DATA'] = 'data';
  DependencyType['CONDITIONAL'] = 'conditional';
})(DependencyType || (DependencyType = {}));
/**
 * Dependency status tracking
 */
export let DependencyStatus = {};
(function (DependencyStatus) {
  DependencyStatus['PENDING'] = 'pending';
  DependencyStatus['SATISFIED'] = 'satisfied';
  DependencyStatus['BLOCKED'] = 'blocked';
  DependencyStatus['FAILED'] = 'failed';
  DependencyStatus['SKIPPED'] = 'skipped';
})(DependencyStatus || (DependencyStatus = {}));
/**
 * Task execution readiness levels
 */
export let ExecutionReadiness = {};
(function (ExecutionReadiness) {
  ExecutionReadiness['READY'] = 'ready';
  ExecutionReadiness['CONDITIONALLY_READY'] = 'conditionally_ready';
  ExecutionReadiness['BLOCKED'] = 'blocked';
  ExecutionReadiness['WAITING_RESOURCES'] = 'waiting_resources';
  ExecutionReadiness['FAILED_DEPENDENCIES'] = 'failed_dependencies';
})(ExecutionReadiness || (ExecutionReadiness = {}));
/**
 * Core Dependency Graph Implementation
 */
class DependencyGraph {
  nodes;
  edges;
  adjacencyList;
  reverseAdjacencyList;
  logger;
  constructor() {
    this.nodes = new Map();
    this.edges = new Map();
    this.adjacencyList = new Map();
    this.reverseAdjacencyList = new Map();
    this.logger = new Logger('DependencyGraph');
  }
  /**
   * Add task node to dependency graph
   */
  addNode(node) {
    this.logger.debug(`Adding node to dependency graph: ${node.taskId}`, {
      name: node.name,
      type: node.type,
    });
    this.nodes.set(node.taskId, node);
    if (!this.adjacencyList.has(node.taskId)) {
      this.adjacencyList.set(node.taskId, new Set());
    }
    if (!this.reverseAdjacencyList.has(node.taskId)) {
      this.reverseAdjacencyList.set(node.taskId, new Set());
    }
  }
  /**
   * Add dependency edge between tasks
   */
  addDependency(dependency) {
    this.logger.debug(
      `Adding dependency: ${dependency.sourceTaskId} -> ${dependency.targetTaskId}`,
      {
        type: dependency.type,
        weight: dependency.weight,
      },
    );
    // Validate nodes exist
    if (!this.nodes.has(dependency.sourceTaskId)) {
      throw new Error(
        `Source task not found in graph: ${dependency.sourceTaskId}`,
      );
    }
    if (!this.nodes.has(dependency.targetTaskId)) {
      throw new Error(
        `Target task not found in graph: ${dependency.targetTaskId}`,
      );
    }
    // Check for self-dependency
    if (dependency.sourceTaskId === dependency.targetTaskId) {
      throw new Error(
        `Self-dependency not allowed: ${dependency.sourceTaskId}`,
      );
    }
    // Store dependency
    this.edges.set(dependency.id, dependency);
    // Update adjacency lists
    this.adjacencyList
      .get(dependency.sourceTaskId)
      .add(dependency.targetTaskId);
    this.reverseAdjacencyList
      .get(dependency.targetTaskId)
      .add(dependency.sourceTaskId);
    // Validate no cycles created
    if (this.hasCycle()) {
      // Rollback the addition
      this.edges.delete(dependency.id);
      this.adjacencyList
        .get(dependency.sourceTaskId)
        .delete(dependency.targetTaskId);
      this.reverseAdjacencyList
        .get(dependency.targetTaskId)
        .delete(dependency.sourceTaskId);
      throw new Error(
        `Adding dependency would create cycle: ${dependency.sourceTaskId} -> ${dependency.targetTaskId}`,
      );
    }
  }
  /**
   * Remove dependency from graph
   */
  removeDependency(dependencyId) {
    const dependency = this.edges.get(dependencyId);
    if (!dependency) {
      return false;
    }
    this.edges.delete(dependencyId);
    this.adjacencyList
      .get(dependency.sourceTaskId)
      ?.delete(dependency.targetTaskId);
    this.reverseAdjacencyList
      .get(dependency.targetTaskId)
      ?.delete(dependency.sourceTaskId);
    this.logger.debug(
      `Removed dependency: ${dependency.sourceTaskId} -> ${dependency.targetTaskId}`,
    );
    return true;
  }
  /**
   * Get all dependencies for a task
   */
  getTaskDependencies(taskId) {
    const incoming = [];
    const outgoing = [];
    for (const dependency of this.edges.values()) {
      if (dependency.targetTaskId === taskId) {
        incoming.push(dependency);
      }
      if (dependency.sourceTaskId === taskId) {
        outgoing.push(dependency);
      }
    }
    return { incoming, outgoing };
  }
  /**
   * Detect cycles in the dependency graph using DFS
   */
  hasCycle() {
    const visited = new Set();
    const recursionStack = new Set();
    const dfs = (nodeId) => {
      if (recursionStack.has(nodeId)) {
        return true; // Cycle detected
      }
      if (visited.has(nodeId)) {
        return false; // Already processed
      }
      visited.add(nodeId);
      recursionStack.add(nodeId);
      const neighbors = this.adjacencyList.get(nodeId) || new Set();
      for (const neighbor of neighbors) {
        if (dfs(neighbor)) {
          return true;
        }
      }
      recursionStack.delete(nodeId);
      return false;
    };
    // Check all nodes for cycles
    for (const nodeId of this.nodes.keys()) {
      if (!visited.has(nodeId)) {
        if (dfs(nodeId)) {
          return true;
        }
      }
    }
    return false;
  }
  /**
   * Find all cycles in the graph
   */
  findCycles() {
    const cycles = [];
    const visited = new Set();
    const recursionStack = new Set();
    const path = [];
    const dfs = (nodeId) => {
      if (recursionStack.has(nodeId)) {
        // Cycle detected - extract cycle from path
        const cycleStart = path.indexOf(nodeId);
        const cycle = path.slice(cycleStart).concat(nodeId);
        cycles.push(cycle);
        return;
      }
      if (visited.has(nodeId)) {
        return;
      }
      visited.add(nodeId);
      recursionStack.add(nodeId);
      path.push(nodeId);
      const neighbors = this.adjacencyList.get(nodeId) || new Set();
      for (const neighbor of neighbors) {
        dfs(neighbor);
      }
      recursionStack.delete(nodeId);
      path.pop();
    };
    // Find all cycles
    for (const nodeId of this.nodes.keys()) {
      visited.clear();
      recursionStack.clear();
      path.length = 0;
      dfs(nodeId);
    }
    return cycles;
  }
  /**
   * Perform topological sort to get execution order
   */
  topologicalSort() {
    const inDegree = new Map();
    const result = [];
    const queue = [];
    // Initialize in-degrees
    for (const nodeId of this.nodes.keys()) {
      inDegree.set(nodeId, this.reverseAdjacencyList.get(nodeId)?.size || 0);
    }
    // Find nodes with no incoming dependencies
    for (const [nodeId, degree] of inDegree) {
      if (degree === 0) {
        queue.push(nodeId);
      }
    }
    // Process nodes in topological order
    while (queue.length > 0) {
      const current = queue.shift();
      result.push(current);
      // Update in-degrees of dependent nodes
      const neighbors = this.adjacencyList.get(current) || new Set();
      for (const neighbor of neighbors) {
        const newDegree = (inDegree.get(neighbor) || 0) - 1;
        inDegree.set(neighbor, newDegree);
        if (newDegree === 0) {
          queue.push(neighbor);
        }
      }
    }
    // Verify all nodes processed (no cycles)
    if (result.length !== this.nodes.size) {
      throw new Error(
        'Cannot perform topological sort - graph contains cycles',
      );
    }
    return result;
  }
  /**
   * Find the critical path (longest path) through the graph
   */
  findCriticalPath() {
    const sortedNodes = this.topologicalSort();
    const distances = new Map();
    const predecessors = new Map();
    // Initialize distances
    for (const nodeId of this.nodes.keys()) {
      distances.set(nodeId, 0);
      predecessors.set(nodeId, null);
    }
    // Calculate longest distances
    for (const nodeId of sortedNodes) {
      const node = this.nodes.get(nodeId);
      const currentDistance = distances.get(nodeId);
      const neighbors = this.adjacencyList.get(nodeId) || new Set();
      for (const neighborId of neighbors) {
        const newDistance = currentDistance + node.estimatedDuration;
        if (newDistance > (distances.get(neighborId) || 0)) {
          distances.set(neighborId, newDistance);
          predecessors.set(neighborId, nodeId);
        }
      }
    }
    // Find the node with maximum distance
    let maxDistance = 0;
    let endNode = '';
    for (const [nodeId, distance] of distances) {
      if (distance > maxDistance) {
        maxDistance = distance;
        endNode = nodeId;
      }
    }
    // Reconstruct critical path
    const path = [];
    let current = endNode;
    while (current !== null) {
      path.unshift(current);
      current = predecessors.get(current) || null;
    }
    return { path, duration: maxDistance };
  }
  /**
   * Find tasks that can run in parallel
   */
  findParallelExecutionGroups() {
    const sortedNodes = this.topologicalSort();
    const levels = new Map();
    const groups = [];
    // Assign levels to nodes
    for (const nodeId of sortedNodes) {
      const dependencies = this.reverseAdjacencyList.get(nodeId) || new Set();
      let maxLevel = 0;
      for (const depId of dependencies) {
        maxLevel = Math.max(maxLevel, (levels.get(depId) || 0) + 1);
      }
      levels.set(nodeId, maxLevel);
    }
    // Group nodes by level
    const levelGroups = new Map();
    for (const [nodeId, level] of levels) {
      if (!levelGroups.has(level)) {
        levelGroups.set(level, []);
      }
      levelGroups.get(level).push(nodeId);
    }
    // Convert to array format
    const maxLevel = Math.max(...levels.values());
    for (let level = 0; level <= maxLevel; level++) {
      const group = levelGroups.get(level) || [];
      if (group.length > 0) {
        groups.push(group);
      }
    }
    return groups;
  }
  /**
   * Get graph statistics
   */
  getStatistics() {
    const nodeCount = this.nodes.size;
    const edgeCount = this.edges.size;
    const averageDegree = edgeCount > 0 ? (edgeCount * 2) / nodeCount : 0;
    const { duration: maxDepth } = this.findCriticalPath();
    const parallelGroups = this.findParallelExecutionGroups();
    const parallelizationFactor =
      nodeCount > 0 ? nodeCount / parallelGroups.length : 0;
    // Cyclomatic complexity: E - N + 2P (where P is number of connected components)
    const cyclomaticComplexity = edgeCount - nodeCount + 2;
    return {
      nodeCount,
      edgeCount,
      averageDegree,
      maxDepth,
      parallelizationFactor,
      cyclomaticComplexity,
    };
  }
  /**
   * Get all nodes
   */
  getNodes() {
    return new Map(this.nodes);
  }
  /**
   * Get all edges
   */
  getEdges() {
    return new Map(this.edges);
  }
  /**
   * Clear all nodes and edges
   */
  clear() {
    this.nodes.clear();
    this.edges.clear();
    this.adjacencyList.clear();
    this.reverseAdjacencyList.clear();
  }
}
/**
 * Intelligent Task Dependency Analyzer
 *
 * Primary orchestrator for all dependency analysis and management operations
 */
export class DependencyAnalyzer extends EventEmitter {
  logger;
  dependencyGraph;
  conflictRegistry;
  analysisCache;
  cacheTimeout = 300000; // 5 minutes
  constructor() {
    super();
    this.logger = new Logger('DependencyAnalyzer');
    this.dependencyGraph = new DependencyGraph();
    this.conflictRegistry = new Map();
    this.analysisCache = new Map();
    this.logger.info(
      'DependencyAnalyzer initialized with intelligent task sequencing capabilities',
    );
  }
  /**
   * Register a task in the dependency system
   */
  registerTask(task) {
    this.logger.info(`Registering task in dependency system: ${task.taskId}`, {
      name: task.name,
      type: task.type,
      priority: task.priority,
    });
    try {
      this.dependencyGraph.addNode(task);
      this._invalidateCache(task.taskId);
      this.emit('taskRegistered', task);
    } catch (error) {
      this.logger.error(`Failed to register task: ${task.taskId}`, { error });
      throw error;
    }
  }
  /**
   * Add dependency between tasks
   */
  addDependency(dependency) {
    this.logger.info(
      `Adding dependency: ${dependency.sourceTaskId} -> ${dependency.targetTaskId}`,
      {
        type: dependency.type,
        weight: dependency.weight,
      },
    );
    try {
      this.dependencyGraph.addDependency(dependency);
      this._invalidateCacheForAffectedTasks([
        dependency.sourceTaskId,
        dependency.targetTaskId,
      ]);
      this._detectAndResolveConflicts();
      this.emit('dependencyAdded', dependency);
    } catch (error) {
      this.logger.error(`Failed to add dependency: ${dependency.id}`, {
        error,
      });
      throw error;
    }
  }
  /**
   * Remove dependency between tasks
   */
  removeDependency(dependencyId) {
    this.logger.info(`Removing dependency: ${dependencyId}`);
    const dependency = this.dependencyGraph.getEdges().get(dependencyId);
    if (!dependency) {
      return false;
    }
    const result = this.dependencyGraph.removeDependency(dependencyId);
    if (result) {
      this._invalidateCacheForAffectedTasks([
        dependency.sourceTaskId,
        dependency.targetTaskId,
      ]);
      this.emit('dependencyRemoved', dependency);
    }
    return result;
  }
  /**
   * Analyze task dependencies and execution readiness
   */
  async analyzeTask(taskId) {
    // Check cache first
    const cached = this.analysisCache.get(taskId);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.result;
    }
    this.logger.debug(`Analyzing task dependencies: ${taskId}`);
    const taskNode = this.dependencyGraph.getNodes().get(taskId);
    if (!taskNode) {
      throw new Error(`Task not found in dependency graph: ${taskId}`);
    }
    const dependencies = this.dependencyGraph.getTaskDependencies(taskId);
    const readiness = this._calculateExecutionReadiness(
      taskId,
      dependencies.incoming,
    );
    const parallelCandidates = this._findParallelCandidates(taskId);
    const criticalPath = this._findCriticalPathForTask(taskId);
    const riskFactors = this._assessRiskFactors(taskId, dependencies);
    const recommendations = this._generateRecommendations(
      taskId,
      readiness,
      riskFactors,
    );
    const result = {
      taskId,
      readiness,
      blockedBy: dependencies.incoming.filter(
        (dep) => !this._isDependencySatisfied(dep),
      ),
      dependsOn: dependencies.incoming,
      enables: dependencies.outgoing,
      parallelCandidates,
      criticalPath,
      estimatedStartTime: this._estimateStartTime(taskId),
      riskFactors,
      recommendations,
    };
    // Cache result
    this.analysisCache.set(taskId, { result, timestamp: Date.now() });
    return result;
  }
  /**
   * Generate optimal execution schedule
   */
  generateOptimalSchedule(taskIds) {
    this.logger.info('Generating optimal execution schedule', {
      taskCount: taskIds?.length || this.dependencyGraph.getNodes().size,
    });
    const tasksToSchedule =
      taskIds || Array.from(this.dependencyGraph.getNodes().keys());
    const parallelGroups = this.dependencyGraph.findParallelExecutionGroups();
    const criticalPath = this.dependencyGraph.findCriticalPath();
    const statistics = this.dependencyGraph.getStatistics();
    // Filter groups to only include requested tasks
    const filteredGroups = parallelGroups
      .map((group) =>
        group.filter((taskId) => tasksToSchedule.includes(taskId)),
      )
      .filter((group) => group.length > 0);
    // Build execution plan
    const executionPlan = filteredGroups.map((tasks, index) => ({
      phase: index + 1,
      tasks,
      parallelGroups: this._optimizeParallelExecution(tasks),
      estimatedDuration: this._calculatePhaseDuration(tasks),
    }));
    const totalEstimatedDuration = executionPlan.reduce(
      (sum, phase) => sum + phase.estimatedDuration,
      0,
    );
    const bottlenecks = this._identifyBottlenecks(executionPlan);
    const optimizations = this._suggestOptimizations(
      executionPlan,
      bottlenecks,
    );
    const riskAssessment = this._assessScheduleRisks(executionPlan);
    return {
      executionPlan,
      criticalPath: criticalPath.path,
      totalEstimatedDuration,
      parallelizationFactor: statistics.parallelizationFactor,
      bottlenecks,
      optimizations,
      riskAssessment,
    };
  }
  /**
   * Detect and resolve dependency conflicts
   */
  detectConflicts() {
    this.logger.info('Detecting dependency conflicts');
    const conflicts = [];
    // Check for circular dependencies
    const cycles = this.dependencyGraph.findCycles();
    for (const cycle of cycles) {
      conflicts.push(this._createCircularDependencyConflict(cycle));
    }
    // Check for resource conflicts
    conflicts.push(...this._detectResourceConflicts());
    // Check for data flow conflicts
    conflicts.push(...this._detectDataFlowConflicts());
    // Update conflict registry
    for (const conflict of conflicts) {
      this.conflictRegistry.set(conflict.id, conflict);
    }
    return conflicts;
  }
  /**
   * Get dependency graph visualization data
   */
  getVisualizationData() {
    const nodes = Array.from(this.dependencyGraph.getNodes().values()).map(
      (node) => ({
        id: node.taskId,
        label: node.name,
        type: node.type,
        status: node.status,
        priority: node.priority,
      }),
    );
    const edges = Array.from(this.dependencyGraph.getEdges().values()).map(
      (edge) => ({
        id: edge.id,
        source: edge.sourceTaskId,
        target: edge.targetTaskId,
        type: edge.type,
        weight: edge.weight,
        status: this._getDependencyStatus(edge),
      }),
    );
    const statistics = this.dependencyGraph.getStatistics();
    return { nodes, edges, statistics };
  }
  /**
   * Get system health metrics
   */
  getHealthMetrics() {
    const statistics = this.dependencyGraph.getStatistics();
    const conflicts = Array.from(this.conflictRegistry.values());
    let graphHealth = 'healthy';
    const recommendations = [];
    // Assess health
    if (conflicts.some((c) => c.severity === 'critical')) {
      graphHealth = 'critical';
      recommendations.push(
        'Critical dependency conflicts detected - immediate resolution required',
      );
    } else if (statistics.parallelizationFactor < 2) {
      graphHealth = 'warning';
      recommendations.push(
        'Low parallelization efficiency - consider restructuring dependencies',
      );
    }
    const cyclicDependencies = this.dependencyGraph.findCycles().length;
    const bottleneckCount = this._countBottlenecks();
    return {
      graphHealth,
      conflictCount: conflicts.length,
      cyclicDependencies,
      bottleneckCount,
      parallelizationEfficiency: statistics.parallelizationFactor,
      recommendations,
    };
  }
  // =================== PRIVATE HELPER METHODS ===================
  _calculateExecutionReadiness(taskId, dependencies) {
    if (dependencies.length === 0) {
      return ExecutionReadiness.READY;
    }
    const hardDependencies = dependencies.filter(
      (dep) => dep.type === DependencyType.HARD,
    );
    const softDependencies = dependencies.filter(
      (dep) => dep.type === DependencyType.SOFT,
    );
    const resourceDependencies = dependencies.filter(
      (dep) => dep.type === DependencyType.RESOURCE,
    );
    // Check hard dependencies
    const unsatisfiedHard = hardDependencies.filter(
      (dep) => !this._isDependencySatisfied(dep),
    );
    if (unsatisfiedHard.length > 0) {
      const failedDeps = unsatisfiedHard.filter((dep) =>
        this._isDependencyFailed(dep),
      );
      if (failedDeps.length > 0) {
        return ExecutionReadiness.FAILED_DEPENDENCIES;
      }
      return ExecutionReadiness.BLOCKED;
    }
    // Check resource dependencies
    const unsatisfiedResource = resourceDependencies.filter(
      (dep) => !this._isDependencySatisfied(dep),
    );
    if (unsatisfiedResource.length > 0) {
      return ExecutionReadiness.WAITING_RESOURCES;
    }
    // Check soft dependencies
    const unsatisfiedSoft = softDependencies.filter(
      (dep) => !this._isDependencySatisfied(dep),
    );
    if (unsatisfiedSoft.length > 0) {
      return ExecutionReadiness.CONDITIONALLY_READY;
    }
    return ExecutionReadiness.READY;
  }
  _isDependencySatisfied(dependency) {
    // In a real implementation, this would check the actual task status
    // For now, we'll simulate based on task metadata
    const sourceNode = this.dependencyGraph
      .getNodes()
      .get(dependency.sourceTaskId);
    return (
      sourceNode?.status === 'completed' || sourceNode?.status === 'success'
    );
  }
  _isDependencyFailed(dependency) {
    const sourceNode = this.dependencyGraph
      .getNodes()
      .get(dependency.sourceTaskId);
    return sourceNode?.status === 'failed' || sourceNode?.status === 'error';
  }
  _findParallelCandidates(taskId) {
    const parallelGroups = this.dependencyGraph.findParallelExecutionGroups();
    for (const group of parallelGroups) {
      if (group.includes(taskId)) {
        return group.filter((id) => id !== taskId);
      }
    }
    return [];
  }
  _findCriticalPathForTask(taskId) {
    const criticalPath = this.dependencyGraph.findCriticalPath();
    if (criticalPath.path.includes(taskId)) {
      return criticalPath.path;
    }
    // Task is not on the main critical path, find the path to it
    // This is a simplified version - in practice, you'd want more sophisticated path finding
    return [taskId];
  }
  _estimateStartTime(taskId) {
    // Simplified estimation based on dependency chain
    // In practice, this would consider actual task durations and current system state
    const dependencies = this.dependencyGraph.getTaskDependencies(taskId);
    if (dependencies.incoming.length === 0) {
      return new Date(); // Can start immediately
    }
    // Estimate based on longest dependency chain
    return new Date(Date.now() + dependencies.incoming.length * 60000); // 1 minute per dependency
  }
  _assessRiskFactors(taskId, dependencies) {
    const risks = [];
    if (dependencies.incoming.length > 5) {
      risks.push('High dependency count increases execution risk');
    }
    if (dependencies.outgoing.length > 10) {
      risks.push('Task is a critical bottleneck for many dependent tasks');
    }
    const hardDependencies = dependencies.incoming.filter(
      (dep) => dep.type === DependencyType.HARD,
    );
    if (hardDependencies.length > 3) {
      risks.push('Multiple hard dependencies increase blocking risk');
    }
    return risks;
  }
  _generateRecommendations(taskId, readiness, risks) {
    const recommendations = [];
    if (readiness === ExecutionReadiness.BLOCKED) {
      recommendations.push(
        'Resolve blocking dependencies before attempting execution',
      );
    }
    if (readiness === ExecutionReadiness.WAITING_RESOURCES) {
      recommendations.push(
        'Coordinate resource allocation with dependent tasks',
      );
    }
    if (risks.length > 2) {
      recommendations.push(
        'Consider breaking down task into smaller, more manageable units',
      );
    }
    return recommendations;
  }
  _optimizeParallelExecution(tasks) {
    // Group tasks by resource requirements for optimal parallel execution
    const resourceGroups = new Map();
    for (const taskId of tasks) {
      const node = this.dependencyGraph.getNodes().get(taskId);
      if (!node) continue;
      const resourceKey = this._getResourceKey(node);
      if (!resourceGroups.has(resourceKey)) {
        resourceGroups.set(resourceKey, []);
      }
      resourceGroups.get(resourceKey).push(taskId);
    }
    return Array.from(resourceGroups.values());
  }
  _getResourceKey(node) {
    const reqs = node.resourceRequirements;
    return `cpu:${reqs.cpu || 1}-mem:${reqs.memory || 1}-concurrent:${reqs.concurrent || false}`;
  }
  _calculatePhaseDuration(tasks) {
    let maxDuration = 0;
    for (const taskId of tasks) {
      const node = this.dependencyGraph.getNodes().get(taskId);
      if (node) {
        maxDuration = Math.max(maxDuration, node.estimatedDuration);
      }
    }
    return maxDuration;
  }
  _identifyBottlenecks(executionPlan) {
    const bottlenecks = [];
    for (const phase of executionPlan) {
      if (phase.tasks.length === 1 && phase.estimatedDuration > 300000) {
        // 5 minutes
        bottlenecks.push(...phase.tasks);
      }
    }
    return bottlenecks;
  }
  _suggestOptimizations(executionPlan, bottlenecks) {
    const optimizations = [];
    if (bottlenecks.length > 0) {
      optimizations.push(
        `Consider parallelizing bottleneck tasks: ${bottlenecks.join(', ')}`,
      );
    }
    const totalPhases = executionPlan.length;
    if (totalPhases > 10) {
      optimizations.push(
        'High phase count detected - consider consolidating sequential tasks',
      );
    }
    return optimizations;
  }
  _assessScheduleRisks(executionPlan) {
    const high = [];
    const medium = [];
    const low = [];
    for (const phase of executionPlan) {
      if (phase.estimatedDuration > 600000) {
        // 10 minutes
        high.push(`Phase ${phase.phase} has high duration risk`);
      } else if (phase.estimatedDuration > 300000) {
        // 5 minutes
        medium.push(`Phase ${phase.phase} has medium duration risk`);
      } else {
        low.push(`Phase ${phase.phase} has low duration risk`);
      }
    }
    return { high, medium, low };
  }
  _createCircularDependencyConflict(cycle) {
    return {
      id: `circular-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'circular',
      affectedTasks: cycle,
      dependencies: this._getDependenciesInCycle(cycle),
      severity: 'critical',
      autoResolvable: false,
      suggestedResolutions: [
        {
          action: 'break_cycle',
          description: 'Remove one dependency to break the circular reference',
          impact: 'May affect task execution order',
          confidence: 0.8,
        },
      ],
      detectedAt: new Date(),
    };
  }
  _getDependenciesInCycle(cycle) {
    const dependencies = [];
    for (let i = 0; i < cycle.length - 1; i++) {
      const source = cycle[i];
      const target = cycle[i + 1];
      for (const dependency of this.dependencyGraph.getEdges().values()) {
        if (
          dependency.sourceTaskId === source &&
          dependency.targetTaskId === target
        ) {
          dependencies.push(dependency);
        }
      }
    }
    return dependencies;
  }
  _detectResourceConflicts() {
    // Placeholder for resource conflict detection
    return [];
  }
  _detectDataFlowConflicts() {
    // Placeholder for data flow conflict detection
    return [];
  }
  _getDependencyStatus(dependency) {
    if (this._isDependencySatisfied(dependency)) {
      return DependencyStatus.SATISFIED;
    } else if (this._isDependencyFailed(dependency)) {
      return DependencyStatus.FAILED;
    } else {
      return DependencyStatus.PENDING;
    }
  }
  _countBottlenecks() {
    // Simplified bottleneck detection
    let bottleneckCount = 0;
    for (const node of this.dependencyGraph.getNodes().values()) {
      const dependencies = this.dependencyGraph.getTaskDependencies(
        node.taskId,
      );
      if (dependencies.outgoing.length > 5) {
        bottleneckCount++;
      }
    }
    return bottleneckCount;
  }
  _invalidateCache(taskId) {
    this.analysisCache.delete(taskId);
  }
  _invalidateCacheForAffectedTasks(taskIds) {
    for (const taskId of taskIds) {
      this.analysisCache.delete(taskId);
      // Also invalidate cache for dependent tasks
      const dependencies = this.dependencyGraph.getTaskDependencies(taskId);
      for (const dep of dependencies.outgoing) {
        this.analysisCache.delete(dep.targetTaskId);
      }
    }
  }
  _detectAndResolveConflicts() {
    const conflicts = this.detectConflicts();
    if (conflicts.length > 0) {
      this.emit('conflictsDetected', conflicts);
      // Attempt automatic resolution for resolvable conflicts
      for (const conflict of conflicts) {
        if (conflict.autoResolvable) {
          this._attemptAutoResolve(conflict);
        }
      }
    }
  }
  _attemptAutoResolve(conflict) {
    this.logger.info(
      `Attempting automatic resolution of conflict: ${conflict.id}`,
      {
        type: conflict.type,
        severity: conflict.severity,
      },
    );
    // Implementation would depend on conflict type
    // For now, just emit an event
    this.emit('conflictAutoResolutionAttempted', conflict);
  }
  /**
   * Cleanup resources and prepare for shutdown
   */
  async shutdown() {
    this.logger.info('Shutting down DependencyAnalyzer...');
    this.dependencyGraph.clear();
    this.conflictRegistry.clear();
    this.analysisCache.clear();
    this.removeAllListeners();
    this.logger.info('DependencyAnalyzer shutdown complete');
  }
}
//# sourceMappingURL=DependencyAnalyzer.js.map
