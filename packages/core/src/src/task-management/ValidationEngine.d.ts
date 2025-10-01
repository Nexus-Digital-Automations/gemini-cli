/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * @fileoverview Comprehensive Automatic Task Completion Validation Engine
 *
 * Enterprise-grade validation system for task completion with configurable
 * quality gates, intelligent validation rules, and automatic recovery mechanisms.
 */
import type { Config } from '../config/config.js';
import type { Task, TaskId, TaskResult, TaskPriority, TaskCategory } from './types.js';
import type { ExecutionMetrics } from './ExecutionMonitoringSystem.js';
import { EventEmitter } from 'node:events';
/**
 * Validation checkpoint types
 */
export type ValidationCheckpointType = 'code_quality' | 'functional_testing' | 'performance' | 'security' | 'integration' | 'business_rules' | 'compliance' | 'documentation';
/**
 * Validation severity levels
 */
export type ValidationSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';
/**
 * Validation status
 */
export type ValidationStatus = 'passed' | 'failed' | 'warning' | 'skipped' | 'error';
/**
 * Quality gate configuration
 */
export interface QualityGateConfig {
    /** Unique identifier for the quality gate */
    id: string;
    /** Human-readable name */
    name: string;
    /** Type of validation checkpoint */
    type: ValidationCheckpointType;
    /** Whether this gate is blocking (must pass to proceed) */
    blocking: boolean;
    /** Minimum severity level required to pass */
    minimumSeverity: ValidationSeverity;
    /** Timeout for validation in milliseconds */
    timeoutMs: number;
    /** Maximum number of retry attempts */
    maxRetries: number;
    /** Custom validation parameters */
    parameters: Record<string, unknown>;
    /** Validation rules to execute */
    rules: ValidationRule[];
    /** Tasks that this gate applies to */
    applicableTasks?: {
        categories?: TaskCategory[];
        priorities?: TaskPriority[];
        tags?: string[];
    };
}
/**
 * Validation rule definition
 */
export interface ValidationRule {
    /** Unique rule identifier */
    id: string;
    /** Rule name */
    name: string;
    /** Rule description */
    description: string;
    /** Severity of violations */
    severity: ValidationSeverity;
    /** Rule implementation function */
    validator: (task: Task, result: TaskResult, context: ValidationContext) => Promise<ValidationRuleResult>;
    /** Whether this rule is enabled */
    enabled: boolean;
    /** Rule-specific configuration */
    config?: Record<string, unknown>;
}
/**
 * Validation context for rules
 */
export interface ValidationContext {
    /** Task being validated */
    task: Task;
    /** Task execution result */
    result: TaskResult;
    /** Project configuration */
    config: Config;
    /** Current execution metrics */
    metrics: ExecutionMetrics;
    /** Validation history for this task */
    history: ValidationResult[];
    /** Additional context data */
    data: Record<string, unknown>;
}
/**
 * Result of a single validation rule
 */
export interface ValidationRuleResult {
    /** Whether the rule passed */
    passed: boolean;
    /** Validation status */
    status: ValidationStatus;
    /** Human-readable message */
    message: string;
    /** Detailed findings */
    details?: string;
    /** Metrics collected during validation */
    metrics?: Record<string, number>;
    /** Evidence or artifacts */
    evidence?: string[];
    /** Suggested fixes */
    suggestions?: string[];
    /** Execution time in milliseconds */
    executionTimeMs: number;
}
/**
 * Result of a quality gate validation
 */
export interface QualityGateResult {
    /** Quality gate configuration */
    gate: QualityGateConfig;
    /** Overall gate status */
    status: ValidationStatus;
    /** Whether the gate passed */
    passed: boolean;
    /** Individual rule results */
    ruleResults: ValidationRuleResult[];
    /** Gate execution time */
    executionTimeMs: number;
    /** Timestamp when validation occurred */
    timestamp: Date;
    /** Error information if gate failed to execute */
    error?: {
        message: string;
        stack?: string;
    };
}
/**
 * Complete validation result for a task
 */
