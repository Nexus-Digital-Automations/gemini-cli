/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * @fileoverview Core Validation Engine for autonomous task management system
 * Provides comprehensive task completion validation, quality assessment, and system health monitoring
 *
 * @author Claude Code - Validation Agent
 * @version 1.0.0
 */
import { EventEmitter } from 'node:events';
/**
 * Validation result severity levels
 */
export declare enum ValidationSeverity {
    CRITICAL = "critical",
    HIGH = "high",
    MEDIUM = "medium",
    LOW = "low",
    INFO = "info"
}
/**
 * Task completion validation status
 */
export declare enum ValidationStatus {
    PENDING = "pending",
    VALIDATING = "validating",
    PASSED = "passed",
    FAILED = "failed",
    REQUIRES_REVIEW = "requires_review",
    SKIPPED = "skipped"
}
/**
 * Validation criteria configuration
 */
export interface ValidationCriteria {
    id: string;
    name: string;
    description: string;
    category: 'code_quality' | 'performance' | 'security' | 'functionality' | 'documentation';
    severity: ValidationSeverity;
    enabled: boolean;
    timeout: number;
    retryCount: number;
    validator: (context: ValidationContext) => Promise<ValidationResult>;
}
/**
 * Validation execution context
 */
export interface ValidationContext {
    taskId: string;
    taskType: string;
    artifacts: ValidationArtifact[];
    metadata: Record<string, any>;
    timestamp: Date;
    agent: string;
}
/**
 * Validation artifacts (files, logs, metrics, etc.)
 */
export interface ValidationArtifact {
    type: 'file' | 'log' | 'metric' | 'report' | 'screenshot';
    path: string;
    content?: string | Buffer;
    metadata: Record<string, any>;
}
/**
 * Individual validation result
 */
export interface ValidationResult {
    criteriaId: string;
    status: ValidationStatus;
    score: number;
    severity: ValidationSeverity;
    message: string;
    details: string;
    suggestions: string[];
    evidence: ValidationArtifact[];
    timestamp: Date;
    duration: number;
}
/**
 * Comprehensive validation report
 */
export interface ValidationReport {
    taskId: string;
    overallStatus: ValidationStatus;
    overallScore: number;
    results: ValidationResult[];
    summary: {
        total: number;
        passed: number;
        failed: number;
        critical: number;
        warnings: number;
    };
    performance: {
        totalDuration: number;
        averageScore: number;
        bottlenecks: string[];
    };
    recommendations: string[];
    timestamp: Date;
}
/**
 * Core Validation Engine
 *
 * Orchestrates comprehensive task completion validation with:
 * - Multi-level validation processes
 * - Quality gate enforcement
 * - Performance monitoring
 * - Automated failure recovery
 * - Real-time validation reporting
 */
export declare class ValidationEngine extends EventEmitter {
    private readonly logger;
    private readonly performanceMonitor;
    private readonly qualityScorer;
    private readonly reporter;
    private readonly criteria;
    private readonly activeValidations;
    constructor();
    /**
     * Register validation criteria
     */
    registerCriteria(criteria: ValidationCriteria): void;
    /**
     * Validate task completion comprehensively
     */
    validateTask(context: ValidationContext): Promise<ValidationReport>;
    /**
     * Execute comprehensive validation process
     */
    private executeValidation;
    /**
     * Execute individual validation criteria
     */
    private executeCriteria;
    /**
     * Execute validation with retry logic and timeout
     */
    private executeWithRetry;
    /**
     * Generate comprehensive validation report
     */
    private generateValidationReport;
    /**
     * Calculate validation summary statistics
     */
    private calculateSummary;
    /**
     * Determine overall validation status
     */
    private determineOverallStatus;
    /**
     * Generate actionable recommendations
     */
    private generateRecommendations;
    /**
     * Analyze validation performance
     */
    private analyzePerformance;
    /**
     * Get applicable validation criteria for task type
     */
    private getApplicableCriteria;
    /**
     * Check if criteria is applicable for task type
     */
    private isApplicableForTaskType;
    /**
     * Initialize default validation criteria
     */
    private initializeDefaultCriteria;
    /**
     * Setup event handlers for monitoring and alerting
     */
    private setupEventHandlers;
    /**
     * Get validation engine status and metrics
     */
    getStatus(): {
        activeValidations: number;
        registeredCriteria: number;
        enabledCriteria: number;
        performanceMetrics: import("../monitoring/PerformanceMonitor.js").PerformanceMetrics;
        memoryUsage: NodeJS.MemoryUsage;
    };
    /**
     * Shutdown validation engine gracefully
     */
    shutdown(): Promise<void>;
}
