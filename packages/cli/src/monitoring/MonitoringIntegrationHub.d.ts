/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { EventEmitter } from 'node:events';
import { type MonitoringSnapshot } from './RealTimeMonitoringSystem.js';
import type { ExecutionMonitoringSystem } from '../../core/src/task-management/ExecutionMonitoringSystem.js';
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
export declare class MonitoringIntegrationHub extends EventEmitter {
  private readonly logger;
  private readonly config;
  private coreExecutionMonitoring?;
  private isInitialized;
  private syncInterval?;
  private lastSyncTimestamp?;
  private correlationMap;
  private healthCheckInterval?;
  private systemHealthStatus;
  private eventBuffer;
  private eventBufferSize;
  private exportInterval?;
  private exportPath;
  constructor(config?: Partial<MonitoringIntegrationConfig>);
  /**
   * Initialize the monitoring integration hub
   */
  private initializeIntegration;
  /**
   * Register core execution monitoring system
   */
  registerCoreExecutionMonitoring(
    executionMonitoring: ExecutionMonitoringSystem,
  ): void;
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
  };
  /**
   * Correlate events across monitoring systems
   */
  correlateEvents(correlationId: string, event: CrossSystemEvent): void;
  /**
   * Get aggregated monitoring data
   */
  getAggregatedData(timeRange?: 'last_hour' | 'last_day' | 'last_week'): {
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
  };
  /**
   * Trigger manual synchronization
   */
  triggerSync(): Promise<void>;
  /**
   * Export monitoring data in specified format
   */
  exportData(
    format: 'json' | 'csv' | 'prometheus',
    timeRange?: 'last_hour' | 'last_day' | 'last_week',
  ): Promise<string>;
  /**
   * Configure alert webhooks
   */
  configureWebhooks(
    webhooks: Array<{
      url: string;
      events: string[];
      headers?: Record<string, string>;
    }>,
  ): void;
  private initializeMonitoringSystems;
  private setupCrossSystemEventHandlers;
  private setupCoreExecutionEventForwarding;
  private handleCrossSystemEvent;
  private handleAlertEvent;
  private sendWebhook;
  private startDataSynchronization;
  private performDataSynchronization;
  private startHealthMonitoring;
  private performHealthChecks;
  private getComponentHealthStatus;
  private startMetricsExport;
  private performMetricsExport;
  private convertToCSV;
  private convertToPrometheus;
  /**
   * Graceful shutdown
   */
  shutdown(): Promise<void>;
}
/**
 * Singleton instance for global access
 */
export declare const monitoringIntegrationHub: MonitoringIntegrationHub;
