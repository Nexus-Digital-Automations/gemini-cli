/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { EventEmitter } from 'node:events';
import { getComponentLogger } from '../utils/logger.js';
import type {
  Decision,
  DecisionContext,
  DecisionOutcome,
  DecisionRule,
  DecisionConfig,
  DecisionAction,
} from './types.js';
import { DecisionType, DecisionPriority } from './types.js';
import { DecisionContextSchema, DecisionSchema } from './types.js';
import { DecisionAuditTrail } from './auditTrail.js';
import { DecisionLearningEngine } from './learningEngine.js';
import { ContextCollector } from './contextCollector.js';
import { RuleEngine } from './ruleEngine.js';
import { v4 as uuidv4 } from 'uuid';

const logger = getComponentLogger('decision-engine');

/**
 * Events emitted by the DecisionEngine.
 */
export interface DecisionEngineEvents {
  'decision-made': (decision: Decision) => void;
  'decision-executed': (decisionId: string, outcome: DecisionOutcome) => void;
  'decision-failed': (decisionId: string, error: Error) => void;
  'rule-triggered': (ruleId: string, decision: Decision) => void;
  'escalation-required': (decision: Decision, reason: string) => void;
  'learning-update': (performance: {
    accuracy: number;
    confidence: number;
  }) => void;
}

/**
 * Core autonomous decision-making engine.
 *
 * The DecisionEngine is the central component that orchestrates all autonomous
 * decision-making within the system. It integrates multiple specialized components
 * to provide intelligent, context-aware, and self-improving decision capabilities.
 *
 * Key responsibilities:
 * - Evaluate complex scenarios and make optimal decisions
 * - Apply configurable rules and machine learning insights
 * - Maintain audit trails for transparency and debugging
 * - Learn from outcomes to improve future decisions
 * - Handle escalation when confidence is insufficient
 *
 * @example
 * ```typescript
 * const engine = new DecisionEngine(config);
 * await engine.initialize();
 *
 * const decision = await engine.makeDecision(
 *   DecisionType.TASK_PRIORITIZATION,
 *   { taskId: 'task-123', urgency: 'high' }
 * );
 *
 * if (decision.requiresApproval) {
 *   await requestHumanApproval(decision);
 * }
 * ```
 */
export class DecisionEngine extends EventEmitter {
  private readonly config: DecisionConfig;
  private readonly auditTrail: DecisionAuditTrail;
  private readonly learningEngine: DecisionLearningEngine;
  private readonly contextCollector: ContextCollector;
  private readonly ruleEngine: RuleEngine;

  private readonly pendingDecisions = new Map<string, Decision>();
  private readonly executingDecisions = new Map<
    string,
    {
      decision: Decision;
      startTime: number;
      abortController: AbortController;
    }
  >();

  private isShuttingDown = false;
  private decisionCounter = 0;
  private lastDecisionTime = 0;

  constructor(config: DecisionConfig) {
    super();
    this.config = { ...config };

    this.auditTrail = new DecisionAuditTrail({
      maxEntries: config.learning.maxHistorySize,
      persistToDisk: config.monitoring.logAllDecisions,
    });

    this.learningEngine = new DecisionLearningEngine({
      enabled: config.learning.enabled,
      adaptationRate: config.learning.adaptationRate,
      minSamplesForLearning: config.learning.minSamplesForLearning,
    });

    this.contextCollector = new ContextCollector();

    this.ruleEngine = new RuleEngine();

    // Set up event listeners for learning
    this.on('decision-executed', (decisionId, outcome) => {
      if (this.config.learning.enabled) {
        this.learningEngine.recordOutcome(decisionId, outcome);
      }
    });

    this.on('decision-failed', (decisionId, error) => {
      logger.error(`Decision ${decisionId} failed`, { error: error.message });
    });
  }

  /**
   * Initialize the decision engine and all its components.
   */
  async initialize(): Promise<void> {
    logger.info('Initializing DecisionEngine');

    try {
      await this.contextCollector.initialize();
      await this.ruleEngine.initialize();
      await this.learningEngine.initialize();
      await this.auditTrail.initialize();

      logger.info('DecisionEngine initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize DecisionEngine', { error });
      throw error;
    }
  }

