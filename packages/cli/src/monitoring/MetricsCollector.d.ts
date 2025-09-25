/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { EventEmitter } from 'node:events';
import type { TaskMetadata, TaskStatus } from './TaskStatusMonitor.js';
/**
 * System resource metrics
 */
export interface SystemMetrics {
  timestamp: Date;
  cpu: {
    usage: number;
    cores: number;
    loadAverage: number[];
  };
  memory: {
    used: number;
    free: number;
    total: number;
    usagePercent: number;
  };
  performance: {
    uptime: number;
    eventLoopLag: number;
    gcPause: number;
  };
}
/**
 * Task performance metrics
 */
export interface TaskPerformanceMetrics {
  taskId: string;
  agentId?: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  status: TaskStatus;
  cpuUsageDuringTask: number[];
  memoryUsageDuringTask: number[];
  operationCounts: {
    fileOperations: number;
    networkRequests: number;
    computeOperations: number;
    databaseQueries: number;
  };
  performanceMarks: PerformanceEntry[];
  errorCount: number;
  retryCount: number;
  throughputMetrics: {
    operationsPerSecond: number;
    dataProcessedMB: number;
    requestsProcessed: number;
  };
}
/**
 * Agent performance metrics
 */
export interface AgentPerformanceMetrics {
  agentId: string;
  sessionId: string;
  activePeriod: {
    start: Date;
    end?: Date;
    duration: number;
  };
  taskMetrics: {
    totalTasks: number;
    completedTasks: number;
    failedTasks: number;
    averageTaskDuration: number;
    taskThroughput: number;
  };
  resourceUtilization: {
    averageCpuUsage: number;
    peakMemoryUsage: number;
    averageMemoryUsage: number;
    resourceEfficiency: number;
  };
  performanceProfile: {
    strengths: string[];
    weaknesses: string[];
    optimalTaskSize: 'small' | 'medium' | 'large';
    preferredTaskTypes: string[];
  };
  qualityMetrics: {
    successRate: number;
    errorRate: number;
    averageRetryCount: number;
    codeQualityScore: number;
  };
}
/**
 * Bottleneck analysis result
 */
export interface BottleneckAnalysis {
  type: 'cpu' | 'memory' | 'io' | 'network' | 'dependency' | 'concurrency';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  affectedTasks: string[];
  affectedAgents: string[];
  recommendations: string[];
  estimatedImpact: {
    performanceReduction: number;
    taskDelayMinutes: number;
    affectedTaskCount: number;
  };
  detectionTime: Date;
  resolved: boolean;
  resolutionTime?: Date;
}
/**
 * Performance alert configuration
 */
export interface PerformanceAlertConfig {
  name: string;
  condition: {
    metric: string;
    operator: '>' | '<' | '==' | '!=' | '>=' | '<=';
    threshold: number;
    duration?: number;
  };
  severity: 'info' | 'warning' | 'error' | 'critical';
  cooldownPeriod: number;
  actions: {
    notify: boolean;
    escalate: boolean;
    autoRemediate: boolean;
  };
}
/**
 * Comprehensive metrics collection and analysis
 */
export interface SystemAnalytics {
  period: {
    start: Date;
    end: Date;
    duration: number;
  };
  systemOverview: {
    totalTasks: number;
    activeAgents: number;
    systemEfficiency: number;
    overallThroughput: number;
  };
  performanceTrends: {
    taskCompletionRate: number[];
    systemResourceUsage: number[];
    agentUtilization: number[];
    errorRates: number[];
  };
  bottleneckSummary: {
    totalBottlenecks: number;
    criticalBottlenecks: number;
    commonBottleneckTypes: string[];
    resolutionRate: number;
  };
  recommendations: {
    systemOptimization: string[];
    agentOptimization: string[];
    resourceAllocation: string[];
    workloadDistribution: string[];
  };
}
/**
 * MetricsCollector - Advanced performance monitoring and analysis
 *
 * Comprehensive system that provides:
 * - Real-time system and task performance monitoring
 * - Bottleneck detection and analysis
 * - Agent performance profiling
 * - Predictive performance analysis
 * - Automated performance optimization recommendations
 */
export declare class MetricsCollector extends EventEmitter {
  private readonly logger;
  private systemMetricsHistory;
  private taskMetrics;
  private agentMetrics;
  private bottleneckHistory;
  private alertConfigs;
  private lastAlertTimes;
  private collectionInterval?;
  private analysisInterval?;
  private performanceObserver?;
  private readonly metricsRetentionPeriod;
  private readonly collectionIntervalMs;
  private readonly analysisIntervalMs;
  constructor();
  /**
   * Start collecting metrics for a specific task
   */
  startTaskMetricsCollection(
    taskId: string,
    taskMetadata: TaskMetadata,
  ): Promise<void>;
  /**
   * Update task metrics during execution
   */
  updateTaskMetrics(
    taskId: string,
    updates: {
      status?: TaskStatus;
      operationType?: keyof TaskPerformanceMetrics['operationCounts'];
      errorOccurred?: boolean;
      retryAttempted?: boolean;
      dataProcessed?: number;
      requestsProcessed?: number;
    },
  ): Promise<void>;
  /**
   * Complete task metrics collection
   */
  completeTaskMetricsCollection(
    taskId: string,
    finalStatus: TaskStatus,
  ): Promise<TaskPerformanceMetrics | null>;
  /**
   * Initialize agent performance tracking
   */
  initializeAgentMetrics(agentId: string, sessionId: string): Promise<void>;
  /**
   * Get current system metrics
   */
  collectSystemMetrics(): Promise<SystemMetrics>;
  /**
   * Analyze system performance and detect bottlenecks
   */
  analyzePerformanceBottlenecks(): Promise<BottleneckAnalysis[]>;
  /**
   * Get comprehensive system analytics
   */
  getSystemAnalytics(periodHours?: number): Promise<SystemAnalytics>;
  /**
   * Get task performance metrics
   */
  getTaskMetrics(taskId: string): TaskPerformanceMetrics | undefined;
  /**
   * Get agent performance metrics
   */
  getAgentMetrics(agentId: string): AgentPerformanceMetrics | undefined;
  /**
   * Get recent system metrics
   */
  getSystemMetricsHistory(limit?: number): SystemMetrics[];
  /**
   * Configure performance alerts
   */
  configureAlert(config: PerformanceAlertConfig): void;
  private initializePerformanceObserver;
  private setupDefaultAlerts;
  private startMetricsCollection;
  private startPeriodicAnalysis;
  private measureEventLoopLag;
  private updateAgentPerformanceMetrics;
  private createBottleneckAnalysis;
  private updateAgentPerformanceProfiles;
  private calculateSystemEfficiency;
  private calculateOverallThroughput;
  private calculateTaskCompletionTrend;
  private calculateResourceUsageTrend;
  private calculateAgentUtilizationTrend;
  private calculateErrorRateTrend;
  private getCommonBottleneckTypes;
  private calculateBottleneckResolutionRate;
  private generateSystemRecommendations;
  private checkAlerts;
  private getMetricValue;
  private evaluateCondition;
  private triggerAlert;
  private cleanupOldMetrics;
  private cleanupOldBottlenecks;
  /**
   * Cleanup resources
   */
  destroy(): void;
}
/**
 * Singleton instance for global access
 */
export declare const metricsCollector: MetricsCollector;