export interface ValidationResult {
    /** Task ID that was validated */
    taskId: TaskId;
    /** Overall validation status */
    status: ValidationStatus;
    /** Whether all blocking gates passed */
    passed: boolean;
    /** Individual gate results */
    gateResults: QualityGateResult[];
    /** Overall execution time */
    executionTimeMs: number;
    /** Validation timestamp */
    timestamp: Date;
    /** Summary statistics */
    summary: {
        totalGates: number;
        passedGates: number;
        failedGates: number;
        warningGates: number;
        skippedGates: number;
        criticalViolations: number;
        highViolations: number;
        mediumViolations: number;
        lowViolations: number;
    };
    /** Next actions recommended */
    recommendations: string[];
    /** Whether automatic recovery was attempted */
    recoveryAttempted: boolean;
    /** Recovery results if attempted */
    recoveryResults?: {
        success: boolean;
        actions: string[];
        details: string;
    };
}
/**
 * Performance benchmark configuration
 */
export interface PerformanceBenchmark {
    /** Benchmark name */
    name: string;
    /** Maximum execution time in milliseconds */
    maxExecutionTime: number;
    /** Maximum memory usage in MB */
    maxMemoryUsage: number;
    /** Maximum CPU usage percentage */
    maxCpuUsage: number;
    /** Minimum throughput (operations per second) */
    minThroughput?: number;
    /** Custom performance metrics */
    customMetrics?: Record<string, {
        threshold: number;
        comparison: 'less_than' | 'greater_than' | 'equals';
    }>;
}
/**
 * Security scan configuration
 */
export interface SecurityScanConfig {
    /** SAST scanner to use */
    scanner: 'semgrep' | 'bandit' | 'eslint-security' | 'custom';
    /** Rules to apply */
    rules: string[];
    /** Severity levels to report */
    reportSeverities: ValidationSeverity[];
    /** Whether to fail on any findings */
    failOnFindings: boolean;
    /** Custom scanner command */
    customCommand?: string;
    /** Additional scanner arguments */
    arguments?: string[];
}
/**
 * Comprehensive automatic task completion validation engine
 */
export declare class ValidationEngine extends EventEmitter {
    private readonly config;
    private readonly qualityGates;
    private readonly validationRules;
    private readonly validationHistory;
    private readonly performanceBenchmarks;
    private readonly securityScans;
    private readonly activeValidations;
    private readonly recoveryStrategies;
    private readonly validationResultsPath;
    private readonly benchmarkResultsPath;
    private readonly securityResultsPath;
    constructor(config: Config);
    /**
     * Validates task completion with all configured quality gates
     */
    validateTaskCompletion(task: Task, result: TaskResult, metrics: ExecutionMetrics): Promise<ValidationResult>;
    /**
     * Executes validation with all applicable quality gates
     */
    private executeValidation;
    /**
     * Executes a single quality gate
     */
    private executeQualityGate;
    /**
     * Executes a single validation rule
     */
    private executeValidationRule;
    /**
     * Gets quality gates applicable to a specific task
     */
    private getApplicableQualityGates;
    /**
     * Calculates overall validation status from gate results
     */
    private calculateOverallValidationStatus;
    /**
     * Calculates gate status from rule results
     */
    private calculateGateStatus;
    /**
     * Calculates validation summary statistics
     */
    private calculateValidationSummary;
    /**
     * Generates recommendations based on validation results
     */
    private generateRecommendations;
    /**
     * Attempts automatic recovery for failed validations
     */
    private attemptAutomaticRecovery;
    /**
     * Adds a custom quality gate
     */
    addQualityGate(gate: QualityGateConfig): void;
    /**
     * Adds a custom validation rule
     */
    addValidationRule(rule: ValidationRule): void;
    /**
     * Gets validation history for a task
     */
    getValidationHistory(taskId: TaskId): ValidationResult[];
    /**
     * Gets overall validation statistics
     */
    getValidationStatistics(): {
        totalValidations: number;
        successRate: number;
        averageExecutionTime: number;
        gateStatistics: Record<string, {
            passed: number;
            failed: number;
            successRate: number;
        }>;
    };
    /**
     * Initializes default quality gates
     */
    private initializeDefaultQualityGates;
    /**
     * Initializes default validation rules
     */
    private initializeDefaultValidationRules;
    /**
     * Initializes default performance benchmarks
     */
    private initializeDefaultBenchmarks;
    /**
     * Initializes default security scans
     */
    private initializeDefaultSecurityScans;
    /**
     * Initializes recovery strategies
     */
    private initializeRecoveryStrategies;
    /**
     * Trims validation history to prevent memory issues
     */
    private trimValidationHistory;
    /**
     * Persists validation results to disk
     */
    private persistValidationResults;
    /**
     * Shuts down the validation engine
     */
    shutdown(): Promise<void>;
}
