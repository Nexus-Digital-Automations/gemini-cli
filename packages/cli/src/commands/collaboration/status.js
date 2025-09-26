/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import chalk from 'chalk';
import { SessionManager } from '@gemini-cli/core/src/collaboration/SessionManager.js';

export const statusCommand = {
    command: 'status [sessionId]',
    describe: 'Show status of current or specified collaboration session',
    builder: (yargs) => yargs
        .positional('sessionId', {
            describe: 'ID of specific session to check (uses current session if not provided)',
            type: 'string'
        })
        .option('json', {
            describe: 'Output status in JSON format',
            type: 'boolean',
            default: false,
            alias: 'j'
        })
        .option('watch', {
            describe: 'Watch status and refresh periodically',
            type: 'boolean',
            default: false,
            alias: 'w'
        })
        .option('interval', {
            describe: 'Refresh interval in seconds (with --watch)',
            type: 'number',
            default: 5,
            alias: 'i'
        })
        .option('detailed', {
            describe: 'Show detailed information including conflicts and context',
            type: 'boolean',
            default: false,
            alias: 'd'
        })
        .example('gemini collab status', 'Show current session status')
        .example('gemini collab status session_123', 'Show specific session status')
        .example('gemini collab status --watch --interval 3', 'Watch status with 3s updates')
        .example('gemini collab status --detailed --json', 'Detailed status in JSON format'),

    handler: async (argv) => {
        try {
            if (argv.watch) {
                await watchSessionStatus(argv);
                return;
            }

            const sessionManager = new SessionManager();
            let targetSessionId = argv.sessionId;

            // If no session ID provided, try to get current session
            if (!targetSessionId) {
                targetSessionId = await getCurrentSessionId();
                if (!targetSessionId) {
                    console.log(chalk.yellow('ℹ️  No active collaboration session'));
                    console.log(chalk.gray('• Create a session: ') + chalk.cyan('gemini collab create <name>'));
                    console.log(chalk.gray('• Join a session: ') + chalk.cyan('gemini collab join <sessionId>'));
                    console.log(chalk.gray('• List sessions: ') + chalk.cyan('gemini collab list'));
                    return;
                }
            }

            // Get session status
            const session = await sessionManager.getSession(targetSessionId);
            const sessionStatus = await sessionManager.getSessionStatus(targetSessionId);

            if (argv.json) {
                const jsonOutput = {
                    session,
                    status: sessionStatus,
                    timestamp: new Date().toISOString()
                };
                console.log(JSON.stringify(jsonOutput, null, 2));
                return;
            }

            // Display formatted status
            displaySessionStatus(session, sessionStatus, argv.detailed);

        } catch (error) {
            console.error(chalk.red('❌ Failed to get session status:'));
            console.error(chalk.red(error instanceof Error ? error.message : String(error)));

            if (error.message.includes('not found')) {
                console.log(chalk.yellow('\n💡 The session may no longer exist or be accessible'));
                console.log(chalk.gray('• Use "gemini collab list" to see available sessions'));
                console.log(chalk.gray('• Check if you\'re still connected to the collaboration network'));
            }

            process.exit(1);
        }
    },
};

/**
 * Watch session status with periodic updates
 */
