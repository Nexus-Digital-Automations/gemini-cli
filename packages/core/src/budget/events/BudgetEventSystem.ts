/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Budget event system for real-time notifications and monitoring
 * Provides comprehensive event management for budget-related activities
 *
 * @author Claude Code - Budget Core Infrastructure Agent
 * @version 1.0.0
 */

import { createLogger } from '../../utils/logger.js';
import type { BudgetEvent, BudgetSettings } from '../types.js';
import { BudgetEventType, EventSeverity } from '../types.js';

/**
 * Event handler function type
 */
export type BudgetEventHandler = (event: BudgetEvent) => void | Promise<void>;

/**
 * Event subscription options
 */
export interface EventSubscriptionOptions {
  /** Event type filter */
  eventType?: BudgetEventType | BudgetEventType[];
  /** Severity level filter */
  severityLevel?: EventSeverity | EventSeverity[];
  /** Source filter */
  source?: string | string[];
  /** Maximum events per handler call */
  batchSize?: number;
  /** Batch timeout in milliseconds */
  batchTimeout?: number;
  /** Whether to receive events immediately or batched */
  immediate?: boolean;
}

/**
 * Event subscription
 */
export interface EventSubscription {
  /** Unique subscription ID */
  id: string;
  /** Event handler function */
  handler: BudgetEventHandler;
  /** Subscription options */
  options: EventSubscriptionOptions;
  /** Creation timestamp */
  createdAt: Date;
  /** Last event received timestamp */
  lastEventAt?: Date;
  /** Number of events processed */
  eventCount: number;
  /** Whether subscription is active */
  active: boolean;
}

/**
 * Event queue entry for batching
 */
interface QueuedEvent {
  event: BudgetEvent;
  timestamp: Date;
  subscriptionId: string;
}

/**
 * Event statistics
 */
export interface EventStatistics {
  /** Total events emitted */
  totalEvents: number;
  /** Events by type */
  eventsByType: Record<BudgetEventType, number>;
  /** Events by severity */
  eventsBySeverity: Record<EventSeverity, number>;
  /** Active subscriptions */
  activeSubscriptions: number;
  /** Average events per minute */
  averageEventsPerMinute: number;
  /** Event processing latency (milliseconds) */
  averageLatency: number;
  /** Failed event deliveries */
  failedDeliveries: number;
}

/**
 * Comprehensive budget event system with filtering, batching, and monitoring
 */
export class BudgetEventSystem {
  private readonly logger;
  private readonly subscriptions = new Map<string, EventSubscription>();
  private readonly eventQueue = new Map<string, QueuedEvent[]>();
  private readonly batchTimers = new Map<string, NodeJS.Timeout>();
  private readonly statistics: EventStatistics;
  private readonly startTime = Date.now();
  private subscriptionCounter = 0;

  /**
   * Create new budget event system
   */
  constructor() {
    this.logger = createLogger().child({ component: 'BudgetEventSystem' });

    this.statistics = {
      totalEvents: 0,
      eventsByType: {} as Record<BudgetEventType, number>,
      eventsBySeverity: {} as Record<EventSeverity, number>,
      activeSubscriptions: 0,
      averageEventsPerMinute: 0,
      averageLatency: 0,
      failedDeliveries: 0,
    };

    // Initialize statistics counters
    Object.values(BudgetEventType).forEach((type) => {
      this.statistics.eventsByType[type] = 0;
    });

    Object.values(EventSeverity).forEach((severity) => {
      this.statistics.eventsBySeverity[severity] = 0;
    });

    this.logger.info('Budget event system initialized');
  }

