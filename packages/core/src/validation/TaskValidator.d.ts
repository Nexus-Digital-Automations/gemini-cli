/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { EventEmitter } from 'node:events';
import type { ValidationFramework, ValidationResult } from './ValidationFramework.js';
import { ValidationSeverity } from './ValidationFramework.js';
import type { Task, TaskResult } from '../task-management/types.js';
import { TaskStatus } from '../task-management/types.js';
/**
 * Task validation events for comprehensive monitoring
 */
export interface TaskValidationEvents {
    taskValidationStarted: [taskId: string, validationType: TaskValidationType];
    taskValidationCompleted: [taskId: string, result: TaskValidationResult];
    taskValidationFailed: [taskId: string, error: Error, context: TaskValidationContext];
    validationRuleExecuted: [ruleId: string, taskId: string, result: ValidationResult];
    qualityThresholdExceeded: [taskId: string, metric: string, actual: number, threshold: number];
    rollbackInitiated: [taskId: string, reason: string, snapshot: TaskSnapshot];
    rollbackCompleted: [taskId: string, success: boolean];
}
/**
 * Task validation types for different validation scenarios
 */
export declare enum TaskValidationType {
    PRE_EXECUTION = "pre_execution",// Before task execution starts
    IN_PROGRESS = "in_progress",// During task execution
    POST_EXECUTION = "post_execution",// After task completion
    DEPENDENCY = "dependency",// Dependency validation
    ROLLBACK = "rollback",// Rollback validation
    QUALITY_ASSURANCE = "quality_assurance"
}
/**
 * Task validation result levels
 */
export declare enum TaskValidationLevel {
    STRICT = "strict",// All validations must pass
    MODERATE = "moderate",// Critical validations must pass
    LENIENT = "lenient",// Only blocking validations must pass
    ADVISORY = "advisory"
}
/**
 * Task validation context for comprehensive validation execution
 */
export interface TaskValidationContext {
    task: Task;
    taskResult?: TaskResult;
    validationType: TaskValidationType;
    validationLevel: TaskValidationLevel;
    dependencies?: Task[];
    dependencyResults?: Map<string, TaskResult>;
    previousSnapshots?: TaskSnapshot[];
    executionMetrics?: TaskExecutionMetrics;
    customValidators?: string[];
    skipValidations?: string[];
    metadata?: Record<string, unknown>;
}
/**
 * Task execution metrics for performance and quality validation
 */
export interface TaskExecutionMetrics {
    startTime: Date;
    endTime?: Date;
    duration?: number;
    memoryUsage?: {
        peak: number;
        average: number;
        current: number;
    };
    cpuUsage?: {
        peak: number;
        average: number;
    };
    resourceUsage?: Map<string, number>;
    errorCount: number;
    warningCount: number;
    retryCount: number;
    throughput?: number;
    qualityMetrics?: Record<string, number>;
}
/**
 * Task snapshot for rollback functionality
 */
export interface TaskSnapshot {
    id: string;
    taskId: string;
    timestamp: Date;
    taskState: Task;
    fileSnapshot?: Map<string, string>;
    databaseSnapshot?: Record<string, unknown>;
    environmentSnapshot?: Record<string, string>;
    dependencyStates?: Map<string, TaskStatus>;
    metadata?: Record<string, unknown>;
}
/**
 * Comprehensive task validation result
 */
export interface TaskValidationResult {
    taskId: string;
    validationType: TaskValidationType;
    validationLevel: TaskValidationLevel;
    passed: boolean;
    timestamp: Date;
    duration: number;
    results: ValidationResult[];
    qualityScore: number;
    executionMetrics?: TaskExecutionMetrics;
    rollbackRecommended: boolean;
    rollbackReason?: string;
    snapshot?: TaskSnapshot;
    recommendations: ValidationRecommendation[];
    metadata?: Record<string, unknown>;
}
/**
 * Validation recommendations for task improvement
 */
export interface ValidationRecommendation {
    type: 'performance' | 'quality' | 'security' | 'maintainability' | 'reliability';
    severity: ValidationSeverity;
    message: string;
    details: string;
    suggestedActions: string[];
    impact: 'low' | 'medium' | 'high';
    effort: 'minimal' | 'moderate' | 'significant';
}
/**
 * Quality threshold configuration for automated validation
 */
