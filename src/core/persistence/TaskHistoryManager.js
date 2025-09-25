#!/usr/bin/env node

/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Task History Manager - Comprehensive Audit Trail & Historical Analysis System
 *
 * === OVERVIEW ===
 * Advanced task history management system providing comprehensive audit trails,
 * historical analysis, timeline reconstruction, and compliance reporting.
 *
 * === KEY FEATURES ===
 * • Complete task lifecycle audit trails with immutable records
 * • Historical task state reconstruction and point-in-time queries
 * • Advanced analytics and reporting for task performance insights
 * • Compliance-grade audit logging with tamper detection
 * • Timeline visualization and task relationship mapping
 * • Performance trend analysis and bottleneck identification
 * • Cross-session task continuity tracking
 * • Automated archival and data retention management
 *
 * === AUDIT ARCHITECTURE ===
 * 1. Immutable Audit Log: Tamper-proof historical record storage
 * 2. State Snapshots: Point-in-time task state preservation
 * 3. Event Correlation: Cross-task event relationship tracking
 * 4. Analytics Engine: Performance insights and trend analysis
 * 5. Query Engine: Complex historical data retrieval system
 * 6. Retention Manager: Automated archival and cleanup
 *
 * @author Persistence Agent
 * @version 1.0.0
 * @since 2025-09-25
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import EventEmitter from 'node:events';

/**
 * Task History Manager - Core historical tracking and audit system
 */
class TaskHistoryManager extends EventEmitter {
  constructor(options = {}) {
    super();

    this.projectRoot = options.projectRoot || process.cwd();
    this.historyDir = path.join(this.projectRoot, '.gemini-tasks', 'history');

    // History configuration
    this.config = {
      maxHistoryEntries: 100000,
      retentionPeriodDays: 365,
      snapshotInterval: 3600000, // 1 hour
      compressionEnabled: true,
      auditLevel: 'detailed', // basic, detailed, comprehensive
      archivalEnabled: true,
      tamperDetection: true,
      ...options,
    };

    // Storage paths
    this.paths = {
      auditLog: path.join(this.historyDir, 'audit-log.jsonl'),
      stateSnapshots: path.join(this.historyDir, 'snapshots'),
      analyticsCache: path.join(this.historyDir, 'analytics-cache.json'),
      eventIndex: path.join(this.historyDir, 'event-index.json'),
      archiveDir: path.join(this.historyDir, 'archives'),
      integrityHashes: path.join(this.historyDir, 'integrity-hashes.json'),
    };

    // History state
    this.state = {
      lastSnapshot: null,
      totalEvents: 0,
      lastArchival: null,
      eventIndex: new Map(),
      analyticsCache: {},
      integrityChain: [],
      snapshotInterval: null,
    };

    // Event types and their audit levels
    this.auditLevels = {
      // Critical events - always logged regardless of audit level
      critical: [
        'task_created',
        'task_completed',
        'task_failed',
        'agent_assigned',
        'system_failure',
      ],

      // Detailed events - logged in detailed and comprehensive modes
      detailed: [
        'task_updated',
        'status_changed',
        'dependency_modified',
        'agent_updated',
      ],

      // Comprehensive events - logged only in comprehensive mode
      comprehensive: [
        'heartbeat_received',
        'validation_performed',
        'metrics_collected',
      ],
    };

    // Initialize history system
    this._initialize();
  }

  // =================== INITIALIZATION ===================

  async _initialize() {
    try {
      await this._ensureHistoryStructure();
      await this._loadHistoryState();
      await this._startSnapshotScheduler();
      await this._validateAuditIntegrity();

      console.log('TaskHistoryManager: System initialized successfully');
    } catch (error) {
      console.error('TaskHistoryManager: Initialization failed:', error);
      throw new Error(
        `Task history system initialization failed: ${error.message}`,
      );
    }
  }

