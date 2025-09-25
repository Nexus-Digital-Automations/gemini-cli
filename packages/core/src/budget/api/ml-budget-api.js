/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { MLEnhancedBudgetTracker, createMLEnhancedBudgetTracker, } from '../ml-enhanced-tracker.js';
/**
 * ML Budget API class providing endpoints for cost projection and forecasting
 */
export class MLBudgetAPI {
    trackers = new Map();
    /**
     * Get or create ML-enhanced budget tracker for a project
     */
    getTracker(projectRoot, settings) {
        const key = `${projectRoot}:${JSON.stringify(settings)}`;
        if (!this.trackers.has(key)) {
            const tracker = createMLEnhancedBudgetTracker(projectRoot, settings);
            this.trackers.set(key, tracker);
        }
        return this.trackers.get(key);
    }
    /**
     * Generate budget forecast using ML models
     */
    async generateForecast(request) {
        try {
            const tracker = this.getTracker(request.projectRoot, request.settings);
            const forecast = await tracker.generateBudgetForecast(request.forecastHours);
            return {
                success: true,
                data: {
                    forecast: forecast.forecast,
                    recommendations: forecast.recommendations,
                    riskAssessment: forecast.riskAssessment,
                    confidence: forecast.confidence,
                    generatedAt: new Date().toISOString(),
                    forecastHorizon: request.forecastHours,
                },
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            };
        }
    }
    /**
     * Get optimization suggestions categorized by time horizon
     */
    async getOptimizationSuggestions(request) {
        try {
            const tracker = this.getTracker(request.projectRoot, request.settings);
            const suggestions = await tracker.getOptimizationSuggestions();
            return {
                success: true,
                data: {
                    immediate: suggestions.immediate,
                    shortTerm: suggestions.shortTerm,
                    longTerm: suggestions.longTerm,
                    potentialSavings: suggestions.potentialSavings,
                    generatedAt: new Date().toISOString(),
                },
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            };
        }
    }
    /**
     * Detect usage anomalies and analyze patterns
     */
    async detectAnomalies(request) {
        try {
            const tracker = this.getTracker(request.projectRoot, request.settings);
            const anomalies = await tracker.detectUsageAnomalies();
            return {
                success: true,
                data: {
                    anomalies: anomalies.anomalies,
                    patterns: anomalies.patterns,
                    generatedAt: new Date().toISOString(),
                },
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            };
        }
    }
    /**
     * Get ML model performance metrics and recommendations
     */
    async getModelMetrics(request) {
        try {
            const tracker = this.getTracker(request.projectRoot, request.settings);
            const metrics = await tracker.getMLModelMetrics();
            return {
                success: true,
                data: {
                    models: metrics.models.map((model) => ({
                        ...model,
                        lastTraining: model.lastTraining.toISOString(),
                    })),
                    overallAccuracy: metrics.overallAccuracy,
                    dataQuality: metrics.dataQuality,
                    recommendations: metrics.recommendations,
                    generatedAt: new Date().toISOString(),
                },
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            };
        }
    }
    /**
     * Get enhanced usage statistics with ML predictions
     */
    async getUsageStats(request) {
        try {
            const tracker = this.getTracker(request.projectRoot, request.settings);
            const stats = await tracker.getEnhancedUsageStats();
            return {
                success: true,
                data: {
                    current: {
                        requestCount: stats.requestCount,
                        dailyLimit: stats.dailyLimit,
                        remainingRequests: stats.remainingRequests,
                        usagePercentage: stats.usagePercentage,
                        timeUntilReset: stats.timeUntilReset,
                    },
                    mlPredictions: stats.mlPredictions,
                    generatedAt: new Date().toISOString(),
                },
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            };
        }
    }
    /**
     * Record a new request and trigger ML learning
     */
    async recordRequest(projectRoot, settings) {
        try {
            const tracker = this.getTracker(projectRoot, settings);
            await tracker.recordRequest();
            return { success: true };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            };
        }
    }
    /**
     * Health check endpoint for ML system
     */
    async healthCheck(projectRoot, settings) {
        try {
            const tracker = this.getTracker(projectRoot, settings);
            const stats = await tracker.getEnhancedUsageStats();
            const metrics = await tracker.getMLModelMetrics();
            const trackerInitialized = true;
            const dataAvailable = stats.requestCount > 0;
            const modelsTrained = metrics.models.length > 0;
            const lastUpdate = stats.mlPredictions?.lastMLUpdate
                ? new Date(stats.mlPredictions.lastMLUpdate).toISOString()
                : undefined;
            let status = 'healthy';
            if (!dataAvailable) {
                status = 'degraded'; // No data to work with yet
            }
            else if (!modelsTrained) {
                status = 'degraded'; // Data available but models not trained
            }
            else if (metrics.overallAccuracy < 0.5) {
                status = 'degraded'; // Models performing poorly
            }
            return {
                success: true,
                status,
                details: {
                    trackerInitialized,
                    dataAvailable,
                    modelsTrained,
                    lastUpdate,
                },
            };
        }
        catch (error) {
            return {
                success: false,
                status: 'unhealthy',
                details: {
                    trackerInitialized: false,
                    dataAvailable: false,
                    modelsTrained: false,
                },
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            };
        }
    }
    /**
     * Clear cached trackers (useful for testing or memory management)
     */
    clearCache() {
        this.trackers.clear();
    }
    /**
     * Get cache statistics
     */
    getCacheStats() {
        return {
            trackerCount: this.trackers.size,
            memoryUsage: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
        };
    }
}
/**
 * Singleton instance of the ML Budget API
 */
const mlBudgetAPI = new MLBudgetAPI();
/**
 * Express.js middleware-style request handlers
 */
