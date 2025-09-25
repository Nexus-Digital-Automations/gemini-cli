/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type {
  BudgetSettings,
  ForecastPoint,
  MLBudgetRecommendation,
  MLRiskAssessment,
  PredictionConfidence,
} from '../types.js';
import type {
  MLEnhancedBudgetTracker} from '../ml-enhanced-tracker.js';
import {
  createMLEnhancedBudgetTracker,
} from '../ml-enhanced-tracker.js';

/**
 * API request interfaces for ML budget endpoints
 */
export interface ForecastRequest {
  projectRoot: string;
  settings: BudgetSettings;
  forecastHours: number;
}

export interface OptimizationRequest {
  projectRoot: string;
  settings: BudgetSettings;
}

export interface AnomalyDetectionRequest {
  projectRoot: string;
  settings: BudgetSettings;
}

export interface ModelMetricsRequest {
  projectRoot: string;
  settings: BudgetSettings;
}

/**
 * API response interfaces for ML budget endpoints
 */
export interface ForecastResponse {
  success: boolean;
  data?: {
    forecast: ForecastPoint[];
    recommendations: MLBudgetRecommendation[];
    riskAssessment: MLRiskAssessment;
    confidence: PredictionConfidence;
    generatedAt: string;
    forecastHorizon: number;
  };
  error?: string;
}

export interface OptimizationResponse {
  success: boolean;
  data?: {
    immediate: MLBudgetRecommendation[];
    shortTerm: MLBudgetRecommendation[];
    longTerm: MLBudgetRecommendation[];
    potentialSavings: {
      percentage: number;
      estimatedRequests: number;
      confidence: PredictionConfidence;
    };
    generatedAt: string;
  };
  error?: string;
}

export interface AnomalyDetectionResponse {
  success: boolean;
  data?: {
    anomalies: Array<{
      timestamp: number;
      value: number;
      severity: 'low' | 'medium' | 'high';
      reason: string;
      impact: string;
      suggestedAction: string;
    }>;
    patterns: {
      seasonality: {
        detected: boolean;
        period?: number;
        strength?: number;
        description: string;
      };
      trends: {
        direction: 'increasing' | 'decreasing' | 'stable';
        confidence: number;
        description: string;
      };
      volatility: {
        level: 'low' | 'medium' | 'high';
        coefficient: number;
        description: string;
      };
    };
    generatedAt: string;
  };
  error?: string;
}

export interface ModelMetricsResponse {
  success: boolean;
  data?: {
    models: Array<{
      name: string;
      accuracy: number;
      lastTraining: string;
      trainingDataPoints: number;
      performance: 'excellent' | 'good' | 'fair' | 'poor';
    }>;
    overallAccuracy: number;
    dataQuality: {
      completeness: number;
      consistency: number;
      recency: number;
      volume: number;
    };
    recommendations: string[];
    generatedAt: string;
  };
  error?: string;
}

export interface UsageStatsResponse {
  success: boolean;
  data?: {
    current: {
      requestCount: number;
      dailyLimit: number;
      remainingRequests: number;
      usagePercentage: number;
      timeUntilReset: string;
    };
    mlPredictions?: {
      dailyForecast: ForecastPoint[];
      weeklyForecast: ForecastPoint[];
      recommendations: MLBudgetRecommendation[];
      riskAssessment: MLRiskAssessment;
      lastMLUpdate: number;
      modelAccuracy: number;
      trendAnalysis?: {
        direction: 'increasing' | 'decreasing' | 'stable';
        confidence: number;
        seasonalityDetected: boolean;
      };
    };
    generatedAt: string;
  };
  error?: string;
}

/**
 * ML Budget API class providing endpoints for cost projection and forecasting
 */
export class MLBudgetAPI {
  private trackers: Map<string, MLEnhancedBudgetTracker> = new Map();

