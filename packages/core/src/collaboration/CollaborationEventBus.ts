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
import type {
  CollaborationEvent,
  SessionParticipant,
} from './types.js';
import { CollaborationEventType } from './types.js';

/**
 * Event bus for collaborative programming sessions
 */
export class CollaborationEventBus extends EventEmitter {
  private eventHistory = new Map<string, CollaborationEvent[]>();
  private eventFilters = new Map<string, EventFilter>();
  private eventSubscriptions = new Map<string, Set<EventSubscription>>();
  private maxHistoryPerSession = 10000; // Maximum events to keep per session

  constructor() {
    super();
    this.setMaxListeners(100); // Support many concurrent sessions
  }

  /**
   * Publish an event to the collaboration event bus
   */
  async publishEvent(event: CollaborationEvent): Promise<void> {
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
  subscribe(
    sessionId: string,
    participantId: string,
    eventTypes: CollaborationEventType[],
    handler: EventHandler
  ): string {
    const subscriptionId = this.generateSubscriptionId();

    const subscription: EventSubscription = {
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

    this.eventSubscriptions.get(sessionId)!.add(subscription);

    return subscriptionId;
  }

  /**
   * Unsubscribe from events
   */
  unsubscribe(subscriptionId: string): boolean {
    for (const [sessionId, subscriptions] of this.eventSubscriptions.entries()) {
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
  getSessionEvents(
    sessionId: string,
    options?: {
      eventTypes?: CollaborationEventType[];
      participantId?: string;
      startTime?: Date;
      endTime?: Date;
      limit?: number;
    }
  ): CollaborationEvent[] {
    const sessionHistory = this.eventHistory.get(sessionId) || [];
    let filteredEvents = [...sessionHistory];

    if (options?.eventTypes) {
      filteredEvents = filteredEvents.filter(event => options.eventTypes!.includes(event.type));
    }

    if (options?.participantId) {
      filteredEvents = filteredEvents.filter(event => event.participantId === options.participantId);
    }

    if (options?.startTime) {
      filteredEvents = filteredEvents.filter(event => event.timestamp >= options.startTime!);
    }

    if (options?.endTime) {
      filteredEvents = filteredEvents.filter(event => event.timestamp <= options.endTime!);
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
  getRecentEvents(
    sessionId: string,
    sinceTimestamp: Date,
    participantId?: string
  ): CollaborationEvent[] {
    return this.getSessionEvents(sessionId, {
      startTime: sinceTimestamp,
      participantId,
      limit: 100, // Reasonable limit for real-time updates
    });
  }

  /**
   * Add event filter for preprocessing
   */
  addEventFilter(sessionId: string, filter: EventFilter): void {
    this.eventFilters.set(sessionId, filter);
  }

  /**
   * Remove event filter
   */
  removeEventFilter(sessionId: string): void {
    this.eventFilters.delete(sessionId);
  }

  /**
   * Broadcast message to all participants in a session
   */
  async broadcastToSession(
    sessionId: string,
    message: unknown,
    excludeParticipant?: string
  ): Promise<void> {
    const event: CollaborationEvent = {
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
  async sendDirectMessage(
    sessionId: string,
    fromParticipantId: string,
    toParticipantId: string,
    message: unknown
  ): Promise<void> {
    const event: CollaborationEvent = {
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
  getEventStats(sessionId: string): {
    totalEvents: number;
    eventsByType: Record<CollaborationEventType, number>;
    eventsByParticipant: Record<string, number>;
    eventsPerHour: number;
    mostRecentEvent?: Date;
  } {
    const events = this.eventHistory.get(sessionId) || [];

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

    let mostRecentEvent: Date | undefined;

    for (const event of events) {
      eventsByType[event.type]++;

      eventsByParticipant[event.participantId] = (eventsByParticipant[event.participantId] || 0) + 1;

      if (!mostRecentEvent || event.timestamp > mostRecentEvent) {
        mostRecentEvent = event.timestamp;
      }
    }

    // Calculate events per hour
    let eventsPerHour = 0;
    if (events.length > 0 && mostRecentEvent) {
      const oldestEvent = events.reduce((oldest, event) =>
        event.timestamp < oldest.timestamp ? event : oldest
      );
      const timeSpanHours = (mostRecentEvent.getTime() - oldestEvent.timestamp.getTime()) / (1000 * 60 * 60);
      eventsPerHour = timeSpanHours > 0 ? events.length / timeSpanHours : events.length;
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
  cleanupSession(sessionId: string): void {
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
  getActiveSubscriptions(): Array<{
    sessionId: string;
    subscriptionCount: number;
    participantIds: string[];
  }> {
    const result: Array<{
      sessionId: string;
      subscriptionCount: number;
      participantIds: string[];
    }> = [];

    for (const [sessionId, subscriptions] of this.eventSubscriptions.entries()) {
      const activeSubscriptions = Array.from(subscriptions).filter(sub => sub.isActive);
      const participantIds = Array.from(new Set(activeSubscriptions.map(sub => sub.participantId)));

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
  private addEventToHistory(event: CollaborationEvent): void {
    if (!this.eventHistory.has(event.sessionId)) {
      this.eventHistory.set(event.sessionId, []);
    }

    const sessionHistory = this.eventHistory.get(event.sessionId)!;
    sessionHistory.push(event);

    // Trim history if it exceeds maximum
    if (sessionHistory.length > this.maxHistoryPerSession) {
      sessionHistory.splice(0, sessionHistory.length - this.maxHistoryPerSession);
    }
  }

  /**
   * Apply filters to events
   */
  private async applyFilters(event: CollaborationEvent): Promise<CollaborationEvent | null> {
    const filter = this.eventFilters.get(event.sessionId);
    if (!filter) {
      return event; // No filter, return original event
    }

    return await filter(event);
  }

  /**
   * Notify all relevant subscriptions
   */
  private async notifySubscriptions(event: CollaborationEvent): Promise<void> {
    const sessionSubscriptions = this.eventSubscriptions.get(event.sessionId);
    if (!sessionSubscriptions) {
      return;
    }

    const notifications: Array<Promise<void>> = [];

    for (const subscription of sessionSubscriptions) {
      if (subscription.isActive && subscription.eventTypes.includes(event.type)) {
        // Don't notify participants of their own events unless explicitly requested
        if (subscription.participantId !== event.participantId ||
            subscription.eventTypes.includes(event.type)) {
          notifications.push(
            this.handleSubscriptionNotification(subscription, event)
          );
        }
      }
    }

    // Wait for all notifications to complete
    await Promise.allSettled(notifications);
  }

  /**
   * Handle individual subscription notification
   */
  private async handleSubscriptionNotification(
    subscription: EventSubscription,
    event: CollaborationEvent
  ): Promise<void> {
    try {
      await subscription.handler(event, subscription);
    } catch (error) {
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
  private generateSubscriptionId(): string {
    return `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique event ID
   */
  private generateEventId(): string {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Destroy all resources
   */
  destroy(): void {
    // Clear all data
    this.eventHistory.clear();
    this.eventFilters.clear();
    this.eventSubscriptions.clear();

    // Remove all listeners
    this.removeAllListeners();
  }
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