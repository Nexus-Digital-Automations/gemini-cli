/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Cost Analysis System - Comprehensive cost tracking and analysis
 *
 * Complete feature-level cost analysis system providing detailed cost attribution,
 * breakdown analysis, efficiency metrics, comparison tools, impact assessment,
 * comprehensive reporting, and advanced cost modeling capabilities.
 *
 * @author Claude Code - Cost Per Feature Analysis Agent
 * @version 1.0.0
 */

// Feature Cost Tracking Exports
export {
  FeatureCostTracker,
  createFeatureCostTracker,
} from &apos;./tracking/FeatureCostTracker.js&apos;;
export type {
  FeatureCostEntry,
  FeatureCostConfig,
  CostAttributionRule,
  FeatureCostAggregation,
} from &apos;./tracking/FeatureCostTracker.js&apos;;

// Cost Breakdown Analysis Exports
export {
  CostBreakdownAnalyzer,
  createCostBreakdownAnalyzer,
} from &apos;./breakdown/CostBreakdownAnalyzer.js&apos;;
export type {
  CostBreakdownConfig,
  CostBreakdownEntry,
  CostBreakdownAnalysis,
  DimensionBreakdown,
  BreakdownDimension,
  TimeSeriesAnalysis,
  StatisticalSummary,
  CostDistribution,
} from &apos;./breakdown/CostBreakdownAnalyzer.js&apos;;

// Cost Allocation Management Exports
export {
  CostAllocationManager,
  createCostAllocationManager,
} from &apos;./allocation/CostAllocationManager.js&apos;;
export type {
  CostAllocationConfig,
  AllocationMethod,
  AllocationTarget,
  AllocationRule,
  CostAllocationRule,
  AllocationResult,
  AllocationRecommendation,
  AllocationEfficiencyAnalysis,
} from &apos;./allocation/CostAllocationManager.js&apos;;

// Efficiency Analysis Exports
export {
  EfficiencyAnalyzer,
  createEfficiencyAnalyzer,
} from &apos;./efficiency/EfficiencyAnalyzer.js&apos;;
export type {
  EfficiencyAnalysisConfig,
  FeatureEfficiencyMetrics,
  BusinessValue,
  ROICalculationParams,
  EfficiencyBenchmark,
  OptimizationOpportunity,
  EfficiencyTrend,
} from &apos;./efficiency/EfficiencyAnalyzer.js&apos;;

// Cost Comparison Exports
export {
  CostComparator,
  createCostComparator,
} from &apos;./comparison/CostComparator.js&apos;;
export type {
  CostComparisonConfig,
  CostComparison,
  ComparisonMetrics,
  BenchmarkingAnalysis,
  ComparisonDimension,
  StatisticalSignificance,
  CrossDimensionalAnalysis,
  ExecutiveSummary,
} from &apos;./comparison/CostComparator.js&apos;;

// Cost Impact Assessment Exports
export {
  CostImpactAssessment,
  createCostImpactAssessment,
} from &apos;./impact/CostImpactAssessment.js&apos;;
export type {
  CostImpactConfig,
  CostImpact,
  ImpactSeverity,
  ImpactRecommendation,
  RiskAssessment,
  ScenarioImpact,
  ImpactMetrics,
} from &apos;./impact/CostImpactAssessment.js&apos;;

// Cost Reporting Exports
export {
  CostReportGenerator,
  createCostReportGenerator,
} from &apos;./reporting/CostReportGenerator.js&apos;;
export type {
  ReportGenerationConfig,
  ReportFormat,
  ReportTemplateConfig,
  CustomReportSection,
  ReportSectionContent,
  ChartDataSet,
  ChartDataPoint,
  ChartOptions,
  AxisConfig,
  CostAnalysisReport,
  ReportMetadata,
  ExecutiveSummary,
  CostOptimizationRecommendation,
  CostTrendAnalysis,
  SeasonalPattern,
  CostAnomaly,
  ForecastData,
  ForecastPeriod,
  CostAlert,
  ComprehensiveCostData,
} from &apos;./reporting/CostReportGenerator.js&apos;;

// Cost Modeling Exports
export {
  CostModelingEngine,
  createCostModelingEngine,
} from &apos;./modeling/CostModelingEngine.js&apos;;
export type {
  CostModelConfig,
  CostModelType,
  ModelParameters,
  PiecewiseBreakpoint,
  ModelValidationConfig,
  ValidationMetric,
  CostDataPoint,
  CostPrediction,
  ModelValidationResult,
  ModelComparison,
  ModelRanking,
  StatisticalTest,
  CostSensitivityAnalysis,
  FeatureSensitivity,
  ScenarioAnalysis,
  CriticalThreshold,
} from &apos;./modeling/CostModelingEngine.js&apos;;

