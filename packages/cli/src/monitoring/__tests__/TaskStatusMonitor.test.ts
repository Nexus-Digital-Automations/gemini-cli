/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { EventEmitter as _EventEmitter } from 'node:events';
import {
  TaskStatusMonitor,
  TaskStatus,
  TaskType,
  TaskPriority,
} from '../TaskStatusMonitor.js';

// Mock logger
vi.mock('../utils/logger.js', () => ({
  Logger: vi.fn(() => ({
    info: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    debug: vi.fn(),
  })),
}));

describe('TaskStatusMonitor', () => {
  let monitor: TaskStatusMonitor;

  beforeEach(() => {
    monitor = new TaskStatusMonitor();
  });

  afterEach(() => {
    monitor.destroy();
  });

  describe('Task Registration', () => {
    it('should register a new task with valid metadata', async () => {
      const taskData = {
        title: 'Test Task',
        description: 'A test task for unit testing',
        type: TaskType.IMPLEMENTATION,
        priority: TaskPriority.NORMAL,
        assignedAgent: 'test-agent',
        dependencies: [],
        tags: ['test', 'unit'],
        metadata: { source: 'test' },
      };

      const taskId = await monitor.registerTask(taskData);

      expect(taskId).toMatch(/^task_\d+_[a-f0-9]{12}$/);

      const task = monitor.getTaskStatus(taskId);
      expect(task).toBeDefined();
      expect(task?.title).toBe(taskData.title);
      expect(task?.status).toBe(TaskStatus.QUEUED);
      expect(task?.progress).toBe(0);
    });

    it('should emit task:registered event', async () => {
      const eventListener = vi.fn();
      monitor.on('task:registered', eventListener);

      const taskData = {
        title: 'Event Test Task',
        description: 'Testing event emission',
        type: TaskType.TESTING,
        priority: TaskPriority.HIGH,
        dependencies: [],
        tags: [],
        metadata: {},
      };

      await monitor.registerTask(taskData);

      expect(eventListener).toHaveBeenCalledTimes(1);
      expect(eventListener).toHaveBeenCalledWith(
        expect.objectContaining({
          task: expect.objectContaining({
            title: taskData.title,
            status: TaskStatus.QUEUED,
          }),
        }),
      );
    });
  });

  describe('Task Status Updates', () => {
    let taskId: string;

    beforeEach(async () => {
      taskId = await monitor.registerTask({
        title: 'Update Test Task',
        description: 'Task for testing status updates',
        type: TaskType.IMPLEMENTATION,
        priority: TaskPriority.NORMAL,
        dependencies: [],
        tags: [],
        metadata: {},
      });
    });

    it('should update task status successfully', async () => {
      const result = await monitor.updateTaskStatus(
        taskId,
        TaskStatus.IN_PROGRESS,
        {
          agentId: 'test-agent',
          progress: 25,
          message: 'Task started',
        },
      );

      expect(result).toBe(true);

      const task = monitor.getTaskStatus(taskId);
      expect(task?.status).toBe(TaskStatus.IN_PROGRESS);
      expect(task?.progress).toBe(25);
      expect(task?.assignedAgent).toBe('test-agent');
      expect(task?.startTime).toBeInstanceOf(Date);
    });

    it('should handle task completion correctly', async () => {
      // First start the task
      await monitor.updateTaskStatus(taskId, TaskStatus.IN_PROGRESS);

      // Then complete it
      const result = await monitor.updateTaskStatus(
        taskId,
        TaskStatus.COMPLETED,
        {
          progress: 100,
          message: 'Task completed successfully',
        },
      );

      expect(result).toBe(true);

      const task = monitor.getTaskStatus(taskId);
      expect(task?.status).toBe(TaskStatus.COMPLETED);
      expect(task?.progress).toBe(100);
      expect(task?.endTime).toBeInstanceOf(Date);
      expect(task?.actualDuration).toBeGreaterThan(0);
    });

    it('should increment error count on failure', async () => {
      await monitor.updateTaskStatus(taskId, TaskStatus.FAILED, {
        error: 'Test error',
        message: 'Task failed due to test error',
      });

      const task = monitor.getTaskStatus(taskId);
      expect(task?.status).toBe(TaskStatus.FAILED);
      expect(task?.errorCount).toBe(1);
      expect(task?.endTime).toBeInstanceOf(Date);
    });

    it('should return false for non-existent task', async () => {
      const result = await monitor.updateTaskStatus(
        'non-existent',
        TaskStatus.COMPLETED,
      );
      expect(result).toBe(false);
    });

    it('should emit appropriate events on status change', async () => {
      const statusChangeListener = vi.fn();
      const completedListener = vi.fn();

      monitor.on('task:status-changed', statusChangeListener);
      monitor.on('task:completed', completedListener);

      await monitor.updateTaskStatus(taskId, TaskStatus.COMPLETED);

      expect(statusChangeListener).toHaveBeenCalledTimes(1);
      expect(completedListener).toHaveBeenCalledTimes(1);
    });
  });

  describe('Agent Management', () => {
    const agentId = 'test-agent-001';

    it('should register agent with capabilities', async () => {
      const capabilities = ['frontend', 'testing', 'documentation'];

      await monitor.registerAgent(agentId, capabilities);

      const agent = monitor.getAgentStatus(agentId);
      expect(agent).toBeDefined();
      expect(agent?.id).toBe(agentId);
      expect(agent?.capabilities).toEqual(capabilities);
      expect(agent?.status).toBe('active');
      expect(agent?.completedTasks).toBe(0);
      expect(agent?.performance.successRate).toBe(100);
    });

    it('should update agent heartbeat', async () => {
      await monitor.registerAgent(agentId, ['general']);

      const initialAgent = monitor.getAgentStatus(agentId);
      const initialHeartbeat = initialAgent?.lastHeartbeat;

      // Wait a bit to ensure timestamp difference
      await new Promise((resolve) => setTimeout(resolve, 10));

      await monitor.updateAgentHeartbeat(agentId);

      const updatedAgent = monitor.getAgentStatus(agentId);
      expect(updatedAgent?.lastHeartbeat.getTime()).toBeGreaterThan(
        initialHeartbeat!.getTime(),
      );
    });

    it('should handle heartbeat for unknown agent gracefully', async () => {
      // Should not throw error
      await expect(
        monitor.updateAgentHeartbeat('unknown-agent'),
      ).resolves.toBeUndefined();
    });
  });

  describe('Task Filtering and Querying', () => {
    beforeEach(async () => {
      // Create test tasks with different properties
      await monitor.registerTask({
        title: 'Frontend Task',
        description: 'Frontend implementation',
        type: TaskType.IMPLEMENTATION,
        priority: TaskPriority.HIGH,
        assignedAgent: 'frontend-agent',
        dependencies: [],
        tags: ['frontend'],
        metadata: {},
      });

      await monitor.registerTask({
        title: 'Backend Task',
        description: 'Backend implementation',
        type: TaskType.IMPLEMENTATION,
        priority: TaskPriority.NORMAL,
        assignedAgent: 'backend-agent',
        dependencies: [],
        tags: ['backend'],
        metadata: {},
      });

      await monitor.registerTask({
        title: 'Test Task',
        description: 'Testing implementation',
        type: TaskType.TESTING,
        priority: TaskPriority.LOW,
        dependencies: [],
        tags: ['testing'],
        metadata: {},
      });
    });

    it('should filter tasks by status', () => {
      const queuedTasks = monitor.getAllTasks({ status: TaskStatus.QUEUED });
      expect(queuedTasks).toHaveLength(3);
      expect(
        queuedTasks.every((task) => task.status === TaskStatus.QUEUED),
      ).toBe(true);
    });

    it('should filter tasks by type', () => {
      const implementationTasks = monitor.getAllTasks({
        type: TaskType.IMPLEMENTATION,
      });
      expect(implementationTasks).toHaveLength(2);
      expect(
        implementationTasks.every(
          (task) => task.type === TaskType.IMPLEMENTATION,
        ),
      ).toBe(true);

      const testingTasks = monitor.getAllTasks({ type: TaskType.TESTING });
      expect(testingTasks).toHaveLength(1);
      expect(testingTasks[0].type).toBe(TaskType.TESTING);
    });

    it('should filter tasks by priority', () => {
      const highPriorityTasks = monitor.getAllTasks({
        priority: TaskPriority.HIGH,
      });
      expect(highPriorityTasks).toHaveLength(1);
      expect(highPriorityTasks[0].priority).toBe(TaskPriority.HIGH);
    });

    it('should filter tasks by assigned agent', () => {
      const frontendTasks = monitor.getAllTasks({
        assignedAgent: 'frontend-agent',
      });
      expect(frontendTasks).toHaveLength(1);
      expect(frontendTasks[0].assignedAgent).toBe('frontend-agent');
    });

    it('should sort tasks by last update date', () => {
      const allTasks = monitor.getAllTasks();
      expect(allTasks).toHaveLength(3);

      // Tasks should be sorted by lastUpdate in descending order (newest first)
      for (let i = 1; i < allTasks.length; i++) {
        expect(allTasks[i - 1].lastUpdate.getTime()).toBeGreaterThanOrEqual(
          allTasks[i].lastUpdate.getTime(),
        );
      }
    });
  });

  describe('Performance Metrics', () => {
    beforeEach(async () => {
      // Register agents and tasks
      await monitor.registerAgent('agent-1', ['frontend']);
      await monitor.registerAgent('agent-2', ['backend']);

      const taskId1 = await monitor.registerTask({
        title: 'Completed Task',
        description: 'A completed task',
        type: TaskType.IMPLEMENTATION,
        priority: TaskPriority.NORMAL,
        dependencies: [],
        tags: [],
        metadata: {},
      });

      const taskId2 = await monitor.registerTask({
        title: 'Failed Task',
        description: 'A failed task',
        type: TaskType.IMPLEMENTATION,
        priority: TaskPriority.NORMAL,
        dependencies: [],
        tags: [],
        metadata: {},
      });

      // Complete one task, fail another
      await monitor.updateTaskStatus(taskId1, TaskStatus.COMPLETED);
      await monitor.updateTaskStatus(taskId2, TaskStatus.FAILED);
    });

    it('should provide accurate performance metrics', () => {
      const metrics = monitor.getPerformanceMetrics();

      expect(metrics.totalTasks).toBe(2);
      expect(metrics.completedTasks).toBe(1);
      expect(metrics.failedTasks).toBe(1);
      expect(metrics.activeAgents).toBe(2);
      expect(metrics.tasksInProgress).toBe(0);
      expect(metrics.queuedTasks).toBe(0);
      expect(metrics.blockedTasks).toBe(0);
      expect(metrics.systemEfficiency).toBe(50); // 1 completed out of 2 total
    });

    it('should track system uptime', () => {
      const metrics = monitor.getPerformanceMetrics();
      expect(metrics.systemUptime).toBeInstanceOf(Date);
      expect(metrics.systemUptime.getTime()).toBeLessThanOrEqual(Date.now());
    });
  });

  describe('Status History', () => {
    it('should maintain status history', async () => {
      const taskId = await monitor.registerTask({
        title: 'History Test Task',
        description: 'Task for testing history',
        type: TaskType.IMPLEMENTATION,
        priority: TaskPriority.NORMAL,
        dependencies: [],
        tags: [],
        metadata: {},
      });

      await monitor.updateTaskStatus(taskId, TaskStatus.IN_PROGRESS);
      await monitor.updateTaskStatus(taskId, TaskStatus.COMPLETED);

      const history = monitor.getTaskStatusHistory(taskId);

      // Should have at least the status updates
      expect(history.length).toBeGreaterThanOrEqual(2);

      // Check that history is sorted by timestamp (newest first)
      for (let i = 1; i < history.length; i++) {
        expect(history[i - 1].timestamp.getTime()).toBeGreaterThanOrEqual(
          history[i].timestamp.getTime(),
        );
      }
    });

    it('should limit status history entries', () => {
      const fullHistory = monitor.getTaskStatusHistory();
      const limitedHistory = monitor.getTaskStatusHistory(undefined, 5);

      expect(limitedHistory.length).toBeLessThanOrEqual(5);
      expect(limitedHistory.length).toBeLessThanOrEqual(fullHistory.length);
    });
  });

  describe('Error Handling', () => {
    it('should handle subscription management gracefully', () => {
      const subscriberId = 'test-subscriber';

      // Should not throw when subscribing
      expect(() => monitor.subscribe(subscriberId)).not.toThrow();

      // Should not throw when unsubscribing
      expect(() => monitor.unsubscribe(subscriberId)).not.toThrow();

      // Should not throw when unsubscribing non-existent subscriber
      expect(() => monitor.unsubscribe('non-existent')).not.toThrow();
    });

    it('should handle task updates for invalid statuses gracefully', async () => {
      const taskId = await monitor.registerTask({
        title: 'Error Test Task',
        description: 'Task for testing error handling',
        type: TaskType.IMPLEMENTATION,
        priority: TaskPriority.NORMAL,
        dependencies: [],
        tags: [],
        metadata: {},
      });

      // Invalid status should not crash the system
      const result = await monitor.updateTaskStatus(
        taskId,
        'invalid_status' as TaskStatus,
      );
      expect(result).toBe(true); // Should still update since TypeScript handles enum validation
    });
  });

  describe('Resource Cleanup', () => {
    it('should cleanup resources properly', () => {
      const testMonitor = new TaskStatusMonitor();

      // Add some data
      testMonitor.registerTask({
        title: 'Cleanup Test',
        description: 'Task for cleanup testing',
        type: TaskType.IMPLEMENTATION,
        priority: TaskPriority.NORMAL,
        dependencies: [],
        tags: [],
        metadata: {},
      });

      // Should not throw when destroying
      expect(() => testMonitor.destroy()).not.toThrow();
    });
  });
});
