/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import chalk from 'chalk';
import { SessionManager } from '@gemini-cli/core/src/collaboration/SessionManager.js';
import { ParticipantRole } from '@gemini-cli/core/src/collaboration/types.js';

export const joinCommand = {
    command: 'join <sessionId>',
    describe: 'Join an existing collaborative programming session',
    builder: (yargs) => yargs
        .positional('sessionId', {
            describe: 'ID of the session to join',
            type: 'string'
        })
        .option('name', {
            describe: 'Your display name in the session',
            type: 'string',
            alias: 'n'
        })
        .option('role', {
            describe: 'Your role in the collaboration session',
            type: 'string',
            choices: ['DRIVER', 'NAVIGATOR', 'OBSERVER', 'MODERATOR', 'ASYNC_PARTICIPANT'],
            default: 'NAVIGATOR',
            alias: 'r'
        })
        .option('auto-sync', {
            describe: 'Automatically sync with shared context',
            type: 'boolean',
            default: true
        })
        .option('notification-level', {
            describe: 'Level of notifications to receive',
            type: 'string',
            choices: ['ALL', 'IMPORTANT', 'CRITICAL', 'NONE'],
            default: 'IMPORTANT'
        })
        .example('gemini collab join session_123abc', 'Join session with default navigator role')
        .example('gemini collab join session_123abc --name "Alice" --role DRIVER', 'Join as a driver with custom name')
        .example('gemini collab join session_123abc --role OBSERVER --notification-level CRITICAL', 'Join as observer with minimal notifications'),

    handler: async (argv) => {
        try {
            console.log(chalk.cyan(`🔗 Joining collaboration session ${argv.sessionId}...`));

            const sessionManager = new SessionManager();

            // Get participant name (use system username as fallback)
            const participantName = argv.name || await getUserName() || `Participant-${Date.now()}`;

            // Create participant configuration
            const participantConfig = {
                name: participantName,
                role: ParticipantRole[argv.role],
                preferences: {
                    autoSync: argv.autoSync,
                    notificationLevel: argv.notificationLevel,
                    receiveRecordings: true,
                    shareContext: true
                },
                capabilities: {
                    canEdit: argv.role === 'DRIVER' || argv.role === 'NAVIGATOR',
                    canRecord: argv.role !== 'OBSERVER',
                    canModerate: argv.role === 'MODERATOR'
                }
            };

            // Join the session
            const session = await sessionManager.joinSession(
                argv.sessionId,
                participantName,
                participantConfig
            );

            // Display session information
            console.log(chalk.green('✅ Successfully joined the collaboration session!'));
            console.log('');
            console.log(chalk.bold('Session Information:'));
            console.log(`   🆔 Session ID: ${chalk.cyan(session.id)}`);
            console.log(`   📝 Name: ${chalk.white(session.name)}`);
            console.log(`   📋 Type: ${chalk.yellow(session.config.sessionType)}`);
            console.log(`   👤 Your Role: ${chalk.green(argv.role)}`);
            console.log(`   👥 Participants: ${session.participants.length}/${session.config.maxParticipants}`);

            // List other participants
            console.log('');
            console.log(chalk.bold('Current Participants:'));
            session.participants.forEach(participant => {
                const roleColor = participant.role === 'DRIVER' ? chalk.green :
                                participant.role === 'MODERATOR' ? chalk.blue :
                                participant.role === 'NAVIGATOR' ? chalk.yellow :
                                chalk.gray;

                const statusIcon = participant.status === 'ACTIVE' ? '🟢' : '🟡';
                console.log(`   ${statusIcon} ${chalk.white(participant.name)} - ${roleColor(participant.role)}`);
            });

            // Show session status and activity
            if (session.sharedContext.items.size > 0) {
                console.log('');
                console.log(chalk.bold('Shared Context:'));
                console.log(`   📄 Shared Items: ${session.sharedContext.items.size}`);
                console.log(`   🔄 Last Sync: ${session.sharedContext.syncState.lastSync.toLocaleTimeString()}`);
            }

            if (session.activeConflicts.length > 0) {
                console.log('');
                console.log(chalk.bold(chalk.yellow('⚠️  Active Conflicts:')));
                console.log(`   🔄 Unresolved: ${session.activeConflicts.length}`);
                console.log(chalk.gray('   Use "gemini collab status" for details'));
            }

            // Show available commands
            console.log('');
            console.log(chalk.bold('Available Commands:'));
            console.log(chalk.gray('• ') + chalk.cyan('gemini collab status') + chalk.gray(' - View session status'));
            console.log(chalk.gray('• ') + chalk.cyan('gemini collab share context <file>') + chalk.gray(' - Share a file'));
            console.log(chalk.gray('• ') + chalk.cyan('gemini collab record start') + chalk.gray(' - Start recording'));
            console.log(chalk.gray('• ') + chalk.cyan('gemini collab leave') + chalk.gray(' - Leave the session'));

            // Store session information locally
            await storeLocalSessionInfo(session.id, {
                id: session.id,
                name: session.name,
                role: ParticipantRole[argv.role],
                participantName,
                joinedAt: new Date(),
                isActive: true
            });

            console.log(chalk.green('\n🎉 Ready to collaborate!'));

        } catch (error) {
            console.error(chalk.red('❌ Failed to join collaboration session:'));
            console.error(chalk.red(error instanceof Error ? error.message : String(error)));

            // Provide helpful suggestions based on error type
            if (error.message.includes('not found')) {
                console.log(chalk.yellow('\n💡 Troubleshooting:'));
                console.log(chalk.gray('• Verify the session ID is correct'));
                console.log(chalk.gray('• Check that the session is still active'));
                console.log(chalk.gray('• Use "gemini collab list" to see available sessions'));
            } else if (error.message.includes('full') || error.message.includes('capacity')) {
                console.log(chalk.yellow('\n💡 The session might be at full capacity'));
                console.log(chalk.gray('• Contact the session host to increase capacity'));
                console.log(chalk.gray('• Try joining as an observer if available'));
            } else {
                console.log(chalk.yellow('\n💡 General troubleshooting:'));
                console.log(chalk.gray('• Check your network connection'));
                console.log(chalk.gray('• Verify you have proper permissions'));
                console.log(chalk.gray('• Contact the session host for assistance'));
            }

            process.exit(1);
        }
    },
};

/**
 * Get the current user's name from system or environment
 */
async function getUserName() {
    try {
        const os = await import('node:os');
        return os.userInfo().username;
    } catch (error) {
        return process.env.USER || process.env.USERNAME || null;
    }
}

/**
 * Store session information locally for CLI state management
 */
async function storeLocalSessionInfo(sessionId, sessionInfo) {
    try {
        const fs = await import('node:fs/promises');
        const path = await import('node:path');

        const stateDir = path.join(process.cwd(), '.gemini-cli');
        const sessionFile = path.join(stateDir, 'active-session.json');

        // Ensure state directory exists
        await fs.mkdir(stateDir, { recursive: true });

        // Store session information
        await fs.writeFile(sessionFile, JSON.stringify(sessionInfo, null, 2));

    } catch (error) {
        console.warn(chalk.yellow('⚠️  Warning: Could not store session state locally'));
        console.warn(chalk.gray(`   Reason: ${error.message}`));
    }
}