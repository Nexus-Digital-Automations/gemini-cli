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
  formatTime,
  createSparkline,
  calculateMovingAverage,
  createTimeSeriesFromMetrics,
} from '../utils/chartUtils.js';
import type { ChartConfig, UsageDataPoint, TokenUsageMetrics } from '../types/index.js';

/**
 * Props for the TokenUsageChart component.
 */
interface TokenUsageChartProps {
  /** Usage data points to visualize */
  data: UsageDataPoint[];
  /** Chart configuration options */
  config: ChartConfig;
  /** Optional token usage metrics for detailed analysis */
  metrics?: TokenUsageMetrics[];
  /** Whether the chart is currently loading */
  loading?: boolean;
  /** Error message if chart failed to load */
  error?: string;
  /** Callback when a data point is clicked or selected */
  onDataPointSelect?: (dataPoint: UsageDataPoint) => void;
}

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
export const TokenUsageChart: React.FC<TokenUsageChartProps> = ({
  data,
  config,
  metrics = [],
  loading = false,
  error,
  onDataPointSelect,
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
          <Text color={theme.text.muted}>Loading token usage data...</Text>
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
          <Text color={theme.text.muted}>No token usage data available</Text>
        </Box>
      </Box>
    );
  }

  // Prepare chart data
  const tokenChartData = convertUsageToChartData(data, 'tokens');
  const tokenValues = tokenChartData.map(point => point.y as number);

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
  const renderStatsHeader = () => (
    <Box justifyContent="space-between" marginBottom={1}>
      <Box gap={3}>
        <Box flexDirection="column">
          <Text color={theme.text.muted}>Total</Text>
          <Text color={theme.text.primary}>{formatCompact(totalTokens)}</Text>
        </Box>
        <Box flexDirection="column">
          <Text color={theme.text.muted}>Avg</Text>
          <Text color={theme.text.primary}>{formatCompact(avgTokens)}</Text>
        </Box>
        <Box flexDirection="column">
          <Text color={theme.text.muted}>Peak</Text>
          <Text color={theme.status.warning}>{formatCompact(maxTokens)}</Text>
        </Box>
        <Box flexDirection="column">
          <Text color={theme.text.muted}>Low</Text>
          <Text color={theme.status.success}>{formatCompact(minTokens)}</Text>
        </Box>
      </Box>
      <Box flexDirection="column" alignItems="flex-end">
        <Text color={theme.text.muted}>Trend</Text>
        <Text color={trendColor}>
          {trendDirection === 'increasing' ? '↗' : trendDirection === 'decreasing' ? '↘' : '→'}{' '}
          {trendDirection}
        </Text>
      </Box>
    </Box>
  );

  /**
   * Renders an ASCII-based line chart using sparkline characters.
   */
  const renderSparklineChart = () => {
    const sparkline = createSparkline(tokenValues, config.width - 4);
    const timeRange = data.length > 0 ?
      `${formatTime(data[0].timestamp)} - ${formatTime(data[data.length - 1].timestamp)}` :
      'No time range';

    return (
      <Box flexDirection="column">
        <Box alignItems="center" gap={1} marginBottom={1}>
          <Text color={theme.charts.line}>{sparkline}</Text>
        </Box>
        <Box justifyContent="space-between">
          <Text color={theme.text.muted}>
            {formatCompact(minTokens)}
          </Text>
          <Text color={theme.text.muted}>
            {timeRange}
          </Text>
          <Text color={theme.text.muted}>
            {formatCompact(maxTokens)}
          </Text>
        </Box>
      </Box>
    );
  };

  /**
   * Renders a detailed ASCII bar chart for token usage.
   */
  const renderBarChart = () => {
    const barHeight = config.height - 6; // Reserve space for title and stats
    const barWidth = Math.max(1, Math.floor((config.width - 4) / Math.min(data.length, 20)));
    const visibleData = data.slice(-Math.min(data.length, Math.floor((config.width - 4) / barWidth)));

    const chartRows: string[][] = Array(barHeight).fill(null).map(() => []);

    visibleData.forEach((point, index) => {
      const normalizedValue = (point.tokens - minTokens) / (maxTokens - minTokens || 1);
      const barFillHeight = Math.round(normalizedValue * barHeight);

      for (let row = 0; row < barHeight; row++) {
        const fillRow = barHeight - row - 1;
        if (fillRow < barFillHeight) {
          chartRows[row].push('█'.repeat(barWidth));
        } else {
          chartRows[row].push(' '.repeat(barWidth));
        }
      }
    });

    return (
      <Box flexDirection="column">
        {chartRows.map((row, index) => (
          <Box key={index}>
            <Text color={theme.charts.bar}>
              {row.join('')}
            </Text>
          </Box>
        ))}
        <Box justifyContent="space-between" marginTop={1}>
          <Text color={theme.text.muted}>
            {formatTime(visibleData[0]?.timestamp || new Date())}
          </Text>
          <Text color={theme.text.muted}>
            {formatTime(visibleData[visibleData.length - 1]?.timestamp || new Date())}
          </Text>
        </Box>
      </Box>
    );
  };

  /**
   * Renders token type breakdown if metrics are available.
   */
  const renderTokenBreakdown = () => {
    if (metrics.length === 0) return null;

    const latestMetric = metrics[metrics.length - 1];
    const total = latestMetric.totalTokens;

    if (total === 0) return null;

    const inputPct = (latestMetric.inputTokens / total) * 100;
    const outputPct = (latestMetric.outputTokens / total) * 100;
    const cachedPct = (latestMetric.cachedTokens / total) * 100;

    return (
      <Box flexDirection="column" marginTop={1}>
        <Text color={theme.text.muted}>Token Breakdown:</Text>
        <Box gap={2} marginTop={1}>
          <Text color={theme.status.info}>
            Input: {formatCompact(latestMetric.inputTokens)} ({inputPct.toFixed(1)}%)
          </Text>
          <Text color={theme.status.success}>
            Output: {formatCompact(latestMetric.outputTokens)} ({outputPct.toFixed(1)}%)
          </Text>
          <Text color={theme.status.warning}>
            Cached: {formatCompact(latestMetric.cachedTokens)} ({cachedPct.toFixed(1)}%)
          </Text>
        </Box>
      </Box>
    );
  };

  /**
   * Renders recent data points for detailed inspection.
   */
  const renderRecentDataPoints = () => {
    const recentPoints = data.slice(-5);

    return (
      <Box flexDirection="column" marginTop={1}>
        <Text color={theme.text.muted}>Recent Usage:</Text>
        {recentPoints.map((point, index) => (
          <Box key={index} justifyContent="space-between" marginTop={1}>
            <Text color={theme.text.secondary}>
              {formatTime(point.timestamp, 'medium')}
            </Text>
            <Text color={theme.text.primary}>
              {formatCompact(point.tokens)} tokens
            </Text>
            {point.feature && (
              <Text color={theme.text.muted}>
                {point.feature}
              </Text>
            )}
          </Box>
        ))}
      </Box>
    );
  };

  // Render the complete chart
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
      <Text color={theme.text.secondary} bold marginBottom={1}>
        {config.title}
      </Text>

      {/* Statistics header */}
      {renderStatsHeader()}

      {/* Chart visualization */}
      <Box flexGrow={1}>
        {config.height > 12 ? renderBarChart() : renderSparklineChart()}
      </Box>

      {/* Additional information for larger charts */}
      {config.height > 15 && (
        <>
          {renderTokenBreakdown()}
          {config.height > 20 && renderRecentDataPoints()}
        </>
      )}

      {/* Footer with data info */}
      <Box justifyContent="space-between" marginTop={1} paddingTop={1} borderTop>
        <Text color={theme.text.muted}>
          {data.length} data points
        </Text>
        <Text color={theme.text.muted}>
          Updated: {formatTime(new Date())}
        </Text>
      </Box>
    </Box>
  );
};