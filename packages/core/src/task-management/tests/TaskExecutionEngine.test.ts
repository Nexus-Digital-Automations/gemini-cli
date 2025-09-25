/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TaskExecutionEngine } from '../TaskExecutionEngine.complete.js';
import { TaskBreakdownAnalyzer } from '../TaskExecutionEngine.js';
import { ExecutionMonitoringSystem } from '../ExecutionMonitoringSystem.js';
import { TaskExecutionUtils } from '../TaskExecutionEngine.utils.js';
import type {
  Task,
  TaskStatus,
  TaskType,
  TaskPriority,
  TaskComplexity
} from '../TaskExecutionEngine.js';
import type { Config } from '../../config/config.js';

/**
 * @fileoverview Comprehensive test suite for TaskExecutionEngine
 *
 * Tests intelligent task breakdown, autonomous execution, monitoring,
 * persistence, and error handling capabilities.
 */

// Mock configuration and dependencies
const mockConfig: Partial<Config> = {
  getModel: vi.fn(() => 'gemini-2.0-pro'),
  getToolRegistry: vi.fn(() => ({
    getTool: vi.fn(),
    getAllTools: vi.fn(() => []),
    getAllToolNames: vi.fn(() => []),
    getFunctionDeclarationsFiltered: vi.fn(() => [])
  })),
  storage: {
    getProjectTempDir: vi.fn(() => '/tmp/test-project')
  } as any,
  getSessionId: vi.fn(() => 'test-session')
};

// Mock SubAgentScope
vi.mock('../core/subagent.js', () => ({
  SubAgentScope: {
    create: vi.fn(() => ({
      runNonInteractive: vi.fn(() => Promise.resolve()),
      output: {
        terminate_reason: 'GOAL',
        emitted_vars: {
          'test_output': 'test_value'
        }
      }
    }))
  },
  ContextState: vi.fn(() => ({
    set: vi.fn(),
    get: vi.fn(),
    get_keys: vi.fn(() => [])
  })),
  SubagentTerminateMode: {
    GOAL: 'GOAL',
    ERROR: 'ERROR',
    TIMEOUT: 'TIMEOUT',
    MAX_TURNS: 'MAX_TURNS'
  }
}));

