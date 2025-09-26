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
  formatPercentage,
  createProgressBar,
  generateColorPalette,
} from '../utils/chartUtils.js';
import type { ChartConfig, CostBreakdownItem } from '../types/index.js';

/**
 * Props for the CostBreakdownChart component.
 */
interface CostBreakdownChartProps {
  /** Cost breakdown data to visualize */
  data: CostBreakdownItem[];
  /** Chart configuration options */
  config: ChartConfig;
  /** Whether the chart is currently loading */
  loading?: boolean;
  /** Error message if chart failed to load */
  error?: string;
  /** Callback when a breakdown item is selected */
  onItemSelect?: (item: CostBreakdownItem) => void;
}

/**
 * Cost Breakdown Chart Component
 *
 * This component visualizes cost breakdown by feature using ASCII-based
 * charts optimized for CLI interfaces. It displays spending analysis,
 * feature cost distribution, and provides interactive data exploration.
 *
 * Features:
 * - ASCII pie chart representation
 * - Horizontal bar chart for detailed breakdown
 * - Color-coded feature categories
 * - Interactive item selection
 * - Cost and percentage statistics
 * - Responsive layout for different terminal sizes
 *
 * @param props - Configuration and data for the chart
 * @returns Interactive cost breakdown chart component
 */
export const CostBreakdownChart: React.FC<CostBreakdownChartProps> = ({
  data,
  config,
  loading = false,
  error,
  onItemSelect: _onItemSelect,
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
          <Text color={theme.text.muted}>Loading cost breakdown...</Text>
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
  if (data.length === 0) {
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
          <Text color={theme.text.muted}>No cost breakdown data available</Text>
        </Box>
      </Box>
    );
  }

  // Sort data by cost (descending) and prepare chart data
  const sortedData = [...data].sort((a, b) => b.cost - a.cost);
  const totalCost = sortedData.reduce((sum, item) => sum + item.cost, 0);
  const colorPalette = generateColorPalette(
    sortedData.length,
    config.colorScheme,
  );

  /**
   * Renders the cost statistics header.
   */
  const renderStatsHeader = () => {
    const maxCostItem = sortedData[0];
    const avgCost = totalCost / sortedData.length;

    return (
      <Box justifyContent="space-between" marginBottom={1}>
        <Box gap={3}>
          <Box flexDirection="column">
            <Text color={theme.text.muted}>Total</Text>
            <Text color={theme.text.primary}>{formatCurrency(totalCost)}</Text>
          </Box>
          <Box flexDirection="column">
            <Text color={theme.text.muted}>Avg</Text>
            <Text color={theme.text.primary}>{formatCurrency(avgCost)}</Text>
          </Box>
          <Box flexDirection="column">
            <Text color={theme.text.muted}>Highest</Text>
            <Text color={theme.status.warning}>
              {maxCostItem ? formatCurrency(maxCostItem.cost) : '$0.00'}
            </Text>
          </Box>
          <Box flexDirection="column">
            <Text color={theme.text.muted}>Features</Text>
            <Text color={theme.text.primary}>{sortedData.length}</Text>
          </Box>
        </Box>
      </Box>
    );
  };

  /**
   * Renders a simple ASCII pie chart using block characters.
   */
  const renderPieChart = () => (
    <Box flexDirection="column" marginBottom={1}>
      <Box marginBottom={1}>
        <Text color={theme.text.muted}>Cost Distribution:</Text>
      </Box>
      {sortedData.map((item, index) => {
        const color =
          index < colorPalette.length
            ? colorPalette[index]
            : theme.text.secondary;

        return (
          <Box key={item.feature} gap={1} marginBottom={1}>
            <Text color={color}>
              {createProgressBar(item.percentage, 10, '█', '░')}
            </Text>
            <Text color={theme.text.primary}>{item.feature}</Text>
            <Text color={theme.text.muted}>
              ({formatPercentage(item.percentage)})
            </Text>
          </Box>
        );
      })}
    </Box>
  );

  /**
   * Renders horizontal bar chart for detailed breakdown.
   */
  const renderBarChart = () => {
    const maxCost = sortedData[0]?.cost || 1;
    const availableWidth = config.width - 20; // Reserve space for labels

    return (
      <Box flexDirection="column">
        {sortedData.map((item, index) => {
          const barWidth = Math.max(
            1,
            Math.floor((item.cost / maxCost) * availableWidth),
          );
          const color =
            index < colorPalette.length
              ? colorPalette[index]
              : theme.text.secondary;

          return (
            <Box key={item.feature} flexDirection="column" marginBottom={1}>
              <Box justifyContent="space-between" alignItems="center">
                <Text color={theme.text.primary} bold>
                  {item.feature}
                </Text>
                <Text color={theme.text.secondary}>
                  {formatCurrency(item.cost)} (
                  {formatPercentage(item.percentage)})
                </Text>
              </Box>
              <Box alignItems="center" gap={1}>
                <Text color={color}>
                  {'█'.repeat(barWidth)}
                  {'░'.repeat(Math.max(0, availableWidth - barWidth))}
                </Text>
              </Box>
              <Box justifyContent="space-between">
                <Text color={theme.text.muted}>{item.requests} requests</Text>
                <Text color={theme.text.muted}>
                  {formatCurrency(item.avgCostPerRequest)} avg/req
                </Text>
              </Box>
            </Box>
          );
        })}
      </Box>
    );
  };

  /**
   * Renders a compact legend for the chart.
   */
  const renderLegend = () => {
    const itemsPerRow = Math.floor(config.width / 25);
    const rows: CostBreakdownItem[][] = [];

    for (let i = 0; i < sortedData.length; i += itemsPerRow) {
      rows.push(sortedData.slice(i, i + itemsPerRow));
    }

    return (
      <Box flexDirection="column" marginTop={1}>
        <Box marginBottom={1}>
          <Text color={theme.text.muted}>Legend:</Text>
        </Box>
        {rows.map((row, rowIndex) => (
          <Box key={rowIndex} gap={2} marginBottom={1}>
            {row.map((item, index) => {
              const globalIndex = rowIndex * itemsPerRow + index;
              const color =
                globalIndex < colorPalette.length
                  ? colorPalette[globalIndex]
                  : theme.text.secondary;

              return (
                <Box key={item.feature} alignItems="center" gap={1}>
                  <Text color={color}>●</Text>
                  <Text color={theme.text.secondary}>{item.feature}</Text>
                </Box>
              );
            })}
          </Box>
        ))}
      </Box>
    );
  };

  /**
   * Renders detailed cost analysis for larger charts.
   */
  const renderDetailedAnalysis = () => {
    const topFeatures = sortedData.slice(0, 3);
    const totalTokens = sortedData.reduce((sum, item) => sum + item.tokens, 0);
    const totalRequests = sortedData.reduce(
      (sum, item) => sum + item.requests,
      0,
    );
    const avgCostPerToken = totalTokens > 0 ? totalCost / totalTokens : 0;

    return (
      <Box flexDirection="column" marginTop={1}>
        <Box marginBottom={1}>
          <Text color={theme.text.muted}>Analysis:</Text>
        </Box>

        <Box justifyContent="space-between" marginBottom={1}>
          <Text color={theme.text.secondary}>
            Total Requests: {totalRequests}
          </Text>
          <Text color={theme.text.secondary}>
            Total Tokens: {totalTokens.toLocaleString()}
          </Text>
          <Text color={theme.text.secondary}>
            Cost/Token: {formatCurrency(avgCostPerToken, 6)}
          </Text>
        </Box>

        <Box marginBottom={1}>
          <Text color={theme.text.muted}>Top Cost Contributors:</Text>
        </Box>
        {topFeatures.map((item, index) => (
          <Box
            key={item.feature}
            justifyContent="space-between"
            marginBottom={1}
          >
            <Text color={theme.text.primary}>
              {index + 1}. {item.feature}
            </Text>
            <Text color={theme.text.secondary}>
              {formatCurrency(item.cost)}
            </Text>
            <Text color={theme.text.muted}>
              ({item.requests} req, {formatCurrency(item.avgCostPerRequest)}{' '}
              avg)
            </Text>
          </Box>
        ))}

        {sortedData.length > 3 && (
          <Text color={theme.text.muted}>
            ... and {sortedData.length - 3} more features
          </Text>
        )}
      </Box>
    );
  };

  // Render the complete chart
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
      <Box marginBottom={1}>
        <Text color={theme.text.secondary} bold>
          {config.title}
        </Text>
      </Box>

      {/* Statistics header */}
      {renderStatsHeader()}

      {/* Chart visualization */}
      <Box flexGrow={1}>
        {config.height > 15 ? (
          renderBarChart()
        ) : config.height > 10 ? (
          renderPieChart()
        ) : (
          <Box flexDirection="column">
            {sortedData.slice(0, 3).map((item) => (
              <Box
                key={item.feature}
                justifyContent="space-between"
                marginBottom={1}
              >
                <Text color={theme.text.primary}>{item.feature}</Text>
                <Text color={theme.text.secondary}>
                  {formatCurrency(item.cost)}
                </Text>
              </Box>
            ))}
            {sortedData.length > 3 && (
              <Text color={theme.text.muted}>
                +{sortedData.length - 3} more
              </Text>
            )}
          </Box>
        )}
      </Box>

      {/* Additional information for larger charts */}
      {config.height > 20 && renderDetailedAnalysis()}
      {config.height > 12 && config.height <= 20 && renderLegend()}

      {/* Footer */}
      <Box
        justifyContent="space-between"
        marginTop={1}
        paddingTop={1}
        borderTop
      >
        <Text color={theme.text.muted}>{sortedData.length} features</Text>
        <Text color={theme.text.muted}>Total: {formatCurrency(totalCost)}</Text>
      </Box>
    </Box>
  );
};
