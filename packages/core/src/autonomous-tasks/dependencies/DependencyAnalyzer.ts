import { Task, TaskType, TaskPriority } from '../types/TaskTypes';

/**
 * Dependency analysis configuration
 */
export interface DependencyAnalysisConfig {
  /** Enable implicit dependency detection */
  enableImplicitDetection: boolean;
  /** Maximum dependency chain length */
  maxChainLength: number;
  /** Weight factors for different dependency types */
  weights: {
    explicit: number;
    implicit: number;
    resource: number;
    temporal: number;
  };
  /** Analysis sensitivity levels */
  sensitivity: {
    keyword: number;
    semantic: number;
    structural: number;
  };
}

/**
 * Detected dependency information
 */
export interface DetectedDependency {
  /** Source task ID */
  from: string;
  /** Target task ID */
  to: string;
  /** Type of dependency */
  type: 'explicit' | 'implicit' | 'resource' | 'temporal' | 'priority';
  /** Confidence score (0-1) */
  confidence: number;
  /** Reason for the dependency */
  reason: string;
  /** Whether this dependency is blocking */
  blocking: boolean;
  /** Estimated delay if dependency not met (in hours) */
  estimatedDelay: number;
}

/**
 * Dependency analysis results
 */
export interface DependencyAnalysisResult {
  /** All detected dependencies */
  dependencies: DetectedDependency[];
  /** Tasks with no dependencies */
  independentTasks: string[];
  /** Tasks that are dependencies for others */
  criticalTasks: string[];
  /** Potential circular dependencies */
  potentialCircular: string[][];
  /** Analysis metadata */
  metadata: {
    analysisTime: number;
    totalTasks: number;
    totalDependencies: number;
    confidence: number;
  };
}

/**
 * Intelligent task dependency analyzer
 * Detects both explicit and implicit dependencies between tasks
 */
export class DependencyAnalyzer {
  private config: DependencyAnalysisConfig;
  private keywordPatterns: Map<string, string[]>;
  private resourcePatterns: Map<string, string[]>;

  constructor(config: Partial<DependencyAnalysisConfig> = {}) {
    this.config = {
      enableImplicitDetection: true,
      maxChainLength: 10,
      weights: {
        explicit: 1.0,
        implicit: 0.7,
        resource: 0.8,
        temporal: 0.6,
      },
      sensitivity: {
        keyword: 0.8,
        semantic: 0.7,
        structural: 0.6,
      },
      ...config,
    };

    this.initializePatterns();
  }

