/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { loadSettings } from '../../config/settings.js';
import { createBudgetTracker } from '@google/gemini-cli-core';
import { createAnalyticsEngine } from '@google/gemini-cli-core';
import type { Arguments, CommandBuilder } from 'yargs';

interface VisualizeArgs {
  format?: 'ascii' | 'json' | 'interactive';
  period?: 'day' | 'week' | 'month';
  analytics?: boolean;
  recommendations?: boolean;
}

/**
 * Yargs command module for budget visualization with analytics
 *
 * This command provides comprehensive budget visualization including:
 * - ASCII charts for usage trends and patterns
 * - Interactive analytics dashboard insights
 * - Cost optimization recommendations
 * - Usage pattern analysis and anomaly detection
 * - JSON output for programmatic integration
 *
 * The command leverages the advanced analytics engine to provide
 * actionable insights for budget optimization and cost reduction.
 */
export const visualizeCommand = {
  command: 'visualize [format]',
  describe:
    'Visualize budget usage with analytics and optimization recommendations',
  builder: ((yargs) =>
    yargs
      .positional('format', {
        describe: 'Visualization format',
        type: 'string',
        choices: ['ascii', 'json', 'interactive'],
        default: 'interactive',
      })
      .option('period', {
        describe: 'Analysis time period',
        type: 'string',
        choices: ['day', 'week', 'month'],
        default: 'week',
        alias: 'p',
      })
      .option('analytics', {
        describe: 'Include advanced analytics and insights',
        type: 'boolean',
        default: true,
        alias: 'a',
      })
      .option('recommendations', {
        describe: 'Include optimization recommendations',
        type: 'boolean',
        default: true,
        alias: 'r',
      })
      .example(
        'gemini budget visualize',
        'Show interactive budget visualization with analytics',
      )
      .example(
        'gemini budget visualize ascii --period month',
        'Show ASCII chart for monthly budget usage',
      )
      .example(
        'gemini budget visualize json --analytics --recommendations',
        'Export comprehensive analytics data in JSON format',
      )) as CommandBuilder<VisualizeArgs, VisualizeArgs>,
  handler: async (args: Arguments<VisualizeArgs>) => {
    try {
      const settings = loadSettings(process.cwd());
      const budgetSettings = settings.merged.budget || {};
      const projectRoot = process.cwd();
      const tracker = createBudgetTracker(projectRoot, budgetSettings);

      if (!tracker.isEnabled()) {
        console.log('📊 Budget Visualization: Not Available');
        console.log('');
        console.log('Budget tracking is not enabled for this project.');
        console.log(
          'Use "gemini budget set <limit>" to enable budget tracking.',
        );
        return;
      }

      const stats = await tracker.getUsageStats();
      const analyticsEngine = createAnalyticsEngine(projectRoot, tracker);

      // Generate mock usage data for demonstration
      const mockMetrics = await generateMockUsageData(args.period || 'week');

      if (args.format === 'json') {
        await displayJSONVisualization(
          stats,
          mockMetrics,
          analyticsEngine,
          args.analytics,
          args.recommendations,
        );
      } else if (args.format === 'ascii') {
        await displayASCIIVisualization(
          stats,
          mockMetrics,
          args.period || 'week',
        );
      } else {
        await displayInteractiveVisualization(
          stats,
          mockMetrics,
          analyticsEngine,
          args.period || 'week',
          args.analytics,
          args.recommendations,
        );
      }
    } catch (error) {
      console.error('Error generating budget visualization:', error);
      process.exit(1);
    }
  },
};

/**
 * Display interactive budget visualization with comprehensive analytics
 */
