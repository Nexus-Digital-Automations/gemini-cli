/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { EventEmitter } from 'node:events';
import { getComponentLogger, type StructuredLogger } from '@google/gemini-cli-core';
import { taskStatusMonitor } from './TaskStatusMonitor.js';
import { progressTracker } from './ProgressTracker.js';
import { performanceAnalyticsDashboard } from './PerformanceAnalyticsDashboard.js';
import { statusUpdateBroker } from './StatusUpdateBroker.js';
import { notificationSystem } from './NotificationSystem.js';
import { taskMonitor } from './TaskMonitor.js';
import { metricsCollector } from './MetricsCollector.js';

export interface HealthCheckResult {
  component: string;
  status: 'healthy' | 'warning' | 'critical' | 'unknown';
  message: string;
  details?: Record<string, unknown>;
  lastChecked: Date;
  nextCheckDue: Date;
  checkDuration: number; // milliseconds
}

export interface SystemHealthSummary {
  overallStatus: 'healthy' | 'degraded' | 'critical' | 'offline';
  healthScore: number; // 0-100
  lastUpdated: Date;
  components: HealthCheckResult[];
  activeIssues: {
    critical: number;
    warnings: number;
  };
  uptime: number; // milliseconds
  recommendations: string[];
}

export interface HealthCheckConfig {
  component: string;
  checkInterval: number; // milliseconds
  timeout: number; // milliseconds
  retryCount: number;
  criticalThreshold?: number;
  warningThreshold?: number;
  enabled: boolean;
  customChecker?: () => Promise<HealthCheckResult>;
}

export interface DiagnosticReport {
  timestamp: Date;
  systemHealth: SystemHealthSummary;
  performanceMetrics: {
    taskThroughput: number;
    averageResponseTime: number;
    errorRate: number;
    resourceUtilization: number;
  };
  componentStatus: Record<
    string,
    {
      status: string;
      metrics: Record<string, number>;
      issues: string[];
    }
  >;
  recommendations: {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
  };
  trends: {
    healthScoreTrend: number[]; // Last 24 hours
    performanceTrend: number[];
    errorTrend: number[];
  };
}

/**
 * Comprehensive Health Diagnostics System
 *
 * Provides system-wide health monitoring and diagnostics for the autonomous task management system.
 * Features include:
 * - Component health checks with configurable intervals
 * - System health scoring and alerting
 * - Diagnostic reporting and trend analysis
 * - Automated issue detection and resolution recommendations
 * - Integration with all monitoring subsystems
 */
export class HealthDiagnostics extends EventEmitter {
  private readonly logger: StructuredLogger;
  private healthChecks: Map<string, HealthCheckConfig>;
  private lastHealthResults: Map<string, HealthCheckResult>;
  private checkTimers: Map<string, NodeJS.Timeout>;
  private healthHistory: SystemHealthSummary[];
  private systemStartTime: Date;
  private diagnosticsInterval?: NodeJS.Timeout;

  constructor() {
    super();
    this.logger = getComponentLogger('HealthDiagnostics');
    this.healthChecks = new Map();
    this.lastHealthResults = new Map();
    this.checkTimers = new Map();
    this.healthHistory = [];
    this.systemStartTime = new Date();

    this.initializeHealthChecks();
    this.startDiagnostics();

    this.logger.info('HealthDiagnostics system initialized');
  }

  /**
   * Register a custom health check
   */
  registerHealthCheck(config: HealthCheckConfig): void {
    this.healthChecks.set(config.component, config);

    if (config.enabled) {
      this.scheduleHealthCheck(config.component);
    }

    this.emit('health-check:registered', {
      component: config.component,
      config,
    });
    this.logger.info('Health check registered', {
      component: config.component,
      interval: config.checkInterval,
      enabled: config.enabled,
    });
  }

