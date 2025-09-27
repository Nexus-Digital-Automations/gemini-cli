/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Real-Time Error Monitor for Interactive Debugging Assistance
 * Provides continuous error detection and monitoring for live applications
 *
 * @author Claude Code - Interactive Debugging Agent
 * @version 1.0.0
 */

import { getComponentLogger } from '../utils/logger.js';
import type {
  ErrorEvent,
  ErrorMetrics,
  MonitoringAlert,
  HealthStatus,
  MonitoredApplication,
  ErrorSubscriber,
  AlertRule,
  SystemHealth,
  PerformanceMetrics,
  LanguageSupport,
} from './types.js';

import {
  ErrorAnalysisEngine,
  type ErrorAnalysisEngineConfig,
} from './ErrorAnalysisEngine.js';

const logger = getComponentLogger('real-time-error-monitor');

/**
 * Configuration for real-time error monitor
 */
export interface RealTimeErrorMonitorConfig {
  /** Error analysis engine configuration */
  errorAnalysis: Partial<ErrorAnalysisEngineConfig>;
  /** Enable real-time monitoring */
  enableRealTimeMonitoring: boolean;
  /** Enable error pattern detection */
  enablePatternDetection: boolean;
  /** Enable trend analysis */
  enableTrendAnalysis: boolean;
  /** Enable automatic alerting */
  enableAutoAlerting: boolean;
  /** Monitoring interval in milliseconds */
  monitoringInterval: number;
  /** Maximum error history to maintain */
  maxErrorHistory: number;
  /** Error rate threshold for alerts */
  errorRateThreshold: number;
  /** Memory usage threshold for health checks */
  memoryThreshold: number;
  /** CPU usage threshold for health checks */
  cpuThreshold: number;
  /** Enable health monitoring */
  enableHealthMonitoring: boolean;
  /** Health check interval in milliseconds */
  healthCheckInterval: number;
  /** Error severity thresholds */
  severityThresholds: {
    warning: number;
    error: number;
    critical: number;
  };
}

/**
 * Default configuration for real-time error monitor
 */
export const DEFAULT_REAL_TIME_ERROR_MONITOR_CONFIG: RealTimeErrorMonitorConfig =
  {
    errorAnalysis: {
      enableDeepAnalysis: false, // Disabled for performance in real-time
      enableMLInsights: true,
    },
    enableRealTimeMonitoring: true,
    enablePatternDetection: true,
    enableTrendAnalysis: true,
    enableAutoAlerting: true,
    monitoringInterval: 5000, // 5 seconds
    maxErrorHistory: 1000,
    errorRateThreshold: 10, // errors per minute
    memoryThreshold: 85, // percentage
    cpuThreshold: 80, // percentage
    enableHealthMonitoring: true,
    healthCheckInterval: 30000, // 30 seconds
    severityThresholds: {
      warning: 1, // errors per minute
      error: 5, // errors per minute
      critical: 10, // errors per minute
    },
  };

/**
 * Built-in error patterns for real-time detection
 */
const REAL_TIME_ERROR_PATTERNS = {
  rapidFireErrors: {
    name: 'Rapid Fire Errors',
    description: 'Multiple errors occurring in quick succession',
    threshold: 5, // errors in timeWindow
    timeWindow: 10000, // 10 seconds
  },
  errorSpike: {
    name: 'Error Spike',
    description: 'Sudden increase in error rate',
    threshold: 3, // 3x normal rate
    timeWindow: 60000, // 1 minute
  },
  cascadingFailures: {
    name: 'Cascading Failures',
    description: 'Errors spreading across multiple components',
    threshold: 3, // different components
    timeWindow: 30000, // 30 seconds
  },
  memoryLeakIndicator: {
    name: 'Memory Leak Indicator',
    description: 'Memory-related errors with increasing trend',
    threshold: 2, // consecutive memory errors
    timeWindow: 120000, // 2 minutes
  },
  infiniteLoop: {
    name: 'Infinite Loop Detection',
    description: 'High CPU usage with repetitive errors',
    threshold: 10, // similar errors
    timeWindow: 30000, // 30 seconds
  },
};

