/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { EventEmitter } from 'node:events';
import { Logger } from '../utils/logger.js';
import type { StatusEvent, NotificationConfig } from './StatusUpdateBroker.js';
import { statusUpdateBroker, StatusEventType } from './StatusUpdateBroker.js';
import {
  taskStatusMonitor,
  TaskMetadata,
  TaskStatus,
  AgentStatus,
} from './TaskStatusMonitor.js';

export interface NotificationPreferences {
  userId: string;
  realTimeNotifications: boolean;
  emailNotifications: boolean;
  slackNotifications: boolean;
  webhookNotifications: boolean;
  quietHours?: {
    start: string; // HH:mm format
    end: string; // HH:mm format
    timezone: string;
  };
  priorityThreshold: 'low' | 'normal' | 'high' | 'critical';
  eventFilters: {
    taskTypes?: string[];
    agentIds?: string[];
    keywords?: string[];
  };
}

export interface NotificationTemplate {
  id: string;
  eventType: StatusEventType;
  subject: string;
  message: string;
  format: 'text' | 'html' | 'markdown';
  variables: string[];
}

export interface DeliveredNotification {
  id: string;
  userId: string;
  eventId: string;
  eventType: StatusEventType;
  subject: string;
  message: string;
  deliveryMethod: 'realtime' | 'email' | 'slack' | 'webhook';
  deliveredAt: Date;
  acknowledged?: Date;
  actionTaken?: string;
}

/**
 * Real-time Notification System
 *
 * Advanced notification management with:
 * - Multi-channel delivery (real-time, email, Slack, webhooks)
 * - Template-based message formatting
 * - User preference management
 * - Delivery tracking and acknowledgment
 * - Smart batching and quiet hours
 * - Rich formatting and variable substitution
 */
export class NotificationSystem extends EventEmitter {
  private readonly logger: Logger;
  private userPreferences: Map<string, NotificationPreferences>;
  private templates: Map<string, NotificationTemplate>;
  private deliveredNotifications: Map<string, DeliveredNotification>;
  private pendingBatches: Map<string, StatusEvent[]>;
  private batchTimers: Map<string, NodeJS.Timeout>;
  private deliveryMetrics: {
    totalNotifications: number;
    deliveredNotifications: number;
    failedDeliveries: number;
    averageDeliveryTime: number;
    deliveryByChannel: Record<string, number>;
  };

  constructor() {
    super();
    this.logger = new Logger('NotificationSystem');
    this.userPreferences = new Map();
    this.templates = new Map();
    this.deliveredNotifications = new Map();
    this.pendingBatches = new Map();
    this.batchTimers = new Map();

    this.deliveryMetrics = {
      totalNotifications: 0,
      deliveredNotifications: 0,
      failedDeliveries: 0,
      averageDeliveryTime: 0,
      deliveryByChannel: {},
    };

    this.setupDefaultTemplates();
    this.subscribeToStatusUpdates();

    this.logger.info('NotificationSystem initialized');
  }

  /**
   * Register user notification preferences
   */
  registerUserPreferences(preferences: NotificationPreferences): void {
    this.userPreferences.set(preferences.userId, preferences);

    // Subscribe to status broker with user's preferences
    const config: NotificationConfig = {
      subscriberId: `user_${preferences.userId}`,
      eventTypes: this.getRelevantEventTypes(preferences),
      filters: {
        priorityThreshold: preferences.priorityThreshold,
        agentIds: preferences.eventFilters.agentIds,
        tags: preferences.eventFilters.keywords,
      },
      deliveryMethod: preferences.realTimeNotifications
        ? 'realtime'
        : 'batched',
      batchInterval: 300000, // 5 minutes
    };

    statusUpdateBroker.subscribe(config);

    this.emit('user:preferences-registered', {
      userId: preferences.userId,
      preferences,
    });

    this.logger.info('User preferences registered', {
      userId: preferences.userId,
      realTime: preferences.realTimeNotifications,
    });
  }

