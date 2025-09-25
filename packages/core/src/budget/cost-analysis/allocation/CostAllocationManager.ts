/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as fs from &apos;node:fs/promises&apos;;
import * as path from &apos;node:path&apos;;
import type { FeatureCostEntry } from &apos;../tracking/FeatureCostTracker.js&apos;;

/**
 * Cost allocation method for distributing costs
 */
export type CostAllocationMethod =
  | &apos;equal&apos; // Equal distribution
  | &apos;proportional&apos; // Based on usage metrics
  | &apos;usage_based&apos; // Based on actual usage
  | &apos;value_based&apos; // Based on business value
  | &apos;custom&apos; // Custom allocation rules
  | &apos;activity_based&apos; // Activity-based costing
  | &apos;weighted&apos; // Weighted allocation
  | &apos;hybrid&apos;; // Combination of methods

/**
 * Cost allocation rule configuration
 */
export interface CostAllocationRule {
  /** Rule identifier */
  id: string;
  /** Rule name */
  name: string;
  /** Allocation method */
  method: CostAllocationMethod;
  /** Rule priority (higher = more priority) */
  priority: number;
  /** Condition to apply this rule */
  condition: (cost: FeatureCostEntry) => boolean;
  /** Weight for weighted allocation */
  weight?: number;
  /** Custom allocation function */
  customAllocator?: (
    cost: FeatureCostEntry,
    context: AllocationContext,
  ) => AllocationResult[];
  /** Business value multiplier */
  businessValueMultiplier?: number;
  /** Description of the rule */
  description?: string;
}

/**
 * Allocation context for cost distribution
 */
export interface AllocationContext {
  /** Time period for allocation */
  timePeriod: {
    start: string;
    end: string;
  };
  /** Total cost to allocate */
  totalCost: number;
  /** Available allocation targets */
  targets: AllocationTarget[];
  /** Historical allocation data */
  historicalData: HistoricalAllocation[];
  /** Business priorities */
  businessPriorities: Record<string, number>;
  /** Budget constraints */
  budgetConstraints: Record<string, number>;
}

/**
 * Cost allocation target (e.g., department, project, user)
 */
export interface AllocationTarget {
  /** Target identifier */
  id: string;
  /** Target name */
  name: string;
  /** Target type (department, project, user, feature) */
  type: &apos;department&apos; | &apos;project&apos; | &apos;user&apos; | &apos;feature&apos; | &apos;team&apos; | 'service&apos;;
  /** Business priority score */
  priority: number;
  /** Current budget allocation */
  budgetAllocation: number;
  /** Historical usage patterns */
  usagePatterns: UsagePattern[];
  /** Cost center information */
  costCenter?: string;
  /** Manager/owner information */
  owner?: string;
  /** Active status */
  active: boolean;
}

/**
 * Usage pattern for allocation calculations
 */
export interface UsagePattern {
  /** Pattern type */
  type: &apos;hourly&apos; | &apos;daily&apos; | &apos;weekly&apos; | &apos;monthly&apos; | 'seasonal&apos;;
  /** Usage coefficient */
  coefficient: number;
  /** Peak usage hours/periods */
  peakPeriods: string[];
  /** Usage trend */
  trend: &apos;increasing&apos; | &apos;decreasing&apos; | 'stable&apos;;
}

/**
 * Cost allocation result
 */
export interface AllocationResult {
  /** Target receiving the allocation */
  target: AllocationTarget;
  /** Allocated cost amount */
  allocatedCost: number;
  /** Allocation percentage */
  allocationPercentage: number;
  /** Allocation method used */
  method: CostAllocationMethod;
  /** Rule that triggered this allocation */
  ruleId: string;
  /** Confidence score (0-1) */
  confidence: number;
  /** Justification for the allocation */
  justification: string;
  /** Supporting metrics */
  metrics: AllocationMetrics;
}

/**
 * Allocation metrics for transparency
 */
