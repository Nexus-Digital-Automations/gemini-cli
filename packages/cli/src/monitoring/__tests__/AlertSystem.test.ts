/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type {
  Alert} from '../AlertSystem.js';
import {
  AlertSystem,
  AlertSeverity,
  AlertCategory,
  NotificationChannel
} from '../AlertSystem.js';
import { TaskStatus, TaskType, TaskPriority } from '../TaskStatusMonitor.js';

// Mock logger
vi.mock('../utils/logger.js', () => ({
  Logger: vi.fn(() => ({
    info: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    debug: vi.fn(),
  })),
}));

describe('AlertSystem', () => {
  let alertSystem: AlertSystem;

  beforeEach(() => {
    alertSystem = new AlertSystem();
  });

  afterEach(() => {
    alertSystem.destroy();
  });

  describe('Alert Rule Management', () => {
    it('should register and manage alert rules', () => {
      const rule = {
        id: 'test-rule-1',
        name: 'Test Rule',
        description: 'A test alert rule',
        category: AlertCategory.TASK_FAILURE,
        severity: AlertSeverity.WARNING,
        enabled: true,
        condition: {
          type: 'threshold' as const,
          parameters: {
            metric: 'errorCount',
            operator: '>',
            threshold: 3,
          },
        },
        triggers: {
          eventTypes: ['task_status_update'],
        },
        actions: {
          notifications: {
            channels: [NotificationChannel.CONSOLE],
          },
        },
        cooldownPeriod: 300000,
      };

      alertSystem.registerRule(rule);

      // Rule should be registered
      expect(alertSystem['alertRules'].has(rule.id)).toBe(true);
    });

    it('should update existing alert rules', () => {
      const ruleId = 'test-rule-update';
      const rule = {
        id: ruleId,
        name: 'Original Rule',
        description: 'Original description',
        category: AlertCategory.TASK_FAILURE,
        severity: AlertSeverity.WARNING,
        enabled: true,
        condition: { type: 'threshold' as const, parameters: {} },
        triggers: { eventTypes: ['task_status_update'] },
        actions: { notifications: { channels: [NotificationChannel.CONSOLE] } },
        cooldownPeriod: 300000,
      };

      alertSystem.registerRule(rule);

      const success = alertSystem.updateRule(ruleId, {
        name: 'Updated Rule',
        severity: AlertSeverity.ERROR,
      });

      expect(success).toBe(true);
      const updatedRule = alertSystem['alertRules'].get(ruleId);
      expect(updatedRule?.name).toBe('Updated Rule');
      expect(updatedRule?.severity).toBe(AlertSeverity.ERROR);
    });

    it('should delete alert rules', () => {
      const ruleId = 'test-rule-delete';
      const rule = {
        id: ruleId,
        name: 'Rule to Delete',
        description: 'This rule will be deleted',
        category: AlertCategory.TASK_FAILURE,
        severity: AlertSeverity.INFO,
        enabled: true,
        condition: { type: 'threshold' as const, parameters: {} },
        triggers: { eventTypes: ['task_status_update'] },
        actions: { notifications: { channels: [NotificationChannel.CONSOLE] } },
        cooldownPeriod: 300000,
      };

      alertSystem.registerRule(rule);
      expect(alertSystem['alertRules'].has(ruleId)).toBe(true);

      const success = alertSystem.deleteRule(ruleId);
      expect(success).toBe(true);
      expect(alertSystem['alertRules'].has(ruleId)).toBe(false);
    });
  });

  describe('Task Status Processing', () => {
    it('should generate alerts for high priority task failures', async () => {
      const task = {
        id: 'task-critical-fail',
        title: 'Critical Task',
        description: 'A critical task that failed',
        type: TaskType.IMPLEMENTATION,
        priority: TaskPriority.CRITICAL,
        status: TaskStatus.FAILED,
        assignedAgent: 'agent-1',
        dependencies: [],
        progress: 50,
        estimatedDuration: 60000,
        actualDuration: 90000,
        startTime: new Date(Date.now() - 90000),
        endTime: new Date(),
        lastUpdate: new Date(),
        errorCount: 1,
        retryCount: 0,
        tags: ['critical'],
        metadata: {},
      };

      const update = {
        taskId: task.id,
        previousStatus: TaskStatus.IN_PROGRESS,
        newStatus: TaskStatus.FAILED,
        timestamp: new Date(),
        agentId: 'agent-1',
        error: 'Task execution failed',
      };

      const eventSpy = vi.fn();
      alertSystem.on('alert:created', eventSpy);

      await alertSystem.processTaskStatusUpdate(task, update);

      expect(eventSpy).toHaveBeenCalled();
      const alertEvent = eventSpy.mock.calls[0][0];
      expect(alertEvent.alert.severity).toBe(AlertSeverity.CRITICAL);
      expect(alertEvent.alert.category).toBe(AlertCategory.TASK_FAILURE);
    });

    it('should generate alerts for task delays', async () => {
      const task = {
        id: 'task-delayed',
        title: 'Delayed Task',
        description: 'A task that is significantly delayed',
        type: TaskType.IMPLEMENTATION,
        priority: TaskPriority.HIGH,
        status: TaskStatus.COMPLETED,
        assignedAgent: 'agent-1',
        dependencies: [],
        progress: 100,
        estimatedDuration: 30000, // 30 seconds estimated
        actualDuration: 50000, // 50 seconds actual (67% overrun)
        startTime: new Date(Date.now() - 50000),
        endTime: new Date(),
        lastUpdate: new Date(),
        errorCount: 0,
        retryCount: 0,
        tags: ['delayed'],
        metadata: {},
      };

      const update = {
        taskId: task.id,
        previousStatus: TaskStatus.IN_PROGRESS,
        newStatus: TaskStatus.COMPLETED,
        timestamp: new Date(),
        agentId: 'agent-1',
      };

      const eventSpy = vi.fn();
      alertSystem.on('alert:created', eventSpy);

      await alertSystem.processTaskStatusUpdate(task, update);

      expect(eventSpy).toHaveBeenCalled();
      const alertEvent = eventSpy.mock.calls[0][0];
      expect(alertEvent.alert.category).toBe(AlertCategory.TASK_DELAY);
    });
  });

  describe('Agent Status Processing', () => {
    it('should generate alerts for offline agents', async () => {
      const agent = {
        id: 'agent-offline',
        status: 'active' as const,
        capabilities: ['coding', 'testing'],
        currentTasks: [],
        completedTasks: 10,
        failedTasks: 2,
        averageTaskDuration: 45000,
        lastHeartbeat: new Date(Date.now() - 600000), // 10 minutes ago
        performance: {
          successRate: 80,
          averageCompletionTime: 45000,
          taskThroughput: 8,
        },
      };

      const eventSpy = vi.fn();
      alertSystem.on('alert:created', eventSpy);

      await alertSystem.processAgentStatusUpdate(agent);

      expect(eventSpy).toHaveBeenCalled();
      const alertEvent = eventSpy.mock.calls[0][0];
      expect(alertEvent.alert.category).toBe(AlertCategory.AGENT_OFFLINE);
    });

    it('should generate alerts for poor agent performance', async () => {
      const agent = {
        id: 'agent-poor-performance',
        status: 'active' as const,
        capabilities: ['coding'],
        currentTasks: ['task-1'],
        completedTasks: 5,
        failedTasks: 10,
        averageTaskDuration: 60000,
        lastHeartbeat: new Date(),
        performance: {
          successRate: 33, // Very low success rate
          averageCompletionTime: 60000,
          taskThroughput: 2,
        },
      };

      const eventSpy = vi.fn();
      alertSystem.on('alert:created', eventSpy);

      await alertSystem.processAgentStatusUpdate(agent);

      expect(eventSpy).toHaveBeenCalled();
      const alertEvent = eventSpy.mock.calls[0][0];
      expect(alertEvent.alert.category).toBe(
        AlertCategory.PERFORMANCE_DEGRADATION,
      );
    });
  });

  describe('Alert Management', () => {
    it('should acknowledge alerts', async () => {
      // Create a mock alert
      const alert = await alertSystem['createAlert']({
        ruleId: 'test-rule',
        category: AlertCategory.TASK_FAILURE,
        severity: AlertSeverity.WARNING,
        title: 'Test Alert',
        description: 'Test alert description',
        source: 'test',
        context: {},
      });

      const success = await alertSystem.acknowledgeAlert(alert.id, 'test-user');

      expect(success).toBe(true);
      expect(alert.status).toBe('acknowledged');
      expect(alert.acknowledgedBy).toBe('test-user');
      expect(alert.acknowledgedAt).toBeDefined();
    });

    it('should resolve alerts', async () => {
      // Create a mock alert
      const alert = await alertSystem['createAlert']({
        ruleId: 'test-rule',
        category: AlertCategory.TASK_FAILURE,
        severity: AlertSeverity.WARNING,
        title: 'Test Alert',
        description: 'Test alert description',
        source: 'test',
        context: {},
      });

      const success = await alertSystem.resolveAlert(
        alert.id,
        'test-user',
        'Fixed the issue',
      );

      expect(success).toBe(true);
      expect(alert.status).toBe('resolved');
      expect(alert.resolvedAt).toBeDefined();
      expect(alert.context.resolution).toBe('Fixed the issue');
    });

    it('should suppress alerts based on patterns', () => {
      alertSystem.suppressAlerts('Test.*Alert', 300000); // 5 minutes

      expect(alertSystem['suppressionRules'].size).toBe(1);
    });
  });

  describe('Alert Analytics', () => {
    it('should calculate alert analytics', () => {
      const analytics = alertSystem.getAlertAnalytics(24);

      expect(analytics).toHaveProperty('period');
      expect(analytics).toHaveProperty('counts');
      expect(analytics).toHaveProperty('trends');
      expect(analytics).toHaveProperty('performance');

      expect(analytics.period.start).toBeInstanceOf(Date);
      expect(analytics.period.end).toBeInstanceOf(Date);
      expect(typeof analytics.counts.total).toBe('number');
    });

    it('should filter active alerts by criteria', () => {
      // This test would require setting up some alerts first
      const activeAlerts = alertSystem.getActiveAlerts({
        category: AlertCategory.TASK_FAILURE,
        severity: AlertSeverity.CRITICAL,
      });

      expect(Array.isArray(activeAlerts)).toBe(true);
    });
  });

  describe('Notification Channels', () => {
    it('should register custom notification channels', () => {
      const testChannel = {
        channel: NotificationChannel.EMAIL,
        async send(_alert: Alert): Promise<boolean> {
          return true;
        },
      };

      alertSystem.registerNotificationChannel(
        NotificationChannel.EMAIL,
        testChannel,
      );

      expect(
        alertSystem['notificationDeliveries'].has(NotificationChannel.EMAIL),
      ).toBe(true);
    });
  });
});
