/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Autonomous Task Management API Interface
 *
 * Provides a standardized HTTP-like API interface for external tools and services
 * to interact with the autonomous task management system.
 */

import { EventEmitter } from 'node:events';
import type { Config } from '../index.js';
import {
  IntegrationBridge,
  type IntegrationConfig,
} from './integrationBridge.js';
import type {
  AutonomousTask,
  RegisteredAgent,
  TaskType,
  TaskPriority,
  AgentCapability,
} from './autonomousTaskIntegrator.js';

export interface ApiRequest {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  endpoint: string;
  params?: Record<string, any>;
  body?: any;
  headers?: Record<string, string>;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
  requestId: string;
}

export interface TaskCreationRequest {
  title: string;
  description: string;
  type: TaskType;
  priority: TaskPriority;
  dependencies?: string[];
  requiredCapabilities?: AgentCapability[];
  featureId?: string;
  metadata?: Record<string, unknown>;
}

export interface AgentRegistrationRequest {
  id: string;
  capabilities: AgentCapability[];
  maxConcurrentTasks?: number;
}

/**
 * RESTful API interface for autonomous task management
 */
export class AutonomousTaskApi extends EventEmitter {
  private bridge: IntegrationBridge;
  private requestCounter = 0;
  private activeRequests = new Map<string, Promise<any>>();

  constructor(config: Config, integrationConfig?: Partial<IntegrationConfig>) {
    super();
    this.bridge = new IntegrationBridge(config, integrationConfig);
    this.setupApiEventHandlers();
  }

  /**
   * Initialize the API system
   */
  async initialize(): Promise<void> {
    await this.bridge.initialize();
    console.log('🌐 Autonomous Task Management API initialized');
  }

