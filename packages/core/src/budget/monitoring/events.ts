/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Event handling system for token usage monitoring
 * Provides centralized event management, filtering, and dispatch for budget events
 *
 * @author Claude Code - Real-Time Token Usage Monitoring Agent
 * @version 1.0.0
 */

import { EventEmitter } from 'node:events';
import { getComponentLogger } from '../../utils/logger.js';
import type { BudgetEvent, BudgetEventType, EventSeverity } from '../types.js';

/**
 * Event filter configuration
 */
export interface EventFilter {
  /** Event types to include */
  types?: BudgetEventType[];
  /** Severity levels to include */
  severities?: EventSeverity[];
  /** Source filters */
  sources?: string[];
  /** Custom filter function */
  customFilter?: (event: BudgetEvent) => boolean;
  /** Maximum events per time window */
  rateLimit?: {
    maxEvents: number;
    windowMs: number;
  };
}

/**
 * Event subscription configuration
 */
export interface EventSubscription {
  /** Unique subscription ID */
  id: string;
  /** Event filter */
  filter?: EventFilter;
  /** Event handler function */
  handler: (event: BudgetEvent) => void;
  /** Whether to receive historical events */
  includeHistory?: boolean;
  /** Whether the subscription is active */
  active: boolean;
  /** Subscription metadata */
  metadata?: Record<string, any>;
}

/**
 * Event aggregation configuration
 */
export interface EventAggregationConfig {
  /** Time window for aggregation in milliseconds */
  windowMs: number;
  /** Event types to aggregate */
  types?: BudgetEventType[];
  /** Aggregation strategy */
  strategy: 'count' | 'sum' | 'average' | 'max' | 'min';
  /** Field to aggregate on */
  field?: string;
  /** Handler for aggregated results */
  handler: (aggregatedData: AggregatedEventData) => void;
}

/**
 * Aggregated event data
 */
export interface AggregatedEventData {
  /** Time window start */
  windowStart: Date;
  /** Time window end */
  windowEnd: Date;
  /** Event type */
  eventType: BudgetEventType;
  /** Number of events in window */
  eventCount: number;
  /** Aggregated value */
  aggregatedValue: number;
  /** Aggregation strategy used */
  strategy: string;
  /** Field that was aggregated */
  field?: string;
}

/**
 * Event history configuration
 */
export interface EventHistoryConfig {
  /** Maximum number of events to store */
  maxEvents?: number;
  /** Maximum age of events to store (ms) */
  maxAge?: number;
  /** Event types to store */
  types?: BudgetEventType[];
  /** Whether to persist history to storage */
  persistent?: boolean;
}

/**
 * Event routing rule
 */
export interface EventRoutingRule {
  /** Rule ID */
  id: string;
  /** Rule name */
  name: string;
  /** Event filter for this rule */
  filter: EventFilter;
  /** Target handlers */
  targets: string[];
  /** Rule priority (higher = more priority) */
  priority: number;
  /** Whether rule is active */
  active: boolean;
}

/**
 * Event statistics
 */
export interface EventStatistics {
  /** Total events processed */
  totalEvents: number;
  /** Events by type */
  eventsByType: Record<BudgetEventType, number>;
  /** Events by severity */
  eventsBySeverity: Record<EventSeverity, number>;
  /** Events by source */
  eventsBySource: Record<string, number>;
  /** Events processed per minute */
  eventsPerMinute: number;
  /** Last event timestamp */
  lastEventTime?: Date;
  /** Subscription count */
  activeSubscriptions: number;
  /** Dropped events (due to filters/limits) */
  droppedEvents: number;
}

/**
 * Comprehensive event management system for token usage monitoring
 *
 * This class provides centralized event handling capabilities for the budget
 * monitoring system, including event filtering, aggregation, routing, and
 * subscription management. It enables real-time event processing while
 * maintaining performance through intelligent filtering and rate limiting.
 *
 * Features:
 * - Event filtering and routing
 * - Subscription management with custom handlers
 * - Event aggregation and windowing
 * - Rate limiting to prevent event flooding
 * - Historical event storage and replay
 * - Performance monitoring and statistics
 */
