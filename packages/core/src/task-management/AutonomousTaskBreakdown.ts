/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { EventEmitter } from 'node:events';
import { logger as createLogger } from '../utils/logger.js';
import type { Task, TaskContext, TaskExecutionResult } from './TaskQueue.js';
import { TaskCategory, TaskPriority } from './TaskQueue.js';

const logger = createLogger();

/**
 * Task complexity analysis metrics
 */
export interface ComplexityMetrics {
  estimatedDuration: number;
  resourceRequirements: number;
  dependencyComplexity: number;
  riskFactors: number;
  parallelizationOpportunity: number;
  overallComplexity: 'low' | 'medium' | 'high' | 'extreme';
}

/**
 * Subtask breakdown strategy
 */
export enum BreakdownStrategy {
  TEMPORAL = 'temporal', // Break by time phases
  FUNCTIONAL = 'functional', // Break by functional components
  DEPENDENCY = 'dependency', // Break by dependency chains
  RESOURCE = 'resource', // Break by resource requirements
  RISK_BASED = 'risk_based', // Break by risk levels
  HYBRID = 'hybrid', // Combination approach
}

/**
 * Subtask definition
 */
export interface SubTask {
  id: string;
  parentTaskId: string;
  title: string;
  description: string;
  category: TaskCategory;
  priority: TaskPriority;

  // Execution details
  estimatedDuration: number;
  dependencies: string[];
  dependents: string[];

  // Context and execution
  executeFunction: (
    task: Task,
    context: TaskContext,
  ) => Promise<TaskExecutionResult>;
  validateFunction?: (task: Task, context: TaskContext) => Promise<boolean>;
  rollbackFunction?: (task: Task, context: TaskContext) => Promise<void>;

  // Metadata
  metadata?: Record<string, unknown>;
  breakdownStrategy: BreakdownStrategy;
  sequenceOrder: number;
  canRunInParallel: boolean;
  qualityGates: string[];

  // Risk and validation
  riskLevel: 'low' | 'medium' | 'high';
  validationCriteria: string[];
  rollbackRequired: boolean;
}

/**
 * Task breakdown result
 */
export interface TaskBreakdownResult {
  originalTask: Task;
  subtasks: SubTask[];
  breakdownStrategy: BreakdownStrategy;
  expectedImprovement: {
    parallelization: number; // 0-1 scale
    riskReduction: number; // 0-1 scale
    resourceEfficiency: number; // 0-1 scale
    monitorability: number; // 0-1 scale
  };
  metadata: {
    complexityReduction: number;
    totalSubtasks: number;
    parallelGroups: number;
    criticalPath: string[];
    estimatedSpeedup: number;
  };
}

/**
 * Component/Link/Group structure for breakdown
 */
interface BreakdownComponent {
  id: string;
  name: string;
  description?: string;
  complexityWeight?: number;
  criticality?: string;
  dependencies?: string[];
  canRunInParallel?: boolean;
  qualityGates?: string[];
  riskLevel?: 'low' | 'medium' | 'high';
  validationCriteria?: string[];
  rollbackRequired?: boolean;
  resources?: unknown[];
  importance?: string;
  estimatedDuration?: number;
  prerequisites?: string[];
}

/**
 * Breakdown configuration
 */
export interface BreakdownConfig {
  maxSubtasks: number;
  minSubtaskDuration: number; // Milliseconds
  maxSubtaskDuration: number; // Milliseconds
  complexityThreshold: number; // 0-1 scale
  parallelizationPreference: number; // 0-1 scale
  riskTolerance: number; // 0-1 scale
  enableSmartBreakdown: boolean;
  strategies: BreakdownStrategy[];
}

/**
 * Task breakdown templates for common patterns
 */
export interface BreakdownTemplate {
  id: string;
  name: string;
  description: string;
  applicableCategories: TaskCategory[];
  strategy: BreakdownStrategy;
  template: (task: Task) => SubTask[];
}

/**
 * Autonomous Task Breakdown Engine
 * Automatically decomposes complex tasks into optimized subtasks
 */
export class AutonomousTaskBreakdown extends EventEmitter {
  private config: BreakdownConfig;
  private templates = new Map<string, BreakdownTemplate>();
  private breakdownHistory = new Map<string, TaskBreakdownResult>();
  private performanceMetrics = {
    totalBreakdowns: 0,
    successfulBreakdowns: 0,
    averageSpeedup: 0,
    complexityReduction: 0,
    parallelizationGain: 0,
  };

  // Machine learning data for smart breakdown
  private learningData: Array<{
    originalTask: Task;
    breakdown: TaskBreakdownResult;
    actualOutcome: {
      executionTime: number;
      successRate: number;
      parallelization: number;
      resourceEfficiency: number;
    };
    timestamp: Date;
  }> = [];

  constructor(config: Partial<BreakdownConfig> = {}) {
    super();

    this.config = {
      maxSubtasks: 15,
      minSubtaskDuration: 30000, // 30 seconds
      maxSubtaskDuration: 900000, // 15 minutes
      complexityThreshold: 0.7,
      parallelizationPreference: 0.8,
      riskTolerance: 0.6,
      enableSmartBreakdown: true,
      strategies: [
        BreakdownStrategy.FUNCTIONAL,
        BreakdownStrategy.TEMPORAL,
        BreakdownStrategy.DEPENDENCY,
        BreakdownStrategy.HYBRID,
      ],
      ...config,
    };

    this.initializeBreakdownTemplates();

    logger.info('AutonomousTaskBreakdown initialized', {
      config: this.config,
      templatesLoaded: this.templates.size,
    });
  }

  /**
   * Main method: Analyze task and perform autonomous breakdown if beneficial
   */
  async analyzeAndBreakdown(task: Task): Promise<TaskBreakdownResult | null> {
    logger.debug('Analyzing task for breakdown', {
      taskId: task.id,
      title: task.title,
      category: task.category,
      estimatedDuration: task.estimatedDuration,
    });

    // Analyze task complexity
    const complexity = this.analyzeTaskComplexity(task);

    logger.debug('Task complexity analysis completed', {
      taskId: task.id,
      complexity: complexity.overallComplexity,
      estimatedDuration: complexity.estimatedDuration,
      resourceRequirements: complexity.resourceRequirements,
    });

    // Determine if breakdown is beneficial
    const shouldBreakdown = this.shouldBreakdownTask(task, complexity);

    if (!shouldBreakdown) {
      logger.debug('Task breakdown not beneficial', {
        taskId: task.id,
        complexity: complexity.overallComplexity,
      });
      return null;
    }

    // Select optimal breakdown strategy
    const strategy = await this.selectBreakdownStrategy(task, complexity);

    // Perform the breakdown
    const breakdownResult = await this.performBreakdown(
      task,
      strategy,
      complexity,
    );

    // Validate and optimize the breakdown
    const optimizedResult = await this.optimizeBreakdown(breakdownResult);

    // Store breakdown for learning
    this.breakdownHistory.set(task.id, optimizedResult);
    this.updatePerformanceMetrics(optimizedResult);

    logger.info('Task breakdown completed', {
      taskId: task.id,
      strategy: optimizedResult.breakdownStrategy,
      subtaskCount: optimizedResult.subtasks.length,
      expectedSpeedup: optimizedResult.metadata.estimatedSpeedup,
      parallelGroups: optimizedResult.metadata.parallelGroups,
    });

    this.emit('taskBreakdownCompleted', optimizedResult);

    return optimizedResult;
  }

  /**
   * Analyze task complexity to determine breakdown necessity
   */
  private analyzeTaskComplexity(task: Task): ComplexityMetrics {
    const duration = task.estimatedDuration || 60000;
    const resources = task.requiredResources?.length || 0;
    const dependencies = task.dependencies?.length || 0;
    const retries = task.currentRetries || 0;

    // Complexity scoring (0-1 scale)
    const durationScore = Math.min(1, duration / (2 * 60 * 60 * 1000)); // 2 hours = max
    const resourceScore = Math.min(1, resources / 5); // 5 resources = max
    const dependencyScore = Math.min(1, dependencies / 10); // 10 dependencies = max
    const riskScore = Math.min(1, (retries + (task.deadline ? 1 : 0)) / 5);

    // Parallelization opportunity analysis
    const parallelScore = this.calculateParallelizationOpportunity(task);

    // Overall complexity assessment
    const overallScore =
      durationScore * 0.4 +
      resourceScore * 0.2 +
      dependencyScore * 0.2 +
      riskScore * 0.2;

    const overallComplexity: ComplexityMetrics['overallComplexity'] =
      overallScore >= 0.8
        ? 'extreme'
        : overallScore >= 0.6
          ? 'high'
          : overallScore >= 0.3
            ? 'medium'
            : 'low';

    return {
      estimatedDuration: duration,
      resourceRequirements: resourceScore,
      dependencyComplexity: dependencyScore,
      riskFactors: riskScore,
      parallelizationOpportunity: parallelScore,
      overallComplexity,
    };
  }

