/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type React from 'react';
/**
 * Props for the ProgressPanel component.
 * Configures the progress panel's behavior and display options.
 */
export interface ProgressPanelProps {
  isExpanded: boolean;
  onToggle: () => void;
  maxHeight?: number;
}
/**
 * ProgressPanel displays ongoing operation progress with expandable detail view.
 *
 * This component shows active operations and their progress in either a collapsed
 * summary view or an expanded detailed view. It handles multiple concurrent
 * operations and provides interactive controls for operation management.
 *
 * Features:
 * - Collapsible/expandable interface
 * - Multiple operation tracking
 * - Real-time progress updates
 * - Interactive operation controls
 * - Responsive layout for different terminal sizes
 * - Primary operation highlighting
 *
 * @param props - Configuration for progress panel display and behavior
 * @returns A React component showing operation progress
 *
 * @example
 * ```tsx
 * <ProgressPanel
 *   isExpanded={showDetails}
 *   onToggle={togglePanelExpansion}
 *   maxHeight={20}
 * />
 * ```
 */
export declare const ProgressPanel: React.FC<ProgressPanelProps>;
