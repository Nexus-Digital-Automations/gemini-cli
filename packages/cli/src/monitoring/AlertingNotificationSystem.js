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
export let AlertSeverity;
(function (AlertSeverity) {
    AlertSeverity["INFO"] = "info";
    AlertSeverity["WARNING"] = "warning";
    AlertSeverity["ERROR"] = "error";
    AlertSeverity["CRITICAL"] = "critical";
})(AlertSeverity || (AlertSeverity = {}));
/**
 * Alert types for different monitoring scenarios
 */
export let AlertType;
(function (AlertType) {
    AlertType["PERFORMANCE_THRESHOLD"] = "performance:threshold";
    AlertType["SYSTEM_HEALTH"] = "system:health";
    AlertType["TASK_FAILURE"] = "task:failure";
    AlertType["AGENT_OFFLINE"] = "agent:offline";
    AlertType["SECURITY_VIOLATION"] = "security:violation";
    AlertType["COMPLIANCE_ISSUE"] = "compliance:issue";
    AlertType["RESOURCE_EXHAUSTION"] = "resource:exhaustion";
    AlertType["SLA_BREACH"] = "sla:breach";
    AlertType["ANOMALY_DETECTED"] = "anomaly:detected";
    AlertType["TREND_CHANGE"] = "trend:change";
})(AlertType || (AlertType = {}));
/**
 * Notification channels
 */
export let NotificationChannel;
(function (NotificationChannel) {
    NotificationChannel["EMAIL"] = "email";
    NotificationChannel["SMS"] = "sms";
    NotificationChannel["SLACK"] = "slack";
    NotificationChannel["WEBHOOK"] = "webhook";
    NotificationChannel["DASHBOARD"] = "dashboard";
    NotificationChannel["LOG"] = "log";
    NotificationChannel["CONSOLE"] = "console";
})(NotificationChannel || (NotificationChannel = {}));
/**
 * Advanced Alerting and Notification System
 *
 * Provides comprehensive real-time alerting with intelligent thresholding,
 * multi-channel notifications, escalation policies, and alert lifecycle management.
 */
