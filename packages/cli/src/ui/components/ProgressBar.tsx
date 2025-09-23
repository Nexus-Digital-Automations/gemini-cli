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

export interface ProgressBarProps {
  progress: number; // 0-100
  label?: string;
  showPercentage?: boolean;
  width?: number;
  color?: 'auto' | 'success' | 'warning' | 'error' | 'accent';
  style?: 'filled' | 'blocks' | 'dots' | 'minimal';
  animated?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  label,
  showPercentage = true,
  width,
  color = 'auto',
  style = 'filled',
  animated: _animated = false,
}) => {
  const { columns: terminalWidth } = useTerminalSize();
  const isNarrow = isNarrowWidth(terminalWidth);

  // Determine width based on terminal size if not specified
  const barWidth = width || (isNarrow ? 15 : 25);

  // Normalize progress
  const normalizedProgress = Math.max(0, Math.min(100, progress));

  // Determine color based on progress and color prop
  const getBarColor = () => {
    if (color !== 'auto') {
      switch (color) {
        case 'success':
          return theme.status.success;
        case 'warning':
          return theme.status.warning;
        case 'error':
          return theme.status.error;
        case 'accent':
          return theme.text.accent;
        default:
          return theme.text.primary;
      }
    }

    // Auto color based on progress
    if (normalizedProgress >= 100) return theme.status.success;
    if (normalizedProgress >= 75) return theme.text.accent;
    if (normalizedProgress >= 50) return theme.status.warning;
    return theme.text.secondary;
  };

  // Create progress bar visualization
  const createBar = () => {
    const filled = Math.round((normalizedProgress / 100) * barWidth);
    const empty = barWidth - filled;

    switch (style) {
      case 'blocks':
        return '█'.repeat(filled) + '░'.repeat(empty);

      case 'dots':
        return '●'.repeat(filled) + '○'.repeat(empty);

      case 'minimal':
        return '▓'.repeat(filled) + '▒'.repeat(empty);

      case 'filled':
      default:
        return '█'.repeat(filled) + '░'.repeat(empty);
    }
  };

  const barColor = getBarColor();
  const barVisualization = createBar();

  return (
    <Box flexDirection="row" alignItems="center">
      {label && (
        <Box marginRight={1}>
          <Text color={theme.text.secondary}>{label}:</Text>
        </Box>
      )}

      <Box flexDirection="row" alignItems="center">
        <Text color={barColor}>{barVisualization}</Text>

        {showPercentage && (
          <Box marginLeft={1}>
            <Text color={theme.text.secondary}>{normalizedProgress}%</Text>
          </Box>
        )}
      </Box>
    </Box>
  );
};

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

