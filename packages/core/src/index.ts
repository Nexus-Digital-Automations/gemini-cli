/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// Export config
export * from './config/config.js';
export * from './output/types.js';
export * from './output/json-formatter.js';
export * from './policy/types.js';
export * from './policy/policy-engine.js';

// Export Core Logic
export * from './core/client.js';
export * from './core/contentGenerator.js';
export * from './core/loggingContentGenerator.js';
export * from './core/geminiChat.js';
export * from './core/logger.js';
export * from './core/prompts.js';
export * from './core/tokenLimits.js';
export * from './core/turn.js';
export * from './core/geminiRequest.js';
export * from './core/coreToolScheduler.js';
export * from './core/nonInteractiveToolExecutor.js';

export * from './fallback/types.js';

export * from './code_assist/codeAssist.js';
export * from './code_assist/oauth2.js';
export * from './code_assist/server.js';
export * from './code_assist/types.js';

// Export utilities
export * from './utils/paths.js';
export * from './utils/schemaValidator.js';
export * from './utils/errors.js';
export * from './utils/getFolderStructure.js';
export * from './utils/memoryDiscovery.js';
export * from './utils/gitIgnoreParser.js';
export * from './utils/gitUtils.js';
export * from './utils/editor.js';
export * from './utils/quotaErrorDetection.js';
export * from './utils/fileUtils.js';
export * from './utils/retry.js';
export * from './utils/shell-utils.js';
export * from './utils/terminalSerializer.js';
export * from './utils/systemEncoding.js';
export * from './utils/textUtils.js';
export * from './utils/formatters.js';
export * from './utils/generateContentResponseUtilities.js';
export * from './utils/filesearch/fileSearch.js';
export * from './utils/errorParsing.js';
export * from './utils/workspaceContext.js';
export * from './utils/ignorePatterns.js';
export * from './utils/partUtils.js';
export * from './utils/promptIdContext.js';
export * from './utils/thoughtUtils.js';

// Export services
export * from './services/fileDiscoveryService.js';
export * from './services/gitService.js';
export * from './services/chatRecordingService.js';
export * from './services/fileSystemService.js';

// Export IDE specific logic
export * from './ide/ide-client.js';
export * from './ide/ideContext.js';
export * from './ide/ide-installer.js';
export { IDE_DEFINITIONS, type IdeInfo } from './ide/detect-ide.js';
export * from './ide/constants.js';
export * from './ide/types.js';

// Export Shell Execution Service
export * from './services/shellExecutionService.js';

// Export base tool definitions
export * from './tools/tools.js';
export * from './tools/tool-error.js';
export * from './tools/tool-registry.js';

// Export prompt logic
export * from './prompts/mcp-prompts.js';

// Export specific tool logic
export * from './tools/read-file.js';
export * from './tools/ls.js';
export * from './tools/grep.js';
export * from './tools/ripGrep.js';
export * from './tools/glob.js';
export * from './tools/edit.js';
export * from './tools/write-file.js';
export * from './tools/web-fetch.js';
export * from './tools/memoryTool.js';
export * from './tools/shell.js';
export * from './tools/web-search.js';
export * from './tools/read-many-files.js';
export * from './tools/mcp-client.js';
export * from './tools/mcp-tool.js';
export * from './tools/write-todos.js';

// MCP OAuth
export { MCPOAuthProvider } from './mcp/oauth-provider.js';
export type {
  OAuthToken,
  OAuthCredentials,
} from './mcp/token-storage/types.js';
export { MCPOAuthTokenStorage } from './mcp/oauth-token-storage.js';
export type { MCPOAuthConfig } from './mcp/oauth-provider.js';
export type {
  OAuthAuthorizationServerMetadata,
  OAuthProtectedResourceMetadata,
} from './mcp/oauth-utils.js';
export { OAuthUtils } from './mcp/oauth-utils.js';

// Export telemetry functions
export * from './telemetry/index.js';
export { sessionId } from './utils/session.js';
export * from './utils/browser.js';
export { Storage } from './config/storage.js';

