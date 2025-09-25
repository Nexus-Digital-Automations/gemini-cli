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
import type { DashboardConfig, DashboardData, DashboardSections, BudgetAlert } from './BudgetDashboard.js';
import type { FeatureCostAnalysis, OptimizationRecommendation } from '../index';
import { ChartRenderer } from './ChartRenderer.js';

/**
 * Dashboard Formatter for Budget Usage Visualizer
 *
 * Handles the layout, formatting, and visual presentation
 * of all dashboard components and sections.
 */
export class DashboardFormatter {
  private config: Required<DashboardConfig>;
  private chartRenderer: ChartRenderer;
  private readonly PANEL_WIDTH = 80;

  constructor(config: Required<DashboardConfig>) {
    this.config = config;
    this.chartRenderer = new ChartRenderer({
      width: this.PANEL_WIDTH - 4,
      height: 15,
      theme: config.theme
    });
  }

  /**
   * Format the complete dashboard with all sections
   */
  formatDashboard(data: DashboardData, sections: DashboardSections): string {
    let dashboard = '';

    // Header
    dashboard += this.formatHeader();

    // Summary panel (always shown if enabled)
    if (sections.summary) {
      dashboard += this.formatSummaryPanel(data);
    }

    // Real-time usage
    if (sections.realTimeUsage) {
      dashboard += this.formatRealTimeUsage(data);
    }

    // Budget alerts (high priority - show early)
    if (sections.budgetAlerts && data.alerts.length > 0) {
      dashboard += this.formatBudgetAlerts(data.alerts);
    }

    // Cost projections
    if (sections.costProjections) {
      dashboard += this.formatCostProjections(data);
    }

    // Historical trends
    if (sections.historicalTrends) {
      dashboard += this.formatHistoricalTrends(data);
    }

    // Feature analysis
    if (sections.featureAnalysis && data.features.length > 0) {
      dashboard += this.formatFeatureAnalysis(data.features);
    }

    // Optimization recommendations
    if (sections.optimizationRecommendations && data.recommendations.length > 0) {
      dashboard += this.formatOptimizationRecommendations(data.recommendations);
    }

    // Footer
    dashboard += this.formatFooter();

    return dashboard;
  }

  /**
   * Format the dashboard header
   */
  private formatHeader(): string {
    const timestamp = new Date().toLocaleString();
    const title = 'Budget Usage Dashboard';

    let header = '';
    header += chalk.bold.cyan('═'.repeat(this.PANEL_WIDTH)) + '\n';
    header += chalk.bold.cyan('║') + ' '.repeat(this.PANEL_WIDTH - 2) + chalk.bold.cyan('║') + '\n';
    header += chalk.bold.cyan('║');
    header += chalk.bold.white(title.padStart((this.PANEL_WIDTH - 2 + title.length) / 2));
    header += ' '.repeat(this.PANEL_WIDTH - 2 - title.length - Math.floor((this.PANEL_WIDTH - 2 - title.length) / 2));
    header += chalk.bold.cyan('║') + '\n';
    header += chalk.bold.cyan('║') + ' '.repeat(this.PANEL_WIDTH - 2) + chalk.bold.cyan('║') + '\n';
    header += chalk.bold.cyan('║');
    header += chalk.dim(timestamp.padStart((this.PANEL_WIDTH - 2 + timestamp.length) / 2));
    header += ' '.repeat(this.PANEL_WIDTH - 2 - timestamp.length - Math.floor((this.PANEL_WIDTH - 2 - timestamp.length) / 2));
    header += chalk.bold.cyan('║') + '\n';
    header += chalk.bold.cyan('║') + ' '.repeat(this.PANEL_WIDTH - 2) + chalk.bold.cyan('║') + '\n';
    header += chalk.bold.cyan('═'.repeat(this.PANEL_WIDTH)) + '\n\n';

    return header;
  }

  /**
   * Format the summary panel with key metrics
   */
  private formatSummaryPanel(data: DashboardData): string {
    const { currentUsage } = data;

    let panel = '';
    panel += chalk.bold('📊 Usage Summary') + '\n';
    panel += '━'.repeat(this.PANEL_WIDTH) + '\n';

    // Current metrics in a grid layout
    const metrics = [
      { label: 'Today\'s Requests', value: currentUsage.todayRequests, color: chalk.cyan },
      { label: 'Today\'s Cost', value: `$${currentUsage.todayCost.toFixed(4)}`, color: chalk.green },
      { label: 'Budget Remaining', value: `$${currentUsage.budgetRemaining.toFixed(4)}`, color: chalk.yellow },
      { label: 'Budget Used', value: `${currentUsage.budgetUtilization.toFixed(1)}%`, color: chalk.blue }
    ];

    // Render metrics in a 2x2 grid
    for (let i = 0; i < metrics.length; i += 2) {
      const left = metrics[i];
      const right = metrics[i + 1];

      const leftSide = `${left.label}: ${left.color(left.value)}`;
      const rightSide = right ? `${right.label}: ${right.color(right.value)}` : '';

      panel += leftSide.padEnd(this.PANEL_WIDTH / 2);
      panel += rightSide + '\n';
    }

    panel += '\n';

    // Budget utilization gauge
    panel += this.chartRenderer.renderGauge(
      currentUsage.budgetUtilization,
      100,
      { warning: 75, critical: 90 },
      { title: 'Daily Budget Utilization', unit: '%' }
    );

    return panel;
  }

