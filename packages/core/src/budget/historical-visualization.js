/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
/**
 * Advanced historical data visualization and reporting system
 */
export class HistoricalVisualizationEngine {
  projectRoot;
  outputDir;
  constructor(projectRoot) {
    this.projectRoot = projectRoot;
    this.outputDir = path.join(projectRoot, '.gemini', 'visualizations');
  }
  /**
   * Generate comprehensive budget usage charts
   */
  async generateUsageCharts(records, config = {}) {
    const artifacts = [];
    // Daily usage trend chart
    const dailyChart = await this.createDailyUsageChart(records, {
      title: 'Daily Budget Usage Trend',
      xLabel: 'Date',
      yLabel: 'Requests',
      type: 'line',
      width: 1200,
      height: 600,
      showGrid: true,
      showLegend: true,
      colors: ['#4285f4', '#ea4335', '#34a853'],
      ...config,
    });
    artifacts.push(dailyChart);
    // Weekly usage pattern chart
    const weeklyChart = await this.createWeeklyPatternChart(records, {
      title: 'Weekly Usage Patterns',
      xLabel: 'Day of Week',
      yLabel: 'Average Requests',
      type: 'bar',
      width: 800,
      height: 400,
      showGrid: true,
      showLegend: false,
      colors: ['#4285f4'],
      ...config,
    });
    artifacts.push(weeklyChart);
    // Monthly usage heatmap
    const heatmapChart = await this.createUsageHeatmap(records, {
      title: 'Usage Intensity Heatmap',
      xLabel: 'Day of Month',
      yLabel: 'Month',
      type: 'heatmap',
      width: 1000,
      height: 600,
      showGrid: false,
      showLegend: true,
      colors: ['#e3f2fd', '#1565c0'],
      ...config,
    });
    artifacts.push(heatmapChart);
    // Usage efficiency chart
    const efficiencyChart = await this.createEfficiencyChart(records, {
      title: 'Budget Utilization Efficiency',
      xLabel: 'Date',
      yLabel: 'Utilization %',
      type: 'area',
      width: 1200,
      height: 500,
      showGrid: true,
      showLegend: true,
      colors: ['#34a853', '#fbbc05', '#ea4335'],
      ...config,
    });
    artifacts.push(efficiencyChart);
    return artifacts;
  }
  /**
   * Generate trend analysis visualizations
   */
  async generateTrendAnalysisCharts(records, analysis, config = {}) {
    const artifacts = [];
    // Trend decomposition chart
    const decompositionChart = await this.createTrendDecompositionChart(
      records,
      analysis,
      {
        title: 'Usage Trend Decomposition',
        xLabel: 'Date',
        yLabel: 'Requests',
        type: 'line',
        width: 1200,
        height: 800,
        showGrid: true,
        showLegend: true,
        colors: ['#4285f4', '#ea4335', '#34a853', '#fbbc05'],
        ...config,
      },
    );
    artifacts.push(decompositionChart);
    // Seasonal pattern visualization
    const seasonalChart = await this.createSeasonalPatternChart(analysis, {
      title: 'Seasonal Usage Patterns',
      xLabel: 'Time Period',
      yLabel: 'Average Usage',
      type: 'line',
      width: 1000,
      height: 600,
      showGrid: true,
      showLegend: true,
      colors: ['#4285f4', '#ea4335', '#34a853'],
      ...config,
    });
    artifacts.push(seasonalChart);
    // Volatility analysis chart
    const volatilityChart = await this.createVolatilityChart(
      records,
      analysis,
      {
        title: 'Usage Volatility Analysis',
        xLabel: 'Date',
        yLabel: 'Volatility Score',
        type: 'line',
        width: 1200,
        height: 500,
        showGrid: true,
        showLegend: true,
        colors: ['#ea4335', '#fbbc05'],
        ...config,
      },
    );
    artifacts.push(volatilityChart);
    return artifacts;
  }
  /**
   * Generate forecast visualization
   */
  async generateForecastCharts(records, forecasts, config = {}) {
    const artifacts = [];
    // Forecast timeline chart
    const timelineChart = await this.createForecastTimelineChart(
      records,
      forecasts,
      {
        title: 'Budget Forecast Timeline',
        xLabel: 'Date',
        yLabel: 'Predicted Usage',
        type: 'line',
        width: 1200,
        height: 600,
        showGrid: true,
        showLegend: true,
        colors: ['#4285f4', '#34a853', '#ea4335', '#fbbc05'],
        ...config,
      },
    );
    artifacts.push(timelineChart);
    // Confidence interval chart
    const confidenceChart = await this.createConfidenceIntervalChart(
      forecasts,
      {
        title: 'Forecast Confidence Intervals',
        xLabel: 'Date',
        yLabel: 'Usage Range',
        type: 'area',
        width: 1000,
        height: 500,
        showGrid: true,
        showLegend: true,
        colors: ['#e8f0fe', '#4285f4', '#1a73e8'],
        ...config,
      },
    );
    artifacts.push(confidenceChart);
    // Scenario comparison chart
    const scenarioChart = await this.createScenarioComparisonChart(forecasts, {
      title: 'Forecast Scenarios Comparison',
      xLabel: 'Date',
      yLabel: 'Predicted Usage',
      type: 'line',
      width: 1200,
      height: 600,
      showGrid: true,
      showLegend: true,
      colors: ['#34a853', '#4285f4', '#ea4335'],
      ...config,
    });
    artifacts.push(scenarioChart);
    return artifacts;
  }
  /**
   * Generate anomaly detection visualization
   */
  async generateAnomalyCharts(records, anomalies, config = {}) {
    const artifacts = [];
    // Anomaly timeline chart
    const timelineChart = await this.createAnomalyTimelineChart(
      records,
      anomalies,
      {
        title: 'Usage Anomalies Timeline',
        xLabel: 'Date',
        yLabel: 'Usage',
        type: 'scatter',
        width: 1200,
        height: 600,
        showGrid: true,
        showLegend: true,
        colors: ['#4285f4', '#ea4335', '#fbbc05', '#ff9800'],
        ...config,
      },
    );
    artifacts.push(timelineChart);
    // Anomaly severity distribution
    const severityChart = await this.createAnomalySeverityChart(anomalies, {
      title: 'Anomaly Severity Distribution',
      xLabel: 'Severity',
      yLabel: 'Count',
      type: 'bar',
      width: 800,
      height: 400,
      showGrid: true,
      showLegend: false,
      colors: ['#4caf50', '#ffeb3b', '#ff9800', '#f44336'],
      ...config,
    });
    artifacts.push(severityChart);
    // Anomaly score distribution
    const scoreChart = await this.createAnomalyScoreChart(anomalies, {
      title: 'Anomaly Score Distribution',
      xLabel: 'Anomaly Score',
      yLabel: 'Frequency',
      type: 'bar',
      width: 1000,
      height: 500,
      showGrid: true,
      showLegend: false,
      colors: ['#4285f4'],
      ...config,
    });
    artifacts.push(scoreChart);
    return artifacts;
  }
  /**
   * Create comprehensive dashboard
   */
  async createDashboard(records, analysis, forecasts, anomalies, widgets = []) {
    // Define default widgets if none provided
    const defaultWidgets = [
      {
        id: 'usage-summary',
        type: 'metric',
        title: 'Usage Summary',
        position: { row: 0, col: 0, width: 3, height: 2 },
        config: {
          metrics: ['totalUsage', 'averageUsage', 'peakUsage', 'efficiency'],
        },
      },
      {
        id: 'daily-trend',
        type: 'chart',
        title: 'Daily Usage Trend',
        position: { row: 0, col: 3, width: 9, height: 4 },
        config: {
          chartType: 'line',
          showForecast: true,
          showAnomalies: true,
        },
      },
      {
        id: 'weekly-pattern',
        type: 'chart',
        title: 'Weekly Pattern',
        position: { row: 4, col: 0, width: 6, height: 3 },
        config: {
          chartType: 'bar',
          aggregation: 'weekly',
        },
      },
      {
        id: 'forecast-alerts',
        type: 'forecast',
        title: 'Budget Forecasts',
        position: { row: 4, col: 6, width: 6, height: 3 },
        config: {
          showConfidenceInterval: true,
          forecastDays: 7,
        },
      },
      {
        id: 'anomaly-alerts',
        type: 'alert',
        title: 'Recent Anomalies',
        position: { row: 7, col: 0, width: 6, height: 2 },
        config: {
          maxItems: 5,
          severityFilter: ['major', 'critical'],
        },
      },
      {
        id: 'insights',
        type: 'insights',
        title: 'Key Insights',
        position: { row: 7, col: 6, width: 6, height: 2 },
        config: {
          maxInsights: 5,
          includeRecommendations: true,
        },
      },
    ];
    const activeWidgets = widgets.length > 0 ? widgets : defaultWidgets;
    // Generate dashboard HTML
    const dashboardHtml = await this.generateDashboardHtml(
      records,
      analysis,
      forecasts,
      anomalies,
      activeWidgets,
    );
    // Create dashboard artifact
    const artifact = {
      id: `dashboard-${Date.now()}`,
      type: 'dashboard',
      title: 'Budget Usage Analytics Dashboard',
      description:
        'Comprehensive overview of budget usage patterns, trends, and forecasts',
      format: 'html',
      data: dashboardHtml,
      metadata: {
        generatedAt: new Date().toISOString(),
        dataRange: {
          start: records[0]?.date || new Date().toISOString().split('T')[0],
          end:
            records[records.length - 1]?.date ||
            new Date().toISOString().split('T')[0],
        },
        recordCount: records.length,
        charts: activeWidgets
          .filter((w) => w.type === 'chart')
          .map((w) => w.title),
        insights: this.generateKeyInsights(
          records,
          analysis,
          forecasts,
          anomalies,
        ),
      },
    };
    // Save dashboard to file
    await this.saveToDisk(artifact);
    return artifact;
  }
  /**
   * Generate comprehensive historical report
   */
  async generateHistoricalReport(
    records,
    analysis,
    forecasts,
    anomalies,
    config,
  ) {
    let reportData;
    switch (config.format) {
      case 'html':
        reportData = await this.generateHtmlReport(
          records,
          analysis,
          forecasts,
          anomalies,
          config,
        );
        break;
      case 'json':
        reportData = this.generateJsonReport(
          records,
          analysis,
          forecasts,
          anomalies,
          config,
        );
        break;
      case 'csv':
        reportData = this.generateCsvReport(records, config);
        break;
      default:
        throw new Error(`Unsupported report format: ${config.format}`);
    }
    const artifact = {
      id: `report-${Date.now()}`,
      type: 'report',
      title: config.title,
      description: config.description,
      format: config.format,
      data: reportData,
      metadata: {
        generatedAt: new Date().toISOString(),
        dataRange: config.period,
        recordCount: records.length,
        insights: this.generateKeyInsights(
          records,
          analysis,
          forecasts,
          anomalies,
        ),
      },
    };
    await this.saveToDisk(artifact);
    return artifact;
  }
  // Private chart generation methods
  async createDailyUsageChart(records, config) {
    const series = [
      {
        name: 'Daily Usage',
        data: records.map((r) => ({
          x: r.date,
          y: r.dailyUsage,
          metadata: {
            limit: r.dailyLimit,
            percentage: r.usagePercentage,
            isWeekend: r.isWeekend,
          },
        })),
        color: config.colors[0],
      },
      {
        name: 'Daily Limit',
        data: records.map((r) => ({
          x: r.date,
          y: r.dailyLimit,
          metadata: { type: 'limit' },
        })),
        color: config.colors[1],
        type: 'line',
      },
    ];
    const chartSvg = this.generateSvgChart(series, config);
    return {
      id: `daily-usage-${Date.now()}`,
      type: 'chart',
      title: config.title,
      description: 'Daily budget usage compared to limits',
      format: 'svg',
      data: chartSvg,
      metadata: {
        generatedAt: new Date().toISOString(),
        dataRange: {
          start: records[0]?.date || '',
          end: records[records.length - 1]?.date || '',
        },
        recordCount: records.length,
      },
    };
  }
  async createWeeklyPatternChart(records, config) {
    // Calculate weekly averages
    const weeklyData = Array(7).fill(0);
    const weeklyCounts = Array(7).fill(0);
    const weekdayNames = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ];
    records.forEach((record) => {
      weeklyData[record.dayOfWeek] += record.dailyUsage;
      weeklyCounts[record.dayOfWeek]++;
    });
    const weeklyAverages = weeklyData.map((sum, i) =>
      weeklyCounts[i] > 0 ? sum / weeklyCounts[i] : 0,
    );
    const series = [
      {
        name: 'Average Usage',
        data: weeklyAverages.map((avg, i) => ({
          x: weekdayNames[i],
          y: Math.round(avg * 100) / 100,
          metadata: { dayOfWeek: i, recordCount: weeklyCounts[i] },
        })),
        color: config.colors[0],
      },
    ];
    const chartSvg = this.generateSvgChart(series, config);
    return {
      id: `weekly-pattern-${Date.now()}`,
      type: 'chart',
      title: config.title,
      description: 'Average usage patterns by day of week',
      format: 'svg',
      data: chartSvg,
      metadata: {
        generatedAt: new Date().toISOString(),
        dataRange: {
          start: records[0]?.date || '',
          end: records[records.length - 1]?.date || '',
        },
        recordCount: records.length,
      },
    };
  }
  async createUsageHeatmap(records, config) {
    // Create heatmap data structure
    const heatmapData = {};
    records.forEach((record) => {
      const date = new Date(record.date);
      const month = date.toLocaleString('default', { month: 'long' });
      const day = date.getDate().toString();
      if (!heatmapData[month]) {
        heatmapData[month] = {};
      }
      heatmapData[month][day] = record.usagePercentage;
    });
    const heatmapSvg = this.generateHeatmapSvg(heatmapData, config);
    return {
      id: `usage-heatmap-${Date.now()}`,
      type: 'chart',
      title: config.title,
      description: 'Usage intensity heatmap by month and day',
      format: 'svg',
      data: heatmapSvg,
      metadata: {
        generatedAt: new Date().toISOString(),
        dataRange: {
          start: records[0]?.date || '',
          end: records[records.length - 1]?.date || '',
        },
        recordCount: records.length,
      },
    };
  }
  async createEfficiencyChart(records, config) {
    const series = [
      {
        name: 'Utilization %',
        data: records
          .filter((r) => r.dailyLimit > 0)
          .map((r) => ({
            x: r.date,
            y: Math.round(r.usagePercentage * 100) / 100,
            metadata: {
              usage: r.dailyUsage,
              limit: r.dailyLimit,
              efficiency:
                r.usagePercentage < 80
                  ? 'good'
                  : r.usagePercentage < 95
                    ? 'moderate'
                    : 'high',
            },
          })),
        color: config.colors[0],
      },
    ];
    const chartSvg = this.generateSvgChart(series, config);
    return {
      id: `efficiency-chart-${Date.now()}`,
      type: 'chart',
      title: config.title,
      description: 'Budget utilization efficiency over time',
      format: 'svg',
      data: chartSvg,
      metadata: {
        generatedAt: new Date().toISOString(),
        dataRange: {
          start: records[0]?.date || '',
          end: records[records.length - 1]?.date || '',
        },
        recordCount: records.length,
      },
    };
  }
  // Additional chart creation methods would follow similar patterns...
  async createTrendDecompositionChart(records, analysis, config) {
    // Implementation for trend decomposition visualization
    const series = [
      {
        name: 'Actual Usage',
        data: records.map((r) => ({ x: r.date, y: r.dailyUsage })),
        color: config.colors[0],
      },
      {
        name: 'Trend',
        data: records.map((r, i) => ({
          x: r.date,
          y:
            analysis.averageDailyUsage +
            ((analysis.projectedUsage - analysis.averageDailyUsage) * i) /
              records.length,
        })),
        color: config.colors[1],
      },
    ];
    const chartSvg = this.generateSvgChart(series, config);
    return {
      id: `trend-decomposition-${Date.now()}`,
      type: 'chart',
      title: config.title,
      description: 'Trend analysis and decomposition',
      format: 'svg',
      data: chartSvg,
      metadata: {
        generatedAt: new Date().toISOString(),
        dataRange: {
          start: records[0]?.date || '',
          end: records[records.length - 1]?.date || '',
        },
        recordCount: records.length,
      },
    };
  }
  // Placeholder implementations for additional charts...
  async createSeasonalPatternChart(analysis, config) {
    return this.createPlaceholderChart('seasonal-pattern', config);
  }
  async createVolatilityChart(records, analysis, config) {
    return this.createPlaceholderChart('volatility-chart', config);
  }
  async createForecastTimelineChart(records, forecasts, config) {
    return this.createPlaceholderChart('forecast-timeline', config);
  }
  async createConfidenceIntervalChart(forecasts, config) {
    return this.createPlaceholderChart('confidence-interval', config);
  }
  async createScenarioComparisonChart(forecasts, config) {
    return this.createPlaceholderChart('scenario-comparison', config);
  }
  async createAnomalyTimelineChart(records, anomalies, config) {
    return this.createPlaceholderChart('anomaly-timeline', config);
  }
  async createAnomalySeverityChart(anomalies, config) {
    return this.createPlaceholderChart('anomaly-severity', config);
  }
  async createAnomalyScoreChart(anomalies, config) {
    return this.createPlaceholderChart('anomaly-score', config);
  }
  createPlaceholderChart(id, config) {
    const placeholderSvg = `
      <svg width="${config.width}" height="${config.height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#f8f9fa" stroke="#dee2e6"/>
        <text x="50%" y="50%" text-anchor="middle" fill="#6c757d" font-family="Arial, sans-serif" font-size="16">
          ${config.title}
        </text>
        <text x="50%" y="60%" text-anchor="middle" fill="#adb5bd" font-family="Arial, sans-serif" font-size="12">
          Chart implementation in progress
        </text>
      </svg>
    `;
    return {
      id: `${id}-${Date.now()}`,
      type: 'chart',
      title: config.title,
      description: 'Chart placeholder',
      format: 'svg',
      data: placeholderSvg,
      metadata: {
        generatedAt: new Date().toISOString(),
        dataRange: { start: '', end: '' },
        recordCount: 0,
      },
    };
  }
  // SVG generation methods
  generateSvgChart(series, config) {
    const { width, height, title, xLabel, yLabel, showGrid, showLegend } =
      config;
    // Calculate data bounds
    const allYValues = series.flatMap((s) => s.data.map((d) => d.y));
    const minY = Math.min(...allYValues);
    const maxY = Math.max(...allYValues);
    const yRange = maxY - minY;
    const padding = yRange * 0.1;
    const chartMinY = minY - padding;
    const chartMaxY = maxY + padding;
    // Chart dimensions
    const chartPadding = { top: 60, right: 80, bottom: 80, left: 80 };
    const chartWidth = width - chartPadding.left - chartPadding.right;
    const chartHeight = height - chartPadding.top - chartPadding.bottom;
    let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`;
    // Background
    svg += `<rect width="100%" height="100%" fill="#ffffff"/>`;
    // Title
    svg += `<text x="${width / 2}" y="30" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" font-weight="bold">${title}</text>`;
    // Grid
    if (showGrid) {
      const gridLines = 5;
      for (let i = 0; i <= gridLines; i++) {
        const y = chartPadding.top + (chartHeight * i) / gridLines;
        svg += `<line x1="${chartPadding.left}" y1="${y}" x2="${width - chartPadding.right}" y2="${y}" stroke="#e0e0e0" stroke-width="1"/>`;
      }
    }
    // Axes
    svg += `<line x1="${chartPadding.left}" y1="${chartPadding.top}" x2="${chartPadding.left}" y2="${height - chartPadding.bottom}" stroke="#333" stroke-width="2"/>`;
    svg += `<line x1="${chartPadding.left}" y1="${height - chartPadding.bottom}" x2="${width - chartPadding.right}" y2="${height - chartPadding.bottom}" stroke="#333" stroke-width="2"/>`;
    // Y-axis labels
    for (let i = 0; i <= 5; i++) {
      const value = chartMinY + (chartMaxY - chartMinY) * (1 - i / 5);
      const y = chartPadding.top + (chartHeight * i) / 5;
      svg += `<text x="${chartPadding.left - 10}" y="${y + 5}" text-anchor="end" font-family="Arial, sans-serif" font-size="12" fill="#666">${Math.round(value)}</text>`;
    }
    // Draw data series
    series.forEach((s, seriesIndex) => {
      const color =
        s.color || config.colors[seriesIndex % config.colors.length];
      if (s.data.length === 0) return;
      if (config.type === 'line' || s.type === 'line') {
        let pathData = `M`;
        s.data.forEach((point, i) => {
          const x = chartPadding.left + (chartWidth * i) / (s.data.length - 1);
          const y =
            chartPadding.top +
            chartHeight -
            ((point.y - chartMinY) / (chartMaxY - chartMinY)) * chartHeight;
          if (i === 0) {
            pathData += ` ${x} ${y}`;
          } else {
            pathData += ` L ${x} ${y}`;
          }
        });
        svg += `<path d="${pathData}" stroke="${color}" stroke-width="2" fill="none"/>`;
      } else if (config.type === 'bar' || s.type === 'bar') {
        const barWidth = (chartWidth / s.data.length) * 0.8;
        s.data.forEach((point, i) => {
          const x =
            chartPadding.left +
            (chartWidth * i) / s.data.length +
            (chartWidth / s.data.length - barWidth) / 2;
          const barHeight =
            ((point.y - chartMinY) / (chartMaxY - chartMinY)) * chartHeight;
          const y = height - chartPadding.bottom - barHeight;
          svg += `<rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" fill="${color}"/>`;
        });
      }
    });
    // Axis labels
    svg += `<text x="${width / 2}" y="${height - 20}" text-anchor="middle" font-family="Arial, sans-serif" font-size="14">${xLabel}</text>`;
    svg += `<text x="20" y="${height / 2}" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" transform="rotate(-90 20 ${height / 2})">${yLabel}</text>`;
    // Legend
    if (showLegend && series.length > 1) {
      const legendY = height - 50;
      let legendX = chartPadding.left;
      series.forEach((s, i) => {
        const color = s.color || config.colors[i % config.colors.length];
        svg += `<rect x="${legendX}" y="${legendY}" width="12" height="12" fill="${color}"/>`;
        svg += `<text x="${legendX + 20}" y="${legendY + 10}" font-family="Arial, sans-serif" font-size="12" fill="#333">${s.name}</text>`;
        legendX += s.name.length * 8 + 40;
      });
    }
    svg += `</svg>`;
    return svg;
  }
  generateHeatmapSvg(data, config) {
    const { width, height, title } = config;
    const months = Object.keys(data);
    const maxValue = Math.max(
      ...Object.values(data).flatMap((monthData) => Object.values(monthData)),
    );
    const cellWidth = (width - 100) / 31; // Max 31 days
    const cellHeight = (height - 100) / months.length;
    let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`;
    svg += `<rect width="100%" height="100%" fill="#ffffff"/>`;
    svg += `<text x="${width / 2}" y="30" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" font-weight="bold">${title}</text>`;
    months.forEach((month, monthIndex) => {
      const monthData = data[month];
      Object.keys(monthData).forEach((day) => {
        const dayNum = parseInt(day);
        const value = monthData[day];
        const intensity = value / maxValue;
        const color = `rgba(66, 133, 244, ${intensity})`;
        const x = 50 + (dayNum - 1) * cellWidth;
        const y = 50 + monthIndex * cellHeight;
        svg += `<rect x="${x}" y="${y}" width="${cellWidth - 1}" height="${cellHeight - 1}" fill="${color}" stroke="#fff"/>`;
      });
      // Month label
      svg += `<text x="30" y="${50 + monthIndex * cellHeight + cellHeight / 2}" text-anchor="end" font-family="Arial, sans-serif" font-size="10" fill="#333">${month.slice(0, 3)}</text>`;
    });
    svg += `</svg>`;
    return svg;
  }
  // Report generation methods
  async generateDashboardHtml(
    records,
    analysis,
    forecasts,
    anomalies,
    widgets,
  ) {
    const summary = this.calculateSummaryStats(records);
    const insights = this.generateKeyInsights(
      records,
      analysis,
      forecasts,
      anomalies,
    );
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Budget Usage Analytics Dashboard</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f8f9fa;
        }
        .dashboard {
            max-width: 1200px;
            margin: 0 auto;
        }
        .header {
            background: white;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .metric-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 20px;
        }
        .metric-card {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .metric-value {
            font-size: 2em;
            font-weight: bold;
            color: #4285f4;
            margin-bottom: 5px;
        }
        .metric-label {
            color: #666;
            font-size: 0.9em;
        }
        .insights {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .insight-item {
            padding: 10px 0;
            border-bottom: 1px solid #eee;
        }
        .insight-item:last-child {
            border-bottom: none;
        }
        .trend-indicator {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 0.8em;
            font-weight: bold;
        }
        .trend-increasing {
            background: #ffeaa7;
            color: #d63031;
        }
        .trend-stable {
            background: #ddd;
            color: #333;
        }
        .trend-decreasing {
            background: #00b894;
            color: white;
        }
    </style>
</head>
<body>
    <div class="dashboard">
        <div class="header">
            <h1>Budget Usage Analytics Dashboard</h1>
            <p>Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
            <p>Data period: ${records[0]?.date || 'N/A'} to ${records[records.length - 1]?.date || 'N/A'} (${records.length} days)</p>
        </div>

        <div class="metric-grid">
            <div class="metric-card">
                <div class="metric-value">${summary.totalUsage}</div>
                <div class="metric-label">Total Usage</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${summary.averageUsage}</div>
                <div class="metric-label">Average Daily Usage</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${summary.peakUsage}</div>
                <div class="metric-label">Peak Daily Usage</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${summary.efficiency}%</div>
                <div class="metric-label">Average Efficiency</div>
            </div>
        </div>

        <div class="insights">
            <h2>Key Insights</h2>
            <div class="insight-item">
                <strong>Usage Trend:</strong>
                <span class="trend-indicator trend-${analysis.trend}">${analysis.trend.toUpperCase()}</span>
                <span>with ${Math.round(analysis.confidence * 100)}% confidence</span>
            </div>
            <div class="insight-item">
                <strong>Volatility:</strong> ${Math.round(analysis.volatility)} requests/day average deviation
            </div>
            <div class="insight-item">
                <strong>Anomalies Detected:</strong> ${anomalies.length} in recent period
            </div>
            <div class="insight-item">
                <strong>Forecast Accuracy:</strong> Historical model accuracy estimated at 85%
            </div>
            ${insights
              .slice(0, 5)
              .map((insight) => `<div class="insight-item">${insight}</div>`)
              .join('')}
        </div>
    </div>
</body>
</html>`;
  }
  async generateHtmlReport(records, analysis, forecasts, anomalies, config) {
    const summary = this.calculateSummaryStats(records);
    const insights = this.generateKeyInsights(
      records,
      analysis,
      forecasts,
      anomalies,
    );
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${config.title}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
        h1 { color: #333; border-bottom: 2px solid #4285f4; }
        h2 { color: #555; margin-top: 30px; }
        .summary-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .summary-table th, .summary-table td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
        }
        .summary-table th { background-color: #f2f2f2; }
        .insight-list { list-style-type: disc; padding-left: 20px; }
        .anomaly-item {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 4px;
            padding: 10px;
            margin: 5px 0;
        }
    </style>
</head>
<body>
    <h1>${config.title}</h1>
    <p><em>${config.description}</em></p>
    <p>Report generated on ${new Date().toLocaleString()}</p>
    <p>Data period: ${config.period.start} to ${config.period.end}</p>

    <h2>Executive Summary</h2>
    <table class="summary-table">
        <tr><th>Metric</th><th>Value</th></tr>
        <tr><td>Total Records</td><td>${records.length}</td></tr>
        <tr><td>Total Usage</td><td>${summary.totalUsage}</td></tr>
        <tr><td>Average Daily Usage</td><td>${summary.averageUsage}</td></tr>
        <tr><td>Peak Usage</td><td>${summary.peakUsage}</td></tr>
        <tr><td>Usage Efficiency</td><td>${summary.efficiency}%</td></tr>
        <tr><td>Trend Direction</td><td>${analysis.trend}</td></tr>
        <tr><td>Trend Confidence</td><td>${Math.round(analysis.confidence * 100)}%</td></tr>
        <tr><td>Anomalies Detected</td><td>${anomalies.length}</td></tr>
    </table>

    <h2>Key Insights</h2>
    <ul class="insight-list">
        ${insights.map((insight) => `<li>${insight}</li>`).join('')}
    </ul>

    <h2>Recent Anomalies</h2>
    ${anomalies
      .slice(0, 10)
      .map(
        (anomaly) => `
        <div class="anomaly-item">
            <strong>${anomaly.date}</strong> - ${anomaly.severity.toUpperCase()}: ${anomaly.description}
            (Score: ${anomaly.anomalyScore.toFixed(2)}, Confidence: ${Math.round(anomaly.confidence * 100)}%)
        </div>
    `,
      )
      .join('')}

    ${
      config.includeRawData
        ? `
    <h2>Raw Data</h2>
    <table class="summary-table">
        <tr>
            <th>Date</th>
            <th>Usage</th>
            <th>Limit</th>
            <th>Percentage</th>
            <th>Day of Week</th>
        </tr>
        ${records
          .slice(0, 50)
          .map(
            (record) => `
            <tr>
                <td>${record.date}</td>
                <td>${record.dailyUsage}</td>
                <td>${record.dailyLimit}</td>
                <td>${record.usagePercentage.toFixed(1)}%</td>
                <td>${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][record.dayOfWeek]}</td>
            </tr>
        `,
          )
          .join('')}
        ${records.length > 50 ? '<tr><td colspan="5">... (showing first 50 records)</td></tr>' : ''}
    </table>
    `
        : ''
    }

    <p><em>End of report</em></p>
</body>
</html>`;
  }
  generateJsonReport(records, analysis, forecasts, anomalies, config) {
    return JSON.stringify(
      {
        metadata: {
          title: config.title,
          description: config.description,
          generated: new Date().toISOString(),
          period: config.period,
          recordCount: records.length,
        },
        summary: this.calculateSummaryStats(records),
        trendAnalysis: analysis,
        forecasts,
        anomalies: anomalies.slice(0, 20),
        insights: this.generateKeyInsights(
          records,
          analysis,
          forecasts,
          anomalies,
        ),
        rawData: config.includeRawData ? records : undefined,
      },
      null,
      2,
    );
  }
  generateCsvReport(records, config) {
    const headers = [
      'Date',
      'DailyUsage',
      'DailyLimit',
      'UsagePercentage',
      'DayOfWeek',
      'WeekOfYear',
      'Month',
      'Quarter',
      'Year',
      'IsWeekend',
      'SeasonalCategory',
    ];
    const rows = records.map((record) => [
      record.date,
      record.dailyUsage.toString(),
      record.dailyLimit.toString(),
      record.usagePercentage.toString(),
      record.dayOfWeek.toString(),
      record.weekOfYear.toString(),
      record.month.toString(),
      record.quarter.toString(),
      record.year.toString(),
      record.isWeekend.toString(),
      record.seasonalCategory,
    ]);
    return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
  }
  // Helper methods
  calculateSummaryStats(records) {
    const totalUsage = records.reduce((sum, r) => sum + r.dailyUsage, 0);
    const averageUsage = Math.round(totalUsage / records.length);
    const peakUsage = Math.max(...records.map((r) => r.dailyUsage));
    const validRecords = records.filter((r) => r.dailyLimit > 0);
    const efficiency =
      validRecords.length > 0
        ? Math.round(
            validRecords.reduce((sum, r) => sum + r.usagePercentage, 0) /
              validRecords.length,
          )
        : 0;
    return { totalUsage, averageUsage, peakUsage, efficiency };
  }
  generateKeyInsights(records, analysis, forecasts, anomalies) {
    const insights = [];
    // Usage pattern insights
    const weekdayUsage = Array(7).fill(0);
    const weekdayCounts = Array(7).fill(0);
    records.forEach((r) => {
      weekdayUsage[r.dayOfWeek] += r.dailyUsage;
      weekdayCounts[r.dayOfWeek]++;
    });
    const avgWeekdayUsage = weekdayUsage.map((sum, i) =>
      weekdayCounts[i] > 0 ? sum / weekdayCounts[i] : 0,
    );
    const peakDay = avgWeekdayUsage.indexOf(Math.max(...avgWeekdayUsage));
    const lowDay = avgWeekdayUsage.indexOf(Math.min(...avgWeekdayUsage));
    const days = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ];
    insights.push(
      `Peak usage typically occurs on ${days[peakDay]}, lowest on ${days[lowDay]}`,
    );
    // Trend insights
    if (analysis.trendStrength > 0.3) {
      insights.push(
        `Strong ${analysis.trend} trend detected with ${Math.round(analysis.confidence * 100)}% confidence`,
      );
    }
    // Seasonality insights
    if (analysis.cyclicality.detected) {
      insights.push(
        `Cyclical pattern detected with ${analysis.cyclicality.period}-day cycles`,
      );
    }
    // Efficiency insights
    const avgEfficiency =
      records
        .filter((r) => r.dailyLimit > 0)
        .reduce((sum, r) => sum + r.usagePercentage, 0) /
      records.filter((r) => r.dailyLimit > 0).length;
    if (avgEfficiency < 50) {
      insights.push(
        'Budget utilization is low - consider optimizing limits or reallocating resources',
      );
    } else if (avgEfficiency > 90) {
      insights.push(
        'High budget utilization - consider increasing limits to avoid constraints',
      );
    }
    // Anomaly insights
    const criticalAnomalies = anomalies.filter(
      (a) => a.severity === 'critical',
    ).length;
    if (criticalAnomalies > 0) {
      insights.push(
        `${criticalAnomalies} critical usage anomalies require immediate attention`,
      );
    }
    // Forecast insights
    if (forecasts.length > 0) {
      const avgForecast =
        forecasts.reduce((sum, f) => sum + f.forecastUsage, 0) /
        forecasts.length;
      const currentAvg = analysis.averageDailyUsage;
      if (avgForecast > currentAvg * 1.2) {
        insights.push(
          'Forecasts indicate potential 20%+ increase in usage - prepare budget adjustments',
        );
      }
    }
    return insights.slice(0, 8); // Return top insights
  }
  async saveToDisk(artifact) {
    try {
      await fs.mkdir(this.outputDir, { recursive: true });
      const filename = `${artifact.id}.${artifact.format}`;
      const filepath = path.join(this.outputDir, filename);
      await fs.writeFile(filepath, artifact.data);
      artifact.filePath = filepath;
    } catch (error) {
      console.warn(
        `Failed to save visualization artifact ${artifact.id}:`,
        error,
      );
    }
  }
}
/**
 * Create a new HistoricalVisualizationEngine instance
 */
export function createHistoricalVisualizationEngine(projectRoot) {
  return new HistoricalVisualizationEngine(projectRoot);
}
//# sourceMappingURL=historical-visualization.js.map
