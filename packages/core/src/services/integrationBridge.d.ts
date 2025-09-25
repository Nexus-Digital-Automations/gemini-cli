/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { EventEmitter } from 'node:events';
import type { Config } from '../index.js';
import { type AutonomousTask } from './autonomousTaskIntegrator.js';
export interface TaskManagerApiResponse {
    success: boolean;
    error?: string;
    [key: string]: any;
}
export interface IntegrationConfig {
    taskManagerApiPath: string;
    projectRoot: string;
    enableCrossSessionPersistence: boolean;
    enableRealTimeUpdates: boolean;
    agentHeartbeatInterval: number;
    taskSyncInterval: number;
    cliCommandsIntegration: boolean;
    autoStartTaskProcessing: boolean;
    maxConcurrentTasks: number;
}
/**
 * Bridge service that coordinates all autonomous task management components
 */
export declare class IntegrationBridge extends EventEmitter {
    private config;
    private integrationConfig;
    private taskIntegrator;
    private syncTimer?;
    private heartbeatTimer?;
    private isInitialized;
    constructor(config: Config, integrationConfig?: Partial<IntegrationConfig>);
    /**
     * Initialize the integration bridge and all components
     */
    initialize(): Promise<void>;
    /**
     * Create task from approved feature in FEATURES.json
     */
    createTaskFromFeature(featureId: string, options?: any): Promise<AutonomousTask>;
    /**
     * Auto-generate tasks from all approved features
     */
    generateTasksFromApprovedFeatures(): Promise<AutonomousTask[]>;
    /**
     * Register agent with both the integrator and TaskManager API
     */
    registerAgent(agentConfig: {
        id: string;
        capabilities: string[];
        maxConcurrentTasks?: number;
    }): Promise<void>;
    /**
     * Update task progress across all systems
     */
    updateTaskProgress(taskId: string, progressUpdate: {
        status?: string;
        progress_percentage?: number;
        notes?: string;
        updated_by?: string;
        metadata?: Record<string, unknown>;
    }): Promise<void>;
    /**
     * Get comprehensive system status
     */
    getSystemStatus(): Promise<{
        bridge: {
            status: string;
            uptime: number;
        };
        integrator: any;
        taskManagerApi: any;
        sync: {
            lastSync: Date;
            syncInterval: number;
        };
    }>;
    /**
     * Execute CLI command with task context
     */
    executeCliCommand(command: string, args?: string[], taskContext?: {
        taskId: string;
        agentId: string;
    }): Promise<{
        success: boolean;
        output: string;
        error?: string;
    }>;
    /**
     * Get CLI integration status and available commands
     */
    getCliIntegrationStatus(): {
        enabled: boolean;
        availableCommands: string[];
        integrationMode: string;
    };
    /**
     * Handle API requests directly from external tools
     */
    handleExternalApiRequest(endpoint: string, params?: any[]): Promise<any>;
    /**
     * Shutdown the integration bridge gracefully
     */
    shutdown(): Promise<void>;
    private setupEventHandlers;
    private syncWithTaskManagerAPI;
    private startPeriodicSync;
    private syncTaskCompletion;
    private spawnCommand;
    private callTaskManagerAPI;
}