export interface AllocationMetrics {
  /** Usage-based metrics */
  usage: {
    requestCount: number;
    tokenUsage: number;
    uniqueUsers: number;
    sessionCount: number;
  };
  /** Value-based metrics */
  value: {
    businessValue: number;
    roi: number;
    strategicImportance: number;
  };
  /** Cost-based metrics */
  cost: {
    historicalSpend: number;
    budgetUtilization: number;
    costPerUnit: number;
  };
}

/**
 * Historical allocation data for trend analysis
 */
export interface HistoricalAllocation {
  /** Date of allocation */
  date: string;
  /** Target that received allocation */
  targetId: string;
  /** Amount allocated */
  amount: number;
  /** Method used */
  method: CostAllocationMethod;
  /** Performance metrics */
  performance: {
    actualUsage: number;
    efficiency: number;
    wastage: number;
  };
}

/**
 * Cost allocation configuration
 */
export interface CostAllocationConfig {
  /** Data storage directory */
  dataDir: string;
  /** Enable detailed logging */
  enableLogging: boolean;
  /** Default allocation method */
  defaultMethod: CostAllocationMethod;
  /** Allocation rules */
  rules: CostAllocationRule[];
  /** Reallocation frequency in hours */
  reallocationFrequency: number;
  /** Enable automatic reallocation */
  enableAutoReallocation: boolean;
}

/**
 * Advanced cost allocation and distribution system
 *
 * Provides intelligent cost distribution across organizational units,
 * projects, users, and features using configurable allocation methods
 * and business rules.
 */
export class CostAllocationManager {
  private config: CostAllocationConfig;
  private targetsFile: string;
  private rulesFile: string;
  private historicalFile: string;

  constructor(config: CostAllocationConfig) {
    this.config = {
      defaultMethod: &apos;proportional&apos;,
      reallocationFrequency: 24, // 24 hours
      enableAutoReallocation: true,
      ...config,
    };
    this.targetsFile = path.join(
      this.config.dataDir,
      &apos;allocation-_targets.json&apos;,
    );
    this.rulesFile = path.join(this.config.dataDir, &apos;allocation-rules.json&apos;);
    this.historicalFile = path.join(
      this.config.dataDir,
      &apos;allocation-history.jsonl&apos;,
    );
  }

  /**
   * Allocate costs based on configured rules and methods
   */
  async allocateCosts(
    costs: FeatureCostEntry[],
    timePeriod: { start: string; end: string },
  ): Promise<AllocationResult[]> {
    const logger = this.getLogger();
    logger.info(
      &apos;CostAllocationManager.allocateCosts - Starting cost allocation&apos;,
      {
        costsCount: costs.length,
        timePeriod,
      },
    );

    try {
      // Load allocation targets and rules
      const _targets = await this.loadAllocationTargets();
      const rules = await this.loadAllocationRules();
      const historicalData = await this.loadHistoricalAllocations(timePeriod);

      const totalCost = costs.reduce((sum, cost) => sum + cost.cost, 0);

      const context: AllocationContext = {
        timePeriod,
        totalCost,
        targets: targets.filter((t) => t.active),
        historicalData,
        businessPriorities: this.calculateBusinessPriorities(_targets),
        budgetConstraints: this.calculateBudgetConstraints(_targets),
      };

      // Group costs by allocation criteria
      const costGroups = this.groupCostsByAllocationCriteria(costs);
      const allocationResults: AllocationResult[] = [];

      // Process each cost group
      for (const [_groupKey, groupCosts] of costGroups) {
        const groupTotal = groupCosts.reduce((sum, cost) => sum + cost.cost, 0);

        // Apply allocation rules
        const groupAllocations = await this.applyAllocationRules(
          groupCosts,
          groupTotal,
          context,
          rules,
        );

        allocationResults.push(...groupAllocations);
      }

      // Normalize allocations to ensure they sum to total cost
      const normalizedResults = this.normalizeAllocations(
        allocationResults,
        totalCost,
      );

      // Record historical allocation data
      await this.recordHistoricalAllocations(normalizedResults, timePeriod);

      logger.info(
        &apos;CostAllocationManager.allocateCosts - Cost allocation completed&apos;,
        {
          totalCost,
          allocationsCount: normalizedResults.length,
          uniqueTargets: new Set(normalizedResults.map((r) => r.target.id))
            .size,
        },
      );

      return normalizedResults;
    } catch (_error) {
      logger.error(
        &apos;CostAllocationManager.allocateCosts - Cost allocation failed&apos;,
        {
          _error: error instanceof Error ? error.message : String(_error),
        },
      );
      throw error;
    }
  }

