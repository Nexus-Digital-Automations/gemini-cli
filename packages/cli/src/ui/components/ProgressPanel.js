/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Text } from 'ink';
import { theme } from '../semantic-colors.js';
import { useTerminalSize } from '../hooks/useTerminalSize.js';
import { isNarrowWidth } from '../utils/isNarrowWidth.js';
import { formatDuration } from '../utils/formatters.js';
import { useProgress } from '../contexts/ProgressContext.js';
import { ToolExecutionDisplay } from './ToolExecutionDisplay.js';
import { ProgressBar, StepIndicator, MultiProgressBar } from './ProgressBar.js';
import { ToolCallStatus, ProgressState, } from '../types.js';
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
export const ProgressPanel = ({ isExpanded, onToggle: _onToggle, maxHeight = 15, }) => {
    const { columns: terminalWidth } = useTerminalSize();
    const isNarrow = isNarrowWidth(terminalWidth);
    const { activeOperations, primaryOperation, handleInteraction } = useProgress();
    if (!primaryOperation && activeOperations.length === 0) {
        return null;
    }
    if (!isExpanded) {
        // Collapsed state - show minimal summary
        return (_jsxs(Box, { flexDirection: "column", borderStyle: "single", borderColor: theme.ui.comment, paddingX: 1, children: [_jsxs(Box, { flexDirection: "row", alignItems: "center", justifyContent: "space-between", children: [_jsxs(Box, { flexDirection: "row", alignItems: "center", children: [_jsx(Text, { color: theme.text.accent, children: "\u2699 Progress" }), activeOperations.length > 1 && (_jsxs(Text, { color: theme.text.secondary, children: [' ', "(", activeOperations.length, " active)"] }))] }), _jsx(Text, { color: theme.text.muted, children: "Tab to expand" })] }), primaryOperation && (_jsx(Box, { marginTop: 1, children: _jsx(ProgressBar, { progress: primaryOperation.overallProgress, label: primaryOperation.context.description, width: isNarrow ? 20 : 30, showPercentage: true }) }))] }));
    }
    // Expanded state - show detailed progress information
    return (_jsxs(Box, { flexDirection: "column", borderStyle: "single", borderColor: theme.text.accent, paddingX: 1, paddingY: 1, height: Math.min(maxHeight, calculateRequiredHeight(activeOperations)), children: [_jsxs(Box, { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 1, children: [_jsxs(Box, { flexDirection: "row", alignItems: "center", children: [_jsx(Text, { color: theme.text.accent, bold: true, children: "\u2699 Active Operations" }), activeOperations.length > 0 && (_jsxs(Text, { color: theme.text.secondary, children: [' ', "(", activeOperations.length, ")"] }))] }), _jsxs(Box, { flexDirection: "row", alignItems: "center", children: [_jsx(Text, { color: theme.text.muted, children: "Tab to collapse" }), primaryOperation?.canPause && (_jsx(Text, { color: theme.text.muted, children: " \u2022 Space to pause" })), primaryOperation?.canCancel && (_jsx(Text, { color: theme.text.muted, children: " \u2022 Esc to cancel" }))] })] }), primaryOperation && (_jsxs(Box, { flexDirection: "column", marginBottom: activeOperations.length > 1 ? 1 : 0, children: [_jsxs(Box, { flexDirection: "row", alignItems: "center", marginBottom: 1, children: [_jsx(Text, { color: theme.text.accent, bold: true, children: "Primary Operation" }), _jsx(OperationControls, { operation: primaryOperation, onInteraction: handleInteraction })] }), _jsx(ToolExecutionDisplay, { operation: primaryOperation, toolCallStatus: getToolCallStatus(primaryOperation), showSteps: true, showIntermediateResults: true }), primaryOperation.steps.length > 1 && (_jsx(Box, { marginTop: 1, children: _jsx(StepIndicator, { currentStep: primaryOperation.currentStepIndex, totalSteps: primaryOperation.steps.length, steps: primaryOperation.steps.map((step) => ({
                                id: step.id,
                                description: step.description,
                                state: mapProgressStateToStepState(step.state),
                            })), compact: isNarrow, showLabels: !isNarrow }) }))] })), activeOperations.length > 1 && (_jsxs(Box, { flexDirection: "column", children: [_jsx(Box, { marginBottom: 1, children: _jsx(Text, { color: theme.text.secondary, bold: true, children: "Other Operations" }) }), _jsx(MultiProgressBar, { operations: activeOperations
                            .filter((op) => op.operationId !== primaryOperation?.operationId)
                            .map((op) => ({
                            id: op.operationId,
                            label: op.context.description,
                            progress: op.overallProgress,
                            state: mapProgressStateToStepState(op.state),
                        })), compact: isNarrow, maxVisible: isNarrow ? 3 : 5 })] })), _jsx(Box, { marginTop: 1, paddingTop: 1, borderTop: true, borderColor: theme.ui.comment, children: _jsx(ProgressSummary, { operations: activeOperations }) })] }));
};
const OperationControls = ({ operation, onInteraction: _onInteraction, }) => {
    const isPaused = operation.state === ProgressState.Paused;
    const canPause = operation.canPause && operation.state === ProgressState.InProgress;
    const canResume = operation.canPause && isPaused;
    const canCancel = operation.canCancel;
    if (!canPause && !canResume && !canCancel) {
        return null;
    }
    return (_jsxs(Box, { flexDirection: "row", alignItems: "center", marginLeft: 2, children: [canPause && (_jsx(Box, { marginRight: 1, children: _jsx(Text, { color: theme.text.muted, children: "[Space: Pause]" }) })), canResume && (_jsx(Box, { marginRight: 1, children: _jsx(Text, { color: theme.status.warning, children: "[Space: Resume]" }) })), canCancel && (_jsx(Box, { children: _jsx(Text, { color: theme.text.muted, children: "[Esc: Cancel]" }) }))] }));
};
const ProgressSummary = ({ operations }) => {
    const totalOperations = operations.length;
    const completedOps = operations.filter((op) => op.state === ProgressState.Completed);
    const failedOps = operations.filter((op) => op.state === ProgressState.Failed);
    const cancelledOps = operations.filter((op) => op.state === ProgressState.Cancelled);
    const activeOps = operations.filter((op) => op.state === ProgressState.InProgress ||
        op.state === ProgressState.Initializing);
    const totalProgress = totalOperations > 0
        ? Math.round(operations.reduce((sum, op) => sum + op.overallProgress, 0) /
            totalOperations)
        : 0;
    const totalElapsed = operations.reduce((max, op) => {
        const elapsed = Date.now() - op.context.startTime.getTime();
        return Math.max(max, elapsed);
    }, 0);
    const estimatedRemaining = operations
        .filter((op) => op.estimatedTimeRemaining)
        .reduce((max, op) => Math.max(max, op.estimatedTimeRemaining || 0), 0);
    return (_jsxs(Box, { flexDirection: "column", children: [_jsxs(Box, { flexDirection: "row", alignItems: "center", justifyContent: "space-between", children: [_jsxs(Box, { flexDirection: "row", alignItems: "center", children: [_jsx(Text, { color: theme.text.secondary, children: "Overall Progress:" }), _jsx(Box, { marginLeft: 1, children: _jsx(ProgressBar, { progress: totalProgress, showPercentage: true, width: 15, style: "minimal" }) })] }), _jsxs(Box, { flexDirection: "row", alignItems: "center", children: [_jsxs(Text, { color: theme.text.muted, children: ["Elapsed: ", formatDuration(totalElapsed)] }), estimatedRemaining > 0 && (_jsxs(Text, { color: theme.text.muted, children: [' ', "\u2022 ETA: ", formatDuration(estimatedRemaining)] }))] })] }), _jsxs(Box, { flexDirection: "row", alignItems: "center", marginTop: 1, children: [_jsx(Text, { color: theme.text.secondary, children: "Status: " }), activeOps.length > 0 && (_jsxs(Text, { color: theme.text.accent, children: [activeOps.length, " active"] })), completedOps.length > 0 && (_jsxs(Text, { color: theme.status.success, children: [activeOps.length > 0 ? ', ' : '', completedOps.length, " completed"] })), failedOps.length > 0 && (_jsxs(Text, { color: theme.status.error, children: [activeOps.length + completedOps.length > 0 ? ', ' : '', failedOps.length, " failed"] })), cancelledOps.length > 0 && (_jsxs(Text, { color: theme.status.warning, children: [activeOps.length + completedOps.length + failedOps.length > 0
                                ? ', '
                                : '', cancelledOps.length, " cancelled"] }))] })] }));
};
// Utility functions
/**
 * Maps ProgressState enum to the string literal type expected by UI components
 */
