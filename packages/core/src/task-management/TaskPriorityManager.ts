/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { EventEmitter } from 'node:events';
import { logger } from '../utils/logger.js';
import type { Task, TaskPriority, PriorityFactors } from './TaskQueue.js';
import { TaskCategory, TaskStatus } from './TaskQueue.js';

/**
 * Advanced priority calculation algorithms
 */
export enum PriorityAlgorithm {
  WEIGHTED_FACTORS = 'weighted_factors',
  URGENCY_IMPACT_MATRIX = 'urgency_impact_matrix',
  DEPENDENCY_CRITICAL_PATH = 'dependency_critical_path',
  RESOURCE_OPTIMIZATION = 'resource_optimization',
  MACHINE_LEARNING = 'machine_learning',
}

/**
 * Priority calculation configuration
 */
export interface PriorityCalculationConfig {
  algorithm: PriorityAlgorithm;
  weights: {
    age: number;
    userImportance: number;
    systemCriticality: number;
    dependencyWeight: number;
    resourceAvailability: number;
    executionHistory: number;
    deadlinePressure: number;
    businessValue: number;
    riskFactor: number;
  };
  boostFactors: {
    criticalPathMultiplier: number;
    blockingTaskMultiplier: number;
    expiredDeadlineMultiplier: number;
    resourceStarvedMultiplier: number;
  };
  decayFactors: {
    failureDecayRate: number;
    staleTaskDecayRate: number;
    resourceContentionDecayRate: number;
  };
}

/**
 * Priority adjustment reason for auditing
 */
export interface PriorityAdjustmentReason {
  factor: string;
  oldValue: number;
  newValue: number;
  influence: number;
  reasoning: string;
  timestamp: Date;
}

/**
 * Priority calculation result with audit trail
 */
export interface PriorityCalculationResult {
  taskId: string;
  oldPriority: number;
  newPriority: number;
  algorithm: PriorityAlgorithm;
  factors: PriorityFactors;
  adjustmentReasons: PriorityAdjustmentReason[];
  confidence: number;
  calculationTime: number;
  metadata: Record<string, unknown>;
}

/**
 * Task priority statistics for analytics
 */
export interface PriorityStatistics {
  averagePriority: number;
  priorityDistribution: Record<TaskPriority, number>;
  categoryPriorityAverages: Record<TaskCategory, number>;
  priorityVolatility: number; // How often priorities change
  adjustmentFrequency: number; // Adjustments per hour
  topPriorityFactors: Array<{
    factor: string;
    influence: number;
    frequency: number;
  }>;
}

/**
 * Advanced Task Priority Manager with intelligent scheduling algorithms
 *
 * Features:
 * - Multiple priority calculation algorithms
 * - Dynamic priority adjustment with audit trails
 * - Machine learning-based priority prediction
 * - Critical path and dependency analysis
 * - Resource optimization prioritization
 * - Business value and risk factor integration
 */
export class TaskPriorityManager extends EventEmitter {
  private config: PriorityCalculationConfig;
  private priorityHistory = new Map<string, PriorityCalculationResult[]>();
  private factorLearningData = new Map<
    string,
    Array<{ factors: PriorityFactors; outcome: 'success' | 'failure' }>
  >();
  private statistics: PriorityStatistics;

