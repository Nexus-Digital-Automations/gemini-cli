/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type {
  ChartDataPoint,
  TimeSeriesData,
  UsageDataPoint,
  CostBreakdownItem,
  TokenUsageMetrics,
} from '../types/index.js';

/**
 * Budget Usage Visualizer - Chart Utility Functions
 *
 * This module provides utility functions for processing and formatting data
 * for visualization components in the Budget Usage Visualizer dashboard.
 * All functions are optimized for CLI-based chart rendering using ASCII characters.
 */

/**
 * Formats a number as a currency string with appropriate precision.
 * Handles both small and large amounts with proper scaling.
 *
 * @param amount - The amount to format in USD
 * @param precision - Number of decimal places (default: 2)
 * @returns Formatted currency string
 *
 * @example
 * ```typescript
 * formatCurrency(1.234) // "$1.23"
 * formatCurrency(0.001) // "$0.001"
 * formatCurrency(1234.56) // "$1,234.56"
 * ```
 */
export function formatCurrency(amount: number, precision: number = 2): string {
  if (amount === 0) return '$0.00';

  // For very small amounts, show more precision
  if (amount < 0.01 && amount > 0) {
    return `$${amount.toFixed(6).replace(/0+$/, '').replace(/\.$/, '')}`;
  }

  // For normal amounts, use standard currency formatting
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
  }).format(amount);
}

/**
 * Formats a number as a compact string with appropriate units (K, M, B).
 * Useful for displaying large numbers in limited space.
 *
 * @param value - The value to format
 * @param precision - Number of decimal places (default: 1)
 * @returns Formatted compact string
 *
 * @example
 * ```typescript
 * formatCompact(1234) // "1.2K"
 * formatCompact(1234567) // "1.2M"
 * formatCompact(1234567890) // "1.2B"
 * ```
 */
export function formatCompact(value: number, precision: number = 1): string {
  if (Math.abs(value) < 1000) {
    return value.toString();
  }

  const units = ['', 'K', 'M', 'B', 'T'];
  const magnitude = Math.floor(Math.log10(Math.abs(value)) / 3);
  const scaled = value / Math.pow(1000, magnitude);

  return `${scaled.toFixed(precision)}${units[magnitude]}`;
}

/**
 * Formats a percentage with appropriate precision and symbol.
 * Handles edge cases like NaN, Infinity, and very small percentages.
 *
 * @param percentage - The percentage to format (0-100)
 * @param precision - Number of decimal places (default: 1)
 * @returns Formatted percentage string
 */
export function formatPercentage(
  percentage: number,
  precision: number = 1,
): string {
  if (!isFinite(percentage) || isNaN(percentage)) {
    return '0.0%';
  }

  // For very small percentages, show more precision
  if (percentage < 0.1 && percentage > 0) {
    return `${percentage.toFixed(3)}%`;
  }

  return `${percentage.toFixed(precision)}%`;
}

/**
 * Converts usage data points to chart data points for visualization.
 * Transforms backend data into format suitable for chart components.
 *
 * @param usageData - Array of usage data points from the backend
 * @param type - Type of chart data to extract ('cost' | 'tokens' | 'requests')
 * @returns Array of chart data points
 */
export function convertUsageToChartData(
  usageData: UsageDataPoint[],
  type: 'cost' | 'tokens' | 'requests',
): ChartDataPoint[] {
  return usageData.map((point) => ({
    x: point.timestamp,
    y:
      type === 'cost'
        ? point.cost
        : type === 'tokens'
          ? point.tokens
          : point.requests,
    label: `${formatTime(point.timestamp)}: ${
      type === 'cost'
        ? formatCurrency(point.cost)
        : formatCompact(type === 'tokens' ? point.tokens : point.requests)
    }`,
    metadata: {
      timestamp: point.timestamp,
      feature: point.feature,
      cost: point.cost,
      tokens: point.tokens,
      requests: point.requests,
    },
  }));
}

/**
 * Converts cost breakdown items to pie chart data points.
 * Creates data suitable for pie chart visualization with colors and labels.
 *
 * @param breakdown - Array of cost breakdown items
 * @param colorPalette - Array of colors to use for pie slices
 * @returns Array of chart data points for pie chart
 */
