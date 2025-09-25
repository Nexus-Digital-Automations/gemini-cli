import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { Box, Text } from 'ink';
import { theme } from '../semantic-colors.js';
import { useTerminalSize } from '../hooks/useTerminalSize.js';
import { isNarrowWidth } from '../utils/isNarrowWidth.js';
import { formatDuration } from '../utils/formatters.js';
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
export const ToolExecutionDisplay = ({ operation, toolCallStatus, compact = false, showSteps = true, showIntermediateResults = false, }) => {
    const { columns: terminalWidth } = useTerminalSize();
    const isNarrow = isNarrowWidth(terminalWidth);
    /**
     * Determines the appropriate color for tool call status display.
     * Maps status values to theme colors for consistent visual feedback.
     *
     * @param status - The current tool call status
     * @returns The appropriate theme color for the status
     */
    const getStatusColor = (status) => {
        switch (status) {
            case 'Pending':
                return theme.text.secondary;
            case 'Executing':
                return theme.text.accent;
            case 'Success':
                return theme.status.success;
            case 'Error':
                return theme.status.error;
            case 'Canceled':
                return theme.status.warning;
            default:
                return theme.text.primary;
        }
    };
    /**
     * Gets an emoji indicator for the current operation state.
     * Provides visual cues for different operation phases.
     *
     * @returns An emoji string representing the current operation state
     */
    const getOperationStatusIndicator = () => {
        switch (operation.state) {
            case 'initializing':
                return '⏳';
            case 'in_progress':
                return '⚙️';
            case 'paused':
                return '⏸️';
            case 'completing':
                return '🔄';
            case 'completed':
                return '✅';
            case 'failed':
                return '❌';
            case 'cancelled':
                return '🚫';
            default:
                return '❓';
        }
    };
    /**
     * Determines the appropriate color for progress display based on completion percentage.
     * Uses different colors to indicate progress levels and completion status.
     *
     * @param progress - The completion percentage (0-100)
     * @returns The appropriate theme color for the progress level
     */
    const getProgressColor = (progress) => {
        if (progress >= 100)
            return theme.status.success;
        if (progress >= 75)
            return theme.text.accent;
        if (progress >= 50)
            return theme.status.warning;
        return theme.text.secondary;
    };
    /**
     * Creates a visual progress bar using Unicode block characters.
     * Represents completion percentage as filled and empty blocks.
     *
     * @param progress - The completion percentage (0-100)
     * @param width - The total width of the progress bar in characters
     * @returns A string representing the visual progress bar
     */
    const createProgressBar = (progress, width = 20) => {
        const filled = Math.round((progress / 100) * width);
        const empty = width - filled;
        return '█'.repeat(filled) + '░'.repeat(empty);
    };
    if (compact) {
        return (_jsxs(Box, { flexDirection: "row", alignItems: "center", children: [_jsxs(Text, { children: [getOperationStatusIndicator(), " "] }), _jsx(Text, { color: getStatusColor(toolCallStatus), children: operation.context.description }), operation.overallProgress > 0 && (_jsxs(Text, { color: theme.text.secondary, children: [' ', "(", operation.overallProgress, "%)"] }))] }));
    }
    return (_jsxs(Box, { flexDirection: "column", paddingLeft: 1, paddingRight: 1, children: [_jsxs(Box, { flexDirection: "row", alignItems: "center", children: [_jsxs(Text, { children: [getOperationStatusIndicator(), " "] }), _jsx(Text, { color: getStatusColor(toolCallStatus), bold: true, children: operation.context.description }), operation.context.targetFiles &&
                        operation.context.targetFiles.length === 1 && (_jsxs(Text, { color: theme.text.muted, children: [' ', "\u2192 ", getFileName(operation.context.targetFiles[0])] }))] }), operation.overallProgress > 0 && (_jsxs(Box, { marginTop: 1, children: [_jsxs(Text, { color: getProgressColor(operation.overallProgress), children: [createProgressBar(operation.overallProgress, isNarrow ? 15 : 25), ' ', operation.overallProgress, "%"] }), operation.estimatedTimeRemaining &&
                        operation.estimatedTimeRemaining > 1000 && (_jsxs(Text, { color: theme.text.muted, children: [' ', "(~", formatDuration(operation.estimatedTimeRemaining), " left)"] }))] })), operation.context.targetFiles &&
                operation.context.targetFiles.length > 1 && (_jsx(Box, { marginTop: 1, children: _jsxs(Text, { color: theme.text.secondary, children: ["Files:", ' ', operation.context.targetFiles
                            .slice(0, 3)
                            .map((f) => getFileName(f))
                            .join(', '), operation.context.targetFiles.length > 3 && (_jsxs(Text, { color: theme.text.muted, children: [' ', "+", operation.context.targetFiles.length - 3, " more"] }))] }) })), showSteps && operation.steps.length > 0 && (_jsx(Box, { marginTop: 1, flexDirection: "column", children: operation.steps.map((step, index) => {
                    const isCurrent = index === operation.currentStepIndex;
                    const isCompleted = step.state === 'completed';
                    const isFailed = step.state === 'failed';
                    return (_jsxs(Box, { flexDirection: "row", alignItems: "center", children: [_jsx(Text, { color: theme.text.secondary, children: isCompleted ? '✓' : isFailed ? '✗' : isCurrent ? '▶' : '○' }), _jsxs(Text, { color: isCompleted
                                    ? theme.status.success
                                    : isFailed
                                        ? theme.status.error
                                        : isCurrent
                                            ? theme.text.accent
                                            : theme.text.secondary, dimColor: !isCurrent && !isCompleted && !isFailed, children: [' ', step.description] }), step.progress !== undefined &&
                                step.progress > 0 &&
                                step.progress < 100 && (_jsxs(Text, { color: theme.text.muted, children: [" (", step.progress, "%)"] })), step.error && (_jsxs(Text, { color: theme.status.error, children: [" - ", step.error] }))] }, step.id));
                }) })), operation.warnings.length > 0 && (_jsx(Box, { marginTop: 1, flexDirection: "column", children: operation.warnings.map((warning, index) => (_jsxs(Box, { flexDirection: "row", children: [_jsx(Text, { color: theme.status.warning, children: "\u26A0 " }), _jsx(Text, { color: theme.status.warning, children: warning })] }, index))) })), operation.errors.length > 0 && (_jsx(Box, { marginTop: 1, flexDirection: "column", children: operation.errors.map((error, index) => (_jsxs(Box, { flexDirection: "row", children: [_jsx(Text, { color: theme.status.error, children: "\u2717 " }), _jsx(Text, { color: theme.status.error, children: error })] }, index))) })), showIntermediateResults && operation.intermediateResults.length > 0 && (_jsxs(Box, { marginTop: 1, flexDirection: "column", children: [_jsx(Text, { color: theme.text.secondary, children: "Recent results:" }), operation.intermediateResults.slice(-3).map((result, index) => (_jsx(Box, { marginLeft: 2, children: _jsxs(Text, { color: theme.text.muted, children: ["\u2022 ", formatIntermediateResult(result)] }) }, index))), operation.intermediateResults.length > 3 && (_jsx(Box, { marginLeft: 2, children: _jsxs(Text, { color: theme.text.muted, children: ["... and ", operation.intermediateResults.length - 3, " more"] }) }))] })), operation.context.metadata &&
                Object.keys(operation.context.metadata).length > 0 &&
                !isNarrow && (_jsx(Box, { marginTop: 1, children: _jsxs(Text, { color: theme.text.muted, children: ["Details: ", formatMetadata(operation.context.metadata)] }) }))] }));
};
/**
 * Utility functions for formatting and display
 */