  constructor(config: Partial<PriorityCalculationConfig> = {}) {
    super();

    this.config = {
      algorithm: config.algorithm ?? PriorityAlgorithm.WEIGHTED_FACTORS,
      weights: {
        age: config.weights?.age ?? 1.0,
        userImportance: config.weights?.userImportance ?? 2.0,
        systemCriticality: config.weights?.systemCriticality ?? 1.5,
        dependencyWeight: config.weights?.dependencyWeight ?? 1.8,
        resourceAvailability: config.weights?.resourceAvailability ?? 1.2,
        executionHistory: config.weights?.executionHistory ?? 0.8,
        deadlinePressure: config.weights?.deadlinePressure ?? 2.5,
        businessValue: config.weights?.businessValue ?? 2.0,
        riskFactor: config.weights?.riskFactor ?? 1.3,
        ...config.weights,
      },
      boostFactors: {
        criticalPathMultiplier:
          config.boostFactors?.criticalPathMultiplier ?? 1.5,
        blockingTaskMultiplier:
          config.boostFactors?.blockingTaskMultiplier ?? 1.3,
        expiredDeadlineMultiplier:
          config.boostFactors?.expiredDeadlineMultiplier ?? 2.0,
        resourceStarvedMultiplier:
          config.boostFactors?.resourceStarvedMultiplier ?? 1.4,
        ...config.boostFactors,
      },
      decayFactors: {
        failureDecayRate: config.decayFactors?.failureDecayRate ?? 0.1,
        staleTaskDecayRate: config.decayFactors?.staleTaskDecayRate ?? 0.05,
        resourceContentionDecayRate:
          config.decayFactors?.resourceContentionDecayRate ?? 0.15,
        ...config.decayFactors,
      },
    };

    this.statistics = {
      averagePriority: 0,
      priorityDistribution: {} as Record<TaskPriority, number>,
      categoryPriorityAverages: {} as Record<TaskCategory, number>,
      priorityVolatility: 0,
      adjustmentFrequency: 0,
      topPriorityFactors: [],
    };

    logger().info('TaskPriorityManager initialized', {
      algorithm: this.config.algorithm,
      weights: Object.keys(this.config.weights).length,
      boostFactors: Object.keys(this.config.boostFactors).length,
    });
  }

  /**
   * Calculate dynamic priority for a task using the configured algorithm
   */
  async calculatePriority(
    task: Task,
    allTasks: Task[],
    dependencyGraph?: Map<string, string[]>,
  ): Promise<PriorityCalculationResult> {
    const startTime = Date.now();
    const oldPriority = task.dynamicPriority;

    logger().debug(
      `Calculating priority for task ${task.id} using ${this.config.algorithm}`,
      {
        taskTitle: task.title,
        basePriority: task.basePriority,
        currentPriority: task.dynamicPriority,
      },
    );

    let adjustmentReasons: PriorityAdjustmentReason[] = [];

    let newPriority: number;
    let confidence = 0.8; // Default confidence

    switch (this.config.algorithm) {
      case PriorityAlgorithm.WEIGHTED_FACTORS:
        ({
          priority: newPriority,
          confidence,
          reasons: adjustmentReasons,
        } = this.calculateWeightedFactorsPriority(
          task,
          allTasks,
          adjustmentReasons,
        ));
        break;

      case PriorityAlgorithm.URGENCY_IMPACT_MATRIX:
        ({
          priority: newPriority,
          confidence,
          reasons: adjustmentReasons,
        } = this.calculateUrgencyImpactPriority(
          task,
          allTasks,
          adjustmentReasons,
        ));
        break;

      case PriorityAlgorithm.DEPENDENCY_CRITICAL_PATH:
        ({
          priority: newPriority,
          confidence,
          reasons: adjustmentReasons,
        } = this.calculateCriticalPathPriority(
          task,
          allTasks,
          dependencyGraph,
          adjustmentReasons,
        ));
        break;

      case PriorityAlgorithm.RESOURCE_OPTIMIZATION:
        ({
          priority: newPriority,
          confidence,
          reasons: adjustmentReasons,
        } = this.calculateResourceOptimizedPriority(
          task,
          allTasks,
          adjustmentReasons,
        ));
        break;

      case PriorityAlgorithm.MACHINE_LEARNING:
        ({
          priority: newPriority,
          confidence,
          reasons: adjustmentReasons,
        } = await this.calculateMLPriority(task, allTasks, adjustmentReasons));
        break;

      default:
        newPriority = task.basePriority;
        confidence = 0.5;
    }

    // Apply bounds and sanity checks
    newPriority = Math.max(1, Math.min(2000, newPriority));

    // Update task priority
    task.dynamicPriority = newPriority;

    const calculationTime = Date.now() - startTime;

    const result: PriorityCalculationResult = {
      taskId: task.id,
      oldPriority,
      newPriority,
      algorithm: this.config.algorithm,
      factors: { ...task.priorityFactors },
      adjustmentReasons,
      confidence,
      calculationTime,
      metadata: {
        taskTitle: task.title,
        category: task.category,
        basePriority: task.basePriority,
      },
    };

    // Store in history for learning and auditing
    this.storePriorityCalculation(result);

    // Update statistics
    this.updateStatistics();

    // Emit event for monitoring
    this.emit('priorityCalculated', result);

    logger().debug(`Priority calculated for task ${task.id}`, {
      oldPriority,
      newPriority,
      change:
        (((newPriority - oldPriority) / oldPriority) * 100).toFixed(1) + '%',
      confidence,
      calculationTime,
    });

    return result;
  }

