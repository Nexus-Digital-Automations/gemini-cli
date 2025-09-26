/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { EventEmitter } from 'node:events';
import type { ValidationReport } from './ValidationFramework.js';
import { ValidationStatus } from './ValidationFramework.js';
import type { CodeQualityConfig } from './CodeQualityValidator.js';
import type { FunctionalValidationConfig } from './FunctionalValidator.js';
import type { IntegrationValidationConfig } from './IntegrationValidator.js';
/**
 * Task execution stage for validation workflow integration
 */
export declare enum TaskExecutionStage {
    PRE_EXECUTION = "pre-execution",
    POST_EXECUTION = "post-execution",
    ON_FAILURE = "on-failure",
    ON_SUCCESS = "on-success",
    CONTINUOUS = "continuous"
}
/**
 * Validation workflow configuration
 */
export interface ValidationWorkflowConfig {
    stages: {
        [key in TaskExecutionStage]: {
            enabled: boolean;
            validators: string[];
            continueOnFailure: boolean;
            timeout?: number;
        };
    };
    globalConfig: {
        parallelExecution: boolean;
        maxParallelValidators: number;
        retryOnFailure: boolean;
        maxRetries: number;
        retryDelay: number;
    };
    validatorConfigs: {
        codeQuality?: CodeQualityConfig;
        functional?: FunctionalValidationConfig;
        integration?: IntegrationValidationConfig;
    };
    reporting: {
        aggregateReports: boolean;
        persistReports: boolean;
        reportFormat: 'json' | 'xml' | 'html';
        outputPath?: string;
    };
    notifications: {
        onSuccess: boolean;
        onFailure: boolean;
        onWarning: boolean;
        webhooks?: string[];
        email?: {
            enabled: boolean;
            recipients: string[];
            smtp?: {
                host: string;
                port: number;
                secure: boolean;
                auth: {
                    user: string;
                    pass: string;
                };
            };
        };
    };
}
/**
 * Task execution context for workflow integration
 */
export interface TaskExecutionContext {
    taskId: string;
    stage: TaskExecutionStage;
    executionMetadata: {
        startTime: Date;
        endTime?: Date;
        duration?: number;
        success?: boolean;
        error?: Error;
    };
    taskDetails: {
        type: string;
        description: string;
        files?: string[];
        dependencies?: string[];
    };
    previousResults?: ValidationReport[];
}
/**
 * Workflow execution result
 */
export interface WorkflowExecutionResult {
    taskId: string;
    stage: TaskExecutionStage;
    timestamp: Date;
    duration: number;
    overallStatus: ValidationStatus;
    validationReports: ValidationReport[];
    summary: {
        totalValidators: number;
        passedValidators: number;
        failedValidators: number;
        skippedValidators: number;
        totalIssues: number;
        criticalIssues: number;
        errorIssues: number;
        warningIssues: number;
    };
    metadata: Record<string, unknown>;
}
/**
 * Validation workflow integration system
 * Orchestrates validation execution across task execution pipelines
 */
export declare class ValidationWorkflow extends EventEmitter {
    private readonly logger;
    private readonly validationFramework;
    private readonly codeQualityValidator;
    private readonly functionalValidator;
    private readonly integrationValidator;
    private readonly config;
    private readonly activeWorkflows;
    constructor(config: ValidationWorkflowConfig);
    /**
     * Execute validation workflow for a task execution stage
     */
    executeValidationWorkflow(context: TaskExecutionContext): Promise<WorkflowExecutionResult>;
    /**
     * Execute validation workflow stage
     */
    private executeWorkflowStage;
    /**
     * Execute validators in parallel
     */
    private executeValidatorsInParallel;
    /**
     * Execute validators sequentially
     */
    private executeValidatorsSequentially;
    /**
     * Execute individual validator
     */
    private executeValidator;
    /**
     * Register validation rules with the framework
     */
    private registerValidationRules;
    /**
     * Generate validation summary
     */
    private generateSummary;
    /**
     * Generate workflow execution result
     */
    private generateWorkflowResult;
    /**
     * Create batches for parallel execution
     */
    private createBatches;
    /**
     * Check if validation report has failures
     */
    private hasFailures;
    /**
     * Create skipped workflow result
     */
    private createSkippedResult;
    /**
     * Create error workflow result
     */
    private createErrorResult;
    /**
     * Create validator error report
     */
    private createValidatorErrorReport;
    /**
     * Handle workflow completion
     */
    private handleWorkflowCompletion;
    /**
     * Handle workflow failure
     */
    private handleWorkflowFailure;
    /**
     * Determine if notifications should be sent
     */
    private shouldNotify;
    /**
     * Send notifications (placeholder implementation)
     */
    private sendNotifications;
    /**
     * Send failure notifications (placeholder implementation)
     */
    private sendFailureNotifications;
    /**
     * Persist workflow result (placeholder implementation)
     */
    private persistWorkflowResult;
    /**
     * Check if workflow is running for a task
     */
    isWorkflowRunning(taskId: string, stage: TaskExecutionStage): boolean;
    /**
     * Cancel running workflow
     */
    cancelWorkflow(taskId: string, stage: TaskExecutionStage): Promise<boolean>;
    /**
     * Get workflow statistics
     */
    getWorkflowStatistics(): {
        activeWorkflows: number;
        supportedStages: TaskExecutionStage[];
        supportedValidators: string[];
    };
}
