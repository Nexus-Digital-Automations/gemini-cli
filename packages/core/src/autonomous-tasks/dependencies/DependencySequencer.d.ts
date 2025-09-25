/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { EventEmitter } from 'node:events';
import type { ITask, TaskPriority, DependencyGraph, IDependencyManager, DependencyValidation } from '../interfaces/TaskInterfaces.js';
/**
 * Sequencing strategy for task execution
 */
export declare enum SequencingStrategy {
    /** Priority-first sequencing */
    PRIORITY_FIRST = "priority_first",
    /** Dependency-aware critical path */
    CRITICAL_PATH = "critical_path",
    /** Resource-optimized sequencing */
    RESOURCE_OPTIMIZED = "resource_optimized",
    /** Load-balanced parallel execution */
    LOAD_BALANCED = "load_balanced",
    /** User-defined custom sequencing */
    CUSTOM = "custom"
}
/**
 * Parallel execution group with metadata
 */
export interface ParallelExecutionGroup {
    /** Group identifier */
    id: string;
    /** Tasks in this execution group */
    tasks: ITask[];
    /** Estimated execution time for the group */
    estimatedDuration: number;
    /** Resource requirements */
    resourceRequirements: Record<string, number>;
    /** Group priority level */
    priority: TaskPriority;
    /** Dependencies to other groups */
    dependencies: string[];
    /** Confidence in parallel execution safety */
    parallelSafetyConfidence: number;
}
/**
 * Execution sequence with optimization metrics
 */
export interface ExecutionSequence {
    /** Sequential order of execution groups */
    groups: ParallelExecutionGroup[];
    /** Total estimated execution time */
    totalEstimatedTime: number;
    /** Maximum parallel tasks at any point */
    maxConcurrency: number;
    /** Resource utilization efficiency */
    resourceEfficiency: number;
    /** Critical path tasks */
    criticalPath: string[];
    /** Optimization strategy used */
    strategy: SequencingStrategy;
    /** Confidence in sequence optimality */
    confidence: number;
}
/**
 * Conflict resolution result
 */
export interface ConflictResolution {
    /** Whether conflicts were resolved */
    resolved: boolean;
    /** Conflicts that were resolved */
    resolvedConflicts: DependencyConflict[];
    /** Remaining unresolved conflicts */
    unresolvedConflicts: DependencyConflict[];
    /** Resolution actions taken */
    resolutionActions: ConflictResolutionAction[];
    /** Impact of resolution on execution time */
    timeImpact: number;
}
/**
 * Dependency conflict information
 */
export interface DependencyConflict {
    /** Conflict identifier */
    id: string;
    /** Conflict type */
    type: 'circular' | 'resource_contention' | 'priority_inversion' | 'temporal' | 'custom';
    /** Conflicting tasks */
    taskIds: string[];
    /** Conflict severity */
    severity: 'low' | 'medium' | 'high' | 'critical';
    /** Conflict description */
    description: string;
    /** Suggested resolutions */
    suggestedResolutions: string[];
    /** Impact on execution if not resolved */
    impact: ConflictImpact;
}
/**
 * Impact of unresolved conflict
 */
export interface ConflictImpact {
    /** Execution time increase (percentage) */
    timeIncrease: number;
    /** Resource utilization decrease (percentage) */
    resourceUtilizationDecrease: number;
    /** Risk of execution failure */
    failureRisk: number;
    /** Quality degradation risk */
    qualityRisk: number;
}
/**
 * Conflict resolution action
 */
export interface ConflictResolutionAction {
    /** Action type */
    type: 'reorder' | 'split' | 'merge' | 'reschedule' | 'resource_reallocation' | 'priority_adjustment';
    /** Action description */
    description: string;
    /** Affected tasks */
    affectedTasks: string[];
    /** Action confidence */
    confidence: number;
    /** Expected improvement */
    expectedImprovement: number;
}
/**
 * Sequencing configuration
 */