  /**
   * Weighted factors priority calculation (baseline algorithm)
   */
  private calculateWeightedFactorsPriority(
    task: Task,
    allTasks: Task[],
    reasons: PriorityAdjustmentReason[],
  ): {
    priority: number;
    confidence: number;
    reasons: PriorityAdjustmentReason[];
  } {
    let priority = task.basePriority;

    // Age factor - older tasks get priority boost
    const ageMs = Date.now() - task.createdAt.getTime();
    const ageHours = ageMs / (1000 * 60 * 60);
    const ageFactor = Math.min(2.0, 1 + ageHours / 24);

    priority *= 1 + (ageFactor - 1) * this.config.weights.age;
    reasons.push({
      factor: 'age',
      oldValue: 1.0,
      newValue: ageFactor,
      influence: (ageFactor - 1) * this.config.weights.age,
      reasoning: `Task has been waiting ${ageHours.toFixed(1)} hours`,
      timestamp: new Date(),
    });

    // Deadline pressure
    if (task.deadline) {
      const timeToDeadline = task.deadline.getTime() - Date.now();
      const deadlinePressure = Math.max(
        0.5,
        1 - timeToDeadline / (7 * 24 * 60 * 60 * 1000),
      );

      priority *= 1 + deadlinePressure * this.config.weights.deadlinePressure;
      reasons.push({
        factor: 'deadline',
        oldValue: 1.0,
        newValue: deadlinePressure,
        influence: deadlinePressure * this.config.weights.deadlinePressure,
        reasoning: `Deadline in ${Math.round(timeToDeadline / (24 * 60 * 60 * 1000))} days`,
        timestamp: new Date(),
      });
    }

    // Dependency weight - tasks blocking others get higher priority
    const blockedTasksCount = task.dependents.filter((depId) => {
      const depTask = allTasks.find((t) => t.id === depId);
      return depTask?.status === TaskStatus.PENDING;
    }).length;

    const depWeight = 1 + blockedTasksCount * 0.1;
    priority *= 1 + (depWeight - 1) * this.config.weights.dependencyWeight;

    if (blockedTasksCount > 0) {
      reasons.push({
        factor: 'dependencies',
        oldValue: 1.0,
        newValue: depWeight,
        influence: (depWeight - 1) * this.config.weights.dependencyWeight,
        reasoning: `Blocking ${blockedTasksCount} other tasks`,
        timestamp: new Date(),
      });
    }

    // User importance and system criticality
    priority *=
      task.priorityFactors.userImportance * this.config.weights.userImportance;
    priority *=
      task.priorityFactors.systemCriticality *
      this.config.weights.systemCriticality;

    // Resource availability factor
    priority *=
      task.priorityFactors.resourceAvailability *
      this.config.weights.resourceAvailability;

    // Execution history factor
    priority *=
      task.priorityFactors.executionHistory *
      this.config.weights.executionHistory;

    return {
      priority,
      confidence: 0.85,
      reasons,
    };
  }

