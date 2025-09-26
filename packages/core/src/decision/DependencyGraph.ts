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
  CircularDependency,
} from '../task-management/types.js';
import type {
  Decision,
  DecisionContext,
  DecisionType,
  DecisionPriority,
} from './types.js';
import { getComponentLogger } from '../utils/logger.js';

const logger = getComponentLogger('DecisionDependencyGraph');

/**
 * Advanced dependency node with decision-making capabilities
 */
export interface DecisionDependencyNode {
  /** Task identifier */
  taskId: TaskId;
  /** Direct dependencies */
  dependencies: TaskId[];
  /** Direct dependents */
  dependents: TaskId[];
  /** Dependency relationships with metadata */
  dependencyRelations: TaskDependency[];
  /** Decision-making metadata */
  decisionMetadata: {
    /** Impact score for decision making */
    impactScore: number;
    /** Criticality level */
    criticality: 'low' | 'medium' | 'high' | 'critical';
    /** Flexibility score (how easily dependencies can be modified) */
    flexibility: number;
    /** Cost of delaying this task */
    delayCost: number;
    /** Confidence in dependency relationships */
    dependencyConfidence: Map<TaskId, number>;
  };
  /** Graph traversal metadata */
  traversalMetadata: {
    visited?: boolean;
    processing?: boolean;
    depth?: number;
    topologicalOrder?: number;
    pathCost?: number;
    heuristic?: number;
  };
}

/**
 * Enhanced dependency graph for decision-making
 */
export interface DecisionDependencyGraph {
  /** Map of task ID to enhanced dependency node */
  nodes: Map<TaskId, DecisionDependencyNode>;
  /** All dependency relationships */
  edges: TaskDependency[];
  /** Graph metadata with decision insights */
  metadata: {
    nodeCount: number;
    edgeCount: number;
    hasCycles: boolean;
    maxDepth: number;
    createdAt: Date;
    updatedAt: Date;
    /** Decision-specific metadata */
    decisionInsights: {
      criticalPaths: TaskId[][];
      bottlenecks: TaskId[];
      flexibilityMap: Map<TaskId, number>;
      riskAssessment: {
        overallRisk: number;
        riskFactors: string[];
        mitigationStrategies: string[];
      };
    };
  };
}

/**
 * Graph optimization recommendation
 */
export interface GraphOptimization {
  /** Type of optimization */
  type:
    | 'remove_edge'
    | 'add_edge'
    | 'split_node'
    | 'merge_nodes'
    | 'reorder_execution';
  /** Description of the optimization */
  description: string;
  /** Target elements */
  targets: {
    tasks?: TaskId[];
    edges?: TaskDependency[];
  };
  /** Expected benefits */
  benefits: {
    timeReduction: number; // milliseconds
    resourceSavings: number; // percentage
    riskReduction: number; // 0-1 scale
    flexibilityIncrease: number; // 0-1 scale
  };
  /** Implementation complexity */
  complexity: 'low' | 'medium' | 'high';
  /** Confidence in the optimization */
  confidence: number; // 0-1 scale
}

/**
 * Path analysis result
 */
export interface PathAnalysis {
  /** The analyzed path */
  path: TaskId[];
  /** Total path duration */
  duration: number;
  /** Resource requirements along the path */
  resourceRequirements: Map<string, number>;
  /** Bottlenecks in the path */
  bottlenecks: Array<{
    taskId: TaskId;
    type: 'duration' | 'resource' | 'dependency';
    impact: number; // potential time savings in ms
  }>;
  /** Path flexibility score */
  flexibility: number;
  /** Risk factors */
  risks: string[];
}

/**
 * Advanced dependency graph with intelligent decision-making capabilities
 */
export class DecisionDependencyGraph {
  private graph: DecisionDependencyGraphData;
  private tasks: Map<TaskId, Task>;
  private optimizationCache: Map<string, GraphOptimization[]>;
  private pathCache: Map<string, PathAnalysis>;

  constructor() {
    this.graph = {
      nodes: new Map(),
      edges: [],
      metadata: {
        nodeCount: 0,
        edgeCount: 0,
        hasCycles: false,
        maxDepth: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        decisionInsights: {
          criticalPaths: [],
          bottlenecks: [],
          flexibilityMap: new Map(),
          riskAssessment: {
            overallRisk: 0,
            riskFactors: [],
            mitigationStrategies: [],
          },
        },
      },
    };
    this.tasks = new Map();
    this.optimizationCache = new Map();
    this.pathCache = new Map();
  }

  /**
   * Add task with enhanced decision metadata
   */
  addTask(task: Task, decisionContext?: DecisionContext): void {
    logger.debug('Adding task with decision metadata', {
      taskId: task.id,
      title: task.title,
    });

    this.tasks.set(task.id, task);

    if (!this.graph.nodes.has(task.id)) {
      const impactScore = this.calculateImpactScore(task, decisionContext);
      const criticality = this.determineCriticality(task, impactScore);
      const flexibility = this.calculateFlexibility(task);
      const delayCost = this.calculateDelayCost(task, decisionContext);

      const node: DecisionDependencyNode = {
        taskId: task.id,
        dependencies: [],
        dependents: [],
        dependencyRelations: [],
        decisionMetadata: {
          impactScore,
          criticality,
          flexibility,
          delayCost,
          dependencyConfidence: new Map(),
        },
        traversalMetadata: {},
      };

      this.graph.nodes.set(task.id, node);
      this.graph.metadata.nodeCount++;
      this.graph.metadata.updatedAt = new Date();

      // Update decision insights
      this.updateDecisionInsights();
    }
  }

