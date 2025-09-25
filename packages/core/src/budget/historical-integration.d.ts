/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { BudgetSettings } from './types.js';
import {
  type TrendAnalysis,
  type BudgetForecast,
  type AnomalyDetection,
} from './historical-analysis.js';
import {
  type ForecastingModelConfig,
  type ScenarioConfig,
  type EnsembleForecast,
} from './forecasting-models.js';
import {
  type ReportConfig,
  type VisualizationArtifact,
} from './historical-visualization.js';
/**
 * Historical analysis service configuration
 */
export interface HistoricalServiceConfig {
  autoRecord: boolean;
  recordingInterval: number;
  dataRetentionDays: number;
  trendAnalysisDays: number;
  anomalyThreshold: number;
  forecastHorizonDays: number;
  forecastingModel: Partial<ForecastingModelConfig>;
  enableEnsembleForecasting: boolean;
  monteCarloIterations: number;
  generateDashboard: boolean;
  dashboardRefreshInterval: number;
  exportReports: boolean;
  reportFormats: ('html' | 'json' | 'csv' | 'pdf')[];
  batchProcessingSize: number;
  enableCaching: boolean;
  cacheExpirationMinutes: number;
}
/**
 * Historical analysis results package
 */
export interface HistoricalAnalysisResults {
  summary: {
    dataRange: {
      start: string;
      end: string;
    };
    recordCount: number;
    lastUpdate: string;
    dataQuality: number;
  };
  trends: TrendAnalysis;
  forecasts: {
    simple: BudgetForecast[];
    ensemble?: EnsembleForecast[];
  };
  anomalies: AnomalyDetection[];
  insights: {
    recommendations: string[];
    keyFindings: string[];
    alerts: Array<{
      type: 'warning' | 'info' | 'critical';
      message: string;
      priority: number;
    }>;
  };
  visualizations?: VisualizationArtifact[];
  performance: {
    analysisTime: number;
    cacheHit: boolean;
    modelAccuracy: number;
  };
}
/**
 * Scheduled analysis job configuration
 */
export interface AnalysisSchedule {
  id: string;
  type:
    | 'trend_analysis'
    | 'forecast_update'
    | 'anomaly_detection'
    | 'report_generation';
  frequency: 'hourly' | 'daily' | 'weekly' | 'monthly';
  enabled: boolean;
  lastRun?: string;
  nextRun?: string;
  config?: Record<string, unknown>;
}
/**
 * Comprehensive historical data analysis integration service
 */
export declare class HistoricalBudgetService {
  private readonly projectRoot;
  private readonly config;
  private readonly budgetTracker;
  private readonly historicalAnalyzer;
  private readonly forecastingEngine;
  private readonly visualizationEngine;
  private readonly cacheDir;
  private readonly schedulesDir;
  private cache;
  constructor(
    projectRoot: string,
    budgetSettings: BudgetSettings,
    config?: Partial<HistoricalServiceConfig>,
  );
  /**
   * Record budget usage and trigger historical analysis if configured
   */
  recordUsage(requestCount?: number): Promise<void>;
  /**
   * Update historical data from current budget tracker
   */
  updateHistoricalData(): Promise<void>;
  /**
   * Perform comprehensive historical analysis
   */
  performAnalysis(options?: {
    includeTrends?: boolean;
    includeForecasts?: boolean;
    includeAnomalies?: boolean;
    includeVisualizations?: boolean;
    useEnsembleForecasting?: boolean;
    scenarios?: ScenarioConfig[];
  }): Promise<HistoricalAnalysisResults>;
  /**
   * Generate comprehensive reports
   */
  generateReports(
    results: HistoricalAnalysisResults,
    customConfig?: Partial<ReportConfig>,
  ): Promise<VisualizationArtifact[]>;
  /**
   * Get real-time historical metrics
   */
  getRealTimeMetrics(): Promise<{
    current: {
      todayUsage: number;
      todayLimit: number;
      todayPercentage: number;
      timeUntilReset: string;
    };
    historical: {
      averageUsage: number;
      peakUsage: number;
      efficiency: number;
      trendDirection: string;
    };
    alerts: Array<{
      type: string;
      message: string;
      timestamp: string;
    }>;
  }>;
  /**
   * Schedule automatic analysis jobs
   */
  scheduleAnalysis(schedule: Omit<AnalysisSchedule, 'id'>): Promise<string>;
  /**
   * Execute scheduled analysis jobs
   */
  executeScheduledJobs(): Promise<{
    executed: number;
    failed: number;
  }>;
  /**
   * Clean up old data and cache
   */
  cleanup(options?: {
    cleanHistoricalData?: boolean;
    cleanCache?: boolean;
    cleanVisualizations?: boolean;
    daysToKeep?: number;
  }): Promise<void>;
  private initializeService;
  private loadHistoricalRecords;
  private generateForecastDates;
  private getCachedData;
  private setCachedData;
  private clearCache;
  private clearAllCache;
  private getRecentAlerts;
  private calculateNextRun;
  private saveSchedule;
  private loadSchedules;
  private executeScheduledJob;
  private cleanupVisualizations;
}
/**
 * Create a new HistoricalBudgetService instance
 */
export declare function createHistoricalBudgetService(
  projectRoot: string,
  budgetSettings: BudgetSettings,
  config?: Partial<HistoricalServiceConfig>,
): HistoricalBudgetService;
