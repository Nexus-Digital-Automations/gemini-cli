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
import type { ToolCallRequestInfo, Config } from '../index.js';
import { CoreToolScheduler } from '../core/coreToolScheduler.js';
import type { WriteTodosToolParams } from '../tools/write-todos.js';

// Task Management Types
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

export type TaskType =
  | 'implementation'
  | 'testing'
  | 'documentation'
  | 'validation'
  | 'deployment'
  | 'analysis';
export type TaskPriority = 'critical' | 'high' | 'normal' | 'low';
export type TaskStatus =
  | 'queued'
  | 'assigned'
  | 'in_progress'
  | 'blocked'
  | 'completed'
  | 'failed'
  | 'cancelled';
export type AgentCapability =
  | 'frontend'
  | 'backend'
  | 'testing'
  | 'documentation'
  | 'security'
  | 'performance'
  | 'analysis'
  | 'validation';

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
  type:
    | 'task_created'
    | 'task_assigned'
    | 'task_started'
    | 'task_completed'
    | 'task_failed'
    | 'agent_registered'
    | 'agent_disconnected';
  taskId?: string;
  agentId?: string;
  timestamp: Date;
  data: Record<string, unknown>;
}

/**
 * Core integration orchestrator for autonomous task management
 */
export class AutonomousTaskIntegrator extends EventEmitter {
  private taskQueue: Map<string, AutonomousTask> = new Map();
  private agentRegistry: Map<string, RegisteredAgent> = new Map();
  private taskAssignments: Map<string, string> = new Map(); // taskId -> agentId
  private dependencyGraph: Map<string, Set<string>> = new Map(); // taskId -> dependencies
  private scheduler?: CoreToolScheduler;
  private config: Config;
  private apiEndpoints: Map<string, Function> = new Map();

  constructor(config: Config) {
    super();
    this.config = config;
    this.setupEventHandlers();
    this.setupApiEndpoints();
  }

  /**
   * Initialize integration with existing components
   */
  async initialize(): Promise<void> {
    // Initialize CoreToolScheduler integration
    this.scheduler = new CoreToolScheduler({
      config: this.config,
      outputUpdateHandler: this.handleToolOutput.bind(this),
      onAllToolCallsComplete: this.handleToolsComplete.bind(this),
      onToolCallsUpdate: this.handleToolsUpdate.bind(this),
      getPreferredEditor: () => 'vscode',
      onEditorClose: () => {},
    });

    // Initialize TaskManager API connection
    await this.initializeTaskManagerConnection();

    // Start heartbeat monitoring
    this.startHeartbeatMonitoring();

    this.emit('system_initialized', { timestamp: new Date() });
  }

  /**
   * Register a new agent with capabilities
   */
  async registerAgent(agentConfig: {
    id: string;
    capabilities: AgentCapability[];
    maxConcurrentTasks?: number;
  }): Promise<void> {
    const agent: RegisteredAgent = {
      id: agentConfig.id,
      capabilities: agentConfig.capabilities,
      sessionId: this.generateSessionId(),
      status: 'idle',
      lastHeartbeat: new Date(),
      currentTasks: [],
      maxConcurrentTasks: agentConfig.maxConcurrentTasks || 3,
      performance: {
        completedTasks: 0,
        averageCompletionTime: 0,
        successRate: 1.0,
      },
    };

    this.agentRegistry.set(agentConfig.id, agent);

    // Update TaskManager API with agent registration
    await this.updateTaskManagerAgent(agent);

    const event: TaskEvent = {
      type: 'agent_registered',
      agentId: agentConfig.id,
      timestamp: new Date(),
      data: { capabilities: agentConfig.capabilities },
    };

    this.emit('agent_registered', event);
    this.processQueuedTasks();
  }

  /**
   * Create and queue a new autonomous task
   */
  async createTask(taskConfig: {
    title: string;
    description: string;
    type: TaskType;
    priority: TaskPriority;
    dependencies?: string[];
    requiredCapabilities?: AgentCapability[];
    featureId?: string;
    metadata?: Record<string, unknown>;
  }): Promise<AutonomousTask> {
    const task: AutonomousTask = {
      id: this.generateTaskId(),
      featureId: taskConfig.featureId,
      title: taskConfig.title,
      description: taskConfig.description,
      type: taskConfig.type,
      priority: taskConfig.priority,
      status: 'queued',
      dependencies: taskConfig.dependencies || [],
      requiredCapabilities: taskConfig.requiredCapabilities || [],
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: taskConfig.metadata || {},
    };

    this.taskQueue.set(task.id, task);

    // Build dependency graph
    if (task.dependencies.length > 0) {
      this.dependencyGraph.set(task.id, new Set(task.dependencies));
    }

    // Create TodoWrite breakdown if task is complex
    if (this.isComplexTask(task)) {
      await this.createTodoBreakdown(task);
    }

    const event: TaskEvent = {
      type: 'task_created',
      taskId: task.id,
      timestamp: new Date(),
      data: { task },
    };

    this.emit('task_created', event);
    this.processQueuedTasks();

    return task;
  }

