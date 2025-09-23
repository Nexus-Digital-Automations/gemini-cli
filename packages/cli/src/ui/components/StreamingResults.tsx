/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type React from 'react';
import { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import { theme } from '../semantic-colors.js';
import { useTerminalSize } from '../hooks/useTerminalSize.js';
import { isNarrowWidth } from '../utils/isNarrowWidth.js';
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
export const StreamingResults: React.FC<StreamingResultsProps> = ({
  operation,
  maxResults = 10,
  maxHeight = 8,
  showTimestamps = true,
  autoScroll = true,
}) => {
  const { columns: terminalWidth } = useTerminalSize();
  const isNarrow = isNarrowWidth(terminalWidth);
  const [displayResults, setDisplayResults] = useState<FormattedResult[]>([]);

  // Convert operation intermediate results to formatted display results
  useEffect(() => {
    const formatted = operation.intermediateResults
      .slice(-maxResults) // Keep only the most recent results
      .map((result, index) => formatResult(result, index, showTimestamps))
      .filter((result) => result !== null) as FormattedResult[];

    setDisplayResults(formatted);

    // Note: Auto-scroll is not supported in Ink components
    // Results are automatically shown in order
    // autoScroll parameter is kept for API compatibility
  }, [operation.intermediateResults, maxResults, showTimestamps, autoScroll]);

  if (displayResults.length === 0) {
    return (
      <Box flexDirection="column" padding={1}>
        <Text color={theme.text.muted} italic>
          No intermediate results yet...
        </Text>
      </Box>
    );
  }

  return (
    <Box
      flexDirection="column"
      borderStyle="single"
      borderColor={theme.ui.comment}
      paddingX={1}
      paddingY={1}
      height={Math.min(maxHeight, displayResults.length + 2)}
    >
      {/* Header */}
      <Box
        flexDirection="row"
        alignItems="center"
        justifyContent="space-between"
        marginBottom={1}
      >
        <Text color={theme.text.accent} bold>
          Live Results
        </Text>
        <Text color={theme.text.muted}>
          {displayResults.length}
          {maxResults < operation.intermediateResults.length
            ? `/${operation.intermediateResults.length}`
            : ''}
        </Text>
      </Box>

      {/* Results list */}
      <Box flexDirection="column">
        {displayResults.map((result, index) => (
          <ResultItem
            key={`${result.stepId}-${index}`}
            result={result}
            isLatest={index === displayResults.length - 1}
            compact={isNarrow}
          />
        ))}
      </Box>

      {/* Scroll indicator */}
      {operation.intermediateResults.length > maxResults && (
        <Box marginTop={1} justifyContent="center">
          <Text color={theme.text.muted}>
            ↑ {operation.intermediateResults.length - maxResults} earlier
            results
          </Text>
        </Box>
      )}
    </Box>
  );
};

/**
 * Represents a formatted result item with metadata for display purposes.
 * Contains the processed result data, type information, and display state.
 */
interface FormattedResult {
  stepId?: string;
  content: string;
  type: 'text' | 'json' | 'error' | 'file' | 'url' | 'number' | 'boolean';
  timestamp?: Date;
  truncated: boolean;
}

/**
 * Props for individual result item components within the streaming results display.
 */
interface ResultItemProps {
  result: FormattedResult;
  isLatest: boolean;
  compact: boolean;
}

/**
 * Renders an individual result item with appropriate styling and type indicators.
 *
 * Displays results with type-specific colors, icons, and formatting.
 * Supports expansion of truncated content and shows metadata like timestamps.
 *
 * @param props - The result item configuration and display options
 * @returns A rendered result item with proper styling and interaction
 */
const ResultItem: React.FC<ResultItemProps> = ({
  result,
  isLatest,
  compact,
}) => {
  const [isExpanded] = useState(false);

  const getTypeColor = (type: FormattedResult['type']) => {
    switch (type) {
      case 'error':
        return theme.status.error;
      case 'file':
        return theme.text.accent;
      case 'url':
        return theme.text.link;
      case 'json':
        return theme.status.warning;
      case 'number':
      case 'boolean':
        return theme.text.secondary;
      default:
        return theme.text.primary;
    }
  };

  const getTypeIcon = (type: FormattedResult['type']) => {
    switch (type) {
      case 'error':
        return '❌';
      case 'file':
        return '📄';
      case 'url':
        return '🔗';
      case 'json':
        return '{}';
      case 'number':
        return '#';
      case 'boolean':
        return '?';
      default:
        return '•';
    }
  };

  const formatTimestamp = (timestamp?: Date) => {
    if (!timestamp) return '';
    return timestamp.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const canExpand = result.truncated && result.content.length > 100;
  const displayContent = isExpanded ? getFullContent(result) : result.content;

  return (
    <Box
      flexDirection="column"
      marginBottom={1}
      paddingLeft={1}
      borderLeft
      borderColor={isLatest ? theme.text.accent : theme.ui.comment}
    >
      {/* Result header */}
      <Box flexDirection="row" alignItems="center">
        <Text color={getTypeColor(result.type)}>
          {getTypeIcon(result.type)}
        </Text>

        {result.stepId && !compact && (
          <Box marginLeft={1}>
            <Text color={theme.text.muted}>[{result.stepId}]</Text>
          </Box>
        )}

        {result.timestamp && !compact && (
          <Box marginLeft={1}>
            <Text color={theme.text.muted}>
              {formatTimestamp(result.timestamp)}
            </Text>
          </Box>
        )}

        {canExpand && (
          <Box marginLeft={1}>
            <Text color={theme.text.link}>
              {isExpanded ? '[collapse]' : '[expand]'}
            </Text>
          </Box>
        )}
      </Box>

      {/* Result content */}
      <Box flexDirection="column" marginTop={1} marginLeft={compact ? 1 : 2}>
        <Text color={getTypeColor(result.type)}>{displayContent}</Text>

        {result.truncated && !isExpanded && (
          <Box marginTop={1}>
            <Text color={theme.text.muted} italic>
              ... content truncated
            </Text>
          </Box>
        )}
      </Box>
    </Box>
  );
};

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
export const LiveUpdateDisplay: React.FC<LiveUpdateDisplayProps> = ({
  updates,
  maxUpdates = 5,
  compact = false,
}) => {
  const recentUpdates = updates.slice(-maxUpdates);

  if (recentUpdates.length === 0) {
    return null;
  }

  return (
    <Box flexDirection="column" padding={1}>
      <Box marginBottom={1}>
        <Text color={theme.text.secondary} bold>
          Recent Updates
        </Text>
      </Box>

      {recentUpdates.map((update, index) => (
        <UpdateItem
          key={`${update.operationId}-${update.timestamp.getTime()}-${index}`}
          update={update}
          compact={compact}
        />
      ))}
    </Box>
  );
};

/**
 * Props for individual update item components within the live update display.
 */
interface UpdateItemProps {
  update: ProgressUpdate;
  compact: boolean;
}

/**
 * Renders an individual progress update item with appropriate icons and formatting.
 *
 * Displays update information with type-specific icons, colors, and content.
 * Supports both compact and full display modes with optional timestamps.
 *
 * @param props - The update item data and display configuration
 * @returns A rendered update item with proper styling
 */
const UpdateItem: React.FC<UpdateItemProps> = ({ update, compact }) => {
  const getUpdateIcon = (type: ProgressUpdate['type']) => {
    switch (type) {
      case 'state_change':
        return '🔄';
      case 'step_progress':
        return '⚡';
      case 'step_complete':
        return '✅';
      case 'intermediate_result':
        return '📄';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      default:
        return '•';
    }
  };

  const getUpdateColor = (type: ProgressUpdate['type']) => {
    switch (type) {
      case 'error':
        return theme.status.error;
      case 'warning':
        return theme.status.warning;
      case 'step_complete':
        return theme.status.success;
      case 'state_change':
      case 'step_progress':
        return theme.text.accent;
      default:
        return theme.text.secondary;
    }
  };

  const formatUpdateData = (update: ProgressUpdate) => {
    const data = update.data as Record<string, unknown>;
    switch (update.type) {
      case 'state_change':
        return `State: ${data?.['state'] || 'unknown'}`;
      case 'step_progress':
        return `Step progress: ${(data?.['step'] as Record<string, unknown>)?.['description'] || 'unknown'}`;
      case 'step_complete':
        return `Completed: ${(data?.['step'] as Record<string, unknown>)?.['description'] || 'step'}`;
      case 'intermediate_result':
        return `Result: ${formatIntermediateResult(data?.['result'])}`;
      case 'error':
        return `Error: ${data?.['error'] || 'unknown error'}`;
      case 'warning':
        return `Warning: ${data?.['warning'] || 'unknown warning'}`;
      default:
        return 'Update received';
    }
  };

  const timestamp = update.timestamp.toLocaleTimeString('en-US', {
    hour12: false,
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <Box flexDirection="row" alignItems="center" marginBottom={compact ? 0 : 1}>
      <Text color={getUpdateColor(update.type)}>
        {getUpdateIcon(update.type)}
      </Text>
      <Box marginLeft={1}>
        <Text color={getUpdateColor(update.type)}>
          {formatUpdateData(update)}
        </Text>
      </Box>
      {!compact && (
        <Box marginLeft={1}>
          <Text color={theme.text.muted}>({timestamp})</Text>
        </Box>
      )}
    </Box>
  );
};

// Utility functions

/**
 * Formats raw operation results into displayable format with type detection.
 *
 * Analyzes the result data to determine its type (text, JSON, file, URL, etc.)
 * and formats it appropriately for display. Handles truncation of long content
 * and preserves metadata like step IDs and timestamps.
 *
 * @param result - The raw result data from an operation
 * @param index - The index of this result in the results array
 * @param showTimestamps - Whether to include timestamp information
 * @returns A formatted result object ready for display, or null if invalid
 */
function formatResult(
  result: unknown,
  index: number,
  showTimestamps: boolean,
): FormattedResult | null {
  if (result === null || result === undefined) {
    return null;
  }

  // Handle wrapped results with metadata
  if (typeof result === 'object' && result !== null) {
    const obj = result as Record<string, unknown>;

    if ('stepId' in obj && 'result' in obj && 'timestamp' in obj) {
      const innerResult = formatResult(obj['result'], index, showTimestamps);
      if (innerResult) {
        return {
          ...innerResult,
          stepId: obj['stepId'] as string,
          timestamp: showTimestamps
            ? new Date(obj['timestamp'] as string)
            : undefined,
        };
      }
    }
  }

  // Determine result type and format content
  let type: FormattedResult['type'] = 'text';
  let content = '';
  let truncated = false;

  if (typeof result === 'string') {
    content = result;

    // Detect special string types
    if (result.startsWith('http://') || result.startsWith('https://')) {
      type = 'url';
    } else if (
      result.includes('/') &&
      (result.endsWith('.js') ||
        result.endsWith('.ts') ||
        result.endsWith('.json'))
    ) {
      type = 'file';
    } else if (result.includes('Error:') || result.includes('Failed:')) {
      type = 'error';
    }
  } else if (typeof result === 'number') {
    type = 'number';
    content = result.toString();
  } else if (typeof result === 'boolean') {
    type = 'boolean';
    content = result.toString();
  } else if (typeof result === 'object') {
    type = 'json';
    try {
      content = JSON.stringify(result, null, 2);
    } catch {
      content = String(result);
    }
  } else {
    content = String(result);
  }

  // Truncate long content
  const maxLength = 200;
  if (content.length > maxLength) {
    content = content.substring(0, maxLength) + '...';
    truncated = true;
  }

  return {
    content,
    type,
    truncated,
  };
}

/**
 * Formats intermediate results for compact display in update items.
 *
 * Converts various result types into short, readable strings suitable
 * for display in progress updates. Truncates long content appropriately.
 *
 * @param result - The intermediate result data to format
 * @returns A short string representation of the result
 */
function formatIntermediateResult(result: unknown): string {
  if (typeof result === 'string') {
    return result.length > 50 ? result.substring(0, 47) + '...' : result;
  }

  if (typeof result === 'object' && result !== null) {
    const str = JSON.stringify(result);
    return str.length > 50 ? str.substring(0, 47) + '...' : str;
  }

  return String(result);
}

/**
 * Retrieves the full content for a truncated result.
 *
 * This function would typically fetch complete content from storage
 * for results that have been truncated due to length limits.
 *
 * @param result - The formatted result that may have truncated content
 * @returns The full content string for display
 *
 * @todo Implement actual full content retrieval from storage
 */
function getFullContent(result: FormattedResult): string {
  // This would typically fetch the full content from storage
  // For now, return the truncated content with a note
  return (
    result.content + '\n\n[Note: Full content display not yet implemented]'
  );
}
