/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as fs from &apos;node:fs/promises&apos;;
import * as path from &apos;node:path&apos;;

/**
 * Feature cost tracking entry
 */
export interface FeatureCostEntry {
  /** Unique identifier for the feature */
  featureId: string;
  /** Human-readable feature name */
  featureName: string;
  /** Operation type (e.g., &apos;chat&apos;, &apos;code-generation&apos;, &apos;analysis&apos;) */
  operationType: string;
  /** Timestamp of the cost entry */
  timestamp: string;
  /** Cost in USD for this operation */
  cost: number;
  /** Number of tokens consumed */
  tokens: number;
  /** User identifier */
  userId?: string;
  /** Project identifier */
  projectId?: string;
  /** Session identifier */
  sessionId?: string;
  /** Model used for the operation */
  model?: string;
  /** Response time in milliseconds */
  responseTime?: number;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Feature cost attribution configuration
 */
export interface FeatureCostConfig {
  /** Data storage directory */
  dataDir: string;
  /** Enable detailed logging */
  enableLogging: boolean;
  /** Cost attribution rules */
  attributionRules: CostAttributionRule[];
  /** Batch size for processing entries */
  batchSize: number;
  /** Retention period in days */
  retentionDays: number;
}

/**
 * Cost attribution rule for automatic cost assignment
 */
export interface CostAttributionRule {
  /** Rule identifier */
  id: string;
  /** Rule name */
  name: string;
  /** Condition to match */
  condition: (entry: Partial<FeatureCostEntry>) => boolean;
  /** Feature ID to assign if condition matches */
  featureId: string;
  /** Feature name to assign if condition matches */
  featureName: string;
  /** Priority for rule application (higher = more priority) */
  priority: number;
}

/**
 * Feature cost aggregation result
 */
export interface FeatureCostAggregation {
  /** Feature identifier */
  featureId: string;
  /** Feature name */
  featureName: string;
  /** Total cost for the feature */
  totalCost: number;
  /** Total number of operations */
  operationCount: number;
  /** Total tokens consumed */
  totalTokens: number;
  /** Average cost per operation */
  avgCostPerOperation: number;
  /** Average tokens per operation */
  avgTokensPerOperation: number;
  /** Cost breakdown by operation type */
  operationBreakdown: Record<
    string,
    {
      cost: number;
      count: number;
      tokens: number;
    }
  >;
  /** Time period for this aggregation */
  timePeriod: {
    start: string;
    end: string;
  };
}

/**
 * Feature-level cost tracking and attribution system
 *
 * Provides detailed cost tracking per feature with automatic attribution
 * based on configurable rules and comprehensive analytics.
 */
export class FeatureCostTracker {
  private config: FeatureCostConfig;
  private costEntriesFile: string;
  private rulesFile: string;

  constructor(config: FeatureCostConfig) {
    this.config = {
      batchSize: 100,
      retentionDays: 90,
      ...config,
    };
    this.costEntriesFile = path.join(
      this.config.dataDir,
      &apos;feature-costs.jsonl&apos;,
    );
    this.rulesFile = path.join(this.config.dataDir, &apos;attribution-rules.json&apos;);
  }

  /**
   * Record a cost entry for a specific feature operation
   */
  async recordCost(entry: FeatureCostEntry): Promise<void> {
    const logger = this.getLogger();
    logger.info(&apos;FeatureCostTracker.recordCost - Recording cost entry&apos;, {
      featureId: entry.featureId,
      cost: entry.cost,
      tokens: entry.tokens,
      operationType: entry.operationType,
    });

    try {
      // Apply cost attribution rules if feature is not already assigned
      if (!entry.featureId || entry.featureId === &apos;unknown&apos;) {
        const attributedEntry = await this.applyAttributionRules(entry);
        Object.assign(entry, attributedEntry);
      }

      // Ensure data directory exists
      await fs.mkdir(this.config.dataDir, { recursive: true });

      // Append entry to JSONL file
      const entryLine =
        JSON.stringify({
          ...entry,
          timestamp: entry.timestamp || new Date().toISOString(),
        }) + &apos;\n&apos;;

      await fs.appendFile(this.costEntriesFile, entryLine);

      logger.info(
        &apos;FeatureCostTracker.recordCost - Cost entry recorded successfully&apos;,
        {
          featureId: entry.featureId,
          timestamp: entry.timestamp,
        },
      );
    } catch (_error) {
      logger.error(
        &apos;FeatureCostTracker.recordCost - Failed to record cost entry&apos;,
        {
          _error: error instanceof Error ? error.message : String(_error),
          featureId: entry.featureId,
        },
      );
      throw error;
    }
  }

