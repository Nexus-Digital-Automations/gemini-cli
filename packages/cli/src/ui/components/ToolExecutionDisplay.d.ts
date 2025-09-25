/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type React from 'react';
import type { OperationProgress, ToolCallStatus } from '../types.js';
/**
 * Props for the ToolExecutionDisplay component.
 * Configures how tool execution progress and status are displayed.
 */
export interface ToolExecutionDisplayProps {
  operation: OperationProgress;
  toolCallStatus: ToolCallStatus;
  compact?: boolean;
  showSteps?: boolean;
  showIntermediateResults?: boolean;
}
/**
 * ToolExecutionDisplay shows the progress and status of tool executions.
 *
 * This component renders detailed information about ongoing tool operations,
 * including progress bars, step-by-step execution status, warnings, errors,
 * and intermediate results. It adapts to different terminal widths and
 * supports both compact and detailed display modes.
 *
 * Features:
 * - Visual progress indicators with status-specific colors
 * - Step-by-step execution tracking with completion markers
 * - Error and warning display with appropriate styling
 * - File targeting information and metadata display
 * - Responsive layout for narrow terminals
 *
 * @param props - Configuration for tool execution display behavior
 * @returns A React component showing detailed tool execution status
 *
 * @example
 * ```tsx
 * <ToolExecutionDisplay
 *   operation={currentOperation}
 *   toolCallStatus="Executing"
 *   showSteps={true}
 *   showIntermediateResults={true}
 * />
 * ```
 */
export declare const ToolExecutionDisplay: React.FC<ToolExecutionDisplayProps>;