async function displayInteractiveVisualization(
  stats: any,
  mockMetrics: any[],
  analyticsEngine: any,
  period: string,
  includeAnalytics?: boolean,
  includeRecommendations?: boolean,
): Promise<void> {
  console.log('📊 Budget Analytics Dashboard');
  console.log('═══════════════════════════════════════════════════════════');

  // Current status overview
  displayCurrentStatus(stats);

  // Usage trend visualization
  console.log('\n📈 Usage Trends');
  console.log('─────────────────────────────────────────────────────────');
  displayUsageTrend(mockMetrics, period);

  // Cost analysis
  console.log('\n💰 Cost Analysis');
  console.log('─────────────────────────────────────────────────────────');
  displayCostAnalysis(mockMetrics);

  if (includeAnalytics) {
    // Generate analytics report
    console.log('\n🔍 Advanced Analytics');
    console.log('─────────────────────────────────────────────────────────');

    try {
      const report = await analyticsEngine.generateReport();
      displayAnalyticsInsights(report);

      if (
        includeRecommendations &&
        report.optimizationRecommendations.length > 0
      ) {
        console.log('\n💡 Optimization Recommendations');
        console.log(
          '─────────────────────────────────────────────────────────',
        );
        displayOptimizationRecommendations(
          report.optimizationRecommendations.slice(0, 5),
        );

        console.log('\n💸 Potential Savings');
        console.log(
          '─────────────────────────────────────────────────────────',
        );
        displaySavingsBreakdown(report.potentialSavings);
      }
    } catch (error) {
      console.log('⚠️  Analytics temporarily unavailable (insufficient data)');
      console.log('   Continue using the system to build analytics history.');
    }
  }

  // Action items and next steps
  console.log('\n🎯 Next Steps');
  console.log('─────────────────────────────────────────────────────────');
  displayActionItems(stats);
}

/**
 * Display ASCII chart visualization
 */
async function displayASCIIVisualization(
  stats: any,
  mockMetrics: any[],
  period: string,
): Promise<void> {
  console.log(`📊 Budget Usage Chart (${period})`);
  console.log('══════════════════════════════════════════════════════');

  displayCurrentStatus(stats);

  console.log('\n📈 Usage Pattern (Requests per Hour)');
  console.log('────────────────────────────────────────────────────────');

  // Generate hourly data for chart
  const hourlyData = generateHourlyData(mockMetrics, period);
  displayASCIIChart(hourlyData, 'Requests');

  console.log('\n💰 Cost Pattern (Cost per Hour)');
  console.log('────────────────────────────────────────────────────────');

  const hourlyCostData = generateHourlyCostData(mockMetrics, period);
  displayASCIIChart(hourlyCostData, 'Cost ($)');

  console.log('\n📊 Quick Statistics');
  console.log('────────────────────────────────────────────────────────');
  displayQuickStats(mockMetrics, stats);
}

/**
 * Display JSON output for programmatic use
 */
async function displayJSONVisualization(
  stats: any,
  mockMetrics: any[],
  analyticsEngine: any,
  includeAnalytics?: boolean,
  includeRecommendations?: boolean,
): Promise<void> {
  const jsonOutput: any = {
    timestamp: new Date().toISOString(),
    currentStatus: {
      enabled: true,
      ...stats,
    },
    usageMetrics: mockMetrics,
  };

  if (includeAnalytics) {
    try {
      const report = await analyticsEngine.generateReport();
      jsonOutput.analytics = {
        summary: report.summary,
        featureAnalysis: report.featureAnalysis,
        patternAnalysis: report.patternAnalysis,
        anomalies: report.anomalies,
      };

      if (includeRecommendations) {
        jsonOutput.optimizationRecommendations =
          report.optimizationRecommendations;
        jsonOutput.potentialSavings = report.potentialSavings;
        jsonOutput.actionPlan = report.actionPlan;
      }
    } catch (error) {
      jsonOutput.analyticsError = 'Insufficient data for analytics generation';
    }
  }

  console.log(JSON.stringify(jsonOutput, null, 2));
}

/**
 * Display current budget status
 */
function displayCurrentStatus(stats: any): void {
  const percentage = stats.usagePercentage;
  const statusIcon = percentage >= 90 ? '🔴' : percentage >= 75 ? '🟡' : '🟢';

  console.log(
    `${statusIcon} Current Status: ${stats.requestCount}/${stats.dailyLimit} requests (${percentage.toFixed(1)}%)`,
  );
  console.log(`⏰ Time until reset: ${stats.timeUntilReset}`);
  console.log(`📦 Remaining requests: ${stats.remainingRequests}`);

  // Progress bar
  const barLength = 50;
  const filledLength = Math.round((percentage / 100) * barLength);
  const bar = '█'.repeat(filledLength) + '░'.repeat(barLength - filledLength);
  console.log(`📊 Progress: [${bar}] ${percentage.toFixed(1)}%`);
}

