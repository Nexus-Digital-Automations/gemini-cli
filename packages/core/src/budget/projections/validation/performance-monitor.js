/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { Logger } from '../../utils/logger.js';
import os from 'node:os';
/**
 * Performance monitoring and benchmarking system
 * Tracks algorithm performance over time and detects degradation
 */
export class PerformanceMonitor {
  logger;
  benchmarks = new Map();
  alerts = new Map();
  monitoringInterval = null;
  constructor() {
    this.logger = new Logger('PerformanceMonitor');
    this.logger.info('Performance monitor initialized');
    this.initializeDefaultAlerts();
  }
  /**
   * Initialize default performance alerts
   */
  initializeDefaultAlerts() {
    const defaultAlerts = [
      {
        id: 'execution_time_critical',
        metric: 'executionTime',
        threshold: {
          value: 10000, // 10 seconds
          operator: 'greater_than',
          timeWindow: 60000, // 1 minute
        },
        severity: 'critical',
        status: 'active',
      },
      {
        id: 'memory_usage_warning',
        metric: 'memoryUsage',
        threshold: {
          value: 500, // 500 MB
          operator: 'greater_than',
          timeWindow: 300000, // 5 minutes
        },
        severity: 'warning',
        status: 'active',
      },
      {
        id: 'performance_regression',
        metric: 'throughput',
        threshold: {
          value: -20, // 20% decrease
          operator: 'percentage_change',
          timeWindow: 3600000, // 1 hour
        },
        severity: 'warning',
        status: 'active',
      },
    ];
    defaultAlerts.forEach((alert) => {
      this.alerts.set(alert.id, alert);
    });
    this.logger.info('Default performance alerts initialized', {
      alertCount: defaultAlerts.length,
    });
  }
  /**
   * Benchmark algorithm performance
   */
  async benchmarkAlgorithm(algorithmName, algorithm, testData) {
    const startTime = Date.now();
    this.logger.info(`Starting performance benchmark for ${algorithmName}`, {
      datasetSize: testData.length,
    });
    try {
      const benchmark = await this.runPerformanceBenchmark(
        algorithmName,
        algorithm,
        testData,
      );
      // Store benchmark result
      const algorithmBenchmarks = this.benchmarks.get(algorithmName) || [];
      algorithmBenchmarks.push(benchmark);
      this.benchmarks.set(algorithmName, algorithmBenchmarks);
      // Check for performance alerts
      await this.checkPerformanceAlerts(benchmark);
      const duration = Date.now() - startTime;
      this.logger.info(`Performance benchmark completed for ${algorithmName}`, {
        benchmarkId: benchmark.id,
        executionTime: benchmark.metrics.executionTime,
        memoryUsage: benchmark.metrics.memoryUsage,
        throughput: benchmark.metrics.throughput,
        benchmarkingTime: duration,
      });
      return benchmark;
    } catch (error) {
      this.logger.error(
        `Performance benchmarking failed for ${algorithmName}`,
        {
          error: error.message,
          stack: error.stack,
        },
      );
      throw error;
    }
  }
  /**
   * Run detailed performance benchmark
   */
  async runPerformanceBenchmark(algorithmName, algorithm, testData) {
    const benchmarkId = `${algorithmName}_${Date.now()}`;
    const latencyMeasurements = [];
    // Collect environment information
    const environment = {
      nodeVersion: process.version,
      platform: `${process.platform} ${process.arch}`,
      totalMemory: Math.round(os.totalmem() / 1024 / 1024), // MB
      cpuCount: os.cpus().length,
    };
    // Warm-up runs
    for (let i = 0; i < 3; i++) {
      algorithm(testData.slice(0, Math.min(100, testData.length)));
    }
    // Multiple measurement runs for latency percentiles
    const numRuns = 10;
    let totalExecutionTime = 0;
    let totalMemoryUsage = 0;
    let totalCpuUsage = 0;
    for (let run = 0; run < numRuns; run++) {
      const memoryBefore = process.memoryUsage();
      const cpuBefore = process.cpuUsage();
      const runStartTime = Date.now();
      // Execute algorithm
      algorithm(testData);
      const runEndTime = Date.now();
      const cpuAfter = process.cpuUsage(cpuBefore);
      const memoryAfter = process.memoryUsage();
      const runExecutionTime = runEndTime - runStartTime;
      const runMemoryUsage =
        (memoryAfter.heapUsed - memoryBefore.heapUsed) / 1024 / 1024;
      const runCpuUsage =
        ((cpuAfter.user + cpuAfter.system) / 1000 / runExecutionTime) * 100;
      latencyMeasurements.push(runExecutionTime);
      totalExecutionTime += runExecutionTime;
      totalMemoryUsage += Math.max(0, runMemoryUsage);
      totalCpuUsage += Math.min(100, runCpuUsage);
    }
    // Calculate metrics
    const avgExecutionTime = totalExecutionTime / numRuns;
    const avgMemoryUsage = totalMemoryUsage / numRuns;
    const avgCpuUsage = totalCpuUsage / numRuns;
    const throughput = testData.length / (avgExecutionTime / 1000); // points per second
    // Calculate latency percentiles
    latencyMeasurements.sort((a, b) => a - b);
    const latency = {
      p50: this.calculatePercentile(latencyMeasurements, 50),
      p90: this.calculatePercentile(latencyMeasurements, 90),
      p95: this.calculatePercentile(latencyMeasurements, 95),
      p99: this.calculatePercentile(latencyMeasurements, 99),
    };
    return {
      id: benchmarkId,
      algorithmName,
      timestamp: new Date(),
      datasetSize: testData.length,
      metrics: {
        executionTime: avgExecutionTime,
        memoryUsage: avgMemoryUsage,
        cpuUsage: avgCpuUsage,
        throughput,
        latency,
      },
      environment,
    };
  }
  /**
   * Analyze performance trends over time
   */
  analyzePerformanceTrends(
    algorithmName,
    timeWindow = 7 * 24 * 60 * 60 * 1000,
  ) {
    const startTime = Date.now();
    this.logger.info(`Analyzing performance trends for ${algorithmName}`, {
      timeWindow,
    });
    try {
      const benchmarks = this.benchmarks.get(algorithmName) || [];
      const cutoffTime = new Date(Date.now() - timeWindow);
      const recentBenchmarks = benchmarks.filter(
        (b) => b.timestamp >= cutoffTime,
      );
      if (recentBenchmarks.length < 3) {
        this.logger.warn('Insufficient data for trend analysis', {
          algorithm: algorithmName,
          benchmarkCount: recentBenchmarks.length,
        });
        return [];
      }
      const trends = [];
      const metrics = [
        'executionTime',
        'memoryUsage',
        'cpuUsage',
        'throughput',
      ];
      metrics.forEach((metric) => {
        const trend = this.calculateTrendForMetric(
          algorithmName,
          metric,
          recentBenchmarks,
        );
        if (trend) {
          trends.push(trend);
        }
      });
      const duration = Date.now() - startTime;
      this.logger.info(
        `Performance trend analysis completed for ${algorithmName}`,
        {
          trendCount: trends.length,
          analysisTime: duration,
        },
      );
      return trends;
    } catch (error) {
      this.logger.error(
        `Performance trend analysis failed for ${algorithmName}`,
        {
          error: error.message,
          stack: error.stack,
        },
      );
      throw error;
    }
  }
  /**
   * Detect performance degradation
   */
  async detectPerformanceDegradation(algorithmName) {
    const startTime = Date.now();
    this.logger.info(`Detecting performance degradation for ${algorithmName}`);
    try {
      const benchmarks = this.benchmarks.get(algorithmName) || [];
      if (benchmarks.length < 10) {
        this.logger.info(
          'Insufficient benchmark history for degradation detection',
          {
            algorithm: algorithmName,
            benchmarkCount: benchmarks.length,
          },
        );
        return null;
      }
      const recentBenchmarks = benchmarks.slice(-5); // Last 5 benchmarks
      const baselineBenchmarks = benchmarks.slice(-15, -5); // Previous 10 benchmarks
      const issues = [];
      // Check each metric for degradation
      const metrics = [
        { key: 'executionTime', threshold: 0.2, direction: 'increase' },
        { key: 'memoryUsage', threshold: 0.3, direction: 'increase' },
        { key: 'throughput', threshold: -0.2, direction: 'decrease' },
      ];
      metrics.forEach((metric) => {
        const issue = this.detectMetricDegradation(
          metric.key,
          metric.threshold,
          metric.direction,
          recentBenchmarks,
          baselineBenchmarks,
        );
        if (issue) {
          issues.push(issue);
        }
      });
      if (issues.length === 0) {
        const duration = Date.now() - startTime;
        this.logger.info(
          `No performance degradation detected for ${algorithmName}`,
          {
            detectionTime: duration,
          },
        );
        return null;
      }
      // Generate recommendations
      const recommendations = this.generateDegradationRecommendations(issues);
      const degradationDetection = {
        timestamp: new Date(),
        algorithm: algorithmName,
        issues,
        recommendations,
      };
      const duration = Date.now() - startTime;
      this.logger.warn(
        `Performance degradation detected for ${algorithmName}`,
        {
          issueCount: issues.length,
          detectionTime: duration,
          issues: issues.map((issue) => ({
            type: issue.type,
            severity: issue.severity,
            metric: issue.metric,
            degradationPercent: issue.degradationPercent,
          })),
        },
      );
      return degradationDetection;
    } catch (error) {
      this.logger.error(
        `Performance degradation detection failed for ${algorithmName}`,
        {
          error: error.message,
          stack: error.stack,
        },
      );
      throw error;
    }
  }
  /**
   * Start continuous performance monitoring
   */
  startContinuousMonitoring(intervalMs = 300000) {
    // 5 minutes
    if (this.monitoringInterval) {
      this.logger.warn('Continuous monitoring already active');
      return;
    }
    this.logger.info('Starting continuous performance monitoring', {
      intervalMs,
    });
    this.monitoringInterval = setInterval(async () => {
      try {
        await this.performContinuousCheck();
      } catch (error) {
        this.logger.error('Continuous monitoring check failed', {
          error: error.message,
        });
      }
    }, intervalMs);
  }
  /**
   * Stop continuous performance monitoring
   */
  stopContinuousMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      this.logger.info('Continuous performance monitoring stopped');
    }
  }
  /**
   * Get performance summary for an algorithm
   */
  getPerformanceSummary(algorithmName) {
    const benchmarks = this.benchmarks.get(algorithmName) || [];
    if (benchmarks.length === 0) {
      throw new Error(`No benchmarks found for algorithm: ${algorithmName}`);
    }
    // Calculate average metrics
    const avgMetrics = this.calculateAverageMetrics(benchmarks);
    // Get recent trends
    const recentTrends = this.analyzePerformanceTrends(algorithmName);
    return {
      totalBenchmarks: benchmarks.length,
      averageMetrics: avgMetrics,
      recentTrends,
    };
  }
  // Private helper methods
  calculatePercentile(sortedValues, percentile) {
    if (sortedValues.length === 0) return 0;
    const index = (percentile / 100) * (sortedValues.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    if (lower === upper) {
      return sortedValues[lower];
    }
    const weight = index - lower;
    return sortedValues[lower] * (1 - weight) + sortedValues[upper] * weight;
  }
  calculateTrendForMetric(algorithmName, metric, benchmarks) {
    if (benchmarks.length < 3) return null;
    const dataPoints = benchmarks.map((b) => ({
      timestamp: b.timestamp,
      value: this.getMetricValue(b, metric),
    }));
    // Calculate linear regression
    const n = dataPoints.length;
    const xValues = dataPoints.map((_, i) => i);
    const yValues = dataPoints.map((d) => d.value);
    const sumX = xValues.reduce((sum, x) => sum + x, 0);
    const sumY = yValues.reduce((sum, y) => sum + y, 0);
    const sumXY = xValues.reduce((sum, x, i) => sum + x * yValues[i], 0);
    const sumXX = xValues.reduce((sum, x) => sum + x * x, 0);
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    // Calculate R-squared
    const yMean = sumY / n;
    const totalSumSquares = yValues.reduce(
      (sum, y) => sum + Math.pow(y - yMean, 2),
      0,
    );
    const residualSumSquares = yValues.reduce(
      (sum, y, i) => sum + Math.pow(y - (slope * i + intercept), 2),
      0,
    );
    const rSquared = 1 - residualSumSquares / totalSumSquares;
    // Determine trend direction and strength
    const direction =
      Math.abs(slope) < 0.001
        ? 'stable'
        : slope > 0
          ? 'improving'
          : 'degrading';
    const strength = Math.min(1, Math.abs(slope) / (yMean || 1));
    const significance = rSquared;
    return {
      metric,
      period: {
        start: benchmarks[0].timestamp,
        end: benchmarks[benchmarks.length - 1].timestamp,
      },
      direction,
      strength,
      significance,
      dataPoints,
      regression: {
        slope,
        intercept,
        rSquared,
      },
    };
  }
  getMetricValue(benchmark, metric) {
    switch (metric) {
      case 'executionTime':
        return benchmark.metrics.executionTime;
      case 'memoryUsage':
        return benchmark.metrics.memoryUsage;
      case 'cpuUsage':
        return benchmark.metrics.cpuUsage;
      case 'throughput':
        return benchmark.metrics.throughput;
      default:
        return 0;
    }
  }
  detectMetricDegradation(
    metricKey,
    threshold,
    direction,
    recentBenchmarks,
    baselineBenchmarks,
  ) {
    if (recentBenchmarks.length === 0 || baselineBenchmarks.length === 0) {
      return null;
    }
    const recentAvg = this.calculateMetricAverage(recentBenchmarks, metricKey);
    const baselineAvg = this.calculateMetricAverage(
      baselineBenchmarks,
      metricKey,
    );
    const changePercent = (recentAvg - baselineAvg) / baselineAvg;
    let isDegradation = false;
    if (direction === 'increase' && changePercent > threshold) {
      isDegradation = true;
    } else if (direction === 'decrease' && changePercent < threshold) {
      isDegradation = true;
    }
    if (!isDegradation) {
      return null;
    }
    // Determine severity based on change magnitude
    let severity = 'low';
    const absChangePercent = Math.abs(changePercent);
    if (absChangePercent > 0.5) severity = 'critical';
    else if (absChangePercent > 0.3) severity = 'high';
    else if (absChangePercent > 0.15) severity = 'medium';
    // Determine issue type
    let issueType = 'performance_regression';
    if (metricKey === 'memoryUsage' && changePercent > 0.3) {
      issueType = 'memory_leak';
    } else if (metricKey === 'cpuUsage' && changePercent > 0.5) {
      issueType = 'cpu_spike';
    } else if (metricKey === 'executionTime' && changePercent > 0.2) {
      issueType = 'latency_increase';
    }
    return {
      type: issueType,
      severity,
      description: `${String(metricKey)} has ${direction === 'increase' ? 'increased' : 'decreased'} by ${Math.round(absChangePercent * 100)}%`,
      metric: String(metricKey),
      currentValue: recentAvg,
      baselineValue: baselineAvg,
      degradationPercent: absChangePercent * 100,
    };
  }
  calculateMetricAverage(benchmarks, metricKey) {
    if (benchmarks.length === 0) return 0;
    const values = benchmarks.map((b) =>
      this.getMetricValue(b, String(metricKey)),
    );
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }
  generateDegradationRecommendations(issues) {
    const recommendations = [];
    const hasMemoryIssues = issues.some((i) => i.type === 'memory_leak');
    const hasLatencyIssues = issues.some((i) => i.type === 'latency_increase');
    const hasCpuIssues = issues.some((i) => i.type === 'cpu_spike');
    if (hasMemoryIssues) {
      recommendations.push(
        'Investigate potential memory leaks and optimize data structures',
      );
      recommendations.push(
        'Review object lifecycle management and garbage collection patterns',
      );
    }
    if (hasLatencyIssues) {
      recommendations.push(
        'Profile algorithm execution to identify bottlenecks',
      );
      recommendations.push(
        'Consider algorithmic optimizations or caching strategies',
      );
    }
    if (hasCpuIssues) {
      recommendations.push(
        'Analyze computational complexity and optimize hot paths',
      );
      recommendations.push(
        'Consider parallelization or asynchronous processing',
      );
    }
    if (issues.some((i) => i.severity === 'critical')) {
      recommendations.push(
        'URGENT: Review recent code changes that may have caused regression',
      );
      recommendations.push(
        'Consider rolling back to previous stable version if issue persists',
      );
    }
    return recommendations;
  }
  calculateAverageMetrics(benchmarks) {
    if (benchmarks.length === 0) {
      return {
        executionTime: 0,
        memoryUsage: 0,
        cpuUsage: 0,
        throughput: 0,
        latency: { p50: 0, p90: 0, p95: 0, p99: 0 },
      };
    }
    const sums = benchmarks.reduce(
      (acc, benchmark) => ({
        executionTime: acc.executionTime + benchmark.metrics.executionTime,
        memoryUsage: acc.memoryUsage + benchmark.metrics.memoryUsage,
        cpuUsage: acc.cpuUsage + benchmark.metrics.cpuUsage,
        throughput: acc.throughput + benchmark.metrics.throughput,
        latency: {
          p50: acc.latency.p50 + benchmark.metrics.latency.p50,
          p90: acc.latency.p90 + benchmark.metrics.latency.p90,
          p95: acc.latency.p95 + benchmark.metrics.latency.p95,
          p99: acc.latency.p99 + benchmark.metrics.latency.p99,
        },
      }),
      {
        executionTime: 0,
        memoryUsage: 0,
        cpuUsage: 0,
        throughput: 0,
        latency: { p50: 0, p90: 0, p95: 0, p99: 0 },
      },
    );
    return {
      executionTime: sums.executionTime / benchmarks.length,
      memoryUsage: sums.memoryUsage / benchmarks.length,
      cpuUsage: sums.cpuUsage / benchmarks.length,
      throughput: sums.throughput / benchmarks.length,
      latency: {
        p50: sums.latency.p50 / benchmarks.length,
        p90: sums.latency.p90 / benchmarks.length,
        p95: sums.latency.p95 / benchmarks.length,
        p99: sums.latency.p99 / benchmarks.length,
      },
    };
  }
  async checkPerformanceAlerts(benchmark) {
    for (const alert of this.alerts.values()) {
      if (alert.status !== 'active') continue;
      const metricValue = this.getMetricValue(benchmark, String(alert.metric));
      let shouldTrigger = false;
      switch (alert.threshold.operator) {
        case 'greater_than':
          shouldTrigger = metricValue > alert.threshold.value;
          break;
        case 'less_than':
          shouldTrigger = metricValue < alert.threshold.value;
          break;
        case 'percentage_change':
          // This would require baseline comparison - simplified for now
          shouldTrigger = false;
          break;
        default:
          this.logger.warn(`Unknown threshold operator: ${alert.threshold.operator}`);
          shouldTrigger = false;
          break;
      }
      if (shouldTrigger) {
        this.logger.warn(`Performance alert triggered: ${alert.id}`, {
          algorithm: benchmark.algorithmName,
          metric: alert.metric,
          value: metricValue,
          threshold: alert.threshold.value,
          severity: alert.severity,
        });
        alert.lastTriggered = new Date();
      }
    }
  }
  async performContinuousCheck() {
    this.logger.info('Performing continuous performance monitoring check');
    // Check for degradation in all monitored algorithms
    for (const algorithmName of this.benchmarks.keys()) {
      try {
        const degradation =
          await this.detectPerformanceDegradation(algorithmName);
        if (degradation && degradation.issues.length > 0) {
          this.logger.warn(
            `Continuous monitoring detected degradation in ${algorithmName}`,
            {
              issueCount: degradation.issues.length,
            },
          );
        }
      } catch (error) {
        this.logger.error(
          `Continuous monitoring check failed for ${algorithmName}`,
          {
            error: error.message,
          },
        );
      }
    }
  }
}
//# sourceMappingURL=performance-monitor.js.map