  /**
   * Determine if task should be broken down
   */
  private shouldBreakdownTask(
    task: Task,
    complexity: ComplexityMetrics,
  ): boolean {
    // Don't break down if already a subtask
    if (task.metadata?.isSubtask) {
      return false;
    }

    // Don't break down simple tasks
    if (complexity.overallComplexity === 'low') {
      return false;
    }

    // Duration threshold
    if (complexity.estimatedDuration < this.config.maxSubtaskDuration * 2) {
      return false;
    }

    // Complexity threshold
    const complexityScore = this.calculateComplexityScore(complexity);
    if (complexityScore < this.config.complexityThreshold) {
      return false;
    }

    // Check for parallelization opportunity
    if (
      complexity.parallelizationOpportunity >
      this.config.parallelizationPreference
    ) {
      return true;
    }

    // Risk-based breakdown
    if (complexity.riskFactors > this.config.riskTolerance) {
      return true;
    }

    // High complexity tasks should always be broken down
    return (
      complexity.overallComplexity === 'extreme' ||
      complexity.overallComplexity === 'high'
    );
  }

  /**
   * Select optimal breakdown strategy based on task characteristics
   */
  private async selectBreakdownStrategy(
    task: Task,
    complexity: ComplexityMetrics,
  ): Promise<BreakdownStrategy> {
    if (!this.config.enableSmartBreakdown) {
      return BreakdownStrategy.FUNCTIONAL; // Default fallback
    }

    // Score each strategy based on task characteristics
    const strategyScores = new Map<BreakdownStrategy, number>();

    for (const strategy of this.config.strategies) {
      let score = 0;

      switch (strategy) {
        case BreakdownStrategy.TEMPORAL:
          score = this.scoreTemporalStrategy(task, complexity);
          break;
        case BreakdownStrategy.FUNCTIONAL:
          score = this.scoreFunctionalStrategy(task, complexity);
          break;
        case BreakdownStrategy.DEPENDENCY:
          score = this.scoreDependencyStrategy(task, complexity);
          break;
        case BreakdownStrategy.RESOURCE:
          score = this.scoreResourceStrategy(task, complexity);
          break;
        case BreakdownStrategy.RISK_BASED:
          score = this.scoreRiskBasedStrategy(task, complexity);
          break;
        case BreakdownStrategy.HYBRID:
          score = this.scoreHybridStrategy(task, complexity);
          break;
        default:
          score = 0; // Unknown strategy gets no score
          break;
      }

      strategyScores.set(strategy, score);
    }

    // Select strategy with highest score
    const bestStrategy = Array.from(strategyScores.entries()).sort(
      ([, a], [, b]) => b - a,
    )[0];

    logger.debug('Breakdown strategy selected', {
      taskId: task.id,
      strategy: bestStrategy[0],
      score: bestStrategy[1],
      allScores: Object.fromEntries(strategyScores),
    });

    return bestStrategy[0];
  }

  /**
   * Perform task breakdown using selected strategy
   */
  private async performBreakdown(
    task: Task,
    strategy: BreakdownStrategy,
    complexity: ComplexityMetrics,
  ): Promise<TaskBreakdownResult> {
    let subtasks: SubTask[] = [];

    switch (strategy) {
      case BreakdownStrategy.TEMPORAL:
        subtasks = await this.performTemporalBreakdown(task, complexity);
        break;
      case BreakdownStrategy.FUNCTIONAL:
        subtasks = await this.performFunctionalBreakdown(task, complexity);
        break;
      case BreakdownStrategy.DEPENDENCY:
        subtasks = await this.performDependencyBreakdown(task, complexity);
        break;
      case BreakdownStrategy.RESOURCE:
        subtasks = await this.performResourceBreakdown(task, complexity);
        break;
      case BreakdownStrategy.RISK_BASED:
        subtasks = await this.performRiskBasedBreakdown(task, complexity);
        break;
      case BreakdownStrategy.HYBRID:
        subtasks = await this.performHybridBreakdown(task, complexity);
        break;
      default:
        throw new Error(`Unsupported breakdown strategy: ${strategy}`);
    }

    // Calculate expected improvement
    const expectedImprovement = this.calculateExpectedImprovement(
      task,
      subtasks,
    );

    // Generate metadata
    const metadata = this.generateBreakdownMetadata(task, subtasks);

    return {
      originalTask: task,
      subtasks,
      breakdownStrategy: strategy,
      expectedImprovement,
      metadata,
    };
  }

  /**
   * Temporal breakdown: Break task into time-based phases
   */
  private async performTemporalBreakdown(
    task: Task,
    complexity: ComplexityMetrics,
  ): Promise<SubTask[]> {
    const subtasks: SubTask[] = [];
    const totalDuration = task.estimatedDuration;
    const phaseCount = this.calculateOptimalPhaseCount(totalDuration);
    const phaseDuration = totalDuration / phaseCount;

    const phases = [
      { name: 'Setup & Initialization', weight: 0.15 },
      { name: 'Core Implementation', weight: 0.6 },
      { name: 'Testing & Validation', weight: 0.15 },
      { name: 'Cleanup & Finalization', weight: 0.1 },
    ];

    let sequenceOrder = 0;
    const cumulativeDependencies: string[] = [];

    for (let i = 0; i < Math.min(phaseCount, phases.length); i++) {
      const phase = phases[i];
      const subtask: SubTask = {
        id: `${task.id}_phase_${i + 1}`,
        parentTaskId: task.id,
        title: `${task.title} - ${phase.name}`,
        description: `${phase.name} phase of ${task.description}`,
        category: task.category,
        priority: task.priority,

        estimatedDuration: Math.floor(phaseDuration * phase.weight),
        dependencies: [...cumulativeDependencies],
        dependents: [],

        executeFunction: this.createPhaseExecuteFunction(task, phase.name, i),
        validateFunction: this.createPhaseValidateFunction(task, phase.name),
        rollbackFunction: this.createPhaseRollbackFunction(task, phase.name),

        breakdownStrategy: BreakdownStrategy.TEMPORAL,
        sequenceOrder: sequenceOrder++,
        canRunInParallel: i === 0, // Only first phase can run independently
        qualityGates: this.generatePhaseQualityGates(phase.name),

        riskLevel: this.calculatePhaseRiskLevel(phase.name, complexity),
        validationCriteria: this.generatePhaseValidationCriteria(phase.name),
        rollbackRequired: i > 0, // Phases after setup may need rollback
      };

      subtasks.push(subtask);
      cumulativeDependencies.push(subtask.id);
    }

    // Set dependents
    for (let i = 0; i < subtasks.length - 1; i++) {
      subtasks[i].dependents.push(subtasks[i + 1].id);
    }

    return subtasks;
  }

  /**
   * Functional breakdown: Break task by functional components
   */
  private async performFunctionalBreakdown(
    task: Task,
    _complexity: ComplexityMetrics,
  ): Promise<SubTask[]> {
    const subtasks: SubTask[] = [];
    const components = this.identifyFunctionalComponents(task);

    let sequenceOrder = 0;

    for (const component of components) {
      const subtask: SubTask = {
        id: `${task.id}_${component.id}`,
        parentTaskId: task.id,
        title: `${task.title} - ${component.name}`,
        description: `${component.name}: ${component.description}`,
        category: task.category,
        priority: this.calculateComponentPriority(
          task.priority,
          component.criticality,
        ),

        estimatedDuration: Math.floor(
          task.estimatedDuration * component.complexityWeight,
        ),
        dependencies: component.dependencies.map((dep) => `${task.id}_${dep}`),
        dependents: [],

        executeFunction: this.createComponentExecuteFunction(task, component),
        validateFunction: this.createComponentValidateFunction(task, component),
        rollbackFunction: component.rollbackRequired
          ? this.createComponentRollbackFunction(task, component)
          : undefined,

        breakdownStrategy: BreakdownStrategy.FUNCTIONAL,
        sequenceOrder: sequenceOrder++,
        canRunInParallel: component.canRunInParallel,
        qualityGates: component.qualityGates,

        riskLevel: component.riskLevel,
        validationCriteria: component.validationCriteria,
        rollbackRequired: component.rollbackRequired,
      };

      subtasks.push(subtask);
    }

    // Set dependents based on dependencies
    for (const subtask of subtasks) {
      for (const depId of subtask.dependencies) {
        const dependency = subtasks.find((st) => st.id === depId);
        if (dependency) {
          dependency.dependents.push(subtask.id);
        }
      }
    }

    return subtasks;
  }