  /**
   * Shutdown the decision engine gracefully.
   */
  async shutdown(): Promise<void> {
    logger.info('Shutting down DecisionEngine');
    this.isShuttingDown = true;

    // Cancel all executing decisions
    for (const [decisionId, execution] of this.executingDecisions) {
      logger.info(`Cancelling executing decision: ${decisionId}`);
      execution.abortController.abort();
    }

    // Wait for all decisions to complete or timeout
    const timeout = setTimeout(() => {
      logger.warn('Timeout waiting for decisions to complete during shutdown');
    }, 5000);

    while (this.executingDecisions.size > 0) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    clearTimeout(timeout);

    try {
      await this.auditTrail.shutdown();
      await this.learningEngine.shutdown();
      await this.contextCollector.shutdown();
      await this.ruleEngine.shutdown();

      logger.info('DecisionEngine shutdown complete');
    } catch (error) {
      logger.error('Error during DecisionEngine shutdown', { error });
    }
  }

  /**
   * Make a decision for the given type and input parameters.
   *
   * This is the primary method for requesting autonomous decisions.
   * The engine will:
   * 1. Collect current system context
   * 2. Apply decision rules and ML insights
   * 3. Generate a decision with confidence scoring
   * 4. Determine if human approval is required
   * 5. Log the decision for audit and learning
   *
   * @param type - Type of decision to make
   * @param input - Input parameters specific to the decision type
   * @param options - Additional options for decision-making
   * @returns Promise resolving to the decision
   */
  async makeDecision<T = Record<string, unknown>>(
    type: DecisionType,
    input: T,
    options: {
      urgency?: DecisionPriority;
      timeoutMs?: number;
      bypassRateLimit?: boolean;
    } = {},
  ): Promise<Decision> {
    if (this.isShuttingDown) {
      throw new Error('DecisionEngine is shutting down');
    }

    // Check rate limiting
    if (!options.bypassRateLimit && !this.checkRateLimit()) {
      throw new Error('Decision rate limit exceeded');
    }

    const startTime = performance.now();
    const decisionId = uuidv4();

    logger.info(`Making decision ${decisionId}`, { type, input });

    try {
      // Collect current system context
      const context = await this.contextCollector.collect();
      DecisionContextSchema.parse(context); // Validate context structure

      // Apply rules to get preliminary decision
      const ruleResults = await this.ruleEngine.evaluate(type, input, context);

      // Get ML recommendations if learning is enabled
      let mlRecommendation: Decision | null = null;
      if (this.config.learning.enabled) {
        mlRecommendation = await this.learningEngine.recommend(
          type,
          input,
          context,
        );
      }

      // Combine rule results and ML recommendations
      const decision = await this.synthesizeDecision(
        decisionId,
        type,
        input,
        context,
        ruleResults,
        mlRecommendation,
        options,
      );

      // Validate the generated decision
      DecisionSchema.parse(decision);

      // Record the decision
      this.auditTrail.recordDecision(decision);
      this.pendingDecisions.set(decisionId, decision);

      // Emit decision event
      this.emit('decision-made', decision);

      const duration = performance.now() - startTime;
      logger.info(`Decision ${decisionId} made in ${duration.toFixed(2)}ms`, {
        choice: decision.choice,
        confidence: decision.confidence,
        requiresApproval: decision.requiresApproval,
      });

      return decision;
    } catch (error) {
      const duration = performance.now() - startTime;
      logger.error(
        `Failed to make decision ${decisionId} after ${duration.toFixed(2)}ms`,
        {
          error: error instanceof Error ? error.message : String(error),
        },
      );

      this.emit(
        'decision-failed',
        decisionId,
        error instanceof Error ? error : new Error(String(error)),
      );
      throw error;
    }
  }

