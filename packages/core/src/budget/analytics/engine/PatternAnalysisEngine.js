/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { getLogger } from '../../../logging/index.js';

/**
 * Advanced pattern analysis engine for detecting complex usage patterns in budget data
 * Provides intelligent insights into user behavior, system usage, and cost optimization opportunities
 */
export class PatternAnalysisEngine {
  /**
   * Logger instance for comprehensive debugging and monitoring
   * @type {import('../../../logging/index.js').Logger}
   */
  logger;

  /**
   * Configuration for pattern analysis parameters
   * @type {Object}
   */
  config;

  /**
   * Constructor for PatternAnalysisEngine
   * @param {Object} config - Configuration options for pattern analysis
   */
  constructor(config = {}) {
    this.logger = getLogger('PatternAnalysisEngine');
    this.config = {
      // Statistical analysis parameters
      confidenceThreshold: 0.7,
      minimumDataPoints: 10,
      seasonalityWindow: 7, // days
      trendAnalysisWindow: 30, // days

      // Pattern detection sensitivity
      spikeThreshold: 2.5, // standard deviations
      periodicityThreshold: 0.6,
      businessHoursThreshold: 0.8,

      // Advanced analysis options
      enableMachineLearning: true,
      enablePredictiveAnalysis: true,
      enableCrossCorrelation: true,

      ...config,
    };

    this.logger.info('PatternAnalysisEngine initialized', {
      config: this.config,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Analyze comprehensive usage patterns from metrics data
   * @param {Array} metrics - Array of usage metrics with timestamps, costs, features, users
   * @returns {Promise<Object>} Comprehensive pattern analysis results
   */
  async analyzePatterns(metrics) {
    const startTime = Date.now();
    this.logger.info('Starting comprehensive pattern analysis', {
      metricsCount: metrics.length,
      dateRange: this.getDateRange(metrics),
    });

    try {
      // Validate input data
      const validatedMetrics = this.validateMetrics(metrics);
      if (validatedMetrics.length < this.config.minimumDataPoints) {
        this.logger.warn('Insufficient data for pattern analysis', {
          available: validatedMetrics.length,
          required: this.config.minimumDataPoints,
        });
        return this.createEmptyAnalysis();
      }

      // Group metrics by different time windows for analysis
      const timeGroupings = await this.createTimeGroupings(validatedMetrics);

      // Perform multiple types of pattern analysis
      const analysisResults = await Promise.all([
        this.detectUsageSpikes(timeGroupings, validatedMetrics),
        this.analyzePeriodicPatterns(timeGroupings, validatedMetrics),
        this.detectBusinessHoursPatterns(timeGroupings, validatedMetrics),
        this.analyzeSeasonalTrends(timeGroupings, validatedMetrics),
        this.detectUserBehaviorPatterns(validatedMetrics),
        this.analyzeFeatureUsagePatterns(validatedMetrics),
        this.detectCostEfficiencyPatterns(validatedMetrics),
        this.analyzeGeographicPatterns(validatedMetrics),
        this.detectAnomalousPatterns(validatedMetrics),
      ]);

      // Combine and cross-reference patterns
      const consolidatedPatterns =
        await this.consolidatePatterns(analysisResults);

      // Generate pattern insights and recommendations
      const insights = await this.generatePatternInsights(
        consolidatedPatterns,
        validatedMetrics,
      );

      // Calculate pattern confidence scores
      const scoredPatterns = await this.calculateConfidenceScores(
        consolidatedPatterns,
        validatedMetrics,
      );

      const executionTime = Date.now() - startTime;
      this.logger.info('Pattern analysis completed', {
        executionTime: `${executionTime}ms`,
        patternsFound: scoredPatterns.length,
        highConfidencePatterns: scoredPatterns.filter(
          (p) => p.confidence >= this.config.confidenceThreshold,
        ).length,
      });

      return {
        analysisTimestamp: new Date().toISOString(),
        executionTimeMs: executionTime,
        metricsAnalyzed: validatedMetrics.length,
        dateRange: this.getDateRange(validatedMetrics),
        patterns: scoredPatterns,
        insights: insights,
        recommendations: await this.generatePatternRecommendations(
          scoredPatterns,
          insights,
        ),
        metadata: {
          analysisConfig: this.config,
          dataQuality: this.assessDataQuality(validatedMetrics),
          statisticalSummary: this.generateStatisticalSummary(validatedMetrics),
        },
      };
    } catch (error) {
      this.logger.error('Pattern analysis failed', {
        error: error.message,
        stack: error.stack,
        executionTime: `${Date.now() - startTime}ms`,
      });
      throw new Error(`Pattern analysis failed: ${error.message}`);
    }
  }

  /**
   * Detect usage spikes in the data
   * @param {Object} timeGroupings - Metrics grouped by time windows
   * @param {Array} metrics - Raw metrics data
   * @returns {Promise<Array>} Array of spike patterns
   */
  async detectUsageSpikes(timeGroupings, metrics) {
    this.logger.debug('Detecting usage spikes');

    const spikes = [];
    const costStats = this.calculateStatistics(metrics.map((m) => m.cost));
    const volumeStats = this.calculateStatistics(metrics.map((m) => 1)); // Request count

    // Analyze hourly groupings for spikes
    for (const [hour, hourMetrics] of timeGroupings.hourly.entries()) {
      const hourCost = hourMetrics.reduce((sum, m) => sum + m.cost, 0);
      const hourVolume = hourMetrics.length;

      // Cost spike detection
      if (
        hourCost >
        costStats.mean + this.config.spikeThreshold * costStats.stdDev
      ) {
        spikes.push({
          type: 'cost_spike',
          severity: this.calculateSpikeSeverity(hourCost, costStats),
          timestamp: hour,
          duration: '1 hour',
          metrics: {
            value: hourCost,
            baseline: costStats.mean,
            deviation: (hourCost - costStats.mean) / costStats.stdDev,
          },
          affectedFeatures: [
            ...new Set(hourMetrics.map((m) => m.feature)),
          ].filter((f) => f),
          confidence: 0.9,
          patternType: 'spike',
        });
      }

      // Volume spike detection
      if (
        hourVolume >
        volumeStats.mean + this.config.spikeThreshold * volumeStats.stdDev
      ) {
        spikes.push({
          type: 'volume_spike',
          severity: this.calculateSpikeSeverity(hourVolume, volumeStats),
          timestamp: hour,
          duration: '1 hour',
          metrics: {
            value: hourVolume,
            baseline: volumeStats.mean,
            deviation: (hourVolume - volumeStats.mean) / volumeStats.stdDev,
          },
          affectedFeatures: [
            ...new Set(hourMetrics.map((m) => m.feature)),
          ].filter((f) => f),
          confidence: 0.9,
          patternType: 'spike',
        });
      }
    }

    this.logger.debug('Spike detection completed', {
      spikesFound: spikes.length,
    });
    return spikes;
  }

  /**
   * Analyze periodic patterns in usage data
   * @param {Object} timeGroupings - Metrics grouped by time windows
   * @param {Array} metrics - Raw metrics data
   * @returns {Promise<Array>} Array of periodic patterns
   */
  async analyzePeriodicPatterns(timeGroupings, metrics) {
    this.logger.debug('Analyzing periodic patterns');

    const patterns = [];

    // Daily periodicity analysis
    const dailyPattern = await this.analyzeDailyPeriodicity(
      timeGroupings.daily,
    );
    if (
      dailyPattern &&
      dailyPattern.confidence >= this.config.periodicityThreshold
    ) {
      patterns.push(dailyPattern);
    }

    // Weekly periodicity analysis
    const weeklyPattern = await this.analyzeWeeklyPeriodicity(
      timeGroupings.daily,
    );
    if (
      weeklyPattern &&
      weeklyPattern.confidence >= this.config.periodicityThreshold
    ) {
      patterns.push(weeklyPattern);
    }

    // Hourly periodicity within days
    const hourlyPattern = await this.analyzeHourlyPeriodicity(
      timeGroupings.hourly,
    );
    if (
      hourlyPattern &&
      hourlyPattern.confidence >= this.config.periodicityThreshold
    ) {
      patterns.push(hourlyPattern);
    }

    this.logger.debug('Periodic pattern analysis completed', {
      patternsFound: patterns.length,
    });
    return patterns;
  }

  /**
   * Detect business hours patterns
   * @param {Object} timeGroupings - Metrics grouped by time windows
   * @param {Array} metrics - Raw metrics data
   * @returns {Promise<Object|null>} Business hours pattern or null
   */
  async detectBusinessHoursPatterns(timeGroupings, metrics) {
    this.logger.debug('Detecting business hours patterns');

    const businessHours = { start: 9, end: 17 }; // 9 AM to 5 PM
    const businessHourMetrics = [];
    const offHourMetrics = [];

    for (const metric of metrics) {
      const hour = new Date(metric.timestamp).getHours();
      if (hour >= businessHours.start && hour <= businessHours.end) {
        businessHourMetrics.push(metric);
      } else {
        offHourMetrics.push(metric);
      }
    }

    if (businessHourMetrics.length === 0 && offHourMetrics.length === 0) {
      return null;
    }

    const businessHoursCost = businessHourMetrics.reduce(
      (sum, m) => sum + m.cost,
      0,
    );
    const offHoursCost = offHourMetrics.reduce((sum, m) => sum + m.cost, 0);
    const totalCost = businessHoursCost + offHoursCost;

    const businessHoursRatio =
      totalCost > 0 ? businessHoursCost / totalCost : 0;

    if (businessHoursRatio >= this.config.businessHoursThreshold) {
      return {
        type: 'business_hours_concentration',
        patternType: 'business_hours',
        confidence: businessHoursRatio,
        metrics: {
          businessHoursCost,
          offHoursCost,
          businessHoursRatio,
          businessHoursRequests: businessHourMetrics.length,
          offHoursRequests: offHourMetrics.length,
        },
        recommendation:
          'Consider off-peak scheduling for non-critical operations',
        potentialSavings: businessHoursCost * 0.15, // Estimated 15% savings
        affectedFeatures: [
          ...new Set(businessHourMetrics.map((m) => m.feature)),
        ].filter((f) => f),
      };
    }

    return null;
  }

  /**
   * Create time groupings for analysis
   * @param {Array} metrics - Raw metrics data
   * @returns {Promise<Object>} Grouped metrics by different time windows
   */
  async createTimeGroupings(metrics) {
    const groupings = {
      hourly: new Map(),
      daily: new Map(),
      weekly: new Map(),
      monthly: new Map(),
    };

    for (const metric of metrics) {
      const timestamp = new Date(metric.timestamp);

      // Hourly grouping
      const hourKey = `${timestamp.getFullYear()}-${(timestamp.getMonth() + 1).toString().padStart(2, '0')}-${timestamp.getDate().toString().padStart(2, '0')} ${timestamp.getHours().toString().padStart(2, '0')}:00`;
      if (!groupings.hourly.has(hourKey)) {
        groupings.hourly.set(hourKey, []);
      }
      groupings.hourly.get(hourKey).push(metric);

      // Daily grouping
      const dayKey = `${timestamp.getFullYear()}-${(timestamp.getMonth() + 1).toString().padStart(2, '0')}-${timestamp.getDate().toString().padStart(2, '0')}`;
      if (!groupings.daily.has(dayKey)) {
        groupings.daily.set(dayKey, []);
      }
      groupings.daily.get(dayKey).push(metric);

      // Weekly grouping (ISO week)
      const weekKey = this.getISOWeek(timestamp);
      if (!groupings.weekly.has(weekKey)) {
        groupings.weekly.set(weekKey, []);
      }
      groupings.weekly.get(weekKey).push(metric);

      // Monthly grouping
      const monthKey = `${timestamp.getFullYear()}-${(timestamp.getMonth() + 1).toString().padStart(2, '0')}`;
      if (!groupings.monthly.has(monthKey)) {
        groupings.monthly.set(monthKey, []);
      }
      groupings.monthly.get(monthKey).push(metric);
    }

    return groupings;
  }

  /**
   * Validate and clean metrics data
   * @param {Array} metrics - Raw metrics data
   * @returns {Array} Validated metrics
   */
  validateMetrics(metrics) {
    if (!Array.isArray(metrics)) {
      this.logger.warn('Invalid metrics input: not an array');
      return [];
    }

    return metrics.filter((metric) => {
      // Check required fields
      if (
        !metric.timestamp ||
        typeof metric.cost !== 'number' ||
        isNaN(metric.cost)
      ) {
        return false;
      }

      // Validate timestamp
      const timestamp = new Date(metric.timestamp);
      if (isNaN(timestamp.getTime())) {
        return false;
      }

      // Check for reasonable cost values
      if (metric.cost < 0 || metric.cost > 1000) {
        // Assuming max reasonable cost is $1000
        return false;
      }

      return true;
    });
  }

  /**
   * Calculate basic statistics for a dataset
   * @param {Array<number>} data - Numerical data array
   * @returns {Object} Statistics object with mean, stdDev, min, max, etc.
   */
  calculateStatistics(data) {
    if (!data || data.length === 0) {
      return { mean: 0, stdDev: 0, min: 0, max: 0, count: 0 };
    }

    const count = data.length;
    const sum = data.reduce((acc, val) => acc + val, 0);
    const mean = sum / count;

    const variance =
      data.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / count;
    const stdDev = Math.sqrt(variance);

    const min = Math.min(...data);
    const max = Math.max(...data);

    // Calculate percentiles
    const sorted = [...data].sort((a, b) => a - b);
    const median = sorted[Math.floor(count / 2)];
    const q1 = sorted[Math.floor(count * 0.25)];
    const q3 = sorted[Math.floor(count * 0.75)];

    return { mean, stdDev, min, max, count, sum, median, q1, q3, variance };
  }

  /**
   * Get date range from metrics
   * @param {Array} metrics - Metrics data
   * @returns {Object} Date range object
   */
  getDateRange(metrics) {
    if (!metrics || metrics.length === 0) {
      return { start: null, end: null, days: 0 };
    }

    const timestamps = metrics
      .map((m) => new Date(m.timestamp).getTime())
      .filter((t) => !isNaN(t));
    if (timestamps.length === 0) {
      return { start: null, end: null, days: 0 };
    }

    const start = new Date(Math.min(...timestamps));
    const end = new Date(Math.max(...timestamps));
    const days =
      Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    return {
      start: start.toISOString(),
      end: end.toISOString(),
      days,
    };
  }

  /**
   * Create empty analysis result
   * @returns {Object} Empty analysis structure
   */
  createEmptyAnalysis() {
    return {
      analysisTimestamp: new Date().toISOString(),
      executionTimeMs: 0,
      metricsAnalyzed: 0,
      dateRange: { start: null, end: null, days: 0 },
      patterns: [],
      insights: [],
      recommendations: [],
      metadata: {
        analysisConfig: this.config,
        dataQuality: { score: 0, issues: ['Insufficient data'] },
        statisticalSummary: {},
      },
    };
  }

  // Additional helper methods with placeholder implementations to be expanded

  async analyzeSeasonalTrends(timeGroupings, metrics) {
    // Placeholder for seasonal trend analysis
    return [];
  }

  async detectUserBehaviorPatterns(metrics) {
    // Placeholder for user behavior pattern detection
    return [];
  }

  async analyzeFeatureUsagePatterns(metrics) {
    // Placeholder for feature usage pattern analysis
    return [];
  }

  async detectCostEfficiencyPatterns(metrics) {
    // Placeholder for cost efficiency pattern detection
    return [];
  }

  async analyzeGeographicPatterns(metrics) {
    // Placeholder for geographic pattern analysis
    return [];
  }

  async detectAnomalousPatterns(metrics) {
    // Placeholder for anomalous pattern detection
    return [];
  }

  async consolidatePatterns(analysisResults) {
    // Flatten all patterns from different analysis types
    return analysisResults
      .flat()
      .filter((pattern) => pattern !== null && pattern !== undefined);
  }

  async generatePatternInsights(patterns, metrics) {
    // Placeholder for generating insights from patterns
    return [];
  }

  async calculateConfidenceScores(patterns, metrics) {
    // Return patterns with confidence scores (already included in most patterns)
    return patterns.filter(
      (pattern) => pattern.confidence >= this.config.confidenceThreshold,
    );
  }

  async generatePatternRecommendations(patterns, insights) {
    // Placeholder for generating recommendations from patterns
    return [];
  }

  assessDataQuality(metrics) {
    const totalMetrics = metrics.length;
    const validTimestamps = metrics.filter(
      (m) => !isNaN(new Date(m.timestamp).getTime()),
    ).length;
    const validCosts = metrics.filter(
      (m) => typeof m.cost === 'number' && !isNaN(m.cost),
    ).length;
    const hasFeatureInfo = metrics.filter(
      (m) => m.feature && m.feature.length > 0,
    ).length;
    const hasUserInfo = metrics.filter(
      (m) => m.user && m.user.length > 0,
    ).length;

    const score =
      totalMetrics > 0
        ? (validTimestamps + validCosts + hasFeatureInfo + hasUserInfo) /
          (totalMetrics * 4)
        : 0;

    const issues = [];
    if (validTimestamps < totalMetrics)
      issues.push('Invalid timestamps detected');
    if (validCosts < totalMetrics) issues.push('Invalid cost values detected');
    if (hasFeatureInfo < totalMetrics * 0.8)
      issues.push('Missing feature information');
    if (hasUserInfo < totalMetrics * 0.5)
      issues.push('Limited user information');

    return { score, issues };
  }

  generateStatisticalSummary(metrics) {
    const costs = metrics.map((m) => m.cost);
    const costStats = this.calculateStatistics(costs);

    const uniqueFeatures = new Set(
      metrics.map((m) => m.feature).filter((f) => f),
    ).size;
    const uniqueUsers = new Set(metrics.map((m) => m.user).filter((u) => u))
      .size;

    return {
      totalMetrics: metrics.length,
      dateRange: this.getDateRange(metrics),
      costStatistics: costStats,
      uniqueFeatures,
      uniqueUsers,
      averageCostPerRequest: costStats.mean,
    };
  }

  calculateSpikeSeverity(value, stats) {
    const deviation =
      Math.abs(value - stats.mean) / Math.max(stats.stdDev, 0.01);
    if (deviation >= 4) return 'critical';
    if (deviation >= 3) return 'high';
    if (deviation >= 2) return 'medium';
    return 'low';
  }

  async analyzeDailyPeriodicity(dailyGroupings) {
    // Placeholder implementation
    return null;
  }

  async analyzeWeeklyPeriodicity(dailyGroupings) {
    // Placeholder implementation
    return null;
  }

  async analyzeHourlyPeriodicity(hourlyGroupings) {
    // Placeholder implementation
    return null;
  }

  getISOWeek(date) {
    const target = new Date(date.valueOf());
    const dayNr = (date.getDay() + 6) % 7;
    target.setDate(target.getDate() - dayNr + 3);
    const firstThursday = target.valueOf();
    target.setMonth(0, 1);
    if (target.getDay() !== 4) {
      target.setMonth(0, 1 + ((4 - target.getDay() + 7) % 7));
    }
    const weekNumber = 1 + Math.ceil((firstThursday - target) / 604800000);
    return `${target.getFullYear()}-W${weekNumber.toString().padStart(2, '0')}`;
  }
}

/**
 * Factory function to create a PatternAnalysisEngine instance
 * @param {Object} config - Configuration options
 * @returns {PatternAnalysisEngine} New engine instance
 */
export function createPatternAnalysisEngine(config) {
  return new PatternAnalysisEngine(config);
}