  /**
   * Dependency-based breakdown: Organize by dependency chains
   */
  private async performDependencyBreakdown(
    task: Task,
    _complexity: ComplexityMetrics,
  ): Promise<SubTask[]> {
    const subtasks: SubTask[] = [];
    const dependencyChains = this.analyzeDependencyChains(task);

    let sequenceOrder = 0;

    for (const chain of dependencyChains) {
      for (const link of chain.links) {
        const subtask: SubTask = {
          id: `${task.id}_dep_${link.id}`,
          parentTaskId: task.id,
          title: `${task.title} - ${link.name}`,
          description: `Dependency link: ${link.description}`,
          category: task.category,
          priority: this.calculateLinkPriority(task.priority, link.importance),

          estimatedDuration: link.estimatedDuration,
          dependencies: link.prerequisites.map(
            (pre) => `${task.id}_dep_${pre}`,
          ),
          dependents: [],

          executeFunction: this.createDependencyExecuteFunction(task, link),
          validateFunction: this.createDependencyValidateFunction(task, link),
          rollbackFunction: link.rollbackRequired
            ? this.createDependencyRollbackFunction(task, link)
            : undefined,

          breakdownStrategy: BreakdownStrategy.DEPENDENCY,
          sequenceOrder: sequenceOrder++,
          canRunInParallel: chain.parallelizable && link.canRunInParallel,
          qualityGates: link.qualityGates,

          riskLevel: link.riskLevel,
          validationCriteria: link.validationCriteria,
          rollbackRequired: link.rollbackRequired,
        };

        subtasks.push(subtask);
      }
    }

    // Set dependents based on dependencies
    for (const subtask of subtasks) {
      for (const depId of subtask.dependencies) {
        const dependency = subtasks.find((st) => st.id === depId);
        if (dependency) {
          dependency.dependents.push(subtask.id);
        }
      }
    }

    return subtasks;
  }

  /**
   * Resource-based breakdown: Organize by resource requirements
   */
  private async performResourceBreakdown(
    task: Task,
    _complexity: ComplexityMetrics,
  ): Promise<SubTask[]> {
    const subtasks: SubTask[] = [];
    const resourceGroups = this.groupByResourceRequirements(task);

    let sequenceOrder = 0;

    for (const group of resourceGroups) {
      const subtask: SubTask = {
        id: `${task.id}_resource_${group.id}`,
        parentTaskId: task.id,
        title: `${task.title} - ${group.name}`,
        description: `Resource-specific task: ${group.description}`,
        category: task.category,
        priority: this.calculateResourcePriority(
          task.priority,
          group.criticality,
        ),

        estimatedDuration: group.estimatedDuration,
        dependencies: group.dependencies.map(
          (dep) => `${task.id}_resource_${dep}`,
        ),
        dependents: [],

        executeFunction: this.createResourceExecuteFunction(task, group),
        validateFunction: this.createResourceValidateFunction(task, group),
        rollbackFunction: group.rollbackRequired
          ? this.createResourceRollbackFunction(task, group)
          : undefined,

        breakdownStrategy: BreakdownStrategy.RESOURCE,
        sequenceOrder: sequenceOrder++,
        canRunInParallel: group.canRunInParallel,
        qualityGates: group.qualityGates,

        riskLevel: group.riskLevel,
        validationCriteria: group.validationCriteria,
        rollbackRequired: group.rollbackRequired,
      };

      subtasks.push(subtask);
    }

    return subtasks;
  }

  /**
   * Risk-based breakdown: Organize by risk levels
   */
  private async performRiskBasedBreakdown(
    task: Task,
    _complexity: ComplexityMetrics,
  ): Promise<SubTask[]> {
    const subtasks: SubTask[] = [];
    const riskComponents = this.analyzeRiskComponents(task);

    // Sort by risk level (high risk first for early detection)
    riskComponents.sort((a, b) => {
      const riskOrder = { high: 3, medium: 2, low: 1 };
      return riskOrder[b.riskLevel] - riskOrder[a.riskLevel];
    });

    let sequenceOrder = 0;

    for (const component of riskComponents) {
      const subtask: SubTask = {
        id: `${task.id}_risk_${component.id}`,
        parentTaskId: task.id,
        title: `${task.title} - ${component.name}`,
        description: `Risk component: ${component.description}`,
        category: task.category,
        priority: this.calculateRiskPriority(
          task.priority,
          component.riskLevel,
        ),

        estimatedDuration: component.estimatedDuration,
        dependencies: component.dependencies.map(
          (dep) => `${task.id}_risk_${dep}`,
        ),
        dependents: [],

        executeFunction: this.createRiskExecuteFunction(task, component),
        validateFunction: this.createRiskValidateFunction(task, component),
        rollbackFunction: this.createRiskRollbackFunction(task, component),

        breakdownStrategy: BreakdownStrategy.RISK_BASED,
        sequenceOrder: sequenceOrder++,
        canRunInParallel: component.canRunInParallel,
        qualityGates: component.qualityGates,

        riskLevel: component.riskLevel,
        validationCriteria: component.validationCriteria,
        rollbackRequired: true, // All risk-based subtasks should support rollback
      };

      subtasks.push(subtask);
    }

    return subtasks;
  }

  /**
   * Hybrid breakdown: Combination of multiple strategies
   */
  private async performHybridBreakdown(
    task: Task,
    complexity: ComplexityMetrics,
  ): Promise<SubTask[]> {
    // Use multiple strategies and combine the best results
    const strategies = [
      BreakdownStrategy.FUNCTIONAL,
      BreakdownStrategy.TEMPORAL,
      BreakdownStrategy.DEPENDENCY,
    ];

    const breakdownOptions = await Promise.all(
      strategies.map(async (strategy) => {
        switch (strategy) {
          case BreakdownStrategy.FUNCTIONAL:
            return {
              strategy,
              subtasks: await this.performFunctionalBreakdown(task, complexity),
            };
          case BreakdownStrategy.TEMPORAL:
            return {
              strategy,
              subtasks: await this.performTemporalBreakdown(task, complexity),
            };
          case BreakdownStrategy.DEPENDENCY:
            return {
              strategy,
              subtasks: await this.performDependencyBreakdown(task, complexity),
            };
          default:
            return { strategy, subtasks: [] };
        }
      }),
    );

    // Score each breakdown option
    const scoredOptions = breakdownOptions.map((option) => ({
      ...option,
      score: this.scoreBreakdownOption(task, option.subtasks, complexity),
    }));

    // Select the best combination
    const bestOption = scoredOptions.sort((a, b) => b.score - a.score)[0];

    // Apply hybrid optimizations
    const hybridSubtasks = this.applyHybridOptimizations(
      task,
      bestOption.subtasks,
    );

    return hybridSubtasks;
  }

  // Helper methods for breakdown strategies...

  private calculateParallelizationOpportunity(task: Task): number {
    // Analyze task characteristics to estimate parallelization potential
    const duration = task.estimatedDuration || 60000;
    const resources = task.requiredResources?.length || 1;
    const dependencies = task.dependencies?.length || 0;

    // Higher opportunity for longer tasks with multiple resources and few dependencies
    const durationScore = Math.min(1, duration / (60 * 60 * 1000)); // 1 hour = max
    const resourceScore = Math.min(1, resources / 3); // 3 resources = good parallelization
    const dependencyPenalty = Math.max(0, 1 - dependencies / 5); // Many dependencies reduce parallelization

    return durationScore * 0.5 + resourceScore * 0.3 + dependencyPenalty * 0.2;
  }

