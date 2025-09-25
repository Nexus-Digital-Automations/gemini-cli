/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// Mathematical algorithms
export { MathematicalAlgorithms } from './algorithms/mathematical-algorithms.js';
// Forecasting engine
export { CostForecastingEngine } from './forecasting/cost-forecasting-engine.js';
// Alert system
export { BudgetAlertSystem } from './alerts/budget-alert-system.js';
// Analysis engine
export { CostAnalysisEngine } from './analysis/cost-analysis-engine.js';
// Prediction models
export { PredictionModels } from './models/prediction-models.js';
// Alert triggers
export { AlertTriggerEngine } from './triggers/alert-trigger-engine.js';
// Optimization engine
export { BudgetOptimizationEngine } from './optimization/budget-optimization-engine.js';
// Validation framework
export { AlgorithmValidator, PerformanceMonitor, TestHarness, ValidationUtils, ValidationConstants, ValidationFramework, } from './validation/index.js';
// Re-export utilities
import { Logger } from '../utils/logger.js';
/**
 * Comprehensive cost projection and budget alert system
 * Integrates all components for complete budget management solution
 */
export class CostProjectionSystem {
    logger;
    config;
    forecastingEngine;
    alertSystem;
    analysisEngine;
    optimizationEngine;
    validator;
    performanceMonitor;
    constructor(config) {
        this.config = config;
        this.logger = new Logger('CostProjectionSystem');
        this.logger.info('Initializing cost projection system', { config });
        // Initialize core components
        this.forecastingEngine =
            new (require('./forecasting/cost-forecasting-engine.js').CostForecastingEngine)();
        this.alertSystem =
            new (require('./alerts/budget-alert-system.js').BudgetAlertSystem)();
        this.analysisEngine =
            new (require('./analysis/cost-analysis-engine.js').CostAnalysisEngine)();
        this.optimizationEngine =
            new (require('./optimization/budget-optimization-engine.js').BudgetOptimizationEngine)();
        // Initialize optional validation components
        if (config.enableValidation) {
            this.validator =
                new (require('./validation/algorithm-validator.js').AlgorithmValidator)();
            this.performanceMonitor =
                new (require('./validation/performance-monitor.js').PerformanceMonitor)();
        }
        this.logger.info('Cost projection system initialized successfully');
    }
    /**
     * Generate comprehensive cost projection with all available algorithms
     */
    async generateCostProjection(historicalData, projectionDays = 30) {
        const startTime = Date.now();
        this.logger.info('Generating comprehensive cost projection', {
            dataPoints: historicalData.length,
            projectionDays,
        });
        try {
            // Validate input data
            if (historicalData.length < 5) {
                throw new Error('Insufficient historical data for projection');
            }
            // Generate projection using forecasting engine
            const projection = await this.forecastingEngine.generateProjections(historicalData, projectionDays, 'ensemble');
            // Enhance projection with additional analysis
            const analysis = await this.analysisEngine.performComprehensiveAnalysis(historicalData, projection);
            // Add optimization recommendations
            const optimizations = await this.optimizationEngine.generateOptimizationPlan(historicalData, projection);
            // Enhance projection with optimization insights
            const enhancedProjection = {
                ...projection,
                summary: {
                    ...projection.summary,
                    optimizationPotential: optimizations.potentialSavings.totalSavings,
                    recommendedActions: optimizations.recommendations.length,
                },
                metadata: {
                    ...projection.metadata,
                    enhancedWithOptimization: true,
                    analysisHealthScore: analysis.healthScore.overall,
                },
            };
            const duration = Date.now() - startTime;
            this.logger.info('Cost projection generated successfully', {
                projectedCost: enhancedProjection.summary.totalProjectedCost,
                healthScore: analysis.healthScore.overall,
                optimizationPotential: optimizations.potentialSavings.totalSavings,
                generationTime: duration,
            });
            return enhancedProjection;
        }
        catch (error) {
            this.logger.error('Cost projection generation failed', {
                error: error.message,
                stack: error.stack,
            });
            throw error;
        }
    }
    /**
     * Monitor budget and generate alerts
     */
    async monitorBudgetAndAlert(currentUsage, budgetLimit, alertConfigs) {
        const startTime = Date.now();
        this.logger.info('Starting budget monitoring and alerting', {
            currentUsage: currentUsage.totalUsed,
            budgetLimit,
            alertConfigCount: alertConfigs.length,
        });
        try {
            // Add alert configurations
            for (const config of alertConfigs) {
                await this.alertSystem.addAlert(config);
            }
            // Check all alerts
            const alerts = await this.alertSystem.checkAllAlerts(currentUsage, budgetLimit);
            const duration = Date.now() - startTime;
            this.logger.info('Budget monitoring completed', {
                alertsTriggered: alerts.length,
                monitoringTime: duration,
            });
            return alerts;
        }
        catch (error) {
            this.logger.error('Budget monitoring failed', {
                error: error.message,
                stack: error.stack,
            });
            throw error;
        }
    }
    /**
     * Perform comprehensive cost analysis
     */
    async performCostAnalysis(costData) {
        const startTime = Date.now();
        this.logger.info('Performing comprehensive cost analysis', {
            dataPoints: costData.length,
        });
        try {
            const analysis = await this.analysisEngine.performComprehensiveAnalysis(costData);
            const duration = Date.now() - startTime;
            this.logger.info('Cost analysis completed', {
                healthScore: analysis.healthScore.overall,
                activeAlerts: analysis.activeAlerts.length,
                recommendations: analysis.recommendations.length,
                analysisTime: duration,
            });
            return analysis;
        }
        catch (error) {
            this.logger.error('Cost analysis failed', {
                error: error.message,
                stack: error.stack,
            });
            throw error;
        }
    }
    /**
     * Generate budget optimization recommendations
     */
    async generateOptimizationRecommendations(historicalData, currentProjection) {
        const startTime = Date.now();
        this.logger.info('Generating optimization recommendations', {
            dataPoints: historicalData.length,
            hasProjection: !!currentProjection,
        });
        try {
            const optimizationPlan = await this.optimizationEngine.generateOptimizationPlan(historicalData, currentProjection);
            const duration = Date.now() - startTime;
            this.logger.info('Optimization recommendations generated', {
                recommendationCount: optimizationPlan.recommendations.length,
                potentialSavings: optimizationPlan.potentialSavings.totalSavings,
                generationTime: duration,
            });
            return optimizationPlan.recommendations;
        }
        catch (error) {
            this.logger.error('Optimization recommendation generation failed', {
                error: error.message,
                stack: error.stack,
            });
            throw error;
        }
    }
    /**
     * Validate system performance and accuracy
     */
    async validateSystemPerformance() {
        if (!this.validator) {
            this.logger.warn('Validation not enabled in system configuration');
            return null;
        }
        const startTime = Date.now();
        this.logger.info('Validating system performance');
        try {
            // Create a test algorithm that combines forecasting and analysis
            const testAlgorithm = (data) => this.forecastingEngine.generateProjections(data, 30, 'ensemble');
            const report = await this.validator.runValidationSuite(testAlgorithm);
            const duration = Date.now() - startTime;
            this.logger.info('System validation completed', {
                overallScore: report.qualityAssessment.overallScore,
                successRate: report.metadata.successRate,
                validationTime: duration,
            });
            return report;
        }
        catch (error) {
            this.logger.error('System validation failed', {
                error: error.message,
                stack: error.stack,
            });
            throw error;
        }
    }
    /**
     * Start continuous monitoring
     */
    startContinuousMonitoring() {
        if (!this.config.performance.enableContinuousMonitoring) {
            this.logger.info('Continuous monitoring not enabled in configuration');
            return;
        }
        if (this.performanceMonitor) {
            this.performanceMonitor.startContinuousMonitoring(this.config.performance.benchmarkInterval);
            this.logger.info('Continuous performance monitoring started');
        }
        // Start alert system monitoring if real-time alerts are enabled
        if (this.config.enableRealTimeAlerts) {
            // Implementation would depend on real-time data source
            this.logger.info('Real-time alert monitoring started');
        }
    }
    /**
     * Stop continuous monitoring
     */
    stopContinuousMonitoring() {
        if (this.performanceMonitor) {
            this.performanceMonitor.stopContinuousMonitoring();
            this.logger.info('Continuous performance monitoring stopped');
        }
    }
    /**
     * Get system health status
     */
    getSystemHealthStatus() {
        const healthStatus = {
            overall: 'healthy',
            components: {
                forecasting: 'operational',
                alerts: 'operational',
                analysis: 'operational',
                optimization: 'operational',
                validation: this.validator ? 'operational' : undefined,
            },
            lastHealthCheck: new Date(),
        };
        this.logger.info('System health status retrieved', { healthStatus });
        return healthStatus;
    }
}
/**
 * Factory functions for creating common configurations
 */
