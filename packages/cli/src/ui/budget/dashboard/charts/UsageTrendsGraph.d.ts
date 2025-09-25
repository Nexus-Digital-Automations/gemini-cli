/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type React from 'react';
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
export declare const UsageTrendsGraph: React.FC<UsageTrendsGraphProps>;
export {};
