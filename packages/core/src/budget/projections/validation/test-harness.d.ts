/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { CostDataPoint } from '../types.js';
import type {
  ValidationReport,
  ValidationTestCase,
} from './algorithm-validator.js';
import type {
  PerformanceBenchmark,
  DegradationDetection,
} from './performance-monitor.js';
/**
 * Test suite configuration
 */
export interface TestSuiteConfig {
  /** Test suite identifier */
  id: string;
  /** Test suite name */
  name: string;
  /** Test description */
  description: string;
  /** Test categories to include */
  categories: Array<ValidationTestCase['category']>;
  /** Performance benchmarking enabled */
  enablePerformanceBenchmarking: boolean;
  /** Continuous monitoring enabled */
  enableContinuousMonitoring: boolean;
  /** Test timeout in milliseconds */
  timeoutMs: number;
  /** Maximum allowed failures before stopping */
  maxFailures: number;
}
/**
 * Test execution result
 */
export interface TestExecutionResult {
  /** Test suite configuration */
  config: TestSuiteConfig;
  /** Execution timestamp */
  timestamp: Date;
  /** Total execution time */
  executionTimeMs: number;
  /** Validation results */
  validationReport: ValidationReport;
  /** Performance benchmarks */
  performanceBenchmarks: PerformanceBenchmark[];
  /** Degradation detection results */
  degradationDetection: DegradationDetection[];
  /** Overall test success */
  success: boolean;
  /** Error details if test suite failed */
  error?: {
    message: string;
    stack?: string;
  };
}
/**
 * Algorithm test specification
 */
export interface AlgorithmTestSpec {
  /** Algorithm identifier */
  id: string;
  /** Algorithm name */
  name: string;
  /** Algorithm function to test */
  algorithm: (data: CostDataPoint[]) => any;
  /** Custom test cases for this algorithm */
  customTestCases?: ValidationTestCase[];
  /** Expected performance benchmarks */
  expectedBenchmarks?: {
    maxExecutionTime?: number;
    maxMemoryUsage?: number;
    minThroughput?: number;
  };
}
/**
 * Test data generator configuration
 */
export interface TestDataConfig {
  /** Data generation type */
  type: 'linear' | 'seasonal' | 'random' | 'noisy' | 'outliers' | 'mixed';
  /** Number of data points */
  dataPoints: number;
  /** Base value for generation */
  baseValue: number;
  /** Additional parameters based on type */
  parameters: Record<string, number>;
}
/**
 * Comprehensive test harness for cost projection algorithms
 * Provides automated testing, validation, and performance monitoring
 */
export declare class TestHarness {
  private logger;
  private validator;
  private performanceMonitor;
  private testDataCache;
  constructor();
  /**
   * Execute comprehensive test suite for an algorithm
   */
  executeTestSuite(
    algorithmSpec: AlgorithmTestSpec,
    config: TestSuiteConfig,
  ): Promise<TestExecutionResult>;
  /**
   * Generate comprehensive test data sets
   */
  generateTestData(configs: TestDataConfig[]): Map<string, CostDataPoint[]>;
  /**
   * Run batch validation across multiple algorithms
   */
  runBatchValidation(
    algorithmSpecs: AlgorithmTestSpec[],
    testSuiteConfig: TestSuiteConfig,
  ): Promise<Map<string, TestExecutionResult>>;
  /**
   * Generate comprehensive test report
   */
  generateComprehensiveReport(results: Map<string, TestExecutionResult>): {
    summary: {
      totalAlgorithms: number;
      successfulAlgorithms: number;
      failedAlgorithms: number;
      overallSuccessRate: number;
      averageQualityScore: number;
    };
    algorithmResults: Array<{
      algorithm: string;
      success: boolean;
      qualityScore: number;
      performanceScore: number;
      issues: string[];
      recommendations: string[];
    }>;
    qualityAssessment: {
      bestPerformingAlgorithm: string;
      worstPerformingAlgorithm: string;
      commonIssues: string[];
      overallRecommendations: string[];
    };
  };
  /**
   * Start continuous testing mode
   */
  startContinuousTesting(
    algorithmSpecs: AlgorithmTestSpec[],
    config: TestSuiteConfig,
    intervalMs?: number,
  ): NodeJS.Timeout;
  private runTestSuite;
  private generateDataByType;
  private generateLinearData;
  private generateSeasonalData;
  private generateRandomData;
  private generateNoisyData;
  private generateOutlierData;
  private generateMixedData;
  private createDataPoint;
  private createCacheKey;
  private calculatePerformanceScore;
  private extractIssues;
  private generateOverallRecommendations;
}
