/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { spawn, SpawnOptionsWithoutStdio } from 'node:child_process';
import { readFile, writeFile, mkdir, access } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { promisify } from 'node:util';
/**
 * Comprehensive automatic validation system for task completion quality assurance.
 *
 * This system implements enterprise-grade validation with:
 * - Multiple quality gate types for different task categories
 * - Automated evidence collection and reporting
 * - Integration with existing CI/CD pipelines
 * - Configurable validation rules and thresholds
 */
export class AutomaticValidationSystem {
    projectRoot;
    validationConfig;
    logger;
    evidenceCollector;
    constructor(projectRoot, config = {}, logger) {
        this.projectRoot = projectRoot;
        this.validationConfig = { ...DEFAULT_VALIDATION_CONFIG, ...config };
        this.logger = logger ?? new ConsoleValidationLogger();
        this.evidenceCollector = new EvidenceCollector(projectRoot, this.logger);
    }
    /**
     * Execute comprehensive validation for task completion.
     *
     * @param taskType - Type of task being validated
     * @param validationContext - Additional context for validation
     * @returns Promise resolving to validation result with detailed evidence
     */
    async validateTaskCompletion(taskType, validationContext = {}) {
        const startTime = Date.now();
        this.logger.info('Starting automatic validation', {
            taskType,
            context: validationContext,
        });
        try {
            // Initialize validation session
            const sessionId = this.generateSessionId();
            const session = new ValidationSession(sessionId, taskType, validationContext);
            // Execute quality gates based on task type
            const qualityGateResults = await this.executeQualityGates(taskType, session);
            // Collect evidence for all validation steps
            const evidence = await this.evidenceCollector.collectEvidence(session, qualityGateResults);
            // Generate comprehensive validation report
            const report = await this.generateValidationReport(session, qualityGateResults, evidence);
            // Determine overall validation result
            const overallResult = this.determineOverallResult(qualityGateResults);
            const executionTime = Date.now() - startTime;
            this.logger.info('Validation completed', {
                sessionId,
                result: overallResult.status,
                executionTime,
                gatesPassed: qualityGateResults.filter((r) => r.passed).length,
                totalGates: qualityGateResults.length,
            });
            return {
                sessionId,
                taskType,
                status: overallResult.status,
                passed: overallResult.passed,
                qualityGateResults,
                evidence,
                report,
                executionTime,
                timestamp: new Date(),
                summary: this.generateValidationSummary(qualityGateResults, overallResult),
            };
        }
        catch (error) {
            const executionTime = Date.now() - startTime;
            this.logger.error('Validation failed with error', {
                error,
                executionTime,
            });
            return {
                sessionId: this.generateSessionId(),
                taskType,
                status: ValidationStatus.FAILED,
                passed: false,
                qualityGateResults: [],
                evidence: new Map(),
                report: this.createErrorReport(error),
                executionTime,
                timestamp: new Date(),
                summary: `Validation system error: ${error.message}`,
            };
        }
    }
    /**
     * Execute quality gates based on task type with comprehensive coverage.
     */
    async executeQualityGates(taskType, session) {
        const gateDefinitions = this.getQualityGatesForTaskType(taskType);
        const results = [];
        this.logger.info('Executing quality gates', {
            sessionId: session.id,
            taskType,
            gateCount: gateDefinitions.length,
        });
        // Execute gates with appropriate concurrency control
        const concurrencyLimit = this.validationConfig.maxConcurrentGates;
        const semaphore = new ValidationSemaphore(concurrencyLimit);
        const gatePromises = gateDefinitions.map(async (gateDef) => {
            await semaphore.acquire();
            try {
                return await this.executeQualityGate(gateDef, session);
            }
            finally {
                semaphore.release();
            }
        });
        const gateResults = await Promise.all(gatePromises);
        results.push(...gateResults);
        return results;
    }
    /**
     * Execute individual quality gate with timeout and error handling.
     */
    async executeQualityGate(gateDef, session) {
        const startTime = Date.now();
        this.logger.debug('Executing quality gate', {
            gate: gateDef.name,
            sessionId: session.id,
        });
        try {
            // Create gate executor based on type
            const executor = this.createGateExecutor(gateDef);
            // Execute with timeout
            const result = await this.executeWithTimeout(() => executor.execute(this.projectRoot, session.context), gateDef.timeoutMs || this.validationConfig.defaultGateTimeoutMs);
            const executionTime = Date.now() - startTime;
            this.logger.debug('Quality gate completed', {
                gate: gateDef.name,
                passed: result.passed,
                executionTime,
            });
            return {
                gateName: gateDef.name,
                gateType: gateDef.type,
                passed: result.passed,
                status: result.passed
                    ? ValidationStatus.PASSED
                    : ValidationStatus.FAILED,
                message: result.message,
                details: result.details || {},
                evidence: result.evidence || [],
                executionTime,
                timestamp: new Date(),
                severity: gateDef.severity || GateSeverity.ERROR,
            };
        }
        catch (error) {
            const executionTime = Date.now() - startTime;
            this.logger.warn('Quality gate execution failed', {
                gate: gateDef.name,
                error: error.message,
                executionTime,
            });
            return {
                gateName: gateDef.name,
                gateType: gateDef.type,
                passed: false,
                status: ValidationStatus.FAILED,
                message: `Gate execution failed: ${error.message}`,
                details: { error: error.stack },
                evidence: [],
                executionTime,
                timestamp: new Date(),
                severity: gateDef.severity || GateSeverity.ERROR,
            };
        }
    }
    /**
     * Get quality gate definitions for specific task type.
     */
    getQualityGatesForTaskType(taskType) {
        const baseGates = [
            {
                name: 'git-status-check',
                type: GateType.GIT_STATUS,
                description: 'Verify clean git status or appropriate staged changes',
                severity: GateSeverity.ERROR,
                timeoutMs: 5000,
            },
            {
                name: 'file-integrity-check',
                type: GateType.FILE_INTEGRITY,
                description: 'Verify file system integrity and expected file changes',
                severity: GateSeverity.WARNING,
                timeoutMs: 10000,
            },
        ];
        const taskSpecificGates = this.getTaskSpecificGates(taskType);
        return [...baseGates, ...taskSpecificGates];
    }
    /**
     * Get task-specific quality gates with comprehensive coverage.
     */
    getTaskSpecificGates(taskType) {
        switch (taskType) {
            case TaskType.FEATURE_IMPLEMENTATION:
                return [
                    {
                        name: 'linter-validation',
                        type: GateType.LINTING,
                        description: 'Run ESLint with zero warnings/errors tolerance',
                        severity: GateSeverity.ERROR,
                        timeoutMs: 30000,
                    },
                    {
                        name: 'type-checking',
                        type: GateType.TYPE_CHECKING,
                        description: 'TypeScript type checking validation',
                        severity: GateSeverity.ERROR,
                        timeoutMs: 45000,
                    },
                    {
                        name: 'build-validation',
                        type: GateType.BUILD,
                        description: 'Verify project builds successfully',
                        severity: GateSeverity.ERROR,
                        timeoutMs: 120000,
                    },
                    {
                        name: 'unit-test-execution',
                        type: GateType.UNIT_TESTS,
                        description: 'Execute unit tests with coverage requirements',
                        severity: GateSeverity.ERROR,
                        timeoutMs: 60000,
                    },
                    {
                        name: 'integration-test-validation',
                        type: GateType.INTEGRATION_TESTS,
                        description: 'Run integration tests for affected components',
                        severity: GateSeverity.WARNING,
                        timeoutMs: 180000,
                    },
                    {
                        name: 'security-scanning',
                        type: GateType.SECURITY_SCAN,
                        description: 'Security vulnerability scanning',
                        severity: GateSeverity.ERROR,
                        timeoutMs: 60000,
                    },
                ];
            case TaskType.BUG_FIX:
                return [
                    {
                        name: 'linter-validation',
                        type: GateType.LINTING,
                        description: 'Lint validation for bug fix changes',
                        severity: GateSeverity.ERROR,
                        timeoutMs: 30000,
                    },
                    {
                        name: 'type-checking',
                        type: GateType.TYPE_CHECKING,
                        description: 'Type checking for affected code',
                        severity: GateSeverity.ERROR,
                        timeoutMs: 30000,
                    },
                    {
                        name: 'regression-testing',
                        type: GateType.REGRESSION_TESTS,
                        description: 'Regression test suite execution',
                        severity: GateSeverity.ERROR,
                        timeoutMs: 90000,
                    },
                    {
                        name: 'affected-component-tests',
                        type: GateType.UNIT_TESTS,
                        description: 'Test affected components comprehensively',
                        severity: GateSeverity.ERROR,
                        timeoutMs: 45000,
                    },
                ];
            case TaskType.REFACTORING:
                return [
                    {
                        name: 'linter-validation',
                        type: GateType.LINTING,
                        description: 'Code style and quality validation',
                        severity: GateSeverity.ERROR,
                        timeoutMs: 45000,
                    },
                    {
                        name: 'type-checking',
                        type: GateType.TYPE_CHECKING,
                        description: 'Comprehensive type validation',
                        severity: GateSeverity.ERROR,
                        timeoutMs: 60000,
                    },
                    {
                        name: 'full-test-suite',
                        type: GateType.FULL_TEST_SUITE,
                        description: 'Complete test suite validation',
                        severity: GateSeverity.ERROR,
                        timeoutMs: 300000,
                    },
                    {
                        name: 'performance-validation',
                        type: GateType.PERFORMANCE,
                        description: 'Performance regression testing',
                        severity: GateSeverity.WARNING,
                        timeoutMs: 180000,
                    },
                ];
            case TaskType.TESTING:
                return [
                    {
                        name: 'test-syntax-validation',
                        type: GateType.TEST_SYNTAX,
                        description: 'Test file syntax and structure validation',
                        severity: GateSeverity.ERROR,
                        timeoutMs: 15000,
                    },
                    {
                        name: 'test-execution',
                        type: GateType.TEST_EXECUTION,
                        description: 'Execute new and existing tests',
                        severity: GateSeverity.ERROR,
                        timeoutMs: 120000,
                    },
                    {
                        name: 'coverage-validation',
                        type: GateType.COVERAGE,
                        description: 'Code coverage threshold validation',
                        severity: GateSeverity.WARNING,
                        timeoutMs: 30000,
                    },
                ];
            case TaskType.DOCUMENTATION:
                return [
                    {
                        name: 'markdown-validation',
                        type: GateType.MARKDOWN_LINT,
                        description: 'Markdown syntax and style validation',
                        severity: GateSeverity.WARNING,
                        timeoutMs: 15000,
                    },
                    {
                        name: 'link-validation',
                        type: GateType.LINK_CHECK,
                        description: 'Validate internal and external links',
                        severity: GateSeverity.WARNING,
                        timeoutMs: 60000,
                    },
                    {
                        name: 'spell-checking',
                        type: GateType.SPELL_CHECK,
                        description: 'Spell checking for documentation',
                        severity: GateSeverity.WARNING,
                        timeoutMs: 30000,
                    },
                ];
            default:
                return [
                    {
                        name: 'basic-linting',
                        type: GateType.LINTING,
                        description: 'Basic code quality validation',
                        severity: GateSeverity.WARNING,
                        timeoutMs: 30000,
                    },
                ];
        }
    }
    /**
     * Create gate executor for specific gate type.
     */
    createGateExecutor(gateDef) {
        switch (gateDef.type) {
            case GateType.LINTING:
                return new LintingGateExecutor(this.logger);
            case GateType.TYPE_CHECKING:
                return new TypeCheckingGateExecutor(this.logger);
            case GateType.BUILD:
                return new BuildGateExecutor(this.logger);
            case GateType.UNIT_TESTS:
                return new UnitTestGateExecutor(this.logger);
            case GateType.INTEGRATION_TESTS:
                return new IntegrationTestGateExecutor(this.logger);
            case GateType.SECURITY_SCAN:
                return new SecurityScanGateExecutor(this.logger);
            case GateType.GIT_STATUS:
                return new GitStatusGateExecutor(this.logger);
            case GateType.FILE_INTEGRITY:
                return new FileIntegrityGateExecutor(this.logger);
            case GateType.PERFORMANCE:
                return new PerformanceGateExecutor(this.logger);
            default:
                throw new Error(`Unsupported gate type: ${gateDef.type}`);
        }
    }
    /**
     * Execute function with timeout protection.
     */
    async executeWithTimeout(fn, timeoutMs) {
        return new Promise((resolve, reject) => {
            const timeoutId = setTimeout(() => {
                reject(new Error(`Operation timed out after ${timeoutMs}ms`));
            }, timeoutMs);
            fn()
                .then(resolve)
                .catch(reject)
                .finally(() => clearTimeout(timeoutId));
        });
    }
    /**
     * Determine overall validation result from individual gate results.
     */
    determineOverallResult(gateResults) {
        const errorGates = gateResults.filter((r) => !r.passed && r.severity === GateSeverity.ERROR);
        const warningGates = gateResults.filter((r) => !r.passed && r.severity === GateSeverity.WARNING);
        if (errorGates.length > 0) {
            return { status: ValidationStatus.FAILED, passed: false };
        }
        if (warningGates.length > 0) {
            return { status: ValidationStatus.PASSED_WITH_WARNINGS, passed: true };
        }
        return { status: ValidationStatus.PASSED, passed: true };
    }
    /**
     * Generate comprehensive validation report.
     */
    async generateValidationReport(session, gateResults, evidence) {
        const reportId = `validation-${session.id}`;
        const timestamp = new Date();
        return {
            id: reportId,
            sessionId: session.id,
            taskType: session.taskType,
            timestamp,
            summary: this.generateDetailedSummary(gateResults),
            gateResults,
            evidence: Array.from(evidence.values()),
            recommendations: this.generateRecommendations(gateResults),
            metrics: this.calculateValidationMetrics(gateResults),
            artifacts: await this.generateReportArtifacts(session, gateResults, evidence),
        };
    }
    /**
     * Generate validation summary for quick overview.
     */
    generateValidationSummary(gateResults, overallResult) {
        const totalGates = gateResults.length;
        const passedGates = gateResults.filter((r) => r.passed).length;
        const errorGates = gateResults.filter((r) => !r.passed && r.severity === GateSeverity.ERROR).length;
        const warningGates = gateResults.filter((r) => !r.passed && r.severity === GateSeverity.WARNING).length;
        return (`Validation ${overallResult.status}: ${passedGates}/${totalGates} gates passed` +
            (errorGates > 0 ? `, ${errorGates} errors` : '') +
            (warningGates > 0 ? `, ${warningGates} warnings` : ''));
    }
    /**
     * Generate detailed validation summary with insights.
     */
    generateDetailedSummary(gateResults) {
        const totalExecutionTime = gateResults.reduce((sum, r) => sum + r.executionTime, 0);
        return {
            totalGates: gateResults.length,
            passedGates: gateResults.filter((r) => r.passed).length,
            failedGates: gateResults.filter((r) => !r.passed).length,
            errorGates: gateResults.filter((r) => !r.passed && r.severity === GateSeverity.ERROR).length,
            warningGates: gateResults.filter((r) => !r.passed && r.severity === GateSeverity.WARNING).length,
            totalExecutionTime,
            averageGateTime: totalExecutionTime / gateResults.length,
            slowestGate: gateResults.reduce((slowest, current) => current.executionTime > slowest.executionTime ? current : slowest),
            failureRate: (gateResults.filter((r) => !r.passed).length / gateResults.length) *
                100,
        };
    }
    /**
     * Generate actionable recommendations based on validation results.
     */
    generateRecommendations(gateResults) {
        const recommendations = [];
        const failedGates = gateResults.filter((r) => !r.passed);
        failedGates.forEach((gate) => {
            recommendations.push({
                type: RecommendationType.ERROR_RESOLUTION,
                priority: gate.severity === GateSeverity.ERROR ? 'high' : 'medium',
                title: `Fix ${gate.gateName} issues`,
                description: gate.message,
                actionItems: this.generateActionItemsForGate(gate),
                estimatedEffort: this.estimateEffortForGate(gate),
            });
        });
        // Add performance recommendations
        const slowGates = gateResults
            .filter((r) => r.executionTime > this.validationConfig.slowGateThresholdMs)
            .sort((a, b) => b.executionTime - a.executionTime);
        if (slowGates.length > 0) {
            recommendations.push({
                type: RecommendationType.PERFORMANCE_OPTIMIZATION,
                priority: 'low',
                title: 'Optimize slow validation gates',
                description: `${slowGates.length} gates are running slower than expected`,
                actionItems: slowGates.map((gate) => `Optimize ${gate.gateName} (${gate.executionTime}ms)`),
                estimatedEffort: 'medium',
            });
        }
        return recommendations;
    }
    /**
     * Generate specific action items for failed quality gate.
     */
    generateActionItemsForGate(gate) {
        const baseActions = [];
        switch (gate.gateType) {
            case GateType.LINTING:
                return [
                    'Run `npm run lint:fix` to auto-fix lint issues',
                    'Review remaining lint errors and fix manually',
                    'Consider updating lint rules if patterns persist',
                ];
            case GateType.TYPE_CHECKING:
                return [
                    'Run `npm run typecheck` to see detailed type errors',
                    'Fix type mismatches and missing type definitions',
                    'Add proper type annotations where needed',
                ];
            case GateType.BUILD:
                return [
                    'Run `npm run build` to see build errors',
                    'Fix compilation errors and missing dependencies',
                    'Verify all imports and exports are correct',
                ];
            case GateType.UNIT_TESTS:
                return [
                    'Run `npm test` to see test failures',
                    'Fix failing test cases',
                    'Update test expectations if behavior changed intentionally',
                ];
            case GateType.SECURITY_SCAN:
                return [
                    'Review security scan output for vulnerabilities',
                    'Update vulnerable dependencies',
                    'Fix identified security issues in code',
                ];
            default:
                return [`Review ${gate.gateName} output and address issues`];
        }
    }
    /**
     * Estimate effort required to fix gate issues.
     */
    estimateEffortForGate(gate) {
        // Base estimation on gate type and failure details
        switch (gate.gateType) {
            case GateType.LINTING:
                return 'low'; // Usually auto-fixable
            case GateType.TYPE_CHECKING:
                return 'medium'; // Requires understanding of types
            case GateType.BUILD:
                return 'high'; // Can involve complex dependency issues
            case GateType.SECURITY_SCAN:
                return 'high'; // Security issues require careful analysis
            default:
                return 'medium';
        }
    }
    /**
     * Calculate comprehensive validation metrics.
     */
    calculateValidationMetrics(gateResults) {
        const totalTime = gateResults.reduce((sum, r) => sum + r.executionTime, 0);
        const successRate = (gateResults.filter((r) => r.passed).length / gateResults.length) * 100;
        return {
            totalExecutionTime: totalTime,
            averageGateExecutionTime: totalTime / gateResults.length,
            successRate,
            gateTypeDistribution: this.calculateGateTypeDistribution(gateResults),
            severityDistribution: this.calculateSeverityDistribution(gateResults),
            performanceMetrics: this.calculatePerformanceMetrics(gateResults),
        };
    }
    /**
     * Calculate gate type distribution statistics.
     */
    calculateGateTypeDistribution(gateResults) {
        const distribution = {};
        gateResults.forEach((gate) => {
            distribution[gate.gateType] = (distribution[gate.gateType] || 0) + 1;
        });
        return distribution;
    }
    /**
     * Calculate severity distribution statistics.
     */
    calculateSeverityDistribution(gateResults) {
        const distribution = {};
        gateResults.forEach((gate) => {
            const severity = gate.severity.toString();
            distribution[severity] = (distribution[severity] || 0) + 1;
        });
        return distribution;
    }
    /**
     * Calculate performance-related metrics.
     */
    calculatePerformanceMetrics(gateResults) {
        const executionTimes = gateResults.map((r) => r.executionTime);
        const sortedTimes = executionTimes.sort((a, b) => a - b);
        return {
            minExecutionTime: Math.min(...executionTimes),
            maxExecutionTime: Math.max(...executionTimes),
            medianExecutionTime: this.calculateMedian(sortedTimes),
            p95ExecutionTime: this.calculatePercentile(sortedTimes, 95),
            slowGatesCount: gateResults.filter((r) => r.executionTime > this.validationConfig.slowGateThresholdMs).length,
        };
    }
    /**
     * Calculate median value from sorted array.
     */
    calculateMedian(sortedArray) {
        const mid = Math.floor(sortedArray.length / 2);
        return sortedArray.length % 2 === 0
            ? (sortedArray[mid - 1] + sortedArray[mid]) / 2
            : sortedArray[mid];
    }
    /**
     * Calculate percentile value from sorted array.
     */
    calculatePercentile(sortedArray, percentile) {
        const index = Math.ceil((percentile / 100) * sortedArray.length) - 1;
        return sortedArray[Math.max(0, Math.min(index, sortedArray.length - 1))];
    }
    /**
     * Generate report artifacts for external consumption.
     */
    async generateReportArtifacts(session, gateResults, evidence) {
        const artifacts = [];
        // Generate JSON report
        const jsonReport = {
            sessionId: session.id,
            timestamp: new Date().toISOString(),
            gateResults,
            evidence: Array.from(evidence.values()),
        };
        artifacts.push({
            type: ArtifactType.JSON_REPORT,
            name: `validation-${session.id}.json`,
            content: JSON.stringify(jsonReport, null, 2),
            mimeType: 'application/json',
        });
        // Generate human-readable summary
        const summary = this.generateHumanReadableSummary(session, gateResults);
        artifacts.push({
            type: ArtifactType.SUMMARY_TEXT,
            name: `validation-${session.id}-summary.txt`,
            content: summary,
            mimeType: 'text/plain',
        });
        return artifacts;
    }
    /**
     * Generate human-readable validation summary.
     */
    generateHumanReadableSummary(session, gateResults) {
        const lines = [];
        lines.push('='.repeat(60));
        lines.push(`AUTOMATIC VALIDATION REPORT`);
        lines.push(`Session: ${session.id}`);
        lines.push(`Task Type: ${session.taskType}`);
        lines.push(`Timestamp: ${new Date().toISOString()}`);
        lines.push('='.repeat(60));
        lines.push('');
        // Overall status
        const overallResult = this.determineOverallResult(gateResults);
        lines.push(`Overall Status: ${overallResult.status}`);
        lines.push(`Gates Passed: ${gateResults.filter((r) => r.passed).length}/${gateResults.length}`);
        lines.push('');
        // Gate details
        lines.push('Quality Gate Results:');
        lines.push('-'.repeat(40));
        gateResults.forEach((gate) => {
            const status = gate.passed ? '✅ PASS' : '❌ FAIL';
            lines.push(`${status} ${gate.gateName} (${gate.executionTime}ms)`);
            if (!gate.passed) {
                lines.push(`    ${gate.message}`);
            }
        });
        return lines.join('\n');
    }
    /**
     * Create error report for system failures.
     */
    createErrorReport(error) {
        return {
            id: `error-${Date.now()}`,
            sessionId: 'unknown',
            taskType: TaskType.UNKNOWN,
            timestamp: new Date(),
            summary: {
                totalGates: 0,
                passedGates: 0,
                failedGates: 0,
                errorGates: 0,
                warningGates: 0,
                totalExecutionTime: 0,
                averageGateTime: 0,
                slowestGate: null,
                failureRate: 100,
            },
            gateResults: [],
            evidence: [],
            recommendations: [
                {
                    type: RecommendationType.SYSTEM_ERROR,
                    priority: 'high',
                    title: 'Fix validation system error',
                    description: error.message,
                    actionItems: [
                        'Check system logs',
                        'Verify environment configuration',
                    ],
                    estimatedEffort: 'high',
                },
            ],
            metrics: {
                totalExecutionTime: 0,
                averageGateExecutionTime: 0,
                successRate: 0,
                gateTypeDistribution: {},
                severityDistribution: {},
                performanceMetrics: {
                    minExecutionTime: 0,
                    maxExecutionTime: 0,
                    medianExecutionTime: 0,
                    p95ExecutionTime: 0,
                    slowGatesCount: 0,
                },
            },
            artifacts: [],
        };
    }
    /**
     * Generate unique session identifier.
     */
    generateSessionId() {
        return `vs-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
}
// Type definitions for the validation system
export var TaskType;
(function (TaskType) {
    TaskType["FEATURE_IMPLEMENTATION"] = "feature_implementation";
    TaskType["BUG_FIX"] = "bug_fix";
    TaskType["REFACTORING"] = "refactoring";
    TaskType["TESTING"] = "testing";
    TaskType["DOCUMENTATION"] = "documentation";
    TaskType["CONFIGURATION"] = "configuration";
    TaskType["UNKNOWN"] = "unknown";
})(TaskType || (TaskType = {}));
export var ValidationStatus;
(function (ValidationStatus) {
    ValidationStatus["PASSED"] = "passed";
    ValidationStatus["FAILED"] = "failed";
    ValidationStatus["PASSED_WITH_WARNINGS"] = "passed_with_warnings";
    ValidationStatus["SKIPPED"] = "skipped";
})(ValidationStatus || (ValidationStatus = {}));
export var GateType;
(function (GateType) {
    GateType["LINTING"] = "linting";
    GateType["TYPE_CHECKING"] = "type_checking";
    GateType["BUILD"] = "build";
    GateType["UNIT_TESTS"] = "unit_tests";
    GateType["INTEGRATION_TESTS"] = "integration_tests";
    GateType["SECURITY_SCAN"] = "security_scan";
    GateType["PERFORMANCE"] = "performance";
    GateType["GIT_STATUS"] = "git_status";
    GateType["FILE_INTEGRITY"] = "file_integrity";
    GateType["REGRESSION_TESTS"] = "regression_tests";
    GateType["FULL_TEST_SUITE"] = "full_test_suite";
    GateType["TEST_SYNTAX"] = "test_syntax";
    GateType["TEST_EXECUTION"] = "test_execution";
    GateType["COVERAGE"] = "coverage";
    GateType["MARKDOWN_LINT"] = "markdown_lint";
    GateType["LINK_CHECK"] = "link_check";
    GateType["SPELL_CHECK"] = "spell_check";
})(GateType || (GateType = {}));
export var GateSeverity;
(function (GateSeverity) {
    GateSeverity["ERROR"] = "error";
    GateSeverity["WARNING"] = "warning";
    GateSeverity["INFO"] = "info";
})(GateSeverity || (GateSeverity = {}));
const DEFAULT_VALIDATION_CONFIG = {
    maxConcurrentGates: 5,
    defaultGateTimeoutMs: 60000, // 1 minute
    slowGateThresholdMs: 30000, // 30 seconds
    enableEvidence: true,
    evidenceRetentionDays: 30,
    reportFormats: ['json', 'text'],
};
export var EvidenceType;
(function (EvidenceType) {
    EvidenceType["COMMAND_OUTPUT"] = "command_output";
    EvidenceType["FILE_CONTENT"] = "file_content";
    EvidenceType["SCREENSHOT"] = "screenshot";
    EvidenceType["LOG_ENTRY"] = "log_entry";
    EvidenceType["METRIC"] = "metric";
})(EvidenceType || (EvidenceType = {}));
export var RecommendationType;
(function (RecommendationType) {
    RecommendationType["ERROR_RESOLUTION"] = "error_resolution";
    RecommendationType["PERFORMANCE_OPTIMIZATION"] = "performance_optimization";
    RecommendationType["PROCESS_IMPROVEMENT"] = "process_improvement";
    RecommendationType["SYSTEM_ERROR"] = "system_error";
})(RecommendationType || (RecommendationType = {}));
export var ArtifactType;
(function (ArtifactType) {
    ArtifactType["JSON_REPORT"] = "json_report";
    ArtifactType["SUMMARY_TEXT"] = "summary_text";
    ArtifactType["DETAILED_LOG"] = "detailed_log";
})(ArtifactType || (ArtifactType = {}));
// Internal classes for validation system
class ValidationSession {
    id;
    taskType;
    context;
    startTime;
    constructor(id, taskType, context, startTime = new Date()) {
        this.id = id;
        this.taskType = taskType;
        this.context = context;
        this.startTime = startTime;
    }
}
class ValidationSemaphore {
    permits;
    waitQueue = [];
    constructor(permits) {
        this.permits = permits;
    }
    async acquire() {
        if (this.permits > 0) {
            this.permits--;
            return;
        }
        return new Promise((resolve) => {
            this.waitQueue.push(resolve);
        });
    }
    release() {
        if (this.waitQueue.length > 0) {
            const next = this.waitQueue.shift();
            next();
        }
        else {
            this.permits++;
        }
    }
}
// Abstract base class for quality gate executors
class QualityGateExecutor {
    logger;
    constructor(logger) {
        this.logger = logger;
    }
    async executeCommand(command, args, options = {}) {
        return new Promise((resolve, reject) => {
            const child = spawn(command, args, {
                ...options,
                stdio: ['ignore', 'pipe', 'pipe'],
            });
            let stdout = '';
            let stderr = '';
            child.stdout?.on('data', (data) => {
                stdout += data.toString();
            });
            child.stderr?.on('data', (data) => {
                stderr += data.toString();
            });
            child.on('close', (code) => {
                resolve({
                    exitCode: code || 0,
                    stdout: stdout.trim(),
                    stderr: stderr.trim(),
                });
            });
            child.on('error', (error) => {
                reject(error);
            });
        });
    }
}
// Specific gate executor implementations
class LintingGateExecutor extends QualityGateExecutor {
    async execute(projectRoot, context) {
        try {
            const result = await this.executeCommand('npm', ['run', 'lint'], {
                cwd: projectRoot,
            });
            if (result.exitCode === 0) {
                return {
                    passed: true,
                    message: 'Linting passed with no issues',
                    details: { stdout: result.stdout },
                };
            }
            else {
                return {
                    passed: false,
                    message: `Linting failed with ${result.exitCode} issues`,
                    details: {
                        exitCode: result.exitCode,
                        stdout: result.stdout,
                        stderr: result.stderr,
                    },
                    evidence: [result.stderr],
                };
            }
        }
        catch (error) {
            return {
                passed: false,
                message: `Linting execution failed: ${error.message}`,
                details: { error: error.stack },
            };
        }
    }
}
class TypeCheckingGateExecutor extends QualityGateExecutor {
    async execute(projectRoot, context) {
        try {
            const result = await this.executeCommand('npm', ['run', 'typecheck'], {
                cwd: projectRoot,
            });
            if (result.exitCode === 0) {
                return {
                    passed: true,
                    message: 'Type checking passed successfully',
                    details: { stdout: result.stdout },
                };
            }
            else {
                return {
                    passed: false,
                    message: 'Type checking found errors',
                    details: {
                        exitCode: result.exitCode,
                        stdout: result.stdout,
                        stderr: result.stderr,
                    },
                    evidence: [result.stderr],
                };
            }
        }
        catch (error) {
            return {
                passed: false,
                message: `Type checking execution failed: ${error.message}`,
                details: { error: error.stack },
            };
        }
    }
}
class BuildGateExecutor extends QualityGateExecutor {
    async execute(projectRoot, context) {
        try {
            const result = await this.executeCommand('npm', ['run', 'build'], {
                cwd: projectRoot,
            });
            if (result.exitCode === 0) {
                return {
                    passed: true,
                    message: 'Build completed successfully',
                    details: { stdout: result.stdout },
                };
            }
            else {
                return {
                    passed: false,
                    message: 'Build failed',
                    details: {
                        exitCode: result.exitCode,
                        stdout: result.stdout,
                        stderr: result.stderr,
                    },
                    evidence: [result.stderr],
                };
            }
        }
        catch (error) {
            return {
                passed: false,
                message: `Build execution failed: ${error.message}`,
                details: { error: error.stack },
            };
        }
    }
}
class UnitTestGateExecutor extends QualityGateExecutor {
    async execute(projectRoot, context) {
        try {
            const result = await this.executeCommand('npm', ['test'], {
                cwd: projectRoot,
            });
            if (result.exitCode === 0) {
                return {
                    passed: true,
                    message: 'Unit tests passed successfully',
                    details: { stdout: result.stdout },
                };
            }
            else {
                return {
                    passed: false,
                    message: 'Unit tests failed',
                    details: {
                        exitCode: result.exitCode,
                        stdout: result.stdout,
                        stderr: result.stderr,
                    },
                    evidence: [result.stderr],
                };
            }
        }
        catch (error) {
            return {
                passed: false,
                message: `Unit test execution failed: ${error.message}`,
                details: { error: error.stack },
            };
        }
    }
}
class IntegrationTestGateExecutor extends QualityGateExecutor {
    async execute(projectRoot, context) {
        try {
            const result = await this.executeCommand('npm', ['run', 'test:integration'], { cwd: projectRoot });
            if (result.exitCode === 0) {
                return {
                    passed: true,
                    message: 'Integration tests passed successfully',
                    details: { stdout: result.stdout },
                };
            }
            else {
                return {
                    passed: false,
                    message: 'Integration tests failed',
                    details: {
                        exitCode: result.exitCode,
                        stdout: result.stdout,
                        stderr: result.stderr,
                    },
                    evidence: [result.stderr],
                };
            }
        }
        catch (error) {
            return {
                passed: false,
                message: `Integration test execution failed: ${error.message}`,
                details: { error: error.stack },
            };
        }
    }
}
class SecurityScanGateExecutor extends QualityGateExecutor {
    async execute(projectRoot, context) {
        try {
            // Try semgrep first, then npm audit as fallback
            const semgrepResult = await this.executeCommand('semgrep', ['--config=p/security-audit', '.'], { cwd: projectRoot });
            if (semgrepResult.exitCode === 0 &&
                !semgrepResult.stdout.includes('findings')) {
                return {
                    passed: true,
                    message: 'Security scan found no vulnerabilities',
                    details: { stdout: semgrepResult.stdout },
                };
            }
            else {
                return {
                    passed: false,
                    message: 'Security scan found potential vulnerabilities',
                    details: {
                        exitCode: semgrepResult.exitCode,
                        stdout: semgrepResult.stdout,
                        stderr: semgrepResult.stderr,
                    },
                    evidence: [semgrepResult.stdout],
                };
            }
        }
        catch (error) {
            // Fallback to npm audit if semgrep is not available
            try {
                const auditResult = await this.executeCommand('npm', ['audit'], {
                    cwd: projectRoot,
                });
                if (auditResult.exitCode === 0) {
                    return {
                        passed: true,
                        message: 'npm audit found no vulnerabilities',
                        details: { stdout: auditResult.stdout },
                    };
                }
                else {
                    return {
                        passed: false,
                        message: 'npm audit found vulnerabilities',
                        details: {
                            exitCode: auditResult.exitCode,
                            stdout: auditResult.stdout,
                            stderr: auditResult.stderr,
                        },
                        evidence: [auditResult.stdout],
                    };
                }
            }
            catch (auditError) {
                return {
                    passed: false,
                    message: `Security scanning tools not available: ${error.message}`,
                    details: { error: error.stack },
                };
            }
        }
    }
}
class GitStatusGateExecutor extends QualityGateExecutor {
    async execute(projectRoot, context) {
        try {
            const result = await this.executeCommand('git', ['status', '--porcelain'], { cwd: projectRoot });
            const changes = result.stdout
                .trim()
                .split('\n')
                .filter((line) => line.trim());
            if (changes.length === 0) {
                return {
                    passed: true,
                    message: 'Git working directory is clean',
                    details: { changes: [] },
                };
            }
            else {
                // Check if changes are appropriately staged
                const staged = changes.filter((line) => line.startsWith('A ') ||
                    line.startsWith('M ') ||
                    line.startsWith('D '));
                const unstaged = changes.filter((line) => line.includes(' M') || line.includes('??'));
                if (staged.length > 0 && unstaged.length === 0) {
                    return {
                        passed: true,
                        message: `Git has ${staged.length} staged changes ready for commit`,
                        details: { stagedChanges: staged },
                    };
                }
                else {
                    return {
                        passed: false,
                        message: `Git has ${unstaged.length} unstaged changes`,
                        details: {
                            stagedChanges: staged,
                            unstagedChanges: unstaged,
                        },
                        evidence: changes,
                    };
                }
            }
        }
        catch (error) {
            return {
                passed: false,
                message: `Git status check failed: ${error.message}`,
                details: { error: error.stack },
            };
        }
    }
}
class FileIntegrityGateExecutor extends QualityGateExecutor {
    async execute(projectRoot, context) {
        try {
            // Check for common file integrity issues
            const issues = [];
            // Check for required files
            const requiredFiles = ['package.json', 'README.md'];
            for (const file of requiredFiles) {
                try {
                    await access(join(projectRoot, file));
                }
                catch {
                    issues.push(`Missing required file: ${file}`);
                }
            }
            // Check for suspicious file patterns
            const result = await this.executeCommand('find', ['.', '-name', '*.tmp', '-o', '-name', '*.bak'], { cwd: projectRoot });
            const suspiciousFiles = result.stdout
                .trim()
                .split('\n')
                .filter((line) => line.trim());
            if (suspiciousFiles.length > 0) {
                issues.push(`Found ${suspiciousFiles.length} temporary/backup files`);
            }
            if (issues.length === 0) {
                return {
                    passed: true,
                    message: 'File integrity check passed',
                    details: {},
                };
            }
            else {
                return {
                    passed: false,
                    message: `File integrity issues found: ${issues.length}`,
                    details: { issues },
                    evidence: issues,
                };
            }
        }
        catch (error) {
            return {
                passed: false,
                message: `File integrity check failed: ${error.message}`,
                details: { error: error.stack },
            };
        }
    }
}
class PerformanceGateExecutor extends QualityGateExecutor {
    async execute(projectRoot, context) {
        try {
            // Run build and measure time as a basic performance check
            const startTime = Date.now();
            const result = await this.executeCommand('npm', ['run', 'build'], {
                cwd: projectRoot,
            });
            const buildTime = Date.now() - startTime;
            // Performance thresholds
            const slowBuildThreshold = 300000; // 5 minutes
            if (result.exitCode === 0) {
                if (buildTime < slowBuildThreshold) {
                    return {
                        passed: true,
                        message: `Build completed in ${buildTime}ms (within performance threshold)`,
                        details: { buildTime, threshold: slowBuildThreshold },
                    };
                }
                else {
                    return {
                        passed: false,
                        message: `Build took ${buildTime}ms (exceeds ${slowBuildThreshold}ms threshold)`,
                        details: { buildTime, threshold: slowBuildThreshold },
                        evidence: [`Slow build: ${buildTime}ms`],
                    };
                }
            }
            else {
                return {
                    passed: false,
                    message: 'Performance check failed due to build failure',
                    details: { exitCode: result.exitCode, stderr: result.stderr },
                };
            }
        }
        catch (error) {
            return {
                passed: false,
                message: `Performance check failed: ${error.message}`,
                details: { error: error.stack },
            };
        }
    }
}
// Evidence collection system
class EvidenceCollector {
    projectRoot;
    logger;
    constructor(projectRoot, logger) {
        this.projectRoot = projectRoot;
        this.logger = logger;
    }
    async collectEvidence(session, gateResults) {
        const evidenceMap = new Map();
        for (const gateResult of gateResults) {
            if (gateResult.evidence && gateResult.evidence.length > 0) {
                for (let i = 0; i < gateResult.evidence.length; i++) {
                    const evidenceId = `${gateResult.gateName}-${i}`;
                    const evidence = {
                        id: evidenceId,
                        type: EvidenceType.COMMAND_OUTPUT,
                        name: `${gateResult.gateName} Output ${i + 1}`,
                        content: gateResult.evidence[i],
                        timestamp: gateResult.timestamp,
                        metadata: {
                            gateType: gateResult.gateType,
                            gateName: gateResult.gateName,
                            sessionId: session.id,
                        },
                    };
                    evidenceMap.set(evidenceId, evidence);
                }
            }
            // Collect additional context evidence
            if (!gateResult.passed) {
                const contextEvidence = await this.collectContextualEvidence(gateResult);
                if (contextEvidence) {
                    evidenceMap.set(contextEvidence.id, contextEvidence);
                }
            }
        }
        return evidenceMap;
    }
    async collectContextualEvidence(gateResult) {
        try {
            // Collect relevant log files or configuration based on gate type
            let content = '';
            let name = '';
            switch (gateResult.gateType) {
                case GateType.LINTING:
                    // Collect eslintrc or similar config
                    try {
                        const configPath = join(this.projectRoot, 'eslint.config.js');
                        content = await readFile(configPath, 'utf-8');
                        name = 'ESLint Configuration';
                    }
                    catch {
                        return null;
                    }
                    break;
                case GateType.BUILD:
                    // Collect build configuration
                    try {
                        const packagePath = join(this.projectRoot, 'package.json');
                        const packageContent = await readFile(packagePath, 'utf-8');
                        const pkg = JSON.parse(packageContent);
                        content = JSON.stringify(pkg.scripts || {}, null, 2);
                        name = 'Build Scripts Configuration';
                    }
                    catch {
                        return null;
                    }
                    break;
                default:
                    return null;
            }
            return {
                id: `context-${gateResult.gateName}`,
                type: EvidenceType.FILE_CONTENT,
                name,
                content,
                timestamp: new Date(),
                metadata: {
                    gateType: gateResult.gateType,
                    gateName: gateResult.gateName,
                    contextType: 'configuration',
                },
            };
        }
        catch (error) {
            this.logger.warn('Failed to collect contextual evidence', {
                gate: gateResult.gateName,
                error: error.message,
            });
            return null;
        }
    }
}
class ConsoleValidationLogger {
    debug(message, meta) {
        console.debug(`[VALIDATION:DEBUG] ${message}`, meta ? JSON.stringify(meta, null, 2) : '');
    }
    info(message, meta) {
        console.info(`[VALIDATION:INFO] ${message}`, meta ? JSON.stringify(meta, null, 2) : '');
    }
    warn(message, meta) {
        console.warn(`[VALIDATION:WARN] ${message}`, meta ? JSON.stringify(meta, null, 2) : '');
    }
    error(message, meta) {
        console.error(`[VALIDATION:ERROR] ${message}`, meta ? JSON.stringify(meta, null, 2) : '');
    }
}
//# sourceMappingURL=AutomaticValidationSystem.js.map