export const ConfigurationFactory = {
    /**
     * Create standard cost projection system configuration
     */
    createStandardConfig: () => ({
        enableAdvancedForecasting: true,
        enableRealTimeAlerts: true,
        enableOptimization: true,
        enableValidation: true,
        logging: {
            level: 'info',
            enablePerformanceLogging: true,
        },
        alerts: {
            defaultChannels: ['console'],
            defaultSeverity: 'warning',
            suppressionCooldown: 300000, // 5 minutes
        },
        performance: {
            enableContinuousMonitoring: true,
            benchmarkInterval: 300000, // 5 minutes
            degradationThreshold: 0.2, // 20%
        },
    }),
    /**
     * Create performance-optimized configuration
     */
    createPerformanceConfig: () => ({
        enableAdvancedForecasting: true,
        enableRealTimeAlerts: false,
        enableOptimization: false,
        enableValidation: false,
        logging: {
            level: 'warn',
            enablePerformanceLogging: false,
        },
        alerts: {
            defaultChannels: ['console'],
            defaultSeverity: 'critical',
            suppressionCooldown: 600000, // 10 minutes
        },
        performance: {
            enableContinuousMonitoring: false,
            benchmarkInterval: 3600000, // 1 hour
            degradationThreshold: 0.5, // 50%
        },
    }),
    /**
     * Create development/testing configuration
     */
    createDevelopmentConfig: () => ({
        enableAdvancedForecasting: true,
        enableRealTimeAlerts: false,
        enableOptimization: true,
        enableValidation: true,
        logging: {
            level: 'debug',
            enablePerformanceLogging: true,
        },
        alerts: {
            defaultChannels: ['console'],
            defaultSeverity: 'info',
            suppressionCooldown: 60000, // 1 minute
        },
        performance: {
            enableContinuousMonitoring: true,
            benchmarkInterval: 60000, // 1 minute
            degradationThreshold: 0.1, // 10%
        },
    }),
    /**
     * Create default budget alert configuration
     */
    createDefaultAlertConfig: (id, thresholdValue, severity = 'warning') => ({
        id,
        name: `Budget Alert ${id}`,
        description: `Automated budget monitoring alert`,
        threshold: {
            type: 'absolute',
            value: thresholdValue,
            operator: 'greater_than',
            timeWindow: 'daily',
        },
        severity,
        channels: ['console'],
        suppression: {
            cooldownMinutes: 60,
            maxAlertsPerHour: 3,
        },
    }),
};
/**
 * System constants and defaults
 */
