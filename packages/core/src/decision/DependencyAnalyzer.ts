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
  DependencyType,
  TaskPriority,
  TaskCategory,
  CircularDependency,
} from '../task-management/types.js';
import type {
  Decision,
  DecisionContext,
  DecisionType,
  DecisionPriority,
} from './types.js';
import { getComponentLogger } from '../utils/logger.js';

const logger = getComponentLogger('DependencyAnalyzer');

/**
 * Configuration for dependency analysis algorithms
 */
export interface DependencyAnalysisConfig {
  /** Enable automatic dependency learning from task patterns */
  enableAutoLearning: boolean;
  /** Weight factors for different dependency detection methods */
  detectionWeights: {
    semantic: number;
    temporal: number;
    resource: number;
    pattern: number;
  };
  /** Confidence threshold for automatic dependency creation */
  autoCreateThreshold: number;
  /** Maximum analysis depth for complex dependency chains */
  maxAnalysisDepth: number;
  /** Cache size for dependency analysis results */
  cacheSize: number;
}

/**
 * Result of dependency analysis
 */
export interface DependencyAnalysisResult {
  /** Detected potential dependencies */
  suggestedDependencies: TaskDependency[];
  /** Confidence scores for each suggestion */
  confidenceScores: Map<string, number>;
  /** Conflict analysis results */
  conflicts: DependencyConflict[];
  /** Performance impact analysis */
  performanceImpact: PerformanceImpact;
  /** Optimization recommendations */
  optimizations: DependencyOptimization[];
}

/**
 * Dependency conflict information
 */
export interface DependencyConflict {
  /** Type of conflict detected */
  type: 'circular' | 'resource' | 'temporal' | 'logical';
  /** Tasks involved in the conflict */
  involvedTasks: TaskId[];
  /** Severity of the conflict */
  severity: 'low' | 'medium' | 'high' | 'critical';
  /** Description of the conflict */
  description: string;
  /** Suggested resolution strategies */
  resolutionStrategies: ConflictResolution[];
}

/**
 * Conflict resolution strategy
 */
export interface ConflictResolution {
  /** Type of resolution */
  type: 'reorder' | 'split' | 'merge' | 'remove_dependency' | 'add_resource';
  /** Description of the resolution */
  description: string;
  /** Estimated effort to implement */
  effort: 'low' | 'medium' | 'high';
  /** Expected impact on performance */
  impactOnPerformance: number; // -1 to 1, where 1 is significant improvement
}

/**
 * Performance impact analysis
 */
export interface PerformanceImpact {
  /** Current critical path length */
  criticalPathLength: number;
  /** Estimated total execution time */
  totalExecutionTime: number;
  /** Parallelization potential (0-1) */
  parallelizationPotential: number;
  /** Resource utilization efficiency (0-1) */
  resourceUtilization: number;
  /** Bottleneck analysis */
  bottlenecks: Array<{
    taskId: TaskId;
    type: 'dependency' | 'resource' | 'duration';
    impact: number; // Time saved if resolved (ms)
  }>;
}

/**
 * Dependency optimization recommendation
 */
export interface DependencyOptimization {
  /** Type of optimization */
  type:
    | 'parallel_execution'
    | 'dependency_removal'
    | 'resource_allocation'
    | 'task_splitting';
  /** Target tasks */
  targetTasks: TaskId[];
  /** Description of the optimization */
  description: string;
  /** Expected benefit */
  expectedBenefit: {
    timeReduction: number; // milliseconds
    resourceEfficiency: number; // 0-1
    riskLevel: 'low' | 'medium' | 'high';
  };
  /** Implementation steps */
  implementation: string[];
}

/**
 * Dependency learning pattern
 */
interface DependencyPattern {
  /** Pattern identifier */
  id: string;
  /** Pattern description */
  description: string;
  /** Task categories this pattern applies to */
  categories: TaskCategory[];
  /** Confidence level of this pattern */
  confidence: number;
  /** Number of times this pattern has been observed */
  occurrences: number;
  /** Pattern matching function */
  matcher: (task1: Task, task2: Task) => number; // Returns confidence 0-1
}

