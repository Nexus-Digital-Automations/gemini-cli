/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import chalk from 'chalk';
import { SystemInitializer } from '@google/gemini-cli-core/autonomous-tasks/SystemInitializer.js';
import { getConfig } from '../../core/initializer.js';
export const startCommand = {
    command: 'start',
    describe: 'Start the autonomous task management system',
    builder: (yargs) => yargs
        .option('config', {
        type: 'string',
        describe: 'Path to system configuration file',
        alias: 'c',
    })
        .option('max-agents', {
        type: 'number',
        describe: 'Maximum number of concurrent agents',
        default: 10,
        alias: 'm',
    })
        .option('enable-metrics', {
        type: 'boolean',
        describe: 'Enable performance metrics collection',
        default: true,
    })
        .option('enable-persistence', {
        type: 'boolean',
        describe: 'Enable task persistence across sessions',
        default: true,
    })
        .option('verbose', {
        type: 'boolean',
        describe: 'Enable verbose logging',
        default: false,
        alias: 'v',
    })
        .example('gemini autonomous start', 'Start with default configuration')
        .example('gemini autonomous start --max-agents 15 --verbose', 'Start with 15 max agents and verbose logging')
        .example('gemini autonomous start --config ./custom.json', 'Start with custom configuration file'),
    handler: async (argv) => {
        try {
            console.log(chalk.cyan('🚀 Starting Autonomous Task Management System...'));
            const config = await getConfig();
            // Initialize the autonomous system
            const systemConfig = {
                persistenceConfig: {
                    type: 'file',
                    path: './data/autonomous-tasks.json'
                },
                logging: {
                    level: argv.verbose ? 'debug' : 'info',
                    output: 'console'
                },
                agentConfig: {
                    maxConcurrentAgents: argv.maxAgents || 10,
                    heartbeatInterval: 30000, // 30 seconds
                    sessionTimeout: 300000 // 5 minutes
                },
                qualityConfig: {
                    enableLinting: true,
                    enableTesting: true,
                    enableSecurity: true,
                    enablePerformance: true
                },
                featureConfig: {
                    featuresFilePath: './FEATURES.json',
                    requireApproval: true,
                    autoRejectTimeout: 604800000 // 7 days
                },
                monitoring: {
                    enableMetrics: argv.enableMetrics ?? true,
                    metricsInterval: 60000, // 1 minute
                    alertThresholds: {
                        taskQueueSize: 100,
                        avgExecutionTime: 300000, // 5 minutes
                        failureRate: 0.1 // 10%
                    }
                }
            };
            const systemInitializer = new SystemInitializer(config, systemConfig);
            // Start the system
            await systemInitializer.initialize();
            console.log(chalk.green('✅ Autonomous Task Management System started successfully!'));
            console.log(chalk.blue('📊 System Status:'));
            console.log(`   • Max Concurrent Agents: ${argv.maxAgents || 10}`);
            console.log(`   • Metrics Collection: ${argv.enableMetrics ? 'Enabled' : 'Disabled'}`);
            console.log(`   • Task Persistence: ${argv.enablePersistence ? 'Enabled' : 'Disabled'}`);
            console.log(`   • Logging Level: ${argv.verbose ? 'Debug' : 'Info'}`);
            console.log(chalk.yellow('\n💡 Next steps:'));
            console.log('   • Check system status: gemini autonomous status');
            console.log('   • Add tasks: gemini autonomous tasks add "Your task description"');
            console.log('   • Monitor metrics: gemini autonomous metrics');
            // Keep the process running
            process.on('SIGINT', async () => {
                console.log(chalk.yellow('\n⏹️  Shutting down autonomous system...'));
                await systemInitializer.shutdown();
                console.log(chalk.green('✅ Autonomous system stopped gracefully'));
                process.exit(0);
            });
            process.on('SIGTERM', async () => {
                await systemInitializer.shutdown();
                process.exit(0);
            });
        }
        catch (error) {
            console.error(chalk.red('❌ Failed to start autonomous system:'));
            console.error(chalk.red(error instanceof Error ? error.message : String(error)));
            process.exit(1);
        }
    },
};
//# sourceMappingURL=start.js.map