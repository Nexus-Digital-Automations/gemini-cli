/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Quota management and rate limiting system
 * Provides comprehensive quota tracking, rate limiting, and usage control
 *
 * @author Claude Code - Real-Time Token Usage Monitoring Agent
 * @version 1.0.0
 */
import { EventEmitter } from 'node:events';
import type { BudgetValidationResult } from '../types.js';
/**
 * Quota limit configuration
 */
export interface QuotaLimit {
    /** Limit identifier */
    id: string;
    /** Human-readable name */
    name: string;
    /** Limit type */
    type: 'requests' | 'tokens' | 'cost' | 'custom';
    /** Maximum allowed value */
    maxValue: number;
    /** Time window in milliseconds */
    windowMs: number;
    /** Reset behavior */
    resetBehavior: 'sliding' | 'fixed';
    /** Whether this limit is currently active */
    enabled: boolean;
    /** Priority level (higher = more important) */
    priority: number;
    /** Action to take when limit is exceeded */
    action: 'block' | 'throttle' | 'warn' | 'log';
}
/**
 * Rate limiting configuration
 */
export interface RateLimitConfig {
    /** Maximum requests per time window */
    maxRequests: number;
    /** Time window in milliseconds */
    windowMs: number;
    /** Burst allowance */
    burstLimit?: number;
    /** Recovery rate (requests per second) */
    recoveryRate?: number;
    /** Rate limiting strategy */
    strategy: 'fixed_window' | 'sliding_window' | 'token_bucket' | 'leaky_bucket';
}
/**
 * Quota usage tracking
 */
export interface QuotaUsage {
    /** Quota limit ID */
    limitId: string;
    /** Current usage value */
    currentUsage: number;
    /** Maximum allowed value */
    maxValue: number;
    /** Usage percentage */
    usagePercentage: number;
    /** Time window start */
    windowStart: Date;
    /** Time window end */
    windowEnd: Date;
    /** Whether limit is currently exceeded */
    isExceeded: boolean;
    /** Time until next reset */
    timeToReset: number;
    /** Recent usage history */
    recentUsage: Array<{
        timestamp: Date;
        value: number;
    }>;
}
/**
 * Throttling configuration
 */
export interface ThrottleConfig {
    /** Throttle factor (0-1, where 1 = no throttling) */
    factor: number;
    /** Minimum delay between requests (ms) */
    minDelay: number;
    /** Maximum delay between requests (ms) */
    maxDelay: number;
    /** Backoff strategy */
    backoffStrategy: 'linear' | 'exponential' | 'random';
}
/**
 * Quota violation information
 */
export interface QuotaViolation {
    /** Violation ID */
    id: string;
    /** Quota limit that was violated */
    limit: QuotaLimit;
    /** Usage at time of violation */
    usage: QuotaUsage;
    /** Violation timestamp */
    timestamp: Date;
    /** Severity of violation */
    severity: 'warning' | 'critical';
    /** Action taken */
    actionTaken: string;
    /** Recovery estimate */
    estimatedRecoveryTime?: Date;
}
/**
 * Quota manager configuration
 */
export interface QuotaManagerConfig {
    /** Default quota limits */
    defaultLimits?: QuotaLimit[];
    /** Rate limiting configuration */
    rateLimitConfig?: RateLimitConfig;
    /** Throttling configuration */
    throttleConfig?: ThrottleConfig;
    /** Enable automatic quota adjustment */
    enableAutoAdjustment?: boolean;
    /** Grace period for quota violations (ms) */
    gracePeriodMs?: number;
    /** Enable quota violation logging */
    enableViolationLogging?: boolean;
}
/**
 * Comprehensive quota management and rate limiting system
 *
 * This class provides advanced quota management capabilities including
 * multiple rate limiting strategies, dynamic quota adjustment, violation
 * tracking, and intelligent throttling. It integrates with the budget
 * system to enforce spending limits and usage controls.
 *
 * Features:
 * - Multiple rate limiting strategies (token bucket, sliding window, etc.)
 * - Dynamic quota limits based on usage patterns
 * - Intelligent throttling with backoff strategies
 * - Quota violation tracking and recovery
 * - Integration with budget enforcement
 * - Real-time usage monitoring and alerts
 */
export declare class QuotaManager extends EventEmitter {
    private readonly logger;
    private readonly config;
    private readonly quotaLimits;
    private readonly quotaUsage;
    private readonly rateLimiters;
    private readonly violations;
    private throttleActive;
    private currentThrottleDelay;
    constructor(config?: QuotaManagerConfig);
    /**
     * Check if a request is allowed based on all quota limits
     */
    checkRequestAllowed(requestType: 'api_call' | 'token_usage' | 'cost', value: number, context?: {
        model?: string;
        feature?: string;
        sessionId?: string;
        userId?: string;
    }): Promise<BudgetValidationResult>;
    /**
     * Record usage against quota limits
     */
    recordUsage(requestType: 'api_call' | 'token_usage' | 'cost', value: number, context?: {
        model?: string;
        feature?: string;
        sessionId?: string;
        userId?: string;
    }): Promise<void>;
    /**
     * Add or update a quota limit
     */
    addQuotaLimit(limit: QuotaLimit): void;
    /**
     * Remove a quota limit
     */
    removeQuotaLimit(limitId: string): boolean;
    /**
     * Get current quota usage for all limits
     */
    getQuotaUsage(): Record<string, QuotaUsage>;
    /**
     * Get quota violations
     */
    getViolations(): QuotaViolation[];
    /**
     * Reset quota usage for a specific limit
     */
    resetQuotaUsage(limitId: string): Promise<boolean>;
    /**
     * Enable or disable throttling
     */
    setThrottling(enabled: boolean, config?: Partial<ThrottleConfig>): void;
    /**
     * Get current throttling status
     */
    getThrottlingStatus(): {
        active: boolean;
        currentDelay: number;
        config: ThrottleConfig;
    };
    /**
     * Check rate limiting
     */
    private checkRateLimit;
    /**
     * Check specific quota limit
     */
    private checkQuotaLimit;
    /**
     * Apply throttling logic
     */
    private applyThrottling;
    /**
     * Handle quota violation
     */
    private handleQuotaViolation;
    default: break;
}
/**
 * Create a new QuotaManager instance
 */
export declare function createQuotaManager(config?: QuotaManagerConfig): QuotaManager;
/**
 * Get or create the global quota manager instance
 */
export declare function getGlobalQuotaManager(config?: QuotaManagerConfig): QuotaManager;
/**
 * Reset the global quota manager instance
 */
export declare function resetGlobalQuotaManager(): void;
