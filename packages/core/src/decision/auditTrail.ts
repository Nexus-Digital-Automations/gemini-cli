/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { writeFile, readFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { getComponentLogger } from '../utils/logger.js';
import type { Decision, DecisionOutcome } from './types.js';

const logger = getComponentLogger('decision-audit-trail');

/**
 * Configuration for the audit trail system.
 */
export interface AuditTrailConfig {
  /** Maximum number of entries to keep in memory */
  maxEntries: number;
  /** Whether to persist audit trail to disk */
  persistToDisk: boolean;
  /** Directory to store audit files (if persisting) */
  auditDirectory?: string;
  /** How often to flush in-memory data to disk (milliseconds) */
  flushIntervalMs?: number;
}

/**
 * Statistics about the decision audit trail.
 */
export interface AuditStatistics {
  totalDecisions: number;
  successfulDecisions: number;
  failedDecisions: number;
  successRate: number;
  avgConfidence: number;
  avgExecutionTime: number;
  decisionsByType: Record<string, number>;
  outcomesByResult: { success: number; failure: number };
}

/**
 * Entry in the audit trail combining a decision and its outcome.
 */
interface AuditEntry {
  decision: Decision;
  outcome?: DecisionOutcome;
  recorded: number;
}

/**
 * Comprehensive audit trail system for decision transparency and debugging.
 *
 * The DecisionAuditTrail maintains a complete record of all decisions made
 * by the autonomous system, along with their outcomes and performance metrics.
 * This enables:
 * - Full transparency into decision-making processes
 * - Performance analysis and optimization opportunities
 * - Debugging of decision quality issues
 * - Compliance and accountability requirements
 * - Learning from historical patterns
 *
 * Key features:
 * - In-memory storage with configurable persistence
 * - Comprehensive statistics and analytics
 * - Efficient querying and filtering capabilities
 * - Automatic cleanup and rotation
 * - Thread-safe operations
 *
 * @example
 * ```typescript
 * const auditTrail = new DecisionAuditTrail({
 *   maxEntries: 10000,
 *   persistToDisk: true,
 *   auditDirectory: './audit-logs'
 * });
 *
 * await auditTrail.initialize();
 * auditTrail.recordDecision(decision);
 * auditTrail.recordOutcome(outcome);
 *
 * const stats = auditTrail.getStatistics();
 * const recentDecisions = auditTrail.getDecisions({
 *   limit: 100,
 *   since: Date.now() - 86400000 // Last 24 hours
 * });
 * ```
 */
export class DecisionAuditTrail {
  private readonly config: Required<AuditTrailConfig>;
  private readonly entries = new Map<string, AuditEntry>();
  private flushTimer?: NodeJS.Timeout;
  private isShuttingDown = false;

  constructor(config: AuditTrailConfig) {
    this.config = {
      maxEntries: config.maxEntries,
      persistToDisk: config.persistToDisk,
      auditDirectory: config.auditDirectory || './audit-logs',
      flushIntervalMs: config.flushIntervalMs || 30000, // 30 seconds default
    };
  }

  /**
   * Initialize the audit trail system.
   */
  async initialize(): Promise<void> {
    logger.info('Initializing DecisionAuditTrail', {
      maxEntries: this.config.maxEntries,
      persistToDisk: this.config.persistToDisk,
      auditDirectory: this.config.auditDirectory,
    });

    try {
      if (this.config.persistToDisk) {
        // Ensure audit directory exists
        if (!existsSync(this.config.auditDirectory)) {
          await mkdir(this.config.auditDirectory, { recursive: true });
          logger.info(`Created audit directory: ${this.config.auditDirectory}`);
        }

        // Load existing audit data
        await this.loadFromDisk();

        // Set up periodic flushing
        this.flushTimer = setInterval(
          () => this.flushToDisk(),
          this.config.flushIntervalMs,
        );
      }

      logger.info('DecisionAuditTrail initialized successfully', {
        loadedEntries: this.entries.size,
      });
    } catch (error) {
      logger.error('Failed to initialize DecisionAuditTrail', { error });
      throw error;
    }
  }

  /**
   * Shutdown the audit trail system gracefully.
   */
  async shutdown(): Promise<void> {
    logger.info('Shutting down DecisionAuditTrail');
    this.isShuttingDown = true;

    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    if (this.config.persistToDisk) {
      await this.flushToDisk();
    }

    logger.info('DecisionAuditTrail shutdown complete');
  }

  /**
   * Record a decision in the audit trail.
   *
   * @param decision - The decision to record
   */
  recordDecision(decision: Decision): void {
    if (this.isShuttingDown) {
      logger.warn('Cannot record decision during shutdown', {
        decisionId: decision.id,
      });
      return;
    }

    const entry: AuditEntry = {
      decision,
      recorded: Date.now(),
    };

    this.entries.set(decision.id, entry);

    // Enforce size limit
    if (this.entries.size > this.config.maxEntries) {
      this.evictOldestEntries();
    }

    logger.debug('Recorded decision in audit trail', {
      decisionId: decision.id,
      type: decision.type,
      confidence: decision.confidence,
    });
  }

  /**
   * Record the outcome of a decision execution.
   *
   * @param outcome - The outcome to record
   */
  recordOutcome(outcome: DecisionOutcome): void {
    if (this.isShuttingDown) {
      logger.warn('Cannot record outcome during shutdown', {
        decisionId: outcome.decisionId,
      });
      return;
    }

    const entry = this.entries.get(outcome.decisionId);
    if (!entry) {
      logger.warn('Cannot record outcome for unknown decision', {
        decisionId: outcome.decisionId,
      });
      return;
    }

    entry.outcome = outcome;

    logger.debug('Recorded decision outcome in audit trail', {
      decisionId: outcome.decisionId,
      success: outcome.success,
      duration: outcome.actualDuration,
    });
  }

  /**
   * Retrieve decisions from the audit trail with optional filtering.
   *
   * @param options - Filtering and pagination options
   * @returns Array of audit entries matching the criteria
   */
  getDecisions(
    options: {
      limit?: number;
      since?: number;
      until?: number;
      type?: string;
      success?: boolean;
      minConfidence?: number;
      maxConfidence?: number;
    } = {},
  ): AuditEntry[] {
    let results = Array.from(this.entries.values());

    // Apply filters
    if (options.since) {
      results = results.filter(
        (entry) => entry.decision.timestamp >= options.since!,
      );
    }

    if (options.until) {
      results = results.filter(
        (entry) => entry.decision.timestamp <= options.until!,
      );
    }

    if (options.type) {
      results = results.filter((entry) => entry.decision.type === options.type);
    }

    if (options.success !== undefined) {
      results = results.filter(
        (entry) => entry.outcome?.success === options.success,
      );
    }

    if (options.minConfidence !== undefined) {
      results = results.filter(
        (entry) => entry.decision.confidence >= options.minConfidence!,
      );
    }

    if (options.maxConfidence !== undefined) {
      results = results.filter(
        (entry) => entry.decision.confidence <= options.maxConfidence!,
      );
    }

    // Sort by timestamp (most recent first)
    results.sort((a, b) => b.decision.timestamp - a.decision.timestamp);

    // Apply limit
    if (options.limit) {
      results = results.slice(0, options.limit);
    }

    return results;
  }

  /**
   * Get comprehensive statistics about the audit trail.
   */
  getStatistics(): AuditStatistics {
    const entries = Array.from(this.entries.values());
    const totalDecisions = entries.length;

    if (totalDecisions === 0) {
      return {
        totalDecisions: 0,
        successfulDecisions: 0,
        failedDecisions: 0,
        successRate: 0,
        avgConfidence: 0,
        avgExecutionTime: 0,
        decisionsByType: {},
        outcomesByResult: { success: 0, failure: 0 },
      };
    }

    const entriesWithOutcomes = entries.filter((entry) => entry.outcome);
    const successfulDecisions = entriesWithOutcomes.filter(
      (entry) => entry.outcome!.success,
    ).length;
    const failedDecisions = entriesWithOutcomes.length - successfulDecisions;

    // Calculate averages
    const totalConfidence = entries.reduce(
      (sum, entry) => sum + entry.decision.confidence,
      0,
    );
    const avgConfidence = totalConfidence / totalDecisions;

    const totalExecutionTime = entriesWithOutcomes.reduce(
      (sum, entry) => sum + entry.outcome!.actualDuration,
      0,
    );
    const avgExecutionTime =
      entriesWithOutcomes.length > 0
        ? totalExecutionTime / entriesWithOutcomes.length
        : 0;

    // Group by decision type
    const decisionsByType: Record<string, number> = {};
    entries.forEach((entry) => {
      const type = entry.decision.type;
      decisionsByType[type] = (decisionsByType[type] || 0) + 1;
    });

    return {
      totalDecisions,
      successfulDecisions,
      failedDecisions,
      successRate:
        entriesWithOutcomes.length > 0
          ? successfulDecisions / entriesWithOutcomes.length
          : 0,
      avgConfidence,
      avgExecutionTime,
      decisionsByType,
      outcomesByResult: {
        success: successfulDecisions,
        failure: failedDecisions,
      },
    };
  }

  /**
   * Get a specific decision by ID.
   *
   * @param decisionId - ID of the decision to retrieve
   * @returns The audit entry or undefined if not found
   */
  getDecision(decisionId: string): AuditEntry | undefined {
    return this.entries.get(decisionId);
  }

  /**
   * Clear all audit trail data.
   * Use with caution - this operation is irreversible.
   */
  clear(): void {
    logger.warn('Clearing all audit trail data');
    this.entries.clear();
  }

  /**
   * Export audit trail data as JSON.
   *
   * @param options - Export options
   * @returns JSON string of the audit data
   */
  exportAsJson(
    options: {
      since?: number;
      until?: number;
      includeContext?: boolean;
    } = {},
  ): string {
    const entries = this.getDecisions({
      since: options.since,
      until: options.until,
    });

    const exportData = entries.map((entry) => ({
      decision: options.includeContext
        ? entry.decision
        : { ...entry.decision, context: undefined },
      outcome: entry.outcome,
      recorded: entry.recorded,
    }));

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Load audit data from disk if persistence is enabled.
   */
  private async loadFromDisk(): Promise<void> {
    const auditFile = join(this.config.auditDirectory, 'decisions.json');

    if (!existsSync(auditFile)) {
      logger.info('No existing audit file found, starting fresh');
      return;
    }

    try {
      const data = await readFile(auditFile, 'utf-8');
      const entries = JSON.parse(data) as AuditEntry[];

      let loadedCount = 0;
      for (const entry of entries) {
        // Validate entry structure
        if (entry.decision?.id && entry.recorded) {
          this.entries.set(entry.decision.id, entry);
          loadedCount++;
        }
      }

      logger.info(`Loaded ${loadedCount} audit entries from disk`);
    } catch (error) {
      logger.error('Failed to load audit data from disk', { error, auditFile });
      // Continue without loading - we'll start fresh
    }
  }

  /**
   * Flush in-memory audit data to disk.
   */
  private async flushToDisk(): Promise<void> {
    if (!this.config.persistToDisk || this.entries.size === 0) {
      return;
    }

    const auditFile = join(this.config.auditDirectory, 'decisions.json');
    const entries = Array.from(this.entries.values());

    try {
      const data = JSON.stringify(entries, null, 2);
      await writeFile(auditFile, data, 'utf-8');

      logger.debug(`Flushed ${entries.length} audit entries to disk`);
    } catch (error) {
      logger.error('Failed to flush audit data to disk', { error, auditFile });
    }
  }

  /**
   * Remove oldest entries to maintain size limit.
   */
  private evictOldestEntries(): void {
    const entries = Array.from(this.entries.entries());
    entries.sort((a, b) => a[1].recorded - b[1].recorded);

    const toEvict = entries.length - this.config.maxEntries;
    for (let i = 0; i < toEvict; i++) {
      this.entries.delete(entries[i][0]);
    }

    logger.debug(`Evicted ${toEvict} oldest audit entries`);
  }
}

// Export alias for backward compatibility
export { DecisionAuditTrail as AuditTrail };
