/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { EventEmitter } from 'node:events';
import { Logger } from '../utils/logger.js';
import type {
  TaskMetadata,
  TaskStatus,
  TaskStatusUpdate,
  AgentStatus,
} from './TaskStatusMonitor.js';
import type { BottleneckAnalysis } from './MetricsCollector.js';

/**
 * Alert severity levels
 */
export enum AlertSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}

/**
 * Alert categories for classification
 */
export enum AlertCategory {
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
export enum NotificationChannel {
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
      escalateAfter: number; // milliseconds
      escalateTo: string[];
    };
  };
  cooldownPeriod: number; // milliseconds
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
    topCategories: Array<{ category: AlertCategory; count: number }>;
    resolutionTimes: number[]; // milliseconds
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
export class AlertSystem extends EventEmitter {
  private readonly logger: Logger;
  private alertRules: Map<string, AlertRule>;
  private activeAlerts: Map<string, Alert>;
  private alertHistory: Alert[];
  private ruleLastTriggered: Map<string, Date>;
  private notificationDeliveries: Map<
    NotificationChannel,
    NotificationDelivery
  >;
  private escalationTimers: Map<string, NodeJS.Timeout>;
  private suppressionRules: Map<string, { pattern: RegExp; duration: number }>;

  private readonly maxAlertHistory = 10000;
  private readonly defaultCooldownPeriod = 300000; // 5 minutes

  constructor() {
    super();
    this.logger = new Logger('AlertSystem');
    this.alertRules = new Map();
    this.activeAlerts = new Map();
    this.alertHistory = [];
    this.ruleLastTriggered = new Map();
    this.notificationDeliveries = new Map();
    this.escalationTimers = new Map();
    this.suppressionRules = new Map();

    this.setupDefaultRules();
    this.setupDefaultNotificationChannels();
    this.setupPeriodicMaintenance();

    this.logger.info('AlertSystem initialized');
  }

  /**
   * Register an alert rule
   */
  registerRule(rule: AlertRule): void {
    this.alertRules.set(rule.id, rule);
    this.emit('rule:registered', { rule });

    this.logger.info('Alert rule registered', {
      id: rule.id,
      name: rule.name,
      category: rule.category,
      severity: rule.severity,
    });
  }

  /**
   * Update an existing alert rule
   */
  updateRule(ruleId: string, updates: Partial<AlertRule>): boolean {
    const existingRule = this.alertRules.get(ruleId);
    if (!existingRule) {
      this.logger.warning('Attempt to update non-existent rule', { ruleId });
      return false;
    }

    const updatedRule = { ...existingRule, ...updates };
    this.alertRules.set(ruleId, updatedRule);

    this.emit('rule:updated', { ruleId, rule: updatedRule });
    this.logger.info('Alert rule updated', { ruleId });

    return true;
  }

  /**
   * Delete an alert rule
   */
  deleteRule(ruleId: string): boolean {
    const rule = this.alertRules.get(ruleId);
    if (!rule) return false;

    this.alertRules.delete(ruleId);
    this.ruleLastTriggered.delete(ruleId);

    this.emit('rule:deleted', { ruleId, rule });
    this.logger.info('Alert rule deleted', { ruleId });

    return true;
  }

  /**
   * Process task status update for alert evaluation
   */
  async processTaskStatusUpdate(
    task: TaskMetadata,
    update: TaskStatusUpdate,
  ): Promise<void> {
    const context = {
      taskId: task.id,
      taskTitle: task.title,
      taskType: task.type,
      taskPriority: task.priority,
      agentId: task.assignedAgent,
      previousStatus: update.previousStatus,
      newStatus: update.newStatus,
      progress: task.progress,
      duration: task.actualDuration,
      errorCount: task.errorCount,
      retryCount: task.retryCount,
      update,
    };

    // Check for task failure alerts
    if (update.newStatus === TaskStatus.FAILED) {
      await this.evaluateTaskFailureAlerts(task, update, context);
    }

    // Check for task delay alerts
    if (task.estimatedDuration && task.actualDuration) {
      if (task.actualDuration > task.estimatedDuration * 1.5) {
        // 50% over estimate
        await this.evaluateTaskDelayAlerts(task, update, context);
      }
    }

    // Check for task blocking alerts
    if (update.newStatus === TaskStatus.BLOCKED) {
      await this.evaluateTaskBlockingAlerts(task, update, context);
    }

    // General rule evaluation
    await this.evaluateRules('task_status_update', context);
  }

