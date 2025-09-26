/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import chalk from 'chalk';
import { SessionManager } from '@gemini-cli/core/src/collaboration/SessionManager.js';

export const listCommand = {
    command: 'list [filter]',
    describe: 'List available collaboration sessions',
    builder: (yargs) => yargs
        .positional('filter', {
            describe: 'Filter sessions by status, type, or search term',
            type: 'string'
        })
        .option('status', {
            describe: 'Filter by session status',
            type: 'string',
            choices: ['ACTIVE', 'PAUSED', 'ENDED'],
            alias: 's'
        })
        .option('type', {
            describe: 'Filter by session type',
            type: 'string',
            choices: ['PAIR', 'MOB', 'REVIEW', 'MENTOR', 'ASYNC'],
            alias: 't'
        })
        .option('host', {
            describe: 'Filter by host name',
            type: 'string',
            alias: 'h'
        })
        .option('participant', {
            describe: 'Filter sessions where you or specified user is a participant',
            type: 'string',
            alias: 'p'
        })
        .option('json', {
            describe: 'Output in JSON format',
            type: 'boolean',
            default: false,
            alias: 'j'
        })
        .option('detailed', {
            describe: 'Show detailed information about each session',
            type: 'boolean',
            default: false,
            alias: 'd'
        })
        .option('limit', {
            describe: 'Maximum number of sessions to show',
            type: 'number',
            default: 20,
            alias: 'l'
        })
        .option('sort', {
            describe: 'Sort sessions by field',
            type: 'string',
            choices: ['created', 'activity', 'participants', 'name'],
            default: 'activity'
        })
        .example('gemini collab list', 'List all available sessions')
        .example('gemini collab list --status ACTIVE', 'List only active sessions')
        .example('gemini collab list --type PAIR', 'List only pair programming sessions')
        .example('gemini collab list "frontend" --detailed', 'Search for "frontend" with details')
        .example('gemini collab list --participant Alice', 'List sessions with Alice as participant'),

    handler: async (argv) => {
        try {
            console.log(chalk.cyan('📋 Discovering collaboration sessions...'));

            const sessionManager = new SessionManager();

            // Get all available sessions (in a real implementation, this might be from a service discovery mechanism)
            const allSessions = await discoverAvailableSessions(sessionManager);

            // Apply filters
            let filteredSessions = applyFilters(allSessions, argv);

            // Apply sorting
            filteredSessions = sortSessions(filteredSessions, argv.sort);

            // Apply limit
            if (argv.limit && filteredSessions.length > argv.limit) {
                filteredSessions = filteredSessions.slice(0, argv.limit);
            }

            if (argv.json) {
                console.log(JSON.stringify(filteredSessions, null, 2));
                return;
            }

            // Display results
            displaySessionList(filteredSessions, argv);

        } catch (error) {
            console.error(chalk.red('❌ Failed to list collaboration sessions:'));
            console.error(chalk.red(error instanceof Error ? error.message : String(error)));

            console.log(chalk.yellow('\n💡 This might be because:'));
            console.log(chalk.gray('• No collaboration service is running'));
            console.log(chalk.gray('• Network connectivity issues'));
            console.log(chalk.gray('• Insufficient permissions to discover sessions'));

            process.exit(1);
        }
    },
};

/**
 * Discover available sessions (placeholder implementation)
 */
