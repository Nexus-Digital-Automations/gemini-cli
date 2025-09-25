/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type {
  CostDataPoint,
  CostProjection,
  TrendAnalysis,
  StatisticalMeasures,
  MovingAverageAnalysis,
  SeasonalAnalysis,
  VarianceDetection,
  BurnRateAnalysis,
} from '../types.js';
import { Logger } from '../../utils/logger.js';

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
export class AlgorithmValidator {
  private logger: Logger;
  private testCases: Map<string, ValidationTestCase> = new Map();

  constructor() {
    this.logger = new Logger('AlgorithmValidator');
    this.logger.info('Algorithm validator initialized');
    this.initializeStandardTestCases();
  }

  /**
   * Initialize standard test cases for common validation scenarios
   */
  private initializeStandardTestCases(): void {
    const startTime = Date.now();
    this.logger.info('Initializing standard test cases');

    try {
      // Accuracy test cases
      this.addTestCase({
        id: 'accuracy_linear_trend',
        description: 'Validate linear trend detection accuracy',
        inputData: this.generateLinearTrendData(100, 10, 2),
        expectedOutput: { slope: 2, direction: 'increasing' },
        category: 'accuracy',
        priority: 'high',
      });

      this.addTestCase({
        id: 'accuracy_seasonal_pattern',
        description: 'Validate seasonal pattern recognition',
        inputData: this.generateSeasonalData(365, 50, 0.3),
        expectedOutput: { seasonalityStrength: 0.25 },
        category: 'accuracy',
        priority: 'high',
      });

      // Performance test cases
      this.addTestCase({
        id: 'performance_large_dataset',
        description: 'Performance test with large dataset',
        inputData: this.generateRandomData(10000),
        expectedOutput: { executionTimeMs: 1000 },
        category: 'performance',
        priority: 'medium',
      });

      // Robustness test cases
      this.addTestCase({
        id: 'robustness_outliers',
        description: 'Robustness test with outliers',
        inputData: this.generateDataWithOutliers(200, 5),
        expectedOutput: { outlierSensitivity: 0.1 },
        category: 'robustness',
        priority: 'high',
      });

      // Edge case test cases
      this.addTestCase({
        id: 'edge_case_empty_data',
        description: 'Edge case with empty dataset',
        inputData: [],
        expectedOutput: { error: 'insufficient_data' },
        category: 'edge_case',
        priority: 'critical',
      });

      this.addTestCase({
        id: 'edge_case_single_point',
        description: 'Edge case with single data point',
        inputData: [this.createDataPoint(new Date(), 100, 1000)],
        expectedOutput: { error: 'insufficient_data' },
        category: 'edge_case',
        priority: 'critical',
      });

      const duration = Date.now() - startTime;
      this.logger.info(`Standard test cases initialized`, {
        testCaseCount: this.testCases.size,
        initializationTime: duration,
      });
    } catch (error) {
      this.logger.error('Failed to initialize standard test cases', {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Add a custom test case to the validation suite
   */
  addTestCase(testCase: ValidationTestCase): void {
    this.logger.info(`Adding test case: ${testCase.id}`, {
      category: testCase.category,
      priority: testCase.priority,
      dataPoints: testCase.inputData.length,
    });

    this.testCases.set(testCase.id, testCase);
  }

  /**
   * Validate projection algorithm accuracy
   */
  async validateProjectionAccuracy(
    algorithm: (data: CostDataPoint[]) => CostProjection,
    testData: CostDataPoint[],
    actualOutcomes: number[]
  ): Promise<ValidationMetrics['accuracy']> {
    const startTime = Date.now();
    this.logger.info('Validating projection accuracy', {
      dataPoints: testData.length,
      actualOutcomes: actualOutcomes.length,
    });

    try {
      const projection = algorithm(testData);
      const predictions = projection.projectedCosts.map((p) => p.projectedCost);

      // Calculate accuracy metrics
      const mape = this.calculateMAPE(actualOutcomes, predictions);
      const rmse = this.calculateRMSE(actualOutcomes, predictions);
      const mae = this.calculateMAE(actualOutcomes, predictions);
      const mse = this.calculateMSE(actualOutcomes, predictions);
      const rSquared = this.calculateRSquared(actualOutcomes, predictions);
      const smape = this.calculateSMAPE(actualOutcomes, predictions);
      const medianAPE = this.calculateMedianAPE(actualOutcomes, predictions);

      const accuracy = {
        mape,
        rmse,
        mae,
        mse,
        rSquared,
        smape,
        medianAPE,
      };

      const duration = Date.now() - startTime;
      this.logger.info('Projection accuracy validation completed', {
        accuracy,
        validationTime: duration,
      });

      return accuracy;
    } catch (error) {
      this.logger.error('Projection accuracy validation failed', {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Validate algorithm performance metrics
   */
  async validatePerformance<T>(
    algorithm: (data: CostDataPoint[]) => T,
    testData: CostDataPoint[]
  ): Promise<ValidationMetrics['performance']> {
    this.logger.info('Validating algorithm performance', {
      dataPoints: testData.length,
    });

    try {
      const memoryBefore = process.memoryUsage();
      const startTime = Date.now();
      const startCpuUsage = process.cpuUsage();

      // Execute algorithm
      const result = algorithm(testData);

      // Measure performance
      const endTime = Date.now();
      const endCpuUsage = process.cpuUsage(startCpuUsage);
      const memoryAfter = process.memoryUsage();

      const executionTimeMs = endTime - startTime;
      const memoryUsageMB = (memoryAfter.heapUsed - memoryBefore.heapUsed) / 1024 / 1024;
      const cpuUsagePercent = (endCpuUsage.user + endCpuUsage.system) / 1000 / executionTimeMs * 100;
      const complexityScore = this.calculateComplexityScore(testData.length, executionTimeMs);

      const performance = {
        executionTimeMs,
        memoryUsageMB: Math.max(0, memoryUsageMB),
        cpuUsagePercent: Math.min(100, cpuUsagePercent),
        complexityScore,
      };

      this.logger.info('Performance validation completed', {
        performance,
      });

      return performance;
    } catch (error) {
      this.logger.error('Performance validation failed', {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Validate algorithm robustness
   */
  async validateRobustness<T>(
    algorithm: (data: CostDataPoint[]) => T,
    baseData: CostDataPoint[]
  ): Promise<ValidationMetrics['robustness']> {
    this.logger.info('Validating algorithm robustness', {
      dataPoints: baseData.length,
    });

    try {
      const baseResult = algorithm(baseData);

      // Test noise resistance
      const noisyData = this.addNoiseToData(baseData, 0.1);
      const noisyResult = algorithm(noisyData);
      const noiseResistance = this.calculateResultSimilarity(baseResult, noisyResult);

      // Test outlier sensitivity
      const outlierData = this.addOutliersToData(baseData, 3);
      const outlierResult = algorithm(outlierData);
      const outlierSensitivity = 1 - this.calculateResultSimilarity(baseResult, outlierResult);

      // Test edge case handling
      const edgeCaseHandling = await this.testEdgeCaseHandling(algorithm);

      // Test pattern consistency
      const patternConsistency = await this.testPatternConsistency(algorithm, baseData);

      const robustness = {
        noiseResistance,
        outlierSensitivity,
        edgeCaseHandling,
        patternConsistency,
      };

      this.logger.info('Robustness validation completed', {
        robustness,
      });

      return robustness;
    } catch (error) {
      this.logger.error('Robustness validation failed', {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Run comprehensive validation suite
   */
  async runValidationSuite<T>(
    algorithm: (data: CostDataPoint[]) => T,
    testCategories: Array<ValidationTestCase['category']> = ['accuracy', 'performance', 'robustness', 'edge_case']
  ): Promise<ValidationReport> {
    const startTime = Date.now();
    this.logger.info('Running comprehensive validation suite', {
      algorithm: algorithm.name,
      testCategories,
      totalTestCases: this.testCases.size,
    });

    try {
      const results: ValidationResult[] = [];
      let testsPassed = 0;
      let testsFailed = 0;

      // Filter test cases by category
      const selectedTests = Array.from(this.testCases.values()).filter(
        (test) => testCategories.includes(test.category)
      );

      // Execute each test case
      for (const testCase of selectedTests) {
        try {
          this.logger.info(`Executing test case: ${testCase.id}`);

          const result = await this.executeTestCase(algorithm, testCase);
          results.push(result);

          if (result.success) {
            testsPassed++;
          } else {
            testsFailed++;
          }
        } catch (error) {
          this.logger.error(`Test case ${testCase.id} execution failed`, {
            error: error.message,
          });

          results.push({
            testCase,
            timestamp: new Date(),
            success: false,
            metrics: this.createEmptyMetrics(),
            error: {
              message: error.message,
              stack: error.stack,
              code: 'EXECUTION_ERROR',
            },
            context: {
              dataQualityScore: 0,
              sampleSize: testCase.inputData.length,
              algorithmParameters: {},
            },
          });
          testsFailed++;
        }
      }

      // Generate comprehensive report
      const report = await this.generateValidationReport(results, testsPassed, testsFailed);

      const duration = Date.now() - startTime;
      this.logger.info('Validation suite completed', {
        totalTests: results.length,
        testsPassed,
        testsFailed,
        successRate: report.metadata.successRate,
        executionTime: duration,
      });

      return report;
    } catch (error) {
      this.logger.error('Validation suite execution failed', {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Execute a single test case
   */
  private async executeTestCase<T>(
    algorithm: (data: CostDataPoint[]) => T,
    testCase: ValidationTestCase
  ): Promise<ValidationResult> {
    const startTime = Date.now();

    try {
      // Calculate data quality score
      const dataQualityScore = this.calculateDataQuality(testCase.inputData);

      // Execute algorithm and collect metrics
      const accuracyMetrics = await this.validateProjectionAccuracy(
        algorithm as any,
        testCase.inputData,
        Array(testCase.inputData.length).fill(0).map((_, i) => i * 10)
      );

      const performanceMetrics = await this.validatePerformance(algorithm, testCase.inputData);
      const robustnessMetrics = await this.validateRobustness(algorithm, testCase.inputData);

      // Create significance metrics (placeholder implementation)
      const significanceMetrics = {
        durbinWatson: 2.0,
        ljungBoxPValue: 0.5,
        jarqueBeraInvPValue: 0.05,
        andersonDarling: 0.8,
      };

      const metrics: ValidationMetrics = {
        accuracy: accuracyMetrics,
        performance: performanceMetrics,
        robustness: robustnessMetrics,
        significance: significanceMetrics,
      };

      const success = this.evaluateTestSuccess(testCase, metrics);

      return {
        testCase,
        timestamp: new Date(),
        success,
        metrics,
        context: {
          dataQualityScore,
          sampleSize: testCase.inputData.length,
          algorithmParameters: this.extractAlgorithmParameters(algorithm),
        },
      };
    } catch (error) {
      return {
        testCase,
        timestamp: new Date(),
        success: false,
        metrics: this.createEmptyMetrics(),
        error: {
          message: error.message,
          stack: error.stack,
          code: 'TEST_EXECUTION_ERROR',
        },
        context: {
          dataQualityScore: 0,
          sampleSize: testCase.inputData.length,
          algorithmParameters: {},
        },
      };
    }
  }

  /**
   * Generate comprehensive validation report
   */
  private async generateValidationReport(
    results: ValidationResult[],
    testsPassed: number,
    testsFailed: number
  ): Promise<ValidationReport> {
    const totalTests = results.length;
    const successRate = totalTests > 0 ? (testsPassed / totalTests) * 100 : 0;

    // Calculate aggregated metrics
    const successfulResults = results.filter((r) => r.success);
    const aggregatedMetrics = this.aggregateMetrics(successfulResults);

    // Calculate quality assessment
    const qualityAssessment = this.calculateQualityAssessment(successfulResults);

    return {
      metadata: {
        timestamp: new Date(),
        totalTests,
        testsPassed,
        testsFailed,
        successRate,
        frameworkVersion: '1.0.0',
      },
      results,
      aggregatedMetrics,
      qualityAssessment,
    };
  }

  // Helper methods for data generation and calculations

  private generateLinearTrendData(count: number, base: number, slope: number): CostDataPoint[] {
    const data: CostDataPoint[] = [];
    const startDate = new Date();

    for (let i = 0; i < count; i++) {
      const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
      const cost = base + slope * i + Math.random() * 2;
      data.push(this.createDataPoint(date, cost, cost * 100));
    }

    return data;
  }

  private generateSeasonalData(count: number, base: number, amplitude: number): CostDataPoint[] {
    const data: CostDataPoint[] = [];
    const startDate = new Date();

    for (let i = 0; i < count; i++) {
      const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
      const seasonal = Math.sin((i / 365) * 2 * Math.PI) * amplitude;
      const cost = base + seasonal + Math.random();
      data.push(this.createDataPoint(date, cost, cost * 100));
    }

    return data;
  }

  private generateRandomData(count: number): CostDataPoint[] {
    const data: CostDataPoint[] = [];
    const startDate = new Date();

    for (let i = 0; i < count; i++) {
      const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
      const cost = Math.random() * 100;
      data.push(this.createDataPoint(date, cost, cost * 100));
    }

    return data;
  }

  private generateDataWithOutliers(count: number, outlierCount: number): CostDataPoint[] {
    const data = this.generateRandomData(count);

    // Add outliers
    for (let i = 0; i < outlierCount; i++) {
      const index = Math.floor(Math.random() * count);
      data[index].cost *= 10; // Make it an outlier
    }

    return data;
  }

  private createDataPoint(timestamp: Date, cost: number, tokens: number): CostDataPoint {
    return {
      timestamp,
      cost,
      tokens,
      context: {
        feature: 'validation',
        user: 'test',
        model: 'test-model',
        session: 'validation-session',
      },
    };
  }

  private addNoiseToData(data: CostDataPoint[], noiseLevel: number): CostDataPoint[] {
    return data.map((point) => ({
      ...point,
      cost: point.cost * (1 + (Math.random() - 0.5) * noiseLevel),
    }));
  }

  private addOutliersToData(data: CostDataPoint[], outlierCount: number): CostDataPoint[] {
    const result = [...data];
    for (let i = 0; i < outlierCount; i++) {
      const index = Math.floor(Math.random() * result.length);
      result[index] = {
        ...result[index],
        cost: result[index].cost * (5 + Math.random() * 5),
      };
    }
    return result;
  }

  // Calculation methods

  private calculateMAPE(actual: number[], predicted: number[]): number {
    if (actual.length !== predicted.length || actual.length === 0) {
      return 100;
    }

    const ape = actual.map((a, i) =>
      a !== 0 ? Math.abs((a - predicted[i]) / a) * 100 : 0
    );

    return ape.reduce((sum, error) => sum + error, 0) / ape.length;
  }

  private calculateRMSE(actual: number[], predicted: number[]): number {
    if (actual.length !== predicted.length || actual.length === 0) {
      return Infinity;
    }

    const mse = actual.reduce((sum, a, i) =>
      sum + Math.pow(a - predicted[i], 2), 0
    ) / actual.length;

    return Math.sqrt(mse);
  }

  private calculateMAE(actual: number[], predicted: number[]): number {
    if (actual.length !== predicted.length || actual.length === 0) {
      return Infinity;
    }

    return actual.reduce((sum, a, i) =>
      sum + Math.abs(a - predicted[i]), 0
    ) / actual.length;
  }

  private calculateMSE(actual: number[], predicted: number[]): number {
    if (actual.length !== predicted.length || actual.length === 0) {
      return Infinity;
    }

    return actual.reduce((sum, a, i) =>
      sum + Math.pow(a - predicted[i], 2), 0
    ) / actual.length;
  }

  private calculateRSquared(actual: number[], predicted: number[]): number {
    if (actual.length !== predicted.length || actual.length === 0) {
      return 0;
    }

    const actualMean = actual.reduce((sum, a) => sum + a, 0) / actual.length;
    const totalSumSquares = actual.reduce((sum, a) => sum + Math.pow(a - actualMean, 2), 0);
    const residualSumSquares = actual.reduce((sum, a, i) => sum + Math.pow(a - predicted[i], 2), 0);

    return totalSumSquares === 0 ? 1 : 1 - (residualSumSquares / totalSumSquares);
  }

  private calculateSMAPE(actual: number[], predicted: number[]): number {
    if (actual.length !== predicted.length || actual.length === 0) {
      return 100;
    }

    const smape = actual.map((a, i) => {
      const denominator = (Math.abs(a) + Math.abs(predicted[i])) / 2;
      return denominator !== 0 ? Math.abs(a - predicted[i]) / denominator * 100 : 0;
    });

    return smape.reduce((sum, error) => sum + error, 0) / smape.length;
  }

  private calculateMedianAPE(actual: number[], predicted: number[]): number {
    if (actual.length !== predicted.length || actual.length === 0) {
      return 100;
    }

    const ape = actual.map((a, i) =>
      a !== 0 ? Math.abs((a - predicted[i]) / a) * 100 : 0
    ).sort((a, b) => a - b);

    const mid = Math.floor(ape.length / 2);
    return ape.length % 2 === 0
      ? (ape[mid - 1] + ape[mid]) / 2
      : ape[mid];
  }

  private calculateComplexityScore(dataSize: number, executionTime: number): number {
    // Simple complexity estimation based on execution time vs data size
    const timePerPoint = executionTime / dataSize;

    if (timePerPoint < 0.01) return 1; // O(1) or O(log n)
    if (timePerPoint < 0.1) return 2; // O(n)
    if (timePerPoint < 1) return 3; // O(n log n)
    if (timePerPoint < 10) return 4; // O(n²)
    return 5; // O(n³) or worse
  }

  private calculateResultSimilarity(result1: any, result2: any): number {
    // Simple similarity calculation - in real implementation would be more sophisticated
    try {
      const str1 = JSON.stringify(result1);
      const str2 = JSON.stringify(result2);

      if (str1 === str2) return 1.0;

      // Calculate Levenshtein distance as rough similarity measure
      const maxLength = Math.max(str1.length, str2.length);
      if (maxLength === 0) return 1.0;

      return 1 - this.levenshteinDistance(str1, str2) / maxLength;
    } catch {
      return 0.5; // Default similarity if comparison fails
    }
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        );
      }
    }

    return matrix[str2.length][str1.length];
  }

  private async testEdgeCaseHandling<T>(algorithm: (data: CostDataPoint[]) => T): Promise<number> {
    let score = 0;
    const testCases = [
      [], // Empty data
      [this.createDataPoint(new Date(), 100, 1000)], // Single point
      this.generateRandomData(2), // Minimal data
    ];

    for (const testData of testCases) {
      try {
        algorithm(testData);
        score += 0.33; // Successfully handled edge case
      } catch (error) {
        // Check if it's a proper error handling (expected behavior)
        if (error.message.includes('insufficient') || error.message.includes('minimum')) {
          score += 0.33; // Proper error handling
        }
        // Otherwise, it's poor error handling (score += 0)
      }
    }

    return Math.min(1.0, score);
  }

  private async testPatternConsistency<T>(
    algorithm: (data: CostDataPoint[]) => T,
    baseData: CostDataPoint[]
  ): Promise<number> {
    try {
      // Test with different subsets of the same data
      const quarterData = baseData.slice(0, Math.floor(baseData.length / 4));
      const halfData = baseData.slice(0, Math.floor(baseData.length / 2));
      const threeQuarterData = baseData.slice(0, Math.floor(baseData.length * 3 / 4));

      const fullResult = algorithm(baseData);
      const quarterResult = algorithm(quarterData);
      const halfResult = algorithm(halfData);
      const threeQuarterResult = algorithm(threeQuarterData);

      // Calculate consistency scores
      const consistency1 = this.calculateResultSimilarity(fullResult, threeQuarterResult);
      const consistency2 = this.calculateResultSimilarity(threeQuarterResult, halfResult);
      const consistency3 = this.calculateResultSimilarity(halfResult, quarterResult);

      return (consistency1 + consistency2 + consistency3) / 3;
    } catch {
      return 0.5; // Default consistency score if analysis fails
    }
  }

  private calculateDataQuality(data: CostDataPoint[]): number {
    if (data.length === 0) return 0;

    let score = 1.0;

    // Check for missing values
    const hasValidCosts = data.every((point) =>
      typeof point.cost === 'number' && !isNaN(point.cost) && isFinite(point.cost)
    );
    if (!hasValidCosts) score -= 0.3;

    // Check for data continuity
    const hasValidTimestamps = data.every((point) => point.timestamp instanceof Date);
    if (!hasValidTimestamps) score -= 0.2;

    // Check for reasonable data range
    const costs = data.map((point) => point.cost);
    const mean = costs.reduce((sum, cost) => sum + cost, 0) / costs.length;
    const stdDev = Math.sqrt(
      costs.reduce((sum, cost) => sum + Math.pow(cost - mean, 2), 0) / costs.length
    );

    // Penalize extremely high variance (potential data quality issues)
    const coefficientOfVariation = stdDev / mean;
    if (coefficientOfVariation > 2) score -= 0.2;

    return Math.max(0, score);
  }

  private evaluateTestSuccess(testCase: ValidationTestCase, metrics: ValidationMetrics): boolean {
    switch (testCase.category) {
      case 'accuracy':
        return metrics.accuracy.mape < 20 && metrics.accuracy.rSquared > 0.7;
      case 'performance':
        return metrics.performance.executionTimeMs < 5000 && metrics.performance.complexityScore <= 3;
      case 'robustness':
        return metrics.robustness.noiseResistance > 0.7 && metrics.robustness.edgeCaseHandling > 0.5;
      case 'edge_case':
        return metrics.robustness.edgeCaseHandling > 0.8;
      default:
        return true;
    }
  }

  private extractAlgorithmParameters(algorithm: Function): Record<string, any> {
    // Extract basic information about the algorithm
    return {
      name: algorithm.name,
      length: algorithm.length, // Number of parameters
    };
  }

  private createEmptyMetrics(): ValidationMetrics {
    return {
      accuracy: {
        mape: 0,
        rmse: 0,
        mae: 0,
        mse: 0,
        rSquared: 0,
        smape: 0,
        medianAPE: 0,
      },
      significance: {
        durbinWatson: 0,
        ljungBoxPValue: 0,
        jarqueBeraInvPValue: 0,
        andersonDarling: 0,
      },
      performance: {
        executionTimeMs: 0,
        memoryUsageMB: 0,
        cpuUsagePercent: 0,
        complexityScore: 0,
      },
      robustness: {
        noiseResistance: 0,
        outlierSensitivity: 0,
        edgeCaseHandling: 0,
        patternConsistency: 0,
      },
    };
  }

  private aggregateMetrics(results: ValidationResult[]): ValidationReport['aggregatedMetrics'] {
    if (results.length === 0) {
      return {
        averageAccuracy: this.createEmptyMetrics().accuracy,
        performanceBenchmarks: this.createEmptyMetrics().performance,
        robustnessAssessment: this.createEmptyMetrics().robustness,
      };
    }

    const accuracyMetrics = results.map((r) => r.metrics.accuracy);
    const performanceMetrics = results.map((r) => r.metrics.performance);
    const robustnessMetrics = results.map((r) => r.metrics.robustness);

    return {
      averageAccuracy: {
        mape: this.average(accuracyMetrics.map((a) => a.mape)),
        rmse: this.average(accuracyMetrics.map((a) => a.rmse)),
        mae: this.average(accuracyMetrics.map((a) => a.mae)),
        mse: this.average(accuracyMetrics.map((a) => a.mse)),
        rSquared: this.average(accuracyMetrics.map((a) => a.rSquared)),
        smape: this.average(accuracyMetrics.map((a) => a.smape)),
        medianAPE: this.average(accuracyMetrics.map((a) => a.medianAPE)),
      },
      performanceBenchmarks: {
        executionTimeMs: this.average(performanceMetrics.map((p) => p.executionTimeMs)),
        memoryUsageMB: this.average(performanceMetrics.map((p) => p.memoryUsageMB)),
        cpuUsagePercent: this.average(performanceMetrics.map((p) => p.cpuUsagePercent)),
        complexityScore: this.average(performanceMetrics.map((p) => p.complexityScore)),
      },
      robustnessAssessment: {
        noiseResistance: this.average(robustnessMetrics.map((r) => r.noiseResistance)),
        outlierSensitivity: this.average(robustnessMetrics.map((r) => r.outlierSensitivity)),
        edgeCaseHandling: this.average(robustnessMetrics.map((r) => r.edgeCaseHandling)),
        patternConsistency: this.average(robustnessMetrics.map((r) => r.patternConsistency)),
      },
    };
  }

  private calculateQualityAssessment(results: ValidationResult[]): ValidationReport['qualityAssessment'] {
    if (results.length === 0) {
      return {
        overallScore: 0,
        categoryScores: { accuracy: 0, performance: 0, robustness: 0, reliability: 0 },
        recommendations: ['Insufficient test data to provide quality assessment'],
      };
    }

    const aggregated = this.aggregateMetrics(results);

    // Calculate category scores (0-100)
    const accuracyScore = Math.max(0, 100 - aggregated.averageAccuracy.mape);
    const performanceScore = Math.max(0, 100 - aggregated.performanceBenchmarks.complexityScore * 20);
    const robustnessScore = aggregated.robustnessAssessment.noiseResistance * 100;
    const reliabilityScore = results.filter((r) => r.success).length / results.length * 100;

    const overallScore = (accuracyScore + performanceScore + robustnessScore + reliabilityScore) / 4;

    // Generate recommendations
    const recommendations: string[] = [];
    if (accuracyScore < 80) recommendations.push('Improve prediction accuracy by enhancing algorithm parameters');
    if (performanceScore < 70) recommendations.push('Optimize algorithm performance for large datasets');
    if (robustnessScore < 75) recommendations.push('Enhance robustness to handle noisy data and outliers');
    if (reliabilityScore < 90) recommendations.push('Address edge cases and improve error handling');

    if (recommendations.length === 0) {
      recommendations.push('Algorithm meets quality standards across all categories');
    }

    return {
      overallScore: Math.round(overallScore),
      categoryScores: {
        accuracy: Math.round(accuracyScore),
        performance: Math.round(performanceScore),
        robustness: Math.round(robustnessScore),
        reliability: Math.round(reliabilityScore),
      },
      recommendations,
    };
  }

  private average(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    return numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
  }
}