  /**
   * Process agent status update for alert evaluation
   */
  async processAgentStatusUpdate(agent: AgentStatus): Promise<void> {
    const context = {
      agentId: agent.id,
      agentStatus: agent.status,
      currentTasks: agent.currentTasks,
      completedTasks: agent.completedTasks,
      failedTasks: agent.failedTasks,
      performance: agent.performance,
      lastHeartbeat: agent.lastHeartbeat,
    };

    // Check for agent offline alerts
    const timeSinceHeartbeat = Date.now() - agent.lastHeartbeat.getTime();
    if (timeSinceHeartbeat > 300000 && agent.status !== 'offline') {
      // 5 minutes
      await this.evaluateAgentOfflineAlerts(agent, context);
    }

    // Check for agent performance alerts
    if (agent.performance.successRate < 70) {
      // Less than 70% success rate
      await this.evaluateAgentPerformanceAlerts(agent, context);
    }

    // General rule evaluation
    await this.evaluateRules('agent_status_update', context);
  }

  /**
   * Process performance bottleneck for alert evaluation
   */
  async processPerformanceBottleneck(
    bottleneck: BottleneckAnalysis,
  ): Promise<void> {
    const context = {
      bottleneckType: bottleneck.type,
      severity: bottleneck.severity,
      description: bottleneck.description,
      affectedTasks: bottleneck.affectedTasks,
      affectedAgents: bottleneck.affectedAgents,
      recommendations: bottleneck.recommendations,
      estimatedImpact: bottleneck.estimatedImpact,
    };

    await this.evaluateBottleneckAlerts(bottleneck, context);
    await this.evaluateRules('performance_bottleneck', context);
  }

  /**
   * Acknowledge an alert
   */
  async acknowledgeAlert(
    alertId: string,
    acknowledgedBy: string,
  ): Promise<boolean> {
    const alert = this.activeAlerts.get(alertId);
    if (!alert || alert.status !== 'active') return false;

    alert.status = 'acknowledged';
    alert.acknowledgedBy = acknowledgedBy;
    alert.acknowledgedAt = new Date();

    // Cancel escalation timer if exists
    const escalationTimer = this.escalationTimers.get(alertId);
    if (escalationTimer) {
      clearTimeout(escalationTimer);
      this.escalationTimers.delete(alertId);
    }

    this.emit('alert:acknowledged', { alert, acknowledgedBy });
    this.logger.info('Alert acknowledged', { alertId, acknowledgedBy });

    return true;
  }

  /**
   * Resolve an alert
   */
  async resolveAlert(
    alertId: string,
    resolvedBy: string,
    resolution?: string,
  ): Promise<boolean> {
    const alert = this.activeAlerts.get(alertId);
    if (!alert) return false;

    alert.status = 'resolved';
    alert.resolvedAt = new Date();
    if (resolution) {
      alert.context['resolution'] = resolution;
      alert.context['resolvedBy'] = resolvedBy;
    }

    // Move to history and remove from active alerts
    this.alertHistory.push(alert);
    this.activeAlerts.delete(alertId);

    // Cancel escalation timer if exists
    const escalationTimer = this.escalationTimers.get(alertId);
    if (escalationTimer) {
      clearTimeout(escalationTimer);
      this.escalationTimers.delete(alertId);
    }

    this.emit('alert:resolved', { alert, resolvedBy, resolution });
    this.logger.info('Alert resolved', { alertId, resolvedBy });

    return true;
  }

  /**
   * Suppress alerts matching a pattern for a duration
   */
  suppressAlerts(pattern: string, durationMs: number): void {
    const regex = new RegExp(pattern, 'i');
    const suppressionId = `suppression_${Date.now()}`;

    this.suppressionRules.set(suppressionId, {
      pattern: regex,
      duration: durationMs,
    });

    // Auto-remove suppression after duration
    setTimeout(() => {
      this.suppressionRules.delete(suppressionId);
      this.logger.info('Alert suppression expired', { suppressionId, pattern });
    }, durationMs);

    this.logger.info('Alert suppression created', {
      suppressionId,
      pattern,
      durationMs,
    });
  }