/**
 * Advanced dependency analysis system with intelligent learning capabilities
 */
export class DependencyAnalyzer {
  private config: DependencyAnalysisConfig;
  private dependencyPatterns: Map<string, DependencyPattern>;
  private analysisCache: Map<string, DependencyAnalysisResult>;
  private learningHistory: Map<
    string,
    Array<{ pattern: string; confidence: number; timestamp: number }>
  >;

  constructor(config: Partial<DependencyAnalysisConfig> = {}) {
    this.config = {
      enableAutoLearning: true,
      detectionWeights: {
        semantic: 0.3,
        temporal: 0.25,
        resource: 0.25,
        pattern: 0.2,
      },
      autoCreateThreshold: 0.75,
      maxAnalysisDepth: 10,
      cacheSize: 1000,
      ...config,
    };

    this.dependencyPatterns = new Map();
    this.analysisCache = new Map();
    this.learningHistory = new Map();

    this.initializePatterns();
  }

  /**
   * Analyze dependencies for a set of tasks
   */
  async analyzeDependencies(
    tasks: Map<TaskId, Task>,
    existingDependencies: TaskDependency[] = [],
    context?: DecisionContext,
  ): Promise<DependencyAnalysisResult> {
    logger.debug('Starting dependency analysis', {
      taskCount: tasks.size,
      existingDependencies: existingDependencies.length,
    });

    const cacheKey = this.generateCacheKey(tasks, existingDependencies);
    const cached = this.analysisCache.get(cacheKey);
    if (cached) {
      logger.debug('Returning cached analysis result');
      return cached;
    }

    const startTime = Date.now();

    // Step 1: Semantic dependency analysis
    const semanticDependencies = await this.analyzeSemanticDependencies(tasks);
    logger.debug('Semantic analysis complete', {
      found: semanticDependencies.length,
    });

    // Step 2: Temporal dependency analysis
    const temporalDependencies = await this.analyzeTemporalDependencies(tasks);
    logger.debug('Temporal analysis complete', {
      found: temporalDependencies.length,
    });

    // Step 3: Resource dependency analysis
    const resourceDependencies = await this.analyzeResourceDependencies(tasks);
    logger.debug('Resource analysis complete', {
      found: resourceDependencies.length,
    });

    // Step 4: Pattern-based dependency analysis
    const patternDependencies = await this.analyzePatternDependencies(tasks);
    logger.debug('Pattern analysis complete', {
      found: patternDependencies.length,
    });

    // Step 5: Merge and score dependencies
    const allSuggestions = this.mergeDependencySuggestions([
      ...semanticDependencies,
      ...temporalDependencies,
      ...resourceDependencies,
      ...patternDependencies,
    ]);

    const confidenceScores = this.calculateConfidenceScores(
      allSuggestions,
      tasks,
    );

    // Step 6: Filter by confidence threshold
    const suggestedDependencies = allSuggestions.filter(
      (dep) =>
        (confidenceScores.get(this.getDependencyKey(dep)) ?? 0) >=
        this.config.autoCreateThreshold,
    );

    // Step 7: Conflict analysis
    const conflicts = await this.analyzeConflicts(tasks, [
      ...existingDependencies,
      ...suggestedDependencies,
    ]);

    // Step 8: Performance impact analysis
    const performanceImpact = await this.analyzePerformanceImpact(tasks, [
      ...existingDependencies,
      ...suggestedDependencies,
    ]);

    // Step 9: Generate optimizations
    const optimizations = await this.generateOptimizations(
      tasks,
      [...existingDependencies, ...suggestedDependencies],
      performanceImpact,
    );

    const result: DependencyAnalysisResult = {
      suggestedDependencies,
      confidenceScores,
      conflicts,
      performanceImpact,
      optimizations,
    };

    // Cache the result
    this.cacheResult(cacheKey, result);

    // Update learning patterns if enabled
    if (this.config.enableAutoLearning) {
      this.updateLearningPatterns(tasks, result);
    }

    const analysisTime = Date.now() - startTime;
    logger.info('Dependency analysis complete', {
      analysisTime,
      suggestedDependencies: suggestedDependencies.length,
      conflicts: conflicts.length,
      optimizations: optimizations.length,
    });

    return result;
  }