  /**
   * Urgency-Impact matrix priority calculation
   */
  private calculateUrgencyImpactPriority(
    task: Task,
    allTasks: Task[],
    reasons: PriorityAdjustmentReason[],
  ): {
    priority: number;
    confidence: number;
    reasons: PriorityAdjustmentReason[];
  } {
    // Calculate urgency (0-1 scale)
    let urgency = 0.5; // Default medium urgency

    if (task.deadline) {
      const timeToDeadline = task.deadline.getTime() - Date.now();
      const daysTillDeadline = timeToDeadline / (24 * 60 * 60 * 1000);

      if (daysTillDeadline <= 0)
        urgency = 1.0; // Overdue
      else if (daysTillDeadline <= 1)
        urgency = 0.9; // Critical
      else if (daysTillDeadline <= 3)
        urgency = 0.7; // High
      else if (daysTillDeadline <= 7)
        urgency = 0.5; // Medium
      else urgency = 0.3; // Low
    }

    // Factor in age for urgency
    const ageHours = (Date.now() - task.createdAt.getTime()) / (1000 * 60 * 60);
    if (ageHours > 24)
      urgency = Math.min(1.0, urgency + 0.1 * Math.floor(ageHours / 24));

    // Calculate impact (0-1 scale)
    let impact = 0.5; // Default medium impact

    // Business value impact
    const businessValue = Number(task.metadata.businessValue) || 0;
    impact = Math.max(impact, businessValue / 100); // Normalize business value

    // Dependency impact - how many tasks depend on this
    const dependentCount = task.dependents.length;
    const dependencyImpact = Math.min(1.0, dependentCount / 10);
    impact = Math.max(impact, dependencyImpact);

    // Category-based impact
    const categoryImpactMap = {
      [TaskCategory.SECURITY]: 0.9,
      [TaskCategory.BUG_FIX]: 0.8,
      [TaskCategory.PERFORMANCE]: 0.7,
      [TaskCategory.FEATURE]: 0.6,
      [TaskCategory.REFACTOR]: 0.4,
      [TaskCategory.TEST]: 0.5,
      [TaskCategory.DOCUMENTATION]: 0.3,
      [TaskCategory.INFRASTRUCTURE]: 0.7,
    };

    impact = Math.max(impact, categoryImpactMap[task.category] || 0.5);

    // Calculate priority using urgency-impact matrix
    // Matrix: High Impact + High Urgency = Highest Priority
    const priority =
      task.basePriority * (1 + urgency + impact + urgency * impact);

    reasons.push(
      {
        factor: 'urgency',
        oldValue: 0.5,
        newValue: urgency,
        influence: urgency,
        reasoning: task.deadline
          ? `Deadline urgency: ${urgency}`
          : `Age-based urgency: ${urgency}`,
        timestamp: new Date(),
      },
      {
        factor: 'impact',
        oldValue: 0.5,
        newValue: impact,
        influence: impact,
        reasoning: `Business and dependency impact: ${impact}`,
        timestamp: new Date(),
      },
    );

    return {
      priority,
      confidence: 0.9,
      reasons,
    };
  }

