/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { StatisticalSummary } from './types.js';
/**
 * Statistical utility functions for data aggregation
 *
 * Provides comprehensive statistical calculations for historical budget data,
 * including descriptive statistics, percentiles, and distribution metrics.
 */
export declare class StatisticalUtils {
    /**
     * Calculate comprehensive statistical summary for a dataset
     */
    static calculateSummary(values: number[]): StatisticalSummary;
    /**
     * Calculate percentile value from sorted array
     */
    static percentile(sortedValues: number[], percentile: number): number;
    /**
     * Calculate skewness (measure of asymmetry)
     */
    private static calculateSkewness;
    /**
     * Calculate kurtosis (measure of tail heaviness)
     */
    private static calculateKurtosis;
    /**
     * Calculate confidence interval for mean
     */
    static calculateConfidenceInterval(values: number[], confidenceLevel?: number): {
        lower: number;
        upper: number;
        confidence: number;
    };
    /**
     * Get t-value for confidence interval calculation
     * Simplified approximation for common cases
     */
    private static getTValue;
    /**
     * Detect outliers using IQR method
     */
    static detectOutliers(values: number[], threshold?: number): {
        outliers: number[];
        indices: number[];
        cleanValues: number[];
    };
    /**
     * Calculate moving average
     */
    static movingAverage(values: number[], windowSize: number): number[];
    /**
     * Calculate exponential moving average
     */
    static exponentialMovingAverage(values: number[], alpha?: number): number[];
    /**
     * Calculate correlation coefficient between two datasets
     */
    static correlation(x: number[], y: number[]): number;
    /**
     * Perform linear regression analysis
     */
    static linearRegression(x: number[], y: number[]): {
        slope: number;
        intercept: number;
        rSquared: number;
        predictions: number[];
    };
    /**
     * Calculate seasonal decomposition indices
     */
    static calculateSeasonalIndices(values: number[], period: number): number[];
    /**
     * Calculate data quality score based on completeness and consistency
     */
    static calculateDataQuality(values: number[], expectedCount?: number, timeRange?: {
        start: number;
        end: number;
        granularity: 'minute' | 'hour' | 'day';
    }): number;
    /**
     * Get empty statistical summary
     */
    private static getEmptySummary;
    /**
     * Validate statistical computation inputs
     */
    static validateInputs(values: number[]): {
        valid: boolean;
        errors: string[];
    };
}
