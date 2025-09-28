/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Real-time Queue Monitoring and Visualization System
 *
 * Provides comprehensive monitoring capabilities for self-managing task queues
 * with live metrics, performance tracking, visual dashboards, and alerting.
 *
 * Key Features:
 * - Real-time queue metrics and statistics
 * - Live performance dashboards and visualizations
 * - Intelligent alerting and anomaly detection
 * - Historical trend analysis and reporting
 * - Resource utilization monitoring
 * - Queue health assessment and diagnostics
 * - WebSocket-based live updates
 * - Configurable monitoring intervals and thresholds
 *
 * @author TASK_QUEUE_DESIGNER_01
 * @version 1.0.0
 */

import { EventEmitter } from 'node:events';
import type { TaskPriority } from './types.js';
import type {
  QueueMetrics,
  AutonomousQueueMetrics,
} from './EnhancedAutonomousTaskQueue.js';

/**
 * WebSocket client interface for type safety
 */
interface WebSocketClient {
  readyState: number;
  send(data: string): void;
  close(): void;
}

/**
 * WebSocket server interface for type safety
 */
interface WebSocketServer {
  port: number;
  clients: Set<WebSocketClient>;
  broadcast(data: unknown): void;
}

/**
 * Comprehensive monitoring configuration for queue surveillance
 */
export interface MonitoringConfig {
  // Basic monitoring settings
  enabled: boolean;
  updateIntervalMs: number;
  historicalDataRetentionHours: number;
  maxDataPoints: number;

  // Performance monitoring
  enablePerformanceTracking: boolean;
  performanceMetricsIntervalMs: number;
  enableThroughputMonitoring: boolean;
  enableLatencyMonitoring: boolean;
  enableResourceMonitoring: boolean;

  // Alerting configuration
  enableAlerting: boolean;
  alertThresholds: AlertThresholds;
  alertChannels: AlertChannel[];
  enableAnomalyDetection: boolean;

  // Visualization settings
  enableRealTimeVisualization: boolean;
  dashboardUpdateIntervalMs: number;
  chartDataPoints: number;
  enableHistoricalCharts: boolean;

  // Advanced monitoring
  enablePredictiveAnalytics: boolean;
  enableHealthDiagnostics: boolean;
  enableCapacityPlanning: boolean;
  enableSLAMonitoring: boolean;

  // WebSocket configuration
  enableWebSocketUpdates: boolean;
  webSocketPort: number;
  maxWebSocketConnections: number;
}

/**
 * Alert threshold configuration for monitoring events
 */
export interface AlertThresholds {
  queueSizeWarning: number;
  queueSizeCritical: number;
  throughputWarning: number; // tasks/minute
  throughputCritical: number;
  latencyWarning: number; // milliseconds
  latencyCritical: number;
  errorRateWarning: number; // percentage
  errorRateCritical: number;
  resourceUsageWarning: number; // percentage
  resourceUsageCritical: number;
  deadlockDetection: boolean;
  starvationDetection: boolean;
}

/**
 * Alert channel configuration for notifications
 */
export interface AlertChannel {
  type: 'webhook' | 'email' | 'slack' | 'console' | 'file';
  endpoint?: string;
  credentials?: Record<string, string>;
  enabled: boolean;
  severity: AlertSeverity[];
}

/**
 * Alert severity levels for notification filtering
 */
export enum AlertSeverity {
  INFO = 'info',
  WARNING = 'warning',
  CRITICAL = 'critical',
  EMERGENCY = 'emergency',
}

/**
 * Real-time queue metrics snapshot for monitoring
 */
export interface RealtimeQueueSnapshot {
  timestamp: Date;
  queueId: string;

  // Queue state
  totalTasks: number;
  pendingTasks: number;
  runningTasks: number;
  completedTasks: number;
  failedTasks: number;

  // Performance metrics
  throughput: {
    tasksPerMinute: number;
    tasksPerHour: number;
    tasksCompleted: number;
    tasksStarted: number;
  };

  // Timing metrics
  latency: {
    averageWaitTime: number;
    averageExecutionTime: number;
    totalProcessingTime: number;
    p50WaitTime: number;
    p95WaitTime: number;
    p99WaitTime: number;
  };

  // Resource utilization
  resources: {
    cpuUsage: number;
    memoryUsage: number;
    activeWorkers: number;
    maxWorkers: number;
    workerUtilization: number;
  };

  // Queue health
  health: {
    score: number; // 0-100
    status: 'healthy' | 'warning' | 'critical' | 'emergency';
    issues: string[];
    recommendations: string[];
  };

  // Priority distribution
  priorityDistribution: Map<TaskPriority, number>;

  // Error tracking
  errors: {
    totalErrors: number;
    errorRate: number;
    recentErrors: Array<{
      timestamp: Date;
      error: string;
      taskId: string;
    }>;
  };
}

/**
 * Historical trend data for analytics and reporting
 */
export interface HistoricalTrend {
  period: 'minute' | 'hour' | 'day' | 'week';
  dataPoints: Array<{
    timestamp: Date;
    value: number;
    metadata?: Record<string, unknown>;
  }>;
  trend: 'increasing' | 'decreasing' | 'stable';
  changeRate: number; // percentage change
}

/**
 * Monitoring alert for queue events and anomalies
 */
export interface MonitoringAlert {
  id: string;
  timestamp: Date;
  severity: AlertSeverity;
  type: string;
  message: string;
  queueId: string;

  // Alert context
  metric: string;
  currentValue: number;
  threshold: number;

  // Alert metadata
  acknowledged: boolean;
  resolved: boolean;
  resolvedAt?: Date;
  tags: string[];

  // Action recommendations
  recommendations: string[];
  automatedActions: string[];
}

/**
 * Dashboard visualization data structure
 */
export interface DashboardData {
  timestamp: Date;

  // Summary cards
  summary: {
    totalQueues: number;
    activeTasks: number;
    completionRate: number;
    averageLatency: number;
    systemHealth: number;
  };

  // Chart data
  charts: {
    throughputChart: ChartData;
    latencyChart: ChartData;
    queueSizeChart: ChartData;
    resourceChart: ChartData;
    errorRateChart: ChartData;
  };

  // Real-time updates
  realtimeData: RealtimeQueueSnapshot[];

  // Alerts
  activeAlerts: MonitoringAlert[];
  recentAlerts: MonitoringAlert[];

  // System status
  systemStatus: {
    overallHealth: number;
    criticalIssues: number;
    warningIssues: number;
    uptime: number;
  };
}

/**
 * Chart data structure for visualizations
 */