  /**
   * Handle incoming API requests
   */
  async handleRequest(request: ApiRequest): Promise<ApiResponse> {
    const requestId = this.generateRequestId();
    const startTime = Date.now();

    try {
      console.log(
        `📥 API Request [${requestId}]: ${request.method} ${request.endpoint}`,
      );

      // Route request based on method and endpoint
      const result = await this.routeRequest(request);

      const response: ApiResponse = {
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
        requestId,
      };

      const duration = Date.now() - startTime;
      console.log(`✅ API Response [${requestId}]: ${duration}ms`);

      return response;
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
        requestId,
      };

      const duration = Date.now() - startTime;
      console.error(
        `❌ API Error [${requestId}]: ${duration}ms - ${response.error}`,
      );

      return response;
    }
  }

  /**
   * Task management endpoints
   */
  async createTask(taskRequest: TaskCreationRequest): Promise<AutonomousTask> {
    return await this.bridge.handleExternalApiRequest('createTask', [
      taskRequest,
    ]);
  }

  async getTask(taskId: string): Promise<AutonomousTask | null> {
    return await this.bridge.handleExternalApiRequest('getTask', [taskId]);
  }

  async getAllTasks(): Promise<AutonomousTask[]> {
    return await this.bridge.handleExternalApiRequest('getAllTasks', []);
  }

  async updateTaskProgress(taskId: string, update: any): Promise<void> {
    return await this.bridge.updateTaskProgress(taskId, update);
  }

  /**
   * Agent management endpoints
   */
  async registerAgent(agentRequest: AgentRegistrationRequest): Promise<void> {
    return await this.bridge.registerAgent(agentRequest);
  }

  async getAgent(agentId: string): Promise<RegisteredAgent | null> {
    return await this.bridge.handleExternalApiRequest('getAgent', [agentId]);
  }

  async getAllAgents(): Promise<RegisteredAgent[]> {
    return await this.bridge.handleExternalApiRequest('getAllAgents', []);
  }

  /**
   * System management endpoints
   */
  async getSystemStatus(): Promise<any> {
    return await this.bridge.getSystemStatus();
  }

  async healthCheck(): Promise<any> {
    return await this.bridge.handleExternalApiRequest('healthCheck', []);
  }

  /**
   * Feature integration endpoints
   */
  async createTaskFromFeature(
    featureId: string,
    options: any = {},
  ): Promise<AutonomousTask> {
    return await this.bridge.createTaskFromFeature(featureId, options);
  }

  async generateTasksFromApprovedFeatures(): Promise<AutonomousTask[]> {
    return await this.bridge.generateTasksFromApprovedFeatures();
  }

  /**
   * CLI integration endpoints
   */
  async executeCliCommand(
    command: string,
    args: string[] = [],
    taskContext?: any,
  ): Promise<any> {
    return await this.bridge.executeCliCommand(command, args, taskContext);
  }

  async getCliIntegrationStatus(): Promise<any> {
    return this.bridge.getCliIntegrationStatus();
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    await this.bridge.shutdown();
    console.log('🌐 Autonomous Task Management API shut down');
  }

  // Private methods

  private async routeRequest(request: ApiRequest): Promise<any> {
    const { method, endpoint, params, body } = request;

    // Parse endpoint path
    const pathParts = endpoint.replace(/^\/+/, '').split('/');
    const resource = pathParts[0];
    const resourceId = pathParts[1];
    const action = pathParts[2];

    switch (resource) {
      case 'tasks':
        return await this.routeTaskRequest(
          method,
          resourceId,
          action,
          params,
          body,
        );

      case 'agents':
        return await this.routeAgentRequest(
          method,
          resourceId,
          action,
          params,
          body,
        );

      case 'system':
        return await this.routeSystemRequest(
          method,
          resourceId,
          action,
          params,
          body,
        );

      case 'features':
        return await this.routeFeatureRequest(
          method,
          resourceId,
          action,
          params,
          body,
        );

      case 'cli':
        return await this.routeCliRequest(
          method,
          resourceId,
          action,
          params,
          body,
        );

      default:
        throw new Error(`Unknown resource: ${resource}`);
    }
  }

  private async routeTaskRequest(
    method: string,
    resourceId?: string,
    action?: string,
    params?: any,
    body?: any,
  ): Promise<any> {
    switch (method) {
      case 'GET':
        if (!resourceId) {
          return await this.getAllTasks();
        } else {
          return await this.getTask(resourceId);
        }

      case 'POST':
        if (!body) {
          throw new Error('Request body required for task creation');
        }
        return await this.createTask(body as TaskCreationRequest);

      case 'PUT':
        if (!resourceId || !body) {
          throw new Error('Task ID and update data required');
        }
        return await this.updateTaskProgress(resourceId, body);

      default:
        throw new Error(`Unsupported method for tasks: ${method}`);
    }
  }

  private async routeAgentRequest(
    method: string,
    resourceId?: string,
    action?: string,
    params?: any,
    body?: any,
  ): Promise<any> {
    switch (method) {
      case 'GET':
        if (!resourceId) {
          return await this.getAllAgents();
        } else {
          return await this.getAgent(resourceId);
        }

      case 'POST':
        if (!body) {
          throw new Error('Request body required for agent registration');
        }
        return await this.registerAgent(body as AgentRegistrationRequest);

      default:
        throw new Error(`Unsupported method for agents: ${method}`);
    }
  }

  private async routeSystemRequest(
    method: string,
    resourceId?: string,
    action?: string,
    params?: any,
    body?: any,
  ): Promise<any> {
    switch (method) {
      case 'GET':
        if (resourceId === 'status') {
          return await this.getSystemStatus();
        } else if (resourceId === 'health') {
          return await this.healthCheck();
        } else {
          throw new Error(`Unknown system endpoint: ${resourceId}`);
        }

      default:
        throw new Error(`Unsupported method for system: ${method}`);
    }
  }

  private async routeFeatureRequest(
    method: string,
    resourceId?: string,
    action?: string,
    params?: any,
    body?: any,
  ): Promise<any> {
    switch (method) {
      case 'POST':
        if (action === 'generate-tasks') {
          return await this.generateTasksFromApprovedFeatures();
        } else if (resourceId && action === 'create-task') {
          return await this.createTaskFromFeature(resourceId, body || {});
        } else {
          throw new Error('Invalid feature request');
        }

      default:
        throw new Error(`Unsupported method for features: ${method}`);
    }
  }

  private async routeCliRequest(
    method: string,
    resourceId?: string,
    action?: string,
    params?: any,
    body?: any,
  ): Promise<any> {
    switch (method) {
      case 'GET':
        if (resourceId === 'status') {
          return await this.getCliIntegrationStatus();
        } else {
          throw new Error(`Unknown CLI endpoint: ${resourceId}`);
        }

      case 'POST':
        if (resourceId === 'execute') {
          const { command, args, taskContext } = body || {};
          if (!command) {
            throw new Error('Command required for CLI execution');
          }
          return await this.executeCliCommand(command, args || [], taskContext);
        } else {
          throw new Error(`Unknown CLI action: ${resourceId}`);
        }

      default:
        throw new Error(`Unsupported method for CLI: ${method}`);
    }
  }

  private setupApiEventHandlers(): void {
    this.bridge.on('task_created', (event) => {
      this.emit('task_created', event);
    });

    this.bridge.on('task_completed', (event) => {
      this.emit('task_completed', event);
    });

    this.bridge.on('task_failed', (event) => {
      this.emit('task_failed', event);
    });

    this.bridge.on('agent_registered', (event) => {
      this.emit('agent_registered', event);
    });
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${++this.requestCounter}`;
  }
}

/**
 * Convenience function to create and initialize the API
 */
export async function createAutonomousTaskApi(
  config: Config,
  integrationConfig?: Partial<IntegrationConfig>,
): Promise<AutonomousTaskApi> {
  const api = new AutonomousTaskApi(config, integrationConfig);
  await api.initialize();
  return api;
}
