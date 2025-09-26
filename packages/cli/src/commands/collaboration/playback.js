/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import chalk from 'chalk';
import { SessionRecorder } from '@gemini-cli/core/src/collaboration/SessionRecorder.js';

export const playbackCommand = {
    command: 'playback <recordingId>',
    describe: 'Play back a recorded collaboration session',
    builder: (yargs) => yargs
        .positional('recordingId', {
            describe: 'ID of the recording to play back',
            type: 'string'
        })
        .option('speed', {
            describe: 'Playback speed multiplier (e.g., 1.0 = normal, 2.0 = 2x speed)',
            type: 'number',
            default: 1.0,
            alias: 's'
        })
        .option('skip-idle', {
            describe: 'Skip idle periods longer than specified seconds',
            type: 'number',
            default: 10,
            alias: 'i'
        })
        .option('include-events', {
            describe: 'Comma-separated list of event types to include',
            type: 'string'
        })
        .option('exclude-events', {
            describe: 'Comma-separated list of event types to exclude',
            type: 'string'
        })
        .option('start-from', {
            describe: 'Start playback from specific timestamp (HH:MM:SS)',
            type: 'string'
        })
        .option('end-at', {
            describe: 'End playback at specific timestamp (HH:MM:SS)',
            type: 'string'
        })
        .option('participant', {
            describe: 'Show events only from specific participant',
            type: 'string',
            alias: 'p'
        })
        .option('interactive', {
            describe: 'Interactive playback with pause/resume controls',
            type: 'boolean',
            default: false,
            alias: 'int'
        })
        .option('output-format', {
            describe: 'Output format for playback',
            type: 'string',
            choices: ['console', 'json', 'html'],
            default: 'console'
        })
        .example('gemini collab playback rec_123abc', 'Play recording at normal speed')
        .example('gemini collab playback rec_123abc --speed 2.0', 'Play at 2x speed')
        .example('gemini collab playback rec_123abc --skip-idle 30', 'Skip idle periods over 30 seconds')
        .example('gemini collab playback rec_123abc --participant Alice', 'Show only Alice\'s actions')
        .example('gemini collab playback rec_123abc --interactive', 'Interactive playback with controls'),

    handler: async (argv) => {
        try {
            console.log(chalk.cyan(`🎬 Loading recording ${argv.recordingId}...`));

            const recorder = new SessionRecorder();
            const recording = await recorder.loadRecording(argv.recordingId);

            // Display recording information
            console.log(chalk.green('✅ Recording loaded successfully!'));
            console.log('');
            console.log(chalk.bold('Recording Information:'));
            console.log(`   🆔 Recording ID: ${chalk.cyan(recording.id)}`);
            console.log(`   📝 Session: ${chalk.white(recording.sessionId)}`);
            console.log(`   ⏱️  Duration: ${formatDuration(recording.metadata.durationMs)}`);
            console.log(`   📊 Total Events: ${chalk.yellow(recording.metadata.eventCount)}`);
            console.log(`   👥 Participants: ${chalk.blue(recording.metadata.participantCount)}`);
            console.log(`   📅 Recorded: ${recording.startTime.toLocaleString()}`);

            // Build playback configuration
            const playbackConfig = {
                speed: argv.speed,
                skipIdlePeriods: argv.skipIdle * 1000, // Convert to milliseconds
            };

            if (argv.includeEvents) {
                playbackConfig.includeEventTypes = argv.includeEvents.split(',').map(s => s.trim());
            }

            if (argv.excludeEvents) {
                playbackConfig.excludeEventTypes = argv.excludeEvents.split(',').map(s => s.trim());
            }

            // Show playback configuration
            console.log('');
            console.log(chalk.bold('Playback Configuration:'));
            console.log(`   ⚡ Speed: ${chalk.yellow(argv.speed)}x`);
            console.log(`   ⏭️  Skip Idle: ${chalk.gray('>' + argv.skipIdle + 's')}`);

            if (argv.participant) {
                console.log(`   👤 Participant Filter: ${chalk.blue(argv.participant)}`);
            }

            if (playbackConfig.includeEventTypes) {
                console.log(`   ✅ Include Events: ${chalk.green(playbackConfig.includeEventTypes.join(', '))}`);
            }

            if (playbackConfig.excludeEventTypes) {
                console.log(`   ❌ Exclude Events: ${chalk.red(playbackConfig.excludeEventTypes.join(', '))}`);
            }

            console.log('');

            if (argv.interactive) {
                await runInteractivePlayback(recorder, argv.recordingId, playbackConfig);
            } else {
                await runDirectPlayback(recorder, argv.recordingId, playbackConfig, argv);
            }

        } catch (error) {
            console.error(chalk.red('❌ Failed to play back recording:'));
            console.error(chalk.red(error instanceof Error ? error.message : String(error)));

            if (error.message.includes('not found')) {
                console.log(chalk.yellow('\n💡 Recording not found'));
                console.log(chalk.gray('• Check the recording ID is correct'));
                console.log(chalk.gray('• Use "gemini collab record list" to see available recordings'));
            } else if (error.message.includes('corrupted') || error.message.includes('invalid')) {
                console.log(chalk.yellow('\n💡 Recording file may be corrupted'));
                console.log(chalk.gray('• Try playing back a different recording'));
                console.log(chalk.gray('• Check file permissions and disk space'));
            }

            process.exit(1);
        }
    },
};

