/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type {
  TaskId,
  Task,
  TaskDependency,
  DependencyType,
  CircularDependency,
  ExecutionSequence,
  ExecutionPlan,
  TaskQueueConfig,
} from './types.js';
import { ResourceAllocation as _ResourceAllocation } from './types.js';
import { DependencyGraphManager } from './dependency-graph.js';
import { TaskSequencer } from './task-sequencer.js';
import { getComponentLogger } from '../utils/logger.js';

const logger = getComponentLogger('DependencyManager');

/**
 * Events emitted by the dependency manager
 */
export interface DependencyManagerEvents {
  'dependency-added': { dependency: TaskDependency };
  'dependency-removed': { dependentId: TaskId; dependsOnId: TaskId };
  'circular-dependency-detected': { cycles: CircularDependency[] };
  'circular-dependency-resolved': { resolvedCycles: CircularDependency[] };
  'execution-plan-generated': { plan: ExecutionPlan };
  'task-sequence-updated': { sequence: ExecutionSequence };
}

/**
 * Configuration for automatic dependency learning
 */
export interface AutoDependencyConfig {
  /** Enable automatic dependency detection */
  enabled: boolean;
  /** Minimum confidence threshold for auto-dependencies (0-1) */
  confidenceThreshold: number;
  /** Historical data window for learning (in days) */
  historicalWindow: number;
  /** Maximum number of dependencies to auto-suggest per task */
  maxSuggestions: number;
  /** Types of dependencies to learn automatically */
  learningTypes: DependencyType[];
}

/**
 * High-level dependency management API with intelligent features
 */
export class DependencyManager {
  private graph: DependencyGraphManager;
  private sequencer: TaskSequencer;
  private tasks: Map<TaskId, Task>;
  private config: TaskQueueConfig;
  private autoConfig: AutoDependencyConfig;
  private executionHistory: Map<
    TaskId,
    Array<{ startTime: Date; endTime: Date; success: boolean }>
  >;
  private dependencyLearningData: Map<string, number>; // pattern -> confidence score

  constructor(
    config: TaskQueueConfig,
    autoConfig?: Partial<AutoDependencyConfig>,
  ) {
    this.graph = new DependencyGraphManager();
    this.sequencer = new TaskSequencer(this.graph, config);
    this.tasks = new Map();
    this.config = config;
    this.executionHistory = new Map();
    this.dependencyLearningData = new Map();

    this.autoConfig = {
      enabled: false,
      confidenceThreshold: 0.7,
      historicalWindow: 30,
      maxSuggestions: 5,
      learningTypes: ['soft', 'temporal'],
      ...autoConfig,
    };

    logger.info('Dependency manager initialized', {
      autoDependencyLearning: this.autoConfig.enabled,
      schedulingAlgorithm: config.schedulingAlgorithm,
    });
  }

  /**
   * Add a task to the dependency management system
   */
  addTask(task: Task): void {
    logger.debug('Adding task to dependency management system', {
      taskId: task.id,
      title: task.title,
      category: task.category,
      priority: task.priority,
    });

    this.tasks.set(task.id, task);
    this.graph.addTask(task);

    // Auto-suggest dependencies if enabled
    if (this.autoConfig.enabled) {
      this.suggestAutoDependencies(task);
    }
  }

  /**
   * Remove a task from the dependency management system
   */
  removeTask(taskId: TaskId): void {
    logger.debug('Removing task from dependency management system', { taskId });

    this.tasks.delete(taskId);
    this.graph.removeTask(taskId);
    this.executionHistory.delete(taskId);
  }

  /**
   * Add a dependency relationship between tasks
   */
  addDependency(
    dependentTaskId: TaskId,
    dependsOnTaskId: TaskId,
    type: DependencyType = 'hard',
    options?: {
      reason?: string;
      parallelizable?: boolean;
      minDelay?: number;
    },
  ): void {
    const dependency: TaskDependency = {
      dependentTaskId,
      dependsOnTaskId,
      type,
      reason: options?.reason,
      parallelizable: options?.parallelizable,
      minDelay: options?.minDelay,
    };

    logger.debug('Adding dependency relationship', dependency);

    // Validate tasks exist
    if (!this.tasks.has(dependentTaskId)) {
      throw new Error(`Dependent task ${dependentTaskId} not found`);
    }
    if (!this.tasks.has(dependsOnTaskId)) {
      throw new Error(`Dependency task ${dependsOnTaskId} not found`);
    }

    // Check for immediate circular dependency
    if (this.wouldCreateCircularDependency(dependentTaskId, dependsOnTaskId)) {
      const message = `Adding dependency ${dependsOnTaskId} -> ${dependentTaskId} would create circular dependency`;
      logger.warn(message);
      throw new Error(message);
    }

    this.graph.addDependency(dependency);

    // Update learning data if this is a manual addition
    this.updateDependencyLearning(dependentTaskId, dependsOnTaskId, type);
  }