  /**
   * Analyze semantic dependencies based on task content and descriptions
   */
  private async analyzeSemanticDependencies(
    tasks: Map<TaskId, Task>,
  ): Promise<TaskDependency[]> {
    const dependencies: TaskDependency[] = [];
    const taskArray = Array.from(tasks.values());

    for (let i = 0; i < taskArray.length; i++) {
      for (let j = 0; j < taskArray.length; j++) {
        if (i === j) continue;

        const task1 = taskArray[i];
        const task2 = taskArray[j];

        const semanticSimilarity = this.calculateSemanticSimilarity(
          task1,
          task2,
        );
        const dependencyStrength = this.calculateDependencyStrength(
          task1,
          task2,
        );

        if (semanticSimilarity > 0.6 && dependencyStrength > 0.5) {
          const dependencyType = this.inferDependencyType(task1, task2);
          dependencies.push({
            dependentTaskId: task2.id,
            dependsOnTaskId: task1.id,
            type: dependencyType,
            reason: `Semantic analysis: ${semanticSimilarity.toFixed(2)} similarity, ${dependencyStrength.toFixed(2)} dependency strength`,
            parallelizable: dependencyType === 'soft',
          });
        }
      }
    }

    return dependencies;
  }

  /**
   * Analyze temporal dependencies based on task timing and urgency
   */
  private async analyzeTemporalDependencies(
    tasks: Map<TaskId, Task>,
  ): Promise<TaskDependency[]> {
    const dependencies: TaskDependency[] = [];
    const taskArray = Array.from(tasks.values()).sort(
      (a, b) => a.metadata.createdAt.getTime() - b.metadata.createdAt.getTime(),
    );

    for (let i = 0; i < taskArray.length - 1; i++) {
      const earlierTask = taskArray[i];
      const laterTask = taskArray[i + 1];

      const timeDiff =
        laterTask.metadata.createdAt.getTime() -
        earlierTask.metadata.createdAt.getTime();
      const urgencyFactor = this.calculateUrgencyFactor(earlierTask, laterTask);

      // If tasks were created close together and have related categories
      if (
        timeDiff < 5 * 60 * 1000 && // Within 5 minutes
        this.areRelatedCategories(earlierTask.category, laterTask.category) &&
        urgencyFactor > 0.4
      ) {
        dependencies.push({
          dependentTaskId: laterTask.id,
          dependsOnTaskId: earlierTask.id,
          type: 'temporal',
          reason: `Temporal analysis: Created ${Math.round(timeDiff / 1000)}s apart, urgency factor ${urgencyFactor.toFixed(2)}`,
          parallelizable: true,
          minDelay: Math.min(timeDiff, 60000), // Max 1 minute delay
        });
      }
    }

    return dependencies;
  }

  /**
   * Analyze resource dependencies based on resource constraints
   */
  private async analyzeResourceDependencies(
    tasks: Map<TaskId, Task>,
  ): Promise<TaskDependency[]> {
    const dependencies: TaskDependency[] = [];
    const taskArray = Array.from(tasks.values());

    for (let i = 0; i < taskArray.length; i++) {
      for (let j = 0; j < taskArray.length; j++) {
        if (i === j) continue;

        const task1 = taskArray[i];
        const task2 = taskArray[j];

        const resourceConflicts = this.findResourceConflicts(task1, task2);

        if (resourceConflicts.length > 0) {
          // Determine which task should execute first based on priority
          const task1Priority = this.getPriorityScore(task1.priority);
          const task2Priority = this.getPriorityScore(task2.priority);

          let dependentTask: Task;
          let dependsOnTask: Task;

          if (task1Priority >= task2Priority) {
            dependentTask = task2;
            dependsOnTask = task1;
          } else {
            dependentTask = task1;
            dependsOnTask = task2;
          }

          dependencies.push({
            dependentTaskId: dependentTask.id,
            dependsOnTaskId: dependsOnTask.id,
            type: 'resource',
            reason: `Resource conflict: ${resourceConflicts.join(', ')}`,
            parallelizable: false,
          });
        }
      }
    }

    return dependencies;
  }

