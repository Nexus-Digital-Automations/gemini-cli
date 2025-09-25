/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type React from 'react';
import { Box, Text } from 'ink';
import { theme } from '../../../semantic-colors.js';
import {
  formatCurrency,
  formatTime,
  createProgressBar,
} from '../utils/chartUtils.js';
import type { ChartConfig, CostProjection } from '../types/index.js';

/**
 * Props for the CostProjectionChart component.
 */
interface CostProjectionChartProps {
  /** Cost projection data to visualize */
  projections: CostProjection[];
  /** Chart configuration options */
  config: ChartConfig;
  /** Whether the chart is currently loading */
  loading?: boolean;
  /** Error message if chart failed to load */
  error?: string;
  /** Callback when a projection is selected */
  onProjectionSelect?: (projection: CostProjection) => void;
}

/**
 * Cost Projection Chart Component
 *
 * This component visualizes future cost projections using ASCII-based
 * charts optimized for CLI interfaces. It displays projected spending,
 * confidence intervals, trends, and provides actionable insights for
 * budget planning.
 *
 * Features:
 * - Future cost projections (daily, weekly, monthly)
 * - Confidence interval visualization
 * - Trend direction indicators
 * - Interactive projection selection
 * - Multiple time period comparisons
 * - Budget planning recommendations
 * - Responsive layout for different terminal sizes
 *
 * @param props - Configuration and data for the projection chart
 * @returns Interactive cost projection chart component
 */
