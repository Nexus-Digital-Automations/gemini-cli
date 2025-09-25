/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Comprehensive trend analysis engine implementation
 * Provides advanced statistical analysis and insights for budget usage data
 *
 * @author Historical Data Storage and Analysis Agent
 * @version 1.0.0
 */

import { createLogger } from '../../../utils/logger.js';
import type { Logger } from '../../../types/common.js';
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
  TrendDirection,
  ConfidenceLevel,
  TrendPeriod,
} from './types.js';

/**
 * Advanced trend analysis engine with machine learning capabilities
 * Implements comprehensive statistical analysis for budget usage patterns
 */
export class TrendAnalysisEngineImpl implements TrendAnalysisEngine {
  private readonly logger: Logger;
  private readonly config: AnalysisConfig;

  /**
   * Create a new trend analysis engine
   */
  constructor(config: Partial<AnalysisConfig> = {}) {
    this.logger = createLogger('TrendAnalysisEngine');
    this.config = this.createDefaultConfig(config);

    this.logger.info('TrendAnalysisEngine initialized', {
      metrics: this.config.metrics,
      period: this.config.period,
      anomalySensitivity: this.config.anomalySensitivity,
    });
  }

  /**
   * Create default analysis configuration
   */
  private createDefaultConfig(overrides: Partial<AnalysisConfig>): AnalysisConfig {
    return {
      metrics: ['cost', 'usage_percentage', 'request_count', 'efficiency'],
      period: 'daily',
      anomalySensitivity: 'medium',
      minDataPoints: 10,
      confidenceThreshold: 0.8,
      includeSeasonality: true,
      includeForecast: true,
      forecastHorizon: 30,
      advancedAnalysis: true,
      ...overrides,
    };
  }

