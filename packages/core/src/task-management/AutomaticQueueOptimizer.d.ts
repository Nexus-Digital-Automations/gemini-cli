/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Automatic Queue Optimization and Performance Tuning System
 *
 * Provides intelligent, self-adapting optimization for task queue performance
 * with continuous learning, adaptive algorithms, and autonomous tuning.
 *
 * Key Features:
 * - Continuous performance analysis and optimization
 * - Self-adapting scheduling algorithms
 * - Predictive workload management
 * - Bottleneck detection and resolution
 * - Resource allocation optimization
 * - Performance regression detection
 * - Automatic configuration tuning
 * - Machine learning-based improvements
 *
 * @author TASK_QUEUE_DESIGNER_01
 * @version 1.0.0
 */
import { EventEmitter } from 'node:events';
/**
 * Comprehensive optimization configuration for queue tuning
 */
export interface OptimizationConfig {
    enabled: boolean;
    optimizationIntervalMs: number;
    analysisWindowHours: number;
    adaptationThreshold: number;
    enablePerformanceRegression: boolean;
    enableBottleneckDetection: boolean;
    enableResourceOptimization: boolean;
    enablePredictiveOptimization: boolean;
    enableAlgorithmAdaptation: boolean;
    algorithmSwitchThreshold: number;
    maxAlgorithmAttempts: number;
    algorithmStabilityPeriodMs: number;
    enableAutomaticScaling: boolean;
    enableWorkloadBalancing: boolean;
    enableMemoryOptimization: boolean;
    enableConcurrencyTuning: boolean;
    enableMachineLearning: boolean;
    predictionWindowMs: number;
    learningRateDecay: number;
    modelUpdateIntervalMs: number;
    targets: OptimizationTargets;
    constraints: OptimizationConstraints;
    enableExperimentalOptimizations: boolean;
    enableHeuristicOptimization: boolean;
    enableGeneticAlgorithmTuning: boolean;
    enableSimulatedAnnealingOptimization: boolean;
}
/**
 * Performance optimization targets and priorities
 */
export interface OptimizationTargets {
    primaryTarget: 'throughput' | 'latency' | 'efficiency' | 'balanced';
    throughputWeight: number;
    latencyWeight: number;
    efficiencyWeight: number;
    resourceWeight: number;
    targetThroughputTasksPerMinute: number;
    targetAverageLatencyMs: number;
    targetResourceUtilization: number;
    targetErrorRate: number;
    acceptableThroughputRange: [number, number];
    acceptableLatencyRange: [number, number];
    acceptableResourceRange: [number, number];
}
/**
 * Optimization constraints and limitations
 */
export interface OptimizationConstraints {
    maxConcurrentTasks: number;
    maxMemoryUsageMB: number;
    maxCpuUsagePercent: number;
    maxQueueSize: number;
    resourceLimits: {
        cpu: number;
        memory: number;
        disk: number;
        network: number;
    };
    minThroughput: number;
    maxLatency: number;
    maxErrorRate: number;
    minimumStabilityPeriodMs: number;
    maxConfigurationChangesPerHour: number;
    requirePerformanceImprovement: boolean;
}
/**
 * Optimization recommendation with detailed analysis
 */
export interface OptimizationRecommendation {
    id: string;
    timestamp: Date;
    type: OptimizationType;
    severity: 'low' | 'medium' | 'high' | 'critical';
    title: string;
    description: string;
    rationale: string;
    expectedImpact: string;
    estimatedThroughputChange: number;
    estimatedLatencyChange: number;
    estimatedResourceChange: number;
    confidence: number;
    changes: ConfigurationChange[];
    rollbackPlan: ConfigurationChange[];
    implementationComplexity: 'low' | 'medium' | 'high';
    risks: string[];
    mitigations: string[];
    reversible: boolean;
    validationMetrics: string[];
    successCriteria: string[];
    monitoringDuration: number;
}
/**
 * Types of optimization strategies available
 */