  /**
   * Reallocate costs based on updated usage patterns
   */
  async reallocateCosts(
    _currentAllocations: AllocationResult[],
    newUsageData: FeatureCostEntry[],
  ): Promise<AllocationResult[]> {
    const logger = this.getLogger();
    logger.info(
      &apos;CostAllocationManager.reallocateCosts - Starting cost reallocation&apos;,
      {
        currentAllocationsCount: _currentAllocations.length,
        newUsageDataCount: newUsageData.length,
      },
    );

    try {
      // Analyze usage changes
      const usageChanges = await this.analyzeUsageChanges(
        _currentAllocations,
        newUsageData,
      );

      // Determine reallocation needs
      const reallocationNeeded = usageChanges.some(
        (change) => Math.abs(change.changePercentage) > 10, // 10% threshold
      );

      if (!reallocationNeeded) {
        logger.info(
          &apos;CostAllocationManager.reallocateCosts - No significant usage changes detected&apos;,
        );
        return currentAllocations;
      }

      // Perform reallocation
      const timePeriod = {
        start: new Date().toISOString(),
        end: new Date().toISOString(),
      };

      const newAllocations = await this.allocateCosts(_newUsageData, timePeriod);

      logger.info(
        &apos;CostAllocationManager.reallocateCosts - Cost reallocation completed&apos;,
        {
          significantChanges: usageChanges.filter(
            (c) => Math.abs(c.changePercentage) > 10,
          ).length,
        },
      );

      return newAllocations;
    } catch (_error) {
      logger.error(
        &apos;CostAllocationManager.reallocateCosts - Cost reallocation failed&apos;,
        {
          _error: error instanceof Error ? error.message : String(_error),
        },
      );
      throw error;
    }
  }

