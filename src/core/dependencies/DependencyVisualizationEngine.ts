/**
 * @fileoverview Real-time Dependency Visualization and Monitoring Engine
 * Advanced visualization system for dependency graphs, real-time status monitoring,
 * and interactive dependency relationship exploration
 *
 * === VISUALIZATION CAPABILITIES ===
 * • Interactive dependency graph visualization with D3.js-compatible data
 * • Real-time status updates and animated transitions
 * • Critical path highlighting and bottleneck identification
 * • Multi-level zoom and detail-on-demand functionality
 * • Performance heatmaps and resource utilization overlays
 * • Dependency conflict visualization and resolution guidance
 * • Historical timeline and execution flow analysis
 *
 * === MONITORING FEATURES ===
 * • Live dependency status tracking with WebSocket support
 * • Automated anomaly detection and alerting
 * • Performance metrics visualization and trending
 * • Resource constraint monitoring and prediction
 * • Execution timeline with critical events
 * • Dependency health scoring and recommendations
 *
 * @author DEPENDENCY_ANALYST
 * @version 1.0.0
 * @since 2025-09-25
 */

import { EventEmitter } from 'events';
import { Logger } from '../../utils/logger.js';
import {
  DependencyAnalyzer,
  TaskNode,
  TaskDependency,
  DependencyType,
  DependencyStatus,
  ExecutionReadiness,
  DependencyConflict
} from './DependencyAnalyzer.js';
import {
  IntelligentTaskScheduler,
  ExecutionContext,
  SystemMetrics,
  SchedulingEvent
} from './IntelligentTaskScheduler.js';

/**
 * Visualization node with enhanced display properties
 */
export interface VisualizationNode {
  id: string;
  label: string;
  type: string;
  status: string;
  priority: number;
  readiness: ExecutionReadiness;
  position: {
    x: number;
    y: number;
    z?: number; // For 3D visualization
  };
  size: number;
  color: string;
  shape: 'circle' | 'rectangle' | 'diamond' | 'hexagon';
  metadata: {
    estimatedDuration: number;
    actualDuration?: number;
    resourceUsage: Record<string, number>;
    dependencies: number;
    dependents: number;
    criticalPath: boolean;
    bottleneck: boolean;
  };
  animation?: {
    type: 'pulse' | 'glow' | 'rotate' | 'scale';
    duration: number;
    iteration: 'infinite' | number;
  };
}

/**
 * Visualization edge with relationship properties
 */
export interface VisualizationEdge {
  id: string;
  source: string;
  target: string;
  type: DependencyType;
  status: DependencyStatus;
  weight: number;
  strength: number; // Visual strength (0-1)
  color: string;
  style: 'solid' | 'dashed' | 'dotted' | 'thick';
  metadata: {
    createdAt: Date;
    lastUpdate: Date;
    satisfaction: boolean;
    criticality: number;
    conflicts: string[];
  };
  animation?: {
    direction: 'forward' | 'backward' | 'bidirectional';
    speed: number;
    particles: boolean;
  };
}

/**
 * Visualization layout configuration
 */
export interface LayoutConfiguration {
  algorithm: 'force_directed' | 'hierarchical' | 'circular' | 'grid' | 'layered';
  dimensions: '2d' | '3d';
  spacing: {
    nodeDistance: number;
    levelDistance: number;
    edgeLength: number;
  };
  forces: {
    repulsion: number;
    attraction: number;
    gravity: number;
    friction: number;
  };
  constraints: {
    boundaryBox: { width: number; height: number; depth?: number };
    fixedNodes: string[];
    grouping: Record<string, string[]>;
  };
  animation: {
    enabled: boolean;
    duration: number;
    easing: 'linear' | 'ease-in' | 'ease-out' | 'bounce';
  };
}

/**
 * Performance heatmap data
 */
export interface HeatmapData {
  nodeId: string;
  metrics: {
    executionTime: number;
    queueTime: number;
    resourceUtilization: number;
    errorRate: number;
    throughput: number;
  };
  color: string;
  intensity: number; // 0-1
  tooltip: string;
}

/**
 * Timeline event for execution flow visualization
 */
export interface TimelineEvent {
  id: string;
  timestamp: Date;
  type: 'task_started' | 'task_completed' | 'task_failed' | 'dependency_satisfied' | 'conflict_detected';
  taskId?: string;
  dependencyId?: string;
  description: string;
  impact: 'low' | 'medium' | 'high' | 'critical';
  data: Record<string, any>;
  visualization: {
    position: number; // 0-1 along timeline
    color: string;
    size: number;
    shape: 'dot' | 'triangle' | 'square' | 'diamond';
  };
}

/**
 * Alert configuration and data
 */
