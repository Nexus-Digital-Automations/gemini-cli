/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { EventEmitter } from 'node:events';
import { getComponentLogger } from '@google/gemini-cli-core/src/utils/logger.js';
/**
 * Event types for the status update system
 */
export var StatusEventType;
(function (StatusEventType) {
    StatusEventType["TASK_REGISTERED"] = "task:registered";
    StatusEventType["TASK_STATUS_CHANGED"] = "task:status-changed";
    StatusEventType["TASK_PROGRESS_UPDATED"] = "task:progress-updated";
    StatusEventType["TASK_COMPLETED"] = "task:completed";
    StatusEventType["TASK_FAILED"] = "task:failed";
    StatusEventType["TASK_BLOCKED"] = "task:blocked";
    StatusEventType["AGENT_REGISTERED"] = "agent:registered";
    StatusEventType["AGENT_STATUS_CHANGED"] = "agent:status-changed";
    StatusEventType["AGENT_HEARTBEAT"] = "agent:heartbeat";
    StatusEventType["AGENT_OFFLINE"] = "agent:offline";
    StatusEventType["SYSTEM_ALERT"] = "system:alert";
    StatusEventType["PERFORMANCE_THRESHOLD"] = "performance:threshold";
})(StatusEventType || (StatusEventType = {}));
/**
 * Status Update Broker - Event-driven notification system
 *
 * Manages real-time status updates, event routing, and notification delivery
 * with comprehensive filtering, batching, and delivery mechanisms.
 */
