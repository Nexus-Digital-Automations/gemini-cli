/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type {
  TaskId,
  Task,
  SchedulingFactors,
  ExecutionSequence,
  ResourceAllocation,
  TaskQueueConfig} from './types.js';
import {
  TaskPriority,
  TaskStatus,
  ResourceConstraint
} from './types.js';
import type { DependencyGraphManager } from './dependency-graph.js';
import { getComponentLogger } from '../utils/logger.js';

const logger = getComponentLogger('TaskSequencer');

/**
 * Advanced task sequencing algorithms for optimal execution ordering
 */
export class TaskSequencer {
  private dependencyGraph: DependencyGraphManager;
  private resourcePools: Map<string, number>;
  private config: TaskQueueConfig;

  constructor(dependencyGraph: DependencyGraphManager, config: TaskQueueConfig) {
    this.dependencyGraph = dependencyGraph;
    this.resourcePools = new Map(config.resourcePools);
    this.config = config;
  }

  /**
   * Generate optimal execution sequence using multiple algorithms
   */
  generateExecutionSequence(
    tasks: Map<TaskId, Task>,
    algorithm: 'priority' | 'dependency_aware' | 'resource_optimal' | 'hybrid' = 'hybrid'
  ): ExecutionSequence {
    logger.debug('Generating execution sequence', {
      algorithm,
      taskCount: tasks.size
    });

    switch (algorithm) {
      case 'priority':
        return this.generatePriorityBasedSequence(tasks);
      case 'dependency_aware':
        return this.generateDependencyAwareSequence(tasks);
      case 'resource_optimal':
        return this.generateResourceOptimalSequence(tasks);
      case 'hybrid':
        return this.generateHybridSequence(tasks);
      default:
        throw new Error(`Unknown sequencing algorithm: ${algorithm}`);
    }
  }

  /**
   * Priority-based sequencing algorithm
   */
  private generatePriorityBasedSequence(tasks: Map<TaskId, Task>): ExecutionSequence {
    logger.debug('Using priority-based sequencing');

    const taskArray = Array.from(tasks.values());
    const priorityOrder = ['critical', 'high', 'medium', 'low'] as const;

    // Sort by priority, then by creation time
    taskArray.sort((a, b) => {
      const aPriorityIndex = priorityOrder.indexOf(a.priority);
      const bPriorityIndex = priorityOrder.indexOf(b.priority);

      if (aPriorityIndex !== bPriorityIndex) {
        return aPriorityIndex - bPriorityIndex;
      }

      return a.metadata.createdAt.getTime() - b.metadata.createdAt.getTime();
    });

    const sequence = taskArray.map(task => task.id);
    const parallelGroups = this.identifyParallelGroups(sequence, tasks);
    const criticalPath = this.dependencyGraph.calculateCriticalPath();
    const estimatedDuration = this.calculateEstimatedDuration(sequence, tasks);

    return {
      sequence,
      parallelGroups,
      criticalPath,
      estimatedDuration,
      metadata: {
        algorithm: 'priority',
        generatedAt: new Date(),
        factors: ['task_priority', 'creation_time'],
        constraints: ['dependency_ordering'],
      },
    };
  }

  /**
   * Dependency-aware sequencing algorithm
   */
  private generateDependencyAwareSequence(tasks: Map<TaskId, Task>): ExecutionSequence {
    logger.debug('Using dependency-aware sequencing');

    const topologicalOrder = this.dependencyGraph.getTopologicalOrder();
    if (!topologicalOrder) {
      logger.error('Cannot generate dependency-aware sequence: circular dependencies detected');
      // Fallback to priority-based for tasks with circular dependencies
      return this.generatePriorityBasedSequence(tasks);
    }

    // Filter to only include tasks that are in our task set
    const sequence = topologicalOrder.filter(taskId => tasks.has(taskId));

    // Optimize within dependency constraints using priority
    const optimizedSequence = this.optimizeWithinDependencyConstraints(sequence, tasks);

    const parallelGroups = this.dependencyGraph.getParallelizableTasks()
      .filter(group => group.some(taskId => tasks.has(taskId)))
      .map(group => group.filter(taskId => tasks.has(taskId)));

    const criticalPath = this.dependencyGraph.calculateCriticalPath()
      .filter(taskId => tasks.has(taskId));

    const estimatedDuration = this.calculateEstimatedDuration(optimizedSequence, tasks);

    return {
      sequence: optimizedSequence,
      parallelGroups,
      criticalPath,
      estimatedDuration,
      metadata: {
        algorithm: 'dependency_aware',
        generatedAt: new Date(),
        factors: ['dependencies', 'topological_order', 'priority'],
        constraints: ['hard_dependencies', 'resource_constraints'],
      },
    };
  }