async function discoverAvailableSessions(sessionManager) {
    // In a real implementation, this would:
    // - Query a collaboration service/registry
    // - Use network discovery protocols
    // - Check local session cache
    // - Poll known collaboration endpoints

    // For now, return some example sessions
    const now = new Date();
    return [
        {
            id: 'session_001',
            name: 'Frontend Code Review',
            status: 'ACTIVE',
            config: { sessionType: 'REVIEW' },
            host: { id: 'alice', name: 'Alice Smith', role: 'MODERATOR' },
            participants: [
                { id: 'alice', name: 'Alice Smith', role: 'MODERATOR', status: 'ACTIVE' },
                { id: 'bob', name: 'Bob Johnson', role: 'NAVIGATOR', status: 'ACTIVE' }
            ],
            createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2 hours ago
            lastActivity: new Date(now.getTime() - 5 * 60 * 1000), // 5 minutes ago
            sharedContext: { items: new Map([['file1', {}], ['file2', {}]]) },
            activeConflicts: []
        },
        {
            id: 'session_002',
            name: 'Backend API Development',
            status: 'ACTIVE',
            config: { sessionType: 'PAIR' },
            host: { id: 'charlie', name: 'Charlie Brown', role: 'DRIVER' },
            participants: [
                { id: 'charlie', name: 'Charlie Brown', role: 'DRIVER', status: 'ACTIVE' },
                { id: 'diana', name: 'Diana Wilson', role: 'NAVIGATOR', status: 'IDLE' }
            ],
            createdAt: new Date(now.getTime() - 1 * 60 * 60 * 1000), // 1 hour ago
            lastActivity: new Date(now.getTime() - 2 * 60 * 1000), // 2 minutes ago
            sharedContext: { items: new Map([['api.js', {}], ['tests.js', {}], ['config.json', {}]]) },
            activeConflicts: [{ id: 'conflict1', type: 'CODE_EDIT_CONFLICT' }]
        },
        {
            id: 'session_003',
            name: 'Learning TypeScript',
            status: 'PAUSED',
            config: { sessionType: 'MENTOR' },
            host: { id: 'eve', name: 'Eve Davis', role: 'MODERATOR' },
            participants: [
                { id: 'eve', name: 'Eve Davis', role: 'MODERATOR', status: 'IDLE' },
                { id: 'frank', name: 'Frank Miller', role: 'OBSERVER', status: 'IDLE' },
                { id: 'grace', name: 'Grace Lee', role: 'OBSERVER', status: 'IDLE' }
            ],
            createdAt: new Date(now.getTime() - 24 * 60 * 60 * 1000), // 1 day ago
            lastActivity: new Date(now.getTime() - 3 * 60 * 60 * 1000), // 3 hours ago
            sharedContext: { items: new Map([['tutorial.ts', {}]]) },
            activeConflicts: []
        }
    ];
}

/**
 * Apply filters to session list
 */
function applyFilters(sessions, options) {
    let filtered = [...sessions];

    // Status filter
    if (options.status) {
        filtered = filtered.filter(session => session.status === options.status);
    }

    // Type filter
    if (options.type) {
        filtered = filtered.filter(session => session.config.sessionType === options.type);
    }

    // Host filter
    if (options.host) {
        const hostLower = options.host.toLowerCase();
        filtered = filtered.filter(session =>
            session.host.name.toLowerCase().includes(hostLower) ||
            session.host.id.toLowerCase().includes(hostLower)
        );
    }

    // Participant filter
    if (options.participant) {
        const participantLower = options.participant.toLowerCase();
        filtered = filtered.filter(session =>
            session.participants.some(p =>
                p.name.toLowerCase().includes(participantLower) ||
                p.id.toLowerCase().includes(participantLower)
            )
        );
    }

    // General text filter
    if (options.filter) {
        const filterLower = options.filter.toLowerCase();
        filtered = filtered.filter(session =>
            session.name.toLowerCase().includes(filterLower) ||
            session.id.toLowerCase().includes(filterLower) ||
            session.host.name.toLowerCase().includes(filterLower) ||
            session.participants.some(p => p.name.toLowerCase().includes(filterLower))
        );
    }

    return filtered;
}

/**
 * Sort sessions by specified field
 */
function sortSessions(sessions, sortBy) {
    switch (sortBy) {
        case 'created':
            return sessions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        case 'activity':
            return sessions.sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime());
        case 'participants':
            return sessions.sort((a, b) => b.participants.length - a.participants.length);
        case 'name':
            return sessions.sort((a, b) => a.name.localeCompare(b.name));
        default:
            return sessions;
    }
}

/**
 * Display formatted session list
 */