  /**
   * Analyze pattern-based dependencies using learned patterns
   */
  private async analyzePatternDependencies(
    tasks: Map<TaskId, Task>,
  ): Promise<TaskDependency[]> {
    const dependencies: TaskDependency[] = [];
    const taskArray = Array.from(tasks.values());

    for (const [patternId, pattern] of this.dependencyPatterns) {
      for (let i = 0; i < taskArray.length; i++) {
        for (let j = 0; j < taskArray.length; j++) {
          if (i === j) continue;

          const task1 = taskArray[i];
          const task2 = taskArray[j];

          const matchConfidence = pattern.matcher(task1, task2);

          if (matchConfidence > 0.7) {
            dependencies.push({
              dependentTaskId: task2.id,
              dependsOnTaskId: task1.id,
              type: 'hard', // Default to hard for pattern-based
              reason: `Pattern match: ${pattern.description} (confidence: ${matchConfidence.toFixed(2)})`,
              parallelizable: matchConfidence < 0.9,
            });
          }
        }
      }
    }

    return dependencies;
  }

  /**
   * Calculate semantic similarity between two tasks
   */
  private calculateSemanticSimilarity(task1: Task, task2: Task): number {
    const text1 = `${task1.title} ${task1.description}`.toLowerCase();
    const text2 = `${task2.title} ${task2.description}`.toLowerCase();

    // Simple word overlap similarity
    const words1 = new Set(text1.split(/\s+/).filter((w) => w.length > 2));
    const words2 = new Set(text2.split(/\s+/).filter((w) => w.length > 2));

    const intersection = new Set([...words1].filter((x) => words2.has(x)));
    const union = new Set([...words1, ...words2]);

    return union.size > 0 ? intersection.size / union.size : 0;
  }

  /**
   * Calculate dependency strength between two tasks
   */
  private calculateDependencyStrength(task1: Task, task2: Task): number {
    let strength = 0;

    // Category relationship
    const categoryStrength = this.getCategoryRelationshipStrength(
      task1.category,
      task2.category,
    );
    strength += categoryStrength * 0.4;

    // Priority relationship (higher priority tasks often come before lower priority)
    const priority1 = this.getPriorityScore(task1.priority);
    const priority2 = this.getPriorityScore(task2.priority);
    if (priority1 > priority2) {
      strength += 0.3;
    }

    // Description keywords that suggest dependency
    const dependencyKeywords = [
      'after',
      'before',
      'requires',
      'depends',
      'needs',
      'following',
      'once',
    ];
    const text2 = task2.description.toLowerCase();

    for (const keyword of dependencyKeywords) {
      if (text2.includes(keyword)) {
        strength += 0.2;
        break;
      }
    }

    // Estimation relationship (complex tasks often depend on simpler ones)
    const duration1 = task1.metadata.estimatedDuration || 0;
    const duration2 = task2.metadata.estimatedDuration || 0;
    if (duration1 < duration2) {
      strength += 0.1;
    }

    return Math.min(strength, 1);
  }

  /**
   * Infer the type of dependency based on task characteristics
   */
  private inferDependencyType(task1: Task, task2: Task): DependencyType {
    const resourceConflicts = this.findResourceConflicts(task1, task2);
    if (resourceConflicts.length > 0) {
      return 'resource';
    }

    const timeDiff = Math.abs(
      task2.metadata.createdAt.getTime() - task1.metadata.createdAt.getTime(),
    );
    if (timeDiff < 5 * 60 * 1000) {
      // Within 5 minutes
      return 'temporal';
    }

    // Check for hard keywords in descriptions
    const hardKeywords = ['requires', 'must', 'blocks', 'prerequisite'];
    const text2 = task2.description.toLowerCase();

    for (const keyword of hardKeywords) {
      if (text2.includes(keyword)) {
        return 'hard';
      }
    }

    return 'soft';
  }