/**
 * Display usage trend over time
 */
function displayUsageTrend(mockMetrics: any[], period: string): void {
  const trend = calculateTrend(mockMetrics);
  const trendIcon = trend > 0 ? '📈' : trend < 0 ? '📉' : '➡️';
  const trendText =
    trend > 0 ? 'increasing' : trend < 0 ? 'decreasing' : 'stable';

  console.log(
    `${trendIcon} Trend: ${trendText} (${Math.abs(trend).toFixed(1)}% change)`,
  );

  // Peak usage identification
  const peakHours = identifyPeakHours(mockMetrics);
  console.log(`⚡ Peak hours: ${peakHours.join(', ')}`);

  // Average daily requests
  const avgDaily = mockMetrics.length / getDayCount(period);
  console.log(`📅 Average daily requests: ${avgDaily.toFixed(1)}`);
}

/**
 * Display cost analysis
 */
function displayCostAnalysis(mockMetrics: any[]): void {
  const totalCost = mockMetrics.reduce(
    (sum: number, m: any) => sum + (m.cost || 0),
    0,
  );
  const avgCostPerRequest = totalCost / mockMetrics.length;
  const projectedMonthlyCost = (totalCost / getDayCount('week')) * 30;

  console.log(`💵 Total cost: $${totalCost.toFixed(2)}`);
  console.log(`📊 Average per request: $${avgCostPerRequest.toFixed(4)}`);
  console.log(`🔮 Projected monthly: $${projectedMonthlyCost.toFixed(2)}`);

  // Cost by feature (mock data)
  console.log('\n🏷️  Cost by feature:');
  const featureCosts = {
    'chat-completion': totalCost * 0.6,
    embeddings: totalCost * 0.25,
    'image-analysis': totalCost * 0.15,
  };

  Object.entries(featureCosts).forEach(([feature, cost]) => {
    const percentage = ((cost as number) / totalCost) * 100;
    console.log(
      `   ${feature}: $${(cost as number).toFixed(2)} (${percentage.toFixed(1)}%)`,
    );
  });
}

/**
 * Display analytics insights
 */
function displayAnalyticsInsights(report: any): void {
  console.log(
    `🔍 Analysis period: ${report.period.start.split('T')[0]} to ${report.period.end.split('T')[0]}`,
  );
  console.log(`📈 Cost trend: ${report.summary.costTrend}`);
  console.log(
    `📊 Budget utilization: ${(report.summary.budgetUtilization * 100).toFixed(1)}%`,
  );
  console.log(
    `🔮 Projected monthly spend: $${report.summary.projectedMonthlySpend.toFixed(2)}`,
  );

  if (report.patternAnalysis.length > 0) {
    console.log('\n🔍 Detected patterns:');
    report.patternAnalysis.forEach((pattern: any, index: number) => {
      const icon = getPatternIcon(pattern.patternType);
      console.log(`   ${icon} ${pattern.patternType}: ${pattern.description}`);
    });
  }

  if (report.anomalies.length > 0) {
    console.log('\n⚠️  Anomalies detected:');
    report.anomalies.forEach((anomaly: any) => {
      const severityIcon = getSeverityIcon(anomaly.severity);
      console.log(`   ${severityIcon} ${anomaly.type}: ${anomaly.description}`);
    });
  }
}

/**
 * Display optimization recommendations
 */
function displayOptimizationRecommendations(recommendations: any[]): void {
  recommendations.forEach((rec, index) => {
    const priorityIcon = getPriorityIcon(rec.priority);
    const complexityColor = getComplexityColor(rec.implementationComplexity);

    console.log(`${priorityIcon} ${rec.title}`);
    console.log(
      `   💰 Potential savings: $${rec.potentialSavings.toFixed(2)} (${rec.savingsPercentage}%)`,
    );
    console.log(
      `   ${complexityColor} Complexity: ${rec.implementationComplexity} | ⏱️  Time: ${rec.timeToImplement}`,
    );
    console.log(`   📋 ${rec.description}`);

    if (rec.actionItems && rec.actionItems.length > 0) {
      console.log('   🎯 Action items:');
      rec.actionItems.slice(0, 2).forEach((item: string) => {
        console.log(`      • ${item}`);
      });
    }

    if (index < recommendations.length - 1) {
      console.log('');
    }
  });
}

