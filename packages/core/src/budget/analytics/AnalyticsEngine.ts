/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import type { BudgetTracker } from '../budget-tracker.js';

/**
 * Multi-dimensional usage analysis dimensions
 */
export type AnalyticsDimension =
  | 'feature'
  | 'user'
  | 'time'
  | 'project'
  | 'model'
  | 'endpoint'
  | 'session'
  | 'geographic';

/**
 * Usage pattern types for pattern recognition
 */
export type UsagePattern =
  | 'spike'
  | 'gradual_increase'
  | 'periodic'
  | 'weekend_dip'
  | 'business_hours'
  | 'anomalous'
  | 'seasonal'
  | 'burst'
  | 'sustained';

/**
 * Optimization recommendation types
 */
export type OptimizationType =
  | 'cost_reduction'
  | 'usage_smoothing'
  | 'budget_reallocation'
  | 'rate_limiting'
  | 'caching_improvement'
  | 'batch_processing'
  | 'off_peak_scheduling'
  | 'feature_optimization'
  | 'redundancy_elimination';

/**
 * Comprehensive usage metrics with multi-dimensional analysis
 */
export interface UsageMetrics {
  timestamp: string;
  requestCount: number;
  cost: number;
  feature?: string;
  user?: string;
  project?: string;
  model?: string;
  endpoint?: string;
  sessionId?: string;
  responseTime?: number;
  tokens?: number;
  geographic?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Feature-level cost analysis and ROI data
 */
export interface FeatureCostAnalysis {
  featureId: string;
  featureName: string;
  totalCost: number;
  requestCount: number;
  averageCostPerRequest: number;
  usageFrequency: number;
  businessValue: number;
  roi: number;
  costTrend: 'increasing' | 'decreasing' | 'stable' | 'volatile';
  utilizationRate: number;
  peakUsageHours: string[];
  recommendations: OptimizationRecommendation[];
  /** Timestamp for the analysis data point */
  timestamp?: string;
  /** Performance score (0-100) for this analysis */
  performance?: number;
}

/**
 * Intelligent optimization recommendation
 */
export interface OptimizationRecommendation {
  id: string;
  type: OptimizationType;
  title: string;
  description: string;
  potentialSavings: number;
  savingsPercentage: number;
  implementationComplexity: 'low' | 'medium' | 'high';
  timeToImplement: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  confidenceScore: number;
  applicableFeatures: string[];
  actionItems: string[];
  metrics: {
    currentCost: number;
    projectedCost: number;
    expectedReduction: number;
  };
}

/**
 * Usage pattern recognition result
 */
export interface PatternAnalysis {
  patternType: UsagePattern;
  confidence: number;
  description: string;
  timeWindow: {
    start: string;
    end: string;
  };
  frequency: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  affectedFeatures: string[];
  recommendations: OptimizationRecommendation[];
}

/**
 * Anomaly detection result
 */
export interface AnomalyDetection {
  id: string;
  timestamp: string;
  type: 'cost_spike' | 'unusual_pattern' | 'efficiency_drop' | 'volume_anomaly';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  actualValue: number;
  expectedValue: number;
  deviationPercentage: number;
  affectedDimensions: AnalyticsDimension[];
  rootCauseAnalysis: string[];
  recommendations: OptimizationRecommendation[];
}

/**
 * Comprehensive analytics report
 */
export interface AnalyticsReport {
  generatedAt: string;
  period: {
    start: string;
    end: string;
  };
  summary: {
    totalCost: number;
    totalRequests: number;
    averageCostPerRequest: number;
    costTrend: 'increasing' | 'decreasing' | 'stable';
    budgetUtilization: number;
    projectedMonthlySpend: number;
  };
  featureAnalysis: FeatureCostAnalysis[];
  patternAnalysis: PatternAnalysis[];
  anomalies: AnomalyDetection[];
  optimizationRecommendations: OptimizationRecommendation[];
  potentialSavings: {
    immediate: number;
    shortTerm: number;
    longTerm: number;
    total: number;
    percentage: number;
  };
  actionPlan: {
    critical: OptimizationRecommendation[];
    highPriority: OptimizationRecommendation[];
    quickWins: OptimizationRecommendation[];
  };
}

/**
 * Analytics engine configuration
 */
export interface AnalyticsConfig {
  enabled: boolean;
  dataRetentionDays: number;
  analysisIntervalMinutes: number;
  anomalyDetection: {
    enabled: boolean;
    sensitivityLevel: 'low' | 'medium' | 'high';
    lookbackDays: number;
  };
  patternRecognition: {
    enabled: boolean;
    minimumDataPoints: number;
    confidenceThreshold: number;
  };
  optimization: {
    enabled: boolean;
    targetSavingsPercentage: number;
    includeComplexRecommendations: boolean;
  };
}

/**
 * Advanced analytics engine providing comprehensive usage insights and optimization recommendations
 */
export class AnalyticsEngine {
  private projectRoot: string;
  private config: AnalyticsConfig;
  private budgetTracker: BudgetTracker;
  private analyticsDataPath: string;
  private metricsCache: Map<string, UsageMetrics[]> = new Map();