  /**
   * Merge dependency suggestions and remove duplicates
   */
  private mergeDependencySuggestions(
    suggestions: TaskDependency[],
  ): TaskDependency[] {
    const dependencyMap = new Map<string, TaskDependency>();

    for (const dependency of suggestions) {
      const key = this.getDependencyKey(dependency);
      const existing = dependencyMap.get(key);

      if (!existing) {
        dependencyMap.set(key, dependency);
      } else {
        // Merge information from multiple sources
        const mergedReason = `${existing.reason}; ${dependency.reason}`;
        const mergedDependency: TaskDependency = {
          ...existing,
          reason: mergedReason,
          // Use the most restrictive settings
          parallelizable: existing.parallelizable && dependency.parallelizable,
          minDelay: Math.max(existing.minDelay || 0, dependency.minDelay || 0),
        };
        dependencyMap.set(key, mergedDependency);
      }
    }

    return Array.from(dependencyMap.values());
  }

  /**
   * Calculate confidence scores for dependency suggestions
   */
  private calculateConfidenceScores(
    dependencies: TaskDependency[],
    tasks: Map<TaskId, Task>,
  ): Map<string, number> {
    const scores = new Map<string, number>();

    for (const dependency of dependencies) {
      const key = this.getDependencyKey(dependency);
      const task1 = tasks.get(dependency.dependsOnTaskId);
      const task2 = tasks.get(dependency.dependentTaskId);

      if (!task1 || !task2) {
        scores.set(key, 0);
        continue;
      }

      let confidence = 0;

      // Base confidence from reason analysis
      const reason = dependency.reason || '';
      if (reason.includes('Semantic')) {
        const semanticMatch = reason.match(/(\d+\.\d+) similarity/);
        if (semanticMatch) {
          confidence +=
            parseFloat(semanticMatch[1]) *
            this.config.detectionWeights.semantic;
        }
      }

      if (reason.includes('Temporal')) {
        confidence += 0.6 * this.config.detectionWeights.temporal;
      }

      if (reason.includes('Resource')) {
        confidence += 0.8 * this.config.detectionWeights.resource;
      }

      if (reason.includes('Pattern')) {
        const patternMatch = reason.match(/confidence: (\d+\.\d+)/);
        if (patternMatch) {
          confidence +=
            parseFloat(patternMatch[1]) * this.config.detectionWeights.pattern;
        }
      }

      // Adjust confidence based on dependency type
      const typeMultipliers = {
        hard: 1.0,
        soft: 0.8,
        resource: 0.9,
        temporal: 0.7,
      };
      confidence *= typeMultipliers[dependency.type] || 0.5;

      scores.set(key, Math.min(confidence, 1));
    }

    return scores;
  }

  /**
   * Analyze conflicts in dependency graph
   */
  private async analyzeConflicts(
    tasks: Map<TaskId, Task>,
    dependencies: TaskDependency[],
  ): Promise<DependencyConflict[]> {
    const conflicts: DependencyConflict[] = [];

    // Circular dependency detection
    const circularConflicts = this.detectCircularConflicts(dependencies);
    conflicts.push(...circularConflicts);

    // Resource conflicts
    const resourceConflicts = this.detectResourceConflicts(tasks, dependencies);
    conflicts.push(...resourceConflicts);

    // Temporal conflicts
    const temporalConflicts = this.detectTemporalConflicts(tasks, dependencies);
    conflicts.push(...temporalConflicts);

    // Logical conflicts
    const logicalConflicts = this.detectLogicalConflicts(tasks, dependencies);
    conflicts.push(...logicalConflicts);

    return conflicts;
  }

  /**
   * Analyze performance impact of dependency configuration
   */
  private async analyzePerformanceImpact(
    tasks: Map<TaskId, Task>,
    dependencies: TaskDependency[],
  ): Promise<PerformanceImpact> {
    const taskArray = Array.from(tasks.values());
    const totalDuration = taskArray.reduce(
      (sum, task) => sum + (task.metadata.estimatedDuration || 60000),
      0,
    );

    // Calculate critical path (simplified)
    const criticalPathLength = this.calculateCriticalPathLength(
      tasks,
      dependencies,
    );

    // Calculate parallelization potential
    const parallelizationPotential = this.calculateParallelizationPotential(
      tasks,
      dependencies,
    );

    // Calculate resource utilization
    const resourceUtilization = this.calculateResourceUtilization(tasks);

    // Identify bottlenecks
    const bottlenecks = this.identifyBottlenecks(tasks, dependencies);

    return {
      criticalPathLength,
      totalExecutionTime: totalDuration,
      parallelizationPotential,
      resourceUtilization,
      bottlenecks,
    };
  }

