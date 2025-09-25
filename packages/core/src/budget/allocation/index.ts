/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Budget allocation system - Main module exports
 * Intelligent budget allocation recommendations and optimization system
 *
 * @author Claude Code - Budget Allocation Agent
 * @version 1.0.0
 */

// Core allocation types
export type {
  AllocationPriority,
  AllocationStrategy,
  AllocationConstraints,
  SLARequirements,
  AllocationCandidate,
  AllocationRecommendation,
  AllocationImpact,
  RiskAssessment,
  AllocationScenario,
  ScenarioOutcome,
  AllocationAlgorithmConfig,
  AllocationOptimizationResult,
} from './types.js';

// Algorithm exports
export {
  BaseAllocationAlgorithm,
  UsageBasedAlgorithm,
  ROIOptimizedAlgorithm,
  PriorityBasedAlgorithm,
  createAllocationAlgorithm,
  createUsageBasedAlgorithm,
  createROIOptimizedAlgorithm,
  createPriorityBasedAlgorithm,
  getDefaultAlgorithmConfig,
  validateAlgorithmConfig,
  getAlgorithmMetrics,
  compareAlgorithmPerformance,
  type AllocationLogger,
  type AlgorithmComparison,
  ALGORITHM_REGISTRY,
} from './algorithms/index.js';

// Recommendation engine exports
export {
  RecommendationEngine,
  createRecommendationEngine,
  type RecommendationEngineConfig,
  type RecommendationContext,
  type RecommendationResult,
  type RecommendationInsights,
  type RecommendationPerformanceMetrics,
} from './recommendations/index.js';

/**
 * Main allocation system interface
 */
export interface AllocationSystem {
  /** Recommendation engine instance */
  recommendationEngine: RecommendationEngine;
  /** Available allocation strategies */
  availableStrategies: AllocationStrategy[];
  /** System configuration */
  configuration: AllocationSystemConfig;
  /** Generate recommendations */
  generateRecommendations(
    candidates: AllocationCandidate[],
    context: RecommendationContext
  ): Promise<RecommendationResult>;
  /** Update system configuration */
  updateConfiguration(config: Partial<AllocationSystemConfig>): void;
  /** Get system health metrics */
  getHealthMetrics(): AllocationSystemHealth;
}

/**
 * Allocation system configuration
 */
export interface AllocationSystemConfig {
  /** Default allocation strategy */
  defaultStrategy: AllocationStrategy;
  /** Enable multi-strategy analysis */
  enableMultiStrategy: boolean;
  /** Enable scenario generation */
  enableScenarios: boolean;
  /** Minimum confidence threshold */
  minConfidence: number;
  /** Maximum recommendations per request */
  maxRecommendations: number;
  /** Logging configuration */
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
    enablePerformanceLogging: boolean;
  };
}

/**
 * Allocation system health metrics
 */
export interface AllocationSystemHealth {
  /** System status */
  status: 'healthy' | 'degraded' | 'unhealthy';
  /** Last request processing time */
  lastProcessingTime: number;
  /** Average processing time (last 10 requests) */
  averageProcessingTime: number;
  /** Success rate percentage */
  successRate: number;
  /** Number of requests processed */
  requestCount: number;
  /** System uptime in milliseconds */
  uptime: number;
  /** Memory usage information */
  memoryUsage: {
    used: number;
    total: number;
    percentage: number;
  };
}

/**
 * Default allocation system configuration
 */
export const DEFAULT_ALLOCATION_CONFIG: AllocationSystemConfig = {
  defaultStrategy: 'usage_based',
  enableMultiStrategy: true,
  enableScenarios: true,
  minConfidence: 60,
  maxRecommendations: 20,
  logging: {
    level: 'info',
    enablePerformanceLogging: true,
  },
};

/**
 * Create allocation system instance
 * @param config - System configuration (optional)
 * @param logger - Logger instance
 * @returns AllocationSystem instance
 */