  constructor(
    projectRoot: string,
    budgetTracker: BudgetTracker,
    config: Partial<AnalyticsConfig> = {},
  ) {
    this.projectRoot = projectRoot;
    this.budgetTracker = budgetTracker;
    this.analyticsDataPath = path.join(projectRoot, '.gemini', 'analytics');

    this.config = {
      enabled: true,
      dataRetentionDays: 90,
      analysisIntervalMinutes: 60,
      anomalyDetection: {
        enabled: true,
        sensitivityLevel: 'medium',
        lookbackDays: 14,
      },
      patternRecognition: {
        enabled: true,
        minimumDataPoints: 10,
        confidenceThreshold: 0.8,
      },
      optimization: {
        enabled: true,
        targetSavingsPercentage: 30,
        includeComplexRecommendations: false,
      },
      ...config,
    };
  }

  /**
   * Record usage metrics with multi-dimensional data
   */
  async recordUsage(metrics: Omit<UsageMetrics, 'timestamp'>): Promise<void> {
    if (!this.config.enabled) return;

    const usageRecord: UsageMetrics = {
      timestamp: new Date().toISOString(),
      ...metrics,
    };

    await this.saveMetrics(usageRecord);
    await this.budgetTracker.recordRequest();

    // Trigger real-time analysis for critical patterns
    if (metrics.cost > (await this.getAverageCostPerRequest()) * 3) {
      await this.checkForAnomalies([usageRecord]);
    }
  }

  /**
   * Generate comprehensive analytics report
   */
  async generateReport(
    startDate: string = this.getDateDaysAgo(30),
    endDate: string = new Date().toISOString(),
  ): Promise<AnalyticsReport> {
    const metrics = await this.getMetricsInRange(startDate, endDate);

    const summary = await this.calculateSummary(metrics);
    const featureAnalysis = await this.analyzeFeatureCosts(metrics);
    const patternAnalysis = await this.recognizePatterns(metrics);
    const anomalies = await this.detectAnomalies(metrics);
    const optimizationRecommendations =
      await this.generateOptimizationRecommendations(
        metrics,
        featureAnalysis,
        patternAnalysis,
        anomalies,
      );

    const potentialSavings = this.calculatePotentialSavings(
      optimizationRecommendations,
    );
    const actionPlan = this.prioritizeRecommendations(
      optimizationRecommendations,
    );

    return {
      generatedAt: new Date().toISOString(),
      period: { start: startDate, end: endDate },
      summary,
      featureAnalysis,
      patternAnalysis,
      anomalies,
      optimizationRecommendations,
      potentialSavings,
      actionPlan,
    };
  }

  /**
   * Analyze costs by feature with ROI calculations
   */
  async analyzeFeatureCosts(
    metrics: UsageMetrics[],
  ): Promise<FeatureCostAnalysis[]> {
    const featureGroups = this.groupMetricsByDimension(metrics, 'feature');
    const analyses: FeatureCostAnalysis[] = [];

    for (const [featureId, featureMetrics] of featureGroups.entries()) {
      if (!featureId || featureId === 'undefined') continue;

      const totalCost = featureMetrics.reduce((sum, m) => sum + m.cost, 0);
      const requestCount = featureMetrics.length;
      const averageCostPerRequest = totalCost / requestCount;

      // Calculate business value and ROI (simplified heuristic)
      const businessValue = await this.calculateBusinessValue(
        featureId,
        featureMetrics,
      );
      const roi =
        businessValue > 0 ? (businessValue - totalCost) / totalCost : -1;

      const costTrend = this.analyzeCostTrend(featureMetrics);
      const utilizationRate = this.calculateUtilizationRate(featureMetrics);
      const peakUsageHours = this.identifyPeakUsageHours(featureMetrics);

      const recommendations = await this.generateFeatureRecommendations(
        featureId,
        featureMetrics,
        { totalCost, roi, utilizationRate },
      );

      analyses.push({
        featureId,
        featureName: featureId, // Could be enhanced with feature registry
        totalCost,
        requestCount,
        averageCostPerRequest,
        usageFrequency: this.calculateUsageFrequency(featureMetrics),
        businessValue,
        roi,
        costTrend,
        utilizationRate,
        peakUsageHours,
        recommendations,
      });
    }

    return analyses.sort((a, b) => b.totalCost - a.totalCost);
  }

