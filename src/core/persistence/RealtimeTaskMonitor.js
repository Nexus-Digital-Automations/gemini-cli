#!/usr/bin/env node

/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Real-Time Task Status Monitor - Live Task State Broadcasting System
 *
 * === OVERVIEW ===
 * Comprehensive real-time monitoring system for autonomous task management with
 * live status updates, event broadcasting, performance tracking, and multi-agent coordination.
 *
 * === KEY FEATURES ===
 * • Real-time task status broadcasting with WebSocket-like events
 * • Live performance metrics and system health monitoring
 * • Agent activity tracking and workload visualization
 * • Task timeline and execution progress tracking
 * • System bottleneck detection and alerts
 * • Cross-session monitoring continuity
 * • Dashboard-ready data formatting and APIs
 * • Automated alert generation for critical issues
 *
 * === MONITORING ARCHITECTURE ===
 * 1. Event Streaming: Real-time task status change broadcasting
 * 2. Performance Tracking: CPU, memory, response time monitoring
 * 3. Agent Coordination: Multi-agent workload and status tracking
 * 4. Health Monitoring: System health checks and alerts
 * 5. Timeline Tracking: Complete task execution timeline
 * 6. Alert System: Automated notification for critical events
 *
 * @author Persistence Agent
 * @version 1.0.0
 * @since 2025-09-25
 */

const EventEmitter = require('node:events');
const fs = require('node:fs').promises;
const path = require('node:path');
const crypto = require('node:crypto');

/**
 * Real-Time Task Monitor - Live monitoring and broadcasting system
 */
class RealtimeTaskMonitor extends EventEmitter {
  constructor(persistenceEngine, options = {}) {
    super();

    this.persistenceEngine = persistenceEngine;
    this.projectRoot = options.projectRoot || process.cwd();
    this.monitoringDir = path.join(
      this.projectRoot,
      '.gemini-tasks',
      'monitoring',
    );

    // Monitoring configuration
    this.config = {
      updateInterval: options.updateInterval || 1000, // 1 second
      maxEventHistory: options.maxEventHistory || 10000,
      alertThresholds: {
        taskTimeout: 300000, // 5 minutes
        memoryUsage: 500 * 1024 * 1024, // 500MB
        errorRate: 0.1, // 10%
        responseTime: 5000, // 5 seconds
      },
      retentionPeriod: options.retentionPeriod || 7 * 24 * 60 * 60 * 1000, // 7 days
      ...options,
    };

    // Real-time monitoring state
    this.state = {
      // Task tracking
      activeTasks: new Map(),
      completedTasks: new Map(),
      failedTasks: new Map(),
      taskTimelines: new Map(),

      // Agent tracking
      activeAgents: new Map(),
      agentWorkloads: new Map(),
      agentPerformance: new Map(),

      // System metrics
      systemMetrics: {
        startTime: new Date().toISOString(),
        uptime: 0,
        totalTasks: 0,
        completedTasks: 0,
        failedTasks: 0,
        averageTaskTime: 0,
        systemLoad: 0,
        memoryUsage: 0,
      },

      // Event stream
      eventHistory: [],
      alerts: [],

      // Performance metrics
      performanceData: {
        responseTime: [],
        throughput: [],
        errorRate: [],
        memoryUsage: [],
        cpuUsage: [],
      },
    };

    // Storage paths
    this.paths = {
      realTimeData: path.join(this.monitoringDir, 'realtime-data.json'),
      eventStream: path.join(this.monitoringDir, 'event-stream.log'),
      performanceMetrics: path.join(
        this.monitoringDir,
        'performance-metrics.json',
      ),
      alertLog: path.join(this.monitoringDir, 'alert-log.json'),
      dashboardData: path.join(this.monitoringDir, 'dashboard-data.json'),
    };

    // Monitoring intervals
    this.intervals = new Map();

    // Dashboard subscribers (for real-time updates)
    this.subscribers = new Set();

    // Initialize monitoring system
    this._initialize();
  }

  // =================== INITIALIZATION ===================

  async _initialize() {
    try {
      await this._ensureMonitoringStructure();
      await this._loadMonitoringState();
      await this._startRealTimeMonitoring();
      await this._startPerformanceTracking();
      await this._startHealthChecks();

      console.log(
        'RealtimeTaskMonitor: Monitoring system initialized successfully',
      );
    } catch (error) {
      console.error('RealtimeTaskMonitor: Initialization failed:', error);
      throw new Error(
        `Real-time monitoring initialization failed: ${error.message}`,
      );
    }
  }

