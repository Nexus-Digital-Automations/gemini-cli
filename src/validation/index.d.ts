/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { AutomaticValidationSystem } from './AutomaticValidationSystem.js';
/**
 * Automatic Validation System - Main Export Module
 *
 * This module provides comprehensive automatic task completion validation with:
 * - Enterprise-grade quality gates for different task types
 * - Automated evidence collection and reporting
 * - Integration with existing CI/CD and development workflows
 * - TodoWrite and FEATURES.json integration
 * - Command-line interface for standalone usage
 *
 * @example
 * ```typescript
 * import { validateTaskCompletion, isProjectReadyForCompletion } from './validation';
 *
 * // Basic task validation
 * const result = await validateTaskCompletion(
 *   '/path/to/project',
 *   'Implement user authentication',
 *   'feature'
 * );
 *
 * // Project completion check
 * const isReady = await isProjectReadyForCompletion('/path/to/project');
 * ```
 */
export { AutomaticValidationSystem, TaskType, ValidationStatus, GateType, GateSeverity, ValidationContext, ValidationConfig, ValidationResult, ValidationReport, ValidationEvidence, EvidenceType, ValidationLogger, } from './AutomaticValidationSystem.js';
export { ValidationIntegration, ValidationCLI, ValidationCommand, ValidationCommandArgs, CICDReport, StopAuthorizationRecommendation, createValidationIntegration, createValidationCLI, validateTaskCompletion, isProjectReadyForCompletion, getStopAuthorizationStatus, } from './ValidationIntegration.js';
export { examples } from './examples.js';
/**
 * Factory function to create a fully configured validation system.
 *
 * @param projectRoot - Root directory of the project to validate
 * @param config - Optional configuration overrides
 * @returns Configured AutomaticValidationSystem instance
 *
 * @example
 * ```typescript
 * const validator = createValidationSystem('/path/to/project', {
 *   maxConcurrentGates: 3,
 *   defaultGateTimeoutMs: 30000
 * });
 *
 * const result = await validator.validateTaskCompletion(
 *   TaskType.FEATURE_IMPLEMENTATION,
 *   { taskDescription: 'Add user authentication' }
 * );
 * ```
 */
export declare function createValidationSystem(projectRoot: string, config?: Partial<import('./AutomaticValidationSystem').ValidationConfig>): AutomaticValidationSystem;
/**
 * Quick validation utility for common use cases.
 *
 * @param projectRoot - Root directory of the project
 * @param options - Validation options
 * @returns Promise resolving to validation result
 *
 * @example
 * ```typescript
 * // Quick feature validation
 * const result = await quickValidate('/path/to/project', {
 *   type: 'feature',
 *   description: 'User authentication system'
 * });
 *
 * console.log(result.passed ? 'Ready!' : 'Issues found');
 * ```
 */
export declare function quickValidate(projectRoot: string, options: {
    type: 'feature' | 'bug-fix' | 'refactoring' | 'testing' | 'documentation';
    description: string;
    context?: Record<string, unknown>;
}): Promise<{
    passed: boolean;
    summary: string;
    issues: string[];
}>;
/**
 * Validation system health check utility.
 *
 * @param projectRoot - Root directory of the project
 * @returns Promise resolving to health check result
 *
 * @example
 * ```typescript
 * const health = await validateSystemHealth('/path/to/project');
 * console.log(`System health: ${health.status}`);
 * console.log(`Available tools: ${health.availableTools.length}`);
 * ```
 */
export declare function validateSystemHealth(projectRoot: string): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    availableTools: string[];
    missingTools: string[];
    recommendations: string[];
}>;
/**
 * Default validation configuration for common project types.
 */
export declare const DEFAULT_CONFIGS: {
    /**
     * Configuration optimized for small to medium projects.
     */
    readonly STANDARD: {
        readonly maxConcurrentGates: 3;
        readonly defaultGateTimeoutMs: 60000;
        readonly slowGateThresholdMs: 30000;
        readonly enableEvidence: true;
        readonly evidenceRetentionDays: 7;
    };
    /**
     * Configuration optimized for large, complex projects.
     */
    readonly ENTERPRISE: {
        readonly maxConcurrentGates: 8;
        readonly defaultGateTimeoutMs: 180000;
        readonly slowGateThresholdMs: 60000;
        readonly enableEvidence: true;
        readonly evidenceRetentionDays: 30;
    };
    /**
     * Configuration optimized for CI/CD environments.
     */
    readonly CI_CD: {
        readonly maxConcurrentGates: 10;
        readonly defaultGateTimeoutMs: 300000;
        readonly slowGateThresholdMs: 120000;
        readonly enableEvidence: true;
        readonly evidenceRetentionDays: 14;
    };
    /**
     * Configuration for development/testing environments.
     */
    readonly DEVELOPMENT: {
        readonly maxConcurrentGates: 2;
        readonly defaultGateTimeoutMs: 30000;
        readonly slowGateThresholdMs: 15000;
        readonly enableEvidence: false;
        readonly evidenceRetentionDays: 1;
    };
};
/**
 * Utility to get recommended configuration based on project characteristics.
 *
 * @param projectRoot - Root directory of the project
 * @returns Recommended configuration
 */
export declare function getRecommendedConfig(projectRoot: string): Promise<typeof DEFAULT_CONFIGS.STANDARD>;
/**
 * Version information for the validation system.
 */
export declare const VERSION = "1.0.0";
/**
 * Build information and metadata.
 */
export declare const BUILD_INFO: {
    readonly version: "1.0.0";
    readonly built: string;
    readonly features: readonly ["Multi-task-type validation", "Comprehensive quality gates", "Evidence collection", "CI/CD integration", "TodoWrite integration", "Performance analytics"];
    readonly compatibility: {
        readonly node: ">=20.0.0";
        readonly npm: ">=8.0.0";
        readonly typescript: ">=4.5.0";
    };
};