  /**
   * Advanced pattern recognition system
   */
  async recognizePatterns(metrics: UsageMetrics[]): Promise<PatternAnalysis[]> {
    if (
      !this.config.patternRecognition.enabled ||
      metrics.length < this.config.patternRecognition.minimumDataPoints
    ) {
      return [];
    }

    const patterns: PatternAnalysis[] = [];
    const timeGrouped = this.groupMetricsByTimeWindow(metrics, 'hour');

    // Detect usage spikes
    const spikes = this.detectSpikes(timeGrouped);
    patterns.push(...spikes);

    // Detect periodic patterns
    const periodic = this.detectPeriodicPatterns(timeGrouped);
    patterns.push(...periodic);

    // Detect business hours patterns
    const businessHours = this.detectBusinessHoursPattern(timeGrouped);
    if (businessHours) patterns.push(businessHours);

    // Detect weekend patterns
    const weekendPattern = this.detectWeekendPattern(timeGrouped);
    if (weekendPattern) patterns.push(weekendPattern);

    return patterns.filter(
      (p) => p.confidence >= this.config.patternRecognition.confidenceThreshold,
    );
  }

  /**
   * Anomaly detection system
   */
  async detectAnomalies(metrics: UsageMetrics[]): Promise<AnomalyDetection[]> {
    if (!this.config.anomalyDetection.enabled) return [];

    const anomalies: AnomalyDetection[] = [];
    const recentMetrics = this.getRecentMetrics(
      metrics,
      this.config.anomalyDetection.lookbackDays,
    );

    // Cost spike detection
    const costAnomalies = this.detectCostAnomalies(recentMetrics);
    anomalies.push(...costAnomalies);

    // Volume anomalies
    const volumeAnomalies = this.detectVolumeAnomalies(recentMetrics);
    anomalies.push(...volumeAnomalies);

    // Efficiency drops
    const efficiencyAnomalies = this.detectEfficiencyAnomalies(recentMetrics);
    anomalies.push(...efficiencyAnomalies);

    return anomalies;
  }

  /**
   * Generate intelligent optimization recommendations
   */
  private async generateOptimizationRecommendations(
    metrics: UsageMetrics[],
    featureAnalysis: FeatureCostAnalysis[],
    patternAnalysis: PatternAnalysis[],
    anomalies: AnomalyDetection[],
  ): Promise<OptimizationRecommendation[]> {
    const recommendations: OptimizationRecommendation[] = [];

    // Generate recommendations from feature analysis
    for (const feature of featureAnalysis) {
      recommendations.push(...feature.recommendations);
    }

    // Generate recommendations from pattern analysis
    for (const pattern of patternAnalysis) {
      recommendations.push(...pattern.recommendations);
    }

    // Generate recommendations from anomalies
    for (const anomaly of anomalies) {
      recommendations.push(...anomaly.recommendations);
    }

    // Generate system-wide recommendations
    const systemRecommendations = await this.generateSystemWideRecommendations(
      metrics,
      featureAnalysis,
    );
    recommendations.push(...systemRecommendations);

    // Deduplicate and rank recommendations
    return this.deduplicateAndRankRecommendations(recommendations);
  }

  // Helper methods for analytics calculations and data processing

  private async saveMetrics(metrics: UsageMetrics): Promise<void> {
    const date = metrics.timestamp.split('T')[0];
    const filePath = path.join(this.analyticsDataPath, `${date}.json`);

    await fs.mkdir(this.analyticsDataPath, { recursive: true });

    let existingMetrics: UsageMetrics[] = [];
    try {
      const data = await fs.readFile(filePath, 'utf-8');
      existingMetrics = JSON.parse(data);
    } catch {
      // File doesn't exist, start fresh
    }

    existingMetrics.push(metrics);
    await fs.writeFile(filePath, JSON.stringify(existingMetrics, null, 2));
  }

  private async getMetricsInRange(
    startDate: string,
    endDate: string,
  ): Promise<UsageMetrics[]> {
    const metrics: UsageMetrics[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);

    for (
      let date = new Date(start);
      date <= end;
      date.setDate(date.getDate() + 1)
    ) {
      const dateStr = date.toISOString().split('T')[0];
      const filePath = path.join(this.analyticsDataPath, `${dateStr}.json`);

      try {
        const data = await fs.readFile(filePath, 'utf-8');
        const dayMetrics = JSON.parse(data) as UsageMetrics[];
        metrics.push(...dayMetrics);
      } catch {
        // File doesn't exist, continue
      }
    }

    return metrics;
  }