  /**
   * Add dependency with confidence scoring
   */
  addDependency(
    dependency: TaskDependency,
    confidence: number = 1.0,
  ): Decision {
    logger.debug('Adding dependency with confidence', {
      dependent: dependency.dependentTaskId,
      dependsOn: dependency.dependsOnTaskId,
      type: dependency.type,
      confidence,
    });

    // Validate dependency addition
    const validationResult = this.validateDependencyAddition(dependency);
    if (!validationResult.valid) {
      throw new Error(`Invalid dependency: ${validationResult.reason}`);
    }

    // Check if dependency already exists
    const existingDependency = this.graph.edges.find(
      (edge) =>
        edge.dependentTaskId === dependency.dependentTaskId &&
        edge.dependsOnTaskId === dependency.dependsOnTaskId,
    );

    if (existingDependency) {
      logger.warn('Dependency already exists, updating confidence', {
        dependency,
        confidence,
      });
      return this.updateDependencyConfidence(dependency, confidence);
    }

    // Add to edges
    this.graph.edges.push(dependency);
    this.graph.metadata.edgeCount++;

    // Update node relationships
    const dependentNode = this.graph.nodes.get(dependency.dependentTaskId)!;
    const dependencyNode = this.graph.nodes.get(dependency.dependsOnTaskId)!;

    dependentNode.dependencies.push(dependency.dependsOnTaskId);
    dependentNode.dependencyRelations.push(dependency);
    dependentNode.decisionMetadata.dependencyConfidence.set(
      dependency.dependsOnTaskId,
      confidence,
    );

    dependencyNode.dependents.push(dependency.dependentTaskId);

    this.graph.metadata.updatedAt = new Date();

    // Update decision insights
    this.updateDecisionInsights();

    // Create decision record
    const decision: Decision = {
      id: `dep_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      type: DecisionType.TASK_PRIORITIZATION,
      choice: `Add ${dependency.type} dependency: ${dependency.dependsOnTaskId} -> ${dependency.dependentTaskId}`,
      priority: DecisionPriority.NORMAL,
      confidence,
      reasoning: this.generateDependencyReasoning(dependency, confidence),
      evidence: {
        impactAnalysis: this.analyzeDependencyImpact(dependency),
        riskAssessment: this.assessDependencyRisk(dependency),
        alternativeOptions: this.findAlternativeDependencies(dependency),
      },
      expectedOutcome: {
        successProbability: confidence,
        estimatedDuration: 0, // Instantaneous
        requiredResources: [],
      },
      context: this.createDefaultContext(),
      requiresApproval: confidence < 0.7 || dependency.type === 'hard',
      alternatives: this.generateDependencyAlternatives(dependency),
    };

    return decision;
  }

  /**
   * Analyze multiple critical paths in the graph
   */
  analyzeAllCriticalPaths(): PathAnalysis[] {
    logger.debug('Analyzing all critical paths');

    const paths: PathAnalysis[] = [];
    const endNodes = this.findEndNodes(); // Nodes with no dependents

    for (const endNode of endNodes) {
      const criticalPath = this.findLongestPathTo(endNode);
      if (criticalPath.length > 0) {
        const analysis = this.analyzePathPerformance(criticalPath);
        paths.push(analysis);
      }
    }

    // Sort by duration (longest first)
    paths.sort((a, b) => b.duration - a.duration);

    // Update graph metadata
    this.graph.metadata.decisionInsights.criticalPaths = paths.map(
      (p) => p.path,
    );

    return paths;
  }

  /**
   * Find bottlenecks in the dependency graph
   */
  identifyBottlenecks(): Array<{
    taskId: TaskId;
    type: 'high_degree' | 'critical_path' | 'resource_contention' | 'duration';
    severity: number; // 0-1 scale
    impact: number; // potential improvement in ms
    suggestions: string[];
  }> {
    logger.debug('Identifying bottlenecks');

    const bottlenecks: Array<{
      taskId: TaskId;
      type:
        | 'high_degree'
        | 'critical_path'
        | 'resource_contention'
        | 'duration';
      severity: number;
      impact: number;
      suggestions: string[];
    }> = [];

    // High-degree bottlenecks (tasks with many dependencies)
    for (const [taskId, node] of this.graph.nodes) {
      const totalDegree = node.dependencies.length + node.dependents.length;

      if (totalDegree > 5) {
        // Threshold for high degree
        const severity = Math.min(totalDegree / 10, 1);
        const impact = this.estimateBottleneckImpact(taskId, 'high_degree');

        bottlenecks.push({
          taskId,
          type: 'high_degree',
          severity,
          impact,
          suggestions: [
            'Consider splitting this task into smaller subtasks',
            'Review if all dependencies are necessary',
            'Evaluate potential for parallel execution',
          ],
        });
      }
    }

    // Critical path bottlenecks
    const criticalPaths = this.analyzeAllCriticalPaths();
    for (const pathAnalysis of criticalPaths.slice(0, 3)) {
      // Top 3 critical paths
      for (const bottleneck of pathAnalysis.bottlenecks) {
        bottlenecks.push({
          taskId: bottleneck.taskId,
          type: bottleneck.type as any,
          severity: bottleneck.impact > 60000 ? 0.8 : 0.5, // High severity for > 1 minute impact
          impact: bottleneck.impact,
          suggestions: [
            'Optimize task execution time',
            'Consider task parallelization',
            'Review resource allocation',
          ],
        });
      }
    }

    // Duration bottlenecks (very long tasks)
    for (const [taskId, task] of this.tasks) {
      const duration = task.metadata.estimatedDuration || 0;
      if (duration > 4 * 60 * 60 * 1000) {
        // > 4 hours
        const severity = Math.min(duration / (8 * 60 * 60 * 1000), 1); // Max at 8 hours
        bottlenecks.push({
          taskId,
          type: 'duration',
          severity,
          impact: duration * 0.5, // Assume 50% optimization potential
          suggestions: [
            'Break down into smaller tasks',
            'Review if task scope is appropriate',
            'Consider incremental delivery',
          ],
        });
      }
    }

    // Sort by severity
    bottlenecks.sort((a, b) => b.severity - a.severity);

    // Update graph metadata
    this.graph.metadata.decisionInsights.bottlenecks = bottlenecks.map(
      (b) => b.taskId,
    );

    return bottlenecks;
  }

  /**
   * Generate graph optimizations based on analysis
   */
  generateOptimizations(context?: DecisionContext): GraphOptimization[] {
    logger.debug('Generating graph optimizations');

    const cacheKey = this.generateOptimizationCacheKey(context);
    const cached = this.optimizationCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const optimizations: GraphOptimization[] = [];

    // Analyze bottlenecks for optimization opportunities
    const bottlenecks = this.identifyBottlenecks();

    for (const bottleneck of bottlenecks.slice(0, 5)) {
      // Top 5 bottlenecks
      switch (bottleneck.type) {
        case 'high_degree':
          optimizations.push({
            type: 'split_node',
            description: `Split high-degree task ${bottleneck.taskId} to reduce complexity`,
            targets: { tasks: [bottleneck.taskId] },
            benefits: {
              timeReduction: bottleneck.impact * 0.3,
              resourceSavings: 0.2,
              riskReduction: 0.4,
              flexibilityIncrease: 0.5,
            },
            complexity: 'high',
            confidence: 0.7,
          });
          break;

        case 'duration':
          optimizations.push({
            type: 'split_node',
            description: `Break down long-duration task ${bottleneck.taskId}`,
            targets: { tasks: [bottleneck.taskId] },
            benefits: {
              timeReduction: bottleneck.impact * 0.4,
              resourceSavings: 0.1,
              riskReduction: 0.3,
              flexibilityIncrease: 0.6,
            },
            complexity: 'medium',
            confidence: 0.8,
          });
          break;

        case 'critical_path':
          optimizations.push({
            type: 'reorder_execution',
            description: `Optimize execution order around critical task ${bottleneck.taskId}`,
            targets: { tasks: [bottleneck.taskId] },
            benefits: {
              timeReduction: bottleneck.impact * 0.2,
              resourceSavings: 0.15,
              riskReduction: 0.2,
              flexibilityIncrease: 0.3,
            },
            complexity: 'low',
            confidence: 0.6,
          });
          break;
      default:
          // Handle unexpected values
          break;
    }
    }

    // Analyze weak dependencies for removal
    const weakDependencies = this.findWeakDependencies();
    for (const weakDep of weakDependencies.slice(0, 3)) {
      optimizations.push({
        type: 'remove_edge',
        description: `Remove weak dependency: ${weakDep.dependsOnTaskId} -> ${weakDep.dependentTaskId}`,
        targets: { edges: [weakDep] },
        benefits: {
          timeReduction: 30000, // Assume 30s savings
          resourceSavings: 0.05,
          riskReduction: 0.1,
          flexibilityIncrease: 0.4,
        },
        complexity: 'low',
        confidence: 0.5,
      });
    }

    // Look for merge opportunities
    const mergeCandidates = this.findMergeCandidates();
    for (const candidates of mergeCandidates.slice(0, 2)) {
      optimizations.push({
        type: 'merge_nodes',
        description: `Merge related tasks: ${candidates.join(', ')}`,
        targets: { tasks: candidates },
        benefits: {
          timeReduction: 60000, // Assume 1 minute savings from reduced overhead
          resourceSavings: 0.1,
          riskReduction: 0.15,
          flexibilityIncrease: -0.1, // Merging reduces flexibility
        },
        complexity: 'medium',
        confidence: 0.6,
      });
    }

    // Sort by expected benefits
    optimizations.sort((a, b) => {
      const aScore =
        a.benefits.timeReduction + a.benefits.resourceSavings * 10000;
      const bScore =
        b.benefits.timeReduction + b.benefits.resourceSavings * 10000;
      return bScore - aScore;
    });

    // Cache results
    this.optimizationCache.set(cacheKey, optimizations);

    return optimizations;
  }

  /**
   * Calculate graph flexibility score
   */
  getFlexibilityScore(): number {
    if (this.graph.nodes.size === 0) return 1;

    let totalFlexibility = 0;
    let nodeCount = 0;

    for (const [taskId, node] of this.graph.nodes) {
      const flexibility = node.decisionMetadata.flexibility;
      totalFlexibility += flexibility;
      nodeCount++;
    }

    const averageFlexibility = nodeCount > 0 ? totalFlexibility / nodeCount : 0;

    // Adjust for graph structure
    const densityPenalty =
      this.graph.metadata.edgeCount /
      Math.max((this.graph.nodes.size * (this.graph.nodes.size - 1)) / 2, 1);
    const cyclePenalty = this.graph.metadata.hasCycles ? 0.2 : 0;

    const finalScore = Math.max(
      0,
      averageFlexibility - densityPenalty * 0.3 - cyclePenalty,
    );

    // Update metadata
    this.graph.metadata.decisionInsights.flexibilityMap.set(
      'overall',
      finalScore,
    );

    return finalScore;
  }

  /**
   * Perform what-if analysis for dependency changes
   */
  analyzeWhatIf(
    changes: Array<{
      type: 'add' | 'remove' | 'modify';
      dependency: TaskDependency;
      newConfidence?: number;
    }>,
  ): {
    originalMetrics: Record<string, unknown>;
    projectedMetrics: Record<string, unknown>;
    impact: {
      timeChange: number;
      riskChange: number;
      flexibilityChange: number;
    };
    recommendations: string[];
  } {
    logger.debug('Performing what-if analysis', { changes: changes.length });

    // Capture original state
    const originalMetrics = this.calculateGraphMetrics();

    // Create temporary graph with changes
    const tempGraph = this.cloneGraph();

    // Apply changes to temporary graph
    for (const change of changes) {
      switch (change.type) {
        case 'add':
          this.addDependency(change.dependency, change.newConfidence || 1.0);
          break;
        case 'remove':
          this.removeDependency(
            change.dependency.dependentTaskId,
            change.dependency.dependsOnTaskId,
          );
          break;
        case 'modify':
          this.updateDependencyConfidence(
            change.dependency,
            change.newConfidence || 1.0,
          );
          break;
      default:
          // Handle unexpected values
          break;
    

      }

    // Calculate projected metrics
    const projectedMetrics = this.calculateGraphMetrics();

    // Calculate impact
    const impact = {
      timeChange:
        projectedMetrics.totalExecutionTime -
        originalMetrics.totalExecutionTime,
      riskChange: projectedMetrics.overallRisk - originalMetrics.overallRisk,
      flexibilityChange:
        projectedMetrics.flexibility - originalMetrics.flexibility,
    };

    // Generate recommendations
    const recommendations = this.generateWhatIfRecommendations(impact, changes);

    // Restore original graph
    this.restoreGraph(tempGraph);

    return {
      originalMetrics,
      projectedMetrics,
      impact,
      recommendations,
    };
  }

  /**
   * Export graph in various formats for visualization and analysis
   */
  exportGraph(format: 'dot' | 'json' | 'cytoscape' | 'dagre'): string {
    switch (format) {
      case 'dot':
        return this.exportToDot();
      case 'json':
        return this.exportToJson();
      case 'cytoscape':
        return this.exportToCytoscape();
      case 'dagre':
        return this.exportToDagre();
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  // Private helper methods

  private calculateImpactScore(task: Task, context?: DecisionContext): number {
    let score = 0;

    // Base score from priority
    const priorityScores = { critical: 10, high: 7, medium: 4, low: 1 };
    score += priorityScores[task.priority];

    // Category impact
    const categoryScores = {
      implementation: 3,
      analysis: 2,
      testing: 2,
      documentation: 1,
      refactoring: 2,
      deployment: 4,
    };
    score += categoryScores[task.category] || 1;

    // Duration impact (longer tasks have higher impact when delayed)
    const duration = task.metadata.estimatedDuration || 60000;
    score += Math.min(duration / (4 * 60 * 60 * 1000), 3); // Cap at 4 hours = 3 points

    // Context adjustments
    if (context) {
      if (
        context.projectState.buildStatus === 'failed' &&
        task.category === 'implementation'
      ) {
        score += 2;
      }
      if (
        context.budgetContext.remainingTokens &&
        context.budgetContext.remainingTokens < 1000
      ) {
        score += 1; // Higher impact when budget is low
      }
    }

    return Math.min(score, 20); // Cap at 20
  }

  private determineCriticality(
    task: Task,
    impactScore: number,
  ): 'low' | 'medium' | 'high' | 'critical' {
    if (task.priority === 'critical' || impactScore > 15) return 'critical';
    if (task.priority === 'high' || impactScore > 10) return 'high';
    if (impactScore > 5) return 'medium';
    return 'low';
  }

  private calculateFlexibility(task: Task): number {
    let flexibility = 1.0;

    // Reduce flexibility for critical tasks
    if (task.priority === 'critical') flexibility *= 0.5;
    else if (task.priority === 'high') flexibility *= 0.7;

    // Reduce flexibility for certain categories
    if (task.category === 'deployment') flexibility *= 0.6;
    if (task.category === 'analysis') flexibility *= 0.8;

    // Reduce flexibility for tasks with many validation criteria
    if (task.validationCriteria && task.validationCriteria.length > 3) {
      flexibility *= 0.8;
    }

    return Math.max(flexibility, 0.1); // Minimum 10% flexibility
  }

  private calculateDelayCost(task: Task, context?: DecisionContext): number {
    const baseCost = this.calculateImpactScore(task, context) * 1000; // Base cost in arbitrary units

    // Increase cost for time-sensitive tasks
    const age = Date.now() - task.metadata.createdAt.getTime();
    const agePenalty = age > 24 * 60 * 60 * 1000 ? 1.5 : 1; // 50% penalty after 24 hours

    return baseCost * agePenalty;
  }

  private validateDependencyAddition(dependency: TaskDependency): {
    valid: boolean;
    reason?: string;
  } {
    // Check if both tasks exist
    if (!this.graph.nodes.has(dependency.dependentTaskId)) {
      return {
        valid: false,
        reason: `Dependent task ${dependency.dependentTaskId} not found`,
      };
    }
    if (!this.graph.nodes.has(dependency.dependsOnTaskId)) {
      return {
        valid: false,
        reason: `Dependency task ${dependency.dependsOnTaskId} not found`,
      };
    }

    // Check for self-dependency
    if (dependency.dependentTaskId === dependency.dependsOnTaskId) {
      return { valid: false, reason: 'Task cannot depend on itself' };
    }

    // Check if adding this dependency would create a cycle
    if (this.wouldCreateCycle(dependency)) {
      return { valid: false, reason: 'Adding dependency would create a cycle' };
    }

    return { valid: true };
  }

  private wouldCreateCycle(dependency: TaskDependency): boolean {
    // Simple cycle detection: check if there's already a path from dependsOn to dependent
    const visited = new Set<TaskId>();
    const stack: TaskId[] = [dependency.dependsOnTaskId];

    while (stack.length > 0) {
      const current = stack.pop()!;
      if (current === dependency.dependentTaskId) {
        return true; // Found a path back
      }

      if (visited.has(current)) continue;
      visited.add(current);

      const node = this.graph.nodes.get(current);
      if (node) {
        stack.push(...node.dependencies);
      }
    }

    return false;
  }

  private updateDependencyConfidence(
    dependency: TaskDependency,
    confidence: number,
  ): Decision {
    const node = this.graph.nodes.get(dependency.dependentTaskId)!;
    node.decisionMetadata.dependencyConfidence.set(
      dependency.dependsOnTaskId,
      confidence,
    );

    return {
      id: `dep_update_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      type: DecisionType.TASK_PRIORITIZATION,
      choice: `Update dependency confidence: ${dependency.dependsOnTaskId} -> ${dependency.dependentTaskId}`,
      priority: DecisionPriority.LOW,
      confidence,
      reasoning: `Updated confidence level to ${confidence} based on new analysis`,
      evidence: {
        previousConfidence: node.decisionMetadata.dependencyConfidence.get(
          dependency.dependsOnTaskId,
        ),
      },
      expectedOutcome: {
        successProbability: confidence,
        estimatedDuration: 0,
        requiredResources: [],
      },
      context: this.createDefaultContext(),
      requiresApproval: false,
      alternatives: [],
    };
  }