  /**
   * Critical path dependency-aware priority calculation
   */
  private calculateCriticalPathPriority(
    task: Task,
    allTasks: Task[],
    dependencyGraph: Map<string, string[]> | undefined,
    reasons: PriorityAdjustmentReason[],
  ): {
    priority: number;
    confidence: number;
    reasons: PriorityAdjustmentReason[];
  } {
    let priority = task.basePriority;

    if (!dependencyGraph) {
      // Build simple dependency graph
      dependencyGraph = new Map();
      for (const t of allTasks) {
        dependencyGraph.set(t.id, t.dependents);
      }
    }

    // Calculate critical path length (longest chain of dependent tasks)
    const criticalPathLength = this.calculateCriticalPathLength(
      task.id,
      dependencyGraph,
      allTasks,
    );

    // Tasks on longer critical paths get higher priority
    const pathMultiplier = 1 + criticalPathLength * 0.1;
    priority *= pathMultiplier;

    if (criticalPathLength > 0) {
      reasons.push({
        factor: 'criticalPath',
        oldValue: 1.0,
        newValue: pathMultiplier,
        influence: pathMultiplier - 1,
        reasoning: `On critical path with length ${criticalPathLength}`,
        timestamp: new Date(),
      });
    }

    // Boost tasks that are blocking many others
    const blockingCount = task.dependents.length;
    if (blockingCount > 0) {
      const blockingMultiplier =
        this.config.boostFactors.blockingTaskMultiplier *
        Math.log(blockingCount + 1);
      priority *= blockingMultiplier;

      reasons.push({
        factor: 'blocking',
        oldValue: 1.0,
        newValue: blockingMultiplier,
        influence: blockingMultiplier - 1,
        reasoning: `Blocking ${blockingCount} tasks`,
        timestamp: new Date(),
      });
    }

    // Boost tasks with expired deadlines exponentially
    if (task.deadline && task.deadline.getTime() < Date.now()) {
      const overdueDays =
        (Date.now() - task.deadline.getTime()) / (24 * 60 * 60 * 1000);
      const overdueMultiplier =
        this.config.boostFactors.expiredDeadlineMultiplier *
        Math.pow(1.1, overdueDays);
      priority *= overdueMultiplier;

      reasons.push({
        factor: 'overdue',
        oldValue: 1.0,
        newValue: overdueMultiplier,
        influence: overdueMultiplier - 1,
        reasoning: `Overdue by ${overdueDays.toFixed(1)} days`,
        timestamp: new Date(),
      });
    }

    return {
      priority,
      confidence: 0.85,
      reasons,
    };
  }

  /**
   * Resource-optimized priority calculation
   */
  private calculateResourceOptimizedPriority(
    task: Task,
    allTasks: Task[],
    reasons: PriorityAdjustmentReason[],
  ): {
    priority: number;
    confidence: number;
    reasons: PriorityAdjustmentReason[];
  } {
    let priority = task.basePriority;

    // Calculate resource contention score
    const resourceContention = this.calculateResourceContention(task, allTasks);

    if (resourceContention.score > 0.5) {
      // High contention - lower priority unless critical
      const contentionPenalty =
        1 -
        resourceContention.score *
          this.config.decayFactors.resourceContentionDecayRate;
      priority *= contentionPenalty;

      reasons.push({
        factor: 'resourceContention',
        oldValue: 1.0,
        newValue: contentionPenalty,
        influence: contentionPenalty - 1,
        reasoning: `High resource contention (${(resourceContention.score * 100).toFixed(0)}%)`,
        timestamp: new Date(),
      });
    }

    // Boost resource-starved tasks
    if (task.priorityFactors.resourceAvailability < 0.5) {
      const starvationBoost =
        this.config.boostFactors.resourceStarvedMultiplier;
      priority *= starvationBoost;

      reasons.push({
        factor: 'resourceStarvation',
        oldValue: 1.0,
        newValue: starvationBoost,
        influence: starvationBoost - 1,
        reasoning: 'Task has been resource-starved',
        timestamp: new Date(),
      });
    }

    // Consider resource efficiency
    const estimatedResourceUsage =
      Number(task.metadata.estimatedResourceUsage) || 1;
    const resourceEfficiency = 1 / Math.log(estimatedResourceUsage + 1);
    priority *= resourceEfficiency;

    reasons.push({
      factor: 'resourceEfficiency',
      oldValue: 1.0,
      newValue: resourceEfficiency,
      influence: resourceEfficiency - 1,
      reasoning: `Resource efficiency factor based on usage estimate`,
      timestamp: new Date(),
    });

    return {
      priority,
      confidence: 0.8,
      reasons,
    };
  }

