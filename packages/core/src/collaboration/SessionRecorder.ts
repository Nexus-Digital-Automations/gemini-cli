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

import { EventEmitter } from 'node:events';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import type {
  SessionRecording,
  CollaborationEvent,
  CollaborationEventType,
  SessionParticipant,
  CollaborationSession,
} from './types.js';

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
export class SessionRecorder extends EventEmitter {
  private activeRecordings = new Map<string, ActiveRecording>();
  private config: RecordingConfig;

  constructor(config?: Partial<RecordingConfig>) {
    super();

    this.config = {
      recordingsPath: config?.recordingsPath || './recordings',
      maxDurationMs: config?.maxDurationMs || 8 * 60 * 60 * 1000, // 8 hours
      maxEvents: config?.maxEvents || 50000,
      compress: config?.compress ?? true,
      includeSensitiveData: config?.includeSensitiveData ?? false,
    };

    // Ensure recordings directory exists
    this.ensureRecordingsDirectory();
  }

  /**
   * Start recording a collaboration session
   */
  async startRecording(sessionId: string, metadata?: Record<string, unknown>): Promise<void> {
    if (this.activeRecordings.has(sessionId)) {
      throw new Error(`Recording for session ${sessionId} is already active`);
    }

    const recordingId = this.generateRecordingId();
    const startTime = new Date();

    const recording: ActiveRecording = {
      id: recordingId,
      sessionId,
      startTime,
      events: [],
      metadata: {
        startedBy: 'system',
        config: this.config,
        ...metadata,
      },
      isActive: true,
    };

    this.activeRecordings.set(sessionId, recording);

    // Set up automatic stop after max duration
    setTimeout(() => {
      if (this.activeRecordings.has(sessionId)) {
        this.stopRecording(sessionId, 'Maximum duration reached').catch(console.error);
      }
    }, this.config.maxDurationMs);

    this.emit('recordingStarted', {
      recordingId,
      sessionId,
      startTime,
    });
  }

  /**
   * Record an event during active recording
   */
  async recordEvent(sessionId: string, event: CollaborationEvent): Promise<void> {
    const recording = this.activeRecordings.get(sessionId);
    if (!recording || !recording.isActive) {
      return; // No active recording for this session
    }

    // Filter sensitive data if configured
    const recordedEvent = this.config.includeSensitiveData
      ? event
      : this.filterSensitiveData(event);

    recording.events.push(recordedEvent);

    // Check if we've reached the maximum event limit
    if (recording.events.length >= this.config.maxEvents) {
      await this.stopRecording(sessionId, 'Maximum events reached');
    }

    this.emit('eventRecorded', {
      recordingId: recording.id,
      sessionId,
      eventId: event.id,
      eventCount: recording.events.length,
    });
  }

  /**
   * Stop recording a session
   */
  async stopRecording(sessionId: string, reason?: string): Promise<SessionRecording> {
    const activeRecording = this.activeRecordings.get(sessionId);
    if (!activeRecording) {
      throw new Error(`No active recording found for session ${sessionId}`);
    }

    const endTime = new Date();
    activeRecording.isActive = false;

    const recording: SessionRecording = {
      id: activeRecording.id,
      sessionId,
      startTime: activeRecording.startTime,
      endTime,
      events: activeRecording.events,
      metadata: {
        participantCount: this.countUniqueParticipants(activeRecording.events),
        eventCount: activeRecording.events.length,
        durationMs: endTime.getTime() - activeRecording.startTime.getTime(),
        stoppedReason: reason,
        ...activeRecording.metadata,
      },
    };

    // Save recording to disk
    await this.saveRecording(recording);

    // Clean up active recording
    this.activeRecordings.delete(sessionId);

    this.emit('recordingStopped', {
      recordingId: recording.id,
      sessionId,
      endTime,
      eventCount: recording.events.length,
      duration: recording.metadata.durationMs,
      reason,
    });

    return recording;
  }

  /**
   * Load a saved recording
   */
  async loadRecording(recordingId: string): Promise<SessionRecording> {
    const recordingPath = this.getRecordingPath(recordingId);

    try {
      const recordingData = await fs.readFile(recordingPath, 'utf-8');
      const recording: SessionRecording = JSON.parse(recordingData);

      // Restore Date objects
      recording.startTime = new Date(recording.startTime);
      recording.endTime = new Date(recording.endTime);
      recording.events.forEach(event => {
        event.timestamp = new Date(event.timestamp);
      });

      return recording;
    } catch (error) {
      throw new Error(`Failed to load recording ${recordingId}: ${error.message}`);
    }
  }

