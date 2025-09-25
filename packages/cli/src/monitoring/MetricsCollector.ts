/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { EventEmitter } from 'node:events';
import { cpus, freemem, totalmem, loadavg } from 'node:os';
import { performance } from 'node:perf_hooks';
import { Logger } from '../utils/logger.js';
import type { TaskMetadata, TaskStatus, AgentStatus } from './TaskStatusMonitor.js';

/**
 * System resource metrics
 */
export interface SystemMetrics {
  timestamp: Date;
  cpu: {
    usage: number; // percentage
    cores: number;
    loadAverage: number[];
  };
  memory: {
    used: number; // bytes
    free: number; // bytes
    total: number; // bytes
    usagePercent: number;
  };
  performance: {
    uptime: number; // milliseconds
    eventLoopLag: number; // milliseconds
    gcPause: number; // milliseconds (if available)
  };
}

/**
 * Task performance metrics
 */
export interface TaskPerformanceMetrics {
  taskId: string;
  agentId?: string;
  startTime: Date;
  endTime?: Date;
  duration?: number; // milliseconds
  status: TaskStatus;
  cpuUsageDuringTask: number[];
  memoryUsageDuringTask: number[];
  operationCounts: {
    fileOperations: number;
    networkRequests: number;
    computeOperations: number;
    databaseQueries: number;
  };
  performanceMarks: PerformanceEntry[];
  errorCount: number;
  retryCount: number;
  throughputMetrics: {
    operationsPerSecond: number;
    dataProcessedMB: number;
    requestsProcessed: number;
  };
}

/**
 * Agent performance metrics
 */
export interface AgentPerformanceMetrics {
  agentId: string;
  sessionId: string;
  activePeriod: {
    start: Date;
    end?: Date;
    duration: number;
  };
  taskMetrics: {
    totalTasks: number;
    completedTasks: number;
    failedTasks: number;
    averageTaskDuration: number;
    taskThroughput: number; // tasks per hour
  };
  resourceUtilization: {
    averageCpuUsage: number;
    peakMemoryUsage: number;
    averageMemoryUsage: number;
    resourceEfficiency: number;
  };
  performanceProfile: {
    strengths: string[]; // task types the agent excels at
    weaknesses: string[]; // task types with poor performance
    optimalTaskSize: 'small' | 'medium' | 'large';
    preferredTaskTypes: string[];
  };
  qualityMetrics: {
    successRate: number;
    errorRate: number;
    averageRetryCount: number;
    codeQualityScore: number;
  };
}

/**
 * Bottleneck analysis result
 */
export interface BottleneckAnalysis {
  type: 'cpu' | 'memory' | 'io' | 'network' | 'dependency' | 'concurrency';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  affectedTasks: string[];
  affectedAgents: string[];
  recommendations: string[];
  estimatedImpact: {
    performanceReduction: number; // percentage
    taskDelayMinutes: number;
    affectedTaskCount: number;
  };
  detectionTime: Date;
  resolved: boolean;
  resolutionTime?: Date;
}

/**
 * Performance alert configuration
 */
export interface PerformanceAlertConfig {
  name: string;
  condition: {
    metric: string; // dot notation path to metric
    operator: '>' | '<' | '==' | '!=' | '>=' | '<=';
    threshold: number;
    duration?: number; // milliseconds the condition must persist
  };
  severity: 'info' | 'warning' | 'error' | 'critical';
  cooldownPeriod: number; // milliseconds between alerts of same type
  actions: {
    notify: boolean;
    escalate: boolean;
    autoRemediate: boolean;
  };
}

/**
 * Comprehensive metrics collection and analysis
 */
export interface SystemAnalytics {
  period: {
    start: Date;
    end: Date;
    duration: number;
  };
  systemOverview: {
    totalTasks: number;
    activeAgents: number;
    systemEfficiency: number;
    overallThroughput: number;
  };
  performanceTrends: {
    taskCompletionRate: number[];
    systemResourceUsage: number[];
    agentUtilization: number[];
    errorRates: number[];
  };
  bottleneckSummary: {
    totalBottlenecks: number;
    criticalBottlenecks: number;
    commonBottleneckTypes: string[];
    resolutionRate: number;
  };
  recommendations: {
    systemOptimization: string[];
    agentOptimization: string[];
    resourceAllocation: string[];
    workloadDistribution: string[];
  };
}

