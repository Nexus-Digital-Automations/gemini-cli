/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { CostDataPoint } from '../types.js';
/**
 * Performance benchmark for algorithm comparison
 */
export interface PerformanceBenchmark {
  /** Benchmark identifier */
  id: string;
  /** Algorithm name */
  algorithmName: string;
  /** Benchmark timestamp */
  timestamp: Date;
  /** Dataset size used for benchmarking */
  datasetSize: number;
  /** Performance metrics collected */
  metrics: {
    /** Execution time in milliseconds */
    executionTime: number;
    /** Memory usage in MB */
    memoryUsage: number;
    /** CPU utilization percentage */
    cpuUsage: number;
    /** Throughput (data points per second) */
    throughput: number;
    /** Latency percentiles */
    latency: {
      p50: number;
      p90: number;
      p95: number;
      p99: number;
    };
  };
  /** Environment information */
  environment: {
    /** Node.js version */
    nodeVersion: string;
    /** Platform information */
    platform: string;
    /** Available memory */
    totalMemory: number;
    /** CPU count */
    cpuCount: number;
  };
}
/**
 * Performance trend analysis
 */
export interface PerformanceTrend {
  /** Metric name */
  metric: string;
  /** Time period analyzed */
  period: {
    start: Date;
    end: Date;
  };
  /** Trend direction */
  direction: 'improving' | 'degrading' | 'stable';
  /** Trend strength (0-1) */
  strength: number;
  /** Statistical significance */
  significance: number;
  /** Recent data points */
  dataPoints: Array<{
    timestamp: Date;
    value: number;
  }>;
  /** Regression analysis */
  regression: {
    slope: number;
    intercept: number;
    rSquared: number;
  };
}
/**
 * Performance alert configuration
 */
export interface PerformanceAlert {
  /** Alert identifier */
  id: string;
  /** Metric to monitor */
  metric: keyof PerformanceBenchmark['metrics'];
  /** Alert threshold */
  threshold: {
    /** Threshold value */
    value: number;
    /** Comparison operator */
    operator: 'greater_than' | 'less_than' | 'percentage_change';
    /** Time window for evaluation */
    timeWindow: number;
  };
  /** Alert severity */
  severity: 'info' | 'warning' | 'critical';
  /** Alert status */
  status: 'active' | 'suppressed' | 'resolved';
  /** Last triggered timestamp */
  lastTriggered?: Date;
}
/**
 * Performance degradation detection result
 */
export interface DegradationDetection {
  /** Detection timestamp */
  timestamp: Date;
  /** Algorithm affected */
  algorithm: string;
  /** Detected issues */
  issues: Array<{
    /** Issue type */
    type:
      | 'performance_regression'
      | 'memory_leak'
      | 'cpu_spike'
      | 'latency_increase';
    /** Issue severity */
    severity: 'low' | 'medium' | 'high' | 'critical';
    /** Issue description */
    description: string;
    /** Affected metric */
    metric: string;
    /** Current value */
    currentValue: number;
    /** Baseline value */
    baselineValue: number;
    /** Degradation percentage */
    degradationPercent: number;
  }>;
  /** Recommended actions */
  recommendations: string[];
}
/**
 * Performance monitoring and benchmarking system
 * Tracks algorithm performance over time and detects degradation
 */
export declare class PerformanceMonitor {
  private logger;
  private benchmarks;
  private alerts;
  private monitoringInterval;
  constructor();
  /**
   * Initialize default performance alerts
   */
  private initializeDefaultAlerts;
  /**
   * Benchmark algorithm performance
   */
  benchmarkAlgorithm<T>(
    algorithmName: string,
    algorithm: (data: CostDataPoint[]) => T,
    testData: CostDataPoint[],
  ): Promise<PerformanceBenchmark>;
  /**
   * Run detailed performance benchmark
   */
  private runPerformanceBenchmark;
  /**
   * Analyze performance trends over time
   */
  analyzePerformanceTrends(
    algorithmName: string,
    timeWindow?: number,
  ): PerformanceTrend[];
  /**
   * Detect performance degradation
   */
  detectPerformanceDegradation(
    algorithmName: string,
  ): Promise<DegradationDetection | null>;
  /**
   * Start continuous performance monitoring
   */
  startContinuousMonitoring(intervalMs?: number): void;
  /**
   * Stop continuous performance monitoring
   */
  stopContinuousMonitoring(): void;
  /**
   * Get performance summary for an algorithm
   */
  getPerformanceSummary(algorithmName: string): {
    totalBenchmarks: number;
    averageMetrics: PerformanceBenchmark['metrics'];
    recentTrends: PerformanceTrend[];
    lastDegradationCheck?: DegradationDetection | null;
  };
  private calculatePercentile;
  private calculateTrendForMetric;
  private getMetricValue;
  private detectMetricDegradation;
  private calculateMetricAverage;
  private generateDegradationRecommendations;
  private calculateAverageMetrics;
  private checkPerformanceAlerts;
  private performContinuousCheck;
}