  /**
   * Generate optimization recommendations
   */
  private async generateOptimizations(
    tasks: Map<TaskId, Task>,
    dependencies: TaskDependency[],
    performanceImpact: PerformanceImpact,
  ): Promise<DependencyOptimization[]> {
    const optimizations: DependencyOptimization[] = [];

    // Parallel execution opportunities
    if (performanceImpact.parallelizationPotential > 0.3) {
      optimizations.push({
        type: 'parallel_execution',
        targetTasks: Array.from(tasks.keys()),
        description: `Parallelize tasks to reduce execution time by ~${Math.round(performanceImpact.parallelizationPotential * 100)}%`,
        expectedBenefit: {
          timeReduction:
            performanceImpact.totalExecutionTime *
            performanceImpact.parallelizationPotential,
          resourceEfficiency: 0.8,
          riskLevel: 'low',
        },
        implementation: [
          'Identify tasks with no dependencies',
          'Group tasks by resource requirements',
          'Execute groups in parallel where possible',
        ],
      });
    }

    // Dependency removal opportunities
    const softDependencies = dependencies.filter((d) => d.type === 'soft');
    if (softDependencies.length > 0) {
      optimizations.push({
        type: 'dependency_removal',
        targetTasks: softDependencies.map((d) => d.dependentTaskId),
        description: `Remove ${softDependencies.length} soft dependencies to increase parallelization`,
        expectedBenefit: {
          timeReduction: softDependencies.length * 30000, // 30s per dependency
          resourceEfficiency: 0.9,
          riskLevel: 'medium',
        },
        implementation: [
          'Review soft dependencies for necessity',
          'Convert to temporal dependencies where appropriate',
          'Remove unnecessary constraints',
        ],
      });
    }

    // Resource allocation optimizations
    if (performanceImpact.resourceUtilization < 0.6) {
      optimizations.push({
        type: 'resource_allocation',
        targetTasks: Array.from(tasks.keys()),
        description: 'Optimize resource allocation to improve utilization',
        expectedBenefit: {
          timeReduction: performanceImpact.totalExecutionTime * 0.2,
          resourceEfficiency: 0.95,
          riskLevel: 'low',
        },
        implementation: [
          'Analyze current resource usage patterns',
          'Redistribute resources based on task priorities',
          'Implement dynamic resource allocation',
        ],
      });
    }

    return optimizations;
  }

  /**
   * Initialize default dependency patterns
   */
  private initializePatterns(): void {
    // Implementation -> Testing pattern
    this.dependencyPatterns.set('impl-test', {
      id: 'impl-test',
      description: 'Implementation tasks should complete before testing',
      categories: ['implementation', 'testing'],
      confidence: 0.9,
      occurrences: 0,
      matcher: (task1: Task, task2: Task) => {
        if (
          task1.category === 'implementation' &&
          task2.category === 'testing'
        ) {
          const semanticSim = this.calculateSemanticSimilarity(task1, task2);
          return semanticSim > 0.3 ? 0.8 + semanticSim * 0.2 : 0;
        }
        return 0;
      },
    });

    // Analysis -> Implementation pattern
    this.dependencyPatterns.set('analysis-impl', {
      id: 'analysis-impl',
      description: 'Analysis tasks should complete before implementation',
      categories: ['analysis', 'implementation'],
      confidence: 0.85,
      occurrences: 0,
      matcher: (task1: Task, task2: Task) => {
        if (
          task1.category === 'analysis' &&
          task2.category === 'implementation'
        ) {
          return 0.8;
        }
        return 0;
      },
    });

    // Documentation pattern
    this.dependencyPatterns.set('impl-docs', {
      id: 'impl-docs',
      description: 'Documentation can run parallel or after implementation',
      categories: ['implementation', 'documentation'],
      confidence: 0.7,
      occurrences: 0,
      matcher: (task1: Task, task2: Task) => {
        if (
          task1.category === 'implementation' &&
          task2.category === 'documentation'
        ) {
          return 0.6; // Soft dependency
        }
        return 0;
      },
    });
  }

