/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TestRig } from './test-helper.js';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { spawn, ChildProcess as _ChildProcess } from 'node:child_process';
import {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  writeFileSync as _writeFileSync,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  readFileSync as _readFileSync,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  existsSync as _existsSync,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  unlinkSync as _unlinkSync,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  statSync as _statSync,
} from 'node:fs';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { join as _join } from 'node:path';
import { performance } from 'node:perf_hooks';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { promisify as _promisify } from 'node:util';

/**
 * Performance Benchmarking and Optimization Testing Suite
 *
 * Comprehensive performance testing for the autonomous task management system,
 * including throughput benchmarks, latency measurements, memory usage analysis,
 * scalability testing, and performance regression detection.
 */
describe('Performance Benchmarks & Optimization', () => {
  let rig: TestRig;
  const taskManagerPath =
    '/Users/jeremyparker/infinite-continue-stop-hook/taskmanager-api.js';

  // Performance thresholds (in milliseconds)
  const PERFORMANCE_THRESHOLDS = {
    initialize: { p95: 1000, p99: 2000, avg: 500 },
    reinitialize: { p95: 800, p99: 1500, avg: 400 },
    'suggest-feature': { p95: 1200, p99: 2500, avg: 600 },
    'approve-feature': { p95: 800, p99: 1500, avg: 400 },
    'list-features': { p95: 600, p99: 1200, avg: 300 },
    'feature-stats': { p95: 500, p99: 1000, avg: 250 },
    'get-initialization-stats': { p95: 700, p99: 1400, avg: 350 },
    'get-task-queue': { p95: 800, p99: 1600, avg: 400 },
    'create-task-from-feature': { p95: 1000, p99: 2000, avg: 500 },
    'update-task-progress': { p95: 600, p99: 1200, avg: 300 },
  };

  // Memory thresholds (in MB)
  const MEMORY_THRESHOLDS = {
    baseline: 50,
    withData: 100,
    underLoad: 200,
    maximum: 500,
  };

  beforeEach(async () => {
    rig = new TestRig();
    rig.setup('performance-benchmarks');
  });

  afterEach(async () => {
    await rig.cleanup();
  });

  /**
   * Latency and Response Time Benchmarks
   */
  describe('Latency & Response Time Benchmarks', () => {
    it('should meet single-operation latency requirements', async () => {
      const operations = Object.keys(PERFORMANCE_THRESHOLDS);
      const benchmarkResults: Record<
        string,
        {
          measurements: number[];
          avg: number;
          median: number;
          p95: number;
          p99: number;
          min: number;
          max: number;
          stdDev: number;
        }
      > = {};

      console.log('Running single-operation latency benchmarks...');

      for (const operation of operations) {
        const measurements: number[] = [];
        const iterations = operation.includes('initialize') ? 20 : 50; // Fewer iterations for init operations

        console.log(`Benchmarking ${operation} (${iterations} iterations)...`);

        // Warm-up phase
        for (let i = 0; i < 3; i++) {
          await performOperation(operation, i);
        }

        // Measurement phase
        for (let i = 0; i < iterations; i++) {
          const startTime = performance.now();
          await performOperation(operation, i);
          const duration = performance.now() - startTime;
          measurements.push(duration);

          // Small delay between operations to avoid overwhelming the system
          if (i % 10 === 0 && i > 0) {
            await new Promise((resolve) => setTimeout(resolve, 50));
          }
        }

        // Calculate statistics
        const sorted = measurements.sort((a, b) => a - b);
        const avg =
          measurements.reduce((a, b) => a + b, 0) / measurements.length;
        const median = sorted[Math.floor(sorted.length / 2)];
        const p95 = sorted[Math.floor(sorted.length * 0.95)];
        const p99 = sorted[Math.floor(sorted.length * 0.99)];
        const min = Math.min(...measurements);
        const max = Math.max(...measurements);

        // Standard deviation calculation
        const variance =
          measurements.reduce((acc, val) => acc + Math.pow(val - avg, 2), 0) /
          measurements.length;
        const stdDev = Math.sqrt(variance);

        benchmarkResults[operation] = {
          measurements,
          avg,
          median,
          p95,
          p99,
          min,
          max,
          stdDev,
        };

        console.log(
          `${operation}: avg=${avg.toFixed(2)}ms, p95=${p95.toFixed(2)}ms, p99=${p99.toFixed(2)}ms`,
        );

        // Assert against thresholds
        const threshold =
          PERFORMANCE_THRESHOLDS[
            operation as keyof typeof PERFORMANCE_THRESHOLDS
          ];
        expect(avg).toBeLessThan(threshold.avg);
        expect(p95).toBeLessThan(threshold.p95);
        expect(p99).toBeLessThan(threshold.p99);
      }

      // Generate performance report
      generatePerformanceReport(benchmarkResults);
    }, 120000);

    it('should maintain low latency under concurrent load', async () => {
      const concurrentOperations = 20;
      const operationsPerUser = 10;
      const targetOperations = [
        'feature-stats',
        'list-features',
        'get-initialization-stats',
      ];

      console.log(
        `Testing concurrent latency: ${concurrentOperations} concurrent users, ${operationsPerUser} ops each`,
      );

      const concurrentPromises = [];
      const allMeasurements: number[] = [];

      for (let user = 0; user < concurrentOperations; user++) {
        const userPromise = (async () => {
          const userMeasurements: number[] = [];

          for (let op = 0; op < operationsPerUser; op++) {
            const operation = targetOperations[op % targetOperations.length];
            const startTime = performance.now();

            try {
              await execTaskManagerCommand(operation, []);
              const duration = performance.now() - startTime;
              userMeasurements.push(duration);
            } catch (error) {
              console.error(`Concurrent operation failed: ${operation}`, error);
            }

            // Small random delay to simulate realistic user behavior
            await new Promise((resolve) =>
              setTimeout(resolve, 20 + Math.random() * 30),
            );
          }

          return userMeasurements;
        })();

        concurrentPromises.push(userPromise);
      }

      const results = await Promise.allSettled(concurrentPromises);
      const successfulResults = results
        .filter((r) => r.status === 'fulfilled')
        .map((r) => (r as PromiseFulfilledResult<number[]>).value);

      // Flatten all measurements
      successfulResults.forEach((measurements) => {
        allMeasurements.push(...measurements);
      });

      expect(allMeasurements.length).toBeGreaterThan(0);

      // Analyze concurrent performance
      const sorted = allMeasurements.sort((a, b) => a - b);
      const concurrentAvg =
        allMeasurements.reduce((a, b) => a + b, 0) / allMeasurements.length;
      const concurrentP95 = sorted[Math.floor(sorted.length * 0.95)];
      const concurrentP99 = sorted[Math.floor(sorted.length * 0.99)];

      console.log(
        `Concurrent performance: avg=${concurrentAvg.toFixed(2)}ms, p95=${concurrentP95.toFixed(2)}ms, p99=${concurrentP99.toFixed(2)}ms`,
      );

      // Performance should degrade gracefully under load (allow 2x latency increase)
      expect(concurrentAvg).toBeLessThan(1000); // 1 second average max
      expect(concurrentP95).toBeLessThan(2000); // 2 seconds p95 max
      expect(concurrentP99).toBeLessThan(4000); // 4 seconds p99 max
    }, 60000);

    async function performOperation(
      operation: string,
      iteration: number,
    ): Promise<unknown> {
      switch (operation) {
        case 'initialize':
          return execTaskManagerCommand('initialize', [
            `PERF_AGENT_${iteration}_${Date.now()}`,
          ]);

        case 'reinitialize': {
          // First initialize, then reinitialize
          const agentId = `PERF_REINIT_AGENT_${iteration}`;
          await execTaskManagerCommand('initialize', [agentId]);
          return execTaskManagerCommand('reinitialize', [agentId]);
        }

        case 'suggest-feature': {
          const featureData = {
            title: `Performance Test Feature ${iteration}`,
            description: `Performance testing feature number ${iteration} for latency measurement and system optimization validation`,
            business_value: `Enables performance validation and optimization testing capability feature ${iteration}`,
            category: 'performance',
          };
          return execTaskManagerCommand('suggest-feature', [
            JSON.stringify(featureData),
          ]);
        }

        case 'approve-feature': {
          // Create feature first, then approve
          const feature = await execTaskManagerCommand('suggest-feature', [
            JSON.stringify({
              title: `Approval Test Feature ${iteration}`,
              description: `Feature for testing approval performance iteration ${iteration}`,
              business_value: `Performance testing capability ${iteration}`,
              category: 'enhancement',
            }),
          ]);
          if (feature.success && feature.feature) {
            return execTaskManagerCommand('approve-feature', [
              feature.feature.id,
            ]);
          }
          throw new Error('Failed to create feature for approval test');
        }

        case 'create-task-from-feature': {
          // Create and approve feature first, then create task
          const taskFeature = await execTaskManagerCommand('suggest-feature', [
            JSON.stringify({
              title: `Task Creation Feature ${iteration}`,
              description: `Feature for testing task creation performance iteration ${iteration}`,
              business_value: `Task creation performance testing ${iteration}`,
              category: 'enhancement',
            }),
          ]);
          if (taskFeature.success) {
            await execTaskManagerCommand('approve-feature', [
              taskFeature.feature.id,
            ]);
            return execTaskManagerCommand('create-task-from-feature', [
              taskFeature.feature.id,
            ]);
          }
          throw new Error('Failed to create feature for task creation test');
        }

        default:
          return execTaskManagerCommand(operation, []);
      }
    }
  });

  /**
   * Throughput and Scalability Benchmarks
   */
  describe('Throughput & Scalability Benchmarks', () => {
    it('should achieve target throughput rates', async () => {
      const throughputTests = [
        { operation: 'feature-stats', targetRPS: 50, duration: 10000 },
        { operation: 'list-features', targetRPS: 40, duration: 10000 },
        {
          operation: 'get-initialization-stats',
          targetRPS: 30,
          duration: 10000,
        },
      ];

      for (const test of throughputTests) {
        console.log(
          `Throughput test: ${test.operation} @ ${test.targetRPS} RPS for ${test.duration}ms`,
        );

        const startTime = Date.now();
        const results: Array<{
          success: boolean;
          latency: number;
          timestamp: number;
        }> = [];
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const _requestCount = 0; // Unused variable for consistency

        while (Date.now() - startTime < test.duration) {
          const intervalStart = Date.now();
          const batchPromises = [];

          // Generate requests for this second
          for (let i = 0; i < test.targetRPS; i++) {
            const requestStart = performance.now();
            const promise = execTaskManagerCommand(test.operation, [])
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              .then((_result) => ({
                success: true,
                latency: performance.now() - requestStart,
                timestamp: Date.now(),
              }))
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              .catch((_error) => ({
                success: false,
                latency: performance.now() - requestStart,
                timestamp: Date.now(),
              }));

            batchPromises.push(promise);
            // requestCount++;
          }

          // Wait for all requests in this batch
          const batchResults = await Promise.all(batchPromises);
          results.push(...batchResults);

          // Wait for remainder of 1-second interval
          const intervalDuration = Date.now() - intervalStart;
          const remainingTime = 1000 - intervalDuration;
          if (remainingTime > 0) {
            await new Promise((resolve) => setTimeout(resolve, remainingTime));
          }
        }

        // Analyze throughput results
        const actualDuration = (Date.now() - startTime) / 1000;
        const actualRPS = results.length / actualDuration;
        const successRate =
          results.filter((r) => r.success).length / results.length;
        const avgLatency =
          results.reduce((sum, r) => sum + r.latency, 0) / results.length;

        console.log(`${test.operation} throughput results:`);
        console.log(
          `  Target RPS: ${test.targetRPS}, Actual RPS: ${actualRPS.toFixed(2)}`,
        );
        console.log(`  Success rate: ${(successRate * 100).toFixed(2)}%`);
        console.log(`  Average latency: ${avgLatency.toFixed(2)}ms`);

        // Assertions
        expect(actualRPS).toBeGreaterThan(test.targetRPS * 0.8); // Allow 20% deviation
        expect(successRate).toBeGreaterThan(0.95); // 95% success rate minimum
        expect(avgLatency).toBeLessThan(2000); // 2 second average latency maximum
      }
    }, 45000);

    it('should scale performance with data volume', async () => {
      const dataSizes = [50, 100, 250, 500, 1000];
      const scaleResults: Array<{
        dataSize: number;
        listLatency: number;
        statsLatency: number;
        searchLatency: number;
        memoryUsage: number;
      }> = [];

      console.log('Testing scalability with increasing data volumes...');

      for (const size of dataSizes) {
        console.log(`Creating ${size} features for scalability test...`);

        // Create features in batches to avoid overwhelming the system
        const batchSize = 20;
        for (let batch = 0; batch < Math.ceil(size / batchSize); batch++) {
          const batchPromises = [];
          const batchStart = batch * batchSize;
          const batchEnd = Math.min(batchStart + batchSize, size);

          for (let i = batchStart; i < batchEnd; i++) {
            const featureData = {
              title: `Scalability Test Feature ${i + 1}`,
              description: `Feature number ${i + 1} created for scalability testing with data volume ${size}. This feature tests system performance under increasing data loads.`,
              business_value: `Enables scalability validation under data volume ${size} with feature ${i + 1}`,
              category:
                i % 4 === 0
                  ? 'new-feature'
                  : i % 4 === 1
                    ? 'enhancement'
                    : i % 4 === 2
                      ? 'bug-fix'
                      : 'performance',
            };
            batchPromises.push(
              execTaskManagerCommand('suggest-feature', [
                JSON.stringify(featureData),
              ]),
            );
          }

          await Promise.allSettled(batchPromises);

          // Small delay between batches
          await new Promise((resolve) => setTimeout(resolve, 100));
        }

        // Measure memory usage before performance tests
        const memoryBefore = process.memoryUsage();

        // Test list-features performance
        const listStart = performance.now();
        await execTaskManagerCommand('list-features', []);
        const listLatency = performance.now() - listStart;

        // Test feature-stats performance
        const statsStart = performance.now();
        await execTaskManagerCommand('feature-stats', []);
        const statsLatency = performance.now() - statsStart;

        // Test filtered search performance
        const searchStart = performance.now();
        await execTaskManagerCommand('list-features', [
          JSON.stringify({ category: 'enhancement' }),
        ]);
        const searchLatency = performance.now() - searchStart;

        // Measure memory usage after operations
        const memoryAfter = process.memoryUsage();
        const memoryUsage =
          (memoryAfter.heapUsed - memoryBefore.heapUsed) / 1024 / 1024; // MB

        scaleResults.push({
          dataSize: size,
          listLatency,
          statsLatency,
          searchLatency,
          memoryUsage,
        });

        console.log(
          `Size ${size}: list=${listLatency.toFixed(2)}ms, stats=${statsLatency.toFixed(2)}ms, search=${searchLatency.toFixed(2)}ms, memory=${memoryUsage.toFixed(2)}MB`,
        );
      }

      // Analyze scaling characteristics
      const firstResult = scaleResults[0];
      const lastResult = scaleResults[scaleResults.length - 1];
      const sizeMultiplier = lastResult.dataSize / firstResult.dataSize;

      const listScaleFactor = lastResult.listLatency / firstResult.listLatency;
      const statsScaleFactor =
        lastResult.statsLatency / firstResult.statsLatency;
      const searchScaleFactor =
        lastResult.searchLatency / firstResult.searchLatency;

      console.log('Scalability analysis:');
      console.log(`  Data size increased ${sizeMultiplier}x`);
      console.log(`  List latency scaled ${listScaleFactor.toFixed(2)}x`);
      console.log(`  Stats latency scaled ${statsScaleFactor.toFixed(2)}x`);
      console.log(`  Search latency scaled ${searchScaleFactor.toFixed(2)}x`);

      // Performance should scale sub-linearly (better than O(n))
      expect(listScaleFactor).toBeLessThan(sizeMultiplier * 0.8);
      expect(statsScaleFactor).toBeLessThan(sizeMultiplier * 0.6);
      expect(searchScaleFactor).toBeLessThan(sizeMultiplier * 0.7);

      // Memory usage should be reasonable
      expect(lastResult.memoryUsage).toBeLessThan(MEMORY_THRESHOLDS.withData);
    }, 180000);
  });

  /**
   * Memory Usage and Resource Management
   */
  describe('Memory Usage & Resource Management', () => {
    it('should maintain reasonable memory usage patterns', async () => {
      const memorySnapshots: Array<{
        timestamp: number;
        operation: string;
        heapUsed: number;
        heapTotal: number;
        external: number;
        rss: number;
      }> = [];

      // Take baseline memory snapshot
      const baseline = process.memoryUsage();
      memorySnapshots.push({
        timestamp: Date.now(),
        operation: 'baseline',
        heapUsed: baseline.heapUsed / 1024 / 1024,
        heapTotal: baseline.heapTotal / 1024 / 1024,
        external: baseline.external / 1024 / 1024,
        rss: baseline.rss / 1024 / 1024,
      });

      console.log('Monitoring memory usage during operations...');

      // Perform various operations while monitoring memory
      const operations = [
        { name: 'initialize-agents', count: 10, operation: 'initialize' },
        { name: 'create-features', count: 50, operation: 'suggest-feature' },
        { name: 'approve-features', count: 25, operation: 'approve-feature' },
        { name: 'list-operations', count: 20, operation: 'list-features' },
        { name: 'stats-operations', count: 30, operation: 'feature-stats' },
      ];

      for (const opGroup of operations) {
        const opStartMemory = process.memoryUsage();

        for (let i = 0; i < opGroup.count; i++) {
          await performMemoryTestOperation(opGroup.operation, i);

          if (i % 10 === 0) {
            const currentMemory = process.memoryUsage();
            memorySnapshots.push({
              timestamp: Date.now(),
              operation: `${opGroup.name}-${i}`,
              heapUsed: currentMemory.heapUsed / 1024 / 1024,
              heapTotal: currentMemory.heapTotal / 1024 / 1024,
              external: currentMemory.external / 1024 / 1024,
              rss: currentMemory.rss / 1024 / 1024,
            });
          }
        }

        const opEndMemory = process.memoryUsage();
        const memoryIncrease =
          (opEndMemory.heapUsed - opStartMemory.heapUsed) / 1024 / 1024;
        console.log(
          `${opGroup.name}: Memory increase = ${memoryIncrease.toFixed(2)}MB`,
        );
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      const finalMemory = process.memoryUsage();
      memorySnapshots.push({
        timestamp: Date.now(),
        operation: 'final',
        heapUsed: finalMemory.heapUsed / 1024 / 1024,
        heapTotal: finalMemory.heapTotal / 1024 / 1024,
        external: finalMemory.external / 1024 / 1024,
        rss: finalMemory.rss / 1024 / 1024,
      });

      // Analyze memory patterns
      const maxHeap = Math.max(...memorySnapshots.map((s) => s.heapUsed));
      const maxRSS = Math.max(...memorySnapshots.map((s) => s.rss));
      const memoryGrowth = finalMemory.heapUsed - baseline.heapUsed;

      console.log('Memory usage analysis:');
      console.log(`  Peak heap: ${maxHeap.toFixed(2)}MB`);
      console.log(`  Peak RSS: ${maxRSS.toFixed(2)}MB`);
      console.log(`  Net growth: ${(memoryGrowth / 1024 / 1024).toFixed(2)}MB`);

      // Assert memory constraints
      expect(maxHeap).toBeLessThan(MEMORY_THRESHOLDS.underLoad);
      expect(maxRSS).toBeLessThan(MEMORY_THRESHOLDS.underLoad * 2);

      // Memory growth should be reasonable (allow some leakage for testing)
      expect(memoryGrowth / 1024 / 1024).toBeLessThan(
        MEMORY_THRESHOLDS.withData,
      );
    }, 120000);

    it('should handle memory pressure gracefully', async () => {
      console.log('Testing memory pressure handling...');

      // Create large dataset to induce memory pressure
      const largeDatasetSize = 1000;
      let memoryPressureHandled = true;

      try {
        // Create many features rapidly to increase memory usage
        const batchSize = 50;
        for (
          let batch = 0;
          batch < Math.ceil(largeDatasetSize / batchSize);
          batch++
        ) {
          const promises = [];
          const batchStart = batch * batchSize;
          const batchEnd = Math.min(batchStart + batchSize, largeDatasetSize);

          for (let i = batchStart; i < batchEnd; i++) {
            const featureData = {
              title: `Memory Pressure Test Feature ${i + 1}`,
              description: `Large feature description for memory pressure testing. This is feature number ${i + 1} designed to consume memory and test system resilience under pressure. Additional text to increase memory usage: ${'x'.repeat(500)}`,
              business_value: `Memory pressure testing capability with large data payload for feature ${i + 1}. Extended business value description: ${'y'.repeat(300)}`,
              category: 'performance',
            };

            promises.push(
              execTaskManagerCommand('suggest-feature', [
                JSON.stringify(featureData),
              ]).catch((error) => {
                console.warn(
                  `Feature creation failed under memory pressure: ${error.message}`,
                );
                return { success: false, error: error.message };
              }),
            );
          }

          const batchResults = await Promise.allSettled(promises);
          const successCount = batchResults.filter(
            (r) => r.status === 'fulfilled' && (r.value as { success: boolean }).success,
          ).length;

          console.log(
            `Batch ${batch + 1}: ${successCount}/${batchEnd - batchStart} features created`,
          );

          // Check memory usage
          const currentMemory = process.memoryUsage();
          const heapUsedMB = currentMemory.heapUsed / 1024 / 1024;

          if (heapUsedMB > MEMORY_THRESHOLDS.maximum) {
            console.log(
              `Memory threshold exceeded: ${heapUsedMB.toFixed(2)}MB`,
            );
            break;
          }

          // Small delay to allow system to stabilize
          await new Promise((resolve) => setTimeout(resolve, 100));
        }

        // System should remain functional even under memory pressure
        const statsResult = await execTaskManagerCommand('feature-stats', []);
        expect(statsResult.success).toBe(true);

        const listResult = await execTaskManagerCommand('list-features', []);
        expect(listResult.success).toBe(true);
      } catch (error) {
        console.error('System failed under memory pressure:', error);
        memoryPressureHandled = false;
      }

      expect(memoryPressureHandled).toBe(true);
    }, 300000);

    async function performMemoryTestOperation(
      operation: string,
      iteration: number,
    ): Promise<unknown> {
      switch (operation) {
        case 'initialize':
          return execTaskManagerCommand('initialize', [
            `MEMORY_AGENT_${iteration}`,
          ]);

        case 'suggest-feature': {
          const featureData = {
            title: `Memory Test Feature ${iteration}`,
            description: `Memory usage testing feature number ${iteration} for resource management validation`,
            business_value: `Memory testing capability ${iteration}`,
            category: 'performance',
          };
          return execTaskManagerCommand('suggest-feature', [
            JSON.stringify(featureData),
          ]);
        }

        case 'approve-feature': {
          // Get existing features to approve
          const featuresResult = await execTaskManagerCommand('list-features', [
            JSON.stringify({ status: 'suggested' }),
          ]);
          if (featuresResult.success && featuresResult.features.length > 0) {
            const randomFeature =
              featuresResult.features[
                Math.floor(Math.random() * featuresResult.features.length)
              ];
            return execTaskManagerCommand('approve-feature', [
              randomFeature.id,
            ]);
          }
          return { success: false, error: 'No features to approve' };
        }

        default:
          return execTaskManagerCommand(operation, []);
      }
    }
  });

  /**
   * Performance Regression Detection
   */
  describe('Performance Regression Detection', () => {
    it('should detect performance regressions in core operations', async () => {
      const regressionThresholds = {
        'feature-stats': { baseline: 300, maxRegression: 1.5 }, // 50% regression tolerance
        'list-features': { baseline: 250, maxRegression: 1.5 },
        'get-initialization-stats': { baseline: 400, maxRegression: 1.5 },
      };

      const regressionResults: Record<
        string,
        {
          baseline: number;
          current: number;
          regression: number;
          withinThreshold: boolean;
        }
      > = {};

      console.log('Running performance regression detection...');

      for (const [operation, config] of Object.entries(regressionThresholds)) {
        const measurements: number[] = [];
        const iterations = 20;

        // Measure current performance
        for (let i = 0; i < iterations; i++) {
          const startTime = performance.now();
          await execTaskManagerCommand(operation, []);
          const duration = performance.now() - startTime;
          measurements.push(duration);
        }

        const avgPerformance =
          measurements.reduce((a, b) => a + b, 0) / measurements.length;
        const regression = avgPerformance / config.baseline;
        const withinThreshold = regression <= config.maxRegression;

        regressionResults[operation] = {
          baseline: config.baseline,
          current: avgPerformance,
          regression,
          withinThreshold,
        };

        console.log(
          `${operation}: baseline=${config.baseline}ms, current=${avgPerformance.toFixed(2)}ms, regression=${regression.toFixed(2)}x`,
        );

        if (!withinThreshold) {
          console.warn(`⚠️  Performance regression detected for ${operation}!`);
        }

        // Assert no significant regression
        expect(regression).toBeLessThan(config.maxRegression);
      }

      // Generate regression report
      generateRegressionReport(regressionResults);
    });

    it('should maintain consistent performance across test runs', async () => {
      const testRuns = 3;
      const operationsToTest = ['feature-stats', 'list-features'];
      const consistencyResults: Record<string, number[]> = {};

      console.log(`Testing performance consistency across ${testRuns} runs...`);

      for (const operation of operationsToTest) {
        consistencyResults[operation] = [];

        for (let run = 0; run < testRuns; run++) {
          const measurements: number[] = [];
          const iterations = 10;

          console.log(`Run ${run + 1}/${testRuns} for ${operation}...`);

          for (let i = 0; i < iterations; i++) {
            const startTime = performance.now();
            await execTaskManagerCommand(operation, []);
            const duration = performance.now() - startTime;
            measurements.push(duration);
          }

          const avgForRun =
            measurements.reduce((a, b) => a + b, 0) / measurements.length;
          consistencyResults[operation].push(avgForRun);
        }

        // Calculate coefficient of variation (CV) to measure consistency
        const runAverages = consistencyResults[operation];
        const mean =
          runAverages.reduce((a, b) => a + b, 0) / runAverages.length;
        const variance =
          runAverages.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) /
          runAverages.length;
        const stdDev = Math.sqrt(variance);
        const cv = (stdDev / mean) * 100; // Coefficient of variation as percentage

        console.log(`${operation} consistency: CV=${cv.toFixed(2)}%`);

        // Performance should be consistent (CV < 30%)
        expect(cv).toBeLessThan(30);
      }
    });
  });

  /**
   * Utility Functions
   */
  async function execTaskManagerCommand(
    command: string,
    args: string[] = [],
  ): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const child = spawn(
        'timeout',
        ['10s', 'node', taskManagerPath, command, ...args],
        {
          cwd: rig.testDir!,
          stdio: 'pipe',
        },
      );

      let stdout = '';
      let stderr = '';

      child.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        if (code === 0) {
          try {
            const result = JSON.parse(stdout);
            resolve(result);
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          } catch (_error) {
            reject(
              new Error(`Failed to parse JSON: ${stdout.substring(0, 200)}...`),
            );
          }
        } else {
          reject(
            new Error(`Command failed with code ${code}: ${stderr || stdout}`),
          );
        }
      });

      setTimeout(() => {
        child.kill('SIGKILL');
        reject(new Error('Command timeout'));
      }, 15000);
    });
  }

  function generatePerformanceReport(
    benchmarkResults: Record<string, unknown>,
  ): void {
    console.log('\n📊 PERFORMANCE BENCHMARK REPORT');
    console.log('================================');

    Object.entries(benchmarkResults).forEach(([operation, stats]) => {
      const threshold =
        PERFORMANCE_THRESHOLDS[
          operation as keyof typeof PERFORMANCE_THRESHOLDS
        ];

      console.log(`\n${operation.toUpperCase()}:`);
      console.log(
        `  Average: ${stats.avg.toFixed(2)}ms (threshold: ${threshold.avg}ms)`,
      );
      console.log(
        `  P95: ${stats.p95.toFixed(2)}ms (threshold: ${threshold.p95}ms)`,
      );
      console.log(
        `  P99: ${stats.p99.toFixed(2)}ms (threshold: ${threshold.p99}ms)`,
      );
      console.log(
        `  Min/Max: ${stats.min.toFixed(2)}ms / ${stats.max.toFixed(2)}ms`,
      );
      console.log(`  Std Dev: ${stats.stdDev.toFixed(2)}ms`);

      const avgStatus = stats.avg <= threshold.avg ? '✅' : '❌';
      const p95Status = stats.p95 <= threshold.p95 ? '✅' : '❌';
      const p99Status = stats.p99 <= threshold.p99 ? '✅' : '❌';

      console.log(
        `  Status: ${avgStatus} Avg | ${p95Status} P95 | ${p99Status} P99`,
      );
    });

    console.log('\n================================');
  }

  function generateRegressionReport(
    regressionResults: Record<string, unknown>,
  ): void {
    console.log('\n🔍 PERFORMANCE REGRESSION REPORT');
    console.log('=================================');

    Object.entries(regressionResults).forEach(([operation, result]) => {
      const status = result.withinThreshold ? '✅' : '⚠️';
      console.log(`\n${operation.toUpperCase()}: ${status}`);
      console.log(`  Baseline: ${result.baseline}ms`);
      console.log(`  Current: ${result.current.toFixed(2)}ms`);
      console.log(`  Regression: ${result.regression.toFixed(2)}x`);
      console.log(`  Within Threshold: ${result.withinThreshold}`);
    });

    console.log('\n=================================');
  }
});
