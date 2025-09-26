/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ToolCallStatus , OperationProgress } from '../types.js';
import type { ToolCallInfo } from '@google/gemini-cli-core';
export interface ToolProgressState {
    operationId?: string;
    operation?: OperationProgress;
    status: ToolCallStatus;
    isTracking: boolean;
    estimatedTimeRemaining?: number;
    currentStepDescription?: string;
    overallProgress: number;
    canInteract: boolean;
}
export interface ToolProgressActions {
    startTracking: (toolCall: ToolCallInfo, toolCallId: string) => void;
    updateProgress: (stepId: string, progress: number, intermediateResult?: unknown) => void;
    nextStep: (stepId?: string) => void;
    complete: (finalResult?: unknown) => void;
    fail: (error: string) => void;
    cancel: () => void;
    pause: () => void;
    resume: () => void;
}
export interface UseToolProgressResult extends ToolProgressState, ToolProgressActions {
}
/**
 * Hook for managing tool-specific progress tracking
 */
export declare const useToolProgress: (initialStatus?: ToolCallStatus) => UseToolProgressResult;
/**
 * Simplified hook for basic tool progress without step management
 */
export declare const useSimpleToolProgress: () => {
    status: ToolCallStatus;
    progress: number;
    message: string | undefined;
    start: (message?: string) => void;
    updateProgress: (newProgress: number, message?: string) => void;
    complete: (message?: string) => void;
    fail: (error: string) => void;
    cancel: () => void;
};