export interface QualityThresholds {
    executionTime?: {
        warning: number;
        critical: number;
    };
    memoryUsage?: {
        warning: number;
        critical: number;
    };
    errorRate?: {
        warning: number;
        critical: number;
    };
    codeQuality?: {
        minScore: number;
        criticalScore: number;
    };
    testCoverage?: {
        minPercent: number;
        criticalPercent: number;
    };
    securityScore?: {
        minScore: number;
        criticalScore: number;
    };
}
/**
 * Task validation configuration
 */
export interface TaskValidatorConfig {
    validationLevel: TaskValidationLevel;
    qualityThresholds: QualityThresholds;
    enabledValidationTypes: TaskValidationType[];
    snapshotting: {
        enabled: boolean;
        maxSnapshots: number;
        autoSnapshot: boolean;
    };
    rollback: {
        enabled: boolean;
        autoRollbackOnFailure: boolean;
        preserveSnapshots: boolean;
    };
    metrics: {
        trackPerformance: boolean;
        trackQuality: boolean;
        trackSecurity: boolean;
    };
    customValidators?: Map<string, (context: TaskValidationContext) => Promise<ValidationResult[]>>;
}
/**
 * Comprehensive Task Validator for Autonomous Task Management
 *
 * Provides end-to-end validation of task execution with:
 * - Pre/during/post execution validation
 * - Quality assurance and threshold monitoring
 * - Automated rollback capabilities
 * - Performance and security validation
 * - Comprehensive reporting and recommendations
 */
export declare class TaskValidator extends EventEmitter {
    private readonly logger;
    private readonly validationFramework;
    private readonly config;
    private readonly snapshots;
    private readonly activeValidations;
    private readonly qualityMetrics;
    constructor(validationFramework: ValidationFramework, config?: Partial<TaskValidatorConfig>);
    /**
     * Create default configuration with overrides
     */
    private createDefaultConfig;
    /**
     * Setup default validation rules for task validation
     */
    private setupValidationRules;
    /**
     * Validate a task comprehensively
     */
    validateTask(context: TaskValidationContext): Promise<TaskValidationResult>;
    /**
     * Execute comprehensive task validation cycle
     */
    private executeTaskValidation;
    /**
     * Create a comprehensive task snapshot
     */
    createTaskSnapshot(task: Task): Promise<TaskSnapshot>;
    /**
     * Store task snapshot with cleanup of old snapshots
     */
    private storeSnapshot;
    /**
     * Execute rollback to a previous snapshot
     */
    executeRollback(taskId: string, snapshotId: string): Promise<boolean>;
    /**
     * Validation rules implementation
     */
    /**
     * Validate task preconditions and dependencies
     */
    private validateTaskPreconditions;
    /**
     * Validate task quality metrics
     */
    private validateQualityMetrics;
    /**
     * Validate task security compliance
     */
    private validateTaskSecurity;
    /**
     * Validate task performance metrics
     */
    private validateTaskPerformance;
    /**
     * Helper methods
     */
    private calculateQualityScore;
    private generateRecommendations;
    private shouldRecommendRollback;
    private getRollbackReason;
    private getMinQualityScore;
    /**
     * Public API methods
     */
    /**
     * Get task snapshots for a task
     */
    getTaskSnapshots(taskId: string): TaskSnapshot[];
    /**
     * Get task validation statistics
     */
    getValidationStatistics(): {
        activeValidations: number;
        totalSnapshots: number;
        configuredThresholds: QualityThresholds;
        frameworkStats: ReturnType<ValidationFramework['getStatistics']>;
    };
    /**
     * Update quality thresholds
     */
    updateQualityThresholds(thresholds: Partial<QualityThresholds>): void;
    /**
     * Register custom validator
     */
    registerCustomValidator(name: string, validator: (context: TaskValidationContext) => Promise<ValidationResult[]>): void;
    /**
     * Clean up resources
     */
    cleanup(): Promise<void>;
}