  /**
   * Execute a decision that has been approved (either automatically or by human).
   *
   * @param decisionId - ID of the decision to execute
   * @param approvedBy - Who approved the decision (if applicable)
   * @returns Promise resolving to the execution outcome
   */
  async executeDecision(
    decisionId: string,
    approvedBy?: string,
  ): Promise<DecisionOutcome> {
    const decision = this.pendingDecisions.get(decisionId);
    if (!decision) {
      throw new Error(`Decision ${decisionId} not found or already executed`);
    }

    if (decision.requiresApproval && !approvedBy) {
      throw new Error(
        `Decision ${decisionId} requires approval but none provided`,
      );
    }

    logger.info(`Executing decision ${decisionId}`, {
      choice: decision.choice,
      approvedBy,
    });

    const startTime = performance.now();
    const abortController = new AbortController();

    this.executingDecisions.set(decisionId, {
      decision,
      startTime,
      abortController,
    });

    this.pendingDecisions.delete(decisionId);

    try {
      // Execute the decision based on its type and choice
      const outcome = await this.performExecution(
        decision,
        abortController.signal,
      );

      // Record the outcome
      outcome.decisionId = decisionId;
      outcome.timestamp = Date.now();

      this.auditTrail.recordOutcome(outcome);
      this.emit('decision-executed', decisionId, outcome);

      const duration = performance.now() - startTime;
      logger.info(
        `Decision ${decisionId} executed successfully in ${duration.toFixed(2)}ms`,
        {
          success: outcome.success,
          actualDuration: outcome.actualDuration,
        },
      );

      return outcome;
    } catch (error) {
      const duration = performance.now() - startTime;
      const outcome: DecisionOutcome = {
        decisionId,
        timestamp: Date.now(),
        success: false,
        actualDuration: duration,
        actualResources: {},
        metrics: {},
        insights: [],
        errors: [error instanceof Error ? error.message : String(error)],
      };

      this.auditTrail.recordOutcome(outcome);
      this.emit(
        'decision-failed',
        decisionId,
        error instanceof Error ? error : new Error(String(error)),
      );

      logger.error(
        `Decision ${decisionId} execution failed after ${duration.toFixed(2)}ms`,
        {
          error: error instanceof Error ? error.message : String(error),
        },
      );

      return outcome;
    } finally {
      this.executingDecisions.delete(decisionId);
    }
  }

  /**
   * Add or update a decision rule.
   *
   * @param rule - The rule to add or update
   */
  async addRule(rule: DecisionRule): Promise<void> {
    await this.ruleEngine.addRule(rule);
    logger.info(`Added decision rule: ${rule.name}`);
  }

  /**
   * Remove a decision rule.
   *
   * @param ruleId - ID of the rule to remove
   */
  async removeRule(ruleId: string): Promise<void> {
    await this.ruleEngine.removeRule(ruleId);
    logger.info(`Removed decision rule: ${ruleId}`);
  }

  /**
   * Get performance metrics for the decision engine.
   */
  getPerformanceMetrics(): {
    totalDecisions: number;
    successRate: number;
    avgConfidence: number;
    avgExecutionTime: number;
    pendingDecisions: number;
    executingDecisions: number;
  } {
    const auditStats = this.auditTrail.getStatistics();

    return {
      totalDecisions: auditStats.totalDecisions,
      successRate: auditStats.successRate,
      avgConfidence: auditStats.avgConfidence,
      avgExecutionTime: auditStats.avgExecutionTime,
      pendingDecisions: this.pendingDecisions.size,
      executingDecisions: this.executingDecisions.size,
    };
  }

  /**
   * Get the current system context.
   */
  async getCurrentContext(): Promise<DecisionContext> {
    return this.contextCollector.collect();
  }

  /**
   * Check if the rate limit allows making a new decision.
   */
  private checkRateLimit(): boolean {
    const now = Date.now();
    const _windowStart = now - 60000; // 1 minute window

    // Reset counter if we're in a new minute
    if (now - this.lastDecisionTime > 60000) {
      this.decisionCounter = 0;
    }

    if (this.decisionCounter >= this.config.maxDecisionsPerMinute) {
      logger.warn('Decision rate limit exceeded', {
        current: this.decisionCounter,
        limit: this.config.maxDecisionsPerMinute,
      });
      return false;
    }

    this.decisionCounter++;
    this.lastDecisionTime = now;
    return true;
  }

