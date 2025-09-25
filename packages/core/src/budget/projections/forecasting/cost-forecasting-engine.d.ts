/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type {
  CostDataPoint,
  CostProjection,
  BurnRateAnalysis,
} from '../types.js';
/**
 * Advanced cost forecasting engine with multiple prediction models
 * Provides sophisticated cost projections with confidence intervals and accuracy metrics
 */
export declare class CostForecastingEngine {
  private static readonly logger;
  /**
   * Generate comprehensive cost projections using ensemble methods
   */
  static generateProjections(
    historicalData: CostDataPoint[],
    projectionDays?: number,
    confidenceLevel?: number,
  ): Promise<CostProjection>;
  /**
   * Generate burn rate analysis for budget runway calculations
   */
  static calculateBurnRateAnalysis(
    dataPoints: CostDataPoint[],
    currentBudget?: number,
  ): BurnRateAnalysis;
  private static generateLinearProjection;
  private static generateExponentialProjection;
  private static generateSeasonalProjection;
  private static createEnsembleProjection;
  private static calculateDataQualityScore;
  private static calculateExpectedDataPoints;
  private static calculateConsistencyScore;
  private static calculateAccuracyMetrics;
  private static calculateDailyBurnRates;
  private static calculateProjectedBurnRate;
  private static calculateCategoryBurnRates;
  private static calculateSimpleTrend;
  private static calculateSeasonalMultiplier;
}
