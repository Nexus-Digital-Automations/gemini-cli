/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';

/**
 * Feature cost tracking entry
 */
export interface FeatureCostEntry {
  /** Unique identifier for the feature */
  featureId: string;
  /** Human-readable feature name */
  featureName: string;
  /** Operation type (e.g., 'chat', 'code-generation', 'analysis') */
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
  operationBreakdown: Record<string, {
    cost: number;
    count: number;
    tokens: number;
  }>;
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
    this.costEntriesFile = path.join(this.config.dataDir, 'feature-costs.jsonl');
    this.rulesFile = path.join(this.config.dataDir, 'attribution-rules.json');
  }

  /**
   * Record a cost entry for a specific feature operation
   */
  async recordCost(entry: FeatureCostEntry): Promise<void> {
    const logger = this.getLogger();
    logger.info('FeatureCostTracker.recordCost - Recording cost entry', {
      featureId: entry.featureId,
      cost: entry.cost,
      tokens: entry.tokens,
      operationType: entry.operationType,
    });

    try {
      // Apply cost attribution rules if feature is not already assigned
      if (!entry.featureId || entry.featureId === 'unknown') {
        const attributedEntry = await this.applyAttributionRules(entry);
        Object.assign(entry, attributedEntry);
      }

      // Ensure data directory exists
      await fs.mkdir(this.config.dataDir, { recursive: true });

      // Append entry to JSONL file
      const entryLine = JSON.stringify({
        ...entry,
        timestamp: entry.timestamp || new Date().toISOString(),
      }) + '\n';

      await fs.appendFile(this.costEntriesFile, entryLine);

      logger.info('FeatureCostTracker.recordCost - Cost entry recorded successfully', {
        featureId: entry.featureId,
        timestamp: entry.timestamp,
      });
    } catch (error) {
      logger.error('FeatureCostTracker.recordCost - Failed to record cost entry', {
        error: error instanceof Error ? error.message : String(error),
        featureId: entry.featureId,
      });
      throw error;
    }
  }

  /**
   * Apply cost attribution rules to determine feature assignment
   */
  private async applyAttributionRules(entry: Partial<FeatureCostEntry>): Promise<Partial<FeatureCostEntry>> {
    const logger = this.getLogger();
    logger.info('FeatureCostTracker.applyAttributionRules - Applying attribution rules', {
      operationType: entry.operationType,
      userId: entry.userId,
    });

    try {
      const rules = await this.loadAttributionRules();

      // Sort rules by priority (highest first)
      const sortedRules = rules.sort((a, b) => b.priority - a.priority);

      for (const rule of sortedRules) {
        if (rule.condition(entry)) {
          logger.info('FeatureCostTracker.applyAttributionRules - Rule matched', {
            ruleId: rule.id,
            ruleName: rule.name,
            assignedFeatureId: rule.featureId,
          });

          return {
            ...entry,
            featureId: rule.featureId,
            featureName: rule.featureName,
          };
        }
      }

      // No rule matched, use default
      logger.warn('FeatureCostTracker.applyAttributionRules - No rules matched, using default', {
        operationType: entry.operationType,
      });

      return {
        ...entry,
        featureId: 'unclassified',
        featureName: 'Unclassified Operations',
      };
    } catch (error) {
      logger.error('FeatureCostTracker.applyAttributionRules - Failed to apply attribution rules', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Load cost attribution rules from storage
   */
  private async loadAttributionRules(): Promise<CostAttributionRule[]> {
    try {
      const rulesContent = await fs.readFile(this.rulesFile, 'utf-8');
      return JSON.parse(rulesContent);
    } catch (error) {
      // Return default rules if file doesn't exist
      return this.getDefaultAttributionRules();
    }
  }

  /**
   * Get default cost attribution rules
   */
  private getDefaultAttributionRules(): CostAttributionRule[] {
    return [
      {
        id: 'code-generation',
        name: 'Code Generation',
        condition: (entry) => entry.operationType?.includes('code') || entry.operationType?.includes('generation'),
        featureId: 'code-gen',
        featureName: 'Code Generation',
        priority: 100,
      },
      {
        id: 'chat-assistance',
        name: 'Chat Assistance',
        condition: (entry) => entry.operationType?.includes('chat') || entry.operationType?.includes('conversation'),
        featureId: 'chat',
        featureName: 'Chat Assistance',
        priority: 90,
      },
      {
        id: 'code-analysis',
        name: 'Code Analysis',
        condition: (entry) => entry.operationType?.includes('analysis') || entry.operationType?.includes('review'),
        featureId: 'analysis',
        featureName: 'Code Analysis',
        priority: 85,
      },
      {
        id: 'documentation',
        name: 'Documentation',
        condition: (entry) => entry.operationType?.includes('docs') || entry.operationType?.includes('documentation'),
        featureId: 'docs',
        featureName: 'Documentation',
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
    featureId?: string
  ): Promise<FeatureCostAggregation[]> {
    const logger = this.getLogger();
    logger.info('FeatureCostTracker.getFeatureCostAggregation - Getting cost aggregation', {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      featureId,
    });

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
        aggregation.operationBreakdown[entry.operationType].tokens += entry.tokens || 0;
      }

      // Calculate averages
      for (const aggregation of aggregations.values()) {
        aggregation.avgCostPerOperation = aggregation.totalCost / aggregation.operationCount;
        aggregation.avgTokensPerOperation = aggregation.totalTokens / aggregation.operationCount;
      }

      const result = Array.from(aggregations.values());
      logger.info('FeatureCostTracker.getFeatureCostAggregation - Aggregation completed', {
        featureCount: result.length,
        totalCost: result.reduce((sum, agg) => sum + agg.totalCost, 0),
      });

      return result;
    } catch (error) {
      logger.error('FeatureCostTracker.getFeatureCostAggregation - Failed to get aggregation', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Load cost entries from storage within date range
   */
  private async loadCostEntries(
    startDate: Date,
    endDate: Date,
    featureId?: string
  ): Promise<FeatureCostEntry[]> {
    try {
      const content = await fs.readFile(this.costEntriesFile, 'utf-8');
      const lines = content.trim().split('\n').filter(line => line.length > 0);

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
        } catch (parseError) {
          // Skip invalid lines
          continue;
        }
      }

      return entries;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return []; // File doesn't exist, return empty array
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
    limit: number = 10
  ): Promise<FeatureCostAggregation[]> {
    const aggregations = await this.getFeatureCostAggregation(startDate, endDate);

    return aggregations
      .sort((a, b) => b.totalCost - a.totalCost)
      .slice(0, limit);
  }

  /**
   * Clean up old cost entries based on retention policy
   */
  async cleanupOldEntries(): Promise<void> {
    const logger = this.getLogger();
    logger.info('FeatureCostTracker.cleanupOldEntries - Starting cleanup', {
      retentionDays: this.config.retentionDays,
    });

    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.config.retentionDays);

      const content = await fs.readFile(this.costEntriesFile, 'utf-8');
      const lines = content.trim().split('\n');

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
      await fs.writeFile(this.costEntriesFile, validLines.join('\n') + '\n');

      logger.info('FeatureCostTracker.cleanupOldEntries - Cleanup completed', {
        removedCount,
        remainingCount: validLines.length,
      });
    } catch (error) {
      logger.error('FeatureCostTracker.cleanupOldEntries - Cleanup failed', {
        error: error instanceof Error ? error.message : String(error),
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
          console.log(`[INFO] ${message}`, meta ? JSON.stringify(meta) : '');
        }
      },
      warn: (message: string, meta?: Record<string, unknown>) => {
        if (this.config.enableLogging) {
          console.warn(`[WARN] ${message}`, meta ? JSON.stringify(meta) : '');
        }
      },
      error: (message: string, meta?: Record<string, unknown>) => {
        console.error(`[ERROR] ${message}`, meta ? JSON.stringify(meta) : '');
      },
    };
  }
}

/**
 * Create a new FeatureCostTracker instance
 */
export function createFeatureCostTracker(config: FeatureCostConfig): FeatureCostTracker {
  return new FeatureCostTracker(config);
}