  /**
   * Synthesize a final decision from rule results and ML recommendations.
   */
  private async synthesizeDecision<T>(
    decisionId: string,
    type: DecisionType,
    input: T,
    context: DecisionContext,
    ruleResults: Array<{
      rule: DecisionRule;
      actions: DecisionAction[];
      confidence: number;
    }>,
    mlRecommendation: Decision | null,
    options: { urgency?: DecisionPriority; timeoutMs?: number },
  ): Promise<Decision> {
    // Calculate base confidence from rules
    let confidence = 0.5; // Base confidence
    let choice = 'default';
    let reasoning = 'Default decision due to no applicable rules';
    let priority = options.urgency || DecisionPriority.NORMAL;
    let requiresApproval = this.config.requireApprovalFor.includes(type);

    const alternatives: Array<{
      choice: string;
      score: number;
      reasoning: string;
    }> = [];
    const evidence: Record<string, unknown> = {
      ruleCount: ruleResults.length,
      mlRecommendation: !!mlRecommendation,
      inputParameters: input,
    };

    // Process rule results
    if (ruleResults.length > 0) {
      // Weight and combine rule actions
      let totalWeight = 0;
      let weightedConfidence = 0;

      for (const result of ruleResults) {
        totalWeight += result.rule.weight;
        weightedConfidence += result.confidence * result.rule.weight;

        alternatives.push({
          choice: `rule-${result.rule.id}`,
          score: result.confidence * result.rule.weight,
          reasoning: result.rule.description,
        });

        // Apply highest priority action
        for (const action of result.actions) {
          if (action.type === 'set_priority' && action.parameters.priority) {
            const actionPriority = action.parameters
              .priority as DecisionPriority;
            if (actionPriority > priority) {
              priority = actionPriority;
            }
          }
        }
      }

      if (totalWeight > 0) {
        confidence = weightedConfidence / totalWeight;
        choice = `rules-composite`;
        reasoning = `Applied ${ruleResults.length} rules with weighted confidence ${confidence.toFixed(3)}`;
      }
    }

    // Incorporate ML recommendation if available
    if (mlRecommendation && this.config.learning.enabled) {
      const mlWeight = Math.min(mlRecommendation.confidence * 2, 1); // ML gets up to 2x weight
      const combinedConfidence =
        (confidence + mlRecommendation.confidence * mlWeight) / (1 + mlWeight);

      alternatives.push({
        choice: mlRecommendation.choice,
        score: mlRecommendation.confidence,
        reasoning: `ML recommendation: ${mlRecommendation.reasoning}`,
      });

      // Use ML recommendation if it has higher confidence
      if (mlRecommendation.confidence > confidence) {
        choice = mlRecommendation.choice;
        confidence = combinedConfidence;
        reasoning = `ML-guided decision: ${mlRecommendation.reasoning}`;
      }

      evidence.mlConfidence = mlRecommendation.confidence;
      evidence.mlReasoning = mlRecommendation.reasoning;
    }

    // Apply confidence threshold for approval requirement
    if (confidence < this.config.defaultConfidenceThreshold) {
      requiresApproval = true;
      reasoning += ` (Low confidence ${confidence.toFixed(3)} requires approval)`;
    }

    // Handle critical priority
    if (priority >= DecisionPriority.CRITICAL) {
      if (context.userPreferences.criticalTaskNotification) {
        // This would trigger notifications to users
        this.emit(
          'escalation-required',
          {
            id: decisionId,
            type,
            choice,
            priority,
            confidence,
            reasoning,
          } as Decision,
          'Critical priority task detected',
        );
      }
    }

    return {
      id: decisionId,
      timestamp: Date.now(),
      type,
      choice,
      priority,
      confidence,
      reasoning,
      evidence,
      expectedOutcome: {
        successProbability: confidence,
        estimatedDuration: this.estimateDuration(type, input, context),
        requiredResources: this.estimateResources(type, input, context),
      },
      context,
      requiresApproval,
      alternatives: alternatives.sort((a, b) => b.score - a.score).slice(0, 3), // Top 3 alternatives
    };
  }

