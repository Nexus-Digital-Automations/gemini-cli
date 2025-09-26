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
export {
  BudgetEnforcement,
  BudgetExceededError,
  createBudgetEnforcement,
  isBudgetExceededError,
  type BudgetWarning,
  type BudgetEnforcementOptions,
} from './budget-enforcement.js';

// Configuration Management Exports
export {
  BudgetConfigManager,
  createBudgetConfigManager,
  BudgetConfigValidationError,
  BudgetConfigAccessError,
  DEFAULT_BUDGET_SETTINGS,
} from './config/BudgetConfigManager.js';

// Persistence Layer Exports
export type {
  BudgetStorage,
  StorageOperationResult,
  StorageHealthCheck,
  StorageMetrics,
  StorageConfig,
  ObservableStorage,
  StorageEvent,
  StorageEventType,
  StorageEventListener,
  StorageFactory,
  MigratableStorage,
  StorageMigration,
} from './persistence/BudgetStorageInterface.js';
export { FileStorage, createFileStorage } from './persistence/FileStorage.js';

// Calculation Engine Exports
export {
  CostCalculationEngine,
  createCostCalculationEngine,
  type ModelPricing,
  type CostCalculationResult,
  type UsageCalculationResult,
} from './calculations/CostCalculationEngine.js';

// Validation System Exports
export {
  BudgetValidator,
  createBudgetValidator,
  BudgetConstraintViolation,
  type ValidationRule,
  type ValidationContext,
  type ValidationRuleResult,
  type ComprehensiveValidationResult,
} from './validation/BudgetValidator.js';

// Event System Exports
export {
  BudgetEventSystem,
  getBudgetEventSystem,
  createBudgetEventSystem,
  type BudgetEventHandler,
  type EventSubscriptionOptions,
  type EventSubscription,
  type EventStatistics,
} from './events/BudgetEventSystem.js';

// Utility Functions Exports
export {
  BudgetUtils,
  formatCurrency,
  formatLargeNumber,
  calculatePercentage,
  formatDuration,
  calculateUsageStats,
  projectBudgetUsage,
  mergeUsageData,
  validateBudgetSettings,
  getTimeUntilReset,
  getEnforcementDescription,
  getFrequencyDescription,
  type CurrencyFormatOptions,
  type TimePeriod,
  type UsageStatsSummary,
  type BudgetProjection,
} from './utils/BudgetUtils.js';

// Security and Access Control Exports
export {
  BudgetAccessControl,
  createBudgetAccessControl,
  type SecurityAuditEntry,
  type AccessControlRule,
  type AccessCondition,
  type PermissionCheckResult,
  type SecurityConfig,
} from './security/BudgetAccessControl.js';

// Analytics exports
export {
  AnalyticsEngine,
  createAnalyticsEngine,
} from './analytics/AnalyticsEngine.js';
export { OptimizationEngine } from './analytics/OptimizationEngine.js';

// API exports
export {
  MLBudgetAPI,
  mlBudgetAPI,
  mlBudgetHandlers,
  type ForecastRequest,
  type ForecastResponse,
  type OptimizationResponse,
  type AnomalyDetectionResponse,
  type ModelMetricsResponse,
  type UsageStatsResponse,
} from './api/ml-budget-api.js';

// CLI exports
export {
  MLBudgetCLI,
  createMLBudgetCLI,
  mlBudgetCLI,
} from './cli/ml-budget-cli.js';

// Dashboard exports
export {
  BudgetDashboard,
  createBudgetDashboard,
} from './dashboard/BudgetDashboard.js';
export {
  RealTimeTracker,
  createRealTimeTracker,
} from './dashboard/RealTimeTracker.js';
export { DashboardFormatter } from './dashboard/DashboardFormatter.js';
export {
  ChartRenderer,
  createChartRenderer,
} from './dashboard/ChartRenderer.js';

// Core Type exports
export type {
  BudgetSettings,
  BudgetUsageData,
  TokenUsageData,
  ModelUsageData,
  SessionUsageData,
  HistoricalDataPoint,
  NotificationSettings,
  BudgetEnforcementLevel,
  NotificationFrequency,
  BudgetCalculationContext,
  CostCalculationParams,
  BudgetValidationResult,
  BudgetEventType,
  BudgetEvent,
  EventSeverity,
  BudgetSecurityContext,
  BudgetPermission,
} from './types.js';

