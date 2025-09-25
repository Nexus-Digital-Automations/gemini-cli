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
export declare class MLBudgetAPI {
  private trackers;
  /**
   * Get or create ML-enhanced budget tracker for a project
   */
  private getTracker;
  /**
   * Generate budget forecast using ML models
   */
  generateForecast(request: ForecastRequest): Promise<ForecastResponse>;
  /**
   * Get optimization suggestions categorized by time horizon
   */
  getOptimizationSuggestions(
    request: OptimizationRequest,
  ): Promise<OptimizationResponse>;
  /**
   * Detect usage anomalies and analyze patterns
   */
  detectAnomalies(
    request: AnomalyDetectionRequest,
  ): Promise<AnomalyDetectionResponse>;
  /**
   * Get ML model performance metrics and recommendations
   */
  getModelMetrics(request: ModelMetricsRequest): Promise<ModelMetricsResponse>;
  /**
   * Get enhanced usage statistics with ML predictions
   */
  getUsageStats(request: OptimizationRequest): Promise<UsageStatsResponse>;
  /**
   * Record a new request and trigger ML learning
   */
  recordRequest(
    projectRoot: string,
    settings: BudgetSettings,
  ): Promise<{
    success: boolean;
    error?: string;
  }>;
  /**
   * Health check endpoint for ML system
   */
  healthCheck(
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
  }>;
  /**
   * Clear cached trackers (useful for testing or memory management)
   */
  clearCache(): void;
  /**
   * Get cache statistics
   */
  getCacheStats(): {
    trackerCount: number;
    memoryUsage: string;
  };
}
/**
 * Singleton instance of the ML Budget API
 */
declare const mlBudgetAPI: MLBudgetAPI;
/**
 * Express.js middleware-style request handlers
 */
export declare const mlBudgetHandlers: {
  /**
   * POST /api/budget/ml/forecast
   * Generate ML-based budget forecast
   */
  generateForecast: (req: any, res: any, next?: any) => Promise<any>;
  /**
   * POST /api/budget/ml/optimize
   * Get optimization suggestions
   */
  getOptimizationSuggestions: (req: any, res: any, next?: any) => Promise<any>;
  /**
   * POST /api/budget/ml/anomalies
   * Detect usage anomalies and patterns
   */
  detectAnomalies: (req: any, res: any, next?: any) => Promise<any>;
  /**
   * POST /api/budget/ml/metrics
   * Get ML model performance metrics
   */
  getModelMetrics: (req: any, res: any, next?: any) => Promise<any>;
  /**
   * POST /api/budget/ml/stats
   * Get enhanced usage statistics with ML predictions
   */
  getUsageStats: (req: any, res: any, next?: any) => Promise<any>;
  /**
   * POST /api/budget/ml/record
   * Record a new request
   */
  recordRequest: (req: any, res: any, next?: any) => Promise<any>;
  /**
   * GET /api/budget/ml/health
   * Health check for ML system
   */
  healthCheck: (req: any, res: any, next?: any) => Promise<any>;
};
/**
 * Export the singleton API instance and handlers
 */
export { mlBudgetAPI };
export default mlBudgetHandlers;