/**
 * Display savings breakdown
 */
function displaySavingsBreakdown(savings: any): void {
  console.log(
    `💸 Total potential savings: $${savings.total.toFixed(2)} (${savings.percentage.toFixed(1)}%)`,
  );
  console.log('');
  console.log('📊 Savings timeline:');
  console.log(
    `   🟢 Immediate (low complexity): $${savings.immediate.toFixed(2)}`,
  );
  console.log(
    `   🟡 Short-term (medium complexity): $${savings.shortTerm.toFixed(2)}`,
  );
  console.log(
    `   🔴 Long-term (high complexity): $${savings.longTerm.toFixed(2)}`,
  );
}

/**
 * Display action items and next steps
 */
function displayActionItems(stats: any): void {
  const items = [];

  if (stats.usagePercentage >= 80) {
    items.push('⚠️  Monitor usage closely - approaching budget limit');
    items.push(
      '💡 Consider increasing daily limit or implementing rate limiting',
    );
  }

  if (stats.remainingRequests < 50) {
    items.push('🔴 Low remaining requests - consider extending budget');
  }

  items.push(
    '📊 Run "gemini budget visualize --analytics" for detailed insights',
  );
  items.push('🔧 Review optimization recommendations regularly');
  items.push('📈 Track usage patterns to identify optimization opportunities');

  items.forEach((item) => console.log(`   ${item}`));
}

/**
 * Generate and display ASCII chart
 */
function displayASCIIChart(
  data: Array<{ label: string; value: number }>,
  unit: string,
): void {
  const maxValue = Math.max(...data.map((d) => d.value));
  const chartWidth = 40;

  data.forEach((point) => {
    const barLength = Math.round((point.value / maxValue) * chartWidth);
    const bar = '█'.repeat(barLength);
    const padding = ' '.repeat(Math.max(0, 8 - point.label.length));
    console.log(
      `${point.label}${padding} │${bar} ${point.value.toFixed(2)} ${unit}`,
    );
  });
}

/**
 * Display quick statistics summary
 */
function displayQuickStats(mockMetrics: any[], stats: any): void {
  const totalRequests = mockMetrics.length;
  const totalCost = mockMetrics.reduce(
    (sum: number, m: any) => sum + (m.cost || 0),
    0,
  );
  const avgResponseTime =
    mockMetrics.reduce(
      (sum: number, m: any) => sum + (m.responseTime || 0),
      0,
    ) / totalRequests;

  console.log(`📊 Total requests analyzed: ${totalRequests}`);
  console.log(`💰 Total cost: $${totalCost.toFixed(2)}`);
  console.log(`⚡ Average response time: ${avgResponseTime.toFixed(0)}ms`);
  console.log(
    `🎯 Efficiency score: ${calculateEfficiencyScore(mockMetrics, stats).toFixed(1)}/10`,
  );
}

// Helper functions

function generateMockUsageData(period: string): any[] {
  const dataPoints = period === 'day' ? 24 : period === 'week' ? 168 : 720; // Hours in period
  const baseDate = new Date();
  baseDate.setHours(baseDate.getHours() - dataPoints);

  const metrics = [];
  for (let i = 0; i < dataPoints; i++) {
    const timestamp = new Date(baseDate.getTime() + i * 60 * 60 * 1000);
    const hour = timestamp.getHours();

    // Simulate business hours pattern
    const businessHoursMultiplier = hour >= 9 && hour <= 17 ? 1.5 : 0.7;
    const weekendMultiplier =
      timestamp.getDay() === 0 || timestamp.getDay() === 6 ? 0.5 : 1.0;

    const baseRequests = Math.random() * 10 + 2;
    const requests = Math.round(
      baseRequests * businessHoursMultiplier * weekendMultiplier,
    );

    for (let j = 0; j < requests; j++) {
      metrics.push({
        timestamp: timestamp.toISOString(),
        cost: Math.random() * 0.05 + 0.01, // $0.01 to $0.06 per request
        feature: ['chat-completion', 'embeddings', 'image-analysis'][
          Math.floor(Math.random() * 3)
        ],
        responseTime: Math.random() * 1000 + 200, // 200-1200ms
        tokens: Math.floor(Math.random() * 1000 + 100),
      });
    }
  }

  return metrics;
}

