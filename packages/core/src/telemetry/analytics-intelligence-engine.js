/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { performance as _performance } from 'node:perf_hooks';
import {
  Worker as _Worker,
  isMainThread as _isMainThread,
  parentPort as _parentPort,
  workerData as _workerData,
} from 'node:worker_threads';
import EventEmitter from 'node:events';
import { getComponentLogger, createTimer, LogLevel } from '../utils/logger.js';
const logger = getComponentLogger('AnalyticsIntelligenceEngine');
/**
 * Advanced statistical functions for pattern analysis
 */
class StatisticalAnalyzer {
  /**
   * Calculate statistical metrics for a dataset
   */
  static calculateStats(values) {
    if (values.length === 0) {
      return { mean: 0, median: 0, stdDev: 0, min: 0, max: 0, p95: 0, p99: 0 };
    }
    const sorted = [...values].sort((a, b) => a - b);
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance =
      values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
      values.length;
    return {
      mean,
      median: sorted[Math.floor(sorted.length / 2)],
      stdDev: Math.sqrt(variance),
      min: sorted[0],
      max: sorted[sorted.length - 1],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)],
    };
  }
  /**
   * Detect anomalies using Z-score method
   */
  static detectAnomalies(values, threshold = 2.5) {
    const stats = this.calculateStats(values);
    const anomalies = [];
    const zScores = [];
    values.forEach((value, index) => {
      const zScore =
        stats.stdDev > 0 ? Math.abs((value - stats.mean) / stats.stdDev) : 0;
      zScores.push(zScore);
      if (zScore > threshold) {
        anomalies.push(index);
      }
    });
    return { indices: anomalies, scores: zScores };
  }
  /**
   * Calculate trend using linear regression
   */
  static calculateTrend(values) {
    if (values.length < 2) {
      return { slope: 0, intercept: 0, correlation: 0, isIncreasing: false };
    }
    const n = values.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = values.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * values[i], 0);
    const sumXX = x.reduce((sum, val) => sum + val * val, 0);
    const sumYY = values.reduce((sum, val) => sum + val * val, 0);
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    const rNumerator = n * sumXY - sumX * sumY;
    const rDenominator = Math.sqrt(
      (n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY),
    );
    const correlation = rDenominator !== 0 ? rNumerator / rDenominator : 0;
    return {
      slope,
      intercept,
      correlation,
      isIncreasing: slope > 0,
    };
  }
  /**
   * Seasonal pattern detection
   */
  static detectSeasonality(values, period = 24) {
    if (values.length < period * 2) {
      return { isPresent: false, strength: 0, pattern: [] };
    }
    const seasonalPattern = new Array(period).fill(0);
    const seasonalCounts = new Array(period).fill(0);
    // Calculate average for each seasonal position
    values.forEach((value, index) => {
      const seasonalIndex = index % period;
      seasonalPattern[seasonalIndex] += value;
      seasonalCounts[seasonalIndex]++;
    });
    // Normalize by count
    for (let i = 0; i < period; i++) {
      if (seasonalCounts[i] > 0) {
        seasonalPattern[i] /= seasonalCounts[i];
      }
    }
    // Calculate seasonal strength
    const overallMean =
      values.reduce((sum, val) => sum + val, 0) / values.length;
    const seasonalVariance =
      seasonalPattern.reduce(
        (sum, val) => sum + Math.pow(val - overallMean, 2),
        0,
      ) / period;
    const totalVariance =
      values.reduce((sum, val) => sum + Math.pow(val - overallMean, 2), 0) /
      values.length;
    const strength = totalVariance > 0 ? seasonalVariance / totalVariance : 0;
    return {
      isPresent: strength > 0.1, // 10% threshold
      strength,
      pattern: seasonalPattern,
    };
  }
}
/**
 * Machine learning predictor for performance and cost estimation
 */
