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
  DEFAULT_BUDGET_SETTINGS
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
  StorageMigration
} from './persistence/BudgetStorageInterface.js';
export {
  FileStorage,
  createFileStorage
} from './persistence/FileStorage.js';

// Calculation Engine Exports
export {
  CostCalculationEngine,
  createCostCalculationEngine,
  type ModelPricing,
  type CostCalculationResult,
  type UsageCalculationResult
} from './calculations/CostCalculationEngine.js';

// Validation System Exports
export {
  BudgetValidator,
  createBudgetValidator,
  BudgetConstraintViolation,
  type ValidationRule,
  type ValidationContext,
  type ValidationRuleResult,
  type ComprehensiveValidationResult
} from './validation/BudgetValidator.js';

// Event System Exports
export {
  BudgetEventSystem,
  getBudgetEventSystem,
  createBudgetEventSystem,
  type BudgetEventHandler,
  type EventSubscriptionOptions,
  type EventSubscription,
  type EventStatistics
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
  type BudgetProjection
} from './utils/BudgetUtils.js';

// Security and Access Control Exports
export {
  BudgetAccessControl,
  createBudgetAccessControl,
  type SecurityAuditEntry,
  type AccessControlRule,
  type AccessCondition,
  type PermissionCheckResult,
  type SecurityConfig
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
export { RealTimeTracker, createRealTimeTracker } from './dashboard/RealTimeTracker.js';
export { DashboardFormatter } from './dashboard/DashboardFormatter.js';
export { ChartRenderer, createChartRenderer } from './dashboard/ChartRenderer.js';

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
  BudgetPermission
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
  DashboardConfig,
  DashboardSections,
  DashboardData,
  BudgetAlert,
  CurrentUsageData,
  CostProjections,
  TrendsData,
  RealTimeData,
  UsageEvent,
  UsageEventListener,
} from './dashboard/BudgetDashboard.js';
export type { ChartConfig, ChartColors, ChartDataPoint, ChartSeries } from './dashboard/ChartRenderer.js';