  /**
   * Get active alerts with optional filtering
   */
  getActiveAlerts(filters?: {
    category?: AlertCategory;
    severity?: AlertSeverity;
    source?: string;
  }): Alert[] {
    let alerts = Array.from(this.activeAlerts.values());

    if (filters) {
      if (filters.category) {
        alerts = alerts.filter((alert) => alert.category === filters.category);
      }
      if (filters.severity) {
        alerts = alerts.filter((alert) => alert.severity === filters.severity);
      }
      if (filters.source) {
        alerts = alerts.filter((alert) => alert.source === filters.source);
      }
    }

    return alerts.sort((a, b) => {
      // Sort by severity (critical first), then by timestamp
      const severityOrder = { critical: 4, error: 3, warning: 2, info: 1 };
      const severityDiff =
        severityOrder[b.severity] - severityOrder[a.severity];
      return severityDiff !== 0
        ? severityDiff
        : b.timestamp.getTime() - a.timestamp.getTime();
    });
  }

  /**
   * Get alert analytics for a time period
   */
  getAlertAnalytics(hours = 24): AlertAnalytics {
    const periodStart = new Date(Date.now() - hours * 60 * 60 * 1000);
    const periodEnd = new Date();

    const periodAlerts = this.alertHistory
      .filter((alert) => alert.timestamp >= periodStart)
      .concat(Array.from(this.activeAlerts.values()));

    const analytics: AlertAnalytics = {
      period: { start: periodStart, end: periodEnd },
      counts: {
        total: periodAlerts.length,
        byCategory: this.calculateCountsByCategory(periodAlerts),
        bySeverity: this.calculateCountsBySeverity(periodAlerts),
        byStatus: this.calculateCountsByStatus(periodAlerts),
      },
      trends: {
        alertsPerHour: this.calculateHourlyTrends(periodAlerts, hours),
        topCategories: this.calculateTopCategories(periodAlerts),
        resolutionTimes: this.calculateResolutionTimes(periodAlerts),
        escalationRates: this.calculateEscalationRates(periodAlerts),
      },
      performance: {
        averageResolutionTime:
          this.calculateAverageResolutionTime(periodAlerts),
        alertResolutionRate: this.calculateResolutionRate(periodAlerts),
        escalationRate: this.calculateEscalationRate(periodAlerts),
        autoRemediationSuccessRate:
          this.calculateAutoRemediationSuccessRate(periodAlerts),
      },
    };

    return analytics;
  }

  /**
   * Register a notification delivery channel
   */
  registerNotificationChannel(
    channel: NotificationChannel,
    delivery: NotificationDelivery,
  ): void {
    this.notificationDeliveries.set(channel, delivery);
    this.logger.info('Notification channel registered', { channel });
  }

  // Private methods

  private async evaluateTaskFailureAlerts(
    task: TaskMetadata,
    update: TaskStatusUpdate,
    context: Record<string, unknown>,
  ): Promise<void> {
    // High priority task failure
    if (task.priority === 'critical' || task.priority === 'high') {
      await this.createAlert({
        ruleId: 'high_priority_task_failure',
        category: AlertCategory.TASK_FAILURE,
        severity:
          task.priority === 'critical'
            ? AlertSeverity.CRITICAL
            : AlertSeverity.ERROR,
        title: `High Priority Task Failed: ${task.title}`,
        description: `Task ${task.id} (${task.title}) with ${task.priority} priority has failed`,
        source: `task_${task.id}`,
        context,
      });
    }

    // Multiple retry failures
    if (task.retryCount >= 3) {
      await this.createAlert({
        ruleId: 'multiple_retry_failure',
        category: AlertCategory.TASK_FAILURE,
        severity: AlertSeverity.WARNING,
        title: `Task Failed After Multiple Retries: ${task.title}`,
        description: `Task ${task.id} failed after ${task.retryCount} retry attempts`,
        source: `task_${task.id}`,
        context,
      });
    }
  }