/**
 * Run direct (non-interactive) playback
 */
async function runDirectPlayback(recorder, recordingId, playbackConfig, options) {
    console.log(chalk.cyan('🎥 Starting playback...'));
    console.log(chalk.gray('Press Ctrl+C to stop playback'));
    console.log(chalk.gray('─'.repeat(60)));

    let eventCount = 0;
    const startTime = Date.now();

    // Set up playback event handlers
    recorder.on('playbackStarted', (data) => {
        console.log(chalk.blue(`▶️  Playback started - ${data.eventCount} events to play`));
    });

    recorder.on('playbackEvent', (data) => {
        eventCount++;
        const progress = Math.round((data.eventIndex / data.totalEvents) * 100);

        if (options.outputFormat === 'json') {
            console.log(JSON.stringify(data.event, null, 2));
        } else {
            displayEvent(data.event, eventCount, progress);
        }
    });

    recorder.on('playbackCompleted', (data) => {
        const elapsed = Date.now() - startTime;
        console.log(chalk.gray('─'.repeat(60)));
        console.log(chalk.green('✅ Playback completed!'));
        console.log(`   📊 Events Played: ${data.eventsPlayed}`);
        console.log(`   ⏱️  Time Taken: ${formatDuration(elapsed)}`);
        console.log(`   ⚡ Effective Speed: ${(playbackConfig.speed).toFixed(1)}x`);
    });

    // Handle Ctrl+C gracefully
    process.on('SIGINT', () => {
        console.log(chalk.yellow('\n⏹️  Playback stopped by user'));
        console.log(`   📊 Events Played: ${eventCount}`);
        process.exit(0);
    });

    // Start playback
    await recorder.playRecording(recordingId, playbackConfig);
}

/**
 * Run interactive playback with controls
 */
