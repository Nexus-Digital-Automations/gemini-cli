/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * System Monitor and Alerting Service
 *
 * Provides comprehensive monitoring and alerting for the autonomous task management system:
 * - Real-time performance metrics collection
 * - Health monitoring of all system components
 * - Intelligent alerting based on configurable thresholds
 * - Historical data tracking and trend analysis
 * - Dashboard data for system observability
 */

import { EventEmitter } from 'node:events';
import { promisify } from 'node:util';
import { exec } from 'node:child_process';
import os from 'node:os';
import type { Config } from '../index.js';
import type {
  AutonomousTaskIntegrator,
  AutonomousTask,
  RegisteredAgent,
} from './autonomousTaskIntegrator.js';
import type { IntegrationBridge } from './integrationBridge.js';

const execAsync = promisify(exec);

export interface SystemMetrics {
  timestamp: Date;
  system: {
    uptime: number;
    cpu: {
      usage: number;
      cores: number;
    };
    memory: {
      used: number;
      total: number;
      percentage: number;
    };
    process: {
      pid: number;
      memory: number;
      cpu: number;
    };
  };
  tasks: {
    total: number;
    queued: number;
    assigned: number;
    in_progress: number;
    completed: number;
    failed: number;
    cancelled: number;
    avgWaitTime: number;
    avgExecutionTime: number;
    throughput: number; // tasks completed per hour
  };
  agents: {
    total: number;
    active: number;
    busy: number;
    idle: number;
    offline: number;
    avgLoadPerAgent: number;
    responseTime: number;
  };
  integrator: {
    queueDepth: number;
    processingRate: number;
    errorRate: number;
    successRate: number;
  };
  bridge: {
    apiCalls: number;
    apiErrors: number;
    apiLatency: number;
    syncStatus: 'healthy' | 'degraded' | 'failed';
  };
}

export interface Alert {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  category:
    | 'performance'
    | 'availability'
    | 'capacity'
    | 'security'
    | 'integration';
  title: string;
  description: string;
  metrics: Record<string, number>;
  threshold: Record<string, number>;
  timestamp: Date;
  resolved?: Date;
  source: string;
  tags: string[];
}

export interface MonitoringConfig {
  enabled: boolean;
  metricsInterval: number; // milliseconds
  alertingEnabled: boolean;
  retentionDays: number;
  thresholds: {
    cpu: {
      warning: number;
      critical: number;
    };
    memory: {
      warning: number;
      critical: number;
    };
    queueDepth: {
      warning: number;
      critical: number;
    };
    errorRate: {
      warning: number;
      critical: number;
    };
    responseTime: {
      warning: number;
      critical: number;
    };
    agentAvailability: {
      warning: number;
      critical: number;
    };
  };
  dashboardConfig: {
    refreshInterval: number;
    historyPeriod: number;
  };
}

/**
 * Comprehensive system monitoring and alerting service
 */
export class SystemMonitor extends EventEmitter {
  private config: Config;
  private monitoringConfig: MonitoringConfig;
  private taskIntegrator?: AutonomousTaskIntegrator;
  private integrationBridge?: IntegrationBridge;
  private metricsHistory: SystemMetrics[] = [];
  private activeAlerts: Map<string, Alert> = new Map();
  private alertHistory: Alert[] = [];
  private monitoringTimer?: NodeJS.Timeout;
  private isMonitoring = false;
  private startTime = Date.now();
  private metricsCache: SystemMetrics | null = null;
  private cacheTTL = 5000; // 5 seconds

  constructor(config: Config, monitoringConfig?: Partial<MonitoringConfig>) {
    super();
    this.config = config;
    this.monitoringConfig = {
      enabled: true,
      metricsInterval: 30000, // 30 seconds
      alertingEnabled: true,
      retentionDays: 7,
      thresholds: {
        cpu: { warning: 70, critical: 90 },
        memory: { warning: 80, critical: 95 },
        queueDepth: { warning: 100, critical: 500 },
        errorRate: { warning: 5, critical: 15 }, // percentage
        responseTime: { warning: 5000, critical: 10000 }, // milliseconds
        agentAvailability: { warning: 80, critical: 60 }, // percentage
      },
      dashboardConfig: {
        refreshInterval: 10000, // 10 seconds
        historyPeriod: 3600000, // 1 hour
      },
      ...monitoringConfig,
    };
  }

  /**
   * Initialize the monitoring system
   */
  async initialize(
    taskIntegrator?: AutonomousTaskIntegrator,
    integrationBridge?: IntegrationBridge,
  ): Promise<void> {
    this.taskIntegrator = taskIntegrator;
    this.integrationBridge = integrationBridge;

    if (this.monitoringConfig.enabled) {
      await this.startMonitoring();
    }

    this.emit('monitor_initialized', {
      timestamp: new Date(),
      config: this.monitoringConfig,
    });

    console.log('📊 System Monitor initialized');
  }