  private async evaluateTaskDelayAlerts(
    task: TaskMetadata,
    update: TaskStatusUpdate,
    context: Record<string, unknown>,
  ): Promise<void> {
    const overrunPercent =
      (task.actualDuration! / task.estimatedDuration!) * 100 - 100;

    await this.createAlert({
      ruleId: 'task_delay',
      category: AlertCategory.TASK_DELAY,
      severity:
        overrunPercent > 100 ? AlertSeverity.ERROR : AlertSeverity.WARNING,
      title: `Task Delayed: ${task.title}`,
      description: `Task ${task.id} is ${overrunPercent.toFixed(1)}% over estimated duration`,
      source: `task_${task.id}`,
      context: { ...context, overrunPercent },
    });
  }

  private async evaluateTaskBlockingAlerts(
    task: TaskMetadata,
    update: TaskStatusUpdate,
    context: Record<string, unknown>,
  ): Promise<void> {
    await this.createAlert({
      ruleId: 'task_blocked',
      category: AlertCategory.TASK_DELAY,
      severity:
        task.priority === 'critical'
          ? AlertSeverity.ERROR
          : AlertSeverity.WARNING,
      title: `Task Blocked: ${task.title}`,
      description: `Task ${task.id} is blocked: ${update.message || 'No reason provided'}`,
      source: `task_${task.id}`,
      context,
    });
  }

  private async evaluateAgentOfflineAlerts(
    agent: AgentStatus,
    context: Record<string, unknown>,
  ): Promise<void> {
    const timeSinceHeartbeat = Date.now() - agent.lastHeartbeat.getTime();
    const minutesOffline = Math.round(timeSinceHeartbeat / 60000);

    await this.createAlert({
      ruleId: 'agent_offline',
      category: AlertCategory.AGENT_OFFLINE,
      severity:
        minutesOffline > 15 ? AlertSeverity.ERROR : AlertSeverity.WARNING,
      title: `Agent Offline: ${agent.id}`,
      description: `Agent ${agent.id} has been offline for ${minutesOffline} minutes`,
      source: `agent_${agent.id}`,
      context: { ...context, minutesOffline },
    });
  }

  private async evaluateAgentPerformanceAlerts(
    agent: AgentStatus,
    context: Record<string, unknown>,
  ): Promise<void> {
    await this.createAlert({
      ruleId: 'agent_performance_degradation',
      category: AlertCategory.PERFORMANCE_DEGRADATION,
      severity:
        agent.performance.successRate < 50
          ? AlertSeverity.ERROR
          : AlertSeverity.WARNING,
      title: `Agent Performance Degradation: ${agent.id}`,
      description: `Agent ${agent.id} success rate dropped to ${agent.performance.successRate.toFixed(1)}%`,
      source: `agent_${agent.id}`,
      context,
    });
  }

  private async evaluateBottleneckAlerts(
    bottleneck: BottleneckAnalysis,
    context: Record<string, unknown>,
  ): Promise<void> {
    const severityMap: Record<BottleneckAnalysis['severity'], AlertSeverity> = {
      low: AlertSeverity.INFO,
      medium: AlertSeverity.WARNING,
      high: AlertSeverity.ERROR,
      critical: AlertSeverity.CRITICAL,
    };

    await this.createAlert({
      ruleId: `bottleneck_${bottleneck.type}`,
      category: AlertCategory.PERFORMANCE_DEGRADATION,
      severity: severityMap[bottleneck.severity],
      title: `Performance Bottleneck Detected: ${bottleneck.type}`,
      description: bottleneck.description,
      source: 'performance_monitor',
      context,
    });
  }

  private async evaluateRules(
    eventType: string,
    context: Record<string, unknown>,
  ): Promise<void> {
    for (const [ruleId, rule] of this.alertRules) {
      if (!rule.enabled) continue;

      // Check if this rule applies to the event type
      if (!rule.triggers.eventTypes.includes(eventType)) continue;

      // Check cooldown period
      const lastTriggered = this.ruleLastTriggered.get(ruleId);
      if (lastTriggered) {
        const timeSinceLastTrigger = Date.now() - lastTriggered.getTime();
        if (timeSinceLastTrigger < rule.cooldownPeriod) continue;
      }

      // Evaluate rule condition
      if (await this.evaluateRuleCondition(rule, context)) {
        await this.triggerRule(rule, context);
        this.ruleLastTriggered.set(ruleId, new Date());
      }
    }
  }