  private async calculateSummary(metrics: UsageMetrics[]) {
    const totalCost = metrics.reduce((sum, m) => sum + m.cost, 0);
    const totalRequests = metrics.length;
    const averageCostPerRequest =
      totalRequests > 0 ? totalCost / totalRequests : 0;

    const budgetStats = await this.budgetTracker.getUsageStats();
    const budgetUtilization = budgetStats.usagePercentage / 100;

    // Project monthly spend based on current usage
    const daysInPeriod = Math.max(1, this.calculateDaysInPeriod(metrics));
    const dailyAverageCost = totalCost / daysInPeriod;
    const projectedMonthlySpend = dailyAverageCost * 30;

    const costTrend = this.analyzeCostTrend(metrics);

    return {
      totalCost,
      totalRequests,
      averageCostPerRequest,
      costTrend,
      budgetUtilization,
      projectedMonthlySpend,
    };
  }

  // Additional helper methods would be implemented here...
  // (Pattern detection, anomaly detection, recommendation generation, etc.)

  private groupMetricsByDimension(
    metrics: UsageMetrics[],
    dimension: AnalyticsDimension,
  ): Map<string, UsageMetrics[]> {
    const groups = new Map<string, UsageMetrics[]>();

    for (const metric of metrics) {
      const key = metric[dimension] || 'unknown';
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(metric);
    }

    return groups;
  }

  private async getAverageCostPerRequest(): Promise<number> {
    // Implementation would calculate average cost from recent data
    return 0.01; // Placeholder
  }

  private getDateDaysAgo(days: number): string {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString();
  }

  // Additional methods for pattern detection, anomaly detection, etc. would be implemented here
  private calculateDaysInPeriod(metrics: UsageMetrics[]): number {
    if (metrics.length === 0) return 1;

    const timestamps = metrics.map((m) => new Date(m.timestamp).getTime());
    const minTime = Math.min(...timestamps);
    const maxTime = Math.max(...timestamps);

    return Math.max(1, Math.ceil((maxTime - minTime) / (1000 * 60 * 60 * 24)));
  }

  private analyzeCostTrend(
    metrics: UsageMetrics[],
  ): 'increasing' | 'decreasing' | 'stable' {
    if (metrics.length < 2) return 'stable';

    const sortedMetrics = [...metrics].sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    );

    const firstHalf = sortedMetrics.slice(
      0,
      Math.floor(sortedMetrics.length / 2),
    );
    const secondHalf = sortedMetrics.slice(
      Math.floor(sortedMetrics.length / 2),
    );

    const firstHalfAvg =
      firstHalf.reduce((sum, m) => sum + m.cost, 0) / firstHalf.length;
    const secondHalfAvg =
      secondHalf.reduce((sum, m) => sum + m.cost, 0) / secondHalf.length;