  /**
   * Emit a budget event to all matching subscribers
   * @param event - Budget event to emit
   */
  async emit(event: BudgetEvent): Promise<void> {
    const start = Date.now();

    try {
      this.logger.debug('Emitting budget event', {
        type: event.type,
        severity: event.severity,
        source: event.source,
      });

      // Update statistics
      this.statistics.totalEvents++;
      this.statistics.eventsByType[event.type]++;
      this.statistics.eventsBySeverity[event.severity]++;

      // Find matching subscriptions
      const matchingSubscriptions = this.findMatchingSubscriptions(event);

      if (matchingSubscriptions.length === 0) {
        this.logger.debug('No matching subscriptions for event', {
          type: event.type,
          severity: event.severity,
        });
        return;
      }

      // Process each matching subscription
      const promises: Array<Promise<void>> = [];

      for (const subscription of matchingSubscriptions) {
        if (subscription.options.immediate !== false) {
          // Immediate delivery
          promises.push(this.deliverEventToSubscription(event, subscription));
        } else {
          // Batched delivery
          this.queueEventForSubscription(event, subscription);
        }
      }

      // Wait for immediate deliveries
      await Promise.all(promises);

      // Update latency statistics
      const latency = Date.now() - start;
      this.updateLatencyStatistics(latency);

      this.logger.debug('Event emitted successfully', {
        type: event.type,
        matchingSubscriptions: matchingSubscriptions.length,
        latency,
      });
    } catch (error) {
      this.logger.error('Failed to emit event', {
        error: error as Error,
        eventType: event.type,
      });
      throw error;
    }
  }

  /**
   * Subscribe to budget events
   * @param handler - Event handler function
   * @param options - Subscription options
   * @returns Subscription object
   */
  subscribe(
    handler: BudgetEventHandler,
    options: EventSubscriptionOptions = {},
  ): EventSubscription {
    const id = `sub_${++this.subscriptionCounter}_${Date.now()}`;

    const subscription: EventSubscription = {
      id,
      handler,
      options: {
        immediate: true,
        batchSize: 10,
        batchTimeout: 1000,
        ...options,
      },
      createdAt: new Date(),
      eventCount: 0,
      active: true,
    };

    this.subscriptions.set(id, subscription);
    this.statistics.activeSubscriptions++;

    this.logger.info('New event subscription created', {
      subscriptionId: id,
      eventType: options.eventType,
      severityLevel: options.severityLevel,
      immediate: subscription.options.immediate,
    });

    return subscription;
  }

  /**
   * Unsubscribe from budget events
   * @param subscriptionId - Subscription ID to remove
   * @returns Whether subscription was found and removed
   */
  unsubscribe(subscriptionId: string): boolean {
    const subscription = this.subscriptions.get(subscriptionId);

    if (!subscription) {
      return false;
    }

    // Mark as inactive
    subscription.active = false;

    // Clear any pending batch timer
    const timer = this.batchTimers.get(subscriptionId);
    if (timer) {
      clearTimeout(timer);
      this.batchTimers.delete(subscriptionId);
    }

    // Remove queued events
    this.eventQueue.delete(subscriptionId);

    // Remove subscription
    this.subscriptions.delete(subscriptionId);
    this.statistics.activeSubscriptions--;

    this.logger.info('Event subscription removed', {
      subscriptionId,
      eventCount: subscription.eventCount,
    });

    return true;
  }