  /**
   * Play back a recorded session
   */
  async playRecording(
    recordingId: string,
    config?: Partial<PlaybackConfig>
  ): Promise<void> {
    const recording = await this.loadRecording(recordingId);

    const playbackConfig: PlaybackConfig = {
      speed: config?.speed || 1.0,
      skipIdlePeriods: config?.skipIdlePeriods || 10000, // 10 seconds
      includeEventTypes: config?.includeEventTypes,
      excludeEventTypes: config?.excludeEventTypes,
    };

    // Filter events based on configuration
    const eventsToPlay = this.filterEventsForPlayback(recording.events, playbackConfig);

    this.emit('playbackStarted', {
      recordingId,
      sessionId: recording.sessionId,
      eventCount: eventsToPlay.length,
      config: playbackConfig,
    });

    // Play back events with timing
    for (let i = 0; i < eventsToPlay.length; i++) {
      const event = eventsToPlay[i];
      const nextEvent = eventsToPlay[i + 1];

      // Emit the event
      this.emit('playbackEvent', {
        recordingId,
        event,
        eventIndex: i,
        totalEvents: eventsToPlay.length,
      });

      // Calculate delay to next event
      if (nextEvent) {
        let delay = nextEvent.timestamp.getTime() - event.timestamp.getTime();

        // Apply speed multiplier
        delay = delay / playbackConfig.speed;

        // Skip long idle periods
        if (delay > playbackConfig.skipIdlePeriods) {
          delay = Math.min(delay, 1000); // Cap at 1 second
        }

        // Wait before next event
        if (delay > 0) {
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    this.emit('playbackCompleted', {
      recordingId,
      sessionId: recording.sessionId,
      eventsPlayed: eventsToPlay.length,
    });
  }

  /**
   * Get list of available recordings
   */
  async getRecordings(): Promise<Array<{
    id: string;
    sessionId: string;
    startTime: Date;
    duration: number;
    eventCount: number;
    size: number;
  }>> {
    try {
      const files = await fs.readdir(this.config.recordingsPath);
      const recordingFiles = files.filter(file => file.endsWith('.json'));

      const recordings = await Promise.all(
        recordingFiles.map(async (file) => {
          const recordingPath = join(this.config.recordingsPath, file);
          const stats = await fs.stat(recordingPath);
          const data = await fs.readFile(recordingPath, 'utf-8');
          const recording: SessionRecording = JSON.parse(data);

          return {
            id: recording.id,
            sessionId: recording.sessionId,
            startTime: new Date(recording.startTime),
            duration: recording.metadata.durationMs,
            eventCount: recording.metadata.eventCount,
            size: stats.size,
          };
        })
      );

      return recordings.sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
    } catch (error) {
      console.error('Failed to get recordings list:', error);
      return [];
    }
  }

  /**
   * Delete a recording
   */
  async deleteRecording(recordingId: string): Promise<void> {
    const recordingPath = this.getRecordingPath(recordingId);

    try {
      await fs.unlink(recordingPath);
      this.emit('recordingDeleted', { recordingId });
    } catch (error) {
      throw new Error(`Failed to delete recording ${recordingId}: ${error.message}`);
    }
  }

  /**
   * Get recording statistics
   */
  async getRecordingStats(recordingId: string): Promise<{
    eventsByType: Record<CollaborationEventType, number>;
    eventsByParticipant: Record<string, number>;
    timeline: Array<{ timestamp: Date; eventType: CollaborationEventType; participantId: string }>;
    participantActivity: Array<{ participantId: string; eventCount: number; duration: number }>;
  }> {
    const recording = await this.loadRecording(recordingId);

    const eventsByType: Record<CollaborationEventType, number> = {
      [CollaborationEventType.PARTICIPANT_JOINED]: 0,
      [CollaborationEventType.PARTICIPANT_LEFT]: 0,
      [CollaborationEventType.CODE_EDIT]: 0,
      [CollaborationEventType.CONTEXT_SHARED]: 0,
      [CollaborationEventType.CONFLICT_DETECTED]: 0,
      [CollaborationEventType.CONFLICT_RESOLVED]: 0,
      [CollaborationEventType.ROLE_CHANGED]: 0,
      [CollaborationEventType.MESSAGE_SENT]: 0,
      [CollaborationEventType.STATUS_CHANGED]: 0,
      [CollaborationEventType.RECORDING_TOGGLED]: 0,
    };

    const eventsByParticipant: Record<string, number> = {};
    const participantFirstSeen: Record<string, Date> = {};
    const participantLastSeen: Record<string, Date> = {};

    const timeline = recording.events.map(event => {
      eventsByType[event.type]++;
      eventsByParticipant[event.participantId] = (eventsByParticipant[event.participantId] || 0) + 1;

      if (!participantFirstSeen[event.participantId]) {
        participantFirstSeen[event.participantId] = event.timestamp;
      }
      participantLastSeen[event.participantId] = event.timestamp;

      return {
        timestamp: event.timestamp,
        eventType: event.type,
        participantId: event.participantId,
      };
    });

    const participantActivity = Object.keys(eventsByParticipant).map(participantId => ({
      participantId,
      eventCount: eventsByParticipant[participantId],
      duration: participantLastSeen[participantId].getTime() - participantFirstSeen[participantId].getTime(),
    }));

    return {
      eventsByType,
      eventsByParticipant,
      timeline,
      participantActivity,
    };
  }

  /**
   * Filter sensitive data from events
   */
  private filterSensitiveData(event: CollaborationEvent): CollaborationEvent {
    // Create a copy to avoid modifying the original
    const filteredEvent = { ...event };

    // Remove or mask sensitive data based on event type
    if (event.type === CollaborationEventType.MESSAGE_SENT && event.data) {
      const data = event.data as { message?: unknown };
      if (typeof data.message === 'string' && this.containsSensitiveInfo(data.message)) {
        filteredEvent.data = { ...data, message: '[REDACTED]' };
      }
    }

    // Filter metadata
    if (event.metadata) {
      const filteredMetadata = { ...event.metadata };
      delete filteredMetadata.password;
      delete filteredMetadata.token;
      delete filteredMetadata.key;
      filteredEvent.metadata = filteredMetadata;
    }

    return filteredEvent;
  }

  /**
   * Check if text contains sensitive information
   */
  private containsSensitiveInfo(text: string): boolean {
    const sensitivePatterns = [
      /password[:\s]*[\w\d!@#$%^&*()]+/i,
      /token[:\s]*[\w\d\-_]+/i,
      /api[_\s]*key[:\s]*[\w\d\-_]+/i,
      /secret[:\s]*[\w\d\-_]+/i,
    ];

    return sensitivePatterns.some(pattern => pattern.test(text));
  }

  /**
   * Filter events for playback based on configuration
   */
  private filterEventsForPlayback(
    events: CollaborationEvent[],
    config: PlaybackConfig
  ): CollaborationEvent[] {
    let filteredEvents = [...events];

    // Include specific event types
    if (config.includeEventTypes) {
      filteredEvents = filteredEvents.filter(event =>
        config.includeEventTypes!.includes(event.type)
      );
    }

    // Exclude specific event types
    if (config.excludeEventTypes) {
      filteredEvents = filteredEvents.filter(event =>
        !config.excludeEventTypes!.includes(event.type)
      );
    }

    return filteredEvents.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  /**
   * Count unique participants in event list
   */
  private countUniqueParticipants(events: CollaborationEvent[]): number {
    const participantIds = new Set(events.map(event => event.participantId));
    return participantIds.size;
  }

  /**
   * Save recording to disk
   */
  private async saveRecording(recording: SessionRecording): Promise<void> {
    const recordingPath = this.getRecordingPath(recording.id);

    try {
      const recordingData = JSON.stringify(recording, null, this.config.compress ? 0 : 2);
      await fs.writeFile(recordingPath, recordingData, 'utf-8');
    } catch (error) {
      throw new Error(`Failed to save recording ${recording.id}: ${error.message}`);
    }
  }

  /**
   * Get file path for recording
   */
  private getRecordingPath(recordingId: string): string {
    return join(this.config.recordingsPath, `${recordingId}.json`);
  }

  /**
   * Ensure recordings directory exists
   */
  private async ensureRecordingsDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.config.recordingsPath, { recursive: true });
    } catch (error) {
      console.error('Failed to create recordings directory:', error);
    }
  }

  /**
   * Generate unique recording ID
   */
  private generateRecordingId(): string {
    return `recording_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get active recordings
   */
  getActiveRecordings(): Array<{
    id: string;
    sessionId: string;
    startTime: Date;
    eventCount: number;
    duration: number;
  }> {
    const now = Date.now();
    return Array.from(this.activeRecordings.values()).map(recording => ({
      id: recording.id,
      sessionId: recording.sessionId,
      startTime: recording.startTime,
      eventCount: recording.events.length,
      duration: now - recording.startTime.getTime(),
    }));
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    // Stop all active recordings
    const activeSessionIds = Array.from(this.activeRecordings.keys());
    for (const sessionId of activeSessionIds) {
      this.stopRecording(sessionId, 'Session recorder destroyed').catch(console.error);
    }

    this.activeRecordings.clear();
    this.removeAllListeners();
  }
}

/**
 * Internal interface for active recordings
 */
interface ActiveRecording {
  id: string;
  sessionId: string;
  startTime: Date;
  events: CollaborationEvent[];
  metadata: Record<string, unknown>;
  isActive: boolean;
}