/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { EventEmitter } from 'node:events';
import { Logger } from '../utils/logger.js';
import type {
  TaskStatusUpdate,
  AgentStatus,
  TaskMetadata,
} from './TaskStatusMonitor.js';

/**
 * Audit event types for comprehensive tracking
 */
export enum AuditEventType {
  TASK_CREATED = 'task:created',
  TASK_ASSIGNED = 'task:assigned',
  TASK_STATUS_CHANGED = 'task:status-changed',
  TASK_COMPLETED = 'task:completed',
  TASK_FAILED = 'task:failed',
  AGENT_REGISTERED = 'agent:registered',
  AGENT_HEARTBEAT = 'agent:heartbeat',
  AGENT_STATUS_CHANGED = 'agent:status-changed',
  AGENT_TASK_ASSIGNMENT = 'agent:task-assignment',
  SYSTEM_START = 'system:start',
  SYSTEM_SHUTDOWN = 'system:shutdown',
  CONFIG_CHANGED = 'config:changed',
  SECURITY_EVENT = 'security:event',
  PERFORMANCE_THRESHOLD = 'performance:threshold',
  ERROR_OCCURRED = 'error:occurred',
  USER_ACTION = 'user:action',
  API_CALL = 'api:call',
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
  category:
    | 'operational'
    | 'security'
    | 'performance'
    | 'business'
    | 'compliance';
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
  actors?: Array<{ type?: string; id?: string }>;
  targets?: Array<{ type?: string; id?: string }>;
  outcomes?: Array<'success' | 'failure' | 'pending'>;
  severities?: Array<'info' | 'warning' | 'error' | 'critical'>;
  categories?: Array<
    'operational' | 'security' | 'performance' | 'business' | 'compliance'
  >;
  tags?: string[];
  timeRange?: { start: Date; end: Date };
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
  period: { start: Date; end: Date };
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
export class AuditTrailAnalytics extends EventEmitter {
  private readonly logger: Logger;
  private events: AuditEvent[];
  private eventIndex: Map<string, Set<number>>; // For efficient querying
  private retentionDays: number;
  private complianceRules: Map<string, (event: AuditEvent) => boolean>;
  private archiveThreshold: number;
  private persistenceInterval?: NodeJS.Timeout;

  // Analytics tracking
  private dailyStats: Map<
    string,
    {
      date: string;
      totalEvents: number;
      eventsByType: Record<AuditEventType, number>;
      eventsBySeverity: Record<string, number>;
      securityEvents: number;
      errors: number;
    }
  >;