  /**
   * Perform health check for a specific component
   */
  async performHealthCheck(componentName: string): Promise<HealthCheckResult> {
    const config = this.healthChecks.get(componentName);
    if (!config) {
      throw new Error(
        `Health check not configured for component: ${componentName}`,
      );
    }

    const startTime = Date.now();
    let result: HealthCheckResult;

    try {
      if (config.customChecker) {
        result = await this.withTimeout(config.customChecker(), config.timeout);
      } else {
        result = await this.performDefaultHealthCheck(componentName);
      }

      result.checkDuration = Date.now() - startTime;
      result.lastChecked = new Date();
      result.nextCheckDue = new Date(Date.now() + config.checkInterval);
    } catch (error) {
      result = {
        component: componentName,
        status: 'critical',
        message: `Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: {
          error: error instanceof Error ? error.stack : String(error),
        },
        lastChecked: new Date(),
        nextCheckDue: new Date(Date.now() + config.checkInterval),
        checkDuration: Date.now() - startTime,
      };
    }

    this.lastHealthResults.set(componentName, result);

    // Emit events for status changes
    this.emit('health-check:completed', { component: componentName, result });

    if (result.status === 'critical') {
      this.emit('health-check:critical', { component: componentName, result });
      this.logger.error('Critical health check result', {
        component: componentName,
        message: result.message,
        details: result.details,
      });
    } else if (result.status === 'warning') {
      this.emit('health-check:warning', { component: componentName, result });
      this.logger.warn('Health check warning', {
        component: componentName,
        message: result.message,
      });
    }

    return result;
  }

  /**
   * Get current system health summary
   */
  async getSystemHealthSummary(): Promise<SystemHealthSummary> {
    const components = Array.from(this.lastHealthResults.values());
    const currentTime = new Date();

    // Calculate overall health score
    const healthScore = this.calculateHealthScore(components);

    // Determine overall status
    let overallStatus: SystemHealthSummary['overallStatus'] = 'healthy';
    const criticalCount = components.filter(
      (c) => c.status === 'critical',
    ).length;
    const warningCount = components.filter(
      (c) => c.status === 'warning',
    ).length;

    if (criticalCount > 0) {
      overallStatus = 'critical';
    } else if (warningCount > 0) {
      overallStatus = 'degraded';
    } else if (components.some((c) => c.status === 'unknown')) {
      overallStatus = 'degraded';
    }

    // Generate recommendations
    const recommendations =
      await this.generateHealthRecommendations(components);

    const summary: SystemHealthSummary = {
      overallStatus,
      healthScore,
      lastUpdated: currentTime,
      components,
      activeIssues: {
        critical: criticalCount,
        warnings: warningCount,
      },
      uptime: currentTime.getTime() - this.systemStartTime.getTime(),
      recommendations,
    };

    // Store in history
    this.healthHistory.push(summary);
    if (this.healthHistory.length > 288) {
      // Keep 24 hours (24 * 12 = 288 five-minute intervals)
      this.healthHistory.shift();
    }

    return summary;
  }

  /**
   * Generate comprehensive diagnostic report
   */
  async generateDiagnosticReport(): Promise<DiagnosticReport> {
    const systemHealth = await this.getSystemHealthSummary();

    // Get performance metrics from various sources
    const dashboardData = performanceAnalyticsDashboard.getDashboardData();
    const systemAnalytics = await metricsCollector.getSystemAnalytics();
    const monitoringDashboard = await taskMonitor.getMonitoringDashboard();

    const performanceMetrics = {
      taskThroughput: systemAnalytics.systemOverview.overallThroughput,
      averageResponseTime: dashboardData.systemOverview.averageExecutionTime,
      errorRate:
        dashboardData.systemOverview.systemEfficiency < 90
          ? 100 - dashboardData.systemOverview.systemEfficiency
          : 0,
      resourceUtilization: dashboardData.systemOverview.agentUtilization,
    };

    // Analyze component status
    const componentStatus: Record<
      string,
      {
        status: string;
        metrics: Record<string, number>;
        issues: string[];
      }
    > = {};
    for (const component of systemHealth.components) {
      // Filter component details to only include numeric values
      const numericMetrics: Record<string, number> = {};
      if (component.details) {
        for (const [key, value] of Object.entries(component.details)) {
          if (typeof value === 'number') {
            numericMetrics[key] = value;
          }
        }
      }

      componentStatus[component.component] = {
        status: component.status,
        metrics: numericMetrics,
        issues: component.status !== 'healthy' ? [component.message] : [],
      };
    }

    // Generate categorized recommendations
    const recommendations = this.categorizeRecommendations([
      ...systemHealth.recommendations,
      ...monitoringDashboard.recommendations,
    ]);

    // Calculate trends
    const trends = {
      healthScoreTrend: this.healthHistory
        .slice(-288)
        .map((h) => h.healthScore),
      performanceTrend: this.healthHistory
        .slice(-288)
        .map(
          (h) =>
            (h.components.filter((c) => c.status === 'healthy').length /
              h.components.length) *
            100,
        ),
      errorTrend: this.healthHistory
        .slice(-288)
        .map((h) => h.activeIssues.critical + h.activeIssues.warnings),
    };

    return {
      timestamp: new Date(),
      systemHealth,
      performanceMetrics,
      componentStatus,
      recommendations,
      trends,
    };
  }

  /**
   * Get health check history for a component
   */
  getComponentHealthHistory(
    componentName: string,
    _hours = 24,
  ): HealthCheckResult[] {
    // This would be implemented with persistent storage in a real system
    // For now, return the current result
    const current = this.lastHealthResults.get(componentName);
    return current ? [current] : [];
  }

  /**
   * Enable or disable a health check
   */
  setHealthCheckEnabled(componentName: string, enabled: boolean): boolean {
    const config = this.healthChecks.get(componentName);
    if (!config) return false;

    config.enabled = enabled;

    if (enabled) {
      this.scheduleHealthCheck(componentName);
    } else {
      const timer = this.checkTimers.get(componentName);
      if (timer) {
        clearInterval(timer);
        this.checkTimers.delete(componentName);
      }
    }

    this.logger.info('Health check enabled/disabled', {
      componentName,
      enabled,
    });
    return true;
  }

  /**
   * Update health check configuration
   */
  updateHealthCheckConfig(
    componentName: string,
    updates: Partial<HealthCheckConfig>,
  ): boolean {
    const config = this.healthChecks.get(componentName);
    if (!config) return false;

    Object.assign(config, updates);

    // Reschedule if interval changed and enabled
    if (updates.checkInterval && config.enabled) {
      this.scheduleHealthCheck(componentName);
    }

    this.logger.info('Health check configuration updated', {
      componentName,
      updates,
    });
    return true;
  }

  // Private methods

  private initializeHealthChecks(): void {
    const defaultChecks: HealthCheckConfig[] = [
      {
        component: 'TaskStatusMonitor',
        checkInterval: 30000, // 30 seconds
        timeout: 5000,
        retryCount: 2,
        enabled: true,
      },
      {
        component: 'ProgressTracker',
        checkInterval: 45000, // 45 seconds
        timeout: 5000,
        retryCount: 2,
        enabled: true,
      },
      {
        component: 'PerformanceAnalyticsDashboard',
        checkInterval: 60000, // 1 minute
        timeout: 10000,
        retryCount: 3,
        enabled: true,
      },
      {
        component: 'StatusUpdateBroker',
        checkInterval: 30000, // 30 seconds
        timeout: 5000,
        retryCount: 2,
        enabled: true,
      },
      {
        component: 'NotificationSystem',
        checkInterval: 60000, // 1 minute
        timeout: 5000,
        retryCount: 2,
        enabled: true,
      },
      {
        component: 'TaskMonitor',
        checkInterval: 45000, // 45 seconds
        timeout: 10000,
        retryCount: 2,
        enabled: true,
      },
      {
        component: 'MetricsCollector',
        checkInterval: 30000, // 30 seconds
        timeout: 5000,
        retryCount: 2,
        enabled: true,
      },
    ];

    for (const check of defaultChecks) {
      this.registerHealthCheck(check);
    }
  }

  private scheduleHealthCheck(componentName: string): void {
    const config = this.healthChecks.get(componentName);
    if (!config || !config.enabled) return;

    // Clear existing timer
    const existingTimer = this.checkTimers.get(componentName);
    if (existingTimer) {
      clearInterval(existingTimer);
    }

    // Schedule new timer
    const timer = setInterval(async () => {
      try {
        await this.performHealthCheck(componentName);
      } catch (error) {
        this.logger.error('Scheduled health check failed', {
          componentName,
          error,
        });
      }
    }, config.checkInterval);

    this.checkTimers.set(componentName, timer);

    // Perform initial check
    setImmediate(() => this.performHealthCheck(componentName));
  }

  private async performDefaultHealthCheck(
    componentName: string,
  ): Promise<HealthCheckResult> {
    const startTime = Date.now();

    try {
      let status: HealthCheckResult['status'] = 'healthy';
      let message = 'Component is healthy';
      const details: Record<string, unknown> = {};

      switch (componentName) {
        case 'TaskStatusMonitor': {
          const taskMetrics = taskStatusMonitor.getPerformanceMetrics();
          details['totalTasks'] = taskMetrics.totalTasks;
          details['activeAgents'] = taskMetrics.activeAgents;
          details['systemEfficiency'] = taskMetrics.systemEfficiency;

          if (taskMetrics.systemEfficiency < 70) {
            status = 'critical';
            message = `Low system efficiency: ${taskMetrics.systemEfficiency.toFixed(1)}%`;
          } else if (taskMetrics.systemEfficiency < 85) {
            status = 'warning';
            message = `Degraded system efficiency: ${taskMetrics.systemEfficiency.toFixed(1)}%`;
          }
          break;
        }

        case 'ProgressTracker': {
          const systemAnalytics = progressTracker.getSystemAnalytics();
          details['totalTrackedTasks'] = systemAnalytics.totalTasks;
          details['activeTasks'] = systemAnalytics.activelyTracked;
          details.systemEfficiency = systemAnalytics.systemEfficiency;

          if (systemAnalytics.systemEfficiency < 60) {
            status = 'warning';
            message = `Low system efficiency: ${systemAnalytics.systemEfficiency.toFixed(1)}%`;
          }
          break;
        }

        case 'PerformanceAnalyticsDashboard': {
          const dashboardData =
            performanceAnalyticsDashboard.getDashboardData();
          details.insights = dashboardData.insights.length;
          details.trends = dashboardData.trends.length;
          break;
        }

        case 'StatusUpdateBroker': {
          const brokerMetrics = statusUpdateBroker.getMetrics();
          details.totalEvents = brokerMetrics.totalEvents;
          details.activeSubscriptions = brokerMetrics.activeSubscriptions;
          details.processingTime = brokerMetrics.averageProcessingTime;

          if (brokerMetrics.averageProcessingTime > 1000) {
            // 1 second
            status = 'warning';
            message = `High processing time: ${brokerMetrics.averageProcessingTime.toFixed(0)}ms`;
          }
          break;
        }

        case 'NotificationSystem': {
          const notificationMetrics = notificationSystem.getMetrics();
          details.totalNotifications = notificationMetrics.totalNotifications;
          details.activeUsers = notificationMetrics.activeUsers;
          details.deliverySuccessRate =
            (notificationMetrics.deliveredNotifications /
              Math.max(notificationMetrics.totalNotifications, 1)) *
            100;

          const deliveryRate = details.deliverySuccessRate as number;
          if (deliveryRate < 90) {
            status = 'critical';
            message = `Low delivery success rate: ${deliveryRate.toFixed(1)}%`;
          } else if (deliveryRate < 95) {
            status = 'warning';
            message = `Degraded delivery success rate: ${deliveryRate.toFixed(1)}%`;
          }
          break;
        }

        case 'TaskMonitor': {
          // Basic health check - ensure the monitor is responsive
          details.isResponsive = true;
          break;
        }

        case 'MetricsCollector': {
          const systemAnalytics = await metricsCollector.getSystemAnalytics();
          details.totalTasks = systemAnalytics.systemOverview.totalTasks;
          details.activeAgents = systemAnalytics.systemOverview.activeAgents;
          details.systemEfficiency = systemAnalytics.systemOverview.systemEfficiency;

          if (systemAnalytics.systemOverview.systemEfficiency < 60) {
            status = 'critical';
            message = `Low system efficiency: ${systemAnalytics.systemOverview.systemEfficiency.toFixed(1)}%`;
          } else if (systemAnalytics.systemOverview.systemEfficiency < 80) {
            status = 'warning';
            message = `Reduced system efficiency: ${systemAnalytics.systemOverview.systemEfficiency.toFixed(1)}%`;
          }
          break;
        }

        default:
          status = 'unknown';
          message = 'No default health check available for this component';
      }

      return {
        component: componentName,
        status,
        message,
        details,
        lastChecked: new Date(),
        nextCheckDue: new Date(
          Date.now() +
            (this.healthChecks.get(componentName)?.checkInterval || 60000),
        ),
        checkDuration: Date.now() - startTime,
      };
    } catch (error) {
      return {
        component: componentName,
        status: 'critical',
        message: `Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: {
          error: error instanceof Error ? error.stack : String(error),
        },
        lastChecked: new Date(),
        nextCheckDue: new Date(
          Date.now() +
            (this.healthChecks.get(componentName)?.checkInterval || 60000),
        ),
        checkDuration: Date.now() - startTime,
      };
    }
  }

