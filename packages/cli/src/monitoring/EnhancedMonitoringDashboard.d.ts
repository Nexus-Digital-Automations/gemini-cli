/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { EventEmitter } from 'node:events';
/**
 * Dashboard widget configuration
 */
export interface DashboardWidget {
    id: string;
    type: 'metric' | 'chart' | 'table' | 'alert_panel' | 'trend' | 'gauge' | 'heatmap';
    title: string;
    description?: string;
    position: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    config: {
        dataSource: string;
        refreshIntervalMs: number;
        thresholds?: Array<{
            value: number;
            color: string;
            label: string;
        }>;
        chartType?: 'line' | 'bar' | 'pie' | 'area' | 'scatter';
        timeRange?: 'last_hour' | 'last_day' | 'last_week' | 'custom';
        aggregation?: 'sum' | 'avg' | 'min' | 'max' | 'count';
        filters?: Record<string, unknown>;
    };
    style: {
        backgroundColor?: string;
        textColor?: string;
        borderColor?: string;
        fontSize?: number;
    };
    enabled: boolean;
}
/**
 * Dashboard layout configuration
 */
export interface DashboardLayout {
    id: string;
    name: string;
    description: string;
    widgets: DashboardWidget[];
    theme: 'light' | 'dark' | 'auto';
    autoRefresh: boolean;
    refreshIntervalMs: number;
    createdAt: Date;
    lastModified: Date;
}
/**
 * Dashboard data for visualization
 */
export interface DashboardData {
    timestamp: Date;
    widgets: Array<{
        id: string;
        data: Record<string, unknown> | string | number | boolean | null;
        status: 'ok' | 'warning' | 'error';
        lastUpdate: Date;
    }>;
    systemStatus: {
        overall: 'healthy' | 'degraded' | 'unhealthy' | 'critical';
        uptime: number;
        version: string;
        environment: string;
    };
    summary: {
        totalTasks: number;
        activeAlerts: number;
        systemEfficiency: number;
        resourceUtilization: number;
    };
}
/**
 * Visualization chart data
 */
export interface ChartData {
    labels: string[];
    datasets: Array<{
        label: string;
        data: number[];
        backgroundColor?: string | string[];
        borderColor?: string | string[];
        borderWidth?: number;
        fill?: boolean;
        tension?: number;
    }>;
    options?: {
        responsive: boolean;
        scales?: Record<string, unknown>;
        plugins?: Record<string, unknown>;
    };
}
/**
 * Enhanced Monitoring Dashboard
 *
 * Comprehensive real-time dashboard system providing:
 * - Customizable widget-based layouts
 * - Real-time data visualization with sub-second updates
 * - Interactive charts and metrics displays
 * - Alert management and notification center
 * - Predictive analytics visualization
 * - Performance trend analysis
 * - System health monitoring
 * - Export and reporting capabilities
 */
export declare class EnhancedMonitoringDashboard extends EventEmitter {
    private readonly logger;
    private layouts;
    private currentLayout?;
    private widgets;
    private cachedData;
    private dataRefreshIntervals;
    private chartConfigurations;
    private dashboardUpdateInterval?;
    private readonly layoutsPath;
    private readonly preferencesPath;
    constructor();
    /**
     * Initialize dashboard system
     */
    private initializeDashboard;
    /**
     * Create a new dashboard layout
     */
    createLayout(name: string, description: string): string;
    /**
     * Add widget to layout
     */
    addWidget(layoutId: string, widget: Omit<DashboardWidget, 'id'>): string;
    /**
     * Update widget configuration
     */
    updateWidget(widgetId: string, updates: Partial<DashboardWidget>): boolean;
    /**
     * Remove widget from layout
     */
    removeWidget(widgetId: string): boolean;
    /**
     * Set active layout
     */
    setActiveLayout(layoutId: string): boolean;
    /**
     * Get current dashboard data
     */
    getCurrentDashboardData(): DashboardData;
    /**
     * Get all available layouts
     */
    getLayouts(): DashboardLayout[];
    /**
     * Get specific layout
     */
    getLayout(layoutId: string): DashboardLayout | undefined;
    /**
     * Generate chart data for visualization
     */
    generateChartData(widgetId: string, timeRange?: 'last_hour' | 'last_day' | 'last_week'): ChartData;
    /**
     * Export dashboard configuration
     */
    exportDashboard(layoutId?: string): Promise<string>;
    /**
     * Import dashboard configuration
     */
    importDashboard(configJson: string): Promise<void>;
    /**
     * Get widget performance statistics
     */
    getWidgetPerformanceStats(widgetId: string): {
        updateCount: number;
        averageUpdateTime: number;
        lastSuccessfulUpdate: Date | null;
        errorCount: number;
        dataSize: number;
    };
    private createDefaultLayout;
    private initializeWidgetDataSources;
    private initializeWidgetDataSource;
    private updateWidgetData;
    private getSystemHealthData;
    private getTaskMetricsData;
    private getAgentPerformanceData;
    private getAlertHistoryData;
    private getPredictiveInsightsData;
    private getWidgetStatus;
    private generateSystemHealthChart;
    private generateTaskMetricsChart;
    private generateAgentPerformanceChart;
    private generateAlertHistoryChart;
    private generatePredictiveInsightsChart;
    private generateDefaultChart;
    private setupEventListeners;
    private startDashboardUpdates;
    private loadPersistedLayouts;
    private persistLayouts;
    /**
     * Graceful shutdown
     */
    shutdown(): Promise<void>;
}
/**
 * Singleton instance for global access
 */
export declare const enhancedMonitoringDashboard: EnhancedMonitoringDashboard;
