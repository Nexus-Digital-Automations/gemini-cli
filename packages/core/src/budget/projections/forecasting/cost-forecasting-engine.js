/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { MathematicalAlgorithms } from '../algorithms/mathematical-algorithms.js';
/**
 * Advanced cost forecasting engine with multiple prediction models
 * Provides sophisticated cost projections with confidence intervals and accuracy metrics
 */
export class CostForecastingEngine {
  static logger = console; // Will be replaced with proper logger
  /**
   * Generate comprehensive cost projections using ensemble methods
   */
  static async generateProjections(
    historicalData,
    projectionDays = 30,
    confidenceLevel = 0.95,
  ) {
    const startTime = Date.now();
    this.logger.info('Generating cost projections', {
      historicalDataPoints: historicalData.length,
      projectionDays,
      confidenceLevel,
    });
    try {
      if (historicalData.length < 3) {
        throw new Error(
          'At least 3 historical data points required for forecasting',
        );
      }
      // Sort data by timestamp
      const sortedData = [...historicalData].sort(
        (a, b) => a.timestamp.getTime() - b.timestamp.getTime(),
      );
      // Perform comprehensive analysis
      const trendAnalysis =
        MathematicalAlgorithms.performTrendAnalysis(sortedData);
      const seasonalAnalysis =
        MathematicalAlgorithms.analyzeSeasonality(sortedData);
      const burnRateAnalysis = this.calculateBurnRateAnalysis(sortedData);
      const dataQualityScore = this.calculateDataQualityScore(sortedData);
      // Generate projections using multiple algorithms
      const linearProjection = this.generateLinearProjection(
        sortedData,
        trendAnalysis,
        projectionDays,
      );
      const exponentialProjection = this.generateExponentialProjection(
        sortedData,
        trendAnalysis,
        projectionDays,
      );
      const seasonalProjection = this.generateSeasonalProjection(
        sortedData,
        seasonalAnalysis,
        projectionDays,
      );
      // Create ensemble projection
      const ensembleProjection = this.createEnsembleProjection(
        linearProjection,
        exponentialProjection,
        seasonalProjection,
        confidenceLevel,
      );
      // Calculate accuracy metrics if we have enough historical data
      const accuracyMetrics =
        sortedData.length > 14
          ? await this.calculateAccuracyMetrics(sortedData)
          : undefined;
      // Generate final projection result
      const projection = {
        metadata: {
          algorithm: 'ensemble',
          projectionPeriod: {
            start: new Date(
              sortedData[sortedData.length - 1].timestamp.getTime() +
                24 * 60 * 60 * 1000,
            ),
            end: new Date(
              sortedData[sortedData.length - 1].timestamp.getTime() +
                projectionDays * 24 * 60 * 60 * 1000,
            ),
          },
          confidenceInterval: confidenceLevel,
          dataQualityScore,
        },
        projectedCosts: ensembleProjection,
        summary: {
          totalProjectedCost: ensembleProjection.reduce(
            (sum, point) => sum + point.projectedCost,
            0,
          ),
          averageDailyCost:
            ensembleProjection.reduce(
              (sum, point) => sum + point.projectedCost,
              0,
            ) / projectionDays,
          burnRatePerDay: burnRateAnalysis.currentBurnRate,
          budgetRunwayDays: burnRateAnalysis.runway.currentRateDays,
        },
        accuracyMetrics,
      };
      this.logger.info('Cost projections generated successfully', {
        duration: Date.now() - startTime,
        totalProjectedCost: projection.summary.totalProjectedCost.toFixed(2),
        averageDailyCost: projection.summary.averageDailyCost.toFixed(2),
        dataQualityScore: projection.metadata.dataQualityScore.toFixed(3),
      });
      return projection;
    } catch (error) {
      this.logger.error('Failed to generate cost projections', {
        error: error.message,
      });
      throw error;
    }
  }
  /**
   * Generate burn rate analysis for budget runway calculations
   */
  static calculateBurnRateAnalysis(dataPoints, currentBudget) {
    const startTime = Date.now();
    this.logger.info('Calculating burn rate analysis', {
      dataPoints: dataPoints.length,
      currentBudget: currentBudget || 'unknown',
    });
    try {
      if (dataPoints.length < 2) {
        throw new Error(
          'At least 2 data points required for burn rate analysis',
        );
      }
      const sortedData = [...dataPoints].sort(
        (a, b) => a.timestamp.getTime() - b.timestamp.getTime(),
      );
      // Calculate daily burn rates
      const dailyBurnRates = this.calculateDailyBurnRates(sortedData);
      const currentBurnRate =
        dailyBurnRates[dailyBurnRates.length - 1]?.burnRate || 0;
      const averageBurnRate =
        dailyBurnRates.reduce((sum, day) => sum + day.burnRate, 0) /
        dailyBurnRates.length;
      // Analyze burn rate trend
      const burnRateTrend = MathematicalAlgorithms.performTrendAnalysis(
        dailyBurnRates.map((day) => ({
          timestamp: day.date,
          cost: day.burnRate,
          tokens: 0, // Not applicable for burn rate
        })),
      );
      // Calculate runway analysis
      const remainingBudget = currentBudget || 1000; // Default budget if not provided
      const runway = {
        currentRateDays:
          currentBurnRate > 0
            ? Math.floor(remainingBudget / currentBurnRate)
            : Infinity,
        averageRateDays:
          averageBurnRate > 0
            ? Math.floor(remainingBudget / averageBurnRate)
            : Infinity,
        projectedRateDays: 0, // Will be calculated based on trend
        exhaustionDate: new Date(),
      };
      // Calculate projected burn rate and runway
      const projectedBurnRate = this.calculateProjectedBurnRate(
        burnRateTrend,
        currentBurnRate,
      );
      runway.projectedRateDays =
        projectedBurnRate > 0
          ? Math.floor(remainingBudget / projectedBurnRate)
          : Infinity;
      runway.exhaustionDate = new Date(
        Date.now() + runway.projectedRateDays * 24 * 60 * 60 * 1000,
      );
      // Calculate category breakdown if context information is available
      const categoryBreakdown = this.calculateCategoryBurnRates(sortedData);
      const result = {
        currentBurnRate,
        averageBurnRate,
        burnRateTrend,
        runway,
        categoryBreakdown,
      };
      this.logger.info('Burn rate analysis completed', {
        duration: Date.now() - startTime,
        currentBurnRate: currentBurnRate.toFixed(4),
        averageBurnRate: averageBurnRate.toFixed(4),
        projectedRateDays: runway.projectedRateDays,
      });
      return result;
    } catch (error) {
      this.logger.error('Failed to calculate burn rate analysis', {
        error: error.message,
      });
      throw error;
    }
  }
  // Private helper methods
  static generateLinearProjection(data, trendAnalysis, projectionDays) {
    const lastDataPoint = data[data.length - 1];
    const baseTimestamp = lastDataPoint.timestamp.getTime();
    const projectedCosts = [];
    for (let day = 1; day <= projectionDays; day++) {
      const projectedCost = Math.max(
        0,
        trendAnalysis.intercept + trendAnalysis.slope * day,
      );
      const confidence = Math.max(
        0.5,
        trendAnalysis.confidence * (1 - (day - 1) * 0.02),
      ); // Decrease confidence over time
      // Calculate confidence intervals
      const errorMargin = projectedCost * (1 - confidence) * 2;
      const lowerBound = Math.max(0, projectedCost - errorMargin);
      const upperBound = projectedCost + errorMargin;
      projectedCosts.push({
        date: new Date(baseTimestamp + day * 24 * 60 * 60 * 1000),
        projectedCost,
        lowerBound,
        upperBound,
        confidence,
      });
    }
    return projectedCosts;
  }
  static generateExponentialProjection(data, trendAnalysis, projectionDays) {
    const lastDataPoint = data[data.length - 1];
    const baseTimestamp = lastDataPoint.timestamp.getTime();
    const baseCost = lastDataPoint.cost;
    const growthRate = trendAnalysis.slope / (baseCost || 1); // Convert slope to growth rate
    const projectedCosts = [];
    for (let day = 1; day <= projectionDays; day++) {
      const projectedCost = Math.max(0, baseCost * Math.exp(growthRate * day));
      const confidence = Math.max(
        0.4,
        trendAnalysis.confidence * (1 - (day - 1) * 0.03),
      );
      // Calculate confidence intervals
      const errorMargin = projectedCost * (1 - confidence) * 2.5;
      const lowerBound = Math.max(0, projectedCost - errorMargin);
      const upperBound = projectedCost + errorMargin;
      projectedCosts.push({
        date: new Date(baseTimestamp + day * 24 * 60 * 60 * 1000),
        projectedCost,
        lowerBound,
        upperBound,
        confidence,
      });
    }
    return projectedCosts;
  }
  static generateSeasonalProjection(data, seasonalAnalysis, projectionDays) {
    const lastDataPoint = data[data.length - 1];
    const baseTimestamp = lastDataPoint.timestamp.getTime();
    const baseCost =
      data.reduce((sum, point) => sum + point.cost, 0) / data.length;
    const projectedCosts = [];
    for (let day = 1; day <= projectionDays; day++) {
      const projectionDate = new Date(
        baseTimestamp + day * 24 * 60 * 60 * 1000,
      );
      // Apply seasonal adjustments
      let seasonalMultiplier = 1.0;
      seasonalAnalysis.patterns.forEach((pattern) => {
        seasonalMultiplier *= this.calculateSeasonalMultiplier(
          projectionDate,
          pattern,
        );
      });
      // Apply deseasonalized trend
      const trendAdjustment =
        seasonalAnalysis.deseasonalizedTrend.intercept +
        seasonalAnalysis.deseasonalizedTrend.slope * day;
      const projectedCost = Math.max(
        0,
        (baseCost + trendAdjustment) * seasonalMultiplier,
      );
      const confidence = Math.max(
        0.3,
        seasonalAnalysis.seasonalityStrength * (1 - (day - 1) * 0.025),
      );
      // Calculate confidence intervals
      const errorMargin = projectedCost * (1 - confidence) * 3;
      const lowerBound = Math.max(0, projectedCost - errorMargin);
      const upperBound = projectedCost + errorMargin;
      projectedCosts.push({
        date: projectionDate,
        projectedCost,
        lowerBound,
        upperBound,
        confidence,
      });
    }
    return projectedCosts;
  }
  static createEnsembleProjection(
    linearProjection,
    exponentialProjection,
    seasonalProjection,
    confidenceLevel,
  ) {
    const ensembleProjection = [];
    for (let i = 0; i < linearProjection.length; i++) {
      const linearPoint = linearProjection[i];
      const exponentialPoint = exponentialProjection[i];
      const seasonalPoint = seasonalProjection[i];
      // Weight the projections based on their confidence and appropriateness
      const linearWeight = 0.4;
      const exponentialWeight = 0.3;
      const seasonalWeight = 0.3;
      const weightedCost =
        linearPoint.projectedCost * linearWeight +
        exponentialPoint.projectedCost * exponentialWeight +
        seasonalPoint.projectedCost * seasonalWeight;
      const weightedConfidence =
        linearPoint.confidence * linearWeight +
        exponentialPoint.confidence * exponentialWeight +
        seasonalPoint.confidence * seasonalWeight;
      // Calculate ensemble bounds
      const allBounds = [
        linearPoint.lowerBound,
        linearPoint.upperBound,
        exponentialPoint.lowerBound,
        exponentialPoint.upperBound,
        seasonalPoint.lowerBound,
        seasonalPoint.upperBound,
      ];
      const lowerBound = Math.min(...allBounds);
      const upperBound = Math.max(...allBounds);
      ensembleProjection.push({
        date: linearPoint.date,
        projectedCost: weightedCost,
        lowerBound,
        upperBound,
        confidence: weightedConfidence,
      });
    }
    return ensembleProjection;
  }
  static calculateDataQualityScore(data) {
    // Evaluate data quality based on multiple factors
    let qualityScore = 1.0;
    // Factor 1: Data completeness (penalize missing data)
    const expectedDataPoints = this.calculateExpectedDataPoints(data);
    const completenessScore = Math.min(1.0, data.length / expectedDataPoints);
    qualityScore *= completenessScore;
    // Factor 2: Data consistency (penalize large gaps)
    const consistencyScore = this.calculateConsistencyScore(data);
    qualityScore *= consistencyScore;
    // Factor 3: Data variance (penalize excessive noise)
    const statistics = MathematicalAlgorithms.calculateStatistics(data);
    const varianceScore =
      statistics.coefficientOfVariation < 50
        ? 1.0
        : Math.max(0.3, 1.0 - (statistics.coefficientOfVariation - 50) / 100);
    qualityScore *= varianceScore;
    return Math.max(0.1, Math.min(1.0, qualityScore));
  }
  static calculateExpectedDataPoints(data) {
    if (data.length < 2) return data.length;
    const sortedData = [...data].sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime(),
    );
    const timeSpanDays =
      (sortedData[sortedData.length - 1].timestamp.getTime() -
        sortedData[0].timestamp.getTime()) /
      (24 * 60 * 60 * 1000);
    // Expect at least one data point per day
    return Math.max(data.length, Math.ceil(timeSpanDays));
  }
  static calculateConsistencyScore(data) {
    if (data.length < 3) return 1.0;
    const sortedData = [...data].sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime(),
    );
    const gaps = [];
    for (let i = 1; i < sortedData.length; i++) {
      const gap =
        (sortedData[i].timestamp.getTime() -
          sortedData[i - 1].timestamp.getTime()) /
        (60 * 60 * 1000); // Gap in hours
      gaps.push(gap);
    }
    const averageGap = gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length;
    const gapVariance =
      gaps.reduce((sum, gap) => sum + Math.pow(gap - averageGap, 2), 0) /
      gaps.length;
    const gapStdDev = Math.sqrt(gapVariance);
    // Score based on gap consistency (lower variance = higher score)
    const consistencyScore =
      averageGap > 0 ? Math.max(0.3, 1.0 - gapStdDev / averageGap) : 1.0;
    return consistencyScore;
  }
  static async calculateAccuracyMetrics(data) {
    // Use last 30% of data for validation
    const validationSize = Math.floor(data.length * 0.3);
    const trainingData = data.slice(0, data.length - validationSize);
    const validationData = data.slice(data.length - validationSize);
    // Generate predictions for validation period
    const predictions = await this.generateProjections(
      trainingData,
      validationSize,
      0.95,
    );
    let mapeSum = 0;
    let maeSum = 0;
    let rmseSum = 0;
    let validPredictions = 0;
    for (
      let i = 0;
      i < Math.min(predictions.projectedCosts.length, validationData.length);
      i++
    ) {
      const predicted = predictions.projectedCosts[i].projectedCost;
      const actual = validationData[i].cost;
      if (actual > 0) {
        const ape = Math.abs((actual - predicted) / actual) * 100;
        mapeSum += ape;
        validPredictions++;
      }
      const ae = Math.abs(actual - predicted);
      maeSum += ae;
      const se = Math.pow(actual - predicted, 2);
      rmseSum += se;
    }
    const count = Math.max(1, validPredictions);
    const totalCount = Math.max(
      1,
      Math.min(predictions.projectedCosts.length, validationData.length),
    );
    return {
      mape: mapeSum / count,
      mae: maeSum / totalCount,
      rmse: Math.sqrt(rmseSum / totalCount),
    };
  }
  static calculateDailyBurnRates(data) {
    // Group data by day
    const dailyData = new Map();
    data.forEach((point) => {
      const dateKey = point.timestamp.toISOString().split('T')[0];
      if (!dailyData.has(dateKey)) {
        dailyData.set(dateKey, []);
      }
      dailyData.get(dateKey).push(point);
    });
    // Calculate burn rate for each day
    return Array.from(dailyData.entries())
      .map(([dateKey, points]) => ({
        date: new Date(dateKey),
        burnRate: points.reduce((sum, point) => sum + point.cost, 0),
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }
  static calculateProjectedBurnRate(burnRateTrend, currentBurnRate) {
    // Project burn rate based on trend
    const projectedChange = burnRateTrend.slope * 30; // 30 days ahead
    return Math.max(0, currentBurnRate + projectedChange);
  }
  static calculateCategoryBurnRates(data) {
    const categoryData = new Map();
    data.forEach((point) => {
      const category = point.context?.feature || 'unknown';
      if (!categoryData.has(category)) {
        categoryData.set(category, []);
      }
      categoryData.get(category).push(point);
    });
    const totalCost = data.reduce((sum, point) => sum + point.cost, 0);
    const breakdown = [];
    categoryData.forEach((points, category) => {
      const categoryCost = points.reduce((sum, point) => sum + point.cost, 0);
      const burnRate = categoryCost / (data.length > 0 ? data.length : 1); // Simplified daily burn rate
      const percentage = totalCost > 0 ? (categoryCost / totalCost) * 100 : 0;
      // Simple trend calculation for category
      const trend =
        points.length > 1 ? this.calculateSimpleTrend(points) : 'stable';
      breakdown.push({
        category,
        burnRate,
        percentage,
        trend,
      });
    });
    return breakdown.sort((a, b) => b.burnRate - a.burnRate);
  }
  static calculateSimpleTrend(points) {
    if (points.length < 2) return 'stable';
    const sortedPoints = [...points].sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime(),
    );
    const firstHalf = sortedPoints.slice(
      0,
      Math.floor(sortedPoints.length / 2),
    );
    const secondHalf = sortedPoints.slice(Math.floor(sortedPoints.length / 2));
    const firstHalfAvg =
      firstHalf.reduce((sum, p) => sum + p.cost, 0) / firstHalf.length;
    const secondHalfAvg =
      secondHalf.reduce((sum, p) => sum + p.cost, 0) / secondHalf.length;
    const threshold = 0.1; // 10% change threshold
    const change = (secondHalfAvg - firstHalfAvg) / firstHalfAvg;
    if (Math.abs(change) < threshold) return 'stable';
    return change > 0 ? 'increasing' : 'decreasing';
  }
  static calculateSeasonalMultiplier(date, pattern) {
    // Calculate seasonal multiplier based on pattern type
    const baseMultiplier = 1.0;
    const maxMultiplier = 1.0 + pattern.strength * 0.5; // Max 50% increase for strong seasonality
    switch (pattern.type) {
      case 'daily':
        const hour = date.getHours();
        return pattern.peaks.includes(hour) ? maxMultiplier : baseMultiplier;
      case 'weekly':
        const dayOfWeek = date.getDay();
        return pattern.peaks.includes(dayOfWeek)
          ? maxMultiplier
          : baseMultiplier;
      case 'monthly':
        const dayOfMonth = date.getDate();
        return pattern.peaks.includes(dayOfMonth)
          ? maxMultiplier
          : baseMultiplier;
      case 'quarterly':
        const month = date.getMonth();
        const quarterMonth = month % 3;
        return pattern.peaks.includes(quarterMonth)
          ? maxMultiplier
          : baseMultiplier;
      default:
        return baseMultiplier;
    }
  }
}
//# sourceMappingURL=cost-forecasting-engine.js.map
