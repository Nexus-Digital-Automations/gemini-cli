/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { CostDataPoint, CostAnalysisResult, CostProjection, BurnRateAnalysis } from '../types.js';
/**
 * Usage pattern classification
 */
export type UsagePattern = 'steady_state' | 'growth_phase' | 'decline_phase' | 'volatile' | 'seasonal' | 'sporadic' | 'burst_intensive' | 'cost_optimized';
/**
 * Budget health assessment levels
 */
export type HealthLevel = 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
/**
 * Comprehensive cost analysis engine for usage pattern recognition and budget health assessment
 * Provides deep insights into spending patterns, budget runway, and optimization opportunities
 */
export declare class CostAnalysisEngine {
    private static readonly logger;
    /**
     * Perform comprehensive cost analysis
     */
    static performComprehensiveAnalysis(costData: CostDataPoint[], currentBudget: {
        total: number;
        used: number;
        remaining: number;
    }, alertConfigs?: Array<{
        id: string;
        name: string;
        threshold: {
            type: string;
            value: number;
            operator: string;
        };
        severity: 'info' | 'warning' | 'critical' | 'emergency';
    }>): Promise<CostAnalysisResult>;
    /**
     * Identify usage patterns in cost data
     */
    static identifyUsagePattern(costData: CostDataPoint[], trend: CostAnalysisResult['trend'], variance: CostAnalysisResult['variance'], seasonal: CostAnalysisResult['seasonal']): {
        primaryPattern: UsagePattern;
        confidence: number;
        description: string;
        characteristics: string[];
    };
    /**
     * Calculate budget runway with multiple scenarios
     */
    static calculateBudgetRunway(currentBudget: {
        total: number;
        used: number;
        remaining: number;
    }, projection: CostProjection, burnRate: BurnRateAnalysis): {
        scenarios: Array<{
            name: string;
            description: string;
            runwayDays: number;
            exhaustionDate: Date;
            confidence: number;
        }>;
        recommendations: string[];
    };
    /**
     * Generate optimization recommendations based on analysis
     */
    private static generateOptimizationRecommendations;
    /**
     * Calculate overall health score and component scores
     */
    private static calculateHealthScore;
    /**
     * Analyze data continuity and identify gaps
     */
    private static analyzeDataContinuity;
    /**
     * Generate human-readable description of usage pattern
     */
    private static generateUsagePatternDescription;
    /**
     * Get health level description from numeric score
     */
    static getHealthLevel(score: number): HealthLevel;
    /**
     * Get health level color for UI display
     */
    static getHealthLevelColor(level: HealthLevel): string;
}
