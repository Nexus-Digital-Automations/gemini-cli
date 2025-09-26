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
import { type IntegrationConfig } from './integrationBridge.js';
import type { AutonomousTask, RegisteredAgent, TaskType, TaskPriority, AgentCapability } from './autonomousTaskIntegrator.js';
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
export declare class AutonomousTaskApi extends EventEmitter {
    private bridge;
    private requestCounter;
    private activeRequests;
    constructor(config: Config, integrationConfig?: Partial<IntegrationConfig>);
    /**
     * Initialize the API system
     */
    initialize(): Promise<void>;
    /**
     * Handle incoming API requests
     */
    handleRequest(request: ApiRequest): Promise<ApiResponse>;
    /**
     * Task management endpoints
     */
    createTask(taskRequest: TaskCreationRequest): Promise<AutonomousTask>;
    getTask(taskId: string): Promise<AutonomousTask | null>;
    getAllTasks(): Promise<AutonomousTask[]>;
    updateTaskProgress(taskId: string, update: any): Promise<void>;
    /**
     * Agent management endpoints
     */
    registerAgent(agentRequest: AgentRegistrationRequest): Promise<void>;
    getAgent(agentId: string): Promise<RegisteredAgent | null>;
    getAllAgents(): Promise<RegisteredAgent[]>;
    /**
     * System management endpoints
     */
    getSystemStatus(): Promise<any>;
    healthCheck(): Promise<any>;
    /**
     * Feature integration endpoints
     */
    createTaskFromFeature(featureId: string, options?: any): Promise<AutonomousTask>;
    generateTasksFromApprovedFeatures(): Promise<AutonomousTask[]>;
    /**
     * CLI integration endpoints
     */
    executeCliCommand(command: string, args?: string[], taskContext?: any): Promise<any>;
    getCliIntegrationStatus(): Promise<any>;
    /**
     * Graceful shutdown
     */
    shutdown(): Promise<void>;
    private routeRequest;
    private routeTaskRequest;
    private routeAgentRequest;
    private routeSystemRequest;
    private routeFeatureRequest;
    private routeCliRequest;
    private setupApiEventHandlers;
    private generateRequestId;
}
/**
 * Convenience function to create and initialize the API
 */
export declare function createAutonomousTaskApi(config: Config, integrationConfig?: Partial<IntegrationConfig>): Promise<AutonomousTaskApi>;