export const StepIndicator: React.FC<StepIndicatorProps> = ({
  currentStep,
  totalSteps,
  steps,
  compact = false,
  showLabels = true,
}) => {
  const { columns: terminalWidth } = useTerminalSize();
  const isNarrow = isNarrowWidth(terminalWidth);

  const getStepIcon = (stepIndex: number, stepState?: string) => {
    if (steps && stepState) {
      switch (stepState) {
        case 'completed':
          return '✓';
        case 'failed':
          return '✗';
        case 'cancelled':
          return '⊗';
        case 'in_progress':
          return '▶';
        default:
          return '○';
      }
    }

    if (stepIndex < currentStep) return '✓';
    if (stepIndex === currentStep) return '▶';
    return '○';
  };

  const getStepColor = (stepIndex: number, stepState?: string) => {
    if (steps && stepState) {
      switch (stepState) {
        case 'completed':
          return theme.status.success;
        case 'failed':
          return theme.status.error;
        case 'cancelled':
          return theme.status.warning;
        case 'in_progress':
          return theme.text.accent;
        default:
          return theme.text.secondary;
      }
    }

    if (stepIndex < currentStep) return theme.status.success;
    if (stepIndex === currentStep) return theme.text.accent;
    return theme.text.secondary;
  };

  if (compact) {
    return (
      <Box flexDirection="row" alignItems="center">
        <Text color={theme.text.secondary}>Step </Text>
        <Text color={theme.text.accent}>{currentStep + 1}</Text>
        <Text color={theme.text.secondary}> of {totalSteps}</Text>
        {steps && steps[currentStep] && (
          <Text color={theme.text.muted}>
            {' '}
            - {steps[currentStep].description}
          </Text>
        )}
      </Box>
    );
  }

  const maxStepsToShow = isNarrow ? 5 : 8;
  const shouldTruncate = totalSteps > maxStepsToShow;

  let stepIndicesToShow: number[];
  if (shouldTruncate) {
    // Show current step and surrounding steps
    const startIndex = Math.max(
      0,
      currentStep - Math.floor(maxStepsToShow / 2),
    );
    const endIndex = Math.min(totalSteps, startIndex + maxStepsToShow);
    stepIndicesToShow = Array.from(
      { length: endIndex - startIndex },
      (_, i) => startIndex + i,
    );
  } else {
    stepIndicesToShow = Array.from({ length: totalSteps }, (_, i) => i);
  }

  return (
    <Box flexDirection="column">
      {/* Step indicators */}
      <Box flexDirection="row" alignItems="center">
        {shouldTruncate && stepIndicesToShow[0] > 0 && (
          <Text color={theme.text.muted}>... </Text>
        )}

        {stepIndicesToShow.map((stepIndex, arrayIndex) => (
          <Box key={stepIndex} flexDirection="row" alignItems="center">
            <Text color={getStepColor(stepIndex, steps?.[stepIndex]?.state)}>
              {getStepIcon(stepIndex, steps?.[stepIndex]?.state)}
            </Text>

            {arrayIndex < stepIndicesToShow.length - 1 && (
              <Text color={theme.text.muted}>─</Text>
            )}
          </Box>
        ))}

        {shouldTruncate &&
          stepIndicesToShow[stepIndicesToShow.length - 1] < totalSteps - 1 && (
            <Text color={theme.text.muted}> ...</Text>
          )}

        <Box marginLeft={2}>
          <Text color={theme.text.secondary}>
            ({currentStep + 1}/{totalSteps})
          </Text>
        </Box>
      </Box>

      {/* Current step label */}
      {showLabels && steps && steps[currentStep] && (
        <Box marginTop={1}>
          <Text color={theme.text.accent}>
            Current: {steps[currentStep].description}
          </Text>
        </Box>
      )}
    </Box>
  );
};

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

export const MultiProgressBar: React.FC<MultiProgressBarProps> = ({
  operations,
  compact = false,
  maxVisible = 5,
}) => {
  const { columns: terminalWidth } = useTerminalSize();
  const isNarrow = isNarrowWidth(terminalWidth);

  const getStateColor = (state: string) => {
    switch (state) {
      case 'completed':
        return theme.status.success;
      case 'failed':
        return theme.status.error;
      case 'cancelled':
        return theme.status.warning;
      case 'in_progress':
        return theme.text.accent;
      default:
        return theme.text.secondary;
    }
  };

  const getStateIcon = (state: string) => {
    switch (state) {
      case 'completed':
        return '✓';
      case 'failed':
        return '✗';
      case 'cancelled':
        return '⊗';
      case 'in_progress':
        return '▶';
      default:
        return '○';
    }
  };

  const visibleOps = operations.slice(0, maxVisible);
  const hiddenCount = Math.max(0, operations.length - maxVisible);

  if (compact) {
    const activeOps = operations.filter((op) => op.state === 'in_progress');
    const completedOps = operations.filter((op) => op.state === 'completed');

    return (
      <Box flexDirection="row" alignItems="center">
        <Text color={theme.text.secondary}>
          {activeOps.length} active, {completedOps.length} complete
        </Text>
        {operations.length > completedOps.length + activeOps.length && (
          <Text color={theme.status.warning}>
            , {operations.length - completedOps.length - activeOps.length} other
          </Text>
        )}
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      {visibleOps.map((operation) => (
        <Box
          key={operation.id}
          flexDirection="row"
          alignItems="center"
          marginBottom={1}
        >
          <Text color={getStateColor(operation.state)}>
            {getStateIcon(operation.state)}
          </Text>
          <Box marginLeft={1} flexGrow={1}>
            <Text
              color={
                operation.state === 'in_progress'
                  ? theme.text.accent
                  : theme.text.secondary
              }
              dimColor={operation.state !== 'in_progress'}
            >
              {operation.label}
            </Text>
          </Box>
          {operation.progress > 0 && (
            <Box marginLeft={1}>
              <ProgressBar
                progress={operation.progress}
                showPercentage={!isNarrow}
                width={isNarrow ? 10 : 15}
                color="auto"
                style="minimal"
              />
            </Box>
          )}
        </Box>
      ))}

      {hiddenCount > 0 && (
        <Box>
          <Text color={theme.text.muted}>
            ... and {hiddenCount} more operations
          </Text>
        </Box>
      )}
    </Box>
  );
};