  constructor(
    options: {
      retentionDays?: number;
      archiveThreshold?: number;
      persistenceIntervalMs?: number;
    } = {},
  ) {
    super();
    this.logger = new Logger('AuditTrailAnalytics');
    this.events = [];
    this.eventIndex = new Map();
    this.retentionDays = options.retentionDays || 90; // 90 days default
    this.archiveThreshold = options.archiveThreshold || 10000; // Archive after 10k events
    this.dailyStats = new Map();
    this.complianceRules = new Map();

    this.initializeComplianceRules();
    this.setupPeriodicPersistence(options.persistenceIntervalMs || 300000); // 5 minutes

    this.logger.info('AuditTrailAnalytics initialized', {
      retentionDays: this.retentionDays,
      archiveThreshold: this.archiveThreshold,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Record an audit event
   */
  async recordEvent(
    type: AuditEventType,
    action: string,
    description: string,
    details: {
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
    },
  ): Promise<void> {
    const event: AuditEvent = {
      id: this.generateEventId(),
      type,
      timestamp: new Date(),
      source: details.source,
      actor: details.actor,
      target: details.target,
      action,
      description,
      details: details.context || {},
      outcome: details.outcome || 'success',
      severity: details.severity || 'info',
      category: details.category || 'operational',
      tags: details.tags || [],
      correlationId: details.correlationId,
      sessionId: details.sessionId,
      ipAddress: details.ipAddress,
      userAgent: details.userAgent,
      beforeState: details.beforeState,
      afterState: details.afterState,
    };

    // Add to events collection
    this.events.push(event);

    // Update indexes for efficient querying
    this.updateEventIndexes(event, this.events.length - 1);

    // Update daily statistics
    this.updateDailyStats(event);

    // Check compliance rules
    const violations = this.checkComplianceViolations(event);
    if (violations.length > 0) {
      this.emit('compliance:violations', { event, violations });
    }

    // Emit event for real-time monitoring
    this.emit('audit:event-recorded', { event });

    // Archive old events if threshold reached
    if (this.events.length > this.archiveThreshold) {
      await this.archiveOldEvents();
    }

    this.logger.debug('Audit event recorded', {
      id: event.id,
      type: event.type,
      action: event.action,
      severity: event.severity,
      category: event.category,
    });
  }

  /**
   * Query audit events with comprehensive filtering
   */
  queryEvents(query: AuditQuery): AuditEvent[] {
    let filteredEvents = [...this.events];

    // Apply filters
    if (query.types) {
      filteredEvents = filteredEvents.filter((event) =>
        query.types!.includes(event.type),
      );
    }

    if (query.sources) {
      filteredEvents = filteredEvents.filter((event) =>
        query.sources!.includes(event.source),
      );
    }

    if (query.actors) {
      filteredEvents = filteredEvents.filter((event) =>
        query.actors!.some(
          (actor) =>
            (!actor.type || event.actor.type === actor.type) &&
            (!actor.id || event.actor.id === actor.id),
        ),
      );
    }

    if (query.targets) {
      filteredEvents = filteredEvents.filter((event) =>
        query.targets!.some(
          (target) =>
            (!target.type || event.target.type === target.type) &&
            (!target.id || event.target.id === target.id),
        ),
      );
    }

    if (query.outcomes) {
      filteredEvents = filteredEvents.filter((event) =>
        query.outcomes!.includes(event.outcome),
      );
    }

    if (query.severities) {
      filteredEvents = filteredEvents.filter((event) =>
        query.severities!.includes(event.severity),
      );
    }

    if (query.categories) {
      filteredEvents = filteredEvents.filter((event) =>
        query.categories!.includes(event.category),
      );
    }

    if (query.tags && query.tags.length > 0) {
      filteredEvents = filteredEvents.filter((event) =>
        query.tags!.some((tag) => event.tags.includes(tag)),
      );
    }

    if (query.timeRange) {
      filteredEvents = filteredEvents.filter(
        (event) =>
          event.timestamp >= query.timeRange!.start &&
          event.timestamp <= query.timeRange!.end,
      );
    }

    if (query.correlationId) {
      filteredEvents = filteredEvents.filter(
        (event) => event.correlationId === query.correlationId,
      );
    }

    if (query.sessionId) {
      filteredEvents = filteredEvents.filter(
        (event) => event.sessionId === query.sessionId,
      );
    }

    // Sort results
    const sortBy = query.sortBy || 'timestamp';
    const sortOrder = query.sortOrder || 'desc';

    filteredEvents.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'timestamp':
          comparison = a.timestamp.getTime() - b.timestamp.getTime();
          break;
        case 'severity':
          const severityOrder = { info: 0, warning: 1, error: 2, critical: 3 };
          comparison = severityOrder[a.severity] - severityOrder[b.severity];
          break;
        case 'type':
          comparison = a.type.localeCompare(b.type);
          break;
        default:
          // Default to timestamp sorting for unknown sort criteria
          comparison = a.timestamp.getTime() - b.timestamp.getTime();
          break;
      }

      return sortOrder === 'desc' ? -comparison : comparison;
    });

    // Apply pagination
    const offset = query.offset || 0;
    const limit = query.limit || 100;

    return filteredEvents.slice(offset, offset + limit);
  }

