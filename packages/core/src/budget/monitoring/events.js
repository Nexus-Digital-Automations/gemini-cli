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
  logger = getComponentLogger('BudgetEventManager');
  subscriptions = new Map();
  routingRules = new Map();
  aggregations = new Map();
  eventHistory = [];
  rateLimiters = new Map();
  eventStats = {
    totalEvents: 0,
    eventsByType: {},
    eventsBySeverity: {},
    eventsBySource: {},
    eventsPerMinute: 0,
    activeSubscriptions: 0,
    droppedEvents: 0,
  };
  historyConfig;
  lastStatsUpdate = Date.now();
  recentEventTimes = [];
  constructor(historyConfig = {}) {
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
        }),
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
  emitBudgetEvent(event) {
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
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
  /**
   * Subscribe to budget events with filtering
   */
  subscribe(subscription) {
    const subscriptionWithDefaults = {
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
  unsubscribe(subscriptionId) {
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
  addRoutingRule(rule) {
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
  removeRoutingRule(ruleId) {
    const removed = this.routingRules.delete(ruleId);
    if (removed) {
      this.logger.info('Event routing rule removed', { ruleId });
    }
    return removed;
  }
  /**
   * Add event aggregation configuration
   */
  addAggregation(id, config) {
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
  removeAggregation(id) {
    const removed = this.aggregations.delete(id);
    if (removed) {
      this.logger.info('Event aggregation removed', { aggregationId: id });
    }
    return removed;
  }
  /**
   * Get event history
   */
  getEventHistory(filter) {
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
  getStatistics() {
    this.updateEventsPerMinute();
    return { ...this.eventStats };
  }
  /**
   * Clear event history
   */
  clearHistory() {
    this.eventHistory.length = 0;
    this.logger.info('Event history cleared');
  }
  /**
   * Reset event statistics
   */
  resetStatistics() {
    this.initializeEventStats();
    this.recentEventTimes = [];
    this.logger.info('Event statistics reset');
  }
  /**
   * Get active subscriptions
   */
  getActiveSubscriptions() {
    return Array.from(this.subscriptions.values()).filter((sub) => sub.active);
  }
  /**
   * Get routing rules
   */
  getRoutingRules() {
    return Array.from(this.routingRules.values());
  }
  /**
   * Process subscriptions for an event
   */
  processSubscriptions(event) {
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
              error: error instanceof Error ? error.message : String(error),
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
  processRoutingRules(event) {
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
  processAggregations(event) {
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
  matchesFilter(event, filter) {
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
  checkRateLimit(subscriptionId, rateLimit) {
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
  shouldStoreInHistory(event) {
    return this.historyConfig.types.includes(event.type);
  }
  /**
   * Add event to history
   */
  addToHistory(event) {
    this.eventHistory.push(event);
    // Maintain history limits
    this.cleanupHistory();
  }
  /**
   * Clean up old history entries
   */
  cleanupHistory() {
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
  sendHistoricalEvents(subscription) {
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
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
    }
  }
  /**
   * Update event statistics
   */
  updateEventStatistics(event) {
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
  initializeEventStats() {
    this.eventStats = {
      totalEvents: 0,
      eventsByType: {},
      eventsBySeverity: {},
      eventsBySource: {},
      eventsPerMinute: 0,
      activeSubscriptions: this.subscriptions.size,
      droppedEvents: 0,
    };
  }
  /**
   * Update events per minute calculation
   */
  updateEventsPerMinute() {
    this.eventStats.eventsPerMinute = this.recentEventTimes.length;
  }
  /**
   * Extract field value from event for aggregation
   */
  extractFieldValue(event, field) {
    if (!field) return 1; // Default to counting events
    // Navigate nested object path
    const parts = field.split('.');
    let value = event;
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
  setupPeriodicTasks() {
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
export function createBudgetEventManager(config) {
  return new BudgetEventManager(config);
}
/**
 * Global event manager instance
 */
let globalEventManager = null;
/**
 * Get or create the global event manager instance
 */
export function getGlobalEventManager(config) {
  if (!globalEventManager) {
    globalEventManager = createBudgetEventManager(config);
  }
  return globalEventManager;
}
/**
 * Reset the global event manager instance
 */
export function resetGlobalEventManager() {
  globalEventManager = null;
}
/**
 * Helper function to create a budget event
 */
export function createBudgetEvent(type, source, data, severity) {
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
function getDefaultSeverity(type) {
  switch (type) {
    case 'limit_exceeded':
      return 'critical';
    case 'warning_threshold':
      return 'warning';
    case 'budget_reset':
    case 'usage_updated':
    case 'cost_calculated':
      return 'info';
    default:
      return 'info';
  }
}
//# sourceMappingURL=events.js.map