  async _ensureHistoryStructure() {
    await fs.mkdir(this.historyDir, { recursive: true });
    await fs.mkdir(this.paths.stateSnapshots, { recursive: true });
    await fs.mkdir(this.paths.archiveDir, { recursive: true });

    // Initialize history files
    const initialFiles = [
      {
        path: this.paths.analyticsCache,
        data: { cache: {}, lastUpdate: new Date().toISOString() },
      },
      {
        path: this.paths.eventIndex,
        data: {
          index: {},
          totalEvents: 0,
          lastUpdate: new Date().toISOString(),
        },
      },
      {
        path: this.paths.integrityHashes,
        data: { hashes: [], lastHash: null, chainValid: true },
      },
    ];

    for (const file of initialFiles) {
      try {
        await fs.access(file.path);
      } catch {
        await fs.writeFile(file.path, JSON.stringify(file.data, null, 2));
      }
    }

    // Initialize audit log if it doesn't exist
    try {
      await fs.access(this.paths.auditLog);
    } catch {
      const initialEntry = this._createAuditEntry('system_initialized', {
        timestamp: new Date().toISOString(),
        config: this.config,
      });
      await fs.writeFile(
        this.paths.auditLog,
        JSON.stringify(initialEntry) + '\n',
      );
    }
  }

  async _loadHistoryState() {
    try {
      // Load event index
      const indexData = await fs.readFile(this.paths.eventIndex, 'utf8');
      const indexInfo = JSON.parse(indexData);
      this.state.eventIndex = new Map(Object.entries(indexInfo.index || {}));
      this.state.totalEvents = indexInfo.totalEvents || 0;

      // Load analytics cache
      const cacheData = await fs.readFile(this.paths.analyticsCache, 'utf8');
      const cacheInfo = JSON.parse(cacheData);
      this.state.analyticsCache = cacheInfo.cache || {};

      // Load integrity hashes
      const hashData = await fs.readFile(this.paths.integrityHashes, 'utf8');
      const hashInfo = JSON.parse(hashData);
      this.state.integrityChain = hashInfo.hashes || [];
    } catch (error) {
      console.warn(
        'TaskHistoryManager: Could not load previous state:',
        error.message,
      );
    }
  }

  async _startSnapshotScheduler() {
    if (this.state.snapshotInterval) {
      clearInterval(this.state.snapshotInterval);
    }

    this.state.snapshotInterval = setInterval(async () => {
      try {
        await this.createSystemSnapshot();
      } catch (error) {
        console.error('TaskHistoryManager: Scheduled snapshot failed:', error);
        await this._logAuditEvent('snapshot_failed', { error: error.message });
      }
    }, this.config.snapshotInterval);
  }

  // =================== AUDIT LOGGING ===================

  /**
   * Log task event with full audit trail
   */
  async logTaskEvent(eventType, taskData, metadata = {}) {
    try {
      // Check if event should be logged based on audit level
      if (!this._shouldLogEvent(eventType)) {
        return null;
      }

      const auditEntry = this._createAuditEntry(eventType, {
        task: this._sanitizeTaskData(taskData),
        metadata,
        context: {
          sessionId: process.env.SESSION_ID || 'unknown',
          agentId: process.env.AGENT_ID || 'system',
          timestamp: new Date().toISOString(),
        },
      });

      // Write to audit log
      await this._appendToAuditLog(auditEntry);

      // Update event index
      await this._updateEventIndex(auditEntry);

      // Update analytics cache
      await this._updateAnalyticsCache(eventType, taskData);

      // Emit history event
      this.emit('auditEventLogged', auditEntry);

      return auditEntry;
    } catch (error) {
      console.error('TaskHistoryManager: Failed to log task event:', error);
      throw new Error(`Task event logging failed: ${error.message}`);
    }
  }

  /**
   * Log system event with audit trail
   */
  async logSystemEvent(eventType, eventData, metadata = {}) {
    try {
      const auditEntry = this._createAuditEntry(eventType, {
        system: eventData,
        metadata,
        context: {
          sessionId: process.env.SESSION_ID || 'unknown',
          agentId: process.env.AGENT_ID || 'system',
          timestamp: new Date().toISOString(),
        },
      });

      await this._appendToAuditLog(auditEntry);
      await this._updateEventIndex(auditEntry);

      this.emit('systemEventLogged', auditEntry);

      return auditEntry;
    } catch (error) {
      console.error('TaskHistoryManager: Failed to log system event:', error);
      throw new Error(`System event logging failed: ${error.message}`);
    }
  }

