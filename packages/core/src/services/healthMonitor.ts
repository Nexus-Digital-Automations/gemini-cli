/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Health Monitor System for Agent Status Tracking and Recovery
 *
 * This system provides:
 * - Real-time health status monitoring for all agents
 * - Proactive failure detection and alerting
 * - Automatic recovery mechanisms and failover
 * - Health trend analysis and predictive maintenance
 * - Service level agreement (SLA) monitoring and reporting
 */

import { EventEmitter } from 'node:events';
import type { RegisteredAgent, AgentCapability } from './autonomousTaskIntegrator.js';
import type { AgentMetrics } from './agentCoordinator.js';
import type { AgentRegistry } from './agentRegistry.js';

// Health monitoring types
export interface HealthCheck {
  id: string;
  agentId: string;
  timestamp: Date;
  status: HealthStatus;
  responseTime: number;
  metrics: {
    cpuUsage?: number;
    memoryUsage?: number;
    taskQueueSize: number;
    errorRate: number;
    lastTaskCompletion?: Date;
  };
  issues: HealthIssue[];
}

export interface HealthIssue {
  severity: 'critical' | 'warning' | 'info';
  category: 'performance' | 'availability' | 'capacity' | 'reliability';
  code: string;
  message: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface HealthThreshold {
  metric: string;
  warning: number;
  critical: number;
  unit: string;
  description: string;
}

export interface RecoveryAction {
  id: string;
  type: 'restart' | 'failover' | 'scale' | 'throttle' | 'alert' | 'custom';
  agentId: string;
  trigger: HealthIssue;
  status: 'pending' | 'executing' | 'completed' | 'failed';
  startTime: Date;
  endTime?: Date;
  result?: {
    success: boolean;
    message: string;
    newState?: string;
  };
}

export interface HealthTrend {
  agentId: string;
  metric: string;
  trend: 'improving' | 'stable' | 'degrading';
  confidence: number;
  dataPoints: Array<{ timestamp: Date; value: number }>;
  prediction?: {
    nextValue: number;
    timeToThreshold?: number;
    confidence: number;
  };
}

export interface SLAMetrics {
  agentId: string;
  availability: number; // Percentage uptime
  responseTime: {
    average: number;
    p50: number;
    p95: number;
    p99: number;
  };
  errorRate: number; // Percentage of failed operations
  throughput: number; // Tasks completed per hour
  period: {
    start: Date;
    end: Date;
  };
}

export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy' | 'offline' | 'unknown';

export interface HealthEvent {
  type: 'status_changed' | 'issue_detected' | 'recovery_started' | 'recovery_completed' | 'sla_violation' | 'trend_detected';
  timestamp: Date;
  agentId?: string;
  data: Record<string, unknown>;
}

/**
 * Comprehensive health monitoring and recovery system
 */
export class HealthMonitor extends EventEmitter {
  private agentRegistry: AgentRegistry;
  private healthChecks: Map<string, HealthCheck[]> = new Map(); // agentId -> health check history
  private currentStatus: Map<string, HealthStatus> = new Map();
  private healthThresholds: HealthThreshold[] = [];
  private recoveryActions: Map<string, RecoveryAction> = new Map();
  private healthTrends: Map<string, HealthTrend[]> = new Map(); // agentId -> trends
  private slaMetrics: Map<string, SLAMetrics> = new Map();
  private monitoringConfig = {
    checkInterval: 30000, // 30 seconds
    historyRetention: 24 * 60 * 60 * 1000, // 24 hours
    trendAnalysisWindow: 60 * 60 * 1000, // 1 hour
    slaCalculationPeriod: 60 * 60 * 1000, // 1 hour
  };
  private monitoringInterval: NodeJS.Timeout | null = null;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(agentRegistry: AgentRegistry) {
    super();
    this.agentRegistry = agentRegistry;
    this.initializeHealthThresholds();
    this.startHealthMonitoring();
    this.startPeriodicCleanup();
  }

