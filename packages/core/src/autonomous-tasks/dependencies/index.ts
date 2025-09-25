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

// Core dependency analysis
export {
  DependencyAnalyzer,
  type DependencyAnalysisConfig,
  type DetectedDependency,
  type DependencyAnalysisResult
} from './DependencyAnalyzer.js';

// Intelligent sequencing and conflict resolution
export {
  DependencySequencer,
  SequencingStrategy,
  SequencerEvent,
  type SequencingConfig,
  type ParallelExecutionGroup,
  type ExecutionSequence,
  type DependencyConflict,
  type ConflictResolution,
  type ConflictResolutionAction,
  type ConflictImpact
} from './DependencySequencer.js';

// Unified intelligent dependency management
export {
  IntelligentDependencyManager,
  IntelligentDependencyEvent,
  type IntelligentDependencyConfig,
  type DependencyMetrics,
  type DependencyUpdateEvent,
  type AdaptiveLearningInsight
} from './IntelligentDependencyManager.js';

/**
 * Create a fully configured intelligent dependency management system
 * with optimized defaults for autonomous task execution
 */
export function createIntelligentDependencySystem(
  config?: Partial<import('./IntelligentDependencyManager.js').IntelligentDependencyConfig>
): import('./IntelligentDependencyManager.js').IntelligentDependencyManager {
  return new (require('./IntelligentDependencyManager.js').IntelligentDependencyManager)(config);
}

/**
 * Create a standalone dependency analyzer for basic dependency detection
 */
export function createDependencyAnalyzer(
  config?: Partial<import('./DependencyAnalyzer.js').DependencyAnalysisConfig>
): import('./DependencyAnalyzer.js').DependencyAnalyzer {
  return new (require('./DependencyAnalyzer.js').DependencyAnalyzer)(config);
}

/**
 * Create a standalone dependency sequencer for task ordering and optimization
 */
export function createDependencySequencer(
  config?: Partial<import('./DependencySequencer.js').SequencingConfig>
): import('./DependencySequencer.js').DependencySequencer {
  return new (require('./DependencySequencer.js').DependencySequencer)(config);
}

/**
 * Predefined configurations for common dependency management scenarios
 */
export const DependencyConfigurations = {
  /**
   * High-performance configuration optimized for speed and throughput
   */
  HIGH_PERFORMANCE: {
    analysisConfig: {
      enableImplicitDetection: false,
      maxChainLength: 8,
      weights: {
        explicit: 1.0,
        implicit: 0.5,
        resource: 0.9,
        temporal: 0.6
      }
    },
    sequencingConfig: {
      strategy: import('./DependencySequencer.js').SequencingStrategy.PRIORITY_FIRST,
      maxParallelGroups: 12,
      timeOptimizationWeight: 0.6,
      resourceOptimizationWeight: 0.2,
      qualityOptimizationWeight: 0.2,
      enableAutoConflictResolution: true
    },
    enableRealtimeMonitoring: false,
    enableAdaptiveLearning: false,
    graphCacheSize: 50
  },

  /**
   * Comprehensive configuration with full analysis and learning capabilities
   */
  COMPREHENSIVE: {
    analysisConfig: {
      enableImplicitDetection: true,
      maxChainLength: 20,
      weights: {
        explicit: 1.0,
        implicit: 0.8,
        resource: 0.9,
        temporal: 0.7
      },
      sensitivity: {
        keyword: 0.9,
        semantic: 0.8,
        structural: 0.7
      }
    },
    sequencingConfig: {
      strategy: import('./DependencySequencer.js').SequencingStrategy.CRITICAL_PATH,
      maxParallelGroups: 8,
      timeOptimizationWeight: 0.3,
      resourceOptimizationWeight: 0.3,
      qualityOptimizationWeight: 0.4,
      enableAutoConflictResolution: true,
      minimumConfidenceThreshold: 0.8
    },
    enableRealtimeMonitoring: true,
    enableAdaptiveLearning: true,
    graphCacheSize: 200,
    enableMetricsCollection: true
  },

  /**
   * Resource-optimized configuration for resource-constrained environments
   */
  RESOURCE_OPTIMIZED: {
    analysisConfig: {
      enableImplicitDetection: true,
      maxChainLength: 12,
      weights: {
        explicit: 1.0,
        implicit: 0.7,
        resource: 1.0,
        temporal: 0.5
      }
    },
    sequencingConfig: {
      strategy: import('./DependencySequencer.js').SequencingStrategy.RESOURCE_OPTIMIZED,
      maxParallelGroups: 6,
      timeOptimizationWeight: 0.2,
      resourceOptimizationWeight: 0.6,
      qualityOptimizationWeight: 0.2,
      enableAutoConflictResolution: true
    },
    enableRealtimeMonitoring: true,
    enableAdaptiveLearning: true,
    graphCacheSize: 100
  },

  /**
   * Quality-focused configuration prioritizing correctness and reliability
   */
  QUALITY_FOCUSED: {
    analysisConfig: {
      enableImplicitDetection: true,
      maxChainLength: 25,
      weights: {
        explicit: 1.0,
        implicit: 0.9,
        resource: 0.9,
        temporal: 0.8
      },
      sensitivity: {
        keyword: 0.95,
        semantic: 0.9,
        structural: 0.8
      }
    },
    sequencingConfig: {
      strategy: import('./DependencySequencer.js').SequencingStrategy.CRITICAL_PATH,
      maxParallelGroups: 5,
      timeOptimizationWeight: 0.2,
      resourceOptimizationWeight: 0.2,
      qualityOptimizationWeight: 0.6,
      enableAutoConflictResolution: true,
      minimumConfidenceThreshold: 0.9
    },
    enableRealtimeMonitoring: true,
    enableAdaptiveLearning: true,
    graphCacheSize: 150,
    enableMetricsCollection: true
  }
} as const;