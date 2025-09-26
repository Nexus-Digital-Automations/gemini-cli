/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { EventEmitter } from 'node:events';
import type { PerformanceMetric, AnalyticsInsight } from './PerformanceAnalyticsDashboard.js';
import type { AuditEvent } from './AuditTrailAnalytics.js';
/**
 * Alert severity levels
 */
export declare enum AlertSeverity {
    INFO = "info",
    WARNING = "warning",
    ERROR = "error",
    CRITICAL = "critical"
}
/**
 * Alert types for different monitoring scenarios
 */
export declare enum AlertType {
    PERFORMANCE_THRESHOLD = "performance:threshold",
    SYSTEM_HEALTH = "system:health",
    TASK_FAILURE = "task:failure",
    AGENT_OFFLINE = "agent:offline",
    SECURITY_VIOLATION = "security:violation",
    COMPLIANCE_ISSUE = "compliance:issue",
    RESOURCE_EXHAUSTION = "resource:exhaustion",
    SLA_BREACH = "sla:breach",
    ANOMALY_DETECTED = "anomaly:detected",
    TREND_CHANGE = "trend:change"
}
/**
 * Notification channels
 */
export declare enum NotificationChannel {
    EMAIL = "email",
    SMS = "sms",
    SLACK = "slack",
    WEBHOOK = "webhook",
    DASHBOARD = "dashboard",
    LOG = "log",
    CONSOLE = "console"
}
/**
 * Alert definition and configuration
 */
export interface AlertRule {
    id: string;
    name: string;
    description: string;
    type: AlertType;
    severity: AlertSeverity;
    enabled: boolean;
    conditions: AlertCondition[];
    actions: AlertAction[];
    throttle: {
        enabled: boolean;
        windowMs: number;
        maxAlerts: number;
    };
    escalation?: {
        levels: EscalationLevel[];
        timeoutMs: number;
    };
    tags: string[];
    metadata: Record<string, unknown>;
    createdAt: Date;
    updatedAt: Date;
}
/**
 * Alert condition definitions
 */
export interface AlertCondition {
    type: 'metric' | 'event' | 'trend' | 'composite';
    metric?: string;
    operator: 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'ne' | 'contains' | 'regex';
    threshold: number | string;
    timeWindow?: number;
    aggregation?: 'avg' | 'sum' | 'count' | 'min' | 'max' | 'rate';
    groupBy?: string[];
    filter?: Record<string, unknown>;
}
/**
 * Alert actions to perform when triggered
 */
export interface AlertAction {
    type: 'notification' | 'webhook' | 'script' | 'escalation' | 'suppress';
    channel?: NotificationChannel;
    recipients?: string[];
    template?: string;
    webhookUrl?: string;
    scriptPath?: string;
    suppressDuration?: number;
    customData?: Record<string, unknown>;
}
/**
 * Escalation levels for critical alerts
 */
export interface EscalationLevel {
    level: number;
    delayMs: number;
    actions: AlertAction[];
}
/**
 * Generated alert instance
 */
export interface Alert {
    id: string;
    ruleId: string;
    ruleName: string;
    type: AlertType;
    severity: AlertSeverity;
    title: string;
    description: string;
    triggeredAt: Date;
    resolvedAt?: Date;
    status: 'active' | 'acknowledged' | 'resolved' | 'suppressed';
    source: {
        type: 'metric' | 'event' | 'insight' | 'manual';
        id: string;
        data: Record<string, unknown>;
    };
    context: {
        conditions: AlertCondition[];
        actualValues: Record<string, unknown>;
        affectedResources: string[];
        correlationId?: string;
    };
    assignedTo?: string;
    acknowledgedBy?: string;
    acknowledgedAt?: Date;
    notes: string[];
    tags: string[];
    escalationLevel?: number;
    notificationsSent: Array<{
        channel: NotificationChannel;
        recipients: string[];
        sentAt: Date;
        success: boolean;
        response?: string;
    }>;
}
/**
 * Notification template for customizable alert messages
 */
export interface NotificationTemplate {
    id: string;
    name: string;
    channel: NotificationChannel;
    subject: string;
    body: string;
    variables: string[];
    format: 'text' | 'html' | 'markdown' | 'json';
}
/**
 * Advanced Alerting and Notification System
 *
 * Provides comprehensive real-time alerting with intelligent thresholding,
 * multi-channel notifications, escalation policies, and alert lifecycle management.
 */