  /**
   * Analyze tasks for dependencies
   */
  async analyzeDependencies(tasks: Task[]): Promise<DependencyAnalysisResult> {
    const startTime = Date.now();
    const logger = this.getLogger();

    logger.info(`Starting dependency analysis for ${tasks.length} tasks`, {
      taskIds: tasks.map(t =&gt; t.id),
      config: this.config
    });

    const dependencies: DetectedDependency[] = [];

    // Analyze explicit dependencies
    const explicitDeps = this.analyzeExplicitDependencies(tasks);
    dependencies.push(...explicitDeps);

    // Analyze implicit dependencies if enabled
    if (this.config.enableImplicitDetection) {
      const implicitDeps = await this.analyzeImplicitDependencies(tasks);
      dependencies.push(...implicitDeps);
    }

    // Analyze resource dependencies
    const resourceDeps = this.analyzeResourceDependencies(tasks);
    dependencies.push(...resourceDeps);

    // Analyze temporal dependencies
    const temporalDeps = this.analyzeTemporalDependencies(tasks);
    dependencies.push(...temporalDeps);

    // Analyze priority-based dependencies
    const priorityDeps = this.analyzePriorityDependencies(tasks);
    dependencies.push(...priorityDeps);

    // Remove duplicates and validate
    const uniqueDependencies = this.deduplicateDependencies(dependencies);
    const validatedDependencies = this.validateDependencies(uniqueDependencies, tasks);

    // Identify independent and critical tasks
    const taskIds = new Set(tasks.map(t =&gt; t.id));
    const dependentTaskIds = new Set(validatedDependencies.map(d =&gt; d.to));
    const dependencyTaskIds = new Set(validatedDependencies.map(d =&gt; d.from));

    const independentTasks = Array.from(taskIds).filter(id =&gt; !dependentTaskIds.has(id));
    const criticalTasks = Array.from(dependencyTaskIds).filter(id =&gt;
      validatedDependencies.filter(d =&gt; d.from === id).length &gt; 1
    );

    // Detect potential circular dependencies
    const potentialCircular = this.detectPotentialCircularDependencies(validatedDependencies);

    const analysisTime = Date.now() - startTime;
    const avgConfidence = validatedDependencies.length &gt; 0 ?
      validatedDependencies.reduce((sum, d) =&gt; sum + d.confidence, 0) / validatedDependencies.length : 1;

    const result: DependencyAnalysisResult = {
      dependencies: validatedDependencies,
      independentTasks,
      criticalTasks,
      potentialCircular,
      metadata: {
        analysisTime,
        totalTasks: tasks.length,
        totalDependencies: validatedDependencies.length,
        confidence: avgConfidence,
      },
    };

    logger.info(`Dependency analysis completed in ${analysisTime}ms`, {
      totalDependencies: validatedDependencies.length,
      independentTasks: independentTasks.length,
      criticalTasks: criticalTasks.length,
      potentialCircular: potentialCircular.length,
      confidence: avgConfidence
    });

    return result;
  }

  /**
   * Analyze explicit dependencies from task definitions
   */
  private analyzeExplicitDependencies(tasks: Task[]): DetectedDependency[] {
    const logger = this.getLogger();
    const dependencies: DetectedDependency[] = [];
    const taskMap = new Map(tasks.map(t =&gt; [t.id, t]));

    for (const task of tasks) {
      if (task.dependencies && task.dependencies.length &gt; 0) {
        for (const depId of task.dependencies) {
          const depTask = taskMap.get(depId);
          if (depTask) {
            dependencies.push({
              from: depId,
              to: task.id,
              type: 'explicit',
              confidence: this.config.weights.explicit,
              reason: 'Explicit dependency declared in task definition',
              blocking: true,
              estimatedDelay: this.estimateDelay(depTask, task),
            });

            logger.debug(`Explicit dependency detected: ${depId} → ${task.id}`, {
              fromTask: depTask.title,
              toTask: task.title,
              reason: 'declared dependency'
            });
          }
        }
      }
    }

    return dependencies;
  }

  /**
   * Analyze implicit dependencies using semantic analysis
   */
  private async analyzeImplicitDependencies(tasks: Task[]): Promise&lt;DetectedDependency[]&gt; {
    const logger = this.getLogger();
    const dependencies: DetectedDependency[] = [];

    for (let i = 0; i &lt; tasks.length; i++) {
      for (let j = i + 1; j &lt; tasks.length; j++) {
        const taskA = tasks[i];
        const taskB = tasks[j];

        // Analyze A → B dependency
        const depAB = await this.analyzeImplicitDependency(taskA, taskB);
        if (depAB && depAB.confidence &gt;= this.config.sensitivity.semantic) {
          dependencies.push(depAB);
          logger.debug(`Implicit dependency detected: ${taskA.id} → ${taskB.id}`, {
            confidence: depAB.confidence,
            reason: depAB.reason
          });
        }

        // Analyze B → A dependency
        const depBA = await this.analyzeImplicitDependency(taskB, taskA);
        if (depBA && depBA.confidence &gt;= this.config.sensitivity.semantic) {
          dependencies.push(depBA);
          logger.debug(`Implicit dependency detected: ${taskB.id} → ${taskA.id}`, {
            confidence: depBA.confidence,
            reason: depBA.reason
          });
        }
      }
    }

    return dependencies;
  }

