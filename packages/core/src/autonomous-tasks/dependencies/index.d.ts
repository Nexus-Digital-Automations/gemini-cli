/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Comprehensive dependency analysis and intelligent task sequencing system
 *
 * This module provides sophisticated dependency management capabilities for autonomous task execution:
 *
 * - **DependencyAnalyzer**: Detects explicit, implicit, resource, temporal, and priority dependencies
 * - **DependencySequencer**: Generates optimal execution sequences with conflict resolution
 * - **IntelligentDependencyManager**: Unified system with caching, learning, and real-time optimization
 *
 * Key features:
 * - Multi-layered dependency detection with confidence scoring
 * - Intelligent task sequencing with multiple optimization strategies
 * - Automatic conflict detection and resolution
 * - Adaptive learning from execution patterns
 * - Real-time dependency monitoring and optimization
 * - Comprehensive caching and performance optimization
 */
export { DependencyAnalyzer, type DependencyAnalysisConfig, type DetectedDependency, type DependencyAnalysisResult } from './DependencyAnalyzer.js';
export { DependencySequencer, SequencingStrategy, SequencerEvent, type SequencingConfig, type ParallelExecutionGroup, type ExecutionSequence, type DependencyConflict, type ConflictResolution, type ConflictResolutionAction, type ConflictImpact } from './DependencySequencer.js';
export { IntelligentDependencyManager, IntelligentDependencyEvent, type IntelligentDependencyConfig, type DependencyMetrics, type DependencyUpdateEvent, type AdaptiveLearningInsight } from './IntelligentDependencyManager.js';
/**
 * Create a fully configured intelligent dependency management system
 * with optimized defaults for autonomous task execution
 */
export declare function createIntelligentDependencySystem(config?: Partial<import('./IntelligentDependencyManager.js').IntelligentDependencyConfig>): import('./IntelligentDependencyManager.js').IntelligentDependencyManager;
/**
 * Create a standalone dependency analyzer for basic dependency detection
 */
export declare function createDependencyAnalyzer(config?: Partial<import('./DependencyAnalyzer.js').DependencyAnalysisConfig>): import('./DependencyAnalyzer.js').DependencyAnalyzer;
/**
 * Create a standalone dependency sequencer for task ordering and optimization
 */
export declare function createDependencySequencer(config?: Partial<import('./DependencySequencer.js').SequencingConfig>): import('./DependencySequencer.js').DependencySequencer;
/**
 * Predefined configurations for common dependency management scenarios
 */
export declare const DependencyConfigurations: {
    /**
     * High-performance configuration optimized for speed and throughput
     */
    readonly HIGH_PERFORMANCE: {
        readonly analysisConfig: {
            readonly enableImplicitDetection: false;
            readonly maxChainLength: 8;
            readonly weights: {
                readonly explicit: 1;
                readonly implicit: 0.5;
                readonly resource: 0.9;
                readonly temporal: 0.6;
            };
        };
        readonly sequencingConfig: {
            readonly strategy: any;
            readonly maxParallelGroups: 12;
            readonly timeOptimizationWeight: 0.6;
            readonly resourceOptimizationWeight: 0.2;
            readonly qualityOptimizationWeight: 0.2;
            readonly enableAutoConflictResolution: true;
        };
        readonly enableRealtimeMonitoring: false;
        readonly enableAdaptiveLearning: false;
        readonly graphCacheSize: 50;
    };
    /**
     * Comprehensive configuration with full analysis and learning capabilities
     */
    readonly COMPREHENSIVE: {
        readonly analysisConfig: {
            readonly enableImplicitDetection: true;
            readonly maxChainLength: 20;
            readonly weights: {
                readonly explicit: 1;
                readonly implicit: 0.8;
                readonly resource: 0.9;
                readonly temporal: 0.7;
            };
            readonly sensitivity: {
                readonly keyword: 0.9;
                readonly semantic: 0.8;
                readonly structural: 0.7;
            };
        };
        readonly sequencingConfig: {
            readonly strategy: any;
            readonly maxParallelGroups: 8;
            readonly timeOptimizationWeight: 0.3;
            readonly resourceOptimizationWeight: 0.3;
            readonly qualityOptimizationWeight: 0.4;
            readonly enableAutoConflictResolution: true;
            readonly minimumConfidenceThreshold: 0.8;
        };
        readonly enableRealtimeMonitoring: true;
        readonly enableAdaptiveLearning: true;
        readonly graphCacheSize: 200;
        readonly enableMetricsCollection: true;
    };
    /**
     * Resource-optimized configuration for resource-constrained environments
     */
    readonly RESOURCE_OPTIMIZED: {
        readonly analysisConfig: {
            readonly enableImplicitDetection: true;
            readonly maxChainLength: 12;
            readonly weights: {
                readonly explicit: 1;
                readonly implicit: 0.7;
                readonly resource: 1;
                readonly temporal: 0.5;
            };
        };
        readonly sequencingConfig: {
            readonly strategy: any;
            readonly maxParallelGroups: 6;
            readonly timeOptimizationWeight: 0.2;
            readonly resourceOptimizationWeight: 0.6;
            readonly qualityOptimizationWeight: 0.2;
            readonly enableAutoConflictResolution: true;
        };
        readonly enableRealtimeMonitoring: true;
        readonly enableAdaptiveLearning: true;
        readonly graphCacheSize: 100;
    };
    /**
     * Quality-focused configuration prioritizing correctness and reliability
     */
    readonly QUALITY_FOCUSED: {
        readonly analysisConfig: {
            readonly enableImplicitDetection: true;
            readonly maxChainLength: 25;
            readonly weights: {
                readonly explicit: 1;
                readonly implicit: 0.9;
                readonly resource: 0.9;
                readonly temporal: 0.8;
            };
            readonly sensitivity: {
                readonly keyword: 0.95;
                readonly semantic: 0.9;
                readonly structural: 0.8;
            };
        };
        readonly sequencingConfig: {
            readonly strategy: any;
            readonly maxParallelGroups: 5;
            readonly timeOptimizationWeight: 0.2;
            readonly resourceOptimizationWeight: 0.2;
            readonly qualityOptimizationWeight: 0.6;
            readonly enableAutoConflictResolution: true;
            readonly minimumConfidenceThreshold: 0.9;
        };
        readonly enableRealtimeMonitoring: true;
        readonly enableAdaptiveLearning: true;
        readonly graphCacheSize: 150;
        readonly enableMetricsCollection: true;
    };
};
