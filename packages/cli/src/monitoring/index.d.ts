/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Real-Time Task Status Monitoring System
 *
 * A comprehensive monitoring solution for autonomous task management providing:
 * - Real-time task and agent status tracking
 * - Event-driven notifications and alerts
 * - Historical analytics and performance insights
 * - Multi-channel notification delivery
 * - External system integrations
 * - Terminal-based visualization dashboards
 *
 * @example Basic Usage
 * ```typescript
 * import {
 *   taskStatusMonitor,
 *   statusUpdateBroker,
 *   notificationSystem
 * } from './monitoring/index.js';
 *
 * // Register a task
 * const taskId = await taskStatusMonitor.registerTask({
 *   title: 'Implement feature',
 *   description: 'Add new functionality',
 *   type: TaskType.IMPLEMENTATION,
 *   priority: TaskPriority.HIGH,
 *   assignedAgent: 'dev-agent',
 *   dependencies: [],
 *   tags: ['feature'],
 *   metadata: {}
 * });
 *
 * // Subscribe to updates
 * statusUpdateBroker.subscribe({
 *   subscriberId: 'my-app',
 *   eventTypes: [StatusEventType.TASK_STATUS_CHANGED],
 *   deliveryMethod: 'realtime'
 * });
 * ```
 */
export { TaskStatusMonitor, TaskStatus, TaskType, TaskPriority, TaskMetadata, TaskStatusUpdate, AgentStatus, taskStatusMonitor } from './TaskStatusMonitor.js';
export { StatusUpdateBroker, StatusEventType, StatusEvent, NotificationConfig, statusUpdateBroker } from './StatusUpdateBroker.js';
export { NotificationSystem, NotificationPreferences, NotificationTemplate, DeliveredNotification, notificationSystem } from './NotificationSystem.js';
export { StatusHistoryAnalytics, AnalyticsTimeframe, TaskAnalytics, AgentAnalytics, SystemAnalytics, StatusHistoryEntry, HistoryQuery, statusHistoryAnalytics } from './StatusHistoryAnalytics.js';
export { MonitoringIntegrations, TodoWriteTask, TodoWriteState, ExternalSystemConfig, WebhookPayload, monitoringIntegrations } from './MonitoringIntegrations.js';
export { StatusDashboard } from './StatusDashboard.js';
/**
 * Initialize the complete monitoring system with default configuration
 *
 * @example
 * ```typescript
 * import { initializeMonitoringSystem } from './monitoring/index.js';
 *
 * const monitoring = await initializeMonitoringSystem({
 *   enableDashboard: true,
 *   enableNotifications: true,
 *   enableAnalytics: true,
 *   enableIntegrations: true
 * });
 * ```
 */
export declare function initializeMonitoringSystem(options?: {
    enableDashboard?: boolean;
    enableNotifications?: boolean;
    enableAnalytics?: boolean;
    enableIntegrations?: boolean;
    dashboardConfig?: {
        autoRefresh?: boolean;
        refreshInterval?: number;
        initialView?: 'overview' | 'tasks' | 'agents' | 'analytics';
    };
}): Promise<{
    taskStatusMonitor: import("./TaskStatusMonitor.js").TaskStatusMonitor;
    statusUpdateBroker: import("./StatusUpdateBroker.js").StatusUpdateBroker;
    notificationSystem: import("./NotificationSystem.js").NotificationSystem | null;
    statusHistoryAnalytics: import("./StatusHistoryAnalytics.js").StatusHistoryAnalytics | null;
    monitoringIntegrations: import("./MonitoringIntegrations.js").MonitoringIntegrations | null;
    dashboard: any;
    /**
     * Cleanup all monitoring resources
     */
    destroy: () => void;
}>;
/**
 * Quick start monitoring setup for common use cases
 */