export const SystemConstants = {
    /** Default projection window */
    DEFAULT_PROJECTION_DAYS: 30,
    /** Minimum historical data points required */
    MIN_HISTORICAL_DATA_POINTS: 5,
    /** Default confidence interval for projections */
    DEFAULT_CONFIDENCE_INTERVAL: 0.95,
    /** System version */
    VERSION: '1.0.0',
    /** System name */
    NAME: 'Cost Projection and Budget Alert System',
};
/**
 * Utility functions for common operations
 */
export const SystemUtils = {
    /**
     * Validate historical data for projection requirements
     */
    validateHistoricalData: (data) => {
        const issues = [];
        const recommendations = [];
        if (data.length < SystemConstants.MIN_HISTORICAL_DATA_POINTS) {
            issues.push(`Insufficient data points: ${data.length} < ${SystemConstants.MIN_HISTORICAL_DATA_POINTS}`);
            recommendations.push('Collect more historical data for accurate projections');
        }
        // Check for data quality issues
        const hasValidCosts = data.every((d) => typeof d.cost === 'number' && !isNaN(d.cost) && isFinite(d.cost));
        if (!hasValidCosts) {
            issues.push('Invalid cost values detected');
            recommendations.push('Clean data to ensure all cost values are valid numbers');
        }
        // Check for chronological order
        const sortedData = [...data].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
        const isChronological = JSON.stringify(data) === JSON.stringify(sortedData);
        if (!isChronological) {
            issues.push('Data is not in chronological order');
            recommendations.push('Sort data by timestamp before processing');
        }
        return {
            valid: issues.length === 0,
            issues,
            recommendations,
        };
    },
    /**
     * Calculate data quality score
     */
    calculateDataQualityScore: (data) => {
        if (data.length === 0)
            return 0;
        let score = 100;
        // Penalize insufficient data
        if (data.length < SystemConstants.MIN_HISTORICAL_DATA_POINTS) {
            score -= 30;
        }
        // Check for missing values
        const validCosts = data.filter((d) => typeof d.cost === 'number' && !isNaN(d.cost) && isFinite(d.cost)).length;
        const validityRatio = validCosts / data.length;
        score *= validityRatio;
        // Check for reasonable variance
        if (validCosts > 1) {
            const costs = data
                .map((d) => d.cost)
                .filter((cost) => typeof cost === 'number' && !isNaN(cost) && isFinite(cost));
            const mean = costs.reduce((sum, cost) => sum + cost, 0) / costs.length;
            const variance = costs.reduce((sum, cost) => sum + Math.pow(cost - mean, 2), 0) /
                costs.length;
            const coefficientOfVariation = Math.sqrt(variance) / mean;
            // Penalize extremely high variance (potential data quality issues)
            if (coefficientOfVariation > 3) {
                score -= 20;
            }
        }
        return Math.max(0, Math.round(score));
    },
};
//# sourceMappingURL=index.js.map