  private removeDependency(
    dependentTaskId: TaskId,
    dependsOnTaskId: TaskId,
  ): void {
    // Remove from edges
    const edgeIndex = this.graph.edges.findIndex(
      (edge) =>
        edge.dependentTaskId === dependentTaskId &&
        edge.dependsOnTaskId === dependsOnTaskId,
    );

    if (edgeIndex !== -1) {
      this.graph.edges.splice(edgeIndex, 1);
      this.graph.metadata.edgeCount--;
    }

    // Update node relationships
    const dependentNode = this.graph.nodes.get(dependentTaskId);
    const dependencyNode = this.graph.nodes.get(dependsOnTaskId);

    if (dependentNode) {
      dependentNode.dependencies = dependentNode.dependencies.filter(
        (id) => id !== dependsOnTaskId,
      );
      dependentNode.dependencyRelations =
        dependentNode.dependencyRelations.filter(
          (rel) => rel.dependsOnTaskId !== dependsOnTaskId,
        );
      dependentNode.decisionMetadata.dependencyConfidence.delete(
        dependsOnTaskId,
      );
    }

    if (dependencyNode) {
      dependencyNode.dependents = dependencyNode.dependents.filter(
        (id) => id !== dependentTaskId,
      );
    }

    this.graph.metadata.updatedAt = new Date();
    this.updateDecisionInsights();
  }