export declare enum OptimizationType {
    ALGORITHM_SWITCH = "algorithm_switch",
    CONCURRENCY_TUNING = "concurrency_tuning",
    RESOURCE_REALLOCATION = "resource_reallocation",
    PRIORITY_ADJUSTMENT = "priority_adjustment",
    BATCH_SIZE_OPTIMIZATION = "batch_size_optimization",
    SCHEDULING_POLICY = "scheduling_policy",
    MEMORY_OPTIMIZATION = "memory_optimization",
    CACHING_STRATEGY = "caching_strategy",
    LOAD_BALANCING = "load_balancing",
    PREDICTIVE_SCALING = "predictive_scaling"
}
/**
 * Configuration change for implementing optimizations
 */
export interface ConfigurationChange {
    parameter: string;
    currentValue: any;
    newValue: any;
    changeType: 'increase' | 'decrease' | 'replace' | 'add' | 'remove';
    impact: string;
    validation: string;
}
/**
 * Performance analysis result for optimization decisions
 */
export interface PerformanceAnalysis {
    timestamp: Date;
    analysisWindowMs: number;
    currentMetrics: {
        throughput: number;
        averageLatency: number;
        p95Latency: number;
        errorRate: number;
        resourceUtilization: number;
    };
    trends: {
        throughputTrend: 'improving' | 'declining' | 'stable';
        latencyTrend: 'improving' | 'declining' | 'stable';
        resourceTrend: 'improving' | 'declining' | 'stable';
        overallTrend: 'improving' | 'declining' | 'stable';
    };
    bottlenecks: BottleneckAnalysis[];
    regressions: PerformanceRegression[];
    opportunities: OptimizationOpportunity[];
    performanceScore: number;
    healthStatus: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
}
/**
 * Detailed bottleneck analysis for optimization targeting
 */
export interface BottleneckAnalysis {
    type: 'cpu' | 'memory' | 'io' | 'network' | 'algorithm' | 'coordination';
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    impact: string;
    metrics: Record<string, number>;
    recommendations: string[];
}
/**
 * Performance regression detection and analysis
 */
export interface PerformanceRegression {
    metric: string;
    severity: 'minor' | 'moderate' | 'severe' | 'critical';
    regressionPercent: number;
    detectedAt: Date;
    possibleCauses: string[];
    affectedComponents: string[];
    mitigationActions: string[];
}
/**
 * Optimization opportunity identification
 */
export interface OptimizationOpportunity {
    type: OptimizationType;
    priority: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    estimatedImprovement: string;
    implementationEffort: 'low' | 'medium' | 'high';
    requiredResources: string[];
}
/**
 * Optimization execution result with performance tracking
 */
export interface OptimizationResult {
    recommendationId: string;
    executedAt: Date;
    success: boolean;
    beforeMetrics: PerformanceAnalysis['currentMetrics'];
    afterMetrics: PerformanceAnalysis['currentMetrics'];
    actualThroughputChange: number;
    actualLatencyChange: number;
    actualResourceChange: number;
    expectedThroughputChange: number;
    expectedLatencyChange: number;
    expectedResourceChange: number;
    validationResults: Array<{
        metric: string;
        expected: number;
        actual: number;
        passed: boolean;
    }>;
    issues: string[];
    learnings: string[];
    rollbackRequired: boolean;
}
/**
 * Machine learning model for predictive optimization
 */
export interface OptimizationModel {
    type: 'regression' | 'classification' | 'clustering' | 'neural_network';
    version: string;
    trainedAt: Date;
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
    trainingDataPoints: number;
    features: string[];
    targetMetrics: string[];
    predictions: Array<{
        timestamp: Date;
        metric: string;
        predictedValue: number;
        confidence: number;
        actualValue?: number;
        accuracy?: number;
    }>;
}
/**
 * Automatic Queue Optimizer with intelligent performance tuning
 */
