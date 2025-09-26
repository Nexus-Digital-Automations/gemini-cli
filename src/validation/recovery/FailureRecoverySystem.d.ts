/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * @fileoverview Validation failure recovery and remediation system
 * Provides automatic recovery strategies for validation failures
 *
 * @author Claude Code - Validation Agent
 * @version 1.0.0
 */
import { EventEmitter } from 'node:events';
import type { ValidationReport, ValidationResult, ValidationContext } from '../core/ValidationEngine.js';
/**
 * Recovery strategy types
 */
export declare enum RecoveryStrategy {
    RETRY = "retry",
    ESCALATE = "escalate",
    AUTOFIX = "autofix",
    ROLLBACK = "rollback",
    DEFER = "defer",
    SKIP = "skip"
}
/**
 * Recovery action configuration
 */
export interface RecoveryAction {
    id: string;
    strategy: RecoveryStrategy;
    name: string;
    description: string;
    condition: (failure: ValidationFailure) => boolean;
    execute: (failure: ValidationFailure, context: RecoveryContext) => Promise<RecoveryResult>;
    priority: number;
    maxAttempts: number;
    timeout: number;
    cooldownPeriod: number;
}
/**
 * Validation failure details
 */
export interface ValidationFailure {
    taskId: string;
    criteriaId: string;
    validationResult: ValidationResult;
    context: ValidationContext;
    failureTime: Date;
    attemptCount: number;
    lastAttempt?: Date;
    severity: 'critical' | 'high' | 'medium' | 'low';
    category: 'build' | 'test' | 'lint' | 'security' | 'performance' | 'other';
    errorType: 'transient' | 'persistent' | 'configuration' | 'environmental';
    metadata: Record<string, unknown>;
}
/**
 * Recovery context
 */
export interface RecoveryContext {
    taskId: string;
    originalContext: ValidationContext;
    failureHistory: ValidationFailure[];
    systemState: {
        resources: {
            cpu: number;
            memory: number;
            disk: number;
        };
        network: {
            available: boolean;
            latency: number;
        };
        dependencies: {
            available: string[];
            unavailable: string[];
        };
    };
    retryCount: number;
    maxRetries: number;
    timeRemaining: number;
}
/**
 * Recovery result
 */
export interface RecoveryResult {
    success: boolean;
    strategy: RecoveryStrategy;
    action: string;
    message: string;
    details: string;
    nextAction?: RecoveryStrategy;
    retryAfter?: number;
    permanent?: boolean;
    evidence: Array<{
        type: string;
        content: string;
        metadata: Record<string, unknown>;
    }>;
    metrics: {
        duration: number;
        resourcesUsed: Record<string, number>;
        costEstimate: number;
    };
}
/**
 * Recovery statistics
 */
export interface RecoveryStats {
    totalFailures: number;
    recoveredFailures: number;
    recoveryRate: number;
    averageRecoveryTime: number;
    strategiesUsed: Record<RecoveryStrategy, number>;
    commonFailureTypes: Array<{
        type: string;
        count: number;
        recoveryRate: number;
    }>;
    trends: {
        failureRate: 'improving' | 'stable' | 'degrading';
        recoveryEffectiveness: 'improving' | 'stable' | 'degrading';
    };
}
/**
 * Comprehensive validation failure recovery system
 *
 * Features:
 * - Intelligent failure classification
 * - Multiple recovery strategies
 * - Automatic retry with backoff
 * - Context-aware recovery decisions
 * - Failure pattern learning
 * - Resource-aware recovery
 * - Escalation mechanisms
 * - Recovery performance tracking
 */
export declare class FailureRecoverySystem extends EventEmitter {
    private readonly logger;
    private readonly recoveryActions;
    private readonly failureHistory;
    private readonly recoveryHistory;
    private readonly maxHistorySize;
    constructor();
    /**
     * Process validation failure and attempt recovery
     */
    handleValidationFailure(validationReport: ValidationReport): Promise<RecoveryResult[]>;
    /**
     * Register custom recovery action
     */
    registerRecoveryAction(action: RecoveryAction): void;
    /**
     * Extract failures from validation report
     */
    private extractFailures;
    /**
     * Attempt recovery from specific failure
     */
    private recoverFromFailure;
    /**
     * Build recovery context
     */
    private buildRecoveryContext;
    /**
     * Get current system state
     */
    private getSystemState;
    /**
     * Get applicable recovery actions for failure
     */
    private getApplicableRecoveryActions;
    /**
     * Classify failure severity
     */
    private classifyFailureSeverity;
    /**
     * Classify failure category
     */
    private classifyFailureCategory;
    /**
     * Classify error type
     */
    private classifyErrorType;
    /**
     * Store failure for history tracking
     */
    private storeFailure;
    /**
     * Store recovery result for analysis
     */
    private storeRecoveryResult;
    /**
     * Initialize default recovery actions
     */
    private initializeDefaultRecoveryActions;
    /**
     * Get recovery statistics
     */
    getRecoveryStatistics(): RecoveryStats;
    /**
     * Clear recovery history (for testing or reset)
     */
    clearHistory(): void;
    /**
     * Shutdown recovery system
     */
    shutdown(): Promise<void>;
}
