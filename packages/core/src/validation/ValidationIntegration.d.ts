/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { EventEmitter } from 'node:events';
import type { TaskExecutionMetrics } from './TaskValidator.js';
import type { TaskValidationLevel } from './TaskValidator.js';
import type { QualityCheckType } from './QualityAssurance.js';
import type { RollbackTrigger } from './RollbackManager.js';
import type { Task } from '../task-management/types.js';
import type { TaskExecutionContext } from '../task-management/TaskExecutionEngine.js';
/**
 * Validation integration events for system-wide monitoring
 */
export interface ValidationIntegrationEvents {
    validationSystemInitialized: [config: ValidationIntegrationConfig];
    taskValidationStarted: [taskId: string, phase: TaskValidationPhase];
    taskValidationCompleted: [
        taskId: string,
        phase: TaskValidationPhase,
        passed: boolean
    ];
    qualityAssuranceTriggered: [taskId: string, trigger: QualityTrigger];
    rollbackInitiated: [taskId: string, reason: string];
    rollbackCompleted: [taskId: string, success: boolean];
    validationSystemError: [
        taskId: string,
        error: Error,
        phase: TaskValidationPhase
    ];
    systemHealthCheck: [health: SystemHealthReport];
}
/**
 * Task validation phases in the execution lifecycle
 */
export declare enum TaskValidationPhase {
    PRE_EXECUTION = "pre_execution",
    DURING_EXECUTION = "during_execution",
    POST_EXECUTION = "post_execution",
    QUALITY_ASSURANCE = "quality_assurance",
    ROLLBACK_VALIDATION = "rollback_validation"
}
/**
 * Quality assurance triggers
 */
export declare enum QualityTrigger {
    TASK_COMPLETION = "task_completion",
    SCHEDULED_CHECK = "scheduled_check",
    THRESHOLD_VIOLATION = "threshold_violation",
    USER_REQUEST = "user_request",
    SYSTEM_ANOMALY = "system_anomaly"
}
/**
 * Integration configuration for validation system
 */
export interface ValidationIntegrationConfig {
    enabled: boolean;
    phases: {
        preExecution: {
            enabled: boolean;
            validationLevel: TaskValidationLevel;
            blockOnFailure: boolean;
            createSnapshot: boolean;
        };
        duringExecution: {
            enabled: boolean;
            monitoringInterval: number;
            thresholdChecks: boolean;
            realTimeValidation: boolean;
        };
        postExecution: {
            enabled: boolean;
            validationLevel: TaskValidationLevel;
            qualityAssurance: boolean;
            autoRollbackOnFailure: boolean;
        };
    };
    qualityAssurance: {
        enabled: boolean;
        triggers: QualityTrigger[];
        checkTypes: QualityCheckType[];
        scheduledInterval?: number;
    };
    rollback: {
        enabled: boolean;
        autoTriggers: RollbackTrigger[];
        requireApproval: boolean;
        snapshotRetention: number;
    };
    performance: {
        maxConcurrentValidations: number;
        validationTimeout: number;
        cacheEnabled: boolean;
        batchProcessing: boolean;
    };
    errorHandling: {
        retryAttempts: number;
        fallbackBehavior: 'skip' | 'warn' | 'fail';
        errorEscalation: boolean;
    };
}
/**
 * Enhanced task execution context with validation integration
 */
export interface ValidatedTaskExecutionContext extends TaskExecutionContext {
    validationConfig?: ValidationIntegrationConfig;
    validationPhase?: TaskValidationPhase;
    qualityRequirements?: string[];
    rollbackEnabled?: boolean;
    customValidators?: string[];
}
/**
 * Comprehensive validation result for task execution
 */
