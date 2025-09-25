/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { EventEmitter } from 'node:events';
import type {
  TaskMetadata,
  TaskStatus,
  AgentStatus,
} from './TaskStatusMonitor.js';
export interface MonitoringScope {
  taskId: string;
  agentId?: string;
  sessionId?: string;
  parentTaskId?: string;
  monitoringLevel: 'basic' | 'detailed' | 'comprehensive';
  enableProgressTracking: boolean;
  enablePerformanceAnalytics: boolean;
  enableNotifications: boolean;
}
export interface TaskMonitoringConfig {
  scope: MonitoringScope;
  thresholds: {
    progressStall: number;
    performanceDegradation: number;
    errorRate: number;
    timeOverrun: number;
  };
  reporting: {
    enableRealTimeReporting: boolean;
    reportingInterval: number;
    includeDetailedMetrics: boolean;
    includeProgressEstimates: boolean;
  };
}
export interface IntegratedTaskStatus {
  task: TaskMetadata;
  status: TaskStatus;
  progress: {
    overall: number;
    milestones: Array<{
      name: string;
      completed: boolean;
      progress: number;
    }>;
    velocity: number;
    estimatedCompletion: Date | null;
    timeRemaining: number;
  };
  performance: {
    executionTime: number;
    efficiency: number;
    resourceUsage: {
      cpu: number;
      memory: number;
    };
    throughput: number;
    errorRate: number;
  };
  agent?: {
    id: string;
    status: string;
    performance: AgentStatus['performance'];
  };
  analytics: {
    bottlenecks: string[];
    recommendations: string[];
    riskFactors: string[];
    healthScore: number;
  };
}
/**
 * Comprehensive Task Monitor
 *
 * Unified monitoring interface that coordinates all monitoring subsystems:
 * - Task status tracking
 * - Progress tracking with ETA estimation
 * - Performance analytics and insights
 * - Real-time notifications
 * - Health monitoring and diagnostics
 */
export declare class TaskMonitor extends EventEmitter {
  private readonly logger;
  private monitoredTasks;
  private healthScores;
  private monitoringInterval?;
  constructor();
  /**
   * Start comprehensive monitoring for a task
   */
  startMonitoring(
    taskId: string,
    config?: Partial<TaskMonitoringConfig>,
  ): Promise<void>;
  /**
   * Get comprehensive task status with all monitoring data
   */
  getIntegratedTaskStatus(taskId: string): Promise<IntegratedTaskStatus | null>;
  /**
   * Get monitoring dashboard with all active tasks
   */
  getMonitoringDashboard(): Promise<{
    activeTasks: IntegratedTaskStatus[];
    systemMetrics: {
      totalMonitoredTasks: number;
      healthyTasks: number;
      atRiskTasks: number;
      failingTasks: number;
      averageHealthScore: number;
      systemThroughput: number;
      systemEfficiency: number;
    };
    alerts: Array<{
      taskId: string;
      type:
        | 'progress_stall'
        | 'performance_degradation'
        | 'high_error_rate'
        | 'time_overrun';
      severity: 'low' | 'medium' | 'high' | 'critical';
      message: string;
      timestamp: Date;
    }>;
    recommendations: string[];
  }>;
  /**
   * Update task progress with integrated monitoring
   */
  updateTaskProgress(
    taskId: string,
    progress: number,
    options?: {
      milestone?: string;
      operation?: string;
      context?: Record<string, unknown>;
    },
  ): Promise<void>;
  /**
   * Complete task monitoring
   */
  completeTask(
    taskId: string,
    result: 'success' | 'failure',
    details?: Record<string, unknown>,
  ): Promise<void>;
  private setupEventIntegration;
  private setupPeriodicMonitoring;
  private performPeriodicHealthChecks;
  private calculateTaskAnalytics;
  private updateHealthScore;
  private generateTaskAlerts;
  private generateSystemRecommendations;
  private mergeConfig;
  /**
   * Cleanup resources
   */
  destroy(): void;
}
/**
 * Singleton instance for global access
 */
export declare const taskMonitor: TaskMonitor;
