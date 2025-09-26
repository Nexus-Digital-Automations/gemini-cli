/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * System Validation and Readiness Service
 *
 * Provides comprehensive system validation and readiness checks for the autonomous task management system:
 * - Component integration validation
 * - System health verification
 * - Performance benchmarking
 * - Production readiness assessment
 * - End-to-end workflow testing
 * - Compliance and security validation
 */
import { EventEmitter } from 'node:events';
import type { Config } from '../index.js';
import type { AutonomousTaskIntegrator } from './autonomousTaskIntegrator.js';
import type { IntegrationBridge } from './integrationBridge.js';
import type { SystemMonitor } from './systemMonitor.js';
export interface ValidationResult {
    category: string;
    name: string;
    status: 'passed' | 'warning' | 'failed' | 'skipped';
    score: number;
    details: string;
    metrics?: Record<string, number>;
    errors?: string[];
    warnings?: string[];
    recommendations?: string[];
    executionTime: number;
}
export interface SystemReadinessReport {
    timestamp: Date;
    overallStatus: 'ready' | 'partial' | 'not_ready';
    overallScore: number;
    readinessLevel: 'production' | 'staging' | 'development' | 'testing';
    summary: {
        totalChecks: number;
        passed: number;
        warnings: number;
        failed: number;
        skipped: number;
    };
    categories: {
        [category: string]: {
            score: number;
            status: 'passed' | 'warning' | 'failed';
            checks: ValidationResult[];
        };
    };
    criticalIssues: string[];
    recommendations: string[];
    performanceMetrics: {
        systemResponseTime: number;
        taskThroughput: number;
        memoryUsage: number;
        cpuUsage: number;
        errorRate: number;
    };
    complianceStatus: {
        security: 'compliant' | 'partial' | 'non_compliant';
        performance: 'acceptable' | 'degraded' | 'unacceptable';
        reliability: 'high' | 'medium' | 'low';
        scalability: 'excellent' | 'good' | 'limited' | 'poor';
    };
}
/**
 * Comprehensive system validation and readiness assessment service
 */
export declare class SystemValidator extends EventEmitter {
    private config;
    private taskIntegrator?;
    private integrationBridge?;
    private systemMonitor?;
    private validationResults;
    constructor(config: Config);
    /**
     * Initialize the validator with system components
     */
    initialize(taskIntegrator: AutonomousTaskIntegrator, integrationBridge: IntegrationBridge, systemMonitor: SystemMonitor): Promise<void>;
    /**
     * Run comprehensive system validation
     */
    validateSystem(): Promise<SystemReadinessReport>;
    /**
     * Validate component integration
     */
    private validateComponentIntegration;
    /**
     * Validate system health
     */
    private validateSystemHealth;
    /**
     * Validate system performance
     */
    private validatePerformance;
    /**
     * Validate system security
     */
    private validateSecurity;
    /**
     * Validate system reliability
     */
    private validateReliability;
    /**
     * Validate system scalability
     */
    private validateScalability;
    /**
     * Validate compliance requirements
     */
    private validateCompliance;
    /**
     * Validate end-to-end workflows
     */
    private validateEndToEndWorkflows;
    /**
     * Run a single validation check
     */
    private runValidation;
    /**
     * Generate comprehensive readiness report
     */
    private generateReadinessReport;
}