  private calculateComplexityScore(complexity: ComplexityMetrics): number {
    return (
      complexity.resourceRequirements * 0.25 +
      complexity.dependencyComplexity * 0.25 +
      complexity.riskFactors * 0.25 +
      (complexity.estimatedDuration / (2 * 60 * 60 * 1000)) * 0.25
    );
  }

  private calculateOptimalPhaseCount(duration: number): number {
    if (duration < 30 * 60 * 1000) return 2; // < 30 min: 2 phases
    if (duration < 2 * 60 * 60 * 1000) return 3; // < 2 hours: 3 phases
    if (duration < 8 * 60 * 60 * 1000) return 4; // < 8 hours: 4 phases
    return Math.min(6, Math.floor(duration / (2 * 60 * 60 * 1000))); // Max 6 phases
  }

  // Scoring methods for strategy selection...

  private scoreTemporalStrategy(
    task: Task,
    complexity: ComplexityMetrics,
  ): number {
    let score = 0.5; // Base score

    // Good for long-running tasks
    if (complexity.estimatedDuration > 2 * 60 * 60 * 1000) score += 0.3;

    // Good for tasks with clear phases
    if (
      task.category === TaskCategory.FEATURE ||
      task.category === TaskCategory.INFRASTRUCTURE
    )
      score += 0.2;

    // Less good for highly dependent tasks
    if (complexity.dependencyComplexity > 0.7) score -= 0.2;

    return Math.max(0, Math.min(1, score));
  }

  private scoreFunctionalStrategy(
    task: Task,
    complexity: ComplexityMetrics,
  ): number {
    let score = 0.6; // Higher base score

    // Excellent for development and implementation tasks
    if (
      task.category === TaskCategory.FEATURE ||
      task.category === TaskCategory.REFACTOR
    )
      score += 0.3;

    // Good for high resource requirements (different components need different resources)
    if (complexity.resourceRequirements > 0.5) score += 0.2;

    // Good parallelization opportunity
    if (complexity.parallelizationOpportunity > 0.6) score += 0.2;

    return Math.max(0, Math.min(1, score));
  }

  private scoreDependencyStrategy(
    task: Task,
    complexity: ComplexityMetrics,
  ): number {
    let score = 0.4; // Lower base score

    // Excellent for highly dependent tasks
    if (complexity.dependencyComplexity > 0.6) score += 0.4;

    // Good for complex integration tasks
    if (
      task.category === TaskCategory.TEST ||
      task.category === TaskCategory.INFRASTRUCTURE
    )
      score += 0.2;

    return Math.max(0, Math.min(1, score));
  }

  private scoreResourceStrategy(
    task: Task,
    complexity: ComplexityMetrics,
  ): number {
    let score = 0.3; // Lower base score

    // Excellent for resource-intensive tasks
    if (complexity.resourceRequirements > 0.8) score += 0.5;

    // Good for infrastructure and deployment tasks
    if (
      task.category === TaskCategory.INFRASTRUCTURE ||
      task.category === TaskCategory.PERFORMANCE
    )
      score += 0.3;

    return Math.max(0, Math.min(1, score));
  }

  private scoreRiskBasedStrategy(
    task: Task,
    complexity: ComplexityMetrics,
  ): number {
    let score = 0.3; // Lower base score

    // Excellent for high-risk tasks
    if (complexity.riskFactors > 0.7) score += 0.5;

    // Good for critical priority tasks
    if (task.priority >= TaskPriority.HIGH) score += 0.2;

    // Good for security-related tasks
    if (task.category === TaskCategory.SECURITY) score += 0.3;

    return Math.max(0, Math.min(1, score));
  }

  private scoreHybridStrategy(
    task: Task,
    complexity: ComplexityMetrics,
  ): number {
    let score = 0.7; // High base score

    // Excellent for extremely complex tasks
    if (complexity.overallComplexity === 'extreme') score += 0.3;

    // Good fallback for any complex task
    if (complexity.overallComplexity === 'high') score += 0.2;

    return Math.max(0, Math.min(1, score));
  }

  // Execution function factories...

  private createPhaseExecuteFunction(
    originalTask: Task,
    phaseName: string,
    phaseIndex: number,
  ): (task: Task, context: TaskContext) => Promise<TaskExecutionResult> {
    return async (task: Task, context: TaskContext) => {
      logger.info(`Executing ${phaseName} phase`, {
        taskId: task.id,
        parentTaskId: originalTask.id,
        phaseIndex,
      });

      try {
        // Delegate to original task execution function with phase context
        const phaseContext = {
          ...context,
          phase: {
            name: phaseName,
            index: phaseIndex,
            parentTask: originalTask,
          },
        };

        const result = await originalTask.executeFunction(task, phaseContext);

        return {
          ...result,
          artifacts: result.artifacts || [
            `${phaseName.toLowerCase().replace(/\s+/g, '_')}_completed`,
          ],
        };
      } catch (error) {
        logger.error(`Phase execution failed: ${phaseName}`, {
          taskId: task.id,
          error: error instanceof Error ? error : new Error(String(error)),
        });

        throw error;
      }
    };
  }

  private createPhaseValidateFunction(
    originalTask: Task,
    _phaseName: string,
  ): (task: Task, context: TaskContext) => Promise<boolean> {
    return async (task: Task, context: TaskContext) => {
      // Phase-specific validation logic
      if (originalTask.validateFunction) {
        return originalTask.validateFunction(task, context);
      }
      return true;
    };
  }

  private createPhaseRollbackFunction(
    originalTask: Task,
    phaseName: string,
  ): (task: Task, context: TaskContext) => Promise<void> {
    return async (task: Task, context: TaskContext) => {
      logger.info(`Rolling back ${phaseName} phase`, {
        taskId: task.id,
        parentTaskId: originalTask.id,
      });

      if (originalTask.rollbackFunction) {
        await originalTask.rollbackFunction(task, context);
      }
    };
  }

  private createComponentExecuteFunction(
    originalTask: Task,
    component: BreakdownComponent,
  ): (task: Task, context: TaskContext) => Promise<TaskExecutionResult> {
    return async (task: Task, context: TaskContext) => {
      logger.info(`Executing component: ${component.name}`, {
        taskId: task.id,
        parentTaskId: originalTask.id,
        componentId: component.id,
      });

      const componentContext = {
        ...context,
        component: {
          id: component.id,
          name: component.name,
          parentTask: originalTask,
        },
      };

      const result = await originalTask.executeFunction(task, componentContext);

      return {
        ...result,
        artifacts: result.artifacts || [`component_${component.id}_completed`],
      };
    };
  }

  private createComponentValidateFunction(
    originalTask: Task,
    _component: BreakdownComponent,
  ): (task: Task, context: TaskContext) => Promise<boolean> {
    return async (task: Task, context: TaskContext) => {
      if (originalTask.validateFunction) {
        return originalTask.validateFunction(task, context);
      }
      return true;
    };
  }

  private createComponentRollbackFunction(
    originalTask: Task,
    _component: BreakdownComponent,
  ): (task: Task, context: TaskContext) => Promise<void> {
    return async (task: Task, context: TaskContext) => {
      if (originalTask.rollbackFunction) {
        await originalTask.rollbackFunction(task, context);
      }
    };
  }

  private createDependencyExecuteFunction(
    originalTask: Task,
    link: BreakdownComponent,
  ): (task: Task, context: TaskContext) => Promise<TaskExecutionResult> {
    return async (task: Task, context: TaskContext) => {
      const linkContext = {
        ...context,
        dependencyLink: {
          id: link.id,
          name: link.name,
          parentTask: originalTask,
        },
      };

      return originalTask.executeFunction(task, linkContext);
    };
  }

  private createDependencyValidateFunction(
    originalTask: Task,
    _link: BreakdownComponent,
  ): (task: Task, context: TaskContext) => Promise<boolean> {
    return async (task: Task, context: TaskContext) => {
      if (originalTask.validateFunction) {
        return originalTask.validateFunction(task, context);
      }
      return true;
    };
  }

  private createDependencyRollbackFunction(
    originalTask: Task,
    _link: BreakdownComponent,
  ): (task: Task, context: TaskContext) => Promise<void> {
    return async (task: Task, context: TaskContext) => {
      if (originalTask.rollbackFunction) {
        await originalTask.rollbackFunction(task, context);
      }
    };
  }