export function convertBreakdownToChartData(
  breakdown: CostBreakdownItem[],
  colorPalette: string[] = DEFAULT_PIE_COLORS,
): ChartDataPoint[] {
  return breakdown.map((item, index) => ({
    x: item.feature,
    y: item.cost,
    label: `${item.feature}: ${formatCurrency(item.cost)} (${formatPercentage(item.percentage)})`,
    color: colorPalette[index % colorPalette.length],
    metadata: {
      feature: item.feature,
      cost: item.cost,
      percentage: item.percentage,
      tokens: item.tokens,
      requests: item.requests,
      avgCostPerRequest: item.avgCostPerRequest,
    },
  }));
}

/**
 * Creates time series data from token usage metrics.
 * Useful for trending charts and historical analysis.
 *
 * @param metrics - Array of token usage metrics
 * @param field - Field to extract for time series ('totalTokens' | 'totalCost' | 'inputTokens' | 'outputTokens')
 * @returns Time series data array
 */
export function createTimeSeriesFromMetrics(
  metrics: TokenUsageMetrics[],
  field:
    | 'totalTokens'
    | 'totalCost'
    | 'inputTokens'
    | 'outputTokens'
    | 'cachedTokens',
): TimeSeriesData {
  return metrics.map((metric) => ({
    timestamp: metric.timestamp,
    value: metric[field],
    label: formatTime(metric.timestamp),
  }));
}

/**
 * Calculates moving average for smoothing chart data.
 * Useful for trend analysis and noise reduction.
 *
 * @param data - Time series data to smooth
 * @param windowSize - Size of the moving average window
 * @returns Smoothed time series data
 */
export function calculateMovingAverage(
  data: TimeSeriesData,
  windowSize: number = 5,
): TimeSeriesData {
  if (windowSize <= 1) return data;

  const result: TimeSeriesData = [];

  for (let i = 0; i < data.length; i++) {
    const start = Math.max(0, i - Math.floor(windowSize / 2));
    const end = Math.min(data.length, start + windowSize);

    const window = data.slice(start, end);
    const average =
      window.reduce((sum, point) => sum + point.value, 0) / window.length;

    result.push({
      timestamp: data[i].timestamp,
      value: average,
      label: `${formatTime(data[i].timestamp)} (${windowSize}-pt avg)`,
    });
  }

  return result;
}

/**
 * Formats a timestamp as a readable time string.
 * Handles different time formats based on recency.
 *
 * @param timestamp - The timestamp to format
 * @param format - Format type ('short' | 'medium' | 'long')
 * @returns Formatted time string
 */
export function formatTime(
  timestamp: Date,
  format: 'short' | 'medium' | 'long' = 'short',
): string {
  const now = new Date();
  const diffMs = now.getTime() - timestamp.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  const diffDays = diffHours / 24;

  // For recent times, use relative formatting
  if (diffHours < 1) {
    const minutes = Math.floor(diffMs / (1000 * 60));
    return `${minutes}m ago`;
  }

  if (diffHours < 24) {
    const hours = Math.floor(diffHours);
    return `${hours}h ago`;
  }

  if (diffDays < 7) {
    const days = Math.floor(diffDays);
    return `${days}d ago`;
  }

  // For older times, use absolute formatting
  switch (format) {
    case 'short':
      return timestamp.toLocaleDateString();
    case 'medium':
      return timestamp.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    case 'long':
      return timestamp.toLocaleString();
    default:
      return timestamp.toLocaleDateString();
  }
}

/**
 * Creates ASCII-based progress bar for CLI display.
 * Generates a visual representation of progress using Unicode characters.
 *
 * @param percentage - Progress percentage (0-100)
 * @param width - Width of the progress bar in characters
 * @param filled - Character to use for filled portion
 * @param empty - Character to use for empty portion
 * @returns ASCII progress bar string
 */
export function createProgressBar(
  percentage: number,
  width: number = 10,
  filled: string = '█',
  empty: string = '░',
): string {
  const clampedPercentage = Math.max(0, Math.min(100, percentage));
  const filledWidth = Math.round((clampedPercentage / 100) * width);
  const emptyWidth = width - filledWidth;

  return filled.repeat(filledWidth) + empty.repeat(emptyWidth);
}

/**
 * Creates ASCII-based sparkline for inline data visualization.
 * Generates a compact chart using Unicode block characters.
 *
 * @param data - Array of numeric values to visualize
 * @param width - Width of the sparkline in characters
 * @returns ASCII sparkline string
 */