  async _ensureMonitoringStructure() {
    await fs.mkdir(this.monitoringDir, { recursive: true });

    // Initialize monitoring data files
    const initialFiles = [
      {
        path: this.paths.realTimeData,
        data: { state: this.state, lastUpdate: new Date().toISOString() },
      },
      {
        path: this.paths.performanceMetrics,
        data: { metrics: [], systemHealth: 'healthy' },
      },
      { path: this.paths.alertLog, data: { alerts: [], lastAlert: null } },
      {
        path: this.paths.dashboardData,
        data: { dashboard: {}, lastRefresh: new Date().toISOString() },
      },
    ];

    for (const file of initialFiles) {
      try {
        await fs.access(file.path);
      } catch {
        await fs.writeFile(file.path, JSON.stringify(file.data, null, 2));
      }
    }
  }

  async _loadMonitoringState() {
    try {
      const data = await fs.readFile(this.paths.realTimeData, 'utf8');
      const savedState = JSON.parse(data);

      // Restore monitoring state from previous session
      if (savedState.state) {
        this.state = {
          ...this.state,
          ...savedState.state,
          systemMetrics: {
            ...this.state.systemMetrics,
            startTime:
              savedState.state.systemMetrics?.startTime ||
              new Date().toISOString(),
          },
        };
      }
    } catch (error) {
      console.warn(
        'RealtimeTaskMonitor: Could not load previous state, starting fresh:',
        error.message,
      );
    }
  }

  // =================== REAL-TIME MONITORING ===================

  async _startRealTimeMonitoring() {
    // Main monitoring loop
    const monitoringInterval = setInterval(async () => {
      try {
        await this._updateSystemMetrics();
        await this._checkTaskTimeouts();
        await this._updateAgentStatus();
        await this._detectBottlenecks();
        await this._generateAlerts();
        await this._broadcastUpdates();
        await this._persistState();
      } catch (error) {
        console.error('RealtimeTaskMonitor: Monitoring loop error:', error);
      }
    }, this.config.updateInterval);

    this.intervals.set('monitoring', monitoringInterval);
  }

  async _startPerformanceTracking() {
    // Performance tracking loop
    const performanceInterval = setInterval(async () => {
      try {
        const metrics = await this._collectPerformanceMetrics();
        this.state.performanceData = this._updatePerformanceData(metrics);
        await this._persistPerformanceData();
      } catch (error) {
        console.error(
          'RealtimeTaskMonitor: Performance tracking error:',
          error,
        );
      }
    }, 5000); // Every 5 seconds

    this.intervals.set('performance', performanceInterval);
  }

  async _startHealthChecks() {
    // Health monitoring loop
    const healthInterval = setInterval(async () => {
      try {
        const healthStatus = await this._performHealthCheck();
        if (healthStatus.issues.length > 0) {
          await this._generateHealthAlert(healthStatus);
        }
      } catch (error) {
        console.error('RealtimeTaskMonitor: Health check error:', error);
      }
    }, 30000); // Every 30 seconds

    this.intervals.set('health', healthInterval);
  }

  // =================== TASK MONITORING ===================

  /**
   * Track task creation and lifecycle
   */
  async trackTask(task, event = 'created') {
    const timestamp = new Date().toISOString();
    const taskData = {
      ...task,
      monitoringData: {
        startTime:
          event === 'created' ? timestamp : task.monitoringData?.startTime,
        lastUpdate: timestamp,
        events: [
          ...(task.monitoringData?.events || []),
          { event, timestamp, metadata: {} },
        ],
      },
    };

    // Update task tracking
    if (['queued', 'assigned', 'in_progress'].includes(task.status)) {
      this.state.activeTasks.set(task.id, taskData);
    } else if (task.status === 'completed') {
      this.state.activeTasks.delete(task.id);
      this.state.completedTasks.set(task.id, taskData);
    } else if (['failed', 'cancelled'].includes(task.status)) {
      this.state.activeTasks.delete(task.id);
      this.state.failedTasks.set(task.id, taskData);
    }

    // Update task timeline
    this._updateTaskTimeline(task.id, event, taskData);

    // Log event
    await this._logEvent('task_status_change', {
      taskId: task.id,
      status: task.status,
      event,
      agent: task.assignedAgent,
    });

    // Broadcast update
    this.emit('taskUpdated', {
      taskId: task.id,
      status: task.status,
      event,
      timestamp,
      data: taskData,
    });

    return taskData;
  }

