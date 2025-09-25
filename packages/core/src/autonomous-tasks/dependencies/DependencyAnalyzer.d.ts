/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Task } from '../types/TaskTypes';
/**
 * Dependency analysis configuration
 */
export interface DependencyAnalysisConfig {
    /** Enable implicit dependency detection */
    enableImplicitDetection: boolean;
    /** Maximum dependency chain length */
    maxChainLength: number;
    /** Weight factors for different dependency types */
    weights: {
        explicit: number;
        implicit: number;
        resource: number;
        temporal: number;
    };
    /** Analysis sensitivity levels */
    sensitivity: {
        keyword: number;
        semantic: number;
        structural: number;
    };
}
/**
 * Detected dependency information
 */
export interface DetectedDependency {
    /** Source task ID */
    from: string;
    /** Target task ID */
    to: string;
    /** Type of dependency */
    type: 'explicit' | 'implicit' | 'resource' | 'temporal' | 'priority';
    /** Confidence score (0-1) */
    confidence: number;
    /** Reason for the dependency */
    reason: string;
    /** Whether this dependency is blocking */
    blocking: boolean;
    /** Estimated delay if dependency not met (in hours) */
    estimatedDelay: number;
}
/**
 * Dependency analysis results
 */
export interface DependencyAnalysisResult {
    /** All detected dependencies */
    dependencies: DetectedDependency[];
    /** Tasks with no dependencies */
    independentTasks: string[];
    /** Tasks that are dependencies for others */
    criticalTasks: string[];
    /** Potential circular dependencies */
    potentialCircular: string[][];
    /** Analysis metadata */
    metadata: {
        analysisTime: number;
        totalTasks: number;
        totalDependencies: number;
        confidence: number;
    };
}
/**
 * Intelligent task dependency analyzer
 * Detects both explicit and implicit dependencies between tasks
 */
export declare class DependencyAnalyzer {
    private config;
    private keywordPatterns;
    private resourcePatterns;
    constructor(config?: Partial<DependencyAnalysisConfig>);
    /**
     * Analyze tasks for dependencies
     */
    analyzeDependencies(tasks: Task[]): Promise<DependencyAnalysisResult>;
    const dependencies: DetectedDependency[];
    const explicitDeps: any;
    dependencies: DetectedDependency[];
    push(...explicitDeps: any[]): any;
    if(this: any, config: any, enableImplicitDetection: any): void;
    const resourceDeps: any;
    dependencies: DetectedDependency[];
    push(...resourceDeps: any[]): any;
    const temporalDeps: any;
    dependencies: DetectedDependency[];
    push(...temporalDeps: any[]): any;
    const priorityDeps: any;
    dependencies: DetectedDependency[];
    push(...priorityDeps: any[]): any;
    const uniqueDependencies: any;
    const validatedDependencies: any;
    const taskIds: Set<unknown>;
    t: any;
    id: any;
    const dependentTaskIds: Set<unknown>;
    d: any;
    to: any;
    const dependencyTaskIds: Set<unknown>;
    d: any;
}