  /**
   * Process queued tasks and assign to available agents
   */
  private async processQueuedTasks(): Promise<void> {
    const queuedTasks = Array.from(this.taskQueue.values())
      .filter((task) => task.status === 'queued')
      .sort((a, b) => this.comparePriority(a.priority, b.priority));

    for (const task of queuedTasks) {
      // Check if dependencies are satisfied
      if (!this.areDependenciesSatisfied(task)) {
        continue;
      }

      // Find suitable agent
      const agent = this.findSuitableAgent(task);
      if (!agent) {
        continue; // No suitable agent available
      }

      // Assign task to agent
      await this.assignTask(task, agent);
    }
  }

  /**
   * Assign a task to an agent
   */
  private async assignTask(
    task: AutonomousTask,
    agent: RegisteredAgent,
  ): Promise<void> {
    task.status = 'assigned';
    task.assignedAgent = agent.id;
    task.updatedAt = new Date();

    agent.currentTasks.push(task.id);
    agent.status =
      agent.currentTasks.length >= agent.maxConcurrentTasks ? 'busy' : 'active';

    this.taskQueue.set(task.id, task);
    this.agentRegistry.set(agent.id, agent);
    this.taskAssignments.set(task.id, agent.id);

    const event: TaskEvent = {
      type: 'task_assigned',
      taskId: task.id,
      agentId: agent.id,
      timestamp: new Date(),
      data: { task, agent },
    };

    this.emit('task_assigned', event);

    // Execute the task
    await this.executeTask(task, agent);
  }

  /**
   * Execute a task using CoreToolScheduler
   */
  private async executeTask(
    task: AutonomousTask,
    agent: RegisteredAgent,
  ): Promise<void> {
    task.status = 'in_progress';
    task.startedAt = new Date();
    task.updatedAt = new Date();
    this.taskQueue.set(task.id, task);

    const event: TaskEvent = {
      type: 'task_started',
      taskId: task.id,
      agentId: agent.id,
      timestamp: new Date(),
      data: { task },
    };

    this.emit('task_started', event);

    try {
      // Convert task to tool call requests
      const toolRequests = await this.convertTaskToToolRequests(task);

      if (toolRequests.length > 0 && this.scheduler) {
        const abortController = new AbortController();
        await this.scheduler.schedule(toolRequests, abortController.signal);
      }

      // Task completion will be handled by scheduler callbacks
    } catch (error) {
      await this.handleTaskFailure(task, agent, error as Error);
    }
  }

  /**
   * Handle task completion
   */
  private async handleTaskCompletion(
    task: AutonomousTask,
    agent: RegisteredAgent,
  ): Promise<void> {
    task.status = 'completed';
    task.completedAt = new Date();
    task.updatedAt = new Date();

    // Update agent metrics
    agent.currentTasks = agent.currentTasks.filter(
      (taskId) => taskId !== task.id,
    );
    agent.status = agent.currentTasks.length === 0 ? 'idle' : 'active';
    agent.performance.completedTasks++;

    if (task.startedAt) {
      const completionTime =
        task.completedAt.getTime() - task.startedAt.getTime();
      agent.performance.averageCompletionTime =
        (agent.performance.averageCompletionTime + completionTime) / 2;
    }

    this.taskQueue.set(task.id, task);
    this.agentRegistry.set(agent.id, agent);

    const event: TaskEvent = {
      type: 'task_completed',
      taskId: task.id,
      agentId: agent.id,
      timestamp: new Date(),
      data: {
        task,
        completionTime:
          task.completedAt.getTime() - (task.startedAt?.getTime() || 0),
      },
    };

    this.emit('task_completed', event);

    // Process any tasks that were waiting for this dependency
    this.processQueuedTasks();
  }

  /**
   * Handle task failure
   */
  private async handleTaskFailure(
    task: AutonomousTask,
    agent: RegisteredAgent,
    error: Error,
  ): Promise<void> {
    task.status = 'failed';
    task.updatedAt = new Date();
    task.metadata.error = error.message;

    // Update agent metrics
    agent.currentTasks = agent.currentTasks.filter(
      (taskId) => taskId !== task.id,
    );
    agent.status = agent.currentTasks.length === 0 ? 'idle' : 'active';

    const totalTasks = agent.performance.completedTasks + 1;
    agent.performance.successRate =
      agent.performance.completedTasks / totalTasks;

    this.taskQueue.set(task.id, task);
    this.agentRegistry.set(agent.id, agent);

    const event: TaskEvent = {
      type: 'task_failed',
      taskId: task.id,
      agentId: agent.id,
      timestamp: new Date(),
      data: { task, error: error.message },
    };

    this.emit('task_failed', event);
  }