// Analytics type exports
export type {
  AnalyticsDimension,
  UsagePattern,
  OptimizationType,
  UsageMetrics,
  FeatureCostAnalysis,
  OptimizationRecommendation,
  PatternAnalysis,
  AnomalyDetection,
  AnalyticsReport,
  AnalyticsConfig,
} from './analytics/AnalyticsEngine.js';

// Dashboard type exports
export type {
  BudgetDashboardConfig,
  BudgetDashboardSections,
  BudgetDashboardData,
  BudgetDashboardAlert,
  BudgetCurrentUsageData,
  BudgetCostProjections,
  BudgetTrendsData,
} from './dashboard/BudgetDashboard.js';
export type {
  RealTimeData,
  UsageEvent,
  UsageEventListener,
} from './dashboard/RealTimeTracker.js';
export type {
  ChartConfig,
  ChartColors,
  ChartDataPoint as DashboardChartDataPoint,
  ChartSeries,
} from './dashboard/ChartRenderer.js';

// Allocation System Type Exports
export type {
  AllocationSystem,
  RecommendationEngine,
} from './allocation/index.js';

// Allocation System Value Exports - Intelligent Budget Allocation and Optimization
export {
  // Core allocation system
  createAllocationSystem,
  createAllocationCandidatesFromBudgetData,
  createRecommendationContext,
  DEFAULT_ALLOCATION_CONFIG,
  // Algorithm framework
  BaseAllocationAlgorithm,
  UsageBasedAlgorithm,
  ROIOptimizedAlgorithm,
  PriorityBasedAlgorithm,
  createAllocationAlgorithm,
  createUsageBasedAlgorithm,
  createROIOptimizedAlgorithm,
  createPriorityBasedAlgorithm,
  getDefaultAlgorithmConfig,
  validateAlgorithmConfig,
  getAlgorithmMetrics,
  compareAlgorithmPerformance,
  ALGORITHM_REGISTRY,
  // Recommendation engine
  createRecommendationEngine,
} from './allocation/index.js';

// Allocation Type Exports
export type {
  // Core allocation types
  AllocationPriority,
  AllocationStrategy,
  AllocationConstraints,
  SLARequirements,
  AllocationCandidate,
  AllocationRecommendation,
  AllocationImpact,
  RiskAssessment,
  AllocationScenario,
  ScenarioOutcome,
  AllocationAlgorithmConfig,
  AllocationOptimizationResult,
  // System configuration types
  AllocationSystemConfig,
  AllocationSystemHealth,
  // Algorithm and recommendation types
  AllocationLogger,
  AlgorithmComparison,
  RecommendationEngineConfig,
  RecommendationContext,
  RecommendationResult,
  RecommendationInsights,
  RecommendationPerformanceMetrics,
} from './allocation/index.js';

// Real-Time Token Usage Monitoring System Exports
export {
  // Core monitoring components
  TokenTracker,
  MetricsCollector,
  UsageCalculator,
  BudgetEventManager,
  QuotaManager,
  TokenDataAggregator,
  RealTimeStreamingService,
  TokenUsageCache,
  createTokenUsageCache,
  // Integration layer
  TokenMonitoringIntegration,
  TokenTrackingContentGenerator,
  createTokenMonitoringIntegration,
  createMonitoringEnabledContentGenerator,
  // Configuration presets and utilities
  MonitoringPresets,
  MonitoringHealthChecker,
  MonitoringUtils,
  // Cache presets and utilities
  CachePriority,
  CachePresets,
  CacheKeys,
} from './monitoring/index.js';

// Monitoring Type Exports
export type {
  // Token tracking types
  TokenTrackerConfig,
  TokenTrackingEvent,
  RequestTrackingData,
  TokenUsageStats,
  // Metrics collection types
  MetricsCollectorConfig,
  MetricsDataPoint,
  MetricsSummary,
  AggregatedMetrics,
  TrendAnalysis,
  // Event management types
  EventSubscription as MonitoringEventSubscription,
  EventFilter,
  EventRoutingRule,
  // Quota management types
  QuotaManagerConfig,
  QuotaLimit,
  // Data aggregation types
  AggregationConfig,
  TimeWindow,
  WindowedData,
  // Streaming types
  StreamingConfig,
  StreamSubscription,
  StreamType,
  StreamUpdate,
  StreamError,
  // Cache types
  CacheEntry,
  CacheConfig,
  CacheStats,
  CacheInvalidationEvent,
  PrefetchConfig,
  // Integration types
  MonitoringIntegrationConfig,
  IntegrationStats,
  // Calculation types
  ModelPricing as MonitoringModelPricing,
  CostBreakdown,
  UsageCostAnalysis,
} from './monitoring/index.js';

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
