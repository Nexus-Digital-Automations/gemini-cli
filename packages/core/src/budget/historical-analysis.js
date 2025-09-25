/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
/**
 * Historical data analysis system for budget trends and forecasting
 */
export class HistoricalBudgetAnalyzer {
  projectRoot;
  historicalDataPath;
  maxHistoryDays;
  anomalyThreshold;
  constructor(projectRoot, options = {}) {
    this.projectRoot = projectRoot;
    this.historicalDataPath = path.join(
      projectRoot,
      '.gemini',
      'budget-history.json',
    );
    this.maxHistoryDays = options.maxHistoryDays ?? 365; // Keep 1 year by default
    this.anomalyThreshold = options.anomalyThreshold ?? 2.0; // Z-score threshold
  }
  /**
   * Record daily usage data for historical analysis
   */
  async recordDailyUsage(usageData, settings) {
    const historicalRecords = await this.loadHistoricalData();
    const date = usageData.date;
    const usage = usageData.requestCount;
    const limit = settings.dailyLimit ?? 0;
    // Check if record already exists for this date
    const existingIndex = historicalRecords.findIndex(
      (record) => record.date === date,
    );
    const dateObj = new Date(date);
    const record = {
      date,
      dailyUsage: usage,
      dailyLimit: limit,
      usagePercentage: limit > 0 ? (usage / limit) * 100 : 0,
      resetTime: usageData.lastResetTime,
      dayOfWeek: dateObj.getDay(),
      weekOfYear: this.getWeekOfYear(dateObj),
      month: dateObj.getMonth() + 1,
      quarter: Math.ceil((dateObj.getMonth() + 1) / 3),
      year: dateObj.getFullYear(),
      isWeekend: dateObj.getDay() === 0 || dateObj.getDay() === 6,
      seasonalCategory: this.categorizeSeasonalUsage(usage, settings),
      metadata: {},
    };
    if (existingIndex >= 0) {
      historicalRecords[existingIndex] = record;
    } else {
      historicalRecords.push(record);
    }
    // Sort by date and trim old records
    historicalRecords.sort((a, b) => a.date.localeCompare(b.date));
    // Remove records older than maxHistoryDays
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.maxHistoryDays);
    const cutoffDateString = cutoffDate.toISOString().split('T')[0];
    const trimmedRecords = historicalRecords.filter(
      (record) => record.date >= cutoffDateString,
    );
    await this.saveHistoricalData(trimmedRecords);
  }
  /**
   * Analyze trends in historical budget usage
   */
  async analyzeTrends(lookbackDays = 30) {
    const historicalRecords = await this.loadHistoricalData();
    if (historicalRecords.length < 7) {
      throw new Error(
        'Insufficient historical data for trend analysis (minimum 7 days required)',
      );
    }
    // Filter to lookback period
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - lookbackDays);
    const cutoffDateString = cutoffDate.toISOString().split('T')[0];
    const recentRecords = historicalRecords
      .filter((record) => record.date >= cutoffDateString)
      .sort((a, b) => a.date.localeCompare(b.date));
    if (recentRecords.length < 7) {
      throw new Error(
        `Insufficient data in lookback period (${recentRecords.length} days, minimum 7 required)`,
      );
    }
    // Calculate trend using linear regression
    const usageValues = recentRecords.map((record) => record.dailyUsage);
    const trend = this.calculateTrend(usageValues);
    // Calculate seasonal patterns
    const seasonalPattern = this.calculateSeasonalPatterns(recentRecords);
    // Calculate volatility
    const avgUsage =
      usageValues.reduce((sum, val) => sum + val, 0) / usageValues.length;
    const volatility = Math.sqrt(
      usageValues.reduce((sum, val) => sum + Math.pow(val - avgUsage, 2), 0) /
        usageValues.length,
    );
    // Detect cyclicality
    const cyclicality = this.detectCyclicality(recentRecords);
    // Project future usage based on trend and seasonality
    const projectedUsage = this.projectUsage(recentRecords, trend);
    return {
      trend: this.classifyTrend(trend.slope),
      trendStrength: Math.min(Math.abs(trend.slope) / avgUsage, 1),
      confidence: trend.rSquared,
      seasonalPattern,
      averageDailyUsage: avgUsage,
      projectedUsage,
      volatility,
      cyclicality,
    };
  }
  /**
   * Generate budget forecasts for future periods
   */
  async generateForecast(targetDate, confidence = 0.95, settings) {
    const trendAnalysis = await this.analyzeTrends();
    const historicalRecords = await this.loadHistoricalData();
    if (historicalRecords.length < 14) {
      throw new Error(
        'Insufficient historical data for forecasting (minimum 14 days required)',
      );
    }
    const targetDateObj = new Date(targetDate);
    const today = new Date();
    const daysAhead = Math.ceil(
      (targetDateObj.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    );
    if (daysAhead <= 0) {
      throw new Error('Target date must be in the future');
    }
    if (daysAhead > 90) {
      throw new Error('Forecasting beyond 90 days is not reliable');
    }
    // Base forecast on trend
    const baselineForecast = trendAnalysis.projectedUsage;
    // Apply seasonal adjustments
    const seasonalAdjustment = this.calculateSeasonalAdjustment(
      targetDateObj,
      trendAnalysis,
    );
    const trendAdjustment = this.calculateTrendAdjustment(
      daysAhead,
      trendAnalysis,
    );
    let forecastUsage = baselineForecast + seasonalAdjustment + trendAdjustment;
    forecastUsage = Math.max(0, forecastUsage); // Ensure non-negative
    // Calculate confidence intervals
    const forecastVariance = this.calculateForecastVariance(
      daysAhead,
      trendAnalysis,
      historicalRecords,
    );
    const zScore = this.getZScore(confidence);
    const margin = zScore * Math.sqrt(forecastVariance);
    // Generate scenarios
    const optimisticMultiplier = 0.8;
    const pessimisticMultiplier = 1.3;
    const scenarios = {
      optimistic: Math.max(0, forecastUsage * optimisticMultiplier),
      realistic: forecastUsage,
      pessimistic: forecastUsage * pessimisticMultiplier,
    };
    // Risk assessment
    const currentLimit = settings?.dailyLimit ?? 0;
    const overageRisk = this.calculateOverageRisk(
      forecastUsage,
      forecastVariance,
      currentLimit,
    );
    const riskSeverity = this.assessRiskSeverity(overageRisk);
    // Recommend optimal limit
    const recommendedLimit = Math.ceil(scenarios.pessimistic * 1.1); // 10% buffer over pessimistic
    return {
      targetDate,
      forecastUsage,
      confidenceInterval: {
        lower: Math.max(0, forecastUsage - margin),
        upper: forecastUsage + margin,
        confidence,
      },
      scenarios,
      recommendedLimit,
      riskAssessment: {
        overageRisk,
        severity: riskSeverity,
        mitigation: this.generateMitigationStrategies(
          riskSeverity,
          overageRisk,
        ),
      },
      seasonalAdjustment,
      trendAdjustment,
    };
  }
  /**
   * Detect anomalies in usage patterns
   */
  async detectAnomalies(lookbackDays = 30) {
    const historicalRecords = await this.loadHistoricalData();
    if (historicalRecords.length < 14) {
      return []; // Need sufficient data for anomaly detection
    }
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - lookbackDays);
    const cutoffDateString = cutoffDate.toISOString().split('T')[0];
    const recentRecords = historicalRecords
      .filter((record) => record.date >= cutoffDateString)
      .sort((a, b) => a.date.localeCompare(b.date));
    const anomalies = [];
    // Calculate moving average and standard deviation for comparison
    const windowSize = Math.min(7, Math.floor(recentRecords.length / 2));
    for (let i = windowSize; i < recentRecords.length; i++) {
      const record = recentRecords[i];
      const window = recentRecords.slice(i - windowSize, i);
      const windowAvg =
        window.reduce((sum, r) => sum + r.dailyUsage, 0) / window.length;
      const windowStd = Math.sqrt(
        window.reduce(
          (sum, r) => sum + Math.pow(r.dailyUsage - windowAvg, 2),
          0,
        ) / window.length,
      );
      const zScore =
        windowStd > 0 ? (record.dailyUsage - windowAvg) / windowStd : 0;
      const anomalyScore = Math.abs(zScore);
      if (anomalyScore >= this.anomalyThreshold) {
        const anomaly = this.classifyAnomaly(
          record,
          windowAvg,
          zScore,
          anomalyScore,
        );
        anomalies.push(anomaly);
        // Update historical record with anomaly score
        const historicalIndex = historicalRecords.findIndex(
          (r) => r.date === record.date,
        );
        if (historicalIndex >= 0) {
          historicalRecords[historicalIndex].anomalyScore = anomalyScore;
        }
      }
    }
    // Save updated historical data with anomaly scores
    await this.saveHistoricalData(historicalRecords);
    return anomalies.sort((a, b) => b.anomalyScore - a.anomalyScore);
  }
  /**
   * Get comprehensive historical insights and recommendations
   */
  async getHistoricalInsights(lookbackDays = 90) {
    const historicalRecords = await this.loadHistoricalData();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - lookbackDays);
    const cutoffDateString = cutoffDate.toISOString().split('T')[0];
    const recentRecords = historicalRecords
      .filter((record) => record.date >= cutoffDateString)
      .sort((a, b) => a.date.localeCompare(b.date));
    if (recentRecords.length < 7) {
      throw new Error('Insufficient historical data for insights generation');
    }
    // Calculate summary statistics
    const usageValues = recentRecords.map((r) => r.dailyUsage);
    const averageUsage =
      usageValues.reduce((sum, val) => sum + val, 0) / usageValues.length;
    const peakUsage = Math.max(...usageValues);
    const lowUsage = Math.min(...usageValues);
    // Find most active day and weekday
    const peakRecord = recentRecords.find((r) => r.dailyUsage === peakUsage);
    const weekdayUsage = Array(7).fill(0);
    const weekdayCounts = Array(7).fill(0);
    recentRecords.forEach((record) => {
      weekdayUsage[record.dayOfWeek] += record.dailyUsage;
      weekdayCounts[record.dayOfWeek]++;
    });
    const avgWeekdayUsage = weekdayUsage.map((sum, i) =>
      weekdayCounts[i] > 0 ? sum / weekdayCounts[i] : 0,
    );
    const mostActiveWeekdayIndex = avgWeekdayUsage.indexOf(
      Math.max(...avgWeekdayUsage),
    );
    const weekdayNames = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ];
    // Calculate efficiency
    const validLimits = recentRecords.filter((r) => r.dailyLimit > 0);
    const efficiency =
      validLimits.length > 0
        ? validLimits.reduce((sum, r) => sum + r.usagePercentage, 0) /
          validLimits.length
        : 0;
    // Get trends and anomalies
    const trends = await this.analyzeTrends(Math.min(lookbackDays, 30));
    const recentAnomalies = await this.detectAnomalies(14); // Last 2 weeks
    // Generate recommendations
    const recommendations = this.generateInsightRecommendations(
      recentRecords,
      trends,
      recentAnomalies,
      efficiency,
    );
    // Assess data quality
    const expectedDays = lookbackDays;
    const actualDays = recentRecords.length;
    const completeness = actualDays / expectedDays;
    const consistency = this.calculateDataConsistency(recentRecords);
    const reliability = (completeness + consistency) / 2;
    return {
      summary: {
        totalDays: recentRecords.length,
        averageUsage,
        peakUsage,
        lowUsage,
        mostActiveDay: peakRecord.date,
        mostActiveWeekday: weekdayNames[mostActiveWeekdayIndex],
        efficiency: efficiency / 100, // Convert to 0-1 scale
      },
      trends,
      recentAnomalies,
      recommendations,
      dataQuality: {
        completeness,
        consistency,
        reliability,
      },
    };
  }
  // Private helper methods
  async loadHistoricalData() {
    try {
      const data = await fs.readFile(this.historicalDataPath, 'utf-8');
      return JSON.parse(data);
    } catch (_error) {
      return [];
    }
  }
  async saveHistoricalData(records) {
    try {
      const dir = path.dirname(this.historicalDataPath);
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(
        this.historicalDataPath,
        JSON.stringify(records, null, 2),
      );
    } catch (error) {
      console.warn('Failed to save historical budget data:', error);
    }
  }
  categorizeSeasonalUsage(usage, settings) {
    const limit = settings.dailyLimit ?? 0;
    if (limit === 0) return 'medium';
    const percentage = (usage / limit) * 100;
    if (percentage < 25) return 'low';
    if (percentage < 50) return 'medium';
    if (percentage < 80) return 'high';
    return 'peak';
  }
  getWeekOfYear(date) {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear =
      (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  }
  calculateTrend(values) {
    const n = values.length;
    const xValues = Array.from({ length: n }, (_, i) => i);
    const sumX = xValues.reduce((sum, x) => sum + x, 0);
    const sumY = values.reduce((sum, y) => sum + y, 0);
    const sumXY = xValues.reduce((sum, x, i) => sum + x * values[i], 0);
    const sumXX = xValues.reduce((sum, x) => sum + x * x, 0);
    const sumYY = values.reduce((sum, y) => sum + y * y, 0);
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    // Calculate R-squared
    const yMean = sumY / n;
    const ssTotal = values.reduce((sum, y) => sum + Math.pow(y - yMean, 2), 0);
    const ssResidual = values.reduce((sum, y, i) => {
      const predicted = slope * i + intercept;
      return sum + Math.pow(y - predicted, 2);
    }, 0);
    const rSquared = ssTotal > 0 ? 1 - ssResidual / ssTotal : 0;
    return { slope, rSquared };
  }
  classifyTrend(slope) {
    const threshold = 0.1; // Adjust based on domain requirements
    if (slope > threshold) return 'increasing';
    if (slope < -threshold) return 'decreasing';
    return 'stable';
  }
  calculateSeasonalPatterns(records) {
    // Initialize arrays
    const weeklyUsage = Array(7).fill(0);
    const weeklyCounts = Array(7).fill(0);
    const monthlyUsage = Array(12).fill(0);
    const monthlyCounts = Array(12).fill(0);
    const quarterlyUsage = Array(4).fill(0);
    const quarterlyCounts = Array(4).fill(0);
    // Aggregate usage by time periods
    records.forEach((record) => {
      weeklyUsage[record.dayOfWeek] += record.dailyUsage;
      weeklyCounts[record.dayOfWeek]++;
      monthlyUsage[record.month - 1] += record.dailyUsage;
      monthlyCounts[record.month - 1]++;
      quarterlyUsage[record.quarter - 1] += record.dailyUsage;
      quarterlyCounts[record.quarter - 1]++;
    });
    // Calculate averages
    const weeklyPattern = weeklyUsage.map((sum, i) =>
      weeklyCounts[i] > 0 ? sum / weeklyCounts[i] : 0,
    );
    const monthlyPattern = monthlyUsage.map((sum, i) =>
      monthlyCounts[i] > 0 ? sum / monthlyCounts[i] : 0,
    );
    const quarterlyPattern = quarterlyUsage.map((sum, i) =>
      quarterlyCounts[i] > 0 ? sum / quarterlyCounts[i] : 0,
    );
    return { weeklyPattern, monthlyPattern, quarterlyPattern };
  }
  detectCyclicality(records) {
    if (records.length < 14) {
      return { detected: false };
    }
    const usageValues = records.map((r) => r.dailyUsage);
    // Simple autocorrelation-based cycle detection
    let maxCorrelation = 0;
    let bestPeriod = 0;
    for (
      let period = 2;
      period <= Math.floor(usageValues.length / 3);
      period++
    ) {
      const correlation = this.calculateAutocorrelation(usageValues, period);
      if (correlation > maxCorrelation) {
        maxCorrelation = correlation;
        bestPeriod = period;
      }
    }
    const detected = maxCorrelation > 0.3; // Threshold for cycle detection
    if (detected) {
      const amplitude = this.calculateAmplitude(usageValues, bestPeriod);
      return { detected: true, period: bestPeriod, amplitude };
    }
    return { detected: false };
  }
  calculateAutocorrelation(values, lag) {
    const n = values.length - lag;
    if (n <= 0) return 0;
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    let numerator = 0;
    let denominator = 0;
    for (let i = 0; i < n; i++) {
      numerator += (values[i] - mean) * (values[i + lag] - mean);
    }
    for (let i = 0; i < values.length; i++) {
      denominator += Math.pow(values[i] - mean, 2);
    }
    return denominator > 0 ? numerator / denominator : 0;
  }
  calculateAmplitude(values, period) {
    const cycles = Math.floor(values.length / period);
    if (cycles < 2) return 0;
    let totalAmplitude = 0;
    for (let cycle = 0; cycle < cycles; cycle++) {
      const cycleStart = cycle * period;
      const cycleEnd = Math.min(cycleStart + period, values.length);
      const cycleValues = values.slice(cycleStart, cycleEnd);
      const max = Math.max(...cycleValues);
      const min = Math.min(...cycleValues);
      totalAmplitude += max - min;
    }
    return totalAmplitude / cycles;
  }
  projectUsage(records, trend) {
    const recentUsage = records.slice(-7).map((r) => r.dailyUsage);
    const avgRecentUsage =
      recentUsage.reduce((sum, val) => sum + val, 0) / recentUsage.length;
    // Project forward by 1 day based on trend
    return Math.max(0, avgRecentUsage + trend.slope);
  }
  calculateSeasonalAdjustment(targetDate, analysis) {
    const dayOfWeek = targetDate.getDay();
    const month = targetDate.getMonth();
    const quarter = Math.floor(month / 3);
    // Combine seasonal effects
    const weeklyEffect = analysis.seasonalPattern.weeklyPattern[dayOfWeek] || 0;
    const monthlyEffect = analysis.seasonalPattern.monthlyPattern[month] || 0;
    const quarterlyEffect =
      analysis.seasonalPattern.quarterlyPattern[quarter] || 0;
    // Weight the effects (weekly has more impact than monthly/quarterly)
    const weightedAdjustment =
      weeklyEffect * 0.6 +
      monthlyEffect * 0.3 +
      quarterlyEffect * 0.1 -
      analysis.averageDailyUsage;
    return weightedAdjustment * 0.5; // Dampen the adjustment
  }
  calculateTrendAdjustment(daysAhead, analysis) {
    if (analysis.trend === 'stable') return 0;
    // Apply trend with diminishing effect over time
    const trendDirection = analysis.trend === 'increasing' ? 1 : -1;
    const trendMagnitude =
      analysis.trendStrength * analysis.averageDailyUsage * 0.1; // 10% max per day
    // Diminishing effect: stronger for near-term, weaker for far-term
    const timeDecay = Math.exp(-daysAhead / 30); // Decay over 30 days
    return trendDirection * trendMagnitude * daysAhead * timeDecay;
  }
  calculateForecastVariance(daysAhead, analysis, records) {
    // Base variance from historical volatility
    const baseVariance = Math.pow(analysis.volatility, 2);
    // Increase variance with forecast horizon
    const timeVariance = baseVariance * (1 + daysAhead * 0.1);
    // Adjust for trend uncertainty
    const trendVariance = (1 - analysis.confidence) * baseVariance;
    return timeVariance + trendVariance;
  }
  getZScore(confidence) {
    // Common z-scores for confidence intervals
    const zScores = {
      '0.90': 1.645,
      0.95: 1.96,
      0.99: 2.576,
    };
    const confidenceStr = confidence.toFixed(2);
    return zScores[confidenceStr] || 1.96; // Default to 95%
  }
  calculateOverageRisk(forecastUsage, variance, limit) {
    if (limit <= 0) return 0;
    // Calculate probability of exceeding limit using normal distribution
    const standardDeviation = Math.sqrt(variance);
    const zScore =
      standardDeviation > 0 ? (limit - forecastUsage) / standardDeviation : 0;
    // Convert z-score to probability (simplified normal CDF approximation)
    return Math.max(
      0,
      Math.min(1, 0.5 * (1 - Math.tanh(zScore * Math.sqrt(2 / Math.PI)))),
    );
  }
  assessRiskSeverity(overageRisk) {
    if (overageRisk < 0.1) return 'low';
    if (overageRisk < 0.3) return 'medium';
    if (overageRisk < 0.7) return 'high';
    return 'critical';
  }
  generateMitigationStrategies(severity, risk) {
    const strategies = [];
    if (severity === 'critical' || risk > 0.7) {
      strategies.push('Immediately increase daily budget limit');
      strategies.push('Implement strict usage monitoring and alerts');
      strategies.push('Review and optimize high-usage activities');
    }
    if (severity === 'high' || risk > 0.5) {
      strategies.push('Consider increasing budget limit');
      strategies.push('Set up early warning alerts at 50% usage');
      strategies.push('Schedule usage review meetings');
    }
    if (severity === 'medium' || risk > 0.2) {
      strategies.push('Monitor usage trends more closely');
      strategies.push('Consider usage optimization strategies');
    }
    strategies.push('Maintain historical data for better forecasting');
    return strategies;
  }
  classifyAnomaly(record, expectedUsage, zScore, anomalyScore) {
    const actualUsage = record.dailyUsage;
    let type;
    let description;
    let severity;
    // Classify anomaly type
    if (zScore > 0) {
      type = actualUsage > expectedUsage * 2 ? 'spike' : 'pattern_break';
      description = `Usage spike detected: ${actualUsage} vs expected ${expectedUsage.toFixed(1)}`;
    } else {
      type = actualUsage < expectedUsage * 0.1 ? 'drop' : 'pattern_break';
      description = `Usage drop detected: ${actualUsage} vs expected ${expectedUsage.toFixed(1)}`;
    }
    // Assess severity
    if (anomalyScore >= 4) severity = 'critical';
    else if (anomalyScore >= 3) severity = 'major';
    else if (anomalyScore >= 2.5) severity = 'moderate';
    else severity = 'minor';
    // Check for seasonal anomalies
    if (record.isWeekend && actualUsage > expectedUsage * 1.5) {
      type = 'seasonal_anomaly';
      description = `Unexpected weekend usage spike: ${actualUsage}`;
    }
    const confidence = Math.min(0.99, Math.max(0.5, (anomalyScore - 2) / 2));
    return {
      date: record.date,
      actualUsage,
      expectedUsage,
      anomalyScore,
      severity,
      type,
      description,
      confidence,
      suggestedAction: this.generateAnomalyAction(
        type,
        severity,
        actualUsage,
        expectedUsage,
      ),
    };
  }
  generateAnomalyAction(type, severity, actualUsage, expectedUsage) {
    if (type === 'spike' && severity === 'critical') {
      return 'Investigate unusual activity and consider temporary budget increase';
    }
    if (type === 'drop' && severity === 'major') {
      return 'Check for system issues or reduced team activity';
    }
    if (type === 'seasonal_anomaly') {
      return 'Review weekend usage patterns and update forecasting models';
    }
    if (severity === 'critical' || severity === 'major') {
      return 'Investigate root cause and adjust forecasting parameters';
    }
    return 'Monitor trend and update historical patterns if persistent';
  }
  generateInsightRecommendations(records, trends, anomalies, efficiency) {
    const recommendations = [];
    // Trend-based recommendations
    if (trends.trend === 'increasing' && trends.trendStrength > 0.5) {
      recommendations.push(
        'Usage is trending upward - consider increasing budget limits proactively',
      );
    }
    if (trends.volatility > trends.averageDailyUsage * 0.5) {
      recommendations.push(
        'High usage variability detected - implement more granular monitoring',
      );
    }
    // Efficiency recommendations
    if (efficiency < 30) {
      recommendations.push(
        'Low budget utilization - consider reducing limits or reallocating budget',
      );
    } else if (efficiency > 90) {
      recommendations.push(
        'High budget utilization - consider increasing limits to avoid constraints',
      );
    }
    // Seasonal pattern recommendations
    const { weeklyPattern } = trends.seasonalPattern;
    const maxWeekday = weeklyPattern.indexOf(Math.max(...weeklyPattern));
    const minWeekday = weeklyPattern.indexOf(Math.min(...weeklyPattern));
    if (weeklyPattern[maxWeekday] > weeklyPattern[minWeekday] * 2) {
      const days = [
        'Sunday',
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
      ];
      recommendations.push(
        `Strong weekly pattern detected - highest usage on ${days[maxWeekday]}, lowest on ${days[minWeekday]}`,
      );
    }
    // Anomaly-based recommendations
    if (anomalies.length > 3) {
      recommendations.push(
        'Multiple anomalies detected - review usage patterns and consider model recalibration',
      );
    }
    // Cyclicality recommendations
    if (trends.cyclicality.detected) {
      recommendations.push(
        `Cyclical pattern detected with ${trends.cyclicality.period}-day period - optimize budgets accordingly`,
      );
    }
    // Data quality recommendations
    if (records.length < 30) {
      recommendations.push(
        'Limited historical data - continue collecting data for better forecasting accuracy',
      );
    }
    return recommendations;
  }
  calculateDataConsistency(records) {
    if (records.length < 2) return 1;
    // Measure consistency in reporting (no missing days, reasonable values)
    let consistencyScore = 1;
    // Check for missing days
    const sortedRecords = records.sort((a, b) => a.date.localeCompare(b.date));
    let missingDays = 0;
    for (let i = 1; i < sortedRecords.length; i++) {
      const prevDate = new Date(sortedRecords[i - 1].date);
      const currDate = new Date(sortedRecords[i].date);
      const dayDiff = Math.floor(
        (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24),
      );
      if (dayDiff > 1) {
        missingDays += dayDiff - 1;
      }
    }
    const totalPossibleDays = records.length + missingDays;
    const completenessRatio = records.length / totalPossibleDays;
    // Check for data anomalies (extreme outliers that might indicate data issues)
    const usageValues = records.map((r) => r.dailyUsage);
    const median = this.calculateMedian(usageValues);
    const outliers = usageValues.filter((val) => val > median * 10 || val < 0);
    const outlierRatio = outliers.length / usageValues.length;
    consistencyScore = completenessRatio * (1 - outlierRatio * 0.5);
    return Math.max(0, Math.min(1, consistencyScore));
  }
  calculateMedian(values) {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
  }
}
/**
 * Create a new HistoricalBudgetAnalyzer instance
 */
export function createHistoricalBudgetAnalyzer(projectRoot, options) {
  return new HistoricalBudgetAnalyzer(projectRoot, options);
}
//# sourceMappingURL=historical-analysis.js.map
