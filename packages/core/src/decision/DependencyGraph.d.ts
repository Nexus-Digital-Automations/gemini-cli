/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { z } from 'zod';
import type { TaskId, Task, TaskDependency } from '../task-management/types.js';
import type { Decision, DecisionContext } from './types.js';
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
    timeReduction: number;
    resourceSavings: number;
    riskReduction: number;
    flexibilityIncrease: number;
  };
  /** Implementation complexity */
  complexity: 'low' | 'medium' | 'high';
  /** Confidence in the optimization */
  confidence: number;
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
    impact: number;
  }>;
  /** Path flexibility score */
  flexibility: number;
  /** Risk factors */
  risks: string[];
}
/**
 * Advanced dependency graph with intelligent decision-making capabilities
 */
export declare class DecisionDependencyGraph {
  private graph;
  private tasks;
  private optimizationCache;
  private pathCache;
  constructor();
  /**
   * Add task with enhanced decision metadata
   */
  addTask(task: Task, decisionContext?: DecisionContext): void;
  /**
   * Add dependency with confidence scoring
   */
  addDependency(dependency: TaskDependency, confidence?: number): Decision;
  /**
   * Analyze multiple critical paths in the graph
   */
  analyzeAllCriticalPaths(): PathAnalysis[];
  /**
   * Find bottlenecks in the dependency graph
   */
  identifyBottlenecks(): Array<{
    taskId: TaskId;
    type: 'high_degree' | 'critical_path' | 'resource_contention' | 'duration';
    severity: number;
    impact: number;
    suggestions: string[];
  }>;
  /**
   * Generate graph optimizations based on analysis
   */
  generateOptimizations(context?: DecisionContext): GraphOptimization[];
  /**
   * Calculate graph flexibility score
   */
  calculateFlexibilityScore(): number;
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
    originalMetrics: any;
    projectedMetrics: any;
    impact: {
      timeChange: number;
      riskChange: number;
      flexibilityChange: number;
    };
    recommendations: string[];
  };
  /**
   * Export graph in various formats for visualization and analysis
   */
  exportGraph(format: 'dot' | 'json' | 'cytoscape' | 'dagre'): string;
  private calculateImpactScore;
  private determineCriticality;
  private calculateFlexibility;
  private calculateDelayCost;
  private validateDependencyAddition;
  private wouldCreateCycle;
  private updateDependencyConfidence;
  private removeDependency;
  private updateDecisionInsights;
  private calculateRiskAssessment;
  private detectCycles;
  private generateDependencyReasoning;
  private analyzeDependencyImpact;
  private assessDependencyRisk;
  private findAlternativeDependencies;
  private generateDependencyAlternatives;
  private createDefaultContext;
  private findEndNodes;
  private findLongestPathTo;
  private analyzePathPerformance;
  private calculatePathFlexibility;
  private estimateBottleneckImpact;
  private generateOptimizationCacheKey;
  private findWeakDependencies;
  private findMergeCandidates;
  private calculateGraphMetrics;
  private cloneGraph;
  private restoreGraph;
  private generateWhatIfRecommendations;
  private exportToDot;
  private exportToJson;
  private exportToCytoscape;
  private exportToDagre;
  private getNodeColor;
  private getEdgeColor;
  /**
   * Get current graph state
   */
  getGraph(): DecisionDependencyGraph;
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
  };
}
/**
 * Zod schemas for validation
 */
