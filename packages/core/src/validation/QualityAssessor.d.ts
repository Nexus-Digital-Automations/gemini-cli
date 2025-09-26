/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { EventEmitter } from 'node:events';
import type { ValidationResult } from './ValidationFramework.js';
import type { Task, TaskResult } from '../task-management/types.js';
/**
 * Quality assessment levels for different validation strictness
 */
export declare enum QualityAssessmentLevel {
    BASIC = "basic",// Basic quality checks
    STANDARD = "standard",// Standard industry quality checks
    RIGOROUS = "rigorous",// Rigorous quality assurance
    ENTERPRISE = "enterprise"
}
/**
 * Quality metrics for comprehensive assessment
 */
export interface QualityMetrics {
    overallScore: number;
    functionalScore: number;
    performanceScore: number;
    securityScore: number;
    maintainabilityScore: number;
    reliabilityScore: number;
    testCoverage: number;
    codeComplexity: number;
    technicalDebt: number;
    documentationQuality: number;
}
/**
 * Quality assessment criteria configuration
 */
export interface QualityAssessmentCriteria {
    minimumOverallScore: number;
    minimumFunctionalScore: number;
    minimumPerformanceScore: number;
    minimumSecurityScore: number;
    minimumMaintainabilityScore: number;
    minimumReliabilityScore: number;
    minimumTestCoverage: number;
    maximumCodeComplexity: number;
    maximumTechnicalDebt: number;
    minimumDocumentationQuality: number;
    maxCriticalIssues: number;
    maxHighSeverityIssues: number;
    maxMediumSeverityIssues: number;
    maxExecutionTime: number;
    maxMemoryUsage: number;
    maxErrorRate: number;
    customCriteria?: Map<string, (context: QualityAssessmentContext) => Promise<boolean>>;
}
/**
 * Quality assessment context
 */
export interface QualityAssessmentContext {
    task: Task;
    taskResult?: TaskResult;
    validationResults?: ValidationResult[];
    executionMetrics?: {
        duration: number;
        memoryUsage: number;
        cpuUsage: number;
        errorCount: number;
        warningCount: number;
    };
    testResults?: {
        totalTests: number;
        passedTests: number;
        failedTests: number;
        coverage: number;
    };
    codeAnalysis?: {
        linesOfCode: number;
        cyclomaticComplexity: number;
        maintainabilityIndex: number;
        technicalDebtRatio: number;
    };
    securityScan?: {
        vulnerabilities: Array<{
            severity: 'low' | 'medium' | 'high' | 'critical';
            type: string;
            description: string;
        }>;
        complianceScore: number;
    };
    metadata?: Record<string, unknown>;
}
/**
 * Quality assessment result
 */
export interface QualityAssessmentResult {
    taskId: string;
    timestamp: Date;
    assessmentLevel: QualityAssessmentLevel;
    passed: boolean;
    metrics: QualityMetrics;
    issues: QualityIssue[];
    recommendations: QualityRecommendation[];
    improvementPlan?: QualityImprovementPlan;
    certification?: QualityCertification;
    metadata?: Record<string, unknown>;
}
/**
 * Quality issue identification
 */
export interface QualityIssue {
    id: string;
    category: 'functional' | 'performance' | 'security' | 'maintainability' | 'reliability' | 'testing';
    severity: 'low' | 'medium' | 'high' | 'critical';
    title: string;
    description: string;
    location?: {
        file?: string;
        line?: number;
        column?: number;
    };
    impact: string;
    remediation: string;
    effort: 'minimal' | 'low' | 'medium' | 'high' | 'significant';
    priority: number;
}
/**
 * Quality improvement recommendations
 */
export interface QualityRecommendation {
    type: 'immediate' | 'short_term' | 'long_term';
    category: 'functional' | 'performance' | 'security' | 'maintainability' | 'reliability' | 'testing';
    priority: number;
    title: string;
    description: string;
    actions: string[];
    expectedImpact: string;
    estimatedEffort: string;
    dependencies?: string[];
    success_criteria: string[];
}
/**
 * Quality improvement plan
 */
