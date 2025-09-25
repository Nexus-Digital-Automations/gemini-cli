/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Load Balancer for Intelligent Workload Distribution
 *
 * This system provides:
 * - Multiple load balancing strategies (round-robin, least-loaded, performance-based)
 * - Dynamic workload redistribution based on agent performance
 * - Predictive load balancing using historical data
 * - Circuit breaker patterns for failing agents
 * - Auto-scaling recommendations and capacity planning
 */
import { EventEmitter } from 'node:events';
import type { AutonomousTask } from './autonomousTaskIntegrator.js';
import type { AgentRegistry, AgentServiceInfo } from './agentRegistry.js';
export interface LoadBalancingStrategy {
  name: string;
  description: string;
  selectAgent: (
    availableAgents: AgentServiceInfo[],
    task: AutonomousTask,
    context: LoadBalancingContext,
  ) => AgentServiceInfo | null;
  weight?: number;
  config?: Record<string, unknown>;
}
export interface LoadBalancingContext {
  currentLoad: Map<string, number>;
  recentAssignments: Array<{
    agentId: string;
    taskId: string;
    timestamp: Date;
  }>;
  performanceHistory: Map<
    string,
    Array<{
      timestamp: Date;
      successRate: number;
      responseTime: number;
    }>
  >;
  circuitBreakerStates: Map<string, CircuitBreakerState>;
}
export interface CircuitBreakerState {
  state: 'closed' | 'open' | 'half-open';
  failureCount: number;
  lastFailure?: Date;
  nextRetry?: Date;
  successCount: number;
}
export interface LoadDistribution {
  agentId: string;
  currentLoad: number;
  predictedLoad: number;
  capacity: number;
  efficiency: number;
  recommendation: 'maintain' | 'increase' | 'decrease' | 'redistribute';
}
export interface BalancingDecision {
  selectedAgent: AgentServiceInfo;
  strategy: string;
  confidence: number;
  alternatives: Array<{
    agent: AgentServiceInfo;
    score: number;
  }>;
  reasonCode: string;
  timestamp: Date;
}
export interface LoadBalancingEvent {
  type:
    | 'task_assigned'
    | 'load_redistributed'
    | 'circuit_breaker_opened'
    | 'agent_overloaded'
    | 'scaling_recommendation';
  timestamp: Date;
  data: Record<string, unknown>;
}
/**
 * Advanced load balancer with multiple strategies and predictive capabilities
 */
export declare class LoadBalancer extends EventEmitter {
  private strategies;
  private currentStrategy;
  private context;
  private agentRegistry;
  private circuitBreakerConfig;
  private balancingHistory;
  private performanceWindow;
  private cleanupInterval;
  constructor(agentRegistry: AgentRegistry);
  /**
   * Select the optimal agent for a task using the current strategy
   */
  selectAgent(task: AutonomousTask): Promise<BalancingDecision | null>;
  /**
   * Redistribute workload across agents
   */
  redistributeLoad(): Promise<void>;
  /**
   * Update agent performance metrics
   */
  updateAgentPerformance(
    agentId: string,
    metrics: {
      success: boolean;
      responseTime: number;
      timestamp: Date;
    },
  ): void;
  /**
   * Set the current load balancing strategy
   */
  setStrategy(strategyName: string): void;
  /**
   * Get available strategies
   */
  getAvailableStrategies(): Array<{
    name: string;
    description: string;
  }>;
  /**
   * Get current load balancing statistics
   */
  getLoadBalancingStats(): {
    currentStrategy: string;
    totalAssignments: number;
    averageConfidence: number;
    strategyDistribution: Record<string, number>;
    circuitBreakerStats: {
      open: number;
      halfOpen: number;
      closed: number;
    };
    performanceMetrics: {
      averageResponseTime: number;
      overallSuccessRate: number;
    };
  };
  /**
   * Shutdown the load balancer
   */
  shutdown(): Promise<void>;
  private initializeStrategies;
  private getAvailableAgents;
  private calculateAgentScore;
  private calculatePerformanceScore;
  private calculateWeightedScore;
  private calculateConfidence;
  private generateReasonCode;
  private recordAssignment;
  private updateCircuitBreaker;
  private shouldRetryAgent;
  private analyzeLoadDistribution;
  private startPeriodicCleanup;
  private performCleanup;
}
