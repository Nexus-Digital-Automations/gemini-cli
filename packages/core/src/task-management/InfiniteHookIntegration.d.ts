/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { Config } from '../config/config.js';
import type { TaskExecutionEngine } from './TaskExecutionEngine.complete.js';
import type { ExecutionMonitoringSystem } from './ExecutionMonitoringSystem.js';
/**
 * @fileoverview Integration with infinite-continue-stop-hook system
 *
 * This module integrates the TaskExecutionEngine with the existing
 * infinite-continue-stop-hook system for cross-session persistence
 * and autonomous task management.
 */
/**
 * Task manager API integration
 */
export interface TaskManagerAPI {
    createTaskFromFeature(featureId: string, options?: any): Promise<any>;
    generateTasksFromApprovedFeatures(options?: any): Promise<any>;
    getTaskQueue(filters?: any): Promise<any>;
    assignTask(taskId: string, agentId: string, options?: any): Promise<any>;
    updateTaskProgress(taskId: string, progress: any): Promise<any>;
    registerAgentCapabilities(agentId: string, capabilities: string[]): Promise<any>;
}
/**
 * Hook integration configuration
 */
export interface HookIntegrationConfig {
    taskManagerApiPath: string;
    agentId: string;
    capabilities: string[];
    autoApprovalEnabled: boolean;
    maxConcurrentTasks: number;
    progressReportingIntervalMs: number;
}
/**
 * Integration with infinite-continue-stop-hook system
 */
export declare class InfiniteHookIntegration {
    private readonly config;
    private readonly taskEngine;
    private readonly monitoring;
    private readonly hookConfig;
    private readonly taskManagerApiPath;
    private isIntegrationActive;
    private progressReportingTimer?;
    private lastProgressReport?;
    constructor(config: Config, taskEngine: TaskExecutionEngine, monitoring: ExecutionMonitoringSystem, hookConfig?: Partial<HookIntegrationConfig>);
    /**
     * Initializes integration with the hook system
     */
    initialize(): Promise<void>;
    /**
     * Initializes the agent with the task manager API
     */
    private initializeAgent;
    /**
     * Registers agent capabilities with the task manager
     */
    private registerCapabilities;
    /**
     * Starts periodic checking for new tasks from approved features
     */
    private startPeriodicTaskChecking;
    /**
     * Checks for and processes new tasks from approved features
     */
    private checkAndProcessNewTasks;
    /**
     * Creates a task from an approved feature
     */
    private createTaskFromFeature;
    /**
     * Processes queued tasks by assigning them to our execution engine
     */
    private processQueuedTasks;
    /**
     * Checks if we can handle a task based on capabilities
     */
    private canHandleTask;
    /**
     * Assigns a task to our execution engine
     */
    private assignTaskToEngine;
    /**
     * Starts periodic progress reporting to the hook system
     */
    private startProgressReporting;
    /**
     * Reports progress to the hook system
     */
    private reportProgress;
    /**
     * Executes a command against the task manager API
     */
    private executeTaskManagerCommand;
    /**
     * Maps feature category to task type
     */
    private mapFeatureCategoryToTaskType;
    /**
     * Maps feature priority indicators to task priority
     */
    private mapFeaturePriorityToTaskPriority;
    /**
     * Maps engine task status to hook system status
     */
    private mapEngineStatusToHookStatus;
    /**
     * Authorizes stop when all tasks are complete
     */
    checkAndAuthorizeStop(): Promise<void>;
    /**
     * Shuts down the integration
     */
    shutdown(): Promise<void>;
}