class PerformancePredictor {
  modelWeights = new Map();
  historicalData = [];
  /**
   * Train predictor with historical data
   */
  train(data) {
    this.historicalData.push(...data);
    // Simple feature importance calculation
    const features = ['totalTokens', 'latencyMs', 'conversationTurn'];
    for (const feature of features) {
      const values = data.map((d) => d[feature] || 0);
      const stats = StatisticalAnalyzer.calculateStats(values);
      // Weight based on variance (more variance = more predictive power)
      this.modelWeights.set(feature, stats.stdDev / Math.max(stats.mean, 1));
    }
  }
  /**
   * Predict performance metrics for a given context
   */
  predict(context) {
    const similarSamples = this.findSimilarSamples(context);
    if (similarSamples.length === 0) {
      // Fallback to global averages
      const allValues = this.historicalData;
      const avgLatency =
        allValues.reduce((sum, d) => sum + d.latencyMs, 0) / allValues.length;
      const avgCost =
        allValues.reduce((sum, d) => sum + (d.totalCostUsd || 0), 0) /
        allValues.length;
      const avgTokens =
        allValues.reduce((sum, d) => sum + d.totalTokens, 0) / allValues.length;
      return {
        predictedLatencyMs: avgLatency || 1000,
        predictedCostUsd: avgCost || 0.01,
        predictedTokens: avgTokens || 100,
        confidence: 0.1,
        basedOnSamples: allValues.length,
        factors: {
          modelType: 0.25,
          promptLength: 0.25,
          timeOfDay: 0.25,
          sessionHistory: 0.25,
        },
      };
    }
    // Weighted prediction based on similarity
    let weightedLatency = 0;
    let weightedCost = 0;
    let weightedTokens = 0;
    let totalWeight = 0;
    for (const sample of similarSamples) {
      const weight = this.calculateSimilarityWeight(sample, context);
      weightedLatency += sample.latencyMs * weight;
      weightedCost += (sample.totalCostUsd || 0) * weight;
      weightedTokens += sample.totalTokens * weight;
      totalWeight += weight;
    }
    const confidence = Math.min(similarSamples.length / 10, 1.0);
    return {
      predictedLatencyMs:
        totalWeight > 0 ? weightedLatency / totalWeight : 1000,
      predictedCostUsd: totalWeight > 0 ? weightedCost / totalWeight : 0.01,
      predictedTokens: totalWeight > 0 ? weightedTokens / totalWeight : 100,
      confidence,
      basedOnSamples: similarSamples.length,
      factors: {
        modelType: 0.4, // Model has highest impact
        promptLength: 0.3,
        timeOfDay: 0.2,
        sessionHistory: 0.1,
      },
    };
  }
  findSimilarSamples(context) {
    return this.historicalData
      .filter((d) => d.model === context.model)
      .filter((d) => {
        const promptLengthSimilar =
          Math.abs(d.inputTokens - context.promptLength) <
          context.promptLength * 0.5;
        const timeSimilar =
          Math.abs(new Date(d.timestamp).getHours() - context.timeOfDay) <= 2;
        return promptLengthSimilar && timeSimilar;
      })
      .slice(-50); // Limit to recent samples
  }
  calculateSimilarityWeight(sample, context) {
    const promptSimilarity =
      1 /
      (1 +
        Math.abs(sample.inputTokens - context.promptLength) /
          context.promptLength);
    const timeSimilarity =
      1 /
      (1 + Math.abs(new Date(sample.timestamp).getHours() - context.timeOfDay));
    return (promptSimilarity + timeSimilarity) / 2;
  }
}
/**
 * Advanced analytics intelligence engine with ML-powered insights
 */
