/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { ThoughtSummary } from '@google/gemini-cli-core';
import type React from 'react';
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

interface LoadingIndicatorProps {
  currentLoadingPhrase?: string;
  elapsedTime: number;
  rightContent?: React.ReactNode;
  thought?: ThoughtSummary | null;
}

export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  currentLoadingPhrase,
  elapsedTime,
  rightContent,
  thought,
}) => {
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
  const primaryText =
    thought?.subject ||
    primaryOperation?.steps[primaryOperation.currentStepIndex]?.description ||
    (contextualPhrase.isSpecific ? contextualPhrase.message : undefined) ||
    currentLoadingPhrase ||
    contextualPhrase.message;

  // Enhanced cancel and timer content with progress info
  const getTimerContent = () => {
    if (streamingState === StreamingState.WaitingForConfirmation) {
      return null;
    }

    const timeStr =
      elapsedTime < 60 ? `${elapsedTime}s` : formatDuration(elapsedTime * 1000);
    const baseContent = `(esc to cancel, ${timeStr}`;

    // Add progress info if available
    if (primaryOperation) {
      const { overallProgress, estimatedTimeRemaining } = primaryOperation;

      if (overallProgress > 0) {
        const progressStr = `${overallProgress}%`;
        if (estimatedTimeRemaining && estimatedTimeRemaining > 1000) {
          const remainingStr = formatDuration(estimatedTimeRemaining);
          return `${baseContent}, ${progressStr}, ~${remainingStr} left)`;
        } else {
          return `${baseContent}, ${progressStr})`;
        }
      }
    }

    return `${baseContent})`;
  };

  const cancelAndTimerContent = getTimerContent();

  return (
    <Box paddingLeft={0} flexDirection="column">
      {/* Main loading line */}
      <Box
        width="100%"
        flexDirection={isNarrow ? 'column' : 'row'}
        alignItems={isNarrow ? 'flex-start' : 'center'}
      >
        <Box>
          <Box marginRight={1}>
            <GeminiRespondingSpinner
              nonRespondingDisplay={
                streamingState === StreamingState.WaitingForConfirmation
                  ? '⠏'
                  : ''
              }
            />
          </Box>
          {primaryText && <Text color={theme.text.accent}>{primaryText}</Text>}
          {!isNarrow && cancelAndTimerContent && (
            <Text color={theme.text.secondary}> {cancelAndTimerContent}</Text>
          )}
        </Box>
        {!isNarrow && <Box flexGrow={1}>{/* Spacer */}</Box>}
        {!isNarrow && rightContent && <Box>{rightContent}</Box>}
      </Box>

      {/* Progress bar for active operation */}
      {primaryOperation && primaryOperation.overallProgress > 0 && (
        <Box marginTop={isNarrow ? 1 : 0}>
          <Text color={theme.text.secondary}>
            Progress: {createProgressBar(primaryOperation.overallProgress)}{' '}
            {primaryOperation.overallProgress}%
          </Text>
          {primaryOperation.steps.length > 1 && (
            <Text color={theme.text.muted}>
              {' '}
              (Step {primaryOperation.currentStepIndex + 1} of{' '}
              {primaryOperation.steps.length})
            </Text>
          )}
        </Box>
      )}

      {/* Interactive hint for progress panel */}
      {primaryOperation && !isNarrow && (
        <Box marginTop={1}>
          <Text color={theme.text.muted}>
            {'Tab for details, Space to pause/resume'}
          </Text>
        </Box>
      )}

      {/* Narrow layout bottom content */}
      {isNarrow && cancelAndTimerContent && (
        <Box>
          <Text color={theme.text.secondary}>{cancelAndTimerContent}</Text>
        </Box>
      )}
      {isNarrow && rightContent && <Box>{rightContent}</Box>}
    </Box>
  );
};

/**
 * Create a simple progress bar visualization
 */
function createProgressBar(progress: number, width: number = 20): string {
  const filled = Math.round((progress / 100) * width);
  const empty = width - filled;
  return '█'.repeat(filled) + '░'.repeat(empty);
}