export declare class AlertingNotificationSystem extends EventEmitter {
    private readonly logger;
    private alertRules;
    private activeAlerts;
    private alertHistory;
    private notificationTemplates;
    private throttleState;
    private suppressed;
    private metricsBuffer;
    private anomalyDetector;
    private trendAnalyzer;
    private processingInterval?;
    private escalationInterval?;
    private cleanupInterval?;
    constructor(options?: {
        maxHistorySize?: number;
        processingIntervalMs?: number;
        anomalyThreshold?: number;
    });
    /**
     * Create a new alert rule
     */
    createAlertRule(rule: Omit<AlertRule, 'id' | 'createdAt' | 'updatedAt'>): string;
    /**
     * Update an existing alert rule
     */
    updateAlertRule(ruleId: string, updates: Partial<Omit<AlertRule, 'id' | 'createdAt'>>): boolean;
    /**
     * Delete an alert rule
     */
    deleteAlertRule(ruleId: string): boolean;
    /**
     * Process performance metrics for alerting
     */
    onMetricReceived(metric: PerformanceMetric): void;
    /**
     * Process audit events for alerting
     */
    onAuditEvent(event: AuditEvent): void;
    /**
     * Process analytics insights for alerting
     */
    onInsightGenerated(insight: AnalyticsInsight): void;
    /**
     * Process system health changes
     */
    onSystemHealthChange(health: {
        cpuUsage: number;
        memoryUsage: number;
        activeAgents: number;
        taskThroughput: number;
        errorRate: number;
    }): void;
    /**
     * Acknowledge an alert
     */
    acknowledgeAlert(alertId: string, acknowledgedBy: string, notes?: string): boolean;
    /**
     * Resolve an alert
     */
    resolveAlert(alertId: string, resolution: string): boolean;
    /**
     * Suppress alerts for a rule temporarily
     */
    suppressRule(ruleId: string, durationMs: number, reason: string): boolean;
    /**
     * Get alert dashboard data
     */
    getDashboardData(): {
        activeAlerts: Alert[];
        alertsBySeverity: Record<AlertSeverity, number>;
        alertsByType: Record<AlertType, number>;
        recentAlerts: Alert[];
        topAlertRules: Array<{
            ruleId: string;
            ruleName: string;
            count: number;
        }>;
        systemHealth: {
            totalRules: number;
            enabledRules: number;
            suppressedRules: number;
            alertsToday: number;
            mttr: number;
            escalatedAlerts: number;
        };
    };
    /**
     * Get alert statistics and analytics
     */
    getAnalytics(timeRange?: {
        start: Date;
        end: Date;
    }): {
        totalAlerts: number;
        alertTrends: Array<{
            date: string;
            count: number;
            critical: number;
            resolved: number;
        }>;
        topAlertRules: Array<{
            ruleId: string;
            name: string;
            triggers: number;
            avgResolutionTime: number;
        }>;
        performanceMetrics: {
            avgProcessingTime: number;
            notificationSuccessRate: number;
            escalationRate: number;
            falsePositiveRate: number;
        };
    };
    /**
     * Export alert data
     */
    exportAlerts(format?: 'json' | 'csv', includeResolved?: boolean): string;
    private initializeDefaultTemplates;
    private initializeDefaultRules;
    private setupPeriodicProcessing;
    private processAlerts;
    private processEscalations;
    private cleanupOldData;
    private checkMetricAlertRules;
    private checkEventAlertRules;
    private evaluateMetricCondition;
    private evaluateEventCondition;
    private triggerAlert;
    private triggerAnomalyAlert;
    private triggerTrendAlert;
    private triggerSecurityAlert;
    private triggerComplianceAlert;
    private triggerInsightAlert;
    private triggerSystemHealthAlert;
    private isThrottled;
    private updateThrottleState;
    private executeAlertAction;
    private sendNotification;
    private sendWebhook;
    private escalateAlert;
    private renderTemplate;
    private extractActualValues;
    private identifyAffectedResources;
    private groupAlertsBySeverity;
    private groupAlertsByType;
    private getTopAlertRules;
    private calculateAlertTrends;
    private calculateTopRuleMetrics;
    private calculatePerformanceMetrics;
    private generateRuleId;
    private generateAlertId;
    /**
     * Cleanup resources
     */
    destroy(): void;
}
/**
 * Singleton instance for global access
 */
export declare const alertingNotificationSystem: AlertingNotificationSystem;
