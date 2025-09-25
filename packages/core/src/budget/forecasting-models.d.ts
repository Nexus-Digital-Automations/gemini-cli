/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type {
  HistoricalBudgetRecord,
  BudgetForecast,
} from './historical-analysis.js';
/**
 * Time series forecasting model configuration
 */
export interface ForecastingModelConfig {
  modelType: 'linear' | 'exponential' | 'seasonal' | 'arima' | 'ensemble';
  seasonalityType: 'additive' | 'multiplicative' | 'auto';
  seasonalPeriods: number[];
  confidenceLevel: number;
  forecastHorizon: number;
  trendDamping?: number;
  seasonalDamping?: number;
  smoothingParameters?: {
    alpha?: number;
    beta?: number;
    gamma?: number;
  };
}
/**
 * Scenario planning configuration
 */
export interface ScenarioConfig {
  name: string;
  description: string;
  adjustments: {
    usageMultiplier: number;
    seasonalityBoost?: number;
    trendAcceleration?: number;
    volatilityIncrease?: number;
    externalFactors?: {
      marketGrowth?: number;
      teamSizeChange?: number;
      productLaunch?: boolean;
      holidayEffect?: boolean;
    };
  };
}
/**
 * Monte Carlo simulation parameters
 */
export interface MonteCarloConfig {
  iterations: number;
  confidenceIntervals: number[];
  varianceScaling: number;
  includeExtremeEvents: boolean;
  extremeEventProbability: number;
  extremeEventMultiplier: number;
}
/**
 * Model validation metrics
 */
export interface ModelValidationMetrics {
  modelType: string;
  accuracy: number;
  mse: number;
  mae: number;
  mape: number;
  rmse: number;
  r2Score: number;
  aic: number;
  bic: number;
  crossValidationScore: number;
  residualAnalysis: {
    autocorrelation: number;
    normality: number;
    heteroscedasticity: number;
  };
}
/**
 * Advanced ensemble forecast result
 */
export interface EnsembleForecast extends BudgetForecast {
  modelContributions: {
    [modelType: string]: {
      weight: number;
      forecast: number;
      confidence: number;
    };
  };
  monteCarloResults: {
    mean: number;
    median: number;
    standardDeviation: number;
    percentiles: {
      [percentile: string]: number;
    };
    confidenceIntervals: {
      [confidence: string]: {
        lower: number;
        upper: number;
      };
    };
  };
  scenarioResults: {
    [scenarioName: string]: {
      forecast: number;
      probability: number;
      impact: 'low' | 'medium' | 'high' | 'extreme';
    };
  };
  modelValidation: ModelValidationMetrics;
}
/**
 * Advanced budget forecasting engine with multiple models and scenario planning
 */
export declare class BudgetForecastingEngine {
  private readonly config;
  constructor(config?: Partial<ForecastingModelConfig>);
  /**
   * Generate advanced ensemble forecast with multiple models
   */
  generateEnsembleForecast(
    historicalRecords: HistoricalBudgetRecord[],
    targetDate: string,
    scenarios?: ScenarioConfig[],
    monteCarloConfig?: Partial<MonteCarloConfig>,
  ): Promise<EnsembleForecast>;
  /**
   * Generate forecasts from multiple models
   */
  private generateMultiModelForecasts;
  /**
   * Linear trend forecasting model
   */
  private linearTrendForecast;
  /**
   * Exponential smoothing forecasting model (Holt-Winters)
   */
  private exponentialSmoothingForecast;
  /**
   * Seasonal decomposition forecasting model
   */
  private seasonalDecompositionForecast;
  /**
   * Simplified ARIMA-like forecasting model
   */
  private arimaLikeForecast;
  /**
   * Seasonal naive forecasting model (baseline)
   */
  private seasonalNaiveForecast;
  /**
   * Combine forecasts from multiple models using weighted ensemble
   */
  private combineModelForecasts;
  /**
   * Run Monte Carlo simulation for uncertainty quantification
   */
  private runMonteCarloSimulation;
  /**
   * Generate scenario-based forecasts
   */
  private generateScenarioForecasts;
  /**
   * Validate model performance using cross-validation
   */
  private validateModelPerformance;
  private decomposeTimeSeries;
  private extrapolateTrend;
  private extrapolateSeasonal;
  private generateRandomNormal;
  private combineModelForecastsForValidation;
  private calculateAutocorrelation;
  private testNormality;
  private testHeteroscedasticity;
  private calculateVariance;
  private getPlaceholderValidationMetrics;
  private calculateAdvancedRiskAssessment;
  private generateAdvancedMitigationStrategies;
  private convertMonteCarloToScenarios;
  private extractModelContributions;
  private estimateModelConfidence;
}
