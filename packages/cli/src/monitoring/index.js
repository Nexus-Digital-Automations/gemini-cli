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
// Core monitoring components
export { TaskStatusMonitor, TaskStatus, TaskType, TaskPriority, TaskMetadata, TaskStatusUpdate, AgentStatus, taskStatusMonitor } from './TaskStatusMonitor.js';
export { StatusUpdateBroker, StatusEventType, StatusEvent, NotificationConfig, statusUpdateBroker } from './StatusUpdateBroker.js';
export { NotificationSystem, NotificationPreferences, NotificationTemplate, DeliveredNotification, notificationSystem } from './NotificationSystem.js';
export { StatusHistoryAnalytics, AnalyticsTimeframe, TaskAnalytics, AgentAnalytics, SystemAnalytics, StatusHistoryEntry, HistoryQuery, statusHistoryAnalytics } from './StatusHistoryAnalytics.js';
export { MonitoringIntegrations, TodoWriteTask, TodoWriteState, ExternalSystemConfig, WebhookPayload, monitoringIntegrations } from './MonitoringIntegrations.js';
// Dashboard and visualization
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
export async function initializeMonitoringSystem(options = {}) {
    const { enableDashboard = false, enableNotifications = true, enableAnalytics = true, enableIntegrations = true, dashboardConfig = {} } = options;
    // Import singleton instances
    const { taskStatusMonitor } = await import('./TaskStatusMonitor.js');
    const { statusUpdateBroker } = await import('./StatusUpdateBroker.js');
    const { notificationSystem } = await import('./NotificationSystem.js');
    const { statusHistoryAnalytics } = await import('./StatusHistoryAnalytics.js');
    const { monitoringIntegrations } = await import('./MonitoringIntegrations.js');
    let dashboard = null;
    if (enableDashboard) {
        const { StatusDashboard } = await import('./StatusDashboard.js');
        dashboard = new StatusDashboard({
            autoRefresh: dashboardConfig.autoRefresh ?? true,
            refreshInterval: dashboardConfig.refreshInterval ?? 5000,
            initialView: dashboardConfig.initialView ?? 'overview'
        });
    }
    return {
        taskStatusMonitor,
        statusUpdateBroker,
        notificationSystem: enableNotifications ? notificationSystem : null,
        statusHistoryAnalytics: enableAnalytics ? statusHistoryAnalytics : null,
        monitoringIntegrations: enableIntegrations ? monitoringIntegrations : null,
        dashboard,
        /**
         * Cleanup all monitoring resources
         */
        destroy: () => {
            taskStatusMonitor.destroy();
            statusUpdateBroker.destroy();
            if (enableNotifications)
                notificationSystem.destroy();
            if (enableAnalytics)
                statusHistoryAnalytics.destroy();
            if (enableIntegrations)
                monitoringIntegrations.destroy();
        }
    };
}
/**
 * Quick start monitoring setup for common use cases
 */
export const MonitoringPresets = {
    /**
     * Minimal monitoring for basic task tracking
     */
    minimal: () => initializeMonitoringSystem({
        enableDashboard: false,
        enableNotifications: false,
        enableAnalytics: false,
        enableIntegrations: false
    }),
    /**
     * Development monitoring with dashboard and basic analytics
     */
    development: () => initializeMonitoringSystem({
        enableDashboard: true,
        enableNotifications: true,
        enableAnalytics: true,
        enableIntegrations: false,
        dashboardConfig: {
            autoRefresh: true,
            refreshInterval: 3000,
            initialView: 'overview'
        }
    }),
    /**
     * Production monitoring with full feature set
     */
    production: () => initializeMonitoringSystem({
        enableDashboard: false,
        enableNotifications: true,
        enableAnalytics: true,
        enableIntegrations: true
    }),
    /**
     * Full monitoring with dashboard for debugging and analysis
     */
    full: () => initializeMonitoringSystem({
        enableDashboard: true,
        enableNotifications: true,
        enableAnalytics: true,
        enableIntegrations: true,
        dashboardConfig: {
            autoRefresh: true,
            refreshInterval: 5000,
            initialView: 'overview'
        }
    })
};
/**
 * Utility functions for common monitoring operations
 */
export const MonitoringUtils = {
    /**
     * Create a simple task and track its lifecycle
     */
    async createAndTrackTask(title, description, options = {}) {
        const { taskStatusMonitor } = await import('./TaskStatusMonitor.js');
        const { TaskType, TaskPriority } = await import('./TaskStatusMonitor.js');
        return taskStatusMonitor.registerTask({
            title,
            description,
            type: options.type ?? TaskType.IMPLEMENTATION,
            priority: options.priority ?? TaskPriority.NORMAL,
            assignedAgent: options.assignedAgent,
            dependencies: [],
            tags: options.tags ?? [],
            metadata: { source: 'monitoring_utils' }
        });
    },
    /**
     * Subscribe to all important status events with a simple callback
     */
    async subscribeToAllEvents(callback) {
        const { statusUpdateBroker, StatusEventType } = await import('./StatusUpdateBroker.js');
        const subscriberId = `utils_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        statusUpdateBroker.subscribe({
            subscriberId,
            eventTypes: Object.values(StatusEventType),
            deliveryMethod: 'realtime'
        });
        statusUpdateBroker.on(`delivery:${subscriberId}`, ({ event }) => {
            callback(event);
        });
        return () => statusUpdateBroker.unsubscribe(subscriberId);
    },
    /**
     * Get a snapshot of current system status
     */
    async getSystemSnapshot() {
        const { taskStatusMonitor } = await import('./TaskStatusMonitor.js');
        const tasks = taskStatusMonitor.getAllTasks();
        const agents = taskStatusMonitor.getAllAgents();
        const metrics = taskStatusMonitor.getPerformanceMetrics();
        return {
            timestamp: new Date().toISOString(),
            summary: {
                totalTasks: tasks.length,
                activeTasks: tasks.filter(t => t.status === 'in_progress').length,
                completedTasks: tasks.filter(t => t.status === 'completed').length,
                failedTasks: tasks.filter(t => t.status === 'failed').length,
                totalAgents: agents.length,
                activeAgents: agents.filter(a => a.status !== 'offline').length,
                systemEfficiency: metrics.systemEfficiency
            },
            tasks,
            agents,
            metrics
        };
    },
    /**
     * Export current monitoring data for analysis
     */
    async exportData(format = 'json') {
        const { monitoringIntegrations } = await import('./MonitoringIntegrations.js');
        return monitoringIntegrations.exportMonitoringData(format);
    }
};
// Default export for convenience
export default {
    initializeMonitoringSystem,
    MonitoringPresets,
    MonitoringUtils
};
//# sourceMappingURL=index.js.map