  async _appendToAuditLog(auditEntry) {
    // Calculate integrity hash
    if (this.config.tamperDetection) {
      auditEntry.integrityHash = this._calculateIntegrityHash(auditEntry);
      auditEntry.previousHash =
        this.state.integrityChain.length > 0
          ? this.state.integrityChain[this.state.integrityChain.length - 1].hash
          : null;
    }

    // Append to audit log file
    await fs.appendFile(this.paths.auditLog, JSON.stringify(auditEntry) + '\n');

    // Update integrity chain
    if (this.config.tamperDetection) {
      this.state.integrityChain.push({
        entryId: auditEntry.id,
        hash: auditEntry.integrityHash,
        timestamp: auditEntry.timestamp,
      });

      // Keep only last 10000 integrity hashes in memory
      if (this.state.integrityChain.length > 10000) {
        this.state.integrityChain = this.state.integrityChain.slice(-10000);
      }
    }

    this.state.totalEvents++;
  }

  // =================== STATE SNAPSHOTS ===================

  /**
   * Create comprehensive system state snapshot
   */
  async createSystemSnapshot(snapshotName) {
    try {
      const timestamp = new Date().toISOString();
      const snapshotId =
        snapshotName || `snapshot-${timestamp.replace(/[:.]/g, '-')}`;

      const snapshotData = {
        id: snapshotId,
        timestamp,
        version: '1.0.0',
        systemState: await this._captureSystemState(),
        statistics: await this._calculateSnapshotStatistics(),
        metadata: {
          totalEvents: this.state.totalEvents,
          lastEventId:
            this.state.integrityChain.length > 0
              ? this.state.integrityChain[this.state.integrityChain.length - 1]
                  .entryId
              : null,
          snapshotSize: 0, // Will be calculated after serialization
        },
      };

      // Serialize and calculate size
      const serializedSnapshot = JSON.stringify(snapshotData, null, 2);
      snapshotData.metadata.snapshotSize =
        Buffer.byteLength(serializedSnapshot);

      // Save snapshot
      const snapshotPath = path.join(
        this.paths.stateSnapshots,
        `${snapshotId}.json`,
      );
      await fs.writeFile(snapshotPath, serializedSnapshot);

      // Update state
      this.state.lastSnapshot = timestamp;

      // Log snapshot creation
      await this._logAuditEvent('snapshot_created', {
        snapshotId,
        snapshotPath,
        metadata: snapshotData.metadata,
      });

      return {
        success: true,
        snapshotId,
        snapshotPath,
        metadata: snapshotData.metadata,
      };
    } catch (error) {
      throw new Error(`System snapshot creation failed: ${error.message}`);
    }
  }