  private updateDecisionInsights(): void {
    // Update risk assessment
    const riskAssessment = this.calculateRiskAssessment();
    this.graph.metadata.decisionInsights.riskAssessment = riskAssessment;

    // Recalculate flexibility map
    for (const [taskId, node] of this.graph.nodes) {
      this.graph.metadata.decisionInsights.flexibilityMap.set(
        taskId,
        node.decisionMetadata.flexibility,
      );
    }

    // Update has cycles flag
    this.graph.metadata.hasCycles = this.detectCycles().length > 0;
  }

  private calculateRiskAssessment(): {
    overallRisk: number;
    riskFactors: string[];
    mitigationStrategies: string[];
  } {
    const riskFactors: string[] = [];
    const mitigationStrategies: string[] = [];
    let riskScore = 0;

    // Check for cycles
    if (this.graph.metadata.hasCycles) {
      riskScore += 0.3;
      riskFactors.push('Circular dependencies detected');
      mitigationStrategies.push(
        'Resolve circular dependencies by removing or restructuring',
      );
    }

    // Check for high-degree nodes
    let highDegreeNodes = 0;
    for (const [taskId, node] of this.graph.nodes) {
      const degree = node.dependencies.length + node.dependents.length;
      if (degree > 5) {
        highDegreeNodes++;
      }
    }

    if (highDegreeNodes > 0) {
      riskScore += Math.min(highDegreeNodes * 0.1, 0.2);
      riskFactors.push(`${highDegreeNodes} tasks with high dependency degree`);
      mitigationStrategies.push(
        'Consider breaking down complex tasks with many dependencies',
      );
    }

    // Check for low-confidence dependencies
    let lowConfidenceDeps = 0;
    for (const [taskId, node] of this.graph.nodes) {
      for (const [depId, confidence] of node.decisionMetadata
        .dependencyConfidence) {
        if (confidence < 0.6) {
          lowConfidenceDeps++;
        }
      }
    }

    if (lowConfidenceDeps > 0) {
      riskScore += Math.min(lowConfidenceDeps * 0.05, 0.15);
      riskFactors.push(`${lowConfidenceDeps} dependencies with low confidence`);
      mitigationStrategies.push(
        'Review and validate low-confidence dependencies',
      );
    }

    return {
      overallRisk: Math.min(riskScore, 1),
      riskFactors,
      mitigationStrategies,
    };
  }

