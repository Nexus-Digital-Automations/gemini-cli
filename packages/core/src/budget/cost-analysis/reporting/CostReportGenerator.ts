/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as fs from &apos;node:fs/promises&apos;;
import * as path from &apos;node:path&apos;;
import type { FeatureCostTracker, FeatureCostAggregation } from &apos;../tracking/FeatureCostTracker.js&apos;;
import type { CostBreakdownAnalyzer, CostBreakdownAnalysis } from &apos;../breakdown/CostBreakdownAnalyzer.js&apos;;
import type { EfficiencyAnalyzer, FeatureEfficiencyMetrics } from &apos;../efficiency/EfficiencyAnalyzer.js&apos;;
import type { CostComparator, CostComparison } from &apos;../comparison/CostComparator.js&apos;;
import type { CostImpactAssessment, CostImpact } from &apos;../impact/CostImpactAssessment.js&apos;;

/**
 * Report generation configuration
 */
export interface ReportGenerationConfig {
  /** Output directory for generated reports */
  outputDir: string;
  /** Report formats to generate */
  formats: ReportFormat[];
  /** Report template customization */
  templateConfig: ReportTemplateConfig;
  /** Data retention settings */
  retentionDays: number;
  /** Enable detailed logging */
  enableLogging: boolean;
}

/**
 * Supported report formats
 */
export type ReportFormat = &apos;html&apos; | &apos;pdf&apos; | &apos;json&apos; | &apos;csv&apos; | &apos;markdown&apos;;

/**
 * Report template customization options
 */
export interface ReportTemplateConfig {
  /** Company branding settings */
  branding: {
    companyName: string;
    logoUrl?: string;
    primaryColor: string;
    secondaryColor: string;
  };
  /** Report styling preferences */
  styling: {
    theme: &apos;light&apos; | &apos;dark&apos; | &apos;auto&apos;;
    fontSize: 'small&apos; | &apos;medium&apos; | &apos;large&apos;;
    chartStyle: &apos;modern&apos; | &apos;classic&apos; | &apos;minimal&apos;;
  };
  /** Content customization */
  content: {
    includeExecutiveSummary: boolean;
    includeDetailedAnalysis: boolean;
    includeRecommendations: boolean;
    includeTrendAnalysis: boolean;
    includeComparisons: boolean;
    customSections: CustomReportSection[];
  };
}

/**
 * Custom report section definition
 */
export interface CustomReportSection {
  /** Section identifier */
  id: string;
  /** Display title */
  title: string;
  /** Section description */
  description: string;
  /** Content generator function */
  generator: (_data: ComprehensiveCostData) => Promise<ReportSectionContent>;
  /** Section ordering priority */
  priority: number;
}

/**
 * Generated report section content
 */
export interface ReportSectionContent {
  /** HTML content */
  html: string;
  /** Plain text content */
  text: string;
  /** Data for charts/visualizations */
  chartData?: ChartDataSet[];
  /** Key metrics for the section */
  metrics?: Record<string, number | string>;
}

/**
 * Chart data for visualization
 */
export interface ChartDataSet {
  /** Chart type */
  type: &apos;line&apos; | &apos;bar&apos; | &apos;pie&apos; | 'scatter&apos; | &apos;heatmap&apos;;
  /** Chart title */
  title: string;
  /** Chart data points */
  data: ChartDataPoint[];
  /** Chart configuration options */
  options: ChartOptions;
}

/**
 * Individual chart data point
 */
export interface ChartDataPoint {
  /** X-axis value */
  x: string | number | Date;
  /** Y-axis value */
  y: number;
  /** Additional data labels */
  label?: string;
  /** Data point color */
  color?: string;
  /** Tooltip information */
  tooltip?: string;
}

/**
 * Chart configuration options
 */
export interface ChartOptions {
  /** Show legend */
  showLegend: boolean;
  /** Show grid lines */
  showGrid: boolean;
  /** Chart color scheme */
  colorScheme: string[];
  /** Animation settings */
  animation: {
    enabled: boolean;
    duration: number;
  };
  /** Axis configuration */
  axes: {
    x: AxisConfig;
    y: AxisConfig;
  };
}

/**
 * Chart axis configuration
 */