  /**
   * Start continuous system monitoring
   */
  async startMonitoring(): Promise<void> {
    if (this.isMonitoring) {
      return;
    }

    this.isMonitoring = true;
    console.log('🔍 Starting system monitoring...');

    // Collect initial metrics
    await this.collectMetrics();

    // Start periodic monitoring
    this.monitoringTimer = setInterval(async () => {
      try {
        await this.collectMetrics();
        await this.evaluateAlerts();
        await this.cleanupOldData();
      } catch (error) {
        console.error('❌ Monitoring cycle failed:', error);
        this.emit('monitoring_error', { error, timestamp: new Date() });
      }
    }, this.monitoringConfig.metricsInterval);

    this.emit('monitoring_started', { timestamp: new Date() });
  }

  /**
   * Stop system monitoring
   */
  stopMonitoring(): void {
    if (!this.isMonitoring) {
      return;
    }

    this.isMonitoring = false;

    if (this.monitoringTimer) {
      clearInterval(this.monitoringTimer);
      this.monitoringTimer = undefined;
    }

    console.log('🛑 System monitoring stopped');
    this.emit('monitoring_stopped', { timestamp: new Date() });
  }

  /**
   * Get current system status and metrics
   */
  async getCurrentMetrics(): Promise<SystemMetrics> {
    // Use cached metrics if within TTL
    if (
      this.metricsCache &&
      Date.now() - this.metricsCache.timestamp.getTime() < this.cacheTTL
    ) {
      return this.metricsCache;
    }

    const metrics = await this.collectMetrics();
    this.metricsCache = metrics;
    return metrics;
  }

  /**
   * Get historical metrics for dashboard
   */
  getHistoricalMetrics(period?: number): SystemMetrics[] {
    const since =
      Date.now() -
      (period || this.monitoringConfig.dashboardConfig.historyPeriod);
    return this.metricsHistory.filter((m) => m.timestamp.getTime() >= since);
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): Alert[] {
    return Array.from(this.activeAlerts.values());
  }