  /**
   * Estimate the duration for executing a decision.
   */
  private estimateDuration<T>(
    type: DecisionType,
    input: T,
    context: DecisionContext,
  ): number {
    // Use historical data if available
    if (context.performanceHistory.avgCompletionTime > 0) {
      return context.performanceHistory.avgCompletionTime;
    }

    // Default estimates based on decision type
    const estimates = {
      [DecisionType.TASK_PRIORITIZATION]: 100,
      [DecisionType.RESOURCE_ALLOCATION]: 500,
      [DecisionType.AGENT_ASSIGNMENT]: 200,
      [DecisionType.CONFLICT_RESOLUTION]: 1000,
      [DecisionType.ESCALATION]: 50,
      [DecisionType.OPTIMIZATION]: 2000,
      [DecisionType.SCHEDULING]: 300,
      [DecisionType.LOAD_BALANCING]: 400,
      [DecisionType.FAILURE_RECOVERY]: 800,
      [DecisionType.CAPACITY_PLANNING]: 1500,
    };

    return estimates[type] || 500;
  }

  /**
   * Estimate the resources required for executing a decision.
   */
  private estimateResources<T>(
    type: DecisionType,
    _input: T,
    _context: DecisionContext,
  ): string[] {
    const resources: string[] = [];

    // CPU intensive operations
    if (
      [
        DecisionType.OPTIMIZATION,
        DecisionType.CAPACITY_PLANNING,
        DecisionType.CONFLICT_RESOLUTION,
      ].includes(type)
    ) {
      resources.push('cpu');
    }

    // Memory intensive operations
    if (
      [DecisionType.RESOURCE_ALLOCATION, DecisionType.LOAD_BALANCING].includes(
        type,
      )
    ) {
      resources.push('memory');
    }

    // Network intensive operations
    if (
      [DecisionType.AGENT_ASSIGNMENT, DecisionType.ESCALATION].includes(type)
    ) {
      resources.push('network');
    }

    return resources.length > 0 ? resources : ['cpu']; // Default to CPU
  }

  /**
   * Perform the actual execution of a decision.
   */
  private async performExecution(
    decision: Decision,
    abortSignal: AbortSignal,
  ): Promise<DecisionOutcome> {
    const startTime = performance.now();

    // This is a placeholder - in a real implementation, this would
    // delegate to specific execution handlers based on the decision type
    await new Promise((resolve) => {
      const timeout = setTimeout(
        resolve,
        Math.min(decision.expectedOutcome.estimatedDuration, 100),
      );
      abortSignal.addEventListener('abort', () => {
        clearTimeout(timeout);
        resolve(undefined);
      });
    });

    if (abortSignal.aborted) {
      throw new Error('Decision execution was aborted');
    }

    const actualDuration = performance.now() - startTime;

    return {
      decisionId: decision.id,
      timestamp: Date.now(),
      success: true,
      actualDuration,
      actualResources: {
        cpu: Math.random() * 0.1, // Simulated resource usage
        memory: Math.random() * 0.05,
      },
      metrics: {
        executionTime: actualDuration,
        confidence: decision.confidence,
      },
      insights: [
        `Decision executed with ${decision.confidence.toFixed(3)} confidence`,
      ],
      errors: [],
    };
  }
}

// Type augmentation for EventEmitter to provide proper typing
export interface DecisionEngineEventMethods {
  on<K extends keyof DecisionEngineEvents>(
    event: K,
    listener: DecisionEngineEvents[K],
  ): this;
  emit<K extends keyof DecisionEngineEvents>(
    event: K,
    ...args: Parameters<DecisionEngineEvents[K]>
  ): boolean;
}
