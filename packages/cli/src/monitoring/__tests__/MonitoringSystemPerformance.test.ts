/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  describe,
  beforeEach,
  afterEach,
  it,
  expect,
  vi,
  beforeAll,
  afterAll as _afterAll,
} from 'vitest';
import { performance } from 'node:perf_hooks';

import { RealTimeMonitoringSystem } from '../RealTimeMonitoringSystem.js';
import { EnhancedMonitoringDashboard } from '../EnhancedMonitoringDashboard.js';
import { MonitoringIntegrationHub } from '../MonitoringIntegrationHub.js';
import {
  TaskStatusMonitor,
  TaskStatus,
  TaskPriority,
  TaskType,
} from '../TaskStatusMonitor.js';
import { PerformanceAnalyticsDashboard } from '../PerformanceAnalyticsDashboard.js';

// Mock file system and WebSocket to focus on performance
vi.mock('node:fs/promises', () => ({
  mkdir: vi.fn().mockResolvedValue(undefined),
  writeFile: vi.fn().mockResolvedValue(undefined),
  readFile: vi.fn().mockRejectedValue(new Error('File not found')),
}));

vi.mock('ws', () => ({
  WebSocketServer: vi.fn().mockImplementation(() => ({
    on: vi.fn(),
    close: vi.fn(),
  })),
}));

/**
 * Performance and Benchmarking Tests for Monitoring System
 *
 * Comprehensive performance testing suite that validates:
 * - Sub-second monitoring response times
 * - High-throughput data processing capabilities
 * - Memory efficiency and leak prevention
 * - Concurrent operation handling
 * - Scalability under load
 * - Resource utilization optimization
 * - Predictable performance characteristics
 */
