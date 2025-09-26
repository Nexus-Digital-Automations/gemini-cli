/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
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
import { EventEmitter } from 'node:events';
import { DependencyAnalyzer, DependencyType, DependencyStatus, ExecutionReadiness } from './DependencyAnalyzer.js';
import { IntelligentTaskScheduler } from './IntelligentTaskScheduler.js';
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
        z?: number;
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
    strength: number;
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
        boundaryBox: {
            width: number;
            height: number;
            depth?: number;
        };
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
    intensity: number;
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
        position: number;
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
export declare class DependencyVisualizationEngine extends EventEmitter {
    private readonly logger;
    private readonly dependencyAnalyzer;
    private readonly taskScheduler;
    private visualizationData;
    private performanceData;
    private alerts;
    private subscribers;
    private updateTimer?;
    private readonly updateInterval;
    constructor(dependencyAnalyzer: DependencyAnalyzer, taskScheduler: IntelligentTaskScheduler);
    /**
     * Get current visualization data for rendering
     */
    getVisualizationData(): {
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
    };
    /**
     * Get performance heatmap data
     */
    getHeatmapData(): HeatmapData[];
    /**
     * Get execution timeline data
     */
    getTimelineData(timeRange?: {
        start: Date;
        end: Date;
    }): TimelineEvent[];
    /**
     * Get current alerts
     */
    getAlerts(severity?: VisualizationAlert['severity']): VisualizationAlert[];
    /**
     * Update layout configuration
     */
    updateLayout(layoutConfig: Partial<LayoutConfiguration>): void;
    /**
     * Highlight specific nodes and edges
     */
    highlightElements(nodeIds: string[], edgeIds?: string[]): void;
    /**
     * Focus on specific task and its dependencies
     */
    focusOnTask(taskId: string, depth?: number): void;
    /**
     * Reset visualization to show all elements normally
     */
    resetVisualization(): void;
    /**
     * Subscribe to real-time updates
     */
    subscribe(callback: (event: string, data: any) => void): () => void;
    /**
     * Generate visualization report
     */
    generateReport(): {
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
    };
    /**
     * Initialize event handlers for real-time updates
     */
    private initializeEventHandlers;
    /**
     * Start real-time updates
     */
    private startRealTimeUpdates;
    /**
     * Update visualization data from current system state
     */
    private updateVisualizationData;
    /**
     * Update performance data and heatmap
     */
    private updatePerformanceData;
    /**
     * Update alerts based on current system state
     */
    private updateAlerts;
    /**
     * Create visualization node from task data
     */
    private createVisualizationNode;
    /**
     * Create visualization edge from dependency data
     */
    private createVisualizationEdge;
    /**
     * Calculate node position based on layout algorithm
     */
    private calculateNodePosition;
    /**
     * Calculate node size based on importance and dependencies
     */
    private calculateNodeSize;
    /**
     * Calculate node color based on status and readiness
     */
    private calculateNodeColor;
    /**
     * Calculate node shape based on task type
     */
    private calculateNodeShape;
    /**
     * Calculate edge strength for visual emphasis
     */
    private calculateEdgeStrength;
    /**
     * Calculate edge color based on type and status
     */
    private calculateEdgeColor;
    /**
     * Calculate edge style based on properties
     */
    private calculateEdgeStyle;
    private addOrUpdateVisualizationNode;
    private addOrUpdateVisualizationEdge;
    private removeVisualizationEdge;
    private handleDependencyConflicts;
    private handleTaskEvent;
    private handleSchedulingEvent;
    private getDefaultLayoutConfiguration;
    private extractCriticalPathFromNodes;
    private calculateAverageExecutionTime;
    private calculatePerformanceTrends;
    private generateVisualizationRecommendations;
    private recalculateNodePositions;
    private refreshVisualizationData;
    private addConnectedNodes;
    private adjustColorOpacity;
    private notifySubscribers;
    private calculateResourceUtilizationScore;
    private calculateHeatmapColor;
    private calculateHeatmapIntensity;
    private generateHeatmapTooltip;
    private isAlertResolved;
    private generatePerformanceAlerts;
    private generateDependencyAlerts;
    private generateResourceAlerts;
    private mapConflictSeverity;
    private getEventColor;
    private getEventSize;
    private getEventShape;
    /**
     * Graceful shutdown of visualization engine
     */
    shutdown(): Promise<void>;
}
