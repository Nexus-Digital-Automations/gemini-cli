/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { EventEmitter } from 'node:events';
import { Logger } from '../logger/Logger.js';
import { ValidationFramework, ValidationSeverity, ValidationStatus, ValidationCategory } from './ValidationFramework.js';
import { CodeQualityValidator } from './CodeQualityValidator.js';
import { FunctionalValidator } from './FunctionalValidator.js';
import { IntegrationValidator } from './IntegrationValidator.js';
/**
 * Task execution stage for validation workflow integration
 */
export var TaskExecutionStage;
(function (TaskExecutionStage) {
    TaskExecutionStage["PRE_EXECUTION"] = "pre-execution";
    TaskExecutionStage["POST_EXECUTION"] = "post-execution";
    TaskExecutionStage["ON_FAILURE"] = "on-failure";
    TaskExecutionStage["ON_SUCCESS"] = "on-success";
    TaskExecutionStage["CONTINUOUS"] = "continuous";
})(TaskExecutionStage || (TaskExecutionStage = {}));
/**
 * Validation workflow integration system
 * Orchestrates validation execution across task execution pipelines
 */
export class ValidationWorkflow extends EventEmitter {
    logger;
    validationFramework;
    codeQualityValidator;
    functionalValidator;
    integrationValidator;
    config;
    activeWorkflows = new Map();
    constructor(config) {
        super();
        this.logger = new Logger('ValidationWorkflow');
        this.config = {
            stages: {
                [TaskExecutionStage.PRE_EXECUTION]: {
                    enabled: true,
                    validators: ['codeQuality'],
                    continueOnFailure: false,
                    timeout: 300000
                },
                [TaskExecutionStage.POST_EXECUTION]: {
                    enabled: true,
                    validators: ['functional', 'integration'],
                    continueOnFailure: true,
                    timeout: 600000
                },
                [TaskExecutionStage.ON_FAILURE]: {
                    enabled: true,
                    validators: ['codeQuality'],
                    continueOnFailure: true,
                    timeout: 180000
                },
                [TaskExecutionStage.ON_SUCCESS]: {
                    enabled: true,
                    validators: ['functional'],
                    continueOnFailure: true,
                    timeout: 300000
                },
                [TaskExecutionStage.CONTINUOUS]: {
                    enabled: false,
                    validators: ['codeQuality', 'functional'],
                    continueOnFailure: true,
                    timeout: 120000
                }
            },
            globalConfig: {
                parallelExecution: true,
                maxParallelValidators: 3,
                retryOnFailure: true,
                maxRetries: 2,
                retryDelay: 1000
            },
            reporting: {
                aggregateReports: true,
                persistReports: true,
                reportFormat: 'json'
            },
            notifications: {
                onSuccess: false,
                onFailure: true,
                onWarning: false
            },
            ...config
        };
        // Initialize validation framework and validators
        this.validationFramework = new ValidationFramework({
            enabledCategories: Object.values(ValidationCategory)
        });
        this.codeQualityValidator = new CodeQualityValidator(this.config.validatorConfigs.codeQuality || {
            enabledLinters: ['eslint', 'prettier', 'typescript'],
            securityScanners: ['semgrep']
        });
        this.functionalValidator = new FunctionalValidator(this.config.validatorConfigs.functional || {
            testFrameworks: ['vitest'],
            coverageThreshold: {
                lines: 80,
                functions: 80,
                branches: 70,
                statements: 80
            },
            testPatterns: ['**/*.test.ts', '**/*.spec.ts'],
            behaviorValidation: {
                enabled: true,
                scenarios: []
            },
            performanceThresholds: {
                maxExecutionTime: 30000,
                maxMemoryUsage: 512 * 1024 * 1024
            }
        });
        this.integrationValidator = new IntegrationValidator(this.config.validatorConfigs.integration || {
            systemCompatibility: {
                nodeVersions: ['18.x', '20.x', '22.x'],
                operatingSystems: ['linux', 'darwin', 'win32'],
                architectures: ['x64', 'arm64'],
                dependencies: []
            },
            performanceBenchmarks: [],
            integrationTests: {
                enabled: true,
                testCommand: 'npm run test:integration',
                timeout: 300000
            },
            e2eTests: {
                enabled: true,
                testCommand: 'npm run test:e2e',
                timeout: 600000
            },
            loadTesting: {
                enabled: false,
                concurrent: 10,
                duration: 60000,
                targetRps: 100
            },
            monitoringChecks: {
                healthEndpoints: [],
                resourceLimits: {
                    maxMemory: 1024 * 1024 * 1024,
                    maxCpu: 80,
                    maxDiskUsage: 90
                }
            }
        });
        // Register validation rules
        this.registerValidationRules();
        this.logger.info('ValidationWorkflow initialized', {
            stages: Object.keys(this.config.stages).filter(stage => this.config.stages[stage].enabled),
            parallelExecution: this.config.globalConfig.parallelExecution
        });
    }
    /**
     * Execute validation workflow for a task execution stage
     */
    async executeValidationWorkflow(context) {
        const startTime = Date.now();
        const workflowKey = `${context.taskId}-${context.stage}`;
        this.logger.info(`Starting validation workflow for task: ${context.taskId} at stage: ${context.stage}`);
        // Check if workflow is already running
        if (this.activeWorkflows.has(workflowKey)) {
            this.logger.warn(`Workflow already running for task: ${context.taskId} at stage: ${context.stage}`);
            return await this.activeWorkflows.get(workflowKey);
        }
        // Create workflow execution promise
        const workflowPromise = this.executeWorkflowStage(context, startTime);
        this.activeWorkflows.set(workflowKey, workflowPromise);
        try {
            const result = await workflowPromise;
            this.emit('workflowCompleted', result);
            return result;
        }
        catch (error) {
            this.logger.error(`Validation workflow failed for task: ${context.taskId}`, { error });
            this.emit('workflowFailed', context.taskId, context.stage, error);
            throw error;
        }
        finally {
            this.activeWorkflows.delete(workflowKey);
        }
    }
    /**
     * Execute validation workflow stage
     */
    async executeWorkflowStage(context, startTime) {
        const stageConfig = this.config.stages[context.stage];
        if (!stageConfig.enabled) {
            return this.createSkippedResult(context, startTime);
        }
        const validationReports = [];
        const validators = stageConfig.validators;
        this.logger.debug(`Executing ${validators.length} validators for stage: ${context.stage}`);
        try {
            // Execute validators
            if (this.config.globalConfig.parallelExecution) {
                const reports = await this.executeValidatorsInParallel(validators, context, stageConfig);
                validationReports.push(...reports);
            }
            else {
                const reports = await this.executeValidatorsSequentially(validators, context, stageConfig);
                validationReports.push(...reports);
            }
            // Generate workflow execution result
            const result = this.generateWorkflowResult(context, startTime, validationReports);
            // Handle notifications and reporting
            await this.handleWorkflowCompletion(result);
            return result;
        }
        catch (error) {
            this.logger.error(`Workflow stage ${context.stage} failed`, { error });
            // Create error result
            const errorResult = this.createErrorResult(context, startTime, error);
            // Handle failure notifications
            await this.handleWorkflowFailure(errorResult, error);
            if (!stageConfig.continueOnFailure) {
                throw error;
            }
            return errorResult;
        }
    }
    /**
     * Execute validators in parallel
     */
    async executeValidatorsInParallel(validators, context, stageConfig) {
        const maxParallel = Math.min(validators.length, this.config.globalConfig.maxParallelValidators);
        const batches = this.createBatches(validators, maxParallel);
        const reports = [];
        for (const batch of batches) {
            const batchPromises = batch.map(validator => this.executeValidator(validator, context, stageConfig.timeout));
            const batchReports = await Promise.allSettled(batchPromises);
            for (const result of batchReports) {
                if (result.status === 'fulfilled') {
                    reports.push(result.value);
                }
                else {
                    this.logger.error('Validator execution failed', { error: result.reason });
                    // Create error report
                    reports.push(this.createValidatorErrorReport(context, result.reason));
                }
            }
        }
        return reports;
    }
    /**
     * Execute validators sequentially
     */
    async executeValidatorsSequentially(validators, context, stageConfig) {
        const reports = [];
        for (const validator of validators) {
            try {
                const report = await this.executeValidator(validator, context, stageConfig.timeout);
                reports.push(report);
                // Stop on failure if configured
                if (!stageConfig.continueOnFailure && this.hasFailures(report)) {
                    break;
                }
            }
            catch (error) {
                this.logger.error(`Validator ${validator} failed`, { error });
                reports.push(this.createValidatorErrorReport(context, error));
                if (!stageConfig.continueOnFailure) {
                    throw error;
                }
            }
        }
        return reports;
    }
    /**
     * Execute individual validator
     */
    async executeValidator(validatorName, context, timeout) {
        const validationContext = {
            taskId: context.taskId,
            files: context.taskDetails.files,
            metadata: {
                stage: context.stage,
                executionMetadata: context.executionMetadata,
                taskDetails: context.taskDetails
            },
            previousResults: context.previousResults?.flatMap(report => report.results)
        };
        // Create timeout promise if specified
        const executeWithTimeout = async (validatorPromise) => {
            if (!timeout) {
                return await validatorPromise;
            }
            return await Promise.race([
                validatorPromise,
                new Promise((_, reject) => {
                    setTimeout(() => reject(new Error(`Validator ${validatorName} timed out after ${timeout}ms`)), timeout);
                })
            ]);
        };
        let results;
        switch (validatorName) {
            case 'codeQuality':
                results = await executeWithTimeout(this.codeQualityValidator.validateCodeQuality(validationContext));
                break;
            case 'functional':
                results = await executeWithTimeout(this.functionalValidator.validateFunctionality(validationContext));
                break;
            case 'integration':
                results = await executeWithTimeout(this.integrationValidator.validateIntegration(validationContext));
                break;
            default:
                throw new Error(`Unknown validator: ${validatorName}`);
        }
        // Create validation report
        return {
            id: `${validatorName}-${context.taskId}-${Date.now()}`,
            taskId: context.taskId,
            timestamp: new Date(),
            duration: 0, // Will be calculated by framework
            totalRules: results.length,
            passedRules: results.filter(r => r.status === ValidationStatus.PASSED).length,
            failedRules: results.filter(r => r.status === ValidationStatus.FAILED).length,
            skippedRules: results.filter(r => r.status === ValidationStatus.SKIPPED).length,
            results,
            summary: this.generateSummary(results),
            metadata: {
                validator: validatorName,
                stage: context.stage
            }
        };
    }
    /**
     * Register validation rules with the framework
     */
    registerValidationRules() {
        // Register code quality validation rule
        this.validationFramework.registerRule({
            id: 'code-quality-validation',
            name: 'Code Quality Validation',
            category: ValidationCategory.SYNTAX,
            severity: ValidationSeverity.ERROR,
            enabled: true,
            description: 'Validates code quality using linters and security scanners',
            validator: async (context) => this.codeQualityValidator.validateCodeQuality(context),
            timeout: 300000,
            retries: 2
        });
        // Register functional validation rule
        this.validationFramework.registerRule({
            id: 'functional-validation',
            name: 'Functional Validation',
            category: ValidationCategory.FUNCTIONAL,
            severity: ValidationSeverity.ERROR,
            enabled: true,
            description: 'Validates functionality using tests and behavior verification',
            validator: async (context) => this.functionalValidator.validateFunctionality(context),
            dependencies: ['code-quality-validation'],
            timeout: 600000,
            retries: 1
        });
        // Register integration validation rule
        this.validationFramework.registerRule({
            id: 'integration-validation',
            name: 'Integration Validation',
            category: ValidationCategory.INTEGRATION,
            severity: ValidationSeverity.WARNING,
            enabled: true,
            description: 'Validates system integration and compatibility',
            validator: async (context) => this.integrationValidator.validateIntegration(context),
            dependencies: ['functional-validation'],
            timeout: 900000,
            retries: 1
        });
    }
    /**
     * Generate validation summary
     */
    generateSummary(results) {
        const summary = {};
        for (const category of Object.values(ValidationCategory)) {
            const categoryResults = results.filter(r => r.category === category);
            if (categoryResults.length > 0) {
                summary[category] = {
                    total: categoryResults.length,
                    passed: categoryResults.filter(r => r.status === ValidationStatus.PASSED).length,
                    failed: categoryResults.filter(r => r.status === ValidationStatus.FAILED).length,
                    skipped: categoryResults.filter(r => r.status === ValidationStatus.SKIPPED).length
                };
            }
        }
        return summary;
    }
    /**
     * Generate workflow execution result
     */
    generateWorkflowResult(context, startTime, validationReports) {
        const allResults = validationReports.flatMap(report => report.results);
        const duration = Date.now() - startTime;
        const summary = {
            totalValidators: validationReports.length,
            passedValidators: validationReports.filter(r => r.failedRules === 0).length,
            failedValidators: validationReports.filter(r => r.failedRules > 0).length,
            skippedValidators: validationReports.filter(r => r.totalRules === r.skippedRules).length,
            totalIssues: allResults.filter(r => r.status === ValidationStatus.FAILED).length,
            criticalIssues: allResults.filter(r => r.severity === ValidationSeverity.CRITICAL).length,
            errorIssues: allResults.filter(r => r.severity === ValidationSeverity.ERROR).length,
            warningIssues: allResults.filter(r => r.severity === ValidationSeverity.WARNING).length
        };
        const overallStatus = summary.criticalIssues > 0 || summary.errorIssues > 0 ?
            ValidationStatus.FAILED :
            summary.warningIssues > 0 ? ValidationStatus.PASSED : ValidationStatus.PASSED;
        return {
            taskId: context.taskId,
            stage: context.stage,
            timestamp: new Date(),
            duration,
            overallStatus,
            validationReports,
            summary,
            metadata: {
                executionContext: context,
                configuration: this.config.stages[context.stage]
            }
        };
    }
    /**
     * Create batches for parallel execution
     */
    createBatches(items, batchSize) {
        const batches = [];
        for (let i = 0; i < items.length; i += batchSize) {
            batches.push(items.slice(i, i + batchSize));
        }
        return batches;
    }
    /**
     * Check if validation report has failures
     */
    hasFailures(report) {
        return report.failedRules > 0 || report.results.some(r => r.severity === ValidationSeverity.CRITICAL || r.severity === ValidationSeverity.ERROR);
    }
    /**
     * Create skipped workflow result
     */
    createSkippedResult(context, startTime) {
        return {
            taskId: context.taskId,
            stage: context.stage,
            timestamp: new Date(),
            duration: Date.now() - startTime,
            overallStatus: ValidationStatus.SKIPPED,
            validationReports: [],
            summary: {
                totalValidators: 0,
                passedValidators: 0,
                failedValidators: 0,
                skippedValidators: 0,
                totalIssues: 0,
                criticalIssues: 0,
                errorIssues: 0,
                warningIssues: 0
            },
            metadata: {
                reason: 'Stage disabled',
                stage: context.stage
            }
        };
    }
    /**
     * Create error workflow result
     */
    createErrorResult(context, startTime, error) {
        return {
            taskId: context.taskId,
            stage: context.stage,
            timestamp: new Date(),
            duration: Date.now() - startTime,
            overallStatus: ValidationStatus.FAILED,
            validationReports: [],
            summary: {
                totalValidators: 0,
                passedValidators: 0,
                failedValidators: 1,
                skippedValidators: 0,
                totalIssues: 1,
                criticalIssues: 1,
                errorIssues: 1,
                warningIssues: 0
            },
            metadata: {
                error: error.message,
                stack: error.stack,
                stage: context.stage
            }
        };
    }
    /**
     * Create validator error report
     */
    createValidatorErrorReport(context, error) {
        return {
            id: `error-${context.taskId}-${Date.now()}`,
            taskId: context.taskId,
            timestamp: new Date(),
            duration: 0,
            totalRules: 1,
            passedRules: 0,
            failedRules: 1,
            skippedRules: 0,
            results: [{
                    id: `validator-error-${Date.now()}`,
                    category: ValidationCategory.LOGIC,
                    severity: ValidationSeverity.ERROR,
                    status: ValidationStatus.FAILED,
                    message: `Validator execution failed: ${error.message}`,
                    timestamp: new Date(),
                    metadata: { error: error.stack }
                }],
            summary: {},
            metadata: { validatorError: true }
        };
    }
    /**
     * Handle workflow completion
     */
    async handleWorkflowCompletion(result) {
        // Persist reports if enabled
        if (this.config.reporting.persistReports) {
            await this.persistWorkflowResult(result);
        }
        // Send notifications
        if (this.shouldNotify(result)) {
            await this.sendNotifications(result);
        }
        this.logger.info(`Workflow completed for task: ${result.taskId}`, {
            stage: result.stage,
            overallStatus: result.overallStatus,
            duration: result.duration,
            summary: result.summary
        });
    }
    /**
     * Handle workflow failure
     */
    async handleWorkflowFailure(result, error) {
        // Always notify on failure if enabled
        if (this.config.notifications.onFailure) {
            await this.sendFailureNotifications(result, error);
        }
        this.logger.error(`Workflow failed for task: ${result.taskId}`, {
            stage: result.stage,
            error: error.message,
            duration: result.duration
        });
    }
    /**
     * Determine if notifications should be sent
     */
    shouldNotify(result) {
        if (result.overallStatus === ValidationStatus.FAILED && this.config.notifications.onFailure) {
            return true;
        }
        if (result.overallStatus === ValidationStatus.PASSED && this.config.notifications.onSuccess) {
            return true;
        }
        if (result.summary.warningIssues > 0 && this.config.notifications.onWarning) {
            return true;
        }
        return false;
    }
    /**
     * Send notifications (placeholder implementation)
     */
    async sendNotifications(result) {
        this.logger.info(`Sending notifications for workflow result: ${result.taskId}`);
        // Implementation would send actual notifications via webhooks, email, etc.
    }
    /**
     * Send failure notifications (placeholder implementation)
     */
    async sendFailureNotifications(result, error) {
        this.logger.error(`Sending failure notifications for workflow: ${result.taskId}`, { error });
        // Implementation would send actual failure notifications
    }
    /**
     * Persist workflow result (placeholder implementation)
     */
    async persistWorkflowResult(result) {
        this.logger.debug(`Persisting workflow result: ${result.taskId}`);
        // Implementation would persist to database or file system
    }
    /**
     * Check if workflow is running for a task
     */
    isWorkflowRunning(taskId, stage) {
        return this.activeWorkflows.has(`${taskId}-${stage}`);
    }
    /**
     * Cancel running workflow
     */
    async cancelWorkflow(taskId, stage) {
        const workflowKey = `${taskId}-${stage}`;
        if (this.activeWorkflows.has(workflowKey)) {
            this.activeWorkflows.delete(workflowKey);
            this.logger.info(`Cancelled workflow for task: ${taskId} at stage: ${stage}`);
            return true;
        }
        return false;
    }
    /**
     * Get workflow statistics
     */
    getWorkflowStatistics() {
        return {
            activeWorkflows: this.activeWorkflows.size,
            supportedStages: Object.values(TaskExecutionStage),
            supportedValidators: ['codeQuality', 'functional', 'integration']
        };
    }
}
//# sourceMappingURL=ValidationWorkflow.js.map