  /**
   * Update user notification preferences
   */
  updateUserPreferences(
    userId: string,
    updates: Partial<NotificationPreferences>,
  ): void {
    const existing = this.userPreferences.get(userId);
    if (!existing) {
      this.logger.warning('Attempt to update preferences for unknown user', {
        userId,
      });
      return;
    }

    const updated = { ...existing, ...updates };
    this.userPreferences.set(userId, updated);

    // Resubscribe with updated preferences
    statusUpdateBroker.unsubscribe(`user_${userId}`);
    this.registerUserPreferences(updated);

    this.emit('user:preferences-updated', { userId, updates });

    this.logger.info('User preferences updated', { userId, updates });
  }

  /**
   * Send immediate notification to specific user
   */
  async sendImmediateNotification(
    userId: string,
    event: StatusEvent,
    options: {
      channels?: Array<'realtime' | 'email' | 'slack' | 'webhook'>;
      priority?: 'low' | 'normal' | 'high' | 'critical';
      customMessage?: string;
    } = {},
  ): Promise<void> {
    const preferences = this.userPreferences.get(userId);
    if (!preferences) {
      this.logger.warning('Cannot send notification to unknown user', {
        userId,
      });
      return;
    }

    const channels = options.channels || this.getEnabledChannels(preferences);
    const priority = options.priority || 'normal';

    const notification = await this.formatNotification(event, preferences, {
      customMessage: options.customMessage,
      priority,
    });

    for (const channel of channels) {
      await this.deliverNotification(userId, notification, channel, event);
    }
  }

  /**
   * Send broadcast notification to all users
   */
  async sendBroadcastNotification(
    event: StatusEvent,
    options: {
      minimumPriority?: 'low' | 'normal' | 'high' | 'critical';
      channels?: Array<'realtime' | 'email' | 'slack' | 'webhook'>;
    } = {},
  ): Promise<void> {
    const minimumPriority = options.minimumPriority || 'normal';
    const priorityLevels = ['low', 'normal', 'high', 'critical'];
    const minLevel = priorityLevels.indexOf(minimumPriority);

    for (const [userId, preferences] of this.userPreferences) {
      const userLevel = priorityLevels.indexOf(preferences.priorityThreshold);

      // Only send if event priority meets user's threshold
      if (
        priorityLevels.indexOf(event.priority) >= Math.max(minLevel, userLevel)
      ) {
        if (this.isInQuietHours(preferences)) {
          // Queue for later delivery
          this.queueForBatch(userId, event);
        } else {
          await this.sendImmediateNotification(userId, event, {
            channels: options.channels,
          });
        }
      }
    }
  }

  /**
   * Acknowledge notification
   */
  acknowledgeNotification(
    notificationId: string,
    userId: string,
    actionTaken?: string,
  ): void {
    const notification = this.deliveredNotifications.get(notificationId);
    if (!notification || notification.userId !== userId) {
      this.logger.warning('Invalid notification acknowledgment', {
        notificationId,
        userId,
      });
      return;
    }

    notification.acknowledged = new Date();
    notification.actionTaken = actionTaken;

    this.emit('notification:acknowledged', { notification, actionTaken });

    this.logger.info('Notification acknowledged', {
      notificationId,
      userId,
      actionTaken,
    });
  }

  /**
   * Get notification history for user
   */
  getNotificationHistory(
    userId: string,
    filters?: {
      eventTypes?: StatusEventType[];
      since?: Date;
      acknowledged?: boolean;
    },
    limit = 50,
  ): DeliveredNotification[] {
    let notifications = Array.from(this.deliveredNotifications.values()).filter(
      (n) => n.userId === userId,
    );

    if (filters) {
      if (filters.eventTypes) {
        notifications = notifications.filter((n) =>
          filters.eventTypes!.includes(n.eventType),
        );
      }
      if (filters.since) {
        notifications = notifications.filter(
          (n) => n.deliveredAt >= filters.since!,
        );
      }
      if (filters.acknowledged !== undefined) {
        notifications = notifications.filter((n) =>
          filters.acknowledged ? !!n.acknowledged : !n.acknowledged,
        );
      }
    }

    return notifications
      .sort((a, b) => b.deliveredAt.getTime() - a.deliveredAt.getTime())
      .slice(0, limit);
  }

