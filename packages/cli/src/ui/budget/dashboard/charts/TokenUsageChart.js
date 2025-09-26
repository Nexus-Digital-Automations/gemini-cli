/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Box, Text } from 'ink';
import { theme } from '../../../semantic-colors.js';
import { convertUsageToChartData, formatCompact, formatTime, createSparkline, } from '../utils/chartUtils.js';
/**
 * Token Usage Chart Component
 *
 * This component visualizes token usage over time using ASCII-based charts
 * optimized for CLI interfaces. It displays real-time token consumption
 * patterns, trends, and provides interactive data exploration.
 *
 * Features:
 * - Real-time token usage visualization
 * - Interactive data point selection
 * - Multiple display modes (line chart, sparkline, bar chart)
 * - Token type breakdown (input/output/cached)
 * - Moving average trend analysis
 * - Responsive layout for different terminal sizes
 *
 * @param props - Configuration and data for the chart
 * @returns Interactive token usage chart component
 */
export const TokenUsageChart = ({ data, config, metrics = [], loading = false, error, onDataPointSelect: _onDataPointSelect, }) => {
    // Handle loading state
    if (loading) {
        return (_jsxs(Box, { flexDirection: "column", borderStyle: "single", paddingX: 2, paddingY: 1, width: config.width, height: config.height, children: [_jsx(Text, { color: theme.text.secondary, bold: true, children: config.title }), _jsx(Box, { flexGrow: 1, justifyContent: "center", alignItems: "center", children: _jsx(Text, { color: theme.text.muted, children: "Loading token usage data..." }) })] }));
    }
    // Handle error state
    if (error) {
        return (_jsxs(Box, { flexDirection: "column", borderStyle: "single", paddingX: 2, paddingY: 1, width: config.width, height: config.height, children: [_jsx(Text, { color: theme.text.secondary, bold: true, children: config.title }), _jsx(Box, { flexGrow: 1, justifyContent: "center", alignItems: "center", children: _jsxs(Text, { color: theme.status.error, children: ["Error: ", error] }) })] }));
    }
    // Handle empty data
    if (data.length === 0) {
        return (_jsxs(Box, { flexDirection: "column", borderStyle: "single", paddingX: 2, paddingY: 1, width: config.width, height: config.height, children: [_jsx(Text, { color: theme.text.secondary, bold: true, children: config.title }), _jsx(Box, { flexGrow: 1, justifyContent: "center", alignItems: "center", children: _jsx(Text, { color: theme.text.muted, children: "No token usage data available" }) })] }));
    }
    // Prepare chart data
    const tokenChartData = convertUsageToChartData(data, 'tokens');
    const tokenValues = tokenChartData.map((point) => point.y);
    // Calculate statistics
    const totalTokens = tokenValues.reduce((sum, value) => sum + value, 0);
    const avgTokens = totalTokens / tokenValues.length;
    const maxTokens = Math.max(...tokenValues);
    const minTokens = Math.min(...tokenValues);
    // Calculate trend
    const recentData = tokenValues.slice(-10);
    const earlierData = tokenValues.slice(-20, -10);
    const recentAvg = recentData.reduce((sum, val) => sum + val, 0) / recentData.length;
    const earlierAvg = earlierData.length > 0
        ? earlierData.reduce((sum, val) => sum + val, 0) / earlierData.length
        : recentAvg;
    const trendDirection = recentAvg > earlierAvg * 1.1
        ? 'increasing'
        : recentAvg < earlierAvg * 0.9
            ? 'decreasing'
            : 'stable';
    const trendColor = trendDirection === 'increasing'
        ? theme.status.warning
        : trendDirection === 'decreasing'
            ? theme.status.success
            : theme.text.muted;
    /**
     * Renders the chart statistics header.
     */
    const renderStatsHeader = () => (_jsxs(Box, { justifyContent: "space-between", marginBottom: 1, children: [_jsxs(Box, { gap: 3, children: [_jsxs(Box, { flexDirection: "column", children: [_jsx(Text, { color: theme.text.muted, children: "Total" }), _jsx(Text, { color: theme.text.primary, children: formatCompact(totalTokens) })] }), _jsxs(Box, { flexDirection: "column", children: [_jsx(Text, { color: theme.text.muted, children: "Avg" }), _jsx(Text, { color: theme.text.primary, children: formatCompact(avgTokens) })] }), _jsxs(Box, { flexDirection: "column", children: [_jsx(Text, { color: theme.text.muted, children: "Peak" }), _jsx(Text, { color: theme.status.warning, children: formatCompact(maxTokens) })] }), _jsxs(Box, { flexDirection: "column", children: [_jsx(Text, { color: theme.text.muted, children: "Low" }), _jsx(Text, { color: theme.status.success, children: formatCompact(minTokens) })] })] }), _jsxs(Box, { flexDirection: "column", alignItems: "flex-end", children: [_jsx(Text, { color: theme.text.muted, children: "Trend" }), _jsxs(Text, { color: trendColor, children: [trendDirection === 'increasing'
                                ? '↗'
                                : trendDirection === 'decreasing'
                                    ? '↘'
                                    : '→', ' ', trendDirection] })] })] }));
    /**
     * Renders an ASCII-based line chart using sparkline characters.
     */
    const renderSparklineChart = () => {
        const sparkline = createSparkline(tokenValues, config.width - 4);
        const timeRange = data.length > 0
            ? `${formatTime(data[0].timestamp)} - ${formatTime(data[data.length - 1].timestamp)}`
            : 'No time range';
        return (_jsxs(Box, { flexDirection: "column", children: [_jsx(Box, { alignItems: "center", gap: 1, marginBottom: 1, children: _jsx(Text, { color: theme.charts.line, children: sparkline }) }), _jsxs(Box, { justifyContent: "space-between", children: [_jsx(Text, { color: theme.text.muted, children: formatCompact(minTokens) }), _jsx(Text, { color: theme.text.muted, children: timeRange }), _jsx(Text, { color: theme.text.muted, children: formatCompact(maxTokens) })] })] }));
    };
    /**
     * Renders a detailed ASCII bar chart for token usage.
     */
    const renderBarChart = () => {
        const barHeight = config.height - 6; // Reserve space for title and stats
        const barWidth = Math.max(1, Math.floor((config.width - 4) / Math.min(data.length, 20)));
        const visibleData = data.slice(-Math.min(data.length, Math.floor((config.width - 4) / barWidth)));
        const chartRows = Array(barHeight)
            .fill(null)
            .map(() => []);
        visibleData.forEach((point, _index) => {
            const normalizedValue = (point.tokens - minTokens) / (maxTokens - minTokens || 1);
            const barFillHeight = Math.round(normalizedValue * barHeight);
            for (let row = 0; row < barHeight; row++) {
                const fillRow = barHeight - row - 1;
                if (fillRow < barFillHeight) {
                    chartRows[row].push('█'.repeat(barWidth));
                }
                else {
                    chartRows[row].push(' '.repeat(barWidth));
                }
            }
        });
        return (_jsxs(Box, { flexDirection: "column", children: [chartRows.map((row, rowIndex) => (_jsx(Box, { children: _jsx(Text, { color: theme.charts.bar, children: row.join('') }) }, rowIndex))), _jsxs(Box, { justifyContent: "space-between", marginTop: 1, children: [_jsx(Text, { color: theme.text.muted, children: formatTime(visibleData[0]?.timestamp || new Date()) }), _jsx(Text, { color: theme.text.muted, children: formatTime(visibleData[visibleData.length - 1]?.timestamp || new Date()) })] })] }));
    };
    /**
     * Renders token type breakdown if metrics are available.
     */
    const renderTokenBreakdown = () => {
        if (metrics.length === 0)
            return null;
        const latestMetric = metrics[metrics.length - 1];
        const total = latestMetric.totalTokens;
        if (total === 0)
            return null;
        const inputPct = (latestMetric.inputTokens / total) * 100;
        const outputPct = (latestMetric.outputTokens / total) * 100;
        const cachedPct = (latestMetric.cachedTokens / total) * 100;
        return (_jsxs(Box, { flexDirection: "column", marginTop: 1, children: [_jsx(Text, { color: theme.text.muted, children: "Token Breakdown:" }), _jsxs(Box, { gap: 2, marginTop: 1, children: [_jsxs(Text, { color: theme.status.info, children: ["Input: ", formatCompact(latestMetric.inputTokens), " (", inputPct.toFixed(1), "%)"] }), _jsxs(Text, { color: theme.status.success, children: ["Output: ", formatCompact(latestMetric.outputTokens), " (", outputPct.toFixed(1), "%)"] }), _jsxs(Text, { color: theme.status.warning, children: ["Cached: ", formatCompact(latestMetric.cachedTokens), " (", cachedPct.toFixed(1), "%)"] })] })] }));
    };
    /**
     * Renders recent data points for detailed inspection.
     */
    const renderRecentDataPoints = () => {
        const recentPoints = data.slice(-5);
        return (_jsxs(Box, { flexDirection: "column", marginTop: 1, children: [_jsx(Text, { color: theme.text.muted, children: "Recent Usage:" }), recentPoints.map((point, index) => (_jsxs(Box, { justifyContent: "space-between", marginTop: 1, children: [_jsx(Text, { color: theme.text.secondary, children: formatTime(point.timestamp, 'medium') }), _jsxs(Text, { color: theme.text.primary, children: [formatCompact(point.tokens), " tokens"] }), point.feature && (_jsx(Text, { color: theme.text.muted, children: point.feature }))] }, index)))] }));
    };
    // Render the complete chart
    return (_jsxs(Box, { flexDirection: "column", borderStyle: "single", paddingX: 2, paddingY: 1, width: config.width, height: config.height, children: [_jsx(Text, { color: theme.text.secondary, bold: true, marginBottom: 1, children: config.title }), renderStatsHeader(), _jsx(Box, { flexGrow: 1, children: config.height > 12 ? renderBarChart() : renderSparklineChart() }), config.height > 15 && (_jsxs(_Fragment, { children: [renderTokenBreakdown(), config.height > 20 && renderRecentDataPoints()] })), _jsxs(Box, { justifyContent: "space-between", marginTop: 1, paddingTop: 1, borderTop: true, children: [_jsxs(Text, { color: theme.text.muted, children: [data.length, " data points"] }), _jsxs(Text, { color: theme.text.muted, children: ["Updated: ", formatTime(new Date())] })] })] }));
};
//# sourceMappingURL=TokenUsageChart.js.map