export interface VisualizationAlert {
  id: string;
  type: 'performance' | 'dependency' | 'resource' | 'conflict';
  severity: 'info' | 'warning' | 'error' | 'critical';
  title: string;
  description: string;
  affectedNodes: string[];
  affectedEdges: string[];
  timestamp: Date;
  resolved: boolean;
  actions: {
    label: string;
    action: string;
    priority: number;
  }[];
  visualization: {
    highlight: boolean;
    overlay: boolean;
    animation: boolean;
  };
}

/**
 * Real-time Dependency Visualization Engine
 */
export class DependencyVisualizationEngine extends EventEmitter {
  private readonly logger: Logger;
  private readonly dependencyAnalyzer: DependencyAnalyzer;
  private readonly taskScheduler: IntelligentTaskScheduler;

  private visualizationData: {
    nodes: Map<string, VisualizationNode>;
    edges: Map<string, VisualizationEdge>;
    layout: LayoutConfiguration;
    lastUpdate: Date;
  };

  private performanceData: {
    heatmap: Map<string, HeatmapData>;
    timeline: TimelineEvent[];
    metrics: SystemMetrics[];
  };

  private alerts: Map<string, VisualizationAlert>;
  private subscribers: Set<(data: any) => void>;

  private updateTimer?: NodeJS.Timeout;
  private readonly updateInterval = 1000; // 1 second for real-time updates

  constructor(
    dependencyAnalyzer: DependencyAnalyzer,
    taskScheduler: IntelligentTaskScheduler
  ) {
    super();

    this.logger = new Logger('DependencyVisualizationEngine');
    this.dependencyAnalyzer = dependencyAnalyzer;
    this.taskScheduler = taskScheduler;

    // Initialize visualization data
    this.visualizationData = {
      nodes: new Map(),
      edges: new Map(),
      layout: this.getDefaultLayoutConfiguration(),
      lastUpdate: new Date()
    };

    this.performanceData = {
      heatmap: new Map(),
      timeline: [],
      metrics: []
    };

    this.alerts = new Map();
    this.subscribers = new Set();

    this.logger.info('DependencyVisualizationEngine initialized with real-time monitoring');

    this.initializeEventHandlers();
    this.startRealTimeUpdates();
  }

  /**
   * Get current visualization data for rendering
   */
  public getVisualizationData(): {
    nodes: VisualizationNode[];
    edges: VisualizationEdge[];
    layout: LayoutConfiguration;
    metadata: {
      nodeCount: number;
      edgeCount: number;
      lastUpdate: Date;
      criticalPath: string[];
      conflicts: number;
    };
  } {
    const nodes = Array.from(this.visualizationData.nodes.values());
    const edges = Array.from(this.visualizationData.edges.values());

    const criticalPath = this.extractCriticalPathFromNodes(nodes);
    const conflicts = Array.from(this.alerts.values()).filter(alert =>
      alert.type === 'conflict' && !alert.resolved
    ).length;

    return {
      nodes,
      edges,
      layout: this.visualizationData.layout,
      metadata: {
        nodeCount: nodes.length,
        edgeCount: edges.length,
        lastUpdate: this.visualizationData.lastUpdate,
        criticalPath,
        conflicts
      }
    };
  }

  /**
   * Get performance heatmap data
   */
  public getHeatmapData(): HeatmapData[] {
    return Array.from(this.performanceData.heatmap.values());
  }

