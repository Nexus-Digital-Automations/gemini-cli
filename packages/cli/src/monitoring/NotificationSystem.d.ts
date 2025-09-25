/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { EventEmitter } from 'node:events';
import type { StatusEvent, StatusEventType } from './StatusUpdateBroker.js';
export interface NotificationPreferences {
  userId: string;
  realTimeNotifications: boolean;
  emailNotifications: boolean;
  slackNotifications: boolean;
  webhookNotifications: boolean;
  quietHours?: {
    start: string;
    end: string;
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
export declare class NotificationSystem extends EventEmitter {
  private readonly logger;
  private userPreferences;
  private templates;
  private deliveredNotifications;
  private pendingBatches;
  private batchTimers;
  private deliveryMetrics;
  constructor();
  /**
   * Register user notification preferences
   */
  registerUserPreferences(preferences: NotificationPreferences): void;
  /**
   * Update user notification preferences
   */
  updateUserPreferences(
    userId: string,
    updates: Partial<NotificationPreferences>,
  ): void;
  /**
   * Send immediate notification to specific user
   */
  sendImmediateNotification(
    userId: string,
    event: StatusEvent,
    options?: {
      channels?: Array<'realtime' | 'email' | 'slack' | 'webhook'>;
      priority?: 'low' | 'normal' | 'high' | 'critical';
      customMessage?: string;
    },
  ): Promise<void>;
  /**
   * Send broadcast notification to all users
   */
  sendBroadcastNotification(
    event: StatusEvent,
    options?: {
      minimumPriority?: 'low' | 'normal' | 'high' | 'critical';
      channels?: Array<'realtime' | 'email' | 'slack' | 'webhook'>;
    },
  ): Promise<void>;
  /**
   * Acknowledge notification
   */
  acknowledgeNotification(
    notificationId: string,
    userId: string,
    actionTaken?: string,
  ): void;
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
    limit?: number,
  ): DeliveredNotification[];
  /**
   * Get system-wide notification metrics
   */
  getMetrics(): typeof this.deliveryMetrics & {
    activeUsers: number;
    pendingBatches: number;
    templateCount: number;
    averageNotificationsPerUser: number;
  };
  private setupDefaultTemplates;
  private subscribeToStatusUpdates;
  private handleStatusEvent;
  private getRelevantEventTypes;
  private getEnabledChannels;
  private formatNotification;
  private substituteVariables;
  private getNestedValue;
  private deliverNotification;
  private isInQuietHours;
  private queueForBatch;
  private flushBatchForUser;
  private updateDeliveryTimeMetrics;
  private generateNotificationId;
  /**
   * Cleanup resources
   */
  destroy(): void;
}
/**
 * Singleton instance for global access
 */
export declare const notificationSystem: NotificationSystem;
