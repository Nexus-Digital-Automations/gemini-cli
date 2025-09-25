/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// Create a simple chalk fallback when not available
const createChalkFallback = () => {
  const identity = (str: string) => str;
  const colorProxy = new Proxy(identity, {
    get: () => identity
  });
  return new Proxy(identity, {
    get: () => colorProxy
  });
};

// Conditional chalk usage - initialize with fallback, then try to load chalk async
let chalk: ReturnType<typeof createChalkFallback> = createChalkFallback();

// Attempt to load chalk asynchronously
(async () => {
  try {
    const chalkModule = await import('chalk');
    chalk = chalkModule.default || chalkModule;
  } catch {
    // Keep using fallback
  }
})();

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
export class ChartRenderer {
  private config: Required<ChartConfig>;
  private colors: ChartColors;

  constructor(config: ChartConfig = {}) {
    this.config = {
      width: config.width ?? 80,
      height: config.height ?? 20,
      showLabels: config.showLabels ?? true,
      showGrid: config.showGrid ?? true,
      theme: config.theme ?? 'auto',
      colors: config.colors ?? this.getDefaultColors()
    };

    this.colors = this.config.colors;
  }

  /**
   * Render a line chart showing trends over time
   */
  renderLineChart(
    data: number[],
    labels: string[] = [],
    options: { title?: string; yAxisLabel?: string } = {}
  ): string {
    const { width, height } = this.config;
    const title = options.title || 'Usage Trend';

    if (data.length === 0) {
      return this.renderEmptyChart(title);
    }

    const maxValue = Math.max(...data);
    const minValue = Math.min(...data);
    const range = maxValue - minValue || 1;

    let chart = '';

    // Title
    chart += chalk.bold.cyan(`\n📈 ${title}\n`);
    chart += '━'.repeat(width) + '\n';

    // Chart area
    for (let row = height - 1; row >= 0; row--) {
      const threshold = minValue + (range * row) / (height - 1);
      let line = '';

      // Y-axis value
      if (this.config.showLabels) {
        const value = Math.round(threshold).toString().padStart(6);
        line += chalk.dim(value) + ' │';
      }

      // Data points
      for (let col = 0; col < data.length; col++) {
        const value = data[col];
        // const scaledCol = Math.floor((col * (width - 10)) / data.length); // Currently unused

        if (Math.abs(value - threshold) < range / (height * 2)) {
          line += chalk.cyan('●');
        } else if (col > 0 && this.shouldDrawLine(data[col - 1], value, threshold, range, height)) {
          line += chalk.blue('─');
        } else {
          line += ' ';
        }
      }

      chart += line + '\n';
    }

    // X-axis
    if (this.config.showLabels && labels.length > 0) {
      chart += ' '.repeat(8) + '└' + '─'.repeat(width - 10) + '┘\n';
      chart += ' '.repeat(9);

      const labelStep = Math.ceil(labels.length / 8);
      for (let i = 0; i < labels.length; i += labelStep) {
        chart += chalk.dim(labels[i].substring(0, 8).padEnd(10));
      }
      chart += '\n';
    }

    return chart;
  }

  /**
   * Render a horizontal bar chart
   */
  renderBarChart(
    data: ChartDataPoint[],
    options: { title?: string; maxBars?: number } = {}
  ): string {
    const { width } = this.config;
    const title = options.title || 'Usage Distribution';
    const maxBars = options.maxBars || 10;

    if (data.length === 0) {
      return this.renderEmptyChart(title);
    }

    // Sort and limit data
    const sortedData = [...data]
      .sort((a, b) => b.value - a.value)
      .slice(0, maxBars);

    const maxValue = Math.max(...sortedData.map(d => d.value));
    const maxLabelWidth = Math.max(...sortedData.map(d => d.label.length));
    const barWidth = width - maxLabelWidth - 15;

    let chart = '';

    // Title
    chart += chalk.bold.cyan(`\n📊 ${title}\n`);
    chart += '━'.repeat(width) + '\n';

    sortedData.forEach((item, index) => {
      const barLength = Math.max(1, Math.floor((item.value / maxValue) * barWidth));
      const percentage = maxValue > 0 ? ((item.value / maxValue) * 100).toFixed(1) : '0.0';

      // Label
      const label = item.label.padEnd(maxLabelWidth);
      chart += chalk.white(label) + ' │';

      // Bar
      const barColor = item.color || this.getBarColor(index);
      chart += chalk.hex(barColor)('█'.repeat(barLength));
      chart += ' '.repeat(Math.max(0, barWidth - barLength));

      // Value
      chart += chalk.dim(` ${item.value} (${percentage}%)`);
      chart += '\n';
    });

    return chart;
  }

  /**
   * Render a sparkline chart (compact single-line chart)
   */
  renderSparkline(data: number[], label?: string): string {
    if (data.length === 0) {
      return chalk.dim('No data available');
    }

    const sparkChars = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'];
    const maxValue = Math.max(...data);
    const minValue = Math.min(...data);
    const range = maxValue - minValue || 1;

    let sparkline = '';

    if (label) {
      sparkline += chalk.bold(label) + ' ';
    }

    for (const value of data) {
      const normalized = (value - minValue) / range;
      const charIndex = Math.floor(normalized * (sparkChars.length - 1));
      sparkline += chalk.cyan(sparkChars[charIndex]);
    }

    // Add current value
    const currentValue = data[data.length - 1];
    sparkline += chalk.dim(` ${currentValue}`);

    return sparkline;
  }

