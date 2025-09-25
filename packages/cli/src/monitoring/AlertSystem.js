/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { EventEmitter } from 'node:events';
import { Logger } from '../utils/logger.js';
/**
 * Alert severity levels
 */
export var AlertSeverity;
(function (AlertSeverity) {
  AlertSeverity['INFO'] = 'info';
  AlertSeverity['WARNING'] = 'warning';
  AlertSeverity['ERROR'] = 'error';
  AlertSeverity['CRITICAL'] = 'critical';
})(AlertSeverity || (AlertSeverity = {}));
/**
 * Alert categories for classification
 */
export var AlertCategory;
(function (AlertCategory) {
  AlertCategory['TASK_FAILURE'] = 'task_failure';
  AlertCategory['TASK_DELAY'] = 'task_delay';
  AlertCategory['AGENT_OFFLINE'] = 'agent_offline';
  AlertCategory['PERFORMANCE_DEGRADATION'] = 'performance_degradation';
  AlertCategory['RESOURCE_EXHAUSTION'] = 'resource_exhaustion';
  AlertCategory['SECURITY_INCIDENT'] = 'security_incident';
  AlertCategory['SYSTEM_ERROR'] = 'system_error';
  AlertCategory['DEPENDENCY_FAILURE'] = 'dependency_failure';
})(AlertCategory || (AlertCategory = {}));
/**
 * Alert notification channels
 */
