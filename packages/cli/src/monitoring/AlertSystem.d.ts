/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { EventEmitter } from 'node:events';
import type {
  TaskMetadata,
  TaskStatusUpdate,
  AgentStatus,
} from './TaskStatusMonitor.js';
import type { BottleneckAnalysis } from './MetricsCollector.js';
/**
 * Alert severity levels
 */
export declare enum AlertSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}
/**
 * Alert categories for classification
 */
export declare enum AlertCategory {
  TASK_FAILURE = 'task_failure',
  TASK_DELAY = 'task_delay',
  AGENT_OFFLINE = 'agent_offline',
  PERFORMANCE_DEGRADATION = 'performance_degradation',
  RESOURCE_EXHAUSTION = 'resource_exhaustion',
  SECURITY_INCIDENT = 'security_incident',
  SYSTEM_ERROR = 'system_error',
  DEPENDENCY_FAILURE = 'dependency_failure',
}
/**
 * Alert notification channels
 */
export declare enum NotificationChannel {
  EMAIL = 'email',
  SLACK = 'slack',
  WEBHOOK = 'webhook',
  SMS = 'sms',
  CONSOLE = 'console',
  DASHBOARD = 'dashboard',
}
/**
 * Alert rule configuration
 */
export interface AlertRule {
  id: string;
  name: string;
  description: string;
  category: AlertCategory;
  severity: AlertSeverity;
  enabled: boolean;
  condition: {
    type: 'threshold' | 'pattern' | 'anomaly' | 'combination';
    parameters: Record<string, unknown>;
  };
  triggers: {
    eventTypes: string[];
    filters?: Record<string, unknown>;
  };
  actions: {
    notifications: {
      channels: NotificationChannel[];
      template?: string;
      recipients?: string[];
    };
    remediation?: {
      autoRemediate: boolean;
      actions: string[];
    };
    escalation?: {
      escalateAfter: number;
      escalateTo: string[];
    };
  };
  cooldownPeriod: number;
  retryPolicy?: {
    maxRetries: number;
    backoffMs: number;
  };
}
/**
 * Alert instance
 */
export interface Alert {
  id: string;
  ruleId: string;
  category: AlertCategory;
  severity: AlertSeverity;
  title: string;
  description: string;
  timestamp: Date;
  source: string;
  context: Record<string, unknown>;
  status: 'active' | 'acknowledged' | 'resolved' | 'suppressed';
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  resolvedAt?: Date;
  escalationLevel: number;
  notifications: Array<{
    channel: NotificationChannel;
    timestamp: Date;
    status: 'pending' | 'sent' | 'failed';
    recipientId?: string;
    error?: string;
  }>;
  remediationActions: Array<{
    action: string;
    timestamp: Date;
    status: 'pending' | 'running' | 'completed' | 'failed';
    result?: Record<string, unknown> | string | number | boolean;
    error?: string;
  }>;
}
/**
 * Alert statistics and analytics
 */
export interface AlertAnalytics {
  period: {
    start: Date;
    end: Date;
  };
  counts: {
    total: number;
    byCategory: Record<AlertCategory, number>;
    bySeverity: Record<AlertSeverity, number>;
    byStatus: Record<Alert['status'], number>;
  };
  trends: {
    alertsPerHour: number[];
    topCategories: Array<{
      category: AlertCategory;
      count: number;
    }>;
    resolutionTimes: number[];
    escalationRates: number[];
  };
  performance: {
    averageResolutionTime: number;
    alertResolutionRate: number;
    escalationRate: number;
    autoRemediationSuccessRate: number;
  };
}
/**
 * Notification delivery interface
 */
export interface NotificationDelivery {
  channel: NotificationChannel;
  send(alert: Alert, recipients: string[], template?: string): Promise<boolean>;
}
/**
 * AlertSystem - Comprehensive monitoring and alerting system
 *
 * Features:
 * - Rule-based alert generation
 * - Multi-channel notification delivery
 * - Automatic escalation and remediation
 * - Alert correlation and suppression
 * - Advanced analytics and reporting
 * - Integration with external monitoring systems
 */
export declare class AlertSystem extends EventEmitter {
  private readonly logger;
  private alertRules;
  private activeAlerts;
  private alertHistory;
  private ruleLastTriggered;
  private notificationDeliveries;
  private escalationTimers;
  private suppressionRules;
  private readonly maxAlertHistory;
  private readonly defaultCooldownPeriod;
  constructor();
  /**
   * Register an alert rule
   */
  registerRule(rule: AlertRule): void;
  /**
   * Update an existing alert rule
   */
  updateRule(ruleId: string, updates: Partial<AlertRule>): boolean;
  /**
   * Delete an alert rule
   */
  deleteRule(ruleId: string): boolean;
  /**
   * Process task status update for alert evaluation
   */
  processTaskStatusUpdate(
    task: TaskMetadata,
    update: TaskStatusUpdate,
  ): Promise<void>;
  /**
   * Process agent status update for alert evaluation
   */
  processAgentStatusUpdate(agent: AgentStatus): Promise<void>;
  /**
   * Process performance bottleneck for alert evaluation
   */
  processPerformanceBottleneck(bottleneck: BottleneckAnalysis): Promise<void>;
  /**
   * Acknowledge an alert
   */
  acknowledgeAlert(alertId: string, acknowledgedBy: string): Promise<boolean>;
  /**
   * Resolve an alert
   */
  resolveAlert(
    alertId: string,
    resolvedBy: string,
    resolution?: string,
  ): Promise<boolean>;
  /**
   * Suppress alerts matching a pattern for a duration
   */
  suppressAlerts(pattern: string, durationMs: number): void;
  /**
   * Get active alerts with optional filtering
   */
  getActiveAlerts(filters?: {
    category?: AlertCategory;
    severity?: AlertSeverity;
    source?: string;
  }): Alert[];
  /**
   * Get alert analytics for a time period
   */
  getAlertAnalytics(hours?: number): AlertAnalytics;
  /**
   * Register a notification delivery channel
   */
  registerNotificationChannel(
    channel: NotificationChannel,
    delivery: NotificationDelivery,
  ): void;
  private evaluateTaskFailureAlerts;
  private evaluateTaskDelayAlerts;
  private evaluateTaskBlockingAlerts;
  private evaluateAgentOfflineAlerts;
  private evaluateAgentPerformanceAlerts;
  private evaluateBottleneckAlerts;
  private evaluateRules;
  private evaluateRuleCondition;
  private evaluateThresholdCondition;
  private evaluatePatternCondition;
  private evaluateAnomalyCondition;
  private evaluateCombinationCondition;
  private getValueFromContext;
  private triggerRule;
  private createAlert;
  private isAlertSuppressed;
  private sendNotifications;
  private setupEscalation;
  private attemptAutoRemediation;
  private executeRemediationAction;
  private setupDefaultRules;
  private setupDefaultNotificationChannels;
  private setupPeriodicMaintenance;
  private cleanupAlertHistory;
  private generateAlertId;
  private calculateCountsByCategory;
  private calculateCountsBySeverity;
  private calculateCountsByStatus;
  private calculateHourlyTrends;
  private calculateTopCategories;
  private calculateResolutionTimes;
  private calculateEscalationRates;
  private calculateAverageResolutionTime;
  private calculateResolutionRate;
  private calculateEscalationRate;
  private calculateAutoRemediationSuccessRate;
  /**
   * Cleanup resources
   */
  destroy(): void;
}
/**
 * Singleton instance for global access
 */
export declare const alertSystem: AlertSystem;
