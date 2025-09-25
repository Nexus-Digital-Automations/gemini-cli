/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type {
  CostDataPoint,
  StatisticalMeasures,
  TrendAnalysis,
  MovingAverageAnalysis,
  SeasonalAnalysis,
  VarianceDetection,
} from '../types.js';
/**
 * Core mathematical algorithms for cost projection and analysis
 * High-precision statistical analysis and trend detection
 */
export declare class MathematicalAlgorithms {
  private static readonly logger;
  /**
   * Calculate comprehensive statistical measures for cost data
   */
  static calculateStatistics(dataPoints: CostDataPoint[]): StatisticalMeasures;
  /**
   * Perform linear regression analysis for trend detection
   */
  static performTrendAnalysis(dataPoints: CostDataPoint[]): TrendAnalysis;
  /**
   * Calculate moving averages with configurable parameters
   */
  static calculateMovingAverage(
    dataPoints: CostDataPoint[],
    config: MovingAverageAnalysis['config'],
  ): MovingAverageAnalysis;
  /**
   * Analyze seasonal patterns in cost data
   */
  static analyzeSeasonality(dataPoints: CostDataPoint[]): SeasonalAnalysis;
  /**
   * Detect variances and anomalies using statistical methods
   */
  static detectVariances(
    dataPoints: CostDataPoint[],
    algorithm?: VarianceDetection['algorithm'],
  ): VarianceDetection;
  private static calculateSlope;
  private static analyzeDailyPattern;
  private static analyzeWeeklyPattern;
  private static analyzeMonthlyPattern;
  private static removeSeasonality;
  private static calculateSeasonalAdjustment;
  private static detectVariancesZScore;
  private static detectVariancesIQR;
  private static detectVariancesMovingAverageDeviation;
  private static detectVariancesIsolationForest;
}
