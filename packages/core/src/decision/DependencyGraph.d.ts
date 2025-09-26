/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

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
    type: 'remove_edge' | 'add_edge' | 'split_node' | 'merge_nodes' | 'reorder_execution';
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
    getFlexibilityScore(): number;
    /**
     * Perform what-if analysis for dependency changes
     */
    analyzeWhatIf(changes: Array<{
        type: 'add' | 'remove' | 'modify';
        dependency: TaskDependency;
        newConfidence?: number;
    }>): {
        originalMetrics: Record<string, unknown>;
        projectedMetrics: Record<string, unknown>;
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
export declare const DecisionDependencyNodeSchema: any;
export declare const GraphOptimizationSchema: any;