// Export budget system (excluding conflicting types)
export {
  BudgetTracker,
  createBudgetTracker,
  BudgetEnforcement,
  BudgetExceededError,
  createBudgetEnforcement,
  isBudgetExceededError,
  BudgetConfigManager,
  createBudgetConfigManager,
  BudgetConfigValidationError,
  BudgetConfigAccessError,
  DEFAULT_BUDGET_SETTINGS,
  FileStorage,
  createFileStorage,
  CostCalculationEngine,
  createCostCalculationEngine,
  BudgetValidator,
  createBudgetValidator,
  BudgetConstraintViolation,
  BudgetEventSystem,
  getBudgetEventSystem,
  createBudgetEventSystem,
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
  BudgetAccessControl,
  createBudgetAccessControl,
  AnalyticsEngine,
  createAnalyticsEngine,
  OptimizationEngine,
  MLBudgetAPI,
  mlBudgetAPI,
  mlBudgetHandlers,
  MLBudgetCLI,
  createMLBudgetCLI,
  mlBudgetCLI,
  BudgetDashboard,
  createBudgetDashboard,
  RealTimeTracker,
  createRealTimeTracker,
  DashboardFormatter,
  ChartRenderer,
  createChartRenderer,
  createAllocationSystem,
  createAllocationCandidatesFromBudgetData,
  createRecommendationContext,
  DEFAULT_ALLOCATION_CONFIG,
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
  createRecommendationEngine,
  TokenTracker,
  MetricsCollector,
  UsageCalculator,
  BudgetEventManager,
  QuotaManager,
  TokenDataAggregator,
  RealTimeStreamingService,
  TokenUsageCache,
  createTokenUsageCache,
  TokenMonitoringIntegration,
  TokenTrackingContentGenerator,
  createTokenMonitoringIntegration,
  createMonitoringEnabledContentGenerator,
  MonitoringPresets,
  MonitoringHealthChecker,
  MonitoringUtils,
  CachePriority,
  CachePresets,
  CacheKeys,
} from './budget/index.js';

// Export budget types with budget-specific names
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
  BudgetWarning,
  BudgetEnforcementOptions,
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
  ModelPricing,
  CostCalculationResult,
  UsageCalculationResult,
  ValidationRule,
  ValidationContext,
  ValidationRuleResult,
  ComprehensiveValidationResult,
  BudgetEventHandler,
  EventSubscriptionOptions,
  EventSubscription,
  EventStatistics,
  CurrencyFormatOptions,
  TimePeriod,
  UsageStatsSummary,
  BudgetProjection,
  SecurityAuditEntry,
  AccessControlRule,
  AccessCondition,
  PermissionCheckResult,
  SecurityConfig as BudgetSecurityConfig,
  ForecastRequest,
  ForecastResponse,
  OptimizationResponse,
  AnomalyDetectionResponse,
  ModelMetricsResponse,
  UsageStatsResponse,
  BudgetDashboardConfig,
  BudgetDashboardSections,
  BudgetDashboardData,
  BudgetDashboardAlert,
  BudgetCurrentUsageData,
  BudgetCostProjections,
  BudgetTrendsData,
  RealTimeData,
  UsageEvent,
  UsageEventListener,
  ChartConfig,
  ChartColors,
  DashboardChartDataPoint,
  ChartSeries,
  AnalyticsDimension,
  UsagePattern,
  OptimizationType,
  UsageMetrics,
  FeatureCostAnalysis,
  OptimizationRecommendation as BudgetOptimizationRecommendation,
  PatternAnalysis,
  AnomalyDetection,
  AnalyticsReport,
  AnalyticsConfig,
  AllocationSystem,
  RecommendationEngine,
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
  AllocationSystemConfig,
  AllocationSystemHealth,
  AllocationLogger,
  AlgorithmComparison,
  RecommendationEngineConfig,
  RecommendationContext,
  RecommendationResult,
  RecommendationInsights,
  RecommendationPerformanceMetrics,
  TokenTrackerConfig,
  TokenTrackingEvent,
  RequestTrackingData,
  TokenUsageStats,
  MetricsCollectorConfig,
  MetricsDataPoint,
  MetricsSummary,
  AggregatedMetrics,
  TrendAnalysis,
  MonitoringEventSubscription,
  EventFilter,
  EventRoutingRule,
  QuotaManagerConfig,
  QuotaLimit,
  AggregationConfig,
  TimeWindow,
  WindowedData,
  StreamingConfig,
  StreamSubscription,
  StreamType,
  StreamUpdate,
  StreamError,
  CacheEntry,
  CacheConfig,
  CacheStats,
  CacheInvalidationEvent,
  PrefetchConfig,
  MonitoringIntegrationConfig,
  IntegrationStats,
  MonitoringModelPricing,
  CostBreakdown,
  UsageCostAnalysis,
} from './budget/index.js';