  private detectCycles(): CircularDependency[] {
    // Simplified cycle detection - would use more sophisticated algorithm in practice
    return [];
  }

  private generateDependencyReasoning(
    dependency: TaskDependency,
    confidence: number,
  ): string {
    const dependentTask = this.tasks.get(dependency.dependentTaskId);
    const dependsOnTask = this.tasks.get(dependency.dependsOnTaskId);

    return `Adding ${dependency.type} dependency between "${dependsOnTask?.title || dependency.dependsOnTaskId}" and "${dependentTask?.title || dependency.dependentTaskId}" with ${Math.round(confidence * 100)}% confidence. ${dependency.reason || 'No specific reason provided.'}`;
  }

  private analyzeDependencyImpact(
    dependency: TaskDependency,
  ): Record<string, unknown> {
    const dependentNode = this.graph.nodes.get(dependency.dependentTaskId);
    const dependencyNode = this.graph.nodes.get(dependency.dependsOnTaskId);

    return {
      impactOnDependent: dependentNode?.decisionMetadata.impactScore || 0,
      impactOnDependency: dependencyNode?.decisionMetadata.impactScore || 0,
      flexibilityImpact:
        (dependentNode?.decisionMetadata.flexibility || 1) * -0.1, // Dependencies reduce flexibility
    };
  }