export declare const DecisionDependencyNodeSchema: z.ZodObject<
  {
    taskId: z.ZodString;
    dependencies: z.ZodArray<z.ZodString, 'many'>;
    dependents: z.ZodArray<z.ZodString, 'many'>;
    dependencyRelations: z.ZodArray<z.ZodAny, 'many'>;
    decisionMetadata: z.ZodObject<
      {
        impactScore: z.ZodNumber;
        criticality: z.ZodEnum<['low', 'medium', 'high', 'critical']>;
        flexibility: z.ZodNumber;
        delayCost: z.ZodNumber;
        dependencyConfidence: z.ZodMap<z.ZodString, z.ZodNumber>;
      },
      'strip',
      z.ZodTypeAny,
      {
        impactScore: number;
        criticality: 'low' | 'medium' | 'high' | 'critical';
        flexibility: number;
        delayCost: number;
        dependencyConfidence: Map<string, number>;
      },
      {
        impactScore: number;
        criticality: 'low' | 'medium' | 'high' | 'critical';
        flexibility: number;
        delayCost: number;
        dependencyConfidence: Map<string, number>;
      }
    >;
    traversalMetadata: z.ZodObject<
      {
        visited: z.ZodOptional<z.ZodBoolean>;
        processing: z.ZodOptional<z.ZodBoolean>;
        depth: z.ZodOptional<z.ZodNumber>;
        topologicalOrder: z.ZodOptional<z.ZodNumber>;
        pathCost: z.ZodOptional<z.ZodNumber>;
        heuristic: z.ZodOptional<z.ZodNumber>;
      },
      'strip',
      z.ZodTypeAny,
      {
        visited?: boolean | undefined;
        processing?: boolean | undefined;
        depth?: number | undefined;
        topologicalOrder?: number | undefined;
        pathCost?: number | undefined;
        heuristic?: number | undefined;
      },
      {
        visited?: boolean | undefined;
        processing?: boolean | undefined;
        depth?: number | undefined;
        topologicalOrder?: number | undefined;
        pathCost?: number | undefined;
        heuristic?: number | undefined;
      }
    >;
  },
  'strip',
  z.ZodTypeAny,
  {
    taskId: string;
    dependencies: string[];
    dependents: string[];
    dependencyRelations: any[];
    decisionMetadata: {
      impactScore: number;
      criticality: 'low' | 'medium' | 'high' | 'critical';
      flexibility: number;
      delayCost: number;
      dependencyConfidence: Map<string, number>;
    };
    traversalMetadata: {
      visited?: boolean | undefined;
      processing?: boolean | undefined;
      depth?: number | undefined;
      topologicalOrder?: number | undefined;
      pathCost?: number | undefined;
      heuristic?: number | undefined;
    };
  },
  {
    taskId: string;
    dependencies: string[];
    dependents: string[];
    dependencyRelations: any[];
    decisionMetadata: {
      impactScore: number;
      criticality: 'low' | 'medium' | 'high' | 'critical';
      flexibility: number;
      delayCost: number;
      dependencyConfidence: Map<string, number>;
    };
    traversalMetadata: {
      visited?: boolean | undefined;
      processing?: boolean | undefined;
      depth?: number | undefined;
      topologicalOrder?: number | undefined;
      pathCost?: number | undefined;
      heuristic?: number | undefined;
    };
  }
>;
export declare const GraphOptimizationSchema: z.ZodObject<
  {
    type: z.ZodEnum<
      [
        'remove_edge',
        'add_edge',
        'split_node',
        'merge_nodes',
        'reorder_execution',
      ]
    >;
    description: z.ZodString;
    targets: z.ZodObject<
      {
        tasks: z.ZodOptional<z.ZodArray<z.ZodString, 'many'>>;
        edges: z.ZodOptional<z.ZodArray<z.ZodAny, 'many'>>;
      },
      'strip',
      z.ZodTypeAny,
      {
        tasks?: string[] | undefined;
        edges?: any[] | undefined;
      },
      {
        tasks?: string[] | undefined;
        edges?: any[] | undefined;
      }
    >;
    benefits: z.ZodObject<
      {
        timeReduction: z.ZodNumber;
        resourceSavings: z.ZodNumber;
        riskReduction: z.ZodNumber;
        flexibilityIncrease: z.ZodNumber;
      },
      'strip',
      z.ZodTypeAny,
      {
        timeReduction: number;
        resourceSavings: number;
        riskReduction: number;
        flexibilityIncrease: number;
      },
      {
        timeReduction: number;
        resourceSavings: number;
        riskReduction: number;
        flexibilityIncrease: number;
      }
    >;
    complexity: z.ZodEnum<['low', 'medium', 'high']>;
    confidence: z.ZodNumber;
  },
  'strip',
  z.ZodTypeAny,
  {
    description: string;
    type:
      | 'remove_edge'
      | 'add_edge'
      | 'split_node'
      | 'merge_nodes'
      | 'reorder_execution';
    confidence: number;
    targets: {
      tasks?: string[] | undefined;
      edges?: any[] | undefined;
    };
    complexity: 'low' | 'medium' | 'high';
    benefits: {
      timeReduction: number;
      resourceSavings: number;
      riskReduction: number;
      flexibilityIncrease: number;
    };
  },
  {
    description: string;
    type:
      | 'remove_edge'
      | 'add_edge'
      | 'split_node'
      | 'merge_nodes'
      | 'reorder_execution';
    confidence: number;
    targets: {
      tasks?: string[] | undefined;
      edges?: any[] | undefined;
    };
    complexity: 'low' | 'medium' | 'high';
    benefits: {
      timeReduction: number;
      resourceSavings: number;
      riskReduction: number;
      flexibilityIncrease: number;
    };
  }
>;
