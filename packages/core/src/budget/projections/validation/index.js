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
// Core validation framework
export { AlgorithmValidator } from './algorithm-validator.js';
// Performance monitoring system
export { PerformanceMonitor } from './performance-monitor.js';
// Comprehensive test harness
export { TestHarness } from './test-harness.js';
/**
 * Validation framework utilities and helper functions
 */
export const ValidationUtils = {
  /**
   * Create standard test suite configuration
   */
  createStandardTestConfig: (name) => ({
    id: `test_${Date.now()}`,
    name,
    description: `Standard validation test suite for ${name}`,
    categories: ['accuracy', 'performance', 'robustness', 'edge_case'],
    enablePerformanceBenchmarking: true,
    enableContinuousMonitoring: true,
    timeoutMs: 300000, // 5 minutes
    maxFailures: 5,
  }),
  /**
   * Create performance test configuration
   */
  createPerformanceTestConfig: (name) => ({
    id: `perf_${Date.now()}`,
    name: `Performance Test: ${name}`,
    description: `Performance-focused validation for ${name}`,
    categories: ['performance'],
    enablePerformanceBenchmarking: true,
    enableContinuousMonitoring: true,
    timeoutMs: 600000, // 10 minutes
    maxFailures: 2,
  }),
  /**
   * Create accuracy test configuration
   */
  createAccuracyTestConfig: (name) => ({
    id: `accuracy_${Date.now()}`,
    name: `Accuracy Test: ${name}`,
    description: `Accuracy-focused validation for ${name}`,
    categories: ['accuracy', 'edge_case'],
    enablePerformanceBenchmarking: false,
    enableContinuousMonitoring: false,
    timeoutMs: 120000, // 2 minutes
    maxFailures: 3,
  }),
  /**
   * Create standard test data configurations
   */
  createStandardTestDataConfigs: () => [
    {
      type: 'linear',
      dataPoints: 100,
      baseValue: 50,
      parameters: { slope: 2 },
    },
    {
      type: 'seasonal',
      dataPoints: 365,
      baseValue: 100,
      parameters: { amplitude: 30, period: 365 },
    },
    {
      type: 'random',
      dataPoints: 200,
      baseValue: 75,
      parameters: { variance: 15 },
    },
    {
      type: 'noisy',
      dataPoints: 150,
      baseValue: 60,
      parameters: { noiseLevel: 0.2 },
    },
    {
      type: 'outliers',
      dataPoints: 120,
      baseValue: 80,
      parameters: { outlierCount: 6 },
    },
    {
      type: 'mixed',
      dataPoints: 400,
      baseValue: 90,
      parameters: {},
    },
  ],
  /**
   * Quality score interpretation
   */
  interpretQualityScore: (score) => {
    if (score >= 90) {
      return {
        grade: 'A',
        description: 'Excellent algorithm performance',
        actionRequired: false,
      };
    } else if (score >= 80) {
      return {
        grade: 'B',
        description:
          'Good algorithm performance with minor improvements needed',
        actionRequired: false,
      };
    } else if (score >= 70) {
      return {
        grade: 'C',
        description: 'Acceptable performance but optimization recommended',
        actionRequired: true,
      };
    } else if (score >= 60) {
      return {
        grade: 'D',
        description: 'Poor performance requiring immediate attention',
        actionRequired: true,
      };
    } else {
      return {
        grade: 'F',
        description: 'Unacceptable performance requiring major revision',
        actionRequired: true,
      };
    }
  },
  /**
   * Performance score interpretation
   */
  interpretPerformanceScore: (executionTime, memoryUsage, throughput) => {
    const bottlenecks = [];
    const recommendations = [];
    // Analyze execution time
    if (executionTime > 5000) {
      bottlenecks.push('Slow execution time');
      recommendations.push(
        'Optimize algorithm complexity or implement caching',
      );
    }
    // Analyze memory usage
    if (memoryUsage > 100) {
      bottlenecks.push('High memory usage');
      recommendations.push('Review data structures and memory management');
    }
    // Analyze throughput
    if (throughput < 50) {
      bottlenecks.push('Low throughput');
      recommendations.push(
        'Consider parallel processing or algorithmic improvements',
      );
    }
    // Determine overall performance
    let overall;
    if (bottlenecks.length === 0) {
      overall = 'excellent';
    } else if (bottlenecks.length === 1) {
      overall = 'good';
    } else if (bottlenecks.length === 2) {
      overall = 'fair';
    } else {
      overall = 'poor';
    }
    return { overall, bottlenecks, recommendations };
  },
};
/**
 * Validation framework constants
 */
export const ValidationConstants = {
  /** Default quality thresholds */
  QUALITY_THRESHOLDS: {
    EXCELLENT: 90,
    GOOD: 80,
    ACCEPTABLE: 70,
    POOR: 60,
  },
  /** Default performance thresholds */
  PERFORMANCE_THRESHOLDS: {
    EXECUTION_TIME_WARNING: 3000, // milliseconds
    EXECUTION_TIME_CRITICAL: 10000, // milliseconds
    MEMORY_USAGE_WARNING: 50, // MB
    MEMORY_USAGE_CRITICAL: 200, // MB
    THROUGHPUT_MINIMUM: 10, // data points per second
  },
  /** Default accuracy thresholds */
  ACCURACY_THRESHOLDS: {
    MAPE_EXCELLENT: 5, // %
    MAPE_GOOD: 10, // %
    MAPE_ACCEPTABLE: 20, // %
    R_SQUARED_MINIMUM: 0.7,
  },
  /** Test data size recommendations */
  TEST_DATA_SIZES: {
    SMALL: 100,
    MEDIUM: 1000,
    LARGE: 10000,
    XLARGE: 100000,
  },
  /** Monitoring intervals */
  MONITORING_INTERVALS: {
    FREQUENT: 60000, // 1 minute
    REGULAR: 300000, // 5 minutes
    HOURLY: 3600000, // 1 hour
    DAILY: 86400000, // 24 hours
  },
};
/**
 * Validation framework version information
 */
export const ValidationFramework = {
  VERSION: '1.0.0',
  NAME: 'Cost Projection Validation Framework',
  DESCRIPTION:
    'Comprehensive testing and validation system for cost projection algorithms',
  AUTHOR: 'Google LLC',
  LICENSE: 'Apache-2.0',
};
//# sourceMappingURL=index.js.map
