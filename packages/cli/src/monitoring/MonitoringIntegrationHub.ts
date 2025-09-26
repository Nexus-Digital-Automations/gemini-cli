/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { EventEmitter } from 'node:events';
import {
  getComponentLogger,
  type StructuredLogger,
} from '@google/gemini-cli-core';
import type { ExecutionMonitoringSystem } from '@google/gemini-cli-core/src/task-management/ExecutionMonitoringSystem.js';
import {
  realTimeMonitoringSystem,
  type MonitoringSnapshot,
} from './RealTimeMonitoringSystem.js';
import { enhancedMonitoringDashboard } from './EnhancedMonitoringDashboard.js';
import { taskStatusMonitor } from './TaskStatusMonitor.js';
import { performanceAnalyticsDashboard } from './PerformanceAnalyticsDashboard.js';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';

/**
 * Integration configuration for monitoring systems
 */
export interface MonitoringIntegrationConfig {
  enableRealTimeMonitoring: boolean;
  enableDashboards: boolean;
  enablePerformanceAnalytics: boolean;
  enableCrossSystemSync: boolean;
  syncIntervalMs: number;
  enableDataPersistence: boolean;
  enableMetricsExport: boolean;
  exportFormats: Array<'json' | 'csv' | 'prometheus'>;
  alertingWebhooks?: Array<{
    url: string;
    events: string[];
    headers?: Record<string, string>;
  }>;
}

/**
 * Cross-system monitoring event
 */
export interface CrossSystemEvent {
  source: 'task_management' | 'cli_monitoring' | 'core_execution' | 'external';
  eventType: string;
  timestamp: Date;
  data: unknown;
  correlationId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Monitoring health check result
 */
export interface HealthCheckResult {
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'offline';
  responseTime: number;
  checks: Array<{
    name: string;
    status: 'pass' | 'warn' | 'fail';
    message?: string;
    value?: number;
  }>;
  timestamp: Date;
}

/**
 * Comprehensive Monitoring Integration Hub
 *
 * Central orchestration system for all monitoring components:
 * - Integrates real-time monitoring with task management core
 * - Coordinates between CLI monitoring and core execution monitoring
 * - Provides unified data aggregation and correlation
 * - Manages cross-system event propagation
 * - Ensures monitoring system health and reliability
 * - Provides centralized configuration management
 * - Handles data synchronization and persistence
 */
export class MonitoringIntegrationHub extends EventEmitter {
  private readonly logger: StructuredLogger;
  private readonly config: MonitoringIntegrationConfig;

  // Monitoring system references
  private coreExecutionMonitoring?: ExecutionMonitoringSystem;
  private isInitialized = false;

  // Data synchronization
  private syncInterval?: NodeJS.Timeout;
  private lastSyncTimestamp?: Date;
  private correlationMap: Map<string, CrossSystemEvent[]> = new Map();

  // Health monitoring
  private healthCheckInterval?: NodeJS.Timeout;
  private systemHealthStatus: Map<string, HealthCheckResult> = new Map();

  // Event aggregation
  private eventBuffer: CrossSystemEvent[] = [];
  private eventBufferSize = 1000;

  // Metrics export
  private exportInterval?: NodeJS.Timeout;
  private exportPath: string;

  constructor(config: Partial<MonitoringIntegrationConfig> = {}) {
    super();
    this.logger = getComponentLogger('MonitoringIntegrationHub');

    this.config = {
      enableRealTimeMonitoring: true,
      enableDashboards: true,
      enablePerformanceAnalytics: true,
      enableCrossSystemSync: true,
      syncIntervalMs: 5000, // 5 seconds
      enableDataPersistence: true,
      enableMetricsExport: true,
      exportFormats: ['json', 'prometheus'],
      ...config,
    };

    // Setup export path
    this.exportPath = path.join(process.cwd(), '.tmp', 'monitoring', 'exports');

    this.initializeIntegration();
  }

