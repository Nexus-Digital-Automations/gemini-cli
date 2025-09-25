/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { ValidationContext, ValidationResult } from '../core/ValidationEngine.js';
/**
 * Security validation configuration
 */
export interface SecurityValidationConfig {
    enabledScans: {
        dependencyVulnerabilities: boolean;
        staticCodeAnalysis: boolean;
        secretsDetection: boolean;
        licenseCompliance: boolean;
        dockerSecurity: boolean;
    };
    scanTools: {
        npm: boolean;
        yarn: boolean;
        semgrep: boolean;
        bandit: boolean;
        eslintSecurity: boolean;
        gitSecrets: boolean;
        truffleHog: boolean;
    };
    severityThresholds: {
        critical: number;
        high: number;
        medium: number;
        low: number;
    };
    allowedLicenses: string[];
    secretPatterns: string[];
    excludePaths: string[];
    timeout: number;
}
/**
 * Security vulnerability
 */
export interface SecurityVulnerability {
    id: string;
    title: string;
    description: string;
    severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
    category: 'dependency' | 'code' | 'secret' | 'license' | 'docker' | 'config';
    cwe?: string[];
    cvss?: number;
    file?: string;
    line?: number;
    column?: number;
    evidence: string;
    recommendation: string;
    references: string[];
    tool: string;
}
/**
 * Security scan result
 */
export interface SecurityScanResult {
    tool: string;
    success: boolean;
    duration: number;
    vulnerabilities: SecurityVulnerability[];
    summary: {
        critical: number;
        high: number;
        medium: number;
        low: number;
        info: number;
    };
    error?: string;
}
/**
 * Security scan summary
 */
export interface SecuritySummary {
    totalVulnerabilities: number;
    criticalCount: number;
    highCount: number;
    mediumCount: number;
    lowCount: number;
    infoCount: number;
    scanResults: SecurityScanResult[];
    topVulnerabilities: SecurityVulnerability[];
    riskScore: number;
    complianceStatus: 'compliant' | 'non-compliant' | 'unknown';
}
/**
 * Comprehensive security validation system
 *
 * Features:
 * - Multi-tool security scanning
 * - Dependency vulnerability analysis
 * - Static code security analysis
 * - Secrets detection
 * - License compliance checking
 * - Docker security scanning
 * - Security risk scoring
 * - OWASP compliance validation
 */
export declare class SecurityValidator {
    private readonly logger;
    private readonly config;
    constructor(config?: Partial<SecurityValidationConfig>);
    /**
     * Execute comprehensive security validation
     */
    validate(context: ValidationContext): Promise<ValidationResult>;
    /**
     * Execute enabled security scans
     */
    private executeSecurityScans;
    /**
     * Run npm audit for dependency vulnerabilities
     */
    private runNpmAudit;
    /**
     * Parse npm audit results
     */
    private parseNpmAuditResults;
    /**
     * Run yarn audit for dependency vulnerabilities
     */
    private runYarnAudit;
    /**
     * Parse yarn audit results
     */
    private parseYarnAuditResults;
    /**
     * Run ESLint security plugin
     */
    private runESLintSecurity;
    /**
     * Parse ESLint security results
     */
    private parseESLintSecurityResults;
    /**
     * Check if ESLint rule is security-related
     */
    private isSecurityRule;
    /**
     * Run Semgrep static analysis
     */
    private runSemgrep;
    /**
     * Parse Semgrep results
     */
    private parseSemgrepResults;
    /**
     * Run Bandit for Python security analysis
     */
    private runBandit;
    /**
     * Find Python files in project
     */
    private findPythonFiles;
    /**
     * Parse Bandit results
     */
    private parseBanditResults;
    /**
     * Run secrets detection
     */
    private runSecretsDetection;
    /**
     * Get source files for scanning
     */
    private getSourceFiles;
    /**
     * Scan file for secrets
     */
    private scanFileForSecrets;
    /**
     * Detect potential secret in line
     */
    private detectSecret;
    /**
     * Run Git secrets detection
     */
    private runGitSecrets;
    /**
     * Run TruffleHog for secret detection
     */
    private runTruffleHog;
    /**
     * Parse TruffleHog results
     */
    private parseTruffleHogResults;
    /**
     * Run license compliance check
     */
    private runLicenseCheck;
    /**
     * Check license compliance
     */
    private checkLicenseCompliance;
    /**
     * Check if Dockerfiles exist
     */
    private hasDockerfiles;
    /**
     * Run Docker security scanning
     */
    private runDockerSecurity;
    /**
     * Scan Dockerfile for security issues
     */
    private scanDockerfile;
    /**
     * Analyze security results and generate summary
     */
    private analyzeSecurityResults;
    /**
     * Calculate security score
     */
    private calculateSecurityScore;
    /**
     * Determine security validation status
     */
    private determineSecurityStatus;
    /**
     * Determine security validation severity
     */
    private determineSecuritySeverity;
    /**
     * Generate security validation message
     */
    private generateSecurityMessage;
    /**
     * Generate detailed security report
     */
    private generateSecurityDetails;
    /**
     * Generate security improvement suggestions
     */
    private generateSecuritySuggestions;
    /**
     * Create security evidence artifacts
     */
    private createSecurityEvidence;
    /**
     * Helper methods for parsing different severity formats
     */
    private mapSeverity;
    private mapSemgrepSeverity;
    private mapBanditSeverity;
    /**
     * Summarize vulnerabilities by severity
     */
    private summarizeVulnerabilities;
}
