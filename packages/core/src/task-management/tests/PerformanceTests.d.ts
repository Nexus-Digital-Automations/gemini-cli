/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { SelfManagingTaskQueue } from '../SelfManagingTaskQueue.js';
/**
 * Performance test configuration
 */
interface PerformanceTestConfig {
  taskCount: number;
  concurrency: number;
  executionTimeMs: number;
  timeoutMs: number;
  expectedThroughputMinimum: number;
  expectedLatencyMaximum: number;
}
/**
 * Performance test result
 */
interface PerformanceTestResult {
  totalTasks: number;
  successfulTasks: number;
  failedTasks: number;
  totalDurationMs: number;
  throughput: number;
  averageLatency: number;
  memoryUsed: number;
  peakConcurrency: number;
}
/**
 * Performance test suite runner
 */
declare class PerformanceTestRunner {
  private performanceTracker;
  constructor();
  runPerformanceTest(
    queue: SelfManagingTaskQueue,
    config: PerformanceTestConfig,
  ): Promise<PerformanceTestResult>;
  validatePerformanceResult(
    result: PerformanceTestResult,
    config: PerformanceTestConfig,
  ): {
    passed: boolean;
    issues: string[];
  };
  clear(): void;
}
export { PerformanceTestRunner, PerformanceTestConfig, PerformanceTestResult };
