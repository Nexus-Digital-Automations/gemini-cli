/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Autonomous Task Management Integration Layer
 *
 * This service provides seamless integration between:
 * - TaskManager API for feature lifecycle and agent coordination
 * - CoreToolScheduler for task execution and validation
 * - A2A Server for inter-agent communication
 * - TodoWrite for task breakdown and progress tracking
 */
import { EventEmitter } from 'node:events';
import type { Config } from '../index.js';
export interface AutonomousTask {
    id: string;
    featureId?: string;
    title: string;
    description: string;
    type: TaskType;
    priority: TaskPriority;
    status: TaskStatus;
    dependencies: string[];
    assignedAgent?: string;
    requiredCapabilities: AgentCapability[];
    createdAt: Date;
    updatedAt: Date;
    startedAt?: Date;
    completedAt?: Date;
    metadata: Record<string, unknown>;
}
export type TaskType = 'implementation' | 'testing' | 'documentation' | 'validation' | 'deployment' | 'analysis' | 'security' | 'performance';
export type TaskPriority = 'critical' | 'high' | 'normal' | 'low';
export type TaskStatus = 'queued' | 'assigned' | 'in_progress' | 'blocked' | 'completed' | 'failed' | 'cancelled';
export type AgentCapability = 'frontend' | 'backend' | 'testing' | 'documentation' | 'security' | 'performance' | 'analysis' | 'validation';
export interface RegisteredAgent {
    id: string;
    capabilities: AgentCapability[];
    sessionId: string;
    status: 'active' | 'busy' | 'idle' | 'offline';
    lastHeartbeat: Date;
    currentTasks: string[];
    maxConcurrentTasks: number;
    performance: {
        completedTasks: number;
        averageCompletionTime: number;
        successRate: number;
    };
}
export interface TaskEvent {
    type: 'task_created' | 'task_assigned' | 'task_started' | 'task_completed' | 'task_failed' | 'agent_registered' | 'agent_disconnected';
    taskId?: string;
    agentId?: string;
    timestamp: Date;
    data: Record<string, unknown>;
}
/**
 * Core integration orchestrator for autonomous task management
 */
export declare class AutonomousTaskIntegrator extends EventEmitter {
    private taskQueue;
    private agentRegistry;
    private taskAssignments;
    private dependencyGraph;
    private scheduler?;
    private config;
    private apiEndpoints;
    constructor(config: Config);
    /**
     * Initialize integration with existing components
     */
    initialize(): Promise<void>;
    /**
     * Register a new agent with capabilities
     */
    registerAgent(agentConfig: {
        id: string;
        capabilities: AgentCapability[];
        maxConcurrentTasks?: number;
    }): Promise<void>;
    /**
     * Create and queue a new autonomous task
     */
    createTask(taskConfig: {
        title: string;
        description: string;
        type: TaskType;
        priority: TaskPriority;
        dependencies?: string[];
        requiredCapabilities?: AgentCapability[];
        featureId?: string;
        metadata?: Record<string, unknown>;
    }): Promise<AutonomousTask>;
    /**
     * Process queued tasks and assign to available agents
     */
    private processQueuedTasks;
    /**
     * Assign a task to an agent
     */
    private assignTask;
    /**
     * Execute a task using CoreToolScheduler
     */
    private executeTask;
    /**
     * Handle task completion
     */
    private handleTaskCompletion;
    /**
     * Handle task failure
     */
    private handleTaskFailure;
    /**
     * Handle external API calls to the task management system
     */
    handleApiCall(endpoint: string, params?: unknown[]): Promise<unknown>;
    /**
     * Get all available API endpoints
     */
    getApiEndpoints(): string[];
    /**
     * Get task by ID
     */
    getTask(taskId: string): AutonomousTask | undefined;
    /**
     * Get agent by ID
     */
    getAgent(agentId: string): RegisteredAgent | undefined;
    /**
     * Get all tasks
     */
    getAllTasks(): AutonomousTask[];
    /**
     * Get all agents
     */
    getAllAgents(): RegisteredAgent[];
    /**
     * Get system status and metrics
     */
    getSystemStatus(): {
        tasks: {
            total: number;
            byStatus: Record<TaskStatus, number>;
            byType: Record<TaskType, number>;
            byPriority: Record<TaskPriority, number>;
        };
        agents: {
            total: number;
            active: number;
            busy: number;
            idle: number;
            offline: number;
        };
        queue: {
            depth: number;
            avgWaitTime: number;
        };
    };
    private setupEventHandlers;
    private setupApiEndpoints;
    private initializeTaskManagerConnection;
    private startHeartbeatMonitoring;
    private handleToolOutput;
    private handleToolsComplete;
    private handleToolsUpdate;
    private updateTaskManagerAgent;
    private isComplexTask;
    private createTodoBreakdown;
    private areDependenciesSatisfied;
    private findSuitableAgent;
    private agentHasRequiredCapabilities;
    private convertTaskToToolRequests;
    private comparePriority;
    private generateTaskId;
    private generateSessionId;
}