// Export task management system (excluding conflicting types)
export {
  TaskManager,
  createTaskManager,
  TaskComplexity,
  TaskStatus,
  TaskPriority,
  TaskType,
  DependencyType,
  AgentCapability,
  SubagentTerminateMode,
  ContextState,
  TaskExecutionEngine,
  TaskExecutionUtils,
  TaskQueue,
  TaskCategory,
  TaskManagementSystemIntegrator,
  SystemConfigFactory,
  createIntegratedTaskManagementSystem,
  TaskManagementConfigManager,
  ConfigUtils,
  PriorityScheduler,
  SchedulingAlgorithm,
  QueueOptimizer,
  OptimizationStrategy,
  AutonomousTaskBreakdown,
  BreakdownStrategy,
  EnhancedAutonomousTaskQueue,
  ExecutionMonitoringSystem,
  InfiniteHookIntegration,
  TaskManagementSystemFactory,
  createTaskManagementSystem,
  createTaskEngine,
  createAutonomousTaskQueue,
  createCompleteWithAutonomousQueue,
  INTEGRATION_EXAMPLES,
} from './task-management/index.js';

// Export task management types with task-specific names
export type {
  TaskManagerConfig,
  AutonomousContext,
  TaskExecutionStrategy,
  AutonomousDecision,
  Task,
  TaskDependency,
  TaskBreakdown,
  TaskMetrics,
  TaskExecutionContext,
  TaskBreakdownAnalyzer,
  QueueTaskPriority,
  QueueTaskStatus,
  QueueDependencyType,
  IntegratedSystemConfig,
  SystemHealth,
  SystemOperationResult,
  TaskManagementConfiguration,
  TaskEngineConfig,
  AutonomousQueueConfig,
  MonitoringConfig,
  PersistenceConfig,
  DependencyConfig,
  SecurityConfig as TaskSecurityConfig,
  DevelopmentConfig,
  ConfigValidationResult,
  SchedulingContext,
  SchedulingDecision,
  OptimizationRecommendation as TaskOptimizationRecommendation,
  BatchOptimization,
  TaskBreakdownResult,
  ComplexityMetrics,
  SubTask,
  EnhancedQueueConfig,
  AutonomousExecutionContext,
  AutonomousQueueMetrics,
  ExecutionMetrics,
  TaskExecutionEvent,
  AlertConfig,
  BottleneckAnalysis,
  SystemHealthStatus,
  TaskManagerAPI,
  HookIntegrationConfig,
} from './task-management/index.js';

// Export knowledge base system
export {
  KnowledgeBaseManager,
  createKnowledgeBaseManager,
  knowledgeBaseManager,
  KnowledgeSourceType,
} from './knowledge/KnowledgeBaseManager.js';
export type {
  KnowledgeSource,
  KnowledgeSourceAuth,
  IndexingConfig,
  KnowledgeDocument,
  KnowledgeQuery,
  ProjectKnowledgeFilters,
  KnowledgeSearchResult,
  InstitutionalPattern,
  PatternExample,
  KnowledgeSuggestion,
  KnowledgeStats,
} from './knowledge/KnowledgeBaseManager.js';

// Export persona system
export { PersonaManager, personaManager } from './persona/PersonaManager.js';
export type {
  PersonalityTraits,
  BehavioralPatterns,
  PersonaCustomization,
  PersonaProfile,
} from './persona/PersonaManager.js';

// Export progress tracking system
export * from './progress/index.js';

// Export component logger and StructuredLogger interface
export { getComponentLogger } from './utils/logger.js';
export type { StructuredLogger } from './utils/logger.js';

// Export test utils
export * from './test-utils/index.js';
