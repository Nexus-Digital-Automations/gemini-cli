/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { EventEmitter } from 'node:events';
import type {
  TaskPriority,
  TaskType,
} from '../../monitoring/TaskStatusMonitor.js';
import type { TaskQueue } from './TaskQueue.js';
/**
 * Performance metric collection and analysis
 */
export interface PerformanceMetrics {
  timestamp: Date;
  timeWindowMs: number;
  queueMetrics: {
    totalTasksQueued: number;
    averageQueueTime: number;
    maxQueueTime: number;
    queueSizeByPriority: Record<TaskPriority, number>;
    queueThroughput: number;
    queueEfficiency: number;
  };
  executionMetrics: {
    totalTasksExecuted: number;
    totalExecutionTime: number;
    averageExecutionTime: number;
    executionTimeByType: Record<TaskType, number>;
    successRate: number;
    failureRate: number;
    retryRate: number;
  };
  agentMetrics: {
    totalAgents: number;
    activeAgents: number;
    averageAgentLoad: number;
    agentUtilization: number;
    loadBalanceEfficiency: number;
    agentPerformanceVariance: number;
  };
  systemMetrics: {
    memoryUsage: {
      heapUsed: number;
      heapTotal: number;
      external: number;
      rss: number;
    };
    cpuUsage: number;
    latency: {
      p50: number;
      p95: number;
      p99: number;
    };
    errorRate: number;
    uptime: number;
  };
  bottlenecks: Array<{
    type: 'queue' | 'agent' | 'dependency' | 'resource' | 'system';
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    affectedTasks: number;
    estimatedImpact: string;
    suggestedActions: string[];
  }>;
}
/**
 * Optimization recommendation and action
 */
export interface OptimizationRecommendation {
  id: string;
  type: 'priority' | 'scheduling' | 'resource' | 'agent' | 'system';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  expectedImpact: {
    throughputIncrease?: number;
    latencyReduction?: number;
    resourceSavings?: number;
    efficiencyGain?: number;
  };
  implementation: {
    automatic: boolean;
    estimatedEffort: string;
    prerequisites: string[];
    actions: Array<{
      description: string;
      parameters?: Record<string, unknown>;
    }>;
  };
  validityPeriod: number;
  confidence: number;
}
/**
 * Optimization action result
 */
export interface OptimizationResult {
  recommendationId: string;
  applied: boolean;
  success: boolean;
  appliedAt: Date;
  measuredImpact?: {
    throughputChange: number;
    latencyChange: number;
    efficiencyChange: number;
  };
  sideEffects: string[];
  revertAction?: () => Promise<void>;
}
/**
 * Historical performance data for trend analysis
 */
interface PerformanceHistory {
  interval: 'minute' | 'hour' | 'day' | 'week';
  dataPoints: Array<{
    timestamp: Date;
    metrics: PerformanceMetrics;
  }>;
  trends: {
    throughput: 'increasing' | 'decreasing' | 'stable';
    latency: 'improving' | 'degrading' | 'stable';
    efficiency: 'improving' | 'degrading' | 'stable';
    errorRate: 'increasing' | 'decreasing' | 'stable';
  };
}
/**
 * Task Queue Performance Optimizer
 *
 * Features:
 * - Real-time performance monitoring and analysis
 * - Intelligent bottleneck detection and diagnosis
 * - Automated optimization recommendations
 * - Self-healing optimization actions
 * - Performance trend analysis and prediction
 * - Resource usage optimization
 * - Load balancing optimization
 * - Queue priority optimization
 * - System health monitoring
 */
export declare class PerformanceOptimizer extends EventEmitter {
  private readonly logger;
  private readonly taskQueue;
  private performanceHistory;
  private appliedOptimizations;
  private currentMetrics?;
  private monitoringInterval?;
  private optimizationInterval?;
  private readonly monitoringIntervalMs;
  private readonly optimizationIntervalMs;
  private readonly latencyBuffer;
  private readonly latencyBufferSize;
  private optimizationState;
  constructor(taskQueue: TaskQueue);
  /**
   * Start performance monitoring and optimization
   */
  startOptimization(): Promise<void>;
  /**
   * Stop performance monitoring and optimization
   */
  stopOptimization(): Promise<void>;
  /**
   * Get current performance metrics
   */
  getCurrentMetrics(): PerformanceMetrics | undefined;
  /**
   * Get performance history for specified time range
   */
  getPerformanceHistory(
    interval: 'minute' | 'hour' | 'day' | 'week',
    limit?: number,
  ): PerformanceHistory | undefined;
  /**
   * Get active optimization recommendations
   */
  getOptimizationRecommendations(): Promise<OptimizationRecommendation[]>;
  /**
   * Apply specific optimization recommendation
   */
  applyOptimization(recommendationId: string): Promise<OptimizationResult>;
  /**
   * Revert previously applied optimization
   */
  revertOptimization(recommendationId: string): Promise<boolean>;
  /**
   * Get optimization statistics and health
   */
  getOptimizationStats(): {
    enabled: boolean;
    totalRecommendations: number;
    appliedOptimizations: number;
    successfulOptimizations: number;
    successRate: number;
    lastOptimizationRun: Date;
    currentOptimizations: number;
    averageImpact: {
      throughputImprovement: number;
      latencyReduction: number;
      efficiencyGain: number;
    };
  };
  private setupMonitoring;
  private setupEventListeners;
  private collectMetrics;
  private runOptimizationCycle;
  private generateRecommendations;
  private generateQueueOptimizations;
  private generateAgentOptimizations;
  private generateSystemOptimizations;
  private generateResourceOptimizations;
  private executeOptimization;
  private executeSchedulingOptimization;
  private executeAgentOptimization;
  private executeSystemOptimization;
  private executeResourceOptimization;
  private measureOptimizationImpact;
  private calculateThroughput;
  private calculateQueueEfficiency;
  private calculateSuccessRate;
  private calculateFailureRate;
  private calculateAverageAgentLoad;
  private calculateAgentUtilization;
  private calculateLoadBalanceEfficiency;
  private calculateErrorRate;
  private calculateLatencyPercentiles;
  private recordLatency;
  private detectBottlenecks;
  private storeMetricsInHistory;
  private getMaxPointsForInterval;
  private updateTrends;
  private calculateAverageMetrics;
  private determineTrend;
  /**
   * Clean up resources and stop monitoring
   */
  destroy(): void;
}
/**
 * Factory function to create performance optimizer for a task queue
 */
export declare function createPerformanceOptimizer(
  taskQueue: TaskQueue,
): PerformanceOptimizer;
export {};
