/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import chalk from 'chalk';
import { SessionManager } from '@gemini-cli/core/src/collaboration/SessionManager.js';
import { SessionType, ParticipantRole, SessionStatus } from '@gemini-cli/core/src/collaboration/types.js';

export const createCommand = {
    command: 'create [name]',
    describe: 'Create a new collaborative programming session',
    builder: (yargs) => yargs
        .positional('name', {
            describe: 'Name for the collaboration session',
            type: 'string',
            default: `Session-${Date.now()}`
        })
        .option('type', {
            describe: 'Type of collaboration session',
            type: 'string',
            choices: ['PAIR', 'MOB', 'REVIEW', 'MENTOR', 'ASYNC'],
            default: 'PAIR',
            alias: 't'
        })
        .option('description', {
            describe: 'Description of the session purpose',
            type: 'string',
            alias: 'd'
        })
        .option('max-participants', {
            describe: 'Maximum number of participants allowed',
            type: 'number',
            default: 8,
            alias: 'm'
        })
        .option('auto-record', {
            describe: 'Automatically start recording the session',
            type: 'boolean',
            default: false,
            alias: 'r'
        })
        .option('conflict-strategy', {
            describe: 'Default conflict resolution strategy',
            type: 'string',
            choices: ['LAST_WRITE_WINS', 'ROLE_PRIORITY', 'MANUAL', 'VERSION_BRANCHING'],
            default: 'ROLE_PRIORITY'
        })
        .option('sync-frequency', {
            describe: 'Context synchronization frequency in milliseconds',
            type: 'number',
            default: 5000
        })
        .example('gemini collab create "Frontend Review"', 'Create a code review session')
        .example('gemini collab create --type MOB --max-participants 10', 'Create a mob programming session')
        .example('gemini collab create "Learning Session" --type MENTOR --auto-record', 'Create a mentoring session with recording'),

    handler: async (argv) => {
        try {
            console.log(chalk.cyan('🚀 Creating new collaboration session...'));

            const sessionManager = new SessionManager();

            // Session configuration
            const sessionConfig = {
                sessionType: SessionType[argv.type],
                maxParticipants: argv.maxParticipants,
                autoRecord: argv.autoRecord,
                conflictResolution: {
                    defaultStrategy: argv.conflictStrategy,
                    autoResolve: argv.conflictStrategy !== 'MANUAL'
                },
                sharedContext: {
                    enableSharing: true,
                    syncFrequencyMs: argv.syncFrequency,
                    maxContextItems: 1000
                },
                recording: {
                    enabled: argv.autoRecord,
                    includeContext: true,
                    maxDurationMs: 8 * 60 * 60 * 1000 // 8 hours
                },
                permissions: {
                    allowEditing: true,
                    allowRecording: true,
                    allowInvite: true
                }
            };

            // Create the session
            const session = await sessionManager.createSession(
                argv.name,
                sessionConfig,
                argv.description || `${argv.type} collaboration session`
            );

            // Display success information
            console.log(chalk.green('✅ Session created successfully!'));
            console.log('');
            console.log(chalk.bold('Session Details:'));
            console.log(`   🆔 Session ID: ${chalk.cyan(session.id)}`);
            console.log(`   📝 Name: ${chalk.white(session.name)}`);
            console.log(`   📋 Type: ${chalk.yellow(argv.type)}`);
            console.log(`   👤 Host: ${chalk.green(session.host.name)} (${session.host.role})`);
            console.log(`   🔗 Status: ${chalk.blue(session.status)}`);
            console.log(`   👥 Max Participants: ${argv.maxParticipants}`);

            if (session.config.recording?.enabled) {
                console.log(`   📹 Recording: ${chalk.green('ENABLED')}`);
            }

            console.log(`   🕒 Created: ${session.createdAt.toLocaleString()}`);

            if (argv.description) {
                console.log(`   📄 Description: ${chalk.gray(argv.description)}`);
            }

            console.log('');
            console.log(chalk.bold('Next Steps:'));
            console.log(chalk.gray('• Share the Session ID with collaborators'));
            console.log(chalk.gray('• Participants can join with: ') + chalk.cyan(`gemini collab join ${session.id}`));
            console.log(chalk.gray('• Start sharing context with: ') + chalk.cyan('gemini collab share context <file>'));
            console.log(chalk.gray('• Check session status with: ') + chalk.cyan('gemini collab status'));

            // Store session information locally for CLI state management
            await storeLocalSessionInfo(session.id, {
                id: session.id,
                name: session.name,
                role: ParticipantRole.DRIVER, // Creator is typically the driver
                joinedAt: new Date(),
                isActive: true
            });

            console.log(chalk.green('\n🎉 You are now the session host and driver!'));

        } catch (error) {
            console.error(chalk.red('❌ Failed to create collaboration session:'));
            console.error(chalk.red(error instanceof Error ? error.message : String(error)));

            // Provide helpful suggestions
            console.log(chalk.yellow('\n💡 Troubleshooting:'));
            console.log(chalk.gray('• Ensure you have proper permissions in the current directory'));
            console.log(chalk.gray('• Check that no conflicting sessions are running'));
            console.log(chalk.gray('• Verify network connectivity if using remote collaboration'));

            process.exit(1);
        }
    },
};

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