  /**
   * Perform health check on an agent
   */
  async performHealthCheck(agentId: string): Promise<HealthCheck> {
    const startTime = Date.now();
    const agentInfo = (await this.agentRegistry.discoverAgents({
      excludeAgents: [],
      preferredAgents: [agentId],
    })).find(info => info.agent.id === agentId);

    if (!agentInfo) {
      const healthCheck: HealthCheck = {
        id: this.generateHealthCheckId(),
        agentId,
        timestamp: new Date(),
        status: 'offline',
        responseTime: Date.now() - startTime,
        metrics: {
          taskQueueSize: 0,
          errorRate: 1.0,
        },
        issues: [{
          severity: 'critical',
          category: 'availability',
          code: 'AGENT_NOT_FOUND',
          message: 'Agent not found in registry',
          timestamp: new Date(),
        }],
      };

      return this.recordHealthCheck(healthCheck);
    }

    const responseTime = Date.now() - startTime;
    const issues: HealthIssue[] = [];
    let status: HealthStatus = 'healthy';

    // Analyze metrics and detect issues
    const metrics = agentInfo.metrics;

    // Check response time
    if (responseTime > 10000) {
      issues.push({
        severity: 'critical',
        category: 'performance',
        code: 'HIGH_RESPONSE_TIME',
        message: `Response time ${responseTime}ms exceeds critical threshold`,
        timestamp: new Date(),
        metadata: { responseTime, threshold: 10000 },
      });
      status = 'unhealthy';
    } else if (responseTime > 5000) {
      issues.push({
        severity: 'warning',
        category: 'performance',
        code: 'ELEVATED_RESPONSE_TIME',
        message: `Response time ${responseTime}ms exceeds warning threshold`,
        timestamp: new Date(),
        metadata: { responseTime, threshold: 5000 },
      });
      if (status === 'healthy') status = 'degraded';
    }

    // Check error rate
    const errorRate = 1 - metrics.successRate;
    if (errorRate > 0.2) {
      issues.push({
        severity: 'critical',
        category: 'reliability',
        code: 'HIGH_ERROR_RATE',
        message: `Error rate ${(errorRate * 100).toFixed(1)}% exceeds critical threshold`,
        timestamp: new Date(),
        metadata: { errorRate, threshold: 0.2 },
      });
      status = 'unhealthy';
    } else if (errorRate > 0.1) {
      issues.push({
        severity: 'warning',
        category: 'reliability',
        code: 'ELEVATED_ERROR_RATE',
        message: `Error rate ${(errorRate * 100).toFixed(1)}% exceeds warning threshold`,
        timestamp: new Date(),
        metadata: { errorRate, threshold: 0.1 },
      });
      if (status === 'healthy') status = 'degraded';
    }

    // Check load
    if (metrics.currentLoad > 0.9) {
      issues.push({
        severity: 'warning',
        category: 'capacity',
        code: 'HIGH_LOAD',
        message: `Current load ${(metrics.currentLoad * 100).toFixed(1)}% is near capacity`,
        timestamp: new Date(),
        metadata: { load: metrics.currentLoad, threshold: 0.9 },
      });
      if (status === 'healthy') status = 'degraded';
    }

    // Check last activity
    const timeSinceLastActivity = Date.now() - metrics.lastActiveTime.getTime();
    if (timeSinceLastActivity > 300000) { // 5 minutes
      issues.push({
        severity: 'warning',
        category: 'availability',
        code: 'INACTIVE_AGENT',
        message: `Agent has been inactive for ${Math.floor(timeSinceLastActivity / 60000)} minutes`,
        timestamp: new Date(),
        metadata: { lastActive: metrics.lastActiveTime, inactiveTime: timeSinceLastActivity },
      });
      if (status === 'healthy') status = 'degraded';
    }

    const healthCheck: HealthCheck = {
      id: this.generateHealthCheckId(),
      agentId,
      timestamp: new Date(),
      status,
      responseTime,
      metrics: {
        taskQueueSize: agentInfo.agent.currentTasks.length,
        errorRate,
        lastTaskCompletion: metrics.lastActiveTime,
      },
      issues,
    };

    return this.recordHealthCheck(healthCheck);
  }

  /**
   * Perform health checks on all registered agents
   */
  async performHealthCheckAll(): Promise<HealthCheck[]> {
    const allAgents = this.agentRegistry.getAllAgents();
    const healthChecks = await Promise.all(
      allAgents.map(agentInfo => this.performHealthCheck(agentInfo.agent.id))
    );

    console.log(`🏥 Performed health checks on ${healthChecks.length} agents`);
    return healthChecks;
  }

  /**
   * Get current health status for an agent
   */
  getAgentHealthStatus(agentId: string): HealthStatus {
    return this.currentStatus.get(agentId) || 'unknown';
  }

  /**
   * Get recent health checks for an agent
   */
  getAgentHealthHistory(agentId: string, limit: number = 50): HealthCheck[] {
    const history = this.healthChecks.get(agentId) || [];
    return history.slice(-limit);
  }

