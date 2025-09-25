/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { EventEmitter } from 'node:events';
import type { TaskStatusUpdate, AgentStatus, TaskMetadata } from './TaskStatusMonitor.js';
/**
 * Audit event types for comprehensive tracking
 */
export declare enum AuditEventType {
    TASK_CREATED = "task:created",
    TASK_ASSIGNED = "task:assigned",
    TASK_STATUS_CHANGED = "task:status-changed",
    TASK_COMPLETED = "task:completed",
    TASK_FAILED = "task:failed",
    AGENT_REGISTERED = "agent:registered",
    AGENT_HEARTBEAT = "agent:heartbeat",
    AGENT_STATUS_CHANGED = "agent:status-changed",
    AGENT_TASK_ASSIGNMENT = "agent:task-assignment",
    SYSTEM_START = "system:start",
    SYSTEM_SHUTDOWN = "system:shutdown",
    CONFIG_CHANGED = "config:changed",
    SECURITY_EVENT = "security:event",
    PERFORMANCE_THRESHOLD = "performance:threshold",
    ERROR_OCCURRED = "error:occurred",
    USER_ACTION = "user:action",
    API_CALL = "api:call"
}
export interface AuditEvent {
    id: string;
    type: AuditEventType;
    timestamp: Date;
    source: string;
    actor: {
        type: 'system' | 'agent' | 'user' | 'api';
        id: string;
        name?: string;
    };
    target: {
        type: 'task' | 'agent' | 'system' | 'config' | 'user';
        id: string;
        name?: string;
    };
    action: string;
    description: string;
    details: Record<string, unknown>;
    outcome: 'success' | 'failure' | 'pending';
    severity: 'info' | 'warning' | 'error' | 'critical';
    category: 'operational' | 'security' | 'performance' | 'business' | 'compliance';
    tags: string[];
    correlationId?: string;
    sessionId?: string;
    ipAddress?: string;
    userAgent?: string;
    beforeState?: Record<string, unknown>;
    afterState?: Record<string, unknown>;
}
export interface AuditQuery {
    types?: AuditEventType[];
    sources?: string[];
    actors?: Array<{
        type?: string;
        id?: string;
    }>;
    targets?: Array<{
        type?: string;
        id?: string;
    }>;
    outcomes?: Array<'success' | 'failure' | 'pending'>;
    severities?: Array<'info' | 'warning' | 'error' | 'critical'>;
    categories?: Array<'operational' | 'security' | 'performance' | 'business' | 'compliance'>;
    tags?: string[];
    timeRange?: {
        start: Date;
        end: Date;
    };
    correlationId?: string;
    sessionId?: string;
    limit?: number;
    offset?: number;
    sortBy?: 'timestamp' | 'severity' | 'type';
    sortOrder?: 'asc' | 'desc';
}
export interface ComplianceReport {
    reportId: string;
    reportType: 'security' | 'operational' | 'performance' | 'full';
    generatedAt: Date;
    period: {
        start: Date;
        end: Date;
    };
    summary: {
        totalEvents: number;
        eventsByType: Record<AuditEventType, number>;
        eventsBySeverity: Record<string, number>;
        eventsByCategory: Record<string, number>;
        complianceScore: number;
        issuesFound: number;
        recommendationsCount: number;
    };
    securityEvents: AuditEvent[];
    complianceViolations: Array<{
        rule: string;
        description: string;
        violations: AuditEvent[];
        severity: 'low' | 'medium' | 'high' | 'critical';
        recommendation: string;
    }>;
    performanceInsights: Array<{
        metric: string;
        trend: 'improving' | 'degrading' | 'stable';
        impact: string;
        recommendation: string;
    }>;
    recommendations: Array<{
        category: string;
        priority: 'low' | 'medium' | 'high' | 'critical';
        title: string;
        description: string;
        implementation: string;
    }>;
}
/**
 * Comprehensive Audit Trail Analytics System
 *
 * Provides enterprise-grade audit logging, compliance reporting, and analytics
 * with comprehensive event tracking, querying capabilities, and automated compliance monitoring.
 */
export declare class AuditTrailAnalytics extends EventEmitter {
    private readonly logger;
    private events;
    private eventIndex;
    private retentionDays;
    private complianceRules;
    private archiveThreshold;
    private persistenceInterval?;
    private dailyStats;
    constructor(options?: {
        retentionDays?: number;
        archiveThreshold?: number;
        persistenceIntervalMs?: number;
    });
    /**
     * Record an audit event
     */
    recordEvent(type: AuditEventType, action: string, description: string, details: {
        source: string;
        actor: AuditEvent['actor'];
        target: AuditEvent['target'];
        outcome?: 'success' | 'failure' | 'pending';
        severity?: 'info' | 'warning' | 'error' | 'critical';
        category?: AuditEvent['category'];
        tags?: string[];
        correlationId?: string;
        sessionId?: string;
        ipAddress?: string;
        userAgent?: string;
        beforeState?: Record<string, unknown>;
        afterState?: Record<string, unknown>;
        context?: Record<string, unknown>;
    }): Promise<void>;
    /**
     * Query audit events with comprehensive filtering
     */
    queryEvents(query: AuditQuery): AuditEvent[];
    /**
     * Generate comprehensive compliance report
     */
    generateComplianceReport(reportType: 'security' | 'operational' | 'performance' | 'full', period: {
        start: Date;
        end: Date;
    }): Promise<ComplianceReport>;
    /**
     * Get audit analytics for dashboard
     */
    getAnalytics(timeRange?: {
        start: Date;
        end: Date;
    }): {
        totalEvents: number;
        eventsByType: Record<AuditEventType, number>;
        eventsBySeverity: Record<string, number>;
        eventsByCategory: Record<string, number>;
        eventsByOutcome: Record<string, number>;
        securityEvents: number;
        complianceScore: number;
        dailyActivity: Array<{
            date: string;
            events: number;
            securityEvents: number;
            errors: number;
        }>;
        recentCriticalEvents: AuditEvent[];
        topSources: Array<{
            source: string;
            count: number;
        }>;
        topActors: Array<{
            actor: string;
            count: number;
        }>;
    };
    /**
     * Export audit data for external systems
     */
    exportAuditData(query: AuditQuery, format?: 'json' | 'csv' | 'xml'): string;
    /**
     * Task lifecycle event handlers
     */
    onTaskEvent(event: 'created' | 'assigned' | 'status-changed' | 'completed' | 'failed', data: {
        task: TaskMetadata;
        update?: TaskStatusUpdate;
        agent?: AgentStatus;
        correlationId?: string;
        sessionId?: string;
    }): void;
    /**
     * Agent lifecycle event handlers
     */
    onAgentEvent(event: 'registered' | 'heartbeat' | 'status-changed', data: {
        agent: AgentStatus;
        correlationId?: string;
        sessionId?: string;
    }): void;
    private initializeComplianceRules;
    private setupPeriodicPersistence;
    private updateEventIndexes;
    private updateDailyStats;
    private checkComplianceViolations;
    private calculateReportSummary;
    private identifyComplianceViolations;
    private generatePerformanceInsights;
    private generateRecommendations;
    private calculateComplianceScore;
    private groupEventsByProperty;
    private calculateDailyActivity;
    private getTopValues;
    private exportToCSV;
    private exportToXML;
    private archiveOldEvents;
    private rebuildIndexes;
    private persistAuditData;
    private cleanupOldEvents;
    private generateEventId;
    private generateReportId;
    /**
     * Cleanup resources
     */
    destroy(): void;
}
/**
 * Singleton instance for global access
 */
export declare const auditTrailAnalytics: AuditTrailAnalytics;