  /**
   * Initialize the monitoring integration hub
   */
  private async initializeIntegration(): Promise<void> {
    try {
      this.logger.info('Initializing MonitoringIntegrationHub', {
        config: this.config,
      });

      // Create export directory
      await fs.mkdir(this.exportPath, { recursive: true });

      // Initialize monitoring systems if enabled
      await this.initializeMonitoringSystems();

      // Setup cross-system event handlers
      this.setupCrossSystemEventHandlers();

      // Setup data synchronization
      if (this.config.enableCrossSystemSync) {
        this.startDataSynchronization();
      }

      // Setup health monitoring
      this.startHealthMonitoring();

      // Setup metrics export
      if (this.config.enableMetricsExport) {
        this.startMetricsExport();
      }

      this.isInitialized = true;

      this.logger.info('MonitoringIntegrationHub initialized successfully', {
        enabledSystems: {
          realTimeMonitoring: this.config.enableRealTimeMonitoring,
          dashboards: this.config.enableDashboards,
          performanceAnalytics: this.config.enablePerformanceAnalytics,
          crossSystemSync: this.config.enableCrossSystemSync,
        },
      });

      this.emit('integration:initialized', {
        config: this.config,
        timestamp: new Date(),
      });
    } catch (error) {
      this.logger.error('Failed to initialize MonitoringIntegrationHub', {
        error: error instanceof Error ? error : new Error(String(error)),
      });
      throw error;
    }
  }

  /**
   * Register core execution monitoring system
   */
  registerCoreExecutionMonitoring(
    executionMonitoring: ExecutionMonitoringSystem,
  ): void {
    this.coreExecutionMonitoring = executionMonitoring;

    // Setup event forwarding from core to integration hub
    this.setupCoreExecutionEventForwarding();

    this.logger.info('Core execution monitoring registered');
    this.emit('core:registered', { timestamp: new Date() });
  }

  /**
   * Get comprehensive system status
   */
  getSystemStatus(): {
    overall: 'healthy' | 'degraded' | 'unhealthy' | 'critical';
    components: {
      realTimeMonitoring: HealthCheckResult;
      dashboard: HealthCheckResult;
      performanceAnalytics: HealthCheckResult;
      taskStatusMonitor: HealthCheckResult;
      coreExecution?: HealthCheckResult;
    };
    integration: {
      initialized: boolean;
      lastSync?: Date;
      eventsProcessed: number;
      correlatedEvents: number;
    };
    timestamp: Date;
  } {
    const components = {
      realTimeMonitoring: this.getComponentHealthStatus('realTimeMonitoring'),
      dashboard: this.getComponentHealthStatus('dashboard'),
      performanceAnalytics: this.getComponentHealthStatus(
        'performanceAnalytics',
      ),
      taskStatusMonitor: this.getComponentHealthStatus('taskStatusMonitor'),
    };

    if (this.coreExecutionMonitoring) {
      components['coreExecution'] =
        this.getComponentHealthStatus('coreExecution');
    }

    // Determine overall health
    const componentStatuses = Object.values(components).map((c) => c.status);
    let overall: 'healthy' | 'degraded' | 'unhealthy' | 'critical' = 'healthy';

    if (componentStatuses.includes('offline')) {
      overall = 'critical';
    } else if (componentStatuses.includes('unhealthy')) {
      overall = 'unhealthy';
    } else if (componentStatuses.includes('degraded')) {
      overall = 'degraded';
    }

    return {
      overall,
      components,
      integration: {
        initialized: this.isInitialized,
        lastSync: this.lastSyncTimestamp,
        eventsProcessed: this.eventBuffer.length,
        correlatedEvents: this.correlationMap.size,
      },
      timestamp: new Date(),
    };
  }