  /**
   * Machine learning-based priority calculation
   */
  private async calculateMLPriority(
    task: Task,
    allTasks: Task[],
    reasons: PriorityAdjustmentReason[],
  ): Promise<{
    priority: number;
    confidence: number;
    reasons: PriorityAdjustmentReason[];
  }> {
    // Get historical data for similar tasks
    const similarTasksData = this.factorLearningData.get(task.category) || [];

    if (similarTasksData.length < 10) {
      // Not enough data, fall back to weighted factors
      logger().debug('Insufficient ML data, falling back to weighted factors');
      return this.calculateWeightedFactorsPriority(task, allTasks, reasons);
    }

    // Calculate feature weights based on historical success/failure
    const featureWeights = this.calculateMLFeatureWeights(similarTasksData);

    // Calculate prediction
    let priority = task.basePriority;

    Object.entries(featureWeights).forEach(([feature, weight]) => {
      const factorValue =
        task.priorityFactors[feature as keyof PriorityFactors] || 1.0;
      priority *= 1 + (factorValue - 1) * weight;

      reasons.push({
        factor: `ml_${feature}`,
        oldValue: 1.0,
        newValue: factorValue,
        influence: (factorValue - 1) * weight,
        reasoning: `ML-derived weight for ${feature}: ${weight.toFixed(3)}`,
        timestamp: new Date(),
      });
    });

    // Calculate confidence based on data quality and model performance
    const confidence = Math.min(0.95, 0.5 + similarTasksData.length / 100);

    return {
      priority,
      confidence,
      reasons,
    };
  }

  /**
   * Calculate critical path length for a task
   */
  private calculateCriticalPathLength(
    taskId: string,
    dependencyGraph: Map<string, string[]>,
    allTasks: Task[],
    visited = new Set<string>(),
  ): number {
    if (visited.has(taskId)) {
      return 0; // Avoid cycles
    }

    visited.add(taskId);
    const dependents = dependencyGraph.get(taskId) || [];

    if (dependents.length === 0) {
      return 0; // Leaf node
    }

    let maxPath = 0;
    for (const dependentId of dependents) {
      const dependentTask = allTasks.find((t) => t.id === dependentId);
      if (dependentTask && dependentTask.status === TaskStatus.PENDING) {
        const pathLength =
          1 +
          this.calculateCriticalPathLength(
            dependentId,
            dependencyGraph,
            allTasks,
            new Set(visited),
          );
        maxPath = Math.max(maxPath, pathLength);
      }
    }

    return maxPath;
  }

  /**
   * Calculate resource contention for a task
   */
  private calculateResourceContention(
    task: Task,
    allTasks: Task[],
  ): { score: number; conflicts: string[] } {
    const conflicts: string[] = [];
    let totalContention = 0;

    const runningTasks = allTasks.filter(
      (t) => t.status === TaskStatus.RUNNING,
    );

    for (const resource of task.requiredResources) {
      let resourceContention = 0;

      for (const runningTask of runningTasks) {
        if (runningTask.requiredResources.includes(resource)) {
          resourceContention++;
          conflicts.push(`${resource} (conflict with ${runningTask.id})`);
        }
      }

      totalContention += resourceContention;
    }

    const score =
      task.requiredResources.length > 0
        ? totalContention /
          (task.requiredResources.length * runningTasks.length)
        : 0;

    return { score: Math.min(1, score), conflicts };
  }

  /**
   * Calculate ML feature weights from historical data
   */
  private calculateMLFeatureWeights(
    data: Array<{ factors: PriorityFactors; outcome: 'success' | 'failure' }>,
  ): Record<string, number> {
    const weights: Record<string, number> = {};
    const factorNames = [
      'age',
      'userImportance',
      'systemCriticality',
      'dependencyWeight',
      'resourceAvailability',
      'executionHistory',
    ];

    for (const factor of factorNames) {
      const successValues = data
        .filter((d) => d.outcome === 'success')
        .map((d) => d.factors[factor as keyof PriorityFactors]);
      const failureValues = data
        .filter((d) => d.outcome === 'failure')
        .map((d) => d.factors[factor as keyof PriorityFactors]);

      if (successValues.length === 0 || failureValues.length === 0) {
        weights[factor] = 1.0; // Default weight
        continue;
      }

      const successAvg =
        successValues.reduce((a, b) => a + b, 0) / successValues.length;
      const failureAvg =
        failureValues.reduce((a, b) => a + b, 0) / failureValues.length;

      // Higher success average vs failure average = higher weight
      const ratio = successAvg / (failureAvg + 0.001); // Avoid division by zero
      weights[factor] = Math.min(3.0, Math.max(0.1, ratio));
    }

    return weights;
  }

