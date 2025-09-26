/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { EventEmitter } from 'node:events';
import { Logger } from '../utils/logger.js';
import { realTimeMonitoringSystem, } from './RealTimeMonitoringSystem.js';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
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
export class EnhancedMonitoringDashboard extends EventEmitter {
    logger;
    // Dashboard configuration
    layouts = new Map();
    currentLayout;
    widgets = new Map();
    // Data management
    cachedData = new Map();
    dataRefreshIntervals = new Map();
    // Visualization data
    chartConfigurations = new Map();
    dashboardUpdateInterval;
    // Persistence paths
    layoutsPath;
    constructor() {
        super();
        this.logger = new Logger('EnhancedMonitoringDashboard');
        // Setup persistence paths
        const tempDir = path.join(process.cwd(), '.tmp', 'dashboard');
        this.layoutsPath = path.join(tempDir, 'dashboard-layouts.json');
        this.initializeDashboard();
    }
    /**
     * Initialize dashboard system
     */
    async initializeDashboard() {
        try {
            // Create persistence directory
            await fs.mkdir(path.dirname(this.layoutsPath), { recursive: true });
            // Load persisted layouts
            await this.loadPersistedLayouts();
            // Setup default layout if none exist
            if (this.layouts.size === 0) {
                this.createDefaultLayout();
            }
            // Set current layout to first available or default
            this.currentLayout = Array.from(this.layouts.values())[0];
            // Initialize widget data sources
            this.initializeWidgetDataSources();
            // Setup event listeners
            this.setupEventListeners();
            // Start dashboard updates
            this.startDashboardUpdates();
            this.logger.info('EnhancedMonitoringDashboard initialized', {
                layoutsCount: this.layouts.size,
                widgetsCount: this.widgets.size,
                currentLayout: this.currentLayout?.name,
            });
            this.emit('dashboard:initialized', {
                layoutsCount: this.layouts.size,
                widgetsCount: this.widgets.size,
            });
        }
        catch (error) {
            this.logger.error('Failed to initialize EnhancedMonitoringDashboard', {
                error,
            });
            throw error;
        }
    }
    /**
     * Create a new dashboard layout
     */
    createLayout(name, description) {
        const layout = {
            id: `layout_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
            name,
            description,
            widgets: [],
            theme: 'dark',
            autoRefresh: true,
            refreshIntervalMs: 1000, // 1 second refresh
            createdAt: new Date(),
            lastModified: new Date(),
        };
        this.layouts.set(layout.id, layout);
        this.logger.info('Dashboard layout created', {
            id: layout.id,
            name,
            description,
        });
        this.emit('layout:created', { layout });
        return layout.id;
    }
    /**
     * Add widget to layout
     */
    addWidget(layoutId, widget) {
        const layout = this.layouts.get(layoutId);
        if (!layout) {
            throw new Error(`Layout not found: ${layoutId}`);
        }
        const widgetId = `widget_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
        const fullWidget = {
            ...widget,
            id: widgetId,
        };
        layout.widgets.push(fullWidget);
        layout.lastModified = new Date();
        this.widgets.set(widgetId, fullWidget);
        // Initialize data source for the widget
        this.initializeWidgetDataSource(fullWidget);
        this.logger.info('Widget added to layout', {
            layoutId,
            widgetId,
            widgetType: widget.type,
            title: widget.title,
        });
        this.emit('widget:added', { layoutId, widget: fullWidget });
        return widgetId;
    }
    /**
     * Update widget configuration
     */
    updateWidget(widgetId, updates) {
        const widget = this.widgets.get(widgetId);
        if (!widget)
            return false;
        // Find layout containing this widget
        const layout = Array.from(this.layouts.values()).find((l) => l.widgets.some((w) => w.id === widgetId));
        if (!layout)
            return false;
        // Update widget in layout
        const widgetIndex = layout.widgets.findIndex((w) => w.id === widgetId);
        if (widgetIndex === -1)
            return false;
        Object.assign(widget, updates);
        layout.widgets[widgetIndex] = widget;
        layout.lastModified = new Date();
        // Reinitialize data source if config changed
        if (updates.config) {
            this.initializeWidgetDataSource(widget);
        }
        this.logger.info('Widget updated', { widgetId, updates });
        this.emit('widget:updated', { widget });
        return true;
    }
    /**
     * Remove widget from layout
     */
    removeWidget(widgetId) {
        const widget = this.widgets.get(widgetId);
        if (!widget)
            return false;
        // Find and remove from layout
        const layout = Array.from(this.layouts.values()).find((l) => l.widgets.some((w) => w.id === widgetId));
        if (layout) {
            layout.widgets = layout.widgets.filter((w) => w.id !== widgetId);
            layout.lastModified = new Date();
        }
        // Clean up resources
        this.widgets.delete(widgetId);
        this.cachedData.delete(widgetId);
        const interval = this.dataRefreshIntervals.get(widgetId);
        if (interval) {
            clearInterval(interval);
            this.dataRefreshIntervals.delete(widgetId);
        }
        this.logger.info('Widget removed', { widgetId });
        this.emit('widget:removed', { widgetId });
        return true;
    }
    /**
     * Set active layout
     */
    setActiveLayout(layoutId) {
        const layout = this.layouts.get(layoutId);
        if (!layout)
            return false;
        this.currentLayout = layout;
        this.logger.info('Active layout changed', {
            layoutId,
            name: layout.name,
        });
        this.emit('layout:activated', { layout });
        return true;
    }
    /**
     * Get current dashboard data
     */
    getCurrentDashboardData() {
        if (!this.currentLayout) {
            throw new Error('No active layout');
        }
        const currentSnapshot = realTimeMonitoringSystem.getCurrentSnapshot();
        const dashboardData = {
            timestamp: new Date(),
            widgets: this.currentLayout.widgets.map((widget) => {
                const cachedData = this.cachedData.get(widget.id);
                return {
                    id: widget.id,
                    data: cachedData?.data || null,
                    status: this.getWidgetStatus(widget, cachedData?.data),
                    lastUpdate: cachedData?.timestamp || new Date(),
                };
            }),
            systemStatus: {
                overall: currentSnapshot.systemHealth.overall,
                uptime: currentSnapshot.systemHealth.uptime,
                version: '1.0.0', // TODO: Get from package.json
                environment: process.env['NODE_ENV'] || 'development',
            },
            summary: {
                totalTasks: currentSnapshot.taskMetrics.total,
                activeAlerts: currentSnapshot.activeAlerts.length,
                systemEfficiency: (currentSnapshot.taskMetrics.successRate / 100) * 100,
                resourceUtilization: currentSnapshot.systemHealth.memoryUsageMB,
            },
        };
        return dashboardData;
    }
    /**
     * Get all available layouts
     */
    getLayouts() {
        return Array.from(this.layouts.values()).sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());
    }
    /**
     * Get specific layout
     */
    getLayout(layoutId) {
        return this.layouts.get(layoutId);
    }
    /**
     * Generate chart data for visualization
     */
    generateChartData(widgetId, timeRange = 'last_hour') {
        const widget = this.widgets.get(widgetId);
        if (!widget) {
            throw new Error(`Widget not found: ${widgetId}`);
        }
        // Get time range in hours
        const hours = timeRange === 'last_hour' ? 1 : timeRange === 'last_day' ? 24 : 168;
        const snapshots = realTimeMonitoringSystem.getMonitoringHistory(hours);
        switch (widget.config.dataSource) {
            case 'system_health':
                return this.generateSystemHealthChart(snapshots, widget);
            case 'task_metrics':
                return this.generateTaskMetricsChart(snapshots, widget);
            case 'agent_performance':
                return this.generateAgentPerformanceChart(snapshots, widget);
            case 'alert_history':
                return this.generateAlertHistoryChart(snapshots, widget);
            case 'predictive_insights':
                return this.generatePredictiveInsightsChart(widget);
            default:
                return this.generateDefaultChart();
        }
    }
    /**
     * Export dashboard configuration
     */
    async exportDashboard(layoutId) {
        const layouts = layoutId
            ? [this.layouts.get(layoutId)].filter(Boolean)
            : Array.from(this.layouts.values());
        const exportData = {
            version: '1.0',
            exportTimestamp: new Date().toISOString(),
            layouts,
            preferences: {
                defaultTheme: 'dark',
                autoRefresh: true,
                refreshInterval: 1000,
            },
        };
        return JSON.stringify(exportData, null, 2);
    }
    /**
     * Import dashboard configuration
     */
    async importDashboard(configJson) {
        try {
            const importData = JSON.parse(configJson);
            for (const layout of importData.layouts || []) {
                // Generate new IDs to avoid conflicts
                const newLayoutId = `imported_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
                const newLayout = {
                    ...layout,
                    id: newLayoutId,
                    createdAt: new Date(layout.createdAt),
                    lastModified: new Date(),
                    widgets: layout.widgets.map((widgetDef) => ({
                        ...widgetDef,
                        id: `widget_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
                    })),
                };
                this.layouts.set(newLayoutId, newLayout);
                // Add widgets to widget map
                for (const widget of newLayout.widgets) {
                    this.widgets.set(widget.id, widget);
                    this.initializeWidgetDataSource(widget);
                }
            }
            await this.persistLayouts();
            this.logger.info('Dashboard configuration imported', {
                layoutsImported: importData.layouts?.length || 0,
            });
            this.emit('dashboard:imported', {
                layoutsCount: importData.layouts?.length || 0,
            });
        }
        catch (error) {
            this.logger.error('Failed to import dashboard configuration', { error });
            throw error;
        }
    }
    /**
     * Get widget performance statistics
     */
    getWidgetPerformanceStats(widgetId) {
        // This would track widget performance metrics
        // For now, return mock data based on widgetId
        this.logger.debug('Getting widget performance stats', { widgetId });
        return {
            updateCount: 100,
            averageUpdateTime: 150,
            lastSuccessfulUpdate: new Date(),
            errorCount: 0,
            dataSize: 1024,
        };
    }
    // Private methods
    createDefaultLayout() {
        const defaultLayoutId = this.createLayout('Default Monitoring', 'Comprehensive system monitoring dashboard');
        // System overview widget
        this.addWidget(defaultLayoutId, {
            type: 'metric',
            title: 'System Overview',
            description: 'Key system metrics at a glance',
            position: { x: 0, y: 0, width: 4, height: 2 },
            config: {
                dataSource: 'system_health',
                refreshIntervalMs: 1000,
                thresholds: [
                    { value: 80, color: 'green', label: 'Healthy' },
                    { value: 60, color: 'yellow', label: 'Warning' },
                    { value: 40, color: 'red', label: 'Critical' },
                ],
            },
            style: {
                backgroundColor: '#1a1a1a',
                textColor: '#ffffff',
            },
            enabled: true,
        });
        // Task execution chart
        this.addWidget(defaultLayoutId, {
            type: 'chart',
            title: 'Task Execution Trends',
            description: 'Real-time task completion and failure trends',
            position: { x: 4, y: 0, width: 8, height: 4 },
            config: {
                dataSource: 'task_metrics',
                refreshIntervalMs: 2000,
                chartType: 'line',
                timeRange: 'last_hour',
            },
            style: {
                backgroundColor: '#1a1a1a',
                textColor: '#ffffff',
            },
            enabled: true,
        });
        // Active alerts panel
        this.addWidget(defaultLayoutId, {
            type: 'alert_panel',
            title: 'Active Alerts',
            description: 'Current system alerts and notifications',
            position: { x: 0, y: 2, width: 4, height: 3 },
            config: {
                dataSource: 'alert_history',
                refreshIntervalMs: 1000,
            },
            style: {
                backgroundColor: '#1a1a1a',
                textColor: '#ffffff',
            },
            enabled: true,
        });
        // Agent performance gauge
        this.addWidget(defaultLayoutId, {
            type: 'gauge',
            title: 'Agent Performance',
            description: 'Average agent performance and utilization',
            position: { x: 4, y: 4, width: 4, height: 3 },
            config: {
                dataSource: 'agent_performance',
                refreshIntervalMs: 2000,
                thresholds: [
                    { value: 90, color: 'green', label: 'Excellent' },
                    { value: 70, color: 'yellow', label: 'Good' },
                    { value: 50, color: 'red', label: 'Poor' },
                ],
            },
            style: {
                backgroundColor: '#1a1a1a',
                textColor: '#ffffff',
            },
            enabled: true,
        });
        // Predictive insights
        this.addWidget(defaultLayoutId, {
            type: 'table',
            title: 'Predictive Insights',
            description: 'AI-driven system optimization recommendations',
            position: { x: 8, y: 4, width: 4, height: 3 },
            config: {
                dataSource: 'predictive_insights',
                refreshIntervalMs: 30000, // 30 seconds
            },
            style: {
                backgroundColor: '#1a1a1a',
                textColor: '#ffffff',
            },
            enabled: true,
        });
    }
    initializeWidgetDataSources() {
        for (const widget of this.widgets.values()) {
            this.initializeWidgetDataSource(widget);
        }
    }
    initializeWidgetDataSource(widget) {
        // Clear existing interval
        const existingInterval = this.dataRefreshIntervals.get(widget.id);
        if (existingInterval) {
            clearInterval(existingInterval);
        }
        // Set up data refresh for the widget
        const updateData = () => {
            this.updateWidgetData(widget);
        };
        // Initial data load
        updateData();
        // Setup refresh interval
        const interval = setInterval(updateData, widget.config.refreshIntervalMs);
        this.dataRefreshIntervals.set(widget.id, interval);
    }
    updateWidgetData(widget) {
        try {
            let data = null;
            switch (widget.config.dataSource) {
                case 'system_health':
                    data = this.getSystemHealthData(widget);
                    break;
                case 'task_metrics':
                    data = this.getTaskMetricsData(widget);
                    break;
                case 'agent_performance':
                    data = this.getAgentPerformanceData(widget);
                    break;
                case 'alert_history':
                    data = this.getAlertHistoryData(widget);
                    break;
                case 'predictive_insights':
                    data = this.getPredictiveInsightsData(widget);
                    break;
                default:
                    data = {
                        error: 'Unknown data source',
                        dataSource: widget.config.dataSource,
                    };
            }
            this.cachedData.set(widget.id, {
                data,
                timestamp: new Date(),
            });
            this.emit('widget:data-updated', { widgetId: widget.id, data });
        }
        catch (error) {
            this.logger.error('Error updating widget data', {
                widgetId: widget.id,
                dataSource: widget.config.dataSource,
                error,
            });
            this.cachedData.set(widget.id, {
                data: {
                    error: 'Data update failed',
                    message: error.message,
                },
                timestamp: new Date(),
            });
        }
    }
    getSystemHealthData(_widget) {
        const snapshot = realTimeMonitoringSystem.getCurrentSnapshot();
        return {
            overall: snapshot.systemHealth.overall,
            uptime: Math.floor(snapshot.systemHealth.uptime / 1000 / 60 / 60), // hours
            memoryUsage: Math.round(snapshot.systemHealth.memoryUsageMB),
            cpuUsage: snapshot.systemHealth.cpuUsagePercent,
            metrics: [
                {
                    label: 'Memory Usage',
                    value: snapshot.systemHealth.memoryUsageMB,
                    unit: 'MB',
                },
                {
                    label: 'CPU Usage',
                    value: snapshot.systemHealth.cpuUsagePercent,
                    unit: '%',
                },
                {
                    label: 'Uptime',
                    value: Math.floor(snapshot.systemHealth.uptime / 1000 / 60 / 60),
                    unit: 'hours',
                },
                { label: 'Status', value: snapshot.systemHealth.overall, unit: '' },
            ],
        };
    }
    getTaskMetricsData(widget) {
        const snapshot = realTimeMonitoringSystem.getCurrentSnapshot();
        return {
            total: snapshot.taskMetrics.total,
            completed: snapshot.taskMetrics.completed,
            failed: snapshot.taskMetrics.failed,
            inProgress: snapshot.taskMetrics.inProgress,
            successRate: snapshot.taskMetrics.successRate,
            throughputPerHour: snapshot.taskMetrics.throughputPerHour,
            chartData: this.generateChartData(widget.id, widget.config.timeRange || 'last_hour'),
        };
    }
    getAgentPerformanceData(widget) {
        const snapshot = realTimeMonitoringSystem.getCurrentSnapshot();
        return {
            totalAgents: snapshot.agentMetrics.total,
            activeAgents: snapshot.agentMetrics.active,
            idleAgents: snapshot.agentMetrics.idle,
            busyAgents: snapshot.agentMetrics.busy,
            averageUtilization: snapshot.agentMetrics.averageUtilization,
            averagePerformance: snapshot.agentMetrics.averagePerformance,
            utilizationGauge: {
                value: snapshot.agentMetrics.averageUtilization,
                max: 100,
                thresholds: widget.config.thresholds || [],
            },
        };
    }
    getAlertHistoryData(_widget) {
        const activeAlerts = realTimeMonitoringSystem.getActiveAlerts();
        return {
            activeAlerts: activeAlerts.map((alert) => ({
                id: alert.rule.id,
                name: alert.rule.name,
                severity: alert.rule.severity,
                description: alert.rule.description,
                startTime: alert.startTime,
                duration: Date.now() - alert.startTime.getTime(),
            })),
            alertCount: activeAlerts.length,
            severityCounts: {
                critical: activeAlerts.filter((a) => a.rule.severity === 'critical')
                    .length,
                high: activeAlerts.filter((a) => a.rule.severity === 'high').length,
                medium: activeAlerts.filter((a) => a.rule.severity === 'medium').length,
                low: activeAlerts.filter((a) => a.rule.severity === 'low').length,
            },
        };
    }
    getPredictiveInsightsData(_widget) {
        const insights = realTimeMonitoringSystem.getPredictiveInsights();
        return {
            insights: insights.slice(0, 10).map((insight) => ({
                id: insight.id,
                title: insight.title,
                description: insight.description,
                type: insight.type,
                confidence: Math.round(insight.confidence * 100),
                impact: insight.impact,
                timeHorizon: insight.timeHorizon,
                recommendation: insight.recommendation,
                createdAt: insight.createdAt,
            })),
            totalInsights: insights.length,
            categories: {
                capacity: insights.filter((i) => i.type === 'capacity_prediction')
                    .length,
                failure: insights.filter((i) => i.type === 'failure_prediction').length,
                bottleneck: insights.filter((i) => i.type === 'bottleneck_prediction')
                    .length,
                trend: insights.filter((i) => i.type === 'trend_analysis').length,
            },
        };
    }
    getWidgetStatus(widget, data) {
        if (!data)
            return 'error';
        if (typeof data === 'object' && data !== null && 'error' in data) {
            return 'error';
        }
        // Additional status logic based on widget type and thresholds
        if (widget.config.thresholds &&
            typeof data === 'object' &&
            data !== null &&
            'value' in data) {
            const value = data['value'];
            if (typeof value === 'number') {
                const criticalThreshold = widget.config.thresholds.find((t) => t.label === 'Critical');
                if (criticalThreshold && value >= criticalThreshold.value) {
                    return 'error';
                }
                const warningThreshold = widget.config.thresholds.find((t) => t.label === 'Warning');
                if (warningThreshold && value >= warningThreshold.value) {
                    return 'warning';
                }
            }
        }
        return 'ok';
    }
    generateSystemHealthChart(snapshots, _widget) {
        const labels = snapshots
            .slice(-20)
            .map((s) => s.timestamp.toLocaleTimeString())
            .reverse();
        return {
            labels,
            datasets: [
                {
                    label: 'Memory Usage (MB)',
                    data: snapshots
                        .slice(-20)
                        .map((s) => s.systemHealth.memoryUsageMB)
                        .reverse(),
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    tension: 0.4,
                    fill: true,
                },
                {
                    label: 'CPU Usage (%)',
                    data: snapshots
                        .slice(-20)
                        .map((s) => s.systemHealth.cpuUsagePercent)
                        .reverse(),
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    tension: 0.4,
                    fill: false,
                },
            ],
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                    },
                },
            },
        };
    }
    generateTaskMetricsChart(snapshots, _widget) {
        const labels = snapshots
            .slice(-20)
            .map((s) => s.timestamp.toLocaleTimeString())
            .reverse();
        return {
            labels,
            datasets: [
                {
                    label: 'Completed Tasks',
                    data: snapshots
                        .slice(-20)
                        .map((s) => s.taskMetrics.completed)
                        .reverse(),
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.2)',
                    fill: true,
                },
                {
                    label: 'Failed Tasks',
                    data: snapshots
                        .slice(-20)
                        .map((s) => s.taskMetrics.failed)
                        .reverse(),
                    borderColor: '#ef4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.2)',
                    fill: true,
                },
                {
                    label: 'In Progress',
                    data: snapshots
                        .slice(-20)
                        .map((s) => s.taskMetrics.inProgress)
                        .reverse(),
                    borderColor: '#f59e0b',
                    backgroundColor: 'rgba(245, 158, 11, 0.2)',
                    fill: false,
                },
            ],
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                    },
                },
            },
        };
    }
    generateAgentPerformanceChart(snapshots, _widget) {
        const labels = snapshots
            .slice(-20)
            .map((s) => s.timestamp.toLocaleTimeString())
            .reverse();
        return {
            labels,
            datasets: [
                {
                    label: 'Active Agents',
                    data: snapshots
                        .slice(-20)
                        .map((s) => s.agentMetrics.active)
                        .reverse(),
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.2)',
                    fill: true,
                },
                {
                    label: 'Agent Utilization (%)',
                    data: snapshots
                        .slice(-20)
                        .map((s) => s.agentMetrics.averageUtilization)
                        .reverse(),
                    borderColor: '#8b5cf6',
                    backgroundColor: 'rgba(139, 92, 246, 0.2)',
                    fill: false,
                },
            ],
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                    },
                },
            },
        };
    }
    generateAlertHistoryChart(snapshots, _widget) {
        const labels = snapshots
            .slice(-10)
            .map((s) => s.timestamp.toLocaleTimeString())
            .reverse();
        return {
            labels,
            datasets: [
                {
                    label: 'Active Alerts',
                    data: snapshots
                        .slice(-10)
                        .map((s) => s.activeAlerts.length)
                        .reverse(),
                    backgroundColor: ['#ef4444', '#f59e0b', '#10b981', '#3b82f6'],
                    borderWidth: 1,
                },
            ],
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                },
            },
        };
    }
    generatePredictiveInsightsChart(_widget) {
        const insights = realTimeMonitoringSystem.getPredictiveInsights();
        const confidenceData = insights.slice(0, 10).map((insight) => ({
            x: insight.title.substring(0, 20),
            y: insight.confidence * 100,
            impact: insight.impact,
        }));
        return {
            labels: confidenceData.map((d) => d.x),
            datasets: [
                {
                    label: 'Confidence (%)',
                    data: confidenceData.map((d) => d.y),
                    backgroundColor: confidenceData.map((d) => d.impact === 'high'
                        ? '#ef4444'
                        : d.impact === 'medium'
                            ? '#f59e0b'
                            : '#10b981'),
                    borderWidth: 1,
                },
            ],
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                    },
                },
            },
        };
    }
    generateDefaultChart() {
        return {
            labels: ['No Data'],
            datasets: [
                {
                    label: 'No Data Available',
                    data: [0],
                    backgroundColor: '#6b7280',
                    borderWidth: 1,
                },
            ],
            options: {
                responsive: true,
            },
        };
    }
    setupEventListeners() {
        // Listen to monitoring system events
        realTimeMonitoringSystem.on('snapshot:collected', () => {
            // Update widgets that need frequent updates
            for (const widget of this.widgets.values()) {
                if (widget.enabled && widget.config.refreshIntervalMs <= 1000) {
                    this.updateWidgetData(widget);
                }
            }
        });
        realTimeMonitoringSystem.on('alert:triggered', (data) => {
            this.emit('dashboard:alert', data);
        });
        realTimeMonitoringSystem.on('insight:generated', (data) => {
            this.emit('dashboard:insight', data);
        });
    }
    startDashboardUpdates() {
        // Main dashboard update loop
        this.dashboardUpdateInterval = setInterval(() => {
            this.emit('dashboard:updated', {
                timestamp: new Date(),
                layoutId: this.currentLayout?.id,
                widgetCount: this.widgets.size,
            });
        }, 5000); // Update every 5 seconds
    }
    async loadPersistedLayouts() {
        try {
            const layoutsData = await fs.readFile(this.layoutsPath, 'utf-8');
            const parsed = JSON.parse(layoutsData);
            for (const layout of parsed.layouts || []) {
                const restoredLayout = {
                    ...layout,
                    createdAt: new Date(layout.createdAt),
                    lastModified: new Date(layout.lastModified),
                };
                this.layouts.set(restoredLayout.id, restoredLayout);
                // Add widgets to widget map
                for (const widget of restoredLayout.widgets) {
                    this.widgets.set(widget.id, widget);
                }
            }
            this.logger.info('Persisted layouts loaded', {
                count: this.layouts.size,
            });
        }
        catch (error) {
            // File doesn't exist or is corrupted - start fresh
            this.logger.info('No persisted layouts found, starting fresh', {
                error: error.message,
            });
        }
    }
    async persistLayouts() {
        try {
            const layoutsData = {
                layouts: Array.from(this.layouts.values()),
                lastPersisted: new Date().toISOString(),
            };
            await fs.writeFile(this.layoutsPath, JSON.stringify(layoutsData, null, 2));
        }
        catch (error) {
            this.logger.error('Error persisting layouts', { error });
        }
    }
    /**
     * Graceful shutdown
     */
    async shutdown() {
        this.logger.info('Shutting down EnhancedMonitoringDashboard');
        // Clear all intervals
        for (const interval of this.dataRefreshIntervals.values()) {
            clearInterval(interval);
        }
        if (this.dashboardUpdateInterval) {
            clearInterval(this.dashboardUpdateInterval);
        }
        // Persist current state
        await this.persistLayouts();
        // Clean up resources
        this.removeAllListeners();
        this.layouts.clear();
        this.widgets.clear();
        this.cachedData.clear();
        this.dataRefreshIntervals.clear();
        this.chartConfigurations.clear();
        this.logger.info('EnhancedMonitoringDashboard shutdown complete');
    }
}
/**
 * Singleton instance for global access
 */
export const enhancedMonitoringDashboard = new EnhancedMonitoringDashboard();
//# sourceMappingURL=EnhancedMonitoringDashboard.js.map