/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * @fileoverview Pair-Programming Mode - Conflict Resolution System
 * Advanced conflict detection and resolution for collaborative sessions
 *
 * @author Claude Code - Pair-Programming Implementation Agent
 * @version 1.0.0
 */
import { EventEmitter } from 'events';
import type { CollaborationConflict, ConflictType, ConflictResolutionStrategy, ConflictResolution, ConflictingChange, ContextConflict, SessionParticipant } from './types.js';
import type { ContextItem } from '../context/types.js';
/**
 * Conflict resolver for collaborative programming sessions
 */
export declare class ConflictResolver extends EventEmitter {
    private activeConflicts;
    private resolutionStrategies;
    constructor();
    /**
     * Detect conflicts in collaborative changes
     */
    detectConflicts(sessionId: string, changes: ConflictingChange[], participants: SessionParticipant[]): Promise<CollaborationConflict[]>;
    /**
     * Resolve a conflict using specified strategy
     */
    resolveConflict(conflictId: string, strategy: ConflictResolutionStrategy, resolvingParticipant?: string, resolutionData?: unknown): Promise<ConflictResolution>;
    /**
     * Get active conflicts for a session
     */
    getActiveConflicts(sessionId: string): CollaborationConflict[];
    /**
     * Auto-resolve conflicts based on session configuration
     */
    autoResolveConflicts(sessionId: string, strategy: ConflictResolutionStrategy, participants: SessionParticipant[]): Promise<ConflictResolution[]>;
    /**
     * Check if changes conflict with existing context
     */
    checkContextConflict(contextId: string, newContent: ContextItem, existingVersions: Array<{
        participantId: string;
        content: ContextItem;
        timestamp: Date;
    }>): Promise<ContextConflict | null>;
    /**
     * Analyze location-based conflict
     */
    private analyzeLocationConflict;
    /**
     * Group changes by their location for conflict analysis
     */
    private groupChangesByLocation;
    /**
     * Extract location identifier from change
     */
    private extractLocation;
    /**
     * Initialize conflict resolution strategies
     */
    private initializeResolutionStrategies;
    /**
     * Select appropriate participant for auto-resolution
     */
    private selectAutoResolver;
    /**
     * Clean up resolved conflicts (optional periodic cleanup)
     */
    cleanupResolvedConflicts(): void;
    /**
     * Get conflict statistics
     */
    getConflictStats(): {
        total: number;
        pending: number;
        resolved: number;
        failed: number;
        byType: Record<ConflictType, number>;
    };
}
