/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { OperationContext, OperationProgress, ProgressUpdate, ProgressInteraction } from './types.js';
export type ProgressUpdateCallback = (update: ProgressUpdate) => void;
export declare class ProgressTracker {
    private operations;
    private updateCallbacks;
    private operationIdCounter;
    /**
     * Register a callback to receive progress updates
     */
    onUpdate(callback: ProgressUpdateCallback): () => void;
    /**
     * Create a new operation and start tracking its progress
     */
    startOperation(context: OperationContext, toolCallId?: string): string;
    /**
     * Add a step to an operation
     */
    addStep(operationId: string, stepId: string, description: string): void;
    /**
     * Start executing a specific step
     */
    startStep(operationId: string, stepId: string): void;
    /**
     * Update progress of a specific step
     */
    updateStepProgress(operationId: string, stepId: string, progress: number, intermediateResult?: unknown): void;
    /**
     * Complete a specific step
     */
    completeStep(operationId: string, stepId: string, finalResult?: unknown): void;
    /**
     * Fail a specific step
     */
    failStep(operationId: string, stepId: string, error: string): void;
    /**
     * Add a warning to an operation
     */
    addWarning(operationId: string, warning: string): void;
    /**
     * Complete an entire operation
     */
    completeOperation(operationId: string): void;
    /**
     * Fail an entire operation
     */
    failOperation(operationId: string, error: string): void;
    /**
     * Cancel an operation
     */
    cancelOperation(operationId: string): void;
    /**
     * Handle user interactions with progress
     */
    handleInteraction(interaction: ProgressInteraction): boolean;
    /**
     * Get current progress for an operation
     */
    getProgress(operationId: string): OperationProgress | undefined;
    /**
     * Get all active operations
     */
    getActiveOperations(): OperationProgress[];
    /**
     * Clean up completed operations
     */
    cleanup(olderThanMs?: number): void;
    private updateOverallProgress;
    private updateTimeEstimation;
    private isOperationPausable;
    private emitUpdate;
}
export declare const globalProgressTracker: ProgressTracker;
