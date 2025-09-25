/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import { writeFile, readFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { getComponentLogger } from '../utils/logger.js';
const logger = getComponentLogger('decision-audit-trail');
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
    config;
    entries = new Map();
    flushTimer;
    isShuttingDown = false;
    constructor(config) {
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
    async initialize() {
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
                this.flushTimer = setInterval(() => this.flushToDisk(), this.config.flushIntervalMs);
            }
            logger.info('DecisionAuditTrail initialized successfully', {
                loadedEntries: this.entries.size,
            });
        }
        catch (error) {
            logger.error('Failed to initialize DecisionAuditTrail', { error });
            throw error;
        }
    }
    /**
     * Shutdown the audit trail system gracefully.
     */
    async shutdown() {
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
    recordDecision(decision) {
        if (this.isShuttingDown) {
            logger.warn('Cannot record decision during shutdown', { decisionId: decision.id });
            return;
        }
        const entry = {
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
    recordOutcome(outcome) {
        if (this.isShuttingDown) {
            logger.warn('Cannot record outcome during shutdown', { decisionId: outcome.decisionId });
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
    getDecisions(options = {}) {
        let results = Array.from(this.entries.values());
        // Apply filters
        if (options.since) {
            results = results.filter(entry => entry.decision.timestamp >= options.since);
        }
        if (options.until) {
            results = results.filter(entry => entry.decision.timestamp <= options.until);
        }
        if (options.type) {
            results = results.filter(entry => entry.decision.type === options.type);
        }
        if (options.success !== undefined) {
            results = results.filter(entry => entry.outcome?.success === options.success);
        }
        if (options.minConfidence !== undefined) {
            results = results.filter(entry => entry.decision.confidence >= options.minConfidence);
        }
        if (options.maxConfidence !== undefined) {
            results = results.filter(entry => entry.decision.confidence <= options.maxConfidence);
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
    getStatistics() {
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
        const entriesWithOutcomes = entries.filter(entry => entry.outcome);
        const successfulDecisions = entriesWithOutcomes.filter(entry => entry.outcome.success).length;
        const failedDecisions = entriesWithOutcomes.length - successfulDecisions;
        // Calculate averages
        const totalConfidence = entries.reduce((sum, entry) => sum + entry.decision.confidence, 0);
        const avgConfidence = totalConfidence / totalDecisions;
        const totalExecutionTime = entriesWithOutcomes.reduce((sum, entry) => sum + entry.outcome.actualDuration, 0);
        const avgExecutionTime = entriesWithOutcomes.length > 0
            ? totalExecutionTime / entriesWithOutcomes.length
            : 0;
        // Group by decision type
        const decisionsByType = {};
        entries.forEach(entry => {
            const type = entry.decision.type;
            decisionsByType[type] = (decisionsByType[type] || 0) + 1;
        });
        return {
            totalDecisions,
            successfulDecisions,
            failedDecisions,
            successRate: entriesWithOutcomes.length > 0
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
    getDecision(decisionId) {
        return this.entries.get(decisionId);
    }
    /**
     * Clear all audit trail data.
     * Use with caution - this operation is irreversible.
     */
    clear() {
        logger.warn('Clearing all audit trail data');
        this.entries.clear();
    }
    /**
     * Export audit trail data as JSON.
     *
     * @param options - Export options
     * @returns JSON string of the audit data
     */
    exportAsJson(options = {}) {
        const entries = this.getDecisions({
            since: options.since,
            until: options.until,
        });
        const exportData = entries.map(entry => ({
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
    async loadFromDisk() {
        const auditFile = join(this.config.auditDirectory, 'decisions.json');
        if (!existsSync(auditFile)) {
            logger.info('No existing audit file found, starting fresh');
            return;
        }
        try {
            const data = await readFile(auditFile, 'utf-8');
            const entries = JSON.parse(data);
            let loadedCount = 0;
            for (const entry of entries) {
                // Validate entry structure
                if (entry.decision?.id && entry.recorded) {
                    this.entries.set(entry.decision.id, entry);
                    loadedCount++;
                }
            }
            logger.info(`Loaded ${loadedCount} audit entries from disk`);
        }
        catch (error) {
            logger.error('Failed to load audit data from disk', { error, auditFile });
            // Continue without loading - we'll start fresh
        }
    }
    /**
     * Flush in-memory audit data to disk.
     */
    async flushToDisk() {
        if (!this.config.persistToDisk || this.entries.size === 0) {
            return;
        }
        const auditFile = join(this.config.auditDirectory, 'decisions.json');
        const entries = Array.from(this.entries.values());
        try {
            const data = JSON.stringify(entries, null, 2);
            await writeFile(auditFile, data, 'utf-8');
            logger.debug(`Flushed ${entries.length} audit entries to disk`);
        }
        catch (error) {
            logger.error('Failed to flush audit data to disk', { error, auditFile });
        }
    }
    /**
     * Remove oldest entries to maintain size limit.
     */
    evictOldestEntries() {
        const entries = Array.from(this.entries.entries());
        entries.sort((a, b) => a[1].recorded - b[1].recorded);
        const toEvict = entries.length - this.config.maxEntries;
        for (let i = 0; i < toEvict; i++) {
            this.entries.delete(entries[i][0]);
        }
        logger.debug(`Evicted ${toEvict} oldest audit entries`);
    }
}
//# sourceMappingURL=auditTrail.js.map