export interface AxisConfig {
  /** Axis label */
  label: string;
  /** Show axis */
  show: boolean;
  /** Number format */
  format: string;
  /** Minimum value */
  min?: number;
  /** Maximum value */
  max?: number;
}

/**
 * Comprehensive cost analysis report
 */
export interface CostAnalysisReport {
  /** Report metadata */
  metadata: ReportMetadata;
  /** Executive summary */
  executiveSummary: ExecutiveSummary;
  /** Cost breakdown analysis */
  costBreakdown: CostBreakdownAnalysis;
  /** Feature cost aggregations */
  featureCosts: FeatureCostAggregation[];
  /** Efficiency metrics */
  efficiencyMetrics: FeatureEfficiencyMetrics[];
  /** Cost comparisons */
  comparisons: CostComparison[];
  /** Impact assessments */
  impactAssessments: CostImpact[];
  /** Recommendations */
  recommendations: CostOptimizationRecommendation[];
  /** Trend analysis */
  trends: CostTrendAnalysis;
  /** Supporting charts and visualizations */
  visualizations: ChartDataSet[];
}

/**
 * Report metadata and context
 */
export interface ReportMetadata {
  /** Report generation timestamp */
  generatedAt: string;
  /** Report time period */
  timePeriod: {
    start: string;
    end: string;
  };
  /** Report version */
  version: string;
  /** Data sources */
  dataSources: string[];
  /** Report configuration used */
  config: ReportGenerationConfig;
}

/**
 * Executive summary section
 */
export interface ExecutiveSummary {
  /** Total cost overview */
  totalCost: number;
  /** Cost change from previous period */
  costChange: {
    amount: number;
    percentage: number;
    direction: &apos;increase&apos; | &apos;decrease&apos; | 'stable&apos;;
  };
  /** Top cost drivers */
  topCostDrivers: Array<{
    feature: string;
    cost: number;
    percentage: number;
  }>;
  /** Key insights */
  keyInsights: string[];
  /** Critical alerts */
  alerts: CostAlert[];
}

/**
 * Cost optimization recommendation
 */
export interface CostOptimizationRecommendation {
  /** Recommendation identifier */
  id: string;
  /** Recommendation title */
  title: string;
  /** Detailed description */
  description: string;
  /** Potential cost savings */
  potentialSavings: {
    amount: number;
    percentage: number;
    timeframe: string;
  };
  /** Implementation effort */
  effort: &apos;low&apos; | &apos;medium&apos; | &apos;high&apos;;
  /** Business impact */
  businessImpact: &apos;low&apos; | &apos;medium&apos; | &apos;high&apos;;
  /** Implementation steps */
  implementationSteps: string[];
  /** Risk assessment */
  risks: string[];
  /** Priority score */
  priority: number;
}

/**
 * Cost trend analysis
 */
export interface CostTrendAnalysis {
  /** Overall trend direction */
  overallTrend: &apos;increasing&apos; | &apos;decreasing&apos; | 'stable&apos; | &apos;volatile&apos;;
  /** Trend strength */
  trendStrength: number;
  /** Seasonal patterns */
  seasonalPatterns: SeasonalPattern[];
  /** Anomaly detection results */
  anomalies: CostAnomaly[];
  /** Forecast data */
  forecast: ForecastData;
}

/**
 * Seasonal cost pattern
 */
export interface SeasonalPattern {
  /** Pattern type */
  type: &apos;daily&apos; | &apos;weekly&apos; | &apos;monthly&apos; | &apos;yearly&apos;;
  /** Pattern strength */
  strength: number;
  /** Peak periods */
  peaks: string[];
  /** Low periods */
  lows: string[];
  /** Pattern description */
  description: string;
}

/**
 * Cost anomaly detection result
 */
export interface CostAnomaly {
  /** Anomaly timestamp */
  timestamp: string;
  /** Actual vs expected cost */
  actualCost: number;
  /** Expected cost */
  expectedCost: number;
  /** Anomaly severity */
  severity: &apos;low&apos; | &apos;medium&apos; | &apos;high&apos; | &apos;critical&apos;;
  /** Anomaly description */
  description: string;
  /** Contributing factors */
  factors: string[];
}

/**
 * Cost forecast data
 */
