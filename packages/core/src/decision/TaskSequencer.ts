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
  ExecutionSequence,
  SchedulingFactors,
  ResourceAllocation,
} from '../task-management/types.js';
import type {
  Decision,
  DecisionContext,
  DecisionType,
  DecisionPriority,
} from './types.js';
import { DependencyAnalyzer, type DependencyAnalysisResult } from './DependencyAnalyzer.js';
import { getComponentLogger } from '../utils/logger.js';

const logger = getComponentLogger('DecisionTaskSequencer');

/**
 * Advanced sequencing algorithm types
 */
export enum SequencingAlgorithm {
  CRITICAL_PATH = 'critical_path',
  PRIORITY_WEIGHTED = 'priority_weighted',
  RESOURCE_AWARE = 'resource_aware',
  DEADLINE_DRIVEN = 'deadline_driven',
  ADAPTIVE_HYBRID = 'adaptive_hybrid',
  MACHINE_LEARNING = 'machine_learning',
}

/**
 * Configuration for task sequencing
 */
export interface TaskSequencingConfig {
  /** Primary algorithm to use */
  algorithm: SequencingAlgorithm;
  /** Weight factors for hybrid algorithms */
  weights: {
    priority: number;
    duration: number;
    dependencies: number;
    resources: number;
    deadline: number;
  };
  /** Enable dynamic resequencing based on runtime feedback */
  enableDynamicResequencing: boolean;
  /** Maximum time to spend on sequence optimization (ms) */
  maxOptimizationTime: number;
  /** Enable predictive scheduling based on historical data */
  enablePredictiveScheduling: boolean;
  /** Resource pool definitions for scheduling */
  resourcePools: Map<string, number>;
}

/**
 * Sequencing decision with rationale
 */
export interface SequencingDecision extends Decision {
  /** The generated execution sequence */
  sequence: ExecutionSequence;
  /** Algorithm used for sequencing */
  algorithm: SequencingAlgorithm;
  /** Performance metrics of the sequence */
  metrics: SequenceMetrics;
  /** Alternative sequences considered */
  alternativeSequences: Array<{
    sequence: ExecutionSequence;
    algorithm: SequencingAlgorithm;
    score: number;
    reason: string;
  }>;
}

/**
 * Performance metrics for a sequence
 */
export interface SequenceMetrics {
  /** Total estimated execution time */
  totalExecutionTime: number;
  /** Critical path duration */
  criticalPathDuration: number;
  /** Resource utilization efficiency (0-1) */
  resourceUtilization: number;
  /** Parallelization factor (0-1) */
  parallelizationFactor: number;
  /** Dependency satisfaction score (0-1) */
  dependencySatisfaction: number;
  /** Risk assessment (0-1, lower is better) */
  riskAssessment: number;
}

/**
 * Historical execution data for learning
 */
interface ExecutionHistory {
  taskId: TaskId;
  category: string;
  priority: string;
  estimatedDuration: number;
  actualDuration: number;
  resourcesUsed: Map<string, number>;
  dependencies: TaskId[];
  success: boolean;
  timestamp: number;
}

/**
 * Advanced task sequencing engine for intelligent execution ordering
 */
export class TaskSequencer {
  private config: TaskSequencingConfig;
  private dependencyAnalyzer: DependencyAnalyzer;
  private executionHistory: Map<TaskId, ExecutionHistory>;
  private learningModel: Map<string, number>; // Simplified ML model
  private sequenceCache: Map<string, SequencingDecision>;

  constructor(
    config: Partial<TaskSequencingConfig> = {},
    dependencyAnalyzer?: DependencyAnalyzer
  ) {
    this.config = {
      algorithm: SequencingAlgorithm.ADAPTIVE_HYBRID,
      weights: {
        priority: 0.3,
        duration: 0.2,
        dependencies: 0.25,
        resources: 0.15,
        deadline: 0.1,
      },
      enableDynamicResequencing: true,
      maxOptimizationTime: 5000, // 5 seconds
      enablePredictiveScheduling: true,
      resourcePools: new Map([
        ['cpu', 4],
        ['memory', 8192],
        ['network', 2],
        ['storage', 1000],
      ]),
      ...config,
    };

    this.dependencyAnalyzer = dependencyAnalyzer || new DependencyAnalyzer();
    this.executionHistory = new Map();
    this.learningModel = new Map();
    this.sequenceCache = new Map();
  }

  /**
   * Generate intelligent execution sequence for tasks
   */
  async generateSequence(
    tasks: Map<TaskId, Task>,
    existingDependencies: TaskDependency[] = [],
    context?: DecisionContext
  ): Promise<SequencingDecision> {
    logger.info('Generating intelligent execution sequence', {
      taskCount: tasks.size,
      algorithm: this.config.algorithm,
      dependencies: existingDependencies.length,
    });

    const startTime = Date.now();
    const cacheKey = this.generateCacheKey(tasks, existingDependencies);

    // Check cache first
    const cached = this.sequenceCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < 300000) { // 5 minute cache
      logger.debug('Returning cached sequence');
      return cached;
    }

