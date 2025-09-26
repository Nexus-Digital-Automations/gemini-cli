/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { theme } from '../../../semantic-colors.js';
import { useBudgetDashboard } from '../hooks/useBudgetDashboard.js';
import { TokenUsageChart } from '../charts/TokenUsageChart.js';
import { CostBreakdownChart } from '../charts/CostBreakdownChart.js';
import { UsageTrendsGraph } from '../charts/UsageTrendsGraph.js';
import { CostProjectionChart } from '../charts/CostProjectionChart.js';
import { BudgetAlertsPanel } from './BudgetAlertsPanel.js';
import { BudgetControlsPanel } from './BudgetControlsPanel.js';
import { formatPercentage, createProgressBar } from '../utils/chartUtils.js';
/**
 * Budget Usage Visualizer and Analytics Dashboard - Main Component
 *
 * This is the primary dashboard component that provides a comprehensive
 * view of budget usage, costs, trends, and analytics. It includes multiple
 * interactive charts, real-time data, alerts, and filtering capabilities.
 *
 * The dashboard supports multiple views:
 * - Overview: Summary of all budget metrics
 * - Usage: Detailed token usage analysis
 * - Costs: Cost breakdown and analysis
 * - Trends: Historical usage trends
 * - Alerts: Budget alerts and notifications
 * - Settings: Dashboard configuration
 *
 * @param props - Configuration for the dashboard
 * @returns Interactive budget dashboard UI component
 */