  private async evaluateRuleCondition(
    rule: AlertRule,
    context: Record<string, unknown>,
  ): Promise<boolean> {
    try {
      switch (rule.condition.type) {
        case 'threshold':
          return this.evaluateThresholdCondition(
            rule.condition.parameters,
            context,
          );
        case 'pattern':
          return this.evaluatePatternCondition(
            rule.condition.parameters,
            context,
          );
        case 'anomaly':
          return this.evaluateAnomalyCondition(
            rule.condition.parameters,
            context,
          );
        case 'combination':
          return this.evaluateCombinationCondition(
            rule.condition.parameters,
            context,
          );
        default:
          return false;
      }
    } catch (error) {
      this.logger.error('Rule condition evaluation failed', {
        ruleId: rule.id,
        error,
      });
      return false;
    }
  }

  private evaluateThresholdCondition(
    params: Record<string, unknown>,
    context: Record<string, unknown>,
  ): boolean {
    const { metric, operator, threshold } = params;
    const value = this.getValueFromContext(context, metric);

    if (value === null || value === undefined) return false;
    if (typeof value !== 'number' || typeof threshold !== 'number') return false;

    switch (operator) {
      case '>':
        return value > threshold;
      case '<':
        return value < threshold;
      case '>=':
        return value >= threshold;
      case '<=':
        return value <= threshold;
      case '==':
        return value === threshold;
      case '!=':
        return value !== threshold;
      default:
        return false;
    }
  }

  private evaluatePatternCondition(
    params: Record<string, unknown>,
    context: Record<string, unknown>,
  ): boolean {
    const { field, pattern } = params;
    const value = this.getValueFromContext(context, field);

    if (typeof value !== 'string' || typeof pattern !== 'string') return false;

    const regex = new RegExp(pattern, 'i');
    return regex.test(value);
  }

  private evaluateAnomalyCondition(
    params: Record<string, unknown>,
    context: Record<string, unknown>,
  ): boolean {
    // Simplified anomaly detection - in practice, this would use statistical methods
    const { metric, deviationThreshold = 2 } = params;
    const value = this.getValueFromContext(context, metric);

    if (typeof value !== 'number' || typeof deviationThreshold !== 'number') return false;

    // This would typically compare against historical data and calculate z-score
    // For now, return false as this is a placeholder implementation
    this.logger.debug('Anomaly detection placeholder', {
      metric,
      value,
      deviationThreshold,
    });
    return false;
  }

  private evaluateCombinationCondition(
    params: Record<string, unknown>,
    context: Record<string, unknown>,
  ): boolean {
    const { operator, conditions } = params;

    interface ConditionParams {
      type: 'threshold' | 'pattern' | 'anomaly';
      [key: string]: unknown;
    }

    const conditionsArray = conditions as ConditionParams[];
    const results = conditionsArray.map((condition: ConditionParams) => {
      switch (condition.type) {
        case 'threshold':
          return this.evaluateThresholdCondition(condition, context);
        case 'pattern':
          return this.evaluatePatternCondition(condition, context);
        default:
          return false;
      }
    });

    switch (operator) {
      case 'AND':
        return results.every(Boolean);
      case 'OR':
        return results.some(Boolean);
      case 'NOT':
        return !results[0];
      default:
        return false;
    }
  }

  private getValueFromContext(
    context: Record<string, unknown>,
    path: string | unknown,
  ): unknown {
    if (typeof path !== 'string') {
      return null;
    }

    const keys = path.split('.');
    let value: unknown = context;

    for (const key of keys) {
      if (value && typeof value === 'object' && value !== null && key in value) {
        value = (value as Record<string, unknown>)[key];
      } else {
        return null;
      }
    }

    return value;
  }