  /**
   * Get system-wide notification metrics
   */
  getMetrics(): typeof this.deliveryMetrics & {
    activeUsers: number;
    pendingBatches: number;
    templateCount: number;
    averageNotificationsPerUser: number;
  } {
    const totalNotificationsPerUser = Array.from(
      this.deliveredNotifications.values(),
    ).reduce(
      (acc, n) => {
        acc[n.userId] = (acc[n.userId] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const activeUsers = Object.keys(totalNotificationsPerUser).length;
    const averageNotificationsPerUser =
      activeUsers > 0
        ? this.deliveryMetrics.totalNotifications / activeUsers
        : 0;

    return {
      ...this.deliveryMetrics,
      activeUsers,
      pendingBatches: this.pendingBatches.size,
      templateCount: this.templates.size,
      averageNotificationsPerUser,
    };
  }

  // Private methods

  private setupDefaultTemplates(): void {
    const defaultTemplates: NotificationTemplate[] = [
      {
        id: 'task_registered',
        eventType: StatusEventType.TASK_REGISTERED,
        subject: 'New Task: {{task.title}}',
        message:
          'Task "{{task.title}}" has been registered and added to the queue.\n\nType: {{task.type}}\nPriority: {{task.priority}}\nDescription: {{task.description}}',
        format: 'text',
        variables: [
          'task.title',
          'task.type',
          'task.priority',
          'task.description',
        ],
      },
      {
        id: 'task_status_changed',
        eventType: StatusEventType.TASK_STATUS_CHANGED,
        subject: 'Task Status Update: {{task.title}}',
        message:
          'Task "{{task.title}}" status changed from {{update.previousStatus}} to {{update.newStatus}}.\n\n{{#if update.message}}Note: {{update.message}}\n{{/if}}{{#if update.error}}Error: {{update.error}}\n{{/if}}Progress: {{task.progress}}%',
        format: 'text',
        variables: [
          'task.title',
          'update.previousStatus',
          'update.newStatus',
          'update.message',
          'update.error',
          'task.progress',
        ],
      },
      {
        id: 'task_completed',
        eventType: StatusEventType.TASK_COMPLETED,
        subject: 'Task Completed: {{task.title}}',
        message:
          'Task "{{task.title}}" has been successfully completed!\n\nType: {{task.type}}\nAssigned to: {{task.assignedAgent}}\n{{#if duration}}Duration: {{duration}}ms{{/if}}',
        format: 'text',
        variables: [
          'task.title',
          'task.type',
          'task.assignedAgent',
          'duration',
        ],
      },
      {
        id: 'task_failed',
        eventType: StatusEventType.TASK_FAILED,
        subject: 'Task Failed: {{task.title}}',
        message:
          'Task "{{task.title}}" has failed.\n\nError: {{error}}\nAssigned to: {{task.assignedAgent}}\nRetry count: {{task.retryCount}}',
        format: 'text',
        variables: [
          'task.title',
          'error',
          'task.assignedAgent',
          'task.retryCount',
        ],
      },
      {
        id: 'agent_registered',
        eventType: StatusEventType.AGENT_REGISTERED,
        subject: 'New Agent Online: {{agent.id}}',
        message:
          'Agent "{{agent.id}}" has come online and is ready for task assignment.\n\nCapabilities: {{agent.capabilities}}',
        format: 'text',
        variables: ['agent.id', 'agent.capabilities'],
      },
      {
        id: 'agent_offline',
        eventType: StatusEventType.AGENT_OFFLINE,
        subject: 'Agent Offline: {{agent.id}}',
        message:
          'Agent "{{agent.id}}" has gone offline.\n\n{{#if reason}}Reason: {{reason}}{{/if}}',
        format: 'text',
        variables: ['agent.id', 'reason'],
      },
      {
        id: 'system_alert',
        eventType: StatusEventType.SYSTEM_ALERT,
        subject: 'System Alert: {{alert.type}}',
        message:
          'System alert triggered: {{alert.message}}\n\nSeverity: {{alert.severity}}\nTime: {{timestamp}}',
        format: 'text',
        variables: [
          'alert.type',
          'alert.message',
          'alert.severity',
          'timestamp',
        ],
      },
    ];

    for (const template of defaultTemplates) {
      this.templates.set(template.id, template);
    }
  }

  private subscribeToStatusUpdates(): void {
    // Subscribe to all delivery events from status broker
    statusUpdateBroker.on('delivery:user_*', async (data) => {
      const { event, config } = data;
      const userId = config.subscriberId.replace('user_', '');

      await this.handleStatusEvent(userId, event);
    });

    statusUpdateBroker.on('batch:user_*', async (data) => {
      const { events, config } = data;
      const userId = config.subscriberId.replace('user_', '');

      for (const event of events) {
        await this.handleStatusEvent(userId, event);
      }
    });
  }

  private async handleStatusEvent(
    userId: string,
    event: StatusEvent,
  ): Promise<void> {
    const preferences = this.userPreferences.get(userId);
    if (!preferences) return;

    if (this.isInQuietHours(preferences)) {
      this.queueForBatch(userId, event);
      return;
    }

    const channels = this.getEnabledChannels(preferences);
    const notification = await this.formatNotification(event, preferences);

    for (const channel of channels) {
      await this.deliverNotification(userId, notification, channel, event);
    }
  }

  private getRelevantEventTypes(
    preferences: NotificationPreferences,
  ): StatusEventType[] {
    // Return all event types that match user's interests
    // This could be more sophisticated based on user preferences
    return [
      StatusEventType.TASK_REGISTERED,
      StatusEventType.TASK_STATUS_CHANGED,
      StatusEventType.TASK_COMPLETED,
      StatusEventType.TASK_FAILED,
      StatusEventType.TASK_BLOCKED,
      StatusEventType.AGENT_REGISTERED,
      StatusEventType.AGENT_OFFLINE,
      StatusEventType.SYSTEM_ALERT,
      StatusEventType.PERFORMANCE_THRESHOLD,
    ];
  }

  private getEnabledChannels(
    preferences: NotificationPreferences,
  ): Array<'realtime' | 'email' | 'slack' | 'webhook'> {
    const channels: Array<'realtime' | 'email' | 'slack' | 'webhook'> = [];

    if (preferences.realTimeNotifications) channels.push('realtime');
    if (preferences.emailNotifications) channels.push('email');
    if (preferences.slackNotifications) channels.push('slack');
    if (preferences.webhookNotifications) channels.push('webhook');

    return channels;
  }

  private async formatNotification(
    event: StatusEvent,
    preferences: NotificationPreferences,
    options: {
      customMessage?: string;
      priority?: string;
    } = {},
  ): Promise<{ subject: string; message: string; priority: string }> {
    if (options.customMessage) {
      return {
        subject: `System Notification: ${event.type}`,
        message: options.customMessage,
        priority: options.priority || event.priority,
      };
    }

    const template = this.templates.get(`${event.type.replace(':', '_')}`);
    if (!template) {
      return {
        subject: `System Event: ${event.type}`,
        message: `Event: ${event.type}\nData: ${JSON.stringify(event.data, null, 2)}`,
        priority: event.priority,
      };
    }

    // Simple template variable substitution
    const subject = this.substituteVariables(template.subject, event.data);
    const message = this.substituteVariables(template.message, event.data);

    return { subject, message, priority: event.priority };
  }

  private substituteVariables(
    template: string,
    data: Record<string, unknown>,
  ): string {
    return template.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
      const value = this.getNestedValue(data, path.trim());
      return value !== undefined ? String(value) : match;
    });
  }

  private getNestedValue(obj: any, path: string): unknown {
    return path
      .split('.')
      .reduce(
        (current, key) =>
          current && typeof current === 'object' ? current[key] : undefined,
        obj,
      );
  }

  private async deliverNotification(
    userId: string,
    notification: { subject: string; message: string; priority: string },
    channel: 'realtime' | 'email' | 'slack' | 'webhook',
    event: StatusEvent,
  ): Promise<void> {
    const startTime = Date.now();

    try {
      const notificationId = this.generateNotificationId();

      const deliveredNotification: DeliveredNotification = {
        id: notificationId,
        userId,
        eventId: event.id,
        eventType: event.type,
        subject: notification.subject,
        message: notification.message,
        deliveryMethod: channel,
        deliveredAt: new Date(),
      };

      this.deliveredNotifications.set(notificationId, deliveredNotification);

      // Emit for external delivery systems to handle
      this.emit(`deliver:${channel}`, {
        notification: deliveredNotification,
        userId,
        preferences: this.userPreferences.get(userId),
      });

      // Update metrics
      this.deliveryMetrics.totalNotifications++;
      this.deliveryMetrics.deliveredNotifications++;
      this.deliveryMetrics.deliveryByChannel[channel] =
        (this.deliveryMetrics.deliveryByChannel[channel] || 0) + 1;

      const deliveryTime = Date.now() - startTime;
      this.updateDeliveryTimeMetrics(deliveryTime);

      this.logger.debug('Notification delivered', {
        notificationId,
        userId,
        channel,
        deliveryTime,
      });
    } catch (error) {
      this.deliveryMetrics.failedDeliveries++;
      this.logger.error('Notification delivery failed', {
        userId,
        channel,
        error,
      });
    }
  }

  private isInQuietHours(preferences: NotificationPreferences): boolean {
    if (!preferences.quietHours) return false;

    const now = new Date();
    const timezone = preferences.quietHours.timezone;

    // Simple quiet hours check (would need proper timezone handling in production)
    const currentHour = now.getHours();
    const startHour = parseInt(preferences.quietHours.start.split(':')[0]);
    const endHour = parseInt(preferences.quietHours.end.split(':')[0]);

    if (startHour <= endHour) {
      return currentHour >= startHour && currentHour < endHour;
    } else {
      // Overnight quiet hours
      return currentHour >= startHour || currentHour < endHour;
    }
  }

  private queueForBatch(userId: string, event: StatusEvent): void {
    const existing = this.pendingBatches.get(userId) || [];
    existing.push(event);
    this.pendingBatches.set(userId, existing);

    // Set timer to flush batch after quiet hours
    if (!this.batchTimers.has(userId)) {
      const timer = setTimeout(() => {
        this.flushBatchForUser(userId);
        this.batchTimers.delete(userId);
      }, 3600000); // 1 hour

      this.batchTimers.set(userId, timer);
    }
  }

  private async flushBatchForUser(userId: string): Promise<void> {
    const events = this.pendingBatches.get(userId);
    if (!events || events.length === 0) return;

    const preferences = this.userPreferences.get(userId);
    if (!preferences) return;

    // Create batch notification
    const batchNotification = {
      subject: `Batch Notification: ${events.length} updates`,
      message:
        `You have ${events.length} pending notifications:\n\n` +
        events
          .map((event) => `• ${event.type}: ${JSON.stringify(event.data)}`)
          .join('\n'),
      priority: 'normal',
    };

    const channels = this.getEnabledChannels(preferences).filter(
      (c) => c !== 'realtime',
    );

    for (const channel of channels) {
      await this.deliverNotification(
        userId,
        batchNotification,
        channel,
        events[0],
      );
    }

    this.pendingBatches.delete(userId);
    this.logger.info('Batch notifications flushed', {
      userId,
      eventCount: events.length,
    });
  }

  private updateDeliveryTimeMetrics(deliveryTime: number): void {
    const totalTime =
      this.deliveryMetrics.averageDeliveryTime *
        this.deliveryMetrics.deliveredNotifications +
      deliveryTime;
    this.deliveryMetrics.averageDeliveryTime =
      totalTime / (this.deliveryMetrics.deliveredNotifications + 1);
  }

  private generateNotificationId(): string {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    return `notification_${timestamp}_${randomString}`;
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    // Clear all batch timers
    for (const timer of this.batchTimers.values()) {
      clearTimeout(timer);
    }

    this.removeAllListeners();
    this.userPreferences.clear();
    this.templates.clear();
    this.deliveredNotifications.clear();
    this.pendingBatches.clear();
    this.batchTimers.clear();

    this.logger.info('NotificationSystem destroyed');
  }
}

/**
 * Singleton instance for global access
 */
export const notificationSystem = new NotificationSystem();
