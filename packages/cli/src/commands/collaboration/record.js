/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import chalk from 'chalk';
import { SessionRecorder } from '@gemini-cli/core/src/collaboration/SessionRecorder.js';

export const recordCommand = {
    command: 'record <action>',
    describe: 'Manage session recording for collaboration sessions',
    builder: (yargs) => yargs
        .positional('action', {
            describe: 'Recording action to perform',
            type: 'string',
            choices: ['start', 'stop', 'pause', 'resume', 'status', 'list']
        })
        .option('session', {
            describe: 'Session ID to record (uses current session if not provided)',
            type: 'string',
            alias: 's'
        })
        .option('output-dir', {
            describe: 'Directory to store recordings',
            type: 'string',
            default: './recordings',
            alias: 'o'
        })
        .option('include-sensitive', {
            describe: 'Include potentially sensitive data in recording',
            type: 'boolean',
            default: false
        })
        .option('max-duration', {
            describe: 'Maximum recording duration in minutes',
            type: 'number',
            default: 480, // 8 hours
            alias: 'd'
        })
        .option('compress', {
            describe: 'Compress recorded data',
            type: 'boolean',
            default: true
        })
        .option('metadata', {
            describe: 'Additional metadata for the recording (JSON string)',
            type: 'string',
            alias: 'm'
        })
        .example('gemini collab record start', 'Start recording current session')
        .example('gemini collab record stop', 'Stop current recording')
        .example('gemini collab record start --max-duration 120', 'Record for max 2 hours')
        .example('gemini collab record status', 'Show recording status')
        .example('gemini collab record list', 'List all available recordings'),

    handler: async (argv) => {
        try {
            const recorder = new SessionRecorder({
                recordingsPath: argv.outputDir,
                maxDurationMs: argv.maxDuration * 60 * 1000,
                compress: argv.compress,
                includeSensitiveData: argv.includeSensitive
            });

            let targetSessionId = argv.session;

            // Get current session if not specified
            if (!targetSessionId && ['start', 'stop', 'pause', 'resume', 'status'].includes(argv.action)) {
                targetSessionId = await getCurrentSessionId();
                if (!targetSessionId) {
                    console.log(chalk.yellow('ℹ️  No active collaboration session'));
                    console.log(chalk.gray('• Create a session: ') + chalk.cyan('gemini collab create <name>'));
                    console.log(chalk.gray('• Join a session: ') + chalk.cyan('gemini collab join <sessionId>'));
                    return;
                }
            }

            switch (argv.action) {
                case 'start':
                    await startRecording(recorder, targetSessionId, argv);
                    break;
                case 'stop':
                    await stopRecording(recorder, targetSessionId);
                    break;
                case 'pause':
                    await pauseRecording(recorder, targetSessionId);
                    break;
                case 'resume':
                    await resumeRecording(recorder, targetSessionId);
                    break;
                case 'status':
                    await showRecordingStatus(recorder, targetSessionId);
                    break;
                case 'list':
                    await listRecordings(recorder);
                    break;
                default:
                    throw new Error(`Unknown recording action: ${argv.action}`);
            }

        } catch (error) {
            console.error(chalk.red('❌ Failed to manage recording:'));
            console.error(chalk.red(error instanceof Error ? error.message : String(error)));

            if (error.message.includes('not found')) {
                console.log(chalk.yellow('\n💡 Session or recording not found'));
                console.log(chalk.gray('• Check the session ID is correct'));
                console.log(chalk.gray('• Use "gemini collab record list" to see available recordings'));
            } else if (error.message.includes('permission')) {
                console.log(chalk.yellow('\n💡 Permission issues'));
                console.log(chalk.gray('• Check write permissions for recording directory'));
                console.log(chalk.gray('• Ensure you have access to the session'));
            }

            process.exit(1);
        }
    },
};

/**
 * Start recording a session
 */
