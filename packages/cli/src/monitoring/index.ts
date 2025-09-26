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
export { TaskStatusMonitor, taskStatusMonitor } from './TaskStatusMonitor.js';
export type {
  TaskStatus,
  TaskType,
  TaskPriority,
  TaskMetadata,
  TaskStatusUpdate,
  AgentStatus,
} from './TaskStatusMonitor.js';

export {
  StatusUpdateBroker,
  statusUpdateBroker,
} from './StatusUpdateBroker.js';
export type {
  StatusEventType,
  StatusEvent,
  NotificationConfig,
} from './StatusUpdateBroker.js';

export {
  NotificationSystem,
  notificationSystem,
} from './NotificationSystem.js';
export type {
  NotificationPreferences,
  NotificationTemplate,
  DeliveredNotification,
} from './NotificationSystem.js';

export {
  StatusHistoryAnalytics,
  statusHistoryAnalytics,
} from './StatusHistoryAnalytics.js';
export type {
  AnalyticsTimeframe,
  TaskAnalytics,
  AgentAnalytics,
  SystemAnalytics,
  StatusHistoryEntry,
  HistoryQuery,
} from './StatusHistoryAnalytics.js';

export {
  MonitoringIntegrations,
  monitoringIntegrations,
} from './MonitoringIntegrations.js';
export type {
  TodoWriteTask,
  TodoWriteState,
  ExternalSystemConfig,
  WebhookPayload,
} from './MonitoringIntegrations.js';

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
export async function initializeMonitoringSystem(
  options: {
    enableDashboard?: boolean;
    enableNotifications?: boolean;
    enableAnalytics?: boolean;
    enableIntegrations?: boolean;
    dashboardConfig?: {
      autoRefresh?: boolean;
      refreshInterval?: number;
      initialView?: 'overview' | 'tasks' | 'agents' | 'analytics';
    };
  } = {},
) {
  const {
    enableDashboard = false,
    enableNotifications = true,
    enableAnalytics = true,
    enableIntegrations = true,
    dashboardConfig = {},
  } = options;

  // Import singleton instances
  const { taskStatusMonitor } = await import('./TaskStatusMonitor.js');
  const { statusUpdateBroker } = await import('./StatusUpdateBroker.js');
  const { notificationSystem } = await import('./NotificationSystem.js');
  const { statusHistoryAnalytics } = await import(
    './StatusHistoryAnalytics.js'
  );
  const { monitoringIntegrations } = await import(
    './MonitoringIntegrations.js'
  );

  let dashboard: unknown = null;

  if (enableDashboard) {
    // StatusDashboard is a React component, not a class constructor
    // It would be instantiated by a React renderer, not with 'new'
    dashboard = {
      autoRefresh: dashboardConfig.autoRefresh ?? true,
      refreshInterval: dashboardConfig.refreshInterval ?? 5000,
      initialView: dashboardConfig.initialView ?? 'overview',
    };
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
      if (enableNotifications) notificationSystem.destroy();
      if (enableAnalytics) statusHistoryAnalytics.destroy();
      if (enableIntegrations) monitoringIntegrations.destroy();
    },
  };
}

/**
 * Quick start monitoring setup for common use cases
 */
export const MonitoringPresets = {
  /**
   * Minimal monitoring for basic task tracking
   */
  minimal: () =>
    initializeMonitoringSystem({
      enableDashboard: false,
      enableNotifications: false,
      enableAnalytics: false,
      enableIntegrations: false,
    }),

  /**
   * Development monitoring with dashboard and basic analytics
   */
  development: () =>
    initializeMonitoringSystem({
      enableDashboard: true,
      enableNotifications: true,
      enableAnalytics: true,
      enableIntegrations: false,
      dashboardConfig: {
        autoRefresh: true,
        refreshInterval: 3000,
        initialView: 'overview',
      },
    }),

  /**
   * Production monitoring with full feature set
   */
  production: () =>
    initializeMonitoringSystem({
      enableDashboard: false,
      enableNotifications: true,
      enableAnalytics: true,
      enableIntegrations: true,
    }),

  /**
   * Full monitoring with dashboard for debugging and analysis
   */
  full: () =>
    initializeMonitoringSystem({
      enableDashboard: true,
      enableNotifications: true,
      enableAnalytics: true,
      enableIntegrations: true,
      dashboardConfig: {
        autoRefresh: true,
        refreshInterval: 5000,
        initialView: 'overview',
      },
    }),
};

