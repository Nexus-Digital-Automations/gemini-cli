/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Budget Usage Visualizer and Analytics Dashboard - Type Definitions
 *
 * This module provides comprehensive TypeScript interfaces and types for the
 * Budget Usage Visualizer dashboard UI components. These types ensure type safety
 * and provide clear contracts for data structures used throughout the dashboard.
 */
/**
 * Core budget usage statistics from the backend API.
 * Represents real-time budget consumption and limits.
 */
export interface BudgetUsageStats {
    /** Current request count for the period */
    requestCount: number;
    /** Daily request limit configured for the budget */
    dailyLimit: number;
    /** Number of requests remaining in the current period */
    remainingRequests: number;
    /** Usage percentage (0-100) */
    usagePercentage: number;
    /** Human-readable time until budget reset */
    timeUntilReset: string;
    /** Timestamp of the last update */
    lastUpdated: Date;
}
/**
 * Token usage metrics for detailed consumption tracking.
 * Provides granular token consumption data across different operations.
 */
export interface TokenUsageMetrics {
    /** Total tokens consumed */
    totalTokens: number;
    /** Input tokens processed */
    inputTokens: number;
    /** Output tokens generated */
    outputTokens: number;
    /** Cached tokens utilized */
    cachedTokens: number;
    /** Cost per token in USD */
    costPerToken: number;
    /** Total cost for current usage */
    totalCost: number;
    /** Timestamp of usage */
    timestamp: Date;
}
/**
 * Historical usage data point for trend analysis.
 * Represents usage data at a specific point in time.
 */
export interface UsageDataPoint {
    /** Timestamp of the data point */
    timestamp: Date;
    /** Token usage at this point */
    tokens: number;
    /** Cost at this point in USD */
    cost: number;
    /** Request count at this point */
    requests: number;
    /** Feature or operation that generated this usage */
    feature?: string;
}
/**
 * Cost breakdown by feature or operation type.
 * Provides detailed analysis of where budget is being consumed.
 */
export interface CostBreakdownItem {
    /** Feature or operation name */
    feature: string;
    /** Total cost for this feature in USD */
    cost: number;
    /** Percentage of total budget consumed */
    percentage: number;
    /** Number of tokens used by this feature */
    tokens: number;
    /** Number of requests made by this feature */
    requests: number;
    /** Average cost per request */
    avgCostPerRequest: number;
}
/**
 * Budget alert configuration and status.
 * Defines thresholds and current alert states.
 */
export interface BudgetAlert {
    /** Unique identifier for the alert */
    id: string;
    /** Alert type identifier */
    type: 'usage_threshold' | 'cost_limit' | 'daily_limit' | 'feature_overuse';
    /** Alert severity level */
    severity: 'info' | 'warning' | 'error' | 'critical';
    /** Human-readable alert title */
    title: string;
    /** Detailed alert message */
    message: string;
    /** Threshold value that triggered the alert */
    threshold: number;
    /** Current value that exceeded the threshold */
    currentValue: number;
    /** Whether the alert is currently active */
    isActive: boolean;
    /** Timestamp when alert was first triggered */
    triggeredAt: Date;
    /** Suggested actions to address the alert */
    suggestedActions: string[];
}
/**
 * Cost projection data for future budget planning.
 * Provides estimates of future costs based on current usage patterns.
 */
export interface CostProjection {
    /** Time period for the projection */
    period: 'daily' | 'weekly' | 'monthly';
    /** Projected cost in USD */
    projectedCost: number;
    /** Confidence level of the projection (0-100) */
    confidence: number;
    /** Trend direction */
    trend: 'increasing' | 'decreasing' | 'stable';
    /** Historical data points used for projection */
    basedOnDays: number;
    /** Date range for the projection */
    projectionRange: {
        start: Date;
        end: Date;
    };
}
/**
 * Dashboard filter configuration.
 * Controls what data is displayed and how it's filtered.
 */
