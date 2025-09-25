/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { EventEmitter } from 'node:events';
export interface SecurityValidationResult {
    readonly passed: boolean;
    readonly score: number;
    readonly issues: SecurityIssue[];
    readonly recommendations: string[];
    readonly timestamp: Date;
    readonly executionTimeMs: number;
}
export interface SecurityIssue {
    readonly id: string;
    readonly severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
    readonly category: SecurityCategory;
    readonly message: string;
    readonly file?: string;
    readonly line?: number;
    readonly column?: number;
    readonly cwe?: string[];
    readonly owasp?: string[];
    readonly remediation?: string;
}
export type SecurityCategory = 'injection' | 'authentication' | 'encryption' | 'authorization' | 'data-protection' | 'configuration' | 'dependencies' | 'secrets' | 'input-validation' | 'output-encoding';
export interface SecurityValidationOptions {
    readonly includeCategories?: SecurityCategory[];
    readonly excludeCategories?: SecurityCategory[];
    readonly minSeverity?: SecurityIssue['severity'];
    readonly includeTests?: boolean;
    readonly includeDependencies?: boolean;
    readonly customRules?: SecurityRule[];
}
export interface SecurityRule {
    readonly id: string;
    readonly name: string;
    readonly category: SecurityCategory;
    readonly severity: SecurityIssue['severity'];
    readonly pattern: RegExp;
    readonly message: string;
    readonly remediation: string;
    readonly cwe?: string[];
    readonly owasp?: string[];
}
/**
 * Comprehensive security validation system for the Gemini CLI codebase.
 * Provides multi-layered security scanning, vulnerability detection, and compliance checking.
 *
 * Features:
 * - Code security analysis with pattern matching
 * - Dependency vulnerability scanning
 * - Configuration security validation
 * - Secrets detection and prevention
 * - OWASP Top 10 compliance checking
 * - CWE mapping for vulnerabilities
 * - Real-time security monitoring
 */
export declare class SecurityValidator extends EventEmitter {
    private readonly options;
    private readonly builtinRules;
    private readonly logger;
    constructor(options?: SecurityValidationOptions);
    /**
     * Perform comprehensive security validation on a directory or file.
     */
    validatePath(targetPath: string): Promise<SecurityValidationResult>;
    /**
     * Validate all files in a directory recursively.
     */
    private validateDirectory;
    /**
     * Validate a single file for security issues.
     */
    private validateFile;
    /**
     * Apply a security rule to file content.
     */
    private applyRule;
    /**
     * Validate package.json for security issues.
     */
    private validatePackageJson;
    /**
     * Check if a script command is potentially dangerous.
     */
    private isDangerousScript;
    /**
     * Create builtin security rules.
     */
    private createBuiltinRules;
    /**
     * Get rules applicable to a specific file.
     */
    private getApplicableRules;
    /**
     * Filter issues based on configuration.
     */
    private filterIssues;
    /**
     * Calculate security score based on issues found.
     */
    private calculateSecurityScore;
    /**
     * Generate recommendations based on found issues.
     */
    private generateRecommendations;
    /**
     * Get recommendation for a specific security category.
     */
    private getCategoryRecommendation;
    /**
     * Check if a path should be skipped during validation.
     */
    private shouldSkipPath;
    /**
     * Check if a file is a test file.
     */
    private isTestFile;
}