    const changePercentage =
      Math.abs((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100;

    if (changePercentage < 5) return 'stable';
    return secondHalfAvg > firstHalfAvg ? 'increasing' : 'decreasing';
  }

  private calculatePotentialSavings(
    recommendations: OptimizationRecommendation[],
  ) {
    const immediate = recommendations
      .filter((r) => r.implementationComplexity === 'low')
      .reduce((sum, r) => sum + r.potentialSavings, 0);

    const shortTerm = recommendations
      .filter((r) => r.implementationComplexity === 'medium')
      .reduce((sum, r) => sum + r.potentialSavings, 0);

    const longTerm = recommendations
      .filter((r) => r.implementationComplexity === 'high')
      .reduce((sum, r) => sum + r.potentialSavings, 0);

    const total = immediate + shortTerm + longTerm;

    return {
      immediate,
      shortTerm,
      longTerm,
      total,
      percentage: total > 0 ? (total / (total + 1000)) * 100 : 0, // Placeholder calculation
    };
  }

  private prioritizeRecommendations(
    recommendations: OptimizationRecommendation[],
  ) {
    const critical = recommendations.filter((r) => r.priority === 'critical');
    const highPriority = recommendations.filter((r) => r.priority === 'high');
    const quickWins = recommendations.filter(
      (r) => r.implementationComplexity === 'low' && r.potentialSavings > 0,
    );

    return { critical, highPriority, quickWins };
  }

  private deduplicateAndRankRecommendations(
    recommendations: OptimizationRecommendation[],
  ): OptimizationRecommendation[] {
    const seen = new Set<string>();
    const unique = recommendations.filter((r) => {
      const key = `${r.type}-${r.title}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return unique.sort((a, b) => {
      if (a.priority !== b.priority) {
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }
      return b.potentialSavings - a.potentialSavings;
    });
  }

  // Placeholder methods that would need full implementation
  private async calculateBusinessValue(
    featureId: string,
    metrics: UsageMetrics[],
  ): Promise<number> {
    // This would implement business value calculation logic
    // For now, return a simple heuristic based on usage frequency
    return metrics.length * 0.5;
  }

  private calculateUtilizationRate(metrics: UsageMetrics[]): number {
    // Calculate how efficiently the feature is being used
    // This is a placeholder implementation
    return Math.min(1, metrics.length / 100);
  }

  private calculateUsageFrequency(metrics: UsageMetrics[]): number {
    // Calculate usage frequency score
    if (metrics.length === 0) return 0;

    const uniqueDays = new Set(metrics.map((m) => m.timestamp.split('T')[0]))
      .size;
    return metrics.length / Math.max(1, uniqueDays);
  }

  private identifyPeakUsageHours(metrics: UsageMetrics[]): string[] {
    const hourCounts = new Map<string, number>();

    for (const metric of metrics) {
      const hour = new Date(metric.timestamp)
        .getHours()
        .toString()
        .padStart(2, '0');
      hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
    }

    const maxCount = Math.max(...hourCounts.values());
    return Array.from(hourCounts.entries())
      .filter(([_, count]) => count >= maxCount * 0.8)
      .map(([hour]) => `${hour}:00`)
      .sort();
  }

  private async generateFeatureRecommendations(
    featureId: string,
    metrics: UsageMetrics[],
    analysis: { totalCost: number; roi: number; utilizationRate: number },
  ): Promise<OptimizationRecommendation[]> {
    const recommendations: OptimizationRecommendation[] = [];

    // Low ROI recommendation
    if (analysis.roi < 0.1) {
      recommendations.push({
        id: `feature-${featureId}-low-roi`,
        type: 'feature_optimization',
        title: `Optimize low-ROI feature: ${featureId}`,
        description: `Feature ${featureId} has low ROI (${(analysis.roi * 100).toFixed(1)}%). Consider optimization or deprecation.`,
        potentialSavings: analysis.totalCost * 0.3,
        savingsPercentage: 30,
        implementationComplexity: 'medium',
        timeToImplement: '2-4 weeks',
        priority: 'medium',
        confidenceScore: 0.8,
        applicableFeatures: [featureId],
        actionItems: [
          'Review feature usage patterns',
          'Analyze user feedback and business value',
          'Consider feature optimization or deprecation',
          'Implement more efficient algorithms if keeping',
        ],
        metrics: {
          currentCost: analysis.totalCost,
          projectedCost: analysis.totalCost * 0.7,
          expectedReduction: analysis.totalCost * 0.3,
        },
      });
    }

    return recommendations;
  }

  private async generateSystemWideRecommendations(
    metrics: UsageMetrics[],
    featureAnalysis: FeatureCostAnalysis[],
  ): Promise<OptimizationRecommendation[]> {
    const recommendations: OptimizationRecommendation[] = [];

    // Batch processing recommendation
    const totalRequests = metrics.length;
    if (totalRequests > 1000) {
      recommendations.push({
        id: 'system-batch-processing',
        type: 'batch_processing',
        title: 'Implement batch processing for high-volume operations',
        description:
          'High request volume detected. Batch processing could reduce costs significantly.',
        potentialSavings: totalRequests * 0.01 * 0.25, // 25% savings on cost per request
        savingsPercentage: 25,
        implementationComplexity: 'high',
        timeToImplement: '4-8 weeks',
        priority: 'high',
        confidenceScore: 0.9,
        applicableFeatures: featureAnalysis.slice(0, 3).map((f) => f.featureId),
        actionItems: [
          'Identify operations suitable for batching',
          'Implement batch processing infrastructure',
          'Update client code to use batch APIs',
          'Monitor performance and cost impact',
        ],
        metrics: {
          currentCost: totalRequests * 0.01,
          projectedCost: totalRequests * 0.01 * 0.75,
          expectedReduction: totalRequests * 0.01 * 0.25,
        },
      });
    }

    return recommendations;
  }

  // Additional placeholder methods for pattern detection
  private groupMetricsByTimeWindow(
    _metrics: UsageMetrics[],
    _window: 'hour' | 'day',
  ): Map<string, UsageMetrics[]> {
    return new Map(); // Placeholder
  }

  private detectSpikes(
    _timeGrouped: Map<string, UsageMetrics[]>,
  ): PatternAnalysis[] {
    return []; // Placeholder
  }

  private detectPeriodicPatterns(
    _timeGrouped: Map<string, UsageMetrics[]>,
  ): PatternAnalysis[] {
    return []; // Placeholder
  }

  private detectBusinessHoursPattern(
    _timeGrouped: Map<string, UsageMetrics[]>,
  ): PatternAnalysis | null {
    return null; // Placeholder
  }

  private detectWeekendPattern(
    _timeGrouped: Map<string, UsageMetrics[]>,
  ): PatternAnalysis | null {
    return null; // Placeholder
  }

  private getRecentMetrics(
    metrics: UsageMetrics[],
    days: number,
  ): UsageMetrics[] {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return metrics.filter((m) => new Date(m.timestamp) >= cutoff);
  }

  private detectCostAnomalies(_metrics: UsageMetrics[]): AnomalyDetection[] {
    return []; // Placeholder
  }

  private detectVolumeAnomalies(_metrics: UsageMetrics[]): AnomalyDetection[] {
    return []; // Placeholder
  }

  private detectEfficiencyAnomalies(
    _metrics: UsageMetrics[],
  ): AnomalyDetection[] {
    return []; // Placeholder
  }

  private async checkForAnomalies(_metrics: UsageMetrics[]): Promise<void> {
    // Real-time anomaly checking logic would go here
  }
  /**
   * Generate comprehensive analytics data
   */
  async generateAnalytics(params: {
    startDate: string;
    endDate: string;
    granularity: 'hour' | 'day' | 'week' | 'month';
    filters?: Record<string, unknown>;
    groupBy?: string;
  }): Promise<{
    dataPoints: Array<{
      period: string;
      cost: number;
      requests: number;
      averageCost: number;
    }>;
    summary: {
      totalCost: number;
      totalRequests: number;
      averageCost: number;
      costRange?: {
        min: number;
        max: number;
      };
    };
    patterns: PatternAnalysis[];
    recommendations: OptimizationRecommendation[];
  }> {
    try {
      const metrics = await this.getMetricsInRange(
        params.startDate,
        params.endDate,
      );
      const filteredMetrics = this.applyFilters(metrics, params.filters || {});

      const analytics = {
        dataPoints: this.groupByGranularity(
          filteredMetrics,
          params.granularity,
        ),
        summary: this.calculateSummaryStats(filteredMetrics),
        patterns: await this.recognizePatterns(filteredMetrics),
        recommendations: await this.generateRecommendations(filteredMetrics),
      };

      return analytics;
    } catch (error) {
      console.error('Failed to generate analytics:', error);
      return {
        dataPoints: [],
        summary: {
          totalCost: 0,
          totalRequests: 0,
          averageCost: 0,
          costRange: { min: 0, max: 0 },
        },
        patterns: [],
        recommendations: [],
      };
    }
  }

  /**
   * Analyze trends and patterns
   */
  async analyzeTrends(params: {
    startDate: string;
    endDate: string;
    granularity: 'hour' | 'day' | 'week' | 'month';
  }): Promise<{
    trends: Array<{
      metric: string;
      direction: 'increasing' | 'decreasing' | 'stable';
      changePercentage: number;
      confidence: number;
    }>;
    patterns: PatternAnalysis[];
    volatility: string;
    forecast: Array<{
      date: string;
      predictedCost: number;
      confidence: number;
    }>;
  }> {
    try {
      const metrics = await this.getMetricsInRange(
        params.startDate,
        params.endDate,
      );
      const trends = this.calculateTrends(metrics);
      const patterns = await this.recognizePatterns(metrics);

      return {
        trends,
        patterns,
        volatility: this.calculateVolatility(metrics),
        forecast: this.generateSimpleForecast(metrics),
      };
    } catch (error) {
      console.error('Failed to analyze trends:', error);
      return { trends: [], patterns: [], volatility: 'stable', forecast: [] };
    }
  }

  /**
   * Generate cost breakdown by specified grouping
   */
  async generateCostBreakdown(params: {
    startDate: string;
    endDate: string;
    groupBy: string;
    filters?: Record<string, unknown>;
  }): Promise<{
    categories: Array<{
      category: string;
      cost: number;
      requests: number;
      averageCost: number;
    }>;
    totalCost: number;
    totalRequests: number;
  }> {
    try {
      const metrics = await this.getMetricsInRange(
        params.startDate,
        params.endDate,
      );
      const filteredMetrics = this.applyFilters(metrics, params.filters || {});

      const breakdown = this.groupMetricsByField(
        filteredMetrics,
        params.groupBy,
      );
      const categories = this.calculateCategoryStats(breakdown);

      return {
        categories,
        totalCost: categories.reduce(
          (sum: number, cat: { cost: number }) => sum + cat.cost,
          0,
        ),
        totalRequests: categories.reduce(
          (sum: number, cat: { requests: number }) => sum + cat.requests,
          0,
        ),
      };
    } catch (error) {
      console.error('Failed to generate cost breakdown:', error);
      return { categories: [], totalCost: 0, totalRequests: 0 };
    }
  }

  /**
   * Execute custom analytics query
   */
  async executeCustomQuery(params: {
    query: Record<string, unknown>;
    aggregations: Record<string, string>;
    filters: Record<string, unknown>;
    customMetrics: Array<Record<string, unknown>>;
  }): Promise<{
    results: Record<string, unknown>;
    totalRecords: number;
    appliedFilters?: Record<string, unknown>;
    executionTime?: number;
    error?: string;
  }> {
    try {
      // Basic implementation for custom queries
      const allMetrics = await this.loadMetrics();
      const filteredMetrics = this.applyFilters(
        allMetrics || [],
        params.filters,
      );

      // Apply custom aggregations
      const results = this.applyAggregations(
        filteredMetrics || [],
        params.aggregations,
      );

      return {
        results,
        totalRecords: filteredMetrics.length,
        appliedFilters: params.filters,
        executionTime: Date.now(),
      };
    } catch (error) {
      console.error('Failed to execute custom query:', error);
      return {
        results: {},
        totalRecords: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Helper methods for the new analytics functions
  private async loadMetrics(): Promise<UsageMetrics[]> {
    const thirtyDaysAgo = this.getDateDaysAgo(30);
    const today = new Date().toISOString();
    return await this.getMetricsInRange(thirtyDaysAgo, today);
  }

  private applyFilters(
    metrics: UsageMetrics[],
    filters: Record<string, unknown>,
  ): UsageMetrics[] {
    return metrics.filter((metric) => {
      for (const [key, value] of Object.entries(filters)) {
        const metricRecord = metric as Record<string, unknown>;
        if (metricRecord[key] !== value) {
          return false;
        }
      }
      return true;
    });
  }

  private groupByGranularity(
    metrics: UsageMetrics[],
    granularity: string,
  ): Array<{
    period: string;
    cost: number;
    requests: number;
    averageCost: number;
  }> {
    const groups = new Map<string, UsageMetrics[]>();

    for (const metric of metrics) {
      const date = new Date(metric.timestamp);
      let key: string;

      switch (granularity) {
        case 'hour':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:00`;
          break;
        case 'day':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
          break;
        case 'week': {
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = `${weekStart.getFullYear()}-W${Math.ceil(weekStart.getDate() / 7)}`;
          break;
        }
        case 'month':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        default:
          key = metric.timestamp;
      }

      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(metric);
    }

    return Array.from(groups.entries()).map(([period, periodMetrics]) => ({
      period,
      cost: periodMetrics.reduce((sum, m) => sum + m.cost, 0),
      requests: periodMetrics.length,
      averageCost:
        periodMetrics.reduce((sum, m) => sum + m.cost, 0) /
          periodMetrics.length || 0,
    }));
  }

  private calculateSummaryStats(metrics: UsageMetrics[]): {
    totalCost: number;
    totalRequests: number;
    averageCost: number;
    costRange?: {
      min: number;
      max: number;
    };
  } {
    if (metrics.length === 0) {
      return { totalCost: 0, totalRequests: 0, averageCost: 0 };
    }

    const totalCost = metrics.reduce((sum, m) => sum + m.cost, 0);
    const totalRequests = metrics.length;
    const averageCost = totalCost / totalRequests;

    return {
      totalCost,
      totalRequests,
      averageCost,
      costRange: {
        min: Math.min(...metrics.map((m) => m.cost)),
        max: Math.max(...metrics.map((m) => m.cost)),
      },
    };
  }

  private async generateRecommendations(
    metrics: UsageMetrics[],
  ): Promise<OptimizationRecommendation[]> {
    // Simple implementation using existing feature analysis
    const featureAnalysis = await this.analyzeFeatureCosts(metrics);
    const recommendations: OptimizationRecommendation[] = [];

    for (const feature of featureAnalysis) {
      recommendations.push(...feature.recommendations);
    }

    return recommendations;
  }

  private calculateTrends(metrics: UsageMetrics[]): Array<{
    metric: string;
    direction: 'increasing' | 'decreasing' | 'stable';
    changePercentage: number;
    confidence: number;
  }> {
    if (metrics.length < 2) return [];

    // Simple linear trend calculation
    const sortedMetrics = metrics.sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    );
    const halfwayPoint = Math.floor(sortedMetrics.length / 2);

    const firstHalf = sortedMetrics.slice(0, halfwayPoint);
    const secondHalf = sortedMetrics.slice(halfwayPoint);

    const firstHalfAvg =
      firstHalf.reduce((sum, m) => sum + m.cost, 0) / firstHalf.length;
    const secondHalfAvg =
      secondHalf.reduce((sum, m) => sum + m.cost, 0) / secondHalf.length;

    const change = ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100;

    return [
      {
        metric: 'cost',
        direction:
          change > 5 ? 'increasing' : change < -5 ? 'decreasing' : 'stable',
        changePercentage: Math.abs(change),
        confidence: Math.min(0.9, metrics.length / 100), // Higher confidence with more data
      },
    ];
  }