  /**
   * Resource-optimal sequencing algorithm
   */
  private generateResourceOptimalSequence(tasks: Map<TaskId, Task>): ExecutionSequence {
    logger.debug('Using resource-optimal sequencing');

    const taskArray = Array.from(tasks.values());
    const resourceAllocations = new Map<string, number>();

    // Initialize resource tracking
    for (const [poolName, capacity] of this.resourcePools) {
      resourceAllocations.set(poolName, 0);
    }

    // Sort tasks by resource efficiency and priority
    taskArray.sort((a, b) => {
      const aEfficiency = this.calculateResourceEfficiency(a);
      const bEfficiency = this.calculateResourceEfficiency(b);

      if (Math.abs(aEfficiency - bEfficiency) > 0.1) {
        return bEfficiency - aEfficiency; // Higher efficiency first
      }

      // If efficiency is similar, use priority
      const priorityOrder = ['critical', 'high', 'medium', 'low'] as const;
      const aPriorityIndex = priorityOrder.indexOf(a.priority);
      const bPriorityIndex = priorityOrder.indexOf(b.priority);

      return aPriorityIndex - bPriorityIndex;
    });

    const sequence: TaskId[] = [];
    const parallelGroups: TaskId[][] = [];
    let currentGroup: TaskId[] = [];

    for (const task of taskArray) {
      const resourceRequirements = this.getTaskResourceRequirements(task);
      let canExecuteNow = true;

      // Check if resources are available
      for (const [resourceType, required] of resourceRequirements) {
        const available = this.resourcePools.get(resourceType) || 0;
        const currentUsage = resourceAllocations.get(resourceType) || 0;

        if (currentUsage + required > available) {
          canExecuteNow = false;
          break;
        }
      }

      if (canExecuteNow && this.canExecuteInParallel(task, currentGroup, tasks)) {
        currentGroup.push(task.id);

        // Update resource allocations
        for (const [resourceType, required] of resourceRequirements) {
          const currentUsage = resourceAllocations.get(resourceType) || 0;
          resourceAllocations.set(resourceType, currentUsage + required);
        }
      } else {
        // Start new parallel group
        if (currentGroup.length > 0) {
          parallelGroups.push([...currentGroup]);
          sequence.push(...currentGroup);
        }

        // Reset resource allocations for new group
        resourceAllocations.clear();
        for (const [poolName] of this.resourcePools) {
          resourceAllocations.set(poolName, 0);
        }

        currentGroup = [task.id];
        const resourceRequirements = this.getTaskResourceRequirements(task);
        for (const [resourceType, required] of resourceRequirements) {
          resourceAllocations.set(resourceType, required);
        }
      }
    }

    // Add final group
    if (currentGroup.length > 0) {
      parallelGroups.push(currentGroup);
      sequence.push(...currentGroup);
    }

    const criticalPath = this.dependencyGraph.calculateCriticalPath()
      .filter(taskId => tasks.has(taskId));

    const estimatedDuration = this.calculateEstimatedDurationWithParallelization(
      parallelGroups,
      tasks
    );

    return {
      sequence,
      parallelGroups,
      criticalPath,
      estimatedDuration,
      metadata: {
        algorithm: 'resource_optimal',
        generatedAt: new Date(),
        factors: ['resource_efficiency', 'resource_availability', 'parallelization'],
        constraints: ['resource_limits', 'dependencies'],
      },
    };
  }