export class AlertingNotificationSystem extends EventEmitter {
    logger;
    alertRules;
    activeAlerts;
    alertHistory;
    notificationTemplates;
    throttleState;
    suppressed; // ruleId -> suppressedUntil
    // Performance tracking
    metricsBuffer;
    anomalyDetector;
    trendAnalyzer;
    // System state
    processingInterval;
    escalationInterval;
    cleanupInterval;
    constructor(options = {}) {
        super();
        this.logger = new Logger('AlertingNotificationSystem');
        this.alertRules = new Map();
        this.activeAlerts = new Map();
        this.alertHistory = [];
        this.notificationTemplates = new Map();
        this.throttleState = new Map();
        this.suppressed = new Map();
        this.metricsBuffer = new Map();
        this.anomalyDetector = new AnomalyDetector(options.anomalyThreshold || 2.0);
        this.trendAnalyzer = new TrendAnalyzer();
        this.initializeDefaultTemplates();
        this.initializeDefaultRules();
        this.setupPeriodicProcessing(options.processingIntervalMs || 10000); // 10 seconds
        this.logger.info('AlertingNotificationSystem initialized', {
            timestamp: new Date().toISOString(),
        });
    }
    /**
     * Create a new alert rule
     */
    createAlertRule(rule) {
        const alertRule = {
            ...rule,
            id: this.generateRuleId(),
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        this.alertRules.set(alertRule.id, alertRule);
        this.emit('rule:created', { rule: alertRule });
        this.logger.info('Alert rule created', {
            ruleId: alertRule.id,
            name: alertRule.name,
            type: alertRule.type,
            severity: alertRule.severity,
        });
        return alertRule.id;
    }
    /**
     * Update an existing alert rule
     */
    updateAlertRule(ruleId, updates) {
        const rule = this.alertRules.get(ruleId);
        if (!rule)
            return false;
        const updatedRule = {
            ...rule,
            ...updates,
            updatedAt: new Date(),
        };
        this.alertRules.set(ruleId, updatedRule);
        this.emit('rule:updated', { rule: updatedRule, changes: updates });
        this.logger.info('Alert rule updated', {
            ruleId,
            changes: Object.keys(updates),
        });
        return true;
    }
    /**
     * Delete an alert rule
     */
    deleteAlertRule(ruleId) {
        const rule = this.alertRules.get(ruleId);
        if (!rule)
            return false;
        this.alertRules.delete(ruleId);
        // Resolve any active alerts for this rule
        for (const alert of this.activeAlerts.values()) {
            if (alert.ruleId === ruleId) {
                this.resolveAlert(alert.id, 'rule_deleted');
            }
        }
        this.emit('rule:deleted', { rule });
        this.logger.info('Alert rule deleted', { ruleId, ruleName: rule.name });
        return true;
    }
    /**
     * Process performance metrics for alerting
     */
    onMetricReceived(metric) {
        // Add to buffer for analysis
        if (!this.metricsBuffer.has(metric.name)) {
            this.metricsBuffer.set(metric.name, []);
        }
        const buffer = this.metricsBuffer.get(metric.name);
        buffer.push(metric);
        // Keep only last 1000 metrics per type
        if (buffer.length > 1000) {
            buffer.shift();
        }
        // Check metric-based alert rules
        this.checkMetricAlertRules(metric);
        // Detect anomalies
        const isAnomaly = this.anomalyDetector.detectAnomaly(metric.name, metric.value);
        if (isAnomaly) {
            this.triggerAnomalyAlert(metric);
        }
        // Analyze trends
        const trendChange = this.trendAnalyzer.analyzeTrend(metric.name, metric.value);
        if (trendChange.significant) {
            this.triggerTrendAlert(metric, trendChange);
        }
    }
    /**
     * Process audit events for alerting
     */
    onAuditEvent(event) {
        // Check event-based alert rules
        this.checkEventAlertRules(event);
        // Check for security violations
        if (event.category === 'security' && event.severity === 'critical') {
            this.triggerSecurityAlert(event);
        }
        // Check for compliance issues
        if (event.outcome === 'failure' && event.category === 'compliance') {
            this.triggerComplianceAlert(event);
        }
    }
    /**
     * Process analytics insights for alerting
     */
    onInsightGenerated(insight) {
        if (insight.severity === 'critical' || insight.impact === 'high') {
            this.triggerInsightAlert(insight);
        }
    }
    /**
     * Process system health changes
     */
    onSystemHealthChange(health) {
        // Check system health thresholds
        if (health.cpuUsage > 0.9) {
            this.triggerSystemHealthAlert('cpu', health.cpuUsage, 'CPU usage critically high');
        }
        if (health.memoryUsage > 0.85) {
            this.triggerSystemHealthAlert('memory', health.memoryUsage, 'Memory usage critically high');
        }
        if (health.errorRate > 0.15) {
            this.triggerSystemHealthAlert('error_rate', health.errorRate, 'Error rate above threshold');
        }
        if (health.activeAgents === 0) {
            this.triggerSystemHealthAlert('agents', 0, 'No active agents available');
        }
    }
    /**
     * Acknowledge an alert
     */
    acknowledgeAlert(alertId, acknowledgedBy, notes) {
        const alert = this.activeAlerts.get(alertId);
        if (!alert || alert.status !== 'active')
            return false;
        alert.status = 'acknowledged';
        alert.acknowledgedBy = acknowledgedBy;
        alert.acknowledgedAt = new Date();
        if (notes) {
            alert.notes.push(`Acknowledged by ${acknowledgedBy}: ${notes}`);
        }
        this.emit('alert:acknowledged', { alert, acknowledgedBy });
        this.logger.info('Alert acknowledged', {
            alertId,
            acknowledgedBy,
            ruleName: alert.ruleName,
        });
        return true;
    }
    /**
     * Resolve an alert
     */
    resolveAlert(alertId, resolution) {
        const alert = this.activeAlerts.get(alertId);
        if (!alert)
            return false;
        alert.status = 'resolved';
        alert.resolvedAt = new Date();
        alert.notes.push(`Resolved: ${resolution}`);
        // Move to history
        this.alertHistory.push(alert);
        this.activeAlerts.delete(alertId);
        this.emit('alert:resolved', { alert, resolution });
        this.logger.info('Alert resolved', {
            alertId,
            resolution,
            ruleName: alert.ruleName,
        });
        return true;
    }
    /**
     * Suppress alerts for a rule temporarily
     */
    suppressRule(ruleId, durationMs, reason) {
        const rule = this.alertRules.get(ruleId);
        if (!rule)
            return false;
        const suppressUntil = new Date(Date.now() + durationMs);
        this.suppressed.set(ruleId, suppressUntil);
        this.emit('rule:suppressed', { ruleId, suppressUntil, reason });
        this.logger.info('Alert rule suppressed', {
            ruleId,
            duration: durationMs,
            reason,
            suppressUntil,
        });
        return true;
    }
    /**
     * Get alert dashboard data
     */
    getDashboardData() {
        const activeAlerts = Array.from(this.activeAlerts.values());
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const alertsToday = this.alertHistory.filter((alert) => alert.triggeredAt >= today);
        const resolvedAlerts = this.alertHistory.filter((alert) => alert.resolvedAt && alert.triggeredAt >= today);
        const mttr = resolvedAlerts.length > 0
            ? resolvedAlerts.reduce((sum, alert) => sum + (alert.resolvedAt.getTime() - alert.triggeredAt.getTime()), 0) /
                resolvedAlerts.length /
                1000 /
                60 // minutes
            : 0;
        return {
            activeAlerts,
            alertsBySeverity: this.groupAlertsBySeverity(activeAlerts),
            alertsByType: this.groupAlertsByType(activeAlerts),
            recentAlerts: [...activeAlerts, ...this.alertHistory.slice(-10)]
                .sort((a, b) => b.triggeredAt.getTime() - a.triggeredAt.getTime())
                .slice(0, 20),
            topAlertRules: this.getTopAlertRules(10),
            systemHealth: {
                totalRules: this.alertRules.size,
                enabledRules: Array.from(this.alertRules.values()).filter((r) => r.enabled).length,
                suppressedRules: this.suppressed.size,
                alertsToday: alertsToday.length,
                mttr,
                escalatedAlerts: activeAlerts.filter((a) => a.escalationLevel && a.escalationLevel > 0).length,
            },
        };
    }
    /**
     * Get alert statistics and analytics
     */
    getAnalytics(timeRange) {
        const alerts = timeRange
            ? this.alertHistory.filter((alert) => alert.triggeredAt >= timeRange.start &&
                alert.triggeredAt <= timeRange.end)
            : this.alertHistory;
        return {
            totalAlerts: alerts.length,
            alertTrends: this.calculateAlertTrends(alerts),
            topAlertRules: this.calculateTopRuleMetrics(alerts),
            performanceMetrics: this.calculatePerformanceMetrics(alerts),
        };
    }
    /**
     * Export alert data
     */
    exportAlerts(format = 'json', includeResolved = true) {
        const alerts = includeResolved
            ? [...this.activeAlerts.values(), ...this.alertHistory]
            : Array.from(this.activeAlerts.values());
        if (format === 'json') {
            return JSON.stringify({
                exportedAt: new Date().toISOString(),
                totalAlerts: alerts.length,
                activeAlerts: this.activeAlerts.size,
                alerts: alerts.sort((a, b) => b.triggeredAt.getTime() - a.triggeredAt.getTime()),
            }, null, 2);
        }
        // CSV format
        const headers = [
            'ID',
            'Rule Name',
            'Type',
            'Severity',
            'Title',
            'Status',
            'Triggered At',
            'Resolved At',
            'Assigned To',
            'Tags',
        ];
        const rows = alerts.map((alert) => [
            alert.id,
            alert.ruleName,
            alert.type,
            alert.severity,
            alert.title,
            alert.status,
            alert.triggeredAt.toISOString(),
            alert.resolvedAt?.toISOString() || '',
            alert.assignedTo || '',
            alert.tags.join(';'),
        ]);
        return [headers, ...rows]
            .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
            .join('\n');
    }
    // Private methods
    initializeDefaultTemplates() {
        const templates = [
            {
                id: 'default-email',
                name: 'Default Email Template',
                channel: NotificationChannel.EMAIL,
                subject: 'Alert: {{title}} ({{severity}})',
                body: `
Alert Details:
- Title: {{title}}
- Severity: {{severity}}
- Type: {{type}}
- Description: {{description}}
- Triggered At: {{triggeredAt}}
- Affected Resources: {{affectedResources}}

Please take appropriate action.
        `,
                variables: [
                    'title',
                    'severity',
                    'type',
                    'description',
                    'triggeredAt',
                    'affectedResources',
                ],
                format: 'text',
            },
            {
                id: 'default-slack',
                name: 'Default Slack Template',
                channel: NotificationChannel.SLACK,
                subject: '',
                body: `
🚨 *{{title}}* ({{severity}})
*Type:* {{type}}
*Description:* {{description}}
*Triggered:* {{triggeredAt}}
*Affected:* {{affectedResources}}
        `,
                variables: [
                    'title',
                    'severity',
                    'type',
                    'description',
                    'triggeredAt',
                    'affectedResources',
                ],
                format: 'markdown',
            },
        ];
        for (const template of templates) {
            this.notificationTemplates.set(template.id, template);
        }
    }
    initializeDefaultRules() {
        const defaultRules = [
            {
                name: 'High CPU Usage',
                description: 'Alert when CPU usage exceeds 80%',
                type: AlertType.SYSTEM_HEALTH,
                severity: AlertSeverity.WARNING,
                enabled: true,
                conditions: [
                    {
                        type: 'metric',
                        metric: 'cpu_usage',
                        operator: 'gt',
                        threshold: 0.8,
                        timeWindow: 300000, // 5 minutes
                        aggregation: 'avg',
                    },
                ],
                actions: [
                    {
                        type: 'notification',
                        channel: NotificationChannel.EMAIL,
                        recipients: ['admin@example.com'],
                        template: 'default-email',
                    },
                ],
                throttle: {
                    enabled: true,
                    windowMs: 900000, // 15 minutes
                    maxAlerts: 1,
                },
                tags: ['system', 'performance'],
                metadata: {},
            },
            {
                name: 'Task Failure Rate',
                description: 'Alert when task failure rate exceeds 10%',
                type: AlertType.PERFORMANCE_THRESHOLD,
                severity: AlertSeverity.ERROR,
                enabled: true,
                conditions: [
                    {
                        type: 'metric',
                        metric: 'task_failure_rate',
                        operator: 'gt',
                        threshold: 0.1,
                        timeWindow: 600000, // 10 minutes
                        aggregation: 'rate',
                    },
                ],
                actions: [
                    {
                        type: 'notification',
                        channel: NotificationChannel.SLACK,
                        recipients: ['#alerts'],
                        template: 'default-slack',
                    },
                ],
                throttle: {
                    enabled: true,
                    windowMs: 1800000, // 30 minutes
                    maxAlerts: 1,
                },
                escalation: {
                    levels: [
                        {
                            level: 1,
                            delayMs: 1800000, // 30 minutes
                            actions: [
                                {
                                    type: 'notification',
                                    channel: NotificationChannel.EMAIL,
                                    recipients: ['team-lead@example.com'],
                                },
                            ],
                        },
                    ],
                    timeoutMs: 3600000, // 1 hour
                },
                tags: ['tasks', 'reliability'],
                metadata: {},
            },
        ];
        for (const rule of defaultRules) {
            this.createAlertRule(rule);
        }
    }
    setupPeriodicProcessing(intervalMs) {
        this.processingInterval = setInterval(() => {
            this.processAlerts();
        }, intervalMs);
        this.escalationInterval = setInterval(() => {
            this.processEscalations();
        }, 60000); // Check escalations every minute
        this.cleanupInterval = setInterval(() => {
            this.cleanupOldData();
        }, 3600000); // Cleanup every hour
    }
    processAlerts() {
        // Process suppression expiry
        for (const [ruleId, suppressUntil] of this.suppressed.entries()) {
            if (new Date() >= suppressUntil) {
                this.suppressed.delete(ruleId);
                this.emit('rule:suppression-expired', { ruleId });
            }
        }
        // Reset throttle windows
        const now = Date.now();
        for (const [ruleId, state] of this.throttleState.entries()) {
            if (now - state.windowStart > 3600000) {
                // 1 hour window
                this.throttleState.delete(ruleId);
            }
        }
    }
    processEscalations() {
        for (const alert of this.activeAlerts.values()) {
            const rule = this.alertRules.get(alert.ruleId);
            if (!rule?.escalation || alert.status !== 'active')
                continue;
            const timeSinceTriggered = Date.now() - alert.triggeredAt.getTime();
            const currentLevel = alert.escalationLevel || 0;
            for (const level of rule.escalation.levels) {
                if (level.level > currentLevel && timeSinceTriggered >= level.delayMs) {
                    this.escalateAlert(alert, level);
                    break;
                }
            }
        }
    }
    cleanupOldData() {
        // Keep only last 10,000 alerts in history
        if (this.alertHistory.length > 10000) {
            this.alertHistory = this.alertHistory.slice(-10000);
        }
        // Clean up old metrics buffer
        for (const [metric, buffer] of this.metricsBuffer.entries()) {
            const oneHourAgo = Date.now() - 3600000;
            const filteredBuffer = buffer.filter((m) => m.timestamp.getTime() > oneHourAgo);
            this.metricsBuffer.set(metric, filteredBuffer);
        }
    }
    checkMetricAlertRules(metric) {
        for (const rule of this.alertRules.values()) {
            if (!rule.enabled || this.suppressed.has(rule.id))
                continue;
            for (const condition of rule.conditions) {
                if (condition.type === 'metric' && condition.metric === metric.name) {
                    if (this.evaluateMetricCondition(condition, metric)) {
                        this.triggerAlert(rule, 'metric', { metric });
                    }
                }
            }
        }
    }
    checkEventAlertRules(event) {
        for (const rule of this.alertRules.values()) {
            if (!rule.enabled || this.suppressed.has(rule.id))
                continue;
            for (const condition of rule.conditions) {
                if (condition.type === 'event') {
                    if (this.evaluateEventCondition(condition, event)) {
                        this.triggerAlert(rule, 'event', { event });
                    }
                }
            }
        }
    }
    evaluateMetricCondition(condition, metric) {
        const value = metric.value;
        const threshold = condition.threshold;
        switch (condition.operator) {
            case 'gt':
                return value > threshold;
            case 'gte':
                return value >= threshold;
            case 'lt':
                return value < threshold;
            case 'lte':
                return value <= threshold;
            case 'eq':
                return value === threshold;
            case 'ne':
                return value !== threshold;
            default:
                return false;
        }
    }
    evaluateEventCondition(_condition, _event) {
        // Implementation would depend on the specific condition structure
        // For now, return false as a placeholder
        return false;
    }
    triggerAlert(rule, sourceType, sourceData) {
        // Check throttling
        if (this.isThrottled(rule))
            return;
        const alert = {
            id: this.generateAlertId(),
            ruleId: rule.id,
            ruleName: rule.name,
            type: rule.type,
            severity: rule.severity,
            title: `${rule.name}`,
            description: rule.description,
            triggeredAt: new Date(),
            status: 'active',
            source: {
                type: sourceType,
                id: sourceType === 'metric'
                    ? sourceData['metric'].id
                    : 'unknown',
                data: sourceData,
            },
            context: {
                conditions: rule.conditions,
                actualValues: this.extractActualValues(sourceData),
                affectedResources: this.identifyAffectedResources(sourceData),
            },
            notes: [],
            tags: rule.tags,
            notificationsSent: [],
        };
        this.activeAlerts.set(alert.id, alert);
        this.updateThrottleState(rule);
        // Execute alert actions
        for (const action of rule.actions) {
            this.executeAlertAction(alert, action);
        }
        this.emit('alert:triggered', { alert, rule });
        this.logger.warn('Alert triggered', {
            alertId: alert.id,
            ruleName: rule.name,
            type: rule.type,
            severity: rule.severity,
        });
    }
    triggerAnomalyAlert(metric) {
        // Create anomaly alert (simplified implementation)
        const alertId = this.generateAlertId();
        const alert = {
            id: alertId,
            ruleId: 'anomaly-detection',
            ruleName: 'Anomaly Detection',
            type: AlertType.ANOMALY_DETECTED,
            severity: AlertSeverity.WARNING,
            title: `Anomaly detected in ${metric.name}`,
            description: `Unusual value detected: ${metric.value} ${metric.unit}`,
            triggeredAt: new Date(),
            status: 'active',
            source: {
                type: 'metric',
                id: metric.id,
                data: { metric },
            },
            context: {
                conditions: [],
                actualValues: { value: metric.value },
                affectedResources: [metric.name],
            },
            notes: [],
            tags: ['anomaly', metric.category],
            notificationsSent: [],
        };
        this.activeAlerts.set(alertId, alert);
        this.emit('alert:triggered', { alert });
    }
    triggerTrendAlert(metric, trendChange) {
        // Create trend alert (simplified implementation)
        const alertId = this.generateAlertId();
        const alert = {
            id: alertId,
            ruleId: 'trend-analysis',
            ruleName: 'Trend Analysis',
            type: AlertType.TREND_CHANGE,
            severity: AlertSeverity.INFO,
            title: `Significant trend change in ${metric.name}`,
            description: `Trend direction: ${trendChange['direction']}, strength: ${trendChange['strength']}`,
            triggeredAt: new Date(),
            status: 'active',
            source: {
                type: 'metric',
                id: metric.id,
                data: { metric, trendChange },
            },
            context: {
                conditions: [],
                actualValues: { value: metric.value, trend: trendChange },
                affectedResources: [metric.name],
            },
            notes: [],
            tags: ['trend', metric.category],
            notificationsSent: [],
        };
        this.activeAlerts.set(alertId, alert);
        this.emit('alert:triggered', { alert });
    }
    triggerSecurityAlert(event) {
        // Create security alert (simplified implementation)
        const alertId = this.generateAlertId();
        const alert = {
            id: alertId,
            ruleId: 'security-monitoring',
            ruleName: 'Security Monitoring',
            type: AlertType.SECURITY_VIOLATION,
            severity: AlertSeverity.CRITICAL,
            title: `Security violation: ${event.action}`,
            description: event.description,
            triggeredAt: new Date(),
            status: 'active',
            source: {
                type: 'event',
                id: event.id,
                data: { event },
            },
            context: {
                conditions: [],
                actualValues: { severity: event.severity },
                affectedResources: [event.target.id],
            },
            notes: [],
            tags: ['security', event.category],
            notificationsSent: [],
        };
        this.activeAlerts.set(alertId, alert);
        this.emit('alert:triggered', { alert });
    }
    triggerComplianceAlert(event) {
        // Create compliance alert (simplified implementation)
        const alertId = this.generateAlertId();
        const alert = {
            id: alertId,
            ruleId: 'compliance-monitoring',
            ruleName: 'Compliance Monitoring',
            type: AlertType.COMPLIANCE_ISSUE,
            severity: AlertSeverity.ERROR,
            title: `Compliance violation: ${event.action}`,
            description: event.description,
            triggeredAt: new Date(),
            status: 'active',
            source: {
                type: 'event',
                id: event.id,
                data: { event },
            },
            context: {
                conditions: [],
                actualValues: { outcome: event.outcome },
                affectedResources: [event.target.id],
            },
            notes: [],
            tags: ['compliance', event.category],
            notificationsSent: [],
        };
        this.activeAlerts.set(alertId, alert);
        this.emit('alert:triggered', { alert });
    }
    triggerInsightAlert(insight) {
        // Create insight alert (simplified implementation)
        const alertId = this.generateAlertId();
        const alert = {
            id: alertId,
            ruleId: 'insight-monitoring',
            ruleName: 'Analytics Insights',
            type: AlertType.PERFORMANCE_THRESHOLD,
            severity: insight.severity === 'critical'
                ? AlertSeverity.CRITICAL
                : AlertSeverity.WARNING,
            title: insight.title,
            description: insight.description,
            triggeredAt: new Date(),
            status: 'active',
            source: {
                type: 'insight',
                id: insight.id,
                data: { insight },
            },
            context: {
                conditions: [],
                actualValues: { impact: insight.impact },
                affectedResources: insight.relatedMetrics,
            },
            notes: [],
            tags: ['insight', insight.category],
            notificationsSent: [],
        };
        this.activeAlerts.set(alertId, alert);
        this.emit('alert:triggered', { alert });
    }
    triggerSystemHealthAlert(component, value, description) {
        const severity = value >= 0.95
            ? AlertSeverity.CRITICAL
            : value >= 0.85
                ? AlertSeverity.ERROR
                : AlertSeverity.WARNING;
        const alertId = this.generateAlertId();
        const alert = {
            id: alertId,
            ruleId: 'system-health',
            ruleName: 'System Health Monitoring',
            type: AlertType.SYSTEM_HEALTH,
            severity,
            title: `${component} threshold exceeded`,
            description,
            triggeredAt: new Date(),
            status: 'active',
            source: {
                type: 'metric',
                id: component,
                data: { component, value },
            },
            context: {
                conditions: [],
                actualValues: { [component]: value },
                affectedResources: ['system'],
            },
            notes: [],
            tags: ['system', component],
            notificationsSent: [],
        };
        this.activeAlerts.set(alertId, alert);
        this.emit('alert:triggered', { alert });
    }
    isThrottled(rule) {
        if (!rule.throttle.enabled)
            return false;
        const state = this.throttleState.get(rule.id);
        if (!state)
            return false;
        const now = Date.now();
        if (now - state.windowStart >= rule.throttle.windowMs) {
            // Reset window
            this.throttleState.set(rule.id, { count: 0, windowStart: now });
            return false;
        }
        return state.count >= rule.throttle.maxAlerts;
    }
    updateThrottleState(rule) {
        if (!rule.throttle.enabled)
            return;
        const state = this.throttleState.get(rule.id);
        const now = Date.now();
        if (!state || now - state.windowStart >= rule.throttle.windowMs) {
            this.throttleState.set(rule.id, { count: 1, windowStart: now });
        }
        else {
            state.count++;
        }
    }
    executeAlertAction(alert, action) {
        switch (action.type) {
            case 'notification':
                this.sendNotification(alert, action);
                break;
            case 'webhook':
                this.sendWebhook(alert, action);
                break;
            case 'escalation':
                // Handled separately in processEscalations
                break;
            case 'suppress':
                if (action.suppressDuration) {
                    this.suppressRule(alert.ruleId, action.suppressDuration, 'Auto-suppressed by alert action');
                }
                break;
            default:
                // Handle unknown action types
                console.warn(`Unknown alert action type: ${action.type}`);
                break;
        }
    }
    sendNotification(alert, action) {
        if (!action.channel || !action.recipients)
            return;
        const template = action.template
            ? this.notificationTemplates.get(action.template)
            : null;
        const message = template
            ? this.renderTemplate(template, alert)
            : {
                subject: alert.title,
                body: alert.description,
            };
        const notification = {
            channel: action.channel,
            recipients: action.recipients,
            sentAt: new Date(),
            success: true, // Would be determined by actual sending
            response: 'Notification sent successfully',
        };
        alert.notificationsSent.push(notification);
        this.emit('notification:sent', {
            alert,
            channel: action.channel,
            recipients: action.recipients,
            message,
        });
        this.logger.info('Notification sent', {
            alertId: alert.id,
            channel: action.channel,
            recipients: action.recipients.length,
        });
    }
    sendWebhook(alert, action) {
        if (!action.webhookUrl)
            return;
        const payload = {
            alert: {
                id: alert.id,
                title: alert.title,
                severity: alert.severity,
                type: alert.type,
                description: alert.description,
                triggeredAt: alert.triggeredAt.toISOString(),
            },
            customData: action.customData,
        };
        // In a real implementation, this would make an HTTP request
        this.emit('webhook:sent', {
            alert,
            url: action.webhookUrl,
            payload,
        });
        this.logger.info('Webhook sent', {
            alertId: alert.id,
            url: action.webhookUrl,
        });
    }
    escalateAlert(alert, level) {
        alert.escalationLevel = level.level;
        alert.notes.push(`Escalated to level ${level.level} at ${new Date().toISOString()}`);
        for (const action of level.actions) {
            this.executeAlertAction(alert, action);
        }
        this.emit('alert:escalated', { alert, level });
        this.logger.warn('Alert escalated', {
            alertId: alert.id,
            level: level.level,
            ruleName: alert.ruleName,
        });
    }
    renderTemplate(template, alert) {
        const variables = {
            title: alert.title,
            severity: alert.severity,
            type: alert.type,
            description: alert.description,
            triggeredAt: alert.triggeredAt.toISOString(),
            affectedResources: alert.context.affectedResources.join(', '),
        };
        let subject = template.subject;
        let body = template.body;
        for (const [key, value] of Object.entries(variables)) {
            const regex = new RegExp(`{{${key}}}`, 'g');
            subject = subject.replace(regex, value);
            body = body.replace(regex, value);
        }
        return { subject, body };
    }
    extractActualValues(sourceData) {
        // Extract relevant values from source data for context
        if (sourceData['metric']) {
            const metric = sourceData['metric'];
            return {
                value: metric.value,
                unit: metric.unit,
                timestamp: metric.timestamp,
            };
        }
        return {};
    }
    identifyAffectedResources(sourceData) {
        // Identify resources affected by the alert
        if (sourceData['metric']) {
            const metric = sourceData['metric'];
            return [metric.name];
        }
        return [];
    }
    groupAlertsBySeverity(alerts) {
        return alerts.reduce((acc, alert) => {
            acc[alert.severity] = (acc[alert.severity] || 0) + 1;
            return acc;
        }, {});
    }
    groupAlertsByType(alerts) {
        return alerts.reduce((acc, alert) => {
            acc[alert.type] = (acc[alert.type] || 0) + 1;
            return acc;
        }, {});
    }
    getTopAlertRules(limit) {
        const ruleCounts = {};
        for (const alert of [...this.activeAlerts.values(), ...this.alertHistory]) {
            if (!ruleCounts[alert.ruleId]) {
                ruleCounts[alert.ruleId] = { ruleName: alert.ruleName, count: 0 };
            }
            ruleCounts[alert.ruleId].count++;
        }
        return Object.entries(ruleCounts)
            .map(([ruleId, data]) => ({ ruleId, ...data }))
            .sort((a, b) => b.count - a.count)
            .slice(0, limit);
    }
    calculateAlertTrends(alerts) {
        const dailyData = {};
        for (const alert of alerts) {
            const dateKey = alert.triggeredAt.toISOString().split('T')[0];
            if (!dailyData[dateKey]) {
                dailyData[dateKey] = {
                    date: dateKey,
                    count: 0,
                    critical: 0,
                    resolved: 0,
                };
            }
            dailyData[dateKey].count++;
            if (alert.severity === AlertSeverity.CRITICAL) {
                dailyData[dateKey].critical++;
            }
            if (alert.status === 'resolved') {
                dailyData[dateKey].resolved++;
            }
        }
        return Object.values(dailyData).sort((a, b) => a.date.localeCompare(b.date));
    }
    calculateTopRuleMetrics(alerts) {
        const ruleMetrics = {};
        for (const alert of alerts) {
            if (!ruleMetrics[alert.ruleId]) {
                ruleMetrics[alert.ruleId] = {
                    ruleId: alert.ruleId,
                    name: alert.ruleName,
                    triggers: 0,
                    totalResolutionTime: 0,
                    resolvedCount: 0,
                };
            }
            const metrics = ruleMetrics[alert.ruleId];
            metrics.triggers++;
            if (alert.resolvedAt) {
                metrics.resolvedCount++;
                metrics.totalResolutionTime +=
                    alert.resolvedAt.getTime() - alert.triggeredAt.getTime();
            }
        }
        return Object.values(ruleMetrics)
            .map((metrics) => ({
            ruleId: metrics.ruleId,
            name: metrics.name,
            triggers: metrics.triggers,
            avgResolutionTime: metrics.resolvedCount > 0
                ? metrics.totalResolutionTime / metrics.resolvedCount / 1000 / 60 // minutes
                : 0,
        }))
            .sort((a, b) => b.triggers - a.triggers);
    }
    calculatePerformanceMetrics(alerts) {
        const escalatedAlerts = alerts.filter((a) => a.escalationLevel && a.escalationLevel > 0);
        const totalNotifications = alerts.reduce((sum, alert) => sum + alert.notificationsSent.length, 0);
        const successfulNotifications = alerts.reduce((sum, alert) => sum + alert.notificationsSent.filter((n) => n.success).length, 0);
        return {
            avgProcessingTime: 0, // Would be calculated from actual processing times
            notificationSuccessRate: totalNotifications > 0
                ? successfulNotifications / totalNotifications
                : 1,
            escalationRate: alerts.length > 0 ? escalatedAlerts.length / alerts.length : 0,
            falsePositiveRate: 0, // Would need additional tracking for false positives
        };
    }
    generateRuleId() {
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 8);
        return `rule_${timestamp}_${randomString}`;
    }
    generateAlertId() {
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 8);
        return `alert_${timestamp}_${randomString}`;
    }
    /**
     * Cleanup resources
     */
    destroy() {
        if (this.processingInterval) {
            clearInterval(this.processingInterval);
        }
        if (this.escalationInterval) {
            clearInterval(this.escalationInterval);
        }
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }
        this.removeAllListeners();
        this.alertRules.clear();
        this.activeAlerts.clear();
        this.alertHistory.length = 0;
        this.notificationTemplates.clear();
        this.throttleState.clear();
        this.suppressed.clear();
        this.metricsBuffer.clear();
        this.logger.info('AlertingNotificationSystem destroyed');
    }
}
/**
 * Simple anomaly detection using statistical methods
 */
