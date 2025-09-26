/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type React from 'react';
import type { ChartConfig, CostProjection } from '../types/index.js';
/**
 * Props for the CostProjectionChart component.
 */
interface CostProjectionChartProps {
    /** Cost projection data to visualize */
    projections: CostProjection[];
    /** Chart configuration options */
    config: ChartConfig;
    /** Whether the chart is currently loading */
    loading?: boolean;
    /** Error message if chart failed to load */
    error?: string;
    /** Callback when a projection is selected */
    onProjectionSelect?: (projection: CostProjection) => void;
}
/**
 * Cost Projection Chart Component
 *
 * This component visualizes future cost projections using ASCII-based
 * charts optimized for CLI interfaces. It displays projected spending,
 * confidence intervals, trends, and provides actionable insights for
 * budget planning.
 *
 * Features:
 * - Future cost projections (daily, weekly, monthly)
 * - Confidence interval visualization
 * - Trend direction indicators
 * - Interactive projection selection
 * - Multiple time period comparisons
 * - Budget planning recommendations
 * - Responsive layout for different terminal sizes
 *
 * @param props - Configuration and data for the projection chart
 * @returns Interactive cost projection chart component
 */
export declare const CostProjectionChart: React.FC<CostProjectionChartProps>;
export {};