  private createResourceExecuteFunction(
    originalTask: Task,
    group: BreakdownComponent,
  ): (task: Task, context: TaskContext) => Promise<TaskExecutionResult> {
    return async (task: Task, context: TaskContext) => {
      const resourceContext = {
        ...context,
        resourceGroup: {
          id: group.id,
          name: group.name,
          resources: group.resources,
          parentTask: originalTask,
        },
      };

      return originalTask.executeFunction(task, resourceContext);
    };
  }

  private createResourceValidateFunction(
    originalTask: Task,
    _group: BreakdownComponent,
  ): (task: Task, context: TaskContext) => Promise<boolean> {
    return async (task: Task, context: TaskContext) => {
      if (originalTask.validateFunction) {
        return originalTask.validateFunction(task, context);
      }
      return true;
    };
  }

  private createResourceRollbackFunction(
    originalTask: Task,
    _group: BreakdownComponent,
  ): (task: Task, context: TaskContext) => Promise<void> {
    return async (task: Task, context: TaskContext) => {
      if (originalTask.rollbackFunction) {
        await originalTask.rollbackFunction(task, context);
      }
    };
  }

  private createRiskExecuteFunction(
    originalTask: Task,
    component: BreakdownComponent,
  ): (task: Task, context: TaskContext) => Promise<TaskExecutionResult> {
    return async (task: Task, context: TaskContext) => {
      const riskContext = {
        ...context,
        riskComponent: {
          id: component.id,
          name: component.name,
          riskLevel: component.riskLevel,
          parentTask: originalTask,
        },
      };

      return originalTask.executeFunction(task, riskContext);
    };
  }

  private createRiskValidateFunction(
    originalTask: Task,
    _component: BreakdownComponent,
  ): (task: Task, context: TaskContext) => Promise<boolean> {
    return async (task: Task, context: TaskContext) => {
      if (originalTask.validateFunction) {
        return originalTask.validateFunction(task, context);
      }
      return true;
    };
  }

  private createRiskRollbackFunction(
    originalTask: Task,
    _component: BreakdownComponent,
  ): (task: Task, context: TaskContext) => Promise<void> {
    return async (task: Task, context: TaskContext) => {
      if (originalTask.rollbackFunction) {
        await originalTask.rollbackFunction(task, context);
      }
    };
  }

  // Analysis helper methods...

  private identifyFunctionalComponents(task: Task): BreakdownComponent[] {
    // Simplified component identification based on task category
    const componentTemplates: Record<TaskCategory, BreakdownComponent[]> = {
      [TaskCategory.FEATURE]: [
        {
          id: 'design',
          name: 'Design & Planning',
          description: 'Design the feature architecture',
          complexityWeight: 0.2,
          criticality: 'medium',
          dependencies: [],
          canRunInParallel: true,
          qualityGates: ['design_review'],
          riskLevel: 'low' as const,
          validationCriteria: ['design_approved'],
          rollbackRequired: false,
        },
        {
          id: 'implementation',
          name: 'Core Implementation',
          description: 'Implement the main feature logic',
          complexityWeight: 0.5,
          criticality: 'high',
          dependencies: ['design'],
          canRunInParallel: false,
          qualityGates: ['code_review', 'unit_tests'],
          riskLevel: 'medium' as const,
          validationCriteria: ['tests_pass', 'code_quality'],
          rollbackRequired: true,
        },
        {
          id: 'integration',
          name: 'System Integration',
          description: 'Integrate with existing systems',
          complexityWeight: 0.2,
          criticality: 'medium',
          dependencies: ['implementation'],
          canRunInParallel: false,
          qualityGates: ['integration_tests'],
          riskLevel: 'high' as const,
          validationCriteria: ['integration_tests_pass'],
          rollbackRequired: true,
        },
        {
          id: 'documentation',
          name: 'Documentation',
          description: 'Create feature documentation',
          complexityWeight: 0.1,
          criticality: 'low',
          dependencies: ['implementation'],
          canRunInParallel: true,
          qualityGates: ['docs_review'],
          riskLevel: 'low' as const,
          validationCriteria: ['docs_complete'],
          rollbackRequired: false,
        },
      ],
      [TaskCategory.BUG_FIX]: [
        {
          id: 'diagnosis',
          name: 'Bug Diagnosis',
          description: 'Identify root cause of the bug',
          complexityWeight: 0.3,
          criticality: 'high',
          dependencies: [],
          canRunInParallel: true,
          qualityGates: ['root_cause_identified'],
          riskLevel: 'medium' as const,
          validationCriteria: ['cause_documented'],
          rollbackRequired: false,
        },
        {
          id: 'fix',
          name: 'Implement Fix',
          description: 'Apply the bug fix',
          complexityWeight: 0.4,
          criticality: 'high',
          dependencies: ['diagnosis'],
          canRunInParallel: false,
          qualityGates: ['fix_tested'],
          riskLevel: 'high' as const,
          validationCriteria: ['bug_resolved', 'no_regression'],
          rollbackRequired: true,
        },
        {
          id: 'verification',
          name: 'Fix Verification',
          description: 'Verify the fix resolves the issue',
          complexityWeight: 0.3,
          criticality: 'high',
          dependencies: ['fix'],
          canRunInParallel: false,
          qualityGates: ['verification_complete'],
          riskLevel: 'medium' as const,
          validationCriteria: ['fix_verified'],
          rollbackRequired: false,
        },
      ],
      [TaskCategory.TEST]: [
        {
          id: 'test_design',
          name: 'Test Design',
          description: 'Design test cases and scenarios',
          complexityWeight: 0.3,
          criticality: 'medium',
          dependencies: [],
          canRunInParallel: true,
          qualityGates: ['test_plan_review'],
          riskLevel: 'low' as const,
          validationCriteria: ['test_plan_approved'],
          rollbackRequired: false,
        },
        {
          id: 'test_implementation',
          name: 'Test Implementation',
          description: 'Implement automated tests',
          complexityWeight: 0.5,
          criticality: 'high',
          dependencies: ['test_design'],
          canRunInParallel: true,
          qualityGates: ['test_code_review'],
          riskLevel: 'medium' as const,
          validationCriteria: ['tests_implemented'],
          rollbackRequired: true,
        },
        {
          id: 'test_execution',
          name: 'Test Execution',
          description: 'Execute test suite',
          complexityWeight: 0.2,
          criticality: 'high',
          dependencies: ['test_implementation'],
          canRunInParallel: false,
          qualityGates: ['test_results_analyzed'],
          riskLevel: 'low' as const,
          validationCriteria: ['all_tests_pass'],
          rollbackRequired: false,
        },
      ],
      [TaskCategory.DOCUMENTATION]: [
        {
          id: 'content_planning',
          name: 'Content Planning',
          description: 'Plan documentation structure and content',
          complexityWeight: 0.3,
          criticality: 'low',
          dependencies: [],
          canRunInParallel: true,
          qualityGates: ['content_outline_approved'],
          riskLevel: 'low' as const,
          validationCriteria: ['outline_complete'],
          rollbackRequired: false,
        },
        {
          id: 'content_creation',
          name: 'Content Creation',
          description: 'Write the documentation content',
          complexityWeight: 0.6,
          criticality: 'medium',
          dependencies: ['content_planning'],
          canRunInParallel: true,
          qualityGates: ['content_review'],
          riskLevel: 'low' as const,
          validationCriteria: ['content_complete'],
          rollbackRequired: false,
        },
        {
          id: 'review_finalization',
          name: 'Review & Finalization',
          description: 'Review and finalize documentation',
          complexityWeight: 0.1,
          criticality: 'low',
          dependencies: ['content_creation'],
          canRunInParallel: false,
          qualityGates: ['final_approval'],
          riskLevel: 'low' as const,
          validationCriteria: ['docs_approved'],
          rollbackRequired: false,
        },
      ],
      [TaskCategory.REFACTOR]: [
        {
          id: 'analysis',
          name: 'Code Analysis',
          description: 'Analyze code for refactoring opportunities',
          complexityWeight: 0.3,
          criticality: 'medium',
          dependencies: [],
          canRunInParallel: true,
          qualityGates: ['analysis_complete'],
          riskLevel: 'low' as const,
          validationCriteria: ['refactoring_plan'],
          rollbackRequired: false,
        },
        {
          id: 'refactoring',
          name: 'Code Refactoring',
          description: 'Perform the code refactoring',
          complexityWeight: 0.6,
          criticality: 'high',
          dependencies: ['analysis'],
          canRunInParallel: false,
          qualityGates: ['refactor_review', 'tests_pass'],
          riskLevel: 'high' as const,
          validationCriteria: ['refactor_complete', 'no_regression'],
          rollbackRequired: true,
        },
        {
          id: 'validation',
          name: 'Validation',
          description: 'Validate refactoring maintains functionality',
          complexityWeight: 0.1,
          criticality: 'high',
          dependencies: ['refactoring'],
          canRunInParallel: false,
          qualityGates: ['validation_complete'],
          riskLevel: 'medium' as const,
          validationCriteria: ['functionality_preserved'],
          rollbackRequired: false,
        },
      ],
      [TaskCategory.SECURITY]: [
        {
          id: 'threat_analysis',
          name: 'Threat Analysis',
          description: 'Analyze security threats and vulnerabilities',
          complexityWeight: 0.3,
          criticality: 'high',
          dependencies: [],
          canRunInParallel: true,
          qualityGates: ['threat_model_review'],
          riskLevel: 'high' as const,
          validationCriteria: ['threats_identified'],
          rollbackRequired: false,
        },
        {
          id: 'security_implementation',
          name: 'Security Implementation',
          description: 'Implement security measures',
          complexityWeight: 0.5,
          criticality: 'high',
          dependencies: ['threat_analysis'],
          canRunInParallel: false,
          qualityGates: ['security_review'],
          riskLevel: 'high' as const,
          validationCriteria: ['security_controls_implemented'],
          rollbackRequired: true,
        },
        {
          id: 'security_testing',
          name: 'Security Testing',
          description: 'Test security implementation',
          complexityWeight: 0.2,
          criticality: 'high',
          dependencies: ['security_implementation'],
          canRunInParallel: false,
          qualityGates: ['penetration_testing'],
          riskLevel: 'medium' as const,
          validationCriteria: ['security_tests_pass'],
          rollbackRequired: false,
        },
      ],
      [TaskCategory.PERFORMANCE]: [
        {
          id: 'performance_analysis',
          name: 'Performance Analysis',
          description: 'Analyze current performance bottlenecks',
          complexityWeight: 0.3,
          criticality: 'medium',
          dependencies: [],
          canRunInParallel: true,
          qualityGates: ['analysis_review'],
          riskLevel: 'low' as const,
          validationCriteria: ['bottlenecks_identified'],
          rollbackRequired: false,
        },
        {
          id: 'optimization',
          name: 'Performance Optimization',
          description: 'Implement performance optimizations',
          complexityWeight: 0.6,
          criticality: 'high',
          dependencies: ['performance_analysis'],
          canRunInParallel: false,
          qualityGates: ['optimization_review'],
          riskLevel: 'high' as const,
          validationCriteria: ['performance_improved'],
          rollbackRequired: true,
        },
        {
          id: 'performance_validation',
          name: 'Performance Validation',
          description: 'Validate performance improvements',
          complexityWeight: 0.1,
          criticality: 'high',
          dependencies: ['optimization'],
          canRunInParallel: false,
          qualityGates: ['performance_benchmarks'],
          riskLevel: 'low' as const,
          validationCriteria: ['performance_targets_met'],
          rollbackRequired: false,
        },
      ],
      [TaskCategory.INFRASTRUCTURE]: [
        {
          id: 'infrastructure_design',
          name: 'Infrastructure Design',
          description: 'Design infrastructure architecture',
          complexityWeight: 0.3,
          criticality: 'high',
          dependencies: [],
          canRunInParallel: true,
          qualityGates: ['architecture_review'],
          riskLevel: 'medium' as const,
          validationCriteria: ['design_approved'],
          rollbackRequired: false,
        },
        {
          id: 'provisioning',
          name: 'Resource Provisioning',
          description: 'Provision infrastructure resources',
          complexityWeight: 0.4,
          criticality: 'high',
          dependencies: ['infrastructure_design'],
          canRunInParallel: false,
          qualityGates: ['provisioning_validation'],
          riskLevel: 'high' as const,
          validationCriteria: ['resources_provisioned'],
          rollbackRequired: true,
        },
        {
          id: 'configuration',
          name: 'Configuration',
          description: 'Configure infrastructure components',
          complexityWeight: 0.2,
          criticality: 'medium',
          dependencies: ['provisioning'],
          canRunInParallel: true,
          qualityGates: ['configuration_review'],
          riskLevel: 'medium' as const,
          validationCriteria: ['configuration_complete'],
          rollbackRequired: true,
        },
        {
          id: 'monitoring_setup',
          name: 'Monitoring Setup',
          description: 'Set up monitoring and alerting',
          complexityWeight: 0.1,
          criticality: 'medium',
          dependencies: ['configuration'],
          canRunInParallel: true,
          qualityGates: ['monitoring_validation'],
          riskLevel: 'low' as const,
          validationCriteria: ['monitoring_active'],
          rollbackRequired: false,
        },
      ],
    };

    return (
      componentTemplates[task.category] || [
        {
          id: 'main',
          name: 'Main Task',
          description: task.description,
          complexityWeight: 1.0,
          criticality: 'medium',
          dependencies: [],
          canRunInParallel: false,
          qualityGates: ['completion_check'],
          riskLevel: 'medium' as const,
          validationCriteria: ['task_complete'],
          rollbackRequired: true,
        },
      ]
    );
  }