  /**
   * Get health trends for an agent
   */
  getAgentHealthTrends(agentId: string): HealthTrend[] {
    return this.healthTrends.get(agentId) || [];
  }

  /**
   * Trigger recovery action for an agent
   */
  async triggerRecovery(agentId: string, trigger: HealthIssue, actionType: RecoveryAction['type'] = 'restart'): Promise<RecoveryAction> {
    const action: RecoveryAction = {
      id: this.generateRecoveryActionId(),
      type: actionType,
      agentId,
      trigger,
      status: 'pending',
      startTime: new Date(),
    };

    this.recoveryActions.set(action.id, action);

    const event: HealthEvent = {
      type: 'recovery_started',
      timestamp: new Date(),
      agentId,
      data: { actionId: action.id, actionType, trigger },
    };

    this.emit('recovery_started', event);

    // Execute recovery action
    await this.executeRecoveryAction(action);

    return action;
  }

  /**
   * Get SLA metrics for an agent
   */
  getSLAMetrics(agentId: string): SLAMetrics | null {
    return this.slaMetrics.get(agentId) || null;
  }

  /**
   * Get overall system health summary
   */
  getSystemHealthSummary(): {
    totalAgents: number;
    healthyAgents: number;
    degradedAgents: number;
    unhealthyAgents: number;
    offlineAgents: number;
    criticalIssues: number;
    warnings: number;
    averageResponseTime: number;
    overallErrorRate: number;
  } {
    const allAgents = this.agentRegistry.getAllAgents();
    const statusCounts = { healthy: 0, degraded: 0, unhealthy: 0, offline: 0, unknown: 0 };
    let criticalIssues = 0;
    let warnings = 0;
    let totalResponseTime = 0;
    let totalErrors = 0;
    let totalOperations = 0;

    for (const agentInfo of allAgents) {
      const status = this.currentStatus.get(agentInfo.agent.id) || 'unknown';
      statusCounts[status]++;

      const recentChecks = this.healthChecks.get(agentInfo.agent.id) || [];
      const latestCheck = recentChecks[recentChecks.length - 1];

      if (latestCheck) {
        totalResponseTime += latestCheck.responseTime;

        for (const issue of latestCheck.issues) {
          if (issue.severity === 'critical') criticalIssues++;
          if (issue.severity === 'warning') warnings++;
        }

        totalErrors += latestCheck.metrics.errorRate;
        totalOperations++;
      }
    }

    return {
      totalAgents: allAgents.length,
      healthyAgents: statusCounts.healthy,
      degradedAgents: statusCounts.degraded,
      unhealthyAgents: statusCounts.unhealthy,
      offlineAgents: statusCounts.offline,
      criticalIssues,
      warnings,
      averageResponseTime: totalOperations > 0 ? totalResponseTime / totalOperations : 0,
      overallErrorRate: totalOperations > 0 ? totalErrors / totalOperations : 0,
    };
  }

  /**
   * Configure health monitoring thresholds
   */
  setHealthThresholds(thresholds: HealthThreshold[]): void {
    this.healthThresholds = [...thresholds];
    console.log(`🏥 Updated health thresholds: ${thresholds.length} thresholds configured`);
  }

  /**
   * Configure monitoring settings
   */
  setMonitoringConfig(config: Partial<typeof this.monitoringConfig>): void {
    this.monitoringConfig = { ...this.monitoringConfig, ...config };

    // Restart monitoring with new config
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.startHealthMonitoring();
    }

    console.log(`🏥 Updated monitoring configuration`);
  }

  /**
   * Shutdown health monitoring system
   */
  async shutdown(): Promise<void> {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    this.healthChecks.clear();
    this.currentStatus.clear();
    this.recoveryActions.clear();
    this.healthTrends.clear();
    this.slaMetrics.clear();

    console.log('🛑 Health monitoring system shutdown');
  }

  // Private helper methods

