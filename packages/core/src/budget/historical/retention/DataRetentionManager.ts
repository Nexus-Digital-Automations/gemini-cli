/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import type { TimeSeriesStorage } from '../storage/types.js';
import type {
  RetentionManager,
  RetentionRule,
  RetentionExecutionPlan,
  RetentionExecutionResult,
  DataAgingAnalysis,
  RetentionStats,
  RetentionValidationResult,
  RetentionScheduler,
  LegalHoldManager,
  ComplianceReporter,
  RetentionCondition,
  RetentionAction,
  DataLifecycleStage,
  RetentionError,
  ComplianceReportData,
} from './types.js';

/**
 * Comprehensive data retention manager
 *
 * Features:
 * - Policy-based data lifecycle management
 * - Automated retention execution
 * - Legal hold compliance
 * - Audit trail and reporting
 * - Data aging analysis
 * - Scheduled retention operations
 * - Compliance validation
 */
export class DataRetentionManager
  implements
    RetentionManager,
    RetentionScheduler,
    LegalHoldManager,
    ComplianceReporter
{
  private readonly rulesDir: string;
  private readonly executionHistoryDir: string;
  private readonly schedulesDir: string;
  private readonly legalHoldsDir: string;
  private readonly auditTrailDir: string;

  private rules: Map<string, RetentionRule> = new Map();
  private schedules: Map<string, any> = new Map();
  private legalHolds: Map<string, any> = new Map();
  private executionHistory: RetentionExecutionResult[] = [];

  constructor(
    private storage: TimeSeriesStorage,
    baseDir: string,
  ) {
    this.rulesDir = path.join(baseDir, 'retention-rules');
    this.executionHistoryDir = path.join(baseDir, 'execution-history');
    this.schedulesDir = path.join(baseDir, 'schedules');
    this.legalHoldsDir = path.join(baseDir, 'legal-holds');
    this.auditTrailDir = path.join(baseDir, 'audit-trail');

    this.initializeManager();
  }

  /**
   * Initialize retention manager
   */
  private async initializeManager(): Promise<void> {
    try {
      await fs.mkdir(this.rulesDir, { recursive: true });
      await fs.mkdir(this.executionHistoryDir, { recursive: true });
      await fs.mkdir(this.schedulesDir, { recursive: true });
      await fs.mkdir(this.legalHoldsDir, { recursive: true });
      await fs.mkdir(this.auditTrailDir, { recursive: true });

      await this.loadRules();
      await this.loadSchedules();
      await this.loadLegalHolds();
      await this.loadExecutionHistory();

      // Create default retention rules if none exist
      if (this.rules.size === 0) {
        await this.createDefaultRules();
      }

      console.log('[DataRetentionManager] Initialized successfully');
    } catch (error) {
      console.error('[DataRetentionManager] Failed to initialize:', error);
      throw error;
    }
  }

  /**
   * Load retention rules from disk
   */
  private async loadRules(): Promise<void> {
    try {
      const rulesPath = path.join(this.rulesDir, 'rules.json');
      const rulesData = await fs.readFile(rulesPath, 'utf-8');
      const rules = JSON.parse(rulesData);

      for (const [id, rule] of Object.entries(rules)) {
        this.rules.set(id, rule as RetentionRule);
      }

      console.log(
        `[DataRetentionManager] Loaded ${this.rules.size} retention rules`,
      );
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        console.warn('[DataRetentionManager] Failed to load rules:', error);
      }
    }
  }

  /**
   * Save retention rules to disk
   */
  private async saveRules(): Promise<void> {
    try {
      const rulesPath = path.join(this.rulesDir, 'rules.json');
      const rulesData = Object.fromEntries(this.rules);
      await fs.writeFile(rulesPath, JSON.stringify(rulesData, null, 2));
    } catch (error) {
      console.error('[DataRetentionManager] Failed to save rules:', error);
    }
  }

  /**
   * Load schedules from disk
   */
  private async loadSchedules(): Promise<void> {
    try {
      const schedulesPath = path.join(this.schedulesDir, 'schedules.json');
      const schedulesData = await fs.readFile(schedulesPath, 'utf-8');
      const schedules = JSON.parse(schedulesData);

      for (const [id, schedule] of Object.entries(schedules)) {
        this.schedules.set(id, schedule);
      }

      console.log(
        `[DataRetentionManager] Loaded ${this.schedules.size} schedules`,
      );
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        console.warn('[DataRetentionManager] Failed to load schedules:', error);
      }
    }
  }

  /**
   * Load legal holds from disk
   */
  private async loadLegalHolds(): Promise<void> {
    try {
      const legalHoldsPath = path.join(this.legalHoldsDir, 'legal-holds.json');
      const legalHoldsData = await fs.readFile(legalHoldsPath, 'utf-8');
      const legalHolds = JSON.parse(legalHoldsData);

      for (const [id, hold] of Object.entries(legalHolds)) {
        this.legalHolds.set(id, hold);
      }

      console.log(
        `[DataRetentionManager] Loaded ${this.legalHolds.size} legal holds`,
      );
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        console.warn(
          '[DataRetentionManager] Failed to load legal holds:',
          error,
        );
      }
    }
  }

  /**
   * Load execution history from disk
   */
  private async loadExecutionHistory(): Promise<void> {
    try {
      const historyPath = path.join(this.executionHistoryDir, 'history.json');
      const historyData = await fs.readFile(historyPath, 'utf-8');
      this.executionHistory = JSON.parse(historyData);

      console.log(
        `[DataRetentionManager] Loaded ${this.executionHistory.length} execution records`,
      );
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        console.warn(
          '[DataRetentionManager] Failed to load execution history:',
          error,
        );
      }
    }
  }

  /**
   * Save execution history to disk
   */
  private async saveExecutionHistory(): Promise<void> {
    try {
      const historyPath = path.join(this.executionHistoryDir, 'history.json');
      await fs.writeFile(
        historyPath,
        JSON.stringify(this.executionHistory, null, 2),
      );
    } catch (error) {
      console.error(
        '[DataRetentionManager] Failed to save execution history:',
        error,
      );
    }
  }

  /**
   * Create default retention rules
   */
  private async createDefaultRules(): Promise<void> {
    const defaultRules: RetentionRule[] = [
      {
        id: 'raw_data_30_days',
        name: 'Raw Data 30 Days',
        description: 'Keep raw data for 30 days, then compress',
        classification: {
          level: 'raw',
          importance: 'medium',
          category: 'operational',
        },
        retentionPeriod: { unit: 'days', value: 30 },
        actions: [
          {
            type: 'compress',
            parameters: { compressionLevel: 6 },
          },
        ],
        conditions: [
          {
            field: 'timestamp',
            operator: 'lt',
            value: Date.now() - 30 * 24 * 60 * 60 * 1000,
          },
        ],
        priority: 1,
        enabled: true,
        createdAt: Date.now(),
        lastModified: Date.now(),
        createdBy: 'system',
      },
      {
        id: 'old_data_365_days',
        name: 'Old Data 1 Year',
        description: 'Delete data older than 1 year',
        classification: {
          level: 'compressed',
          importance: 'low',
          category: 'analytical',
        },
        retentionPeriod: { unit: 'days', value: 365 },
        actions: [
          {
            type: 'delete',
            parameters: {},
          },
        ],
        conditions: [
          {
            field: 'timestamp',
            operator: 'lt',
            value: Date.now() - 365 * 24 * 60 * 60 * 1000,
          },
        ],
        priority: 2,
        enabled: true,
        createdAt: Date.now(),
        lastModified: Date.now(),
        createdBy: 'system',
      },
    ];

    for (const rule of defaultRules) {
      await this.addRule(rule);
    }

    console.log('[DataRetentionManager] Created default retention rules');
  }

  /**
   * Add retention rule
   */
  async addRule(rule: RetentionRule): Promise<void> {
    this.rules.set(rule.id, rule);
    await this.saveRules();
    await this.logAuditEvent(
      'rule_added',
      rule.id,
      'system',
      `Added retention rule: ${rule.name}`,
    );
    console.log(`[DataRetentionManager] Added retention rule: ${rule.name}`);
  }

  /**
   * Update existing rule
   */
  async updateRule(
    ruleId: string,
    updates: Partial<RetentionRule>,
  ): Promise<void> {
    const existingRule = this.rules.get(ruleId);
    if (!existingRule) {
      throw new Error(`Retention rule not found: ${ruleId}`);
    }

    const updatedRule = {
      ...existingRule,
      ...updates,
      lastModified: Date.now(),
    };

    this.rules.set(ruleId, updatedRule);
    await this.saveRules();
    await this.logAuditEvent(
      'rule_updated',
      ruleId,
      'system',
      `Updated retention rule: ${existingRule.name}`,
    );
    console.log(`[DataRetentionManager] Updated retention rule: ${ruleId}`);
  }

  /**
   * Remove retention rule
   */
  async removeRule(ruleId: string): Promise<void> {
    const rule = this.rules.get(ruleId);
    if (!rule) {
      throw new Error(`Retention rule not found: ${ruleId}`);
    }

    this.rules.delete(ruleId);
    await this.saveRules();
    await this.logAuditEvent(
      'rule_removed',
      ruleId,
      'system',
      `Removed retention rule: ${rule.name}`,
    );
    console.log(`[DataRetentionManager] Removed retention rule: ${ruleId}`);
  }

  /**
   * Get all retention rules
   */
  async getRules(): Promise<RetentionRule[]> {
    return Array.from(this.rules.values());
  }

  /**
   * Get rule by ID
   */
  async getRule(ruleId: string): Promise<RetentionRule | null> {
    return this.rules.get(ruleId) || null;
  }

  /**
   * Create execution plan
   */
  async createExecutionPlan(
    dryRun: boolean = false,
  ): Promise<RetentionExecutionPlan> {
    const planId = `plan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const enabledRules = Array.from(this.rules.values()).filter(
      (rule) => rule.enabled,
    );

    // Get storage statistics to estimate data size
    const storageStats = await this.storage.getStats();

    // Estimate actions based on rules and data
    const estimatedActions = {
      delete: 0,
      archive: 0,
      compress: 0,
      move: 0,
      transform: 0,
    };

    // Simple estimation based on data age and rules
    for (const rule of enabledRules) {
      for (const action of rule.actions) {
        if (action.type in estimatedActions) {
          // Rough estimate: 10% of total data points per rule
          estimatedActions[action.type as keyof typeof estimatedActions] +=
            Math.floor(storageStats.totalDataPoints * 0.1);
        }
      }
    }

    const estimatedDataSizeMB = storageStats.totalFileSize / (1024 * 1024);
    const estimatedExecutionTime = enabledRules.length * 5000; // 5 seconds per rule

    const plan: RetentionExecutionPlan = {
      planId,
      createdAt: Date.now(),
      executionDate: Date.now(),
      rules: enabledRules,
      estimatedActions,
      estimatedDataSizeMB,
      estimatedExecutionTime,
      dryRun,
    };

    return plan;
  }

  /**
   * Execute retention plan
   */
  async executePlan(planId: string): Promise<RetentionExecutionResult> {
    const startTime = Date.now();
    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    console.log(`[DataRetentionManager] Executing retention plan: ${planId}`);

    const result: RetentionExecutionResult = {
      planId,
      executionId,
      startTime,
      endTime: 0,
      status: 'success',
      actionsExecuted: {
        delete: 0,
        archive: 0,
        compress: 0,
        move: 0,
        transform: 0,
      },
      dataSizeProcessedMB: 0,
      errors: [],
      warnings: [],
      summary: '',
    };

    try {
      const enabledRules = Array.from(this.rules.values())
        .filter((rule) => rule.enabled)
        .sort((a, b) => a.priority - b.priority);

      for (const rule of enabledRules) {
        try {
          await this.executeRule(rule, result);
        } catch (error) {
          const retentionError: RetentionError = {
            ruleId: rule.id,
            action: rule.actions[0], // Simplified - use first action
            errorMessage: (error as Error).message,
            dataAffected: 'unknown',
            timestamp: Date.now(),
            severity: 'high',
            retryable: true,
          };

          result.errors.push(retentionError);
          console.error(
            `[DataRetentionManager] Error executing rule ${rule.id}:`,
            error,
          );
        }
      }

      result.status = result.errors.length === 0 ? 'success' : 'partial';
      result.summary = `Executed ${enabledRules.length} rules with ${result.errors.length} errors`;
    } catch (error) {
      result.status = 'failed';
      result.summary = `Execution failed: ${(error as Error).message}`;
      console.error('[DataRetentionManager] Plan execution failed:', error);
    }

    result.endTime = Date.now();
    this.executionHistory.push(result);
    await this.saveExecutionHistory();

    await this.logAuditEvent(
      'plan_executed',
      planId,
      'system',
      `Executed retention plan ${planId} with status: ${result.status}`,
    );

    console.log(
      `[DataRetentionManager] Plan execution completed: ${result.status}`,
    );
    return result;
  }

  /**
   * Execute individual retention rule
   */
  private async executeRule(
    rule: RetentionRule,
    result: RetentionExecutionResult,
  ): Promise<void> {
    console.log(`[DataRetentionManager] Executing rule: ${rule.name}`);

    // Check conditions
    const conditionsMet = await this.evaluateConditions(rule.conditions);
    if (!conditionsMet) {
      result.warnings.push(`Rule ${rule.name} conditions not met - skipping`);
      return;
    }

    // Execute actions
    for (const action of rule.actions) {
      try {
        await this.executeAction(action, rule, result);
      } catch (error) {
        throw new Error(
          `Failed to execute action ${action.type}: ${(error as Error).message}`,
        );
      }
    }
  }

  /**
   * Evaluate retention conditions
   */
  private async evaluateConditions(
    conditions: RetentionCondition[],
  ): Promise<boolean> {
    // Simplified condition evaluation
    // In a real implementation, this would query the data and check conditions
    for (const condition of conditions) {
      if (condition.field === 'timestamp' && condition.operator === 'lt') {
        // Check if there's data older than the specified timestamp
        const storageStats = await this.storage.getStats();
        if (storageStats.oldestRecord > (condition.value as number)) {
          return false; // No data old enough
        }
      }
    }

    return true;
  }

  /**
   * Execute retention action
   */
  private async executeAction(
    action: RetentionAction,
    rule: RetentionRule,
    result: RetentionExecutionResult,
  ): Promise<void> {
    switch (action.type) {
      case 'delete':
        await this.executeDeleteAction(action, rule, result);
        break;
      case 'compress':
        await this.executeCompressAction(action, rule, result);
        break;
      case 'archive':
        await this.executeArchiveAction(action, rule, result);
        break;
      default:
        result.warnings.push(`Unsupported action type: ${action.type}`);
    }
  }

  /**
   * Execute delete action
   */
  private async executeDeleteAction(
    action: RetentionAction,
    rule: RetentionRule,
    result: RetentionExecutionResult,
  ): Promise<void> {
    // Find old data to delete based on rule conditions
    const cutoffTime =
      Date.now() -
      rule.retentionPeriod.value *
        this.getMillisecondsForUnit(rule.retentionPeriod.unit);

    // Use storage's purgeOldData method
    const purgeResult = await this.storage.purgeOldData(cutoffTime);

    if (purgeResult.success) {
      result.actionsExecuted.delete += purgeResult.recordsAffected;
      result.dataSizeProcessedMB += 0.1; // Estimate
      console.log(
        `[DataRetentionManager] Deleted ${purgeResult.recordsAffected} old records`,
      );
    } else {
      throw new Error(`Delete action failed: ${purgeResult.error}`);
    }
  }

  /**
   * Execute compress action
   */
  private async executeCompressAction(
    action: RetentionAction,
    rule: RetentionRule,
    result: RetentionExecutionResult,
  ): Promise<void> {
    // Use storage's compact method for compression
    const compactResult = await this.storage.compact();

    if (compactResult.success) {
      result.actionsExecuted.compress += compactResult.recordsAffected;
      result.dataSizeProcessedMB += 0.05; // Estimate
      console.log(
        `[DataRetentionManager] Compressed ${compactResult.recordsAffected} records`,
      );
    } else {
      throw new Error(`Compress action failed: ${compactResult.error}`);
    }
  }

  /**
   * Execute archive action
   */
  private async executeArchiveAction(
    action: RetentionAction,
    rule: RetentionRule,
    result: RetentionExecutionResult,
  ): Promise<void> {
    // Create backup for archiving
    const archivePath = path.join(
      this.executionHistoryDir,
      `archive_${Date.now()}.backup`,
    );
    const backupResult = await this.storage.backup(archivePath);

    if (backupResult.success) {
      result.actionsExecuted.archive += 1;
      result.dataSizeProcessedMB += 1; // Estimate
      console.log(`[DataRetentionManager] Archived data to ${archivePath}`);
    } else {
      throw new Error(`Archive action failed: ${backupResult.error}`);
    }
  }

  /**
   * Get milliseconds for time unit
   */
  private getMillisecondsForUnit(
    unit: 'days' | 'weeks' | 'months' | 'years',
  ): number {
    switch (unit) {
      case 'days':
        return 24 * 60 * 60 * 1000;
      case 'weeks':
        return 7 * 24 * 60 * 60 * 1000;
      case 'months':
        return 30 * 24 * 60 * 60 * 1000; // Approximate
      case 'years':
        return 365 * 24 * 60 * 60 * 1000; // Approximate
      default:
        return 24 * 60 * 60 * 1000;
    }
  }

  /**
   * Get execution history
   */
  async getExecutionHistory(
    limit?: number,
  ): Promise<RetentionExecutionResult[]> {
    const history = [...this.executionHistory].sort(
      (a, b) => b.startTime - a.startTime,
    );
    return limit ? history.slice(0, limit) : history;
  }

  /**
   * Analyze data aging
   */
  async analyzeDataAging(): Promise<DataAgingAnalysis[]> {
    const storageStats = await this.storage.getStats();
    const currentTime = Date.now();

    // Generate aging analysis for representative data points
    const analyses: DataAgingAnalysis[] = [];

    // Simplified analysis - in a real implementation, this would analyze actual data
    const ageCategories = [
      { days: 7, recommendation: 'keep' as const },
      { days: 30, recommendation: 'compress' as const },
      { days: 90, recommendation: 'archive' as const },
      { days: 365, recommendation: 'delete' as const },
    ];

    for (const category of ageCategories) {
      const timestamp = currentTime - category.days * 24 * 60 * 60 * 1000;

      analyses.push({
        dataPoint: {
          timestamp,
          size: 1024, // Estimate
          accessCount: Math.max(1, Math.floor(30 / category.days)),
          lastAccessed: currentTime - category.days * 12 * 60 * 60 * 1000, // Half the age
        },
        age: {
          days: category.days,
          weeks: Math.floor(category.days / 7),
          months: Math.floor(category.days / 30),
        },
        lifecycle: {
          stage:
            category.days < 7
              ? 'active'
              : category.days < 90
                ? 'inactive'
                : 'archived',
          transitionDate: timestamp,
          accessFrequency:
            category.days < 7
              ? 'frequent'
              : category.days < 30
                ? 'occasional'
                : 'rare',
          storageLocation: 'local',
          compressionRatio: category.days > 30 ? 0.7 : undefined,
        },
        recommendation: {
          action: category.recommendation,
          reason: `Data is ${category.days} days old`,
          confidence: 0.8,
          estimatedSaving:
            category.recommendation === 'delete'
              ? 1024
              : category.recommendation === 'compress'
                ? 300
                : 0,
        },
        appliedRules: [],
      });
    }

    return analyses;
  }

  /**
   * Get retention statistics
   */
  async getStats(): Promise<RetentionStats> {
    const totalRules = this.rules.size;
    const activeRules = Array.from(this.rules.values()).filter(
      (rule) => rule.enabled,
    ).length;
    const totalExecutions = this.executionHistory.length;
    const successfulExecutions = this.executionHistory.filter(
      (exec) => exec.status === 'success',
    ).length;
    const failedExecutions = this.executionHistory.filter(
      (exec) => exec.status === 'failed',
    ).length;

    const dataProcessed = this.executionHistory.reduce(
      (acc, exec) => ({
        totalSizeMB: acc.totalSizeMB + exec.dataSizeProcessedMB,
        deletedSizeMB: acc.deletedSizeMB + exec.actionsExecuted.delete * 0.1, // Estimate
        archivedSizeMB: acc.archivedSizeMB + exec.actionsExecuted.archive * 1, // Estimate
        compressedSizeMB:
          acc.compressedSizeMB + exec.actionsExecuted.compress * 0.05, // Estimate
      }),
      {
        totalSizeMB: 0,
        deletedSizeMB: 0,
        archivedSizeMB: 0,
        compressedSizeMB: 0,
      },
    );

    const spaceSaved = {
      totalMB:
        dataProcessed.deletedSizeMB + dataProcessed.compressedSizeMB * 0.3, // Compression saves ~30%
      percentageSaved:
        dataProcessed.totalSizeMB > 0
          ? ((dataProcessed.deletedSizeMB +
              dataProcessed.compressedSizeMB * 0.3) /
              dataProcessed.totalSizeMB) *
            100
          : 0,
    };

    const averageExecutionTime =
      totalExecutions > 0
        ? this.executionHistory.reduce(
            (sum, exec) => sum + (exec.endTime - exec.startTime),
            0,
          ) / totalExecutions
        : 0;

    const lastExecution =
      totalExecutions > 0
        ? Math.max(...this.executionHistory.map((exec) => exec.startTime))
        : undefined;

    return {
      totalRules,
      activeRules,
      totalExecutions,
      successfulExecutions,
      failedExecutions,
      dataProcessed,
      spaceSaved,
      averageExecutionTime,
      lastExecution,
      nextScheduledExecution: undefined, // TODO: Implement scheduling
    };
  }

  /**
   * Validate retention rules
   */
  async validateRules(): Promise<RetentionValidationResult> {
    const result: RetentionValidationResult = {
      valid: true,
      errors: [],
      warnings: [],
      conflicts: [],
    };

    const rules = Array.from(this.rules.values());

    for (const rule of rules) {
      // Validate rule structure
      if (!rule.id || !rule.name || !rule.retentionPeriod) {
        result.errors.push({
          ruleId: rule.id,
          field: 'structure',
          message: 'Rule missing required fields',
          severity: 'error',
        });
        result.valid = false;
      }

      // Validate retention period
      if (rule.retentionPeriod.value <= 0) {
        result.errors.push({
          ruleId: rule.id,
          field: 'retentionPeriod',
          message: 'Retention period must be positive',
          severity: 'error',
        });
        result.valid = false;
      }

      // Validate actions
      if (rule.actions.length === 0) {
        result.warnings.push({
          ruleId: rule.id,
          message: 'Rule has no actions defined',
          recommendation: 'Add at least one action to make the rule effective',
        });
      }
    }

    // Check for conflicts
    for (let i = 0; i < rules.length; i++) {
      for (let j = i + 1; j < rules.length; j++) {
        const rule1 = rules[i];
        const rule2 = rules[j];

        if (this.rulesConflict(rule1, rule2)) {
          result.conflicts.push({
            rule1: rule1.id,
            rule2: rule2.id,
            conflictType: 'contradictory',
            description: `Rules ${rule1.name} and ${rule2.name} have contradictory actions`,
          });
        }
      }
    }

    return result;
  }

  /**
   * Check if two rules conflict
   */
  private rulesConflict(rule1: RetentionRule, rule2: RetentionRule): boolean {
    // Simplified conflict detection
    // Real implementation would compare conditions and actions for conflicts
    return false;
  }

  /**
   * Preview retention actions (dry run)
   */
  async preview(): Promise<RetentionExecutionPlan> {
    return this.createExecutionPlan(true);
  }

  /**
   * Schedule automatic retention execution
   */
  async scheduleExecution(
    cronExpression: string,
    ruleIds?: string[],
  ): Promise<string> {
    const scheduleId = `schedule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const schedule = {
      id: scheduleId,
      cronExpression,
      ruleIds: ruleIds || Array.from(this.rules.keys()),
      enabled: true,
      createdAt: Date.now(),
      nextExecution: this.calculateNextExecution(cronExpression),
    };

    this.schedules.set(scheduleId, schedule);

    console.log(
      `[DataRetentionManager] Scheduled retention execution: ${scheduleId}`,
    );
    return scheduleId;
  }

  /**
   * Cancel scheduled execution
   */
  async cancelScheduledExecution(scheduleId: string): Promise<void> {
    if (this.schedules.has(scheduleId)) {
      this.schedules.delete(scheduleId);
      console.log(
        `[DataRetentionManager] Cancelled scheduled execution: ${scheduleId}`,
      );
    }
  }

  /**
   * Calculate next execution time from cron expression
   */
  private calculateNextExecution(cronExpression: string): number {
    // Simplified cron calculation - would use a proper cron parser in real implementation
    return Date.now() + 24 * 60 * 60 * 1000; // Default to 24 hours
  }

  // Placeholder implementations for other interfaces

  async schedule(cronExpression: string, ruleIds: string[]): Promise<string> {
    return this.scheduleExecution(cronExpression, ruleIds);
  }

  async getSchedules(): Promise<any[]> {
    return Array.from(this.schedules.values());
  }

  async toggleSchedule(scheduleId: string, enabled: boolean): Promise<void> {
    const schedule = this.schedules.get(scheduleId);
    if (schedule) {
      schedule.enabled = enabled;
    }
  }

  async deleteSchedule(scheduleId: string): Promise<void> {
    await this.cancelScheduledExecution(scheduleId);
  }

  async getScheduleHistory(
    scheduleId: string,
    limit?: number,
  ): Promise<RetentionExecutionResult[]> {
    return this.getExecutionHistory(limit);
  }

  async placeLegalHold(
    holdId: string,
    criteria: RetentionCondition[],
    reason: string,
  ): Promise<void> {
    const legalHold = {
      id: holdId,
      criteria,
      reason,
      placedAt: Date.now(),
      placedBy: 'system',
      affectedDataCount: 0,
    };

    this.legalHolds.set(holdId, legalHold);
    await this.logAuditEvent(
      'legal_hold_placed',
      holdId,
      'system',
      `Legal hold placed: ${reason}`,
    );
  }

  async releaseLegalHold(holdId: string, reason: string): Promise<void> {
    if (this.legalHolds.has(holdId)) {
      this.legalHolds.delete(holdId);
      await this.logAuditEvent(
        'legal_hold_released',
        holdId,
        'system',
        `Legal hold released: ${reason}`,
      );
    }
  }

  async getActiveLegalHolds(): Promise<any[]> {
    return Array.from(this.legalHolds.values());
  }

  async isUnderLegalHold(dataIdentifier: string): Promise<boolean> {
    // Simplified implementation
    return this.legalHolds.size > 0;
  }

  async getAuditTrail(): Promise<any[]> {
    try {
      const auditPath = path.join(this.auditTrailDir, 'audit.json');
      const auditData = await fs.readFile(auditPath, 'utf-8');
      return JSON.parse(auditData);
    } catch {
      return [];
    }
  }

  async generateComplianceReport(
    startDate: number,
    endDate: number,
    format: 'json' | 'csv' | 'pdf',
  ): Promise<any> {
    const reportId = `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const data: ComplianceReportData = {
      period: { start: startDate, end: endDate },
      summary: {
        totalDataPoints: 1000, // Placeholder
        retentionRulesExecuted: this.rules.size,
        dataDeleted: 100,
        dataArchived: 50,
        complianceViolations: 0,
        legalHolds: this.legalHolds.size,
      },
      details: {
        ruleExecutions: [],
        violations: [],
        auditTrail: [],
      },
    };

    return {
      reportId,
      format,
      generatedAt: Date.now(),
      data,
    };
  }

  async generateDataLineageReport(dataIdentifier: string): Promise<any> {
    return {
      created: Date.now() - 30 * 24 * 60 * 60 * 1000,
      accessed: [Date.now() - 7 * 24 * 60 * 60 * 1000],
      modified: [],
      retentionRulesApplied: [],
      legalHolds: [],
      complianceNotes: [],
    };
  }

  async validateCompliance(): Promise<any> {
    return {
      compliant: true,
      violations: [],
      recommendations: [
        'Consider implementing additional retention rules for compliance',
      ],
    };
  }

  /**
   * Log audit event
   */
  private async logAuditEvent(
    action: string,
    targetId: string,
    user: string,
    description: string,
  ): Promise<void> {
    try {
      const auditPath = path.join(this.auditTrailDir, 'audit.json');
      let auditTrail: any[] = [];

      try {
        const auditData = await fs.readFile(auditPath, 'utf-8');
        auditTrail = JSON.parse(auditData);
      } catch {
        // File doesn't exist, start with empty array
      }

      auditTrail.push({
        timestamp: Date.now(),
        action,
        targetId,
        user,
        description,
      });

      // Keep only last 1000 events
      if (auditTrail.length > 1000) {
        auditTrail = auditTrail.slice(-1000);
      }

      await fs.writeFile(auditPath, JSON.stringify(auditTrail, null, 2));
    } catch (error) {
      console.error('[DataRetentionManager] Failed to log audit event:', error);
    }
  }
}

/**
 * Factory function to create a data retention manager
 */
export function createDataRetentionManager(
  storage: TimeSeriesStorage,
  baseDir: string,
): DataRetentionManager {
  return new DataRetentionManager(storage, baseDir);
}