  /**
   * Analyze implicit dependency between two tasks
   */
  private async analyzeImplicitDependency(
    from: Task,
    to: Task
  ): Promise&lt;DetectedDependency | null&gt; {
    const reasons: string[] = [];
    let confidence = 0;

    // Keyword-based analysis
    const keywordScore = this.analyzeKeywordDependency(from, to);
    if (keywordScore &gt; 0) {
      confidence += keywordScore * this.config.weights.implicit;
      reasons.push(`Keyword analysis (score: ${keywordScore.toFixed(2)})`);
    }

    // Structural analysis
    const structuralScore = this.analyzeStructuralDependency(from, to);
    if (structuralScore &gt; 0) {
      confidence += structuralScore * this.config.weights.implicit;
      reasons.push(`Structural analysis (score: ${structuralScore.toFixed(2)})`);
    }

    // Feature relationship analysis
    const featureScore = this.analyzeFeatureRelationship(from, to);
    if (featureScore &gt; 0) {
      confidence += featureScore * this.config.weights.implicit;
      reasons.push(`Feature relationship (score: ${featureScore.toFixed(2)})`);
    }

    if (confidence &gt; 0) {
      return {
        from: from.id,
        to: to.id,
        type: 'implicit',
        confidence: Math.min(confidence, 1.0),
        reason: `Implicit dependency: ${reasons.join(', ')}`,
        blocking: confidence &gt; 0.8,
        estimatedDelay: this.estimateDelay(from, to) * confidence,
      };
    }

    return null;
  }

  /**
   * Analyze keyword-based dependencies
   */
  private analyzeKeywordDependency(from: Task, to: Task): number {
    let score = 0;
    const fromText = `${from.title} ${from.description}`.toLowerCase();
    const toText = `${to.title} ${to.description}`.toLowerCase();

    // Check for direct references
    if (toText.includes(from.title.toLowerCase()) ||
        toText.includes(from.id.toLowerCase())) {
      score += 0.8;
    }

    // Check for keyword patterns
    for (const [category, keywords] of this.keywordPatterns) {
      const fromHasKeywords = keywords.some(keyword =&gt; fromText.includes(keyword));
      const toHasKeywords = keywords.some(keyword =&gt; toText.includes(keyword));

      if (fromHasKeywords && toHasKeywords) {
        score += 0.3;
      }
    }

    // Check for sequential keywords
    const sequentialKeywords = [
      'setup', 'initialize', 'prepare', 'configure',
      'implement', 'develop', 'build', 'create',
      'test', 'validate', 'verify', 'check',
      'deploy', 'release', 'publish', 'finalize'
    ];

    const fromIndex = this.getSequentialIndex(fromText, sequentialKeywords);
    const toIndex = this.getSequentialIndex(toText, sequentialKeywords);

    if (fromIndex !== -1 && toIndex !== -1 && fromIndex &lt; toIndex) {
      score += 0.4;
    }

    return Math.min(score, 1.0);
  }

  /**
   * Analyze structural dependencies based on task properties
   */
  private analyzeStructuralDependency(from: Task, to: Task): number {
    let score = 0;

    // Type-based dependencies
    const typeOrder = ['analysis', 'implementation', 'testing', 'documentation', 'deployment'];
    const fromTypeIndex = typeOrder.indexOf(from.type);
    const toTypeIndex = typeOrder.indexOf(to.type);

    if (fromTypeIndex !== -1 && toTypeIndex !== -1 && fromTypeIndex &lt; toTypeIndex) {
      score += 0.5;
    }

    // Priority-based dependencies
    const priorityOrder = ['low', 'normal', 'high', 'critical'];
    const fromPriorityIndex = priorityOrder.indexOf(from.priority);
    const toPriorityIndex = priorityOrder.indexOf(to.priority);

    if (fromPriorityIndex !== -1 && toPriorityIndex !== -1 && fromPriorityIndex &gt; toPriorityIndex) {
      score += 0.3;
    }

    // Effort-based dependencies (larger tasks may need to complete first)
    if (from.estimated_effort && to.estimated_effort &&
        from.estimated_effort &gt; to.estimated_effort * 2) {
      score += 0.2;
    }

    return Math.min(score, 1.0);
  }

