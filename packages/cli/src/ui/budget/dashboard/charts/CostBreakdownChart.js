/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { jsx as _jsx, jsxs as _jsxs } from 'react/jsx-runtime';
import { Box, Text } from 'ink';
import { theme } from '../../../semantic-colors.js';
import {
  formatCurrency,
  formatPercentage,
  createProgressBar,
  generateColorPalette,
} from '../utils/chartUtils.js';
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
export const CostBreakdownChart = ({
  data,
  config,
  loading = false,
  error,
  onItemSelect: _onItemSelect,
}) => {
  // Handle loading state
  if (loading) {
    return _jsxs(Box, {
      flexDirection: 'column',
      borderStyle: 'single',
      paddingX: 2,
      paddingY: 1,
      width: config.width,
      height: config.height,
      children: [
        _jsx(Text, {
          color: theme.text.secondary,
          bold: true,
          children: config.title,
        }),
        _jsx(Box, {
          flexGrow: 1,
          justifyContent: 'center',
          alignItems: 'center',
          children: _jsx(Text, {
            color: theme.text.muted,
            children: 'Loading cost breakdown...',
          }),
        }),
      ],
    });
  }
  // Handle error state
  if (error) {
    return _jsxs(Box, {
      flexDirection: 'column',
      borderStyle: 'single',
      paddingX: 2,
      paddingY: 1,
      width: config.width,
      height: config.height,
      children: [
        _jsx(Text, {
          color: theme.text.secondary,
          bold: true,
          children: config.title,
        }),
        _jsx(Box, {
          flexGrow: 1,
          justifyContent: 'center',
          alignItems: 'center',
          children: _jsxs(Text, {
            color: theme.status.error,
            children: ['Error: ', error],
          }),
        }),
      ],
    });
  }
  // Handle empty data
  if (data.length === 0) {
    return _jsxs(Box, {
      flexDirection: 'column',
      borderStyle: 'single',
      paddingX: 2,
      paddingY: 1,
      width: config.width,
      height: config.height,
      children: [
        _jsx(Text, {
          color: theme.text.secondary,
          bold: true,
          children: config.title,
        }),
        _jsx(Box, {
          flexGrow: 1,
          justifyContent: 'center',
          alignItems: 'center',
          children: _jsx(Text, {
            color: theme.text.muted,
            children: 'No cost breakdown data available',
          }),
        }),
      ],
    });
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
    return _jsx(Box, {
      justifyContent: 'space-between',
      marginBottom: 1,
      children: _jsxs(Box, {
        gap: 3,
        children: [
          _jsxs(Box, {
            flexDirection: 'column',
            children: [
              _jsx(Text, { color: theme.text.muted, children: 'Total' }),
              _jsx(Text, {
                color: theme.text.primary,
                children: formatCurrency(totalCost),
              }),
            ],
          }),
          _jsxs(Box, {
            flexDirection: 'column',
            children: [
              _jsx(Text, { color: theme.text.muted, children: 'Avg' }),
              _jsx(Text, {
                color: theme.text.primary,
                children: formatCurrency(avgCost),
              }),
            ],
          }),
          _jsxs(Box, {
            flexDirection: 'column',
            children: [
              _jsx(Text, { color: theme.text.muted, children: 'Highest' }),
              _jsx(Text, {
                color: theme.status.warning,
                children: maxCostItem
                  ? formatCurrency(maxCostItem.cost)
                  : '$0.00',
              }),
            ],
          }),
          _jsxs(Box, {
            flexDirection: 'column',
            children: [
              _jsx(Text, { color: theme.text.muted, children: 'Features' }),
              _jsx(Text, {
                color: theme.text.primary,
                children: sortedData.length,
              }),
            ],
          }),
        ],
      }),
    });
  };
  /**
   * Renders a simple ASCII pie chart using block characters.
   */
  const renderPieChart = () =>
    _jsxs(Box, {
      flexDirection: 'column',
      marginBottom: 1,
      children: [
        _jsx(Text, {
          color: theme.text.muted,
          marginBottom: 1,
          children: 'Cost Distribution:',
        }),
        sortedData.map((item, index) => {
          const color =
            index < colorPalette.length
              ? colorPalette[index]
              : theme.text.secondary;
          return _jsxs(
            Box,
            {
              gap: 1,
              marginBottom: 1,
              children: [
                _jsx(Text, {
                  color,
                  children: createProgressBar(item.percentage, 10, '█', '░'),
                }),
                _jsx(Text, {
                  color: theme.text.primary,
                  children: item.feature,
                }),
                _jsxs(Text, {
                  color: theme.text.muted,
                  children: ['(', formatPercentage(item.percentage), ')'],
                }),
              ],
            },
            item.feature,
          );
        }),
      ],
    });
  /**
   * Renders horizontal bar chart for detailed breakdown.
   */
  const renderBarChart = () => {
    const maxCost = sortedData[0]?.cost || 1;
    const availableWidth = config.width - 20; // Reserve space for labels
    return _jsx(Box, {
      flexDirection: 'column',
      children: sortedData.map((item, index) => {
        const barWidth = Math.max(
          1,
          Math.floor((item.cost / maxCost) * availableWidth),
        );
        const color =
          index < colorPalette.length
            ? colorPalette[index]
            : theme.text.secondary;
        return _jsxs(
          Box,
          {
            flexDirection: 'column',
            marginBottom: 1,
            children: [
              _jsxs(Box, {
                justifyContent: 'space-between',
                alignItems: 'center',
                children: [
                  _jsx(Text, {
                    color: theme.text.primary,
                    bold: true,
                    children: item.feature,
                  }),
                  _jsxs(Text, {
                    color: theme.text.secondary,
                    children: [
                      formatCurrency(item.cost),
                      ' (',
                      formatPercentage(item.percentage),
                      ')',
                    ],
                  }),
                ],
              }),
              _jsx(Box, {
                alignItems: 'center',
                gap: 1,
                children: _jsxs(Text, {
                  color,
                  children: [
                    '█'.repeat(barWidth),
                    '░'.repeat(Math.max(0, availableWidth - barWidth)),
                  ],
                }),
              }),
              _jsxs(Box, {
                justifyContent: 'space-between',
                children: [
                  _jsxs(Text, {
                    color: theme.text.muted,
                    children: [item.requests, ' requests'],
                  }),
                  _jsxs(Text, {
                    color: theme.text.muted,
                    children: [
                      formatCurrency(item.avgCostPerRequest),
                      ' avg/req',
                    ],
                  }),
                ],
              }),
            ],
          },
          item.feature,
        );
      }),
    });
  };
  /**
   * Renders a compact legend for the chart.
   */
  const renderLegend = () => {
    const itemsPerRow = Math.floor(config.width / 25);
    const rows = [];
    for (let i = 0; i < sortedData.length; i += itemsPerRow) {
      rows.push(sortedData.slice(i, i + itemsPerRow));
    }
    return _jsxs(Box, {
      flexDirection: 'column',
      marginTop: 1,
      children: [
        _jsx(Text, {
          color: theme.text.muted,
          marginBottom: 1,
          children: 'Legend:',
        }),
        rows.map((row, rowIndex) =>
          _jsx(
            Box,
            {
              gap: 2,
              marginBottom: 1,
              children: row.map((item, index) => {
                const globalIndex = rowIndex * itemsPerRow + index;
                const color =
                  globalIndex < colorPalette.length
                    ? colorPalette[globalIndex]
                    : theme.text.secondary;
                return _jsxs(
                  Box,
                  {
                    alignItems: 'center',
                    gap: 1,
                    children: [
                      _jsx(Text, { color, children: '\u25CF' }),
                      _jsx(Text, {
                        color: theme.text.secondary,
                        children: item.feature,
                      }),
                    ],
                  },
                  item.feature,
                );
              }),
            },
            rowIndex,
          ),
        ),
      ],
    });
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
    return _jsxs(Box, {
      flexDirection: 'column',
      marginTop: 1,
      children: [
        _jsx(Text, {
          color: theme.text.muted,
          marginBottom: 1,
          children: 'Analysis:',
        }),
        _jsxs(Box, {
          justifyContent: 'space-between',
          marginBottom: 1,
          children: [
            _jsxs(Text, {
              color: theme.text.secondary,
              children: ['Total Requests: ', totalRequests],
            }),
            _jsxs(Text, {
              color: theme.text.secondary,
              children: ['Total Tokens: ', totalTokens.toLocaleString()],
            }),
            _jsxs(Text, {
              color: theme.text.secondary,
              children: ['Cost/Token: ', formatCurrency(avgCostPerToken, 6)],
            }),
          ],
        }),
        _jsx(Text, {
          color: theme.text.muted,
          marginBottom: 1,
          children: 'Top Cost Contributors:',
        }),
        topFeatures.map((item, index) =>
          _jsxs(
            Box,
            {
              justifyContent: 'space-between',
              marginBottom: 1,
              children: [
                _jsxs(Text, {
                  color: theme.text.primary,
                  children: [index + 1, '. ', item.feature],
                }),
                _jsx(Text, {
                  color: theme.text.secondary,
                  children: formatCurrency(item.cost),
                }),
                _jsxs(Text, {
                  color: theme.text.muted,
                  children: [
                    '(',
                    item.requests,
                    ' req, ',
                    formatCurrency(item.avgCostPerRequest),
                    ' ',
                    'avg)',
                  ],
                }),
              ],
            },
            item.feature,
          ),
        ),
        sortedData.length > 3 &&
          _jsxs(Text, {
            color: theme.text.muted,
            children: ['... and ', sortedData.length - 3, ' more features'],
          }),
      ],
    });
  };
  // Render the complete chart
  return _jsxs(Box, {
    flexDirection: 'column',
    borderStyle: 'single',
    paddingX: 2,
    paddingY: 1,
    width: config.width,
    height: config.height,
    children: [
      _jsx(Text, {
        color: theme.text.secondary,
        bold: true,
        marginBottom: 1,
        children: config.title,
      }),
      renderStatsHeader(),
      _jsx(Box, {
        flexGrow: 1,
        children:
          config.height > 15
            ? renderBarChart()
            : config.height > 10
              ? renderPieChart()
              : _jsxs(Box, {
                  flexDirection: 'column',
                  children: [
                    sortedData.slice(0, 3).map((item) =>
                      _jsxs(
                        Box,
                        {
                          justifyContent: 'space-between',
                          marginBottom: 1,
                          children: [
                            _jsx(Text, {
                              color: theme.text.primary,
                              children: item.feature,
                            }),
                            _jsx(Text, {
                              color: theme.text.secondary,
                              children: formatCurrency(item.cost),
                            }),
                          ],
                        },
                        item.feature,
                      ),
                    ),
                    sortedData.length > 3 &&
                      _jsxs(Text, {
                        color: theme.text.muted,
                        children: ['+', sortedData.length - 3, ' more'],
                      }),
                  ],
                }),
      }),
      config.height > 20 && renderDetailedAnalysis(),
      config.height > 12 && config.height <= 20 && renderLegend(),
      _jsxs(Box, {
        justifyContent: 'space-between',
        marginTop: 1,
        paddingTop: 1,
        borderTop: true,
        children: [
          _jsxs(Text, {
            color: theme.text.muted,
            children: [sortedData.length, ' features'],
          }),
          _jsxs(Text, {
            color: theme.text.muted,
            children: ['Total: ', formatCurrency(totalCost)],
          }),
        ],
      }),
    ],
  });
};
//# sourceMappingURL=CostBreakdownChart.js.map
