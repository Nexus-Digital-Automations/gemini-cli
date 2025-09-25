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
import type { TaskPriority } from './TaskQueue';
import type {
  QueueMetrics,
  AutonomousQueueMetrics,
} from './EnhancedAutonomousTaskQueue';
/**
 * Comprehensive monitoring configuration for queue surveillance
 */
export interface MonitoringConfig {
  enabled: boolean;
  updateIntervalMs: number;
  historicalDataRetentionHours: number;
  maxDataPoints: number;
  enablePerformanceTracking: boolean;
  performanceMetricsIntervalMs: number;
  enableThroughputMonitoring: boolean;
  enableLatencyMonitoring: boolean;
  enableResourceMonitoring: boolean;
  enableAlerting: boolean;
  alertThresholds: AlertThresholds;
  alertChannels: AlertChannel[];
  enableAnomalyDetection: boolean;
  enableRealTimeVisualization: boolean;
  dashboardUpdateIntervalMs: number;
  chartDataPoints: number;
  enableHistoricalCharts: boolean;
  enablePredictiveAnalytics: boolean;
  enableHealthDiagnostics: boolean;
  enableCapacityPlanning: boolean;
  enableSLAMonitoring: boolean;
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
  throughputWarning: number;
  throughputCritical: number;
  latencyWarning: number;
  latencyCritical: number;
  errorRateWarning: number;
  errorRateCritical: number;
  resourceUsageWarning: number;
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
export declare enum AlertSeverity {
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
  totalTasks: number;
  pendingTasks: number;
  runningTasks: number;
  completedTasks: number;
  failedTasks: number;
  throughput: {
    tasksPerMinute: number;
    tasksPerHour: number;
    tasksCompleted: number;
    tasksStarted: number;
  };
  latency: {
    averageWaitTime: number;
    averageExecutionTime: number;
    totalProcessingTime: number;
    p50WaitTime: number;
    p95WaitTime: number;
    p99WaitTime: number;
  };
  resources: {
    cpuUsage: number;
    memoryUsage: number;
    activeWorkers: number;
    maxWorkers: number;
    workerUtilization: number;
  };
  health: {
    score: number;
    status: 'healthy' | 'warning' | 'critical' | 'emergency';
    issues: string[];
    recommendations: string[];
  };
  priorityDistribution: Map<TaskPriority, number>;
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
    metadata?: Record<string, any>;
  }>;
  trend: 'increasing' | 'decreasing' | 'stable';
  changeRate: number;
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
  metric: string;
  currentValue: number;
  threshold: number;
  acknowledged: boolean;
  resolved: boolean;
  resolvedAt?: Date;
  tags: string[];
  recommendations: string[];
  automatedActions: string[];
}
/**
 * Dashboard visualization data structure
 */