  /**
   * Remove a dependency relationship
   */
  removeDependency(dependentTaskId: TaskId, dependsOnTaskId: TaskId): void {
    logger.debug('Removing dependency relationship', {
      dependentTaskId,
      dependsOnTaskId,
    });
    this.graph.removeDependency(dependentTaskId, dependsOnTaskId);
  }

  /**
   * Get all dependencies for a task
   */
  getTaskDependencies(taskId: TaskId): TaskDependency[] {
    const node = this.graph.getGraph().nodes.get(taskId);
    return node?.dependencyRelations || [];
  }

  /**
   * Get all tasks that depend on a given task
   */
  getTaskDependents(taskId: TaskId): TaskId[] {
    const node = this.graph.getGraph().nodes.get(taskId);
    return node?.dependents || [];
  }

  /**
   * Check if adding a dependency would create a circular dependency
   */
  wouldCreateCircularDependency(
    dependentTaskId: TaskId,
    dependsOnTaskId: TaskId,
  ): boolean {
    // Check if dependsOnTaskId transitively depends on dependentTaskId
    const visited = new Set<TaskId>();
    const stack: TaskId[] = [dependsOnTaskId];

    while (stack.length > 0) {
      const currentTaskId = stack.pop()!;
      if (visited.has(currentTaskId)) continue;
      visited.add(currentTaskId);

      if (currentTaskId === dependentTaskId) {
        return true; // Found circular dependency
      }

      const node = this.graph.getGraph().nodes.get(currentTaskId);
      if (node) {
        stack.push(...node.dependencies);
      }
    }

    return false;
  }

  /**
   * Detect all circular dependencies in the current graph
   */
  detectCircularDependencies(): CircularDependency[] {
    return this.graph.detectCircularDependencies();
  }

  /**
   * Resolve circular dependencies automatically
   */
  resolveCircularDependencies(strategy?: 'automatic' | 'interactive'): {
    resolved: CircularDependency[];
    unresolved: CircularDependency[];
  } {
    const cycles = this.graph.detectCircularDependencies();
    if (cycles.length === 0) {
      return { resolved: [], unresolved: [] };
    }

    logger.info('Resolving circular dependencies', {
      cycleCount: cycles.length,
      strategy: strategy || 'automatic',
    });

    const resolved: CircularDependency[] = [];
    const unresolved: CircularDependency[] = [];

    for (const cycle of cycles) {
      if (this.attemptCycleResolution(cycle, strategy === 'interactive')) {
        resolved.push(cycle);
      } else {
        unresolved.push(cycle);
      }
    }

    logger.info('Circular dependency resolution completed', {
      resolved: resolved.length,
      unresolved: unresolved.length,
    });

    return { resolved, unresolved };
  }

  /**
   * Attempt to resolve a single circular dependency
   */
  private attemptCycleResolution(
    cycle: CircularDependency,
    interactive: boolean,
  ): boolean {
    // Sort resolution strategies by impact (low impact first)
    const sortedStrategies = [...cycle.resolutionStrategies].sort((a, b) => {
      const impactOrder = { low: 0, medium: 1, high: 2 };
      return impactOrder[a.impact] - impactOrder[b.impact];
    });

    for (const strategy of sortedStrategies) {
      try {
        if (interactive) {
          // In interactive mode, we would prompt the user
          // For now, we'll skip high-impact strategies
          if (strategy.impact === 'high') continue;
        }

        switch (strategy.strategy) {
          case 'remove_edge':
            if (strategy.edges && strategy.edges.length > 0) {
              const edge = strategy.edges[0];
              this.graph.removeDependency(
                edge.dependentTaskId,
                edge.dependsOnTaskId,
              );
              logger.info('Resolved circular dependency by removing edge', {
                dependent: edge.dependentTaskId,
                dependsOn: edge.dependsOnTaskId,
                type: edge.type,
              });
              return true;
            }
            break;

          case 'split_task':
            if (strategy.tasks && strategy.tasks.length > 0) {
              // Task splitting would require additional implementation
              // For now, we'll log the recommendation
              logger.info('Circular dependency requires task splitting', {
                taskId: strategy.tasks[0],
                description: strategy.description,
              });
              // Return false to indicate manual intervention needed
              return false;
            }
            break;

          case 'reorder':
            // Reordering might involve changing temporal dependencies to soft ones
            if (strategy.edges) {
              for (const edge of strategy.edges) {
                if (edge.type === 'temporal') {
                  this.graph.removeDependency(
                    edge.dependentTaskId,
                    edge.dependsOnTaskId,
                  );
                  this.graph.addDependency({
                    ...edge,
                    type: 'soft',
                    reason:
                      'Converted from temporal to resolve circular dependency',
                  });
                }
              }
              logger.info(
                'Resolved circular dependency by converting temporal to soft dependencies',
              );
              return true;
            }
            break;

          case 'merge_tasks':
            // Task merging would require additional implementation
            logger.info('Circular dependency suggests task merging', {
              description: strategy.description,
            });
            return false;
          default:
            // Handle unexpected values
            break;
        }
      } catch (error) {
        logger.warn('Failed to apply resolution strategy', {
          strategy: strategy.strategy,
          error: error instanceof Error ? error : new Error(String(error)),
        });
      }
    }

    return false;
  }