function displaySessionList(sessions, options) {
    if (sessions.length === 0) {
        console.log(chalk.yellow('ℹ️  No collaboration sessions found'));
        console.log('');
        console.log(chalk.gray('• Create a session: ') + chalk.cyan('gemini collab create <name>'));
        console.log(chalk.gray('• Check filters and try again'));
        return;
    }

    console.log(chalk.green(`✅ Found ${sessions.length} collaboration session(s)`));
    console.log('');

    sessions.forEach((session, index) => {
        displaySession(session, index + 1, options.detailed);
        if (index < sessions.length - 1) {
            console.log(''); // Spacing between sessions
        }
    });

    console.log('');
    console.log(chalk.bold('Available Actions:'));
    console.log(chalk.gray('• ') + chalk.cyan('gemini collab join <sessionId>') + chalk.gray(' - Join a session'));
    console.log(chalk.gray('• ') + chalk.cyan('gemini collab status <sessionId>') + chalk.gray(' - Check session details'));
    console.log(chalk.gray('• ') + chalk.cyan('gemini collab create <name>') + chalk.gray(' - Create new session'));

    if (!options.detailed) {
        console.log(chalk.gray('• Use --detailed flag for more information'));
    }
}

/**
 * Display a single session
 */
function displaySession(session, index, detailed) {
    const statusIcon = session.status === 'ACTIVE' ? '🟢' :
                      session.status === 'PAUSED' ? '🟡' : '🔴';
    const statusColor = session.status === 'ACTIVE' ? chalk.green :
                       session.status === 'PAUSED' ? chalk.yellow : chalk.red;

    const typeColor = session.config.sessionType === 'PAIR' ? chalk.blue :
                     session.config.sessionType === 'MOB' ? chalk.purple :
                     session.config.sessionType === 'REVIEW' ? chalk.cyan :
                     session.config.sessionType === 'MENTOR' ? chalk.green :
                     chalk.gray;

    // Basic information
    console.log(`${index}. ${chalk.bold(chalk.white(session.name))}`);
    console.log(`   🆔 ${chalk.cyan(session.id)}`);
    console.log(`   ${statusIcon} Status: ${statusColor(session.status)}`);
    console.log(`   📋 Type: ${typeColor(session.config.sessionType)}`);
    console.log(`   👑 Host: ${chalk.blue(session.host.name)} (${session.host.role})`);
    console.log(`   👥 Participants: ${session.participants.length}`);

    if (detailed) {
        // Detailed participant information
        console.log(`   👥 Participant Details:`);
        session.participants.forEach(participant => {
            const roleColor = participant.role === 'DRIVER' ? chalk.green :
                             participant.role === 'MODERATOR' ? chalk.blue :
                             participant.role === 'NAVIGATOR' ? chalk.yellow :
                             chalk.gray;

            const statusIcon = participant.status === 'ACTIVE' ? '🟢' :
                              participant.status === 'IDLE' ? '🟡' : '🔴';

            console.log(`      ${statusIcon} ${participant.name} - ${roleColor(participant.role)}`);
        });

        // Context and activity information
        console.log(`   📄 Shared Context: ${session.sharedContext.items.size} items`);

        if (session.activeConflicts.length > 0) {
            console.log(`   ⚠️  Active Conflicts: ${chalk.yellow(session.activeConflicts.length)}`);
        }

        console.log(`   📅 Created: ${session.createdAt.toLocaleString()}`);
        console.log(`   ⏱️  Last Activity: ${formatTimeAgo(session.lastActivity)}`);
    } else {
        // Condensed information
        console.log(`   ⏱️  Last Activity: ${formatTimeAgo(session.lastActivity)}`);

        if (session.activeConflicts.length > 0) {
            console.log(`   ⚠️  ${session.activeConflicts.length} conflicts`);
        }
    }
}

/**
 * Format time ago in human-readable format
 */
function formatTimeAgo(date) {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) {
        return chalk.green('just now');
    } else if (diffMins < 60) {
        return chalk.green(`${diffMins}m ago`);
    } else if (diffHours < 24) {
        return chalk.yellow(`${diffHours}h ago`);
    } else if (diffDays < 7) {
        return chalk.gray(`${diffDays}d ago`);
    } else {
        return chalk.gray(date.toLocaleDateString());
    }
}