/**
 * MetricsCollector - Advanced performance monitoring and analysis
 *
 * Comprehensive system that provides:
 * - Real-time system and task performance monitoring
 * - Bottleneck detection and analysis
 * - Agent performance profiling
 * - Predictive performance analysis
 * - Automated performance optimization recommendations
 */
export class MetricsCollector extends EventEmitter {
  private readonly logger: Logger;
  private systemMetricsHistory: SystemMetrics[];
  private taskMetrics: Map<string, TaskPerformanceMetrics>;
  private agentMetrics: Map<string, AgentPerformanceMetrics>;
  private bottleneckHistory: BottleneckAnalysis[];
  private alertConfigs: Map<string, PerformanceAlertConfig>;
  private lastAlertTimes: Map<string, Date>;
  private collectionInterval?: NodeJS.Timeout;
  private analysisInterval?: NodeJS.Timeout;
  private performanceObserver?: PerformanceObserver;

  private readonly metricsRetentionPeriod = 24 * 60 * 60 * 1000; // 24 hours
  private readonly collectionIntervalMs = 5000; // 5 seconds
  private readonly analysisIntervalMs = 30000; // 30 seconds

  constructor() {
    super();
    this.logger = new Logger('MetricsCollector');
    this.systemMetricsHistory = [];
    this.taskMetrics = new Map();
    this.agentMetrics = new Map();
    this.bottleneckHistory = [];
    this.alertConfigs = new Map();
    this.lastAlertTimes = new Map();

    this.initializePerformanceObserver();
    this.setupDefaultAlerts();
    this.startMetricsCollection();
    this.startPeriodicAnalysis();

    this.logger.info('MetricsCollector initialized');
  }

  /**
   * Start collecting metrics for a specific task
   */
  async startTaskMetricsCollection(
    taskId: string,
    taskMetadata: TaskMetadata
  ): Promise<void> {
    const metrics: TaskPerformanceMetrics = {
      taskId,
      agentId: taskMetadata.assignedAgent,
      startTime: new Date(),
      status: taskMetadata.status,
      cpuUsageDuringTask: [],
      memoryUsageDuringTask: [],
      operationCounts: {
        fileOperations: 0,
        networkRequests: 0,
        computeOperations: 0,
        databaseQueries: 0,
      },
      performanceMarks: [],
      errorCount: 0,
      retryCount: 0,
      throughputMetrics: {
        operationsPerSecond: 0,
        dataProcessedMB: 0,
        requestsProcessed: 0,
      },
    };

    this.taskMetrics.set(taskId, metrics);

    // Mark performance start point
    performance.mark(`task-${taskId}-start`);

    this.emit('task-metrics:started', { taskId, metrics });
    this.logger.info('Task metrics collection started', {
      taskId,
      agentId: taskMetadata.assignedAgent,
    });
  }

  /**
   * Update task metrics during execution
   */
  async updateTaskMetrics(
    taskId: string,
    updates: {
      status?: TaskStatus;
      operationType?: keyof TaskPerformanceMetrics['operationCounts'];
      errorOccurred?: boolean;
      retryAttempted?: boolean;
      dataProcessed?: number; // MB
      requestsProcessed?: number;
    }
  ): Promise<void> {
    const metrics = this.taskMetrics.get(taskId);
    if (!metrics) return;

    if (updates.status) {
      metrics.status = updates.status;
    }

    if (updates.operationType) {
      metrics.operationCounts[updates.operationType]++;
    }

    if (updates.errorOccurred) {
      metrics.errorCount++;
    }

    if (updates.retryAttempted) {
      metrics.retryCount++;
    }

    if (updates.dataProcessed !== undefined) {
      metrics.throughputMetrics.dataProcessedMB += updates.dataProcessed;
    }

    if (updates.requestsProcessed !== undefined) {
      metrics.throughputMetrics.requestsProcessed += updates.requestsProcessed;
    }

    // Capture current resource usage
    const systemMetrics = await this.collectSystemMetrics();
    metrics.cpuUsageDuringTask.push(systemMetrics.cpu.usage);
    metrics.memoryUsageDuringTask.push(systemMetrics.memory.usagePercent);

    this.emit('task-metrics:updated', { taskId, metrics, updates });
  }

