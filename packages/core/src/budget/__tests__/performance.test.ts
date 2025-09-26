/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'node:fs/promises';
import * as _path from 'node:path';
import { BudgetTracker } from '../budget-tracker.js';
import { BudgetEnforcement } from '../budget-enforcement.js';
import { BudgetContentGenerator } from '../core/budgetContentGenerator.js';
import type { BudgetSettings, BudgetUsageData } from '../types.js';
import type { ContentGenerator } from '../core/contentGenerator.js';
import type { Config } from '../../config/config.js';

// Mock file system operations
vi.mock('node:fs/promises', () => ({
  readFile: vi.fn(),
  writeFile: vi.fn(),
  mkdir: vi.fn(),
  access: vi.fn(),
}));

const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
const performanceMarkSpy = vi
  .spyOn(performance, 'mark')
  .mockImplementation(() => {});
const performanceMeasureSpy = vi
  .spyOn(performance, 'measure')
  .mockImplementation(() => ({
    duration: 0,
    name: 'test',
    entryType: 'measure',
    startTime: 0,
    toJSON: () => ({}),
  }));

/**
 * Performance testing utilities for budget analytics system
 */
class PerformanceTestUtils {
  private static readonly PERFORMANCE_THRESHOLDS = {
    // Maximum acceptable times in milliseconds
    SINGLE_REQUEST_RECORD: 50, // 50ms per request recording
    BATCH_REQUEST_RECORD: 2000, // 2s for 100 requests
    USAGE_STATS_READ: 20, // 20ms per stats read
    BUDGET_CHECK: 10, // 10ms per budget check
    WARNING_CHECK: 15, // 15ms per warning check
    ENFORCEMENT_CHECK: 25, // 25ms per enforcement check
    CONCURRENT_OPERATIONS: 5000, // 5s for 50 concurrent operations
    LARGE_DATA_PROCESSING: 1000, // 1s for large usage data
  };

  static async measureOperation<T>(
    operationName: string,
    operation: () => Promise<T>,
    threshold?: number,
  ): Promise<{ result: T; duration: number }> {
    const startTime = performance.now();
    const result = await operation();
    const endTime = performance.now();
    const duration = endTime - startTime;

    if (threshold && duration > threshold) {
      console.warn(
        `Performance warning: ${operationName} took ${duration.toFixed(2)}ms, expected <${threshold}ms`,
      );
    }

    return { result, duration };
  }

  static async measureBatchOperations<T>(
    operationName: string,
    operations: Array<() => Promise<T>>,
    threshold?: number,
  ): Promise<{ results: T[]; totalDuration: number; averageDuration: number }> {
    const startTime = performance.now();
    const results = await Promise.all(operations.map((op) => op()));
    const endTime = performance.now();

    const totalDuration = endTime - startTime;
    const averageDuration = totalDuration / operations.length;

    if (threshold && totalDuration > threshold) {
      console.warn(
        `Performance warning: Batch ${operationName} took ${totalDuration.toFixed(2)}ms, expected <${threshold}ms`,
      );
    }

    return { results, totalDuration, averageDuration };
  }

  static createLargeUsageData(requestCount: number): BudgetUsageData {
    return {
      date: new Date().toISOString().split('T')[0],
      requestCount,
      lastResetTime: new Date().toISOString(),
      warningsShown: requestCount > 5000 ? [50, 75, 90] : [],
    };
  }

  static getThreshold(
    operation: keyof typeof PerformanceTestUtils.PERFORMANCE_THRESHOLDS,
  ): number {
    return PerformanceTestUtils.PERFORMANCE_THRESHOLDS[operation];
  }
}