  /**
   * Generate allocation recommendations based on analysis
   */
  async generateAllocationRecommendations(
    costs: FeatureCostEntry[],
    _currentAllocations: AllocationResult[],
  ): Promise<{
    recommendations: AllocationRecommendation[];
    projectedSavings: number;
    confidence: number;
  }> {
    const logger = this.getLogger();
    logger.info(
      &apos;CostAllocationManager.generateAllocationRecommendations - Generating recommendations&apos;,
    );

    try {
      const recommendations: AllocationRecommendation[] = [];

      // Analyze allocation efficiency
      const efficiencyAnalysis =
        await this.analyzeAllocationEfficiency(_currentAllocations);

      // Generate efficiency-based recommendations
      for (const inefficiency of efficiencyAnalysis.inefficiencies) {
        if (inefficiency.severity > 0.2) {
          // 20% inefficiency threshold
          recommendations.push({
            type: &apos;reallocation&apos;,
            priority: this.calculateRecommendationPriority(
              inefficiency.severity,
            ),
            description: `Reallocate ${inefficiency.wastedAmount.toFixed(2)} from ${inefficiency.target} to more efficient targets`,
            expectedSaving: inefficiency.wastedAmount,
            confidence: inefficiency.confidence,
            implementation: &apos;automatic&apos;,
            impact: inefficiency.severity > 0.5 ? &apos;high&apos; : &apos;medium&apos;,
          });
        }
      }

      // Analyze underutilized targets
      const underutilized = currentAllocations.filter(
        (a) => a.metrics.cost.budgetUtilization < 0.7, // Less than 70% utilization
      );

      for (const target of underutilized) {
        const unusedBudget =
          target.target.budgetAllocation - target.allocatedCost;
        if (unusedBudget > 10) {
          // $10 threshold
          recommendations.push({
            type: &apos;budget_reduction&apos;,
            priority: &apos;medium&apos;,
            description: `Consider reducing budget allocation for ${target.target.name} by $${unusedBudget.toFixed(2)}`,
            expectedSaving: unusedBudget,
            confidence: 0.8,
            implementation: &apos;manual&apos;,
            impact: &apos;low&apos;,
          });
        }
      }

      // Calculate projected savings
      const projectedSavings = recommendations.reduce(
        (sum, rec) => sum + rec.expectedSaving,
        0,
      );
      const avgConfidence =
        recommendations.reduce((sum, rec) => sum + rec.confidence, 0) /
        recommendations.length;

      logger.info(
        &apos;CostAllocationManager.generateAllocationRecommendations - Recommendations generated&apos;,
        {
          recommendationCount: recommendations.length,
          projectedSavings,
          avgConfidence,
        },
      );

      return {
        recommendations,
        projectedSavings,
        confidence: avgConfidence || 0,
      };
    } catch (_error) {
      logger.error(
        &apos;CostAllocationManager.generateAllocationRecommendations - Failed to generate recommendations&apos;,
        {
          _error: error instanceof Error ? error.message : String(_error),
        },
      );
      throw error;
    }
  }

  /**
   * Apply allocation rules to cost groups
   */
  private async applyAllocationRules(
    costs: FeatureCostEntry[],
    totalCost: number,
    context: AllocationContext,
    rules: CostAllocationRule[],
  ): Promise<AllocationResult[]> {
    const sortedRules = rules.sort((a, b) => b.priority - a.priority);
    const results: AllocationResult[] = [];

    for (const cost of costs) {
      let allocated = false;

      // Try each rule in priority order
      for (const rule of sortedRules) {
        if (rule.condition(cost)) {
          const ruleResults = await this.applyAllocationRule(
            cost,
            rule,
            context,
          );
          results.push(...ruleResults);
          allocated = true;
          break;
        }
      }

      // Use default method if no rule matched
      if (!allocated) {
        const defaultResults = await this.applyDefaultAllocation(cost, context);
        results.push(...defaultResults);
      }
    }

    return results;
  }

  /**
   * Apply a specific allocation rule
   */
  private async applyAllocationRule(
    cost: FeatureCostEntry,
    rule: CostAllocationRule,
    context: AllocationContext,
  ): Promise<AllocationResult[]> {
    switch (rule.method) {
      case &apos;equal&apos;:
        return this.allocateEqually(cost, context, rule);
      case &apos;proportional&apos;:
        return this.allocateProportionally(cost, context, rule);
      case &apos;usage_based&apos;:
        return this.allocateBasedOnUsage(cost, context, rule);
      case &apos;value_based&apos;:
        return this.allocateBasedOnValue(cost, context, rule);
      case &apos;custom&apos;:
        return rule.customAllocator!(cost, context);
      case &apos;activity_based&apos;:
        return this.allocateBasedOnActivity(cost, context, rule);
      case &apos;weighted&apos;:
        return this.allocateWeighted(cost, context, rule);
      case &apos;hybrid&apos;:
        return this.allocateHybrid(cost, context, rule);
      default:
        return this.allocateProportionally(cost, context, rule);
    }
  }