  private calculateVolatility(metrics: UsageMetrics[]): string {
    if (metrics.length < 3) return 'insufficient_data';

    const costs = metrics.map((m) => m.cost);
    const mean = costs.reduce((sum, cost) => sum + cost, 0) / costs.length;
    const variance =
      costs.reduce((sum, cost) => sum + Math.pow(cost - mean, 2), 0) /
      costs.length;
    const standardDeviation = Math.sqrt(variance);
    const coefficientOfVariation = standardDeviation / mean;

    if (coefficientOfVariation > 0.5) return 'high';
    if (coefficientOfVariation > 0.2) return 'medium';
    return 'low';
  }

  private generateSimpleForecast(metrics: UsageMetrics[]): Array<{
    date: string;
    predictedCost: number;
    confidence: number;
  }> {
    if (metrics.length < 5) return [];

    // Simple moving average forecast
    const recentMetrics = metrics.slice(-5);
    const avgCost =
      recentMetrics.reduce((sum, m) => sum + m.cost, 0) / recentMetrics.length;

    const forecast = [];
    const now = new Date();

    for (let i = 1; i <= 7; i++) {
      const forecastDate = new Date(now);
      forecastDate.setDate(now.getDate() + i);

      forecast.push({
        date: forecastDate.toISOString(),
        predictedCost: avgCost * (0.9 + Math.random() * 0.2), // Add some variation
        confidence: Math.max(0.5, 1 - i * 0.1), // Decreasing confidence over time
      });
    }

    return forecast;
  }