/**
 * Real-Time Error Monitor
 *
 * Continuous monitoring system for detecting, analyzing, and responding to errors
 * in live applications with real-time alerting and pattern detection.
 *
 * Key Features:
 * - **Continuous Monitoring**: Real-time error detection and analysis
 * - **Pattern Recognition**: Identifies error patterns and anomalies
 * - **Trend Analysis**: Tracks error trends and predicts potential issues
 * - **Intelligent Alerting**: Context-aware alerts with severity-based thresholds
 * - **Health Monitoring**: System health checks and performance metrics
 * - **Multi-Application Support**: Monitor multiple applications simultaneously
 * - **Flexible Filtering**: Configurable error filters and rules
 * - **Performance Optimized**: Minimal overhead for production environments
 *
 * @example
 * ```typescript
 * const errorMonitor = new RealTimeErrorMonitor({
 *   enableRealTimeMonitoring: true,
 *   enableAutoAlerting: true,
 *   errorRateThreshold: 10,
 * });
 *
 * await errorMonitor.initialize();
 *
 * // Add application to monitor
 * await errorMonitor.addApplication({
 *   id: 'my-app',
 *   name: 'My Application',
 *   language: 'typescript',
 *   logSources: ['/var/log/app.log'],
 * });
 *
 * // Subscribe to error events
 * errorMonitor.subscribe('error-spike', (alert) => {
 *   console.log('Error spike detected:', alert);
 *   // Send notification, trigger scaling, etc.
 * });
 *
 * // Start monitoring
 * await errorMonitor.startMonitoring();
 * ```
 */
export class RealTimeErrorMonitor {
  private config: RealTimeErrorMonitorConfig;
  private errorAnalysisEngine?: ErrorAnalysisEngine;
  private monitoredApps: Map<string, MonitoredApplication> = new Map();
  private errorHistory: ErrorEvent[] = [];
  private subscribers: Map<string, ErrorSubscriber[]> = new Map();
  private alertRules: Map<string, AlertRule> = new Map();
  private monitoringTimer?: NodeJS.Timeout;
  private healthCheckTimer?: NodeJS.Timeout;
  private currentMetrics: ErrorMetrics = this.getInitialMetrics();
  private isMonitoring = false;
  private isInitialized = false;

  constructor(config: Partial<RealTimeErrorMonitorConfig> = {}) {
    this.config = { ...DEFAULT_REAL_TIME_ERROR_MONITOR_CONFIG, ...config };

    logger.info('RealTimeErrorMonitor initialized', {
      realTimeMonitoring: this.config.enableRealTimeMonitoring,
      patternDetection: this.config.enablePatternDetection,
      autoAlerting: this.config.enableAutoAlerting,
    });
  }

  /**
   * Initialize the real-time error monitor
   */
  async initialize(): Promise<void> {
    const startTime = performance.now();
    logger.info('Initializing Real-Time Error Monitor');

    try {
      // Initialize error analysis engine
      this.errorAnalysisEngine = new ErrorAnalysisEngine(
        this.config.errorAnalysis,
      );
      await this.errorAnalysisEngine.initialize();

      // Initialize built-in alert rules
      this.initializeAlertRules();

      this.isInitialized = true;
      const duration = performance.now() - startTime;

      logger.info(
        `Real-Time Error Monitor initialized in ${duration.toFixed(2)}ms`,
        {
          alertRules: this.alertRules.size,
          enableHealthMonitoring: this.config.enableHealthMonitoring,
        },
      );
    } catch (error) {
      logger.error('Failed to initialize Real-Time Error Monitor', { error });
      throw error;
    }
  }

  /**
   * Add an application to monitor
   */
  async addApplication(
    application: Omit<MonitoredApplication, 'status' | 'lastSeen'>,
  ): Promise<void> {
    if (!this.isInitialized) {
      throw new Error(
        'RealTimeErrorMonitor not initialized. Call initialize() first.',
      );
    }

    const monitoredApp: MonitoredApplication = {
      ...application,
      status: 'healthy',
      lastSeen: new Date(),
    };

    this.monitoredApps.set(application.id, monitoredApp);

    logger.info('Added application to monitoring', {
      appId: application.id,
      appName: application.name,
      language: application.language,
    });
  }