export interface QualityImprovementPlan {
    phases: Array<{
        name: string;
        duration: string;
        objectives: string[];
        deliverables: string[];
        resources: string[];
        risks: string[];
    }>;
    totalEstimatedDuration: string;
    priorityRecommendations: QualityRecommendation[];
    quickWins: QualityRecommendation[];
    longTermGoals: string[];
}
/**
 * Quality certification result
 */
export interface QualityCertification {
    level: 'bronze' | 'silver' | 'gold' | 'platinum';
    score: number;
    criteria_met: string[];
    criteria_missed: string[];
    valid_until?: Date;
    certified_by: string;
    certification_id: string;
}
/**
 * Quality assessor events
 */
export interface QualityAssessorEvents {
    assessmentStarted: [taskId: string, level: QualityAssessmentLevel];
    assessmentCompleted: [result: QualityAssessmentResult];
    assessmentFailed: [taskId: string, error: Error];
    qualityIssueDetected: [taskId: string, issue: QualityIssue];
    qualityImproved: [taskId: string, oldScore: number, newScore: number];
    certificationEarned: [taskId: string, certification: QualityCertification];
}
/**
 * Comprehensive Quality Assessor for Result Validation and Quality Assessment
 *
 * Provides advanced quality assessment capabilities including:
 * - Multi-dimensional quality scoring
 * - Quality issue detection and classification
 * - Improvement recommendations and planning
 * - Quality certification
 * - Continuous quality monitoring
 */
export declare class QualityAssessor extends EventEmitter {
    private readonly logger;
    private readonly assessmentCriteria;
    private readonly activeAssessments;
    private readonly qualityHistory;
    private readonly customAssessors;
    constructor();
    /**
     * Initialize default quality assessment criteria for each level
     */
    private initializeDefaultCriteria;
    /**
     * Register default quality assessors
     */
    private registerDefaultAssessors;
    /**
     * Perform comprehensive quality assessment
     */
    assessQuality(context: QualityAssessmentContext, level?: QualityAssessmentLevel): Promise<QualityAssessmentResult>;
    /**
     * Execute comprehensive quality assessment cycle
     */
    private executeQualityAssessment;
    /**
     * Calculate comprehensive quality metrics
     */
    private calculateQualityMetrics;
    /**
     * Calculate overall quality score from component metrics
     */
    private calculateOverallScore;
    /**
     * Detect quality issues based on metrics and criteria
     */
    private detectQualityIssues;
    /**
     * Generate quality improvement recommendations
     */
    private generateQualityRecommendations;
    /**
     * Create quality improvement plan
     */
    private createQualityImprovementPlan;
    /**
     * Evaluate if quality assessment passes criteria
     */
    private evaluateQualityPass;
    /**
     * Generate quality certification
     */
    private generateQualityCertification;
    /**
     * Determine certification level based on quality score
     */
    private determineCertificationLevel;
    /**
     * Get criteria that were met
     */
    private getCriteriaMet;
    /**
     * Get criteria that were missed
     */
    private getCriteriaMissed;
    /**
     * Individual quality assessors
     */
    /**
     * Assess functional quality
     */
    private assessFunctionalQuality;
    /**
     * Assess performance quality
     */
    private assessPerformanceQuality;
    /**
     * Assess security quality
     */
    private assessSecurityQuality;
    /**
     * Assess maintainability quality
     */
    private assessMaintainabilityQuality;
    /**
     * Assess reliability quality
     */
    private assessReliabilityQuality;
    /**
     * Helper methods
     */
    private shouldCreateImprovementPlan;
    private updateQualityHistory;
    /**
     * Public API methods
     */
    /**
     * Register custom quality assessor
     */
    registerCustomAssessor(name: string, assessor: (context: QualityAssessmentContext) => Promise<Partial<QualityMetrics>>): void;
    /**
     * Update assessment criteria for a level
     */
    updateAssessmentCriteria(level: QualityAssessmentLevel, criteria: Partial<QualityAssessmentCriteria>): void;
    /**
     * Get quality history for a task
     */
    getQualityHistory(taskId: string): QualityMetrics[];
    /**
     * Get quality assessor statistics
     */
    getStatistics(): {
        activeAssessments: number;
        customAssessors: number;
        totalQualityHistoryEntries: number;
        assessmentLevels: QualityAssessmentLevel[];
    };
    /**
     * Clean up resources
     */
    cleanup(): Promise<void>;
}
