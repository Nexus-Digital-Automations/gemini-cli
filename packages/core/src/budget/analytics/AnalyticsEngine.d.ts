/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
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
export declare class AnalyticsEngine {
  private projectRoot;
  private config;
  private budgetTracker;
  private analyticsDataPath;
  private metricsCache;
  constructor(
    projectRoot: string,
    budgetTracker: BudgetTracker,
    config?: Partial<AnalyticsConfig>,
  );
  /**
   * Record usage metrics with multi-dimensional data
   */
  recordUsage(metrics: Omit<UsageMetrics, 'timestamp'>): Promise<void>;
  /**
   * Generate comprehensive analytics report
   */
  generateReport(
    startDate?: string,
    endDate?: string,
  ): Promise<AnalyticsReport>;
  /**
   * Analyze costs by feature with ROI calculations
   */
  analyzeFeatureCosts(metrics: UsageMetrics[]): Promise<FeatureCostAnalysis[]>;
  /**
   * Advanced pattern recognition system
   */
  recognizePatterns(metrics: UsageMetrics[]): Promise<PatternAnalysis[]>;
  /**
   * Anomaly detection system
   */
  detectAnomalies(metrics: UsageMetrics[]): Promise<AnomalyDetection[]>;
  /**
   * Generate intelligent optimization recommendations
   */
  private generateOptimizationRecommendations;
  private saveMetrics;
  private getMetricsInRange;
  private calculateSummary;
  private groupMetricsByDimension;
  private getAverageCostPerRequest;
  private getDateDaysAgo;
  private calculateDaysInPeriod;
  private analyzeCostTrend;
  private calculatePotentialSavings;
  private prioritizeRecommendations;
  private deduplicateAndRankRecommendations;
  private calculateBusinessValue;
  private calculateUtilizationRate;
  private calculateUsageFrequency;
  private identifyPeakUsageHours;
  private generateFeatureRecommendations;
  private generateSystemWideRecommendations;
  private groupMetricsByTimeWindow;
  private detectSpikes;
  private detectPeriodicPatterns;
  private detectBusinessHoursPattern;
  private detectWeekendPattern;
  private getRecentMetrics;
  private detectCostAnomalies;
  private detectVolumeAnomalies;
  private detectEfficiencyAnomalies;
  private checkForAnomalies;
}
/**
 * Create a new AnalyticsEngine instance
 */
export declare function createAnalyticsEngine(
  projectRoot: string,
  budgetTracker: BudgetTracker,
  config?: Partial<AnalyticsConfig>,
): AnalyticsEngine;
