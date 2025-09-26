/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Comprehensive Cost Projection and Budget Alert System
 *
 * This module provides a complete solution for cost projection, budget monitoring,
 * and alert management. It combines advanced mathematical algorithms, machine learning
 * techniques, and performance monitoring to deliver accurate cost forecasting and
 * proactive budget management.
 *
 * @example Basic Cost Projection
 * ```typescript
 * import { CostProjectionSystem, createStandardProjectionConfig } from '@core/budget/projections';
 *
 * const system = new CostProjectionSystem(createStandardProjectionConfig());
 * const projection = await system.generateCostProjection(historicalData);
 * console.log(`Projected cost: $${projection.summary.totalProjectedCost}`);
 * ```
 *
 * @example Budget Alert System
 * ```typescript
 * import { BudgetAlertManager, createDefaultAlertConfig } from '@core/budget/projections';
 *
 * const alertManager = new BudgetAlertManager();
 * await alertManager.addAlert(createDefaultAlertConfig('budget_threshold', 1000));
 * const alerts = await alertManager.checkAllAlerts(currentUsage);
 * ```
 *
 * @example Comprehensive Analysis
 * ```typescript
 * import { CostAnalysisEngine } from '@core/budget/projections';
 *
 * const engine = new CostAnalysisEngine();
 * const analysis = await engine.performComprehensiveAnalysis(costData);
 * console.log(`Health Score: ${analysis.healthScore.overall}/100`);
 * ```
 */
export type { CostDataPoint, StatisticalMeasures, TrendAnalysis, MovingAverageAnalysis, SeasonalAnalysis, CostProjection, BudgetAlertConfig, BudgetAlert, VarianceDetection, BurnRateAnalysis, OptimizationRecommendation, CostAnalysisResult, } from './types.js';
export { MathematicalAlgorithms } from './algorithms/mathematical-algorithms.js';
export { CostForecastingEngine } from './forecasting/cost-forecasting-engine.js';
export { BudgetAlertSystem } from './alerts/budget-alert-system.js';
export { CostAnalysisEngine } from './analysis/cost-analysis-engine.js';
export { PredictionModels } from './models/prediction-models.js';
export { AlertTriggerEngine } from './triggers/alert-trigger-engine.js';
export { BudgetOptimizationEngine } from './optimization/budget-optimization-engine.js';
export { AlgorithmValidator, PerformanceMonitor, TestHarness, ValidationUtils, ValidationConstants, ValidationFramework, type ValidationMetrics, type ValidationTestCase, type ValidationResult, type ValidationReport, type PerformanceBenchmark, type PerformanceTrend, type PerformanceAlert, type DegradationDetection, type TestSuiteConfig, type TestExecutionResult, type AlgorithmTestSpec, type TestDataConfig, } from './validation/index.js';
/**
 * Configuration for the comprehensive cost projection system
 */
export interface CostProjectionSystemConfig {
    /** Enable advanced forecasting algorithms */
    enableAdvancedForecasting: boolean;
    /** Enable real-time alert monitoring */
    enableRealTimeAlerts: boolean;
    /** Enable performance optimization */
    enableOptimization: boolean;
    /** Enable continuous validation */
    enableValidation: boolean;
    /** Logging configuration */
    logging: {
        level: 'error' | 'warn' | 'info' | 'debug';
        enablePerformanceLogging: boolean;
    };
    /** Alert configuration */
    alerts: {
        defaultChannels: BudgetAlertConfig['channels'];
        defaultSeverity: BudgetAlertConfig['severity'];
        suppressionCooldown: number;
    };
    /** Performance monitoring configuration */
    performance: {
        enableContinuousMonitoring: boolean;
        benchmarkInterval: number;
        degradationThreshold: number;
    };
}
/**
 * Comprehensive cost projection and budget alert system
 * Integrates all components for complete budget management solution
 */
export declare class CostProjectionSystem {
    private logger;
    private config;
    private forecastingEngine;
    private alertSystem;
    private analysisEngine;
    private optimizationEngine;
    private validator?;
    private performanceMonitor?;
    constructor(config: CostProjectionSystemConfig);
    /**
     * Generate comprehensive cost projection with all available algorithms
     */
    generateCostProjection(historicalData: Array<import('./types.js').CostDataPoint>, projectionDays?: number): Promise<import('./types.js').CostProjection>;
    /**
     * Monitor budget and generate alerts
     */
    monitorBudgetAndAlert(currentUsage: import('./types.js').BudgetUsageData, budgetLimit: number, alertConfigs: Array<import('./types.js').BudgetAlertConfig>): Promise<Array<import('./types.js').BudgetAlert>>;
    /**
     * Perform comprehensive cost analysis
     */
    performCostAnalysis(costData: Array<import('./types.js').CostDataPoint>): Promise<import('./types.js').CostAnalysisResult>;
    /**
     * Generate budget optimization recommendations
     */
    generateOptimizationRecommendations(historicalData: Array<import('./types.js').CostDataPoint>, currentProjection?: import('./types.js').CostProjection): Promise<Array<import('./types.js').OptimizationRecommendation>>;
    /**
     * Validate system performance and accuracy
     */
    validateSystemPerformance(): Promise<import('./validation/algorithm-validator.js').ValidationReport | null>;
    /**
     * Start continuous monitoring
     */
    startContinuousMonitoring(): void;
    /**
     * Stop continuous monitoring
     */
    stopContinuousMonitoring(): void;
    /**
     * Get system health status
     */
    getSystemHealthStatus(): {
        overall: 'healthy' | 'warning' | 'critical';
        components: {
            forecasting: 'operational' | 'degraded' | 'offline';
            alerts: 'operational' | 'degraded' | 'offline';
            analysis: 'operational' | 'degraded' | 'offline';
            optimization: 'operational' | 'degraded' | 'offline';
            validation?: 'operational' | 'degraded' | 'offline';
        };
        lastHealthCheck: Date;
    };
}
/**
 * Factory functions for creating common configurations
 */
export declare const ConfigurationFactory: {
    /**
     * Create standard cost projection system configuration
     */
    createStandardConfig: () => CostProjectionSystemConfig;
    /**
     * Create performance-optimized configuration
     */
    createPerformanceConfig: () => CostProjectionSystemConfig;
    /**
     * Create development/testing configuration
     */
    createDevelopmentConfig: () => CostProjectionSystemConfig;
    /**
     * Create default budget alert configuration
     */
    createDefaultAlertConfig: (id: string, thresholdValue: number, severity?: import("./types.js").BudgetAlertConfig["severity"]) => import("./types.js").BudgetAlertConfig;
};
/**
 * System constants and defaults
 */
export declare const SystemConstants: {
    /** Default projection window */
    readonly DEFAULT_PROJECTION_DAYS: 30;
    /** Minimum historical data points required */
    readonly MIN_HISTORICAL_DATA_POINTS: 5;
    /** Default confidence interval for projections */
    readonly DEFAULT_CONFIDENCE_INTERVAL: 0.95;
    /** System version */
    readonly VERSION: "1.0.0";
    /** System name */
    readonly NAME: "Cost Projection and Budget Alert System";
};
/**
 * Utility functions for common operations
 */
export declare const SystemUtils: {
    /**
     * Validate historical data for projection requirements
     */
    validateHistoricalData: (data: Array<import("./types.js").CostDataPoint>) => {
        valid: boolean;
        issues: string[];
        recommendations: string[];
    };
    /**
     * Calculate data quality score
     */
    calculateDataQualityScore: (data: Array<import("./types.js").CostDataPoint>) => number;
};