  /**
   * Complete task metrics collection
   */
  async completeTaskMetricsCollection(
    taskId: string,
    finalStatus: TaskStatus
  ): Promise<TaskPerformanceMetrics | null> {
    const metrics = this.taskMetrics.get(taskId);
    if (!metrics) return null;

    metrics.endTime = new Date();
    metrics.duration = metrics.endTime.getTime() - metrics.startTime.getTime();
    metrics.status = finalStatus;

    // Calculate throughput metrics
    if (metrics.duration > 0) {
      const durationSeconds = metrics.duration / 1000;
      const totalOperations = Object.values(metrics.operationCounts)
        .reduce((sum, count) => sum + count, 0);
      metrics.throughputMetrics.operationsPerSecond = totalOperations / durationSeconds;
    }

    // Mark performance end point and measure
    performance.mark(`task-${taskId}-end`);
    try {
      performance.measure(
        `task-${taskId}-duration`,
        `task-${taskId}-start`,
        `task-${taskId}-end`
      );

      // Collect all performance entries for this task
      metrics.performanceMarks = performance.getEntriesByName(`task-${taskId}-duration`);
    } catch (error) {
      this.logger.warning('Failed to collect performance marks', { taskId, error });
    }

    // Update agent metrics if assigned
    if (metrics.agentId) {
      await this.updateAgentPerformanceMetrics(metrics.agentId, metrics);
    }

    this.emit('task-metrics:completed', { taskId, metrics });
    this.logger.info('Task metrics collection completed', {
      taskId,
      duration: metrics.duration,
      status: finalStatus,
    });

    return metrics;
  }

  /**
   * Initialize agent performance tracking
   */
  async initializeAgentMetrics(agentId: string, sessionId: string): Promise<void> {
    const metrics: AgentPerformanceMetrics = {
      agentId,
      sessionId,
      activePeriod: {
        start: new Date(),
        duration: 0,
      },
      taskMetrics: {
        totalTasks: 0,
        completedTasks: 0,
        failedTasks: 0,
        averageTaskDuration: 0,
        taskThroughput: 0,
      },
      resourceUtilization: {
        averageCpuUsage: 0,
        peakMemoryUsage: 0,
        averageMemoryUsage: 0,
        resourceEfficiency: 1,
      },
      performanceProfile: {
        strengths: [],
        weaknesses: [],
        optimalTaskSize: 'medium',
        preferredTaskTypes: [],
      },
      qualityMetrics: {
        successRate: 100,
        errorRate: 0,
        averageRetryCount: 0,
        codeQualityScore: 100,
      },
    };

    this.agentMetrics.set(agentId, metrics);

    this.emit('agent-metrics:initialized', { agentId, metrics });
    this.logger.info('Agent metrics initialized', { agentId, sessionId });
  }

  /**
   * Get current system metrics
   */
  async collectSystemMetrics(): Promise<SystemMetrics> {
    const cpuInfo = cpus();
    const totalMem = totalmem();
    const freeMem = freemem();
    const usedMem = totalMem - freeMem;

    // Estimate CPU usage (simplified approach)
    const loadAverages = loadavg();
    const cpuUsage = Math.min(100, (loadAverages[0] / cpuInfo.length) * 100);

    const metrics: SystemMetrics = {
      timestamp: new Date(),
      cpu: {
        usage: cpuUsage,
        cores: cpuInfo.length,
        loadAverage: loadAverages,
      },
      memory: {
        used: usedMem,
        free: freeMem,
        total: totalMem,
        usagePercent: (usedMem / totalMem) * 100,
      },
      performance: {
        uptime: performance.now(),
        eventLoopLag: this.measureEventLoopLag(),
        gcPause: 0, // Would be populated if GC monitoring is available
      },
    };

    return metrics;
  }

