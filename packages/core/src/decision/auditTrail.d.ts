/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Decision, DecisionOutcome } from './types.js';
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
    outcomesByResult: {
        success: number;
        failure: number;
    };
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
export declare class DecisionAuditTrail {
    private readonly config;
    private readonly entries;
    private flushTimer?;
    private isShuttingDown;
    constructor(config: AuditTrailConfig);
    /**
     * Initialize the audit trail system.
     */
    initialize(): Promise<void>;
    /**
     * Shutdown the audit trail system gracefully.
     */
    shutdown(): Promise<void>;
    /**
     * Record a decision in the audit trail.
     *
     * @param decision - The decision to record
     */
    recordDecision(decision: Decision): void;
    /**
     * Record the outcome of a decision execution.
     *
     * @param outcome - The outcome to record
     */
    recordOutcome(outcome: DecisionOutcome): void;
    /**
     * Retrieve decisions from the audit trail with optional filtering.
     *
     * @param options - Filtering and pagination options
     * @returns Array of audit entries matching the criteria
     */
    getDecisions(options?: {
        limit?: number;
        since?: number;
        until?: number;
        type?: string;
        success?: boolean;
        minConfidence?: number;
        maxConfidence?: number;
    }): AuditEntry[];
    /**
     * Get comprehensive statistics about the audit trail.
     */
    getStatistics(): AuditStatistics;
    /**
     * Get a specific decision by ID.
     *
     * @param decisionId - ID of the decision to retrieve
     * @returns The audit entry or undefined if not found
     */
    getDecision(decisionId: string): AuditEntry | undefined;
    /**
     * Clear all audit trail data.
     * Use with caution - this operation is irreversible.
     */
    clear(): void;
    /**
     * Export audit trail data as JSON.
     *
     * @param options - Export options
     * @returns JSON string of the audit data
     */
    exportAsJson(options?: {
        since?: number;
        until?: number;
        includeContext?: boolean;
    }): string;
    /**
     * Load audit data from disk if persistence is enabled.
     */
    private loadFromDisk;
    /**
     * Flush in-memory audit data to disk.
     */
    private flushToDisk;
    /**
     * Remove oldest entries to maintain size limit.
     */
    private evictOldestEntries;
}
export {};
