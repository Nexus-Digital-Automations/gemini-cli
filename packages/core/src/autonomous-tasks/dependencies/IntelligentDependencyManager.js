/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { EventEmitter } from 'node:events';
import winston from 'winston';
import { DependencyAnalyzer, DependencyAnalysisConfig } from './DependencyAnalyzer.js';
import { DependencySequencer, SequencingStrategy, SequencingConfig, ExecutionSequence, ParallelExecutionGroup, DependencyConflict, ConflictResolution } from './DependencySequencer.js';
/**
 * Default intelligent dependency configuration
 */
const DEFAULT_INTELLIGENT_CONFIG = {
    analysisConfig: {
        enableImplicitDetection: true,
        maxChainLength: 15,
        weights: {
            explicit: 1.0,
            implicit: 0.8,
            resource: 0.9,
            temporal: 0.7
        }
    },
    sequencingConfig: {
        strategy: SequencingStrategy.CRITICAL_PATH,
        maxParallelGroups: 8,
        enableAutoConflictResolution: true,
        minimumConfidenceThreshold: 0.75
    },
    enableRealtimeMonitoring: true,
    enableAdaptiveLearning: true,
    graphCacheSize: 100,
    optimizationInterval: 300000, // 5 minutes
    enableMetricsCollection: true
};
/**
 * Event types for intelligent dependency manager
 */
export var IntelligentDependencyEvent;
(function (IntelligentDependencyEvent) {
    IntelligentDependencyEvent["ANALYSIS_COMPLETED"] = "analysis_completed";
    IntelligentDependencyEvent["SEQUENCE_OPTIMIZED"] = "sequence_optimized";
    IntelligentDependencyEvent["CONFLICT_AUTO_RESOLVED"] = "conflict_auto_resolved";
    IntelligentDependencyEvent["LEARNING_INSIGHT_GENERATED"] = "learning_insight_generated";
    IntelligentDependencyEvent["PERFORMANCE_OPTIMIZED"] = "performance_optimized";
    IntelligentDependencyEvent["CACHE_OPTIMIZED"] = "cache_optimized";
})(IntelligentDependencyEvent || (IntelligentDependencyEvent = {}));
/**
 * Intelligent dependency management system that combines sophisticated analysis,
 * intelligent sequencing, and adaptive learning for optimal task execution
 */
