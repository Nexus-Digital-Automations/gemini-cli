/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { StructuredLogger, getComponentLogger } from '../../../../packages/core/src/utils/logger.js';
import { TaskStatusMonitor, TaskMetadata, TaskStatus, TaskStatusUpdate, AgentStatus, taskStatusMonitor, } from './TaskStatusMonitor.js';
import { StatusUpdateBroker, StatusEvent, StatusEventType, statusUpdateBroker, } from './StatusUpdateBroker.js';
/**
 * Status History & Analytics System
 *
 * Comprehensive tracking and analysis system providing:
 * - Complete status history with detailed audit trails
 * - Advanced analytics and performance metrics
 * - Trend analysis and bottleneck detection
 * - Predictive insights and recommendations
 * - Cross-session persistence and correlation
 */
export class StatusHistoryAnalytics {
    logger;
    statusHistory;
    correlationIndex; // correlationId -> entry IDs
    objectIndex; // objectId -> entry IDs
    agentIndex; // agentId -> entry IDs
    eventTypeIndex;
    analyticsCache;
    persistenceInterval;
    constructor() {
        this.logger = getComponentLogger('StatusHistoryAnalytics');
        this.statusHistory = new Map();
        this.correlationIndex = new Map();
        this.objectIndex = new Map();
        this.agentIndex = new Map();
        this.eventTypeIndex = new Map();
        this.analyticsCache = new Map();
        this.setupEventListeners();
        this.setupPeriodicAnalytics();
        this.logger.info('StatusHistoryAnalytics initialized');
    }
    /**
     * Record a status history entry
     */
    async recordHistoryEntry(eventType, objectType, objectId, options = {}) {
        const entryId = this.generateEntryId();
        const timestamp = new Date();
        const entry = {
            id: entryId,
            timestamp,
            eventType,
            objectType,
            objectId,
            previousState: options.previousState,
            newState: options.newState,
            metadata: options.metadata || {},
            context: {
                agentId: options.agentId,
                sessionId: options.sessionId,
                correlationId: options.correlationId || entryId,
            },
        };
        // Store entry
        this.statusHistory.set(entryId, entry);
        // Update indices
        this.updateIndices(entry);
        // Invalidate relevant analytics cache
        this.invalidateAnalyticsCache([objectType, eventType.toString()]);
        this.logger.debug('Status history entry recorded', {
            entryId,
            eventType,
            objectType,
            objectId,
        });
        return entryId;
    }
    /**
     * Query status history with flexible filtering
     */
    queryHistory(query) {
        let entries = Array.from(this.statusHistory.values());
        // Apply filters
        if (query.objectType) {
            entries = entries.filter((entry) => entry.objectType === query.objectType);
        }
        if (query.objectIds && query.objectIds.length > 0) {
            entries = entries.filter((entry) => query.objectIds.includes(entry.objectId));
        }
        if (query.eventTypes && query.eventTypes.length > 0) {
            entries = entries.filter((entry) => query.eventTypes.includes(entry.eventType));
        }
        if (query.dateRange) {
            entries = entries.filter((entry) => entry.timestamp >= query.dateRange.start &&
                entry.timestamp <= query.dateRange.end);
        }
        if (query.agentIds && query.agentIds.length > 0) {
            entries = entries.filter((entry) => entry.context.agentId &&
                query.agentIds.includes(entry.context.agentId));
        }
        // Sort results
        const sortBy = query.sortBy || 'timestamp';
        const sortOrder = query.sortOrder || 'desc';
        entries.sort((a, b) => {
            let aValue, bValue;
            switch (sortBy) {
                case 'timestamp':
                    aValue = a.timestamp.getTime();
                    bValue = b.timestamp.getTime();
                    break;
                case 'eventType':
                    aValue = a.eventType;
                    bValue = b.eventType;
                    break;
                case 'objectId':
                    aValue = a.objectId;
                    bValue = b.objectId;
                    break;
                default:
                    aValue = a.timestamp.getTime();
                    bValue = b.timestamp.getTime();
            }
            const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
            return sortOrder === 'asc' ? comparison : -comparison;
        });
        // Apply pagination
        const offset = query.offset || 0;
        const limit = query.limit || 100;
        return entries.slice(offset, offset + limit);
    }
    /**
     * Get comprehensive task analytics
     */
    async getTaskAnalytics(timeframe) {
        const cacheKey = `task_analytics_${timeframe.startDate.getTime()}_${timeframe.endDate.getTime()}_${timeframe.granularity}`;
        // Check cache
        const cached = this.getFromCache(cacheKey);
        if (cached) {
            return cached;
        }
        const taskEntries = this.queryHistory({
            objectType: 'task',
            dateRange: { start: timeframe.startDate, end: timeframe.endDate },
            limit: 10000,
        });
        const taskMetrics = await this.calculateTaskMetrics(taskEntries, timeframe);
        // Cache results for 5 minutes
        this.setCache(cacheKey, taskMetrics, 300000);
        return taskMetrics;
    }
    /**
     * Get comprehensive agent analytics
     */
    async getAgentAnalytics(timeframe) {
        const cacheKey = `agent_analytics_${timeframe.startDate.getTime()}_${timeframe.endDate.getTime()}_${timeframe.granularity}`;
        // Check cache
        const cached = this.getFromCache(cacheKey);
        if (cached) {
            return cached;
        }
        const agentEntries = this.queryHistory({
            objectType: 'agent',
            dateRange: { start: timeframe.startDate, end: timeframe.endDate },
            limit: 10000,
        });
        const agentMetrics = await this.calculateAgentMetrics(agentEntries, timeframe);
        // Cache results for 5 minutes
        this.setCache(cacheKey, agentMetrics, 300000);
        return agentMetrics;
    }
    /**
     * Get comprehensive system analytics
     */
    async getSystemAnalytics(timeframe) {
        const cacheKey = `system_analytics_${timeframe.startDate.getTime()}_${timeframe.endDate.getTime()}_${timeframe.granularity}`;
        // Check cache
        const cached = this.getFromCache(cacheKey);
        if (cached) {
            return cached;
        }
        const systemEntries = this.queryHistory({
            dateRange: { start: timeframe.startDate, end: timeframe.endDate },
            limit: 10000,
        });
        const systemMetrics = await this.calculateSystemMetrics(systemEntries, timeframe);
        // Cache results for 5 minutes
        this.setCache(cacheKey, systemMetrics, 300000);
        return systemMetrics;
    }
    /**
     * Detect system bottlenecks and performance issues
     */
    async detectBottlenecks(timeframe) {
        const taskAnalytics = await this.getTaskAnalytics(timeframe);
        const agentAnalytics = await this.getAgentAnalytics(timeframe);
        const bottlenecks = [];
        // Detect agent capacity bottlenecks
        if (agentAnalytics.busyAgents / agentAnalytics.totalAgents > 0.9) {
            bottlenecks.push({
                type: 'agent_capacity',
                description: 'High agent utilization detected - may need additional agent capacity',
                severity: 'high',
                affectedTasks: [],
                suggestedResolution: 'Consider adding more agents or optimizing task distribution',
            });
        }
        // Detect task queue bottlenecks
        if (taskAnalytics.queuedTasks > taskAnalytics.inProgressTasks * 2) {
            bottlenecks.push({
                type: 'task_queue',
                description: 'Task queue backlog detected - tasks accumulating faster than completion',
                severity: 'medium',
                affectedTasks: [],
                suggestedResolution: 'Review task priority and agent assignment algorithms',
            });
        }
        // Detect failure rate issues
        if (taskAnalytics.failureRate > 0.15) {
            bottlenecks.push({
                type: 'resource_constraint',
                description: 'High task failure rate detected - may indicate system resource issues',
                severity: 'critical',
                affectedTasks: [],
                suggestedResolution: 'Investigate failing tasks and system resource availability',
            });
        }
        return bottlenecks;
    }
    /**
     * Get correlation chain for a specific event
     */
    getCorrelationChain(correlationId) {
        const entryIds = this.correlationIndex.get(correlationId) || [];
        return entryIds
            .map((id) => this.statusHistory.get(id))
            .filter((entry) => entry !== undefined).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    }
    /**
     * Get object timeline (all events for a specific object)
     */
    getObjectTimeline(objectId) {
        const entryIds = this.objectIndex.get(objectId) || [];
        return entryIds
            .map((id) => this.statusHistory.get(id))
            .filter((entry) => entry !== undefined).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    }
    /**
     * Get agent activity history
     */
    getAgentActivity(agentId, timeframe) {
        const entryIds = this.agentIndex.get(agentId) || [];
        let entries = entryIds
            .map((id) => this.statusHistory.get(id))
            .filter((entry) => entry !== undefined);
        if (timeframe) {
            entries = entries.filter((entry) => entry.timestamp >= timeframe.startDate &&
                entry.timestamp <= timeframe.endDate);
        }
        return entries.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    }
    /**
     * Export history data for external analysis
     */
    exportHistoryData(query, format = 'json') {
        const entries = this.queryHistory(query);
        switch (format) {
            case 'json':
                return JSON.stringify(entries, null, 2);
            case 'csv':
                return this.convertToCSV(entries);
            case 'tsv':
                return this.convertToTSV(entries);
            default:
                return JSON.stringify(entries, null, 2);
        }
    }
    // Private methods
    setupEventListeners() {
        // Listen to task status monitor events
        taskStatusMonitor.on('task:registered', (data) => {
            this.recordHistoryEntry(StatusEventType.TASK_REGISTERED, 'task', data.task.id, {
                newState: data.task,
                metadata: { source: 'task_monitor' },
                correlationId: `task_lifecycle_${data.task.id}`,
            });
        });
        taskStatusMonitor.on('task:status-changed', (data) => {
            this.recordHistoryEntry(StatusEventType.TASK_STATUS_CHANGED, 'task', data.task.id, {
                previousState: { status: data.update.previousStatus },
                newState: { status: data.update.newStatus },
                metadata: { update: data.update, source: 'task_monitor' },
                agentId: data.update.agentId,
                correlationId: `task_lifecycle_${data.task.id}`,
            });
        });
        taskStatusMonitor.on('agent:registered', (data) => {
            this.recordHistoryEntry(StatusEventType.AGENT_REGISTERED, 'agent', data.agent.id, {
                newState: data.agent,
                metadata: { source: 'task_monitor' },
                agentId: data.agent.id,
                correlationId: `agent_lifecycle_${data.agent.id}`,
            });
        });
        // Listen to status update broker events
        statusUpdateBroker.on('event:published', (data) => {
            this.recordHistoryEntry(data.event.type, 'system', data.event.id, {
                newState: data.event.data,
                metadata: { event: data.event, source: 'status_broker' },
                correlationId: data.event.id,
            });
        });
    }
    setupPeriodicAnalytics() {
        // Run analytics cleanup and optimization every hour
        this.persistenceInterval = setInterval(() => {
            this.performMaintenanceTasks();
        }, 3600000); // 1 hour
    }
    async calculateTaskMetrics(entries, timeframe) {
        const taskIds = new Set(entries.map((entry) => entry.objectId));
        const completedTasks = entries.filter((entry) => entry.eventType === StatusEventType.TASK_COMPLETED).length;
        const failedTasks = entries.filter((entry) => entry.eventType === StatusEventType.TASK_FAILED).length;
        // Get current task statuses from monitor
        const allTasks = taskStatusMonitor.getAllTasks();
        const relevantTasks = allTasks.filter((task) => taskIds.has(task.id));
        const tasksByType = {};
        const tasksByPriority = {};
        const tasksByAgent = {};
        for (const task of relevantTasks) {
            tasksByType[task.type] = (tasksByType[task.type] || 0) + 1;
            tasksByPriority[task.priority] =
                (tasksByPriority[task.priority] || 0) + 1;
            if (task.assignedAgent) {
                tasksByAgent[task.assignedAgent] =
                    (tasksByAgent[task.assignedAgent] || 0) + 1;
            }
        }
        // Calculate completion times
        const completionTimes = [];
        for (const task of relevantTasks) {
            if (task.startTime && task.endTime) {
                completionTimes.push(task.endTime.getTime() - task.startTime.getTime());
            }
        }
        const averageCompletionTime = completionTimes.length > 0
            ? completionTimes.reduce((sum, time) => sum + time, 0) /
                completionTimes.length
            : 0;
        // Generate time series data
        const timeSeriesData = this.generateTimeSeriesData(entries, timeframe);
        return {
            totalTasks: taskIds.size,
            completedTasks,
            failedTasks,
            inProgressTasks: relevantTasks.filter((task) => task.status === TaskStatus.IN_PROGRESS).length,
            queuedTasks: relevantTasks.filter((task) => task.status === TaskStatus.QUEUED).length,
            averageCompletionTime,
            completionRate: taskIds.size > 0 ? completedTasks / taskIds.size : 0,
            failureRate: taskIds.size > 0 ? failedTasks / taskIds.size : 0,
            tasksByType,
            tasksByPriority,
            tasksByAgent,
            timeSeriesData,
        };
    }
    async calculateAgentMetrics(entries, timeframe) {
        const agentIds = new Set(entries
            .filter((entry) => entry.context.agentId)
            .map((entry) => entry.context.agentId));
        const allAgents = taskStatusMonitor.getAllAgents();
        const relevantAgents = allAgents.filter((agent) => agentIds.has(agent.id));
        const agentEfficiency = {};
        const topPerformers = [];
        for (const agent of relevantAgents) {
            const totalTasks = agent.completedTasks + agent.failedTasks;
            agentEfficiency[agent.id] = {
                tasksCompleted: agent.completedTasks,
                tasksStarted: totalTasks,
                averageCompletionTime: agent.averageTaskDuration,
                successRate: agent.performance.successRate,
                capabilities: agent.capabilities,
            };
            if (agent.completedTasks > 0) {
                topPerformers.push({
                    agentId: agent.id,
                    completedTasks: agent.completedTasks,
                    successRate: agent.performance.successRate,
                    averageTaskTime: agent.averageTaskDuration,
                });
            }
        }
        // Sort top performers by success rate and task count
        topPerformers.sort((a, b) => {
            const scoreA = a.successRate * 0.7 + (a.completedTasks / 100) * 0.3;
            const scoreB = b.successRate * 0.7 + (b.completedTasks / 100) * 0.3;
            return scoreB - scoreA;
        });
        const activeAgents = relevantAgents.filter((agent) => agent.status === 'active' || agent.status === 'busy').length;
        const idleAgents = relevantAgents.filter((agent) => agent.status === 'idle').length;
        const busyAgents = relevantAgents.filter((agent) => agent.status === 'busy').length;
        const offlineAgents = relevantAgents.filter((agent) => agent.status === 'offline').length;
        return {
            totalAgents: agentIds.size,
            activeAgents,
            idleAgents,
            busyAgents,
            offlineAgents,
            averageTasksPerAgent: relevantAgents.length > 0
                ? relevantAgents.reduce((sum, agent) => sum + agent.completedTasks, 0) / relevantAgents.length
                : 0,
            topPerformers: topPerformers.slice(0, 10),
            agentEfficiency,
        };
    }
    async calculateSystemMetrics(entries, timeframe) {
        const systemUptime = Date.now() -
            taskStatusMonitor.getPerformanceMetrics().systemUptime.getTime();
        const totalEvents = entries.length;
        const timeSpanHours = (timeframe.endDate.getTime() - timeframe.startDate.getTime()) /
            (1000 * 60 * 60);
        const eventsPerHour = timeSpanHours > 0 ? totalEvents / timeSpanHours : 0;
        const taskMetrics = await this.getTaskAnalytics(timeframe);
        const systemEfficiency = taskMetrics.completionRate * 100;
        const bottlenecks = await this.detectBottlenecks(timeframe);
        // Calculate trends (simplified)
        const trends = {
            taskCompletionTrend: taskMetrics.completionRate > 0.8
                ? 'improving'
                : taskMetrics.completionRate > 0.6
                    ? 'stable'
                    : 'declining',
            agentUtilizationTrend: 'stable', // Would need more complex trend analysis
            errorRateTrend: taskMetrics.failureRate < 0.1
                ? 'improving'
                : taskMetrics.failureRate < 0.2
                    ? 'stable'
                    : 'declining',
        };
        return {
            systemUptime,
            totalEvents,
            eventsPerHour,
            systemEfficiency,
            bottlenecks,
            trends,
        };
    }
    generateTimeSeriesData(entries, timeframe) {
        const buckets = new Map();
        // Initialize buckets based on granularity
        const current = new Date(timeframe.startDate);
        while (current <= timeframe.endDate) {
            const bucketKey = this.getBucketKey(current, timeframe.granularity);
            buckets.set(bucketKey, {
                completed: 0,
                failed: 0,
                started: 0,
                queued: 0,
            });
            // Advance to next bucket
            this.advanceDate(current, timeframe.granularity);
        }
        // Populate buckets with data
        for (const entry of entries) {
            const bucketKey = this.getBucketKey(entry.timestamp, timeframe.granularity);
            const bucket = buckets.get(bucketKey);
            if (!bucket)
                continue;
            switch (entry.eventType) {
                case StatusEventType.TASK_COMPLETED:
                    bucket.completed++;
                    break;
                case StatusEventType.TASK_FAILED:
                    bucket.failed++;
                    break;
                case StatusEventType.TASK_STATUS_CHANGED:
                    if (entry.newState?.status === TaskStatus.IN_PROGRESS) {
                        bucket.started++;
                    }
                    else if (entry.newState?.status === TaskStatus.QUEUED) {
                        bucket.queued++;
                    }
                    break;
            }
        }
        // Convert to array format
        return Array.from(buckets.entries())
            .map(([key, data]) => ({
            timestamp: this.parseBucketKey(key, timeframe.granularity),
            ...data,
        }))
            .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    }
    getBucketKey(date, granularity) {
        switch (granularity) {
            case 'hour':
                return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${date.getHours()}`;
            case 'day':
                return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
            case 'week':
                const weekStart = new Date(date);
                weekStart.setDate(date.getDate() - date.getDay());
                return `${weekStart.getFullYear()}-W${Math.ceil(weekStart.getDate() / 7)}`;
            case 'month':
                return `${date.getFullYear()}-${date.getMonth()}`;
            default:
                return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
        }
    }
    parseBucketKey(key, granularity) {
        const parts = key.split('-');
        switch (granularity) {
            case 'hour':
                return new Date(parseInt(parts[0]), parseInt(parts[1]), parseInt(parts[2]), parseInt(parts[3]));
            case 'day':
                return new Date(parseInt(parts[0]), parseInt(parts[1]), parseInt(parts[2]));
            case 'week':
            case 'month':
                return new Date(parseInt(parts[0]), parseInt(parts[1]) || 0, 1);
            default:
                return new Date(parseInt(parts[0]), parseInt(parts[1]), parseInt(parts[2]));
        }
    }
    advanceDate(date, granularity) {
        switch (granularity) {
            case 'hour':
                date.setHours(date.getHours() + 1);
                break;
            case 'day':
                date.setDate(date.getDate() + 1);
                break;
            case 'week':
                date.setDate(date.getDate() + 7);
                break;
            case 'month':
                date.setMonth(date.getMonth() + 1);
                break;
        }
    }
    updateIndices(entry) {
        // Update correlation index
        const correlationId = entry.context.correlationId;
        if (correlationId) {
            const correlationEntries = this.correlationIndex.get(correlationId) || [];
            correlationEntries.push(entry.id);
            this.correlationIndex.set(correlationId, correlationEntries);
        }
        // Update object index
        const objectEntries = this.objectIndex.get(entry.objectId) || [];
        objectEntries.push(entry.id);
        this.objectIndex.set(entry.objectId, objectEntries);
        // Update agent index
        if (entry.context.agentId) {
            const agentEntries = this.agentIndex.get(entry.context.agentId) || [];
            agentEntries.push(entry.id);
            this.agentIndex.set(entry.context.agentId, agentEntries);
        }
        // Update event type index
        const eventTypeEntries = this.eventTypeIndex.get(entry.eventType) || [];
        eventTypeEntries.push(entry.id);
        this.eventTypeIndex.set(entry.eventType, eventTypeEntries);
    }
    getFromCache(key) {
        const cached = this.analyticsCache.get(key);
        if (!cached)
            return null;
        const now = Date.now();
        if (now - cached.timestamp.getTime() > cached.ttl) {
            this.analyticsCache.delete(key);
            return null;
        }
        return cached.data;
    }
    setCache(key, data, ttl) {
        this.analyticsCache.set(key, {
            data,
            timestamp: new Date(),
            ttl,
        });
    }
    invalidateAnalyticsCache(tags) {
        for (const [key] of Array.from(this.analyticsCache.entries())) {
            if (tags.some((tag) => key.includes(tag))) {
                this.analyticsCache.delete(key);
            }
        }
    }
    convertToCSV(entries) {
        if (entries.length === 0)
            return '';
        const headers = [
            'id',
            'timestamp',
            'eventType',
            'objectType',
            'objectId',
            'agentId',
            'metadata',
        ];
        const rows = entries.map((entry) => [
            entry.id,
            entry.timestamp.toISOString(),
            entry.eventType,
            entry.objectType,
            entry.objectId,
            entry.context.agentId || '',
            JSON.stringify(entry.metadata),
        ]);
        return [headers, ...rows].map((row) => row.join(',')).join('\n');
    }
    convertToTSV(entries) {
        if (entries.length === 0)
            return '';
        const headers = [
            'id',
            'timestamp',
            'eventType',
            'objectType',
            'objectId',
            'agentId',
            'metadata',
        ];
        const rows = entries.map((entry) => [
            entry.id,
            entry.timestamp.toISOString(),
            entry.eventType,
            entry.objectType,
            entry.objectId,
            entry.context.agentId || '',
            JSON.stringify(entry.metadata),
        ]);
        return [headers, ...rows].map((row) => row.join('\t')).join('\n');
    }
    performMaintenanceTasks() {
        // Clean up old entries (keep last 30 days)
        const cutoffDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        let removedCount = 0;
        for (const [id, entry] of Array.from(this.statusHistory.entries())) {
            if (entry.timestamp < cutoffDate) {
                this.statusHistory.delete(id);
                removedCount++;
            }
        }
        // Clean up indices
        this.rebuildIndices();
        // Clear expired cache entries
        const now = Date.now();
        for (const [key, cached] of Array.from(this.analyticsCache.entries())) {
            if (now - cached.timestamp.getTime() > cached.ttl) {
                this.analyticsCache.delete(key);
            }
        }
        if (removedCount > 0) {
            this.logger.info('Maintenance completed', {
                removedEntries: removedCount,
                totalEntries: this.statusHistory.size,
                cacheEntries: this.analyticsCache.size,
            });
        }
    }
    rebuildIndices() {
        this.correlationIndex.clear();
        this.objectIndex.clear();
        this.agentIndex.clear();
        this.eventTypeIndex.clear();
        for (const entry of Array.from(this.statusHistory.values())) {
            this.updateIndices(entry);
        }
    }
    generateEntryId() {
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 8);
        return `history_${timestamp}_${randomString}`;
    }
    /**
     * Cleanup resources
     */
    destroy() {
        if (this.persistenceInterval) {
            clearInterval(this.persistenceInterval);
        }
        this.statusHistory.clear();
        this.correlationIndex.clear();
        this.objectIndex.clear();
        this.agentIndex.clear();
        this.eventTypeIndex.clear();
        this.analyticsCache.clear();
        this.logger.info('StatusHistoryAnalytics destroyed');
    }
}
/**
 * Singleton instance for global access
 */
export const statusHistoryAnalytics = new StatusHistoryAnalytics();
//# sourceMappingURL=StatusHistoryAnalytics.js.map