  /**
   * Format real-time usage section
   */
  private formatRealTimeUsage(data: DashboardData): string {
    let section = '';
    section += chalk.bold('⚡ Real-Time Usage') + '\n';
    section += '━'.repeat(this.PANEL_WIDTH) + '\n';

    // Hourly usage sparkline
    const hourlySparkline = this.chartRenderer.renderSparkline(
      data.trends.hourlyUsage,
      'Last 24 Hours:'
    );
    section += hourlySparkline + '\n\n';

    // Daily usage sparkline
    const dailySparkline = this.chartRenderer.renderSparkline(
      data.trends.dailyUsage,
      'Last 30 Days: '
    );
    section += dailySparkline + '\n\n';

    return section;
  }

  /**
   * Format budget alerts section
   */
  private formatBudgetAlerts(alerts: BudgetAlert[]): string {
    let section = '';
    section += chalk.bold('🚨 Budget Alerts') + '\n';
    section += '━'.repeat(this.PANEL_WIDTH) + '\n';

    alerts.forEach(alert => {
      let alertLine = '';

      // Alert icon and type
      switch (alert.type) {
        case 'critical':
          alertLine += chalk.red('🔴 CRITICAL: ');
          break;
        case 'warning':
          alertLine += chalk.yellow('🟡 WARNING: ');
          break;
        case 'info':
          alertLine += chalk.blue('🔵 INFO: ');
          break;
        case 'success':
          alertLine += chalk.green('🟢 SUCCESS: ');
          break;
        default:
          alertLine += chalk.dim('• UNKNOWN: ');
          break;
      }

      // Alert title and message
      alertLine += chalk.bold(alert.title) + '\n';
      alertLine += '   ' + alert.message;

      // Add threshold info if available
      if (alert.threshold && alert.currentValue) {
        const percentage = ((alert.currentValue / alert.threshold) * 100).toFixed(1);
        alertLine += chalk.dim(` (${alert.currentValue}/${alert.threshold} - ${percentage}%)`);
      }

      alertLine += '\n';

      // Add timestamp
      const timestamp = new Date(alert.timestamp).toLocaleTimeString();
      alertLine += chalk.dim('   ') + chalk.dim(timestamp);

      if (alert.actionable) {
        alertLine += chalk.dim(' • Action Required');
      }

      section += alertLine + '\n\n';
    });

    return section;
  }

  /**
   * Format cost projections section
   */
  private formatCostProjections(data: DashboardData): string {
    const { projections } = data;

    let section = '';
    section += chalk.bold('📈 Cost Projections') + '\n';
    section += '━'.repeat(this.PANEL_WIDTH) + '\n';

    // Projection table
    const projectionData = [
      { period: 'Daily', projection: projections.dailyProjection, exceeds: projections.exceedsDaily },
      { period: 'Weekly', projection: projections.weeklyProjection, exceeds: projections.exceedsWeekly },
      { period: 'Monthly', projection: projections.monthlyProjection, exceeds: projections.exceedsMonthly }
    ];

    section += chalk.dim('Period').padEnd(15) +
              chalk.dim('Projection').padEnd(15) +
              chalk.dim('Status') + '\n';
    section += '─'.repeat(this.PANEL_WIDTH) + '\n';

    projectionData.forEach(proj => {
      const statusColor = proj.exceeds ? chalk.red : chalk.green;
      const statusText = proj.exceeds ? 'Over Budget' : 'Within Budget';

      section += proj.period.padEnd(15);
      section += `$${proj.projection.toFixed(4)}`.padEnd(15);
      section += statusColor(statusText);
      section += '\n';
    });

    section += '\n';

    return section;
  }