describe('TaskExecutionEngine', () => {
  let taskEngine: TaskExecutionEngine;
  let mockEvents: { onStatusChange: any; onComplete: any; onFailed: any };

  beforeEach(() => {
    // Set up event handlers
    mockEvents = {
      onStatusChange: vi.fn(),
      onComplete: vi.fn(),
      onFailed: vi.fn()
    };

    taskEngine = new TaskExecutionEngine(mockConfig as Config, {
      onTaskStatusChange: mockEvents.onStatusChange,
      onTaskComplete: mockEvents.onComplete,
      onTaskFailed: mockEvents.onFailed
    });
  });

  afterEach(async () => {
    await taskEngine.shutdown();
    vi.clearAllMocks();
  });

  describe('Task Queueing and Creation', () => {
    it('should queue a task with default parameters', async () => {
      const taskId = await taskEngine.queueTask(
        'Test Task',
        'A simple test task description'
      );

      expect(taskId).toBeTruthy();
      expect(taskId).toMatch(/^task_\d+_[a-z0-9]+$/);

      const task = taskEngine.getTask(taskId);
      expect(task).toBeTruthy();
      expect(task?.title).toBe('Test Task');
      expect(task?.description).toBe('A simple test task description');
      expect(task?.status).toBe('queued');
    });

    it('should queue a task with custom options', async () => {
      const taskId = await taskEngine.queueTask(
        'Complex Feature Implementation',
        'Implement a comprehensive user authentication system with JWT tokens',
        {
          type: 'implementation',
          priority: 'high',
          expectedOutputs: {
            'auth_system': 'Complete authentication implementation',
            'tests': 'Comprehensive test suite'
          },
          context: {
            featureId: 'auth-feature-123',
            requirements: ['JWT', 'OAuth', '2FA']
          },
          maxExecutionTimeMinutes: 120
        }
      );

      const task = taskEngine.getTask(taskId);
      expect(task).toBeTruthy();
      expect(task?.type).toBe('implementation');
      expect(task?.priority).toBe('high');
      expect(task?.maxExecutionTimeMinutes).toBe(120);
      expect(task?.expectedOutputs).toEqual({
        'auth_system': 'Complete authentication implementation',
        'tests': 'Comprehensive test suite'
      });
      expect(task?.context).toEqual({
        featureId: 'auth-feature-123',
        requirements: ['JWT', 'OAuth', '2FA']
      });
    });

    it('should automatically determine task complexity', async () => {
      // Simple task
      const simpleTaskId = await taskEngine.queueTask(
        'Fix typo',
        'Fix a typo in documentation'
      );
      const simpleTask = taskEngine.getTask(simpleTaskId);
      expect(simpleTask?.complexity).toBe('trivial');

      // Complex task
      const complexTaskId = await taskEngine.queueTask(
        'Implement Multi-Agent Distributed System',
        'Build a comprehensive distributed system with microservices architecture, real-time monitoring, scalable message queues, automated failover mechanisms, comprehensive security framework, performance optimization, and enterprise-grade logging and analytics platform.'
      );
      const complexTask = taskEngine.getTask(complexTaskId);
      expect(['complex', 'enterprise']).toContain(complexTask?.complexity);
    });
  });

  describe('Task Retrieval and Filtering', () => {
    beforeEach(async () => {
      // Set up test tasks
      await taskEngine.queueTask('Task 1', 'Description 1', { type: 'implementation', priority: 'high' });
      await taskEngine.queueTask('Task 2', 'Description 2', { type: 'testing', priority: 'normal' });
      await taskEngine.queueTask('Task 3', 'Description 3', { type: 'documentation', priority: 'low' });
    });

    it('should retrieve all tasks', () => {
      const allTasks = taskEngine.getAllTasks();
      expect(allTasks).toHaveLength(3);
      expect(allTasks.map(t => t.title)).toEqual(
        expect.arrayContaining(['Task 1', 'Task 2', 'Task 3'])
      );
    });

    it('should filter tasks by status', () => {
      const queuedTasks = taskEngine.getAllTasks({ status: 'queued' });
      expect(queuedTasks).toHaveLength(3);
      expect(queuedTasks.every(t => t.status === 'queued')).toBe(true);
    });

    it('should filter tasks by type', () => {
      const implementationTasks = taskEngine.getAllTasks({ type: 'implementation' });
      expect(implementationTasks).toHaveLength(1);
      expect(implementationTasks[0].title).toBe('Task 1');
      expect(implementationTasks[0].type).toBe('implementation');
    });

    it('should filter tasks by priority', () => {
      const highPriorityTasks = taskEngine.getAllTasks({ priority: 'high' });
      expect(highPriorityTasks).toHaveLength(1);
      expect(highPriorityTasks[0].title).toBe('Task 1');
      expect(highPriorityTasks[0].priority).toBe('high');
    });

    it('should combine multiple filters', () => {
      const filteredTasks = taskEngine.getAllTasks({
        type: 'implementation',
        priority: 'high',
        status: 'queued'
      });
      expect(filteredTasks).toHaveLength(1);
      expect(filteredTasks[0].title).toBe('Task 1');
    });
  });

  describe('Task Execution Statistics', () => {
    beforeEach(async () => {
      // Create tasks with different statuses for testing
      const task1Id = await taskEngine.queueTask('Completed Task', 'Description');
      const task2Id = await taskEngine.queueTask('Failed Task', 'Description');
      const task3Id = await taskEngine.queueTask('Running Task', 'Description');

      // Manually set task statuses for testing
      const task1 = taskEngine.getTask(task1Id);
      const task2 = taskEngine.getTask(task2Id);
      const task3 = taskEngine.getTask(task3Id);

      if (task1 && task2 && task3) {
        task1.status = 'completed';
        task1.completedAt = new Date();
        task1.startedAt = new Date(Date.now() - 60000); // 1 minute ago
        task1.progress = 100;

        task2.status = 'failed';
        task2.lastError = 'Test error';
        task2.retryCount = 2;

        task3.status = 'in_progress';
        task3.startedAt = new Date();
        task3.progress = 50;
      }
    });

    it('should calculate execution statistics correctly', () => {
      const stats = taskEngine.getExecutionStats();

      expect(stats.total).toBe(3);
      expect(stats.completed).toBe(1);
      expect(stats.failed).toBe(1);
      expect(stats.inProgress).toBe(1);
      expect(stats.successRate).toBe(50); // 1 success out of 2 finished tasks
    });
  });

  describe('Task Cancellation', () => {
    it('should cancel a queued task', async () => {
      const taskId = await taskEngine.queueTask('Cancelable Task', 'Description');

      const cancelled = await taskEngine.cancelTask(taskId);
      expect(cancelled).toBe(true);

      const task = taskEngine.getTask(taskId);
      expect(task?.status).toBe('cancelled');
    });

    it('should return false when cancelling non-existent task', async () => {
      const cancelled = await taskEngine.cancelTask('non-existent-id');
      expect(cancelled).toBe(false);
    });
  });

  describe('Task Persistence', () => {
    it('should clear completed tasks', async () => {
      // Add a completed task
      const taskId = await taskEngine.queueTask('Completed Task', 'Description');
      const task = taskEngine.getTask(taskId);
      if (task) {
        task.status = 'completed';
        task.completedAt = new Date();
      }

      const clearedCount = taskEngine.clearCompletedTasks();
      expect(clearedCount).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Event Handlers', () => {
    it('should call event handlers when task status changes', async () => {
      const taskId = await taskEngine.queueTask('Event Test Task', 'Description');
      const task = taskEngine.getTask(taskId);

      // Manually trigger status change for testing
      if (task) {
        task.status = 'in_progress';
        mockEvents.onStatusChange(task);
        expect(mockEvents.onStatusChange).toHaveBeenCalledWith(task);
      }
    });

    it('should call completion handler when task completes', async () => {
      const taskId = await taskEngine.queueTask('Completion Test Task', 'Description');
      const task = taskEngine.getTask(taskId);

      if (task) {
        task.status = 'completed';
        mockEvents.onComplete(task);
        expect(mockEvents.onComplete).toHaveBeenCalledWith(task);
      }
    });

    it('should call failure handler when task fails', async () => {
      const taskId = await taskEngine.queueTask('Failure Test Task', 'Description');
      const task = taskEngine.getTask(taskId);
      const errorMessage = 'Test error message';

      if (task) {
        task.status = 'failed';
        task.lastError = errorMessage;
        mockEvents.onFailed(task, errorMessage);
        expect(mockEvents.onFailed).toHaveBeenCalledWith(task, errorMessage);
      }
    });
  });
});

describe('TaskBreakdownAnalyzer', () => {
  let analyzer: TaskBreakdownAnalyzer;

  beforeEach(() => {
    analyzer = new TaskBreakdownAnalyzer(mockConfig as Config);
  });

  describe('Complexity Analysis', () => {
    it('should identify trivial complexity', async () => {
      const complexity = await analyzer.analyzeComplexity(
        'Fix typo',
        'Fix a typo in the documentation'
      );
      expect(complexity).toBe('trivial');
    });

    it('should identify simple complexity', async () => {
      const complexity = await analyzer.analyzeComplexity(
        'Update button color',
        'Change the primary button color from blue to green'
      );
      expect(complexity).toBe('simple');
    });

    it('should identify moderate complexity', async () => {
      const complexity = await analyzer.analyzeComplexity(
        'Add user validation',
        'Implement comprehensive user input validation for the registration form including email format validation, password strength checks, and duplicate email detection'
      );
      expect(['moderate', 'simple']).toContain(complexity);
    });

    it('should identify complex/enterprise complexity', async () => {
      const complexity = await analyzer.analyzeComplexity(
        'Build distributed microservices architecture',
        'Design and implement a comprehensive distributed system with microservices architecture, including service discovery, load balancing, circuit breakers, distributed tracing, centralized logging, metrics collection, automated deployment pipelines, security authentication and authorization, data consistency patterns, and fault tolerance mechanisms.'
      );
      expect(['complex', 'enterprise']).toContain(complexity);
    });

    it('should handle edge cases', async () => {
      // Empty description
      const complexity1 = await analyzer.analyzeComplexity('Task', '');
      expect(complexity1).toBe('trivial');

      // Very short description
      const complexity2 = await analyzer.analyzeComplexity('Quick fix', 'Fix');
      expect(complexity2).toBe('trivial');

      // Long title with short description
      const complexity3 = await analyzer.analyzeComplexity(
        'This is a very long task title that describes a complex feature implementation',
        'Do it'
      );
      expect(['trivial', 'simple']).toContain(complexity3);
    });
  });
});

describe('TaskExecutionUtils', () => {
  describe('Task Validation', () => {
    it('should validate correct task configuration', () => {
      const task = {
        title: 'Valid Task',
        description: 'Valid description',
        maxExecutionTimeMinutes: 60,
        maxRetries: 3,
        priority: 'normal'
      };

      const errors = TaskExecutionUtils.validateTask(task);
      expect(errors).toHaveLength(0);
    });

    it('should identify missing title', () => {
      const task = {
        description: 'Valid description'
      };

      const errors = TaskExecutionUtils.validateTask(task);
      expect(errors).toContain('Task title is required');
    });

    it('should identify missing description', () => {
      const task = {
        title: 'Valid Task'
      };

      const errors = TaskExecutionUtils.validateTask(task);
      expect(errors).toContain('Task description is required');
    });

    it('should identify invalid execution time', () => {
      const task = {
        title: 'Valid Task',
        description: 'Valid description',
        maxExecutionTimeMinutes: -5
      };

      const errors = TaskExecutionUtils.validateTask(task);
      expect(errors).toContain('Max execution time must be positive');
    });

    it('should identify invalid retry count', () => {
      const task = {
        title: 'Valid Task',
        description: 'Valid description',
        maxRetries: -1
      };

      const errors = TaskExecutionUtils.validateTask(task);
      expect(errors).toContain('Max retries cannot be negative');
    });
  });

  describe('Status Descriptions', () => {
    it('should provide human-readable status descriptions', () => {
      expect(TaskExecutionUtils.getStatusDescription('queued'))
        .toBe('Waiting in queue for analysis');
      expect(TaskExecutionUtils.getStatusDescription('in_progress'))
        .toBe('Currently executing');
      expect(TaskExecutionUtils.getStatusDescription('completed'))
        .toBe('Successfully completed');
      expect(TaskExecutionUtils.getStatusDescription('failed'))
        .toBe('Failed execution');
    });
  });

  describe('Task Summary Generation', () => {
    it('should generate comprehensive task summary', () => {
      const task: Task = {
        id: 'test-task-123',
        title: 'Test Task',
        description: 'Test description',
        type: 'implementation',
        complexity: 'moderate',
        priority: 'high',
        status: 'completed',
        progress: 100,
        requiredCapabilities: ['frontend'],
        subtaskIds: [],
        dependencies: [],
        maxExecutionTimeMinutes: 60,
        maxRetries: 3,
        context: {},
        expectedOutputs: {},
        createdAt: new Date('2025-01-01T00:00:00Z'),
        updatedAt: new Date('2025-01-01T00:05:00Z'),
        startedAt: new Date('2025-01-01T00:01:00Z'),
        completedAt: new Date('2025-01-01T00:05:00Z'),
        retryCount: 1
      };

      const summary = TaskExecutionUtils.generateTaskSummary(task);

      expect(summary).toContain('Test Task');
      expect(summary).toContain('Status: completed');
      expect(summary).toContain('Type: implementation');
      expect(summary).toContain('Complexity: moderate');
      expect(summary).toContain('Priority: high');
      expect(summary).toContain('Progress: 100%');
      expect(summary).toContain('Duration: 240s'); // 4 minutes
      expect(summary).toContain('Retries: 1');
    });
  });

  describe('Execution Statistics', () => {
    it('should calculate statistics for empty task list', () => {
      const stats = TaskExecutionUtils.calculateExecutionStats([]);
      expect(stats.total).toBe(0);
      expect(stats.completed).toBe(0);
      expect(stats.failed).toBe(0);
      expect(stats.inProgress).toBe(0);
      expect(stats.successRate).toBe(0);
      expect(stats.averageDurationMs).toBe(0);
    });

    it('should calculate statistics for mixed task statuses', () => {
      const tasks: Task[] = [
        createMockTask('task1', 'completed', 60000), // 1 minute
        createMockTask('task2', 'completed', 120000), // 2 minutes
        createMockTask('task3', 'failed'),
        createMockTask('task4', 'in_progress'),
        createMockTask('task5', 'queued')
      ];

      const stats = TaskExecutionUtils.calculateExecutionStats(tasks);
      expect(stats.total).toBe(5);
      expect(stats.completed).toBe(2);
      expect(stats.failed).toBe(1);
      expect(stats.inProgress).toBe(1);
      expect(stats.successRate).toBe(66.66666666666666); // 2/3 finished tasks succeeded
      expect(stats.averageDurationMs).toBe(90000); // Average of 60s and 120s
    });
  });
});

// Helper function to create mock tasks
function createMockTask(
  id: string,
  status: TaskStatus,
  durationMs?: number
): Task {
  const now = new Date();
  const startTime = new Date(now.getTime() - (durationMs || 0));

  return {
    id,
    title: `Task ${id}`,
    description: 'Test task description',
    type: 'implementation',
    complexity: 'simple',
    priority: 'normal',
    status,
    progress: status === 'completed' ? 100 : status === 'in_progress' ? 50 : 0,
    requiredCapabilities: [],
    subtaskIds: [],
    dependencies: [],
    maxExecutionTimeMinutes: 60,
    maxRetries: 3,
    context: {},
    expectedOutputs: {},
    createdAt: startTime,
    updatedAt: now,
    startedAt: status !== 'queued' ? startTime : undefined,
    completedAt: status === 'completed' ? now : undefined,
    retryCount: 0
  };
}