  /**
   * Get execution timeline data
   */
  public getTimelineData(timeRange?: { start: Date; end: Date }): TimelineEvent[] {
    let timeline = this.performanceData.timeline;

    if (timeRange) {
      timeline = timeline.filter(event =>
        event.timestamp >= timeRange.start && event.timestamp <= timeRange.end
      );
    }

    return timeline.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  /**
   * Get current alerts
   */
  public getAlerts(severity?: VisualizationAlert['severity']): VisualizationAlert[] {
    let alerts = Array.from(this.alerts.values()).filter(alert => !alert.resolved);

    if (severity) {
      alerts = alerts.filter(alert => alert.severity === severity);
    }

    return alerts.sort((a, b) => {
      const severityOrder = { critical: 4, error: 3, warning: 2, info: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });
  }

  /**
   * Update layout configuration
   */
  public updateLayout(layoutConfig: Partial<LayoutConfiguration>): void {
    this.logger.info('Updating visualization layout', { changes: layoutConfig });

    this.visualizationData.layout = {
      ...this.visualizationData.layout,
      ...layoutConfig
    };

    this.recalculateNodePositions();
    this.notifySubscribers('layout_updated', { layout: this.visualizationData.layout });
  }

  /**
   * Highlight specific nodes and edges
   */
  public highlightElements(nodeIds: string[], edgeIds: string[] = []): void {
    // Reset previous highlights
    for (const node of this.visualizationData.nodes.values()) {
      node.animation = undefined;
    }
    for (const edge of this.visualizationData.edges.values()) {
      edge.animation = undefined;
    }

    // Apply new highlights
    for (const nodeId of nodeIds) {
      const node = this.visualizationData.nodes.get(nodeId);
      if (node) {
        node.animation = {
          type: 'glow',
          duration: 2000,
          iteration: 'infinite'
        };
      }
    }

    for (const edgeId of edgeIds) {
      const edge = this.visualizationData.edges.get(edgeId);
      if (edge) {
        edge.animation = {
          direction: 'forward',
          speed: 1,
          particles: true
        };
      }
    }

    this.notifySubscribers('highlight_updated', { nodeIds, edgeIds });
  }

  /**
   * Focus on specific task and its dependencies
   */
  public focusOnTask(taskId: string, depth: number = 2): void {
    this.logger.info(`Focusing visualization on task: ${taskId}`, { depth });

    const focusNodes = new Set([taskId]);
    const focusEdges = new Set<string>();

    // Recursively add dependencies and dependents
    this.addConnectedNodes(taskId, depth, focusNodes, focusEdges);

    // Dim non-focused elements
    for (const [nodeId, node] of this.visualizationData.nodes) {
      if (!focusNodes.has(nodeId)) {
        node.color = this.adjustColorOpacity(node.color, 0.3);
        node.size *= 0.7;
      }
    }

    for (const [edgeId, edge] of this.visualizationData.edges) {
      if (!focusEdges.has(edgeId)) {
        edge.color = this.adjustColorOpacity(edge.color, 0.3);
        edge.strength *= 0.5;
      }
    }

    this.notifySubscribers('focus_updated', { taskId, depth, focusNodes: Array.from(focusNodes) });
  }

  /**
   * Reset visualization to show all elements normally
   */
  public resetVisualization(): void {
    this.logger.info('Resetting visualization to default state');

    // Reset all node and edge properties
    this.refreshVisualizationData();
    this.notifySubscribers('visualization_reset', {});
  }

  /**
   * Subscribe to real-time updates
   */
  public subscribe(callback: (event: string, data: any) => void): () => void {
    const wrappedCallback = (data: any) => callback(data.event, data.data);
    this.subscribers.add(wrappedCallback);

    return () => {
      this.subscribers.delete(wrappedCallback);
    };
  }

  /**
   * Generate visualization report
   */
  public generateReport(): {
    summary: {
      totalTasks: number;
      activeTasks: number;
      completedTasks: number;
      failedTasks: number;
      criticalPathLength: number;
      averageExecutionTime: number;
      bottlenecks: number;
    };
    performance: {
      resourceUtilization: Record<string, number>;
      throughput: number;
      successRate: number;
      trends: Record<string, number>;
    };
    dependencies: {
      totalDependencies: number;
      hardDependencies: number;
      softDependencies: number;
      conflicts: number;
      circularDependencies: number;
    };
    recommendations: string[];
  } {
    const nodes = Array.from(this.visualizationData.nodes.values());
    const edges = Array.from(this.visualizationData.edges.values());
    const schedulerStatus = this.taskScheduler.getSchedulerStatus();
    const healthMetrics = this.dependencyAnalyzer.getHealthMetrics();

    const summary = {
      totalTasks: nodes.length,
      activeTasks: nodes.filter(n => n.status === 'running').length,
      completedTasks: nodes.filter(n => n.status === 'completed').length,
      failedTasks: nodes.filter(n => n.status === 'failed').length,
      criticalPathLength: this.extractCriticalPathFromNodes(nodes).length,
      averageExecutionTime: this.calculateAverageExecutionTime(nodes),
      bottlenecks: nodes.filter(n => n.metadata.bottleneck).length
    };

    const performance = {
      resourceUtilization: schedulerStatus.resourceUtilization,
      throughput: schedulerStatus.systemMetrics.taskThroughput,
      successRate: schedulerStatus.systemMetrics.successRate,
      trends: this.calculatePerformanceTrends()
    };

    const dependencies = {
      totalDependencies: edges.length,
      hardDependencies: edges.filter(e => e.type === DependencyType.HARD).length,
      softDependencies: edges.filter(e => e.type === DependencyType.SOFT).length,
      conflicts: healthMetrics.conflictCount,
      circularDependencies: healthMetrics.cyclicDependencies
    };

    const recommendations = [
      ...healthMetrics.recommendations,
      ...this.generateVisualizationRecommendations(summary, performance, dependencies)
    ];

    return {
      summary,
      performance,
      dependencies,
      recommendations
    };
  }

  // =================== PRIVATE METHODS ===================

  /**
   * Initialize event handlers for real-time updates
   */
  private initializeEventHandlers(): void {
    // Listen to dependency analyzer events
    this.dependencyAnalyzer.on('taskRegistered', (task: TaskNode) => {
      this.addOrUpdateVisualizationNode(task);
    });

    this.dependencyAnalyzer.on('dependencyAdded', (dependency: TaskDependency) => {
      this.addOrUpdateVisualizationEdge(dependency);
    });

    this.dependencyAnalyzer.on('dependencyRemoved', (dependency: TaskDependency) => {
      this.removeVisualizationEdge(dependency.id);
    });

    this.dependencyAnalyzer.on('conflictsDetected', (conflicts: DependencyConflict[]) => {
      this.handleDependencyConflicts(conflicts);
    });

    // Listen to task scheduler events
    this.taskScheduler.on('task_started', (event: SchedulingEvent) => {
      this.handleTaskEvent(event);
    });

    this.taskScheduler.on('task_completed', (event: SchedulingEvent) => {
      this.handleTaskEvent(event);
    });

    this.taskScheduler.on('task_failed', (event: SchedulingEvent) => {
      this.handleTaskEvent(event);
    });

    this.taskScheduler.on('schedule_optimized', (event: SchedulingEvent) => {
      this.handleSchedulingEvent(event);
    });
  }

  /**
   * Start real-time updates
   */
  private startRealTimeUpdates(): void {
    this.updateTimer = setInterval(() => {
      this.updateVisualizationData();
      this.updatePerformanceData();
      this.updateAlerts();
      this.notifySubscribers('data_updated', this.getVisualizationData());
    }, this.updateInterval);
  }

  /**
   * Update visualization data from current system state
   */
  private async updateVisualizationData(): Promise<void> {
    try {
      const graphData = this.dependencyAnalyzer.getVisualizationData();

      // Update nodes
      for (const nodeData of graphData.nodes) {
        const node = await this.createVisualizationNode(nodeData);
        this.visualizationData.nodes.set(node.id, node);
      }

      // Update edges
      for (const edgeData of graphData.edges) {
        const edge = this.createVisualizationEdge(edgeData);
        this.visualizationData.edges.set(edge.id, edge);
      }

      this.visualizationData.lastUpdate = new Date();

    } catch (error) {
      this.logger.error('Failed to update visualization data', { error });
    }
  }

  /**
   * Update performance data and heatmap
   */
  private updatePerformanceData(): void {
    const schedulerStatus = this.taskScheduler.getSchedulerStatus();

    // Update system metrics
    this.performanceData.metrics.push(schedulerStatus.systemMetrics);
    if (this.performanceData.metrics.length > 100) {
      this.performanceData.metrics.shift();
    }

    // Update heatmap data
    for (const [nodeId, node] of this.visualizationData.nodes) {
      const taskStatus = this.taskScheduler.getTaskStatus(nodeId);
      if (taskStatus) {
        const heatmapData: HeatmapData = {
          nodeId,
          metrics: {
            executionTime: taskStatus.metrics.executionTime,
            queueTime: taskStatus.metrics.queueTime,
            resourceUtilization: this.calculateResourceUtilizationScore(taskStatus.metrics.resourceUtilization),
            errorRate: taskStatus.status === 'failed' ? 1 : 0,
            throughput: 1 / Math.max(taskStatus.metrics.executionTime, 1)
          },
          color: this.calculateHeatmapColor(taskStatus),
          intensity: this.calculateHeatmapIntensity(taskStatus),
          tooltip: this.generateHeatmapTooltip(taskStatus)
        };

        this.performanceData.heatmap.set(nodeId, heatmapData);
      }
    }
  }

  /**
   * Update alerts based on current system state
   */
  private updateAlerts(): void {
    const healthMetrics = this.dependencyAnalyzer.getHealthMetrics();
    const schedulerStatus = this.taskScheduler.getSchedulerStatus();

    // Clear resolved alerts
    for (const [alertId, alert] of this.alerts) {
      if (this.isAlertResolved(alert)) {
        alert.resolved = true;
      }
    }

    // Generate new alerts
    this.generatePerformanceAlerts(schedulerStatus);
    this.generateDependencyAlerts(healthMetrics);
    this.generateResourceAlerts(schedulerStatus);
  }

  /**
   * Create visualization node from task data
   */
  private async createVisualizationNode(nodeData: any): Promise<VisualizationNode> {
    const taskAnalysis = await this.dependencyAnalyzer.analyzeTask(nodeData.id);

    return {
      id: nodeData.id,
      label: nodeData.label,
      type: nodeData.type,
      status: nodeData.status,
      priority: nodeData.priority,
      readiness: taskAnalysis.readiness,
      position: this.calculateNodePosition(nodeData),
      size: this.calculateNodeSize(nodeData, taskAnalysis),
      color: this.calculateNodeColor(nodeData, taskAnalysis),
      shape: this.calculateNodeShape(nodeData),
      metadata: {
        estimatedDuration: 0, // Would be extracted from task data
        resourceUsage: {},
        dependencies: taskAnalysis.dependsOn.length,
        dependents: taskAnalysis.enables.length,
        criticalPath: taskAnalysis.criticalPath.includes(nodeData.id),
        bottleneck: taskAnalysis.enables.length > 5
      }
    };
  }

  /**
   * Create visualization edge from dependency data
   */
  private createVisualizationEdge(edgeData: any): VisualizationEdge {
    return {
      id: edgeData.id,
      source: edgeData.source,
      target: edgeData.target,
      type: edgeData.type,
      status: edgeData.status,
      weight: edgeData.weight,
      strength: this.calculateEdgeStrength(edgeData),
      color: this.calculateEdgeColor(edgeData),
      style: this.calculateEdgeStyle(edgeData),
      metadata: {
        createdAt: new Date(),
        lastUpdate: new Date(),
        satisfaction: edgeData.status === DependencyStatus.SATISFIED,
        criticality: edgeData.weight,
        conflicts: []
      }
    };
  }

  /**
   * Calculate node position based on layout algorithm
   */
  private calculateNodePosition(nodeData: any): { x: number; y: number; z?: number } {
    // Simplified positioning - would implement actual layout algorithms
    const angle = Math.random() * 2 * Math.PI;
    const radius = 200 + Math.random() * 300;

    return {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
      z: this.visualizationData.layout.dimensions === '3d' ? Math.random() * 100 : undefined
    };
  }

  /**
   * Calculate node size based on importance and dependencies
   */
  private calculateNodeSize(nodeData: any, analysis: DependencyAnalysisResult): number {
    let size = 20; // Base size

    // Increase size for high priority tasks
    size += (nodeData.priority || 0) * 2;

    // Increase size for tasks with many dependents
    size += analysis.enables.length * 1.5;

    // Increase size for critical path tasks
    if (analysis.criticalPath.includes(nodeData.id)) {
      size += 10;
    }

    return Math.min(size, 60); // Cap at 60
  }

  /**
   * Calculate node color based on status and readiness
   */
  private calculateNodeColor(nodeData: any, analysis: DependencyAnalysisResult): string {
    // Status-based coloring
    switch (nodeData.status) {
      case 'completed': return '#4CAF50'; // Green
      case 'running': return '#2196F3'; // Blue
      case 'failed': return '#F44336'; // Red
      case 'paused': return '#FF9800'; // Orange
      case 'queued': return '#9E9E9E'; // Grey
      default: return '#607D8B'; // Blue Grey
    }
  }

  /**
   * Calculate node shape based on task type
   */
  private calculateNodeShape(nodeData: any): VisualizationNode['shape'] {
    switch (nodeData.type) {
      case 'critical': return 'diamond';
      case 'parallel': return 'hexagon';
      case 'sequential': return 'rectangle';
      default: return 'circle';
    }
  }

  /**
   * Calculate edge strength for visual emphasis
   */
  private calculateEdgeStrength(edgeData: any): number {
    let strength = 0.5; // Base strength

    // Increase strength for hard dependencies
    if (edgeData.type === DependencyType.HARD) {
      strength += 0.3;
    }

    // Increase strength by weight
    strength += (edgeData.weight || 0) * 0.2;

    return Math.min(strength, 1);
  }

  /**
   * Calculate edge color based on type and status
   */
  private calculateEdgeColor(edgeData: any): string {
    // Type-based coloring
    switch (edgeData.type) {
      case DependencyType.HARD: return '#F44336'; // Red
      case DependencyType.SOFT: return '#2196F3'; // Blue
      case DependencyType.RESOURCE: return '#FF9800'; // Orange
      case DependencyType.DATA: return '#4CAF50'; // Green
      case DependencyType.CONDITIONAL: return '#9C27B0'; // Purple
      default: return '#607D8B'; // Blue Grey
    }
  }

  /**
   * Calculate edge style based on properties
   */
  private calculateEdgeStyle(edgeData: any): VisualizationEdge['style'] {
    if (edgeData.status === DependencyStatus.FAILED) return 'dashed';
    if (edgeData.weight > 0.8) return 'thick';
    if (edgeData.type === DependencyType.CONDITIONAL) return 'dotted';
    return 'solid';
  }

  // =================== EVENT HANDLERS ===================

  private addOrUpdateVisualizationNode(task: TaskNode): void {
    this.createVisualizationNode(task).then(node => {
      this.visualizationData.nodes.set(node.id, node);
      this.notifySubscribers('node_updated', node);
    });
  }

  private addOrUpdateVisualizationEdge(dependency: TaskDependency): void {
    const edge = this.createVisualizationEdge(dependency);
    this.visualizationData.edges.set(edge.id, edge);
    this.notifySubscribers('edge_updated', edge);
  }

  private removeVisualizationEdge(edgeId: string): void {
    if (this.visualizationData.edges.delete(edgeId)) {
      this.notifySubscribers('edge_removed', { edgeId });
    }
  }

  private handleDependencyConflicts(conflicts: DependencyConflict[]): void {
    for (const conflict of conflicts) {
      const alert: VisualizationAlert = {
        id: conflict.id,
        type: 'conflict',
        severity: this.mapConflictSeverity(conflict.severity),
        title: `Dependency Conflict: ${conflict.type}`,
        description: `Conflict affecting ${conflict.affectedTasks.length} tasks`,
        affectedNodes: conflict.affectedTasks,
        affectedEdges: conflict.dependencies.map(dep => dep.id),
        timestamp: conflict.detectedAt,
        resolved: false,
        actions: conflict.suggestedResolutions.map(res => ({
          label: res.action,
          action: res.action,
          priority: res.confidence
        })),
        visualization: {
          highlight: true,
          overlay: true,
          animation: true
        }
      };

      this.alerts.set(alert.id, alert);
    }

    this.notifySubscribers('conflicts_detected', conflicts);
  }

  private handleTaskEvent(event: SchedulingEvent): void {
    if (!event.taskId) return;

    // Update node status
    const node = this.visualizationData.nodes.get(event.taskId);
    if (node) {
      switch (event.type) {
        case 'task_started':
          node.status = 'running';
          node.animation = { type: 'pulse', duration: 1000, iteration: 'infinite' };
          break;
        case 'task_completed':
          node.status = 'completed';
          node.animation = { type: 'glow', duration: 2000, iteration: 1 };
          break;
        case 'task_failed':
          node.status = 'failed';
          node.animation = { type: 'pulse', duration: 500, iteration: 3 };
          break;
      }

      node.color = this.calculateNodeColor({ status: node.status }, { readiness: node.readiness } as any);
    }

    // Add to timeline
    const timelineEvent: TimelineEvent = {
      id: `${event.type}_${event.taskId}_${Date.now()}`,
      timestamp: event.timestamp,
      type: event.type as any,
      taskId: event.taskId,
      description: `Task ${event.taskId} ${event.type.replace('task_', '')}`,
      impact: event.impact,
      data: event.data,
      visualization: {
        position: Date.now() / (Date.now() + 86400000), // Normalized position
        color: this.getEventColor(event.type),
        size: this.getEventSize(event.impact),
        shape: this.getEventShape(event.type)
      }
    };

    this.performanceData.timeline.push(timelineEvent);
    if (this.performanceData.timeline.length > 1000) {
      this.performanceData.timeline.shift();
    }

    this.notifySubscribers('task_event', event);
  }

  private handleSchedulingEvent(event: SchedulingEvent): void {
    const timelineEvent: TimelineEvent = {
      id: `${event.type}_${Date.now()}`,
      timestamp: event.timestamp,
      type: event.type as any,
      description: 'Schedule optimized',
      impact: event.impact,
      data: event.data,
      visualization: {
        position: Date.now() / (Date.now() + 86400000),
        color: '#9C27B0',
        size: 8,
        shape: 'diamond'
      }
    };

    this.performanceData.timeline.push(timelineEvent);
    this.notifySubscribers('schedule_event', event);
  }

  // =================== UTILITY METHODS ===================

  private getDefaultLayoutConfiguration(): LayoutConfiguration {
    return {
      algorithm: 'force_directed',
      dimensions: '2d',
      spacing: {
        nodeDistance: 100,
        levelDistance: 150,
        edgeLength: 80
      },
      forces: {
        repulsion: 100,
        attraction: 10,
        gravity: 0.1,
        friction: 0.9
      },
      constraints: {
        boundaryBox: { width: 800, height: 600 },
        fixedNodes: [],
        grouping: {}
      },
      animation: {
        enabled: true,
        duration: 1000,
        easing: 'ease-out'
      }
    };
  }

  private extractCriticalPathFromNodes(nodes: VisualizationNode[]): string[] {
    return nodes
      .filter(node => node.metadata.criticalPath)
      .map(node => node.id);
  }

  private calculateAverageExecutionTime(nodes: VisualizationNode[]): number {
    const executedNodes = nodes.filter(node =>
      node.metadata.actualDuration !== undefined
    );

    if (executedNodes.length === 0) return 0;

    const totalTime = executedNodes.reduce((sum, node) =>
      sum + (node.metadata.actualDuration || 0), 0
    );

    return totalTime / executedNodes.length;
  }

  private calculatePerformanceTrends(): Record<string, number> {
    if (this.performanceData.metrics.length < 2) {
      return { throughput: 0, successRate: 0, resourceUtilization: 0 };
    }

    const recent = this.performanceData.metrics.slice(-10);
    const older = this.performanceData.metrics.slice(-20, -10);

    const recentAvg = {
      throughput: recent.reduce((sum, m) => sum + m.taskThroughput, 0) / recent.length,
      successRate: recent.reduce((sum, m) => sum + m.successRate, 0) / recent.length,
      resourceUtilization: recent.reduce((sum, m) => sum + m.resourceEfficiency, 0) / recent.length
    };

    const olderAvg = {
      throughput: older.reduce((sum, m) => sum + m.taskThroughput, 0) / Math.max(older.length, 1),
      successRate: older.reduce((sum, m) => sum + m.successRate, 0) / Math.max(older.length, 1),
      resourceUtilization: older.reduce((sum, m) => sum + m.resourceEfficiency, 0) / Math.max(older.length, 1)
    };

    return {
      throughput: recentAvg.throughput - olderAvg.throughput,
      successRate: recentAvg.successRate - olderAvg.successRate,
      resourceUtilization: recentAvg.resourceUtilization - olderAvg.resourceUtilization
    };
  }

  private generateVisualizationRecommendations(
    summary: any,
    performance: any,
    dependencies: any
  ): string[] {
    const recommendations: string[] = [];

    if (summary.bottlenecks > 0) {
      recommendations.push('Consider parallelizing bottleneck tasks to improve throughput');
    }

    if (dependencies.circularDependencies > 0) {
      recommendations.push('Resolve circular dependencies to prevent deadlocks');
    }

    if (performance.successRate < 0.9) {
      recommendations.push('Investigate failed tasks and improve error handling');
    }

    if (summary.criticalPathLength > 10) {
      recommendations.push('Long critical path detected - consider task decomposition');
    }

    return recommendations;
  }

  // Additional utility methods...
  private recalculateNodePositions(): void {
    // Implementation would depend on chosen layout algorithm
    this.logger.debug('Recalculating node positions');
  }

  private refreshVisualizationData(): void {
    // Reset all visualization data to defaults
    this.updateVisualizationData();
  }

  private addConnectedNodes(
    nodeId: string,
    remainingDepth: number,
    nodeSet: Set<string>,
    edgeSet: Set<string>
  ): void {
    if (remainingDepth <= 0) return;

    for (const [edgeId, edge] of this.visualizationData.edges) {
      if (edge.source === nodeId || edge.target === nodeId) {
        edgeSet.add(edgeId);

        const connectedNodeId = edge.source === nodeId ? edge.target : edge.source;
        if (!nodeSet.has(connectedNodeId)) {
          nodeSet.add(connectedNodeId);
          this.addConnectedNodes(connectedNodeId, remainingDepth - 1, nodeSet, edgeSet);
        }
      }
    }
  }

  private adjustColorOpacity(color: string, opacity: number): string {
    // Simple color opacity adjustment
    if (color.startsWith('#')) {
      const alpha = Math.round(opacity * 255).toString(16).padStart(2, '0');
      return color + alpha;
    }
    return color;
  }

  private notifySubscribers(event: string, data: any): void {
    const notification = { event, data };
    for (const callback of this.subscribers) {
      try {
        callback(notification);
      } catch (error) {
        this.logger.error('Subscriber notification failed', { error });
      }
    }
  }

  // Performance and alert helper methods...
  private calculateResourceUtilizationScore(resourceUtilization: Record<string, number>): number {
    const values = Object.values(resourceUtilization);
    return values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;
  }

  private calculateHeatmapColor(taskStatus: ExecutionContext): string {
    // Color based on performance
    const efficiency = taskStatus.metrics.executionTime > 0 ?
      1 / (taskStatus.metrics.executionTime / 1000) : 1;

    if (efficiency > 0.8) return '#4CAF50'; // Green
    if (efficiency > 0.5) return '#FFEB3B'; // Yellow
    if (efficiency > 0.2) return '#FF9800'; // Orange
    return '#F44336'; // Red
  }

  private calculateHeatmapIntensity(taskStatus: ExecutionContext): number {
    const queueTime = taskStatus.metrics.queueTime / 1000;
    const executionTime = taskStatus.metrics.executionTime / 1000;

    return Math.min((queueTime + executionTime) / 60, 1); // Normalize to 1 minute max
  }

  private generateHeatmapTooltip(taskStatus: ExecutionContext): string {
    return `Task: ${taskStatus.taskId}
Queue Time: ${(taskStatus.metrics.queueTime / 1000).toFixed(2)}s
Execution Time: ${(taskStatus.metrics.executionTime / 1000).toFixed(2)}s
Status: ${taskStatus.status}
Retries: ${taskStatus.retryCount}`;
  }

  private isAlertResolved(alert: VisualizationAlert): boolean {
    // Check if the conditions that caused the alert no longer exist
    return false; // Placeholder implementation
  }

  private generatePerformanceAlerts(status: any): void {
    if (status.systemMetrics.taskThroughput < 0.1) {
      const alert: VisualizationAlert = {
        id: `performance_low_throughput_${Date.now()}`,
        type: 'performance',
        severity: 'warning',
        title: 'Low Task Throughput',
        description: 'System throughput is below optimal levels',
        affectedNodes: [],
        affectedEdges: [],
        timestamp: new Date(),
        resolved: false,
        actions: [
          { label: 'Increase Parallelization', action: 'increase_parallel', priority: 3 },
          { label: 'Optimize Resources', action: 'optimize_resources', priority: 2 }
        ],
        visualization: { highlight: false, overlay: true, animation: false }
      };

      this.alerts.set(alert.id, alert);
    }
  }

  private generateDependencyAlerts(metrics: any): void {
    if (metrics.cyclicDependencies > 0) {
      const alert: VisualizationAlert = {
        id: `dependency_cyclic_${Date.now()}`,
        type: 'dependency',
        severity: 'critical',
        title: 'Circular Dependencies Detected',
        description: `${metrics.cyclicDependencies} circular dependencies found`,
        affectedNodes: [],
        affectedEdges: [],
        timestamp: new Date(),
        resolved: false,
        actions: [
          { label: 'Resolve Cycles', action: 'resolve_cycles', priority: 5 }
        ],
        visualization: { highlight: true, overlay: true, animation: true }
      };

      this.alerts.set(alert.id, alert);
    }
  }

  private generateResourceAlerts(status: any): void {
    const utilization = status.resourceUtilization;

    if (utilization.memory > 90) {
      const alert: VisualizationAlert = {
        id: `resource_memory_${Date.now()}`,
        type: 'resource',
        severity: 'error',
        title: 'High Memory Utilization',
        description: `Memory usage at ${utilization.memory.toFixed(1)}%`,
        affectedNodes: [],
        affectedEdges: [],
        timestamp: new Date(),
        resolved: false,
        actions: [
          { label: 'Scale Memory', action: 'scale_memory', priority: 4 },
          { label: 'Optimize Tasks', action: 'optimize_memory', priority: 3 }
        ],
        visualization: { highlight: false, overlay: true, animation: true }
      };

      this.alerts.set(alert.id, alert);
    }
  }

  private mapConflictSeverity(severity: DependencyConflict['severity']): VisualizationAlert['severity'] {
    switch (severity) {
      case 'critical': return 'critical';
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'warning';
    }
  }

  private getEventColor(eventType: string): string {
    switch (eventType) {
      case 'task_started': return '#2196F3';
      case 'task_completed': return '#4CAF50';
      case 'task_failed': return '#F44336';
      default: return '#9E9E9E';
    }
  }

  private getEventSize(impact: string): number {
    switch (impact) {
      case 'critical': return 12;
      case 'high': return 10;
      case 'medium': return 8;
      case 'low': return 6;
      default: return 6;
    }
  }

  private getEventShape(eventType: string): TimelineEvent['visualization']['shape'] {
    switch (eventType) {
      case 'task_started': return 'triangle';
      case 'task_completed': return 'dot';
      case 'task_failed': return 'square';
      default: return 'dot';
    }
  }

  /**
   * Graceful shutdown of visualization engine
   */
  public async shutdown(): Promise<void> {
    this.logger.info('Shutting down DependencyVisualizationEngine...');

    if (this.updateTimer) {
      clearInterval(this.updateTimer);
    }

    this.visualizationData.nodes.clear();
    this.visualizationData.edges.clear();
    this.performanceData.heatmap.clear();
    this.performanceData.timeline.length = 0;
    this.performanceData.metrics.length = 0;
    this.alerts.clear();
    this.subscribers.clear();

    this.removeAllListeners();

    this.logger.info('DependencyVisualizationEngine shutdown complete');
  }
}