  /**
   * Get alert history
   */
  getAlertHistory(limit = 100): Alert[] {
    return this.alertHistory
      .slice(-limit)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Get system health summary
   */
  getHealthSummary(): {
    status: 'healthy' | 'warning' | 'critical';
    score: number;
    issues: string[];
    uptime: number;
    lastCheck: Date;
  } {
    const activeAlerts = this.getActiveAlerts();
    const criticalAlerts = activeAlerts.filter(
      (a) => a.severity === 'critical',
    );
    const warningAlerts = activeAlerts.filter(
      (a) => a.severity === 'high' || a.severity === 'medium',
    );

    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    let score = 100;
    const issues: string[] = [];

    if (criticalAlerts.length > 0) {
      status = 'critical';
      score -= criticalAlerts.length * 30;
      issues.push(`${criticalAlerts.length} critical alerts`);
    }

    if (warningAlerts.length > 0 && status === 'healthy') {
      status = 'warning';
      score -= warningAlerts.length * 10;
      issues.push(`${warningAlerts.length} warning alerts`);
    }

    return {
      status,
      score: Math.max(0, score),
      issues,
      uptime: Date.now() - this.startTime,
      lastCheck: this.metricsCache?.timestamp || new Date(),
    };
  }

  /**
   * Create custom alert
   */
  createAlert(alertConfig: Omit<Alert, 'id' | 'timestamp'>): Alert {
    const alert: Alert = {
      id: this.generateAlertId(),
      timestamp: new Date(),
      ...alertConfig,
    };

    this.activeAlerts.set(alert.id, alert);
    this.alertHistory.push(alert);

    this.emit('alert_created', alert);
    console.warn(`⚠️  Alert: ${alert.title}`);

    return alert;
  }

  /**
   * Resolve an active alert
   */
  resolveAlert(alertId: string): boolean {
    const alert = this.activeAlerts.get(alertId);
    if (!alert) {
      return false;
    }

    alert.resolved = new Date();
    this.activeAlerts.delete(alertId);

    this.emit('alert_resolved', alert);
    console.log(`✅ Alert resolved: ${alert.title}`);

    return true;
  }

  // Private methods

  private async collectMetrics(): Promise<SystemMetrics> {
    const timestamp = new Date();

    // System metrics
    const systemMetrics = await this.collectSystemMetrics();

    // Task metrics
    const taskMetrics = this.collectTaskMetrics();

    // Agent metrics
    const agentMetrics = this.collectAgentMetrics();

    // Integration metrics
    const integratorMetrics = this.collectIntegratorMetrics();
    const bridgeMetrics = this.collectBridgeMetrics();

    const metrics: SystemMetrics = {
      timestamp,
      system: systemMetrics,
      tasks: taskMetrics,
      agents: agentMetrics,
      integrator: integratorMetrics,
      bridge: bridgeMetrics,
    };

    // Store metrics
    this.metricsHistory.push(metrics);

    // Emit metrics event
    this.emit('metrics_collected', metrics);

    return metrics;
  }

  private async collectSystemMetrics(): Promise<SystemMetrics['system']> {
    try {
      // Get system uptime
      const uptime = process.uptime();

      // Get CPU usage (simplified approach)
      const cpuUsage = process.cpuUsage();
      const cpuPercentage =
        ((cpuUsage.user + cpuUsage.system) / 1000000 / uptime) * 100;

      // Get memory usage
      const memUsage = process.memoryUsage();
      const totalSystemMemory = await this.getSystemMemory();

      return {
        uptime,
        cpu: {
          usage: Math.min(100, cpuPercentage),
          cores: os.cpus().length,
        },
        memory: {
          used: memUsage.heapUsed,
          total: totalSystemMemory,
          percentage: (memUsage.heapUsed / totalSystemMemory) * 100,
        },
        process: {
          pid: process.pid,
          memory: memUsage.rss,
          cpu: cpuPercentage,
        },
      };
    } catch (error) {
      console.error('Failed to collect system metrics:', error);
      return {
        uptime: process.uptime(),
        cpu: { usage: 0, cores: 1 },
        memory: { used: 0, total: 0, percentage: 0 },
        process: { pid: process.pid, memory: 0, cpu: 0 },
      };
    }
  }

  private collectTaskMetrics(): SystemMetrics['tasks'] {
    if (!this.taskIntegrator) {
      return {
        total: 0,
        queued: 0,
        assigned: 0,
        in_progress: 0,
        completed: 0,
        failed: 0,
        cancelled: 0,
        avgWaitTime: 0,
        avgExecutionTime: 0,
        throughput: 0,
      };
    }

    const status = this.taskIntegrator.getSystemStatus();

    // Calculate averages from recent metrics
    const recentMetrics = this.metricsHistory.slice(-12); // Last 6 minutes
    const avgWaitTime =
      recentMetrics.length > 0
        ? recentMetrics.reduce((sum, m) => sum + m.tasks.avgWaitTime, 0) /
          recentMetrics.length
        : status.queue.avgWaitTime;

    const completedInLastHour = this.metricsHistory
      .filter((m) => Date.now() - m.timestamp.getTime() < 3600000)
      .reduce((sum, m) => sum + m.tasks.completed, 0);

    return {
      total: status.tasks.total,
      queued: status.tasks.byStatus.queued || 0,
      assigned: status.tasks.byStatus.assigned || 0,
      in_progress: status.tasks.byStatus.in_progress || 0,
      completed: status.tasks.byStatus.completed || 0,
      failed: status.tasks.byStatus.failed || 0,
      cancelled: status.tasks.byStatus.cancelled || 0,
      avgWaitTime,
      avgExecutionTime: 0, // Would be calculated from task completion data
      throughput: completedInLastHour,
    };
  }

  private collectAgentMetrics(): SystemMetrics['agents'] {
    if (!this.taskIntegrator) {
      return {
        total: 0,
        active: 0,
        busy: 0,
        idle: 0,
        offline: 0,
        avgLoadPerAgent: 0,
        responseTime: 0,
      };
    }

    const status = this.taskIntegrator.getSystemStatus();

    return {
      total: status.agents.total,
      active: status.agents.active,
      busy: status.agents.busy,
      idle: status.agents.idle,
      offline: status.agents.offline,
      avgLoadPerAgent:
        status.agents.total > 0 ? status.tasks.total / status.agents.total : 0,
      responseTime: 0, // Would be calculated from agent response times
    };
  }

  private collectIntegratorMetrics(): SystemMetrics['integrator'] {
    if (!this.taskIntegrator) {
      return {
        queueDepth: 0,
        processingRate: 0,
        errorRate: 0,
        successRate: 100,
      };
    }

    const status = this.taskIntegrator.getSystemStatus();
    const totalTasks = status.tasks.total;
    const failedTasks = status.tasks.byStatus.failed || 0;
    const completedTasks = status.tasks.byStatus.completed || 0;

    return {
      queueDepth: status.queue.depth,
      processingRate: 0, // Tasks processed per minute
      errorRate: totalTasks > 0 ? (failedTasks / totalTasks) * 100 : 0,
      successRate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 100,
    };
  }

  private collectBridgeMetrics(): SystemMetrics['bridge'] {
    // This would be enhanced with actual bridge metrics
    return {
      apiCalls: 0,
      apiErrors: 0,
      apiLatency: 0,
      syncStatus: 'healthy',
    };
  }

  private async getSystemMemory(): Promise<number> {
    try {
      const { stdout } = await execAsync('sysctl -n hw.memsize');
      return parseInt(stdout.trim(), 10);
    } catch (_error) {
      // Fallback for non-macOS systems
      try {
        return os.totalmem();
      } catch {
        return 8 * 1024 * 1024 * 1024; // 8GB default
      }
    }
  }

  private async evaluateAlerts(): Promise<void> {
    if (!this.monitoringConfig.alertingEnabled) {
      return;
    }

    const metrics = this.metricsCache;
    if (!metrics) {
      return;
    }

    const thresholds = this.monitoringConfig.thresholds;

    // CPU Usage Alerts
    if (metrics.system.cpu.usage >= thresholds.cpu.critical) {
      this.createAlert({
        severity: 'critical',
        category: 'performance',
        title: 'Critical CPU Usage',
        description: `CPU usage is ${metrics.system.cpu.usage.toFixed(1)}%, exceeding critical threshold of ${thresholds.cpu.critical}%`,
        metrics: { cpu_usage: metrics.system.cpu.usage },
        threshold: { cpu_critical: thresholds.cpu.critical },
        source: 'SystemMonitor',
        tags: ['cpu', 'performance', 'system'],
      });
    } else if (metrics.system.cpu.usage >= thresholds.cpu.warning) {
      this.createAlert({
        severity: 'high',
        category: 'performance',
        title: 'High CPU Usage',
        description: `CPU usage is ${metrics.system.cpu.usage.toFixed(1)}%, exceeding warning threshold of ${thresholds.cpu.warning}%`,
        metrics: { cpu_usage: metrics.system.cpu.usage },
        threshold: { cpu_warning: thresholds.cpu.warning },
        source: 'SystemMonitor',
        tags: ['cpu', 'performance', 'system'],
      });
    }

    // Memory Usage Alerts
    if (metrics.system.memory.percentage >= thresholds.memory.critical) {
      this.createAlert({
        severity: 'critical',
        category: 'capacity',
        title: 'Critical Memory Usage',
        description: `Memory usage is ${metrics.system.memory.percentage.toFixed(1)}%, exceeding critical threshold of ${thresholds.memory.critical}%`,
        metrics: { memory_usage: metrics.system.memory.percentage },
        threshold: { memory_critical: thresholds.memory.critical },
        source: 'SystemMonitor',
        tags: ['memory', 'capacity', 'system'],
      });
    }

    // Queue Depth Alerts
    if (metrics.integrator.queueDepth >= thresholds.queueDepth.critical) {
      this.createAlert({
        severity: 'critical',
        category: 'capacity',
        title: 'Critical Queue Depth',
        description: `Task queue depth is ${metrics.integrator.queueDepth}, exceeding critical threshold of ${thresholds.queueDepth.critical}`,
        metrics: { queue_depth: metrics.integrator.queueDepth },
        threshold: { queue_critical: thresholds.queueDepth.critical },
        source: 'SystemMonitor',
        tags: ['queue', 'capacity', 'tasks'],
      });
    }

    // Error Rate Alerts
    if (metrics.integrator.errorRate >= thresholds.errorRate.critical) {
      this.createAlert({
        severity: 'critical',
        category: 'availability',
        title: 'Critical Error Rate',
        description: `Task error rate is ${metrics.integrator.errorRate.toFixed(1)}%, exceeding critical threshold of ${thresholds.errorRate.critical}%`,
        metrics: { error_rate: metrics.integrator.errorRate },
        threshold: { error_critical: thresholds.errorRate.critical },
        source: 'SystemMonitor',
        tags: ['errors', 'availability', 'tasks'],
      });
    }

    // Agent Availability Alerts
    const agentAvailability =
      metrics.agents.total > 0
        ? ((metrics.agents.active + metrics.agents.idle) /
            metrics.agents.total) *
          100
        : 100;

    if (agentAvailability <= thresholds.agentAvailability.critical) {
      this.createAlert({
        severity: 'critical',
        category: 'availability',
        title: 'Critical Agent Availability',
        description: `Agent availability is ${agentAvailability.toFixed(1)}%, below critical threshold of ${thresholds.agentAvailability.critical}%`,
        metrics: { agent_availability: agentAvailability },
        threshold: { agent_critical: thresholds.agentAvailability.critical },
        source: 'SystemMonitor',
        tags: ['agents', 'availability', 'system'],
      });
    }
  }

  private async cleanupOldData(): Promise<void> {
    const cutoff =
      Date.now() - this.monitoringConfig.retentionDays * 24 * 60 * 60 * 1000;

    // Clean old metrics
    this.metricsHistory = this.metricsHistory.filter(
      (m) => m.timestamp.getTime() >= cutoff,
    );

    // Clean old alert history
    this.alertHistory = this.alertHistory.filter(
      (a) => a.timestamp.getTime() >= cutoff,
    );
  }

  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