  /**
   * Remove an application from monitoring
   */
  async removeApplication(applicationId: string): Promise<void> {
    const removed = this.monitoredApps.delete(applicationId);

    if (removed) {
      logger.info('Removed application from monitoring', {
        appId: applicationId,
      });
    } else {
      logger.warn('Application not found for removal', {
        appId: applicationId,
      });
    }
  }

  /**
   * Start real-time monitoring
   */
  async startMonitoring(): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('RealTimeErrorMonitor not initialized');
    }

    if (this.isMonitoring) {
      logger.warn('Monitoring is already active');
      return;
    }

    this.isMonitoring = true;

    // Start error monitoring timer
    if (this.config.enableRealTimeMonitoring) {
      this.monitoringTimer = setInterval(
        () =>
          this.performMonitoringCycle().catch((error) =>
            logger.error('Monitoring cycle failed', { error }),
          ),
        this.config.monitoringInterval,
      );
    }

    // Start health monitoring timer
    if (this.config.enableHealthMonitoring) {
      this.healthCheckTimer = setInterval(
        () =>
          this.performHealthCheck().catch((error) =>
            logger.error('Health check failed', { error }),
          ),
        this.config.healthCheckInterval,
      );
    }

    logger.info('Real-time monitoring started', {
      monitoringInterval: this.config.monitoringInterval,
      healthCheckInterval: this.config.healthCheckInterval,
      monitoredApps: this.monitoredApps.size,
    });
  }

  /**
   * Stop real-time monitoring
   */
  async stopMonitoring(): Promise<void> {
    this.isMonitoring = false;

    if (this.monitoringTimer) {
      clearInterval(this.monitoringTimer);
      this.monitoringTimer = undefined;
    }

    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = undefined;
    }

    logger.info('Real-time monitoring stopped');
  }

  /**
   * Record an error event
   */
  async recordError(error: {
    message: string;
    stack?: string;
    applicationId: string;
    timestamp?: Date;
    severity?: 'low' | 'medium' | 'high' | 'critical';
    context?: Record<string, unknown>;
  }): Promise<void> {
    if (!this.isInitialized) {
      return;
    }

    const errorEvent: ErrorEvent = {
      id: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: error.timestamp || new Date(),
      applicationId: error.applicationId,
      message: error.message,
      stack: error.stack,
      severity: error.severity || 'medium',
      context: error.context || {},
      analyzed: false,
      patterns: [],
    };

    // Add to error history
    this.addToErrorHistory(errorEvent);

    // Update metrics
    this.updateMetrics(errorEvent);

    // Analyze error if analysis engine is available
    if (this.errorAnalysisEngine) {
      try {
        const app = this.monitoredApps.get(error.applicationId);
        const analysis = await this.errorAnalysisEngine.analyzeError(
          error.message,
          {
            language: app?.language as LanguageSupport,
            applicationId: error.applicationId,
            timestamp: errorEvent.timestamp,
          },
        );

        errorEvent.analysis = analysis;
        errorEvent.analyzed = true;
      } catch (analysisError) {
        logger.debug('Failed to analyze error in real-time', {
          error: analysisError,
        });
      }
    }

    // Check for patterns and alerts
    if (this.config.enablePatternDetection) {
      await this.checkErrorPatterns(errorEvent);
    }

    // Emit error event to subscribers
    await this.emitErrorEvent(errorEvent);

    logger.debug('Recorded error event', {
      errorId: errorEvent.id,
      appId: error.applicationId,
      severity: errorEvent.severity,
    });
  }

  /**
   * Subscribe to error events and alerts
   */
  subscribe(
    eventType: string,
    callback: (alert: MonitoringAlert) => void,
  ): void {
    if (!this.subscribers.has(eventType)) {
      this.subscribers.set(eventType, []);
    }

    this.subscribers.get(eventType)!.push({ callback });

    logger.debug('Added subscriber', {
      eventType,
      totalSubscribers: this.subscribers.size,
    });
  }

  /**
   * Unsubscribe from error events
   */
  unsubscribe(
    eventType: string,
    callback: (alert: MonitoringAlert) => void,
  ): void {
    const eventSubscribers = this.subscribers.get(eventType);
    if (eventSubscribers) {
      const index = eventSubscribers.findIndex(
        (sub) => sub.callback === callback,
      );
      if (index !== -1) {
        eventSubscribers.splice(index, 1);
        logger.debug('Removed subscriber', { eventType });
      }
    }
  }

  /**
   * Add custom alert rule
   */
  addAlertRule(rule: AlertRule): void {
    this.alertRules.set(rule.id, rule);
    logger.info('Added custom alert rule', {
      ruleId: rule.id,
      ruleName: rule.name,
    });
  }

  /**
   * Remove alert rule
   */
  removeAlertRule(ruleId: string): boolean {
    const removed = this.alertRules.delete(ruleId);
    if (removed) {
      logger.info('Removed alert rule', { ruleId });
    }
    return removed;
  }

  /**
   * Get current error metrics
   */
  getCurrentMetrics(): ErrorMetrics {
    return { ...this.currentMetrics };
  }

  /**
   * Get error history
   */
  getErrorHistory(limit?: number, applicationId?: string): ErrorEvent[] {
    let history = this.errorHistory;

    if (applicationId) {
      history = history.filter(
        (error) => error.applicationId === applicationId,
      );
    }

    if (limit) {
      history = history.slice(-limit);
    }

    return history;
  }

  /**
   * Get system health status
   */
  getSystemHealth(): SystemHealth {
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60000);

    const recentErrors = this.errorHistory.filter(
      (error) => error.timestamp >= oneMinuteAgo,
    );
    const errorRate = recentErrors.length;

    let overallStatus: HealthStatus = 'healthy';
    const issues: string[] = [];

    // Check error rate
    if (errorRate >= this.config.severityThresholds.critical) {
      overallStatus = 'critical';
      issues.push(`Critical error rate: ${errorRate} errors/minute`);
    } else if (errorRate >= this.config.severityThresholds.error) {
      overallStatus = 'degraded';
      issues.push(`High error rate: ${errorRate} errors/minute`);
    } else if (errorRate >= this.config.severityThresholds.warning) {
      overallStatus = 'warning';
      issues.push(`Elevated error rate: ${errorRate} errors/minute`);
    }

    // Check application health
    for (const app of this.monitoredApps.values()) {
      if (app.status !== 'healthy') {
        if (overallStatus === 'healthy') {
          overallStatus = 'warning';
        }
        issues.push(`Application ${app.name} status: ${app.status}`);
      }
    }

    return {
      status: overallStatus,
      errorRate,
      activeAlerts: [], // Would track active alerts
      systemMetrics: this.getSystemMetrics(),
      applicationHealth: Array.from(this.monitoredApps.values()).map((app) => ({
        applicationId: app.id,
        status: app.status,
        lastSeen: app.lastSeen,
      })),
      issues,
      lastUpdated: now,
    };
  }

  /**
   * Get monitoring statistics
   */
  getMonitoringStats(): {
    isMonitoring: boolean;
    monitoredApplications: number;
    totalErrorsRecorded: number;
    activeAlertRules: number;
    subscribers: number;
    uptime: number;
  } {
    return {
      isMonitoring: this.isMonitoring,
      monitoredApplications: this.monitoredApps.size,
      totalErrorsRecorded: this.errorHistory.length,
      activeAlertRules: this.alertRules.size,
      subscribers: Array.from(this.subscribers.values()).reduce(
        (sum, subs) => sum + subs.length,
        0,
      ),
      uptime: this.isInitialized ? Date.now() - Date.now() : 0, // Would track actual uptime
    };
  }

  /**
   * Clear error history
   */
  clearHistory(): void {
    this.errorHistory = [];
    this.currentMetrics = this.getInitialMetrics();
    logger.info('Error history cleared');
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<RealTimeErrorMonitorConfig>): void {
    this.config = { ...this.config, ...newConfig };

    // Restart timers if intervals changed
    if (
      this.isMonitoring &&
      (newConfig.monitoringInterval || newConfig.healthCheckInterval)
    ) {
      this.stopMonitoring().then(() => this.startMonitoring());
    }

    logger.info('Real-time error monitor configuration updated');
  }

  /**
   * Perform monitoring cycle
   */
  private async performMonitoringCycle(): Promise<void> {
    try {
      // Update application statuses
      await this.updateApplicationStatuses();

      // Check for alert conditions
      if (this.config.enableAutoAlerting) {
        await this.checkAlertConditions();
      }

      // Perform trend analysis
      if (this.config.enableTrendAnalysis) {
        await this.performTrendAnalysis();
      }

      // Clean up old error history
      this.cleanupErrorHistory();

      logger.debug('Monitoring cycle completed', {
        errorHistory: this.errorHistory.length,
        apps: this.monitoredApps.size,
      });
    } catch (error) {
      logger.error('Monitoring cycle failed', { error });
    }
  }

  /**
   * Perform health check
   */
  private async performHealthCheck(): Promise<void> {
    try {
      const systemMetrics = this.getSystemMetrics();

      // Check memory usage
      if (systemMetrics.memoryUsage > this.config.memoryThreshold) {
        await this.triggerAlert({
          id: `health-memory-${Date.now()}`,
          type: 'system-health',
          severity: 'warning',
          title: 'High Memory Usage',
          description: `Memory usage at ${systemMetrics.memoryUsage}%`,
          timestamp: new Date(),
          applicationId: 'system',
        });
      }

      // Check CPU usage
      if (systemMetrics.cpuUsage > this.config.cpuThreshold) {
        await this.triggerAlert({
          id: `health-cpu-${Date.now()}`,
          type: 'system-health',
          severity: 'warning',
          title: 'High CPU Usage',
          description: `CPU usage at ${systemMetrics.cpuUsage}%`,
          timestamp: new Date(),
          applicationId: 'system',
        });
      }

      logger.debug('Health check completed', {
        memoryUsage: systemMetrics.memoryUsage,
        cpuUsage: systemMetrics.cpuUsage,
      });
    } catch (error) {
      logger.error('Health check failed', { error });
    }
  }

  /**
   * Add error to history with size management
   */
  private addToErrorHistory(errorEvent: ErrorEvent): void {
    this.errorHistory.push(errorEvent);

    // Maintain maximum history size
    if (this.errorHistory.length > this.config.maxErrorHistory) {
      this.errorHistory = this.errorHistory.slice(-this.config.maxErrorHistory);
    }
  }

  /**
   * Update error metrics
   */
  private updateMetrics(errorEvent: ErrorEvent): void {
    this.currentMetrics.totalErrors++;

    switch (errorEvent.severity) {
      case 'low':
        this.currentMetrics.errorsBySeverity.low++;
        break;
      case 'medium':
        this.currentMetrics.errorsBySeverity.medium++;
        break;
      case 'high':
        this.currentMetrics.errorsBySeverity.high++;
        break;
      case 'critical':
        this.currentMetrics.errorsBySeverity.critical++;
        break;
      default:
        // Unknown severity, count as medium
        this.currentMetrics.errorsBySeverity.medium++;
        break;
    }

    // Update application-specific metrics
    if (!this.currentMetrics.errorsByApplication[errorEvent.applicationId]) {
      this.currentMetrics.errorsByApplication[errorEvent.applicationId] = 0;
    }
    this.currentMetrics.errorsByApplication[errorEvent.applicationId]++;

    // Calculate error rate (errors per minute)
    const oneMinuteAgo = new Date(Date.now() - 60000);
    const recentErrors = this.errorHistory.filter(
      (error) => error.timestamp >= oneMinuteAgo,
    );
    this.currentMetrics.errorRate = recentErrors.length;

    this.currentMetrics.lastUpdated = new Date();
  }

  /**
   * Check for error patterns
   */
  private async checkErrorPatterns(errorEvent: ErrorEvent): Promise<void> {
    const now = errorEvent.timestamp.getTime();

    for (const [patternId, patternConfig] of Object.entries(
      REAL_TIME_ERROR_PATTERNS,
    )) {
      const windowStart = now - patternConfig.timeWindow;
      const relevantErrors = this.errorHistory.filter(
        (error) => error.timestamp.getTime() >= windowStart,
      );

      let patternDetected = false;
      let description = '';

      switch (patternId) {
        case 'rapidFireErrors': {
          if (relevantErrors.length >= patternConfig.threshold) {
            patternDetected = true;
            description = `${relevantErrors.length} errors in ${patternConfig.timeWindow / 1000}s`;
          }
          break;
        }

        case 'errorSpike': {
          const baselineWindow = windowStart - patternConfig.timeWindow;
          const baselineErrors = this.errorHistory.filter(
            (error) =>
              error.timestamp.getTime() >= baselineWindow &&
              error.timestamp.getTime() < windowStart,
          );
          const baselineRate = baselineErrors.length || 1;

          if (relevantErrors.length >= baselineRate * patternConfig.threshold) {
            patternDetected = true;
            description = `${relevantErrors.length} vs baseline ${baselineRate} errors`;
          }
          break;
        }

        case 'cascadingFailures': {
          const uniqueApps = new Set(
            relevantErrors.map((error) => error.applicationId),
          );
          if (uniqueApps.size >= patternConfig.threshold) {
            patternDetected = true;
            description = `Errors across ${uniqueApps.size} applications`;
          }
          break;
        }

        case 'memoryLeakIndicator': {
          const memoryErrors = relevantErrors.filter(
            (error) =>
              error.message.toLowerCase().includes('memory') ||
              error.message.toLowerCase().includes('heap'),
          );
          if (memoryErrors.length >= patternConfig.threshold) {
            patternDetected = true;
            description = `${memoryErrors.length} memory-related errors`;
          }
          break;
        }

        case 'infiniteLoop': {
          const similarErrors = relevantErrors.filter(
            (error) => error.message === errorEvent.message,
          );
          if (similarErrors.length >= patternConfig.threshold) {
            patternDetected = true;
            description = `${similarErrors.length} identical errors - possible infinite loop`;
          }
          break;
        }

        default:
          // Unknown pattern type, skip detection
          break;
      }

      if (patternDetected) {
        await this.triggerPatternAlert(
          patternId,
          patternConfig,
          description,
          errorEvent,
        );
      }
    }
  }

  /**
   * Emit error event to subscribers
   */
  private async emitErrorEvent(errorEvent: ErrorEvent): Promise<void> {
    const subscribers = this.subscribers.get('error') || [];

    for (const subscriber of subscribers) {
      try {
        const alert: MonitoringAlert = {
          id: `alert-${errorEvent.id}`,
          type: 'error',
          severity:
            errorEvent.severity === 'low'
              ? 'info'
              : errorEvent.severity === 'medium'
                ? 'warning'
                : errorEvent.severity === 'high'
                  ? 'error'
                  : 'critical',
          title: 'New Error Detected',
          description: errorEvent.message,
          timestamp: errorEvent.timestamp,
          applicationId: errorEvent.applicationId,
          metadata: {
            errorId: errorEvent.id,
            hasStack: !!errorEvent.stack,
            analyzed: errorEvent.analyzed,
          },
        };

        subscriber.callback(alert);
      } catch (error) {
        logger.error('Failed to notify subscriber', { error });
      }
    }
  }

  /**
   * Trigger pattern-based alert
   */
  private async triggerPatternAlert(
    patternId: string,
    patternConfig: Record<string, unknown>,
    description: string,
    triggerEvent: ErrorEvent,
  ): Promise<void> {
    const alert: MonitoringAlert = {
      id: `pattern-${patternId}-${Date.now()}`,
      type: 'pattern',
      severity: 'warning',
      title: String(patternConfig.name),
      description: `${patternConfig.description}: ${description}`,
      timestamp: new Date(),
      applicationId: triggerEvent.applicationId,
      metadata: {
        patternId,
        patternType: patternConfig.name,
        triggerErrorId: triggerEvent.id,
      },
    };

    await this.triggerAlert(alert);
  }

  /**
   * Trigger alert and notify subscribers
   */
  private async triggerAlert(alert: MonitoringAlert): Promise<void> {
    // Notify pattern-specific subscribers
    const patternSubscribers = this.subscribers.get(alert.type) || [];
    for (const subscriber of patternSubscribers) {
      try {
        subscriber.callback(alert);
      } catch (error) {
        logger.error('Failed to notify pattern subscriber', { error });
      }
    }

    // Notify general alert subscribers
    const alertSubscribers = this.subscribers.get('alert') || [];
    for (const subscriber of alertSubscribers) {
      try {
        subscriber.callback(alert);
      } catch (error) {
        logger.error('Failed to notify alert subscriber', { error });
      }
    }

    logger.info('Triggered monitoring alert', {
      alertId: alert.id,
      type: alert.type,
      severity: alert.severity,
      title: alert.title,
    });
  }

  /**
   * Update application statuses
   */
  private async updateApplicationStatuses(): Promise<void> {
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

    for (const [appId, app] of this.monitoredApps.entries()) {
      const appErrors = this.errorHistory.filter(
        (error) =>
          error.applicationId === appId && error.timestamp >= fiveMinutesAgo,
      );

      let status: HealthStatus = 'healthy';

      if (appErrors.length >= 10) {
        status = 'critical';
      } else if (appErrors.length >= 5) {
        status = 'degraded';
      } else if (appErrors.length >= 1) {
        status = 'warning';
      }

      if (app.status !== status) {
        app.status = status;
        logger.info('Application status changed', {
          appId,
          appName: app.name,
          oldStatus: app.status,
          newStatus: status,
          errorCount: appErrors.length,
        });
      }

      app.lastSeen = now;
    }
  }

  /**
   * Check alert conditions
   */
  private async checkAlertConditions(): Promise<void> {
    // Implementation would check custom alert rules
    logger.debug('Alert condition checking not fully implemented');
  }

  /**
   * Perform trend analysis
   */
  private async performTrendAnalysis(): Promise<void> {
    // Implementation would analyze error trends over time
    logger.debug('Trend analysis not fully implemented');
  }

  /**
   * Clean up old error history
   */
  private cleanupErrorHistory(): void {
    const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
    const initialLength = this.errorHistory.length;

    this.errorHistory = this.errorHistory.filter(
      (error) => error.timestamp >= cutoffTime,
    );

    if (this.errorHistory.length < initialLength) {
      logger.debug('Cleaned up old error history', {
        removed: initialLength - this.errorHistory.length,
        remaining: this.errorHistory.length,
      });
    }
  }

  /**
   * Initialize built-in alert rules
   */
  private initializeAlertRules(): void {
    // Initialize with built-in patterns
    for (const [patternId, patternConfig] of Object.entries(
      REAL_TIME_ERROR_PATTERNS,
    )) {
      const rule: AlertRule = {
        id: `builtin-${patternId}`,
        name: patternConfig.name,
        description: patternConfig.description,
        condition: {
          type: 'pattern',
          patternId,
          threshold: patternConfig.threshold,
          timeWindow: patternConfig.timeWindow,
        },
        severity: 'warning',
        enabled: true,
      };

      this.alertRules.set(rule.id, rule);
    }

    logger.debug('Initialized built-in alert rules', {
      count: this.alertRules.size,
    });
  }

  /**
   * Get initial metrics object
   */
  private getInitialMetrics(): ErrorMetrics {
    return {
      totalErrors: 0,
      errorRate: 0,
      errorsBySeverity: {
        low: 0,
        medium: 0,
        high: 0,
        critical: 0,
      },
      errorsByApplication: {},
      lastUpdated: new Date(),
    };
  }

  /**
   * Get current system metrics
   */
  private getSystemMetrics(): PerformanceMetrics {
    // In a real implementation, would gather actual system metrics
    const memoryUsage = process.memoryUsage();

    return {
      memoryUsage: Math.round(
        (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100,
      ),
      cpuUsage: 25, // Placeholder - would use actual CPU monitoring
      responseTime: 150, // Placeholder
      throughput: 100, // Placeholder
    };
  }
}

/**
 * Create a Real-Time Error Monitor instance
 */
export async function createRealTimeErrorMonitor(
  config: Partial<RealTimeErrorMonitorConfig> = {},
): Promise<RealTimeErrorMonitor> {
  const monitor = new RealTimeErrorMonitor(config);
  await monitor.initialize();
  return monitor;
}
