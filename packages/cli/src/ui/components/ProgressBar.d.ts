/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type React from 'react';
export interface ProgressBarProps {
  progress: number;
  label?: string;
  showPercentage?: boolean;
  width?: number;
  color?: 'auto' | 'success' | 'warning' | 'error' | 'accent';
  style?: 'filled' | 'blocks' | 'dots' | 'minimal';
  animated?: boolean;
}
export declare const ProgressBar: React.FC<ProgressBarProps>;
export interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  steps?: Array<{
    id: string;
    description: string;
    state: 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
  }>;
  compact?: boolean;
  showLabels?: boolean;
}
export declare const StepIndicator: React.FC<StepIndicatorProps>;
export interface MultiProgressBarProps {
  operations: Array<{
    id: string;
    label: string;
    progress: number;
    state: 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
  }>;
  compact?: boolean;
  maxVisible?: number;
}
export declare const MultiProgressBar: React.FC<MultiProgressBarProps>;
