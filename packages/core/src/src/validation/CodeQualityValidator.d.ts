/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { ValidationContext, ValidationResult } from './ValidationFramework.js';
import { ValidationSeverity } from './ValidationFramework.js';
/**
 * Code quality validation configuration
 */
export interface CodeQualityConfig {
    eslintConfigPath?: string;
    prettierConfigPath?: string;
    enabledLinters: string[];
    securityScanners: string[];
    customRules?: Array<{
        id: string;
        pattern: RegExp;
        message: string;
        severity: ValidationSeverity;
    }>;
}
/**
 * Security scan result structure
 */
/**
 * Code quality validation automation system
 * Handles linting, formatting, and security scanning
 */
export declare class CodeQualityValidator {
    private readonly logger;
    private readonly config;
    constructor(config: CodeQualityConfig);
    /**
     * Main validation executor for code quality
     */
    validateCodeQuality(context: ValidationContext): Promise<ValidationResult[]>;
    /**
     * Run ESLint validation
     */
    private runESLint;
    /**
     * Run Prettier validation
     */
    private runPrettier;
    /**
     * Run TypeScript compiler validation
     */
    private runTypeScript;
    /**
     * Run security scanner validation
     */
    private runSecurityScanner;
    /**
     * Run custom validation rules
     */
    private runCustomRules;
    /**
     * Map Semgrep severity to ValidationSeverity
     */
    private mapSemgrepSeverity;
    /**
     * Get supported linters
     */
    getSupportedLinters(): string[];
    /**
     * Get supported security scanners
     */
    getSupportedSecurityScanners(): string[];
}
