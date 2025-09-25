/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { EventEmitter } from 'node:events';
import { Logger } from '../logger/Logger.js';
/**
 * Validation severity levels for different types of validation failures
 */
export var ValidationSeverity;
(function (ValidationSeverity) {
    ValidationSeverity["INFO"] = "info";
    ValidationSeverity["WARNING"] = "warning";
    ValidationSeverity["ERROR"] = "error";
    ValidationSeverity["CRITICAL"] = "critical";
})(ValidationSeverity || (ValidationSeverity = {}));
/**
 * Validation status for tracking validation states
 */
export var ValidationStatus;
(function (ValidationStatus) {
    ValidationStatus["PENDING"] = "pending";
    ValidationStatus["RUNNING"] = "running";
    ValidationStatus["PASSED"] = "passed";
    ValidationStatus["FAILED"] = "failed";
    ValidationStatus["SKIPPED"] = "skipped";
})(ValidationStatus || (ValidationStatus = {}));
/**
 * Validation rule category for organizing validation types
 */
export var ValidationCategory;
(function (ValidationCategory) {
    ValidationCategory["SYNTAX"] = "syntax";
    ValidationCategory["LOGIC"] = "logic";
    ValidationCategory["SECURITY"] = "security";
    ValidationCategory["PERFORMANCE"] = "performance";
    ValidationCategory["INTEGRATION"] = "integration";
    ValidationCategory["FUNCTIONAL"] = "functional";
    ValidationCategory["BUSINESS"] = "business";
})(ValidationCategory || (ValidationCategory = {}));
/**
 * Core validation framework for automatic task completion validation cycles
 * Provides comprehensive multi-level validation with automated workflows
 */
