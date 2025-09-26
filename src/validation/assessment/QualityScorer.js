/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * @fileoverview Quality scoring and assessment system for validation results
 * Provides intelligent quality scoring algorithms and assessment metrics
 *
 * @author Claude Code - Validation Agent
 * @version 1.0.0
 */
import { Logger } from '../../utils/logger.js';
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
export class QualityScorer {
    logger;
    scoringWeights;
    qualityHistory;
    maxHistorySize = 5000;
    constructor() {
        this.logger = new Logger('QualityScorer');
        this.scoringWeights = this.getDefaultScoringWeights();
        this.qualityHistory = [];
    }
    /**
     * Calculate overall quality score from validation results
     */
    calculateOverallScore(results) {
        if (results.length === 0)
            return 0;
        this.logger.debug(`Calculating quality score for ${results.length} validation results`);
        // Multi-factor scoring approach
        const baseScore = this.calculateBaseScore(results);
        const severityAdjustment = this.calculateSeverityAdjustment(results);
        const categoryBalance = this.calculateCategoryBalance(results);
        const completenessBonus = this.calculateCompletenessBonus(results);
        const trendAdjustment = this.calculateTrendAdjustment(results);
        const totalScore = Math.max(0, Math.min(100, baseScore * severityAdjustment * categoryBalance +
            completenessBonus +
            trendAdjustment));
        this.logger.debug('Quality score calculation breakdown', {
            baseScore: baseScore.toFixed(2),
            severityAdjustment: severityAdjustment.toFixed(2),
            categoryBalance: categoryBalance.toFixed(2),
            completenessBonus: completenessBonus.toFixed(2),
            trendAdjustment: trendAdjustment.toFixed(2),
            totalScore: totalScore.toFixed(2),
        });
        return Math.round(totalScore * 100) / 100; // Round to 2 decimal places
    }
    /**
     * Generate comprehensive quality assessment
     */
    assessQuality(results, taskId, context = {}) {
        this.logger.info(`Generating quality assessment for task: ${taskId}`);
        const overallScore = this.calculateOverallScore(results);
        const categoryScores = this.calculateCategoryScores(results);
        const severityBreakdown = this.calculateSeverityBreakdown(results);
        const trends = this.analyzeTrends(results);
        const recommendations = this.generateRecommendations(results, overallScore);
        // Store quality data for historical analysis
        this.storeQualityData({
            timestamp: new Date(),
            taskId,
            score: overallScore,
            results,
            context,
        });
        const assessment = {
            overallScore,
            categoryScores,
            severityBreakdown,
            trends,
            recommendations,
            metadata: {
                assessmentTimestamp: new Date(),
                dataPoints: results.length,
                confidenceLevel: this.calculateConfidenceLevel(results),
            },
        };
        this.logger.info(`Quality assessment completed`, {
            taskId,
            overallScore: overallScore.toFixed(2),
            recommendations: recommendations.length,
            confidence: assessment.metadata.confidenceLevel,
        });
        return assessment;
    }
    /**
     * Calculate base quality score from validation results
     */
    calculateBaseScore(results) {
        if (results.length === 0)
            return 0;
        const weightedSum = results.reduce((sum, result) => {
            const statusWeight = this.scoringWeights.status[result.status] || 0;
            const severityWeight = this.scoringWeights.severity[result.severity] || 1;
            return sum + result.score * statusWeight * severityWeight;
        }, 0);
        const totalWeight = results.reduce((sum, result) => {
            const statusWeight = this.scoringWeights.status[result.status] || 0;
            const severityWeight = this.scoringWeights.severity[result.severity] || 1;
            return sum + statusWeight * severityWeight;
        }, 0);
        return totalWeight > 0 ? weightedSum / totalWeight : 0;
    }
    /**
     * Calculate severity-based score adjustment
     */
    calculateSeverityAdjustment(results) {
        const criticalFailures = results.filter((r) => r.status === 'failed' && r.severity === 'critical').length;
        const highSeverityFailures = results.filter((r) => r.status === 'failed' && r.severity === 'high').length;
        // Heavy penalty for critical failures
        let adjustment = 1.0;
        adjustment -= criticalFailures * 0.3;
        adjustment -= highSeverityFailures * 0.15;
        return Math.max(0.1, adjustment); // Never go below 10%
    }
    /**
     * Calculate category balance factor
     */
    calculateCategoryBalance(results) {
        const categories = [...new Set(results.map((r) => r.criteriaId))];
        if (categories.length === 0)
            return 1.0;
        const categoryPerformance = categories.map((category) => {
            const categoryResults = results.filter((r) => r.criteriaId === category);
            const categoryScore = this.calculateBaseScore(categoryResults);
            const categoryWeight = this.scoringWeights.category[category] || 1;
            return categoryScore * categoryWeight;
        });
        // Balance factor rewards consistent performance across categories
        const avgPerformance = categoryPerformance.reduce((sum, perf) => sum + perf, 0) /
            categoryPerformance.length;
        const variance = categoryPerformance.reduce((sum, perf) => sum + Math.pow(perf - avgPerformance, 2), 0) / categoryPerformance.length;
        // Lower variance = better balance
        const balanceFactor = 1 + Math.max(0, 30 - Math.sqrt(variance)) / 100;
        return Math.min(1.2, balanceFactor); // Cap at 20% bonus
    }
    /**
     * Calculate completeness bonus
     */
    calculateCompletenessBonus(results) {
        const totalExpectedCriteria = 10; // Expected number of validation criteria
        const actualCriteria = results.length;
        if (actualCriteria >= totalExpectedCriteria) {
            return 5; // 5 point bonus for complete validation
        }
        else if (actualCriteria >= totalExpectedCriteria * 0.8) {
            return 2; // 2 point bonus for mostly complete
        }
        return 0;
    }
    /**
     * Calculate trend-based adjustment
     */
    calculateTrendAdjustment(results) {
        // Look at recent quality history for trend analysis
        const recentHistory = this.qualityHistory.slice(-10); // Last 10 assessments
        if (recentHistory.length < 3)
            return 0; // Not enough data
        const scores = recentHistory.map((h) => h.score);
        const trend = this.calculateTrendSlope(scores);
        if (trend > 0.5)
            return 3; // Improving trend bonus
        if (trend < -0.5)
            return -2; // Degrading trend penalty
        return 0; // Stable trend
    }
    /**
     * Calculate category-specific scores
     */
    calculateCategoryScores(results) {
        const categories = [...new Set(results.map((r) => r.criteriaId))];
        const categoryScores = {};
        for (const category of categories) {
            const categoryResults = results.filter((r) => r.criteriaId === category);
            categoryScores[category] = this.calculateBaseScore(categoryResults);
        }
        return categoryScores;
    }
    /**
     * Calculate severity breakdown
     */
    calculateSeverityBreakdown(results) {
        const breakdown = {
            critical: 0,
            high: 0,
            medium: 0,
            low: 0,
            info: 0,
        };
        results.forEach((result) => {
            breakdown[result.severity] = (breakdown[result.severity] || 0) + 1;
        });
        return breakdown;
    }
    /**
     * Analyze quality trends
     */
    analyzeTrends(results) {
        const recentHistory = this.qualityHistory.slice(-20); // Last 20 assessments
        if (recentHistory.length < 5) {
            return {
                improving: false,
                stable: true,
                degrading: false,
                confidence: 0.1,
            };
        }
        const scores = recentHistory.map((h) => h.score);
        const trendSlope = this.calculateTrendSlope(scores);
        const variance = this.calculateVariance(scores);
        const improving = trendSlope > 1;
        const degrading = trendSlope < -1;
        const stable = Math.abs(trendSlope) <= 1 && variance < 10;
        const confidence = Math.min(1, recentHistory.length / 20);
        return {
            improving,
            stable,
            degrading,
            confidence,
        };
    }
    /**
     * Generate quality improvement recommendations
     */
    generateRecommendations(results, overallScore) {
        const recommendations = [];
        // Critical failure recommendations
        const criticalFailures = results.filter((r) => r.status === 'failed' && r.severity === 'critical');
        if (criticalFailures.length > 0) {
            recommendations.push({
                id: 'fix_critical_failures',
                type: 'improvement',
                priority: 'critical',
                title: 'Address Critical Validation Failures',
                description: `${criticalFailures.length} critical validation failures require immediate attention`,
                impact: {
                    estimated: criticalFailures.length * 15,
                    confidence: 95,
                    effort: 'high',
                },
                actionItems: criticalFailures
                    .map((f) => `Fix: ${f.message}`)
                    .slice(0, 5),
                category: 'critical_fixes',
            });
        }
        // Performance optimization recommendations
        const slowValidations = results.filter((r) => r.duration > 30000);
        if (slowValidations.length > results.length * 0.3) {
            recommendations.push({
                id: 'optimize_performance',
                type: 'optimization',
                priority: 'medium',
                title: 'Optimize Validation Performance',
                description: 'Multiple slow validations detected - consider optimization',
                impact: {
                    estimated: 8,
                    confidence: 70,
                    effort: 'medium',
                },
                actionItems: [
                    'Identify bottleneck validation criteria',
                    'Implement parallel execution where possible',
                    'Optimize resource-intensive validations',
                ],
                category: 'performance',
            });
        }
        // Category coverage recommendations
        const missingCategories = this.identifyMissingCategories(results);
        if (missingCategories.length > 0) {
            recommendations.push({
                id: 'improve_coverage',
                type: 'improvement',
                priority: 'low',
                title: 'Improve Validation Coverage',
                description: `Missing validation in: ${missingCategories.join(', ')}`,
                impact: {
                    estimated: missingCategories.length * 3,
                    confidence: 60,
                    effort: 'medium',
                },
                actionItems: missingCategories.map((cat) => `Add ${cat} validation`),
                category: 'coverage',
            });
        }
        // Score improvement recommendations
        if (overallScore < 80) {
            recommendations.push({
                id: 'improve_overall_quality',
                type: 'improvement',
                priority: overallScore < 60 ? 'high' : 'medium',
                title: 'Improve Overall Quality Score',
                description: `Current score ${overallScore.toFixed(1)} has room for improvement`,
                impact: {
                    estimated: Math.min(20, 90 - overallScore),
                    confidence: 80,
                    effort: 'medium',
                },
                actionItems: [
                    'Focus on failed validation criteria',
                    'Improve code quality practices',
                    'Implement automated quality checks',
                ],
                category: 'quality',
            });
        }
        return recommendations.sort((a, b) => {
            const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
            return priorityOrder[b.priority] - priorityOrder[a.priority];
        });
    }
    /**
     * Calculate confidence level for assessment
     */
    calculateConfidenceLevel(results) {
        let confidence = 0;
        // More results = higher confidence
        confidence += Math.min(50, results.length * 5);
        // Varied categories = higher confidence
        const categories = new Set(results.map((r) => r.criteriaId));
        confidence += Math.min(30, categories.size * 10);
        // Historical data availability
        confidence += Math.min(20, this.qualityHistory.length / 10);
        return Math.min(100, confidence);
    }
    /**
     * Store quality data for historical analysis
     */
    storeQualityData(dataPoint) {
        this.qualityHistory.push(dataPoint);
        // Trim history to prevent memory issues
        if (this.qualityHistory.length > this.maxHistorySize) {
            const excess = this.qualityHistory.length - this.maxHistorySize;
            this.qualityHistory.splice(0, excess);
        }
    }
    /**
     * Calculate trend slope using linear regression
     */
    calculateTrendSlope(values) {
        if (values.length < 2)
            return 0;
        const n = values.length;
        const x = Array.from({ length: n }, (_, i) => i);
        const y = values;
        const sumX = x.reduce((sum, val) => sum + val, 0);
        const sumY = y.reduce((sum, val) => sum + val, 0);
        const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
        const sumXX = x.reduce((sum, val) => sum + val * val, 0);
        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        return isNaN(slope) ? 0 : slope;
    }
    /**
     * Calculate variance of values
     */
    calculateVariance(values) {
        if (values.length === 0)
            return 0;
        const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
        const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
            values.length;
        return variance;
    }
    /**
     * Identify missing validation categories
     */
    identifyMissingCategories(results) {
        const expectedCategories = [
            'code_quality',
            'security',
            'performance',
            'functionality',
        ];
        const presentCategories = new Set(results.map((r) => r.criteriaId));
        return expectedCategories.filter((cat) => !presentCategories.has(cat));
    }
    /**
     * Get default scoring weights
     */
    getDefaultScoringWeights() {
        return {
            severity: {
                critical: 2.0,
                high: 1.5,
                medium: 1.2,
                low: 1.0,
                info: 0.8,
            },
            category: {
                code_quality: 1.2,
                security: 2.0,
                performance: 1.1,
                functionality: 1.5,
                documentation: 0.8,
            },
            status: {
                passed: 1.0,
                failed: 0.0,
                requires_review: 0.5,
                skipped: 0.1,
                pending: 0.0,
                validating: 0.0,
            },
            temporal: {
                recentFailures: 0.8,
                improvementTrend: 1.2,
                stabilityBonus: 1.1,
            },
        };
    }
    /**
     * Update scoring weights configuration
     */
    updateScoringWeights(weights) {
        this.logger.info('Updating scoring weights configuration');
        if (weights.severity) {
            Object.assign(this.scoringWeights.severity, weights.severity);
        }
        if (weights.category) {
            Object.assign(this.scoringWeights.category, weights.category);
        }
        if (weights.status) {
            Object.assign(this.scoringWeights.status, weights.status);
        }
        if (weights.temporal) {
            Object.assign(this.scoringWeights.temporal, weights.temporal);
        }
    }
    /**
     * Get quality statistics and insights
     */
    getQualityStatistics() {
        if (this.qualityHistory.length === 0) {
            return {
                totalAssessments: 0,
                averageScore: 0,
                trend: 'unknown',
                distribution: {},
                insights: [],
            };
        }
        const scores = this.qualityHistory.map((h) => h.score);
        const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
        const trendSlope = this.calculateTrendSlope(scores);
        const distribution = {
            excellent: scores.filter((s) => s >= 90).length,
            good: scores.filter((s) => s >= 70 && s < 90).length,
            fair: scores.filter((s) => s >= 50 && s < 70).length,
            poor: scores.filter((s) => s < 50).length,
        };
        const insights = [
            `Average quality score: ${averageScore.toFixed(1)}`,
            `Quality trend: ${trendSlope > 0.5 ? 'improving' : trendSlope < -0.5 ? 'declining' : 'stable'}`,
            `Total assessments: ${this.qualityHistory.length}`,
        ];
        return {
            totalAssessments: this.qualityHistory.length,
            averageScore: Math.round(averageScore * 100) / 100,
            trend: trendSlope > 0.5
                ? 'improving'
                : trendSlope < -0.5
                    ? 'declining'
                    : 'stable',
            distribution,
            insights,
        };
    }
    /**
     * Clear quality history (for testing or reset)
     */
    clearHistory() {
        this.qualityHistory.length = 0;
        this.logger.info('Quality history cleared');
    }
}
//# sourceMappingURL=QualityScorer.js.map