async function watchSessionStatus(argv) {
    console.log(chalk.cyan('👁️  Collaboration Session Status - Live View'));
    console.log(chalk.gray(`Refreshing every ${argv.interval}s (Press Ctrl+C to exit)`));
    console.log(chalk.gray('─'.repeat(60)));

    const displayStatus = async () => {
        try {
            process.stdout.write('\x1B[H\x1B[2J'); // Clear screen
            console.log(chalk.cyan('👁️  Collaboration Session Status - Live View'));
            console.log(chalk.gray(`Refreshing every ${argv.interval}s (Press Ctrl+C to exit)`));
            console.log(chalk.gray('─'.repeat(60)));

            const sessionManager = new SessionManager();
            let targetSessionId = argv.sessionId || await getCurrentSessionId();

            if (!targetSessionId) {
                console.log(chalk.yellow('ℹ️  No active collaboration session'));
                return;
            }

            const session = await sessionManager.getSession(targetSessionId);
            const sessionStatus = await sessionManager.getSessionStatus(targetSessionId);

            displaySessionStatus(session, sessionStatus, argv.detailed);

        } catch (error) {
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
}

/**
 * Display formatted session status
 */
function displaySessionStatus(session, sessionStatus, detailed = false) {
    console.log(chalk.bold('📊 Collaboration Session Status'));
    console.log(chalk.gray('─'.repeat(50)));

    // Basic session info
    const statusIcon = session.status === 'ACTIVE' ? '🟢' : session.status === 'PAUSED' ? '🟡' : '🔴';
    const statusColor = session.status === 'ACTIVE' ? chalk.green :
                       session.status === 'PAUSED' ? chalk.yellow : chalk.red;

    console.log(chalk.bold('Session Details:'));
    console.log(`   🆔 Session ID: ${chalk.cyan(session.id)}`);
    console.log(`   📝 Name: ${chalk.white(session.name)}`);
    console.log(`   ${statusIcon} Status: ${statusColor(session.status)}`);
    console.log(`   📋 Type: ${chalk.yellow(session.config.sessionType)}`);
    console.log(`   🕒 Created: ${session.createdAt.toLocaleString()}`);
    console.log(`   ⏱️  Last Activity: ${session.lastActivity.toLocaleString()}`);

    // Participants
    console.log(chalk.bold('\nParticipants:'));
    console.log(`   👥 Count: ${session.participants.length}/${session.config.maxParticipants}`);

    session.participants.forEach(participant => {
        const roleColor = participant.role === 'DRIVER' ? chalk.green :
                         participant.role === 'MODERATOR' ? chalk.blue :
                         participant.role === 'NAVIGATOR' ? chalk.yellow :
                         chalk.gray;

        const statusIcon = participant.status === 'ACTIVE' ? '🟢' :
                          participant.status === 'IDLE' ? '🟡' : '🔴';

        const isHost = participant.id === session.host.id ? ' 👑' : '';
        console.log(`   ${statusIcon} ${chalk.white(participant.name)} - ${roleColor(participant.role)}${isHost}`);
    });

    // Context sharing
    console.log(chalk.bold('\nShared Context:'));
    console.log(`   📄 Items: ${session.sharedContext.items.size}`);
    console.log(`   🔄 Last Sync: ${session.sharedContext.syncState.lastSync.toLocaleTimeString()}`);
    if (session.sharedContext.syncState.isSyncing) {
        console.log(`   ⏳ Currently syncing...`);
    }

    // Conflicts
    if (session.activeConflicts.length > 0) {
        console.log(chalk.bold(chalk.yellow('\n⚠️  Active Conflicts:')));
        console.log(`   🔄 Unresolved: ${session.activeConflicts.length}`);

        if (detailed) {
            session.activeConflicts.slice(0, 3).forEach(conflict => {
                console.log(`   • ${chalk.yellow(conflict.type)} - ${conflict.participants.join(', ')}`);
            });
            if (session.activeConflicts.length > 3) {
                console.log(`   ... and ${session.activeConflicts.length - 3} more`);
            }
        }
    } else {
        console.log(chalk.bold(chalk.green('\n✅ No Active Conflicts')));
    }

    // Recording status
    if (session.config.recording?.enabled) {
        console.log(chalk.bold('\n📹 Recording:'));
        console.log(`   🔴 Status: ${chalk.green('ACTIVE')}`);

        if (detailed && sessionStatus.recordingStats) {
            console.log(`   📊 Events Recorded: ${sessionStatus.recordingStats.eventCount}`);
            console.log(`   ⏱️  Duration: ${formatDuration(sessionStatus.recordingStats.durationMs)}`);
        }
    }

    // Performance metrics
    if (detailed && sessionStatus.performance) {
        console.log(chalk.bold('\n⚡ Performance:'));
        console.log(`   🔄 Sync Latency: ${sessionStatus.performance.avgSyncLatency}ms`);
        console.log(`   📡 Network RTT: ${sessionStatus.performance.networkLatency}ms`);
        console.log(`   💾 Memory Usage: ${Math.round(sessionStatus.performance.memoryUsage / 1024 / 1024)}MB`);
    }

    // Quick actions
    console.log(chalk.bold('\n🚀 Quick Actions:'));
    console.log(chalk.gray('• ') + chalk.cyan('gemini collab share context <file>') + chalk.gray(' - Share a file'));

    if (session.activeConflicts.length > 0) {
        console.log(chalk.gray('• ') + chalk.cyan('gemini collab resolve --auto') + chalk.gray(' - Auto-resolve conflicts'));
    }

    if (!session.config.recording?.enabled) {
        console.log(chalk.gray('• ') + chalk.cyan('gemini collab record start') + chalk.gray(' - Start recording'));
    }

    console.log(chalk.gray('• ') + chalk.cyan('gemini collab leave') + chalk.gray(' - Leave session'));
}

/**
 * Get the current active session ID from local state
 */
async function getCurrentSessionId() {
    try {
        const fs = await import('node:fs/promises');
        const path = await import('node:path');

        const sessionFile = path.join(process.cwd(), '.gemini-cli', 'active-session.json');
        const sessionData = await fs.readFile(sessionFile, 'utf-8');
        const sessionInfo = JSON.parse(sessionData);

        return sessionInfo.isActive ? sessionInfo.id : null;
    } catch (error) {
        return null;
    }
}

/**
 * Format duration in milliseconds to human-readable string
 */
function formatDuration(durationMs) {
    const seconds = Math.floor(durationMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
        return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
        return `${minutes}m ${seconds % 60}s`;
    } else {
        return `${seconds}s`;
    }
}