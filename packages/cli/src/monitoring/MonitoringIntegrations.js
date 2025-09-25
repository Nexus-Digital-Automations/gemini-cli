/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { EventEmitter } from 'node:events';
import { Logger } from '../utils/logger.js';
import {
  TaskStatusMonitor as _TaskStatusMonitor,
  TaskStatus,
  taskStatusMonitor,
} from './TaskStatusMonitor.js';
import {
  StatusUpdateBroker as _StatusUpdateBroker,
  StatusEventType,
  statusUpdateBroker,
} from './StatusUpdateBroker.js';
import {
  NotificationSystem as _NotificationSystem,
  NotificationPreferences as _NotificationPreferences,
  notificationSystem as _notificationSystem,
} from './NotificationSystem.js';
import {
  StatusHistoryAnalytics as _StatusHistoryAnalytics,
  statusHistoryAnalytics as _statusHistoryAnalytics,
} from './StatusHistoryAnalytics.js';
/**
 * Monitoring Integrations System
 *
 * Comprehensive integration layer providing:
 * - TodoWrite synchronization and bidirectional updates
 * - External system integrations (webhooks, APIs, databases)
 * - Cross-platform status propagation
 * - Third-party monitoring tool integration
 * - Data export and synchronization capabilities
 */
export class MonitoringIntegrations extends EventEmitter {
  logger;
  todoWriteState;
  externalSystems;
  integrationStats;
  constructor() {
    super();
    this.logger = new Logger('MonitoringIntegrations');
    this.todoWriteState = {
      tasks: [],
      totalTasks: 0,
      completedTasks: 0,
      inProgressTasks: 0,
      pendingTasks: 0,
      lastUpdate: new Date(),
    };
    this.externalSystems = new Map();
    this.integrationStats = {
      totalSyncOperations: 0,
      successfulSyncs: 0,
      failedSyncs: 0,
      lastSyncTime: new Date(),
      webhookDeliveries: 0,
      apiCalls: 0,
    };
    this.setupIntegrationListeners();
    this.logger.info('MonitoringIntegrations initialized');
  }
  /**
   * Register external system for integration
   */
  registerExternalSystem(config) {
    this.externalSystems.set(config.name, config);
    // Subscribe to filtered events for this system
    statusUpdateBroker.subscribe({
      subscriberId: `external_${config.name}`,
      eventTypes:
        config.filterConfig?.eventTypes || Object.values(StatusEventType),
      filters: {
        priorityThreshold: config.filterConfig?.priorityThreshold || 'low',
        agentIds: config.filterConfig?.agentIds,
      },
      deliveryMethod: 'webhook',
      webhookUrl: config.endpoint,
    });
    this.emit('system:registered', { config });
    this.logger.info('External system registered', {
      name: config.name,
      type: config.type,
      endpoint: config.endpoint,
    });
  }
  /**
   * Unregister external system
   */
  unregisterExternalSystem(systemName) {
    const config = this.externalSystems.get(systemName);
    if (!config) {
      this.logger.warning('Attempt to unregister unknown system', {
        systemName,
      });
      return;
    }
    this.externalSystems.delete(systemName);
    statusUpdateBroker.unsubscribe(`external_${systemName}`);
    this.emit('system:unregistered', { systemName, config });
    this.logger.info('External system unregistered', { systemName });
  }
  /**
   * Sync TodoWrite state with task monitoring system
   */
  async syncTodoWriteState(todoWriteTasks) {
    const startTime = Date.now();
    this.integrationStats.totalSyncOperations++;
    try {
      // Update internal TodoWrite state
      this.todoWriteState = {
        tasks: todoWriteTasks,
        totalTasks: todoWriteTasks.length,
        completedTasks: todoWriteTasks.filter((t) => t.status === 'completed')
          .length,
        inProgressTasks: todoWriteTasks.filter(
          (t) => t.status === 'in_progress',
        ).length,
        pendingTasks: todoWriteTasks.filter((t) => t.status === 'pending')
          .length,
        lastUpdate: new Date(),
      };
      // Sync with task monitoring system
      for (const todoTask of todoWriteTasks) {
        await this.syncTaskWithMonitor(todoTask);
      }
      // Publish sync completion event
      await statusUpdateBroker.publishEvent(
        StatusEventType.SYSTEM_ALERT,
        {
          type: 'todowrite_sync',
          message: `TodoWrite sync completed: ${todoWriteTasks.length} tasks processed`,
          stats: this.todoWriteState,
        },
        {
          source: 'monitoring_integrations',
          priority: 'normal',
          tags: ['sync', 'todowrite'],
        },
      );
      this.integrationStats.successfulSyncs++;
      this.integrationStats.lastSyncTime = new Date();
      this.emit('todowrite:synced', { state: this.todoWriteState });
      const syncDuration = Date.now() - startTime;
      this.logger.info('TodoWrite sync completed', {
        taskCount: todoWriteTasks.length,
        duration: syncDuration,
      });
    } catch (error) {
      this.integrationStats.failedSyncs++;
      this.logger.error('TodoWrite sync failed', { error });
      throw error;
    }
  }
  /**
   * Export monitoring data for external analysis
   */
  async exportMonitoringData(format = 'json', _timeframe) {
    const exportData = {
      timestamp: new Date().toISOString(),
      system: {
        systemId: 'gemini-cli-monitoring',
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
      },
      tasks: taskStatusMonitor.getAllTasks(),
      agents: taskStatusMonitor.getAllAgents(),
      todoWriteState: this.todoWriteState,
      integrationStats: this.integrationStats,
      performanceMetrics: taskStatusMonitor.getPerformanceMetrics(),
    };
    switch (format) {
      case 'json':
        return JSON.stringify(exportData, null, 2);
      case 'csv':
        return this.convertToCSV(exportData);
      case 'prometheus':
        return this.convertToPrometheusFormat(exportData);
      case 'influxdb':
        return this.convertToInfluxDBFormat(exportData);
      default:
        return JSON.stringify(exportData, null, 2);
    }
  }
  /**
   * Create webhook payload for external system
   */
  createWebhookPayload(eventId, eventType, data, correlationData) {
    return {
      eventId,
      eventType,
      timestamp: new Date(),
      source: 'gemini-cli-monitoring',
      data,
      system: {
        systemId: 'gemini-cli-monitoring',
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
      },
      correlation: {
        sessionId: correlationData?.sessionId,
        agentId: correlationData?.agentId,
        taskId: correlationData?.taskId,
      },
    };
  }
  /**
   * Send data to external system
   */
  async sendToExternalSystem(systemName, payload) {
    const config = this.externalSystems.get(systemName);
    if (!config) {
      throw new Error(`External system '${systemName}' not found`);
    }
    switch (config.type) {
      case 'webhook':
        await this.sendWebhook(config, payload);
        break;
      case 'api':
        await this.sendApiRequest(config, payload);
        break;
      case 'database':
        await this.sendToDatabase(config, payload);
        break;
      case 'message_queue':
        await this.sendToMessageQueue(config, payload);
        break;
      case 'file_system':
        await this.writeToFileSystem(config, payload);
        break;
      default:
        throw new Error(`Unsupported system type: ${config.type}`);
    }
    this.integrationStats.apiCalls++;
  }
  /**
   * Get TodoWrite state
   */
  getTodoWriteState() {
    return { ...this.todoWriteState };
  }
  /**
   * Get integration statistics
   */
  getIntegrationStats() {
    const systemTypes = {};
    for (const config of this.externalSystems.values()) {
      systemTypes[config.type] = (systemTypes[config.type] || 0) + 1;
    }
    return {
      ...this.integrationStats,
      registeredSystems: this.externalSystems.size,
      systemTypes,
    };
  }
  /**
   * Test external system connection
   */
  async testExternalSystem(systemName) {
    const startTime = Date.now();
    const config = this.externalSystems.get(systemName);
    if (!config) {
      return {
        success: false,
        responseTime: Date.now() - startTime,
        error: `System '${systemName}' not found`,
      };
    }
    try {
      const testPayload = this.createWebhookPayload(
        'test_' + Date.now(),
        StatusEventType.SYSTEM_ALERT,
        {
          type: 'connection_test',
          message: 'Testing external system connection',
        },
      );
      await this.sendToExternalSystem(systemName, testPayload);
      return {
        success: true,
        responseTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
  // Private methods
  setupIntegrationListeners() {
    // Listen to all status events for external system propagation
    statusUpdateBroker.on('event:published', async (data) => {
      const { event } = data;
      // Create webhook payload
      const payload = this.createWebhookPayload(
        event.id,
        event.type,
        event.data,
        {
          sessionId: event.data.sessionId,
          agentId: event.data.agentId,
          taskId: event.data.taskId,
        },
      );
      // Send to all relevant external systems
      for (const [systemName, config] of this.externalSystems) {
        if (this.shouldSendToSystem(config, event)) {
          try {
            await this.sendToExternalSystem(systemName, payload);
          } catch (error) {
            this.logger.error('Failed to send to external system', {
              systemName,
              error,
            });
          }
        }
      }
    });
    // Listen to webhook delivery events
    statusUpdateBroker.on(/^webhook:/, async (data) => {
      const { events, config } = data;
      const systemName = config.subscriberId.replace('external_', '');
      for (const event of events) {
        const payload = this.createWebhookPayload(
          event.id,
          event.type,
          event.data,
        );
        try {
          await this.sendToExternalSystem(systemName, payload);
          this.integrationStats.webhookDeliveries++;
        } catch (error) {
          this.logger.error('Webhook delivery failed', {
            systemName,
            eventId: event.id,
            error,
          });
        }
      }
    });
    // Listen to task monitor events for TodoWrite integration
    taskStatusMonitor.on('task:status-changed', async (data) => {
      await this.updateTodoWriteFromTask(data.task, data.update);
    });
  }
  async syncTaskWithMonitor(todoTask) {
    if (!todoTask.id) return;
    const existingTask = taskStatusMonitor.getTaskStatus(todoTask.id);
    if (existingTask) {
      // Update existing task status based on TodoWrite state
      const newStatus = this.mapTodoWriteStatusToTaskStatus(todoTask.status);
      if (existingTask.status !== newStatus) {
        await taskStatusMonitor.updateTaskStatus(todoTask.id, newStatus, {
          message: `Status updated from TodoWrite: ${todoTask.status}`,
          context: { source: 'todowrite_sync' },
        });
      }
    } else if (todoTask.status !== 'completed') {
      // Register new task from TodoWrite
      await taskStatusMonitor.registerTask({
        title: todoTask.content,
        description: todoTask.activeForm || todoTask.content,
        type: 'implementation', // Default type
        priority: todoTask.priority || 'normal',
        assignedAgent: todoTask.assignedAgent,
        dependencies: todoTask.dependencies || [],
        tags: todoTask.tags || ['todowrite'],
        metadata: {
          source: 'todowrite',
          originalId: todoTask.id,
          ...todoTask.metadata,
        },
      });
    }
  }
  async updateTodoWriteFromTask(task, update) {
    // Only update if task originated from TodoWrite
    if (task.metadata?.source !== 'todowrite') return;
    const todoWriteId = task.metadata.originalId;
    if (!todoWriteId) return;
    // Find and update corresponding TodoWrite task
    const todoTask = this.todoWriteState.tasks.find(
      (t) => t.id === todoWriteId,
    );
    if (todoTask) {
      todoTask.status = this.mapTaskStatusToTodoWriteStatus(task.status);
      todoTask.activeForm = this.generateActiveForm(task.status, task.title);
      // Emit update event for external TodoWrite systems to consume
      this.emit('todowrite:task-updated', { todoTask, task, update });
    }
  }
  mapTodoWriteStatusToTaskStatus(todoStatus) {
    switch (todoStatus) {
      case 'pending':
        return TaskStatus.QUEUED;
      case 'in_progress':
        return TaskStatus.IN_PROGRESS;
      case 'completed':
        return TaskStatus.COMPLETED;
      default:
        return TaskStatus.QUEUED;
    }
  }
  mapTaskStatusToTodoWriteStatus(taskStatus) {
    switch (taskStatus) {
      case TaskStatus.QUEUED:
      case TaskStatus.ASSIGNED:
        return 'pending';
      case TaskStatus.IN_PROGRESS:
      case TaskStatus.BLOCKED:
        return 'in_progress';
      case TaskStatus.COMPLETED:
        return 'completed';
      case TaskStatus.FAILED:
      case TaskStatus.CANCELLED:
        return 'pending'; // Reset to pending for retry
      default:
        return 'pending';
    }
  }
  generateActiveForm(status, title) {
    const action =
      status === TaskStatus.IN_PROGRESS
        ? 'Working on'
        : status === TaskStatus.COMPLETED
          ? 'Completed'
          : status === TaskStatus.FAILED
            ? 'Failed'
            : 'Queued';
    return `${action} ${title}`;
  }
  shouldSendToSystem(config, event) {
    // Check event type filter
    if (
      config.filterConfig?.eventTypes &&
      !config.filterConfig.eventTypes.includes(event.type)
    ) {
      return false;
    }
    // Check priority threshold
    if (config.filterConfig?.priorityThreshold) {
      const priorityLevels = ['low', 'normal', 'high', 'critical'];
      const requiredLevel = priorityLevels.indexOf(
        config.filterConfig.priorityThreshold,
      );
      const eventLevel = priorityLevels.indexOf(event.priority);
      if (eventLevel < requiredLevel) {
        return false;
      }
    }
    // Check agent ID filter
    if (
      config.filterConfig?.agentIds &&
      event.data.agentId &&
      !config.filterConfig.agentIds.includes(event.data.agentId)
    ) {
      return false;
    }
    return true;
  }
  async sendWebhook(config, payload) {
    if (!config.endpoint) {
      throw new Error('Webhook endpoint not configured');
    }
    const response = await fetch(config.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.buildHeaders(config),
      },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      throw new Error(
        `Webhook failed: ${response.status} ${response.statusText}`,
      );
    }
  }
  async sendApiRequest(config, payload) {
    // Similar to webhook but might have different endpoint patterns
    await this.sendWebhook(config, payload);
  }
  async sendToDatabase(config, payload) {
    // Database integration would be implemented here
    // For now, we'll emit an event that external database handlers can consume
    this.emit('database:write', { config, payload });
  }
  async sendToMessageQueue(config, payload) {
    // Message queue integration would be implemented here
    // For now, we'll emit an event that external queue handlers can consume
    this.emit('messagequeue:publish', { config, payload });
  }
  async writeToFileSystem(config, payload) {
    // File system integration would be implemented here
    // For now, we'll emit an event that external file handlers can consume
    this.emit('filesystem:write', { config, payload });
  }
  buildHeaders(config) {
    const headers = { ...config.headers };
    if (config.authentication) {
      switch (config.authentication.type) {
        case 'bearer':
          headers.Authorization = `Bearer ${config.authentication.credentials.token}`;
          break;
        case 'basic': {
          const encoded = Buffer.from(
            `${config.authentication.credentials.username}:${config.authentication.credentials.password}`,
          ).toString('base64');
          headers.Authorization = `Basic ${encoded}`;
          break;
        }
        case 'api_key':
          headers['X-API-Key'] = config.authentication.credentials.apiKey;
          break;
        default:
          // No authentication headers needed for other types
          break;
      }
    } else if (config.apiKey) {
      headers['X-API-Key'] = config.apiKey;
    }
    return headers;
  }
  convertToCSV(data) {
    // Simple CSV conversion for tasks
    const tasks = data.tasks || [];
    if (tasks.length === 0) return 'No tasks available';
    const headers = [
      'id',
      'title',
      'status',
      'type',
      'priority',
      'assignedAgent',
      'progress',
      'lastUpdate',
    ];
    const rows = tasks.map((task) => [
      task.id,
      task.title.replace(/,/g, ';'),
      task.status,
      task.type,
      task.priority,
      task.assignedAgent || '',
      task.progress,
      task.lastUpdate.toISOString(),
    ]);
    return [headers, ...rows].map((row) => row.join(',')).join('\n');
  }
  convertToPrometheusFormat(data) {
    const timestamp = Date.now();
    const metrics = data.performanceMetrics || {};
    return [
      `# HELP gemini_tasks_total Total number of tasks`,
      `# TYPE gemini_tasks_total counter`,
      `gemini_tasks_total ${metrics.totalTasks || 0} ${timestamp}`,
      '',
      `# HELP gemini_tasks_completed Total completed tasks`,
      `# TYPE gemini_tasks_completed counter`,
      `gemini_tasks_completed ${metrics.completedTasks || 0} ${timestamp}`,
      '',
      `# HELP gemini_agents_active Number of active agents`,
      `# TYPE gemini_agents_active gauge`,
      `gemini_agents_active ${data.agents?.filter((a) => a.status === 'active').length || 0} ${timestamp}`,
    ].join('\n');
  }
  convertToInfluxDBFormat(data) {
    const timestamp = Date.now() * 1000000; // InfluxDB uses nanoseconds
    return [
      `gemini_tasks,environment=${data.system.environment} total=${data.performanceMetrics.totalTasks || 0},completed=${data.performanceMetrics.completedTasks || 0} ${timestamp}`,
      `gemini_agents,environment=${data.system.environment} active=${data.agents?.filter((a) => a.status === 'active').length || 0} ${timestamp}`,
    ].join('\n');
  }
  /**
   * Cleanup resources
   */
  destroy() {
    this.removeAllListeners();
    this.externalSystems.clear();
    this.logger.info('MonitoringIntegrations destroyed');
  }
}
/**
 * Singleton instance for global access
 */
export const monitoringIntegrations = new MonitoringIntegrations();
//# sourceMappingURL=MonitoringIntegrations.js.map