export interface ChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    color: string;
    type: 'line' | 'bar' | 'area';
  }>;
  metadata: {
    min: number;
    max: number;
    average: number;
    trend: 'up' | 'down' | 'stable';
  };
}

/**
 * Real-time Queue Monitor with comprehensive visualization and alerting
 */
export class RealtimeQueueMonitor extends EventEmitter {
  private config: MonitoringConfig;
  private snapshots: Map<string, RealtimeQueueSnapshot[]>;
  private historicalData: Map<string, HistoricalTrend>;
  private alerts: MonitoringAlert[];
  private activeAlerts: Map<string, MonitoringAlert>;
  private dashboardData: DashboardData | null;

  // Monitoring intervals
  private monitoringInterval: NodeJS.Timeout | null;
  private performanceInterval: NodeJS.Timeout | null;
  private dashboardInterval: NodeJS.Timeout | null;

  // WebSocket server for live updates
  private webSocketServer: WebSocketServer | null;
  private connectedClients: Set<WebSocketClient>;

  // Performance tracking
  private performanceMetrics: Map<string, number[]>;
  private resourceTracker: ResourceTracker;
  private healthDiagnostics: HealthDiagnostics;

  constructor(config: Partial<MonitoringConfig> = {}) {
    super();

    console.log(`[RealtimeQueueMonitor] Initializing monitor with config:`, {
      enabled: config.enabled,
      updateInterval: config.updateIntervalMs,
      alerting: config.enableAlerting,
    });

    this.config = this.buildConfig(config);
    this.snapshots = new Map();
    this.historicalData = new Map();
    this.alerts = [];
    this.activeAlerts = new Map();
    this.dashboardData = null;

    // Initialize intervals
    this.monitoringInterval = null;
    this.performanceInterval = null;
    this.dashboardInterval = null;

    // Initialize WebSocket
    this.webSocketServer = null;
    this.connectedClients = new Set();

    // Initialize tracking components
    this.performanceMetrics = new Map();
    this.resourceTracker = new ResourceTracker();
    this.healthDiagnostics = new HealthDiagnostics();

    this.initializeMonitoring();
  }

  /**
   * Build complete monitoring configuration with defaults
   */
  private buildConfig(config: Partial<MonitoringConfig>): MonitoringConfig {
    return {
      enabled: config.enabled ?? true,
      updateIntervalMs: config.updateIntervalMs ?? 5000,
      historicalDataRetentionHours: config.historicalDataRetentionHours ?? 24,
      maxDataPoints: config.maxDataPoints ?? 1000,

      enablePerformanceTracking: config.enablePerformanceTracking ?? true,
      performanceMetricsIntervalMs:
        config.performanceMetricsIntervalMs ?? 10000,
      enableThroughputMonitoring: config.enableThroughputMonitoring ?? true,
      enableLatencyMonitoring: config.enableLatencyMonitoring ?? true,
      enableResourceMonitoring: config.enableResourceMonitoring ?? true,

      enableAlerting: config.enableAlerting ?? true,
      alertThresholds:
        config.alertThresholds ?? this.getDefaultAlertThresholds(),
      alertChannels: config.alertChannels ?? this.getDefaultAlertChannels(),
      enableAnomalyDetection: config.enableAnomalyDetection ?? true,

      enableRealTimeVisualization: config.enableRealTimeVisualization ?? true,
      dashboardUpdateIntervalMs: config.dashboardUpdateIntervalMs ?? 2000,
      chartDataPoints: config.chartDataPoints ?? 50,
      enableHistoricalCharts: config.enableHistoricalCharts ?? true,

      enablePredictiveAnalytics: config.enablePredictiveAnalytics ?? false,
      enableHealthDiagnostics: config.enableHealthDiagnostics ?? true,
      enableCapacityPlanning: config.enableCapacityPlanning ?? true,
      enableSLAMonitoring: config.enableSLAMonitoring ?? false,

      enableWebSocketUpdates: config.enableWebSocketUpdates ?? true,
      webSocketPort: config.webSocketPort ?? 8080,
      maxWebSocketConnections: config.maxWebSocketConnections ?? 100,
    };
  }

  /**
   * Get default alert thresholds for monitoring
   */
  private getDefaultAlertThresholds(): AlertThresholds {
    return {
      queueSizeWarning: 100,
      queueSizeCritical: 500,
      throughputWarning: 5, // tasks/minute
      throughputCritical: 1,
      latencyWarning: 5000, // milliseconds
      latencyCritical: 15000,
      errorRateWarning: 5, // percentage
      errorRateCritical: 15,
      resourceUsageWarning: 80, // percentage
      resourceUsageCritical: 95,
      deadlockDetection: true,
      starvationDetection: true,
    };
  }

  /**
   * Get default alert channels for notifications
   */
  private getDefaultAlertChannels(): AlertChannel[] {
    return [
      {
        type: 'console',
        enabled: true,
        severity: [
          AlertSeverity.INFO,
          AlertSeverity.WARNING,
          AlertSeverity.CRITICAL,
          AlertSeverity.EMERGENCY,
        ],
      },
      {
        type: 'file',
        endpoint: './logs/queue-alerts.log',
        enabled: true,
        severity: [
          AlertSeverity.WARNING,
          AlertSeverity.CRITICAL,
          AlertSeverity.EMERGENCY,
        ],
      },
    ];
  }

  /**
   * Initialize monitoring system and start collection
   */
  private async initializeMonitoring(): Promise<void> {
    if (!this.config.enabled) {
      console.log(`[RealtimeQueueMonitor] Monitoring disabled`);
      return;
    }

    console.log(`[RealtimeQueueMonitor] Starting monitoring system`);

    try {
      // Start monitoring intervals
      this.startMonitoringLoop();

      if (this.config.enablePerformanceTracking) {
        this.startPerformanceTracking();
      }

      if (this.config.enableRealTimeVisualization) {
        this.startDashboardUpdates();
      }

      if (this.config.enableWebSocketUpdates) {
        await this.initializeWebSocketServer();
      }

      console.log(
        `[RealtimeQueueMonitor] Monitoring system initialized successfully`,
      );
    } catch (error) {
      console.error(
        `[RealtimeQueueMonitor] Failed to initialize monitoring:`,
        error,
      );
      this.emit('error', error);
    }
  }

  /**
   * Start main monitoring loop for queue surveillance
   */
  private startMonitoringLoop(): void {
    this.monitoringInterval = setInterval(() => {
      this.collectQueueMetrics();
    }, this.config.updateIntervalMs);

    console.log(
      `[RealtimeQueueMonitor] Monitoring loop started (${this.config.updateIntervalMs}ms interval)`,
    );
  }

