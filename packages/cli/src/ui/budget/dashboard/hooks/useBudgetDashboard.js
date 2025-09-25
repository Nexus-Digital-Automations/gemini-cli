/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback } from 'react';
/**
 * Main hook for the Budget Usage Visualizer dashboard.
 * Provides comprehensive state management and data fetching capabilities.
 *
 * @param options - Configuration options for the dashboard
 * @returns Dashboard data, state, and control functions
 *
 * @example
 * ```typescript
 * const {
 *   budgetStats,
 *   historicalData,
 *   dashboardState,
 *   updateFilters,
 *   refreshData,
 * } = useBudgetDashboard({
 *   projectRoot: '/path/to/project',
 *   budgetSettings: { enabled: true, dailyLimit: 1000 },
 *   refreshInterval: 30,
 * });
 * ```
 */
export function useBudgetDashboard(options) {
    const { projectRoot: _projectRoot, budgetSettings, refreshInterval = 30, autoRefresh = true, } = options;
    // Dashboard state
    const [dashboardState, setDashboardState] = useState({
        activeView: 'overview',
        filters: {
            timeRange: {
                start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
                end: new Date(),
                preset: 'week',
            },
            features: {
                include: [],
                exclude: [],
            },
        },
        isLoading: true,
        lastRefresh: new Date(),
        refreshInterval,
        autoRefresh,
        error: null,
    });
    // Data state
    const [budgetStats, setBudgetStats] = useState(null);
    const [tokenMetrics, _setTokenMetrics] = useState([]);
    const [historicalData, setHistoricalData] = useState([]);
    const [costBreakdown, setCostBreakdown] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [projections, setProjections] = useState([]);
    /**
     * Fetches current budget usage statistics from the backend.
     * Updates the budgetStats state with real-time data.
     */
    const fetchBudgetStats = useCallback(async () => {
        if (!budgetSettings?.enabled) {
            return null;
        }
        try {
            // TODO: Replace with actual API call when budget API is available
            // For now, return mock data for UI development
            const mockStats = {
                requestCount: Math.floor(Math.random() * 800) + 100,
                dailyLimit: budgetSettings.dailyLimit || 1000,
                remainingRequests: Math.max(0, (budgetSettings.dailyLimit || 1000) -
                    Math.floor(Math.random() * 800) -
                    100),
                usagePercentage: Math.random() * 100,
                timeUntilReset: '12h 34m',
                lastUpdated: new Date(),
            };
            setBudgetStats(mockStats);
            return mockStats;
        }
        catch (error) {
            console.error('Failed to fetch budget stats:', error);
            setDashboardState((prev) => ({
                ...prev,
                error: 'Failed to load budget statistics',
            }));
            return null;
        }
    }, [budgetSettings]);
    /**
     * Fetches historical usage data based on current filters.
     * Updates the historicalData state for trend analysis.
     */
    const fetchHistoricalData = useCallback(async () => {
        const { timeRange } = dashboardState.filters;
        try {
            // TODO: Replace with actual API call when budget API is available
            // Generate mock historical data for UI development
            const mockData = [];
            const startTime = timeRange.start.getTime();
            const endTime = timeRange.end.getTime();
            const dataPoints = 50;
            const interval = (endTime - startTime) / dataPoints;
            for (let i = 0; i < dataPoints; i++) {
                const timestamp = new Date(startTime + i * interval);
                mockData.push({
                    timestamp,
                    tokens: Math.floor(Math.random() * 10000) + 1000,
                    cost: Math.random() * 5 + 0.1,
                    requests: Math.floor(Math.random() * 100) + 10,
                    feature: ['chat', 'code-analysis', 'completion', 'debugging'][Math.floor(Math.random() * 4)],
                });
            }
            setHistoricalData(mockData);
            return mockData;
        }
        catch (error) {
            console.error('Failed to fetch historical data:', error);
            setDashboardState((prev) => ({
                ...prev,
                error: 'Failed to load historical data',
            }));
            return [];
        }
    }, [dashboardState.filters]);
    /**
     * Fetches cost breakdown data by feature.
     * Updates the costBreakdown state for spending analysis.
     */
    const fetchCostBreakdown = useCallback(async () => {
        try {
            // TODO: Replace with actual API call when budget API is available
            // Generate mock cost breakdown data for UI development
            const features = [
                'chat',
                'code-analysis',
                'completion',
                'debugging',
                'refactoring',
            ];
            const mockBreakdown = features.map((feature) => {
                const cost = Math.random() * 10 + 0.5;
                const tokens = Math.floor(Math.random() * 50000) + 5000;
                const requests = Math.floor(Math.random() * 200) + 20;
                return {
                    feature,
                    cost,
                    percentage: Math.random() * 30 + 5, // Will be recalculated below
                    tokens,
                    requests,
                    avgCostPerRequest: cost / requests,
                };
            });
            // Recalculate percentages to sum to 100%
            const totalCost = mockBreakdown.reduce((sum, item) => sum + item.cost, 0);
            mockBreakdown.forEach((item) => {
                item.percentage = (item.cost / totalCost) * 100;
            });
            setCostBreakdown(mockBreakdown);
            return mockBreakdown;
        }
        catch (error) {
            console.error('Failed to fetch cost breakdown:', error);
            return [];
        }
    }, []);
    /**
     * Fetches active budget alerts.
     * Updates the alerts state with current warnings and notifications.
     */
    const fetchAlerts = useCallback(async () => {
        try {
            // TODO: Replace with actual API call when budget API is available
            // Generate mock alerts for UI development
            const mockAlerts = [];
            if (budgetStats && budgetStats.usagePercentage > 80) {
                mockAlerts.push({
                    id: 'usage-high',
                    type: 'usage_threshold',
                    severity: budgetStats.usagePercentage > 95 ? 'critical' : 'warning',
                    title: 'High Usage Alert',
                    message: `Budget usage is at ${budgetStats.usagePercentage.toFixed(1)}% of daily limit`,
                    threshold: 80,
                    currentValue: budgetStats.usagePercentage,
                    isActive: true,
                    triggeredAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
                    suggestedActions: [
                        'Monitor usage closely',
                        'Consider optimizing queries',
                        'Review feature usage breakdown',
                    ],
                });
            }
            setAlerts(mockAlerts);
            return mockAlerts;
        }
        catch (error) {
            console.error('Failed to fetch alerts:', error);
            return [];
        }
    }, [budgetStats]);
    /**
     * Fetches cost projections based on current usage patterns.
     * Updates the projections state for future planning.
     */
    const fetchProjections = useCallback(async () => {
        try {
            // TODO: Replace with actual API call when budget API is available
            // Generate mock projections for UI development
            const mockProjections = [
                {
                    period: 'daily',
                    projectedCost: Math.random() * 20 + 5,
                    confidence: Math.random() * 30 + 70,
                    trend: ['increasing', 'decreasing', 'stable'][Math.floor(Math.random() * 3)],
                    basedOnDays: 7,
                    projectionRange: {
                        start: new Date(),
                        end: new Date(Date.now() + 24 * 60 * 60 * 1000),
                    },
                },
                {
                    period: 'weekly',
                    projectedCost: Math.random() * 140 + 35,
                    confidence: Math.random() * 25 + 65,
                    trend: 'increasing',
                    basedOnDays: 14,
                    projectionRange: {
                        start: new Date(),
                        end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                    },
                },
                {
                    period: 'monthly',
                    projectedCost: Math.random() * 600 + 150,
                    confidence: Math.random() * 20 + 60,
                    trend: 'stable',
                    basedOnDays: 30,
                    projectionRange: {
                        start: new Date(),
                        end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                    },
                },
            ];
            setProjections(mockProjections);
            return mockProjections;
        }
        catch (error) {
            console.error('Failed to fetch projections:', error);
            return [];
        }
    }, []);
    /**
     * Refreshes all dashboard data.
     * Fetches updated data from all endpoints and updates state.
     */
    const refreshData = useCallback(async () => {
        setDashboardState((prev) => ({ ...prev, isLoading: true, error: null }));
        try {
            await Promise.all([
                fetchBudgetStats(),
                fetchHistoricalData(),
                fetchCostBreakdown(),
                fetchAlerts(),
                fetchProjections(),
            ]);
            setDashboardState((prev) => ({
                ...prev,
                isLoading: false,
                lastRefresh: new Date(),
            }));
        }
        catch (error) {
            console.error('Failed to refresh dashboard data:', error);
            setDashboardState((prev) => ({
                ...prev,
                isLoading: false,
                error: 'Failed to refresh data',
            }));
        }
    }, [
        fetchBudgetStats,
        fetchHistoricalData,
        fetchCostBreakdown,
        fetchAlerts,
        fetchProjections,
    ]);
    /**
     * Updates dashboard filters and triggers data refresh.
     */
    const updateFilters = useCallback((newFilters) => {
        setDashboardState((prev) => ({
            ...prev,
            filters: { ...prev.filters, ...newFilters },
        }));
        // Refresh data when filters change
        refreshData();
    }, [refreshData]);
    /**
     * Changes the active dashboard view.
     */
    const setActiveView = useCallback((view) => {
        setDashboardState((prev) => ({ ...prev, activeView: view }));
    }, []);
    /**
     * Toggles auto-refresh on/off.
     */
    const toggleAutoRefresh = useCallback(() => {
        setDashboardState((prev) => ({ ...prev, autoRefresh: !prev.autoRefresh }));
    }, []);
    /**
     * Dismisses an active alert.
     */
    const dismissAlert = useCallback((alertId) => {
        setAlerts((prev) => prev.filter((alert) => alert.id !== alertId));
    }, []);
    /**
     * Exports dashboard data in the specified format.
     */
    const exportData = useCallback(async (format) => {
        const data = {
            budgetStats,
            tokenMetrics,
            historicalData,
            costBreakdown,
            alerts,
            projections,
            exportTimestamp: new Date().toISOString(),
        };
        if (format === 'json') {
            return JSON.stringify(data, null, 2);
        }
        // CSV export (simplified)
        const csv = ['Category,Value'];
        if (budgetStats) {
            csv.push(`Total Requests,${budgetStats.requestCount}`);
            csv.push(`Daily Limit,${budgetStats.dailyLimit}`);
            csv.push(`Usage Percentage,${budgetStats.usagePercentage}%`);
        }
        costBreakdown.forEach((item) => {
            csv.push(`${item.feature} Cost,$${item.cost.toFixed(2)}`);
        });
        return csv.join('\n');
    }, [
        budgetStats,
        tokenMetrics,
        historicalData,
        costBreakdown,
        alerts,
        projections,
    ]);
    // Auto-refresh effect
    useEffect(() => {
        if (!dashboardState.autoRefresh)
            return;
        const interval = setInterval(() => {
            refreshData();
        }, dashboardState.refreshInterval * 1000);
        return () => clearInterval(interval);
    }, [dashboardState.autoRefresh, dashboardState.refreshInterval, refreshData]);
    // Initial data load
    useEffect(() => {
        refreshData();
    }, [refreshData]);
    return {
        // Data
        budgetStats,
        tokenMetrics,
        historicalData,
        costBreakdown,
        alerts,
        projections,
        // State
        dashboardState,
        // Actions
        updateFilters,
        setActiveView,
        refreshData,
        toggleAutoRefresh,
        dismissAlert,
        exportData,
    };
}
//# sourceMappingURL=useBudgetDashboard.js.map