/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { jsxs as _jsxs, jsx as _jsx } from 'react/jsx-runtime';
import { Box, Text } from 'ink';
import { theme } from '../semantic-colors.js';
import { useTerminalSize } from '../hooks/useTerminalSize.js';
import { isNarrowWidth } from '../utils/isNarrowWidth.js';
export const ProgressBar = ({
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
  return _jsxs(Box, {
    flexDirection: 'row',
    alignItems: 'center',
    children: [
      label &&
        _jsx(Box, {
          marginRight: 1,
          children: _jsxs(Text, {
            color: theme.text.secondary,
            children: [label, ':'],
          }),
        }),
      _jsxs(Box, {
        flexDirection: 'row',
        alignItems: 'center',
        children: [
          _jsx(Text, { color: barColor, children: barVisualization }),
          showPercentage &&
            _jsx(Box, {
              marginLeft: 1,
              children: _jsxs(Text, {
                color: theme.text.secondary,
                children: [normalizedProgress, '%'],
              }),
            }),
        ],
      }),
    ],
  });
};
export const StepIndicator = ({
  currentStep,
  totalSteps,
  steps,
  compact = false,
  showLabels = true,
}) => {
  const { columns: terminalWidth } = useTerminalSize();
  const isNarrow = isNarrowWidth(terminalWidth);
  const getStepIcon = (stepIndex, stepState) => {
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
  const getStepColor = (stepIndex, stepState) => {
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
    return _jsxs(Box, {
      flexDirection: 'row',
      alignItems: 'center',
      children: [
        _jsx(Text, { color: theme.text.secondary, children: 'Step ' }),
        _jsx(Text, { color: theme.text.accent, children: currentStep + 1 }),
        _jsxs(Text, {
          color: theme.text.secondary,
          children: [' of ', totalSteps],
        }),
        steps &&
          steps[currentStep] &&
          _jsxs(Text, {
            color: theme.text.muted,
            children: [' ', '- ', steps[currentStep].description],
          }),
      ],
    });
  }
  const maxStepsToShow = isNarrow ? 5 : 8;
  const shouldTruncate = totalSteps > maxStepsToShow;
  let stepIndicesToShow;
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
  return _jsxs(Box, {
    flexDirection: 'column',
    children: [
      _jsxs(Box, {
        flexDirection: 'row',
        alignItems: 'center',
        children: [
          shouldTruncate &&
            stepIndicesToShow[0] > 0 &&
            _jsx(Text, { color: theme.text.muted, children: '... ' }),
          stepIndicesToShow.map((stepIndex, arrayIndex) =>
            _jsxs(
              Box,
              {
                flexDirection: 'row',
                alignItems: 'center',
                children: [
                  _jsx(Text, {
                    color: getStepColor(stepIndex, steps?.[stepIndex]?.state),
                    children: getStepIcon(stepIndex, steps?.[stepIndex]?.state),
                  }),
                  arrayIndex < stepIndicesToShow.length - 1 &&
                    _jsx(Text, { color: theme.text.muted, children: '\u2500' }),
                ],
              },
              stepIndex,
            ),
          ),
          shouldTruncate &&
            stepIndicesToShow[stepIndicesToShow.length - 1] < totalSteps - 1 &&
            _jsx(Text, { color: theme.text.muted, children: ' ...' }),
          _jsx(Box, {
            marginLeft: 2,
            children: _jsxs(Text, {
              color: theme.text.secondary,
              children: ['(', currentStep + 1, '/', totalSteps, ')'],
            }),
          }),
        ],
      }),
      showLabels &&
        steps &&
        steps[currentStep] &&
        _jsx(Box, {
          marginTop: 1,
          children: _jsxs(Text, {
            color: theme.text.accent,
            children: ['Current: ', steps[currentStep].description],
          }),
        }),
    ],
  });
};
export const MultiProgressBar = ({
  operations,
  compact = false,
  maxVisible = 5,
}) => {
  const { columns: terminalWidth } = useTerminalSize();
  const isNarrow = isNarrowWidth(terminalWidth);
  const getStateColor = (state) => {
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
  const getStateIcon = (state) => {
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
    return _jsxs(Box, {
      flexDirection: 'row',
      alignItems: 'center',
      children: [
        _jsxs(Text, {
          color: theme.text.secondary,
          children: [
            activeOps.length,
            ' active, ',
            completedOps.length,
            ' complete',
          ],
        }),
        operations.length > completedOps.length + activeOps.length &&
          _jsxs(Text, {
            color: theme.status.warning,
            children: [
              ', ',
              operations.length - completedOps.length - activeOps.length,
              ' other',
            ],
          }),
      ],
    });
  }
  return _jsxs(Box, {
    flexDirection: 'column',
    children: [
      visibleOps.map((operation) =>
        _jsxs(
          Box,
          {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 1,
            children: [
              _jsx(Text, {
                color: getStateColor(operation.state),
                children: getStateIcon(operation.state),
              }),
              _jsx(Box, {
                marginLeft: 1,
                flexGrow: 1,
                children: _jsx(Text, {
                  color:
                    operation.state === 'in_progress'
                      ? theme.text.accent
                      : theme.text.secondary,
                  dimColor: operation.state !== 'in_progress',
                  children: operation.label,
                }),
              }),
              operation.progress > 0 &&
                _jsx(Box, {
                  marginLeft: 1,
                  children: _jsx(ProgressBar, {
                    progress: operation.progress,
                    showPercentage: !isNarrow,
                    width: isNarrow ? 10 : 15,
                    color: 'auto',
                    style: 'minimal',
                  }),
                }),
            ],
          },
          operation.id,
        ),
      ),
      hiddenCount > 0 &&
        _jsx(Box, {
          children: _jsxs(Text, {
            color: theme.text.muted,
            children: ['... and ', hiddenCount, ' more operations'],
          }),
        }),
    ],
  });
};
//# sourceMappingURL=ProgressBar.js.map
