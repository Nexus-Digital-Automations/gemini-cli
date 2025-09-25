/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { StatusEventType } from './StatusUpdateBroker.js';
export interface AnalyticsTimeframe {
    startDate: Date;
    endDate: Date;
    granularity: 'hour' | 'day' | 'week' | 'month';
}
export interface TaskAnalytics {
    totalTasks: number;
    completedTasks: number;
    failedTasks: number;
    inProgressTasks: number;
    queuedTasks: number;
    averageCompletionTime: number;
    completionRate: number;
    failureRate: number;
    tasksByType: Record<string, number>;
    tasksByPriority: Record<string, number>;
    tasksByAgent: Record<string, number>;
    timeSeriesData: {
        timestamp: Date;
        completed: number;
        failed: number;
        started: number;
        queued: number;
    }[];
}
export interface AgentAnalytics {
    totalAgents: number;
    activeAgents: number;
    idleAgents: number;
    busyAgents: number;
    offlineAgents: number;
    averageTasksPerAgent: number;
    topPerformers: {
        agentId: string;
        completedTasks: number;
        successRate: number;
        averageTaskTime: number;
    }[];
    agentEfficiency: Record<string, {
        tasksCompleted: number;
        tasksStarted: number;
        averageCompletionTime: number;
        successRate: number;
        capabilities: string[];
    }>;
}
export interface SystemAnalytics {
    systemUptime: number;
    totalEvents: number;
    eventsPerHour: number;
    systemEfficiency: number;
    bottlenecks: {
        type: 'agent_capacity' | 'task_queue' | 'dependency_chain' | 'resource_constraint';
        description: string;
        severity: 'low' | 'medium' | 'high' | 'critical';
        affectedTasks: string[];
        suggestedResolution: string;
    }[];
    trends: {
        taskCompletionTrend: 'improving' | 'stable' | 'declining';
        agentUtilizationTrend: 'improving' | 'stable' | 'declining';
        errorRateTrend: 'improving' | 'stable' | 'declining';
    };
}
export interface StatusHistoryEntry {
    id: string;
    timestamp: Date;
    eventType: StatusEventType;
    objectType: 'task' | 'agent' | 'system';
    objectId: string;
    previousState?: any;
    newState?: any;
    metadata: Record<string, unknown>;
    context: {
        agentId?: string;
        sessionId?: string;
        correlationId?: string;
    };
}
export interface HistoryQuery {
    objectType?: 'task' | 'agent' | 'system';
    objectIds?: string[];
    eventTypes?: StatusEventType[];
    dateRange?: {
        start: Date;
        end: Date;
    };
    agentIds?: string[];
    limit?: number;
    offset?: number;
    sortBy?: 'timestamp' | 'eventType' | 'objectId';
    sortOrder?: 'asc' | 'desc';
}
/**
 * Status History & Analytics System
 *
 * Comprehensive tracking and analysis system providing:
 * - Complete status history with detailed audit trails
 * - Advanced analytics and performance metrics
 * - Trend analysis and bottleneck detection
 * - Predictive insights and recommendations
 * - Cross-session persistence and correlation
 */
export declare class StatusHistoryAnalytics {
    private readonly logger;
    private statusHistory;
    private correlationIndex;
    private objectIndex;
    private agentIndex;
    private eventTypeIndex;
    private analyticsCache;
    private persistenceInterval?;
    constructor();
    /**
     * Record a status history entry
     */
    recordHistoryEntry(eventType: StatusEventType, objectType: 'task' | 'agent' | 'system', objectId: string, options?: {
        previousState?: any;
        newState?: any;
        metadata?: Record<string, unknown>;
        agentId?: string;
        sessionId?: string;
        correlationId?: string;
    }): Promise<string>;
    /**
     * Query status history with flexible filtering
     */
    queryHistory(query: HistoryQuery): StatusHistoryEntry[];
    /**
     * Get comprehensive task analytics
     */
    getTaskAnalytics(timeframe: AnalyticsTimeframe): Promise<TaskAnalytics>;
    /**
     * Get comprehensive agent analytics
     */
    getAgentAnalytics(timeframe: AnalyticsTimeframe): Promise<AgentAnalytics>;
    /**
     * Get comprehensive system analytics
     */
    getSystemAnalytics(timeframe: AnalyticsTimeframe): Promise<SystemAnalytics>;
    /**
     * Detect system bottlenecks and performance issues
     */
    detectBottlenecks(timeframe: AnalyticsTimeframe): Promise<SystemAnalytics['bottlenecks']>;
    /**
     * Get correlation chain for a specific event
     */
    getCorrelationChain(correlationId: string): StatusHistoryEntry[];
    /**
     * Get object timeline (all events for a specific object)
     */
    getObjectTimeline(objectId: string): StatusHistoryEntry[];
    /**
     * Get agent activity history
     */
    getAgentActivity(agentId: string, timeframe?: AnalyticsTimeframe): StatusHistoryEntry[];
    /**
     * Export history data for external analysis
     */
    exportHistoryData(query: HistoryQuery, format?: 'json' | 'csv' | 'tsv'): string;
    private setupEventListeners;
    private setupPeriodicAnalytics;
    private calculateTaskMetrics;
    private calculateAgentMetrics;
    private calculateSystemMetrics;
    private generateTimeSeriesData;
    private getBucketKey;
    private parseBucketKey;
    private advanceDate;
    private updateIndices;
    private getFromCache;
    private setCache;
    private invalidateAnalyticsCache;
    private convertToCSV;
    private convertToTSV;
    private performMaintenanceTasks;
    private rebuildIndices;
    private generateEntryId;
    /**
     * Cleanup resources
     */
    destroy(): void;
}
/**
 * Singleton instance for global access
 */
export declare const statusHistoryAnalytics: StatusHistoryAnalytics;