describe('Budget Analytics Performance and Load Tests', () => {
  let projectRoot: string;
  let budgetSettings: BudgetSettings;
  let mockConfig: Config;
  let mockContentGenerator: ContentGenerator;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleSpy.mockClear();

    projectRoot = '/test/performance/project';
    budgetSettings = {
      enabled: true,
      dailyLimit: 10000, // High limit for performance testing
      resetTime: '00:00',
      warningThresholds: [50, 75, 90],
    };

    mockConfig = {
      getProjectRoot: vi.fn().mockReturnValue(projectRoot),
    } as Config;

    mockContentGenerator = {
      userTier: 'paid' as ContentGenerator['userTier'],
      generateContent: vi.fn().mockResolvedValue({
        candidates: [
          {
            content: { parts: [{ text: 'Response' }], role: 'model' },
            finishReason: 'STOP',
            index: 0,
          },
        ],
      }),
      generateContentStream: vi.fn(),
      countTokens: vi.fn(),
      embedContent: vi.fn(),
    };

    // Fast file system mocks for performance testing
    vi.mocked(fs.mkdir).mockResolvedValue(undefined);
    vi.mocked(fs.writeFile).mockImplementation(() => Promise.resolve());
    vi.mocked(fs.access).mockResolvedValue(undefined);
  });

  afterEach(() => {
    consoleSpy.mockClear();
    performanceMarkSpy.mockClear();
    performanceMeasureSpy.mockClear();
  });

  describe('Single Operation Performance', () => {
    it('should record individual requests within performance threshold', async () => {
      const tracker = new BudgetTracker(projectRoot, budgetSettings);

      // Mock minimal usage data
      const usageData = PerformanceTestUtils.createLargeUsageData(0);
      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(usageData));

      const { result: _result, duration } =
        await PerformanceTestUtils.measureOperation(
          'Single Request Record',
          () => tracker.recordRequest(),
          PerformanceTestUtils.getThreshold('SINGLE_REQUEST_RECORD'),
        );

      expect(duration).toBeLessThan(
        PerformanceTestUtils.getThreshold('SINGLE_REQUEST_RECORD'),
      );
      expect(fs.writeFile).toHaveBeenCalledOnce();
    });

    it('should read usage statistics within performance threshold', async () => {
      const tracker = new BudgetTracker(projectRoot, budgetSettings);

      // Mock moderate usage data
      const usageData = PerformanceTestUtils.createLargeUsageData(1000);
      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(usageData));

      const { result, duration } = await PerformanceTestUtils.measureOperation(
        'Usage Stats Read',
        () => tracker.getUsageStats(),
        PerformanceTestUtils.getThreshold('USAGE_STATS_READ'),
      );

      expect(duration).toBeLessThan(
        PerformanceTestUtils.getThreshold('USAGE_STATS_READ'),
      );
      expect(result.requestCount).toBe(1000);
      expect(result.usagePercentage).toBe(10); // 1000/10000
    });

    it('should check budget status within performance threshold', async () => {
      const tracker = new BudgetTracker(projectRoot, budgetSettings);

      const usageData = PerformanceTestUtils.createLargeUsageData(5000);
      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(usageData));

      const { result, duration } = await PerformanceTestUtils.measureOperation(
        'Budget Check',
        () => tracker.isOverBudget(),
        PerformanceTestUtils.getThreshold('BUDGET_CHECK'),
      );

      expect(duration).toBeLessThan(
        PerformanceTestUtils.getThreshold('BUDGET_CHECK'),
      );
      expect(result).toBe(false); // 5000 < 10000
    });

    it('should check warning thresholds within performance threshold', async () => {
      const tracker = new BudgetTracker(projectRoot, budgetSettings);

      const usageData = PerformanceTestUtils.createLargeUsageData(5000); // 50% of 10000
      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(usageData));

      const { result, duration } = await PerformanceTestUtils.measureOperation(
        'Warning Check',
        () => tracker.shouldShowWarning(),
        PerformanceTestUtils.getThreshold('WARNING_CHECK'),
      );

      expect(duration).toBeLessThan(
        PerformanceTestUtils.getThreshold('WARNING_CHECK'),
      );
      expect(result.show).toBe(true);
      expect(result.threshold).toBe(50);
    });

    it('should perform budget enforcement check within performance threshold', async () => {
      const enforcement = new BudgetEnforcement(projectRoot, budgetSettings);

      const usageData = PerformanceTestUtils.createLargeUsageData(8000);
      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(usageData));

      const { result, duration } = await PerformanceTestUtils.measureOperation(
        'Enforcement Check',
        () => enforcement.checkRequestAllowed(),
        PerformanceTestUtils.getThreshold('ENFORCEMENT_CHECK'),
      );

      expect(duration).toBeLessThan(
        PerformanceTestUtils.getThreshold('ENFORCEMENT_CHECK'),
      );
      expect(result.allowed).toBe(true);
    });
  });

  describe('Batch Operation Performance', () => {
    it('should handle batch request recording within performance threshold', async () => {
      const tracker = new BudgetTracker(projectRoot, budgetSettings);

      let currentCount = 0;
      vi.mocked(fs.readFile).mockImplementation(() => {
        const usageData =
          PerformanceTestUtils.createLargeUsageData(currentCount);
        currentCount++; // Simulate incrementing count
        return Promise.resolve(JSON.stringify(usageData));
      });

      // Create 100 request recording operations
      const batchOperations = Array.from(
        { length: 100 },
        () => () => tracker.recordRequest(),
      );

      const { results, totalDuration, averageDuration } =
        await PerformanceTestUtils.measureBatchOperations(
          'Batch Request Recording',
          batchOperations,
          PerformanceTestUtils.getThreshold('BATCH_REQUEST_RECORD'),
        );

      expect(totalDuration).toBeLessThan(
        PerformanceTestUtils.getThreshold('BATCH_REQUEST_RECORD'),
      );
      expect(averageDuration).toBeLessThan(
        PerformanceTestUtils.getThreshold('SINGLE_REQUEST_RECORD'),
      );
      expect(results).toHaveLength(100);
      expect(fs.writeFile).toHaveBeenCalledTimes(100);
    });

    it('should handle concurrent statistics reads efficiently', async () => {
      const tracker = new BudgetTracker(projectRoot, budgetSettings);

      const usageData = PerformanceTestUtils.createLargeUsageData(3000);
      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(usageData));

      // Create 50 concurrent stats read operations
      const batchOperations = Array.from(
        { length: 50 },
        () => () => tracker.getUsageStats(),
      );

      const { results, totalDuration } =
        await PerformanceTestUtils.measureBatchOperations(
          'Concurrent Stats Reads',
          batchOperations,
          1000, // 1 second for 50 concurrent reads
        );

      expect(totalDuration).toBeLessThan(1000);
      expect(results).toHaveLength(50);
      results.forEach((stats) => {
        expect(stats.requestCount).toBe(3000);
        expect(stats.usagePercentage).toBe(30);
      });
    });

    it('should handle mixed operation workload efficiently', async () => {
      const tracker = new BudgetTracker(projectRoot, budgetSettings);
      const enforcement = new BudgetEnforcement(projectRoot, budgetSettings);

      let requestCount = 0;
      vi.mocked(fs.readFile).mockImplementation(() => {
        const usageData =
          PerformanceTestUtils.createLargeUsageData(requestCount);
        return Promise.resolve(JSON.stringify(usageData));
      });

      // Mixed workload: record, check budget, get stats, check enforcement
      const mixedOperations = Array.from({ length: 50 }, (_, i) => {
        const opType = i % 4;
        switch (opType) {
          case 0:
            return () =>
              tracker.recordRequest().then(() => {
                requestCount++;
              });
          case 1:
            return () => tracker.isOverBudget();
          case 2:
            return () => tracker.getUsageStats();
          case 3:
            return () => enforcement.checkRequestAllowed();
          default:
            return () => Promise.resolve();
        }
      });

      const { results, totalDuration } =
        await PerformanceTestUtils.measureBatchOperations(
          'Mixed Operation Workload',
          mixedOperations,
          PerformanceTestUtils.getThreshold('CONCURRENT_OPERATIONS'),
        );

      expect(totalDuration).toBeLessThan(
        PerformanceTestUtils.getThreshold('CONCURRENT_OPERATIONS'),
      );
      expect(results).toHaveLength(50);
    });
  });

  describe('Large Data Processing Performance', () => {
    it('should handle large usage data files efficiently', async () => {
      const tracker = new BudgetTracker(projectRoot, budgetSettings);

      // Create large usage data (100,000 requests)
      const largeUsageData = PerformanceTestUtils.createLargeUsageData(100000);
      const largeJsonData = JSON.stringify(largeUsageData);

      // Verify data size is substantial
      expect(largeJsonData.length).toBeGreaterThan(1000);

      vi.mocked(fs.readFile).mockResolvedValue(largeJsonData);

      const { result, duration } = await PerformanceTestUtils.measureOperation(
        'Large Data Processing',
        () => tracker.getUsageStats(),
        PerformanceTestUtils.getThreshold('LARGE_DATA_PROCESSING'),
      );

      expect(duration).toBeLessThan(
        PerformanceTestUtils.getThreshold('LARGE_DATA_PROCESSING'),
      );
      expect(result.requestCount).toBe(100000);
      expect(result.usagePercentage).toBe(1000); // 100000/10000 = over budget
    });

    it('should handle extreme usage values without performance degradation', async () => {
      const tracker = new BudgetTracker(projectRoot, budgetSettings);

      // Use maximum safe integer
      const extremeUsageData = PerformanceTestUtils.createLargeUsageData(
        Number.MAX_SAFE_INTEGER,
      );
      vi.mocked(fs.readFile).mockResolvedValue(
        JSON.stringify(extremeUsageData),
      );

      const operations = [
        () => tracker.getUsageStats(),
        () => tracker.isOverBudget(),
        () => tracker.shouldShowWarning(),
      ];

      for (const operation of operations) {
        const { duration } = await PerformanceTestUtils.measureOperation(
          'Extreme Value Processing',
          operation,
          100, // 100ms threshold for extreme values
        );

        expect(duration).toBeLessThan(100);
      }
    });

    it('should maintain performance with complex warning threshold arrays', async () => {
      // Settings with many warning thresholds
      const complexSettings: BudgetSettings = {
        ...budgetSettings,
        warningThresholds: [
          5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90,
          95,
        ],
      };

      const tracker = new BudgetTracker(projectRoot, complexSettings);

      const usageData = PerformanceTestUtils.createLargeUsageData(5500); // 55% of 10000
      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(usageData));

      const { result, duration } = await PerformanceTestUtils.measureOperation(
        'Complex Threshold Processing',
        () => tracker.shouldShowWarning(),
        50, // 50ms threshold for complex processing
      );

      expect(duration).toBeLessThan(50);
      expect(result.show).toBe(true);
      expect(result.threshold).toBe(55); // Should find the 55% threshold
    });
  });

  describe('Memory and Resource Efficiency', () => {
    it('should handle rapid successive operations without memory leaks', async () => {
      const tracker = new BudgetTracker(projectRoot, budgetSettings);

      // Monitor memory usage (simplified approach)
      const initialMemory = process.memoryUsage();

      let operationCount = 0;
      vi.mocked(fs.readFile).mockImplementation(() => {
        const usageData =
          PerformanceTestUtils.createLargeUsageData(operationCount);
        operationCount++;
        return Promise.resolve(JSON.stringify(usageData));
      });

      // Perform 1000 rapid operations
      for (let i = 0; i < 1000; i++) {
        await tracker.recordRequest();

        // Periodically check stats to mix operations
        if (i % 100 === 0) {
          await tracker.getUsageStats();
          await tracker.isOverBudget();
        }
      }

      const finalMemory = process.memoryUsage();

      // Memory growth should be reasonable (less than 50MB)
      const memoryGrowth = finalMemory.heapUsed - initialMemory.heapUsed;
      expect(memoryGrowth).toBeLessThan(50 * 1024 * 1024); // 50MB
    });

    it('should handle content generator integration efficiently', async () => {
      const budgetContentGenerator = new BudgetContentGenerator(
        mockContentGenerator,
        mockConfig,
        budgetSettings,
      );

      let requestCount = 0;
      vi.mocked(fs.readFile).mockImplementation(() => {
        const usageData =
          PerformanceTestUtils.createLargeUsageData(requestCount);
        requestCount++;
        return Promise.resolve(JSON.stringify(usageData));
      });

      const mockRequest = {
        contents: [{ parts: [{ text: 'Test' }], role: 'user' as const }],
      };

      // Test integrated API call performance
      const apiCallOperations = Array.from(
        { length: 100 },
        (_, i) => () =>
          budgetContentGenerator.generateContent(mockRequest, `prompt-${i}`),
      );

      const { results, totalDuration, averageDuration } =
        await PerformanceTestUtils.measureBatchOperations(
          'Integrated API Calls',
          apiCallOperations,
          5000, // 5 seconds for 100 integrated calls
        );

      expect(totalDuration).toBeLessThan(5000);
      expect(averageDuration).toBeLessThan(50); // 50ms per integrated call
      expect(results).toHaveLength(100);
      expect(mockContentGenerator.generateContent).toHaveBeenCalledTimes(100);
    });
  });

  describe('Stress Testing and Edge Cases', () => {
    it('should handle file system latency gracefully', async () => {
      const tracker = new BudgetTracker(projectRoot, budgetSettings);

      // Simulate slow file system operations
      vi.mocked(fs.readFile).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve(
                  JSON.stringify(PerformanceTestUtils.createLargeUsageData(10)),
                ),
              50,
            ),
          ),
      );

      vi.mocked(fs.writeFile).mockImplementation(
        () => new Promise<void>((resolve) => setTimeout(() => resolve(), 30)),
      );

      const operations = [
        () => tracker.recordRequest(),
        () => tracker.getUsageStats(),
        () => tracker.isOverBudget(),
      ];

      for (const operation of operations) {
        const { duration } = await PerformanceTestUtils.measureOperation(
          'Slow FileSystem Operation',
          operation,
          200, // 200ms threshold accounting for artificial delay
        );

        expect(duration).toBeLessThan(200);
      }
    });

    it('should maintain performance under high concurrency', async () => {
      const tracker = new BudgetTracker(projectRoot, budgetSettings);

      let sharedRequestCount = 0;
      vi.mocked(fs.readFile).mockImplementation(() => {
        const usageData =
          PerformanceTestUtils.createLargeUsageData(sharedRequestCount);
        return Promise.resolve(JSON.stringify(usageData));
      });

      // Simulate high concurrency scenario
      const concurrentOperations = Array.from({ length: 200 }, (_, i) => {
        // Mix different operation types
        const opType = i % 3;
        switch (opType) {
          case 0:
            return () =>
              tracker.recordRequest().then(() => {
                sharedRequestCount++;
              });
          case 1:
            return () => tracker.getUsageStats();
          case 2:
            return () => tracker.isOverBudget();
          default:
            return () => Promise.resolve();
        }
      });

      const startTime = performance.now();
      const results = await Promise.all(concurrentOperations.map((op) => op()));
      const endTime = performance.now();

      const totalDuration = endTime - startTime;

      expect(totalDuration).toBeLessThan(10000); // 10 seconds for 200 concurrent operations
      expect(results).toHaveLength(200);
    });

    it('should handle repeated reset operations efficiently', async () => {
      const tracker = new BudgetTracker(projectRoot, budgetSettings);

      // Test repeated reset performance
      const resetOperations = Array.from(
        { length: 50 },
        () => () => tracker.resetDailyUsage(),
      );

      const { results, totalDuration } =
        await PerformanceTestUtils.measureBatchOperations(
          'Repeated Reset Operations',
          resetOperations,
          2000, // 2 seconds for 50 resets
        );

      expect(totalDuration).toBeLessThan(2000);
      expect(results).toHaveLength(50);
      expect(fs.writeFile).toHaveBeenCalledTimes(50);
    });

    it('should handle settings update operations efficiently', async () => {
      const tracker = new BudgetTracker(projectRoot, budgetSettings);
      const enforcement = new BudgetEnforcement(projectRoot, budgetSettings);

      // Test rapid settings updates
      const updateOperations = Array.from({ length: 100 }, (_, i) => () => {
        const newLimit = 1000 + i * 10;
        tracker.updateSettings({ dailyLimit: newLimit });
        enforcement.updateSettings({ dailyLimit: newLimit });
        return Promise.resolve();
      });

      const { totalDuration } =
        await PerformanceTestUtils.measureBatchOperations(
          'Rapid Settings Updates',
          updateOperations,
          1000, // 1 second for 100 updates
        );

      expect(totalDuration).toBeLessThan(1000);

      // Verify final state
      expect(tracker.getBudgetSettings().dailyLimit).toBe(1990); // 1000 + (99 * 10)
      expect(enforcement.getBudgetSettings().dailyLimit).toBe(1990);
    });
  });

  describe('Performance Regression Detection', () => {
    it('should establish performance baseline for future comparison', async () => {
      const tracker = new BudgetTracker(projectRoot, budgetSettings);

      const usageData = PerformanceTestUtils.createLargeUsageData(1000);
      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(usageData));

      // Baseline measurements for key operations
      const baselineOperations = {
        recordRequest: () => tracker.recordRequest(),
        getUsageStats: () => tracker.getUsageStats(),
        isOverBudget: () => tracker.isOverBudget(),
        shouldShowWarning: () => tracker.shouldShowWarning(),
      };

      const baseline: Record<string, number> = {};

      for (const [operationName, operation] of Object.entries(
        baselineOperations,
      )) {
        const { duration } = await PerformanceTestUtils.measureOperation(
          operationName,
          operation,
        );
        baseline[operationName] = duration;
      }

      // Log baseline for reference
      console.log('Performance Baseline:', baseline);

      // Verify operations complete within reasonable bounds
      expect(baseline.recordRequest).toBeLessThan(100);
      expect(baseline.getUsageStats).toBeLessThan(50);
      expect(baseline.isOverBudget).toBeLessThan(25);
      expect(baseline.shouldShowWarning).toBeLessThan(30);

      // Store baseline for future regression testing
      expect(baseline).toBeDefined();
    });

    it('should measure end-to-end workflow performance', async () => {
      const tracker = new BudgetTracker(projectRoot, budgetSettings);
      const enforcement = new BudgetEnforcement(projectRoot, budgetSettings);
      const contentGenerator = new BudgetContentGenerator(
        mockContentGenerator,
        mockConfig,
        budgetSettings,
      );

      vi.mocked(fs.readFile).mockRejectedValueOnce(new Error('File not found'));

      const workflowStart = performance.now();

      // Complete workflow: setup -> use -> warn -> extend -> continue

      // 1. Initial setup and first requests
      await tracker.recordRequest();
      await tracker.recordRequest();

      // 2. Check status
      const initialStats = await tracker.getUsageStats();
      expect(initialStats.requestCount).toBe(2);

      // 3. Make API calls through content generator
      const mockRequest = {
        contents: [{ parts: [{ text: 'Test' }], role: 'user' as const }],
      };

      for (let i = 0; i < 10; i++) {
        await contentGenerator.generateContent(mockRequest, `workflow-${i}`);
      }

      // 4. Update settings
      tracker.updateSettings({ dailyLimit: 20000 });
      enforcement.updateSettings({ dailyLimit: 20000 });

      // 5. Final verification
      const finalStats = await tracker.getUsageStats();
      expect(finalStats.dailyLimit).toBe(20000);

      const workflowEnd = performance.now();
      const workflowDuration = workflowEnd - workflowStart;

      // End-to-end workflow should complete within 2 seconds
      expect(workflowDuration).toBeLessThan(2000);

      console.log(
        `End-to-end workflow completed in ${workflowDuration.toFixed(2)}ms`,
      );
    });
  });
});