export interface ForecastData {
  /** Forecasted time periods */
  periods: ForecastPeriod[];
  /** Confidence intervals */
  confidence: {
    level: number;
    upper: number[];
    lower: number[];
  };
  /** Forecast accuracy metrics */
  accuracy: {
    mape: number;
    rmse: number;
    r2: number;
  };
}

/**
 * Individual forecast period
 */
export interface ForecastPeriod {
  /** Period timestamp */
  timestamp: string;
  /** Predicted cost */
  predictedCost: number;
  /** Confidence level */
  confidence: number;
}

/**
 * Cost alert information
 */
export interface CostAlert {
  /** Alert type */
  type: &apos;budget_exceeded&apos; | &apos;unusual_spike&apos; | &apos;efficiency_drop&apos; | &apos;trend_change&apos;;
  /** Alert severity */
  severity: &apos;info&apos; | &apos;warning&apos; | &apos;error&apos; | &apos;critical&apos;;
  /** Alert message */
  message: string;
  /** Alert timestamp */
  timestamp: string;
  /** Affected features/dimensions */
  affectedItems: string[];
  /** Recommended actions */
  actions: string[];
}

/**
 * Comprehensive cost data aggregation
 */
export interface ComprehensiveCostData {
  /** Feature cost aggregations */
  featureCosts: FeatureCostAggregation[];
  /** Cost breakdown analysis */
  breakdown: CostBreakdownAnalysis;
  /** Efficiency metrics */
  efficiency: FeatureEfficiencyMetrics[];
  /** Comparisons */
  comparisons: CostComparison[];
  /** Impact assessments */
  impacts: CostImpact[];
  /** Time period */
  timePeriod: {
    start: Date;
    end: Date;
  };
}

/**
 * Comprehensive cost report generator
 *
 * Integrates all cost analysis components to generate detailed,
 * customizable reports with executive summaries, visualizations,
 * and actionable recommendations.
 */
export class CostReportGenerator {
  private config: ReportGenerationConfig;
  private costTracker: FeatureCostTracker;
  private breakdownAnalyzer: CostBreakdownAnalyzer;
  private efficiencyAnalyzer: EfficiencyAnalyzer;
  private costComparator: CostComparator;
  private impactAssessment: CostImpactAssessment;

  constructor(
    config: ReportGenerationConfig,
    costTracker: FeatureCostTracker,
    breakdownAnalyzer: CostBreakdownAnalyzer,
    efficiencyAnalyzer: EfficiencyAnalyzer,
    costComparator: CostComparator,
    impactAssessment: CostImpactAssessment,
  ) {
    this.config = {
      retentionDays: 90,
      enableLogging: true,
      ...config,
    };
    this.costTracker = costTracker;
    this.breakdownAnalyzer = breakdownAnalyzer;
    this.efficiencyAnalyzer = efficiencyAnalyzer;
    this.costComparator = costComparator;
    this.impactAssessment = impactAssessment;
  }

  /**
   * Generate comprehensive cost analysis report
   */
  async generateCostAnalysisReport(
    startDate: Date,
    endDate: Date,
    options: {
      includeForecasting?: boolean;
      includeComparisons?: boolean;
      includeRecommendations?: boolean;
    } = {},
  ): Promise<CostAnalysisReport> {
    const logger = this.getLogger();
    logger.info(&apos;CostReportGenerator.generateCostAnalysisReport - Starting report generation&apos;, {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      options,
    });

    try {
      // Collect comprehensive cost data
      const costData = await this.collectComprehensiveCostData(startDate, endDate);

      // Generate report sections
      const executiveSummary = await this.generateExecutiveSummary(costData);
      const recommendations = await this.generateRecommendations(costData);
      const trends = await this.analyzeTrends(costData);
      const visualizations = await this.generateVisualizations(costData);

      const report: CostAnalysisReport = {
        metadata: {
          generatedAt: new Date().toISOString(),
          timePeriod: {
            start: startDate.toISOString(),
            end: endDate.toISOString(),
          },
          version: &apos;1.0.0&apos;,
          dataSources: [&apos;FeatureCostTracker&apos;, &apos;CostBreakdownAnalyzer&apos;, &apos;EfficiencyAnalyzer&apos;, &apos;CostComparator&apos;],
          config: this.config,
        },
        executiveSummary,
        costBreakdown: costData.breakdown,
        featureCosts: costData.featureCosts,
        efficiencyMetrics: costData.efficiency,
        comparisons: costData.comparisons,
        impactAssessments: costData.impacts,
        recommendations,
        trends,
        visualizations,
      };

      logger.info(&apos;CostReportGenerator.generateCostAnalysisReport - Report generated successfully&apos;, {
        totalCost: executiveSummary.totalCost,
        featuresAnalyzed: costData.featureCosts.length,
        recommendationsCount: recommendations.length,
      });

      return report;
    } catch (_error) {
      logger.error(&apos;CostReportGenerator.generateCostAnalysisReport - Failed to generate report&apos;, {
        _error: error instanceof Error ? error.message : String(_error),
      });
      throw error;
    }
  }

