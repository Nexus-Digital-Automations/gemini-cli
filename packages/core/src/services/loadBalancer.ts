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
import type { AutonomousTask, RegisteredAgent, TaskPriority } from './autonomousTaskIntegrator.js';
import type { AgentMetrics } from './agentCoordinator.js';
import type { AgentRegistry, AgentServiceInfo } from './agentRegistry.js';

// Load balancing types
export interface LoadBalancingStrategy {
  name: string;
  description: string;
  selectAgent: (availableAgents: AgentServiceInfo[], task: AutonomousTask, context: LoadBalancingContext) => AgentServiceInfo | null;
  weight?: number;
  config?: Record<string, unknown>;
}

export interface LoadBalancingContext {
  currentLoad: Map<string, number>;
  recentAssignments: Array<{ agentId: string; taskId: string; timestamp: Date }>;
  performanceHistory: Map<string, Array<{ timestamp: Date; successRate: number; responseTime: number }>>;
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
  alternatives: Array<{ agent: AgentServiceInfo; score: number }>;
  reasonCode: string;
  timestamp: Date;
}

export interface LoadBalancingEvent {
  type: 'task_assigned' | 'load_redistributed' | 'circuit_breaker_opened' | 'agent_overloaded' | 'scaling_recommendation';
  timestamp: Date;
  data: Record<string, unknown>;
}

/**
 * Advanced load balancer with multiple strategies and predictive capabilities
 */
export class LoadBalancer extends EventEmitter {
  private strategies: Map<string, LoadBalancingStrategy> = new Map();
  private currentStrategy: string = 'adaptive';
  private context: LoadBalancingContext;
  private agentRegistry: AgentRegistry;
  private circuitBreakerConfig = {
    failureThreshold: 5,
    timeoutMs: 60000,
    halfOpenMaxRequests: 3,
  };
  private balancingHistory: BalancingDecision[] = [];
  private performanceWindow = 300000; // 5 minutes
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(agentRegistry: AgentRegistry) {
    super();
    this.agentRegistry = agentRegistry;
    this.context = {
      currentLoad: new Map(),
      recentAssignments: [],
      performanceHistory: new Map(),
      circuitBreakerStates: new Map(),
    };

    this.initializeStrategies();
    this.startPeriodicCleanup();
  }