export interface DashboardFilters {
    /** Time range filter */
    timeRange: {
        start: Date;
        end: Date;
        preset?: 'today' | 'yesterday' | 'week' | 'month' | 'quarter' | 'year' | 'custom';
    };
    /** Features to include/exclude */
    features: {
        include: string[];
        exclude: string[];
    };
    /** Cost range filter */
    costRange?: {
        min: number;
        max: number;
    };
    /** Usage range filter */
    usageRange?: {
        min: number;
        max: number;
    };
}
/**
 * Chart data point for visualization components.
 * Generic interface for chart data representation.
 */
export interface ChartDataPoint {
    /** X-axis value (usually timestamp or category) */
    x: string | number | Date;
    /** Y-axis value (usually cost or usage) */
    y: number;
    /** Optional label for the data point */
    label?: string;
    /** Optional color for the data point */
    color?: string;
    /** Additional metadata */
    metadata?: Record<string, unknown>;
}
/**
 * Chart configuration options.
 * Controls chart appearance and behavior.
 */
export interface ChartConfig {
    /** Chart title */
    title: string;
    /** Chart width in characters */
    width: number;
    /** Chart height in characters */
    height: number;
    /** Whether to show axis labels */
    showAxes: boolean;
    /** Whether to show grid lines */
    showGrid: boolean;
    /** Color scheme for the chart */
    colorScheme: 'default' | 'budget' | 'usage' | 'cost';
    /** Animation settings */
    animation?: {
        enabled: boolean;
        duration: number;
    };
}
/**
 * Dashboard view state and configuration.
 * Manages the overall state of the dashboard interface.
 */
export interface DashboardState {
    /** Currently active view */
    activeView: 'overview' | 'usage' | 'costs' | 'trends' | 'alerts' | 'settings';
    /** Current filter configuration */
    filters: DashboardFilters;
    /** Whether data is currently loading */
    isLoading: boolean;
    /** Last data refresh timestamp */
    lastRefresh: Date;
    /** Auto-refresh interval in seconds */
    refreshInterval: number;
    /** Whether auto-refresh is enabled */
    autoRefresh: boolean;
    /** Error state if any */
    error: string | null;
}
/**
 * Component props for the main BudgetDashboard component.
 * Configures the dashboard behavior and data sources.
 */
export interface BudgetDashboardProps {
    /** Project root directory for budget tracking */
    projectRoot: string;
    /** Budget configuration settings */
    budgetSettings?: {
        enabled: boolean;
        dailyLimit?: number;
        alerts?: {
            enabled: boolean;
            thresholds: number[];
        };
    };
    /** Initial view to display */
    initialView?: DashboardState['activeView'];
    /** Whether to start in compact mode */
    compact?: boolean;
    /** Custom refresh interval in seconds */
    refreshInterval?: number;
}
/**
 * Props for chart components.
 * Generic interface for all chart component props.
 */
export interface ChartComponentProps {
    /** Chart data to display */
    data: ChartDataPoint[];
    /** Chart configuration */
    config: ChartConfig;
    /** Whether the chart is loading */
    loading?: boolean;
    /** Error message if chart failed to load */
    error?: string;
    /** Callback when chart is clicked */
    onChartClick?: (dataPoint: ChartDataPoint) => void;
}
/**
 * Utility type for time series data.
 * Represents time-based data points for trend analysis.
 */
export type TimeSeriesData = Array<{
    timestamp: Date;
    value: number;
    label?: string;
}>;
/**
 * Color theme for dashboard components.
 * Defines consistent color scheme across all components.
 */
export interface DashboardTheme {
    /** Primary colors */
    primary: {
        main: string;
        light: string;
        dark: string;
    };
    /** Status colors */
    status: {
        success: string;
        warning: string;
        error: string;
        info: string;
    };
    /** Chart colors */
    charts: {
        line: string;
        bar: string;
        pie: string[];
        grid: string;
        axes: string;
    };
    /** Text colors */
    text: {
        primary: string;
        secondary: string;
        muted: string;
    };
}
