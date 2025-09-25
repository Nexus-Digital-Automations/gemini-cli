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
import type { AgentRegistry } from './agentRegistry.js';
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
  dataPoints: Array<{
    timestamp: Date;
    value: number;
  }>;
  prediction?: {
    nextValue: number;
    timeToThreshold?: number;
    confidence: number;
  };
}
export interface SLAMetrics {
  agentId: string;
  availability: number;
  responseTime: {
    average: number;
    p50: number;
    p95: number;
    p99: number;
  };
  errorRate: number;
  throughput: number;
  period: {
    start: Date;
    end: Date;
  };
}
export type HealthStatus =
  | 'healthy'
  | 'degraded'
  | 'unhealthy'
  | 'offline'
  | 'unknown';
export interface HealthEvent {
  type:
    | 'status_changed'
    | 'issue_detected'
    | 'recovery_started'
    | 'recovery_completed'
    | 'sla_violation'
    | 'trend_detected';
  timestamp: Date;
  agentId?: string;
  data: Record<string, unknown>;
}
/**
 * Comprehensive health monitoring and recovery system
 */
export declare class HealthMonitor extends EventEmitter {
  private agentRegistry;
  private healthChecks;
  private currentStatus;
  private healthThresholds;
  private recoveryActions;
  private healthTrends;
  private slaMetrics;
  private monitoringConfig;
  private monitoringInterval;
  private cleanupInterval;
  constructor(agentRegistry: AgentRegistry);
  /**
   * Perform health check on an agent
   */
  performHealthCheck(agentId: string): Promise<HealthCheck>;
  /**
   * Perform health checks on all registered agents
   */
  performHealthCheckAll(): Promise<HealthCheck[]>;
  /**
   * Get current health status for an agent
   */
  getAgentHealthStatus(agentId: string): HealthStatus;
  /**
   * Get recent health checks for an agent
   */
  getAgentHealthHistory(agentId: string, limit?: number): HealthCheck[];
  /**
   * Get health trends for an agent
   */
  getAgentHealthTrends(agentId: string): HealthTrend[];
  /**
   * Trigger recovery action for an agent
   */
  triggerRecovery(
    agentId: string,
    trigger: HealthIssue,
    actionType?: RecoveryAction['type'],
  ): Promise<RecoveryAction>;
  /**
   * Get SLA metrics for an agent
   */
  getSLAMetrics(agentId: string): SLAMetrics | null;
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
  };
  /**
   * Configure health monitoring thresholds
   */
  setHealthThresholds(thresholds: HealthThreshold[]): void;
  /**
   * Configure monitoring settings
   */
  setMonitoringConfig(config: Partial<typeof this.monitoringConfig>): void;
  /**
   * Shutdown health monitoring system
   */
  shutdown(): Promise<void>;
  private recordHealthCheck;
  private executeRecoveryAction;
  private executeRestart;
  private executeFailover;
  private executeScale;
  private executeThrottle;
  private executeAlert;
  private shouldAutoRecover;
  private updateHealthTrends;
  private analyzeTrend;
  private updateSLAMetrics;
  private initializeHealthThresholds;
  private startHealthMonitoring;
  private startPeriodicCleanup;
  private performCleanup;
  private generateHealthCheckId;
  private generateRecoveryActionId;
}
