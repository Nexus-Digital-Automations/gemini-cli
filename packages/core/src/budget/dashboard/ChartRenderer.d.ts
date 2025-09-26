/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Chart configuration options
 */
export interface ChartConfig {
    width?: number;
    height?: number;
    showLabels?: boolean;
    showGrid?: boolean;
    theme?: 'light' | 'dark' | 'auto';
    colors?: ChartColors;
}
/**
 * Chart color scheme
 */
export interface ChartColors {
    primary: string;
    secondary: string;
    accent: string;
    success: string;
    warning: string;
    error: string;
    grid: string;
    text: string;
}
/**
 * Data point for charts
 */
export interface ChartDataPoint {
    label: string;
    value: number;
    color?: string;
    metadata?: Record<string, unknown>;
}
/**
 * Chart series data
 */
export interface ChartSeries {
    name: string;
    data: ChartDataPoint[];
    color?: string;
    type?: 'line' | 'bar' | 'area';
}
/**
 * ASCII/CLI Chart Renderer for Budget Dashboard
 *
 * Provides beautiful terminal-based charts and visualizations
 * for budget usage data, trends, and analytics.
 */
export declare class ChartRenderer {
    private config;
    private colors;
    constructor(config?: ChartConfig);
    /**
     * Render a line chart showing trends over time
     */
    renderLineChart(data: number[], labels?: string[], options?: {
        title?: string;
        yAxisLabel?: string;
    }): string;
    /**
     * Render a horizontal bar chart
     */
    renderBarChart(data: ChartDataPoint[], options?: {
        title?: string;
        maxBars?: number;
    }): string;
    /**
     * Render a sparkline chart (compact single-line chart)
     */
    renderSparkline(data: number[], label?: string): string;
    /**
     * Render a gauge/meter for single values with thresholds
     */
    renderGauge(value: number, max: number, thresholds: {
        warning: number;
        critical: number;
    }, options?: {
        title?: string;
        unit?: string;
    }): string;
    /**
     * Render a multi-series line chart
     */
    renderMultiLineChart(series: ChartSeries[], options?: {
        title?: string;
    }): string;
    /**
     * Render an empty chart placeholder
     */
    private renderEmptyChart;
    /**
     * Determine if a line should be drawn between two points
     */
    private shouldDrawLine;
    /**
     * Get color for bar chart bars
     */
    private getBarColor;
    /**
     * Get color for chart series
     */
    private getSeriesColor;
    /**
     * Get default color scheme based on theme
     */
    private getDefaultColors;
}
/**
 * Create a chart renderer instance
 */
export declare function createChartRenderer(config?: ChartConfig): ChartRenderer;