  /**
   * Track agent activity and performance
   */
  async trackAgent(agentId, activity, metadata = {}) {
    const timestamp = new Date().toISOString();

    if (!this.state.activeAgents.has(agentId)) {
      this.state.activeAgents.set(agentId, {
        id: agentId,
        startTime: timestamp,
        lastActivity: timestamp,
        activities: [],
        performance: {
          tasksCompleted: 0,
          tasksInProgress: 0,
          averageTaskTime: 0,
          errorRate: 0,
        },
      });
    }

    const agent = this.state.activeAgents.get(agentId);
    agent.lastActivity = timestamp;
    agent.activities.push({
      activity,
      timestamp,
      metadata,
    });

    // Keep only last 100 activities
    agent.activities = agent.activities.slice(-100);

    // Update workload tracking
    await this._updateAgentWorkload(agentId, activity, metadata);

    // Log event
    await this._logEvent('agent_activity', {
      agentId,
      activity,
      metadata,
    });

    // Broadcast update
    this.emit('agentUpdated', {
      agentId,
      activity,
      timestamp,
      agent,
    });

    return agent;
  }

  // =================== PERFORMANCE METRICS ===================

  async _collectPerformanceMetrics() {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    return {
      timestamp: new Date().toISOString(),
      memory: {
        rss: memUsage.rss,
        heapUsed: memUsage.heapUsed,
        heapTotal: memUsage.heapTotal,
        external: memUsage.external,
        arrayBuffers: memUsage.arrayBuffers,
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system,
      },
      tasks: {
        active: this.state.activeTasks.size,
        completed: this.state.completedTasks.size,
        failed: this.state.failedTasks.size,
      },
      agents: {
        active: this.state.activeAgents.size,
        totalActivities: Array.from(this.state.activeAgents.values()).reduce(
          (sum, agent) => sum + agent.activities.length,
          0,
        ),
      },
    };
  }

  _updatePerformanceData(metrics) {
    const data = this.state.performanceData;

    // Add new metrics
    data.responseTime.push({
      timestamp: metrics.timestamp,
      value: this.persistenceEngine?.metrics?.avgResponseTime || 0,
    });

    data.throughput.push({
      timestamp: metrics.timestamp,
      value: this.state.systemMetrics.completedTasks,
    });

    data.errorRate.push({
      timestamp: metrics.timestamp,
      value: this._calculateErrorRate(),
    });

    data.memoryUsage.push({
      timestamp: metrics.timestamp,
      value: metrics.memory.heapUsed,
    });

    data.cpuUsage.push({
      timestamp: metrics.timestamp,
      value: metrics.cpu.user + metrics.cpu.system,
    });

    // Keep only recent data (last 1000 points)
    Object.keys(data).forEach((key) => {
      if (data[key].length > 1000) {
        data[key] = data[key].slice(-1000);
      }
    });

    return data;
  }

  // =================== SYSTEM HEALTH & ALERTS ===================

  async _updateSystemMetrics() {
    const now = new Date();
    const startTime = new Date(this.state.systemMetrics.startTime);

    this.state.systemMetrics = {
      ...this.state.systemMetrics,
      uptime: now.getTime() - startTime.getTime(),
      totalTasks:
        this.state.activeTasks.size +
        this.state.completedTasks.size +
        this.state.failedTasks.size,
      completedTasks: this.state.completedTasks.size,
      failedTasks: this.state.failedTasks.size,
      averageTaskTime: this._calculateAverageTaskTime(),
      systemLoad: this._calculateSystemLoad(),
      memoryUsage: process.memoryUsage().heapUsed,
      lastUpdate: now.toISOString(),
    };
  }

  async _checkTaskTimeouts() {
    const now = Date.now();
    const timeoutThreshold = this.config.alertThresholds.taskTimeout;

    for (const [taskId, task] of this.state.activeTasks) {
      const taskStartTime = new Date(task.monitoringData.startTime).getTime();
      const taskDuration = now - taskStartTime;

      if (taskDuration > timeoutThreshold) {
        await this._generateAlert('task_timeout', {
          taskId,
          duration: taskDuration,
          threshold: timeoutThreshold,
          task,
        });
      }
    }
  }

