/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type React from 'react';
import { Box, Text } from 'ink';
import { theme } from '../semantic-colors.js';
import { useTerminalSize } from '../hooks/useTerminalSize.js';
import { isNarrowWidth } from '../utils/isNarrowWidth.js';
import { formatDuration } from '../utils/formatters.js';
import { useProgress } from '../contexts/ProgressContext.js';
import { ToolExecutionDisplay } from './ToolExecutionDisplay.js';
import { ProgressBar, StepIndicator, MultiProgressBar } from './ProgressBar.js';
import { ToolCallStatus , ProgressState } from '../types.js';
import type { OperationProgress, ProgressInteraction } from '../types.js';

export interface ProgressPanelProps {
  isExpanded: boolean;
  onToggle: () => void;
  maxHeight?: number;
}

export const ProgressPanel: React.FC<ProgressPanelProps> = ({
  isExpanded,
  onToggle: _onToggle,
  maxHeight = 15,
}) => {
  const { columns: terminalWidth } = useTerminalSize();
  const isNarrow = isNarrowWidth(terminalWidth);
  const { activeOperations, primaryOperation, handleInteraction } =
    useProgress();

  if (!primaryOperation && activeOperations.length === 0) {
    return null;
  }

  if (!isExpanded) {
    // Collapsed state - show minimal summary
    return (
      <Box
        flexDirection="column"
        borderStyle="single"
        borderColor={theme.ui.comment}
        paddingX={1}
      >
        <Box
          flexDirection="row"
          alignItems="center"
          justifyContent="space-between"
        >
          <Box flexDirection="row" alignItems="center">
            <Text color={theme.text.accent}>⚙ Progress</Text>
            {activeOperations.length > 1 && (
              <Text color={theme.text.secondary}>
                {' '}
                ({activeOperations.length} active)
              </Text>
            )}
          </Box>
          <Text color={theme.text.muted}>Tab to expand</Text>
        </Box>

        {primaryOperation && (
          <Box marginTop={1}>
            <ProgressBar
              progress={primaryOperation.overallProgress}
              label={primaryOperation.context.description}
              width={isNarrow ? 20 : 30}
              showPercentage={true}
            />
          </Box>
        )}
      </Box>
    );
  }

  // Expanded state - show detailed progress information
  return (
    <Box
      flexDirection="column"
      borderStyle="single"
      borderColor={theme.text.accent}
      paddingX={1}
      paddingY={1}
      height={Math.min(maxHeight, calculateRequiredHeight(activeOperations))}
    >
      {/* Panel header */}
      <Box
        flexDirection="row"
        alignItems="center"
        justifyContent="space-between"
        marginBottom={1}
      >
        <Box flexDirection="row" alignItems="center">
          <Text color={theme.text.accent} bold>
            ⚙ Active Operations
          </Text>
          {activeOperations.length > 0 && (
            <Text color={theme.text.secondary}>
              {' '}
              ({activeOperations.length})
            </Text>
          )}
        </Box>
        <Box flexDirection="row" alignItems="center">
          <Text color={theme.text.muted}>Tab to collapse</Text>
          {primaryOperation?.canPause && (
            <Text color={theme.text.muted}> • Space to pause</Text>
          )}
          {primaryOperation?.canCancel && (
            <Text color={theme.text.muted}> • Esc to cancel</Text>
          )}
        </Box>
      </Box>

      {/* Primary operation details */}
      {primaryOperation && (
        <Box
          flexDirection="column"
          marginBottom={activeOperations.length > 1 ? 1 : 0}
        >
          <Box flexDirection="row" alignItems="center" marginBottom={1}>
            <Text color={theme.text.accent} bold>
              Primary Operation
            </Text>
            <OperationControls
              operation={primaryOperation}
              onInteraction={handleInteraction}
            />
          </Box>

          <ToolExecutionDisplay
            operation={primaryOperation}
            toolCallStatus={getToolCallStatus(primaryOperation)}
            showSteps={true}
            showIntermediateResults={true}
          />

          {primaryOperation.steps.length > 1 && (
            <Box marginTop={1}>
              <StepIndicator
                currentStep={primaryOperation.currentStepIndex}
                totalSteps={primaryOperation.steps.length}
                steps={primaryOperation.steps.map((step) => ({
                  id: step.id,
                  description: step.description,
                  state: mapProgressStateToStepState(step.state),
                }))}
                compact={isNarrow}
                showLabels={!isNarrow}
              />
            </Box>
          )}
        </Box>
      )}

      {/* Other active operations */}
      {activeOperations.length > 1 && (
        <Box flexDirection="column">
          <Box marginBottom={1}>
            <Text color={theme.text.secondary} bold>
              Other Operations
            </Text>
          </Box>
          <MultiProgressBar
            operations={activeOperations
              .filter((op) => op.operationId !== primaryOperation?.operationId)
              .map((op) => ({
                id: op.operationId,
                label: op.context.description,
                progress: op.overallProgress,
                state: mapProgressStateToStepState(op.state),
              }))}
            compact={isNarrow}
            maxVisible={isNarrow ? 3 : 5}
          />
        </Box>
      )}

      {/* Summary statistics */}
      <Box
        marginTop={1}
        paddingTop={1}
        borderTop
        borderColor={theme.ui.comment}
      >
        <ProgressSummary operations={activeOperations} />
      </Box>
    </Box>
  );
};

