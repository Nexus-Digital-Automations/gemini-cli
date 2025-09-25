/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import type { DecisionRule, DecisionAction, DecisionType, DecisionContext } from './types.js';
/**
 * Result of evaluating a rule against context.
 */
export interface RuleEvaluationResult {
    rule: DecisionRule;
    matched: boolean;
    confidence: number;
    actions: DecisionAction[];
    reasoning: string;
}
/**
 * Rule-based decision engine that applies configurable decision logic.
 *
 * The RuleEngine provides a flexible, transparent way to codify decision-making
 * logic through configurable rules. It supports:
 * - Complex condition evaluation with multiple operators
 * - Weighted rule application and confidence scoring
 * - Action generation based on rule matches
 * - Dynamic rule management (add/remove/update)
 * - Performance optimization through rule indexing
 * - Debugging and explanation of rule decisions
 *
 * Rules are evaluated in priority order, with higher-weight rules taking
 * precedence. The engine can be used standalone or as part of a larger
 * decision-making system.
 *
 * Key features:
 * - JSONPath-style field access for complex condition evaluation
 * - Multiple condition operators (eq, gt, contains, regex, etc.)
 * - Composite conditions with AND/OR logic
 * - Confidence scoring based on rule specificity and weights
 * - Action chaining and parameter passing
 * - Rule performance monitoring
 *
 * @example
 * ```typescript
 * const ruleEngine = new RuleEngine();
 * await ruleEngine.initialize();
 *
 * // Add a rule
 * await ruleEngine.addRule({
 *   id: 'high-cpu-priority',
 *   name: 'High CPU Priority',
 *   description: 'Increase priority when CPU usage is high',
 *   applicableTypes: [DecisionType.TASK_PRIORITIZATION],
 *   conditions: [{
 *     field: 'systemLoad.cpu',
 *     operator: 'gt',
 *     value: 0.8,
 *     required: true
 *   }],
 *   actions: [{
 *     type: 'set_priority',
 *     parameters: { priority: DecisionPriority.HIGH },
 *     weight: 1.0
 *   }],
 *   weight: 0.9,
 *   enabled: true
 * });
 *
 * // Evaluate rules
 * const results = await ruleEngine.evaluate(
 *   DecisionType.TASK_PRIORITIZATION,
 *   { taskId: 'task-123' },
 *   context
 * );
 * ```
 */
export declare class RuleEngine {
    private readonly rules;
    private readonly rulesByType;
    private isInitialized;
    private readonly ruleStats;
    /**
     * Initialize the rule engine.
     */
    initialize(): Promise<void>;
    /**
     * Shutdown the rule engine gracefully.
     */
    shutdown(): Promise<void>;
    /**
     * Evaluate rules for a specific decision type and context.
     *
     * @param type - Type of decision being made
     * @param input - Input parameters for the decision
     * @param context - Current system context
     * @returns Array of rule evaluation results
     */
    evaluate<T = Record<string, unknown>>(type: DecisionType, input: T, context: DecisionContext): Promise<RuleEvaluationResult[]>;
    /**
     * Add a new rule or update an existing one.
     *
     * @param rule - Rule to add or update
     */
    addRule(rule: DecisionRule): Promise<void>;
    /**
     * Remove a rule by ID.
     *
     * @param ruleId - ID of the rule to remove
     */
    removeRule(ruleId: string): Promise<void>;
    /**
     * Update an existing rule.
     *
     * @param ruleId - ID of the rule to update
     * @param updates - Partial rule updates
     */
    updateRule(ruleId: string, updates: Partial<DecisionRule>): Promise<void>;
    /**
     * Get all rules, optionally filtered by decision type.
     *
     * @param type - Optional decision type to filter by
     * @returns Array of rules
     */
    getRules(type?: DecisionType): DecisionRule[];
    /**
     * Get rule performance statistics.
     */
    getRuleStatistics(): Record<string, {
        evaluations: number;
        matches: number;
        matchRate: number;
        avgEvaluationTime: number;
        lastUsed: Date;
    }>;
    /**
     * Evaluate a single rule against input and context.
     */
    private evaluateRule;
    /**
     * Evaluate a single condition against the evaluation context.
     */
    private evaluateCondition;
    /**
     * Get a field value from the evaluation context using dot notation.
     */
    private getFieldValue;
    /**
     * Flatten a nested object for easier field access.
     */
    private flattenObject;
    /**
     * Generate human-readable reasoning for rule evaluation.
     */
    private generateReasoning;
    /**
     * Validate rule structure and constraints.
     */
    private validateRule;
    /**
     * Update performance statistics for a rule.
     */
    private updateRuleStats;
    /**
     * Load default built-in rules.
     */
    private loadDefaultRules;
    /**
     * Load custom rules from configuration.
     */
    private loadCustomRules;
    /**
     * Save rule performance statistics.
     */
    private saveRuleStats;
}
