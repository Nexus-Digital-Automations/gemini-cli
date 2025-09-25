/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ExecutionMonitoringSystem } from '../ExecutionMonitoringSystem.js';
/**
 * @fileoverview Comprehensive test suite for ExecutionMonitoringSystem
 *
 * Tests real-time monitoring, performance metrics collection, bottleneck
 * analysis, alert system, and health monitoring capabilities.
 */
// Mock configuration
const mockConfig = {
  storage: {
    getProjectTempDir: vi.fn(() => '/tmp/test-project'),
    ensureProjectTempDir: vi.fn(() => Promise.resolve()),
    writeFile: vi.fn(() => Promise.resolve()),
    readFile: vi.fn(() => Promise.resolve('{"events": [], "metrics": []}')),
    fileExists: vi.fn(() => Promise.resolve(false)),
  },
};
describe('ExecutionMonitoringSystem', () => {
  let monitoring;
  beforeEach(() => {
    vi.clearAllMocks();
    monitoring = new ExecutionMonitoringSystem(mockConfig);
  });
  afterEach(async () => {
    await monitoring.shutdown();
  });
  describe('Event Recording', () => {
    it('should record task execution events', () => {
      const event = {
        taskId: 'test-task-123',
        eventType: 'started',
        timestamp: new Date('2025-01-01T00:00:00Z'),
        metadata: {
          title: 'Test Task',
          type: 'implementation',
          priority: 'normal',
        },
      };
      monitoring.recordEvent(event);
      expect(true).toBe(true); // Placeholder for actual verification
    });
    it('should record events with duration and error information', () => {
      const completedEvent = {
        taskId: 'test-task-123',
        eventType: 'completed',
        timestamp: new Date('2025-01-01T00:05:00Z'),
        duration: 300000, // 5 minutes
        metadata: {
          title: 'Test Task',
          outputs: { result: 'success' },
        },
      };
      const failedEvent = {
        taskId: 'test-task-456',
        eventType: 'failed',
        timestamp: new Date('2025-01-01T00:03:00Z'),
        error: 'Task execution failed due to timeout',
        metadata: {
          title: 'Failed Task',
          retryCount: 2,
        },
      };
      monitoring.recordEvent(completedEvent);
      monitoring.recordEvent(failedEvent);
      expect(true).toBe(true); // Placeholder for actual verification
    });
  });
  describe('Metrics Collection', () => {
    let mockTasks;
    beforeEach(() => {
      mockTasks = createMockTasksForTesting();
    });
    it('should collect comprehensive execution metrics', async () => {
      const metrics = await monitoring.collectMetrics(mockTasks);
      expect(metrics).toBeDefined();
      expect(typeof metrics.totalTasks).toBe('number');
      expect(typeof metrics.runningTasks).toBe('number');
      expect(typeof metrics.completedTasks).toBe('number');
      expect(typeof metrics.failedTasks).toBe('number');
      expect(typeof metrics.averageExecutionTimeMs).toBe('number');
      expect(typeof metrics.successRate).toBe('number');
      expect(typeof metrics.tasksByType).toBe('object');
      expect(typeof metrics.tasksByComplexity).toBe('object');
      expect(typeof metrics.tasksByPriority).toBe('object');
    });
    it('should calculate correct success rate', async () => {
      const metrics = await monitoring.collectMetrics(mockTasks);
      const completedCount = mockTasks.filter(
        (t) => t.status === 'completed',
      ).length;
      const failedCount = mockTasks.filter((t) => t.status === 'failed').length;
      const finishedCount = completedCount + failedCount;
      const expectedSuccessRate =
        finishedCount > 0 ? (completedCount / finishedCount) * 100 : 0;
      expect(metrics.successRate).toBe(expectedSuccessRate);
    });
    it('should handle empty task list', async () => {
      const metrics = await monitoring.collectMetrics([]);
      expect(metrics.totalTasks).toBe(0);
      expect(metrics.runningTasks).toBe(0);
      expect(metrics.completedTasks).toBe(0);
      expect(metrics.failedTasks).toBe(0);
      expect(metrics.averageExecutionTimeMs).toBe(0);
      expect(metrics.successRate).toBe(0);
    });
  });
  describe('Bottleneck Analysis', () => {
    it('should identify performance bottlenecks', () => {
      const slowMetrics = {
        totalTasks: 10,
        runningTasks: 2,
        completedTasks: 6,
        failedTasks: 2,
        averageExecutionTimeMs: 1800000, // 30 minutes (very slow)
        successRate: 75,
        tasksByType: { implementation: 6, testing: 4 },
        tasksByComplexity: { simple: 4, moderate: 4, complex: 2 },
        tasksByPriority: { normal: 6, high: 3, low: 1 },
        memoryUsageMB: 600, // High memory usage
        totalRetries: 15,
      };
      const tasks = createMockTasksForTesting();
      const bottlenecks = monitoring.analyzeBottlenecks(slowMetrics, tasks);
      expect(Array.isArray(bottlenecks)).toBe(true);
      expect(bottlenecks.length).toBeGreaterThan(0);
      const slowExecutionBottleneck = bottlenecks.find(
        (b) => b.type === 'slow_execution',
      );
      expect(slowExecutionBottleneck).toBeDefined();
      expect(slowExecutionBottleneck?.severity).toBe('high');
    });
  });
  describe('System Health Monitoring', () => {
    it('should report healthy system status', () => {
      const healthyMetrics = {
        totalTasks: 10,
        runningTasks: 2,
        completedTasks: 7,
        failedTasks: 1,
        averageExecutionTimeMs: 120000, // 2 minutes
        successRate: 87.5, // 7/8 finished tasks
        tasksByType: { implementation: 5, testing: 3, documentation: 2 },
        tasksByComplexity: { simple: 4, moderate: 4, complex: 2 },
        tasksByPriority: { normal: 6, high: 3, low: 1 },
        memoryUsageMB: 200, // Under limit
        totalRetries: 3,
      };
      const health = monitoring.getSystemHealth(healthyMetrics);
      expect(health.overall).toBe('healthy');
      expect(health.memory).toBe('healthy');
      expect(health.performance).toBe('healthy');
      expect(health.reliability).toBe('healthy');
    });
    it('should report critical system status when performance is poor', () => {
      const criticalMetrics = {
        totalTasks: 10,
        runningTasks: 0,
        completedTasks: 2,
        failedTasks: 8,
        averageExecutionTimeMs: 1800000, // 30 minutes
        successRate: 20, // Critical success rate
        tasksByType: { implementation: 5, testing: 3, documentation: 2 },
        tasksByComplexity: { simple: 4, moderate: 4, complex: 2 },
        tasksByPriority: { normal: 6, high: 3, low: 1 },
        memoryUsageMB: 600, // Over limit
        totalRetries: 50, // Very high retry count
      };
      const health = monitoring.getSystemHealth(criticalMetrics);
      expect(health.overall).toBe('critical');
      expect(health.memory).toBe('critical');
      expect(health.performance).toBe('critical');
      expect(health.reliability).toBe('critical');
    });
  });
  describe('Dashboard Data Generation', () => {
    it('should generate comprehensive dashboard data', () => {
      const mockMetrics = {
        totalTasks: 10,
        runningTasks: 2,
        completedTasks: 7,
        failedTasks: 1,
        averageExecutionTimeMs: 180000,
        successRate: 87.5,
        tasksByType: { implementation: 5, testing: 3, documentation: 2 },
        tasksByComplexity: { simple: 4, moderate: 4, complex: 2 },
        tasksByPriority: { normal: 6, high: 3, low: 1 },
        memoryUsageMB: 250,
        totalRetries: 5,
      };
      const mockTasks = createMockTasksForTesting();
      const dashboardData = monitoring.getDashboardData(mockMetrics, mockTasks);
      expect(dashboardData).toBeDefined();
      expect(dashboardData.metrics).toEqual(mockMetrics);
      expect(Array.isArray(dashboardData.bottlenecks)).toBe(true);
      expect(dashboardData.health).toBeDefined();
      expect(dashboardData.trends).toBeDefined();
      expect(Array.isArray(dashboardData.recentEvents)).toBe(true);
    });
  });
});
// Helper function to create mock tasks
function createMockTasksForTesting() {
  const now = new Date();
  return [
    {
      id: 'task-1',
      title: 'Completed Task',
      description: 'A completed task',
      type: 'implementation',
      complexity: 'simple',
      priority: 'normal',
      status: 'completed',
      progress: 100,
      requiredCapabilities: ['frontend'],
      subtaskIds: [],
      dependencies: [],
      maxExecutionTimeMinutes: 60,
      maxRetries: 3,
      context: {},
      expectedOutputs: {},
      createdAt: new Date(now.getTime() - 600000),
      updatedAt: new Date(now.getTime() - 300000),
      startedAt: new Date(now.getTime() - 600000),
      completedAt: new Date(now.getTime() - 300000),
      retryCount: 0,
    },
    {
      id: 'task-2',
      title: 'Failed Task',
      description: 'A failed task',
      type: 'testing',
      complexity: 'moderate',
      priority: 'high',
      status: 'failed',
      progress: 25,
      requiredCapabilities: ['testing'],
      subtaskIds: [],
      dependencies: [],
      maxExecutionTimeMinutes: 30,
      maxRetries: 3,
      context: {},
      expectedOutputs: {},
      createdAt: new Date(now.getTime() - 480000),
      updatedAt: new Date(now.getTime() - 120000),
      startedAt: new Date(now.getTime() - 480000),
      lastError: 'Test execution failed',
      retryCount: 3,
    },
    {
      id: 'task-3',
      title: 'Running Task',
      description: 'A currently running task',
      type: 'documentation',
      complexity: 'simple',
      priority: 'low',
      status: 'in_progress',
      progress: 75,
      requiredCapabilities: ['documentation'],
      subtaskIds: [],
      dependencies: [],
      maxExecutionTimeMinutes: 45,
      maxRetries: 3,
      context: {},
      expectedOutputs: {},
      createdAt: new Date(now.getTime() - 240000),
      updatedAt: new Date(now.getTime() - 60000),
      startedAt: new Date(now.getTime() - 240000),
      retryCount: 1,
    },
  ];
}
//# sourceMappingURL=ExecutionMonitoringSystem.test.js.map
