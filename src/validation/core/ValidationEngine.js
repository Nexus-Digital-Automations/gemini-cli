/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Core Validation Engine for autonomous task management system
 * Provides comprehensive task completion validation, quality assessment, and system health monitoring
 *
 * @author Claude Code - Validation Agent
 * @version 1.0.0
 */
import { EventEmitter } from 'node:events';
import { Logger } from '../../utils/logger.js';
import { PerformanceMonitor } from '../monitoring/PerformanceMonitor.js';
import { QualityScorer } from '../assessment/QualityScorer.js';
import { ValidationReporter } from '../reporting/ValidationReporter.js';
/**
 * Validation result severity levels
 */
export let ValidationSeverity = {};
(function (ValidationSeverity) {
    ValidationSeverity["CRITICAL"] = "critical";
    ValidationSeverity["HIGH"] = "high";
    ValidationSeverity["MEDIUM"] = "medium";
    ValidationSeverity["LOW"] = "low";
    ValidationSeverity["INFO"] = "info";
})(ValidationSeverity || (ValidationSeverity = {}));
/**
 * Task completion validation status
 */
export let ValidationStatus = {};
(function (ValidationStatus) {
    ValidationStatus["PENDING"] = "pending";
    ValidationStatus["VALIDATING"] = "validating";
    ValidationStatus["PASSED"] = "passed";
    ValidationStatus["FAILED"] = "failed";
    ValidationStatus["REQUIRES_REVIEW"] = "requires_review";
    ValidationStatus["SKIPPED"] = "skipped";
})(ValidationStatus || (ValidationStatus = {}));
/**
 * Core Validation Engine
 *
 * Orchestrates comprehensive task completion validation with:
 * - Multi-level validation processes
 * - Quality gate enforcement
 * - Performance monitoring
 * - Automated failure recovery
 * - Real-time validation reporting
 */
