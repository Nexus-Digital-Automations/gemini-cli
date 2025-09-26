/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type React from 'react';
import type { OperationProgress, ProgressUpdate } from '../types.js';
/**
 * Props for the StreamingResults component.
 * Configures how streaming operation results are displayed and formatted.
 */
export interface StreamingResultsProps {
    operation: OperationProgress;
    maxResults?: number;
    maxHeight?: number;
    showTimestamps?: boolean;
    autoScroll?: boolean;
}
/**
 * StreamingResults displays live intermediate results from ongoing operations.
 *
 * This component renders operation results in real-time with proper formatting,
 * type detection, and scrolling behavior. It supports different display modes
 * for narrow terminals and provides visual indicators for result types.
 *
 * @param props - Configuration options for the streaming results display
 * @returns A React component that shows live operation results
 *
 * @example
 * ```tsx
 * <StreamingResults
 *   operation={currentOperation}
 *   maxResults={15}
 *   showTimestamps={true}
 *   autoScroll={true}
 * />
 * ```
 */
export declare const StreamingResults: React.FC<StreamingResultsProps>;
/**
 * Props for the LiveUpdateDisplay component.
 * Configures how progress updates are shown during operations.
 */
export interface LiveUpdateDisplayProps {
    updates: ProgressUpdate[];
    maxUpdates?: number;
    compact?: boolean;
}
/**
 * LiveUpdateDisplay shows recent progress updates from ongoing operations.
 *
 * This component renders a list of recent progress updates with icons and
 * timestamps. It provides a real-time view of operation state changes,
 * step progress, and completion status.
 *
 * @param props - Configuration for the update display
 * @returns A React component showing recent operation updates
 *
 * @example
 * ```tsx
 * <LiveUpdateDisplay
 *   updates={progressUpdates}
 *   maxUpdates={10}
 *   compact={false}
 * />
 * ```
 */
export declare const LiveUpdateDisplay: React.FC<LiveUpdateDisplayProps>;
