/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { EventEmitter } from 'node:events';
import winston from 'winston';
import crypto from 'node:crypto';
import type {
  ITask,
  ITaskBreakdownStrategy,
  TaskContext,
  TaskDependency} from './interfaces/TaskInterfaces.js';
import {
  TaskType,
  TaskPriority,
  TaskStatus
} from './interfaces/TaskInterfaces.js';

/**
 * Task complexity assessment metrics
 */
export interface ComplexityAssessment {
  /** Overall complexity score (1-10) */
  score: number;
  /** Factors contributing to complexity */
  factors: ComplexityFactor[];
  /** Estimated effort in hours */
  estimatedEffort: number;
  /** Recommended breakdown approach */
  recommendedStrategy: string;
  /** Confidence in assessment (0-1) */
  confidence: number;
}

/**
 * Complexity factors that contribute to overall task complexity
 */
export interface ComplexityFactor {
  /** Factor name */
  name: string;
  /** Factor impact on complexity (1-10) */
  impact: number;
  /** Factor description */
  description: string;
  /** Factor weight in overall calculation */
  weight: number;
}

/**
 * Task decomposition result
 */
export interface DecompositionResult {
  /** Generated subtasks */
  subtasks: ITask[];
  /** Dependency relationships between subtasks */
  dependencies: TaskDependency[];
  /** Execution sequence recommendations */
  executionPlan: ExecutionPlan;
  /** Decomposition metadata */
  metadata: DecompositionMetadata;
}

/**
 * Execution plan for subtasks
 */
export interface ExecutionPlan {
  /** Parallel execution groups */
  parallelGroups: ITask[][];
  /** Sequential execution order */
  sequentialOrder: ITask[];
  /** Critical path tasks */
  criticalPath: ITask[];
  /** Estimated total execution time */
  estimatedTotalTime: number;
}

/**
 * Metadata about the decomposition process
 */
export interface DecompositionMetadata {
  /** Strategy used for breakdown */
  strategy: string;
  /** Decomposition timestamp */
  timestamp: Date;
  /** Number of subtasks generated */
  subtaskCount: number;
  /** Complexity reduction achieved */
  complexityReduction: number;
  /** Decomposition confidence score */
  confidence: number;
}

/**
 * Task breakdown configuration
 */
export interface BreakdownConfig {
  /** Maximum subtasks per breakdown */
  maxSubtasks: number;
  /** Minimum complexity threshold for breakdown */
  minComplexityThreshold: number;
  /** Maximum decomposition depth */
  maxDecompositionDepth: number;
  /** Enable automatic dependency detection */
  enableDependencyDetection: boolean;
  /** Enable intelligent subtask sizing */
  enableIntelligentSizing: boolean;
  /** Target subtask complexity score */
  targetSubtaskComplexity: number;
}

/**
 * Default breakdown configuration
 */
const DEFAULT_BREAKDOWN_CONFIG: BreakdownConfig = {
  maxSubtasks: 10,
  minComplexityThreshold: 6,
  maxDecompositionDepth: 3,
  enableDependencyDetection: true,
  enableIntelligentSizing: true,
  targetSubtaskComplexity: 4,
};

/**
 * AI-powered task breakdown engine for complex task decomposition
 *
 * Features:
 * - Intelligent complexity assessment using multiple factors
 * - Automatic task decomposition with configurable strategies
 * - Dependency detection and sequencing optimization
 * - Subtask generation with proper parent-child relationships
 * - Task estimation and timeline prediction
 * - Multiple breakdown strategies for different task types
 */
export class TaskBreakdownEngine extends EventEmitter {
  private readonly logger: winston.Logger;
  private readonly config: BreakdownConfig;
  private readonly strategies: Map<string, ITaskBreakdownStrategy> = new Map();
  private readonly complexityFactors: ComplexityFactor[] = [];

