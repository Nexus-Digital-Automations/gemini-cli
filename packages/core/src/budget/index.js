/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * @fileoverview Budget Infrastructure - Core budget management system
 * Comprehensive budget tracking, analytics, and management for Gemini CLI
 *
 * @author Claude Code - Budget Core Infrastructure Agent
 * @version 1.0.0
 */
// Core Infrastructure Exports
export { BudgetTracker, createBudgetTracker } from './budget-tracker.js';
export { BudgetEnforcement, BudgetExceededError, createBudgetEnforcement, isBudgetExceededError, } from './budget-enforcement.js';
// Configuration Management Exports
export { BudgetConfigManager, createBudgetConfigManager, BudgetConfigValidationError, BudgetConfigAccessError, DEFAULT_BUDGET_SETTINGS, } from './config/BudgetConfigManager.js';
export { FileStorage, createFileStorage } from './persistence/FileStorage.js';
// Calculation Engine Exports
export { CostCalculationEngine, createCostCalculationEngine, } from './calculations/CostCalculationEngine.js';
// Validation System Exports
export { BudgetValidator, createBudgetValidator, BudgetConstraintViolation, } from './validation/BudgetValidator.js';
// Event System Exports
export { BudgetEventSystem, getBudgetEventSystem, createBudgetEventSystem, } from './events/BudgetEventSystem.js';
// Utility Functions Exports
export { BudgetUtils, formatCurrency, formatLargeNumber, calculatePercentage, formatDuration, calculateUsageStats, projectBudgetUsage, mergeUsageData, validateBudgetSettings, getTimeUntilReset, getEnforcementDescription, getFrequencyDescription, } from './utils/BudgetUtils.js';
// Security and Access Control Exports
export { BudgetAccessControl, createBudgetAccessControl, } from './security/BudgetAccessControl.js';
// Analytics exports
export { AnalyticsEngine, createAnalyticsEngine, } from './analytics/AnalyticsEngine.js';
export { OptimizationEngine } from './analytics/OptimizationEngine.js';
// API exports
export { MLBudgetAPI, mlBudgetAPI, mlBudgetHandlers, } from './api/ml-budget-api.js';
// CLI exports
export { MLBudgetCLI, createMLBudgetCLI, mlBudgetCLI, } from './cli/ml-budget-cli.js';
// Dashboard exports
export { BudgetDashboard, createBudgetDashboard, } from './dashboard/BudgetDashboard.js';
export { RealTimeTracker, createRealTimeTracker, } from './dashboard/RealTimeTracker.js';
export { DashboardFormatter } from './dashboard/DashboardFormatter.js';
export { ChartRenderer, createChartRenderer, } from './dashboard/ChartRenderer.js';
// Allocation System Value Exports - Intelligent Budget Allocation and Optimization
export { 
// Core allocation system
createAllocationSystem, createAllocationCandidatesFromBudgetData, createRecommendationContext, DEFAULT_ALLOCATION_CONFIG, 
// Algorithm framework
BaseAllocationAlgorithm, UsageBasedAlgorithm, ROIOptimizedAlgorithm, PriorityBasedAlgorithm, createAllocationAlgorithm, createUsageBasedAlgorithm, createROIOptimizedAlgorithm, createPriorityBasedAlgorithm, getDefaultAlgorithmConfig, validateAlgorithmConfig, getAlgorithmMetrics, compareAlgorithmPerformance, ALGORITHM_REGISTRY, 
// Recommendation engine
createRecommendationEngine, } from './allocation/index.js';
// Real-Time Token Usage Monitoring System Exports
export { 
// Core monitoring components
TokenTracker, MetricsCollector, UsageCalculator, BudgetEventManager, QuotaManager, TokenDataAggregator, RealTimeStreamingService, TokenUsageCache, createTokenUsageCache, 
// Integration layer
TokenMonitoringIntegration, TokenTrackingContentGenerator, createTokenMonitoringIntegration, createMonitoringEnabledContentGenerator, 
// Configuration presets and utilities
MonitoringPresets, MonitoringHealthChecker, MonitoringUtils, 
// Cache presets and utilities
CachePriority, CachePresets, CacheKeys, } from './monitoring/index.js';
// Cost Analysis System Exports - Feature-Level Cost Attribution and Analysis
// NOTE: Cost analysis system not yet implemented - exports commented out
// export {
//   // Core cost analysis components
//   FeatureCostTracker,
//   createFeatureCostTracker,
//   CostBreakdownAnalyzer,
//   createCostBreakdownAnalyzer,
//   CostAllocationManager,
//   createCostAllocationManager,
//   EfficiencyAnalyzer,
//   createEfficiencyAnalyzer,
//   CostComparator,
//   createCostComparator,
//   CostImpactAssessment,
//   createCostImpactAssessment,
//   CostReportGenerator,
//   createCostReportGenerator,
//   CostModelingEngine,
//   createCostModelingEngine,
//   // Comprehensive cost analysis system
//   createComprehensiveCostAnalysisSystem,
//   DEFAULT_COST_ANALYSIS_CONFIG,
// } from './cost-analysis/index.js';
// Cost Analysis Type Exports
// NOTE: Cost analysis types not yet implemented - exports commented out
// export type {
// // Feature cost tracking types
// FeatureCostEntry,
// FeatureCostConfig,
// CostAttributionRule,
// FeatureCostAggregation,
// // Cost breakdown analysis types
// CostBreakdownConfig,
// CostBreakdownEntry,
// CostBreakdownAnalysis,
// DimensionBreakdown,
// BreakdownDimension,
// TimeSeriesAnalysis,
// StatisticalSummary,
// CostDistribution,
// // Cost allocation types
// CostAllocationConfig,
// AllocationMethod,
// AllocationTarget,
// AllocationRule,
// CostAllocationRule,
// AllocationResult,
// // AllocationRecommendation,
// AllocationEfficiencyAnalysis,
// // Efficiency analysis types
// EfficiencyAnalysisConfig,
// FeatureEfficiencyMetrics,
// BusinessValue,
// ROICalculationParams,
// EfficiencyBenchmark,
// OptimizationOpportunity,
// EfficiencyTrend,
// // Cost comparison types
// CostComparisonConfig,
// CostComparison,
// ComparisonMetrics,
// BenchmarkingAnalysis,
// ComparisonDimension,
// StatisticalSignificance,
// CrossDimensionalAnalysis,
// ExecutiveSummary,
// // Impact assessment types
// CostImpactConfig,
// CostImpact,
// ImpactSeverity,
// ImpactRecommendation,
// // RiskAssessment,
// ScenarioImpact,
// ImpactMetrics,
// // Cost reporting types
// ReportGenerationConfig,
// ReportFormat,
// ReportTemplateConfig,
// CustomReportSection,
// ReportSectionContent,
// ChartDataSet,
// ChartDataPoint as CostAnalysisChartDataPoint,
// ChartOptions,
// AxisConfig,
// CostAnalysisReport,
// ReportMetadata,
// CostOptimizationRecommendation,
// CostTrendAnalysis,
// SeasonalPattern,
// CostAnomaly,
// ForecastData,
// ForecastPeriod,
// CostAlert,
// ComprehensiveCostData,
// // Cost modeling types
// CostModelConfig,
// CostModelType,
// ModelParameters,
// PiecewiseBreakpoint,
// ModelValidationConfig,
// ValidationMetric,
// CostDataPoint,
// CostPrediction,
// ModelValidationResult,
// ModelComparison,
// ModelRanking,
// StatisticalTest,
// CostSensitivityAnalysis,
// FeatureSensitivity,
// ScenarioAnalysis,
// CriticalThreshold,
// // System types
// CostAnalysisSystem,
// } from './cost-analysis/index.js';
//# sourceMappingURL=index.js.map