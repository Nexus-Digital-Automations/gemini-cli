/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { EventEmitter } from 'node:events';
import type { ValidationFramework, ValidationResult } from './ValidationFramework.js';
import type { ValidationSeverity } from './ValidationFramework.js';
import type { TaskValidator, TaskExecutionMetrics } from './TaskValidator.js';
import type { Task, TaskResult } from '../task-management/types.js';
/**
 * Quality assurance events for monitoring and alerting
 */
export interface QualityAssuranceEvents {
    qualityCheckStarted: [taskId: string, checkType: QualityCheckType];
    qualityCheckCompleted: [result: QualityAssuranceResult];
    qualityThresholdViolation: [violation: QualityViolation];
    qualityTrendDetected: [trend: QualityTrend];
    qualityReportGenerated: [report: QualityReport];
    qualityAlertTriggered: [alert: QualityAlert];
}
/**
 * Types of quality checks performed
 */
export declare enum QualityCheckType {
    CODE_QUALITY = "code_quality",
    PERFORMANCE = "performance",
    SECURITY = "security",
    RELIABILITY = "reliability",
    MAINTAINABILITY = "maintainability",
    COMPLIANCE = "compliance",
    FUNCTIONAL = "functional",
    INTEGRATION = "integration"
}
/**
 * Quality metrics for comprehensive assessment
 */
export interface QualityMetrics {
    codeQuality: {
        complexity: number;
        maintainability: number;
        testCoverage: number;
        codeSmells: number;
        technicalDebt: number;
        duplication: number;
    };
    performance: {
        executionTime: number;
        memoryUsage: number;
        cpuUtilization: number;
        throughput: number;
        responseTime: number;
        resourceEfficiency: number;
    };
    security: {
        vulnerabilities: number;
        securityScore: number;
        exposedSecrets: number;
        complianceViolations: number;
        accessControlIssues: number;
        encryptionCoverage: number;
    };
    reliability: {
        errorRate: number;
        failureRate: number;
        recoveryTime: number;
        uptime: number;
        resilience: number;
        faultTolerance: number;
    };
    business: {
        userSatisfaction: number;
        featureCompleteness: number;
        requirementsCoverage: number;
        businessValue: number;
        roi: number;
        timeToMarket: number;
    };
}
/**
 * Quality thresholds for different metrics
 */
export interface QualityThresholds {
    codeQuality: {
        minComplexity: number;
        maxComplexity: number;
        minMaintainability: number;
        minTestCoverage: number;
        maxCodeSmells: number;
        maxTechnicalDebt: number;
        maxDuplication: number;
    };
    performance: {
        maxExecutionTime: number;
        maxMemoryUsage: number;
        maxCpuUtilization: number;
        minThroughput: number;
        maxResponseTime: number;
        minResourceEfficiency: number;
    };
    security: {
        maxVulnerabilities: number;
        minSecurityScore: number;
        maxExposedSecrets: number;
        maxComplianceViolations: number;
        maxAccessControlIssues: number;
        minEncryptionCoverage: number;
    };
    reliability: {
        maxErrorRate: number;
        maxFailureRate: number;
        maxRecoveryTime: number;
        minUptime: number;
        minResilience: number;
        minFaultTolerance: number;
    };
    business: {
        minUserSatisfaction: number;
        minFeatureCompleteness: number;
        minRequirementsCoverage: number;
        minBusinessValue: number;
        minRoi: number;
        maxTimeToMarket: number;
    };
}
/**
 * Quality violation details
 */
export interface QualityViolation {
    id: string;
    taskId: string;
    metric: string;
    category: QualityCheckType;
    severity: ValidationSeverity;
    actualValue: number;
    thresholdValue: number;
    violationType: 'above_threshold' | 'below_threshold';
    impact: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    recommendations: string[];
    timestamp: Date;
    metadata?: Record<string, unknown>;
}
/**
 * Quality trends analysis
 */
export interface QualityTrend {
    metric: string;
    category: QualityCheckType;
    trend: 'improving' | 'degrading' | 'stable';
    changeRate: number;
    timeframe: string;
    dataPoints: Array<{
        timestamp: Date;
        value: number;
    }>;
    prediction?: {
        nextValue: number;
        confidence: number;
        timeframe: string;
    };
}
/**
 * Quality alert configuration
 */
export interface QualityAlert {
    id: string;
    type: 'threshold_violation' | 'trend_degradation' | 'anomaly_detected';
    severity: 'info' | 'warning' | 'critical';
    message: string;
    details: string;
    taskId?: string;
    metrics: string[];
    timestamp: Date;
    requiresAction: boolean;
    suggestedActions: string[];
}
/**
 * Comprehensive quality assurance result
 */
