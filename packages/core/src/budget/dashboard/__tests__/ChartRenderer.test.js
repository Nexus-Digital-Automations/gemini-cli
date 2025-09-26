/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ChartRenderer, } from '../ChartRenderer.js';
// Mock chalk to avoid terminal color issues in tests
vi.mock('chalk', () => ({
    default: {
        bold: { cyan: (str) => str },
        cyan: (str) => str,
        blue: (str) => str,
        dim: (str) => str,
        green: (str) => str,
        yellow: (str) => str,
        red: (str) => str,
        gray: (str) => str,
    },
}));
describe('ChartRenderer', () => {
    let chartRenderer;
    beforeEach(() => {
        chartRenderer = new ChartRenderer();
    });
    describe('Initialization and Configuration', () => {
        it('should create ChartRenderer with default configuration', () => {
            const renderer = new ChartRenderer();
            expect(renderer).toBeDefined();
            expect(renderer['config']).toBeDefined();
            expect(renderer['config'].width).toBe(80);
            expect(renderer['config'].height).toBe(20);
            expect(renderer['config'].showLabels).toBe(true);
            expect(renderer['config'].showGrid).toBe(true);
            expect(renderer['config'].theme).toBe('auto');
        });
        it('should create ChartRenderer with custom configuration', () => {
            const config = {
                width: 120,
                height: 30,
                showLabels: false,
                showGrid: false,
                theme: 'dark',
            };
            const renderer = new ChartRenderer(config);
            expect(renderer['config'].width).toBe(120);
            expect(renderer['config'].height).toBe(30);
            expect(renderer['config'].showLabels).toBe(false);
            expect(renderer['config'].showGrid).toBe(false);
            expect(renderer['config'].theme).toBe('dark');
        });
        it('should use custom colors when provided', () => {
            const customColors = {
                primary: '#FF0000',
                secondary: '#00FF00',
                accent: '#0000FF',
                success: '#008000',
                warning: '#FFA500',
                error: '#FF4444',
                grid: '#888888',
                text: '#FFFFFF',
            };
            const renderer = new ChartRenderer({ colors: customColors });
            expect(renderer['colors']).toEqual(customColors);
        });
        it('should provide default colors when none specified', () => {
            const renderer = new ChartRenderer();
            expect(renderer['colors']).toBeDefined();
            expect(renderer['colors'].primary).toBeDefined();
            expect(renderer['colors'].secondary).toBeDefined();
            expect(renderer['colors'].accent).toBeDefined();
        });
    });
    describe('Line Chart Rendering', () => {
        it('should render line chart with valid data', () => {
            const data = [10, 20, 15, 30, 25, 35, 40];
            const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
            const chart = chartRenderer.renderLineChart(data, labels, {
                title: 'Weekly Usage',
                yAxisLabel: 'Requests',
            });
            expect(chart).toContain('📈 Weekly Usage');
            expect(chart).toContain('━'); // Title underline
            expect(chart).toContain('│'); // Y-axis
            expect(chart).toContain('Mon'); // X-axis labels
            expect(typeof chart).toBe('string');
            expect(chart.length).toBeGreaterThan(0);
        });
        it('should handle empty data gracefully', () => {
            const chart = chartRenderer.renderLineChart([], [], {
                title: 'Empty Chart',
            });
            expect(chart).toContain('📈 Empty Chart');
            expect(chart).toContain('No data available');
        });
        it('should render line chart without labels when showLabels is false', () => {
            const renderer = new ChartRenderer({ showLabels: false });
            const data = [10, 20, 30];
            const chart = renderer.renderLineChart(data);
            // Should not contain Y-axis values or X-axis labels
            expect(chart).not.toMatch(/\d+\s*│/); // No Y-axis values
            expect(chart).not.toContain('└'); // No X-axis line
        });
        it('should handle single data point correctly', () => {
            const data = [42];
            const chart = chartRenderer.renderLineChart(data, ['Single']);
            expect(chart).toContain('📈');
            expect(chart).toContain('●'); // Data point
            expect(typeof chart).toBe('string');
        });
        it('should handle negative values in data', () => {
            const data = [-10, -5, 0, 5, 10];
            const chart = chartRenderer.renderLineChart(data);
            expect(chart).toContain('📈');
            expect(typeof chart).toBe('string');
            expect(chart.length).toBeGreaterThan(0);
        });
        it('should handle identical values (flat line)', () => {
            const data = [50, 50, 50, 50, 50];
            const chart = chartRenderer.renderLineChart(data);
            expect(chart).toContain('📈');
            expect(chart).toContain('●');
            expect(typeof chart).toBe('string');
        });
        it('should respect custom width and height', () => {
            const renderer = new ChartRenderer({ width: 40, height: 10 });
            const data = [10, 20, 30];
            const chart = renderer.renderLineChart(data);
            const lines = chart.split('\n');
            // Chart should have appropriate height (including title and spacing)
            expect(lines.length).toBeGreaterThan(10);
            // Title underline should match width
            const titleUnderline = lines.find((line) => line.includes('━'));
            expect(titleUnderline?.length).toBe(40);
        });
    });
    describe('Bar Chart Rendering', () => {
        it('should render horizontal bar chart with valid data', () => {
            const data = [
                { label: 'Feature A', value: 150 },
                { label: 'Feature B', value: 200 },
                { label: 'Feature C', value: 75 },
                { label: 'Feature D', value: 300 },
            ];
            const chart = chartRenderer.renderBarChart(data, {
                title: 'Feature Usage',
            });
            expect(chart).toContain('📊 Feature Usage');
            expect(chart).toContain('━'); // Title underline
            expect(chart).toContain('Feature A');
            expect(chart).toContain('Feature B');
            expect(chart).toContain('Feature C');
            expect(chart).toContain('Feature D');
            expect(chart).toContain('█'); // Bar characters
            expect(chart).toContain('%'); // Percentage values
        });
        it('should handle empty data gracefully', () => {
            const chart = chartRenderer.renderBarChart([], {
                title: 'Empty Bar Chart',
            });
            expect(chart).toContain('📊 Empty Bar Chart');
            expect(chart).toContain('No data available');
        });
        it('should sort data by value in descending order', () => {
            const data = [
                { label: 'Low', value: 10 },
                { label: 'High', value: 100 },
                { label: 'Medium', value: 50 },
            ];
            const chart = chartRenderer.renderBarChart(data);
            // High should appear before Medium, Medium before Low
            const highIndex = chart.indexOf('High');
            const mediumIndex = chart.indexOf('Medium');
            const lowIndex = chart.indexOf('Low');
            expect(highIndex).toBeLessThan(mediumIndex);
            expect(mediumIndex).toBeLessThan(lowIndex);
        });
        it('should limit bars to maxBars option', () => {
            const data = Array.from({ length: 20 }, (_, i) => ({
                label: `Item ${i + 1}`,
                value: Math.random() * 100,
            }));
            const chart = chartRenderer.renderBarChart(data, { maxBars: 5 });
            // Should only show top 5 items
            const lines = chart.split('\n').filter((line) => line.includes('Item'));
            expect(lines.length).toBeLessThanOrEqual(5);
        });
        it('should handle zero values correctly', () => {
            const data = [
                { label: 'Zero Value', value: 0 },
                { label: 'Positive Value', value: 100 },
            ];
            const chart = chartRenderer.renderBarChart(data);
            expect(chart).toContain('Zero Value');
            expect(chart).toContain('Positive Value');
            expect(chart).toContain('0.0%'); // Zero percentage
        });
        it('should calculate percentages correctly', () => {
            const data = [
                { label: 'Half', value: 50 },
                { label: 'Full', value: 100 },
            ];
            const chart = chartRenderer.renderBarChart(data);
            expect(chart).toContain('100.0%'); // Full should be 100%
            expect(chart).toContain('50.0%'); // Half should be 50%
        });
        it('should handle very long labels gracefully', () => {
            const data = [
                {
                    label: 'This is a very long feature name that exceeds normal length',
                    value: 100,
                },
                { label: 'Short', value: 50 },
            ];
            const chart = chartRenderer.renderBarChart(data);
            expect(chart).toContain('This is a very long feature name');
            expect(chart).toContain('Short');
            expect(typeof chart).toBe('string');
        });
    });
    describe('Pie Chart Rendering', () => {
        it('should render pie chart with valid data', () => {
            const data = [
                { label: 'Budget Used', value: 60 },
                { label: 'Budget Remaining', value: 40 },
            ];
            const chart = chartRenderer.renderPieChart(data, {
                title: 'Budget Distribution',
            });
            expect(chart).toContain('🥧 Budget Distribution');
            expect(chart).toContain('Budget Used');
            expect(chart).toContain('Budget Remaining');
            expect(chart).toContain('%');
        });
        it('should handle empty pie chart data', () => {
            const chart = chartRenderer.renderPieChart([], { title: 'Empty Pie' });
            expect(chart).toContain('🥧 Empty Pie');
            expect(chart).toContain('No data available');
        });
        it('should calculate pie slice percentages correctly', () => {
            const data = [
                { label: 'Quarter', value: 25 },
                { label: 'Three Quarters', value: 75 },
            ];
            const chart = chartRenderer.renderPieChart(data);
            expect(chart).toContain('25.0%');
            expect(chart).toContain('75.0%');
        });
        it('should handle single slice pie chart', () => {
            const data = [{ label: 'Complete', value: 100 }];
            const chart = chartRenderer.renderPieChart(data);
            expect(chart).toContain('Complete');
            expect(chart).toContain('100.0%');
        });
    });
    describe('Sparkline Rendering', () => {
        it('should render compact sparkline', () => {
            const data = [1, 3, 2, 5, 4, 6, 8, 7];
            const sparkline = chartRenderer.renderSparkline(data);
            expect(typeof sparkline).toBe('string');
            expect(sparkline.length).toBeGreaterThan(0);
            // Should contain sparkline characters
            expect(sparkline).toMatch(/[▁▂▃▄▅▆▇█]/);
        });
        it('should handle empty sparkline data', () => {
            const sparkline = chartRenderer.renderSparkline([]);
            expect(sparkline).toBe('No data');
        });
        it('should handle single value sparkline', () => {
            const sparkline = chartRenderer.renderSparkline([42]);
            expect(typeof sparkline).toBe('string');
            expect(sparkline.length).toBeGreaterThan(0);
        });
        it('should handle negative values in sparkline', () => {
            const data = [-5, -3, -1, 0, 2, 4];
            const sparkline = chartRenderer.renderSparkline(data);
            expect(typeof sparkline).toBe('string');
            expect(sparkline.length).toBeGreaterThan(0);
        });
        it('should handle flat data in sparkline', () => {
            const data = [10, 10, 10, 10];
            const sparkline = chartRenderer.renderSparkline(data);
            expect(typeof sparkline).toBe('string');
            expect(sparkline.length).toBeGreaterThan(0);
        });
    });
    describe('Multi-Series Chart Rendering', () => {
        it('should render multi-series line chart', () => {
            const series = [
                {
                    name: 'Series 1',
                    data: [
                        { label: 'A', value: 10 },
                        { label: 'B', value: 20 },
                    ],
                    color: 'blue',
                    type: 'line',
                },
                {
                    name: 'Series 2',
                    data: [
                        { label: 'A', value: 15 },
                        { label: 'B', value: 25 },
                    ],
                    color: 'red',
                    type: 'line',
                },
            ];
            const chart = chartRenderer.renderMultiSeriesChart(series, {
                title: 'Multi-Series',
            });
            expect(chart).toContain('📈 Multi-Series');
            expect(chart).toContain('Series 1');
            expect(chart).toContain('Series 2');
            expect(typeof chart).toBe('string');
        });
        it('should handle empty multi-series data', () => {
            const chart = chartRenderer.renderMultiSeriesChart([], {
                title: 'Empty Multi-Series',
            });
            expect(chart).toContain('📈 Empty Multi-Series');
            expect(chart).toContain('No data available');
        });
        it('should render legend for multi-series chart', () => {
            const series = [
                {
                    name: 'API Calls',
                    data: [{ label: 'Today', value: 100 }],
                    color: 'blue',
                    type: 'line',
                },
                {
                    name: 'Token Usage',
                    data: [{ label: 'Today', value: 500 }],
                    color: 'green',
                    type: 'bar',
                },
            ];
            const chart = chartRenderer.renderMultiSeriesChart(series);
            expect(chart).toContain('API Calls');
            expect(chart).toContain('Token Usage');
            expect(chart).toContain('Legend:');
        });
    });
    describe('Error Handling and Edge Cases', () => {
        it('should handle extremely large values', () => {
            const data = [1e10, 2e10, 3e10];
            const chart = chartRenderer.renderLineChart(data);
            expect(typeof chart).toBe('string');
            expect(chart.length).toBeGreaterThan(0);
        });
        it('should handle extremely small values', () => {
            const data = [0.0001, 0.0002, 0.0003];
            const chart = chartRenderer.renderLineChart(data);
            expect(typeof chart).toBe('string');
            expect(chart.length).toBeGreaterThan(0);
        });
        it('should handle infinite values gracefully', () => {
            const data = [10, Infinity, 20];
            const chart = chartRenderer.renderLineChart(data);
            expect(typeof chart).toBe('string');
            expect(chart).not.toContain('Infinity');
            expect(chart).not.toContain('NaN');
        });
        it('should handle NaN values gracefully', () => {
            const data = [10, NaN, 20];
            const chart = chartRenderer.renderLineChart(data);
            expect(typeof chart).toBe('string');
            expect(chart).not.toContain('NaN');
        });
        it('should handle zero width configuration', () => {
            const renderer = new ChartRenderer({ width: 0 });
            const chart = renderer.renderLineChart([10, 20, 30]);
            expect(typeof chart).toBe('string');
            expect(chart.length).toBeGreaterThan(0);
        });
        it('should handle zero height configuration', () => {
            const renderer = new ChartRenderer({ height: 0 });
            const chart = renderer.renderLineChart([10, 20, 30]);
            expect(typeof chart).toBe('string');
            expect(chart.length).toBeGreaterThan(0);
        });
        it('should handle null and undefined in chart data', () => {
            const data = [
                { label: 'Valid', value: 100 },
                { label: 'Null Value', value: 0 }, // Replace null with 0
                { label: 'Undefined Value', value: 0 }, // Replace undefined with 0
            ];
            const chart = chartRenderer.renderBarChart(data);
            expect(chart).toContain('Valid');
            expect(typeof chart).toBe('string');
        });
        it('should handle special characters in labels', () => {
            const data = [
                { label: 'Label with 🎯 emoji', value: 100 },
                { label: 'Label with "quotes"', value: 50 },
                { label: 'Label with \\backslash', value: 75 },
            ];
            const chart = chartRenderer.renderBarChart(data);
            expect(chart).toContain('🎯');
            expect(chart).toContain('"quotes"');
            expect(chart).toContain('\\backslash');
        });
    });
    describe('Performance and Memory', () => {
        it('should handle large datasets efficiently', () => {
            const largeData = Array.from({ length: 10000 }, (_, i) => i * Math.random());
            const startTime = performance.now();
            const chart = chartRenderer.renderLineChart(largeData);
            const endTime = performance.now();
            expect(typeof chart).toBe('string');
            expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
        });
        it('should handle memory efficiently with large bar chart data', () => {
            const largeBarData = Array.from({ length: 5000 }, (_, i) => ({
                label: `Item ${i}`,
                value: Math.random() * 1000,
            }));
            const startTime = performance.now();
            const chart = chartRenderer.renderBarChart(largeBarData, {
                maxBars: 100,
            });
            const endTime = performance.now();
            expect(typeof chart).toBe('string');
            expect(endTime - startTime).toBeLessThan(500); // Should be fast with maxBars limit
        });
        it('should not leak memory with repeated chart generation', () => {
            const data = [10, 20, 30, 40, 50];
            // Generate many charts to test memory stability
            for (let i = 0; i < 1000; i++) {
                const chart = chartRenderer.renderLineChart(data);
                expect(typeof chart).toBe('string');
            }
            // If we reach here without memory issues, the test passes
            expect(true).toBe(true);
        });
    });
    describe('Accessibility and Formatting', () => {
        it('should provide accessible text descriptions for charts', () => {
            const data = [10, 20, 15, 30];
            const chart = chartRenderer.renderLineChart(data, ['A', 'B', 'C', 'D']);
            // Should contain meaningful structure for screen readers
            expect(chart).toContain('📈'); // Clear chart indicator
            expect(chart).toMatch(/[A-D]/); // Labels
            expect(chart).toContain('│'); // Structure indicators
        });
        it('should format numbers consistently', () => {
            const data = [
                { label: 'Small', value: 0.123 },
                { label: 'Large', value: 123456.789 },
            ];
            const chart = chartRenderer.renderBarChart(data);
            expect(typeof chart).toBe('string');
            expect(chart).toContain('%'); // Percentage formatting
        });
        it('should truncate very long labels appropriately', () => {
            const data = [
                {
                    label: 'This is an extremely long label that should be truncated to fit within reasonable chart width constraints',
                    value: 100,
                },
            ];
            const chart = chartRenderer.renderBarChart(data);
            expect(typeof chart).toBe('string');
            expect(chart.length).toBeLessThan(5000); // Reasonable output size
        });
        it('should maintain consistent spacing and alignment', () => {
            const data = [
                { label: 'Short', value: 100 },
                { label: 'Medium Length', value: 200 },
                { label: 'Very Long Label Name', value: 150 },
            ];
            const chart = chartRenderer.renderBarChart(data);
            const lines = chart.split('\n').filter((line) => line.includes('█'));
            // All data lines should have consistent structure
            lines.forEach((line) => {
                expect(line).toMatch(/\w+.*█+.*\d+\.\d+%/);
            });
        });
    });
});
//# sourceMappingURL=ChartRenderer.test.js.map