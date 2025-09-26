/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import chalk from 'chalk';
import { SessionManager } from '@gemini-cli/core/src/collaboration/SessionManager.js';

export const leaveCommand = {
    command: 'leave [sessionId]',
    describe: 'Leave current or specified collaboration session',
    builder: (yargs) => yargs
        .positional('sessionId', {
            describe: 'ID of specific session to leave (uses current session if not provided)',
            type: 'string'
        })
        .option('reason', {
            describe: 'Optional reason for leaving the session',
            type: 'string',
            alias: 'r'
        })
        .option('transfer-role', {
            describe: 'Transfer your role to another participant (by name or ID)',
            type: 'string',
            alias: 't'
        })
        .option('force', {
            describe: 'Force leave even if you are the session host',
            type: 'boolean',
            default: false,
            alias: 'f'
        })
        .option('save-context', {
            describe: 'Save your shared context before leaving',
            type: 'boolean',
            default: true
        })
        .example('gemini collab leave', 'Leave current collaboration session')
        .example('gemini collab leave --reason "Meeting ended"', 'Leave with a reason')
        .example('gemini collab leave --transfer-role Alice', 'Leave and transfer role to Alice')
        .example('gemini collab leave --force', 'Force leave as session host'),

    handler: async (argv) => {
        try {
            const sessionManager = new SessionManager();
            let targetSessionId = argv.sessionId;

            // If no session ID provided, get current session
            if (!targetSessionId) {
                targetSessionId = await getCurrentSessionId();
                if (!targetSessionId) {
                    console.log(chalk.yellow('ℹ️  No active collaboration session to leave'));
                    console.log(chalk.gray('• Use "gemini collab status" to check your session status'));
                    return;
                }
            }

            // Get current session and participant info
            const session = await sessionManager.getSession(targetSessionId);
            const currentParticipant = await getCurrentParticipantInfo();

            if (!currentParticipant) {
                console.error(chalk.red('❌ Could not determine your participant information'));
                process.exit(1);
            }

            console.log(chalk.cyan(`👋 Leaving collaboration session "${session.name}"...`));

            // Check if user is the host
            const isHost = session.host.id === currentParticipant.id;
            if (isHost && !argv.force) {
                console.log(chalk.yellow('⚠️  You are the session host!'));
                console.log(chalk.gray('Leaving as host will:'));
                console.log(chalk.gray('• Transfer host privileges to another participant'));
                console.log(chalk.gray('• End the session if no other participants remain'));
                console.log('');

                // Ask for confirmation or suggest alternatives
                const hasOtherParticipants = session.participants.length > 1;
                if (hasOtherParticipants) {
                    console.log(chalk.blue('💡 Consider transferring your role first:'));
                    session.participants
                        .filter(p => p.id !== currentParticipant.id)
                        .forEach(p => {
                            console.log(chalk.gray(`   • --transfer-role ${p.name}`));
                        });
                    console.log('');
                    console.log(chalk.gray('Or use --force to leave immediately'));
                    return;
                } else {
                    console.log(chalk.yellow('⚠️  You are the only participant. Leaving will end the session.'));
                    console.log(chalk.gray('Use --force to confirm and end the session'));
                    return;
                }
            }

            // Handle role transfer if specified
            if (argv.transferRole) {
                const targetParticipant = session.participants.find(
                    p => p.name === argv.transferRole || p.id === argv.transferRole
                );

                if (!targetParticipant) {
                    console.error(chalk.red(`❌ Participant "${argv.transferRole}" not found in session`));
                    console.log(chalk.gray('Available participants:'));
                    session.participants
                        .filter(p => p.id !== currentParticipant.id)
                        .forEach(p => console.log(chalk.gray(`   • ${p.name} (${p.role})`)));
                    process.exit(1);
                }

                console.log(chalk.blue(`🔄 Transferring role to ${targetParticipant.name}...`));
                await sessionManager.transferRole(
                    targetSessionId,
                    currentParticipant.id,
                    targetParticipant.id,
                    currentParticipant.role
                );
            }

            // Save context if requested
            if (argv.saveContext && session.sharedContext.items.size > 0) {
                console.log(chalk.blue('💾 Saving shared context...'));
                await saveContextBeforeLeaving(targetSessionId, currentParticipant);
            }

            // Leave the session
            await sessionManager.leaveSession(
                targetSessionId,
                currentParticipant.id,
                argv.reason || 'Session ended'
            );

            // Clean up local session state
            await clearLocalSessionInfo();

            // Display farewell message
            console.log(chalk.green('✅ Successfully left the collaboration session'));
            console.log('');
            console.log(chalk.bold('Session Summary:'));
            console.log(`   📝 Session: ${chalk.white(session.name)}`);
            console.log(`   ⏱️  Duration: ${formatDuration(Date.now() - session.createdAt.getTime())}`);
            console.log(`   👥 Final participant count: ${session.participants.length - 1}`);

            if (argv.reason) {
                console.log(`   💬 Reason: ${chalk.gray(argv.reason)}`);
            }

            if (session.sharedContext.items.size > 0) {
                console.log(`   📄 Context items shared: ${session.sharedContext.items.size}`);
            }

            console.log('');
            console.log(chalk.bold('Next Steps:'));
            console.log(chalk.gray('• Create a new session: ') + chalk.cyan('gemini collab create <name>'));
            console.log(chalk.gray('• Join another session: ') + chalk.cyan('gemini collab join <sessionId>'));
            console.log(chalk.gray('• List available sessions: ') + chalk.cyan('gemini collab list'));

            // Show any recordings available
            const recordings = await getSessionRecordings(targetSessionId);
            if (recordings.length > 0) {
                console.log('');
                console.log(chalk.bold('📹 Available Recordings:'));
                recordings.forEach(recording => {
                    console.log(`   • ${recording.id} - ${formatDuration(recording.duration)}`);
                });
                console.log(chalk.gray('• Play back with: ') + chalk.cyan('gemini collab playback <recordingId>'));
            }

            console.log(chalk.green('\n👋 Thanks for collaborating!'));

        } catch (error) {
            console.error(chalk.red('❌ Failed to leave collaboration session:'));
            console.error(chalk.red(error instanceof Error ? error.message : String(error)));

            if (error.message.includes('not found')) {
                console.log(chalk.yellow('\n💡 The session may have already ended'));
                console.log(chalk.gray('• Clean up local state with: ') + chalk.cyan('rm -f .gemini-cli/active-session.json'));
            }

            process.exit(1);
        }
    },
};

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
 * Get current participant information
 */
