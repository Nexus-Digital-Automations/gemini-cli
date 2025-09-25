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
export { ValidationFramework, ValidationSeverity, ValidationStatus, ValidationCategory, type ValidationContext, type ValidationResult, type ValidationReport, type ValidationRule, type ValidationConfig, type ValidationExecutor, } from './ValidationFramework.js';
export { CodeQualityValidator, type CodeQualityConfig, } from './CodeQualityValidator.js';
export { FunctionalValidator, type FunctionalValidationConfig, type BehaviorScenario, } from './FunctionalValidator.js';
export { IntegrationValidator, type IntegrationValidationConfig, type IntegrationTestConfig, type PerformanceBenchmark, type CompatibilityConfig, } from './IntegrationValidator.js';
export { ValidationWorkflow, TaskExecutionStage, type ValidationWorkflowConfig, type TaskExecutionContext, type WorkflowExecutionResult, } from './ValidationWorkflow.js';
export { ValidationFailureHandler, FailureHandlingStrategy, type ValidationFailureHandlerConfig, type RetryConfig, type CircuitBreakerConfig, type EscalationConfig, type FallbackConfig, } from './ValidationFailureHandler.js';
export { ValidationReporting, ReportFormat, AnalyticsPeriod, type ValidationReportingConfig, } from './ValidationReporting.js';
export { ContinuousValidationMonitor, MonitoringTrigger, MonitoringScope, HealthStatus, type ContinuousValidationMonitorConfig, type MonitoringRule, type HealthCheck, type MonitoringAlert, type SystemHealthMetrics, } from './ContinuousValidationMonitor.js';
/**
 * Complete validation system configuration
 */
export interface ValidationSystemConfig {
    codeQuality?: Partial<CodeQualityConfig>;
    functional?: Partial<FunctionalValidationConfig>;
    integration?: Partial<IntegrationValidationConfig>;
    workflow?: Partial<ValidationWorkflowConfig>;
    failureHandling?: Partial<ValidationFailureHandlerConfig>;
    reporting?: Partial<ValidationReportingConfig>;
    monitoring?: Partial<ContinuousValidationMonitorConfig>;
}
/**
 * Complete validation system
 */
export interface ValidationSystem {
    framework: ValidationFramework;
    codeQualityValidator: CodeQualityValidator;
    functionalValidator: FunctionalValidator;
    integrationValidator: IntegrationValidator;
    workflow: ValidationWorkflow;
    failureHandler: ValidationFailureHandler;
    reporting: ValidationReporting;
    monitor: ContinuousValidationMonitor;
}
/**
 * Create a complete validation system with all components integrated
 */
export declare function createValidationSystem(config?: ValidationSystemConfig): Promise<ValidationSystem>;
/**
 * Default validation system factory with common configurations
 */
export declare function createDefaultValidationSystem(): Promise<ValidationSystem>;
import type { CodeQualityConfig } from './CodeQualityValidator.js';
import type { FunctionalValidationConfig } from './FunctionalValidator.js';
import type { IntegrationValidationConfig } from './IntegrationValidator.js';
import type { ValidationWorkflowConfig } from './ValidationWorkflow.js';
import type { ValidationFailureHandlerConfig } from './ValidationFailureHandler.js';
import type { ValidationReportingConfig } from './ValidationReporting.js';
import type { ContinuousValidationMonitorConfig } from './ContinuousValidationMonitor.js';
export type { CodeQualityConfig, FunctionalValidationConfig, IntegrationValidationConfig, ValidationWorkflowConfig, ValidationFailureHandlerConfig, ValidationReportingConfig, ContinuousValidationMonitorConfig, };
