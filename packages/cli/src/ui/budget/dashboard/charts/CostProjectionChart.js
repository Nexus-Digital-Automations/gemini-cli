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
  formatTime,
  createProgressBar,
} from '../utils/chartUtils.js';
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
export const CostProjectionChart = ({
  projections,
  config,
  loading = false,
  error,
  onProjectionSelect: _onProjectionSelect,
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
            children: 'Loading cost projections...',
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
  if (projections.length === 0) {
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
            children: 'No projection data available',
          }),
        }),
      ],
    });
  }
  // Sort projections by time period for consistent display
  const sortedProjections = [...projections].sort((a, b) => {
    const periodOrder = { daily: 1, weekly: 2, monthly: 3 };
    return periodOrder[a.period] - periodOrder[b.period];
  });
  /**
   * Gets color for trend indication based on direction and confidence.
   */
  const getTrendColor = (projection) => {
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
  const getTrendIcon = (trend) => {
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
    return _jsx(Box, {
      justifyContent: 'space-between',
      marginBottom: 1,
      children: _jsxs(Box, {
        gap: 3,
        children: [
          _jsxs(Box, {
            flexDirection: 'column',
            children: [
              _jsx(Text, { color: theme.text.muted, children: 'Periods' }),
              _jsx(Text, {
                color: theme.text.primary,
                children: sortedProjections.length,
              }),
            ],
          }),
          _jsxs(Box, {
            flexDirection: 'column',
            children: [
              _jsx(Text, { color: theme.text.muted, children: 'Total Proj.' }),
              _jsx(Text, {
                color: theme.text.primary,
                children: formatCurrency(totalProjected),
              }),
            ],
          }),
          _jsxs(Box, {
            flexDirection: 'column',
            children: [
              _jsx(Text, {
                color: theme.text.muted,
                children: 'Avg. Confidence',
              }),
              _jsxs(Text, {
                color:
                  avgConfidence > 80
                    ? theme.status.success
                    : avgConfidence > 60
                      ? theme.status.warning
                      : theme.status.error,
                children: [avgConfidence.toFixed(1), '%'],
              }),
            ],
          }),
          _jsxs(Box, {
            flexDirection: 'column',
            children: [
              _jsx(Text, { color: theme.text.muted, children: 'Highest' }),
              _jsx(Text, {
                color: theme.status.warning,
                children: formatCurrency(highestProjection.projectedCost),
              }),
            ],
          }),
        ],
      }),
    });
  };
  /**
   * Renders a compact projection summary.
   */
  const renderCompactProjections = () =>
    _jsx(Box, {
      flexDirection: 'column',
      gap: 1,
      children: sortedProjections.map((projection, index) =>
        _jsxs(
          Box,
          {
            justifyContent: 'space-between',
            alignItems: 'center',
            children: [
              _jsxs(Box, {
                gap: 2,
                alignItems: 'center',
                children: [
                  _jsx(Text, {
                    color: theme.text.primary,
                    bold: true,
                    children:
                      projection.period.charAt(0).toUpperCase() +
                      projection.period.slice(1),
                  }),
                  _jsxs(Text, {
                    color: getTrendColor(projection),
                    children: [
                      getTrendIcon(projection.trend),
                      ' ',
                      projection.trend,
                    ],
                  }),
                ],
              }),
              _jsxs(Box, {
                gap: 2,
                alignItems: 'center',
                children: [
                  _jsx(Text, {
                    color: theme.text.secondary,
                    children: formatCurrency(projection.projectedCost),
                  }),
                  _jsxs(Text, {
                    color: theme.text.muted,
                    children: ['(', projection.confidence.toFixed(0), '%)'],
                  }),
                ],
              }),
            ],
          },
          index,
        ),
      ),
    });
  /**
   * Renders detailed projection analysis with confidence bars.
   */
  const renderDetailedProjections = () =>
    _jsx(Box, {
      flexDirection: 'column',
      children: sortedProjections.map((projection, index) => {
        const confidenceColor =
          projection.confidence > 80
            ? theme.status.success
            : projection.confidence > 60
              ? theme.status.warning
              : theme.status.error;
        return _jsxs(
          Box,
          {
            flexDirection: 'column',
            marginBottom: 2,
            children: [
              _jsxs(Box, {
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 1,
                children: [
                  _jsxs(Text, {
                    color: theme.text.primary,
                    bold: true,
                    children: [
                      projection.period.charAt(0).toUpperCase() +
                        projection.period.slice(1),
                      ' ',
                      'Projection',
                    ],
                  }),
                  _jsxs(Text, {
                    color: theme.text.secondary,
                    children: [
                      formatTime(projection.projectionRange.start),
                      ' -',
                      ' ',
                      formatTime(projection.projectionRange.end),
                    ],
                  }),
                ],
              }),
              _jsxs(Box, {
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 1,
                children: [
                  _jsxs(Box, {
                    gap: 2,
                    alignItems: 'center',
                    children: [
                      _jsxs(Text, {
                        color: theme.text.primary,
                        children: [
                          'Cost: ',
                          formatCurrency(projection.projectedCost),
                        ],
                      }),
                      _jsxs(Text, {
                        color: getTrendColor(projection),
                        children: [
                          getTrendIcon(projection.trend),
                          ' ',
                          projection.trend,
                        ],
                      }),
                    ],
                  }),
                  _jsxs(Text, {
                    color: theme.text.muted,
                    children: ['Based on ', projection.basedOnDays, ' days'],
                  }),
                ],
              }),
              _jsxs(Box, {
                alignItems: 'center',
                gap: 1,
                children: [
                  _jsx(Text, {
                    color: theme.text.muted,
                    children: 'Confidence:',
                  }),
                  _jsx(Text, {
                    color: confidenceColor,
                    children: createProgressBar(
                      projection.confidence,
                      15,
                      '█',
                      '░',
                    ),
                  }),
                  _jsxs(Text, {
                    color: confidenceColor,
                    children: [projection.confidence.toFixed(1), '%'],
                  }),
                ],
              }),
            ],
          },
          index,
        );
      }),
    });
  /**
   * Renders projection comparison chart.
   */
  const renderProjectionComparison = () => {
    const maxCost = Math.max(...sortedProjections.map((p) => p.projectedCost));
    const availableWidth = config.width - 15; // Reserve space for labels
    return _jsxs(Box, {
      flexDirection: 'column',
      children: [
        _jsx(Text, {
          color: theme.text.muted,
          marginBottom: 1,
          children: 'Cost Comparison:',
        }),
        sortedProjections.map((projection, index) => {
          const barWidth = Math.max(
            1,
            Math.floor((projection.projectedCost / maxCost) * availableWidth),
          );
          const trendColor = getTrendColor(projection);
          return _jsxs(
            Box,
            {
              flexDirection: 'column',
              marginBottom: 1,
              children: [
                _jsxs(Box, {
                  justifyContent: 'space-between',
                  children: [
                    _jsx(Text, {
                      color: theme.text.primary,
                      children: projection.period,
                    }),
                    _jsx(Text, {
                      color: theme.text.secondary,
                      children: formatCurrency(projection.projectedCost),
                    }),
                  ],
                }),
                _jsxs(Box, {
                  alignItems: 'center',
                  gap: 1,
                  children: [
                    _jsxs(Text, {
                      color: trendColor,
                      children: [
                        '█'.repeat(barWidth),
                        '░'.repeat(Math.max(0, availableWidth - barWidth)),
                      ],
                    }),
                    _jsx(Text, {
                      color: theme.text.muted,
                      children: getTrendIcon(projection.trend),
                    }),
                  ],
                }),
              ],
            },
            index,
          );
        }),
      ],
    });
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
    return _jsxs(Box, {
      flexDirection: 'column',
      marginTop: 1,
      children: [
        _jsx(Text, {
          color: theme.text.muted,
          marginBottom: 1,
          children: 'Budget Planning Insights:',
        }),
        increasingProjections.length > 0 &&
          _jsx(Box, {
            marginBottom: 1,
            children: _jsxs(Text, {
              color: theme.status.warning,
              children: [
                '\u26A0 ',
                increasingProjections.length,
                ' projection',
                increasingProjections.length > 1 ? 's' : '',
                ' showing increasing costs',
              ],
            }),
          }),
        highConfidenceProjections.length > 0 &&
          _jsx(Box, {
            marginBottom: 1,
            children: _jsxs(Text, {
              color: theme.status.success,
              children: [
                '\u2713 ',
                highConfidenceProjections.length,
                ' high-confidence projection',
                highConfidenceProjections.length > 1 ? 's' : '',
              ],
            }),
          }),
        totalMonthlyProjection &&
          _jsx(Box, {
            marginBottom: 1,
            children: _jsxs(Text, {
              color: theme.text.secondary,
              children: [
                '\uD83D\uDCC5 Monthly forecast:',
                ' ',
                formatCurrency(totalMonthlyProjection.projectedCost),
                ' (',
                totalMonthlyProjection.confidence.toFixed(0),
                '% confidence)',
              ],
            }),
          }),
        _jsxs(Box, {
          marginTop: 1,
          children: [
            _jsx(Text, {
              color: theme.text.muted,
              children: '\uD83D\uDCA1 Recommendations:',
            }),
            _jsxs(Box, {
              flexDirection: 'column',
              marginTop: 1,
              children: [
                increasingProjections.length > 0 &&
                  _jsx(Text, {
                    color: theme.text.muted,
                    children: '\u2022 Monitor usage patterns closely',
                  }),
                _jsxs(Text, {
                  color: theme.text.muted,
                  children: [
                    '\u2022 Set alerts at',
                    ' ',
                    Math.floor(sortedProjections[0]?.projectedCost * 0.8),
                    ' threshold',
                  ],
                }),
                totalMonthlyProjection &&
                  _jsxs(Text, {
                    color: theme.text.muted,
                    children: [
                      '\u2022 Budget',
                      ' ',
                      formatCurrency(
                        totalMonthlyProjection.projectedCost * 1.2,
                      ),
                      ' for safety margin',
                    ],
                  }),
              ],
            }),
          ],
        }),
      ],
    });
  };
  // Render the complete projection chart
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
      renderProjectionHeader(),
      _jsx(Box, {
        flexGrow: 1,
        children:
          config.height > 20
            ? _jsxs(Box, {
                flexDirection: 'column',
                children: [
                  renderDetailedProjections(),
                  config.height > 25 && renderBudgetInsights(),
                ],
              })
            : config.height > 12
              ? renderProjectionComparison()
              : renderCompactProjections(),
      }),
      _jsxs(Box, {
        justifyContent: 'space-between',
        marginTop: 1,
        paddingTop: 1,
        borderTop: true,
        children: [
          _jsxs(Text, {
            color: theme.text.muted,
            children: [
              sortedProjections.length,
              ' projection',
              sortedProjections.length !== 1 ? 's' : '',
            ],
          }),
          _jsxs(Text, {
            color: theme.text.muted,
            children: ['Updated: ', formatTime(new Date())],
          }),
        ],
      }),
    ],
  });
};
//# sourceMappingURL=CostProjectionChart.js.map