async function startRecording(recorder, sessionId, options) {
    console.log(chalk.cyan('🎬 Starting session recording...'));

    // Parse metadata if provided
    let metadata = {};
    if (options.metadata) {
        try {
            metadata = JSON.parse(options.metadata);
        } catch (error) {
            console.warn(chalk.yellow('⚠️  Invalid metadata JSON, ignoring'));
        }
    }

    // Add default metadata
    metadata = {
        startedBy: await getCurrentParticipantName(),
        startedAt: new Date().toISOString(),
        maxDurationMinutes: options.maxDuration,
        compress: options.compress,
        includeSensitive: options.includeSensitive,
        ...metadata
    };

    await recorder.startRecording(sessionId, metadata);

    console.log(chalk.green('✅ Recording started successfully!'));
    console.log('');
    console.log(chalk.bold('Recording Details:'));
    console.log(`   🆔 Session: ${chalk.cyan(sessionId)}`);
    console.log(`   📁 Output Directory: ${chalk.white(options.outputDir)}`);
    console.log(`   ⏱️  Max Duration: ${chalk.yellow(options.maxDuration)} minutes`);
    console.log(`   🗜️  Compression: ${options.compress ? chalk.green('ON') : chalk.red('OFF')}`);
    console.log(`   🔒 Include Sensitive: ${options.includeSensitive ? chalk.yellow('YES') : chalk.green('NO')}`);

    console.log('');
    console.log(chalk.bold('What Gets Recorded:'));
    console.log(chalk.gray('   • All participant actions and edits'));
    console.log(chalk.gray('   • Context sharing and synchronization events'));
    console.log(chalk.gray('   • Conflict detection and resolution'));
    console.log(chalk.gray('   • Chat messages and collaboration events'));
    console.log(chalk.gray('   • Timing information for playback'));

    console.log('');
    console.log(chalk.gray('💡 Use "gemini collab record stop" to end recording'));
    console.log(chalk.gray('💡 Use "gemini collab record status" to check progress'));
}

/**
 * Stop recording a session
 */
async function stopRecording(recorder, sessionId) {
    console.log(chalk.cyan('🛑 Stopping session recording...'));

    const recording = await recorder.stopRecording(sessionId, 'Manual stop');

    console.log(chalk.green('✅ Recording stopped and saved!'));
    console.log('');
    console.log(chalk.bold('Recording Summary:'));
    console.log(`   🆔 Recording ID: ${chalk.cyan(recording.id)}`);
    console.log(`   📝 Session: ${chalk.white(sessionId)}`);
    console.log(`   ⏱️  Duration: ${formatDuration(recording.metadata.durationMs)}`);
    console.log(`   📊 Events Captured: ${chalk.yellow(recording.metadata.eventCount)}`);
    console.log(`   👥 Participants: ${chalk.blue(recording.metadata.participantCount)}`);
    console.log(`   📅 Recorded: ${recording.startTime.toLocaleString()} - ${recording.endTime.toLocaleString()}`);

    if (recording.metadata.size) {
        console.log(`   📏 File Size: ${formatBytes(recording.metadata.size)}`);
    }

    console.log('');
    console.log(chalk.bold('Playback Options:'));
    console.log(chalk.gray('• ') + chalk.cyan(`gemini collab playback ${recording.id}`) + chalk.gray(' - Play recording'));
    console.log(chalk.gray('• ') + chalk.cyan(`gemini collab playback ${recording.id} --speed 2`) + chalk.gray(' - Play at 2x speed'));
    console.log(chalk.gray('• ') + chalk.cyan(`gemini collab playback ${recording.id} --skip-idle`) + chalk.gray(' - Skip idle periods'));

    console.log(chalk.green('\n📹 Recording saved successfully!'));
}

/**
 * Pause recording (placeholder - would need implementation in SessionRecorder)
 */
async function pauseRecording(recorder, sessionId) {
    console.log(chalk.yellow('⏸️  Pausing recording...'));

    // This would require adding pause functionality to SessionRecorder
    console.log(chalk.yellow('⚠️  Recording pause functionality not yet implemented'));
    console.log(chalk.gray('For now, you can stop the recording and start a new one'));
}

/**
 * Resume recording (placeholder - would need implementation in SessionRecorder)
 */
async function resumeRecording(recorder, sessionId) {
    console.log(chalk.cyan('▶️  Resuming recording...'));

    // This would require adding resume functionality to SessionRecorder
    console.log(chalk.yellow('⚠️  Recording resume functionality not yet implemented'));
    console.log(chalk.gray('For now, you can start a new recording'));
}

/**
 * Show recording status
 */