    // Analyze dependencies first
    const dependencyAnalysis = await this.dependencyAnalyzer.analyzeDependencies(
      tasks,
      existingDependencies,
      context
    );

    // Generate sequence based on selected algorithm
    const primarySequence = await this.executeAlgorithm(
      this.config.algorithm,
      tasks,
      dependencyAnalysis,
      context
    );

    // Generate alternative sequences for comparison
    const alternativeSequences = await this.generateAlternativeSequences(
      tasks,
      dependencyAnalysis,
      context
    );

    // Calculate performance metrics
    const metrics = this.calculateSequenceMetrics(
      primarySequence,
      tasks,
      dependencyAnalysis
    );

    // Create sequencing decision
    const decision: SequencingDecision = {
      id: `seq_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      type: DecisionType.SCHEDULING,
      choice: `Use ${this.config.algorithm} algorithm for task sequencing`,
      priority: DecisionPriority.HIGH,
      confidence: this.calculateSequenceConfidence(metrics, alternativeSequences),
      reasoning: this.generateSequencingReasoning(
        primarySequence,
        metrics,
        dependencyAnalysis
      ),
      evidence: {
        dependencyAnalysis,
        metrics,
        algorithmUsed: this.config.algorithm,
        optimizationTime: Date.now() - startTime,
      },
      expectedOutcome: {
        successProbability: this.estimateSuccessProbability(metrics),
        estimatedDuration: metrics.totalExecutionTime,
        requiredResources: Array.from(this.config.resourcePools.keys()),
      },
      context: context || this.createDefaultContext(),
      requiresApproval: false,
      alternatives: alternativeSequences.map(alt => ({
        choice: `Use ${alt.algorithm} algorithm`,
        score: alt.score,
        reasoning: alt.reason,
      })),
      sequence: primarySequence,
      algorithm: this.config.algorithm,
      metrics,
      alternativeSequences,
    };

    // Cache the decision
    this.sequenceCache.set(cacheKey, decision);

    // Update learning model if enabled
    if (this.config.enablePredictiveScheduling) {
      this.updateLearningModel(tasks, decision);
    }

    logger.info('Sequence generation complete', {
      totalTime: Date.now() - startTime,
      tasksInSequence: primarySequence.sequence.length,
      parallelGroups: primarySequence.parallelGroups.length,
      confidence: decision.confidence,
    });

    return decision;
  }

  /**
   * Execute specific sequencing algorithm
   */
  private async executeAlgorithm(
    algorithm: SequencingAlgorithm,
    tasks: Map<TaskId, Task>,
    dependencyAnalysis: DependencyAnalysisResult,
    context?: DecisionContext
  ): Promise<ExecutionSequence> {
    switch (algorithm) {
      case SequencingAlgorithm.CRITICAL_PATH:
        return this.generateCriticalPathSequence(tasks, dependencyAnalysis);

      case SequencingAlgorithm.PRIORITY_WEIGHTED:
        return this.generatePriorityWeightedSequence(tasks, dependencyAnalysis);

      case SequencingAlgorithm.RESOURCE_AWARE:
        return this.generateResourceAwareSequence(tasks, dependencyAnalysis);

      case SequencingAlgorithm.DEADLINE_DRIVEN:
        return this.generateDeadlineDrivenSequence(tasks, dependencyAnalysis);

      case SequencingAlgorithm.ADAPTIVE_HYBRID:
        return this.generateAdaptiveHybridSequence(tasks, dependencyAnalysis, context);

      case SequencingAlgorithm.MACHINE_LEARNING:
        return this.generateMLBasedSequence(tasks, dependencyAnalysis);

      default:
        logger.warn(`Unknown algorithm ${algorithm}, falling back to adaptive hybrid`);
        return this.generateAdaptiveHybridSequence(tasks, dependencyAnalysis, context);
    }
  }

  /**
   * Generate critical path based sequence
   */
  private async generateCriticalPathSequence(
    tasks: Map<TaskId, Task>,
    dependencyAnalysis: DependencyAnalysisResult
  ): Promise<ExecutionSequence> {
    logger.debug('Generating critical path sequence');

    // Build dependency graph
    const graph = this.buildDependencyGraph(tasks, dependencyAnalysis.suggestedDependencies);

    // Calculate critical path
    const criticalPath = this.calculateCriticalPath(tasks, graph);

    // Generate parallel groups based on dependencies
    const parallelGroups = this.generateParallelGroupsFromGraph(tasks, graph);

    // Estimate total duration
    const estimatedDuration = this.calculateParallelGroupsDuration(parallelGroups, tasks);

    return {
      sequence: criticalPath,
      parallelGroups,
      criticalPath,
      estimatedDuration,
      metadata: {
        algorithm: SequencingAlgorithm.CRITICAL_PATH,
        generatedAt: new Date(),
        factors: ['critical_path', 'dependencies'],
        constraints: ['hard_dependencies'],
      },
    };
  }

  /**
   * Generate priority weighted sequence
   */
  private async generatePriorityWeightedSequence(
    tasks: Map<TaskId, Task>,
    dependencyAnalysis: DependencyAnalysisResult
  ): Promise<ExecutionSequence> {
    logger.debug('Generating priority weighted sequence');

    // Calculate priority scores for all tasks
    const taskScores = new Map<TaskId, number>();

    for (const [taskId, task] of tasks) {
      const score = this.calculatePriorityScore(task, dependencyAnalysis);
      taskScores.set(taskId, score);
    }

    // Sort tasks by priority score
    const sortedTasks = Array.from(tasks.values())
      .sort((a, b) => (taskScores.get(b.id) || 0) - (taskScores.get(a.id) || 0));

    const sequence = sortedTasks.map(task => task.id);
    const parallelGroups = this.generateParallelGroupsRespectingDependencies(
      sequence,
      tasks,
      dependencyAnalysis.suggestedDependencies
    );

    const criticalPath = this.findCriticalPathInSequence(sequence, tasks, dependencyAnalysis.suggestedDependencies);
    const estimatedDuration = this.calculateParallelGroupsDuration(parallelGroups, tasks);

    return {
      sequence,
      parallelGroups,
      criticalPath,
      estimatedDuration,
      metadata: {
        algorithm: SequencingAlgorithm.PRIORITY_WEIGHTED,
        generatedAt: new Date(),
        factors: ['priority', 'dependency_weight', 'urgency'],
        constraints: ['dependencies'],
      },
    };
  }

  /**
   * Generate resource-aware sequence
   */
  private async generateResourceAwareSequence(
    tasks: Map<TaskId, Task>,
    dependencyAnalysis: DependencyAnalysisResult
  ): Promise<ExecutionSequence> {
    logger.debug('Generating resource-aware sequence');

    // Group tasks by resource requirements
    const resourceGroups = this.groupTasksByResourceRequirements(tasks);

    // Optimize resource allocation
    const optimizedSequence = this.optimizeResourceAllocation(resourceGroups, tasks, dependencyAnalysis);

    const parallelGroups = optimizedSequence.parallelGroups || [];
    const criticalPath = this.findCriticalPathInSequence(
      optimizedSequence.sequence,
      tasks,
      dependencyAnalysis.suggestedDependencies
    );

    return {
      sequence: optimizedSequence.sequence,
      parallelGroups,
      criticalPath,
      estimatedDuration: optimizedSequence.estimatedDuration,
      metadata: {
        algorithm: SequencingAlgorithm.RESOURCE_AWARE,
        generatedAt: new Date(),
        factors: ['resource_efficiency', 'resource_availability', 'parallelization'],
        constraints: ['resource_limits', 'dependencies'],
      },
    };
  }

  /**
   * Generate deadline-driven sequence
   */
  private async generateDeadlineDrivenSequence(
    tasks: Map<TaskId, Task>,
    dependencyAnalysis: DependencyAnalysisResult
  ): Promise<ExecutionSequence> {
    logger.debug('Generating deadline-driven sequence');

    // Extract deadline information from tasks
    const tasksWithDeadlines = Array.from(tasks.values())
      .filter(task => this.hasDeadline(task))
      .sort((a, b) => this.getDeadline(a) - this.getDeadline(b));

    const tasksWithoutDeadlines = Array.from(tasks.values())
      .filter(task => !this.hasDeadline(task));

    // Prioritize deadline tasks
    const sequence = [
      ...tasksWithDeadlines.map(t => t.id),
      ...tasksWithoutDeadlines.map(t => t.id),
    ];

    const parallelGroups = this.generateParallelGroupsRespectingDependencies(
      sequence,
      tasks,
      dependencyAnalysis.suggestedDependencies
    );

    const criticalPath = this.findCriticalPathInSequence(
      sequence,
      tasks,
      dependencyAnalysis.suggestedDependencies
    );
    const estimatedDuration = this.calculateParallelGroupsDuration(parallelGroups, tasks);

    return {
      sequence,
      parallelGroups,
      criticalPath,
      estimatedDuration,
      metadata: {
        algorithm: SequencingAlgorithm.DEADLINE_DRIVEN,
        generatedAt: new Date(),
        factors: ['deadlines', 'priority', 'dependencies'],
        constraints: ['deadlines', 'dependencies'],
      },
    };
  }

  /**
   * Generate adaptive hybrid sequence
   */
  private async generateAdaptiveHybridSequence(
    tasks: Map<TaskId, Task>,
    dependencyAnalysis: DependencyAnalysisResult,
    context?: DecisionContext
  ): Promise<ExecutionSequence> {
    logger.debug('Generating adaptive hybrid sequence');

    // Analyze current system state to adapt weights
    const adaptedWeights = this.adaptWeightsToContext(context);

    // Calculate composite scores for all tasks
    const taskScores = new Map<TaskId, number>();

    for (const [taskId, task] of tasks) {
      const factors = this.calculateSchedulingFactors(task, dependencyAnalysis);
      const score = this.calculateCompositeScore(factors, adaptedWeights);
      taskScores.set(taskId, score);
    }

    // Sort tasks by composite score
    const sortedTasks = Array.from(tasks.values())
      .sort((a, b) => (taskScores.get(b.id) || 0) - (taskScores.get(a.id) || 0));

    // Apply intelligent grouping and parallelization
    const optimizedGroups = this.optimizeTaskGrouping(
      sortedTasks,
      dependencyAnalysis,
      adaptedWeights
    );

    const sequence = optimizedGroups.flat().map(task => task.id);
    const parallelGroups = optimizedGroups.map(group => group.map(task => task.id));
    const criticalPath = this.findCriticalPathInSequence(
      sequence,
      tasks,
      dependencyAnalysis.suggestedDependencies
    );
    const estimatedDuration = this.calculateParallelGroupsDuration(parallelGroups, tasks);

    return {
      sequence,
      parallelGroups,
      criticalPath,
      estimatedDuration,
      metadata: {
        algorithm: SequencingAlgorithm.ADAPTIVE_HYBRID,
        generatedAt: new Date(),
        factors: [
          'priority',
          'dependencies',
          'resources',
          'duration',
          'system_context',
        ],
        constraints: [
          'dependencies',
          'resources',
          'system_load',
        ],
      },
    };
  }

  /**
   * Generate ML-based sequence using historical data
   */
  private async generateMLBasedSequence(
    tasks: Map<TaskId, Task>,
    dependencyAnalysis: DependencyAnalysisResult
  ): Promise<ExecutionSequence> {
    logger.debug('Generating ML-based sequence');

    if (this.executionHistory.size < 10) {
      logger.warn('Insufficient historical data for ML, falling back to hybrid');
      return this.generateAdaptiveHybridSequence(tasks, dependencyAnalysis);
    }

    // Predict optimal sequence using learning model
    const predictions = this.predictOptimalSequence(tasks, dependencyAnalysis);

    // Apply predicted ordering
    const sequence = predictions.map(pred => pred.taskId);
    const parallelGroups = this.generateParallelGroupsFromPredictions(predictions, tasks);

    const criticalPath = this.findCriticalPathInSequence(
      sequence,
      tasks,
      dependencyAnalysis.suggestedDependencies
    );
    const estimatedDuration = this.calculateParallelGroupsDuration(parallelGroups, tasks);

    return {
      sequence,
      parallelGroups,
      criticalPath,
      estimatedDuration,
      metadata: {
        algorithm: SequencingAlgorithm.MACHINE_LEARNING,
        generatedAt: new Date(),
        factors: ['historical_performance', 'pattern_recognition', 'predictions'],
        constraints: ['learned_constraints', 'dependencies'],
      },
    };
  }

  /**
   * Calculate scheduling factors for a task
   */
  private calculateSchedulingFactors(
    task: Task,
    dependencyAnalysis: DependencyAnalysisResult
  ): SchedulingFactors {
    // Priority score
    const priorityScores = { critical: 4, high: 3, medium: 2, low: 1 };
    const basePriority = priorityScores[task.priority];

    // Urgency based on creation time
    const ageMs = Date.now() - task.metadata.createdAt.getTime();
    const urgency = Math.min(ageMs / (24 * 60 * 60 * 1000), 1); // Normalize to 0-1

    // Impact based on dependencies
    const dependentTasks = dependencyAnalysis.suggestedDependencies
      .filter(dep => dep.dependsOnTaskId === task.id).length;
    const impact = Math.min(dependentTasks / 5, 1); // Normalize

    // Dependency weight
    const dependencyWeight = dependentTasks * 2;

    // Resource availability (simplified)
    const resourceAvailability = 0.8; // Mock value

    // Duration factor
    const estimatedDuration = task.metadata.estimatedDuration || 60000;
    const durationFactor = Math.max(0.1, 1 - (estimatedDuration / (4 * 60 * 60 * 1000))); // Penalize > 4 hours

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
   * Calculate composite score from factors and weights
   */
  private calculateCompositeScore(
    factors: SchedulingFactors,
    weights: TaskSequencingConfig['weights']
  ): number {
    let score = 0;
    score += factors.basePriority * weights.priority * 2.5; // Scale priority
    score += factors.urgency * weights.deadline * 10; // Scale urgency
    score += factors.impact * weights.dependencies * 10; // Scale impact
    score += factors.dependencyWeight * weights.dependencies * 0.5; // Scale dependency weight
    score += factors.resourceAvailability * weights.resources * 10; // Scale resource availability
    score += factors.durationFactor * weights.duration * 10; // Scale duration factor

    return score;
  }

  /**
   * Calculate sequence metrics
   */
  private calculateSequenceMetrics(
    sequence: ExecutionSequence,
    tasks: Map<TaskId, Task>,
    dependencyAnalysis: DependencyAnalysisResult
  ): SequenceMetrics {
    const totalExecutionTime = sequence.estimatedDuration;
    const criticalPathDuration = this.calculateCriticalPathDuration(
      sequence.criticalPath,
      tasks
    );

    // Calculate resource utilization
    const resourceUtilization = this.calculateResourceUtilization(
      sequence.parallelGroups,
      tasks
    );

    // Calculate parallelization factor
    const parallelizationFactor = sequence.parallelGroups.length > 0
      ? sequence.parallelGroups.length / sequence.sequence.length
      : 0;

    // Calculate dependency satisfaction
    const dependencySatisfaction = this.calculateDependencySatisfaction(
      sequence,
      dependencyAnalysis.suggestedDependencies
    );

    // Calculate risk assessment
    const riskAssessment = this.calculateRiskAssessment(sequence, tasks, dependencyAnalysis);

    return {
      totalExecutionTime,
      criticalPathDuration,
      resourceUtilization,
      parallelizationFactor,
      dependencySatisfaction,
      riskAssessment,
    };
  }

  // Helper methods (simplified implementations)
  private generateCacheKey(tasks: Map<TaskId, Task>, dependencies: TaskDependency[]): string {
    const taskIds = Array.from(tasks.keys()).sort().join(',');
    const depIds = dependencies.map(d => `${d.dependentTaskId}->${d.dependsOnTaskId}`).sort().join(',');
    return `${taskIds}|${depIds}|${this.config.algorithm}`;
  }

  private calculateSequenceConfidence(
    metrics: SequenceMetrics,
    alternatives: any[]
  ): number {
    // Simplified confidence calculation
    return Math.min(
      0.5 +
      metrics.dependencySatisfaction * 0.2 +
      metrics.resourceUtilization * 0.2 +
      (1 - metrics.riskAssessment) * 0.1,
      1
    );
  }

  private generateSequencingReasoning(
    sequence: ExecutionSequence,
    metrics: SequenceMetrics,
    dependencyAnalysis: DependencyAnalysisResult
  ): string {
    return `Generated sequence using ${sequence.metadata.algorithm} algorithm. ` +
      `Estimated duration: ${Math.round(metrics.totalExecutionTime / 1000)}s, ` +
      `${sequence.parallelGroups.length} parallel groups, ` +
      `${Math.round(metrics.dependencySatisfaction * 100)}% dependency satisfaction, ` +
      `${Math.round(metrics.resourceUtilization * 100)}% resource utilization.`;
  }

  private estimateSuccessProbability(metrics: SequenceMetrics): number {
    // Simplified success probability calculation
    return Math.min(
      0.7 +
      metrics.dependencySatisfaction * 0.2 +
      (1 - metrics.riskAssessment) * 0.1,
      0.99
    );
  }

  private createDefaultContext(): DecisionContext {
    return {
      systemLoad: { cpu: 0.5, memory: 0.6, diskIO: 0.3, networkIO: 0.2 },
      taskQueueState: { totalTasks: 0, pendingTasks: 0, runningTasks: 0, failedTasks: 0, avgProcessingTime: 60000 },
      agentContext: { activeAgents: 1, maxConcurrentAgents: 4, agentCapabilities: {}, agentWorkloads: {} },
      projectState: { buildStatus: 'unknown', testStatus: 'unknown', lintStatus: 'unknown', gitStatus: 'unknown' },
      budgetContext: { currentUsage: 0, costPerToken: 0.001, estimatedCostForTask: 0.1 },
      performanceHistory: { avgSuccessRate: 0.8, avgCompletionTime: 120000, commonFailureReasons: [], peakUsageHours: [] },
      userPreferences: { allowAutonomousDecisions: true, maxConcurrentTasks: 4, criticalTaskNotification: true },
      timestamp: Date.now(),
    };
  }

  private async generateAlternativeSequences(
    tasks: Map<TaskId, Task>,
    dependencyAnalysis: DependencyAnalysisResult,
    context?: DecisionContext
  ): Promise<Array<{
    sequence: ExecutionSequence;
    algorithm: SequencingAlgorithm;
    score: number;
    reason: string;
  }>> {
    const alternatives = [];
    const algorithms = [
      SequencingAlgorithm.CRITICAL_PATH,
      SequencingAlgorithm.PRIORITY_WEIGHTED,
      SequencingAlgorithm.RESOURCE_AWARE,
    ];

    for (const algorithm of algorithms) {
      if (algorithm === this.config.algorithm) continue;

      try {
        const sequence = await this.executeAlgorithm(algorithm, tasks, dependencyAnalysis, context);
        const metrics = this.calculateSequenceMetrics(sequence, tasks, dependencyAnalysis);
        const score = this.calculateAlternativeScore(metrics);

        alternatives.push({
          sequence,
          algorithm,
          score,
          reason: `Alternative using ${algorithm}: ${Math.round(metrics.totalExecutionTime / 1000)}s duration, ${Math.round(metrics.resourceUtilization * 100)}% resource utilization`,
        });
      } catch (error) {
        logger.warn(`Failed to generate alternative sequence with ${algorithm}`, { error });
      }
    }

    return alternatives;
  }

  private calculateAlternativeScore(metrics: SequenceMetrics): number {
    // Simplified scoring for alternatives
    return metrics.resourceUtilization * 0.4 +
           metrics.parallelizationFactor * 0.3 +
           metrics.dependencySatisfaction * 0.2 +
           (1 - metrics.riskAssessment) * 0.1;
  }

  // Placeholder implementations for complex algorithms
  private buildDependencyGraph(tasks: Map<TaskId, Task>, dependencies: TaskDependency[]): Map<TaskId, TaskId[]> {
    const graph = new Map<TaskId, TaskId[]>();
    for (const [taskId] of tasks) {
      graph.set(taskId, []);
    }
    for (const dep of dependencies) {
      const dependents = graph.get(dep.dependsOnTaskId) || [];
      dependents.push(dep.dependentTaskId);
      graph.set(dep.dependsOnTaskId, dependents);
    }
    return graph;
  }

  private calculateCriticalPath(tasks: Map<TaskId, Task>, graph: Map<TaskId, TaskId[]>): TaskId[] {
    // Simplified critical path calculation
    return Array.from(tasks.keys()).slice(0, Math.min(tasks.size, 5));
  }

  private generateParallelGroupsFromGraph(tasks: Map<TaskId, Task>, graph: Map<TaskId, TaskId[]>): TaskId[][] {
    // Simplified parallel group generation
    const taskIds = Array.from(tasks.keys());
    const groups: TaskId[][] = [];
    for (let i = 0; i < taskIds.length; i += 2) {
      groups.push(taskIds.slice(i, i + 2));
    }
    return groups;
  }

  private calculateParallelGroupsDuration(groups: TaskId[][], tasks: Map<TaskId, Task>): number {
    let totalDuration = 0;
    for (const group of groups) {
      let maxGroupDuration = 0;
      for (const taskId of group) {
        const task = tasks.get(taskId);
        if (task) {
          maxGroupDuration = Math.max(maxGroupDuration, task.metadata.estimatedDuration || 60000);
        }
      }
      totalDuration += maxGroupDuration;
    }
    return totalDuration;
  }

  private calculatePriorityScore(task: Task, dependencyAnalysis: DependencyAnalysisResult): number {
    const priorityScores = { critical: 4, high: 3, medium: 2, low: 1 };
    const baseScore = priorityScores[task.priority];

    // Add bonus for tasks with many dependents
    const dependents = dependencyAnalysis.suggestedDependencies
      .filter(dep => dep.dependsOnTaskId === task.id).length;

    return baseScore + dependents * 0.5;
  }

  private generateParallelGroupsRespectingDependencies(
    sequence: TaskId[],
    tasks: Map<TaskId, Task>,
    dependencies: TaskDependency[]
  ): TaskId[][] {
    // Simplified implementation
    const groups: TaskId[][] = [];
    const processed = new Set<TaskId>();

    while (processed.size < sequence.length) {
      const currentGroup: TaskId[] = [];

      for (const taskId of sequence) {
        if (processed.has(taskId)) continue;

        // Check if all dependencies are satisfied
        const taskDeps = dependencies
          .filter(dep => dep.dependentTaskId === taskId)
          .map(dep => dep.dependsOnTaskId);

        const allDepsSatisfied = taskDeps.every(depId => processed.has(depId));

        if (allDepsSatisfied) {
          currentGroup.push(taskId);
        }
      }

      if (currentGroup.length === 0) break; // Avoid infinite loop

      groups.push(currentGroup);
      currentGroup.forEach(id => processed.add(id));
    }

    return groups;
  }

  private findCriticalPathInSequence(
    sequence: TaskId[],
    tasks: Map<TaskId, Task>,
    dependencies: TaskDependency[]
  ): TaskId[] {
    // Simplified critical path finding
    return sequence.slice(0, Math.min(sequence.length, 3));
  }

  private groupTasksByResourceRequirements(tasks: Map<TaskId, Task>): Map<string, Task[]> {
    const groups = new Map<string, Task[]>();

    for (const [taskId, task] of tasks) {
      const resourceKey = task.category; // Simplified grouping by category
      if (!groups.has(resourceKey)) {
        groups.set(resourceKey, []);
      }
      groups.get(resourceKey)!.push(task);
    }

    return groups;
  }

  private optimizeResourceAllocation(
    resourceGroups: Map<string, Task[]>,
    tasks: Map<TaskId, Task>,
    dependencyAnalysis: DependencyAnalysisResult
  ): { sequence: TaskId[]; parallelGroups?: TaskId[][]; estimatedDuration: number } {
    // Simplified resource optimization
    const sequence: TaskId[] = [];

    for (const [resourceType, groupTasks] of resourceGroups) {
      // Sort by priority within each resource group
      const sortedTasks = groupTasks.sort((a, b) => {
        const aPriority = { critical: 4, high: 3, medium: 2, low: 1 }[a.priority];
        const bPriority = { critical: 4, high: 3, medium: 2, low: 1 }[b.priority];
        return bPriority - aPriority;
      });

      sequence.push(...sortedTasks.map(task => task.id));
    }

    const estimatedDuration = sequence.reduce((total, taskId) => {
      const task = tasks.get(taskId);
      return total + (task?.metadata.estimatedDuration || 60000);
    }, 0);

    return { sequence, estimatedDuration };
  }

  private hasDeadline(task: Task): boolean {
    // Check if task has deadline information
    return !!(task.parameters as any)?.deadline || !!(task.metadata.custom as any)?.deadline;
  }

  private getDeadline(task: Task): number {
    // Extract deadline timestamp
    const deadline = (task.parameters as any)?.deadline || (task.metadata.custom as any)?.deadline;
    return typeof deadline === 'number' ? deadline : Date.now() + 24 * 60 * 60 * 1000; // Default 1 day
  }

  private adaptWeightsToContext(context?: DecisionContext): TaskSequencingConfig['weights'] {
    if (!context) return this.config.weights;

    // Adapt weights based on system state
    const adaptedWeights = { ...this.config.weights };

    // If high CPU load, prioritize shorter tasks
    if (context.systemLoad.cpu > 0.8) {
      adaptedWeights.duration *= 1.5;
    }

    // If many pending tasks, prioritize by dependencies
    if (context.taskQueueState.pendingTasks > 10) {
      adaptedWeights.dependencies *= 1.3;
    }

    return adaptedWeights;
  }

  private optimizeTaskGrouping(
    sortedTasks: Task[],
    dependencyAnalysis: DependencyAnalysisResult,
    weights: TaskSequencingConfig['weights']
  ): Task[][] {
    // Simplified task grouping optimization
    const groups: Task[][] = [];
    let currentGroup: Task[] = [];

    for (const task of sortedTasks) {
      if (currentGroup.length === 0 || this.canGroupTogether(task, currentGroup, dependencyAnalysis)) {
        currentGroup.push(task);
      } else {
        if (currentGroup.length > 0) {
          groups.push([...currentGroup]);
        }
        currentGroup = [task];
      }

      // Limit group size
      if (currentGroup.length >= 3) {
        groups.push([...currentGroup]);
        currentGroup = [];
      }
    }

    if (currentGroup.length > 0) {
      groups.push(currentGroup);
    }

    return groups;
  }

  private canGroupTogether(
    task: Task,
    group: Task[],
    dependencyAnalysis: DependencyAnalysisResult
  ): boolean {
    // Check if task can be grouped with others (no dependencies between them)
    for (const groupTask of group) {
      const hasDependency = dependencyAnalysis.suggestedDependencies.some(
        dep => (dep.dependentTaskId === task.id && dep.dependsOnTaskId === groupTask.id) ||
               (dep.dependentTaskId === groupTask.id && dep.dependsOnTaskId === task.id)
      );
      if (hasDependency) return false;
    }
    return true;
  }

  private predictOptimalSequence(
    tasks: Map<TaskId, Task>,
    dependencyAnalysis: DependencyAnalysisResult
  ): Array<{ taskId: TaskId; score: number }> {
    // Simplified ML prediction
    const predictions: Array<{ taskId: TaskId; score: number }> = [];

    for (const [taskId, task] of tasks) {
      const features = this.extractTaskFeatures(task);
      const score = this.predictTaskScore(features);
      predictions.push({ taskId, score });
    }

    return predictions.sort((a, b) => b.score - a.score);
  }

  private extractTaskFeatures(task: Task): number[] {
    // Extract features for ML prediction
    const priorityScore = { critical: 4, high: 3, medium: 2, low: 1 }[task.priority];
    const categoryScore = { implementation: 4, analysis: 3, testing: 2, documentation: 1, refactoring: 3, deployment: 2 }[task.category] || 1;
    const durationScore = Math.min((task.metadata.estimatedDuration || 60000) / 60000, 10); // Normalize

    return [priorityScore, categoryScore, durationScore];
  }

  private predictTaskScore(features: number[]): number {
    // Simplified ML prediction using learned weights
    let score = 0;
    features.forEach((feature, index) => {
      const weight = this.learningModel.get(`feature_${index}`) || 0.5;
      score += feature * weight;
    });
    return score;
  }

  private generateParallelGroupsFromPredictions(
    predictions: Array<{ taskId: TaskId; score: number }>,
    tasks: Map<TaskId, Task>
  ): TaskId[][] {
    // Group predictions into parallel groups
    const groups: TaskId[][] = [];
    const tasksPerGroup = Math.max(1, Math.floor(predictions.length / 3));

    for (let i = 0; i < predictions.length; i += tasksPerGroup) {
      const group = predictions.slice(i, i + tasksPerGroup).map(pred => pred.taskId);
      groups.push(group);
    }

    return groups;
  }

  private calculateCriticalPathDuration(criticalPath: TaskId[], tasks: Map<TaskId, Task>): number {
    return criticalPath.reduce((total, taskId) => {
      const task = tasks.get(taskId);
      return total + (task?.metadata.estimatedDuration || 60000);
    }, 0);
  }

  private calculateResourceUtilization(parallelGroups: TaskId[][], tasks: Map<TaskId, Task>): number {
    // Simplified resource utilization calculation
    if (parallelGroups.length === 0) return 0;

    const avgGroupSize = parallelGroups.reduce((sum, group) => sum + group.length, 0) / parallelGroups.length;
    const maxPossibleParallel = Math.min(tasks.size, 4); // Assume max 4 parallel

    return Math.min(avgGroupSize / maxPossibleParallel, 1);
  }

  private calculateDependencySatisfaction(
    sequence: ExecutionSequence,
    dependencies: TaskDependency[]
  ): number {
    // Check how well the sequence respects dependencies
    let satisfiedDeps = 0;

    for (const dep of dependencies) {
      const dependentIndex = sequence.sequence.indexOf(dep.dependentTaskId);
      const dependsOnIndex = sequence.sequence.indexOf(dep.dependsOnTaskId);

      if (dependentIndex > dependsOnIndex || dependentIndex === -1 || dependsOnIndex === -1) {
        satisfiedDeps++;
      }
    }

    return dependencies.length > 0 ? satisfiedDeps / dependencies.length : 1;
  }

  private calculateRiskAssessment(
    sequence: ExecutionSequence,
    tasks: Map<TaskId, Task>,
    dependencyAnalysis: DependencyAnalysisResult
  ): number {
    // Calculate risk based on conflicts and complexity
    let riskScore = 0;

    // Risk from conflicts
    riskScore += dependencyAnalysis.conflicts.length * 0.1;

    // Risk from critical path length
    const criticalPathRatio = sequence.criticalPath.length / sequence.sequence.length;
    riskScore += criticalPathRatio * 0.2;

    // Risk from high-priority tasks
    const criticalTasks = Array.from(tasks.values()).filter(t => t.priority === 'critical').length;
    riskScore += (criticalTasks / tasks.size) * 0.3;

    return Math.min(riskScore, 1);
  }

  private updateLearningModel(tasks: Map<TaskId, Task>, decision: SequencingDecision): void {
    // Update simple learning model with decision outcomes
    const success = decision.confidence > 0.7;

    if (success) {
      // Increase weights for successful patterns
      for (let i = 0; i < 3; i++) {
        const currentWeight = this.learningModel.get(`feature_${i}`) || 0.5;
        this.learningModel.set(`feature_${i}`, Math.min(currentWeight * 1.1, 2.0));
      }
    }

    logger.debug('Learning model updated', {
      modelSize: this.learningModel.size,
      confidence: decision.confidence,
    });
  }

  /**
   * Record execution history for learning
   */
  recordExecutionHistory(
    taskId: TaskId,
    actualDuration: number,
    resourcesUsed: Map<string, number>,
    success: boolean
  ): void {
    const history: ExecutionHistory = {
      taskId,
      category: 'unknown', // Would be filled from task data
      priority: 'medium', // Would be filled from task data
      estimatedDuration: 60000, // Would be filled from task data
      actualDuration,
      resourcesUsed,
      dependencies: [], // Would be filled from task data
      success,
      timestamp: Date.now(),
    };

    this.executionHistory.set(taskId, history);

    // Limit history size
    if (this.executionHistory.size > 1000) {
      const oldestKey = this.executionHistory.keys().next().value;
      this.executionHistory.delete(oldestKey);
    }

    logger.debug('Execution history recorded', { taskId, success, duration: actualDuration });
  }

  /**
   * Get sequence statistics
   */
  getStatistics(): {
    totalSequencesGenerated: number;
    cacheHitRate: number;
    averageOptimizationTime: number;
    learningModelSize: number;
  } {
    return {
      totalSequencesGenerated: this.sequenceCache.size,
      cacheHitRate: 0.75, // Mock value
      averageOptimizationTime: 2500, // Mock value
      learningModelSize: this.learningModel.size,
    };
  }
}

/**
 * Zod schemas for validation
 */
export const TaskSequencingConfigSchema = z.object({
  algorithm: z.nativeEnum(SequencingAlgorithm),
  weights: z.object({
    priority: z.number().min(0).max(1),
    duration: z.number().min(0).max(1),
    dependencies: z.number().min(0).max(1),
    resources: z.number().min(0).max(1),
    deadline: z.number().min(0).max(1),
  }),
  enableDynamicResequencing: z.boolean(),
  maxOptimizationTime: z.number().min(1000).max(30000),
  enablePredictiveScheduling: z.boolean(),
  resourcePools: z.map(z.string(), z.number().min(0)),
});

export const SequenceMetricsSchema = z.object({
  totalExecutionTime: z.number().min(0),
  criticalPathDuration: z.number().min(0),
  resourceUtilization: z.number().min(0).max(1),
  parallelizationFactor: z.number().min(0).max(1),
  dependencySatisfaction: z.number().min(0).max(1),
  riskAssessment: z.number().min(0).max(1),
});