/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Statistical utility functions for data aggregation
 *
 * Provides comprehensive statistical calculations for historical budget data,
 * including descriptive statistics, percentiles, and distribution metrics.
 */
export class StatisticalUtils {
    /**
     * Calculate comprehensive statistical summary for a dataset
     */
    static calculateSummary(values) {
        if (values.length === 0) {
            return this.getEmptySummary();
        }
        const sortedValues = [...values].sort((a, b) => a - b);
        const n = values.length;
        // Basic statistics
        const sum = values.reduce((acc, val) => acc + val, 0);
        const avg = sum / n;
        const min = sortedValues[0];
        const max = sortedValues[n - 1];
        // Variance and standard deviation
        const variance = values.reduce((acc, val) => acc + Math.pow(val - avg, 2), 0) / n;
        const stddev = Math.sqrt(variance);
        // Percentiles
        const percentiles = {
            p25: this.percentile(sortedValues, 25),
            p50: this.percentile(sortedValues, 50), // median
            p75: this.percentile(sortedValues, 75),
            p90: this.percentile(sortedValues, 90),
            p95: this.percentile(sortedValues, 95),
            p99: this.percentile(sortedValues, 99),
        };
        // Advanced statistics
        const skewness = this.calculateSkewness(values, avg, stddev);
        const kurtosis = this.calculateKurtosis(values, avg, stddev);
        return {
            sum,
            avg,
            min,
            max,
            count: n,
            stddev,
            percentiles,
            variance,
            skewness,
            kurtosis,
        };
    }
    /**
     * Calculate percentile value from sorted array
     */
    static percentile(sortedValues, percentile) {
        if (sortedValues.length === 0)
            return 0;
        if (percentile <= 0)
            return sortedValues[0];
        if (percentile >= 100)
            return sortedValues[sortedValues.length - 1];
        const index = (percentile / 100) * (sortedValues.length - 1);
        const lower = Math.floor(index);
        const upper = Math.ceil(index);
        if (lower === upper) {
            return sortedValues[lower];
        }
        // Linear interpolation
        const weight = index - lower;
        return sortedValues[lower] * (1 - weight) + sortedValues[upper] * weight;
    }
    /**
     * Calculate skewness (measure of asymmetry)
     */
    static calculateSkewness(values, mean, stddev) {
        if (values.length < 3 || stddev === 0)
            return 0;
        const n = values.length;
        const m3 = values.reduce((acc, val) => acc + Math.pow((val - mean) / stddev, 3), 0) /
            n;
        // Sample skewness adjustment
        return (Math.sqrt(n * (n - 1)) / (n - 2)) * m3;
    }
    /**
     * Calculate kurtosis (measure of tail heaviness)
     */
    static calculateKurtosis(values, mean, stddev) {
        if (values.length < 4 || stddev === 0)
            return 0;
        const n = values.length;
        const m4 = values.reduce((acc, val) => acc + Math.pow((val - mean) / stddev, 4), 0) /
            n;
        // Sample kurtosis adjustment (excess kurtosis)
        return ((n - 1) / ((n - 2) * (n - 3))) * ((n + 1) * m4 - 3 * (n - 1));
    }
    /**
     * Calculate confidence interval for mean
     */
    static calculateConfidenceInterval(values, confidenceLevel = 0.95) {
        if (values.length === 0) {
            return { lower: 0, upper: 0, confidence: 0 };
        }
        const summary = this.calculateSummary(values);
        const n = values.length;
        const alpha = 1 - confidenceLevel;
        const tValue = this.getTValue(n - 1, alpha / 2);
        const marginOfError = tValue * (summary.stddev / Math.sqrt(n));
        return {
            lower: summary.avg - marginOfError,
            upper: summary.avg + marginOfError,
            confidence: confidenceLevel,
        };
    }
    /**
     * Get t-value for confidence interval calculation
     * Simplified approximation for common cases
     */
    static getTValue(degreesOfFreedom, alpha) {
        // Common t-values for 95% confidence interval
        const tTable = {
            1: 12.706,
            2: 4.303,
            3: 3.182,
            4: 2.776,
            5: 2.571,
            6: 2.447,
            7: 2.365,
            8: 2.306,
            9: 2.262,
            10: 2.228,
            15: 2.131,
            20: 2.086,
            25: 2.06,
            30: 2.042,
        };
        if (alpha !== 0.025) {
            // For non-95% confidence, use approximation
            return 1.96; // Standard normal approximation
        }
        // Find closest match in t-table
        if (degreesOfFreedom >= 30)
            return 1.96;
        const closestDf = Object.keys(tTable)
            .map(Number)
            .reduce((prev, curr) => Math.abs(curr - degreesOfFreedom) < Math.abs(prev - degreesOfFreedom)
            ? curr
            : prev);
        return tTable[closestDf];
    }
    /**
     * Detect outliers using IQR method
     */
    static detectOutliers(values, threshold = 1.5) {
        if (values.length === 0) {
            return { outliers: [], indices: [], cleanValues: [] };
        }
        const summary = this.calculateSummary(values);
        const iqr = summary.percentiles.p75 - summary.percentiles.p25;
        const lowerBound = summary.percentiles.p25 - threshold * iqr;
        const upperBound = summary.percentiles.p75 + threshold * iqr;
        const outliers = [];
        const indices = [];
        const cleanValues = [];
        values.forEach((value, index) => {
            if (value < lowerBound || value > upperBound) {
                outliers.push(value);
                indices.push(index);
            }
            else {
                cleanValues.push(value);
            }
        });
        return { outliers, indices, cleanValues };
    }
    /**
     * Calculate moving average
     */
    static movingAverage(values, windowSize) {
        if (windowSize <= 0 || windowSize > values.length) {
            return values.slice();
        }
        const result = [];
        for (let i = windowSize - 1; i < values.length; i++) {
            const sum = values
                .slice(i - windowSize + 1, i + 1)
                .reduce((acc, val) => acc + val, 0);
            result.push(sum / windowSize);
        }
        return result;
    }
    /**
     * Calculate exponential moving average
     */
    static exponentialMovingAverage(values, alpha = 0.1) {
        if (values.length === 0)
            return [];
        const result = [values[0]];
        for (let i = 1; i < values.length; i++) {
            const ema = alpha * values[i] + (1 - alpha) * result[i - 1];
            result.push(ema);
        }
        return result;
    }
    /**
     * Calculate correlation coefficient between two datasets
     */
    static correlation(x, y) {
        if (x.length !== y.length || x.length === 0)
            return 0;
        const n = x.length;
        const xMean = x.reduce((a, b) => a + b, 0) / n;
        const yMean = y.reduce((a, b) => a + b, 0) / n;
        let numerator = 0;
        let xSumSq = 0;
        let ySumSq = 0;
        for (let i = 0; i < n; i++) {
            const xDiff = x[i] - xMean;
            const yDiff = y[i] - yMean;
            numerator += xDiff * yDiff;
            xSumSq += xDiff * xDiff;
            ySumSq += yDiff * yDiff;
        }
        const denominator = Math.sqrt(xSumSq * ySumSq);
        return denominator === 0 ? 0 : numerator / denominator;
    }
    /**
     * Perform linear regression analysis
     */
    static linearRegression(x, y) {
        if (x.length !== y.length || x.length < 2) {
            return { slope: 0, intercept: 0, rSquared: 0, predictions: [] };
        }
        const n = x.length;
        const xMean = x.reduce((a, b) => a + b, 0) / n;
        const yMean = y.reduce((a, b) => a + b, 0) / n;
        let numerator = 0;
        let denominator = 0;
        for (let i = 0; i < n; i++) {
            const xDiff = x[i] - xMean;
            const yDiff = y[i] - yMean;
            numerator += xDiff * yDiff;
            denominator += xDiff * xDiff;
        }
        const slope = denominator === 0 ? 0 : numerator / denominator;
        const intercept = yMean - slope * xMean;
        // Calculate R-squared
        const predictions = x.map((xi) => slope * xi + intercept);
        const ssRes = y.reduce((sum, yi, i) => sum + Math.pow(yi - predictions[i], 2), 0);
        const ssTot = y.reduce((sum, yi) => sum + Math.pow(yi - yMean, 2), 0);
        const rSquared = ssTot === 0 ? 1 : 1 - ssRes / ssTot;
        return { slope, intercept, rSquared, predictions };
    }
    /**
     * Calculate seasonal decomposition indices
     */
    static calculateSeasonalIndices(values, period) {
        if (values.length < period * 2)
            return new Array(period).fill(1);
        const seasonalSums = new Array(period).fill(0);
        const seasonalCounts = new Array(period).fill(0);
        // Calculate trend using moving average
        const trend = this.movingAverage(values, period);
        const trendStart = Math.floor(period / 2);
        // Calculate seasonal components
        for (let i = trendStart; i < values.length - trendStart && i - trendStart < trend.length; i++) {
            const seasonIndex = i % period;
            const detrended = values[i] / trend[i - trendStart];
            seasonalSums[seasonIndex] += detrended;
            seasonalCounts[seasonIndex]++;
        }
        // Calculate seasonal indices
        const seasonalIndices = seasonalSums.map((sum, i) => seasonalCounts[i] > 0 ? sum / seasonalCounts[i] : 1);
        // Normalize so average seasonal index is 1
        const avgIndex = seasonalIndices.reduce((a, b) => a + b, 0) / period;
        return avgIndex > 0
            ? seasonalIndices.map((idx) => idx / avgIndex)
            : new Array(period).fill(1);
    }
    /**
     * Calculate data quality score based on completeness and consistency
     */
    static calculateDataQuality(values, expectedCount, timeRange) {
        if (values.length === 0)
            return 0;
        let completenessScore = 1;
        let consistencyScore = 1;
        let accuracyScore = 1;
        // Completeness: ratio of actual to expected data points
        if (expectedCount && expectedCount > 0) {
            completenessScore = Math.min(values.length / expectedCount, 1);
        }
        // Consistency: coefficient of variation (relative standard deviation)
        const summary = this.calculateSummary(values);
        if (summary.avg > 0) {
            const cv = summary.stddev / summary.avg;
            // Lower CV indicates higher consistency (inverse relationship)
            consistencyScore = Math.max(0, 1 - Math.min(cv, 1));
        }
        // Accuracy: proportion of non-outlier values
        const outlierAnalysis = this.detectOutliers(values);
        accuracyScore = outlierAnalysis.cleanValues.length / values.length;
        // Weighted average of quality dimensions
        const weights = { completeness: 0.4, consistency: 0.3, accuracy: 0.3 };
        return (weights.completeness * completenessScore +
            weights.consistency * consistencyScore +
            weights.accuracy * accuracyScore);
    }
    /**
     * Get empty statistical summary
     */
    static getEmptySummary() {
        return {
            sum: 0,
            avg: 0,
            min: 0,
            max: 0,
            count: 0,
            stddev: 0,
            percentiles: {
                p25: 0,
                p50: 0,
                p75: 0,
                p90: 0,
                p95: 0,
                p99: 0,
            },
            variance: 0,
            skewness: 0,
            kurtosis: 0,
        };
    }
    /**
     * Validate statistical computation inputs
     */
    static validateInputs(values) {
        const errors = [];
        if (!Array.isArray(values)) {
            errors.push('Input must be an array');
            return { valid: false, errors };
        }
        if (values.some((v) => typeof v !== 'number' || !isFinite(v))) {
            errors.push('All values must be finite numbers');
        }
        return {
            valid: errors.length === 0,
            errors,
        };
    }
}
//# sourceMappingURL=StatisticalUtils.js.map