  /**
   * Generate optimal execution sequence for all tasks
   */
  generateExecutionSequence(
    algorithm?: 'priority' | 'dependency_aware' | 'resource_optimal' | 'hybrid',
  ): ExecutionSequence {
    logger.debug('Generating execution sequence for all tasks', {
      taskCount: this.tasks.size,
      algorithm: algorithm || this.config.schedulingAlgorithm,
    });

    const selectedAlgorithm = algorithm || this.config.schedulingAlgorithm;
    return this.sequencer.generateExecutionSequence(
      this.tasks,
      selectedAlgorithm,
    );
  }

  /**
   * Generate execution sequence for a subset of tasks
   */
  generateExecutionSequenceForTasks(
    taskIds: TaskId[],
    algorithm?: 'priority' | 'dependency_aware' | 'resource_optimal' | 'hybrid',
  ): ExecutionSequence {
    const filteredTasks = new Map<TaskId, Task>();
    for (const taskId of taskIds) {
      const task = this.tasks.get(taskId);
      if (task) {
        filteredTasks.set(taskId, task);
      }
    }

    logger.debug('Generating execution sequence for task subset', {
      requestedCount: taskIds.length,
      foundCount: filteredTasks.size,
      algorithm: algorithm || this.config.schedulingAlgorithm,
    });

    const selectedAlgorithm = algorithm || this.config.schedulingAlgorithm;
    return this.sequencer.generateExecutionSequence(
      filteredTasks,
      selectedAlgorithm,
    );
  }

  /**
   * Generate comprehensive execution plan with dependency resolution
   */
  generateExecutionPlan(taskIds?: TaskId[]): ExecutionPlan {
    logger.debug('Generating comprehensive execution plan');

    const tasks = taskIds
      ? new Map(
          taskIds
            .map((id) => [id, this.tasks.get(id)])
            .filter(([, task]) => task) as Array<[TaskId, Task]>,
        )
      : this.tasks;

    // Detect and resolve circular dependencies
    const circularDependencies = this.graph.detectCircularDependencies();
    let resolutionActions: ExecutionPlan['dependencyResolution']['resolutionActions'] =
      [];

    if (circularDependencies.length > 0) {
      const { resolved } = this.resolveCircularDependencies('automatic');
      resolutionActions = resolved.flatMap((cycle) =>
        cycle.resolutionStrategies
          .filter((strategy) => strategy.impact !== 'high')
          .map((strategy) => ({
            type:
              strategy.strategy === 'remove_edge'
                ? ('remove_dependency' as const)
                : strategy.strategy === 'split_task'
                  ? ('split_task' as const)
                  : ('merge_tasks' as const),
            taskIds: strategy.tasks || [],
            dependencies: strategy.edges || [],
            reason: strategy.description,
          })),
      );
    }

    // Generate execution sequence
    const sequence = this.sequencer.generateExecutionSequence(tasks);

    // Generate resource allocations
    const resourceAllocations = this.sequencer.generateResourceAllocations(
      sequence,
      tasks,
    );

    const plan: ExecutionPlan = {
      sequence,
      resourceAllocations,
      dependencyResolution: {
        circularDependencies,
        resolutionActions,
      },
      metadata: {
        generatedAt: new Date(),
        algorithm: this.config.schedulingAlgorithm,
        constraints: [
          'dependency_ordering',
          'resource_limits',
          'priority_preferences',
        ],
        assumptions: [
          'task_duration_estimates_accurate',
          'resource_requirements_fixed',
          'no_external_dependencies',
        ],
        riskFactors: [
          ...(circularDependencies.length > 0
            ? ['circular_dependencies_detected']
            : []),
          'task_duration_variance',
          'resource_contention',
        ],
      },
    };

    logger.info('Execution plan generated', {
      sequenceLength: sequence.sequence.length,
      parallelGroups: sequence.parallelGroups.length,
      criticalPathLength: sequence.criticalPath.length,
      estimatedDuration: sequence.estimatedDuration,
      circularDependencies: circularDependencies.length,
    });

    return plan;
  }

