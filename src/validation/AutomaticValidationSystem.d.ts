/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Comprehensive automatic validation system for task completion quality assurance.
 *
 * This system implements enterprise-grade validation with:
 * - Multiple quality gate types for different task categories
 * - Automated evidence collection and reporting
 * - Integration with existing CI/CD pipelines
 * - Configurable validation rules and thresholds
 */
export declare class AutomaticValidationSystem {
    private readonly projectRoot;
    private readonly validationConfig;
    private readonly logger;
    private readonly evidenceCollector;
    constructor(projectRoot: string, config?: Partial<ValidationConfig>, logger?: ValidationLogger);
    /**
     * Execute comprehensive validation for task completion.
     *
     * @param taskType - Type of task being validated
     * @param validationContext - Additional context for validation
     * @returns Promise resolving to validation result with detailed evidence
     */
    validateTaskCompletion(taskType: TaskType, validationContext?: ValidationContext): Promise<ValidationResult>;
    /**
     * Execute quality gates based on task type with comprehensive coverage.
     */
    private executeQualityGates;
    /**
     * Execute individual quality gate with timeout and error handling.
     */
    private executeQualityGate;
    /**
     * Get quality gate definitions for specific task type.
     */
    private getQualityGatesForTaskType;
    /**
     * Get task-specific quality gates with comprehensive coverage.
     */
    private getTaskSpecificGates;
    /**
     * Create gate executor for specific gate type.
     */
    private createGateExecutor;
    /**
     * Execute function with timeout protection.
     */
    private executeWithTimeout;
    /**
     * Determine overall validation result from individual gate results.
     */
    private determineOverallResult;
    /**
     * Generate comprehensive validation report.
     */
    private generateValidationReport;
    /**
     * Generate validation summary for quick overview.
     */
    private generateValidationSummary;
    /**
     * Generate detailed validation summary with insights.
     */
    private generateDetailedSummary;
    /**
     * Generate actionable recommendations based on validation results.
     */
    private generateRecommendations;
    /**
     * Generate specific action items for failed quality gate.
     */
    private generateActionItemsForGate;
    /**
     * Estimate effort required to fix gate issues.
     */
    private estimateEffortForGate;
    /**
     * Calculate comprehensive validation metrics.
     */
    private calculateValidationMetrics;
    /**
     * Calculate gate type distribution statistics.
     */
    private calculateGateTypeDistribution;
    /**
     * Calculate severity distribution statistics.
     */
    private calculateSeverityDistribution;
    /**
     * Calculate performance-related metrics.
     */
    private calculatePerformanceMetrics;
    /**
     * Calculate median value from sorted array.
     */
    private calculateMedian;
    /**
     * Calculate percentile value from sorted array.
     */
    private calculatePercentile;
    /**
     * Generate report artifacts for external consumption.
     */
    private generateReportArtifacts;
    /**
     * Generate human-readable validation summary.
     */
    private generateHumanReadableSummary;
    /**
     * Create error report for system failures.
     */
    private createErrorReport;
    /**
     * Generate unique session identifier.
     */
    private generateSessionId;
}
export declare enum TaskType {
    FEATURE_IMPLEMENTATION = "feature_implementation",
    BUG_FIX = "bug_fix",
    REFACTORING = "refactoring",
    TESTING = "testing",
    DOCUMENTATION = "documentation",
    CONFIGURATION = "configuration",
    UNKNOWN = "unknown"
}
export declare enum ValidationStatus {
    PASSED = "passed",
    FAILED = "failed",
    PASSED_WITH_WARNINGS = "passed_with_warnings",
    SKIPPED = "skipped"
}
export declare enum GateType {
    LINTING = "linting",
    TYPE_CHECKING = "type_checking",
    BUILD = "build",
    UNIT_TESTS = "unit_tests",
    INTEGRATION_TESTS = "integration_tests",
    SECURITY_SCAN = "security_scan",
    PERFORMANCE = "performance",
    GIT_STATUS = "git_status",
    FILE_INTEGRITY = "file_integrity",
    REGRESSION_TESTS = "regression_tests",
    FULL_TEST_SUITE = "full_test_suite",
    TEST_SYNTAX = "test_syntax",
    TEST_EXECUTION = "test_execution",
    COVERAGE = "coverage",
    MARKDOWN_LINT = "markdown_lint",
    LINK_CHECK = "link_check",
    SPELL_CHECK = "spell_check"
}
export declare enum GateSeverity {
    ERROR = "error",
    WARNING = "warning",
    INFO = "info"
}
export interface ValidationContext {
    changedFiles?: string[];
    affectedComponents?: string[];
    customGates?: string[];
    skipGates?: string[];
    [key: string]: unknown;
}
export interface ValidationConfig {
    maxConcurrentGates: number;
    defaultGateTimeoutMs: number;
    slowGateThresholdMs: number;
    enableEvidence: boolean;
    evidenceRetentionDays: number;
    reportFormats: string[];
}
export interface QualityGateDefinition {
    name: string;
    type: GateType;
    description: string;
    severity: GateSeverity;
    timeoutMs?: number;
    config?: Record<string, unknown>;
}
export interface QualityGateResult {
    gateName: string;
    gateType: GateType;
    passed: boolean;
    status: ValidationStatus;
    message: string;
    details: Record<string, unknown>;
    evidence: string[];
    executionTime: number;
    timestamp: Date;
    severity: GateSeverity;
}
export interface ValidationResult {
    sessionId: string;
    taskType: TaskType;
    status: ValidationStatus;
    passed: boolean;
    qualityGateResults: QualityGateResult[];
    evidence: Map<string, ValidationEvidence>;
    report: ValidationReport;
    executionTime: number;
    timestamp: Date;
    summary: string;
}
export interface ValidationEvidence {
    id: string;
    type: EvidenceType;
    name: string;
    content: string;
    timestamp: Date;
    metadata: Record<string, unknown>;
}
export declare enum EvidenceType {
    COMMAND_OUTPUT = "command_output",
    FILE_CONTENT = "file_content",
    SCREENSHOT = "screenshot",
    LOG_ENTRY = "log_entry",
    METRIC = "metric"
}
export interface ValidationReport {
    id: string;
    sessionId: string;
    taskType: TaskType;
    timestamp: Date;
    summary: ValidationSummary;
    gateResults: QualityGateResult[];
    evidence: ValidationEvidence[];
    recommendations: ValidationRecommendation[];
    metrics: ValidationMetrics;
    artifacts: ValidationArtifact[];
}
export interface ValidationSummary {
    totalGates: number;
    passedGates: number;
    failedGates: number;
    errorGates: number;
    warningGates: number;
    totalExecutionTime: number;
    averageGateTime: number;
    slowestGate: QualityGateResult;
    failureRate: number;
}
export interface ValidationRecommendation {
    type: RecommendationType;
    priority: 'high' | 'medium' | 'low';
    title: string;
    description: string;
    actionItems: string[];
    estimatedEffort: EffortEstimate;
}
export declare enum RecommendationType {
    ERROR_RESOLUTION = "error_resolution",
    PERFORMANCE_OPTIMIZATION = "performance_optimization",
    PROCESS_IMPROVEMENT = "process_improvement",
    SYSTEM_ERROR = "system_error"
}
export type EffortEstimate = 'low' | 'medium' | 'high';
export interface ValidationMetrics {
    totalExecutionTime: number;
    averageGateExecutionTime: number;
    successRate: number;
    gateTypeDistribution: Record<string, number>;
    severityDistribution: Record<string, number>;
    performanceMetrics: PerformanceMetrics;
}
export interface PerformanceMetrics {
    minExecutionTime: number;
    maxExecutionTime: number;
    medianExecutionTime: number;
    p95ExecutionTime: number;
    slowGatesCount: number;
}
export interface ValidationArtifact {
    type: ArtifactType;
    name: string;
    content: string;
    mimeType: string;
}
export declare enum ArtifactType {
    JSON_REPORT = "json_report",
    SUMMARY_TEXT = "summary_text",
    DETAILED_LOG = "detailed_log"
}
export interface ValidationLogger {
    debug(message: string, meta?: object): void;
    info(message: string, meta?: object): void;
    warn(message: string, meta?: object): void;
    error(message: string, meta?: object): void;
}