  /**
   * Analyze system performance and detect bottlenecks
   */
  async analyzePerformanceBottlenecks(): Promise<BottleneckAnalysis[]> {
    const currentBottlenecks: BottleneckAnalysis[] = [];
    const recentMetrics = this.systemMetricsHistory.slice(-10); // Last 10 measurements

    if (recentMetrics.length < 3) return currentBottlenecks;

    // CPU bottleneck detection
    const avgCpuUsage = recentMetrics.reduce((sum, m) => sum + m.cpu.usage, 0) / recentMetrics.length;
    if (avgCpuUsage > 80) {
      const cpuBottleneck = this.createBottleneckAnalysis(
        'cpu',
        avgCpuUsage > 95 ? 'critical' : avgCpuUsage > 90 ? 'high' : 'medium',
        `High CPU usage detected: ${avgCpuUsage.toFixed(1)}%`,
        ['Consider load balancing', 'Optimize CPU-intensive operations', 'Scale horizontally']
      );
      currentBottlenecks.push(cpuBottleneck);
    }

    // Memory bottleneck detection
    const avgMemoryUsage = recentMetrics.reduce((sum, m) => sum + m.memory.usagePercent, 0) / recentMetrics.length;
    if (avgMemoryUsage > 85) {
      const memoryBottleneck = this.createBottleneckAnalysis(
        'memory',
        avgMemoryUsage > 95 ? 'critical' : avgMemoryUsage > 90 ? 'high' : 'medium',
        `High memory usage detected: ${avgMemoryUsage.toFixed(1)}%`,
        ['Optimize memory usage', 'Implement garbage collection tuning', 'Increase available memory']
      );
      currentBottlenecks.push(memoryBottleneck);
    }

    // Event loop lag detection
    const avgEventLoopLag = recentMetrics.reduce((sum, m) => sum + m.performance.eventLoopLag, 0) / recentMetrics.length;
    if (avgEventLoopLag > 100) {
      const lagBottleneck = this.createBottleneckAnalysis(
        'io',
        avgEventLoopLag > 500 ? 'critical' : avgEventLoopLag > 200 ? 'high' : 'medium',
        `High event loop lag detected: ${avgEventLoopLag.toFixed(1)}ms`,
        ['Optimize async operations', 'Reduce blocking operations', 'Implement proper queueing']
      );
      currentBottlenecks.push(lagBottleneck);
    }

    // Task concurrency bottleneck detection
    const activeTasks = Array.from(this.taskMetrics.values())
      .filter(t => !t.endTime).length;
    const activeAgents = Array.from(this.agentMetrics.values())
      .filter(a => !a.activePeriod.end).length;

    if (activeTasks > activeAgents * 3) { // More than 3 tasks per agent
      const concurrencyBottleneck = this.createBottleneckAnalysis(
        'concurrency',
        activeTasks > activeAgents * 5 ? 'high' : 'medium',
        `High task-to-agent ratio detected: ${(activeTasks / Math.max(activeAgents, 1)).toFixed(1)} tasks per agent`,
        ['Scale agent pool', 'Implement task prioritization', 'Optimize task distribution']
      );
      currentBottlenecks.push(concurrencyBottleneck);
    }

    // Store bottleneck history
    this.bottleneckHistory.push(...currentBottlenecks);
    this.cleanupOldBottlenecks();

    // Emit events for new bottlenecks
    for (const bottleneck of currentBottlenecks) {
      this.emit('bottleneck:detected', bottleneck);
      this.logger.warning('Performance bottleneck detected', {
        type: bottleneck.type,
        severity: bottleneck.severity,
        description: bottleneck.description,
      });
    }

    return currentBottlenecks;
  }