export function createSparkline(data: number[], width?: number): string {
  if (data.length === 0) return '';

  const actualWidth = width || Math.min(data.length, 20);
  const step = Math.max(1, Math.floor(data.length / actualWidth));
  const sampledData = data
    .filter((_, index) => index % step === 0)
    .slice(0, actualWidth);

  const min = Math.min(...sampledData);
  const max = Math.max(...sampledData);
  const range = max - min || 1;

  const sparkChars = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'];

  return sampledData
    .map((value) => {
      const normalized = (value - min) / range;
      const charIndex = Math.floor(normalized * (sparkChars.length - 1));
      return sparkChars[charIndex];
    })
    .join('');
}

/**
 * Generates a color palette for data visualization.
 * Creates visually distinct colors suitable for CLI display.
 *
 * @param count - Number of colors needed
 * @param theme - Color theme ('default' | 'budget' | 'usage' | 'cost')
 * @returns Array of color codes
 */
export function generateColorPalette(
  count: number,
  theme: 'default' | 'budget' | 'usage' | 'cost' = 'default',
): string[] {
  const themes = {
    default: [
      '#3b82f6',
      '#10b981',
      '#f59e0b',
      '#ef4444',
      '#8b5cf6',
      '#06b6d4',
      '#84cc16',
    ],
    budget: ['#059669', '#dc2626', '#d97706', '#7c3aed', '#0891b2'],
    usage: ['#2563eb', '#16a34a', '#ca8a04', '#dc2626'],
    cost: ['#dc2626', '#ea580c', '#d97706', '#ca8a04', '#65a30d'],
  };

  const baseColors = themes[theme] || themes.default;
  const result: string[] = [];

  for (let i = 0; i < count; i++) {
    result.push(baseColors[i % baseColors.length]);
  }

  return result;
}

/**
 * Default color palette for pie charts and other visualizations.
 * Provides good contrast and accessibility in CLI environments.
 */
export const DEFAULT_PIE_COLORS = [
  '#3b82f6', // Blue
  '#10b981', // Green
  '#f59e0b', // Yellow
  '#ef4444', // Red
  '#8b5cf6', // Purple
  '#06b6d4', // Cyan
  '#84cc16', // Lime
  '#f97316', // Orange
];

/**
 * Aggregates usage data by time period.
 * Groups data points by hour, day, week, or month for analysis.
 *
 * @param data - Usage data points to aggregate
 * @param period - Time period for aggregation ('hour' | 'day' | 'week' | 'month')
 * @returns Aggregated usage data
 */
export function aggregateUsageByPeriod(
  data: UsageDataPoint[],
  period: 'hour' | 'day' | 'week' | 'month',
): UsageDataPoint[] {
  const groups = new Map<string, UsageDataPoint[]>();

  // Group data by time period
  data.forEach((point) => {
    const key = getTimePeriodKey(point.timestamp, period);
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(point);
  });

  // Aggregate each group
  return Array.from(groups.entries())
    .map(([key, groupData]) => {
      const totalTokens = groupData.reduce(
        (sum, point) => sum + point.tokens,
        0,
      );
      const totalCost = groupData.reduce((sum, point) => sum + point.cost, 0);
      const totalRequests = groupData.reduce(
        (sum, point) => sum + point.requests,
        0,
      );

      return {
        timestamp: new Date(key),
        tokens: totalTokens,
        cost: totalCost,
        requests: totalRequests,
        feature: 'aggregated',
      };
    })
    .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
}

/**
 * Helper function to generate time period keys for aggregation.
 * Creates consistent string keys for grouping data by time periods.
 *
 * @param timestamp - The timestamp to process
 * @param period - The time period for grouping
 * @returns String key for the time period
 */
function getTimePeriodKey(
  timestamp: Date,
  period: 'hour' | 'day' | 'week' | 'month',
): string {
  const date = new Date(timestamp);

  switch (period) {
    case 'hour':
      return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${date.getHours()}`;
    case 'day':
      return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    case 'week': {
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      return `${weekStart.getFullYear()}-${weekStart.getMonth()}-${weekStart.getDate()}`;
    }
    case 'month':
      return `${date.getFullYear()}-${date.getMonth()}`;
    default:
      return date.toISOString();
  }
}