export declare const MonitoringPresets: {
    /**
     * Minimal monitoring for basic task tracking
     */
    minimal: () => Promise<{
        taskStatusMonitor: import("./TaskStatusMonitor.js").TaskStatusMonitor;
        statusUpdateBroker: import("./StatusUpdateBroker.js").StatusUpdateBroker;
        notificationSystem: import("./NotificationSystem.js").NotificationSystem | null;
        statusHistoryAnalytics: import("./StatusHistoryAnalytics.js").StatusHistoryAnalytics | null;
        monitoringIntegrations: import("./MonitoringIntegrations.js").MonitoringIntegrations | null;
        dashboard: any;
        /**
         * Cleanup all monitoring resources
         */
        destroy: () => void;
    }>;
    /**
     * Development monitoring with dashboard and basic analytics
     */
    development: () => Promise<{
        taskStatusMonitor: import("./TaskStatusMonitor.js").TaskStatusMonitor;
        statusUpdateBroker: import("./StatusUpdateBroker.js").StatusUpdateBroker;
        notificationSystem: import("./NotificationSystem.js").NotificationSystem | null;
        statusHistoryAnalytics: import("./StatusHistoryAnalytics.js").StatusHistoryAnalytics | null;
        monitoringIntegrations: import("./MonitoringIntegrations.js").MonitoringIntegrations | null;
        dashboard: any;
        /**
         * Cleanup all monitoring resources
         */
        destroy: () => void;
    }>;
    /**
     * Production monitoring with full feature set
     */
    production: () => Promise<{
        taskStatusMonitor: import("./TaskStatusMonitor.js").TaskStatusMonitor;
        statusUpdateBroker: import("./StatusUpdateBroker.js").StatusUpdateBroker;
        notificationSystem: import("./NotificationSystem.js").NotificationSystem | null;
        statusHistoryAnalytics: import("./StatusHistoryAnalytics.js").StatusHistoryAnalytics | null;
        monitoringIntegrations: import("./MonitoringIntegrations.js").MonitoringIntegrations | null;
        dashboard: any;
        /**
         * Cleanup all monitoring resources
         */
        destroy: () => void;
    }>;
    /**
     * Full monitoring with dashboard for debugging and analysis
     */
    full: () => Promise<{
        taskStatusMonitor: import("./TaskStatusMonitor.js").TaskStatusMonitor;
        statusUpdateBroker: import("./StatusUpdateBroker.js").StatusUpdateBroker;
        notificationSystem: import("./NotificationSystem.js").NotificationSystem | null;
        statusHistoryAnalytics: import("./StatusHistoryAnalytics.js").StatusHistoryAnalytics | null;
        monitoringIntegrations: import("./MonitoringIntegrations.js").MonitoringIntegrations | null;
        dashboard: any;
        /**
         * Cleanup all monitoring resources
         */
        destroy: () => void;
    }>;
};
/**
 * Utility functions for common monitoring operations
 */
