/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { z } from 'zod';
import type {
  TaskId,
  Task,
  TaskDependency,
  ResourceConstraint,
  ExecutionSequence,
} from '../task-management/types.js';
import type { Decision, DecisionContext } from './types.js';
import { DecisionType, DecisionPriority } from './types.js';
import {
  DependencyAnalyzer,
  type DependencyAnalysisResult,
} from './DependencyAnalyzer.js';
import { DecisionDependencyGraphManager } from './DependencyGraph.js';
import { getComponentLogger } from '../utils/logger.js';

const logger = getComponentLogger('ParallelOptimizer');

/**
 * Parallel execution strategies
 */
export enum ParallelStrategy {
  MAX_PARALLELISM = 'max_parallelism',
  RESOURCE_BALANCED = 'resource_balanced',
  DEPENDENCY_AWARE = 'dependency_aware',
  PRIORITY_GROUPED = 'priority_grouped',
  ADAPTIVE_DYNAMIC = 'adaptive_dynamic',
  MACHINE_LEARNING = 'machine_learning',
}

/**
 * Resource pool configuration for parallel execution
 */
export interface ResourcePool {
  /** Resource type identifier */
  name: string;
  /** Total capacity available */
  capacity: number;
  /** Currently allocated amount */
  allocated: number;
  /** Resource tags for categorization */
  tags: string[];
  /** Whether this resource is shareable */
  shareable: boolean;
  /** Cost per unit of resource */
  costPerUnit?: number;
  /** Priority multiplier for this resource */
  priorityMultiplier: number;
}

/**
 * Parallel execution configuration
 */
export interface ParallelOptimizationConfig {
  /** Primary optimization strategy */
  strategy: ParallelStrategy;
  /** Maximum number of concurrent tasks */
  maxConcurrency: number;
  /** Resource pools available for allocation */
  resourcePools: Map<string, ResourcePool>;
  /** Enable dynamic rebalancing during execution */
  enableDynamicRebalancing: boolean;
  /** Resource utilization target (0-1) */
  targetResourceUtilization: number;
  /** Minimum task duration for parallelization (ms) */
  minTaskDurationForParallelization: number;
  /** Enable predictive resource allocation */
  enablePredictiveAllocation: boolean;
  /** Learning rate for adaptive strategies */
  learningRate: number;
}

/**
 * Parallel execution group with resource allocation
 */
export interface ParallelExecutionGroup {
  /** Group identifier */
  id: string;
  /** Tasks in this parallel group */
  tasks: TaskId[];
  /** Resource allocations for this group */
  resourceAllocations: Map<string, number>;
  /** Estimated execution time for the group */
  estimatedDuration: number;
  /** Priority level of the group */
  priority: number;
  /** Dependencies this group satisfies */
  satisfiesDependencies: TaskDependency[];
  /** Confidence in the parallel execution plan */
  confidence: number;
  /** Risk factors for this group */
  risks: string[];
}

/**
 * Parallel optimization result
 */
export interface ParallelOptimizationResult {
  /** Optimized execution groups */
  executionGroups: ParallelExecutionGroup[];
  /** Resource allocation plan */
  resourcePlan: Map<
    string,
    Array<{
      taskId: TaskId;
      amount: number;
      startTime: number;
      duration: number;
    }>
  >;
  /** Performance projections */
  projections: {
    totalExecutionTime: number;
    resourceUtilization: Map<string, number>;
    parallelizationFactor: number;
    costOptimization: number;
  };
  /** Optimization recommendations */
  recommendations: OptimizationRecommendation[];
  /** Alternative parallelization strategies */
  alternatives: Array<{
    strategy: ParallelStrategy;
    groups: ParallelExecutionGroup[];
    score: number;
    tradeoffs: string[];
  }>;
}

/**
 * Optimization recommendation
 */
export interface OptimizationRecommendation {
  /** Type of recommendation */
  type:
    | 'resource_adjustment'
    | 'task_reordering'
    | 'dependency_modification'
    | 'strategy_change';
  /** Description of the recommendation */
  description: string;
  /** Expected impact */
  impact: {
    timeImprovement: number; // milliseconds
    resourceEfficiency: number; // 0-1
    riskReduction: number; // 0-1
  };
  /** Implementation complexity */
  complexity: 'low' | 'medium' | 'high';
  /** Priority for implementation */
  priority: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Resource contention analysis
 */
interface ResourceContention {
  resourceType: string;
  conflictingTasks: TaskId[];
  severity: number; // 0-1
  resolutionOptions: Array<{
    type: 'sequence' | 'split_resource' | 'upgrade_capacity';
    description: string;
    cost: number;
  }>;
}

/**
 * Historical performance data for learning
 */
interface ParallelExecutionHistory {
  groupId: string;
  tasks: TaskId[];
  resourcesUsed: Map<string, number>;
  actualDuration: number;
  estimatedDuration: number;
  efficiency: number;
  success: boolean;
  bottlenecks: string[];
  timestamp: number;
}

/**
 * Advanced parallel execution optimizer with intelligent resource allocation
 */
export class ParallelOptimizer {
  private config: ParallelOptimizationConfig;
  private dependencyAnalyzer: DependencyAnalyzer;
  private dependencyGraph: DecisionDependencyGraph;
  private executionHistory: Map<string, ParallelExecutionHistory>;
  private learningModel: Map<string, number>;
  private resourcePredictions: Map<string, number>;

  constructor(
    config: Partial<ParallelOptimizationConfig> = {},
    dependencyAnalyzer?: DependencyAnalyzer,
    dependencyGraph?: DecisionDependencyGraph,
  ) {
    this.config = {
      strategy: ParallelStrategy.ADAPTIVE_DYNAMIC,
      maxConcurrency: 8,
      resourcePools: new Map([
        [
          'cpu',
          {
            name: 'cpu',
            capacity: 8,
            allocated: 0,
            tags: ['compute'],
            shareable: true,
            priorityMultiplier: 1.0,
          },
        ],
        [
          'memory',
          {
            name: 'memory',
            capacity: 16384,
            allocated: 0,
            tags: ['storage'],
            shareable: true,
            priorityMultiplier: 0.8,
          },
        ],
        [
          'network',
          {
            name: 'network',
            capacity: 4,
            allocated: 0,
            tags: ['io'],
            shareable: false,
            priorityMultiplier: 0.6,
          },
        ],
        [
          'disk',
          {
            name: 'disk',
            capacity: 2,
            allocated: 0,
            tags: ['io'],
            shareable: false,
            priorityMultiplier: 0.4,
          },
        ],
      ]),
      enableDynamicRebalancing: true,
      targetResourceUtilization: 0.85,
      minTaskDurationForParallelization: 10000, // 10 seconds
      enablePredictiveAllocation: true,
      learningRate: 0.1,
      ...config,
    };

    this.dependencyAnalyzer = dependencyAnalyzer || new DependencyAnalyzer();
    this.dependencyGraph =
      dependencyGraph || new DecisionDependencyGraphManager();
    this.executionHistory = new Map();
    this.learningModel = new Map();
    this.resourcePredictions = new Map();
  }