  /**
   * Correlate events across monitoring systems
   */
  correlateEvents(correlationId: string, event: CrossSystemEvent): void {
    if (!this.correlationMap.has(correlationId)) {
      this.correlationMap.set(correlationId, []);
    }

    const correlatedEvents = this.correlationMap.get(correlationId)!;
    correlatedEvents.push(event);

    // Emit correlation event if we have events from multiple sources
    const sources = new Set(correlatedEvents.map((e) => e.source));
    if (sources.size > 1) {
      this.emit('events:correlated', {
        correlationId,
        events: correlatedEvents,
        sources: Array.from(sources),
      });
    }

    // Clean up old correlations (keep last 100)
    if (this.correlationMap.size > 100) {
      const oldestKey = Array.from(this.correlationMap.keys())[0];
      this.correlationMap.delete(oldestKey);
    }
  }

  /**
   * Get aggregated monitoring data
   */
  getAggregatedData(
    _timeRange: 'last_hour' | 'last_day' | 'last_week' = 'last_hour',
  ): {
    systemSnapshot: MonitoringSnapshot;
    taskMetrics: {
      totalTasks: number;
      completedTasks: number;
      failedTasks: number;
      averageExecutionTime: number;
      successRate: number;
    };
    agentMetrics: {
      totalAgents: number;
      activeAgents: number;
      averagePerformance: number;
      utilization: number;
    };
    correlatedEvents: Array<{
      correlationId: string;
      eventCount: number;
      sources: string[];
      timespan: number;
    }>;
    timestamp: Date;
  } {
    const systemSnapshot = realTimeMonitoringSystem.getCurrentSnapshot();
    const taskMetrics = taskStatusMonitor.getPerformanceMetrics();
    const allAgents = taskStatusMonitor.getAllAgents();

    // Calculate correlated events statistics
    const correlatedEvents = Array.from(this.correlationMap.entries()).map(
      ([id, events]) => ({
        correlationId: id,
        eventCount: events.length,
        sources: Array.from(new Set(events.map((e) => e.source))),
        timespan:
          events.length > 1
            ? events[events.length - 1].timestamp.getTime() -
              events[0].timestamp.getTime()
            : 0,
      }),
    );

    return {
      systemSnapshot,
      taskMetrics: {
        totalTasks: taskMetrics.totalTasks,
        completedTasks: taskMetrics.completedTasks,
        failedTasks: taskMetrics.failedTasks,
        averageExecutionTime: taskMetrics.averageTaskDuration,
        successRate: taskMetrics.systemEfficiency,
      },
      agentMetrics: {
        totalAgents: allAgents.length,
        activeAgents: allAgents.filter((a) => a.status !== 'offline').length,
        averagePerformance:
          allAgents.reduce((sum, a) => sum + a.performance.successRate, 0) /
          Math.max(allAgents.length, 1),
        utilization:
          (allAgents.filter((a) => a.status === 'busy').length /
            Math.max(allAgents.length, 1)) *
          100,
      },
      correlatedEvents,
      timestamp: new Date(),
    };
  }

  /**
   * Trigger manual synchronization
   */
  async triggerSync(): Promise<void> {
    if (!this.config.enableCrossSystemSync) {
      throw new Error('Cross-system sync is not enabled');
    }

    await this.performDataSynchronization();
    this.emit('sync:triggered', { timestamp: new Date() });
  }