async function showRecordingStatus(recorder, sessionId) {
    console.log(chalk.cyan('📊 Recording Status'));
    console.log(chalk.gray('─'.repeat(40)));

    const activeRecordings = recorder.getActiveRecordings();
    const sessionRecording = activeRecordings.find(r => r.sessionId === sessionId);

    if (!sessionRecording) {
        console.log(chalk.yellow('ℹ️  No active recording for this session'));
        console.log('');
        console.log(chalk.gray('• Start recording: ') + chalk.cyan('gemini collab record start'));
        console.log(chalk.gray('• List recordings: ') + chalk.cyan('gemini collab record list'));
        return;
    }

    console.log(chalk.bold('Active Recording:'));
    console.log(`   🆔 Recording ID: ${chalk.cyan(sessionRecording.id)}`);
    console.log(`   📝 Session: ${chalk.white(sessionRecording.sessionId)}`);
    console.log(`   🕒 Started: ${sessionRecording.startTime.toLocaleString()}`);
    console.log(`   ⏱️  Duration: ${formatDuration(sessionRecording.duration)}`);
    console.log(`   📊 Events: ${chalk.yellow(sessionRecording.eventCount)}`);

    // Show progress bar for max duration
    const maxDuration = 8 * 60 * 60 * 1000; // Default 8 hours
    const progressPercent = Math.min((sessionRecording.duration / maxDuration) * 100, 100);
    const progressBar = '█'.repeat(Math.floor(progressPercent / 5)) + '░'.repeat(20 - Math.floor(progressPercent / 5));
    console.log(`   📈 Progress: [${progressBar}] ${progressPercent.toFixed(1)}%`);

    console.log('');
    console.log(chalk.bold('Recording Options:'));
    console.log(chalk.gray('• ') + chalk.cyan('gemini collab record stop') + chalk.gray(' - Stop and save recording'));
    console.log(chalk.gray('• ') + chalk.cyan('gemini collab record status') + chalk.gray(' - Refresh status'));
}

/**
 * List all available recordings
 */
async function listRecordings(recorder) {
    console.log(chalk.cyan('📼 Available Recordings'));
    console.log(chalk.gray('─'.repeat(50)));

    try {
        const recordings = await recorder.getRecordings();

        if (recordings.length === 0) {
            console.log(chalk.yellow('ℹ️  No recordings found'));
            console.log('');
            console.log(chalk.gray('• Start a recording: ') + chalk.cyan('gemini collab record start'));
            return;
        }

        console.log(chalk.bold(`Found ${recordings.length} recording(s):`));
        console.log('');

        recordings.forEach((recording, index) => {
            const duration = formatDuration(recording.duration);
            const size = formatBytes(recording.size);
            const date = recording.startTime.toLocaleDateString();
            const time = recording.startTime.toLocaleTimeString();

            console.log(`${index + 1}. ${chalk.cyan(recording.id)}`);
            console.log(`   📝 Session: ${chalk.white(recording.sessionId)}`);
            console.log(`   ⏱️  Duration: ${chalk.yellow(duration)}`);
            console.log(`   📊 Events: ${recording.eventCount}`);
            console.log(`   📏 Size: ${size}`);
            console.log(`   📅 Date: ${date} ${time}`);
            console.log('');
        });

        console.log(chalk.bold('Playback Commands:'));
        console.log(chalk.gray('• ') + chalk.cyan('gemini collab playback <recordingId>') + chalk.gray(' - Play recording'));
        console.log(chalk.gray('• ') + chalk.cyan('gemini collab playback <recordingId> --speed 2') + chalk.gray(' - Play at 2x speed'));

    } catch (error) {
        console.error(chalk.red('❌ Failed to list recordings:'), error.message);
    }
}

/**
 * Helper functions
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

async function getCurrentParticipantName() {
    try {
        const fs = await import('node:fs/promises');
        const path = await import('node:path');

        const sessionFile = path.join(process.cwd(), '.gemini-cli', 'active-session.json');
        const sessionData = await fs.readFile(sessionFile, 'utf-8');
        const sessionInfo = JSON.parse(sessionData);

        return sessionInfo.participantName || 'unknown';
    } catch (error) {
        // Fallback to system username
        try {
            const os = await import('node:os');
            return os.userInfo().username;
        } catch (error) {
            return 'anonymous';
        }
    }
}

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

function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}