  /**
   * Render a gauge/meter for single values with thresholds
   */
  renderGauge(
    value: number,
    max: number,
    thresholds: { warning: number; critical: number },
    options: { title?: string; unit?: string } = {}
  ): string {
    const { width } = this.config;
    const title = options.title || 'Usage';
    const unit = options.unit || '';

    const percentage = Math.min(100, (value / max) * 100);
    const gaugeWidth = width - 20;
    const fillWidth = Math.floor((percentage / 100) * gaugeWidth);

    let chart = '';

    // Title
    chart += chalk.bold.cyan(`\n⚡ ${title}\n`);
    chart += '━'.repeat(width) + '\n';

    // Gauge
    chart += 'Usage: [';

    // Determine color based on thresholds
    let fillColor = chalk.green;
    if (percentage >= thresholds.critical) {
      fillColor = chalk.red;
    } else if (percentage >= thresholds.warning) {
      fillColor = chalk.yellow;
    }

    chart += fillColor('█'.repeat(fillWidth));
    chart += chalk.dim('░'.repeat(gaugeWidth - fillWidth));
    chart += '] ';

    // Percentage and value
    chart += chalk.bold(`${percentage.toFixed(1)}%`);
    chart += chalk.dim(` (${value}${unit} / ${max}${unit})`);
    chart += '\n';

    // Threshold indicators
    const warningPos = Math.floor((thresholds.warning / 100) * gaugeWidth);
    const criticalPos = Math.floor((thresholds.critical / 100) * gaugeWidth);

    chart += ' '.repeat(8);
    for (let i = 0; i < gaugeWidth; i++) {
      if (i === warningPos) {
        chart += chalk.yellow('▲');
      } else if (i === criticalPos) {
        chart += chalk.red('▲');
      } else {
        chart += ' ';
      }
    }
    chart += '\n';

    chart += ' '.repeat(8) + chalk.dim('0%');
    chart += ' '.repeat(gaugeWidth - 10);
    chart += chalk.dim('100%\n');

    return chart;
  }

  /**
   * Render a multi-series line chart
   */
  renderMultiLineChart(series: ChartSeries[], options: { title?: string } = {}): string {
    const { width } = this.config;
    const title = options.title || 'Multi-Series Chart';

    if (series.length === 0) {
      return this.renderEmptyChart(title);
    }

    // Combine all data to find global min/max (currently unused for multi-line charts)
    // const allData = series.flatMap(s => s.data.map(d => d.value));
    // const maxValue = Math.max(...allData);
    // const minValue = Math.min(...allData);
    // const range = maxValue - minValue || 1;

    let chart = '';

    // Title
    chart += chalk.bold.cyan(`\n📈 ${title}\n`);
    chart += '━'.repeat(width) + '\n';

    // Legend
    chart += 'Legend: ';
    series.forEach((s, index) => {
      const color = s.color || this.getSeriesColor(index);
      chart += chalk.hex(color)('●') + ' ' + s.name + '  ';
    });
    chart += '\n\n';

    // Chart rendering would be more complex for multi-series
    // For now, render sparklines for each series
    series.forEach((s) => {
      const values = s.data.map(d => d.value);
      const sparkline = this.renderSparkline(values, s.name);
      chart += sparkline + '\n';
    });

    return chart;
  }

  /**
   * Render an empty chart placeholder
   */
  private renderEmptyChart(title: string): string {
    const { width } = this.config;

    let chart = '';
    chart += chalk.bold.cyan(`\n📊 ${title}\n`);
    chart += '━'.repeat(width) + '\n';
    chart += chalk.dim('\n  No data available\n\n');
    chart += '─'.repeat(width) + '\n';

    return chart;
  }

  /**
   * Determine if a line should be drawn between two points
   */
  private shouldDrawLine(
    prev: number,
    current: number,
    threshold: number,
    range: number,
    height: number
  ): boolean {
    const tolerance = range / (height * 2);
    return Math.abs(prev - threshold) < tolerance && Math.abs(current - threshold) < tolerance;
  }

  /**
   * Get color for bar chart bars
   */
  private getBarColor(index: number): string {
    const colors = ['#00d9ff', '#00ff88', '#ff8800', '#ff4444', '#8844ff', '#ffdd00'];
    return colors[index % colors.length];
  }

  /**
   * Get color for chart series
   */
  private getSeriesColor(index: number): string {
    const colors = ['#00d9ff', '#00ff88', '#ff8800', '#ff4444', '#8844ff', '#ffdd00'];
    return colors[index % colors.length];
  }

  /**
   * Get default color scheme based on theme
   */
  private getDefaultColors(): ChartColors {
    return {
      primary: '#00d9ff',
      secondary: '#00ff88',
      accent: '#ff8800',
      success: '#00ff88',
      warning: '#ffdd00',
      error: '#ff4444',
      grid: '#333333',
      text: '#ffffff'
    };
  }
}

/**
 * Create a chart renderer instance
 */
export function createChartRenderer(config?: ChartConfig): ChartRenderer {
  return new ChartRenderer(config);
}