export interface QualityAssuranceResult {
    id: string;
    taskId: string;
    checkType: QualityCheckType;
    timestamp: Date;
    duration: number;
    passed: boolean;
    overallScore: number;
    metrics: QualityMetrics;
    violations: QualityViolation[];
    trends: QualityTrend[];
    recommendations: QualityRecommendation[];
    validationResults: ValidationResult[];
    metadata?: Record<string, unknown>;
}
/**
 * Quality improvement recommendations
 */
export interface QualityRecommendation {
    id: string;
    category: QualityCheckType;
    priority: 'low' | 'medium' | 'high' | 'critical';
    title: string;
    description: string;
    impact: string;
    effort: 'minimal' | 'low' | 'medium' | 'high';
    expectedImprovement: number;
    implementation: {
        steps: string[];
        tools: string[];
        estimatedTime: number;
    };
    relatedMetrics: string[];
}
/**
 * Quality report for comprehensive analysis
 */
export interface QualityReport {
    id: string;
    timestamp: Date;
    timeframe: {
        start: Date;
        end: Date;
    };
    summary: {
        totalChecks: number;
        passedChecks: number;
        failedChecks: number;
        averageScore: number;
        trendsImproving: number;
        trendsDegrading: number;
    };
    metricsSummary: {
        [category in QualityCheckType]: {
            averageScore: number;
            violationsCount: number;
            trendsImproving: number;
            trendsDegrading: number;
        };
    };
    topViolations: QualityViolation[];
    keyTrends: QualityTrend[];
    criticalRecommendations: QualityRecommendation[];
    comparisonWithPrevious?: {
        scoreChange: number;
        violationsChange: number;
        trendsChange: number;
    };
}
/**
 * Quality Assurance configuration
 */
export interface QualityAssuranceConfig {
    enabledChecks: QualityCheckType[];
    thresholds: QualityThresholds;
    trending: {
        enabled: boolean;
        windowSize: number;
        minDataPoints: number;
        analysisInterval: number;
    };
    alerting: {
        enabled: boolean;
        thresholdViolations: boolean;
        trendDegradation: boolean;
        anomalyDetection: boolean;
    };
    reporting: {
        enabled: boolean;
        interval: number;
        retentionDays: number;
        autoGenerate: boolean;
    };
    customChecks?: Map<string, (task: Task, metrics: QualityMetrics) => Promise<ValidationResult[]>>;
}
/**
 * Comprehensive Quality Assurance System for Autonomous Task Management
 *
 * Provides automated quality checks, trend analysis, alerting, and reporting
 * for maintaining high quality standards in autonomous task execution.
 */
export declare class QualityAssurance extends EventEmitter {
    private readonly logger;
    private readonly validationFramework;
    private readonly config;
    private readonly qualityHistory;
    private readonly metricsHistory;
    private readonly activeChecks;
    constructor(validationFramework: ValidationFramework, _taskValidator: TaskValidator, config?: Partial<QualityAssuranceConfig>);
    /**
     * Create default configuration with overrides
     */
    private createDefaultConfig;
    /**
     * Get default quality thresholds
     */
    private getDefaultThresholds;
    /**
     * Setup quality check validation rules
     */
    private setupQualityChecks;
    /**
     * Map quality check type to validation category
     */
    private mapCheckTypeToCategory;
    /**
     * Execute comprehensive quality assurance for a task
     */
    performQualityAssurance(task: Task, taskResult?: TaskResult, executionMetrics?: TaskExecutionMetrics): Promise<QualityAssuranceResult>;
    /**
     * Execute comprehensive quality check
     */
    private executeComprehensiveQualityCheck;
    /**
     * Collect comprehensive quality metrics
     */
    private collectQualityMetrics;
    /**
     * Perform specific quality check
     */
    private performSpecificQualityCheck;
    /**
     * Quality check implementations
     */
    private checkCodeQuality;
    private checkPerformance;
    private checkSecurity;
    private checkReliability;
    /**
     * Helper methods for metric calculations
     */
    private calculateComplexity;
    private calculateMaintainability;
    private calculateTestCoverage;
    /**
     * Additional helper methods
     */
    private analyzeViolations;
    private calculateOverallQualityScore;
    private generateQualityRecommendations;
    private analyzeTrends;
    private storeQualityResult;
    private checkForAlerts;
    private startPeriodicTasks;
    private performTrendAnalysis;
    private generateQualityReport;
    /**
     * Public API methods
     */
    /**
     * Get quality statistics
     */
    getQualityStatistics(): {
        activeChecks: number;
        totalResults: number;
        averageScore: number;
        topViolations: string[];
        trendingMetrics: string[];
    };
    /**
     * Update quality thresholds
     */
    updateQualityThresholds(thresholds: Partial<QualityThresholds>): void;
    /**
     * Register custom quality check
     */
    registerCustomCheck(checkType: string, checker: (task: Task, metrics: QualityMetrics) => Promise<ValidationResult[]>): void;
    /**
     * Execute quality check for a specific type
     */
    private executeQualityCheck;
    /**
     * Clean up resources
     */
    cleanup(): Promise<void>;
}