  private async triggerRule(
    rule: AlertRule,
    context: Record<string, unknown>,
  ): Promise<void> {
    await this.createAlert({
      ruleId: rule.id,
      category: rule.category,
      severity: rule.severity,
      title: rule.name,
      description: rule.description,
      source: 'alert_system',
      context,
    });
  }

  private async createAlert(alertData: {
    ruleId: string;
    category: AlertCategory;
    severity: AlertSeverity;
    title: string;
    description: string;
    source: string;
    context: Record<string, unknown>;
  }): Promise<Alert> {
    // Check for suppression
    if (this.isAlertSuppressed(alertData.title)) {
      this.logger.debug('Alert suppressed', { title: alertData.title });
      throw new Error('Alert was suppressed'); // Suppressed alerts should not be created
    }

    const alert: Alert = {
      id: this.generateAlertId(),
      ...alertData,
      timestamp: new Date(),
      status: 'active',
      escalationLevel: 0,
      notifications: [],
      remediationActions: [],
    };

    this.activeAlerts.set(alert.id, alert);

    // Send notifications
    const rule = this.alertRules.get(alert.ruleId);
    if (rule?.actions.notifications) {
      await this.sendNotifications(alert, rule.actions.notifications);
    }

    // Setup escalation if configured
    if (rule?.actions.escalation) {
      this.setupEscalation(alert, rule.actions.escalation);
    }

    // Attempt auto-remediation if configured
    if (rule?.actions.remediation?.autoRemediate) {
      await this.attemptAutoRemediation(alert, rule.actions.remediation);
    }

    this.emit('alert:created', { alert });
    this.logger.info('Alert created', {
      id: alert.id,
      category: alert.category,
      severity: alert.severity,
      title: alert.title,
    });

    return alert;
  }

  private isAlertSuppressed(title: string): boolean {
    for (const [, suppression] of this.suppressionRules) {
      if (suppression.pattern.test(title)) {
        return true;
      }
    }
    return false;
  }

  private async sendNotifications(
    alert: Alert,
    config: AlertRule['actions']['notifications'],
  ): Promise<void> {
    for (const channel of config.channels) {
      try {
        const delivery = this.notificationDeliveries.get(channel);
        if (!delivery) {
          this.logger.warning('Notification channel not configured', {
            channel,
          });
          continue;
        }

        const notification = {
          channel,
          timestamp: new Date(),
          status: 'pending' as const,
        };

        alert.notifications.push(notification);

        const success = await delivery.send(
          alert,
          config.recipients || [],
          config.template,
        );

        notification.status = success ? 'sent' : 'failed';

        if (success) {
          this.logger.info('Notification sent', { alertId: alert.id, channel });
        } else {
          this.logger.error('Notification failed', {
            alertId: alert.id,
            channel,
          });
        }
      } catch (error) {
        this.logger.error('Notification delivery failed', {
          alertId: alert.id,
          channel,
          error,
        });
      }
    }
  }

  private setupEscalation(
    alert: Alert,
    config: AlertRule['actions']['escalation'],
  ): void {
    const timer = setTimeout(async () => {
      if (alert.status === 'active') {
        alert.escalationLevel++;
        this.emit('alert:escalated', {
          alert,
          escalationLevel: alert.escalationLevel,
        });

        this.logger.warning('Alert escalated', {
          alertId: alert.id,
          escalationLevel: alert.escalationLevel,
        });

        // Send escalation notifications
        // Implementation would send notifications to escalation contacts
      }
    }, config.escalateAfter);

    this.escalationTimers.set(alert.id, timer);
  }

  private async attemptAutoRemediation(
    alert: Alert,
    config: AlertRule['actions']['remediation'],
  ): Promise<void> {
    for (const action of config.actions) {
      const remediationAction = {
        action,
        timestamp: new Date(),
        status: 'running' as const,
      };

      alert.remediationActions.push(remediationAction);

      try {
        // Execute remediation action
        // Implementation would execute the specific remediation action
        const result = await this.executeRemediationAction(action, alert);

        remediationAction.status = 'completed';
        remediationAction.result = result;

        this.logger.info('Auto-remediation completed', {
          alertId: alert.id,
          action,
          result,
        });
      } catch (error) {
        remediationAction.status = 'failed';
        remediationAction.error = (error as Error).message;

        this.logger.error('Auto-remediation failed', {
          alertId: alert.id,
          action,
          error,
        });
      }
    }
  }

