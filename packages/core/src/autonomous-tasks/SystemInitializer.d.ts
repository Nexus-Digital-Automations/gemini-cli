/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Config } from '../config/config.js';
import type { TaskType } from '../task-management/TaskExecutionEngine.js';
import { EventEmitter } from 'node:events';
/**
 * @fileoverview System Initializer for Autonomous Task Management
 *
 * This module provides comprehensive initialization and management of the autonomous
 * task management system, handling startup, shutdown, persistence, and coordination
 * of all system components.
 */
/**
 * System configuration interface
 */
export interface SystemConfig {
    /** Persistence configuration */
    persistenceConfig: {
        type: 'file' | 'database' | 'memory';
        path?: string;
        connectionString?: string;
    };
    /** Logging configuration */
    logging: {
        level: 'debug' | 'info' | 'warn' | 'error';
        output: 'console' | 'file';
        filePath?: string;
    };
    /** Agent coordination settings */
    agentConfig?: {
        maxConcurrentAgents: number;
        heartbeatInterval: number;
        sessionTimeout: number;
    };
    /** Quality gates configuration */
    qualityConfig?: {
        enableLinting: boolean;
        enableTesting: boolean;
        enableSecurity: boolean;
        enablePerformance: boolean;
    };
    /** Feature integration settings */
    featureConfig?: {
        featuresFilePath: string;
        requireApproval: boolean;
        autoRejectTimeout: number;
    };
    /** Monitoring configuration */
    monitoring?: {
        enableMetrics: boolean;
        metricsInterval: number;
        alertThresholds: Record<string, number>;
    };
}
/**
 * System status information
 */
export interface SystemStatus {
    isRunning: boolean;
    pid?: number;
    startTime: Date;
    uptime: number;
    activeAgents: number;
    taskQueue: {
        queued: number;
        running: number;
        completed: number;
        failed: number;
    };
    resources: {
        memoryUsage: NodeJS.MemoryUsage;
        cpuUsage: NodeJS.CpuUsage;
    };
    health: 'healthy' | 'degraded' | 'critical';
    lastHeartbeat: Date;
}
/**
 * Agent information
 */
export interface AgentInfo {
    id: string;
    type: string;
    status: 'active' | 'idle' | 'busy' | 'error';
    currentTask?: string;
    capabilities: string[];
    lastHeartbeat: Date;
    sessionId: string;
}
/**
 * Comprehensive System Initializer for Autonomous Task Management
 *
 * Manages the complete lifecycle of the autonomous task management system,
 * including initialization, monitoring, persistence, and graceful shutdown.
 */
export declare class SystemInitializer extends EventEmitter {
    private readonly coreConfig;
    private readonly systemConfig;
    private taskExecutionEngine?;
    private taskQueue?;
    private isRunning;
    private startTime?;
    private lastCpuUsage?;
    private heartbeatTimer?;
    private metricsTimer?;
    private statusFile?;
    private pidFile?;
    private activeAgents;
    private agentTimeouts;
    constructor(coreConfig: Config, systemConfig: SystemConfig);
    /**
     * Initialize the autonomous task management system
     */
    initialize(): Promise<void>;
    /**
     * Initialize core system components
     */
    private initializeCoreComponents;
    /**
     * Load persisted system state
     */
    private loadPersistedState;
    /**
     * Start system monitoring
     */
    private startMonitoring;
    /**
     * Register a new agent with the system
     */
    registerAgent(agentId: string, type: string, capabilities: string[], sessionId: string): Promise<void>;
    /**
     * Update agent heartbeat
     */
    agentHeartbeat(agentId: string, status?: 'active' | 'idle' | 'busy' | 'error', currentTask?: string): Promise<void>;
    /**
     * Unregister an agent
     */
    unregisterAgent(agentId: string, reason?: string): Promise<void>;
    /**
     * Queue a new task for autonomous execution
     */
    queueTask(title: string, description: string, options?: {
        type?: TaskType;
        priority?: number;
        expectedOutputs?: Record<string, string>;
        context?: Record<string, unknown>;
        maxExecutionTimeMinutes?: number;
    }): Promise<string>;
    /**
     * Get current system status
     */
    getSystemStatus(): SystemStatus;
    /**
     * Get list of active agents
     */
    getActiveAgents(): AgentInfo[];
    /**
     * Gracefully shutdown the system
     */
    shutdown(timeoutMs?: number): Promise<void>;
    /**
     * Setup signal handlers for graceful shutdown
     */
    private setupSignalHandlers;
    /**
     * Reset agent timeout
     */
    private resetAgentTimeout;
    /**
     * Handle agent timeout
     */
    private handleAgentTimeout;
    /**
     * Check for agent timeouts
     */
    private checkAgentTimeouts;
    /**
     * Update system state file
     */
    private updateSystemState;
    /**
     * Save system state for persistence
     */
    private saveSystemState;
    /**
     * Collect system metrics
     */
    private collectMetrics;
    /**
     * Stop monitoring systems
     */
    private stopMonitoring;
    /**
     * Write PID file
     */
    private writePidFile;
    /**
     * Cleanup system resources
     */
    private cleanup;
    /**
     * Check if file exists
     */
    private fileExists;
}
