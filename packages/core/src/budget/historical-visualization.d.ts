/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type {
  HistoricalBudgetRecord,
  TrendAnalysis,
  AnomalyDetection,
  BudgetForecast,
} from './historical-analysis.js';
/**
 * Chart configuration options for historical data visualization
 */
export interface ChartConfig {
  type: 'line' | 'bar' | 'heatmap' | 'scatter' | 'area';
  width: number;
  height: number;
  title: string;
  xLabel: string;
  yLabel: string;
  showGrid: boolean;
  showLegend: boolean;
  colors: string[];
  timeRange?: {
    start: string;
    end: string;
  };
  aggregation?: 'daily' | 'weekly' | 'monthly';
}
/**
 * Data series for visualization
 */
export interface ChartSeries {
  name: string;
  data: Array<{
    x: string | number;
    y: number;
    metadata?: Record<string, unknown>;
  }>;
  color?: string;
  type?: 'line' | 'bar' | 'area';
}
/**
 * Dashboard widget configuration
 */
export interface DashboardWidget {
  id: string;
  type: 'metric' | 'chart' | 'alert' | 'forecast' | 'insights';
  title: string;
  description?: string;
  position: {
    row: number;
    col: number;
    width: number;
    height: number;
  };
  config: Record<string, unknown>;
  refreshInterval?: number;
}
/**
 * Historical data report configuration
 */
export interface ReportConfig {
  title: string;
  description: string;
  period: {
    start: string;
    end: string;
  };
  sections: Array<{
    type: 'summary' | 'trends' | 'forecasts' | 'anomalies' | 'recommendations';
    title: string;
    config?: Record<string, unknown>;
  }>;
  format: 'html' | 'pdf' | 'json' | 'csv';
  includeCharts: boolean;
  includeRawData: boolean;
}
/**
 * Generated visualization artifact
 */
export interface VisualizationArtifact {
  id: string;
  type: 'chart' | 'dashboard' | 'report';
  title: string;
  description: string;
  format: string;
  filePath?: string;
  data: string | Buffer;
  metadata: {
    generatedAt: string;
    dataRange: {
      start: string;
      end: string;
    };
    recordCount: number;
    charts?: string[];
    insights?: string[];
  };
}
/**
 * Advanced historical data visualization and reporting system
 */
export declare class HistoricalVisualizationEngine {
  private readonly projectRoot;
  private readonly outputDir;
  constructor(projectRoot: string);
  /**
   * Generate comprehensive budget usage charts
   */
  generateUsageCharts(
    records: HistoricalBudgetRecord[],
    config?: Partial<ChartConfig>,
  ): Promise<VisualizationArtifact[]>;
  /**
   * Generate trend analysis visualizations
   */
  generateTrendAnalysisCharts(
    records: HistoricalBudgetRecord[],
    analysis: TrendAnalysis,
    config?: Partial<ChartConfig>,
  ): Promise<VisualizationArtifact[]>;
  /**
   * Generate forecast visualization
   */
  generateForecastCharts(
    records: HistoricalBudgetRecord[],
    forecasts: BudgetForecast[],
    config?: Partial<ChartConfig>,
  ): Promise<VisualizationArtifact[]>;
  /**
   * Generate anomaly detection visualization
   */
  generateAnomalyCharts(
    records: HistoricalBudgetRecord[],
    anomalies: AnomalyDetection[],
    config?: Partial<ChartConfig>,
  ): Promise<VisualizationArtifact[]>;
  /**
   * Create comprehensive dashboard
   */
  createDashboard(
    records: HistoricalBudgetRecord[],
    analysis: TrendAnalysis,
    forecasts: BudgetForecast[],
    anomalies: AnomalyDetection[],
    widgets?: DashboardWidget[],
  ): Promise<VisualizationArtifact>;
  /**
   * Generate comprehensive historical report
   */
  generateHistoricalReport(
    records: HistoricalBudgetRecord[],
    analysis: TrendAnalysis,
    forecasts: BudgetForecast[],
    anomalies: AnomalyDetection[],
    config: ReportConfig,
  ): Promise<VisualizationArtifact>;
  private createDailyUsageChart;
  private createWeeklyPatternChart;
  private createUsageHeatmap;
  private createEfficiencyChart;
  private createTrendDecompositionChart;
  private createSeasonalPatternChart;
  private createVolatilityChart;
  private createForecastTimelineChart;
  private createConfidenceIntervalChart;
  private createScenarioComparisonChart;
  private createAnomalyTimelineChart;
  private createAnomalySeverityChart;
  private createAnomalyScoreChart;
  private createPlaceholderChart;
  private generateSvgChart;
  private generateHeatmapSvg;
  private generateDashboardHtml;
  private generateHtmlReport;
  private generateJsonReport;
  private generateCsvReport;
  private calculateSummaryStats;
  private generateKeyInsights;
  private saveToDisk;
}
/**
 * Create a new HistoricalVisualizationEngine instance
 */
export declare function createHistoricalVisualizationEngine(
  projectRoot: string,
): HistoricalVisualizationEngine;