export const mlBudgetHandlers = {
    /**
     * POST /api/budget/ml/forecast
     * Generate ML-based budget forecast
     */
    generateForecast: async (req, res, next) => {
        try {
            const { projectRoot, settings, forecastHours = 24 } = req.body;
            if (!projectRoot || !settings) {
                return res.status(400).json({
                    success: false,
                    error: 'Missing required parameters: projectRoot, settings',
                });
            }
            const result = await mlBudgetAPI.generateForecast({
                projectRoot,
                settings,
                forecastHours,
            });
            res.status(result.success ? 200 : 500).json(result);
        }
        catch (error) {
            const errorResponse = {
                success: false,
                error: error instanceof Error ? error.message : 'Internal server error',
            };
            res.status(500).json(errorResponse);
            if (next) {
                next(error);
            }
        }
    },
    /**
     * POST /api/budget/ml/optimize
     * Get optimization suggestions
     */
    getOptimizationSuggestions: async (req, res, next) => {
        try {
            const { projectRoot, settings } = req.body;
            if (!projectRoot || !settings) {
                return res.status(400).json({
                    success: false,
                    error: 'Missing required parameters: projectRoot, settings',
                });
            }
            const result = await mlBudgetAPI.getOptimizationSuggestions({
                projectRoot,
                settings,
            });
            res.status(result.success ? 200 : 500).json(result);
        }
        catch (error) {
            const errorResponse = {
                success: false,
                error: error instanceof Error ? error.message : 'Internal server error',
            };
            res.status(500).json(errorResponse);
            if (next) {
                next(error);
            }
        }
    },
    /**
     * POST /api/budget/ml/anomalies
     * Detect usage anomalies and patterns
     */
    detectAnomalies: async (req, res, next) => {
        try {
            const { projectRoot, settings } = req.body;
            if (!projectRoot || !settings) {
                return res.status(400).json({
                    success: false,
                    error: 'Missing required parameters: projectRoot, settings',
                });
            }
            const result = await mlBudgetAPI.detectAnomalies({
                projectRoot,
                settings,
            });
            res.status(result.success ? 200 : 500).json(result);
        }
        catch (error) {
            const errorResponse = {
                success: false,
                error: error instanceof Error ? error.message : 'Internal server error',
            };
            res.status(500).json(errorResponse);
            if (next) {
                next(error);
            }
        }
    },
    /**
     * POST /api/budget/ml/metrics
     * Get ML model performance metrics
     */
    getModelMetrics: async (req, res, next) => {
        try {
            const { projectRoot, settings } = req.body;
            if (!projectRoot || !settings) {
                return res.status(400).json({
                    success: false,
                    error: 'Missing required parameters: projectRoot, settings',
                });
            }
            const result = await mlBudgetAPI.getModelMetrics({
                projectRoot,
                settings,
            });
            res.status(result.success ? 200 : 500).json(result);
        }
        catch (error) {
            const errorResponse = {
                success: false,
                error: error instanceof Error ? error.message : 'Internal server error',
            };
            res.status(500).json(errorResponse);
            if (next) {
                next(error);
            }
        }
    },
    /**
     * POST /api/budget/ml/stats
     * Get enhanced usage statistics with ML predictions
     */
    getUsageStats: async (req, res, next) => {
        try {
            const { projectRoot, settings } = req.body;
            if (!projectRoot || !settings) {
                return res.status(400).json({
                    success: false,
                    error: 'Missing required parameters: projectRoot, settings',
                });
            }
            const result = await mlBudgetAPI.getUsageStats({
                projectRoot,
                settings,
            });
            res.status(result.success ? 200 : 500).json(result);
        }
        catch (error) {
            const errorResponse = {
                success: false,
                error: error instanceof Error ? error.message : 'Internal server error',
            };
            res.status(500).json(errorResponse);
            if (next) {
                next(error);
            }
        }
    },
    /**
     * POST /api/budget/ml/record
     * Record a new request
     */
    recordRequest: async (req, res, next) => {
        try {
            const { projectRoot, settings } = req.body;
            if (!projectRoot || !settings) {
                return res.status(400).json({
                    success: false,
                    error: 'Missing required parameters: projectRoot, settings',
                });
            }
            const result = await mlBudgetAPI.recordRequest(projectRoot, settings);
            res.status(result.success ? 200 : 500).json(result);
        }
        catch (error) {
            const errorResponse = {
                success: false,
                error: error instanceof Error ? error.message : 'Internal server error',
            };
            res.status(500).json(errorResponse);
            if (next) {
                next(error);
            }
        }
    },
    /**
     * GET /api/budget/ml/health
     * Health check for ML system
     */
    healthCheck: async (req, res, next) => {
        try {
            const { projectRoot, settings } = req.query;
            if (!projectRoot || !settings) {
                return res.status(400).json({
                    success: false,
                    error: 'Missing required query parameters: projectRoot, settings',
                });
            }
            const parsedSettings = typeof settings === 'string' ? JSON.parse(settings) : settings;
            const result = await mlBudgetAPI.healthCheck(projectRoot, parsedSettings);
            res.status(200).json(result);
        }
        catch (error) {
            const errorResponse = {
                success: false,
                status: 'unhealthy',
                details: {
                    trackerInitialized: false,
                    dataAvailable: false,
                    modelsTrained: false,
                },
                error: error instanceof Error ? error.message : 'Internal server error',
            };
            res.status(500).json(errorResponse);
            if (next) {
                next(error);
            }
        }
    },
};
/**
 * Export the singleton API instance and handlers
 */
export { mlBudgetAPI };
export default mlBudgetHandlers;
//# sourceMappingURL=ml-budget-api.js.map