  /**
   * Equal cost allocation across all targets
   */
  private allocateEqually(
    cost: FeatureCostEntry,
    context: AllocationContext,
    rule: CostAllocationRule,
  ): AllocationResult[] {
    const activeTargets = context.targets.filter((t) => t.active);
    const costPerTarget = cost.cost / activeTargets.length;

    return activeTargets.map((target) => ({
      target,
      allocatedCost: costPerTarget,
      allocationPercentage: (costPerTarget / cost.cost) * 100,
      method: &apos;equal&apos;,
      ruleId: rule.id,
      confidence: 0.7,
      justification: `Equal distribution across ${activeTargets.length} targets`,
      metrics: this.generateAllocationMetrics(cost, target),
    }));
  }

  /**
   * Proportional cost allocation based on budget allocations
   */
  private allocateProportionally(
    cost: FeatureCostEntry,
    context: AllocationContext,
    rule: CostAllocationRule,
  ): AllocationResult[] {
    const totalBudget = context.targets.reduce(
      (sum, t) => sum + t.budgetAllocation,
      0,
    );

    return context.targets.map((target) => {
      const proportion =
        totalBudget > 0 ? target.budgetAllocation / totalBudget : 0;
      const allocatedCost = cost.cost * proportion;

      return {
        target,
        allocatedCost,
        allocationPercentage: proportion * 100,
        method: &apos;proportional&apos;,
        ruleId: rule.id,
        confidence: 0.8,
        justification: `Proportional to budget allocation (${(proportion * 100).toFixed(1)}%)`,
        metrics: this.generateAllocationMetrics(cost, target),
      };
    });
  }

  /**
   * Usage-based cost allocation
   */
  private allocateBasedOnUsage(
    cost: FeatureCostEntry,
    context: AllocationContext,
    rule: CostAllocationRule,
  ): AllocationResult[] {
    // This would require usage tracking per target
    // For now, use proportional allocation with usage weighting
    return this.allocateProportionally(cost, context, rule);
  }

  /**
   * Value-based cost allocation
   */
  private allocateBasedOnValue(
    cost: FeatureCostEntry,
    context: AllocationContext,
    rule: CostAllocationRule,
  ): AllocationResult[] {
    const totalPriority = context.targets.reduce(
      (sum, t) => sum + t.priority,
      0,
    );

    return context.targets.map((target) => {
      const valueWeight =
        totalPriority > 0 ? target.priority / totalPriority : 0;
      const allocatedCost = cost.cost * valueWeight;

      return {
        target,
        allocatedCost,
        allocationPercentage: valueWeight * 100,
        method: &apos;value_based&apos;,
        ruleId: rule.id,
        confidence: 0.75,
        justification: `Value-based allocation by business priority (${(valueWeight * 100).toFixed(1)}%)`,
        metrics: this.generateAllocationMetrics(cost, target),
      };
    });
  }

  /**
   * Activity-based cost allocation
   */
  private allocateBasedOnActivity(
    cost: FeatureCostEntry,
    context: AllocationContext,
    rule: CostAllocationRule,
  ): AllocationResult[] {
    // Activity-based costing would require detailed activity tracking
    // For now, use a combination of usage and value metrics
    return this.allocateHybrid(cost, context, rule);
  }

  /**
   * Weighted cost allocation
   */
  private allocateWeighted(
    cost: FeatureCostEntry,
    context: AllocationContext,
    rule: CostAllocationRule,
  ): AllocationResult[] {
    const weight = rule.weight || 1.0;
    const results = this.allocateProportionally(cost, context, rule);

    // Apply weight to the proportional allocation
    return results.map((result) => ({
      ...result,
      allocatedCost: result.allocatedCost * weight,
      method: &apos;weighted&apos;,
      justification: `Weighted allocation (weight: ${weight})`,
    }));
  }

