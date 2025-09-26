/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type React from 'react';
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
export declare const TokenUsageChart: React.FC<TokenUsageChartProps>;
export {};
