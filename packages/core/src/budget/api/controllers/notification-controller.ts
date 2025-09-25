/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Budget Notification Controller
 * Handles budget alerts, notifications, and alert configuration management
 * Provides endpoints for creating, managing, and testing notification systems
 *
 * @author Claude Code - Budget Management API Endpoints Agent
 * @version 1.0.0
 */

import { Request, Response } from 'express';
import { Logger } from '../../../../../src/utils/logger.js';
import { BudgetSettings, BudgetEventType } from '../../types.js';
import { getBudgetTracker } from '../../budget-tracker.js';

const logger = new Logger('NotificationController');

/**
 * Enhanced request interface with user context
 */
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    permissions: string[];
  };
  sessionId?: string;
}

/**
 * Alert configuration interface
 */
interface AlertConfig {
  id: string;
  type: 'threshold' | 'limit_exceeded' | 'anomaly' | 'custom';
  name: string;
  description: string;
  threshold?: number;
  enabled: boolean;
  channels: NotificationChannel[];
  conditions: AlertCondition[];
  metadata: {
    createdAt: string;
    updatedAt: string;
    createdBy: string;
  };
}

/**
 * Notification channel interface
 */
interface NotificationChannel {
  type: 'email' | 'webhook' | 'desktop' | 'sms';
  config: Record<string, any>;
  enabled: boolean;
}

/**
 * Alert condition interface
 */
interface AlertCondition {
  field: string;
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte' | 'contains';
  value: any;
  aggregation?: 'sum' | 'avg' | 'count' | 'max' | 'min';
}

/**
 * Controller for budget notification and alerting endpoints
 */
export class NotificationController {
  private alertConfigs: Map<string, AlertConfig> = new Map();
  private notificationHistory: Array<any> = [];

  /**
   * Initialize notification controller
   */
  constructor() {
    logger.info('Initializing Notification Controller', {
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    });

    this.loadDefaultAlerts();
  }

  /**
   * Get active budget alerts
   * GET /api/budget/alerts
   */
  async getAlerts(req: AuthenticatedRequest, res: Response): Promise<void> {
    const startTime = Date.now();
    const { status, type, limit = 50 } = req.query;

    logger.info('Alerts retrieval requested', {
      userId: req.user?.id,
      status,
      type,
      limit,
      timestamp: new Date().toISOString()
    });

    try {
      const budgetTracker = await getBudgetTracker();
      if (!budgetTracker) {
        res.status(503).json({
          success: false,
          error: 'Alert service unavailable'
        });
        return;
      }

      // Get active alerts from budget tracker
      const activeAlerts = await budgetTracker.getActiveAlerts();

      // Get configured alert rules
      const alertConfigs = Array.from(this.alertConfigs.values());

      // Filter based on query parameters
      let filteredAlerts = activeAlerts;
      let filteredConfigs = alertConfigs;

      if (status) {
        filteredAlerts = filteredAlerts.filter((alert: any) => alert.status === status);
      }

      if (type) {
        filteredAlerts = filteredAlerts.filter((alert: any) => alert.type === type);
        filteredConfigs = filteredConfigs.filter(config => config.type === type);
      }

      // Apply limit
      const limitNum = parseInt(limit as string);
      filteredAlerts = filteredAlerts.slice(0, limitNum);

      const responseTime = Date.now() - startTime;
      const response = {
        success: true,
        data: {
          activeAlerts: filteredAlerts,
          alertConfigurations: filteredConfigs,
          summary: {
            totalActive: activeAlerts.length,
            totalConfigurations: alertConfigs.length,
            enabledConfigurations: alertConfigs.filter(config => config.enabled).length
          },
          metadata: {
            timestamp: new Date().toISOString(),
            responseTime,
            filters: { status, type, limit }
          }
        }
      };

      logger.info('Alerts retrieved successfully', {
        responseTime,
        activeAlertsCount: filteredAlerts.length,
        configurationsCount: filteredConfigs.length
      });

      res.status(200).json(response);

    } catch (error) {
      const responseTime = Date.now() - startTime;
      logger.error('Failed to get alerts', {
        error: error instanceof Error ? error.message : 'Unknown error',
        responseTime,
        userId: req.user?.id
      });

      res.status(500).json({
        success: false,
        error: 'Failed to retrieve alerts',
        timestamp: new Date().toISOString(),
        responseTime
      });
    }
  }