export class ValidationFramework extends EventEmitter {
    logger;
    rules = new Map();
    activeValidations = new Map();
    config;
    constructor(config = {
        enabledCategories: Object.values(ValidationCategory),
    }) {
        super();
        this.logger = new Logger('ValidationFramework');
        this.config = {
            maxConcurrentValidations: 10,
            timeout: 300000, // 5 minutes
            retries: 3,
            failOnError: true,
            reportingEnabled: true,
            ...config,
        };
        this.logger.info('ValidationFramework initialized', {
            enabledCategories: this.config.enabledCategories,
            maxConcurrent: this.config.maxConcurrentValidations,
        });
    }
    /**
     * Register a validation rule with the framework
     */
    registerRule(rule) {
        this.logger.info(`Registering validation rule: ${rule.id}`, {
            category: rule.category,
            severity: rule.severity,
            enabled: rule.enabled,
        });
        if (this.rules.has(rule.id)) {
            this.logger.warn(`Overriding existing validation rule: ${rule.id}`);
        }
        this.rules.set(rule.id, rule);
    }
    /**
     * Unregister a validation rule
     */
    unregisterRule(ruleId) {
        const removed = this.rules.delete(ruleId);
        if (removed) {
            this.logger.info(`Unregistered validation rule: ${ruleId}`);
        }
        else {
            this.logger.warn(`Attempted to unregister non-existent rule: ${ruleId}`);
        }
        return removed;
    }
    /**
     * Get all registered validation rules
     */
    getRules() {
        return Array.from(this.rules.values());
    }
    /**
     * Get validation rules filtered by category
     */
    getRulesByCategory(category) {
        return this.getRules().filter((rule) => rule.category === category);
    }
    /**
     * Execute validation cycle for a task
     */
    async validateTask(context) {
        const startTime = Date.now();
        const reportId = `validation-${context.taskId}-${Date.now()}`;
        this.logger.info(`Starting validation cycle for task: ${context.taskId}`, {
            reportId,
            enabledCategories: this.config.enabledCategories,
        });
        this.emit('validationStarted', context.taskId);
        try {
            // Check for active validation
            if (this.activeValidations.has(context.taskId)) {
                this.logger.warn(`Validation already running for task: ${context.taskId}`);
                return await this.activeValidations.get(context.taskId);
            }
            // Create validation promise
            const validationPromise = this.executeValidationCycle(context, reportId, startTime);
            this.activeValidations.set(context.taskId, validationPromise);
            const report = await validationPromise;
            this.emit('validationCompleted', report);
            return report;
        }
        catch (error) {
            this.logger.error(`Validation failed for task: ${context.taskId}`, {
                error,
            });
            this.emit('validationFailed', context.taskId, error);
            throw error;
        }
        finally {
            this.activeValidations.delete(context.taskId);
        }
    }
    /**
     * Execute the complete validation cycle
     */
    async executeValidationCycle(context, reportId, startTime) {
        // Get applicable rules
        const applicableRules = this.getApplicableRules(context);
        this.logger.info(`Executing ${applicableRules.length} validation rules`, {
            taskId: context.taskId,
            categories: [...new Set(applicableRules.map((r) => r.category))],
        });
        // Execute rules with dependency resolution
        const results = await this.executeRulesWithDependencies(applicableRules, context);
        // Generate report
        const report = this.generateValidationReport(reportId, context.taskId, startTime, applicableRules, results);
        this.logger.info(`Validation cycle completed for task: ${context.taskId}`, {
            duration: report.duration,
            totalRules: report.totalRules,
            passedRules: report.passedRules,
            failedRules: report.failedRules,
        });
        return report;
    }
    /**
     * Get applicable validation rules for the context
     */
    getApplicableRules(context) {
        return this.getRules().filter((rule) => {
            // Check if rule is enabled
            if (!rule.enabled) {
                return false;
            }
            // Check if category is enabled
            if (!this.config.enabledCategories.includes(rule.category)) {
                return false;
            }
            // Additional context-based filtering could be added here
            return true;
        });
    }
    /**
     * Execute validation rules with proper dependency handling
     */
    async executeRulesWithDependencies(rules, context) {
        const results = [];
        const completedRules = new Set();
        const pendingRules = new Map();
        // Initialize pending rules
        rules.forEach((rule) => pendingRules.set(rule.id, rule));
        // Execute rules in dependency order
        while (pendingRules.size > 0) {
            const readyRules = Array.from(pendingRules.values()).filter((rule) => !rule.dependencies ||
                rule.dependencies.every((dep) => completedRules.has(dep)));
            if (readyRules.length === 0) {
                // Circular dependency or missing dependency
                const remaining = Array.from(pendingRules.keys());
                this.logger.error('Circular or missing dependencies detected', {
                    remaining,
                });
                // Execute remaining rules anyway with warnings
                for (const rule of pendingRules.values()) {
                    const result = await this.executeValidationRule(rule, context);
                    results.push(...result);
                    completedRules.add(rule.id);
                }
                break;
            }
            // Execute ready rules (with concurrency limit)
            const concurrencyLimit = Math.min(readyRules.length, this.config.maxConcurrentValidations || 10);
            const batches = this.createBatches(readyRules, concurrencyLimit);
            for (const batch of batches) {
                const batchResults = await Promise.all(batch.map((rule) => this.executeValidationRule(rule, context)));
                batchResults.forEach((ruleResults, index) => {
                    results.push(...ruleResults);
                    completedRules.add(batch[index].id);
                    pendingRules.delete(batch[index].id);
                });
            }
        }
        return results;
    }
    /**
     * Execute a single validation rule
     */
    async executeValidationRule(rule, context) {
        const startTime = Date.now();
        this.logger.debug(`Executing validation rule: ${rule.id}`, {
            category: rule.category,
            taskId: context.taskId,
        });
        this.emit('ruleStarted', rule.id, context.taskId);
        try {
            // Apply timeout and retry logic
            const results = await this.executeWithRetryAndTimeout(rule.validator, context, rule.timeout || this.config.timeout, rule.retries || this.config.retries);
            // Ensure all results have required fields
            const enrichedResults = results.map((result) => ({
                ...result,
                id: result.id || `${rule.id}-${Date.now()}`,
                category: result.category || rule.category,
                severity: result.severity || rule.severity,
                timestamp: result.timestamp || new Date(),
                duration: result.duration || Date.now() - startTime,
            }));
            enrichedResults.forEach((result) => {
                this.emit('ruleCompleted', result);
            });
            return enrichedResults;
        }
        catch (error) {
            this.logger.error(`Validation rule failed: ${rule.id}`, { error });
            this.emit('ruleFailed', rule.id, error);
            // Return failure result
            return [
                {
                    id: `${rule.id}-error-${Date.now()}`,
                    category: rule.category,
                    severity: ValidationSeverity.ERROR,
                    status: ValidationStatus.FAILED,
                    message: `Rule execution failed: ${error.message}`,
                    details: error.stack,
                    rule: rule.id,
                    timestamp: new Date(),
                    duration: Date.now() - startTime,
                },
            ];
        }
    }
    /**
     * Execute function with retry and timeout logic
     */
    async executeWithRetryAndTimeout(fn, context, timeout, retries) {
        let lastError;
        for (let attempt = 0; attempt <= retries; attempt++) {
            try {
                return await Promise.race([
                    fn(context),
                    new Promise((_, reject) => {
                        setTimeout(() => reject(new Error(`Timeout after ${timeout}ms`)), timeout);
                    }),
                ]);
            }
            catch (error) {
                lastError = error;
                if (attempt < retries) {
                    this.logger.warn(`Validation attempt ${attempt + 1} failed, retrying...`, { error });
                    await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1))); // Exponential backoff
                }
            }
        }
        throw lastError;
    }
    /**
     * Create batches of rules for concurrent execution
     */
    createBatches(items, batchSize) {
        const batches = [];
        for (let i = 0; i < items.length; i += batchSize) {
            batches.push(items.slice(i, i + batchSize));
        }
        return batches;
    }
    /**
     * Generate comprehensive validation report
     */
    generateValidationReport(reportId, taskId, startTime, rules, results) {
        const duration = Date.now() - startTime;
        // Calculate summary statistics
        const summary = {};
        const categoryStats = new Map();
        rules.forEach((rule) => {
            if (!categoryStats.has(rule.category)) {
                categoryStats.set(rule.category, {
                    total: 0,
                    passed: 0,
                    failed: 0,
                    skipped: 0,
                });
            }
            categoryStats.get(rule.category).total++;
        });
        results.forEach((result) => {
            const stats = categoryStats.get(result.category);
            switch (result.status) {
                case ValidationStatus.PASSED:
                    stats.passed++;
                    break;
                case ValidationStatus.FAILED:
                    stats.failed++;
                    break;
                case ValidationStatus.SKIPPED:
                    stats.skipped++;
                    break;
            }
        });
        categoryStats.forEach((stats, category) => {
            summary[category] = stats;
        });
        const totalPassed = results.filter((r) => r.status === ValidationStatus.PASSED).length;
        const totalFailed = results.filter((r) => r.status === ValidationStatus.FAILED).length;
        const totalSkipped = results.filter((r) => r.status === ValidationStatus.SKIPPED).length;
        return {
            id: reportId,
            taskId,
            timestamp: new Date(),
            duration,
            totalRules: rules.length,
            passedRules: totalPassed,
            failedRules: totalFailed,
            skippedRules: totalSkipped,
            results,
            summary,
            metadata: {
                validationFrameworkVersion: '1.0.0',
                executionEnvironment: process.env.NODE_ENV || 'development',
            },
        };
    }
    /**
     * Check if a validation is currently running for a task
     */
    isValidationRunning(taskId) {
        return this.activeValidations.has(taskId);
    }
    /**
     * Cancel a running validation
     */
    async cancelValidation(taskId) {
        if (!this.activeValidations.has(taskId)) {
            return false;
        }
        this.logger.info(`Cancelling validation for task: ${taskId}`);
        this.activeValidations.delete(taskId);
        return true;
    }
    /**
     * Get framework statistics
     */
    getStatistics() {
        return {
            registeredRules: this.rules.size,
            activeValidations: this.activeValidations.size,
            enabledCategories: this.config.enabledCategories,
        };
    }
}
//# sourceMappingURL=ValidationFramework.js.map