  /**
   * Hybrid sequencing algorithm combining multiple strategies
   */
  private generateHybridSequence(tasks: Map<TaskId, Task>): ExecutionSequence {
    logger.debug('Using hybrid sequencing algorithm');

    // Calculate scheduling factors for each task
    const schedulingFactors = new Map<TaskId, SchedulingFactors>();

    for (const [taskId, task] of tasks) {
      schedulingFactors.set(taskId, this.calculateSchedulingFactors(task));
    }

    // Get dependency constraints
    const dependencyGroups = this.dependencyGraph.getParallelizableTasks()
      .filter(group => group.some(taskId => tasks.has(taskId)))
      .map(group => group.filter(taskId => tasks.has(taskId)));

    // Generate sequence respecting dependencies and optimizing for multiple factors
    const sequence: TaskId[] = [];
    const parallelGroups: TaskId[][] = [];
    const processedTasks = new Set<TaskId>();

    for (const dependencyGroup of dependencyGroups) {
      if (dependencyGroup.length === 0) continue;

      // Sort tasks within this dependency group by hybrid score
      const groupTasks = dependencyGroup
        .map(taskId => ({ taskId, task: tasks.get(taskId)!, factors: schedulingFactors.get(taskId)! }))
        .filter(item => !processedTasks.has(item.taskId));

      groupTasks.sort((a, b) => {
        const aScore = this.calculateHybridScore(a.factors);
        const bScore = this.calculateHybridScore(b.factors);
        return bScore - aScore; // Higher score first
      });

      // Apply resource-aware parallelization within the group
      const resourceOptimizedGroups = this.optimizeGroupForResources(
        groupTasks.map(item => item.task)
      );

      for (const resourceGroup of resourceOptimizedGroups) {
        const groupIds = resourceGroup.map(task => task.id);
        parallelGroups.push(groupIds);
        sequence.push(...groupIds);
        groupIds.forEach(id => processedTasks.add(id));
      }
    }

    const criticalPath = this.dependencyGraph.calculateCriticalPath()
      .filter(taskId => tasks.has(taskId));

    const estimatedDuration = this.calculateEstimatedDurationWithParallelization(
      parallelGroups,
      tasks
    );

    return {
      sequence,
      parallelGroups,
      criticalPath,
      estimatedDuration,
      metadata: {
        algorithm: 'hybrid',
        generatedAt: new Date(),
        factors: [
          'priority',
          'dependencies',
          'resource_efficiency',
          'impact_factor',
          'urgency',
          'success_rate'
        ],
        constraints: ['dependencies', 'resources', 'parallelization'],
      },
    };
  }

  /**
   * Calculate scheduling factors for a task
   */
  private calculateSchedulingFactors(task: Task): SchedulingFactors {
    const priorityScores = { critical: 10, high: 7, medium: 4, low: 1 };
    const basePriority = priorityScores[task.priority];

    // Calculate urgency based on creation time and estimated duration
    const ageMs = Date.now() - task.metadata.createdAt.getTime();
    const urgency = Math.min(ageMs / (24 * 60 * 60 * 1000), 1); // Cap at 1 day

    // Calculate impact based on dependency weight
    const dependencyImpact = this.dependencyGraph.getDependencyImpact(task.id);
    const impact = Math.min(dependencyImpact.totalImpact / 10, 1); // Normalize

    // Calculate dependency weight
    const dependencyWeight = dependencyImpact.totalImpact + (dependencyImpact.criticalPathImpact ? 5 : 0);

    // Resource availability factor (simplified)
    const resourceRequirements = this.getTaskResourceRequirements(task);
    let resourceAvailability = 1;
    for (const [resourceType, required] of resourceRequirements) {
      const available = this.resourcePools.get(resourceType) || 0;
      if (available > 0) {
        resourceAvailability = Math.min(resourceAvailability, available / (available + required));
      }
    }

    // Duration factor (prefer shorter tasks for quick wins)
    const estimatedDuration = task.metadata.estimatedDuration || 60000; // Default 1 minute
    const durationFactor = Math.max(0.1, 1 - (estimatedDuration / (60 * 60 * 1000))); // Penalize tasks longer than 1 hour

    return {
      basePriority,
      urgency,
      impact,
      dependencyWeight,
      resourceAvailability,
      durationFactor,
    };
  }

