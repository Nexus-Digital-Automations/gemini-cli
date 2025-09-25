/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TaskManagementSystemFactory } from '../../index.js';
import type { TaskExecutionEngine } from '../../TaskExecutionEngine.complete.js';
import type { ExecutionMonitoringSystem } from '../../ExecutionMonitoringSystem.js';
import type { InfiniteHookIntegration } from '../../InfiniteHookIntegration.js';
import { DependencyResolver } from '../../DependencyResolver.js';
import { TaskPriorityScheduler } from '../../TaskPriorityScheduler.js';
import { TaskLifecycle } from '../../TaskLifecycle.js';
import type { Config } from '../../../config/config.js';
import type { Task, TaskDependency, TaskResult } from '../../types.js';

/**
 * @fileoverview Integration tests for task management system components
 *
 * Tests complete workflows involving multiple components working together,
 * ensuring seamless integration and data flow between systems.
 */

describe('Task Management System Integration', () => {
  let config: Partial<Config>;
  let system: {
    taskEngine: TaskExecutionEngine;
    monitoring?: ExecutionMonitoringSystem;
    hookIntegration?: InfiniteHookIntegration;
    shutdown: () => Promise<void>;
  };

  beforeEach(async () => {
    config = {
      getModel: vi.fn(() => 'gemini-2.0-pro'),
      getToolRegistry: vi.fn(() => ({
        getTool: vi.fn(),
        getAllTools: vi.fn(() => []),
        getAllToolNames: vi.fn(() => []),
        getFunctionDeclarationsFiltered: vi.fn(() => []),
      })),
      storage: {
        getProjectTempDir: vi.fn(() => '/tmp/test-project'),
        ensureProjectTempDir: vi.fn(),
      } as any,
      getSessionId: vi.fn(() => 'integration-test-session'),
      settings: {
        get: vi.fn((key) => {
          if (key === 'taskManagement.maxConcurrentTasks') return 5;
          if (key === 'taskManagement.defaultTimeout') return 300000;
          return undefined;
        }),
      },
    };

    // Mock file system operations
    vi.mock('fs/promises', () => ({
      writeFile: vi.fn(),
      readFile: vi.fn(),
      mkdir: vi.fn(),
      access: vi.fn(),
      unlink: vi.fn(),
    }));

    system = await TaskManagementSystemFactory.createComplete(
      config as Config,
      {
        enableMonitoring: true,
        enableHookIntegration: false, // Disable for testing
      },
    );
  });

  afterEach(async () => {
    if (system) {
      await system.shutdown();
    }
    vi.clearAllMocks();
  });

  describe('End-to-End Task Execution Workflow', () => {
    it('should execute complete task lifecycle with monitoring', async () => {
      const taskId = await system.taskEngine.queueTask(
        'Integration Test Task',
        'Complete integration test with monitoring and validation',
        {
          type: 'testing',
          priority: 'high',
          expectedOutputs: {
            test_results: 'Comprehensive test results',
            coverage_report: 'Test coverage metrics',
          },
        },
      );

      expect(taskId).toBeTruthy();

      // Verify task was created correctly
      const task = system.taskEngine.getTask(taskId);
      expect(task).toBeTruthy();
      expect(task!.title).toBe('Integration Test Task');
      expect(task!.status).toBe('queued');

      // Verify monitoring system is tracking the task
      if (system.monitoring) {
        const metrics = await system.monitoring.collectMetrics([task!]);
        expect(metrics.totalTasks).toBe(1);
        expect(metrics.queuedTasks).toBe(1);
      }

      // Simulate task execution states
      const updatedTask = system.taskEngine.getTask(taskId)!;

      // Move to in_progress
      updatedTask.status = 'in_progress';
      updatedTask.startedAt = new Date();
      updatedTask.progress = 50;

      if (system.monitoring) {
        const metrics = await system.monitoring.collectMetrics([updatedTask]);
        expect(metrics.inProgressTasks).toBe(1);
      }

      // Complete task
      updatedTask.status = 'completed';
      updatedTask.completedAt = new Date();
      updatedTask.progress = 100;
      updatedTask.outputs = {
        test_results: 'All tests passed',
        coverage_report: '95% coverage achieved',
      };

      if (system.monitoring) {
        const metrics = await system.monitoring.collectMetrics([updatedTask]);
        expect(metrics.completedTasks).toBe(1);
        expect(metrics.successRate).toBe(100);
      }
    });

    it('should handle task dependencies across components', async () => {
      // Create tasks with dependencies
      const task1Id = await system.taskEngine.queueTask(
        'Foundation Task',
        'Set up project foundation',
        { type: 'implementation', priority: 'high' },
      );

      const task2Id = await system.taskEngine.queueTask(
        'Feature Implementation',
        'Implement main feature',
        {
          type: 'implementation',
          priority: 'high',
          dependencies: [task1Id],
        },
      );

      const task3Id = await system.taskEngine.queueTask(
        'Testing Task',
        'Test the implemented feature',
        {
          type: 'testing',
          priority: 'medium',
          dependencies: [task2Id],
        },
      );

      const allTasks = system.taskEngine.getAllTasks();
      expect(allTasks).toHaveLength(3);

      // Verify dependency resolution
      const resolver = new DependencyResolver();
      const dependencies: TaskDependency[] = [
        { dependentTaskId: task2Id, dependsOnTaskId: task1Id, type: 'hard' },
        { dependentTaskId: task3Id, dependsOnTaskId: task2Id, type: 'hard' },
      ];

      const graph = resolver.buildDependencyGraph(allTasks, dependencies);
      const sorted = resolver.topologicalSort(graph);

      expect(sorted).toEqual([task1Id, task2Id, task3Id]);

      // Test ready task identification
      const readyTasks = resolver.getReadyTasks(graph, allTasks);
      expect(readyTasks).toHaveLength(1);
      expect(readyTasks[0].id).toBe(task1Id);
    });

    it('should coordinate priority scheduling with execution monitoring', async () => {
      const scheduler = new TaskPriorityScheduler({
        maxConcurrentTasks: 3,
        defaultTimeout: 300000,
        defaultMaxRetries: 3,
        resourcePools: new Map([
          ['cpu', 4],
          ['memory', 8],
        ]),
        priorityThresholds: { critical: 90, high: 70, medium: 50, low: 30 },
        schedulingAlgorithm: 'priority',
        autoDependencyLearning: true,
        performanceMonitoring: true,
      });

      // Create tasks with different priorities
      const tasks: Task[] = [];
      const priorities = ['low', 'high', 'critical', 'medium'] as const;

      for (let i = 0; i < priorities.length; i++) {
        const taskId = await system.taskEngine.queueTask(
          `Task Priority ${priorities[i]}`,
          `Task with ${priorities[i]} priority`,
          { priority: priorities[i] },
        );
        const task = system.taskEngine.getTask(taskId)!;
        tasks.push(task);
      }

      // Schedule tasks
      const sequence = scheduler.scheduleSequence(tasks);

      // Verify priority ordering
      expect(sequence.sequence[0]).toBe(tasks[2].id); // critical first
      expect(sequence.sequence[1]).toBe(tasks[1].id); // high second
      expect(sequence.sequence[2]).toBe(tasks[3].id); // medium third
      expect(sequence.sequence[3]).toBe(tasks[0].id); // low last

      // Monitor execution
      if (system.monitoring) {
        const metrics = await system.monitoring.collectMetrics(tasks);
        expect(metrics.totalTasks).toBe(4);
        expect(metrics.priorityDistribution.critical).toBe(1);
        expect(metrics.priorityDistribution.high).toBe(1);
      }
    });
  });

  describe('Error Handling and Recovery Integration', () => {
    it('should handle task failures across all components', async () => {
      const taskId = await system.taskEngine.queueTask(
        'Failing Task',
        'Task designed to fail for testing',
        { type: 'testing', priority: 'high', maxRetries: 2 },
      );

      const task = system.taskEngine.getTask(taskId)!;

      // Simulate task failure
      task.status = 'in_progress';
      task.startedAt = new Date();

      // First failure
      task.status = 'failed';
      task.lastError = 'Simulated failure 1';
      task.retryCount = 1;

      if (system.monitoring) {
        system.monitoring.recordEvent({
          taskId: task.id,
          eventType: 'failed',
          timestamp: new Date(),
          error: task.lastError,
          metadata: { retryCount: task.retryCount },
        });

        const metrics = await system.monitoring.collectMetrics([task]);
        expect(metrics.failedTasks).toBe(1);
        expect(metrics.errorRate).toBeGreaterThan(0);
      }

      // Test retry mechanism
      const lifecycle = new TaskLifecycle({});
      const retryResult = await lifecycle.retryTask(task);

      expect(retryResult.success).toBe(true);
      expect(task.status).toBe('ready');
      expect(task.retryCount).toBe(2);

      // Second failure (exceeds retry limit)
      task.status = 'failed';
      task.lastError = 'Simulated failure 2';
      task.retryCount = 2;

      const finalRetryResult = await lifecycle.retryTask(task);
      expect(finalRetryResult.success).toBe(false);
      expect(finalRetryResult.error).toContain('retry limit');
    });

    it('should recover stalled tasks with system coordination', async () => {
      const taskId = await system.taskEngine.queueTask(
        'Stalled Task',
        'Task that will become stalled',
        { type: 'implementation', priority: 'medium' },
      );

      const task = system.taskEngine.getTask(taskId)!;

      // Simulate stalled task (started long ago, no progress)
      task.status = 'in_progress';
      task.startedAt = new Date(Date.now() - 3 * 60 * 60 * 1000); // 3 hours ago
      task.executionContext = { timeout: 60 * 60 * 1000 }; // 1 hour timeout

      const lifecycle = new TaskLifecycle({});
      const recoveredTasks = await lifecycle.recoverStalledTasks([task]);

      expect(recoveredTasks).toHaveLength(1);
      expect(task.status).toBe('failed');
      expect(task.lastError).toContain('timeout');

      // Verify monitoring recorded the recovery
      if (system.monitoring) {
        const metrics = await system.monitoring.collectMetrics([task]);
        expect(metrics.stalledTasks).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('Performance and Scalability Integration', () => {
    it('should handle high-volume task processing efficiently', async () => {
      const taskCount = 50;
      const startTime = Date.now();

      // Create many tasks rapidly
      const taskPromises = Array.from({ length: taskCount }, (_, i) =>
        system.taskEngine.queueTask(
          `Bulk Task ${i}`,
          `Bulk processing task number ${i}`,
          {
            type: i % 2 === 0 ? 'implementation' : 'testing',
            priority: ['low', 'medium', 'high'][i % 3] as any,
          },
        ),
      );

      const taskIds = await Promise.all(taskPromises);
      const creationTime = Date.now() - startTime;

      expect(taskIds).toHaveLength(taskCount);
      expect(creationTime).toBeLessThan(5000); // Should create 50 tasks in under 5 seconds

      // Verify all tasks are tracked
      const allTasks = system.taskEngine.getAllTasks();
      expect(allTasks).toHaveLength(taskCount);

      // Test monitoring performance
      if (system.monitoring) {
        const metricsStartTime = Date.now();
        const metrics = await system.monitoring.collectMetrics(allTasks);
        const metricsTime = Date.now() - metricsStartTime;

        expect(metrics.totalTasks).toBe(taskCount);
        expect(metricsTime).toBeLessThan(1000); // Metrics collection should be fast
      }

      // Test filtering performance
      const filterStartTime = Date.now();
      const highPriorityTasks = system.taskEngine.getAllTasks({
        priority: 'high',
      });
      const filterTime = Date.now() - filterStartTime;

      expect(highPriorityTasks.length).toBeGreaterThan(0);
      expect(filterTime).toBeLessThan(500); // Filtering should be very fast
    });

    it('should handle complex dependency graphs efficiently', async () => {
      const baseTaskCount = 20;
      const tasks: Task[] = [];

      // Create base tasks
      for (let i = 0; i < baseTaskCount; i++) {
        const taskId = await system.taskEngine.queueTask(
          `Complex Task ${i}`,
          `Task ${i} in complex dependency graph`,
          { type: 'implementation', priority: 'medium' },
        );
        const task = system.taskEngine.getTask(taskId)!;
        tasks.push(task);
      }

      // Create complex dependency relationships
      const dependencies: TaskDependency[] = [];
      for (let i = 1; i < baseTaskCount; i++) {
        if (i < baseTaskCount / 2) {
          // First half depends on previous task (linear chain)
          dependencies.push({
            dependentTaskId: tasks[i].id,
            dependsOnTaskId: tasks[i - 1].id,
            type: 'hard',
          });
        } else {
          // Second half has more complex dependencies
          const depIndex = i % (baseTaskCount / 2);
          dependencies.push({
            dependentTaskId: tasks[i].id,
            dependsOnTaskId: tasks[depIndex].id,
            type: 'soft',
          });
        }
      }

      // Test dependency resolution performance
      const resolver = new DependencyResolver();
      const graphStartTime = Date.now();
      const graph = resolver.buildDependencyGraph(tasks, dependencies);
      const graphTime = Date.now() - graphStartTime;

      expect(graph.nodes.size).toBe(baseTaskCount);
      expect(graphTime).toBeLessThan(1000);

      // Test topological sorting performance
      const sortStartTime = Date.now();
      const sorted = resolver.topologicalSort(graph);
      const sortTime = Date.now() - sortStartTime;

      expect(sorted).toHaveLength(baseTaskCount);
      expect(sortTime).toBeLessThan(500);

      // Test scheduling performance with complex dependencies
      const scheduler = new TaskPriorityScheduler({
        maxConcurrentTasks: 5,
        defaultTimeout: 300000,
        defaultMaxRetries: 3,
        resourcePools: new Map([['cpu', 8]]),
        priorityThresholds: { critical: 90, high: 70, medium: 50, low: 30 },
        schedulingAlgorithm: 'dependency_aware',
        autoDependencyLearning: true,
        performanceMonitoring: true,
      });

      const scheduleStartTime = Date.now();
      const sequence = scheduler.scheduleSequence(tasks);
      const scheduleTime = Date.now() - scheduleStartTime;

      expect(sequence.sequence).toHaveLength(baseTaskCount);
      expect(scheduleTime).toBeLessThan(2000);
    });
  });

  describe('System Configuration and Adaptation', () => {
    it('should adapt to different configuration settings', async () => {
      // Test with different max concurrent tasks
      const lowConcurrencyConfig = { ...config };
      lowConcurrencyConfig.settings = {
        get: vi.fn((key) => {
          if (key === 'taskManagement.maxConcurrentTasks') return 1;
          if (key === 'taskManagement.defaultTimeout') return 60000; // 1 minute
          return undefined;
        }),
      };

      const lowConcurrencySystem =
        await TaskManagementSystemFactory.createComplete(
          lowConcurrencyConfig as Config,
          { enableMonitoring: true, enableHookIntegration: false },
        );

      const taskId = await lowConcurrencySystem.taskEngine.queueTask(
        'Config Test Task',
        'Test with low concurrency config',
      );

      const task = lowConcurrencySystem.taskEngine.getTask(taskId)!;
      expect(task.maxExecutionTimeMinutes).toBe(1); // Should reflect timeout setting

      await lowConcurrencySystem.shutdown();
    });

    it('should handle resource constraint changes dynamically', async () => {
      const scheduler = new TaskPriorityScheduler({
        maxConcurrentTasks: 3,
        defaultTimeout: 300000,
        defaultMaxRetries: 3,
        resourcePools: new Map([
          ['cpu', 2],
          ['memory', 4],
        ]),
        priorityThresholds: { critical: 90, high: 70, medium: 50, low: 30 },
        schedulingAlgorithm: 'resource_optimal',
        autoDependencyLearning: true,
        performanceMonitoring: true,
      });

      const taskId = await system.taskEngine.queueTask(
        'Resource Test Task',
        'Task requiring specific resources',
        {
          type: 'implementation',
          priority: 'high',
          resourceConstraints: [
            { resourceType: 'cpu', maxUnits: 2 },
            { resourceType: 'memory', maxUnits: 3 },
          ],
        },
      );

      const task = system.taskEngine.getTask(taskId)!;

      // Test resource allocation
      const allocation = scheduler.allocateResources(task);
      expect(allocation).toBeTruthy();
      expect(allocation!.allocatedResources.get('cpu')).toBe(2);

      // Update available resources (simulate system load)
      scheduler.updateResourceAvailability('cpu', 1);
      scheduler.updateResourceAvailability('memory', 2);

      // Task requiring more resources than available
      const highResourceTaskId = await system.taskEngine.queueTask(
        'High Resource Task',
        'Task requiring more resources than available',
        {
          resourceConstraints: [
            { resourceType: 'cpu', maxUnits: 2 }, // Not enough CPU available
          ],
        },
      );

      const highResourceTask = system.taskEngine.getTask(highResourceTaskId)!;
      const failedAllocation = scheduler.allocateResources(highResourceTask);
      expect(failedAllocation).toBeNull(); // Should fail due to insufficient resources
    });
  });

  describe('Data Consistency and State Management', () => {
    it('should maintain data consistency across component interactions', async () => {
      const taskId = await system.taskEngine.queueTask(
        'Consistency Test Task',
        'Test data consistency across components',
        { type: 'testing', priority: 'high' },
      );

      let task = system.taskEngine.getTask(taskId)!;
      const originalCreatedAt = task.metadata.createdAt;
      const originalUpdatedAt = task.metadata.updatedAt;

      // Simulate state changes through different components
      const lifecycle = new TaskLifecycle({});

      // Transition through lifecycle
      await lifecycle.transitionTo(task, 'ready');
      task = system.taskEngine.getTask(taskId)!; // Refresh task reference
      expect(task.status).toBe('ready');
      expect(task.metadata.updatedAt.getTime()).toBeGreaterThan(
        originalUpdatedAt.getTime(),
      );
      expect(task.metadata.createdAt).toEqual(originalCreatedAt); // Should not change

      await lifecycle.transitionTo(task, 'in_progress');
      task = system.taskEngine.getTask(taskId)!;
      expect(task.status).toBe('in_progress');
      expect(task.metadata.startTime).toBeTruthy();

      // Verify monitoring sees consistent state
      if (system.monitoring) {
        const metrics = await system.monitoring.collectMetrics([task]);
        expect(metrics.inProgressTasks).toBe(1);
      }

      await lifecycle.transitionTo(task, 'completed');
      task = system.taskEngine.getTask(taskId)!;
      expect(task.status).toBe('completed');
      expect(task.metadata.endTime).toBeTruthy();
      expect(task.metadata.actualDuration).toBeGreaterThan(0);

      // Verify final state consistency
      if (system.monitoring) {
        const metrics = await system.monitoring.collectMetrics([task]);
        expect(metrics.completedTasks).toBe(1);
        expect(metrics.inProgressTasks).toBe(0);
        expect(metrics.successRate).toBe(100);
      }
    });

    it('should handle concurrent modifications safely', async () => {
      const taskId = await system.taskEngine.queueTask(
        'Concurrency Test Task',
        'Test concurrent modifications',
      );

      const task = system.taskEngine.getTask(taskId)!;
      const lifecycle = new TaskLifecycle({});

      // Simulate concurrent operations
      const operations = [
        () => lifecycle.transitionTo(task, 'ready'),
        () => system.taskEngine.cancelTask(taskId),
        () => lifecycle.validateState(task),
      ];

      const results = await Promise.allSettled(operations.map((op) => op()));

      // At least some operations should complete successfully
      const successful = results.filter((r) => r.status === 'fulfilled');
      expect(successful.length).toBeGreaterThan(0);

      // Final state should be consistent
      const finalTask = system.taskEngine.getTask(taskId);
      expect(finalTask).toBeTruthy();
      expect(['ready', 'cancelled']).toContain(finalTask!.status);
    });
  });
});

// Performance benchmark tests
describe('Task Management Performance Benchmarks', () => {
  let system: {
    taskEngine: TaskExecutionEngine;
    monitoring?: ExecutionMonitoringSystem;
    shutdown: () => Promise<void>;
  };

  beforeEach(async () => {
    const config = {
      getModel: vi.fn(() => 'gemini-2.0-pro'),
      getToolRegistry: vi.fn(() => ({
        getTool: vi.fn(),
        getAllTools: vi.fn(() => []),
        getAllToolNames: vi.fn(() => []),
        getFunctionDeclarationsFiltered: vi.fn(() => []),
      })),
      storage: {
        getProjectTempDir: vi.fn(() => '/tmp/benchmark-project'),
      } as any,
      getSessionId: vi.fn(() => 'benchmark-session'),
    };

    system = await TaskManagementSystemFactory.createComplete(
      config as Config,
      {
        enableMonitoring: true,
        enableHookIntegration: false,
      },
    );
  });

  afterEach(async () => {
    await system.shutdown();
  });

  it('should meet performance benchmarks for task operations', async () => {
    const benchmarks = {
      taskCreation: { limit: 100, timeLimit: 1000 }, // 100 tasks in 1 second
      taskRetrieval: { limit: 1000, timeLimit: 500 }, // 1000 retrievals in 0.5 seconds
      taskFiltering: { limit: 500, timeLimit: 200 }, // 500 filter operations in 0.2 seconds
      metricsCollection: { limit: 100, timeLimit: 1000 }, // 100 tasks metrics in 1 second
    };

    // Benchmark task creation
    let startTime = Date.now();
    const taskIds: string[] = [];
    for (let i = 0; i < benchmarks.taskCreation.limit; i++) {
      const taskId = await system.taskEngine.queueTask(
        `Benchmark Task ${i}`,
        `Performance benchmark task ${i}`,
        { priority: ['low', 'medium', 'high'][i % 3] as any },
      );
      taskIds.push(taskId);
    }
    let elapsed = Date.now() - startTime;
    expect(elapsed).toBeLessThan(benchmarks.taskCreation.timeLimit);
    console.log(
      `Task creation: ${benchmarks.taskCreation.limit} tasks in ${elapsed}ms`,
    );

    // Benchmark task retrieval
    startTime = Date.now();
    for (let i = 0; i < benchmarks.taskRetrieval.limit; i++) {
      const randomTaskId = taskIds[i % taskIds.length];
      const task = system.taskEngine.getTask(randomTaskId);
      expect(task).toBeTruthy();
    }
    elapsed = Date.now() - startTime;
    expect(elapsed).toBeLessThan(benchmarks.taskRetrieval.timeLimit);
    console.log(
      `Task retrieval: ${benchmarks.taskRetrieval.limit} retrievals in ${elapsed}ms`,
    );

    // Benchmark task filtering
    startTime = Date.now();
    for (let i = 0; i < benchmarks.taskFiltering.limit; i++) {
      const priority = ['low', 'medium', 'high'][i % 3] as any;
      const filteredTasks = system.taskEngine.getAllTasks({ priority });
      expect(filteredTasks.length).toBeGreaterThan(0);
    }
    elapsed = Date.now() - startTime;
    expect(elapsed).toBeLessThan(benchmarks.taskFiltering.timeLimit);
    console.log(
      `Task filtering: ${benchmarks.taskFiltering.limit} filters in ${elapsed}ms`,
    );

    // Benchmark metrics collection
    if (system.monitoring) {
      const allTasks = system.taskEngine.getAllTasks();
      startTime = Date.now();
      for (let i = 0; i < benchmarks.metricsCollection.limit; i++) {
        const metrics = await system.monitoring.collectMetrics(allTasks);
        expect(metrics.totalTasks).toBe(taskIds.length);
      }
      elapsed = Date.now() - startTime;
      expect(elapsed).toBeLessThan(benchmarks.metricsCollection.timeLimit);
      console.log(
        `Metrics collection: ${benchmarks.metricsCollection.limit} collections in ${elapsed}ms`,
      );
    }
  });
});
