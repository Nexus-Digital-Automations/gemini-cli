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
/**
 * Core multi-agent coordination system
 */
export class AgentCoordinator extends EventEmitter {
    agents = new Map();
    agentMetrics = new Map();
    taskAssignments = new Map(); // taskId -> agentId
    communicationChannels = new Map(); // agentId -> connected agents
    loadBalanceStrategies = [];
    performanceThresholds = {
        maxErrorRate: 0.15,
        minSuccessRate: 0.75,
        maxResponseTime: 30000, // 30 seconds
        maxLoad: 0.85,
    };
    config;
    healthCheckInterval = null;
    constructor(config) {
        super();
        this.config = config;
        this.initializeLoadBalanceStrategies();
        this.startHealthMonitoring();
    }
    /**
     * Register an agent with the coordination system
     */
    async registerAgent(agent) {
        this.agents.set(agent.id, agent);
        // Initialize metrics for the agent
        const metrics = {
            id: agent.id,
            totalTasksCompleted: agent.performance.completedTasks,
            totalTasksFailed: 0,
            averageExecutionTime: agent.performance.averageCompletionTime,
            successRate: agent.performance.successRate,
            currentLoad: agent.currentTasks.length / agent.maxConcurrentTasks,
            lastActiveTime: agent.lastHeartbeat,
            uptime: 0,
            errorCount: 0,
            recoveryCount: 0,
        };
        this.agentMetrics.set(agent.id, metrics);
        this.communicationChannels.set(agent.id, new Set());
        const event = {
            type: 'coordination_update',
            timestamp: new Date(),
            agentId: agent.id,
            data: {
                action: 'agent_registered',
                capabilities: agent.capabilities,
                maxConcurrentTasks: agent.maxConcurrentTasks
            },
        };
        this.emit('agent_registered', event);
        console.log(`🤖 Agent ${agent.id} registered with coordination system`);
    }
    /**
     * Unregister an agent from the coordination system
     */
    async unregisterAgent(agentId) {
        const agent = this.agents.get(agentId);
        if (!agent)
            return;
        // Reassign any active tasks
        await this.reassignAgentTasks(agentId);
        this.agents.delete(agentId);
        this.agentMetrics.delete(agentId);
        this.communicationChannels.delete(agentId);
        // Remove from other agents' communication channels
        for (const [_, channels] of this.communicationChannels) {
            channels.delete(agentId);
        }
        const event = {
            type: 'coordination_update',
            timestamp: new Date(),
            agentId,
            data: { action: 'agent_unregistered' },
        };
        this.emit('agent_unregistered', event);
        console.log(`🔄 Agent ${agentId} unregistered from coordination system`);
    }
    /**
     * Find the optimal agent for a task using intelligent assignment algorithms
     */
    async findOptimalAgent(task) {
        const availableAgents = Array.from(this.agents.values()).filter(agent => {
            const metrics = this.agentMetrics.get(agent.id);
            return (agent.status !== 'offline' &&
                agent.currentTasks.length < agent.maxConcurrentTasks &&
                this.hasRequiredCapabilities(agent, task.requiredCapabilities) &&
                (!metrics || metrics.currentLoad < this.performanceThresholds.maxLoad));
        });
        if (availableAgents.length === 0) {
            return null;
        }
        // Calculate assignment scores for each available agent
        const scoredAgents = await Promise.all(availableAgents.map(agent => this.calculateAssignmentScore(agent, task)));
        // Sort by score and return the best match
        scoredAgents.sort((a, b) => b.score - a.score);
        const bestAssignment = scoredAgents[0];
        if (bestAssignment) {
            console.log(`🎯 Optimal agent ${bestAssignment.agentId} selected for task ${task.id} (score: ${bestAssignment.score.toFixed(2)})`);
            console.log(`   Reasons: ${bestAssignment.reasons.join(', ')}`);
            return this.agents.get(bestAssignment.agentId) || null;
        }
        return null;
    }
    /**
     * Assign a task to an agent and update coordination state
     */
    async assignTaskToAgent(task, agent) {
        // Update agent state
        agent.currentTasks.push(task.id);
        agent.status = agent.currentTasks.length >= agent.maxConcurrentTasks ? 'busy' : 'active';
        agent.lastHeartbeat = new Date();
        // Update task assignment
        this.taskAssignments.set(task.id, agent.id);
        this.agents.set(agent.id, agent);
        // Update metrics
        const metrics = this.agentMetrics.get(agent.id);
        if (metrics) {
            metrics.currentLoad = agent.currentTasks.length / agent.maxConcurrentTasks;
            metrics.lastActiveTime = new Date();
            this.agentMetrics.set(agent.id, metrics);
        }
        const event = {
            type: 'agent_assigned',
            timestamp: new Date(),
            agentId: agent.id,
            taskId: task.id,
            data: {
                taskType: task.type,
                priority: task.priority,
                capabilities: task.requiredCapabilities,
                currentLoad: metrics?.currentLoad || 0,
            },
        };
        this.emit('task_assigned', event);
        console.log(`✅ Task ${task.id} assigned to agent ${agent.id}`);
    }
    /**
     * Complete a task and update agent metrics
     */
    async completeTask(taskId, success, executionTime) {
        const agentId = this.taskAssignments.get(taskId);
        if (!agentId)
            return;
        const agent = this.agents.get(agentId);
        const metrics = this.agentMetrics.get(agentId);
        if (agent && metrics) {
            // Update agent state
            agent.currentTasks = agent.currentTasks.filter(id => id !== taskId);
            agent.status = agent.currentTasks.length === 0 ? 'idle' : 'active';
            // Update metrics
            if (success) {
                metrics.totalTasksCompleted++;
                metrics.averageExecutionTime = (metrics.averageExecutionTime + executionTime) / 2;
            }
            else {
                metrics.totalTasksFailed++;
                metrics.errorCount++;
            }
            const totalTasks = metrics.totalTasksCompleted + metrics.totalTasksFailed;
            metrics.successRate = totalTasks > 0 ? metrics.totalTasksCompleted / totalTasks : 1.0;
            metrics.currentLoad = agent.currentTasks.length / agent.maxConcurrentTasks;
            metrics.lastActiveTime = new Date();
            this.agents.set(agentId, agent);
            this.agentMetrics.set(agentId, metrics);
            // Check for performance issues
            await this.checkAgentPerformance(agentId);
        }
        this.taskAssignments.delete(taskId);
        console.log(`🏁 Task ${taskId} completed by agent ${agentId} (success: ${success})`);
    }
    /**
     * Rebalance workload across agents
     */
    async rebalanceWorkload() {
        const activeAgents = Array.from(this.agents.values()).filter(agent => agent.status !== 'offline');
        if (activeAgents.length < 2)
            return;
        // Find overloaded and underloaded agents
        const overloadedAgents = activeAgents.filter(agent => {
            const metrics = this.agentMetrics.get(agent.id);
            return metrics && metrics.currentLoad > this.performanceThresholds.maxLoad;
        });
        const underloadedAgents = activeAgents.filter(agent => {
            const metrics = this.agentMetrics.get(agent.id);
            return metrics && metrics.currentLoad < 0.5; // Less than 50% loaded
        });
        if (overloadedAgents.length === 0 || underloadedAgents.length === 0)
            return;
        // Attempt to rebalance by moving tasks
        for (const overloadedAgent of overloadedAgents) {
            const tasksToMove = Math.floor(overloadedAgent.currentTasks.length * 0.2); // Move 20% of tasks
            if (tasksToMove === 0)
                continue;
            for (let i = 0; i < tasksToMove && i < overloadedAgent.currentTasks.length; i++) {
                const taskId = overloadedAgent.currentTasks[i];
                const targetAgent = underloadedAgents.find(agent => agent.currentTasks.length < agent.maxConcurrentTasks);
                if (targetAgent) {
                    await this.moveTask(taskId, overloadedAgent.id, targetAgent.id);
                    const event = {
                        type: 'load_balanced',
                        timestamp: new Date(),
                        taskId,
                        data: {
                            fromAgent: overloadedAgent.id,
                            toAgent: targetAgent.id,
                            reason: 'load_balancing',
                        },
                    };
                    this.emit('load_balanced', event);
                }
            }
        }
        console.log(`⚖️ Load balancing completed - moved tasks between agents`);
    }
    /**
     * Get comprehensive system status
     */
    getCoordinationStatus() {
        const agents = Array.from(this.agents.values()).map(agent => {
            const metrics = this.agentMetrics.get(agent.id) || this.createDefaultMetrics(agent.id);
            return {
                id: agent.id,
                status: agent.status,
                capabilities: agent.capabilities,
                currentLoad: metrics.currentLoad,
                metrics,
            };
        });
        const totalLoad = agents.reduce((sum, agent) => sum + agent.currentLoad, 0);
        const averageLoad = agents.length > 0 ? totalLoad / agents.length : 0;
        const healthyAgents = agents.filter(agent => agent.metrics.successRate >= this.performanceThresholds.minSuccessRate &&
            agent.currentLoad <= this.performanceThresholds.maxLoad).length;
        return {
            agents,
            tasks: {
                total: this.taskAssignments.size,
                assigned: this.taskAssignments.size,
            },
            performance: {
                averageLoad,
                healthyAgents,
                totalAgents: agents.length,
            },
        };
    }
    /**
     * Establish communication channel between agents
     */
    async establishCommunication(agentId1, agentId2) {
        const channel1 = this.communicationChannels.get(agentId1);
        const channel2 = this.communicationChannels.get(agentId2);
        if (channel1 && channel2) {
            channel1.add(agentId2);
            channel2.add(agentId1);
            console.log(`🔗 Communication established between agents ${agentId1} and ${agentId2}`);
        }
    }
    /**
     * Send message between agents
     */
    async sendAgentMessage(fromAgent, toAgent, message) {
        const channel = this.communicationChannels.get(fromAgent);
        if (!channel || !channel.has(toAgent)) {
            return false;
        }
        // Emit event for message routing
        this.emit('agent_message', {
            from: fromAgent,
            to: toAgent,
            message,
            timestamp: new Date(),
        });
        return true;
    }
    /**
     * Shutdown coordination system
     */
    async shutdown() {
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
            this.healthCheckInterval = null;
        }
        this.agents.clear();
        this.agentMetrics.clear();
        this.taskAssignments.clear();
        this.communicationChannels.clear();
        console.log('🛑 Agent coordination system shutdown');
    }
    // Private helper methods
    initializeLoadBalanceStrategies() {
        this.loadBalanceStrategies = [
            {
                name: 'performance',
                weight: 0.4,
                calculate: (agent, task) => agent.performance.successRate * 100,
            },
            {
                name: 'load',
                weight: 0.3,
                calculate: (agent, task) => {
                    const loadFactor = 1 - (agent.currentTasks.length / agent.maxConcurrentTasks);
                    return loadFactor * 100;
                },
            },
            {
                name: 'capability_match',
                weight: 0.2,
                calculate: (agent, task) => {
                    const matchScore = this.calculateCapabilityMatch(agent.capabilities, task.requiredCapabilities);
                    return matchScore * 100;
                },
            },
            {
                name: 'response_time',
                weight: 0.1,
                calculate: (agent, task) => {
                    const maxTime = 10000; // 10 seconds
                    const responseScore = Math.max(0, (maxTime - agent.performance.averageCompletionTime) / maxTime);
                    return responseScore * 100;
                },
            },
        ];
    }
    async calculateAssignmentScore(agent, task) {
        let totalScore = 0;
        const reasons = [];
        // Apply load balance strategies
        for (const strategy of this.loadBalanceStrategies) {
            const strategyScore = strategy.calculate(agent, task);
            totalScore += strategyScore * strategy.weight;
            reasons.push(`${strategy.name}: ${strategyScore.toFixed(1)}`);
        }
        // Priority bonus
        const priorityBonus = this.getPriorityBonus(task.priority);
        totalScore += priorityBonus;
        if (priorityBonus > 0) {
            reasons.push(`priority bonus: ${priorityBonus}`);
        }
        const metrics = this.agentMetrics.get(agent.id);
        return {
            agentId: agent.id,
            score: totalScore,
            reasons,
            loadFactor: agent.currentTasks.length / agent.maxConcurrentTasks,
            capabilityMatch: this.calculateCapabilityMatch(agent.capabilities, task.requiredCapabilities),
            performanceScore: agent.performance.successRate,
        };
    }
    hasRequiredCapabilities(agent, required) {
        if (required.length === 0)
            return true;
        return required.every(capability => agent.capabilities.includes(capability));
    }
    calculateCapabilityMatch(agentCaps, taskCaps) {
        if (taskCaps.length === 0)
            return 1.0;
        const matches = taskCaps.filter(cap => agentCaps.includes(cap)).length;
        return matches / taskCaps.length;
    }
    getPriorityBonus(priority) {
        const bonuses = { critical: 20, high: 10, normal: 0, low: -5 };
        return bonuses[priority] || 0;
    }
    startHealthMonitoring() {
        this.healthCheckInterval = setInterval(async () => {
            await this.performHealthCheck();
        }, 30000); // Every 30 seconds
    }
    async performHealthCheck() {
        const now = new Date();
        for (const [agentId, agent] of this.agents) {
            const timeSinceHeartbeat = now.getTime() - agent.lastHeartbeat.getTime();
            const metrics = this.agentMetrics.get(agentId);
            if (timeSinceHeartbeat > 60000 && agent.status !== 'offline') {
                // Agent hasn't responded for 1 minute
                agent.status = 'offline';
                this.agents.set(agentId, agent);
                if (metrics) {
                    metrics.errorCount++;
                }
                await this.handleAgentFailure(agentId);
            }
            else if (metrics) {
                // Update uptime
                metrics.uptime = now.getTime() - agent.lastHeartbeat.getTime();
                this.agentMetrics.set(agentId, metrics);
            }
        }
    }
    async handleAgentFailure(agentId) {
        console.warn(`⚠️ Agent ${agentId} detected as offline - initiating recovery`);
        // Reassign tasks from failed agent
        await this.reassignAgentTasks(agentId);
        const event = {
            type: 'agent_recovered',
            timestamp: new Date(),
            agentId,
            data: { reason: 'health_check_failure' },
        };
        this.emit('agent_failure', event);
    }
    async reassignAgentTasks(agentId) {
        const agent = this.agents.get(agentId);
        if (!agent || agent.currentTasks.length === 0)
            return;
        const tasksToReassign = [...agent.currentTasks];
        for (const taskId of tasksToReassign) {
            // Remove task from failed agent
            agent.currentTasks = agent.currentTasks.filter(id => id !== taskId);
            // Find alternative agent (simplified - would integrate with task system)
            const availableAgents = Array.from(this.agents.values()).filter(a => a.id !== agentId &&
                a.status !== 'offline' &&
                a.currentTasks.length < a.maxConcurrentTasks);
            if (availableAgents.length > 0) {
                const targetAgent = availableAgents[0];
                await this.moveTask(taskId, agentId, targetAgent.id);
            }
        }
        agent.status = agent.currentTasks.length === 0 ? 'idle' : 'active';
        this.agents.set(agentId, agent);
    }
    async moveTask(taskId, fromAgentId, toAgentId) {
        const fromAgent = this.agents.get(fromAgentId);
        const toAgent = this.agents.get(toAgentId);
        if (!fromAgent || !toAgent)
            return;
        // Update agents
        fromAgent.currentTasks = fromAgent.currentTasks.filter(id => id !== taskId);
        toAgent.currentTasks.push(taskId);
        // Update assignment
        this.taskAssignments.set(taskId, toAgentId);
        // Update agent states
        fromAgent.status = fromAgent.currentTasks.length === 0 ? 'idle' : 'active';
        toAgent.status = toAgent.currentTasks.length >= toAgent.maxConcurrentTasks ? 'busy' : 'active';
        this.agents.set(fromAgentId, fromAgent);
        this.agents.set(toAgentId, toAgent);
        // Update metrics
        const fromMetrics = this.agentMetrics.get(fromAgentId);
        const toMetrics = this.agentMetrics.get(toAgentId);
        if (fromMetrics) {
            fromMetrics.currentLoad = fromAgent.currentTasks.length / fromAgent.maxConcurrentTasks;
            this.agentMetrics.set(fromAgentId, fromMetrics);
        }
        if (toMetrics) {
            toMetrics.currentLoad = toAgent.currentTasks.length / toAgent.maxConcurrentTasks;
            this.agentMetrics.set(toAgentId, toMetrics);
        }
    }
    async checkAgentPerformance(agentId) {
        const metrics = this.agentMetrics.get(agentId);
        if (!metrics)
            return;
        const issues = [];
        if (metrics.successRate < this.performanceThresholds.minSuccessRate) {
            issues.push(`low success rate: ${(metrics.successRate * 100).toFixed(1)}%`);
        }
        if (metrics.averageExecutionTime > this.performanceThresholds.maxResponseTime) {
            issues.push(`slow response time: ${metrics.averageExecutionTime}ms`);
        }
        if (metrics.currentLoad > this.performanceThresholds.maxLoad) {
            issues.push(`high load: ${(metrics.currentLoad * 100).toFixed(1)}%`);
        }
        if (issues.length > 0) {
            const event = {
                type: 'performance_alert',
                timestamp: new Date(),
                agentId,
                data: { issues },
            };
            this.emit('performance_alert', event);
            console.warn(`⚠️ Performance issues detected for agent ${agentId}: ${issues.join(', ')}`);
        }
    }
    createDefaultMetrics(agentId) {
        return {
            id: agentId,
            totalTasksCompleted: 0,
            totalTasksFailed: 0,
            averageExecutionTime: 0,
            successRate: 1.0,
            currentLoad: 0,
            lastActiveTime: new Date(),
            uptime: 0,
            errorCount: 0,
            recoveryCount: 0,
        };
    }
}
//# sourceMappingURL=agentCoordinator.js.map