export function createAllocationSystem(
  config: Partial<AllocationSystemConfig> = {},
  logger: AllocationLogger
): AllocationSystem {
  const finalConfig = { ...DEFAULT_ALLOCATION_CONFIG, ...config };

  const recommendationEngine = createRecommendationEngine(
    finalConfig.defaultStrategy,
    logger
  );

  const startTime = Date.now();
  let requestCount = 0;
  let successCount = 0;
  const processingTimes: number[] = [];

  const system: AllocationSystem = {
    recommendationEngine,
    availableStrategies: ['usage_based', 'roi_optimized', 'priority_weighted'],
    configuration: finalConfig,

    async generateRecommendations(
      candidates: AllocationCandidate[],
      context: RecommendationContext
    ): Promise<RecommendationResult> {
      const requestStart = performance.now();
      requestCount++;

      try {
        const result = await recommendationEngine.generateRecommendations(candidates, context);
        successCount++;

        const processingTime = performance.now() - requestStart;
        processingTimes.push(processingTime);
        if (processingTimes.length > 10) {
          processingTimes.shift(); // Keep only last 10
        }

        logger.info('Allocation recommendations generated successfully', {
          candidateCount: candidates.length,
          recommendationCount: result.primaryRecommendations.length,
          processingTime
        });

        return result;
      } catch (error) {
        logger.error('Failed to generate allocation recommendations', {
          error: error instanceof Error ? error.message : 'Unknown error',
          candidateCount: candidates.length
        });
        throw error;
      }
    },

    updateConfiguration(config: Partial<AllocationSystemConfig>): void {
      Object.assign(finalConfig, config);
      logger.info('Allocation system configuration updated', { config });
    },

    getHealthMetrics(): AllocationSystemHealth {
      const now = Date.now();
      const uptime = now - startTime;
      const successRate = requestCount > 0 ? (successCount / requestCount) * 100 : 100;
      const averageProcessingTime = processingTimes.length > 0
        ? processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length
        : 0;
      const lastProcessingTime = processingTimes.length > 0
        ? processingTimes[processingTimes.length - 1]
        : 0;

      // Simplified memory usage (would need actual memory monitoring in production)
      const memoryUsage = process.memoryUsage();
      const memoryUsageInfo = {
        used: memoryUsage.heapUsed,
        total: memoryUsage.heapTotal,
        percentage: (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100
      };

      let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
      if (successRate < 90 || averageProcessingTime > 10000) {
        status = 'degraded';
      }
      if (successRate < 70 || averageProcessingTime > 30000) {
        status = 'unhealthy';
      }

      return {
        status,
        lastProcessingTime,
        averageProcessingTime,
        successRate,
        requestCount,
        uptime,
        memoryUsage: memoryUsageInfo
      };
    }
  };

  logger.info('Allocation system created successfully', {
    defaultStrategy: finalConfig.defaultStrategy,
    multiStrategy: finalConfig.enableMultiStrategy,
    scenarios: finalConfig.enableScenarios
  });

  return system;
}

/**
 * Utility function to create allocation candidates from budget data
 * @param budgetData - Budget usage data
 * @param settings - Budget settings
 * @returns Array of allocation candidates
 */
export function createAllocationCandidatesFromBudgetData(
  budgetData: any[], // This would be properly typed based on actual budget data structure
  settings: any = {} // This would be properly typed based on actual settings structure
): AllocationCandidate[] {
  // This is a placeholder implementation
  // In a real system, this would convert budget data to allocation candidates
  return [];
}

/**
 * Utility function to create recommendation context from system state
 * @param totalBudget - Total available budget
 * @param preferences - User preferences
 * @returns Recommendation context
 */
export function createRecommendationContext(
  totalBudget: number,
  preferences: Partial<RecommendationContext['preferences']> = {}
): RecommendationContext {
  return {
    budgetConstraints: {
      totalBudget,
      emergencyReserve: totalBudget * 0.1 // 10% reserve
    },
    businessContext: {
      fiscalYear: new Date().getFullYear().toString(),
      businessCycle: 'maintenance',
      marketConditions: 'stable',
      competitivePosition: 'challenger'
    },
    preferences: {
      riskTolerance: 'moderate',
      optimizationHorizon: 'medium_term',
      priorityFocus: 'efficiency',
      ...preferences
    }
  };
}