export declare class AutomaticQueueOptimizer extends EventEmitter {
    private config;
    private performanceHistory;
    private optimizationHistory;
    private currentRecommendations;
    private appliedOptimizations;
    private optimizationInterval;
    private analysisInterval;
    private modelUpdateInterval;
    private performanceBaseline;
    private lastOptimizationTime;
    private stabilityTracker;
    private predictionModel;
    private featureExtractor;
    private learningEngine;
    private heuristicOptimizer;
    private geneticOptimizer;
    private simulatedAnnealingOptimizer;
    constructor(config?: Partial<OptimizationConfig>);
    /**
     * Build complete optimization configuration with defaults
     */
    private buildConfig;
    /**
     * Get default optimization targets
     */
    private getDefaultTargets;
    /**
     * Get default optimization constraints
     */
    private getDefaultConstraints;
    /**
     * Initialize optimization system and start analysis
     */
    private initializeOptimization;
    /**
     * Start main optimization loop for continuous improvement
     */
    private startOptimizationLoop;
    /**
     * Start performance analysis for monitoring and detection
     */
    private startPerformanceAnalysis;
    /**
     * Start ML model updates for predictive optimization
     */
    private startModelUpdates;
    /**
     * Run complete optimization cycle with analysis and improvements
     */
    private runOptimizationCycle;
    /**
     * Analyze current performance with comprehensive metrics
     */
    private analyzePerformance;
    /**
     * Calculate performance trends from historical data
     */
    private calculatePerformanceTrends;
    /**
     * Calculate trend for a specific metric
     */
    private calculateMetricTrend;
    /**
     * Detect system bottlenecks affecting performance
     */
    private detectBottlenecks;
    /**
     * Detect performance regressions from baseline
     */
    private detectRegressions;
    /**
     * Identify optimization opportunities from performance analysis
     */
    private identifyOptimizationOpportunities;
    /**
     * Calculate overall performance score (0-100)
     */
    private calculatePerformanceScore;
    /**
     * Determine health status from performance score
     */
    private determineHealthStatus;
    /**
     * Generate optimization recommendations from opportunities
     */
    private generateOptimizationRecommendations;
    /**
     * Create detailed optimization recommendation
     */
    private createOptimizationRecommendation;
    /**
     * Get optimization title for display
     */
    private getOptimizationTitle;
    /**
     * Get optimization rationale based on analysis
     */
    private getOptimizationRationale;
    /**
     * Calculate recommendation confidence score
     */
    private calculateRecommendationConfidence;
    /**
     * Get optimization risks for risk assessment
     */
    private getOptimizationRisks;
    /**
     * Get optimization mitigations for risk management
     */
    private getOptimizationMitigations;
    /**
     * Get validation metrics for optimization monitoring
     */
    private getValidationMetrics;
    /**
     * Get success criteria for optimization validation
     */
    private getSuccessCriteria;
    /**
     * Apply selected optimizations with monitoring
     */
    private applyOptimizations;
    /**
     * Apply single optimization with before/after measurement
     */
    private applyOptimization;
    /**
     * Get expected value for validation metric
     */
    private getExpectedValue;
    /**
     * Get actual value for validation metric
     */
    private getActualValue;
    /**
     * Wait for system stabilization after optimization
     */
    private waitForStabilization;
    /**
     * Monitor optimization results and learn from outcomes
     */
    private monitorOptimizationResults;
    /**
     * Update machine learning model with recent performance data
     */
    private updatePredictionModel;
    /**
     * Get current optimization status and statistics
     */
    getOptimizationStatus(): {
        enabled: boolean;
        lastOptimization: Date | null;
        totalOptimizations: number;
        successfulOptimizations: number;
        currentPerformanceScore: number;
        activeRecommendations: number;
        stabilityPeriod: number;
    };
    /**
     * Get optimization history for analysis
     */
    getOptimizationHistory(limit?: number): OptimizationResult[];
    /**
     * Get current performance analysis
     */
    getCurrentPerformanceAnalysis(): PerformanceAnalysis | null;
    /**
     * Get active optimization recommendations
     */
    getActiveRecommendations(): OptimizationRecommendation[];
    /**
     * Manually trigger optimization cycle
     */
    triggerOptimization(): Promise<void>;
    /**
     * Force rollback of specific optimization
     */
    rollbackOptimization(recommendationId: string): Promise<boolean>;
    /**
     * Export optimization data for analysis
     */
    exportOptimizationData(): {
        config: OptimizationConfig;
        performanceHistory: PerformanceAnalysis[];
        optimizationHistory: OptimizationResult[];
        currentRecommendations: OptimizationRecommendation[];
        model: OptimizationModel | null;
    };
    /**
     * Clean shutdown of optimization system
     */
    shutdown(): Promise<void>;
    /**
     * Utility delay function
     */
    private delay;
}
/**
 * Default optimization configuration for quick setup
 */
export declare const DEFAULT_OPTIMIZATION_CONFIG: OptimizationConfig;