  /**
   * Analyze feature relationship dependencies
   */
  private analyzeFeatureRelationship(from: Task, to: Task): number {
    let score = 0;

    // Same feature relationship
    if (from.feature_id === to.feature_id) {
      score += 0.6;
    }

    // Parent-child feature relationship
    if (from.metadata?.parentFeatureId === to.feature_id ||
        to.metadata?.parentFeatureId === from.feature_id) {
      score += 0.7;
    }

    // Supporting task relationship
    if (from.metadata?.main_task_id === to.id ||
        to.metadata?.main_task_id === from.id) {
      score += 0.9;
    }

    return Math.min(score, 1.0);
  }

  /**
   * Analyze resource-based dependencies
   */
  private analyzeResourceDependencies(tasks: Task[]): DetectedDependency[] {
    const dependencies: DetectedDependency[] = [];
    const logger = this.getLogger();

    // Group tasks by required capabilities
    const capabilityGroups = new Map&lt;string, Task[]&gt;();

    for (const task of tasks) {
      if (task.required_capabilities) {
        for (const capability of task.required_capabilities) {
          if (!capabilityGroups.has(capability)) {
            capabilityGroups.set(capability, []);
          }
          capabilityGroups.get(capability)!.push(task);
        }
      }
    }

    // Analyze resource contention
    for (const [capability, capabilityTasks] of capabilityGroups) {
      if (capabilityTasks.length &gt; 1) {
        // Sort by priority and create sequential dependencies
        const sortedTasks = capabilityTasks.sort((a, b) =&gt; {
          const priorityOrder = ['critical', 'high', 'normal', 'low'];
          const aPriority = priorityOrder.indexOf(a.priority);
          const bPriority = priorityOrder.indexOf(b.priority);
          return aPriority - bPriority;
        });

        for (let i = 0; i &lt; sortedTasks.length - 1; i++) {
          const fromTask = sortedTasks[i];
          const toTask = sortedTasks[i + 1];

          dependencies.push({
            from: fromTask.id,
            to: toTask.id,
            type: 'resource',
            confidence: this.config.weights.resource,
            reason: `Resource contention for capability: ${capability}`,
            blocking: true,
            estimatedDelay: this.estimateDelay(fromTask, toTask),
          });

          logger.debug(`Resource dependency detected: ${fromTask.id} → ${toTask.id}`, {
            capability,
            reason: 'resource contention'
          });
        }
      }
    }

    return dependencies;
  }

  /**
   * Analyze temporal dependencies based on deadlines and timing
   */
  private analyzeTemporalDependencies(tasks: Task[]): DetectedDependency[] {
    const dependencies: DetectedDependency[] = [];
    const logger = this.getLogger();

    const tasksWithDeadlines = tasks.filter(t =&gt; t.metadata?.deadline);

    if (tasksWithDeadlines.length &lt; 2) {
      return dependencies;
    }

    // Sort by deadline
    tasksWithDeadlines.sort((a, b) =&gt; {
      const aDeadline = new Date(a.metadata!.deadline).getTime();
      const bDeadline = new Date(b.metadata!.deadline).getTime();
      return aDeadline - bDeadline;
    });

    // Create temporal dependencies for overlapping deadlines
    for (let i = 0; i &lt; tasksWithDeadlines.length - 1; i++) {
      const earlierTask = tasksWithDeadlines[i];
      const laterTask = tasksWithDeadlines[i + 1];

      const earlierDeadline = new Date(earlierTask.metadata!.deadline).getTime();
      const laterDeadline = new Date(laterTask.metadata!.deadline).getTime();
      const timeDiff = laterDeadline - earlierDeadline;

      // If deadlines are close (within 24 hours), create dependency
      if (timeDiff &lt; 24 * 60 * 60 * 1000) {
        dependencies.push({
          from: earlierTask.id,
          to: laterTask.id,
          type: 'temporal',
          confidence: this.config.weights.temporal,
          reason: `Temporal dependency due to close deadlines (${Math.round(timeDiff / (60 * 60 * 1000))} hours apart)`,
          blocking: false,
          estimatedDelay: timeDiff / (60 * 60 * 1000),
        });

        logger.debug(`Temporal dependency detected: ${earlierTask.id} → ${laterTask.id}`, {
          timeDiff: `${Math.round(timeDiff / (60 * 60 * 1000))} hours`,
          reason: 'close deadlines'
        });
      }
    }

    return dependencies;
  }