  /**
   * Create specific event emitters for common scenarios
   */
  createEmitters() {
    return {
      /**
       * Emit limit exceeded event
       */
      limitExceeded: (data: {
        limitType: 'daily' | 'weekly' | 'monthly';
        currentAmount: number;
        limitAmount: number;
        source: string;
      }) =>
        this.emit({
          type: BudgetEventType.LIMIT_EXCEEDED,
          timestamp: new Date(),
          data,
          source: data.source,
          severity: EventSeverity.CRITICAL,
        }),

      /**
       * Emit warning threshold reached event
       */
      warningThreshold: (data: {
        threshold: number;
        currentUsage: number;
        limitAmount: number;
        source: string;
      }) =>
        this.emit({
          type: BudgetEventType.WARNING_THRESHOLD,
          timestamp: new Date(),
          data,
          source: data.source,
          severity: EventSeverity.WARNING,
        }),

      /**
       * Emit budget reset event
       */
      budgetReset: (data: {
        resetType: 'daily' | 'weekly' | 'monthly';
        previousUsage: number;
        source: string;
      }) =>
        this.emit({
          type: BudgetEventType.BUDGET_RESET,
          timestamp: new Date(),
          data,
          source: data.source,
          severity: EventSeverity.INFO,
        }),

      /**
       * Emit usage updated event
       */
      usageUpdated: (data: {
        previousUsage: number;
        currentUsage: number;
        difference: number;
        source: string;
      }) =>
        this.emit({
          type: BudgetEventType.USAGE_UPDATED,
          timestamp: new Date(),
          data,
          source: data.source,
          severity: EventSeverity.INFO,
        }),

      /**
       * Emit settings changed event
       */
      settingsChanged: (data: {
        changedFields: string[];
        oldSettings: BudgetSettings;
        newSettings: BudgetSettings;
        source: string;
      }) =>
        this.emit({
          type: BudgetEventType.SETTINGS_CHANGED,
          timestamp: new Date(),
          data,
          source: data.source,
          severity: EventSeverity.INFO,
        }),

      /**
       * Emit cost calculated event
       */
      costCalculated: (data: {
        model: string;
        inputTokens: number;
        outputTokens: number;
        totalCost: number;
        source: string;
      }) =>
        this.emit({
          type: BudgetEventType.COST_CALCULATED,
          timestamp: new Date(),
          data,
          source: data.source,
          severity: EventSeverity.INFO,
        }),
    };
  }

  /**
   * Get event statistics
   * @returns Current event statistics
   */
  getStatistics(): EventStatistics {
    const runtime = Date.now() - this.startTime;
    const runtimeMinutes = runtime / (1000 * 60);

    return {
      ...this.statistics,
      averageEventsPerMinute:
        runtimeMinutes > 0 ? this.statistics.totalEvents / runtimeMinutes : 0,
    };
  }

  /**
   * Get active subscriptions
   * @returns Array of active subscriptions (without handlers for security)
   */
  getSubscriptions(): Array<Omit<EventSubscription, 'handler'>> {
    return Array.from(this.subscriptions.values())
      .filter((sub) => sub.active)
      .map(({ handler: _handler, ...subscription }) => subscription);
  }

  /**
   * Clear all subscriptions and reset statistics
   */
  reset(): void {
    // Clear all timers
    for (const timer of this.batchTimers.values()) {
      clearTimeout(timer);
    }

    this.subscriptions.clear();
    this.eventQueue.clear();
    this.batchTimers.clear();

    // Reset statistics
    this.statistics.totalEvents = 0;
    this.statistics.activeSubscriptions = 0;
    this.statistics.averageEventsPerMinute = 0;
    this.statistics.averageLatency = 0;
    this.statistics.failedDeliveries = 0;

    Object.values(BudgetEventType).forEach((type) => {
      this.statistics.eventsByType[type] = 0;
    });

    Object.values(EventSeverity).forEach((severity) => {
      this.statistics.eventsBySeverity[severity] = 0;
    });

    this.logger.info('Budget event system reset');
  }

  /**
   * Find subscriptions that match the event
   * @param event - Budget event
   * @returns Matching subscriptions
   */
  private findMatchingSubscriptions(event: BudgetEvent): EventSubscription[] {
    const matching: EventSubscription[] = [];

    for (const subscription of this.subscriptions.values()) {
      if (!subscription.active) continue;

      // Check event type filter
      if (subscription.options.eventType) {
        const allowedTypes = Array.isArray(subscription.options.eventType)
          ? subscription.options.eventType
          : [subscription.options.eventType];

        if (!allowedTypes.includes(event.type)) {
          continue;
        }
      }

      // Check severity filter
      if (subscription.options.severityLevel) {
        const allowedSeverities = Array.isArray(
          subscription.options.severityLevel,
        )
          ? subscription.options.severityLevel
          : [subscription.options.severityLevel];

        if (!allowedSeverities.includes(event.severity)) {
          continue;
        }
      }

      // Check source filter
      if (subscription.options.source) {
        const allowedSources = Array.isArray(subscription.options.source)
          ? subscription.options.source
          : [subscription.options.source];

        if (!allowedSources.includes(event.source)) {
          continue;
        }
      }

      matching.push(subscription);
    }

    return matching;
  }