  /**
   * Format historical trends section
   */
  private formatHistoricalTrends(data: DashboardData): string {
    const { trends } = data;

    let section = '';
    section += chalk.bold('📊 Historical Trends') + '\n';
    section += '━'.repeat(this.PANEL_WIDTH) + '\n';

    // Daily usage trend chart
    section += this.chartRenderer.renderLineChart(
      trends.dailyUsage,
      Array.from({ length: 30 }, (_, i) => `${30 - i}d`),
      { title: 'Daily Usage (Last 30 Days)', yAxisLabel: 'Requests' }
    );

    section += '\n';

    return section;
  }

  /**
   * Format feature analysis section
   */
  private formatFeatureAnalysis(features: FeatureCostAnalysis[]): string {
    let section = '';
    section += chalk.bold('🔍 Feature Cost Analysis') + '\n';
    section += '━'.repeat(this.PANEL_WIDTH) + '\n';

    // Convert to chart data
    const chartData = features.slice(0, 10).map(feature => ({
      label: feature.featureName,
      value: feature.totalCost,
      color: this.getFeatureColor(feature.roi)
    }));

    section += this.chartRenderer.renderBarChart(chartData, {
      title: 'Cost by Feature (Top 10)',
      maxBars: 10
    });

    // Feature details table
    section += chalk.bold('\nDetailed Analysis:') + '\n';
    section += chalk.dim('Feature').padEnd(20) +
              chalk.dim('Cost').padEnd(12) +
              chalk.dim('Requests').padEnd(12) +
              chalk.dim('ROI').padEnd(8) +
              chalk.dim('Trend') + '\n';
    section += '─'.repeat(this.PANEL_WIDTH) + '\n';

    features.slice(0, 5).forEach(feature => {
      const roiColor = feature.roi >= 1 ? chalk.green : chalk.red;
      const trendIcon = this.getTrendIcon(feature.costTrend);

      section += feature.featureName.substring(0, 18).padEnd(20);
      section += `$${feature.totalCost.toFixed(3)}`.padEnd(12);
      section += feature.requestCount.toString().padEnd(12);
      section += roiColor(`${feature.roi.toFixed(1)}x`).padEnd(8);
      section += trendIcon + ' ' + feature.costTrend;
      section += '\n';
    });

    section += '\n';

    return section;
  }

  /**
   * Format optimization recommendations section
   */
  private formatOptimizationRecommendations(recommendations: OptimizationRecommendation[]): string {
    let section = '';
    section += chalk.bold('🚀 Optimization Recommendations') + '\n';
    section += '━'.repeat(this.PANEL_WIDTH) + '\n';

    recommendations.slice(0, 5).forEach((rec, index) => {
      const savingsColor = rec.potentialSavings > 0 ? chalk.green : chalk.blue;
      const complexityColor = this.getComplexityColor(rec.implementationComplexity);

      section += chalk.bold(`${index + 1}. ${rec.title}`) + '\n';
      section += `   ${rec.description}` + '\n';
      section += '   ' + savingsColor(`💰 Potential Savings: $${rec.potentialSavings.toFixed(4)} (${rec.savingsPercentage.toFixed(1)}%)`);
      section += ' • ' + complexityColor(`Complexity: ${rec.implementationComplexity}`);
      section += '\n\n';
    });

    return section;
  }

  /**
   * Format the dashboard footer
   */
  private formatFooter(): string {
    let footer = '';
    footer += '═'.repeat(this.PANEL_WIDTH) + '\n';
    footer += chalk.dim(`Last updated: ${new Date().toLocaleString()}`);
    footer += chalk.dim(` • Refresh rate: ${this.config.refreshInterval}ms`) + '\n';
    footer += chalk.dim('Press [q] to quit, [r] to refresh, [h] for help') + '\n';

    return footer;
  }

  /**
   * Get color for feature based on ROI
   */
  private getFeatureColor(roi: number): string {
    if (roi >= 2) return '#00ff88'; // High ROI - green
    if (roi >= 1) return '#00d9ff'; // Good ROI - blue
    if (roi >= 0.5) return '#ffdd00'; // Medium ROI - yellow
    return '#ff4444'; // Low ROI - red
  }

  /**
   * Get trend icon for cost trends
   */
  private getTrendIcon(trend: string): string {
    switch (trend) {
      case 'increasing': return chalk.red('↗');
      case 'decreasing': return chalk.green('↘');
      case 'stable': return chalk.blue('→');
      case 'volatile': return chalk.yellow('↕');
      default: return chalk.dim('–');
    }
  }

  /**
   * Get color for complexity level
   */
  private getComplexityColor(complexity: string): ReturnType<typeof createChalkFallback> {
    switch (complexity) {
      case 'low': return chalk.green;
      case 'medium': return chalk.yellow;
      case 'high': return chalk.red;
      default: return chalk.dim;
    }
  }
}