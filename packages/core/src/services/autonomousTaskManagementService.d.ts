/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Autonomous Task Management Service - Master Orchestrator
 *
 * This is the main service that coordinates all autonomous task management components:
 * - AutonomousTaskIntegrator: Core task orchestration
 * - IntegrationBridge: External system coordination
 * - SystemMonitor: Real-time monitoring and alerting
 * - SystemValidator: Comprehensive validation and readiness checks
 *
 * Provides a unified API for the complete autonomous task management system.
 */
import { EventEmitter } from 'node:events';
import type { Config } from '../index.js';
import { type AutonomousTask, type RegisteredAgent } from './autonomousTaskIntegrator.js';
import { type IntegrationConfig } from './integrationBridge.js';
import { type SystemMetrics, type Alert, type MonitoringConfig } from './systemMonitor.js';
import { type SystemReadinessReport } from './systemValidator.js';
export interface AutonomousTaskManagementConfig {
    integration?: Partial<IntegrationConfig>;
    monitoring?: Partial<MonitoringConfig>;
    autoStart?: boolean;
    validationOnStartup?: boolean;
    productionMode?: boolean;
}
export interface SystemStatus {
    status: 'initializing' | 'ready' | 'degraded' | 'failed';
    uptime: number;
    version: string;
    components: {
        integrator: 'active' | 'inactive' | 'error';
        bridge: 'active' | 'inactive' | 'error';
        monitor: 'active' | 'inactive' | 'error';
        validator: 'active' | 'inactive' | 'error';
    };
    metrics: SystemMetrics | null;
    alerts: Alert[];
    lastValidation?: SystemReadinessReport;
}
/**
 * Master service for autonomous task management system
 */
export declare class AutonomousTaskManagementService extends EventEmitter {
    private config;
    private serviceConfig;
    private taskIntegrator;
    private integrationBridge;
    private systemMonitor;
    private systemValidator;
    private isInitialized;
    private startTime;
    private lastValidationReport?;
    constructor(config: Config, serviceConfig?: AutonomousTaskManagementConfig);
    /**
     * Initialize the complete autonomous task management system
     */
    initialize(): Promise<void>;
    /**
     * Shutdown the system gracefully
     */
    shutdown(): Promise<void>;
    /**
     * Get comprehensive system status
     */
    getSystemStatus(): SystemStatus;
    /**
     * Create a new autonomous task
     */
    createTask(taskConfig: {
        title: string;
        description: string;
        type: 'implementation' | 'testing' | 'documentation' | 'validation' | 'deployment' | 'analysis';
        priority: 'critical' | 'high' | 'normal' | 'low';
        dependencies?: string[];
        requiredCapabilities?: string[];
        featureId?: string;
        metadata?: Record<string, unknown>;
    }): Promise<AutonomousTask>;
    /**
     * Register a new agent with the system
     */
    registerAgent(agentConfig: {
        id: string;
        capabilities: string[];
        maxConcurrentTasks?: number;
    }): Promise<void>;
    /**
     * Create tasks from approved features
     */
    generateTasksFromFeatures(): Promise<AutonomousTask[]>;
    /**
     * Run comprehensive system validation
     */
    validateSystem(): Promise<SystemReadinessReport>;
    /**
     * Get system metrics for dashboard
     */
    getMetrics(): Promise<SystemMetrics>;
    /**
     * Get historical metrics
     */
    getHistoricalMetrics(period?: number): SystemMetrics[];
    /**
     * Get active alerts
     */
    getActiveAlerts(): Alert[];
    /**
     * Get all tasks
     */
    getAllTasks(): AutonomousTask[];
    /**
     * Get all registered agents
     */
    getAllAgents(): RegisteredAgent[];
    /**
     * Execute CLI command with task context
     */
    executeCommand(command: string, args?: string[], taskContext?: {
        taskId: string;
        agentId: string;
    }): Promise<{
        success: boolean;
        output: string;
        error?: string;
    }>;
    /**
     * Handle external API requests
     */
    handleApiRequest(endpoint: string, params?: any[]): Promise<any>;
    /**
     * Get system health summary
     */
    getHealthSummary(): {
        status: 'healthy' | 'warning' | 'critical';
        score: number;
        issues: string[];
        uptime: number;
        lastCheck: Date;
    };
    private setupEventHandlers;
}
