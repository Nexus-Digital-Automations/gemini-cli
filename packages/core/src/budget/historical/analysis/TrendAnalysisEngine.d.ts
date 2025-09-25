/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { BudgetUsageTimeSeriesPoint } from '../storage/types.js';
import type {
  TrendAnalysisEngine,
  AnalysisConfig,
  TrendAnalysis,
  SeasonalPattern,
  AnomalyDetection,
  EfficiencyAnalysis,
  UsagePatterns,
  InsightsReport,
  AnalysisMetric,
} from './types.js';
/**
 * Advanced trend analysis engine with machine learning capabilities
 * Implements comprehensive statistical analysis for budget usage patterns
 */
export declare class TrendAnalysisEngineImpl implements TrendAnalysisEngine {
  private readonly logger;
  private readonly config;
  /**
   * Create a new trend analysis engine
   */
  constructor(config?: Partial<AnalysisConfig>);
  /**
   * Create default analysis configuration
   */
  private createDefaultConfig;
  /**
   * Analyze trends for specific metrics
   */
  analyzeTrends(
    data: BudgetUsageTimeSeriesPoint[],
    config: AnalysisConfig,
  ): Promise<TrendAnalysis[]>;
  /**
   * Analyze trend for a specific metric
   */
  private analyzeMetricTrend;
  /**
   * Extract metric values from data points
   */
  private extractMetricValues;
  /**
   * Calculate linear regression for trend analysis
   */
  private calculateLinearRegression;
  /**
   * Calculate p-value using t-distribution approximation
   */
  private calculatePValue;
  /**
   * Normal cumulative distribution function approximation
   */
  private normalCDF;
  /**
   * Error function approximation
   */
  private erf;
  /**
   * Determine trend direction based on slope and correlation
   */
  private determineTrendDirection;
  /**
   * Determine confidence level based on correlation and p-value
   */
  private determineConfidence;
  /**
   * Get next timestamp based on period
   */
  private getNextTimestamp;
  /**
   * Detect seasonal patterns in data
   */
  detectSeasonality(
    data: BudgetUsageTimeSeriesPoint[],
    metric: AnalysisMetric,
  ): Promise<SeasonalPattern[]>;
  /**
   * Detect specific seasonal pattern
   */
  private detectSeasonalPattern;
  /**
   * Group data by seasonal period
   */
  private groupBySeasonalPeriod;
  /**
   * Calculate seasonal components
   */
  private calculateSeasonalComponents;
  /**
   * Calculate overall mean across all groups
   */
  private calculateOverallMean;
  /**
   * Calculate seasonal strength
   */
  private calculateSeasonalStrength;
  /**
   * Find peaks and troughs in seasonal data
   */
  private findPeaksAndTroughs;
  /**
   * Predict next peak occurrence
   */
  private predictNextPeak;
  /**
   * Detect anomalies in usage patterns
   */
  detectAnomalies(
    data: BudgetUsageTimeSeriesPoint[],
    sensitivity: 'low' | 'medium' | 'high',
  ): Promise<AnomalyDetection>;
  /**
   * Calculate anomaly severity
   */
  private calculateAnomalySeverity;
  /**
   * Determine anomaly type
   */
  private determineAnomalyType;
  /**
   * Generate human-readable anomaly description
   */
  private generateAnomalyDescription;
  /**
   * Analyze cost efficiency patterns
   */
  analyzeEfficiency(
    data: BudgetUsageTimeSeriesPoint[],
  ): Promise<EfficiencyAnalysis>;
  /**
   * Analyze waste in budget usage
   */
  private analyzeWaste;
  /**
   * Generate optimization recommendations
   */
  private generateOptimizationRecommendations;
  /**
   * Calculate variance for array of numbers
   */
  private calculateVariance;
  /**
   * Extract usage patterns and insights
   */
  extractPatterns(data: BudgetUsageTimeSeriesPoint[]): Promise<UsagePatterns>;
  /**
   * Analyze peak usage patterns
   */
  private analyzePeakPatterns;
  /**
   * Analyze usage distribution
   */
  private analyzeUsageDistribution;
  /**
   * Analyze session patterns
   */
  private analyzeSessionPatterns;
  /**
   * Analyze feature usage correlations
   */
  private analyzeFeatureCorrelations;
  /**
   * Generate comprehensive insights report
   */
  generateInsights(
    data: BudgetUsageTimeSeriesPoint[],
    config: AnalysisConfig,
  ): Promise<InsightsReport>;
  /**
   * Generate key insights from analysis results
   */
  private generateKeyInsights;
  /**
   * Generate actionable recommendations
   */
  private generateRecommendations;
  /**
   * Assess data quality
   */
  private assessDataQuality;
  /**
   * Calculate forecast accuracy (simplified)
   */
  private calculateForecastAccuracy;
  /**
   * Forecast future values
   */
  forecast(
    data: BudgetUsageTimeSeriesPoint[],
    metric: AnalysisMetric,
    horizon: number,
  ): Promise<
    Array<{
      timestamp: number;
      predictedValue: number;
      confidence: number;
      range: {
        min: number;
        max: number;
      };
    }>
  >;
}
/**
 * Factory function to create a trend analysis engine
 */
export declare function createTrendAnalysisEngine(
  config?: Partial<AnalysisConfig>,
): TrendAnalysisEngine;