export class StatusUpdateBroker extends EventEmitter {
    logger;
    subscribers;
    eventQueue;
    batchedEvents;
    webhookQueue;
    processingInterval;
    performanceMetrics;
    constructor() {
        super();
        this.logger = getComponentLogger('StatusUpdateBroker');
        this.subscribers = new Map();
        this.eventQueue = [];
        this.batchedEvents = new Map();
        this.webhookQueue = new Map();
        this.performanceMetrics = {
            totalEvents: 0,
            eventsProcessed: 0,
            deliverySuccessRate: 100,
            averageProcessingTime: 0,
            activeSubscriptions: 0,
        };
        this.setupEventProcessing();
        this.logger.info('StatusUpdateBroker initialized');
    }
    /**
     * Subscribe to status updates with comprehensive filtering options
     */
    subscribe(config) {
        this.subscribers.set(config.subscriberId, config);
        this.performanceMetrics.activeSubscriptions = this.subscribers.size;
        // Initialize batched events storage if needed
        if (config.deliveryMethod === 'batched') {
            this.batchedEvents.set(config.subscriberId, []);
        }
        if (config.deliveryMethod === 'webhook') {
            this.webhookQueue.set(config.subscriberId, []);
        }
        this.emit('subscriber:added', { config });
        this.logger.info('New subscription added', {
            subscriberId: config.subscriberId,
            eventTypes: config.eventTypes,
            deliveryMethod: config.deliveryMethod,
        });
    }
    /**
     * Unsubscribe from status updates
     */
    unsubscribe(subscriberId) {
        const config = this.subscribers.get(subscriberId);
        if (!config)
            return;
        this.subscribers.delete(subscriberId);
        this.batchedEvents.delete(subscriberId);
        this.webhookQueue.delete(subscriberId);
        this.performanceMetrics.activeSubscriptions = this.subscribers.size;
        this.emit('subscriber:removed', { subscriberId });
        this.logger.info('Subscription removed', { subscriberId });
    }
    /**
     * Publish a status event to all relevant subscribers
     */
    async publishEvent(type, data, options = {}) {
        const startTime = Date.now();
        const event = {
            id: this.generateEventId(),
            type,
            timestamp: new Date(),
            source: options.source || 'system',
            data,
            priority: options.priority || 'normal',
            tags: options.tags || [],
        };
        this.eventQueue.push(event);
        this.performanceMetrics.totalEvents++;
        // Process event immediately for real-time subscribers
        await this.processEvent(event);
        const processingTime = Date.now() - startTime;
        this.updateProcessingMetrics(processingTime);
        this.emit('event:published', { event });
        this.logger.debug('Event published', {
            id: event.id,
            type: event.type,
            source: event.source,
            priority: event.priority,
            processingTime,
        });
    }
    /**
     * Get current broker performance metrics
     */
    getMetrics() {
        const batchedSubscribers = Array.from(this.subscribers.values()).filter((config) => config.deliveryMethod === 'batched').length;
        const webhookSubscribers = Array.from(this.subscribers.values()).filter((config) => config.deliveryMethod === 'webhook').length;
        return {
            ...this.performanceMetrics,
            queuedEvents: this.eventQueue.length,
            batchedSubscribers,
            webhookSubscribers,
        };
    }
    /**
     * Get event history with optional filtering
     */
    getEventHistory(filters, limit = 100) {
        let events = [...this.eventQueue];
        if (filters) {
            if (filters.eventTypes) {
                events = events.filter((event) => filters.eventTypes.includes(event.type));
            }
            if (filters.source) {
                events = events.filter((event) => event.source === filters.source);
            }
            if (filters.priority) {
                events = events.filter((event) => event.priority === filters.priority);
            }
            if (filters.tags && filters.tags.length > 0) {
                events = events.filter((event) => filters.tags.some((tag) => event.tags.includes(tag)));
            }
            if (filters.since) {
                events = events.filter((event) => event.timestamp >= filters.since);
            }
        }
        return events
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
            .slice(0, limit);
    }
    /**
     * Force delivery of batched events for a subscriber
     */
    async flushBatchedEvents(subscriberId) {
        const events = this.batchedEvents.get(subscriberId);
        const config = this.subscribers.get(subscriberId);
        if (!events || !config || events.length === 0)
            return;
        await this.deliverBatchedEvents(subscriberId, events, config);
        this.batchedEvents.set(subscriberId, []);
        this.logger.info('Batched events flushed', {
            subscriberId,
            eventCount: events.length,
        });
    }
    /**
     * Create a task-specific event publisher
     */
    createTaskEventPublisher(taskId, agentId) {
        return {
            registered: (task) => this.publishEvent(StatusEventType.TASK_REGISTERED, { task, taskId }, {
                source: agentId || 'system',
                tags: ['task', taskId],
            }),
            statusChanged: (task, update) => this.publishEvent(StatusEventType.TASK_STATUS_CHANGED, { task, update, taskId }, {
                source: agentId || update.agentId || 'system',
                priority: update.error ? 'high' : 'normal',
                tags: ['task', taskId, task.type],
            }),
            progressUpdated: (task, progress) => this.publishEvent(StatusEventType.TASK_PROGRESS_UPDATED, { task, taskId, progress }, {
                source: agentId || 'system',
                tags: ['task', taskId, 'progress'],
            }),
            completed: (task, duration) => this.publishEvent(StatusEventType.TASK_COMPLETED, { task, taskId, duration }, {
                source: agentId || 'system',
                priority: 'normal',
                tags: ['task', taskId, 'completed'],
            }),
            failed: (task, error) => this.publishEvent(StatusEventType.TASK_FAILED, { task, taskId, error }, {
                source: agentId || 'system',
                priority: 'high',
                tags: ['task', taskId, 'failed', 'error'],
            }),
            blocked: (task, reason, blockedBy) => this.publishEvent(StatusEventType.TASK_BLOCKED, { task, taskId, reason, blockedBy }, {
                source: agentId || 'system',
                priority: 'high',
                tags: ['task', taskId, 'blocked'],
            }),
        };
    }
    /**
     * Create an agent-specific event publisher
     */
    createAgentEventPublisher(agentId) {
        return {
            registered: (agent) => this.publishEvent(StatusEventType.AGENT_REGISTERED, { agent, agentId }, {
                source: agentId,
                tags: ['agent', agentId],
            }),
            statusChanged: (agent) => this.publishEvent(StatusEventType.AGENT_STATUS_CHANGED, { agent, agentId }, {
                source: agentId,
                tags: ['agent', agentId, agent.status],
            }),
            heartbeat: (agent) => this.publishEvent(StatusEventType.AGENT_HEARTBEAT, { agent, agentId }, {
                source: agentId,
                priority: 'low',
                tags: ['agent', agentId, 'heartbeat'],
            }),
            offline: (agent, reason) => this.publishEvent(StatusEventType.AGENT_OFFLINE, { agent, agentId, reason }, {
                source: agentId,
                priority: 'high',
                tags: ['agent', agentId, 'offline'],
            }),
        };
    }
    // Private methods
    async processEvent(event) {
        const relevantSubscribers = this.getRelevantSubscribers(event);
        for (const [subscriberId, config] of Array.from(relevantSubscribers.entries())) {
            switch (config.deliveryMethod) {
                case 'realtime':
                    await this.deliverRealtimeEvent(subscriberId, event, config);
                    break;
                case 'batched':
                    this.queueBatchedEvent(subscriberId, event);
                    break;
                case 'webhook':
                    this.queueWebhookEvent(subscriberId, event);
                    break;
                default:
                    // Handle unknown delivery methods
                    this.logger.warn(`Unknown delivery method: ${config.deliveryMethod}`, { subscriberId, eventType: event.type });
                    break;
            }
        }
        this.performanceMetrics.eventsProcessed++;
    }
    getRelevantSubscribers(event) {
        const relevantSubscribers = new Map();
        for (const [subscriberId, config] of Array.from(this.subscribers.entries())) {
            // Check if event type matches
            if (!config.eventTypes.includes(event.type))
                continue;
            // Check filters
            if (config.filters) {
                // Priority filter
                if (config.filters.priorityThreshold) {
                    const priorityLevels = ['low', 'normal', 'high', 'critical'];
                    const requiredLevel = priorityLevels.indexOf(config.filters.priorityThreshold);
                    const eventLevel = priorityLevels.indexOf(event.priority);
                    if (eventLevel < requiredLevel)
                        continue;
                }
                // Tags filter
                if (config.filters.tags && config.filters.tags.length > 0) {
                    const hasMatchingTag = config.filters.tags.some((tag) => event.tags.includes(tag));
                    if (!hasMatchingTag)
                        continue;
                }
                // Agent ID filter (if present in event data)
                if (config.filters.agentIds && event.data.agentId) {
                    if (!config.filters.agentIds.includes(event.data.agentId))
                        continue;
                }
            }
            relevantSubscribers.set(subscriberId, config);
        }
        return relevantSubscribers;
    }
    async deliverRealtimeEvent(subscriberId, event, config) {
        try {
            this.emit(`delivery:${subscriberId}`, { event, config });
            this.logger.debug('Realtime event delivered', {
                subscriberId,
                eventId: event.id,
            });
        }
        catch (error) {
            this.logger.error('Realtime delivery failed', {
                subscriberId,
                eventId: event.id,
                error: error,
            });
        }
    }
    queueBatchedEvent(subscriberId, event) {
        const events = this.batchedEvents.get(subscriberId) || [];
        events.push(event);
        this.batchedEvents.set(subscriberId, events);
    }
    queueWebhookEvent(subscriberId, event) {
        const events = this.webhookQueue.get(subscriberId) || [];
        events.push(event);
        this.webhookQueue.set(subscriberId, events);
    }
    async deliverBatchedEvents(subscriberId, events, config) {
        try {
            this.emit(`batch:${subscriberId}`, { events, config });
            this.logger.info('Batched events delivered', {
                subscriberId,
                eventCount: events.length,
            });
        }
        catch (error) {
            this.logger.error('Batched delivery failed', {
                subscriberId,
                eventCount: events.length,
                error: error,
            });
        }
    }
    setupEventProcessing() {
        // Process batched events every 5 seconds by default
        this.processingInterval = setInterval(() => {
            this.processBatchedEvents();
            this.processWebhookEvents();
            this.cleanupOldEvents();
        }, 5000);
    }
    async processBatchedEvents() {
        for (const [subscriberId, config] of Array.from(this.subscribers.entries())) {
            if (config.deliveryMethod !== 'batched')
                continue;
            const events = this.batchedEvents.get(subscriberId);
            if (!events || events.length === 0)
                continue;
            const batchInterval = config.batchInterval || 30000; // 30 seconds default
            const now = Date.now();
            const oldestEvent = events[0];
            if (now - oldestEvent.timestamp.getTime() >= batchInterval) {
                await this.deliverBatchedEvents(subscriberId, events, config);
                this.batchedEvents.set(subscriberId, []);
            }
        }
    }
    async processWebhookEvents() {
        // Webhook processing would be implemented here
        // For now, we'll just emit events that can be handled by external webhook delivery systems
        for (const [subscriberId, events] of Array.from(this.webhookQueue.entries())) {
            if (events.length === 0)
                continue;
            const config = this.subscribers.get(subscriberId);
            if (!config || config.deliveryMethod !== 'webhook')
                continue;
            this.emit(`webhook:${subscriberId}`, { events, config });
            this.webhookQueue.set(subscriberId, []);
        }
    }
    cleanupOldEvents() {
        // Keep only last 1000 events to prevent memory bloat
        if (this.eventQueue.length > 1000) {
            this.eventQueue = this.eventQueue.slice(-1000);
        }
    }
    generateEventId() {
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 8);
        return `event_${timestamp}_${randomString}`;
    }
    updateProcessingMetrics(processingTime) {
        const totalProcessingTime = this.performanceMetrics.averageProcessingTime *
            this.performanceMetrics.eventsProcessed +
            processingTime;
        this.performanceMetrics.averageProcessingTime =
            totalProcessingTime / (this.performanceMetrics.eventsProcessed + 1);
    }
    /**
     * Cleanup resources
     */
    destroy() {
        if (this.processingInterval) {
            clearInterval(this.processingInterval);
        }
        this.removeAllListeners();
        this.subscribers.clear();
        this.eventQueue.length = 0;
        this.batchedEvents.clear();
        this.webhookQueue.clear();
        this.logger.info('StatusUpdateBroker destroyed');
    }
}
/**
 * Singleton instance for global access
 */
export const statusUpdateBroker = new StatusUpdateBroker();
//# sourceMappingURL=StatusUpdateBroker.js.map