/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Comprehensive Automatic Task Completion Validation Cycles
 *
 * This module provides a complete validation automation system for the Gemini CLI with:
 * - Multi-level validation strategies (syntax, logic, integration)
 * - Automated validation rule engines
 * - Comprehensive failure handling and retry mechanisms
 * - Real-time monitoring and continuous validation
 * - Detailed reporting and analytics
 *
 * @example
 * ```typescript
 * import { createValidationSystem } from '@google/gemini-cli-core/validation';
 *
 * const validationSystem = await createValidationSystem({
 *   codeQuality: {
 *     enabledLinters: ['eslint', 'prettier', 'typescript'],
 *     securityScanners: ['semgrep']
 *   },
 *   functional: {
 *     testFrameworks: ['vitest'],
 *     coverageThreshold: { lines: 80, functions: 80, branches: 70, statements: 80 }
 *   },
 *   integration: {
 *     systemCompatibility: {
 *       nodeVersions: ['18.x', '20.x', '22.x'],
 *       operatingSystems: ['linux', 'darwin', 'win32']
 *     }
 *   },
 *   monitoring: {
 *     enabled: true,
 *     watchPatterns: ['**\/*.ts', '**\/*.js'],
 *     healthChecks: []
 *   },
 *   reporting: {
 *     formats: ['json', 'html', 'junit'],
 *     outputDirectory: './validation-reports'
 *   }
 * });
 *
 * // Start continuous monitoring
 * await validationSystem.monitor.startMonitoring();
 *
 * // Execute validation workflow
 * const result = await validationSystem.workflow.executeValidationWorkflow({
 *   taskId: 'task-123',
 *   stage: TaskExecutionStage.POST_EXECUTION,
 *   executionMetadata: { startTime: new Date(), success: true },
 *   taskDetails: { type: 'implementation', description: 'Add new feature' }
 * });
 * ```
 */
// Core validation framework exports
export {
  ValidationFramework,
  ValidationSeverity,
  ValidationStatus,
  ValidationCategory,
} from './ValidationFramework.js';
// Code quality validation exports
export { CodeQualityValidator } from './CodeQualityValidator.js';
// Functional validation exports
export { FunctionalValidator } from './FunctionalValidator.js';
// Integration validation exports
export { IntegrationValidator } from './IntegrationValidator.js';
// Validation workflow exports
export {
  ValidationWorkflow,
  TaskExecutionStage,
} from './ValidationWorkflow.js';
// Failure handling exports
export {
  ValidationFailureHandler,
  FailureHandlingStrategy,
} from './ValidationFailureHandler.js';
// Reporting and analytics exports
export {
  ValidationReporting,
  ReportFormat,
  AnalyticsPeriod,
} from './ValidationReporting.js';
// Continuous monitoring exports
export {
  ContinuousValidationMonitor,
  MonitoringTrigger,
  MonitoringScope,
  HealthStatus,
} from './ContinuousValidationMonitor.js';
/**
 * Create a complete validation system with all components integrated
 */
