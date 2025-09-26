/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { BudgetEvent, BudgetEventType, EventSeverity } from '../types.js';
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
export declare class BudgetEventSystem {
    private readonly logger;
    private readonly subscriptions;
    private readonly eventQueue;
    private readonly batchTimers;
    private readonly statistics;
    private readonly startTime;
    private subscriptionCounter;
    /**
     * Create new budget event system
     */
    constructor();
    /**
     * Emit a budget event to all matching subscribers
     * @param event - Budget event to emit
     */
    emit(event: BudgetEvent): Promise<void>;
    /**
     * Subscribe to budget events
     * @param handler - Event handler function
     * @param options - Subscription options
     * @returns Subscription object
     */
    subscribe(handler: BudgetEventHandler, options?: EventSubscriptionOptions): EventSubscription;
    /**
     * Unsubscribe from budget events
     * @param subscriptionId - Subscription ID to remove
     * @returns Whether subscription was found and removed
     */
    unsubscribe(subscriptionId: string): boolean;
    /**
     * Create specific event emitters for common scenarios
     */
    createEmitters(): {
        /**
         * Emit limit exceeded event
         */
        limitExceeded: (data: {
            limitType: "daily" | "weekly" | "monthly";
            currentAmount: number;
            limitAmount: number;
            source: string;
        }) => Promise<void>;
        /**
         * Emit warning threshold reached event
         */
        warningThreshold: (data: {
            threshold: number;
            currentUsage: number;
            limitAmount: number;
            source: string;
        }) => Promise<void>;
        /**
         * Emit budget reset event
         */
        budgetReset: (data: {
            resetType: "daily" | "weekly" | "monthly";
            previousUsage: number;
            source: string;
        }) => Promise<void>;
        /**
         * Emit usage updated event
         */
        usageUpdated: (data: {
            previousUsage: number;
            currentUsage: number;
            difference: number;
            source: string;
        }) => Promise<void>;
        /**
         * Emit settings changed event
         */
        settingsChanged: (data: {
            changedFields: string[];
            oldSettings: any;
            newSettings: any;
            source: string;
        }) => Promise<void>;
        /**
         * Emit cost calculated event
         */
        costCalculated: (data: {
            model: string;
            inputTokens: number;
            outputTokens: number;
            totalCost: number;
            source: string;
        }) => Promise<void>;
    };
    /**
     * Get event statistics
     * @returns Current event statistics
     */
    getStatistics(): EventStatistics;
    /**
     * Get active subscriptions
     * @returns Array of active subscriptions (without handlers for security)
     */
    getSubscriptions(): Array<Omit<EventSubscription, 'handler'>>;
    /**
     * Clear all subscriptions and reset statistics
     */
    reset(): void;
    /**
     * Find subscriptions that match the event
     * @param event - Budget event
     * @returns Matching subscriptions
     */
    private findMatchingSubscriptions;
    /**
     * Deliver event directly to subscription
     * @param event - Budget event
     * @param subscription - Event subscription
     */
    private deliverEventToSubscription;
    /**
     * Queue event for batched delivery
     * @param event - Budget event
     * @param subscription - Event subscription
     */
    private queueEventForSubscription;
    /**
     * Set batch delivery timer
     * @param subscriptionId - Subscription ID
     * @param timeout - Timeout in milliseconds
     */
    private setBatchTimer;
    /**
     * Deliver batched events to subscription
     * @param subscriptionId - Subscription ID
     */
    private deliverBatchedEvents;
    /**
     * Update latency statistics
     * @param latency - Event processing latency
     */
    private updateLatencyStatistics;
}
/**
 * Get or create global budget event system
 * @returns Global budget event system instance
 */
export declare function getBudgetEventSystem(): BudgetEventSystem;
/**
 * Factory function to create new budget event system
 * @returns New budget event system instance
 */
export declare function createBudgetEventSystem(): BudgetEventSystem;
