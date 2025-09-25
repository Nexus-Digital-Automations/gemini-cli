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
export class MathematicalAlgorithms {
  private static readonly logger = console; // Will be replaced with proper logger

  /**
   * Calculate comprehensive statistical measures for cost data
   */
  static calculateStatistics(
    dataPoints: CostDataPoint[],
  ): StatisticalMeasures {
    const startTime = Date.now();
    this.logger.info('Calculating statistical measures', {
      dataPoints: dataPoints.length,
    });

    try {
      if (dataPoints.length === 0) {
        throw new Error('No data points provided for statistical analysis');
      }

      const costs = dataPoints.map((point) => point.cost).sort((a, b) => a - b);
      const n = costs.length;

      // Calculate mean
      const mean = costs.reduce((sum, cost) => sum + cost, 0) / n;

      // Calculate variance and standard deviation
      const variance =
        costs.reduce((sum, cost) => sum + Math.pow(cost - mean, 2), 0) / n;
      const standardDeviation = Math.sqrt(variance);

      // Calculate median
      const median =
        n % 2 === 0
          ? (costs[n / 2 - 1] + costs[n / 2]) / 2
          : costs[Math.floor(n / 2)];

      // Calculate percentiles
      const percentile95Index = Math.ceil(0.95 * n) - 1;
      const percentile95 = costs[percentile95Index];

      // Calculate coefficient of variation (volatility measure)
      const coefficientOfVariation =
        mean > 0 ? (standardDeviation / mean) * 100 : 0;

      const result: StatisticalMeasures = {
        mean,
        standardDeviation,
        variance,
        median,
        percentile95,
        min: costs[0],
        max: costs[n - 1],
        coefficientOfVariation,
      };

      this.logger.info('Statistical measures calculated', {
        duration: Date.now() - startTime,
        mean: result.mean.toFixed(4),
        standardDeviation: result.standardDeviation.toFixed(4),
        coefficientOfVariation: result.coefficientOfVariation.toFixed(2),
      });

      return result;
    } catch (error) {
      this.logger.error('Failed to calculate statistical measures', {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Perform linear regression analysis for trend detection
   */
  static performTrendAnalysis(
    dataPoints: CostDataPoint[],
  ): TrendAnalysis {
    const startTime = Date.now();
    this.logger.info('Performing trend analysis', {
      dataPoints: dataPoints.length,
    });

    try {
      if (dataPoints.length < 2) {
        throw new Error('At least 2 data points required for trend analysis');
      }

      // Sort by timestamp
      const sortedPoints = [...dataPoints].sort(
        (a, b) => a.timestamp.getTime() - b.timestamp.getTime(),
      );

      // Convert timestamps to days since start
      const startTimestamp = sortedPoints[0].timestamp.getTime();
      const timePoints = sortedPoints.map(
        (point) =>
          (point.timestamp.getTime() - startTimestamp) / (24 * 60 * 60 * 1000),
      );
      const costPoints = sortedPoints.map((point) => point.cost);

      // Calculate linear regression using least squares method
      const n = timePoints.length;
      const sumX = timePoints.reduce((sum, x) => sum + x, 0);
      const sumY = costPoints.reduce((sum, y) => sum + y, 0);
      const sumXY = timePoints.reduce(
        (sum, x, i) => sum + x * costPoints[i],
        0,
      );
      const sumXX = timePoints.reduce((sum, x) => sum + x * x, 0);
      const sumYY = costPoints.reduce((sum, y) => sum + y * y, 0);

      // Linear regression coefficients: y = mx + b
      const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
      const intercept = (sumY - slope * sumX) / n;

      // Calculate correlation coefficient (R)
      const numerator = n * sumXY - sumX * sumY;
      const denominatorX = Math.sqrt(n * sumXX - sumX * sumX);
      const denominatorY = Math.sqrt(n * sumYY - sumY * sumY);
      const correlation =
        denominatorX * denominatorY !== 0
          ? Math.abs(numerator / (denominatorX * denominatorY))
          : 0;

      // Calculate p-value for statistical significance (simplified t-test)
      const standardError = Math.sqrt(
        (sumYY - intercept * sumY - slope * sumXY) /
          ((n - 2) * (sumXX - (sumX * sumX) / n)),
      );
      const tStatistic = Math.abs(slope / standardError);
      // Simplified p-value calculation (more complex statistical methods could be used)
      const pValue = tStatistic > 2 ? 0.05 : 0.1; // Rough approximation

      // Determine trend direction
      let direction: TrendAnalysis['direction'];
      const slopeThreshold = 0.01; // Minimum slope to consider significant
      if (Math.abs(slope) < slopeThreshold) {
        direction = 'stable';
      } else if (slope > 0) {
        direction = 'increasing';
      } else {
        direction = 'decreasing';
      }

      // Confidence level based on correlation and data points
      const confidence = Math.min(
        0.95,
        correlation * (Math.log(n) / Math.log(100)),
      );

      const result: TrendAnalysis = {
        slope,
        intercept,
        correlation,
        direction,
        confidence,
        pValue,
      };

      this.logger.info('Trend analysis completed', {
        duration: Date.now() - startTime,
        direction: result.direction,
        slope: result.slope.toFixed(6),
        correlation: result.correlation.toFixed(4),
        confidence: result.confidence.toFixed(4),
      });

      return result;
    } catch (error) {
      this.logger.error('Failed to perform trend analysis', {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Calculate moving averages with configurable parameters
   */
  static calculateMovingAverage(
    dataPoints: CostDataPoint[],
    config: MovingAverageAnalysis['config'],
  ): MovingAverageAnalysis {
    const startTime = Date.now();
    this.logger.info('Calculating moving average', {
      dataPoints: dataPoints.length,
      config,
    });

    try {
      if (dataPoints.length < config.windowSize) {
        throw new Error(
          `Insufficient data points for moving average window size ${config.windowSize}`,
        );
      }

      // Sort by timestamp
      const sortedPoints = [...dataPoints].sort(
        (a, b) => a.timestamp.getTime() - b.timestamp.getTime(),
      );
      const values: MovingAverageAnalysis['values'] = [];

      for (let i = config.windowSize - 1; i < sortedPoints.length; i++) {
        const windowData = sortedPoints.slice(i - config.windowSize + 1, i + 1);
        const rawValue = sortedPoints[i].cost;
        let movingAverageValue: number;

        switch (config.type) {
          case 'simple':
            movingAverageValue =
              windowData.reduce((sum, point) => sum + point.cost, 0) /
              config.windowSize;
            break;

          case 'exponential':
            const alpha = config.alpha || 0.2;
            movingAverageValue = windowData.reduce((ema, point, index) => index === 0
                ? point.cost
                : alpha * point.cost + (1 - alpha) * ema, windowData[0].cost);
            break;

          case 'weighted':
            const weights = Array.from(
              { length: config.windowSize },
              (_, i) => i + 1,
            );
            const weightSum = weights.reduce((sum, weight) => sum + weight, 0);
            movingAverageValue =
              windowData.reduce((sum, point, index) => sum + point.cost * weights[index], 0) / weightSum;
            break;

          default:
            throw new Error(`Unsupported moving average type: ${config.type}`);
        }

        values.push({
          date: sortedPoints[i].timestamp,
          value: movingAverageValue,
          rawValue,
        });
      }

      // Determine current trend based on last few values
      const recentValues = values.slice(-Math.min(5, values.length));
      let currentTrend: MovingAverageAnalysis['currentTrend'] = 'flat';

      if (recentValues.length >= 2) {
        const trendSlope = this.calculateSlope(
          recentValues.map((v, i) => ({ x: i, y: v.value })),
        );

        const trendThreshold = 0.01;
        if (Math.abs(trendSlope) < trendThreshold) {
          currentTrend = 'flat';
        } else if (trendSlope > 0) {
          currentTrend = 'up';
        } else {
          currentTrend = 'down';
        }
      }

      const result: MovingAverageAnalysis = {
        config,
        values,
        currentTrend,
      };

      this.logger.info('Moving average calculated', {
        duration: Date.now() - startTime,
        values: result.values.length,
        currentTrend: result.currentTrend,
      });

      return result;
    } catch (error) {
      this.logger.error('Failed to calculate moving average', {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Analyze seasonal patterns in cost data
   */
  static analyzeSeasonality(
    dataPoints: CostDataPoint[],
  ): SeasonalAnalysis {
    const startTime = Date.now();
    this.logger.info('Analyzing seasonality', {
      dataPoints: dataPoints.length,
    });

    try {
      if (dataPoints.length < 14) {
        // Need at least 2 weeks of data for meaningful seasonal analysis
        return {
          patterns: [],
          seasonalityStrength: 0,
          deseasonalizedTrend: this.performTrendAnalysis(dataPoints),
        };
      }

      const sortedPoints = [...dataPoints].sort(
        (a, b) => a.timestamp.getTime() - b.timestamp.getTime(),
      );
      const patterns: SeasonalAnalysis['patterns'] = [];

      // Analyze daily patterns (hourly peaks/troughs)
      const dailyPattern = this.analyzeDailyPattern(sortedPoints);
      if (dailyPattern) patterns.push(dailyPattern);

      // Analyze weekly patterns (day-of-week effects)
      const weeklyPattern = this.analyzeWeeklyPattern(sortedPoints);
      if (weeklyPattern) patterns.push(weeklyPattern);

      // Analyze monthly patterns (if enough data)
      if (sortedPoints.length > 60) {
        // At least 2 months
        const monthlyPattern = this.analyzeMonthlyPattern(sortedPoints);
        if (monthlyPattern) patterns.push(monthlyPattern);
      }

      // Calculate overall seasonality strength
      const seasonalityStrength =
        patterns.length > 0
          ? patterns.reduce((sum, pattern) => sum + pattern.strength, 0) /
            patterns.length
          : 0;

      // Calculate deseasonalized trend
      const deseasonalizedData = this.removeSeasonality(sortedPoints, patterns);
      const deseasonalizedTrend = this.performTrendAnalysis(deseasonalizedData);

      const result: SeasonalAnalysis = {
        patterns,
        seasonalityStrength,
        deseasonalizedTrend,
      };

      this.logger.info('Seasonality analysis completed', {
        duration: Date.now() - startTime,
        patterns: result.patterns.length,
        seasonalityStrength: result.seasonalityStrength.toFixed(4),
      });

      return result;
    } catch (error) {
      this.logger.error('Failed to analyze seasonality', {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Detect variances and anomalies using statistical methods
   */
  static detectVariances(
    dataPoints: CostDataPoint[],
    algorithm: VarianceDetection['algorithm'] = 'z_score',
  ): VarianceDetection {
    const startTime = Date.now();
    this.logger.info('Detecting variances', {
      dataPoints: dataPoints.length,
      algorithm,
    });

    try {
      if (dataPoints.length < 3) {
        throw new Error(
          'At least 3 data points required for variance detection',
        );
      }

      const variances: VarianceDetection['variances'] = [];
      const statistics = this.calculateStatistics(dataPoints);

      switch (algorithm) {
        case 'z_score':
          variances.push(...this.detectVariancesZScore(dataPoints, statistics));
          break;

        case 'iqr':
          variances.push(...this.detectVariancesIQR(dataPoints));
          break;

        case 'moving_average_deviation':
          variances.push(
            ...this.detectVariancesMovingAverageDeviation(dataPoints),
          );
          break;

        case 'isolation_forest':
          // Simplified isolation forest implementation
          variances.push(...this.detectVariancesIsolationForest(dataPoints));
          break;

        default:
          throw new Error(
            `Unsupported variance detection algorithm: ${algorithm}`,
          );
      }

      // Calculate summary statistics
      const significantVariances = variances.filter(
        (v) => v.varianceScore > 0.7,
      ).length;
      const averageVarianceScore =
        variances.length > 0
          ? variances.reduce((sum, v) => sum + v.varianceScore, 0) /
            variances.length
          : 0;
      const maxVarianceScore =
        variances.length > 0
          ? Math.max(...variances.map((v) => v.varianceScore))
          : 0;

      const result: VarianceDetection = {
        timestamp: new Date(),
        algorithm,
        variances,
        summary: {
          totalVariances: variances.length,
          averageVarianceScore,
          maxVarianceScore,
          significantVariances,
        },
      };

      this.logger.info('Variance detection completed', {
        duration: Date.now() - startTime,
        totalVariances: result.summary.totalVariances,
        significantVariances: result.summary.significantVariances,
        maxVarianceScore: result.summary.maxVarianceScore.toFixed(4),
      });

      return result;
    } catch (error) {
      this.logger.error('Failed to detect variances', { error: error.message });
      throw error;
    }
  }

  // Private helper methods

  private static calculateSlope(
    points: Array<{ x: number; y: number }>,
  ): number {
    if (points.length < 2) return 0;

    const n = points.length;
    const sumX = points.reduce((sum, p) => sum + p.x, 0);
    const sumY = points.reduce((sum, p) => sum + p.y, 0);
    const sumXY = points.reduce((sum, p) => sum + p.x * p.y, 0);
    const sumXX = points.reduce((sum, p) => sum + p.x * p.x, 0);

    return (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  }

  private static analyzeDailyPattern(
    dataPoints: CostDataPoint[],
  ): SeasonalAnalysis['patterns'][0] | null {
    // Group by hour of day
    const hourlyData = new Map<number, number[]>();

    dataPoints.forEach((point) => {
      const hour = point.timestamp.getHours();
      if (!hourlyData.has(hour)) {
        hourlyData.set(hour, []);
      }
      hourlyData.get(hour)!.push(point.cost);
    });

    if (hourlyData.size < 12) return null; // Need reasonable coverage

    const hourlyAverages = Array.from(hourlyData.entries())
      .map(([hour, costs]) => ({
        hour,
        average: costs.reduce((sum, cost) => sum + cost, 0) / costs.length,
      }))
      .sort((a, b) => a.hour - b.hour);

    // Find peaks and troughs
    const peaks: number[] = [];
    const troughs: number[] = [];
    const averageValue =
      hourlyAverages.reduce((sum, item) => sum + item.average, 0) /
      hourlyAverages.length;

    hourlyAverages.forEach(({ hour, average }) => {
      if (average > averageValue * 1.2) peaks.push(hour);
      if (average < averageValue * 0.8) troughs.push(hour);
    });

    // Calculate pattern strength
    const variance =
      hourlyAverages.reduce(
        (sum, item) => sum + Math.pow(item.average - averageValue, 2),
        0,
      ) / hourlyAverages.length;
    const strength = Math.min(1, Math.sqrt(variance) / averageValue);

    return {
      type: 'daily',
      strength,
      peaks,
      troughs,
    };
  }

  private static analyzeWeeklyPattern(
    dataPoints: CostDataPoint[],
  ): SeasonalAnalysis['patterns'][0] | null {
    // Group by day of week
    const dailyData = new Map<number, number[]>();

    dataPoints.forEach((point) => {
      const day = point.timestamp.getDay(); // 0 = Sunday, 6 = Saturday
      if (!dailyData.has(day)) {
        dailyData.set(day, []);
      }
      dailyData.get(day)!.push(point.cost);
    });

    if (dailyData.size < 5) return null; // Need reasonable coverage

    const dailyAverages = Array.from(dailyData.entries())
      .map(([day, costs]) => ({
        day,
        average: costs.reduce((sum, cost) => sum + cost, 0) / costs.length,
      }))
      .sort((a, b) => a.day - b.day);

    // Find peaks and troughs
    const peaks: number[] = [];
    const troughs: number[] = [];
    const averageValue =
      dailyAverages.reduce((sum, item) => sum + item.average, 0) /
      dailyAverages.length;

    dailyAverages.forEach(({ day, average }) => {
      if (average > averageValue * 1.15) peaks.push(day);
      if (average < averageValue * 0.85) troughs.push(day);
    });

    // Calculate pattern strength
    const variance =
      dailyAverages.reduce(
        (sum, item) => sum + Math.pow(item.average - averageValue, 2),
        0,
      ) / dailyAverages.length;
    const strength = Math.min(1, Math.sqrt(variance) / averageValue);

    return {
      type: 'weekly',
      strength,
      peaks,
      troughs,
    };
  }

  private static analyzeMonthlyPattern(
    dataPoints: CostDataPoint[],
  ): SeasonalAnalysis['patterns'][0] | null {
    // Group by day of month
    const dailyData = new Map<number, number[]>();

    dataPoints.forEach((point) => {
      const day = point.timestamp.getDate();
      if (!dailyData.has(day)) {
        dailyData.set(day, []);
      }
      dailyData.get(day)!.push(point.cost);
    });

    if (dailyData.size < 20) return null; // Need reasonable coverage

    const dailyAverages = Array.from(dailyData.entries())
      .map(([day, costs]) => ({
        day,
        average: costs.reduce((sum, cost) => sum + cost, 0) / costs.length,
      }))
      .sort((a, b) => a.day - b.day);

    // Find peaks and troughs
    const peaks: number[] = [];
    const troughs: number[] = [];
    const averageValue =
      dailyAverages.reduce((sum, item) => sum + item.average, 0) /
      dailyAverages.length;

    dailyAverages.forEach(({ day, average }) => {
      if (average > averageValue * 1.2) peaks.push(day);
      if (average < averageValue * 0.8) troughs.push(day);
    });

    // Calculate pattern strength
    const variance =
      dailyAverages.reduce(
        (sum, item) => sum + Math.pow(item.average - averageValue, 2),
        0,
      ) / dailyAverages.length;
    const strength = Math.min(1, Math.sqrt(variance) / averageValue);

    return {
      type: 'monthly',
      strength,
      peaks,
      troughs,
    };
  }

  private static removeSeasonality(
    dataPoints: CostDataPoint[],
    patterns: SeasonalAnalysis['patterns'],
  ): CostDataPoint[] {
    // Simple deseasonalization by removing detected patterns
    return dataPoints.map((point) => {
      let adjustedCost = point.cost;

      patterns.forEach((pattern) => {
        // Apply seasonal adjustment based on pattern type
        const adjustment = this.calculateSeasonalAdjustment(
          point.timestamp,
          pattern,
        );
        adjustedCost -= adjustment;
      });

      return {
        ...point,
        cost: Math.max(0, adjustedCost), // Ensure non-negative
      };
    });
  }

  private static calculateSeasonalAdjustment(
    timestamp: Date,
    pattern: SeasonalAnalysis['patterns'][0],
  ): number {
    // Simplified seasonal adjustment calculation
    const baseAdjustment = 0.1; // 10% base seasonal effect

    switch (pattern.type) {
      case 'daily':
        const hour = timestamp.getHours();
        return pattern.peaks.includes(hour)
          ? baseAdjustment * pattern.strength
          : 0;

      case 'weekly':
        const day = timestamp.getDay();
        return pattern.peaks.includes(day)
          ? baseAdjustment * pattern.strength
          : 0;

      case 'monthly':
        const monthDay = timestamp.getDate();
        return pattern.peaks.includes(monthDay)
          ? baseAdjustment * pattern.strength
          : 0;

      default:
        return 0;
    }
  }

  private static detectVariancesZScore(
    dataPoints: CostDataPoint[],
    statistics: StatisticalMeasures,
  ): VarianceDetection['variances'] {
    const threshold = 2.5; // Z-score threshold for outlier detection
    const variances: VarianceDetection['variances'] = [];

    dataPoints.forEach((point) => {
      const zScore = Math.abs(
        (point.cost - statistics.mean) / statistics.standardDeviation,
      );

      if (zScore > threshold) {
        const deviation = point.cost - statistics.mean;
        const deviationPercentage =
          (Math.abs(deviation) / statistics.mean) * 100;

        variances.push({
          dataPoint: point,
          varianceScore: Math.min(1, zScore / 5), // Normalize to 0-1
          expectedValue: statistics.mean,
          deviation,
          deviationPercentage,
          varianceType: deviation > 0 ? 'spike' : 'drop',
          confidence: Math.min(0.95, zScore / 3),
        });
      }
    });

    return variances;
  }

  private static detectVariancesIQR(
    dataPoints: CostDataPoint[],
  ): VarianceDetection['variances'] {
    const costs = dataPoints.map((point) => point.cost).sort((a, b) => a - b);
    const n = costs.length;

    // Calculate quartiles
    const q1Index = Math.floor(n * 0.25);
    const q3Index = Math.floor(n * 0.75);
    const q1 = costs[q1Index];
    const q3 = costs[q3Index];
    const iqr = q3 - q1;

    // Calculate outlier bounds
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;

    const variances: VarianceDetection['variances'] = [];

    dataPoints.forEach((point) => {
      if (point.cost < lowerBound || point.cost > upperBound) {
        const expectedValue = (q1 + q3) / 2; // Use median of quartiles as expected
        const deviation = point.cost - expectedValue;
        const deviationPercentage = (Math.abs(deviation) / expectedValue) * 100;

        variances.push({
          dataPoint: point,
          varianceScore: Math.min(1, Math.abs(deviation) / (2 * iqr)),
          expectedValue,
          deviation,
          deviationPercentage,
          varianceType: deviation > 0 ? 'spike' : 'drop',
          confidence: 0.8,
        });
      }
    });

    return variances;
  }

  private static detectVariancesMovingAverageDeviation(
    dataPoints: CostDataPoint[],
  ): VarianceDetection['variances'] {
    const windowSize = Math.min(7, Math.floor(dataPoints.length / 3)); // Adaptive window size
    if (dataPoints.length < windowSize + 1) return [];

    const sortedPoints = [...dataPoints].sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime(),
    );
    const variances: VarianceDetection['variances'] = [];

    for (let i = windowSize; i < sortedPoints.length; i++) {
      const window = sortedPoints.slice(i - windowSize, i);
      const windowAverage =
        window.reduce((sum, point) => sum + point.cost, 0) / windowSize;
      const windowStdDev = Math.sqrt(
        window.reduce(
          (sum, point) => sum + Math.pow(point.cost - windowAverage, 2),
          0,
        ) / windowSize,
      );

      const currentPoint = sortedPoints[i];
      const deviation = currentPoint.cost - windowAverage;
      const zScore = windowStdDev > 0 ? Math.abs(deviation / windowStdDev) : 0;

      if (zScore > 2) {
        const deviationPercentage = (Math.abs(deviation) / windowAverage) * 100;

        variances.push({
          dataPoint: currentPoint,
          varianceScore: Math.min(1, zScore / 4),
          expectedValue: windowAverage,
          deviation,
          deviationPercentage,
          varianceType: deviation > 0 ? 'spike' : 'drop',
          confidence: Math.min(0.9, zScore / 3),
        });
      }
    }

    return variances;
  }

  private static detectVariancesIsolationForest(
    dataPoints: CostDataPoint[],
  ): VarianceDetection['variances'] {
    // Simplified isolation forest implementation
    // In a real implementation, you would use a more sophisticated algorithm
    const variances: VarianceDetection['variances'] = [];

    if (dataPoints.length < 10) return variances;

    const statistics = this.calculateStatistics(dataPoints);
    const threshold = statistics.mean + 2.5 * statistics.standardDeviation;

    dataPoints.forEach((point) => {
      // Simplified anomaly score based on distance from mean
      const distanceFromMean = Math.abs(point.cost - statistics.mean);
      const anomalyScore =
        distanceFromMean / (statistics.standardDeviation + 0.001); // Avoid division by zero

      if (anomalyScore > 2.5) {
        const deviation = point.cost - statistics.mean;
        const deviationPercentage =
          (Math.abs(deviation) / statistics.mean) * 100;

        variances.push({
          dataPoint: point,
          varianceScore: Math.min(1, anomalyScore / 5),
          expectedValue: statistics.mean,
          deviation,
          deviationPercentage,
          varianceType:
            Math.abs(deviation) > statistics.standardDeviation
              ? 'outlier'
              : 'drift',
          confidence: Math.min(0.85, anomalyScore / 4),
        });
      }
    });

    return variances;
  }
}