export interface DashboardData {
  timestamp: Date;
  summary: {
    totalQueues: number;
    activeTasks: number;
    completionRate: number;
    averageLatency: number;
    systemHealth: number;
  };
  charts: {
    throughputChart: ChartData;
    latencyChart: ChartData;
    queueSizeChart: ChartData;
    resourceChart: ChartData;
    errorRateChart: ChartData;
  };
  realtimeData: RealtimeQueueSnapshot[];
  activeAlerts: MonitoringAlert[];
  recentAlerts: MonitoringAlert[];
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
export declare class RealtimeQueueMonitor extends EventEmitter {
  private config;
  private snapshots;
  private historicalData;
  private alerts;
  private activeAlerts;
  private dashboardData;
  private monitoringInterval;
  private performanceInterval;
  private dashboardInterval;
  private webSocketServer;
  private connectedClients;
  private performanceMetrics;
  private resourceTracker;
  private healthDiagnostics;
  constructor(config?: Partial<MonitoringConfig>);
  /**
   * Build complete monitoring configuration with defaults
   */
  private buildConfig;
  /**
   * Get default alert thresholds for monitoring
   */
  private getDefaultAlertThresholds;
  /**
   * Get default alert channels for notifications
   */
  private getDefaultAlertChannels;
  /**
   * Initialize monitoring system and start collection
   */
  private initializeMonitoring;
  /**
   * Start main monitoring loop for queue surveillance
   */
  private startMonitoringLoop;
  /**
   * Start performance tracking for advanced metrics
   */
  private startPerformanceTracking;
  /**
   * Start dashboard data updates for real-time visualization
   */
  private startDashboardUpdates;
  /**
   * Initialize WebSocket server for live client updates
   */
  private initializeWebSocketServer;
  /**
   * Register a queue for monitoring with initial configuration
   */
  registerQueue(
    queueId: string,
    initialMetrics?: QueueMetrics | AutonomousQueueMetrics,
  ): void;
  /**
   * Unregister a queue from monitoring
   */
  unregisterQueue(queueId: string): void;
  /**
   * Update queue metrics for real-time monitoring
   */
  updateQueueMetrics(
    queueId: string,
    metrics: QueueMetrics | AutonomousQueueMetrics,
  ): void;
  /**
   * Create a comprehensive queue snapshot from metrics
   */
  private createSnapshot;
  /**
   * Calculate overall health score for a queue (0-100)
   */
  private calculateHealthScore;
  /**
   * Determine health status based on score
   */
  private determineHealthStatus;
  /**
   * Identify specific health issues from metrics
   */
  private identifyHealthIssues;
  /**
   * Generate health improvement recommendations
   */
  private generateHealthRecommendations;
  /**
   * Add snapshot to queue history with retention management
   */
  private addSnapshot;
  /**
   * Collect current queue metrics from all registered queues
   */
  private collectQueueMetrics;
  /**
   * Collect advanced performance metrics
   */
  private collectPerformanceMetrics;
  /**
   * Update dashboard data for real-time visualization
   */
  private updateDashboardData;
  /**
   * Generate comprehensive dashboard data
   */
  private generateDashboardData;
  /**
   * Calculate average latency across all queues
   */
  private calculateAverageLatency;
  /**
   * Calculate overall system health score
   */
  private calculateSystemHealth;
  /**
   * Get latest snapshot from each monitored queue
   */
  private getLatestSnapshots;
  /**
   * Generate throughput chart data for visualization
   */
  private generateThroughputChart;
  /**
   * Generate latency chart data for visualization
   */
  private generateLatencyChart;
  /**
   * Generate queue size chart data for visualization
   */
  private generateQueueSizeChart;
  /**
   * Generate resource utilization chart data
   */
  private generateResourceChart;
  /**
   * Generate error rate chart data for monitoring
   */
  private generateErrorRateChart;
  /**
   * Calculate data trend direction
   */
  private calculateTrend;
  /**
   * Check alert conditions and trigger notifications
   */
  private checkAlertConditions;
  /**
   * Create monitoring alert with comprehensive metadata
   */
  private createAlert;
  /**
   * Get recommendations for specific alert types
   */
  private getAlertRecommendations;
  /**
   * Get automated actions for specific alert types
   */
  private getAutomatedActions;
  /**
   * Process and distribute alert notifications
   */
  private processAlert;
  /**
   * Send alert notification through specified channel
   */
  private sendAlertNotification;
  /**
   * Get recent alerts for dashboard display
   */
  private getRecentAlerts;
  /**
   * Count alerts by severity level
   */
  private countAlertsBySeverity;
  /**
   * Calculate system uptime
   */
  private calculateSystemUptime;
  /**
   * Get current monitoring statistics
   */
  getMonitoringStats(): {
    totalQueues: number;
    totalSnapshots: number;
    activeAlerts: number;
    resolvedAlerts: number;
    uptimeHours: number;
  };
  /**
   * Get queue-specific monitoring data
   */
  getQueueData(queueId: string): RealtimeQueueSnapshot[] | null;
  /**
   * Get current dashboard data
   */
  getDashboardData(): DashboardData | null;
  /**
   * Acknowledge an alert to stop notifications
   */
  acknowledgeAlert(alertId: string, acknowledgedBy?: string): boolean;
  /**
   * Resolve an alert and remove from active list
   */
  resolveAlert(alertId: string, resolvedBy?: string): boolean;
  /**
   * Export monitoring data for analysis or backup
   */
  exportData(format?: 'json' | 'csv'): string;
  /**
   * Clean shutdown of monitoring system
   */
  shutdown(): Promise<void>;
}
/**
 * Default monitoring configuration for quick setup
 */
export declare const DEFAULT_MONITORING_CONFIG: MonitoringConfig;