  /**
   * Get dependency impact analysis for a task
   */
  getDependencyImpact(taskId: TaskId): {
    directDependents: TaskId[];
    indirectDependents: TaskId[];
    totalImpact: number;
    criticalPathImpact: boolean;
    riskAssessment: 'low' | 'medium' | 'high';
  } {
    const impact = this.graph.getDependencyImpact(taskId);

    // Calculate risk assessment
    let riskAssessment: 'low' | 'medium' | 'high' = 'low';
    if (impact.criticalPathImpact) {
      riskAssessment = 'high';
    } else if (impact.totalImpact > 5) {
      riskAssessment = 'medium';
    }

    return {
      ...impact,
      riskAssessment,
    };
  }

  /**
   * Suggest automatic dependencies for a task based on learning
   */
  private suggestAutoDependencies(task: Task): TaskDependency[] {
    if (!this.autoConfig.enabled) return [];

    const suggestions: TaskDependency[] = [];
    const taskPattern = this.generateTaskPattern(task);

    // Find similar tasks that might create dependencies
    for (const [otherTaskId, otherTask] of this.tasks) {
      if (otherTaskId === task.id) continue;

      const otherPattern = this.generateTaskPattern(otherTask);
      const confidence = this.calculatePatternSimilarity(
        taskPattern,
        otherPattern,
      );

      if (confidence >= this.autoConfig.confidenceThreshold) {
        const dependencyKey = `${otherPattern}->${taskPattern}`;
        const learningScore =
          this.dependencyLearningData.get(dependencyKey) || 0;

        if (learningScore >= this.autoConfig.confidenceThreshold) {
          suggestions.push({
            dependentTaskId: task.id,
            dependsOnTaskId: otherTaskId,
            type: 'soft', // Auto-suggestions are always soft initially
            reason: `Auto-suggested based on pattern similarity (confidence: ${confidence.toFixed(2)})`,
            parallelizable: true,
          });
        }
      }

      if (suggestions.length >= this.autoConfig.maxSuggestions) break;
    }

    logger.debug('Auto-dependency suggestions generated', {
      taskId: task.id,
      suggestionCount: suggestions.length,
    });

    return suggestions;
  }

  /**
   * Generate a pattern string for a task
   */
  private generateTaskPattern(task: Task): string {
    const parts = [
      task.category,
      task.priority,
      task.title.toLowerCase().replace(/\s+/g, '_').substring(0, 20),
    ];

    return parts.join(':');
  }

  /**
   * Calculate similarity between two task patterns
   */
  private calculatePatternSimilarity(
    pattern1: string,
    pattern2: string,
  ): number {
    const parts1 = pattern1.split(':');
    const parts2 = pattern2.split(':');

    let similarityScore = 0;
    const maxScore = 3;

    // Category similarity
    if (parts1[0] === parts2[0]) similarityScore += 1;

    // Priority similarity
    const priorities = ['low', 'medium', 'high', 'critical'];
    const priority1Index = priorities.indexOf(parts1[1]);
    const priority2Index = priorities.indexOf(parts2[1]);
    if (Math.abs(priority1Index - priority2Index) <= 1) similarityScore += 0.5;

    // Title similarity (simple keyword matching)
    const title1Words = parts1[2].split('_');
    const title2Words = parts2[2].split('_');
    const commonWords = title1Words.filter((word) =>
      title2Words.includes(word),
    );
    if (commonWords.length > 0) {
      similarityScore += Math.min(
        commonWords.length / Math.max(title1Words.length, title2Words.length),
        1.5,
      );
    }

    return similarityScore / maxScore;
  }