  /**
   * Hybrid allocation combining multiple methods
   */
  private allocateHybrid(
    cost: FeatureCostEntry,
    context: AllocationContext,
    rule: CostAllocationRule,
  ): AllocationResult[] {
    // Combine proportional (50%) and value-based (50%) allocation
    const proportionalResults = this.allocateProportionally(
      cost,
      context,
      rule,
    );
    const valueResults = this.allocateBasedOnValue(cost, context, rule);

    return proportionalResults.map((propResult, _index) => {
      const valueResult = valueResults[index];
      const hybridCost =
        propResult.allocatedCost * 0.5 + valueResult.allocatedCost * 0.5;

      return {
        ...propResult,
        allocatedCost: hybridCost,
        allocationPercentage: (hybridCost / cost.cost) * 100,
        method: &apos;hybrid&apos;,
        justification: &apos;Hybrid allocation (50% proportional, 50% value-based)&apos;,
        confidence: 0.85,
      };
    });
  }

  /**
   * Apply default allocation method
   */
  private async applyDefaultAllocation(
    cost: FeatureCostEntry,
    context: AllocationContext,
  ): Promise<AllocationResult[]> {
    const defaultRule: CostAllocationRule = {
      id: &apos;default&apos;,
      name: &apos;Default Allocation&apos;,
      method: this.config.defaultMethod,
      priority: 0,
      condition: () => true,
    };

    return this.applyAllocationRule(cost, defaultRule, context);
  }

  /**
   * Generate allocation metrics
   */
  private generateAllocationMetrics(
    cost: FeatureCostEntry,
    target: AllocationTarget,
  ): AllocationMetrics {
    return {
      usage: {
        requestCount: 1, // This cost entry represents 1 request
        tokenUsage: cost.tokens || 0,
        uniqueUsers: 1,
        sessionCount: 1,
      },
      value: {
        businessValue: target.priority,
        roi: 0, // Would need business value calculation
        strategicImportance: target.priority / 100,
      },
      cost: {
        historicalSpend: 0, // Would need historical data
        budgetUtilization: 0, // Would need current usage data
        costPerUnit: cost.cost,
      },
    };
  }

  /**
   * Normalize allocations to ensure they sum to total cost
   */
  private normalizeAllocations(
    allocations: AllocationResult[],
    totalCost: number,
  ): AllocationResult[] {
    const allocatedTotal = allocations.reduce(
      (sum, alloc) => sum + alloc.allocatedCost,
      0,
    );

    if (Math.abs(allocatedTotal - totalCost) < 0.01) {
      return allocations; // Already normalized
    }

    const normalizationFactor = totalCost / allocatedTotal;

    return allocations.map((allocation) => ({
      ...allocation,
      allocatedCost: allocation.allocatedCost * normalizationFactor,
      allocationPercentage:
        allocation.allocationPercentage * normalizationFactor,
    }));
  }

  /**
   * Group costs by allocation criteria
   */
  private groupCostsByAllocationCriteria(
    costs: FeatureCostEntry[],
  ): Map<string, FeatureCostEntry[]> {
    const groups = new Map<string, FeatureCostEntry[]>();

    for (const cost of costs) {
      // Group by feature for now, could be more sophisticated
      const key = cost.featureId || &apos;unclassified&apos;;

      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(cost);
    }

    return groups;
  }

  /**
   * Load allocation targets from storage
   */
  private async loadAllocationTargets(): Promise<AllocationTarget[]> {
    try {
      const content = await fs.readFile(this.targetsFile, &apos;utf-8&apos;);
      return JSON.parse(content);
    } catch (_error) {
      return this.getDefaultAllocationTargets();
    }
  }

  /**
   * Load allocation rules from storage
   */
  private async loadAllocationRules(): Promise<CostAllocationRule[]> {
    try {
      const content = await fs.readFile(this.rulesFile, &apos;utf-8&apos;);
      const rulesData = JSON.parse(content);

      // Convert serialized functions back to functions
      return rulesData.map((rule: unknown) => ({
        ...rule,
        condition: new Function(&apos;entry&apos;, rule.conditionCode || &apos;return true&apos;),
        customAllocator: rule.customAllocatorCode
          ? new Function(&apos;cost&apos;, &apos;context&apos;, rule.customAllocatorCode)
          : undefined,
      }));
    } catch (_error) {
      return this.getDefaultAllocationRules();
    }
  }