interface OperationControlsProps {
  operation: OperationProgress;
  onInteraction: (interaction: ProgressInteraction) => boolean;
}

const OperationControls: React.FC<OperationControlsProps> = ({
  operation,
  onInteraction: _onInteraction,
}) => {
  const isPaused = operation.state === ProgressState.Paused;
  const canPause =
    operation.canPause && operation.state === ProgressState.InProgress;
  const canResume = operation.canPause && isPaused;
  const canCancel = operation.canCancel;

  if (!canPause && !canResume && !canCancel) {
    return null;
  }

  return (
    <Box flexDirection="row" alignItems="center" marginLeft={2}>
      {canPause && (
        <Box marginRight={1}>
          <Text color={theme.text.muted}>[Space: Pause]</Text>
        </Box>
      )}
      {canResume && (
        <Box marginRight={1}>
          <Text color={theme.status.warning}>[Space: Resume]</Text>
        </Box>
      )}
      {canCancel && (
        <Box>
          <Text color={theme.text.muted}>[Esc: Cancel]</Text>
        </Box>
      )}
    </Box>
  );
};

interface ProgressSummaryProps {
  operations: OperationProgress[];
}

const ProgressSummary: React.FC<ProgressSummaryProps> = ({ operations }) => {
  const totalOperations = operations.length;
  const completedOps = operations.filter(
    (op) => op.state === ProgressState.Completed,
  );
  const failedOps = operations.filter(
    (op) => op.state === ProgressState.Failed,
  );
  const cancelledOps = operations.filter(
    (op) => op.state === ProgressState.Cancelled,
  );
  const activeOps = operations.filter(
    (op) =>
      op.state === ProgressState.InProgress ||
      op.state === ProgressState.Initializing,
  );

  const totalProgress =
    totalOperations > 0
      ? Math.round(
          operations.reduce((sum, op) => sum + op.overallProgress, 0) /
            totalOperations,
        )
      : 0;

  const totalElapsed = operations.reduce((max, op) => {
    const elapsed = Date.now() - op.context.startTime.getTime();
    return Math.max(max, elapsed);
  }, 0);

  const estimatedRemaining = operations
    .filter((op) => op.estimatedTimeRemaining)
    .reduce((max, op) => Math.max(max, op.estimatedTimeRemaining || 0), 0);

  return (
    <Box flexDirection="column">
      <Box
        flexDirection="row"
        alignItems="center"
        justifyContent="space-between"
      >
        <Box flexDirection="row" alignItems="center">
          <Text color={theme.text.secondary}>Overall Progress:</Text>
          <Box marginLeft={1}>
            <ProgressBar
              progress={totalProgress}
              showPercentage={true}
              width={15}
              style="minimal"
            />
          </Box>
        </Box>

        <Box flexDirection="row" alignItems="center">
          <Text color={theme.text.muted}>
            Elapsed: {formatDuration(totalElapsed)}
          </Text>
          {estimatedRemaining > 0 && (
            <Text color={theme.text.muted}>
              {' '}
              • ETA: {formatDuration(estimatedRemaining)}
            </Text>
          )}
        </Box>
      </Box>

      <Box flexDirection="row" alignItems="center" marginTop={1}>
        <Text color={theme.text.secondary}>Status: </Text>
        {activeOps.length > 0 && (
          <Text color={theme.text.accent}>{activeOps.length} active</Text>
        )}
        {completedOps.length > 0 && (
          <Text color={theme.status.success}>
            {activeOps.length > 0 ? ', ' : ''}
            {completedOps.length} completed
          </Text>
        )}
        {failedOps.length > 0 && (
          <Text color={theme.status.error}>
            {activeOps.length + completedOps.length > 0 ? ', ' : ''}
            {failedOps.length} failed
          </Text>
        )}
        {cancelledOps.length > 0 && (
          <Text color={theme.status.warning}>
            {activeOps.length + completedOps.length + failedOps.length > 0
              ? ', '
              : ''}
            {cancelledOps.length} cancelled
          </Text>
        )}
      </Box>
    </Box>
  );
};

// Utility functions

/**
 * Maps ProgressState enum to the string literal type expected by UI components
 */
function mapProgressStateToStepState(
  state: ProgressState,
): 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled' {
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

function getToolCallStatus(operation: OperationProgress): ToolCallStatus {
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

function calculateRequiredHeight(operations: OperationProgress[]): number {
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
