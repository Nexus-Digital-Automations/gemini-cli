/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { z } from 'zod';
import type { TaskId, Task, TaskDependency } from '../task-management/types.js';
import type { DecisionContext } from './types.js';
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
    impactOnPerformance: number;
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
        impact: number;
    }>;
}
/**
 * Dependency optimization recommendation
 */
export interface DependencyOptimization {
    /** Type of optimization */
    type: 'parallel_execution' | 'dependency_removal' | 'resource_allocation' | 'task_splitting';
    /** Target tasks */
    targetTasks: TaskId[];
    /** Description of the optimization */
    description: string;
    /** Expected benefit */
    expectedBenefit: {
        timeReduction: number;
        resourceEfficiency: number;
        riskLevel: 'low' | 'medium' | 'high';
    };
    /** Implementation steps */
    implementation: string[];
}
/**
 * Advanced dependency analysis system with intelligent learning capabilities
 */
export declare class DependencyAnalyzer {
    private config;
    private dependencyPatterns;
    private analysisCache;
    private learningHistory;
    constructor(config?: Partial<DependencyAnalysisConfig>);
    /**
     * Analyze dependencies for a set of tasks
     */
    analyzeDependencies(tasks: Map<TaskId, Task>, existingDependencies?: TaskDependency[], context?: DecisionContext): Promise<DependencyAnalysisResult>;
    /**
     * Analyze semantic dependencies based on task content and descriptions
     */
    private analyzeSemanticDependencies;
    /**
     * Analyze temporal dependencies based on task timing and urgency
     */
    private analyzeTemporalDependencies;
    /**
     * Analyze resource dependencies based on resource constraints
     */
    private analyzeResourceDependencies;
    /**
     * Analyze pattern-based dependencies using learned patterns
     */
    private analyzePatternDependencies;
    /**
     * Calculate semantic similarity between two tasks
     */
    private calculateSemanticSimilarity;
    /**
     * Calculate dependency strength between two tasks
     */
    private calculateDependencyStrength;
    /**
     * Infer the type of dependency based on task characteristics
     */
    private inferDependencyType;
    /**
     * Merge dependency suggestions and remove duplicates
     */
    private mergeDependencySuggestions;
    /**
     * Calculate confidence scores for dependency suggestions
     */
    private calculateConfidenceScores;
    /**
     * Analyze conflicts in dependency graph
     */
    private analyzeConflicts;
    /**
     * Analyze performance impact of dependency configuration
     */
    private analyzePerformanceImpact;
    /**
     * Generate optimization recommendations
     */
    private generateOptimizations;
    /**
     * Initialize default dependency patterns
     */
    private initializePatterns;
    private generateCacheKey;
    private getDependencyKey;
    private cacheResult;
    private calculateUrgencyFactor;
    private areRelatedCategories;
    private findResourceConflicts;
    private getPriorityScore;
    private getCategoryRelationshipStrength;
    private detectCircularConflicts;
    private detectResourceConflicts;
    private detectTemporalConflicts;
    private detectLogicalConflicts;
    private calculateCriticalPathLength;
    private calculateParallelizationPotential;
    private calculateResourceUtilization;
    private identifyBottlenecks;
    private updateLearningPatterns;
}
/**
 * Zod schemas for validation
 */
export declare const DependencyAnalysisConfigSchema: z.ZodObject<{
    enableAutoLearning: z.ZodBoolean;
    detectionWeights: z.ZodObject<{
        semantic: z.ZodNumber;
        temporal: z.ZodNumber;
        resource: z.ZodNumber;
        pattern: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        resource: number;
        pattern: number;
        temporal: number;
        semantic: number;
    }, {
        resource: number;
        pattern: number;
        temporal: number;
        semantic: number;
    }>;
    autoCreateThreshold: z.ZodNumber;
    maxAnalysisDepth: z.ZodNumber;
    cacheSize: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    maxAnalysisDepth: number;
    cacheSize: number;
    enableAutoLearning: boolean;
    detectionWeights: {
        resource: number;
        pattern: number;
        temporal: number;
        semantic: number;
    };
    autoCreateThreshold: number;
}, {
    maxAnalysisDepth: number;
    cacheSize: number;
    enableAutoLearning: boolean;
    detectionWeights: {
        resource: number;
        pattern: number;
        temporal: number;
        semantic: number;
    };
    autoCreateThreshold: number;
}>;
export declare const DependencyAnalysisResultSchema: z.ZodObject<{
    suggestedDependencies: z.ZodArray<z.ZodAny, "many">;
    confidenceScores: z.ZodMap<z.ZodString, z.ZodNumber>;
    conflicts: z.ZodArray<z.ZodAny, "many">;
    performanceImpact: z.ZodObject<{
        criticalPathLength: z.ZodNumber;
        totalExecutionTime: z.ZodNumber;
        parallelizationPotential: z.ZodNumber;
        resourceUtilization: z.ZodNumber;
        bottlenecks: z.ZodArray<z.ZodAny, "many">;
    }, "strip", z.ZodTypeAny, {
        bottlenecks: any[];
        criticalPathLength: number;
        totalExecutionTime: number;
        parallelizationPotential: number;
        resourceUtilization: number;
    }, {
        bottlenecks: any[];
        criticalPathLength: number;
        totalExecutionTime: number;
        parallelizationPotential: number;
        resourceUtilization: number;
    }>;
    optimizations: z.ZodArray<z.ZodAny, "many">;
}, "strip", z.ZodTypeAny, {
    conflicts: any[];
    optimizations: any[];
    performanceImpact: {
        bottlenecks: any[];
        criticalPathLength: number;
        totalExecutionTime: number;
        parallelizationPotential: number;
        resourceUtilization: number;
    };
    suggestedDependencies: any[];
    confidenceScores: Map<string, number>;
}, {
    conflicts: any[];
    optimizations: any[];
    performanceImpact: {
        bottlenecks: any[];
        criticalPathLength: number;
        totalExecutionTime: number;
        parallelizationPotential: number;
        resourceUtilization: number;
    };
    suggestedDependencies: any[];
    confidenceScores: Map<string, number>;
}>;
