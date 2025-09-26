/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { CostDataPoint, CostProjection } from '../types.js';
/**
 * Validation metrics for algorithm performance assessment
 */
export interface ValidationMetrics {
    /** Accuracy metrics */
    accuracy: {
        /** Mean Absolute Percentage Error */
        mape: number;
        /** Root Mean Square Error */
        rmse: number;
        /** Mean Absolute Error */
        mae: number;
        /** Mean Squared Error */
        mse: number;
        /** R-squared correlation coefficient */
        rSquared: number;
        /** Symmetric Mean Absolute Percentage Error */
        smape: number;
        /** Median Absolute Percentage Error */
        medianAPE: number;
    };
    /** Statistical significance tests */
    significance: {
        /** Durbin-Watson test for autocorrelation */
        durbinWatson: number;
        /** Ljung-Box test p-value for residual autocorrelation */
        ljungBoxPValue: number;
        /** Jarque-Bera test p-value for normality of residuals */
        jarqueBeraInvPValue: number;
        /** Anderson-Darling test for normality */
        andersonDarling: number;
    };
    /** Performance metrics */
    performance: {
        /** Execution time in milliseconds */
        executionTimeMs: number;
        /** Memory usage in MB */
        memoryUsageMB: number;
        /** CPU usage percentage during execution */
        cpuUsagePercent: number;
        /** Algorithm complexity score */
        complexityScore: number;
    };
    /** Robustness metrics */
    robustness: {
        /** Stability under noise */
        noiseResistance: number;
        /** Sensitivity to outliers */
        outlierSensitivity: number;
        /** Performance on edge cases */
        edgeCaseHandling: number;
        /** Consistency across different data patterns */
        patternConsistency: number;
    };
}
/**
 * Test case for algorithm validation
 */
export interface ValidationTestCase {
    /** Test case identifier */
    id: string;
    /** Test description */
    description: string;
    /** Input data for testing */
    inputData: CostDataPoint[];
    /** Expected output for validation */
    expectedOutput: any;
    /** Test category */
    category: 'accuracy' | 'performance' | 'robustness' | 'edge_case';
    /** Test priority */
    priority: 'low' | 'medium' | 'high' | 'critical';
}
/**
 * Validation result for a single test
 */
export interface ValidationResult {
    /** Test case metadata */
    testCase: ValidationTestCase;
    /** Test execution timestamp */
    timestamp: Date;
    /** Test success status */
    success: boolean;
    /** Validation metrics */
    metrics: ValidationMetrics;
    /** Error details if test failed */
    error?: {
        message: string;
        stack?: string;
        code?: string;
    };
    /** Additional test context */
    context: {
        /** Data quality score of input */
        dataQualityScore: number;
        /** Sample size used */
        sampleSize: number;
        /** Algorithm parameters used */
        algorithmParameters: Record<string, any>;
    };
}
/**
 * Comprehensive validation report
 */
export interface ValidationReport {
    /** Report metadata */
    metadata: {
        /** Validation run timestamp */
        timestamp: Date;
        /** Total tests executed */
        totalTests: number;
        /** Tests passed */
        testsPassed: number;
        /** Tests failed */
        testsFailed: number;
        /** Overall success rate */
        successRate: number;
        /** Validation framework version */
        frameworkVersion: string;
    };
    /** Individual test results */
    results: ValidationResult[];
    /** Aggregated metrics across all tests */
    aggregatedMetrics: {
        /** Average accuracy metrics */
        averageAccuracy: ValidationMetrics['accuracy'];
        /** Performance benchmarks */
        performanceBenchmarks: ValidationMetrics['performance'];
        /** Robustness assessment */
        robustnessAssessment: ValidationMetrics['robustness'];
    };
    /** Quality assessment */
    qualityAssessment: {
        /** Overall quality score (0-100) */
        overallScore: number;
        /** Quality by category */
        categoryScores: {
            accuracy: number;
            performance: number;
            robustness: number;
            reliability: number;
        };
        /** Quality recommendations */
        recommendations: string[];
    };
}
/**
 * Algorithm validator for cost projection and analysis algorithms
 * Provides comprehensive testing and validation capabilities
 */
export declare class AlgorithmValidator {
    private logger;
    private testCases;
    constructor();
    /**
     * Initialize standard test cases for common validation scenarios
     */
    private initializeStandardTestCases;
    /**
     * Add a custom test case to the validation suite
     */
    addTestCase(testCase: ValidationTestCase): void;
    /**
     * Validate projection algorithm accuracy
     */
    validateProjectionAccuracy(algorithm: (data: CostDataPoint[]) => CostProjection, testData: CostDataPoint[], actualOutcomes: number[]): Promise<ValidationMetrics['accuracy']>;
    /**
     * Validate algorithm performance metrics
     */
    validatePerformance<T>(algorithm: (data: CostDataPoint[]) => T, testData: CostDataPoint[]): Promise<ValidationMetrics['performance']>;
    /**
     * Validate algorithm robustness
     */
    validateRobustness<T>(algorithm: (data: CostDataPoint[]) => T, baseData: CostDataPoint[]): Promise<ValidationMetrics['robustness']>;
    /**
     * Run comprehensive validation suite
     */
    runValidationSuite<T>(algorithm: (data: CostDataPoint[]) => T, testCategories?: Array<ValidationTestCase['category']>): Promise<ValidationReport>;
    /**
     * Execute a single test case
     */
    private executeTestCase;
    /**
     * Generate comprehensive validation report
     */
    private generateValidationReport;
    private generateLinearTrendData;
    private generateSeasonalData;
    private generateRandomData;
    private generateDataWithOutliers;
    private createDataPoint;
    private addNoiseToData;
    private addOutliersToData;
    private calculateMAPE;
    private calculateRMSE;
    private calculateMAE;
    private calculateMSE;
    private calculateRSquared;
    private calculateSMAPE;
    private calculateMedianAPE;
    private calculateComplexityScore;
    private calculateResultSimilarity;
    private levenshteinDistance;
    private testEdgeCaseHandling;
    private testPatternConsistency;
    private calculateDataQuality;
    private evaluateTestSuccess;
    private extractAlgorithmParameters;
    private createEmptyMetrics;
    private aggregateMetrics;
    private calculateQualityAssessment;
    private average;
}