  /**
   * Apply cost attribution rules to determine feature assignment
   */
  private async applyAttributionRules(
    entry: Partial<FeatureCostEntry>,
  ): Promise<Partial<FeatureCostEntry>> {
    const logger = this.getLogger();
    logger.info(
      &apos;FeatureCostTracker.applyAttributionRules - Applying attribution rules&apos;,
      {
        operationType: entry.operationType,
        userId: entry.userId,
      },
    );

    try {
      const rules = await this.loadAttributionRules();

      // Sort rules by priority (highest first)
      const sortedRules = rules.sort((a, b) => b.priority - a.priority);

      for (const rule of sortedRules) {
        if (rule.condition(entry)) {
          logger.info(
            &apos;FeatureCostTracker.applyAttributionRules - Rule matched&apos;,
            {
              ruleId: rule.id,
              ruleName: rule.name,
              assignedFeatureId: rule.featureId,
            },
          );

          return {
            ...entry,
            featureId: rule.featureId,
            featureName: rule.featureName,
          };
        }
      }

      // No rule matched, use default
      logger.warn(
        &apos;FeatureCostTracker.applyAttributionRules - No rules matched, using default&apos;,
        {
          operationType: entry.operationType,
        },
      );

      return {
        ...entry,
        featureId: &apos;unclassified&apos;,
        featureName: &apos;Unclassified Operations&apos;,
      };
    } catch (_error) {
      logger.error(
        &apos;FeatureCostTracker.applyAttributionRules - Failed to apply attribution rules&apos;,
        {
          _error: error instanceof Error ? error.message : String(_error),
        },
      );
      throw error;
    }
  }

  /**
   * Load cost attribution rules from storage
   */
  private async loadAttributionRules(): Promise<CostAttributionRule[]> {
    try {
      const rulesContent = await fs.readFile(this.rulesFile, &apos;utf-8&apos;);
      return JSON.parse(rulesContent);
    } catch (_error) {
      // Return default rules if file doesn&apos;t exist
      return this.getDefaultAttributionRules();
    }
  }

  /**
   * Get default cost attribution rules
   */
  private getDefaultAttributionRules(): CostAttributionRule[] {
    return [
      {
        id: &apos;code-generation&apos;,
        name: &apos;Code Generation&apos;,
        condition: (entry) =>
          entry.operationType?.includes(&apos;code&apos;) ||
          entry.operationType?.includes(&apos;generation&apos;),
        featureId: &apos;code-gen&apos;,
        featureName: &apos;Code Generation&apos;,
        priority: 100,
      },
      {
        id: &apos;chat-assistance&apos;,
        name: &apos;Chat Assistance&apos;,
        condition: (entry) =>
          entry.operationType?.includes(&apos;chat&apos;) ||
          entry.operationType?.includes(&apos;conversation&apos;),
        featureId: &apos;chat&apos;,
        featureName: &apos;Chat Assistance&apos;,
        priority: 90,
      },
      {
        id: &apos;code-analysis&apos;,
        name: &apos;Code Analysis&apos;,
        condition: (entry) =>
          entry.operationType?.includes(&apos;analysis&apos;) ||
          entry.operationType?.includes(&apos;review&apos;),
        featureId: &apos;analysis&apos;,
        featureName: &apos;Code Analysis&apos;,
        priority: 85,
      },
      {
        id: &apos;documentation&apos;,
        name: &apos;Documentation&apos;,
        condition: (entry) =>
          entry.operationType?.includes(&apos;docs&apos;) ||
          entry.operationType?.includes(&apos;documentation&apos;),
        featureId: &apos;docs&apos;,
        featureName: &apos;Documentation&apos;,
        priority: 80,
      },
    ];
  }

