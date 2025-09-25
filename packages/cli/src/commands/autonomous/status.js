/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import chalk from 'chalk';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
export const statusCommand = {
    command: 'status',
    describe: 'Show autonomous system status and metrics',
    builder: (yargs) => yargs
        .option('json', {
        type: 'boolean',
        describe: 'Output status in JSON format',
        default: false,
    })
        .option('watch', {
        type: 'boolean',
        describe: 'Watch status and refresh periodically',
        default: false,
        alias: 'w',
    })
        .option('interval', {
        type: 'number',
        describe: 'Refresh interval in seconds (with --watch)',
        default: 5,
        alias: 'i',
    })
        .example('gemini autonomous status', 'Show current system status')
        .example('gemini autonomous status --json', 'Output status as JSON')
        .example('gemini autonomous status --watch', 'Watch status with live updates'),
    handler: async (argv) => {
        try {
            if (argv.watch) {
                // Clear screen and setup watch mode
                process.stdout.write('\x1Bc');
                console.log(chalk.cyan('📊 Autonomous System Status - Live View'));
                console.log(chalk.gray(`Refreshing every ${argv.interval}s (Press Ctrl+C to exit)`));
                console.log(chalk.gray('─'.repeat(60)));
                const displayStatus = async () => {
                    try {
                        process.stdout.write('\x1B[H\x1B[2J'); // Clear screen
                        console.log(chalk.cyan('📊 Autonomous System Status - Live View'));
                        console.log(chalk.gray(`Refreshing every ${argv.interval}s (Press Ctrl+C to exit)`));
                        console.log(chalk.gray('─'.repeat(60)));
                        const status = await getSystemStatus();
                        displaySystemStatus(status, false);
                    }
                    catch (error) {
                        console.error(chalk.red('Error fetching status:'), error);
                    }
                };
                // Initial display
                await displayStatus();
                // Setup interval
                const intervalId = setInterval(displayStatus, (argv.interval || 5) * 1000);
                // Handle Ctrl+C
                process.on('SIGINT', () => {
                    clearInterval(intervalId);
                    console.log(chalk.yellow('\n👋 Status monitoring stopped'));
                    process.exit(0);
                });
                return;
            }
            const status = await getSystemStatus();
            if (argv.json) {
                console.log(JSON.stringify(status, null, 2));
            }
            else {
                displaySystemStatus(status, true);
            }
        }
        catch (error) {
            console.error(chalk.red('❌ Failed to get system status:'));
            console.error(chalk.red(error instanceof Error ? error.message : String(error)));
            process.exit(1);
        }
    },
};
async function getSystemStatus() {
    const status = {
        isRunning: false,
        activeAgents: 0,
        queuedTasks: 0,
        runningTasks: 0,
        completedTasks: 0,
        failedTasks: 0,
        systemHealth: 'critical'
    };
    // Check if system is running via PID file
    const pidFile = path.join(process.cwd(), '.autonomous-system.pid');
    try {
        const pidContent = await fs.readFile(pidFile, 'utf-8');
        const systemPid = parseInt(pidContent.trim(), 10);
        // Verify process is still running
        try {
            process.kill(systemPid, 0);
            status.isRunning = true;
            status.pid = systemPid;
            status.systemHealth = 'healthy';
        }
        catch (error) {
            // Process not running, clean up stale PID file
            await fs.unlink(pidFile).catch(() => { });
        }
    }
    catch (error) {
        // No PID file exists
    }
    // Try to read system state file
    const stateFile = path.join(process.cwd(), '.autonomous-system.state');
    try {
        const stateContent = await fs.readFile(stateFile, 'utf-8');
        const systemState = JSON.parse(stateContent);
        status.startTime = systemState.startTime;
        status.activeAgents = systemState.activeAgents || 0;
        status.queuedTasks = systemState.queuedTasks || 0;
        status.runningTasks = systemState.runningTasks || 0;
        status.completedTasks = systemState.completedTasks || 0;
        status.failedTasks = systemState.failedTasks || 0;
        status.lastHeartbeat = systemState.lastHeartbeat;
        status.memoryUsage = systemState.memoryUsage;
        status.cpuUsage = systemState.cpuUsage;
        if (status.startTime) {
            status.uptime = Date.now() - new Date(status.startTime).getTime();
        }
        // Determine system health
        if (status.isRunning) {
            const totalTasks = status.completedTasks + status.failedTasks;
            const failureRate = totalTasks > 0 ? status.failedTasks / totalTasks : 0;
            if (failureRate > 0.5) {
                status.systemHealth = 'critical';
            }
            else if (failureRate > 0.2 || status.queuedTasks > 100) {
                status.systemHealth = 'degraded';
            }
            else {
                status.systemHealth = 'healthy';
            }
        }
    }
    catch (error) {
        // No state file or invalid JSON
    }
    return status;
}
function displaySystemStatus(status, showHeader) {
    if (showHeader) {
        console.log(chalk.cyan('📊 Autonomous Task Management System Status'));
        console.log(chalk.gray('─'.repeat(50)));
    }
    // System Status
    const systemIcon = status.isRunning ? '🟢' : '🔴';
    const systemText = status.isRunning ? 'Running' : 'Stopped';
    const systemColor = status.isRunning ? chalk.green : chalk.red;
    console.log(chalk.bold('System Status:'));
    console.log(`   ${systemIcon} Status: ${systemColor(systemText)}`);
    if (status.isRunning && status.pid) {
        console.log(`   🆔 Process ID: ${status.pid}`);
    }
    if (status.uptime) {
        const uptimeStr = formatUptime(status.uptime);
        console.log(`   ⏱️  Uptime: ${uptimeStr}`);
    }
    if (status.startTime) {
        console.log(`   🚀 Started: ${new Date(status.startTime).toLocaleString()}`);
    }
    // Health Status
    console.log(chalk.bold('\nHealth Status:'));
    const healthIcon = {
        healthy: '🟢',
        degraded: '🟡',
        critical: '🔴'
    }[status.systemHealth];
    const healthColor = {
        healthy: chalk.green,
        degraded: chalk.yellow,
        critical: chalk.red
    }[status.systemHealth];
    console.log(`   ${healthIcon} System Health: ${healthColor(status.systemHealth.toUpperCase())}`);
    if (status.lastHeartbeat) {
        const heartbeatTime = new Date(status.lastHeartbeat).toLocaleTimeString();
        console.log(`   💓 Last Heartbeat: ${heartbeatTime}`);
    }
    // Task Statistics
    console.log(chalk.bold('\nTask Queue Status:'));
    console.log(`   📋 Queued: ${chalk.blue(status.queuedTasks)}`);
    console.log(`   🔄 Running: ${chalk.yellow(status.runningTasks)}`);
    console.log(`   ✅ Completed: ${chalk.green(status.completedTasks)}`);
    console.log(`   ❌ Failed: ${chalk.red(status.failedTasks)}`);
    // Agent Status
    console.log(chalk.bold('\nAgent Status:'));
    console.log(`   🤖 Active Agents: ${chalk.cyan(status.activeAgents)}`);
    // Resource Usage (if available)
    if (status.memoryUsage) {
        console.log(chalk.bold('\nResource Usage:'));
        const memoryMB = Math.round(status.memoryUsage.rss / 1024 / 1024);
        const heapMB = Math.round(status.memoryUsage.heapUsed / 1024 / 1024);
        console.log(`   🧠 Memory: ${memoryMB}MB RSS, ${heapMB}MB Heap`);
    }
    // System Recommendations
    if (!status.isRunning) {
        console.log(chalk.bold(chalk.yellow('\n💡 Recommendations:')));
        console.log(chalk.yellow('   • Start the system: gemini autonomous start'));
    }
    else if (status.systemHealth === 'degraded' || status.systemHealth === 'critical') {
        console.log(chalk.bold(chalk.yellow('\n⚠️  Issues Detected:')));
        if (status.failedTasks / Math.max(1, status.completedTasks + status.failedTasks) > 0.2) {
            console.log(chalk.yellow('   • High task failure rate detected'));
            console.log(chalk.yellow('   • Check system logs and task configurations'));
        }
        if (status.queuedTasks > 100) {
            console.log(chalk.yellow('   • Task queue is growing large'));
            console.log(chalk.yellow('   • Consider increasing max concurrent agents'));
        }
    }
    else {
        console.log(chalk.bold(chalk.green('\n✨ System Status:')));
        console.log(chalk.green('   • All systems operating normally'));
        console.log(chalk.green('   • Ready for new tasks'));
    }
    if (showHeader) {
        console.log(chalk.gray('\n💡 Use --watch flag for live updates'));
        console.log(chalk.gray('💡 Use --json flag for machine-readable output'));
    }
}
function formatUptime(uptimeMs) {
    const seconds = Math.floor(uptimeMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    if (days > 0) {
        return `${days}d ${hours % 24}h ${minutes % 60}m`;
    }
    else if (hours > 0) {
        return `${hours}h ${minutes % 60}m`;
    }
    else if (minutes > 0) {
        return `${minutes}m ${seconds % 60}s`;
    }
    else {
        return `${seconds}s`;
    }
}
//# sourceMappingURL=status.js.map