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
import type { CollaborationSession, SessionParticipant, SessionConfig, AsyncHandoff, SessionMetrics } from './types.js';
import type { ContextItem } from '../context/types.js';
/**
 * Main session manager for pair-programming collaboration
 */
export declare class SessionManager extends EventEmitter {
    private activeSessions;
    private conflictResolver;
    private contextSynchronizer;
    private eventBus;
    private sessionRecorder;
    private cleanupIntervals;
    constructor();
    /**
     * Create a new collaboration session
     */
    createSession(hostParticipant: Omit<SessionParticipant, 'joinedAt' | 'lastActive' | 'isOnline'>, config: SessionConfig, sessionName?: string): Promise<CollaborationSession>;
    /**
     * Join an existing collaboration session
     */
    joinSession(sessionId: string, participant: Omit<SessionParticipant, 'joinedAt' | 'lastActive' | 'isOnline'>): Promise<CollaborationSession>;
    /**
     * Leave a collaboration session
     */
    leaveSession(sessionId: string, participantId: string): Promise<void>;
    /**
     * End a collaboration session
     */
    endSession(sessionId: string, reason?: string): Promise<void>;
    /**
     * Share context between participants
     */
    shareContext(sessionId: string, participantId: string, contextItems: ContextItem[]): Promise<void>;
    /**
     * Handle asynchronous collaboration handoff
     */
    createAsyncHandoff(sessionId: string, fromParticipantId: string, toParticipantId: string, message: string, contextItems: ContextItem[], expiryHours?: number): Promise<AsyncHandoff>;
    /**
     * Get session metrics and analytics
     */
    getSessionMetrics(sessionId: string): Promise<SessionMetrics>;
    /**
     * Get active sessions
     */
    getActiveSessions(): CollaborationSession[];
    /**
     * Get session by ID
     */
    getSession(sessionId: string): CollaborationSession | undefined;
    /**
     * Update session status
     */
    private updateSessionStatus;
    /**
     * Set up event listeners
     */
    private setupEventListeners;
    /**
     * Schedule session cleanup after timeout
     */
    private scheduleSessionCleanup;
    /**
     * Clean up session resources
     */
    private cleanupSession;
    /**
     * Calculate average response time between participants
     */
    private calculateAverageResponseTime;
    /**
     * Calculate session productivity score
     */
    private calculateProductivityScore;
    /**
     * Generate unique session ID
     */
    private generateSessionId;
    /**
     * Generate unique event ID
     */
    private generateEventId;
    /**
     * Generate unique handoff ID
     */
    private generateHandoffId;
    /**
     * Cleanup all resources
     */
    destroy(): void;
}