  /**
   * Get feature cost aggregation for a specific time period
   */
  async getFeatureCostAggregation(
    startDate: Date,
    endDate: Date,
    featureId?: string,
  ): Promise<FeatureCostAggregation[]> {
    const logger = this.getLogger();
    logger.info(
      &apos;FeatureCostTracker.getFeatureCostAggregation - Getting cost aggregation&apos;,
      {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        featureId,
      },
    );

    try {
      const entries = await this.loadCostEntries(startDate, endDate, featureId);
      const aggregations = new Map<string, FeatureCostAggregation>();

      for (const entry of entries) {
        const key = entry.featureId;
        let aggregation = aggregations.get(key);

        if (!aggregation) {
          aggregation = {
            featureId: entry.featureId,
            featureName: entry.featureName,
            totalCost: 0,
            operationCount: 0,
            totalTokens: 0,
            avgCostPerOperation: 0,
            avgTokensPerOperation: 0,
            operationBreakdown: {},
            timePeriod: {
              start: startDate.toISOString(),
              end: endDate.toISOString(),
            },
          };
          aggregations.set(key, aggregation);
        }

        // Update aggregation
        aggregation.totalCost += entry.cost;
        aggregation.operationCount += 1;
        aggregation.totalTokens += entry.tokens || 0;

        // Update operation breakdown
        if (!aggregation.operationBreakdown[entry.operationType]) {
          aggregation.operationBreakdown[entry.operationType] = {
            cost: 0,
            count: 0,
            tokens: 0,
          };
        }

        aggregation.operationBreakdown[entry.operationType].cost += entry.cost;
        aggregation.operationBreakdown[entry.operationType].count += 1;
        aggregation.operationBreakdown[entry.operationType].tokens +=
          entry.tokens || 0;
      }

      // Calculate averages
      for (const aggregation of aggregations.values()) {
        aggregation.avgCostPerOperation =
          aggregation.totalCost / aggregation.operationCount;
        aggregation.avgTokensPerOperation =
          aggregation.totalTokens / aggregation.operationCount;
      }

      const result = Array.from(aggregations.values());
      logger.info(
        &apos;FeatureCostTracker.getFeatureCostAggregation - Aggregation completed&apos;,
        {
          featureCount: result.length,
          totalCost: result.reduce((sum, agg) => sum + agg.totalCost, 0),
        },
      );

      return result;
    } catch (_error) {
      logger.error(
        &apos;FeatureCostTracker.getFeatureCostAggregation - Failed to get aggregation&apos;,
        {
          _error: error instanceof Error ? error.message : String(_error),
        },
      );
      throw error;
    }
  }

  /**
   * Load cost entries from storage within date range
   */
  private async loadCostEntries(
    startDate: Date,
    endDate: Date,
    featureId?: string,
  ): Promise<FeatureCostEntry[]> {
    try {
      const content = await fs.readFile(this.costEntriesFile, &apos;utf-8&apos;);
      const lines = content
        .trim()
        .split(&apos;\n&apos;)
        .filter((line) => line.length > 0);

      const entries: FeatureCostEntry[] = [];
      for (const line of lines) {
        try {
          const entry: FeatureCostEntry = JSON.parse(line);
          const entryDate = new Date(entry.timestamp);

          // Filter by date range
          if (entryDate >= startDate && entryDate <= endDate) {
            // Filter by feature ID if specified
            if (!featureId || entry.featureId === featureId) {
              entries.push(entry);
            }
          }
        } catch (_parseError) {
          // Skip invalid lines
          continue;
        }
      }

      return entries;
    } catch (_error) {
      if ((_error as NodeJS.ErrnoException).code === &apos;ENOENT&apos;) {
        return []; // File doesn&apos;t exist, return empty array
      }
      throw error;
    }
  }

  /**
   * Get top cost-driving features
   */
  async getTopCostFeatures(
    startDate: Date,
    endDate: Date,
    limit: number = 10,
  ): Promise<FeatureCostAggregation[]> {
    const aggregations = await this.getFeatureCostAggregation(
      startDate,
      endDate,
    );

    return aggregations
      .sort((a, b) => b.totalCost - a.totalCost)
      .slice(0, limit);
  }

  /**
   * Clean up old cost entries based on retention policy
   */
  async cleanupOldEntries(): Promise<void> {
    const logger = this.getLogger();
    logger.info(&apos;FeatureCostTracker.cleanupOldEntries - Starting cleanup&apos;, {
      retentionDays: this.config.retentionDays,
    });

    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.config.retentionDays);

      const content = await fs.readFile(this.costEntriesFile, &apos;utf-8&apos;);
      const lines = content.trim().split(&apos;\n&apos;);

      const validLines: string[] = [];
      let removedCount = 0;

      for (const line of lines) {
        try {
          const entry: FeatureCostEntry = JSON.parse(line);
          const entryDate = new Date(entry.timestamp);

          if (entryDate >= cutoffDate) {
            validLines.push(line);
          } else {
            removedCount++;
          }
        } catch {
          // Keep invalid lines as-is
          validLines.push(line);
        }
      }

      // Write back only valid entries
      await fs.writeFile(this.costEntriesFile, validLines.join(&apos;\n&apos;) + &apos;\n&apos;);

      logger.info(&apos;FeatureCostTracker.cleanupOldEntries - Cleanup completed&apos;, {
        removedCount,
        remainingCount: validLines.length,
      });
    } catch (_error) {
      logger.error(&apos;FeatureCostTracker.cleanupOldEntries - Cleanup failed&apos;, {
        _error: error instanceof Error ? error.message : String(_error),
      });
      throw error;
    }
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
 * Create a new FeatureCostTracker instance
 */
export function createFeatureCostTracker(
  config: FeatureCostConfig,
): FeatureCostTracker {
  return new FeatureCostTracker(config);
}
