/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { getLogger } from '../../../logging/index.js';

/**
 * Advanced anomaly detection engine using statistical analysis and machine learning techniques
 * to identify unusual patterns in usage data that may indicate issues or optimization opportunities
 */
export class AnomalyDetectionEngine {
  /**
   * Logger instance for comprehensive debugging and monitoring
   * @type {import('../../../logging/index.js').Logger}
   */
  logger;

  /**
   * Configuration for anomaly detection parameters
   * @type {Object}
   */
  config;

  /**
   * Historical baseline statistics for comparison
   * @type {Map<string, Object>}
   */
  baselineStats = new Map();

  /**
   * Constructor for AnomalyDetectionEngine
   * @param {Object} config - Configuration options for anomaly detection
   */
  constructor(config = {}) {
    this.logger = getLogger('AnomalyDetectionEngine');
    this.config = {
      // Statistical thresholds
      zScoreThreshold: 2.5, // Standard deviations for outlier detection
      percentileThreshold: 95, // Percentile for extreme value detection
      changeRateThreshold: 0.5, // 50% change rate threshold

      // Time windows for analysis
      baselineWindow: 14, // days for establishing baseline
      anomalyWindow: 1, // days for anomaly detection
      trendWindow: 7, // days for trend analysis

      // Detection sensitivity
      sensitivity: 'medium', // low, medium, high
      minDataPoints: 20, // minimum data points for analysis
      confidenceThreshold: 0.7,

      // Anomaly types to detect
      detectCostAnomalies: true,
      detectVolumeAnomalies: true,
      detectEfficiencyAnomalies: true,
      detectLatencyAnomalies: true,
      detectPatternDeviations: true,
      detectSeasonalAnomalies: true,

      // Machine learning options
      enableMLDetection: true,
      adaptiveThresholds: true,
      contextualAnalysis: true,

      ...config,
    };

    // Adjust thresholds based on sensitivity
    this.adjustSensitivityThresholds();

    this.logger.info('AnomalyDetectionEngine initialized', {
      config: this.config,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Detect anomalies in usage metrics
   * @param {Array} metrics - Array of usage metrics
   * @param {Object} options - Detection options
   * @returns {Promise<Object>} Anomaly detection results
   */
  async detectAnomalies(metrics, options = {}) {
    const startTime = Date.now();
    this.logger.info('Starting anomaly detection', {
      metricsCount: metrics.length,
      dateRange: this.getDateRange(metrics),
    });

    try {
      // Validate and prepare data
      const validatedMetrics = this.validateMetrics(metrics);
      if (validatedMetrics.length < this.config.minDataPoints) {
        this.logger.warn('Insufficient data for anomaly detection', {
          available: validatedMetrics.length,
          required: this.config.minDataPoints,
        });
        return this.createEmptyResults();
      }

      // Update baseline statistics
      await this.updateBaselines(validatedMetrics);

      // Perform different types of anomaly detection
      const detectionResults = await Promise.all([
        this.detectStatisticalAnomalies(validatedMetrics),
        this.detectTrendAnomalies(validatedMetrics),
        this.detectPatternAnomalies(validatedMetrics),
        this.detectContextualAnomalies(validatedMetrics),
        this.detectCollectiveAnomalies(validatedMetrics),
        this.detectSeasonalAnomalies(validatedMetrics),
      ]);

      // Consolidate and score anomalies
      const allAnomalies = this.consolidateAnomalies(detectionResults);
      const scoredAnomalies = await this.scoreAnomalies(
        allAnomalies,
        validatedMetrics,
      );

      // Filter by confidence threshold
      const significantAnomalies = scoredAnomalies.filter(
        (anomaly) => anomaly.confidence >= this.config.confidenceThreshold,
      );

      // Generate recommendations for anomalies
      const recommendations =
        await this.generateAnomalyRecommendations(significantAnomalies);

      const executionTime = Date.now() - startTime;
      this.logger.info('Anomaly detection completed', {
        executionTime: `${executionTime}ms`,
        totalAnomalies: allAnomalies.length,
        significantAnomalies: significantAnomalies.length,
      });

      return {
        detectionTimestamp: new Date().toISOString(),
        executionTimeMs: executionTime,
        metricsAnalyzed: validatedMetrics.length,
        anomalies: significantAnomalies,
        recommendations,
        summary: this.createAnomalySummary(significantAnomalies),
        metadata: {
          detectionConfig: this.config,
          dataQuality: this.assessDataQuality(validatedMetrics),
          baselineInfo: this.getBaselineInfo(),
        },
      };
    } catch (error) {
      this.logger.error('Anomaly detection failed', {
        error: error.message,
        stack: error.stack,
        executionTime: `${Date.now() - startTime}ms`,
      });
      throw new Error(`Anomaly detection failed: ${error.message}`);
    }
  }

  /**
   * Detect statistical anomalies using z-score and percentile analysis
   * @param {Array} metrics - Validated metrics
   * @returns {Promise<Array>} Statistical anomalies
   */
  async detectStatisticalAnomalies(metrics) {
    this.logger.debug('Detecting statistical anomalies');
    const anomalies = [];

    // Group metrics by time periods for analysis
    const timeGroups = this.groupMetricsByTime(metrics, 'hour');

    // Analyze cost anomalies
    if (this.config.detectCostAnomalies) {
      const costAnomalies = await this.detectCostStatisticalAnomalies(
        metrics,
        timeGroups,
      );
      anomalies.push(...costAnomalies);
    }

    // Analyze volume anomalies
    if (this.config.detectVolumeAnomalies) {
      const volumeAnomalies = await this.detectVolumeStatisticalAnomalies(
        metrics,
        timeGroups,
      );
      anomalies.push(...volumeAnomalies);
    }

    // Analyze efficiency anomalies
    if (this.config.detectEfficiencyAnomalies) {
      const efficiencyAnomalies =
        await this.detectEfficiencyStatisticalAnomalies(metrics, timeGroups);
      anomalies.push(...efficiencyAnomalies);
    }

    this.logger.debug('Statistical anomaly detection completed', {
      anomaliesFound: anomalies.length,
    });
    return anomalies;
  }

  /**
   * Detect cost-related statistical anomalies
   * @param {Array} metrics - All metrics
   * @param {Map} timeGroups - Metrics grouped by time
   * @returns {Promise<Array>} Cost anomalies
   */
  async detectCostStatisticalAnomalies(metrics, timeGroups) {
    const anomalies = [];
    const costData = metrics
      .map((m) => m.cost)
      .filter((c) => typeof c === 'number' && !isNaN(c));

    if (costData.length === 0) return anomalies;

    const costStats = this.calculateStatistics(costData);
    const zScoreThreshold = this.config.zScoreThreshold;

    // Detect individual cost spikes
    for (const metric of metrics) {
      if (typeof metric.cost !== 'number' || isNaN(metric.cost)) continue;

      const zScore = Math.abs(
        (metric.cost - costStats.mean) / Math.max(costStats.stdDev, 0.001),
      );

      if (zScore > zScoreThreshold) {
        anomalies.push({
          id: `cost-spike-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: 'cost_anomaly',
          subtype: 'individual_spike',
          severity: this.calculateSeverity(zScore, zScoreThreshold),
          timestamp: metric.timestamp,
          value: metric.cost,
          baseline: costStats.mean,
          deviation: zScore,
          description: `Unusual cost spike detected: $${metric.cost.toFixed(4)} (${zScore.toFixed(1)}σ above normal)`,
          affectedFeatures: [metric.feature].filter((f) => f),
          affectedUsers: [metric.user].filter((u) => u),
          confidence: Math.min(0.95, Math.max(0.5, (zScore - 1) / 4)),
          rawData: {
            cost: metric.cost,
            timestamp: metric.timestamp,
            feature: metric.feature,
            user: metric.user,
          },
        });
      }
    }

    // Detect hourly cost anomalies
    for (const [hour, hourMetrics] of timeGroups.entries()) {
      const hourCost = hourMetrics.reduce((sum, m) => sum + (m.cost || 0), 0);
      const avgHourlyCost = costStats.sum / Math.max(1, timeGroups.size);

      if (hourCost > 0 && avgHourlyCost > 0) {
        const ratio = hourCost / avgHourlyCost;

        if (ratio > 3) {
          // 3x above average
          anomalies.push({
            id: `hourly-cost-spike-${hour}`,
            type: 'cost_anomaly',
            subtype: 'hourly_spike',
            severity: ratio > 5 ? 'critical' : ratio > 4 ? 'high' : 'medium',
            timestamp: hour,
            value: hourCost,
            baseline: avgHourlyCost,
            deviation: ratio,
            description: `Hourly cost spike: $${hourCost.toFixed(4)} (${ratio.toFixed(1)}x above average)`,
            affectedFeatures: [
              ...new Set(hourMetrics.map((m) => m.feature)),
            ].filter((f) => f),
            confidence: Math.min(0.9, Math.max(0.6, (ratio - 2) / 5)),
            rawData: {
              hour,
              cost: hourCost,
              requestCount: hourMetrics.length,
              avgCostPerRequest: hourCost / hourMetrics.length,
            },
          });
        }
      }
    }

    return anomalies;
  }

  /**
   * Detect volume-related statistical anomalies
   * @param {Array} metrics - All metrics
   * @param {Map} timeGroups - Metrics grouped by time
   * @returns {Promise<Array>} Volume anomalies
   */
  async detectVolumeStatisticalAnomalies(metrics, timeGroups) {
    const anomalies = [];

    if (timeGroups.size === 0) return anomalies;

    // Calculate volume statistics per hour
    const volumeData = Array.from(timeGroups.values()).map(
      (hourMetrics) => hourMetrics.length,
    );
    const volumeStats = this.calculateStatistics(volumeData);

    for (const [hour, hourMetrics] of timeGroups.entries()) {
      const hourVolume = hourMetrics.length;
      const zScore = Math.abs(
        (hourVolume - volumeStats.mean) / Math.max(volumeStats.stdDev, 0.1),
      );

      if (zScore > this.config.zScoreThreshold) {
        anomalies.push({
          id: `volume-anomaly-${hour}`,
          type: 'volume_anomaly',
          subtype:
            hourVolume > volumeStats.mean ? 'volume_spike' : 'volume_drop',
          severity: this.calculateSeverity(zScore, this.config.zScoreThreshold),
          timestamp: hour,
          value: hourVolume,
          baseline: volumeStats.mean,
          deviation: zScore,
          description: `${hourVolume > volumeStats.mean ? 'Volume spike' : 'Volume drop'}: ${hourVolume} requests (${zScore.toFixed(1)}σ ${hourVolume > volumeStats.mean ? 'above' : 'below'} normal)`,
          affectedFeatures: [
            ...new Set(hourMetrics.map((m) => m.feature)),
          ].filter((f) => f),
          confidence: Math.min(0.9, Math.max(0.6, (zScore - 1) / 3)),
          rawData: {
            hour,
            volume: hourVolume,
            avgVolume: volumeStats.mean,
          },
        });
      }
    }

    return anomalies;
  }

  /**
   * Detect efficiency-related anomalies
   * @param {Array} metrics - All metrics
   * @param {Map} timeGroups - Metrics grouped by time
   * @returns {Promise<Array>} Efficiency anomalies
   */
  async detectEfficiencyStatisticalAnomalies(metrics, timeGroups) {
    const anomalies = [];

    for (const [hour, hourMetrics] of timeGroups.entries()) {
      if (hourMetrics.length === 0) continue;

      const costs = hourMetrics
        .map((m) => m.cost)
        .filter((c) => typeof c === 'number' && !isNaN(c));
      if (costs.length === 0) continue;

      const avgCostPerRequest =
        costs.reduce((sum, c) => sum + c, 0) / costs.length;
      const efficiency = costs.length / Math.max(1, avgCostPerRequest * 1000); // Requests per dollar (scaled)

      // Compare with baseline efficiency if available
      const baseline = this.baselineStats.get('efficiency');
      if (baseline) {
        const efficiencyRatio = efficiency / baseline.mean;

        if (efficiencyRatio < 0.5) {
          // 50% drop in efficiency
          anomalies.push({
            id: `efficiency-drop-${hour}`,
            type: 'efficiency_anomaly',
            subtype: 'efficiency_drop',
            severity:
              efficiencyRatio < 0.3
                ? 'critical'
                : efficiencyRatio < 0.4
                  ? 'high'
                  : 'medium',
            timestamp: hour,
            value: efficiency,
            baseline: baseline.mean,
            deviation: 1 - efficiencyRatio,
            description: `Efficiency drop: ${(efficiencyRatio * 100).toFixed(1)}% of normal efficiency`,
            affectedFeatures: [
              ...new Set(hourMetrics.map((m) => m.feature)),
            ].filter((f) => f),
            confidence: Math.min(
              0.85,
              Math.max(0.6, (1 - efficiencyRatio) * 2),
            ),
            rawData: {
              hour,
              efficiency,
              avgCostPerRequest,
              requestCount: hourMetrics.length,
            },
          });
        }
      }
    }

    return anomalies;
  }

  /**
   * Detect trend-based anomalies
   * @param {Array} metrics - Validated metrics
   * @returns {Promise<Array>} Trend anomalies
   */
  async detectTrendAnomalies(metrics) {
    this.logger.debug('Detecting trend anomalies');
    const anomalies = [];

    // Group by days for trend analysis
    const dailyGroups = this.groupMetricsByTime(metrics, 'day');

    if (dailyGroups.size < 3) return anomalies; // Need at least 3 days for trend

    const dailyData = Array.from(dailyGroups.entries())
      .map(([day, dayMetrics]) => ({
        day,
        cost: dayMetrics.reduce((sum, m) => sum + (m.cost || 0), 0),
        volume: dayMetrics.length,
        efficiency:
          dayMetrics.length /
          Math.max(
            1,
            dayMetrics.reduce((sum, m) => sum + (m.cost || 0), 0) * 1000,
          ),
      }))
      .sort((a, b) => a.day.localeCompare(b.day));

    // Analyze cost trends
    const costTrend = this.calculateTrend(dailyData.map((d) => d.cost));
    if (Math.abs(costTrend.slope) > this.config.changeRateThreshold) {
      anomalies.push({
        id: `cost-trend-${Date.now()}`,
        type: 'trend_anomaly',
        subtype: 'cost_trend',
        severity: Math.abs(costTrend.slope) > 1 ? 'high' : 'medium',
        timestamp: dailyData[dailyData.length - 1].day,
        value: costTrend.slope,
        baseline: 0,
        deviation: Math.abs(costTrend.slope),
        description: `${costTrend.slope > 0 ? 'Increasing' : 'Decreasing'} cost trend: ${(costTrend.slope * 100).toFixed(1)}% per day`,
        confidence: Math.min(0.9, costTrend.confidence),
        rawData: {
          trend: costTrend,
          dailyData: dailyData.slice(-7), // Last 7 days
        },
      });
    }

    return anomalies;
  }

  /**
   * Calculate trend statistics using linear regression
   * @param {Array<number>} data - Time series data
   * @returns {Object} Trend analysis results
   */
  calculateTrend(data) {
    if (data.length < 2) return { slope: 0, confidence: 0 };

    const n = data.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const xMean = (n - 1) / 2;
    const yMean = data.reduce((sum, val) => sum + val, 0) / n;

    let numerator = 0;
    let denominator = 0;

    for (let i = 0; i < n; i++) {
      const xDiff = x[i] - xMean;
      const yDiff = data[i] - yMean;
      numerator += xDiff * yDiff;
      denominator += xDiff * xDiff;
    }

    const slope = denominator === 0 ? 0 : numerator / denominator;

    // Calculate R-squared for confidence
    let totalVariation = 0;
    let explainedVariation = 0;

    for (let i = 0; i < n; i++) {
      const predicted = yMean + slope * (x[i] - xMean);
      totalVariation += Math.pow(data[i] - yMean, 2);
      explainedVariation += Math.pow(predicted - yMean, 2);
    }

    const rSquared =
      totalVariation === 0 ? 0 : explainedVariation / totalVariation;

    return {
      slope: slope / Math.max(1, yMean), // Normalize by mean for percentage change
      confidence: Math.max(0, Math.min(1, rSquared)),
      rSquared,
    };
  }

  /**
   * Helper methods for data processing and analysis
   */
  validateMetrics(metrics) {
    if (!Array.isArray(metrics)) return [];

    return metrics.filter((metric) => (
        metric &&
        typeof metric.timestamp === 'string' &&
        !isNaN(new Date(metric.timestamp).getTime()) &&
        typeof metric.cost === 'number' &&
        !isNaN(metric.cost) &&
        metric.cost >= 0
      ));
  }

  groupMetricsByTime(metrics, granularity = 'hour') {
    const groups = new Map();

    for (const metric of metrics) {
      const timestamp = new Date(metric.timestamp);
      let key;

      switch (granularity) {
        case 'hour':
          key = `${timestamp.getFullYear()}-${(timestamp.getMonth() + 1).toString().padStart(2, '0')}-${timestamp.getDate().toString().padStart(2, '0')} ${timestamp.getHours().toString().padStart(2, '0')}:00`;
          break;
        case 'day':
          key = timestamp.toISOString().split('T')[0];
          break;
        case 'week':
          const weekStart = new Date(timestamp);
          weekStart.setDate(timestamp.getDate() - timestamp.getDay());
          key = weekStart.toISOString().split('T')[0];
          break;
        default:
          key = timestamp.toISOString();
      }

      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key).push(metric);
    }

    return groups;
  }

  calculateStatistics(data) {
    if (!data || data.length === 0) {
      return { mean: 0, stdDev: 0, min: 0, max: 0, count: 0, sum: 0 };
    }

    const count = data.length;
    const sum = data.reduce((acc, val) => acc + val, 0);
    const mean = sum / count;

    const variance =
      data.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / count;
    const stdDev = Math.sqrt(variance);

    const min = Math.min(...data);
    const max = Math.max(...data);

    return { mean, stdDev, min, max, count, sum, variance };
  }

  calculateSeverity(deviation, threshold) {
    if (deviation >= threshold * 2) return 'critical';
    if (deviation >= threshold * 1.5) return 'high';
    if (deviation >= threshold) return 'medium';
    return 'low';
  }

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

  adjustSensitivityThresholds() {
    const sensitivity = this.config.sensitivity.toLowerCase();

    switch (sensitivity) {
      case 'low':
        this.config.zScoreThreshold *= 1.5;
        this.config.changeRateThreshold *= 1.5;
        this.config.confidenceThreshold = Math.max(
          0.8,
          this.config.confidenceThreshold,
        );
        break;
      case 'high':
        this.config.zScoreThreshold *= 0.7;
        this.config.changeRateThreshold *= 0.7;
        this.config.confidenceThreshold = Math.min(
          0.6,
          this.config.confidenceThreshold,
        );
        break;
      // medium is default - no changes
    }
      default:
        // Handle unexpected values
        break;
  }

  createEmptyResults() {
    return {
      detectionTimestamp: new Date().toISOString(),
      executionTimeMs: 0,
      metricsAnalyzed: 0,
      anomalies: [],
      recommendations: [],
      summary: { total: 0, critical: 0, high: 0, medium: 0, low: 0 },
      metadata: {
        detectionConfig: this.config,
        dataQuality: { score: 0, issues: ['Insufficient data'] },
        baselineInfo: 'No baseline available',
      },
    };
  }

  // Placeholder methods for additional anomaly detection types
  async detectPatternAnomalies(metrics) {
    // Implementation for pattern-based anomaly detection
    return [];
  }

  async detectContextualAnomalies(metrics) {
    // Implementation for contextual anomaly detection
    return [];
  }

  async detectCollectiveAnomalies(metrics) {
    // Implementation for collective anomaly detection
    return [];
  }

  async detectSeasonalAnomalies(metrics) {
    // Implementation for seasonal anomaly detection
    return [];
  }

  consolidateAnomalies(detectionResults) {
    return detectionResults
      .flat()
      .filter((anomaly) => anomaly !== null && anomaly !== undefined);
  }

  async scoreAnomalies(anomalies, metrics) {
    // Score anomalies based on impact and confidence
    return anomalies.map((anomaly) => ({
      ...anomaly,
      impactScore: this.calculateImpactScore(anomaly, metrics),
      overallScore:
        (anomaly.confidence + this.calculateImpactScore(anomaly, metrics)) / 2,
    }));
  }

  calculateImpactScore(anomaly, metrics) {
    // Simple impact scoring based on severity and affected scope
    let score = 0.5; // base score

    switch (anomaly.severity) {
      case 'critical':
        score += 0.4;
        break;
      case 'high':
        score += 0.3;
        break;
      case 'medium':
        score += 0.2;
        break;
      case 'low':
        score += 0.1;
        break;
    }

    // Boost score based on affected scope
    if (anomaly.affectedFeatures && anomaly.affectedFeatures.length > 0) {
      score += Math.min(0.2, anomaly.affectedFeatures.length * 0.05);
    }

    return Math.min(1, score);
      default:
        // Handle unexpected values
        break;
  }

  async generateAnomalyRecommendations(anomalies) {
    const recommendations = [];

    for (const anomaly of anomalies) {
      switch (anomaly.type) {
        case 'cost_anomaly':
          recommendations.push(this.createCostAnomalyRecommendation(anomaly));
          break;
        case 'volume_anomaly':
          recommendations.push(this.createVolumeAnomalyRecommendation(anomaly));
          break;
        case 'efficiency_anomaly':
          recommendations.push(
            this.createEfficiencyAnomalyRecommendation(anomaly),
          );
          break;
        case 'trend_anomaly':
          recommendations.push(this.createTrendAnomalyRecommendation(anomaly));
          break;
      }
        default:
          // Handle unexpected values
          break;
    }

    return recommendations.filter((rec) => rec !== null);
  }

  createCostAnomalyRecommendation(anomaly) {
    return {
      id: `rec-${anomaly.id}`,
      type: 'cost_investigation',
      title: 'Investigate cost anomaly',
      description: `${anomaly.description}. Immediate investigation recommended.`,
      priority: anomaly.severity === 'critical' ? 'critical' : 'high',
      actionItems: [
        'Review recent changes or deployments',
        'Check for unusual user activity patterns',
        'Analyze feature usage during the anomaly period',
        'Implement additional monitoring and alerts',
      ],
      estimatedTimeToResolve: '1-2 hours',
      potentialImpact: 'Cost control and budget management',
    };
  }

  createVolumeAnomalyRecommendation(anomaly) {
    return {
      id: `rec-${anomaly.id}`,
      type: 'volume_investigation',
      title: 'Investigate volume anomaly',
      description: `${anomaly.description}. Review traffic patterns and system capacity.`,
      priority: anomaly.severity === 'critical' ? 'critical' : 'medium',
      actionItems: [
        'Analyze traffic sources and user behavior',
        'Check system capacity and scaling policies',
        'Review rate limiting and load balancing',
        'Monitor for potential abuse or bot traffic',
      ],
      estimatedTimeToResolve: '2-4 hours',
      potentialImpact: 'System performance and resource utilization',
    };
  }

  createEfficiencyAnomalyRecommendation(anomaly) {
    return {
      id: `rec-${anomaly.id}`,
      type: 'efficiency_investigation',
      title: 'Investigate efficiency decline',
      description: `${anomaly.description}. System efficiency analysis needed.`,
      priority: 'medium',
      actionItems: [
        'Profile application performance',
        'Check for resource bottlenecks',
        'Review recent code changes',
        'Analyze database query performance',
      ],
      estimatedTimeToResolve: '4-8 hours',
      potentialImpact: 'Cost efficiency and system performance',
    };
  }

  createTrendAnomalyRecommendation(anomaly) {
    return {
      id: `rec-${anomaly.id}`,
      type: 'trend_analysis',
      title: 'Address concerning trend',
      description: `${anomaly.description}. Long-term monitoring and adjustment needed.`,
      priority: 'medium',
      actionItems: [
        'Establish trend monitoring dashboard',
        'Set up predictive alerts',
        'Review growth projections and capacity planning',
        'Implement cost optimization strategies',
      ],
      estimatedTimeToResolve: '1-2 weeks',
      potentialImpact: 'Long-term cost management and planning',
    };
  }

  createAnomalySummary(anomalies) {
    const summary = {
      total: anomalies.length,
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
    };

    for (const anomaly of anomalies) {
      if (summary[anomaly.severity] !== undefined) {
        summary[anomaly.severity]++;
      }
    }

    return summary;
  }

  async updateBaselines(metrics) {
    // Update baseline statistics for future comparisons
    const costs = metrics
      .map((m) => m.cost)
      .filter((c) => typeof c === 'number' && !isNaN(c));
    if (costs.length > 0) {
      this.baselineStats.set('cost', this.calculateStatistics(costs));
    }

    const dailyGroups = this.groupMetricsByTime(metrics, 'day');
    const efficiencyData = Array.from(dailyGroups.values()).map(
      (dayMetrics) => {
        const totalCost = dayMetrics.reduce((sum, m) => sum + (m.cost || 0), 0);
        return dayMetrics.length / Math.max(1, totalCost * 1000);
      },
    );

    if (efficiencyData.length > 0) {
      this.baselineStats.set(
        'efficiency',
        this.calculateStatistics(efficiencyData),
      );
    }
  }

  assessDataQuality(metrics) {
    const total = metrics.length;
    if (total === 0) return { score: 0, issues: ['No data available'] };

    const validTimestamps = metrics.filter(
      (m) => !isNaN(new Date(m.timestamp).getTime()),
    ).length;
    const validCosts = metrics.filter(
      (m) => typeof m.cost === 'number' && !isNaN(m.cost),
    ).length;
    const hasFeatures = metrics.filter((m) => m.feature).length;
    const hasUsers = metrics.filter((m) => m.user).length;

    const score =
      (validTimestamps + validCosts + hasFeatures + hasUsers) / (total * 4);

    const issues = [];
    if (validTimestamps < total) issues.push('Invalid timestamps detected');
    if (validCosts < total) issues.push('Invalid cost values detected');
    if (hasFeatures < total * 0.8) issues.push('Missing feature information');
    if (hasUsers < total * 0.5) issues.push('Limited user information');

    return { score, issues };
  }

  getBaselineInfo() {
    const info = {};
    for (const [key, stats] of this.baselineStats.entries()) {
      info[key] = {
        mean: stats.mean,
        stdDev: stats.stdDev,
        dataPoints: stats.count,
      };
    }
    return info;
  }
}

/**
 * Factory function to create an AnomalyDetectionEngine instance
 * @param {Object} config - Configuration options
 * @returns {AnomalyDetectionEngine} New engine instance
 */
export function createAnomalyDetectionEngine(config) {
  return new AnomalyDetectionEngine(config);
}
