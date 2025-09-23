/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { OperationType, ProgressState } from './types.js';
import type {
  OperationContext,
  OperationProgress,
  ProgressStep,
  ProgressUpdate,
  ProgressInteraction,
} from './types.js';

export type ProgressUpdateCallback = (update: ProgressUpdate) => void;

export class ProgressTracker {
  private operations = new Map<string, OperationProgress>();
  private updateCallbacks = new Set<ProgressUpdateCallback>();
  private operationIdCounter = 0;

  /**
   * Register a callback to receive progress updates
   */
  onUpdate(callback: ProgressUpdateCallback): () => void {
    this.updateCallbacks.add(callback);
    return () => {
      this.updateCallbacks.delete(callback);
    };
  }

  /**
   * Create a new operation and start tracking its progress
   */
  startOperation(context: OperationContext, toolCallId?: string): string {
    const operationId = `op_${++this.operationIdCounter}_${Date.now()}`;

    const operation: OperationProgress = {
      operationId,
      toolCallId,
      context: {
        ...context,
        startTime: new Date(),
      },
      state: ProgressState.Initializing,
      overallProgress: 0,
      steps: [],
      currentStepIndex: -1,
      intermediateResults: [],
      canPause: this.isOperationPausable(context.type),
      canCancel: true,
      warnings: [],
      errors: [],
    };

    this.operations.set(operationId, operation);
    this.emitUpdate(operationId, 'state_change', {
      state: ProgressState.Initializing,
    });

    return operationId;
  }

  /**
   * Add a step to an operation
   */
  addStep(operationId: string, stepId: string, description: string): void {
    const operation = this.operations.get(operationId);
    if (!operation) return;

    const step: ProgressStep = {
      id: stepId,
      description,
      state: ProgressState.Initializing,
      progress: 0,
    };

    operation.steps.push(step);
    operation.context.totalSteps = operation.steps.length;
    this.emitUpdate(operationId, 'step_progress', { stepId, step });
  }

  /**
   * Start executing a specific step
   */
  startStep(operationId: string, stepId: string): void {
    const operation = this.operations.get(operationId);
    if (!operation) return;

    const stepIndex = operation.steps.findIndex((s) => s.id === stepId);
    if (stepIndex === -1) return;

    const step = operation.steps[stepIndex];
    step.state = ProgressState.InProgress;
    step.startTime = new Date();
    step.progress = 0;

    operation.currentStepIndex = stepIndex;
    operation.context.currentStep = stepIndex + 1;
    operation.state = ProgressState.InProgress;

    this.updateOverallProgress(operationId);
    this.emitUpdate(operationId, 'step_progress', { stepId, step });
  }

  /**
   * Update progress of a specific step
   */
  updateStepProgress(
    operationId: string,
    stepId: string,
    progress: number,
    intermediateResult?: unknown,
  ): void {
    const operation = this.operations.get(operationId);
    if (!operation) return;

    const step = operation.steps.find((s) => s.id === stepId);
    if (!step) return;

    step.progress = Math.max(0, Math.min(100, progress));

    if (intermediateResult !== undefined) {
      if (!step.intermediateResults) {
        step.intermediateResults = [];
      }
      step.intermediateResults.push(intermediateResult);
      operation.intermediateResults.push({
        stepId,
        result: intermediateResult,
        timestamp: new Date(),
      });

      this.emitUpdate(operationId, 'intermediate_result', {
        stepId,
        result: intermediateResult,
      });
    }

    this.updateOverallProgress(operationId);
    this.emitUpdate(operationId, 'step_progress', { stepId, step });
  }

  /**
   * Complete a specific step
   */
  completeStep(
    operationId: string,
    stepId: string,
    finalResult?: unknown,
  ): void {
    const operation = this.operations.get(operationId);
    if (!operation) return;

    const step = operation.steps.find((s) => s.id === stepId);
    if (!step) return;

    step.state = ProgressState.Completed;
    step.progress = 100;
    step.endTime = new Date();

    if (finalResult !== undefined) {
      if (!step.intermediateResults) {
        step.intermediateResults = [];
      }
      step.intermediateResults.push(finalResult);
      operation.intermediateResults.push({
        stepId,
        result: finalResult,
        timestamp: new Date(),
      });
    }

    this.updateOverallProgress(operationId);
    this.emitUpdate(operationId, 'step_complete', { stepId, step });

    // Check if all steps are complete
    const allStepsComplete = operation.steps.every(
      (s) =>
        s.state === ProgressState.Completed || s.state === ProgressState.Failed,
    );

    if (allStepsComplete) {
      this.completeOperation(operationId);
    }
  }

  /**
   * Fail a specific step
   */
  failStep(operationId: string, stepId: string, error: string): void {
    const operation = this.operations.get(operationId);
    if (!operation) return;

    const step = operation.steps.find((s) => s.id === stepId);
    if (!step) return;

    step.state = ProgressState.Failed;
    step.error = error;
    step.endTime = new Date();

    operation.errors.push(`Step "${step.description}": ${error}`);

    this.updateOverallProgress(operationId);
    this.emitUpdate(operationId, 'error', { stepId, error });
  }

