/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type React from 'react';
import { type ToolCallInfo } from '@google/gemini-cli-core';
import type { OperationProgress, ProgressInteraction } from '../types.js';
export interface ProgressContextValue {
  activeOperations: OperationProgress[];
  primaryOperation?: OperationProgress;
  startOperation: (toolCall: ToolCallInfo, toolCallId?: string) => string;
  updateOperationProgress: (
    operationId: string,
    stepId: string,
    progress: number,
    intermediateResult?: unknown,
  ) => void;
  completeOperation: (operationId: string) => void;
  failOperation: (operationId: string, error: string) => void;
  addStep: (operationId: string, stepId: string, description: string) => void;
  startStep: (operationId: string, stepId: string) => void;
  completeStep: (
    operationId: string,
    stepId: string,
    finalResult?: unknown,
  ) => void;
  failStep: (operationId: string, stepId: string, error: string) => void;
  handleInteraction: (interaction: ProgressInteraction) => boolean;
  isProgressPanelExpanded: boolean;
  toggleProgressPanel: () => void;
  cleanup: () => void;
}
export interface ProgressProviderProps {
  children: React.ReactNode;
}
export declare const ProgressProvider: React.FC<ProgressProviderProps>;
export declare const useProgress: () => ProgressContextValue;