function mapProgressStateToStepState(state) {
    switch (state) {
        case ProgressState.Initializing:
            return 'pending';
        case ProgressState.InProgress:
            return 'in_progress';
        case ProgressState.Paused:
            return 'in_progress'; // Paused operations are still "in progress"
        case ProgressState.Completing:
            return 'in_progress';
        case ProgressState.Completed:
            return 'completed';
        case ProgressState.Failed:
            return 'failed';
        case ProgressState.Cancelled:
            return 'cancelled';
        default:
            return 'pending';
    }
}
function getToolCallStatus(operation) {
    switch (operation.state) {
        case ProgressState.Initializing:
            return ToolCallStatus.Pending;
        case ProgressState.InProgress:
        case ProgressState.Paused:
            return ToolCallStatus.Executing;
        case ProgressState.Completed:
            return ToolCallStatus.Success;
        case ProgressState.Failed:
            return ToolCallStatus.Error;
        case ProgressState.Cancelled:
            return ToolCallStatus.Canceled;
        default:
            return ToolCallStatus.Pending;
    }
}
function calculateRequiredHeight(operations) {
    // Calculate approximate height needed for all operations
    let height = 3; // Header and borders
    if (operations.length > 0) {
        const primaryOp = operations[0];
        height += 3; // Primary operation header and basic info
        height += Math.min(primaryOp.steps.length, 5); // Steps (max 5 visible)
        if (primaryOp.intermediateResults.length > 0) {
            height += Math.min(3, primaryOp.intermediateResults.length) + 1; // Results
        }
        if (operations.length > 1) {
            height += 2; // Other operations header
            height += Math.min(3, operations.length - 1); // Other operations (max 3 visible)
        }
        height += 3; // Summary section
    }
    return height;
}
//# sourceMappingURL=ProgressPanel.js.map