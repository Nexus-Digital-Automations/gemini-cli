/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type React from 'react';
import { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { theme } from '../../../semantic-colors.js';
import { formatPercentage, formatTime } from '../utils/chartUtils.js';
import type { BudgetAlert, BudgetUsageStats } from '../types/index.js';

/**
 * Props for the BudgetAlertsPanel component.
 */
interface BudgetAlertsPanelProps {
  /** Active budget alerts to display */
  alerts: BudgetAlert[];
  /** Current budget usage statistics */
  budgetStats?: BudgetUsageStats | null;
  /** Callback when an alert is dismissed */
  onDismissAlert?: (alertId: string) => void;
  /** Callback when alert thresholds are modified */
  onModifyThresholds?: (thresholds: number[]) => void;
}

/**
 * Budget Alerts Panel Component
 *
 * This component displays and manages budget alerts and notifications
 * in a CLI-optimized interface. It provides real-time alerts for budget
 * thresholds, cost overruns, usage spikes, and other critical events.
 *
 * Features:
 * - Real-time budget alert notifications
 * - Alert severity classification (info, warning, error, critical)
 * - Interactive alert dismissal
 * - Alert history and statistics
 * - Suggested actions for each alert
 * - Alert threshold configuration
 * - Keyboard navigation for alert management
 *
 * @param props - Configuration and data for the alerts panel
 * @returns Interactive budget alerts panel component
 */
export const BudgetAlertsPanel: React.FC<BudgetAlertsPanelProps> = ({
  alerts,
  budgetStats,
  onDismissAlert,
  onModifyThresholds: _onModifyThresholds,
}) => {
  const [selectedAlertIndex, setSelectedAlertIndex] = useState(0);
  const [showDismissed, setShowDismissed] = useState(false);

  // Sort alerts by severity and recency
  const sortedAlerts = [...alerts].sort((a, b) => {
    const severityOrder = { critical: 4, error: 3, warning: 2, info: 1 };
    const severityDiff = severityOrder[b.severity] - severityOrder[a.severity];

    if (severityDiff !== 0) return severityDiff;

    // Sort by recency if severity is the same
    return b.triggeredAt.getTime() - a.triggeredAt.getTime();
  });

  // Handle keyboard navigation
  useInput((input, key) => {
    if (key.upArrow || input === 'k') {
      setSelectedAlertIndex(Math.max(0, selectedAlertIndex - 1));
    } else if (key.downArrow || input === 'j') {
      setSelectedAlertIndex(Math.min(sortedAlerts.length - 1, selectedAlertIndex + 1));
    } else if (key.return || input === ' ') {
      // Dismiss selected alert
      const selectedAlert = sortedAlerts[selectedAlertIndex];
      if (selectedAlert && onDismissAlert) {
        onDismissAlert(selectedAlert.id);
        setSelectedAlertIndex(Math.max(0, selectedAlertIndex - 1));
      }
    } else if (input === 'd') {
      // Toggle show dismissed alerts
      setShowDismissed(!showDismissed);
    }
  });

  /**
   * Gets color for alert severity.
   */
  const getSeverityColor = (severity: BudgetAlert['severity']) => {
    switch (severity) {
      case 'critical':
        return theme.status.error;
      case 'error':
        return theme.status.error;
      case 'warning':
        return theme.status.warning;
      case 'info':
        return theme.status.info;
      default:
        return theme.text.secondary;
    }
  };

  /**
   * Gets icon for alert severity.
   */
  const getSeverityIcon = (severity: BudgetAlert['severity']) => {
    switch (severity) {
      case 'critical':
        return '🔴';
      case 'error':
        return '⚠️';
      case 'warning':
        return '⚡';
      case 'info':
        return 'ℹ️';
      default:
        return '•';
    }
  };

  /**
   * Gets icon for alert type.
   */
  const getTypeIcon = (type: BudgetAlert['type']) => {
    switch (type) {
      case 'usage_threshold':
        return '📊';
      case 'cost_limit':
        return '💰';
      case 'daily_limit':
        return '📅';
      case 'feature_overuse':
        return '🎯';
      default:
        return '⚠️';
    }
  };

  /**
   * Renders the alerts summary header.
   */
  const renderAlertsHeader = () => {
    const criticalCount = alerts.filter(a => a.severity === 'critical').length;
    const errorCount = alerts.filter(a => a.severity === 'error').length;
    const warningCount = alerts.filter(a => a.severity === 'warning').length;
    const activeCount = alerts.filter(a => a.isActive).length;

    return (
      <Box flexDirection="column" marginBottom={2}>
        <Text color={theme.text.primary} bold marginBottom={1}>
          Budget Alerts & Notifications
        </Text>

        <Box justifyContent="space-between" marginBottom={1}>
          <Box gap={4}>
            <Box flexDirection="column">
              <Text color={theme.text.muted}>Active</Text>
              <Text color={activeCount > 0 ? theme.status.warning : theme.status.success}>
                {activeCount}
              </Text>
            </Box>
            <Box flexDirection="column">
              <Text color={theme.text.muted}>Critical</Text>
              <Text color={criticalCount > 0 ? theme.status.error : theme.text.secondary}>
                {criticalCount}
              </Text>
            </Box>
            <Box flexDirection="column">
              <Text color={theme.text.muted}>Errors</Text>
              <Text color={errorCount > 0 ? theme.status.error : theme.text.secondary}>
                {errorCount}
              </Text>
            </Box>
            <Box flexDirection="column">
              <Text color={theme.text.muted}>Warnings</Text>
              <Text color={warningCount > 0 ? theme.status.warning : theme.text.secondary}>
                {warningCount}
              </Text>
            </Box>
          </Box>

          <Box flexDirection="column" alignItems="flex-end">
            <Text color={theme.text.muted}>Last Alert</Text>
            <Text color={theme.text.secondary}>
              {alerts.length > 0 ? formatTime(sortedAlerts[0].triggeredAt) : 'None'}
            </Text>
          </Box>
        </Box>

        {budgetStats && (
          <Box
            paddingX={2}
            paddingY={1}
            borderStyle="single"
            borderColor={budgetStats.usagePercentage > 90 ? theme.status.error : theme.text.muted}
          >
            <Text color={theme.text.secondary}>
              Current Status: {budgetStats.requestCount}/{budgetStats.dailyLimit} requests
              ({formatPercentage(budgetStats.usagePercentage)}) •{' '}
              {budgetStats.remainingRequests} remaining • Reset in {budgetStats.timeUntilReset}
            </Text>
          </Box>
        )}
      </Box>
    );
  };

  /**
   * Renders the list of active alerts.
   */
  const renderAlertsList = () => {
    if (sortedAlerts.length === 0) {
      return (
        <Box
          flexGrow={1}
          justifyContent="center"
          alignItems="center"
          borderStyle="single"
          paddingY={3}
        >
          <Text color={theme.status.success}>
            ✅ No active alerts - Budget usage is within limits
          </Text>
        </Box>
      );
    }

    return (
      <Box flexDirection="column" flexGrow={1}>
        <Text color={theme.text.muted} marginBottom={1}>
          Active Alerts ({sortedAlerts.length}):
        </Text>

        {sortedAlerts.map((alert, index) => (
          <Box
            key={alert.id}
            flexDirection="column"
            paddingX={2}
            paddingY={1}
            borderStyle="single"
            borderColor={
              index === selectedAlertIndex
                ? getSeverityColor(alert.severity)
                : theme.text.muted
            }
            marginBottom={1}
            backgroundColor={
              index === selectedAlertIndex
                ? theme.primary.light
                : undefined
            }
          >
            {/* Alert header */}
            <Box justifyContent="space-between" alignItems="center" marginBottom={1}>
              <Box gap={1} alignItems="center">
                <Text>{getSeverityIcon(alert.severity)}</Text>
                <Text>{getTypeIcon(alert.type)}</Text>
                <Text color={getSeverityColor(alert.severity)} bold>
                  {alert.title}
                </Text>
              </Box>
              <Text color={theme.text.muted}>
                {formatTime(alert.triggeredAt)}
              </Text>
            </Box>

            {/* Alert message */}
            <Text color={theme.text.secondary} marginBottom={1}>
              {alert.message}
            </Text>

            {/* Alert details */}
            <Box justifyContent="space-between" marginBottom={1}>
              <Box gap={3}>
                <Text color={theme.text.muted}>
                  Threshold: {alert.threshold}
                </Text>
                <Text color={theme.text.muted}>
                  Current: {alert.currentValue}
                </Text>
                <Text color={getSeverityColor(alert.severity)}>
                  Severity: {alert.severity}
                </Text>
              </Box>
              {index === selectedAlertIndex && (
                <Text color={theme.text.muted}>
                  Press Enter to dismiss
                </Text>
              )}
            </Box>

            {/* Suggested actions (show for selected alert) */}
            {index === selectedAlertIndex && alert.suggestedActions.length > 0 && (
              <Box flexDirection="column" marginTop={1}>
                <Text color={theme.text.muted}>Suggested Actions:</Text>
                {alert.suggestedActions.map((action, actionIndex) => (
                  <Text key={actionIndex} color={theme.text.secondary} marginTop={1}>
                    • {action}
                  </Text>
                ))}
              </Box>
            )}
          </Box>
        ))}
      </Box>
    );
  };

  /**
   * Renders alert threshold configuration.
   */
  const renderThresholdConfig = () => {
    const currentThresholds = [75, 90, 95]; // Default thresholds

    return (
      <Box flexDirection="column" marginTop={2}>
        <Text color={theme.text.muted} marginBottom={1}>
          Alert Thresholds:
        </Text>

        <Box gap={4} marginBottom={1}>
          {currentThresholds.map((threshold, index) => (
            <Box key={index} alignItems="center" gap={1}>
              <Text color={theme.status.warning}>
                {threshold}%
              </Text>
              <Text color={theme.text.muted}>
                {index === 0 ? 'Warning' : index === 1 ? 'Error' : 'Critical'}
              </Text>
            </Box>
          ))}
        </Box>

        <Text color={theme.text.muted}>
          💡 Configure custom thresholds in dashboard settings
        </Text>
      </Box>
    );
  };

  /**
   * Renders alert statistics.
   */
  const renderAlertStats = () => {
    const todaysAlerts = alerts.filter(alert => {
      const today = new Date();
      const alertDate = new Date(alert.triggeredAt);
      return (
        alertDate.getDate() === today.getDate() &&
        alertDate.getMonth() === today.getMonth() &&
        alertDate.getFullYear() === today.getFullYear()
      );
    });

    const recentAlerts = alerts.filter(alert => {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      return alert.triggeredAt > oneHourAgo;
    });

    return (
      <Box flexDirection="column" marginTop={2}>
        <Text color={theme.text.muted} marginBottom={1}>
          Alert Statistics:
        </Text>

        <Box gap={4}>
          <Box flexDirection="column">
            <Text color={theme.text.muted}>Today</Text>
            <Text color={theme.text.primary}>{todaysAlerts.length}</Text>
          </Box>
          <Box flexDirection="column">
            <Text color={theme.text.muted}>Last Hour</Text>
            <Text color={theme.text.primary}>{recentAlerts.length}</Text>
          </Box>
          <Box flexDirection="column">
            <Text color={theme.text.muted}>Total</Text>
            <Text color={theme.text.primary}>{alerts.length}</Text>
          </Box>
        </Box>
      </Box>
    );
  };

  /**
   * Renders the footer with keyboard shortcuts.
   */
  const renderFooter = () => (
    <Box
      justifyContent="space-between"
      marginTop={2}
      paddingTop={1}
      borderStyle="single"
      borderTop
    >
      <Box gap={4}>
        <Text color={theme.text.muted}>
          ↑↓/jk: Navigate
        </Text>
        <Text color={theme.text.muted}>
          Enter/Space: Dismiss
        </Text>
        <Text color={theme.text.muted}>
          d: Toggle dismissed
        </Text>
      </Box>
      <Text color={theme.text.muted}>
        {sortedAlerts.length > 0 ? `${selectedAlertIndex + 1}/${sortedAlerts.length}` : 'No alerts'}
      </Text>
    </Box>
  );

  // Render the complete alerts panel
  return (
    <Box flexDirection="column" minHeight={20}>
      {renderAlertsHeader()}
      {renderAlertsList()}
      {alerts.length > 0 && renderThresholdConfig()}
      {alerts.length > 0 && renderAlertStats()}
      {renderFooter()}
    </Box>
  );
};