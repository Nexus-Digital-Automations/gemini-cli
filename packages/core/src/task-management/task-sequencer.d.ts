/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type {
  TaskId,
  Task,
  ExecutionSequence,
  ResourceAllocation,
  TaskQueueConfig,
} from './types.js';
import type { DependencyGraphManager } from './dependency-graph.js';
/**
 * Advanced task sequencing algorithms for optimal execution ordering
 */
export declare class TaskSequencer {
  private dependencyGraph;
  private resourcePools;
  private config;
  constructor(dependencyGraph: DependencyGraphManager, config: TaskQueueConfig);
  /**
   * Generate optimal execution sequence using multiple algorithms
   */
  generateExecutionSequence(
    tasks: Map<TaskId, Task>,
    algorithm?: 'priority' | 'dependency_aware' | 'resource_optimal' | 'hybrid',
  ): ExecutionSequence;
  /**
   * Priority-based sequencing algorithm
   */
  private generatePriorityBasedSequence;
  /**
   * Dependency-aware sequencing algorithm
   */
  private generateDependencyAwareSequence;
  /**
   * Resource-optimal sequencing algorithm
   */
  private generateResourceOptimalSequence;
  /**
   * Hybrid sequencing algorithm combining multiple strategies
   */
  private generateHybridSequence;
  /**
   * Calculate scheduling factors for a task
   */
  private calculateSchedulingFactors;
  /**
   * Calculate hybrid score combining multiple factors
   */
  private calculateHybridScore;
  /**
   * Optimize task sequence within dependency constraints
   */
  private optimizeWithinDependencyConstraints;
  /**
   * Check if a task can be reordered within a group without violating dependencies
   */
  private canReorderWithinGroup;
  /**
   * Optimize a group of tasks by priority and other factors
   */
  private optimizeTaskGroup;
  /**
   * Identify parallel execution groups from a sequence
   */
  private identifyParallelGroups;
  /**
   * Check if a task can execute in parallel with other tasks in a group
   */
  private canExecuteInParallel;
  /**
   * Calculate resource efficiency score for a task
   */
  private calculateResourceEfficiency;
  /**
   * Get resource requirements for a task
   */
  private getTaskResourceRequirements;
  /**
   * Optimize a group of tasks for resource usage
   */
  private optimizeGroupForResources;
  /**
   * Calculate estimated duration for a task sequence
   */
  private calculateEstimatedDuration;
  /**
   * Calculate estimated duration with parallelization
   */
  private calculateEstimatedDurationWithParallelization;
  /**
   * Generate resource allocations for an execution sequence
   */
  generateResourceAllocations(
    sequence: ExecutionSequence,
    tasks: Map<TaskId, Task>,
  ): ResourceAllocation[];
  /**
   * Update resource pool capacities
   */
  updateResourcePools(newPools: Map<string, number>): void;
  /**
   * Get current resource utilization
   */
  getResourceUtilization(): Map<
    string,
    {
      total: number;
      used: number;
      available: number;
    }
  >;
}