  /**
   * Get comprehensive system analytics
   */
  async getSystemAnalytics(periodHours = 24): Promise<SystemAnalytics> {
    const periodStart = new Date(Date.now() - periodHours * 60 * 60 * 1000);
    const periodEnd = new Date();

    const periodMetrics = this.systemMetricsHistory
      .filter(m => m.timestamp >= periodStart);

    const periodTasks = Array.from(this.taskMetrics.values())
      .filter(t => t.startTime >= periodStart);

    const periodBottlenecks = this.bottleneckHistory
      .filter(b => b.detectionTime >= periodStart);

    const analytics: SystemAnalytics = {
      period: {
        start: periodStart,
        end: periodEnd,
        duration: periodEnd.getTime() - periodStart.getTime(),
      },
      systemOverview: {
        totalTasks: periodTasks.length,
        activeAgents: Array.from(this.agentMetrics.values())
          .filter(a => !a.activePeriod.end).length,
        systemEfficiency: this.calculateSystemEfficiency(periodTasks),
        overallThroughput: this.calculateOverallThroughput(periodTasks),
      },
      performanceTrends: {
        taskCompletionRate: this.calculateTaskCompletionTrend(periodTasks),
        systemResourceUsage: this.calculateResourceUsageTrend(periodMetrics),
        agentUtilization: this.calculateAgentUtilizationTrend(),
        errorRates: this.calculateErrorRateTrend(periodTasks),
      },
      bottleneckSummary: {
        totalBottlenecks: periodBottlenecks.length,
        criticalBottlenecks: periodBottlenecks.filter(b => b.severity === 'critical').length,
        commonBottleneckTypes: this.getCommonBottleneckTypes(periodBottlenecks),
        resolutionRate: this.calculateBottleneckResolutionRate(periodBottlenecks),
      },
      recommendations: this.generateSystemRecommendations(periodMetrics, periodTasks, periodBottlenecks),
    };

    return analytics;
  }

  /**
   * Get task performance metrics
   */
  getTaskMetrics(taskId: string): TaskPerformanceMetrics | undefined {
    return this.taskMetrics.get(taskId);
  }

  /**
   * Get agent performance metrics
   */
  getAgentMetrics(agentId: string): AgentPerformanceMetrics | undefined {
    return this.agentMetrics.get(agentId);
  }