export class AnalyticsIntelligenceEngine extends EventEmitter {
  tokenTracker;
  storageEngine;
  config;
  predictor = new PerformancePredictor();
  detectedPatterns = [];
  lastAnalysisTime = new Map();
  analysisInterval = null;
  minAnalysisIntervalMs = 60000; // 1 minute
  constructor(tokenTracker, storageEngine, config) {
    super();
    this.tokenTracker = tokenTracker;
    this.storageEngine = storageEngine;
    this.config = config;
    this.setupRealtimeAnalysis();
    this.setupBackgroundTraining();
    logger.info('AnalyticsIntelligenceEngine initialized', {
      config: this.config,
      realtimeEnabled: this.config.enableRealtime,
    });
  }
  /**
   * Analyze current usage patterns and detect anomalies
   */
  async analyzeUsagePatterns(sessionId, timeRangeMs = 3600000) {
    const endTimer = createTimer(
      logger,
      'analyzeUsagePatterns',
      LogLevel.DEBUG,
    );
    const analysisKey = sessionId || 'global';
    try {
      // Rate limiting analysis to prevent excessive computation
      const lastAnalysis = this.lastAnalysisTime.get(analysisKey) || 0;
      if (Date.now() - lastAnalysis < this.minAnalysisIntervalMs) {
        logger.debug('Analysis rate limited', {
          analysisKey,
          intervalMs: this.minAnalysisIntervalMs,
        });
        return this.getRecentPatterns(sessionId);
      }
      this.lastAnalysisTime.set(analysisKey, Date.now());
      // Get recent usage data
      const query = {
        sessionId,
        startTime: Date.now() - timeRangeMs,
        endTime: Date.now(),
        limit: 10000,
      };
      const { data: recentData } =
        await this.storageEngine.queryTokenUsage(query);
      if (recentData.length < this.config.minSamplesRequired) {
        logger.debug('Insufficient data for pattern analysis', {
          samplesFound: recentData.length,
          minRequired: this.config.minSamplesRequired,
        });
        return [];
      }
      // Analyze different aspects
      const patterns = [];
      patterns.push(...(await this.detectCostAnomalies(recentData, sessionId)));
      patterns.push(
        ...(await this.detectLatencyAnomalies(recentData, sessionId)),
      );
      patterns.push(
        ...(await this.detectErrorRateAnomalies(recentData, sessionId)),
      );
      patterns.push(
        ...(await this.detectTokenAnomalies(recentData, sessionId)),
      );
      patterns.push(
        ...(await this.detectModelSwitchingPatterns(recentData, sessionId)),
      );
      // Store detected patterns
      for (const pattern of patterns) {
        this.detectedPatterns.push(pattern);
        this.emit('pattern_detected', pattern);
      }
      // Cleanup old patterns
      const cutoff = Date.now() - 24 * 60 * 60 * 1000; // 24 hours
      this.detectedPatterns.splice(0, this.detectedPatterns.length);
      this.detectedPatterns.push(
        ...this.detectedPatterns.filter((p) => p.detectedAt > cutoff),
      );
      return patterns;
    } finally {
      endTimer();
    }
  }
  /**
   * Generate cost optimization recommendations
   */
  async generateOptimizationRecommendations(
    sessionId,
    timeRangeMs = 24 * 60 * 60 * 1000,
  ) {
    const endTimer = createTimer(
      logger,
      'generateOptimizationRecommendations',
      LogLevel.DEBUG,
    );
    try {
      const query = {
        sessionId,
        startTime: Date.now() - timeRangeMs,
        endTime: Date.now(),
        limit: 50000,
      };
      const { data: usageData } =
        await this.storageEngine.queryTokenUsage(query);
      const aggregated = await this.storageEngine.getAggregatedStatistics({
        ...query,
        aggregateBy: 'model',
      });
      const recommendations = [];
      // Model switching recommendations
      recommendations.push(
        ...this.analyzeModelUsageEfficiency(usageData, aggregated),
      );
      // Prompt optimization recommendations
      recommendations.push(...this.analyzePromptEfficiency(usageData));
      // Caching strategy recommendations
      recommendations.push(...this.analyzeCachingOpportunities(usageData));
      // Batch processing recommendations
      recommendations.push(...this.analyzeBatchingOpportunities(usageData));
      // Rate limiting recommendations
      recommendations.push(...this.analyzeRateLimitingOpportunities(usageData));
      // Sort by estimated savings
      recommendations.sort(
        (a, b) => b.estimatedSavingsUsd - a.estimatedSavingsUsd,
      );
      return recommendations.slice(0, 10); // Top 10 recommendations
    } finally {
      endTimer();
    }
  }
  /**
   * Predict performance for upcoming requests
   */
  predictPerformance(context) {
    const currentHour = new Date().getHours();
    const sessionHistory = this.tokenTracker.getSessionData(
      context.sessionId || 'unknown',
      100,
    );
    return this.predictor.predict({
      model: context.model,
      promptLength: context.promptLength,
      timeOfDay: currentHour,
      sessionHistoryLength: sessionHistory.data.length,
    });
  }
  /**
   * Get insights dashboard data
   */
  async getDashboardInsights(timeRangeMs = 24 * 60 * 60 * 1000) {
    const endTimer = createTimer(
      logger,
      'getDashboardInsights',
      LogLevel.DEBUG,
    );
    try {
      const [patterns, recommendations, stats] = await Promise.all([
        this.analyzeUsagePatterns(undefined, timeRangeMs),
        this.generateOptimizationRecommendations(undefined, timeRangeMs),
        this.tokenTracker.getRealtimeStatistics(timeRangeMs),
      ]);
      // Calculate cost trend
      const { data: historicalData } = await this.storageEngine.queryTokenUsage(
        {
          startTime: Date.now() - timeRangeMs,
          endTime: Date.now(),
          limit: 1000,
          sortBy: 'timestamp',
          sortOrder: 'asc',
        },
      );
      const costs = historicalData.map((d) => d.totalCostUsd || 0);
      const costTrend = StatisticalAnalyzer.calculateTrend(costs);
      return {
        patterns: patterns.slice(0, 5), // Top 5 patterns
        recommendations: recommendations.slice(0, 5), // Top 5 recommendations
        statistics: {
          totalCost: stats.totalCost,
          totalTokens: stats.totalTokens,
          averageLatency: stats.averageLatency,
          errorRate: stats.errorRate,
          topModels: stats.topModels,
          costTrend: {
            slope: costTrend.slope,
            isIncreasing: costTrend.isIncreasing,
          },
          anomalyCount: patterns.length,
        },
      };
    } finally {
      endTimer();
    }
  }
  async detectCostAnomalies(data, sessionId) {
    const costs = data
      .map((d) => d.totalCostUsd || 0)
      .filter((cost) => cost > 0);
    if (costs.length < 10) return [];
    const stats = StatisticalAnalyzer.calculateStats(costs);
    const anomalies = StatisticalAnalyzer.detectAnomalies(
      costs,
      this.config.alertThresholds.costSpikeMultiplier,
    );
    if (anomalies.indices.length === 0) return [];
    const affectedSessions = new Set();
    const affectedModels = new Set();
    for (const index of anomalies.indices) {
      if (data[index]) {
        affectedSessions.add(data[index].sessionId);
        affectedModels.add(data[index].model);
      }
    }
    const maxAnomaly = Math.max(...anomalies.scores);
    const currentCost = costs[costs.length - 1] || 0;
    return [
      {
        type: 'cost_spike',
        severity:
          maxAnomaly > 4 ? 'critical' : maxAnomaly > 3 ? 'high' : 'medium',
        description: `Unusual cost spikes detected with ${anomalies.indices.length} anomalous requests`,
        detectedAt: Date.now(),
        affectedSessions: Array.from(affectedSessions),
        affectedModels: Array.from(affectedModels),
        statistics: {
          baseline: stats.mean,
          current: currentCost,
          percentageChange:
            stats.mean > 0
              ? ((currentCost - stats.mean) / stats.mean) * 100
              : 0,
          confidence: Math.min(maxAnomaly / 5, 1.0),
        },
        recommendations: await this.generateOptimizationRecommendations(
          sessionId,
          3600000,
        ),
        metadata: {
          anomalyCount: anomalies.indices.length,
          maxZScore: maxAnomaly,
          threshold: this.config.alertThresholds.costSpikeMultiplier,
        },
      },
    ];
  }
  async detectLatencyAnomalies(data, _sessionId) {
    const latencies = data.map((d) => d.latencyMs);
    if (latencies.length < 10) return [];
    const stats = StatisticalAnalyzer.calculateStats(latencies);
    const anomalies = StatisticalAnalyzer.detectAnomalies(
      latencies,
      this.config.alertThresholds.latencyMultiplier,
    );
    if (anomalies.indices.length === 0) return [];
    const affectedSessions = new Set();
    const affectedModels = new Set();
    for (const index of anomalies.indices) {
      if (data[index]) {
        affectedSessions.add(data[index].sessionId);
        affectedModels.add(data[index].model);
      }
    }
    const maxAnomaly = Math.max(...anomalies.scores);
    const currentLatency = latencies[latencies.length - 1];
    return [
      {
        type: 'unusual_latency',
        severity:
          maxAnomaly > 4 ? 'critical' : maxAnomaly > 3 ? 'high' : 'medium',
        description: `Unusual latency patterns detected in ${anomalies.indices.length} requests`,
        detectedAt: Date.now(),
        affectedSessions: Array.from(affectedSessions),
        affectedModels: Array.from(affectedModels),
        statistics: {
          baseline: stats.mean,
          current: currentLatency,
          percentageChange:
            stats.mean > 0
              ? ((currentLatency - stats.mean) / stats.mean) * 100
              : 0,
          confidence: Math.min(maxAnomaly / 5, 1.0),
        },
        recommendations: [],
        metadata: {
          anomalyCount: anomalies.indices.length,
          maxZScore: maxAnomaly,
          p95Latency: stats.p95,
          p99Latency: stats.p99,
        },
      },
    ];
  }
  async detectErrorRateAnomalies(data, _sessionId) {
    const errorRate =
      data.reduce((sum, d) => sum + d.errorCount, 0) / data.length;
    if (errorRate > this.config.alertThresholds.errorRateThreshold) {
      const affectedSessions = [
        ...new Set(
          data.filter((d) => d.errorCount > 0).map((d) => d.sessionId),
        ),
      ];
      const affectedModels = [
        ...new Set(data.filter((d) => d.errorCount > 0).map((d) => d.model)),
      ];
      return [
        {
          type: 'high_error_rate',
          severity:
            errorRate > 0.1 ? 'critical' : errorRate > 0.05 ? 'high' : 'medium',
          description: `High error rate detected: ${(errorRate * 100).toFixed(1)}%`,
          detectedAt: Date.now(),
          affectedSessions,
          affectedModels,
          statistics: {
            baseline: this.config.alertThresholds.errorRateThreshold,
            current: errorRate,
            percentageChange:
              ((errorRate - this.config.alertThresholds.errorRateThreshold) /
                this.config.alertThresholds.errorRateThreshold) *
              100,
            confidence: 0.9,
          },
          recommendations: [],
          metadata: {
            totalRequests: data.length,
            errorRequests: data.filter((d) => d.errorCount > 0).length,
          },
        },
      ];
    }
    return [];
  }
  async detectTokenAnomalies(data, sessionId) {
    const tokens = data.map((d) => d.totalTokens);
    if (tokens.length < 10) return [];
    const stats = StatisticalAnalyzer.calculateStats(tokens);
    const anomalies = StatisticalAnalyzer.detectAnomalies(
      tokens,
      this.config.alertThresholds.tokenAnomalyStdDev,
    );
    if (anomalies.indices.length === 0) return [];
    return [
      {
        type: 'token_anomaly',
        severity: anomalies.indices.length > 5 ? 'high' : 'medium',
        description: `Unusual token usage patterns in ${anomalies.indices.length} requests`,
        detectedAt: Date.now(),
        affectedSessions: [
          ...new Set(
            anomalies.indices.map((i) => data[i]?.sessionId).filter(Boolean),
          ),
        ],
        affectedModels: [
          ...new Set(
            anomalies.indices.map((i) => data[i]?.model).filter(Boolean),
          ),
        ],
        statistics: {
          baseline: stats.mean,
          current: tokens[tokens.length - 1],
          percentageChange: 0,
          confidence: 0.8,
        },
        recommendations: [],
        metadata: {
          anomalyCount: anomalies.indices.length,
          meanTokens: stats.mean,
          p95Tokens: stats.p95,
        },
      },
    ];
  }
  async detectModelSwitchingPatterns(data, sessionId) {
    // Group by session to detect frequent model switching
    const sessionGroups = new Map();
    for (const item of data) {
      const existing = sessionGroups.get(item.sessionId) || [];
      existing.push(item);
      sessionGroups.set(item.sessionId, existing);
    }
    const patterns = [];
    const frequentSwitchers = [];
    for (const [sessionId, sessionData] of sessionGroups.entries()) {
      if (sessionData.length < 5) continue; // Need minimum requests
      const sortedData = sessionData.sort((a, b) => a.timestamp - b.timestamp);
      let switches = 0;
      for (let i = 1; i < sortedData.length; i++) {
        if (sortedData[i].model !== sortedData[i - 1].model) {
          switches++;
        }
      }
      const switchRate = switches / sortedData.length;
      if (switchRate > 0.3) {
        // More than 30% of requests involve model switching
        frequentSwitchers.push(sessionId);
      }
    }
    if (frequentSwitchers.length > 0) {
      const affectedModels = [
        ...new Set(
          data
            .filter((d) => frequentSwitchers.includes(d.sessionId))
            .map((d) => d.model),
        ),
      ];
      patterns.push({
        type: 'model_switching',
        severity: frequentSwitchers.length > 3 ? 'high' : 'medium',
        description: `Frequent model switching detected in ${frequentSwitchers.length} sessions`,
        detectedAt: Date.now(),
        affectedSessions: frequentSwitchers,
        affectedModels,
        statistics: {
          baseline: 0.1, // 10% expected switch rate
          current: frequentSwitchers.length / sessionGroups.size,
          percentageChange: 0,
          confidence: 0.9,
        },
        recommendations: await this.generateOptimizationRecommendations(
          undefined,
          3600000,
        ),
        metadata: {
          sessionsAnalyzed: sessionGroups.size,
          frequentSwitchers: frequentSwitchers.length,
        },
      });
    }
    return patterns;
  }
  analyzeModelUsageEfficiency(data, aggregated) {
    const recommendations = [];
    // Find expensive models with low efficiency
    const modelEfficiency = new Map();
    for (const result of aggregated) {
      const costPerToken = result.totalCost / Math.max(result.totalTokens, 1);
      modelEfficiency.set(result.groupKey, {
        costPerToken,
        avgLatency: result.averageLatency,
        usage: result.totalTokens,
      });
    }
    // Sort by cost per token and suggest alternatives
    const sortedModels = Array.from(modelEfficiency.entries()).sort(
      (a, b) => b[1].costPerToken - a[1].costPerToken,
    );
    if (sortedModels.length >= 2) {
      const mostExpensive = sortedModels[0];
      const cheapest = sortedModels[sortedModels.length - 1];
      if (mostExpensive[1].costPerToken > cheapest[1].costPerToken * 2) {
        const potentialSavings =
          (mostExpensive[1].costPerToken - cheapest[1].costPerToken) *
          mostExpensive[1].usage;
        recommendations.push({
          type: 'model_switching',
          priority: 'high',
          title: `Switch from ${mostExpensive[0]} to ${cheapest[0]}`,
          description: `${mostExpensive[0]} costs ${mostExpensive[1].costPerToken.toFixed(6)} per token while ${cheapest[0]} costs ${cheapest[1].costPerToken.toFixed(6)} per token`,
          estimatedSavingsUsd: potentialSavings,
          estimatedSavingsPercentage:
            ((mostExpensive[1].costPerToken - cheapest[1].costPerToken) /
              mostExpensive[1].costPerToken) *
            100,
          implementationComplexity: 'easy',
          actionItems: [
            `Test ${cheapest[0]} with your current prompts`,
            'Compare output quality',
            `Gradually migrate traffic from ${mostExpensive[0]} to ${cheapest[0]}`,
            'Monitor performance metrics',
          ],
          validFor: {
            models: [mostExpensive[0]],
            usagePeriods: ['all'],
            sessionTypes: ['all'],
          },
        });
      }
    }
    return recommendations;
  }
  analyzePromptEfficiency(data) {
    const recommendations = [];
    // Analyze input vs output token ratios
    const inputOutputRatios = data.map((d) => ({
      ratio: d.outputTokens / Math.max(d.inputTokens, 1),
      cost: d.totalCostUsd || 0,
      tokens: d.totalTokens,
    }));
    const avgRatio =
      inputOutputRatios.reduce((sum, r) => sum + r.ratio, 0) /
      inputOutputRatios.length;
    // If average ratio is very low, suggest prompt optimization
    if (avgRatio < 0.1) {
      // Less than 10% output tokens
      const potentialSavings =
        data.reduce((sum, d) => sum + (d.totalCostUsd || 0), 0) * 0.2; // Estimate 20% savings
      recommendations.push({
        type: 'prompt_optimization',
        priority: 'medium',
        title: 'Optimize prompt efficiency',
        description:
          'Your prompts generate relatively little output compared to input. Consider more focused prompts.',
        estimatedSavingsUsd: potentialSavings,
        estimatedSavingsPercentage: 20,
        implementationComplexity: 'medium',
        actionItems: [
          'Review prompts for unnecessary context',
          'Use more specific instructions',
          'Consider breaking complex prompts into steps',
          'Test prompt variations for efficiency',
        ],
        validFor: {
          models: ['all'],
          usagePeriods: ['all'],
          sessionTypes: ['all'],
        },
      });
    }
    return recommendations;
  }
  analyzeCachingOpportunities(data) {
    const recommendations = [];
    // Look for repeated patterns that could benefit from caching
    const cachedTokens = data.reduce((sum, d) => sum + d.cachedTokens, 0);
    const totalTokens = data.reduce((sum, d) => sum + d.totalTokens, 0);
    const cacheRatio = cachedTokens / Math.max(totalTokens, 1);
    // If cache usage is low, suggest implementing caching
    if (cacheRatio < 0.05 && data.length > 50) {
      // Less than 5% cached tokens
      const potentialSavings =
        data.reduce((sum, d) => sum + (d.totalCostUsd || 0), 0) * 0.15; // Estimate 15% savings
      recommendations.push({
        type: 'caching_strategy',
        priority: 'high',
        title: 'Implement content caching',
        description:
          'Low cache usage detected. Implement caching for repeated prompts and context.',
        estimatedSavingsUsd: potentialSavings,
        estimatedSavingsPercentage: 15,
        implementationComplexity: 'medium',
        actionItems: [
          'Identify frequently used prompts and context',
          'Implement prompt caching strategy',
          'Use cached content tokens for repeated requests',
          'Monitor cache hit rates',
        ],
        validFor: {
          models: ['gemini-1.5-pro', 'gemini-1.5-flash'],
          usagePeriods: ['all'],
          sessionTypes: ['conversational', 'batch'],
        },
      });
    }
    return recommendations;
  }
  analyzeBatchingOpportunities(data) {
    const recommendations = [];
    // Analyze request frequency to identify batching opportunities
    const requestsByHour = new Map();
    for (const item of data) {
      const hour = new Date(item.timestamp).getHours();
      const existing = requestsByHour.get(hour) || [];
      existing.push(item);
      requestsByHour.set(hour, existing);
    }
    // Find hours with high request frequency
    const highFrequencyHours = [];
    for (const [hour, requests] of requestsByHour.entries()) {
      if (requests.length > 10) {
        // More than 10 requests per hour
        highFrequencyHours.push(hour);
      }
    }
    if (highFrequencyHours.length > 0) {
      const batchableRequests = highFrequencyHours.reduce(
        (sum, hour) => sum + (requestsByHour.get(hour)?.length || 0),
        0,
      );
      const potentialSavings = batchableRequests * 0.002; // Estimate $0.002 savings per batched request
      recommendations.push({
        type: 'batch_processing',
        priority: 'medium',
        title: 'Implement request batching',
        description: `${batchableRequests} requests during peak hours could benefit from batching`,
        estimatedSavingsUsd: potentialSavings,
        estimatedSavingsPercentage: 10,
        implementationComplexity: 'hard',
        actionItems: [
          'Identify requests that can be batched together',
          'Implement request queuing system',
          'Batch similar requests to reduce API calls',
          'Monitor batch processing efficiency',
        ],
        validFor: {
          models: ['all'],
          usagePeriods: highFrequencyHours.map((h) => `${h}:00-${h + 1}:00`),
          sessionTypes: ['batch', 'automated'],
        },
      });
    }
    return recommendations;
  }
  analyzeRateLimitingOpportunities(data) {
    const recommendations = [];
    // Analyze request timing to identify potential rate limiting benefits
    const sortedData = data.sort((a, b) => a.timestamp - b.timestamp);
    const requestIntervals = [];
    for (let i = 1; i < sortedData.length; i++) {
      const interval = sortedData[i].timestamp - sortedData[i - 1].timestamp;
      requestIntervals.push(interval);
    }
    if (requestIntervals.length > 0) {
      const stats = StatisticalAnalyzer.calculateStats(requestIntervals);
      // If many requests are very close together, suggest rate limiting
      if (stats.p95 < 1000) {
        // 95% of requests within 1 second
        const burstRequests = requestIntervals.filter(
          (interval) => interval < 100,
        ).length; // Within 100ms
        if (burstRequests > data.length * 0.2) {
          // More than 20% are burst requests
          recommendations.push({
            type: 'rate_limiting',
            priority: 'low',
            title: 'Implement rate limiting',
            description: `${burstRequests} requests are sent in rapid bursts. Rate limiting could reduce costs.`,
            estimatedSavingsUsd: burstRequests * 0.001, // Small savings per controlled request
            estimatedSavingsPercentage: 5,
            implementationComplexity: 'medium',
            actionItems: [
              'Implement request rate limiting',
              'Queue rapid requests for processing',
              'Batch rapid requests when possible',
              'Monitor for improved efficiency',
            ],
            validFor: {
              models: ['all'],
              usagePeriods: ['peak'],
              sessionTypes: ['automated', 'high-frequency'],
            },
          });
        }
      }
    }
    return recommendations;
  }
  getRecentPatterns(sessionId) {
    const filtered = sessionId
      ? this.detectedPatterns.filter((p) =>
          p.affectedSessions.includes(sessionId),
        )
      : this.detectedPatterns;
    return filtered.sort((a, b) => b.detectedAt - a.detectedAt).slice(0, 10); // Most recent 10 patterns
  }
  setupRealtimeAnalysis() {
    if (!this.config.enableRealtime) return;
    this.tokenTracker.on('token_batch', async (event) => {
      try {
        const _data = Array.isArray(event.data) ? event.data : [event.data];
        await this.analyzeUsagePatterns(
          undefined,
          this.config.lookbackHours * 60 * 60 * 1000,
        );
      } catch (error) {
        logger.error('Realtime analysis failed', { error });
      }
    });
    // Periodic analysis for comprehensive patterns
    this.analysisInterval = setInterval(
      async () => {
        try {
          await this.analyzeUsagePatterns(
            undefined,
            this.config.lookbackHours * 60 * 60 * 1000,
          );
        } catch (error) {
          logger.error('Periodic analysis failed', { error });
        }
      },
      10 * 60 * 1000,
    ); // Every 10 minutes
  }
  setupBackgroundTraining() {
    // Train the predictor with historical data every hour
    setInterval(
      async () => {
        try {
          const { data: trainingData } =
            await this.storageEngine.queryTokenUsage({
              startTime: Date.now() - 7 * 24 * 60 * 60 * 1000, // Last 7 days
              limit: 10000,
              sortBy: 'timestamp',
              sortOrder: 'desc',
            });
          this.predictor.train(trainingData);
          logger.debug('Predictor training completed', {
            samplesUsed: trainingData.length,
          });
        } catch (error) {
          logger.error('Background training failed', { error });
        }
      },
      60 * 60 * 1000,
    ); // Every hour
  }
  /**
   * Cleanup method for graceful shutdown
   */
  cleanup() {
    if (this.analysisInterval) {
      clearInterval(this.analysisInterval);
      this.analysisInterval = null;
    }
    this.removeAllListeners();
    logger.info('AnalyticsIntelligenceEngine cleaned up');
  }
}
/**
 * Global singleton instance for efficient resource usage
 */
let globalIntelligenceEngine = null;
/**
 * Get or create the global AnalyticsIntelligenceEngine instance
 */
export function getGlobalIntelligenceEngine(
  tokenTracker,
  storageEngine,
  config,
) {
  if (!globalIntelligenceEngine) {
    const defaultConfig = {
      enableRealtime: true,
      sensitivity: 'medium',
      lookbackHours: 24,
      minSamplesRequired: 10,
      alertThresholds: {
        costSpikeMultiplier: 2.5,
        latencyMultiplier: 2.0,
        errorRateThreshold: 0.05,
        tokenAnomalyStdDev: 2.5,
      },
      ...config,
    };
    globalIntelligenceEngine = new AnalyticsIntelligenceEngine(
      tokenTracker,
      storageEngine,
      defaultConfig,
    );
  }
  return globalIntelligenceEngine;
}
/**
 * Reset the global intelligence engine (mainly for testing)
 */
export function resetGlobalIntelligenceEngine() {
  if (globalIntelligenceEngine) {
    globalIntelligenceEngine.cleanup();
    globalIntelligenceEngine = null;
  }
}
//# sourceMappingURL=analytics-intelligence-engine.js.map