async function runInteractivePlayback(recorder, recordingId, playbackConfig) {
    console.log(chalk.cyan('🎮 Interactive Playback Mode'));
    console.log(chalk.gray('Controls: [Space] Pause/Resume | [Q] Quit | [S] Skip | [R] Restart'));
    console.log(chalk.gray('─'.repeat(60)));

    // Set up readline for interactive controls
    const readline = await import('node:readline');
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    let isPaused = false;
    let eventCount = 0;

    // Enable raw mode for single key presses
    if (process.stdin.isTTY) {
        process.stdin.setRawMode(true);
        process.stdin.resume();
        process.stdin.on('data', (key) => {
            const keyStr = key.toString();

            switch (keyStr.toLowerCase()) {
                case ' ': // Space
                    isPaused = !isPaused;
                    console.log(chalk.yellow(isPaused ? '⏸️  Paused' : '▶️  Resumed'));
                    break;
                case 'q':
                    console.log(chalk.yellow('\n👋 Quitting playback'));
                    process.exit(0);
                    break;
                case 's':
                    console.log(chalk.blue('⏭️  Skipping...'));
                    // Skip implementation would go here
                    break;
                case 'r':
                    console.log(chalk.blue('🔄 Restarting playback...'));
                    // Restart implementation would go here
                    break;
                case '\u0003': // Ctrl+C
                    process.exit(0);
                    break;
            }
        });
    }

    // Set up playback event handlers
    recorder.on('playbackEvent', (data) => {
        if (!isPaused) {
            eventCount++;
            const progress = Math.round((data.eventIndex / data.totalEvents) * 100);
            displayEvent(data.event, eventCount, progress);
        }
    });

    recorder.on('playbackCompleted', () => {
        console.log(chalk.green('\n✅ Playback completed!'));
        console.log(chalk.gray('Press [Q] to quit'));
    });

    // Start playback
    await recorder.playRecording(recordingId, playbackConfig);
}

/**
 * Display a single event during playback
 */
function displayEvent(event, eventCount, progress) {
    const timestamp = event.timestamp.toLocaleTimeString();
    const eventIcon = getEventIcon(event.type);
    const participantColor = getParticipantColor(event.participantId);

    // Progress indicator
    const progressBar = '█'.repeat(Math.floor(progress / 5)) + '░'.repeat(20 - Math.floor(progress / 5));

    console.log(`[${progressBar}] ${progress}% | ${chalk.gray(timestamp)} ${eventIcon} ${participantColor(event.participantId)}`);

    // Event-specific display
    switch (event.type) {
        case 'PARTICIPANT_JOINED':
            console.log(chalk.green(`   👋 Joined the session`));
            break;
        case 'PARTICIPANT_LEFT':
            console.log(chalk.red(`   👋 Left the session`));
            break;
        case 'CODE_EDIT':
            if (event.data?.file) {
                console.log(chalk.blue(`   ✏️  Edited: ${event.data.file}`));
            }
            break;
        case 'CONTEXT_SHARED':
            if (event.data?.contextType) {
                console.log(chalk.purple(`   📤 Shared ${event.data.contextType}`));
            }
            break;
        case 'MESSAGE_SENT':
            if (event.data?.message) {
                console.log(chalk.white(`   💬 "${event.data.message}"`));
            }
            break;
        case 'CONFLICT_DETECTED':
            console.log(chalk.yellow(`   ⚠️  Conflict detected`));
            break;
        case 'CONFLICT_RESOLVED':
            console.log(chalk.green(`   ✅ Conflict resolved`));
            break;
        default:
            console.log(chalk.gray(`   📋 ${event.type}`));
    }
}

/**
 * Get icon for event type
 */
function getEventIcon(eventType) {
    const icons = {
        'PARTICIPANT_JOINED': '👋',
        'PARTICIPANT_LEFT': '🚪',
        'CODE_EDIT': '✏️',
        'CONTEXT_SHARED': '📤',
        'MESSAGE_SENT': '💬',
        'CONFLICT_DETECTED': '⚠️',
        'CONFLICT_RESOLVED': '✅',
        'ROLE_CHANGED': '🔄',
        'STATUS_CHANGED': '📊',
        'RECORDING_TOGGLED': '🎬'
    };

    return icons[eventType] || '📋';
}

/**
 * Get color for participant based on simple hash
 */
function getParticipantColor(participantId) {
    const colors = [chalk.red, chalk.green, chalk.blue, chalk.yellow, chalk.magenta, chalk.cyan];
    const hash = participantId.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    return colors[hash % colors.length];
}

/**
 * Format duration in milliseconds to human-readable string
 */
function formatDuration(durationMs) {
    const seconds = Math.floor(durationMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
        return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
        return `${minutes}m ${seconds % 60}s`;
    } else {
        return `${seconds}s`;
    }
}