/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type React from 'react';
import { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { theme } from '../../../semantic-colors.js';
import { useBudgetDashboard } from '../hooks/useBudgetDashboard.js';
import { TokenUsageChart } from '../charts/TokenUsageChart.js';
import { CostBreakdownChart } from '../charts/CostBreakdownChart.js';
import { UsageTrendsGraph } from '../charts/UsageTrendsGraph.js';
import { CostProjectionChart } from '../charts/CostProjectionChart.js';
import { BudgetAlertsPanel } from './BudgetAlertsPanel.js';
import { BudgetControlsPanel } from './BudgetControlsPanel.js';
import { formatCurrency, formatPercentage, createProgressBar } from '../utils/chartUtils.js';
import type { BudgetDashboardProps } from '../types/index.js';

/**
 * Budget Usage Visualizer and Analytics Dashboard - Main Component
 *
 * This is the primary dashboard component that provides a comprehensive
 * view of budget usage, costs, trends, and analytics. It includes multiple
 * interactive charts, real-time data, alerts, and filtering capabilities.
 *
 * The dashboard supports multiple views:
 * - Overview: Summary of all budget metrics
 * - Usage: Detailed token usage analysis
 * - Costs: Cost breakdown and analysis
 * - Trends: Historical usage trends
 * - Alerts: Budget alerts and notifications
 * - Settings: Dashboard configuration
 *
 * @param props - Configuration for the dashboard
 * @returns Interactive budget dashboard UI component
 */
export const BudgetDashboard: React.FC<BudgetDashboardProps> = ({
  projectRoot,
  budgetSettings = { enabled: true },
  initialView = 'overview',
  compact = false,
  refreshInterval = 30,
}) => {
  // Initialize dashboard state and data
  const {
    budgetStats,
    historicalData,
    costBreakdown,
    alerts,
    projections,
    dashboardState,
    setActiveView,
    updateFilters,
    refreshData,
    toggleAutoRefresh,
    dismissAlert,
    exportData,
  } = useBudgetDashboard({
    projectRoot,
    budgetSettings,
    refreshInterval,
    autoRefresh: true,
  });

  // Local state for navigation
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Navigation options
  const navigationOptions = [
    { key: 'overview', label: 'Overview', icon: '📊' },
    { key: 'usage', label: 'Usage', icon: '🔥' },
    { key: 'costs', label: 'Costs', icon: '💰' },
    { key: 'trends', label: 'Trends', icon: '📈' },
    { key: 'alerts', label: 'Alerts', icon: '🚨' },
    { key: 'settings', label: 'Settings', icon: '⚙️' },
  ] as const;

  // Handle keyboard navigation
  useInput((input, key) => {
    if (key.leftArrow || input === 'h') {
      setSelectedIndex(Math.max(0, selectedIndex - 1));
    } else if (key.rightArrow || input === 'l') {
      setSelectedIndex(Math.min(navigationOptions.length - 1, selectedIndex + 1));
    } else if (key.return || input === ' ') {
      const selectedView = navigationOptions[selectedIndex].key;
      setActiveView(selectedView);
    } else if (input === 'r') {
      // Refresh data
      refreshData();
    } else if (input === 't') {
      // Toggle auto-refresh
      toggleAutoRefresh();
    } else if (input === 'e') {
      // Export data (JSON format)
      exportData('json').then(data => {
        console.log('Export data available:', data.slice(0, 100) + '...');
      });
    }
  });

  // Don't render if budget is not enabled
  if (!budgetSettings?.enabled) {
    return (
      <Box flexDirection="column" alignItems="center" paddingY={2}>
        <Text color={theme.status.warning}>
          Budget tracking is disabled
        </Text>
        <Text color={theme.text.secondary}>
          Enable budget settings to view the dashboard
        </Text>
      </Box>
    );
  }

  // Loading state
  if (dashboardState.isLoading && !budgetStats) {
    return (
      <Box flexDirection="column" alignItems="center" paddingY={2}>
        <Text color={theme.text.secondary}>
          Loading budget dashboard...
        </Text>
        <Text color={theme.text.muted}>
          Fetching real-time budget data
        </Text>
      </Box>
    );
  }

  // Error state
  if (dashboardState.error) {
    return (
      <Box flexDirection="column" alignItems="center" paddingY={2}>
        <Text color={theme.status.error}>
          Dashboard Error
        </Text>
        <Text color={theme.text.secondary}>
          {dashboardState.error}
        </Text>
        <Text color={theme.text.muted}>
          Press 'r' to retry
        </Text>
      </Box>
    );
  }

  /**
   * Renders the navigation bar with view options.
   */
  const renderNavigation = () => (
    <Box borderStyle="round" paddingX={1} marginBottom={1}>
      <Box gap={2}>
        {navigationOptions.map((option, index) => (
          <Box key={option.key}>
            <Text
              color={
                index === selectedIndex
                  ? theme.primary.main
                  : dashboardState.activeView === option.key
                  ? theme.status.success
                  : theme.text.secondary
              }
              backgroundColor={
                index === selectedIndex
                  ? theme.primary.light
                  : undefined
              }
            >
              {option.icon} {option.label}
            </Text>
          </Box>
        ))}
      </Box>
    </Box>
  );

  /**
   * Renders the dashboard header with key metrics.
   */
  const renderHeader = () => {
    if (!budgetStats) return null;

    const usageColor = budgetStats.usagePercentage >= 90
      ? theme.status.error
      : budgetStats.usagePercentage >= 75
      ? theme.status.warning
      : theme.status.success;

    return (
      <Box flexDirection="column" borderStyle="single" paddingX={2} paddingY={1} marginBottom={1}>
        <Box justifyContent="space-between" marginBottom={1}>
          <Text color={theme.text.primary} bold>
            Budget Usage Dashboard
          </Text>
          <Text color={theme.text.secondary}>
            Last updated: {dashboardState.lastRefresh.toLocaleTimeString()}
          </Text>
        </Box>

        <Box justifyContent="space-between" alignItems="center">
          <Box gap={4}>
            <Box flexDirection="column">
              <Text color={theme.text.secondary}>Usage</Text>
              <Text color={usageColor}>
                {budgetStats.requestCount}/{budgetStats.dailyLimit}
              </Text>
            </Box>

            <Box flexDirection="column">
              <Text color={theme.text.secondary}>Percentage</Text>
              <Text color={usageColor}>
                {formatPercentage(budgetStats.usagePercentage)}
              </Text>
            </Box>

            <Box flexDirection="column">
              <Text color={theme.text.secondary}>Remaining</Text>
              <Text color={theme.text.primary}>
                {budgetStats.remainingRequests}
              </Text>
            </Box>

            <Box flexDirection="column">
              <Text color={theme.text.secondary}>Reset</Text>
              <Text color={theme.text.muted}>
                {budgetStats.timeUntilReset}
              </Text>
            </Box>
          </Box>

          <Box flexDirection="column" alignItems="flex-end">
            <Text color={theme.text.secondary}>Progress</Text>
            <Box alignItems="center" gap={1}>
              <Text color={usageColor}>
                {createProgressBar(budgetStats.usagePercentage, 10)}
              </Text>
              <Text color={theme.text.muted}>
                {formatPercentage(budgetStats.usagePercentage, 0)}
              </Text>
            </Box>
          </Box>
        </Box>

        {alerts.length > 0 && (
          <Box marginTop={1} paddingTop={1} borderColor={theme.status.warning} borderStyle="single">
            <Text color={theme.status.warning}>
              🚨 {alerts.length} active alert{alerts.length > 1 ? 's' : ''}
            </Text>
          </Box>
        )}
      </Box>
    );
  };

  /**
   * Renders content based on the active view.
   */
  const renderContent = () => {
    switch (dashboardState.activeView) {
      case 'overview':
        return renderOverviewView();
      case 'usage':
        return renderUsageView();
      case 'costs':
        return renderCostsView();
      case 'trends':
        return renderTrendsView();
      case 'alerts':
        return renderAlertsView();
      case 'settings':
        return renderSettingsView();
      default:
        return renderOverviewView();
    }
  };

  /**
   * Renders the overview view with summary information.
   */
  const renderOverviewView = () => (
    <Box flexDirection="column" gap={1}>
      <Box gap={2}>
        <Box flexBasis="50%">
          <TokenUsageChart
            data={historicalData}
            config={{
              title: 'Token Usage Trend',
              width: 40,
              height: 8,
              showAxes: true,
              showGrid: true,
              colorScheme: 'usage',
            }}
          />
        </Box>
        <Box flexBasis="50%">
          <CostBreakdownChart
            data={costBreakdown}
            config={{
              title: 'Cost Breakdown',
              width: 40,
              height: 8,
              showAxes: false,
              showGrid: false,
              colorScheme: 'cost',
            }}
          />
        </Box>
      </Box>

      {projections.length > 0 && (
        <Box marginTop={1}>
          <CostProjectionChart
            projections={projections}
            config={{
              title: 'Cost Projections',
              width: 80,
              height: 6,
              showAxes: true,
              showGrid: true,
              colorScheme: 'budget',
            }}
          />
        </Box>
      )}
    </Box>
  );

  /**
   * Renders the detailed usage view.
   */
  const renderUsageView = () => (
    <Box flexDirection="column" gap={1}>
      <TokenUsageChart
        data={historicalData}
        config={{
          title: 'Detailed Token Usage Analysis',
          width: 80,
          height: 12,
          showAxes: true,
          showGrid: true,
          colorScheme: 'usage',
        }}
      />
    </Box>
  );

  /**
   * Renders the costs analysis view.
   */
  const renderCostsView = () => (
    <Box flexDirection="column" gap={1}>
      <CostBreakdownChart
        data={costBreakdown}
        config={{
          title: 'Detailed Cost Analysis',
          width: 80,
          height: 12,
          showAxes: true,
          showGrid: false,
          colorScheme: 'cost',
        }}
      />
    </Box>
  );

  /**
   * Renders the trends analysis view.
   */
  const renderTrendsView = () => (
    <Box flexDirection="column" gap={1}>
      <UsageTrendsGraph
        data={historicalData}
        config={{
          title: 'Historical Usage Trends',
          width: 80,
          height: 12,
          showAxes: true,
          showGrid: true,
          colorScheme: 'default',
        }}
      />
    </Box>
  );

  /**
   * Renders the alerts management view.
   */
  const renderAlertsView = () => (
    <BudgetAlertsPanel
      alerts={alerts}
      onDismissAlert={dismissAlert}
      budgetStats={budgetStats}
    />
  );

  /**
   * Renders the settings and controls view.
   */
  const renderSettingsView = () => (
    <BudgetControlsPanel
      filters={dashboardState.filters}
      onUpdateFilters={updateFilters}
      autoRefresh={dashboardState.autoRefresh}
      onToggleAutoRefresh={toggleAutoRefresh}
      refreshInterval={dashboardState.refreshInterval}
      onExportData={exportData}
    />
  );

  /**
   * Renders the footer with keyboard shortcuts.
   */
  const renderFooter = () => (
    <Box justifyContent="space-between" paddingTop={1} borderStyle="single" borderTop>
      <Box gap={4}>
        <Text color={theme.text.muted}>
          ←→/hl: Navigate
        </Text>
        <Text color={theme.text.muted}>
          Enter/Space: Select
        </Text>
        <Text color={theme.text.muted}>
          r: Refresh
        </Text>
        <Text color={theme.text.muted}>
          t: Toggle auto-refresh
        </Text>
        <Text color={theme.text.muted}>
          e: Export
        </Text>
      </Box>
      <Text color={theme.text.muted}>
        Auto-refresh: {dashboardState.autoRefresh ? 'ON' : 'OFF'}
        ({dashboardState.refreshInterval}s)
      </Text>
    </Box>
  );

  // Render the complete dashboard
  return (
    <Box flexDirection="column" minHeight={compact ? 20 : 30}>
      {renderNavigation()}
      {renderHeader()}
      <Box flexGrow={1} marginBottom={1}>
        {renderContent()}
      </Box>
      {!compact && renderFooter()}
    </Box>
  );
};