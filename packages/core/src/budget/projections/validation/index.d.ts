/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Validation framework for cost projection algorithms
 * Provides comprehensive testing, performance monitoring, and quality assessment
 *
 * @example Basic Algorithm Validation
 * ```typescript
 * import { AlgorithmValidator } from './validation';
 *
 * const validator = new AlgorithmValidator();
 * const report = await validator.runValidationSuite(myAlgorithm);
 * console.log(`Quality Score: ${report.qualityAssessment.overallScore}`);
 * ```
 *
 * @example Performance Monitoring
 * ```typescript
 * import { PerformanceMonitor } from './validation';
 *
 * const monitor = new PerformanceMonitor();
 * const benchmark = await monitor.benchmarkAlgorithm('myAlgorithm', algorithm, testData);
 * monitor.startContinuousMonitoring(300000); // 5 minutes
 * ```
 *
 * @example Comprehensive Testing
 * ```typescript
 * import { TestHarness } from './validation';
 *
 * const harness = new TestHarness();
 * const result = await harness.executeTestSuite(algorithmSpec, testConfig);
 * const report = harness.generateComprehensiveReport(new Map([['myAlg', result]]));
 * ```
 */
export {
  AlgorithmValidator,
  type ValidationMetrics,
  type ValidationTestCase,
  type ValidationResult,
  type ValidationReport,
} from './algorithm-validator.js';
export {
  PerformanceMonitor,
  type PerformanceBenchmark,
  type PerformanceTrend,
  type PerformanceAlert,
  type DegradationDetection,
} from './performance-monitor.js';
export {
  TestHarness,
  type TestSuiteConfig,
  type TestExecutionResult,
  type AlgorithmTestSpec,
  type TestDataConfig,
} from './test-harness.js';
/**
 * Validation framework utilities and helper functions
 */
export declare const ValidationUtils: {
  /**
   * Create standard test suite configuration
   */
  createStandardTestConfig: (
    name: string,
  ) => import('./test-harness.js').TestSuiteConfig;
  /**
   * Create performance test configuration
   */
  createPerformanceTestConfig: (
    name: string,
  ) => import('./test-harness.js').TestSuiteConfig;
  /**
   * Create accuracy test configuration
   */
  createAccuracyTestConfig: (
    name: string,
  ) => import('./test-harness.js').TestSuiteConfig;
  /**
   * Create standard test data configurations
   */
  createStandardTestDataConfigs: () => Array<
    import('./test-harness.js').TestDataConfig
  >;
  /**
   * Quality score interpretation
   */
  interpretQualityScore: (score: number) => {
    grade: 'A' | 'B' | 'C' | 'D' | 'F';
    description: string;
    actionRequired: boolean;
  };
  /**
   * Performance score interpretation
   */
  interpretPerformanceScore: (
    executionTime: number,
    memoryUsage: number,
    throughput: number,
  ) => {
    overall: 'excellent' | 'good' | 'fair' | 'poor';
    bottlenecks: string[];
    recommendations: string[];
  };
};
/**
 * Validation framework constants
 */
export declare const ValidationConstants: {
  /** Default quality thresholds */
  QUALITY_THRESHOLDS: {
    EXCELLENT: number;
    GOOD: number;
    ACCEPTABLE: number;
    POOR: number;
  };
  /** Default performance thresholds */
  PERFORMANCE_THRESHOLDS: {
    EXECUTION_TIME_WARNING: number;
    EXECUTION_TIME_CRITICAL: number;
    MEMORY_USAGE_WARNING: number;
    MEMORY_USAGE_CRITICAL: number;
    THROUGHPUT_MINIMUM: number;
  };
  /** Default accuracy thresholds */
  ACCURACY_THRESHOLDS: {
    MAPE_EXCELLENT: number;
    MAPE_GOOD: number;
    MAPE_ACCEPTABLE: number;
    R_SQUARED_MINIMUM: number;
  };
  /** Test data size recommendations */
  TEST_DATA_SIZES: {
    SMALL: number;
    MEDIUM: number;
    LARGE: number;
    XLARGE: number;
  };
  /** Monitoring intervals */
  MONITORING_INTERVALS: {
    FREQUENT: number;
    REGULAR: number;
    HOURLY: number;
    DAILY: number;
  };
};
/**
 * Validation framework version information
 */
export declare const ValidationFramework: {
  readonly VERSION: '1.0.0';
  readonly NAME: 'Cost Projection Validation Framework';
  readonly DESCRIPTION: 'Comprehensive testing and validation system for cost projection algorithms';
  readonly AUTHOR: 'Google LLC';
  readonly LICENSE: 'Apache-2.0';
};