  /**
   * Select the optimal agent for a task using the current strategy
   */
  async selectAgent(task: AutonomousTask): Promise<BalancingDecision | null> {
    const availableAgents = await this.getAvailableAgents(task);
    if (availableAgents.length === 0) {
      return null;
    }

    const strategy = this.strategies.get(this.currentStrategy);
    if (!strategy) {
      throw new Error(`Unknown load balancing strategy: ${this.currentStrategy}`);
    }

    const selectedAgent = strategy.selectAgent(availableAgents, task, this.context);
    if (!selectedAgent) {
      return null;
    }

    // Calculate alternatives for comparison
    const alternatives = availableAgents
      .filter(agent => agent.agent.id !== selectedAgent.agent.id)
      .map(agent => ({
        agent,
        score: this.calculateAgentScore(agent, task),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    const decision: BalancingDecision = {
      selectedAgent,
      strategy: this.currentStrategy,
      confidence: this.calculateConfidence(selectedAgent, availableAgents, task),
      alternatives,
      reasonCode: this.generateReasonCode(selectedAgent, task, strategy),
      timestamp: new Date(),
    };

    // Record the assignment
    await this.recordAssignment(decision, task);

    // Store in history
    this.balancingHistory.push(decision);
    if (this.balancingHistory.length > 1000) {
      this.balancingHistory = this.balancingHistory.slice(-1000);
    }

    const event: LoadBalancingEvent = {
      type: 'task_assigned',
      timestamp: new Date(),
      data: {
        taskId: task.id,
        agentId: selectedAgent.agent.id,
        strategy: this.currentStrategy,
        confidence: decision.confidence,
      },
    };

    this.emit('task_assigned', event);

    console.log(`⚖️ Load balancer assigned task ${task.id} to agent ${selectedAgent.agent.id} (strategy: ${this.currentStrategy}, confidence: ${(decision.confidence * 100).toFixed(1)}%)`);

    return decision;
  }

  /**
   * Redistribute workload across agents
   */
  async redistributeLoad(): Promise<void> {
    const allAgents = this.agentRegistry.getAllAgents();
    const loadDistribution = this.analyzeLoadDistribution(allAgents);

    const overloadedAgents = loadDistribution.filter(dist => dist.recommendation === 'decrease');
    const underloadedAgents = loadDistribution.filter(dist => dist.recommendation === 'increase');

    if (overloadedAgents.length === 0 || underloadedAgents.length === 0) {
      return;
    }

    const redistributions: Array<{ from: string; to: string; taskCount: number }> = [];

    for (const overloaded of overloadedAgents) {
      const targetLoad = overloaded.capacity * 0.7; // Target 70% capacity
      const tasksToMove = Math.floor((overloaded.currentLoad - targetLoad) * 10); // Rough estimation

      for (const underloaded of underloadedAgents) {
        if (tasksToMove <= 0) break;

        const availableCapacity = underloaded.capacity - underloaded.currentLoad;
        const tasksToTransfer = Math.min(tasksToMove, Math.floor(availableCapacity * 5));

        if (tasksToTransfer > 0) {
          redistributions.push({
            from: overloaded.agentId,
            to: underloaded.agentId,
            taskCount: tasksToTransfer,
          });

          // Update predicted loads
          overloaded.predictedLoad -= tasksToTransfer / 10;
          underloaded.predictedLoad += tasksToTransfer / 10;
        }
      }
    }

    if (redistributions.length > 0) {
      const event: LoadBalancingEvent = {
        type: 'load_redistributed',
        timestamp: new Date(),
        data: { redistributions },
      };

      this.emit('load_redistributed', event);

      console.log(`🔄 Load redistribution: ${redistributions.length} redistributions planned`);
      for (const redist of redistributions) {
        console.log(`   ${redist.taskCount} tasks from ${redist.from} to ${redist.to}`);
      }
    }
  }

  /**
   * Update agent performance metrics
   */
  updateAgentPerformance(agentId: string, metrics: {
    success: boolean;
    responseTime: number;
    timestamp: Date;
  }): void {
    // Update circuit breaker state
    this.updateCircuitBreaker(agentId, metrics.success, metrics.timestamp);

    // Update performance history
    let history = this.context.performanceHistory.get(agentId);
    if (!history) {
      history = [];
      this.context.performanceHistory.set(agentId, history);
    }

    history.push({
      timestamp: metrics.timestamp,
      successRate: metrics.success ? 1 : 0,
      responseTime: metrics.responseTime,
    });

    // Keep only recent history
    const cutoff = new Date(Date.now() - this.performanceWindow);
    this.context.performanceHistory.set(
      agentId,
      history.filter(entry => entry.timestamp > cutoff)
    );
  }

  /**
   * Set the current load balancing strategy
   */
  setStrategy(strategyName: string): void {
    if (!this.strategies.has(strategyName)) {
      throw new Error(`Unknown strategy: ${strategyName}`);
    }

    this.currentStrategy = strategyName;
    console.log(`⚖️ Load balancing strategy changed to: ${strategyName}`);
  }

  /**
   * Get available strategies
   */
  getAvailableStrategies(): Array<{ name: string; description: string }> {
    return Array.from(this.strategies.values()).map(strategy => ({
      name: strategy.name,
      description: strategy.description,
    }));
  }

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
  } {
    const recentDecisions = this.balancingHistory.slice(-100);
    const averageConfidence = recentDecisions.length > 0
      ? recentDecisions.reduce((sum, decision) => sum + decision.confidence, 0) / recentDecisions.length
      : 0;

    const strategyDistribution: Record<string, number> = {};
    for (const decision of recentDecisions) {
      strategyDistribution[decision.strategy] = (strategyDistribution[decision.strategy] || 0) + 1;
    }

    const circuitBreakerStats = { open: 0, halfOpen: 0, closed: 0 };
    for (const state of this.context.circuitBreakerStates.values()) {
      circuitBreakerStats[state.state.replace('-', '') as 'open' | 'halfOpen' | 'closed']++;
    }

    // Calculate performance metrics
    let totalResponseTime = 0;
    let totalSuccessRate = 0;
    let totalEntries = 0;

    for (const history of this.context.performanceHistory.values()) {
      for (const entry of history) {
        totalResponseTime += entry.responseTime;
        totalSuccessRate += entry.successRate;
        totalEntries++;
      }
    }

    return {
      currentStrategy: this.currentStrategy,
      totalAssignments: this.balancingHistory.length,
      averageConfidence,
      strategyDistribution,
      circuitBreakerStats,
      performanceMetrics: {
        averageResponseTime: totalEntries > 0 ? totalResponseTime / totalEntries : 0,
        overallSuccessRate: totalEntries > 0 ? totalSuccessRate / totalEntries : 0,
      },
    };
  }

  /**
   * Shutdown the load balancer
   */
  async shutdown(): Promise<void> {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    this.strategies.clear();
    this.context.currentLoad.clear();
    this.context.recentAssignments = [];
    this.context.performanceHistory.clear();
    this.context.circuitBreakerStates.clear();
    this.balancingHistory = [];

    console.log('🛑 Load balancer shutdown');
  }

  // Private helper methods

  private initializeStrategies(): void {
    // Round-robin strategy
    this.strategies.set('round-robin', {
      name: 'round-robin',
      description: 'Distributes tasks evenly across all available agents',
      selectAgent: (agents, task, context) => {
        const sortedAgents = agents.sort((a, b) => a.agent.id.localeCompare(b.agent.id));
        const lastAssignments = context.recentAssignments.slice(-agents.length);

        for (const agent of sortedAgents) {
          const recentAssignment = lastAssignments.find(a => a.agentId === agent.agent.id);
          if (!recentAssignment) {
            return agent;
          }
        }

        return sortedAgents[0] || null;
      },
    });

    // Least-loaded strategy
    this.strategies.set('least-loaded', {
      name: 'least-loaded',
      description: 'Assigns tasks to the agent with the lowest current load',
      selectAgent: (agents, task, context) => agents.sort((a, b) => a.metrics.currentLoad - b.metrics.currentLoad)[0] || null,
    });

    // Performance-based strategy
    this.strategies.set('performance-based', {
      name: 'performance-based',
      description: 'Assigns tasks based on agent performance metrics',
      selectAgent: (agents, task, context) => {
        const scored = agents.map(agent => ({
          agent,
          score: this.calculatePerformanceScore(agent, task, context),
        }));

        scored.sort((a, b) => b.score - a.score);
        return scored[0]?.agent || null;
      },
    });

    // Adaptive strategy (hybrid approach)
    this.strategies.set('adaptive', {
      name: 'adaptive',
      description: 'Adapts strategy based on current conditions and task requirements',
      selectAgent: (agents, task, context) => {
        // Use different strategies based on conditions
        if (task.priority === 'critical') {
          return this.strategies.get('performance-based')!.selectAgent(agents, task, context);
        }

        const highLoadAgents = agents.filter(a => a.metrics.currentLoad > 0.8);
        if (highLoadAgents.length > agents.length * 0.5) {
          return this.strategies.get('least-loaded')!.selectAgent(agents, task, context);
        }

        return this.strategies.get('performance-based')!.selectAgent(agents, task, context);
      },
    });

    // Weighted strategy
    this.strategies.set('weighted', {
      name: 'weighted',
      description: 'Assigns tasks based on weighted scoring of multiple factors',
      selectAgent: (agents, task, context) => {
        const scored = agents.map(agent => ({
          agent,
          score: this.calculateWeightedScore(agent, task, context),
        }));

        scored.sort((a, b) => b.score - a.score);
        return scored[0]?.agent || null;
      },
    });
  }

  private async getAvailableAgents(task: AutonomousTask): Promise<AgentServiceInfo[]> {
    const query = {
      capabilities: task.requiredCapabilities.map(cap => ({
        capability: cap,
        required: true,
        priority: 1,
      })),
      maxLoad: 0.95,
      minSuccessRate: 0.3,
    };

    const discoveredAgents = await this.agentRegistry.discoverAgents(query);

    // Filter out agents with open circuit breakers
    return discoveredAgents.filter(agent => {
      const circuitState = this.context.circuitBreakerStates.get(agent.agent.id);
      return !circuitState || circuitState.state !== 'open' || this.shouldRetryAgent(circuitState);
    });
  }

  private calculateAgentScore(agent: AgentServiceInfo, task: AutonomousTask): number {
    let score = 0;

    // Performance factor (0-40 points)
    score += agent.metrics.successRate * 40;

    // Load factor (0-30 points, lower load is better)
    score += (1 - agent.metrics.currentLoad) * 30;

    // Response time factor (0-20 points)
    const maxResponseTime = 10000; // 10 seconds
    const responseScore = Math.max(0, (maxResponseTime - agent.metrics.averageExecutionTime) / maxResponseTime);
    score += responseScore * 20;

    // Capability match factor (0-10 points)
    const requiredCaps = task.requiredCapabilities.length;
    const matchedCaps = task.requiredCapabilities.filter(cap =>
      agent.agent.capabilities.includes(cap)
    ).length;

    if (requiredCaps > 0) {
      score += (matchedCaps / requiredCaps) * 10;
    } else {
      score += 10;
    }

    return score;
  }

  private calculatePerformanceScore(agent: AgentServiceInfo, task: AutonomousTask, context: LoadBalancingContext): number {
    const history = context.performanceHistory.get(agent.agent.id) || [];

    if (history.length === 0) {
      return agent.metrics.successRate * 100;
    }

    const recentEntries = history.slice(-10); // Last 10 entries
    const avgSuccessRate = recentEntries.reduce((sum, entry) => sum + entry.successRate, 0) / recentEntries.length;
    const avgResponseTime = recentEntries.reduce((sum, entry) => sum + entry.responseTime, 0) / recentEntries.length;

    let score = avgSuccessRate * 60;
    score += Math.max(0, (5000 - avgResponseTime) / 5000) * 30; // Bonus for fast response
    score += (1 - agent.metrics.currentLoad) * 10; // Load factor

    return score;
  }

  private calculateWeightedScore(agent: AgentServiceInfo, task: AutonomousTask, context: LoadBalancingContext): number {
    const weights = {
      performance: 0.4,
      load: 0.3,
      capability: 0.2,
      history: 0.1,
    };

    let score = 0;

    // Performance component
    score += agent.metrics.successRate * 100 * weights.performance;

    // Load component (inverted - lower load is better)
    score += (1 - agent.metrics.currentLoad) * 100 * weights.load;

    // Capability component
    const capabilityMatch = task.requiredCapabilities.length > 0
      ? task.requiredCapabilities.filter(cap => agent.agent.capabilities.includes(cap)).length / task.requiredCapabilities.length
      : 1;
    score += capabilityMatch * 100 * weights.capability;

    // Historical component
    const history = context.performanceHistory.get(agent.agent.id) || [];
    const historyScore = history.length > 0
      ? history.slice(-5).reduce((sum, entry) => sum + entry.successRate, 0) / Math.min(5, history.length)
      : 0.5;
    score += historyScore * 100 * weights.history;

    return score;
  }

  private calculateConfidence(selected: AgentServiceInfo, allAgents: AgentServiceInfo[], task: AutonomousTask): number {
    if (allAgents.length <= 1) {
      return 1.0;
    }

    const selectedScore = this.calculateAgentScore(selected, task);
    const scores = allAgents.map(agent => this.calculateAgentScore(agent, task));
    const maxScore = Math.max(...scores);
    const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;

    // Confidence based on how much better the selected agent is compared to average
    const confidence = maxScore > avgScore ? (selectedScore - avgScore) / (maxScore - avgScore) : 0.5;
    return Math.max(0.1, Math.min(1.0, confidence));
  }

  private generateReasonCode(agent: AgentServiceInfo, task: AutonomousTask, strategy: LoadBalancingStrategy): string {
    const reasons = [];

    if (agent.metrics.currentLoad < 0.3) {
      reasons.push('low-load');
    }

    if (agent.metrics.successRate > 0.9) {
      reasons.push('high-performance');
    }

    if (task.requiredCapabilities.every(cap => agent.agent.capabilities.includes(cap))) {
      reasons.push('capability-match');
    }

    if (agent.metrics.averageExecutionTime < 2000) {
      reasons.push('fast-response');
    }

    reasons.push(`strategy-${strategy.name}`);

    return reasons.join(',');
  }

  private async recordAssignment(decision: BalancingDecision, task: AutonomousTask): Promise<void> {
    const assignment = {
      agentId: decision.selectedAgent.agent.id,
      taskId: task.id,
      timestamp: new Date(),
    };

    this.context.recentAssignments.push(assignment);

    // Keep only recent assignments
    const cutoff = new Date(Date.now() - this.performanceWindow);
    this.context.recentAssignments = this.context.recentAssignments.filter(a => a.timestamp > cutoff);

    // Update current load
    const currentLoad = this.context.currentLoad.get(assignment.agentId) || 0;
    this.context.currentLoad.set(assignment.agentId, currentLoad + 1);
  }

  private updateCircuitBreaker(agentId: string, success: boolean, timestamp: Date): void {
    let state = this.context.circuitBreakerStates.get(agentId);
    if (!state) {
      state = {
        state: 'closed',
        failureCount: 0,
        successCount: 0,
      };
      this.context.circuitBreakerStates.set(agentId, state);
    }

    if (success) {
      state.successCount++;

      if (state.state === 'half-open' && state.successCount >= this.circuitBreakerConfig.halfOpenMaxRequests) {
        state.state = 'closed';
        state.failureCount = 0;
        state.successCount = 0;
        console.log(`🔄 Circuit breaker for agent ${agentId} closed (recovered)`);
      }
    } else {
      state.failureCount++;
      state.lastFailure = timestamp;
      state.successCount = 0;

      if (state.state === 'closed' && state.failureCount >= this.circuitBreakerConfig.failureThreshold) {
        state.state = 'open';
        state.nextRetry = new Date(timestamp.getTime() + this.circuitBreakerConfig.timeoutMs);

        const event: LoadBalancingEvent = {
          type: 'circuit_breaker_opened',
          timestamp,
          data: { agentId, failureCount: state.failureCount },
        };

        this.emit('circuit_breaker_opened', event);
        console.warn(`⚠️ Circuit breaker opened for agent ${agentId} (failures: ${state.failureCount})`);
      } else if (state.state === 'half-open') {
        state.state = 'open';
        state.nextRetry = new Date(timestamp.getTime() + this.circuitBreakerConfig.timeoutMs);
      }
    }

    this.context.circuitBreakerStates.set(agentId, state);
  }

  private shouldRetryAgent(circuitState: CircuitBreakerState): boolean {
    if (circuitState.state !== 'open' || !circuitState.nextRetry) {
      return true;
    }

    const now = new Date();
    if (now >= circuitState.nextRetry) {
      circuitState.state = 'half-open';
      circuitState.successCount = 0;
      return true;
    }

    return false;
  }

  private analyzeLoadDistribution(agents: AgentServiceInfo[]): LoadDistribution[] {
    return agents.map(agent => {
      const currentLoad = agent.metrics.currentLoad;
      const capacity = 1.0; // Normalized capacity
      const efficiency = agent.metrics.successRate;

      // Predict load based on recent trends
      const recentAssignments = this.context.recentAssignments.filter(a =>
        a.agentId === agent.agent.id &&
        a.timestamp > new Date(Date.now() - 60000) // Last minute
      );

      const predictedLoad = currentLoad + (recentAssignments.length * 0.1);

      let recommendation: LoadDistribution['recommendation'] = 'maintain';

      if (predictedLoad > 0.9) {
        recommendation = 'decrease';
      } else if (currentLoad < 0.3 && efficiency > 0.8) {
        recommendation = 'increase';
      } else if (currentLoad > 0.7 && efficiency < 0.6) {
        recommendation = 'redistribute';
      }

      return {
        agentId: agent.agent.id,
        currentLoad,
        predictedLoad,
        capacity,
        efficiency,
        recommendation,
      };
    });
  }

  private startPeriodicCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      this.performCleanup();
    }, 60000); // Every minute
  }

  private performCleanup(): void {
    const cutoff = new Date(Date.now() - this.performanceWindow);

    // Clean up recent assignments
    this.context.recentAssignments = this.context.recentAssignments.filter(a => a.timestamp > cutoff);

    // Clean up performance history
    for (const [agentId, history] of this.context.performanceHistory) {
      const filtered = history.filter(entry => entry.timestamp > cutoff);
      if (filtered.length === 0) {
        this.context.performanceHistory.delete(agentId);
      } else {
        this.context.performanceHistory.set(agentId, filtered);
      }
    }

    // Reset current load counters
    this.context.currentLoad.clear();
  }
}