  async _performHealthCheck() {
    const issues = [];
    const memUsage = process.memoryUsage();
    const errorRate = this._calculateErrorRate();

    // Memory usage check
    if (memUsage.heapUsed > this.config.alertThresholds.memoryUsage) {
      issues.push({
        type: 'memory_usage',
        severity: 'warning',
        value: memUsage.heapUsed,
        threshold: this.config.alertThresholds.memoryUsage,
      });
    }

    // Error rate check
    if (errorRate > this.config.alertThresholds.errorRate) {
      issues.push({
        type: 'error_rate',
        severity: 'critical',
        value: errorRate,
        threshold: this.config.alertThresholds.errorRate,
      });
    }

    // Response time check
    const avgResponseTime =
      this.persistenceEngine?.metrics?.avgResponseTime || 0;
    if (avgResponseTime > this.config.alertThresholds.responseTime) {
      issues.push({
        type: 'response_time',
        severity: 'warning',
        value: avgResponseTime,
        threshold: this.config.alertThresholds.responseTime,
      });
    }

    return {
      timestamp: new Date().toISOString(),
      healthy: issues.length === 0,
      issues,
    };
  }

  async _generateAlert(type, data) {
    const alert = {
      id: crypto.randomBytes(8).toString('hex'),
      type,
      timestamp: new Date().toISOString(),
      severity: this._determineAlertSeverity(type, data),
      data,
      acknowledged: false,
    };

    this.state.alerts.unshift(alert);

    // Keep only last 1000 alerts
    this.state.alerts = this.state.alerts.slice(0, 1000);

    // Log alert
    await this._logEvent('alert_generated', alert);

    // Broadcast alert
    this.emit('alert', alert);

    return alert;
  }

  // =================== DASHBOARD & REAL-TIME UPDATES ===================

  /**
   * Generate dashboard-ready data
   */
  async generateDashboardData() {
    const now = new Date().toISOString();

    const dashboardData = {
      timestamp: now,
      summary: {
        systemHealth: await this._getSystemHealthStatus(),
        taskStats: this._getTaskStatistics(),
        agentStats: this._getAgentStatistics(),
        performanceSummary: this._getPerformanceSummary(),
      },
      realTimeData: {
        activeTasks: Array.from(this.state.activeTasks.values()),
        activeAgents: Array.from(this.state.activeAgents.values()),
        recentEvents: this.state.eventHistory.slice(-50),
        activeAlerts: this.state.alerts.filter((a) => !a.acknowledged),
      },
      charts: {
        taskThroughput: this.state.performanceData.throughput.slice(-50),
        memoryUsage: this.state.performanceData.memoryUsage.slice(-50),
        responseTime: this.state.performanceData.responseTime.slice(-50),
        errorRate: this.state.performanceData.errorRate.slice(-50),
      },
      timelines: this._getTaskTimelines(),
      systemMetrics: this.state.systemMetrics,
    };

    // Persist dashboard data
    await fs.writeFile(
      this.paths.dashboardData,
      JSON.stringify(dashboardData, null, 2),
    );

    return dashboardData;
  }

  /**
   * Subscribe to real-time updates
   */
  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  async _broadcastUpdates() {
    if (this.subscribers.size === 0) return;

    const updateData = {
      timestamp: new Date().toISOString(),
      systemMetrics: this.state.systemMetrics,
      activeTasks: this.state.activeTasks.size,
      completedTasks: this.state.completedTasks.size,
      activeAgents: this.state.activeAgents.size,
      recentAlerts: this.state.alerts
        .filter((a) => !a.acknowledged)
        .slice(0, 5),
    };

    this.subscribers.forEach((callback) => {
      try {
        callback(updateData);
      } catch (error) {
        console.error('RealtimeTaskMonitor: Subscriber callback error:', error);
      }
    });
  }

  // =================== UTILITY METHODS ===================