  /**
   * Calculate hybrid score combining multiple factors
   */
  private calculateHybridScore(factors: SchedulingFactors): number {
    // Weighted combination of factors
    const weights = {
      basePriority: 0.3,
      urgency: 0.15,
      impact: 0.2,
      dependencyWeight: 0.15,
      resourceAvailability: 0.1,
      durationFactor: 0.1,
    };

    let score = 0;
    score += factors.basePriority * weights.basePriority;
    score += factors.urgency * weights.urgency * 10; // Scale urgency
    score += factors.impact * weights.impact * 10; // Scale impact
    score += Math.min(factors.dependencyWeight, 10) * weights.dependencyWeight; // Cap dependency weight
    score += factors.resourceAvailability * weights.resourceAvailability * 10;
    score += factors.durationFactor * weights.durationFactor * 10;

    // Add success rate if available
    if (factors.successRate !== undefined) {
      score += factors.successRate * 0.05 * 10; // Small weight for historical success
    }

    return score;
  }

  /**
   * Optimize task sequence within dependency constraints
   */
  private optimizeWithinDependencyConstraints(sequence: TaskId[], tasks: Map<TaskId, Task>): TaskId[] {
    // Group tasks that can be reordered without violating dependencies
    const reorderableGroups: TaskId[][] = [];
    let currentGroup: TaskId[] = [];

    for (let i = 0; i < sequence.length; i++) {
      const taskId = sequence[i];
      const canMoveWithinGroup = this.canReorderWithinGroup(taskId, currentGroup);

      if (canMoveWithinGroup && currentGroup.length > 0) {
        currentGroup.push(taskId);
      } else {
        if (currentGroup.length > 0) {
          reorderableGroups.push(currentGroup);
        }
        currentGroup = [taskId];
      }
    }

    if (currentGroup.length > 0) {
      reorderableGroups.push(currentGroup);
    }

    // Optimize each reorderable group
    const optimizedSequence: TaskId[] = [];
    for (const group of reorderableGroups) {
      const groupTasks = group.map(id => tasks.get(id)!).filter(Boolean);
      const optimizedGroup = this.optimizeTaskGroup(groupTasks);
      optimizedSequence.push(...optimizedGroup.map(task => task.id));
    }

    return optimizedSequence;
  }

