/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { getComponentLogger } from '../utils/logger.js';
import { DecisionType, DecisionPriority } from './types.js';
import type {
  DecisionRule,
  DecisionCondition,
  DecisionAction,
  DecisionContext,
} from './types.js';

const logger = getComponentLogger('rule-engine');

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
export class RuleEngine {
  private readonly rules = new Map<string, DecisionRule>();
  private readonly rulesByType = new Map<DecisionType, Set<string>>();
  private isInitialized = false;

  // Performance tracking
  private readonly ruleStats = new Map<
    string,
    {
      evaluations: number;
      matches: number;
      avgEvaluationTime: number;
      lastUsed: number;
    }
  >();

  /**
   * Initialize the rule engine.
   */
  async initialize(): Promise<void> {
    logger.info('Initializing RuleEngine');

    try {
      // Load default rules
      await this.loadDefaultRules();

      // Load custom rules from configuration
      await this.loadCustomRules();

      this.isInitialized = true;
      logger.info('RuleEngine initialized successfully', {
        totalRules: this.rules.size,
        rulesByType: Object.fromEntries(this.rulesByType),
      });
    } catch (error) {
      logger.error('Failed to initialize RuleEngine', { error });
      throw error;
    }
  }

  /**
   * Shutdown the rule engine gracefully.
   */
  async shutdown(): Promise<void> {
    logger.info('Shutting down RuleEngine');

    try {
      // Save rule performance statistics
      await this.saveRuleStats();

      this.rules.clear();
      this.rulesByType.clear();
      this.ruleStats.clear();
      this.isInitialized = false;

      logger.info('RuleEngine shutdown complete');
    } catch (error) {
      logger.error('Error during RuleEngine shutdown', { error });
    }
  }

  /**
   * Evaluate rules for a specific decision type and context.
   *
   * @param type - Type of decision being made
   * @param input - Input parameters for the decision
   * @param context - Current system context
   * @returns Array of rule evaluation results
   */
  async evaluate<T = Record<string, unknown>>(
    type: DecisionType,
    input: T,
    context: DecisionContext,
  ): Promise<RuleEvaluationResult[]> {
    if (!this.isInitialized) {
      throw new Error('RuleEngine not initialized');
    }

    const startTime = performance.now();

    try {
      // Get applicable rules for this decision type
      const applicableRuleIds = this.rulesByType.get(type) || new Set();
      const applicableRules = Array.from(applicableRuleIds)
        .map((id) => this.rules.get(id))
        .filter(
          (rule): rule is DecisionRule => rule !== undefined && rule.enabled,
        )
        .sort((a, b) => b.weight - a.weight); // Higher weight first

      const results: RuleEvaluationResult[] = [];

      // Evaluate each applicable rule
      for (const rule of applicableRules) {
        const ruleStartTime = performance.now();

        try {
          const result = await this.evaluateRule(rule, input, context);
          results.push(result);

          // Update rule statistics
          this.updateRuleStats(
            rule.id,
            performance.now() - ruleStartTime,
            result.matched,
          );

          logger.debug('Evaluated rule', {
            ruleId: rule.id,
            matched: result.matched,
            confidence: result.confidence,
            actions: result.actions.length,
          });
        } catch (error) {
          logger.warn(`Failed to evaluate rule ${rule.id}`, { error });
          // Continue with other rules
        }
      }

      const duration = performance.now() - startTime;
      logger.debug(
        `Evaluated ${applicableRules.length} rules in ${duration.toFixed(2)}ms`,
        {
          type,
          matches: results.filter((r) => r.matched).length,
        },
      );

      return results;
    } catch (error) {
      logger.error('Failed to evaluate rules', { error, type });
      throw error;
    }
  }

