/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Task } from '../types/TaskTypes';
import type { DetectedDependency } from './DependencyAnalyzer';
/**
 * Graph node representing a task in the dependency graph
 */
export interface GraphNode {
    /** Task ID */
    id: string;
    /** Associated task */
    task: Task;
    /** Incoming edges (dependencies) */
    inEdges: GraphEdge[];
    /** Outgoing edges (dependents) */
    outEdges: GraphEdge[];
    /** Node level in the graph (0 = no dependencies) */
    level: number;
    /** Critical path indicator */
    onCriticalPath: boolean;
    /** Earliest start time */
    earliestStart: number;
    /** Latest start time */
    latestStart: number;
    /** Float/slack time */
    float: number;
}
/**
 * Graph edge representing a dependency relationship
 */
export interface GraphEdge {
    /** Source node ID */
    from: string;
    /** Target node ID */
    to: string;
    /** Dependency information */
    dependency: DetectedDependency;
    /** Edge weight for optimization */
    weight: number;
    /** Critical path indicator */
    onCriticalPath: boolean;
}
/**
 * Circular dependency cycle information
 */
export interface DependencyCycle {
    /** Nodes involved in the cycle */
    nodes: string[];
    /** Total cycle weight */
    weight: number;
    /** Cycle breaking recommendations */
    breakingOptions: CycleBreakingOption[];
}
/**
 * Options for breaking dependency cycles
 */
export interface CycleBreakingOption {
    /** Edge to remove to break the cycle */
    edgeToRemove: GraphEdge;
    /** Impact score of removing this edge */
    impactScore: number;
    /** Reason for this breaking option */
    reason: string;
    /** Alternative approaches */
    alternatives: string[];
}
/**
 * Graph validation results
 */
export interface GraphValidationResult {
    /** Whether the graph is valid */
    isValid: boolean;
    /** Detected issues */
    issues: GraphIssue[];
    /** Performance metrics */
    metrics: GraphMetrics;
    /** Validation recommendations */
    recommendations: string[];
}
/**
 * Graph validation issue
 */
export interface GraphIssue {
    /** Issue type */
    type: 'circular_dependency' | 'orphaned_node' | 'excessive_fan_out' | 'long_path' | 'resource_conflict';
    /** Severity level */
    severity: 'low' | 'medium' | 'high' | 'critical';
    /** Issue description */
    description: string;
    /** Affected nodes */
    affectedNodes: string[];
    /** Suggested fixes */
    suggestedFixes: string[];
}
/**
 * Graph performance metrics
 */
export interface GraphMetrics {
    /** Total number of nodes */
    nodeCount: number;
    /** Total number of edges */
    edgeCount: number;
    /** Average fan-out per node */
    averageFanOut: number;
    /** Maximum path length */
    maxPathLength: number;
    /** Graph density */
    density: number;
    /** Critical path length */
    criticalPathLength: number;
    /** Number of strongly connected components */
    stronglyConnectedComponents: number;
}
/**
 * Dependency graph for task management
 * Provides graph construction, validation, and analysis capabilities
 */
export declare class DependencyGraph {
    private nodes;
}
