/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { EventEmitter } from 'node:events';
export interface SecurityAuditResult {
    readonly auditId: string;
    readonly timestamp: Date;
    readonly target: string;
    readonly auditType: AuditType;
    readonly findings: SecurityFinding[];
    readonly riskLevel: RiskLevel;
    readonly complianceStatus: ComplianceStatus;
    readonly recommendations: AuditRecommendation[];
    readonly executionTimeMs: number;
}
export interface SecurityFinding {
    readonly id: string;
    readonly category: SecurityCategory;
    readonly severity: Severity;
    readonly title: string;
    readonly description: string;
    readonly impact: string;
    readonly likelihood: Likelihood;
    readonly riskScore: number;
    readonly evidence: Evidence[];
    readonly remediation: RemediationPlan;
    readonly compliance: ComplianceMapping[];
}
export interface Evidence {
    readonly type: 'file' | 'log' | 'configuration' | 'dependency' | 'network';
    readonly source: string;
    readonly description: string;
    readonly data: string;
    readonly timestamp: Date;
}
export interface RemediationPlan {
    readonly priority: 'immediate' | 'high' | 'medium' | 'low';
    readonly effort: 'low' | 'medium' | 'high';
    readonly steps: string[];
    readonly timeline: string;
    readonly resources: string[];
}
export interface ComplianceMapping {
    readonly framework: ComplianceFramework;
    readonly controls: string[];
    readonly status: 'compliant' | 'non-compliant' | 'partial' | 'not-applicable';
}
export interface AuditRecommendation {
    readonly id: string;
    readonly category: string;
    readonly priority: 'critical' | 'high' | 'medium' | 'low';
    readonly title: string;
    readonly description: string;
    readonly implementation: string;
    readonly businessJustification: string;
}
export type AuditType = 'comprehensive' | 'targeted' | 'compliance' | 'vulnerability' | 'configuration' | 'dependency' | 'access-control' | 'data-protection';
export type SecurityCategory = 'authentication' | 'authorization' | 'data-protection' | 'encryption' | 'input-validation' | 'injection' | 'configuration' | 'dependencies' | 'secrets' | 'network-security' | 'logging-monitoring';
export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';
export type RiskLevel = 'critical' | 'high' | 'medium' | 'low';
export type Likelihood = 'very-high' | 'high' | 'medium' | 'low' | 'very-low';
export type ComplianceFramework = 'OWASP-ASVS' | 'NIST-CSF' | 'ISO-27001' | 'SOC2' | 'GDPR' | 'CCPA' | 'HIPAA' | 'PCI-DSS';
export type ComplianceStatus = 'compliant' | 'non-compliant' | 'partial' | 'unknown';
export interface SecurityAuditOptions {
    readonly auditType: AuditType;
    readonly includeCategories?: SecurityCategory[];
    readonly excludeCategories?: SecurityCategory[];
    readonly complianceFrameworks?: ComplianceFramework[];
    readonly outputDirectory?: string;
    readonly includeRemediation?: boolean;
    readonly generateReport?: boolean;
}
/**
 * Comprehensive security audit system for enterprise-grade security assessment.
 *
 * Features:
 * - Multi-framework compliance assessment (OWASP, NIST, ISO 27001, SOC2, GDPR, etc.)
 * - Risk-based vulnerability assessment with CVSS scoring
 * - Automated remediation planning with business impact analysis
 * - Detailed audit trails with tamper-proof logging
 * - Executive and technical reporting with actionable insights
 * - Continuous compliance monitoring and alerting
 * - Integration with CI/CD pipelines for DevSecOps
 */
export declare class SecurityAuditor extends EventEmitter {
    private readonly validator;
    private readonly options;
    private readonly auditLogger;
    constructor(options: SecurityAuditOptions);
    /**
     * Conduct a comprehensive security audit.
     */
    conductAudit(target: string): Promise<SecurityAuditResult>;
    /**
     * Analyze security posture and generate detailed findings.
     */
    private analyzeSecurity;
    /**
     * Create a detailed security finding from a validation issue.
     */
    private createSecurityFinding;
    /**
     * Conduct comprehensive security analysis.
     */
    private conductComprehensiveAnalysis;
    /**
     * Analyze dependency security.
     */
    private analyzeDependencies;
    /**
     * Analyze configuration security.
     */
    private analyzeConfiguration;
    /**
     * Analyze data protection measures.
     */
    private analyzeDataProtection;
    /**
     * Placeholder implementations for detailed analysis methods.
     * In a production system, these would contain sophisticated security analysis logic.
     */
    private analyzeArchitecture;
    private analyzeAccessControls;
    private analyzeDataFlow;
    private analyzeThirdPartyIntegrations;
    private checkDependencyVulnerabilities;
    private analyzeConfigurationFile;
    /**
     * Utility methods for finding analysis and scoring.
     */
    private generateFindingTitle;
    private generateImpactDescription;
    private determineLikelihood;
    private calculateRiskScore;
    private gatherEvidence;
    private createRemediationPlan;
    private mapToComplianceFrameworks;
    private calculateOverallRisk;
    private assessCompliance;
    private generateRecommendations;
    private generateAuditReport;
    private generateAuditId;
}