  /**
   * Analyze trends for specific metrics
   */
  async analyzeTrends(
    data: BudgetUsageTimeSeriesPoint[],
    config: AnalysisConfig
  ): Promise<TrendAnalysis[]> {
    const startTime = Date.now();
    this.logger.info('Starting trend analysis', {
      dataPoints: data.length,
      metrics: config.metrics,
      period: config.period,
    });

    try {
      if (data.length < config.minDataPoints) {
        throw new Error(`Insufficient data points: ${data.length} < ${config.minDataPoints}`);
      }

      // Sort data by timestamp
      const sortedData = [...data].sort((a, b) => a.timestamp - b.timestamp);
      const analyses: TrendAnalysis[] = [];

      for (const metric of config.metrics) {
        const analysis = await this.analyzeMetricTrend(sortedData, metric, config);
        analyses.push(analysis);
      }

      this.logger.info('Trend analysis completed', {
        duration: Date.now() - startTime,
        analysisCount: analyses.length,
      });

      return analyses;
    } catch (error) {
      this.logger.error('Trend analysis failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Analyze trend for a specific metric
   */
  private async analyzeMetricTrend(
    data: BudgetUsageTimeSeriesPoint[],
    metric: AnalysisMetric,
    config: AnalysisConfig
  ): Promise<TrendAnalysis> {
    const values = this.extractMetricValues(data, metric);
    const timestamps = data.map(point => point.timestamp);

    // Perform linear regression
    const regression = this.calculateLinearRegression(timestamps, values);

    // Calculate trend statistics
    const direction = this.determineTrendDirection(regression.slope, regression.correlation);
    const strength = Math.abs(regression.correlation);
    const confidence = this.determineConfidence(regression.correlation, regression.pValue);

    // Calculate variance and standard deviation
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const standardDeviation = Math.sqrt(variance);

    // Predict next value
    const lastTimestamp = timestamps[timestamps.length - 1];
    const nextTimestamp = this.getNextTimestamp(lastTimestamp, config.period);
    const predictedValue = regression.slope * nextTimestamp + regression.intercept;

    return {
      metric,
      period: config.period,
      startTime: timestamps[0],
      endTime: timestamps[timestamps.length - 1],
      direction,
      strength,
      confidence,
      changeRate: regression.slope,
      currentValue: values[values.length - 1],
      predictedValue,
      correlation: regression.correlation,
      pValue: regression.pValue,
      dataPointCount: values.length,
      variance,
      standardDeviation,
    };
  }

  /**
   * Extract metric values from data points
   */
  private extractMetricValues(data: BudgetUsageTimeSeriesPoint[], metric: AnalysisMetric): number[] {
    return data.map(point => {
      switch (metric) {
        case 'cost':
          return point.totalCost;
        case 'usage_percentage':
          return point.usagePercentage;
        case 'request_count':
          return point.requestCount;
        case 'efficiency':
          return point.requestCount > 0 ? point.totalCost / point.requestCount : 0;
        case 'variance':
          return point.usagePercentage; // Use usage percentage for variance analysis
        case 'growth_rate':
          return point.totalCost; // Use cost for growth rate analysis
        default:
          return point.totalCost;
      }
    });
  }

  /**
   * Calculate linear regression for trend analysis
   */
  private calculateLinearRegression(x: number[], y: number[]): {
    slope: number;
    intercept: number;
    correlation: number;
    pValue: number;
  } {
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumYY = y.reduce((sum, yi) => sum + yi * yi, 0);

    // Calculate slope and intercept
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Calculate correlation coefficient
    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));
    const correlation = denominator === 0 ? 0 : numerator / denominator;

    // Calculate p-value (simplified t-test approximation)
    const tStat = correlation * Math.sqrt((n - 2) / (1 - correlation * correlation));
    const pValue = this.calculatePValue(Math.abs(tStat), n - 2);

    return { slope, intercept, correlation, pValue };
  }

  /**
   * Calculate p-value using t-distribution approximation
   */
  private calculatePValue(tStat: number, degreesOfFreedom: number): number {
    // Simplified p-value calculation using normal approximation for large df
    if (degreesOfFreedom > 30) {
      return 2 * (1 - this.normalCDF(Math.abs(tStat)));
    }

    // For smaller df, use a rough approximation
    const critical = 2.0; // Rough approximation for α = 0.05
    return tStat > critical ? 0.01 : 0.1;
  }

  /**
   * Normal cumulative distribution function approximation
   */
  private normalCDF(x: number): number {
    return 0.5 * (1 + this.erf(x / Math.sqrt(2)));
  }

  /**
   * Error function approximation
   */
  private erf(x: number): number {
    // Abramowitz and Stegun approximation
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;

    const sign = x >= 0 ? 1 : -1;
    x = Math.abs(x);

    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

    return sign * y;
  }

  /**
   * Determine trend direction based on slope and correlation
   */
  private determineTrendDirection(slope: number, correlation: number): TrendDirection {
    const absCorrelation = Math.abs(correlation);

    if (absCorrelation < 0.3) {
      return 'stable';
    }

    if (absCorrelation > 0.8 && Math.abs(slope) > 0.1) {
      return slope > 0 ? 'increasing' : 'decreasing';
    }

    if (absCorrelation < 0.6) {
      return 'volatile';
    }

    return slope > 0 ? 'increasing' : 'decreasing';
  }

  /**
   * Determine confidence level based on correlation and p-value
   */
  private determineConfidence(correlation: number, pValue: number): ConfidenceLevel {
    const absCorrelation = Math.abs(correlation);

    if (absCorrelation > 0.8 && pValue < 0.01) {
      return 'high';
    }

    if (absCorrelation > 0.5 && pValue < 0.05) {
      return 'medium';
    }

    return 'low';
  }

  /**
   * Get next timestamp based on period
   */
  private getNextTimestamp(lastTimestamp: number, period: TrendPeriod): number {
    const date = new Date(lastTimestamp);

    switch (period) {
      case 'hourly':
        date.setHours(date.getHours() + 1);
        break;
      case 'daily':
        date.setDate(date.getDate() + 1);
        break;
      case 'weekly':
        date.setDate(date.getDate() + 7);
        break;
      case 'monthly':
        date.setMonth(date.getMonth() + 1);
        break;
      case 'quarterly':
        date.setMonth(date.getMonth() + 3);
        break;
      case 'yearly':
        date.setFullYear(date.getFullYear() + 1);
        break;
      default:
        date.setDate(date.getDate() + 1);
    }

    return date.getTime();
  }

  /**
   * Detect seasonal patterns in data
   */
  async detectSeasonality(
    data: BudgetUsageTimeSeriesPoint[],
    metric: AnalysisMetric
  ): Promise<SeasonalPattern[]> {
    this.logger.info('Starting seasonal pattern detection', {
      dataPoints: data.length,
      metric,
    });

    try {
      const values = this.extractMetricValues(data, metric);
      const patterns: SeasonalPattern[] = [];

      // Analyze different seasonal periods
      const seasonalPeriods = ['daily', 'weekly', 'monthly'] as const;

      for (const patternType of seasonalPeriods) {
        const pattern = await this.detectSeasonalPattern(data, values, patternType);
        if (pattern) {
          patterns.push(pattern);
        }
      }

      this.logger.info('Seasonal pattern detection completed', {
        patternsFound: patterns.length,
      });

      return patterns;
    } catch (error) {
      this.logger.error('Seasonal pattern detection failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Detect specific seasonal pattern
   */
  private async detectSeasonalPattern(
    data: BudgetUsageTimeSeriesPoint[],
    values: number[],
    patternType: 'daily' | 'weekly' | 'monthly'
  ): Promise<SeasonalPattern | null> {
    // Group data by seasonal period
    const groups = this.groupBySeasonalPeriod(data, values, patternType);

    if (groups.size < 2) {
      return null; // Need at least 2 periods for pattern detection
    }

    // Calculate seasonal components
    const seasonalComponents = this.calculateSeasonalComponents(groups);
    const seasonalStrength = this.calculateSeasonalStrength(seasonalComponents);

    if (seasonalStrength < 0.3) {
      return null; // Pattern not strong enough
    }

    // Find peaks and troughs
    const { peakPeriods, troughPeriods } = this.findPeaksAndTroughs(groups);

    // Determine confidence
    const confidence = seasonalStrength > 0.7 ? 'high' :
                     seasonalStrength > 0.5 ? 'medium' : 'low';

    // Predict next peak
    const nextPeak = this.predictNextPeak(data, peakPeriods, patternType);

    return {
      patternType,
      seasonalComponents,
      seasonalStrength,
      peakPeriods,
      troughPeriods,
      confidence,
      nextPeak,
    };
  }

  /**
   * Group data by seasonal period
   */
  private groupBySeasonalPeriod(
    data: BudgetUsageTimeSeriesPoint[],
    values: number[],
    patternType: 'daily' | 'weekly' | 'monthly'
  ): Map<string, number[]> {
    const groups = new Map<string, number[]>();

    data.forEach((point, index) => {
      const date = new Date(point.timestamp);
      let key: string;

      switch (patternType) {
        case 'daily':
          key = date.getHours().toString();
          break;
        case 'weekly':
          key = date.getDay().toString();
          break;
        case 'monthly':
          key = Math.floor(date.getDate() / 7).toString();
          break;
        default:
          key = '0';
      }

      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(values[index]);
    });

    return groups;
  }

  /**
   * Calculate seasonal components
   */
  private calculateSeasonalComponents(groups: Map<string, number[]>): number[] {
    const components: number[] = [];
    const overallMean = this.calculateOverallMean(groups);

    for (const [period, values] of groups.entries()) {
      const periodMean = values.reduce((sum, val) => sum + val, 0) / values.length;
      components.push(periodMean - overallMean);
    }

    return components;
  }

  /**
   * Calculate overall mean across all groups
   */
  private calculateOverallMean(groups: Map<string, number[]>): number {
    let totalSum = 0;
    let totalCount = 0;

    for (const values of groups.values()) {
      totalSum += values.reduce((sum, val) => sum + val, 0);
      totalCount += values.length;
    }

    return totalCount > 0 ? totalSum / totalCount : 0;
  }

  /**
   * Calculate seasonal strength
   */
  private calculateSeasonalStrength(components: number[]): number {
    const mean = components.reduce((sum, val) => sum + val, 0) / components.length;
    const variance = components.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / components.length;
    const maxValue = Math.max(...components.map(Math.abs));

    return maxValue > 0 ? Math.sqrt(variance) / maxValue : 0;
  }

  /**
   * Find peaks and troughs in seasonal data
   */
  private findPeaksAndTroughs(groups: Map<string, number[]>): {
    peakPeriods: Array<{ period: string; value: number; percentile: number }>;
    troughPeriods: Array<{ period: string; value: number; percentile: number }>;
  } {
    const periodMeans = Array.from(groups.entries()).map(([period, values]) => ({
      period,
      value: values.reduce((sum, val) => sum + val, 0) / values.length,
    }));

    const sortedByValue = [...periodMeans].sort((a, b) => b.value - a.value);
    const totalPeriods = sortedByValue.length;

    const peakPeriods = sortedByValue
      .slice(0, Math.max(1, Math.floor(totalPeriods * 0.2)))
      .map((item, index) => ({
        period: item.period,
        value: item.value,
        percentile: ((totalPeriods - index) / totalPeriods) * 100,
      }));

    const troughPeriods = sortedByValue
      .slice(-Math.max(1, Math.floor(totalPeriods * 0.2)))
      .map((item, index) => ({
        period: item.period,
        value: item.value,
        percentile: ((index + 1) / totalPeriods) * 100,
      }));

    return { peakPeriods, troughPeriods };
  }

  /**
   * Predict next peak occurrence
   */
  private predictNextPeak(
    data: BudgetUsageTimeSeriesPoint[],
    peakPeriods: Array<{ period: string; value: number; percentile: number }>,
    patternType: 'daily' | 'weekly' | 'monthly'
  ): { timestamp: number; predictedValue: number; confidence: number } | undefined {
    if (peakPeriods.length === 0) return undefined;

    const now = Date.now();
    const currentDate = new Date(now);
    const topPeak = peakPeriods[0];

    let nextPeakTime: Date;

    switch (patternType) {
      case 'daily':
        nextPeakTime = new Date(currentDate);
        nextPeakTime.setHours(parseInt(topPeak.period), 0, 0, 0);
        if (nextPeakTime.getTime() <= now) {
          nextPeakTime.setDate(nextPeakTime.getDate() + 1);
        }
        break;
      case 'weekly':
        nextPeakTime = new Date(currentDate);
        const targetDay = parseInt(topPeak.period);
        const currentDay = currentDate.getDay();
        const daysToAdd = targetDay >= currentDay ? targetDay - currentDay : 7 - (currentDay - targetDay);
        nextPeakTime.setDate(currentDate.getDate() + daysToAdd);
        break;
      case 'monthly':
        nextPeakTime = new Date(currentDate);
        const targetWeek = parseInt(topPeak.period);
        nextPeakTime.setDate((targetWeek * 7) + 1);
        if (nextPeakTime.getTime() <= now) {
          nextPeakTime.setMonth(nextPeakTime.getMonth() + 1);
        }
        break;
      default:
        return undefined;
    }

    return {
      timestamp: nextPeakTime.getTime(),
      predictedValue: topPeak.value,
      confidence: topPeak.percentile / 100,
    };
  }

  /**
   * Detect anomalies in usage patterns
   */
  async detectAnomalies(
    data: BudgetUsageTimeSeriesPoint[],
    sensitivity: 'low' | 'medium' | 'high'
  ): Promise<AnomalyDetection> {
    this.logger.info('Starting anomaly detection', {
      dataPoints: data.length,
      sensitivity,
    });

    try {
      // Extract cost values for anomaly detection
      const values = data.map(point => point.totalCost);

      // Calculate statistical thresholds
      const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
      const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
      const stdDev = Math.sqrt(variance);

      // Set threshold based on sensitivity
      const thresholdMultiplier = sensitivity === 'high' ? 2 : sensitivity === 'medium' ? 2.5 : 3;
      const threshold = thresholdMultiplier * stdDev;

      // Detect anomalies
      const anomalies = [];

      for (let i = 0; i < data.length; i++) {
        const point = data[i];
        const value = values[i];
        const deviation = Math.abs(value - mean);

        if (deviation > threshold) {
          const expectedValue = mean;
          const severity = this.calculateAnomalySeverity(deviation, threshold);
          const type = this.determineAnomalyType(value, mean, i > 0 ? values[i - 1] : mean);

          anomalies.push({
            timestamp: point.timestamp,
            value,
            expectedValue,
            severity,
            type,
            description: this.generateAnomalyDescription(type, severity, value, expectedValue),
            confidence: Math.min(0.99, deviation / threshold / 2),
          });
        }
      }

      const result: AnomalyDetection = {
        anomalies,
        threshold,
        anomalyCount: anomalies.length,
        sensitivity,
        analysisWindow: {
          startTime: data[0]?.timestamp || 0,
          endTime: data[data.length - 1]?.timestamp || 0,
        },
      };

      this.logger.info('Anomaly detection completed', {
        anomaliesFound: anomalies.length,
        threshold,
      });

      return result;
    } catch (error) {
      this.logger.error('Anomaly detection failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Calculate anomaly severity
   */
  private calculateAnomalySeverity(
    deviation: number,
    threshold: number
  ): 'low' | 'medium' | 'high' | 'critical' {
    const ratio = deviation / threshold;

    if (ratio >= 3) return 'critical';
    if (ratio >= 2) return 'high';
    if (ratio >= 1.5) return 'medium';
    return 'low';
  }

  /**
   * Determine anomaly type
   */
  private determineAnomalyType(
    value: number,
    mean: number,
    previousValue: number
  ): 'spike' | 'drop' | 'outlier' | 'drift' {
    const isAboveMean = value > mean;
    const changeFromPrevious = Math.abs(value - previousValue);
    const meanDeviation = Math.abs(value - mean);

    if (changeFromPrevious > meanDeviation * 1.5) {
      return isAboveMean ? 'spike' : 'drop';
    }

    if (meanDeviation > mean * 0.5) {
      return 'outlier';
    }

    return 'drift';
  }

  /**
   * Generate human-readable anomaly description
   */
  private generateAnomalyDescription(
    type: 'spike' | 'drop' | 'outlier' | 'drift',
    severity: 'low' | 'medium' | 'high' | 'critical',
    value: number,
    expectedValue: number
  ): string {
    const difference = Math.abs(value - expectedValue);
    const percentage = ((difference / expectedValue) * 100).toFixed(1);

    const severityText = severity === 'critical' ? 'Critical' :
                        severity === 'high' ? 'Significant' :
                        severity === 'medium' ? 'Moderate' : 'Minor';

    switch (type) {
      case 'spike':
        return `${severityText} cost spike detected: $${value.toFixed(2)} vs expected $${expectedValue.toFixed(2)} (+${percentage}%)`;
      case 'drop':
        return `${severityText} cost drop detected: $${value.toFixed(2)} vs expected $${expectedValue.toFixed(2)} (-${percentage}%)`;
      case 'outlier':
        return `${severityText} outlier detected: $${value.toFixed(2)} significantly differs from expected $${expectedValue.toFixed(2)}`;
      case 'drift':
        return `${severityText} drift pattern detected: gradual change to $${value.toFixed(2)} from expected $${expectedValue.toFixed(2)}`;
      default:
        return `${severityText} anomaly detected in budget usage pattern`;
    }
  }

  /**
   * Analyze cost efficiency patterns
   */
  async analyzeEfficiency(data: BudgetUsageTimeSeriesPoint[]): Promise<EfficiencyAnalysis> {
    this.logger.info('Starting efficiency analysis', {
      dataPoints: data.length,
    });

    try {
      // Calculate cost per request over time
      const costPerRequest = data.map(point => ({
        timestamp: point.timestamp,
        cost: point.totalCost,
        requests: point.requestCount,
        efficiency: point.requestCount > 0 ? point.totalCost / point.requestCount : 0,
      }));

      // Calculate overall efficiency score
      const validEfficiencies = costPerRequest.filter(item => item.efficiency > 0);
      const avgEfficiency = validEfficiencies.length > 0
        ? validEfficiencies.reduce((sum, item) => sum + item.efficiency, 0) / validEfficiencies.length
        : 0;

      // Normalize efficiency score (lower cost per request = higher efficiency)
      const maxEfficiency = Math.max(...validEfficiencies.map(item => item.efficiency));
      const efficiencyScore = maxEfficiency > 0 ? 1 - (avgEfficiency / maxEfficiency) : 0;

      // Analyze trend in efficiency
      const efficiencyValues = validEfficiencies.map(item => item.efficiency);
      const timestamps = validEfficiencies.map(item => item.timestamp);
      const regression = this.calculateLinearRegression(timestamps, efficiencyValues);

      const trend: TrendAnalysis = {
        metric: 'efficiency',
        period: 'daily',
        startTime: timestamps[0] || 0,
        endTime: timestamps[timestamps.length - 1] || 0,
        direction: this.determineTrendDirection(regression.slope, regression.correlation),
        strength: Math.abs(regression.correlation),
        confidence: this.determineConfidence(regression.correlation, regression.pValue),
        changeRate: regression.slope,
        currentValue: efficiencyValues[efficiencyValues.length - 1] || 0,
        predictedValue: regression.slope * (timestamps[timestamps.length - 1] || 0) + regression.intercept,
        correlation: regression.correlation,
        pValue: regression.pValue,
        dataPointCount: efficiencyValues.length,
        variance: 0,
        standardDeviation: 0,
      };

      // Detect waste and inefficiencies
      const wasteAnalysis = this.analyzeWaste(data, costPerRequest);

      // Generate optimization recommendations
      const optimizations = this.generateOptimizationRecommendations(
        data,
        costPerRequest,
        efficiencyScore,
        trend
      );

      const result: EfficiencyAnalysis = {
        efficiencyScore,
        costPerRequest,
        trend,
        wasteAnalysis,
        optimizations,
      };

      this.logger.info('Efficiency analysis completed', {
        efficiencyScore: efficiencyScore.toFixed(3),
        trendDirection: trend.direction,
        optimizationCount: optimizations.length,
      });

      return result;
    } catch (error) {
      this.logger.error('Efficiency analysis failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Analyze waste in budget usage
   */
  private analyzeWaste(
    data: BudgetUsageTimeSeriesPoint[],
    costPerRequest: Array<{ timestamp: number; cost: number; requests: number; efficiency: number }>
  ): {
    unusedBudget: number;
    inefficientPeriods: Array<{
      start: number;
      end: number;
      wastedAmount: number;
      reason: string;
    }>;
    recommendations: string[];
  } {
    // Calculate unused budget
    const totalBudget = data.reduce((sum, point) => sum + point.dailyLimit, 0);
    const totalUsed = data.reduce((sum, point) => sum + point.totalCost, 0);
    const unusedBudget = totalBudget - totalUsed;

    // Find inefficient periods
    const avgEfficiency = costPerRequest.reduce((sum, item) => sum + item.efficiency, 0) / costPerRequest.length;
    const inefficientPeriods: Array<{
      start: number;
      end: number;
      wastedAmount: number;
      reason: string;
    }> = [];

    let currentPeriod: { start: number; costs: number[]; reasons: string[] } | null = null;

    for (let i = 0; i < costPerRequest.length; i++) {
      const item = costPerRequest[i];
      const isInefficient = item.efficiency > avgEfficiency * 1.5;

      if (isInefficient) {
        if (!currentPeriod) {
          currentPeriod = { start: item.timestamp, costs: [], reasons: [] };
        }
        currentPeriod.costs.push(item.cost);

        if (item.requests === 0) {
          currentPeriod.reasons.push('Zero requests with non-zero cost');
        } else if (item.efficiency > avgEfficiency * 2) {
          currentPeriod.reasons.push('Extremely high cost per request');
        }
      } else if (currentPeriod) {
        // End of inefficient period
        const wastedAmount = currentPeriod.costs.reduce((sum, cost) => sum + cost, 0) * 0.3; // Estimate 30% could be saved
        inefficientPeriods.push({
          start: currentPeriod.start,
          end: item.timestamp,
          wastedAmount,
          reason: [...new Set(currentPeriod.reasons)].join(', ') || 'High cost per request',
        });
        currentPeriod = null;
      }
    }

    // Generate recommendations
    const recommendations: string[] = [];

    if (unusedBudget > totalUsed * 0.2) {
      recommendations.push('Consider reducing daily budget limits to optimize resource allocation');
    }

    if (inefficientPeriods.length > 0) {
      recommendations.push('Implement request batching to reduce per-request overhead');
      recommendations.push('Monitor and optimize high-cost operations during peak periods');
    }

    const zeroRequestPeriods = data.filter(point => point.requestCount === 0 && point.totalCost > 0);
    if (zeroRequestPeriods.length > 0) {
      recommendations.push('Investigate and eliminate charges for periods with zero requests');
    }

    return {
      unusedBudget,
      inefficientPeriods,
      recommendations,
    };
  }

  /**
   * Generate optimization recommendations
   */
  private generateOptimizationRecommendations(
    data: BudgetUsageTimeSeriesPoint[],
    costPerRequest: Array<{ timestamp: number; cost: number; requests: number; efficiency: number }>,
    efficiencyScore: number,
    trend: TrendAnalysis
  ): Array<{
    opportunity: string;
    potentialSavings: number;
    implementation: string;
    priority: 'low' | 'medium' | 'high';
  }> {
    const optimizations: Array<{
      opportunity: string;
      potentialSavings: number;
      implementation: string;
      priority: 'low' | 'medium' | 'high';
    }> = [];

    const totalCost = data.reduce((sum, point) => sum + point.totalCost, 0);

    // Low efficiency score optimization
    if (efficiencyScore < 0.6) {
      optimizations.push({
        opportunity: 'Improve overall cost efficiency',
        potentialSavings: totalCost * (0.8 - efficiencyScore),
        implementation: 'Optimize API call patterns, implement caching, and review expensive operations',
        priority: 'high',
      });
    }

    // Trending worse efficiency
    if (trend.direction === 'decreasing' && trend.strength > 0.6) {
      optimizations.push({
        opportunity: 'Address declining efficiency trend',
        potentialSavings: totalCost * 0.15,
        implementation: 'Investigate recent changes causing efficiency decline and implement corrective measures',
        priority: 'medium',
      });
    }

    // High variance in cost per request
    const efficiencyVariance = this.calculateVariance(costPerRequest.map(item => item.efficiency));
    if (efficiencyVariance > 1.0) {
      optimizations.push({
        opportunity: 'Standardize request processing efficiency',
        potentialSavings: totalCost * 0.1,
        implementation: 'Implement consistent request handling patterns and eliminate efficiency outliers',
        priority: 'medium',
      });
    }

    // Peak usage optimization
    const peakCost = Math.max(...data.map(point => point.totalCost));
    const avgCost = totalCost / data.length;
    if (peakCost > avgCost * 3) {
      optimizations.push({
        opportunity: 'Optimize peak usage periods',
        potentialSavings: (peakCost - avgCost * 2) * data.filter(point => point.totalCost > avgCost * 2).length,
        implementation: 'Implement load balancing and request queuing for peak periods',
        priority: 'high',
      });
    }

    return optimizations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * Calculate variance for array of numbers
   */
  private calculateVariance(values: number[]): number {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    return values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  }

  /**
   * Extract usage patterns and insights
   */
  async extractPatterns(data: BudgetUsageTimeSeriesPoint[]): Promise<UsagePatterns> {
    this.logger.info('Starting usage pattern extraction', {
      dataPoints: data.length,
    });

    try {
      // Analyze peak patterns
      const peakPatterns = this.analyzePeakPatterns(data);

      // Analyze usage distribution
      const distribution = this.analyzeUsageDistribution(data);

      // Analyze session patterns
      const sessionPatterns = this.analyzeSessionPatterns(data);

      // Analyze feature correlations
      const featureCorrelations = this.analyzeFeatureCorrelations(data);

      const patterns: UsagePatterns = {
        peakPatterns,
        distribution,
        sessionPatterns,
        featureCorrelations,
      };

      this.logger.info('Usage pattern extraction completed', {
        dailyPeaks: peakPatterns.dailyPeaks.length,
        weeklyPeaks: peakPatterns.weeklyPeaks.length,
      });

      return patterns;
    } catch (error) {
      this.logger.error('Usage pattern extraction failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Analyze peak usage patterns
   */
  private analyzePeakPatterns(data: BudgetUsageTimeSeriesPoint[]): {
    dailyPeaks: Array<{ hour: number; intensity: number }>;
    weeklyPeaks: Array<{ day: string; intensity: number }>;
    monthlyPeaks: Array<{ week: number; intensity: number }>;
  } {
    // Group by hour for daily patterns
    const hourlyUsage = new Map<number, number[]>();
    const weeklyUsage = new Map<number, number[]>();
    const monthlyUsage = new Map<number, number[]>();

    data.forEach(point => {
      const date = new Date(point.timestamp);
      const hour = date.getHours();
      const dayOfWeek = date.getDay();
      const weekOfMonth = Math.floor(date.getDate() / 7);

      // Hourly patterns
      if (!hourlyUsage.has(hour)) {
        hourlyUsage.set(hour, []);
      }
      hourlyUsage.get(hour)!.push(point.usagePercentage);

      // Weekly patterns
      if (!weeklyUsage.has(dayOfWeek)) {
        weeklyUsage.set(dayOfWeek, []);
      }
      weeklyUsage.get(dayOfWeek)!.push(point.usagePercentage);

      // Monthly patterns
      if (!monthlyUsage.has(weekOfMonth)) {
        monthlyUsage.set(weekOfMonth, []);
      }
      monthlyUsage.get(weekOfMonth)!.push(point.usagePercentage);
    });

    // Calculate intensities and find peaks
    const dailyPeaks = Array.from(hourlyUsage.entries())
      .map(([hour, usages]) => ({
        hour,
        intensity: usages.reduce((sum, val) => sum + val, 0) / usages.length,
      }))
      .filter(peak => peak.intensity > 50) // Only significant peaks
      .sort((a, b) => b.intensity - a.intensity);

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const weeklyPeaks = Array.from(weeklyUsage.entries())
      .map(([day, usages]) => ({
        day: dayNames[day],
        intensity: usages.reduce((sum, val) => sum + val, 0) / usages.length,
      }))
      .filter(peak => peak.intensity > 40)
      .sort((a, b) => b.intensity - a.intensity);

    const monthlyPeaks = Array.from(monthlyUsage.entries())
      .map(([week, usages]) => ({
        week,
        intensity: usages.reduce((sum, val) => sum + val, 0) / usages.length,
      }))
      .filter(peak => peak.intensity > 30)
      .sort((a, b) => b.intensity - a.intensity);

    return { dailyPeaks, weeklyPeaks, monthlyPeaks };
  }

  /**
   * Analyze usage distribution
   */
  private analyzeUsageDistribution(data: BudgetUsageTimeSeriesPoint[]): {
    lowUsage: number;
    mediumUsage: number;
    highUsage: number;
    criticalUsage: number;
  } {
    const total = data.length;
    let lowCount = 0;
    let mediumCount = 0;
    let highCount = 0;
    let criticalCount = 0;

    data.forEach(point => {
      const usage = point.usagePercentage;
      if (usage < 25) lowCount++;
      else if (usage < 60) mediumCount++;
      else if (usage < 85) highCount++;
      else criticalCount++;
    });

    return {
      lowUsage: (lowCount / total) * 100,
      mediumUsage: (mediumCount / total) * 100,
      highUsage: (highCount / total) * 100,
      criticalUsage: (criticalCount / total) * 100,
    };
  }

  /**
   * Analyze session patterns
   */
  private analyzeSessionPatterns(data: BudgetUsageTimeSeriesPoint[]): {
    averageSessionLength: number;
    sessionFrequency: number;
    concurrentSessions: Array<{ timestamp: number; sessionCount: number }>;
  } {
    // Group by session ID
    const sessions = new Map<string, BudgetUsageTimeSeriesPoint[]>();

    data.forEach(point => {
      const sessionId = point.sessionId || 'default';
      if (!sessions.has(sessionId)) {
        sessions.set(sessionId, []);
      }
      sessions.get(sessionId)!.push(point);
    });

    // Calculate session lengths
    const sessionLengths: number[] = [];
    sessions.forEach(sessionData => {
      if (sessionData.length > 1) {
        const sortedData = sessionData.sort((a, b) => a.timestamp - b.timestamp);
        const length = sortedData[sortedData.length - 1].timestamp - sortedData[0].timestamp;
        sessionLengths.push(length);
      }
    });

    const averageSessionLength = sessionLengths.length > 0
      ? sessionLengths.reduce((sum, len) => sum + len, 0) / sessionLengths.length
      : 0;

    // Calculate session frequency (sessions per day)
    const timeSpan = data.length > 1
      ? data[data.length - 1].timestamp - data[0].timestamp
      : 86400000; // 1 day default
    const sessionFrequency = (sessions.size / timeSpan) * 86400000; // per day

    // Calculate concurrent sessions
    const concurrentSessions: Array<{ timestamp: number; sessionCount: number }> = [];
    const sortedData = [...data].sort((a, b) => a.timestamp - b.timestamp);

    sortedData.forEach(point => {
      const activeSessionsAtTime = Array.from(sessions.values()).filter(sessionData => {
        const sessionStart = Math.min(...sessionData.map(p => p.timestamp));
        const sessionEnd = Math.max(...sessionData.map(p => p.timestamp));
        return point.timestamp >= sessionStart && point.timestamp <= sessionEnd;
      }).length;

      concurrentSessions.push({
        timestamp: point.timestamp,
        sessionCount: activeSessionsAtTime,
      });
    });

    return {
      averageSessionLength,
      sessionFrequency,
      concurrentSessions,
    };
  }

  /**
   * Analyze feature usage correlations
   */
  private analyzeFeatureCorrelations(data: BudgetUsageTimeSeriesPoint[]): Array<{
    feature: string;
    correlation: number;
    significance: number;
  }> {
    const featureUsage = new Map<string, number[]>();
    const costs: number[] = [];

    // Extract feature usage and costs
    data.forEach(point => {
      costs.push(point.totalCost);

      if (point.features && point.features.length > 0) {
        point.features.forEach(feature => {
          if (!featureUsage.has(feature)) {
            featureUsage.set(feature, new Array(data.length).fill(0));
          }
          const index = data.indexOf(point);
          featureUsage.get(feature)![index] = 1; // Binary feature usage
        });
      }
    });

    // Calculate correlations
    const correlations: Array<{
      feature: string;
      correlation: number;
      significance: number;
    }> = [];

    featureUsage.forEach((usage, feature) => {
      const regression = this.calculateLinearRegression(usage, costs);
      const correlation = regression.correlation;
      const significance = 1 - regression.pValue; // Convert p-value to significance

      correlations.push({
        feature,
        correlation,
        significance,
      });
    });

    return correlations
      .filter(item => Math.abs(item.correlation) > 0.1) // Only meaningful correlations
      .sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation));
  }

  /**
   * Generate comprehensive insights report
   */
  async generateInsights(
    data: BudgetUsageTimeSeriesPoint[],
    config: AnalysisConfig
  ): Promise<InsightsReport> {
    this.logger.info('Generating comprehensive insights report', {
      dataPoints: data.length,
      analysisConfig: config,
    });

    try {
      const startTime = Date.now();

      // Perform all analyses
      const [trends, seasonality, anomalies, efficiency, patterns] = await Promise.all([
        this.analyzeTrends(data, config),
        config.includeSeasonality ? this.detectSeasonality(data, 'cost') : Promise.resolve([]),
        this.detectAnomalies(data, config.anomalySensitivity),
        this.analyzeEfficiency(data),
        this.extractPatterns(data),
      ]);

      // Generate forecasts if requested
      const forecasts: InsightsReport['forecasts'] = [];
      if (config.includeForecast && config.forecastHorizon) {
        for (const metric of config.metrics) {
          try {
            const predictions = await this.forecast(data, metric, config.forecastHorizon);
            forecasts.push({
              metric,
              predictions,
              accuracy: this.calculateForecastAccuracy(data, metric), // Simplified accuracy
            });
          } catch (error) {
            this.logger.warn('Forecast failed for metric', { metric, error: error.message });
          }
        }
      }

      // Calculate summary statistics
      const totalCost = data.reduce((sum, point) => sum + point.totalCost, 0);
      const totalRequests = data.reduce((sum, point) => sum + point.requestCount, 0);
      const averageEfficiency = efficiency.efficiencyScore;
      const trendDirection = trends.find(t => t.metric === 'cost')?.direction || 'stable';

      // Generate key insights
      const keyInsights = this.generateKeyInsights(trends, seasonality, anomalies, efficiency, patterns);
      const recommendations = this.generateRecommendations(trends, efficiency, anomalies);

      // Assess data quality
      const dataQuality = this.assessDataQuality(data);

      const report: InsightsReport = {
        generatedAt: Date.now(),
        analysisPeriod: {
          start: data[0]?.timestamp || 0,
          end: data[data.length - 1]?.timestamp || 0,
          duration: data.length > 1 ? data[data.length - 1].timestamp - data[0].timestamp : 0,
        },
        summary: {
          totalCost,
          totalRequests,
          averageEfficiency,
          trendDirection,
          keyInsights,
          recommendations,
        },
        trends,
        seasonality,
        anomalies,
        efficiency,
        patterns,
        forecasts,
        dataQuality,
      };

      this.logger.info('Insights report generated successfully', {
        duration: Date.now() - startTime,
        keyInsights: keyInsights.length,
        recommendations: recommendations.length,
        forecastCount: forecasts.length,
      });

      return report;
    } catch (error) {
      this.logger.error('Insights report generation failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Generate key insights from analysis results
   */
  private generateKeyInsights(
    trends: TrendAnalysis[],
    seasonality: SeasonalPattern[],
    anomalies: AnomalyDetection,
    efficiency: EfficiencyAnalysis,
    patterns: UsagePatterns
  ): string[] {
    const insights: string[] = [];

    // Trend insights
    const costTrend = trends.find(t => t.metric === 'cost');
    if (costTrend) {
      if (costTrend.direction === 'increasing' && costTrend.strength > 0.6) {
        insights.push(`Cost is trending upward with ${costTrend.strength.toFixed(1)}% confidence - ${(costTrend.changeRate * 30).toFixed(2)}% increase expected monthly`);
      } else if (costTrend.direction === 'decreasing' && costTrend.strength > 0.6) {
        insights.push(`Cost optimization showing positive results with ${(Math.abs(costTrend.changeRate) * 30).toFixed(2)}% monthly decrease`);
      }
    }

    // Efficiency insights
    if (efficiency.efficiencyScore > 0.8) {
      insights.push(`High cost efficiency achieved (${(efficiency.efficiencyScore * 100).toFixed(1)}% score)`);
    } else if (efficiency.efficiencyScore < 0.5) {
      insights.push(`Significant efficiency improvements needed (${(efficiency.efficiencyScore * 100).toFixed(1)}% score)`);
    }

    // Seasonal insights
    seasonality.forEach(pattern => {
      if (pattern.seasonalStrength > 0.6) {
        insights.push(`Strong ${pattern.patternType} usage pattern detected with ${pattern.peakPeriods.length} peak periods`);
      }
    });

    // Anomaly insights
    if (anomalies.anomalyCount > 0) {
      const criticalAnomalies = anomalies.anomalies.filter(a => a.severity === 'critical');
      if (criticalAnomalies.length > 0) {
        insights.push(`${criticalAnomalies.length} critical anomalies detected requiring immediate attention`);
      }
    }

    // Usage pattern insights
    if (patterns.distribution.criticalUsage > 20) {
      insights.push(`High usage periods occur ${patterns.distribution.criticalUsage.toFixed(1)}% of the time - consider capacity planning`);
    }

    return insights;
  }

  /**
   * Generate actionable recommendations
   */
  private generateRecommendations(
    trends: TrendAnalysis[],
    efficiency: EfficiencyAnalysis,
    anomalies: AnomalyDetection
  ): string[] {
    const recommendations: string[] = [];

    // Add efficiency recommendations
    recommendations.push(...efficiency.optimizations.slice(0, 3).map(opt => opt.opportunity));

    // Add waste reduction recommendations
    recommendations.push(...efficiency.wasteAnalysis.recommendations.slice(0, 2));

    // Add anomaly-based recommendations
    if (anomalies.anomalyCount > 0) {
      recommendations.push('Implement automated anomaly alerting for cost spikes');

      const spikeAnomalies = anomalies.anomalies.filter(a => a.type === 'spike');
      if (spikeAnomalies.length > 2) {
        recommendations.push('Investigate recurring cost spikes and implement preventive measures');
      }
    }

    // Add trend-based recommendations
    const costTrend = trends.find(t => t.metric === 'cost');
    if (costTrend?.direction === 'increasing' && costTrend.strength > 0.7) {
      recommendations.push('Urgent cost management required - implement immediate cost controls');
    }

    return recommendations.slice(0, 5); // Limit to top 5 recommendations
  }

  /**
   * Assess data quality
   */
  private assessDataQuality(data: BudgetUsageTimeSeriesPoint[]): {
    completeness: number;
    consistency: number;
    accuracy: number;
    timeliness: number;
    issues: string[];
  } {
    const issues: string[] = [];
    let completeness = 100;
    let consistency = 100;
    let accuracy = 100;
    let timeliness = 100;

    // Check completeness
    const missingData = data.filter(point =>
      point.totalCost === null || point.totalCost === undefined ||
      point.requestCount === null || point.requestCount === undefined
    ).length;

    if (missingData > 0) {
      completeness = Math.max(0, 100 - (missingData / data.length * 100));
      issues.push(`${missingData} data points with missing values`);
    }

    // Check consistency
    const inconsistentData = data.filter(point =>
      point.totalCost < 0 ||
      point.requestCount < 0 ||
      point.usagePercentage < 0 ||
      point.usagePercentage > 100
    ).length;

    if (inconsistentData > 0) {
      consistency = Math.max(0, 100 - (inconsistentData / data.length * 100));
      issues.push(`${inconsistentData} data points with inconsistent values`);
    }

    // Check accuracy (basic sanity checks)
    const impossibleData = data.filter(point =>
      (point.requestCount === 0 && point.totalCost > 0) ||
      (point.usagePercentage > 100)
    ).length;

    if (impossibleData > 0) {
      accuracy = Math.max(0, 100 - (impossibleData / data.length * 50)); // Penalize heavily
      issues.push(`${impossibleData} data points with impossible values`);
    }

    // Check timeliness (gaps in data)
    if (data.length > 1) {
      const sortedData = [...data].sort((a, b) => a.timestamp - b.timestamp);
      const expectedInterval = 3600000; // 1 hour in milliseconds
      const gaps = sortedData.filter((point, index) => {
        if (index === 0) return false;
        const timeDiff = point.timestamp - sortedData[index - 1].timestamp;
        return timeDiff > expectedInterval * 2; // More than 2x expected interval
      }).length;

      if (gaps > 0) {
        timeliness = Math.max(0, 100 - (gaps / data.length * 100));
        issues.push(`${gaps} significant gaps in data timeline`);
      }
    }

    return {
      completeness,
      consistency,
      accuracy,
      timeliness,
      issues,
    };
  }

  /**
   * Calculate forecast accuracy (simplified)
   */
  private calculateForecastAccuracy(data: BudgetUsageTimeSeriesPoint[], metric: AnalysisMetric): number {
    // Simplified accuracy calculation based on trend consistency
    if (data.length < 10) return 0.5; // Low confidence for small datasets

    const values = this.extractMetricValues(data, metric);
    const lastHalf = values.slice(Math.floor(values.length / 2));
    const firstHalf = values.slice(0, Math.floor(values.length / 2));

    const firstHalfMean = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
    const lastHalfMean = lastHalf.reduce((sum, val) => sum + val, 0) / lastHalf.length;

    const variance = this.calculateVariance(values);
    const meanChange = Math.abs(lastHalfMean - firstHalfMean);

    // Higher accuracy for consistent trends, lower for high variance
    const consistencyScore = Math.max(0, 1 - (variance / (firstHalfMean + 1)));
    const stabilityScore = Math.max(0, 1 - (meanChange / (firstHalfMean + 1)));

    return (consistencyScore * 0.6 + stabilityScore * 0.4) * 0.9; // Max 90% accuracy
  }

  /**
   * Forecast future values
   */
  async forecast(
    data: BudgetUsageTimeSeriesPoint[],
    metric: AnalysisMetric,
    horizon: number
  ): Promise<Array<{
    timestamp: number;
    predictedValue: number;
    confidence: number;
    range: { min: number; max: number };
  }>> {
    this.logger.info('Starting forecast', {
      dataPoints: data.length,
      metric,
      horizon,
    });

    try {
      const values = this.extractMetricValues(data, metric);
      const timestamps = data.map(point => point.timestamp);

      // Perform trend analysis
      const regression = this.calculateLinearRegression(timestamps, values);

      // Calculate prediction confidence based on correlation and data quality
      const baseConfidence = Math.abs(regression.correlation) * 0.8;
      const dataQualityScore = Math.min(1, data.length / 50); // Better confidence with more data
      const confidence = baseConfidence * dataQualityScore;

      // Calculate variance for prediction intervals
      const residuals = values.map((actual, i) => {
        const predicted = regression.slope * timestamps[i] + regression.intercept;
        return Math.pow(actual - predicted, 2);
      });
      const mse = residuals.reduce((sum, r) => sum + r, 0) / residuals.length;
      const predictionStdDev = Math.sqrt(mse);

      // Generate predictions
      const predictions: Array<{
        timestamp: number;
        predictedValue: number;
        confidence: number;
        range: { min: number; max: number };
      }> = [];

      const lastTimestamp = timestamps[timestamps.length - 1];
      const timeInterval = data.length > 1
        ? (timestamps[timestamps.length - 1] - timestamps[0]) / (data.length - 1)
        : 86400000; // 1 day default

      for (let i = 1; i <= horizon; i++) {
        const futureTimestamp = lastTimestamp + (timeInterval * i);
        const predictedValue = regression.slope * futureTimestamp + regression.intercept;

        // Confidence decreases with distance from known data
        const timeConfidence = Math.max(0.1, confidence * (1 - i / horizon * 0.5));

        // Calculate prediction interval (simplified)
        const intervalMultiplier = 1.96; // 95% confidence interval
        const margin = intervalMultiplier * predictionStdDev * Math.sqrt(1 + i / data.length);

        predictions.push({
          timestamp: futureTimestamp,
          predictedValue: Math.max(0, predictedValue), // Ensure non-negative predictions
          confidence: timeConfidence,
          range: {
            min: Math.max(0, predictedValue - margin),
            max: predictedValue + margin,
          },
        });
      }

      this.logger.info('Forecast completed', {
        predictionCount: predictions.length,
        avgConfidence: predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length,
      });

      return predictions;
    } catch (error) {
      this.logger.error('Forecast failed', { error: error.message });
      throw error;
    }
  }
}

/**
 * Factory function to create a trend analysis engine
 */
export function createTrendAnalysisEngine(config?: Partial<AnalysisConfig>): TrendAnalysisEngine {
  return new TrendAnalysisEngineImpl(config);
}