export class BudgetEventManager extends EventEmitter {
  private readonly logger = getComponentLogger('BudgetEventManager');
  private readonly subscriptions = new Map<string, EventSubscription>();
  private readonly routingRules = new Map<string, EventRoutingRule>();
  private readonly aggregations = new Map<string, EventAggregationConfig>();
  private readonly eventHistory: BudgetEvent[] = [];
  private readonly rateLimiters = new Map<
    string,
    { count: number; resetTime: number }
  >();

  private eventStats: EventStatistics = {
    totalEvents: 0,
    eventsByType: {} as Record<BudgetEventType, number>,
    eventsBySeverity: {} as Record<EventSeverity, number>,
    eventsBySource: {},
    eventsPerMinute: 0,
    activeSubscriptions: 0,
    droppedEvents: 0,
  };

  private historyConfig: Required<EventHistoryConfig>;
  private lastStatsUpdate = Date.now();
  private recentEventTimes: number[] = [];

  constructor(historyConfig: EventHistoryConfig = {}) {
    super();

    this.historyConfig = {
      maxEvents: historyConfig.maxEvents ?? 10000,
      maxAge: historyConfig.maxAge ?? 24 * 60 * 60 * 1000, // 24 hours
      types:
        historyConfig.types ??
        Object.values({
          limit_exceeded: 'limit_exceeded',
          warning_threshold: 'warning_threshold',
          budget_reset: 'budget_reset',
          usage_updated: 'usage_updated',
          settings_changed: 'settings_changed',
          cost_calculated: 'cost_calculated',
          session_started: 'session_started',
          session_ended: 'session_ended',
        } as Record<BudgetEventType, BudgetEventType>),
      persistent: historyConfig.persistent ?? false,
    };

    this.logger.info('BudgetEventManager initialized', {
      historyConfig: this.historyConfig,
    });

    this.initializeEventStats();
    this.setupPeriodicTasks();
  }

