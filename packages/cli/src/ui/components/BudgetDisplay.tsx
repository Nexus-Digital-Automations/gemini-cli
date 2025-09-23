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

export interface BudgetDisplayProps {
  budgetSettings?: BudgetSettings;
  projectRoot: string;
  compact?: boolean;
}

interface BudgetStats {
  requestCount: number;
  dailyLimit: number;
  remainingRequests: number;
  usagePercentage: number;
  timeUntilReset: string;
}

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

  // Determine color based on usage percentage
  const getUsageColor = () => {
    if (usagePercentage >= 100) return theme.status.error;
    if (usagePercentage >= 90) return theme.status.error;
    if (usagePercentage >= 75) return theme.status.warning;
    return theme.status.success;
  };

  // Create progress bar
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