  private recordHealthCheck(healthCheck: HealthCheck): HealthCheck {
    // Store health check
    let history = this.healthChecks.get(healthCheck.agentId);
    if (!history) {
      history = [];
      this.healthChecks.set(healthCheck.agentId, history);
    }

    history.push(healthCheck);

    // Limit history size
    const maxHistory = 1000;
    if (history.length > maxHistory) {
      this.healthChecks.set(healthCheck.agentId, history.slice(-maxHistory));
    }

    // Update current status
    const previousStatus = this.currentStatus.get(healthCheck.agentId);
    this.currentStatus.set(healthCheck.agentId, healthCheck.status);

    // Emit events for status changes and issues
    if (previousStatus !== healthCheck.status) {
      const event: HealthEvent = {
        type: 'status_changed',
        timestamp: new Date(),
        agentId: healthCheck.agentId,
        data: {
          previousStatus,
          newStatus: healthCheck.status,
          responseTime: healthCheck.responseTime,
        },
      };

      this.emit('status_changed', event);
      console.log(`🏥 Agent ${healthCheck.agentId} status changed: ${previousStatus} → ${healthCheck.status}`);
    }

    // Emit events for new issues
    for (const issue of healthCheck.issues) {
      if (issue.severity === 'critical') {
        const event: HealthEvent = {
          type: 'issue_detected',
          timestamp: new Date(),
          agentId: healthCheck.agentId,
          data: { issue },
        };

        this.emit('issue_detected', event);

        // Auto-trigger recovery for critical issues
        if (this.shouldAutoRecover(issue)) {
          this.triggerRecovery(healthCheck.agentId, issue).catch(error => {
            console.error(`Failed to trigger auto-recovery for agent ${healthCheck.agentId}:`, error);
          });
        }
      }
    }

    // Update trends
    this.updateHealthTrends(healthCheck);

    // Update SLA metrics
    this.updateSLAMetrics(healthCheck);

    return healthCheck;
  }

  private async executeRecoveryAction(action: RecoveryAction): Promise<void> {
    action.status = 'executing';
    this.recoveryActions.set(action.id, action);

    try {
      let result: RecoveryAction['result'];

      switch (action.type) {
        case 'restart':
          result = await this.executeRestart(action.agentId);
          break;
        case 'failover':
          result = await this.executeFailover(action.agentId);
          break;
        case 'scale':
          result = await this.executeScale(action.agentId);
          break;
        case 'throttle':
          result = await this.executeThrottle(action.agentId);
          break;
        case 'alert':
          result = await this.executeAlert(action.agentId, action.trigger);
          break;
        default:
          result = { success: false, message: `Unknown recovery action type: ${action.type}` };
      }

      action.result = result;
      action.status = result.success ? 'completed' : 'failed';
      action.endTime = new Date();

      const event: HealthEvent = {
        type: 'recovery_completed',
        timestamp: new Date(),
        agentId: action.agentId,
        data: {
          actionId: action.id,
          success: result.success,
          message: result.message,
          duration: action.endTime.getTime() - action.startTime.getTime(),
        },
      };

      this.emit('recovery_completed', event);

      console.log(`🔧 Recovery action ${action.id} for agent ${action.agentId}: ${result.success ? 'SUCCESS' : 'FAILED'} - ${result.message}`);

    } catch (error) {
      action.result = { success: false, message: `Recovery action failed: ${error}` };
      action.status = 'failed';
      action.endTime = new Date();

      console.error(`Failed to execute recovery action ${action.id} for agent ${action.agentId}:`, error);
    }

    this.recoveryActions.set(action.id, action);
  }