  /**
   * Store priority calculation for learning and auditing
   */
  private storePriorityCalculation(result: PriorityCalculationResult): void {
    const history = this.priorityHistory.get(result.taskId) || [];
    history.push(result);

    // Keep only recent history (last 50 calculations)
    if (history.length > 50) {
      history.shift();
    }

    this.priorityHistory.set(result.taskId, history);
  }

  /**
   * Learn from task execution outcome
   */
  learnFromExecution(
    taskId: string,
    outcome: 'success' | 'failure',
    task: Task,
  ): void {
    const categoryData = this.factorLearningData.get(task.category) || [];

    categoryData.push({
      factors: { ...task.priorityFactors },
      outcome,
    });

    // Keep learning data manageable
    if (categoryData.length > 1000) {
      categoryData.splice(0, 100); // Remove oldest 100 entries
    }

    this.factorLearningData.set(task.category, categoryData);

    logger().debug(`Learning data updated for category ${task.category}`, {
      outcome,
      dataPoints: categoryData.length,
    });
  }

  /**
   * Update statistics
   */
  private updateStatistics(): void {
    const allResults = Array.from(this.priorityHistory.values()).flat();

    if (allResults.length === 0) return;

    // Calculate average priority
    this.statistics.averagePriority =
      allResults.reduce((sum, r) => sum + r.newPriority, 0) / allResults.length;

    // Calculate priority volatility (how much priorities change)
    const priorityChanges = allResults.map(
      (r) => Math.abs(r.newPriority - r.oldPriority) / r.oldPriority,
    );
    this.statistics.priorityVolatility =
      priorityChanges.reduce((sum, change) => sum + change, 0) /
      priorityChanges.length;

    // Calculate adjustment frequency (recent hour)
    const hourAgo = Date.now() - 60 * 60 * 1000;
    const recentAdjustments = allResults.filter((r) =>
      r.adjustmentReasons.some(
        (reason) => reason.timestamp.getTime() > hourAgo,
      ),
    );
    this.statistics.adjustmentFrequency = recentAdjustments.length;

    // Calculate top priority factors
    const factorInfluences = new Map<
      string,
      { totalInfluence: number; count: number }
    >();

    for (const result of allResults.slice(-100)) {
      // Last 100 results
      for (const reason of result.adjustmentReasons) {
        const current = factorInfluences.get(reason.factor) || {
          totalInfluence: 0,
          count: 0,
        };
        current.totalInfluence += Math.abs(reason.influence);
        current.count++;
        factorInfluences.set(reason.factor, current);
      }
    }

    this.statistics.topPriorityFactors = Array.from(factorInfluences.entries())
      .map(([factor, data]) => ({
        factor,
        influence: data.totalInfluence / data.count,
        frequency: data.count,
      }))
      .sort((a, b) => b.influence - a.influence)
      .slice(0, 10);
  }

  /**
   * Get priority statistics
   */
  getStatistics(): PriorityStatistics {
    return { ...this.statistics };
  }

  /**
   * Get priority history for a task
   */
  getPriorityHistory(taskId: string): PriorityCalculationResult[] {
    return [...(this.priorityHistory.get(taskId) || [])];
  }

  /**
   * Update priority calculation configuration
   */
  updateConfiguration(newConfig: Partial<PriorityCalculationConfig>): void {
    this.config = {
      ...this.config,
      ...newConfig,
      weights: { ...this.config.weights, ...newConfig.weights },
      boostFactors: { ...this.config.boostFactors, ...newConfig.boostFactors },
      decayFactors: { ...this.config.decayFactors, ...newConfig.decayFactors },
    };

    logger().info('Priority calculation configuration updated', {
      algorithm: this.config.algorithm,
      weightsUpdated: Object.keys(newConfig.weights || {}).length,
      boostFactorsUpdated: Object.keys(newConfig.boostFactors || {}).length,
    });

    this.emit('configurationUpdated', this.config);
  }

  /**
   * Get current configuration
   */
  getConfiguration(): PriorityCalculationConfig {
    return { ...this.config };
  }
}