  constructor(config: Partial<BreakdownConfig> = {}) {
    super();

    this.config = { ...DEFAULT_BREAKDOWN_CONFIG, ...config };
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      defaultMeta: { component: 'TaskBreakdownEngine' },
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          ),
        }),
      ],
    });

    this.initializeComplexityFactors();
    this.initializeDefaultStrategies();

    this.logger.info('TaskBreakdownEngine initialized', { config: this.config });
  }

  /**
   * Assess task complexity using multiple factors
   */
  assessComplexity(task: ITask): ComplexityAssessment {
    const startTime = performance.now();

    try {
      const applicableFactors: ComplexityFactor[] = [];
      let totalScore = 0;
      let totalWeight = 0;

      // Analyze task against each complexity factor
      for (const factor of this.complexityFactors) {
        const impact = this.calculateFactorImpact(task, factor);
        if (impact > 0) {
          applicableFactors.push({
            ...factor,
            impact,
          });
          totalScore += impact * factor.weight;
          totalWeight += factor.weight;
        }
      }

      // Calculate final complexity score
      const complexityScore = totalWeight > 0 ? totalScore / totalWeight : 1;

      // Estimate effort based on complexity
      const baseEffort = this.getBaseEffortForTaskType(task.type);
      const estimatedEffort = Math.ceil(baseEffort * (complexityScore / 5));

      // Determine recommended strategy
      const recommendedStrategy = this.selectOptimalStrategy(task, complexityScore);

      // Calculate confidence based on factor coverage
      const confidence = Math.min(applicableFactors.length / this.complexityFactors.length, 1.0);

      const assessment: ComplexityAssessment = {
        score: Math.max(1, Math.min(10, Math.round(complexityScore))),
        factors: applicableFactors,
        estimatedEffort,
        recommendedStrategy,
        confidence,
      };

      const duration = performance.now() - startTime;
      this.logger.info('Task complexity assessed', {
        taskId: task.id,
        complexityScore: assessment.score,
        estimatedEffort: assessment.estimatedEffort,
        recommendedStrategy: assessment.recommendedStrategy,
        factorCount: applicableFactors.length,
        confidence: assessment.confidence,
        assessmentDuration: `${duration.toFixed(2)}ms`,
      });

      return assessment;

    } catch (error) {
      this.logger.error('Failed to assess task complexity', {
        taskId: task.id,
        error: error instanceof Error ? error.message : String(error),
      });

      // Return fallback assessment
      return {
        score: 5,
        factors: [],
        estimatedEffort: this.getBaseEffortForTaskType(task.type),
        recommendedStrategy: 'default',
        confidence: 0.1,
      };
    }
  }

  /**
   * Break down complex task into manageable subtasks
   */
  async decomposeTask(
    task: ITask,
    context: TaskContext,
    depth: number = 0
  ): Promise<DecompositionResult> {
    const startTime = performance.now();

    try {
      // Check decomposition depth limits
      if (depth >= this.config.maxDecompositionDepth) {
        this.logger.warn('Maximum decomposition depth reached', {
          taskId: task.id,
          depth,
          maxDepth: this.config.maxDecompositionDepth,
        });
        return this.createEmptyDecompositionResult();
      }

      // Assess task complexity
      const complexity = this.assessComplexity(task);

      // Check if task meets breakdown threshold
      if (complexity.score < this.config.minComplexityThreshold) {
        this.logger.info('Task complexity below breakdown threshold', {
          taskId: task.id,
          complexityScore: complexity.score,
          threshold: this.config.minComplexityThreshold,
        });
        return this.createEmptyDecompositionResult();
      }

      // Select and apply breakdown strategy
      const strategy = this.strategies.get(complexity.recommendedStrategy);
      if (!strategy) {
        throw new Error(`Strategy not found: ${complexity.recommendedStrategy}`);
      }

      // Generate subtasks using selected strategy
      const subtasks = await strategy.breakdownTask(task, context);

      // Limit number of subtasks
      const limitedSubtasks = subtasks.slice(0, this.config.maxSubtasks);

      // Detect and create dependencies
      const dependencies = this.config.enableDependencyDetection
        ? this.detectTaskDependencies(limitedSubtasks, task)
        : [];

      // Create execution plan
      const executionPlan = this.createExecutionPlan(limitedSubtasks, dependencies);

      // Calculate metadata
      const metadata: DecompositionMetadata = {
        strategy: strategy.name,
        timestamp: new Date(),
        subtaskCount: limitedSubtasks.length,
        complexityReduction: this.calculateComplexityReduction(task, limitedSubtasks),
        confidence: complexity.confidence,
      };

      const result: DecompositionResult = {
        subtasks: limitedSubtasks,
        dependencies,
        executionPlan,
        metadata,
      };

      const duration = performance.now() - startTime;
      this.logger.info('Task decomposition completed', {
        taskId: task.id,
        strategy: strategy.name,
        subtaskCount: limitedSubtasks.length,
        dependencyCount: dependencies.length,
        complexityReduction: metadata.complexityReduction,
        decompositionDuration: `${duration.toFixed(2)}ms`,
      });

      this.emit('task-decomposed', task, result);
      return result;

    } catch (error) {
      this.logger.error('Failed to decompose task', {
        taskId: task.id,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Generate subtasks with proper parent-child relationships
   */
  async generateSubtasks(
    parentTask: ITask,
    decomposition: DecompositionResult,
    context: TaskContext
  ): Promise<ITask[]> {
    const startTime = performance.now();

    try {
      const subtasks: ITask[] = [];

      for (const [index, subtask] of decomposition.subtasks.entries()) {
        // Create subtask with parent relationship
        const enhancedSubtask = await this.createSubtask(
          parentTask,
          subtask,
          index,
          context
        );

        // Apply intelligent sizing if enabled
        if (this.config.enableIntelligentSizing) {
          this.applyIntelligentSizing(enhancedSubtask, parentTask);
        }

        subtasks.push(enhancedSubtask);
      }

      // Update parent task with subtask references
      parentTask.subtasks = subtasks.map(st => st.id);

      const duration = performance.now() - startTime;
      this.logger.info('Subtasks generated successfully', {
        parentTaskId: parentTask.id,
        subtaskCount: subtasks.length,
        generationDuration: `${duration.toFixed(2)}ms`,
      });

      return subtasks;

    } catch (error) {
      this.logger.error('Failed to generate subtasks', {
        parentTaskId: parentTask.id,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Register a task breakdown strategy
   */
  registerStrategy(strategy: ITaskBreakdownStrategy): void {
    this.strategies.set(strategy.name, strategy);
    this.logger.info('Breakdown strategy registered', {
      strategyName: strategy.name,
      supportedTypes: strategy.supportedTypes,
    });
  }

  /**
   * Get all registered strategies
   */
  getStrategies(): ITaskBreakdownStrategy[] {
    return Array.from(this.strategies.values());
  }

  /**
   * Update breakdown configuration
   */
  updateConfig(updates: Partial<BreakdownConfig>): void {
    Object.assign(this.config, updates);
    this.logger.info('Breakdown configuration updated', {
      updates,
      newConfig: this.config,
    });
  }

  /**
   * Get current configuration
   */
  getConfig(): BreakdownConfig {
    return { ...this.config };
  }

  /**
   * Initialize default complexity factors
   */
  private initializeComplexityFactors(): void {
    this.complexityFactors.push(
      {
        name: 'description_length',
        impact: 0,
        description: 'Task description length indicating scope complexity',
        weight: 2.0,
      },
      {
        name: 'parameter_count',
        impact: 0,
        description: 'Number of task parameters indicating configuration complexity',
        weight: 1.5,
      },
      {
        name: 'dependency_count',
        impact: 0,
        description: 'Number of task dependencies indicating coordination complexity',
        weight: 3.0,
      },
      {
        name: 'task_type_complexity',
        impact: 0,
        description: 'Inherent complexity of the task type',
        weight: 2.5,
      },
      {
        name: 'priority_complexity',
        impact: 0,
        description: 'Priority level indicating urgency and complexity tradeoffs',
        weight: 1.0,
      },
      {
        name: 'context_complexity',
        impact: 0,
        description: 'Execution context requirements complexity',
        weight: 2.0,
      }
    );
  }

  /**
   * Initialize default breakdown strategies
   */
  private initializeDefaultStrategies(): void {
    // Register built-in strategies
    this.registerStrategy(new SequentialBreakdownStrategy());
    this.registerStrategy(new ParallelBreakdownStrategy());
    this.registerStrategy(new FeatureBreakdownStrategy());
    this.registerStrategy(new LayeredBreakdownStrategy());
  }

  /**
   * Calculate impact of complexity factor on specific task
   */
  private calculateFactorImpact(task: ITask, factor: ComplexityFactor): number {
    switch (factor.name) {
      case 'description_length':
        return Math.min(10, Math.max(1, task.description.length / 100));

      case 'parameter_count':
        return Math.min(10, Math.max(1, Object.keys(task.parameters).length));

      case 'dependency_count':
        return Math.min(10, Math.max(1, task.dependencies.length * 2));

      case 'task_type_complexity':
        return this.getTaskTypeComplexity(task.type);

      case 'priority_complexity':
        // Higher priority often means more complex requirements
        return task.priority <= TaskPriority.HIGH ? 8 : 4;

      case 'context_complexity':
        const contextKeys = Object.keys(task.context?.config || {});
        return Math.min(10, Math.max(1, contextKeys.length / 2));

      default:
        return 1;
    }
  }

  /**
   * Get base complexity score for task type
   */
  private getTaskTypeComplexity(type: TaskType): number {
    const complexityMap: Record<TaskType, number> = {
      [TaskType.CODE_GENERATION]: 8,
      [TaskType.CODE_ANALYSIS]: 6,
      [TaskType.TESTING]: 7,
      [TaskType.DOCUMENTATION]: 4,
      [TaskType.BUILD]: 5,
      [TaskType.DEPLOYMENT]: 9,
      [TaskType.REFACTORING]: 7,
      [TaskType.BUG_FIX]: 6,
      [TaskType.FEATURE]: 9,
      [TaskType.MAINTENANCE]: 5,
      [TaskType.SECURITY]: 8,
      [TaskType.PERFORMANCE]: 7,
    };

    return complexityMap[type] || 5;
  }

  /**
   * Get base effort estimate for task type (in hours)
   */
  private getBaseEffortForTaskType(type: TaskType): number {
    const effortMap: Record<TaskType, number> = {
      [TaskType.CODE_GENERATION]: 8,
      [TaskType.CODE_ANALYSIS]: 4,
      [TaskType.TESTING]: 6,
      [TaskType.DOCUMENTATION]: 3,
      [TaskType.BUILD]: 2,
      [TaskType.DEPLOYMENT]: 4,
      [TaskType.REFACTORING]: 6,
      [TaskType.BUG_FIX]: 4,
      [TaskType.FEATURE]: 12,
      [TaskType.MAINTENANCE]: 3,
      [TaskType.SECURITY]: 8,
      [TaskType.PERFORMANCE]: 6,
    };

    return effortMap[type] || 4;
  }

  /**
   * Select optimal breakdown strategy based on task and complexity
   */
  private selectOptimalStrategy(task: ITask, complexityScore: number): string {
    // Strategy selection logic based on task characteristics
    if (task.type === TaskType.FEATURE && complexityScore >= 8) {
      return 'feature';
    } else if (task.dependencies.length > 0) {
      return 'sequential';
    } else if (complexityScore >= 7) {
      return 'layered';
    } else {
      return 'parallel';
    }
  }

  /**
   * Detect dependencies between subtasks
   */
  private detectTaskDependencies(subtasks: ITask[], parentTask: ITask): TaskDependency[] {
    const dependencies: TaskDependency[] = [];

    // Simple dependency detection based on task types and names
    for (let i = 0; i < subtasks.length; i++) {
      for (let j = i + 1; j < subtasks.length; j++) {
        const taskA = subtasks[i];
        const taskB = subtasks[j];

        // Check for logical dependencies
        if (this.hasLogicalDependency(taskA, taskB)) {
          dependencies.push({
            taskId: taskB.id,
            type: 'prerequisite',
            optional: false,
          });
        }

        // Check for resource dependencies
        if (this.hasResourceDependency(taskA, taskB)) {
          dependencies.push({
            taskId: taskB.id,
            type: 'resource_dependency',
            optional: true,
          });
        }
      }
    }

    return dependencies;
  }

  /**
   * Check if two tasks have a logical dependency
   */
  private hasLogicalDependency(taskA: ITask, taskB: ITask): boolean {
    // Simple heuristics for dependency detection
    const aName = taskA.name.toLowerCase();
    const bName = taskB.name.toLowerCase();

    // Setup -> Implementation -> Testing -> Documentation pattern
    if (aName.includes('setup') && bName.includes('implement')) return true;
    if (aName.includes('implement') && bName.includes('test')) return true;
    if (aName.includes('test') && bName.includes('document')) return true;
    if (aName.includes('analyze') && bName.includes('implement')) return true;
    if (aName.includes('design') && bName.includes('implement')) return true;

    return false;
  }

  /**
   * Check if two tasks have a resource dependency
   */
  private hasResourceDependency(taskA: ITask, taskB: ITask): boolean {
    // Check for shared resources in task parameters
    const aResources = this.extractResourcesFromTask(taskA);
    const bResources = this.extractResourcesFromTask(taskB);

    return aResources.some(resource => bResources.includes(resource));
  }

  /**
   * Extract resource identifiers from task parameters
   */
  private extractResourcesFromTask(task: ITask): string[] {
    const resources: string[] = [];

    // Extract file paths, database names, service names, etc.
    for (const [key, value] of Object.entries(task.parameters)) {
      if (typeof value === 'string') {
        if (key.includes('file') || key.includes('path') || key.includes('resource')) {
          resources.push(value);
        }
      }
    }

    return resources;
  }

  /**
   * Create execution plan for subtasks
   */
  private createExecutionPlan(
    subtasks: ITask[],
    dependencies: TaskDependency[]
  ): ExecutionPlan {
    // Simple execution planning - can be enhanced with graph algorithms
    const parallelGroups: ITask[][] = [];
    const sequentialOrder = [...subtasks];
    const criticalPath = this.findCriticalPath(subtasks, dependencies);

    // Group independent tasks for parallel execution
    const independentTasks = subtasks.filter(task =>
      !dependencies.some(dep => dep.taskId === task.id)
    );

    if (independentTasks.length > 1) {
      parallelGroups.push(independentTasks);
    }

    // Estimate total execution time
    const estimatedTotalTime = criticalPath.reduce((total, task) => {
      const complexity = this.assessComplexity(task);
      return total + complexity.estimatedEffort * 3600; // Convert hours to seconds
    }, 0);

    return {
      parallelGroups,
      sequentialOrder,
      criticalPath,
      estimatedTotalTime,
    };
  }

  /**
   * Find critical path through task dependencies
   */
  private findCriticalPath(subtasks: ITask[], dependencies: TaskDependency[]): ITask[] {
    // Simple critical path algorithm - find longest dependency chain
    const dependencyMap = new Map<string, string[]>();

    for (const dep of dependencies) {
      const dependents = dependencyMap.get(dep.taskId) || [];
      dependents.push(dep.taskId);
      dependencyMap.set(dep.taskId, dependents);
    }

    // Find task with longest chain
    let longestChain: ITask[] = [];
    for (const task of subtasks) {
      const chain = this.buildDependencyChain(task, dependencyMap, subtasks);
      if (chain.length > longestChain.length) {
        longestChain = chain;
      }
    }

    return longestChain;
  }

  /**
   * Build dependency chain for a task
   */
  private buildDependencyChain(
    task: ITask,
    dependencyMap: Map<string, string[]>,
    allTasks: ITask[]
  ): ITask[] {
    const chain = [task];
    const dependents = dependencyMap.get(task.id) || [];

    for (const dependentId of dependents) {
      const dependent = allTasks.find(t => t.id === dependentId);
      if (dependent) {
        const subChain = this.buildDependencyChain(dependent, dependencyMap, allTasks);
        if (subChain.length > 0) {
          chain.push(...subChain);
        }
      }
    }

    return chain;
  }

  /**
   * Calculate complexity reduction achieved by decomposition
   */
  private calculateComplexityReduction(parentTask: ITask, subtasks: ITask[]): number {
    const parentComplexity = this.assessComplexity(parentTask).score;
    const totalSubtaskComplexity = subtasks.reduce((total, subtask) => total + this.assessComplexity(subtask).score, 0);

    const averageSubtaskComplexity = totalSubtaskComplexity / subtasks.length;
    return Math.max(0, parentComplexity - averageSubtaskComplexity);
  }

  /**
   * Create subtask with proper parent-child relationship
   */
  private async createSubtask(
    parentTask: ITask,
    templateTask: ITask,
    index: number,
    context: TaskContext
  ): Promise<ITask> {
    const subtaskId = this.generateSubtaskId(parentTask.id, index);

    // Create subtask with enhanced properties
    const subtask: ITask = {
      ...templateTask,
      id: subtaskId,
      parentTaskId: parentTask.id,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: TaskStatus.PENDING,
      context: { ...context },
      tags: [...(templateTask.tags || []), `parent:${parentTask.id}`, 'subtask'],
    };

    return subtask;
  }

  /**
   * Generate unique subtask ID
   */
  private generateSubtaskId(parentTaskId: string, index: number): string {
    const timestamp = Date.now();
    const random = crypto.randomBytes(4).toString('hex');
    return `subtask_${parentTaskId}_${index}_${timestamp}_${random}`;
  }

  /**
   * Apply intelligent sizing to subtask
   */
  private applyIntelligentSizing(subtask: ITask, parentTask: ITask): void {
    const complexity = this.assessComplexity(subtask);

    // Adjust subtask scope if too complex
    if (complexity.score > this.config.targetSubtaskComplexity) {
      // Mark for further breakdown
      subtask.tags = [...(subtask.tags || []), 'needs-breakdown'];
    }

    // Adjust priority based on parent and complexity
    if (complexity.score >= 8 && parentTask.priority <= TaskPriority.HIGH) {
      subtask.priority = TaskPriority.HIGH;
    }
  }

  /**
   * Create empty decomposition result
   */
  private createEmptyDecompositionResult(): DecompositionResult {
    return {
      subtasks: [],
      dependencies: [],
      executionPlan: {
        parallelGroups: [],
        sequentialOrder: [],
        criticalPath: [],
        estimatedTotalTime: 0,
      },
      metadata: {
        strategy: 'none',
        timestamp: new Date(),
        subtaskCount: 0,
        complexityReduction: 0,
        confidence: 1.0,
      },
    };
  }
}

// Default breakdown strategies implementation

/**
 * Sequential breakdown strategy for dependent tasks
 */
class SequentialBreakdownStrategy implements ITaskBreakdownStrategy {
  readonly name = 'sequential';
  readonly description = 'Breaks down tasks into sequential steps with dependencies';
  readonly supportedTypes = [TaskType.FEATURE, TaskType.CODE_GENERATION, TaskType.DEPLOYMENT];

  canBreakdown(task: ITask): boolean {
    return task.dependencies.length > 0 || task.type === TaskType.DEPLOYMENT;
  }

  async breakdownTask(task: ITask, context: TaskContext): Promise<ITask[]> {
    const subtasks: ITask[] = [];
    const phases = ['analyze', 'design', 'implement', 'test', 'document'];

    for (const [index, phase] of phases.entries()) {
      subtasks.push({
        ...task,
        id: `${task.id}_${phase}_${index}`,
        name: `${phase.charAt(0).toUpperCase() + phase.slice(1)}: ${task.name}`,
        description: `${phase} phase for ${task.description}`,
        priority: index === 0 ? TaskPriority.HIGH : task.priority,
        dependencies: index > 0 ? [{
          taskId: `${task.id}_${phases[index - 1]}_${index - 1}`,
          type: 'prerequisite',
          optional: false,
        }] : [],
        subtasks: [],
        parentTaskId: task.id,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: TaskStatus.PENDING,
        context,
        parameters: { ...task.parameters, phase },
        tags: [...(task.tags || []), phase],
        execute: async () => ({ success: true, messages: [], metrics: {} as any }),
        validate: () => true,
        cancel: async () => true,
        clone: () => task,
        getProgress: () => 0,
        getEstimatedCompletion: () => 0,
      } as ITask);
    }

    return subtasks;
  }

  estimateComplexity(task: ITask): number {
    return Math.max(5, task.description.length / 50);
  }

  validateBreakdown(originalTask: ITask, subtasks: ITask[]): boolean {
    return subtasks.length > 0 && subtasks.every(st => st.parentTaskId === originalTask.id);
  }
}

/**
 * Parallel breakdown strategy for independent tasks
 */
class ParallelBreakdownStrategy implements ITaskBreakdownStrategy {
  readonly name = 'parallel';
  readonly description = 'Breaks down tasks into parallel independent subtasks';
  readonly supportedTypes = [TaskType.TESTING, TaskType.CODE_ANALYSIS, TaskType.DOCUMENTATION];

  canBreakdown(task: ITask): boolean {
    return task.dependencies.length === 0 && task.type !== TaskType.DEPLOYMENT;
  }

  async breakdownTask(task: ITask, context: TaskContext): Promise<ITask[]> {
    const subtasks: ITask[] = [];
    const components = this.identifyParallelComponents(task);

    for (const [index, component] of components.entries()) {
      subtasks.push({
        ...task,
        id: `${task.id}_parallel_${index}`,
        name: `${component}: ${task.name}`,
        description: `${component} component of ${task.description}`,
        priority: task.priority,
        dependencies: [],
        subtasks: [],
        parentTaskId: task.id,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: TaskStatus.PENDING,
        context,
        parameters: { ...task.parameters, component },
        tags: [...(task.tags || []), component, 'parallel'],
        execute: async () => ({ success: true, messages: [], metrics: {} as any }),
        validate: () => true,
        cancel: async () => true,
        clone: () => task,
        getProgress: () => 0,
        getEstimatedCompletion: () => 0,
      } as ITask);
    }

    return subtasks;
  }

  private identifyParallelComponents(task: ITask): string[] {
    // Simple component identification based on task type
    switch (task.type) {
      case TaskType.TESTING:
        return ['unit-tests', 'integration-tests', 'e2e-tests'];
      case TaskType.CODE_ANALYSIS:
        return ['security-analysis', 'performance-analysis', 'quality-analysis'];
      case TaskType.DOCUMENTATION:
        return ['api-docs', 'user-docs', 'technical-docs'];
      default:
        return ['component-1', 'component-2', 'component-3'];
    }
  }

  estimateComplexity(task: ITask): number {
    return Math.min(8, Math.max(3, Object.keys(task.parameters).length));
  }

  validateBreakdown(originalTask: ITask, subtasks: ITask[]): boolean {
    return subtasks.length > 1 && subtasks.every(st => st.dependencies.length === 0);
  }
}

/**
 * Feature-specific breakdown strategy
 */
class FeatureBreakdownStrategy implements ITaskBreakdownStrategy {
  readonly name = 'feature';
  readonly description = 'Breaks down features into logical components';
  readonly supportedTypes = [TaskType.FEATURE, TaskType.CODE_GENERATION];

  canBreakdown(task: ITask): boolean {
    return task.type === TaskType.FEATURE && task.description.length > 200;
  }

  async breakdownTask(task: ITask, context: TaskContext): Promise<ITask[]> {
    const subtasks: ITask[] = [];
    const featureComponents = ['backend', 'frontend', 'database', 'tests', 'documentation'];

    for (const [index, component] of featureComponents.entries()) {
      subtasks.push({
        ...task,
        id: `${task.id}_${component}_${index}`,
        name: `${component.charAt(0).toUpperCase() + component.slice(1)}: ${task.name}`,
        description: `${component} implementation for ${task.description}`,
        type: this.mapComponentToTaskType(component),
        priority: component === 'backend' ? TaskPriority.HIGH : task.priority,
        dependencies: this.getComponentDependencies(component, featureComponents, task.id),
        subtasks: [],
        parentTaskId: task.id,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: TaskStatus.PENDING,
        context,
        parameters: { ...task.parameters, component },
        tags: [...(task.tags || []), component, 'feature-component'],
        execute: async () => ({ success: true, messages: [], metrics: {} as any }),
        validate: () => true,
        cancel: async () => true,
        clone: () => task,
        getProgress: () => 0,
        getEstimatedCompletion: () => 0,
      } as ITask);
    }

    return subtasks;
  }

  private mapComponentToTaskType(component: string): TaskType {
    const typeMap: Record<string, TaskType> = {
      backend: TaskType.CODE_GENERATION,
      frontend: TaskType.CODE_GENERATION,
      database: TaskType.CODE_GENERATION,
      tests: TaskType.TESTING,
      documentation: TaskType.DOCUMENTATION,
    };
    return typeMap[component] || TaskType.CODE_GENERATION;
  }

  private getComponentDependencies(
    component: string,
    allComponents: string[],
    parentTaskId: string
  ): TaskDependency[] {
    const dependencies: TaskDependency[] = [];
    const componentIndex = allComponents.indexOf(component);

    // Simple dependency rules
    if (component === 'frontend' || component === 'tests') {
      const backendIndex = allComponents.indexOf('backend');
      if (backendIndex !== -1 && backendIndex < componentIndex) {
        dependencies.push({
          taskId: `${parentTaskId}_backend_${backendIndex}`,
          type: 'prerequisite',
          optional: false,
        });
      }
    }

    if (component === 'documentation') {
      // Documentation depends on implementation components
      for (const [index, dep] of allComponents.entries()) {
        if (dep !== 'documentation' && index < componentIndex) {
          dependencies.push({
            taskId: `${parentTaskId}_${dep}_${index}`,
            type: 'soft_dependency',
            optional: true,
          });
        }
      }
    }

    return dependencies;
  }

  estimateComplexity(task: ITask): number {
    return Math.max(7, Math.min(10, task.description.length / 100));
  }

  validateBreakdown(originalTask: ITask, subtasks: ITask[]): boolean {
    return subtasks.length >= 3 && subtasks.some(st => st.type === TaskType.TESTING);
  }
}

/**
 * Layered breakdown strategy for architectural components
 */
class LayeredBreakdownStrategy implements ITaskBreakdownStrategy {
  readonly name = 'layered';
  readonly description = 'Breaks down tasks into architectural layers';
  readonly supportedTypes = [TaskType.REFACTORING, TaskType.SECURITY, TaskType.PERFORMANCE];

  canBreakdown(task: ITask): boolean {
    return [TaskType.REFACTORING, TaskType.SECURITY, TaskType.PERFORMANCE].includes(task.type);
  }

  async breakdownTask(task: ITask, context: TaskContext): Promise<ITask[]> {
    const subtasks: ITask[] = [];
    const layers = ['infrastructure', 'data', 'business', 'presentation'];

    for (const [index, layer] of layers.entries()) {
      subtasks.push({
        ...task,
        id: `${task.id}_layer_${layer}_${index}`,
        name: `${layer.charAt(0).toUpperCase() + layer.slice(1)} Layer: ${task.name}`,
        description: `${layer} layer work for ${task.description}`,
        priority: layer === 'infrastructure' ? TaskPriority.HIGH : task.priority,
        dependencies: index > 0 ? [{
          taskId: `${task.id}_layer_${layers[index - 1]}_${index - 1}`,
          type: 'soft_dependency',
          optional: true,
        }] : [],
        subtasks: [],
        parentTaskId: task.id,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: TaskStatus.PENDING,
        context,
        parameters: { ...task.parameters, layer },
        tags: [...(task.tags || []), layer, 'architectural-layer'],
        execute: async () => ({ success: true, messages: [], metrics: {} as any }),
        validate: () => true,
        cancel: async () => true,
        clone: () => task,
        getProgress: () => 0,
        getEstimatedCompletion: () => 0,
      } as ITask);
    }

    return subtasks;
  }

  estimateComplexity(task: ITask): number {
    const baseComplexity = task.type === TaskType.SECURITY ? 8 : 6;
    return Math.max(baseComplexity, Math.min(10, task.dependencies.length + 5));
  }

  validateBreakdown(originalTask: ITask, subtasks: ITask[]): boolean {
    return subtasks.length === 4 && subtasks.every(st => st.tags?.includes('architectural-layer'));
  }
}