  private async executeRemediationAction(
    action: string,
    alert: Alert,
  ): Promise<{ action: string; success: boolean }> {
    // Placeholder for remediation action execution
    // In practice, this would map to specific remediation strategies
    this.logger.info('Executing remediation action', {
      action,
      alertId: alert.id,
      category: alert.category,
    });

    switch (action) {
      case 'restart_agent':
        // Implementation would restart the failing agent
        return { action: 'restart_agent', success: true };
      case 'scale_resources':
        // Implementation would scale system resources
        return { action: 'scale_resources', success: true };
      default:
        throw new Error(`Unknown remediation action: ${action}`);
    }
  }

  private setupDefaultRules(): void {
    const defaultRules: AlertRule[] = [
      {
        id: 'task_failure_critical',
        name: 'Critical Task Failure',
        description: 'Alert when a critical priority task fails',
        category: AlertCategory.TASK_FAILURE,
        severity: AlertSeverity.CRITICAL,
        enabled: true,
        condition: {
          type: 'combination',
          parameters: {
            operator: 'AND',
            conditions: [
              {
                type: 'threshold',
                metric: 'taskPriority',
                operator: '==',
                threshold: 'critical',
              },
              {
                type: 'threshold',
                metric: 'newStatus',
                operator: '==',
                threshold: 'failed',
              },
            ],
          },
        },
        triggers: {
          eventTypes: ['task_status_update'],
        },
        actions: {
          notifications: {
            channels: [
              NotificationChannel.CONSOLE,
              NotificationChannel.DASHBOARD,
            ],
          },
          escalation: {
            escalateAfter: 300000, // 5 minutes
            escalateTo: ['admin'],
          },
        },
        cooldownPeriod: this.defaultCooldownPeriod,
      },
      {
        id: 'agent_offline_extended',
        name: 'Agent Offline Extended',
        description: 'Alert when an agent is offline for more than 10 minutes',
        category: AlertCategory.AGENT_OFFLINE,
        severity: AlertSeverity.WARNING,
        enabled: true,
        condition: {
          type: 'threshold',
          parameters: {
            metric: 'minutesOffline',
            operator: '>',
            threshold: 10,
          },
        },
        triggers: {
          eventTypes: ['agent_status_update'],
        },
        actions: {
          notifications: {
            channels: [NotificationChannel.CONSOLE],
          },
        },
        cooldownPeriod: this.defaultCooldownPeriod,
      },
    ];

    defaultRules.forEach((rule) => this.registerRule(rule));
  }

  private setupDefaultNotificationChannels(): void {
    // Console notification channel
    this.registerNotificationChannel(NotificationChannel.CONSOLE, {
      channel: NotificationChannel.CONSOLE,
      async send(alert: Alert): Promise<boolean> {
        console.log(
          `🚨 ALERT [${alert.severity.toUpperCase()}]: ${alert.title}`,
        );
        console.log(`   Description: ${alert.description}`);
        console.log(`   Time: ${alert.timestamp.toISOString()}`);
        console.log(`   Source: ${alert.source}`);
        return true;
      },
    });

    // Dashboard notification channel (placeholder)
    this.registerNotificationChannel(NotificationChannel.DASHBOARD, {
      channel: NotificationChannel.DASHBOARD,
      async send(_alert: Alert): Promise<boolean> {
        // In practice, this would update a dashboard UI
        return true;
      },
    });
  }

  private setupPeriodicMaintenance(): void {
    // Clean up old alert history every hour
    setInterval(
      () => {
        this.cleanupAlertHistory();
      },
      60 * 60 * 1000,
    );
  }