  private groupMetricsByField(
    metrics: UsageMetrics[],
    field: string,
  ): Map<string, UsageMetrics[]> {
    const groups = new Map<string, UsageMetrics[]>();

    for (const metric of metrics) {
      const metricRecord = metric as Record<string, unknown>;
      const key = String(metricRecord[field] || 'unknown');
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(metric);
    }

    return groups;
  }

  private calculateCategoryStats(
    breakdown: Map<string, UsageMetrics[]>,
  ): Array<{
    category: string;
    cost: number;
    requests: number;
    averageCost: number;
  }> {
    return Array.from(breakdown.entries())
      .map(([category, categoryMetrics]) => ({
        category,
        cost: categoryMetrics.reduce((sum, m) => sum + m.cost, 0),
        requests: categoryMetrics.length,
        averageCost:
          categoryMetrics.reduce((sum, m) => sum + m.cost, 0) /
            categoryMetrics.length || 0,
      }))
      .sort((a, b) => b.cost - a.cost);
  }

  private applyAggregations(
    metrics: UsageMetrics[],
    aggregations: Record<string, string>,
  ): Record<string, unknown> {
    const results: Record<string, unknown> = {};

    for (const [field, aggType] of Object.entries(aggregations)) {
      const values = metrics
        .map((m) => (m as Record<string, unknown>)[field])
        .filter((v) => v !== undefined);

      switch (aggType) {
        case 'sum':
          results[field] = values.reduce(
            (sum, v) => sum + (typeof v === 'number' ? v : 0),
            0,
          );
          break;
        case 'avg':
          results[field] =
            values.length > 0
              ? values.reduce(
                  (sum, v) => sum + (typeof v === 'number' ? v : 0),
                  0,
                ) / values.length
              : 0;
          break;
        case 'count':
          results[field] = values.length;
          break;
        case 'min':
          results[field] =
            values.length > 0
              ? Math.min(...values.filter((v) => typeof v === 'number'))
              : 0;
          break;
        case 'max':
          results[field] =
            values.length > 0
              ? Math.max(...values.filter((v) => typeof v === 'number'))
              : 0;
          break;
        default:
          results[field] = values;
      }
    }

    return results;
  }
}

/**
 * Create a new AnalyticsEngine instance
 */
export function createAnalyticsEngine(
  projectRoot: string,
  budgetTracker: BudgetTracker,
  config?: Partial<AnalyticsConfig>,
): AnalyticsEngine {
  return new AnalyticsEngine(projectRoot, budgetTracker, config);
}