class AnomalyDetector {
    metricStats;
    threshold;
    constructor(threshold = 2.0) {
        this.metricStats = new Map();
        this.threshold = threshold; // Standard deviations from mean
    }
    detectAnomaly(metricName, value) {
        if (!this.metricStats.has(metricName)) {
            this.metricStats.set(metricName, { values: [], mean: 0, stddev: 0 });
        }
        const stats = this.metricStats.get(metricName);
        stats.values.push(value);
        // Keep only last 100 values
        if (stats.values.length > 100) {
            stats.values.shift();
        }
        if (stats.values.length < 10) {
            return false; // Need at least 10 values for detection
        }
        // Calculate mean and standard deviation
        stats.mean =
            stats.values.reduce((sum, v) => sum + v, 0) / stats.values.length;
        const variance = stats.values.reduce((sum, v) => sum + Math.pow(v - stats.mean, 2), 0) /
            stats.values.length;
        stats.stddev = Math.sqrt(variance);
        // Check if current value is an anomaly
        return Math.abs(value - stats.mean) > this.threshold * stats.stddev;
    }
}
/**
 * Simple trend analysis
 */
class TrendAnalyzer {
    metricTrends;
    constructor() {
        this.metricTrends = new Map();
    }
    analyzeTrend(metricName, value) {
        if (!this.metricTrends.has(metricName)) {
            this.metricTrends.set(metricName, []);
        }
        const trends = this.metricTrends.get(metricName);
        trends.push(value);
        // Keep only last 50 values
        if (trends.length > 50) {
            trends.shift();
        }
        if (trends.length < 10) {
            return { significant: false, direction: 'stable', strength: 0 };
        }
        // Simple linear regression to detect trends
        const n = trends.length;
        const sumX = trends.reduce((sum, _, index) => sum + index, 0);
        const sumY = trends.reduce((sum, val) => sum + val, 0);
        const sumXY = trends.reduce((sum, val, index) => sum + index * val, 0);
        const sumXX = trends.reduce((sum, _, index) => sum + index * index, 0);
        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        const strength = Math.abs(slope);
        const significant = strength > 0.1; // Threshold for significance
        return {
            significant,
            direction: slope > 0 ? 'increasing' : slope < 0 ? 'decreasing' : 'stable',
            strength,
        };
    }
}
/**
 * Singleton instance for global access
 */
export const alertingNotificationSystem = new AlertingNotificationSystem();
//# sourceMappingURL=AlertingNotificationSystem.js.map