/**
 * Utility functions for common monitoring operations
 */
export const MonitoringUtils = {
  /**
   * Create a simple task and track its lifecycle
   */
  async createAndTrackTask(
    title: string,
    description: string,
    options: {
      type?: string;
      priority?: string;
      assignedAgent?: string;
      tags?: string[];
    } = {},
  ) {
    const { taskStatusMonitor } = await import('./TaskStatusMonitor.js');
    const { TaskType, TaskPriority } = await import('./TaskStatusMonitor.js');

    return taskStatusMonitor.registerTask({
      title,
      description,
      type: (options.type as keyof typeof TaskType)
        ? TaskType[options.type as keyof typeof TaskType]
        : TaskType.IMPLEMENTATION,
      priority: (options.priority as keyof typeof TaskPriority)
        ? TaskPriority[options.priority as keyof typeof TaskPriority]
        : TaskPriority.NORMAL,
      assignedAgent: options.assignedAgent,
      dependencies: [],
      tags: options.tags ?? [],
      metadata: { source: 'monitoring_utils' },
    });
  },

  /**
   * Subscribe to all important status events with a simple callback
   */
  async subscribeToAllEvents(callback: (event: unknown) => void) {
    const { statusUpdateBroker, StatusEventType } = await import(
      './StatusUpdateBroker.js'
    );

    const subscriberId = `utils_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    statusUpdateBroker.subscribe({
      subscriberId,
      eventTypes: Object.values(StatusEventType),
      deliveryMethod: 'realtime',
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
        activeTasks: tasks.filter((t) => t.status === 'in_progress').length,
        completedTasks: tasks.filter((t) => t.status === 'completed').length,
        failedTasks: tasks.filter((t) => t.status === 'failed').length,
        totalAgents: agents.length,
        activeAgents: agents.filter((a) => a.status !== 'offline').length,
        systemEfficiency: metrics.systemEfficiency,
      },
      tasks,
      agents,
      metrics,
    };
  },

  /**
   * Export current monitoring data for analysis
   */
  async exportData(format: 'json' | 'csv' = 'json') {
    const { monitoringIntegrations } = await import(
      './MonitoringIntegrations.js'
    );

    return monitoringIntegrations.exportMonitoringData(format);
  },
};

// Advanced Monitoring Components
export {
  RealTimeMonitoringSystem,
  type MonitoringSnapshot,
  type MonitoringEvent,
  type AlertRule,
  type PredictiveInsight,
  realTimeMonitoringSystem,
} from './RealTimeMonitoringSystem.js';

export {
  EnhancedMonitoringDashboard,
  type DashboardWidget,
  type DashboardLayout,
  type DashboardData,
  type ChartData,
  enhancedMonitoringDashboard,
} from './EnhancedMonitoringDashboard.js';

export {
  MonitoringIntegrationHub,
  type MonitoringIntegrationConfig,
  type CrossSystemEvent,
  type HealthCheckResult,
  monitoringIntegrationHub,
} from './MonitoringIntegrationHub.js';

// Note: MonitoringDeploymentManager available in deployment/MonitoringDeploymentGuide.js
// Import directly when needed to avoid ESLint import restrictions

// Named exports for convenience (avoiding default export lint warning)
export const MonitoringSystemExports = {
  initializeMonitoringSystem,
  MonitoringPresets,
  MonitoringUtils,
};
