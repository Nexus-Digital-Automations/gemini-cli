/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { EventEmitter } from 'node:events';
/**
 * Health check configuration
 */
export interface HealthCheckConfig {
  id: string;
  name: string;
  description: string;
  checkType:
    | 'system'
    | 'service'
    | 'resource'
    | 'performance'
    | 'data_integrity';
  interval: number;
  timeout: number;
  retryAttempts: number;
  thresholds: {
    healthy: number;
    warning: number;
    critical: number;
  };
  enabled: boolean;
  autoHeal: boolean;
  dependencies?: string[];
}
/**
 * Self-healing action configuration
 */
export interface SelfHealingAction {
  id: string;
  name: string;
  description: string;
  triggers: Array<{
    healthCheckId: string;
    condition: 'unhealthy' | 'degraded' | 'timeout' | 'failed';
    consecutiveFailures?: number;
  }>;
  actions: Array<{
    type:
      | 'restart_service'
      | 'clear_cache'
      | 'scale_resources'
      | 'redistribute_load'
      | 'notify_admin'
      | 'custom_script';
    config: Record<string, unknown>;
    timeout: number;
    retryable: boolean;
  }>;
  cooldown: number;
  maxExecutions: number;
  enabled: boolean;
  priority: 'low' | 'normal' | 'high' | 'critical';
}
/**
 * Health monitoring result
 */
export interface HealthMonitoringResult {
  checkId: string;
  name: string;
  status: 'healthy' | 'warning' | 'unhealthy' | 'unknown' | 'timeout';
  value: number;
  threshold: number;
  message: string;
  duration: number;
  timestamp: Date;
  metadata: Record<string, unknown>;
  trend: 'improving' | 'stable' | 'degrading' | 'unknown';
  severity: 'info' | 'warning' | 'error' | 'critical';
}
/**
 * Self-healing execution result
 */
export interface SelfHealingExecutionResult {
  actionId: string;
  executionId: string;
  status: 'success' | 'failure' | 'timeout' | 'skipped';
  startTime: Date;
  endTime: Date;
  duration: number;
  triggeredBy: string[];
  actionsExecuted: Array<{
    type: string;
    status: 'success' | 'failure' | 'timeout';
    message: string;
    duration: number;
  }>;
  message: string;
  metadata: Record<string, unknown>;
}
/**
 * System health summary
 */
export interface SystemHealthSummary {
  overall: 'healthy' | 'warning' | 'unhealthy' | 'critical';
  score: number;
  timestamp: Date;
  checks: {
    total: number;
    healthy: number;
    warning: number;
    unhealthy: number;
    timeout: number;
    unknown: number;
  };
  categories: Record<
    string,
    {
      status: 'healthy' | 'warning' | 'unhealthy';
      count: number;
      issues: string[];
    }
  >;
  trends: {
    shortTerm: 'improving' | 'stable' | 'degrading';
    mediumTerm: 'improving' | 'stable' | 'degrading';
    longTerm: 'improving' | 'stable' | 'degrading';
  };
  autoHealingActions: {
    executed: number;
    successful: number;
    failed: number;
    lastExecution?: Date;
  };
  recommendations: Array<{
    type: 'immediate' | 'scheduled' | 'preventive';
    priority: 'low' | 'normal' | 'high' | 'critical';
    title: string;
    description: string;
    actions: string[];
  }>;
}
/**
 * Automated Health Monitoring and Self-Healing System
 *
 * Comprehensive health monitoring with intelligent self-healing capabilities:
 * - Continuous health monitoring across all system components
 * - Automated issue detection with intelligent thresholds
 * - Predictive health analytics and trend analysis
 * - Self-healing actions with configurable triggers and cooldowns
 * - Health dependency tracking and cascade failure prevention
 * - Performance-based health assessment
 * - Resource utilization monitoring and optimization
 * - Automated recovery procedures with fallback strategies
 * - Health monitoring metrics and analytics
 * - Integration with alerting and notification systems
 */
export declare class AutomatedHealthMonitoring extends EventEmitter {
  private readonly logger;
  private healthChecks;
  private selfHealingActions;
  private healthCheckResults;
  private healthCheckIntervals;
  private actionExecutionHistory;
  private actionCooldowns;
  private systemHealthHistory;
  private currentSystemHealth;
  private healthTrendWindow;
  private readonly config;
  private readonly persistencePath;
  private readonly executionHistoryPath;
  constructor(config?: Partial<AutomatedHealthMonitoring['config']>);
  /**
   * Initialize health monitoring system
   */
  private initializeHealthMonitoring;
  /**
   * Add custom health check
   */
  addHealthCheck(config: HealthCheckConfig): void;
  /**
   * Add self-healing action
   */
  addSelfHealingAction(action: SelfHealingAction): void;
  /**
   * Get current system health summary
   */
  getCurrentSystemHealth(): SystemHealthSummary;
  /**
   * Get health check results
   */
  getHealthCheckResults(checkId?: string): HealthMonitoringResult[];
  /**
   * Get self-healing execution history
   */
  getSelfHealingHistory(actionId?: string): SelfHealingExecutionResult[];
  /**
   * Force health check execution
   */
  executeHealthCheck(checkId: string): Promise<HealthMonitoringResult>;
  /**
   * Force self-healing action execution
   */
  executeSelfHealingAction(
    actionId: string,
    reason?: string,
  ): Promise<SelfHealingExecutionResult>;
  /**
   * Get health monitoring statistics
   */
  getHealthMonitoringStats(): {
    healthChecks: {
      total: number;
      active: number;
      passing: number;
      failing: number;
      avgExecutionTime: number;
    };
    selfHealing: {
      total: number;
      enabled: number;
      executionsLast24h: number;
      successRate: number;
      avgExecutionTime: number;
    };
    systemHealth: {
      currentScore: number;
      trend: string;
      criticalIssues: number;
      recommendations: number;
    };
  };
  private setupDefaultHealthChecks;
  private setupDefaultSelfHealingActions;
  private startHealthCheck;
  private performHealthCheck;
  private executeHealthCheckLogic;
  private checkResourceHealth;
  private checkPerformanceHealth;
  private checkServiceHealth;
  private checkSystemHealth;
  private checkDataIntegrity;
  private calculateHealthTrend;
  private checkSelfHealingTriggers;
  private shouldTriggerAction;
  private executeAction;
  private executeSingleAction;
  private executeClearCache;
  private executeRestartService;
  private executeRedistributeLoad;
  private executeScaleResources;
  private executeNotifyAdmin;
  private executeCustomScript;
  private generateSystemHealthSummary;
  private calculateSystemTrends;
  private generateHealthRecommendations;
  private startGlobalHealthMonitoring;
  private setupSystemEventListeners;
  private loadPersistedState;
  private persistState;
  /**
   * Graceful shutdown
   */
  shutdown(): Promise<void>;
}
/**
 * Singleton instance for global access
 */
export declare const automatedHealthMonitoring: AutomatedHealthMonitoring;
