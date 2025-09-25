/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ValidationContext, ValidationResult } from '../core/ValidationEngine.js';
/**
 * Build artifact interface
 */
export interface BuildArtifact {
    type: string;
    path: string;
}
/**
 * Error with stdout property (from child process)
 */
export interface ChildProcessError extends Error {
    stdout?: string;
    stderr?: string;
    code?: number;
}
/**
 * Lint validation configuration
 */
export interface LintValidationConfig {
    eslintConfigPath?: string;
    prettierConfigPath?: string;
    ignorePatterns?: string[];
    maxWarnings?: number;
    enableTypeCheck?: boolean;
    customRules?: Record<string, unknown>;
}
/**
 * Comprehensive lint validation system
 *
 * Features:
 * - ESLint integration with TypeScript support
 * - Prettier formatting validation
 * - Custom rule configuration
 * - Fixable issue detection
 * - Performance optimization
 * - Detailed error reporting
 */
export declare class LintValidator {
    private readonly logger;
    private readonly config;
    constructor(config?: LintValidationConfig);
    /**
     * Validate code quality using lint tools
     */
    validate(context: ValidationContext): Promise<ValidationResult>;
    /**
     * Check if linting tools are available
     */
    private checkLintToolsAvailable;
    /**
     * Get files to lint from artifacts
     */
    private getFilesToLint;
    /**
     * Check if file path should be ignored
     */
    private isIgnored;
    /**
     * Run ESLint on specified files
     */
    private runESLint;
    /**
     * Run Prettier validation on specified files
     */
    private runPrettier;
    /**
     * Analyze ESLint results and generate summary
     */
    private analyzeLintResults;
    /**
     * Calculate lint score based on results
     */
    private calculateLintScore;
    /**
     * Determine validation status based on lint results
     */
    private determineLintStatus;
    /**
     * Generate lint message
     */
    private generateLintMessage;
    /**
     * Generate detailed lint report
     */
    private generateLintDetails;
    /**
     * Generate lint improvement suggestions
     */
    private generateLintSuggestions;
    /**
     * Run external command and return output
     */
    private runCommand;
}
