/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ValidationResult, ValidationSeverity } from '../core/ValidationEngine.js';
/**
 * Quality scoring weights configuration
 */
export interface ScoringWeights {
    severity: Record<ValidationSeverity, number>;
    category: Record<string, number>;
    status: Record<string, number>;
    temporal: {
        recentFailures: number;
        improvementTrend: number;
        stabilityBonus: number;
    };
}
/**
 * Quality assessment metrics
 */
export interface QualityAssessment {
    overallScore: number;
    categoryScores: Record<string, number>;
    severityBreakdown: Record<ValidationSeverity, number>;
    trends: {
        improving: boolean;
        stable: boolean;
        degrading: boolean;
        confidence: number;
    };
    recommendations: QualityRecommendation[];
    metadata: {
        assessmentTimestamp: Date;
        dataPoints: number;
        confidenceLevel: number;
    };
}
/**
 * Quality improvement recommendations
 */
export interface QualityRecommendation {
    id: string;
    type: 'improvement' | 'optimization' | 'prevention' | 'investigation';
    priority: 'low' | 'medium' | 'high' | 'critical';
    title: string;
    description: string;
    impact: {
        estimated: number;
        confidence: number;
        effort: 'low' | 'medium' | 'high';
    };
    actionItems: string[];
    category: string;
}
/**
 * Historical quality data point
 */
export interface QualityDataPoint {
    timestamp: Date;
    taskId: string;
    score: number;
    results: ValidationResult[];
    context: Record<string, any>;
}
/**
 * Advanced quality scoring and assessment system
 *
 * Features:
 * - Intelligent multi-factor scoring algorithms
 * - Trend analysis and prediction
 * - Category-specific quality assessment
 * - Automated improvement recommendations
 * - Historical quality tracking
 * - Confidence-based assessments
 */
export declare class QualityScorer {
    private readonly logger;
    private readonly scoringWeights;
    private readonly qualityHistory;
    private readonly maxHistorySize;
    constructor();
    /**
     * Calculate overall quality score from validation results
     */
    calculateOverallScore(results: ValidationResult[]): number;
    /**
     * Generate comprehensive quality assessment
     */
    assessQuality(results: ValidationResult[], taskId: string, context?: Record<string, any>): QualityAssessment;
    /**
     * Calculate base quality score from validation results
     */
    private calculateBaseScore;
    /**
     * Calculate severity-based score adjustment
     */
    private calculateSeverityAdjustment;
    /**
     * Calculate category balance factor
     */
    private calculateCategoryBalance;
    /**
     * Calculate completeness bonus
     */
    private calculateCompletenessBonus;
    /**
     * Calculate trend-based adjustment
     */
    private calculateTrendAdjustment;
    /**
     * Calculate category-specific scores
     */
    private calculateCategoryScores;
    /**
     * Calculate severity breakdown
     */
    private calculateSeverityBreakdown;
    /**
     * Analyze quality trends
     */
    private analyzeTrends;
    /**
     * Generate quality improvement recommendations
     */
    private generateRecommendations;
    /**
     * Calculate confidence level for assessment
     */
    private calculateConfidenceLevel;
    /**
     * Store quality data for historical analysis
     */
    private storeQualityData;
    /**
     * Calculate trend slope using linear regression
     */
    private calculateTrendSlope;
    /**
     * Calculate variance of values
     */
    private calculateVariance;
    /**
     * Identify missing validation categories
     */
    private identifyMissingCategories;
    /**
     * Get default scoring weights
     */
    private getDefaultScoringWeights;
    /**
     * Update scoring weights configuration
     */
    updateScoringWeights(weights: Partial<ScoringWeights>): void;
    /**
     * Get quality statistics and insights
     */
    getQualityStatistics(): {
        totalAssessments: number;
        averageScore: number;
        trend: string;
        distribution: {};
        insights: never[];
    } | {
        totalAssessments: number;
        averageScore: number;
        trend: string;
        distribution: {
            excellent: number;
            good: number;
            fair: number;
            poor: number;
        };
        insights: string[];
    };
    /**
     * Clear quality history (for testing or reset)
     */
    clearHistory(): void;
}
