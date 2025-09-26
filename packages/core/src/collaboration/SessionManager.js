/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * @fileoverview Pair-Programming Mode - Session Manager
 * Core class for managing collaborative programming sessions
 *
 * @author Claude Code - Pair-Programming Implementation Agent
 * @version 1.0.0
 */
import { EventEmitter } from 'node:events';
import { ConflictResolver } from './ConflictResolver.js';
import { ContextSynchronizer } from './ContextSynchronizer.js';
import { CollaborationEventBus } from './CollaborationEventBus.js';
import { SessionRecorder } from './SessionRecorder.js';
/**
 * Main session manager for pair-programming collaboration
 */
export class SessionManager extends EventEmitter {
    activeSessions = new Map();
    conflictResolver;
    contextSynchronizer;
    eventBus;
    sessionRecorder;
    cleanupIntervals = new Map();
    constructor() {
        super();
        this.conflictResolver = new ConflictResolver();
        this.contextSynchronizer = new ContextSynchronizer();
        this.eventBus = new CollaborationEventBus();
        this.sessionRecorder = new SessionRecorder();
        // Set up event listeners
        this.setupEventListeners();
    }
    /**
     * Create a new collaboration session
     */
    async createSession(hostParticipant, config, sessionName) {
        const sessionId = this.generateSessionId();
        const now = new Date();
        const host = {
            ...hostParticipant,
            joinedAt: now,
            lastActive: now,
            isOnline: true,
        };
        const session = {
            id: sessionId,
            name: sessionName || `Session-${sessionId.slice(-8)}`,
            config,
            status: SessionStatus.INITIALIZING,
            host,
            participants: [host],
            createdAt: now,
            lastActivity: now,
            sharedContext: await this.contextSynchronizer.createSharedContext(),
            activeConflicts: [],
            metadata: {
                totalEdits: 0,
                totalMessages: 0,
                durationMs: 0,
            },
        };
        this.activeSessions.set(sessionId, session);
        // Start session recording if enabled
        if (config.recordSession) {
            await this.sessionRecorder.startRecording(sessionId);
        }
        // Set up session cleanup timeout
        this.scheduleSessionCleanup(sessionId, config.timeoutMs);
        // Update session status to active
        await this.updateSessionStatus(sessionId, SessionStatus.ACTIVE);
        // Log session creation event
        await this.eventBus.publishEvent({
            id: this.generateEventId(),
            type: CollaborationEventType.STATUS_CHANGED,
            sessionId,
            participantId: host.id,
            timestamp: now,
            data: {
                previousStatus: SessionStatus.INITIALIZING,
                newStatus: SessionStatus.ACTIVE,
                sessionName: session.name,
            },
        });
        this.emit('sessionCreated', session);
        return session;
    }
    /**
     * Join an existing collaboration session
     */
    async joinSession(sessionId, participant) {
        const session = this.activeSessions.get(sessionId);
        if (!session) {
            throw new Error(`Session ${sessionId} not found`);
        }
        if (session.status !== SessionStatus.ACTIVE) {
            throw new Error(`Session ${sessionId} is not active`);
        }
        if (session.participants.length >= session.config.maxParticipants) {
            throw new Error(`Session ${sessionId} is at maximum capacity`);
        }
        // Check if participant already exists
        const existingParticipant = session.participants.find(p => p.userId === participant.userId);
        if (existingParticipant) {
            // Update existing participant to online status
            existingParticipant.isOnline = true;
            existingParticipant.lastActive = new Date();
        }
        else {
            // Add new participant
            const newParticipant = {
                ...participant,
                joinedAt: new Date(),
                lastActive: new Date(),
                isOnline: true,
            };
            session.participants.push(newParticipant);
        }
        session.lastActivity = new Date();
        // Synchronize context with new participant
        const activeParticipant = existingParticipant || session.participants[session.participants.length - 1];
        await this.contextSynchronizer.syncParticipant(sessionId, activeParticipant.id);
        // Log participant joined event
        await this.eventBus.publishEvent({
            id: this.generateEventId(),
            type: CollaborationEventType.PARTICIPANT_JOINED,
            sessionId,
            participantId: activeParticipant.id,
            timestamp: new Date(),
            data: {
                participantName: activeParticipant.name,
                role: activeParticipant.role,
                totalParticipants: session.participants.length,
            },
        });
        this.emit('participantJoined', { session, participant: activeParticipant });
        return session;
    }
    /**
     * Leave a collaboration session
     */
    async leaveSession(sessionId, participantId) {
        const session = this.activeSessions.get(sessionId);
        if (!session) {
            throw new Error(`Session ${sessionId} not found`);
        }
        const participantIndex = session.participants.findIndex(p => p.id === participantId);
        if (participantIndex === -1) {
            throw new Error(`Participant ${participantId} not found in session ${sessionId}`);
        }
        const participant = session.participants[participantIndex];
        // If it's an async session, mark participant as offline instead of removing
        if (session.config.type === SessionType.ASYNC) {
            participant.isOnline = false;
            participant.lastActive = new Date();
        }
        else {
            // Remove participant from realtime session
            session.participants.splice(participantIndex, 1);
        }
        session.lastActivity = new Date();
        // Log participant left event
        await this.eventBus.publishEvent({
            id: this.generateEventId(),
            type: CollaborationEventType.PARTICIPANT_LEFT,
            sessionId,
            participantId,
            timestamp: new Date(),
            data: {
                participantName: participant.name,
                remainingParticipants: session.participants.filter(p => p.isOnline).length,
            },
        });
        // End session if no participants remain
        if (session.participants.filter(p => p.isOnline).length === 0) {
            await this.endSession(sessionId, 'No active participants');
        }
        else {
            // Reassign host if current host left
            if (participant.id === session.host.id) {
                const newHost = session.participants.find(p => p.isOnline);
                if (newHost) {
                    session.host = newHost;
                    newHost.role = ParticipantRole.DRIVER;
                }
            }
        }
        this.emit('participantLeft', { session, participant });
    }
    /**
     * End a collaboration session
     */
    async endSession(sessionId, reason) {
        const session = this.activeSessions.get(sessionId);
        if (!session) {
            throw new Error(`Session ${sessionId} not found`);
        }
        // Update session status
        await this.updateSessionStatus(sessionId, SessionStatus.ENDING);
        // Stop recording if active
        if (session.config.recordSession) {
            await this.sessionRecorder.stopRecording(sessionId);
        }
        // Calculate final metrics
        const endTime = new Date();
        session.metadata.durationMs = endTime.getTime() - session.createdAt.getTime();
        // Log session ended event
        await this.eventBus.publishEvent({
            id: this.generateEventId(),
            type: CollaborationEventType.STATUS_CHANGED,
            sessionId,
            participantId: session.host.id,
            timestamp: endTime,
            data: {
                previousStatus: SessionStatus.ACTIVE,
                newStatus: SessionStatus.COMPLETED,
                reason,
                duration: session.metadata.durationMs,
                totalParticipants: session.participants.length,
            },
        });
        // Clean up session resources
        this.cleanupSession(sessionId);
        // Update final status
        session.status = SessionStatus.COMPLETED;
        this.emit('sessionEnded', { session, reason });
    }
    /**
     * Share context between participants
     */
    async shareContext(sessionId, participantId, contextItems) {
        const session = this.activeSessions.get(sessionId);
        if (!session) {
            throw new Error(`Session ${sessionId} not found`);
        }
        // Verify participant is in session
        const participant = session.participants.find(p => p.id === participantId);
        if (!participant) {
            throw new Error(`Participant ${participantId} not found in session`);
        }
        // Add context items to shared context
        for (const item of contextItems) {
            await session.sharedContext.addItem(item, participantId);
        }
        // Synchronize context with all participants
        await this.contextSynchronizer.synchronizeSession(sessionId);
        session.lastActivity = new Date();
        // Log context sharing event
        await this.eventBus.publishEvent({
            id: this.generateEventId(),
            type: CollaborationEventType.CONTEXT_SHARED,
            sessionId,
            participantId,
            timestamp: new Date(),
            data: {
                contextItemCount: contextItems.length,
                participantName: participant.name,
            },
        });
        this.emit('contextShared', { session, participant, contextItems });
    }
    /**
     * Handle asynchronous collaboration handoff
     */
    async createAsyncHandoff(sessionId, fromParticipantId, toParticipantId, message, contextItems, expiryHours = 24) {
        const session = this.activeSessions.get(sessionId);
        if (!session || session.config.type !== SessionType.ASYNC) {
            throw new Error(`Invalid session for async handoff: ${sessionId}`);
        }
        const handoffId = this.generateHandoffId();
        const now = new Date();
        const expiresAt = new Date(now.getTime() + expiryHours * 60 * 60 * 1000);
        const handoff = {
            id: handoffId,
            fromParticipant: fromParticipantId,
            toParticipant: toParticipantId,
            context: contextItems,
            message,
            timestamp: now,
            status: 'pending',
            expiresAt,
        };
        // Store handoff (implementation would depend on persistence layer)
        // For now, emit event for external handling
        this.emit('asyncHandoffCreated', { session, handoff });
        return handoff;
    }
    /**
     * Get session metrics and analytics
     */
    async getSessionMetrics(sessionId) {
        const session = this.activeSessions.get(sessionId);
        if (!session) {
            throw new Error(`Session ${sessionId} not found`);
        }
        const events = await this.eventBus.getSessionEvents(sessionId);
        const currentTime = new Date().getTime();
        const sessionDuration = currentTime - session.createdAt.getTime();
        // Calculate participation metrics
        const participantDurations = new Map();
        const participantActivities = new Map();
        for (const participant of session.participants) {
            const joinTime = participant.joinedAt.getTime();
            const leaveTime = participant.isOnline ? currentTime : participant.lastActive.getTime();
            participantDurations.set(participant.id, leaveTime - joinTime);
            participantActivities.set(participant.id, 0);
        }
        // Count activities per participant
        for (const event of events) {
            const current = participantActivities.get(event.participantId) || 0;
            participantActivities.set(event.participantId, current + 1);
        }
        const mostActiveParticipant = Array.from(participantActivities.entries())
            .sort(([, a], [, b]) => b - a)[0]?.[0] || session.host.id;
        // Count events by type
        const editEvents = events.filter(e => e.type === CollaborationEventType.CODE_EDIT).length;
        const messageEvents = events.filter(e => e.type === CollaborationEventType.MESSAGE_SENT).length;
        const contextEvents = events.filter(e => e.type === CollaborationEventType.CONTEXT_SHARED).length;
        const conflictEvents = events.filter(e => e.type === CollaborationEventType.CONFLICT_DETECTED).length;
        const resolvedConflicts = events.filter(e => e.type === CollaborationEventType.CONFLICT_RESOLVED).length;
        return {
            sessionId,
            participation: {
                totalParticipants: session.participants.length,
                avgDurationPerParticipant: Array.from(participantDurations.values())
                    .reduce((sum, duration) => sum + duration, 0) / session.participants.length,
                mostActiveParticipant,
            },
            activity: {
                totalEdits: editEvents,
                totalMessages: messageEvents,
                totalContextShared: contextEvents,
                totalConflicts: conflictEvents,
                conflictResolutionRate: conflictEvents > 0 ? (resolvedConflicts / conflictEvents) * 100 : 100,
            },
            effectiveness: {
                avgResponseTimeMs: this.calculateAverageResponseTime(events),
                contextSharingRate: contextEvents / (sessionDuration / (1000 * 60 * 60)), // per hour
                productivityScore: this.calculateProductivityScore(session, events),
            },
        };
    }
    /**
     * Get active sessions
     */
    getActiveSessions() {
        return Array.from(this.activeSessions.values())
            .filter(session => session.status === SessionStatus.ACTIVE);
    }
    /**
     * Get session by ID
     */
    getSession(sessionId) {
        return this.activeSessions.get(sessionId);
    }
    /**
     * Update session status
     */
    async updateSessionStatus(sessionId, status) {
        const session = this.activeSessions.get(sessionId);
        if (!session) {
            return;
        }
        const previousStatus = session.status;
        session.status = status;
        session.lastActivity = new Date();
        this.emit('statusChanged', { session, previousStatus, newStatus: status });
    }
    /**
     * Set up event listeners
     */
    setupEventListeners() {
        this.conflictResolver.on('conflictDetected', async (conflict) => {
            const session = this.activeSessions.get(conflict.sessionId);
            if (session) {
                session.activeConflicts.push(conflict);
                this.emit('conflictDetected', { session, conflict });
            }
        });
        this.conflictResolver.on('conflictResolved', async (conflict) => {
            const session = this.activeSessions.get(conflict.sessionId);
            if (session) {
                const index = session.activeConflicts.findIndex(c => c.id === conflict.id);
                if (index >= 0) {
                    session.activeConflicts.splice(index, 1);
                }
                this.emit('conflictResolved', { session, conflict });
            }
        });
    }
    /**
     * Schedule session cleanup after timeout
     */
    scheduleSessionCleanup(sessionId, timeoutMs) {
        const timeout = setTimeout(async () => {
            const session = this.activeSessions.get(sessionId);
            if (session && session.status === SessionStatus.ACTIVE) {
                await this.endSession(sessionId, 'Session timeout');
            }
        }, timeoutMs);
        this.cleanupIntervals.set(sessionId, timeout);
    }
    /**
     * Clean up session resources
     */
    cleanupSession(sessionId) {
        // Clear cleanup timeout
        const timeout = this.cleanupIntervals.get(sessionId);
        if (timeout) {
            clearTimeout(timeout);
            this.cleanupIntervals.delete(sessionId);
        }
        // Remove session from active sessions (keep for historical access)
        // Note: In a production system, you might move this to a historical sessions store
        this.activeSessions.delete(sessionId);
    }
    /**
     * Calculate average response time between participants
     */
    calculateAverageResponseTime(events) {
        // Simplified calculation - would need more sophisticated logic in production
        let totalResponseTime = 0;
        let responseCount = 0;
        for (let i = 1; i < events.length; i++) {
            const current = events[i];
            const previous = events[i - 1];
            if (current.participantId !== previous.participantId) {
                const responseTime = current.timestamp.getTime() - previous.timestamp.getTime();
                totalResponseTime += responseTime;
                responseCount++;
            }
        }
        return responseCount > 0 ? totalResponseTime / responseCount : 0;
    }
    /**
     * Calculate session productivity score
     */
    calculateProductivityScore(session, events) {
        // Productivity score based on various factors (0-100)
        let score = 0;
        // Base score for active participation
        const activeParticipants = session.participants.filter(p => p.isOnline).length;
        score += Math.min(activeParticipants * 10, 50);
        // Score for collaboration activities
        const editEvents = events.filter(e => e.type === CollaborationEventType.CODE_EDIT).length;
        const contextEvents = events.filter(e => e.type === CollaborationEventType.CONTEXT_SHARED).length;
        score += Math.min(editEvents * 2, 30);
        score += Math.min(contextEvents * 3, 20);
        // Penalty for unresolved conflicts
        score -= session.activeConflicts.length * 5;
        return Math.max(0, Math.min(100, score));
    }
    /**
     * Generate unique session ID
     */
    generateSessionId() {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    /**
     * Generate unique event ID
     */
    generateEventId() {
        return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    /**
     * Generate unique handoff ID
     */
    generateHandoffId() {
        return `handoff_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    /**
     * Cleanup all resources
     */
    destroy() {
        // Clear all timeouts
        for (const timeout of this.cleanupIntervals.values()) {
            clearTimeout(timeout);
        }
        this.cleanupIntervals.clear();
        // Clear all sessions
        this.activeSessions.clear();
        // Remove all listeners
        this.removeAllListeners();
    }
}
//# sourceMappingURL=SessionManager.js.map