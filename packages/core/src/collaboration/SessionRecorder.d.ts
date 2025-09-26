/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * @fileoverview Pair-Programming Mode - Session Recording and Playback
 * Recording and playback system for collaborative programming sessions
 *
 * @author Claude Code - Pair-Programming Implementation Agent
 * @version 1.0.0
 */
import { EventEmitter } from 'events';
import type { SessionRecording, CollaborationEvent, CollaborationEventType } from './types.js';
/**
 * Configuration for session recording
 */
interface RecordingConfig {
    /** Directory to store recordings */
    recordingsPath: string;
    /** Maximum recording duration in milliseconds */
    maxDurationMs: number;
    /** Maximum events per recording */
    maxEvents: number;
    /** Compress recordings */
    compress: boolean;
    /** Include sensitive data in recordings */
    includeSensitiveData: boolean;
}
/**
 * Playback configuration
 */
interface PlaybackConfig {
    /** Playback speed multiplier (1.0 = real-time, 2.0 = 2x speed, etc.) */
    speed: number;
    /** Skip idle periods longer than this duration (ms) */
    skipIdlePeriods: number;
    /** Event types to include in playback */
    includeEventTypes?: CollaborationEventType[];
    /** Event types to exclude from playback */
    excludeEventTypes?: CollaborationEventType[];
}
/**
 * Session recorder for collaborative programming sessions
 */
export declare class SessionRecorder extends EventEmitter {
    private activeRecordings;
    private config;
    constructor(config?: Partial<RecordingConfig>);
    /**
     * Start recording a collaboration session
     */
    startRecording(sessionId: string, metadata?: Record<string, unknown>): Promise<void>;
    /**
     * Record an event during active recording
     */
    recordEvent(sessionId: string, event: CollaborationEvent): Promise<void>;
    /**
     * Stop recording a session
     */
    stopRecording(sessionId: string, reason?: string): Promise<SessionRecording>;
    /**
     * Load a saved recording
     */
    loadRecording(recordingId: string): Promise<SessionRecording>;
    /**
     * Play back a recorded session
     */
    playRecording(recordingId: string, config?: Partial<PlaybackConfig>): Promise<void>;
    /**
     * Get list of available recordings
     */
    getRecordings(): Promise<Array<{
        id: string;
        sessionId: string;
        startTime: Date;
        duration: number;
        eventCount: number;
        size: number;
    }>>;
    /**
     * Delete a recording
     */
    deleteRecording(recordingId: string): Promise<void>;
    /**
     * Get recording statistics
     */
    getRecordingStats(recordingId: string): Promise<{
        eventsByType: Record<CollaborationEventType, number>;
        eventsByParticipant: Record<string, number>;
        timeline: Array<{
            timestamp: Date;
            eventType: CollaborationEventType;
            participantId: string;
        }>;
        participantActivity: Array<{
            participantId: string;
            eventCount: number;
            duration: number;
        }>;
    }>;
    /**
     * Filter sensitive data from events
     */
    private filterSensitiveData;
    /**
     * Check if text contains sensitive information
     */
    private containsSensitiveInfo;
    /**
     * Filter events for playback based on configuration
     */
    private filterEventsForPlayback;
    /**
     * Count unique participants in event list
     */
    private countUniqueParticipants;
    /**
     * Save recording to disk
     */
    private saveRecording;
    /**
     * Get file path for recording
     */
    private getRecordingPath;
    /**
     * Ensure recordings directory exists
     */
    private ensureRecordingsDirectory;
    /**
     * Generate unique recording ID
     */
    private generateRecordingId;
    /**
     * Get active recordings
     */
    getActiveRecordings(): Array<{
        id: string;
        sessionId: string;
        startTime: Date;
        eventCount: number;
        duration: number;
    }>;
    /**
     * Clean up resources
     */
    destroy(): void;
}
export {};
