/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import chalk from 'chalk';
export const metricsCommand = {
  command: 'metrics',
  describe: 'Show autonomous system performance metrics',
  builder: (yargs) =>
    yargs
      .option('json', {
        type: 'boolean',
        describe: 'Output metrics in JSON format',
        default: false,
      })
      .option('watch', {
        type: 'boolean',
        describe: 'Watch metrics and refresh periodically',
        default: false,
        alias: 'w',
      })
      .option('interval', {
        type: 'number',
        describe: 'Refresh interval in seconds (with --watch)',
        default: 10,
        alias: 'i',
      })
      .option('time-range', {
        type: 'string',
        describe: 'Time range for metrics',
        choices: ['1h', '6h', '24h', '7d', '30d'],
        default: '24h',
        alias: 't',
      })
      .example('gemini autonomous metrics', 'Show current metrics')
      .example(
        'gemini autonomous metrics --time-range 7d',
        'Show 7-day metrics',
      )
      .example(
        'gemini autonomous metrics --watch',
        'Watch metrics with live updates',
      ),
  handler: async (argv) => {
    try {
      if (argv.watch) {
        // Start watch mode
        console.log(chalk.cyan('📊 Autonomous System Metrics - Live View'));
        console.log(
          chalk.gray(
            `Time Range: ${argv['time-range']} | Refreshing every ${argv.interval}s`,
          ),
        );
        console.log(chalk.gray('─'.repeat(80)));
        const displayMetrics = async () => {
          try {
            process.stdout.write('\x1B[H\x1B[2J'); // Clear screen
            console.log(chalk.cyan('📊 Autonomous System Metrics - Live View'));
            console.log(
              chalk.gray(
                `Time Range: ${argv['time-range']} | Refreshing every ${argv.interval}s (Press Ctrl+C to exit)`,
              ),
            );
            console.log(chalk.gray('─'.repeat(80)));
            const metrics = await getSystemMetrics(argv['time-range'] || '24h');
            displayMetricsData(metrics, false);
          } catch (error) {
            console.error(chalk.red('Error fetching metrics:'), error);
          }
        };
        // Initial display
        await displayMetrics();
        // Setup interval
        const intervalId = setInterval(
          displayMetrics,
          (argv.interval || 10) * 1000,
        );
        // Handle Ctrl+C
        process.on('SIGINT', () => {
          clearInterval(intervalId);
          console.log(chalk.yellow('\n👋 Metrics monitoring stopped'));
          process.exit(0);
        });
        return;
      }
      const metrics = await getSystemMetrics(argv['time-range'] || '24h');
      if (argv.json) {
        console.log(JSON.stringify(metrics, null, 2));
      } else {
        displayMetricsData(metrics, true);
      }
    } catch (error) {
      console.error(chalk.red('❌ Failed to get system metrics:'));
      console.error(
        chalk.red(error instanceof Error ? error.message : String(error)),
      );
      process.exit(1);
    }
  },
};
async function getSystemMetrics(timeRange) {
  // In real implementation, this would fetch from the autonomous system
  // Mock metrics data based on time range
  const baseMetrics = {
    system: {
      uptime: 3600000, // 1 hour
      totalTasks: 156,
      successRate: 0.92,
      averageExecutionTime: 45000, // 45 seconds
      throughput: 24, // tasks per hour
      resourceUsage: {
        cpu: 35.2,
        memory: 512.4,
        disk: 89.1,
      },
    },
    tasks: {
      total: 156,
      completed: 144,
      failed: 12,
      cancelled: 0,
      running: 3,
      queued: 5,
      byCategory: {
        feature: 89,
        bug_fix: 34,
        test: 18,
        documentation: 8,
        refactor: 7,
      },
      byPriority: {
        critical: 5,
        high: 23,
        medium: 98,
        low: 30,
        background: 0,
      },
    },
    agents: {
      total: 8,
      active: 6,
      idle: 2,
      busy: 3,
      utilization: 0.75,
      topPerformers: [
        { id: 'FEATURE_AGENT_001', completedTasks: 34, successRate: 0.97 },
        { id: 'SECURITY_AGENT_002', completedTasks: 28, successRate: 0.95 },
        { id: 'TEST_AGENT_001', completedTasks: 22, successRate: 0.91 },
      ],
    },
    performance: {
      averageResponseTime: 1250, // ms
      p95ResponseTime: 3200,
      p99ResponseTime: 8500,
      errorRate: 0.08,
      tokensPerSecond: 45.7,
      toolCallsPerMinute: 12.3,
    },
    quality: {
      lintPassRate: 0.98,
      testPassRate: 0.94,
      buildSuccessRate: 0.96,
      securityScanPassRate: 0.89,
    },
    timeRange,
    lastUpdated: new Date().toISOString(),
  };
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 300));
  return baseMetrics;
}
function displayMetricsData(metrics, showHeader) {
  if (showHeader) {
    console.log(chalk.cyan('📊 Autonomous System Performance Metrics'));
    console.log(
      chalk.gray(
        `Time Range: ${metrics.timeRange} | Last Updated: ${new Date(metrics.lastUpdated).toLocaleString()}`,
      ),
    );
    console.log(chalk.gray('─'.repeat(80)));
  }
  // System Overview
  console.log(chalk.bold('🖥️  System Overview:'));
  console.log(`   Uptime: ${formatUptime(metrics.system.uptime)}`);
  console.log(
    `   Total Tasks Processed: ${chalk.blue(metrics.system.totalTasks.toLocaleString())}`,
  );
  console.log(
    `   Success Rate: ${getSuccessRateDisplay(metrics.system.successRate)}`,
  );
  console.log(
    `   Avg Execution Time: ${chalk.yellow(formatDuration(metrics.system.averageExecutionTime))}`,
  );
  console.log(
    `   Throughput: ${chalk.cyan(metrics.system.throughput)} tasks/hour`,
  );
  // Resource Usage
  console.log(chalk.bold('\n💾 Resource Usage:'));
  console.log(
    `   CPU: ${getUsageDisplay(metrics.system.resourceUsage.cpu, 80)}%`,
  );
  console.log(
    `   Memory: ${chalk.blue(metrics.system.resourceUsage.memory)} MB`,
  );
  console.log(
    `   Disk I/O: ${getUsageDisplay(metrics.system.resourceUsage.disk, 100)} MB/s`,
  );
  // Task Statistics
  console.log(chalk.bold('\n📋 Task Statistics:'));
  console.log(`   Total: ${chalk.blue(metrics.tasks.total)}`);
  console.log(`   ✅ Completed: ${chalk.green(metrics.tasks.completed)}`);
  console.log(`   ❌ Failed: ${chalk.red(metrics.tasks.failed)}`);
  console.log(`   🚮 Cancelled: ${chalk.gray(metrics.tasks.cancelled)}`);
  console.log(`   🔄 Running: ${chalk.yellow(metrics.tasks.running)}`);
  console.log(`   📋 Queued: ${chalk.blue(metrics.tasks.queued)}`);
  // Task Distribution
  console.log(chalk.bold('\n📊 Task Distribution:'));
  console.log(chalk.underline('   By Category:'));
  Object.entries(metrics.tasks.byCategory).forEach(([category, count]) => {
    const percentage = ((count / metrics.tasks.total) * 100).toFixed(1);
    console.log(`     ${category}: ${count} (${percentage}%)`);
  });
  console.log(chalk.underline('   By Priority:'));
  Object.entries(metrics.tasks.byPriority).forEach(([priority, count]) => {
    const color = getPriorityColor(priority);
    const percentage = ((count / metrics.tasks.total) * 100).toFixed(1);
    console.log(`     ${color(priority)}: ${count} (${percentage}%)`);
  });
  // Agent Performance
  console.log(chalk.bold('\n🤖 Agent Performance:'));
  console.log(`   Total Agents: ${chalk.blue(metrics.agents.total)}`);
  console.log(`   🟢 Active: ${chalk.green(metrics.agents.active)}`);
  console.log(`   💤 Idle: ${chalk.gray(metrics.agents.idle)}`);
  console.log(`   🔥 Busy: ${chalk.yellow(metrics.agents.busy)}`);
  console.log(
    `   Utilization: ${getUtilizationDisplay(metrics.agents.utilization)}`,
  );
  console.log(chalk.underline('\n   Top Performers:'));
  metrics.agents.topPerformers.forEach((agent, index) => {
    const medal = ['🥇', '🥈', '🥉'][index] || '🏅';
    console.log(
      `     ${medal} ${agent.id}: ${agent.completedTasks} tasks (${(agent.successRate * 100).toFixed(1)}% success)`,
    );
  });
  // Performance Metrics
  console.log(chalk.bold('\n⚡ Performance Metrics:'));
  console.log(
    `   Avg Response Time: ${chalk.yellow(metrics.performance.averageResponseTime)} ms`,
  );
  console.log(
    `   95th Percentile: ${chalk.yellow(metrics.performance.p95ResponseTime)} ms`,
  );
  console.log(
    `   99th Percentile: ${chalk.red(metrics.performance.p99ResponseTime)} ms`,
  );
  console.log(
    `   Error Rate: ${getErrorRateDisplay(metrics.performance.errorRate)}`,
  );
  console.log(
    `   Tokens/Second: ${chalk.cyan(metrics.performance.tokensPerSecond.toFixed(1))}`,
  );
  console.log(
    `   Tool Calls/Min: ${chalk.cyan(metrics.performance.toolCallsPerMinute.toFixed(1))}`,
  );
  // Quality Gates
  console.log(chalk.bold('\n✅ Quality Gates:'));
  console.log(
    `   Lint Pass Rate: ${getQualityDisplay(metrics.quality.lintPassRate)}`,
  );
  console.log(
    `   Test Pass Rate: ${getQualityDisplay(metrics.quality.testPassRate)}`,
  );
  console.log(
    `   Build Success Rate: ${getQualityDisplay(metrics.quality.buildSuccessRate)}`,
  );
  console.log(
    `   Security Scan Pass: ${getQualityDisplay(metrics.quality.securityScanPassRate)}`,
  );
  if (showHeader) {
    console.log(chalk.gray('\n💡 Use --watch flag for live updates'));
    console.log(chalk.gray('💡 Use --time-range to change time window'));
  }
}
// Helper display functions
function formatUptime(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) {
    return `${days}d ${hours % 24}h ${minutes % 60}m`;
  } else if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}