  /**
   * Configure budget alerts
   * POST /api/budget/alerts
   */
  async configureAlerts(req: AuthenticatedRequest, res: Response): Promise<void> {
    const startTime = Date.now();
    const alertConfig = req.body;

    logger.info('Alert configuration requested', {
      userId: req.user?.id,
      alertType: alertConfig.type,
      alertName: alertConfig.name,
      timestamp: new Date().toISOString()
    });

    try {
      // Validate alert configuration
      const validationResult = this.validateAlertConfig(alertConfig);
      if (!validationResult.valid) {
        res.status(400).json({
          success: false,
          error: 'Invalid alert configuration',
          details: validationResult.errors
        });
        return;
      }

      // Generate alert ID if not provided
      const alertId = alertConfig.id || this.generateAlertId();

      // Create alert configuration
      const newAlertConfig: AlertConfig = {
        id: alertId,
        type: alertConfig.type,
        name: alertConfig.name,
        description: alertConfig.description || '',
        threshold: alertConfig.threshold,
        enabled: alertConfig.enabled !== false,
        channels: alertConfig.channels || [],
        conditions: alertConfig.conditions || [],
        metadata: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: req.user?.id || 'unknown'
        }
      };

      // Store alert configuration
      this.alertConfigs.set(alertId, newAlertConfig);

      // Register alert with budget tracker
      const budgetTracker = await getBudgetTracker();
      if (budgetTracker) {
        await budgetTracker.registerAlert(newAlertConfig);
      }

      const responseTime = Date.now() - startTime;
      const response = {
        success: true,
        data: {
          alertConfiguration: newAlertConfig,
          metadata: {
            timestamp: new Date().toISOString(),
            responseTime,
            operation: alertConfig.id ? 'updated' : 'created'
          }
        }
      };

      logger.info('Alert configured successfully', {
        responseTime,
        alertId,
        alertType: newAlertConfig.type,
        operation: alertConfig.id ? 'updated' : 'created'
      });

      res.status(alertConfig.id ? 200 : 201).json(response);

    } catch (error) {
      const responseTime = Date.now() - startTime;
      logger.error('Failed to configure alert', {
        error: error instanceof Error ? error.message : 'Unknown error',
        responseTime,
        userId: req.user?.id
      });

      res.status(500).json({
        success: false,
        error: 'Failed to configure alert',
        timestamp: new Date().toISOString(),
        responseTime
      });
    }
  }

  /**
   * Remove specific alert
   * DELETE /api/budget/alerts/:alertId
   */
  async removeAlert(req: AuthenticatedRequest, res: Response): Promise<void> {
    const startTime = Date.now();
    const { alertId } = req.params;

    logger.info('Alert removal requested', {
      userId: req.user?.id,
      alertId,
      timestamp: new Date().toISOString()
    });

    try {
      const alertConfig = this.alertConfigs.get(alertId);
      if (!alertConfig) {
        res.status(404).json({
          success: false,
          error: 'Alert configuration not found'
        });
        return;
      }

      // Remove alert configuration
      this.alertConfigs.delete(alertId);

      // Unregister alert from budget tracker
      const budgetTracker = await getBudgetTracker();
      if (budgetTracker) {
        await budgetTracker.unregisterAlert(alertId);
      }

      const responseTime = Date.now() - startTime;
      const response = {
        success: true,
        data: {
          removedAlert: alertConfig,
          metadata: {
            timestamp: new Date().toISOString(),
            responseTime,
            removedBy: req.user?.id
          }
        }
      };

      logger.info('Alert removed successfully', {
        responseTime,
        alertId,
        alertType: alertConfig.type
      });

      res.status(200).json(response);

    } catch (error) {
      const responseTime = Date.now() - startTime;
      logger.error('Failed to remove alert', {
        error: error instanceof Error ? error.message : 'Unknown error',
        responseTime,
        userId: req.user?.id,
        alertId
      });

      res.status(500).json({
        success: false,
        error: 'Failed to remove alert',
        timestamp: new Date().toISOString(),
        responseTime
      });
    }
  }

  /**
   * Test notification delivery
   * POST /api/budget/alerts/test
   */
  async testNotification(req: AuthenticatedRequest, res: Response): Promise<void> {
    const startTime = Date.now();
    const { alertId, channel, testData } = req.body;

    logger.info('Notification test requested', {
      userId: req.user?.id,
      alertId,
      channel,
      timestamp: new Date().toISOString()
    });

    try {
      let alertConfig: AlertConfig | undefined;

      if (alertId) {
        alertConfig = this.alertConfigs.get(alertId);
        if (!alertConfig) {
          res.status(404).json({
            success: false,
            error: 'Alert configuration not found'
          });
          return;
        }
      }

      // Create test notification
      const testNotification = {
        type: 'test',
        title: 'Budget Alert Test',
        message: 'This is a test notification from the Budget Management API',
        data: testData || {
          currentUsage: 85.50,
          limit: 100.00,
          percentage: 85.5,
          timestamp: new Date().toISOString()
        },
        metadata: {
          testBy: req.user?.id,
          testTimestamp: new Date().toISOString(),
          alertId
        }
      };

      // Attempt to send test notification
      const deliveryResults = await this.sendTestNotification(
        testNotification,
        channel,
        alertConfig
      );

      const responseTime = Date.now() - startTime;
      const response = {
        success: true,
        data: {
          testNotification,
          deliveryResults,
          metadata: {
            timestamp: new Date().toISOString(),
            responseTime,
            testedBy: req.user?.id
          }
        }
      };

      logger.info('Notification test completed', {
        responseTime,
        alertId,
        channel,
        deliverySuccess: deliveryResults.every((result: any) => result.success)
      });

      res.status(200).json(response);

    } catch (error) {
      const responseTime = Date.now() - startTime;
      logger.error('Notification test failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        responseTime,
        userId: req.user?.id,
        alertId
      });

      res.status(500).json({
        success: false,
        error: 'Notification test failed',
        timestamp: new Date().toISOString(),
        responseTime
      });
    }
  }

  /**
   * Validate alert configuration
   */
  private validateAlertConfig(config: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!config.name || typeof config.name !== 'string') {
      errors.push('Alert name is required and must be a string');
    }

    if (!config.type || !['threshold', 'limit_exceeded', 'anomaly', 'custom'].includes(config.type)) {
      errors.push('Alert type must be one of: threshold, limit_exceeded, anomaly, custom');
    }

    if (config.type === 'threshold' && (config.threshold === undefined || typeof config.threshold !== 'number')) {
      errors.push('Threshold alerts require a numeric threshold value');
    }

    if (config.channels && Array.isArray(config.channels)) {
      for (const channel of config.channels) {
        if (!channel.type || !['email', 'webhook', 'desktop', 'sms'].includes(channel.type)) {
          errors.push('Invalid notification channel type');
          break;
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Send test notification
   */
  private async sendTestNotification(
    notification: any,
    channel?: string,
    alertConfig?: AlertConfig
  ): Promise<any[]> {
    const results: any[] = [];

    // Determine channels to test
    const channelsToTest = channel ? [{ type: channel, enabled: true, config: {} }] :
      alertConfig?.channels || [{ type: 'email', enabled: true, config: {} }];

    for (const channelConfig of channelsToTest) {
      if (!channelConfig.enabled) continue;

      try {
        const result = await this.sendNotificationToChannel(notification, channelConfig);
        results.push({
          channel: channelConfig.type,
          success: true,
          result,
          timestamp: new Date().toISOString()
        });

        logger.info('Test notification sent successfully', {
          channel: channelConfig.type,
          notificationType: notification.type
        });

      } catch (error) {
        results.push({
          channel: channelConfig.type,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        });

        logger.warn('Test notification failed for channel', {
          channel: channelConfig.type,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return results;
  }

  /**
   * Send notification to specific channel
   */
  private async sendNotificationToChannel(
    notification: any,
    channel: NotificationChannel
  ): Promise<any> {
    switch (channel.type) {
      case 'email':
        return this.sendEmailNotification(notification, channel.config);

      case 'webhook':
        return this.sendWebhookNotification(notification, channel.config);

      case 'desktop':
        return this.sendDesktopNotification(notification, channel.config);

      case 'sms':
        return this.sendSMSNotification(notification, channel.config);

      default:
        throw new Error(`Unsupported notification channel: ${channel.type}`);
    }
  }

  /**
   * Send email notification (mock implementation)
   */
  private async sendEmailNotification(notification: any, config: any): Promise<any> {
    // Mock email sending - replace with actual email service
    logger.info('Mock email notification sent', {
      to: config.email || 'user@example.com',
      subject: notification.title,
      message: notification.message
    });

    return {
      messageId: `email_${Date.now()}`,
      status: 'sent',
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Send webhook notification (mock implementation)
   */
  private async sendWebhookNotification(notification: any, config: any): Promise<any> {
    // Mock webhook sending - replace with actual HTTP request
    logger.info('Mock webhook notification sent', {
      url: config.url || 'https://example.com/webhook',
      payload: notification
    });

    return {
      responseStatus: 200,
      responseTime: 150,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Send desktop notification (mock implementation)
   */
  private async sendDesktopNotification(notification: any, config: any): Promise<any> {
    // Mock desktop notification - replace with actual desktop notification API
    logger.info('Mock desktop notification sent', {
      title: notification.title,
      message: notification.message
    });

    return {
      displayed: true,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Send SMS notification (mock implementation)
   */
  private async sendSMSNotification(notification: any, config: any): Promise<any> {
    // Mock SMS sending - replace with actual SMS service
    logger.info('Mock SMS notification sent', {
      to: config.phoneNumber || '+1234567890',
      message: `${notification.title}: ${notification.message}`
    });

    return {
      messageId: `sms_${Date.now()}`,
      status: 'sent',
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Load default alert configurations
   */
  private loadDefaultAlerts(): void {
    const defaultAlerts: AlertConfig[] = [
      {
        id: 'default_threshold_80',
        type: 'threshold',
        name: '80% Budget Threshold',
        description: 'Alert when budget usage reaches 80%',
        threshold: 80,
        enabled: true,
        channels: [{ type: 'email', enabled: true, config: {} }],
        conditions: [
          { field: 'usagePercentage', operator: 'gte', value: 80 }
        ],
        metadata: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: 'system'
        }
      },
      {
        id: 'default_limit_exceeded',
        type: 'limit_exceeded',
        name: 'Budget Limit Exceeded',
        description: 'Alert when budget limit is exceeded',
        enabled: true,
        channels: [
          { type: 'email', enabled: true, config: {} },
          { type: 'desktop', enabled: true, config: {} }
        ],
        conditions: [
          { field: 'usagePercentage', operator: 'gt', value: 100 }
        ],
        metadata: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: 'system'
        }
      }
    ];

    for (const alert of defaultAlerts) {
      this.alertConfigs.set(alert.id, alert);
    }

    logger.info('Default alert configurations loaded', {
      count: defaultAlerts.length
    });
  }

  /**
   * Generate unique alert ID
   */
  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}