async function getCurrentParticipantInfo() {
    try {
        const fs = await import('node:fs/promises');
        const path = await import('node:path');

        const sessionFile = path.join(process.cwd(), '.gemini-cli', 'active-session.json');
        const sessionData = await fs.readFile(sessionFile, 'utf-8');
        const sessionInfo = JSON.parse(sessionData);

        return {
            id: sessionInfo.participantName || 'unknown',
            name: sessionInfo.participantName,
            role: sessionInfo.role
        };
    } catch (error) {
        return null;
    }
}

/**
 * Save shared context before leaving session
 */
async function saveContextBeforeLeaving(sessionId, participant) {
    try {
        const fs = await import('node:fs/promises');
        const path = await import('node:path');

        const contextDir = path.join(process.cwd(), '.gemini-cli', 'saved-contexts');
        await fs.mkdir(contextDir, { recursive: true });

        const contextFile = path.join(contextDir, `${sessionId}-${participant.name}-${Date.now()}.json`);

        // In a real implementation, this would get the actual shared context
        const contextData = {
            sessionId,
            participantName: participant.name,
            savedAt: new Date().toISOString(),
            note: 'Context saved when leaving session'
        };

        await fs.writeFile(contextFile, JSON.stringify(contextData, null, 2));
        console.log(chalk.green(`   ✓ Context saved to: ${path.relative(process.cwd(), contextFile)}`));

    } catch (error) {
        console.warn(chalk.yellow('   ⚠️  Warning: Could not save context'));
    }
}

/**
 * Clear local session information
 */
async function clearLocalSessionInfo() {
    try {
        const fs = await import('node:fs/promises');
        const path = await import('node:path');

        const sessionFile = path.join(process.cwd(), '.gemini-cli', 'active-session.json');
        await fs.unlink(sessionFile);

    } catch (error) {
        // File might not exist, which is fine
    }
}

/**
 * Get available recordings for a session
 */
async function getSessionRecordings(sessionId) {
    try {
        // In a real implementation, this would query the SessionRecorder
        // For now, return empty array as placeholder
        return [];
    } catch (error) {
        return [];
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