function formatDuration(ms) {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}
function getSuccessRateDisplay(rate) {
  const percentage = (rate * 100).toFixed(1);
  if (rate >= 0.95) return chalk.green(`${percentage}%`);
  if (rate >= 0.85) return chalk.yellow(`${percentage}%`);
  return chalk.red(`${percentage}%`);
}
function getUsageDisplay(usage, warningThreshold) {
  if (usage >= warningThreshold) return chalk.red(usage.toFixed(1));
  if (usage >= warningThreshold * 0.8) return chalk.yellow(usage.toFixed(1));
  return chalk.green(usage.toFixed(1));
}
function getUtilizationDisplay(utilization) {
  const percentage = (utilization * 100).toFixed(1);
  if (utilization >= 0.9) return chalk.red(`${percentage}%`);
  if (utilization >= 0.7) return chalk.yellow(`${percentage}%`);
  return chalk.green(`${percentage}%`);
}
function getErrorRateDisplay(rate) {
  const percentage = (rate * 100).toFixed(2);
  if (rate >= 0.1) return chalk.red(`${percentage}%`);
  if (rate >= 0.05) return chalk.yellow(`${percentage}%`);
  return chalk.green(`${percentage}%`);
}
function getQualityDisplay(rate) {
  const percentage = (rate * 100).toFixed(1);
  if (rate >= 0.95) return chalk.green(`${percentage}%`);
  if (rate >= 0.85) return chalk.yellow(`${percentage}%`);
  return chalk.red(`${percentage}%`);
}
function getPriorityColor(priority) {
  const colors = {
    critical: chalk.red.bold,
    high: chalk.red,
    medium: chalk.yellow,
    low: chalk.blue,
    background: chalk.gray,
  };
  return colors[priority] || chalk.white;
}
//# sourceMappingURL=metrics.js.map