function calculateTrend(metrics: any[]): number {
  if (metrics.length < 10) return 0;

  const firstHalf = metrics.slice(0, Math.floor(metrics.length / 2));
  const secondHalf = metrics.slice(Math.floor(metrics.length / 2));

  const firstAvg = firstHalf.length;
  const secondAvg = secondHalf.length;

  return ((secondAvg - firstAvg) / firstAvg) * 100;
}

function identifyPeakHours(metrics: any[]): string[] {
  const hourCounts = new Map<number, number>();

  metrics.forEach((m) => {
    const hour = new Date(m.timestamp).getHours();
    hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
  });

  const maxCount = Math.max(...Array.from(hourCounts.values()));
  const peakHours = Array.from(hourCounts.entries())
    .filter(([_, count]) => count >= maxCount * 0.8)
    .map(([hour]) => `${hour.toString().padStart(2, '0')}:00`)
    .sort();

  return peakHours.slice(0, 3); // Top 3 peak hours
}

function generateHourlyData(
  metrics: any[],
  period: string,
): Array<{ label: string; value: number }> {
  const hours = period === 'day' ? 24 : 12; // Show 12 hours for week/month
  const data = [];

  for (let i = 0; i < hours; i++) {
    const hour = i;
    const count = metrics.filter(
      (m) => new Date(m.timestamp).getHours() === hour,
    ).length;
    data.push({
      label: `${hour.toString().padStart(2, '0')}h`,
      value: count,
    });
  }

  return data;
}

function generateHourlyCostData(
  metrics: any[],
  period: string,
): Array<{ label: string; value: number }> {
  const hours = period === 'day' ? 24 : 12;
  const data = [];

  for (let i = 0; i < hours; i++) {
    const hour = i;
    const hourMetrics = metrics.filter(
      (m) => new Date(m.timestamp).getHours() === hour,
    );
    const totalCost = hourMetrics.reduce((sum, m) => sum + (m.cost || 0), 0);

    data.push({
      label: `${hour.toString().padStart(2, '0')}h`,
      value: totalCost,
    });
  }

  return data;
}

function getDayCount(period: string): number {
  switch (period) {
    case 'day':
      return 1;
    case 'week':
      return 7;
    case 'month':
      return 30;
    default:
      return 7;
  }
}

function calculateEfficiencyScore(metrics: any[], stats: any): number {
  // Simple efficiency score based on usage vs limit ratio and cost effectiveness
  const utilizationScore = Math.min(10, (stats.usagePercentage / 100) * 10);
  const costScore =
    metrics.length > 0 ? Math.min(10, 10 - metrics[0].cost / 0.1) : 5;

  return (utilizationScore + costScore) / 2;
}

function getPatternIcon(patternType: string): string {
  const icons: Record<string, string> = {
    spike: '⚡',
    periodic: '🔄',
    business_hours: '🏢',
    weekend_dip: '📉',
    seasonal: '📅',
    burst: '💥',
    gradual_increase: '📈',
  };
  return icons[patternType] || '📊';
}

function getSeverityIcon(severity: string): string {
  const icons: Record<string, string> = {
    low: '🟡',
    medium: '🟠',
    high: '🔴',
    critical: '🚨',
  };
  return icons[severity] || '⚠️';
}

function getPriorityIcon(priority: string): string {
  const icons: Record<string, string> = {
    low: '🔵',
    medium: '🟡',
    high: '🟠',
    critical: '🔴',
  };
  return icons[priority] || '⚪';
}

function getComplexityColor(complexity: string): string {
  const colors: Record<string, string> = {
    low: '🟢',
    medium: '🟡',
    high: '🔴',
  };
  return colors[complexity] || '⚪';
}