export class IntelligentDependencyManager extends EventEmitter {
    logger;
    config;
    analyzer;
    sequencer;
    // Caching and performance
    graphCache = new Map();
    sequenceCache = new Map();
    metricsCollector;
    adaptiveLearner;
    // Real-time monitoring
    dependencyUpdates = [];
    optimizationTimer;
    constructor(config = {}) {
        super();
        this.config = { ...DEFAULT_INTELLIGENT_CONFIG, ...config };
        this.logger = winston.createLogger({
            level: 'info',
            format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
            defaultMeta: { component: 'IntelligentDependencyManager' },
            transports: [
                new winston.transports.Console({
                    format: winston.format.combine(winston.format.colorize(), winston.format.simple())
                })
            ]
        });
        // Initialize components
        this.analyzer = new DependencyAnalyzer(this.config.analysisConfig);
        this.sequencer = new DependencySequencer(this.config.sequencingConfig);
        this.metricsCollector = new DependencyMetricsCollector(this.config.enableMetricsCollection);
        this.adaptiveLearner = new AdaptiveLearner(this.config.enableAdaptiveLearning);
        this.setupEventListeners();
        this.startOptimizationProcess();
        this.logger.info('Intelligent dependency manager initialized', {
            analysisEnabled: !!this.config.analysisConfig,
            sequencingStrategy: this.config.sequencingConfig.strategy,
            realtimeMonitoring: this.config.enableRealtimeMonitoring,
            adaptiveLearning: this.config.enableAdaptiveLearning
        });
    }
    /**
     * Analyze task dependencies with intelligent caching and optimization
     */
    async analyzeDependencies(tasks) {
        const startTime = Date.now();
        const logger = this.getLogger();
        const cacheKey = this.generateCacheKey(tasks, 'analysis');
        logger.info(`Analyzing dependencies for ${tasks.length} tasks`, {
            cacheKey: cacheKey.substring(0, 16) + '...'
        });
        // Check cache first
        if (this.graphCache.has(cacheKey)) {
            const cached = this.graphCache.get(cacheKey);
            this.metricsCollector.recordCacheHit('graph');
            logger.info('Using cached dependency graph', { taskCount: tasks.length });
            return cached;
        }
        try {
            // Perform analysis
            const graph = await this.analyzer.analyzeDependencies(tasks);
            const convertedGraph = await this.sequencer.analyzeDependencies(tasks);
            // Apply adaptive learning insights
            const optimizedGraph = await this.applyLearningInsights(convertedGraph, tasks);
            // Cache the result
            this.cacheGraph(cacheKey, optimizedGraph);
            const analysisTime = Date.now() - startTime;
            this.metricsCollector.recordAnalysis(tasks.length, optimizedGraph.edges.length, analysisTime);
            logger.info(`Dependency analysis completed in ${analysisTime}ms`, {
                nodeCount: optimizedGraph.nodes.length,
                edgeCount: optimizedGraph.edges.length,
                levels: optimizedGraph.levels.length
            });
            this.emit(IntelligentDependencyEvent.ANALYSIS_COMPLETED, optimizedGraph, analysisTime);
            return optimizedGraph;
        }
        catch (error) {
            logger.error('Dependency analysis failed', {
                error: error instanceof Error ? error.message : String(error)
            });
            throw error;
        }
    }
    /**
     * Resolve optimal execution order with intelligent sequencing
     */
    async resolveExecutionOrder(tasks) {
        const logger = this.getLogger();
        logger.info(`Resolving execution order for ${tasks.length} tasks`);
        try {
            // Generate optimized execution sequence
            const sequence = await this.generateIntelligentSequence(tasks);
            // Extract ordered tasks from sequence
            const orderedTasks = [];
            const taskMap = new Map(tasks.map(t => [t.id, t]));
            for (const group of sequence.groups) {
                for (const task of group.tasks) {
                    const fullTask = taskMap.get(task.id);
                    if (fullTask) {
                        orderedTasks.push(fullTask);
                    }
                }
            }
            // Learn from this sequencing decision
            if (this.config.enableAdaptiveLearning) {
                await this.adaptiveLearner.learnFromSequence(sequence, tasks);
            }
            logger.info('Execution order resolved successfully', {
                totalTasks: orderedTasks.length,
                sequenceConfidence: sequence.confidence,
                strategy: sequence.strategy
            });
            return orderedTasks;
        }
        catch (error) {
            logger.error('Failed to resolve execution order', {
                error: error instanceof Error ? error.message : String(error)
            });
            throw error;
        }
    }
    /**
     * Detect circular dependencies with enhanced analysis
     */
    async detectCircularDependencies(tasks) {
        return this.sequencer.detectCircularDependencies(tasks);
    }
    /**
     * Validate dependencies with comprehensive checks
     */
    async validateDependencies(tasks) {
        const logger = this.getLogger();
        n;
        n;
        try {
            n;
            const validation = await this.sequencer.validateDependencies(tasks);
            n;
            n;
        }
        finally { }
    }
} // Enhanced validation with learning insights\n      if (this.config.enableAdaptiveLearning) {\n        const insights = await this.adaptiveLearner.validateWithInsights(tasks, validation);\n        validation.warnings.push(...insights.warnings);\n      }\n      \n      logger.info('Dependency validation completed', {\n        isValid: validation.isValid,\n        errors: validation.errors.length,\n        warnings: validation.warnings.length\n      });\n      \n      return validation;\n      \n    } catch (error) {\n      logger.error('Dependency validation failed', {\n        error: error instanceof Error ? error.message : String(error)\n      });\n      throw error;\n    }\n  }\n  \n  /**\n   * Get optimized parallel execution groups\n   */\n  async getParallelExecutionGroups(tasks: ITask[]): Promise<ITask[][]> {\n    const sequence = await this.generateIntelligentSequence(tasks);\n    return sequence.groups.map(group => group.tasks);\n  }\n  \n  /**\n   * Update task dependencies with real-time monitoring\n   */\n  async updateTaskDependencies(\n    taskId: string,\n    dependencies: any[]\n  ): Promise<void> {\n    const logger = this.getLogger();\n    \n    logger.info('Updating task dependencies', {\n      taskId,\n      dependencyCount: dependencies.length\n    });\n    \n    // Clear relevant caches\n    this.invalidateCachesForTask(taskId);\n    \n    // Record update event for real-time monitoring\n    if (this.config.enableRealtimeMonitoring) {\n      this.recordDependencyUpdate({\n        type: 'dependency_changed',\n        taskIds: [taskId],\n        timestamp: new Date(),\n        metadata: { dependencyCount: dependencies.length }\n      });\n    }\n    \n    // Update sequencer\n    await this.sequencer.updateTaskDependencies(taskId, dependencies);\n    \n    logger.info('Task dependencies updated successfully', { taskId });\n  }\n  \n  /**\n   * Generate intelligent execution sequence with all optimizations\n   */\n  async generateIntelligentSequence(tasks: ITask[]): Promise<ExecutionSequence> {\n    const startTime = Date.now();\n    const logger = this.getLogger();\n    const cacheKey = this.generateCacheKey(tasks, 'sequence');\n    \n    // Check sequence cache\n    if (this.sequenceCache.has(cacheKey)) {\n      const cached = this.sequenceCache.get(cacheKey)!;\n      this.metricsCollector.recordCacheHit('sequence');\n      logger.info('Using cached execution sequence', { taskCount: tasks.length });\n      return cached;\n    }\n    \n    try {\n      // Generate base sequence\n      const sequence = await this.sequencer.generateExecutionSequence(tasks);\n      \n      // Apply intelligent optimizations\n      const optimizedSequence = await this.applyIntelligentOptimizations(sequence, tasks);\n      \n      // Cache the result\n      this.cacheSequence(cacheKey, optimizedSequence);\n      \n      const sequencingTime = Date.now() - startTime;\n      this.metricsCollector.recordSequencing(tasks.length, optimizedSequence.confidence, sequencingTime);\n      \n      logger.info(`Intelligent sequence generated in ${sequencingTime}ms`, {\n        groupCount: optimizedSequence.groups.length,\n        confidence: optimizedSequence.confidence,\n        strategy: optimizedSequence.strategy\n      });\n      \n      this.emit(IntelligentDependencyEvent.SEQUENCE_OPTIMIZED, optimizedSequence, sequencingTime);\n      \n      return optimizedSequence;\n      \n    } catch (error) {\n      logger.error('Failed to generate intelligent sequence', {\n        error: error instanceof Error ? error.message : String(error)\n      });\n      throw error;\n    }\n  }\n  \n  /**\n   * Get comprehensive dependency management metrics\n   */\n  getMetrics(): DependencyMetrics {\n    return this.metricsCollector.getMetrics();\n  }\n  \n  /**\n   * Get adaptive learning insights\n   */\n  async getLearningInsights(): Promise<AdaptiveLearningInsight[]> {\n    if (!this.config.enableAdaptiveLearning) {\n      return [];\n    }\n    \n    return this.adaptiveLearner.getInsights();\n  }\n  \n  /**\n   * Force optimization of internal systems\n   */\n  async optimize(): Promise<void> {\n    const logger = this.getLogger();\n    \n    logger.info('Starting intelligent dependency system optimization');\n    \n    try {\n      // Optimize caches\n      this.optimizeCaches();\n      \n      // Generate learning insights\n      if (this.config.enableAdaptiveLearning) {\n        await this.adaptiveLearner.generateInsights();\n      }\n      \n      // Update metrics\n      this.metricsCollector.optimize();\n      \n      logger.info('Intelligent dependency system optimization completed');\n      this.emit(IntelligentDependencyEvent.PERFORMANCE_OPTIMIZED);\n      \n    } catch (error) {\n      logger.error('Optimization failed', {\n        error: error instanceof Error ? error.message : String(error)\n      });\n    }\n  }\n  \n  /**\n   * Dispose of resources and cleanup\n   */\n  dispose(): void {\n    if (this.optimizationTimer) {\n      clearInterval(this.optimizationTimer);\n    }\n    \n    this.graphCache.clear();\n    this.sequenceCache.clear();\n    this.dependencyUpdates.length = 0;\n    \n    this.removeAllListeners();\n    \n    this.logger.info('Intelligent dependency manager disposed');\n  }\n  \n  // Private methods\n  \n  private setupEventListeners(): void {\n    // Listen to sequencer events for learning\n    this.sequencer.on('sequence_generated', (sequence, time) => {\n      if (this.config.enableAdaptiveLearning) {\n        this.adaptiveLearner.observeSequenceGeneration(sequence, time);\n      }\n    });\n    \n    this.sequencer.on('conflict_resolved', (resolution) => {\n      this.metricsCollector.recordConflictResolution(resolution);\n      this.emit(IntelligentDependencyEvent.CONFLICT_AUTO_RESOLVED, resolution);\n    });\n  }\n  \n  private startOptimizationProcess(): void {\n    if (this.config.optimizationInterval > 0) {\n      this.optimizationTimer = setInterval(() => {\n        this.optimize();\n      }, this.config.optimizationInterval);\n    }\n  }\n  \n  private async applyLearningInsights(graph: DependencyGraph, tasks: ITask[]): Promise<DependencyGraph> {\n    if (!this.config.enableAdaptiveLearning) {\n      return graph;\n    }\n    \n    const insights = await this.adaptiveLearner.getGraphOptimizations(graph, tasks);\n    \n    // Apply insights to graph (simplified implementation)\n    for (const insight of insights) {\n      if (insight.confidence > 0.8) {\n        // Apply high-confidence optimizations\n        this.logger.info('Applying learning insight', {\n          category: insight.category,\n          description: insight.description,\n          confidence: insight.confidence\n        });\n      }\n    }\n    \n    return graph;\n  }\n  \n  private async applyIntelligentOptimizations(\n    sequence: ExecutionSequence,\n    tasks: ITask[]\n  ): Promise<ExecutionSequence> {\n    let optimized = { ...sequence };\n    \n    // Apply adaptive learning optimizations\n    if (this.config.enableAdaptiveLearning) {\n      const learningOptimizations = await this.adaptiveLearner.getSequenceOptimizations(sequence, tasks);\n      optimized = this.applyLearningOptimizations(optimized, learningOptimizations);\n    }\n    \n    // Apply real-time optimizations based on recent updates\n    if (this.config.enableRealtimeMonitoring) {\n      optimized = this.applyRealtimeOptimizations(optimized);\n    }\n    \n    return optimized;\n  }\n  \n  private applyLearningOptimizations(\n    sequence: ExecutionSequence,\n    insights: AdaptiveLearningInsight[]\n  ): ExecutionSequence {\n    let optimized = { ...sequence };\n    \n    for (const insight of insights) {\n      if (insight.confidence > 0.75) {\n        switch (insight.category) {\n          case 'performance':\n            // Apply performance optimizations\n            break;\n          case 'efficiency':\n            // Apply efficiency optimizations\n            break;\n        }\n      }\n    }\n    \n    return optimized;\n  }\n  \n  private applyRealtimeOptimizations(sequence: ExecutionSequence): ExecutionSequence {\n    // Apply optimizations based on recent dependency updates\n    const recentUpdates = this.dependencyUpdates.slice(-100); // Last 100 updates\n    \n    // Simplified optimization based on update patterns\n    if (recentUpdates.length > 10) {\n      // If many recent updates, increase parallel safety margins\n      const optimized = { ...sequence };\n      optimized.groups = optimized.groups.map(group => ({\n        ...group,\n        parallelSafetyConfidence: Math.max(0.6, group.parallelSafetyConfidence - 0.1)\n      }));\n      return optimized;\n    }\n    \n    return sequence;\n  }\n  \n  private generateCacheKey(tasks: ITask[], type: 'analysis' | 'sequence'): string {\n    const taskSignature = tasks\n      .map(t => `${t.id}:${t.priority}:${t.dependencies?.length || 0}:${t.updatedAt.getTime()}`)\n      .sort()\n      .join('|');\n    \n    const configSignature = type === 'analysis' ?\n      JSON.stringify(this.config.analysisConfig) :\n      JSON.stringify(this.config.sequencingConfig);\n    \n    return `${type}:${Buffer.from(taskSignature + configSignature).toString('base64')}`;\n  }\n  \n  private cacheGraph(key: string, graph: DependencyGraph): void {\n    this.graphCache.set(key, graph);\n    \n    // Implement LRU eviction\n    if (this.graphCache.size > this.config.graphCacheSize) {\n      const firstKey = this.graphCache.keys().next().value;\n      this.graphCache.delete(firstKey);\n    }\n  }\n  \n  private cacheSequence(key: string, sequence: ExecutionSequence): void {\n    this.sequenceCache.set(key, sequence);\n    \n    // Implement LRU eviction\n    if (this.sequenceCache.size > this.config.graphCacheSize) {\n      const firstKey = this.sequenceCache.keys().next().value;\n      this.sequenceCache.delete(firstKey);\n    }\n  }\n  \n  private invalidateCachesForTask(taskId: string): void {\n    // Remove cache entries that might be affected by the task update\n    for (const [key, graph] of this.graphCache.entries()) {\n      if (graph.nodes.some(n => n.taskId === taskId)) {\n        this.graphCache.delete(key);\n      }\n    }\n    \n    for (const [key, sequence] of this.sequenceCache.entries()) {\n      if (sequence.groups.some(g => g.tasks.some(t => t.id === taskId))) {\n        this.sequenceCache.delete(key);\n      }\n    }\n  }\n  \n  private optimizeCaches(): void {\n    const beforeGraphSize = this.graphCache.size;\n    const beforeSequenceSize = this.sequenceCache.size;\n    \n    // Remove stale cache entries (older than 1 hour)\n    const cutoff = Date.now() - 3600000;\n    \n    // Simplified cache optimization - in production, implement proper LRU/TTL\n    if (this.graphCache.size > this.config.graphCacheSize * 0.8) {\n      const toDelete = this.graphCache.size - Math.floor(this.config.graphCacheSize * 0.6);\n      const keys = Array.from(this.graphCache.keys()).slice(0, toDelete);\n      keys.forEach(key => this.graphCache.delete(key));\n    }\n    \n    if (this.sequenceCache.size > this.config.graphCacheSize * 0.8) {\n      const toDelete = this.sequenceCache.size - Math.floor(this.config.graphCacheSize * 0.6);\n      const keys = Array.from(this.sequenceCache.keys()).slice(0, toDelete);\n      keys.forEach(key => this.sequenceCache.delete(key));\n    }\n    \n    const afterGraphSize = this.graphCache.size;\n    const afterSequenceSize = this.sequenceCache.size;\n    \n    this.logger.info('Cache optimization completed', {\n      graphCache: { before: beforeGraphSize, after: afterGraphSize },\n      sequenceCache: { before: beforeSequenceSize, after: afterSequenceSize }\n    });\n    \n    this.emit(IntelligentDependencyEvent.CACHE_OPTIMIZED, {\n      graphCache: { before: beforeGraphSize, after: afterGraphSize },\n      sequenceCache: { before: beforeSequenceSize, after: afterSequenceSize }\n    });\n  }\n  \n  private recordDependencyUpdate(update: DependencyUpdateEvent): void {\n    this.dependencyUpdates.push(update);\n    \n    // Keep only recent updates (last 1000)\n    if (this.dependencyUpdates.length > 1000) {\n      this.dependencyUpdates = this.dependencyUpdates.slice(-500);\n    }\n  }\n  \n  private getLogger() {\n    return this.logger;\n  }\n}\n\n/**\n * Dependency metrics collector\n */\nclass DependencyMetricsCollector {\n  private metrics: DependencyMetrics;\n  private enabled: boolean;\n  private cacheHits = 0;\n  private cacheRequests = 0;\n  \n  constructor(enabled: boolean) {\n    this.enabled = enabled;\n    this.metrics = {\n      totalTasksAnalyzed: 0,\n      totalDependenciesDetected: 0,\n      averageAnalysisTime: 0,\n      averageSequencingTime: 0,\n      conflictsDetected: 0,\n      conflictsResolved: 0,\n      averageSequenceConfidence: 0,\n      cacheHitRate: 0,\n      optimizationSuccessRate: 0\n    };\n  }\n  \n  recordAnalysis(taskCount: number, dependencyCount: number, time: number): void {\n    if (!this.enabled) return;\n    \n    this.metrics.totalTasksAnalyzed += taskCount;\n    this.metrics.totalDependenciesDetected += dependencyCount;\n    this.metrics.averageAnalysisTime = \n      (this.metrics.averageAnalysisTime + time) / 2;\n  }\n  \n  recordSequencing(taskCount: number, confidence: number, time: number): void {\n    if (!this.enabled) return;\n    \n    this.metrics.averageSequencingTime = \n      (this.metrics.averageSequencingTime + time) / 2;\n    this.metrics.averageSequenceConfidence = \n      (this.metrics.averageSequenceConfidence + confidence) / 2;\n  }\n  \n  recordConflictResolution(resolution: ConflictResolution): void {\n    if (!this.enabled) return;\n    \n    this.metrics.conflictsDetected += resolution.resolvedConflicts.length + resolution.unresolvedConflicts.length;\n    this.metrics.conflictsResolved += resolution.resolvedConflicts.length;\n  }\n  \n  recordCacheHit(type: 'graph' | 'sequence'): void {\n    this.cacheHits++;\n    this.cacheRequests++;\n    this.updateCacheHitRate();\n  }\n  \n  recordCacheMiss(type: 'graph' | 'sequence'): void {\n    this.cacheRequests++;\n    this.updateCacheHitRate();\n  }\n  \n  private updateCacheHitRate(): void {\n    this.metrics.cacheHitRate = this.cacheRequests > 0 ? \n      (this.cacheHits / this.cacheRequests) * 100 : 0;\n  }\n  \n  getMetrics(): DependencyMetrics {\n    return { ...this.metrics };\n  }\n  \n  optimize(): void {\n    // Reset rolling averages periodically\n    // Implementation would maintain rolling windows\n  }\n}\n\n/**\n * Adaptive learning system for dependency patterns\n */\nclass AdaptiveLearner {\n  private enabled: boolean;\n  private insights: AdaptiveLearningInsight[] = [];\n  private sequenceHistory: Array<{ sequence: ExecutionSequence; tasks: ITask[]; timestamp: Date }> = [];\n  \n  constructor(enabled: boolean) {\n    this.enabled = enabled;\n  }\n  \n  async learnFromSequence(sequence: ExecutionSequence, tasks: ITask[]): Promise<void> {\n    if (!this.enabled) return;\n    \n    this.sequenceHistory.push({\n      sequence,\n      tasks,\n      timestamp: new Date()\n    });\n    \n    // Keep only recent history (last 100 sequences)\n    if (this.sequenceHistory.length > 100) {\n      this.sequenceHistory = this.sequenceHistory.slice(-50);\n    }\n  }\n  \n  observeSequenceGeneration(sequence: ExecutionSequence, time: number): void {\n    if (!this.enabled) return;\n    \n    // Learn from sequence generation patterns\n    // Implementation would analyze patterns and generate insights\n  }\n  \n  async validateWithInsights(tasks: ITask[], validation: DependencyValidation): Promise<{ warnings: any[] }> {\n    if (!this.enabled) {\n      return { warnings: [] };\n    }\n    \n    // Enhance validation with learned patterns\n    return { warnings: [] };\n  }\n  \n  async getGraphOptimizations(graph: DependencyGraph, tasks: ITask[]): Promise<AdaptiveLearningInsight[]> {\n    if (!this.enabled) return [];\n    \n    return this.insights.filter(insight => \n      insight.category === 'performance' || insight.category === 'efficiency'\n    );\n  }\n  \n  async getSequenceOptimizations(sequence: ExecutionSequence, tasks: ITask[]): Promise<AdaptiveLearningInsight[]> {\n    if (!this.enabled) return [];\n    \n    return this.insights.filter(insight => \n      insight.category === 'patterns' || insight.category === 'accuracy'\n    );\n  }\n  \n  async generateInsights(): Promise<void> {\n    if (!this.enabled) return;\n    \n    // Analyze historical data and generate new insights\n    // Implementation would use ML/statistical analysis\n  }\n  \n  getInsights(): AdaptiveLearningInsight[] {\n    return [...this.insights];\n  }\n}
//# sourceMappingURL=IntelligentDependencyManager.js.map