  /**
   * Add a warning to an operation
   */
  addWarning(operationId: string, warning: string): void {
    const operation = this.operations.get(operationId);
    if (!operation) return;

    operation.warnings.push(warning);
    this.emitUpdate(operationId, 'warning', { warning });
  }

  /**
   * Complete an entire operation
   */
  completeOperation(operationId: string): void {
    const operation = this.operations.get(operationId);
    if (!operation) return;

    operation.state = ProgressState.Completed;
    operation.overallProgress = 100;

    this.updateTimeEstimation(operationId);
    this.emitUpdate(operationId, 'state_change', {
      state: ProgressState.Completed,
    });
  }

  /**
   * Fail an entire operation
   */
  failOperation(operationId: string, error: string): void {
    const operation = this.operations.get(operationId);
    if (!operation) return;

    operation.state = ProgressState.Failed;
    operation.errors.push(error);

    this.emitUpdate(operationId, 'error', { error });
  }

  /**
   * Cancel an operation
   */
  cancelOperation(operationId: string): void {
    const operation = this.operations.get(operationId);
    if (!operation || !operation.canCancel) return;

    operation.state = ProgressState.Cancelled;

    // Cancel any in-progress steps
    operation.steps.forEach((step) => {
      if (step.state === ProgressState.InProgress) {
        step.state = ProgressState.Cancelled;
        step.endTime = new Date();
      }
    });

    this.emitUpdate(operationId, 'state_change', {
      state: ProgressState.Cancelled,
    });
  }

  /**
   * Handle user interactions with progress
   */
  handleInteraction(interaction: ProgressInteraction): boolean {
    const operation = this.operations.get(interaction.operationId);
    if (!operation) return false;

    switch (interaction.type) {
      case 'pause':
        if (
          operation.canPause &&
          operation.state === ProgressState.InProgress
        ) {
          operation.state = ProgressState.Paused;
          this.emitUpdate(interaction.operationId, 'state_change', {
            state: ProgressState.Paused,
          });
          return true;
        }
        break;

      case 'resume':
        if (operation.state === ProgressState.Paused) {
          operation.state = ProgressState.InProgress;
          this.emitUpdate(interaction.operationId, 'state_change', {
            state: ProgressState.InProgress,
          });
          return true;
        }
        break;

      case 'cancel':
        this.cancelOperation(interaction.operationId);
        return true;

      default:
        return false;
    }

    return false;
  }

  /**
   * Get current progress for an operation
   */
  getProgress(operationId: string): OperationProgress | undefined {
    return this.operations.get(operationId);
  }

  /**
   * Get all active operations
   */
  getActiveOperations(): OperationProgress[] {
    return Array.from(this.operations.values()).filter(
      (op) =>
        op.state !== ProgressState.Completed &&
        op.state !== ProgressState.Failed &&
        op.state !== ProgressState.Cancelled,
    );
  }

  /**
   * Clean up completed operations
   */
  cleanup(olderThanMs = 300000): void {
    // 5 minutes default
    const cutoff = Date.now() - olderThanMs;

    for (const [operationId, operation] of this.operations.entries()) {
      if (
        (operation.state === ProgressState.Completed ||
          operation.state === ProgressState.Failed ||
          operation.state === ProgressState.Cancelled) &&
        operation.context.startTime.getTime() < cutoff
      ) {
        this.operations.delete(operationId);
      }
    }
  }

  // Private helper methods

  private updateOverallProgress(operationId: string): void {
    const operation = this.operations.get(operationId);
    if (!operation) return;

    if (operation.steps.length === 0) {
      operation.overallProgress = 0;
      return;
    }

    const totalProgress = operation.steps.reduce(
      (sum, step) => sum + (step.progress || 0),
      0,
    );

    operation.overallProgress = Math.round(
      totalProgress / operation.steps.length,
    );
    this.updateTimeEstimation(operationId);
  }

  private updateTimeEstimation(operationId: string): void {
    const operation = this.operations.get(operationId);
    if (!operation || operation.overallProgress === 0) return;

    const elapsed = Date.now() - operation.context.startTime.getTime();
    const estimatedTotal = (elapsed / operation.overallProgress) * 100;
    operation.estimatedTimeRemaining = Math.max(0, estimatedTotal - elapsed);
  }

  private isOperationPausable(type: OperationType): boolean {
    // Some operations can be paused, others cannot
    switch (type) {
      case OperationType.FileOperation:
      case OperationType.CodeAnalysis:
      case OperationType.SearchOperation:
        return true;
      case OperationType.NetworkOperation:
      case OperationType.GitOperation:
      case OperationType.PackageOperation:
        return false;
      default:
        return true;
    }
  }

  private emitUpdate(
    operationId: string,
    type: ProgressUpdate['type'],
    data: unknown,
  ): void {
    const update: ProgressUpdate = {
      operationId,
      type,
      data,
      timestamp: new Date(),
    };

    this.updateCallbacks.forEach((callback) => {
      try {
        callback(update);
      } catch (error) {
        console.warn('Progress update callback failed:', error);
      }
    });
  }
}

// Global progress tracker instance
export const globalProgressTracker = new ProgressTracker();
