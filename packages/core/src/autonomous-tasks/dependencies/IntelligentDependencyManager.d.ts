/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { EventEmitter } from 'node:events';
import type { ITask, DependencyGraph, IDependencyManager, DependencyValidation } from '../interfaces/TaskInterfaces.js';
import type { DependencyAnalysisConfig } from './DependencyAnalyzer.js';
import type { SequencingConfig } from './DependencySequencer.js';
/**
 * Intelligent dependency management configuration
 */
export interface IntelligentDependencyConfig {
    /** Dependency analysis configuration */
    analysisConfig: Partial<DependencyAnalysisConfig>;
    /** Sequencing configuration */
    sequencingConfig: Partial<SequencingConfig>;
    /** Enable real-time dependency monitoring */
    enableRealtimeMonitoring: boolean;
    /** Enable adaptive learning from execution patterns */
    enableAdaptiveLearning: boolean;
    /** Cache size for dependency graphs */
    graphCacheSize: number;
    /** Performance optimization intervals */
    optimizationInterval: number;
    /** Metrics collection enabled */
    enableMetricsCollection: boolean;
}
/**
 * Dependency management metrics
 */
export interface DependencyMetrics {
    /** Total tasks analyzed */
    totalTasksAnalyzed: number;
    /** Total dependencies detected */
    totalDependenciesDetected: number;
    /** Average analysis time (ms) */
    averageAnalysisTime: number;
    /** Average sequencing time (ms) */
    averageSequencingTime: number;
    /** Conflicts detected count */
    conflictsDetected: number;
    /** Conflicts resolved count */
    conflictsResolved: number;
    /** Average sequence confidence */
    averageSequenceConfidence: number;
    /** Cache hit rate */
    cacheHitRate: number;
    /** Optimization success rate */
    optimizationSuccessRate: number;
}
/**
 * Real-time dependency update event
 */
export interface DependencyUpdateEvent {
    /** Event type */
    type: 'task_added' | 'task_removed' | 'task_modified' | 'dependency_changed';
    /** Affected task IDs */
    taskIds: string[];
    /** Event timestamp */
    timestamp: Date;
    /** Event metadata */
    metadata: Record<string, unknown>;
}
/**
 * Adaptive learning insight
 */
export interface AdaptiveLearningInsight {
    /** Insight category */
    category: 'performance' | 'accuracy' | 'efficiency' | 'patterns';
    /** Insight description */
    description: string;
    /** Confidence in insight */
    confidence: number;
    /** Recommended actions */
    recommendations: string[];
    /** Expected improvement */
    expectedImprovement: number;
    /** Insight data */
    data: Record<string, unknown>;
}
/**
 * Event types for intelligent dependency manager
 */
export declare enum IntelligentDependencyEvent {
    ANALYSIS_COMPLETED = "analysis_completed",
    SEQUENCE_OPTIMIZED = "sequence_optimized",
    CONFLICT_AUTO_RESOLVED = "conflict_auto_resolved",
    LEARNING_INSIGHT_GENERATED = "learning_insight_generated",
    PERFORMANCE_OPTIMIZED = "performance_optimized",
    CACHE_OPTIMIZED = "cache_optimized"
}
/**
 * Intelligent dependency management system that combines sophisticated analysis,
 * intelligent sequencing, and adaptive learning for optimal task execution
 */
export declare class IntelligentDependencyManager extends EventEmitter implements IDependencyManager {
    private readonly logger;
    private readonly config;
    private readonly analyzer;
    private readonly sequencer;
    private readonly graphCache;
    private readonly sequenceCache;
    private readonly metricsCollector;
    private readonly adaptiveLearner;
    private dependencyUpdates;
    private optimizationTimer?;
    constructor(config?: Partial<IntelligentDependencyConfig>);
    /**
     * Analyze task dependencies with intelligent caching and optimization
     */
    analyzeDependencies(tasks: ITask[]): Promise<DependencyGraph>;
    /**
     * Resolve optimal execution order with intelligent sequencing
     */
    resolveExecutionOrder(tasks: ITask[]): Promise<ITask[]>;
    /**
     * Detect circular dependencies with enhanced analysis
     */
    detectCircularDependencies(tasks: ITask[]): Promise<string[][]>;
    /**
     * Validate dependencies with comprehensive checks
     */
    validateDependencies(tasks: ITask[]): Promise<DependencyValidation>;
}