export declare const MonitoringUtils: {
    /**
     * Create a simple task and track its lifecycle
     */
    createAndTrackTask(title: string, description: string, options?: {
        type?: TaskType;
        priority?: TaskPriority;
        assignedAgent?: string;
        tags?: string[];
    }): Promise<string>;
    /**
     * Subscribe to all important status events with a simple callback
     */
    subscribeToAllEvents(callback: (event: any) => void): Promise<() => void>;
    /**
     * Get a snapshot of current system status
     */
    getSystemSnapshot(): Promise<{
        timestamp: string;
        summary: {
            totalTasks: number;
            activeTasks: number;
            completedTasks: number;
            failedTasks: number;
            totalAgents: number;
            activeAgents: number;
            systemEfficiency: number;
        };
        tasks: Array<import("./TaskStatusMonitor.js").TaskMetadata>;
        agents: Array<import("./TaskStatusMonitor.js").AgentStatus>;
        metrics: {
            totalTasks: number;
            completedTasks: number;
            failedTasks: number;
            averageTaskDuration: number;
            systemUptime: Date;
            throughputPerHour: number;
        } & {
            activeAgents: number;
            tasksInProgress: number;
            queuedTasks: number;
            blockedTasks: number;
            systemEfficiency: number;
        };
    }>;
    /**
     * Export current monitoring data for analysis
     */
    exportData(format?: "json" | "csv"): Promise<string>;
};
declare const _default: {
    initializeMonitoringSystem: typeof initializeMonitoringSystem;
    MonitoringPresets: {
        /**
         * Minimal monitoring for basic task tracking
         */
        minimal: () => Promise<{
            taskStatusMonitor: import("./TaskStatusMonitor.js").TaskStatusMonitor;
            statusUpdateBroker: import("./StatusUpdateBroker.js").StatusUpdateBroker;
            notificationSystem: import("./NotificationSystem.js").NotificationSystem | null;
            statusHistoryAnalytics: import("./StatusHistoryAnalytics.js").StatusHistoryAnalytics | null;
            monitoringIntegrations: import("./MonitoringIntegrations.js").MonitoringIntegrations | null;
            dashboard: any;
            /**
             * Cleanup all monitoring resources
             */
            destroy: () => void;
        }>;
        /**
         * Development monitoring with dashboard and basic analytics
         */
        development: () => Promise<{
            taskStatusMonitor: import("./TaskStatusMonitor.js").TaskStatusMonitor;
            statusUpdateBroker: import("./StatusUpdateBroker.js").StatusUpdateBroker;
            notificationSystem: import("./NotificationSystem.js").NotificationSystem | null;
            statusHistoryAnalytics: import("./StatusHistoryAnalytics.js").StatusHistoryAnalytics | null;
            monitoringIntegrations: import("./MonitoringIntegrations.js").MonitoringIntegrations | null;
            dashboard: any;
            /**
             * Cleanup all monitoring resources
             */
            destroy: () => void;
        }>;
        /**
         * Production monitoring with full feature set
         */
        production: () => Promise<{
            taskStatusMonitor: import("./TaskStatusMonitor.js").TaskStatusMonitor;
            statusUpdateBroker: import("./StatusUpdateBroker.js").StatusUpdateBroker;
            notificationSystem: import("./NotificationSystem.js").NotificationSystem | null;
            statusHistoryAnalytics: import("./StatusHistoryAnalytics.js").StatusHistoryAnalytics | null;
            monitoringIntegrations: import("./MonitoringIntegrations.js").MonitoringIntegrations | null;
            dashboard: any;
            /**
             * Cleanup all monitoring resources
             */
            destroy: () => void;
        }>;
        /**
         * Full monitoring with dashboard for debugging and analysis
         */
        full: () => Promise<{
            taskStatusMonitor: import("./TaskStatusMonitor.js").TaskStatusMonitor;
            statusUpdateBroker: import("./StatusUpdateBroker.js").StatusUpdateBroker;
            notificationSystem: import("./NotificationSystem.js").NotificationSystem | null;
            statusHistoryAnalytics: import("./StatusHistoryAnalytics.js").StatusHistoryAnalytics | null;
            monitoringIntegrations: import("./MonitoringIntegrations.js").MonitoringIntegrations | null;
            dashboard: any;
            /**
             * Cleanup all monitoring resources
             */
            destroy: () => void;
        }>;
    };
    MonitoringUtils: {
        /**
         * Create a simple task and track its lifecycle
         */
        createAndTrackTask(title: string, description: string, options?: {
            type?: TaskType;
            priority?: TaskPriority;
            assignedAgent?: string;
            tags?: string[];
        }): Promise<string>;
        /**
         * Subscribe to all important status events with a simple callback
         */
        subscribeToAllEvents(callback: (event: any) => void): Promise<() => void>;
        /**
         * Get a snapshot of current system status
         */
        getSystemSnapshot(): Promise<{
            timestamp: string;
            summary: {
                totalTasks: number;
                activeTasks: number;
                completedTasks: number;
                failedTasks: number;
                totalAgents: number;
                activeAgents: number;
                systemEfficiency: number;
            };
            tasks: Array<import("./TaskStatusMonitor.js").TaskMetadata>;
            agents: Array<import("./TaskStatusMonitor.js").AgentStatus>;
            metrics: {
                totalTasks: number;
                completedTasks: number;
                failedTasks: number;
                averageTaskDuration: number;
                systemUptime: Date;
                throughputPerHour: number;
            } & {
                activeAgents: number;
                tasksInProgress: number;
                queuedTasks: number;
                blockedTasks: number;
                systemEfficiency: number;
            };
        }>;
        /**
         * Export current monitoring data for analysis
         */
        exportData(format?: "json" | "csv"): Promise<string>;
    };
};
export default _default;