export interface TaskExecutionValidationResult {
    taskId: string;
    phase: TaskValidationPhase;
    timestamp: Date;
    duration: number;
    preExecution?: {
        passed: boolean;
        qualityScore: number;
        issues: string[];
        recommendations: string[];
    };
    duringExecution?: {
        monitoring: boolean;
        thresholds: Array<{
            metric: string;
            status: 'ok' | 'warning' | 'critical';
            value: number;
            threshold: number;
        }>;
        interventions: string[];
    };
    postExecution?: {
        passed: boolean;
        qualityScore: number;
        completionCriteria: Array<{
            criterion: string;
            satisfied: boolean;
            evidence?: string;
        }>;
    };
    qualityAssurance?: {
        overallScore: number;
        passed: boolean;
        violations: Array<{
            type: string;
            severity: string;
            description: string;
        }>;
        recommendations: string[];
    };
    rollback?: {
        recommended: boolean;
        reason?: string;
        snapshotId?: string;
        executed?: boolean;
        success?: boolean;
    };
    overallPassed: boolean;
    overallQualityScore: number;
    executionAllowed: boolean;
    requiresIntervention: boolean;
    metadata: Record<string, unknown>;
}
/**
 * System health report for monitoring
 */
export interface SystemHealthReport {
    timestamp: Date;
    overallHealth: 'healthy' | 'degraded' | 'critical';
    components: {
        validationFramework: {
            status: 'healthy' | 'degraded' | 'error';
            activeValidations: number;
            averageResponseTime: number;
        };
        qualityAssurance: {
            status: 'healthy' | 'degraded' | 'error';
            activeChecks: number;
            averageScore: number;
        };
        rollbackManager: {
            status: 'healthy' | 'degraded' | 'error';
            activeRollbacks: number;
            totalSnapshots: number;
        };
    };
    metrics: {
        totalValidations: number;
        successRate: number;
        averageValidationTime: number;
        rollbackRate: number;
    };
    alerts: Array<{
        severity: 'info' | 'warning' | 'critical';
        component: string;
        message: string;
        timestamp: Date;
    }>;
}
/**
 * Comprehensive Validation Integration System
 *
 * Provides seamless integration between the validation system components
 * and the existing task execution engine, enabling automated validation
 * throughout the task lifecycle with intelligent quality assurance and
 * rollback capabilities.
 */
export declare class ValidationIntegration extends EventEmitter {
    private readonly logger;
    private readonly config;
    private readonly validationFramework;
    private readonly validationRules;
    private readonly taskValidator;
    private readonly qualityAssurance;
    private readonly rollbackManager;
    private readonly activeValidations;
    private readonly monitoringIntervals;
    private readonly validationCache;
    private readonly validationStats;
    constructor(config?: Partial<ValidationIntegrationConfig>);
    /**
     * Create default configuration with overrides
     */
    private createDefaultConfig;
    /**
     * Setup integration between validation components and task execution
     */
    private setupIntegration;
    /**
     * Setup event listeners for cross-component communication
     */
    private setupEventListeners;
    /**
     * Main integration method for task execution validation
     */
    validateTaskExecution(task: Task, context: ValidatedTaskExecutionContext, executionMetrics?: TaskExecutionMetrics): Promise<TaskExecutionValidationResult>;
    /**
     * Execute comprehensive validation across all phases
     */
    private executeComprehensiveValidation;
    /**
     * Execute pre-execution validation phase
     */
    private executePreExecutionValidation;
    /**
     * Execute during-execution monitoring
     */
    private executeDuringExecutionMonitoring;
    /**
     * Execute post-execution validation phase
     */
    private executePostExecutionValidation;
    /**
     * Execute quality assurance phase
     */
    private executeQualityAssurance;
    /**
     * Evaluate rollback necessity
     */
    private evaluateRollbackNeed;
    /**
     * Helper methods
     */
    private mapValidationTypeToPhase;
    private createTaskResultFromContext;
    private evaluateCompletionCriterion;
    private createPassthroughResult;
    private mapRuleCategoryToValidationCategory;
    private startMonitoring;
    private performHealthCheck;
    private performScheduledQualityChecks;
    /**
     * Public API methods
     */
    /**
     * Get validation system statistics
     */
    getValidationStatistics(): {
        activeValidations: number;
        cacheSize: number;
        monitoringSessions: number;
        totalValidations: number;
        successfulValidations: number;
        failedValidations: number;
        rollbacksTriggered: number;
        averageValidationTime: number;
    };
    /**
     * Update validation configuration
     */
    updateConfiguration(updates: Partial<ValidationIntegrationConfig>): void;
    /**
     * Clean up resources
     */
    cleanup(): Promise<void>;
}
