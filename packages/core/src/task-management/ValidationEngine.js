/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { EventEmitter } from 'node:events';
/**
 * Comprehensive automatic task completion validation engine
 */
export class ValidationEngine extends EventEmitter {
    config;
    qualityGates = new Map();
    validationRules = new Map();
    validationHistory = [];
    performanceBenchmarks = new Map();
    securityScans = new Map();
    // Validation state
    activeValidations = new Map();
    recoveryStrategies = new Map();
    // Persistence
    validationResultsPath;
    benchmarkResultsPath;
    securityResultsPath;
    constructor(config) {
        super();
        this.config = config;
        const tempDir = config.storage.getProjectTempDir();
        this.validationResultsPath = path.join(tempDir, 'validation-results.json');
        this.benchmarkResultsPath = path.join(tempDir, 'benchmark-results.json');
        this.securityResultsPath = path.join(tempDir, 'security-results.json');
        // Initialize default quality gates and rules
        this.initializeDefaultQualityGates();
        this.initializeDefaultValidationRules();
        this.initializeDefaultBenchmarks();
        this.initializeDefaultSecurityScans();
        this.initializeRecoveryStrategies();
    }
    /**
     * Validates task completion with all configured quality gates
     */
    async validateTaskCompletion(task, result, metrics) {
        const startTime = Date.now();
        const validationId = `${task.id}_${startTime}`;
        // Check if validation is already in progress
        if (this.activeValidations.has(task.id)) {
            return await this.activeValidations.get(task.id);
        }
        // Start validation
        const validationPromise = this.executeValidation(task, result, metrics);
        this.activeValidations.set(task.id, validationPromise);
        try {
            const validationResult = await validationPromise;
            // Store validation result
            this.validationHistory.push(validationResult);
            this.trimValidationHistory();
            // Persist results
            await this.persistValidationResults();
            // Emit validation events
            this.emit('validationCompleted', validationResult);
            if (!validationResult.passed) {
                this.emit('validationFailed', validationResult);
            }
            return validationResult;
        }
        finally {
            this.activeValidations.delete(task.id);
        }
    }
    /**
     * Executes validation with all applicable quality gates
     */
    async executeValidation(task, result, metrics) {
        const startTime = Date.now();
        const gateResults = [];
        // Get applicable quality gates for this task
        const applicableGates = this.getApplicableQualityGates(task);
        // Create validation context
        const context = {
            task,
            result,
            config: this.config,
            metrics,
            history: this.validationHistory.filter((v) => v.taskId === task.id),
            data: {},
        };
        // Execute quality gates in parallel for non-blocking gates, sequentially for blocking
        const blockingGates = applicableGates.filter((gate) => gate.blocking);
        const nonBlockingGates = applicableGates.filter((gate) => !gate.blocking);
        // Execute blocking gates first (sequentially)
        for (const gate of blockingGates) {
            const gateResult = await this.executeQualityGate(gate, context);
            gateResults.push(gateResult);
            // If blocking gate fails, stop execution
            if (gateResult.status === 'failed' && gate.blocking) {
                break;
            }
        }
        // Execute non-blocking gates in parallel
        if (nonBlockingGates.length > 0) {
            const nonBlockingResults = await Promise.all(nonBlockingGates.map((gate) => this.executeQualityGate(gate, context)));
            gateResults.push(...nonBlockingResults);
        }
        // Calculate overall validation result
        const executionTimeMs = Date.now() - startTime;
        const passed = this.calculateOverallValidationStatus(gateResults);
        const summary = this.calculateValidationSummary(gateResults);
        const recommendations = this.generateRecommendations(gateResults);
        // Attempt automatic recovery if validation failed
        let recoveryAttempted = false;
        let recoveryResults;
        if (!passed && result.success) {
            recoveryAttempted = true;
            recoveryResults = await this.attemptAutomaticRecovery(task, result, gateResults);
        }
        const validationResult = {
            taskId: task.id,
            status: passed ? 'passed' : 'failed',
            passed,
            gateResults,
            executionTimeMs,
            timestamp: new Date(),
            summary,
            recommendations,
            recoveryAttempted,
            recoveryResults,
        };
        return validationResult;
    }
    /**
     * Executes a single quality gate
     */
    async executeQualityGate(gate, context) {
        const startTime = Date.now();
        try {
            // Execute all rules for this gate
            const ruleResults = await Promise.all(gate.rules
                .filter((rule) => rule.enabled)
                .map((rule) => this.executeValidationRule(rule, context)));
            // Determine gate status based on rule results
            const status = this.calculateGateStatus(ruleResults, gate.minimumSeverity);
            const passed = status === 'passed';
            return {
                gate,
                status,
                passed,
                ruleResults,
                executionTimeMs: Date.now() - startTime,
                timestamp: new Date(),
            };
        }
        catch (error) {
            return {
                gate,
                status: 'error',
                passed: false,
                ruleResults: [],
                executionTimeMs: Date.now() - startTime,
                timestamp: new Date(),
                error: {
                    message: error instanceof Error ? error.message : String(error),
                    stack: error instanceof Error ? error.stack : undefined,
                },
            };
        }
    }
    /**
     * Executes a single validation rule
     */
    async executeValidationRule(rule, context) {
        const startTime = Date.now();
        try {
            const result = await Promise.race([
                rule.validator(context.task, context.result, context),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Validation rule timeout')), 30000)),
            ]);
            return {
                ...result,
                executionTimeMs: Date.now() - startTime,
            };
        }
        catch (error) {
            return {
                passed: false,
                status: 'error',
                message: `Rule execution failed: ${error instanceof Error ? error.message : String(error)}`,
                executionTimeMs: Date.now() - startTime,
            };
        }
    }
    /**
     * Gets quality gates applicable to a specific task
     */
    getApplicableQualityGates(task) {
        return Array.from(this.qualityGates.values()).filter((gate) => {
            // Check if gate applies to this task
            if (!gate.applicableTasks) {
                return true; // Apply to all tasks if no restrictions
            }
            const { categories, priorities, tags } = gate.applicableTasks;
            // Check category match
            if (categories && !categories.includes(task.category)) {
                return false;
            }
            // Check priority match
            if (priorities && !priorities.includes(task.priority)) {
                return false;
            }
            // Check tags match
            if (tags && task.metadata.tags) {
                const hasMatchingTag = tags.some((tag) => task.metadata.tags.includes(tag));
                if (!hasMatchingTag) {
                    return false;
                }
            }
            return true;
        });
    }
    /**
     * Calculates overall validation status from gate results
     */
    calculateOverallValidationStatus(gateResults) {
        // All blocking gates must pass
        const blockingGates = gateResults.filter((result) => result.gate.blocking);
        const allBlockingGatesPassed = blockingGates.every((result) => result.passed);
        return allBlockingGatesPassed;
    }
    /**
     * Calculates gate status from rule results
     */
    calculateGateStatus(ruleResults, minimumSeverity) {
        const failedResults = ruleResults.filter((result) => !result.passed);
        if (failedResults.length === 0) {
            return 'passed';
        }
        // Check if any failed results meet the minimum severity threshold
        const severityOrder = [
            'critical',
            'high',
            'medium',
            'low',
            'info',
        ];
        const minSeverityIndex = severityOrder.indexOf(minimumSeverity);
        const criticalFailures = failedResults.some((result) => {
            const rule = ruleResults.find((r) => r === result);
            return (rule &&
                severityOrder.indexOf(rule.status) <=
                    minSeverityIndex);
        });
        if (criticalFailures) {
            return 'failed';
        }
        return 'warning';
    }
    /**
     * Calculates validation summary statistics
     */
    calculateValidationSummary(gateResults) {
        const summary = {
            totalGates: gateResults.length,
            passedGates: 0,
            failedGates: 0,
            warningGates: 0,
            skippedGates: 0,
            criticalViolations: 0,
            highViolations: 0,
            mediumViolations: 0,
            lowViolations: 0,
        };
        for (const gateResult of gateResults) {
            switch (gateResult.status) {
                case 'passed':
                    summary.passedGates++;
                    break;
                case 'failed':
                    summary.failedGates++;
                    break;
                case 'warning':
                    summary.warningGates++;
                    break;
                case 'skipped':
                    summary.skippedGates++;
                    break;
            }
            // Count violations by severity
            for (const ruleResult of gateResult.ruleResults) {
                if (!ruleResult.passed) {
                    const rule = this.validationRules.get(ruleResult.message); // This is simplified
                    if (rule) {
                        switch (rule.severity) {
                            case 'critical':
                                summary.criticalViolations++;
                                break;
                            case 'high':
                                summary.highViolations++;
                                break;
                            case 'medium':
                                summary.mediumViolations++;
                                break;
                            case 'low':
                                summary.lowViolations++;
                                break;
                        }
                    }
                }
            }
        }
        return summary;
    }
    /**
     * Generates recommendations based on validation results
     */
    generateRecommendations(gateResults) {
        const recommendations = [];
        for (const gateResult of gateResults) {
            if (!gateResult.passed) {
                // Add gate-specific recommendations
                switch (gateResult.gate.type) {
                    case 'code_quality':
                        recommendations.push('Review code quality issues and fix linting violations');
                        break;
                    case 'performance':
                        recommendations.push('Optimize performance bottlenecks identified in validation');
                        break;
                    case 'security':
                        recommendations.push('Address security vulnerabilities found during scan');
                        break;
                    case 'functional_testing':
                        recommendations.push('Fix failing tests and ensure proper test coverage');
                        break;
                }
                // Add rule-specific suggestions
                for (const ruleResult of gateResult.ruleResults) {
                    if (ruleResult.suggestions) {
                        recommendations.push(...ruleResult.suggestions);
                    }
                }
            }
        }
        return [...new Set(recommendations)]; // Remove duplicates
    }
    /**
     * Attempts automatic recovery for failed validations
     */
    async attemptAutomaticRecovery(task, result, gateResults) {
        const actions = [];
        let overallSuccess = true;
        const details = [];
        // Attempt recovery for each failed gate
        for (const gateResult of gateResults) {
            if (!gateResult.passed &&
                this.recoveryStrategies.has(gateResult.gate.type)) {
                const recoveryStrategy = this.recoveryStrategies.get(gateResult.gate.type);
                try {
                    const success = await recoveryStrategy(task, result);
                    actions.push(`Attempted recovery for ${gateResult.gate.name}`);
                    if (success) {
                        details.push(`Successfully recovered ${gateResult.gate.name}`);
                    }
                    else {
                        details.push(`Recovery failed for ${gateResult.gate.name}`);
                        overallSuccess = false;
                    }
                }
                catch (error) {
                    details.push(`Recovery error for ${gateResult.gate.name}: ${error}`);
                    overallSuccess = false;
                }
            }
        }
        return {
            success: overallSuccess,
            actions,
            details: details.join('; '),
        };
    }
    /**
     * Adds a custom quality gate
     */
    addQualityGate(gate) {
        this.qualityGates.set(gate.id, gate);
        this.emit('qualityGateAdded', gate);
    }
    /**
     * Adds a custom validation rule
     */
    addValidationRule(rule) {
        this.validationRules.set(rule.id, rule);
        this.emit('validationRuleAdded', rule);
    }
    /**
     * Gets validation history for a task
     */
    getValidationHistory(taskId) {
        return this.validationHistory.filter((result) => result.taskId === taskId);
    }
    /**
     * Gets overall validation statistics
     */
    getValidationStatistics() {
        const total = this.validationHistory.length;
        const passed = this.validationHistory.filter((v) => v.passed).length;
        const successRate = total > 0 ? (passed / total) * 100 : 0;
        const totalExecutionTime = this.validationHistory.reduce((sum, v) => sum + v.executionTimeMs, 0);
        const averageExecutionTime = total > 0 ? totalExecutionTime / total : 0;
        // Calculate gate statistics
        const gateStatistics = {};
        for (const validation of this.validationHistory) {
            for (const gateResult of validation.gateResults) {
                const gateName = gateResult.gate.name;
                if (!gateStatistics[gateName]) {
                    gateStatistics[gateName] = { passed: 0, failed: 0, successRate: 0 };
                }
                if (gateResult.passed) {
                    gateStatistics[gateName].passed++;
                }
                else {
                    gateStatistics[gateName].failed++;
                }
            }
        }
        // Calculate success rates for gates
        for (const gateName in gateStatistics) {
            const stats = gateStatistics[gateName];
            const total = stats.passed + stats.failed;
            stats.successRate = total > 0 ? (stats.passed / total) * 100 : 0;
        }
        return {
            totalValidations: total,
            successRate,
            averageExecutionTime,
            gateStatistics,
        };
    }
    /**
     * Initializes default quality gates
     */
    initializeDefaultQualityGates() {
        // Code Quality Gate
        this.addQualityGate({
            id: 'code_quality_gate',
            name: 'Code Quality Gate',
            type: 'code_quality',
            blocking: true,
            minimumSeverity: 'medium',
            timeoutMs: 60000,
            maxRetries: 2,
            parameters: {
                lintingEnabled: true,
                formattingCheck: true,
                complexityCheck: true,
            },
            rules: [],
        });
        // Performance Gate
        this.addQualityGate({
            id: 'performance_gate',
            name: 'Performance Gate',
            type: 'performance',
            blocking: false,
            minimumSeverity: 'high',
            timeoutMs: 120000,
            maxRetries: 1,
            parameters: {
                benchmarkRequired: true,
                memoryThreshold: 512,
                executionTimeThreshold: 30000,
            },
            rules: [],
        });
        // Security Gate
        this.addQualityGate({
            id: 'security_gate',
            name: 'Security Gate',
            type: 'security',
            blocking: true,
            minimumSeverity: 'critical',
            timeoutMs: 180000,
            maxRetries: 1,
            parameters: {
                sastRequired: true,
                dependencyCheck: true,
                secretsCheck: true,
            },
            rules: [],
        });
    }
    /**
     * Initializes default validation rules
     */
    initializeDefaultValidationRules() {
        // Implementation will be added in the next part
    }
    /**
     * Initializes default performance benchmarks
     */
    initializeDefaultBenchmarks() {
        // Implementation will be added in the next part
    }
    /**
     * Initializes default security scans
     */
    initializeDefaultSecurityScans() {
        // Implementation will be added in the next part
    }
    /**
     * Initializes recovery strategies
     */
    initializeRecoveryStrategies() {
        // Implementation will be added in the next part
    }
    /**
     * Trims validation history to prevent memory issues
     */
    trimValidationHistory() {
        if (this.validationHistory.length > 1000) {
            this.validationHistory.splice(0, this.validationHistory.length - 500);
        }
    }
    /**
     * Persists validation results to disk
     */
    async persistValidationResults() {
        try {
            const data = {
                validationHistory: this.validationHistory.slice(-100),
                statistics: this.getValidationStatistics(),
                lastUpdated: new Date().toISOString(),
            };
            await fs.writeFile(this.validationResultsPath, JSON.stringify(data, null, 2));
        }
        catch (error) {
            console.error('Error persisting validation results:', error);
        }
    }
    /**
     * Shuts down the validation engine
     */
    async shutdown() {
        // Wait for all active validations to complete
        const activeValidations = Array.from(this.activeValidations.values());
        if (activeValidations.length > 0) {
            await Promise.allSettled(activeValidations);
        }
        // Persist final results
        await this.persistValidationResults();
        this.emit('shutdown');
        console.log('ValidationEngine shut down gracefully');
    }
}
//# sourceMappingURL=ValidationEngine.js.map