  /**
   * Update dependency learning data based on execution patterns
   */
  private updateDependencyLearning(
    dependentTaskId: TaskId,
    dependsOnTaskId: TaskId,
    type: DependencyType,
  ): void {
    const dependentTask = this.tasks.get(dependentTaskId);
    const dependsOnTask = this.tasks.get(dependsOnTaskId);

    if (dependentTask && dependsOnTask) {
      const dependentPattern = this.generateTaskPattern(dependentTask);
      const dependsOnPattern = this.generateTaskPattern(dependsOnTask);
      const dependencyKey = `${dependsOnPattern}->${dependentPattern}`;

      const currentScore = this.dependencyLearningData.get(dependencyKey) || 0;
      const increment = type === 'hard' ? 0.3 : 0.1; // Hard dependencies get more weight
      this.dependencyLearningData.set(
        dependencyKey,
        Math.min(currentScore + increment, 1.0),
      );

      logger.debug('Updated dependency learning data', {
        key: dependencyKey,
        score: this.dependencyLearningData.get(dependencyKey),
        type,
      });
    }
  }

  /**
   * Record task execution for learning
   */
  recordTaskExecution(
    taskId: TaskId,
    startTime: Date,
    endTime: Date,
    success: boolean,
  ): void {
    const history = this.executionHistory.get(taskId) || [];
    history.push({ startTime, endTime, success });

    // Keep only recent history within the configured window
    const cutoffDate = new Date(
      Date.now() - this.autoConfig.historicalWindow * 24 * 60 * 60 * 1000,
    );
    const recentHistory = history.filter(
      (record) => record.startTime >= cutoffDate,
    );

    this.executionHistory.set(taskId, recentHistory);

    logger.debug('Recorded task execution', {
      taskId,
      duration: endTime.getTime() - startTime.getTime(),
      success,
      historySize: recentHistory.length,
    });
  }

  /**
   * Get execution statistics for a task
   */
  getTaskExecutionStats(taskId: TaskId): {
    executionCount: number;
    successRate: number;
    averageDuration: number;
    lastExecution?: Date;
  } {
    const history = this.executionHistory.get(taskId) || [];

    if (history.length === 0) {
      return {
        executionCount: 0,
        successRate: 0,
        averageDuration: 0,
      };
    }

    const successCount = history.filter((record) => record.success).length;
    const totalDuration = history.reduce(
      (sum, record) =>
        sum + (record.endTime.getTime() - record.startTime.getTime()),
      0,
    );

    return {
      executionCount: history.length,
      successRate: successCount / history.length,
      averageDuration: totalDuration / history.length,
      lastExecution: history[history.length - 1]?.endTime,
    };
  }

  /**
   * Export dependency graph visualization
   */
  exportDependencyVisualization(): string {
    return this.graph.exportToDot();
  }

  /**
   * Get comprehensive dependency statistics
   */
  getDependencyStatistics(): {
    totalTasks: number;
    totalDependencies: number;
    circularDependencies: number;
    averageDependenciesPerTask: number;
    criticalPathLength: number;
    maxParallelization: number;
    riskMetrics: {
      highRiskTasks: number;
      blockedTasks: number;
      singlePointsOfFailure: number;
    };
  } {
    const graphStats = this.graph.getStatistics();
    const circularDeps = this.graph.detectCircularDependencies();

    // Calculate risk metrics
    let highRiskTasks = 0;
    let blockedTasks = 0;
    let singlePointsOfFailure = 0;

    for (const taskId of this.tasks.keys()) {
      const impact = this.getDependencyImpact(taskId);

      if (impact.riskAssessment === 'high') {
        highRiskTasks++;
      }

      if (impact.criticalPathImpact) {
        singlePointsOfFailure++;
      }

      const task = this.tasks.get(taskId);
      if (task?.status === 'blocked') {
        blockedTasks++;
      }
    }

    return {
      totalTasks: graphStats.nodeCount,
      totalDependencies: graphStats.edgeCount,
      circularDependencies: circularDeps.length,
      averageDependenciesPerTask: graphStats.avgDependencies,
      criticalPathLength: graphStats.criticalPathLength,
      maxParallelization: Math.max(
        ...this.graph.getParallelizableTasks().map((group) => group.length),
      ),
      riskMetrics: {
        highRiskTasks,
        blockedTasks,
        singlePointsOfFailure,
      },
    };
  }

  /**
   * Update configuration
   */
  updateConfiguration(config: Partial<TaskQueueConfig>): void {
    this.config = { ...this.config, ...config };
    this.sequencer.updateResourcePools(
      config.resourcePools || this.config.resourcePools,
    );

    logger.info('Configuration updated', {
      updatedFields: Object.keys(config),
    });
  }

  /**
   * Update auto-dependency configuration
   */
  updateAutoDependencyConfiguration(
    config: Partial<AutoDependencyConfig>,
  ): void {
    this.autoConfig = { ...this.autoConfig, ...config };

    logger.info('Auto-dependency configuration updated', {
      enabled: this.autoConfig.enabled,
      confidenceThreshold: this.autoConfig.confidenceThreshold,
    });
  }
}
