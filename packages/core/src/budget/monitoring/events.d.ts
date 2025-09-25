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
export declare class BudgetEventManager extends EventEmitter {
  private readonly logger;
  private readonly subscriptions;
  private readonly routingRules;
  private readonly aggregations;
  private readonly eventHistory;
  private readonly rateLimiters;
  private eventStats;
  private historyConfig;
  private lastStatsUpdate;
  private recentEventTimes;
  constructor(historyConfig?: EventHistoryConfig);
  /**
   * Emit a budget event to all subscribers
   */
  emitBudgetEvent(event: BudgetEvent): void;
  /**
   * Subscribe to budget events with filtering
   */
  subscribe(subscription: Omit<EventSubscription, 'active'>): string;
  /**
   * Unsubscribe from budget events
   */
  unsubscribe(subscriptionId: string): boolean;
  /**
   * Add event routing rule
   */
  addRoutingRule(rule: EventRoutingRule): void;
  /**
   * Remove event routing rule
   */
  removeRoutingRule(ruleId: string): boolean;
  /**
   * Add event aggregation configuration
   */
  addAggregation(id: string, config: EventAggregationConfig): void;
  /**
   * Remove event aggregation
   */
  removeAggregation(id: string): boolean;
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
  }): BudgetEvent[];
  /**
   * Get event statistics
   */
  getStatistics(): EventStatistics;
  /**
   * Clear event history
   */
  clearHistory(): void;
  /**
   * Reset event statistics
   */
  resetStatistics(): void;
  /**
   * Get active subscriptions
   */
  getActiveSubscriptions(): EventSubscription[];
  /**
   * Get routing rules
   */
  getRoutingRules(): EventRoutingRule[];
  /**
   * Process subscriptions for an event
   */
  private processSubscriptions;
  /**
   * Process routing rules for an event
   */
  private processRoutingRules;
  /**
   * Process aggregations for an event
   */
  private processAggregations;
  /**
   * Check if event matches filter
   */
  private matchesFilter;
  /**
   * Check rate limiting for subscription
   */
  private checkRateLimit;
  /**
   * Check if event should be stored in history
   */
  private shouldStoreInHistory;
  /**
   * Add event to history
   */
  private addToHistory;
  /**
   * Clean up old history entries
   */
  private cleanupHistory;
  /**
   * Send historical events to subscriber
   */
  private sendHistoricalEvents;
  /**
   * Update event statistics
   */
  private updateEventStatistics;
  /**
   * Initialize event statistics
   */
  private initializeEventStats;
  /**
   * Update events per minute calculation
   */
  private updateEventsPerMinute;
  /**
   * Extract field value from event for aggregation
   */
  private extractFieldValue;
  /**
   * Setup periodic maintenance tasks
   */
  private setupPeriodicTasks;
}
/**
 * Create a new BudgetEventManager instance
 */
export declare function createBudgetEventManager(
  config?: EventHistoryConfig,
): BudgetEventManager;
/**
 * Get or create the global event manager instance
 */
export declare function getGlobalEventManager(
  config?: EventHistoryConfig,
): BudgetEventManager;
/**
 * Reset the global event manager instance
 */
export declare function resetGlobalEventManager(): void;
/**
 * Helper function to create a budget event
 */
export declare function createBudgetEvent(
  type: BudgetEventType,
  source: string,
  data: Record<string, any>,
  severity?: EventSeverity,
): BudgetEvent;
