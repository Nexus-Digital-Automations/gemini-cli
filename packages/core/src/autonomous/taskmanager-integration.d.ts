/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { AutonomousTask } from './task-breakdown-engine.js';
import type { TaskExecutionContext, TaskExecutionResult, ExecutionLogger } from './execution-engine.js';
import type { WorkspaceContext } from '../utils/workspaceContext.js';
import type { AnyDeclarativeTool } from '../tools/tools.js';
/**
 * TaskManager API client interface
 */
export interface TaskManagerClient {
    reinitialize(agentId: string): Promise<TaskManagerResponse>;
    createTask(task: TaskManagerTaskData): Promise<TaskManagerResponse>;
    updateTask(taskId: string, update: Partial<TaskManagerTaskData>): Promise<TaskManagerResponse>;
    getTask(taskId: string): Promise<TaskManagerResponse>;
    listTasks(): Promise<TaskManagerResponse>;
    deleteTask(taskId: string): Promise<TaskManagerResponse>;
    authorizeStop(agentId: string, reason: string): Promise<TaskManagerResponse>;
}
/**
 * TaskManager API response structure
 */
export interface TaskManagerResponse {
    success: boolean;
    data?: unknown;
    error?: string;
    message?: string;
}
/**
 * TaskManager task data structure
 */
export interface TaskManagerTaskData {
    id?: string;
    title: string;
    description: string;
    status: 'pending' | 'in_progress' | 'completed' | 'failed';
    priority: number;
    category: string;
    agentId: string;
    metadata?: Record<string, unknown>;
}
/**
 * Integration configuration
 */
export interface AutonomousIntegrationConfig {
    taskManagerApiPath: string;
    agentId: string;
    timeout: number;
    enableLogging: boolean;
    statePersistencePath?: string;
    maxConcurrentTasks?: number;
}
/**
 * Integration event types
 */
export interface IntegrationEvents {
    'task-started': {
        task: AutonomousTask;
        context: TaskExecutionContext;
    };
    'task-completed': {
        task: AutonomousTask;
        result: TaskExecutionResult;
    };
    'task-failed': {
        task: AutonomousTask;
        result: TaskExecutionResult;
    };
    'breakdown-completed': {
        originalRequest: string;
        tasks: AutonomousTask[];
    };
    'integration-error': {
        error: Error;
        context: string;
    };
}
/**
 * TaskManager API client implementation
 */
export declare class TaskManagerAPIClient implements TaskManagerClient {
    private readonly apiPath;
    private readonly timeout;
    private readonly logger;
    constructor(apiPath: string, timeout?: number, logger?: ExecutionLogger);
    reinitialize(agentId: string): Promise<TaskManagerResponse>;
    createTask(task: TaskManagerTaskData): Promise<TaskManagerResponse>;
    updateTask(taskId: string, update: Partial<TaskManagerTaskData>): Promise<TaskManagerResponse>;
    getTask(taskId: string): Promise<TaskManagerResponse>;
    listTasks(): Promise<TaskManagerResponse>;
    deleteTask(taskId: string): Promise<TaskManagerResponse>;
    authorizeStop(agentId: string, reason: string): Promise<TaskManagerResponse>;
    private executeCommand;
}
/**
 * Comprehensive autonomous task management integration
 */
export declare class AutonomousTaskManagerIntegration {
    private readonly breakdownEngine;
    private readonly executionEngine;
    private readonly validationEngine;
    private readonly stateManager;
    private readonly taskManagerClient;
    private readonly config;
    private readonly logger;
    private readonly activeTasks;
    private readonly taskResults;
    constructor(workspaceContext: WorkspaceContext, availableTools: Map<string, AnyDeclarativeTool>, config: AutonomousIntegrationConfig);
    /**
     * Processes a complex user request autonomously
     */
    processRequest(request: string, workspaceContext: WorkspaceContext, availableTools: string[]): Promise<{
        tasks: AutonomousTask[];
        results: TaskExecutionResult[];
    }>;
    /**
     * Recovers and continues interrupted tasks
     */
    recoverInterruptedTasks(): Promise<void>;
    /**
     * Gets the current status of all active tasks
     */
    getTaskStatus(): Promise<{
        active: AutonomousTask[];
        completed: TaskExecutionResult[];
        failed: TaskExecutionResult[];
    }>;
    private registerTasks;
    private executeTasks;
    private updateTaskResults;
    private checkCompletionAndAuthorizeStop;
    private extractUserIntent;
    private reconstructTaskFromState;
    private setupEventHandlers;
    private createLogger;
}
/**
 * Factory function to create configured autonomous integration
 */
export declare function createAutonomousIntegration(workspaceContext: WorkspaceContext, availableTools: Map<string, AnyDeclarativeTool>, config: Partial<AutonomousIntegrationConfig>): AutonomousTaskManagerIntegration;