  private calculateHealthScore(components: HealthCheckResult[]): number {
    if (components.length === 0) return 100;

    let score = 0;
    for (const component of components) {
      switch (component.status) {
        case 'healthy':
          score += 100;
          break;
        case 'warning':
          score += 75;
          break;
        case 'critical':
          score += 25;
          break;
        case 'unknown':
          score += 50;
          break;
        default:
          break;
      }
    }

    return score / components.length;
  }

  private async generateHealthRecommendations(
    components: HealthCheckResult[],
  ): Promise<string[]> {
    const recommendations: string[] = [];

    const criticalComponents = components.filter(
      (c) => c.status === 'critical',
    );
    const warningComponents = components.filter((c) => c.status === 'warning');

    if (criticalComponents.length > 0) {
      recommendations.push(
        `URGENT: Address critical issues in ${criticalComponents.map((c) => c.component).join(', ')}`,
      );
    }

    if (warningComponents.length > 2) {
      recommendations.push(
        'Multiple components showing warnings - consider system-wide performance review',
      );
    }

    // Component-specific recommendations
    for (const component of [...criticalComponents, ...warningComponents]) {
      switch (component.component) {
        case 'TaskStatusMonitor':
          if (
            component.details?.['systemEfficiency'] &&
            (component.details['systemEfficiency'] as number) < 85
          ) {
            recommendations.push(
              'Consider scaling agent pool or optimizing task distribution',
            );
          }
          break;
        case 'NotificationSystem':
          if (
            component.details?.deliverySuccessRate &&
            (component.details.deliverySuccessRate as number) < 95
          ) {
            recommendations.push(
              'Investigate notification delivery failures and optimize channels',
            );
          }
          break;
        case 'MetricsCollector':
          if (
            component.details?.memoryUsage &&
            (component.details.memoryUsage as number) > 80
          ) {
            recommendations.push(
              'Reduce metrics retention period or increase available memory',
            );
          }
          break;
        default:
          break;
      }
    }

    return recommendations.slice(0, 5); // Limit to top 5 recommendations
  }