  /**
   * Handle external API calls to the task management system
   */
  async handleApiCall(endpoint: string, params: any[] = []): Promise<any> {
    const handler = this.apiEndpoints.get(endpoint);
    if (!handler) {
      throw new Error(`Unknown API endpoint: ${endpoint}`);
    }

    try {
      return await handler.apply(this, params);
    } catch (error) {
      console.error(`❌ API call failed for ${endpoint}:`, error);
      throw error;
    }
  }

  /**
   * Get all available API endpoints
   */
  getApiEndpoints(): string[] {
    return Array.from(this.apiEndpoints.keys());
  }

  /**
   * Get task by ID
   */
  getTask(taskId: string): AutonomousTask | undefined {
    return this.taskQueue.get(taskId);
  }

  /**
   * Get agent by ID
   */
  getAgent(agentId: string): RegisteredAgent | undefined {
    return this.agentRegistry.get(agentId);
  }

  /**
   * Get all tasks
   */
  getAllTasks(): AutonomousTask[] {
    return Array.from(this.taskQueue.values());
  }

  /**
   * Get all agents
   */
  getAllAgents(): RegisteredAgent[] {
    return Array.from(this.agentRegistry.values());
  }

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
  } {
    const tasks = Array.from(this.taskQueue.values());
    const agents = Array.from(this.agentRegistry.values());

    const tasksByStatus = tasks.reduce(
      (acc, task) => {
        acc[task.status] = (acc[task.status] || 0) + 1;
        return acc;
      },
      {} as Record<TaskStatus, number>,
    );

    const tasksByType = tasks.reduce(
      (acc, task) => {
        acc[task.type] = (acc[task.type] || 0) + 1;
        return acc;
      },
      {} as Record<TaskType, number>,
    );

    const tasksByPriority = tasks.reduce(
      (acc, task) => {
        acc[task.priority] = (acc[task.priority] || 0) + 1;
        return acc;
      },
      {} as Record<TaskPriority, number>,
    );

    const agentsByStatus = agents.reduce(
      (acc, agent) => {
        acc[agent.status] = (acc[agent.status] || 0) + 1;
        return acc;
      },
      { active: 0, busy: 0, idle: 0, offline: 0 },
    );

    const queuedTasks = tasks.filter((task) => task.status === 'queued');
    const avgWaitTime =
      queuedTasks.length > 0
        ? queuedTasks.reduce(
            (sum, task) => sum + (Date.now() - task.createdAt.getTime()),
            0,
          ) / queuedTasks.length
        : 0;

    return {
      tasks: {
        total: tasks.length,
        byStatus: tasksByStatus,
        byType: tasksByType,
        byPriority: tasksByPriority,
      },
      agents: {
        total: agents.length,
        ...agentsByStatus,
      },
      queue: {
        depth: queuedTasks.length,
        avgWaitTime,
      },
    };
  }

  // Private helper methods

  private setupEventHandlers(): void {
    this.on('task_completed', (event: TaskEvent) => {
      console.log(
        `✅ Task ${event.taskId} completed by agent ${event.agentId}`,
      );
    });

    this.on('task_failed', (event: TaskEvent) => {
      console.error(`❌ Task ${event.taskId} failed: ${event.data.error}`);
    });

    this.on('agent_registered', (event: TaskEvent) => {
      console.log(
        `🤖 Agent ${event.agentId} registered with capabilities: ${event.data.capabilities}`,
      );
    });
  }

  private setupApiEndpoints(): void {
    // Task management endpoints
    this.apiEndpoints.set('createTask', this.createTask);
    this.apiEndpoints.set('getTask', this.getTask);
    this.apiEndpoints.set('getAllTasks', this.getAllTasks);
    this.apiEndpoints.set('getSystemStatus', this.getSystemStatus);

    // Agent management endpoints
    this.apiEndpoints.set('registerAgent', this.registerAgent);
    this.apiEndpoints.set('getAgent', this.getAgent);
    this.apiEndpoints.set('getAllAgents', this.getAllAgents);

    // Queue management endpoints
    this.apiEndpoints.set('processQueuedTasks', this.processQueuedTasks);

    // Health check endpoint
    this.apiEndpoints.set('healthCheck', async () => ({
      status: 'healthy',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    }));

    console.log(`🔌 Registered ${this.apiEndpoints.size} API endpoints`);
  }

  private async initializeTaskManagerConnection(): Promise<void> {
    // Initialize connection to TaskManager API
    // This would integrate with the enhanced taskmanager-api.js
  }

  private startHeartbeatMonitoring(): void {
    setInterval(() => {
      const now = new Date();
      for (const [agentId, agent] of this.agentRegistry) {
        const timeSinceHeartbeat =
          now.getTime() - agent.lastHeartbeat.getTime();
        if (timeSinceHeartbeat > 60000) {
          // 1 minute timeout
          agent.status = 'offline';
          this.agentRegistry.set(agentId, agent);

          const event: TaskEvent = {
            type: 'agent_disconnected',
            agentId,
            timestamp: now,
            data: { reason: 'heartbeat_timeout' },
          };

          this.emit('agent_disconnected', event);
        }
      }
    }, 30000); // Check every 30 seconds
  }

  private handleToolOutput(
    toolCallId: string,
    outputChunk: string | any,
  ): void {
    // Handle real-time tool output updates
    this.emit('tool_output', { toolCallId, output: outputChunk });
  }

  private async handleToolsComplete(completedToolCalls: any[]): Promise<void> {
    // Find the task associated with these tool calls
    // Update task status to completed
    // This would be enhanced based on tool call metadata
  }

  private handleToolsUpdate(toolCalls: any[]): void {
    // Handle tool call status updates
    this.emit('tools_update', { toolCalls });
  }

  private async updateTaskManagerAgent(agent: RegisteredAgent): Promise<void> {
    // Update agent information in TaskManager API
  }

  private isComplexTask(task: AutonomousTask): boolean {
    return (
      task.description.length > 200 ||
      task.dependencies.length > 0 ||
      task.type === 'implementation' ||
      task.requiredCapabilities.length > 2
    );
  }

  private async createTodoBreakdown(task: AutonomousTask): Promise<void> {
    // Create TodoWrite breakdown for complex tasks
    const todos: WriteTodosToolParams['todos'] = [
      {
        description: `Plan implementation approach for: ${task.title}`,
        status: 'pending',
      },
      {
        description: `Execute main implementation: ${task.description}`,
        status: 'pending',
      },
      {
        description: `Validate and test implementation`,
        status: 'pending',
      },
      {
        description: `Document and finalize task completion`,
        status: 'pending',
      },
    ];

    // This would integrate with the TodoWrite tool
    task.metadata.todoBreakdown = todos;
  }

  private areDependenciesSatisfied(task: AutonomousTask): boolean {
    if (task.dependencies.length === 0) return true;

    return task.dependencies.every((depId) => {
      const depTask = this.taskQueue.get(depId);
      return depTask?.status === 'completed';
    });
  }

  private findSuitableAgent(task: AutonomousTask): RegisteredAgent | null {
    const availableAgents = Array.from(this.agentRegistry.values())
      .filter(
        (agent) =>
          agent.status !== 'offline' &&
          agent.currentTasks.length < agent.maxConcurrentTasks &&
          this.agentHasRequiredCapabilities(agent, task.requiredCapabilities),
      )
      .sort((a, b) => {
        // Sort by performance and availability
        const aScore =
          a.performance.successRate *
          (1 - a.currentTasks.length / a.maxConcurrentTasks);
        const bScore =
          b.performance.successRate *
          (1 - b.currentTasks.length / b.maxConcurrentTasks);
        return bScore - aScore;
      });

    return availableAgents[0] || null;
  }

  private agentHasRequiredCapabilities(
    agent: RegisteredAgent,
    required: AgentCapability[],
  ): boolean {
    if (required.length === 0) return true;
    return required.every((capability) =>
      agent.capabilities.includes(capability),
    );
  }

  private async convertTaskToToolRequests(
    task: AutonomousTask,
  ): Promise<ToolCallRequestInfo[]> {
    // Convert autonomous task to CoreToolScheduler tool requests
    // This is a simplified example - would be enhanced based on task type
    const requests: ToolCallRequestInfo[] = [];

    if (task.type === 'implementation') {
      // Example: Convert to file modification requests
      requests.push({
        callId: `task_${task.id}_impl`,
        name: 'write_todos_list',
        args: {
          todos: [{ description: task.description, status: 'in_progress' }],
        },
        isClientInitiated: false,
        prompt_id: `task_${task.id}_prompt`,
      });
    }

    return requests;
  }

  private comparePriority(a: TaskPriority, b: TaskPriority): number {
    const priorityOrder = { critical: 0, high: 1, normal: 2, low: 3 };
    return priorityOrder[a] - priorityOrder[b];
  }

  private generateTaskId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
