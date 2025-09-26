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
import { EventEmitter } from 'node:events';
/**
 * Context synchronizer for collaborative programming sessions
 */
export class ContextSynchronizer extends EventEmitter {
    sharedContexts = new Map();
    syncIntervals = new Map();
    pendingChanges = new Map();
    constructor() {
        super();
    }
    /**
     * Create shared context manager for a session
     */
    async createSharedContext(sessionId, config) {
        const contextId = sessionId || this.generateContextId();
        const sharedContext = {
            items: new Map(),
            syncState: {
                lastSync: new Date(),
                pendingChanges: [],
                isSyncing: false,
                conflicts: [],
            },
            addItem: async (item, participantId) => {
                await this.addContextItem(contextId, item, participantId);
            },
            removeItem: async (itemId, participantId) => {
                await this.removeContextItem(contextId, itemId, participantId);
            },
            getContextForParticipant: (participantId) => this.getContextForParticipant(contextId, participantId),
            synchronize: async () => {
                await this.synchronizeSession(contextId);
            },
        };
        this.sharedContexts.set(contextId, sharedContext);
        // Set up periodic synchronization if config provided
        if (config?.sharedContext.syncFrequencyMs) {
            this.setupPeriodicSync(contextId, config.sharedContext.syncFrequencyMs);
        }
        return sharedContext;
    }
    /**
     * Add context item to shared context
     */
    async addContextItem(sessionId, item, participantId) {
        const sharedContext = this.sharedContexts.get(sessionId);
        if (!sharedContext) {
            throw new Error(`Shared context for session ${sessionId} not found`);
        }
        // Check for conflicts with existing items
        const existingItem = sharedContext.items.get(item.id);
        if (existingItem && existingItem.content !== item.content) {
            await this.handleContextConflict(sessionId, item, existingItem, participantId);
            return;
        }
        // Add item to shared context
        sharedContext.items.set(item.id, {
            ...item,
            lastAccessed: new Date(),
            metadata: {
                ...item.metadata,
                sharedBy: participantId,
                sharedAt: new Date(),
            },
        });
        // Record change for synchronization
        const change = {
            id: this.generateChangeId(),
            type: existingItem ? 'update' : 'add',
            contextId: item.id,
            participantId,
            timestamp: new Date(),
            content: item,
        };
        sharedContext.syncState.pendingChanges.push(change);
        // Emit event for real-time updates
        this.emit('contextItemAdded', {
            sessionId,
            item,
            participantId,
            change,
        });
        // Trigger immediate sync for high-priority items
        if (item.priority === ContextPriority.CRITICAL || item.priority === ContextPriority.HIGH) {
            await this.synchronizeSession(sessionId);
        }
    }
    /**
     * Remove context item from shared context
     */
    async removeContextItem(sessionId, itemId, participantId) {
        const sharedContext = this.sharedContexts.get(sessionId);
        if (!sharedContext) {
            throw new Error(`Shared context for session ${sessionId} not found`);
        }
        const item = sharedContext.items.get(itemId);
        if (!item) {
            return; // Item doesn't exist, nothing to remove
        }
        // Remove item
        sharedContext.items.delete(itemId);
        // Record change
        const change = {
            id: this.generateChangeId(),
            type: 'remove',
            contextId: itemId,
            participantId,
            timestamp: new Date(),
        };
        sharedContext.syncState.pendingChanges.push(change);
        // Emit event
        this.emit('contextItemRemoved', {
            sessionId,
            itemId,
            participantId,
            change,
        });
    }
    /**
     * Get context items for a specific participant
     */
    getContextForParticipant(sessionId, participantId) {
        const sharedContext = this.sharedContexts.get(sessionId);
        if (!sharedContext) {
            return [];
        }
        const items = Array.from(sharedContext.items.values());
        // Filter based on participant permissions and preferences
        return items.filter(item => 
        // Basic filtering - in production, this would be more sophisticated
        // considering participant roles, permissions, and preferences
        item.type !== ContextType.SYSTEM || this.hasSystemAccess(participantId)).sort((a, b) => {
            // Sort by priority and recency
            const priorityOrder = {
                [ContextPriority.CRITICAL]: 0,
                [ContextPriority.HIGH]: 1,
                [ContextPriority.MEDIUM]: 2,
                [ContextPriority.LOW]: 3,
                [ContextPriority.CACHED]: 4,
            };
            const aPriority = priorityOrder[a.priority] || 999;
            const bPriority = priorityOrder[b.priority] || 999;
            if (aPriority !== bPriority) {
                return aPriority - bPriority;
            }
            // If same priority, sort by recency
            return b.lastAccessed.getTime() - a.lastAccessed.getTime();
        });
    }
    /**
     * Synchronize context across all participants in a session
     */
    async synchronizeSession(sessionId) {
        const sharedContext = this.sharedContexts.get(sessionId);
        if (!sharedContext || sharedContext.syncState.isSyncing) {
            return;
        }
        sharedContext.syncState.isSyncing = true;
        try {
            const changes = sharedContext.syncState.pendingChanges;
            if (changes.length === 0) {
                sharedContext.syncState.lastSync = new Date();
                return;
            }
            // Process changes in chronological order
            const sortedChanges = changes.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
            // Apply changes
            for (const change of sortedChanges) {
                await this.applyContextChange(sessionId, change);
            }
            // Clear pending changes
            sharedContext.syncState.pendingChanges = [];
            sharedContext.syncState.lastSync = new Date();
            // Emit synchronization completed event
            this.emit('synchronizationCompleted', {
                sessionId,
                changesProcessed: sortedChanges.length,
                timestamp: new Date(),
            });
        }
        catch (error) {
            console.error(`Context synchronization failed for session ${sessionId}:`, error);
            this.emit('synchronizationFailed', {
                sessionId,
                error: error.message,
                timestamp: new Date(),
            });
        }
        finally {
            sharedContext.syncState.isSyncing = false;
        }
    }
    /**
     * Sync specific participant with session context
     */
    async syncParticipant(sessionId, participantId) {
        const participantContext = this.getContextForParticipant(sessionId, participantId);
        // Emit event with participant's context
        this.emit('participantSynced', {
            sessionId,
            participantId,
            contextItems: participantContext,
            syncedAt: new Date(),
        });
        // In a real implementation, this would send the context to the participant
        // via WebSocket, HTTP, or other communication mechanism
    }
    /**
     * Handle context conflicts
     */
    async handleContextConflict(sessionId, newItem, existingItem, participantId) {
        const sharedContext = this.sharedContexts.get(sessionId);
        if (!sharedContext) {
            return;
        }
        const conflict = {
            id: this.generateConflictId(),
            contextId: newItem.id,
            versions: [
                {
                    participantId: 'existing',
                    content: existingItem,
                    timestamp: existingItem.lastAccessed,
                },
                {
                    participantId,
                    content: newItem,
                    timestamp: new Date(),
                },
            ],
            status: 'pending',
        };
        sharedContext.syncState.conflicts.push(conflict);
        // Emit conflict event for resolution
        this.emit('contextConflict', {
            sessionId,
            conflict,
            timestamp: new Date(),
        });
    }
    /**
     * Apply a context change during synchronization
     */
    async applyContextChange(sessionId, change) {
        const sharedContext = this.sharedContexts.get(sessionId);
        if (!sharedContext) {
            return;
        }
        switch (change.type) {
            case 'add':
            case 'update':
                if (change.content) {
                    sharedContext.items.set(change.contextId, change.content);
                }
                break;
            case 'remove':
                sharedContext.items.delete(change.contextId);
                break;
            default:
                console.warn(`Unknown context change type: ${change.type}`);
        }
        // Emit change applied event
        this.emit('changeApplied', {
            sessionId,
            change,
            timestamp: new Date(),
        });
    }
    /**
     * Set up periodic context synchronization
     */
    setupPeriodicSync(sessionId, intervalMs) {
        const interval = setInterval(async () => {
            await this.synchronizeSession(sessionId);
        }, intervalMs);
        this.syncIntervals.set(sessionId, interval);
    }
    /**
     * Get synchronization status for a session
     */
    getSyncStatus(sessionId) {
        const sharedContext = this.sharedContexts.get(sessionId);
        return sharedContext ? sharedContext.syncState : null;
    }
    /**
     * Get context statistics for a session
     */
    getContextStats(sessionId) {
        const sharedContext = this.sharedContexts.get(sessionId);
        if (!sharedContext) {
            return null;
        }
        const items = Array.from(sharedContext.items.values());
        const itemsByType = {
            [ContextType.CONVERSATION]: 0,
            [ContextType.CODE]: 0,
            [ContextType.FILE]: 0,
            [ContextType.PROJECT_STATE]: 0,
            [ContextType.ERROR]: 0,
            [ContextType.SYSTEM]: 0,
            [ContextType.USER_PREFERENCE]: 0,
        };
        const itemsByPriority = {
            [ContextPriority.CRITICAL]: 0,
            [ContextPriority.HIGH]: 0,
            [ContextPriority.MEDIUM]: 0,
            [ContextPriority.LOW]: 0,
            [ContextPriority.CACHED]: 0,
        };
        for (const item of items) {
            itemsByType[item.type]++;
            itemsByPriority[item.priority]++;
        }
        return {
            totalItems: items.length,
            itemsByType,
            itemsByPriority,
            pendingChanges: sharedContext.syncState.pendingChanges.length,
            activeConflicts: sharedContext.syncState.conflicts.filter(c => c.status === 'pending').length,
        };
    }
    /**
     * Clean up session context
     */
    cleanupSession(sessionId) {
        // Stop periodic sync
        const interval = this.syncIntervals.get(sessionId);
        if (interval) {
            clearInterval(interval);
            this.syncIntervals.delete(sessionId);
        }
        // Remove shared context
        this.sharedContexts.delete(sessionId);
        // Clear pending changes
        this.pendingChanges.delete(sessionId);
        this.emit('sessionCleanedup', { sessionId, timestamp: new Date() });
    }
    /**
     * Check if participant has system access
     */
    hasSystemAccess(participantId) {
        // Simplified check - in production, this would check participant roles/permissions
        return true; // For now, allow all participants system access
    }
    /**
     * Generate unique context ID
     */
    generateContextId() {
        return `context_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    /**
     * Generate unique change ID
     */
    generateChangeId() {
        return `change_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    /**
     * Generate unique conflict ID
     */
    generateConflictId() {
        return `conflict_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    /**
     * Destroy all resources
     */
    destroy() {
        // Clear all intervals
        for (const interval of this.syncIntervals.values()) {
            clearInterval(interval);
        }
        this.syncIntervals.clear();
        // Clear all contexts
        this.sharedContexts.clear();
        this.pendingChanges.clear();
        // Remove all listeners
        this.removeAllListeners();
    }
}
//# sourceMappingURL=ContextSynchronizer.js.map