  /**
   * Emit a budget event to all subscribers
   */
  emitBudgetEvent(event: BudgetEvent): void {
    try {
      // Update statistics
      this.updateEventStatistics(event);

      // Store in history if configured
      if (this.shouldStoreInHistory(event)) {
        this.addToHistory(event);
      }

      // Process routing rules
      this.processRoutingRules(event);

      // Process subscriptions
      this.processSubscriptions(event);

      // Process aggregations
      this.processAggregations(event);

      // Emit to EventEmitter listeners
      this.emit('budget_event', event);
      this.emit(event.type, event);

      this.logger.debug('Budget event emitted', {
        type: event.type,
        source: event.source,
        severity: event.severity,
        subscriptions: this.subscriptions.size,
      });
    } catch (error) {
      this.logger.error('Failed to emit budget event', {
        event,
        errorMessage: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Subscribe to budget events with filtering
   */
  subscribe(subscription: Omit<EventSubscription, 'active'>): string {
    const subscriptionWithDefaults: EventSubscription = {
      active: true,
      includeHistory: false,
      ...subscription,
    };

    this.subscriptions.set(subscription.id, subscriptionWithDefaults);
    this.eventStats.activeSubscriptions = this.subscriptions.size;

    this.logger.info('Event subscription added', {
      subscriptionId: subscription.id,
      filter: subscription.filter,
      includeHistory: subscription.includeHistory,
    });

    // Send historical events if requested
    if (subscriptionWithDefaults.includeHistory) {
      this.sendHistoricalEvents(subscriptionWithDefaults);
    }

    return subscription.id;
  }

  /**
   * Unsubscribe from budget events
   */
  unsubscribe(subscriptionId: string): boolean {
    const removed = this.subscriptions.delete(subscriptionId);
    this.eventStats.activeSubscriptions = this.subscriptions.size;

    if (removed) {
      this.logger.info('Event subscription removed', { subscriptionId });
    }

    return removed;
  }

  /**
   * Add event routing rule
   */
  addRoutingRule(rule: EventRoutingRule): void {
    this.routingRules.set(rule.id, rule);

    this.logger.info('Event routing rule added', {
      ruleId: rule.id,
      name: rule.name,
      filter: rule.filter,
      targets: rule.targets,
      priority: rule.priority,
    });
  }

  /**
   * Remove event routing rule
   */
  removeRoutingRule(ruleId: string): boolean {
    const removed = this.routingRules.delete(ruleId);

    if (removed) {
      this.logger.info('Event routing rule removed', { ruleId });
    }

    return removed;
  }

  /**
   * Add event aggregation configuration
   */
  addAggregation(id: string, config: EventAggregationConfig): void {
    this.aggregations.set(id, config);

    this.logger.info('Event aggregation added', {
      aggregationId: id,
      windowMs: config.windowMs,
      strategy: config.strategy,
      types: config.types,
    });
  }

  /**
   * Remove event aggregation
   */
  removeAggregation(id: string): boolean {
    const removed = this.aggregations.delete(id);

    if (removed) {
      this.logger.info('Event aggregation removed', { aggregationId: id });
    }

    return removed;
  }

  /**
   * Get event history
   */
  getEventHistory(filter?: {
    types?: BudgetEventType[];
    severities?: EventSeverity[];
    sources?: string[];
    startTime?: Date;
    endTime?: Date;
    limit?: number;
  }): BudgetEvent[] {
    let events = this.eventHistory;

    if (filter) {
      events = events.filter((event) => {
        if (filter.types && !filter.types.includes(event.type)) return false;
        if (filter.severities && !filter.severities.includes(event.severity))
          return false;
        if (filter.sources && !filter.sources.includes(event.source))
          return false;
        if (filter.startTime && event.timestamp < filter.startTime)
          return false;
        if (filter.endTime && event.timestamp > filter.endTime) return false;
        return true;
      });

      if (filter.limit && events.length > filter.limit) {
        events = events.slice(-filter.limit); // Get most recent events
      }
    }

    return events;
  }

  /**
   * Get event statistics
   */
  getStatistics(): EventStatistics {
    this.updateEventsPerMinute();
    return { ...this.eventStats };
  }

  /**
   * Clear event history
   */
  clearHistory(): void {
    this.eventHistory.length = 0;
    this.logger.info('Event history cleared');
  }

  /**
   * Reset event statistics
   */
  resetStatistics(): void {
    this.initializeEventStats();
    this.recentEventTimes = [];
    this.logger.info('Event statistics reset');
  }

  /**
   * Get active subscriptions
   */
  getActiveSubscriptions(): EventSubscription[] {
    return Array.from(this.subscriptions.values()).filter((sub) => sub.active);
  }

  /**
   * Get routing rules
   */
  getRoutingRules(): EventRoutingRule[] {
    return Array.from(this.routingRules.values());
  }

  /**
   * Process subscriptions for an event
   */
  private processSubscriptions(event: BudgetEvent): void {
    for (const subscription of this.subscriptions.values()) {
      if (!subscription.active) continue;

      if (this.matchesFilter(event, subscription.filter)) {
        if (
          this.checkRateLimit(subscription.id, subscription.filter?.rateLimit)
        ) {
          try {
            subscription.handler(event);
          } catch (error) {
            this.logger.error('Subscription handler failed', {
              subscriptionId: subscription.id,
              errorMessage:
                error instanceof Error ? error.message : String(error),
            });
          }
        } else {
          this.eventStats.droppedEvents++;
        }
      }
    }
  }

  /**
   * Process routing rules for an event
   */
  private processRoutingRules(event: BudgetEvent): void {
    const matchingRules = Array.from(this.routingRules.values())
      .filter((rule) => rule.active && this.matchesFilter(event, rule.filter))
      .sort((a, b) => b.priority - a.priority); // Sort by priority (highest first)

    for (const rule of matchingRules) {
      this.emit(`route:${rule.id}`, event);

      for (const target of rule.targets) {
        this.emit(`target:${target}`, event);
      }
    }
  }

  /**
   * Process aggregations for an event
   */
  private processAggregations(event: BudgetEvent): void {
    for (const [id, config] of this.aggregations.entries()) {
      if (!config.types || config.types.includes(event.type)) {
        // This would require more sophisticated windowing logic
        // For now, we emit immediate aggregation events
        this.emit(`aggregation:${id}`, {
          windowStart: new Date(Date.now() - config.windowMs),
          windowEnd: new Date(),
          eventType: event.type,
          eventCount: 1,
          aggregatedValue: this.extractFieldValue(event, config.field),
          strategy: config.strategy,
          field: config.field,
        });
      }
    }
  }

  /**
   * Check if event matches filter
   */
  private matchesFilter(event: BudgetEvent, filter?: EventFilter): boolean {
    if (!filter) return true;

    if (filter.types && !filter.types.includes(event.type)) return false;
    if (filter.severities && !filter.severities.includes(event.severity))
      return false;
    if (filter.sources && !filter.sources.includes(event.source)) return false;
    if (filter.customFilter && !filter.customFilter(event)) return false;

    return true;
  }

  /**
   * Check rate limiting for subscription
   */
  private checkRateLimit(
    subscriptionId: string,
    rateLimit?: EventFilter['rateLimit'],
  ): boolean {
    if (!rateLimit) return true;

    const now = Date.now();
    const key = `subscription:${subscriptionId}`;
    const limiter = this.rateLimiters.get(key);

    if (!limiter || now > limiter.resetTime) {
      this.rateLimiters.set(key, {
        count: 1,
        resetTime: now + rateLimit.windowMs,
      });
      return true;
    }

    if (limiter.count >= rateLimit.maxEvents) {
      return false;
    }

    limiter.count++;
    return true;
  }

  /**
   * Check if event should be stored in history
   */
  private shouldStoreInHistory(event: BudgetEvent): boolean {
    return this.historyConfig.types.includes(event.type);
  }

  /**
   * Add event to history
   */
  private addToHistory(event: BudgetEvent): void {
    this.eventHistory.push(event);

    // Maintain history limits
    this.cleanupHistory();
  }

  /**
   * Clean up old history entries
   */
  private cleanupHistory(): void {
    const now = Date.now();
    const maxAge = this.historyConfig.maxAge;

    // Remove old events
    while (
      this.eventHistory.length > 0 &&
      now - this.eventHistory[0].timestamp.getTime() > maxAge
    ) {
      this.eventHistory.shift();
    }

    // Remove excess events
    while (this.eventHistory.length > this.historyConfig.maxEvents) {
      this.eventHistory.shift();
    }
  }

  /**
   * Send historical events to subscriber
   */
  private sendHistoricalEvents(subscription: EventSubscription): void {
    const historicalEvents = this.getEventHistory({
      limit: 100, // Limit historical events sent
    });

    for (const event of historicalEvents) {
      if (this.matchesFilter(event, subscription.filter)) {
        try {
          subscription.handler(event);
        } catch (error) {
          this.logger.error('Historical event handler failed', {
            subscriptionId: subscription.id,
            errorMessage:
              error instanceof Error ? error.message : String(error),
          });
        }
      }
    }
  }

  /**
   * Update event statistics
   */
  private updateEventStatistics(event: BudgetEvent): void {
    this.eventStats.totalEvents++;
    this.eventStats.eventsByType[event.type] =
      (this.eventStats.eventsByType[event.type] || 0) + 1;
    this.eventStats.eventsBySeverity[event.severity] =
      (this.eventStats.eventsBySeverity[event.severity] || 0) + 1;
    this.eventStats.eventsBySource[event.source] =
      (this.eventStats.eventsBySource[event.source] || 0) + 1;
    this.eventStats.lastEventTime = event.timestamp;

    // Track recent event times for rate calculation
    this.recentEventTimes.push(event.timestamp.getTime());

    // Keep only last minute of events
    const oneMinuteAgo = Date.now() - 60000;
    this.recentEventTimes = this.recentEventTimes.filter(
      (time) => time > oneMinuteAgo,
    );
  }

  /**
   * Initialize event statistics
   */
  private initializeEventStats(): void {
    this.eventStats = {
      totalEvents: 0,
      eventsByType: {} as Record<BudgetEventType, number>,
      eventsBySeverity: {} as Record<EventSeverity, number>,
      eventsBySource: {},
      eventsPerMinute: 0,
      activeSubscriptions: this.subscriptions.size,
      droppedEvents: 0,
    };
  }

  /**
   * Update events per minute calculation
   */
  private updateEventsPerMinute(): void {
    this.eventStats.eventsPerMinute = this.recentEventTimes.length;
  }

  /**
   * Extract field value from event for aggregation
   */
  private extractFieldValue(event: BudgetEvent, field?: string): number {
    if (!field) return 1; // Default to counting events

    // Navigate nested object path
    const parts = field.split('.');
    let value: unknown = event;

    for (const part of parts) {
      if (value && typeof value === 'object' && part in value) {
        value = value[part];
      } else {
        return 0;
      }
    }

    return typeof value === 'number' ? value : 0;
  }

  /**
   * Setup periodic maintenance tasks
   */
  private setupPeriodicTasks(): void {
    // Cleanup history every 5 minutes
    setInterval(
      () => {
        this.cleanupHistory();
      },
      5 * 60 * 1000,
    );

    // Update statistics every minute
    setInterval(() => {
      this.updateEventsPerMinute();
    }, 60 * 1000);

    // Clean up rate limiters every 10 minutes
    setInterval(
      () => {
        const now = Date.now();
        for (const [key, limiter] of this.rateLimiters.entries()) {
          if (now > limiter.resetTime) {
            this.rateLimiters.delete(key);
          }
        }
      },
      10 * 60 * 1000,
    );
  }
}

/**
 * Create a new BudgetEventManager instance
 */
export function createBudgetEventManager(
  config?: EventHistoryConfig,
): BudgetEventManager {
  return new BudgetEventManager(config);
}

/**
 * Global event manager instance
 */
let globalEventManager: BudgetEventManager | null = null;

/**
 * Get or create the global event manager instance
 */
export function getGlobalEventManager(
  config?: EventHistoryConfig,
): BudgetEventManager {
  if (!globalEventManager) {
    globalEventManager = createBudgetEventManager(config);
  }
  return globalEventManager;
}

/**
 * Reset the global event manager instance
 */
export function resetGlobalEventManager(): void {
  globalEventManager = null;
}

/**
 * Helper function to create a budget event
 */
export function createBudgetEvent(
  type: BudgetEventType,
  source: string,
  data: Record<string, any>,
  severity?: EventSeverity,
): BudgetEvent {
  return {
    type,
    timestamp: new Date(),
    data,
    source,
    severity: severity ?? getDefaultSeverity(type),
  };
}

/**
 * Get default severity for event type
 */
function getDefaultSeverity(type: BudgetEventType): EventSeverity {
  switch (type) {
    case 'limit_exceeded':
      return 'critical' as EventSeverity;
    case 'warning_threshold':
      return 'warning' as EventSeverity;
    case 'budget_reset':
    case 'usage_updated':
    case 'cost_calculated':
      return 'info' as EventSeverity;
    default:
      return 'info' as EventSeverity;
  }
}
