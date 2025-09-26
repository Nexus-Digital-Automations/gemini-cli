/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {
    createCommand,
    joinCommand,
    leaveCommand,
    statusCommand,
    shareCommand,
    recordCommand,
    playbackCommand,
    listCommand
} from './collaboration/index.js';

/**
 * Pair-Programming Mode CLI Command Interface
 *
 * Provides comprehensive command-line access to the collaborative development system,
 * enabling users to create, join, and manage pair-programming sessions with real-time
 * context sharing, conflict resolution, and session recording capabilities.
 */
export const collaborationCommand = {
    command: 'collab',
    describe: 'Manage collaborative programming sessions (Pair-Programming Mode)',
    builder: (yargs) => yargs
        .command(createCommand)
        .command(joinCommand)
        .command(leaveCommand)
        .command(statusCommand)
        .command(shareCommand)
        .command(recordCommand)
        .command(playbackCommand)
        .command(listCommand)
        .demandCommand(1, 'You need at least one command before continuing.')
        .version(false)
        .example('gemini collab create "Frontend Review"', 'Create a new collaboration session')
        .example('gemini collab join session_123', 'Join an existing session')
        .example('gemini collab share context ./src/api.js', 'Share a file in current session')
        .example('gemini collab record start', 'Start recording current session')
        .example('gemini collab status', 'Show current session status')
        .example('gemini collab list', 'List all available sessions')
        .example('gemini collab playback session_rec_456', 'Play back a recorded session')
        .example('gemini collab leave', 'Leave current collaboration session')
        .epilog(`The Pair-Programming Mode transforms Gemini CLI into a collaborative development
environment that supports real-time multi-developer sessions with advanced features:

Key Features:
• Real-time collaborative code editing with conflict resolution
• Shared context management and synchronization across participants
• Role-based access control (Driver, Navigator, Observer, etc.)
• Session recording and playback for learning and debugging
• Asynchronous collaboration with context handoffs
• Advanced conflict detection and resolution strategies
• Integrated debugging and shared workspace management

Collaboration Session Types:
• PAIR: Traditional two-developer pair programming
• MOB: Multiple developers working together
• REVIEW: Collaborative code review sessions
• MENTOR: Teaching and learning sessions
• ASYNC: Asynchronous handoff-based collaboration

For detailed documentation, visit: https://gemini-cli.dev/collaboration`),
    handler: () => {
        // yargs will automatically show help if no subcommand is provided
        // thanks to demandCommand(1) in the builder.
    },
};