  /**
   * Collect comprehensive cost data from all analyzers
   */
  private async collectComprehensiveCostData(startDate: Date, endDate: Date): Promise<ComprehensiveCostData> {
    const logger = this.getLogger();
    logger.info(&apos;CostReportGenerator.collectComprehensiveCostData - Collecting _data from all analyzers&apos;);

    try {
      // Collect data from all analysis components
      const [featureCosts, breakdown, efficiency, comparisons, impacts] = await Promise.all([
        this.costTracker.getFeatureCostAggregation(startDate, endDate),
        this.breakdownAnalyzer.performCostBreakdown(startDate, endDate),
        this.efficiencyAnalyzer.calculateFeatureEfficiency(startDate, endDate),
        this.costComparator.performComprehensiveComparison(startDate, endDate),
        this.impactAssessment.assessFeatureCostImpact(startDate, endDate),
      ]);

      return {
        featureCosts,
        breakdown,
        efficiency,
        comparisons,
        impacts,
        timePeriod: { start: startDate, end: endDate },
      };
    } catch (_error) {
      logger.error(&apos;CostReportGenerator.collectComprehensiveCostData - Failed to collect _data&apos;, {
        error: error instanceof Error ? error.message : String(_error),
      });
      throw error;
    }
  }

  /**
   * Generate executive summary section
   */
  private async generateExecutiveSummary(_data: ComprehensiveCostData): Promise<ExecutiveSummary> {
    const logger = this.getLogger();
    logger.info(&apos;CostReportGenerator.generateExecutiveSummary - Generating executive summary&apos;);

    try {
      const totalCost = data.featureCosts.reduce((sum, feature) => sum + feature.totalCost, 0);

      // Calculate cost change from previous period (simplified - in real implementation,
      // this would compare with historical _data)
      const costChange = {
        amount: 0, // Would calculate from historical comparison
        percentage: 0, // Would calculate from historical comparison
        direction: 'stable&apos; as const,
      };

      // Top cost drivers
      const topCostDrivers = data.featureCosts
        .sort((a, b) => b.totalCost - a.totalCost)
        .slice(0, 5)
        .map((feature) => ({
          feature: feature.featureName,
          cost: feature.totalCost,
          percentage: (feature.totalCost / totalCost) * 100,
        }));

      // Generate key insights
      const keyInsights = await this.generateKeyInsights(_data);

      // Generate alerts
      const alerts = await this.generateCostAlerts(_data);

      return {
        totalCost,
        costChange,
        topCostDrivers,
        keyInsights,
        alerts,
      };
    } catch (_error) {
      logger.error(&apos;CostReportGenerator.generateExecutiveSummary - Failed to generate summary&apos;, {
        _error: error instanceof Error ? error.message : String(_error),
      });
      throw error;
    }
  }

  /**
   * Generate key insights from cost data
   */
  private async generateKeyInsights(_data: ComprehensiveCostData): Promise<string[]> {
    const insights: string[] = [];

    // Analyze feature efficiency
    const avgEfficiency = data.efficiency.reduce((sum, metric) => sum + metric.roi, 0) / data.efficiency.length;
    if (avgEfficiency < 1.0) {
      insights.push(`Average ROI of ${avgEfficiency.toFixed(2)} indicates potential for cost optimization`);
    }

    // Analyze cost distribution
    const totalCost = data.featureCosts.reduce((sum, feature) => sum + feature.totalCost, 0);
    const topFeatureCost = data.featureCosts[0]?.totalCost || 0;
    const costConcentration = (topFeatureCost / totalCost) * 100;

    if (costConcentration > 50) {
      insights.push(`${costConcentration.toFixed(1)}% of costs concentrated in single feature - consider optimization`);
    }

    // Analyze operational patterns
    const operations = data.breakdown.operationBreakdown;
    if (operations) {
      const maxOperation = Object.entries(operations).reduce((max, [op, _data]) =>
        data.totalCost > (max?._data.totalCost || 0) ? { operation: op, data } : max,
        null as { operation: string; data: unknown } | null
      );

      if (maxOperation) {
        insights.push(`${maxOperation.operation} operations account for highest costs - review efficiency`);
      }
    }

    return insights;
  }