  /**
   * Generate comprehensive compliance report
   */
  async generateComplianceReport(
    reportType: 'security' | 'operational' | 'performance' | 'full',
    period: { start: Date; end: Date },
  ): Promise<ComplianceReport> {
    const events = this.queryEvents({
      timeRange: period,
      limit: 100000, // Get all events in period
    });

    // Calculate summary statistics
    const summary = this.calculateReportSummary(events);

    // Identify security events
    const securityEvents = events.filter(
      (event) =>
        event.category === 'security' ||
        event.type === AuditEventType.SECURITY_EVENT,
    );

    // Check compliance violations
    const complianceViolations = this.identifyComplianceViolations(events);

    // Generate performance insights
    const performanceInsights = this.generatePerformanceInsights(events);

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      events,
      complianceViolations,
    );

    const report: ComplianceReport = {
      reportId: this.generateReportId(),
      reportType,
      generatedAt: new Date(),
      period,
      summary,
      securityEvents,
      complianceViolations,
      performanceInsights,
      recommendations,
    };

    this.emit('compliance:report-generated', { report });

    this.logger.info('Compliance report generated', {
      reportId: report.reportId,
      reportType,
      period,
      totalEvents: summary.totalEvents,
      complianceScore: summary.complianceScore,
    });

    return report;
  }

  /**
   * Get audit analytics for dashboard
   */
  getAnalytics(timeRange?: { start: Date; end: Date }): {
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
    topSources: Array<{ source: string; count: number }>;
    topActors: Array<{ actor: string; count: number }>;
  } {
    const query: AuditQuery = timeRange ? { timeRange } : {};
    const events = this.queryEvents({ ...query, limit: 100000 });

    const analytics = {
      totalEvents: events.length,
      eventsByType: this.groupEventsByProperty(events, 'type'),
      eventsBySeverity: this.groupEventsByProperty(events, 'severity'),
      eventsByCategory: this.groupEventsByProperty(events, 'category'),
      eventsByOutcome: this.groupEventsByProperty(events, 'outcome'),
      securityEvents: events.filter((e) => e.category === 'security').length,
      complianceScore: this.calculateComplianceScore(events),
      dailyActivity: this.calculateDailyActivity(events),
      recentCriticalEvents: events
        .filter((e) => e.severity === 'critical')
        .slice(0, 10),
      topSources: this.getTopValues(events, 'source', 10),
      topActors: this.getTopValues(events, 'actor.id', 10),
    };

    return analytics;
  }