  async _logEvent(eventType, data) {
    const event = {
      timestamp: new Date().toISOString(),
      type: eventType,
      data,
    };

    this.state.eventHistory.push(event);

    // Keep only recent events
    if (this.state.eventHistory.length > this.config.maxEventHistory) {
      this.state.eventHistory = this.state.eventHistory.slice(
        -this.config.maxEventHistory,
      );
    }

    // Append to event stream log
    try {
      await fs.appendFile(this.paths.eventStream, JSON.stringify(event) + '\n');
    } catch (error) {
      console.warn('RealtimeTaskMonitor: Event logging failed:', error.message);
    }
  }

  async _persistState() {
    try {
      const stateData = {
        state: this.state,
        lastUpdate: new Date().toISOString(),
      };

      await fs.writeFile(
        this.paths.realTimeData,
        JSON.stringify(stateData, null, 2),
      );
    } catch (error) {
      console.warn(
        'RealtimeTaskMonitor: State persistence failed:',
        error.message,
      );
    }
  }

  async _persistPerformanceData() {
    try {
      const perfData = {
        metrics: this.state.performanceData,
        systemHealth: await this._getSystemHealthStatus(),
        lastUpdate: new Date().toISOString(),
      };

      await fs.writeFile(
        this.paths.performanceMetrics,
        JSON.stringify(perfData, null, 2),
      );
    } catch (error) {
      console.warn(
        'RealtimeTaskMonitor: Performance data persistence failed:',
        error.message,
      );
    }
  }

  _updateTaskTimeline(taskId, event, taskData) {
    if (!this.state.taskTimelines.has(taskId)) {
      this.state.taskTimelines.set(taskId, []);
    }

    const timeline = this.state.taskTimelines.get(taskId);
    timeline.push({
      timestamp: new Date().toISOString(),
      event,
      status: taskData.status,
      agent: taskData.assignedAgent,
      metadata: {},
    });

    // Keep only last 100 timeline entries per task
    if (timeline.length > 100) {
      timeline.splice(0, timeline.length - 100);
    }
  }

  async _updateAgentWorkload(agentId, activity, metadata) {
    if (!this.state.agentWorkloads.has(agentId)) {
      this.state.agentWorkloads.set(agentId, {
        currentTasks: 0,
        completedTasks: 0,
        failedTasks: 0,
        averageTaskTime: 0,
        lastActivity: new Date().toISOString(),
      });
    }

    const workload = this.state.agentWorkloads.get(agentId);
    workload.lastActivity = new Date().toISOString();

    // Update workload based on activity
    if (activity === 'task_assigned') {
      workload.currentTasks++;
    } else if (activity === 'task_completed') {
      workload.currentTasks = Math.max(0, workload.currentTasks - 1);
      workload.completedTasks++;
    } else if (activity === 'task_failed') {
      workload.currentTasks = Math.max(0, workload.currentTasks - 1);
      workload.failedTasks++;
    }
  }

  _calculateErrorRate() {
    const total = this.state.completedTasks.size + this.state.failedTasks.size;
    return total > 0 ? this.state.failedTasks.size / total : 0;
  }

  _calculateAverageTaskTime() {
    const completedTasks = Array.from(this.state.completedTasks.values());
    if (completedTasks.length === 0) return 0;

    const totalTime = completedTasks.reduce((sum, task) => {
      const startTime = new Date(
        task.monitoringData?.startTime || task.created_at,
      );
      const endTime = new Date(task.updated_at);
      return sum + (endTime.getTime() - startTime.getTime());
    }, 0);

    return totalTime / completedTasks.length;
  }

  _calculateSystemLoad() {
    // Simple load calculation based on active tasks and agents
    const activeTasks = this.state.activeTasks.size;
    const activeAgents = this.state.activeAgents.size;
    return activeAgents > 0 ? activeTasks / activeAgents : 0;
  }

  _determineAlertSeverity(type, data) {
    const severityMap = {
      task_timeout: 'warning',
      memory_usage: 'warning',
      error_rate: 'critical',
      response_time: 'warning',
      system_failure: 'critical',
      agent_timeout: 'warning',
    };
    return severityMap[type] || 'info';
  }

  _getTaskStatistics() {
    return {
      active: this.state.activeTasks.size,
      completed: this.state.completedTasks.size,
      failed: this.state.failedTasks.size,
      total:
        this.state.activeTasks.size +
        this.state.completedTasks.size +
        this.state.failedTasks.size,
    };
  }

