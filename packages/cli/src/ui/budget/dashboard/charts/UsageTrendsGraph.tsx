/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type React from 'react';
import { Box, Text } from 'ink';
import { theme } from '../../../semantic-colors.js';
import {
  convertUsageToChartData,
  formatCompact,
  formatCurrency,
  formatTime,
  createSparkline,
  calculateMovingAverage,
  aggregateUsageByPeriod,
} from '../utils/chartUtils.js';
import type { ChartConfig, UsageDataPoint } from '../types/index.js';

/**
 * Props for the UsageTrendsGraph component.
 */
interface UsageTrendsGraphProps {
  /** Usage data points to visualize trends */
  data: UsageDataPoint[];
  /** Chart configuration options */
  config: ChartConfig;
  /** Whether the chart is currently loading */
  loading?: boolean;
  /** Error message if chart failed to load */
  error?: string;
  /** Time period for trend aggregation */
  period?: 'hour' | 'day' | 'week' | 'month';
  /** Whether to show moving average */
  showMovingAverage?: boolean;
  /** Whether to show multiple metrics simultaneously */
  showMultipleMetrics?: boolean;
}

/**
 * Usage Trends Graph Component
 *
 * This component visualizes historical usage trends using ASCII-based
 * line graphs optimized for CLI interfaces. It displays trend analysis,
 * moving averages, and comparative metrics over time.
 *
 * Features:
 * - Historical trend visualization
 * - Multiple metrics display (tokens, cost, requests)
 * - Moving average trend lines
 * - Time period aggregation
 * - Trend direction indicators
 * - Interactive data exploration
 * - Responsive layout for different terminal sizes
 *
 * @param props - Configuration and data for the trends graph
 * @returns Interactive usage trends graph component
 */