  private assessDependencyRisk(
    dependency: TaskDependency,
  ): Record<string, unknown> {
    return {
      cycleRisk: this.wouldCreateCycle(dependency) ? 1 : 0,
      confidenceRisk:
        1 -
        (this.graph.nodes
          .get(dependency.dependentTaskId)
          ?.decisionMetadata.dependencyConfidence.get(
            dependency.dependsOnTaskId,
          ) || 1),
      typeRisk: dependency.type === 'hard' ? 0.3 : 0.1,
    };
  }

  private findAlternativeDependencies(
    dependency: TaskDependency,
  ): TaskDependency[] {
    // Simplified - would implement more sophisticated alternative finding
    return [];
  }

  private generateDependencyAlternatives(
    dependency: TaskDependency,
  ): Array<{ choice: string; score: number; reasoning: string }> {
    return [
      {
        choice: 'Make dependency soft instead of hard',
        score: 0.7,
        reasoning: 'Reduces rigidity while maintaining relationship',
      },
      {
        choice: 'Add temporal delay instead of strict dependency',
        score: 0.6,
        reasoning: 'Provides time buffer without blocking parallelization',
      },
      {
        choice: 'Skip dependency and rely on resource constraints',
        score: 0.4,
        reasoning: 'Removes dependency but may cause resource conflicts',
      },
    ];
  }

  private createDefaultContext(): DecisionContext {
    return {
      systemLoad: { cpu: 0.5, memory: 0.6, diskIO: 0.3, networkIO: 0.2 },
      taskQueueState: {
        totalTasks: this.tasks.size,
        pendingTasks: this.tasks.size,
        runningTasks: 0,
        failedTasks: 0,
        avgProcessingTime: 60000,
      },
      agentContext: {
        activeAgents: 1,
        maxConcurrentAgents: 4,
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
        estimatedCostForTask: 0.1,
      },
      performanceHistory: {
        avgSuccessRate: 0.8,
        avgCompletionTime: 120000,
        commonFailureReasons: [],
        peakUsageHours: [],
      },
      userPreferences: {
        allowAutonomousDecisions: true,
        maxConcurrentTasks: 4,
        criticalTaskNotification: true,
      },
      timestamp: Date.now(),
    };
  }

  private findEndNodes(): TaskId[] {
    const endNodes: TaskId[] = [];
    for (const [taskId, node] of this.graph.nodes) {
      if (node.dependents.length === 0) {
        endNodes.push(taskId);
      }
    }
    return endNodes;
  }

  private findLongestPathTo(endNode: TaskId): TaskId[] {
    // Simplified longest path calculation
    const path: TaskId[] = [endNode];
    let current = endNode;

    while (true) {
      const node = this.graph.nodes.get(current);
      if (!node || node.dependencies.length === 0) break;

      // Find dependency with longest estimated duration
      let longestDep: TaskId | null = null;
      let longestDuration = 0;

      for (const depId of node.dependencies) {
        const depTask = this.tasks.get(depId);
        const duration = depTask?.metadata.estimatedDuration || 0;
        if (duration > longestDuration) {
          longestDuration = duration;
          longestDep = depId;
        }
      }

      if (longestDep) {
        path.unshift(longestDep);
        current = longestDep;
      } else {
        break;
      }
    }

    return path;
  }

  private analyzePathPerformance(path: TaskId[]): PathAnalysis {
    let totalDuration = 0;
    const resourceRequirements = new Map<string, number>();
    const bottlenecks: Array<{
      taskId: TaskId;
      type: 'duration' | 'resource' | 'dependency';
      impact: number;
    }> = [];
    const risks: string[] = [];

    for (const taskId of path) {
      const task = this.tasks.get(taskId);
      if (!task) continue;

      const duration = task.metadata.estimatedDuration || 60000;
      totalDuration += duration;

      // Check for duration bottlenecks
      if (duration > 2 * 60 * 60 * 1000) {
        // > 2 hours
        bottlenecks.push({
          taskId,
          type: 'duration',
          impact: duration * 0.3, // Assume 30% optimization potential
        });
      }

      // Aggregate resource requirements
      if (task.executionContext?.resourceConstraints) {
        for (const constraint of task.executionContext.resourceConstraints) {
          const current =
            resourceRequirements.get(constraint.resourceType) || 0;
          resourceRequirements.set(
            constraint.resourceType,
            Math.max(current, constraint.maxUnits),
          );
        }
      }

      // Check for risks
      const node = this.graph.nodes.get(taskId);
      if (node?.decisionMetadata.criticality === 'critical') {
        risks.push(`Critical task ${taskId} in path`);
      }
    }

    // Calculate path flexibility
    const flexibility = this.calculatePathFlexibility(path);

    return {
      path,
      duration: totalDuration,
      resourceRequirements,
      bottlenecks,
      flexibility,
      risks,
    };
  }

