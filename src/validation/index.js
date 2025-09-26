/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { AutomaticValidationSystem } from './AutomaticValidationSystem.js';
import { validateTaskCompletion } from './ValidationIntegration.js';
import { spawn } from 'node:child_process';
import { promisify } from 'node:util';
import { readFile, access } from 'node:fs/promises';
import { join } from 'node:path';
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
// Core validation system exports
export { AutomaticValidationSystem, TaskType, ValidationStatus, GateType, GateSeverity, ValidationContext, ValidationConfig, ValidationResult, ValidationReport, ValidationEvidence, EvidenceType, ValidationLogger, } from './AutomaticValidationSystem.js';
// Integration utilities exports
export { ValidationIntegration, ValidationCLI, ValidationCommand, ValidationCommandArgs, CICDReport, StopAuthorizationRecommendation, createValidationIntegration, createValidationCLI, validateTaskCompletion, isProjectReadyForCompletion, getStopAuthorizationStatus, } from './ValidationIntegration.js';
// Re-export examples for documentation and testing
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
export function createValidationSystem(projectRoot, config) {
    // AutomaticValidationSystem already imported at top
    return new AutomaticValidationSystem(projectRoot, config);
}
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
export async function quickValidate(projectRoot, options) {
    // validateTaskCompletion already imported at top
    try {
        const result = await validateTaskCompletion(projectRoot, options.description, options.type);
        return {
            passed: result.passed,
            summary: result.summary,
            issues: result.qualityGateResults
                .filter((gate) => !gate.passed)
                .map((gate) => `${gate.gateName}: ${gate.message}`),
        };
    }
    catch (error) {
        return {
            passed: false,
            summary: `Validation error: ${error.message}`,
            issues: [error.message],
        };
    }
}
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
export async function validateSystemHealth(projectRoot) {
    // spawn and promisify already imported at top
    const execAsync = promisify(spawn);
    const tools = [
        { name: 'npm', command: 'npm', args: ['--version'] },
        { name: 'node', command: 'node', args: ['--version'] },
        { name: 'git', command: 'git', args: ['--version'] },
        { name: 'eslint', command: 'npx', args: ['eslint', '--version'] },
        { name: 'typescript', command: 'npx', args: ['tsc', '--version'] },
    ];
    const availableTools = [];
    const missingTools = [];
    for (const tool of tools) {
        try {
            await execAsync(tool.command, tool.args, { cwd: projectRoot });
            availableTools.push(tool.name);
        }
        catch {
            missingTools.push(tool.name);
        }
    }
    let status;
    const recommendations = [];
    if (availableTools.includes('npm') &&
        availableTools.includes('node') &&
        availableTools.includes('git')) {
        if (missingTools.length === 0) {
            status = 'healthy';
        }
        else {
            status = 'degraded';
            recommendations.push(`Install missing tools: ${missingTools.join(', ')}`);
        }
    }
    else {
        status = 'unhealthy';
        recommendations.push('Critical tools missing: Node.js, npm, or git');
        recommendations.push('Install Node.js LTS and ensure git is available');
    }
    return {
        status,
        availableTools,
        missingTools,
        recommendations,
    };
}
/**
 * Default validation configuration for common project types.
 */
export const DEFAULT_CONFIGS = {
    /**
     * Configuration optimized for small to medium projects.
     */
    STANDARD: {
        maxConcurrentGates: 3,
        defaultGateTimeoutMs: 60000, // 1 minute
        slowGateThresholdMs: 30000, // 30 seconds
        enableEvidence: true,
        evidenceRetentionDays: 7,
    },
    /**
     * Configuration optimized for large, complex projects.
     */
    ENTERPRISE: {
        maxConcurrentGates: 8,
        defaultGateTimeoutMs: 180000, // 3 minutes
        slowGateThresholdMs: 60000, // 1 minute
        enableEvidence: true,
        evidenceRetentionDays: 30,
    },
    /**
     * Configuration optimized for CI/CD environments.
     */
    CI_CD: {
        maxConcurrentGates: 10,
        defaultGateTimeoutMs: 300000, // 5 minutes
        slowGateThresholdMs: 120000, // 2 minutes
        enableEvidence: true,
        evidenceRetentionDays: 14,
    },
    /**
     * Configuration for development/testing environments.
     */
    DEVELOPMENT: {
        maxConcurrentGates: 2,
        defaultGateTimeoutMs: 30000, // 30 seconds
        slowGateThresholdMs: 15000, // 15 seconds
        enableEvidence: false, // Reduced overhead
        evidenceRetentionDays: 1,
    },
};
/**
 * Utility to get recommended configuration based on project characteristics.
 *
 * @param projectRoot - Root directory of the project
 * @returns Recommended configuration
 */
export async function getRecommendedConfig(projectRoot) {
    // readFile, access, and join already imported at top
    try {
        // Check package.json for project size indicators
        const packagePath = join(projectRoot, 'package.json');
        const packageContent = await readFile(packagePath, 'utf-8');
        const pkg = JSON.parse(packageContent);
        const depCount = Object.keys(pkg.dependencies || {}).length +
            Object.keys(pkg.devDependencies || {}).length;
        // Check for monorepo indicators
        const isMonorepo = pkg.workspaces || false;
        // Check for CI configuration
        const hasCIConfig = await Promise.all([
            access(join(projectRoot, '.github/workflows'))
                .then(() => true)
                .catch(() => false),
            access(join(projectRoot, '.gitlab-ci.yml'))
                .then(() => true)
                .catch(() => false),
            access(join(projectRoot, 'Jenkinsfile'))
                .then(() => true)
                .catch(() => false),
        ]).then((results) => results.some(Boolean));
        // Check if running in CI environment
        const isCI = process.env.CI === 'true' ||
            process.env.CONTINUOUS_INTEGRATION === 'true';
        // Determine configuration based on characteristics
        if (isCI || hasCIConfig) {
            return DEFAULT_CONFIGS.CI_CD;
        }
        else if (isMonorepo || depCount > 100) {
            return DEFAULT_CONFIGS.ENTERPRISE;
        }
        else if (depCount < 20) {
            return DEFAULT_CONFIGS.DEVELOPMENT;
        }
        else {
            return DEFAULT_CONFIGS.STANDARD;
        }
    }
    catch {
        // Fallback to standard configuration
        return DEFAULT_CONFIGS.STANDARD;
    }
}
/**
 * Version information for the validation system.
 */
export const VERSION = '1.0.0';
/**
 * Build information and metadata.
 */
export const BUILD_INFO = {
    version: VERSION,
    built: new Date().toISOString(),
    features: [
        'Multi-task-type validation',
        'Comprehensive quality gates',
        'Evidence collection',
        'CI/CD integration',
        'TodoWrite integration',
        'Performance analytics',
    ],
    compatibility: {
        node: '>=20.0.0',
        npm: '>=8.0.0',
        typescript: '>=4.5.0',
    },
};
//# sourceMappingURL=index.js.map