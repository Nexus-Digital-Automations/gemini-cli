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
import type { OperationProgress, ToolCallStatus } from '../types.js';

export interface ToolExecutionDisplayProps {
  operation: OperationProgress;
  toolCallStatus: ToolCallStatus;
  compact?: boolean;
  showSteps?: boolean;
  showIntermediateResults?: boolean;
}

export const ToolExecutionDisplay: React.FC<ToolExecutionDisplayProps> = ({
  operation,
  toolCallStatus,
  compact = false,
  showSteps = true,
  showIntermediateResults = false,
}) => {
  const { columns: terminalWidth } = useTerminalSize();
  const isNarrow = isNarrowWidth(terminalWidth);

  const getStatusColor = (status: ToolCallStatus) => {
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

  const getProgressColor = (progress: number) => {
    if (progress >= 100) return theme.status.success;
    if (progress >= 75) return theme.text.accent;
    if (progress >= 50) return theme.status.warning;
    return theme.text.secondary;
  };

  const createProgressBar = (progress: number, width: number = 20) => {
    const filled = Math.round((progress / 100) * width);
    const empty = width - filled;
    return '█'.repeat(filled) + '░'.repeat(empty);
  };

  if (compact) {
    return (
      <Box flexDirection="row" alignItems="center">
        <Text>{getOperationStatusIndicator()} </Text>
        <Text color={getStatusColor(toolCallStatus)}>
          {operation.context.description}
        </Text>
        {operation.overallProgress > 0 && (
          <Text color={theme.text.secondary}>
            {' '}
            ({operation.overallProgress}%)
          </Text>
        )}
      </Box>
    );
  }

  return (
    <Box flexDirection="column" paddingLeft={1} paddingRight={1}>
      {/* Operation header */}
      <Box flexDirection="row" alignItems="center">
        <Text>{getOperationStatusIndicator()} </Text>
        <Text color={getStatusColor(toolCallStatus)} bold>
          {operation.context.description}
        </Text>
        {operation.context.targetFiles &&
          operation.context.targetFiles.length === 1 && (
            <Text color={theme.text.muted}>
              {' '}
              → {getFileName(operation.context.targetFiles[0])}
            </Text>
          )}
      </Box>

      {/* Progress bar */}
      {operation.overallProgress > 0 && (
        <Box marginTop={1}>
          <Text color={getProgressColor(operation.overallProgress)}>
            {createProgressBar(operation.overallProgress, isNarrow ? 15 : 25)}{' '}
            {operation.overallProgress}%
          </Text>
          {operation.estimatedTimeRemaining &&
            operation.estimatedTimeRemaining > 1000 && (
              <Text color={theme.text.muted}>
                {' '}
                (~{formatDuration(operation.estimatedTimeRemaining)} left)
              </Text>
            )}
        </Box>
      )}

      {/* Multiple target files */}
      {operation.context.targetFiles &&
        operation.context.targetFiles.length > 1 && (
          <Box marginTop={1}>
            <Text color={theme.text.secondary}>
              Files:{' '}
              {operation.context.targetFiles
                .slice(0, 3)
                .map((f) => getFileName(f))
                .join(', ')}
              {operation.context.targetFiles.length > 3 && (
                <Text color={theme.text.muted}>
                  {' '}
                  +{operation.context.targetFiles.length - 3} more
                </Text>
              )}
            </Text>
          </Box>
        )}

      {/* Operation steps */}
      {showSteps && operation.steps.length > 0 && (
        <Box marginTop={1} flexDirection="column">
          {operation.steps.map((step, index) => {
            const isCurrent = index === operation.currentStepIndex;
            const isCompleted = step.state === 'completed';
            const isFailed = step.state === 'failed';

            return (
              <Box key={step.id} flexDirection="row" alignItems="center">
                <Text color={theme.text.secondary}>
                  {isCompleted ? '✓' : isFailed ? '✗' : isCurrent ? '▶' : '○'}
                </Text>
                <Text
                  color={
                    isCompleted
                      ? theme.status.success
                      : isFailed
                        ? theme.status.error
                        : isCurrent
                          ? theme.text.accent
                          : theme.text.secondary
                  }
                  dimColor={!isCurrent && !isCompleted && !isFailed}
                >
                  {' '}
                  {step.description}
                </Text>
                {step.progress !== undefined &&
                  step.progress > 0 &&
                  step.progress < 100 && (
                    <Text color={theme.text.muted}> ({step.progress}%)</Text>
                  )}
                {step.error && (
                  <Text color={theme.status.error}> - {step.error}</Text>
                )}
              </Box>
            );
          })}
        </Box>
      )}

      {/* Warnings */}
      {operation.warnings.length > 0 && (
        <Box marginTop={1} flexDirection="column">
          {operation.warnings.map((warning, index) => (
            <Box key={index} flexDirection="row">
              <Text color={theme.status.warning}>⚠ </Text>
              <Text color={theme.status.warning}>{warning}</Text>
            </Box>
          ))}
        </Box>
      )}

      {/* Errors */}
      {operation.errors.length > 0 && (
        <Box marginTop={1} flexDirection="column">
          {operation.errors.map((error, index) => (
            <Box key={index} flexDirection="row">
              <Text color={theme.status.error}>✗ </Text>
              <Text color={theme.status.error}>{error}</Text>
            </Box>
          ))}
        </Box>
      )}

      {/* Intermediate results */}
      {showIntermediateResults && operation.intermediateResults.length > 0 && (
        <Box marginTop={1} flexDirection="column">
          <Text color={theme.text.secondary}>Recent results:</Text>
          {operation.intermediateResults.slice(-3).map((result, index) => (
            <Box key={index} marginLeft={2}>
              <Text color={theme.text.muted}>
                • {formatIntermediateResult(result)}
              </Text>
            </Box>
          ))}
          {operation.intermediateResults.length > 3 && (
            <Box marginLeft={2}>
              <Text color={theme.text.muted}>
                ... and {operation.intermediateResults.length - 3} more
              </Text>
            </Box>
          )}
        </Box>
      )}

      {/* Operation metadata */}
      {operation.context.metadata &&
        Object.keys(operation.context.metadata).length > 0 &&
        !isNarrow && (
          <Box marginTop={1}>
            <Text color={theme.text.muted}>
              Details: {formatMetadata(operation.context.metadata)}
            </Text>
          </Box>
        )}
    </Box>
  );
};

/**
 * Utility functions
 */

function getFileName(filePath: string): string {
  if (!filePath) return 'file';
  return filePath.split('/').pop() || filePath;
}

function formatIntermediateResult(result: unknown): string {
  if (typeof result === 'string') {
    return result.length > 50 ? result.substring(0, 47) + '...' : result;
  }

  if (typeof result === 'object' && result !== null) {
    const obj = result as Record<string, unknown>;
    if ('stepId' in obj && 'result' in obj) {
      return formatIntermediateResult(obj.result);
    }

    const keys = Object.keys(obj);
    if (keys.length === 1 && typeof obj[keys[0]] === 'string') {
      return String(obj[keys[0]]);
    }

    return `{${keys.slice(0, 2).join(', ')}${keys.length > 2 ? '...' : ''}}`;
  }

  return String(result);
}

function formatMetadata(metadata: Record<string, unknown>): string {
  const entries = Object.entries(metadata);
  const formatted = entries.slice(0, 2).map(([key, value]) => {
    const valueStr = typeof value === 'string' ? value : String(value);
    return `${key}: ${valueStr.length > 20 ? valueStr.substring(0, 17) + '...' : valueStr}`;
  });

  return formatted.join(', ') + (entries.length > 2 ? '...' : '');
}