export async function createValidationSystem(config = {}) {
  // Initialize core framework
  const framework = new ValidationFramework({
    enabledCategories: Object.values(ValidationCategory),
    maxConcurrentValidations: 10,
    timeout: 300000,
    retries: 3,
    failOnError: true,
    reportingEnabled: true,
  });
  // Initialize validators
  const codeQualityValidator = new CodeQualityValidator({
    enabledLinters: ['eslint', 'prettier', 'typescript'],
    securityScanners: ['semgrep'],
    ...config.codeQuality,
  });
  const functionalValidator = new FunctionalValidator({
    testFrameworks: ['vitest'],
    coverageThreshold: {
      lines: 80,
      functions: 80,
      branches: 70,
      statements: 80,
    },
    testPatterns: ['**/*.test.ts', '**/*.spec.ts'],
    behaviorValidation: {
      enabled: true,
      scenarios: [],
    },
    performanceThresholds: {
      maxExecutionTime: 30000,
      maxMemoryUsage: 512 * 1024 * 1024,
    },
    ...config.functional,
  });
  const integrationValidator = new IntegrationValidator({
    systemCompatibility: {
      nodeVersions: ['18.x', '20.x', '22.x'],
      operatingSystems: ['linux', 'darwin', 'win32'],
      architectures: ['x64', 'arm64'],
      dependencies: [],
    },
    performanceBenchmarks: [],
    integrationTests: {
      enabled: true,
      testCommand: 'npm run test:integration',
      timeout: 300000,
    },
    e2eTests: {
      enabled: true,
      testCommand: 'npm run test:e2e',
      timeout: 600000,
    },
    loadTesting: {
      enabled: false,
      concurrent: 10,
      duration: 60000,
      targetRps: 100,
    },
    monitoringChecks: {
      healthEndpoints: [],
      resourceLimits: {
        maxMemory: 1024 * 1024 * 1024,
        maxCpu: 80,
        maxDiskUsage: 90,
      },
    },
    ...config.integration,
  });
  // Initialize workflow
  const workflow = new ValidationWorkflow({
    stages: {
      [TaskExecutionStage.PRE_EXECUTION]: {
        enabled: true,
        validators: ['codeQuality'],
        continueOnFailure: false,
        timeout: 300000,
      },
      [TaskExecutionStage.POST_EXECUTION]: {
        enabled: true,
        validators: ['functional', 'integration'],
        continueOnFailure: true,
        timeout: 600000,
      },
      [TaskExecutionStage.ON_FAILURE]: {
        enabled: true,
        validators: ['codeQuality'],
        continueOnFailure: true,
        timeout: 180000,
      },
      [TaskExecutionStage.ON_SUCCESS]: {
        enabled: true,
        validators: ['functional'],
        continueOnFailure: true,
        timeout: 300000,
      },
      [TaskExecutionStage.CONTINUOUS]: {
        enabled: false,
        validators: ['codeQuality', 'functional'],
        continueOnFailure: true,
        timeout: 120000,
      },
    },
    globalConfig: {
      parallelExecution: true,
      maxParallelValidators: 3,
      retryOnFailure: true,
      maxRetries: 2,
      retryDelay: 1000,
    },
    validatorConfigs: {
      codeQuality: config.codeQuality,
      functional: config.functional,
      integration: config.integration,
    },
    reporting: {
      aggregateReports: true,
      persistReports: true,
      reportFormat: 'json',
    },
    notifications: {
      onSuccess: false,
      onFailure: true,
      onWarning: false,
    },
    ...config.workflow,
  });
  // Initialize failure handler
  const failureHandler = new ValidationFailureHandler({
    globalStrategy: FailureHandlingStrategy.EXPONENTIAL_BACKOFF,
    categoryStrategies: {
      [ValidationCategory.SYNTAX]: FailureHandlingStrategy.IMMEDIATE_RETRY,
      [ValidationCategory.SECURITY]: FailureHandlingStrategy.ESCALATION,
      [ValidationCategory.PERFORMANCE]: FailureHandlingStrategy.CIRCUIT_BREAKER,
    },
    severityStrategies: {
      [ValidationSeverity.CRITICAL]: FailureHandlingStrategy.ESCALATION,
      [ValidationSeverity.ERROR]: FailureHandlingStrategy.EXPONENTIAL_BACKOFF,
      [ValidationSeverity.WARNING]: FailureHandlingStrategy.FALLBACK,
    },
    retryConfig: {
      maxAttempts: 3,
      initialDelay: 1000,
      maxDelay: 30000,
      backoffMultiplier: 2,
      jitter: true,
      retryableErrors: ['TIMEOUT', 'NETWORK_ERROR', 'TEMPORARY_FAILURE'],
      nonRetryableErrors: [
        'INVALID_INPUT',
        'AUTHENTICATION_ERROR',
        'PERMISSION_DENIED',
      ],
    },
    circuitBreakerConfig: {
      failureThreshold: 5,
      recoveryTimeout: 60000,
      halfOpenMaxAttempts: 3,
      monitoringWindow: 300000,
    },
    escalationConfig: {
      levels: [
        {
          threshold: 3,
          actions: ['notify', 'log'],
          notify: ['team-lead'],
          timeout: 300000,
        },
        {
          threshold: 5,
          actions: ['notify', 'fallback'],
          notify: ['team-lead', 'manager'],
          timeout: 600000,
        },
      ],
      autoEscalation: true,
      escalationDelay: 60000,
    },
    fallbackConfig: {
      strategies: [
        { type: 'skip' },
        { type: 'default', config: { defaultValue: 'passed' } },
      ],
      conditions: [
        {
          severity: ValidationSeverity.WARNING,
          category: ValidationCategory.PERFORMANCE,
        },
      ],
    },
    recovery: {
      autoRecovery: true,
      recoveryAttempts: 3,
      recoveryStrategies: ['restart', 'reset', 'cleanup'],
    },
    monitoring: {
      trackMetrics: true,
      alertThresholds: {
        failureRate: 0.1,
        errorRate: 0.05,
        responseTime: 5000,
      },
    },
    ...config.failureHandling,
  });
  // Initialize reporting
  const reporting = new ValidationReporting({
    outputDirectory: './validation-reports',
    formats: [ReportFormat.JSON, ReportFormat.HTML],
    includeDetails: true,
    includeMetadata: true,
    aggregateReports: true,
    archiveOldReports: true,
    archiveAfterDays: 30,
    analytics: {
      enabled: true,
      retentionPeriod: 90,
      trackingMetrics: ['duration', 'success_rate', 'failure_types'],
      alertThresholds: {
        failureRate: 0.1,
        avgDuration: 5000,
        errorCount: 10,
      },
    },
    dashboard: {
      enabled: false,
      port: 8080,
      updateInterval: 30000,
      widgets: ['metrics', 'trends', 'alerts', 'failures'],
    },
    notifications: {
      enabled: false,
      channels: [],
    },
    ...config.reporting,
  });
  // Initialize continuous monitoring
  const monitor = new ContinuousValidationMonitor(
    {
      enabled: true,
      watchPatterns: ['**/*.ts', '**/*.js', '**/*.json', '**/*.md'],
      excludePatterns: ['**/node_modules/**', '**/dist/**', '**/coverage/**'],
      monitoringRules: [],
      healthChecks: [],
      alerting: {
        enabled: true,
        channels: [{ type: 'console', config: {} }],
        throttling: {
          enabled: true,
          maxAlertsPerHour: 10,
          cooldownPeriod: 300000,
        },
      },
      recovery: {
        autoRecovery: true,
        maxRecoveryAttempts: 3,
        recoveryStrategies: ['restart', 'reset', 'fallback'],
      },
      performance: {
        maxConcurrentValidations: 5,
        queueMaxSize: 100,
        validationTimeout: 300000,
      },
      persistence: {
        enabled: true,
        retentionDays: 30,
        storageBackend: 'file',
      },
      ...config.monitoring,
    },
    framework,
    workflow,
    failureHandler,
    reporting,
  );
  return {
    framework,
    codeQualityValidator,
    functionalValidator,
    integrationValidator,
    workflow,
    failureHandler,
    reporting,
    monitor,
  };
}
/**
 * Default validation system factory with common configurations
 */
export async function createDefaultValidationSystem() {
  return createValidationSystem({
    codeQuality: {
      enabledLinters: ['eslint', 'prettier', 'typescript'],
      securityScanners: ['semgrep'],
    },
    functional: {
      testFrameworks: ['vitest'],
      coverageThreshold: {
        lines: 80,
        functions: 80,
        branches: 70,
        statements: 80,
      },
    },
    integration: {
      systemCompatibility: {
        nodeVersions: ['18.x', '20.x', '22.x'],
        operatingSystems: ['linux', 'darwin', 'win32'],
      },
    },
    monitoring: {
      enabled: true,
      watchPatterns: ['**/*.ts', '**/*.js', '**/*.json'],
    },
    reporting: {
      formats: [ReportFormat.JSON, ReportFormat.HTML],
      outputDirectory: './validation-reports',
    },
  });
}
//# sourceMappingURL=index.js.map