  /**
   * Optimize parallel execution for a set of tasks
   */
  async optimizeParallelExecution(
    tasks: Map<TaskId, Task>,
    dependencies: TaskDependency[] = [],
    context?: DecisionContext,
  ): Promise<Decision> {
    logger.info('Starting parallel execution optimization', {
      taskCount: tasks.size,
      strategy: this.config.strategy,
      maxConcurrency: this.config.maxConcurrency,
    });

    const startTime = Date.now();

    // Step 1: Analyze dependencies
    const dependencyAnalysis =
      await this.dependencyAnalyzer.analyzeDependencies(
        tasks,
        dependencies,
        context,
      );

    // Step 2: Analyze resource contentions
    const resourceContentions = this.analyzeResourceContentions(
      tasks,
      dependencyAnalysis,
    );

    // Step 3: Generate parallel execution groups
    const optimizationResult = await this.generateOptimalParallelGroups(
      tasks,
      dependencyAnalysis,
      resourceContentions,
      context,
    );

    // Step 4: Validate the optimization
    const validation = this.validateOptimization(
      optimizationResult,
      tasks,
      dependencyAnalysis,
    );

    // Step 5: Generate alternative strategies
    const alternatives = await this.generateAlternativeStrategies(
      tasks,
      dependencyAnalysis,
      resourceContentions,
      context,
    );

    // Step 6: Create decision
    const decision: Decision = {
      id: `parallel_opt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      type: DecisionType.RESOURCE_ALLOCATION,
      choice: `Use ${this.config.strategy} strategy for parallel execution with ${optimizationResult.executionGroups.length} groups`,
      priority: DecisionPriority.HIGH,
      confidence: this.calculateOptimizationConfidence(
        optimizationResult,
        validation,
      ),
      reasoning: this.generateOptimizationReasoning(
        optimizationResult,
        alternatives,
      ),
      evidence: {
        optimizationResult,
        resourceContentions,
        validation,
        analysisTime: Date.now() - startTime,
      },
      expectedOutcome: {
        successProbability:
          optimizationResult.projections.parallelizationFactor,
        estimatedDuration: optimizationResult.projections.totalExecutionTime,
        requiredResources: Array.from(this.config.resourcePools.keys()),
      },
      context: context || this.createDefaultContext(),
      requiresApproval: false,
      alternatives: alternatives.map((alt) => ({
        choice: `Use ${alt.strategy} strategy`,
        score: alt.score,
        reasoning: `Alternative approach: ${alt.tradeoffs.join(', ')}`,
      })),
    };

    // Update learning model
    if (this.config.enablePredictiveAllocation) {
      this.updatePredictiveModel(tasks, optimizationResult);
    }

    logger.info('Parallel optimization complete', {
      executionGroups: optimizationResult.executionGroups.length,
      parallelizationFactor:
        optimizationResult.projections.parallelizationFactor,
      totalTime: Date.now() - startTime,
      confidence: decision.confidence,
    });

    return decision;
  }

  /**
   * Analyze resource contentions between tasks
   */
  private analyzeResourceContentions(
    tasks: Map<TaskId, Task>,
    dependencyAnalysis: DependencyAnalysisResult,
  ): ResourceContention[] {
    logger.debug('Analyzing resource contentions');

    const contentions: ResourceContention[] = [];
    const resourceUsage = new Map<string, TaskId[]>();

    // Group tasks by resource requirements
    for (const [taskId, task] of Array.from(tasks.entries())) {
      const resourceRequirements = this.extractResourceRequirements(task);

      for (const [resourceType, amount] of Array.from(
        resourceRequirements.entries(),
      )) {
        if (!resourceUsage.has(resourceType)) {
          resourceUsage.set(resourceType, []);
        }
        resourceUsage.get(resourceType)!.push(taskId);
      }
    }

    // Identify contentions
    for (const [resourceType, taskIds] of Array.from(resourceUsage.entries())) {
      if (taskIds.length > 1) {
        const pool = this.config.resourcePools.get(resourceType);
        if (pool && !pool.shareable) {
          // Resource contention for exclusive resources
          const totalDemand = this.calculateTotalResourceDemand(
            taskIds,
            tasks,
            resourceType,
          );
          const severity = Math.min(totalDemand / pool.capacity, 1);

          contentions.push({
            resourceType,
            conflictingTasks: taskIds,
            severity,
            resolutionOptions: [
              {
                type: 'sequence',
                description: `Execute tasks sequentially to avoid contention`,
                cost: totalDemand * 0.5, // Time cost
              },
              {
                type: 'split_resource',
                description: `Allocate resource in time slices`,
                cost: totalDemand * 0.3,
              },
              {
                type: 'upgrade_capacity',
                description: `Increase ${resourceType} capacity`,
                cost: (pool.costPerUnit || 100) * (totalDemand - pool.capacity),
              },
            ],
          });
        }
      }
    }

    return contentions.sort((a, b) => b.severity - a.severity);
  }

  /**
   * Generate optimal parallel execution groups
   */
  private async generateOptimalParallelGroups(
    tasks: Map<TaskId, Task>,
    dependencyAnalysis: DependencyAnalysisResult,
    resourceContentions: ResourceContention[],
    context?: DecisionContext,
  ): Promise<ParallelOptimizationResult> {
    logger.debug('Generating optimal parallel groups');

    switch (this.config.strategy) {
      case ParallelStrategy.MAX_PARALLELISM:
        return this.generateMaxParallelismGroups(tasks, dependencyAnalysis);

      case ParallelStrategy.RESOURCE_BALANCED:
        return this.generateResourceBalancedGroups(
          tasks,
          dependencyAnalysis,
          resourceContentions,
        );

      case ParallelStrategy.DEPENDENCY_AWARE:
        return this.generateDependencyAwareGroups(tasks, dependencyAnalysis);

      case ParallelStrategy.PRIORITY_GROUPED:
        return this.generatePriorityGroupedGroups(tasks, dependencyAnalysis);

      case ParallelStrategy.ADAPTIVE_DYNAMIC:
        return this.generateAdaptiveDynamicGroups(
          tasks,
          dependencyAnalysis,
          resourceContentions,
          context,
        );

      case ParallelStrategy.MACHINE_LEARNING:
        return this.generateMLBasedGroups(
          tasks,
          dependencyAnalysis,
          resourceContentions,
        );

      default:
        logger.warn(
          `Unknown strategy ${this.config.strategy}, falling back to adaptive`,
        );
        return this.generateAdaptiveDynamicGroups(
          tasks,
          dependencyAnalysis,
          resourceContentions,
          context,
        );
    }
  }

  /**
   * Generate maximum parallelism groups
   */
  private async generateMaxParallelismGroups(
    tasks: Map<TaskId, Task>,
    dependencyAnalysis: DependencyAnalysisResult,
  ): Promise<ParallelOptimizationResult> {
    const groups: ParallelExecutionGroup[] = [];
    const processedTasks = new Set<TaskId>();
    let groupCounter = 0;

    while (processedTasks.size < tasks.size) {
      const availableTasks = Array.from(tasks.keys()).filter((taskId) => {
        if (processedTasks.has(taskId)) return false;

        // Check if all dependencies are satisfied
        const taskDependencies = dependencyAnalysis.suggestedDependencies
          .filter((dep) => dep.dependentTaskId === taskId)
          .map((dep) => dep.dependsOnTaskId);

        return taskDependencies.every((depId) => processedTasks.has(depId));
      });

      if (availableTasks.length === 0) break;

      // Take as many tasks as possible up to max concurrency
      const groupTasks = availableTasks.slice(0, this.config.maxConcurrency);
      const resourceAllocations = this.allocateResourcesForGroup(
        groupTasks,
        tasks,
      );
      const estimatedDuration = this.calculateGroupDuration(groupTasks, tasks);

      groups.push({
        id: `group_${groupCounter++}`,
        tasks: groupTasks,
        resourceAllocations,
        estimatedDuration,
        priority: this.calculateGroupPriority(groupTasks, tasks),
        satisfiesDependencies: this.findSatisfiedDependencies(
          groupTasks,
          dependencyAnalysis,
        ),
        confidence: 0.8, // High confidence for max parallelism
        risks: this.assessGroupRisks(groupTasks, tasks, resourceAllocations),
      });

      groupTasks.forEach((taskId) => processedTasks.add(taskId));
    }

    return this.buildOptimizationResult(groups, tasks);
  }

  /**
   * Generate resource-balanced groups
   */
  private async generateResourceBalancedGroups(
    tasks: Map<TaskId, Task>,
    dependencyAnalysis: DependencyAnalysisResult,
    resourceContentions: ResourceContention[],
  ): Promise<ParallelOptimizationResult> {
    const groups: ParallelExecutionGroup[] = [];
    const processedTasks = new Set<TaskId>();
    let groupCounter = 0;

    while (processedTasks.size < tasks.size) {
      const availableTasks = Array.from(tasks.keys()).filter((taskId) => {
        if (processedTasks.has(taskId)) return false;
        const taskDeps = dependencyAnalysis.suggestedDependencies
          .filter((dep) => dep.dependentTaskId === taskId)
          .map((dep) => dep.dependsOnTaskId);
        return taskDeps.every((depId) => processedTasks.has(depId));
      });

      if (availableTasks.length === 0) break;

      // Select tasks that balance resource usage
      const groupTasks = this.selectResourceBalancedTasks(
        availableTasks,
        tasks,
      );
      const resourceAllocations = this.allocateResourcesForGroup(
        groupTasks,
        tasks,
      );
      const estimatedDuration = this.calculateGroupDuration(groupTasks, tasks);

      groups.push({
        id: `group_${groupCounter++}`,
        tasks: groupTasks,
        resourceAllocations,
        estimatedDuration,
        priority: this.calculateGroupPriority(groupTasks, tasks),
        satisfiesDependencies: this.findSatisfiedDependencies(
          groupTasks,
          dependencyAnalysis,
        ),
        confidence: 0.85, // High confidence for balanced approach
        risks: this.assessGroupRisks(groupTasks, tasks, resourceAllocations),
      });

      groupTasks.forEach((taskId) => processedTasks.add(taskId));
    }

    return this.buildOptimizationResult(groups, tasks);
  }

  /**
   * Generate dependency-aware groups
   */
  private async generateDependencyAwareGroups(
    tasks: Map<TaskId, Task>,
    dependencyAnalysis: DependencyAnalysisResult,
  ): Promise<ParallelOptimizationResult> {
    const groups: ParallelExecutionGroup[] = [];

    // Build dependency layers
    const dependencyLayers = this.buildDependencyLayers(
      tasks,
      dependencyAnalysis.suggestedDependencies,
    );

    for (
      let layerIndex = 0;
      layerIndex < dependencyLayers.length;
      layerIndex++
    ) {
      const layer = dependencyLayers[layerIndex];

      // Group tasks in this layer by resource compatibility
      const resourceGroups = this.groupTasksByResourceCompatibility(
        layer,
        tasks,
      );

      for (
        let groupIndex = 0;
        groupIndex < resourceGroups.length;
        groupIndex++
      ) {
        const groupTasks = resourceGroups[groupIndex];
        const resourceAllocations = this.allocateResourcesForGroup(
          groupTasks,
          tasks,
        );
        const estimatedDuration = this.calculateGroupDuration(
          groupTasks,
          tasks,
        );

        groups.push({
          id: `layer_${layerIndex}_group_${groupIndex}`,
          tasks: groupTasks,
          resourceAllocations,
          estimatedDuration,
          priority: this.calculateGroupPriority(groupTasks, tasks),
          satisfiesDependencies: this.findSatisfiedDependencies(
            groupTasks,
            dependencyAnalysis,
          ),
          confidence: 0.9, // Very high confidence due to dependency respect
          risks: this.assessGroupRisks(groupTasks, tasks, resourceAllocations),
        });
      }
    }

    return this.buildOptimizationResult(groups, tasks);
  }

  /**
   * Generate priority-grouped groups
   */
  private async generatePriorityGroupedGroups(
    tasks: Map<TaskId, Task>,
    dependencyAnalysis: DependencyAnalysisResult,
  ): Promise<ParallelOptimizationResult> {
    const groups: ParallelExecutionGroup[] = [];

    // Group tasks by priority level
    const priorityGroups = new Map<string, TaskId[]>();
    for (const [taskId, task] of Array.from(tasks.entries())) {
      const priority = String(task.priority);
      if (!priorityGroups.has(priority)) {
        priorityGroups.set(priority, []);
      }
      priorityGroups.get(priority)!.push(taskId);
    }

    // Process in priority order - using string literals that match Map keys
    const priorityOrder: string[] = ['critical', 'high', 'medium', 'low'];
    let groupCounter = 0;

    for (const priority of priorityOrder) {
      const taskIds = priorityGroups.get(priority) || [];
      if (taskIds.length === 0) continue;

      // Respect dependencies within priority level
      const processedInPriority = new Set<TaskId>();

      while (processedInPriority.size < taskIds.length) {
        const availableTasks = taskIds.filter((taskId) => {
          if (processedInPriority.has(taskId)) return false;
          const taskDeps = dependencyAnalysis.suggestedDependencies
            .filter(
              (dep) =>
                dep.dependentTaskId === taskId &&
                taskIds.includes(dep.dependsOnTaskId),
            )
            .map((dep) => dep.dependsOnTaskId);
          return taskDeps.every((depId) => processedInPriority.has(depId));
        });

        if (availableTasks.length === 0) break;

        const groupTasks = availableTasks.slice(0, this.config.maxConcurrency);
        const resourceAllocations = this.allocateResourcesForGroup(
          groupTasks,
          tasks,
        );
        const estimatedDuration = this.calculateGroupDuration(
          groupTasks,
          tasks,
        );

        groups.push({
          id: `priority_${priority}_group_${groupCounter++}`,
          tasks: groupTasks,
          resourceAllocations,
          estimatedDuration,
          priority: this.calculateGroupPriority(groupTasks, tasks),
          satisfiesDependencies: this.findSatisfiedDependencies(
            groupTasks,
            dependencyAnalysis,
          ),
          confidence: 0.75, // Good confidence for priority grouping
          risks: this.assessGroupRisks(groupTasks, tasks, resourceAllocations),
        });

        groupTasks.forEach((taskId) => processedInPriority.add(taskId));
      }
    }

    return this.buildOptimizationResult(groups, tasks);
  }

  /**
   * Generate adaptive dynamic groups
   */
  private async generateAdaptiveDynamicGroups(
    tasks: Map<TaskId, Task>,
    dependencyAnalysis: DependencyAnalysisResult,
    resourceContentions: ResourceContention[],
    context?: DecisionContext,
  ): Promise<ParallelOptimizationResult> {
    // Combine multiple strategies based on context
    const strategies = [
      { strategy: ParallelStrategy.DEPENDENCY_AWARE, weight: 0.4 },
      { strategy: ParallelStrategy.RESOURCE_BALANCED, weight: 0.3 },
      { strategy: ParallelStrategy.PRIORITY_GROUPED, weight: 0.2 },
      { strategy: ParallelStrategy.MAX_PARALLELISM, weight: 0.1 },
    ];

    // Adjust weights based on context
    if (context) {
      if (context.systemLoad.cpu > 0.8) {
        strategies.find(
          (s) => s.strategy === ParallelStrategy.RESOURCE_BALANCED,
        )!.weight = 0.5;
      }
      if (context.taskQueueState.pendingTasks > 20) {
        strategies.find(
          (s) => s.strategy === ParallelStrategy.MAX_PARALLELISM,
        )!.weight = 0.3;
      }
    }

    // Generate groups using weighted combination
    const allResults: ParallelOptimizationResult[] = [];

    for (const { strategy, weight } of strategies) {
      const originalStrategy = this.config.strategy;
      this.config.strategy = strategy;

      try {
        const result = await this.generateOptimalParallelGroups(
          tasks,
          dependencyAnalysis,
          resourceContentions,
          context,
        );
        allResults.push(result);
      } catch (error) {
        logger.warn(`Failed to generate groups with strategy ${strategy}`, {
          error,
        });
      }

      this.config.strategy = originalStrategy;
    }

    // Merge results intelligently
    return this.mergeOptimizationResults(allResults, strategies);
  }

  /**
   * Generate ML-based groups using historical data
   */
  private async generateMLBasedGroups(
    tasks: Map<TaskId, Task>,
    dependencyAnalysis: DependencyAnalysisResult,
    resourceContentions: ResourceContention[],
  ): Promise<ParallelOptimizationResult> {
    if (this.executionHistory.size < 5) {
      logger.warn(
        'Insufficient historical data for ML, falling back to adaptive',
      );
      return this.generateAdaptiveDynamicGroups(
        tasks,
        dependencyAnalysis,
        resourceContentions,
      );
    }

    // Use ML model to predict optimal grouping
    const predictedGroups = this.predictOptimalGrouping(
      tasks,
      dependencyAnalysis,
    );

    const groups: ParallelExecutionGroup[] = [];
    for (let i = 0; i < predictedGroups.length; i++) {
      const groupTasks = predictedGroups[i];
      const resourceAllocations = this.allocateResourcesForGroup(
        groupTasks,
        tasks,
      );
      const estimatedDuration = this.calculateGroupDuration(groupTasks, tasks);

      groups.push({
        id: `ml_group_${i}`,
        tasks: groupTasks,
        resourceAllocations,
        estimatedDuration,
        priority: this.calculateGroupPriority(groupTasks, tasks),
        satisfiesDependencies: this.findSatisfiedDependencies(
          groupTasks,
          dependencyAnalysis,
        ),
        confidence: this.predictGroupConfidence(groupTasks),
        risks: this.assessGroupRisks(groupTasks, tasks, resourceAllocations),
      });
    }

    return this.buildOptimizationResult(groups, tasks);
  }

  // Helper methods (simplified implementations)

  private extractResourceRequirements(task: Task): Map<string, number> {
    const requirements = new Map<string, number>();

    if (task.executionContext?.resourceConstraints) {
      for (const constraint of task.executionContext.resourceConstraints) {
        requirements.set(constraint.resourceType, constraint.maxUnits);
      }
    } else {
      // Default requirements based on task category
      const defaults: Record<string, Array<[string, number]>> = {
        implementation: [
          ['cpu', 2],
          ['memory', 1024],
        ],
        testing: [
          ['cpu', 1],
          ['memory', 512],
        ],
        documentation: [
          ['cpu', 1],
          ['memory', 256],
        ],
        analysis: [
          ['cpu', 3],
          ['memory', 2048],
        ],
        refactoring: [
          ['cpu', 2],
          ['memory', 1024],
        ],
        deployment: [
          ['cpu', 1],
          ['memory', 512],
          ['network', 1],
        ],
      };

      const taskDefaults = defaults[task.category] || [
        ['cpu', 1],
        ['memory', 512],
      ];
      for (const [resourceType, amount] of Array.from(taskDefaults.entries())) {
        requirements.set(resourceType, amount);
      }
    }

    return requirements;
  }

  private calculateTotalResourceDemand(
    taskIds: TaskId[],
    tasks: Map<TaskId, Task>,
    resourceType: string,
  ): number {
    let total = 0;
    for (const taskId of taskIds) {
      const task = tasks.get(taskId);
      if (task) {
        const requirements = this.extractResourceRequirements(task);
        total += requirements.get(resourceType) || 0;
      }
    }
    return total;
  }

  private selectResourceBalancedTasks(
    availableTasks: TaskId[],
    tasks: Map<TaskId, Task>,
  ): TaskId[] {
    // Simple resource balancing - select tasks that don't exceed resource limits
    const selected: TaskId[] = [];
    const resourceUsage = new Map<string, number>();

    for (const [resourceType, pool] of Array.from(
      this.config.resourcePools.entries(),
    )) {
      resourceUsage.set(resourceType, 0);
    }

    for (const taskId of availableTasks) {
      if (selected.length >= this.config.maxConcurrency) break;

      const task = tasks.get(taskId);
      if (!task) continue;

      const requirements = this.extractResourceRequirements(task);
      let canAdd = true;

      // Check if adding this task would exceed any resource limits
      for (const [resourceType, required] of requirements) {
        const pool = this.config.resourcePools.get(resourceType);
        if (pool) {
          const currentUsage = resourceUsage.get(resourceType) || 0;
          if (
            currentUsage + required >
            pool.capacity * this.config.targetResourceUtilization
          ) {
            canAdd = false;
            break;
          }
        }
      }

      if (canAdd) {
        selected.push(taskId);
        for (const [resourceType, required] of Array.from(
          requirements.entries(),
        )) {
          const currentUsage = resourceUsage.get(resourceType) || 0;
          resourceUsage.set(resourceType, currentUsage + required);
        }
      }
    }

    return selected;
  }

  private buildDependencyLayers(
    tasks: Map<TaskId, Task>,
    dependencies: TaskDependency[],
  ): TaskId[][] {
    const layers: TaskId[][] = [];
    const processed = new Set<TaskId>();
    const taskIds = Array.from(tasks.keys());

    while (processed.size < taskIds.length) {
      const currentLayer: TaskId[] = [];

      for (const taskId of taskIds) {
        if (processed.has(taskId)) continue;

        // Check if all dependencies are in previous layers
        const taskDeps = dependencies
          .filter((dep) => dep.dependentTaskId === taskId)
          .map((dep) => dep.dependsOnTaskId);

        const allDepsSatisfied = taskDeps.every((depId) =>
          processed.has(depId),
        );

        if (allDepsSatisfied) {
          currentLayer.push(taskId);
        }
      }

      if (currentLayer.length === 0) break; // Avoid infinite loop

      layers.push(currentLayer);
      currentLayer.forEach((taskId) => processed.add(taskId));
    }

    return layers;
  }

  private groupTasksByResourceCompatibility(
    taskIds: TaskId[],
    tasks: Map<TaskId, Task>,
  ): TaskId[][] {
    const groups: TaskId[][] = [];
    const processed = new Set<TaskId>();

    while (processed.size < taskIds.length) {
      const currentGroup: TaskId[] = [];
      const resourceUsage = new Map<string, number>();

      for (const [resourceType, pool] of Array.from(
        this.config.resourcePools.entries(),
      )) {
        resourceUsage.set(resourceType, 0);
      }

      for (const taskId of taskIds) {
        if (processed.has(taskId)) continue;
        if (currentGroup.length >= this.config.maxConcurrency) break;

        const task = tasks.get(taskId);
        if (!task) continue;

        const requirements = this.extractResourceRequirements(task);
        let compatible = true;

        for (const [resourceType, required] of Array.from(
          requirements.entries(),
        )) {
          const pool = this.config.resourcePools.get(resourceType);
          if (pool) {
            const currentUsage = resourceUsage.get(resourceType) || 0;
            if (
              currentUsage + required >
              pool.capacity * this.config.targetResourceUtilization
            ) {
              compatible = false;
              break;
            }
          }
        }

        if (compatible) {
          currentGroup.push(taskId);
          processed.add(taskId);
          for (const [resourceType, required] of Array.from(
            requirements.entries(),
          )) {
            const currentUsage = resourceUsage.get(resourceType) || 0;
            resourceUsage.set(resourceType, currentUsage + required);
          }
        }
      }

      if (currentGroup.length > 0) {
        groups.push(currentGroup);
      } else {
        break; // Avoid infinite loop
      }
    }

    return groups;
  }

  private allocateResourcesForGroup(
    taskIds: TaskId[],
    tasks: Map<TaskId, Task>,
  ): Map<string, number> {
    const allocations = new Map<string, number>();

    for (const taskId of taskIds) {
      const task = tasks.get(taskId);
      if (!task) continue;

      const requirements = this.extractResourceRequirements(task);
      for (const [resourceType, amount] of requirements) {
        const current = allocations.get(resourceType) || 0;
        allocations.set(resourceType, Math.max(current, amount)); // Use max for concurrent execution
      }
    }

    return allocations;
  }

  private calculateGroupDuration(
    taskIds: TaskId[],
    tasks: Map<TaskId, Task>,
  ): number {
    let maxDuration = 0;
    for (const taskId of taskIds) {
      const task = tasks.get(taskId);
      if (task) {
        const duration = task.metadata.estimatedDuration || 60000;
        maxDuration = Math.max(maxDuration, duration);
      }
    }
    return maxDuration;
  }

  private calculateGroupPriority(
    taskIds: TaskId[],
    tasks: Map<TaskId, Task>,
  ): number {
    const priorities = { critical: 4, high: 3, medium: 2, low: 1 };
    let totalPriority = 0;

    for (const taskId of taskIds) {
      const task = tasks.get(taskId);
      if (task) {
        totalPriority +=
          priorities[String(task.priority) as keyof typeof priorities];
      }
    }

    return taskIds.length > 0 ? totalPriority / taskIds.length : 0;
  }

  private findSatisfiedDependencies(
    taskIds: TaskId[],
    dependencyAnalysis: DependencyAnalysisResult,
  ): TaskDependency[] {
    return dependencyAnalysis.suggestedDependencies.filter((dep) =>
      taskIds.includes(dep.dependsOnTaskId),
    );
  }

  private assessGroupRisks(
    taskIds: TaskId[],
    tasks: Map<TaskId, Task>,
    resourceAllocations: Map<string, number>,
  ): string[] {
    const risks: string[] = [];

    // Check for resource over-allocation
    for (const [resourceType, allocated] of resourceAllocations) {
      const pool = this.config.resourcePools.get(resourceType);
      if (pool && allocated > pool.capacity * 0.9) {
        risks.push(
          `High ${resourceType} utilization (${Math.round((allocated / pool.capacity) * 100)}%)`,
        );
      }
    }

    // Check for task duration variance
    const durations = taskIds.map((id) => {
      const task = tasks.get(id);
      return task?.metadata.estimatedDuration || 60000;
    });
    const maxDuration = Math.max(...durations);
    const minDuration = Math.min(...durations);

    if (maxDuration > minDuration * 3) {
      risks.push('High duration variance between parallel tasks');
    }

    // Check for critical tasks
    const criticalTasks = taskIds.filter((id) => {
      const task = tasks.get(id);
      return task?.priority === 'critical';
    });

    if (criticalTasks.length > 0) {
      risks.push(`${criticalTasks.length} critical tasks in parallel group`);
    }

    return risks;
  }

  private buildOptimizationResult(
    groups: ParallelExecutionGroup[],
    tasks: Map<TaskId, Task>,
  ): ParallelOptimizationResult {
    // Build resource allocation plan
    const resourcePlan = new Map<
      string,
      Array<{
        taskId: TaskId;
        amount: number;
        startTime: number;
        duration: number;
      }>
    >();

    let currentTime = 0;
    for (const group of groups) {
      for (const [resourceType, amount] of group.resourceAllocations) {
        if (!resourcePlan.has(resourceType)) {
          resourcePlan.set(resourceType, []);
        }

        for (const taskId of group.tasks) {
          const task = tasks.get(taskId);
          const duration = task?.metadata.estimatedDuration || 60000;

          resourcePlan.get(resourceType)!.push({
            taskId,
            amount,
            startTime: currentTime,
            duration,
          });
        }
      }
      currentTime += group.estimatedDuration;
    }

    // Calculate projections
    const totalExecutionTime = groups.reduce(
      (sum, group) => sum + group.estimatedDuration,
      0,
    );
    const resourceUtilization = new Map<string, number>();

    for (const [resourceType, pool] of Array.from(
      this.config.resourcePools.entries(),
    )) {
      const allocations = resourcePlan.get(resourceType) || [];
      const avgUtilization =
        allocations.length > 0
          ? allocations.reduce((sum, alloc) => sum + alloc.amount, 0) /
            (allocations.length * pool.capacity)
          : 0;
      resourceUtilization.set(resourceType, Math.min(avgUtilization, 1));
    }

    const parallelizationFactor = Math.min(
      groups.length > 0 ? tasks.size / groups.length : 0,
      1,
    );
    const costOptimization = this.calculateCostOptimization(groups, tasks);

    // Generate recommendations
    const recommendations = this.generateOptimizationRecommendations(
      groups,
      resourceUtilization,
    );

    return {
      executionGroups: groups,
      resourcePlan,
      projections: {
        totalExecutionTime,
        resourceUtilization,
        parallelizationFactor,
        costOptimization,
      },
      recommendations,
      alternatives: [], // Would be filled by calling methods
    };
  }

  private calculateCostOptimization(
    groups: ParallelExecutionGroup[],
    tasks: Map<TaskId, Task>,
  ): number {
    // Simplified cost calculation - would be more sophisticated in practice
    return 0.2; // 20% cost optimization
  }

  private generateOptimizationRecommendations(
    groups: ParallelExecutionGroup[],
    resourceUtilization: Map<string, number>,
  ): OptimizationRecommendation[] {
    const recommendations: OptimizationRecommendation[] = [];

    // Check for under-utilized resources
    for (const [resourceType, utilization] of resourceUtilization) {
      if (utilization < 0.6) {
        recommendations.push({
          type: 'resource_adjustment',
          description: `${resourceType} utilization is low (${Math.round(utilization * 100)}%). Consider increasing parallel tasks or reducing capacity.`,
          impact: {
            timeImprovement: 0,
            resourceEfficiency: 0.3,
            riskReduction: 0.1,
          },
          complexity: 'low',
          priority: 'medium',
        });
      }
    }

    // Check for groups with high risk
    const highRiskGroups = groups.filter((g) => g.risks.length > 2);
    if (highRiskGroups.length > 0) {
      recommendations.push({
        type: 'task_reordering',
        description: `${highRiskGroups.length} groups have high risk factors. Consider reordering or splitting tasks.`,
        impact: {
          timeImprovement: 30000, // 30 seconds
          resourceEfficiency: 0.1,
          riskReduction: 0.4,
        },
        complexity: 'medium',
        priority: 'high',
      });
    }

    return recommendations;
  }

  private mergeOptimizationResults(
    results: ParallelOptimizationResult[],
    strategies: Array<{ strategy: ParallelStrategy; weight: number }>,
  ): ParallelOptimizationResult {
    if (results.length === 0) {
      throw new Error('No optimization results to merge');
    }

    if (results.length === 1) {
      return results[0];
    }

    // Simple merge - take the result with best weighted score
    let bestResult = results[0];
    let bestScore = 0;

    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      const weight = strategies[i]?.weight || 0;
      const score =
        weight *
        (result.projections.parallelizationFactor * 0.4 +
          (1 - result.projections.totalExecutionTime / 3600000) * 0.3 + // Prefer shorter execution
          (Array.from(result.projections.resourceUtilization.values()).reduce(
            (a, b) => a + b,
            0,
          ) /
            result.projections.resourceUtilization.size) *
            0.3);

      if (score > bestScore) {
        bestScore = score;
        bestResult = result;
      }
    }

    return bestResult;
  }

  private predictOptimalGrouping(
    tasks: Map<TaskId, Task>,
    dependencyAnalysis: DependencyAnalysisResult,
  ): TaskId[][] {
    // Simplified ML prediction - would use more sophisticated model
    const taskIds = Array.from(tasks.keys());
    const groups: TaskId[][] = [];

    // Group by predicted similarity
    const grouped = new Set<TaskId>();

    while (grouped.size < taskIds.length) {
      const currentGroup: TaskId[] = [];

      for (const taskId of taskIds) {
        if (grouped.has(taskId)) continue;
        if (currentGroup.length >= this.config.maxConcurrency) break;

        // Simple similarity: same category
        const task = tasks.get(taskId);
        if (
          currentGroup.length === 0 ||
          this.areSimilarTasks(currentGroup[0], taskId, tasks)
        ) {
          currentGroup.push(taskId);
          grouped.add(taskId);
        }
      }

      if (currentGroup.length > 0) {
        groups.push(currentGroup);
      } else {
        // Add remaining tasks individually
        for (const taskId of taskIds) {
          if (!grouped.has(taskId)) {
            groups.push([taskId]);
            grouped.add(taskId);
          }
        }
        break;
      }
    }

    return groups;
  }

  private areSimilarTasks(
    taskId1: TaskId,
    taskId2: TaskId,
    tasks: Map<TaskId, Task>,
  ): boolean {
    const task1 = tasks.get(taskId1);
    const task2 = tasks.get(taskId2);

    if (!task1 || !task2) return false;

    return (
      task1.category === task2.category && task1.priority === task2.priority
    );
  }

  private predictGroupConfidence(taskIds: TaskId[]): number {
    // Simplified confidence prediction based on historical data
    const historyKey = taskIds.sort().join(',');

    for (const [key, history] of Array.from(this.executionHistory.entries())) {
      if (key === historyKey) {
        return history.efficiency;
      }
    }

    // Default confidence based on group size
    return Math.max(0.5, 1 - (taskIds.length - 1) * 0.1);
  }

  private validateOptimization(
    result: ParallelOptimizationResult,
    tasks: Map<TaskId, Task>,
    dependencyAnalysis: DependencyAnalysisResult,
  ): { valid: boolean; issues: string[] } {
    const issues: string[] = [];

    // Check that all tasks are included
    const allTasks = new Set(Array.from(tasks.keys()));
    const groupedTasks = new Set(
      result.executionGroups.flatMap((g) => g.tasks),
    );

    if (allTasks.size !== groupedTasks.size) {
      issues.push(
        `Task count mismatch: ${allTasks.size} tasks, ${groupedTasks.size} grouped`,
      );
    }

    // Check resource constraints
    for (const group of result.executionGroups) {
      for (const [resourceType, amount] of group.resourceAllocations) {
        const pool = this.config.resourcePools.get(resourceType);
        if (pool && amount > pool.capacity) {
          issues.push(
            `Group ${group.id} exceeds ${resourceType} capacity: ${amount} > ${pool.capacity}`,
          );
        }
      }
    }

    return {
      valid: issues.length === 0,
      issues,
    };
  }

  private calculateOptimizationConfidence(
    result: ParallelOptimizationResult,
    validation: { valid: boolean; issues: string[] },
  ): number {
    if (!validation.valid) {
      return 0.3; // Low confidence for invalid optimizations
    }

    let confidence = 0.8; // Base confidence

    // Adjust based on parallelization factor
    confidence += result.projections.parallelizationFactor * 0.1;

    // Adjust based on resource utilization
    const avgUtilization =
      Array.from(result.projections.resourceUtilization.values()).reduce(
        (sum, util) => sum + util,
        0,
      ) / result.projections.resourceUtilization.size;

    if (avgUtilization > 0.6 && avgUtilization < 0.9) {
      confidence += 0.1; // Good utilization range
    }

    // Adjust based on group risks
    const totalRisks = result.executionGroups.reduce(
      (sum, g) => sum + g.risks.length,
      0,
    );
    confidence -= Math.min(totalRisks * 0.02, 0.2);

    return Math.max(0, Math.min(confidence, 1));
  }

  private generateOptimizationReasoning(
    result: ParallelOptimizationResult,
    alternatives: any[],
  ): string {
    const groupCount = result.executionGroups.length;
    const totalTasks = result.executionGroups.reduce(
      (sum, g) => sum + g.tasks.length,
      0,
    );
    const parallelFactor = Math.round(
      result.projections.parallelizationFactor * 100,
    );
    const executionTime = Math.round(
      result.projections.totalExecutionTime / 1000,
    );

    return (
      `Generated ${groupCount} parallel execution groups for ${totalTasks} tasks using ${this.config.strategy} strategy. ` +
      `Achieved ${parallelFactor}% parallelization factor with estimated ${executionTime}s total execution time. ` +
      `Resource utilization optimized across ${result.projections.resourceUtilization.size} resource types. ` +
      `${result.recommendations.length} optimization recommendations identified.`
    );
  }

  private async generateAlternativeStrategies(
    tasks: Map<TaskId, Task>,
    dependencyAnalysis: DependencyAnalysisResult,
    resourceContentions: ResourceContention[],
    context?: DecisionContext,
  ): Promise<
    Array<{
      strategy: ParallelStrategy;
      groups: ParallelExecutionGroup[];
      score: number;
      tradeoffs: string[];
    }>
  > {
    const alternatives = [];
    const strategies = [
      ParallelStrategy.MAX_PARALLELISM,
      ParallelStrategy.RESOURCE_BALANCED,
      ParallelStrategy.DEPENDENCY_AWARE,
    ].filter((s) => s !== this.config.strategy);

    for (const strategy of strategies.slice(0, 2)) {
      // Limit to 2 alternatives
      try {
        const originalStrategy = this.config.strategy;
        this.config.strategy = strategy;

        const result = await this.generateOptimalParallelGroups(
          tasks,
          dependencyAnalysis,
          resourceContentions,
          context,
        );

        alternatives.push({
          strategy,
          groups: result.executionGroups,
          score: result.projections.parallelizationFactor,
          tradeoffs: this.getStrategyTradeoffs(strategy),
        });

        this.config.strategy = originalStrategy;
      } catch (error) {
        logger.warn(
          `Failed to generate alternative with strategy ${strategy}`,
          { error },
        );
      }
    }

    return alternatives;
  }

  private getStrategyTradeoffs(strategy: ParallelStrategy): string[] {
    const tradeoffs: Record<ParallelStrategy, string[]> = {
      [ParallelStrategy.MAX_PARALLELISM]: [
        'Maximum concurrency but may strain resources',
        'Fastest execution but higher resource contention risk',
      ],
      [ParallelStrategy.RESOURCE_BALANCED]: [
        'Balanced resource usage but may not achieve maximum speed',
        'Lower resource contention but potentially longer execution time',
      ],
      [ParallelStrategy.DEPENDENCY_AWARE]: [
        'Respects all dependencies but may reduce parallelization',
        'High safety but potentially conservative execution',
      ],
      [ParallelStrategy.PRIORITY_GROUPED]: [
        'Priority-based execution but may ignore resource optimization',
        'Clear priority handling but suboptimal resource usage',
      ],
      [ParallelStrategy.ADAPTIVE_DYNAMIC]: [
        'Context-aware adaptation but increased complexity',
        'Flexible approach but harder to predict outcomes',
      ],
      [ParallelStrategy.MACHINE_LEARNING]: [
        'Data-driven optimization but requires training data',
        'Potentially optimal but needs historical performance data',
      ],
    };

    return tradeoffs[strategy] || ['Unknown tradeoffs'];
  }

  private updatePredictiveModel(
    tasks: Map<TaskId, Task>,
    result: ParallelOptimizationResult,
  ): void {
    // Update learning model with optimization results
    for (const group of result.executionGroups) {
      const features = this.extractGroupFeatures(group, tasks);
      const performance = this.predictGroupPerformance(group);

      // Simple learning update
      for (let i = 0; i < features.length; i++) {
        const featureKey = `group_feature_${i}`;
        const currentWeight = this.learningModel.get(featureKey) || 0.5;
        const newWeight =
          currentWeight + this.config.learningRate * (performance - 0.5);
        this.learningModel.set(
          featureKey,
          Math.max(0.1, Math.min(newWeight, 2.0)),
        );
      }
    }

    logger.debug('Predictive model updated', {
      modelSize: this.learningModel.size,
      groupCount: result.executionGroups.length,
    });
  }

  private extractGroupFeatures(
    group: ParallelExecutionGroup,
    tasks: Map<TaskId, Task>,
  ): number[] {
    const features: number[] = [];

    // Feature 1: Group size
    features.push(group.tasks.length / this.config.maxConcurrency);

    // Feature 2: Average priority
    const priorities = { critical: 4, high: 3, medium: 2, low: 1 };
    let avgPriority = 0;
    for (const taskId of group.tasks) {
      const task = tasks.get(taskId);
      if (task) {
        avgPriority +=
          priorities[String(task.priority) as keyof typeof priorities];
      }
    }
    features.push(avgPriority / group.tasks.length / 4);

    // Feature 3: Resource diversity
    const resourceTypes = Array.from(group.resourceAllocations.keys()).length;
    features.push(resourceTypes / this.config.resourcePools.size);

    // Feature 4: Duration variance
    const durations = group.tasks.map((id) => {
      const task = tasks.get(id);
      return task?.metadata.estimatedDuration || 60000;
    });
    const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
    const variance =
      durations.reduce((sum, d) => sum + Math.pow(d - avgDuration, 2), 0) /
      durations.length;
    features.push(Math.min(Math.sqrt(variance) / avgDuration, 1));

    return features;
  }

  private predictGroupPerformance(group: ParallelExecutionGroup): number {
    // Simple performance prediction based on confidence and risks
    let performance = group.confidence;
    performance -= group.risks.length * 0.1;
    return Math.max(0, Math.min(performance, 1));
  }

  private createDefaultContext(): DecisionContext {
    return {
      systemLoad: { cpu: 0.6, memory: 0.7, diskIO: 0.4, networkIO: 0.3 },
      taskQueueState: {
        totalTasks: 0,
        pendingTasks: 0,
        runningTasks: 0,
        failedTasks: 0,
        avgProcessingTime: 90000,
      },
      agentContext: {
        activeAgents: 1,
        maxConcurrentAgents: 8,
        agentCapabilities: {},
        agentWorkloads: {},
      },
      projectState: {
        buildStatus: 'unknown',
        testStatus: 'unknown',
        lintStatus: 'unknown',
        gitStatus: 'unknown',
      },
      budgetContext: {
        currentUsage: 0,
        costPerToken: 0.001,
        estimatedCostForTask: 0.15,
      },
      performanceHistory: {
        avgSuccessRate: 0.85,
        avgCompletionTime: 180000,
        commonFailureReasons: [],
        peakUsageHours: [],
      },
      userPreferences: {
        allowAutonomousDecisions: true,
        maxConcurrentTasks: 8,
        criticalTaskNotification: true,
      },
      timestamp: Date.now(),
    };
  }

  /**
   * Record execution history for learning
   */
  recordExecutionHistory(
    groupId: string,
    tasks: TaskId[],
    resourcesUsed: Map<string, number>,
    actualDuration: number,
    estimatedDuration: number,
    success: boolean,
    bottlenecks: string[] = [],
  ): void {
    const efficiency =
      estimatedDuration > 0
        ? Math.min(actualDuration / estimatedDuration, 2)
        : 1;

    const history: ParallelExecutionHistory = {
      groupId,
      tasks,
      resourcesUsed,
      actualDuration,
      estimatedDuration,
      efficiency,
      success,
      bottlenecks,
      timestamp: Date.now(),
    };

    this.executionHistory.set(groupId, history);

    // Limit history size
    if (this.executionHistory.size > 100) {
      const oldestKey = this.executionHistory.keys().next().value;
      this.executionHistory.delete(oldestKey);
    }

    logger.debug('Execution history recorded', {
      groupId,
      taskCount: tasks.length,
      efficiency,
      success,
    });
  }

  /**
   * Get optimization statistics
   */
  getStatistics(): {
    totalOptimizations: number;
    averageParallelizationFactor: number;
    resourceUtilizationEfficiency: number;
    learningModelSize: number;
    executionHistorySize: number;
  } {
    let avgParallelization = 0;
    let avgResourceEfficiency = 0;
    let count = 0;

    for (const [groupId, history] of Array.from(
      this.executionHistory.entries(),
    )) {
      avgParallelization += history.tasks.length;
      avgResourceEfficiency += history.efficiency;
      count++;
    }

    return {
      totalOptimizations: count,
      averageParallelizationFactor:
        count > 0 ? avgParallelization / count / this.config.maxConcurrency : 0,
      resourceUtilizationEfficiency:
        count > 0 ? avgResourceEfficiency / count : 0,
      learningModelSize: this.learningModel.size,
      executionHistorySize: this.executionHistory.size,
    };
  }

  /**
   * Update resource pool configuration
   */
  updateResourcePools(pools: Map<string, ResourcePool>): void {
    this.config.resourcePools = new Map(pools);
    logger.info('Resource pools updated', {
      poolCount: pools.size,
      totalCapacity: Array.from(pools.values()).reduce(
        (sum, p) => sum + p.capacity,
        0,
      ),
    });
  }

  /**
   * Get current resource utilization
   */
  getCurrentResourceUtilization(): Map<
    string,
    {
      pool: ResourcePool;
      utilization: number;
      predictions: number;
    }
  > {
    const utilization = new Map();

    for (const [name, pool] of this.config.resourcePools) {
      const currentUtilization = pool.allocated / pool.capacity;
      const prediction =
        this.resourcePredictions.get(name) || currentUtilization;

      utilization.set(name, {
        pool: { ...pool },
        utilization: currentUtilization,
        predictions: prediction,
      });
    }

    return utilization;
  }
}

/**
 * Zod schemas for validation
 */
export const ParallelOptimizationConfigSchema = z.object({
  strategy: z.nativeEnum(ParallelStrategy),
  maxConcurrency: z.number().min(1).max(32),
  resourcePools: z.map(
    z.string(),
    z.object({
      name: z.string(),
      capacity: z.number().min(0),
      allocated: z.number().min(0),
      tags: z.array(z.string()),
      shareable: z.boolean(),
      costPerUnit: z.number().min(0).optional(),
      priorityMultiplier: z.number().min(0).max(2),
    }),
  ),
  enableDynamicRebalancing: z.boolean(),
  targetResourceUtilization: z.number().min(0).max(1),
  minTaskDurationForParallelization: z.number().min(0),
  enablePredictiveAllocation: z.boolean(),
  learningRate: z.number().min(0).max(1),
});

export const ParallelExecutionGroupSchema = z.object({
  id: z.string(),
  tasks: z.array(z.string()),
  resourceAllocations: z.map(z.string(), z.number()),
  estimatedDuration: z.number().min(0),
  priority: z.number(),
  satisfiesDependencies: z.array(z.any()),
  confidence: z.number().min(0).max(1),
  risks: z.array(z.string()),
});