  private cleanupAlertHistory(): void {
    if (this.alertHistory.length > this.maxAlertHistory) {
      this.alertHistory = this.alertHistory
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, this.maxAlertHistory);

      this.logger.debug('Alert history cleaned up', {
        remainingAlerts: this.alertHistory.length,
      });
    }
  }

  private generateAlertId(): string {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    return `alert_${timestamp}_${randomString}`;
  }

  // Analytics calculation methods

  private calculateCountsByCategory(
    alerts: Alert[],
  ): Record<AlertCategory, number> {
    const counts = {} as Record<AlertCategory, number>;
    Object.values(AlertCategory).forEach((category) => {
      counts[category] = alerts.filter(
        (alert) => alert.category === category,
      ).length;
    });
    return counts;
  }

  private calculateCountsBySeverity(
    alerts: Alert[],
  ): Record<AlertSeverity, number> {
    const counts = {} as Record<AlertSeverity, number>;
    Object.values(AlertSeverity).forEach((severity) => {
      counts[severity] = alerts.filter(
        (alert) => alert.severity === severity,
      ).length;
    });
    return counts;
  }

  private calculateCountsByStatus(
    alerts: Alert[],
  ): Record<Alert['status'], number> {
    const counts = {
      active: 0,
      acknowledged: 0,
      resolved: 0,
      suppressed: 0,
    };

    alerts.forEach((alert) => {
      counts[alert.status]++;
    });

    return counts;
  }

  private calculateHourlyTrends(alerts: Alert[], hours: number): number[] {
    const trends: number[] = [];
    const now = Date.now();

    for (let i = hours - 1; i >= 0; i--) {
      const hourStart = now - (i + 1) * 60 * 60 * 1000;
      const hourEnd = now - i * 60 * 60 * 1000;

      const hourAlerts = alerts.filter(
        (alert) =>
          alert.timestamp.getTime() >= hourStart &&
          alert.timestamp.getTime() < hourEnd,
      );

      trends.push(hourAlerts.length);
    }

    return trends;
  }

  private calculateTopCategories(
    alerts: Alert[],
  ): Array<{ category: AlertCategory; count: number }> {
    const categoryCounts = this.calculateCountsByCategory(alerts);
    return Object.entries(categoryCounts)
      .map(([category, count]) => ({
        category: category as AlertCategory,
        count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }

  private calculateResolutionTimes(alerts: Alert[]): number[] {
    return alerts
      .filter((alert) => alert.resolvedAt && alert.timestamp)
      .map((alert) => alert.resolvedAt!.getTime() - alert.timestamp.getTime());
  }

  private calculateEscalationRates(_alerts: Alert[]): number[] {
    // Placeholder implementation
    return [];
  }

  private calculateAverageResolutionTime(alerts: Alert[]): number {
    const resolutionTimes = this.calculateResolutionTimes(alerts);
    return resolutionTimes.length > 0
      ? resolutionTimes.reduce((a, b) => a + b) / resolutionTimes.length
      : 0;
  }

  private calculateResolutionRate(alerts: Alert[]): number {
    const resolvedAlerts = alerts.filter(
      (alert) => alert.status === 'resolved',
    ).length;
    return alerts.length > 0 ? (resolvedAlerts / alerts.length) * 100 : 100;
  }

  private calculateEscalationRate(alerts: Alert[]): number {
    const escalatedAlerts = alerts.filter(
      (alert) => alert.escalationLevel > 0,
    ).length;
    return alerts.length > 0 ? (escalatedAlerts / alerts.length) * 100 : 0;
  }

  private calculateAutoRemediationSuccessRate(alerts: Alert[]): number {
    const autoRemediatedAlerts = alerts.filter((alert) =>
      alert.remediationActions.some((action) => action.status === 'completed'),
    );
    const attemptedAutoRemediationAlerts = alerts.filter(
      (alert) => alert.remediationActions.length > 0,
    );

    return attemptedAutoRemediationAlerts.length > 0
      ? (autoRemediatedAlerts.length / attemptedAutoRemediationAlerts.length) *
          100
      : 100;
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    // Clear all escalation timers
    for (const timer of this.escalationTimers.values()) {
      clearTimeout(timer);
    }

    this.removeAllListeners();
    this.alertRules.clear();
    this.activeAlerts.clear();
    this.alertHistory.length = 0;
    this.ruleLastTriggered.clear();
    this.notificationDeliveries.clear();
    this.escalationTimers.clear();
    this.suppressionRules.clear();

    this.logger.info('AlertSystem destroyed');
  }
}

/**
 * Singleton instance for global access
 */
export const alertSystem = new AlertSystem();
