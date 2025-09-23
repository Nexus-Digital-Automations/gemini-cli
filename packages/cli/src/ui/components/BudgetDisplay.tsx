/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type React from 'react';
import { useEffect, useState } from 'react';
import { Box, Text } from 'ink';
import { theme } from '../semantic-colors.js';
import { createBudgetTracker } from '@google/gemini-cli-core';
import type { BudgetSettings } from '../../config/settingsSchema.js';

/**
 * Props for the BudgetDisplay component.
 * Configures how budget information is displayed and tracked.
 */
export interface BudgetDisplayProps {
  budgetSettings?: BudgetSettings;
  projectRoot: string;
  compact?: boolean;
}

/**
 * Statistics about current budget usage and limits.
 * Contains real-time data about request consumption and remaining quota.
 */
interface BudgetStats {
  requestCount: number;
  dailyLimit: number;
  remainingRequests: number;
  usagePercentage: number;
  timeUntilReset: string;
}

/**
 * BudgetDisplay shows current API usage against configured limits.
 *
 * This component displays budget information including request count,
 * daily limits, usage percentage, and time until reset. It automatically
 * refreshes data and provides visual indicators when approaching limits.
 *
 * The component supports both compact and full display modes, automatically
 * choosing appropriate colors based on usage levels (green, yellow, red).
 *
 * @param props - Configuration for budget display behavior and data sources
 * @returns A React component showing current budget status
 *
 * @example
 * ```tsx
 * <BudgetDisplay
 *   budgetSettings={budgetConfig}
 *   projectRoot="/path/to/project"
 *   compact={false}
 * />
 * ```
 */
export const BudgetDisplay: React.FC<BudgetDisplayProps> = ({
  budgetSettings,
  projectRoot,
  compact = false,
}) => {
  const [budgetStats, setBudgetStats] = useState<BudgetStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadBudgetStats() {
      if (!budgetSettings?.enabled) {
        setIsLoading(false);
        return;
      }

      try {
        const tracker = createBudgetTracker(projectRoot, budgetSettings);
        const stats = await tracker.getUsageStats();
        setBudgetStats(stats);
      } catch (error) {
        console.warn('Failed to load budget stats:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadBudgetStats();

    // Refresh budget stats every 30 seconds
    const interval = setInterval(loadBudgetStats, 30000);
    return () => clearInterval(interval);
  }, [budgetSettings, projectRoot]);

  // Don't render if budget is not enabled or still loading
  if (isLoading || !budgetSettings?.enabled || !budgetStats) {
    return null;
  }

  const {
    requestCount,
    dailyLimit,
    remainingRequests,
    usagePercentage,
    timeUntilReset,
  } = budgetStats;

  /**
   * Determines the appropriate color for usage display based on percentage.
   * Uses theme colors to indicate usage levels: green (safe), yellow (warning), red (danger).
   *
   * @returns The appropriate theme color for current usage level
   */
  const getUsageColor = () => {
    if (usagePercentage >= 100) return theme.status.error;
    if (usagePercentage >= 90) return theme.status.error;
    if (usagePercentage >= 75) return theme.status.warning;
    return theme.status.success;
  };

  /**
   * Creates a visual progress bar using Unicode block characters.
   * Represents usage percentage as filled and empty blocks.
   *
   * @param width - The total width of the progress bar in characters
   * @returns A string representing the visual progress bar
   */
  const createProgressBar = (width: number = 10) => {
    const filled = Math.round((usagePercentage / 100) * width);
    const empty = width - filled;
    return '█'.repeat(filled) + '░'.repeat(empty);
  };

  if (compact) {
    // Compact display for narrow terminals
    return (
      <Box alignItems="center">
        <Text color={getUsageColor()}>
          {requestCount}/{dailyLimit}
        </Text>
        <Text color={theme.text.secondary}>
          {' '}
          ({usagePercentage.toFixed(0)}%)
        </Text>
      </Box>
    );
  }

  // Full display
  return (
    <Box alignItems="center">
      <Text color={theme.text.secondary}>budget: </Text>
      <Text color={getUsageColor()}>
        {requestCount}/{dailyLimit}
      </Text>
      <Text color={theme.text.secondary}> [</Text>
      <Text color={getUsageColor()}>{createProgressBar(8)}</Text>
      <Text color={theme.text.secondary}>] </Text>
      <Text color={theme.text.secondary}>
        {remainingRequests > 0 ? `${remainingRequests} left` : 'exceeded'}
      </Text>
      {remainingRequests > 0 && (
        <Text color={theme.text.muted}> • {timeUntilReset}</Text>
      )}
    </Box>
  );
};