  private calculatePathFlexibility(path: TaskId[]): number {
    let totalFlexibility = 0;
    for (const taskId of path) {
      const node = this.graph.nodes.get(taskId);
      if (node) {
        totalFlexibility += node.decisionMetadata.flexibility;
      }
    }
    return path.length > 0 ? totalFlexibility / path.length : 0;
  }

  private estimateBottleneckImpact(taskId: TaskId, type: string): number {
    const task = this.tasks.get(taskId);
    if (!task) return 0;

    const baseDuration = task.metadata.estimatedDuration || 60000;

    switch (type) {
      case 'high_degree':
        return baseDuration * 0.2; // 20% potential improvement
      case 'duration':
        return baseDuration * 0.4; // 40% potential improvement for long tasks
      default:
        return baseDuration * 0.1;
    }
  }

  private generateOptimizationCacheKey(context?: DecisionContext): string {
    const contextHash = context
      ? JSON.stringify(context).slice(0, 100)
      : 'no_context';
    const graphHash = `${this.graph.nodes.size}_${this.graph.edges.length}_${this.graph.metadata.updatedAt.getTime()}`;
    return `${contextHash}_${graphHash}`;
  }

  private findWeakDependencies(): TaskDependency[] {
    const weakDeps: TaskDependency[] = [];

    for (const edge of this.graph.edges) {
      const confidence =
        this.graph.nodes
          .get(edge.dependentTaskId)
          ?.decisionMetadata.dependencyConfidence.get(edge.dependsOnTaskId) ||
        1;

      if (confidence < 0.5) {
        weakDeps.push(edge);
      }
    }

    return weakDeps.sort((a, b) => {
      const aConf =
        this.graph.nodes
          .get(a.dependentTaskId)
          ?.decisionMetadata.dependencyConfidence.get(a.dependsOnTaskId) || 1;
      const bConf =
        this.graph.nodes
          .get(b.dependentTaskId)
          ?.decisionMetadata.dependencyConfidence.get(b.dependsOnTaskId) || 1;
      return aConf - bConf; // Weakest first
    });
  }

  private findMergeCandidates(): TaskId[][] {
    const candidates: TaskId[][] = [];

    // Look for tasks with similar characteristics that could be merged
    const tasksByCategory = new Map<string, TaskId[]>();

    for (const [taskId, task] of this.tasks) {
      const category = task.category;
      if (!tasksByCategory.has(category)) {
        tasksByCategory.set(category, []);
      }
      tasksByCategory.get(category)!.push(taskId);
    }

    // Find small tasks in same category that could be merged
    for (const [category, taskIds] of tasksByCategory) {
      if (taskIds.length >= 2) {
        const smallTasks = taskIds.filter((id) => {
          const task = this.tasks.get(id);
          return (
            task && (task.metadata.estimatedDuration || 0) < 30 * 60 * 1000
          ); // < 30 minutes
        });

        if (smallTasks.length >= 2) {
          candidates.push(smallTasks.slice(0, 3)); // Max 3 tasks per merge
        }
      }
    }

    return candidates.slice(0, 5); // Return top 5 merge opportunities
  }

  private calculateGraphMetrics(): any {
    const criticalPaths = this.analyzeAllCriticalPaths();
    const bottlenecks = this.identifyBottlenecks();
    const flexibility = this.calculateFlexibilityScore();

    return {
      totalExecutionTime:
        criticalPaths.length > 0 ? criticalPaths[0].duration : 0,
      overallRisk:
        this.graph.metadata.decisionInsights.riskAssessment.overallRisk,
      flexibility,
      bottleneckCount: bottlenecks.length,
      criticalPathCount: criticalPaths.length,
    };
  }

  private cloneGraph(): DecisionDependencyGraphData {
    // Deep clone the graph for what-if analysis
    return JSON.parse(JSON.stringify(this.graph));
  }

  private restoreGraph(graph: DecisionDependencyGraph): void {
    this.graph = graph;
  }

  private generateWhatIfRecommendations(
    impact: any,
    changes: Array<{ type: string; dependency: TaskDependency }>,
  ): string[] {
    const recommendations: string[] = [];

    if (impact.timeChange < -60000) {
      // More than 1 minute improvement
      recommendations.push(
        'This change significantly improves execution time - strongly recommended',
      );
    } else if (impact.timeChange > 60000) {
      recommendations.push(
        'This change increases execution time - consider alternatives',
      );
    }

    if (impact.riskChange < -0.1) {
      recommendations.push('Risk reduction achieved - good for stability');
    } else if (impact.riskChange > 0.1) {
      recommendations.push(
        'Risk increase detected - additional monitoring recommended',
      );
    }

    if (impact.flexibilityChange > 0.1) {
      recommendations.push(
        'Flexibility improvement - better adaptability to changes',
      );
    } else if (impact.flexibilityChange < -0.1) {
      recommendations.push(
        'Reduced flexibility - consider if constraints are necessary',
      );
    }

    return recommendations;
  }

  private exportToDot(): string {
    const lines = ['digraph DecisionDependencyGraph {'];
    lines.push('  rankdir=TB;');
    lines.push('  node [shape=box, style=filled];');

    // Add nodes with decision metadata
    for (const [taskId, node] of this.graph.nodes) {
      const task = this.tasks.get(taskId);
      const label = task
        ? `${task.title}\\n${node.decisionMetadata.criticality}`
        : taskId;
      const color = this.getNodeColor(node.decisionMetadata.criticality);
      lines.push(`  "${taskId}" [label="${label}", fillcolor="${color}"];`);
    }

    // Add edges with confidence information
    for (const edge of this.graph.edges) {
      const confidence =
        this.graph.nodes
          .get(edge.dependentTaskId)
          ?.decisionMetadata.dependencyConfidence.get(edge.dependsOnTaskId) ||
        1;
      const style = confidence > 0.7 ? 'solid' : 'dashed';
      const color = this.getEdgeColor(edge.type);
      lines.push(
        `  "${edge.dependsOnTaskId}" -> "${edge.dependentTaskId}" [style="${style}", color="${color}", label="${Math.round(confidence * 100)}%"];`,
      );
    }

    lines.push('}');
    return lines.join('\n');
  }