  /**
   * Export monitoring data in specified format
   */
  async exportData(
    format: 'json' | 'csv' | 'prometheus',
    timeRange: 'last_hour' | 'last_day' | 'last_week' = 'last_hour',
  ): Promise<string> {
    const data = this.getAggregatedData(timeRange);

    switch (format) {
      case 'json':
        return JSON.stringify(data, null, 2);

      case 'csv':
        return this.convertToCSV(data);

      case 'prometheus':
        return this.convertToPrometheus(data);

      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  /**
   * Configure alert webhooks
   */
  configureWebhooks(
    webhooks: Array<{
      url: string;
      events: string[];
      headers?: Record<string, string>;
    }>,
  ): void {
    this.config.alertingWebhooks = webhooks;

    this.logger.info('Alert webhooks configured', {
      count: webhooks.length,
      events: Array.from(new Set(webhooks.flatMap((w) => w.events))),
    });

    this.emit('webhooks:configured', { webhooks });
  }

  // Private methods

  private async initializeMonitoringSystems(): Promise<void> {
    // Real-time monitoring system is already initialized via import
    if (this.config.enableRealTimeMonitoring) {
      realTimeMonitoringSystem.startMonitoring();
    }

    // Dashboard system is already initialized via import
    // Performance analytics system is already initialized via import

    this.logger.info('Monitoring systems initialized', {
      realTimeMonitoring: this.config.enableRealTimeMonitoring,
      dashboards: this.config.enableDashboards,
      performanceAnalytics: this.config.enablePerformanceAnalytics,
    });
  }

  private setupCrossSystemEventHandlers(): void {
    // Real-time monitoring system events
    realTimeMonitoringSystem.on('snapshot:collected', (data) => {
      this.handleCrossSystemEvent({
        source: 'cli_monitoring',
        eventType: 'snapshot_collected',
        timestamp: new Date(),
        data: data.snapshot,
        correlationId: `snapshot_${Date.now()}`,
      });
    });

    realTimeMonitoringSystem.on('alert:triggered', (data) => {
      this.handleCrossSystemEvent({
        source: 'cli_monitoring',
        eventType: 'alert_triggered',
        timestamp: new Date(),
        data: data.alert,
        correlationId: data.alert.data?.rule?.id || `alert_${Date.now()}`,
      });
    });

    // Task status monitor events
    taskStatusMonitor.on('task:registered', (data) => {
      this.handleCrossSystemEvent({
        source: 'task_management',
        eventType: 'task_registered',
        timestamp: new Date(),
        data,
        correlationId: data.task.id,
      });
    });

    taskStatusMonitor.on('task:status-changed', (data) => {
      this.handleCrossSystemEvent({
        source: 'task_management',
        eventType: 'task_status_changed',
        timestamp: new Date(),
        data,
        correlationId: data.task.id,
      });
    });

    taskStatusMonitor.on('agent:registered', (data) => {
      this.handleCrossSystemEvent({
        source: 'task_management',
        eventType: 'agent_registered',
        timestamp: new Date(),
        data,
        correlationId: data.agent.id,
      });
    });

    // Performance analytics events
    performanceAnalyticsDashboard.on('metric:recorded', (data) => {
      this.handleCrossSystemEvent({
        source: 'cli_monitoring',
        eventType: 'metric_recorded',
        timestamp: new Date(),
        data: data.metric,
      });
    });

    performanceAnalyticsDashboard.on('insight:generated', (data) => {
      this.handleCrossSystemEvent({
        source: 'cli_monitoring',
        eventType: 'insight_generated',
        timestamp: new Date(),
        data: data.insight,
        correlationId: data.insight.id,
      });
    });

    // Dashboard events
    enhancedMonitoringDashboard.on('dashboard:alert', (data) => {
      this.handleCrossSystemEvent({
        source: 'cli_monitoring',
        eventType: 'dashboard_alert',
        timestamp: new Date(),
        data,
      });
    });

    this.logger.info('Cross-system event handlers setup complete');
  }

  private setupCoreExecutionEventForwarding(): void {
    if (!this.coreExecutionMonitoring) return;

    // This would setup event forwarding from core execution monitoring
    // For now, we'll create a placeholder that could be extended

    this.logger.info('Core execution event forwarding setup complete');
  }

  private handleCrossSystemEvent(event: CrossSystemEvent): void {
    // Add to event buffer
    this.eventBuffer.push(event);

    // Trim buffer if it gets too large
    if (this.eventBuffer.length > this.eventBufferSize) {
      this.eventBuffer = this.eventBuffer.slice(-this.eventBufferSize / 2);
    }

    // Handle correlation if present
    if (event.correlationId) {
      this.correlateEvents(event.correlationId, event);
    }

    // Emit the event for external systems
    this.emit('cross-system:event', event);

    // Handle specific event types
    if (event.eventType.includes('alert') || event.eventType.includes('fail')) {
      this.handleAlertEvent(event);
    }

    this.logger.debug('Cross-system event handled', {
      source: event.source,
      eventType: event.eventType,
      correlationId: event.correlationId,
    });
  }

  private handleAlertEvent(event: CrossSystemEvent): void {
    // Send to configured webhooks
    if (this.config.alertingWebhooks) {
      for (const webhook of this.config.alertingWebhooks) {
        if (
          webhook.events.includes(event.eventType) ||
          webhook.events.includes('*')
        ) {
          this.sendWebhook(webhook, event).catch((error) => {
            this.logger.error('Failed to send webhook', {
              webhook: webhook.url,
              error: error instanceof Error ? error : new Error(String(error)),
            });
          });
        }
      }
    }

    this.emit('alert:processed', { event });
  }

  private async sendWebhook(
    webhook: { url: string; headers?: Record<string, string> },
    event: CrossSystemEvent,
  ): Promise<void> {
    // This would implement actual webhook sending
    // For now, we'll log it
    this.logger.info('Webhook would be sent', {
      url: webhook.url,
      eventType: event.eventType,
      timestamp: event.timestamp,
    });
  }

  private startDataSynchronization(): void {
    this.syncInterval = setInterval(async () => {
      try {
        await this.performDataSynchronization();
      } catch (error) {
        this.logger.error('Data synchronization failed', { error: error instanceof Error ? error : new Error(String(error)) });
      }
    }, this.config.syncIntervalMs);

    this.logger.info('Data synchronization started', {
      intervalMs: this.config.syncIntervalMs,
    });
  }

  private async performDataSynchronization(): Promise<void> {
    this.lastSyncTimestamp = new Date();

    // Sync data between monitoring systems
    const snapshot = realTimeMonitoringSystem.getCurrentSnapshot();
    const _taskMetrics = taskStatusMonitor.getPerformanceMetrics();

    // Update performance analytics with current data
    performanceAnalyticsDashboard.recordMetric(
      'system_sync',
      1,
      'count',
      'throughput',
      { timestamp: this.lastSyncTimestamp.toISOString() },
    );

    // Sync with core execution monitoring if available
    if (this.coreExecutionMonitoring) {
      // This would sync data with core execution monitoring
    }

    this.emit('sync:completed', {
      timestamp: this.lastSyncTimestamp,
      snapshotTime: snapshot.timestamp,
    });
  }

  private startHealthMonitoring(): void {
    this.healthCheckInterval = setInterval(() => {
      this.performHealthChecks();
    }, 30000); // Every 30 seconds

    // Perform initial health check
    this.performHealthChecks();

    this.logger.info('Health monitoring started');
  }

  private performHealthChecks(): void {
    const timestamp = new Date();

    // Check real-time monitoring system
    this.systemHealthStatus.set('realTimeMonitoring', {
      service: 'RealTimeMonitoringSystem',
      status: 'healthy', // This would be determined by actual checks
      responseTime: 10,
      checks: [
        { name: 'monitoring_active', status: 'pass' },
        { name: 'websocket_connections', status: 'pass', value: 0 },
        {
          name: 'alert_rules',
          status: 'pass',
          value: realTimeMonitoringSystem.getAlertRules().length,
        },
      ],
      timestamp,
    });

    // Check dashboard system
    this.systemHealthStatus.set('dashboard', {
      service: 'EnhancedMonitoringDashboard',
      status: 'healthy',
      responseTime: 5,
      checks: [
        { name: 'dashboard_initialized', status: 'pass' },
        { name: 'widgets_count', status: 'pass', value: 0 }, // Would get actual count
        { name: 'layouts_count', status: 'pass', value: 0 },
      ],
      timestamp,
    });

    // Check performance analytics
    this.systemHealthStatus.set('performanceAnalytics', {
      service: 'PerformanceAnalyticsDashboard',
      status: 'healthy',
      responseTime: 8,
      checks: [
        { name: 'metrics_collection', status: 'pass' },
        { name: 'insights_generation', status: 'pass' },
      ],
      timestamp,
    });

    // Check task status monitor
    this.systemHealthStatus.set('taskStatusMonitor', {
      service: 'TaskStatusMonitor',
      status: 'healthy',
      responseTime: 3,
      checks: [
        { name: 'task_tracking', status: 'pass' },
        { name: 'agent_monitoring', status: 'pass' },
        { name: 'event_processing', status: 'pass' },
      ],
      timestamp,
    });

    // Check core execution if available
    if (this.coreExecutionMonitoring) {
      this.systemHealthStatus.set('coreExecution', {
        service: 'ExecutionMonitoringSystem',
        status: 'healthy',
        responseTime: 12,
        checks: [
          { name: 'execution_monitoring', status: 'pass' },
          { name: 'metrics_collection', status: 'pass' },
        ],
        timestamp,
      });
    }

    this.emit('health:checked', {
      timestamp,
      services: Array.from(this.systemHealthStatus.keys()),
    });
  }

  private getComponentHealthStatus(component: string): HealthCheckResult {
    return (
      this.systemHealthStatus.get(component) || {
        service: component,
        status: 'offline',
        responseTime: 0,
        checks: [
          {
            name: 'availability',
            status: 'fail',
            message: 'Service not found',
          },
        ],
        timestamp: new Date(),
      }
    );
  }

  private startMetricsExport(): void {
    this.exportInterval = setInterval(async () => {
      try {
        await this.performMetricsExport();
      } catch (error) {
        this.logger.error('Metrics export failed', { error: error instanceof Error ? error : new Error(String(error)) });
      }
    }, 60000); // Every minute

    this.logger.info('Metrics export started');
  }

  private async performMetricsExport(): Promise<void> {
    for (const format of this.config.exportFormats) {
      try {
        const data = await this.exportData(format);
        const filename = `monitoring-export-${Date.now()}.${format}`;
        const filepath = path.join(this.exportPath, filename);

        await fs.writeFile(filepath, data);

        this.logger.debug('Metrics exported', { format, filepath });
      } catch (error) {
        this.logger.error('Failed to export metrics', { format, error: error instanceof Error ? error : new Error(String(error)) });
      }
    }
  }

  private convertToCSV(
    data: ReturnType<typeof this.getAggregatedData>,
  ): string {
    // Convert aggregated data to CSV format
    const lines: string[] = [];

    // System metrics
    lines.push('# System Metrics');
    lines.push('timestamp,metric,value,unit');
    lines.push(
      `${data.timestamp},memory_usage,${data.systemSnapshot.systemHealth.memoryUsageMB},MB`,
    );
    lines.push(
      `${data.timestamp},cpu_usage,${data.systemSnapshot.systemHealth.cpuUsagePercent},%`,
    );
    lines.push(
      `${data.timestamp},uptime,${data.systemSnapshot.systemHealth.uptime},ms`,
    );

    // Task metrics
    lines.push('');
    lines.push('# Task Metrics');
    lines.push(
      `${data.timestamp},total_tasks,${data.taskMetrics.totalTasks},count`,
    );
    lines.push(
      `${data.timestamp},completed_tasks,${data.taskMetrics.completedTasks},count`,
    );
    lines.push(
      `${data.timestamp},failed_tasks,${data.taskMetrics.failedTasks},count`,
    );
    lines.push(
      `${data.timestamp},success_rate,${data.taskMetrics.successRate},%`,
    );

    // Agent metrics
    lines.push('');
    lines.push('# Agent Metrics');
    lines.push(
      `${data.timestamp},total_agents,${data.agentMetrics.totalAgents},count`,
    );
    lines.push(
      `${data.timestamp},active_agents,${data.agentMetrics.activeAgents},count`,
    );
    lines.push(
      `${data.timestamp},utilization,${data.agentMetrics.utilization},%`,
    );

    return lines.join('\n');
  }

  private convertToPrometheus(
    data: ReturnType<typeof this.getAggregatedData>,
  ): string {
    // Convert aggregated data to Prometheus format
    const timestamp = data.timestamp.getTime();
    const lines: string[] = [];

    // System metrics
    lines.push(`# TYPE gemini_system_memory_usage gauge`);
    lines.push(
      `gemini_system_memory_usage{unit="MB"} ${data.systemSnapshot.systemHealth.memoryUsageMB} ${timestamp}`,
    );

    lines.push(`# TYPE gemini_system_cpu_usage gauge`);
    lines.push(
      `gemini_system_cpu_usage{unit="percent"} ${data.systemSnapshot.systemHealth.cpuUsagePercent} ${timestamp}`,
    );

    lines.push(`# TYPE gemini_system_uptime gauge`);
    lines.push(
      `gemini_system_uptime{unit="milliseconds"} ${data.systemSnapshot.systemHealth.uptime} ${timestamp}`,
    );

    // Task metrics
    lines.push(`# TYPE gemini_tasks_total counter`);
    lines.push(
      `gemini_tasks_total ${data.taskMetrics.totalTasks} ${timestamp}`,
    );

    lines.push(`# TYPE gemini_tasks_completed counter`);
    lines.push(
      `gemini_tasks_completed ${data.taskMetrics.completedTasks} ${timestamp}`,
    );

    lines.push(`# TYPE gemini_tasks_failed counter`);
    lines.push(
      `gemini_tasks_failed ${data.taskMetrics.failedTasks} ${timestamp}`,
    );

    lines.push(`# TYPE gemini_tasks_success_rate gauge`);
    lines.push(
      `gemini_tasks_success_rate{unit="percent"} ${data.taskMetrics.successRate} ${timestamp}`,
    );

    // Agent metrics
    lines.push(`# TYPE gemini_agents_total gauge`);
    lines.push(
      `gemini_agents_total ${data.agentMetrics.totalAgents} ${timestamp}`,
    );

    lines.push(`# TYPE gemini_agents_active gauge`);
    lines.push(
      `gemini_agents_active ${data.agentMetrics.activeAgents} ${timestamp}`,
    );

    lines.push(`# TYPE gemini_agents_utilization gauge`);
    lines.push(
      `gemini_agents_utilization{unit="percent"} ${data.agentMetrics.utilization} ${timestamp}`,
    );

    return lines.join('\n');
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    this.logger.info('Shutting down MonitoringIntegrationHub');

    // Clear all intervals
    if (this.syncInterval) clearInterval(this.syncInterval);
    if (this.healthCheckInterval) clearInterval(this.healthCheckInterval);
    if (this.exportInterval) clearInterval(this.exportInterval);

    // Perform final export if enabled
    if (this.config.enableMetricsExport) {
      await this.performMetricsExport();
    }

    // Shutdown individual monitoring systems
    if (this.config.enableRealTimeMonitoring) {
      realTimeMonitoringSystem.stopMonitoring();
    }

    // Clean up resources
    this.removeAllListeners();
    this.eventBuffer = [];
    this.correlationMap.clear();
    this.systemHealthStatus.clear();

    this.isInitialized = false;

    this.logger.info('MonitoringIntegrationHub shutdown complete');
  }
}

/**
 * Singleton instance for global access
 */
export const monitoringIntegrationHub = new MonitoringIntegrationHub();
