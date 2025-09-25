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
import { IntegrationBridge } from './integrationBridge.js';
/**
 * RESTful API interface for autonomous task management
 */
export class AutonomousTaskApi extends EventEmitter {
    bridge;
    requestCounter = 0;
    activeRequests = new Map();
    constructor(config, integrationConfig) {
        super();
        this.bridge = new IntegrationBridge(config, integrationConfig);
        this.setupApiEventHandlers();
    }
    /**
     * Initialize the API system
     */
    async initialize() {
        await this.bridge.initialize();
        console.log('🌐 Autonomous Task Management API initialized');
    }
    /**
     * Handle incoming API requests
     */
    async handleRequest(request) {
        const requestId = this.generateRequestId();
        const startTime = Date.now();
        try {
            console.log(`📥 API Request [${requestId}]: ${request.method} ${request.endpoint}`);
            // Route request based on method and endpoint
            const result = await this.routeRequest(request);
            const response = {
                success: true,
                data: result,
                timestamp: new Date().toISOString(),
                requestId,
            };
            const duration = Date.now() - startTime;
            console.log(`✅ API Response [${requestId}]: ${duration}ms`);
            return response;
        }
        catch (error) {
            const response = {
                success: false,
                error: error instanceof Error ? error.message : String(error),
                timestamp: new Date().toISOString(),
                requestId,
            };
            const duration = Date.now() - startTime;
            console.error(`❌ API Error [${requestId}]: ${duration}ms - ${response.error}`);
            return response;
        }
    }
    /**
     * Task management endpoints
     */
    async createTask(taskRequest) {
        return await this.bridge.handleExternalApiRequest('createTask', [taskRequest]);
    }
    async getTask(taskId) {
        return await this.bridge.handleExternalApiRequest('getTask', [taskId]);
    }
    async getAllTasks() {
        return await this.bridge.handleExternalApiRequest('getAllTasks', []);
    }
    async updateTaskProgress(taskId, update) {
        return await this.bridge.updateTaskProgress(taskId, update);
    }
    /**
     * Agent management endpoints
     */
    async registerAgent(agentRequest) {
        return await this.bridge.registerAgent(agentRequest);
    }
    async getAgent(agentId) {
        return await this.bridge.handleExternalApiRequest('getAgent', [agentId]);
    }
    async getAllAgents() {
        return await this.bridge.handleExternalApiRequest('getAllAgents', []);
    }
    /**
     * System management endpoints
     */
    async getSystemStatus() {
        return await this.bridge.getSystemStatus();
    }
    async healthCheck() {
        return await this.bridge.handleExternalApiRequest('healthCheck', []);
    }
    /**
     * Feature integration endpoints
     */
    async createTaskFromFeature(featureId, options = {}) {
        return await this.bridge.createTaskFromFeature(featureId, options);
    }
    async generateTasksFromApprovedFeatures() {
        return await this.bridge.generateTasksFromApprovedFeatures();
    }
    /**
     * CLI integration endpoints
     */
    async executeCliCommand(command, args = [], taskContext) {
        return await this.bridge.executeCliCommand(command, args, taskContext);
    }
    async getCliIntegrationStatus() {
        return this.bridge.getCliIntegrationStatus();
    }
    /**
     * Graceful shutdown
     */
    async shutdown() {
        await this.bridge.shutdown();
        console.log('🌐 Autonomous Task Management API shut down');
    }
    // Private methods
    async routeRequest(request) {
        const { method, endpoint, params, body } = request;
        // Parse endpoint path
        const pathParts = endpoint.replace(/^\/+/, '').split('/');
        const resource = pathParts[0];
        const resourceId = pathParts[1];
        const action = pathParts[2];
        switch (resource) {
            case 'tasks':
                return await this.routeTaskRequest(method, resourceId, action, params, body);
            case 'agents':
                return await this.routeAgentRequest(method, resourceId, action, params, body);
            case 'system':
                return await this.routeSystemRequest(method, resourceId, action, params, body);
            case 'features':
                return await this.routeFeatureRequest(method, resourceId, action, params, body);
            case 'cli':
                return await this.routeCliRequest(method, resourceId, action, params, body);
            default:
                throw new Error(`Unknown resource: ${resource}`);
        }
    }
    async routeTaskRequest(method, resourceId, action, params, body) {
        switch (method) {
            case 'GET':
                if (!resourceId) {
                    return await this.getAllTasks();
                }
                else {
                    return await this.getTask(resourceId);
                }
            case 'POST':
                if (!body) {
                    throw new Error('Request body required for task creation');
                }
                return await this.createTask(body);
            case 'PUT':
                if (!resourceId || !body) {
                    throw new Error('Task ID and update data required');
                }
                return await this.updateTaskProgress(resourceId, body);
            default:
                throw new Error(`Unsupported method for tasks: ${method}`);
        }
    }
    async routeAgentRequest(method, resourceId, action, params, body) {
        switch (method) {
            case 'GET':
                if (!resourceId) {
                    return await this.getAllAgents();
                }
                else {
                    return await this.getAgent(resourceId);
                }
            case 'POST':
                if (!body) {
                    throw new Error('Request body required for agent registration');
                }
                return await this.registerAgent(body);
            default:
                throw new Error(`Unsupported method for agents: ${method}`);
        }
    }
    async routeSystemRequest(method, resourceId, action, params, body) {
        switch (method) {
            case 'GET':
                if (resourceId === 'status') {
                    return await this.getSystemStatus();
                }
                else if (resourceId === 'health') {
                    return await this.healthCheck();
                }
                else {
                    throw new Error(`Unknown system endpoint: ${resourceId}`);
                }
            default:
                throw new Error(`Unsupported method for system: ${method}`);
        }
    }
    async routeFeatureRequest(method, resourceId, action, params, body) {
        switch (method) {
            case 'POST':
                if (action === 'generate-tasks') {
                    return await this.generateTasksFromApprovedFeatures();
                }
                else if (resourceId && action === 'create-task') {
                    return await this.createTaskFromFeature(resourceId, body || {});
                }
                else {
                    throw new Error('Invalid feature request');
                }
            default:
                throw new Error(`Unsupported method for features: ${method}`);
        }
    }
    async routeCliRequest(method, resourceId, action, params, body) {
        switch (method) {
            case 'GET':
                if (resourceId === 'status') {
                    return await this.getCliIntegrationStatus();
                }
                else {
                    throw new Error(`Unknown CLI endpoint: ${resourceId}`);
                }
            case 'POST':
                if (resourceId === 'execute') {
                    const { command, args, taskContext } = body || {};
                    if (!command) {
                        throw new Error('Command required for CLI execution');
                    }
                    return await this.executeCliCommand(command, args || [], taskContext);
                }
                else {
                    throw new Error(`Unknown CLI action: ${resourceId}`);
                }
            default:
                throw new Error(`Unsupported method for CLI: ${method}`);
        }
    }
    setupApiEventHandlers() {
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
    generateRequestId() {
        return `req_${Date.now()}_${++this.requestCounter}`;
    }
}
/**
 * Convenience function to create and initialize the API
 */
export async function createAutonomousTaskApi(config, integrationConfig) {
    const api = new AutonomousTaskApi(config, integrationConfig);
    await api.initialize();
    return api;
}
//# sourceMappingURL=autonomousTaskApi.js.map