export class ValidationEngine extends EventEmitter {
    logger;
    performanceMonitor;
    qualityScorer;
    reporter;
    criteria;
    activeValidations;
    constructor() {
        super();
        this.logger = new Logger('ValidationEngine');
        this.performanceMonitor = new PerformanceMonitor();
        this.qualityScorer = new QualityScorer();
        this.reporter = new ValidationReporter();
        this.criteria = new Map();
        this.activeValidations = new Map();
        this.initializeDefaultCriteria();
        this.setupEventHandlers();
    }
    /**
     * Register validation criteria
     */
    registerCriteria(criteria) {
        this.logger.info(`Registering validation criteria: ${criteria.name}`, {
            criteriaId: criteria.id,
            category: criteria.category,
            severity: criteria.severity,
        });
        this.criteria.set(criteria.id, criteria);
        this.emit('criteriaRegistered', criteria);
    }
    /**
     * Validate task completion comprehensively
     */
    async validateTask(context) {
        const startTime = Date.now();
        this.logger.info(`Starting validation for task: ${context.taskId}`, {
            taskType: context.taskType,
            agent: context.agent,
            artifactsCount: context.artifacts.length,
        });
        // Check for concurrent validation
        if (this.activeValidations.has(context.taskId)) {
            this.logger.warn(`Validation already in progress for task: ${context.taskId}`);
            return await this.activeValidations.get(context.taskId);
        }
        const validationPromise = this.executeValidation(context);
        this.activeValidations.set(context.taskId, validationPromise);
        try {
            const report = await validationPromise;
            this.logger.info(`Validation completed for task: ${context.taskId}`, {
                status: report.overallStatus,
                score: report.overallScore,
                duration: Date.now() - startTime,
            });
            this.emit('validationCompleted', report);
            return report;
        }
        catch (error) {
            this.logger.error(`Validation failed for task: ${context.taskId}`, {
                error,
            });
            throw error;
        }
        finally {
            this.activeValidations.delete(context.taskId);
        }
    }
    /**
     * Execute comprehensive validation process
     */
    async executeValidation(context) {
        const results = [];
        const startTime = Date.now();
        this.emit('validationStarted', context);
        // Get applicable criteria for this task type
        const applicableCriteria = this.getApplicableCriteria(context.taskType);
        this.logger.info(`Executing ${applicableCriteria.length} validation criteria`, {
            taskId: context.taskId,
            criteria: applicableCriteria.map((c) => c.name),
        });
        // Execute validation criteria in parallel with concurrency control
        const batchSize = 5; // Prevent overwhelming the system
        for (let i = 0; i < applicableCriteria.length; i += batchSize) {
            const batch = applicableCriteria.slice(i, i + batchSize);
            const batchResults = await Promise.allSettled(batch.map((criteria) => this.executeCriteria(criteria, context)));
            for (const result of batchResults) {
                if (result.status === 'fulfilled') {
                    results.push(result.value);
                }
                else {
                    // Create failure result for crashed criteria
                    results.push({
                        criteriaId: 'unknown',
                        status: ValidationStatus.FAILED,
                        score: 0,
                        severity: ValidationSeverity.CRITICAL,
                        message: 'Validation criteria execution failed',
                        details: result.reason?.message || 'Unknown error',
                        suggestions: ['Review validation criteria implementation'],
                        evidence: [],
                        timestamp: new Date(),
                        duration: 0,
                    });
                }
            }
        }
        // Generate comprehensive report
        const report = this.generateValidationReport(context, results, Date.now() - startTime);
        // Store report for analysis and monitoring
        await this.reporter.storeReport(report);
        return report;
    }
    /**
     * Execute individual validation criteria
     */
    async executeCriteria(criteria, context) {
        const startTime = Date.now();
        this.logger.debug(`Executing validation criteria: ${criteria.name}`, {
            taskId: context.taskId,
            criteriaId: criteria.id,
        });
        try {
            // Execute with timeout and retry logic
            const result = await this.executeWithRetry(criteria.validator, context, criteria.retryCount, criteria.timeout);
            const duration = Date.now() - startTime;
            // Enhance result with metadata
            return {
                ...result,
                criteriaId: criteria.id,
                timestamp: new Date(),
                duration,
            };
        }
        catch (error) {
            this.logger.error(`Validation criteria failed: ${criteria.name}`, {
                taskId: context.taskId,
                criteriaId: criteria.id,
                error,
            });
            return {
                criteriaId: criteria.id,
                status: ValidationStatus.FAILED,
                score: 0,
                severity: criteria.severity,
                message: `Validation criteria execution failed: ${criteria.name}`,
                details: error instanceof Error ? error.message : 'Unknown error',
                suggestions: [
                    'Review validation criteria implementation',
                    'Check system resources',
                ],
                evidence: [],
                timestamp: new Date(),
                duration: Date.now() - startTime,
            };
        }
    }
    /**
     * Execute validation with retry logic and timeout
     */
    async executeWithRetry(validator, context, retryCount, timeout) {
        let lastError = null;
        for (let attempt = 0; attempt <= retryCount; attempt++) {
            try {
                // Execute with timeout
                const result = await Promise.race([
                    validator(context),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('Validation timeout')), timeout)),
                ]);
                return result;
            }
            catch (error) {
                lastError =
                    error instanceof Error
                        ? error
                        : new Error('Unknown validation error');
                if (attempt < retryCount) {
                    this.logger.warn(`Validation attempt ${attempt + 1} failed, retrying...`, {
                        taskId: context.taskId,
                        error: lastError.message,
                    });
                    // Exponential backoff
                    await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 1000));
                }
            }
        }
        throw lastError;
    }
    /**
     * Generate comprehensive validation report
     */
    generateValidationReport(context, results, totalDuration) {
        const summary = this.calculateSummary(results);
        const overallScore = this.qualityScorer.calculateOverallScore(results);
        const overallStatus = this.determineOverallStatus(results);
        const recommendations = this.generateRecommendations(results);
        const performance = this.analyzePerformance(results, totalDuration);
        return {
            taskId: context.taskId,
            overallStatus,
            overallScore,
            results,
            summary,
            performance,
            recommendations,
            timestamp: new Date(),
        };
    }
    /**
     * Calculate validation summary statistics
     */
    calculateSummary(results) {
        return {
            total: results.length,
            passed: results.filter((r) => r.status === ValidationStatus.PASSED)
                .length,
            failed: results.filter((r) => r.status === ValidationStatus.FAILED)
                .length,
            critical: results.filter((r) => r.severity === ValidationSeverity.CRITICAL).length,
            warnings: results.filter((r) => r.severity === ValidationSeverity.HIGH ||
                r.severity === ValidationSeverity.MEDIUM).length,
        };
    }
    /**
     * Determine overall validation status
     */
    determineOverallStatus(results) {
        const failed = results.filter((r) => r.status === ValidationStatus.FAILED);
        const critical = failed.filter((r) => r.severity === ValidationSeverity.CRITICAL);
        if (critical.length > 0) {
            return ValidationStatus.FAILED;
        }
        else if (failed.length > 0) {
            return ValidationStatus.REQUIRES_REVIEW;
        }
        else if (results.some((r) => r.status === ValidationStatus.VALIDATING)) {
            return ValidationStatus.VALIDATING;
        }
        else {
            return ValidationStatus.PASSED;
        }
    }
    /**
     * Generate actionable recommendations
     */
    generateRecommendations(results) {
        const recommendations = [];
        // Collect all suggestions from failed validations
        results
            .filter((r) => r.status === ValidationStatus.FAILED)
            .forEach((r) => recommendations.push(...r.suggestions));
        // Add system-level recommendations
        const failureRate = results.filter((r) => r.status === ValidationStatus.FAILED).length /
            results.length;
        if (failureRate > 0.3) {
            recommendations.push('High failure rate detected - review task complexity and resource allocation');
        }
        return [...new Set(recommendations)]; // Remove duplicates
    }
    /**
     * Analyze validation performance
     */
    analyzePerformance(results, totalDuration) {
        const averageScore = results.reduce((sum, r) => sum + r.score, 0) / results.length;
        const bottlenecks = results
            .filter((r) => r.duration > 10000) // > 10 seconds
            .map((r) => `${r.criteriaId}: ${r.duration}ms`)
            .slice(0, 5); // Top 5 slowest
        return {
            totalDuration,
            averageScore,
            bottlenecks,
        };
    }
    /**
     * Get applicable validation criteria for task type
     */
    getApplicableCriteria(taskType) {
        // Filter criteria based on task type and enabled status
        return Array.from(this.criteria.values())
            .filter((criteria) => criteria.enabled)
            .filter((criteria) => this.isApplicableForTaskType(criteria, taskType));
    }
    /**
     * Check if criteria is applicable for task type
     */
    isApplicableForTaskType(criteria, taskType) {
        // Basic implementation - can be enhanced with more sophisticated rules
        switch (taskType) {
            case 'code_implementation':
                return ['code_quality', 'security', 'performance'].includes(criteria.category);
            case 'testing':
                return ['functionality', 'code_quality'].includes(criteria.category);
            case 'documentation':
                return ['documentation', 'functionality'].includes(criteria.category);
            default:
                return true; // Apply all criteria for unknown task types
        }
    }
    /**
     * Initialize default validation criteria
     */
    initializeDefaultCriteria() {
        // Code quality criteria
        this.registerCriteria({
            id: 'lint_check',
            name: 'Lint Check',
            description: 'Verify code passes linting rules',
            category: 'code_quality',
            severity: ValidationSeverity.HIGH,
            enabled: true,
            timeout: 30000,
            retryCount: 1,
            validator: async (context) => {
                // Implementation in separate validator classes
                throw new Error('Not implemented - delegate to LintValidator');
            },
        });
        this.registerCriteria({
            id: 'build_check',
            name: 'Build Check',
            description: 'Verify project builds successfully',
            category: 'functionality',
            severity: ValidationSeverity.CRITICAL,
            enabled: true,
            timeout: 120000,
            retryCount: 1,
            validator: async (context) => {
                throw new Error('Not implemented - delegate to BuildValidator');
            },
        });
        this.registerCriteria({
            id: 'test_execution',
            name: 'Test Execution',
            description: 'Run and validate test suites',
            category: 'functionality',
            severity: ValidationSeverity.CRITICAL,
            enabled: true,
            timeout: 180000,
            retryCount: 1,
            validator: async (context) => {
                throw new Error('Not implemented - delegate to TestValidator');
            },
        });
        this.registerCriteria({
            id: 'security_scan',
            name: 'Security Scan',
            description: 'Scan for security vulnerabilities',
            category: 'security',
            severity: ValidationSeverity.HIGH,
            enabled: true,
            timeout: 60000,
            retryCount: 1,
            validator: async (context) => {
                throw new Error('Not implemented - delegate to SecurityValidator');
            },
        });
        this.registerCriteria({
            id: 'performance_check',
            name: 'Performance Check',
            description: 'Validate performance benchmarks',
            category: 'performance',
            severity: ValidationSeverity.MEDIUM,
            enabled: true,
            timeout: 90000,
            retryCount: 1,
            validator: async (context) => {
                throw new Error('Not implemented - delegate to PerformanceValidator');
            },
        });
    }
    /**
     * Setup event handlers for monitoring and alerting
     */
    setupEventHandlers() {
        this.on('validationCompleted', (report) => {
            this.performanceMonitor.recordValidation(report);
            if (report.overallStatus === ValidationStatus.FAILED) {
                this.emit('validationFailed', report);
            }
        });
        this.on('validationFailed', (report) => {
            this.logger.error(`Validation failed for task: ${report.taskId}`, {
                score: report.overallScore,
                criticalIssues: report.summary.critical,
                recommendations: report.recommendations,
            });
        });
    }
    /**
     * Get validation engine status and metrics
     */
    getStatus() {
        return {
            activeValidations: this.activeValidations.size,
            registeredCriteria: this.criteria.size,
            enabledCriteria: Array.from(this.criteria.values()).filter((c) => c.enabled).length,
            performanceMetrics: this.performanceMonitor.getMetrics(),
            memoryUsage: process.memoryUsage(),
        };
    }
    /**
     * Shutdown validation engine gracefully
     */
    async shutdown() {
        this.logger.info('Shutting down ValidationEngine...');
        // Wait for active validations to complete
        const activeValidations = Array.from(this.activeValidations.values());
        if (activeValidations.length > 0) {
            this.logger.info(`Waiting for ${activeValidations.length} active validations to complete...`);
            await Promise.allSettled(activeValidations);
        }
        // Clean up resources
        this.criteria.clear();
        this.activeValidations.clear();
        this.logger.info('ValidationEngine shutdown complete');
    }
}
//# sourceMappingURL=ValidationEngine.js.map