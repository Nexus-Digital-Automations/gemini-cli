/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { EventEmitter } from 'node:events';
import type { TaskStatusUpdate, AgentStatus, TaskMetadata } from './TaskStatusMonitor.js';
/**
 * Event types for the status update system
 */
export declare enum StatusEventType {
    TASK_REGISTERED = "task:registered",
    TASK_STATUS_CHANGED = "task:status-changed",
    TASK_PROGRESS_UPDATED = "task:progress-updated",
    TASK_COMPLETED = "task:completed",
    TASK_FAILED = "task:failed",
    TASK_BLOCKED = "task:blocked",
    AGENT_REGISTERED = "agent:registered",
    AGENT_STATUS_CHANGED = "agent:status-changed",
    AGENT_HEARTBEAT = "agent:heartbeat",
    AGENT_OFFLINE = "agent:offline",
    SYSTEM_ALERT = "system:alert",
    PERFORMANCE_THRESHOLD = "performance:threshold"
}
export interface StatusEvent {
    id: string;
    type: StatusEventType;
    timestamp: Date;
    source: string;
    data: Record<string, unknown>;
    priority: 'low' | 'normal' | 'high' | 'critical';
    tags: string[];
}
export interface NotificationConfig {
    subscriberId: string;
    eventTypes: StatusEventType[];
    filters?: {
        agentIds?: string[];
        taskTypes?: string[];
        priorityThreshold?: 'low' | 'normal' | 'high' | 'critical';
        tags?: string[];
    };
    deliveryMethod: 'realtime' | 'batched' | 'webhook';
    batchInterval?: number;
    webhookUrl?: string;
}
/**
 * Status Update Broker - Event-driven notification system
 *
 * Manages real-time status updates, event routing, and notification delivery
 * with comprehensive filtering, batching, and delivery mechanisms.
 */
export declare class StatusUpdateBroker extends EventEmitter {
    private readonly logger;
    private subscribers;
    private eventQueue;
    private batchedEvents;
    private webhookQueue;
    private processingInterval?;
    private performanceMetrics;
    constructor();
    /**
     * Subscribe to status updates with comprehensive filtering options
     */
    subscribe(config: NotificationConfig): void;
    /**
     * Unsubscribe from status updates
     */
    unsubscribe(subscriberId: string): void;
    /**
     * Publish a status event to all relevant subscribers
     */
    publishEvent(type: StatusEventType, data: Record<string, unknown>, options?: {
        source?: string;
        priority?: 'low' | 'normal' | 'high' | 'critical';
        tags?: string[];
    }): Promise<void>;
    /**
     * Get current broker performance metrics
     */
    getMetrics(): typeof this.performanceMetrics & {
        queuedEvents: number;
        batchedSubscribers: number;
        webhookSubscribers: number;
    };
    /**
     * Get event history with optional filtering
     */
    getEventHistory(filters?: {
        eventTypes?: StatusEventType[];
        source?: string;
        priority?: 'low' | 'normal' | 'high' | 'critical';
        tags?: string[];
        since?: Date;
    }, limit?: number): StatusEvent[];
    /**
     * Force delivery of batched events for a subscriber
     */
    flushBatchedEvents(subscriberId: string): Promise<void>;
    /**
     * Create a task-specific event publisher
     */
    createTaskEventPublisher(taskId: string, agentId?: string): {
        registered: (task: TaskMetadata) => Promise<void>;
        statusChanged: (task: TaskMetadata, update: TaskStatusUpdate) => Promise<void>;
        progressUpdated: (task: TaskMetadata, progress: number) => Promise<void>;
        completed: (task: TaskMetadata, duration?: number) => Promise<void>;
        failed: (task: TaskMetadata, error: string) => Promise<void>;
        blocked: (task: TaskMetadata, reason: string, blockedBy?: string[]) => Promise<void>;
    };
    /**
     * Create an agent-specific event publisher
     */
    createAgentEventPublisher(agentId: string): {
        registered: (agent: AgentStatus) => Promise<void>;
        statusChanged: (agent: AgentStatus) => Promise<void>;
        heartbeat: (agent: AgentStatus) => Promise<void>;
        offline: (agent: AgentStatus, reason?: string) => Promise<void>;
    };
    private processEvent;
    private getRelevantSubscribers;
    private deliverRealtimeEvent;
    private queueBatchedEvent;
    private queueWebhookEvent;
    private deliverBatchedEvents;
    private setupEventProcessing;
    private processBatchedEvents;
    private processWebhookEvents;
    private cleanupOldEvents;
    private generateEventId;
    private updateProcessingMetrics;
    /**
     * Cleanup resources
     */
    destroy(): void;
}
/**
 * Singleton instance for global access
 */
export declare const statusUpdateBroker: StatusUpdateBroker;
