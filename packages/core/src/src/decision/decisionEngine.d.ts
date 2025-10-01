/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { EventEmitter } from 'node:events';
import type { Decision, DecisionContext, DecisionOutcome, DecisionRule, DecisionConfig } from './types.js';
import { DecisionType, DecisionPriority } from './types.js';
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
export declare class DecisionEngine extends EventEmitter {
    private readonly config;
    private readonly auditTrail;
    private readonly learningEngine;
    private readonly contextCollector;
    private readonly ruleEngine;
    private readonly pendingDecisions;
    private readonly executingDecisions;
    private isShuttingDown;
    private decisionCounter;
    private lastDecisionTime;
    constructor(config: DecisionConfig);
    /**
     * Initialize the decision engine and all its components.
     */
    initialize(): Promise<void>;
    /**
     * Shutdown the decision engine gracefully.
     */
    shutdown(): Promise<void>;
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
    makeDecision<T = Record<string, unknown>>(type: DecisionType, input: T, options?: {
        urgency?: DecisionPriority;
        timeoutMs?: number;
        bypassRateLimit?: boolean;
    }): Promise<Decision>;
    /**
     * Execute a decision that has been approved (either automatically or by human).
     *
     * @param decisionId - ID of the decision to execute
     * @param approvedBy - Who approved the decision (if applicable)
     * @returns Promise resolving to the execution outcome
     */
    executeDecision(decisionId: string, approvedBy?: string): Promise<DecisionOutcome>;
    /**
     * Add or update a decision rule.
     *
     * @param rule - The rule to add or update
     */
    addRule(rule: DecisionRule): Promise<void>;
    /**
     * Remove a decision rule.
     *
     * @param ruleId - ID of the rule to remove
     */
    removeRule(ruleId: string): Promise<void>;
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
    };
    /**
     * Get the current system context.
     */
    getCurrentContext(): Promise<DecisionContext>;
    /**
     * Check if the rate limit allows making a new decision.
     */
    private checkRateLimit;
    /**
     * Synthesize a final decision from rule results and ML recommendations.
     */
    private synthesizeDecision;
    /**
     * Estimate the duration for executing a decision.
     */
    private estimateDuration;
    /**
     * Estimate the resources required for executing a decision.
     */
    private estimateResources;
    /**
     * Perform the actual execution of a decision.
     */
    private performExecution;
}
export interface DecisionEngineEventMethods {
    on<K extends keyof DecisionEngineEvents>(event: K, listener: DecisionEngineEvents[K]): this;
    emit<K extends keyof DecisionEngineEvents>(event: K, ...args: Parameters<DecisionEngineEvents[K]>): boolean;
}