  private analyzeDependencyChains(task: Task): Array<{
    id: string;
    name: string;
    parallelizable: boolean;
    links: BreakdownComponent[];
  }> {
    // Simplified dependency chain analysis
    // In a real implementation, this would analyze the task's dependency graph
    return [
      {
        id: 'main_chain',
        name: 'Main Dependency Chain',
        parallelizable: task.dependencies.length <= 2,
        links: [
          {
            id: 'prerequisites',
            name: 'Prerequisites Setup',
            description: 'Set up necessary prerequisites',
            estimatedDuration: Math.floor(task.estimatedDuration * 0.2),
            prerequisites: [],
            importance: 'high',
            canRunInParallel: true,
            qualityGates: ['prerequisites_ready'],
            riskLevel: 'low' as const,
            validationCriteria: ['setup_complete'],
            rollbackRequired: false,
          },
          {
            id: 'main_work',
            name: 'Main Work',
            description: 'Execute the main task work',
            estimatedDuration: Math.floor(task.estimatedDuration * 0.6),
            prerequisites: ['prerequisites'],
            importance: 'high',
            canRunInParallel: false,
            qualityGates: ['work_review'],
            riskLevel: 'medium' as const,
            validationCriteria: ['work_complete'],
            rollbackRequired: true,
          },
          {
            id: 'finalization',
            name: 'Finalization',
            description: 'Finalize and cleanup',
            estimatedDuration: Math.floor(task.estimatedDuration * 0.2),
            prerequisites: ['main_work'],
            importance: 'medium',
            canRunInParallel: false,
            qualityGates: ['final_validation'],
            riskLevel: 'low' as const,
            validationCriteria: ['cleanup_complete'],
            rollbackRequired: false,
          },
        ],
      },
    ];
  }

  private groupByResourceRequirements(task: Task): BreakdownComponent[] {
    const resources = task.requiredResources || ['default'];

    return resources.map((resource, index) => ({
      id: `resource_${index}`,
      name: `${resource.charAt(0).toUpperCase() + resource.slice(1)} Tasks`,
      description: `Tasks requiring ${resource} resource`,
      estimatedDuration: Math.floor(task.estimatedDuration / resources.length),
      dependencies: index > 0 ? [`resource_${index - 1}`] : [],
      criticality: 'medium',
      canRunInParallel: index === 0,
      qualityGates: [`${resource}_validation`],
      riskLevel: 'medium' as const,
      validationCriteria: [`${resource}_tasks_complete`],
      rollbackRequired: true,
    }));
  }

