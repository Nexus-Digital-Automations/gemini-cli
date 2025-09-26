/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Text } from 'ink';
import { theme } from '../semantic-colors.js';
import { useStreamingContext } from '../contexts/StreamingContext.js';
import { StreamingState } from '../types.js';
import { GeminiRespondingSpinner } from './GeminiRespondingSpinner.js';
import { formatDuration } from '../utils/formatters.js';
import { useTerminalSize } from '../hooks/useTerminalSize.js';
import { isNarrowWidth } from '../utils/isNarrowWidth.js';
import { useProgress } from '../contexts/ProgressContext.js';
import { useContextualPhrases } from '../hooks/useContextualPhrases.js';
export const LoadingIndicator = ({ currentLoadingPhrase, elapsedTime, rightContent, thought, }) => {
    const streamingState = useStreamingContext();
    const { columns: terminalWidth } = useTerminalSize();
    const isNarrow = isNarrowWidth(terminalWidth);
    const { primaryOperation } = useProgress();
    // Get contextual phrase based on current operation
    const contextualPhrase = useContextualPhrases(primaryOperation);
    if (streamingState === StreamingState.Idle) {
        return null;
    }
    // Priority order for display text:
    // 1. Thought subject (highest priority)
    // 2. Current step description from active operation
    // 3. Contextual phrase based on operation
    // 4. Provided loading phrase
    // 5. Fallback
    const primaryText = thought?.subject ||
        primaryOperation?.steps[primaryOperation.currentStepIndex]?.description ||
        (contextualPhrase.isSpecific ? contextualPhrase.message : undefined) ||
        currentLoadingPhrase ||
        contextualPhrase.message;
    // Enhanced cancel and timer content with progress info
    const getTimerContent = () => {
        if (streamingState === StreamingState.WaitingForConfirmation) {
            return null;
        }
        const timeStr = elapsedTime < 60 ? `${elapsedTime}s` : formatDuration(elapsedTime * 1000);
        const baseContent = `(esc to cancel, ${timeStr}`;
        // Add progress info if available
        if (primaryOperation) {
            const { overallProgress, estimatedTimeRemaining } = primaryOperation;
            if (overallProgress > 0) {
                const progressStr = `${overallProgress}%`;
                if (estimatedTimeRemaining && estimatedTimeRemaining > 1000) {
                    const remainingStr = formatDuration(estimatedTimeRemaining);
                    return `${baseContent}, ${progressStr}, ~${remainingStr} left)`;
                }
                else {
                    return `${baseContent}, ${progressStr})`;
                }
            }
        }
        return `${baseContent})`;
    };
    const cancelAndTimerContent = getTimerContent();
    return (_jsxs(Box, { paddingLeft: 0, flexDirection: "column", children: [_jsxs(Box, { width: "100%", flexDirection: isNarrow ? 'column' : 'row', alignItems: isNarrow ? 'flex-start' : 'center', children: [_jsxs(Box, { children: [_jsx(Box, { marginRight: 1, children: _jsx(GeminiRespondingSpinner, { nonRespondingDisplay: streamingState === StreamingState.WaitingForConfirmation
                                        ? '⠏'
                                        : '' }) }), primaryText && _jsx(Text, { color: theme.text.accent, children: primaryText }), !isNarrow && cancelAndTimerContent && (_jsxs(Text, { color: theme.text.secondary, children: [" ", cancelAndTimerContent] }))] }), !isNarrow && _jsx(Box, { flexGrow: 1 }), !isNarrow && rightContent && _jsx(Box, { children: rightContent })] }), primaryOperation && primaryOperation.overallProgress > 0 && (_jsxs(Box, { marginTop: isNarrow ? 1 : 0, children: [_jsxs(Text, { color: theme.text.secondary, children: ["Progress: ", createProgressBar(primaryOperation.overallProgress), ' ', primaryOperation.overallProgress, "%"] }), primaryOperation.steps.length > 1 && (_jsxs(Text, { color: theme.text.muted, children: [' ', "(Step ", primaryOperation.currentStepIndex + 1, " of", ' ', primaryOperation.steps.length, ")"] }))] })), primaryOperation && !isNarrow && (_jsx(Box, { marginTop: 1, children: _jsx(Text, { color: theme.text.muted, children: 'Tab for details, Space to pause/resume' }) })), isNarrow && cancelAndTimerContent && (_jsx(Box, { children: _jsx(Text, { color: theme.text.secondary, children: cancelAndTimerContent }) })), isNarrow && rightContent && _jsx(Box, { children: rightContent })] }));
};
/**
 * Create a simple progress bar visualization
 */
function createProgressBar(progress, width = 20) {
    const filled = Math.round((progress / 100) * width);
    const empty = width - filled;
    return '█'.repeat(filled) + '░'.repeat(empty);
}
//# sourceMappingURL=LoadingIndicator.js.map