  _getAgentStatistics() {
    const agents = Array.from(this.state.activeAgents.values());
    return {
      total: agents.length,
      averageTasksPerAgent:
        agents.length > 0
          ? agents.reduce(
              (sum, agent) => sum + agent.performance.tasksInProgress,
              0,
            ) / agents.length
          : 0,
      mostActiveAgent: agents.reduce(
        (max, agent) =>
          agent.activities.length > (max?.activities?.length || 0)
            ? agent
            : max,
        null,
      )?.id,
    };
  }

  _getPerformanceSummary() {
    const recent = this.state.performanceData;
    const getLatest = (arr) => (arr.length > 0 ? arr[arr.length - 1].value : 0);

    return {
      averageResponseTime: getLatest(recent.responseTime),
      memoryUsage: getLatest(recent.memoryUsage),
      throughput: getLatest(recent.throughput),
      errorRate: getLatest(recent.errorRate),
    };
  }

  async _getSystemHealthStatus() {
    const healthCheck = await this._performHealthCheck();
    return {
      status: healthCheck.healthy ? 'healthy' : 'degraded',
      issues: healthCheck.issues.length,
      lastCheck: healthCheck.timestamp,
    };
  }

  _getTaskTimelines() {
    const timelines = {};
    for (const [taskId, timeline] of this.state.taskTimelines) {
      timelines[taskId] = timeline.slice(-20); // Last 20 events per task
    }
    return timelines;
  }

  async _detectBottlenecks() {
    const bottlenecks = [];

    // Agent overload detection
    for (const [agentId, workload] of this.state.agentWorkloads) {
      if (workload.currentTasks > 10) {
        // Threshold for overload
        bottlenecks.push({
          type: 'agent_overload',
          agentId,
          currentTasks: workload.currentTasks,
        });
      }
    }

    // Queue backlog detection
    const queuedTasks = Array.from(this.state.activeTasks.values()).filter(
      (task) => task.status === 'queued',
    );

    if (queuedTasks.length > 50) {
      // Threshold for queue backlog
      bottlenecks.push({
        type: 'queue_backlog',
        queuedTasks: queuedTasks.length,
      });
    }

    // Generate alerts for bottlenecks
    for (const bottleneck of bottlenecks) {
      await this._generateAlert('bottleneck_detected', bottleneck);
    }

    return bottlenecks;
  }

  async _generateHealthAlert(healthStatus) {
    for (const issue of healthStatus.issues) {
      await this._generateAlert('health_issue', {
        issue: issue.type,
        severity: issue.severity,
        value: issue.value,
        threshold: issue.threshold,
      });
    }
  }

  // =================== PUBLIC API ===================

  /**
   * Get real-time system status
   */
  getSystemStatus() {
    return {
      systemMetrics: this.state.systemMetrics,
      taskStats: this._getTaskStatistics(),
      agentStats: this._getAgentStatistics(),
      performanceSummary: this._getPerformanceSummary(),
      activeAlerts: this.state.alerts.filter((a) => !a.acknowledged).length,
      lastUpdate: new Date().toISOString(),
    };
  }

  /**
   * Get task timeline for specific task
   */
  getTaskTimeline(taskId) {
    return this.state.taskTimelines.get(taskId) || [];
  }

  /**
   * Get agent performance data
   */
  getAgentPerformance(agentId) {
    return {
      agent: this.state.activeAgents.get(agentId),
      workload: this.state.agentWorkloads.get(agentId),
      recentActivities:
        this.state.activeAgents.get(agentId)?.activities?.slice(-20) || [],
    };
  }

  /**
   * Acknowledge alert
   */
  async acknowledgeAlert(alertId) {
    const alert = this.state.alerts.find((a) => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      alert.acknowledgedAt = new Date().toISOString();
      await this._logEvent('alert_acknowledged', { alertId });
      this.emit('alertAcknowledged', alert);
    }
    return alert;
  }

  /**
   * Cleanup resources
   */
  async cleanup() {
    // Clear all intervals
    for (const [name, interval] of this.intervals) {
      clearInterval(interval);
      console.log(`RealtimeTaskMonitor: Cleared ${name} interval`);
    }

    // Persist final state
    await this._persistState();
    await this._persistPerformanceData();

    console.log('RealtimeTaskMonitor: Cleanup completed');
  }
}

module.exports = RealtimeTaskMonitor;