/**
 * Extracts the filename from a file path.
 * Returns just the filename portion without directory paths.
 *
 * @param filePath - The full file path
 * @returns The filename portion or fallback text
 */
function getFileName(filePath) {
    if (!filePath)
        return 'file';
    return filePath.split('/').pop() || filePath;
}
/**
 * Formats intermediate results for compact display.
 * Converts various result types into short, readable strings.
 *
 * @param result - The intermediate result data to format
 * @returns A short string representation of the result
 */
function formatIntermediateResult(result) {
    if (typeof result === 'string') {
        return result.length > 50 ? result.substring(0, 47) + '...' : result;
    }
    if (typeof result === 'object' && result !== null) {
        const obj = result;
        if ('stepId' in obj && 'result' in obj) {
            return formatIntermediateResult(obj['result']);
        }
        const keys = Object.keys(obj);
        if (keys.length === 1 && typeof obj[keys[0]] === 'string') {
            return String(obj[keys[0]]);
        }
        return `{${keys.slice(0, 2).join(', ')}${keys.length > 2 ? '...' : ''}}`;
    }
    return String(result);
}
/**
 * Formats operation metadata for display.
 * Converts metadata object into a readable string with truncation.
 *
 * @param metadata - The metadata object to format
 * @returns A formatted string representation of the metadata
 */
function formatMetadata(metadata) {
    const entries = Object.entries(metadata);
    const formatted = entries.slice(0, 2).map(([key, value]) => {
        const valueStr = typeof value === 'string' ? value : String(value);
        return `${key}: ${valueStr.length > 20 ? valueStr.substring(0, 17) + '...' : valueStr}`;
    });
    return formatted.join(', ') + (entries.length > 2 ? '...' : '');
}
//# sourceMappingURL=ToolExecutionDisplay.js.map