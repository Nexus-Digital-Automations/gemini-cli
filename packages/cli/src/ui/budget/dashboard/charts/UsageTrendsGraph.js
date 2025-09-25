/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { jsx as _jsx, jsxs as _jsxs } from 'react/jsx-runtime';
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
export const UsageTrendsGraph = ({
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
    return _jsxs(Box, {
      flexDirection: 'column',
      borderStyle: 'single',
      paddingX: 2,
      paddingY: 1,
      width: config.width,
      height: config.height,
      children: [
        _jsx(Text, {
          color: theme.text.secondary,
          bold: true,
          children: config.title,
        }),
        _jsx(Box, {
          flexGrow: 1,
          justifyContent: 'center',
          alignItems: 'center',
          children: _jsx(Text, {
            color: theme.text.muted,
            children: 'Loading trends data...',
          }),
        }),
      ],
    });
  }
  // Handle error state
  if (error) {
    return _jsxs(Box, {
      flexDirection: 'column',
      borderStyle: 'single',
      paddingX: 2,
      paddingY: 1,
      width: config.width,
      height: config.height,
      children: [
        _jsx(Text, {
          color: theme.text.secondary,
          bold: true,
          children: config.title,
        }),
        _jsx(Box, {
          flexGrow: 1,
          justifyContent: 'center',
          alignItems: 'center',
          children: _jsxs(Text, {
            color: theme.status.error,
            children: ['Error: ', error],
          }),
        }),
      ],
    });
  }
  // Handle empty data
  if (data.length === 0) {
    return _jsxs(Box, {
      flexDirection: 'column',
      borderStyle: 'single',
      paddingX: 2,
      paddingY: 1,
      width: config.width,
      height: config.height,
      children: [
        _jsx(Text, {
          color: theme.text.secondary,
          bold: true,
          children: config.title,
        }),
        _jsx(Box, {
          flexGrow: 1,
          justifyContent: 'center',
          alignItems: 'center',
          children: _jsx(Text, {
            color: theme.text.muted,
            children: 'No trends data available',
          }),
        }),
      ],
    });
  }
  // Prepare and aggregate data
  const aggregatedData = aggregateUsageByPeriod(data, period);
  const tokenData = convertUsageToChartData(aggregatedData, 'tokens');
  const costData = convertUsageToChartData(aggregatedData, 'cost');
  const requestData = convertUsageToChartData(aggregatedData, 'requests');
  // Calculate moving averages if enabled
  const tokenValues = tokenData.map((point) => point.y);
  const costValues = costData.map((point) => point.y);
  const requestValues = requestData.map((point) => point.y);
  // Calculate trend statistics
  const calculateTrendStats = (values) => {
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
    return _jsx(Box, {
      justifyContent: 'space-between',
      marginBottom: 1,
      children: _jsxs(Box, {
        gap: 3,
        children: [
          _jsxs(Box, {
            flexDirection: 'column',
            children: [
              _jsx(Text, { color: theme.text.muted, children: 'Period' }),
              _jsx(Text, { color: theme.text.primary, children: period }),
            ],
          }),
          _jsxs(Box, {
            flexDirection: 'column',
            children: [
              _jsx(Text, { color: theme.text.muted, children: 'Data Points' }),
              _jsx(Text, {
                color: theme.text.primary,
                children: aggregatedData.length,
              }),
            ],
          }),
          _jsxs(Box, {
            flexDirection: 'column',
            children: [
              _jsx(Text, { color: theme.text.muted, children: 'Time Range' }),
              _jsx(Text, { color: theme.text.primary, children: timeRange }),
            ],
          }),
        ],
      }),
    });
  };
  /**
   * Renders trend indicators for each metric.
   */
  const renderTrendIndicators = () => {
    const getTrendColor = (trend) =>
      trend === 'increasing'
        ? theme.status.warning
        : trend === 'decreasing'
          ? theme.status.success
          : theme.text.muted;
    const getTrendIcon = (trend) =>
      trend === 'increasing' ? '↗' : trend === 'decreasing' ? '↘' : '→';
    return _jsxs(Box, {
      gap: 4,
      marginBottom: 1,
      children: [
        _jsxs(Box, {
          flexDirection: 'column',
          children: [
            _jsx(Text, { color: theme.text.muted, children: 'Tokens' }),
            _jsxs(Text, {
              color: getTrendColor(tokenTrend.trend),
              children: [
                getTrendIcon(tokenTrend.trend),
                ' ',
                tokenTrend.change.toFixed(1),
                '%',
              ],
            }),
          ],
        }),
        _jsxs(Box, {
          flexDirection: 'column',
          children: [
            _jsx(Text, { color: theme.text.muted, children: 'Cost' }),
            _jsxs(Text, {
              color: getTrendColor(costTrend.trend),
              children: [
                getTrendIcon(costTrend.trend),
                ' ',
                costTrend.change.toFixed(1),
                '%',
              ],
            }),
          ],
        }),
        _jsxs(Box, {
          flexDirection: 'column',
          children: [
            _jsx(Text, { color: theme.text.muted, children: 'Requests' }),
            _jsxs(Text, {
              color: getTrendColor(requestTrend.trend),
              children: [
                getTrendIcon(requestTrend.trend),
                ' ',
                requestTrend.change.toFixed(1),
                '%',
              ],
            }),
          ],
        }),
      ],
    });
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
    return _jsxs(Box, {
      flexDirection: 'column',
      children: [
        _jsx(Text, {
          color: theme.text.muted,
          marginBottom: 1,
          children: 'Token Usage Trend:',
        }),
        _jsx(Box, {
          alignItems: 'center',
          gap: 1,
          marginBottom: 1,
          children: _jsx(Text, {
            color: theme.charts.line,
            children: tokenSparkline,
          }),
        }),
        _jsxs(Box, {
          justifyContent: 'space-between',
          marginBottom: 1,
          children: [
            _jsxs(Text, {
              color: theme.text.muted,
              children: ['Min: ', formatCompact(minTokens)],
            }),
            _jsxs(Text, {
              color: theme.text.muted,
              children: ['Avg: ', formatCompact(avgTokens)],
            }),
            _jsxs(Text, {
              color: theme.text.muted,
              children: ['Max: ', formatCompact(maxTokens)],
            }),
          ],
        }),
        showMovingAverage &&
          tokenValues.length > 5 &&
          _jsxs(Box, {
            marginTop: 1,
            children: [
              _jsx(Text, {
                color: theme.text.muted,
                marginBottom: 1,
                children: 'Moving Average (5-period):',
              }),
              _jsx(Text, {
                color: theme.status.info,
                children: createSparkline(
                  calculateMovingAverage(
                    tokenValues.map((value, index) => ({
                      timestamp: aggregatedData[index]?.timestamp || new Date(),
                      value,
                    })),
                  ).map((point) => point.value),
                  sparklineWidth,
                ),
              }),
            ],
          }),
      ],
    });
  };
  /**
   * Renders multiple metrics trends simultaneously.
   */
  const renderMultipleMetricsTrend = () => {
    const sparklineWidth = config.width - 15; // Reserve space for labels
    return _jsxs(Box, {
      flexDirection: 'column',
      children: [
        _jsxs(Box, {
          gap: 1,
          marginBottom: 1,
          children: [
            _jsx(Text, {
              color: theme.charts.line,
              minWidth: 10,
              children: 'Tokens:',
            }),
            _jsx(Text, {
              color: theme.charts.line,
              children: createSparkline(tokenValues, sparklineWidth),
            }),
          ],
        }),
        _jsxs(Box, {
          gap: 1,
          marginBottom: 1,
          children: [
            _jsx(Text, {
              color: theme.status.warning,
              minWidth: 10,
              children: 'Cost:',
            }),
            _jsx(Text, {
              color: theme.status.warning,
              children: createSparkline(costValues, sparklineWidth),
            }),
          ],
        }),
        _jsxs(Box, {
          gap: 1,
          marginBottom: 1,
          children: [
            _jsx(Text, {
              color: theme.status.success,
              minWidth: 10,
              children: 'Requests:',
            }),
            _jsx(Text, {
              color: theme.status.success,
              children: createSparkline(requestValues, sparklineWidth),
            }),
          ],
        }),
      ],
    });
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
    const chartLines = Array(chartHeight).fill('');
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
    return _jsxs(Box, {
      flexDirection: 'column',
      children: [
        _jsx(Text, {
          color: theme.text.muted,
          marginBottom: 1,
          children: 'Token Usage Over Time:',
        }),
        chartLines.map((line, index) =>
          _jsx(
            Text,
            { color: theme.charts.line, children: line || ' ' },
            index,
          ),
        ),
        _jsxs(Box, {
          justifyContent: 'space-between',
          marginTop: 1,
          children: [
            _jsx(Text, {
              color: theme.text.muted,
              children: formatTime(aggregatedData[0]?.timestamp || new Date()),
            }),
            _jsx(Text, {
              color: theme.text.muted,
              children: formatTime(
                aggregatedData[aggregatedData.length - 1]?.timestamp ||
                  new Date(),
              ),
            }),
          ],
        }),
      ],
    });
  };
  /**
   * Renders recent data points summary.
   */
  const renderRecentDataSummary = () => {
    const recentPoints = aggregatedData.slice(-5);
    return _jsxs(Box, {
      flexDirection: 'column',
      marginTop: 1,
      children: [
        _jsx(Text, {
          color: theme.text.muted,
          marginBottom: 1,
          children: 'Recent Periods:',
        }),
        recentPoints.map((point, index) =>
          _jsxs(
            Box,
            {
              justifyContent: 'space-between',
              marginBottom: 1,
              children: [
                _jsx(Text, {
                  color: theme.text.secondary,
                  children: formatTime(point.timestamp, 'medium'),
                }),
                _jsx(Text, {
                  color: theme.text.primary,
                  children: formatCompact(point.tokens),
                }),
                _jsx(Text, {
                  color: theme.status.warning,
                  children: formatCurrency(point.cost),
                }),
                _jsxs(Text, {
                  color: theme.text.muted,
                  children: [point.requests, ' req'],
                }),
              ],
            },
            index,
          ),
        ),
      ],
    });
  };
  // Render the complete trends graph
  return _jsxs(Box, {
    flexDirection: 'column',
    borderStyle: 'single',
    paddingX: 2,
    paddingY: 1,
    width: config.width,
    height: config.height,
    children: [
      _jsx(Text, {
        color: theme.text.secondary,
        bold: true,
        marginBottom: 1,
        children: config.title,
      }),
      renderTrendsHeader(),
      renderTrendIndicators(),
      _jsx(Box, {
        flexGrow: 1,
        children:
          config.height > 20
            ? renderDetailedLineChart()
            : showMultipleMetrics
              ? renderMultipleMetricsTrend()
              : renderSingleMetricTrend(),
      }),
      config.height > 15 && renderRecentDataSummary(),
      _jsxs(Box, {
        justifyContent: 'space-between',
        marginTop: 1,
        paddingTop: 1,
        borderTop: true,
        children: [
          _jsxs(Text, {
            color: theme.text.muted,
            children: [aggregatedData.length, ' ', period, 's analyzed'],
          }),
          _jsxs(Text, {
            color: theme.text.muted,
            children: ['Updated: ', formatTime(new Date())],
          }),
        ],
      }),
    ],
  });
};
//# sourceMappingURL=UsageTrendsGraph.js.map
