/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type React from 'react';
import type { ChartConfig, CostBreakdownItem } from '../types/index.js';
/**
 * Props for the CostBreakdownChart component.
 */
interface CostBreakdownChartProps {
  /** Cost breakdown data to visualize */
  data: CostBreakdownItem[];
  /** Chart configuration options */
  config: ChartConfig;
  /** Whether the chart is currently loading */
  loading?: boolean;
  /** Error message if chart failed to load */
  error?: string;
  /** Callback when a breakdown item is selected */
  onItemSelect?: (item: CostBreakdownItem) => void;
}
/**
 * Cost Breakdown Chart Component
 *
 * This component visualizes cost breakdown by feature using ASCII-based
 * charts optimized for CLI interfaces. It displays spending analysis,
 * feature cost distribution, and provides interactive data exploration.
 *
 * Features:
 * - ASCII pie chart representation
 * - Horizontal bar chart for detailed breakdown
 * - Color-coded feature categories
 * - Interactive item selection
 * - Cost and percentage statistics
 * - Responsive layout for different terminal sizes
 *
 * @param props - Configuration and data for the chart
 * @returns Interactive cost breakdown chart component
 */
export declare const CostBreakdownChart: React.FC<CostBreakdownChartProps>;
export {};
