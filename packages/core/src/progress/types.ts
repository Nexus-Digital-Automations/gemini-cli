/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Types of operations that can be tracked for progress
 */
export enum OperationType {
  FileOperation = 'file_operation',
  NetworkOperation = 'network_operation',
  CodeAnalysis = 'code_analysis',
  BuildOperation = 'build_operation',
  TestOperation = 'test_operation',
  GitOperation = 'git_operation',
  PackageOperation = 'package_operation',
  SearchOperation = 'search_operation',
  GeneralOperation = 'general_operation',
}

/**
 * States that an operation can be in
 */
export enum ProgressState {
  Initializing = 'initializing',
  InProgress = 'in_progress',
  Paused = 'paused',
  Completing = 'completing',
  Completed = 'completed',
  Failed = 'failed',
  Cancelled = 'cancelled',
}

/**
 * Context information for an operation being tracked
 */
export interface OperationContext {
  type: OperationType;
  description: string;
  targetFiles?: string[];
  totalSteps?: number;
  currentStep?: number;
  estimatedDuration?: number;
  startTime: Date;
  metadata?: Record<string, unknown>;
}

/**
 * Individual step within an operation
 */
export interface ProgressStep {
  id: string;
  description: string;
  state: ProgressState;
  progress?: number; // 0-100 percentage
  startTime?: Date;
  endTime?: Date;
  error?: string;
  intermediateResults?: unknown[];
}

/**
 * Complete progress information for an operation
 */
export interface OperationProgress {
  operationId: string;
  toolCallId?: string;
  context: OperationContext;
  state: ProgressState;
  overallProgress: number; // 0-100 percentage
  steps: ProgressStep[];
  currentStepIndex: number;
  intermediateResults: unknown[];
  canPause: boolean;
  canCancel: boolean;
  estimatedTimeRemaining?: number;
  warnings: string[];
  errors: string[];
}

/**
 * Update to progress state
 */
export interface ProgressUpdate {
  operationId: string;
  type:
    | 'state_change'
    | 'step_progress'
    | 'step_complete'
    | 'intermediate_result'
    | 'error'
    | 'warning';
  data: unknown;
  timestamp: Date;
}

/**
 * User interaction with progress tracking
 */
export interface ProgressInteraction {
  type:
    | 'pause'
    | 'resume'
    | 'cancel'
    | 'skip_step'
    | 'retry_step'
    | 'expand_details'
    | 'collapse_details';
  operationId: string;
  stepId?: string;
  data?: unknown;
}