  /**
   * Analyze priority-based dependencies
   */
  private analyzePriorityDependencies(tasks: Task[]): DetectedDependency[] {
    const dependencies: DetectedDependency[] = [];
    const logger = this.getLogger();

    const priorityOrder = { 'critical': 4, 'high': 3, 'normal': 2, 'low': 1 };

    // Sort tasks by priority
    const sortedTasks = tasks.sort((a, b) =&gt;
      (priorityOrder[b.priority as keyof typeof priorityOrder] || 0) -
      (priorityOrder[a.priority as keyof typeof priorityOrder] || 0)
    );

    // Create priority-based dependencies for tasks with significant priority differences
    for (let i = 0; i &lt; sortedTasks.length; i++) {
      for (let j = i + 1; j &lt; sortedTasks.length; j++) {
        const higherPriorityTask = sortedTasks[i];
        const lowerPriorityTask = sortedTasks[j];

        const higherPriorityValue = priorityOrder[higherPriorityTask.priority as keyof typeof priorityOrder] || 0;
        const lowerPriorityValue = priorityOrder[lowerPriorityTask.priority as keyof typeof priorityOrder] || 0;

        // Only create dependency if priority difference is significant (2+ levels)
        if (higherPriorityValue - lowerPriorityValue &gt;= 2) {
          dependencies.push({
            from: higherPriorityTask.id,
            to: lowerPriorityTask.id,
            type: 'priority',
            confidence: 0.4,
            reason: `Priority dependency: ${higherPriorityTask.priority} priority should complete before ${lowerPriorityTask.priority}`,
            blocking: false,
            estimatedDelay: 0.5,
          });

          logger.debug(`Priority dependency detected: ${higherPriorityTask.id} → ${lowerPriorityTask.id}`, {
            higherPriority: higherPriorityTask.priority,
            lowerPriority: lowerPriorityTask.priority,
            reason: 'significant priority difference'
          });
        }
      }
    }

    return dependencies;
  }