  // Helper methods
  private generateCacheKey(
    tasks: Map<TaskId, Task>,
    dependencies: TaskDependency[],
  ): string {
    const taskIds = Array.from(tasks.keys()).sort().join(',');
    const depIds = dependencies
      .map((d) => `${d.dependentTaskId}->${d.dependsOnTaskId}`)
      .sort()
      .join(',');
    return `${taskIds}|${depIds}`;
  }

  private getDependencyKey(dependency: TaskDependency): string {
    return `${dependency.dependentTaskId}->${dependency.dependsOnTaskId}`;
  }

  private cacheResult(key: string, result: DependencyAnalysisResult): void {
    if (this.analysisCache.size >= this.config.cacheSize) {
      const firstKey = this.analysisCache.keys().next().value;
      this.analysisCache.delete(firstKey);
    }
    this.analysisCache.set(key, result);
  }

  private calculateUrgencyFactor(task1: Task, task2: Task): number {
    const priority1 = this.getPriorityScore(task1.priority);
    const priority2 = this.getPriorityScore(task2.priority);
    return (priority1 + priority2) / 8; // Normalize to 0-1
  }

  private areRelatedCategories(
    cat1: TaskCategory,
    cat2: TaskCategory,
  ): boolean {
    const related = {
      implementation: ['testing', 'documentation'],
      analysis: ['implementation', 'documentation'],
      testing: ['implementation'],
      documentation: ['implementation', 'testing'],
      refactoring: ['testing'],
      deployment: ['implementation', 'testing'],
    };
    return (
      related[cat1]?.includes(cat2) || related[cat2]?.includes(cat1) || false
    );
  }

  private findResourceConflicts(task1: Task, task2: Task): string[] {
    const conflicts: string[] = [];

    const resources1 = task1.executionContext?.resourceConstraints || [];
    const resources2 = task2.executionContext?.resourceConstraints || [];

    for (const r1 of resources1) {
      for (const r2 of resources2) {
        if (
          r1.resourceType === r2.resourceType &&
          (r1.exclusive || r2.exclusive)
        ) {
          conflicts.push(r1.resourceType);
        }
      }
    }

    return conflicts;
  }

  private getPriorityScore(priority: TaskPriority): number {
    const scores = { critical: 4, high: 3, medium: 2, low: 1 };
    return scores[priority];
  }

  private getCategoryRelationshipStrength(
    cat1: TaskCategory,
    cat2: TaskCategory,
  ): number {
    if (cat1 === cat2) return 0.8;
    if (this.areRelatedCategories(cat1, cat2)) return 0.6;
    return 0.1;
  }

  private detectCircularConflicts(
    dependencies: TaskDependency[],
  ): DependencyConflict[] {
    // Simplified circular dependency detection
    const conflicts: DependencyConflict[] = [];
    const graph = new Map<TaskId, TaskId[]>();

    // Build adjacency list
    for (const dep of dependencies) {
      if (!graph.has(dep.dependsOnTaskId)) {
        graph.set(dep.dependsOnTaskId, []);
      }
      graph.get(dep.dependsOnTaskId)!.push(dep.dependentTaskId);
    }

    // DFS cycle detection (simplified)
    const visited = new Set<TaskId>();
    const recursionStack = new Set<TaskId>();

    const dfs = (node: TaskId, path: TaskId[]): boolean => {
      if (recursionStack.has(node)) {
        const cycleStart = path.indexOf(node);
        const cycle = path.slice(cycleStart);
        conflicts.push({
          type: 'circular',
          involvedTasks: cycle,
          severity: 'critical',
          description: `Circular dependency detected: ${cycle.join(' -> ')}`,
          resolutionStrategies: [
            {
              type: 'remove_dependency',
              description: 'Remove the weakest dependency in the cycle',
              effort: 'medium',
              impactOnPerformance: 0.3,
            },
          ],
        });
        return true;
      }

      if (visited.has(node)) return false;

      visited.add(node);
      recursionStack.add(node);

      const neighbors = graph.get(node) || [];
      for (const neighbor of neighbors) {
        if (dfs(neighbor, [...path, neighbor])) return true;
      }

      recursionStack.delete(node);
      return false;
    };

    for (const [node] of graph) {
      if (!visited.has(node)) {
        dfs(node, [node]);
      }
    }

    return conflicts;
  }