export interface SequencingConfig {
    /** Primary sequencing strategy */
    strategy: SequencingStrategy;
    /** Maximum parallel execution groups */
    maxParallelGroups: number;
    /** Resource optimization weight (0-1) */
    resourceOptimizationWeight: number;
    /** Time optimization weight (0-1) */
    timeOptimizationWeight: number;
    /** Quality optimization weight (0-1) */
    qualityOptimizationWeight: number;
    /** Enable automatic conflict resolution */
    enableAutoConflictResolution: boolean;
    /** Conflict resolution timeout (ms) */
    conflictResolutionTimeout: number;
    /** Minimum confidence threshold for sequence */
    minimumConfidenceThreshold: number;
}
/**
 * Event types for dependency sequencer
 */
export declare enum SequencerEvent {
    SEQUENCE_GENERATED = "sequence_generated",
    CONFLICT_DETECTED = "conflict_detected",
    CONFLICT_RESOLVED = "conflict_resolved",
    OPTIMIZATION_APPLIED = "optimization_applied",
    SEQUENCE_VALIDATED = "sequence_validated"
}
/**
 * Intelligent task dependency sequencer and conflict resolver
 * Builds on DependencyAnalyzer to provide optimal task execution sequences
 */
export declare class DependencySequencer extends EventEmitter implements IDependencyManager {
    private readonly logger;
    private readonly config;
    private readonly dependencyAnalyzer;
    private sequenceCache;
    private conflictResolver;
    constructor(config?: Partial<SequencingConfig>);
    /**
     * Analyze task dependencies and create execution graph
     */
    analyzeDependencies(tasks: ITask[]): Promise<DependencyGraph>;
    /**
     * Resolve optimal task execution order based on dependencies and strategy
     */
    resolveExecutionOrder(tasks: ITask[]): Promise<ITask[]>;
    /**
     * Detect circular dependencies in task graph
     */
    detectCircularDependencies(tasks: ITask[]): Promise<string[][]>;
    /**
     * Validate all task dependencies can be satisfied
     */
    validateDependencies(tasks: ITask[]): Promise<DependencyValidation>;
    /**
     * Get optimal parallel execution groups
     */
    getParallelExecutionGroups(tasks: ITask[]): Promise<ITask[][]>;
    /**
     * Update task dependencies dynamically
     */
    updateTaskDependencies(taskId: string, dependencies: any[]): Promise<void>;
    /**
     * Generate optimized execution sequence
     */
    generateExecutionSequence(tasks: ITask[]): Promise<ExecutionSequence>;
    /**
     * Convert analysis result to dependency graph
     */
    private convertToGraph;
    /**
     * Calculate execution levels for dependency graph
     */
    private calculateLevels;
    /**
     * Calculate critical path through dependency graph
     */
    private calculateCriticalPath;
    /**
     * Generate sequence based on selected strategy
     */
    private generateSequenceByStrategy;
    /**
     * Generate priority-first execution sequence
     */
    private generatePriorityFirstSequence;
    /**
     * Generate critical path optimized sequence
     */
    private generateCriticalPathSequence;
    /**
     * Generate resource-optimized sequence
     */
    private generateResourceOptimizedSequence;
    /**
     * Generate load-balanced sequence
     */
    private generateLoadBalancedSequence;
    /**
     * Build final sequence result
     */
    private buildSequenceResult;
    /**
     * Optimize execution sequence
     */
    private optimizeSequence;
    /**
     * Optimize sequence for execution time
     */
    private optimizeForTime;
    /**
     * Optimize sequence for resource utilization
     */
    private optimizeForResources;
    /**
     * Optimize sequence for quality
     */
    private optimizeForQuality;
    /**
     * Detect conflicts in task execution
     */
    private detectConflicts;
    /**
     * Resolve detected conflicts
     */
    private resolveConflicts;
    private estimateTaskTime;
    private extractTaskResources;
    private calculateGroupResources;
    private canMergeGroups;
    private mergeResourceRequirements;
    private groupTasksByResource;
    private generateSequenceKey;
    private getLogger;
}
