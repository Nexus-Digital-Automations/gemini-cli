/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { ChartDataPoint, TimeSeriesData, UsageDataPoint, CostBreakdownItem, TokenUsageMetrics } from '../types/index.js';
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
export declare function formatCurrency(amount: number, precision?: number): string;
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
export declare function formatCompact(value: number, precision?: number): string;
/**
 * Formats a percentage with appropriate precision and symbol.
 * Handles edge cases like NaN, Infinity, and very small percentages.
 *
 * @param percentage - The percentage to format (0-100)
 * @param precision - Number of decimal places (default: 1)
 * @returns Formatted percentage string
 */
export declare function formatPercentage(percentage: number, precision?: number): string;
/**
 * Converts usage data points to chart data points for visualization.
 * Transforms backend data into format suitable for chart components.
 *
 * @param usageData - Array of usage data points from the backend
 * @param type - Type of chart data to extract ('cost' | 'tokens' | 'requests')
 * @returns Array of chart data points
 */
export declare function convertUsageToChartData(usageData: UsageDataPoint[], type: 'cost' | 'tokens' | 'requests'): ChartDataPoint[];
/**
 * Converts cost breakdown items to pie chart data points.
 * Creates data suitable for pie chart visualization with colors and labels.
 *
 * @param breakdown - Array of cost breakdown items
 * @param colorPalette - Array of colors to use for pie slices
 * @returns Array of chart data points for pie chart
 */
export declare function convertBreakdownToChartData(breakdown: CostBreakdownItem[], colorPalette?: string[]): ChartDataPoint[];
/**
 * Creates time series data from token usage metrics.
 * Useful for trending charts and historical analysis.
 *
 * @param metrics - Array of token usage metrics
 * @param field - Field to extract for time series ('totalTokens' | 'totalCost' | 'inputTokens' | 'outputTokens')
 * @returns Time series data array
 */
export declare function createTimeSeriesFromMetrics(metrics: TokenUsageMetrics[], field: 'totalTokens' | 'totalCost' | 'inputTokens' | 'outputTokens' | 'cachedTokens'): TimeSeriesData;
/**
 * Calculates moving average for smoothing chart data.
 * Useful for trend analysis and noise reduction.
 *
 * @param data - Time series data to smooth
 * @param windowSize - Size of the moving average window
 * @returns Smoothed time series data
 */
export declare function calculateMovingAverage(data: TimeSeriesData, windowSize?: number): TimeSeriesData;
/**
 * Formats a timestamp as a readable time string.
 * Handles different time formats based on recency.
 *
 * @param timestamp - The timestamp to format
 * @param format - Format type ('short' | 'medium' | 'long')
 * @returns Formatted time string
 */
export declare function formatTime(timestamp: Date, format?: 'short' | 'medium' | 'long'): string;
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
export declare function createProgressBar(percentage: number, width?: number, filled?: string, empty?: string): string;
/**
 * Creates ASCII-based sparkline for inline data visualization.
 * Generates a compact chart using Unicode block characters.
 *
 * @param data - Array of numeric values to visualize
 * @param width - Width of the sparkline in characters
 * @returns ASCII sparkline string
 */
export declare function createSparkline(data: number[], width?: number): string;
/**
 * Generates a color palette for data visualization.
 * Creates visually distinct colors suitable for CLI display.
 *
 * @param count - Number of colors needed
 * @param theme - Color theme ('default' | 'budget' | 'usage' | 'cost')
 * @returns Array of color codes
 */
export declare function generateColorPalette(count: number, theme?: 'default' | 'budget' | 'usage' | 'cost'): string[];
/**
 * Default color palette for pie charts and other visualizations.
 * Provides good contrast and accessibility in CLI environments.
 */
export declare const DEFAULT_PIE_COLORS: string[];
/**
 * Aggregates usage data by time period.
 * Groups data points by hour, day, week, or month for analysis.
 *
 * @param data - Usage data points to aggregate
 * @param period - Time period for aggregation ('hour' | 'day' | 'week' | 'month')
 * @returns Aggregated usage data
 */
export declare function aggregateUsageByPeriod(data: UsageDataPoint[], period: 'hour' | 'day' | 'week' | 'month'): UsageDataPoint[];
