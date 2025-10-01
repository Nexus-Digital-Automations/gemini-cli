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
import { CollaborationEventType } from './types.js';
/**
 * Event bus for collaborative programming sessions
 */
export class CollaborationEventBus extends EventEmitter {
    eventHistory = new Map();
    eventFilters = new Map();
    eventSubscriptions = new Map();
    maxHistoryPerSession = 10000; // Maximum events to keep per session
    constructor() {
        super();
        this.setMaxListeners(100); // Support many concurrent sessions
    }
    /**
     * Publish an event to the collaboration event bus
     */
    async publishEvent(event) {
        // Store event in history
        this.addEventToHistory(event);
        // Apply filters if any
        const filteredEvent = await this.applyFilters(event);
        if (!filteredEvent) {
            return; // Event was filtered out
        }
        // Emit event to general listeners
        this.emit('collaborationEvent', filteredEvent);
        // Emit specific event type
        this.emit(event.type, filteredEvent);
        // Emit session-specific event
        this.emit(`session:${event.sessionId}`, filteredEvent);
        // Notify subscriptions
        await this.notifySubscriptions(filteredEvent);
        // Emit event published confirmation
        this.emit('eventPublished', {
            eventId: event.id,
            sessionId: event.sessionId,
            eventType: event.type,
            timestamp: new Date(),
        });
    }
    /**
     * Subscribe to specific events with custom handling
     */
    subscribe(sessionId, participantId, eventTypes, handler) {
        const subscriptionId = this.generateSubscriptionId();
        const subscription = {
            id: subscriptionId,
            sessionId,
            participantId,
            eventTypes,
            handler,
            createdAt: new Date(),
            isActive: true,
        };
        if (!this.eventSubscriptions.has(sessionId)) {
            this.eventSubscriptions.set(sessionId, new Set());
        }
        this.eventSubscriptions.get(sessionId).add(subscription);
        return subscriptionId;
    }
    /**
     * Unsubscribe from events
     */
    unsubscribe(subscriptionId) {
        for (const [sessionId, subscriptions,] of this.eventSubscriptions.entries()) {
            for (const subscription of subscriptions) {
                if (subscription.id === subscriptionId) {
                    subscription.isActive = false;
                    subscriptions.delete(subscription);
                    // Clean up empty session subscriptions
                    if (subscriptions.size === 0) {
                        this.eventSubscriptions.delete(sessionId);
                    }
                    return true;
                }
            }
        }
        return false;
    }
    /**
     * Get event history for a session
     */
    getSessionEvents(sessionId, options) {
        const sessionHistory = this.eventHistory.get(sessionId) || [];
        let filteredEvents = [...sessionHistory];
        if (options?.eventTypes) {
            filteredEvents = filteredEvents.filter((event) => options.eventTypes.includes(event.type));
        }
        if (options?.participantId) {
            filteredEvents = filteredEvents.filter((event) => event.participantId === options.participantId);
        }
        if (options?.startTime) {
            filteredEvents = filteredEvents.filter((event) => event.timestamp >= options.startTime);
        }
        if (options?.endTime) {
            filteredEvents = filteredEvents.filter((event) => event.timestamp <= options.endTime);
        }
        // Sort by timestamp (most recent first)
        filteredEvents.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        if (options?.limit && options.limit > 0) {
            filteredEvents = filteredEvents.slice(0, options.limit);
        }
        return filteredEvents;
    }
    /**
     * Get recent events for real-time updates
     */
    getRecentEvents(sessionId, sinceTimestamp, participantId) {
        return this.getSessionEvents(sessionId, {
            startTime: sinceTimestamp,
            participantId,
            limit: 100, // Reasonable limit for real-time updates
        });
    }
    /**
     * Add event filter for preprocessing
     */
    addEventFilter(sessionId, filter) {
        this.eventFilters.set(sessionId, filter);
    }
    /**
     * Remove event filter
     */
    removeEventFilter(sessionId) {
        this.eventFilters.delete(sessionId);
    }
    /**
     * Broadcast message to all participants in a session
     */
    async broadcastToSession(sessionId, message, excludeParticipant) {
        const event = {
            id: this.generateEventId(),
            type: CollaborationEventType.MESSAGE_SENT,
            sessionId,
            participantId: 'system',
            timestamp: new Date(),
            data: {
                message,
                broadcast: true,
                excludeParticipant,
            },
        };
        await this.publishEvent(event);
    }
    /**
     * Send direct message to specific participant
     */
    async sendDirectMessage(sessionId, fromParticipantId, toParticipantId, message) {
        const event = {
            id: this.generateEventId(),
            type: CollaborationEventType.MESSAGE_SENT,
            sessionId,
            participantId: fromParticipantId,
            timestamp: new Date(),
            data: {
                message,
                direct: true,
                targetParticipant: toParticipantId,
            },
        };
        await this.publishEvent(event);
    }
    /**
     * Get event statistics for a session
     */
    getEventStats(sessionId) {
        const events = this.eventHistory.get(sessionId) || [];
        const eventsByType = {
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
        const eventsByParticipant = {};
        let mostRecentEvent;
        for (const event of events) {
            eventsByType[event.type]++;
            eventsByParticipant[event.participantId] =
                (eventsByParticipant[event.participantId] || 0) + 1;
            if (!mostRecentEvent || event.timestamp > mostRecentEvent) {
                mostRecentEvent = event.timestamp;
            }
        }
        // Calculate events per hour
        let eventsPerHour = 0;
        if (events.length > 0 && mostRecentEvent) {
            const oldestEvent = events.reduce((oldest, event) => event.timestamp < oldest.timestamp ? event : oldest);
            const timeSpanHours = (mostRecentEvent.getTime() - oldestEvent.timestamp.getTime()) /
                (1000 * 60 * 60);
            eventsPerHour =
                timeSpanHours > 0 ? events.length / timeSpanHours : events.length;
        }
        return {
            totalEvents: events.length,
            eventsByType,
            eventsByParticipant,
            eventsPerHour,
            mostRecentEvent,
        };
    }
    /**
     * Clean up session events
     */
    cleanupSession(sessionId) {
        this.eventHistory.delete(sessionId);
        this.eventFilters.delete(sessionId);
        this.eventSubscriptions.delete(sessionId);
        // Remove session-specific listeners
        this.removeAllListeners(`session:${sessionId}`);
        this.emit('sessionCleanedup', { sessionId, timestamp: new Date() });
    }
    /**
     * Get active subscriptions for debugging
     */
    getActiveSubscriptions() {
        const result = [];
        for (const [sessionId, subscriptions,] of this.eventSubscriptions.entries()) {
            const activeSubscriptions = Array.from(subscriptions).filter((sub) => sub.isActive);
            const participantIds = Array.from(new Set(activeSubscriptions.map((sub) => sub.participantId)));
            result.push({
                sessionId,
                subscriptionCount: activeSubscriptions.length,
                participantIds,
            });
        }
        return result;
    }
    /**
     * Add event to session history
     */
    addEventToHistory(event) {
        if (!this.eventHistory.has(event.sessionId)) {
            this.eventHistory.set(event.sessionId, []);
        }
        const sessionHistory = this.eventHistory.get(event.sessionId);
        sessionHistory.push(event);
        // Trim history if it exceeds maximum
        if (sessionHistory.length > this.maxHistoryPerSession) {
            sessionHistory.splice(0, sessionHistory.length - this.maxHistoryPerSession);
        }
    }
    /**
     * Apply filters to events
     */
    async applyFilters(event) {
        const filter = this.eventFilters.get(event.sessionId);
        if (!filter) {
            return event; // No filter, return original event
        }
        return await filter(event);
    }
    /**
     * Notify all relevant subscriptions
     */
    async notifySubscriptions(event) {
        const sessionSubscriptions = this.eventSubscriptions.get(event.sessionId);
        if (!sessionSubscriptions) {
            return;
        }
        const notifications = [];
        for (const subscription of sessionSubscriptions) {
            if (subscription.isActive &&
                subscription.eventTypes.includes(event.type)) {
                // Don't notify participants of their own events unless explicitly requested
                if (subscription.participantId !== event.participantId ||
                    subscription.eventTypes.includes(event.type)) {
                    notifications.push(this.handleSubscriptionNotification(subscription, event));
                }
            }
        }
        // Wait for all notifications to complete
        await Promise.allSettled(notifications);
    }
    /**
     * Handle individual subscription notification
     */
    async handleSubscriptionNotification(subscription, event) {
        try {
            await subscription.handler(event, subscription);
        }
        catch (error) {
            console.error(`Error in event subscription handler ${subscription.id}:`, error);
            // Emit error event for debugging
            this.emit('subscriptionError', {
                subscriptionId: subscription.id,
                sessionId: subscription.sessionId,
                participantId: subscription.participantId,
                eventId: event.id,
                error: error.message,
                timestamp: new Date(),
            });
        }
    }
    /**
     * Generate unique subscription ID
     */
    generateSubscriptionId() {
        return `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    /**
     * Generate unique event ID
     */
    generateEventId() {
        return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    /**
     * Destroy all resources
     */
    destroy() {
        // Clear all data
        this.eventHistory.clear();
        this.eventFilters.clear();
        this.eventSubscriptions.clear();
        // Remove all listeners
        this.removeAllListeners();
    }
}
//# sourceMappingURL=CollaborationEventBus.js.map