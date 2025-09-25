/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import chalk from 'chalk';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
export const stopCommand = {
    command: 'stop',
    describe: 'Stop the autonomous task management system',
    builder: (yargs) => yargs
        .option('force', {
        type: 'boolean',
        describe: 'Force stop without waiting for tasks to complete',
        default: false,
        alias: 'f',
    })
        .option('timeout', {
        type: 'number',
        describe: 'Timeout in seconds to wait for graceful shutdown',
        default: 30,
        alias: 't',
    })
        .option('save-state', {
        type: 'boolean',
        describe: 'Save current system state before stopping',
        default: true,
    })
        .example('gemini autonomous stop', 'Stop gracefully with default timeout')
        .example('gemini autonomous stop --force', 'Force immediate stop')
        .example('gemini autonomous stop --timeout 60', 'Wait up to 60 seconds for graceful stop'),
    handler: async (argv) => {
        try {
            console.log(chalk.cyan('⏹️  Stopping Autonomous Task Management System...'));
            // Check if system is running
            const pidFile = path.join(process.cwd(), '.autonomous-system.pid');
            try {
                const pidContent = await fs.readFile(pidFile, 'utf-8');
                const systemPid = parseInt(pidContent.trim(), 10);
                // Check if process is still running
                try {
                    process.kill(systemPid, 0); // Test signal - doesn't actually kill
                    console.log(chalk.blue('📡 System found running, initiating shutdown...'));
                }
                catch {
                    console.log(chalk.yellow('⚠️  No running system found (stale PID file removed)'));
                    await fs.unlink(pidFile).catch(() => { });
                    return;
                }
                if (argv.force) {
                    console.log(chalk.red('💀 Force stopping system...'));
                    try {
                        process.kill(systemPid, 'SIGKILL');
                        await fs.unlink(pidFile).catch(() => { });
                        console.log(chalk.green('✅ System force stopped'));
                    }
                    catch {
                        console.log(chalk.yellow('⚠️  Process already terminated'));
                    }
                    return;
                }
                // Graceful shutdown
                console.log(chalk.blue('🔄 Initiating graceful shutdown...'));
                if (argv['save-state']) {
                    console.log(chalk.blue('💾 Saving system state...'));
                    // Signal system to save state
                    process.kill(systemPid, 'SIGUSR1');
                    // Wait a moment for state saving
                    await new Promise((resolve) => setTimeout(resolve, 2000));
                }
                // Send SIGTERM for graceful shutdown
                process.kill(systemPid, 'SIGTERM');
                // Wait for graceful shutdown with timeout
                const timeoutMs = (argv.timeout || 30) * 1000;
                const startTime = Date.now();
                console.log(chalk.blue(`⏳ Waiting for graceful shutdown (timeout: ${argv.timeout}s)...`));
                while (Date.now() - startTime < timeoutMs) {
                    try {
                        process.kill(systemPid, 0);
                        await new Promise((resolve) => setTimeout(resolve, 1000));
                    }
                    catch {
                        // Process has terminated
                        await fs.unlink(pidFile).catch(() => { });
                        console.log(chalk.green('✅ System stopped gracefully'));
                        return;
                    }
                }
                // Timeout reached, force kill
                console.log(chalk.yellow('⚠️  Graceful shutdown timeout, force stopping...'));
                try {
                    process.kill(systemPid, 'SIGKILL');
                    await fs.unlink(pidFile).catch(() => { });
                    console.log(chalk.green('✅ System stopped (forced after timeout)'));
                }
                catch {
                    console.log(chalk.green('✅ System stopped'));
                }
            }
            catch {
                console.log(chalk.yellow('⚠️  No autonomous system PID file found'));
                // Try to find and stop any running autonomous processes
                const { spawn } = await import('node:child_process');
                const ps = spawn('ps', ['aux']);
                let psOutput = '';
                ps.stdout.on('data', (data) => {
                    psOutput += data.toString();
                });
                ps.on('close', () => {
                    const lines = psOutput.split('\n');
                    const autonomousProcesses = lines.filter((line) => line.includes('autonomous') &&
                        line.includes('node') &&
                        !line.includes('grep'));
                    if (autonomousProcesses.length === 0) {
                        console.log(chalk.green('✅ No autonomous processes found running'));
                        return;
                    }
                    console.log(chalk.blue(`📋 Found ${autonomousProcesses.length} autonomous processes`));
                    autonomousProcesses.forEach((process, index) => {
                        const pid = process.trim().split(/\s+/)[1];
                        console.log(chalk.blue(`   ${index + 1}. PID ${pid}`));
                    });
                    if (argv.force) {
                        console.log(chalk.red('💀 Force stopping all autonomous processes...'));
                        autonomousProcesses.forEach((processLine) => {
                            const pid = parseInt(processLine.trim().split(/\s+/)[1], 10);
                            try {
                                process.kill(pid, 'SIGKILL');
                                console.log(chalk.green(`✅ Stopped process ${pid}`));
                            }
                            catch {
                                console.log(chalk.yellow(`⚠️  Could not stop process ${pid}`));
                            }
                        });
                    }
                });
            }
            // Clean up any residual state files
            const stateFiles = [
                '.autonomous-system.pid',
                '.autonomous-system.state',
                'data/autonomous-tasks.json.lock',
            ];
            for (const file of stateFiles) {
                try {
                    await fs.unlink(path.join(process.cwd(), file));
                }
                catch {
                    // Ignore if file doesn't exist
                }
            }
            console.log(chalk.green('🧹 Cleanup completed'));
        }
        catch {
            console.error(chalk.red('❌ Failed to stop autonomous system:'));
            console.error(chalk.red(error instanceof Error ? error.message : String(error)));
            process.exit(1);
        }
    },
};
//# sourceMappingURL=stop.js.map