export var NotificationChannel;
(function (NotificationChannel) {
  NotificationChannel['EMAIL'] = 'email';
  NotificationChannel['SLACK'] = 'slack';
  NotificationChannel['WEBHOOK'] = 'webhook';
  NotificationChannel['SMS'] = 'sms';
  NotificationChannel['CONSOLE'] = 'console';
  NotificationChannel['DASHBOARD'] = 'dashboard';
})(NotificationChannel || (NotificationChannel = {}));
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
  logger;
  alertRules;
  activeAlerts;
  alertHistory;
  ruleLastTriggered;
  notificationDeliveries;
  escalationTimers;
  suppressionRules;
  maxAlertHistory = 10000;
  defaultCooldownPeriod = 300000; // 5 minutes
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
  registerRule(rule) {
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
  updateRule(ruleId, updates) {
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
  deleteRule(ruleId) {
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
  async processTaskStatusUpdate(task, update) {
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
  async processAgentStatusUpdate(agent) {
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
  async processPerformanceBottleneck(bottleneck) {
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
  async acknowledgeAlert(alertId, acknowledgedBy) {
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
  async resolveAlert(alertId, resolvedBy, resolution) {
    const alert = this.activeAlerts.get(alertId);
    if (!alert) return false;
    alert.status = 'resolved';
    alert.resolvedAt = new Date();
    if (resolution) {
      alert.context.resolution = resolution;
      alert.context.resolvedBy = resolvedBy;
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
  suppressAlerts(pattern, durationMs) {
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
  getActiveAlerts(filters) {
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
  getAlertAnalytics(hours = 24) {
    const periodStart = new Date(Date.now() - hours * 60 * 60 * 1000);
    const periodEnd = new Date();
    const periodAlerts = this.alertHistory
      .filter((alert) => alert.timestamp >= periodStart)
      .concat(Array.from(this.activeAlerts.values()));
    const analytics = {
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
  registerNotificationChannel(channel, delivery) {
    this.notificationDeliveries.set(channel, delivery);
    this.logger.info('Notification channel registered', { channel });
  }
  // Private methods
  async evaluateTaskFailureAlerts(task, update, context) {
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
  async evaluateTaskDelayAlerts(task, update, context) {
    const overrunPercent =
      (task.actualDuration / task.estimatedDuration) * 100 - 100;
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
  async evaluateTaskBlockingAlerts(task, update, context) {
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
  async evaluateAgentOfflineAlerts(agent, context) {
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
  async evaluateAgentPerformanceAlerts(agent, context) {
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
  async evaluateBottleneckAlerts(bottleneck, context) {
    const severityMap = {
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
  async evaluateRules(eventType, context) {
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
  async evaluateRuleCondition(rule, context) {
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
  evaluateThresholdCondition(params, context) {
    const { metric, operator, threshold } = params;
    const value = this.getValueFromContext(context, metric);
    if (value === null || value === undefined) return false;
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
  evaluatePatternCondition(params, context) {
    const { field, pattern } = params;
    const value = this.getValueFromContext(context, field);
    if (typeof value !== 'string') return false;
    const regex = new RegExp(pattern, 'i');
    return regex.test(value);
  }
  evaluateAnomalyCondition(params, context) {
    // Simplified anomaly detection - in practice, this would use statistical methods
    const { metric, deviationThreshold = 2 } = params;
    const value = this.getValueFromContext(context, metric);
    if (typeof value !== 'number') return false;
    // This would typically compare against historical data and calculate z-score
    return false; // Placeholder
  }
  evaluateCombinationCondition(params, context) {
    const { operator, conditions } = params;
    const results = conditions.map((condition) => {
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
  getValueFromContext(context, path) {
    const keys = path.split('.');
    let value = context;
    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        return null;
      }
    }
    return value;
  }
  async triggerRule(rule, context) {
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
  async createAlert(alertData) {
    // Check for suppression
    if (this.isAlertSuppressed(alertData.title)) {
      this.logger.debug('Alert suppressed', { title: alertData.title });
      return null; // Suppressed alerts don't get created
    }
    const alert = {
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
  isAlertSuppressed(title) {
    for (const [, suppression] of this.suppressionRules) {
      if (suppression.pattern.test(title)) {
        return true;
      }
    }
    return false;
  }
  async sendNotifications(alert, config) {
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
          status: 'pending',
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
  setupEscalation(alert, config) {
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
  async attemptAutoRemediation(alert, config) {
    for (const action of config.actions) {
      const remediationAction = {
        action,
        timestamp: new Date(),
        status: 'running',
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
        remediationAction.error = error.message;
        this.logger.error('Auto-remediation failed', {
          alertId: alert.id,
          action,
          error,
        });
      }
    }
  }
  async executeRemediationAction(action, alert) {
    // Placeholder for remediation action execution
    // In practice, this would map to specific remediation strategies
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
  setupDefaultRules() {
    const defaultRules = [
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
  setupDefaultNotificationChannels() {
    // Console notification channel
    this.registerNotificationChannel(NotificationChannel.CONSOLE, {
      channel: NotificationChannel.CONSOLE,
      async send(alert) {
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
      async send(alert) {
        // In practice, this would update a dashboard UI
        return true;
      },
    });
  }
  setupPeriodicMaintenance() {
    // Clean up old alert history every hour
    setInterval(
      () => {
        this.cleanupAlertHistory();
      },
      60 * 60 * 1000,
    );
  }
  cleanupAlertHistory() {
    if (this.alertHistory.length > this.maxAlertHistory) {
      this.alertHistory = this.alertHistory
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, this.maxAlertHistory);
      this.logger.debug('Alert history cleaned up', {
        remainingAlerts: this.alertHistory.length,
      });
    }
  }
  generateAlertId() {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    return `alert_${timestamp}_${randomString}`;
  }
  // Analytics calculation methods
  calculateCountsByCategory(alerts) {
    const counts = {};
    Object.values(AlertCategory).forEach((category) => {
      counts[category] = alerts.filter(
        (alert) => alert.category === category,
      ).length;
    });
    return counts;
  }
  calculateCountsBySeverity(alerts) {
    const counts = {};
    Object.values(AlertSeverity).forEach((severity) => {
      counts[severity] = alerts.filter(
        (alert) => alert.severity === severity,
      ).length;
    });
    return counts;
  }
  calculateCountsByStatus(alerts) {
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
  calculateHourlyTrends(alerts, hours) {
    const trends = [];
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
  calculateTopCategories(alerts) {
    const categoryCounts = this.calculateCountsByCategory(alerts);
    return Object.entries(categoryCounts)
      .map(([category, count]) => ({
        category,
        count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }
  calculateResolutionTimes(alerts) {
    return alerts
      .filter((alert) => alert.resolvedAt && alert.timestamp)
      .map((alert) => alert.resolvedAt.getTime() - alert.timestamp.getTime());
  }
  calculateEscalationRates(alerts) {
    // Placeholder implementation
    return [];
  }
  calculateAverageResolutionTime(alerts) {
    const resolutionTimes = this.calculateResolutionTimes(alerts);
    return resolutionTimes.length > 0
      ? resolutionTimes.reduce((a, b) => a + b) / resolutionTimes.length
      : 0;
  }
  calculateResolutionRate(alerts) {
    const resolvedAlerts = alerts.filter(
      (alert) => alert.status === 'resolved',
    ).length;
    return alerts.length > 0 ? (resolvedAlerts / alerts.length) * 100 : 100;
  }
  calculateEscalationRate(alerts) {
    const escalatedAlerts = alerts.filter(
      (alert) => alert.escalationLevel > 0,
    ).length;
    return alerts.length > 0 ? (escalatedAlerts / alerts.length) * 100 : 0;
  }
  calculateAutoRemediationSuccessRate(alerts) {
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
  destroy() {
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
//# sourceMappingURL=AlertSystem.js.map