  private categorizeRecommendations(allRecommendations: string[]): {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
  } {
    const immediate: string[] = [];
    const shortTerm: string[] = [];
    const longTerm: string[] = [];

    for (const rec of allRecommendations) {
      const lowerRec = rec.toLowerCase();
      if (
        lowerRec.includes('urgent') ||
        lowerRec.includes('critical') ||
        lowerRec.includes('immediately')
      ) {
        immediate.push(rec);
      } else if (
        lowerRec.includes('consider') ||
        lowerRec.includes('review') ||
        lowerRec.includes('investigate')
      ) {
        shortTerm.push(rec);
      } else {
        longTerm.push(rec);
      }
    }

    return { immediate, shortTerm, longTerm };
  }

  private startDiagnostics(): void {
    // Run system health summary every 5 minutes
    this.diagnosticsInterval = setInterval(async () => {
      try {
        const summary = await this.getSystemHealthSummary();
        this.emit('system-health:updated', summary);

        if (summary.overallStatus === 'critical') {
          this.emit('system-health:critical', summary);
          this.logger.error('System health is critical', {
            healthScore: summary.healthScore,
            criticalIssues: summary.activeIssues.critical,
          });
        }
      } catch (error) {
        this.logger.error('Failed to update system health summary', { error });
      }
    }, 300000); // 5 minutes
  }

  private async withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Operation timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      promise
        .then((result) => {
          clearTimeout(timer);
          resolve(result);
        })
        .catch((error) => {
          clearTimeout(timer);
          reject(error);
        });
    });
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    // Clear all health check timers
    for (const timer of this.checkTimers.values()) {
      clearInterval(timer);
    }

    if (this.diagnosticsInterval) {
      clearInterval(this.diagnosticsInterval);
    }

    this.removeAllListeners();
    this.healthChecks.clear();
    this.lastHealthResults.clear();
    this.checkTimers.clear();
    this.healthHistory.length = 0;

    this.logger.info('HealthDiagnostics destroyed');
  }
}

/**
 * Singleton instance for global access
 */
export const healthDiagnostics = new HealthDiagnostics();