  /**
   * Remove duplicate dependencies
   */
  private deduplicateDependencies(dependencies: DetectedDependency[]): DetectedDependency[] {
    const seen = new Set&lt;string&gt;();
    const unique: DetectedDependency[] = [];

    for (const dep of dependencies) {
      const key = `${dep.from}-${dep.to}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(dep);
      } else {
        // If duplicate, keep the one with higher confidence
        const existingIndex = unique.findIndex(d =&gt; d.from === dep.from && d.to === dep.to);
        if (existingIndex !== -1 && dep.confidence &gt; unique[existingIndex].confidence) {
          unique[existingIndex] = dep;
        }
      }
    }

    return unique;
  }

  /**
   * Validate dependencies against task list
   */
  private validateDependencies(dependencies: DetectedDependency[], tasks: Task[]): DetectedDependency[] {
    const taskIds = new Set(tasks.map(t =&gt; t.id));
    return dependencies.filter(dep =&gt;
      taskIds.has(dep.from) && taskIds.has(dep.to) && dep.from !== dep.to
    );
  }

  /**
   * Detect potential circular dependencies
   */
  private detectPotentialCircularDependencies(dependencies: DetectedDependency[]): string[][] {
    const graph = new Map&lt;string, Set&lt;string&gt;&gt;();

    // Build adjacency list
    for (const dep of dependencies) {
      if (!graph.has(dep.from)) {
        graph.set(dep.from, new Set());
      }
      graph.get(dep.from)!.add(dep.to);
    }

    const cycles: string[][] = [];
    const visited = new Set&lt;string&gt;();
    const recStack = new Set&lt;string&gt;();

    const dfs = (node: string, path: string[]): void =&gt; {
      visited.add(node);
      recStack.add(node);
      path.push(node);

      const neighbors = graph.get(node);
      if (neighbors) {
        for (const neighbor of neighbors) {
          if (!visited.has(neighbor)) {
            dfs(neighbor, [...path]);
          } else if (recStack.has(neighbor)) {
            // Found cycle
            const cycleStart = path.indexOf(neighbor);
            if (cycleStart !== -1) {
              cycles.push([...path.slice(cycleStart), neighbor]);
            }
          }
        }
      }

      recStack.delete(node);
    };

    for (const node of graph.keys()) {
      if (!visited.has(node)) {
        dfs(node, []);
      }
    }

    return cycles;
  }

  /**
   * Initialize keyword and resource patterns
   */
  private initializePatterns(): void {
    this.keywordPatterns = new Map([
      ['setup', ['setup', 'initialize', 'install', 'configure', 'prepare']],
      ['development', ['implement', 'develop', 'code', 'build', 'create']],
      ['testing', ['test', 'validate', 'verify', 'check', 'assert']],
      ['deployment', ['deploy', 'release', 'publish', 'launch', 'distribute']],
      ['database', ['database', 'db', 'schema', 'migration', 'query']],
      ['api', ['api', 'endpoint', 'service', 'interface', 'protocol']],
      ['ui', ['ui', 'interface', 'frontend', 'component', 'view']],
      ['security', ['security', 'auth', 'permission', 'encrypt', 'secure']],
    ]);

    this.resourcePatterns = new Map([
      ['database', ['database', 'db', 'mysql', 'postgres', 'mongodb']],
      ['server', ['server', 'backend', 'api', 'service', 'microservice']],
      ['frontend', ['frontend', 'ui', 'react', 'vue', 'angular']],
      ['mobile', ['mobile', 'ios', 'android', 'app', 'native']],
    ]);
  }

  /**
   * Get sequential index of text in keyword array
   */
  private getSequentialIndex(text: string, keywords: string[]): number {
    for (let i = 0; i &lt; keywords.length; i++) {
      if (text.includes(keywords[i])) {
        return i;
      }
    }
    return -1;
  }

  /**
   * Estimate delay between tasks
   */
  private estimateDelay(from: Task, to: Task): number {
    const baseDelay = from.estimated_effort || 1;
    const priorityMultiplier = from.priority === 'critical' ? 0.5 : 1.0;
    return baseDelay * priorityMultiplier;
  }

  /**
   * Get logger instance
   */
  private getLogger() {
    return {
      info: (message: string, data?: any) =&gt; {
        console.log(`[DependencyAnalyzer] INFO: ${message}`, data || '');
      },
      debug: (message: string, data?: any) =&gt; {
        console.log(`[DependencyAnalyzer] DEBUG: ${message}`, data || '');
      },
      warn: (message: string, data?: any) =&gt; {
        console.warn(`[DependencyAnalyzer] WARN: ${message}`, data || '');
      },
      error: (message: string, data?: any) =&gt; {
        console.error(`[DependencyAnalyzer] ERROR: ${message}`, data || '');
      },
    };
  }
}