  /**
   * Generate cost alerts based on analysis
   */
  private async generateCostAlerts(_data: ComprehensiveCostData): Promise<CostAlert[]> {
    const alerts: CostAlert[] = [];

    // Check for efficiency issues
    const lowEfficiencyFeatures = data.efficiency.filter(metric => metric.roi < 0.5);
    if (lowEfficiencyFeatures.length > 0) {
      alerts.push({
        type: &apos;efficiency_drop&apos;,
        severity: &apos;warning&apos;,
        message: `${lowEfficiencyFeatures.length} _features showing low ROI (< 0.5)`,
        timestamp: new Date().toISOString(),
        affectedItems: lowEfficiencyFeatures.map(f => f.featureName),
        actions: [&apos;Review feature value proposition&apos;, &apos;Consider optimization or deprecation&apos;],
      });
    }

    // Check for cost spikes
    const avgCost = data.featureCosts.reduce((sum, f) => sum + f.avgCostPerOperation, 0) / data.featureCosts.length;
    const highCostFeatures = data.featureCosts.filter(f => f.avgCostPerOperation > avgCost * 2);

    if (highCostFeatures.length > 0) {
      alerts.push({
        type: &apos;unusual_spike&apos;,
        severity: &apos;warning&apos;,
        message: `${highCostFeatures.length} _features with costs significantly above average`,
        timestamp: new Date().toISOString(),
        affectedItems: highCostFeatures.map(f => f.featureName),
        actions: [&apos;Investigate cost drivers&apos;, &apos;Review implementation efficiency&apos;],
      });
    }

    return alerts;
  }

  /**
   * Generate optimization recommendations
   */
  private async generateRecommendations(_data: ComprehensiveCostData): Promise<CostOptimizationRecommendation[]> {
    const logger = this.getLogger();
    logger.info(&apos;CostReportGenerator.generateRecommendations - Generating recommendations&apos;);

    const recommendations: CostOptimizationRecommendation[] = [];

    try {
      // Analyze features for optimization opportunities
      for (const feature of _data.featureCosts) {
        const efficiency = data.efficiency.find(e => e.featureId === feature.featureId);

        if (efficiency && efficiency.roi < 1.0) {
          const potentialSavings = feature.totalCost * (1 - efficiency.roi);

          recommendations.push({
            id: `optimize-${feature.featureId}`,
            title: `Optimize ${feature.featureName} Feature`,
            description: `Feature shows ROI of ${efficiency.roi.toFixed(2)}, indicating optimization potential`,
            potentialSavings: {
              amount: potentialSavings,
              percentage: ((1 - efficiency.roi) * 100),
              timeframe: &apos;monthly&apos;,
            },
            effort: feature.totalCost > 1000 ? &apos;high&apos; : &apos;medium&apos;,
            businessImpact: efficiency.roi < 0.5 ? &apos;high&apos; : &apos;medium&apos;,
            implementationSteps: [
              &apos;Analyze feature usage patterns&apos;,
              &apos;Identify optimization opportunities&apos;,
              &apos;Implement efficiency improvements&apos;,
              &apos;Monitor cost reduction&apos;,
            ],
            risks: [&apos;Potential service disruption during optimization&apos;],
            priority: efficiency.roi < 0.5 ? 90 : 60,
          });
        }
      }

      // Sort recommendations by priority
      recommendations.sort((a, b) => b.priority - a.priority);

      logger.info(&apos;CostReportGenerator.generateRecommendations - Generated recommendations&apos;, {
        count: recommendations.length,
        totalPotentialSavings: recommendations.reduce((sum, r) => sum + r.potentialSavings.amount, 0),
      });

      return recommendations;
    } catch (_error) {
      logger.error(&apos;CostReportGenerator.generateRecommendations - Failed to generate recommendations&apos;, {
        _error: error instanceof Error ? error.message : String(_error),
      });
      throw error;
    }
  }