  /**
   * Check if a task can be reordered within a group without violating dependencies
   */
  private canReorderWithinGroup(taskId: TaskId, group: TaskId[]): boolean {
    const dependencyImpact = this.dependencyGraph.getDependencyImpact(taskId);

    // Check if any task in the group depends on this task
    for (const groupTaskId of group) {
      if (dependencyImpact.directDependents.includes(groupTaskId) ||
          dependencyImpact.indirectDependents.includes(groupTaskId)) {
        return false;
      }
    }

    // Check if this task depends on any task in the group
    const node = this.dependencyGraph.getGraph().nodes.get(taskId);
    if (node) {
      for (const depId of node.dependencies) {
        if (group.includes(depId)) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Optimize a group of tasks by priority and other factors
   */
  private optimizeTaskGroup(tasks: Task[]): Task[] {
    return tasks.sort((a, b) => {
      // Sort by priority first
      const priorityOrder = ['critical', 'high', 'medium', 'low'] as const;
      const aPriorityIndex = priorityOrder.indexOf(a.priority);
      const bPriorityIndex = priorityOrder.indexOf(b.priority);

      if (aPriorityIndex !== bPriorityIndex) {
        return aPriorityIndex - bPriorityIndex;
      }

      // Then by estimated duration (shorter first for quick wins)
      const aDuration = a.metadata.estimatedDuration || 60000;
      const bDuration = b.metadata.estimatedDuration || 60000;

      if (Math.abs(aDuration - bDuration) > 30000) { // 30 second threshold
        return aDuration - bDuration;
      }

      // Finally by creation time
      return a.metadata.createdAt.getTime() - b.metadata.createdAt.getTime();
    });
  }

  /**
   * Identify parallel execution groups from a sequence
   */
  private identifyParallelGroups(sequence: TaskId[], tasks: Map<TaskId, Task>): TaskId[][] {
    const groups: TaskId[][] = [];
    let currentGroup: TaskId[] = [];

    for (const taskId of sequence) {
      const task = tasks.get(taskId);
      if (!task) continue;

      if (currentGroup.length === 0 || this.canExecuteInParallel(task, currentGroup, tasks)) {
        currentGroup.push(taskId);
      } else {
        if (currentGroup.length > 0) {
          groups.push([...currentGroup]);
        }
        currentGroup = [taskId];
      }
    }

    if (currentGroup.length > 0) {
      groups.push(currentGroup);
    }

    return groups;
  }

  /**
   * Check if a task can execute in parallel with other tasks in a group
   */
  private canExecuteInParallel(task: Task, groupTaskIds: TaskId[], tasks: Map<TaskId, Task>): boolean {
    // Check dependency constraints
    const node = this.dependencyGraph.getGraph().nodes.get(task.id);
    if (node) {
      for (const depId of node.dependencies) {
        if (groupTaskIds.includes(depId)) {
          return false; // Cannot execute in parallel with dependencies
        }
      }
    }

    // Check resource constraints
    const taskResources = this.getTaskResourceRequirements(task);
    const groupResources = new Map<string, number>();

    for (const groupTaskId of groupTaskIds) {
      const groupTask = tasks.get(groupTaskId);
      if (groupTask) {
        const groupTaskResources = this.getTaskResourceRequirements(groupTask);
        for (const [resourceType, amount] of groupTaskResources) {
          const current = groupResources.get(resourceType) || 0;
          groupResources.set(resourceType, current + amount);
        }
      }
    }

    for (const [resourceType, required] of taskResources) {
      const currentUsage = groupResources.get(resourceType) || 0;
      const totalAvailable = this.resourcePools.get(resourceType) || 0;

      if (currentUsage + required > totalAvailable) {
        return false;
      }
    }

    return true;
  }

  /**
   * Calculate resource efficiency score for a task
   */
  private calculateResourceEfficiency(task: Task): number {
    const resourceRequirements = this.getTaskResourceRequirements(task);
    const estimatedDuration = task.metadata.estimatedDuration || 60000;
    const priorityScore = { critical: 4, high: 3, medium: 2, low: 1 }[task.priority];

    let totalResourceCost = 0;
    for (const [, amount] of resourceRequirements) {
      totalResourceCost += amount;
    }

    // Higher efficiency = higher priority per unit resource per unit time
    const efficiency = totalResourceCost > 0
      ? (priorityScore * 1000) / (totalResourceCost * estimatedDuration)
      : priorityScore;

    return efficiency;
  }

  /**
   * Get resource requirements for a task
   */
  private getTaskResourceRequirements(task: Task): Map<string, number> {
    const requirements = new Map<string, number>();

    if (task.executionContext?.resourceConstraints) {
      for (const constraint of task.executionContext.resourceConstraints) {
        requirements.set(constraint.resourceType, constraint.maxUnits);
      }
    } else {
      // Default resource requirements based on task category
      const defaultRequirements = {
        'implementation': [['cpu', 2], ['memory', 512]],
        'testing': [['cpu', 1], ['memory', 256]],
        'documentation': [['cpu', 1], ['memory', 128]],
        'analysis': [['cpu', 3], ['memory', 1024]],
        'refactoring': [['cpu', 2], ['memory', 512]],
        'deployment': [['cpu', 1], ['memory', 256], ['network', 1]],
      };

      const taskDefaults = defaultRequirements[task.category] || [['cpu', 1], ['memory', 256]];
      for (const [resourceType, amount] of taskDefaults) {
        requirements.set(resourceType, amount as number);
      }
    }

    return requirements;
  }

  /**
   * Optimize a group of tasks for resource usage
   */
  private optimizeGroupForResources(tasks: Task[]): Task[][] {
    if (tasks.length === 0) return [];

    const groups: Task[][] = [];
    let currentGroup: Task[] = [];
    const resourceUsage = new Map<string, number>();

    // Initialize resource tracking
    for (const [resourceType] of this.resourcePools) {
      resourceUsage.set(resourceType, 0);
    }

    // Sort tasks by resource efficiency
    const sortedTasks = [...tasks].sort((a, b) => {
      const aEfficiency = this.calculateResourceEfficiency(a);
      const bEfficiency = this.calculateResourceEfficiency(b);
      return bEfficiency - aEfficiency;
    });

    for (const task of sortedTasks) {
      const taskResources = this.getTaskResourceRequirements(task);
      let canAddToCurrentGroup = true;

      // Check if task fits in current resource allocation
      for (const [resourceType, required] of taskResources) {
        const available = this.resourcePools.get(resourceType) || 0;
        const currentUsage = resourceUsage.get(resourceType) || 0;

        if (currentUsage + required > available) {
          canAddToCurrentGroup = false;
          break;
        }
      }

      if (canAddToCurrentGroup) {
        currentGroup.push(task);
        // Update resource usage
        for (const [resourceType, required] of taskResources) {
          const currentUsage = resourceUsage.get(resourceType) || 0;
          resourceUsage.set(resourceType, currentUsage + required);
        }
      } else {
        // Start new group
        if (currentGroup.length > 0) {
          groups.push([...currentGroup]);
        }
        currentGroup = [task];

        // Reset resource usage
        resourceUsage.clear();
        for (const [resourceType] of this.resourcePools) {
          resourceUsage.set(resourceType, 0);
        }

        // Add current task's resource usage
        for (const [resourceType, required] of taskResources) {
          resourceUsage.set(resourceType, required);
        }
      }
    }

    // Add final group
    if (currentGroup.length > 0) {
      groups.push(currentGroup);
    }

    return groups;
  }

  /**
   * Calculate estimated duration for a task sequence
   */
  private calculateEstimatedDuration(sequence: TaskId[], tasks: Map<TaskId, Task>): number {
    let totalDuration = 0;
    for (const taskId of sequence) {
      const task = tasks.get(taskId);
      if (task) {
        totalDuration += task.metadata.estimatedDuration || 60000; // Default 1 minute
      }
    }
    return totalDuration;
  }

  /**
   * Calculate estimated duration with parallelization
   */
  private calculateEstimatedDurationWithParallelization(
    parallelGroups: TaskId[][],
    tasks: Map<TaskId, Task>
  ): number {
    let totalDuration = 0;

    for (const group of parallelGroups) {
      let maxGroupDuration = 0;
      for (const taskId of group) {
        const task = tasks.get(taskId);
        if (task) {
          const taskDuration = task.metadata.estimatedDuration || 60000;
          maxGroupDuration = Math.max(maxGroupDuration, taskDuration);
        }
      }
      totalDuration += maxGroupDuration;
    }

    return totalDuration;
  }

  /**
   * Generate resource allocations for an execution sequence
   */
  generateResourceAllocations(
    sequence: ExecutionSequence,
    tasks: Map<TaskId, Task>
  ): ResourceAllocation[] {
    const allocations: ResourceAllocation[] = [];
    const resourceUsage = new Map<string, number>();

    // Initialize resource tracking
    for (const [resourceType] of this.resourcePools) {
      resourceUsage.set(resourceType, 0);
    }

    let currentTime = Date.now();

    for (const group of sequence.parallelGroups) {
      let maxGroupDuration = 0;

      for (const taskId of group) {
        const task = tasks.get(taskId);
        if (!task) continue;

        const taskResources = this.getTaskResourceRequirements(task);
        const allocatedResources = new Map<string, number>();
        const poolAssignments: string[] = [];

        for (const [resourceType, required] of taskResources) {
          allocatedResources.set(resourceType, required);
          poolAssignments.push(`${resourceType}_pool`);
        }

        const taskDuration = task.metadata.estimatedDuration || 60000;
        maxGroupDuration = Math.max(maxGroupDuration, taskDuration);

        allocations.push({
          taskId,
          allocatedResources,
          poolAssignments,
          allocatedAt: new Date(currentTime),
          expectedReleaseAt: new Date(currentTime + taskDuration),
        });
      }

      currentTime += maxGroupDuration;
    }

    return allocations;
  }

  /**
   * Update resource pool capacities
   */
  updateResourcePools(newPools: Map<string, number>): void {
    this.resourcePools = new Map(newPools);
    logger.debug('Resource pools updated', {
      pools: Object.fromEntries(this.resourcePools)
    });
  }

  /**
   * Get current resource utilization
   */
  getResourceUtilization(): Map<string, { total: number; used: number; available: number }> {
    const utilization = new Map();

    for (const [resourceType, total] of this.resourcePools) {
      utilization.set(resourceType, {
        total,
        used: 0, // Would be calculated from active tasks
        available: total,
      });
    }

    return utilization;
  }
}