/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { EventEmitter } from 'node:events';
/**
 * Validation severity levels for different types of validation failures
 */
export declare enum ValidationSeverity {
    INFO = "info",
    WARNING = "warning",
    ERROR = "error",
    CRITICAL = "critical"
}
/**
 * Validation status for tracking validation states
 */
export declare enum ValidationStatus {
    PENDING = "pending",
    RUNNING = "running",
    PASSED = "passed",
    FAILED = "failed",
    SKIPPED = "skipped"
}
/**
 * Validation rule category for organizing validation types
 */
export declare enum ValidationCategory {
    SYNTAX = "syntax",
    LOGIC = "logic",
    SECURITY = "security",
    PERFORMANCE = "performance",
    INTEGRATION = "integration",
    FUNCTIONAL = "functional",
    BUSINESS = "business"
}
/**
 * Individual validation result interface
 */
export interface ValidationResult {
    id: string;
    category: ValidationCategory;
    severity: ValidationSeverity;
    status: ValidationStatus;
    message: string;
    details?: string;
    file?: string;
    line?: number;
    column?: number;
    rule?: string;
    timestamp: Date;
    duration?: number;
    metadata?: Record<string, unknown>;
}
/**
 * Validation rule configuration interface
 */
export interface ValidationRule {
    id: string;
    name: string;
    category: ValidationCategory;
    severity: ValidationSeverity;
    enabled: boolean;
    description: string;
    validator: ValidationExecutor;
    dependencies?: string[];
    timeout?: number;
    retries?: number;
    metadata?: Record<string, unknown>;
}
/**
 * Validation context containing input data and configuration
 */
export interface ValidationContext {
    taskId: string;
    files?: string[];
    content?: string;
    metadata?: Record<string, unknown>;
    config?: ValidationConfig;
    previousResults?: ValidationResult[];
}
/**
 * Validation executor function signature
 */
export type ValidationExecutor = (context: ValidationContext) => Promise<ValidationResult[]>;
/**
 * Validation configuration interface
 */
export interface ValidationConfig {
    enabledCategories: ValidationCategory[];
    maxConcurrentValidations?: number;
    timeout?: number;
    retries?: number;
    failOnError?: boolean;
    reportingEnabled?: boolean;
    customRules?: ValidationRule[];
}
/**
 * Validation report aggregating all results
 */
export interface ValidationReport {
    id: string;
    taskId: string;
    timestamp: Date;
    duration: number;
    totalRules: number;
    passedRules: number;
    failedRules: number;
    skippedRules: number;
    results: ValidationResult[];
    summary: {
        [key in ValidationCategory]?: {
            total: number;
            passed: number;
            failed: number;
            skipped: number;
        };
    };
    metadata?: Record<string, unknown>;
}
/**
 * Validation framework events
 */
export interface ValidationEvents {
    validationStarted: [taskId: string];
    validationCompleted: [report: ValidationReport];
    validationFailed: [taskId: string, error: Error];
    ruleStarted: [ruleId: string, taskId: string];
    ruleCompleted: [result: ValidationResult];
    ruleFailed: [ruleId: string, error: Error];
}
/**
 * Core validation framework for automatic task completion validation cycles
 * Provides comprehensive multi-level validation with automated workflows
 */
export declare class ValidationFramework extends EventEmitter {
    private readonly logger;
    private readonly rules;
    private readonly activeValidations;
    private readonly config;
    constructor(config?: ValidationConfig);
    /**
     * Register a validation rule with the framework
     */
    registerRule(rule: ValidationRule): void;
    /**
     * Unregister a validation rule
     */
    unregisterRule(ruleId: string): boolean;
    /**
     * Get all registered validation rules
     */
    getRules(): ValidationRule[];
    /**
     * Get validation rules filtered by category
     */
    getRulesByCategory(category: ValidationCategory): ValidationRule[];
    /**
     * Execute validation cycle for a task
     */
    validateTask(context: ValidationContext): Promise<ValidationReport>;
    /**
     * Execute the complete validation cycle
     */
    private executeValidationCycle;
    /**
     * Get applicable validation rules for the context
     */
    private getApplicableRules;
    /**
     * Execute validation rules with proper dependency handling
     */
    private executeRulesWithDependencies;
    /**
     * Execute a single validation rule
     */
    private executeValidationRule;
    /**
     * Execute function with retry and timeout logic
     */
    private executeWithRetryAndTimeout;
    /**
     * Create batches of rules for concurrent execution
     */
    private createBatches;
    /**
     * Generate comprehensive validation report
     */
    private generateValidationReport;
    /**
     * Check if a validation is currently running for a task
     */
    isValidationRunning(taskId: string): boolean;
    /**
     * Cancel a running validation
     */
    cancelValidation(taskId: string): Promise<boolean>;
    /**
     * Get framework statistics
     */
    getStatistics(): {
        registeredRules: number;
        activeValidations: number;
        enabledCategories: ValidationCategory[];
    };
}