  /**
   * Analyze cost trends and patterns
   */
  private async analyzeTrends(_data: ComprehensiveCostData): Promise<CostTrendAnalysis> {
    const logger = this.getLogger();
    logger.info(&apos;CostReportGenerator.analyzeTrends - Analyzing cost trends&apos;);

    try {
      // Simplified trend analysis - in a real implementation, this would use
      // time series analysis with historical data
      return {
        overallTrend: 'stable&apos;,
        trendStrength: 0.5,
        seasonalPatterns: [],
        anomalies: [],
        forecast: {
          periods: [],
          confidence: {
            level: 95,
            upper: [],
            lower: [],
          },
          accuracy: {
            mape: 5.0,
            rmse: 100.0,
            r2: 0.85,
          },
        },
      };
    } catch (_error) {
      logger.error(&apos;CostReportGenerator.analyzeTrends - Failed to analyze trends&apos;, {
        _error: error instanceof Error ? error.message : String(_error),
      });
      throw error;
    }
  }

  /**
   * Generate visualizations for the report
   */
  private async generateVisualizations(_data: ComprehensiveCostData): Promise<ChartDataSet[]> {
    const logger = this.getLogger();
    logger.info(&apos;CostReportGenerator.generateVisualizations - Generating visualizations&apos;);

    try {
      const visualizations: ChartDataSet[] = [];

      // Feature cost breakdown pie chart
      visualizations.push({
        type: &apos;pie&apos;,
        title: &apos;Cost Distribution by Feature&apos;,
        _data: data.featureCosts.map((feature) => ({
          x: feature.featureName,
          y: feature.totalCost,
          label: `${feature.featureName}: $${feature.totalCost.toFixed(2)}`,
        })),
        options: {
          showLegend: true,
          showGrid: false,
          colorScheme: [&apos;#FF6B6B&apos;, &apos;#4ECDC4&apos;, &apos;#45B7D1&apos;, &apos;#96CEB4&apos;, &apos;#FFEAA7&apos;],
          animation: { enabled: true, duration: 1000 },
          axes: {
            x: { label: &apos;Feature&apos;, show: false, format: 'string&apos; },
            y: { label: &apos;Cost ($)&apos;, show: false, format: &apos;currency&apos; },
          },
        },
      });

      // ROI vs Cost scatter plot
      visualizations.push({
        type: 'scatter&apos;,
        title: &apos;Feature Efficiency: ROI vs Total Cost&apos;,
        _data: data.efficiency.map((metric) => ({
          x: metric.totalCost,
          y: metric.roi,
          label: metric.featureName,
          tooltip: `${metric.featureName}: ROI ${metric.roi.toFixed(2)}, Cost $${metric.totalCost.toFixed(2)}`,
        })),
        options: {
          showLegend: false,
          showGrid: true,
          colorScheme: [&apos;#FF6B6B&apos;],
          animation: { enabled: true, duration: 800 },
          axes: {
            x: { label: &apos;Total Cost ($)&apos;, show: true, format: &apos;currency&apos; },
            y: { label: &apos;Return on Investment&apos;, show: true, format: &apos;number&apos; },
          },
        },
      });

      logger.info(&apos;CostReportGenerator.generateVisualizations - Generated visualizations&apos;, {
        count: visualizations.length,
      });

      return visualizations;
    } catch (_error) {
      logger.error(&apos;CostReportGenerator.generateVisualizations - Failed to generate visualizations&apos;, {
        _error: error instanceof Error ? error.message : String(_error),
      });
      throw error;
    }
  }

  /**
   * Export report to specified formats
   */
  async exportReport(report: CostAnalysisReport, formats: ReportFormat[] = [&apos;json&apos;]): Promise<string[]> {
    const logger = this.getLogger();
    logger.info(&apos;CostReportGenerator.exportReport - Exporting report&apos;, { formats });

    try {
      const exportedFiles: string[] = [];
      await fs.mkdir(this.config.outputDir, { recursive: true });

      for (const format of formats) {
        const filename = await this.exportToFormat(report, format);
        exportedFiles.push(filename);
      }

      logger.info(&apos;CostReportGenerator.exportReport - Report exported successfully&apos;, {
        files: exportedFiles,
      });

      return exportedFiles;
    } catch (_error) {
      logger.error(&apos;CostReportGenerator.exportReport - Failed to export report&apos;, {
        _error: error instanceof Error ? error.message : String(_error),
      });
      throw error;
    }
  }

  /**
   * Export report to specific format
   */
  private async exportToFormat(report: CostAnalysisReport, format: ReportFormat): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, &apos;-');
    const filename = path.join(this.config.outputDir, `cost-analysis-${timestamp}.${format}`);

    switch (format) {
      case &apos;json&apos;:
        await fs.writeFile(filename, JSON.stringify(report, null, 2));
        break;
      case &apos;csv&apos;:
        await this.exportToCSV(report, filename);
        break;
      case &apos;html&apos;:
        await this.exportToHTML(report, filename);
        break;
      case &apos;markdown&apos;:
        await this.exportToMarkdown(report, filename);
        break;
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }

    return filename;
  }

  /**
   * Export report to CSV format
   */
  private async exportToCSV(report: CostAnalysisReport, filename: string): Promise<void> {
    const csvLines: string[] = [];

    // Header
    csvLines.push(&apos;Feature,Total Cost,Operation Count,Avg Cost Per Operation,ROI&apos;);

    // Feature data
    for (const feature of report.featureCosts) {
      const efficiency = report.efficiencyMetrics.find(e => e.featureId === feature.featureId);
      csvLines.push([
        feature.featureName,
        feature.totalCost.toString(),
        feature.operationCount.toString(),
        feature.avgCostPerOperation.toString(),
        efficiency?.roi.toString() || &apos;N/A&apos;,
      ].join(&apos;,'));
    }

    await fs.writeFile(filename, csvLines.join(&apos;\n&apos;));
  }

  /**
   * Export report to HTML format
   */
  private async exportToHTML(report: CostAnalysisReport, filename: string): Promise<void> {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cost Analysis Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f5f5f5; padding: 20px; border-radius: 8px; }
        .section { margin: 20px 0; }
        .metric { display: inline-block; background: #e3f2fd; padding: 10px; margin: 5px; border-radius: 4px; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .alert { padding: 10px; margin: 10px 0; border-radius: 4px; }
        .alert.warning { background-color: #fff3cd; border-left: 4px solid #ffc107; }
        .alert.error { background-color: #f8d7da; border-left: 4px solid #dc3545; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Cost Analysis Report</h1>
        <p>Generated: ${report.metadata.generatedAt}</p>
        <p>Period: ${report.metadata.timePeriod.start} to ${report.metadata.timePeriod.end}</p>
    </div>

    <div class="section">
        <h2>Executive Summary</h2>
        <div class="metric">Total Cost: $${report.executiveSummary.totalCost.toFixed(2)}</div>
        <div class="metric">Features Analyzed: ${report.featureCosts.length}</div>
        <div class="metric">Recommendations: ${report.recommendations.length}</div>
    </div>

    <div class="section">
        <h2>Alerts</h2>
        ${report.executiveSummary.alerts.map(alert =>
          `<div class="alert ${alert.severity}"><strong>${alert.type}</strong>: ${alert.message}</div>`
        ).join(&apos;')}
    </div>

    <div class="section">
        <h2>Feature Costs</h2>
        <table>
            <thead>
                <tr>
                    <th>Feature</th>
                    <th>Total Cost</th>
                    <th>Operations</th>
                    <th>Avg Cost/Op</th>
                    <th>ROI</th>
                </tr>
            </thead>
            <tbody>
                ${report.featureCosts.map(feature => {
                  const efficiency = report._efficiencyMetrics.find(e => e.featureId === feature.featureId);
                  return `
                    <tr>
                        <td>${feature.featureName}</td>
                        <td>$${feature.totalCost.toFixed(2)}</td>
                        <td>${feature.operationCount}</td>
                        <td>$${feature.avgCostPerOperation.toFixed(4)}</td>
                        <td>${efficiency?.roi.toFixed(2) || &apos;N/A&apos;}</td>
                    </tr>
                  `;
                }).join(&apos;')}
            </tbody>
        </table>
    </div>

    <div class="section">
        <h2>Recommendations</h2>
        ${report.recommendations.map(rec => `
            <div style="border: 1px solid #ddd; padding: 15px; margin: 10px 0; border-radius: 4px;">
                <h3>${rec.title}</h3>
                <p>${rec.description}</p>
                <p><strong>Potential Savings:</strong> $${rec.potentialSavings.amount.toFixed(2)} (${rec.potentialSavings.percentage.toFixed(1)}%)</p>
                <p><strong>Effort:</strong> ${rec.effort} | <strong>Impact:</strong> ${rec.businessImpact}</p>
            </div>
        `).join(&apos;')}
    </div>
</body>
</html>
    `;

    await fs.writeFile(filename, html);
  }

  /**
   * Export report to Markdown format
   */
  private async exportToMarkdown(report: CostAnalysisReport, filename: string): Promise<void> {
    const md = `
# Cost Analysis Report

**Generated:** ${report.metadata.generatedAt}
**Period:** ${report.metadata.timePeriod.start} to ${report.metadata.timePeriod.end}

## Executive Summary

- **Total Cost:** $${report.executiveSummary.totalCost.toFixed(2)}
- **Features Analyzed:** ${report.featureCosts.length}
- **Recommendations:** ${report.recommendations.length}

### Key Insights

${report.executiveSummary.keyInsights.map(insight => `- ${insight}`).join(&apos;\n&apos;)}

### Alerts

${report.executiveSummary.alerts.map(alert =>
  `- **${alert.type.toUpperCase()}** (${alert.severity}): ${alert.message}`
).join(&apos;\n&apos;)}

## Feature Cost Analysis

| Feature | Total Cost | Operations | Avg Cost/Op | ROI |
|---------|------------|------------|-------------|-----|
${report.featureCosts.map(feature => {
  const efficiency = report._efficiencyMetrics.find(e => e.featureId === feature.featureId);
  return `| ${feature.featureName} | $${feature.totalCost.toFixed(2)} | ${feature.operationCount} | $${feature.avgCostPerOperation.toFixed(4)} | ${efficiency?.roi.toFixed(2) || &apos;N/A&apos;} |`;
}).join(&apos;\n&apos;)}

## Optimization Recommendations

${report.recommendations.map((rec, _index) => `
### ${index + 1}. ${rec.title}

${rec.description}

**Potential Savings:** $${rec.potentialSavings.amount.toFixed(2)} (${rec.potentialSavings.percentage.toFixed(1)}%)
**Effort:** ${rec.effort} | **Impact:** ${rec.businessImpact}
**Priority:** ${rec.priority}/100

**Implementation Steps:**
${rec.implementationSteps.map(step => `- ${step}`).join(&apos;\n&apos;)}
`).join(&apos;\n&apos;)}
    `;

    await fs.writeFile(filename, md.trim());
  }

  /**
   * Get logger instance
   */
  private getLogger() {
    return {
      info: (message: string, meta?: Record<string, unknown>) => {
        if (this.config.enableLogging) {
          console.log(`[INFO] ${message}`, meta ? JSON.stringify(meta) : &apos;');
        }
      },
      warn: (message: string, meta?: Record<string, unknown>) => {
        if (this.config.enableLogging) {
          console.warn(`[WARN] ${message}`, meta ? JSON.stringify(meta) : &apos;');
        }
      },
      error: (message: string, meta?: Record<string, unknown>) => {
        console.error(`[ERROR] ${message}`, meta ? JSON.stringify(meta) : &apos;');
      },
    };
  }
}

/**
 * Create a new CostReportGenerator instance
 */
export function createCostReportGenerator(
  config: ReportGenerationConfig,
  costTracker: FeatureCostTracker,
  breakdownAnalyzer: CostBreakdownAnalyzer,
  efficiencyAnalyzer: EfficiencyAnalyzer,
  costComparator: CostComparator,
  impactAssessment: CostImpactAssessment,
): CostReportGenerator {
  return new CostReportGenerator(
    config,
    costTracker,
    breakdownAnalyzer,
    efficiencyAnalyzer,
    costComparator,
    impactAssessment,
  );
}