export const BudgetDashboard = ({ projectRoot, budgetSettings = { enabled: true }, initialView: _initialView = 'overview', compact = false, refreshInterval = 30, }) => {
    // Initialize dashboard state and data
    const { budgetStats, historicalData, costBreakdown, alerts, projections, dashboardState, setActiveView, updateFilters, refreshData, toggleAutoRefresh, dismissAlert, exportData, } = useBudgetDashboard({
        projectRoot,
        budgetSettings,
        refreshInterval,
        autoRefresh: true,
    });
    // Local state for navigation
    const [selectedIndex, setSelectedIndex] = useState(0);
    // Navigation options
    const navigationOptions = [
        { key: 'overview', label: 'Overview', icon: '📊' },
        { key: 'usage', label: 'Usage', icon: '🔥' },
        { key: 'costs', label: 'Costs', icon: '💰' },
        { key: 'trends', label: 'Trends', icon: '📈' },
        { key: 'alerts', label: 'Alerts', icon: '🚨' },
        { key: 'settings', label: 'Settings', icon: '⚙️' },
    ];
    // Handle keyboard navigation
    useInput((input, key) => {
        if (key.leftArrow || input === 'h') {
            setSelectedIndex(Math.max(0, selectedIndex - 1));
        }
        else if (key.rightArrow || input === 'l') {
            setSelectedIndex(Math.min(navigationOptions.length - 1, selectedIndex + 1));
        }
        else if (key.return || input === ' ') {
            const selectedView = navigationOptions[selectedIndex].key;
            setActiveView(selectedView);
        }
        else if (input === 'r') {
            // Refresh data
            refreshData();
        }
        else if (input === 't') {
            // Toggle auto-refresh
            toggleAutoRefresh();
        }
        else if (input === 'e') {
            // Export data (JSON format)
            exportData('json').then((data) => {
                console.log('Export data available:', data.slice(0, 100) + '...');
            });
        }
    });
    // Don't render if budget is not enabled
    if (!budgetSettings?.enabled) {
        return (_jsxs(Box, { flexDirection: "column", alignItems: "center", paddingY: 2, children: [_jsx(Text, { color: theme.status.warning, children: "Budget tracking is disabled" }), _jsx(Text, { color: theme.text.secondary, children: "Enable budget settings to view the dashboard" })] }));
    }
    // Loading state
    if (dashboardState.isLoading && !budgetStats) {
        return (_jsxs(Box, { flexDirection: "column", alignItems: "center", paddingY: 2, children: [_jsx(Text, { color: theme.text.secondary, children: "Loading budget dashboard..." }), _jsx(Text, { color: theme.text.muted, children: "Fetching real-time budget data" })] }));
    }
    // Error state
    if (dashboardState.error) {
        return (_jsxs(Box, { flexDirection: "column", alignItems: "center", paddingY: 2, children: [_jsx(Text, { color: theme.status.error, children: "Dashboard Error" }), _jsx(Text, { color: theme.text.secondary, children: dashboardState.error }), _jsx(Text, { color: theme.text.muted, children: "Press 'r' to retry" })] }));
    }
    /**
     * Renders the navigation bar with view options.
     */
    const renderNavigation = () => (_jsx(Box, { borderStyle: "round", paddingX: 1, marginBottom: 1, children: _jsx(Box, { gap: 2, children: navigationOptions.map((option, index) => (_jsx(Box, { children: _jsxs(Text, { color: index === selectedIndex
                        ? theme.text.accent
                        : dashboardState.activeView === option.key
                            ? theme.status.success
                            : theme.text.secondary, children: [option.icon, " ", option.label] }) }, option.key))) }) }));
    /**
     * Renders the dashboard header with key metrics.
     */
    const renderHeader = () => {
        if (!budgetStats)
            return null;
        const usageColor = budgetStats.usagePercentage >= 90
            ? theme.status.error
            : budgetStats.usagePercentage >= 75
                ? theme.status.warning
                : theme.status.success;
        return (_jsxs(Box, { flexDirection: "column", borderStyle: "single", paddingX: 2, paddingY: 1, marginBottom: 1, children: [_jsxs(Box, { justifyContent: "space-between", marginBottom: 1, children: [_jsx(Text, { color: theme.text.primary, bold: true, children: "Budget Usage Dashboard" }), _jsxs(Text, { color: theme.text.secondary, children: ["Last updated: ", dashboardState.lastRefresh.toLocaleTimeString()] })] }), _jsxs(Box, { justifyContent: "space-between", alignItems: "center", children: [_jsxs(Box, { gap: 4, children: [_jsxs(Box, { flexDirection: "column", children: [_jsx(Text, { color: theme.text.secondary, children: "Usage" }), _jsxs(Text, { color: usageColor, children: [budgetStats.requestCount, "/", budgetStats.dailyLimit] })] }), _jsxs(Box, { flexDirection: "column", children: [_jsx(Text, { color: theme.text.secondary, children: "Percentage" }), _jsx(Text, { color: usageColor, children: formatPercentage(budgetStats.usagePercentage) })] }), _jsxs(Box, { flexDirection: "column", children: [_jsx(Text, { color: theme.text.secondary, children: "Remaining" }), _jsx(Text, { color: theme.text.primary, children: budgetStats.remainingRequests })] }), _jsxs(Box, { flexDirection: "column", children: [_jsx(Text, { color: theme.text.secondary, children: "Reset" }), _jsx(Text, { color: theme.text.muted, children: budgetStats.timeUntilReset })] })] }), _jsxs(Box, { flexDirection: "column", alignItems: "flex-end", children: [_jsx(Text, { color: theme.text.secondary, children: "Progress" }), _jsxs(Box, { alignItems: "center", gap: 1, children: [_jsx(Text, { color: usageColor, children: createProgressBar(budgetStats.usagePercentage, 10) }), _jsx(Text, { color: theme.text.muted, children: formatPercentage(budgetStats.usagePercentage, 0) })] })] })] }), alerts.length > 0 && (_jsx(Box, { marginTop: 1, paddingTop: 1, borderColor: theme.status.warning, borderStyle: "single", children: _jsxs(Text, { color: theme.status.warning, children: ["\uD83D\uDEA8 ", alerts.length, " active alert", alerts.length > 1 ? 's' : ''] }) }))] }));
    };
    /**
     * Renders content based on the active view.
     */
    const renderContent = () => {
        switch (dashboardState.activeView) {
            case 'overview':
                return renderOverviewView();
            case 'usage':
                return renderUsageView();
            case 'costs':
                return renderCostsView();
            case 'trends':
                return renderTrendsView();
            case 'alerts':
                return renderAlertsView();
            case 'settings':
                return renderSettingsView();
            default:
                return renderOverviewView();
        }
    };
    /**
     * Renders the overview view with summary information.
     */
    const renderOverviewView = () => (_jsxs(Box, { flexDirection: "column", gap: 1, children: [_jsxs(Box, { gap: 2, children: [_jsx(Box, { flexBasis: "50%", children: _jsx(TokenUsageChart, { data: historicalData, config: {
                                title: 'Token Usage Trend',
                                width: 40,
                                height: 8,
                                showAxes: true,
                                showGrid: true,
                                colorScheme: 'usage',
                            } }) }), _jsx(Box, { flexBasis: "50%", children: _jsx(CostBreakdownChart, { data: costBreakdown, config: {
                                title: 'Cost Breakdown',
                                width: 40,
                                height: 8,
                                showAxes: false,
                                showGrid: false,
                                colorScheme: 'cost',
                            } }) })] }), projections.length > 0 && (_jsx(Box, { marginTop: 1, children: _jsx(CostProjectionChart, { projections, config: {
                        title: 'Cost Projections',
                        width: 80,
                        height: 6,
                        showAxes: true,
                        showGrid: true,
                        colorScheme: 'budget',
                    } }) }))] }));
    /**
     * Renders the detailed usage view.
     */
    const renderUsageView = () => (_jsx(Box, { flexDirection: "column", gap: 1, children: _jsx(TokenUsageChart, { data: historicalData, config: {
                title: 'Detailed Token Usage Analysis',
                width: 80,
                height: 12,
                showAxes: true,
                showGrid: true,
                colorScheme: 'usage',
            } }) }));
    /**
     * Renders the costs analysis view.
     */
    const renderCostsView = () => (_jsx(Box, { flexDirection: "column", gap: 1, children: _jsx(CostBreakdownChart, { data: costBreakdown, config: {
                title: 'Detailed Cost Analysis',
                width: 80,
                height: 12,
                showAxes: true,
                showGrid: false,
                colorScheme: 'cost',
            } }) }));
    /**
     * Renders the trends analysis view.
     */
    const renderTrendsView = () => (_jsx(Box, { flexDirection: "column", gap: 1, children: _jsx(UsageTrendsGraph, { data: historicalData, config: {
                title: 'Historical Usage Trends',
                width: 80,
                height: 12,
                showAxes: true,
                showGrid: true,
                colorScheme: 'default',
            } }) }));
    /**
     * Renders the alerts management view.
     */
    const renderAlertsView = () => (_jsx(BudgetAlertsPanel, { alerts, onDismissAlert: dismissAlert, budgetStats }));
    /**
     * Renders the settings and controls view.
     */
    const renderSettingsView = () => (_jsx(BudgetControlsPanel, { filters: dashboardState.filters, onUpdateFilters: updateFilters, autoRefresh: dashboardState.autoRefresh, onToggleAutoRefresh: toggleAutoRefresh, refreshInterval: dashboardState.refreshInterval, onExportData: exportData }));
    /**
     * Renders the footer with keyboard shortcuts.
     */
    const renderFooter = () => (_jsxs(Box, { justifyContent: "space-between", paddingTop: 1, borderStyle: "single", borderTop: true, children: [_jsxs(Box, { gap: 4, children: [_jsx(Text, { color: theme.text.muted, children: "\u2190\u2192/hl: Navigate" }), _jsx(Text, { color: theme.text.muted, children: "Enter/Space: Select" }), _jsx(Text, { color: theme.text.muted, children: "r: Refresh" }), _jsx(Text, { color: theme.text.muted, children: "t: Toggle auto-refresh" }), _jsx(Text, { color: theme.text.muted, children: "e: Export" })] }), _jsxs(Text, { color: theme.text.muted, children: ["Auto-refresh: ", dashboardState.autoRefresh ? 'ON' : 'OFF', "(", dashboardState.refreshInterval, "s)"] })] }));
    // Render the complete dashboard
    return (_jsxs(Box, { flexDirection: "column", minHeight: compact ? 20 : 30, children: [renderNavigation(), renderHeader(), _jsx(Box, { flexGrow: 1, marginBottom: 1, children: renderContent() }), !compact && renderFooter()] }));
};
//# sourceMappingURL=BudgetDashboard.js.map