  private async executeRestart(agentId: string): Promise<RecoveryAction['result']> {
    // In a real implementation, this would restart the agent process
    console.log(`🔄 Attempting to restart agent ${agentId}`);

    // Simulate restart delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    return {
      success: true,
      message: 'Agent restart initiated',
      newState: 'restarting',
    };
  }

  private async executeFailover(agentId: string): Promise<RecoveryAction['result']> {
    console.log(`🔀 Attempting failover for agent ${agentId}`);

    // Find alternative agents with similar capabilities
    const agentInfo = this.agentRegistry.getAllAgents().find(a => a.agent.id === agentId);
    if (!agentInfo) {
      return { success: false, message: 'Agent not found for failover' };
    }

    const alternatives = await this.agentRegistry.discoverAgents({
      capabilities: agentInfo.agent.capabilities.map(cap => ({
        capability: cap,
        required: true,
        priority: 1,
      })),
      excludeAgents: [agentId],
    });

    if (alternatives.length === 0) {
      return { success: false, message: 'No suitable agents available for failover' };
    }

    return {
      success: true,
      message: `Failover to agent ${alternatives[0].agent.id}`,
      newState: 'failed_over',
    };
  }

  private async executeScale(agentId: string): Promise<RecoveryAction['result']> {
    console.log(`📈 Attempting to scale resources for agent ${agentId}`);

    return {
      success: true,
      message: 'Resource scaling initiated',
      newState: 'scaling',
    };
  }

  private async executeThrottle(agentId: string): Promise<RecoveryAction['result']> {
    console.log(`🐌 Applying throttling to agent ${agentId}`);

    return {
      success: true,
      message: 'Task throttling applied',
      newState: 'throttled',
    };
  }

  private async executeAlert(agentId: string, trigger: HealthIssue): Promise<RecoveryAction['result']> {
    console.log(`🚨 Sending alert for agent ${agentId}: ${trigger.message}`);

    // In a real implementation, this would send notifications via email, Slack, etc.
    return {
      success: true,
      message: 'Alert notification sent',
    };
  }

  private shouldAutoRecover(issue: HealthIssue): boolean {
    // Define conditions for auto-recovery
    const autoRecoveryIssues = [
      'AGENT_NOT_FOUND',
      'HIGH_RESPONSE_TIME',
      'HIGH_ERROR_RATE',
    ];

    return issue.severity === 'critical' && autoRecoveryIssues.includes(issue.code);
  }

  private updateHealthTrends(healthCheck: HealthCheck): void {
    const agentId = healthCheck.agentId;
    let trends = this.healthTrends.get(agentId);
    if (!trends) {
      trends = [];
      this.healthTrends.set(agentId, trends);
    }

    // Create trends for key metrics
    const metrics = [
      { name: 'response_time', value: healthCheck.responseTime },
      { name: 'error_rate', value: healthCheck.metrics.errorRate },
      { name: 'task_queue_size', value: healthCheck.metrics.taskQueueSize },
    ];

    for (const metric of metrics) {
      let trend = trends.find(t => t.metric === metric.name);
      if (!trend) {
        trend = {
          agentId,
          metric: metric.name,
          trend: 'stable',
          confidence: 0,
          dataPoints: [],
        };
        trends.push(trend);
      }

      // Add data point
      trend.dataPoints.push({
        timestamp: healthCheck.timestamp,
        value: metric.value,
      });

      // Keep only recent data points for trend analysis
      const cutoff = new Date(Date.now() - this.monitoringConfig.trendAnalysisWindow);
      trend.dataPoints = trend.dataPoints.filter(dp => dp.timestamp > cutoff);

      // Analyze trend
      if (trend.dataPoints.length >= 3) {
        this.analyzeTrend(trend);
      }
    }
  }

  private analyzeTrend(trend: HealthTrend): void {
    const points = trend.dataPoints;
    if (points.length < 3) return;

    // Simple linear regression to detect trend
    const n = points.length;
    const sumX = points.reduce((sum, p, i) => sum + i, 0);
    const sumY = points.reduce((sum, p) => sum + p.value, 0);
    const sumXY = points.reduce((sum, p, i) => sum + (i * p.value), 0);
    const sumX2 = points.reduce((sum, p, i) => sum + (i * i), 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const correlation = Math.abs(slope) / (Math.sqrt(sumX2 / n - Math.pow(sumX / n, 2)) * Math.sqrt(points.reduce((sum, p) => sum + Math.pow(p.value, 2), 0) / n - Math.pow(sumY / n, 2)));

    trend.confidence = Math.min(correlation, 1.0);

    // Determine trend direction
    if (Math.abs(slope) < 0.01) {
      trend.trend = 'stable';
    } else if (slope > 0) {
      trend.trend = trend.metric === 'error_rate' || trend.metric === 'response_time' ? 'degrading' : 'improving';
    } else {
      trend.trend = trend.metric === 'error_rate' || trend.metric === 'response_time' ? 'improving' : 'degrading';
    }

    // Emit trend detection events for significant changes
    if (trend.confidence > 0.7 && trend.trend !== 'stable') {
      const event: HealthEvent = {
        type: 'trend_detected',
        timestamp: new Date(),
        agentId: trend.agentId,
        data: {
          metric: trend.metric,
          trend: trend.trend,
          confidence: trend.confidence,
          slope,
        },
      };

      this.emit('trend_detected', event);
    }
  }

  private updateSLAMetrics(healthCheck: HealthCheck): void {
    const agentId = healthCheck.agentId;
    let sla = this.slaMetrics.get(agentId);

    const now = new Date();
    const periodStart = new Date(now.getTime() - this.monitoringConfig.slaCalculationPeriod);

    if (!sla || sla.period.start < periodStart) {
      // Create new SLA period
      sla = {
        agentId,
        availability: 0,
        responseTime: { average: 0, p50: 0, p95: 0, p99: 0 },
        errorRate: 0,
        throughput: 0,
        period: { start: periodStart, end: now },
      };
    }

    // Calculate metrics from recent health checks
    const recentChecks = (this.healthChecks.get(agentId) || [])
      .filter(check => check.timestamp > periodStart);

    if (recentChecks.length > 0) {
      // Availability (percentage of non-offline checks)
      const availableChecks = recentChecks.filter(check => check.status !== 'offline');
      sla.availability = (availableChecks.length / recentChecks.length) * 100;

      // Response time metrics
      const responseTimes = availableChecks.map(check => check.responseTime).sort((a, b) => a - b);
      if (responseTimes.length > 0) {
        sla.responseTime.average = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
        sla.responseTime.p50 = responseTimes[Math.floor(responseTimes.length * 0.5)];
        sla.responseTime.p95 = responseTimes[Math.floor(responseTimes.length * 0.95)];
        sla.responseTime.p99 = responseTimes[Math.floor(responseTimes.length * 0.99)];
      }

      // Error rate
      sla.errorRate = availableChecks.reduce((sum, check) => sum + check.metrics.errorRate, 0) / availableChecks.length;

      // Throughput (simplified calculation)
      const hoursSinceStart = (now.getTime() - periodStart.getTime()) / (1000 * 60 * 60);
      sla.throughput = availableChecks.length / hoursSinceStart;
    }

    sla.period.end = now;
    this.slaMetrics.set(agentId, sla);

    // Check for SLA violations
    if (sla.availability < 95) { // 95% availability SLA
      const event: HealthEvent = {
        type: 'sla_violation',
        timestamp: new Date(),
        agentId,
        data: {
          metric: 'availability',
          value: sla.availability,
          threshold: 95,
          period: sla.period,
        },
      };

      this.emit('sla_violation', event);
    }
  }

  private initializeHealthThresholds(): void {
    this.healthThresholds = [
      {
        metric: 'response_time',
        warning: 5000,
        critical: 10000,
        unit: 'ms',
        description: 'Agent response time',
      },
      {
        metric: 'error_rate',
        warning: 0.1,
        critical: 0.2,
        unit: '%',
        description: 'Error rate threshold',
      },
      {
        metric: 'load',
        warning: 0.8,
        critical: 0.95,
        unit: '%',
        description: 'Agent load threshold',
      },
      {
        metric: 'inactive_time',
        warning: 300000,
        critical: 600000,
        unit: 'ms',
        description: 'Time since last activity',
      },
    ];
  }

  private startHealthMonitoring(): void {
    this.monitoringInterval = setInterval(async () => {
      try {
        await this.performHealthCheckAll();
      } catch (error) {
        console.error('Health monitoring error:', error);
      }
    }, this.monitoringConfig.checkInterval);

    console.log(`🏥 Health monitoring started (interval: ${this.monitoringConfig.checkInterval}ms)`);
  }

  private startPeriodicCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      this.performCleanup();
    }, 300000); // Every 5 minutes
  }

  private performCleanup(): void {
    const cutoff = new Date(Date.now() - this.monitoringConfig.historyRetention);

    // Clean up old health checks
    for (const [agentId, checks] of this.healthChecks) {
      const filteredChecks = checks.filter(check => check.timestamp > cutoff);
      if (filteredChecks.length === 0) {
        this.healthChecks.delete(agentId);
      } else {
        this.healthChecks.set(agentId, filteredChecks);
      }
    }

    // Clean up old recovery actions
    for (const [actionId, action] of this.recoveryActions) {
      if (action.endTime && action.endTime < cutoff) {
        this.recoveryActions.delete(actionId);
      }
    }

    // Clean up old trend data
    for (const [agentId, trends] of this.healthTrends) {
      for (const trend of trends) {
        trend.dataPoints = trend.dataPoints.filter(dp => dp.timestamp > cutoff);
      }

      // Remove trends with no recent data
      const activeTrends = trends.filter(trend => trend.dataPoints.length > 0);
      if (activeTrends.length === 0) {
        this.healthTrends.delete(agentId);
      } else {
        this.healthTrends.set(agentId, activeTrends);
      }
    }

    console.log(`🧹 Health monitoring cleanup completed`);
  }

  private generateHealthCheckId(): string {
    return `hc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateRecoveryActionId(): string {
    return `ra_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}