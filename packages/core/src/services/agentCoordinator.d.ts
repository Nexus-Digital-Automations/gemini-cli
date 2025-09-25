/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Multi-Agent Coordination and Workload Balancing System
 *
 * This system provides intelligent agent management and task assignment capabilities:
 * - Agent capability matching and dynamic task assignment
 * - Real-time load balancing and resource optimization
 * - Agent performance monitoring and automatic recovery
 * - Inter-agent communication and synchronization protocols
 * - Health monitoring and failover mechanisms
 */
import { EventEmitter } from 'node:events';
import type { Config } from '../index.js';
import type { AutonomousTask, RegisteredAgent, AgentCapability } from './autonomousTaskIntegrator.js';
export interface AgentMetrics {
    id: string;
    totalTasksCompleted: number;
    totalTasksFailed: number;
    averageExecutionTime: number;
    successRate: number;
    currentLoad: number;
    lastActiveTime: Date;
    uptime: number;
    errorCount: number;
    recoveryCount: number;
}
export interface TaskAssignmentScore {
    agentId: string;
    score: number;
    reasons: string[];
    loadFactor: number;
    capabilityMatch: number;
    performanceScore: number;
}
export interface CoordinationEvent {
    type: 'agent_assigned' | 'load_balanced' | 'agent_recovered' | 'performance_alert' | 'coordination_update';
    timestamp: Date;
    agentId?: string;
    taskId?: string;
    data: Record<string, unknown>;
}
export interface LoadBalanceStrategy {
    name: string;
    weight: number;
    calculate: (agent: RegisteredAgent, task: AutonomousTask) => number;
}
/**
 * Core multi-agent coordination system
 */
export declare class AgentCoordinator extends EventEmitter {
    private agents;
    private agentMetrics;
    private taskAssignments;
    private communicationChannels;
    private loadBalanceStrategies;
    private performanceThresholds;
    private config;
    private healthCheckInterval;
    constructor(config: Config);
    /**
     * Register an agent with the coordination system
     */
    registerAgent(agent: RegisteredAgent): Promise<void>;
    /**
     * Unregister an agent from the coordination system
     */
    unregisterAgent(agentId: string): Promise<void>;
    /**
     * Find the optimal agent for a task using intelligent assignment algorithms
     */
    findOptimalAgent(task: AutonomousTask): Promise<RegisteredAgent | null>;
    /**
     * Assign a task to an agent and update coordination state
     */
    assignTaskToAgent(task: AutonomousTask, agent: RegisteredAgent): Promise<void>;
    /**
     * Complete a task and update agent metrics
     */
    completeTask(taskId: string, success: boolean, executionTime: number): Promise<void>;
    /**
     * Rebalance workload across agents
     */
    rebalanceWorkload(): Promise<void>;
    /**
     * Get comprehensive system status
     */
    getCoordinationStatus(): {
        agents: Array<{
            id: string;
            status: string;
            capabilities: AgentCapability[];
            currentLoad: number;
            metrics: AgentMetrics;
        }>;
        tasks: {
            total: number;
            assigned: number;
        };
        performance: {
            averageLoad: number;
            healthyAgents: number;
            totalAgents: number;
        };
    };
    /**
     * Establish communication channel between agents
     */
    establishCommunication(agentId1: string, agentId2: string): Promise<void>;
    /**
     * Send message between agents
     */
    sendAgentMessage(fromAgent: string, toAgent: string, message: any): Promise<boolean>;
    /**
     * Shutdown coordination system
     */
    shutdown(): Promise<void>;
    private initializeLoadBalanceStrategies;
    private calculateAssignmentScore;
    private hasRequiredCapabilities;
    private calculateCapabilityMatch;
    private getPriorityBonus;
    private startHealthMonitoring;
    private performHealthCheck;
    private handleAgentFailure;
    private reassignAgentTasks;
    private moveTask;
    private checkAgentPerformance;
    private createDefaultMetrics;
}