  /**
   * Get recent system metrics
   */
  getSystemMetricsHistory(limit = 100): SystemMetrics[] {
    return this.systemMetricsHistory
      .slice(-limit)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Configure performance alerts
   */
  configureAlert(config: PerformanceAlertConfig): void {
    this.alertConfigs.set(config.name, config);
    this.logger.info('Performance alert configured', {
      name: config.name,
      condition: config.condition,
      severity: config.severity,
    });
  }

  // Private methods

  private initializePerformanceObserver(): void {
    try {
      this.performanceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        // Store performance entries for analysis
        this.emit('performance:entries', entries);
      });

      this.performanceObserver.observe({ entryTypes: ['measure', 'navigation', 'mark'] });
    } catch (error) {
      this.logger.warning('Performance observer not available', { error });
    }
  }

  private setupDefaultAlerts(): void {
    const defaultAlerts: PerformanceAlertConfig[] = [
      {
        name: 'high-cpu-usage',
        condition: {
          metric: 'cpu.usage',
          operator: '>',
          threshold: 90,
          duration: 30000, // 30 seconds
        },
        severity: 'warning',
        cooldownPeriod: 300000, // 5 minutes
        actions: {
          notify: true,
          escalate: true,
          autoRemediate: false,
        },
      },
      {
        name: 'high-memory-usage',
        condition: {
          metric: 'memory.usagePercent',
          operator: '>',
          threshold: 85,
          duration: 60000, // 1 minute
        },
        severity: 'error',
        cooldownPeriod: 600000, // 10 minutes
        actions: {
          notify: true,
          escalate: true,
          autoRemediate: true,
        },
      },
      {
        name: 'high-event-loop-lag',
        condition: {
          metric: 'performance.eventLoopLag',
          operator: '>',
          threshold: 200,
          duration: 15000, // 15 seconds
        },
        severity: 'warning',
        cooldownPeriod: 180000, // 3 minutes
        actions: {
          notify: true,
          escalate: false,
          autoRemediate: false,
        },
      },
    ];

    defaultAlerts.forEach(alert => this.configureAlert(alert));
  }

  private startMetricsCollection(): void {
    this.collectionInterval = setInterval(async () => {
      try {
        const metrics = await this.collectSystemMetrics();
        this.systemMetricsHistory.push(metrics);
        this.cleanupOldMetrics();
        this.checkAlerts(metrics);

        this.emit('metrics:collected', metrics);
      } catch (error) {
        this.logger.error('Failed to collect system metrics', { error });
      }
    }, this.collectionIntervalMs);
  }

  private startPeriodicAnalysis(): void {
    this.analysisInterval = setInterval(async () => {
      try {
        await this.analyzePerformanceBottlenecks();
        this.updateAgentPerformanceProfiles();
      } catch (error) {
        this.logger.error('Failed to perform periodic analysis', { error });
      }
    }, this.analysisIntervalMs);
  }

  private measureEventLoopLag(): number {
    const start = performance.now();
    setImmediate(() => {
      const lag = performance.now() - start;
      // This is a simplified approach; real implementation would use more sophisticated timing
      return lag;
    });
    return 0; // Placeholder
  }

  private async updateAgentPerformanceMetrics(
    agentId: string,
    taskMetrics: TaskPerformanceMetrics
  ): Promise<void> {
    const agentMetrics = this.agentMetrics.get(agentId);
    if (!agentMetrics) return;

    // Update task metrics
    agentMetrics.taskMetrics.totalTasks++;
    if (taskMetrics.status === 'completed') {
      agentMetrics.taskMetrics.completedTasks++;
    } else if (taskMetrics.status === 'failed') {
      agentMetrics.taskMetrics.failedTasks++;
    }

    // Update average task duration
    if (taskMetrics.duration) {
      const totalDuration = agentMetrics.taskMetrics.averageTaskDuration *
        (agentMetrics.taskMetrics.totalTasks - 1) + taskMetrics.duration;
      agentMetrics.taskMetrics.averageTaskDuration = totalDuration / agentMetrics.taskMetrics.totalTasks;
    }

    // Update resource utilization
    if (taskMetrics.cpuUsageDuringTask.length > 0) {
      const avgTaskCpu = taskMetrics.cpuUsageDuringTask.reduce((a, b) => a + b) /
        taskMetrics.cpuUsageDuringTask.length;
      agentMetrics.resourceUtilization.averageCpuUsage =
        (agentMetrics.resourceUtilization.averageCpuUsage + avgTaskCpu) / 2;
    }

    // Update quality metrics
    const totalTasks = agentMetrics.taskMetrics.totalTasks;
    if (totalTasks > 0) {
      agentMetrics.qualityMetrics.successRate =
        (agentMetrics.taskMetrics.completedTasks / totalTasks) * 100;
      agentMetrics.qualityMetrics.errorRate =
        (taskMetrics.errorCount / Math.max(totalTasks, 1)) * 100;
    }
  }

  private createBottleneckAnalysis(
    type: BottleneckAnalysis['type'],
    severity: BottleneckAnalysis['severity'],
    description: string,
    recommendations: string[]
  ): BottleneckAnalysis {
    return {
      type,
      severity,
      description,
      affectedTasks: [], // Would be populated based on active task analysis
      affectedAgents: [], // Would be populated based on agent analysis
      recommendations,
      estimatedImpact: {
        performanceReduction: severity === 'critical' ? 50 : severity === 'high' ? 30 : 15,
        taskDelayMinutes: severity === 'critical' ? 10 : severity === 'high' ? 5 : 2,
        affectedTaskCount: 0,
      },
      detectionTime: new Date(),
      resolved: false,
    };
  }

  private updateAgentPerformanceProfiles(): void {
    // This would analyze agent performance patterns and update their profiles
    // Implementation would include task type analysis, performance trend analysis, etc.
  }

  private calculateSystemEfficiency(tasks: TaskPerformanceMetrics[]): number {
    if (tasks.length === 0) return 100;

    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    return (completedTasks / tasks.length) * 100;
  }

  private calculateOverallThroughput(tasks: TaskPerformanceMetrics[]): number {
    if (tasks.length === 0) return 0;

    const totalOperations = tasks.reduce((sum, task) =>
      sum + Object.values(task.operationCounts).reduce((a, b) => a + b, 0), 0
    );

    const totalDuration = tasks.reduce((sum, task) => sum + (task.duration || 0), 0);
    return totalDuration > 0 ? (totalOperations / (totalDuration / 1000)) : 0;
  }

  private calculateTaskCompletionTrend(tasks: TaskPerformanceMetrics[]): number[] {
    // Implementation would calculate completion rate trends over time
    return [];
  }

  private calculateResourceUsageTrend(metrics: SystemMetrics[]): number[] {
    return metrics.map(m => (m.cpu.usage + m.memory.usagePercent) / 2);
  }

  private calculateAgentUtilizationTrend(): number[] {
    // Implementation would calculate agent utilization trends
    return [];
  }

  private calculateErrorRateTrend(tasks: TaskPerformanceMetrics[]): number[] {
    // Implementation would calculate error rate trends over time
    return [];
  }

  private getCommonBottleneckTypes(bottlenecks: BottleneckAnalysis[]): string[] {
    const typeCounts = new Map<string, number>();
    bottlenecks.forEach(b => {
      typeCounts.set(b.type, (typeCounts.get(b.type) || 0) + 1);
    });

    return Array.from(typeCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([type]) => type);
  }

  private calculateBottleneckResolutionRate(bottlenecks: BottleneckAnalysis[]): number {
    if (bottlenecks.length === 0) return 100;

    const resolvedBottlenecks = bottlenecks.filter(b => b.resolved).length;
    return (resolvedBottlenecks / bottlenecks.length) * 100;
  }

  private generateSystemRecommendations(
    metrics: SystemMetrics[],
    tasks: TaskPerformanceMetrics[],
    bottlenecks: BottleneckAnalysis[]
  ): SystemAnalytics['recommendations'] {
    return {
      systemOptimization: ['Monitor resource usage patterns', 'Implement performance caching'],
      agentOptimization: ['Balance task distribution', 'Optimize agent capabilities'],
      resourceAllocation: ['Scale resources based on demand', 'Implement auto-scaling'],
      workloadDistribution: ['Implement intelligent task routing', 'Balance agent workloads'],
    };
  }

  private checkAlerts(metrics: SystemMetrics): void {
    for (const [alertName, config] of this.alertConfigs) {
      const lastAlert = this.lastAlertTimes.get(alertName);
      if (lastAlert && Date.now() - lastAlert.getTime() < config.cooldownPeriod) {
        continue; // Still in cooldown period
      }

      const metricValue = this.getMetricValue(metrics, config.condition.metric);
      if (metricValue !== null && this.evaluateCondition(metricValue, config.condition)) {
        this.triggerAlert(alertName, config, metricValue);
        this.lastAlertTimes.set(alertName, new Date());
      }
    }
  }

  private getMetricValue(metrics: SystemMetrics, metricPath: string): number | null {
    try {
      const path = metricPath.split('.');
      let value: any = metrics;
      for (const key of path) {
        value = value[key];
      }
      return typeof value === 'number' ? value : null;
    } catch {
      return null;
    }
  }

  private evaluateCondition(value: number, condition: PerformanceAlertConfig['condition']): boolean {
    switch (condition.operator) {
      case '>': return value > condition.threshold;
      case '<': return value < condition.threshold;
      case '>=': return value >= condition.threshold;
      case '<=': return value <= condition.threshold;
      case '==': return value === condition.threshold;
      case '!=': return value !== condition.threshold;
      default: return false;
    }
  }

  private triggerAlert(name: string, config: PerformanceAlertConfig, value: number): void {
    const alert = {
      name,
      severity: config.severity,
      condition: config.condition,
      currentValue: value,
      timestamp: new Date(),
      actions: config.actions,
    };

    this.emit('alert:triggered', alert);
    this.logger.warning('Performance alert triggered', alert);
  }

  private cleanupOldMetrics(): void {
    const cutoff = Date.now() - this.metricsRetentionPeriod;
    this.systemMetricsHistory = this.systemMetricsHistory
      .filter(metrics => metrics.timestamp.getTime() > cutoff);
  }

  private cleanupOldBottlenecks(): void {
    const cutoff = Date.now() - this.metricsRetentionPeriod;
    this.bottleneckHistory = this.bottleneckHistory
      .filter(bottleneck => bottleneck.detectionTime.getTime() > cutoff);
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.collectionInterval) {
      clearInterval(this.collectionInterval);
    }

    if (this.analysisInterval) {
      clearInterval(this.analysisInterval);
    }

    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
    }

    this.removeAllListeners();
    this.systemMetricsHistory.length = 0;
    this.taskMetrics.clear();
    this.agentMetrics.clear();
    this.bottleneckHistory.length = 0;
    this.alertConfigs.clear();
    this.lastAlertTimes.clear();

    this.logger.info('MetricsCollector destroyed');
  }
}

/**
 * Singleton instance for global access
 */
export const metricsCollector = new MetricsCollector();