  /**
   * Get or create ML-enhanced budget tracker for a project
   */
  private getTracker(
    projectRoot: string,
    settings: BudgetSettings,
  ): MLEnhancedBudgetTracker {
    const key = `${projectRoot}:${JSON.stringify(settings)}`;

    if (!this.trackers.has(key)) {
      const tracker = createMLEnhancedBudgetTracker(projectRoot, settings);
      this.trackers.set(key, tracker);
    }

    return this.trackers.get(key)!;
  }

  /**
   * Generate budget forecast using ML models
   */
  async generateForecast(request: ForecastRequest): Promise<ForecastResponse> {
    try {
      const tracker = this.getTracker(request.projectRoot, request.settings);
      const forecast = await tracker.generateBudgetForecast(
        request.forecastHours,
      );

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
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Get optimization suggestions categorized by time horizon
   */
  async getOptimizationSuggestions(
    request: OptimizationRequest,
  ): Promise<OptimizationResponse> {
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
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Detect usage anomalies and analyze patterns
   */
  async detectAnomalies(
    request: AnomalyDetectionRequest,
  ): Promise<AnomalyDetectionResponse> {
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
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Get ML model performance metrics and recommendations
   */
  async getModelMetrics(
    request: ModelMetricsRequest,
  ): Promise<ModelMetricsResponse> {
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
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Get enhanced usage statistics with ML predictions
   */
  async getUsageStats(
    request: OptimizationRequest,
  ): Promise<UsageStatsResponse> {
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
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Record a new request and trigger ML learning
   */
  async recordRequest(
    projectRoot: string,
    settings: BudgetSettings,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const tracker = this.getTracker(projectRoot, settings);
      await tracker.recordRequest();

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Health check endpoint for ML system
   */
  async healthCheck(
    projectRoot: string,
    settings: BudgetSettings,
  ): Promise<{
    success: boolean;
    status: 'healthy' | 'degraded' | 'unhealthy';
    details: {
      trackerInitialized: boolean;
      dataAvailable: boolean;
      modelsTrained: boolean;
      lastUpdate?: string;
    };
    error?: string;
  }> {
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

      let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

      if (!dataAvailable) {
        status = 'degraded'; // No data to work with yet
      } else if (!modelsTrained) {
        status = 'degraded'; // Data available but models not trained
      } else if (metrics.overallAccuracy < 0.5) {
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
    } catch (error) {
      return {
        success: false,
        status: 'unhealthy',
        details: {
          trackerInitialized: false,
          dataAvailable: false,
          modelsTrained: false,
        },
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Clear cached trackers (useful for testing or memory management)
   */
  clearCache(): void {
    this.trackers.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    trackerCount: number;
    memoryUsage: string;
  } {
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
  generateForecast: async (req: any, res: any, next?: any) => {
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
    } catch (error) {
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
  getOptimizationSuggestions: async (req: any, res: any, next?: any) => {
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
    } catch (error) {
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
  detectAnomalies: async (req: any, res: any, next?: any) => {
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
    } catch (error) {
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
  getModelMetrics: async (req: any, res: any, next?: any) => {
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
    } catch (error) {
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
  getUsageStats: async (req: any, res: any, next?: any) => {
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
    } catch (error) {
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
  recordRequest: async (req: any, res: any, next?: any) => {
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
    } catch (error) {
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
  healthCheck: async (req: any, res: any, next?: any) => {
    try {
      const { projectRoot, settings } = req.query;

      if (!projectRoot || !settings) {
        return res.status(400).json({
          success: false,
          error: 'Missing required query parameters: projectRoot, settings',
        });
      }

      const parsedSettings =
        typeof settings === 'string' ? JSON.parse(settings) : settings;
      const result = await mlBudgetAPI.healthCheck(projectRoot, parsedSettings);

      res.status(200).json(result);
    } catch (error) {
      const errorResponse = {
        success: false,
        status: 'unhealthy' as const,
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