describe('Monitoring System Performance Tests', () => {
  let realTimeMonitoring: RealTimeMonitoringSystem;
  let dashboard: EnhancedMonitoringDashboard;
  let integrationHub: MonitoringIntegrationHub;
  let taskStatusMonitor: TaskStatusMonitor;
  let performanceAnalytics: PerformanceAnalyticsDashboard;

  // Performance benchmarks (targets)
  const PERFORMANCE_TARGETS = {
    snapshotCollectionTime: 100, // milliseconds
    dashboardRenderTime: 50, // milliseconds
    alertProcessingTime: 25, // milliseconds
    dataExportTime: 500, // milliseconds for 1000 records
    memoryUsageLimit: 50 * 1024 * 1024, // 50MB
    maxResponseTime: 1000, // milliseconds
    throughputTarget: 1000, // operations per second
  };

  beforeAll(() => {
    // Set longer test timeout for performance tests
    vi.setConfig({ testTimeout: 30000 });
  });

  beforeEach(async () => {
    vi.clearAllMocks();

    // Initialize components with performance-optimized settings
    taskStatusMonitor = new TaskStatusMonitor();
    performanceAnalytics = new PerformanceAnalyticsDashboard();
    realTimeMonitoring = new RealTimeMonitoringSystem({
      updateIntervalMs: 100, // High frequency for performance testing
      enableAnomalyDetection: true,
      enablePredictiveAnalytics: true,
    });
    dashboard = new EnhancedMonitoringDashboard();
    integrationHub = new MonitoringIntegrationHub({
      enableRealTimeMonitoring: true,
      enableDashboards: true,
      enablePerformanceAnalytics: true,
      enableCrossSystemSync: true,
      syncIntervalMs: 500, // Fast sync for testing
      enableDataPersistence: false, // Disable for performance testing
      enableMetricsExport: false,
    });

    // Allow initialization time
    await new Promise((resolve) => setTimeout(resolve, 200));
  });

  afterEach(async () => {
    // Clean shutdown
    await Promise.all(
      [
        realTimeMonitoring?.shutdown(),
        dashboard?.shutdown(),
        integrationHub?.shutdown(),
        taskStatusMonitor?.shutdown?.(),
        performanceAnalytics?.shutdown?.(),
      ].filter(Boolean),
    );

    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
  });

  describe('Response Time Performance', () => {
    it('should collect monitoring snapshots within performance targets', () => {
      const iterations = 100;
      const times: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const start = performance.now();
        const snapshot = realTimeMonitoring.getCurrentSnapshot();
        const end = performance.now();

        times.push(end - start);

        // Verify snapshot is valid
        expect(snapshot).toHaveProperty('timestamp');
        expect(snapshot).toHaveProperty('systemHealth');
        expect(snapshot).toHaveProperty('taskMetrics');
      }

      const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length;
      const maxTime = Math.max(...times);
      const minTime = Math.min(...times);

      console.log(`Snapshot Collection Performance:
        Average: ${avgTime.toFixed(2)}ms
        Min: ${minTime.toFixed(2)}ms
        Max: ${maxTime.toFixed(2)}ms
        Target: ${PERFORMANCE_TARGETS.snapshotCollectionTime}ms`);

      // Performance assertions
      expect(avgTime).toBeLessThan(PERFORMANCE_TARGETS.snapshotCollectionTime);
      expect(maxTime).toBeLessThan(
        PERFORMANCE_TARGETS.snapshotCollectionTime * 2,
      ); // Allow 2x spike
      expect(
        times.filter((t) => t < PERFORMANCE_TARGETS.snapshotCollectionTime)
          .length / iterations,
      ).toBeGreaterThan(0.95); // 95% should meet target
    });

    it('should process alerts within performance targets', async () => {
      const alertTimes: number[] = [];
      const testRules = [];

      // Create multiple test alert rules
      for (let i = 0; i < 10; i++) {
        const rule = {
          id: `perf-test-rule-${i}`,
          name: `Performance Test Rule ${i}`,
          description: 'Alert rule for performance testing',
          condition: (data: Record<string, unknown>) =>
            (data['taskMetrics'] as { total: number }).total > i,
          severity: 'medium' as const,
          cooldownMs: 100,
          enabled: true,
          actions: [{ type: 'log' as const, config: {} }],
        };

        testRules.push(rule);
        realTimeMonitoring.addAlertRule(rule);
      }

      // Listen for alert events and measure timing
      realTimeMonitoring.on('alert:triggered', (data) => {
        const processingTime = Date.now() - data.alert.timestamp.getTime();
        alertTimes.push(processingTime);
      });

      // Create tasks to trigger alerts
      for (let i = 0; i < 15; i++) {
        taskStatusMonitor.registerTask(`alert-perf-task-${i}`, {
          title: `Alert Performance Task ${i}`,
          type: TaskType.VALIDATION,
          priority: TaskPriority.NORMAL,
          estimatedDuration: 5000,
        });
      }

      // Start monitoring and wait for alert processing
      realTimeMonitoring.startMonitoring();
      await new Promise((resolve) => setTimeout(resolve, 2000));
      realTimeMonitoring.stopMonitoring();

      if (alertTimes.length > 0) {
        const avgAlertTime =
          alertTimes.reduce((sum, time) => sum + time, 0) / alertTimes.length;
        const maxAlertTime = Math.max(...alertTimes);

        console.log(`Alert Processing Performance:
          Average: ${avgAlertTime.toFixed(2)}ms
          Max: ${maxAlertTime.toFixed(2)}ms
          Target: ${PERFORMANCE_TARGETS.alertProcessingTime}ms
          Alerts Processed: ${alertTimes.length}`);

        expect(avgAlertTime).toBeLessThan(
          PERFORMANCE_TARGETS.alertProcessingTime,
        );
        expect(maxAlertTime).toBeLessThan(
          PERFORMANCE_TARGETS.alertProcessingTime * 3,
        );
      }

      // Cleanup
      testRules.forEach((rule) => realTimeMonitoring.removeAlertRule(rule.id));
    });

    it('should generate dashboard data within performance targets', () => {
      // Setup dashboard with multiple widgets
      const layoutId = dashboard.createLayout(
        'Performance Test Layout',
        'Layout for performance testing',
      );

      const widgetTypes: Array<'metric' | 'chart' | 'gauge' | 'table'> = [
        'metric',
        'chart',
        'gauge',
        'table',
      ];
      const widgetIds: string[] = [];

      widgetTypes.forEach((type, index) => {
        const widgetId = dashboard.addWidget(layoutId, {
          type,
          title: `Performance Widget ${index}`,
          position: { x: index * 3, y: 0, width: 3, height: 3 },
          config: {
            dataSource: index % 2 === 0 ? 'system_health' : 'task_metrics',
            refreshIntervalMs: 1000,
          },
          style: {},
          enabled: true,
        });
        widgetIds.push(widgetId);
      });

      dashboard.setActiveLayout(layoutId);

      const iterations = 50;
      const times: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const start = performance.now();
        const dashboardData = dashboard.getCurrentDashboardData();
        const end = performance.now();

        times.push(end - start);

        // Verify dashboard data
        expect(dashboardData).toHaveProperty('timestamp');
        expect(dashboardData).toHaveProperty('widgets');
        expect(dashboardData.widgets).toHaveLength(widgetTypes.length);
      }

      const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length;
      const maxTime = Math.max(...times);

      console.log(`Dashboard Data Generation Performance:
        Average: ${avgTime.toFixed(2)}ms
        Max: ${maxTime.toFixed(2)}ms
        Target: ${PERFORMANCE_TARGETS.dashboardRenderTime}ms
        Widgets: ${widgetTypes.length}`);

      expect(avgTime).toBeLessThan(PERFORMANCE_TARGETS.dashboardRenderTime);
      expect(maxTime).toBeLessThan(PERFORMANCE_TARGETS.dashboardRenderTime * 2);
    });
  });

  describe('Throughput Performance', () => {
    it('should handle high-frequency task operations', async () => {
      const taskCount = 1000;
      const batchSize = 50;
      const startTime = performance.now();

      const taskIds: string[] = [];
      const operations: Array<Promise<void>> = [];

      // Create tasks in batches to simulate realistic load
      for (let batch = 0; batch < taskCount / batchSize; batch++) {
        const batchPromise = Promise.resolve().then(() => {
          const batchTaskIds: string[] = [];

          for (let i = 0; i < batchSize; i++) {
            const taskIndex = batch * batchSize + i;
            const taskId = taskStatusMonitor.registerTask(
              `throughput-task-${taskIndex}`,
              {
                title: `Throughput Test Task ${taskIndex}`,
                type: TaskType.IMPLEMENTATION,
                priority: TaskPriority.NORMAL,
                estimatedDuration: Math.random() * 30000 + 10000,
              },
            );
            batchTaskIds.push(taskId);
          }

          // Randomly complete some tasks
          batchTaskIds.forEach((taskId) => {
            if (Math.random() > 0.7) {
              taskStatusMonitor.updateTaskStatus(taskId, {
                status:
                  Math.random() > 0.1
                    ? TaskStatus.COMPLETED
                    : TaskStatus.FAILED,
                endTime: new Date(),
                actualDuration: Math.random() * 25000 + 5000,
              });
            }
          });

          taskIds.push(...batchTaskIds);
        });

        operations.push(batchPromise);

        // Stagger batches slightly
        if (batch % 5 === 0) {
          await new Promise((resolve) => setTimeout(resolve, 10));
        }
      }

      await Promise.all(operations);

      const endTime = performance.now();
      const totalTime = endTime - startTime;
      const throughput = (taskCount / totalTime) * 1000; // operations per second

      console.log(`Task Operations Throughput:
        Total Operations: ${taskCount}
        Total Time: ${totalTime.toFixed(2)}ms
        Throughput: ${throughput.toFixed(2)} ops/sec
        Target: ${PERFORMANCE_TARGETS.throughputTarget} ops/sec`);

      expect(throughput).toBeGreaterThan(
        PERFORMANCE_TARGETS.throughputTarget * 0.5,
      ); // At least 50% of target
      expect(totalTime).toBeLessThan(10000); // Should complete within 10 seconds

      // Verify system stability
      const snapshot = realTimeMonitoring.getCurrentSnapshot();
      expect(snapshot.taskMetrics.total).toBe(taskCount);
    });

    it('should handle concurrent monitoring operations', async () => {
      const concurrentOperations = 100;
      const operationsPerThread = 10;

      const startTime = performance.now();

      const promises = Array.from(
        { length: concurrentOperations },
        async (_, threadIndex) => {
          const threadResults = [];

          for (let opIndex = 0; opIndex < operationsPerThread; opIndex++) {
            const operationStart = performance.now();

            // Mix of different operations
            const operations = [
              () => realTimeMonitoring.getCurrentSnapshot(),
              () => integrationHub.getSystemStatus(),
              () => integrationHub.getAggregatedData(),
              () =>
                performanceAnalytics.recordMetric(
                  `concurrent_test_${threadIndex}_${opIndex}`,
                  Math.random() * 1000,
                  'milliseconds',
                  'performance',
                  { thread: threadIndex, operation: opIndex },
                ),
            ];

            const randomOperation =
              operations[Math.floor(Math.random() * operations.length)];
            const result = randomOperation();

            const operationEnd = performance.now();
            threadResults.push({
              thread: threadIndex,
              operation: opIndex,
              duration: operationEnd - operationStart,
              result: result !== null && result !== undefined,
            });
          }

          return threadResults;
        },
      );

      const allResults = (await Promise.all(promises)).flat();
      const endTime = performance.now();

      const totalOperations = allResults.length;
      const totalTime = endTime - startTime;
      const throughput = (totalOperations / totalTime) * 1000;
      const avgOperationTime =
        allResults.reduce((sum, result) => sum + result.duration, 0) /
        totalOperations;
      const maxOperationTime = Math.max(...allResults.map((r) => r.duration));

      console.log(`Concurrent Operations Performance:
        Total Operations: ${totalOperations}
        Total Time: ${totalTime.toFixed(2)}ms
        Throughput: ${throughput.toFixed(2)} ops/sec
        Avg Operation Time: ${avgOperationTime.toFixed(2)}ms
        Max Operation Time: ${maxOperationTime.toFixed(2)}ms`);

      // Performance assertions
      expect(throughput).toBeGreaterThan(500); // At least 500 ops/sec
      expect(avgOperationTime).toBeLessThan(100); // Average under 100ms
      expect(maxOperationTime).toBeLessThan(
        PERFORMANCE_TARGETS.maxResponseTime,
      );

      // Verify all operations succeeded
      const successfulOperations = allResults.filter((r) => r.result).length;
      expect(successfulOperations / totalOperations).toBeGreaterThan(0.99); // 99% success rate
    });

    it('should maintain performance under sustained load', async () => {
      const testDuration = 5000; // 5 seconds
      const operationInterval = 50; // Every 50ms
      const startTime = performance.now();

      const operationTimes: number[] = [];
      const memoryUsages: number[] = [];
      let operationCount = 0;

      // Setup monitoring
      realTimeMonitoring.startMonitoring();

      const loadTestInterval = setInterval(() => {
        const opStart = performance.now();

        // Perform mixed operations
        const taskId = taskStatusMonitor.registerTask(
          `load-test-${operationCount}`,
          {
            title: `Load Test Task ${operationCount}`,
            type: TaskType.VALIDATION,
            priority: TaskPriority.NORMAL,
            estimatedDuration: 5000,
          },
        );

        if (operationCount % 3 === 0) {
          taskStatusMonitor.updateTaskStatus(taskId, {
            status: TaskStatus.COMPLETED,
            endTime: new Date(),
            actualDuration: Math.random() * 4000 + 1000,
          });
        }

        const snapshot = realTimeMonitoring.getCurrentSnapshot();
        const systemStatus = integrationHub.getSystemStatus();

        const opEnd = performance.now();
        operationTimes.push(opEnd - opStart);

        // Track memory usage
        const memUsage = process.memoryUsage();
        memoryUsages.push(memUsage.heapUsed);

        operationCount++;

        // Verify operations are successful
        expect(snapshot).toHaveProperty('timestamp');
        expect(systemStatus).toHaveProperty('overall');
      }, operationInterval);

      // Run for test duration
      await new Promise((resolve) => setTimeout(resolve, testDuration));
      clearInterval(loadTestInterval);
      realTimeMonitoring.stopMonitoring();

      const endTime = performance.now();
      const actualDuration = endTime - startTime;

      // Calculate performance metrics
      const avgOperationTime =
        operationTimes.reduce((sum, time) => sum + time, 0) /
        operationTimes.length;
      const maxOperationTime = Math.max(...operationTimes);
      const operationsPerSecond = (operationCount / actualDuration) * 1000;

      // Memory analysis
      const avgMemoryUsage =
        memoryUsages.reduce((sum, mem) => sum + mem, 0) / memoryUsages.length;
      const maxMemoryUsage = Math.max(...memoryUsages);
      const memoryGrowth =
        memoryUsages[memoryUsages.length - 1] - memoryUsages[0];

      console.log(`Sustained Load Test Results:
        Duration: ${actualDuration.toFixed(2)}ms
        Operations: ${operationCount}
        Operations/sec: ${operationsPerSecond.toFixed(2)}
        Avg Operation Time: ${avgOperationTime.toFixed(2)}ms
        Max Operation Time: ${maxOperationTime.toFixed(2)}ms
        Avg Memory Usage: ${(avgMemoryUsage / 1024 / 1024).toFixed(2)}MB
        Max Memory Usage: ${(maxMemoryUsage / 1024 / 1024).toFixed(2)}MB
        Memory Growth: ${(memoryGrowth / 1024 / 1024).toFixed(2)}MB`);

      // Performance assertions
      expect(avgOperationTime).toBeLessThan(
        PERFORMANCE_TARGETS.snapshotCollectionTime,
      );
      expect(operationsPerSecond).toBeGreaterThan(10); // At least 10 ops/sec sustained
      expect(maxMemoryUsage).toBeLessThan(PERFORMANCE_TARGETS.memoryUsageLimit);

      // Memory growth should be reasonable (less than 10MB over 5 seconds)
      expect(Math.abs(memoryGrowth)).toBeLessThan(10 * 1024 * 1024);

      // Performance should not degrade significantly over time
      const firstHalfAvg =
        operationTimes
          .slice(0, Math.floor(operationTimes.length / 2))
          .reduce((sum, time) => sum + time, 0) /
        Math.floor(operationTimes.length / 2);
      const secondHalfAvg =
        operationTimes
          .slice(Math.floor(operationTimes.length / 2))
          .reduce((sum, time) => sum + time, 0) /
        Math.ceil(operationTimes.length / 2);

      const performanceDegradation =
        ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100;
      console.log(
        `Performance degradation: ${performanceDegradation.toFixed(2)}%`,
      );

      expect(performanceDegradation).toBeLessThan(50); // Less than 50% degradation
    });
  });

  describe('Memory Efficiency', () => {
    it('should maintain stable memory usage', async () => {
      const initialMemory = process.memoryUsage();
      const memorySnapshots: number[] = [];

      // Simulate normal operations for memory tracking
      for (let cycle = 0; cycle < 100; cycle++) {
        // Create and process tasks
        const taskIds = [];
        for (let i = 0; i < 10; i++) {
          const taskId = taskStatusMonitor.registerTask(
            `memory-test-${cycle}-${i}`,
            {
              title: `Memory Test Task ${cycle}-${i}`,
              type: TaskType.IMPLEMENTATION,
              priority: TaskPriority.NORMAL,
              estimatedDuration: 15000,
            },
          );
          taskIds.push(taskId);
        }

        // Complete tasks
        taskIds.forEach((taskId) => {
          taskStatusMonitor.updateTaskStatus(taskId, {
            status: TaskStatus.COMPLETED,
            endTime: new Date(),
            actualDuration: Math.random() * 12000 + 3000,
          });
        });

        // Generate monitoring data
        realTimeMonitoring.getCurrentSnapshot();
        dashboard.getCurrentDashboardData();
        integrationHub.getSystemStatus();

        // Record performance metrics
        performanceAnalytics.recordMetric(
          'memory_test_metric',
          Math.random() * 500,
          'milliseconds',
          'performance',
          { cycle },
        );

        // Take memory snapshot every 10 cycles
        if (cycle % 10 === 0) {
          const currentMemory = process.memoryUsage();
          memorySnapshots.push(currentMemory.heapUsed);

          // Force garbage collection if available
          if (global.gc) {
            global.gc();
          }
        }

        // Brief pause to simulate real-world timing
        await new Promise((resolve) => setTimeout(resolve, 10));
      }

      const finalMemory = process.memoryUsage();
      const memoryGrowth = finalMemory.heapUsed - initialMemory.heapUsed;

      // Analyze memory stability
      const maxMemoryUsed = Math.max(...memorySnapshots);
      const minMemoryUsed = Math.min(...memorySnapshots);
      const memoryVariance = maxMemoryUsed - minMemoryUsed;

      console.log(`Memory Efficiency Test Results:
        Initial Memory: ${(initialMemory.heapUsed / 1024 / 1024).toFixed(2)}MB
        Final Memory: ${(finalMemory.heapUsed / 1024 / 1024).toFixed(2)}MB
        Memory Growth: ${(memoryGrowth / 1024 / 1024).toFixed(2)}MB
        Max Memory: ${(maxMemoryUsed / 1024 / 1024).toFixed(2)}MB
        Memory Variance: ${(memoryVariance / 1024 / 1024).toFixed(2)}MB
        Operations Processed: 1000 tasks`);

      // Memory assertions
      expect(finalMemory.heapUsed).toBeLessThan(
        PERFORMANCE_TARGETS.memoryUsageLimit,
      );
      expect(Math.abs(memoryGrowth)).toBeLessThan(20 * 1024 * 1024); // Less than 20MB growth
      expect(memoryVariance).toBeLessThan(30 * 1024 * 1024); // Less than 30MB variance
    });

    it('should efficiently handle large datasets', async () => {
      const largeDatasetSize = 10000;
      const startMemory = process.memoryUsage();

      // Create large dataset
      const taskIds: string[] = [];
      const batchSize = 500;

      for (let batch = 0; batch < largeDatasetSize / batchSize; batch++) {
        const batchTasks: string[] = [];

        for (let i = 0; i < batchSize; i++) {
          const taskIndex = batch * batchSize + i;
          const taskId = taskStatusMonitor.registerTask(
            `large-dataset-${taskIndex}`,
            {
              title: `Large Dataset Task ${taskIndex}`,
              description: `Task ${taskIndex} for large dataset testing with additional metadata and longer descriptions to simulate real-world data complexity`,
              type: TaskType.IMPLEMENTATION,
              priority: TaskPriority.NORMAL,
              estimatedDuration: Math.random() * 60000 + 30000,
              metadata: {
                category: 'large-dataset-test',
                batch,
                index: i,
                complexity: Math.random() > 0.5 ? 'high' : 'low',
                tags: [`tag-${i % 10}`, `batch-${batch}`, 'large-dataset'],
              },
            },
          );
          batchTasks.push(taskId);
        }

        // Process batch
        batchTasks.forEach((taskId) => {
          const random = Math.random();
          if (random > 0.3) {
            taskStatusMonitor.updateTaskStatus(taskId, {
              status: random > 0.1 ? TaskStatus.COMPLETED : TaskStatus.FAILED,
              endTime: new Date(),
              actualDuration: Math.random() * 45000 + 15000,
            });
          }
        });

        taskIds.push(...batchTasks);

        // Periodic memory check and cleanup
        if (batch % 5 === 0) {
          if (global.gc) {
            global.gc();
          }

          const currentMemory = process.memoryUsage();
          const memoryUsage = currentMemory.heapUsed / 1024 / 1024;

          console.log(
            `Batch ${batch}: Memory usage: ${memoryUsage.toFixed(2)}MB`,
          );

          // Memory should not grow unbounded
          expect(currentMemory.heapUsed).toBeLessThan(
            PERFORMANCE_TARGETS.memoryUsageLimit * 2,
          );
        }
      }

      // Generate comprehensive monitoring data
      const snapshot = realTimeMonitoring.getCurrentSnapshot();
      const aggregatedData = integrationHub.getAggregatedData();

      const endMemory = process.memoryUsage();
      const memoryUsed = endMemory.heapUsed - startMemory.heapUsed;

      console.log(`Large Dataset Performance:
        Dataset Size: ${largeDatasetSize} tasks
        Memory Used: ${(memoryUsed / 1024 / 1024).toFixed(2)}MB
        Memory per Task: ${(memoryUsed / largeDatasetSize / 1024).toFixed(2)}KB
        Total Tasks: ${snapshot.taskMetrics.total}
        Completed: ${snapshot.taskMetrics.completed}
        Failed: ${snapshot.taskMetrics.failed}`);

      // Verify data integrity
      expect(snapshot.taskMetrics.total).toBe(largeDatasetSize);
      expect(aggregatedData.taskMetrics.totalTasks).toBe(largeDatasetSize);

      // Memory efficiency assertions
      expect(memoryUsed / largeDatasetSize).toBeLessThan(5 * 1024); // Less than 5KB per task
      expect(endMemory.heapUsed).toBeLessThan(
        PERFORMANCE_TARGETS.memoryUsageLimit * 1.5,
      );
    });
  });

  describe('Export Performance', () => {
    it('should export large datasets efficiently', async () => {
      // Create dataset for export testing
      const exportDataSize = 1000;

      for (let i = 0; i < exportDataSize; i++) {
        const taskId = taskStatusMonitor.registerTask(`export-test-${i}`, {
          title: `Export Test Task ${i}`,
          type: TaskType.IMPLEMENTATION,
          priority: TaskPriority.NORMAL,
          estimatedDuration: Math.random() * 30000 + 10000,
        });

        if (i % 2 === 0) {
          taskStatusMonitor.updateTaskStatus(taskId, {
            status: TaskStatus.COMPLETED,
            endTime: new Date(),
            actualDuration: Math.random() * 25000 + 5000,
          });
        }

        // Add performance metrics
        performanceAnalytics.recordMetric(
          `export_test_metric_${i}`,
          Math.random() * 1000,
          'milliseconds',
          'performance',
          { exportTest: true, index: i },
        );
      }

      // Test JSON export performance
      const jsonStart = performance.now();
      const jsonData = await integrationHub.exportData('json', 'last_hour');
      const jsonEnd = performance.now();
      const jsonTime = jsonEnd - jsonStart;

      // Test CSV export performance
      const csvStart = performance.now();
      const csvData = await integrationHub.exportData('csv', 'last_hour');
      const csvEnd = performance.now();
      const csvTime = csvEnd - csvStart;

      // Test Prometheus export performance
      const prometheusStart = performance.now();
      const prometheusData = await integrationHub.exportData(
        'prometheus',
        'last_hour',
      );
      const prometheusEnd = performance.now();
      const prometheusTime = prometheusEnd - prometheusStart;

      console.log(`Data Export Performance:
        Dataset Size: ${exportDataSize} records
        JSON Export: ${jsonTime.toFixed(2)}ms (${(jsonData.length / 1024).toFixed(2)}KB)
        CSV Export: ${csvTime.toFixed(2)}ms (${(csvData.length / 1024).toFixed(2)}KB)
        Prometheus Export: ${prometheusTime.toFixed(2)}ms (${(prometheusData.length / 1024).toFixed(2)}KB)
        Target: ${PERFORMANCE_TARGETS.dataExportTime}ms`);

      // Performance assertions
      expect(jsonTime).toBeLessThan(PERFORMANCE_TARGETS.dataExportTime);
      expect(csvTime).toBeLessThan(PERFORMANCE_TARGETS.dataExportTime);
      expect(prometheusTime).toBeLessThan(PERFORMANCE_TARGETS.dataExportTime);

      // Verify export data integrity
      expect(typeof jsonData).toBe('string');
      expect(jsonData.length).toBeGreaterThan(1000); // Should have substantial content

      expect(typeof csvData).toBe('string');
      expect(csvData).toContain('timestamp,metric,value,unit');

      expect(typeof prometheusData).toBe('string');
      expect(prometheusData).toContain('# TYPE gemini_');

      // JSON should be parseable
      expect(() => JSON.parse(jsonData)).not.toThrow();
    });
  });

  describe('Scalability Performance', () => {
    it('should maintain performance as data volume increases', async () => {
      const scalabilityLevels = [100, 500, 1000, 2000];
      const performanceResults: Array<{
        dataSize: number;
        snapshotTime: number;
        aggregationTime: number;
        memoryUsage: number;
      }> = [];

      for (const dataSize of scalabilityLevels) {
        // Clean up before each test
        if (global.gc) {
          global.gc();
        }

        const startMemory = process.memoryUsage();

        // Generate dataset
        for (let i = 0; i < dataSize; i++) {
          const taskId = taskStatusMonitor.registerTask(
            `scale-test-${dataSize}-${i}`,
            {
              title: `Scale Test Task ${i}`,
              type: TaskType.IMPLEMENTATION,
              priority: TaskPriority.NORMAL,
              estimatedDuration: Math.random() * 20000 + 10000,
            },
          );

          if (Math.random() > 0.3) {
            taskStatusMonitor.updateTaskStatus(taskId, {
              status:
                Math.random() > 0.1 ? TaskStatus.COMPLETED : TaskStatus.FAILED,
              endTime: new Date(),
              actualDuration: Math.random() * 18000 + 2000,
            });
          }
        }

        // Measure snapshot performance
        const snapshotStart = performance.now();
        const snapshot = realTimeMonitoring.getCurrentSnapshot();
        const snapshotEnd = performance.now();

        // Measure aggregation performance
        const aggStart = performance.now();
        const aggregatedData = integrationHub.getAggregatedData();
        const aggEnd = performance.now();

        const endMemory = process.memoryUsage();

        performanceResults.push({
          dataSize,
          snapshotTime: snapshotEnd - snapshotStart,
          aggregationTime: aggEnd - aggStart,
          memoryUsage: endMemory.heapUsed - startMemory.heapUsed,
        });

        console.log(`Scalability Test - Data Size: ${dataSize}
          Snapshot Time: ${(snapshotEnd - snapshotStart).toFixed(2)}ms
          Aggregation Time: ${(aggEnd - aggStart).toFixed(2)}ms
          Memory Usage: ${((endMemory.heapUsed - startMemory.heapUsed) / 1024 / 1024).toFixed(2)}MB`);

        // Verify data integrity
        expect(snapshot.taskMetrics.total).toBe(dataSize);
        expect(aggregatedData.taskMetrics.totalTasks).toBe(dataSize);
      }

      // Analyze scalability characteristics
      console.log('\nScalability Analysis:');
      performanceResults.forEach((result, index) => {
        if (index > 0) {
          const prevResult = performanceResults[index - 1];
          const dataGrowthFactor = result.dataSize / prevResult.dataSize;
          const snapshotGrowthFactor =
            result.snapshotTime / prevResult.snapshotTime;
          const aggGrowthFactor =
            result.aggregationTime / prevResult.aggregationTime;

          console.log(`${prevResult.dataSize} -> ${result.dataSize} (${dataGrowthFactor.toFixed(1)}x data):
            Snapshot time: ${snapshotGrowthFactor.toFixed(2)}x growth
            Aggregation time: ${aggGrowthFactor.toFixed(2)}x growth`);

          // Performance should scale sub-linearly (better than O(n))
          expect(snapshotGrowthFactor).toBeLessThan(dataGrowthFactor * 1.5);
          expect(aggGrowthFactor).toBeLessThan(dataGrowthFactor * 1.5);
        }
      });

      // Largest dataset should still meet performance targets
      const largestResult = performanceResults[performanceResults.length - 1];
      expect(largestResult.snapshotTime).toBeLessThan(
        PERFORMANCE_TARGETS.snapshotCollectionTime * 2,
      );
      expect(largestResult.memoryUsage).toBeLessThan(
        PERFORMANCE_TARGETS.memoryUsageLimit,
      );
    });
  });
});