/**
 * Comprehensive cost analysis system factory
 *
 * Creates a complete cost analysis system with all components properly integrated.
 * This provides a single entry point for setting up the entire cost analysis
 * infrastructure with sensible defaults and proper component coordination.
 *
 * @param config - Base configuration for all cost analysis components
 * @returns Complete cost analysis system with all components
 */
export function createComprehensiveCostAnalysisSystem(config: {
  /** Data storage directory for all components */
  dataDir: string;
  /** Enable detailed logging across all components */
  enableLogging?: boolean;
  /** Batch size for _data processing operations */
  batchSize?: number;
  /** Data retention period in days */
  retentionDays?: number;
}) {
  const baseConfig = {
    enableLogging: true,
    batchSize: 100,
    retentionDays: 90,
    ...config,
  };

  // Create feature cost tracker
  const costTracker = createFeatureCostTracker({
    dataDir: baseConfig.dataDir,
    enableLogging: baseConfig.enableLogging,
    attributionRules: [],
    batchSize: baseConfig.batchSize,
    retentionDays: baseConfig.retentionDays,
  });

  // Create cost breakdown analyzer
  const breakdownAnalyzer = createCostBreakdownAnalyzer({
    dataDir: baseConfig.dataDir,
    enableLogging: baseConfig.enableLogging,
    dimensions: [&apos;operation&apos;, &apos;user&apos;, &apos;project&apos;, 'session&apos;, &apos;model&apos;, &apos;feature&apos;, &apos;time&apos;, &apos;geographic&apos;],
    analysisDepth: &apos;comprehensive&apos;,
    statisticalAnalysis: {
      confidenceLevel: 0.95,
      enableOutlierDetection: true,
      enableTrendAnalysis: true,
      enableDistributionAnalysis: true,
    },
  });

  // Create cost allocation manager
  const allocationManager = createCostAllocationManager({
    dataDir: baseConfig.dataDir,
    enableLogging: baseConfig.enableLogging,
    defaultAllocationMethod: &apos;activity_based&apos;,
    allocationRules: [],
    reallocationThreshold: 0.1,
  });

  // Create efficiency analyzer
  const efficiencyAnalyzer = createEfficiencyAnalyzer({
    dataDir: baseConfig.dataDir,
    enableLogging: baseConfig.enableLogging,
    businessValueModel: {
      revenueWeight: 0.4,
      costSavingsWeight: 0.3,
      userSatisfactionWeight: 0.2,
      strategicValueWeight: 0.1,
    },
    benchmarkingConfig: {
      enableIndustryBenchmarks: true,
      enableHistoricalComparison: true,
      benchmarkThresholds: {
        excellent: 2.0,
        good: 1.5,
        acceptable: 1.0,
        poor: 0.5,
      },
    },
  });

  // Create cost comparator
  const costComparator = createCostComparator({
    dataDir: baseConfig.dataDir,
    enableLogging: baseConfig.enableLogging,
    comparisonConfig: {
      enableStatisticalTests: true,
      confidenceLevel: 0.95,
      includeEffectSize: true,
      enableTrendAnalysis: true,
    },
    benchmarkingSources: [&apos;industry&apos;, &apos;historical&apos;, &apos;peer&apos;],
  });

  // Create impact assessment
  const impactAssessment = createCostImpactAssessment({
    dataDir: baseConfig.dataDir,
    enableLogging: baseConfig.enableLogging,
    riskAssessmentConfig: {
      riskFactors: [&apos;cost_volatility&apos;, &apos;usage_uncertainty&apos;, &apos;market_changes&apos;, &apos;technical_debt&apos;],
      riskThresholds: {
        low: 0.1,
        medium: 0.3,
        high: 0.6,
        critical: 0.8,
      },
    },
    impactModeling: {
      timeHorizon: 12,
      scenarios: [&apos;best_case&apos;, &apos;worst_case&apos;, &apos;most_likely&apos;],
      sensitivityAnalysis: true,
    },
  });

  // Create cost modeling engine
  const modelingEngine = createCostModelingEngine({
    modelId: &apos;primary-cost-model&apos;,
    modelName: &apos;Primary Cost Prediction Model&apos;,
    type: &apos;ensemble&apos;,
    parameters: {
      ensemble: {
        models: [
          {
            modelId: &apos;linear-component&apos;,
            modelName: &apos;Linear Cost Component&apos;,
            type: &apos;linear&apos;,
            parameters: { linear: { slope: 1.0, intercept: 0.0 } },
            validation: {
              validationSplit: 0.2,
              crossValidationFolds: 5,
              errorThreshold: 0.1,
              metrics: [&apos;mae&apos;, &apos;rmse&apos;, &apos;r_squared&apos;],
            },
            dataDir: baseConfig.dataDir,
            enableLogging: baseConfig.enableLogging,
          },
          {
            modelId: &apos;polynomial-component&apos;,
            modelName: &apos;Polynomial Cost Component&apos;,
            type: &apos;polynomial&apos;,
            parameters: { polynomial: { coefficients: [0, 1, 0.1], degree: 2 } },
            validation: {
              validationSplit: 0.2,
              crossValidationFolds: 5,
              errorThreshold: 0.1,
              metrics: [&apos;mae&apos;, &apos;rmse&apos;, &apos;r_squared&apos;],
            },
            dataDir: baseConfig.dataDir,
            enableLogging: baseConfig.enableLogging,
          },
        ],
        weights: [0.7, 0.3],
        combiningMethod: &apos;weighted_average&apos;,
      },
    },
    validation: {
      validationSplit: 0.2,
      crossValidationFolds: 5,
      errorThreshold: 0.15,
      metrics: [&apos;mae&apos;, &apos;rmse&apos;, &apos;r_squared&apos;, &apos;mape&apos;],
    },
    dataDir: baseConfig.dataDir,
    enableLogging: baseConfig.enableLogging,
  });

  // Create comprehensive report generator
  const reportGenerator = createCostReportGenerator(
    {
      outputDir: `${baseConfig.dataDir}/reports`,
      formats: [&apos;html&apos;, &apos;json&apos;, &apos;csv&apos;, &apos;markdown&apos;],
      templateConfig: {
        branding: {
          companyName: &apos;Gemini CLI&apos;,
          primaryColor: &apos;#4285F4&apos;,
          secondaryColor: &apos;#34A853&apos;,
        },
        styling: {
          theme: &apos;light&apos;,
          fontSize: &apos;medium&apos;,
          chartStyle: &apos;modern&apos;,
        },
        content: {
          includeExecutiveSummary: true,
          includeDetailedAnalysis: true,
          includeRecommendations: true,
          includeTrendAnalysis: true,
          includeComparisons: true,
          customSections: [],
        },
      },
      retentionDays: baseConfig.retentionDays,
      enableLogging: baseConfig.enableLogging,
    },
    costTracker,
    breakdownAnalyzer,
    efficiencyAnalyzer,
    costComparator,
    impactAssessment,
  );

  return {
    // Core analysis components
    costTracker,
    breakdownAnalyzer,
    allocationManager,
    efficiencyAnalyzer,
    costComparator,
    impactAssessment,
    modelingEngine,
    reportGenerator,

    // Convenience methods
    async generateComprehensiveReport(startDate: Date, endDate: Date) {
      const report = await reportGenerator.generateCostAnalysisReport(startDate, endDate, {
        includeForecasting: true,
        includeComparisons: true,
        includeRecommendations: true,
      });

      const exportedFiles = await reportGenerator.exportReport(report, [&apos;html&apos;, &apos;json&apos;, &apos;csv&apos;]);

      return { report, exportedFiles };
    },

    async performFullCostAnalysis(startDate: Date, endDate: Date) {
      return {
        featureCosts: await costTracker.getFeatureCostAggregation(startDate, endDate),
        breakdown: await breakdownAnalyzer.performCostBreakdown(startDate, endDate),
        efficiency: await efficiencyAnalyzer.calculateFeatureEfficiency(startDate, endDate),
        comparisons: await costComparator.performComprehensiveComparison(startDate, endDate),
        impacts: await impactAssessment.assessFeatureCostImpact(startDate, endDate),
        topCostFeatures: await costTracker.getTopCostFeatures(startDate, endDate, 10),
      };
    },

    async predictFeatureCosts(_features: Record<string, number>) {
      return await modelingEngine.predictCost(_features);
    },

    async analyzeCostSensitivity(baseFeatures: Record<string, number>) {
      return await modelingEngine.performSensitivityAnalysis(baseFeatures);
    },
  };
}

/**
 * Default configuration for cost analysis system
 */
export const DEFAULT_COST_ANALYSIS_CONFIG = {
  dataDir: &apos;./data/cost-analysis&apos;,
  enableLogging: true,
  batchSize: 100,
  retentionDays: 90,
};

/**
 * Cost analysis system type definition
 */
export type CostAnalysisSystem = ReturnType<typeof createComprehensiveCostAnalysisSystem>;