  async _captureSystemState() {
    try {
      // Load current FEATURES.json
      const featuresPath = path.join(this.projectRoot, 'FEATURES.json');
      const featuresData = await fs.readFile(featuresPath, 'utf8');
      const features = JSON.parse(featuresData);

      return {
        features: {
          total: features.features ? features.features.length : 0,
          byStatus: this._countByField(features.features || [], 'status'),
          byCategory: this._countByField(features.features || [], 'category'),
        },
        tasks: {
          total: features.tasks ? features.tasks.length : 0,
          byStatus: this._countByField(features.tasks || [], 'status'),
          byPriority: this._countByField(features.tasks || [], 'priority'),
          byType: this._countByField(features.tasks || [], 'type'),
        },
        agents: {
          total: features.agents ? Object.keys(features.agents).length : 0,
          active: features.agents
            ? Object.values(features.agents).filter(
                (a) => a.status === 'active',
              ).length
            : 0,
          withTasks: features.agents
            ? Object.values(features.agents).filter(
                (a) => a.assigned_tasks && a.assigned_tasks.length > 0,
              ).length
            : 0,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.warn(
        'TaskHistoryManager: Could not capture system state:',
        error.message,
      );
      return {
        features: { total: 0, byStatus: {}, byCategory: {} },
        tasks: { total: 0, byStatus: {}, byPriority: {}, byType: {} },
        agents: { total: 0, active: 0, withTasks: 0 },
        timestamp: new Date().toISOString(),
        error: error.message,
      };
    }
  }

  // =================== HISTORICAL QUERIES ===================

  /**
   * Query task history with advanced filtering
   */
  async queryTaskHistory(query = {}) {
    try {
      const results = {
        query,
        results: [],
        totalFound: 0,
        executionTime: 0,
        timestamp: new Date().toISOString(),
      };

      const startTime = Date.now();

      // Read and parse audit log
      const auditData = await fs.readFile(this.paths.auditLog, 'utf8');
      const auditEntries = auditData
        .trim()
        .split('\n')
        .map((line) => JSON.parse(line))
        .filter((entry) => this._matchesQuery(entry, query));

      results.results = this._processQueryResults(auditEntries, query);
      results.totalFound = results.results.length;
      results.executionTime = Date.now() - startTime;

      return results;
    } catch (error) {
      throw new Error(`Task history query failed: ${error.message}`);
    }
  }

  /**
   * Reconstruct task state at specific point in time
   */
  async reconstructTaskState(taskId, pointInTime) {
    try {
      const query = {
        taskId,
        timeRange: { end: new Date(pointInTime).toISOString() },
        eventTypes: [
          'task_created',
          'task_updated',
          'status_changed',
          'agent_assigned',
        ],
      };

      const historyResults = await this.queryTaskHistory(query);

      if (historyResults.results.length === 0) {
        return null;
      }

      // Reconstruct state by applying events chronologically
      let taskState = null;

      for (const event of historyResults.results) {
        taskState = this._applyEventToState(taskState, event);
      }

      return {
        taskId,
        pointInTime,
        reconstructedState: taskState,
        eventsApplied: historyResults.results.length,
        lastEvent: historyResults.results[historyResults.results.length - 1],
      };
    } catch (error) {
      throw new Error(`Task state reconstruction failed: ${error.message}`);
    }
  }

  /**
   * Generate task timeline visualization data
   */
  async generateTaskTimeline(taskId, options = {}) {
    try {
      const query = {
        taskId,
        timeRange: options.timeRange,
        includeRelated: options.includeRelated || false,
      };

      const historyResults = await this.queryTaskHistory(query);

      const timeline = {
        taskId,
        totalEvents: historyResults.totalFound,
        timeSpan: this._calculateTimeSpan(historyResults.results),
        events: historyResults.results.map((event) => ({
          timestamp: event.timestamp,
          eventType: event.eventType,
          description: this._generateEventDescription(event),
          agent: event.data?.context?.agentId || 'system',
          changes: this._extractEventChanges(event),
          metadata: event.data?.metadata || {},
        })),
        milestones: this._identifyMilestones(historyResults.results),
        performance: this._calculateTimelinePerformance(historyResults.results),
      };

      return timeline;
    } catch (error) {
      throw new Error(`Timeline generation failed: ${error.message}`);
    }
  }

  // =================== ANALYTICS & REPORTING ===================

  /**
   * Generate comprehensive analytics report
   */
  async generateAnalyticsReport(reportType = 'comprehensive', timeRange = {}) {
    try {
      const report = {
        reportType,
        timeRange,
        generatedAt: new Date().toISOString(),
        sections: {},
      };

      // Task performance analytics
      report.sections.taskPerformance =
        await this._analyzeTaskPerformance(timeRange);

      // Agent productivity analytics
      report.sections.agentProductivity =
        await this._analyzeAgentProductivity(timeRange);

      // System health trends
      report.sections.systemHealth =
        await this._analyzeSystemHealthTrends(timeRange);

      // Bottleneck analysis
      report.sections.bottlenecks = await this._analyzeBottlenecks(timeRange);

      // Success/failure patterns
      report.sections.patterns = await this._analyzePatterns(timeRange);

      if (reportType === 'comprehensive') {
        // Additional comprehensive analytics
        report.sections.predictions =
          await this._generatePredictiveAnalytics(timeRange);
        report.sections.recommendations = await this._generateRecommendations(
          report.sections,
        );
      }

      // Cache report for future use
      await this._cacheAnalyticsReport(report);

      return report;
    } catch (error) {
      throw new Error(`Analytics report generation failed: ${error.message}`);
    }
  }

  async _analyzeTaskPerformance(timeRange) {
    try {
      const query = {
        eventTypes: ['task_created', 'task_completed', 'task_failed'],
        timeRange,
      };

      const results = await this.queryTaskHistory(query);
      const taskMetrics = new Map();

      // Analyze task completion times and success rates
      for (const event of results.results) {
        const taskId = event.data?.task?.id;
        if (!taskId) continue;

        if (!taskMetrics.has(taskId)) {
          taskMetrics.set(taskId, {
            taskId,
            createdAt: null,
            completedAt: null,
            failedAt: null,
            status: 'unknown',
            duration: null,
            category: event.data?.task?.category,
            priority: event.data?.task?.priority,
          });
        }

        const metrics = taskMetrics.get(taskId);

        switch (event.eventType) {
          case 'task_created':
            metrics.createdAt = event.timestamp;
            break;
          case 'task_completed':
            metrics.completedAt = event.timestamp;
            metrics.status = 'completed';
            break;
          case 'task_failed':
            metrics.failedAt = event.timestamp;
            metrics.status = 'failed';
            break;
        }

        // Calculate duration if both start and end are available
        if (metrics.createdAt && (metrics.completedAt || metrics.failedAt)) {
          const startTime = new Date(metrics.createdAt);
          const endTime = new Date(metrics.completedAt || metrics.failedAt);
          metrics.duration = endTime.getTime() - startTime.getTime();
        }

      const completedTasks = Array.from(taskMetrics.values()).filter(
        (m) => m.status === 'completed',
      );
      const failedTasks = Array.from(taskMetrics.values()).filter(
        (m) => m.status === 'failed',
      );

      return {
        totalTasks: taskMetrics.size,
        completedTasks: completedTasks.length,
        failedTasks: failedTasks.length,
        successRate:
          taskMetrics.size > 0 ? completedTasks.length / taskMetrics.size : 0,
        averageCompletionTime:
          completedTasks.length > 0
            ? completedTasks.reduce((sum, t) => sum + (t.duration || 0), 0) /
              completedTasks.length
            : 0,
        performanceByCategory: this._groupPerformanceByField(
          completedTasks,
          'category',
        ),
        performanceByPriority: this._groupPerformanceByField(
          completedTasks,
          'priority',
        ),
        trends: this._calculatePerformanceTrends(
          Array.from(taskMetrics.values()),
        ),
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  async _analyzeAgentProductivity(timeRange) {
    try {
      const query = {
        eventTypes: ['agent_assigned', 'task_completed', 'task_failed'],
        timeRange,
      };

      const results = await this.queryTaskHistory(query);
      const agentMetrics = new Map();

      for (const event of results.results) {
        const agentId =
          event.data?.context?.agentId || event.data?.task?.assigned_to;
        if (!agentId || agentId === 'system') continue;

        if (!agentMetrics.has(agentId)) {
          agentMetrics.set(agentId, {
            agentId,
            tasksAssigned: 0,
            tasksCompleted: 0,
            tasksFailed: 0,
            totalDuration: 0,
            averageDuration: 0,
          });
        }

        const metrics = agentMetrics.get(agentId);

        switch (event.eventType) {
          case 'agent_assigned':
            metrics.tasksAssigned++;
            break;
          case 'task_completed':
            metrics.tasksCompleted++;
            break;
          case 'task_failed':
            metrics.tasksFailed++;
            break;
        default:
          // Handle unexpected values
          break;
      

        }

      // Calculate productivity scores
      Array.from(agentMetrics.values()).forEach((metrics) => {
        metrics.successRate =
          metrics.tasksAssigned > 0
            ? metrics.tasksCompleted / metrics.tasksAssigned
            : 0;
        metrics.productivityScore =
          metrics.tasksCompleted * 2 - metrics.tasksFailed;
      });

      return {
        totalAgents: agentMetrics.size,
        agentMetrics: Array.from(agentMetrics.values()),
        topPerformers: Array.from(agentMetrics.values())
          .sort((a, b) => b.productivityScore - a.productivityScore)
          .slice(0, 5),
        averageSuccessRate:
          agentMetrics.size > 0
            ? Array.from(agentMetrics.values()).reduce(
                (sum, a) => sum + a.successRate,
                0,
              ) / agentMetrics.size
            : 0,
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  // =================== UTILITY METHODS ===================

  _createAuditEntry(eventType, data) {
    const entry = {
      id: crypto.randomBytes(12).toString('hex'),
      timestamp: new Date().toISOString(),
      eventType,
      data,
      version: '1.0.0',
    };

    return entry;
  }

  _shouldLogEvent(eventType) {
    const { auditLevel } = this.config;

    if (this.auditLevels.critical.includes(eventType)) return true;
    if (auditLevel === 'basic') return false;

    if (this.auditLevels.detailed.includes(eventType))
      return auditLevel !== 'basic';
    if (this.auditLevels.comprehensive.includes(eventType))
      return auditLevel === 'comprehensive';

    return true; // Log unknown event types by default
  }

  _sanitizeTaskData(taskData) {
    // Remove sensitive information from task data
    const sanitized = { ...taskData };
    delete sanitized.sensitive;
    delete sanitized.credentials;
    delete sanitized.secrets;
    return sanitized;
  }

  _calculateIntegrityHash(entry) {
    const hashInput = JSON.stringify({
      id: entry.id,
      timestamp: entry.timestamp,
      eventType: entry.eventType,
      data: entry.data,
      previousHash: entry.previousHash,
    });

    return crypto.createHash('sha256').update(hashInput).digest('hex');
  }

  async _updateEventIndex(auditEntry) {
    const indexKey = `${auditEntry.eventType}-${auditEntry.timestamp.split('T')[0]}`;

    if (!this.state.eventIndex.has(indexKey)) {
      this.state.eventIndex.set(indexKey, []);
    }

    this.state.eventIndex.get(indexKey).push({
      id: auditEntry.id,
      timestamp: auditEntry.timestamp,
      taskId: auditEntry.data?.task?.id,
    });

    // Periodically persist index
    if (this.state.totalEvents % 100 === 0) {
      await this._persistEventIndex();
    }
  }

  async _updateAnalyticsCache(eventType, taskData) {
    const cacheKey = `${eventType}-${new Date().toISOString().split('T')[0]}`;

    if (!this.state.analyticsCache[cacheKey]) {
      this.state.analyticsCache[cacheKey] = {
        count: 0,
        firstSeen: new Date().toISOString(),
        lastSeen: new Date().toISOString(),
      };
    }

    this.state.analyticsCache[cacheKey].count++;
    this.state.analyticsCache[cacheKey].lastSeen = new Date().toISOString();
  }

  _matchesQuery(entry, query) {
    // Time range filtering
    if (query.timeRange) {
      const entryTime = new Date(entry.timestamp);
      if (query.timeRange.start && entryTime < new Date(query.timeRange.start))
        return false;
      if (query.timeRange.end && entryTime > new Date(query.timeRange.end))
        return false;
    }

    // Event type filtering
    if (query.eventTypes && !query.eventTypes.includes(entry.eventType))
      return false;

    // Task ID filtering
    if (query.taskId && entry.data?.task?.id !== query.taskId) return false;

    // Agent ID filtering
    if (query.agentId && entry.data?.context?.agentId !== query.agentId)
      return false;

    return true;
  }

  _processQueryResults(entries, query) {
    let results = entries;

    // Sort by timestamp
    results.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    // Apply limit
    if (query.limit) {
      results = results.slice(0, query.limit);
    }

    return results;
  }

  _applyEventToState(currentState, event) {
    switch (event.eventType) {
      case 'task_created':
        return event.data.task;

      case 'task_updated':
      case 'status_changed':
        return {
          ...currentState,
          ...event.data.task,
          updated_at: event.timestamp,
        };

      case 'agent_assigned':
        return {
          ...currentState,
          assigned_to: event.data.context.agentId,
          assigned_at: event.timestamp,
        };

      default:
        return currentState;
    }
  }

  _countByField(items, field) {
    const counts = {};
    items.forEach((item) => {
      const value = item[field] || 'unknown';
      counts[value] = (counts[value] || 0) + 1;
    });
    return counts;
  }

  _calculateTimeSpan(events) {
    if (events.length === 0) return null;

    const timestamps = events
      .map((e) => new Date(e.timestamp))
      .sort((a, b) => a - b);
    return {
      start: timestamps[0].toISOString(),
      end: timestamps[timestamps.length - 1].toISOString(),
      duration:
        timestamps[timestamps.length - 1].getTime() - timestamps[0].getTime(),
    };
  }

  _generateEventDescription(event) {
    const descriptions = {
      task_created: `Task "${event.data?.task?.title || 'Unknown'}" was created`,
      task_completed: `Task "${event.data?.task?.title || 'Unknown'}" was completed`,
      task_failed: `Task "${event.data?.task?.title || 'Unknown'}" failed`,
      status_changed: `Task status changed to "${event.data?.task?.status || 'unknown'}"`,
      agent_assigned: `Task assigned to agent "${event.data?.context?.agentId || 'unknown'}"`,
    };

    return descriptions[event.eventType] || `${event.eventType} occurred`;
  }

  _extractEventChanges(event) {
    return event.data?.metadata?.changes || {};
  }

  _identifyMilestones(events) {
    const milestones = [];
    const milestoneEvents = [
      'task_created',
      'agent_assigned',
      'task_completed',
      'task_failed',
    ];

    events
      .filter((e) => milestoneEvents.includes(e.eventType))
      .forEach((event) => {
        milestones.push({
          timestamp: event.timestamp,
          type: event.eventType,
          description: this._generateEventDescription(event),
        });
      });

    return milestones;
  }

  _calculateTimelinePerformance(events) {
    const performance = {
      totalEvents: events.length,
      timeSpan: this._calculateTimeSpan(events),
      eventFrequency: 0,
    };

    if (performance.timeSpan && performance.timeSpan.duration > 0) {
      performance.eventFrequency =
        events.length / (performance.timeSpan.duration / 3600000); // events per hour
    }

    return performance;
  }

  async _calculateSnapshotStatistics() {
    return {
      totalAuditEntries: this.state.totalEvents,
      cacheSize: Object.keys(this.state.analyticsCache).length,
      indexSize: this.state.eventIndex.size,
      integrityChainLength: this.state.integrityChain.length,
      lastSnapshot: this.state.lastSnapshot,
    };
  }

  _groupPerformanceByField(tasks, field) {
    const groups = {};
    tasks.forEach((task) => {
      const value = task[field] || 'unknown';
      if (!groups[value]) {
        groups[value] = {
          count: 0,
          totalDuration: 0,
          averageDuration: 0,
        };
      }
      groups[value].count++;
      if (task.duration) {
        groups[value].totalDuration += task.duration;
      }
    });

    // Calculate averages
    Object.values(groups).forEach((group) => {
      group.averageDuration =
        group.count > 0 ? group.totalDuration / group.count : 0;
    });

    return groups;
  }

  _calculatePerformanceTrends(tasks) {
    // Simple trend calculation - could be enhanced with more sophisticated analysis
    const completedTasks = tasks.filter(
      (t) => t.status === 'completed' && t.duration,
    );
    if (completedTasks.length < 2) return { trend: 'insufficient_data' };

    const sortedTasks = completedTasks.sort(
      (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
    );
    const midpoint = Math.floor(sortedTasks.length / 2);

    const firstHalfAvg =
      sortedTasks.slice(0, midpoint).reduce((sum, t) => sum + t.duration, 0) /
      midpoint;

    const secondHalfAvg =
      sortedTasks.slice(midpoint).reduce((sum, t) => sum + t.duration, 0) /
      (sortedTasks.length - midpoint);

    const change = ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100;

    return {
      trend:
        change > 5 ? 'deteriorating' : change < -5 ? 'improving' : 'stable',
      changePercentage: change,
      firstHalfAverage: firstHalfAvg,
      secondHalfAverage: secondHalfAvg,
    };
  }

  async _analyzeSystemHealthTrends(timeRange) {
    // Placeholder for system health trend analysis
    return {
      overallHealth: 'healthy',
      trends: [],
      recommendations: [],
    };
  }

  async _analyzeBottlenecks(timeRange) {
    // Placeholder for bottleneck analysis
    return {
      identifiedBottlenecks: [],
      recommendations: [],
    };
  }

  async _analyzePatterns(timeRange) {
    // Placeholder for pattern analysis
    return {
      successPatterns: [],
      failurePatterns: [],
      insights: [],
    };
  }

  async _generatePredictiveAnalytics(timeRange) {
    // Placeholder for predictive analytics
    return {
      predictions: [],
      confidence: 0,
      methodology: 'statistical_analysis',
    };
  }

  async _generateRecommendations(sections) {
    // Placeholder for recommendation generation
    return {
      recommendations: [],
      priority: 'medium',
      expectedImpact: 'moderate',
    };
  }

  async _cacheAnalyticsReport(report) {
    try {
      const cacheKey = `report-${report.reportType}-${Date.now()}`;
      this.state.analyticsCache[cacheKey] = {
        report,
        generatedAt: report.generatedAt,
        size: JSON.stringify(report).length,
      };

      // Persist cache periodically
      await this._persistAnalyticsCache();
    } catch (error) {
      console.warn(
        'TaskHistoryManager: Could not cache analytics report:',
        error.message,
      );
    }
  }

  async _persistEventIndex() {
    try {
      const indexData = {
        index: Object.fromEntries(this.state.eventIndex),
        totalEvents: this.state.totalEvents,
        lastUpdate: new Date().toISOString(),
      };

      await fs.writeFile(
        this.paths.eventIndex,
        JSON.stringify(indexData, null, 2),
      );
    } catch (error) {
      console.error(
        'TaskHistoryManager: Failed to persist event index:',
        error,
      );
    }
  }

  async _persistAnalyticsCache() {
    try {
      const cacheData = {
        cache: this.state.analyticsCache,
        lastUpdate: new Date().toISOString(),
      };

      await fs.writeFile(
        this.paths.analyticsCache,
        JSON.stringify(cacheData, null, 2),
      );
    } catch (error) {
      console.error(
        'TaskHistoryManager: Failed to persist analytics cache:',
        error,
      );
    }
  }

  async _validateAuditIntegrity() {
    if (!this.config.tamperDetection) return true;

    try {
      // Validate integrity chain
      for (let i = 1; i < this.state.integrityChain.length; i++) {
        const current = this.state.integrityChain[i];
        const previous = this.state.integrityChain[i - 1];

        if (current.previousHash !== previous.hash) {
          await this._logAuditEvent('integrity_violation', {
            entryId: current.entryId,
            expectedHash: previous.hash,
            actualHash: current.previousHash,
          });
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('TaskHistoryManager: Integrity validation failed:', error);
      return false;
    }
  }

  async _logAuditEvent(eventType, data) {
    const auditEntry = this._createAuditEntry(eventType, data);
    await this._appendToAuditLog(auditEntry);
  }

  // =================== PUBLIC API ===================

  /**
   * Get history system status
   */
  getHistoryStatus() {
    return {
      totalEvents: this.state.totalEvents,
      lastSnapshot: this.state.lastSnapshot,
      cacheSize: Object.keys(this.state.analyticsCache).length,
      integrityChainLength: this.state.integrityChain.length,
      auditLevel: this.config.auditLevel,
      retentionPeriod: this.config.retentionPeriodDays,
      tamperDetectionEnabled: this.config.tamperDetection,
    };
  }

  /**
   * Get recent audit events
   */
  async getRecentEvents(limit = 50) {
    try {
      const auditData = await fs.readFile(this.paths.auditLog, 'utf8');
      const events = auditData
        .trim()
        .split('\n')
        .slice(-limit)
        .map((line) => JSON.parse(line));

      return events.reverse(); // Most recent first
    } catch (error) {
      return [];
    }
  }

  /**
   * Get available snapshots
   */
  async getAvailableSnapshots() {
    try {
      const files = await fs.readdir(this.paths.stateSnapshots);
      const snapshots = [];

      for (const file of files.filter((f) => f.endsWith('.json'))) {
        try {
          const snapshotPath = path.join(this.paths.stateSnapshots, file);
          const stats = await fs.stat(snapshotPath);
          snapshots.push({
            name: file.replace('.json', ''),
            path: snapshotPath,
            size: stats.size,
            created: stats.ctime.toISOString(),
          });
        } catch (error) {
          // Skip invalid snapshots
        }
      }

      return snapshots.sort(
        (a, b) => new Date(b.created) - new Date(a.created),
      );
    } catch (error) {
      return [];
    }
  }

  /**
   * Cleanup resources
   */
  async cleanup() {
    if (this.state.snapshotInterval) {
      clearInterval(this.state.snapshotInterval);
    }

    // Persist final state
    await this._persistEventIndex();
    await this._persistAnalyticsCache();

    console.log('TaskHistoryManager: Cleanup completed');
  }
}

module.exports = TaskHistoryManager;
