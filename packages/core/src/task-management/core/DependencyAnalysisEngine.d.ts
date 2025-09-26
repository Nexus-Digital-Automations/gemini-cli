/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { DependencyGraph, DependencyNodeId, CircularDependency, DependencyAnalysisResult, CriticalPath, ParallelGroup, GraphValidationStatus } from '../types/Dependency';
/**
 * Advanced dependency analysis engine with intelligent graph processing
 */
export declare class DependencyAnalysisEngine {
    private readonly cache;
    private readonly analysisHistory;
    constructor();
    /**
     * Validates dependency graph for structural integrity and logical consistency
     */
    validateGraph(graph: DependencyGraph): Promise<GraphValidationStatus>;
    /**
     * Detects circular dependencies using Tarjan's strongly connected components algorithm
     */
    detectCircularDependencies(graph: DependencyGraph): Promise<CircularDependency[]>;
    /**
     * Performs topological sorting to determine optimal execution order
     */
    topologicalSort(graph: DependencyGraph): Promise<DependencyNodeId[]>;
    /**
     * Identifies parallel execution opportunities
     */
    identifyParallelGroups(graph: DependencyGraph): Promise<ParallelGroup[]>;
    /**
     * Calculates critical path using Forward and Backward Pass algorithms
     */
    calculateCriticalPath(graph: DependencyGraph): Promise<CriticalPath>;
    /**
     * Performs comprehensive dependency analysis
     */
    analyzeGraph(graph: DependencyGraph): Promise<DependencyAnalysisResult>;
    /**
     * Identifies optimization opportunities in the dependency graph
     */
    private identifyOptimizations;
    /**
     * Generates resource allocation plan
     */
    private generateResourcePlan;
    /**
     * Generates scheduling recommendations
     */
    private generateSchedulingRecommendations;
    /**
     * Helper method to validate node references
     */
    private validateNodeReferences;
    /**
     * Helper method to validate edge references
     */
    private validateEdgeReferences;
    /**
     * Helper method to validate graph structure
     */
    private validateGraphStructure;
    /**
     * Helper method to analyze performance warnings
     */
    private analyzePerformanceWarnings;
    /**
     * Helper method to find cycle edges
     */
    private findCycleEdges;
    /**
     * Helper method to suggest cycle breaking points
     */
    private suggestBreakingPoints;
    /**
     * Helper method to find longest path in graph
     */
    private findLongestPath;
    /**
     * Clears analysis cache
     */
    clearCache(): void;
    /**
     * Gets analysis history for a graph
     */
    getAnalysisHistory(graphId: string): DependencyAnalysisResult[];
}