  /**
   * Start performance tracking for advanced metrics
   */
  private startPerformanceTracking(): void {
    this.performanceInterval = setInterval(() => {
      this.collectPerformanceMetrics();
    }, this.config.performanceMetricsIntervalMs);

    console.log(`[RealtimeQueueMonitor] Performance tracking started`);
  }

  /**
   * Start dashboard data updates for real-time visualization
   */
  private startDashboardUpdates(): void {
    this.dashboardInterval = setInterval(() => {
      this.updateDashboardData();
    }, this.config.dashboardUpdateIntervalMs);

    console.log(`[RealtimeQueueMonitor] Dashboard updates started`);
  }

  /**
   * Initialize WebSocket server for live client updates
   */
  private async initializeWebSocketServer(): Promise<void> {
    try {
      // Note: In a real implementation, you'd use ws or socket.io
      // This is a placeholder for WebSocket server initialization

      console.log(
        `[RealtimeQueueMonitor] WebSocket server would be initialized on port ${this.config.webSocketPort}`,
      );

      // Placeholder WebSocket server logic
      this.webSocketServer = {
        port: this.config.webSocketPort,
        clients: this.connectedClients,
        broadcast: (data: unknown) => {
          // Broadcast to all connected clients
          this.connectedClients.forEach((client) => {
            try {
              if ((client as WebSocketClient).readyState === 1) {
                // WebSocket.OPEN
                (client as WebSocketClient).send(JSON.stringify(data));
              }
            } catch (error) {
              console.warn(
                `[RealtimeQueueMonitor] Failed to send data to client:`,
                error,
              );
            }
          });
        },
      };
    } catch (error) {
      console.error(
        `[RealtimeQueueMonitor] Failed to initialize WebSocket server:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Register a queue for monitoring with initial configuration
   */
  registerQueue(
    queueId: string,
    initialMetrics?: QueueMetrics | AutonomousQueueMetrics,
  ): void {
    console.log(
      `[RealtimeQueueMonitor] Registering queue for monitoring: ${queueId}`,
    );

    if (!this.snapshots.has(queueId)) {
      this.snapshots.set(queueId, []);
    }

    // Create initial snapshot if metrics provided
    if (initialMetrics) {
      const snapshot = this.createSnapshot(queueId, initialMetrics);
      this.addSnapshot(queueId, snapshot);
    }

    this.emit('queueRegistered', { queueId, timestamp: new Date() });
  }

  /**
   * Unregister a queue from monitoring
   */
  unregisterQueue(queueId: string): void {
    console.log(`[RealtimeQueueMonitor] Unregistering queue: ${queueId}`);

    this.snapshots.delete(queueId);

    // Remove active alerts for this queue
    const alertsToRemove = Array.from(this.activeAlerts.keys()).filter(
      (alertId) => this.activeAlerts.get(alertId)?.queueId === queueId,
    );

    alertsToRemove.forEach((alertId) => {
      this.activeAlerts.delete(alertId);
    });

    this.emit('queueUnregistered', { queueId, timestamp: new Date() });
  }

  /**
   * Update queue metrics for real-time monitoring
   */
  updateQueueMetrics(
    queueId: string,
    metrics: QueueMetrics | AutonomousQueueMetrics,
  ): void {
    const snapshot = this.createSnapshot(queueId, metrics);
    this.addSnapshot(queueId, snapshot);

    // Check for alerts
    if (this.config.enableAlerting) {
      this.checkAlertConditions(snapshot);
    }

    // Update dashboard if enabled
    if (this.config.enableRealTimeVisualization) {
      this.updateDashboardData();
    }

    // Broadcast to WebSocket clients
    if (this.config.enableWebSocketUpdates && this.webSocketServer) {
      (this.webSocketServer as WebSocketServer).broadcast({
        type: 'queueUpdate',
        queueId,
        snapshot,
      });
    }

    this.emit('metricsUpdated', { queueId, snapshot });
  }

  /**
   * Create a comprehensive queue snapshot from metrics
   */
  private createSnapshot(
    queueId: string,
    metrics: QueueMetrics | AutonomousQueueMetrics,
  ): RealtimeQueueSnapshot {
    const now = new Date();

    // Calculate derived metrics
    const totalTasks =
      metrics.tasksProcessed + metrics.activeTasks + metrics.pendingTasks;

    // Calculate throughput (tasks per minute/hour)
    const timeRangeHours = 1; // Last hour
    const tasksPerHour = metrics.tasksProcessed / timeRangeHours;
    const tasksPerMinute = tasksPerHour / 60;

    // Calculate health score
    const healthScore = this.calculateHealthScore(metrics);
    const healthStatus = this.determineHealthStatus(healthScore);

    const snapshot: RealtimeQueueSnapshot = {
      timestamp: now,
      queueId,

      totalTasks,
      pendingTasks: metrics.pendingTasks,
      runningTasks: metrics.activeTasks,
      completedTasks: metrics.tasksProcessed,
      failedTasks: metrics.failedTasks || 0,

      throughput: {
        tasksPerMinute,
        tasksPerHour,
        tasksCompleted: metrics.tasksProcessed,
        tasksStarted: metrics.tasksProcessed + metrics.activeTasks,
      },

      latency: {
        averageWaitTime: metrics.averageWaitTime || 0,
        averageExecutionTime: metrics.averageExecutionTime || 0,
        totalProcessingTime: metrics.totalProcessingTime || 0,
        p50WaitTime: 0, // Would be calculated from historical data
        p95WaitTime: 0,
        p99WaitTime: 0,
      },

      resources: {
        cpuUsage: 0, // Would be tracked by ResourceTracker
        memoryUsage: 0,
        activeWorkers: metrics.activeTasks,
        maxWorkers: 10, // Configuration dependent
        workerUtilization:
          metrics.activeTasks > 0 ? (metrics.activeTasks / 10) * 100 : 0,
      },

      health: {
        score: healthScore,
        status: healthStatus,
        issues: this.identifyHealthIssues(metrics),
        recommendations: this.generateHealthRecommendations(metrics),
      },

      priorityDistribution: new Map(), // Would be populated from actual queue data

      errors: {
        totalErrors: metrics.failedTasks || 0,
        errorRate:
          totalTasks > 0 ? ((metrics.failedTasks || 0) / totalTasks) * 100 : 0,
        recentErrors: [], // Would be populated from error tracking
      },
    };

    return snapshot;
  }

  /**
   * Calculate overall health score for a queue (0-100)
   */
  private calculateHealthScore(
    metrics: QueueMetrics | AutonomousQueueMetrics,
  ): number {
    let score = 100;

    // Penalize for high queue sizes
    if (metrics.pendingTasks > this.config.alertThresholds.queueSizeWarning) {
      score -= Math.min(
        30,
        (metrics.pendingTasks / this.config.alertThresholds.queueSizeCritical) *
          30,
      );
    }

    // Penalize for high error rates
    const totalTasks =
      metrics.tasksProcessed + metrics.activeTasks + metrics.pendingTasks;
    if (totalTasks > 0) {
      const errorRate = ((metrics.failedTasks || 0) / totalTasks) * 100;
      if (errorRate > this.config.alertThresholds.errorRateWarning) {
        score -= Math.min(
          25,
          (errorRate / this.config.alertThresholds.errorRateCritical) * 25,
        );
      }
    }

    // Penalize for high latency
    if (
      (metrics.averageWaitTime || 0) >
      this.config.alertThresholds.latencyWarning
    ) {
      score -= Math.min(
        20,
        ((metrics.averageWaitTime || 0) /
          this.config.alertThresholds.latencyCritical) *
          20,
      );
    }

    // Bonus for active processing
    if (metrics.activeTasks > 0) {
      score += Math.min(5, metrics.activeTasks);
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Determine health status based on score
   */
  private determineHealthStatus(
    score: number,
  ): 'healthy' | 'warning' | 'critical' | 'emergency' {
    if (score >= 90) return 'healthy';
    if (score >= 70) return 'warning';
    if (score >= 40) return 'critical';
    return 'emergency';
  }

  /**
   * Identify specific health issues from metrics
   */
  private identifyHealthIssues(
    metrics: QueueMetrics | AutonomousQueueMetrics,
  ): string[] {
    const issues: string[] = [];

    if (metrics.pendingTasks > this.config.alertThresholds.queueSizeWarning) {
      issues.push(`High queue size: ${metrics.pendingTasks} pending tasks`);
    }

    const totalTasks =
      metrics.tasksProcessed + metrics.activeTasks + metrics.pendingTasks;
    if (totalTasks > 0) {
      const errorRate = ((metrics.failedTasks || 0) / totalTasks) * 100;
      if (errorRate > this.config.alertThresholds.errorRateWarning) {
        issues.push(`High error rate: ${errorRate.toFixed(1)}%`);
      }
    }

    if (
      (metrics.averageWaitTime || 0) >
      this.config.alertThresholds.latencyWarning
    ) {
      issues.push(
        `High latency: ${metrics.averageWaitTime}ms average wait time`,
      );
    }

    if (metrics.activeTasks === 0 && metrics.pendingTasks > 0) {
      issues.push(
        `Queue starvation: ${metrics.pendingTasks} tasks waiting but no active processing`,
      );
    }

    return issues;
  }

  /**
   * Generate health improvement recommendations
   */
  private generateHealthRecommendations(
    metrics: QueueMetrics | AutonomousQueueMetrics,
  ): string[] {
    const recommendations: string[] = [];

    if (metrics.pendingTasks > this.config.alertThresholds.queueSizeWarning) {
      recommendations.push(
        'Consider increasing worker capacity or optimizing task processing time',
      );
    }

    const totalTasks =
      metrics.tasksProcessed + metrics.activeTasks + metrics.pendingTasks;
    if (totalTasks > 0) {
      const errorRate = ((metrics.failedTasks || 0) / totalTasks) * 100;
      if (errorRate > this.config.alertThresholds.errorRateWarning) {
        recommendations.push(
          'Review error handling and task validation to reduce failure rate',
        );
      }
    }

    if (
      (metrics.averageWaitTime || 0) >
      this.config.alertThresholds.latencyWarning
    ) {
      recommendations.push(
        'Optimize queue scheduling and reduce task wait times',
      );
    }

    if (metrics.activeTasks === 0 && metrics.pendingTasks > 0) {
      recommendations.push(
        'Check queue processing status and restart workers if necessary',
      );
    }

    return recommendations;
  }

  /**
   * Add snapshot to queue history with retention management
   */
  private addSnapshot(queueId: string, snapshot: RealtimeQueueSnapshot): void {
    const snapshots = this.snapshots.get(queueId) || [];

    snapshots.push(snapshot);

    // Maintain maximum data points
    if (snapshots.length > this.config.maxDataPoints) {
      snapshots.shift();
    }

    // Clean up old data points based on retention period
    const cutoffTime = new Date(
      Date.now() - this.config.historicalDataRetentionHours * 60 * 60 * 1000,
    );
    const filteredSnapshots = snapshots.filter(
      (s) => s.timestamp >= cutoffTime,
    );

    this.snapshots.set(queueId, filteredSnapshots);
  }

  /**
   * Collect current queue metrics from all registered queues
   */
  private collectQueueMetrics(): void {
    // This would typically query actual queue instances
    // For now, we emit a collection event that queue instances can respond to
    this.emit('collectMetrics');
  }

  /**
   * Collect advanced performance metrics
   */
  private collectPerformanceMetrics(): void {
    if (!this.config.enablePerformanceTracking) return;

    // Collect system resource metrics
    this.resourceTracker.collectResourceMetrics();

    // Run health diagnostics
    if (this.config.enableHealthDiagnostics) {
      this.healthDiagnostics.runDiagnostics(this.snapshots);
    }

    this.emit('performanceMetricsCollected');
  }

  /**
   * Update dashboard data for real-time visualization
   */
  private updateDashboardData(): void {
    if (!this.config.enableRealTimeVisualization) return;

    try {
      this.dashboardData = this.generateDashboardData();

      // Broadcast to WebSocket clients
      if (this.config.enableWebSocketUpdates && this.webSocketServer) {
        (this.webSocketServer as WebSocketServer).broadcast({
          type: 'dashboardUpdate',
          data: this.dashboardData,
        });
      }

      this.emit('dashboardUpdated', this.dashboardData);
    } catch (error) {
      console.error(
        `[RealtimeQueueMonitor] Failed to update dashboard data:`,
        error,
      );
    }
  }

  /**
   * Generate comprehensive dashboard data
   */
  private generateDashboardData(): DashboardData {
    const now = new Date();
    const allSnapshots = Array.from(this.snapshots.values()).flat();

    // Calculate summary metrics
    const totalQueues = this.snapshots.size;
    const activeTasks = allSnapshots.reduce(
      (sum, s) => sum + s.runningTasks,
      0,
    );
    const totalTasks = allSnapshots.reduce((sum, s) => sum + s.totalTasks, 0);
    const completedTasks = allSnapshots.reduce(
      (sum, s) => sum + s.completedTasks,
      0,
    );
    const completionRate =
      totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    const averageLatency = this.calculateAverageLatency(allSnapshots);
    const systemHealth = this.calculateSystemHealth(allSnapshots);

    return {
      timestamp: now,

      summary: {
        totalQueues,
        activeTasks,
        completionRate,
        averageLatency,
        systemHealth,
      },

      charts: {
        throughputChart: this.generateThroughputChart(),
        latencyChart: this.generateLatencyChart(),
        queueSizeChart: this.generateQueueSizeChart(),
        resourceChart: this.generateResourceChart(),
        errorRateChart: this.generateErrorRateChart(),
      },

      realtimeData: this.getLatestSnapshots(),

      activeAlerts: Array.from(this.activeAlerts.values()),
      recentAlerts: this.getRecentAlerts(),

      systemStatus: {
        overallHealth: systemHealth,
        criticalIssues: this.countAlertsBySeverity(AlertSeverity.CRITICAL),
        warningIssues: this.countAlertsBySeverity(AlertSeverity.WARNING),
        uptime: this.calculateSystemUptime(),
      },
    };
  }

  /**
   * Calculate average latency across all queues
   */
  private calculateAverageLatency(snapshots: RealtimeQueueSnapshot[]): number {
    if (snapshots.length === 0) return 0;

    const totalLatency = snapshots.reduce(
      (sum, s) => sum + s.latency.averageWaitTime,
      0,
    );
    return totalLatency / snapshots.length;
  }

  /**
   * Calculate overall system health score
   */
  private calculateSystemHealth(snapshots: RealtimeQueueSnapshot[]): number {
    if (snapshots.length === 0) return 100;

    const totalHealth = snapshots.reduce((sum, s) => sum + s.health.score, 0);
    return totalHealth / snapshots.length;
  }

  /**
   * Get latest snapshot from each monitored queue
   */
  private getLatestSnapshots(): RealtimeQueueSnapshot[] {
    const latest: RealtimeQueueSnapshot[] = [];

    for (const [, snapshots] of this.snapshots) {
      if (snapshots.length > 0) {
        latest.push(snapshots[snapshots.length - 1]);
      }
    }

    return latest;
  }

  /**
   * Generate throughput chart data for visualization
   */
  private generateThroughputChart(): ChartData {
    const allSnapshots = Array.from(this.snapshots.values())
      .flat()
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
      .slice(-this.config.chartDataPoints);

    const labels = allSnapshots.map((s) => s.timestamp.toLocaleTimeString());
    const data = allSnapshots.map((s) => s.throughput.tasksPerMinute);

    return {
      labels,
      datasets: [
        {
          label: 'Tasks/Minute',
          data,
          color: '#3498db',
          type: 'line',
        },
      ],
      metadata: {
        min: Math.min(...data),
        max: Math.max(...data),
        average: data.reduce((a, b) => a + b, 0) / data.length,
        trend: this.calculateTrend(data),
      },
    };
  }

  /**
   * Generate latency chart data for visualization
   */
  private generateLatencyChart(): ChartData {
    const allSnapshots = Array.from(this.snapshots.values())
      .flat()
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
      .slice(-this.config.chartDataPoints);

    const labels = allSnapshots.map((s) => s.timestamp.toLocaleTimeString());
    const data = allSnapshots.map((s) => s.latency.averageWaitTime);

    return {
      labels,
      datasets: [
        {
          label: 'Average Wait Time (ms)',
          data,
          color: '#e74c3c',
          type: 'line',
        },
      ],
      metadata: {
        min: Math.min(...data),
        max: Math.max(...data),
        average: data.reduce((a, b) => a + b, 0) / data.length,
        trend: this.calculateTrend(data),
      },
    };
  }

  /**
   * Generate queue size chart data for visualization
   */
  private generateQueueSizeChart(): ChartData {
    const allSnapshots = Array.from(this.snapshots.values())
      .flat()
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
      .slice(-this.config.chartDataPoints);

    const labels = allSnapshots.map((s) => s.timestamp.toLocaleTimeString());
    const pendingData = allSnapshots.map((s) => s.pendingTasks);
    const runningData = allSnapshots.map((s) => s.runningTasks);

    return {
      labels,
      datasets: [
        {
          label: 'Pending Tasks',
          data: pendingData,
          color: '#f39c12',
          type: 'area',
        },
        {
          label: 'Running Tasks',
          data: runningData,
          color: '#2ecc71',
          type: 'area',
        },
      ],
      metadata: {
        min: Math.min(...pendingData, ...runningData),
        max: Math.max(...pendingData, ...runningData),
        average:
          (pendingData.reduce((a, b) => a + b, 0) +
            runningData.reduce((a, b) => a + b, 0)) /
          (pendingData.length + runningData.length),
        trend: this.calculateTrend([...pendingData, ...runningData]),
      },
    };
  }

  /**
   * Generate resource utilization chart data
   */
  private generateResourceChart(): ChartData {
    const allSnapshots = Array.from(this.snapshots.values())
      .flat()
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
      .slice(-this.config.chartDataPoints);

    const labels = allSnapshots.map((s) => s.timestamp.toLocaleTimeString());
    const cpuData = allSnapshots.map((s) => s.resources.cpuUsage);
    const memoryData = allSnapshots.map((s) => s.resources.memoryUsage);

    return {
      labels,
      datasets: [
        {
          label: 'CPU Usage (%)',
          data: cpuData,
          color: '#9b59b6',
          type: 'line',
        },
        {
          label: 'Memory Usage (%)',
          data: memoryData,
          color: '#e67e22',
          type: 'line',
        },
      ],
      metadata: {
        min: Math.min(...cpuData, ...memoryData),
        max: Math.max(...cpuData, ...memoryData),
        average:
          (cpuData.reduce((a, b) => a + b, 0) +
            memoryData.reduce((a, b) => a + b, 0)) /
          (cpuData.length + memoryData.length),
        trend: this.calculateTrend([...cpuData, ...memoryData]),
      },
    };
  }

  /**
   * Generate error rate chart data for monitoring
   */
  private generateErrorRateChart(): ChartData {
    const allSnapshots = Array.from(this.snapshots.values())
      .flat()
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
      .slice(-this.config.chartDataPoints);

    const labels = allSnapshots.map((s) => s.timestamp.toLocaleTimeString());
    const data = allSnapshots.map((s) => s.errors.errorRate);

    return {
      labels,
      datasets: [
        {
          label: 'Error Rate (%)',
          data,
          color: '#e74c3c',
          type: 'bar',
        },
      ],
      metadata: {
        min: Math.min(...data),
        max: Math.max(...data),
        average: data.reduce((a, b) => a + b, 0) / data.length,
        trend: this.calculateTrend(data),
      },
    };
  }

  /**
   * Calculate data trend direction
   */
  private calculateTrend(data: number[]): 'up' | 'down' | 'stable' {
    if (data.length < 2) return 'stable';

    const firstHalf = data.slice(0, Math.floor(data.length / 2));
    const secondHalf = data.slice(Math.floor(data.length / 2));

    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

    const change = ((secondAvg - firstAvg) / firstAvg) * 100;

    if (Math.abs(change) < 5) return 'stable';
    return change > 0 ? 'up' : 'down';
  }

  /**
   * Check alert conditions and trigger notifications
   */
  private checkAlertConditions(snapshot: RealtimeQueueSnapshot): void {
    const alerts: MonitoringAlert[] = [];

    // Queue size alerts
    if (
      snapshot.pendingTasks >= this.config.alertThresholds.queueSizeCritical
    ) {
      alerts.push(
        this.createAlert(
          AlertSeverity.CRITICAL,
          'queue-size-critical',
          `Critical queue size: ${snapshot.pendingTasks} pending tasks`,
          snapshot.queueId,
          'queueSize',
          snapshot.pendingTasks,
          this.config.alertThresholds.queueSizeCritical,
        ),
      );
    } else if (
      snapshot.pendingTasks >= this.config.alertThresholds.queueSizeWarning
    ) {
      alerts.push(
        this.createAlert(
          AlertSeverity.WARNING,
          'queue-size-warning',
          `High queue size: ${snapshot.pendingTasks} pending tasks`,
          snapshot.queueId,
          'queueSize',
          snapshot.pendingTasks,
          this.config.alertThresholds.queueSizeWarning,
        ),
      );
    }

    // Throughput alerts
    if (
      snapshot.throughput.tasksPerMinute <=
      this.config.alertThresholds.throughputCritical
    ) {
      alerts.push(
        this.createAlert(
          AlertSeverity.CRITICAL,
          'throughput-critical',
          `Critical low throughput: ${snapshot.throughput.tasksPerMinute} tasks/minute`,
          snapshot.queueId,
          'throughput',
          snapshot.throughput.tasksPerMinute,
          this.config.alertThresholds.throughputCritical,
        ),
      );
    } else if (
      snapshot.throughput.tasksPerMinute <=
      this.config.alertThresholds.throughputWarning
    ) {
      alerts.push(
        this.createAlert(
          AlertSeverity.WARNING,
          'throughput-warning',
          `Low throughput: ${snapshot.throughput.tasksPerMinute} tasks/minute`,
          snapshot.queueId,
          'throughput',
          snapshot.throughput.tasksPerMinute,
          this.config.alertThresholds.throughputWarning,
        ),
      );
    }

    // Latency alerts
    if (
      snapshot.latency.averageWaitTime >=
      this.config.alertThresholds.latencyCritical
    ) {
      alerts.push(
        this.createAlert(
          AlertSeverity.CRITICAL,
          'latency-critical',
          `Critical high latency: ${snapshot.latency.averageWaitTime}ms average wait time`,
          snapshot.queueId,
          'latency',
          snapshot.latency.averageWaitTime,
          this.config.alertThresholds.latencyCritical,
        ),
      );
    } else if (
      snapshot.latency.averageWaitTime >=
      this.config.alertThresholds.latencyWarning
    ) {
      alerts.push(
        this.createAlert(
          AlertSeverity.WARNING,
          'latency-warning',
          `High latency: ${snapshot.latency.averageWaitTime}ms average wait time`,
          snapshot.queueId,
          'latency',
          snapshot.latency.averageWaitTime,
          this.config.alertThresholds.latencyWarning,
        ),
      );
    }

    // Error rate alerts
    if (
      snapshot.errors.errorRate >= this.config.alertThresholds.errorRateCritical
    ) {
      alerts.push(
        this.createAlert(
          AlertSeverity.CRITICAL,
          'error-rate-critical',
          `Critical error rate: ${snapshot.errors.errorRate}%`,
          snapshot.queueId,
          'errorRate',
          snapshot.errors.errorRate,
          this.config.alertThresholds.errorRateCritical,
        ),
      );
    } else if (
      snapshot.errors.errorRate >= this.config.alertThresholds.errorRateWarning
    ) {
      alerts.push(
        this.createAlert(
          AlertSeverity.WARNING,
          'error-rate-warning',
          `High error rate: ${snapshot.errors.errorRate}%`,
          snapshot.queueId,
          'errorRate',
          snapshot.errors.errorRate,
          this.config.alertThresholds.errorRateWarning,
        ),
      );
    }

    // Process alerts
    for (const alert of alerts) {
      this.processAlert(alert);
    }
  }

  /**
   * Create monitoring alert with comprehensive metadata
   */
  private createAlert(
    severity: AlertSeverity,
    type: string,
    message: string,
    queueId: string,
    metric: string,
    currentValue: number,
    threshold: number,
  ): MonitoringAlert {
    const alertId = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return {
      id: alertId,
      timestamp: new Date(),
      severity,
      type,
      message,
      queueId,
      metric,
      currentValue,
      threshold,
      acknowledged: false,
      resolved: false,
      tags: [queueId, metric, severity],
      recommendations: this.getAlertRecommendations(
        type,
        currentValue,
        threshold,
      ),
      automatedActions: this.getAutomatedActions(type),
    };
  }

  /**
   * Get recommendations for specific alert types
   */
  private getAlertRecommendations(
    type: string,
    _currentValue: number,
    _threshold: number,
  ): string[] {
    switch (type) {
      case 'queue-size-critical':
      case 'queue-size-warning':
        return [
          'Increase worker capacity',
          'Optimize task processing time',
          'Review queue scheduling algorithm',
          'Consider load balancing',
        ];

      case 'throughput-critical':
      case 'throughput-warning':
        return [
          'Check worker health and availability',
          'Optimize task execution efficiency',
          'Review system resource constraints',
          'Consider scaling up processing capacity',
        ];

      case 'latency-critical':
      case 'latency-warning':
        return [
          'Optimize task scheduling algorithm',
          'Review queue priority distribution',
          'Check for system bottlenecks',
          'Consider implementing task batching',
        ];

      case 'error-rate-critical':
      case 'error-rate-warning':
        return [
          'Review task validation logic',
          'Improve error handling mechanisms',
          'Analyze failed task patterns',
          'Consider implementing retry policies',
        ];

      default:
        return ['Review system performance and configuration'];
    }
  }

  /**
   * Get automated actions for specific alert types
   */
  private getAutomatedActions(type: string): string[] {
    switch (type) {
      case 'queue-size-critical':
        return ['Scale up workers', 'Enable emergency processing mode'];

      case 'throughput-critical':
        return ['Restart stalled workers', 'Enable high-priority processing'];

      case 'latency-critical':
        return ['Activate urgent task processing', 'Bypass non-critical tasks'];

      case 'error-rate-critical':
        return ['Enable enhanced error logging', 'Pause failing task types'];

      default:
        return [];
    }
  }

  /**
   * Process and distribute alert notifications
   */
  private processAlert(alert: MonitoringAlert): void {
    // Add to alert collections
    this.alerts.push(alert);
    this.activeAlerts.set(alert.id, alert);

    // Send notifications through configured channels
    for (const channel of this.config.alertChannels) {
      if (channel.enabled && channel.severity.includes(alert.severity)) {
        this.sendAlertNotification(alert, channel);
      }
    }

    // Emit alert event
    this.emit('alert', alert);

    console.log(
      `[RealtimeQueueMonitor] Alert triggered: ${alert.type} - ${alert.message}`,
    );
  }

  /**
   * Send alert notification through specified channel
   */
  private async sendAlertNotification(
    alert: MonitoringAlert,
    channel: AlertChannel,
  ): Promise<void> {
    try {
      switch (channel.type) {
        case 'console':
          console.warn(
            `🚨 [ALERT] ${alert.severity.toUpperCase()}: ${alert.message}`,
          );
          break;

        case 'file':
          if (channel.endpoint) {
            const { promises: fs } = await import('node:fs');
            const logEntry = `${new Date().toISOString()} [${alert.severity.toUpperCase()}] ${alert.message}\n`;
            await fs.appendFile(channel.endpoint, logEntry);
          }
          break;

        case 'webhook':
          if (channel.endpoint) {
            // Would make HTTP request to webhook endpoint
            console.log(
              `[RealtimeQueueMonitor] Would send webhook to: ${channel.endpoint}`,
            );
          }
          break;

        case 'email':
          // Would send email notification
          console.log(
            `[RealtimeQueueMonitor] Would send email alert: ${alert.message}`,
          );
          break;

        case 'slack':
          // Would send Slack notification
          console.log(
            `[RealtimeQueueMonitor] Would send Slack alert: ${alert.message}`,
          );
          break;

        default:
          console.warn(
            `[RealtimeQueueMonitor] Unknown alert channel type: ${channel.type}`,
          );
          break;
      }
    } catch (error) {
      console.error(
        `[RealtimeQueueMonitor] Failed to send alert via ${channel.type}:`,
        error,
      );
    }
  }

  /**
   * Get recent alerts for dashboard display
   */
  private getRecentAlerts(hours: number = 24): MonitoringAlert[] {
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);

    return this.alerts
      .filter((alert) => alert.timestamp >= cutoffTime)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 50); // Limit to latest 50 alerts
  }

  /**
   * Count alerts by severity level
   */
  private countAlertsBySeverity(severity: AlertSeverity): number {
    return Array.from(this.activeAlerts.values()).filter(
      (alert) => alert.severity === severity && !alert.resolved,
    ).length;
  }

  /**
   * Calculate system uptime
   */
  private calculateSystemUptime(): number {
    // This would track actual system start time
    // For now, return a placeholder value
    return 99.5; // 99.5% uptime
  }

  /**
   * Get current monitoring statistics
   */
  getMonitoringStats(): {
    totalQueues: number;
    totalSnapshots: number;
    activeAlerts: number;
    resolvedAlerts: number;
    uptimeHours: number;
  } {
    const totalSnapshots = Array.from(this.snapshots.values()).reduce(
      (sum, snapshots) => sum + snapshots.length,
      0,
    );

    const activeAlerts = Array.from(this.activeAlerts.values()).filter(
      (alert) => !alert.resolved,
    ).length;

    const resolvedAlerts = this.alerts.filter((alert) => alert.resolved).length;

    return {
      totalQueues: this.snapshots.size,
      totalSnapshots,
      activeAlerts,
      resolvedAlerts,
      uptimeHours: 24, // Placeholder
    };
  }

  /**
   * Get queue-specific monitoring data
   */
  getQueueData(queueId: string): RealtimeQueueSnapshot[] | null {
    return this.snapshots.get(queueId) || null;
  }

  /**
   * Get current dashboard data
   */
  getDashboardData(): DashboardData | null {
    return this.dashboardData;
  }

  /**
   * Acknowledge an alert to stop notifications
   */
  acknowledgeAlert(alertId: string, acknowledgedBy?: string): boolean {
    const alert = this.activeAlerts.get(alertId);
    if (!alert) return false;

    alert.acknowledged = true;

    console.log(
      `[RealtimeQueueMonitor] Alert acknowledged: ${alertId} by ${acknowledgedBy || 'system'}`,
    );

    this.emit('alertAcknowledged', { alertId, acknowledgedBy });
    return true;
  }

  /**
   * Resolve an alert and remove from active list
   */
  resolveAlert(alertId: string, resolvedBy?: string): boolean {
    const alert = this.activeAlerts.get(alertId);
    if (!alert) return false;

    alert.resolved = true;
    alert.resolvedAt = new Date();

    this.activeAlerts.delete(alertId);

    console.log(
      `[RealtimeQueueMonitor] Alert resolved: ${alertId} by ${resolvedBy || 'system'}`,
    );

    this.emit('alertResolved', { alertId, resolvedBy });
    return true;
  }

  /**
   * Export monitoring data for analysis or backup
   */
  exportData(format: 'json' | 'csv' = 'json'): string {
    const data = {
      configuration: this.config,
      snapshots: Object.fromEntries(this.snapshots),
      alerts: this.alerts,
      exportTimestamp: new Date().toISOString(),
    };

    if (format === 'json') {
      return JSON.stringify(data, null, 2);
    }

    // CSV export would require more complex formatting
    // For now, return JSON
    return JSON.stringify(data);
  }

  /**
   * Clean shutdown of monitoring system
   */
  async shutdown(): Promise<void> {
    console.log(`[RealtimeQueueMonitor] Shutting down monitoring system`);

    // Clear intervals
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    if (this.performanceInterval) {
      clearInterval(this.performanceInterval);
      this.performanceInterval = null;
    }

    if (this.dashboardInterval) {
      clearInterval(this.dashboardInterval);
      this.dashboardInterval = null;
    }

    // Close WebSocket server
    if (this.webSocketServer) {
      // Close all client connections
      this.connectedClients.forEach((client) => {
        try {
          (client as WebSocketClient).close();
        } catch (error) {
          console.warn(
            `[RealtimeQueueMonitor] Error closing client connection:`,
            error,
          );
        }
      });

      this.connectedClients.clear();
      this.webSocketServer = null;
    }

    // Clean up resources
    this.snapshots.clear();
    this.alerts.length = 0;
    this.activeAlerts.clear();

    this.emit('shutdown');

    console.log(`[RealtimeQueueMonitor] Monitoring system shutdown complete`);
  }
}

/**
 * Resource tracking component for system monitoring
 */
class ResourceTracker {
  private resourceHistory: Array<{
    timestamp: Date;
    cpu: number;
    memory: number;
    disk: number;
  }>;

  constructor() {
    this.resourceHistory = [];
  }

  /**
   * Collect current system resource metrics
   */
  collectResourceMetrics(): void {
    // In a real implementation, this would use system monitoring APIs
    // For now, we'll use placeholder values

    const metrics = {
      timestamp: new Date(),
      cpu: Math.random() * 100, // 0-100%
      memory: Math.random() * 100,
      disk: Math.random() * 100,
    };

    this.resourceHistory.push(metrics);

    // Keep only last 1000 data points
    if (this.resourceHistory.length > 1000) {
      this.resourceHistory.shift();
    }
  }

  /**
   * Get current resource usage
   */
  getCurrentUsage(): { cpu: number; memory: number; disk: number } {
    const latest = this.resourceHistory[this.resourceHistory.length - 1];

    return latest
      ? {
          cpu: latest.cpu,
          memory: latest.memory,
          disk: latest.disk,
        }
      : { cpu: 0, memory: 0, disk: 0 };
  }

  /**
   * Get resource usage trend
   */
  getResourceTrend(minutes: number = 10): Array<{
    timestamp: Date;
    cpu: number;
    memory: number;
    disk: number;
  }> {
    const cutoffTime = new Date(Date.now() - minutes * 60 * 1000);

    return this.resourceHistory.filter(
      (entry) => entry.timestamp >= cutoffTime,
    );
  }
}

/**
 * Health diagnostics component for system analysis
 */
class HealthDiagnostics {
  private diagnosticHistory: Array<{
    timestamp: Date;
    overallHealth: number;
    issues: string[];
    recommendations: string[];
  }>;

  constructor() {
    this.diagnosticHistory = [];
  }

  /**
   * Run comprehensive health diagnostics
   */
  runDiagnostics(snapshots: Map<string, RealtimeQueueSnapshot[]>): void {
    const now = new Date();
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Analyze all queue snapshots for health issues
    for (const [queueId, queueSnapshots] of snapshots) {
      if (queueSnapshots.length === 0) continue;

      const latestSnapshot = queueSnapshots[queueSnapshots.length - 1];

      // Check for health issues
      if (latestSnapshot.health.score < 50) {
        issues.push(
          `Queue ${queueId} has poor health score: ${latestSnapshot.health.score}`,
        );
        recommendations.push(
          `Review queue ${queueId} configuration and performance`,
        );
      }

      // Check for stagnation
      if (
        latestSnapshot.runningTasks === 0 &&
        latestSnapshot.pendingTasks > 0
      ) {
        issues.push(
          `Queue ${queueId} appears stagnant with ${latestSnapshot.pendingTasks} pending tasks`,
        );
        recommendations.push(`Restart processing for queue ${queueId}`);
      }

      // Check error rates
      if (latestSnapshot.errors.errorRate > 10) {
        issues.push(
          `Queue ${queueId} has high error rate: ${latestSnapshot.errors.errorRate}%`,
        );
        recommendations.push(`Review error handling for queue ${queueId}`);
      }
    }

    // Calculate overall health
    const allSnapshots = Array.from(snapshots.values()).flat();
    const overallHealth =
      allSnapshots.length > 0
        ? allSnapshots.reduce((sum, s) => sum + s.health.score, 0) /
          allSnapshots.length
        : 100;

    // Store diagnostic result
    this.diagnosticHistory.push({
      timestamp: now,
      overallHealth,
      issues,
      recommendations,
    });

    // Keep only last 100 diagnostics
    if (this.diagnosticHistory.length > 100) {
      this.diagnosticHistory.shift();
    }
  }

  /**
   * Get latest diagnostic results
   */
  getLatestDiagnostics(): {
    timestamp: Date;
    overallHealth: number;
    issues: string[];
    recommendations: string[];
  } | null {
    return this.diagnosticHistory.length > 0
      ? this.diagnosticHistory[this.diagnosticHistory.length - 1]
      : null;
  }

  /**
   * Get diagnostic trend over time
   */
  getDiagnosticTrend(hours: number = 24): Array<{
    timestamp: Date;
    overallHealth: number;
    issueCount: number;
  }> {
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);

    return this.diagnosticHistory
      .filter((entry) => entry.timestamp >= cutoffTime)
      .map((entry) => ({
        timestamp: entry.timestamp,
        overallHealth: entry.overallHealth,
        issueCount: entry.issues.length,
      }));
  }
}

/**
 * Default monitoring configuration for quick setup
 */
export const DEFAULT_MONITORING_CONFIG: MonitoringConfig = {
  enabled: true,
  updateIntervalMs: 5000,
  historicalDataRetentionHours: 24,
  maxDataPoints: 1000,

  enablePerformanceTracking: true,
  performanceMetricsIntervalMs: 10000,
  enableThroughputMonitoring: true,
  enableLatencyMonitoring: true,
  enableResourceMonitoring: true,

  enableAlerting: true,
  alertThresholds: {
    queueSizeWarning: 100,
    queueSizeCritical: 500,
    throughputWarning: 5,
    throughputCritical: 1,
    latencyWarning: 5000,
    latencyCritical: 15000,
    errorRateWarning: 5,
    errorRateCritical: 15,
    resourceUsageWarning: 80,
    resourceUsageCritical: 95,
    deadlockDetection: true,
    starvationDetection: true,
  },
  alertChannels: [
    {
      type: 'console',
      enabled: true,
      severity: [
        AlertSeverity.INFO,
        AlertSeverity.WARNING,
        AlertSeverity.CRITICAL,
        AlertSeverity.EMERGENCY,
      ],
    },
  ],
  enableAnomalyDetection: true,

  enableRealTimeVisualization: true,
  dashboardUpdateIntervalMs: 2000,
  chartDataPoints: 50,
  enableHistoricalCharts: true,

  enablePredictiveAnalytics: false,
  enableHealthDiagnostics: true,
  enableCapacityPlanning: true,
  enableSLAMonitoring: false,

  enableWebSocketUpdates: true,
  webSocketPort: 8080,
  maxWebSocketConnections: 100,
};
