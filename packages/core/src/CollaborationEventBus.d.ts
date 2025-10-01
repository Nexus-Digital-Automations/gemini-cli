/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * @fileoverview Pair-Programming Mode - Collaboration Event Bus
 * Event handling and communication system for collaborative sessions
 *
 * @author Claude Code - Pair-Programming Implementation Agent
 * @version 1.0.0
 */
import { EventEmitter } from 'node:events';
import type { CollaborationEvent } from './types.js';
import { CollaborationEventType } from './types.js';
/**
 * Event bus for collaborative programming sessions
 */
export declare class CollaborationEventBus extends EventEmitter {
    private eventHistory;
    private eventFilters;
    private eventSubscriptions;
    private maxHistoryPerSession;
    constructor();
    /**
     * Publish an event to the collaboration event bus
     */
    publishEvent(event: CollaborationEvent): Promise<void>;
    /**
     * Subscribe to specific events with custom handling
     */
    subscribe(sessionId: string, participantId: string, eventTypes: CollaborationEventType[], handler: EventHandler): string;
    /**
     * Unsubscribe from events
     */
    unsubscribe(subscriptionId: string): boolean;
    /**
     * Get event history for a session
     */
    getSessionEvents(sessionId: string, options?: {
        eventTypes?: CollaborationEventType[];
        participantId?: string;
        startTime?: Date;
        endTime?: Date;
        limit?: number;
    }): CollaborationEvent[];
    /**
     * Get recent events for real-time updates
     */
    getRecentEvents(sessionId: string, sinceTimestamp: Date, participantId?: string): CollaborationEvent[];
    /**
     * Add event filter for preprocessing
     */
    addEventFilter(sessionId: string, filter: EventFilter): void;
    /**
     * Remove event filter
     */
    removeEventFilter(sessionId: string): void;
    /**
     * Broadcast message to all participants in a session
     */
    broadcastToSession(sessionId: string, message: unknown, excludeParticipant?: string): Promise<void>;
    /**
     * Send direct message to specific participant
     */
    sendDirectMessage(sessionId: string, fromParticipantId: string, toParticipantId: string, message: unknown): Promise<void>;
    /**
     * Get event statistics for a session
     */
    getEventStats(sessionId: string): {
        totalEvents: number;
        eventsByType: Record<CollaborationEventType, number>;
        eventsByParticipant: Record<string, number>;
        eventsPerHour: number;
        mostRecentEvent?: Date;
    };
    /**
     * Clean up session events
     */
    cleanupSession(sessionId: string): void;
    /**
     * Get active subscriptions for debugging
     */
    getActiveSubscriptions(): Array<{
        sessionId: string;
        subscriptionCount: number;
        participantIds: string[];
    }>;
    /**
     * Add event to session history
     */
    private addEventToHistory;
    /**
     * Apply filters to events
     */
    private applyFilters;
    /**
     * Notify all relevant subscriptions
     */
    private notifySubscriptions;
    /**
     * Handle individual subscription notification
     */
    private handleSubscriptionNotification;
    /**
     * Generate unique subscription ID
     */
    private generateSubscriptionId;
    /**
     * Generate unique event ID
     */
    private generateEventId;
    /**
     * Destroy all resources
     */
    destroy(): void;
}
/**
 * Event subscription interface
 */
interface EventSubscription {
    id: string;
    sessionId: string;
    participantId: string;
    eventTypes: CollaborationEventType[];
    handler: EventHandler;
    createdAt: Date;
    isActive: boolean;
}
/**
 * Event handler function type
 */
type EventHandler = (event: CollaborationEvent, subscription: EventSubscription) => Promise<void> | void;
/**
 * Event filter function type
 */
type EventFilter = (event: CollaborationEvent) => Promise<CollaborationEvent | null> | CollaborationEvent | null;
export {};
