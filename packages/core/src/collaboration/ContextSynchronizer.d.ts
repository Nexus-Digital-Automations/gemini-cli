/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * @fileoverview Pair-Programming Mode - Context Synchronization System
 * Real-time context sharing and synchronization between participants
 *
 * @author Claude Code - Pair-Programming Implementation Agent
 * @version 1.0.0
 */
import { EventEmitter } from 'events';
import type { SharedContextManager, ContextSyncState, WorkspaceConfig } from './types.js';
import type { ContextItem, ContextType, ContextPriority } from '../context/types.js';
/**
 * Context synchronizer for collaborative programming sessions
 */
export declare class ContextSynchronizer extends EventEmitter {
    private sharedContexts;
    private syncIntervals;
    private pendingChanges;
    constructor();
    /**
     * Create shared context manager for a session
     */
    createSharedContext(sessionId?: string, config?: WorkspaceConfig): Promise<SharedContextManager>;
    /**
     * Add context item to shared context
     */
    addContextItem(sessionId: string, item: ContextItem, participantId: string): Promise<void>;
    /**
     * Remove context item from shared context
     */
    removeContextItem(sessionId: string, itemId: string, participantId: string): Promise<void>;
    /**
     * Get context items for a specific participant
     */
    getContextForParticipant(sessionId: string, participantId: string): ContextItem[];
    /**
     * Synchronize context across all participants in a session
     */
    synchronizeSession(sessionId: string): Promise<void>;
    /**
     * Sync specific participant with session context
     */
    syncParticipant(sessionId: string, participantId: string): Promise<void>;
    /**
     * Handle context conflicts
     */
    private handleContextConflict;
    /**
     * Apply a context change during synchronization
     */
    private applyContextChange;
    /**
     * Set up periodic context synchronization
     */
    private setupPeriodicSync;
    /**
     * Get synchronization status for a session
     */
    getSyncStatus(sessionId: string): ContextSyncState | null;
    /**
     * Get context statistics for a session
     */
    getContextStats(sessionId: string): {
        totalItems: number;
        itemsByType: Record<ContextType, number>;
        itemsByPriority: Record<ContextPriority, number>;
        pendingChanges: number;
        activeConflicts: number;
    } | null;
    /**
     * Clean up session context
     */
    cleanupSession(sessionId: string): void;
    /**
     * Check if participant has system access
     */
    private hasSystemAccess;
    /**
     * Generate unique context ID
     */
    private generateContextId;
    /**
     * Generate unique change ID
     */
    private generateChangeId;
    /**
     * Generate unique conflict ID
     */
    private generateConflictId;
    /**
     * Destroy all resources
     */
    destroy(): void;
}