  private exportToJson(): string {
    return JSON.stringify(
      {
        nodes: Array.from(this.graph.nodes.values()),
        edges: this.graph.edges,
        metadata: this.graph.metadata,
        tasks: Object.fromEntries(this.tasks),
      },
      null,
      2,
    );
  }

  private exportToCytoscape(): string {
    const elements: any[] = [];

    // Add nodes
    for (const [taskId, node] of this.graph.nodes) {
      const task = this.tasks.get(taskId);
      elements.push({
        data: {
          id: taskId,
          label: task?.title || taskId,
          criticality: node.decisionMetadata.criticality,
          flexibility: node.decisionMetadata.flexibility,
          impactScore: node.decisionMetadata.impactScore,
        },
      });
    }

    // Add edges
    for (const edge of this.graph.edges) {
      const confidence =
        this.graph.nodes
          .get(edge.dependentTaskId)
          ?.decisionMetadata.dependencyConfidence.get(edge.dependsOnTaskId) ||
        1;
      elements.push({
        data: {
          id: `${edge.dependsOnTaskId}_${edge.dependentTaskId}`,
          source: edge.dependsOnTaskId,
          target: edge.dependentTaskId,
          type: edge.type,
          confidence,
        },
      });
    }

    return JSON.stringify({ elements }, null, 2);
  }

  private exportToDagre(): string {
    // Export in Dagre-compatible format
    const graph = {
      nodes: Array.from(this.graph.nodes.entries()).map(([id, node]) => ({
        id,
        label: this.tasks.get(id)?.title || id,
        width: 150,
        height: 50,
        metadata: node.decisionMetadata,
      })),
      edges: this.graph.edges.map((edge) => ({
        source: edge.dependsOnTaskId,
        target: edge.dependentTaskId,
        label: edge.type,
      })),
    };

    return JSON.stringify(graph, null, 2);
  }

  private getNodeColor(criticality: string): string {
    const colors = {
      low: 'lightblue',
      medium: 'yellow',
      high: 'orange',
      critical: 'red',
    };
    return colors[criticality as keyof typeof colors] || 'white';
  }

  private getEdgeColor(type: DependencyType): string {
    const colors = {
      hard: 'black',
      soft: 'gray',
      resource: 'blue',
      temporal: 'green',
    };
    return colors[type] || 'black';
  }

  /**
   * Get current graph state
   */
  getGraph(): DecisionDependencyGraph {
    return { ...this.graph };
  }

  /**
   * Get comprehensive statistics
   */
  getStatistics(): {
    nodeCount: number;
    edgeCount: number;
    averageConfidence: number;
    flexibilityScore: number;
    riskScore: number;
    bottleneckCount: number;
    criticalPathCount: number;
  } {
    let totalConfidence = 0;
    let confidenceCount = 0;

    for (const [taskId, node] of this.graph.nodes) {
      for (const [depId, confidence] of node.decisionMetadata
        .dependencyConfidence) {
        totalConfidence += confidence;
        confidenceCount++;
      }
    }

    const averageConfidence =
      confidenceCount > 0 ? totalConfidence / confidenceCount : 0;
    const flexibilityScore = this.calculateFlexibilityScore();
    const riskScore =
      this.graph.metadata.decisionInsights.riskAssessment.overallRisk;
    const bottlenecks = this.identifyBottlenecks();
    const criticalPaths = this.analyzeAllCriticalPaths();

    return {
      nodeCount: this.graph.metadata.nodeCount,
      edgeCount: this.graph.metadata.edgeCount,
      averageConfidence,
      flexibilityScore,
      riskScore,
      bottleneckCount: bottlenecks.length,
      criticalPathCount: criticalPaths.length,
    };
  }
}

/**
 * Zod schemas for validation
 */
export const DecisionDependencyNodeSchema = z.object({
  taskId: z.string(),
  dependencies: z.array(z.string()),
  dependents: z.array(z.string()),
  dependencyRelations: z.array(z.any()),
  decisionMetadata: z.object({
    impactScore: z.number(),
    criticality: z.enum(['low', 'medium', 'high', 'critical']),
    flexibility: z.number().min(0).max(1),
    delayCost: z.number(),
    dependencyConfidence: z.map(z.string(), z.number()),
  }),
  traversalMetadata: z.object({
    visited: z.boolean().optional(),
    processing: z.boolean().optional(),
    depth: z.number().optional(),
    topologicalOrder: z.number().optional(),
    pathCost: z.number().optional(),
    heuristic: z.number().optional(),
  }),
});

export const GraphOptimizationSchema = z.object({
  type: z.enum([
    'remove_edge',
    'add_edge',
    'split_node',
    'merge_nodes',
    'reorder_execution',
  ]),
  description: z.string(),
  targets: z.object({
    tasks: z.array(z.string()).optional(),
    edges: z.array(z.any()).optional(),
  }),
  benefits: z.object({
    timeReduction: z.number(),
    resourceSavings: z.number(),
    riskReduction: z.number(),
    flexibilityIncrease: z.number(),
  }),
  complexity: z.enum(['low', 'medium', 'high']),
  confidence: z.number().min(0).max(1),
});