  private analyzeRiskComponents(task: Task): BreakdownComponent[] {
    // Simplified risk component analysis
    const baseComponents: BreakdownComponent[] = [
      {
        id: 'low_risk',
        name: 'Low Risk Operations',
        description: 'Operations with minimal risk',
        estimatedDuration: Math.floor(task.estimatedDuration * 0.4),
        dependencies: [],
        riskLevel: 'low' as const,
        canRunInParallel: true,
        qualityGates: ['basic_validation'],
        validationCriteria: ['operations_complete'],
        rollbackRequired: false,
      },
      {
        id: 'medium_risk',
        name: 'Medium Risk Operations',
        description: 'Operations with moderate risk',
        estimatedDuration: Math.floor(task.estimatedDuration * 0.4),
        dependencies: ['low_risk'],
        riskLevel: 'medium' as const,
        canRunInParallel: false,
        qualityGates: ['thorough_validation'],
        validationCriteria: ['safe_operations_complete'],
        rollbackRequired: true,
      },
    ];

    // Add high-risk component for critical tasks or those with history of failures
    if (task.priority >= TaskPriority.HIGH || task.currentRetries > 0) {
      baseComponents.push({
        id: 'high_risk',
        name: 'High Risk Operations',
        description: 'Operations requiring careful execution',
        estimatedDuration: Math.floor(task.estimatedDuration * 0.2),
        dependencies: ['medium_risk'],
        riskLevel: 'high' as const,
        canRunInParallel: false,
        qualityGates: ['extensive_validation', 'approval_required'],
        validationCriteria: ['high_risk_operations_safe'],
        rollbackRequired: true,
      });
    }

    return baseComponents;
  }

  private calculateComponentPriority(
    basePriority: TaskPriority,
    criticality: string,
  ): TaskPriority {
    if (criticality === 'high') {
      return Math.min(TaskPriority.CRITICAL, basePriority + 100);
    }
    if (criticality === 'low') {
      return Math.max(TaskPriority.LOW, basePriority - 100);
    }
    return basePriority;
  }

  private calculateLinkPriority(
    basePriority: TaskPriority,
    importance: string,
  ): TaskPriority {
    if (importance === 'high') {
      return Math.min(TaskPriority.HIGH, basePriority + 50);
    }
    if (importance === 'low') {
      return Math.max(TaskPriority.LOW, basePriority - 50);
    }
    return basePriority;
  }

  private calculateResourcePriority(
    basePriority: TaskPriority,
    criticality: string,
  ): TaskPriority {
    return this.calculateComponentPriority(basePriority, criticality);
  }

  private calculateRiskPriority(
    basePriority: TaskPriority,
    riskLevel: 'low' | 'medium' | 'high',
  ): TaskPriority {
    if (riskLevel === 'high') {
      return Math.min(TaskPriority.CRITICAL, basePriority + 200);
    }
    if (riskLevel === 'low') {
      return Math.max(TaskPriority.MEDIUM, basePriority);
    }
    return basePriority;
  }

  private generatePhaseQualityGates(phaseName: string): string[] {
    const gateMap: Record<string, string[]> = {
      'Setup & Initialization': ['prerequisites_verified', 'environment_ready'],
      'Core Implementation': [
        'code_review',
        'unit_tests_pass',
        'integration_ready',
      ],
      'Testing & Validation': ['test_suite_complete', 'validation_passed'],
      'Cleanup & Finalization': ['cleanup_verified', 'deliverables_ready'],
    };

    return gateMap[phaseName] || ['phase_complete'];
  }

  private calculatePhaseRiskLevel(
    phaseName: string,
    complexity: ComplexityMetrics,
  ): 'low' | 'medium' | 'high' {
    if (
      phaseName.includes('Implementation') &&
      complexity.overallComplexity === 'high'
    ) {
      return 'high';
    }
    if (phaseName.includes('Testing') || phaseName.includes('Integration')) {
      return 'medium';
    }
    return 'low';
  }

  private generatePhaseValidationCriteria(phaseName: string): string[] {
    const criteriaMap: Record<string, string[]> = {
      'Setup & Initialization': [
        'environment_configured',
        'dependencies_available',
      ],
      'Core Implementation': ['functionality_implemented', 'code_quality_met'],
      'Testing & Validation': ['tests_pass', 'requirements_met'],
      'Cleanup & Finalization': ['artifacts_delivered', 'resources_cleaned'],
    };

    return criteriaMap[phaseName] || ['phase_criteria_met'];
  }

  private calculateExpectedImprovement(
    originalTask: Task,
    subtasks: SubTask[],
  ): {
    parallelization: number;
    riskReduction: number;
    resourceEfficiency: number;
    monitorability: number;
  } {
    const parallelizableCount = subtasks.filter(
      (st) => st.canRunInParallel,
    ).length;
    const totalSubtasks = subtasks.length;

    const parallelization = Math.min(
      0.8,
      parallelizableCount / Math.max(1, totalSubtasks),
    );

    const highRiskCount = subtasks.filter(
      (st) => st.riskLevel === 'high',
    ).length;
    const riskReduction = Math.max(0.1, 1 - highRiskCount / totalSubtasks);

    const avgDuration =
      subtasks.reduce((sum, st) => sum + st.estimatedDuration, 0) /
      totalSubtasks;
    const resourceEfficiency =
      originalTask.estimatedDuration > avgDuration * 2 ? 0.7 : 0.3;

    const monitorability = Math.min(0.9, totalSubtasks * 0.15);

    return {
      parallelization,
      riskReduction,
      resourceEfficiency,
      monitorability,
    };
  }

  private generateBreakdownMetadata(
    originalTask: Task,
    subtasks: SubTask[],
  ): {
    complexityReduction: number;
    totalSubtasks: number;
    parallelGroups: number;
    criticalPath: string[];
    estimatedSpeedup: number;
  } {
    const totalSubtasks = subtasks.length;
    const parallelGroups = subtasks.filter((st) => st.canRunInParallel).length;

    // Simple complexity reduction estimation
    const complexityReduction = Math.min(0.6, totalSubtasks * 0.1);

    // Critical path calculation (simplified)
    const criticalPath = subtasks
      .filter(
        (st) => st.riskLevel === 'high' || st.priority >= TaskPriority.HIGH,
      )
      .map((st) => st.id);

    // Estimated speedup from parallelization
    const estimatedSpeedup =
      parallelGroups > 1 ? Math.min(3.0, 1 + parallelGroups * 0.3) : 1.0;

    return {
      complexityReduction,
      totalSubtasks,
      parallelGroups,
      criticalPath,
      estimatedSpeedup,
    };
  }

  private scoreBreakdownOption(
    originalTask: Task,
    subtasks: SubTask[],
    complexity: ComplexityMetrics,
  ): number {
    let score = 0.5; // Base score

    // Prefer optimal number of subtasks
    const idealCount = this.calculateIdealSubtaskCount(complexity);
    const countDiff = Math.abs(subtasks.length - idealCount);
    score += Math.max(0, 0.3 - countDiff * 0.05);

    // Prefer good parallelization
    const parallelCount = subtasks.filter((st) => st.canRunInParallel).length;
    score += (parallelCount / subtasks.length) * 0.3;

    // Prefer balanced durations
    const avgDuration =
      subtasks.reduce((sum, st) => sum + st.estimatedDuration, 0) /
      subtasks.length;
    const durationVariance =
      subtasks.reduce(
        (sum, st) => sum + Math.pow(st.estimatedDuration - avgDuration, 2),
        0,
      ) / subtasks.length;
    const normalizedVariance = durationVariance / (avgDuration * avgDuration);
    score += Math.max(0, 0.2 - normalizedVariance);

    return Math.max(0, Math.min(1, score));
  }

  private calculateIdealSubtaskCount(complexity: ComplexityMetrics): number {
    if (complexity.overallComplexity === 'extreme') return 8;
    if (complexity.overallComplexity === 'high') return 6;
    if (complexity.overallComplexity === 'medium') return 4;
    return 3;
  }

  private applyHybridOptimizations(
    originalTask: Task,
    subtasks: SubTask[],
  ): SubTask[] {
    // Apply cross-strategy optimizations
    const optimizedSubtasks = [...subtasks];

    // Merge very small subtasks
    this.mergeSmallSubtasks(optimizedSubtasks);

    // Optimize dependency chains
    this.optimizeDependencyChains(optimizedSubtasks);

    // Balance parallel groups
    this.balanceParallelGroups(optimizedSubtasks);

    return optimizedSubtasks;
  }

  private mergeSmallSubtasks(subtasks: SubTask[]): void {
    const threshold = this.config.minSubtaskDuration;

    for (let i = subtasks.length - 1; i > 0; i--) {
      const current = subtasks[i];
      const previous = subtasks[i - 1];

      if (
        current.estimatedDuration < threshold &&
        previous.estimatedDuration < threshold &&
        current.canRunInParallel === previous.canRunInParallel
      ) {
        // Merge current into previous
        previous.estimatedDuration += current.estimatedDuration;
        previous.description += ` & ${current.description}`;
        previous.qualityGates.push(...current.qualityGates);
        previous.validationCriteria.push(...current.validationCriteria);

        // Remove current subtask
        subtasks.splice(i, 1);
      }
    }
  }