  /**
   * Load historical allocation data
   */
  private async loadHistoricalAllocations(timePeriod: {
    start: string;
    end: string;
  }): Promise<HistoricalAllocation[]> {
    try {
      const content = await fs.readFile(this.historicalFile, &apos;utf-8&apos;);
      const lines = content.trim().split(&apos;\n&apos;);

      const historicalData: HistoricalAllocation[] = [];
      for (const line of lines) {
        try {
          const allocation: HistoricalAllocation = JSON.parse(line);
          const allocationDate = new Date(allocation.date);
          const startDate = new Date(timePeriod.start);
          const endDate = new Date(timePeriod.end);

          if (allocationDate >= startDate && allocationDate <= endDate) {
            historicalData.push(allocation);
          }
        } catch {
          continue;
        }
      }

      return historicalData;
    } catch (_error) {
      return [];
    }
  }

  /**
   * Record historical allocation data
   */
  private async recordHistoricalAllocations(
    allocations: AllocationResult[],
    timePeriod: { start: string; end: string },
  ): Promise<void> {
    try {
      await fs.mkdir(path.dirname(this.historicalFile), { recursive: true });

      const historicalEntries = allocations.map((allocation) => ({
        date: timePeriod.start,
        targetId: allocation.target.id,
        amount: allocation.allocatedCost,
        method: allocation.method,
        performance: {
          actualUsage: allocation.allocatedCost, // Placeholder
          efficiency: allocation.confidence,
          wastage: 0, // Would need actual usage tracking
        },
      }));

      const lines =
        historicalEntries.map((entry) => JSON.stringify(entry)).join(&apos;\n&apos;) +
        &apos;\n&apos;;
      await fs.appendFile(this.historicalFile, lines);
    } catch (_error) {
      this.getLogger().error(&apos;Failed to record historical allocations&apos;, {
        _error: error instanceof Error ? error.message : String(_error),
      });
    }
  }

  /**
   * Get default allocation targets
   */
  private getDefaultAllocationTargets(): AllocationTarget[] {
    return [
      {
        id: &apos;development&apos;,
        name: &apos;Development Team&apos;,
        type: &apos;team&apos;,
        priority: 90,
        budgetAllocation: 5000,
        usagePatterns: [],
        active: true,
      },
      {
        id: &apos;qa&apos;,
        name: &apos;Quality Assurance&apos;,
        type: &apos;team&apos;,
        priority: 70,
        budgetAllocation: 2000,
        usagePatterns: [],
        active: true,
      },
      {
        id: &apos;research&apos;,
        name: &apos;Research & Development&apos;,
        type: &apos;department&apos;,
        priority: 95,
        budgetAllocation: 3000,
        usagePatterns: [],
        active: true,
      },
    ];
  }

  /**
   * Get default allocation rules
   */
  private getDefaultAllocationRules(): CostAllocationRule[] {
    return [
      {
        id: &apos;high-priority&apos;,
        name: &apos;High Priority Features&apos;,
        method: &apos;value_based&apos;,
        priority: 100,
        condition: (cost) => cost.featureId?.includes(&apos;critical&apos;) || false,
        description:
          &apos;Allocate high-priority feature costs based on business value&apos;,
      },
      {
        id: &apos;development-features&apos;,
        name: &apos;Development Features&apos;,
        method: &apos;proportional&apos;,
        priority: 80,
        condition: (cost) => cost.operationType?.includes(&apos;code&apos;) || false,
        description: &apos;Allocate development-related costs proportionally&apos;,
      },
      {
        id: &apos;default&apos;,
        name: &apos;Default Allocation&apos;,
        method: &apos;equal&apos;,
        priority: 0,
        condition: () => true,
        description: &apos;Default equal allocation for all other costs&apos;,
      },
    ];
  }

