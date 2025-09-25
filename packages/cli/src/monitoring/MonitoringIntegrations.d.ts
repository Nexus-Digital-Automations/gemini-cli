/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { EventEmitter } from 'node:events';
import { StatusEventType } from './StatusUpdateBroker.js';
/**
 * TodoWrite Integration Interface
 */
export interface TodoWriteTask {
    content: string;
    status: 'pending' | 'in_progress' | 'completed';
    activeForm: string;
    id?: string;
    priority?: 'low' | 'normal' | 'high' | 'critical';
    assignedAgent?: string;
    estimatedDuration?: number;
    dependencies?: string[];
    tags?: string[];
    metadata?: Record<string, unknown>;
}
export interface TodoWriteState {
    tasks: TodoWriteTask[];
    totalTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    pendingTasks: number;
    lastUpdate: Date;
}
/**
 * External System Integration Configuration
 */
export interface ExternalSystemConfig {
    type: 'webhook' | 'api' | 'database' | 'message_queue' | 'file_system';
    name: string;
    endpoint?: string;
    apiKey?: string;
    headers?: Record<string, string>;
    authentication?: {
        type: 'bearer' | 'basic' | 'api_key';
        credentials: Record<string, string>;
    };
    retryConfig?: {
        maxRetries: number;
        retryDelay: number;
        backoffMultiplier: number;
    };
    filterConfig?: {
        eventTypes: StatusEventType[];
        priorityThreshold: 'low' | 'normal' | 'high' | 'critical';
        agentIds?: string[];
    };
}
export interface WebhookPayload {
    eventId: string;
    eventType: StatusEventType;
    timestamp: Date;
    source: string;
    data: Record<string, unknown>;
    system: {
        systemId: string;
        version: string;
        environment: string;
    };
    correlation: {
        sessionId?: string;
        agentId?: string;
        taskId?: string;
    };
}
/**
 * Monitoring Integrations System
 *
 * Comprehensive integration layer providing:
 * - TodoWrite synchronization and bidirectional updates
 * - External system integrations (webhooks, APIs, databases)
 * - Cross-platform status propagation
 * - Third-party monitoring tool integration
 * - Data export and synchronization capabilities
 */
export declare class MonitoringIntegrations extends EventEmitter {
    private readonly logger;
    private todoWriteState;
    private externalSystems;
    private integrationStats;
    constructor();
    /**
     * Register external system for integration
     */
    registerExternalSystem(config: ExternalSystemConfig): void;
    /**
     * Unregister external system
     */
    unregisterExternalSystem(systemName: string): void;
    /**
     * Sync TodoWrite state with task monitoring system
     */
    syncTodoWriteState(todoWriteTasks: TodoWriteTask[]): Promise<void>;
    /**
     * Export monitoring data for external analysis
     */
    exportMonitoringData(format?: 'json' | 'csv' | 'prometheus' | 'influxdb', timeframe?: {
        startDate: Date;
        endDate: Date;
    }): Promise<string>;
    /**
     * Create webhook payload for external system
     */
    createWebhookPayload(eventId: string, eventType: StatusEventType, data: Record<string, unknown>, correlationData?: {
        sessionId?: string;
        agentId?: string;
        taskId?: string;
    }): WebhookPayload;
    /**
     * Send data to external system
     */
    sendToExternalSystem(systemName: string, payload: WebhookPayload): Promise<void>;
    /**
     * Get TodoWrite state
     */
    getTodoWriteState(): TodoWriteState;
    /**
     * Get integration statistics
     */
    getIntegrationStats(): typeof this.integrationStats & {
        registeredSystems: number;
        systemTypes: Record<string, number>;
    };
    /**
     * Test external system connection
     */
    testExternalSystem(systemName: string): Promise<{
        success: boolean;
        responseTime: number;
        error?: string;
    }>;
    private setupIntegrationListeners;
    private syncTaskWithMonitor;
    private updateTodoWriteFromTask;
    private mapTodoWriteStatusToTaskStatus;
    private mapTaskStatusToTodoWriteStatus;
    private generateActiveForm;
    private shouldSendToSystem;
    private sendWebhook;
    private sendApiRequest;
    private sendToDatabase;
    private sendToMessageQueue;
    private writeToFileSystem;
    private buildHeaders;
    private convertToCSV;
    private convertToPrometheusFormat;
    private convertToInfluxDBFormat;
    /**
     * Cleanup resources
     */
    destroy(): void;
}
/**
 * Singleton instance for global access
 */
export declare const monitoringIntegrations: MonitoringIntegrations;