  private detectResourceConflicts(
    tasks: Map<TaskId, Task>,
    dependencies: TaskDependency[],
  ): DependencyConflict[] {
    // Simplified resource conflict detection
    return [];
  }

  private detectTemporalConflicts(
    tasks: Map<TaskId, Task>,
    dependencies: TaskDependency[],
  ): DependencyConflict[] {
    // Simplified temporal conflict detection
    return [];
  }

  private detectLogicalConflicts(
    tasks: Map<TaskId, Task>,
    dependencies: TaskDependency[],
  ): DependencyConflict[] {
    // Simplified logical conflict detection
    return [];
  }

  private calculateCriticalPathLength(
    tasks: Map<TaskId, Task>,
    dependencies: TaskDependency[],
  ): number {
    // Simplified critical path calculation
    return Array.from(tasks.values()).length;
  }

  private calculateParallelizationPotential(
    tasks: Map<TaskId, Task>,
    dependencies: TaskDependency[],
  ): number {
    const totalTasks = tasks.size;
    const dependentTasks = new Set(dependencies.map((d) => d.dependentTaskId))
      .size;
    return totalTasks > 0 ? (totalTasks - dependentTasks) / totalTasks : 0;
  }

  private calculateResourceUtilization(tasks: Map<TaskId, Task>): number {
    // Simplified resource utilization calculation
    return 0.7; // Mock value
  }

  private identifyBottlenecks(
    tasks: Map<TaskId, Task>,
    dependencies: TaskDependency[],
  ): Array<{
    taskId: TaskId;
    type: 'dependency' | 'resource' | 'duration';
    impact: number;
  }> {
    // Simplified bottleneck identification
    return [];
  }

  private updateLearningPatterns(
    tasks: Map<TaskId, Task>,
    result: DependencyAnalysisResult,
  ): void {
    // Update learning patterns based on analysis results
    for (const dependency of result.suggestedDependencies) {
      const task1 = tasks.get(dependency.dependsOnTaskId);
      const task2 = tasks.get(dependency.dependentTaskId);

      if (task1 && task2) {
        const patternId = `${task1.category}-${task2.category}`;

        if (!this.learningHistory.has(patternId)) {
          this.learningHistory.set(patternId, []);
        }

        const confidence =
          result.confidenceScores.get(this.getDependencyKey(dependency)) || 0;
        this.learningHistory.get(patternId)!.push({
          pattern: patternId,
          confidence,
          timestamp: Date.now(),
        });
      }
    }
  }
}

/**
 * Zod schemas for validation
 */
export const DependencyAnalysisConfigSchema = z.object({
  enableAutoLearning: z.boolean(),
  detectionWeights: z.object({
    semantic: z.number().min(0).max(1),
    temporal: z.number().min(0).max(1),
    resource: z.number().min(0).max(1),
    pattern: z.number().min(0).max(1),
  }),
  autoCreateThreshold: z.number().min(0).max(1),
  maxAnalysisDepth: z.number().min(1).max(50),
  cacheSize: z.number().min(1).max(10000),
});

export const DependencyAnalysisResultSchema = z.object({
  suggestedDependencies: z.array(z.any()), // TaskDependency schema would be imported
  confidenceScores: z.map(z.string(), z.number()),
  conflicts: z.array(z.any()),
  performanceImpact: z.object({
    criticalPathLength: z.number(),
    totalExecutionTime: z.number(),
    parallelizationPotential: z.number().min(0).max(1),
    resourceUtilization: z.number().min(0).max(1),
    bottlenecks: z.array(z.any()),
  }),
  optimizations: z.array(z.any()),
});