export const CostProjectionChart: React.FC<CostProjectionChartProps> = ({
  projections,
  config,
  loading = false,
  error,
  onProjectionSelect: _onProjectionSelect,
}) => {
  // Handle loading state
  if (loading) {
    return (
      <Box
        flexDirection="column"
        borderStyle="single"
        paddingX={2}
        paddingY={1}
        width={config.width}
        height={config.height}
      >
        <Text color={theme.text.secondary} bold>
          {config.title}
        </Text>
        <Box flexGrow={1} justifyContent="center" alignItems="center">
          <Text color={theme.text.muted}>Loading cost projections...</Text>
        </Box>
      </Box>
    );
  }

  // Handle error state
  if (error) {
    return (
      <Box
        flexDirection="column"
        borderStyle="single"
        paddingX={2}
        paddingY={1}
        width={config.width}
        height={config.height}
      >
        <Text color={theme.text.secondary} bold>
          {config.title}
        </Text>
        <Box flexGrow={1} justifyContent="center" alignItems="center">
          <Text color={theme.status.error}>Error: {error}</Text>
        </Box>
      </Box>
    );
  }

  // Handle empty data
  if (projections.length === 0) {
    return (
      <Box
        flexDirection="column"
        borderStyle="single"
        paddingX={2}
        paddingY={1}
        width={config.width}
        height={config.height}
      >
        <Text color={theme.text.secondary} bold>
          {config.title}
        </Text>
        <Box flexGrow={1} justifyContent="center" alignItems="center">
          <Text color={theme.text.muted}>No projection data available</Text>
        </Box>
      </Box>
    );
  }

  // Sort projections by time period for consistent display
  const sortedProjections = [...projections].sort((a, b) => {
    const periodOrder = { daily: 1, weekly: 2, monthly: 3 };
    return periodOrder[a.period] - periodOrder[b.period];
  });

  /**
   * Gets color for trend indication based on direction and confidence.
   */
  const getTrendColor = (projection: CostProjection) => {
    if (projection.confidence < 50) return theme.text.muted;

    switch (projection.trend) {
      case 'increasing':
        return projection.confidence > 80
          ? theme.status.error
          : theme.status.warning;
      case 'decreasing':
        return theme.status.success;
      case 'stable':
        return theme.status.info;
      default:
        return theme.text.secondary;
    }
  };

  /**
   * Gets trend icon based on direction.
   */
  const getTrendIcon = (trend: CostProjection['trend']) => {
    switch (trend) {
      case 'increasing':
        return '↗';
      case 'decreasing':
        return '↘';
      case 'stable':
        return '→';
      default:
        return '─';
    }
  };

  /**
   * Renders projection statistics header.
   */
  const renderProjectionHeader = () => {
    const totalProjected = sortedProjections.reduce(
      (sum, proj) => sum + proj.projectedCost,
      0,
    );
    const avgConfidence =
      sortedProjections.reduce((sum, proj) => sum + proj.confidence, 0) /
      sortedProjections.length;

    const highestProjection = sortedProjections.reduce(
      (max, proj) => (proj.projectedCost > max.projectedCost ? proj : max),
      sortedProjections[0],
    );

    return (
      <Box justifyContent="space-between" marginBottom={1}>
        <Box gap={3}>
          <Box flexDirection="column">
            <Text color={theme.text.muted}>Periods</Text>
            <Text color={theme.text.primary}>{sortedProjections.length}</Text>
          </Box>
          <Box flexDirection="column">
            <Text color={theme.text.muted}>Total Proj.</Text>
            <Text color={theme.text.primary}>
              {formatCurrency(totalProjected)}
            </Text>
          </Box>
          <Box flexDirection="column">
            <Text color={theme.text.muted}>Avg. Confidence</Text>
            <Text
              color={
                avgConfidence > 80
                  ? theme.status.success
                  : avgConfidence > 60
                    ? theme.status.warning
                    : theme.status.error
              }
            >
              {avgConfidence.toFixed(1)}%
            </Text>
          </Box>
          <Box flexDirection="column">
            <Text color={theme.text.muted}>Highest</Text>
            <Text color={theme.status.warning}>
              {formatCurrency(highestProjection.projectedCost)}
            </Text>
          </Box>
        </Box>
      </Box>
    );
  };

  /**
   * Renders a compact projection summary.
   */
  const renderCompactProjections = () => (
    <Box flexDirection="column" gap={1}>
      {sortedProjections.map((projection, index) => (
        <Box key={index} justifyContent="space-between" alignItems="center">
          <Box gap={2} alignItems="center">
            <Text color={theme.text.primary} bold>
              {projection.period.charAt(0).toUpperCase() +
                projection.period.slice(1)}
            </Text>
            <Text color={getTrendColor(projection)}>
              {getTrendIcon(projection.trend)} {projection.trend}
            </Text>
          </Box>
          <Box gap={2} alignItems="center">
            <Text color={theme.text.secondary}>
              {formatCurrency(projection.projectedCost)}
            </Text>
            <Text color={theme.text.muted}>
              ({projection.confidence.toFixed(0)}%)
            </Text>
          </Box>
        </Box>
      ))}
    </Box>
  );

  /**
   * Renders detailed projection analysis with confidence bars.
   */
  const renderDetailedProjections = () => (
    <Box flexDirection="column">
      {sortedProjections.map((projection, index) => {
        const confidenceColor =
          projection.confidence > 80
            ? theme.status.success
            : projection.confidence > 60
              ? theme.status.warning
              : theme.status.error;

        return (
          <Box key={index} flexDirection="column" marginBottom={2}>
            {/* Projection header */}
            <Box
              justifyContent="space-between"
              alignItems="center"
              marginBottom={1}
            >
              <Text color={theme.text.primary} bold>
                {projection.period.charAt(0).toUpperCase() +
                  projection.period.slice(1)}{' '}
                Projection
              </Text>
              <Text color={theme.text.secondary}>
                {formatTime(projection.projectionRange.start)} -{' '}
                {formatTime(projection.projectionRange.end)}
              </Text>
            </Box>

            {/* Cost and trend */}
            <Box
              justifyContent="space-between"
              alignItems="center"
              marginBottom={1}
            >
              <Box gap={2} alignItems="center">
                <Text color={theme.text.primary}>
                  Cost: {formatCurrency(projection.projectedCost)}
                </Text>
                <Text color={getTrendColor(projection)}>
                  {getTrendIcon(projection.trend)} {projection.trend}
                </Text>
              </Box>
              <Text color={theme.text.muted}>
                Based on {projection.basedOnDays} days
              </Text>
            </Box>

            {/* Confidence bar */}
            <Box alignItems="center" gap={1}>
              <Text color={theme.text.muted}>Confidence:</Text>
              <Text color={confidenceColor}>
                {createProgressBar(projection.confidence, 15, '█', '░')}
              </Text>
              <Text color={confidenceColor}>
                {projection.confidence.toFixed(1)}%
              </Text>
            </Box>
          </Box>
        );
      })}
    </Box>
  );

  /**
   * Renders projection comparison chart.
   */
  const renderProjectionComparison = () => {
    const maxCost = Math.max(...sortedProjections.map((p) => p.projectedCost));
    const availableWidth = config.width - 15; // Reserve space for labels

    return (
      <Box flexDirection="column">
        <Text color={theme.text.muted} marginBottom={1}>
          Cost Comparison:
        </Text>

        {sortedProjections.map((projection, index) => {
          const barWidth = Math.max(
            1,
            Math.floor((projection.projectedCost / maxCost) * availableWidth),
          );
          const trendColor = getTrendColor(projection);

          return (
            <Box key={index} flexDirection="column" marginBottom={1}>
              <Box justifyContent="space-between">
                <Text color={theme.text.primary}>{projection.period}</Text>
                <Text color={theme.text.secondary}>
                  {formatCurrency(projection.projectedCost)}
                </Text>
              </Box>
              <Box alignItems="center" gap={1}>
                <Text color={trendColor}>
                  {'█'.repeat(barWidth)}
                  {'░'.repeat(Math.max(0, availableWidth - barWidth))}
                </Text>
                <Text color={theme.text.muted}>
                  {getTrendIcon(projection.trend)}
                </Text>
              </Box>
            </Box>
          );
        })}
      </Box>
    );
  };

  /**
   * Renders budget planning insights and recommendations.
   */
  const renderBudgetInsights = () => {
    const increasingProjections = sortedProjections.filter(
      (p) => p.trend === 'increasing',
    );
    const highConfidenceProjections = sortedProjections.filter(
      (p) => p.confidence > 80,
    );
    const totalMonthlyProjection = sortedProjections.find(
      (p) => p.period === 'monthly',
    );

    return (
      <Box flexDirection="column" marginTop={1}>
        <Text color={theme.text.muted} marginBottom={1}>
          Budget Planning Insights:
        </Text>

        {increasingProjections.length > 0 && (
          <Box marginBottom={1}>
            <Text color={theme.status.warning}>
              ⚠ {increasingProjections.length} projection
              {increasingProjections.length > 1 ? 's' : ''} showing increasing
              costs
            </Text>
          </Box>
        )}

        {highConfidenceProjections.length > 0 && (
          <Box marginBottom={1}>
            <Text color={theme.status.success}>
              ✓ {highConfidenceProjections.length} high-confidence projection
              {highConfidenceProjections.length > 1 ? 's' : ''}
            </Text>
          </Box>
        )}

        {totalMonthlyProjection && (
          <Box marginBottom={1}>
            <Text color={theme.text.secondary}>
              📅 Monthly forecast:{' '}
              {formatCurrency(totalMonthlyProjection.projectedCost)} (
              {totalMonthlyProjection.confidence.toFixed(0)}% confidence)
            </Text>
          </Box>
        )}

        <Box marginTop={1}>
          <Text color={theme.text.muted}>💡 Recommendations:</Text>
          <Box flexDirection="column" marginTop={1}>
            {increasingProjections.length > 0 && (
              <Text color={theme.text.muted}>
                • Monitor usage patterns closely
              </Text>
            )}
            <Text color={theme.text.muted}>
              • Set alerts at{' '}
              {Math.floor(sortedProjections[0]?.projectedCost * 0.8)} threshold
            </Text>
            {totalMonthlyProjection && (
              <Text color={theme.text.muted}>
                • Budget{' '}
                {formatCurrency(totalMonthlyProjection.projectedCost * 1.2)} for
                safety margin
              </Text>
            )}
          </Box>
        </Box>
      </Box>
    );
  };

  // Render the complete projection chart
  return (
    <Box
      flexDirection="column"
      borderStyle="single"
      paddingX={2}
      paddingY={1}
      width={config.width}
      height={config.height}
    >
      {/* Title */}
      <Text color={theme.text.secondary} bold marginBottom={1}>
        {config.title}
      </Text>

      {/* Projection header */}
      {renderProjectionHeader()}

      {/* Chart visualization */}
      <Box flexGrow={1}>
        {config.height > 20 ? (
          <Box flexDirection="column">
            {renderDetailedProjections()}
            {config.height > 25 && renderBudgetInsights()}
          </Box>
        ) : config.height > 12 ? (
          renderProjectionComparison()
        ) : (
          renderCompactProjections()
        )}
      </Box>

      {/* Footer */}
      <Box
        justifyContent="space-between"
        marginTop={1}
        paddingTop={1}
        borderTop
      >
        <Text color={theme.text.muted}>
          {sortedProjections.length} projection
          {sortedProjections.length !== 1 ? 's' : ''}
        </Text>
        <Text color={theme.text.muted}>Updated: {formatTime(new Date())}</Text>
      </Box>
    </Box>
  );
};