  /**
   * Calculate business priorities
   */
  private calculateBusinessPriorities(
    _targets: AllocationTarget[],
  ): Record<string, number> {
    const priorities: Record<string, number> = {};
    for (const target of _targets) {
      priorities[target.id] = target.priority;
    }
    return priorities;
  }

  /**
   * Calculate budget constraints
   */
  private calculateBudgetConstraints(
    _targets: AllocationTarget[],
  ): Record<string, number> {
    const constraints: Record<string, number> = {};
    for (const target of _targets) {
      constraints[target.id] = target.budgetAllocation;
    }
    return constraints;
  }

  /**
   * Analyze usage changes for reallocation
   */
  private async analyzeUsageChanges(
    _currentAllocations: AllocationResult[],
    newUsageData: FeatureCostEntry[],
  ): Promise<
    Array<{ targetId: string; changePercentage: number; reason: string }>
  > {
    // Placeholder implementation - would need actual usage tracking
    return [];
  }

  /**
   * Analyze allocation efficiency
   */
  private async analyzeAllocationEfficiency(
    allocations: AllocationResult[],
  ): Promise<{
    overallEfficiency: number;
    inefficiencies: Array<{
      target: string;
      severity: number;
      wastedAmount: number;
      confidence: number;
    }>;
  }> {
    const inefficiencies = allocations
      .filter((alloc) => alloc.confidence < 0.7)
      .map((alloc) => ({
        target: alloc.target.name,
        severity: 1 - alloc.confidence,
        wastedAmount: alloc.allocatedCost * (1 - alloc.confidence),
        confidence: alloc.confidence,
      }));

    const totalCost = allocations.reduce(
      (sum, alloc) => sum + alloc.allocatedCost,
      0,
    );
    const wastedCost = inefficiencies.reduce(
      (sum, ineff) => sum + ineff.wastedAmount,
      0,
    );
    const overallEfficiency = totalCost > 0 ? 1 - wastedCost / totalCost : 1;

    return { overallEfficiency, inefficiencies };
  }

  /**
   * Calculate recommendation priority
   */
  private calculateRecommendationPriority(
    severity: number,
  ): &apos;low&apos; | &apos;medium&apos; | &apos;high&apos; {
    if (severity > 0.5) return &apos;high&apos;;
    if (severity > 0.2) return &apos;medium&apos;;
    return &apos;low&apos;;
  }

  /**
   * Get logger instance
   */
  private getLogger() {
    return {
      info: (message: string, meta?: Record<string, unknown>) => {
        if (this.config.enableLogging) {
          console.log(`[INFO] ${message}`, meta ? JSON.stringify(meta) : &apos;');
        }
      },
      warn: (message: string, meta?: Record<string, unknown>) => {
        if (this.config.enableLogging) {
          console.warn(`[WARN] ${message}`, meta ? JSON.stringify(meta) : &apos;');
        }
      },
      error: (message: string, meta?: Record<string, unknown>) => {
        console.error(`[ERROR] ${message}`, meta ? JSON.stringify(meta) : &apos;');
      },
    };
  }
}

/**
 * Allocation recommendation interface
 */
export interface AllocationRecommendation {
  /** Recommendation type */
  type: &apos;reallocation&apos; | &apos;budget_increase&apos; | &apos;budget_reduction&apos; | &apos;rule_change&apos;;
  /** Priority level */
  priority: &apos;low&apos; | &apos;medium&apos; | &apos;high&apos;;
  /** Recommendation description */
  description: string;
  /** Expected cost saving */
  expectedSaving: number;
  /** Confidence in the recommendation */
  confidence: number;
  /** Implementation type */
  implementation: &apos;automatic&apos; | &apos;manual&apos;;
  /** Expected impact */
  impact: &apos;low&apos; | &apos;medium&apos; | &apos;high&apos;;
}

/**
 * Create a new CostAllocationManager instance
 */
export function createCostAllocationManager(
  config: CostAllocationConfig,
): CostAllocationManager {
  return new CostAllocationManager(config);
}
