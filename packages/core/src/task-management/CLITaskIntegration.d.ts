/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview CLI Task Management Integration Layer
 *
 * This module provides seamless integration between the autonomous task management
 * system and the Gemini CLI structure, including:
 * - CLI command to task mapping
 * - User interaction management
 * - Progress reporting integration
 * - Configuration management
 * - Hook system integration
 * - Real-time status monitoring
 * - Error reporting and user notifications
 */
import type { Config } from '../config/config.js';
import type { ExtendedTaskState } from './TaskStateManager.js';
import type { Task, TaskId } from './types.js';
/**
 * CLI integration configuration
 */
export interface CLIIntegrationConfig {
    /** Base CLI configuration */
    config: Config;
    /** Enable interactive mode for user confirmations */
    interactiveMode?: boolean;
    /** Enable progress reporting in CLI */
    enableProgressReporting?: boolean;
    /** Progress reporting interval in milliseconds */
    progressIntervalMs?: number;
    /** Enable CLI notifications for task events */
    enableNotifications?: boolean;
    /** CLI output verbosity level */
    verbosity?: 'silent' | 'minimal' | 'normal' | 'verbose' | 'debug';
    /** Hook system integration options */
    hookIntegration?: {
        enabled: boolean;
        agentId?: string;
        capabilities?: string[];
    };
    /** Monitoring integration options */
    monitoring?: {
        enabled: boolean;
        dashboardPort?: number;
        metricsEndpoint?: string;
    };
}
/**
 * CLI task command interface
 */
export interface CLITaskCommand {
    /** Command name */
    name: string;
    /** Command description */
    description: string;
    /** Command arguments */
    args?: string[];
    /** Command options */
    options?: Record<string, unknown>;
    /** Task mapping function */
    mapToTask: (args: string[], options: Record<string, unknown>) => Promise<Task>;
}
/**
 * Task progress information for CLI display
 */
export interface TaskProgressInfo {
    taskId: TaskId;
    title: string;
    state: ExtendedTaskState;
    progress: number;
    estimatedTimeRemaining?: number;
    currentOperation?: string;
    subtasks?: Array<{
        title: string;
        completed: boolean;
        progress: number;
    }>;
}
/**
 * CLI notification event
 */
export interface CLINotification {
    type: 'info' | 'success' | 'warning' | 'error';
    title: string;
    message: string;
    taskId?: TaskId;
    timestamp: Date;
    actions?: Array<{
        label: string;
        action: () => Promise<void>;
    }>;
}
/**
 * CLI task execution result
 */
export interface CLITaskResult {
    success: boolean;
    taskId: TaskId;
    output?: {
        summary: string;
        details?: Record<string, unknown>;
        artifacts?: string[];
    };
    error?: {
        message: string;
        code?: string;
        suggestions?: string[];
    };
    metrics?: {
        duration: number;
        resourcesUsed: string[];
        qualityGatesPassed: number;
        recoveryAttempts: number;
    };
}
/**
 * CLI Task Management Integration
 */
export declare class CLITaskIntegration {
    private config;
    private readonly taskManager;
    private readonly stateManager;
    private readonly executionEngine;
    private readonly commands;
    private readonly activeProgressReporters;
    private readonly notificationQueue;
    private isInitialized;
    private lastStatusUpdate;
    constructor(config: CLIIntegrationConfig);
    /**
     * Initialize the integration system
     */
    initialize(): Promise<void>;
    /**
     * Register a CLI command that maps to task execution
     */
    registerCommand(command: CLITaskCommand): void;
    /**
     * Execute a CLI command as a task
     */
    executeCommand(commandName: string, args?: string[], options?: Record<string, unknown>): Promise<CLITaskResult>;
    /**
     * Get current task status for CLI display
     */
    getTaskProgress(taskId: TaskId): TaskProgressInfo | null;
    /**
     * List all active tasks for CLI status display
     */
    listActiveTasks(): TaskProgressInfo[];
    /**
     * Cancel a running task
     */
    cancelTask(taskId: TaskId, reason?: string): Promise<boolean>;
    /**
     * Get comprehensive system status for CLI dashboard
     */
    getSystemStatus(): {
        isRunning: boolean;
        tasksActive: number;
        tasksCompleted: number;
        tasksFailed: number;
        systemLoad: number;
        autonomousMode: boolean;
        lastUpdate: Date;
    };
    /**
     * Initialize built-in CLI commands
     */
    private initializeBuiltinCommands;
    /**
     * Setup event listeners for task management events
     */
    private setupEventListeners;
    /**
     * Handle task state changes
     */
    private handleStateChange;
    /**
     * Handle task completion
     */
    private handleTaskCompletion;
    /**
     * Handle task failure
     */
    private handleTaskFailure;
    /**
     * Progress reporting management
     */
    private startProgressReporting;
    private stopProgressReporting;
    private updateProgressDisplay;
    private updateGlobalProgress;
    /**
     * Notification system
     */
    private notify;
    private startNotificationProcessing;
    private displayNotification;
    /**
     * Wait for task completion
     */
    private waitForTaskCompletion;
    /**
     * Helper methods
     */
    private estimateRemainingTime;
    private getCurrentOperation;
    private getSubtasks;
    private generateErrorSuggestions;
    /**
     * Shutdown integration
     */
    shutdown(): Promise<void>;
}
/**
 * Factory function for creating CLI integration
 */
export declare function createCLITaskIntegration(config: CLIIntegrationConfig): Promise<CLITaskIntegration>;
/**
 * Export types and utilities
 */
export type { CLIIntegrationConfig, CLITaskCommand, TaskProgressInfo, CLINotification, CLITaskResult, };