  /**
   * Add a new rule or update an existing one.
   *
   * @param rule - Rule to add or update
   */
  async addRule(rule: DecisionRule): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('RuleEngine not initialized');
    }

    // Validate rule structure
    this.validateRule(rule);

    // Add to main rules collection
    this.rules.set(rule.id, { ...rule });

    // Index by decision types
    for (const type of rule.applicableTypes) {
      if (!this.rulesByType.has(type)) {
        this.rulesByType.set(type, new Set());
      }
      this.rulesByType.get(type)!.add(rule.id);
    }

    logger.info(`Added rule: ${rule.name}`, {
      ruleId: rule.id,
      applicableTypes: rule.applicableTypes,
      conditions: rule.conditions.length,
      actions: rule.actions.length,
    });
  }

  /**
   * Remove a rule by ID.
   *
   * @param ruleId - ID of the rule to remove
   */
  async removeRule(ruleId: string): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('RuleEngine not initialized');
    }

    const rule = this.rules.get(ruleId);
    if (!rule) {
      logger.warn(`Attempted to remove non-existent rule: ${ruleId}`);
      return;
    }

    // Remove from main collection
    this.rules.delete(ruleId);

    // Remove from type indexes
    for (const type of rule.applicableTypes) {
      this.rulesByType.get(type)?.delete(ruleId);
    }

    // Remove statistics
    this.ruleStats.delete(ruleId);

    logger.info(`Removed rule: ${rule.name}`, { ruleId });
  }

  /**
   * Update an existing rule.
   *
   * @param ruleId - ID of the rule to update
   * @param updates - Partial rule updates
   */
  async updateRule(
    ruleId: string,
    updates: Partial<DecisionRule>,
  ): Promise<void> {
    const existingRule = this.rules.get(ruleId);
    if (!existingRule) {
      throw new Error(`Rule not found: ${ruleId}`);
    }

    // Create updated rule
    const updatedRule: DecisionRule = {
      ...existingRule,
      ...updates,
      id: ruleId, // Ensure ID cannot be changed
      metadata: {
        ...existingRule.metadata,
        updatedAt: Date.now(),
      },
    };

    // Remove old rule
    await this.removeRule(ruleId);

    // Add updated rule
    await this.addRule(updatedRule);

    logger.info(`Updated rule: ${updatedRule.name}`, { ruleId });
  }

  /**
   * Get all rules, optionally filtered by decision type.
   *
   * @param type - Optional decision type to filter by
   * @returns Array of rules
   */
  getRules(type?: DecisionType): DecisionRule[] {
    if (type) {
      const ruleIds = this.rulesByType.get(type) || new Set();
      return Array.from(ruleIds)
        .map((id) => this.rules.get(id))
        .filter((rule): rule is DecisionRule => rule !== undefined);
    }

    return Array.from(this.rules.values());
  }

  /**
   * Get rule performance statistics.
   */
  getRuleStatistics(): Record<
    string,
    {
      evaluations: number;
      matches: number;
      matchRate: number;
      avgEvaluationTime: number;
      lastUsed: Date;
    }
  > {
    const stats: Record<string, unknown> = {};

    for (const [ruleId, ruleStat] of this.ruleStats) {
      stats[ruleId] = {
        evaluations: ruleStat.evaluations,
        matches: ruleStat.matches,
        matchRate:
          ruleStat.evaluations > 0
            ? ruleStat.matches / ruleStat.evaluations
            : 0,
        avgEvaluationTime: ruleStat.avgEvaluationTime,
        lastUsed: new Date(ruleStat.lastUsed),
      };
    }

    return stats;
  }

  /**
   * Evaluate a single rule against input and context.
   */
  private async evaluateRule<T>(
    rule: DecisionRule,
    input: T,
    context: DecisionContext,
  ): Promise<RuleEvaluationResult> {
    const evaluationContext = {
      input,
      context,
      // Flatten context for easier field access
      ...this.flattenObject(context),
    };

    // Evaluate all conditions
    const conditionResults = rule.conditions.map((condition) =>
      this.evaluateCondition(condition, evaluationContext),
    );

    // Determine if rule matches based on condition requirements
    const requiredConditions = conditionResults.filter(
      (result, index) => rule.conditions[index].required,
    );
    const optionalConditions = conditionResults.filter(
      (result, index) => !rule.conditions[index].required,
    );

    const requiredMet =
      requiredConditions.length === 0 || requiredConditions.every((r) => r);
    const hasOptionalMatch =
      optionalConditions.length === 0 || optionalConditions.some((r) => r);

    const matched = requiredMet && hasOptionalMatch;

    // Calculate confidence based on how many conditions matched
    const totalConditions = conditionResults.length;
    const matchedConditions = conditionResults.filter((r) => r).length;
    const conditionConfidence =
      totalConditions > 0 ? matchedConditions / totalConditions : 1;

    // Apply rule weight to confidence
    const confidence = matched ? conditionConfidence * rule.weight : 0;

    // Generate actions if rule matched
    const actions = matched ? [...rule.actions] : [];

    const reasoning = this.generateReasoning(rule, conditionResults, matched);

    return {
      rule,
      matched,
      confidence,
      actions,
      reasoning,
    };
  }

  /**
   * Evaluate a single condition against the evaluation context.
   */
  private evaluateCondition(
    condition: DecisionCondition,
    evaluationContext: Record<string, unknown>,
  ): boolean {
    try {
      const fieldValue = this.getFieldValue(condition.field, evaluationContext);
      const conditionValue = condition.value;

      switch (condition.operator) {
        case 'eq':
          return fieldValue === conditionValue;

        case 'ne':
          return fieldValue !== conditionValue;

        case 'gt':
          return (
            typeof fieldValue === 'number' &&
            typeof conditionValue === 'number' &&
            fieldValue > conditionValue
          );

        case 'gte':
          return (
            typeof fieldValue === 'number' &&
            typeof conditionValue === 'number' &&
            fieldValue >= conditionValue
          );

        case 'lt':
          return (
            typeof fieldValue === 'number' &&
            typeof conditionValue === 'number' &&
            fieldValue < conditionValue
          );

        case 'lte':
          return (
            typeof fieldValue === 'number' &&
            typeof conditionValue === 'number' &&
            fieldValue <= conditionValue
          );

        case 'contains':
          if (
            typeof fieldValue === 'string' &&
            typeof conditionValue === 'string'
          ) {
            return fieldValue.includes(conditionValue);
          }
          if (Array.isArray(fieldValue)) {
            return fieldValue.includes(conditionValue);
          }
          return false;

        case 'in':
          if (Array.isArray(conditionValue)) {
            return conditionValue.includes(fieldValue);
          }
          return false;

        case 'regex':
          if (
            typeof fieldValue === 'string' &&
            typeof conditionValue === 'string'
          ) {
            const regex = new RegExp(conditionValue);
            return regex.test(fieldValue);
          }
          return false;

        default:
          logger.warn(`Unknown condition operator: ${condition.operator}`);
          return false;
      }
    } catch (error) {
      logger.warn('Failed to evaluate condition', {
        field: condition.field,
        operator: condition.operator,
        error: error instanceof Error ? error : new Error(String(error)),
      });
      return false;
    }
  }

  /**
   * Get a field value from the evaluation context using dot notation.
   */
  private getFieldValue(
    fieldPath: string,
    context: Record<string, unknown>,
  ): unknown {
    const pathParts = fieldPath.split('.');
    let value: unknown = context;

    for (const part of pathParts) {
      if (value && typeof value === 'object' && part in value) {
        value = value[part];
      } else {
        return undefined;
      }
    }

    return value;
  }

  /**
   * Flatten a nested object for easier field access.
   */
  private flattenObject(
    obj: Record<string, unknown>,
    prefix = '',
  ): Record<string, unknown> {
    const flattened: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(obj)) {
      const newKey = prefix ? `${prefix}.${key}` : key;

      if (value && typeof value === 'object' && !Array.isArray(value)) {
        Object.assign(
          flattened,
          this.flattenObject(value as Record<string, unknown>, newKey),
        );
      } else {
        flattened[newKey] = value;
      }
    }

    return flattened;
  }

  /**
   * Generate human-readable reasoning for rule evaluation.
   */
  private generateReasoning(
    rule: DecisionRule,
    conditionResults: boolean[],
    matched: boolean,
  ): string {
    const matchedCount = conditionResults.filter((r) => r).length;
    const totalCount = conditionResults.length;

    if (matched) {
      return `Rule "${rule.name}" matched (${matchedCount}/${totalCount} conditions). ${rule.description}`;
    } else {
      return `Rule "${rule.name}" did not match (${matchedCount}/${totalCount} conditions). ${rule.description}`;
    }
  }

  /**
   * Validate rule structure and constraints.
   */
  private validateRule(rule: DecisionRule): void {
    if (!rule.id || typeof rule.id !== 'string') {
      throw new Error('Rule must have a valid string ID');
    }

    if (!rule.name || typeof rule.name !== 'string') {
      throw new Error('Rule must have a valid name');
    }

    if (
      !Array.isArray(rule.applicableTypes) ||
      rule.applicableTypes.length === 0
    ) {
      throw new Error('Rule must have at least one applicable decision type');
    }

    if (!Array.isArray(rule.conditions)) {
      throw new Error('Rule must have conditions array');
    }

    if (!Array.isArray(rule.actions)) {
      throw new Error('Rule must have actions array');
    }

    if (typeof rule.weight !== 'number' || rule.weight < 0 || rule.weight > 1) {
      throw new Error('Rule weight must be a number between 0 and 1');
    }

    // Validate conditions
    for (const condition of rule.conditions) {
      if (!condition.field || typeof condition.field !== 'string') {
        throw new Error('Condition must have a valid field path');
      }

      const validOperators = [
        'eq',
        'ne',
        'gt',
        'gte',
        'lt',
        'lte',
        'contains',
        'in',
        'regex',
      ];
      if (!validOperators.includes(condition.operator)) {
        throw new Error(`Invalid condition operator: ${condition.operator}`);
      }
    }

    // Validate actions
    for (const action of rule.actions) {
      const validActionTypes = [
        'set_priority',
        'assign_agent',
        'allocate_resource',
        'escalate',
        'defer',
        'reject',
      ];
      if (!validActionTypes.includes(action.type)) {
        throw new Error(`Invalid action type: ${action.type}`);
      }
    }
  }

  /**
   * Update performance statistics for a rule.
   */
  private updateRuleStats(
    ruleId: string,
    evaluationTime: number,
    matched: boolean,
  ): void {
    let stats = this.ruleStats.get(ruleId);
    if (!stats) {
      stats = {
        evaluations: 0,
        matches: 0,
        avgEvaluationTime: 0,
        lastUsed: 0,
      };
      this.ruleStats.set(ruleId, stats);
    }

    stats.evaluations += 1;
    if (matched) {
      stats.matches += 1;
    }

    // Update moving average of evaluation time
    stats.avgEvaluationTime =
      (stats.avgEvaluationTime * (stats.evaluations - 1) + evaluationTime) /
      stats.evaluations;

    stats.lastUsed = Date.now();
  }

  /**
   * Load default built-in rules.
   */
  private async loadDefaultRules(): Promise<void> {
    const defaultRules: DecisionRule[] = [
      {
        id: 'high-system-load',
        name: 'High System Load Priority',
        description: 'Increase priority when system load is high',
        applicableTypes: [
          DecisionType.TASK_PRIORITIZATION,
          DecisionType.RESOURCE_ALLOCATION,
        ],
        conditions: [
          {
            field: 'systemLoad.cpu',
            operator: 'gt',
            value: 0.8,
            required: true,
          },
        ],
        actions: [
          {
            type: 'set_priority',
            parameters: { priority: DecisionPriority.HIGH },
            weight: 1.0,
          },
        ],
        weight: 0.8,
        enabled: true,
        metadata: {
          createdAt: Date.now(),
          updatedAt: Date.now(),
          createdBy: 'system',
          tags: ['performance', 'system-load'],
        },
      },

      {
        id: 'low-budget-constraint',
        name: 'Budget Constraint Handling',
        description: 'Defer non-critical tasks when budget is low',
        applicableTypes: [DecisionType.TASK_PRIORITIZATION],
        conditions: [
          {
            field: 'budgetContext.remainingRatio',
            operator: 'lt',
            value: 0.1, // Less than 10% budget remaining
            required: true,
          },
          {
            field: 'priority',
            operator: 'lt',
            value: DecisionPriority.HIGH,
            required: true,
          },
        ],
        actions: [
          {
            type: 'defer',
            parameters: { reason: 'budget_constraint' },
            weight: 1.0,
          },
        ],
        weight: 0.9,
        enabled: true,
        metadata: {
          createdAt: Date.now(),
          updatedAt: Date.now(),
          createdBy: 'system',
          tags: ['budget', 'constraint'],
        },
      },

      {
        id: 'working-hours-priority',
        name: 'Working Hours Adjustment',
        description: 'Adjust priority based on working hours',
        applicableTypes: [
          DecisionType.TASK_PRIORITIZATION,
          DecisionType.SCHEDULING,
        ],
        conditions: [
          {
            field: 'temporal.workingHours',
            operator: 'eq',
            value: 0, // Outside working hours
            required: true,
          },
        ],
        actions: [
          {
            type: 'defer',
            parameters: { until: 'working_hours' },
            weight: 0.5,
          },
        ],
        weight: 0.3, // Lower weight as this is more of a suggestion
        enabled: true,
        metadata: {
          createdAt: Date.now(),
          updatedAt: Date.now(),
          createdBy: 'system',
          tags: ['schedule', 'working-hours'],
        },
      },
    ];

    for (const rule of defaultRules) {
      await this.addRule(rule);
    }

    logger.info(`Loaded ${defaultRules.length} default rules`);
  }

  /**
   * Load custom rules from configuration.
   */
  private async loadCustomRules(): Promise<void> {
    try {
      // This would load from configuration files or database
      // For now, just log that custom rule loading is available
      logger.debug('Custom rule loading not yet implemented');
    } catch (error) {
      logger.warn('Failed to load custom rules', { error });
      // Continue without custom rules
    }
  }

  /**
   * Save rule performance statistics.
   */
  private async saveRuleStats(): Promise<void> {
    try {
      // This would save statistics to persistent storage
      // For now, just log the statistics
      const stats = this.getRuleStatistics();
      logger.info('Rule performance statistics', stats);
    } catch (error) {
      logger.warn('Failed to save rule statistics', { error });
    }
  }
}