  /**
   * Deliver event directly to subscription
   * @param event - Budget event
   * @param subscription - Event subscription
   */
  private async deliverEventToSubscription(
    event: BudgetEvent,
    subscription: EventSubscription,
  ): Promise<void> {
    try {
      await subscription.handler(event);

      subscription.eventCount++;
      subscription.lastEventAt = new Date();

      this.logger.debug('Event delivered to subscription', {
        subscriptionId: subscription.id,
        eventType: event.type,
      });
    } catch (error) {
      this.statistics.failedDeliveries++;

      this.logger.error('Failed to deliver event to subscription', {
        error: error as Error,
        subscriptionId: subscription.id,
        eventType: event.type,
      });
    }
  }

  /**
   * Queue event for batched delivery
   * @param event - Budget event
   * @param subscription - Event subscription
   */
  private queueEventForSubscription(
    event: BudgetEvent,
    subscription: EventSubscription,
  ): void {
    if (!this.eventQueue.has(subscription.id)) {
      this.eventQueue.set(subscription.id, []);
    }

    const queue = this.eventQueue.get(subscription.id)!;
    queue.push({
      event,
      timestamp: new Date(),
      subscriptionId: subscription.id,
    });

    // Check if we should deliver immediately due to batch size
    if (queue.length >= (subscription.options.batchSize || 10)) {
      this.deliverBatchedEvents(subscription.id);
    } else {
      // Set timer for batch timeout
      this.setBatchTimer(
        subscription.id,
        subscription.options.batchTimeout || 1000,
      );
    }
  }

  /**
   * Set batch delivery timer
   * @param subscriptionId - Subscription ID
   * @param timeout - Timeout in milliseconds
   */
  private setBatchTimer(subscriptionId: string, timeout: number): void {
    // Clear existing timer
    const existingTimer = this.batchTimers.get(subscriptionId);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Set new timer
    const timer = setTimeout(() => {
      this.deliverBatchedEvents(subscriptionId);
    }, timeout);

    this.batchTimers.set(subscriptionId, timer);
  }

  /**
   * Deliver batched events to subscription
   * @param subscriptionId - Subscription ID
   */
  private async deliverBatchedEvents(subscriptionId: string): Promise<void> {
    const subscription = this.subscriptions.get(subscriptionId);
    const queue = this.eventQueue.get(subscriptionId);

    if (!subscription || !queue || queue.length === 0) {
      return;
    }

    // Clear timer
    const timer = this.batchTimers.get(subscriptionId);
    if (timer) {
      clearTimeout(timer);
      this.batchTimers.delete(subscriptionId);
    }

    // Extract events
    const events = queue.map((q) => q.event);
    this.eventQueue.set(subscriptionId, []);

    try {
      // Deliver batch (handler should expect array if batching is enabled)
      for (const event of events) {
        await subscription.handler(event);
      }

      subscription.eventCount += events.length;
      subscription.lastEventAt = new Date();

      this.logger.debug('Batched events delivered', {
        subscriptionId,
        eventCount: events.length,
      });
    } catch (error) {
      this.statistics.failedDeliveries += events.length;

      this.logger.error('Failed to deliver batched events', {
        error: error as Error,
        subscriptionId,
        eventCount: events.length,
      });
    }
  }

  /**
   * Update latency statistics
   * @param latency - Event processing latency
   */
  private updateLatencyStatistics(latency: number): void {
    const total =
      this.statistics.averageLatency * (this.statistics.totalEvents - 1);
    this.statistics.averageLatency =
      (total + latency) / this.statistics.totalEvents;
  }
}

/**
 * Global budget event system instance
 */
let globalEventSystem: BudgetEventSystem | null = null;

/**
 * Get or create global budget event system
 * @returns Global budget event system instance
 */
export function getBudgetEventSystem(): BudgetEventSystem {
  if (!globalEventSystem) {
    globalEventSystem = new BudgetEventSystem();
  }
  return globalEventSystem;
}

/**
 * Factory function to create new budget event system
 * @returns New budget event system instance
 */
export function createBudgetEventSystem(): BudgetEventSystem {
  return new BudgetEventSystem();
}
