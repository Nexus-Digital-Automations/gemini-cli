/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { EventEmitter } from 'node:events';
import type { ValidationResult, ValidationContext } from './ValidationFramework.js';
import type { ValidationSeverity, ValidationCategory } from './ValidationFramework.js';
import type { WorkflowExecutionResult, TaskExecutionContext } from './ValidationWorkflow.js';
/**
 * Failure handling strategy types
 */
export declare enum FailureHandlingStrategy {
    IMMEDIATE_RETRY = "immediate-retry",
    EXPONENTIAL_BACKOFF = "exponential-backoff",
    LINEAR_BACKOFF = "linear-backoff",
    CIRCUIT_BREAKER = "circuit-breaker",
    FALLBACK = "fallback",
    ESCALATION = "escalation",
    IGNORE = "ignore"
}
/**
 * Retry configuration
 */
export interface RetryConfig {
    maxAttempts: number;
    initialDelay: number;
    maxDelay: number;
    backoffMultiplier: number;
    jitter: boolean;
    retryableErrors: string[];
    nonRetryableErrors: string[];
}
/**
 * Circuit breaker configuration
 */
export interface CircuitBreakerConfig {
    failureThreshold: number;
    recoveryTimeout: number;
    halfOpenMaxAttempts: number;
    monitoringWindow: number;
}
/**
 * Escalation configuration
 */
export interface EscalationConfig {
    levels: Array<{
        threshold: number;
        actions: string[];
        notify: string[];
        timeout: number;
    }>;
    autoEscalation: boolean;
    escalationDelay: number;
}
/**
 * Fallback configuration
 */
export interface FallbackConfig {
    strategies: Array<{
        type: 'skip' | 'default' | 'alternative';
        config?: Record<string, unknown>;
    }>;
    conditions: Array<{
        severity: ValidationSeverity;
        category: ValidationCategory;
        pattern?: string;
    }>;
}
/**
 * Failure handling configuration
 */
export interface ValidationFailureHandlerConfig {
    globalStrategy: FailureHandlingStrategy;
    categoryStrategies: Partial<Record<ValidationCategory, FailureHandlingStrategy>>;
    severityStrategies: Partial<Record<ValidationSeverity, FailureHandlingStrategy>>;
    retryConfig: RetryConfig;
    circuitBreakerConfig: CircuitBreakerConfig;
    escalationConfig: EscalationConfig;
    fallbackConfig: FallbackConfig;
    recovery: {
        autoRecovery: boolean;
        recoveryAttempts: number;
        recoveryStrategies: string[];
    };
    monitoring: {
        trackMetrics: boolean;
        alertThresholds: {
            failureRate: number;
            errorRate: number;
            responseTime: number;
        };
    };
}
/**
 * Recovery operation interface
 */
interface RecoveryOperation {
    id: string;
    name: string;
    execute: (context: ValidationContext | TaskExecutionContext, error: Error) => Promise<boolean>;
    timeout: number;
}
/**
 * Validation failure handler with comprehensive retry and recovery mechanisms
 */
export declare class ValidationFailureHandler extends EventEmitter {
    private readonly logger;
    private readonly config;
    private readonly circuitBreakers;
    private readonly failureRecords;
    private readonly recoveryOperations;
    private readonly metrics;
    constructor(config?: Partial<ValidationFailureHandlerConfig>);
    /**
     * Handle validation failure with appropriate strategy
     */
    handleValidationFailure<T = ValidationResult[] | WorkflowExecutionResult>(error: Error, context: ValidationContext | TaskExecutionContext, originalOperation: () => Promise<T>): Promise<T>;
    /**
     * Execute handling strategy
     */
    private executeHandlingStrategy;
    /**
     * Execute immediate retry strategy
     */
    private executeImmediateRetry;
    /**
     * Execute exponential backoff retry strategy
     */
    private executeExponentialBackoff;
    /**
     * Execute linear backoff retry strategy
     */
    private executeLinearBackoff;
    /**
     * Execute circuit breaker strategy
     */
    private executeCircuitBreaker;
    /**
     * Execute fallback strategy
     */
    private executeFallback;
    /**
     * Execute escalation strategy
     */
    private executeEscalation;
    /**
     * Determine appropriate handling strategy
     */
    private determineHandlingStrategy;
    /**
     * Check if error is retryable
     */
    private isRetryable;
    /**
     * Record failure for tracking and analytics
     */
    private recordFailure;
    /**
     * Update failure metrics
     */
    private updateMetrics;
    /**
     * Get or create circuit breaker
     */
    private getOrCreateCircuitBreaker;
    /**
     * Get circuit breaker key from context
     */
    private getCircuitBreakerKey;
    /**
     * Update circuit breaker monitoring window
     */
    private updateCircuitBreakerWindow;
    /**
     * Check if fallback should be used
     */
    private shouldUseFallback;
    /**
     * Create skip result for fallback
     */
    private createSkipResult;
    /**
     * Create default result for fallback
     */
    private createDefaultResult;
    /**
     * Execute alternative operation for fallback
     */
    private executeAlternative;
    /**
     * Execute escalation actions
     */
    private executeEscalationActions;
    /**
     * Send escalation notifications
     */
    private sendNotifications;
    /**
     * Register default recovery operations
     */
    private registerDefaultRecoveryOperations;
    /**
     * Get task ID from context
     */
    private getTaskId;
    /**
     * Sleep utility
     */
    private sleep;
    /**
     * Get failure handler statistics
     */
    getStatistics(): {
        totalFailures: number;
        totalRetries: number;
        totalRecoveries: number;
        avgRecoveryTime: number;
        activeCircuitBreakers: number;
        failuresByCategory: Record<string, number>;
        failuresBySeverity: Record<string, number>;
    };
    /**
     * Reset circuit breaker
     */
    resetCircuitBreaker(key: string): boolean;
    /**
     * Add recovery operation
     */
    addRecoveryOperation(operation: RecoveryOperation): void;
}
export {};