export const UsageTrendsGraph: React.FC<UsageTrendsGraphProps> = ({
  data,
  config,
  loading = false,
  error,
  period = 'day',
  showMovingAverage = true,
  showMultipleMetrics = false,
}) => {
  // Handle loading state
  if (loading) {
    return (
      <Box
        flexDirection="column"
        borderStyle="single"
        paddingX={2}
        paddingY={1}
        width={config.width}
        height={config.height}
      >
        <Text color={theme.text.secondary} bold>
          {config.title}
        </Text>
        <Box flexGrow={1} justifyContent="center" alignItems="center">
          <Text color={theme.text.muted}>Loading trends data...</Text>
        </Box>
      </Box>
    );
  }

  // Handle error state
  if (error) {
    return (
      <Box
        flexDirection="column"
        borderStyle="single"
        paddingX={2}
        paddingY={1}
        width={config.width}
        height={config.height}
      >
        <Text color={theme.text.secondary} bold>
          {config.title}
        </Text>
        <Box flexGrow={1} justifyContent="center" alignItems="center">
          <Text color={theme.status.error}>Error: {error}</Text>
        </Box>
      </Box>
    );
  }

  // Handle empty data
  if (data.length === 0) {
    return (
      <Box
        flexDirection="column"
        borderStyle="single"
        paddingX={2}
        paddingY={1}
        width={config.width}
        height={config.height}
      >
        <Text color={theme.text.secondary} bold>
          {config.title}
        </Text>
        <Box flexGrow={1} justifyContent="center" alignItems="center">
          <Text color={theme.text.muted}>No trends data available</Text>
        </Box>
      </Box>
    );
  }

  // Prepare and aggregate data
  const aggregatedData = aggregateUsageByPeriod(data, period);
  const tokenData = convertUsageToChartData(aggregatedData, 'tokens');
  const costData = convertUsageToChartData(aggregatedData, 'cost');
  const requestData = convertUsageToChartData(aggregatedData, 'requests');

  // Calculate moving averages if enabled
  const tokenValues = tokenData.map((point) => point.y as number);
  const costValues = costData.map((point) => point.y as number);
  const requestValues = requestData.map((point) => point.y as number);

  // Calculate trend statistics
  const calculateTrendStats = (values: number[]) => {
    if (values.length < 2) return { trend: 'stable', change: 0 };

    const recent = values.slice(-Math.min(5, Math.floor(values.length / 3)));
    const earlier = values.slice(0, Math.min(5, Math.floor(values.length / 3)));

    const recentAvg = recent.reduce((sum, val) => sum + val, 0) / recent.length;
    const earlierAvg =
      earlier.reduce((sum, val) => sum + val, 0) / earlier.length;

    const change = ((recentAvg - earlierAvg) / earlierAvg) * 100;

    return {
      trend: change > 5 ? 'increasing' : change < -5 ? 'decreasing' : 'stable',
      change: Math.abs(change),
    };
  };

  const tokenTrend = calculateTrendStats(tokenValues);
  const costTrend = calculateTrendStats(costValues);
  const requestTrend = calculateTrendStats(requestValues);

  /**
   * Renders the trends statistics header.
   */
  const renderTrendsHeader = () => {
    const timeRange =
      aggregatedData.length > 0
        ? `${formatTime(aggregatedData[0].timestamp)} - ${formatTime(aggregatedData[aggregatedData.length - 1].timestamp)}`
        : 'No time range';

    return (
      <Box justifyContent="space-between" marginBottom={1}>
        <Box gap={3}>
          <Box flexDirection="column">
            <Text color={theme.text.muted}>Period</Text>
            <Text color={theme.text.primary}>{period}</Text>
          </Box>
          <Box flexDirection="column">
            <Text color={theme.text.muted}>Data Points</Text>
            <Text color={theme.text.primary}>{aggregatedData.length}</Text>
          </Box>
          <Box flexDirection="column">
            <Text color={theme.text.muted}>Time Range</Text>
            <Text color={theme.text.primary}>{timeRange}</Text>
          </Box>
        </Box>
      </Box>
    );
  };

  /**
   * Renders trend indicators for each metric.
   */
  const renderTrendIndicators = () => {
    const getTrendColor = (trend: string) =>
      trend === 'increasing'
        ? theme.status.warning
        : trend === 'decreasing'
          ? theme.status.success
          : theme.text.muted;

    const getTrendIcon = (trend: string) =>
      trend === 'increasing' ? '↗' : trend === 'decreasing' ? '↘' : '→';

    return (
      <Box gap={4} marginBottom={1}>
        <Box flexDirection="column">
          <Text color={theme.text.muted}>Tokens</Text>
          <Text color={getTrendColor(tokenTrend.trend)}>
            {getTrendIcon(tokenTrend.trend)} {tokenTrend.change.toFixed(1)}%
          </Text>
        </Box>
        <Box flexDirection="column">
          <Text color={theme.text.muted}>Cost</Text>
          <Text color={getTrendColor(costTrend.trend)}>
            {getTrendIcon(costTrend.trend)} {costTrend.change.toFixed(1)}%
          </Text>
        </Box>
        <Box flexDirection="column">
          <Text color={theme.text.muted}>Requests</Text>
          <Text color={getTrendColor(requestTrend.trend)}>
            {getTrendIcon(requestTrend.trend)} {requestTrend.change.toFixed(1)}%
          </Text>
        </Box>
      </Box>
    );
  };

  /**
   * Renders a single metric trend line.
   */
  const renderSingleMetricTrend = () => {
    const sparklineWidth = config.width - 4;
    const tokenSparkline = createSparkline(tokenValues, sparklineWidth);

    // Calculate key statistics
    const totalTokens = tokenValues.reduce((sum, val) => sum + val, 0);
    const avgTokens = totalTokens / tokenValues.length;
    const maxTokens = Math.max(...tokenValues);
    const minTokens = Math.min(...tokenValues);

    return (
      <Box flexDirection="column">
        <Box marginBottom={1}>
          <Text color={theme.text.muted}>Token Usage Trend:</Text>
        </Box>

        <Box alignItems="center" gap={1} marginBottom={1}>
          <Text color={theme.charts.line}>{tokenSparkline}</Text>
        </Box>

        <Box justifyContent="space-between" marginBottom={1}>
          <Text color={theme.text.muted}>Min: {formatCompact(minTokens)}</Text>
          <Text color={theme.text.muted}>Avg: {formatCompact(avgTokens)}</Text>
          <Text color={theme.text.muted}>Max: {formatCompact(maxTokens)}</Text>
        </Box>

        {showMovingAverage && tokenValues.length > 5 && (
          <Box marginTop={1}>
            <Box marginBottom={1}>
              <Text color={theme.text.muted}>Moving Average (5-period):</Text>
            </Box>
            <Text color={theme.status.info}>
              {createSparkline(
                calculateMovingAverage(
                  tokenValues.map((value, index) => ({
                    timestamp: aggregatedData[index]?.timestamp || new Date(),
                    value,
                  })),
                ).map((point) => point.value),
                sparklineWidth,
              )}
            </Text>
          </Box>
        )}
      </Box>
    );
  };

  /**
   * Renders multiple metrics trends simultaneously.
   */
  const renderMultipleMetricsTrend = () => {
    const sparklineWidth = config.width - 15; // Reserve space for labels

    return (
      <Box flexDirection="column">
        <Box gap={1} marginBottom={1}>
          <Box minWidth={10}>
            <Text color={theme.charts.line}>Tokens:</Text>
          </Box>
          <Text color={theme.charts.line}>
            {createSparkline(tokenValues, sparklineWidth)}
          </Text>
        </Box>

        <Box gap={1} marginBottom={1}>
          <Box minWidth={10}>
            <Text color={theme.status.warning}>Cost:</Text>
          </Box>
          <Text color={theme.status.warning}>
            {createSparkline(costValues, sparklineWidth)}
          </Text>
        </Box>

        <Box gap={1} marginBottom={1}>
          <Box minWidth={10}>
            <Text color={theme.status.success}>Requests:</Text>
          </Box>
          <Text color={theme.status.success}>
            {createSparkline(requestValues, sparklineWidth)}
          </Text>
        </Box>
      </Box>
    );
  };

  /**
   * Renders detailed ASCII line chart for larger displays.
   */
  const renderDetailedLineChart = () => {
    const chartHeight = config.height - 8; // Reserve space for headers and footers
    const chartWidth = config.width - 8; // Reserve space for borders and labels

    // Create ASCII line chart using block characters
    const maxValue = Math.max(...tokenValues);
    const minValue = Math.min(...tokenValues);
    const range = maxValue - minValue || 1;

    const chartLines: string[] = Array(chartHeight).fill('');

    tokenValues.forEach((value, index) => {
      const x = Math.floor(
        (index / (tokenValues.length - 1)) * (chartWidth - 1),
      );
      const normalizedValue = (value - minValue) / range;
      const y = Math.floor(normalizedValue * (chartHeight - 1));
      const displayY = chartHeight - 1 - y;

      // Simple line representation
      if (chartLines[displayY].length <= x) {
        chartLines[displayY] = chartLines[displayY].padEnd(x, ' ') + '●';
      }
    });

    return (
      <Box flexDirection="column">
        <Box marginBottom={1}>
          <Text color={theme.text.muted}>Token Usage Over Time:</Text>
        </Box>

        {chartLines.map((line, index) => (
          <Text key={index} color={theme.charts.line}>
            {line || ' '}
          </Text>
        ))}

        <Box justifyContent="space-between" marginTop={1}>
          <Text color={theme.text.muted}>
            {formatTime(aggregatedData[0]?.timestamp || new Date())}
          </Text>
          <Text color={theme.text.muted}>
            {formatTime(
              aggregatedData[aggregatedData.length - 1]?.timestamp ||
                new Date(),
            )}
          </Text>
        </Box>
      </Box>
    );
  };

  /**
   * Renders recent data points summary.
   */
  const renderRecentDataSummary = () => {
    const recentPoints = aggregatedData.slice(-5);

    return (
      <Box flexDirection="column" marginTop={1}>
        <Box marginBottom={1}>
          <Text color={theme.text.muted}>Recent Periods:</Text>
        </Box>
        {recentPoints.map((point, index) => (
          <Box key={index} justifyContent="space-between" marginBottom={1}>
            <Text color={theme.text.secondary}>
              {formatTime(point.timestamp, 'medium')}
            </Text>
            <Text color={theme.text.primary}>
              {formatCompact(point.tokens)}
            </Text>
            <Text color={theme.status.warning}>
              {formatCurrency(point.cost)}
            </Text>
            <Text color={theme.text.muted}>{point.requests} req</Text>
          </Box>
        ))}
      </Box>
    );
  };

  // Render the complete trends graph
  return (
    <Box
      flexDirection="column"
      borderStyle="single"
      paddingX={2}
      paddingY={1}
      width={config.width}
      height={config.height}
    >
      {/* Title */}
      <Box marginBottom={1}>
        <Text color={theme.text.secondary} bold>
          {config.title}
        </Text>
      </Box>

      {/* Trends header */}
      {renderTrendsHeader()}

      {/* Trend indicators */}
      {renderTrendIndicators()}

      {/* Chart visualization */}
      <Box flexGrow={1}>
        {config.height > 20
          ? renderDetailedLineChart()
          : showMultipleMetrics
            ? renderMultipleMetricsTrend()
            : renderSingleMetricTrend()}
      </Box>

      {/* Additional information for larger charts */}
      {config.height > 15 && renderRecentDataSummary()}

      {/* Footer */}
      <Box
        justifyContent="space-between"
        marginTop={1}
        paddingTop={1}
        borderTop
      >
        <Text color={theme.text.muted}>
          {aggregatedData.length} {period}s analyzed
        </Text>
        <Text color={theme.text.muted}>Updated: {formatTime(new Date())}</Text>
      </Box>
    </Box>
  );
};