  private optimizeDependencyChains(subtasks: SubTask[]): void {
    // Remove redundant dependencies
    for (const subtask of subtasks) {
      subtask.dependencies = Array.from(new Set(subtask.dependencies));
    }
  }

  private balanceParallelGroups(subtasks: SubTask[]): void {
    const parallelTasks = subtasks.filter((st) => st.canRunInParallel);
    const maxParallelDuration = Math.max(
      ...parallelTasks.map((st) => st.estimatedDuration),
    );

    // If there's significant imbalance, consider splitting large parallel tasks
    for (const task of parallelTasks) {
      if (
        task.estimatedDuration > maxParallelDuration * 0.6 &&
        task.estimatedDuration > this.config.maxSubtaskDuration
      ) {
        // Mark for potential further breakdown in future iterations
        task.metadata = { ...task.metadata, considerFurtherBreakdown: true };
      }
    }
  }

  private async optimizeBreakdown(
    breakdown: TaskBreakdownResult,
  ): Promise<TaskBreakdownResult> {
    const optimizedSubtasks = [...breakdown.subtasks];

    // Apply size constraints
    if (optimizedSubtasks.length > this.config.maxSubtasks) {
      // Merge least critical subtasks
      this.mergeExcessSubtasks(optimizedSubtasks);
    }

    // Apply duration constraints
    this.applyDurationConstraints(optimizedSubtasks);

    // Recalculate metadata after optimizations
    const optimizedMetadata = this.generateBreakdownMetadata(
      breakdown.originalTask,
      optimizedSubtasks,
    );
    const optimizedImprovement = this.calculateExpectedImprovement(
      breakdown.originalTask,
      optimizedSubtasks,
    );

    return {
      ...breakdown,
      subtasks: optimizedSubtasks,
      expectedImprovement: optimizedImprovement,
      metadata: optimizedMetadata,
    };
  }

  private mergeExcessSubtasks(subtasks: SubTask[]): void {
    // Sort by priority and merge lowest priority tasks
    subtasks.sort((a, b) => a.priority - b.priority);

    while (subtasks.length > this.config.maxSubtasks && subtasks.length > 2) {
      const toMerge = subtasks.splice(0, 2);
      const merged: SubTask = {
        ...toMerge[0],
        id: `${toMerge[0].id}_merged`,
        title: `${toMerge[0].title} & ${toMerge[1].title}`,
        description: `${toMerge[0].description} & ${toMerge[1].description}`,
        estimatedDuration:
          toMerge[0].estimatedDuration + toMerge[1].estimatedDuration,
        dependencies: Array.from(
          new Set([...toMerge[0].dependencies, ...toMerge[1].dependencies]),
        ),
        dependents: Array.from(
          new Set([...toMerge[0].dependents, ...toMerge[1].dependents]),
        ),
        qualityGates: Array.from(
          new Set([...toMerge[0].qualityGates, ...toMerge[1].qualityGates]),
        ),
        validationCriteria: Array.from(
          new Set([
            ...toMerge[0].validationCriteria,
            ...toMerge[1].validationCriteria,
          ]),
        ),
        canRunInParallel:
          toMerge[0].canRunInParallel && toMerge[1].canRunInParallel,
        riskLevel:
          toMerge[0].riskLevel === 'high' || toMerge[1].riskLevel === 'high'
            ? 'high'
            : toMerge[0].riskLevel === 'medium' ||
                toMerge[1].riskLevel === 'medium'
              ? 'medium'
              : 'low',
        rollbackRequired:
          toMerge[0].rollbackRequired || toMerge[1].rollbackRequired,
      };

      subtasks.unshift(merged);
    }
  }

  private applyDurationConstraints(subtasks: SubTask[]): void {
    for (const subtask of subtasks) {
      if (subtask.estimatedDuration < this.config.minSubtaskDuration) {
        subtask.estimatedDuration = this.config.minSubtaskDuration;
      }
      if (subtask.estimatedDuration > this.config.maxSubtaskDuration) {
        subtask.estimatedDuration = this.config.maxSubtaskDuration;
        subtask.metadata = { ...subtask.metadata, durationCapped: true };
      }
    }
  }

  private updatePerformanceMetrics(breakdown: TaskBreakdownResult): void {
    this.performanceMetrics.totalBreakdowns++;
    this.performanceMetrics.successfulBreakdowns++; // Assume successful for now

    const alpha = 0.1; // Exponential moving average factor

    this.performanceMetrics.averageSpeedup =
      this.performanceMetrics.averageSpeedup * (1 - alpha) +
      breakdown.metadata.estimatedSpeedup * alpha;

    this.performanceMetrics.complexityReduction =
      this.performanceMetrics.complexityReduction * (1 - alpha) +
      breakdown.metadata.complexityReduction * alpha;

    this.performanceMetrics.parallelizationGain =
      this.performanceMetrics.parallelizationGain * (1 - alpha) +
      breakdown.expectedImprovement.parallelization * alpha;
  }

  private initializeBreakdownTemplates(): void {
    // Initialize common breakdown templates
    // Templates would be loaded from configuration or learned from experience

    logger.debug('Breakdown templates initialized', {
      templateCount: this.templates.size,
    });
  }

  /**
   * Record execution outcomes for learning and improvement
   */
  recordExecutionOutcome(
    breakdown: TaskBreakdownResult,
    executionResults: Array<{
      subtaskId: string;
      success: boolean;
      duration: number;
      parallelization: number;
      resourceEfficiency: number;
    }>,
  ): void {
    const totalDuration = executionResults.reduce(
      (sum, result) => sum + result.duration,
      0,
    );
    const successRate =
      executionResults.filter((r) => r.success).length /
      executionResults.length;
    const avgParallelization =
      executionResults.reduce((sum, r) => sum + r.parallelization, 0) /
      executionResults.length;
    const avgResourceEfficiency =
      executionResults.reduce((sum, r) => sum + r.resourceEfficiency, 0) /
      executionResults.length;

    const actualOutcome = {
      executionTime: totalDuration,
      successRate,
      parallelization: avgParallelization,
      resourceEfficiency: avgResourceEfficiency,
    };

    this.learningData.push({
      originalTask: breakdown.originalTask,
      breakdown,
      actualOutcome,
      timestamp: new Date(),
    });

    // Limit learning data size
    if (this.learningData.length > 1000) {
      this.learningData.shift();
    }

    // Update performance metrics based on actual outcomes
    if (successRate > 0.8) {
      this.performanceMetrics.successfulBreakdowns++;
    }

    logger.info('Execution outcome recorded for learning', {
      breakdownStrategy: breakdown.breakdownStrategy,
      subtaskCount: breakdown.subtasks.length,
      successRate,
      actualSpeedup: breakdown.originalTask.estimatedDuration / totalDuration,
    });

    this.emit('executionOutcomeRecorded', { breakdown, actualOutcome });
  }

  /**
   * Get breakdown performance metrics
   */
  getPerformanceMetrics(): {
    totalBreakdowns: number;
    successRate: number;
    averageSpeedup: number;
    complexityReduction: number;
    parallelizationGain: number;
    learningDataSize: number;
  } {
    const successRate =
      this.performanceMetrics.totalBreakdowns > 0
        ? this.performanceMetrics.successfulBreakdowns /
          this.performanceMetrics.totalBreakdowns
        : 0;

    return {
      ...this.performanceMetrics,
      successRate,
      learningDataSize: this.learningData.length,
    };
  }

  /**
   * Update breakdown configuration
   */
  updateConfig(newConfig: Partial<BreakdownConfig>): void {
    this.config = { ...this.config, ...newConfig };

    logger.info('Breakdown configuration updated', {
      config: this.config,
    });

    this.emit('configUpdated', this.config);
  }

  /**
   * Clear learning data and reset metrics
   */
  reset(): void {
    this.learningData.length = 0;
    this.breakdownHistory.clear();
    this.performanceMetrics = {
      totalBreakdowns: 0,
      successfulBreakdowns: 0,
      averageSpeedup: 0,
      complexityReduction: 0,
      parallelizationGain: 0,
    };

    logger.info('AutonomousTaskBreakdown reset completed');
    this.emit('reset');
  }
}
