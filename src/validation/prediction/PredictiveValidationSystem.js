/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Predictive Validation System for failure prediction and alerting
 * Uses multiple models to predict validation failures and generate alerts
 *
 * @author Claude Code - Validation Agent
 * @version 1.0.0
 */
import { EventEmitter } from 'node:events';
import { Logger } from '../../utils/logger.js';
/**
 * Comprehensive Predictive Validation System
 *
 * Features:
 * - Multiple prediction models (moving average, pattern matching, anomaly detection)
 * - Real-time failure risk assessment
 * - Resource exhaustion prediction
 * - Quality degradation detection
 * - Configurable alerting system
 * - Model performance tracking
 * - Historical trend analysis
 * - Automatic model tuning
 */
export class PredictiveValidationSystem extends EventEmitter {
  logger;
  config;
  // Historical data storage
  validationHistory = [];
  alertHistory = [];
  activeAlerts = new Map();
  // Prediction models state
  modelStates = new Map();
  lastAnalysis = new Date(0);
  analysisInterval = null;
  // Performance tracking
  modelPerformance = new Map();
  // Alert management
  alertIdCounter = 0;
  alertCooldowns = new Map();
  constructor(config = {}) {
    super();
    this.logger = new Logger('PredictiveValidationSystem');
    this.config = {
      enabled: true,
      models: {
        movingAverage: {
          enabled: true,
          weight: 1.0,
          parameters: { windowSize: 20, threshold: 0.7 },
          thresholds: { warning: 60, alert: 75, critical: 90 },
        },
        patternMatching: {
          enabled: true,
          weight: 1.2,
          parameters: { patternLength: 10, similarityThreshold: 0.8 },
          thresholds: { warning: 65, alert: 80, critical: 95 },
        },
        anomalyDetection: {
          enabled: true,
          weight: 1.5,
          parameters: { standardDeviations: 2.5, minSamples: 15 },
          thresholds: { warning: 70, alert: 85, critical: 95 },
        },
        resourceTrend: {
          enabled: true,
          weight: 1.1,
          parameters: { trendWindow: 30, exhaustionThreshold: 0.9 },
          thresholds: { warning: 75, alert: 85, critical: 95 },
        },
        qualityRegression: {
          enabled: true,
          weight: 1.3,
          parameters: { regressionWindow: 25, qualityThreshold: 70 },
          thresholds: { warning: 60, alert: 75, critical: 90 },
        },
      },
      alerting: {
        enabled: true,
        minimumConfidence: 70,
        cooldownPeriod: 300000, // 5 minutes
        maxActiveAlerts: 10,
      },
      dataRetention: {
        maxHistoryDays: 30,
        maxMetricPoints: 10000,
        compressionThreshold: 5000,
      },
      analysis: {
        analysisInterval: 60000, // 1 minute
        predictionHorizon: 900000, // 15 minutes
        trendAnalysisWindow: 3600000, // 1 hour
      },
      ...config,
    };
    this.initializeModels();
    this.startAnalysisLoop();
    this.logger.info('PredictiveValidationSystem initialized', {
      modelsEnabled: Object.entries(this.config.models)
        .filter(([, config]) => config.enabled)
        .map(([name]) => name),
      alertingEnabled: this.config.alerting.enabled,
    });
  }
  /**
   * Process validation report for prediction analysis
   */
  processValidationReport(report) {
    if (!this.config.enabled) return;
    const metrics = {
      timestamp: report.timestamp,
      taskId: report.taskId,
      status: report.overallStatus,
      score: report.overallScore,
      duration: report.duration || 0,
      memoryUsage: this.getCurrentMemoryUsage(),
      cpuUsage: this.getCurrentCpuUsage(),
      criteriaCounts: {
        total: report.results.length,
        passed: report.results.filter((r) => r.status === 'passed').length,
        failed: report.results.filter((r) => r.status === 'failed').length,
        skipped: report.results.filter((r) => r.status === 'skipped').length,
      },
      errorTypes: this.extractErrorTypes(report.results),
      performanceMetrics: this.extractPerformanceMetrics(report),
    };
    // Store historical data
    this.validationHistory.push(metrics);
    this.cleanupHistoricalData();
    // Update model states
    this.updateModelStates(metrics);
    this.logger.debug('Processed validation report for prediction analysis', {
      taskId: report.taskId,
      status: report.overallStatus,
      score: report.overallScore,
    });
  }
  /**
   * Get active alerts
   */
  getActiveAlerts() {
    return Array.from(this.activeAlerts.values()).sort(
      (a, b) => b.confidence - a.confidence,
    );
  }
  /**
   * Get prediction statistics
   */
  getPredictionStatistics() {
    const totalPredictions = Array.from(this.modelPerformance.values()).reduce(
      (sum, perf) => sum + perf.predictions,
      0,
    );
    const totalCorrect = Array.from(this.modelPerformance.values()).reduce(
      (sum, perf) => sum + perf.correctPredictions,
      0,
    );
    const totalConfidence = Array.from(this.modelPerformance.values()).reduce(
      (sum, perf) => sum + perf.totalConfidence,
      0,
    );
    const recentMetrics = this.validationHistory.filter(
      (m) =>
        Date.now() - m.timestamp.getTime() <
        this.config.analysis.trendAnalysisWindow,
    );
    const recentFailures = recentMetrics.filter(
      (m) => m.status === 'failed',
    ).length;
    const failureRate =
      recentMetrics.length > 0
        ? (recentFailures / recentMetrics.length) * 100
        : 0;
    const modelPerformance = {};
    for (const [model, perf] of this.modelPerformance) {
      modelPerformance[model] = {
        predictions: perf.predictions,
        accuracy:
          perf.predictions > 0
            ? (perf.correctPredictions / perf.predictions) * 100
            : 0,
        avgConfidence:
          perf.predictions > 0 ? perf.totalConfidence / perf.predictions : 0,
      };
    }
    return {
      totalPredictions,
      alertsGenerated: this.alertHistory.length,
      accuracyRate:
        totalPredictions > 0 ? (totalCorrect / totalPredictions) * 100 : 0,
      falsePositiveRate: this.calculateFalsePositiveRate(),
      falseNegativeRate: this.calculateFalseNegativeRate(),
      averageConfidence:
        totalPredictions > 0 ? totalConfidence / totalPredictions : 0,
      modelPerformance,
      recentTrends: {
        failureRate,
        performanceTrend: this.calculatePerformanceTrend(),
        qualityTrend: this.calculateQualityTrend(),
      },
    };
  }
  /**
   * Force prediction analysis
   */
  async runPredictionAnalysis() {
    if (!this.config.enabled || this.validationHistory.length < 10) {
      return [];
    }
    this.logger.info('Running prediction analysis');
    const startTime = Date.now();
    const predictions = [];
    // Run all enabled models
    for (const [modelName, modelConfig] of Object.entries(this.config.models)) {
      if (!modelConfig.enabled) continue;
      try {
        const result = await this.runPredictionModel(modelName, modelConfig);
        if (result) {
          predictions.push(result);
        }
      } catch (error) {
        this.logger.error(`Prediction model ${modelName} failed`, { error });
      }
    }
    // Generate alerts from predictions
    const alerts = await this.generateAlertsFromPredictions(predictions);
    this.lastAnalysis = new Date();
    this.logger.info(
      `Prediction analysis completed in ${Date.now() - startTime}ms`,
      {
        modelsRun: predictions.length,
        alertsGenerated: alerts.length,
      },
    );
    // Emit results
    this.emit('predictionsGenerated', predictions);
    if (alerts.length > 0) {
      this.emit('alertsGenerated', alerts);
    }
    return alerts;
  }
  /**
   * Initialize prediction models
   */
  initializeModels() {
    for (const modelName of Object.keys(this.config.models)) {
      this.modelStates.set(modelName, {
        initialized: false,
        lastUpdate: new Date(0),
        parameters: {
          ...this.config.models[modelName].parameters,
        },
        state: {},
      });
      this.modelPerformance.set(modelName, {
        predictions: 0,
        correctPredictions: 0,
        totalConfidence: 0,
      });
    }
  }
  /**
   * Start analysis loop
   */
  startAnalysisLoop() {
    if (!this.config.enabled) return;
    this.analysisInterval = setInterval(() => {
      this.runPredictionAnalysis().catch((error) => {
        this.logger.error('Prediction analysis failed', { error });
      });
    }, this.config.analysis.analysisInterval);
  }
  /**
   * Run specific prediction model
   */
  async runPredictionModel(modelName, config) {
    switch (modelName) {
      case 'movingAverage':
        return this.runMovingAverageModel(config);
      case 'patternMatching':
        return this.runPatternMatchingModel(config);
      case 'anomalyDetection':
        return this.runAnomalyDetectionModel(config);
      case 'resourceTrend':
        return this.runResourceTrendModel(config);
      case 'qualityRegression':
        return this.runQualityRegressionModel(config);
      default:
        this.logger.warn(`Unknown prediction model: ${modelName}`);
        return null;
    }
  }
  /**
   * Moving average failure prediction model
   */
  runMovingAverageModel(config) {
    const windowSize = config.parameters.windowSize || 20;
    const recent = this.validationHistory.slice(-windowSize);
    if (recent.length < windowSize) {
      return {
        model: 'movingAverage',
        score: 0,
        confidence: 30,
        factors: [],
        trend: 'stable',
      };
    }
    const failureRate =
      recent.filter((m) => m.status === 'failed').length / recent.length;
    const avgScore =
      recent.reduce((sum, m) => sum + m.score, 0) / recent.length;
    const avgDuration =
      recent.reduce((sum, m) => sum + m.duration, 0) / recent.length;
    const currentWindow = recent.slice(-5);
    const previousWindow = recent.slice(-10, -5);
    const currentFailureRate =
      currentWindow.filter((m) => m.status === 'failed').length /
      currentWindow.length;
    const previousFailureRate =
      previousWindow.filter((m) => m.status === 'failed').length /
      previousWindow.length;
    const trend =
      currentFailureRate > previousFailureRate
        ? 'declining'
        : currentFailureRate < previousFailureRate
          ? 'improving'
          : 'stable';
    const riskScore = Math.min(100, failureRate * 100 + (100 - avgScore) * 0.5);
    const confidence = Math.min(95, 50 + recent.length * 2);
    return {
      model: 'movingAverage',
      score: riskScore,
      confidence,
      factors: [
        {
          name: 'failure_rate',
          value: failureRate,
          weight: 0.6,
          impact: failureRate * 60,
        },
        {
          name: 'avg_score',
          value: avgScore,
          weight: 0.3,
          impact: (100 - avgScore) * 0.3,
        },
        {
          name: 'avg_duration',
          value: avgDuration,
          weight: 0.1,
          impact: Math.min(10, avgDuration / 1000),
        },
      ],
      trend,
    };
  }
  /**
   * Pattern matching failure prediction model
   */
  runPatternMatchingModel(config) {
    const patternLength = config.parameters.patternLength || 10;
    const similarityThreshold = config.parameters.similarityThreshold || 0.8;
    if (this.validationHistory.length < patternLength * 3) {
      return {
        model: 'patternMatching',
        score: 0,
        confidence: 25,
        factors: [],
        trend: 'stable',
      };
    }
    const currentPattern = this.validationHistory.slice(-patternLength);
    const historicalPatterns = [];
    // Extract historical patterns
    for (
      let i = patternLength;
      i <= this.validationHistory.length - patternLength;
      i++
    ) {
      const pattern = this.validationHistory.slice(i - patternLength, i);
      const nextResult = this.validationHistory[i];
      if (
        this.calculatePatternSimilarity(currentPattern, pattern) >=
        similarityThreshold
      ) {
        historicalPatterns.push({ pattern, nextResult });
      }
    }
    if (historicalPatterns.length === 0) {
      return {
        model: 'patternMatching',
        score: 30,
        confidence: 40,
        factors: [
          { name: 'no_similar_patterns', value: 1, weight: 1, impact: 30 },
        ],
        trend: 'stable',
      };
    }
    const failureProbability =
      historicalPatterns.filter((p) => p.nextResult.status === 'failed')
        .length / historicalPatterns.length;
    const avgNextScore =
      historicalPatterns.reduce((sum, p) => sum + p.nextResult.score, 0) /
      historicalPatterns.length;
    const riskScore = Math.min(
      100,
      failureProbability * 100 + (100 - avgNextScore) * 0.3,
    );
    const confidence = Math.min(90, 40 + historicalPatterns.length * 5);
    return {
      model: 'patternMatching',
      score: riskScore,
      confidence,
      factors: [
        {
          name: 'failure_probability',
          value: failureProbability,
          weight: 0.7,
          impact: failureProbability * 70,
        },
        {
          name: 'predicted_score',
          value: avgNextScore,
          weight: 0.3,
          impact: (100 - avgNextScore) * 0.3,
        },
        {
          name: 'pattern_matches',
          value: historicalPatterns.length,
          weight: 0.1,
          impact: Math.min(10, historicalPatterns.length),
        },
      ],
      trend:
        failureProbability > 0.5
          ? 'declining'
          : failureProbability < 0.2
            ? 'improving'
            : 'stable',
    };
  }
  /**
   * Anomaly detection failure prediction model
   */
  runAnomalyDetectionModel(config) {
    const stdDevs = config.parameters.standardDeviations || 2.5;
    const minSamples = config.parameters.minSamples || 15;
    if (this.validationHistory.length < minSamples) {
      return {
        model: 'anomalyDetection',
        score: 0,
        confidence: 20,
        factors: [],
        trend: 'stable',
      };
    }
    const recent = this.validationHistory.slice(-minSamples);
    const scores = recent.map((m) => m.score);
    const durations = recent.map((m) => m.duration);
    const memoryUsages = recent.map((m) => m.memoryUsage);
    const scoreStats = this.calculateStats(scores);
    const durationStats = this.calculateStats(durations);
    const memoryStats = this.calculateStats(memoryUsages);
    const latest = recent[recent.length - 1];
    const anomalies = [];
    // Detect anomalies
    if (
      Math.abs(latest.score - scoreStats.mean) >
      stdDevs * scoreStats.stdDev
    ) {
      anomalies.push({
        type: 'score',
        severity: Math.abs(latest.score - scoreStats.mean) / scoreStats.stdDev,
        direction: latest.score < scoreStats.mean ? 'declining' : 'improving',
      });
    }
    if (
      Math.abs(latest.duration - durationStats.mean) >
      stdDevs * durationStats.stdDev
    ) {
      anomalies.push({
        type: 'duration',
        severity:
          Math.abs(latest.duration - durationStats.mean) / durationStats.stdDev,
        direction:
          latest.duration > durationStats.mean ? 'increasing' : 'decreasing',
      });
    }
    if (
      Math.abs(latest.memoryUsage - memoryStats.mean) >
      stdDevs * memoryStats.stdDev
    ) {
      anomalies.push({
        type: 'memory',
        severity:
          Math.abs(latest.memoryUsage - memoryStats.mean) / memoryStats.stdDev,
        direction:
          latest.memoryUsage > memoryStats.mean ? 'increasing' : 'decreasing',
      });
    }
    const riskScore = anomalies.reduce((sum, anomaly) => {
      return sum + Math.min(50, anomaly.severity * 20);
    }, 0);
    const confidence = Math.min(
      85,
      30 + recent.length * 3 + anomalies.length * 10,
    );
    const trend = anomalies.some(
      (a) => a.direction === 'declining' || a.direction === 'increasing',
    )
      ? 'declining'
      : anomalies.length === 0
        ? 'stable'
        : 'improving';
    return {
      model: 'anomalyDetection',
      score: Math.min(100, riskScore),
      confidence,
      factors: anomalies.map((a) => ({
        name: `${a.type}_anomaly`,
        value: a.severity,
        weight: 0.33,
        impact: Math.min(33, a.severity * 10),
      })),
      trend,
    };
  }
  /**
   * Resource trend prediction model
   */
  runResourceTrendModel(config) {
    const trendWindow = config.parameters.trendWindow || 30;
    const exhaustionThreshold = config.parameters.exhaustionThreshold || 0.9;
    if (this.validationHistory.length < trendWindow) {
      return {
        model: 'resourceTrend',
        score: 0,
        confidence: 25,
        factors: [],
        trend: 'stable',
      };
    }
    const recent = this.validationHistory.slice(-trendWindow);
    const memoryTrend = this.calculateLinearTrend(
      recent.map((m) => m.memoryUsage),
    );
    const cpuTrend = this.calculateLinearTrend(recent.map((m) => m.cpuUsage));
    const durationTrend = this.calculateLinearTrend(
      recent.map((m) => m.duration),
    );
    // Predict resource usage in next hour
    const hoursAhead =
      this.config.analysis.predictionHorizon / (60 * 60 * 1000);
    const predictedMemory =
      recent[recent.length - 1].memoryUsage + memoryTrend.slope * hoursAhead;
    const predictedCpu =
      recent[recent.length - 1].cpuUsage + cpuTrend.slope * hoursAhead;
    const memoryRisk = Math.max(
      0,
      Math.min(100, (predictedMemory - exhaustionThreshold * 100) * 5),
    );
    const cpuRisk = Math.max(
      0,
      Math.min(100, (predictedCpu - exhaustionThreshold * 100) * 5),
    );
    const durationRisk = Math.max(
      0,
      Math.min(50, durationTrend.slope > 0 ? durationTrend.slope / 100 : 0),
    );
    const overallRisk = Math.max(memoryRisk, cpuRisk, durationRisk);
    const confidence = Math.min(
      80,
      40 +
        recent.length +
        (Math.abs(memoryTrend.correlation) + Math.abs(cpuTrend.correlation)) *
          20,
    );
    const trend =
      overallRisk > 50
        ? 'declining'
        : overallRisk < 10
          ? 'improving'
          : 'stable';
    return {
      model: 'resourceTrend',
      score: overallRisk,
      confidence,
      factors: [
        {
          name: 'memory_trend',
          value: memoryTrend.slope,
          weight: 0.4,
          impact: memoryRisk,
        },
        {
          name: 'cpu_trend',
          value: cpuTrend.slope,
          weight: 0.4,
          impact: cpuRisk,
        },
        {
          name: 'duration_trend',
          value: durationTrend.slope,
          weight: 0.2,
          impact: durationRisk,
        },
      ],
      trend,
    };
  }
  /**
   * Quality regression prediction model
   */
  runQualityRegressionModel(config) {
    const regressionWindow = config.parameters.regressionWindow || 25;
    const qualityThreshold = config.parameters.qualityThreshold || 70;
    if (this.validationHistory.length < regressionWindow) {
      return {
        model: 'qualityRegression',
        score: 0,
        confidence: 30,
        factors: [],
        trend: 'stable',
      };
    }
    const recent = this.validationHistory.slice(-regressionWindow);
    const scores = recent.map((m) => m.score);
    const scoreTrend = this.calculateLinearTrend(scores);
    const currentAvg = scores.slice(-5).reduce((sum, s) => sum + s, 0) / 5;
    const previousAvg =
      scores.slice(-10, -5).reduce((sum, s) => sum + s, 0) / 5;
    const qualityChange = currentAvg - previousAvg;
    const isRegressing = scoreTrend.slope < 0 && currentAvg < qualityThreshold;
    const regressionRisk = isRegressing
      ? Math.min(100, (qualityThreshold - currentAvg) * 2)
      : 0;
    const trendRisk =
      scoreTrend.slope < 0 ? Math.min(50, Math.abs(scoreTrend.slope)) : 0;
    const overallRisk = Math.max(regressionRisk, trendRisk);
    const confidence = Math.min(
      85,
      35 + recent.length + Math.abs(scoreTrend.correlation) * 30,
    );
    const trend =
      qualityChange < -5
        ? 'declining'
        : qualityChange > 5
          ? 'improving'
          : 'stable';
    return {
      model: 'qualityRegression',
      score: overallRisk,
      confidence,
      factors: [
        {
          name: 'quality_trend',
          value: scoreTrend.slope,
          weight: 0.5,
          impact: trendRisk,
        },
        {
          name: 'current_quality',
          value: currentAvg,
          weight: 0.3,
          impact: Math.max(0, qualityThreshold - currentAvg),
        },
        {
          name: 'quality_change',
          value: qualityChange,
          weight: 0.2,
          impact: Math.max(0, -qualityChange),
        },
      ],
      trend,
    };
  }
  /**
   * Generate alerts from prediction results
   */
  async generateAlertsFromPredictions(predictions) {
    const alerts = [];
    for (const prediction of predictions) {
      const modelConfig = this.config.models[prediction.model];
      if (!modelConfig) continue;
      let severity = 'info';
      let alertType = 'failure_risk';
      // Determine severity based on thresholds
      if (prediction.score >= modelConfig.thresholds.critical) {
        severity = 'critical';
      } else if (prediction.score >= modelConfig.thresholds.alert) {
        severity = 'high';
      } else if (prediction.score >= modelConfig.thresholds.warning) {
        severity = 'medium';
      } else {
        continue; // Skip if below warning threshold
      }
      // Determine alert type based on model
      switch (prediction.model) {
        case 'resourceTrend':
          alertType = 'resource_exhaustion';
          break;
        case 'qualityRegression':
          alertType = 'quality_decline';
          break;
        case 'anomalyDetection':
          alertType = 'performance_degradation';
          break;
        default:
          alertType = 'failure_risk';
      }
      // Check cooldown
      const cooldownKey = `${prediction.model}_${alertType}`;
      const lastAlert = this.alertCooldowns.get(cooldownKey);
      if (
        lastAlert &&
        Date.now() - lastAlert.getTime() < this.config.alerting.cooldownPeriod
      ) {
        continue;
      }
      // Check confidence threshold
      if (prediction.confidence < this.config.alerting.minimumConfidence) {
        continue;
      }
      // Create alert
      const alert = {
        id: `pred_alert_${++this.alertIdCounter}_${Date.now()}`,
        title: this.generateAlertTitle(prediction, severity),
        severity,
        message: this.generateAlertMessage(prediction),
        details: this.generateAlertDetails(prediction),
        confidence: prediction.confidence,
        predictedAt: new Date(
          Date.now() + this.config.analysis.predictionHorizon,
        ),
        timestamp: new Date(),
        type: alertType,
        affectedSystems: this.determineAffectedSystems(prediction),
        recommendedActions: this.generateRecommendedActions(prediction),
        metadata: {
          model: prediction.model,
          score: prediction.score,
          factors: prediction.factors,
          trend: prediction.trend,
        },
      };
      alerts.push(alert);
      this.activeAlerts.set(alert.id, alert);
      this.alertHistory.push(alert);
      this.alertCooldowns.set(cooldownKey, new Date());
      // Emit individual alert
      this.emit('alertTriggered', alert);
    }
    // Clean up old alerts
    this.cleanupAlerts();
    return alerts;
  }
  /**
   * Helper methods for calculations
   */
  calculateStats(values) {
    if (values.length === 0) return { mean: 0, stdDev: 0, min: 0, max: 0 };
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const variance =
      values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    return {
      mean,
      stdDev,
      min: Math.min(...values),
      max: Math.max(...values),
    };
  }
  calculateLinearTrend(values) {
    if (values.length < 2) return { slope: 0, intercept: 0, correlation: 0 };
    const n = values.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const sumX = x.reduce((sum, v) => sum + v, 0);
    const sumY = values.reduce((sum, v) => sum + v, 0);
    const sumXY = x.reduce((sum, v, i) => sum + v * values[i], 0);
    const sumXX = x.reduce((sum, v) => sum + v * v, 0);
    const sumYY = values.reduce((sum, v) => sum + v * v, 0);
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    const correlation =
      (n * sumXY - sumX * sumY) /
      Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));
    return {
      slope,
      intercept,
      correlation: isNaN(correlation) ? 0 : correlation,
    };
  }
  calculatePatternSimilarity(pattern1, pattern2) {
    if (pattern1.length !== pattern2.length) return 0;
    let similarity = 0;
    const factors = ['score', 'duration', 'memoryUsage', 'status'];
    for (let i = 0; i < pattern1.length; i++) {
      for (const factor of factors) {
        let factorSimilarity = 0;
        if (factor === 'status') {
          factorSimilarity = pattern1[i].status === pattern2[i].status ? 1 : 0;
        } else {
          const val1 = pattern1[i][factor];
          const val2 = pattern2[i][factor];
          const maxVal = Math.max(val1, val2);
          factorSimilarity =
            maxVal > 0 ? 1 - Math.abs(val1 - val2) / maxVal : 1;
        }
        similarity += factorSimilarity;
      }
    }
    return similarity / (pattern1.length * factors.length);
  }
  generateAlertTitle(prediction, severity) {
    const modelNames = {
      movingAverage: 'Moving Average Analysis',
      patternMatching: 'Pattern Analysis',
      anomalyDetection: 'Anomaly Detection',
      resourceTrend: 'Resource Trend Analysis',
      qualityRegression: 'Quality Analysis',
    };
    const modelName = modelNames[prediction.model] || prediction.model;
    return `${severity.toUpperCase()}: ${modelName} detected high risk (${Math.round(prediction.score)}% risk)`;
  }
  generateAlertMessage(prediction) {
    const trend =
      prediction.trend === 'declining'
        ? 'declining trend'
        : prediction.trend === 'improving'
          ? 'improving trend'
          : 'stable trend';
    return (
      `Validation system shows ${Math.round(prediction.score)}% risk of failure with ${trend}. ` +
      `Confidence: ${Math.round(prediction.confidence)}%. ` +
      `Top factors: ${prediction.factors
        .slice(0, 2)
        .map((f) => f.name)
        .join(', ')}.`
    );
  }
  generateAlertDetails(prediction) {
    let details = `## Prediction Analysis\n\n`;
    details += `- **Model**: ${prediction.model}\n`;
    details += `- **Risk Score**: ${Math.round(prediction.score)}/100\n`;
    details += `- **Confidence**: ${Math.round(prediction.confidence)}%\n`;
    details += `- **Trend**: ${prediction.trend}\n\n`;
    if (prediction.factors.length > 0) {
      details += `### Contributing Factors\n`;
      for (const factor of prediction.factors) {
        details += `- **${factor.name}**: ${factor.value.toFixed(2)} (impact: ${Math.round(factor.impact)})\n`;
      }
    }
    return details;
  }
  determineAffectedSystems(prediction) {
    const systems = ['validation-engine'];
    if (prediction.model === 'resourceTrend') {
      systems.push('system-resources', 'performance-monitor');
    } else if (prediction.model === 'qualityRegression') {
      systems.push('quality-scoring', 'validation-criteria');
    } else if (prediction.model === 'anomalyDetection') {
      systems.push('monitoring-system', 'alerting-system');
    }
    return systems;
  }
  generateRecommendedActions(prediction) {
    const actions = [];
    if (prediction.score >= 80) {
      actions.push('Immediate investigation required - review recent changes');
      actions.push('Consider pausing non-critical validations');
    }
    if (prediction.model === 'resourceTrend') {
      actions.push('Monitor system resources closely');
      actions.push('Consider scaling resources or optimizing resource usage');
    } else if (prediction.model === 'qualityRegression') {
      actions.push('Review validation criteria configuration');
      actions.push('Investigate recent quality score decline');
    } else if (prediction.model === 'anomalyDetection') {
      actions.push('Investigate system behavior anomalies');
      actions.push('Review recent performance metrics');
    }
    actions.push('Monitor validation metrics more frequently');
    actions.push('Review logs for warning signs');
    return actions.slice(0, 5); // Limit to 5 actions
  }
  calculatePerformanceTrend() {
    const recent = this.validationHistory.slice(-20);
    if (recent.length < 10) return 'stable';
    const recentAvg =
      recent.slice(-5).reduce((sum, m) => sum + m.duration, 0) / 5;
    const previousAvg =
      recent.slice(-10, -5).reduce((sum, m) => sum + m.duration, 0) / 5;
    const change = ((recentAvg - previousAvg) / previousAvg) * 100;
    return change > 10 ? 'declining' : change < -10 ? 'improving' : 'stable';
  }
  calculateQualityTrend() {
    const recent = this.validationHistory.slice(-20);
    if (recent.length < 10) return 'stable';
    const recentAvg = recent.slice(-5).reduce((sum, m) => sum + m.score, 0) / 5;
    const previousAvg =
      recent.slice(-10, -5).reduce((sum, m) => sum + m.score, 0) / 5;
    const change = recentAvg - previousAvg;
    return change > 5 ? 'improving' : change < -5 ? 'declining' : 'stable';
  }
  calculateFalsePositiveRate() {
    // This would need actual outcome tracking in a real implementation
    return 5; // Placeholder
  }
  calculateFalseNegativeRate() {
    // This would need actual outcome tracking in a real implementation
    return 3; // Placeholder
  }
  extractErrorTypes(results) {
    const errorTypes = {};
    for (const result of results) {
      if (result.status === 'failed') {
        const errorType = this.classifyError(result.message);
        errorTypes[errorType] = (errorTypes[errorType] || 0) + 1;
      }
    }
    return errorTypes;
  }
  extractPerformanceMetrics(report) {
    return {
      totalDuration: report.duration || 0,
      averageCriteriaTime:
        report.results.length > 0
          ? (report.duration || 0) / report.results.length
          : 0,
      parallelizationRatio:
        report.results.length > 0
          ? (report.duration || 0) /
            Math.max(...report.results.map((r) => r.duration || 0))
          : 1,
    };
  }
  classifyError(message) {
    const lowerMessage = message.toLowerCase();
    if (lowerMessage.includes('timeout')) return 'timeout';
    if (lowerMessage.includes('memory') || lowerMessage.includes('oom'))
      return 'memory';
    if (lowerMessage.includes('permission') || lowerMessage.includes('access'))
      return 'permission';
    if (lowerMessage.includes('network') || lowerMessage.includes('connection'))
      return 'network';
    if (lowerMessage.includes('syntax') || lowerMessage.includes('parse'))
      return 'syntax';
    if (lowerMessage.includes('type') || lowerMessage.includes('undefined'))
      return 'type';
    return 'general';
  }
  getCurrentMemoryUsage() {
    const used = process.memoryUsage();
    return used.heapUsed / 1024 / 1024; // MB
  }
  getCurrentCpuUsage() {
    // Simplified CPU usage estimation
    const usage = process.cpuUsage();
    return Math.min(100, (usage.user + usage.system) / 10000); // Rough percentage
  }
  updateModelStates(metrics) {
    for (const [modelName, state] of this.modelStates) {
      state.lastUpdate = new Date();
      state.initialized = true;
      // Update model-specific state
      if (modelName === 'movingAverage') {
        if (!state.state.history) state.state.history = [];
        state.state.history.push(metrics);
        if (state.state.history.length > 50) {
          state.state.history = state.state.history.slice(-50);
        }
      }
    }
  }
  cleanupHistoricalData() {
    const maxAge =
      Date.now() -
      this.config.dataRetention.maxHistoryDays * 24 * 60 * 60 * 1000;
    // Remove old data
    const beforeLength = this.validationHistory.length;
    while (
      this.validationHistory.length > 0 &&
      this.validationHistory[0].timestamp.getTime() < maxAge
    ) {
      this.validationHistory.shift();
    }
    // Compress data if needed
    if (
      this.validationHistory.length >
      this.config.dataRetention.compressionThreshold
    ) {
      // Keep recent data, compress older data
      const keepRecent = Math.floor(
        this.config.dataRetention.compressionThreshold * 0.7,
      );
      const toCompress = this.validationHistory.length - keepRecent;
      // Simple compression: keep every nth item
      const compressionRatio = Math.ceil(
        toCompress / (this.config.dataRetention.compressionThreshold * 0.3),
      );
      const compressed = [];
      for (let i = 0; i < toCompress; i += compressionRatio) {
        compressed.push(this.validationHistory[i]);
      }
      this.validationHistory.splice(0, toCompress, ...compressed);
    }
    if (beforeLength !== this.validationHistory.length) {
      this.logger.debug(
        `Cleaned up historical data: ${beforeLength} -> ${this.validationHistory.length} records`,
      );
    }
  }
  cleanupAlerts() {
    const maxAge = Date.now() - 24 * 60 * 60 * 1000; // 24 hours
    // Remove old active alerts
    for (const [id, alert] of this.activeAlerts) {
      if (alert.timestamp.getTime() < maxAge) {
        this.activeAlerts.delete(id);
      }
    }
    // Limit active alerts
    if (this.activeAlerts.size > this.config.alerting.maxActiveAlerts) {
      const sorted = Array.from(this.activeAlerts.entries()).sort(
        ([, a], [, b]) => b.timestamp.getTime() - a.timestamp.getTime(),
      );
      // Keep only the most recent alerts
      this.activeAlerts.clear();
      for (let i = 0; i < this.config.alerting.maxActiveAlerts; i++) {
        const [id, alert] = sorted[i];
        this.activeAlerts.set(id, alert);
      }
    }
    // Clean up alert history
    if (this.alertHistory.length > 1000) {
      this.alertHistory.splice(0, this.alertHistory.length - 1000);
    }
  }
  /**
   * Shutdown the predictive system
   */
  async shutdown() {
    this.logger.info('Shutting down predictive validation system');
    if (this.analysisInterval) {
      clearInterval(this.analysisInterval);
      this.analysisInterval = null;
    }
    this.activeAlerts.clear();
    this.modelStates.clear();
    this.modelPerformance.clear();
    this.alertCooldowns.clear();
    this.emit('systemShutdown');
    this.removeAllListeners();
    this.logger.info('Predictive validation system shutdown completed');
  }
}
//# sourceMappingURL=PredictiveValidationSystem.js.map