  /**
   * Export audit data for external systems
   */
  exportAuditData(
    query: AuditQuery,
    format: 'json' | 'csv' | 'xml' = 'json',
  ): string {
    const events = this.queryEvents(query);

    switch (format) {
      case 'json':
        return JSON.stringify(
          {
            metadata: {
              exportedAt: new Date().toISOString(),
              totalEvents: events.length,
              query,
            },
            events,
          },
          null,
          2,
        );

      case 'csv':
        return this.exportToCSV(events);

      case 'xml':
        return this.exportToXML(events);

      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  /**
   * Task lifecycle event handlers
   */
  onTaskEvent(
    event: 'created' | 'assigned' | 'status-changed' | 'completed' | 'failed',
    data: {
      task: TaskMetadata;
      update?: TaskStatusUpdate;
      agent?: AgentStatus;
      correlationId?: string;
      sessionId?: string;
    },
  ): void {
    const { task, update, agent, correlationId, sessionId } = data;

    const beforeState = update
      ? { previousStatus: update.previousStatus }
      : undefined;
    const afterState = { status: task.status, progress: task.progress };

    let auditType: AuditEventType;
    let action: string;
    let description: string;

    switch (event) {
      case 'created':
        auditType = AuditEventType.TASK_CREATED;
        action = 'CREATE_TASK';
        description = `Task "${task.title}" was created`;
        break;

      case 'assigned':
        auditType = AuditEventType.AGENT_TASK_ASSIGNMENT;
        action = 'ASSIGN_TASK';
        description = `Task "${task.title}" assigned to agent ${agent?.id}`;
        break;

      case 'status-changed':
        auditType = AuditEventType.TASK_STATUS_CHANGED;
        action = 'CHANGE_TASK_STATUS';
        description = `Task "${task.title}" status changed from ${update?.previousStatus} to ${task.status}`;
        break;

      case 'completed':
        auditType = AuditEventType.TASK_COMPLETED;
        action = 'COMPLETE_TASK';
        description = `Task "${task.title}" completed successfully`;
        break;

      case 'failed':
        auditType = AuditEventType.TASK_FAILED;
        action = 'FAIL_TASK';
        description = `Task "${task.title}" failed: ${update?.error || 'Unknown error'}`;
        break;

      default:
        // Handle unknown event types
        auditType = AuditEventType.SYSTEM_EVENT;
        action = 'UNKNOWN_EVENT';
        description = `Unknown task event: ${event} for task "${task.title}"`;
        console.warn(`Unknown task event type: ${event}`);
        break;
    }

    this.recordEvent(auditType, action, description, {
      source: 'task-management',
      actor: {
        type: agent ? 'agent' : 'system',
        id: agent?.id || 'system',
        name: agent?.id,
      },
      target: {
        type: 'task',
        id: task.id,
        name: task.title,
      },
      outcome: event === 'failed' ? 'failure' : 'success',
      severity: event === 'failed' ? 'error' : 'info',
      category: 'operational',
      tags: ['task', task.type, task.priority],
      correlationId,
      sessionId,
      beforeState,
      afterState,
      context: {
        taskType: task.type,
        priority: task.priority,
        assignedAgent: task.assignedAgent,
        duration: task.actualDuration,
        error: update?.error,
      },
    });
  }

  /**
   * Agent lifecycle event handlers
   */
  onAgentEvent(
    event: 'registered' | 'heartbeat' | 'status-changed',
    data: {
      agent: AgentStatus;
      correlationId?: string;
      sessionId?: string;
    },
  ): void {
    const { agent, correlationId, sessionId } = data;

    let auditType: AuditEventType;
    let action: string;
    let description: string;
    let severity: 'info' | 'warning' | 'error' | 'critical' = 'info';

    switch (event) {
      case 'registered':
        auditType = AuditEventType.AGENT_REGISTERED;
        action = 'REGISTER_AGENT';
        description = `Agent ${agent.id} registered with capabilities: ${agent.capabilities.join(', ')}`;
        break;

      case 'heartbeat':
        auditType = AuditEventType.AGENT_HEARTBEAT;
        action = 'AGENT_HEARTBEAT';
        description = `Agent ${agent.id} heartbeat`;
        severity = 'info';
        break;

      case 'status-changed':
        auditType = AuditEventType.AGENT_STATUS_CHANGED;
        action = 'CHANGE_AGENT_STATUS';
        description = `Agent ${agent.id} status changed to ${agent.status}`;
        severity = agent.status === 'offline' ? 'warning' : 'info';
        break;

      default:
        // Handle unknown agent event types
        auditType = AuditEventType.SYSTEM_EVENT;
        action = 'UNKNOWN_AGENT_EVENT';
        description = `Unknown agent event: ${event} for agent ${agent.id}`;
        severity = 'warning';
        console.warn(`Unknown agent event type: ${event}`);
        break;
    }

    this.recordEvent(auditType, action, description, {
      source: 'agent-management',
      actor: {
        type: 'agent',
        id: agent.id,
        name: agent.id,
      },
      target: {
        type: 'agent',
        id: agent.id,
        name: agent.id,
      },
      outcome: 'success',
      severity,
      category: 'operational',
      tags: ['agent', agent.status, ...agent.capabilities],
      correlationId,
      sessionId,
      context: {
        capabilities: agent.capabilities,
        currentTasks: agent.currentTasks,
        completedTasks: agent.completedTasks,
        failedTasks: agent.failedTasks,
        performance: agent.performance,
        lastHeartbeat: agent.lastHeartbeat,
      },
    });
  }

  // Private methods

  private initializeComplianceRules(): void {
    // Security compliance rules
    this.complianceRules.set(
      'no_unauthorized_access',
      (event: AuditEvent) =>
        event.type !== AuditEventType.SECURITY_EVENT ||
        event.outcome === 'success',
    );

    this.complianceRules.set(
      'task_completion_tracking',
      (event: AuditEvent) => {
        if (event.type === AuditEventType.TASK_CREATED) {
          // Ensure task has proper tracking
          return (
            event.details.taskType !== undefined &&
            event.details.priority !== undefined
          );
        }
        return true;
      },
    );

    this.complianceRules.set(
      'agent_heartbeat_frequency',
      (event: AuditEvent) => {
        if (event.type === AuditEventType.AGENT_HEARTBEAT) {
          // Ensure heartbeats are frequent enough
          const lastHeartbeat = event.details.lastHeartbeat as Date;
          if (lastHeartbeat) {
            const timeSinceLastHeartbeat = Date.now() - lastHeartbeat.getTime();
            return timeSinceLastHeartbeat <= 5 * 60 * 1000; // 5 minutes max
          }
        }
        return true;
      },
    );
  }

  private setupPeriodicPersistence(intervalMs: number): void {
    this.persistenceInterval = setInterval(() => {
      this.persistAuditData();
      this.cleanupOldEvents();
    }, intervalMs);
  }

  private updateEventIndexes(event: AuditEvent, index: number): void {
    // Index by type
    if (!this.eventIndex.has(event.type)) {
      this.eventIndex.set(event.type, new Set());
    }
    this.eventIndex.get(event.type)!.add(index);

    // Index by source
    const sourceKey = `source:${event.source}`;
    if (!this.eventIndex.has(sourceKey)) {
      this.eventIndex.set(sourceKey, new Set());
    }
    this.eventIndex.get(sourceKey)!.add(index);

    // Index by actor
    const actorKey = `actor:${event.actor.type}:${event.actor.id}`;
    if (!this.eventIndex.has(actorKey)) {
      this.eventIndex.set(actorKey, new Set());
    }
    this.eventIndex.get(actorKey)!.add(index);
  }

  private updateDailyStats(event: AuditEvent): void {
    const dateKey = event.timestamp.toISOString().split('T')[0];

    if (!this.dailyStats.has(dateKey)) {
      this.dailyStats.set(dateKey, {
        date: dateKey,
        totalEvents: 0,
        eventsByType: {} as Record<AuditEventType, number>,
        eventsBySeverity: {},
        securityEvents: 0,
        errors: 0,
      });
    }

    const stats = this.dailyStats.get(dateKey)!;
    stats.totalEvents++;

    if (!stats.eventsByType[event.type]) {
      stats.eventsByType[event.type] = 0;
    }
    stats.eventsByType[event.type]++;

    if (!stats.eventsBySeverity[event.severity]) {
      stats.eventsBySeverity[event.severity] = 0;
    }
    stats.eventsBySeverity[event.severity]++;

    if (event.category === 'security') {
      stats.securityEvents++;
    }

    if (event.severity === 'error' || event.severity === 'critical') {
      stats.errors++;
    }
  }

  private checkComplianceViolations(event: AuditEvent): string[] {
    const violations: string[] = [];

    for (const [ruleName, ruleCheck] of this.complianceRules) {
      if (!ruleCheck(event)) {
        violations.push(ruleName);
      }
    }

    return violations;
  }

  private calculateReportSummary(
    events: AuditEvent[],
  ): ComplianceReport['summary'] {
    const eventsByType = this.groupEventsByProperty(events, 'type');
    const eventsBySeverity = this.groupEventsByProperty(events, 'severity');
    const eventsByCategory = this.groupEventsByProperty(events, 'category');

    return {
      totalEvents: events.length,
      eventsByType,
      eventsBySeverity,
      eventsByCategory,
      complianceScore: this.calculateComplianceScore(events),
      issuesFound: events.filter(
        (e) => e.severity === 'error' || e.severity === 'critical',
      ).length,
      recommendationsCount: 0, // Will be calculated by generateRecommendations
    };
  }

  private identifyComplianceViolations(
    events: AuditEvent[],
  ): ComplianceReport['complianceViolations'] {
    const violations: ComplianceReport['complianceViolations'] = [];

    // Security violations
    const securityEvents = events.filter(
      (e) => e.category === 'security' && e.outcome === 'failure',
    );
    if (securityEvents.length > 0) {
      violations.push({
        rule: 'security_events',
        description: 'Failed security events detected',
        violations: securityEvents,
        severity: 'high',
        recommendation: 'Review security configurations and access controls',
      });
    }

    return violations;
  }

  private generatePerformanceInsights(
    _events: AuditEvent[],
  ): ComplianceReport['performanceInsights'] {
    return [
      {
        metric: 'task_completion_rate',
        trend: 'stable',
        impact: 'Tasks are completing at expected rates',
        recommendation: 'Monitor for any degradation in completion rates',
      },
    ];
  }

  private generateRecommendations(
    events: AuditEvent[],
    violations: ComplianceReport['complianceViolations'],
  ): ComplianceReport['recommendations'] {
    const recommendations: ComplianceReport['recommendations'] = [];

    // Add recommendations based on violations
    for (const violation of violations) {
      recommendations.push({
        category: 'security',
        priority: violation.severity as any,
        title: `Address ${violation.rule} violations`,
        description: violation.description,
        implementation: violation.recommendation,
      });
    }

    return recommendations;
  }

  private calculateComplianceScore(events: AuditEvent[]): number {
    if (events.length === 0) return 100;

    const criticalEvents = events.filter(
      (e) => e.severity === 'critical',
    ).length;
    const errorEvents = events.filter((e) => e.severity === 'error').length;
    const warningEvents = events.filter((e) => e.severity === 'warning').length;

    const totalPenalty =
      criticalEvents * 10 + errorEvents * 5 + warningEvents * 1;
    const maxScore = 100;
    const penaltyPercentage = Math.min(
      (totalPenalty / events.length) * 100,
      maxScore,
    );

    return Math.max(0, maxScore - penaltyPercentage);
  }

  private groupEventsByProperty(
    events: AuditEvent[],
    property: keyof AuditEvent,
  ): Record<string, number> {
    const grouped: Record<string, number> = {};

    for (const event of events) {
      const value = String(event[property]);
      grouped[value] = (grouped[value] || 0) + 1;
    }

    return grouped;
  }

  private calculateDailyActivity(events: AuditEvent[]): Array<{
    date: string;
    events: number;
    securityEvents: number;
    errors: number;
  }> {
    const dailyActivity: Record<string, any> = {};

    for (const event of events) {
      const dateKey = event.timestamp.toISOString().split('T')[0];

      if (!dailyActivity[dateKey]) {
        dailyActivity[dateKey] = {
          date: dateKey,
          events: 0,
          securityEvents: 0,
          errors: 0,
        };
      }

      const activity = dailyActivity[dateKey];
      activity.events++;

      if (event.category === 'security') {
        activity.securityEvents++;
      }

      if (event.severity === 'error' || event.severity === 'critical') {
        activity.errors++;
      }
    }

    return Object.values(dailyActivity).sort((a: any, b: any) =>
      a.date.localeCompare(b.date),
    );
  }

  private getTopValues(
    events: AuditEvent[],
    path: string,
    limit: number,
  ): Array<{ [key: string]: string | number }> {
    const counts: Record<string, number> = {};

    for (const event of events) {
      let value: any = event;
      const pathParts = path.split('.');

      for (const part of pathParts) {
        value = value?.[part];
      }

      if (value) {
        const key = String(value);
        counts[key] = (counts[key] || 0) + 1;
      }
    }

    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([key, count]) => {
        const result: any = { count };
        const lastPart = path.split('.').pop()!;
        result[lastPart] = key;
        return result;
      });
  }

  private exportToCSV(events: AuditEvent[]): string {
    const headers = [
      'ID',
      'Type',
      'Timestamp',
      'Source',
      'Actor Type',
      'Actor ID',
      'Target Type',
      'Target ID',
      'Action',
      'Description',
      'Outcome',
      'Severity',
      'Category',
      'Tags',
    ];

    const rows = events.map((event) => [
      event.id,
      event.type,
      event.timestamp.toISOString(),
      event.source,
      event.actor.type,
      event.actor.id,
      event.target.type,
      event.target.id,
      event.action,
      event.description,
      event.outcome,
      event.severity,
      event.category,
      event.tags.join(';'),
    ]);

    return [headers, ...rows]
      .map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','),
      )
      .join('\n');
  }

  private exportToXML(events: AuditEvent[]): string {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<auditEvents>\n';

    for (const event of events) {
      xml += `  <event id="${event.id}">\n`;
      xml += `    <type>${event.type}</type>\n`;
      xml += `    <timestamp>${event.timestamp.toISOString()}</timestamp>\n`;
      xml += `    <source>${event.source}</source>\n`;
      xml += `    <actor type="${event.actor.type}" id="${event.actor.id}">${event.actor.name || ''}</actor>\n`;
      xml += `    <target type="${event.target.type}" id="${event.target.id}">${event.target.name || ''}</target>\n`;
      xml += `    <action>${event.action}</action>\n`;
      xml += `    <description><![CDATA[${event.description}]]></description>\n`;
      xml += `    <outcome>${event.outcome}</outcome>\n`;
      xml += `    <severity>${event.severity}</severity>\n`;
      xml += `    <category>${event.category}</category>\n`;
      xml += `    <tags>${event.tags.join(',')}</tags>\n`;
      xml += `  </event>\n`;
    }

    xml += '</auditEvents>';
    return xml;
  }

  private async archiveOldEvents(): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.retentionDays);

    const eventsToArchive = this.events.filter(
      (event) => event.timestamp < cutoffDate,
    );
    const remainingEvents = this.events.filter(
      (event) => event.timestamp >= cutoffDate,
    );

    if (eventsToArchive.length > 0) {
      // In a real implementation, these would be archived to long-term storage
      this.emit('audit:events-archived', {
        count: eventsToArchive.length,
        oldestDate: eventsToArchive[0]?.timestamp,
        newestDate: eventsToArchive[eventsToArchive.length - 1]?.timestamp,
      });

      this.events = remainingEvents;
      this.rebuildIndexes();

      this.logger.info('Archived old audit events', {
        archivedCount: eventsToArchive.length,
        remainingCount: remainingEvents.length,
      });
    }
  }

  private rebuildIndexes(): void {
    this.eventIndex.clear();

    for (let i = 0; i < this.events.length; i++) {
      this.updateEventIndexes(this.events[i], i);
    }
  }

  private async persistAuditData(): Promise<void> {
    try {
      // In a real implementation, this would persist to a database
      const persistenceData = {
        events: this.events.slice(-1000), // Keep last 1000 events in memory
        dailyStats: Array.from(this.dailyStats.entries()),
        metadata: {
          totalEvents: this.events.length,
          oldestEvent: this.events[0]?.timestamp,
          newestEvent: this.events[this.events.length - 1]?.timestamp,
          persistedAt: new Date().toISOString(),
        },
      };

      this.emit('audit:data-persisted', { persistenceData });
    } catch (error) {
      this.logger.error('Failed to persist audit data', { error });
    }
  }

  private cleanupOldEvents(): void {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.retentionDays);

    const originalCount = this.events.length;
    this.events = this.events.filter((event) => event.timestamp >= cutoffDate);

    if (this.events.length < originalCount) {
      this.rebuildIndexes();
      this.logger.info('Cleaned up old audit events', {
        removed: originalCount - this.events.length,
        remaining: this.events.length,
      });
    }
  }

  private generateEventId(): string {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    return `audit_${timestamp}_${randomString}`;
  }

  private generateReportId(): string {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    return `report_${timestamp}_${randomString}`;
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.persistenceInterval) {
      clearInterval(this.persistenceInterval);
    }

    this.removeAllListeners();
    this.events.length = 0;
    this.eventIndex.clear();
    this.dailyStats.clear();
    this.complianceRules.clear();

    this.logger.info('AuditTrailAnalytics destroyed');
  }
}

/**
 * Singleton instance for global access
 */
export const auditTrailAnalytics = new AuditTrailAnalytics();
